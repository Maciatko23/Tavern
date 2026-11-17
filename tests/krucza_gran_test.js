// Krucza Grań (Map029, 2026-11-16): górne piętro Kruczych Turni z kruczarnią - wejście przez sztolnię, skrót drabinką linową.
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const hold = async (dir, n) => { await t.eval(`Input._currentState.${dir} = true; 0`); await t.frames(n); await t.eval(`Input._currentState.${dir} = false; 0`); await t.frames(50); };
    const at = () => J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
    const ev = name => `$gameMap.events().find(e => e.event().name === ${JSON.stringify(name)})`;
    t.check("nowa gra", await t.newGame({ map: 222, x: 44, y: 12, dir: 8, hour: 10, quiet: true, minimap: false }));
    const b0 = await J(`(function(){ const e = ${ev("Drabinka linowa -> Krucza Grań")}; return e ? { x: e.x, y: e.y, img: e.characterName() } : null; })()`);
    t.check("pod skałą przy kopalni drabinki jeszcze nie widać (nikt jej nie spuścił)", !!b0 && b0.x === 44 && b0.y === 9 && b0.img === "", b0);
    await hold("up", 90);
    t.check("...i nie da się tamtędy wejść", (await at())[0] === 222, await at());
    await t.go(225, 13, 7, 8); await t.frames(30);
    await hold("up", 80);
    const a1 = await at();
    t.check("drabiną w szybie północno-zachodniej komory sztolni wychodzi się na Kruczą Grań (przed wylot, 40,11)", a1[0] === 29 && a1[1] === 40 && a1[2] >= 10 && a1[2] <= 12 && await J("$dataMap.displayName === 'Krucza Grań' && $dataMap.width === 80 && $dataMap.height === 80"), a1);
    if (process.env.SHOT) { await t.eval("$gamePlayer.locate(30, 20); 0"); await t.frames(60); await t.shot(process.env.SHOT + "_1.png"); await t.eval("$gamePlayer.locate(18, 23); 0"); await t.frames(60); await t.shot(process.env.SHOT + "_2.png"); }
    await t.eval("$gamePlayer.locate(40, 12); $gamePlayer.setDirection(8); 0"); await t.frames(10);
    await hold("up", 90);
    t.check("wylotem sztolni wraca się do komory (13,6)", JSON.stringify((await at()).slice(0, 2)) === "[225,13]", await at());
    await t.go(29, 15, 22, 8); await t.frames(30);
    await t.popups({ clear: true });
    await hold("up", 90);
    const zamk = await at(), pop = await t.popups({ clear: true });
    t.check("drzwi kruczarni są zamknięte, dopóki nie ruszy Kruczy listonosz (napis, bohater zostaje na grani)", zamk[0] === 29 && pop.length > 0, { zamk, pop });
    // (the thread on its first chapter, as tests/poczta_test.js prepares it)
    await t.eval("TownQuests.state().flags.krukTame = 12; Tawerna.state('clock').day = 13; 0"); await t.frames(130);
    await t.eval("Poczta.stan().start = 13; Poczta.stan().oath = 'przysiegam'; PocztaData.watek.skocz(1); 0"); await t.frames(30);
    await t.eval("$gamePlayer.locate(15, 22); $gamePlayer.setDirection(8); 0"); await t.frames(10);
    await hold("up", 90);
    const a2 = await at();
    t.check("...a w wątku drzwi kruczarni prowadzą do jej wnętrza (Map214)", a2[0] === 214, a2);
    await hold("down", 120);
    const a3 = await at();
    t.check("...a wyjście z wnętrza z powrotem pod drzwi na grani", a3[0] === 29 && a3[1] === 15 && a3[2] >= 21 && a3[2] <= 23, a3);
    await t.go(29, 46, 74, 2); await t.frames(30);
    if (process.env.SHOT) { await t.shot(process.env.SHOT + "_3.png"); }
    await hold("down", 110);
    const a4 = await at();
    t.check("drabinką linową na krawędzi schodzi się pod skałę przy kopalni (Map222 44,10)", a4[0] === 222 && a4[1] === 44 && a4[2] >= 10 && a4[2] <= 12, a4);
    const b1 = await J(`(function(){ const e = ${ev("Drabinka linowa -> Krucza Grań")}; return e ? e.characterName() : null; })()`);
    t.check("...i od tej chwili drabinka wisi na skale", b1 === "!$1_Drabina_Linowa", b1);
    if (process.env.SHOT) { await t.shot(process.env.SHOT + "_4.png"); }
    await t.eval("$gamePlayer.locate(44, 10); $gamePlayer.setDirection(8); 0"); await t.frames(10);
    await hold("up", 70);
    const a5 = await at();
    t.check("...i można nią wejść na grań (46,75)", a5[0] === 29 && a5[1] === 46 && a5[2] >= 74 && a5[2] <= 75, a5);
});
