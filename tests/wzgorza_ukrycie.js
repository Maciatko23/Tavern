// Zrzuty i pomiar wchodzenia za wzgórze (Wzgorza.js, runda 2): bohater z dolnego terenu wchodzi z tyłu i z boku (górna część), nie wejdzie na szczyt bokiem,
// z góry nie spada, schodami się wchodzi. Mapa próbna A (990), wzgórze z kafli na (37..47, 19..28).
// bez: PREFIKS=bez; z: GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1 PREFIKS=z (CDP_PORT=9413). Wynik: docs/wzgorza/runda2/ukrycie_<prefiks>_<nazwa>.png
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "wzgorza", "runda2"); fs.mkdirSync(OUT, { recursive: true });
const PRE = process.env.PREFIKS || "z";
const MAP = Number(process.env.MAPA) || 990;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: MAP, x: 40, y: 15, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(200);
    const strips = PRE === "z" ? await t.json("Wzgorza.geo().strips.map(s => [s.kind, s.hx, s.hy, s.x0 || 0, s.x1 || 0, s.y0 || 0, s.y1 || 0])") : [];
    const pos = () => t.json("({ x: $gamePlayer._realX, y: $gamePlayer._realY, tx: $gamePlayer.x, ty: $gamePlayer.y })");
    const shot = async name => { await t.frames(20); await t.shot(path.join(OUT, `ukrycie_${PRE}_${name}.png`)); };
    const place = async (x, y, dir) => { await t.eval(`$gamePlayer.setTransparent(false); $gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(${dir || 2}); $gameMap.setDisplayPos(${x} - $gameMap.screenTileX() / 2 + 0.5, ${y} - $gameMap.screenTileY() / 2 + 0.5); 0`); await t.frames(10); };
    const stepsOf = async (key, n) => { await t.hold(key, n); await t.frames(10); return pos(); };
    // pierwszy pas "tył" i "bok" wzgórza 2 (x >= 37)
    const north = strips.find(s => s[0] === 0 && s[1] >= 38 && s[1] <= 42), west = strips.find(s => s[0] === 1 && s[1] >= 36 && s[1] <= 38), east = strips.find(s => s[0] === 2 && s[1] >= 44);
    console.log("pasy", JSON.stringify({ north, west, east, n: strips.length }));
    const nx = north ? north[1] : 38, ny = north ? north[2] : 19;
    const west2 = west || (PRE === "z" ? null : [1, 37, 20]);
    // 1. za tylną krawędzią: stoi, potem wchodzi do pasa i dalej nie
    await place(nx, ny - 3);
    const p1 = await stepsOf("down", 70);
    console.log("tył: po marszu w dół", JSON.stringify(p1), "krawędź y =", ny * 48, "px, stopy (dół kratki) =", Math.round((p1.y + 1) * 48));
    await shot("za_krawedzia");
    // 2. z boku (górna część lewej krawędzi)
    if (west2) {
        const west = west2;
        const wx = west[1], wy = west[2];
        await place(wx - 3, wy, 6);
        const p2 = await stepsOf("right", 70);
        console.log("lewy bok: po marszu w prawo", JSON.stringify(p2), "krawędź x =", west[1] * 48);
        await shot("z_boku_gora");
    }
    // 3. z boku, dolna część (ta sama krawędź, 4 kratki niżej: pas się kończy)
    if (west2) {
        const west = west2;
        await place(west[1] - 3, west[2] + 4, 6);
        const p3 = await stepsOf("right", 70);
        console.log("lewy bok, dół: po marszu w prawo", JSON.stringify(p3));
        await shot("z_boku_dol");
    }
    // 4. na szczycie (bez zasłaniania) i przed licem
    await place(nx, ny + 4);
    await shot("na_szczycie");
    const p4 = await stepsOf("up", 90);
    console.log("szczyt: po marszu w górę", JSON.stringify(p4), "krawędź y =", ny * 48);
    await place(nx, ny + 12);
    await shot("przed_licem");
    // schody wzgórza gracza (x 12-13, y 18-19): wchodzenie i zejście
    await place(12, 22); await shot("schody_przed");
    await place(12, 19); await shot("schody_na_schodach");
    await place(12, 16); await shot("schody_na_szczycie");
});
