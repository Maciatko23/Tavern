// Biały orzeł - sonda: jeździec na grzbiecie i klawisz Q w locie.
//   CDP_PORT=9542 GAME_PLUGINS_ADD="Kruk_Data:Orzel_Data;Starcia:Orzel;Orzel:Orzel_Lot" node tools/orzel/probe_rider.js [outDir]
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = process.argv[2] || path.join(__dirname, "zrzuty");

kit.test({ port: 9542 }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    await t.newGame({ map: 3, x: 20, y: 18, day: 70, hour: 11.5, quiet: true, minimap: false });
    await t.eval(`(function(){ Orzel.forceStage(5); const s = Orzel.state(); s.bond = 80; s.name = "Śnieżny"; return 0; })()`);
    await t.frames(30);
    await t.eval(`OrzelLot.mount(); 0`);
    await t.frames(70);
    const r = await t.json(`(function(){ const e = Orzel.eagle, r = e && e.rider; if (!r) return { none: true, air: !!(e && e.air) };
        const wt = r.worldTransform, b = r.getBounds();
        return { vis: r.visible, alpha: r.worldAlpha, par: r.parent === e.air, frame: [r._frame.x, r._frame.y, r._frame.width, r._frame.height], ready: r.bitmap && r.bitmap.isReady(),
            w: r.width, h: r.height, bounds: [b.x, b.y, b.width, b.height], airVis: e.air.visible, airBounds: (function(){ const a = e.air.getBounds(); return [a.x, a.y, a.width, a.height]; })(),
            kids: e.air.children.length, tex: r.texture && [r.texture.frame.x, r.texture.frame.y, r.texture.frame.width, r.texture.frame.height] }; })()`);
    console.log("RIDER", JSON.stringify(r));
    await t.shot(path.join(OUT, "rider.png"));
    // Q
    const before = await t.json(`({ ph: OrzelLot.lot.phase, lvl: OrzelLot.lot.level })`);
    await t.eval(`(function(){ window.__q = []; const o = Input.isTriggered; return 0; })()`);
    await t.press("pageup", 4);
    await t.frames(10);
    const after = await t.json(`({ ph: OrzelLot.lot.phase, lvl: OrzelLot.lot.level, calm: Tawerna.isCalm(SceneManager._scene, { only: ["onMap", "event", "farmMenu"] }), why: Tawerna.whyNotCalm(SceneManager._scene, { only: ["onMap", "event", "farmMenu"] }) })`);
    console.log("Q", JSON.stringify(before), JSON.stringify(after));
}).catch(e => { console.log("ERR", e); process.exit(1); });
