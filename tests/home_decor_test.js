// HomeDecor.js: grandpa's house changes with the story and the seasons - since 2026-11-17 the hut of the new world, Map224 (8 x 9;
// the old whitewashed cottage Map019 went with the old world). A new story game in the hut (kit: Map224 2,5); HomeDecor.js is put
// into the page when it is not registered yet. Checks: the folk touches always there (the wycinanka under the window, the rag runner
// by the door, the painted chest), the empty nail and then the Lord's receipt after Story.pay(2500) on the stone wall by the fire,
// each keepsake after its trigger (a wolf, a deer, a boar through Hunting's own kill path - not by the dog; a Borgar shift, a dice
// win, a contract), each season's things by the day (the jug and the basket on grandpa's chest, the herbs and the harvest wreath by
// the fire, the pumpkins by the chest), Christmas Eve only round the middle of winter (the sheaf in the corner; no table in the hut -
// nothing taken off it), no decoration on a walkway or the doorway (the free floor stays one piece and the door reachable), O in the
// house says nothing, an older save gets the events and its past, no console errors. Screenshots at the map's zoom 1.5:
// docs/dom_dziadka/ozdoby_*.png
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
    t.check("a new story game starts in grandpa's hut (Map224)", await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, settle: 20 }) && (await ev("$gameMap.mapId()")) === 224);
    await setDay(3, 11);
    const ART = await J("Object.keys(HomeDecor.DECOR_ART)");
    t.check("the generated art is in the plugin (29 looks)", ART.length === 29, ART.length);
    const evs = await J("HomeDecor.SLOTS.map(s => { const e = $gameMap.event(s.id); return e ? [s.id, e.x, e.y] : [s.id, null]; })");
    t.check("all " + evs.length + " decoration events of the hut's layout (980-998) are on the map where the slots say", evs.length === 14 && evs.every(e => e[1] !== null), evs.filter(e => e[1] === null));
    // ================= the folk touches: always
    let L = await looks();
    const folk = l => l.wyc_2 === "wyc_2" && l.chodnik === "chodnik" && l.skrzynia === "!House_Decor/skrzynia";
    t.check("the folk touches: the wycinanka under the window, the rag runner by the door, the painted chest", folk(L), L);
    t.check("before the debt is paid: an empty nail where the receipt will hang", L.rama === "gwozdz", L.rama);
    t.check("no keepsake yet in a new game", !L.rogi && !L.kiel && !L.list && !L.polka && !L.skora, L);
    // ================= the seasons
    const seasonCases = [
        [3, "spring", l => l.stol_p === "bazie" && !l.stol_l && !l.komin && !l.dynie_l && !l.snop],
        [14, "spring (Easter)", l => l.stol_p === "bazie" && l.stol_l === "pisanki"],
        [35, "summer", l => l.stol_p === "kwiaty" && l.komin === "ziola" && !l.stol_l && !l.dynie_r],
        [60, "autumn", l => l.komin === "wieniec" && l.stol_l === "jablka" && l.dynie_l === "dynie_l" && l.dynie_r === "dynie_r" && !l.stol_p],
        [88, "winter", l => !l.snop && !l.komin && !l.stol_p && !l.stol_l && !l.dynie_l],
        [98, "winter (Christmas Eve)", l => l.snop === "snop" && !l.stol_p && !l.stol_l],
        [115, "spring again (year 2)", l => l.stol_p === "bazie" && !l.snop]
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
    // Christmas Eve: no table in the hut - nothing is taken off one
    await setDay(98);
    const plateOff = await J("HomeDecor.tableCleared()");
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
        const free = bfs(5, 7);
        for (const [e, t, p] of keep) { e._through = t; e._priorityType = p; }
        const now = bfs(5, 7);
        const cells = HomeDecor.blockedCells().map(c => c.join(","));
        const lost = [...free].filter(k => !now.has(k) && !cells.includes(k));
        return { free: free.size, now: now.size, blocked: cells, lost, door: now.has("5,8"), landing: now.has("5,7") }; })()`);
    t.check("Christmas Eve: the sheaf is the only thing standing in the way (2,7: by the wall beside grandpa's chest)", JSON.stringify(WALK.blocked) === JSON.stringify(["2,7"]), WALK.blocked);
    t.check("the free floor stays one piece: every cell reachable before is reachable now (but the sheaf's)", WALK.lost.length === 0 && WALK.now === WALK.free - WALK.blocked.length, WALK);
    t.check("the door and the landing are reachable", WALK.door && WALK.landing, WALK);
    await setDay(101);
    t.check("Christmas Eve: no table in the hut - nothing taken off, nothing put back", plateOff === false && (await J("HomeDecor.tableCleared()")) === false);
    await setDay(60);
    const WALK2 = await J(`(function(){ return HomeDecor.blockedCells().map(c => c.join(",")); })()`);
    t.check("autumn: the pumpkins stand by the wall beside grandpa's chest (2,7 and 3,7), never on the landing, the doorway or the runner", JSON.stringify(WALK2) === JSON.stringify(["2,7", "3,7"]), WALK2);
    // nothing (standing or lying) on the hearth rug, the landing or the doorway; nothing standing on the runner by the door
    const OVER = await J(`(function(){
        const keep = [[4,5],[5,5],[6,5],[4,6],[5,6],[6,6],[5,7],[5,8]];
        const out = [];
        for (const d of [14, 35, 60, 98]) { $gameSystem._dayNightDay = d; HomeDecor.refresh();
            const boxes = HomeDecor.shownBoxes(), runner = boxes.find(b => b.look === "chodnik");
            for (const b of boxes) { const s = HomeDecor.SLOTS.find(q => q.id === b.ev.eventId()); if (!s || (s.prio === 0 && s.z === undefined) || s.prio === 2) continue;   // (on the walls / the chest)
                if (b.look === "chodnik") continue;   // (the runner itself lies by the door)
                for (const [x, y] of keep) if (b.x0 < x + 1 && b.x1 > x && b.y0 < y + 1 && b.y1 > y) out.push([d, b.look, x, y]);
                if (runner && b.x0 < runner.x1 && b.x1 > runner.x0 && b.y0 < runner.y1 && b.y1 > runner.y0) out.push([d, b.look, "runner"]); } }
        return out; })()`);
    t.check("no pelt, pumpkin or sheaf over the hearth rug, the landing or the doorway, and none on the runner (any season)", OVER.length === 0, OVER);
    // ================= the receipt
    await setDay(20);
    await ev("(function(){ $gameParty.gainGold(2500); Story.pay(2500); return 0; })()");
    const receipt = await t.until("(function(){ const e = $gameMap.event(985); return !!e && e._decorLook === 'pokwitowanie'; })()", 8, 150);
    const st = await J("{ done: Story.state().done, paid: Story.state().paid, got: HomeDecor.state().got.receipt }");
    t.check("Story.pay(2500): the debt is paid and the Lord's receipt hangs framed on the stone wall by the fire (by itself, no refresh called)", receipt && st.done > 0 && st.got > 0, st);
    await setDay(88);
    L = await looks();
    t.check("in winter the receipt has spruce twigs over it", L.rama === "pokwitowanie_zima", L);
    // ================= the keepsakes (the hero's kills through Hunting's own path; the dog's do not count)
    await setDay(20);
    const kill = (kind, how) => J(`(function(){ const a = Hunting.spawn("${kind}", 2, 6); a._frozen = true; a._wait = 9999; Hunting.hit(a, 99999, "${how}");
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
    t.check("the first contract done: its notice pinned on the stone wall over the herbs (with its title)", notice && (await ev("HomeDecor.state().noticeTitle")) === "Wilki pod lasem", await ev("HomeDecor.state().noticeTitle"));
    const got = await J("HomeDecor.state().got");
    t.check("every keepsake is kept with the day it came", ["receipt", "wolf", "boar", "deer", "tankard", "dice", "notice"].every(k => got[k] > 0), got);
    // they stay (other plugins' states going back do not take them away)
    await ev("(function(){ $gameSystem._tavernShift.done = 0; $gameSystem._dice.wins = 0; HomeDecor.refresh(); return 0; })()");
    await t.frames(10);
    t.check("keepsakes stay once earned", (await looks()).polka === "polka_oba");
    // ================= O in the house: no memory lines any more (the player 2026-11-11: „wywalić” - the decorations stay silent)
    await clearNotices();
    await ev("(function(){ $gameMap._interpreter.clear(); $gameMessage.clear(); return 0; })()");
    await t.locate(3, 4, 8);
    await t.frames(20);
    await t.key("O");
    await t.frames(20);
    const quiet = await J("{ msg: $gameMessage.hasText(), look: typeof HomeDecor.lookAround, tip: !!SceneManager._scene._decorTip }");
    t.check("O under his shelf: no memory line (no message, no look, no mouse plate)", !quiet.msg && quiet.look === "undefined" && !quiet.tip, quiet);
    // ================= screenshots (the map's zoom 1.5): the seasons, the hero's alcove, the receipt
    await ev("(function(){ $gamePlayer.locate(5, 6); $gamePlayer.setDirection(2); $gamePlayer.setTransparent(false); return 0; })()");
    const hideTip = "(function(){ const t = SceneManager._scene._decorTip; if (t) t.visible = false; return 0; })()";
    await t.mouseMove(1279, 719);
    const seasonShots = [[14, "ozdoby_wiosna.png"], [35, "ozdoby_lato.png"], [60, "ozdoby_jesien.png"], [98, "ozdoby_zima_wigilia.png"]];
    for (const [d, file] of seasonShots) {
        await setDay(d, 12);
        await clearNotices();
        await t.locate(5, 6, 2);
        await ev(hideTip);
        await shot(file, [4.0, 4.5]);
    }
    await setDay(60, 12);
    await t.locate(5, 6, 2);
    await shot("ozdoby_jesien_drzwi.png", [4.0, 4.5], [0.6, 5.2, 6.8, 3.8]);
    await setDay(35, 12);
    await t.locate(3, 6, 8);
    await shot("ozdoby_wneka_bohatera.png", [4.0, 4.5], [0.6, 0.6, 3.8, 7.6]);
    await t.locate(5, 6, 8);
    await shot("ozdoby_pokwitowanie.png", [4.0, 4.5], [3.6, 0.6, 3.8, 4.6]);
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
    await t.until(t.onMap(224), 30, 150);
    await t.frames(30);
    const after = await J("{ events: HomeDecor.SLOTS.filter(s => !!$gameMap.event(s.id)).length, got: HomeDecor.state().got, seeded: HomeDecor.state().seeded, skora: $gameMap.event(984)._decorLook, polka: $gameMap.event(983)._decorLook, rama: $gameMap.event(985)._decorLook }");
    t.check("an older save (no HomeDecor state, no decoration events): the events are added on load", old.had === 0 && after.events === 14, { old, after });
    t.check("... and its past counts at once: the wolf tally -> the pelt, Borgar's shifts -> the tankard, the paid debt -> the receipt", after.seeded === 1 && after.got.wolf > 0 && !after.got.deer && after.got.tankard > 0 && after.got.receipt > 0 &&
        after.skora === "skora" && after.polka === "polka_kufel" && /^pokwitowanie/.test(after.rama), after);
});
