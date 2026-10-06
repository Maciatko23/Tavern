// Underground.js's generator without the game (docs/PODZIEMIA.md): every band's chunk library (data/Map130, Map141-144) read the
// game's way, every chunk's own check (doors, stairs landings, containers reachable inside it), and the generated floors of many
// seeds: the same seed gives the same floor, another seed another; a walk from the stairs up to the stairs down (the band's tileset
// flags, blocking events); the floor's note of the order placed; every autotile a valid shape, no hole in the ground layer. The
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

    for (const b of bands) {
        const bad = [], rooms = [], noNote = [], shapes = [], holes = [], ids = [];
        const floors = [];
        for (let f = b.from; f <= b.to; f++) if (!(b.handmade && b.handmade[f])) floors.push(f);
        const seeds = b.id === 1 ? 25 : 8;
        for (let s = 1; s <= seeds; s++) {
            const seed = (s * 2654435761) >>> 0;
            for (const f of floors) {
                const g = U.generate(f, seed, libs[b.id].chunks, { flags: libs[b.id].flags });
                const m = g.map, W = m.width, H = m.height;
                if (!g.info.check.ok) bad.push(seed + "/" + f + ": " + g.info.check.why);
                if (g.info.rooms.length !== U.roomsOf(f, b)) rooms.push(seed + "/" + f + ": " + g.info.rooms.length);
                if (D.NOTES[f] && !g.info.notes.length) noNote.push(seed + "/" + f);
                if (m.events.length >= 860) ids.push(seed + "/" + f + ": " + m.events.length);
                for (let z = 0; z < 2; z++) for (let i = 0; i < W * H; i++) {
                    const id = m.data[z * W * H + i];
                    if (id < 2048) continue;
                    const kind = (id - 2048) / 48 | 0, shape = (id - 2048) % 48, side = kind >= 80 && ((kind - 80) >> 3) % 2 === 1;
                    const fall = kind >= 5 && kind < 16 && kind % 2 === 1;
                    if (side ? shape > 15 : fall ? shape > 3 : shape > 47) shapes.push(seed + "/" + f + " " + i);
                }
                for (let i = 0; i < W * H; i++) if (!m.data[i]) holes.push(seed + "/" + f + " " + (i % W) + "," + (i / W | 0));
            }
        }
        const label = "band " + b.id + ", floors " + floors[0] + "-" + floors[floors.length - 1] + " of " + seeds + " seeds";
        t.check(label + ": each has a walk from its stairs up to its stairs down", bad.length === 0, bad.slice(0, 5));
        t.check(label + ": ...as many rooms as the band says, the order's note of its floor, fewer than 860 events (860-899: the creatures)",
            rooms.length === 0 && noNote.length === 0 && ids.length === 0, { rooms: rooms.slice(0, 5), noNote: noNote.slice(0, 5), ids: ids.slice(0, 3) });
        t.check(label + ": ...every autotile has a valid shape (walls 16, waterfalls 4, floors 48) and no ground cell is empty",
            shapes.length === 0 && holes.length === 0, { shapes: shapes.slice(0, 5), holes: holes.slice(0, 5) });
    }
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
