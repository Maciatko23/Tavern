// Etap 3 swiata (lewe skrzydlo, partia 1): kazde przejscie z tools/swiat/etap3/staging/ogon3.json - bohater 5 kratek od krawedzi, idzie na nia, laduje w TEJ SAMEJ kratce swiata.
// GAME_OVERLAY=tools/swiat/etap3/staging GAME_OVERLAY_JS=1 CDP_PORT=9382 node tests/swiat_etap3_test.js   Zdjecia: docs/swiat_etap3/styk_*.png
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_etap3");
fs.mkdirSync(OUT, { recursive: true });
const LINKS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "tools", "swiat", "etap3", "staging", "ogon3.json"), "utf8")).linki;
kit.test({ port: Number(process.env.CDP_PORT) || 9382, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const at = () => t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })`);
    await t.newGame({ map: 111, x: 20, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(20);
    const maps = await t.json(`SwiatData.maps`);
    const KEY = { N: "up", S: "down", W: "left", E: "right" };
    const OPP = { N: "S", S: "N", E: "W", W: "E" };
    async function pass(a, side, pos, b, shots, inset = 5) {
        const [ax, ay, aw, ah] = maps[a], [bx, by, bw, bh] = maps[b];
        const local = (m, sd, p) => { const [x0, y0, w, h] = maps[m]; return sd === "N" ? [p - x0, 0] : sd === "S" ? [p - x0, h - 1] : sd === "W" ? [0, p - y0] : [w - 1, p - y0]; };
        const [ex, ey] = local(a, side, pos);
        const inw = { N: [0, inset], S: [0, -inset], W: [inset, 0], E: [-inset, 0] }[side];
        let [lx, ly] = [ex + inw[0], ey + inw[1]];
        await t.newGame({ map: a, x: lx, y: ly, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(30);
        // wąski styk: jeśli 5 kratek od krawędzi to woda/przeszkoda, stań na pierwszej przechodniej kratce bliżej krawędzi (3..1 kratki)
        await t.eval(`(function(){ const ex = ${ex}, ey = ${ey}, d = ${JSON.stringify(inw)}; const fx = d[0] / ${inset}, fy = d[1] / ${inset};
            for (let k = ${inset}; k >= 0; k--) for (const o of [0, 1, -1, 2, -2]) { const x = ex + fx * k + (fx ? 0 : o), y = ey + fy * k + (fy ? 0 : o); if ($gameMap.isValid(x, y) && ($gameMap.isPassable(x, y, 2) || $gameMap.isPassable(x, y, 4) || $gameMap.isPassable(x, y, 6) || $gameMap.isPassable(x, y, 8))) { $gamePlayer.locate(x, y); return 0; } } return 0; })()`);
        await t.frames(10);
        const start = await at();
        if (shots) await t.shot(path.join(OUT, `styk_${a}_${b}_a.png`));
        let p = start;
        for (let i = 0; i < 40 && p.map === a; i++) { await t.hold(KEY[side], 12); p = await at(); }
        await t.frames(30);
        p = await at();
        if (shots) await t.shot(path.join(OUT, `styk_${a}_${b}_b.png`));
        const [wx, wy] = side === "N" || side === "S" ? [bx + p.x, by + p.y] : [bx + p.x, by + p.y];
        const want = side === "N" || side === "S" ? pos : pos;
        const along = side === "N" || side === "S" ? wx : wy;
        t.check(`${a} ${side} -> ${b} w tej samej kratce swiata (${along} ~ ${want})`, p.map === b && Math.abs(along - want) <= 3, { start, p });
    }
    for (const l of LINKS) {
        if (l.a === 13 && l.b === 120) continue;
        const mid = Math.floor((l.from + l.to) / 2);
        await pass(l.a, l.side, mid, l.b, true);
        await pass(l.b, OPP[l.side], mid, l.a, true);
    }
    await pass(13, "E", 135, 120, true);
    // (2026-10-31) the Silent's palisade stands at x 3 of Map120: the walk to Gory starts outside it, 2 tiles from the edge
    await pass(120, "W", 135, 13, false, 2);
});
