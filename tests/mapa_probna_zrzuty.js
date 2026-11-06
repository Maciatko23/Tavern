// Zrzuty z gry map próbnych A (990) i B (991): siatka ekranów co 27x15 kratek przez całe mapy + przejście A -> B -> A przez wspólną krawędź.
// GAME_OVERLAY=tools/mapa_probna/staging/nakladka GAME_OVERLAY_JS=1 CDP_PORT=9412 node tests/mapa_probna_zrzuty.js      Wynik: docs/mapa_probna/gra/*.png
// (nakładka: python tools/mapa_probna/install.py --nakladka; po instalacji nakładka niepotrzebna)
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "mapa_probna", process.env.ZRZUTY_PODKATALOG || "gra"); fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: Number(process.env.CDP_PORT) || 9412, beforeLoad: process.env.ZIEMIA_OFF ? "window.ZIEMIA = { off: true };" : undefined, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    const maps = await t.json("SwiatData.maps");
    t.check("A i B są w świecie", !!maps["990"] && !!maps["991"], maps["990"]);
    const XS = [13, 32, 50], YS = [7, 22, 37, 52];
    for (const id of [990, 991]) {
        await t.newGame({ map: id, x: 24, y: 34, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(420);   // (tabliczka z nazwą mapy znika po ok. 5 s)
        t.check("mapa " + id + " załadowana", await t.json("$gameMap.mapId()") === id);
        for (const y of YS) for (const x of XS) {
            await t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.center(${x}, ${y}); 0`);
            await t.frames(10);
            await t.shot(path.join(OUT, `ekran_${id}_${String(y).padStart(2, "0")}_${String(x).padStart(2, "0")}.png`));
        }
    }
    // przejście A -> B (idąc w prawo przy krawędzi na ścieżce) i z powrotem
    await t.newGame({ map: 990, x: 60, y: 38, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    await t.shot(path.join(OUT, "styk_A_przed.png"));
    let m = 990;
    for (let i = 0; i < 25 && m === 990; i++) { await t.hold("right", 12); m = await t.json("$gameMap.mapId()"); }
    await t.frames(40);
    await t.shot(path.join(OUT, "styk_B_po.png"));
    t.check("A -> B przez wspólną krawędź", m === 991, { m });
    const pos = await t.json("[$gamePlayer.x, $gamePlayer.y]");
    t.check("na B po lewej krawędzi, ta sama wysokość", pos[0] <= 2 && Math.abs(pos[1] - 38) <= 3, pos);
    for (let i = 0; i < 25 && m === 991; i++) { await t.hold("left", 12); m = await t.json("$gameMap.mapId()"); }
    await t.frames(40);
    await t.shot(path.join(OUT, "styk_A_po_powrocie.png"));
    t.check("B -> A", m === 990, { m });
});
