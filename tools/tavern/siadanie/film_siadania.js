// Podgląd siadania: GIF z gry (klatka po klatce, zegar gry zatrzymany między zrzutami): gość wstaje, schodzi ze stołka, potem wraca, wchodzi na stołek i siada.
//   GAME_OVERLAY=tools/tavern/siadanie/staging GAME_OVERLAY_JS=1 CDP_PORT=9419 node tools/tavern/siadanie/film_siadania.js
// Zrzuty: docs/tawerna_siadanie/film/*.png (GIF składa film_gif.py)
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../../tests/lib/kit.js");
const OUT = path.resolve(__dirname, "..", "..", "..", "docs", "tawerna_siadanie", "film");
const STEP = 4;
kit.test({ port: Number(process.env.CDP_PORT) || 9419, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 120000 }, async t => {
    fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 1, x: 50, y: 37, day: 12, hour: 20, quiet: true, minimap: false });
    await t.frames(120);
    const skos = await t.json(`GoscieSala.seats().filter(s => s.ax !== s.x && s.ay !== s.y).map(s => s.x + "," + s.y)`);
    const wszyscy = await t.json("GoscieSala.guests()");
    const g = wszyscy.find(x => x.state === "sit" && skos.includes(x.seat.join())) || wszyscy.find(x => x.state === "sit");
    console.log("ukośnych krzeseł:", skos.length, "gość", g.id, g.seat);
    const stan = () => t.json(`GoscieSala.guests().find(x => x.id === ${g.id}).state`);
    const przy = async s => { await t.eval(`$gamePlayer.locate(${s[0] - 4}, ${s[1] + 2}); 0`); await t.frames(30); };
    let n = 0;
    const zrzut = () => t.shot(path.join(OUT, String(n++).padStart(3, "0") + ".png"));
    const stop = () => t.eval("Graphics._app.ticker.stop(); 0");
    const start = () => t.eval("Graphics._app.ticker.start(); 0");
    const krok = k => t.eval(`(() => { for (let i = 0; i < ${k}; i++) Graphics._onTick(1); })(); 0`);
    await przy(g.seat);
    await stop();
    for (let k = 0; k < 4; k++) { await zrzut(); await krok(STEP); }
    await t.eval(`GoscieSala.force(${g.id}, "rise"); 0`);
    for (let k = 0; k < 40 && (await stan()) !== "walk"; k++) { await zrzut(); await krok(STEP); }
    for (let k = 0; k < 6; k++) { await zrzut(); await krok(STEP); }
    console.log("wstawanie: zrzutów", n);
    await start();
    await t.until(`GoscieSala.guests().find(x => x.id === ${g.id}).state === "stand"`, 60);
    await t.eval(`GoscieSala.force(${g.id}, "back"); 0`);
    await t.until(`(() => { const q = GoscieSala.guests().find(x => x.id === ${g.id}), e = $gameMap.event(${g.id}); return q.seat && Math.abs(e.x - q.seat[0]) + Math.abs(e.y - q.seat[1]) <= 3; })()`, 90);
    const teraz = await t.json(`GoscieSala.guests().find(x => x.id === ${g.id})`);
    console.log("do siadania:", teraz.state, teraz.seat);
    await przy(teraz.seat);
    await stop();
    for (let k = 0; k < 60 && (await stan()) !== "sit"; k++) { await zrzut(); await krok(STEP); }
    for (let k = 0; k < 8; k++) { await zrzut(); await krok(STEP); }
    await start();
    console.log("razem zrzutów", n);
});
