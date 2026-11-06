// Zasięg widzenia na każdym wnętrzu budynku (js/plugins/Pokoje.js): wejście na mapę tam, gdzie prowadzą jej przejścia: działa, bohater widzi to, co ma wokół siebie, nikt nie stoi w czerni przy samym bohaterze.
// Mapy czytane z data/. ZRZUTY=folder (ścieżka bezwzględna): zrzut z każdej mapy.
// Ze stagingu: GAME_OVERLAY=tools/tavern/pokoje/staging GAME_OVERLAY_JS=1 CDP_PORT=9430 node tests/pokoje_mapy_test.js
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("./lib/kit.js");
const DATA = path.join(__dirname, "..", "data");
const INTERIOR = 8;
const wejscia = {}, tytuly = {};
const info = JSON.parse(fs.readFileSync(path.join(DATA, "MapInfos.json"), "utf8"));
const mapy = [];
for (const it of info) {
    if (!it) continue;
    const p = path.join(DATA, "Map" + String(it.id).padStart(3, "0") + ".json");
    if (!fs.existsSync(p)) continue;
    const m = JSON.parse(fs.readFileSync(p, "utf8"));
    tytuly[it.id] = it.name;
    if (m.tilesetId === INTERIOR) mapy.push(it.id);
    for (const e of m.events) {
        if (!e) continue;
        for (const pg of e.pages) for (const c of pg.list) if (c.code === 201 && c.parameters[0] === 0) { const to = c.parameters[1]; if (to !== it.id) (wejscia[to] = wejscia[to] || []).push([c.parameters[2], c.parameters[3]]); }
    }
}
kit.test({ port: Number(process.env.CDP_PORT) || 9430, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: 1, x: 50, y: 35, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(20);
    const bez = [], ciemno = [], wyniki = [];
    for (const id of mapy) {
        const w = wejscia[id] && wejscia[id][0];
        await t.go(id, w ? w[0] : 5, w ? w[1] : 5, 2);
        await t.frames(4);
        if (!w) await t.eval(`(() => { for (let r = 0; r < 40; r++) for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) if (Math.abs(x - $gameMap.width() / 2 | 0) + Math.abs(y - $gameMap.height() / 2 | 0) === r && $gameMap.checkPassage(x, y, 0x0f)) { $gamePlayer.locate(x, y); return; } })(); 0`);
        await t.frames(6);
        const r = await t.json(`(() => {
            const P = $gamePlayer, W = $gameMap.width(), H = $gameMap.height(), ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && $gameMap.checkPassage(x, y, 0x0f);
            // to, co da się przejść od bohatera
            const seen = new Set([P.y * W + P.x]), q = [[P.x, P.y]];
            while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (ok(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } } }
            let blisko = 0, bliskoWid = 0, wszystko = 0, wid = 0;
            for (const k of seen) { const x = k % W, y = (k - x) / W, d = Math.abs(x - P.x) + Math.abs(y - P.y), s = Pokoje.sees(x, y); wszystko++; if (s) wid++; if (d <= 3) { blisko++; if (s) bliskoWid++; } }
            return { on: Pokoje.active(), map: $gameMap.mapId(), x: P.x, y: P.y, W, H, zoom: $gameScreen.zoomScale(), blisko, bliskoWid, wszystko, wid, drzwi: Pokoje.doors().length, hero: Pokoje.cover(P.x, P.y) };
        })()`);
        wyniki.push(r);
        if (!r.on || r.map !== id) bez.push(id);
        if (r.blisko && r.bliskoWid / r.blisko < 0.6) ciemno.push([id, r.x, r.y, r.bliskoWid, r.blisko]);
        console.log("   " + String(id).padStart(3) + " " + tytuly[id].slice(0, 26).padEnd(26) + " " + (r.W + "x" + r.H).padEnd(6) + " zoom " + r.zoom + "  od wejścia widać " + r.wid + "/" + r.wszystko + "  drzwi " + r.drzwi + "  na bohaterze " + r.hero.toFixed(2));
        if (process.env.ZRZUTY) { await t.until("Pokoje.settled()", 6); await t.shot(path.join(process.env.ZRZUTY, String(id).padStart(3, "0") + ".png")); }
    }
    console.log("   wnętrz: " + mapy.length);
    t.check("działa na każdym wnętrzu budynku", bez.length === 0, bez);
    t.check("bohater widzi to, co ma tuż wokół siebie", ciemno.length === 0, ciemno);
    t.check("na bohaterze nie ma czerni", wyniki.filter(r => r.hero > 0.3).length === 0, wyniki.filter(r => r.hero > 0.3).map(r => [r.map, r.x, r.y, r.hero]));
});
