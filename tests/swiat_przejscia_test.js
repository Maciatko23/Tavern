// Przejscia WSZYSTKICH map swiata po zaladowaniu w grze (z przejsciami wstawianymi w czasie gry: Wyspa, Homes, Orzel...): kazde przejscie 201 do innej mapy swiata
// ma lezec na krawedzi i prowadzic do sasiada ze swiata (ta sama kratka swiata +-3 wzdluz krawedzi), albo byc wyjatkiem (lacha 162/165, wspinaczka 13/175).
// GAME_OVERLAY=<staging> GAME_OVERLAY_JS=1 CDP_PORT=9382 node tests/swiat_przejscia_test.js   (bez overlaya: zainstalowane dane)
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const UK = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "mapy", "swiat_uklad.json"), "utf8")).mapy;
const EXC = new Set(["162>165", "165>162", "13>175", "175>13"]);   // lacha (przyplyw), wspinaczka orla
kit.test({ port: Number(process.env.CDP_PORT) || 9382, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    const ids = Object.keys(UK).map(Number).filter(id => fs.existsSync(path.join(__dirname, "..", "data", `Map${String(id).padStart(3, "0")}.json`)) || process.env.GAME_OVERLAY);
    let n = 0;
    for (const id of ids) {
        if (!(await t.go(id, 3, 3, 2))) { /* mapa moze nie istniec w overlayu */ }
        await t.frames(8);
        const r = await t.json(`(function(){ if ($gameMap.mapId() !== ${id}) return null; const W = $gameMap.width(), H = $gameMap.height(), out = [];
            for (const e of $gameMap.events()) { const d = e.event(); for (const pg of d.pages) for (const c of pg.list) if (c.code === 201 && c.parameters[0] === 0 && c.parameters[1] !== ${id})
                out.push({ id: d.id, name: d.name, x: d.x, y: d.y, to: c.parameters[1], lx: c.parameters[2], ly: c.parameters[3] }); }
            // przejscia w skryptach zdarzen (code 355 / 655: reserveTransfer(mapa, x, y, ...)) - tez musza byc zgodne ze swiatem
            for (const e of $gameMap.events()) { const d = e.event(); for (const pg of d.pages) { const txt = pg.list.filter(c => (c.code === 355 || c.code === 655) && c.parameters[0]).map(c => String(c.parameters[0])).join(" ");
                const re = /reserveTransfer\\((\\d+),\\s*(\\d+),\\s*(\\d+)/g; let m; while ((m = re.exec(txt))) if (+m[1] !== ${id}) out.push({ id: d.id, name: d.name + " (skrypt)", x: d.x, y: d.y, to: +m[1], lx: +m[2], ly: +m[3] }); } }
            return { W, H, out }; })()`);
        if (!r) continue;
        const me = await t.json(`SwiatData.maps[${id}] || null`);
        for (const e of r.out) {
            const inWorld = !!UK[e.to];
            if (!inWorld) continue;           // wnetrza, podziemia
            n++;
            const key = `${id}>${e.to}`;
            if (EXC.has(key)) continue;
            const side = e.x === 0 ? "W" : e.x === r.W - 1 ? "E" : e.y === 0 ? "N" : e.y === r.H - 1 ? "S" : null;
            let ok = false, why = "nie na krawedzi";
            if (side && me) {
                const [x0, y0] = me, wx = x0 + e.x + (side === "E" ? 1 : side === "W" ? -1 : 0), wy = y0 + e.y + (side === "S" ? 1 : side === "N" ? -1 : 0);
                const q = UK[e.to]; const inside = wx >= q.x0 && wx < q.x0 + q.szer && wy >= q.y0 && wy < q.y0 + q.wys;
                why = inside ? "" : `nastepna kratka swiata (${wx},${wy}) nie lezy w ${e.to}`;
                if (inside) { const lwx = q.x0 + e.lx, lwy = q.y0 + e.ly; const along = side === "E" || side === "W" ? Math.abs(lwy - (y0 + e.y)) : Math.abs(lwx - (x0 + e.x)); ok = along <= 3; if (!ok) why = `ladowanie ${along} kratek obok`; }
            }
            t.check(`mapa ${id}: przejscie #${e.id} (${e.x},${e.y}) -> ${e.to} (${e.lx},${e.ly}) zgodne ze swiatem`, ok, { why, name: e.name, side });
        }
    }
    t.check("przejrzano przejscia map swiata", n > 20, n);
});
