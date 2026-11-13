// Kruczogród faza 1: mapa wczytuje się w grze przez nakładkę (tools/miasto3/staging), wejście do tawerny i powrót, 4 szwy, zdjęcia.
//   CDP_PORT=9590 node tools/miasto3/test_faza1.js
const kit = require("../../tests/lib/kit.js");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const SH = path.join(ROOT, "docs", "miasto3");
kit.test({ port: Number(process.env.CDP_PORT || 9590), lightGpu: true, bootCheck: "gra startuje (nakładka miasto3)", errorCheck: "bez błędów w konsoli", evalTimeout: 120000,
    overlay: "tools/miasto3/staging", overlayJs: true }, async t => {
    await t.newGame({ map: 8, x: 51, y: 18, dir: 8, quiet: true, hour: 12, day: 40, minimap: false });
    const r = await t.json("({ id: $gameMap.mapId(), ts: $gameMap.tilesetId(), w: $gameMap.width(), h: $gameMap.height(), ev: $gameMap.events().length })");
    t.check("Map008: zestaw 13, 120x120", r.id === 8 && r.ts === 13 && r.w === 120 && r.h === 120, r);
    await t.shot(path.join(SH, "faza1_ekran_dzien.png"));
    // wejście do tawerny drzwiami (51,16) i powrót wyjściem z Map001
    await t.eval("(function(){ $gamePlayer.setDirection(8); return 0; })()");
    for (let k = 0; k < 40 && (await t.json("$gameMap.mapId()")) === 8; k++) { await t.eval(`Input._currentState["up"] = true; 0`); await t.frames(4); }
    await t.eval("Input.clear(); 0"); await t.frames(30);
    const inn = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("drzwi tawerny prowadzą do Map001", inn.m === 1, inn);
    // powrót: wyjście Map001 (ev10-12) -> (50-52,17)
    const ex = await t.json("$gameMap.events().filter(e => /Wyj|Kruczogr/i.test(e.event().name) && e.event().pages[0].list.some(c => c.code === 201 && c.parameters[1] === 8)).map(e => ({ id: e.eventId(), x: e.x, y: e.y, to: e.event().pages[0].list.find(c => c.code === 201).parameters.slice(1, 4) }))");
    t.check("Map001: wyjścia do miasta lądują w y=17", ex.length >= 1 && ex.every(e => e.to[2] === 17), ex);
    await t.go(8, 51, 17, 2); await t.frames(20);
    const back = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
    t.check("wrót na (51,17) w Kruczogrodzie", back.m === 8 && back.x === 51 && back.y === 17, back);
    // szwy: z mapy a w stronę b w środku odcinka
    const links = await t.json(`SwiatData.links.filter((l, i, a) => (l.a === 8 || l.b === 8) && a.findIndex(q => q.a === l.a && q.b === l.b && q.from === l.from) === i).map(l => ({ a: l.a, b: l.b, side: l.side, from: l.from, to: l.to, mid: Math.round((l.from + l.to) / 2) }))`);
    t.check("są przejścia dla 6 bram", links.filter(l => l.a === 8).length === 6 + 0 || links.filter(l => l.a === 8).length >= 6, links.filter(l => l.a === 8));
    for (const l of links) {
        const m = await t.json(`SwiatData.maps[${l.a}]`);
        const loc = l.side === "N" || l.side === "S" ? [l.mid - m[0], l.side === "N" ? 1 : m[3] - 2] : [l.side === "W" ? 1 : m[2] - 2, l.mid - m[1]];
        await t.go(l.a, loc[0], loc[1], 2);
        const dir = { N: 8, S: 2, W: 4, E: 6 }[l.side];
        await t.eval(`$gamePlayer.setDirection(${dir}); 0`);
        for (let k = 0; k < 60 && (await t.json("$gameMap.mapId()")) === l.a; k++) { await t.eval(`Input._currentState["${{ 8: "up", 2: "down", 4: "left", 6: "right" }[dir]}"] = true; 0`); await t.frames(4); }
        await t.eval("Input.clear(); 0"); await t.frames(20);
        const now = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
        t.check(`przejście ${l.a} -> ${l.b} (${l.side}) przy ${l.mid}`, now.m === l.b, { start: loc, now });
    }
    // nocny ekran przy drzwiach tawerny
    await t.go(8, 51, 19, 8); await t.setHour(22); await t.frames(60);
    await t.shot(path.join(SH, "faza1_ekran_noc.png"));
    // stajnia: drzwi (69,8) -> Map181 -> wyjście ląduje w (74,8)
    await t.go(8, 69, 10, 8);
    for (let k = 0; k < 40 && (await t.json("$gameMap.mapId()")) === 8; k++) { await t.eval(`Input._currentState["up"] = true; 0`); await t.frames(4); }
    await t.eval("Input.clear(); 0"); await t.frames(30);
    const st = await t.json("({ m: $gameMap.mapId() })");
    t.check("drzwi stajni (69,8) prowadzą do Map181", st.m === 181, st);
    const ex2 = await t.json("$gameMap.events().filter(e => e.event().pages[0].list.some(c => c.code === 201)).map(e => e.event().pages[0].list.find(c => c.code === 201).parameters.slice(1, 4))");
    t.check("Map181: wyjścia -> (69,9)", ex2.length >= 2 && ex2.every(p => p[0] === 8 && p[1] === 69 && p[2] === 9), ex2);
    const mk = await t.json("$gameMap.events().filter(e => /stryszek|stajnia_zmiana/.test(e.event().name)).map(e => e.event().name + '@' + e.x + ',' + e.y)");
    t.check("Map181: znaczniki stryszek + stajnia_zmiana", mk.length === 2, mk);
});
