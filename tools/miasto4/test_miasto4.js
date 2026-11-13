// Kruczogród v2 (miasto4) przez nakładkę tools/miasto4/staging: mapa, każde drzwi wchodzą i wychodzą (przed drzwi), miejsca osiągalne, 6 bram w obie strony,
// doba mieszkańców.   CDP_PORT=9630 node tools/miasto4/test_miasto4.js
const kit = require("../../tests/lib/kit.js");
const fs = require("fs"), path = require("path");
const SH = path.join(__dirname, "..", "..", "docs", "miasto4");
kit.test({ port: Number(process.env.CDP_PORT || 9630), lightGpu: true, bootCheck: "gra startuje (nakładka miasto4)", errorCheck: "bez błędów w konsoli", evalTimeout: 240000,
    overlay: "tools/miasto4/staging", overlayJs: true }, async t => {
    await t.newGame({ map: 8, x: 51, y: 40, dir: 2, quiet: true, hour: 12, day: 40, minimap: false });
    const r = await t.json("({ id: $gameMap.mapId(), ts: $gameMap.tilesetId(), w: $gameMap.width(), h: $gameMap.height(), ev: $gameMap.events().length })");
    t.check("Map008: zestaw 13, 120x120", r.id === 8 && r.ts === 13 && r.w === 120 && r.h === 120, r);
    const doors = await t.json(`$gameMap.events().filter(e => e.event().pages[0].trigger === 1 && e.event().pages[0].list.some(c => c.code === 201)).map(e => ({ id: e.eventId(), x: e.x, y: e.y, name: e.event().name, to: e.event().pages[0].list.find(c => c.code === 201).parameters.slice(1, 4) }))`);
    t.check("drzwi znalezione: " + doors.length + " (wzgórze + nowe)", doors.length >= 24, doors.map(d => d.id));
    const bad = [];
    for (const d of (process.env.SKIP_DOORS ? [] : doors)) {
        await t.go(8, d.x, d.y + 1, 8); await t.eval("$gamePlayer.setDirection(8); 0");
        for (let k = 0; k < 30 && (await t.json("$gameMap.mapId()")) === 8; k++) { await t.eval(`Input._currentState["up"] = true; 0`); await t.frames(3); }
        await t.eval("Input.clear(); 0"); await t.frames(10);
        const m = await t.json("$gameMap.mapId()");
        if (m !== d.to[0]) { bad.push({ d, m }); await t.go(8, 51, 40, 2); continue; }
        const ex = await t.json("$gameMap.events().filter(e => e.event().pages[0].list.some(c => c.code === 201 && c.parameters[1] === 8)).map(e => e.event().pages[0].list.find(c => c.code === 201).parameters.slice(2, 4))");
        if (!ex.some(p => Math.abs(p[0] - d.x) <= 1 && Math.abs(p[1] - (d.y + 1)) <= 1)) bad.push({ d, nie_ma_wyjscia_przed_drzwiami: ex });
        else {
            const exev = await t.json(`(function(){ const e = $gameMap.events().find(e => e.event().pages[0].list.some(c => c.code === 201 && c.parameters[1] === 8 && c.parameters[2] === ${d.x} && c.parameters[3] === ${d.y + 1})); return e ? [e.x, e.y] : null; })()`);
            if (exev) {
                await t.go(m, exev[0], exev[1] - 1, 2);
                for (let k = 0; k < 30 && (await t.json("$gameMap.mapId()")) === m; k++) { await t.eval(`Input._currentState["down"] = true; 0`); await t.frames(3); }
                await t.eval("Input.clear(); 0"); await t.frames(10);
                const back = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
                if (back.m !== 8 || Math.abs(back.x - d.x) > 1 || Math.abs(back.y - (d.y + 1)) > 1) { bad.push({ d, wyjscie: back }); await t.go(8, 51, 40, 2); }
            }
        }
    }
    t.check("każde drzwi: wejście i wyjście przed te drzwi", bad.length === 0, bad.slice(0, 6));
    await t.go(8, 51, 40, 2);
    const rr = await t.json(`(function(){
        const W = $gameMap.width(), H = $gameMap.height(), seen = new Uint8Array(W * H), q = [[51, 40]]; seen[40 * W + 51] = 1;
        const solid = (x, y) => $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough() && (/^!/.test(e.characterName() || "") || e.event().note.indexOf("<Occupy") >= 0 || /Tree|Rock|Bush/.test(e.event().note)));
        const D = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]], rev = { 2: 8, 8: 2, 4: 6, 6: 4 };
        while (q.length) { const [x, y] = q.pop(); for (const [d, dx, dy] of D) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
            if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, rev[d]) || solid(nx, ny)) continue; seen[ny * W + nx] = 1; q.push([nx, ny]); } }
        const out = [], spots = window.TownLifeData ? TownLifeData.SPOTS : {};
        const mk = {}; for (const e of $gameMap.events()) { const m = /^Miejsce:\\s*(\\S+)/.exec(e.event().name); if (m) mk[m[1]] = [e.x, e.y]; }
        for (const k of Object.keys(spots)) { const s = mk[k] || spots[k]; if (!seen[s[1] * W + s[0]]) out.push(k + "@" + s[0] + "," + s[1]); }
        for (const e of $gameMap.events()) if (/^Miejsce:/.test(e.event().name) && !seen[e.y * W + e.x]) out.push(e.event().name + "@" + e.x + "," + e.y);
        return { n: Object.keys(spots).length, unreachable: out };
    })()`);
    const un = rr.unreachable.filter(s => !/plyta|rozbitek_wnetrze/.test(s));
    t.check("miejsca TownLife (" + rr.n + ") i znaczniki osiągalne w grze", un.length === 0, un.slice(0, 12));
    const links = await t.json(`SwiatData.links.filter((l, i, a) => (l.a === 8 || l.b === 8) && a.findIndex(q => q.a === l.a && q.b === l.b && q.from === l.from) === i).map(l => ({ a: l.a, b: l.b, side: l.side, from: l.from, to: l.to, mid: Math.round((l.from + l.to) / 2) }))`);
    for (const l of links.filter(l => l.a === 8)) {
        const m = await t.json(`SwiatData.maps[${l.a}]`);
        const loc = l.side === "N" || l.side === "S" ? [l.mid - m[0], l.side === "N" ? 1 : m[3] - 2] : [l.side === "W" ? 1 : m[2] - 2, l.mid - m[1]];
        await t.go(l.a, loc[0], loc[1], 2);
        const dir = { N: 8, S: 2, W: 4, E: 6 }[l.side];
        await t.eval(`$gamePlayer.setDirection(${dir}); 0`);
        for (let k = 0; k < 60 && (await t.json("$gameMap.mapId()")) === l.a; k++) { await t.eval(`Input._currentState["${{ 8: "up", 2: "down", 4: "left", 6: "right" }[dir]}"] = true; 0`); await t.frames(4); }
        await t.eval("Input.clear(); 0"); await t.frames(20);
        const now = await t.json("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })");
        t.check(`brama ${l.side} przy ${l.mid}: ${l.a} -> ${l.b}`, now.m === l.b, { loc, now });
    }
    await t.go(8, 60, 62, 2);
    const hours = [6.5, 9, 11, 13, 15.5, 18, 20, 22];
    const log = {};
    for (const h of hours) {
        await t.setHour(h); await t.frames(400);
        log[h] = await t.json(`(function(){ const o = {}; for (const r of TownLife.RESIDENTS.filter(r => TownLife.homeOf(r) === 8)) { const s = TownLife.state(r.key), e = TownLife.eventOf(r.key); o[r.key] = [s.hidden ? 1 : 0, e ? e.x : -1, e ? e.y : -1, s.stuck | 0]; } return o; })()`);
    }
    const keys = Object.keys(log[hours[0]]);
    const stuckers = keys.filter(k => hours.some(h => log[h][k][3] > 600));
    const TOWNSFOLK = ["kowal", "piekarka", "woziwoda", "dzwonnik", "kupiec", "soltys", "garbarz", "bronek", "zosia", "przekupka", "szwaczka", "wdowa", "ciesla", "weteran", "grabarz", "kapral", "kolodziej"].filter(k => keys.includes(k));
    const moved = TOWNSFOLK.filter(k => new Set(hours.map(h => log[h][k].slice(0, 3).join(","))).size >= 3);
    t.check("doba: mieszkańcy miasta przemieszczają się między miejscami (" + moved.length + "/" + TOWNSFOLK.length + ")", moved.length >= TOWNSFOLK.length - 2, { nie: TOWNSFOLK.filter(k => !moved.includes(k)) });
    fs.writeFileSync(path.join(SH, "doba.json"), JSON.stringify(log));
    await t.setHour(12); await t.go(8, 60, 62, 8); await t.frames(60);
    await t.shot(path.join(SH, "gra_plac.png"));
});
