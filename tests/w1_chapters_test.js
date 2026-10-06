// W1 "Woda spod Kruczych Skał", chapters 3-6 (TownQuests.js, user 2026-10-05: Feliks is guilty, the Lord knows nothing). Port: CDP_PORT=9463.
// Ch. 3 Kuba at the market (a: he tells all; b: he pays 5 G a market day; c: he flees for a week - the town suffers), ch. 4 the raven
// grate at the well's bottom (Map118) and Tadek's word about the orangery, ch. 5 the orangery at night (Map024: the guard's round -
// caught = thrown out of the garden, opinion -3, another night; Feliks at the back gate with Kuba's cart 1:30-3:00; the pump on the
// raven hatch, the sluice drawing in the drawer), ch. 6 the big choice: a) revealed with the sołtys on a market day (Feliks arrested -
// gone from the town, the sluice half open: the mill runs, the market well still 2 draws a day, Kuba's night trips end, opinion +15), b) quietly to the Lord
// (a story game: 200 G off grandpa's debt, lordAlly, Kuba resentful), c) Feliks pays 20 G a week, two weeks later his men on Polna
// droga - since 2026-10-06 a real fight (Humans.js): beaten (one spared talks: a witness) = the choice comes back without a second
// deal; beaten by them = robbed and the drawing gone (on to ch. 7); off the road = they wait again 3 days on; d) silence.
// Shots: docs/miasteczko/w1_*.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const rec = () => J("TownQuests.rec('W1')");
    const step = async () => { const r = await rec(); return r ? r.s + ":" + r.step : "none"; };
    const res = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const talk = async (key, picks, o) => { const r = await t.talkTo(res(key), picks || [], o); if (!r.done) await t.finish(); r.text = r.text.replace(/\s+/g, " "); return r; };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const flags = () => J("TownQuests.state().flags");
    const notes = () => J("Journal.data().notes.map(n => n.title)");
    const market = d => Math.ceil(d / 7) * 7;

    await t.newGame({ map: 8, x: 24, y: 37, dir: 8, hour: 9, day: 4, quiet: true, minimap: false });
    await at(4, 9, 30);
    // W1 at chapter 3 (the clues and the night at the pond are town_quests_test's)
    await t.eval("TownQuests.start('W1', 2); 0");
    await t.frames(40);
    const mk = await J("TownQuests.markers()");
    t.check("W1 at chapter 3: a green tick over Kuba at his well (7-14) - he has something to say", (await step()) === "active:2" && mk.woziwoda === "ready", mk);
    await t.saveTo(5);

    // ------------------------------------------------------------------ ch. 3 c) threatened with the sołtys: Kuba flees for a week
    const op0 = await J("TownQuests.opinion()");
    const flee = await talk("woziwoda", ["Powiem o wszystkim sołtysowi."]);
    const fled = await J(`({ gone: TownLife.gone('woziwoda'), hidden: TownLife.state('woziwoda').hidden, f: TownQuests.state().flags.kubaFled, op: TownQuests.opinion() })`);
    t.check("ch. 3 c: threatened with the sołtys, Kuba shouts 'To Feliks!' and flees - gone from the town (hidden), opinion -5, chapter 4 next",
        /To Feliks/.test(flee.text) && fled.gone && fled.hidden && fled.f && fled.op === op0 - 5 && (await step()) === "active:3", Object.assign({ text: flee.text.slice(0, 160) }, fled));
    await at(5, 9);
    const hanka = await talk("piekarka", []);
    t.check("...the next day Hanka remarks on it once ('Kuba uciekł, a przydziału nie ma') - before her greeting", /Kuba uciekł, a przydziału nie ma/.test(hanka.text), hanka.text);
    await at(11, 8);
    const back = await J("({ gone: TownLife.gone('woziwoda'), hidden: TownLife.state('woziwoda').hidden })");
    t.check("...a week later Kuba is back at his well", !back.gone && !back.hidden, back);

    // ------------------------------------------------------------------ ch. 3 b) he pays 5 G every market day
    await t.loadFrom(5, { quiet: true });
    await at(4, 9, 20);
    await talk("woziwoda", ["Płać mi, a będę milczał."]);
    t.check("ch. 3 b: Kuba pays for silence (the flag kubaPays) and complains at the manor (its watch sharper: feliksWarned)",
        (await flags()).kubaPays && (await flags()).feliksWarned && (await step()) === "active:3", await flags());
    await at(market(5), 9);
    const g0 = await t.gold();
    const trib = await talk("woziwoda", []);
    t.check("...on the market day Kuba presses 5 G into the hero's hand ('Udław się')", (await t.gold()) === g0 + 5 && /Udław się/.test(trib.text), trib.text);

    // ------------------------------------------------------------------ ch. 3 a) he tells all
    await t.loadFrom(5, { quiet: true });
    await at(4, 9, 20);
    const tell = await talk("woziwoda", ["Będę milczał. Powiedz mi wszystko."]);
    t.check("ch. 3 a: promised silence, Kuba tells all: Feliks, 3 G a barrel, the sołtys 9 for the ration, the corporal's cut; the Lord knows nothing",
        /Feliks, kamerdyner Lorda/.test(tell.text) && /trzy grosze za beczkę/.test(tell.text) && /Lord myśli/.test(tell.text) && (await step()) === "active:3" && (await notes()).includes("Kuba mówi wszystko"), tell.text.slice(0, 300));

    // ------------------------------------------------------------------ ch. 4: the raven grate at the well's bottom, then Tadek
    await t.give(93, 2);
    await t.locate(26, 34, 4);
    await t.frames(10);
    await t.eval(`(function(){ window.__drvPick = null; return 0; })()`);
    const down = await t.talkTo("$gameMap.event(245)", ["Zejść"], { place: false });
    const onWell = await t.until(t.onMap(118), 20);
    await t.frames(30);
    t.check("ch. 4: 2× Lina, beside the market well: down to the well's bottom (Map118)", onWell, { text: down.text, map: await J("$gameMap.mapId()") });
    const grate = await J("(function(){ const e = $gameMap.event(952); return e ? { x: e.x, y: e.y, page: !!e.page(), mark: (TownQuests.spotWanted('w1_grate') || {}).ready } : null; })()");
    t.check("...the grate's place (event 952 on 'krata_kruk' 5,4) is on, a yellow diamond over it", grate && grate.x === 5 && grate.y === 4 && grate.page && grate.mark, grate);
    await t.locate(5, 5, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "w1_krata.png"));
    const gr = await t.talkTo("$gameMap.event(952)", [], { place: false }); gr.text = gr.text.replace(/\s+/g, " ");
    t.check("...listening at the grate: 'Płynie... ale nie tutaj', the note 'Krata z krukiem' - next: ask Tadek",
        /ale nie tutaj/.test(gr.text) && (await notes()).includes("Krata z krukiem") && (await step()) === "active:4", gr.text.slice(0, 200));
    await t.go(8, 8, 50, 8);
    await at(4, 10, 20);
    const tadek = await talk("kowal", []);
    t.check("...Tadek: 'Tej kraty nie kuł kowal, tylko zakon' - and the same raven on a hatch under the orangery's pump - chapter 5 next",
        /nie kuł kowal, tylko zakon/.test(tadek.text) && /oranżerii/.test(tadek.text) && (await step()) === "active:5", tadek.text.slice(0, 300));

    // ------------------------------------------------------------------ ch. 5: the orangery at night - caught by the guard
    await t.go(24, 1, 15, 6);
    await at(4, 22.5, 30);
    const guard = await J("(function(){ const s = TownLife.state('straznik'); return s && { act: s.act, hidden: s.hidden, sheet: TownLife.eventOf('straznik').characterName() }; })()");
    t.check("the manor's guard (TownLife 'straznik', Map024) walks his round in the garden at night", guard && guard.act === "patrol" && !guard.hidden && guard.sheet === "$Npc_Straznik", guard);
    const spots = await J("[951, 952].map(id => !!$gameMap.event(id) && !!$gameMap.event(id).page())");
    t.check("...the pump's and the drawer's places are on at night", spots.every(Boolean), spots);
    await t.eval("(function(){ Hunting.setSneak(false); TownLife.hold('straznik', true, null); const g = TownLife.eventOf('straznik'); g.locate(10, 24); g.setDirection(2); $gamePlayer.locate(10, 27); return 0; })()");
    const op1 = await J("TownQuests.opinion()");
    const out = await t.until(t.onMap(8), 20);
    await t.frames(20);
    const thrown = await J("({ x: $gamePlayer.x, y: $gamePlayer.y, tried: TownQuests.rec('W1').t.tried, night: TownQuests.nightOf(), op: TownQuests.opinion() })");
    t.check("walking up to him unsneaking: caught ('Stój! Kto tu?!'), thrown out to the town's side of the east gate, opinion -3, not again tonight",
        out && thrown.x === 50 && thrown.y === 51 && thrown.tried === thrown.night && thrown.op === op1 - 3 && (await t.notices()).some(n => /Złapali cię w ogrodzie dworu/.test(n)), thrown);

    // the next night: Feliks at the back gate 1:30-3:00 with Kuba's cart, watched unseen (sneaking)
    await t.go(24, 3, 21, 2);
    await at(6, 2, 30);
    await t.eval("(function(){ Hunting.setSneak(true); TownLife.hold('straznik', true, null); const g = TownLife.eventOf('straznik'); g.locate(19, 19); g.setDirection(8); $gamePlayer.locate(3, 21); return 0; })()");
    await t.frames(40);
    const gate = await J(`(function(){ const e = $gameMap.events().find(x => x.event().name === "Tylna furtka"), f = $gameMap.event(953), k = $gameMap.event(954);
        return { open: $gameSelfSwitches.value([24, e.eventId(), "A"]), through: e.isThrough(), feliks: f && f.page() && [f.x, f.y, f.characterName()], kuba: k && k.page() && [k.x, k.y, k.characterName()] }; })()`);
    t.check("at 2:00 the back gate stands open, Feliks inside it (6,25) and Kuba with his cart outside (3,24)",
        gate.open && gate.through && gate.feliks && gate.feliks[2] === "$Npc_Feliks" && gate.kuba && gate.kuba[2] === "$Npc_Woziwoda", gate);
    const saw = await t.until("!!TownQuests.state().flags.w1SawFeliks", 30, 300);
    await t.frames(60);
    await t.eval("$gameMap.setDisplayPos(0, 15); 0");
    await t.frames(20);
    await t.shot(path.join(SHOTS, "w1_furtka_noc.png"));
    t.check("...watched from the forest strip, sneaking, unseen: the scene in the hero's bubbles and the note 'Feliks przy furtce'",
        saw && (await notes()).includes("Feliks przy furtce") && (await J("TownQuests.rec('W1').t.tried")) !== (await J("TownQuests.nightOf()")), await J("SpeechBubbles.log.slice(-3)"));
    // after 3:00 the gate shuts; the pump and the drawer
    await at(6, 3.3, 30);
    const shut = await J(`(function(){ const e = $gameMap.events().find(x => x.event().name === "Tylna furtka"); return { open: $gameSelfSwitches.value([24, e.eventId(), "A"]), feliks: !!$gameMap.event(953).page() }; })()`);
    t.check("after 3:00 the gate is shut again and Feliks gone", !shut.open && !shut.feliks, shut);
    await t.locate(7, 27, 8);
    const pump = await t.talkTo("$gameMap.event(951)", [], { place: false }); pump.text = pump.text.replace(/\s+/g, " ");
    const drawer = await t.talkTo("$gameMap.event(952)", [], { place: false }); drawer.text = drawer.text.replace(/\s+/g, " ");
    const w5 = await J("({ r: TownQuests.rec('W1'), v: TownQuests.vcount('rysunek'), clue: !!TownQuests.state().clues.w1_hatch })");
    t.check("the pump stands on the raven hatch ('Dwór stoi na kanale zakonu'), the drawer holds the sluice drawing signed 'F.' - evidence; chapter 6 next",
        /kanale zakonu/.test(pump.text) && /zasuwa na dworze/.test(drawer.text) && w5.v === 1 && w5.clue && w5.r.step === 6 && (await notes()).includes("Oranżeria nocą"), { pump: pump.text.slice(0, 120), w5 });
    await t.eval("TownLife.hold('straznik', false); Hunting.setSneak(false); 0");
    await t.go(8, 36, 40, 8);
    await at(6, 9, 20);
    await t.saveTo(6);

    // ------------------------------------------------------------------ ch. 6 a) revealed with the sołtys on a market day
    const dm = market(7);
    await at(dm, 9, 30);
    const op2 = await J("TownQuests.opinion()");
    const rev = await talk("soltys", ["Ujawnijmy to."]);
    await t.frames(20);
    const a = await J(`({ r: TownQuests.rec('W1'), f: TownQuests.state().flags, feliks: TownLife.gone('feliks'), fh: TownLife.state('feliks').hidden, op: TownQuests.opinion(), v: TownQuests.vcount('rysunek'),
        kuba2: TownLife.entryAt(TownLife.RESIDENTS.find(r => r.key === 'woziwoda'), 2).where, well: Farming.rationOf($gameMap.events().find(e => e.event().name === 'Studnia miejska')).max })`);
    t.check("ch. 6 a: on the market day the sołtys reads the drawing to the town; the Lord did not know - Feliks arrested (gone from the town)",
        /Nie wiedziałem/.test(rev.text) && a.feliks && a.fh && a.f.w1Revealed && a.v === 0, { text: rev.text.slice(0, 200), a });
    t.check("...the sluice half open: the mill runs, the market well still gives 2 draws a day (the user: 'Dalej 2 dziennie'), Kuba's night trips end; opinion +15; W1 waits for Act II",
        a.well === 2 && a.f.millRuns && a.f.sluiceHalf && a.kuba2 !== "staw" && a.op === Math.min(100, op2 + 15) && a.r.step === 9 && /Akcie II/.test(await J("TownQuests.Q.W1.steps[9].text")), a);
    const wit = await talk("kapral", []);
    t.check("...Wit (degraded) remarks on it once", /Już nie kapral/.test(wit.text), wit.text);

    // ------------------------------------------------------------------ ch. 6 d) silence
    await t.loadFrom(6, { quiet: true });
    await at(9, 9, 20);
    const sil = await talk("soltys", ["Nic nie mam."]);
    t.check("ch. 6 d: 'Nic nie mam' to the sołtys - silence: nothing changes (the drawing kept), W1 waits for Act II",
        (await flags()).w1Silent && (await J("TownQuests.vcount('rysunek')")) === 1 && (await step()) === "active:9" && !(await J("TownLife.gone('feliks')")), sil.text.slice(0, 120));

    // ------------------------------------------------------------------ ch. 6 c) Feliks pays - then his men on Polna droga
    await t.loadFrom(6, { quiet: true });
    await at(8, 8, 20);
    const g1 = await t.gold();
    const deal = await talk("feliks", ["Dwadzieścia groszy na tydzień"]);
    t.check("ch. 6 c: Feliks pays 20 G at once for silence ('uważa na drogach') - the next step: his weekly money",
        (await t.gold()) === g1 + 20 && /na drogach/.test(deal.text) && (await step()) === "active:7", deal.text.slice(0, 200));
    await at(15, 8, 20);
    const g2 = await t.gold();
    await talk("feliks", []);
    t.check("...a week later another 20 G at the stalls", (await t.gold()) === g2 + 20);
    await t.saveTo(8);
    // two weeks after the deal, on Polna droga: Feliks's men (Humans.js) - a real fight; won, one of them spared
    const band = async () => t.until("!!(window.Humans && Humans.band('w1Feliks'))", 20, 300);
    const toRoad = async () => { await t.go(22, 12, 2, 2, { calm: false }); return band(); };   // (no calm(): QUIET would clear the men)
    await at(22, 10, 20);
    await t.gold(100);
    const came = await toRoad();
    await t.frames(30);
    const b1 = await J("(function(){ const b = Humans.band('w1Feliks'); return { n: b.members.length, kinds: b.members.map(h => h._kind).sort(), engaged: b.members.every(h => h._engaged), name: b.members[0].name(), knife: !!Humans.KINDS.knifer, said: SpeechBubbles.log.slice(-8) }; })()");
    t.check("...two weeks after the deal, on Polna droga: Feliks's men - a real fight (Humans.ambush, tag w1Feliks): a club, a knife (or two clubs) and an archer (Feliks paid 40 G), 'Pozdrowienia od kamerdynera!'",
        came && b1.n === 3 && b1.kinds.join() === (b1.knife ? "archer,bandit,knifer" : "archer,bandit,bandit") && b1.engaged && /Feliksa/.test(b1.name) && b1.said.some(l => /Pozdrowienia od kamerdynera/.test(l)), b1);
    await t.eval("(function(){ const m = Humans.band('w1Feliks').members.slice(); Humans.surrender(m[0]); Humans.decide(m[0]._hid, 'spare'); for (const h of m.slice(1)) Humans.kill(h, 'melee'); return 0; })()");
    await t.frames(30);
    const won = await J("({ r: TownQuests.rec('W1'), f: TownQuests.state().flags, v: TownQuests.vcount('rysunek') })");
    const wonNotes = await notes();
    t.check("...beaten (one spared - he blurts out who pays them): Feliks broke the deal, the drawing is still the hero's - the choice of chapter 6 comes back, with a witness",
        won.f.w1AmbushWon && won.f.w1Confession && won.f.feliksBroke && won.v === 1 && won.r.step === 6 && wonNotes.includes("Napad na Polnej drodze") && wonNotes.includes("Człowiek Feliksa mówi"), won);
    await t.go(8, 36, 40, 8);
    await at(23, 8, 30);
    const g3 = await t.gold();
    const fel = await talk("feliks", []);
    t.check("...the next day Feliks nearly drops his basket (a remark, once): no money any more, no second deal", /upuszcza koszyka/.test(fel.text) && (await t.gold()) === g3 && !fel.choices.length, { text: fel.text.slice(0, 160), choices: fel.choices });
    await at(28, 9, 30);
    const op4 = await J("TownQuests.opinion()");
    const rev2 = await talk("soltys", ["Ujawnijmy to."]);
    t.check("...on the market day the drawing revealed with the sołtys - the witness said too: opinion +18, on to chapter 7",
        /przyznał, kto im płaci/.test(rev2.text) && (await J("TownQuests.opinion()")) === Math.min(100, op4 + 18) && (await step()) === "active:9", rev2.text.slice(0, 240));

    // ...or beaten by them: robbed (Humans.js's rule) - and the drawing taken
    await t.loadFrom(8, { quiet: true });
    await at(22, 10, 20);
    await t.gold(100);
    await toRoad();
    await t.eval("(function(){ Humans.beatenBy(Humans.band('w1Feliks').members[0]); return 0; })()");
    const robbed = await t.until("!!TownQuests.state().flags.w1Robbed", 20, 300);
    await t.frames(40);
    const lost = await J("({ r: TownQuests.rec('W1'), f: TownQuests.state().flags, v: TownQuests.vcount('rysunek'), gold: $gameParty.gold() })");
    t.check("...or beaten by them: robbed as men rob (40% of the gold), the drawing taken too - no evidence: on to chapter 7 (Act II)",
        robbed && lost.gold === 60 && lost.v === 0 && lost.f.w1Ambushed && lost.f.feliksBroke && lost.r.step === 9 && (await notes()).includes("Napad na Polnej drodze"), lost);

    // ...or off the road mid-fight: they wait for him again
    await t.loadFrom(8, { quiet: true });
    await at(22, 10, 20);
    await toRoad();
    await t.go(8, 36, 40, 8);
    await t.frames(30);
    const away = await J("({ r: TownQuests.rec('W1'), f: TownQuests.state().flags, text: TownQuests.Q.W1.steps[8].text })");
    t.check("...or away from the road mid-fight: he got away - Feliks pays no more, his men wait again three days on",
        away.r.step === 8 && away.r.t.ambAt === 25 && !away.r.t.amb && away.f.feliksBroke && /będą czekać znowu/.test(away.text), away.r);
    await at(25, 10, 20);
    const again = await toRoad();
    t.check("...three days later on Polna droga they are there again", again && (await J("TownQuests.rec('W1').t.amb")) === 25);
    await t.eval("Humans.clear('w1Feliks'); 0");
    await t.go(8, 36, 40, 8);

    // ------------------------------------------------------------------ ch. 6 b) quietly to the Lord (a story game: the debt)
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await at(9, 9, 30);
    await t.eval("TownQuests.start('W1', 6); TownQuests.state().v.rysunek = 1; 0");
    await t.go(24, 20, 15, 8);
    await at(9, 9, 30);
    const paid0 = await J("Story.state().paid"), gl = await t.gold();
    const lordMark = await J("TownQuests.markers().lord");
    const lord = await t.talkTo("$gameMap.event(902)", ["Pokaż Lordowi", "Odejdź"]); lord.text = lord.text.replace(/\s+/g, " ");
    const b = await J("({ paid: Story.state().paid, f: TownQuests.state().flags, feliks: TownLife.gone('feliks'), r: TownQuests.rec('W1'), v: TownQuests.vcount('rysunek') })");
    t.check("ch. 6 b: the Lord (a tick over him) is shown the drawing - he did not know; Feliks disappears quietly, 200 G off grandpa's debt, the Lord an ally",
        lordMark === "ready" && /pismo Feliksa/.test(lord.text) && b.paid === paid0 + 200 && (await t.gold()) === gl && b.f.lordAlly && b.feliks && b.v === 0 && b.r.step === 9,
        { text: lord.text.slice(0, 200), b, paid0 });
    await t.go(8, 23, 36, 8);
    await at(10, 9, 20);
    const kuba = await talk("woziwoda", []);
    t.check("...Kuba, without his trade, holds it against the hero (once)", /nie mam towaru/.test(kuba.text), kuba.text);
});
