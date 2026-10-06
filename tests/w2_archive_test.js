// W2 "Kod dzwonu", chapters 5-6 (TownQuests.js, 2026-10-05). Port: CDP_PORT=9463.
// Ch. 5: after the garden, the hero rings "pytanie" (7 strikes) himself from the tower at noon (the bell mini-game; Ambroży at the
// bell lets him; the usual noon bell keeps quiet), then in the knights' garden between 12:00 and 12:30 the statues' shadows meet on
// the slab - Map008's "Płyta w ścieżce" opens (self switch A) and leads down; too late (12:30) = ring again another day. Ch. 6: the
// Archive (Map119): the Book of Signals (every signal known in the journal), the chronicles - to Ambroży (his gratitude, opinion +3),
// taken (Baltazar buys them: 300 G - a hook for W5) or left; then the pause before ch. 7 "Jedno pytanie". Shots: docs/miasteczko/w2_*.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const step = async () => { const r = await J("TownQuests.rec('W2')"); return r ? r.s + ":" + r.step : "none"; };
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const res = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const talk = async (key, picks, o) => { const r = await t.talkTo(res(key), picks || [], o); if (!r.done) await t.finish(); return flat(r); };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const slab = "TownQuests.slabId()";

    await t.newGame({ map: 8, x: 40, y: 32, dir: 6, hour: 10, day: 10, quiet: true, minimap: false });
    await at(10, 10, 30);
    // W2 right after the knights' garden (chapters 1-4 and the garden: town_quests_test, knights_garden_test)
    await t.eval("(function(){ const s = TownQuests.state(); s.flags.gardenKey = 9; s.flags.bellKey = 9; TownQuests.start('W2', 6); $gameSelfSwitches.setValue([8, 39, 'A'], true); return 0; })()");
    const w2 = await J("({ r: TownQuests.rec('W2'), text: TownQuests.Q.W2.steps[6].text, head: TownQuests.journalOps({ quest: TownQuests.Q.W2 }).filter(o => o.k === 'h').map(o => o.text) })");
    t.check("W2 after the garden: 'ring the signal pytanie - seven strikes - at noon' (the journal: Rozdział 5)", /siedem uderzeń/.test(w2.text) && w2.head.includes("Rozdział 5"), w2);
    await t.eval("TownQuests.bellOpts = { bot: 'target', turbo: 8 }; 0");

    // ------------------------------------------------------------------ ch. 5: seven at noon; too late in the garden -> again another day
    await at(10, 11.75, 60);
    await t.until("TownLife.state('dzwonnik').act === 'bell' && TownLife.state('dzwonnik').x === TownLife.spot('dzwonnica')[0]", 30, 300);
    const mark = await J("TownQuests.markers().dzwonnik");
    const ring = await talk("dzwonnik", [], { secs: 60 });
    await t.until("TownQuests.rec('W2').step === 7 && !Tawerna.ui.running && SceneManager._scene instanceof Scene_Map", 60, 300);
    await t.dismiss();
    const rung = await J("({ r: TownQuests.rec('W2'), last: Tawerna.ui.lastResult, sig: TownQuests.state().bells.some(b => b.sig === 'pytanie'), mute: TownQuests.state().mute.slice(-1)[0] })");
    t.check("at 11:45 Ambroży at the bell (a tick over him) lets the hero ring: seven strikes in the mini-game - the signal 'pytanie' noted, the noon bell muted",
        mark === "ready" && /Siedem\? W południe/.test(ring.text) && rung.r.step === 7 && rung.last.strikes === 7 && rung.sig && rung.mute && rung.mute.from <= 12 && rung.mute.to > 12, Object.assign({ mark, text: ring.text.slice(0, 120) }, rung));
    await at(10, 12.55, 30);
    const late = await J("({ r: TownQuests.rec('W2'), slab: $gameSelfSwitches.value([8, " + slab + ", 'A']) })");
    t.check("...not in the garden by 12:30: the shadows move on - back to ringing (another day), the slab shut", late.r.step === 6 && !late.slab, late);
    await at(11, 11.75, 60);
    await t.until("TownLife.state('dzwonnik').act === 'bell' && TownLife.state('dzwonnik').x === TownLife.spot('dzwonnica')[0]", 30, 300);
    await talk("dzwonnik", [], { secs: 60 });
    await t.until("TownQuests.rec('W2').step === 7 && !Tawerna.ui.running && SceneManager._scene instanceof Scene_Map", 60, 300);
    await t.dismiss();
    await t.locate(6, 15, 8);
    await at(11, 12.05, 10);
    await t.locate(6, 10, 2);
    const opened = await t.until("$gameSelfSwitches.value([8, " + slab + ", 'A'])", 20, 200);
    await t.until("SpeechBubbles.log.some(l => /płycie w ścieżce/.test(l))", 20, 300);   // (the hero's thoughts come one after another)
    const sl = await J(`({ r: TownQuests.rec('W2'), id: ${slab}, page: $gameMap.event(${slab}).page() && $gameMap.event(${slab})._pageIndex, notes: Journal.data().notes.map(n => n.title), log: SpeechBubbles.log.slice(-3) })`);
    t.check("the next day, rung again; in the garden at 12:03 the shadows meet on the slab: it opens (self switch A - the stairs), the note, chapter 6 next",
        opened && sl.id === 246 && sl.page === 1 && sl.r.step === 8 && sl.notes.includes("Płyta w ogrodzie rycerzy") && sl.log.some(l => /płycie w ścieżce|schody/.test(l)), sl);
    await t.locate(6, 13, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "w2_plyta.png"));

    // ------------------------------------------------------------------ ch. 6: down into the Archive
    await t.talkTo(`$gameMap.event(${slab})`, [], { place: false });
    const down = await t.until(t.onMap(119), 20);
    await t.frames(30);
    const sp = await J("[951, 952].map(id => { const e = $gameMap.event(id); return e && e.page() ? [e.x, e.y] : null; })");
    t.check("down the stairs under the slab: the Archive (Map119); the Book of Signals' and the chronicles' places on (6,6 and 10,5)",
        down && JSON.stringify(sp) === "[[6,6],[10,5]]", sp);
    await t.locate(6, 7, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "w2_archiwum.png"));
    const book = flat(await t.talkTo("$gameMap.event(951)", [], { place: false }));
    const bells = await J("TownQuests.journalOps({ info: 'bells' }).map(o => o.text || '').join(' | ')");
    t.check("the Book of Signals read: every signal known - the journal lists all seven with their meanings (also those never heard)",
        /Dzwon mówi do tych, co pamiętają/.test(book.text) && !!(await J("TownQuests.state().flags.signalBook")) && /obcy w murach/.test(bells) && /brama otwarta nocą/.test(bells) && /pytanie - wezwanie/.test(bells) && !/\? \? \?/.test(bells),
        bells.slice(0, 400));
    await t.saveTo(7);
    const chron = flat(await t.talkTo("$gameMap.event(952)", ["Zanieś je Ambrożemu."], { place: false }));
    t.check("the chronicles: the rule of one question, the last castellan 'z rodu Kowali', the cistern's sluice - carried for Ambroży",
        /jedno pytanie na rok/.test(chron.text) && /z rodu Kowali/.test(chron.text) && (await J("TownQuests.vcount('kroniki')")) === 1 && (await step()) === "active:9", chron.text.slice(0, 300));
    await t.go(8, 20, 37, 8);
    await at(12, 9, 30);
    const op0 = await J("TownQuests.opinion()");
    const amb = await talk("dzwonnik", []);
    t.check("...to Ambroży: 'Kroniki... Mój mistrz mówił, że spłonęły' - opinion +3, then W2 waits before ch. 7 'Jedno pytanie'",
        /spłonęły/.test(amb.text) && (await J("TownQuests.opinion()")) === op0 + 3 && (await step()) === "active:10" && /Jedno pytanie/.test(await J("TownQuests.Q.W2.steps[10].text")), amb.text.slice(0, 200));

    // the chronicles taken: Baltazar offers 300 G
    await t.loadFrom(7, { quiet: true });
    const take = flat(await t.talkTo("$gameMap.event(952)", ["Zabierz kroniki."], { place: false }));
    t.check("taken instead: the chronicles in the bag, W2 at its pause", (await J("TownQuests.vcount('kroniki')")) === 1 && (await step()) === "active:10" && !!(await J("TownQuests.state().flags.chroniclesTaken")), take.text.slice(-120));
    await t.go(8, 10, 40, 6);
    await at(12, 9, 30);
    const g0 = await t.gold();
    const sell = await talk("kupiec", ["Sprzedam"]);
    t.check("...Baltazar asks for the old books with a raven and pays 300 G (the flag for W5)",
        /Trzysta groszy/.test(sell.text) && (await t.gold()) === g0 + 300 && (await J("TownQuests.vcount('kroniki')")) === 0 && !!(await J("TownQuests.state().flags.w5ChroniclesSold")), sell.text.slice(0, 200));

    // left on the shelf
    await t.loadFrom(7, { quiet: true });
    await t.talkTo("$gameMap.event(952)", ["Zostaw je tutaj."], { place: false });
    t.check("left on the shelf: nothing carried, W2 at its pause", (await J("TownQuests.vcount('kroniki')")) === 0 && (await step()) === "active:10" && !!(await J("TownQuests.state().flags.chroniclesLeft")));
});
