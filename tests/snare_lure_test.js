// Snares catch only with bait (Hunting.js + Farming.js): a calm rabbit smells the bait, hops up, sniffs and is caught (or takes fright,
// maybe with the bait); a caught rabbit sits in the snare until collected; the player scares them off; while nobody looks, only bait catches.
const { launch, sleep } = require("./cdp.js");
const OUT = __dirname + "/";
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const count = id => ev(`$gameParty.numItems($dataItems[${id}])`);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && window.Utils)").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`SceneManager._scene.startFadeIn(1,false); if (window.Dog) { Dog.auto(false); Dog.removeDog(); } if (window.Needs) Needs.setEnabled(false); if (window.Birds) Birds.auto(false); Hunting.auto(false); Survival.calmWeather();
            $gameSystem.setDayNightHour(11); $gameSystem.setStamina(100); window.__pop = []; const _q = Game_Temp.prototype.pushLootPopup;
            Game_Temp.prototype.pushLootPopup = function(icon, text) { window.__pop.push(text); return _q.apply(this, arguments); };
            for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); 0`);
        await frames(10);

        // a snare on open ground: a 2 x 1 spot with room around it (and a line of 10 free tiles to the right for the rabbit)
        // (stones and herbs lying about are fine - they block nothing; berry bushes and events do)
        const spot = await J(`(function(){ const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 2) && !$gameMap.eventsXy(x, y).length && !Farming.bushSolid(x, y) && !Farming.buildingAt(x, y);
            for (let y = 6; y < $gameMap.height() - 4; y++) for (let x = 3; x < $gameMap.width() - 14; x++) {
                if (!Farming.naturalFarmland(x, y) || !Farming.naturalFarmland(x + 1, y)) continue;
                let ok = true;
                for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 11 && ok; dx++) if (!free(x + dx, y + dy)) ok = false;
                if (ok) return { x, y };
            }
            return null; })()`);
        check("(setup) open ground for a snare with room for a rabbit beside it", !!spot, spot);
        const { x, y } = spot;
        await ev(`(function(){ const f = $gameSystem._farm; const P = f.plots[3] = f.plots[3] || {}; const B = f.buildings[3] = f.buildings[3] || [];
            B.push({ id: f.nextId++, type: "snare", x: ${x}, y: ${y}, last: $gameSystem.dayNightDay() }); P["${x},${y}"] = { s: "cleared" }; P["${x + 1},${y}"] = { s: "cleared" }; f.rev++; })()`);
        await frames(10);
        const snare = `Farming.buildingAt(${x}, ${y})`;
        check("the snare stands there, nothing in it yet", (await J(`({ ok: !!${snare}, ready: Farming.readyProduce(${snare}), caught: ${snare}.caught || 0 })`)).ready === 0);
        // the player far off (out of the rabbits' sight), the camera on the snare
        await ev(`$gamePlayer.locate(${x} + 5, ${y} - 12 < 1 ? ${y} + 12 : ${y} - 12); $gameMap.setDisplayPos(${x} - 12, ${y} - 7); $gamePlayer.center = () => {}; 0`);
        await frames(10);
        const rabbitAt = (rx, ry) => ev(`(function(){ const a = Hunting.spawn("rabbit", ${rx}, ${ry}); a._wait = 0; window.__r = a; return 1; })()`);
        const rabbit = () => J(`(function(){ const a = window.__r; return { x: a._x, y: a._y, dead: !!a._dead, sniff: a._sniff, cd: a._lureCd, aware: Math.round(a._aware * 100) / 100, fleeing: a._fleeing, on: Hunting.animals.includes(a) }; })()`);

        // ---------------------------------------------------------------- no bait: the snare draws nothing and catches nothing
        await ev(`Farming.BUILDINGS.snare.lure.chance = 1; 0`);
        await rabbitAt(x + 3, y);
        await frames(420);
        const idle = await rabbit();
        check("without bait no rabbit comes to the snare, not even one 2 tiles off, and nothing is caught", !idle.dead && idle.sniff === 0 && idle.cd === 0 && (await J(`${snare}.caught || 0`)) === 0, idle);
        await ev("Hunting.removeAnimal(window.__r); 0");
        await ev("$gameSystem.advanceDayNight(48); 0");
        await frames(90);
        check("...nor while nobody looks: two days later it is still empty (it no longer fills by itself)", (await ev(`Farming.readyProduce(${snare})`)) === 0);

        // ---------------------------------------------------------------- bait: the menu, the picture
        const menu0 = await J(`Farming.menuFor(${x}, ${y}).entries.map(e => ({ name: e.name, enabled: e.enabled !== false, help: e.help }))`);
        const baitRow0 = menu0.find(e => /przynęt/i.test(e.name)), collect0 = menu0.find(e => /^Zbierz/.test(e.name));
        check("the snare's menu has 'Załóż przynętę', disabled with no bait in the bag; the empty snare says bait is needed", !!baitRow0 && baitRow0.name === "Załóż przynętę" && !baitRow0.enabled && /przynęt/.test(collect0.help), menu0);
        await ev("$gameParty.gainItem($dataItems[72], 4); 0");   // carrots
        const row = await J(`(function(){ const e = Farming.menuFor(${x}, ${y}).entries.find(e => e.name === "Załóż przynętę"); return { enabled: e.enabled !== false, help: e.help }; })()`);
        check("with carrots it is enabled", row.enabled && /Marchew/.test(row.help), row);
        const layBait = async () => {
            await ev(`$gamePlayer.locate(${x}, ${y} + 1); 0`);   // (the crouch plays where the player stands)
            await ev(`Farming.menuFor(${x}, ${y}).entries.find(e => e.name === "Załóż przynętę").run(); 0`);
            await frames(90);
            await ev(`$gamePlayer.locate(${x} + 5, ${y} - 12 < 1 ? ${y} + 12 : ${y} - 12); 0`);
        };
        await layBait();
        const baited = await J(`({ bait: ${snare}.bait, carrots: $gameParty.numItems($dataItems[72]), pop: window.__pop.slice(-8) })`);   // (the carrots may finish journal goals: their popups and the XP come too)
        check("laid: one carrot used, the bait lies in the snare for a day", !!baited.bait && baited.bait.item === 72 && baited.carrots === 3 && baited.pop.some(p => /Przynęta w pułapce/.test(p)), baited);
        await frames(10);
        const shown = await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b === ${snare}); return { bait: !!(e && e.bait && e.bait.visible), rabbit: !!(e && e.caught && e.caught.visible) }; })()`);
        check("the carrot is drawn in the noose", shown.bait && !shown.rabbit, shown);
        const menu1 = await J(`Farming.menuFor(${x}, ${y}).entries.map(e => e.name)`);
        check("the menu now says what bait lies there", menu1.some(n => n === "Przynęta: Marchew"), menu1);

        // ---------------------------------------------------------------- a rabbit comes to the bait: frightened off (chance 0), then caught (chance 1)
        await ev(`Farming.BUILDINGS.snare.lure.chance = 0; 0`);
        await rabbitAt(x + 9, y);
        let near = null;
        for (let i = 0; i < 80; i++) { await frames(15); near = await rabbit(); if (near.sniff > 0 || near.cd > 0) break; }
        check("with bait a rabbit 8 tiles off smells it and hops up to the snare to sniff at it", near.sniff > 0 || near.cd > 0, near);
        for (let i = 0; i < 20 && (await rabbit()).cd === 0; i++) await frames(15);
        const scared = await rabbit();
        check("...not caught (chance 0 here): it takes fright and keeps away from snares for a while", !scared.dead && scared.cd > 0 && (await J(`${snare}.caught || 0`)) === 0, scared);
        await ev("Hunting.removeAnimal(window.__r); 0");
        if (!(await J(`!!${snare}.bait`))) await layBait();   // (it may have run off with the bait)

        await ev(`Farming.BUILDINGS.snare.lure.chance = 1; 0`);
        await rabbitAt(x + 10, y);
        let caught = null;
        for (let i = 0; i < 80; i++) { await frames(15); caught = await rabbit(); if (caught.dead) break; }
        const after = await J(`({ caught: ${snare}.caught || 0, bait: ${snare}.bait, ready: Farming.readyProduce(${snare}), today: Hunting.killedToday(3, "rabbit"), pop: window.__pop.slice(-3) })`);
        check("with bait a rabbit 9 tiles off smells it, comes and is caught: gone from the map, the snare holds it", caught.dead && !caught.on && after.caught === 1 && after.ready === 1, { rabbit: caught, snare: after });
        check("...the bait is used up, it counts as today's catch, and the player hears it ('Zając wpadł w pułapkę!')", !after.bait && after.today === 1 && after.pop.some(p => /wpadł w pułapkę/.test(p)), after);
        await frames(30);
        const inTrap = await J(`(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b === ${snare}); return { rabbit: !!(e && e.caught && e.caught.visible), bait: !!(e && e.bait && e.bait.visible), frame: e && e.caught ? [e.caught._frame.width, e.caught._frame.height] : null }; })()`);
        check("the caught rabbit is drawn sitting in the snare (one cell of its sheet)", inTrap.rabbit && !inTrap.bait && inTrap.frame[0] === 54 && inTrap.frame[1] === 43, inTrap);
        await b.shot(OUT + "snare_caught.png");
        // the rabbits taken off the map leave nothing behind (their ground shadows once stayed on the grass)
        const leftover = await ev("SceneManager._scene._spriteset._tilemap.children.filter(c => c.visible && c.bitmap && c.bitmap === (SceneManager._scene._spriteset._characterSprites.find(s => s._groundShadow) || {})._groundShadow?.bitmap).length - SceneManager._scene._spriteset._characterSprites.filter(s => s._groundShadow && s._groundShadow.visible).length - Hunting.animals.filter(a => a._sprite && a._sprite._groundShadow && a._sprite._groundShadow.visible).length");
        check("no ground shadow is left where the removed rabbits stood", leftover === 0, leftover);

        // ---------------------------------------------------------------- a snare that holds a rabbit draws no more; collecting it
        const setBait = `(function(){ const b = ${snare}, now = Farming.clockHours(); b.bait = { item: 72, at: now, until: now + 24 }; return 1; })()`;
        await ev(setBait);   // (bait put back by hand, to see that a full snare still draws none)
        await rabbitAt(x + 3, y + 1);
        await frames(300);
        const second = await rabbit();
        check("a snare with a rabbit in it draws no other (no sniffing, no second catch)", !second.dead && second.sniff === 0 && (await J(`${snare}.caught`)) === 1, second);
        await ev(`Hunting.removeAnimal(window.__r); ${snare}.bait = null; 0`);
        const menu2 = await J(`(function(){ const m = Farming.menuFor(${x}, ${y}).entries; return { collect: m.find(e => /^Zbierz/.test(e.name)), bait: m.find(e => /przynęt/i.test(e.name)) }; })()`);
        check("its menu: 'Zbierz: Zwierzyna ×1' (the rabbit in it), bait not possible until it is emptied", menu2.collect && /×1/.test(menu2.collect.name) && menu2.collect.enabled !== false && /zając/.test(menu2.collect.help) && menu2.bait.enabled === false, menu2);
        const carcass0 = await ev("Hunting.carcasses().length"); await ev("$gameParty.loseItem($dataItems[90], 9, true); $gameParty.loseItem($dataItems[91], 9, true); 0");   // (no knife: the rabbit is left lying)
        await ev(`$gamePlayer.locate(${x}, ${y} + 1); Farming.menuFor(${x}, ${y}).entries.find(e => /^Zbierz/.test(e.name)).run(); 0`);
        await frames(90);
        const emptied = await J(`({ caught: ${snare}.caught || 0, ready: Farming.readyProduce(${snare}) })`);
        check("collected without a knife: the rabbit lies at the snare (a carcass), the snare is empty and set again", (await ev("Hunting.carcasses().length")) === carcass0 + 1 && (await ev("Hunting.carcasses().slice(-1)[0].kind")) === "rabbit" && emptied.caught === 0 && emptied.ready === 0, emptied);

        // ---------------------------------------------------------------- the player beside a baited snare scares them off
        await ev(setBait);
        await ev(`$gamePlayer.locate(${x} + 2, ${y} + 1); 0`);
        await rabbitAt(x + 5, y);
        await frames(420);
        const wary = await rabbit();
        check("with the player standing by the snare no rabbit gets caught (it notices him and keeps off)", !wary.dead && (await J(`${snare}.caught || 0`)) === 0, wary);
        await ev("Hunting.removeAnimal(window.__r); 0");

        // ---------------------------------------------------------------- while nobody looks (asleep, another map): only with bait
        await ev(`Farming.BUILDINGS.snare.lure.awayChance = 1; $gamePlayer.locate(${x} + 5, ${y} - 12 < 1 ? ${y} + 12 : ${y} - 12); $gameSystem.setDayNightHour(8); 0`);
        await ev(`${snare}.bait = null; 0`);
        await frames(90);
        await ev("$gameSystem.advanceDayNight(6); 0");
        await frames(90);
        check("away for 6 hours with no bait: still nothing (even with a sure chance)", (await J(`${snare}.caught || 0`)) === 0);
        await ev(setBait);
        const kills0 = await ev("Hunting.hunt().kills.rabbit || 0");
        await frames(90);
        await ev("$gameSystem.advanceDayNight(6); 0");
        await frames(90);
        const away = await J(`({ caught: ${snare}.caught || 0, bait: ${snare}.bait, kills: Hunting.hunt().kills.rabbit || 0 })`);
        check("away for 6 hours with bait (the rabbits about): a rabbit took it - the snare holds it, the bait is gone", away.caught === 1 && !away.bait && away.kills === kills0 + 1, away);
        check("rabbits are about 5-21: 6 hours from 8 are 6 of theirs, a night from 22 to 6 only one", (await ev("Hunting.rabbitHours(8, 14)")) === 6 && (await ev("Hunting.rabbitHours(22, 30)")) === 1);
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
