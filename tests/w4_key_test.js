// W4 "Krew kasztelana" (compact, TownQuests.js 2026-10-06): the way the old order's grate in the tavern's cellar opens. After the debt
// is paid (Story: chapter 1 done - the Lord's note about the old stones under Borgar's tavern) Borgar, asked at the bar, gives the half
// of the iron key that hangs over the bar "na szczęście"; the other half lies buried at the foot of the stone cairn with the raven in
// grandpa's yard (Map020; a spade); Tadek joins the halves at the forge (iron and charcoal, the next morning) - "Klucz kasztelana";
// the key opens the grate (Map009 15,2 - Underground.open(): switch 11, the way down to the castle's ruins); the grate's locked text
// hints at the key while W4 runs. Last, Borgar hears of it and says his family's saying - the floor-10 guardian's password. Port 9463.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "podziemia");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const step = async () => { const r = await J("TownQuests.rec('W4')"); return r ? r.s + ":" + r.step : "none"; };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const talk = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 25 }, o || {})); if (!r.done) await t.finish(); return flat(r); };

    await t.newGame({ story: true, skipIntro: true, deadline: false, day: 20, hour: 10, quiet: true, minimap: false });
    await t.frames(20);
    // the grate as it is without W4 (Underground.js's own text)
    await t.go(9, 15, 3, 8);
    const plain = await talk("$gameMap.event(7)", [], { place: false });
    t.check("before W4: the cellar's grate is shut, its own words ('Krata ani drgnie')", /Krata ani\s+drgnie/.test(plain.text) && !(await J("Underground.isOpen()")), plain.text);
    t.check("W4 waits for the debt to be paid", (await step()) === "none");
    await t.eval("(function(){ const s = Story.state(); s.flags.hired = true; s.paid = s.debt; s.done = Tawerna.time.day(); TownQuests.autoChecks(); return 0; })()");
    t.check("...the debt paid (chapter 1 done): the arc 'Krew kasztelana' begins", (await step()) === "active:0");

    // a. Borgar and the half key over the bar
    await t.go(1, 52, 31, 8);
    await at(20, 11, 30);
    t.check("Borgar has something to say: a tick over him", (await J("TownQuests.markers().borgar")) === "ready");
    const b1 = await talk("$gameMap.event(1)", ["Zapytaj o stare kamienie", "Nie teraz"]);
    t.check("a. Borgar's menu: 'Zapytaj o stare kamienie pod tawerną' - the grate behind his barrels, the half key 'na szczęście', the other half buried by the raven cairn in grandpa's yard",
        (b1.choices[0] || []).includes("Zapytaj o stare kamienie pod tawerną.") && /Pół klucza/.test(b1.text) && /kamiennym kopcu z krukiem/.test(b1.text) &&
        (await J("TownQuests.vcount('klucz_borgar')")) === 1 && (await step()) === "active:1", { choices: b1.choices, text: b1.text.slice(0, 300) });
    await t.go(9, 15, 3, 8);
    const g1 = await talk("$gameMap.event(7)", [], { place: false });
    t.check("the grate now: the raven on its lock is the one on Borgar's half - which goes in only halfway", /taki sam jak na kluczu znad baru Borgara/.test(g1.text) && /tylko do połowy/.test(g1.text) && !(await J("Underground.isOpen()")), g1.text);

    // the dig at the cairn
    await t.go(20, 8, 7, 8);
    await at(20, 13, 30);
    const spot = await J("(function(){ const e = $gameMap.event(951); return e && e.page() ? [e.x, e.y] : null; })()");
    await t.shot(path.join(SHOTS, "w4_kopiec_z_krukiem.png"));
    await t.popups({ clear: true });
    await talk("$gameMap.event(951)", [], { place: false });
    const noSpade = await t.popups({ clear: true });
    t.check("the cairn in grandpa's yard (Map020): the place shows (8,6); without a spade - a popup, nothing dug", spot && spot[0] === 8 && spot[1] === 6 && noSpade.some(p => /Kamienna łopata/.test(p)) && (await step()) === "active:1", { spot, noSpade });
    await t.give(62, 1);
    const h0 = await J("$gameSystem.dayNightHour()");
    const dig = await talk("$gameMap.event(951)", [], { place: false });
    t.check("...with the spade: an hour's digging - the other half in oiled leather, the same raven", /druga połowa klucza/.test(dig.text) && (await J("TownQuests.vcount('klucz_kopiec')")) === 1 &&
        (await J("$gameSystem.dayNightHour()")) >= h0 + 0.9 && (await step()) === "active:2", dig.text.slice(0, 200));

    // b. Tadek joins them
    await t.go(8, 8, 50, 4);
    await at(21, 10, 40);
    await t.eval("(function(){ for (const q of TownQuests.QUESTS) if (q.giver === 'kowal') TownQuests.state().q[q.id] = { s: 'done', step: 0, day: 1, sday: 1, end: 1, t: { done: {} }, times: 1 }; return 0; })()");   // (Tadek's own offers out of the way)
    const t0 = await talk("TownLife.eventOf('kowal')", []);
    await t.give(86, 1);
    await t.give(79, 2);
    const t1 = await talk("TownLife.eventOf('kowal')", []);
    t.check("b. Tadek: without iron and charcoal a word about them; with them he takes the halves - 'zakonna robota', the key tomorrow morning",
        /żelazo z węglem/.test(t0.text) && /Zakonna robota/.test(t1.text) && /jutro rano/.test(t1.text) && (await J("TownQuests.vcount('klucz_borgar') + TownQuests.vcount('klucz_kopiec')")) === 0 && (await step()) === "active:3", { t0: t0.text.slice(0, 120), t1: t1.text.slice(0, 200) });
    const t2 = await talk("TownLife.eventOf('kowal')", []);
    await at(22, 8, 40);
    const t3 = await talk("TownLife.eventOf('kowal')", []);
    t.check("...the same day: 'Jutro rano, mówiłem'; the next morning: the castellan's key", /Jutro rano, mówiłem/.test(t2.text) && /Klucz kasztelana/.test(t3.text) && (await J("TownQuests.vcount('klucz_kasztelana')")) === 1 && (await step()) === "active:4", { t2: t2.text, t3: t3.text.slice(0, 120) });

    // c. the key opens the grate
    await t.go(9, 15, 3, 8);
    await t.frames(20);
    const g2 = await talk("$gameMap.event(7)", [], { place: false });
    const open = await J("({ open: Underground.isOpen(), sw: $gameSwitches.value(11), page: $gameMap.event(7).findProperPageIndex() })");
    t.check("c. at the grate with the key: it gives way (Underground.open: switch 11, the grate's open page)", /wchodzi w zamek z krukiem jak w masło/.test(g2.text) && open.open && open.sw && open.page === 1 && (await step()) === "active:5", open);
    await t.locate(15, 3, 8);
    await t.hold("up", 30);
    const down = await t.until(t.onMap(10), 15);
    await t.frames(20);
    t.check("...and through it the stairs lead down: the castle's ruins (Map010)", down);

    // d. Borgar hears it - and says the saying
    await t.go(1, 52, 31, 8);
    await at(22, 12, 30);
    const b2 = await talk("$gameMap.event(1)", ["Krata w piwnicy", "Nie teraz"]);
    const fin = await J("({ r: TownQuests.rec('W4'), q: TownQuests.Q.W4.steps[TownQuests.rec('W4').step].type, f: TownQuests.state().flags.borgarSaying, note: (Journal.data().notes.find(n => n.title === 'Słowa Borgara') || {}).text || '' })");
    t.check("d. Borgar goes quiet, then: 'Nie pytam o to, czego nie chcę wiedzieć.' - the guardian's password heard; the note; W4 waits for Act III",
        /Nie pytam o to, czego nie chcę wiedzieć\./.test(b2.text) && fin.f && fin.q === "pause" && /Nie pytam o to, czego nie chcę wiedzieć/.test(fin.note), { text: b2.text.slice(-300), fin });
    const it = await J("(function(){ const x = TownQuests.journalItems().find(i => i.quest && i.quest.id === 'W4'); return x ? { right: x.right, ops: TownQuests.journalOps(x).map(o => o.text || '').join(' | ') } : null; })()");
    t.check("the journal (Miasteczko): the arc with its chapters done and the next one 'wkrótce'", it && it.right === "wkrótce" && /Rozdział 6/.test(it.ops), it);
});
