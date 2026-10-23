// Underground.js's generator without the game (docs/PODZIEMIA.md): every band's chunk library (data/Map130, Map141-144) read the
// game's way, every chunk's own check (doors, stairs landings, containers reachable inside it), and the generated floors of many
// seeds: the same seed gives the same floor, another seed another; a walk from the stairs up to the stairs down (the band's tileset
// flags, blocking events); the floor's note of the order placed; every autotile a valid shape, no hole in the ground layer. The
// maze (2026-10-23): every floor 80x60 (Underground_Data.MAZE, as Kruczy Jar), every hall reached from the stairs up, the way
// stairs-stairs 2 tiles wide in the corridors, blind ends - each reached and holding something -, no wall face without its top
// outside the halls, the blind ends' guards of the band's contract, under 500 events, quick (a floor well under 100 ms). The
// hand-made floors (Map140, Map146-153, Map011): from the stairs up one walks to the stairs down, the lift, every note; floor 100's
// Heart only through the door of three locks. Floors map to their maps and back (1-9 own shells, 11-99 the ids 1000+N, every 10th
// hand-made).
"use strict";
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");
const ROOT = path.join(__dirname, "..", "..");
const readJson = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

unit.test(t => {
    const w = unit.load(["TawernaCore", "Underground_Data", "Underground"]);
    const U = w.Underground, D = w.Underground_Data;
    const tilesets = readJson("data/Tilesets.json");
    t.check("tileset 10 and band 2's tileset 12 have their 8192 passage flags", tilesets[10].flags.length === 8192 && tilesets[12].flags.length === 8192,
        [tilesets[10].flags.length, tilesets[12] && tilesets[12].flags.length]);

    const bands = D.BANDS.filter(b => b.chunkMap);
    const libs = {};
    for (const b of bands) {
        const lib = readJson("data/Map" + String(b.chunkMap).padStart(3, "0") + ".json");
        const chunks = U.parseLibrary(lib);
        libs[b.id] = { chunks, flags: tilesets[b.tileset || 10].flags, tileset: lib.tilesetId };
        t.check("band " + b.id + " (" + b.name + "): its library (Map" + b.chunkMap + ", tileset " + lib.tilesetId + ") has at least 10 chunks, each with a door on every side and a stairs place",
            lib.tilesetId === (b.tileset || 10) && chunks.length >= 10 && chunks.every(c => ["N", "S", "E", "W"].every(s => c.doors[s].length) && c.stairs.length >= 1),
            chunks.map(c => c.name + " " + c.w + "x" + c.h));
        const problems = chunks.map(c => [c.name, U.checkChunk(c, libs[b.id].flags)]).filter(p => p[1].length);
        t.check("band " + b.id + ": every chunk passes its own check (doors, stairs landings, containers reachable inside it)", problems.length === 0, problems);
    }
    // the creatures' contract (docs/PODZIEMIA.md "Stwory - kontrakt"): the kinds each band's chunks use
    const CONTRACT = { 1: ["szczur", "pajak"], 2: ["szczur", "pajak", "zbroja"], 3: ["pajak", "nietoperz", "topielec"], 4: ["zbroja", "kamiennik"], 5: ["upior", "cien"] };
    const kinds = {};
    for (const b of bands) kinds[b.id] = [...new Set([].concat(...libs[b.id].chunks.map(c => c.events.filter(e => e.tags.Stwor).map(e => String(e.tags.Stwor)))))];
    t.check("the chunks' creature places use only the contract's kinds of their band (1: szczur pajak, 2: + zbroja, 3: pajak nietoperz topielec, 4: zbroja kamiennik, 5: upior cien)",
        bands.every(b => kinds[b.id].length && kinds[b.id].every(k => CONTRACT[b.id].includes(k))), kinds);

    const c1 = libs[1].chunks, f1 = libs[1].flags;
    const same = JSON.stringify(U.generate(4, 4242, c1, { flags: f1 }).map) === JSON.stringify(U.generate(4, 4242, c1, { flags: f1 }).map);
    t.check("the same seed and floor give the same floor (tiles, events)", same);
    const a = U.generate(1, 1, c1, { flags: f1 }).map, b1 = U.generate(1, 2, c1, { flags: f1 }).map;
    t.check("another seed gives another floor", a.width !== b1.width || a.height !== b1.height || a.data.some((v, i) => v !== b1.data[i]));
    const deepSame = JSON.stringify(U.generate(57, 77, libs[4].chunks, { flags: libs[4].flags }).map) === JSON.stringify(U.generate(57, 77, libs[4].chunks, { flags: libs[4].flags }).map);
    t.check("...also deep down (floor 57, band 4)", deepSame);

    // the way from (x0, y0) to every cell (4 ways, the engine's passage rules of both sides, blocking events): prev cell index or -1
    const walk = (m, from, fl) => {
        const W = m.width, H = m.height, blocked = new Set(), prev = new Map([[from[1] * W + from[0], -1]]), q = [from[1] * W + from[0]];
        for (const e of m.events) if (e && e.pages[0].priorityType === 1 && !e.pages[0].through) blocked.add(e.y * W + e.x);
        const pass = (x, y, bit) => {
            if (x < 0 || y < 0 || x >= W || y >= H) return false;
            for (let z = 3; z >= 0; z--) {
                const id = m.data[(z * H + y) * W + x];
                if (!id && z > 0) continue;
                const f = fl[id] || 0;
                if (f & 0x10) continue;
                if ((f & bit) === 0) return true;
                if ((f & bit) === bit) return false;
            }
            return false;
        };
        const STEP = [[0, 1, 1, 8], [-1, 0, 2, 4], [1, 0, 4, 2], [0, -1, 8, 1]];
        for (let i = 0; i < q.length; i++) {
            const k = q[i], x = k % W, y = (k / W) | 0;
            for (const [dx, dy, out, back] of STEP) {
                const nx = x + dx, ny = y + dy, j = ny * W + nx;
                if (prev.has(j) || blocked.has(j) || !pass(x, y, out) || !pass(nx, ny, back)) continue;
                prev.set(j, k);
                q.push(j);
            }
        }
        return prev;
    };
    const kindOf = id => (id >= 2048 ? ((id - 2048) / 48) | 0 : -1);
    const isTopK = k => k >= 80 && ((k - 80) >> 3) % 2 === 0, isSideK = k => k >= 80 && ((k - 80) >> 3) % 2 === 1;
    const isFloorK = (m, x, y) => { const id = m.data[y * m.width + x], k = kindOf(id); return id > 0 && (id < 2048 || k < 48); };
    const times = [];
    for (const b of bands) {
        const bad = [], rooms = [], noNote = [], shapes = [], holes = [], ids = [], size = [], halls = [], narrow = [], ends = [], faces = [], guards = [];
        const floors = [];
        for (let f = b.from; f <= b.to; f++) if (!(b.handmade && b.handmade[f])) floors.push(f);
        const seeds = b.id === 1 ? 25 : 8;
        for (let s = 1; s <= seeds; s++) {
            const seed = (s * 2654435761) >>> 0;
            for (const f of floors) {
                const t0 = process.hrtime.bigint();
                const g = U.generate(f, seed, libs[b.id].chunks, { flags: libs[b.id].flags });
                times.push(Number(process.hrtime.bigint() - t0) / 1e6);
                const m = g.map, W = m.width, H = m.height, i = g.info, tag = seed + "/" + f;
                if (W !== D.MAZE.width || H !== D.MAZE.height) size.push(tag + ": " + W + "x" + H);
                if (!i.check.ok) bad.push(tag + ": " + i.check.why);
                if (i.rooms.length !== U.roomsOf(f, b)) rooms.push(tag + ": " + i.rooms.length);
                if (D.NOTES[f] && !i.notes.length) noNote.push(tag);
                if (m.events.length >= 500 || i.spawns.length > 40) ids.push(tag + ": " + m.events.length + " events, " + i.spawns.length + " creature places");
                for (let z = 0; z < 2; z++) for (let k = 0; k < W * H; k++) {
                    const id = m.data[z * W * H + k];
                    if (id < 2048) continue;
                    const kind = (id - 2048) / 48 | 0, shape = (id - 2048) % 48, side = kind >= 80 && ((kind - 80) >> 3) % 2 === 1;
                    const fall = kind >= 5 && kind < 16 && kind % 2 === 1;
                    if (side ? shape > 15 : fall ? shape > 3 : shape > 47) shapes.push(tag + " " + k);
                }
                for (let k = 0; k < W * H; k++) if (!m.data[k]) holes.push(tag + " " + (k % W) + "," + (k / W | 0));
                // every hall reached from the stairs up (every door cell of it); the way to the stairs down 2 tiles wide in the corridors
                const prev = walk(m, i.spots.up, libs[b.id].flags);
                for (const r of i.rooms) {
                    const c = libs[b.id].chunks.find(o => o.name === r.chunk);
                    const doors = [].concat(...["N", "S", "E", "W"].map(sd => c.doors[sd]));
                    if (!doors.every(([dx, dy]) => prev.has((r.y + dy) * W + r.x + dx))) halls.push(tag + ": " + r.chunk);
                }
                const inHall = (x, y) => i.rooms.some(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
                const dn = i.spots.down[1] * W + i.spots.down[0];
                if (prev.has(dn)) {
                    const path = [];
                    for (let k = dn; k !== -1; k = prev.get(k)) path.push([k % W, (k / W) | 0]);
                    for (let n = 1; n < path.length - 1; n++) {
                        const [x, y] = path[n];
                        if (inHall(x, y)) continue;
                        const horiz = path[n - 1][1] === y && path[n + 1][1] === y, vert = path[n - 1][0] === x && path[n + 1][0] === x;
                        const wide = horiz ? isFloorK(m, x, y - 1) || isFloorK(m, x, y + 1) : vert ? isFloorK(m, x - 1, y) || isFloorK(m, x + 1, y) : true;
                        if (!wide) { narrow.push(tag + " " + x + "," + y); break; }
                    }
                }
                // the blind ends: some on every floor, each reached and holding something (an event or a creature's place there or a few steps back)
                if (i.deadEnds.length < 5) ends.push(tag + ": " + i.deadEnds.length + " blind ends");
                for (const d of i.deadEnds) {
                    const near = m.events.some(e => e && Math.abs(e.x - d.x) + Math.abs(e.y - d.y) <= 4) || i.spawns.some(sp => Math.abs(sp.x - d.x) + Math.abs(sp.y - d.y) <= 4);
                    const reached = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => prev.has((d.y + dy) * W + d.x + dx));
                    if (!d.what.length || !near || !reached) { ends.push(tag + " " + d.x + "," + d.y + " " + d.what); break; }
                }
                // outside the halls: no wall face with floor right over it (a face without its top), no face one row tall
                for (let y = 1; y < H - 1; y++) for (let x = 0; x < W; x++) {
                    const k = kindOf(m.data[y * W + x]);
                    if (!isSideK(k) || inHall(x, y)) continue;
                    const ka = kindOf(m.data[(y - 1) * W + x]), kb = kindOf(m.data[(y + 1) * W + x]);
                    if ((!isSideK(ka) && !isTopK(ka)) || (isTopK(ka) && !isSideK(kb) && !isTopK(kb))) { faces.push(tag + " " + x + "," + y); break; }
                }
                for (const sp of i.spawns) if (sp.room === "zaulek" && !(CONTRACT[b.id] || []).includes(sp.kind)) guards.push(tag + " " + sp.kind);
            }
        }
        const label = "band " + b.id + ", floors " + floors[0] + "-" + floors[floors.length - 1] + " of " + seeds + " seeds";
        t.check(label + ": every floor " + D.MAZE.width + "x" + D.MAZE.height + " (as Kruczy Jar), with a walk from its stairs up to its stairs down",
            size.length === 0 && bad.length === 0, { size: size.slice(0, 5), bad: bad.slice(0, 5) });
        t.check(label + ": ...as many halls as the band says, each reached from the stairs up (every door of it); the order's note of its floor; under 500 events, at most 40 creature places",
            rooms.length === 0 && halls.length === 0 && noNote.length === 0 && ids.length === 0, { rooms: rooms.slice(0, 5), halls: halls.slice(0, 5), noNote: noNote.slice(0, 5), ids: ids.slice(0, 3) });
        t.check(label + ": ...the way stairs-stairs 2 tiles wide in every corridor (the side branches only 1); blind ends (5+), each reached and holding something; their guards of the band's contract",
            narrow.length === 0 && ends.length === 0 && guards.length === 0, { narrow: narrow.slice(0, 5), ends: ends.slice(0, 5), guards: guards.slice(0, 5) });
        t.check(label + ": ...every autotile has a valid shape (walls 16, waterfalls 4, floors 48), no ground cell is empty, outside the halls every wall face has its top (two rows)",
            shapes.length === 0 && holes.length === 0 && faces.length === 0, { shapes: shapes.slice(0, 5), holes: holes.slice(0, 5), faces: faces.slice(0, 5) });
    }
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length, p99 = times[Math.floor(times.length * 0.99)];
    t.check("a floor is made quickly: " + times.length + " floors, " + avg.toFixed(1) + " ms on average, 99% under " + p99.toFixed(1) + " ms (the slowest " + times[times.length - 1].toFixed(1) + " ms; well under 100 ms)",
        avg < 50 && p99 < 100, { avg, p99, max: times[times.length - 1] });
    // a floor of the Truth Layer has its places of whispers and visions; band 3's floors with a river have its sound
    const g85 = U.generate(85, 99, libs[5].chunks, { flags: libs[5].flags });
    t.check("floor 85 (the Truth Layer): places of whispers and of visions, blue flames for torches", g85.info.whispers.length > 0 && g85.info.visions.length > 0 &&
        g85.map.events.some(e => e && /Decoration2_blue/.test(e.pages[0].image.characterName)), { w: g85.info.whispers.length, v: g85.info.visions.length });
    let river = null;
    for (let s = 1; s < 40 && !river; s++) { const g = U.generate(33, s, libs[3].chunks, { flags: libs[3].flags }); if (g.info.water) river = g; }
    t.check("a band-3 floor with the river's water sounds it (bgs River) and every truth of band 5 is about someone",
        river && river.map.bgs.name === "River" && river.map.autoplayBgs && Object.keys(D.NOTES).filter(k => Number(k) >= 76 && Number(k) <= 99).every(k => D.NOTES[k].who),
        river && river.map.bgs);

    // ---- the maps of the floors
    t.check("floors map to their maps and back: 1 -> 131, 9 -> 139, 10 -> 140, 11 -> 1011, 55 -> 1055, 99 -> 1099, 20 -> 146, 90 -> 153, 100 -> 11",
        U.mapOf(1) === 131 && U.mapOf(9) === 139 && U.mapOf(10) === 140 && U.mapOf(11) === 1011 && U.mapOf(55) === 1055 && U.mapOf(99) === 1099 &&
        U.mapOf(20) === 146 && U.mapOf(90) === 153 && U.mapOf(100) === 11 &&
        U.floorOf(131) === 1 && U.floorOf(1011) === 11 && U.floorOf(1099) === 99 && U.floorOf(146) === 20 && U.floorOf(11) === 100 &&
        U.floorOf(141) === 0 && U.floorOf(145) === 0 && U.floorOf(1100) === 0 && U.floorOf(1020) === 0 &&
        U.isGenerated(1055) && U.isVirtual(1055) && !U.isVirtual(135) && !U.isGenerated(146) && !U.isGenerated(11));
    t.check("every 10th floor is made by hand and every floor 1-100 belongs to a band",
        [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].every(f => U.handmadeOf(f)) && Array.from({ length: 100 }, (_, i) => i + 1).every(f => U.bandOf(f)));
    t.check("every generated floor 11-99 has a note of its own, every boss of floors 20-90 a description for the creature plugin",
        Array.from({ length: 89 }, (_, i) => i + 11).filter(f => f % 10).every(f => D.NOTES[f] && D.NOTES[f].title && D.NOTES[f].text) &&
        [20, 30, 40, 50, 60, 70, 80, 90].every(f => D.BOSSES[f] && D.BOSSES[f].desc && D.FLOORS[f].boss === "boss_" + f));

    // ---- the hand-made floors (Underground.js's own walk)
    const hmBad = [];
    for (const f of Object.keys(D.FLOORS).map(Number)) {
        const hm = D.FLOORS[f], map = readJson("data/Map" + String(hm.map).padStart(3, "0") + ".json"), W = map.width;
        const fl = tilesets[map.tilesetId].flags;
        const open = JSON.parse(JSON.stringify(map));
        for (const e of open.events) if (e && /^Dziesiąta brama|^Drzwi Komnaty Serca/.test(e.name)) e.pages = [e.pages[e.pages.length - 1]];
        const shut = U.reachable(map, hm.up, fl), seen = U.reachable(open, hm.up, fl);
        const near = (s, x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => s.has((y + dy) * W + x + dx));
        if (hm.down && !seen.has(hm.down[1] * W + hm.down[0])) hmBad.push(f + ": stairs down");
        if (hm.lift && !seen.has(hm.lift[1] * W + hm.lift[0])) hmBad.push(f + ": lift");
        for (const e of map.events) if (e && /<Zapiski:/.test(e.note || "") && !near(seen, e.x, e.y)) hmBad.push(f + ": note " + e.name);
        if (hm.boss && !map.events.some(e => e && new RegExp("<Stwor:" + hm.boss + ">").test(e.note))) hmBad.push(f + ": no boss place");
        if (f === 100) {
            const heart = map.events.find(e => e && e.name === "Serce Twierdzy");
            if (!heart || near(shut, heart.x, heart.y) || !near(seen, heart.x, heart.y)) hmBad.push("100: the Heart behind the door");
            for (const n of ["Zamek z krukiem", "Kamienny dzwon", "Kamień pieśni", "Drzwi Komnaty Serca"]) {
                const e = map.events.find(o => o && o.name === n);
                if (!e || !near(shut, e.x, e.y)) hmBad.push("100: " + n);
            }
        }
    }
    t.check("the hand-made floors 10-100: from the stairs up one walks to the stairs down, the lift, every note; each 20-90 has its boss's place; floor 100: the three locks and the door from the stairs, the Heart only through the open door",
        hmBad.length === 0, hmBad);
});
