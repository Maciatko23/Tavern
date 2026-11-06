// Podgląd zasięgu widzenia: prawdziwy chód bohatera, klatka po klatce (zegar gry zatrzymany między zrzutami). Zrzuty: docs/tawerna_porzadki/film/*.png, GIF składa film_gif.py
//   GAME_OVERLAY=tools/tavern/pokoje/staging GAME_OVERLAY_JS=1 CDP_PORT=9429 node tools/tavern/pokoje/film.js
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../../tests/lib/kit.js");
const OUT = path.resolve(__dirname, "..", "..", "..", "docs", "tawerna_porzadki", "film");
kit.test({ port: Number(process.env.CDP_PORT) || 9429, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 120000 }, async t => {
    fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 1, x: 48, y: 32, day: 12, hour: 20, quiet: true, minimap: false });
    await t.frames(90);
    let n = 0;
    const zrzut = () => t.shot(path.join(OUT, String(n++).padStart(3, "0") + ".png"));
    const krok = k => t.eval(`(() => { for (let i = 0; i < ${k}; i++) Graphics._onTick(1); })(); 0`);
    const idz = async (klawisz, ile) => {
        await t.eval(`Input._currentState.${klawisz} = true; Input._currentState.shift = false; 0`);
        for (let k = 0; k < ile; k++) { await krok(5); await zrzut(); }
        await t.eval(`Input._currentState.${klawisz} = false; 0`);
    };
    await t.eval("Graphics._app.ticker.stop(); 0");
    await idz("left", 34);          // z sali przez szerokie przejście do skrzydła
    await t.eval("Graphics._app.ticker.start(); 0");
    await t.eval(`$gamePlayer.locate(50, 28); $gamePlayer.setDirection(8); 0`);
    await t.frames(40);
    await t.eval("Graphics._app.ticker.stop(); 0");
    await idz("up", 30);            // spod lady przez drzwi do korytarza
    await t.eval("Graphics._app.ticker.start(); 0");
    console.log("zrzutów", n, JSON.stringify(await t.json("[$gamePlayer.x, $gamePlayer.y]")));
});
