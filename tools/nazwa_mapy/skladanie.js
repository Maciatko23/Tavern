// Ile kosztuje samo złożenie kinowej nazwy (build) i pierwsze narysowanie jej (wysłanie tekstur): 20 razy, mediana.
//   [GAME_OVERLAY=tools/nazwa_mapy/staging GAME_OVERLAY_JS=1] CDP_PORT=9464 node tools/nazwa_mapy/skladanie.js
"use strict";
const kit = require("../../tests/lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9464, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(240);
    const r = await t.json(`(() => {
        const c = SceneManager._scene._cleanCinema, app = Graphics._app, gl = app.renderer.gl, b = [], d = [];
        for (let i = 0; i < 21; i++) {
            c.start(Object.assign(CleanHUD.placeInfo(), { kind: "place", first: true, title: "Polna droga " + i, opis: "Kurz po kostki, a przy kapliczce leżą polne kwiaty." }));
            const a = performance.now(); c.build(); const m = performance.now();
            c.visible = true; c.animate(1); app.renderer.render(c); gl.finish(); const e = performance.now();
            if (i) { b.push(m - a); d.push(e - m); }
            c.clear("test");
        }
        const med = v => v.sort((x, y) => x - y)[v.length >> 1];
        return { build: +med(b).toFixed(2), draw: +med(d).toFixed(2), buildMax: +Math.max(...b).toFixed(2) };
    })()`);
    console.log("składanie: " + r.build + " ms (najwięcej " + r.buildMax + "), pierwsze rysowanie: " + r.draw + " ms");
});
