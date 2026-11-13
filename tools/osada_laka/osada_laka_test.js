// Osada Milczących na łące Laka pod Gawra (Map004) - 2026-11-11 (tools/osada_laka/popraw.py, docs/osada_laka):
//   - Map013: the gate "Brama Milczących" (6,27) and its two posts are gone - the gap in the wall is an open passage, both ways
//   - no transfer of any map leads to the old Map120 any more (the file stays, nothing reaches it)
//   - Map004: the settlement (palisade x 20..54, y 36..56, the gate (66,56)): before switch 16 the inside cannot be reached on foot from
//     the meadow, the gate itself is solid; after it every marker of the Osada, every hut door and the grove spot can
//   - the four huts: walk into the door -> the interior (Map121-124) on its landing, walk out -> back before the door on Laka pod Gawra
//   - the Silent by day: the elder at the circle, the others at home; at night nobody outside
//   - the grove of the Silent (Zakon): seven white stones on the meadow north of the settlement, reachable on foot
//   - shots of every screen of the area: docs/osada_laka/gra_*.png
// CDP_PORT=9420 GAME_OVERLAY=tools/osada_laka/staging GAME_OVERLAY_JS=1 node tools/osada_laka/staging/tests/osada_laka_test.js  (before the install)
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "osada_laka");

const HUTS = [
    { id: 121, name: "Wspólna izba", door: "Drzwi chaty 1", front: [54, 44], out: "Milcząca przy grządce", home13: true },
    { id: 122, name: "Chata tkaczki", door: "Drzwi chaty 2", front: [75, 42], out: "Milcząca przy ścianie", home13: true },
    { id: 123, name: "Chata Najstarszego", door: "Drzwi chaty 3", front: [75, 53], out: "Najstarszy z Milczących", home13: false },
    { id: 124, name: "Chata rzeźbiarza", door: "Drzwi chaty 4", front: [54, 53], out: "Milczący przy ścianie", home13: true },
];
const KEYS = ["osada_krag", "osada_sciana", "osada_grum", "osada_starszy", "osada_dom_1", "osada_dom_2", "osada_dom_3", "osada_dom_4"];
const GROVE = [75, 30];
const where = "({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction() })";
const SEEN = n => `(function(){ const e = $gameMap.events().find(e => e.event().name === ${JSON.stringify(n)}); if (!e) return "missing";
    return e.characterName() && e.isNormalPriority() && !e.isThrough() ? "here" : "gone"; })()`;
const REACH = (x, y) => `(function(){
    const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[${x}, ${y}]];
    const blocked = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
    seen[${y} * W + ${x}] = 1;
    while (q.length) { const [x, y] = q.pop();
        for (const [dx, dy, d] of [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]]) { const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
            if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blocked(nx, ny)) continue;
            seen[ny * W + nx] = 1; q.push([nx, ny]); } }
    window.__reach = seen; return seen.reduce((a, b) => a + b, 0); })()`;
const MARKERS = `(function(){ const o = {}; for (const e of $gameMap.events()) { const m = /^Miejsce:\\s*(\\S+)/.exec(e.event().name);
    if (m) o[m[1]] = [e.x, e.y]; } return o; })()`;
const REACHED = keys => `(function(){ const M = ${MARKERS}, W = $gameMap.width(), out = {};
    for (const k of ${JSON.stringify(keys)}) { const m = M[k]; if (!m) { out[k] = "missing"; continue; }
        const at = (x, y) => x >= 0 && y >= 0 && x < W && y < $gameMap.height() && !!window.__reach[y * W + x];
        out[k] = at(m[0], m[1]) || at(m[0], m[1] + 1) || at(m[0], m[1] - 1) || at(m[0] - 1, m[1]) || at(m[0] + 1, m[1]); } return out; })()`;
