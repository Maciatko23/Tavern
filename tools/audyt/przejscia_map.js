// tools/audyt/przejscia_map.js - przejścia między mapami (bez przeglądarki), 2026-10-24.
// Każde polecenie „Przenieś gracza” (kod 201) w zdarzeniach wszystkich map data/Map*.json: czy mapa docelowa istnieje i czy cel
// mieści się w jej granicach; do tego graf map połączonych przejściami ze zdarzeń (od domu dziadka, Map019) - mapy, do których
// żadne zdarzenie nie prowadzi, wypisane osobno (wiele przejść robią wtyczki: krawędzie Krawedzie.js, windy podziemi, F9 - to nie
// błąd, tylko lista do przejrzenia).
//   node tools/audyt/przejscia_map.js
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const infos = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "MapInfos.json"), "utf8"));
const maps = new Map();
for (const m of infos) {
    if (!m) continue;
    const f = path.join(ROOT, "data", "Map" + String(m.id).padStart(3, "0") + ".json");
    if (!fs.existsSync(f)) { console.log("brak pliku mapy " + m.id + " (" + m.name + ")"); continue; }
    maps.set(m.id, Object.assign({ id: m.id, name: m.name }, JSON.parse(fs.readFileSync(f, "utf8"))));
}
const edges = new Map();   // from -> Set(to)
const problems = [];
let n = 0, byVar = 0;
for (const m of maps.values()) {
    for (const e of m.events || []) {
        if (!e) continue;
        for (const p of e.pages || []) for (const c of p.list || []) {
            if (c.code !== 201) continue;
            n++;
            const [mode, mapId, x, y] = c.parameters;
            if (mode !== 0) { byVar++; continue; }   // (by variables: the plugins' own)
            const t = maps.get(mapId);
            if (!t) { problems.push("mapa " + m.id + " „" + m.name + "”, zdarzenie " + e.id + " „" + e.name + "” (" + e.x + "," + e.y + "): przejście na mapę " + mapId + ", której nie ma"); continue; }
            if (x < 0 || y < 0 || x >= t.width || y >= t.height) problems.push("mapa " + m.id + " „" + m.name + "”, zdarzenie " + e.id + " „" + e.name + "”: cel " + x + "," + y + " poza mapą " + mapId + " „" + t.name + "” (" + t.width + "x" + t.height + ")");
            (edges.get(m.id) || edges.set(m.id, new Set()).get(m.id)).add(mapId);
        }
    }
}
// the graph from grandpa's house
const seen = new Set([19]), queue = [19];
while (queue.length) { const a = queue.shift(); for (const b of edges.get(a) || []) if (!seen.has(b)) { seen.add(b); queue.push(b); } }
const unreached = Array.from(maps.values()).filter(m => !seen.has(m.id)).map(m => m.id + " " + m.name);
console.log("Przejść w zdarzeniach: " + n + " (przez zmienne: " + byVar + "), map: " + maps.size);
console.log("Błędne cele: " + problems.length);
for (const p of problems) console.log("  " + p);
console.log("Mapy osiągalne z domu dziadka samymi zdarzeniami map: " + seen.size + "; bez takiego przejścia (" + unreached.length + "): " + unreached.join(" | "));
fs.writeFileSync(path.join(__dirname, "przejscia_map.json"), JSON.stringify({ n, byVar, problems, reached: Array.from(seen), unreached }, null, 1));
