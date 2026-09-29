// Hunting: animals live on the map by day, flee, and die to a sling / bow shot (key F).
// Stage 3 (batch D2, Hunting on the core and split in four): the files in the page; what a shot tells the bus ("shot").
const { launch, sleep } = require("./cdp.js");
// REGISTERED=1: Hunting_Path, Hunting_AI and Hunting_Weapons put into the page's plugin list right under Hunting (js/plugins.js itself
// is not touched); js/plugins.js lists them there too now, so both runs have the same order - with it the test also checks that order
const PARTS = ["Hunting_Path", "Hunting_AI", "Hunting_Weapons"];
const REGISTERED = process.env.REGISTERED ? `(function(){
    let real;
    const mk = name => ({ name, status: true, description: "", parameters: {} });
    Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) {
        const list = v.filter(p => !${JSON.stringify(PARTS)}.includes(p.name)), at = list.findIndex(p => p.name === "Hunting");
        list.splice(at + 1, 0, ...${JSON.stringify(PARTS)}.map(mk));
        real = list;
    } });
})();` : null;
const fs = require("fs");
const OUT = __dirname + "/hunt/";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
    const b = await launch({ width: 2560, height: 1440, dpr: 0.5 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        if (REGISTERED) await b.send("Page.addScriptToEvaluateOnNewDocument", { source: REGISTERED });
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Hunting && Hunting.RAID) Hunting.RAID.perHour = 0; if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(10); $gameSystem.setStamina(100); 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
        const give = (id, n) => ev(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`);
        const take = (id, n) => ev(`$gameParty.loseItem($dataItems[${id}], ${n}, true); 0`);
        const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        await ev("window.__popups = []; const _pp = $gameTemp.pushLootPopup; $gameTemp.pushLootPopup = function(i, t, c) { window.__popups.push({ icon: i, text: t, color: c }); return _pp.apply(this, arguments); }; 0");
        const popups = () => ev("window.__popups.map(p => p.text)");
        const clearPopups = () => ev("window.__popups.length = 0; 0");

        // ================= 1. assets and data =================
        const sheets = await ev(`new Promise(res => { const names = ["$Animal_Rabbit", "$Animal_Deer"], out = {}; let left = names.length; for (const n of names) { const bmp = ImageManager.loadCharacter(n); bmp.addLoadListener(() => { out[n] = [bmp.width, bmp.height]; if (--left === 0) res(out); }); } })`);
        check("the animal sheets load (3 columns x 4 rows of frames)", sheets["$Animal_Rabbit"][0] % 3 === 0 && sheets["$Animal_Rabbit"][1] % 4 === 0 && sheets["$Animal_Deer"][0] % 3 === 0 && sheets["$Animal_Deer"][1] % 4 === 0, sheets);
        check("the shot is O in the combat mode (Combat.js: O has its own name, Tab switches the mode)", (await ev("Input.keyMapper[79]")) === "keyO" && (await ev("Input.keyMapper[9]")) === "tab");
        const fam = JSON.parse(await ev(`JSON.stringify({ parts: Object.keys(Tawerna.api("Hunting_parts") || {}), scripts: ["Hunting", "Hunting_Path", "Hunting_AI", "Hunting_Weapons"].map(n => document.querySelectorAll('script[src$="/' + n + '.js"]').length),
            order: $plugins.map(p => p.name).filter(n => /^(Spoilage|Hunting|Hunting_Path|Hunting_AI|Hunting_Weapons|Birds)$/.test(n)), api: Tawerna.api("Hunting") === Hunting })`));
        check("Hunting in four files (the data and the hooks, the way, the animals, the weapons and the prey), each in the page once" + (REGISTERED ? " - registered: " + fam.order.join(", ") : " - the parts put in by Hunting.js"),
            fam.api && fam.parts.join() === "core,path,ai,weapons" && fam.scripts.join() === "1,1,1,1" && (!REGISTERED || fam.order.join() === "Spoilage,Hunting,Hunting_Path,Hunting_AI,Hunting_Weapons,Birds"), fam);
        const targets = await ev("Hunting.mapTargets()");
        check("Map003 is a hunting ground with 3 rabbits", targets.rabbit === 3 && !targets.deer, targets);

        // ================= 2. animals live on the map by day =================
        await frames(240);
        const day = await ev("Hunting.animals.map(a => a.kind())");
        check("by day 3 rabbits graze on the meadow", day.length === 3 && day.every(k => k === "rabbit"), day);
        check("they are drawn (sprites in the tilemap) and are not map events", await ev("Hunting.animals.every(a => !!a._sprite && !!a._sprite.parent) && !$gameMap.events().some(e => e.isAnimal)"));
        const okPos = await ev("Hunting.animals.every(a => Math.hypot(a._x - $gamePlayer.x, a._y - $gamePlayer.y) >= 6)");
        check("none spawned right next to the player", okPos === true);
        await ev("$gameSystem.setDayNightHour(23.5); 0");
        await frames(200);
        check("at night the rabbits are gone (burrowed; only a wolf pack may be out)", (await ev("Hunting.animals.filter(a => a.kind() !== 'wolf').length")) === 0);
        await ev("$gameSystem.setDayNightHour(8); 0");
        await frames(200);
        check("and they are back in the morning (the 3 rabbits; at dawn the boar may be out too)", (await ev("Hunting.animals.filter(a => a.kind() === 'rabbit').length")) === 3);
        check("deer are not out at noon (only dawn and dusk)", await ev(`(function(){ $gameSystem.setDayNightHour(13); return Hunting.SPECIES.deer.hours.every(([a, c]) => 13 < a || 13 >= c); })()`));
        await ev("$gameSystem.setDayNightHour(10); 0");

        await ev("Hunting.auto(false); Hunting.animate(false); 0");   // the shot leaves at once (the shooting animation has its own test)
        // ================= 3. flee =================
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");
        const room = await ev(`(function(){
            for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 6; x < $gameMap.width() - 14; x++) {
                let ok = true;
                for (let dx = 0; dx < 12 && ok; dx++) for (let dy = -2; dy <= 2; dy++) { if (!$gameMap.checkPassage(x + dx, y + dy, 0x0f) || $gameMap.eventsXy(x + dx, y + dy).length > 0 || Farming.hasObjectTile(x + dx, y + dy)) { ok = false; break; } }
                if (ok) return { x, y };
            }
            return null; })()`);
        check("found a straight open lane of 12 tiles", !!room, room);
        const { x: lx, y: ly } = room;
        const standAt = (x, y, d) => ev(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d}); $gameMap.setDisplayPos(${x} - 6, ${y} - 7); $gameSystem.setStamina(100); 0`);
        await standAt(lx, ly, 6);
        const fl = await ev(`(function(){ const a = Hunting.spawn("rabbit", ${lx + 3}, ${ly}); a._wait = 9999; return a._x; })()`);   // (no wandering off before it notices)
        await frames(8);
        const d0 = await ev("Hunting.animals[0]._realX - $gamePlayer._realX");
        const aware0 = await ev("Hunting.animals[0]._aware");
        await frames(220);   // (it first notices the player - "?", "!" - then runs)
        const d1 = await ev("Hunting.animals[0]._realX - $gamePlayer._realX");
        check("a rabbit 3 tiles away notices the player, then runs off (the distance grows)", aware0 > 0 && d1 > d0 + 2, { aware0, d0, d1 });
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");

        // ================= 4. no weapon, no ammunition =================
        await standAt(lx, ly, 6);
        await clearPopups();
        await ev("Hunting.shoot()");
        check("without a weapon: popup 'Potrzebujesz procy, łuku albo oszczepu' (icon + short text)", (await popups()).includes("Potrzebujesz procy, łuku albo oszczepu"), await popups());
        await give(125, 1);
        await clearPopups();
        await ev("Hunting.shoot()");
        check("a sling but no stones: 'Potrzebujesz kamieni'", (await popups()).includes("Potrzebujesz kamieni"), await popups());
        await give(126, 1);
        await clearPopups();
        await ev("Hunting.shoot()");
        check("a bow but no arrows and no stones: 'Potrzebujesz strzał'", (await popups()).includes("Potrzebujesz strzał"), await popups());

        // ================= 5. the sling kills a rabbit =================
        await ev("window.__shots = []; Tawerna.on('shot', e => window.__shots.push({ weapon: e.weapon, hit: e.hit, kind: e.kind }), { owner: 'HuntingTest' }); 0");
        await ev("window.__kills = []; Tawerna.on('kill', e => window.__kills.push({ kind: e.kind, by: e.by, how: e.how, mapId: e.mapId, x: +e.x.toFixed(1), y: +e.y.toFixed(1), animal: !!e.animal }), { owner: 'HuntingTest' }); 0");
        await give(64, 5);
        const spawnFrozen = (kind, dx) => ev(`(function(){ const a = Hunting.spawn("${kind}", ${lx} + ${dx}, ${ly}); a._frozen = true; return a._x; })()`);
        await spawnFrozen("rabbit", 4);
        const st0 = await ev("$gameSystem.stamina()");
        const car0 = await ev("Hunting.carcasses().length");
        await frames(30);
        await press("shoot");
        await frames(44);   // F starts aiming: the stone leaves after the whirl (Hunting.WEAPONS.sling.release)
        const flying = await ev("Hunting.projectiles.length");
        check("F fires: a stone flew (or already hit), one stone and 2 stamina are spent", (flying === 1 || (await ev("Hunting.carcasses().length")) === car0 + 1) && (await count(64)) === 4 && (await ev("$gameSystem.stamina()")) === st0 - 2, { flying });
        await frames(40);
        check("the stone kills the rabbit: gone from the map, its carcass lies there, the hunt is counted", (await ev("Hunting.animals.length")) === 0 && (await ev("Hunting.carcasses().length")) === car0 + 1 && (await ev("Hunting.hunt().kills.rabbit")) === 1, { animals: await ev("Hunting.animals.length"), carcasses: await ev("Hunting.carcasses().length") });
        const kills = JSON.parse(await ev("JSON.stringify(window.__kills)"));
        check("...and Hunting tells it on the Tawerna bus: 'kill' { kind: rabbit, by: hero, how: shot, mapId: 3, x, y, animal }", kills.length === 1 && kills[0].kind === "rabbit" && kills[0].by === "hero" && kills[0].how === "shot" && kills[0].mapId === 3 && kills[0].x > 0 && kills[0].animal, kills);
        check("the weapon wears by one shot", (await ev("Durability.used(125)")) === 1);
        // range: 6 tiles for the sling, the rabbit at 8 is out of reach
        await spawnFrozen("rabbit", 8);
        await frames(30);
        await press("shoot");
        await frames(100);
        check("the sling does not reach 8 tiles (the rabbit stays, a stone is lost)", (await ev("Hunting.animals.length")) === 1 && (await count(64)) === 3, { n: await ev("Hunting.animals.length"), stones: await count(64) });
        const shots = JSON.parse(await ev("JSON.stringify(window.__shots)"));
        check("...and each stone's flight tells the bus 'shot' { weapon, hit, kind }: the rabbit hit, then a miss", shots.length === 2 && shots[0].weapon === "sling" && shots[0].hit === true && shots[0].kind === "rabbit" &&
            shots[1].weapon === "sling" && shots[1].hit === false && shots[1].kind === "", shots);
        // the bow has range 9 and the arrows are used first
        await give(127, 3);
        await frames(30);
        await press("shoot");
        await frames(100);
        check("the bow (arrows first) reaches 8 tiles and kills it; one arrow used", (await ev("Hunting.animals.length")) === 0 && (await count(127)) === 2 && (await count(64)) === 3 && (await ev("Hunting.hunt().kills.rabbit")) === 2, { arrows: await count(127) });
        check("what was shot today does not come back before dawn (2 of 3 killed on Map003)", (await ev("Hunting.killedToday(3, 'rabbit')")) === 2);
        await ev("Hunting.populate(); 0"); await frames(20);
        check("the map is refilled only up to what remains (1 rabbit)", (await ev("Hunting.animals.length")) === 1, await ev("Hunting.animals.length"));
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");

        // ================= 6. a deer: 3 life =================
        await ev("$gameParty.loseItem($dataItems[126], 1, true); 0");   // only the sling now
        await give(64, 5);
        await spawnFrozen("deer", 5);
        await clearPopups();
        const carD = await ev("Hunting.carcasses().length");
        const deerMax = await ev("Hunting.animals[0]._maxHp");   // (combat life: 40 at level 1, more with the place's level)
        const hits = [];
        for (let i = 0; i < 8; i++) {
            const before = await ev("Hunting.animals.length");
            if (before === 0) break;
            await frames(30);
            await press("shoot");
            await frames(90);
            hits.push(await ev("Hunting.animals.length ? Hunting.animals[0]._hp : 0"));
            if (hits[hits.length - 1] === 0) break;
            await ev("if (Hunting.animals[0]) { Hunting.animals[0]._frozen = true; Hunting.animals[0]._wounded = false; Hunting.animals[0]._alarm = 0; } 0");   // stand still for the next test shot
        }
        const slingHit = deerMax - hits[0];
        check("the sling takes the same bite off a deer each hit until it is dead (40+ life: 3-4 stones), the wounded one is announced (a popup; with Combat.js its life bar instead)",
            slingHit > 0 && hits[hits.length - 1] === 0 && hits.length === Math.ceil(deerMax / slingHit) && hits.length >= 3 && ((await ev("!!window.Combat")) || (await popups()).some(t => /Jeleń ranny/.test(t))), { deerMax, hits });
        check("the deer lies there (its carcass)", (await ev("Hunting.carcasses().length")) === carD + 1 && (await ev("Hunting.carcasses().slice(-1)[0].kind")) === "deer", { carD, now: await ev("Hunting.carcasses().length") });
        // the bow: two arrows for a deer
        await give(126, 1);
        await spawnFrozen("deer", 6);
        const car1 = await ev("Hunting.carcasses().length");
        for (let i = 0; i < 2; i++) { await frames(35); await press("shoot"); await frames(100); if (await ev("Hunting.animals.length ? (Hunting.animals[0]._frozen = true, Hunting.animals[0]._wounded = false, Hunting.animals[0]._alarm = 0, 0) : 0")) { } }
        check("the bow needs only 2 hits for a deer", (await ev("Hunting.animals.length")) === 0 && (await ev("Hunting.carcasses().length")) === car1 + 1, { car1, now: await ev("Hunting.carcasses().length") });
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");

        // ================= 7. walls stop a shot, the noise scares the others =================
        await give(64, 3);
        await spawnFrozen("rabbit", 3);
        const near = await ev(`(function(){ const a = Hunting.spawn("rabbit", ${lx} + 5, ${ly} + 1); a._frozen = true; a._x = a._realX = ${lx} + 5; return a._alarm; })()`);
        await frames(30);
        await ev("Hunting.animals.find(a => a._x === " + lx + " + 3)._frozen = true; 0");
        await press("shoot");
        await frames(60);
        const scared = await ev("Hunting.animals.map(a => a._alarm)");
        check("a shot scares the animals within 7 tiles (alarm set on the survivor)", scared.length === 1 && scared[0] > 0, scared);
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");

        // ================= 8. diagonals and the picture =================
        await give(64, 2);
        await standAt(lx + 6, ly, 6);
        await ev(`(function(){ const a = Hunting.spawn("deer", ${lx} + 8, ${ly} - 1); a._frozen = true; a.setDirection(4); const r = Hunting.spawn("rabbit", ${lx} + 10, ${ly} + 1); r._frozen = true; r.setDirection(4); })()`);
        await frames(30);
        await b.shot(OUT + "animals_deer_rabbit.png");
        // an arrow in flight, the scene frozen for the picture
        await give(127, 2);
        await ev("Hunting.shoot([1, 0], 'bow'); 0");
        await frames(7);
        await ev("window.__upd = SceneManager._scene.update; SceneManager._scene.update = function() {}; 0");
        await b.shot(OUT + "arrow_in_flight.png");
        await ev("SceneManager._scene.update = window.__upd; 0");

        // ================= 9. the animals must survive a trip to another scene (menu, journal, the day summary) =================
        await ev("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0");
        await standAt(lx + 6, ly, 6);
        await ev(`(function(){ for (const [k, dx] of [["rabbit", 2], ["rabbit", 4], ["deer", 3]]) { const a = Hunting.spawn(k, ${lx} + ${lx === 0 ? 0 : 0} + dx + 5, ${ly} + (dx % 2 ? 1 : -1)); a._frozen = true; } })()`);
        await frames(20);
        const seen = () => ev(`(function(){ const t = SceneManager._scene._spriteset && SceneManager._scene._spriteset._tilemap; return Hunting.animals.length + ":" + Hunting.animals.filter(a => a._sprite && !a._sprite._destroyed && a._sprite.parent === t).length; })()`);
        check("three animals stand on the map, each with a picture in the tilemap", (await seen()) === "3:3", await seen());
        for (const [label, expr] of [["the main menu", "Scene_Menu"], ["the journal", "Journal.Scene_Journal"]]) {
            await ev(`SceneManager.push(${expr}); 0`);
            await frames(40);
            await ev("SceneManager.pop(); 0");
            await frames(60);
            check("after " + label + " the animals are still there AND still drawn", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && (await seen()) === "3:3", await seen());
        }
        // the real thing: a night in the tent ends with the day summary
        await ev(`(function(){ const f = $gameSystem._farm; const L = f.buildings[3] = f.buildings[3] || []; f.plots[3] = f.plots[3] || {}; L.push({ id: f.nextId++, type: "tent", x: ${lx} + 1, y: ${ly} + 3, last: 1 }); f.plots[3][(${lx} + 1) + "," + (${ly} + 3)] = { s: "cleared" }; f.plots[3][(${lx} + 2) + "," + (${ly} + 3)] = { s: "cleared" }; f.rev++; Journal.evaluateGoals(); $gameSystem.setDayNightHour(22); $gameSystem.setStamina(20); })()`);
        await ev(`Farming.sleepInTent(Farming.buildingAt(${lx} + 1, ${ly} + 3)); 0`);
        await frames(200);
        let sawSummary = false;
        for (let k = 0; k < 14; k++) {
            const scene = await ev("SceneManager._scene.constructor.name");
            if (scene === "Scene_DaySummary") sawSummary = true;
            if (scene === "Scene_Map" && !(await ev("$gameMessage.isBusy()")) && !(await ev("!!$gameTemp._pendingSummary"))) break;
            await press("ok"); await frames(20);
        }
        await frames(60);
        check("the day summary was shown after the night", sawSummary === true);
        check("...and afterwards the animals are still there and drawn (they do not vanish with the summary)", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && (await seen()) === "3:3", await seen());
        await b.shot(OUT + "animals_after_summary.png");
        console.log("console errors:", JSON.stringify(b.logs.filter(l => /EXC|rror/.test(l)).slice(-4)));
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
