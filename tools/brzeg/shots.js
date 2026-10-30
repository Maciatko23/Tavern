// Zrzuty brzegu morza (2026-10-29): docs/brzeg/<przed|po>_<mapa>_<czerwona|szara>.png
// Uruchom: PREFIX=przed CDP_PORT=9821 node tools/brzeg/shots.js
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "brzeg");
const PRE = process.env.PREFIX || "po";
const ONLY = process.env.ONLY;   // e.g. ONLY=Map155,wieza: only these views
const VIEWS = [[159, 22, 3, 28, 12, "wsch"], [159, 52, 16, 62, 20, "poludnie"], [159, 8, 8, 14, 16, "wieza"], [125, 0, 24, 10, 28, "przystan"], [155, 4, 0, 14, 6, "Map155"], [157, 64, 0, 74, 6, "Map157"], [162, 0, 6, 10, 12, "Map162"], [165, 30, 14, 40, 20, "Map165"]];   // map, view x, view y, hero x, hero y
const R = process.env.R ? Number(process.env.R) : 0, ONE = process.env.ONE;   // ONE=wariant_A: only Map159 east, red, to docs/brzeg/<ONE>.png
kit.test({ port: 9821, beforeLoad: R ? `window.BRZEG_R = ${R};` : undefined, width: 1280, height: 720, bootCheck: "gra sie uruchamia", errorCheck: "bez bledow w konsoli" }, async t => {
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("(function(){ const f = Tawerna.mapFlag; Tawerna.mapFlag = (k, d) => k === 'Clouds' ? false : f(k, d); return 0; })()");   // (no cloud shadows in the pictures)
    for (const [m, vx, vy, hx, hy, nm] of VIEWS) {
        if (ONE && !(m === 159 && nm === "wsch")) continue;
        if (ONLY && ONLY.split(",").indexOf(nm) < 0) continue;
        await t.go(m, hx, hy, 8);
        await settle(240);
        await t.eval("(function(){ if (window.CloudShadows && CloudShadows.setEnabled) CloudShadows.setEnabled(false); return 0; })()");
        await t.setDay(10, 15.6);
        await t.eval("TownLife.placeAll(); 0");
        await t.locate(hx, hy, 8);
        await settle(260);
        for (const kind of ONE ? ["red"] : ["red", "grey"]) {
            await t.eval(`CzerwonaWoda.force("${kind}"); 0`);
            await t.eval(`(function(){ $gameMap.setDisplayPos(${vx}, ${vy}); return 0; })()`);
            await t.frames(30);
            await t.eval(`(function(){ $gameMap.setDisplayPos(${vx}, ${vy}); return 0; })()`);
            await t.frames(8);
            await t.shot(path.join(OUT, ONE ? ONE + ".png" : `${PRE}_${m}_${nm}_${kind === "red" ? "czerwona" : "szara"}.png`));
            console.log("zrzut " + m + " " + kind);
        }
    }
    await t.finish();
});
