// HomeDecor.js: grandpa's house (Map019) changes with the story and the seasons. A new story game in the house (the start is set
// in the page to Map019 2,5 - data/System.json starts in the tavern on purpose); HomeDecor.js is put into the page when it is not
// registered yet. Checks: the folk touches always there (wycinanki, the towel, the rag rug, the painted chest), the empty nail and
// then the Lord's receipt after Story.pay(2500), each keepsake after its trigger (a wolf, a deer, a boar through Hunting's own kill
// path - not by the dog; a Borgar shift, a dice win, a contract), each season's things by the day, Christmas Eve only round the
// middle of winter (the dishes off the table meanwhile), no decoration on a walkway or the doorway (the free floor stays one
// piece and the door reachable), the action button and the mouse on a decoration give its line, an older save gets the events and
// its past, no console errors. Screenshots at the map's zoom 1.5: docs/dom_dziadka/ozdoby_*.png
//   CDP_PORT=9394 node tests/home_decor_test.js
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "dom_dziadka");

kit.test({ port: 9394, plugins: ["TawernaCore", "TawernaUI", "HomeDecor"],   // (the core first: HomeDecor.js is built on it)
    bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    const ev = e => t.eval(e), J = e => t.json(e);
    // what every slot shows now (+ grandpa's chest)
    const looks = () => J(`(function(){ const o = {}; for (const s of HomeDecor.SLOTS) { const e = $gameMap.event(s.id); o[s.key] = e ? (e._decorLook || null) : "(none)"; }
        const c = $gameMap.events().find(e => /Skrzynia dziadka/.test(e.event().name)); o.skrzynia = c ? c.characterName() + "/" + (c._decorLook || "") : "(none)"; return o; })()`);
    const setDay = async (d, h) => { await ev(`(function(){ $gameSystem._dayNightDay = ${d}; $gameSystem._dayNightHour = ${h === undefined ? 11 : h}; $gameScreen.clearWeather(); HomeDecor.refresh(); return 0; })()`); await t.frames(8); };
    const clearNotices = () => ev("(function(){ if ($gameTemp._topNotices) $gameTemp._topNotices.length = 0; const s = SceneManager._scene; if (s && s._topNotice) s._topNotice.visible = false; return 0; })()").catch(() => 0);
    // a shot of the game screen, optionally only a part of it: [x, y, w, h] in map tiles -> the screen's pixels at the zoom
    const shot = async (name, focus, clipTiles) => {
        await ev(`(function(){ window.__focus = ${JSON.stringify(focus || null)}; return 0; })()`);
        await t.frames(30);
        // (the pictures show the house: the HUD, the goal and the notices hidden for the moment)
        await ev("(function(){ const sc = SceneManager._scene; window.__hidden = sc.children.filter(c => c !== sc._spriteset && c.visible); for (const c of window.__hidden) { c.visible = false; c.renderable = false; } return 0; })()");
        await t.frames(2);
        const file = path.join(SHOTS, name);
        const unhide = () => ev("(function(){ for (const c of window.__hidden || []) { c.visible = true; c.renderable = true; } window.__hidden = null; return 0; })()");
        if (!clipTiles) { await t.shot(file); await unhide(); return file; }
        const r = await J(`(function(){ const sc = $gameScreen.zoomScale(), zx = $gameScreen.zoomX(), zy = $gameScreen.zoomY();
            const p = (x, y) => [sc * $gameMap.adjustX(x) * 48 - zx * (sc - 1), sc * $gameMap.adjustY(y) * 48 - zy * (sc - 1)];
            const a = p(${clipTiles[0]}, ${clipTiles[1]}), c = p(${clipTiles[0] + clipTiles[2]}, ${clipTiles[1] + clipTiles[3]}); return [a[0], a[1], c[0] - a[0], c[1] - a[1]]; })()`);
        const x = Math.max(0, Math.round(r[0])), y = Math.max(0, Math.round(r[1]));
        const res = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x, y, width: Math.min(1280 - x, Math.round(r[2])), height: Math.min(720 - y, Math.round(r[3])), scale: 1 } });
        fs.writeFileSync(file, Buffer.from(res.data, "base64"));
        await unhide();
        return file;
    };
    fs.mkdirSync(SHOTS, { recursive: true });

    // ---- HomeDecor.js in the page, a new story game in grandpa's house
    t.clearErrors();
    const how = t.plugins.HomeDecor;
    t.check("HomeDecor.js is in the game" + (how === "registered" ? " (registered)" : " (put into the page: not registered yet)"), how !== "failed" && (await ev("!!window.HomeDecor")));
    // a fixed camera for the shots (the zoom's own follow, with a chosen point instead of the player)
    await ev(`(function(){ const orig = Spriteset_Map.prototype.followPlayerWithZoom; if (!orig || orig.__decor) return 0;
        Spriteset_Map.prototype.followPlayerWithZoom = function() { const f = window.__focus; if (!f) return orig.call(this);
            const sc = $gameScreen.zoomScale(); if (Math.abs(sc - 1) < 0.001) return;
            const fx = $gameMap.adjustX(f[0]) * 48, fy = $gameMap.adjustY(f[1]) * 48;
            $gameScreen._zoomX = (sc * fx - Graphics.width / 2) / (sc - 1); $gameScreen._zoomY = (sc * fy - Graphics.height / 2) / (sc - 1); };
        Spriteset_Map.prototype.followPlayerWithZoom.__decor = true; return 0; })()`);
    t.check("a new story game starts in grandpa's house", await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, settle: 20 }));
    await setDay(3, 11);
    const ART = await J("Object.keys(HomeDecor.DECOR_ART)");
    t.check("the generated art is in the plugin (29 looks)", ART.length === 29, ART.length);
    const evs = await J("HomeDecor.SLOTS.map(s => { const e = $gameMap.event(s.id); return e ? [s.id, e.x, e.y] : [s.id, null]; })");
    t.check("all 19 decoration events (980-998) are on the map where the slots say", evs.every(e => e[1] !== null), evs.filter(e => e[1] === null));
    // ================= the folk touches: always
    let L = await looks();
    const folk = l => l.wyc_2 === "wyc_2" && l.wyc_7 === "wyc_7" && l.wyc_11 === "wyc_11" && l.wyc_16 === "wyc_16" && l.chodnik === "chodnik" &&
        /^recznik/.test(l.recznik || "") && l.skrzynia === "!House_Decor/skrzynia";
    t.check("the folk touches: four wycinanki, the towel on the picture, the rag rug, the painted chest", folk(L), L);
    t.check("before the debt is paid: an empty nail where the receipt will hang", L.rama === "gwozdz", L.rama);
    t.check("no keepsake yet in a new game", !L.rogi && !L.kiel && !L.list && !L.polka && !L.skora, L);
    // ================= the seasons
    const seasonCases = [
        [3, "spring", l => l.stol_p === "bazie" && !l.stol_l && !l.komin && !l.wigilia && !l.dynie_l && !l.snop && l.recznik === "recznik"],
        [14, "spring (Easter)", l => l.stol_p === "bazie" && l.stol_l === "pisanki"],
        [35, "summer", l => l.stol_p === "kwiaty" && l.komin === "ziola" && !l.stol_l && !l.dynie_r],
        [60, "autumn", l => l.komin === "wieniec" && l.stol_l === "jablka" && l.dynie_l === "dynie_l" && l.dynie_r === "dynie_r" && !l.stol_p],
        [88, "winter", l => l.recznik === "recznik_zima" && !l.wigilia && !l.snop && !l.komin && !l.stol_p && !l.stol_l && !l.dynie_l],
        [98, "winter (Christmas Eve)", l => l.recznik === "recznik_zima" && l.wigilia === "wigilia" && l.snop === "snop" && !l.stol_p && !l.stol_l],
        [115, "spring again (year 2)", l => l.stol_p === "bazie" && !l.wigilia && l.recznik === "recznik"]
    ];
    for (const [d, name, ok] of seasonCases) {
        await setDay(d);
        L = await looks();
        t.check("day " + d + " - " + name + ": its things (and the folk touches)", ok(L) && folk(L), L);
    }
    const easter = await J("Array.from({ length: 112 }, (_, i) => i + 1).filter(d => HomeDecor.isEaster(d))");
    const wig = await J("Array.from({ length: 224 }, (_, i) => i + 1).filter(d => HomeDecor.isWigilia(d))");
    t.check("Easter: days 13-16 of spring only", JSON.stringify(easter) === JSON.stringify([13, 14, 15, 16]), easter);
    t.check("Christmas Eve: days 12-16 of winter only (96-100, next year 208-212)", JSON.stringify(wig) === JSON.stringify([96, 97, 98, 99, 100, 208, 209, 210, 211, 212]), wig);
    // Christmas Eve: the dishes off the table, back after
    // (the dishes are Winlu D tiles on the table; since the user's edit of 2026-09-29 the table has none - then nothing moves)
    const dishes = await J("(function(){ const W = $dataMap.width, H = $dataMap.height; let n = 0; for (const [x, y] of [[2,9],[3,9],[4,9],[2,10],[3,10],[4,10]]) for (const z of [2, 3]) { const v = $dataMap.data[(z * H + y) * W + x]; if (v >= 512 && v < 768) n++; } return n; })()");
    await setDay(98);
    const plateOff = await J("(function(){ const W = $dataMap.width, H = $dataMap.height; return [$dataMap.data[(3 * H + 9) * W + 4], HomeDecor.tableCleared()]; })()");
    // ================= walkways, the doorway
    const WALK = await J(`(function(){
        const W = $gameMap.width(), H = $gameMap.height(), people = e => !HomeDecor.SLOTS.some(s => s.id === e.eventId()) && (e.eventId() >= 900 || /kot|cat/i.test(e.event().name || ""));
        const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough() && !people(e));
        function bfs(sx, sy) { const seen = new Set([sx + "," + sy]), q = [[sx, sy]];
            while (q.length) { const [x, y] = q.shift();
                for (const [d, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + "," + ny;
                    if (seen.has(k) || !$gameMap.isValid(nx, ny) || !$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) continue;
                    seen.add(k); q.push([nx, ny]); } }
            return seen; }
        const decor = $gameMap.events().filter(e => HomeDecor.SLOTS.some(s => s.id === e.eventId()));
        const keep = decor.map(e => [e, e._through, e._priorityType]);
        for (const e of decor) { e._through = true; e._priorityType = 0; }
        const free = bfs(9, 11);
        for (const [e, t, p] of keep) { e._through = t; e._priorityType = p; }
        const now = bfs(9, 11);
        const cells = HomeDecor.blockedCells().map(c => c.join(","));
        const lost = [...free].filter(k => !now.has(k) && !cells.includes(k));
        return { free: free.size, now: now.size, blocked: cells, lost, door: now.has("9,12"), landing: now.has("9,11") }; })()`);
    t.check("Christmas Eve: the sheaf is the only thing standing in the way (17,7, in the corner behind grandpa's chest)", JSON.stringify(WALK.blocked) === JSON.stringify(["17,7"]), WALK.blocked);
    t.check("the free floor stays one piece: every cell reachable before is reachable now (but the sheaf's)", WALK.lost.length === 0 && WALK.now === WALK.free - WALK.blocked.length, WALK);
    t.check("the door and the landing are reachable", WALK.door && WALK.landing, WALK);
    await setDay(101);
    const plateBack = await J("(function(){ const W = $dataMap.width, H = $dataMap.height; return [$dataMap.data[(3 * H + 9) * W + 4], HomeDecor.tableCleared()]; })()");
    if (dishes) t.check("on Christmas Eve the plate of food leaves the table (the cloth, the wafer, the candle stay), then comes back", plateOff[0] === 0 && plateOff[1] && plateBack[0] > 0 && !plateBack[1], { plateOff, plateBack });
    else t.check("no dishes on the table (the map has none now): on Christmas Eve nothing is taken off, nothing put back", !plateOff[1] && !plateBack[1] && plateOff[0] === plateBack[0], { plateOff, plateBack });
    await setDay(60);
    const WALK2 = await J(`(function(){ return HomeDecor.blockedCells().map(c => c.join(",")); })()`);
    t.check("autumn: the pumpkins stand beside the landing (8,11 and 10,11), never on it or in the doorway", JSON.stringify(WALK2) === JSON.stringify(["8,11", "10,11"]), WALK2);
    // nothing (standing or lying) on the hearth rug, the runner from the door, the landing or the doorway
    const OVER = await J(`(function(){
        const keep = [[8,5],[9,5],[10,5],[8,6],[9,6],[10,6],[9,8],[9,9],[9,10],[9,11],[9,12]];
        const out = [];
        for (const d of [14, 35, 60, 98]) { $gameSystem._dayNightDay = d; HomeDecor.refresh();
            for (const b of HomeDecor.shownBoxes()) { const s = HomeDecor.SLOTS.find(q => q.id === b.ev.eventId()); if (!s || (s.prio === 0 && s.z === undefined)) continue;   // (on the walls / tables)
                for (const [x, y] of keep) if (b.x0 < x + 1 && b.x1 > x && b.y0 < y + 1 && b.y1 > y) out.push([d, b.look, x, y]); } }
        return out; })()`);
    t.check("no rug, pumpkin or sheaf over the hearth rug, the runner, the landing or the doorway (any season)", OVER.length === 0, OVER);
    // ================= the receipt
    await setDay(20);
    await ev("(function(){ $gameParty.gainGold(2500); Story.pay(2500); return 0; })()");
    const receipt = await t.until("(function(){ const e = $gameMap.event(985); return !!e && e._decorLook === 'pokwitowanie'; })()", 8, 150);
    const st = await J("{ done: Story.state().done, paid: Story.state().paid, got: HomeDecor.state().got.receipt }");
    t.check("Story.pay(2500): the debt is paid and the Lord's receipt hangs framed in grandpa's alcove (by itself, no refresh called)", receipt && st.done > 0 && st.got > 0, st);
    await setDay(88);
    L = await looks();
    t.check("in winter the receipt and the Holy Mother have spruce twigs over them", L.rama === "pokwitowanie_zima" && L.recznik === "recznik_zima", L);
    // ================= the keepsakes (the hero's kills through Hunting's own path; the dog's do not count)
    await setDay(20);
    const kill = (kind, how) => J(`(function(){ const a = Hunting.spawn("${kind}", 12, 9); a._frozen = true; a._wait = 9999; Hunting.hit(a, 99999, "${how}");
        const cs = Hunting.carcasses(); cs.splice(0, cs.length); return { dead: !!a._dead, got: HomeDecor.state().got["${kind}"] || 0, kills: HomeDecor.state().kills["${kind}"] || 0 }; })()`);
    const dogWolf = await kill("wolf", "dog");
    t.check("the dog's wolf is not the hero's trophy", dogWolf.dead && !dogWolf.got, dogWolf);
    const wolf = await kill("wolf", "spear");
    await t.frames(40);
    L = await looks();
    t.check("the hero's first wolf: its pelt lies by his bed", wolf.got > 0 && wolf.kills === 1 && L.skora === "skora", { wolf, skora: L.skora });
    const boar = await kill("boar", "shot");
    await t.frames(40);
    L = await looks();
    t.check("the first boar: its tusk hangs on a nail (no antlers yet)", boar.got > 0 && L.kiel === "kiel", { boar, kiel: L.kiel });
    const deer = await kill("deer", "melee");
    await t.frames(40);
    L = await looks();
    t.check("the first deer: the antlers over his bed, the tusk moves onto them", deer.got > 0 && L.rogi === "rogi" && L.kiel === "kiel_rog", { deer, rogi: L.rogi, kiel: L.kiel });
    await ev("(function(){ $gameSystem._tavernShift = Object.assign({ done: 0, best: 0, earned: 0, last: null }, $gameSystem._tavernShift || {}); $gameSystem._tavernShift.done = 1; Tawerna.emit('shiftDone', { grade: 3, pay: 18, level: 0 }); return 0; })()");
    const tank = await t.until("$gameMap.event(983)._decorLook === 'polka_kufel'", 8, 150);
    t.check("the first Borgar shift: a pewter tankard on his shelf", tank, (await looks()).polka);
    await ev("(function(){ TavernDice.stats(); $gameSystem._dice.wins = 1; Tawerna.emit('diceWin', { rival: 'grum', stake: 5, pot: 10 }); return 0; })()");
    const dice = await t.until("$gameMap.event(983)._decorLook === 'polka_oba'", 8, 150);
    t.check("the first dice win: his dice beside the tankard", dice, (await looks()).polka);
    await ev("(function(){ const q = QuestBoard.state(); q.stats.done = 1; q.history.unshift({ id: 't1', title: 'Wilki pod lasem', state: 'done', day: 20 }); Tawerna.emit('questDone', { id: 't1', kind: 'hunt', gold: 20, title: 'Wilki pod lasem' }); return 0; })()");
    const notice = await t.until("$gameMap.event(982)._decorLook === 'list'", 8, 150);
    t.check("the first contract done: its notice pinned by his bed (with its title)", notice && (await ev("HomeDecor.state().noticeTitle")) === "Wilki pod lasem", await ev("HomeDecor.state().noticeTitle"));
    const got = await J("HomeDecor.state().got");
    t.check("every keepsake is kept with the day it came", ["receipt", "wolf", "boar", "deer", "tankard", "dice", "notice"].every(k => got[k] > 0), got);
    // they stay (other plugins' states going back do not take them away)
    await ev("(function(){ $gameSystem._tavernShift.done = 0; $gameSystem._dice.wins = 0; HomeDecor.refresh(); return 0; })()");
    await t.frames(10);
    t.check("keepsakes stay once earned", (await looks()).polka === "polka_oba");
    // ================= the action button (O) and the mouse
    await clearNotices();
    await ev("(function(){ $gameMap._interpreter.clear(); $gameMessage.clear(); return 0; })()");
    await t.locate(3, 4, 8);
    await t.frames(20);
    await t.key("O");
    const l1 = await J("{ line: HomeDecor.lastLine, key: HomeDecor.lastKey }");
    await t.frames(10);
    await t.key("O");
    const l2 = await J("{ line: HomeDecor.lastLine, key: HomeDecor.lastKey }");
    const want = await J("[HomeDecor.LINES.kufel, HomeDecor.LINES.kosci]");
    const bubble = await ev("!!(window.SpeechBubbles && SpeechBubbles.barks && SpeechBubbles.barks.length !== undefined ? SpeechBubbles.barks.length : true)");
    t.check("O under his shelf: the tankard's (or the dice's) memory in his bubble, O again: the other one", [l1.line, l2.line].sort().join("|") === want.slice().sort().join("|") && bubble, { l1, l2 });
    await t.frames(150);
    await t.locate(3, 7, 8);
    await t.frames(20);
    await t.key("O");
    const l3 = await J("{ line: HomeDecor.lastLine, want: HomeDecor.LINES.skora }");
    t.check("O at the wolf pelt: „" + l3.want + "”", l3.line === l3.want, l3);
    await t.frames(150);
    await t.locate(17, 6, 8);
    await t.frames(20);
    const order = await J("HomeDecor.candidates().map(c => c.b.key)");
    let l4 = null;
    for (let i = 0; i < order.length; i++) {
        await t.key("O"); await t.frames(6);
        const k = await ev("HomeDecor.lastKey");
        if (k === "pokwitowanie") { l4 = await J("{ line: HomeDecor.lastLine, gp: HomeDecor.LINES.pokwitowanieDziadek, text: HomeDecor.LINES.pokwitowanie, grandpa: !!(Story.npc && Story.npc('grandpa')) }"); break; }
    }
    t.check("O at the receipt (from grandpa's alcove, O again to it): grandpa's words while he is in the room", !!l4 && (l4.grandpa ? l4.line === l4.gp : l4.line === l4.text), { order, l4 });
    await t.frames(150);
    // the mouse over the antlers: the line beside the cursor (the hero in his alcove: the camera shows its wall)
    await t.locate(3, 5);
    await t.frames(20);
    const pos = await J(`(function(){ const b = HomeDecor.shownBoxes().find(q => q.look === "rogi"); const s = SceneManager._scene._spriteset._characterSprites.find(sp => sp._character === b.ev);
        const p = s.worldTransform.apply(new PIXI.Point((b.px[0] + b.px[2]) / 2 - s.patternWidth() / 2, (b.px[1] + b.px[3]) / 2 - s.patternHeight())); return [p.x, p.y]; })()`);
    await t.mouseMove(pos[0], pos[1]);
    await t.frames(15);
    const hov = await J("{ key: HomeDecor.hover && HomeDecor.hover.key, tip: !!(SceneManager._scene._decorTip && SceneManager._scene._decorTip.visible), text: SceneManager._scene._decorTip && SceneManager._scene._decorTip._text }");
    t.check("the mouse over the antlers: its memory on a small plate by the cursor", hov.key === "rogi" && hov.tip && hov.text === (await ev("HomeDecor.LINES.rogi")), hov);
    await t.mouseMove(640, 700);
    await t.frames(15);
    t.check("the plate goes when the mouse leaves", !(await ev("SceneManager._scene._decorTip.visible")));
    // ================= screenshots (the map's zoom 1.5): the seasons, the hero's alcove, the receipt
    await ev("(function(){ $gamePlayer.locate(9, 7); $gamePlayer.setDirection(2); $gamePlayer.setTransparent(false); return 0; })()");
    const hideTip = "(function(){ const t = SceneManager._scene._decorTip; if (t) t.visible = false; return 0; })()";
    await t.mouseMove(1279, 719);
    const seasonShots = [[14, "ozdoby_wiosna.png"], [35, "ozdoby_lato.png"], [60, "ozdoby_jesien.png"], [98, "ozdoby_zima_wigilia.png"]];
    for (const [d, file] of seasonShots) {
        await setDay(d, 12);
        await clearNotices();
        await t.locate(12, 8, 2);
        await ev(hideTip);
        await shot(file, [9.5, 6.0]);
    }
    await setDay(60, 12);
    await t.locate(13, 9);
    await shot("ozdoby_jesien_drzwi.png", [9.5, 7.2], [3.5, 6.2, 12, 6.8]);
    await setDay(35, 12);
    await t.locate(3, 6, 8);
    await shot("ozdoby_wneka_bohatera.png", [8.9, 5.0], [0.6, 0.6, 4.6, 6.8]);
    await t.locate(16, 7, 8);
    await shot("ozdoby_pokwitowanie.png", [10.1, 5.0], [14.2, 0.6, 4.2, 4.4]);
    t.check("screenshots: " + ["ozdoby_wiosna", "ozdoby_lato", "ozdoby_jesien", "ozdoby_jesien_drzwi", "ozdoby_zima_wigilia", "ozdoby_wneka_bohatera", "ozdoby_pokwitowanie"].join(", "),
        ["ozdoby_wiosna.png", "ozdoby_lato.png", "ozdoby_jesien.png", "ozdoby_jesien_drzwi.png", "ozdoby_zima_wigilia.png", "ozdoby_wneka_bohatera.png", "ozdoby_pokwitowanie.png"].every(f => fs.existsSync(path.join(SHOTS, f))));
    await ev("window.__focus = null; 0");
    // ================= a game saved before HomeDecor: the events come, its past counts (quietly)
    const old = await J(`(function(){
        const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents()));
        delete c.system._homeDecor;
        if (c.system._tw) delete c.system._tw.homeDecor;   // (its state in the core's place since stage 2)
        for (const s of HomeDecor.SLOTS) if (c.map._events[s.id]) c.map._events[s.id] = null;
        if (c.system._tw) delete c.system._tw.hunt;   // (Hunting's state in the core's place since stage 3: an older save has only _hunt)
        c.system._hunt = c.system._hunt || { kills: {}, killed: {} }; c.system._hunt.kills.wolf = 3; c.system._hunt.kills.deer = 0; c.system._hunt.kills.boar = 0;
        c.system._tavernShift = { done: 2, best: 1, earned: 30, last: null };
        if (c.system._tw) delete c.system._tw.tavernShift;   // (TavernShift's state in the core's place since stage 3: an older save has only the old key)
        DataManager.extractSaveContents(c);
        SceneManager.goto(Scene_Map);
        return { had: HomeDecor.SLOTS.filter(s => !!$gameMap._events[s.id]).length }; })()`);
    await t.until(t.onMap(19), 30, 150);
    await t.frames(30);
    const after = await J("{ events: HomeDecor.SLOTS.filter(s => !!$gameMap.event(s.id)).length, got: HomeDecor.state().got, seeded: HomeDecor.state().seeded, skora: $gameMap.event(984)._decorLook, polka: $gameMap.event(983)._decorLook, rama: $gameMap.event(985)._decorLook }");
    t.check("an older save (no HomeDecor state, no decoration events): the events are added on load", old.had === 0 && after.events === 19, { old, after });
    t.check("... and its past counts at once: the wolf tally -> the pelt, Borgar's shifts -> the tankard, the paid debt -> the receipt", after.seeded === 1 && after.got.wolf > 0 && !after.got.deer && after.got.tankard > 0 && after.got.receipt > 0 &&
        after.skora === "skora" && after.polka === "polka_kufel" && /^pokwitowanie/.test(after.rama), after);
});
