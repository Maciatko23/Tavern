// Szerokości nazw miejsc mapy wyspy w czcionce gry (CleanHUD.measure) - dla rozkładu napisów atlasu (tools/mapy/mapa_wyspy_brzegowe.py).
//   node tools/mapy/mapa_wyspy_szerokosci.js        -> tools/mapy/mapa_wyspy_szerokosci.json
const kit = require("../../tests/lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "mapa_wyspy_szerokosci.json");
// (the game's data and, when there is one, the staged copy of tools/mapy/mapa_wyspy_brzegowe.py - its new places' names)
const files = [path.join(__dirname, "..", "..", "js", "plugins", "MapaWyspy_Data.js"), path.join(__dirname, "staging_mapa", "js", "plugins", "MapaWyspy_Data.js")];
const names = [].concat(...files.filter(f => fs.existsSync(f)).map(f => [...fs.readFileSync(f, "utf8").matchAll(/nazwa: "([^"]*)"/g)].map(m => m[1])));
const extra = [];
kit.test({ port: Number(process.env.CDP_PORT) || 9509, lightGpu: true, bootCheck: "gra", evalTimeout: 120000 }, async t => {
    const all = [...new Set(names.concat(extra))];
    const r = await t.json(`(function(){ const C = Tawerna.api("CleanHUD"), out = {}; for (const n of ${JSON.stringify(all)}) { out[n] = {}; for (const s of [13, 14, 15, 16]) { out[n][s] = C.measure(n, s, null); out[n]["b" + s] = C.measure(n, s, "bold"); } } return out; })()`);
    fs.writeFileSync(OUT, JSON.stringify(r, null, 1));
    t.check("zmierzone " + Object.keys(r).length + " nazw", Object.keys(r).length === all.length);
});