const CELL = (x, y) => `!!window.__reach[${y} * $gameMap.width() + ${x}]`;

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const fs = require("fs");
    fs.mkdirSync(SHOTS, { recursive: true });
    const bump = async (key, frames = 40) => {
        await t.eval(`(function(){ Input.clear(); Input._currentState["${key}"] = true; return 0; })()`);
        await t.frames(frames);
        await t.eval(`(function(){ Input._currentState["${key}"] = false; return 0; })()`);
        await t.frames(10);
    };
    const sw = (id, v) => t.eval(`(function(){ $gameSwitches.setValue(${id}, ${v}); $gameMap.requestRefresh(); return 0; })()`);

    // ================================================================ Map013: the gate is gone, the passage is open both ways
    await t.newGame({ map: 13, x: 6, y: 31, dir: 8, day: 3, hour: 13, quiet: true, minimap: false });
    await t.frames(40);
    const gone = await t.json(`$gameMap.events().filter(e => /Brama Milczących|Słup bramy/.test(e.event().name)).length`);
    const solidAt = await t.json(`[[6, 27], [5, 27], [7, 27]].map(([x, y]) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough()))`);
    t.check("Map013: no gate 'Brama Milczących' and no posts any more; nothing solid in its old cells (5-7, 27)", gone === 0 && solidAt.every(v => v === false), { gone, solidAt });
    await t.json(REACH(6, 31));
    const through = await t.json(`({ n: ${CELL(6, 22)}, s: ${CELL(6, 31)} })`);
    t.check("...on foot (the game's own rules) one gets from the forest path (6,31) through the gap to the plateau north of it (6,22)", through.n && through.s, through);
    await t.shot(path.join(SHOTS, "gra_brama13_po.png"));
    await bump("up", 360);
    const up = await t.json(where);
    t.check("...walking up from (6,31) the hero passes the old gate cells and stays on Map013 (y <= 25)", up.map === 13 && up.y <= 25, up);
    await bump("down", 420);
    const down = await t.json(where);
    t.check("...and back down: y >= 30", down.map === 13 && down.y >= 30, down);

    // ================================================================ nothing leads to the old Map120
    const leaks = await t.json(`(async function(){ const bad = []; for (const id of [4, 13, 22, 121, 122, 123, 124, 159, 934]) {
        const r = await fetch("data/Map" + String(id).padStart(3, "0") + ".json"); const m = await r.json();
        for (const e of m.events) if (e) for (const p of e.pages) for (const c of p.list) if (c.code === 201 && c.parameters[0] === 0 && c.parameters[1] === 120) bad.push([id, e.id, e.name]); }
        return bad; })()`).catch(() => null);
    t.check("no transfer on Map004, 013, 022, 121-124, 159, 934 leads to Map120", Array.isArray(leaks) && leaks.length === 0, leaks);

    // ================================================================ the Osada's events are injected (Osada.js, ids 5300-5399), not in the map file
    const file3 = await t.json(`fetch("data/Map004.json").then(r => r.json()).then(m => m.events.length)`);
    t.check("data/Map004.json keeps its own events only (length <= 417: nothing of the Osada, ids stay below 500)", file3 <= 417, file3);
    await t.go(4, 66, 58, 8);
    const inj = await t.json(`({ n: (Tawerna.injected(4).Osada || []).length, lo: Math.min(...(Tawerna.injected(4).Osada || [0])), hi: Math.max(...(Tawerna.injected(4).Osada || [0])) })`);
    t.check("Tawerna.injected(4).Osada: 81 events in the band 5300-5399", inj.n === 81 && inj.lo === 5300 && inj.hi <= 5399, inj);

    // ================================================================ Laka pod Gawra: the settlement
    await t.go(4, 66, 58, 8);
    await t.setHour(13);
    await t.frames(60);
    await sw(16, false);
    await t.json(REACH(66, 58));
    const shut = await t.json(REACHED(KEYS));
    t.check("switch 16 off: from the meadow before the gate (66,58) no marker inside the palisade is reachable", KEYS.every(k => shut[k] === false), shut);
    const grove0 = await t.json(CELL(GROVE[0], GROVE[1]));
    t.check("...but the grove of the Silent (75,30) on the meadow is (the way round the palisade)", grove0 === true, grove0);
    const brama = await t.json(`(function(){ const e = $gameMap.events().find(e => e.event().name === "Brama Milczących"); return e ? [e.x, e.y, e.isNormalPriority()] : null; })()`);
    t.check("the gate event stands in the south wall (66,56), solid", brama && brama[0] === 66 && brama[1] === 56 && brama[2] === true, brama);
    await t.locate(66, 57, 8);
    await t.popups({ clear: true });
    await t.press("ok");
    await t.frames(25);
    const pop = (await t.popups({ clear: true })).join(" | ");
    t.check("...the action button before the shut gate: a popup 'Brama z pali, zamknięta od środka'", /Brama z pali/.test(pop), pop);
    await t.shot(path.join(SHOTS, "gra_brama_osady.png"));

    await sw(16, true);
    await t.frames(10);
    await t.json(REACH(66, 58));
    const open = await t.json(REACHED(KEYS));
    t.check("switch 16 on: through the open gate every marker of the Osada is reachable on foot", KEYS.every(k => open[k] === true), open);
    const doors = await t.json(`$gameMap.events().filter(e => /^Drzwi chaty \\d$/.test(e.event().name)).map(e => [e.event().name, e.x, e.y, (e.event().pages[0].list.find(c => c.code === 201) || {}).parameters])`);
    t.check("Laka pod Gawra: four hut doors, touched -> Map121-124", doors.length === 4 && HUTS.every(h => doors.some(d => d[0] === h.door && d[3] && d[3][1] === h.id && d[1] === h.front[0] - 0 && d[2] === h.front[1] - 1)), doors);
    const fronts = await t.json(`${JSON.stringify(HUTS.map(h => h.front))}.map(([x, y]) => !!window.__reach[y * $gameMap.width() + x])`);
    t.check("...and the cell in front of every door is reachable from the gate", fronts.every(v => v === true), fronts);
    await t.locate(66, 55, 8);
    await bump("up", 20);
    const grove = await t.json(`({ stones: [2850, 2851, 2852, 2853, 2854, 2855, 2856].map(i => { const e = $gameMap.event(i); return e ? [e.x, e.y] : null; }), centre: !!$gameMap.event(2857) })`);
    t.check("the grove (Zakon): the seven white stones and the centre are on Laka pod Gawra round (75,30)",
        grove.stones.every(s => s && Math.abs(s[0] - GROVE[0]) <= 4 && Math.abs(s[1] - GROVE[1]) <= 4) && grove.centre, grove);

    // ================================================================ the Silent by day / night
    await t.setHour(13);
    await t.frames(70);
    const out13 = {};
    for (const h of HUTS) out13[h.out] = await t.json(SEEN(h.out));
    t.check("13:00: the elder at the circle, the other three at home (not at their places)",
        out13["Najstarszy z Milczących"] === "here" && HUTS.filter(h => h.home13).every(h => out13[h.out] === "gone"), out13);
    await t.setHour(23);
    await t.frames(90);
    const out23 = {};
    for (const h of HUTS) out23[h.out] = await t.json(SEEN(h.out));
    t.check("23:00: all four Silent at home, nobody outside", HUTS.every(h => out23[h.out] === "gone"), out23);
    await t.setHour(13);
    await t.frames(70);

    // ================================================================ the huts: in and out
    for (const h of HUTS) {
        if (!(await t.eval(t.onMap(4)))) await t.go(3, h.front[0], h.front[1], 8);
        await t.locate(h.front[0], h.front[1], 8);
        await t.until("!SceneManager._scene.isFading() && !$gameMap.isEventRunning()", 10, 100);
        await t.hold("up", 24);
        const inOk = await t.until(t.onMap(h.id), 20);
        await t.until("!$gamePlayer.isTransferring() && !$gameMap.isEventRunning()", 10, 100);
        await t.frames(40);
        const at = await t.json(where);
        t.check(`${h.name}: walking into the door ${h.door} -> Map${h.id}`, inOk && at.map === h.id, at);
        if (!inOk) continue;
        await t.locate(at.x, at.y, 2);
        await t.frames(2);
        await t.hold("down", 40);
        const outOk = await t.until(t.onMap(4), 20);
        await t.until("!$gamePlayer.isTransferring()", 10, 100);
        await t.frames(10);
        const b = await t.json(where);
        t.check(`${h.name}: out through the doorway -> Laka pod Gawra before the door (${h.front}) facing down`, outOk && b.x === h.front[0] && b.y === h.front[1] && b.d === 2, { b, want: h.front });
        await t.calm();
    }

    // ================================================================ shots of every screen
    await t.setHour(13);
    await t.calm();
    const SPOTS = [["nw", 55, 42], ["ne", 75, 40], ["sw", 55, 52], ["se", 75, 52], ["brama", 66, 59], ["gaj", 75, 32], ["pn", 66, 33], ["wschod", 85, 46]];
    for (const [n, x, y] of SPOTS) {
        await t.locate(x, y, 2);
        await t.frames(40);
        await t.shot(path.join(SHOTS, "gra_" + n + ".png"));
    }
    await t.setHour(21);
    await t.frames(60);
    await t.locate(66, 58, 8);
    await t.frames(40);
    await t.shot(path.join(SHOTS, "gra_noc.png"));
    await t.setHour(13);
    await t.go(13, 6, 29, 8);
    await t.frames(40);
    await t.shot(path.join(SHOTS, "gra_brama13_po.png"));
});
