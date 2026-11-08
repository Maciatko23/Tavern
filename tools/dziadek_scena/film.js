// Podgląd sceny pierwszej rozmowy z dziadkiem (gracz 2026-11-07: paski kinowe, bez HUD-u, bohater leży w łóżku, dziadek wychodzi z cienia,
// podchodzi, rozmowa, wraca pod garnek): zrzuty kolejnych chwil do docs/dziadek_scena/film/*.png (+ GIF: film_gif.py).
//   GAME_OVERLAY=tools/dziadek_scena/staging GAME_OVERLAY_JS=1 CDP_PORT=9482 node tools/dziadek_scena/film.js
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.resolve(__dirname, "..", "..", "docs", "dziadek_scena", "film");
kit.test({ port: Number(process.env.CDP_PORT) || 9482, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 120000 }, async t => {
    fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
    let n = 0;
    const shot = async name => { await t.shot(path.join(OUT, String(n++).padStart(3, "0") + (name ? "_" + name : "") + ".png")); };
    const st = () => t.json(`({ hero: [$gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()], g: (function(){ const e = $gameMap.event(901); return e ? [e.x, e.y, e.direction()] : null; })(),
        intro: Story.state().intro, lying: Story.introLying ? Story.introLying() : null, bars: !!$gameTemp._hudScene, run: $gameMap.isEventRunning(), msg: $gameMessage.isBusy(),
        sees: window.Pokoje && Pokoje.sees ? Pokoje.sees(10, 6) : null, name: (CleanHUD.debug() || {}).name ? CleanHUD.debug().name.title : null })`);
    await t.newGame({ story: true, hour: 9, quiet: true });
    await t.eval(kit.DRIVER + "; 0");
    await t.frames(15);
    console.log("na początku", JSON.stringify(await st()));
    await shot("w_lozku");
    await t.frames(50);
    await shot("dziadek_rusza");
    for (let i = 0; i < 6; i++) { await t.frames(14); await shot("idzie"); }
    await t.until("$gameMessage.isBusy()", 20);
    await t.frames(20);
    console.log("rozmowa", JSON.stringify(await st()));
    await shot("rozmowa");
    await t.eval("window.__drv.on = true; 0");
    await t.until("Story.state().intro === 2 && !$gameMessage.isBusy()", 90);
    await t.eval("window.__drv.on = false; 0");
    await t.frames(10);
    await shot("wraca");
    for (let i = 0; i < 5; i++) { await t.frames(16); await shot("wraca"); }
    await t.until("!$gameMap.isEventRunning()", 30);
    console.log("koniec", JSON.stringify(await st()));
    await shot("wstal");
    await t.frames(40);
    console.log("po chwili", JSON.stringify(await st()));
    await shot("nazwa");
});
