// Zrzuty z gry 1:1 dla poprawki krawędzi (liście -> trawa, zapory): punkty z tools/krawedzie_poprawa/staging/punkty.json.
// FAZA=przed|po; po: GAME_OVERLAY=tools/krawedzie_poprawa/staging GAME_OVERLAY_JS=1 CDP_PORT=9407 FAZA=po node tests/krawedzie_zrzuty.js
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const FAZA = process.env.FAZA || "po";
const OUT = path.join(__dirname, "..", "docs", "krawedzie_poprawa", "gra", FAZA); fs.mkdirSync(OUT, { recursive: true });
const P = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "tools", "krawedzie_poprawa", "staging", "punkty.json"), "utf8"));
kit.test({ port: Number(process.env.CDP_PORT) || 9407, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    for (const mid of Object.keys(P)) {
        let k = 0;
        for (const [x, y] of P[mid]) {
            const plik = path.join(OUT, `Map${String(mid).padStart(3, "0")}_${k}.png`);
            if (process.env.POMIN_ISTNIEJACE && fs.existsSync(plik)) { k++; continue; }
            await t.newGame({ map: Number(mid), x, y, day: 12, hour: 11, quiet: true, minimap: false });
            await t.frames(30);
            await t.shot(plik); k++;
        }
    }
    t.check("zrzuty zrobione", true);
});
