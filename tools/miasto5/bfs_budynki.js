// Kruczogród: walking BFS from the market square (the hero's own canPass) to every gate, every door front and every TownLife / Zakon / "Miejsce:" spot;
// the reachable cells before / after (2026-11-11, the six new buildings).   OV=<overlay folder> OUT=<json> PORT=97xx node tools/miasto5/bfs_budynki.js
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
kit.test({ port: Number(process.env.PORT || 9734), overlay: process.env.OV, bootCheck: "gra", beforeLoad: "window.KLIMAT_ZIEMIA = { off: true };" }, async t => {
    await t.newGame({ map: 8, x: 52, y: 66, dir: 2, day: 12, hour: 11, quiet: true, minimap: false }); await t.frames(60);
    const r = await t.json(`(function(){
        const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[52, 66]]; seen[66 * W + 52] = 1;
        const p = $gamePlayer; const D = [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]];
        while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of D) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
            if (p.canPass(x, y, d)) { seen[ny * W + nx] = 1; q.push([nx, ny]); } } }
        const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !!seen[y * W + x];
        const gates = [], doors = [], spots = [];
        for (const l of SwiatData.links.filter(l => l.a === 8)) {
            const mid = Math.round((l.from + l.to) / 2), m = SwiatData.maps[8];
            const c = l.side === "N" ? [mid - m[0], 1] : l.side === "S" ? [mid - m[0], m[3] - 2] : l.side === "W" ? [1, mid - m[1]] : [m[2] - 2, mid - m[1]];
            gates.push({ side: l.side, cell: c, ok: ok(c[0], c[1]) });
        }
        for (const e of $dataMap.events) { if (!e) continue;
            const tr = e.pages.some(pg => pg.list.some(c => c.code === 201));
            if (/^Drzwi/.test(e.name) || tr) doors.push({ name: e.name, at: [e.x, e.y], front: [e.x, e.y + 1], ok: ok(e.x, e.y + 1) || ok(e.x, e.y) });
            if (/^Miejsce:/.test(e.name)) spots.push({ name: e.name, at: [e.x, e.y], ok: ok(e.x, e.y) }); }
        const tl = window.TownLifeData && TownLifeData.SPOTS || {}; for (const k of Object.keys(tl)) spots.push({ name: "SPOT " + k, at: [tl[k][0], tl[k][1]], ok: ok(tl[k][0], tl[k][1]) });
        let n = 0; for (let i = 0; i < seen.length; i++) n += seen[i];
        return { reach: n, events: $gameMap.events().length, gates, doors, spots };
    })()`);
    fs.writeFileSync(process.env.OUT, JSON.stringify(r, null, 1));
    const bad = [...r.gates, ...r.doors, ...r.spots].filter(x => !x.ok);
    t.check("BFS z rynku: " + r.reach + " kratek, bramy " + r.gates.filter(g => g.ok).length + "/" + r.gates.length + ", drzwi " + r.doors.filter(g => g.ok).length + "/" + r.doors.length + ", miejsca " + r.spots.filter(g => g.ok).length + "/" + r.spots.length, bad.length === 0, bad.slice(0, 12));
});
