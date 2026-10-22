// Graf przejść między mapami (komendy 201 „Przenieś gracza” w zdarzeniach map) - tylko czyta data/.
"use strict";
const fs = require("fs"), path = require("path");
const DATA = path.join(__dirname, "..", "..", "data");
const infos = JSON.parse(fs.readFileSync(path.join(DATA, "MapInfos.json"), "utf8"));
const out = [];
for (const inf of infos) {
    if (!inf) continue;
    const f = path.join(DATA, "Map" + String(inf.id).padStart(3, "0") + ".json");
    if (!fs.existsSync(f)) continue;
    const m = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const e of m.events) {
        if (!e) continue;
        for (const pg of e.pages) {
            for (const c of pg.list) {
                if (c.code === 201 && c.parameters[0] === 0) {
                    out.push({ from: inf.id, fromName: inf.name, ev: e.id, x: e.x, y: e.y, trig: pg.trigger, to: c.parameters[1], tx: c.parameters[2], ty: c.parameters[3] });
                }
            }
        }
    }
}
const names = {}; for (const inf of infos) if (inf) names[inf.id] = inf.name;
const want = process.argv[2] ? process.argv[2].split(",").map(Number) : null;
const seen = new Set();
for (const t of out) {
    if (want && !want.includes(t.from)) continue;
    const k = t.from + ">" + t.to;
    if (seen.has(k)) continue; seen.add(k);
    console.log(`${t.from} ${t.fromName} (${t.x},${t.y}) -> ${t.to} ${names[t.to] || "?"} (${t.tx},${t.ty}) trig ${t.trig}`);
}
fs.writeFileSync(path.join(__dirname, "graf_przejsc.json"), JSON.stringify({ names, edges: out }, null, 1));
