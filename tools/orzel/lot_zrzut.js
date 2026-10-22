// Biały orzeł, ETAP 1: zrzuty mapy oddalonej jak w locie na orle (prototyp w samej stronie, NIC w grze się nie zmienia).
//   CDP_PORT=9542 node tools/orzel/lot_zrzut.js [outDir] [ryzyka]
// Jak to działa (to samo trzeba będzie zrobić we wtyczce): wirtualny ekran 1/s razy większy - Game_Map.screenTileX/Y dzielone przez s
// (przewijanie, środek kamery, "blisko ekranu" zdarzeń), tilemapa poszerzona do Graphics.width / s, cały Spriteset_Map w skali s od
// punktu (0, 0) przez zoom ekranu ($gameScreen._zoomScale = s, _zoomX/_zoomY = 0). Wariant "linear": tekstury tilemapy (wewnętrzne
// 2048x2048 rpgtilemap) i postaci z filtrowaniem liniowym - przy s = 0,5 to dokładna średnia 2x2 (bez migotania pikseli w ruchu).
// Zrzuty: <outDir>/m<mapa>_z<skala>[_nearest|_linear].png, potem tools/orzel/makieta_lotu.py.
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = process.argv[2] || path.join(__dirname, "zrzuty");

const FLY = (s, linear) => `(function(){
    const S = ${s};
    if (!window.__flyBase) window.__flyBase = { tx: Game_Map.prototype.screenTileX, ty: Game_Map.prototype.screenTileY };
    const B = window.__flyBase;
    Game_Map.prototype.screenTileX = function(){ return Math.round(B.tx.call(this) / S * 16) / 16; };
    Game_Map.prototype.screenTileY = function(){ return Math.round(B.ty.call(this) / S * 16) / 16; };
    const sp = SceneManager._scene._spriteset, tm = sp._tilemap;
    tm.width = Math.ceil(Graphics.width / S); tm.height = Math.ceil(Graphics.height / S); tm._needsRepaint = true;
    const sc = $gameScreen; sc._zoomScale = S; sc._zoomScaleTarget = S; sc._zoomDuration = 0; sc._zoomX = 0; sc._zoomY = 0;
    $gameMap._zoomFollowsPlayer = false;
    $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
    const r = Graphics._app.renderer.plugins.rpgtilemap;
    const mode = ${linear ? "PIXI.SCALE_MODES.LINEAR" : "PIXI.SCALE_MODES.NEAREST"};
    if (r) for (const t of r._internalTextures) t.scaleMode = mode;
    for (const ch of sp._characterSprites || []) if (ch.bitmap && ch.bitmap.baseTexture) ch.bitmap.baseTexture.scaleMode = mode;
    return 0; })()`;

const HIDE_HERO = `(function(){ $gamePlayer.setTransparent(true); $gamePlayer.followers().hide(); $gamePlayer.refresh(); return 0; })()`;
const CLEAR_POPS = `(function(){ const s = SceneManager._scene; if (s._lootLayer) s._lootLayer.removeChildren(); if ($gameTemp._lootPopups) $gameTemp._lootPopups.length = 0; return 0; })()`;
const INFO = `JSON.stringify({ map: $gameMap.mapId(), w: $gameMap.width(), h: $gameMap.height(), dx: $gameMap.displayX(), dy: $gameMap.displayY(),
    stx: $gameMap.screenTileX(), sty: $gameMap.screenTileY(), z: $gameScreen.zoomScale(), tw: SceneManager._scene._spriteset._tilemap.width })`;

// (mapa, x, y bohatera = środek widoku, dzień, godzina, ujęcia [skala, liniowo])
const SHOTS = process.argv[3] === "ryzyka" ? [
    // "ryzyka": noc i deszcz przy x0,5 - warstwy wielkości ekranu (noc Farming_Render, deszcz Weather) kryją tylko ćwierć widoku
    [3, 20, 15, 38, 22.5, [[1, false], [0.5, true]]],
    [3, 20, 15, 38, 14, [[0.5, true]], "$gameScreen.changeWeather('rain', 6, 0); 0"],
] : [
    [8, 26, 36, 38, 11.5, [[1, false], [0.5, false], [0.5, true], [0.67, true]]],
    [13, 30, 22, 38, 11.5, [[0.5, true]]],
    [3, 20, 15, 38, 11.5, [[1, false], [0.5, true]]],
];

kit.test({ port: 9542 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    for (const [map, x, y, day, hour, views, extra] of SHOTS) {
        await t.newGame({ map, x, y, day, hour, quiet: true, minimap: false });
        await t.eval(HIDE_HERO);
        if (extra) { await t.eval(extra); await t.frames(60); }
        for (const [s, linear] of views) {
            if (s !== 1) await t.eval(FLY(s, linear));
            await t.frames(30);
            await t.eval(CLEAR_POPS);
            await t.frames(4);
            const name = (extra ? "deszcz_" : hour >= 20 ? "noc_" : "") + "m" + String(map).padStart(3, "0") + "_z" + String(Math.round(s * 100)).padStart(3, "0") + (s === 1 ? "" : linear ? "_linear" : "_nearest") + ".png";
            await t.shot(path.join(OUT, name));
            console.log(name, await t.eval(INFO));
        }
        // back to the normal view before the next new game (the engine's own functions)
        await t.eval("(function(){ if (window.__flyBase) { Game_Map.prototype.screenTileX = __flyBase.tx; Game_Map.prototype.screenTileY = __flyBase.ty; } $gameScreen.clearZoom(); return 0; })()");
    }
    t.check("zrzuty bez błędów w konsoli", t.errors().length === 0, t.errors().slice(-3));
}).catch(e => { console.log("ERR", e); process.exit(1); });
