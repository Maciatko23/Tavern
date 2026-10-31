// The town's building interiors (maps 102-110, tools/interiors, user 2026-10-04: "the doors should lead into real interiors"):
// every door of Map008 opens by day (the action button facing it) into its interior, the hero stands on the landing facing up;
// walking down onto the doorway takes him back in front of the same door facing down; at night the door is closed (the
// "Zamknięte." popup, no transfer) - except the bell tower, open at any hour; every interior is fully reachable from its
// landing by the game's own walking rules (Game_Player.canPass: tiles, events, <Occupy>); the residents' spots
// "Miejsce: <key>_wnetrze" exist where tools/interiors placed them (below the characters, through, facing their way).
// Shots: docs/wnetrza/gra_<map>.png (the hero on the landing, 13:00).
const path = require("path");
const fs = require("fs");
const kit = require("./lib/kit.js");
const DATA = path.join(__dirname, "..", "data");
const SHOTS = path.join(__dirname, "..", "docs", "wnetrza");
const readMap = id => JSON.parse(fs.readFileSync(path.join(DATA, "Map" + String(id).padStart(3, "0") + ".json"), "utf8"));
const transferOf = e => { for (const p of e.pages) for (const c of p.list) if (c.code === 201) return c.parameters.slice(1, 5); return null; };

// (2026-10-31: tools/interiors/staging is gone - it was deleted when the town was rebuilt. The doors and the interiors are read from the
// installed maps: every event of Map008 whose page transfers into maps 102-110 (the interiors tools/interiors made) - by what it DOES, not by
// its name: the doors the user drew in the editor are "EV124" (-> 110), "EV134" (-> 105), "EV137" (-> 107), "EV141" (-> 106); the landing is the
// door's transfer, the cell in front of the door is (x, y + 1), the way out is the interior's own "Drzwi" event.) The residents' spots are the ones tools/interiors placed.
const RESIDENTS = { 102: [{ key: "piekarka", x: 13, y: 5, dir: 2 }], 103: [{ key: "kupiec", x: 12, y: 5, dir: 2 }], 104: [{ key: "soltys", x: 7, y: 4, dir: 2 }],
    105: [{ key: "kowal", x: 9, y: 6, dir: 4 }], 106: [{ key: "garbarz", x: 6, y: 8, dir: 8 }], 107: [{ key: "woziwoda", x: 7, y: 5, dir: 8 }],
    108: [{ key: "dzwonnik", x: 5, y: 8, dir: 8 }], 109: [{ key: "zosia", x: 11, y: 5, dir: 2 }, { key: "bronek", x: 13, y: 6, dir: 4 }] };
const doors = [], metas = [];
for (const e of readMap(8).events) {
    const to = e ? transferOf(e) : null;
    if (!to || to[0] < 102 || to[0] > 110) continue;
    const inside = readMap(to[0]);
    const back = inside.events.find(x => x && /^(Drzwi|Tylne drzwi)/.test(x.name) && (transferOf(x) || [])[0] === 8 && (transferOf(x) || [])[1] === e.x && (transferOf(x) || [])[2] === e.y + 1);
    if (!back) continue;
    if (!metas.some(m => m.id === to[0])) metas.push({ id: to[0], display: inside.displayName, residents: RESIDENTS[to[0]] || [] });
    doors.push({ map: to[0], name: inside.displayName, door: e.id, town: [e.x, e.y + 1], landing: [to[1], to[2], to[3]], exit: [back.x, back.y] });
}
const ALWAYS_OPEN = new Set([236]);

