// Ogrodki.js: villagers' vegetable gardens (living crops by the season, stealing, witnesses and trust). The real maps may have no gardens
// yet, so the test makes one in the running map 218 (Ogrodki._addForTest).
// node tests/ogrodki_test.js      Zrzut: docs/NOWY_SWIAT/ogrodki/
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "NOWY_SWIAT", "ogrodki"); fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: 9461, bootCheck: "boot", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 218, x: 10, y: 36, day: 5, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    // an open spot for 4 x 3 soil with a free row above and a free ring round it
    const spot = await t.json(`(function(){ const ok = (x, y) => $gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 2) && $gameMap.isPassable(x, y, 6) && $gameMap.isPassable(x, y, 4) && $gameMap.isPassable(x, y, 8);
        for (let y = 8; y < 70; y++) for (let x = 8; x < 70; x++) { let f = true; for (let j = -2; j < 4 && f; j++) for (let i = -2; i < 6; i++) if (!ok(x + i, y + j)) { f = false; break; } if (f) return [x, y]; } return null; })()`);
    t.check("jest wolne miejsce na ogródek", !!spot, spot);
    const [gx, gy] = spot;
    await t.eval(`Ogrodki._addForTest(${gx}, ${gy}, 4, 3, "testowy", "02"); 0`);
    await t.eval(`$gamePlayer.locate(${gx + 1}, ${gy - 1}); $gamePlayer.setDirection(2); $gamePlayer.center(${gx + 2}, ${gy + 1}); 0`);
    await t.frames(80);
    // (2026-11-13: the real map has the villagers' gardens now - the test's own one is found by its owner)
    t.check("ogródek jest na liście", await t.json(`Ogrodki.gardens().some(g => g.owner === "testowy" && g.x === ${gx} && g.y === ${gy})`));
    t.check("rzędy 0 i 2, różne warzywa", await t.json("(() => { const k = Ogrodki.gardens().find(g => g.owner === 'testowy').kinds; return k.length === 2 && k[0] !== k[1]; })()"));
    const stages = {};
    for (const [day, n] of [[5, "wiosna wczesna"], [40, "lato"], [58, "jesień"], [90, "zima"]]) {
        await t.setDay(day, 11); await t.frames(70);
        stages[day] = await t.json("Ogrodki.cells().filter(c => c.owner === 'testowy').map(c => c.stage)");
    }
    t.check("wiosna wczesna: etap 0", stages[5].every(s => s === 0), stages[5]);
    t.check("lato (pierwsza połowa): etap 2", stages[40].every(s => s === 2), stages[40]);
    t.check("jesień: dojrzałe (3)", stages[58].every(s => s === 3), stages[58]);
    t.check("zima: gołe, kapusta 2", await t.json("Ogrodki.cells().filter(c => c.owner === 'testowy').every(c => c.stage === (c.kind === 2 ? 2 : -1))"));
    // the picture
    await t.setDay(58, 11); await t.frames(80);
    const pic = `SceneManager._scene._spriteset._characterSprites.find(s => s._ogrSp && s._character.x === ${gx} && s._character.y === ${gy})._ogrSp`;
    t.check("obraz ogródka ma bitmapę", await t.json(`(() => { const p = ${pic}; return !!p && !!p.bitmap && p.bitmap.width === 192 && p.visible && p.z === 1; })()`));
    await t.setDay(50, 11); await t.frames(80);
    await t.eval(`$gamePlayer.center(${gx + 2}, ${gy + 1}); 0`); await t.frames(10);
    await t.shot(path.join(OUT, "ogrodek_lato.png"));
    // stealing
    await t.setDay(58, 11); await t.frames(70);
    await t.eval("window.__kit.pops.splice(0); 0");
    const bag = "($gameParty.numItems($dataItems[71]) + $gameParty.numItems($dataItems[72]) + $gameParty.numItems($dataItems[73]))";
    const b0 = await t.json(bag);
    await t.eval(`$gamePlayer.locate(${gx}, ${gy - 1}); $gamePlayer.setDirection(2); 0`); await t.frames(5);
    await t.press("ok");
    t.check("jedno naciśnięcie nie kradnie", (await t.json(bag)) === b0);
    t.check("popup ostrzega o cudzych warzywach", (await t.popups()).some(p => /cudze warzywa/.test(p)), await t.popups());
    await t.frames(200);
    await t.press("ok");
    t.check("po 3 s znów tylko ostrzeżenie", (await t.json(bag)) === b0);
    await t.frames(10);
    await t.press("ok");
    const b1 = await t.json(bag);
    t.check("dwa naciśnięcia kradną plon", b1 > b0, { b0, b1 });
    t.check("zerwana kratka jest goła", (await t.json(`Ogrodki.cells().find(c => c.x === ${gx} && c.y === ${gy}).stage`)) === -1);
    t.check("kradzież policzona, bez świadków bez spadku zaufania", (await t.json("Ogrodki.thefts('testowy')")) === 1 && (await t.json("Ogrodki.trust('testowy')")) === 0);
    await t.frames(70);
    t.check("obraz przeliczony po kradzieży", await t.json(`(() => { const g = Ogrodki.gardenOf(SceneManager._scene._spriteset._characterSprites.find(s => s._ogrSp && s._character.x === ${gx} && s._character.y === ${gy})._character); return g.last[0] === -1; })()`));
    await t.press("ok");
    t.check("pusta kratka: tu nic nie rośnie", (await t.popups()).some(p => /nic nie rośnie/.test(p)));
    await t.setDay(65, 11); await t.frames(70);
    t.check("po 7 dniach wciąż goła", (await t.json(`Ogrodki.cells().find(c => c.x === ${gx} && c.y === ${gy}).stage`)) === -1);
    await t.setDay(66, 11); await t.frames(70);
    t.check("po 8 dniach znów rośnie", (await t.json(`Ogrodki.cells().find(c => c.x === ${gx} && c.y === ${gy}).stage`)) >= 0);
    // not ripe
    await t.setDay(40, 11); await t.frames(70);
    await t.eval("window.__kit.pops.splice(0); 0");
    await t.press("ok");
    t.check("niedojrzałe: jeszcze nie urosło", (await t.popups()).some(p => /Jeszcze nie urosło/.test(p)), await t.popups());
    // a witness
    await t.setDay(58, 11); await t.frames(70);
    await t.eval(`Ogrodki._addEvent(${gx + 3}, ${gy - 2}, "Sąsiad", "", "$Npc_Zboze"); 0`); await t.frames(10);
    await t.eval("window.__kit.pops.splice(0); 0");
    await t.eval(`$gamePlayer.locate(${gx + 1}, ${gy - 1}); $gamePlayer.setDirection(2); 0`); await t.frames(5);
    await t.press("ok"); await t.frames(10); await t.press("ok");
    t.check("świadek: zaufanie -1", (await t.json("Ogrodki.trust('testowy')")) === -1 && (await t.json("Ogrodki.seen('testowy')")) === 1, await t.json("[Ogrodki.trust('testowy'), Ogrodki.seen('testowy'), Ogrodki.thefts('testowy')]"));
    t.check("popup „Ktoś to widział!”", (await t.popups()).some(p => /Ktoś to widział/.test(p)), await t.popups());
});
