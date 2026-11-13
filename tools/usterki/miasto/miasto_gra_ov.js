// Nowy Kruczogród (tools/miasto5/staging) w grze: mapa, 6 bram w obie strony, drzwi, konie, zdjęcia.
const path = require("path");
const kit = require("../../../tests/lib/kit.js");
const STG = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/tools/miasto5/staging";
const SHOTS = process.env.SHOTS;
kit.test({ port: Number(process.env.PORT), overlay: process.env.OV, bootCheck: "gra" }, async t => {
    await t.newGame({ map: 8, x: 51, y: 18, dir: 2, day: 12, hour: 11, quiet: true, minimap: false }); await t.frames(40);
    const info = await t.json(`({ id: $gameMap.mapId(), w: $gameMap.width(), ev: $gameMap.events().length, ts: $gameMap.tilesetId() })`);
    t.check("Kruczogród wczytany (120x120, zestaw 11)", info.id === 8 && info.w === 120 && info.ts === 11, info);
    // the six gates, out and back
    const links = await t.json(`SwiatData.links.filter(l => l.a === 8 || l.b === 8).map(l => ({ a: l.a, b: l.b, side: l.side, mid: Math.round((l.from + l.to) / 2) }))`);
    t.check("6 bram miasta w obie strony = 12 odcinków", links.length === 12, links);
    for (const l of links) {
        const m = await t.json(`SwiatData.maps[${l.a}]`);
        const loc = l.side === "N" || l.side === "S" ? [l.mid - m[0], l.side === "N" ? 1 : m[3] - 2] : [l.side === "W" ? 1 : m[2] - 2, l.mid - m[1]];
        await t.newGame({ map: l.a, x: loc[0], y: loc[1], quiet: true }); await t.frames(20);
        const dir = { N: 8, S: 2, W: 4, E: 6 }[l.side];
        await t.eval(`$gamePlayer.setDirection(${dir}); 0`);
        for (let k = 0; k < 40 && (await t.json("$gameMap.mapId()")) === l.a; k++) { await t.eval(`Input._currentState["${{ 8: "up", 2: "down", 4: "left", 6: "right" }[dir]}"] = true; 0`); await t.frames(4); }
        await t.eval(`Input.clear(); 0`); await t.frames(20);
        const now = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
        t.check(`brama ${l.a} -> ${l.b} (${l.side})`, now.m === l.b, { start: loc, now });
    }
    // doors: walk up into them and back out
    const door = async (name, x, y, map) => {
        await t.newGame({ map: 8, x, y: y + 1, dir: 8, day: 12, hour: 11, quiet: true }); await t.frames(20);
        for (let k = 0; k < 30 && (await t.json("$gameMap.mapId()")) === 8; k++) { await t.eval(`Input._currentState.up = true; 0`); await t.frames(6); }
        await t.eval(`Input.clear(); 0`); await t.frames(60);
        const inn = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
        t.check(name + ": wejście -> mapa " + map, inn.m === map, inn);
        return inn;
    };
    await door("tawerna", 51, 16, 1);
    await door("stajnia", 92, 10, 181);
    await door("dom Agaty (przeniesiony)", 10, 104, 182);
    // out of Agata's house: find its exit and step on it
    const exit = await t.json(`(function(){ const e = $gameMap.events().find(e => /Kruczogr/.test(e.event().name)); return e ? [e.x, e.y] : null; })()`);
    if (exit) { await t.eval(`$gamePlayer.locate(${exit[0]}, ${exit[1] - 1}); $gamePlayer.setDirection(2); 0`); await t.frames(10);
        for (let k = 0; k < 20 && (await t.json("$gameMap.mapId()")) !== 8; k++) { await t.eval(`Input._currentState.down = true; 0`); await t.frames(6); }
        await t.eval(`Input.clear(); 0`); await t.frames(60); }
    const out = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("z domu Agaty na ulicę pod jego drzwiami (10,105)", out.m === 8 && out.x === 10 && out.y === 105, out);
    // horses
    await t.newGame({ map: 8, x: 103, y: 18, dir: 4, day: 12, hour: 11, quiet: true, minimap: false }); await t.frames(120);
    const hs = await t.json(`Konie.horses().map(e => [e.x, e.y])`);
    t.check("5 koni na podwórzu pod stajnią A", hs.length === 5 && hs.every(([x, y]) => x >= 84 && x <= 98 && y >= 11 && y <= 22), hs);
    const tr = await t.json(`[3263, 3270].map(id => { const e = $gameMap.event(id); return e && [e.x, e.y]; })`);
    t.check("wodopoje przy zachodnim płocie (83,17) i (83,21)", JSON.stringify(tr) === "[[83,17],[83,21]]", tr);
    // pictures
    const shot = async (n, x, y) => { await t.eval(`$gamePlayer.locate(${x}, ${y}); $gamePlayer.setDirection(2); 0`); await t.frames(50); await t.shot(path.join(SHOTS, n + ".png")); };
    await t.eval(`$gamePlayer.setOpacity(255); 0`);
    await shot("stajnia", 91, 17); await shot("podkuwacz", 91, 34); await shot("kruczarnia_handlarz", 110, 16); await shot("browar_brama_e2", 110, 49);
    await shot("zajazd_spichlerz", 110, 65); await shot("stodola_sad", 110, 91); await shot("pola_oboz", 88, 90); await shot("rzad_domow", 40, 107);
    await shot("brama_s", 31, 108); await shot("rynek", 52, 52); await shot("tawerna", 51, 20);
});
