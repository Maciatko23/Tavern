// the six new buildings' doors (2026-11-11): walk up to each from the street, the hero stays on Map008 and a popup says it is closed.
//   OV=<overlay folder> PORT=97xx node tools/miasto5/budynki_drzwi_test.js
const kit = require("../../tests/lib/kit.js");
const DOORS = [["Cech", 91, 87], ["Łaźnia", 97, 73], ["Przytułek", 97, 104], ["Garbarnia", 114, 88], ["Wiatrak", 97, 87], ["Sukiennice (lewe)", 51, 62], ["Sukiennice (prawe)", 52, 62]];
kit.test({ port: Number(process.env.PORT || 9737), overlay: process.env.OV, bootCheck: "gra", beforeLoad: "window.KLIMAT_ZIEMIA = { off: true };" }, async t => {
    for (const [name, x, y] of DOORS) {
        await t.newGame({ map: 8, x, y: y + 1, dir: 8, day: 12, hour: 11, quiet: true, minimap: false }); await t.frames(30);
        await t.eval(`window.__pops = []; (function(){ const o = Tawerna.popup; Tawerna.popup = function(t){ window.__pops.push(String(t)); return o.apply(this, arguments); }; return 0; })()`);
        for (let k = 0; k < 6; k++) { await t.eval(`Input._currentState.up = true; 0`); await t.frames(6); }
        await t.eval(`Input.clear(); 0`); await t.frames(20);
        const r = await t.json(`({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, pops: window.__pops })`);
        t.check(`${name}: drzwi (${x},${y}) - zostaje na mapie 8, dymek "zamknięte"`, r.m === 8 && r.pops.length >= 1 && /zamkni|obrad|handlarz/i.test(r.pops.join(" ")), r);
    }
});
