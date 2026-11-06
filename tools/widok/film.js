// Podgląd widoku na dworze: prawdziwy chód bohatera po mieście (w dzień i o zmierzchu), klatka po klatce. Zrzuty: docs/widok/film/*.png, GIF: film_gif.py
//   GAME_OVERLAY=tools/widok/staging GAME_OVERLAY_JS=1 CDP_PORT=9436 node tools/widok/film.js
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.resolve(__dirname, "..", "..", "docs", "widok", "film");
kit.test({ port: Number(process.env.CDP_PORT) || 9436, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 120000 }, async t => {
    fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
    let n = 0;
    const zrzut = () => t.shot(path.join(OUT, String(n++).padStart(3, "0") + ".png"));
    const krok = k => t.eval(`(() => { for (let i = 0; i < ${k}; i++) Graphics._onTick(1); })(); 0`);
    const idz = async (klawisz, ile) => { await t.eval(`Input._currentState.${klawisz} = true; 0`); for (let k = 0; k < ile; k++) { await krok(5); await zrzut(); } await t.eval(`Input._currentState.${klawisz} = false; 0`); };
    await t.newGame({ map: 8, x: 52, y: 70, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(200);
    await t.eval("Graphics._app.ticker.stop(); 0");
    await idz("up", 30);
    await idz("left", 30);
    await t.eval("Graphics._app.ticker.start(); 0");
    await t.setHour(21.5); await t.eval("$gamePlayer.locate(52, 70); 0"); await t.frames(120);
    await t.eval("Graphics._app.ticker.stop(); 0");
    await idz("up", 30);
    await t.eval("Graphics._app.ticker.start(); 0");
    console.log("zrzutów", n);
});
