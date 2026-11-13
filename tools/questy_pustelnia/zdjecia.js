// Zdjecia Z GRY przed i po (questy pustelni): MODE=before (bez nakladki) | after (nakladka staging); OUT=docs/questy_pustelnia/<mode>/<id>.png
//   MODE=after CDP_PORT=9872 node tools/questy_pustelnia/zdjecia.js
const kit = require("../../tests/lib/kit.js");
const path = require("path"), fs = require("fs");
const MODE = process.env.MODE || "after";
const OUT = path.resolve(__dirname, "..", "..", "docs", "questy_pustelnia", MODE);
fs.mkdirSync(OUT, { recursive: true });
const OVERLAY = MODE === "after" ? path.join(__dirname, "staging") : undefined;
const A = MODE === "after";
// id, map, hero x, y, dir, hour, setup (page code run after the transfer), cam (where the hero is looking from: the shot is centred on the hero)
const SHOTS = [
    ["01_kaplica_pulpit", 178, 11, 8, 8, 9, `(function(){ const e = $gameMap.events().find(e => /czytanie/.test(e.event().note || '')); if (e) { e.setTransparent(false); e.setOpacity(255); } return 0; })()`],
    ["02_kruczarnia_zerdz", 8, 111, 11, 8, 11, ""],
    ["03_kruk_przystan_droga", 125, 100, 76, 8, 11, `TownQuests.start('K51', 1, true); Kruk.state().k51.leg = 1; 0`],
    ["04_kruk_kruczy_jar", 3, 39, 14, 8, 11, `TownQuests.start('K51', 1, true); Kruk.state().k51.leg = 2; 0`],
    ["05_kruk_brama_miasta", 8, 31, 114, 8, 11, `TownQuests.start('K51', 1, true); Kruk.state().k51.leg = 3; 0`],
    ["06_rynna_1", 8, 114, 43, 6, 11, ""],
    ["07_rynna_2", 8, 114, 66, 6, 11, ""],
    ["08_rynna_3", 8, 5, 56, 4, 11, ""],
    ["09_rynna_4", 8, 5, 94, 4, 11, ""],
    ["10_widok_dzwonnica", 108, 5, 7, 8, 11, `Podroznicy.przyplyn("kartograf"); TownQuests.start("D40"); 0`],
    ["11_widok_kruczarnia", 8, 106, 13, 8, 11, `Podroznicy.przyplyn("kartograf"); TownQuests.start("D40"); 0`],
    ["12_kopiec_orla_gran", 175, 36, 39, 8, 11, ""],
    ["13_fundament_garnizon", 162, 86, 52, 8, 11, ""]
];
kit.test({ port: +(process.env.CDP_PORT || 9872), overlay: OVERLAY, overlayJs: A, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 120000 }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("if (window.Creatures && Creatures.auto) Creatures.auto(false); 0");
    await t.eval("(function(){ const s = Story.state(); s.paid = s.debt; s.done = Tawerna.time.day(); return 0; })()");
    await t.eval("(function(){ TownQuests.state().flags.rochMet = 2; return 0; })()");
    for (const [id, map, x, y, dir, hour, setup] of SHOTS) {
        if (process.env.ONLY && !process.env.ONLY.split(",").includes(id)) continue;
        await t.setDay(20, hour);
        await t.go(map, x, y, dir);
        await t.eval("window.CleanHUD && CleanHUD.visits && (CleanHUD.visits().odw[$gameMap.mapId()] = 3); $gameScreen.changeWeather('none', 0, 0); 0");
        if (setup) { try { await t.eval(setup); } catch (e) { console.log("setup " + id + ": " + e.message); } }
        await t.frames(120);
        await t.finish(60);
        await t.frames(120);
        await t.popups({ clear: true }); await t.notices({ clear: true });
        await t.frames(100);
        await t.shot(path.join(OUT, id + ".png"));
        console.log("  zdjecie " + id);
    }
    t.check("zdjecia (" + MODE + ")", true);
});
