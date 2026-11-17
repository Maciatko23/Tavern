// Autopilot i tablica zleceń (2026-11-17, gracz: „uczciwe złoto poza zmianami”): autopilot fabuły (tests/autopilot_fabula/fab.js) podchodzi
// do tablicy w Kruczogrodzie (Map220, zdarzenie <Tavern:board>), czyta ją klawiszami jak gracz (strzałki do kartki, O, „Przyjmij”),
// bierze zlecenie, które da radę zrobić (gałęzie z ziemi), pomija to, czego nie zrobi uczciwie i bezpiecznie (zające - bez łuku;
// POSZUKIWANY Trójłap - za silny na jego poziom), idzie na Podgrodzie (Map218) zebrać gałęzie (z zapasem 10 dla siebie), wraca do tablicy
// i oddaje zlecenie za złoto - licznik złota według źródeł (FAB.rep.ledger) zapisuje je jako „zlecenia”.
// Uruchom: CDP_PORT=9581 node tests/autopilot_kontrakty_test.js   (albo: node tests/run.js autopilot_kontrakty --port 9581)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { build: buildGraph } = require("./autopilot_fabula/graf.js");

kit.test({ port: 9581, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 220, x: 54, y: 38, dir: 8, hour: 8, day: 6, quiet: true, minimap: false });
    // the board of this test: three notices at the lowest fame (tier 0), Borgar's words not heard yet (the first visit)
    // (the board's set of this day's cycle: not made anew under the test's own notices)
    const posted = await J(`(function(){ const d = QuestBoard.state(); QuestBoard.checkCycle(); d.board = []; d.tutorial = false; d.rep = 0; d.cycle = QuestBoard.cycleOf(Tawerna.time.day());
        const a = QuestBoard.post("branches", 0, 11), b = QuestBoard.post("rabbits", 0, 12), c = QuestBoard.post("b_trojlap", 2, 13);
        $gameParty.gainItem($dataItems[77], 10 - $gameParty.numItems($dataItems[77]));
        $gameSystem.setStamina && $gameSystem.setStamina(100);
        return { branches: a && { id: a.id, n: a.req[0].n, gold: a.gold }, rabbits: b && b.id, trojlap: c && c.id, cycle: d.cycle }; })()`);
    t.check("na tablicy trzy kartki: gałęzie (" + (posted.branches && posted.branches.n) + "), zające, POSZUKIWANY Trójłap", !!(posted.branches && posted.rabbits && posted.trojlap), posted);
    await t.eval("window.FAB_GRAPH = " + JSON.stringify(buildGraph()) + "; 0");
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    const v = await t.eval(fs.readFileSync(path.join(__dirname, "autopilot_fabula", "fab.js"), "utf8"));
    await t.eval("FAB.on = true; AP.restartWith = []; FAB.setSpeed(6); 0");   // (FAB.on: the scenes off the map are driven - the board's own keys; the brain itself is not started)
    t.check("autopilot fabuły w stronie (" + v + ")", /^ok|same/.test(String(v)));

    // 1. the board: walked to, read with the keys, the doable one taken, the others passed by with the reason
    await t.eval("AP.run([['fab_board']]); 0");
    const took = await t.until("!AP.cur && !AP.queue.length && SceneManager._scene instanceof Scene_Map", 90);
    const r1 = await J(`(function(){ const f = id => QuestBoard.find(id) || { state: 'brak' }; return { board: QuestBoard.board().map(n => n.id + ':' + n.tpl + ':' + n.state), fab: FAB.log.slice(-12), took: ${JSON.stringify(posted)}, br: f('${posted.branches.id}').state, rb: f('${posted.rabbits}').state, tr: f('${posted.trojlap}').state,
        tutorial: QuestBoard.state().tutorial, rep: FAB.rep.contracts, log: AP.log.slice(-6) }; })()`);
    t.check("przy tablicy: Borgar objaśnił tablicę (O), zlecenie „gałęzie” przyjęte klawiszami", took && r1.br === "active" && r1.tutorial === true, { br: r1.br, tutorial: r1.tutorial, board: r1.board, log: r1.log, fab: r1.fab });
    const skip = (r1.rep || []).filter(c => c.what === "pominięte");
    t.check("zające i Trójłap pominięte - z powodem w raporcie", r1.rb === "open" && r1.tr === "open" && skip.length === 2 && skip.every(c => !!c.why),
        skip.map(c => c.title + ": " + c.why));

    // 2. the work: off to Podgrodzie (a real walk over the seam), the branches gathered with his own 10 kept
    await t.eval("AP.run([['fab_contract', 218]]); 0");
    const worked = await t.until("!AP.cur && !AP.queue.length", 240);
    const r2 = await J(`({ map: $gameMap.mapId(), branches: $gameParty.numItems($dataItems[77]), ready: QuestBoard.isReady('${posted.branches.id}'), log: AP.log.slice(-6) })`);
    t.check("na Podgrodziu nazbierał gałęzi: " + r2.branches + " (zlecenie " + posted.branches.n + " + 10 dla siebie)", worked && r2.map === 218 && r2.ready && r2.branches >= posted.branches.n + 10, r2);

    // 3. back to the board in Kruczogród, the contract turned in for its gold (the ledger: "zlecenia")
    const g0 = await t.gold();
    await t.eval("AP.run([['fab_board', 220]]); 0");
    const back = await t.until("!AP.cur && !AP.queue.length && SceneManager._scene instanceof Scene_Map && $gameMap.mapId() === 220", 240);
    const r3 = await J(`({ state: QuestBoard.find('${posted.branches.id}').state, gold: $gameParty.gold(), branches: $gameParty.numItems($dataItems[77]), ledger: FAB.rep.ledger,
        done: (FAB.rep.contracts || []).filter(c => c.what === 'oddane'), log: AP.log.slice(-6) })`);
    t.check("z powrotem przy tablicy: zlecenie oddane (WYKONANE), +" + posted.branches.gold + " G, gałęzi zostało " + r3.branches,
        back && r3.state === "done" && r3.gold - g0 === posted.branches.gold && r3.branches >= 10, { state: r3.state, gold: r3.gold - g0, branches: r3.branches, log: r3.log });
    t.check("licznik złota według źródeł: „zlecenia” " + (r3.ledger && r3.ledger.in.zlecenia) + " G, w raporcie „oddane”",
        !!r3.ledger && r3.ledger.in.zlecenia === posted.branches.gold && r3.done.length === 1, { ledger: r3.ledger && r3.ledger.in, done: r3.done });

    // 4. the judgement of a named beast: Czarny Ryj (a boar by the weir, level ~4, in the day's hours) - not at level 1, yes well above
    // it; Trójłap (a wolf of Podgrodzie) - out at night only, the contracts are the day's work; Szary Kieł (level ~8, two wolves) - no
    const j = await J(`(function(){ const before = FAB.qb.bountyOk("czarny_ryj");
        $gameParty.gainItem($dataItems[331], 1); Combat.setHand("m331"); $gameParty.gainItem($dataItems[152], 3); Combat.gainXp(8000, "test", true);
        return { before, lv: Combat.hero().level, after: FAB.qb.bountyOk("czarny_ryj"), trojlap: FAB.qb.bountyOk("trojlap"), szary: FAB.qb.bountyOk("szary_kiel"), wolves: FAB.qb.huntOk("wolf"), boar: FAB.qb.huntOk("boar") }; })()`);
    t.check("POSZUKIWANY: Czarny Ryj odrzucony na poziomie 1, przyjęty na poziomie " + j.lv + "; Trójłap i zwykłe wilki - tylko nocą (nie); Szary Kieł - za silny",
        !j.before.ok && j.after.ok && !j.trojlap.ok && /noc/.test(j.trojlap.why) && !j.wolves.ok && j.boar.ok && !j.szary.ok, j);
});
