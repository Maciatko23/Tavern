// Autopilot i własna chatka (2026-11-17, gracz: „zawsze może zbudować swój domek i tam łóżko”): na działce dziadka (Map218) stoi jego
// chatka (Farming „hut”, wnętrze Map100) - autopilot (tests/autopilot/ap.js) wchodzi drzwiami, stawia w środku łóżko z plecaka
// (deski, gwoździe, wełna, młotek), wychodzi wycieraczką, a nocą śpi we własnym łóżku (cała noc, pełne siły) i rano wychodzi.
// Uruchom: node tests/run.js chatka_autopilot --port 9476
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 218, x: 30, y: 20, dir: 8, hour: 9, quiet: true, minimap: false });
    await t.eval("if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); 0");
    // his hut on the plot: put down at once (the F9 way), a free spot near the middle
    const hut = await J(`(function(){ for (let r = 0; r < 8; r++) for (let y = 13 - r; y <= 13 + r; y++) for (let x = 26 - r; x <= 26 + r; x++) {
            if (!Farming.whyNotBuild("hut", x, y, false, true) && Farming.placeFree("hut", x, y)) { const h = Farming.hutOf(); return { x, y, door: { x: h.b.x + ((Farming.geoOf(h.b).door || {}).dx || 0), y: h.b.y }, site: !!h.b.site }; } }
        return null; })()`);
    t.check("chatka stoi na działce (od ręki, jak F9)", !!hut && !hut.site, hut);
    // the bed's makings in the bag + the hammer
    await t.eval("[[80, 6], [88, 4], [111, 3], [89, 1]].forEach(([id, n]) => $gameParty.gainItem($dataItems[id], n)); $gameSystem.setStamina(100); 0");
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    await t.eval("AP.run([['furnish', 'bed']]); 0");
    const furnished = await t.until("!AP.cur && !AP.queue.length && $gameMap.mapId() === 218 && (((Farming.farm().buildings || {})[Farming.HUT_MAP]) || []).some(b => b.type === 'bed' && !b.site)", 120);
    const s1 = await J("({ map: $gameMap.mapId(), beds: (((Farming.farm().buildings || {})[Farming.HUT_MAP]) || []).map(b => b.type + (b.site ? '(plac)' : '') + '@' + b.x + ',' + b.y), log: AP.log.slice(-8) })");
    t.check("autopilot wszedł do chatki, postawił łóżko i wyszedł na działkę", furnished, s1);

    // the night: his own bed
    await t.setHour(22);
    await t.eval("$gameSystem.setStamina(30); 0");
    const d0 = await J("$gameSystem.dayNightDay()");
    await t.eval("AP.run([['sleep']]); 0");
    const slept = await t.until(`!AP.cur && !AP.queue.length && $gameSystem.dayNightDay() > ${d0}`, 120);
    const s2 = await J("({ map: $gameMap.mapId(), day: $gameSystem.dayNightDay(), h: +$gameSystem.dayNightHour().toFixed(2), st: Math.round($gameSystem.stamina()), log: AP.log.slice(-6) })");
    t.check("nocą śpi we własnym łóżku do rana: pełne siły, rano wychodzi z chatki", slept && s2.st >= 95 && s2.map === 218 && s2.log.some(l => /własnym łóżku/.test(l)), s2);
});
