// Wiatrak.js: nowy wiatrak Podgrodzia (wieża + płynnie obracające się skrzydła) i pole jęczmienia młynarza w trzech porach roku.
// node tests/wiatrak_test.js      Zrzuty: docs/NOWY_SWIAT/wiatrak/
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "NOWY_SWIAT", "wiatrak"); fs.mkdirSync(OUT, { recursive: true });
kit.test({ port: 9454, bootCheck: "boot", errorCheck: "bez błędów w konsoli" }, async t => {
    for (const [day, n] of [[12, "wiosna"], [40, "lato"], [58, "jesien"]]) {
        await t.newGame({ map: 218, x: 10, y: 36, day, hour: 11, quiet: true, minimap: false });
        await t.frames(200);
        await t.eval("$gamePlayer.center(7, 30); 0"); await t.frames(30);
        await t.shot(path.join(OUT, "wiatrak_" + n + ".png"));
    }
    const a1 = await t.json("SceneManager._scene._spriteset._characterSprites.find(s => s._sails)._sails.rotation");
    await t.frames(30);
    const a2 = await t.json("SceneManager._scene._spriteset._characterSprites.find(s => s._sails)._sails.rotation");
    t.check("skrzydła się obracają", Math.abs(a2 - a1) > 0.01, { a1, a2 });
    t.check("pole: etap jesienią", (await t.json("Wiatrak.stage()")) >= 3);
    // (2026-11-13: the field moved with the screen - Wydajnosc idled the field's settled event far off)
    await t.newGame({ map: 218, x: 20, y: 30, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(150);
    const off = "(() => { const s = SceneManager._scene._spriteset._characterSprites.find(s => s._poleGround); const p = s._poleGround; return [p.x - Math.round($gameMap.adjustX(9) * 48), p.y - Math.round($gameMap.adjustY(30) * 48)]; })()";
    let worst = 0;
    for (const dir of ["right", "right", "down", "left", "left", "up"]) { await t.hold(dir, 40); const d = await t.json(off); worst = Math.max(worst, Math.abs(d[0]) + Math.abs(d[1])); }
    t.check("pole stoi w miejscu, gdy ekran się przesuwa", worst === 0, worst);
    await t.shot(path.join(OUT, "pole_z_daleka.png"));
    // the grain: swaying segments with the people (z 3), the hero hidden by the rows in front, wind stronger in a storm
    await t.newGame({ map: 218, x: 15, y: 31, day: 58, hour: 11, quiet: true, minimap: false });
    await t.frames(120);
    await t.hold("left", 40);
    const SEG = "SceneManager._scene._spriteset._characterSprites.find(s => s._poleSegs)._poleSegs";
    t.check("zboże: kępy w rzędach z ludźmi (z 3)", await t.json(SEG + ".length > 40 && " + SEG + ".every(g => g.sp.z === 3)"));
    t.check("pierwszy rząd nie wchodzi na płot", await t.json("Math.min(..." + SEG + ".map(g => g.b)) >= 36"));
    t.check("rzędy przed bohaterem rysują się przed nim", await t.json("(() => { const hs = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); return " + SEG + ".some(g => g.sp.visible && g.sp.y > hs.y && g.sp.y < hs.y + 30 && Math.abs(g.sp.x - hs.x) < 30); })()"));
    const sway = async () => { let m = 0; for (let i = 0; i < 12; i++) { await t.frames(10); m = Math.max(m, await t.json("Math.max(..." + SEG + ".map(g => Math.abs(g.sp.skew.x)))")); } return m; };
    await t.eval("$gamePlayer.locate(13, 37); 0"); await t.frames(60);
    const calm = await sway();
    await t.eval("$gameScreen.changeWeather('storm', 9, 0); 0"); await t.frames(600);
    const storm = await sway();
    t.check("w burzy zboże faluje mocniej", storm > calm * 1.6, { calm, storm });
    await t.eval("$gameScreen.changeWeather('none', 0, 0); 0");
    t.check("skrzydła 1,25 raza dłuższe", Math.abs((await t.json("SceneManager._scene._spriteset._characterSprites.find(s => s._sails)._sails.scale.x")) - 1.25) < 0.001);
});
