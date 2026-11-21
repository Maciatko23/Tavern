// Widzenie ludzi (js/plugins/Widzenie.js, 2026-11-19): jedna zasada (stożek przed sobą, blisko z każdej strony, słuch bez skradania,
// zasłony), pasek zauważenia ?/!, stożki na ziemi w skradaniu (C), koszt klatki.
//   CDP_PORT=9476 node tests/widzenie_test.js        (ZRZUTY=folder: zrzut skradania w miasteczku)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9476, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    t.check("wtyczka wczytana", await t.json("!!window.Widzenie"));
    await t.newGame({ map: 220, x: 40, y: 40, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(120);
    const sneak = on => t.eval(`Tawerna.state("hunt").sneak = ${on ? "true" : "false"}; 0`);
    // a person with free ground round him (the rule needs room to look at)
    const p = await t.json(`(() => {
        const free = (x, y) => $gameMap.isValid(x, y) && !Widzenie.blocked(x, y);
        for (const ev of $gameMap.events()) {
            if (!Widzenie.isPerson(ev)) continue;
            const x = ev.x, y = ev.y; let ok = true;
            for (let dy = -6; dy <= 6 && ok; dy++) if (!free(x, y + dy)) ok = false;
            if (ok) return { id: ev.eventId(), x, y, name: ev.event().name };
        }
        return null; })()`);
    t.check("w miasteczku są ludzie, którzy patrzą (i jeden z wolnym polem przed i za sobą)", !!p, p);
    if (p) {
        const rule = await t.json(`(() => {
            const ev = $gameMap.event(${p.id}); ev.setDirection(2); const x = ${p.x}, y = ${p.y};
            const S = { sneak: true }, N = { sneak: false };
            return { front3: Widzenie.sees(ev, x, y + 3, S), front5sneak: Widzenie.sees(ev, x, y + 5, S), front5walk: Widzenie.sees(ev, x, y + 5, N),
                behind3sneak: Widzenie.sees(ev, x, y - 3, S), behind3walk: Widzenie.sees(ev, x, y - 3, N), beside1: Widzenie.sees(ev, x + 1, y, S),
                far8: Widzenie.sees(ev, x, y + 8, N) }; })()`);
        t.check("stożek: przed nim 3 kratki widzi, 5 kratek tylko gdy się nie skradasz; za plecami nie widzi skradającego, ale słyszy idącego; tuż obok czuje z boku; 8 kratek - nie",
            rule.front3 && !rule.front5sneak && rule.front5walk && !rule.behind3sneak && rule.behind3walk && rule.beside1 && !rule.far8, rule);
    }
    // a wall hides: a staged scene - a person two tiles before a blocking cell looking at it, the target two tiles past it
    const wall = p ? await t.json(`(() => {
        const W = $gameMap.width(), H = $gameMap.height(), ok = (x, y) => $gameMap.isValid(x, y) && !Widzenie.blocked(x, y);
        for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
            if (!Widzenie.blocked(x, y)) continue;
            for (const [d, fx, fy] of [[6, 1, 0], [4, -1, 0], [2, 0, 1], [8, 0, -1]]) {
                const sx = x - 2 * fx, sy = y - 2 * fy, tx = x + 2 * fx, ty = y + 2 * fy;
                if (!ok(sx, sy) || !ok(sx + fx, sy + fy) || !ok(tx, ty) || !ok(x + fx, y + fy)) continue;
                const ev = $gameMap.event(${p ? p.id : 0}); ev.locate(sx, sy); ev._direction = d;
                const open = Widzenie.sees(ev, sx + fx, sy + fy, { sneak: false }), behind = Widzenie.sees(ev, tx, ty, { sneak: false });
                return { wallAt: [x, y], from: [sx, sy], target: [tx, ty], open, behind };
            }
        }
        return null; })()`) : null;
    t.check("ściana (budynek, skarpa, drzewo) zasłania: przed nią widzi, za nią nie", !!wall && wall.open === true && wall.behind === false, wall);
    // the meter: the hero in front of a person, sneaking - "?" then "!"
    if (p) {
        await sneak(true);
        await t.eval(`(() => { const ev = $gameMap.event(${p.id}); ev.locate(${p.x}, ${p.y}); ev._direction = 2; ev.moveStraight = () => {}; ev.moveDiagonally = () => {}; ev.setDirection = () => {}; ev.moveTowardCharacter = () => {}; window.__pin = 0;
            $gamePlayer.locate(${p.x}, ${p.y} + 2); $gameMap.setDisplayPos(${p.x} - 12, ${p.y} - 7); return 0; })()`);
        await t.frames(15);   // (the hero's place settles after a locate)
        await t.eval(`$gameMap.event(${p.id})._wid = { aware: 0, spotted: false }; 0`);
        await t.frames(6);
        const early = await t.json(`({ aware: Widzenie.aware($gameMap.event(${p.id})) })`);
        await t.frames(60);
        const late = await t.json(`(() => { const ev = $gameMap.event(${p.id}); return { aware: Widzenie.aware(ev), mark: !!(ev._markSprite && ev._markSprite.visible), spotted: Widzenie.spotted().some(e => e.eventId() === ${p.id}) }; })()`);
        t.check("pasek zauważenia rośnie stopniowo (nie od razu pełny), potem „!” i zauważony", early.aware > 0 && early.aware < 0.9 && late.aware >= 1 && late.mark && late.spotted, { early, late });
        const view = await t.json(`(() => { const w = SceneManager._scene._spriteset._widzenie; w._sig = ""; w.update(); return { visible: w.visible, shapes: w._g.geometry.graphicsData.length }; })()`);
        t.check("w skradaniu na ziemi są stożki wzroku ludzi obok", view.visible && view.shapes >= 2, view);
        if (SHOTS) { await t.eval(`$gamePlayer.locate(${p.x} + 3, ${p.y} + 2); 0`); await t.frames(30); await t.shot(SHOTS + "/widzenie_skradanie.png"); }
        // the cost: a full redraw of the cones (forced) and the meters, many times
        const cost = await t.json(`(() => { const w = SceneManager._scene._spriteset._widzenie, t0 = performance.now(); for (let i = 0; i < 100; i++) { w._sig = ""; w.update(); } const draw = (performance.now() - t0) / 100;
            const t1 = performance.now(); for (let i = 0; i < 100; i++) Widzenie.watchers().forEach(ev => Widzenie.seesHero(ev)); const rule = (performance.now() - t1) / 100;
            return { drawMs: +draw.toFixed(3), ruleMs: +rule.toFixed(3), people: Widzenie.watchers().length }; })()`);
        t.check("koszt: pełne przerysowanie stożków < 1,5 ms, sprawdzenie wszystkich ludzi < 0,5 ms", cost.drawMs < 1.5 && cost.ruleMs < 0.5, cost);
        await sneak(false);
        await t.frames(10);
        const off = await t.json(`(() => { clearInterval(window.__pin); const w = SceneManager._scene._spriteset._widzenie; return { visible: w.visible }; })()`);
        t.check("bez skradania stożków nie widać", off.visible === false, off);
    }
});
