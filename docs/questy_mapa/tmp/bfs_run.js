// runtime BFS over transfers (event commands incl. injected events); read-only; port from CDP_PORT
const kit = require("../../../tests/lib/kit.js");
const fs = require("fs");
kit.test({ port: 9741 }, async t => {
    await t.newGame({ map: 8, x: 60, y: 60, quiet: true, minimap: false, hour: 10, day: 5 });
    const start = [162, 24, 13, 111, 8, 4, 125, 3, 20];
    const seen = new Set(), q = start.slice(), out = {};
    while (q.length) {
        const id = q.shift(); if (seen.has(id)) continue; seen.add(id);
        const ok = await t.go(id, 3, 3, 2, { timeout: 30 });
        if (!ok) { out[id] = { fail: true }; console.log("FAIL", id); continue; }
        const info = await t.json(`(function(){
            const r = { w: $gameMap.width(), h: $gameMap.height(), tr: [], sc: [], mk: [] };
            for (const e of $gameMap.events()) { const d = e.event(); if (!d) continue;
                if (/^Miejsce:/.test(d.name)) r.mk.push([d.name.slice(8).trim(), d.x, d.y, d.id]);
                const seenT = new Set();
                for (const p of d.pages || []) { let sc = ""; for (const c of p.list || []) {
                    if (c.code === 201 && c.parameters[0] === 0) { const k = c.parameters[1]; if (!seenT.has(k)) { seenT.add(k); r.tr.push([k, d.x, d.y, d.id, d.name, c.parameters[2], c.parameters[3]]); } }
                    if (c.code === 355 || c.code === 655) { if (c.code === 355 && sc) { if (/Transfer|Latarnia\.|Wrak\.|Garnizon\.|Dwor\.|Zakon\.|Ludzie\.|Cysterna\.|Orzel\.|Kruk\.|Pustelnia\.|Wyspy\.|Przystan\.|Kantor\./.test(sc)) r.sc.push([d.id, d.x, d.y, d.name, sc.slice(0, 160)]); sc = ""; } sc += c.parameters[0]; } }
                    if (sc && /Transfer|Latarnia\.|Wrak\.|Garnizon\.|Dwor\.|Zakon\.|Ludzie\.|Cysterna\.|Orzel\.|Kruk\.|Pustelnia\.|Wyspy\.|Przystan\.|Kantor\./.test(sc)) r.sc.push([d.id, d.x, d.y, d.name, sc.slice(0, 160)]); } }
            return r; })()`);
        out[id] = info;
        for (const tr of info.tr) if (!seen.has(tr[0]) && !q.includes(tr[0])) q.push(tr[0]);
        console.log(id, "tr:", [...new Set(info.tr.map(x => x[0]))].join(","));
    }
    fs.writeFileSync(__dirname + "/bfs_runtime.json", JSON.stringify(out));
    t.check("done", true);
});
