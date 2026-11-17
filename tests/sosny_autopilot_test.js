// Autopilot sadzi sosny (2026-11-17, gracz: „gracz może względnie wcześniej zasadzić kilka drzew”): na działce dziadka (Map218),
// gdy drzewa wokół są ścięte, autopilot fabuły (tests/autopilot_fabula/fab.js) sadzi szyszki jak gracz - menu ziemi „Posadź sosnę”
// (Forestry.js) - na wolnej ziemi przy pniakach, z dala od budowli; sosny rosną potem jak każde posadzone drzewo.
// Uruchom: node tests/run.js sosny_autopilot --port 9477
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 218, x: 30, y: 20, dir: 2, hour: 9, quiet: true, minimap: false });
    await t.eval("if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); $gameSystem.setStamina(100); $gameParty.gainItem($dataItems[147], 6); 0");
    // the plot's trees near the hero felled (stumps: self switch A), as after weeks of the forge's charcoal
    const felled = await J(`(function(){ const p = $gamePlayer, out = []; for (const e of $gameMap.events()) if (ChoppableTree.isTree(e) && Math.hypot(e.x - p.x, e.y - p.y) < 14) {
        $gameSelfSwitches.setValue([218, e.eventId(), "A"], true); out.push([e.x, e.y]); } return out; })()`);
    t.check("drzewa koło bohatera ścięte (pniaki)", felled.length >= 2, felled.length);
    await t.frames(20);
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    const v = await t.eval(fs.readFileSync(path.join(__dirname, "autopilot_fabula", "fab.js"), "utf8"));
    const spot = await J("FAB.trees.pineSpot()");
    t.check("autopilot fabuły w stronie; jest miejsce na sosnę (" + v + ")", /^ok|same/.test(String(v)) && !!spot, spot);
    await t.eval("AP.run([['fab_plant', 3]]); 0");
    const done = await t.until("!AP.cur && !AP.queue.length", 90);
    const st = await J(`(function(){ const recs = Forestry.treesOf(218) || [];
        const nearB = r => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Farming.buildingAt(r.x + dx, r.y + dy)) return true; return false; };
        return { n: recs.length, at: recs.map(r => [r.x, r.y]), cones: $gameParty.numItems($dataItems[147]), nearB: recs.filter(nearB).length,
            events: recs.filter(r => $gameMap.event(r.id)).length, log: AP.log.slice(-6) }; })()`);
    t.check("posadził 3 sosny z szyszek (menu ziemi „Posadź sosnę”), szyszek o 3 mniej, każda stoi na mapie", done && st.n === 3 && st.cones === 3 && st.events === 3, st);
    t.check("...żadna nie przy budowli (2 pola)", st.nearB === 0, st.at);
    await t.shot(path.join(__dirname, "..", "docs", "NOWY_SWIAT", "sosny_autopilot.png"));
});
