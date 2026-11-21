// Mini-gry wytrycha (js/plugins/Zamki_Gra.js, 2026-11-19): zapadki zamka (A/D, W, O, P), kolejność blokujących zapadek, napięcie
// i pęknięcie wytrycha, blokada ruchu i menu; rozbrajanie pułapek: sprężyna (wskazówka w zielonym) i linka (cięcie w ciszy).
//   CDP_PORT=9476 node tests/zamki_gra_test.js        (ZRZUTY=folder: zrzuty trzech okienek)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9476, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    t.check("wtyczka wczytana", await t.json("!!window.ZamkiGra && ZamkiGra.enabled()"));
    await t.newGame({ map: 105, x: 1, y: 7, dir: 8, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const sneak = on => t.eval(`Tawerna.state("hunt").sneak = ${on ? "true" : "false"}; 0`);
    const face = () => t.eval(`$gamePlayer.locate(1, 7); $gamePlayer.setDirection(8); 0`);
    const G = expr => t.json(`(() => { const g = ZamkiGra.current(); return ${expr}; })()`);
    await sneak(true);
    await t.eval(`$gameParty.gainItem($dataItems[515], 3); 0`);
    // 1. O at the locked chest: the lock's game opens; the hero held, the menu shut, the core counts a mini-game
    await face();
    await t.key("O", 4);
    let s = await G(`g ? { kind: g.kind, n: g.n, level: g.level, sel: g.sel, title: g.o.title, canMove: $gamePlayer.canMove(), mini: Tawerna.miniGameRunning(), menu: SceneManager._scene.isMenuCalled(),
        panel: !!(SceneManager._scene._zamkiPanel && SceneManager._scene._zamkiPanel.visible) } : null`);
    t.check("O przy zamkniętej skrzyni: okienko zapadek (zamek prosty: 2 zapadki), postać stoi, menu nie wyskoczy", s && s.kind === "lock" && s.n === 2 && s.level === 1
        && s.canMove === false && s.mini === true && s.menu === false && s.panel && /Zamek prosty \(1\/5\)/.test(s.title), s);
    // 2. the keys: D - the next pin, W held - it goes up, let go - it drops
    await t.key("D", 3);
    const sel = await G(`g.sel`);
    await t.eval(`Input._currentState.up = true; 0`);
    await t.frames(16);
    const up = await G(`g.pins[g.sel].y`);
    await t.eval(`Input._currentState.up = false; 0`);
    await t.frames(30);
    const down = await G(`g.pins[g.sel].y`);
    t.check("D przesuwa wytrych pod następną zapadkę, W (trzymane) ją podnosi, puszczone - opada", sel === 1 && up > 3 && down === 0, { sel, up, down });
    // 3. the pin that does not bind yet, at the line: "nie trzyma", some strain
    const wrong = await G(`(() => { const j = g.order[1]; g.cheatLift(j); const r = g.trySet(); return { r, strain: g.strain, msg: g.msg, set: g.pins[j].set }; })()`);
    t.check("zapadka, która jeszcze nie blokuje - „Nie trzyma”, napięcie rośnie, nie osadzona", wrong.r === "miss" && wrong.strain > 0 && !wrong.set && /Nie trzyma/.test(wrong.msg), wrong);
    // 4. a pin too high: "Za wysoko!"
    const high = await G(`(() => { const i = g.order[0]; g.cheatLift(i); g.pins[i].y += 9; return { r: g.trySet(), msg: g.msg }; })()`);
    t.check("za wysoko podważona - „Za wysoko!”", high.r === "miss" && /Za wysoko/.test(high.msg), high);
    if (SHOTS) { await G(`(() => { g.cheatLift(g.order[0]); return 0; })()`); await t.frames(2); await t.shot(SHOTS + "/gra_zapadki.png"); }
    if (SHOTS) {   // (a look at the Order's lock: six pins, two set)
        await t.eval(`(() => { const g0 = ZamkiGra.current(); const o = g0.o; ZamkiGra.close("t"); const g = ZamkiGra.open("lock", Object.assign({}, o, { level: 5, title: "Zamek zakonny (5/5)", onDone() {}, onBreak() { return true; }, onQuit() {} }));
            for (let k = 0; k < 2; k++) { g.cheatLift(g.order[k]); g.trySet(); } g.sel = g.order[2]; g.pins[g.sel].y = 9; g.strain = 0.4; return 0; })()`);
        await t.frames(2); await t.shot(SHOTS + "/gra_zapadki5.png");
        await t.eval(`ZamkiGra.close("t"); Zamki.cancel(); 0`); await face(); await t.key("O", 4);
    }
    // 5. the binding order: each at its line in turn - set; all set: the chest opens, the game shuts, the hero free
    const right = await G(`(() => { const out = []; for (let k = 0; k < g.n; k++) { const i = g.order[k]; g.cheatLift(i); out.push(g.trySet()); } return out; })()`);
    await t.frames(10);
    s = await t.json(`({ game: !!ZamkiGra.current(), locked: Zamki.isLocked($gameMap.event(13)), canMove: $gamePlayer.canMove(), picking: Zamki.picking() })`);
    t.check("zapadki w swojej kolejności - osadzone; wszystkie: skrzynia otwarta, okienko znika, można iść", right.every(r => r === "set") && !s.game && s.locked === false && s.canMove && !s.picking, { right, s });
    // 6. the same lock - the same order (it is the lock's own); a harder lock: more pins, a narrower line
    const orders = await t.json(`(() => { const a = ZamkiGra.open("lock", { level: 3, seed: "x:1", dex: 5, onDone() {}, onBreak() { return true; } }).order.join(); ZamkiGra.close("t");
        const b = ZamkiGra.open("lock", { level: 3, seed: "x:1", dex: 5, onDone() {}, onBreak() { return true; } }); const r = { a, b: b.order.join(), n: b.n, win: b.win }; ZamkiGra.close("t");
        const e = ZamkiGra.open("lock", { level: 5, seed: "x:2", dex: 5, onDone() {}, onBreak() { return true; } }); r.n5 = e.n; r.win5 = e.win; ZamkiGra.close("t");
        const d = ZamkiGra.open("lock", { level: 5, seed: "x:2", dex: 15, onDone() {}, onBreak() { return true; } }); r.win5dex = d.win; ZamkiGra.close("t"); return r; })()`);
    t.check("ten sam zamek - ta sama kolejność; okuty 4 zapadki, zakonny 6 i węższa linia; Zręczność ją poszerza", orders.a === orders.b && orders.n === 4 && orders.n5 === 6 && orders.win5 < orders.win && orders.win5dex > orders.win5, orders);
    // 7. strain full: the pick snaps (one gone, every pin down), the game goes on while picks are left
    await t.eval(`Zamki.register(105, 13, { level: 3, owner: "town" }); Zamki.state().locks["105:13"] = {}; 0`);
    await face();
    await t.key("O", 4);
    const before = await t.json(`$gameParty.numItems($dataItems[515])`);
    const snap = await G(`(() => { const i = g.order[0]; g.cheatLift(i); g.trySet(); const set1 = g.pins[i].set; let guard = 0; const n0 = $gameParty.numItems($dataItems[515]); while (g === ZamkiGra.current() && $gameParty.numItems($dataItems[515]) === n0 && guard++ < 20) { const j = g.order[g.k + 1] !== undefined ? g.order[g.k + 1] : g.order[0]; g.cheatLift(j); g.pins[j].y += 9; g.trySet(); }
        return { set1, k: g.k, anySet: g.pins.some(p => p.set), msg: g.msg, still: ZamkiGra.current() === g }; })()`);
    const after = await t.json(`$gameParty.numItems($dataItems[515])`);
    t.check("za duże napięcie - wytrych pęka: jeden mniej, zapadki opadają, gra trwa dalej", snap.set1 && after === before - 1 && snap.k === 0 && !snap.anySet && snap.still && /pękł/.test(snap.msg), { before, after, snap });
    // 8. P: let go
    await t.key("P", 3);
    await t.frames(5);
    s = await t.json(`({ game: !!ZamkiGra.current(), picking: Zamki.picking(), canMove: $gamePlayer.canMove(), scene: SceneManager._scene.constructor.name })`);
    t.check("P - puszczasz zamek: okienko znika, menu się nie otwiera", !s.game && !s.picking && s.canMove && s.scene === "Scene_Map", s);

    // 9. the traps (the underground): the spring - the needle kept in the green: disarmed; the bells - cut in the quiet: disarmed
    let floor = null;
    for (const f of [5, 6, 7, 8, 4, 3]) {
        await t.eval(`Underground.go(${f}); 0`);
        await t.until(`Underground.floorOf($gameMap.mapId()) === ${f} && !$gamePlayer.isTransferring()`, 30);
        await t.frames(20);
        const n = await t.json(`Pulapki.list().length`);
        if (n >= 2) { floor = f; break; }
    }
    await t.calm();
    await t.eval(`if (window.Creatures && Creatures.clearAll) Creatures.clearAll(); Tawerna.state("hunt").sneak = true; 0`);
    const by = i => t.json(`(() => { const tr = Pulapki.here().list[${i}]; for (const [dx, dy, d] of [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]]) { const x = tr.x + dx, y = tr.y + dy;
        if ($gameMap.checkPassage(x, y, 0x0f) && !Pulapki.list().some(q => q.x === x && q.y === y)) { $gamePlayer.locate(x, y); $gamePlayer.setDirection(d); return [x, y]; } } return null; })()`);
    await t.eval(`(() => { const h = Pulapki.here(); h.list[0].kind = "wnyk"; h.list[1].kind = "linka"; Pulapki.notice(h.list[0]); Pulapki.notice(h.list[1]); return 0; })()`);
    await by(0); await t.frames(3);
    await t.key("O", 4);
    s = await G(`g ? { kind: g.kind, title: g.o.title, zone: g.zone } : null`);
    t.check("wnyk: okienko sprężyny (wskazówka i zielone pole)", s && s.kind === "spring" && /Rozbrajanie: Wnyk/.test(s.title), s);
    if (SHOTS) { await t.frames(20); await t.shot(SHOTS + "/gra_sprezyna.png"); }
    await G(`(() => { g.prog = 0.97; g.x = 0; g.v = 0; g.next = 999; return 0; })()`);
    await t.frames(15);
    const sp = await t.json(`({ state: Pulapki.list()[0].state, game: !!ZamkiGra.current() })`);
    t.check("wskazówka w zielonym do końca - wnyk rozbrojony", sp.state === "disarmed" && !sp.game, sp);
    await by(1); await t.frames(3);
    await t.key("O", 4);
    s = await G(`g ? { kind: g.kind } : null`);
    t.check("linka: okienko dzwonków", s && s.kind === "bells", s);
    if (SHOTS) { await t.frames(20); await t.shot(SHOTS + "/gra_dzwonki.png"); }
    await G(`(() => { g.phase = "ring"; g.left = 999; g.amp = 1; return 0; })()`);
    await t.key("O", 3);
    const miss1 = await G(`g ? g.misses : -1`);
    await G(`(() => { g.phase = "quiet"; g.left = 999; g.amp = 0; return 0; })()`);
    await t.key("O", 3);
    await t.frames(5);
    const bell = await t.json(`({ state: Pulapki.list()[1].state, game: !!ZamkiGra.current() })`);
    t.check("cięcie przy dzwonieniu - pomyłka; w ciszy - linka przecięta (rozbrojona)", miss1 === 1 && bell.state === "disarmed" && !bell.game, { miss1, bell });
    await sneak(false);
});
