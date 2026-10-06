// W8 "Żelazna Pięść", chapters 2-6 (TownQuests.js, 2026-10-06) on the mountain maps (Map013 "Góry i kamieniołom", Map014 "Jaskinia",
// Map120 "Osada Milczących" - the maps agent's "Miejsce: ..." markers). Port: CDP_PORT=9463.
// ch2: Grum hires the hero (tavern) - at dawn by the way into the mountains he checks the pack (food for the day, water in the skin,
// herbs) - missed dawn = hire again; the old quarry the same day: 50 G. ch3: the diggers' camp, Marek at the wall, Grum pales.
// ch4: the order "Świadków nie zostawiać" - Grum drunk (mead), the thin wall of a rented room (22-24), or the commander's crate at
// night, sneaking. ch5 (Act II): the Silent's gate opens (switch 16), Grum at their circle. ch6: two of three (Marek, the chronicles,
// the arm-wrestling "na honor" in the tavern) - Grum the hero's (switch 15: the tunnel to floor 50); or the faction's money; or the
// fight at the tunnel's mouth (Humans.js mercenary "Grum"): killed / spared = gone from the tavern for good, beaten by him = robbed
// and the diggers break through.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "gory");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const talkTo = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 25 }, o || {})); if (!r.done) await t.finish(); return flat(r); };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const step = async () => { const r = await J("TownQuests.rec('W8')"); return r ? r.s + ":" + r.step : "none"; };
    const notes = () => J("Journal.data().notes.map(n => n.title)");
    const spot = id => J(`(function(){ const e = $gameMap.event(${id}); return e && e.page() ? { x: e.x, y: e.y, img: e.characterName(), mark: !!(TownQuests.spotWanted(e.event().note.replace(/.*<TownQuests:([^>]+)>.*/, "$1")) || {}).ready } : null; })()`);
    const grum = "$gameMap.event(3)";   // (Map001: Grum)

    await t.newGame({ map: 1, x: 92, y: 33, dir: 6, hour: 18, day: 20, quiet: true, minimap: false });
    await at(20, 18, 30);
    await t.eval("(function(){ TownQuests.start('W8', 1); return 0; })()");
    await t.frames(40);
    // ------------------------------------------------------------------ ch2: hired; the dawn missed
    t.check("W8 at chapter 2: a tick over Grum", (await J("TownQuests.markers().grum")) === "ready");
    const hire = await talkTo(grum, ["Jutro o świcie", "Bywaj"]);
    const h = await J("TownQuests.rec('W8')");
    t.check("ch2: Grum hires the hero - 50 G, at dawn by the way into the mountains: food, water in the skin, herbs - 'Jutro o świcie.'",
        /Pięćdziesiąt groszy/.test(hire.text) && /wodę w bukłaku/.test(hire.text) && h.step === 2 && h.t.trip === 21 && /Dzień 21, o świcie/.test(await J("TownQuests.journalOps({ quest: TownQuests.Q.W8 }).map(o => o.text || '').join(' | ')")), { step: h.step, trip: h.t.trip, text: hire.text.slice(0, 200) });
    await t.saveTo(5);
    await at(21, 9.5, 40);
    t.check("...the dawn missed (after 9:00): back to the hire - talk to Grum again", (await step()) === "active:1");

    // ------------------------------------------------------------------ ch2: the dawn at the way into the mountains
    await t.loadFrom(5, { quiet: true });
    t.check("to the mountains (Map013 from Leśna droga's side)", await t.go(13, 2, 39, 6));
    await at(21, 5, 40);
    const s1 = await spot(951);
    t.check("at dawn Grum (his sheet) waits by the marker 'grum_przewodnik_start' (4,38), a yellow diamond over him", s1 && s1.x === 4 && s1.y === 38 && s1.img === "$Npc_Grum" && s1.mark, s1);
    await t.eval("(function(){ for (const it of $gameParty.items()) if (/<Food:/.test(it.note || '')) $gameParty.loseItem(it, 99); $gameParty.loseItem($dataItems[129], 9); for (const id of [149, 150, 152]) $gameParty.loseItem($dataItems[id], 99); return 0; })()");
    await t.popups({ clear: true });
    const bare = await talkTo("$gameMap.event(951)", [], { place: false });
    const pops = await t.popups();
    t.check("...with nothing in the bag: 'Bez jedzenia, wody i ziół w góry nie idę' - what is missing pops up over the hero",
        /nie idę/.test(bare.text) && pops.some(p => /Jedzenie na cały dzień/.test(p)) && (await step()) === "active:2", { text: bare.text.slice(0, 160), pops });
    await t.eval("(function(){ $gameParty.gainItem($dataItems[83], 2); $gameParty.gainItem($dataItems[129], 1); Needs.state().skin = 3; $gameParty.gainItem($dataItems[150], 1); return 0; })()");
    const go = await talkTo("$gameMap.event(951)", [], { place: false });
    t.check("...food, a full skin, yarrow: 'Prowadź.' - on to the quarry", /Prowadź/.test(go.text) && (await step()) === "active:3", go.text.slice(0, 200));
    await t.frames(40);
    const s2 = await spot(952);
    t.check("Grum's picture by the raven carved in the quarry wall (marker 'kamieniolom_znak' + 1: 41,18)", s2 && s2.x === 41 && s2.y === 18, s2);
    await t.locate(40, 18, 6);
    await at(21, 12, 30);
    await t.shot(path.join(SHOTS, "w8_kamieniolom_grum.png"));
    const g0 = await t.gold();
    const qy = await talkTo("$gameMap.event(952)", [], { place: false });
    t.check("...at the quarry the same day: the raven, the stone of the fortress and the manor, a fire in the cave above - 50 G, chapter 3",
        /kruka wykutego/.test(qy.text) && /Na każdym dziesiątym kruk/.test(qy.text) && (await t.gold()) === g0 + 50 && (await step()) === "active:4" && (await notes()).includes("Stary kamieniołom"), qy.text.slice(0, 240));

    // ------------------------------------------------------------------ ch3: the diggers' camp
    t.check("into the cave (Map014)", await t.go(14, 20, 27, 8));
    await at(21, 14, 30);
    const s3 = await spot(951);
    t.check("Grum's picture beside Marek's niche (marker 'marek' -2,+1: 28,6); Marek himself stands at the wall (event 23)",
        s3 && s3.x === 28 && s3.y === 6 && (await J("$gameMap.event(23).characterName()")) === "$Npc_Marek", s3);
    await t.locate(28, 7, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "w8_oboz_marek.png"));
    const camp = await talkTo("$gameMap.event(951)", [], { place: false });
    const c3 = await J("({ r: TownQuests.rec('W8'), f: TownQuests.state().flags.w8Marek })");
    t.check("...Marek stares at the rock, 'Dotknął czegoś w skale i przestał mówić' - Grum pales; chapter 4 (the letter in two days)",
        /Grum blednie/.test(camp.text) && c3.f && c3.r.step === 5 && c3.r.t.letter === 23 && (await notes()).includes("Obóz kopaczy"), { text: camp.text.slice(0, 200), letter: c3.r.t.letter });
    await t.saveTo(6);

    // ------------------------------------------------------------------ ch4: the letter - drunk / the wall / the crate
    await t.go(1, 92, 33, 6);
    await at(22, 19, 30);
    const early = await J("TownQuests.regularTopics('grum').map(x => x.label)");
    t.check("ch4: before the letter's day Grum has no drink topic", !early.some(l => /Napij się/.test(l)), early);
    await at(23, 19, 30);
    await t.give(137, 1);
    const drunk = await talkTo(grum, ["Napij się", "Bywaj"]);
    t.check("...from day 23, evening: 'Napij się ze mną' with a jug of mead - Grum drunk shows the order: 'Świadków nie zostawiać' (the mead taken)",
        /Świadków nie zostawiać/.test(drunk.text) && (await t.count(137)) === 0 && (await J("TownQuests.state().flags.w8Letter_drunk")) && (await step()) === "active:6" && (await notes()).includes("Rozkaz dla Gruma"), drunk.text.slice(0, 260));
    await t.loadFrom(6, { quiet: true });
    await t.go(25, 39, 40, 8, { calm: false });
    await at(23, 22.2, 20);
    await t.eval("(function(){ TavernLife.state().rent = { room: 1, name: 'Izdebka', price: 8, day: 23, until: 24 * 24 + 9, slept: false }; return 0; })()");
    const wall = await t.until("TownQuests.rec('W8').step === 6", 20, 300);
    await t.until("SpeechBubbles.log.some(l => /Wszyscy jesteśmy świadkami/.test(l))", 30, 300);
    t.check("...or the thin wall: a room rented tonight, 22-24 - Grum and Baltazar through the wall ('Wszyscy jesteśmy świadkami')",
        wall && (await J("TownQuests.state().flags.w8Letter_wall")) && (await J("SpeechBubbles.log.slice(-4)")).some(l => /Baltazar|świadkami|Świadków/.test(l)), await J("SpeechBubbles.log.slice(-4)"));
    await t.loadFrom(6, { quiet: true });
    await t.go(14, 27, 12, 8, { calm: false });
    await at(23, 14, 20);
    await t.popups({ clear: true });
    await t.locate(27, 11, 8);
    await t.talkTo("$gameMap.event(952)", [], { place: false });
    const dayPop = await t.popups();
    await at(23, 23, 20);
    await t.eval("Hunting.setSneak(true); 0");
    await t.locate(27, 11, 8);
    const crate = await talkTo("$gameMap.event(952)", [], { place: false });
    await t.eval("Hunting.setSneak(false); 0");
    t.check("...or the commander's crate in the camp (marker 'list_kryjowka'): by day 'Kopacze nie śpią'; at night, sneaking - the copy of the order",
        dayPop.some(p => /Kopacze nie śpią/.test(p)) && /Kopia rozkazu/.test(crate.text) && (await J("TownQuests.state().flags.w8Letter_crate")) && (await step()) === "active:6", { dayPop, text: crate.text.slice(0, 200) });

    // ------------------------------------------------------------------ ch5: the Silent's valley (Act II - no story game here: open)
    await t.go(13, 6, 6, 8, { calm: false });
    await at(24, 10, 30);
    const s5 = await spot(953);
    t.check("ch5: Grum before the Silent's gate (marker 'osada_brama' +1: 7,4); the gate shut (switch 16 off)", s5 && s5.x === 7 && s5.y === 4 && !(await J("$gameSwitches.value(16)")), s5);
    await t.locate(6, 4, 6);
    const gate = await talkTo("$gameMap.event(953)", [], { place: false });
    t.check("...the gate opens from inside (switch 16) - 'Wpuszczają nas'", /Wpuszczają nas/.test(gate.text) && (await J("$gameSwitches.value(16)")) && !!(await J("TownQuests.rec('W8').t.gate")), gate.text.slice(0, 200));
    t.check("into the Osada (Map120) through the ravine", await t.go(120, 20, 30, 8));
    await at(24, 11, 30);
    const s6 = await spot(951);
    t.check("...Grum stands by their circle (marker 'osada_grum': 21,25)", s6 && s6.x === 21 && s6.y === 25, s6);
    await t.locate(20, 25, 6);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "w8_osada_grum.png"));
    const os = await talkTo("$gameMap.event(951)", [], { place: false });
    t.check("...'Ci mają wszystko. Tylko nic już dla nich nie waży' - the note 'Osada Milczących', chapter 6",
        /nic już dla nich nie waży/.test(os.text) && (await step()) === "active:7" && (await notes()).includes("Osada Milczących"), os.text.slice(0, 200));
    await t.go(1, 92, 33, 6);
    await at(25, 19, 30);
    await t.saveTo(7);

    // ------------------------------------------------------------------ ch6: the arm-wrestling "na honor" + the chronicles = Grum the hero's
    const vars = await J("TownQuests.journalOps({ quest: TownQuests.Q.W8 }).map(o => o.text || '').join(' | ')");
    t.check("ch6 in the journal: two of three - Marek (jeszcze nie), the chronicles (nie ma), the honour bout (jeszcze nie)", /Marka \(jeszcze nie\)/.test(vars) && /kronik zakonu \(nie ma\)/.test(vars) && /na honor” \(jeszcze nie\)/.test(vars), vars.slice(0, 400));
    await t.eval(`(function(){ Combat.hero().attr.str = 60; Combat.hero().attr.con = 60; $gameSystem.setStamina && $gameSystem.setStamina(100); TownQuests.armOpts = { seed: 11, turbo: 6 }; TavernLife.state().arm.level = 3;
        window.__bt = 0; TavernLife.onTick = function(scene) { const I = Input._currentState; I.ok = false; const s = scene.state(); window.__bt++;
            if (s.phase === "card" || s.phase === "summary") { if (window.__bt % 8 === 0) I.ok = true; return; }
            if (s.phase === "pull") I.ok = s.n < (s.lo + s.hi) / 2 - 0.015; }; return 0; })()`);
    const hon = await talkTo(grum, ["Musimy pogadać", "Siłujmy się", "Bywaj"], { secs: 120 });
    await t.until("SceneManager._scene instanceof Scene_Map && !TavernLife.gameState()", 30);
    await t.dismiss();
    await t.frames(30);
    const hr = await J("({ f: TownQuests.state().flags.w8Honour, last: TavernLife.lastResult && { won: TavernLife.lastResult.won, rival: TavernLife.lastResult.rival } })");
    t.check("...'Musimy pogadać. O tunelu.' - Grum names the three; 'Siłujmy się - na honor' at the tavern: TavernLife's arm-wrestling (no stake) - won",
        /Dwie z trzech/.test(hon.text) && hr.f && hr.last && hr.last.won, Object.assign({ text: hon.text.slice(0, 200) }, hr));
    await t.eval("(function(){ TownQuests.state().v.kroniki = 1; TownQuests.state().flags.chroniclesTaken = 25; return 0; })()");
    const ally = await talkTo(grum, ["Musimy pogadać", "Stań po mojej stronie", "Bywaj"]);
    const al = await J("({ r: TownQuests.rec('W8'), f: TownQuests.state().flags, sw15: $gameSwitches.value(15) })");
    t.check("...with the chronicles too (two of three): 'Stań po mojej stronie' - he tears the letter; W8 done, grumAlly, the diggers' tunnel opens (switch 15)",
        /drze go na pół/.test(ally.text) && al.r.s === "done" && al.f.grumAlly && al.sw15 && (await notes()).includes("Grum po mojej stronie"), al);

    // ...or the paymasters' money
    await t.loadFrom(7, { quiet: true });
    await at(25, 19, 20);
    const g1 = await t.gold();
    const fac = await talkTo(grum, ["Musimy pogadać", "Pracuję dla", "Bywaj"]);
    t.check("...or 'Pracuję dla twoich mocodawców': 100 G, w8Faction, the tunnel opens", /Sto groszy zadatku/.test(fac.text) && (await t.gold()) === g1 + 100 && (await J("TownQuests.state().flags.w8Faction")) && (await J("$gameSwitches.value(15)")), fac.text.slice(0, 160));

    // ...or the fight at the tunnel's mouth
    await t.loadFrom(7, { quiet: true });
    await at(25, 19, 20);
    await talkTo(grum, ["Musimy pogadać", "Nie pozwolę", "Bywaj"]);
    t.check("...or 'Nie pozwolę ci zejść do Serca': Grum waits at the tunnel's mouth in the cave", (await step()) === "active:8");
    await t.saveTo(8);
    const toTunnel = async () => { await t.go(14, 12, 13, 4, { calm: false }); return t.until("!!(window.Humans && Humans.band('w8Grum'))", 20, 300); };
    const came = await toTunnel();
    const gm = await J("(function(){ const h = Humans.band('w8Grum').members[0]; return { kind: h._kind, name: h.name(), engaged: h._engaged, x: h.x, y: h.y }; })()");
    t.check("at the tunnel's mouth (marker 'tunel_wejscie' 8,13): Grum - Humans.js's mercenary named 'Grum', at once in the fight",
        came && gm.kind === "mercenary" && gm.name === "Grum" && gm.engaged, gm);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "w8_walka_grum.png"));
    await t.eval("(function(){ const h = Humans.band('w8Grum').members[0]; Humans.surrender(h); Humans.decide(h._hid, 'spare'); return 0; })()");
    await t.frames(30);
    const sp = await J("({ r: TownQuests.rec('W8'), f: TownQuests.state().flags, sw15: $gameSwitches.value(15), away: TownQuests.grumAway() })");
    t.check("...beaten, he kneels - spared: he leaves on the ferry (grumGone); W8 done; the tunnel stays shut", sp.r.s === "done" && sp.f.grumGone && !sp.f.grumDead && !sp.sw15 && sp.away && (await notes()).includes("Grum pokonany"), sp);
    await t.go(1, 92, 33, 6);
    await at(26, 19, 30);
    const gone = await J("({ npc: !!TavernLife.npc('grum'), erased: $gameMap.event(3)._erased, dice: TavernDice.present(19, 26).map(p => p.key) })");
    t.check("...and in the tavern Grum is gone for good: his event erased, no talk, not at the dice tables", !gone.npc && gone.erased && !gone.dice.includes("grum"), gone);
    // killed
    await t.loadFrom(8, { quiet: true });
    await toTunnel();
    await t.eval("(function(){ Humans.kill(Humans.band('w8Grum').members[0], 'melee'); return 0; })()");
    await t.frames(30);
    t.check("...or killed: grumDead ('Grum nie żyje')", (await J("TownQuests.state().flags.grumDead")) && (await notes()).includes("Grum nie żyje"));
    // the hero beaten
    await t.loadFrom(8, { quiet: true });
    await toTunnel();
    await t.eval("(function(){ Humans.beatenBy(Humans.band('w8Grum').members[0]); return 0; })()");
    const lost = await t.until("TownQuests.rec('W8').s === 'done'", 20, 300);
    await t.frames(40);
    const lo = await J("({ f: TownQuests.state().flags, sw15: $gameSwitches.value(15), away: TownQuests.grumAway() })");
    t.check("...or Grum beats the hero: robbed (Humans.js's rule), 'Nie zabijam chłopców' - the diggers break through (switch 15), Grum stays in the tavern",
        lost && lo.f.w8Lost && lo.sw15 && !lo.away && (await notes()).includes("Grum wygrał"), lo);
    t.check("the drought: W8 gives no water", (await J(`(function(){ const W = [129, 138, 166, 167]; const q = TownQuests.Q.W8; return [q.reward].concat(q.steps.map(s => s.reward)).filter(r => r && r.items && r.items.some(([i]) => W.includes(i))).length; })()`)) === 0);
});
