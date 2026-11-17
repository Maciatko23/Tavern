// Orla Grań (Map030, 2026-11-16): najwyższe piętro gór z gniazdem białego orła - wejście tylko liną z Kruczej Grani.
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const hold = async (dir, n) => { await t.eval(`Input._currentState.${dir} = true; 0`); await t.frames(n); await t.eval(`Input._currentState.${dir} = false; 0`); await t.frames(50); };
    const at = () => J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
    t.check("nowa gra", await t.newGame({ map: 29, x: 66, y: 10, dir: 8, hour: 10, quiet: true, minimap: false }));
    await t.frames(40);
    const rope = await J("(function(){ const e = $gameMap.event(500); return e ? { x: e.x, y: e.y, img: e.characterName() } : null; })()");
    t.check("na północnej ścianie Kruczej Grani wisi lina wspinaczy (66,7)", !!rope && rope.x === 66 && rope.y === 7 && rope.img === "!$1_Drabina_Linowa", rope);
    await t.eval("$gamePlayer.locate(66, 8); $gamePlayer.setDirection(8); 0"); await t.frames(10);
    await t.popups({ clear: true });
    await t.press("ok"); await t.frames(60);
    const pop = await t.popups({ clear: true });
    t.check("bez powodu bohater się nie wspina (napis), zostaje na Kruczej Grani", (await at())[0] === 29 && pop.some(p => /wspina/.test(p)), { at: await at(), pop });
    await t.eval("Orzel.state().flags = Orzel.state().flags || {}; Orzel.state().flags.f9Egg = 1; 0");
    await t.press("ok"); await t.frames(120);
    const a1 = await at();
    t.check("gdy jest po co (jajo w gnieździe), lina wyprowadza na Orlą Grań (20,38), mapa 80x80", a1[0] === 30 && a1[1] === 20 && a1[2] === 38 && await J("$dataMap.displayName === 'Orla Grań' && $dataMap.width === 80 && $dataMap.height === 80"), a1);
    const nest = await J("(function(){ const e = $gameMap.event(510); return e ? { x: e.x, y: e.y, img: e.characterName(), dir: e.direction() } : null; })()");
    t.check("na grani jest gniazdo z jajem (20,19)", !!nest && nest.x === 20 && nest.y === 19 && nest.img === "!$Orzel_Gniazdo" && nest.dir === 2, nest);
    if (process.env.SHOT) { await t.shot(process.env.SHOT + "_1.png"); await t.eval("$gamePlayer.locate(20, 23); 0"); await t.frames(60); await t.shot(process.env.SHOT + "_2.png"); await t.eval("$gamePlayer.locate(20, 38); 0"); await t.frames(20); }
    await hold("down", 110);
    const a2 = await at();
    t.check("skalnym kominem schodzi się z powrotem pod linę na Kruczej Grani", a2[0] === 29 && Math.abs(a2[1] - 66) <= 1 && a2[2] >= 8 && a2[2] <= 10, a2);
    if (process.env.SHOT) { await t.shot(process.env.SHOT + "_3.png"); }
});
