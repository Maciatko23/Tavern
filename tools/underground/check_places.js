// node tools/underground/check_places.js <dir of staged maps> <Tilesets.json> [floor ...]
// The hand-made floors (Underground_Data FLOORS 10-100) checked with Underground.js's own walk (tile flags + blocking events, the
// pages a new game shows): from the spot below the stairs up one reaches the stairs down, the lift's cage, every note of the
// order (a cell beside it), the boss's place; their numbers match the map's own spots (MapNNN_spots.json from the builders).
// Floor 10: with the tenth gate open. Floor 100: the door and the three locks from the stairs; behind the door (opened), the Heart.
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const sandbox = require(path.join(ROOT, "tests", "lib", "sandbox.js"));
const w = sandbox.loadPlugins(["TawernaCore", "Underground_Data", "Underground"]);
const U = w.Underground, D = w.Underground_Data;
const [dir, tsPath, ...only] = process.argv.slice(2);
const tilesets = JSON.parse(fs.readFileSync(tsPath, "utf8"));
let bad = 0;
const near = (seen, W, x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => seen.has((y + dy) * W + x + dx));
for (const f of Object.keys(D.FLOORS).map(Number)) {
    if (only.length && !only.includes(String(f))) continue;
    const hm = D.FLOORS[f], file = path.join(dir, "Map" + String(hm.map).padStart(3, "0") + ".json");
    if (!fs.existsSync(file)) { console.log("skip    floor " + f + " (no " + path.basename(file) + ")"); continue; }
    const map = JSON.parse(fs.readFileSync(file, "utf8")), W = map.width, flags = tilesets[map.tilesetId].flags;
    const out = [];
    const spotsFile = file.replace(".json", "_spots.json");
    const spots = fs.existsSync(spotsFile) ? JSON.parse(fs.readFileSync(spotsFile, "utf8")) : {};
    for (const k of ["up", "down", "lift"]) {
        if (!hm[k] && !spots[k]) continue;
        if (!hm[k] || !spots[k] || String(hm[k]) !== String(spots[k])) out.push(k + ": Underground_Data " + JSON.stringify(hm[k]) + " / the map " + JSON.stringify(spots[k]));
    }
    // (floor 10: the tenth gate is passed the way the game passes it - its open page; floor 100's door is checked both ways below)
    const gated = JSON.parse(JSON.stringify(map));
    if (f !== 100) for (const e of gated.events) if (e && /^Dziesiąta brama/.test(e.name)) e.pages = [e.pages[e.pages.length - 1]];
    const seen = U.reachable(gated, hm.up, flags);
    const at = (p, what) => { if (p && !seen.has(p[1] * W + p[0])) out.push(what + " " + p.slice(0, 2) + " not reached"); };
    at(hm.down, "the stairs down"); at(hm.lift, "the lift");
    if (spots.boss && !near(seen, W, spots.boss[0], spots.boss[1]) && !seen.has(spots.boss[1] * W + spots.boss[0])) out.push("the boss's place not reached");
    for (const e of map.events) {
        if (!e) continue;
        if (/<Zapiski:/.test(e.note || "") && !near(seen, W, e.x, e.y)) out.push("note " + e.name + " " + e.x + "," + e.y + " not reached");
        if (/^Skrzynia|^Kołowrót|^Winda kasztelana|^Zamek|^Kamienny dzwon|^Kamień pieśni|^Drzwi Komnaty Serca$/.test(e.name || "") && !near(seen, W, e.x, e.y))
            out.push(e.name + " " + e.x + "," + e.y + " not reached");
    }
    if (f === 100) {
        // the door open: every event of it walk-through (its second page), then the Heart is reached
        const open = JSON.parse(JSON.stringify(map));
        for (const e of open.events) if (e && /^Drzwi Komnaty Serca/.test(e.name)) e.pages = [e.pages[e.pages.length - 1]];
        const seen2 = U.reachable(open, hm.up, flags);
        const heart = open.events.find(e => e && e.name === "Serce Twierdzy");   // (the one with the talk)
        if (!heart || !near(seen2, W, heart.x, heart.y)) out.push("the Heart not reached through the open door");
        if (heart && near(seen, W, heart.x, heart.y)) out.push("the Heart reached with the door shut");
    }
    console.log((out.length ? "PROBLEM " : "ok      ") + "floor " + f + " (Map" + String(hm.map).padStart(3, "0") + ", " + seen.size + " cells)" + (out.length ? ": " + out.join("; ") : ""));
    bad += out.length;
}
process.exit(bad ? 1 : 0);
