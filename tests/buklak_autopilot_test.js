// Autopilot i bukłak (2026-11-17, gracz: „to musi bukłak napełniony nosić”): przed zejściem do podziemi autopilot fabuły napełnia
// bukłak przy studni w Kruczogrodzie (jedno nabranie z przydziału = pełny bukłak, 4 łyki po 35), a na dole pije z niego klawiszem G;
// woda w bukłaku liczy się do wody na drogę powrotną (fab.js: waterBack, skinWater).
// Uruchom: node tests/run.js buklak_autopilot --port 9478
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 220, x: 33, y: 36, dir: 2, hour: 9, quiet: true, minimap: false });
    await t.eval("if (window.Needs && Needs.setEnabled) Needs.setEnabled(true); $gameParty.gainItem($dataItems[129], 1); Needs.state().skin = 0; Needs.state().water = 90; $gameSystem.setStamina(100); 0");
    await t.eval("window.FAB_GRAPH = null; 0");
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    const v = await t.eval(fs.readFileSync(path.join(__dirname, "autopilot_fabula", "fab.js"), "utf8"));
    t.check("autopilot fabuły w stronie (" + v + "); bukłak w plecaku, pusty", /^ok|same/.test(String(v)) && (await J("Needs.skinCharges()")) === 0);
    await t.eval("AP.run([['fab_skin', 'fill']]); 0");
    const filled = await t.until("!AP.cur && !AP.queue.length", 90);
    const f = await J("({ sips: Needs.skinCharges(), max: Needs.SKIN.max, log: AP.log.slice(-4) })");
    t.check("przy studni miejskiej: „Napełnij bukłak” - pełny (" + f.sips + "/" + f.max + ")", filled && f.sips === f.max, f);
    // thirsty down there: a sip with G
    await t.eval("Needs.state().water = 40; 0");
    await t.eval("AP.run([['fab_skin', 'sip']]); 0");
    await t.until("!AP.cur && !AP.queue.length", 30);
    const d = await J("({ sips: Needs.skinCharges(), water: Math.round(Needs.state().water), log: AP.log.slice(-2) })");
    t.check("spragniony (woda 40): łyk z bukłaka klawiszem G - woda ~75, łyków o jeden mniej", d.sips === f.max - 1 && d.water >= 70, d);
});
