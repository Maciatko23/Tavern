// Kruczogród faza 2: każde drzwi wchodzi i wychodzi (wnętrze -> kratka przed drzwiami), miejsca mieszkańców osiągalne po całym mieście,
// 4 szwy (test_faza1). CDP_PORT=9594 node tools/miasto3/test_faza2.js
const kit = require("../../tests/lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT || 9594), lightGpu: true, bootCheck: "gra startuje (nakładka miasto3)", errorCheck: "bez błędów w konsoli", evalTimeout: 180000,
    overlay: "tools/miasto3/staging", overlayJs: true }, async t => {
    await t.newGame({ map: 8, x: 51, y: 40, dir: 2, quiet: true, hour: 12, day: 40, minimap: false });
    const doors = await t.json(`$gameMap.events().filter(e => e.event().pages[0].trigger === 1 && e.event().pages[0].list.some(c => c.code === 201)).map(e => ({ id: e.eventId(), x: e.x, y: e.y, name: e.event().name, to: e.event().pages[0].list.find(c => c.code === 201).parameters.slice(1, 4) }))`);
    t.check("drzwi znalezione: " + doors.length, doors.length >= 30, doors.length);
    let bad = [];
    for (const d of doors) {
        await t.go(8, d.x, d.y + 1, 8); await t.eval("$gamePlayer.setDirection(8); 0");
        for (let k = 0; k < 30 && (await t.json("$gameMap.mapId()")) === 8; k++) { await t.eval(`Input._currentState["up"] = true; 0`); await t.frames(3); }
        await t.eval("Input.clear(); 0"); await t.frames(10);
        const m = await t.json("$gameMap.mapId()");
        if (m !== d.to[0]) { bad.push({ d, m }); await t.go(8, 51, 40, 2); continue; }
        // wyjście: zdarzenie przeniesienia na mapę 8 w tym wnętrzu, które ląduje przed drzwiami
        const ex = await t.json("$gameMap.events().filter(e => e.event().pages[0].list.some(c => c.code === 201 && c.parameters[1] === 8)).map(e => e.event().pages[0].list.find(c => c.code === 201).parameters.slice(2, 4))");
        if (!ex.some(p => p[0] === d.x && p[1] === d.y + 1)) bad.push({ d, nie_ma_wyjscia_przed_drzwiami: ex });
    }
    t.check("każde drzwi wchodzą do swojego wnętrza, a wnętrze ma wyjście przed te drzwi", bad.length === 0, bad.slice(0, 6));
    // miejsca: znaczniki + SPOTS wtyczek osiągalne z traktu (BFS po przejściach gry)
    await t.go(8, 51, 36, 2);
    const r = await t.json(`(function(){
        const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[51, 36]]; seen[36 * W + 51] = 1;
        const solid = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough() && (/^!/.test(e.characterName() || "") || e.event().note.indexOf("<Occupy") >= 0 || /Tree|Rock|Bush/.test(e.event().note)));
        const D = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]], rev = { 2: 8, 8: 2, 4: 6, 6: 4 };
        while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of D) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
            if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, rev[d]) || solid(nx, ny)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
        const out = [], spots = window.TownLifeData ? TownLifeData.SPOTS : {};
        const mk = {}; for (const e of $gameMap.events()) { const m = /^Miejsce:\s*(\S+)/.exec(e.event().name); if (m) mk[m[1]] = [e.x, e.y]; }
        for (const k of Object.keys(spots)) { const s = mk[k] || spots[k]; if (!seen[s[1] * W + s[0]]) out.push(k + "@" + s[0] + "," + s[1]); }
        for (const e of $gameMap.events()) if (/^Miejsce:/.test(e.event().name) && !seen[e.y * W + e.x]) out.push(e.event().name + "@" + e.x + "," + e.y);
        return { n: Object.keys(spots).length, unreachable: out };
    })()`);
    const un = r.unreachable.filter(s => !/plyta|studnia_rynek|rynek_lawka|rozbitek_studnia/.test(s));
    t.check("miejsca TownLife (" + r.n + ") i znaczniki osiągalne", un.length === 0, un.slice(0, 12));
});
