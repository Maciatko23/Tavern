// W6 "Ludzie z promu", chapters 3-7 (TownQuests.js 2026-10-07). Port: CDP_PORT=9463.
// ch2: the camp's trust (three deeds + Rafał's) opens ch3; ch3: Rafał's story by the camp's fire at night (TownLife "w6Fire" seats him
// there); ch4: the wanted poster on the tavern's quest board (the board opens after it) - the choice: hide him (the attic room in the
// tavern, grandpa's house, the bell tower; the corporal's search on the third day - the risk rolled), turn him in to Wit (120 G),
// smuggle him on the ferry through Baltazar (50 G), or nothing (the camp searched: taken); ch5: the second wave of day 24 (the props: a
// tent, Bogdan and Halina), the vote at the town hall (Opinia = the hero's weight): the refugees in with a week of work (the helpers
// harvest grandpa's field) or the gate shut (the camp moves to Podgrodzie - TownLife "alt", wolves at night); ch6-7 in one step: Marek
// (Ludmiła's kerchief, the diggers' cave Map014: he turns from the wall and follows; a word with the guard / the fight / seen -> the
// alarm / beaten), out of the cave = marekSaved (W8 counts it), the reunion; the Wigilia in the camp (4 dishes) - W6 done.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "w6");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const talkTo = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 25 }, o || {})); if (!r.done) await t.finish(); return flat(r); };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 40); await t.eval("TownQuests.syncSpots(); 0"); await t.frames(2); };
    const step = async () => { const r = await J("TownQuests.rec('W6')"); return r ? r.s + ":" + r.step : "none"; };
    const flags = () => J("TownQuests.state().flags");
    const notes = () => J("Journal.data().notes.map(n => n.title)");
    const res = k => `TownLife.eventOf('${k}')`;
    const prop = id => J(`(function(){ const e = $gameMap.event(${id}); return e ? { x: e.x, y: e.y, page: !!e.page(), img: e.characterName() } : null; })()`);
    const caveEv = name => `$gameMap.events().find(e => e.event() && e.event().name === '${name}' && !e._erased)`;
    const jtext = () => J("TownQuests.journalOps({ quest: TownQuests.Q.W6 }).map(o => o.text || '').join(' | ')");

    await t.newGame({ map: 8, x: 31, y: 49, dir: 2, hour: 10, day: 12, quiet: true, minimap: false });
    await at(12, 10, 30);
    // ------------------------------------------------------------------ the start and ch2 (the camp's trust)
    await t.eval("(function(){ TownQuests.start('K19'); TownQuests.finish('K19'); TownQuests.autoChecks(); return 0; })()");
    t.check("W6 starts by itself from day 10, once a camp quest has been taken (K19)", (await step()) === "active:0");
    await t.eval("(function(){ TownQuests.finish('K27'); const f = TownQuests.state().flags; f.campFed = 12; f.rafalTrust = 12; TownQuests.autoChecks(); return 0; })()");
    const j0 = await jtext();
    t.check("ch2: two deeds of three - still chapter 2 ('Zaufanie obozu: 2/3', Rafał: 'ufa ci')", (await step()) === "active:0" && /Zaufanie obozu: 2\/3/.test(j0) && /Rafał: ufa ci/.test(j0), j0.slice(0, 300));
    await t.eval("(function(){ TownQuests.state().flags.elaHealed = 12; TownQuests.autoChecks(); return 0; })()");
    t.check("...the third deed (Ela healed): chapter 3", (await step()) === "active:1");

    // ------------------------------------------------------------------ ch3: Rafał by the fire at night
    await at(12, 21, 60);
    const rs = await J(`(function(){ const s = TownLife.state('rafal'); return { x: s.x, y: s.y, hidden: s.hidden, act: s.act }; })()`);
    const fire = await prop(905);
    t.check("ch3: at 21:00 Rafał stands by the camp's fire (TownLife 'w6Fire': w6_ognisko 33,51); the fire is a prop (905, a flame)",
        !rs.hidden && rs.act === "stand" && Math.abs(rs.x - 33) + Math.abs(rs.y - 51) <= 1 && fire && fire.page && fire.img === "!Decoration", { rs, fire });
    await t.locate(33, 49, 2);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "w6_ognisko_noc.png"));
    const story = await talkTo(res("rafal"), []);
    const s3 = await J("TownQuests.rec('W6')");
    t.check("...his story: a digger of the expedition for the Heart, 'drzwi pod skałą', one touched the rock and stopped speaking; Marek was in his crew",
        /drzwi pod skałą/.test(story.text) && /przestał mówić/.test(story.text) && /Marek. Mąż Ludmiły/.test(story.text) && s3.step === 2 && s3.t.poster === 13 && (await notes()).includes("Kim był Rafał"), story.text.slice(0, 300));

    // ------------------------------------------------------------------ ch4: the poster on the tavern's quest board
    await t.go(1, 43, 51, 8);
    await at(13, 12, 30);
    const board = flat(await t.talkTo(21, [], { secs: 8 }));
    const onBoard = await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_QuestBoard'", 10);
    await t.eval("SceneManager.pop(); 0");
    await t.until(t.onMap(1), 20);
    await t.frames(20);
    const s4 = await J("TownQuests.rec('W6')");
    t.check("ch4: the tavern's quest board - 'POSZUKIWANY. Rafał...' from Kapral Wit by the manor's order, 120 G - then the board opens; the search on day 16",
        /POSZUKIWANY/.test(board.text) && /sto dwadzieścia groszy/.test(board.text) && /Kapral Wit Czerwień, z rozkazu dworu/.test(board.text) && onBoard && s4.step === 3 && s4.t.search === 16,
        { text: board.text.slice(0, 260), onBoard, step: s4.step, search: s4.t.search });
    t.check("...and a paper on the tavern's outer wall (the notice place's paper, 7 days)", (await J("TownQuests.state().flags.notice_notice_tavern")) === 13);
    await t.go(8, 22, 49, 2);
    await at(14, 5, 40);
    await t.saveTo(1);

    // ---- a) hidden in the tavern's attic room: the search finds nothing (roll 99) - back on the seventh day: Rafał the hero's ally
    await t.gold(100);
    const hide = await talkTo(res("rafal"), ["Ukryję cię", "W izdebce nad tawerną"]);
    const h1 = await J("({ r: TownQuests.rec('W6'), gone: TownLife.gone('rafal') })");
    t.check("ch4 a: Rafał at dawn: 'Ukryję cię.' -> 'W izdebce nad tawerną (50 G dla Borgara) - ryzyko: ...' - 50 G, he is gone from the camp; searched on day 17, back on day 21",
        /Morze z jednej strony/.test(hide.text) && (hide.choices[1] || []).some(c => /ryzyko: (małe|średnie|duże)/.test(c)) && (await t.gold()) === 50 && h1.gone && h1.r.step === 4 && h1.r.t.hide.where === "tavern" && h1.r.t.hide.search === 17 && h1.r.t.hide.until === 21,
        { text: hide.text.slice(0, 200), choices: hide.choices, hide: h1.r.t.hide });
    await t.go(25, 39, 39, 6);
    await at(15, 12, 30);
    const hid = await prop(951);
    t.check("...in room 1 upstairs (Map025) Rafał stands by the bed (the place 951, his sheet)", hid && hid.page && hid.img === "$Npc_Rafal" && hid.x === 40 && hid.y === 38, hid);
    await t.shot(path.join(SHOTS, "w6_izdebka.png"));
    const hidTalk = await talkTo("$gameMap.event(951)", []);
    t.check("...and talks: 'Borgar przynosi mi zupę'", /Borgar przynosi mi zupę/.test(hidTalk.text), hidTalk.text.slice(0, 120));
    await t.eval("TownQuests.w6Opts = { roll: 99 }; 0");
    await at(17, 10.5, 60);
    const h2 = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags })");
    t.check("...day 17, 10:00: the corporal searches the tavern - not found (the roll over the risk); still hidden", h2.r.step === 4 && h2.r.t.hide.searched === 17 && !h2.f.rafalTaken, h2.r.t.hide);
    await at(21, 9, 60);
    const h3 = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags, gone: TownLife.gone('rafal') })");
    t.check("...day 21: Rafał back in the camp - rafalAlly (Act III: he fights with the hero); chapter 5", h3.r.step === 5 && h3.f.rafalAlly && !h3.gone && (await notes()).includes("Rafał ocalony"), { step: h3.r.step, ally: h3.f.rafalAlly, gone: h3.gone });
    await t.eval("TownQuests.w6Opts = null; 0");
    await t.go(8, 30, 49, 2);
    await at(21, 12, 30);
    const lr = await talkTo(res("ludmila"), []);
    t.check("...Ludmiła says it once: 'Rafał wrócił do obozu... Dziękuję ci'", /Rafał wrócił do obozu/.test(lr.text), lr.text.slice(0, 120));
    await t.saveTo(2);

    // ---- a') grandpa's house - found (roll 0): taken, the guard suspicious
    await t.loadFrom(1, { quiet: true });
    await at(14, 5, 40);
    await t.eval("TownQuests.w6Opts = { roll: 0 }; 0");
    await talkTo(res("rafal"), ["Ukryję cię", "W chacie dziadka"]);
    await at(17, 10.5, 60);
    const ft = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags, w6: TownQuests.w6() })");
    t.check("ch4 a': hidden in grandpa's house, found by the search (roll 0) - rafalTaken, guardSuspicious; chapter 5",
        ft.r.step === 5 && ft.f.rafalTaken && ft.f.guardSuspicious && ft.w6.rafal === "taken", { step: ft.r.step, w6: ft.w6 });
    await t.eval("TownQuests.w6Opts = null; 0");

    // ---- b) turned in to Wit: 120 G, the Lord's favour; Ludmiła hates the hero (her offers gone, a cold word)
    await t.loadFrom(1, { quiet: true });
    await at(14, 10, 60);
    const g0 = await t.gold();
    const give = await talkTo(res("kapral"), ["Wiem, gdzie jest"]);
    const gv = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags, gone: TownLife.gone('rafal'), w6: TownQuests.w6() })");
    t.check("ch4 b: Wit 'List gończy... Wiesz coś o tym Rafale?' -> 'Wiem, gdzie jest.' - 120 G, rafalGiven + rafalEnemy, Rafał gone; chapter 5",
        /Sto dwadzieścia groszy, jak w liście/.test(give.text) && (await t.gold()) === g0 + 120 && gv.f.rafalGiven && gv.f.rafalEnemy && gv.gone && gv.r.step === 5 && gv.w6.rafal === "enemy", { text: give.text.slice(0, 200), w6: gv.w6 });
    const lm1 = await talkTo(res("ludmila"), []);
    const lm2 = await talkTo(res("ludmila"), []);
    t.check("...Ludmiła: 'Wydałeś go. Za sto dwadzieścia groszy.' - then only a cold word; her quests are not offered (K28)",
        /Wydałeś go/.test(lm1.text) && /(Nie mam ci nic|Idź sobie)/.test(lm2.text) && !(await J("TownQuests.offerable('K28')")), { a: lm1.text.slice(0, 120), b: lm2.text.slice(0, 120) });

    // ---- c) smuggled on the ferry through Baltazar (50 G)
    await t.loadFrom(1, { quiet: true });
    await at(14, 5, 40);
    const sm = await talkTo(res("rafal"), ["Przemycę cię promem"]);
    t.check("ch4 c: 'Przemycę cię promem - przez Baltazara.' - Rafał agrees; the step asks to pay Baltazar", /pięćdziesiąt groszy/.test(sm.text) && (await J("TownQuests.rec('W6').t.agree")) === "smuggle", sm.text.slice(0, 160));
    await at(14, 10, 60);
    await t.gold(80);
    const bal = await talkTo(res("kupiec"), ["Płacę"]);
    const sv = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags, gone: TownLife.gone('rafal') })");
    t.check("...Baltazar: 'Pięćdziesiąt groszy. I nikt nie pyta.' - paid: rafalSmuggled, Rafał gone, chapter 5",
        /I nikt nie pyta/.test(bal.text) && (await t.gold()) === 30 && sv.f.rafalSmuggled && sv.gone && sv.r.step === 5, { text: bal.text.slice(0, 160), step: sv.r.step });

    // ---- d) nothing done: the camp searched on day 16 - taken
    await t.loadFrom(1, { quiet: true });
    await at(16, 10.5, 60);
    const nd = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags })");
    t.check("ch4 d: undecided - on day 16 at 10:00 the guard searches the camp: Rafał taken (no 'guardSuspicious' - nobody hid him)", nd.r.step === 5 && nd.f.rafalTaken && !nd.f.guardSuspicious, nd.r.step);

    // ------------------------------------------------------------------ ch5: the second wave, the vote
    await t.loadFrom(2, { quiet: true });
    await at(22, 12, 40);
    const before = await J("({ t904: !!($gameMap.event(904) && $gameMap.event(904).page()), text: TownQuests.journalOps({ quest: TownQuests.Q.W6 }).map(o => o.text || '').join(' | ') })");
    t.check("ch5 before day 24: 'Prom z drugą falą ... przypłynie w dniu 24'; no second tent yet", !before.t904 && /w dniu 24/.test(before.text), before);
    await at(24, 10, 60);
    const wave = { tent: await prop(904), bogdan: await prop(906), halina: await prop(907), tent1: await prop(903) };
    t.check("day 24: the second wave - a tent more (904), Bogdan (906) and Halina (907): PixelLab sheets", wave.tent.page && wave.bogdan.page && wave.bogdan.img === "$Npc_Bogdan" && wave.halina.img === "$Npc_Halina" && wave.tent1.page, wave);
    await t.locate(26, 49, 2);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "w6_druga_fala.png"));
    const pb = await talkTo("$gameMap.event(906)", []);
    t.check("...Bogdan talks ('Z drugiego promu')", /Z drugiego promu/.test(pb.text), pb.text.slice(0, 100));
    await t.saveTo(3);
    await t.eval("(function(){ TownQuests.addOpinion(40 - TownQuests.opinion(), 'test'); return 0; })()");
    await t.go(104, 6, 6, 8);
    await at(25, 13.5, 60);
    const tally = await J("TownQuests.w6Tally('open')");
    const vote = await talkTo(res("soltys"), ["Wpuścić"]);
    await t.until("SpeechBubbles.log.some(l => /Za wpuszczeniem/.test(l))", 15, 300);
    const vt = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags, w: TownQuests.state().w6, log: SpeechBubbles.log.slice(-4) })");
    t.check("ch5: the town hall (Map104), day 25 13:00: the sołtys asks the town - the hero's weight = Opinia/2 (40 -> 20): let in 74 vs 55 - campInside, a week of work",
        /zamykamy bramę dla nowych/.test(vote.text) && tally.open === 45 + 9 + 20 && tally.close === 55 && vt.f.campInside && !vt.f.campOutside && vt.w.work.from === 25 && vt.w.work.until === 32 && vt.r.step === 6,
        { tally, step: vt.r.step, work: vt.w && vt.w.work, log: vt.log });
    // the helpers on grandpa's field (the crops under a scarecrow: Birds' planned raids eat unguarded ones)
    await t.eval(`(function(){ const F = Farming.farm(); const p = F.plots[3] || (F.plots[3] = {}); p["10,20"] = { s: "tilled", crop: "potato", day: 1 }; p["12,20"] = { s: "tilled", crop: "carrot", day: 1 }; p["14,20"] = { s: "tilled", crop: "carrot", day: 25 };
        (F.buildings[3] || (F.buildings[3] = [])).push({ id: 9901, type: "scarecrow", x: 12, y: 18 }); F.rev++; return 0; })()`);
    await t.go(3, 20, 24, 2);
    await at(26, 9, 40);
    const help = { a: await prop(906), b: await prop(907) };
    t.check("...on grandpa's field (Map003) during the work week Bogdan and Halina stand by the crops (906, 907 - the tile under the first plots)",
        help.a.page && help.b.page && help.a.img === "$Npc_Bogdan" && help.a.x === 10 && help.a.y === 21, help);
    await t.locate(11, 23, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "w6_pomocnicy.png"));
    const pot0 = await t.count(71), car0 = await t.count(72);
    await at(26, 16.2, 120);
    const hv = await J(`(function(){ const p = Farming.farm().plots[3]; return { a: p["10,20"].crop, b: p["12,20"].crop, c: p["14,20"].crop, last: TownQuests.state().w6.work.last }; })()`);
    t.check("...at 16:00 they harvest the ripe crops by themselves (the young carrot stays); no chest on the field - the crops go to the hero",
        hv.a === null && hv.b === null && hv.c === "carrot" && hv.last === 26 && (await t.count(71)) > pot0 && (await t.count(72)) > car0, hv);
    await t.saveTo(4);

    // ...or the gate shut: the camp moves out to Podgrodzie (TownLife "alt"), wolves at night
    await t.loadFrom(3, { quiet: true });
    await t.eval("(function(){ TownQuests.addOpinion(10 - TownQuests.opinion(), 'test'); return 0; })()");
    await t.go(104, 6, 6, 8);
    await at(25, 13.5, 60);
    await talkTo(res("soltys"), ["Zamknąć bramę"]);
    const cl = await J("({ f: TownQuests.state().flags, home: TownLife.homeOf(TownLife.RESIDENTS.find(r => r.key === 'ludmila')), w6: TownQuests.w6() })");
    t.check("ch5 the other way: 'Zamknąć bramę' - campOutside: Ludmiła now lives on Map111 (TownLife alt)", cl.f.campOutside && cl.home === 111 && cl.w6.camp === "outside", cl.w6);
    await t.go(8, 30, 49, 2);
    await at(25, 15, 40);
    const inTown = await J(`({ ludmila: !TownLife.state('ludmila') || TownLife.state('ludmila').hidden, tent: !!($gameMap.event(903) && $gameMap.event(903).page()) })`);
    t.check("...in the town she is away and the camp's tent is gone", inTown.ludmila && !inTown.tent, inTown);
    await t.go(111, 38, 12, 8);
    await at(25, 15, 60);
    const pod = await J(`({ ludmila: (function(){ const s = TownLife.state('ludmila'); return s && !s.hidden; })(), tent: !!($gameMap.event(903) && $gameMap.event(903).page()) })`);
    t.check("...in Podgrodzie: Ludmiła by the tents, the second wave's tent (903 on Map111)", pod.ludmila && pod.tent, pod);
    await t.shot(path.join(SHOTS, "w6_podgrodzie_oboz.png"));
    await t.eval("TownQuests.w6Opts = { wolves: 1 }; 0");
    await t.setDay(25, 22);
    await t.until("Hunting.animals.some(a => a.kind === 'wolf' || a._kind === 'wolf' || (a.species && a.species === 'wolf'))", 15, 300);
    const wolves = await J("({ n: Hunting.animals.length, night: TownQuests.state().w6.wolf })");
    t.check("...at night (22:00) near the tents: wolves come to the camp outside the wall", wolves.n >= 1 && wolves.night === 25, wolves);
    await t.eval("TownQuests.w6Opts = null; 0");

    // ------------------------------------------------------------------ ch6-7: Marek
    await t.loadFrom(4, { quiet: true });
    await t.go(8, 20, 33, 8);
    await at(27, 10, 60);
    const jh = await jtext();
    t.check("the last step holds chapters 6 and 7: the Wigilia (day 96) and Marek (Act II - no story game here: now)", /Wigilia w dniu 96/.test(jh) && /Powiedz Ludmile, czego się dowiedziałeś o Marku/.test(jh) && /Rozdział 7/.test(jh), jh.slice(0, 400));
    const ch = await talkTo(res("ludmila"), []);
    t.check("ch7: Ludmiła hears it - her kerchief with the horse Ela stitched ('Przyprowadź mi go')", /Przyprowadź mi go/.test(ch.text) && (await J("TownQuests.vcount('chusta')")) === 1 && (await J("TownQuests.rec('W6').t.m")) === 1, ch.text.slice(0, 200));
    await t.go(14, 30, 7, 8);
    await at(27, 12, 40);
    const turn = await talkTo(caveEv("Marek"), []);
    const tv = await J("({ m: TownQuests.rec('W6').t.m, mk: TownQuests.rec('W6').t.mk, chusta: TownQuests.vcount('chusta') })");
    t.check("...in the diggers' cave Marek at the wall turns at the kerchief: '...Wiatr. Konik. ...Ela.' - he follows the hero", /Wiatr. Konik/.test(turn.text) && tv.m === 2 && tv.mk.follow && tv.chusta === 0, { text: turn.text.slice(0, 200), tv });
    await t.locate(26, 9, 4);
    await t.frames(150);
    const mv = await J(`(function(){ const e = ${caveEv("Marek")}; return { x: e.x, y: e.y }; })()`);
    t.check("...Marek walks after the hero (path8 steps)", Math.hypot(mv.x - 26, mv.y - 9) < Math.hypot(30 - 26, 5 - 9), mv);
    await t.shot(path.join(SHOTS, "w6_marek_idzie.png"));
    await t.saveTo(5);

    // ---- a word with the guard (80 G) - then out of the cave: marekSaved
    await t.gold(100);
    const gw = await talkTo(caveEv("Strażnik obozu"), ["Dam ci 80"]);
    t.check("...the camp's guard: 'nikt stąd nie wychodzi' - 'Dam ci 80 groszy.' - the way is clear", /nikt stąd nie wychodzi/.test(gw.text) && (await t.gold()) === 20 && (await J("TownQuests.rec('W6').t.mk.clear")) === "bribe", gw.text.slice(0, 160));
    await t.eval(`(function(){ const e = ${caveEv("Marek")}; e.locate(20, 25); $gamePlayer.locate(20, 26); return 0; })()`);
    await t.frames(40);
    const out = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags, marek: !!" + caveEv("Marek") + ", w8: TownQuests.FX.w8Choice.count() })");
    t.check("...out of the cave's mouth with him: marekSaved (W8's 'two of three' counts it), Marek gone from the cave, the note",
        out.f.marekSaved && out.r.t.m === 3 && !out.marek && out.w8 >= 1 && (await notes()).includes("Marek wyprowadzony"), { m: out.r.t.m, w8: out.w8 });
    await t.go(8, 20, 33, 8);
    await at(27, 11, 60);
    const mk = await J(`(function(){ const s = TownLife.state('marek'); return s ? { hidden: s.hidden, x: s.x, y: s.y } : null; })()`);
    t.check("in the town Marek lives with his family now (TownLife resident, $Npc_Marek)", mk && !mk.hidden, mk);
    const reu = await talkTo(res("ludmila"), []);
    t.check("...the reunion: 'Wróciłeś!', Ela 'TATO!', Marek 'Dług... Kiedy przyjdą - stanę z tobą.'",
        /Wróciłeś!/.test(reu.text) && /TATO!/.test(reu.text) && /stanę z tobą/.test(reu.text) && (await J("TownQuests.rec('W6').t.m")) === 4, reu.text.slice(0, 300));
    await t.saveTo(6);

    // ---- seen by a digger by day - the alarm: a fight (Humans.js), won - the way is clear
    await t.loadFrom(5, { quiet: true });
    await at(27, 12, 30);
    const come = await talkTo(caveEv("Marek"), []);
    t.check("...the cave loaded again: Marek waits in his niche - 'Chodź. Idziemy do domu.' and he follows again", /Idziemy do domu/.test(come.text) && (await J("TownQuests.rec('W6').t.mk.follow")) === true, come.text.slice(0, 120));
    await t.eval("Hunting.setSneak(false); 0");
    await t.locate(21, 19, 4);
    const alarm = await t.until("!!(window.Humans && Humans.band('w6Marek'))", 15, 300);
    const al = await J(`(function(){ const b = Humans.band('w6Marek'); return { n: b.members.length, name: b.members[0].name(), kind: b.members[0]._kind, guard: !!${caveEv("Strażnik obozu")} }; })()`);
    t.check("...seen by the digger at the fire by day (not sneaking) - the alarm: the camp's guard as Humans.js's mercenary, his event gone", alarm && al.kind === "mercenary" && al.name === "Strażnik obozu" && !al.guard, al);
    await t.shot(path.join(SHOTS, "w6_alarm.png"));
    await t.eval("(function(){ const h = Humans.band('w6Marek').members[0]; Humans.surrender(h); Humans.decide(h._hid, 'spare'); return 0; })()");
    await t.frames(40);
    t.check("...the guard beaten (spared): the way is clear ('fight')", (await J("TownQuests.rec('W6').t.mk.clear")) === "fight");

    // ---- the hero beaten: Marek back at the wall
    await t.loadFrom(5, { quiet: true });
    await at(27, 12, 30);
    await talkTo(caveEv("Strażnik obozu"), ["To go odbiorę siłą"]);
    await t.until("!!(window.Humans && Humans.band('w6Marek'))", 10, 300);
    await t.eval("(function(){ Humans.beatenBy(Humans.band('w6Marek').members[0]); return 0; })()");
    await t.until("TownQuests.rec('W6').t.mk.lost === 27", 30, 300);
    await t.frames(30);
    const lost = await J(`(function(){ const e = ${caveEv("Marek")}; return { follow: TownQuests.rec('W6').t.mk.follow, m: TownQuests.rec('W6').t.m, x: e.x, y: e.y, saved: !!TownQuests.state().flags.marekSaved }; })()`);
    t.check("...or 'To go odbiorę siłą' and the hero beaten: robbed (Humans.js), Marek back at the wall (30,5) - try again", lost.m === 2 && !lost.follow && lost.x === 30 && lost.y === 5 && !lost.saved, lost);

    // ---- at night the guard sits by the camp's fire, facing the way out
    await t.loadFrom(5, { quiet: true });
    await t.go(13, 44, 8, 8);
    await at(27, 23, 20);
    await t.go(14, 20, 27, 8);
    await t.frames(20);
    const ng = await J(`(function(){ const g = ${caveEv("Strażnik obozu")}; return g ? { x: g.x, y: g.y, d: g.direction() } : null; })()`);
    t.check("...at night (Marek waiting to be led out) the guard sits by the camp's fire ('oboz_kopaczy' 18,18) facing the way out", ng && ng.x === 18 && ng.y === 18 && ng.d === 2, ng);

    // ------------------------------------------------------------------ ch6: the Wigilia in the camp - W6 done
    await t.loadFrom(6, { quiet: true });
    await at(90, 10, 60);
    const wa = await talkTo(res("ludmila"), ["Zjedzmy w obozie"]);
    t.check("ch6: winter (12 days before the Wigilia) - Ludmiła: 'Zjesz z nami?' - in the camp, 4 hot dishes", /Zjesz z nami/.test(wa.text) && (await J("TownQuests.rec('W6').t.wgWhere")) === "camp", wa.text.slice(0, 200));
    await at(96, 17.5, 60);
    await t.give(131, 2); await t.give(130, 2);
    const op0 = await J("TownQuests.opinion()");
    const wig = await talkTo(res("ludmila"), []);
    const wd = await J("({ r: TownQuests.rec('W6'), f: TownQuests.state().flags, w6: TownQuests.w6(), op: TownQuests.opinion() })");
    t.check("...the Wigilia's evening: 'Pierwsza gwiazdka!', Rafał's toast, Marek's 'Wesołych... Świąt.' - the dishes taken, Opinia +10; W6 done",
        /Pierwsza gwiazdka/.test(wig.text) && /Za tych, co zostali/.test(wig.text) && /Wesołych/.test(wig.text) && (await t.count(131)) === 0 && (await t.count(130)) === 0 &&
        wd.op >= op0 + 10 && wd.r.s === "done" && wd.f.w6Wigilia && wd.f.w6WigiliaCamp, { text: wig.text.slice(0, 260), s: wd.r.s, op: [op0, wd.op] });
    t.check("the outcome for Act III / the endings: TownQuests.w6() = { rafal: ally, camp: inside, marekSaved, wigilia: camp, done }",
        wd.w6.rafal === "ally" && wd.w6.camp === "inside" && wd.w6.marekSaved && wd.w6.wigilia === "camp" && wd.w6.done, wd.w6);
    // the Wigilia in the tavern instead (Borgar at the bar)
    await t.loadFrom(6, { quiet: true });
    await at(90, 10, 60);
    await talkTo(res("ludmila"), ["Chodźcie do tawerny"]);
    await t.go(1, 52, 31, 8);
    await at(96, 18.5, 60);
    await t.give(132, 4);
    const tav = await talkTo("$gameMap.event(38)", ["Wigilia dla obozu"]);   // (the counter: <Tavern:meal> - its menu has the quests' topics in any game)
    t.check("...or in the tavern: Borgar's topic 'Wigilia dla obozu' - 'Ty gotowałeś. Ty siadasz pierwszy.' (w6WigiliaTavern)",
        /Ty siadasz pierwszy/.test(tav.text) && (await J("TownQuests.state().flags.w6WigiliaTavern")) && (await J("TownQuests.rec('W6').s")) === "done", tav.text.slice(0, 200));
    t.check("the drought: W6 gives no water", (await J(`(function(){ const W = [129, 138, 166, 167]; const q = TownQuests.Q.W6; return [q.reward].concat(q.steps.map(s => s.reward)).filter(r => r && r.items && r.items.some(([i]) => W.includes(i))).length; })()`)) === 0);

    // ------------------------------------------------------------------ (2026-10-07, the user) Baltazar's "!" for his trade (K16) only when it can happen
    await t.go(8, 12, 42, 8);
    const fd = await J("(function(){ let d = TownQuests.state() ? Tawerna.time.day() + 1 : 100; while (!TownQuests.isFerry(d - 1)) d++; return d; })()");
    await at(fd, 10, 40);
    await t.eval("(function(){ for (const id of TownQuests.FX.k16Trade.GOODS) $gameParty.loseItem($dataItems[id], 99); TownQuests.refreshMarkers(); return 0; })()");
    const noGoods = await J("({ m: TownQuests.markers().kupiec, offer: TownQuests.offerable('K16') })");
    await t.give(103, 2);
    await t.eval("TownQuests.refreshMarkers(); 0");
    const withGoods = await J("TownQuests.markers().kupiec");
    await at(fd + 1, 10, 40);
    await t.eval("TownQuests.refreshMarkers(); 0");
    const notFerry = await J("TownQuests.markers().kupiec");
    t.check("K16: the day after a ferry (10:00) with nothing Baltazar buys - no '!' over him; with 2 mushrooms - '!'; the next day (no ferry) - none",
        noGoods.offer && noGoods.m !== "new" && withGoods === "new" && notFerry !== "new", { fd, noGoods, withGoods, notFerry });
});
