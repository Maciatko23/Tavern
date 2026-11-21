// Ukryte pułapki w podziemiach (js/plugins/Pulapki.js, 2026-11-19): rozłożenie (z ziarna, z dala od schodów), dostrzeganie tylko
// w skradaniu, rozbrajanie (przytrzymaj O - części metalowe i doświadczenie), wejście na pułapkę, nieudane rozbrajanie, zapis.
//   CDP_PORT=9476 node tests/pulapki_test.js        (ZRZUTY=folder: zrzut trzech rodzajów na ziemi)
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9476, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 120000 }, async t => {
    const SHOTS = process.env.ZRZUTY ? require("path").resolve(process.env.ZRZUTY) : "";
    t.check("wtyczka wczytana", await t.json("!!window.Pulapki && !!window.Zamki"));
    await t.newGame({ map: 218, x: 30, y: 18, day: 12, hour: 11, quiet: true, minimap: false });
    await t.eval(`if (window.ZamkiGra) ZamkiGra.enabled(false); 0`);   // (the rules by the ring here; the mini-games: tests/zamki_gra_test.js)
    let lay = null;
    for (const f of [5, 6, 7, 8, 4, 3]) {
        await t.eval(`Underground.go(${f}); 0`);
        await t.until(`Underground.floorOf($gameMap.mapId()) === ${f} && !$gamePlayer.isTransferring()`, 30);
        await t.frames(20);
        lay = await t.json(`({ floor: ${f}, map: $gameMap.mapId(), list: Pulapki.list() })`);
        if (lay.list.length >= 2) break;
    }
    await t.calm();
    await t.eval(`(() => { if (window.Creatures && Creatures.clearAll) Creatures.clearAll(); for (const k in Pulapki.KINDS) Pulapki.KINDS[k].fail = 0; return 0; })()`);
    const L = lay.list;
    const apart = L.every((a, i) => L.every((b, j) => i === j || Math.abs(a.x - b.x) + Math.abs(a.y - b.y) >= 6));
    t.check("piętro " + lay.floor + ": ukryte pułapki rozłożone (" + L.map(x => x.kind).join(", ") + "), z dala od siebie, wszystkie niewidoczne", L.length >= 2 && apart && L.every(x => x.state === "hidden"), L);
    const again = await t.json(`(() => { Pulapki.build(); return Pulapki.list().map(x => x.kind + "@" + x.x + "," + x.y); })()`);
    t.check("to samo piętro tej samej gry - te same pułapki w tych samych miejscach", JSON.stringify(again) === JSON.stringify(L.map(x => x.kind + "@" + x.x + "," + x.y)), again);
    const a = L[0], b = L[1];
    // free tiles round a trap: 3 tiles off (outside the look), then 2, then right by it facing it
    const nearJs = `const spot = (tx, ty, d) => { for (const [dx, dy, dir] of [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]]) { const x = tx + dx * d, y = ty + dy * d;
        if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !Pulapki.list().some(q => q.x === x && q.y === y)) return [x, y, dir]; } return null; };`;
    const goNear = async (tr, d) => t.json(`(() => { ${nearJs} const s = spot(${tr.x}, ${tr.y}, ${d}); if (s) { $gamePlayer.locate(s[0], s[1]); $gamePlayer.setDirection(s[2]); } return s; })()`);
    // 1. walking (not sneaking) past: not noticed
    await t.eval(`Pulapki.SEE.chance = 1; Pulapki.SEE.max = 1; Tawerna.state("hunt").sneak = false; 0`);
    await goNear(a, 4); await t.frames(5);
    await goNear(a, 2); await t.frames(5);
    let st = await t.json(`Pulapki.list()[0].state`);
    t.check("idąc normalnie pułapki się nie dostrzega", st === "hidden", st);
    // 2. sneaking, coming near: noticed (the chance forced to 1 for the test), the popup, shown on the floor
    await t.eval(`Tawerna.state("hunt").sneak = true; 0`);
    await t.popups({ clear: true });
    await goNear(a, 4); await t.frames(5);
    await goNear(a, 2); await t.frames(5);
    st = await t.json(`Pulapki.list()[0].state`);
    let pops = await t.popups({ clear: true });
    const drawn = await t.json(`(() => { const L = SceneManager._scene._spriteset._pulapki; const s = L._sp[0]; return { visible: !!(s && s.visible), n: Object.keys(L._sp).length }; })()`);
    t.check("w skradaniu podchodząc - dostrzeżona: „Pułapka!”, widać ją na ziemi", st === "found" && pops.some(p => /Pułapka!/.test(p)) && drawn.visible, { st, pops, drawn });
    const chance = await t.json(`(() => { Pulapki.SEE.chance = 0.4; Pulapki.SEE.max = 0.9; const h = Combat.hero(), was = h.attr.per; const lo = Pulapki.seeChance(false);
        h.attr.per = 15; const hi = Pulapki.seeChance(false), hiNear = Pulapki.seeChance(true); h.attr.per = was; return { lo, hiAfter: hi, hiNear }; })()`);
    t.check("szansa dostrzeżenia: zwykle 40%, z Percepcją 15 więcej, z bliska jeszcze więcej - ale nie pewne", chance.lo === 0.4 && chance.hiAfter > chance.lo && chance.hiNear > chance.hiAfter && chance.hiNear <= 0.9, chance);
    // 3. disarming: right by it facing it, hold O - the parts and the experience
    const before = await t.json(`({ xp: Combat.hero().xp, lv: Combat.hero().level, items: [88, 86, 514, 143, 93].map(id => $gameParty.numItems($dataItems[id])) })`);
    await goNear(a, 1); await t.frames(3);
    await t.key("O", 4);
    const mid = await t.json(`Zamki.picking()`);
    await t.key("O", 300);
    await t.frames(10);
    const after = await t.json(`({ state: Pulapki.list()[0].state, xp: Combat.hero().xp, lv: Combat.hero().level, items: [88, 86, 514, 143, 93].map(id => $gameParty.numItems($dataItems[id])) })`);
    pops = await t.popups({ clear: true, gains: true });
    const gotParts = after.items.some((n, i) => n > before.items[i]);
    t.check("rozbrojona: przytrzymanie O (kółko), części metalowe w torbie, doświadczenie", mid && mid.owner === "task" && after.state === "disarmed" && gotParts && (after.xp > before.xp || after.lv > before.lv) && pops.some(p => /Rozbrojone/.test(p)),
        { mid, before, after, pops });
    // 4. stepping on one not seen: it goes off (the hero hurt / the bells), it stays sprung
    await t.eval(`Tawerna.state("hunt").sneak = false; 0`);
    const hp0 = await t.json(`$gameParty.leader().hp`);
    await t.eval(`$gamePlayer.locate(${b.x}, ${b.y}); 0`);
    await t.frames(20);
    const sprung = await t.json(`({ state: Pulapki.list()[1].state, hp: $gameParty.leader().hp, hold: Pulapki.holding() })`);
    t.check("wejście na nieznaną pułapkę: poszła (" + b.kind + ")", sprung.state === "sprung" && (b.kind === "linka" || sprung.hp < hp0), { b, hp0, sprung });
    // 5. a failed disarming: it goes off on him (the failure chance forced to 1)
    const c = L[2];
    if (c) {
        await t.eval(`(() => { Pulapki.notice(Pulapki.here().list[2]); for (const k in Pulapki.KINDS) Pulapki.KINDS[k].fail = 1; Tawerna.state("hunt").sneak = true; return 0; })()`);
        await t.frames(100);   // (the jaws let go)
        await goNear(c, 1); await t.frames(3);
        await t.popups({ clear: true });
        await t.key("O", 4);
        await t.key("O", 90);
        const f = await t.json(`({ state: Pulapki.list()[2].state, picking: Zamki.picking() })`);
        t.check("nieudane rozbrajanie: pułapka idzie na niego, koniec dłubania", f.state === "sprung" && !f.picking, f);
    }
    // 6. saved: back on the floor the disarmed stays disarmed, the sprung sprung
    const kept = await t.json(`(() => { Pulapki.build(); return Pulapki.list().slice(0, 2).map(x => x.state); })()`);
    t.check("po powrocie na piętro: rozbrojona i uruchomiona zostają takie", kept[0] === "disarmed" && kept[1] === "sprung", kept);
    // the three kinds noticed, side by side for a look (the list moved for the picture only)
    if (SHOTS) {
        await t.eval(`(() => { ${nearJs} Tawerna.state("hunt").sneak = true; const h = Pulapki.here(), x = $gamePlayer.x, y = $gamePlayer.y; const free = (a, b) => $gameMap.checkPassage(a, b, 0x0f);
            const cells = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -4; dx <= 4; dx++) if ((dx || dy) && free(x + dx, y + dy) && Math.abs(dx) + Math.abs(dy) >= 2) cells.push([x + dx, y + dy]);
            const kinds = ["kolce", "wnyk", "linka", "kolce", "wnyk"]; const st = Pulapki.state().floors[h.key];
            h.list = kinds.map((k, i) => ({ i: 100 + i, kind: k, x: cells[i * 3][0], y: cells[i * 3][1], dir: "H" })); st.found.push(100, 101, 102); st.done[103] = "sprung"; st.done[104] = "sprung";
            $gameMap.setDisplayPos(x - 13, y - 7); return cells.length; })()`);
        await t.frames(20);
        await t.shot(SHOTS + "/pulapki.png");
    }
});
