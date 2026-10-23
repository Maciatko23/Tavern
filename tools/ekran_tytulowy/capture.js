// Zrzuty scen do makiet ekranu tytułowego (docs/ekran_tytulowy). Tylko obrazy - nic w grze nie zmienia na stałe.
//   CDP_PORT=9470 node tools/ekran_tytulowy/capture.js [nazwa...]
// Każda scena: mapa, pozycja bohatera, środek kamery (kafelki), godzina, dzień (pora roku), pogoda, zoom, pochodnia, burza.
// Interfejs (HUD, okna) ukryty - zostaje sam świat z Mood.js (poświata, barwy, winieta).
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "zrzuty");
fs.mkdirSync(OUT, { recursive: true });

const SHOTS = [
    { name: "tawerna_deszcz", map: 8, x: 51, y: 19, cx: 51, cy: 13, hour: 22.5, weather: ["rain", 8], hide: true },
    { name: "tawerna_noc", map: 8, x: 51, y: 19, cx: 51, cy: 13, hour: 22.5, hide: true },
    { name: "kominek", map: 1, x: 40, y: 30, cx: 40, cy: 28, hour: 22, zoom: 2, hide: true },
    { name: "kominek_sala", map: 1, x: 50, y: 32, cx: 50, cy: 30, hour: 22, hide: true },
    { name: "ruiny_schody", map: 10, x: 14, y: 10, cx: 14, cy: 8, hour: 22, hide: true },
    { name: "serce", map: 11, x: 15, y: 12, cx: 15, cy: 10, hour: 22, hide: false, dir: 8 },
    { name: "serce_puste", map: 11, x: 15, y: 12, cx: 15, cy: 9, hour: 22, hide: true },
    { name: "chata_swit", map: 20, x: 15, y: 10, cx: 15, cy: 8, hour: 5.4, day: 30, hide: true },
    { name: "chata_rano", map: 20, x: 15, y: 10, cx: 15, cy: 8, hour: 6.6, day: 30, hide: true },
    // (2026-10-18) the empty Map005 "Las" was removed in the clean-up: the night forest is now Skraj lasu's woods (Map023)
    { name: "las_pochodnia", map: 23, x: 20, y: 19, cx: 20, cy: 19, hour: 23.5, torch: true, hide: false, dir: 2 },
    { name: "droga_pochodnia", map: 21, x: 20, y: 12, cx: 20, cy: 12, hour: 23.5, torch: true, hide: false, dir: 2 },
    { name: "tawerna_burza", map: 8, x: 51, y: 19, cx: 51, cy: 13, hour: 23, weather: ["storm", 9], storm: true, hide: true },
    { name: "tawerna_burza_b", map: 8, x: 51, y: 19, cx: 51, cy: 14.5, hour: 23, weather: ["storm", 9], storm: true, strikeD: 0.0, strikeWait: 3, hide: true },
    { name: "tawerna_zima", map: 8, x: 51, y: 19, cx: 51, cy: 13, hour: 21.5, day: 95, weather: ["snow", 7], hide: true },
    { name: "dwor_noc", map: 24, x: 20, y: 30, cx: 20, cy: 22, hour: 22, hide: true },
];

