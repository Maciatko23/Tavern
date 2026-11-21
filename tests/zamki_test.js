// Zamki i wytrychy (js/plugins/Zamki.js, 2026-11-19): skrzynie w domach miasteczka zamknięte, wytrych tylko w skradaniu (C),
// przytrzymanie O (prawdziwy klawisz), pęknięcie wytrycha, otwarcie i łup, pusta po otwarciu, wpadka (opinia w dół, do jutra nie).
//   CDP_PORT=9476 node tests/zamki_test.js        (ZRZUTY=folder: zrzut pierścienia przy zamku)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9476, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    t.check("wtyczka wczytana", await t.json("!!window.Zamki"));
    // the smith's house (Map105): the chest (event 13) at (1,6), the hero below it looking up; midday - the smith at his forge outside
    // (at night he sleeps in the bed by the chest now - Wlamania.js - and the clicks could wake him)
    await t.newGame({ map: 105, x: 1, y: 7, dir: 8, day: 12, hour: 11, quiet: true, minimap: false });
    await t.eval(`if (window.ZamkiGra) ZamkiGra.enabled(false); 0`);   // (the rules by the ring here; the mini-games: tests/zamki_gra_test.js)
    await t.frames(60);
    const sneak = on => t.eval(`Tawerna.state("hunt").sneak = ${on ? "true" : "false"}; 0`);
    const face = () => t.eval(`$gamePlayer.locate(1, 7); $gamePlayer.setDirection(8); 0`);
    const st = () => t.json(`(() => { const ev = $gameMap.event(13); return { lock: Zamki.lockOf(ev), locked: Zamki.isLocked(ev), picking: Zamki.picking(), picks: $gameParty.numItems($dataItems[515]),
        gold: $gameParty.gold(), dir: ev.direction(), rec: Zamki.state().locks["105:13"] || null }; })()`);
    const locks = await t.json(`$gameMap.events().filter(ev => Zamki.lockOf(ev)).map(ev => ev.eventId())`);
    t.check("na mapie kowala zamek ma tylko skrzynia (świeca, kowadło, drzwi - nie)", locks.length === 1 && locks[0] === 13, locks);
    let s = await st();
    t.check("skrzynia: poziom 1, zamknięta, wieko w dół", s.lock && s.lock.level === 1 && s.locked && s.dir === 2, s);
    // 1. O without sneaking
    await face(); await t.popups({ clear: true });
    await t.key("O", 4);
    let pops = await t.popups({ clear: true });
    s = await st();
    t.check("bez skradania: „tylko w skradaniu (C)”, nic się nie dzieje", !s.picking && pops.some(p => /skradaniu/.test(p)), pops);
    // 2. sneaking, no lockpick
    await sneak(true); await face();
    await t.key("O", 4);
    pops = await t.popups({ clear: true });
    s = await st();
    t.check("w skradaniu bez wytrycha: „nie masz wytrycha”", !s.picking && pops.some(p => /wytrycha/.test(p)), pops);
    // 3. a lockpick that breaks: every second a break (the level's chance set to 1 for the test)
    await t.eval(`$gameParty.gainItem($dataItems[515], 2); window.__brk = Zamki.LEVEL[1].brk; Zamki.LEVEL[1].brk = 1; 0`);
    await face();
    await t.key("O", 75);
    s = await st();
    pops = await t.popups({ clear: true });
    t.check("wytrych pęka: jeden mniej, „Wytrych pękł!”, pierścień się cofa", s.picks === 1 && pops.some(p => /pękł/.test(p)) && s.picking && s.picking.p < 0.5, { s, pops });
    await t.eval(`Zamki.LEVEL[1].brk = 0; 0`);
    // 4. holding O long enough: the lock gives (2.5 s at Zręczność 5), the loot, the lid up
    const g0 = s.gold;
    await face();
    await t.key("O", 40);   // (let go: the ring waits)
    const mid = await st();
    t.check("puszczenie O: pierścień czeka (postęp zostaje)", mid.picking && mid.picking.p > 0.1, mid.picking);
    if (SHOTS) { await t.eval(`$gameMap.setDisplayPos(-6, 0); 0`); await t.frames(5); await t.shot(SHOTS + "/zamek_pierscien.png"); }
    await face();
    await t.key("O", 200);
    await t.frames(10);
    s = await st();
    pops = await t.popups({ clear: true, gains: true });
    t.check("zamek puścił: skrzynia otwarta (wieko w górę), łup w torbie, wytrych został", !s.picking && !s.locked && s.dir === 8 && s.picks === 1 && pops.some(p => /puścił/.test(p)), { s, g0, pops });
    // 5. again: empty
    await face();
    await t.key("O", 4);
    pops = await t.popups({ clear: true });
    s = await st();
    t.check("drugi raz: „Pusto.”, bez otwierania", !s.picking && pops.some(p => /Pusto/.test(p)), pops);
    // 6. refilled after 7 days: locked again, the lid down
    await t.eval(`Zamki.state().locks["105:13"].open = Tawerna.time.day() - 7; Tawerna.emit("dayStart", {}); 0`);
    await t.frames(3);
    s = await st();
    t.check("po 7 dniach znowu zamknięta i pełna (wieko w dół)", s.locked && s.dir === 2, s);
    // 7. caught: someone sees him picking - "Złodziej!", the town's opinion down, not again today
    const op0 = await t.json(`TownQuests.state ? TownQuests.state().opinion : null`);
    await t.eval(`(() => { const W = Widzenie, ev = $gameMap.event(9); window.__spot = W.spotted; W.spotted = () => [ev]; return 0; })()`);
    await face();
    await t.key("O", 10);
    await t.eval(`Widzenie.spotted = window.__spot; 0`);
    s = await st();
    const op1 = await t.json(`TownQuests.state ? TownQuests.state().opinion : null`);
    t.check("przyłapany: koniec dłubania, opinia miasteczka w dół, zapisane „dziś złapany”", !s.picking && s.rec && s.rec.caught === (await t.json("Tawerna.time.day()")) && (op0 === null || op1 < op0), { s, op0, op1 });
    await t.popups({ clear: true });
    await face();
    await t.key("O", 4);
    pops = await t.popups({ clear: true });
    t.check("tego dnia przy tej skrzyni już nie: „ktoś cię przyłapał”", pops.some(p => /przyłapał/.test(p)), pops);
    // 8. walking away loses the picking
    await t.eval(`Zamki.state().locks["105:13"].caught = 0; 0`);
    await face();
    await t.key("O", 20);
    const before = await st();
    await t.eval(`$gamePlayer.locate(6, 8); 0`);
    await t.frames(5);
    s = await st();
    t.check("odejście od skrzyni przerywa dłubanie", before.picking && !s.picking, { before: before.picking, after: s.picking });
    await sneak(false);
    // 9. the other maps: a chest with commands (Cech, coal) and grandpa's house are not locks; the strongboxes are level 3
    const lv = await t.json(`(() => { const L = n => { const ev = Object.create(Game_Event.prototype); ev._mapId = 186; ev._eventId = 7; ev.event = () => ({ name: n }); ev.page = () => ({ list: [{ code: 0 }] }); return Zamki.lockOf(ev); };
        return { kupca: (L("Okuta skrzynia kupca") || {}).level, zwykla: (L("Skrzynia") || {}).level, pusta: L("Pusta skrzynia") }; })()`);
    t.check("okuta skrzynia - poziom 3, zwykła - 1, pusta - bez łupu", lv.kupca === 3 && lv.zwykla === 1 && lv.pusta && lv.pusta.loot === null, lv);
    // 9b. the master's lock (Baltazar's strongbox, level 4): Zręczność 10 asked - "za trudny"; the level's name said at every lock
    const hard = await t.json(`(() => { const ev = Object.create(Game_Event.prototype); ev._mapId = 103; ev._eventId = 4; ev.event = () => ({ name: "Okuta skrzynia (zamknięta)" }); ev.page = () => ({ list: [{ code: 0 }] });
        return { level: Zamki.lockOf(ev).level, name: Zamki.levelName(4) }; })()`);
    await sneak(true); await face();
    await t.eval(`Zamki.register(105, 13, { level: 4, owner: "town" }); 0`);
    await t.popups({ clear: true });
    await t.key("O", 4);
    pops = await t.popups({ clear: true });
    await t.eval(`Zamki.register(105, 13, { level: 1, owner: "town" }); 0`);
    await t.key("O", 4);
    const pops1 = await t.popups({ clear: true });
    await t.eval(`$gamePlayer.locate(6, 8); 0`); await t.frames(3);
    t.check("kantor Baltazara: zamek mistrzowski (4/5) - bez Zręczności 10 „za trudny”; zwykły mówi „Zamek prosty (1/5)”",
        hard.level === 4 && hard.name === "mistrzowski" && pops.some(p => /mistrzowski - za trudny.*Zręczności 10/.test(p)) && pops1.some(p => /Zamek prosty \(1\/5\)/.test(p)), { hard, pops, pops1 });
    await sneak(false);

    // 9c. the tavern's guests' doors (Map025): sneaking, the guest out - "Otwórz wytrychem"; picked - open an hour
    await t.go(25, 10, 10);
    await t.setHour(22);
    await t.eval(`if (window.Intrygi) Intrygi.auto(false); for (const k in Zamki.LEVEL) Zamki.LEVEL[k].brk = 0; 0`);   // (the time of the picking measured, no luck in it)
    const door = await t.json(`(() => { const D = IntrygiData.DRZWI; const ev = $gameMap.events().find(e => D.re.test(e.event().name || "")); if (!ev) return null;
        const room = D.re.exec(ev.event().name)[1]; Podroznicy.stan().ksiega[room] = "testowy"; return { id: ev.eventId(), room, x: ev.x, y: ev.y }; })()`);
    const labels = () => t.json(`(() => { const l = $gameMap.event(${door.id}).list(); const c = l.find(x => x.code === 102); return c ? c.parameters[0] : null; })()`);
    if (door) {
        const walk = await labels();
        await sneak(true);
        const sn = await labels();
        t.check("drzwi pokoju gościa (zamknięte): w skradaniu jest „Otwórz wytrychem (zamek solidny)”, bez skradania nie", walk && !walk.some(l => /wytrych/.test(l)) && sn && sn.some(l => /Otwórz wytrychem \(zamek solidny\)/.test(l)), { walk, sn });
        await t.eval(`(() => { const ev = $gameMap.event(${door.id}); for (const [dx, dy, d] of [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]]) { const x = ev.x + dx, y = ev.y + dy; if ($gameMap.checkPassage(x, y, 0x0f)) { $gamePlayer.locate(x, y); $gamePlayer.setDirection(d); break; } }
            $gameParty.gainItem($dataItems[515], 2); Intrygi.drzwi({ eventId: () => ${door.id} }, "wytrych", ${JSON.stringify(door.room)}); return 0; })()`);
        const p0 = await t.json(`Zamki.picking()`);
        await t.key("O", 280);
        await t.frames(10);
        const after = await labels();
        const why = await t.json(`({ rec: Zamki.state().locks["25:${door.id}"] || null, pops: window.__kit.pops.slice(-6).map(x => x.text), hero: [$gamePlayer.x, $gamePlayer.y], map: $gameMap.mapId() })`);
        t.check("wytrychem otwarte: dłubanie (poziom 2), potem drzwi zwykłe (wejście) na godzinę", p0 && p0.owner === "tavern" && p0.level === 2 && after === null, { p0, after, why });
        await t.eval(`delete Podroznicy.stan().ksiega[${JSON.stringify(door.room)}]; 0`);
        await sneak(false);
    } else t.check("na piętrze tawerny są drzwi pokoi", false, door);

    // a free tile beside (x, y): the hero put there, facing it
    const besideJs = `const beside = (x, y) => { for (const [dx, dy, dir] of [[0, 1, 8], [-1, 0, 6], [1, 0, 4], [0, -1, 2]]) { const hx = x + dx, hy = y + dy;
        if ($gameMap.isValid(hx, hy) && $gameMap.checkPassage(hx, hy, 0x0f) && !$gameMap.eventsXyNt(hx, hy).some(e => e.isNormalPriority())) { $gamePlayer.locate(hx, hy); $gamePlayer.setDirection(dir); return [hx, hy, dir]; } } return null; };`;
    // 10. the underground (floor 1): half the chests locked, by their place; a locked one opened - its loot and a purse, open for good
    let ug = null, floorMap = 0;
    for (const f of [1, 2, 3, 4, 5, 6, 7, 8]) {
        await t.eval(`Underground.go(${f}); 0`);
        await t.until(`Underground.floorOf($gameMap.mapId()) === ${f} && !$gamePlayer.isTransferring()`, 30);
        await t.frames(20);
        ug = await t.json(`(() => { const ch = $gameMap.events().filter(e => /<Lup:skrzynia>/.test(e.event().note || ""));
            return { floor: ${f}, map: $gameMap.mapId(), gen: Underground.isGenerated($gameMap.mapId()), chests: ch.length, locked: ch.filter(e => Zamki.isLocked(e)).map(e => e.eventId()),
                again: ch.filter(e => Zamki.isLocked(e)).length, kinds: [...new Set($gameMap.events().map(e => ((e.event().note || "").match(/<Lup:(\w+)>/) || [])[1]).filter(Boolean))] }; })()`);
        floorMap = ug.map;
        if (ug.locked.length) break;
    }
    await t.calm();
    t.check("podziemia: część skrzyń zamknięta (z miejsca - za każdym razem tak samo)", ug.locked.length > 0 && ug.locked.length <= ug.chests && ug.again === ug.locked.length, ug);
    if (ug.locked.length) {
        const id = ug.locked[0];
        await sneak(true);
        const at = await t.json(`(() => { ${besideJs} if (window.Creatures && Creatures.clearAll) Creatures.clearAll(); const ev = $gameMap.event(${id}); for (const k in Zamki.LEVEL) Zamki.LEVEL[k].brk = 0; return { ev: [ev.x, ev.y], hero: beside(ev.x, ev.y), gold: $gameParty.gold(), level: Zamki.lockOf(ev).level, secs: Zamki.secsOf(Zamki.lockOf(ev)) }; })()`);
        await t.popups({ clear: true });
        await t.key("O", 4);
        await t.key("O", Math.ceil(at.secs * 60) + 30);
        await t.frames(10);
        const r = await t.json(`(() => { const ev = $gameMap.event(${id}); return { locked: Zamki.isLocked(ev), sw: $gameSelfSwitches.value([${floorMap}, ${id}, "A"]), gold: $gameParty.gold(), picking: Zamki.picking() }; })()`);
        const pops10 = await t.popups({ clear: true, gains: true });
        t.check("zamknięta skrzynia w podziemiach: wytrych w skradaniu, otwarta na stałe, łup + sakiewka", at.hero && !r.locked && r.sw && r.gold > at.gold && pops10.some(p => /puścił/.test(p)), { at, r, pops10 });
        await t.key("O", 4);
        await t.frames(30);
        const msg = await t.json(`({ busy: $gameMessage.isBusy(), picking: Zamki.picking() })`);
        t.check("otwarta: drugi raz zwykłe przeszukanie (pusta), nie dłubanie", !msg.picking, msg);
        await t.dismiss();
        await sneak(false);
    }

    // 11. a bandits' camp at night (Leśna droga 222): the box by the fire, locked; picked open - the band's takings, the box stays open
    await t.go(222, 40, 40);
    await t.setHour(23);
    await t.eval(`Zamki.LEVEL[2].brk = 0; 0`);   // (no breaking here: the time of a level-2 lock is what is measured)
    const camp = await t.json(`(() => { const c = Humans.camp({ chest: true, far: 3, near: 14 }); if (!c) return null; Humans.clear();
        const d = Humans.drops().find(o => o.id === c.chest); return d ? { x: d.x, y: d.y, level: d.level, locked: d.locked, gold: d.gold, items: d.items.length } : { none: true }; })()`);
    t.check("obóz bandytów: przy ognisku okuta skrzynka, zamknięta (poziom 2)", camp && camp.locked === true && camp.level === 2, camp);
    if (camp && camp.locked) {
        await sneak(true);
        const at = await t.json(`(() => { ${besideJs} const h = beside(Math.floor(${camp.x}), Math.floor(${camp.y})); $gameMap.setDisplayPos(Math.floor(${camp.x}) - 13, Math.floor(${camp.y}) - 8); return { hero: h, gold: $gameParty.gold(), picks: $gameParty.numItems($dataItems[515]) }; })()`);
        await t.frames(10);
        if (SHOTS) await t.shot(SHOTS + "/zamek_oboz.png");
        await t.popups({ clear: true });
        await t.eval(`$gameParty.gainItem($dataItems[515], 3); 0`);
        await t.key("O", 4);
        const mid = await t.json(`Zamki.picking()`);
        await t.key("O", 280);
        await t.frames(40);
        const r = await t.json(`(() => { const d = Humans.drops().find(o => o.kind === "chest"); return { there: !!d, locked: d && d.locked, gold: $gameParty.gold(), left: d ? (d.gold || 0) + (d.items || []).length : -1, ahead: Humans.dropAhead() ? Humans.dropAhead().kind : null }; })()`);
        const pops11 = await t.popups({ clear: true, gains: true });
        t.check("skrzynka w obozie: dłubanie (poziom 2), otwarta, łup zabrany, skrzynka stoi otwarta i pusta", mid && mid.owner === "camp" && r.there && r.locked === false && r.left === 0 && r.gold > at.gold && r.ahead === null,
            { mid, r, at, pops11 });
        if (SHOTS) await t.shot(SHOTS + "/zamek_oboz_otwarta.png");
        await sneak(false);
    }
});
