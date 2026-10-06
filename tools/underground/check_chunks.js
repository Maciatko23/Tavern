// node tools/underground/check_chunks.js [MapNNN.json] [Tilesets.json] [tileset id]
// Every chunk of a library checked by Underground.js's own checkChunk: its doors, the landings in front of its stairs places,
// reachable from each other inside the chunk. Prints the problems (exit code 1 when there are any). build.py runs it for every
// band's library (the tileset id: the library map's own when not given).
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const sandbox = require(path.join(ROOT, "tests", "lib", "sandbox.js"));
const w = sandbox.loadPlugins(["TawernaCore", "Underground_Data", "Underground"]);
const U = w.Underground;
const lib = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, "staging", "Map130.json"), "utf8"));
const tsId = Number(process.argv[4]) || lib.tilesetId || 10;
const ts = JSON.parse(fs.readFileSync(process.argv[3] || path.join(ROOT, "data", "Tilesets.json"), "utf8"))[tsId];
const flags = ts && ts.flags.length > 1000 ? ts.flags : JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "town", "winlu_samples", "Tilesets.json"), "utf8"))[3].flags;
let bad = 0;
for (const c of U.parseLibrary(lib)) {
    const p = U.checkChunk(c, flags);
    console.log((p.length ? "PROBLEM " : "ok      ") + c.name + " " + c.w + "x" + c.h + (p.length ? ": " + p.join("; ") : ""));
    bad += p.length;
}
process.exit(bad ? 1 : 0);