const want = process.argv.slice(2);
kit.test({ port: Number(process.env.CDP_PORT) || 9470, errorCheck: false }, async t => {
    const first = SHOTS.find(s => !want.length || want.includes(s.name));
    t.check("nowa gra", await t.newGame({ map: first.map, x: first.x, y: first.y, quiet: true, minimap: false }));
    // pogoda tylko ta, którą tu ustawiamy (Survival nie przestawia jej w trakcie)
    await t.eval(`(function(){
        if (window.__wx) return 0; window.__wx = { lock: null };
        const _cw = Game_Screen.prototype.changeWeather;
        Game_Screen.prototype.changeWeather = function(type, power, dur) { if (window.__wx.lock && !window.__wx.mine) return; return _cw.call(this, type, power, dur); };
        window.__setWx = function(type, power) { window.__wx.mine = true; $gameScreen.changeWeather(type, power, 0); $gameScreen._weatherPower = power; window.__wx.mine = false; window.__wx.lock = type; };
        return 0; })()`);
    for (const s of SHOTS) {
        if (want.length && !want.includes(s.name)) continue;
        await t.eval(`(function(){ window.__wx.lock = null; return 0; })()`);
        if (!(await t.go(s.map, s.x, s.y, s.dir || 2))) { console.log("NOTE no map", s.name); continue; }
        await t.quiet();
        await t.eval(`(function(){
            ${s.day ? `$gameSystem._dayNightDay = ${s.day};` : ""}
            $gameSystem.setDayNightHour(${s.hour});
            if (window.Survival && Survival.calmWeather) Survival.calmWeather();
            ${s.weather ? `__setWx(${JSON.stringify(s.weather[0])}, ${s.weather[1]});` : `__setWx("none", 0);`}
            $gamePlayer.setDirection(${s.dir || 2});
            $gamePlayer.setTransparent(${s.hide ? "true" : "false"});
            $gameMap.setDisplayPos(${s.cx} - 13.333 / ${s.zoom || 1} * 1, ${s.cy} - 7.5 / ${s.zoom || 1} * 1);
            ${s.zoom ? `$gameScreen.setZoom(640, 360, ${s.zoom});` : "$gameScreen.clearZoom && $gameScreen.clearZoom(); $gameScreen._zoomScale = 1;"}
            if (window.TownLife && TownLife.auto) TownLife.auto(false);
            return 0; })()`);
        if (s.torch) await t.eval(`(function(){ $gameParty.gainItem($dataItems[59], 2); if (window.Torch && !Torch.isLit()) Torch.light(); return 0; })()`);
        else await t.eval(`(function(){ if (window.Torch && Torch.isLit()) Torch.douse(""); return 0; })()`);
        if (s.zoom) await t.eval(`(function(){ $gameMap.setDisplayPos(${s.cx} - 13.333, ${s.cy} - 7.5); $gameScreen.setZoom(640, 360, ${s.zoom}); return 0; })()`);
        await t.frames(90);
        if (s.storm) {
            await t.eval(`(function(){ if (window.Survival) { Survival.forceStorm(3); } return 0; })()`);
            await t.eval(`$gameSystem.setDayNightHour(${s.hour}); 0`);
            await t.frames(120);
            await t.eval(`(function(){ if (window.Storm && Storm.strike) Storm.strike(${s.strikeD !== undefined ? s.strikeD : 0.05}); return 0; })()`);
            await t.frames(s.strikeWait || 5);
        }
        await t.eval(`(function(){ const sc = SceneManager._scene; sc.__hid = [];
            for (const c of sc.children) if (c !== sc._spriteset && c.renderable) { c.renderable = false; sc.__hid.push(c); }
            for (const w of (sc._windowLayer ? sc._windowLayer.children : [])) w.visible = false;
            return 0; })()`);
        await t.frames(3);
        await t.shot(path.join(OUT, s.name + ".png"));
        if (s.storm) {   // drugi zrzut chwilę później (po błysku) - do wyboru
            await t.frames(8);
            await t.shot(path.join(OUT, s.name + "_2.png"));
        }
        const info = await t.json(`({ map: $gameMap.mapId(), disp: [$gameMap.displayX(), $gameMap.displayY()], w: $gameMap.width(), h: $gameMap.height(), hour: $gameSystem.dayNightHour(),
            wx: [$gameScreen.weatherType(), $gameScreen.weatherPower()], torch: window.Torch ? Torch.isLit() : null, storm: window.Storm ? [Storm.phase(), Storm.flash()] : null })`);
        console.log("SHOT", s.name, JSON.stringify(info));
        await t.eval(`(function(){ const sc = SceneManager._scene; for (const c of sc.__hid || []) c.renderable = true; $gameScreen.clearZoom && $gameScreen.clearZoom(); $gamePlayer.setTransparent(false); return 0; })()`);
    }
});
