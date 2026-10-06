// The town's quests (TownQuests.js + TownQuests_Data.js, user 2026-10-04: "zrób to wszystko co tylko możesz"): the engine (offers in
// the residents' talks, steps, rewards, notices, the state in the save), "Opinia w miasteczku" and its tiers and greetings, the
// journal's tab "Miasteczko" and the goal window, the markers over the residents, the places of the quests (injected events 951-959),
// the market day, the drought rule (quests only take the hero's water), and quests end to end: K1, K2, K4, K5, K8, K10, K12, K13
// (failed: the noon bell is silent), K14 (the bell mini-game), K16 (trade), K17 (notices), D1 (time passes), D5 (the wolves), D16,
// W1 (the clues, following Kuba at night - caught once, then unseen) and W2 (the bell's signals), and in a story game K32 and K31
// (the Lord, grandpa). Shots: docs/miasteczko/questy_*.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const rec = id => J(`TownQuests.rec(${JSON.stringify(id)})`);
    const res = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    // a talk with a resident; one that did not end (a choice nobody picked) is closed, so the next check starts clean
    const talk = async (key, picks, o) => { const r = await t.talkTo(res(key), picks || [], o); if (!r.done) await t.finish(); return r; };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const step = async id => { const r = await rec(id); return r ? r.s + ":" + r.step : "none"; };
    const opinion = () => J("TownQuests.opinion()");
    // takes quest `id` from `key`: other offers that come first are turned down for today
    const accept = async (key, label, id) => {
        for (let i = 0; i < 6; i++) { await talk(key, [label]); if (!(await step(id)).startsWith("none")) return true; }
        return false;
    };

    await t.newGame({ map: 8, x: 8, y: 50, dir: 8, hour: 8, day: 2, quiet: true, minimap: false });
    await at(2, 8, 40);

    // ------------------------------------------------------------------ the engine
    const base = await J(`({ api: !!window.TownQuests, n: TownQuests.QUESTS.length, op: TownQuests.opinion(), tier: TownQuests.tierName(),
        listed: (function(){ const n = $plugins.filter(p => p.status).map(p => p.name), i = n.indexOf("TownQuests"); return i > 0 && i > n.indexOf("TownLife") ? n.slice(i - 1, i + 1) : []; })(), state: Object.keys(Tawerna.state('townQuests')).length > 5, inject: Tawerna.inject.list().filter(r => r.owner === 'TownQuests').map(r => r.ids) })`);
    t.check("TownQuests is registered right after its data (and after TownLife), its state is in the save, its places are ids 951-959", base.api && base.listed.join() === "TownQuests_Data,TownQuests" && base.state && base.inject.includes("951-959"), base);
    t.check("the town starts with the opinion 10 - 'Obcy'", base.op === 10 && base.tier === "Obcy", base);
    t.check("over 30 quests in the data", base.n >= 30, base.n);
    const marks = await J("TownQuests.markers()");
    t.check("a resident with a quest to offer has the yellow '!' over the head (Tadek, day 2, 8:00)", marks.kowal === "new", marks);

    // ------------------------------------------------------------------ K1: offer, reminder (a popup), hand-in, reward, a tool sharpened
    await t.popups({ clear: true }); await t.notices({ clear: true });
    const offer = await talk("kowal", ["Przyniosę węgiel."]);
    t.check("Tadek offers 'Węgiel do paleniska' with a choice; taking it starts the quest", offer.done && /węgla ani grudki/.test(offer.text) && (await step("K1")) === "active:0", { text: offer.text.slice(0, 200), choices: offer.choices });
    const notes1 = await t.notices();
    t.check("a notice at the top: 'Nowe zadanie: Węgiel do paleniska' with the step", notes1.some(n => /Nowe zadanie: Węgiel do paleniska \| Przynieś Tadkowi 5× Węgiel/.test(n)), notes1);
    t.check("the new quest is followed in the goal window (MIASTECZKO)", (await J("TownQuests.state().track")) === "K1" && /\|tq\|K1\|/.test(await J("SceneManager._scene._goalTracker._key")), await J("SceneManager._scene._goalTracker._key"));
    const rem = await talk("kowal", []);
    const pops = await t.popups();
    t.check("without the coal Tadek reminds, and what is missing pops up over the hero (never a message window)", /Pięć worków/.test(rem.text) && pops.some(p => /Potrzebujesz: Węgiel drzewny 0\/5/.test(p)), { text: rem.text, pops });
    await t.give(79, 5);
    await t.eval("$gameParty.gainItem($dataItems[60], 1); Durability.use(60, 12); 0");
    const g0 = await t.gold(), xp0 = await J("Combat.hero().xp + Combat.hero().level * 100000"), used0 = await J("Durability.used(60)");
    const hand = await talk("kowal", []);
    const k1 = await J(`({ r: TownQuests.rec('K1'), gold: $gameParty.gold(), coal: $gameParty.numItems($dataItems[79]), used: Durability.used(60), xp: Combat.hero().xp + Combat.hero().level * 100000 })`);
    t.check("handing in the coal before 9:00: done, +15 G, the coal taken, experience, and Tadek sharpens the worn axe",
        k1.r.s === "done" && k1.gold === g0 + 15 && k1.coal === 0 && k1.xp > xp0 && used0 > 0 && k1.used === 0 && /tnie jak nowe/.test(hand.text), { k1, used0, text: hand.text });
    t.check("the opinion grows: 10 -> 12, and 'Zadanie wykonane' at the top", (await opinion()) === 12 && (await t.notices()).some(n => /Zadanie wykonane: Węgiel do paleniska \| \+15 G/.test(n)));

    // ------------------------------------------------------------------ K2: the hero's own rain water - the drought rule
    const dryDay = await J(`(function(){ for (let d = 5; d < 90; d++) { let n = 0; for (let k = d - 1; k >= 1 && n < 9; k--) { const p = Survival.weatherPlan(k); if (p && p.type === 'rain') break; n++; }
        if (n >= 3 && !Survival.weatherPlan(d)) return d; } return 0; })()`);
    await at(dryDay, 9);
    await t.eval("$gameParty.gainItem($dataItems[138], 1); Farming.setBagWater(3); $gameParty.gainItem($dataItems[129], 1); Needs.state().skin = 2; 0");
    const w0 = await J("TownQuests.waterParts()");
    await talk("kowal", ["Przyniosę dwie porcje."]);
    const g2 = await t.gold();
    const k2 = await talk("kowal", ["25 groszy."]);
    const wAfter = await J("TownQuests.waterParts()");
    t.check("K2 after " + (await J("TownQuests.dryDays()")) + " days without rain: Tadek gets 2 portions of the hero's rain water (the bucket first), pays 25 G",
        (await step("K2")) === "done:0" && w0.all === 5 && wAfter.all === 3 && wAfter.bucket === 1 && (await t.gold()) === g2 + 25 && /Czysta jak łza/.test(k2.text), { w0, wAfter, text: k2.text });
    const gives = await J(`(function(){ const W = [129, 138, 166, 167], bad = []; for (const q of TownQuests.QUESTS) { const rw = [q.reward]; for (const s of q.steps) { rw.push(s.reward); for (const o of (s.choice || {}).options || []) rw.push(o.reward); for (const r of s.anyRewards || []) rw.push(r); }
        for (const o of (q.offer || {}).options || []) rw.push(o.reward); for (const r of rw) for (const it of (r && r.items) || []) if (W.includes(it[0])) bad.push(q.id); for (const it of ((q.offer || {}).gives || [])) if (W.includes(it[0])) bad.push(q.id); } return bad; })()`);
    t.check("the drought: no quest's reward gives water or a vessel of water (they only take it)", gives.length === 0, gives);

    // ------------------------------------------------------------------ the opinion's tiers, the greetings, the journal tab
    await t.eval("TownQuests.addOpinion(20 - TownQuests.opinion(), 'test'); 0");
    t.check("at 20 the opinion's tier changes to 'Bywalec' (a notice at the top)", (await J("TownQuests.tierName()")) === "Bywalec" && (await t.notices()).some(n => /Opinia w miasteczku: Bywalec/.test(n)));
    await at(dryDay + 1, 17.6);
    const greet = await talk("garbarz", []);
    t.check("the first talk of the day greets by the tier (Ignac, 'Bywalec': 'A, bosy. Dzień dobry.'), then his usual line", /^A, bosy\. Dzień dobry\. \S/.test(greet.text), greet.text);
    await t.key("J"); await t.frames(20);
    const jr = await J(`(function(){ const s = SceneManager._scene; const names = s._tabs._list.map(c => c.name); const i = names.indexOf('Miasteczko'); if (i < 0) return { names };
        s._tab = i; s.showTab(); const out = { names, items: s._list._items.map(it => it.label + ' | ' + (it.right || '')), ops: [] };
        for (let k = 0; k < s._list.maxItems(); k++) { s._list.select(k); s._list.updateHelp(); out.ops.push(s._detail._ops.length); } s._list.select(0); s._list.updateHelp(); return out; })()`);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "questy_dziennik.png"));
    t.check("the journal has the tab 'Miasteczko': the opinion, the calendar and the quests done, each row with its detail",
        jr.names && jr.names.includes("Miasteczko") && jr.items.some(i => /^Opinia w miasteczku \| 20 · Bywalec/.test(i)) && jr.items.some(i => /^Kalendarz miasteczka/.test(i)) && jr.items.some(i => /^Woda do hartowania \| dz\./.test(i)) && jr.ops.every(n => n >= 3), jr);
    await t.eval("SceneManager.pop(); 0"); await t.until(t.onMap(8), 20); await t.frames(10);

    // ------------------------------------------------------------------ K8, K10, K12: the water's clues -> W1 starts, its chapter 2 opens
    const d8 = dryDay + 2;
    await at(d8, 9);
    await accept("woziwoda", "Przyniosę.", "K8");
    await t.give(80, 2); await t.give(88, 4); await t.give(89, 1);
    const k8 = await talk("woziwoda", []);
    t.check("K8: the barrel mended (planks, nails taken, the hammer kept); Kuba: 'Z daleka. Nie pytaj.'", (await step("K8")) === "done:0" && /Nie pytaj/.test(k8.text) && (await t.count(80)) === 0 && (await t.count(89)) === 1, k8.text);
    t.check("...and the arc W1 'Woda spod Kruczych Skał' starts by itself with the first clue", (await step("W1")) === "active:0" && (await t.notices()).some(n => /Nowy wątek: Woda spod Kruczych Skał/.test(n)));
    await accept("garbarz", "Powącham.", "K10");
    const wk = await J("TownQuests.waterParts().all");
    const k10 = await talk("garbarz", []);
    t.check("K10: Ignac's vat smells of roses and iron; the hero's own rain water only shown, not taken", (await step("K10")) === "done:0" && (await J("TownQuests.waterParts().all")) === wk && /Róże rosną tylko tam/.test(k10.text), k10.text);
    await at(d8, 19);
    await accept("kapral", "Przyniosę.", "K12");
    await t.give(159, 1);
    const t0 = await t.count(59);
    const k12 = await talk("kapral", []);
    t.check("K12: boar fat for the lantern -> two torches and Wit's hint about someone with barrels at night", (await step("K12")) === "done:0" && (await t.count(59)) === t0 + 2 && /z beczkami/.test(k12.text), k12.text);
    t.check("three clues: W1 goes on to chapter 2 (follow Kuba at night)", (await step("W1")) === "active:1", await rec("W1"));

    // ------------------------------------------------------------------ W1: following Kuba at night (caught once, then unseen)
    await at(d8 + 1, 1.7, 5);
    await t.locate(29, 48, 8);
    await t.eval("Hunting.setSneak(false); 0");
    const op0 = await opinion();
    const caught = await t.until("TownQuests.rec('W1').t.follow && TownQuests.rec('W1').t.follow.tried === $gameSystem.dayNightDay()", 40, 300);
    t.check("standing at Kuba's door when he comes out at night, not sneaking: he sees the hero ('Kuba cię zauważył'), opinion -3, no more tries tonight",
        caught && (await opinion()) === op0 - 3 && (await t.notices()).some(n => /Kuba cię zauważył/.test(n)) && (await step("W1")) === "active:1", { caught, op: await opinion(), op0 });
    await t.locate(6, 40, 2);   // (away from Kuba's door before the clock moves: he must not step out next to the hero)
    await at(d8 + 2, 1.7, 5);
    await t.locate(6, 40, 2);
    await t.eval("Hunting.setSneak(true); 0");
    const atPond = await t.until("(function(){ const s = TownLife.state('woziwoda'), p = TownLife.spot('staw'); return !!s && !s.hidden && s.act === 'work' && s.x === p[0] && s.y === p[1]; })()", 90, 300);
    const hide = await J(`(function(){ const p = TownLife.spot('staw'); for (let r = 3; r <= 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= 0; dx++) {
        const x = p[0] + dx, y = p[1] + dy, d = Math.hypot(dx, dy); if (d < 3 || d > 6 || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length) continue;
        $gamePlayer.locate(x, y); return [x, y]; } return null; })()`);
    const seen = atPond && (await t.until("TownQuests.rec('W1').step === 2", 90, 400));
    await t.frames(30);
    await t.shot(path.join(SHOTS, "questy_staw_noc.png"));
    const w1n = await J(`({ r: TownQuests.rec('W1'), kuba: TownLife.state('woziwoda'), notes: Journal.data().notes.map(n => n.title), log: SpeechBubbles.log.slice(-4) })`);
    t.check("sneaking (C) by the pond while Kuba fills his barrels: chapter 2 done, the scene in the hero's bubbles, the note - next: talk to Kuba (ch. 3, w1_chapters_test)",
        seen && w1n.notes.includes("Woda Kuby - noc") && w1n.log.some(l => /rurę|rury/.test(l)) && /Porozmawiaj z Kubą/.test((await J("TownQuests.Q.W1.steps[2].text"))), Object.assign({ atPond, hide }, w1n));
    await t.eval("Hunting.setSneak(false); 0");

    // ------------------------------------------------------------------ W2: the bell's signals
    await at(d8 + 3, 2.95, 5);
    await t.locate(24, 37, 8);
    const heard = await t.until("TownQuests.state().bells.some(b => b.sig === '3')", 30, 300);
    t.check("on the town map at 3:00 the bell rings three: noted, and W2 'Kod dzwonu' starts (its first step done)", heard && (await step("W2")) === "active:1" && (await t.notices()).some(n => /Nowy wątek: Kod dzwonu/.test(n)), await rec("W2"));
    await at(d8 + 3, 9);
    const w2a = await talk("dzwonnik", []);
    t.check("W2: asked about the night bell, Ambroży: 'Trzy to nie godzina...' - the next step: become his apprentice", /Trzy to nie godzina/.test(w2a.text) && (await step("W2")) === "active:2", w2a.text);
    await at(d8 + 3, 22.97, 5);
    const change = await t.until("TownQuests.state().bells.some(b => b.sig === '1-1-1-1')", 30, 300);
    await t.eval("Tawerna.emit('lightning', { d: 0.3, strength: 1, outdoors: true, mapId: 8 }); 0");
    t.check("the change of the watch at 23:00 (1-1-1-1) and a lightning in a storm (2+2+2) are noted too; the first of each kind goes into the journal",
        change && (await J("new Set(TownQuests.state().bells.map(b => b.sig)).size")) === 3 && (await J("Journal.data().notes.filter(n => /^Dzwon: /.test(n.title)).length")) === 3, await J("TownQuests.state().bells"));

    // ------------------------------------------------------------------ K14: the bell mini-game (as Ambroży's knees hurt)
    await t.eval("TownQuests.bellOpts = { bot: 'target', turbo: 8 }; 0");
    await at(d8 + 4, 17.55);
    await accept("dzwonnik", "Zadzwonię.", "K14");
    const g14 = await t.gold();
    await talk("dzwonnik", [], { secs: 60 });
    await t.until("TownQuests.rec('K14').s === 'done' && !Tawerna.ui.running && SceneManager._scene instanceof Scene_Map", 60, 300);
    await t.dismiss();
    t.check("K14: the bell rung exactly six times in the mini-game: done, +8 G", (await step("K14")) === "done:0" && (await t.gold()) === g14 + 8 && (await J("Tawerna.ui.lastResult.strikes")) === 6, await J("Tawerna.ui.lastResult"));
    await t.eval("window.__bellWrong = null; TownQuests.openBell({ target: 6, bot: 4, turbo: 10 }, r => window.__bellWrong = r); 0");
    await t.until("!!window.__bellWrong && SceneManager._scene instanceof Scene_Map", 60, 300);
    const wrong = await J("window.__bellWrong");
    t.check("the bell game: four strikes for six - the wrong count (no success)", wrong && wrong.strikes === 4 && !wrong.right && !wrong.ok, wrong);

    // ------------------------------------------------------------------ D16: the apprentice (4 lessons at the bell) -> W2 goes on
    await t.eval("TownQuests.addOpinion(40 - TownQuests.opinion(), 'test'); 0");
    const d16 = d8 + 5;
    await at(d16, 13);
    await accept("dzwonnik", "Będę przychodził.", "D16");
    for (let k = 0; k < 4; k++) {
        await at(d16 + k, 11.8);
        await talk("dzwonnik", [], { secs: 60 });
        await t.until(`(TownQuests.rec('D16').t.n || 0) >= ${k + 1} || TownQuests.rec('D16').s === 'done'`, 60, 300);
        await t.dismiss();
    }
    t.check("D16: four lessons on four days at the noon bell: done, the key of the bell tower", (await step("D16")) === "done:0" && !!(await J("TownQuests.state().flags.bellKey")), await rec("D16"));
    t.check("W2 then waits at the talk by the bell (the apprentice step and the table of three signals passed by themselves)", (await step("W2")) === "active:4", await rec("W2"));
    await at(d16 + 4, 17.8);
    const w2b = await talk("dzwonnik", []);
    t.check("W2: the table shown at the bell - Ambroży is the last of the Order's watch; the garden key; next: the knights' garden",
        /ostatnim uczniem/.test(w2b.text) && !!(await J("TownQuests.state().flags.gardenKey")) && (await step("W2")) === "active:5", w2b.text.slice(0, 300));

    // ------------------------------------------------------------------ K13 missed: the noon bell is silent
    const d13 = d16 + 5;
    await at(d13, 9);
    await accept("dzwonnik", "Przyniosę liny.", "K13");
    await t.eval("window.__bell3 = 0; if (!window.__cb) { window.__cb = AudioManager.createBuffer; AudioManager.createBuffer = function(f, n) { if (n === 'Bell3') window.__bell3++; return window.__cb.apply(this, arguments); }; } 0");
    await at(d13, 11.97, 2);
    await t.until("$gameSystem.dayNightHour() >= 12.2", 60, 300);
    t.check("K13 not done by noon: failed (opinion -1) and the noon bell does not ring at all", (await J("TownQuests.rec('K13').s")) === "failed" && (await J("window.__bell3")) === 0, { bells: await J("window.__bell3"), r: await rec("K13") });

    // ------------------------------------------------------------------ K16: Baltazar buys mushrooms at double price on the day after a ferry
    const dFerry = await J(`(function(){ for (let d = ${d13 + 1}; d < ${d13 + 8}; d++) if (TownQuests.isFerry(d - 1)) return d; return 0; })()`);
    await at(dFerry, 9);
    await t.give(103, 5);
    const g16 = await t.gold();
    const k16 = await talk("kupiec", ["Grzyby"]);
    t.check("K16: the day after the ferry Baltazar buys 5 mushrooms for 4 G each (twice the shop's price); the clue note", (await t.gold()) === g16 + 20 && (await t.count(103)) === 0 && (await step("K16")) === "done:0" && (await J("Journal.data().notes.some(n => n.title === 'Zapasy Baltazara')")), k16.text);

    // ------------------------------------------------------------------ K17: four notices nailed on the walls (the quest's places)
    await at(dFerry + 1, 9);
    await accept("soltys", "Przybiję.", "K17");
    await t.give(88, 4);
    await t.frames(40);
    const sw = await J("[952, 953, 954, 955].map(id => !!$gameMap.event(id) && !!$gameMap.event(id).page())");
    const sprOf = id => `SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gameMap.event(${id}))`;
    const mark = await J(`(function(){ const s = ${sprOf(952)}; return { visible: !!s && s.visible, mark: !!(s && s._tqMark && s._tqMark.visible) }; })()`);
    t.check("the four walls of the notices come up as places of the quest (their events active, a yellow marker shown over them)", sw.every(Boolean) && mark.visible && mark.mark, { sw, mark });
    for (const [id, x, y] of [[952, 25, 17], [953, 7, 40], [954, 8, 49], [955, 15, 40]]) {
        await t.locate(x, y, 8);
        await t.talkTo(`$gameMap.event(${id})`, [], { place: false });
    }
    await t.frames(40);
    await t.shot(path.join(SHOTS, "questy_obwieszczenie.png"));
    const k17s = await J("({ r: TownQuests.rec('K17'), nails: $gameParty.numItems($dataItems[88]), on: [952, 953, 954, 955].map(id => !!$gameMap.event(id).page()), papers: Object.keys(TownQuests.state().flags).filter(k => /^notice_/.test(k)).length })");
    const paper = await J(`(function(){ const s = ${sprOf(955)}; return !!s && s.visible && !!s._tqDeco && s._tqDeco.visible && !(s._tqMark && s._tqMark.visible); })()`);
    t.check("each notice: a nail used, the paper stays on the wall (drawn there), the place goes away; then back to the sołtys", k17s.r.step === 1 && k17s.nails === 0 && k17s.papers === 4 && k17s.on.every(v => !v) && paper, Object.assign({ paper }, k17s));
    await talk("soltys", []);
    t.check("K17 done at the sołtys", (await step("K17")) === "done:1");

    // ------------------------------------------------------------------ K5: four loaves before nine (gossip in the journal)
    const d5 = dFerry + 2;
    await at(d5, 6.6);
    await accept("piekarka", "Przyniosę przed świtem.", "K4");
    await accept("piekarka", "Roznoszę!", "K5");
    for (const [k, h] of [["ludmila", 6.7], ["kapral", 6.9], ["dzwonnik", 7.2], ["soltys", 8.1]]) { await at(d5, h, 8); await talk(k, []); }
    await at(d5, 8.3);
    const g5 = await t.gold();
    await talk("piekarka", []);
    t.check("K5: four loaves delivered before nine, paid 12 G at the stall, the gossip noted", (await step("K5")) === "done:1" && (await t.gold()) === g5 + 12 && (await J("Journal.data().notes.filter(n => /^Plotka: /.test(n.title)).length")) >= 4, await rec("K5"));

    // ------------------------------------------------------------------ K4: wood under the bakery's window before dawn (the next day)
    await t.give(61, 4);
    await at(d5 + 1, 3.7);
    await t.locate(6, 40, 8);
    const b0 = await t.count(83);
    const k4 = await t.talkTo("$gameMap.event(951)", [], { place: false });
    t.check("K4: at 3:40 the bakery's window answers (Hanka from inside), 4 wood taken, 2 warm loaves", (await step("K4")) === "done:0" && (await t.count(83)) === b0 + 2 && (await t.count(61)) === 0 && /Hanka/.test(JSON.stringify(k4.log.map(l => l.name))), k4.log);

    // ------------------------------------------------------------------ D1: the boots (days pass between the steps)
    const d1 = d5 + 2;
    await at(d1, 9);
    await accept("garbarz", "Przyniosę skóry.", "D1");
    await t.give(96, 3); await t.give(86, 1);
    await talk("garbarz", []);
    await talk("kowal", []);
    await at(d1 + 1, 7.3);
    const early = await talk("garbarz", []);
    t.check("D1: the measure is not before two days have passed", /dwa dni/.test(early.text) && (await step("D1")) === "active:2", early.text);
    await at(d1 + 2, 7.3);
    await talk("garbarz", []);
    await at(d1 + 4, 9);
    const sneak0 = await J("Combat.perk('sneak')");
    await talk("garbarz", ["Buty łowcy"]);
    t.check("D1: measured at 7:00, two days later 'Buty łowcy' - the boots in the bag and sneaking quieter (the perk +0.2)",
        (await step("D1")) === "done:3" && (await t.count(113)) >= 1 && Math.abs((await J("Combat.perk('sneak')")) - sneak0 - 0.2) < 1e-6, { sneak0, now: await J("Combat.perk('sneak')") });

    // ------------------------------------------------------------------ D5: the tracks, the wolves (kills on the bus), Wit's choice
    const dw = Math.max(d1 + 5, 8);
    await at(dw, 9);
    const ar0 = await t.count(127);
    await accept("kapral", "Zajmę się tym.", "D5");
    await at(dw + 1, 6);
    await t.locate(26, 55, 8);
    await t.talkTo("$gameMap.event(956)", [], { place: false });
    t.check("D5: six arrows from Wit; the tracks at the south gate at dawn", (await t.count(127)) === ar0 + 6 && (await step("D5")) === "active:1", await rec("D5"));
    await at(dw + 1, 22);
    await t.go(22, 18, 13, 2);
    await t.eval("Hunting.auto(false); TownQuests.rec('D5').t.spawned = null; 0");
    const wolves = await t.until("Hunting.animals.filter(a => a.kind() === 'wolf').length >= 2", 15, 300);
    t.check("on Polna droga at night the two scouts come (spawned for the quest)", wolves, await J("Hunting.animals.map(a => a.kind())"));
    await t.eval("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); for (let i = 0; i < 2; i++) Tawerna.emit('kill', { kind: 'wolf', by: 'hero', mapId: 22, animal: {} }); 0");
    await t.eval("Tawerna.emit('kill', { kind: 'wolf', by: 'hero', mapId: 23, animal: {} }); 0");
    const notLeader = await step("D5");
    await t.eval("Tawerna.emit('kill', { kind: 'wolf', by: 'hero', mapId: 23, animal: { _tqLeader: true } }); 0");
    t.check("two wolves on Polna droga move it on; on Skraj lasu only the pack's leader counts", notLeader === "active:2" && (await step("D5")) === "active:3", notLeader);
    await t.go(8, 46, 51, 6);
    await at(dw + 2, 9);
    const g5w = await t.gold(), o5 = await opinion();
    await talk("kapral", ["Powiem o wszystkim sołtysowi."]);
    t.check("D5: told to the sołtys - 80 G and the opinion +5", (await step("D5")) === "done:3" && (await t.gold()) === g5w + 80 && (await opinion()) === Math.min(100, o5 + 5));

    // ------------------------------------------------------------------ the market day
    const dm = Math.ceil((dw + 3) / 7) * 7;
    await t.notices({ clear: true });
    await at(dm, 9.5, 60);
    await t.locate(25, 33, 8);
    const mk = await t.until("SpeechBubbles.log.some(l => /targ|Targ|Dzień targowy|Opłata targowa|sakiewek|na szczęście|Sukno|Kolejka|Pasy|weselej/.test(l))", 40, 300);
    t.check("the market day (every 7 days): a notice at the top and the residents call out the market", mk && (await t.notices()).some(n => /Dziś dzień targowy/.test(n)), await J("SpeechBubbles.log.slice(-5)"));
    await t.shot(path.join(SHOTS, "questy_targ.png"));

    // ------------------------------------------------------------------ the camp under the wall (the new residents): K27, K28, D10, K19, K29, D4
    const dc = dm + 1;
    await at(dc, 9.5);
    await accept("ludmila", "Wystrugam jej konika.", "K27");
    await t.give(61, 1); await t.give(90, 1);
    await at(dc, 9.6);
    const k27 = await talk("ela", []);
    t.check("K27: a wooden horse carved for Ela (wood + a knife); Ludmiła tells of the 'heart of the rock'", (await step("K27")) === "done:0" && /Wiatr/.test(k27.text) && /serc/.test(k27.text), k27.text.slice(0, 300));
    await accept("ludmila", "Ugotuję.", "K28");
    await t.give(131, 2);
    await talk("ludmila", []);
    t.check("K28: two hot soups for the camp", (await step("K28")) === "done:0" && (await t.count(131)) === 0);
    await accept("ludmila", "Zrobię wywar.", "D10");
    await t.give(110, 1);
    const wd0 = await J("TownQuests.waterParts().all");
    await talk("ludmila", []);
    t.check("D10: the herbal brew given with one portion of the hero's own rain water (taken)", (await step("D10")) === "active:1" && (await J("TownQuests.waterParts().all")) === wd0 - 1, { wd0, step: await step("D10") });
    await at(dc + 1, 9.5);
    const d10 = await talk("ludmila", []);
    t.check("D10: the next morning the fever is gone", (await step("D10")) === "done:2" && /Gorączka spadła/.test(d10.text), d10.text);
    await accept("soltys", "Policzę.", "K19");
    await at(dc + 1, 9.6);
    await talk("ludmila", []); await talk("ela", []);
    await at(dc + 1, 22);
    await t.locate(13, 51, 4);
    await t.until("!!TownLife.eventOf('rafal') && !TownLife.state('rafal').hidden", 20, 300);
    const rc = await talk("rafal", ["Dobrze. Nie liczę cię."]);
    t.check("K19: the camp counted (Ludmiła, Ela, Rafał - who asks not to be counted)", (await step("K19")) === "active:1" && /Nie licz mnie/.test(rc.text), rc.text.slice(0, 200));
    await accept("rafal", "Przyniosę opatrunek.", "K29");
    await t.give(152, 1);
    await t.eval("(function(){ const r = TownLife.eventOf('rafal'), w = TownLife.eventOf('kapral'); if (w) { w._town.hidden = false; w.setTransparent(false); w.locate(r.x + 2, r.y); } return 0; })()");
    const guard = await talk("rafal", []);
    const g29 = await step("K29");
    await t.eval("(function(){ const w = TownLife.eventOf('kapral'); if (w) w.locate(48, 51); return 0; })()");
    await talk("rafal", []);
    t.check("K29: not while the corporal stands near ('Cicho! Kapral idzie'); with him gone the wound is dressed", g29 === "active:0" && /Kapral idzie/.test(guard.text) && (await step("K29")) === "done:0" && (await t.count(152)) === 0, { g29, text: guard.text });
    await at(dc + 2, 9);
    await talk("soltys", ["Dwoje: matka z córką."]);
    t.check("K19: told the sołtys 'two' - Rafał stays off the list", (await step("K19")) === "done:1" && !!(await J("TownQuests.state().flags.rafalHidden")));
    await accept("piekarka", "Zaczaję się.", "D4");
    await t.locate(20, 34, 8);
    await t.eval("Hunting.setSneak(true); 0");
    await at(dc + 3, 5.35, 5);
    const amb = await t.until("TownQuests.rec('D4').step === 1", 40, 300);
    await t.eval("Hunting.setSneak(false); 0");
    t.check("D4: crouched by the stall before six, the hero sees the little thief run off towards the wall", amb, await rec("D4"));
    await at(dc + 3, 9.5);
    const g4 = await t.gold();
    await talk("ela", ["Będę płacił za twój chleb."]);
    await talk("piekarka", []);
    t.check("D4: Ela takes bread for her mother; the hero pays for it (15 G) and Hanka lets it be", (await step("D4")) === "done:2" && (await t.gold()) === g4 - 15, await rec("D4"));

    // ------------------------------------------------------------------ the save: the town's state comes back
    const before = await J("JSON.stringify({ o: TownQuests.opinion(), q: Object.keys(TownQuests.state().q).sort(), b: TownQuests.state().bells.length })");
    await t.saveTo(3);
    await t.loadFrom(3, { quiet: true });
    const after = await J("JSON.stringify({ o: TownQuests.opinion(), q: Object.keys(TownQuests.state().q).sort(), b: TownQuests.state().bells.length })");
    t.check("saved and loaded: the opinion, the quests and the bell's signals come back as they were", before === after, { before, after });

    // ------------------------------------------------------------------ a story game: grandpa's letter (K32), the Lord's name day (K31)
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await at(5, 9, 30);
    const k32 = await t.talkTo("$gameMap.event(901)", []);
    t.check("K32: on day 5 grandpa hands over his letter (no choice in his talk - his own talk goes on after)", (await step("K32")) === "active:0" && (await J("TownQuests.vcount('list')")) === 1 && /napisałem do Lorda/.test(k32.text) && k32.done, k32.text.slice(0, 200));
    await t.go(24, 20, 14, 8);
    await at(5, 9, 30);
    const lord = await t.talkTo("$gameMap.event(902)", ["Odejdź"]);
    t.check("K32: the Lord takes the letter, asks about the stones with a raven - then his own talk about the debt", (await step("K32")) === "done:0" && /kamienie\? Z wyrytym krukiem/.test(lord.text) && lord.done, lord.text.slice(0, 300));
    await t.go(8, 22, 31, 8);
    await at(30, 7.5, 30);
    await accept("feliks", "Zaniosę prezent.", "K31");
    await t.give(137, 2); await t.give(136, 1);
    await t.go(24, 20, 14, 8);
    await at(33, 9, 30);
    await t.gold(100);
    const paid0 = await J("Story.state().paid");
    await t.talkTo("$gameMap.event(902)", ["Zapisz na dług dziadka.", "Odejdź"]);
    t.check("K31 (from Feliks): on day 33 the Lord takes mead and the pie; 40 G go straight onto grandpa's debt",
        (await step("K31")) === "done:0" && (await J("Story.state().paid")) === paid0 + 40 && (await t.gold()) === 100, { paid: await J("Story.state().paid"), paid0, gold: await t.gold() });
});
