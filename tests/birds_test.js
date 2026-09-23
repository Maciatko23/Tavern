// Birds (Birds.js) and the hunting additions of Hunting.js: sneaking (C), awareness ("?" / "!"), aiming with F held (a shrinking
// circle), birds landing, pecking, fleeing, being shot (drops), raids eating crops, the scarecrow, raids while away, plucking.
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => b.evaluate(e);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); Hunting.auto(false); Birds.auto(false); if (window.Livestock) Livestock.auto(false); $gameSystem.setDayNightHour(11); $gameSystem._stormForce = { day: $gameSystem.dayNightDay(), off: true }; 0");
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const press = async (k, hold = 3) => { await ev(`Input._currentState.${k} = true; 0`); await frames(hold); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
        await ev(`(function(){ window.__pop = []; const _q = Game_Temp.prototype.pushLootPopup; Game_Temp.prototype.pushLootPopup = function(icon, text) { window.__pop.push(text); return _q.apply(this, arguments); }; })(); 0`);

        // ---------------------------------------------------------------- data and assets
        check("items: 145 Ptak (plucked with a knife), 146 Pióra", await ev("$dataItems[145].name === 'Ptak' && /Butcher:bird/.test($dataItems[145].note) && $dataItems[146].name === 'Pióra'"));
        check("four species with their sheets", (await J("Object.keys(Birds.SPECIES)")).join() === "crow,sparrow,pigeon,partridge");
        const sheets = await ev(`Promise.all(Object.values(Birds.SPECIES).map(s => new Promise(r => { const bm = ImageManager.loadSystem(s.sheet); bm.addLoadListener(() => r(bm.width + "x" + bm.height)); })))`);
        check("each bird sheet is 7 cells of 32x32 (4 poses + 3 in-betweens of the peck)", sheets.every(s => s === "224x32"), sheets);
        check("the workbench makes arrows with feathers (12 at once)", await ev("(Farming.BUILDINGS.workbench.recipes.find(r => r.id === 'arrows_feather') || {}).output[1] === 12"));

        // an open, flat stretch: the player at (px, py) facing right
        const S = await J(`(function(){ for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 3; x < $gameMap.width() - 14; x++) { let ok = true;
            for (let dx = 0; dx < 12 && ok; dx++) for (let dy = -1; dy <= 1 && ok; dy++) { const tx = x + dx, ty = y + dy; if (!$gameMap.isPassable(tx, ty, 6) || !$gameMap.isPassable(tx, ty, 4) || $gameMap.eventsXy(tx, ty).length || Farming.buildingAt(tx, ty) || Farming.hasObjectTile(tx, ty)) ok = false; }
            if (ok) return { x, y }; } return null; })()`);
        check("(setup) an open stretch of 12 tiles", !!S, S);
        const place = (x, y, d) => ev(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${d || 6}); $gameMap.setDisplayPos(${x} - 6, ${y} - 7); 0`);

        // ---------------------------------------------------------------- sneaking
        await place(S.x, S.y);
        await frames(10);
        const speed0 = await ev("$gamePlayer.realMoveSpeed()");
        await press("sneak");
        const sn = await J("({ on: Hunting.sneaking(), sheet: $gamePlayer.characterName(), speed: $gamePlayer.realMoveSpeed(), badge: SceneManager._scene._sneakBadge.visible })");
        check("C: sneaking on - the crouched sheet, half the speed, the badge", sn.on && sn.sheet === "$Reid_Poor_Sneak" && sn.speed === speed0 - 1 && sn.badge, { speed0, sn });
        await frames(20);
        await b.shot(OUT + "birds_sneak.png");
        await press("sneak");
        check("C again: back to walking", !(await ev("Hunting.sneaking()")) && (await ev("$gamePlayer.characterName()")) === "$Reid_Poor");

        // ---------------------------------------------------------------- awareness: walking up to a rabbit, then sneaking up to it
        const approach = async sneak => {
            await ev(`Hunting.animals.slice().forEach(a => Hunting.removeAnimal(a)); $gameSystem._sneak = ${sneak}; 0`);
            await place(S.x, S.y);
            await ev(`window.__r = Hunting.spawn("rabbit", ${S.x + 11}, ${S.y}); window.__r._frozen = true; 0`);
            await frames(30);
            await ev("Input._currentState.right = true; 0");
            let at = null;
            for (let i = 0; i < 400; i++) {
                await frames(4);
                const s = await J("({ a: window.__r._aware, d: Math.abs(window.__r._realX - $gamePlayer._realX) })");
                if (s.a >= 1) { at = s.d; break; }
                if (s.d < 1.2) { at = s.d; break; }
            }
            await ev("Input._currentState.right = false; 0");
            return at;
        };
        const walkDist = await approach(false);
        const sneakDist = await approach(true);
        check("walking up, the rabbit is alarmed 3+ tiles away; sneaking you get much closer", walkDist !== null && walkDist > 3 && sneakDist !== null && sneakDist < walkDist - 1.5, { walkDist, sneakDist });
        await ev("$gameSystem._sneak = false; 0");
        // the marks: "?" then "!"
        await ev(`Hunting.animals.slice().forEach(a => Hunting.removeAnimal(a)); window.__r = Hunting.spawn("rabbit", ${S.x + 4}, ${S.y}); window.__r._frozen = true; window.__r._aware = 0.5; 0`);
        await place(S.x, S.y);
        await frames(6);
        const mark = await J("(function(){ const m = window.__r._markSprite; return m ? { vis: m.visible, w: m.bitmap && m.bitmap.width } : null; })()");
        check("a creature that has noticed something shows a mark over its head", !!mark && mark.vis, mark);

        // ---------------------------------------------------------------- aiming (F held): the circle shrinks, the shot flies into it
        await ev(`Hunting.animals.slice().forEach(a => Hunting.removeAnimal(a)); Hunting.animate(false); $gameParty.gainItem($dataItems[125], 1); $gameParty.gainItem($dataItems[64], 20); $gameSystem.setStamina(100); 0`);
        await place(S.x, S.y);
        await ev(`window.__r = Hunting.spawn("rabbit", ${S.x + 4}, ${S.y}); window.__r._frozen = true; window.__r._aware = 0; 0`);
        await frames(10);
        await ev("Input._currentState.shoot = true; 0");
        await frames(4);
        const a0 = await J("({ r: Hunting.aim && Hunting.aim.radius, target: !!(Hunting.aim && Hunting.aim.ref === window.__r), reticle: SceneManager._scene._spriteset._aimReticle.visible })");
        await frames(80);
        const a1 = await J("({ r: Hunting.aim && Hunting.aim.radius })");
        await b.shot(OUT + "birds_aim.png");
        check("holding F: the circle sits on the rabbit and shrinks (wide at first, small after a second)", a0.target && a0.reticle && a0.r > 0.9 && a1.r < 0.2, { a0, a1 });
        const carcass0 = await ev("$gameParty.numItems($dataItems[101])");
        await ev("Input._currentState.shoot = false; 0");
        await frames(60);
        check("let go: the stone flies into the circle and the rabbit falls", (await ev("$gameParty.numItems($dataItems[101])")) === carcass0 + 1 && !(await ev("Hunting.aim")));

        // ---------------------------------------------------------------- birds on the ground
        await place(S.x, S.y);
        await ev("$gameSystem._sneak = true; 0");   // (crouched and still, they let him watch from 4 tiles)
        await ev(`Birds.reset(); window.__f = Birds.startGrounded("pigeon", { x: ${S.x + 4}, y: ${S.y} }); 0`);   // within the sling's 6 tiles
        for (let i = 0; i < 60 && (await ev("window.__f.birds.some(b => b.state !== 'ground')")); i++) await frames(10);
        const landed = await J("({ n: window.__f.birds.length, ground: window.__f.birds.every(b => b.state === 'ground'), sprites: window.__f.birds.every(b => b.sprite && b.sprite.parent), near: window.__f.birds.every(b => Math.abs(b.x - " + (S.x + 4.5) + ") < 3) })");
        check("a flock of pigeons flies in and lands near its patch, each with its sprite", landed.n >= 3 && landed.ground && landed.sprites && landed.near, landed);
        await frames(120);
        await b.shot(OUT + "birds_ground.png");
        const pecking = await ev("window.__f.birds.some(b => b.act === 'peck' || b.act === 'hop')");
        check("on the ground they peck and hop about", pecking);
        // a straight shot at one of them: it falls (a bird), the rest take off
        const bird0 = await ev("$gameParty.numItems($dataItems[145])");
        // the nearest pigeon, standing still for the shot
        const tb = await J("(function(){ const b = window.__f.birds.slice().sort((p, q) => p.x - q.x)[0]; b.act = 'idle'; b.actT = 9999; b.z = 0; return { x: b.x, y: b.y - 0.25 }; })()");
        await ev(`(function(){ const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.3, dx = ${tb.x} - px, dy = ${tb.y} - py, l = Math.hypot(dx, dy); window.__f.birds.forEach(b => { b._aware = 0; }); Hunting.shoot([dx / l, dy / l], "sling"); })(); 0`);
        await frames(40);
        const shot = await J(`({ birds: $gameParty.numItems($dataItems[145]) - ${bird0}, leaving: !!window.__f.leaving, kills: Birds.store().kills.pigeon || 0 })`);
        check("a stone hits a pigeon: +1 Ptak, the flock takes off", shot.birds === 1 && shot.leaving && shot.kills === 1, shot);
        await ev("$gameSystem._sneak = false; 0");
        await frames(20);
        await b.shot(OUT + "birds_takeoff.png");
        // walking straight at a flock scares it; sneaking you can get close
        const scareDist = async sneak => {
            await ev(`Birds.reset(); $gameSystem._sneak = ${sneak}; 0`);
            await place(S.x, S.y);
            await ev(`window.__f = Birds.startGrounded("crow", { x: ${S.x + 10}, y: ${S.y} }); 0`);
            for (let i = 0; i < 80 && (await ev("window.__f.birds.some(b => b.state !== 'ground')")); i++) await frames(10);
            await ev("Input._currentState.right = true; 0");
            let d = null;
            for (let i = 0; i < 400; i++) {
                await frames(4);
                const s = await J("({ gone: !!window.__f.leaving, d: Math.min(...window.__f.birds.map(b => Math.abs(b.x - $gamePlayer._realX - 0.5))) })");
                if (s.gone) { d = s.d; break; }
            }
            await ev("Input._currentState.right = false; 0");
            return d;
        };
        const crowWalk = await scareDist(false), crowSneak = await scareDist(true);
        check("crows fly off far away when you walk at them, sneaking gets you closer", crowWalk !== null && crowWalk > 4 && crowSneak !== null && crowSneak < crowWalk - 1.5, { crowWalk, crowSneak });
        await ev("$gameSystem._sneak = false; Birds.reset(); 0");

        // ---------------------------------------------------------------- a raid on the fields, the scarecrow
        const field = { x: S.x + 3, y: S.y - 1 };
        await ev(`(function(){ const f = $gameSystem._farm, P = f.plots[3] = f.plots[3] || {}; for (let i = 0; i < 4; i++) P[(${field.x} + i) + "," + ${field.y}] = { s: "tilled", crop: "carrot", day: $gameSystem.dayNightDay() - 2 }; f.rev++; })(); 0`);
        // the player well away (crows do not come down next to a person), the view on the field
        await ev(`$gamePlayer.locate(${field.x}, ${field.y + 12}); $gameMap.setDisplayPos(${field.x} - 12, ${field.y} - 7); 0`);
        const open = await ev("Birds.openCrops(3).length");
        await ev(`window.__raid = Birds.startRaid({ kind: "crow", size: 3, hours: 1 }); 0`);
        let eaten = 0;
        for (let i = 0; i < 120; i++) {
            await frames(10);
            eaten = await ev(`[0,1,2,3].filter(i => !($gameSystem._farm.plots[3][(${field.x} + i) + "," + ${field.y}] || {}).crop).length`);
            if (eaten >= 1) break;
        }
        await b.shot(OUT + "birds_raid.png");
        check("a raid: crows land on the carrots and eat them whole (the plot stays ploughed)", open >= 4 && eaten >= 1 && (await ev(`$gameSystem._farm.plots[3][(${field.x}) + "," + ${field.y}].s`)) === "tilled", { open, eaten });
        await ev("Birds.reset(); 0");
        // a scarecrow guards everything within 3 tiles
        await ev(`(function(){ const f = $gameSystem._farm; (f.buildings[3] = f.buildings[3] || []).push({ id: f.nextId++, type: "scarecrow", x: ${field.x + 1}, y: ${field.y - 2}, last: 1, v: 3 }); f.rev++; })(); 0`);
        check("the scarecrow guards the field: no open crops for a raid", (await ev("Birds.openCrops(3).length")) === 0 && (await ev(`Birds.startRaid({ kind: "sparrow", size: 5, hours: 1 })`)) === null);
        await ev(`(function(){ const L = $gameSystem._farm.buildings[3]; L.splice(L.findIndex(b => b.type === "scarecrow" && b.x === ${field.x + 1}), 1); $gameSystem._farm.rev++; })(); 0`);

        // ---------------------------------------------------------------- raids while away: counted when you come back
        await ev(`(function(){ const f = $gameSystem._farm, P = f.plots[3]; for (let i = 0; i < 8; i++) P[(${field.x} + i) + "," + (${field.y} - 3)] = { s: "tilled", crop: "potato", day: $gameSystem.dayNightDay() - 1 }; f.rev++; })(); 0`);
        const before = await ev("Birds.openCrops(3).length");
        await ev("window.__pop = []; Birds.store().maps[3] = { upto: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() - 48 }; delete $gameSystem._stormForce; 0");
        const expected = await ev(`(function(){ const now = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(), from = now - 48; let n = 0;
            for (let d = Math.floor(from / 24); d <= Math.floor(now / 24); d++) for (const v of Birds.visitsOf(3, d)) { const s = d * 24 + v.start; if (s > from && s <= now) n++; } return n; })()`);
        await frames(70);
        const after = await ev("Birds.openCrops(3).length");
        const pops = await J("window.__pop.slice()");
        check("two days away: the planned raids ate plants, and a popup says how many", expected > 0 && after < before && pops.some(p => /Pod twoją nieobecność ptaki wyjadły \d+/.test(p)), { expected, before, after, pops });

        // ---------------------------------------------------------------- plucking a bird
        await ev("$gameParty.gainItem($dataItems[90], 1); 0");
        const f0 = await ev("$gameParty.numItems($dataItems[146])"), raw0 = await ev("$gameParty.numItems($dataItems[94])");
        await ev("$gameParty.leader().useItem($dataItems[145]); 0");
        const plucked = await J(`({ feathers: $gameParty.numItems($dataItems[146]) - ${f0}, raw: $gameParty.numItems($dataItems[94]) - ${raw0} })`);
        check("plucking a bird with a knife: 3 feathers and 1 raw meat", plucked.feathers === 3 && plucked.raw === 1, plucked);

        // ---------------------------------------------------------------- a flyover (screenshot)
        await ev("$gameSystem._stormForce = { day: $gameSystem.dayNightDay(), off: true }; Birds.reset(); Birds.startFlyover('crow'); Birds.startGrounded('partridge', { x: " + (S.x + 5) + ", y: " + (S.y + 1) + " }); 0");
        await frames(150);
        await b.shot(OUT + "birds_flyover.png");
        const fly = await J("Birds.flocks.map(f => ({ mode: f.mode, leaving: !!f.leaving, n: f.birds.length, b: f.birds.slice(0, 2).map(b => ({ z: Math.round(b.z), sz: b.sprite && b.sprite.z, sh: b.shadow && b.shadow.visible, x: +b.x.toFixed(1), tx: +b.tx.toFixed(1) })) }))");
        check("a flyover crosses high over the map (over everything), with shadows on the ground", fly.some(f => f.mode === "flyover" && f.b.some(b => b.z > 40 && b.sz === 9 && b.sh)), fly);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
