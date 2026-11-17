// Mosty dwupoziomowe (Mosty.js): po pomoście górą (wejście końcem), korytem pod spodem (wejście z boku), pomost nad bohaterem pod mostem.
// CDP_PORT=9444 node tests/mosty_test.js      Zrzuty: docs/NOWY_SWIAT/mosty/
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "NOWY_SWIAT", "mosty"); fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: Number(process.env.CDP_PORT) || 9444, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 218, x: 40, y: 56, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(200);
    t.check("mosty na mapie", (await t.json("Mosty.list().length")) === 2, await t.json("Mosty.list()"));
    const pos = () => t.json("[Math.round($gamePlayer._realX*10)/10, Math.round($gamePlayer._realY*10)/10, Mosty.level()]");
    // over: from the north bank down the deck to the south bank
    let lvs = new Set();
    for (let i = 0; i < 120; i++) { await t.hold("down", 6); const p = await pos(); if (p[2]) lvs.add(p[2]); if (p[1] >= 66) break; }
    let p = await pos();
    t.check("górą: z północnego brzegu po pomoście na południowy", p[1] >= 65.5, { p, lvs: [...lvs] });
    t.check("na pomoście poziom „gora”", lvs.has("gora") && !lvs.has("dol"), [...lvs]);
    await t.newGame({ map: 218, x: 40, y: 56, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    for (let i = 0; i < 120; i++) { await t.hold("down", 6); p = await pos(); if (p[1] >= 61) break; }
    await t.hold("right", 40);
    await t.shot(path.join(OUT, "na_moscie_bok.png"));
    p = await pos();
    t.check("z pomostu nie zejdzie bokiem (barierki)", p[0] <= 41.6 && p[2] === "gora", p);
    // under: along the bed from the east, under the deck, out on the west side
    await t.newGame({ map: 218, x: 46, y: 62, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    lvs = new Set();
    let shot = false;
    for (let i = 0; i < 120; i++) {
        await t.hold("left", 6); p = await pos(); if (p[2]) lvs.add(p[2]);
        if (!shot && p[0] <= 40.2) { await t.frames(10); await t.shot(path.join(OUT, "pod_mostem.png")); shot = true; }
        if (p[0] <= 35) break;
    }
    t.check("dołem: korytem pod mostem na drugą stronę", p[0] <= 35.5, { p });
    t.check("pod mostem poziom „dol”", lvs.has("dol") && !lvs.has("gora"), [...lvs]);
    // under the bridge he cannot go up onto the deck nor the bank
    await t.newGame({ map: 218, x: 46, y: 62, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    for (let i = 0; i < 120; i++) { await t.hold("left", 6); p = await pos(); if (p[0] <= 40.2) break; }
    await t.hold("up", 60); p = await pos();
    t.check("spod mostu nie wejdzie na skarpę ani na pomost", p[1] >= 60.5 && p[2] === "dol", p);
    await t.hold("down", 60); p = await pos();
    t.check("spod mostu nie wyjdzie na południowy brzeg (krawędź skarpy)", p[1] <= 64.6 && p[2] === "dol", p);
    // the picture's rails over the banks: those cells are shut (the hero stood on the posts, 2026-11-13)
    t.check("słupki mostu na brzegach blokują", await t.json("[[38,58],[42,58],[38,65],[42,65]].every(([x, y]) => ![2,4,6,8].some(d => $gameMap.isPassable(x, y, d)))"));
    t.check("deski między słupkami na brzegu przechodnie", await t.json("[39,40,41].every(x => [4,6,8].some(d => $gameMap.isPassable(x, 58, d)))"));
    await t.newGame({ map: 218, x: 45, y: 58, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    await t.hold("left", 60); p = await pos();
    t.check("idąc brzegiem nie wejdzie na słupek", p[0] >= 42.6, p);
    // the town's bridge works the same
    await t.newGame({ map: 220, x: 14, y: 43, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(120);
    for (let i = 0; i < 120; i++) { await t.hold("down", 6); p = await pos(); if (p[1] >= 54) break; }
    t.check("Miasteczko: przez most górą", p[1] >= 53.5, p);
    await t.newGame({ map: 220, x: 20, y: 50, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    for (let i = 0; i < 120; i++) { await t.hold("left", 6); p = await pos(); if (p[0] <= 9) break; }
    t.check("Miasteczko: korytem pod mostem", p[0] <= 9.5, p);
});
