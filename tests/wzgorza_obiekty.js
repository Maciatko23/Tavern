// Przegląd (bez zmian w grze): czy postać stojąca ZA obiektem (na północ od niego) jest zasłaniana tylko od dołu. Dla map 990, 991, 013, 159, 008, 003:
// zdarzenia-obrazki (skały, krzaki, kłody/pnie, drzewa, budynki) i kafle (mury A3/A4, płoty A2) - bohater o kratkę/dwie za nimi, wycinek 2x.
// node tests/wzgorza_obiekty.js  -> docs/wzgorza/runda3/obiekty/<mapa>_<rodzaj>_<n>.png + obiekty.json (opis miejsc)
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "wzgorza", "runda3", "obiekty"); fs.mkdirSync(OUT, { recursive: true });
const MAPS = (process.env.MAPY || "990,991,13,159,8,3").split(",").map(Number);
const KINDS = { skala: /Rock|Boulder|Mt_Blocks/, krzak: /Bush/, pien: /Stump|Trunk|Log/, drzewo: /Pine|Tree_/, budynek: /House|Roof|Statue|Town_Props/ };
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const index = [];
    for (const map of MAPS) {
        await t.newGame({ map, x: 5, y: 5, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(120);
        const found = await t.json(`(() => { const out = [], kinds = ${JSON.stringify(Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.source])))};
            const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).length && $gameMap.regionId(x, y) !== 2;
            const taken = {};
            for (const e of $gameMap._events) { if (!e || !e._characterName) continue; const nm = e._characterName; if (nm.indexOf("!") !== 0) continue;
                for (const k in kinds) if (new RegExp(kinds[k]).test(nm)) { taken[k] = taken[k] || []; if (taken[k].length < 3 && !taken[k].some(o => Math.abs(o.x - e.x) < 6 && Math.abs(o.y - e.y) < 6)) { for (const dy of [1, 2]) if (free(e.x, e.y - dy)) { taken[k].push({ x: e.x, y: e.y, hx: e.x, hy: e.y - dy, nm }); break; } } }
            }
            // tiles: a wall (A3/A4 tiles at z0) or a fence (A2 kind 22 / 23 at z0 or z1) with a free cell north of it
            const wall = [], fence = [];
            for (let y = 3; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) {
                const a = $gameMap.tileId(x, y, 0), b = $gameMap.tileId(x, y, 1), id = a >= 5888 ? a : (b >= 5888 ? b : 0), f = [a, b].find(i => i >= 3104 && i < 3200);
                if (id && wall.length < 3 && free(x, y - 1) && !wall.some(o => Math.abs(o.x - x) < 8 && Math.abs(o.y - y) < 8)) wall.push({ x, y, hx: x, hy: y - 1, nm: "A3/A4 " + id });
                if (f && fence.length < 3 && free(x, y - 1) && !fence.some(o => Math.abs(o.x - x) < 6 && Math.abs(o.y - y) < 6)) fence.push({ x, y, hx: x, hy: y - 1, nm: "A2 " + f });
            }
            taken.mur = wall; taken.plot = fence;
            return taken; })()`);
        for (const kind of Object.keys(found)) found[kind].forEach(async () => {});
        for (const kind of Object.keys(found)) for (let i = 0; i < found[kind].length; i++) {
            const c = found[kind][i];
            await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer.locate(${c.hx}, ${c.hy}); $gamePlayer.setDirection(2); $gameMap.setDisplayPos(${c.hx} - $gameMap.screenTileX() / 2 + 0.5, ${c.hy} - $gameMap.screenTileY() / 2 + 0.5); 0`);
            await t.frames(14);
            const f = path.join(OUT, `${map}_${kind}_${i + 1}.png`);
            await t.shot(f);
            index.push({ mapa: map, rodzaj: kind, n: i + 1, obiekt: c.nm, kratka_obiektu: [c.x, c.y], kratka_bohatera: [c.hx, c.hy], plik: path.basename(f) });
        }
    }
    fs.writeFileSync(path.join(OUT, "obiekty.json"), JSON.stringify(index, null, 1));
    console.log("zrzutów:", index.length);
});
