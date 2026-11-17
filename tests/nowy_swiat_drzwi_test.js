// Nowy świat (2026-11-15): każde otwarte drzwi map 218-221 prowadzą do wnętrza, a wyjście z niego wraca przed te same drzwi.
// Lista drzwi z samych map (zdarzenia z <Town:door=...> i przejściem), więc test idzie za tym, co jest na mapach.
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9396, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    let all = 0, bad = [];
    const gated = [];
    for (const map of [218, 219, 220, 221]) {
        await t.newGame({ map, x: 40, y: 41, day: 5, hour: 12, quiet: true, minimap: false });
        const doors = await t.json(`$dataMap.events.filter(e => e && /<Town:door=/.test(e.note || "") && e.pages.some(p => p.list.some(c => c.code === 201))).map(e => ({ id: e.id, key: /<Town:door=([^>]+)>/.exec(e.note)[1], x: e.x, y: e.y, to: e.pages.map(p => p.list.find(c => c.code === 201)).filter(Boolean)[0].parameters.slice(1, 4),
            gate: (e.pages[0].list.find(c => c.code === 111 && c.parameters[0] === 12 && /drzwiOtwarte/.test(c.parameters[1])) || { parameters: [] }).parameters[1] || null }))`);
        for (const d of doors) {
            all++;
            if ((await t.json("$gameMap.mapId()")) !== map) await t.go(map, d.x, d.y + 1, 8);
            await t.setHour(12);
            await t.eval(`(function(){ $gamePlayer.locate(${d.x}, ${d.y + 1}); $gamePlayer.setDirection(8); $gameMap.event(${d.id}).start(); return 0; })()`);
            // (a door a thread keeps shut till its story opens it - the mill, the guild: shut is right)
            if (d.gate && !(await t.json(d.gate))) { gated.push(map + ":" + d.key); await t.frames(30); await t.eval("if ($gameMessage.isBusy()) { $gameMessage.clear(); } 0"); continue; }
            const inn = await t.until(t.onMap(d.to[0]), 15);
            await t.frames(20);
            const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gameMap.isPassable($gamePlayer.x, $gamePlayer.y, 8) || $gameMap.isPassable($gamePlayer.x, $gamePlayer.y, 2)]");
            if (!inn || !at[3]) { bad.push(map + ":" + d.key + " nie wchodzi " + JSON.stringify(at)); if (!inn) continue; }
            // out again: the room's exit that leads to this map
            const ex = await t.json(`(function(){ const all = $dataMap.events.filter(e => e && e.pages.some(p => p.list.some(c => c.code === 201 && c.parameters[1] === ${map}))); const far = e => Math.abs(e.x - $gamePlayer.x) + Math.abs(e.y - $gamePlayer.y); const e = all.sort((a, b) => far(a) - far(b))[0];   /* (a room with two doors: the exit nearest to where the hero came in) */ if (!e) return null; const c = e.pages.map(p => p.list.find(c => c.code === 201)).filter(Boolean)[0]; return { id: e.id, to: c.parameters.slice(1, 4) }; })()`);
            if (!ex) { bad.push(map + ":" + d.key + " wnętrze bez wyjścia na mapę " + map); await t.go(map, d.x, d.y + 1, 8); continue; }
            await t.eval(`$gameMap.event(${ex.id}).start(); 0`);
            const out = await t.until(t.onMap(map), 15);
            await t.frames(20);
            const back = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
            if (!out || back[1] !== d.x || back[2] !== d.y + 1) bad.push(map + ":" + d.key + " wyjście " + JSON.stringify(back) + " zamiast " + d.x + "," + (d.y + 1));
        }
        t.check("mapa " + map + ": " + doors.length + " drzwi do wnętrz i z powrotem", true, doors.map(d => d.key).join(" "));
    }
    t.check("wszystkie drzwi (" + all + ") działają w obie strony; zamknięte przez swój wątek: " + gated.join(", "), all >= 35 && bad.length === 0, bad);
});
