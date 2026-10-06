// Act II's quest chapters (TownQuests.js, 2026-10-06). Port: CDP_PORT=9463.
// W1 rozdz. 7 "Cysterna zakonu": the main sluice on underground floor 30 (Underground.js sends "undergroundSluice") - then the bell's
// "water" signal, four and two, rung by the hero (the bell mini-game, six strikes) or by Ambroży: the market well fills, but the
// sołtys keeps it under lock - for the hero still its 2 draws a day (the drought rule) -, the mill runs, opinion +20, remarks.
// W9 rozdz. 6 "Warstwa Prawdy": the truths read deep down (Underground.truths()) told or kept up top - a resident asks it before his
// talk (once a day), a tavern regular has it as a topic, Borgar at the bar, grandpa (and Mruczek's) and the Lord before their story
// talk; Feliks gone = it cannot be told; what follows (opinion, trust, a remark the next day). The darts' carter Wiesiek: his own bust.
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const talkTo = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 25 }, o || {})); if (!r.done) await t.finish(); return flat(r); };
    const res = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const talk = (key, picks, o) => talkTo(res(key), picks, o);
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const step = async id => { const r = await J(`TownQuests.rec(${JSON.stringify(id)})`); return r ? r.s + ":" + r.step : "none"; };
    const flags = () => J("TownQuests.state().flags");
    const notes = () => J("Journal.data().notes.map(n => n.title)");
    const opinion = () => J("TownQuests.opinion()");

    // ================================================================== W1 rozdz. 7: the cistern's sluice and the bell
    await t.newGame({ map: 8, x: 24, y: 37, dir: 8, hour: 9, day: 40, quiet: true, minimap: false });
    await at(40, 9, 30);
    await t.eval("(function(){ TownQuests.start('W1', 9); TownQuests.state().flags.w1Silent = 40; return 0; })()");
    const c7 = await J("({ r: TownQuests.rec('W1'), text: TownQuests.Q.W1.steps[9].text, head: TownQuests.journalOps({ quest: TownQuests.Q.W1 }).filter(o => o.k === 'h').map(o => o.text) })");
    t.check("W1 after rozdz. 6 (silence): Rozdział 7 - down to the Order's cistern (Wielka cysterna, floor 30), find its main sluice",
        c7.r.step === 9 && /Wielkiej cysternie \(piętro 30\)/.test(c7.text) && c7.head.includes("Rozdział 7"), c7);
    await t.eval("Tawerna.emit('undergroundSluice', { floor: 30 }); 0");
    await t.until("SpeechBubbles.log.some(l => /CZTERY I DWA/.test(l))", 10, 200);
    const s1 = await J("({ r: TownQuests.rec('W1'), f: TownQuests.state().flags.sluiceFound, text: TownQuests.Q.W1.steps[10].text, log: SpeechBubbles.log.slice(-3) })");
    t.check("...the sluice read (the bus 'undergroundSluice'): 'CZTERY I DWA' in the hero's thoughts - next, Ambroży and the bell",
        s1.r.step === 10 && !!s1.f && /Ambrożym/.test(s1.text), s1);
    await t.eval("Tawerna.emit('undergroundSluice', { floor: 30 }); 0");
    t.check("...looking at the sluice again changes nothing", (await step("W1")) === "active:10");
    await at(40, 10, 60);
    await t.until("!TownLife.state('dzwonnik').hidden", 20, 300);
    t.check("a tick over Ambroży (he has something to say)", (await J("TownQuests.markers().dzwonnik")) === "ready");
    await t.saveTo(5);
    const well = "Farming.rationOf($gameMap.events().find(e => e.event().name === 'Studnia miejska')).max";
    const well0 = await J(well), op0 = await opinion();
    await t.eval("TownQuests.bellOpts = { bot: 'target', turbo: 8 }; 0");
    const ring = await talk("dzwonnik", ["Zadzwonię sam."], { secs: 60 });
    await t.until("TownQuests.rec('W1').s === 'done' && !Tawerna.ui.running && SceneManager._scene instanceof Scene_Map", 60, 300);
    await t.dismiss();
    await t.frames(30);
    const w1 = await J(`({ r: TownQuests.rec('W1'), f: TownQuests.state().flags, well: ${well}, op: TownQuests.opinion(), last: Tawerna.ui.lastResult, bells: TownQuests.state().bells.map(b => b.sig), notes: Journal.data().notes.map(n => n.title) })`);
    t.check("Ambroży: 'Cztery i dwa? ... Woda idzie' - the hero rings six strikes in the bell mini-game",
        /Cztery i dwa\?/.test(ring.text) && /Woda idzie/.test(ring.text) && w1.last && w1.last.strikes === 6, { text: ring.text.slice(0, 200), last: w1.last });
    t.check("...the water goes under the market: W1 done, the cistern open, the mill runs, opinion +20, the note 'Zasuwa główna otwarta', the signal 4+2 noted",
        w1.r.s === "done" && w1.f.cisternOpen && w1.f.millRuns && w1.f.sluiceHalf && w1.op === Math.min(100, op0 + 20) && w1.notes.includes("Zasuwa główna otwarta") && w1.bells.includes("4+2"), w1);
    t.check("...the drought stays: the market well still gives the hero 2 draws a day (the author: as it is after W1)", well0 === 2 && w1.well === 2, { well0, well: w1.well });
    const sol = await talk("soltys", []);
    t.check("...the sołtys (a remark, once): the well full - under his lock, rations for the houses; the hero keeps his two buckets",
        /Studnia pełna/.test(sol.text) && /dwa wiadra na dzień/.test(sol.text), sol.text.slice(0, 240));
    const kuba = await talk("woziwoda", []);
    t.check("...Kuba carries the ration now - an honest grosz", /Rozwożę racje/.test(kuba.text), kuba.text.slice(0, 160));
    // ...or Ambroży rings it himself
    await t.loadFrom(5, { quiet: true });
    await at(40, 10, 30);
    await t.until("!TownLife.state('dzwonnik').hidden", 20, 300);
    const op1 = await opinion();
    const him = await talk("dzwonnik", ["Zadzwoń ty"]);
    await t.frames(20);
    const w1b = await J("({ r: TownQuests.rec('W1'), f: TownQuests.state().flags, op: TownQuests.opinion(), queue: TownQuests.bellQueue().length })");
    t.check("...or 'Zadzwoń ty, Ambroży': he rings four and two himself (the bell's strokes queued) - the same end of W1",
        /Słuchaj/.test(him.text) && w1b.r.s === "done" && w1b.f.cisternOpen && w1b.op === Math.min(100, op1 + 20) && w1b.queue > 0, w1b);

    // ================================================================== W9 rozdz. 6: the truths told or kept (a story game: grandpa, the Lord, Borgar)
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await at(40, 9, 30);
    // (Borgar's menu needs the job; Feliks sent away by W1; Melia's K22 offer out of the way of her menu)
    await t.eval("(function(){ Story.state().flags.hired = true; TownLife.setGone('feliks', true); TownQuests.state().q.K22 = { s: 'refused', step: 0, day: 1, sday: 1, end: 1, t: { done: {} }, times: 0 }; return 0; })()");
    t.check("W9 waits for a truth of the Truth Layer", (await step("W9")) === "none");
    await t.eval(`(function(){ const tr = Underground.state().truths;
        for (const [k, who] of [["76", "borgar"], ["77", "melia"], ["81", "piekarka"], ["82", "woziwoda"], ["83", "feliks"], ["86", "dziadek"], ["89", "lord"], ["95", "kot"], ["96", "hero"]]) tr[k] = { who, floor: Number(k) };
        Tawerna.emit("undergroundTruth", { key: "81", who: "piekarka", name: "Hanka Mączna", floor: 81, text: "" }); return 0; })()`);
    await t.until("SpeechBubbles.log.some(l => /Prawda o Hance/.test(l))", 10, 200);
    const w9 = await J("({ r: TownQuests.rec('W9'), line: TownQuests.Q.W9 && TownQuests.journalOps({ quest: TownQuests.Q.W9 }).map(o => o.text || '').join(' | '), log: SpeechBubbles.log.slice(-2), tops: window.__kit.tops.slice(-3) })");
    t.check("a truth read deep down: the arc 'Serce Twierdzy' begins (Rozdział 6); the hero thinks 'Prawda o Hance... powiedzieć? Czy przemilczeć?'",
        w9.r && w9.r.s === "active" && /Rozdział 6/.test(w9.line) && w9.log.some(l => /Prawda o Hance/.test(l)) && w9.tops.some(n => /Serce Twierdzy/.test(n)), w9);
    t.check("...the journal counts them: 8 known about people (not the hero's own), none told yet; Feliks is gone from the town - his cannot be told",
        /poznane: 8, powiedziane: 0, przemilczane: 0/.test(w9.line) && /Feliks \(nie ma go w mieście\)/.test(w9.line) && /Mruczek \(powiedz dziadkowi\)/.test(w9.line), w9.line.slice(0, 400));

    // grandpa (Map019, his story talk after it): his own truth, told; then Mruczek's, kept
    const g1 = await talkTo("$gameMap.event(901)", ["Powiedz prawdę."]);
    const gf = await flags();
    t.check("grandpa (before his story talk): the kartka remembered, 'Powiedz prawdę.' - 'Ty będziesz pukał?' (flags truthTold_dziadek, grandpaTruth)",
        /Kartka z dołu/.test(g1.text) && /nikt już nie zapuka/.test(g1.text) && /Ty będziesz pukał/.test(g1.text) && gf.truthTold_dziadek && gf.grandpaTruth, g1.text.slice(0, 300));
    const g2 = await talkTo("$gameMap.event(901)", ["Przemilcz."]);
    t.check("...talked to again: Mruczek's truth (it goes to grandpa) - kept silent", /Mruczek schodził/.test(g2.text) && /Nic nie mówisz/.test(g2.text) && (await flags()).truthKept_kot, g2.text.slice(0, 240));

    // the town: Hanka told (opinion +2), Kuba 'not now' (asked once a day), then kept
    await t.go(8, 24, 37, 8);
    await at(40, 9, 40);
    t.check("a tick over Hanka (a truth waits for her)", (await J("TownQuests.markers().piekarka")) === "ready");
    const opH = await opinion();
    const h1 = await talk("piekarka", ["Powiedz prawdę."]);
    t.check("Hanka: 'Od jutra ten bochenek pójdzie do obozu' - opinion +2, a top notice 'Prawda powiedziana: Hanka Mączna'",
        /jeden bochenek za dużo/.test(h1.text) && /do obozu/.test(h1.text) && (await opinion()) === Math.min(100, opH + 2) && (await t.notices()).some(n => /Prawda powiedziana: Hanka/.test(n)), h1.text.slice(0, 300));
    const h2 = await talk("piekarka", [], { secs: 8 });
    t.check("...talked to again: her usual talk (each truth once)", !/Kartka z dołu/.test(h2.text), h2.text.slice(0, 120));
    const k1 = await talk("woziwoda", ["Nie teraz."]);
    const k2 = await talk("woziwoda", [], { secs: 8 });
    t.check("Kuba: 'Nie teraz.' - the same day he is not asked again", /Kartka z dołu/.test(k1.text) && !/Kartka z dołu/.test(k2.text), { k1: k1.text.slice(0, 120), k2: k2.text.slice(0, 120) });
    await at(41, 9, 40);
    const k3 = await talk("woziwoda", ["Przemilcz."]);
    t.check("...the next day asked again - kept silent ('Nic nie mówisz'), no opinion change", /Nic nie mówisz/.test(k3.text) && (await flags()).truthKept_woziwoda, k3.text.slice(0, 200));
    const lud = await talk("ludmila", []);
    t.check("...and Ludmiła has heard: Hanka sends the camp a loaf every morning (a remark, once)", /przysyła nam co rano bochenek/.test(lud.text), lud.text.slice(0, 160));

    // the Lord (at his door, before his story talk): kept
    await t.go(24, 20, 15, 8);
    await at(41, 10, 30);
    const lord = await talkTo("$gameMap.event(902)", ["Przemilcz.", "Odejdź"]);
    t.check("the Lord (before his story talk): his truth kept - he talks on about the weather and the wax", /ciszy we dworze/.test(lord.text) && /Nic nie mówisz/.test(lord.text) && (await flags()).truthKept_lord, lord.text.slice(0, 240));

    // the tavern: Melia's topic, Borgar's topic at the bar
    await t.go(1, 52, 31, 8);
    await at(41, 12, 30);
    const trust0 = await J("TavernLife.trust('melia')");
    const mel = await talkTo("$gameMap.event(2)", ["Mam ci coś", "Powiedz prawdę.", "Bywaj"]);
    t.check("Melia: a topic in her menu 'Mam ci coś do powiedzenia...' - the eighth verse; told: her trust +5 (and +1 for the day's first talk)",
        (mel.choices[0] || []).some(l => /Mam ci coś do powiedzenia/.test(l)) && /ósmą|Ósmą/.test(mel.text) && (await J("TavernLife.trust('melia')")) === trust0 + 6, { choices: mel.choices[0], text: mel.text.slice(0, 200) });
    const bor = await talkTo("$gameMap.event(1)", ["Borgarze", "Powiedz prawdę.", "Nie teraz"]);
    const fb = await flags();
    t.check("Borgar: the topic in his menu - 'Nie pytam o to, czego nie chcę wiedzieć. A ty mi właśnie powiedziałeś.' (borgarKnows)",
        /stajesz przed kratą/.test(bor.text) && /A ty mi właśnie powiedziałeś/.test(bor.text) && fb.borgarKnows && fb.truthTold_borgar, bor.text.slice(0, 300));
    const end = await J("TownQuests.journalOps({ quest: TownQuests.Q.W9 }).map(o => o.text || '').join(' | ')");
    t.check("the journal: told 4, kept 3; still waiting - only Feliks (away); the arc stays open (other truths may come)",
        /poznane: 8, powiedziane: 4, przemilczane: 3/.test(end) && /czeka: Feliks \(nie ma go w mieście\)\./.test(end) && (await step("W9")) === "active:0", end.slice(0, 400));
    t.check("the drought: W9's truths and W1's cistern give the hero no water", (await J(`(function(){ const W = [129, 138, 166, 167], bad = []; for (const id of ["W1", "W9"]) { const q = TownQuests.Q[id];
        for (const t of Object.values(q.truths || {})) for (const rw of [t.told, t.kept]) if (rw && rw.items && rw.items.some(([i]) => W.includes(i))) bad.push(id); } return bad.length; })()`)) === 0);

    // ================================================================== the darts: Furman Wiesiek's own bust
    const wb = await J("({ bust: TavernLife.OPPONENTS.wiesiek.bust, face: TavernLife.OPPONENTS.wiesiek.face, soltys: 'Soltys_Bust' })");
    await t.eval("window.__wb = ImageManager.loadPicture(TavernLife.OPPONENTS.wiesiek.bust); 0");
    await t.until("window.__wb.isReady()", 10, 100);
    t.check("darts: Furman Wiesiek has his own bust (RTP People2_7, a weathered carter) - not People1_5, the Sołtys bust's face",
        wb.bust === "People2_7" && wb.face[0] === "People2" && wb.face[1] === 6 && (await J("__wb.width > 0")), wb);
});
