// Szybkie mapy dojść autopilota (2026-11-17, gracz: „czemu jak gra coś robi albo podnosi, to jest ścinka gry?”): przed każdym
// podniesieniem autopilot liczył mapę dojść (ap.js field) ~250 ms na działce pełnej budynków - canPass ~20 razy na pole, każde
// przeglądało wszystkie zdarzenia mapy. Teraz: każde (pole, kierunek) raz, zdarzenia z siatki pól robionej raz. Tu: działka dnia 40
// (tests/fixtures/nowy_dzien40), z trzech miejsc mapa dojść starym i nowym sposobem - te same odległości co do pola, nowa szybsza
// i pod 60 ms (jedna-trzy klatki zamiast ćwierć sekundy).
// Uruchom: node tests/run.js autopilot_sciezki --port 9508
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    await t.loadFixture("nowy_dzien40");
    await t.eval("window.FAB_GRAPH = null; 0");
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    const info = await J(`({ map: $gameMap.mapId(), events: $gameMap.events().length, at: [$gamePlayer.x, $gamePlayer.y] })`);
    t.check("działka dnia 40 (Map218) z " + info.events + " zdarzeniami", info.map === 218 && info.events > 100, info);
    const r = await J(`(function(){
        // (the hero's place and two far cells he can walk to - found on a first field)
        const f0 = AP._dbg.field($gamePlayer.x, $gamePlayer.y), w = f0.w, open = [];
        for (let i = 0; i < f0.dist.length; i++) if (isFinite(f0.dist[i]) && f0.dist[i] > 15) open.push([i % w, (i / w) | 0]);
        const spots = [[$gamePlayer.x, $gamePlayer.y], open[Math.floor(open.length * 0.25)], open[Math.floor(open.length * 0.75)]].filter(Boolean);
        const out = [];
        for (const [x, y] of spots) {
            AP.slowField = true; let t0 = performance.now(); const a = AP._dbg.field(x, y); const slow = performance.now() - t0;
            AP.slowField = false; t0 = performance.now(); const b = AP._dbg.field(x, y); const fast = performance.now() - t0;
            let diff = 0, reach = 0; for (let i = 0; i < a.dist.length; i++) { if (isFinite(a.dist[i])) reach++; if (a.dist[i] !== b.dist[i] && !(isNaN(a.dist[i]) && isNaN(b.dist[i]))) diff++; }
            out.push({ at: [x, y], reach, diff, slow: Math.round(slow), fast: Math.round(fast), ownCanPass: Object.prototype.hasOwnProperty.call($gamePlayer, "canPass"), ownXy: Object.prototype.hasOwnProperty.call($gameMap, "eventsXyNt") });
        }
        AP.slowField = false;
        return out; })()`);
    t.check("te same odległości co do pola z każdego miejsca (stara i nowa mapa dojść)", r.length >= 2 && r.every(o => o.diff === 0 && o.reach > 50), r);
    t.check("nowa szybsza i pod 60 ms (stara: " + r.map(o => o.slow).join("/") + " ms, nowa: " + r.map(o => o.fast).join("/") + " ms)", r.every(o => o.fast < 60 && o.fast < o.slow), r);
    t.check("po liczeniu gra bez podmianek (canPass gracza i eventsXyNt mapy jak były)", r.every(o => !o.ownCanPass && !o.ownXy), r);
});
