// Autopilot i obóz bandytów (2026-11-17, gracz: „uczciwe złoto poza zmianami”): nocą w Kruczych Turniach (Map222) płonie ognisko
// bandytów (Humans.camp - dwóch, jeden śpi). Autopilot fabuły (tests/autopilot_fabula/fab.js) ocenia, czy da radę (poziom, życie, rana,
// opatrunki, broń; obóz najwyżej 3 ludzi, bez najemnika poniżej poziomu 10), podchodzi do światła ogniska, skrada się (C) do śpiącego,
// bije z ukrycia, walczy z resztą klawiszami (tryb walki, cios, unik, garda), błagających oszczędza („Puść go wolno”), przeszukuje
// pobitych i bierze worek z łupem (O przy worku). Złoto trafia do licznika źródeł jako „obozy”, obóz do raportu (FAB.rep.camps).
// Bohater dostaje w teście poziom i żelazną włócznię (jak po kilku tygodniach gry). Do tego ocena: za duży obóz z najemnikiem - pominięty.
// Uruchom: CDP_PORT=9582 node tests/autopilot_oboz_test.js   (albo: node tests/run.js autopilot_oboz --port 9582)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");
const { build: buildGraph } = require("./autopilot_fabula/graf.js");

kit.test({ port: 9582, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    await t.newGame({ map: 222, x: 40, y: 40, dir: 2, hour: 22, day: 12, quiet: true, minimap: false });
    // an open place on the mountain map for the hero (the camp's fire wants room 9-16 tiles off)
    const at = await J(`(function(){ const ok = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXy(x, y).length;
        let best = null;
        for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 6; x < $gameMap.width() - 6; x++) {
            if (!ok(x, y)) continue; let room = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (ok(x + dx, y + dy)) room++;
            const s = room - 0.02 * Math.hypot(x - 40, y - 40); if (room >= 45 && (!best || s > best.s)) best = { x, y, s }; }
        if (best) $gamePlayer.locate(best.x, best.y); return best; })()`);
    await t.frames(10);
    // the hero after some weeks: level, the iron spear in hand, bandages, full life and strength
    const hero = await J(`(function(){ Combat.gainXp(5200, "test", true); $gameParty.gainItem($dataItems[331], 1); $gameParty.gainItem($dataItems[152], 4);
        const a = $gameParty.leader(); a.setHp(a.mhp); $gameSystem.setStamina && $gameSystem.setStamina(100); $gameParty.loseGold($gameParty.gold());
        return { level: Combat.hero().level }; })()`);
    await t.eval("window.FAB_GRAPH = " + JSON.stringify(buildGraph()) + "; 0");
    await t.eval(fs.readFileSync(path.join(__dirname, "autopilot", "ap.js"), "utf8"));
    const v = await t.eval(fs.readFileSync(path.join(__dirname, "autopilot_fabula", "fab.js"), "utf8"));
    const lv = await J(`(function(){ FAB.combatLevelUp(); Combat.setHand("m331"); const a = $gameParty.leader(); a.setHp(a.mhp); return { level: Combat.hero().level, hand: Combat.handMelee(), fit: FAB.bandits.fit() }; })()`);
    t.check("autopilot fabuły w stronie (" + v + "); bohater poziom " + lv.level + ", włócznia w ręce, gotów na obóz", /^ok|same/.test(String(v)) && lv.hand === 331 && lv.fit.ok, { at, hero, lv });

    // the judgement: a camp too big with a mercenary is passed by (as seen by its fire)
    const j = await J(`FAB.bandits.judge({ members: [{ kind: "mercenary", state: "alive", level: 6 }, { kind: "bandit", state: "alive", level: 5 }, { kind: "archer", state: "alive", level: 5 }, { kind: "bandit", state: "alive", level: 5 }] })`);
    t.check("ocena: 4 ludzi z najemnikiem - pomija (" + j.why + ")", !j.ok && /za dużo|najemnik/.test(j.why), j);

    // the camp tonight: two bandits, one asleep by the fire, one awake
    const camp = await J(`(function(){ const c = Humans.camp({ size: 2, kinds: ["bandit", "bandit"], far: 9, near: 16 }); if (!c) return null;
        const sack = Humans.drops().find(d => d.kind === "sack" && d.camp === c.id);
        return { id: c.id, x: c.x, y: c.y, men: c.members.map(m => m.kind + ":" + m.mode + ":" + m.level), sackGold: sack ? sack.gold : null,
            hero: [$gamePlayer.x, $gamePlayer.y], judge: FAB.bandits.judge(c) }; })()`);
    t.check("obóz bandytów na Kruczych Turniach (dwóch, worek " + (camp && camp.sackGold) + " G)", !!camp && camp.sackGold > 0 && camp.judge.ok, camp);
    if (!camp) return;
    const g0 = await t.gold();
    await t.eval("FAB.on = true; AP.restartWith = []; FAB.setSpeed(3); AP.run([['fab_camp']]); 0");   // (an error: no brain restarted - the test sees it)
    const done = await t.until("!AP.cur && !AP.queue.length && !$gameMessage.isBusy()", 240);
    const r = await J(`(function(){ const c = Humans.state().camps[222];
        const standing = Humans.list.filter(h => h._campRef && !h._dead && !h._surrendered && h._mode !== "flee" && h._mode !== "leave").length;
        return { standing, members: c ? c.members.map(m => m.kind + ":" + m.state) : null, sackLeft: Humans.drops().some(d => d.kind === "sack" && d.camp === ${camp.id}),
            gold: $gameParty.gold(), hp: Math.round($gameParty.leader().hp / $gameParty.leader().mhp * 100), robbed: Humans.state().beaten || 0,
            rec: (FAB.rep.camps || []).slice(-1)[0], crept: FAB.log.some(l => /skradam się do śpiącego/.test(l)), ledger: FAB.rep.ledger && FAB.rep.ledger.in, sneaks: Combat.act ? Combat.act.sneaks || 0 : null, log: AP.log.slice(-10), fab: FAB.log.slice(-10) }; })()`);
    t.check("obóz rozbity: nikt nie stoi do walki, bohater nie obrabowany (życie " + r.hp + "%)", done && r.standing === 0 && r.robbed === 0 && r.rec && r.rec.result === "rozbity", r);
    // (the one awake by the fire may spot him on the way - then it is an open fight, as for a player: the attempt is what is checked)
    const crept = r.crept || r.sneaks > 0;   // (the whole log: a long fight pushed the line out of the last ten)
    t.check("skrada się (C) do śpiącego i bije z ukrycia" + (r.sneaks > 0 ? " - cios z ukrycia wszedł" : " - czuwający zauważył go wcześniej, otwarta walka"), crept, { sneaks: r.sneaks, crept });
    t.check("worek z łupem wzięty: +" + (r.gold - g0) + " G (w worku było " + camp.sackGold + ")", !r.sackLeft && r.gold - g0 >= camp.sackGold, { sackLeft: r.sackLeft, gold: r.gold - g0, log: r.log, fab: r.fab });
    t.check("licznik złota według źródeł: „obozy” " + (r.ledger && r.ledger.obozy) + " G; obóz w raporcie", !!r.ledger && r.ledger.obozy === r.gold - g0 && r.rec.gold === r.gold - g0, { ledger: r.ledger, rec: r.rec });
    await t.shot(path.join(__dirname, "autopilot_fabula", "oboz_test.png")).catch(() => null);
});
