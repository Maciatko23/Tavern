// The town's quests, part 2 (TownQuests.js 2026-10-05): the new residents (TownLife: Szymek, Lucjan Kość only on market days,
// Bartek Kmieć, the carter Wojciech, the manor's guard on Map024), K26 "Pierścionek w studni" (down the market well on 2× Lina, the
// ring's glint on Map118, by day and not in the rain; the walled-up canal with the raven - a W1 clue), K37 "Sakiewka Lorda" (a market
// day: Szymek cuts the manor's purse from Feliks and runs - a chase; caught: give it back (50 G off the debt) / let him go / keep it;
// not caught: he is gone), K39 "Kości z targu" (Bartek in the tavern, Lucjan at the market: the dice mini-game, the swap seen only
// with Czujność 10; unmasked: he leaves the market, Bartek pays 5 G), K15 with the carter at the south gate. Port: CDP_PORT=9463.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const step = async id => { const r = await J(`TownQuests.rec(${JSON.stringify(id)})`); return r ? r.s + ":" + r.step : "none"; };
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const res = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const talk = async (key, picks, o) => { const r = await t.talkTo(res(key), picks || [], o); if (!r.done) await t.finish(); return flat(r); };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const accept = async (key, label, id) => {
        for (let i = 0; i < 6; i++) { await talk(key, [label]); if (!(await step(id)).startsWith("none")) return true; }
        return false;
    };
    const who = keys => J(`(function(){ const o = {}; for (const k of ${JSON.stringify(keys)}) { const e = TownLife.eventOf(k); o[k] = e && [e.x, e.y, e._town.hidden ? "hidden" : "shown", e.characterName()]; } return o; })()`);

    // ------------------------------------------------------------------ the new residents
    await t.newGame({ map: 8, x: 26, y: 36, dir: 8, hour: 10, day: 7, quiet: true, minimap: false });
    await at(7, 10.2, 60);
    const m = await who(["zlodziej", "gracz", "bartek", "woznica"]);
    const spot = await J("({ dice: TownLife.spot('stragan_kosci'), cart: TownLife.spot('woz_pld') })");
    t.check("market day 7, 10:12: Szymek, Lucjan Kość (at his dice by the right stall), Bartek Kmieć and the carter are in the town, each with his own sheet",
        Object.values(m).every(v => v && v[2] === "shown" && /^\$Npc_/.test(v[3])) && m.gracz[0] === spot.dice[0] && m.gracz[1] === spot.dice[1], { m, spot });
    await at(8, 10.2, 30);
    const off = await who(["gracz"]);
    t.check("...the next day (no market) Lucjan is not there at all (hidden all day)", off.gracz && off.gracz[2] === "hidden" && (await J("TownLife.absent('gracz')")), off);

    // ------------------------------------------------------------------ K26: the ring in the well
    await at(9, 10, 30);
    t.check("K26: Zosia offers 'Pierścionek w studni'", await accept("zosia", "Zejdę po niego.", "K26"), await step("K26"));
    await t.give(93, 2);
    await t.locate(26, 34, 4);
    await t.talkTo("$gameMap.event(245)", ["Zejść"], { place: false });
    await t.until(t.onMap(118), 20);
    await t.frames(30);
    const glint = await J("(function(){ const e = $gameMap.event(951); return e && e.page() ? [e.x, e.y, e.characterName(), e.characterIndex(), e.direction(), e._pattern] : null; })()");
    t.check("down on Map118 the ring glints in the puddle (event 951 on 'pierscionek' 5,6: !Quest_Places 0, dir 2, pattern 2)", JSON.stringify(glint) === '[5,6,"!Quest_Places",0,2,2]', glint);
    await t.locate(5, 7, 8);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "k26_pierscionek.png"));
    await t.popups({ clear: true });
    await t.eval("$gameScreen.changeWeather('rain', 6, 0); 0");
    await t.talkTo("$gameMap.event(951)", [], { place: false });
    const wet = await t.popups({ clear: true });
    await t.eval("$gameScreen.changeWeather('none', 0, 0); 0");
    await at(9, 22, 10);
    await t.talkTo("$gameMap.event(951)", [], { place: false });
    const dark = await t.popups({ clear: true });
    t.check("...in the rain the shaft pours water (a popup), at night it is too dark (a popup) - no message window, the ring stays",
        wet.some(p => /W deszcz z szybu/.test(p)) && dark.some(p => /ciemno/.test(p)) && (await step("K26")) === "active:0", { wet, dark });
    await at(10, 10, 10);
    const ring = flat(await t.talkTo("$gameMap.event(951)", [], { place: false }));
    const k26 = await J("({ v: TownQuests.vcount('pierscionek'), clue: !!TownQuests.state().clues.w1_well, w1: TownQuests.rec('W1') })");
    t.check("by day: the ring found - and over the puddle the walled-up canal with the raven (a W1 clue: W1 starts)",
        k26.v === 1 && k26.clue && k26.w1 && /zamurowany łuk kanału/.test(ring.text) && (await step("K26")) === "active:1", Object.assign({ text: ring.text.slice(0, 120) }, k26));
    await t.talkTo("$gameMap.event(14)", ["Wspiąć"], { place: false });
    await t.until(t.onMap(8), 20);
    await t.frames(20);
    const op0 = await J("TownQuests.opinion()");
    const zosia = await talk("zosia", []);
    t.check("...back up, the ring to Zosia: 'Pierścionek mamy!' - opinion +3", /Pierścionek mamy/.test(zosia.text) && (await step("K26")) === "done:1" && (await J("TownQuests.opinion()")) === op0 + 3, zosia.text.slice(0, 120));

    // ------------------------------------------------------------------ K15: the crate to the carter at the south gate
    await at(10, 21.6, 30);
    await accept("kupiec", "Zaniosę.", "K15");
    await at(10, 21.7, 40);
    const cart = await who(["woznica"]);
    t.check("K15: at 21:40 the carter Wojciech waits with his cart before the south gate", cart.woznica && cart.woznica[2] === "shown" && cart.woznica[0] === spot.cart[0] && cart.woznica[1] === spot.cart[1], cart);
    const crate = await talk("woznica", ["Postaw skrzynię na wozie."]);
    t.check("...the crate handed to him ('Od Veya? Postaw z tyłu'), put on the cart - the pay tomorrow", /Od Veya\? Postaw z tyłu/.test(crate.text) && (await step("K15")) === "active:1" && (await J("TownQuests.vcount('skrzynia')")) === 0, crate.text.slice(0, 160));
    await at(11, 9, 30);
    const g15 = await t.gold();
    await talk("kupiec", []);
    t.check("...the next day Baltazar pays 20 G", (await step("K15")) === "done:1" && (await t.gold()) === g15 + 20);

    // ------------------------------------------------------------------ K37: the purse - Szymek runs
    await at(14, 8.55, 30);
    await t.locate(33, 30, 4);   // (near Feliks at the right stall, off the thief's way down the stairs)
    await t.saveTo(8);
    const started = await t.until("!!TownQuests.rec('K37')", 20, 200);
    const z0 = await J("(function(){ const z = TownLife.eventOf('zlodziej'), f = TownLife.eventOf('feliks'); return { z: [z.x, z.y], f: [f.x, f.y], held: TownLife.held('zlodziej') }; })()");
    await t.frames(90);
    const z1 = await J("(function(){ const z = TownLife.eventOf('zlodziej'); return [z.x, z.y]; })()");
    t.check("K37: a market day by Feliks at the stalls - 'Złodziej! Sakiewka jaśnie pana!', the thief beside him runs off (taken over from his plan)",
        started && z0.held && Math.hypot(z0.z[0] - z0.f[0], z0.z[1] - z0.f[1]) < 2 && (z1[0] !== z0.z[0] || z1[1] !== z0.z[1]) && (await J("SpeechBubbles.log.join('|')")).includes("Złodziej! Sakiewka jaśnie pana!"), { z0, z1 });
    const lost = await t.until("TownQuests.rec('K37').s === 'failed'", 40, 300);
    t.check("...nobody chases him: he gets away into the camp - the quest is lost", lost && !(await J("TownLife.held('zlodziej')")), await J("TownQuests.rec('K37')"));
    // caught: give it back to Feliks
    await t.loadFrom(8, { quiet: true });
    await t.until("!!TownQuests.rec('K37')", 20, 200);
    await t.frames(40);
    await t.eval("(function(){ const z = TownLife.eventOf('zlodziej'); for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { if ($gameMap.checkPassage(z.x + dx, z.y + dy, 0x0f)) { $gamePlayer.locate(z.x + dx, z.y + dy); break; } } return 0; })()");
    const caught = await t.until("TownQuests.rec('K37').step === 1", 10, 100);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "k37_zlodziej.png"));
    const sz = flat(await t.talkTo(res("zlodziej"), ["Oddaj sakiewkę."], { place: false }));
    t.check("...caught ('Puść!'): it is Szymek, a hungry boy from the camp; he gives the purse back", caught && /Ela płacze z głodu/.test(sz.text) && (await J("TownQuests.vcount('sakiewka')")) === 1 && (await step("K37")) === "active:2", sz.text.slice(0, 200));
    const g37 = await t.gold();
    const fel = await talk("feliks", []);
    t.check("...to Feliks: 50 G 'na poczet długu' (no story here: paid out) - done, Szymek back to his day",
        (await step("K37")) === "done:2" && (await t.gold()) === g37 + 50 && /Pięćdziesiąt na poczet długu/.test(fel.text) && !(await J("TownLife.held('zlodziej')")), fel.text.slice(0, 160));
    // caught: let him go
    await t.loadFrom(8, { quiet: true });
    await t.until("!!TownQuests.rec('K37')", 20, 200);
    await t.frames(40);
    await t.eval("(function(){ const z = TownLife.eventOf('zlodziej'); for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { if ($gameMap.checkPassage(z.x + dx, z.y + dy, 0x0f)) { $gamePlayer.locate(z.x + dx, z.y + dy); break; } } return 0; })()");
    await t.until("TownQuests.rec('K37').step === 1", 10, 100);
    await t.talkTo(res("zlodziej"), ["Uciekaj."], { place: false });
    const fr = await J("TownQuests.state().flags");
    t.check("...or let go: done, the camp trusts the hero (flags szymekFree, campTrust)", (await step("K37")) === "done:1" && fr.szymekFree && fr.campTrust, fr);

    // ------------------------------------------------------------------ K39: the dice sharper
    await t.go(1, 50, 53, 8);
    await at(15, 15, 40);
    const bartek = await who(["bartek"]);
    t.check("K39: Bartek Kmieć sits in the tavern in the afternoon (Map001, 'Miejsce: gosc_6')", bartek.bartek && bartek.bartek[2] === "shown" && bartek.bartek[0] === 57 && bartek.bartek[1] === 35, bartek);
    t.check("...and asks the hero to watch the market's dice player", await accept("bartek", "Zagram z nim", "K39"), await step("K39"));
    await t.go(8, 30, 33, 8);
    await at(21, 10.5, 40);
    await t.eval("Combat.hero().attr.per = 5; TownQuests.diceOpts = { auto: 'steady', turbo: 8, rules: false, seed: 5 }; $gameParty.gainGold(50); 0");
    const play = async () => {
        await t.talkTo(res("gracz"), ["Zagram"], { secs: 5 });
        await t.until("TavernDice.isRunning()", 15, 200);
        for (let i = 0; i < 300 && !(await J("!!TavernDice.state() && TavernDice.state().phase === 'end'")); i++) await t.wait(300);
        for (let i = 0; i < 30 && !(await J("SceneManager._scene instanceof Scene_Map && !TavernDice.isRunning()")); i++) { await t.press("escape"); await t.wait(300); }
        await t.dismiss();
        await t.frames(30);
    };
    await play();
    const k1 = await J("({ r: TownQuests.rec('K39'), log: SpeechBubbles.log.slice(-4) })");
    t.check("a game with Lucjan at Czujność 5: lost or won, nothing seen ('Czujność 10') - the step stays", k1.r.step === 0 && k1.r.t.games === 1, k1);
    await t.eval("Combat.hero().attr.per = 10; 0");
    await play();
    await t.until("SpeechBubbles.log.join('|').includes('rękawem')", 20, 300);   // (the hero's thoughts come one after another)
    t.check("...at Czujność 10 the swap is seen: a heavier die from his sleeve", (await step("K39")) === "active:1" && (await J("SpeechBubbles.log.join('|')")).includes("rękawem"), await J("SpeechBubbles.log.slice(-3)"));
    const op39 = await J("TownQuests.opinion()");
    const unm = await talk("gracz", ["Zdemaskuję cię."]);
    await t.frames(20);
    t.check("...unmasked before everyone: Lucjan leaves the market for good, opinion +4",
        /oszukaną kością/.test(unm.text) && (await J("TownLife.gone('gracz') && TownLife.state('gracz').hidden")) && (await J("TownQuests.opinion()")) === op39 + 4 && (await step("K39")) === "active:2", unm.text.slice(0, 160));
    await t.go(1, 50, 53, 8);
    await at(21, 15, 40);
    const g39 = await t.gold();
    const bt = await talk("bartek", []);
    t.check("...Bartek in the tavern: 'Pięć groszy. Ostatnie' - +5 G, done", /Ostatnie, jakie mam/.test(bt.text) && (await t.gold()) === g39 + 5 && (await step("K39")) === "done:2", bt.text.slice(0, 160));
    t.check("the drought: none of the new quests gives water", (await J(`(function(){ const W = [129, 138, 166, 167], bad = []; for (const id of ["K26", "K37", "K39", "W1", "W2"]) { const q = TownQuests.Q[id], rw = [q.reward];
        for (const s of q.steps) { rw.push(s.reward); for (const o of (s.choice || {}).options || []) rw.push(o.reward); } for (const r of rw) for (const it of (r && r.items) || []) if (W.includes(it[0])) bad.push(id); } return bad; })()`)).length === 0);
});
