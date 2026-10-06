// node tools/underground/preview.js <seed> <MapNNN.json> <flags.json | Tilesets.json> <out dir> [band] [floors]
// Floors of one seed made by Underground.js's own generator in Node (the same code the game runs), written as map files
// (floorN.json) for build.py's / dev_band.py's pictures; each one's walk from the stairs up to the stairs down is checked.
// band: 1 (default) .. 5 - its generated floors (every one, or the list "floors": 11,15,19); the flags: a plain list, or the
// tileset of the library map taken from a Tilesets.json.
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const sandbox = require(path.join(ROOT, "tests", "lib", "sandbox.js"));
const w = sandbox.loadPlugins(["TawernaCore", "Underground_Data", "Underground"]);
const U = w.Underground, D = w.Underground_Data;
const [seed, libPath, flagsPath, outDir, bandArg, floorsArg] = process.argv.slice(2);
const lib = JSON.parse(fs.readFileSync(libPath, "utf8"));
const chunks = U.parseLibrary(lib);
let flags = JSON.parse(fs.readFileSync(flagsPath, "utf8"));
if (!(typeof flags[0] === "number" || flags.length === 8192)) flags = flags[lib.tilesetId || 10].flags;
const band = D.BANDS.find(b => b.id === (Number(bandArg) || 1));
let floors = [];
if (floorsArg) floors = floorsArg.split(",").map(Number);
else for (let f = band.from; f <= band.to; f++) if (!(band.handmade && band.handmade[f])) floors.push(f);
fs.mkdirSync(outDir, { recursive: true });
let bad = 0;
for (const f of floors) {
    const g = U.generate(f, Number(seed), chunks, { flags });
    fs.writeFileSync(path.join(outDir, "floor" + f + ".json"), JSON.stringify(g.map));
    if (!g.info.check.ok) bad++;
    console.log("floor " + f + ": " + g.map.width + "x" + g.map.height + ", " + g.info.rooms.length + " rooms (" + g.info.rooms.map(r => r.chunk).join(", ") +
        "), way " + (g.info.check.ok ? g.info.check.steps + " steps" : "MISSING " + g.info.check.why) + (g.info.notes.length ? "" : ", NO NOTE"));
}
process.exit(bad ? 1 : 0);
