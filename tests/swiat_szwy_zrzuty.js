// Zrzuty w grze dla stagingu szwów: 8 szwów, bohater przy krawędzi (przed) i tuż po przejściu na drugą mapę (po).
// GAME_OVERLAY=tools/swiat/szwy/staging CDP_PORT=9398 node tests/swiat_szwy_zrzuty.js      Wynik: docs/swiat_szwy/gra/zrzut_<a>_<b>_przed|po.png
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", process.env.ZRZUTY_DIR || "swiat_szwy", "gra"); fs.mkdirSync(OUT, { recursive: true });
const POI = JSON.parse(process.env.POI || "{}");
kit.test({ port: Number(process.env.CDP_PORT) || 9398, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    const maps = await t.json("SwiatData.maps");
    const KEY = { N: "up", S: "down", W: "left", E: "right" };
    const links = await t.json("SwiatData.links");
    const S = [];
    const PARY = process.env.PARY ? JSON.parse(process.env.PARY) : [[8, 961], [8, 24], [8, 13], [24, 901], [4, 3], [3, 23], [8, 22], [22, 24]];   // PARY=[[22,24],...]
    for (const [a, b] of PARY) {
        const l = links.filter(q => q.a === a && q.b === b).sort((p, q) => (q.to - q.from) - (p.to - p.from))[0];
        if (l) S.push([a, l.side, Math.floor((l.from + l.to) / 2), b]);
    }
    for (const [a, side, pos, b] of S) {
        const [x0, y0, w, h] = maps[a];
        const ex = side === "W" ? 0 : side === "E" ? w - 1 : pos - x0, ey = side === "N" ? 0 : side === "S" ? h - 1 : pos - y0;
        await t.newGame({ map: a, x: ex, y: ey, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(40);
        await t.eval(`(function(){ let best = null; for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const x = ${ex} + dx, y = ${ey} + dy; if (!$gameMap.isValid(x, y)) continue;
            const e = ${JSON.stringify(side)}; const ok = e === "W" ? x <= 1 : e === "E" ? x >= $gameMap.width() - 2 : e === "N" ? y <= 1 : y >= $gameMap.height() - 2;
            if (!ok || ![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d))) continue; const d = Math.hypot(dx, dy); if (!best || d < best[0]) best = [d, x, y]; }
            if (best) $gamePlayer.locate(best[1], best[2]); return 0; })()`);
        await t.frames(20);
        await t.shot(path.join(OUT, `zrzut_styk_${a}_${b}_przed.png`));
        let m = a; for (let i = 0; i < 25 && m === a; i++) { await t.hold(KEY[side], 12); m = await t.json("$gameMap.mapId()"); }
        await t.frames(40);
        await t.shot(path.join(OUT, `zrzut_styk_${a}_${b}_po.png`));
        t.check(`styk ${a} ${side} -> ${b}`, m === b, { m });
    }
});
