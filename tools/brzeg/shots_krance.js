// Zrzuty morza na krańcach wyspy i wyrównanych przejść (2026-10-30): docs/brzegi/po_<mapa>_<widok>_<czerwona|szara>.png
// Widoki: tools/brzeg/_widoki.json (mapa, x widoku, y widoku, x bohatera, y bohatera, nazwa). Uruchom: CDP_PORT=9840 node tools/brzeg/shots_krance.js
const path = require("path"), fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "brzegi");
const VIEWS = JSON.parse(fs.readFileSync(path.join(__dirname, "_widoki.json"), "utf8"));
const ONLY = process.env.ONLY;   // e.g. ONLY=159,120
kit.test({ port: 9840, width: 1280, height: 720, bootCheck: "gra sie uruchamia", errorCheck: "bez bledow w konsoli" }, async t => {
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("(function(){ const f = Tawerna.mapFlag; Tawerna.mapFlag = (k, d) => k === 'Clouds' ? false : f(k, d); return 0; })()");
    for (const [m, vx, vy, hx, hy, nm] of VIEWS) {
        if (ONLY && ONLY.split(",").indexOf(String(m)) < 0) continue;
        await t.go(m, hx, hy, 8);
        await settle(240);
        await t.eval("(function(){ if (window.CloudShadows && CloudShadows.setEnabled) CloudShadows.setEnabled(false); return 0; })()");
        await t.setDay(10, 15.6);
        await t.eval("TownLife.placeAll(); 0");
        await t.locate(hx, hy, 8);
        await settle(260);
        for (const kind of ["red", "grey"]) {
            await t.eval(`CzerwonaWoda.force("${kind}"); 0`);
            await t.eval(`(function(){ $gameMap.setDisplayPos(${vx}, ${vy}); return 0; })()`);
            await t.frames(30);
            await t.eval(`(function(){ $gameMap.setDisplayPos(${vx}, ${vy}); return 0; })()`);
            await t.frames(8);
            await t.shot(path.join(OUT, `po_${m}_${nm}_${kind === "red" ? "czerwona" : "szara"}.png`));
            console.log("zrzut " + m + " " + nm + " " + kind);
        }
    }
    await t.finish();
});
