// Zrzuty próby „ładniejszej mapy” (Ziemia.js) na Kruczym Jarze: docs/ladniejsze/<przed|po>_<widok>_<pora>.png
// PREFIX=przed -> wszystkie przełączniki wyłączone (window.ZIEMIA = { off: true }), PREFIX=po -> włączone.
// Uruchom: PREFIX=przed CDP_PORT=9900 node tools/ladniejsze/shots.js   (ONLY=dzialka,skraj: tylko te widoki)
// Widoki: mapa 3, lewy górny róg widoku (kratki), kratka bohatera. Pory: popołudnie 15:36 i wieczór 19:30 (dzień 10).
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ladniejsze");
const PRE = process.env.PREFIX || "po";
const ONLY = process.env.ONLY;
const VIEWS = JSON.parse(process.env.VIEWS || "null") || [["dzialka", 8, 13, 16, 20], ["chata", 21, 12, 26, 22], ["sciezka", 47, 8, 50, 14], ["skraj", 2, 6, 12, 14]];
const TIMES = [["popoludnie", 15.6], ["wieczor", 19.4]];
kit.test({ port: Number(process.env.CDP_PORT) || 9900, beforeLoad: PRE === "przed" ? "window.ZIEMIA = { off: true };" : "window.ZIEMIA = window.ZIEMIA || {};", width: 1280, height: 720, bootCheck: "gra sie uruchamia", errorCheck: "bez bledow w konsoli" }, async t => {
    const settle = async n => { await t.frames(n || 40); await t.until("!SceneManager._scene.isFading()", 5, 100); };
    await t.newGame({ minimap: false, quiet: true, deadline: false });
    await t.eval("(function(){ const f = Tawerna.mapFlag; Tawerna.mapFlag = (k, d) => k === 'Clouds' ? false : f(k, d); return 0; })()");   // (no cloud shadows in the pictures)
    for (const [nm, vx, vy, hx, hy] of VIEWS) {
        if (ONLY && ONLY.split(",").indexOf(nm) < 0) continue;
        await t.go(3, hx, hy, 8);
        await settle(120);
        await t.eval("(function(){ if (window.CloudShadows && CloudShadows.setEnabled) CloudShadows.setEnabled(false); return 0; })()");
        for (const [tn, hour] of TIMES) {
            await t.setDay(10, hour);
            await t.eval(`(function(){ $gameMap.setDisplayPos(${vx}, ${vy}); return 0; })()`);
            await t.frames(60);
            await t.eval(`(function(){ $gameMap.setDisplayPos(${vx}, ${vy}); if (window.Mood && Mood.snap) Mood.snap(); return 0; })()`);
            await t.frames(30);
            await t.eval(`(function(){ $gameMap.setDisplayPos(${vx}, ${vy}); return 0; })()`);
            await t.frames(10);
            await t.shot(path.join(OUT, `${PRE}_${nm}_${tn}.png`));
            console.log("zrzut " + PRE + " " + nm + " " + tn + " " + JSON.stringify(await t.json("window.Ziemia ? Ziemia.stats() : null")));
        }
    }
    await t.finish();
});