// walks into the door from its front cell (the doors are "player touch", like the tavern's gate) once the map is settled
// (no fade, no event running); again if nothing started (a step during a fade-in is not taken)
async function knock(t, d) {
    await t.locate(d.town[0], d.town[1], 8);
    await t.until("!SceneManager._scene.isFading() && !$gameMap.isEventRunning() && !$gameMessage.isBusy()", 10, 100);
    for (let i = 0; i < 3; i++) {
        await t.locate(d.town[0], d.town[1], 8);
        await t.frames(3);
        await t.eval("window.__doorRan = false; 0");
        await t.hold("up", 20);
        if (await t.until(`window.__doorRan || $gameMap.isEventRunning() || $gamePlayer.isTransferring() || !${t.onMap(8)}`, 2, 50)) return true;
    }
    return false;
}

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 8, x: 53, y: 55, dir: 2, hour: 12, quiet: true, minimap: false });
    await t.eval(`(function(){ const _s = Game_Event.prototype.start; Game_Event.prototype.start = function() { if (/^Drzwi: /.test(this.event().name)) window.__doorRan = true; return _s.apply(this, arguments); }; return 0; })()`);
    t.check("9 interiors, 11 doors of the town lead into the interiors 102-110 (read from the installed maps, the editor doors EV124/134/137/141 too)", metas.length === 9 && doors.length === 11, doors.map(d => d.door));
    const shot = {};
    for (const d of doors) {
        // ---- by day: in
        if (!(await t.eval(t.onMap(8)))) await t.go(8, d.town[0], d.town[1], 8);
        await t.setHour(13);
        const knocked = await knock(t, d);
        const inOk = await t.until(t.onMap(d.map), 20);
        await t.frames(10);
        const at = await t.json("[$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), $gameMap.mapId()]");
        t.check(`door ${d.door} (${d.town}) by day -> ${d.name} (Map${d.map}) on its landing ${d.landing.slice(0, 2)} facing up`,
            inOk && at[0] === d.landing[0] && at[1] === d.landing[1] && at[2] === 8, { at, want: d.landing, knocked,
            front: await t.json(`$gameMap.eventsXy(${d.town[0]}, ${d.town[1] - 1}).map(e => [e.eventId(), e.event().name, e._trigger, e._priorityType, e.list().length])`) });
        if (!inOk) continue;
        if (!shot[d.map]) {
            shot[d.map] = true;
            // ---- reachability by the game's own rules, from this landing
            // (2026-10-31: the town's residents (TownLife.js, event ids 900+) stand in their houses and walk away - a girl in the aisle is not a
            // wall: they are made pass-through for the walk and put back; the interior's own events and tiles count as always)
            const r = await t.json(`(function(){ const w = $gameMap.width(), h = $gameMap.height(), p = $gamePlayer, key = (x, y) => x + "," + y;
                const people = $gameMap.events().filter(e => e.eventId() >= 900 && !e.isThrough()); for (const e of people) e._through = true;
                const open = (x, y) => [2, 4, 6, 8].some(dd => $gameMap.isPassable(x, y, dd)) && !p.isCollidedWithCharacters(x, y);
                const start = [p.x, p.y], seen = new Set([key(...start)]), todo = [start];
                while (todo.length) { const [x, y] = todo.pop();
                    for (const [dd, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) { const nx = x + dx, ny = y + dy;
                        if (seen.has(key(nx, ny)) || !$gameMap.isValid(nx, ny) || !p.canPass(x, y, dd)) continue;
                        seen.add(key(nx, ny)); todo.push([nx, ny]); } }
                const closed = [];
                for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (open(x, y) && !seen.has(key(x, y))) closed.push([x, y]);
                for (const e of people) e._through = false;
                return { reached: seen.size, closed }; })()`);
            t.check(`${d.name}: every open cell is reachable from the landing (${r.reached} cells)`, r.closed.length === 0, r.closed);
            const meta = metas.find(m => m.id === d.map);
            const spots = await t.json(`$gameMap.events().filter(e => /^Miejsce: /.test(e.event().name)).map(e => ({ n: e.event().name, x: e.x, y: e.y,
                d: e.event().pages[0].image.direction, prio: e.event().pages[0].priorityType, through: e.event().pages[0].through, list: e.event().pages[0].list.length }))`);
            const want = meta.residents.map(r => ({ n: "Miejsce: " + r.key + "_wnetrze", x: r.x, y: r.y, d: r.dir }));
            t.check(`${d.name}: the residents' spots ${want.map(w => w.n.slice(9)).join(", ") || "(none)"} are there, invisible and out of the way`,
                want.length === spots.length && want.every(w => spots.some(s => s.n === w.n && s.x === w.x && s.y === w.y && s.d === w.d && s.prio === 0 && s.through && s.list === 1)),
                { want, spots });
            await t.frames(20);
            fs.mkdirSync(SHOTS, { recursive: true });
            await t.shot(path.join(SHOTS, "gra_" + d.map + ".png"));
        }
        // ---- out: walk down onto the doorway
        await t.locate(d.landing[0], d.landing[1], 2);
        await t.frames(2);
        await t.hold("down", 40);
        const outOk = await t.until(t.onMap(8), 20);
        await t.frames(10);
        const back = await t.json("[$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()]");
        t.check(`${d.name} -> out through the doorway ${d.exit}: in front of door ${d.door} at ${d.town} facing down`,
            outOk && back[0] === d.town[0] && back[1] === d.town[1] && back[2] === 2, { back, want: d.town });
    }
    // ---- at night (23:00; the clock only goes forward - a jump back would be a new day and its summary): closed, the bell tower open
    await t.setHour(23);
    await t.frames(20);
    await t.dismiss();
    for (const d of doors) {
        if (!(await t.eval(t.onMap(8)))) await t.go(8, d.town[0], d.town[1], 2);
        await t.popups({ clear: true });
        await knock(t, d);
        if (ALWAYS_OPEN.has(d.door)) {
            const ok = await t.until(t.onMap(d.map), 20);
            t.check(`door ${d.door} (${d.name}) is open at night too`, ok);
            await t.go(8, d.town[0], d.town[1], 2);
        } else {
            await t.frames(40);
            const pops = await t.popups();
            const still = await t.json("[$gameMap.mapId(), $gamePlayer.isTransferring()]");
            t.check(`door ${d.door} (${d.name}) at 23:00: "Zamknięte." and no way in`, still[0] === 8 && !still[1] && pops.some(p => /Zamknięte/.test(p)), { still, pops });
        }
    }
});
