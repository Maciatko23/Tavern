// Czy warstwa rzeczy na ziemi (Farming_Render Sprite_StoneLayer: kamienie, len, jagody, grzyby, krzaki) wychodzi ta sama po zmianie
// (2026-11-06: zajęte kratki liczone raz na przebudowę) - na kilku mapach lista położeń i obrazków, plus czas przebudowy.
//   [GAME_OVERLAY=... GAME_OVERLAY_JS=1] CDP_PORT=9478 node tools/przejscia/kamienie_porownaj.js wynik.json
"use strict";
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = process.argv[2] || "kamienie.json";
const MAPS = [[3, 30, 30], [20, 10, 12], [21, 40, 40], [8, 54, 50], [125, 27, 20], [13, 29, 25]];
kit.test({ port: Number(process.env.CDP_PORT) || 9478, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    const out = {};
    for (const [id, x, y] of MAPS) {
        await t.eval(`$gamePlayer.reserveTransfer(${id}, ${x}, ${y}, 2, 0); 0`);
        await t.until(`$gameMap.mapId() === ${id} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor === Scene_Map && !SceneManager._scene.isFading()`, 60);
        await t.frames(20);
        out[id] = await t.json(`(function(){
            let L = null; const walk = s => { for (const c of s.children || []) { if (c.constructor && c.constructor.name === "Sprite_StoneLayer") L = c; walk(c); } };
            walk(SceneManager._scene._spriteset);
            if (!L) return { n: -1 };
            const ms = []; for (let i = 0; i < 5; i++) { const a = performance.now(); L.rebuild(); ms.push(performance.now() - a); }
            const list = L._entries.map(e => e.px + "," + e.py + ":" + ((e.sprite.bitmap && e.sprite.bitmap._url) || (e.sprite.texture && e.sprite.texture.baseTexture && e.sprite.texture.baseTexture.resource && e.sprite.texture.baseTexture.resource.url) || "?")).sort();
            return { n: list.length, list, ms: +ms.sort((a, b) => a - b)[2].toFixed(2) }; })()`);
        console.log("mapa " + id + ": rzeczy " + out[id].n + ", przebudowa " + out[id].ms + " ms");
    }
    fs.writeFileSync(OUT, JSON.stringify(out));
    t.check("zapisane", true, OUT);
});
