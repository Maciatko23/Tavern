// Zrzuty w grze dla stagingu styków: środek (miejsce zbierania) każdej nowej mapy, kilka nowych styków (przed i po przejściu) i zapory na krawędziach.
// GAME_OVERLAY=tools/swiat/styki/staging GAME_OVERLAY_JS=1 CDP_PORT=9398 node tests/swiat_styki_zrzuty.js      Wynik: docs/swiat_styki/zrzut_*.png
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_styki"); fs.mkdirSync(OUT, { recursive: true });
const POI = JSON.parse(process.env.POI || "{}");
kit.test({ port: Number(process.env.CDP_PORT) || 9398, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    for (const [id, [x, y]] of Object.entries(POI)) {
        await t.newGame({ map: Number(id), x, y: y + 3, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(60);
        await t.shot(path.join(OUT, `zrzut_srodek_${id}.png`));
        t.check(`mapa ${id}: zrzut ze środka`, await t.json("$gameMap.mapId()") === Number(id));
    }
    const maps = await t.json("SwiatData.maps");
    const KEY = { N: "up", S: "down", W: "left", E: "right" };
    const links = await t.json("SwiatData.links");
    const S = [];
    for (const [a, b] of [[960, 157], [961, 111], [963, 910], [964, 18], [963, 950], [960, 162], [961, 13], [962, 157]]) {
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
