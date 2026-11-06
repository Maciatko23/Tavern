// Stoper na krokach samej zmiany mapy (2026-11-06, „jak drastycznie przyspieszyć wczytywanie mapy”): zrzut tła, sprzątanie starej
// sceny, ustawienie mapy (zdarzenia), budowa obrazu (spriteset), odczyt danych - ile każdy trwał przy jednym przejściu.
//   CDP_PORT=9473 [CPU=4] node tools/przejscia/kroki.js [z_mapy] [na_mape] [x] [y]
"use strict";
const kit = require("../../tests/lib/kit.js");
const [from, to, tx, ty] = process.argv.slice(2).map(Number);
const CPU = Number(process.env.CPU) || 1;
kit.test({ port: Number(process.env.CDP_PORT) || 9473, lightGpu: true, bootCheck: "gra", errorCheck: "bez błędów", evalTimeout: 240000 }, async t => {
    await t.newGame({ map: from || 3, x: 30, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(240);
    await t.eval(`(() => {
        const L = window.__kr = [];
        const wrap = (obj, name, label) => { const f = obj[name]; if (!f || f.__kr) return; const g = function() { const a = performance.now(); try { return f.apply(this, arguments); } finally { const d = performance.now() - a; if (d > 2) L.push([label, +d.toFixed(1)]); } }; g.__kr = true; obj[name] = g; };
        wrap(Scene_Map.prototype, "terminate", "Scene_Map.terminate (stara)");
        wrap(SceneManager, "snapForBackground", "zrzut tła (snapForBackground)");
        wrap(SceneManager, "onBeforeSceneStart", "sprzątanie starej sceny (destroy)");
        wrap(Scene_Map.prototype, "create", "Scene_Map.create");
        wrap(Scene_Map.prototype, "onMapLoaded", "onMapLoaded (setup mapy + obraz)");
        wrap(Scene_Map.prototype, "createDisplayObjects", "createDisplayObjects (spriteset, okna)");
        wrap(Spriteset_Map.prototype, "createLowerLayer", "Spriteset.createLowerLayer");
        wrap(Spriteset_Map.prototype, "createCharacters", "Spriteset.createCharacters");
        wrap(Spriteset_Map.prototype, "createTilemap", "Spriteset.createTilemap");
        wrap(Game_Map.prototype, "setup", "Game_Map.setup (zdarzenia)");
        wrap(Game_Map.prototype, "setupEvents", "Game_Map.setupEvents");
        wrap(Game_Player.prototype, "performTransfer", "Game_Player.performTransfer");
        wrap(DataManager, "onXhrLoad", "odczyt danych (JSON)");
        wrap(DataManager, "onLoad", "DataManager.onLoad");
        wrap(Scene_Map.prototype, "start", "Scene_Map.start");
        wrap(Scene_Map.prototype, "createSpriteset", "  Scene_Map.createSpriteset");
        wrap(Scene_Map.prototype, "createWindowLayer", "  Scene_Map.createWindowLayer");
        wrap(Scene_Map.prototype, "createAllWindows", "  Scene_Map.createAllWindows");
        wrap(Scene_Map.prototype, "createButtons", "  Scene_Map.createButtons");
        wrap(Spriteset_Map.prototype, "initialize", "    Spriteset_Map.initialize");
        wrap(Spriteset_Map.prototype, "createUpperLayer", "    Spriteset.createUpperLayer");
        wrap(Spriteset_Map.prototype, "createParallax", "    Spriteset.createParallax");
        wrap(Spriteset_Map.prototype, "createWeather", "    Spriteset.createWeather");
        wrap(Spriteset_Base.prototype, "createPictures", "    Spriteset.createPictures");
        wrap(Spriteset_Base.prototype, "createBaseSprite", "    Spriteset.createBaseSprite");
        wrap(Spriteset_Base.prototype, "createOverallFilters", "    Spriteset.createOverallFilters");
        wrap(Spriteset_Map.prototype, "createShadow", "    Spriteset.createShadow");
        wrap(Spriteset_Map.prototype, "createDestination", "    Spriteset.createDestination");
        wrap(Bitmap.prototype, "_createCanvas", "      Bitmap._createCanvas");
        wrap(Tilemap.prototype, "initialize", "      Tilemap.initialize");
        wrap(Sprite_Character.prototype, "initialize", "      Sprite_Character.initialize");
        wrap(Scene_Map.prototype, "isReady", "Scene_Map.isReady (czekanie na nakładki)");
        // (KLASY=1: every sprite class of the map's picture - from this map's spriteset - timed by its update: the overlays' first frames)
        if (${process.env.KLASY ? 1 : 0}) {
            const seen = new Set(), walk = s => { for (const c of s.children || []) { const P = Object.getPrototypeOf(c); if (P && P !== Sprite.prototype && !seen.has(P) && P.hasOwnProperty("update")) { seen.add(P); wrap(P, "update", "      update " + (c.constructor && c.constructor.name || "?")); } walk(c); } };
            walk(SceneManager._scene._spriteset);
        }
        return 0; })()`);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await t.eval(`$gamePlayer.reserveTransfer(${to || 21}, ${tx || 40}, ${ty || 40}, 2, 0); 0`);
    await t.until(`$gameMap.mapId() === ${to || 21} && !$gamePlayer.isTransferring() && SceneManager._scene.constructor === Scene_Map && !SceneManager._scene.isFading()`, 60);
    if (CPU > 1) await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const L = await t.json("window.__kr");
    const sum = new Map(), cnt = new Map();
    for (const [k, d] of L) { sum.set(k, (sum.get(k) || 0) + d); cnt.set(k, (cnt.get(k) || 0) + 1); }
    for (const [k, d] of [...sum.entries()].sort((a, b) => b[1] - a[1])) console.log(String(Math.round(d)).padStart(6) + " ms  " + k + (cnt.get(k) > 1 ? "  (" + cnt.get(k) + " razy)" : ""));
});
