// W4 "Krew kasztelana" chapters 6-8 (Kasztelan.js, 2026-10-17) - after the compact chapters 1-5 (tests/w4_key_test.js):
//   6 "Ród Kowali": three clues - an Order's note read (floor 3), grandpa Stach ("Kruk u nas, klucz u Kowali"), brother Kleofas shown
//     the key (the key's guard swore "Nie pytam o to, czego nie chcę wiedzieć") - then the note "Ród Kowali";
//   7 the confrontation only after chapter 1 and after closing (23-1, at the bar): keep silent (it is his tavern) - nothing changes;
//     tell him - he flares up and shuts the tavern for a day (the town's door locked, no shift, Borgar only "zamknięte"), the next night
//     he waits in the cellar by the grate (not at the bar): "Chodź ze mną w dół" refused without trust - the guard of the grate with the
//     warning (the grate asks first; going down ends the shifts until the siege is over - then Borgar takes the hero back); the
//     prepared Borgar (Melia sang him the song, W3 b; his nights told - here in the same talk, it counts as W9's truth) - no anger, he
//     comes along: his fire at the tenth gate at night with a basket of bread and water, the bar empty 1-5;
//   8 the Heart's ending closes the arc (Borgar the guardian); Act III's data and the Heart's world read Borgar's stance; F9 "W4".
// Port: CDP_PORT (9511 for this work).
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "w4");

kit.test({ port: 9511, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    // (the talk's messages joined by a space: a long line goes over two message pages)
    const flat = r => { r.text = r.log.map(l => l.t).join(" ").replace(/\s+/g, " "); return r; };
    const talk = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 30 }, o || {})); if (!r.done) await t.finish(); return flat(r); };
    const step = () => J("(function(){ const r = TownQuests.rec('W4'); return r ? r.s + ':' + (Kasztelan.step() || r.step) : 'none'; })()");
    const at = async (d, h, frames) => { await t.setDay(d, h); await t.calm(); await t.frames(frames || 30); };
    const W4ops = () => J("(function(){ const x = TownQuests.journalItems().find(i => i.quest && i.quest.id === 'W4'); return x ? TownQuests.journalOps(x).map(o => o.text || '').join(' | ') : ''; })()");
    const notes = () => J("Journal.data().notes.map(n => n.title)");
    const BORGAR = "Story.borgarEvent()";
    // a talk with a screenshot at its N-th choice (Borgar's menu first, then the talk's own choice): picks before, the shot, picks after
    async function talkShot(ev, before, after, file, o) {
        const r0 = await t.talkTo(ev, before, Object.assign({ secs: 4, keep: true }, o || {}));
        const mark = await J("window.__drv.log.length - " + r0.log.length);
        await t.until("!!window.__drv.waiting", 20);
        await t.frames(25);
        if (file) await t.shot(path.join(SHOTS, file));
        await t.eval(`window.__drv.picks = ${JSON.stringify(after)}; 0`);
        let done = await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy() && SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 40);
        const out = await J(`({ log: window.__drv.log.slice(${mark}), choices: window.__drv.choices.slice(-4), missing: window.__drv.missing })`);
        await t.eval("window.__drv.on = false; 0");
        if (!done) { await t.finish(); done = false; }
        out.done = done;
        out.text = out.log.map(l => l.t).join(" ").replace(/\s+/g, " ");
        return out;
    }
    const FLAGS = ["borgarWie", "borgarZamknal", "borgarNieWie", "borgarIdzie", "borgarPilnuje", "borgarOstrzegl", "borgarZwolnil", "borgarPrzyjal",
        "w3Borgar", "w4Faster", "borgarKnows", "truthTold_borgar", "truthKept_borgar", "act3Held"];
    const resetW4 = () => t.eval(`(function(){ const f = TownQuests.state().flags; for (const k of ${JSON.stringify(FLAGS)}) delete f[k];
        Object.assign(Kasztelan.state(), { how: "", closed: 0, stance: "", verdict: 0, warned: 0, fired: 0, back: 0, basket: -1, postSeen: 0, keyLock: 0, end: "" });
        const r = TownQuests.rec("W9"); if (r && r.t && r.t.res) delete r.t.res.borgar; delete Underground.state().truths["76"]; Underground.state().ending = null; return 0; })()`);

    await t.newGame({ story: true, skipIntro: true, deadline: false, day: 62, hour: 10, quiet: true, minimap: false });
    await t.frames(20);
    t.check("Kasztelan.js is on the plugin list (after Dwor) and its events are reserved 540-559",
        await J("$plugins.findIndex(p => p.name === 'Kasztelan' && p.status) > $plugins.findIndex(p => p.name === 'Dwor') && Tawerna.inject.list().some(x => x.owner === 'Kasztelan' && /540/.test(x.ids))"));

    // ================================================================ 6. Ród Kowali
    const g6 = await J("Kasztelan.debugJump(6)");
    await t.go(g6[0], g6[1], g6[2], g6[3]);
    await at(62, 10);
    const s6 = await J("({ step: Kasztelan.step(), ended: Story.chapterEnded(), key: TownQuests.vcount('klucz_kasztelana'), open: Underground.isOpen(), n: Kasztelan.clueCount() })");
    const o6 = await W4ops();
    t.check("F9 'W4: rozdział 6': chapter 1 over (Story.chapterEnded), the key in the bag, the grate open, W4 at 'Ród Kowali' - the journal: 'Poszlaki: 0 z 3' and where to look",
        s6.step === "w4Rod" && s6.ended && s6.key === 1 && s6.open && s6.n === 0 && /Rozdział 6/.test(o6) && /Poszlaki: 0 z 3/.test(o6) && /brata Kleofasa/.test(o6), { s6, o6: o6.slice(0, 400) });
    await t.eval("Underground.state().notes['3'] = true; TownQuests.autoChecks(); 0");
    const o6b = await W4ops();
    t.check("an Order's note read (floor 3, 'Napis w murze' - Borgar's saying carved in the wall): a clue by itself - 'Poszlaki: 1 z 3 (napis w murze...)'",
        /Poszlaki: 1 z 3 \(napis w murze/.test(o6b), o6b.slice(0, 300));
    // grandpa: before his own talk
    const gp = await talk("$gameMap.event(901)", []);
    const gpS = await J("({ n: Kasztelan.clueCount(), c: Kasztelan.state().clues.dziadek })");
    t.check("grandpa Stach (before his own talk): 'Kruk u nas, klucz u Kowali' - his father kept the half for Borgar's blood; a clue, the note",
        /Kruk u nas, klucz u Kowali/.test(gp.text) && gpS.n === 2 && !!gpS.c && (await notes()).includes("Kruk u nas, klucz u Kowali"), { t: gp.text.slice(0, 300), gpS });
    // Kleofas on the cliff: shown the key
    await t.eval("(function(){ const s = Pustelnia.state(); s.met = s.met || Tawerna.time.day(); TownQuests.state().flags.pustelnikMet = TownQuests.state().flags.pustelnikMet || 1; return 0; })()");
    await t.go(155, 24, 30, 8);
    await at(62, 13.2, 50);
    const kl = await talk("TownLife.eventOf('pustelnik')", []);
    await t.frames(80);
    const kS = await J("({ step: Kasztelan.step(), n: Kasztelan.clueCount(), rod: Kasztelan.state().rod })");
    const ns = await notes();
    t.check("brother Kleofas shown the key: the key of the Order's guard, Bogumił z rodu Kowali, kasztelan i klucznik; the guard's oath 'Nie pytam o to, czego nie chcę wiedzieć' - 'Ciekawy klucznik to otwarte drzwi'",
        /Klucz straży/.test(kl.text) && /Bogumił z rodu Kowali/.test(kl.text) && /Ciekawy klucznik to otwarte drzwi/.test(kl.text) && ns.includes("Straż klucza"), kl.text.slice(0, 400));
    t.check("...three clues: chapter 6 done - the note 'Ród Kowali' (with where it came from), on to 'Konfrontacja'",
        kS.n === 3 && !!kS.rod && kS.step === "w4Konfrontacja" && ns.includes("Ród Kowali") && /Rozdział 7/.test(await W4ops()), { kS, ns: ns.slice(-5) });

    // ================================================================ 7. the confrontation: not before chapter 1's end, not before closing
    await t.go(1, 52, 31, 8);
    await at(63, 20);
    const early = await talk(BORGAR, ["Borgarze... chodzi", "Nie teraz"]);
    t.check("at the bar at 20:00: the topic 'Borgarze... chodzi o twój ród.' - 'Po zamknięciu - od jedenastej' and nothing happens",
        (early.choices[0] || []).includes("Borgarze... chodzi o twój ród.") && /Po zamknięciu/.test(early.text) && (await step()) === "active:w4Konfrontacja", { ch: early.choices[0], t: early.text.slice(-200) });
    await at(63, 23.5);
    const mk = await J(`(function(){ TownQuests.refreshMarkers(); const m = TownQuests.markers().borgar; const s = Story.state(), d = s.done, p = s.paid; s.done = 0; s.paid = 0;
        const notYet = TownQuests.FX.w4Konfrontacja.ready(null, null, null, "borgar"); s.done = d; s.paid = p; return { m, notYet }; })()`);
    t.check("after closing (23:30) a tick over Borgar; with chapter 1 not over (the debt open) the talk would not be ready (QUESTY 6.2: no shut tavern before the deadline)",
        mk.m === "ready" && mk.notYet === false, mk);

    // ---- a) keep silent: it is his tavern
    const keep = await talkShot(BORGAR, ["Borgarze... chodzi"], ["Przemilcz"], "w4_konfrontacja_przy_barze.png");
    const kp = await J("({ st: Kasztelan.stance(), step: Kasztelan.step(), f: TownQuests.state().flags.borgarNieWie, w: Underground.world().borgar, e: Kasztelan.epilogue('zniszczyc', {}, 'hero') })");
    t.check("a) 'Przemilcz. To jego tawerna.': Borgar - 'Nie wiem, co chciałeś powiedzieć. I nie chcę wiedzieć'; W4 at chapter 8 without him: not at the Heart (world().borgar false), the epilogue: he does not know",
        /Zamknięte\. \.\.\.Ale ty nie przyszedłeś na piwo/.test(keep.text) && /I nie chcę wiedzieć/.test(keep.text) && kp.st === "niewie" && kp.step === "w4Serce" && !!kp.f && kp.w === false &&
        /Nie wie po co/.test(kp.e || "") && /Przemilczałem Borgarowi/.test(await W4ops()), { kp, t: keep.text.slice(-300), ch: keep.choices });

    // ---- b) tell him - his anger, the shut day, the night in the cellar, the guard and his warning
    await resetW4();
    await J("Kasztelan.debugJump(7)");
    await at(63, 23.5);
    const angry = await talk(BORGAR, ["Borgarze... chodzi", "Powiedz mu wszystko"]);
    const an = await J("({ step: Kasztelan.step(), closed: Kasztelan.state().closed, f: TownQuests.state().flags.borgarZamknal, wie: TownQuests.state().flags.borgarWie })");
    t.check("b) 'Powiedz mu wszystko': the castellan, the oath, the key on the counter - he flares up: 'Jutro nie otwieram. Dla nikogo.'; the next day shut, W4 waits for the cellar's night",
        /Bogumił, był z twojej krwi/.test(angry.text) && /przysięga straży klucza/.test(angry.text) && /Kładziesz klucz kasztelana na ladzie/.test(angry.text) && /Jutro nie otwieram/.test(angry.text) &&
        an.step === "w4Piwnica" && an.closed === 64 && !!an.f && !!an.wie && /zamknął tawernę na dzień 64/.test(await W4ops()), { an, t: angry.text.slice(-300) });
    // the shut day: the town's door, Borgar inside, no shift
    await t.go(8, 24, 17, 8);
    await at(64, 10);
    await t.popups({ clear: true });
    await t.eval("(function(){ $gamePlayer.locate(24, 17); $gamePlayer.setDirection(8); $gameMap.event(22).start(); return 0; })()");
    await t.frames(60);
    const door = await J("({ map: $gameMap.mapId(), y: $gamePlayer.y, ban: Kasztelan.shiftBan() })");
    const dp = await t.popups();
    await t.shot(path.join(SHOTS, "w4_tawerna_zamknieta.png"));
    t.check("the shut day: the tavern's door in town - a popup over the hero 'Zamknięte. Na drzwiach kredą: „Dziś nieczynne”.', a step back, still in town; Story's shift refused",
        door.map === 8 && door.y >= 17 && dp.some(p => /Dziś nieczynne/.test(p)) && /żadnej zmiany/.test(door.ban || ""), { door, dp });
    await t.go(1, 52, 31, 8);
    await at(64, 17);
    const shut = await talk(BORGAR, []);
    t.check("...inside (from the cellar or a room): Borgar only 'Zamknięte, mówiłem. Dziś nie nalewam. Nikomu.' - no menu, no shift",
        /Dziś nie nalewam/.test(shut.text) && shut.choices.length === 0, shut.text);
    // the night: not at the bar - by the grate in the cellar
    await at(64, 23.5, 40);
    const bar = await J(`({ tr: ${BORGAR}.isTransparent(), away: Kasztelan.barAway(), night: Kasztelan.cellarNight() })`);
    t.check("the night after (23:30): Borgar is not at the bar (hidden), Kasztelan.cellarNight()", bar.tr && bar.away && bar.night, bar);
    await t.go(9, 10, 8, 8);
    await at(64, 23.6, 40);
    const cel = await J("({ b: !!$gameMap.event(540) && !$gameMap.event(540).isTransparent(), f: !!$gameMap.event(541) && !$gameMap.event(541).isTransparent(), at: $gameMap.event(540) && [$gameMap.event(540).x, $gameMap.event(540).y], pass: $gameMap.checkPassage(16, 3, 15) })");
    t.check("...in the cellar: Borgar (540) by the grate with his fire basket (541) - injected, the user's Map009 unchanged", cel.b && cel.f && cel.at.join() === "16,3" && cel.pass, cel);
    const night = await talkShot("$gameMap.event(540)", [], ["Chodź ze mną"], "w4_noc_w_piwnicy.png");
    const ng = await J("({ st: Kasztelan.stance(), w: Kasztelan.state().warned, step: Kasztelan.step(), f: TownQuests.state().flags.borgarPilnuje, o: TownQuests.state().flags.borgarOstrzegl })");
    t.check("...his grandmother: 'Pilnuj piwnicy i nie pytaj'; 'Chodź ze mną w dół' - refused (no trust yet: 'Znam cię za krótko'): he keeps the grate - 'Zejdziesz tam jeszcze raz - nie wracaj do pracy'",
        /Pilnuj piwnicy i nie pytaj/.test(night.text) && /Znam cię za krótko/.test(night.text) && /nie wracaj do pracy/.test(night.text) &&
        ng.st === "pilnuje" && !!ng.w && ng.step === "w4Serce" && !!ng.f && !!ng.o && /Borgar pilnuje piwnicy/.test(await W4ops()), { ng, t: night.text.slice(-400) });
    const a3 = await J("({ down: Act3Data.DOORS[1].down, hp: Act3Data.DEFENDERS.find(d => d.key === 'borgar').hp, start: Act3Data.DEFENDERS.find(d => d.key === 'borgar').lines.start, w: Underground.world().borgar, w4: Underground.world().w4 })");
    t.check("Act III reads it: the old door holds better (the men on the cellar's stairs: 20 damage each, not 35), Borgar's own words; at the Heart he is not (world().borgar false, w4.stance 'pilnuje')",
        a3.down === 20 && a3.hp === 140 && /Trzysta lat mój ród/.test(a3.start) && a3.w === false && a3.w4 && a3.w4.stance === "pilnuje" && a3.w4.warned, a3);
    // the grate asks first
    await t.locate(15, 3, 8);
    const g1 = await talk("$gameMap.event(7)", ["Zostań na górze"], { place: false });
    const g1s = await J("({ map: $gameMap.mapId(), fired: Kasztelan.state().fired })");
    t.check("the grate while the warning stands: '(Borgar mówił: zejdziesz... nie wracaj do pracy.)' - 'Zostań na górze': nothing", /nie wracaj do pracy/.test(g1.text) && g1s.map === 9 && !g1s.fired, { g1s, t: g1.text });
    await t.locate(15, 3, 8);
    await talk("$gameMap.event(7)", ["Zejdź"], { place: false });
    const down = await t.until(t.onMap(10), 20);
    await t.frames(20);
    const fired = await J("({ fired: Kasztelan.state().fired, ban: Kasztelan.shiftBan(), f: TownQuests.state().flags.borgarZwolnil })");
    t.check("...'Zejdź': down to the castle's ruins (Map010) - the shifts are gone ('Za bar nie wejdziesz'), the note", down && !!fired.fired && /Za bar nie wejdziesz/.test(fired.ban || "") && !!fired.f &&
        (await notes()).includes("Bez pracy u Borgara"), fired);
    // his watch at night (1-5): the cellar, not the bar
    await t.go(9, 14, 4, 6);
    await at(65, 2, 40);
    const post = await J("({ b: !!$gameMap.event(540) && !$gameMap.event(540).isTransparent() })");
    await t.go(1, 52, 31, 8);
    await at(65, 2, 40);
    const post2 = await J(`({ tr: ${BORGAR}.isTransparent(), away: Kasztelan.barAway() })`);
    t.check("the guard's nights (1-5): Borgar by the grate in the cellar, not at the bar", post.b && post2.tr && post2.away, { post, post2 });
    // after the siege of Act III he takes the hero back
    await t.eval("TownQuests.state().flags.act3Held = Tawerna.time.day(); 0");
    await at(65, 20, 40);
    const back = await talk(BORGAR, ["Borgarze... po tamtej nocy", "Nie teraz"]);
    const bk = await J("({ back: Kasztelan.state().back, ban: Kasztelan.shiftBan(), tr: " + BORGAR + ".isTransparent() })");
    t.check("after the siege (act3Held): 'Borgarze... po tamtej nocy?' - 'Wracaj za bar. Pilnujemy tej samej rzeczy' - the shifts are back",
        /Wracaj za bar/.test(back.text) && !!bk.back && bk.ban === null && !bk.tr && /Po oblężeniu Borgar przyjął mnie/.test(await W4ops()), { bk, t: back.text.slice(-200) });

    // ---- c) the prepared Borgar: Melia's song only for him (W3 b), his nights known from the Truth Layer (told now - W9's truth) - he comes
    await resetW4();
    await t.eval(`(function(){ const f = TownQuests.state().flags; f.w3Borgar = 1; f.w4Faster = 1; Underground.state().truths["76"] = { who: "borgar", floor: 76 }; TownQuests.autoChecks(); return 0; })()`);
    await J("Kasztelan.debugJump(7)");
    await t.go(1, 52, 31, 8);
    await at(66, 23.5);
    const pend = await J("Kasztelan.nightsPending()");
    const prep = await talk(BORGAR, ["Borgarze... chodzi", "Powiedz mu wszystko", "Chodź ze mną"]);
    const pp = await J("({ st: Kasztelan.stance(), step: Kasztelan.step(), closed: Kasztelan.state().closed, w9: (TownQuests.rec('W9') || { t: {} }).t.res, k: TownQuests.state().flags.borgarKnows, w: Underground.world().borgar })");
    t.check("c) prepared (the song only for him, W3 b): told everything - and his nights at the grate (the Truth Layer's page) in the same breath: no anger, no shut day",
        pend === true && /Co noc schodzisz do piwnicy/.test(prep.text) && /Melia śpiewała tylko dla mnie/.test(prep.text) && !/Jutro nie otwieram/.test(prep.text) && !pp.closed, { pend, t: prep.text.slice(0, 500) });
    t.check("...the grandmother's words, 'Krew ciągnie do kraty'; 'Chodź ze mną w dół' - he comes ('Kowale pilnują kluczy do końca'): W9's truth of Borgar told, he goes to the Heart (world().borgar)",
        /Pilnuj piwnicy i nie pytaj/.test(prep.text) && /Krew ciągnie do kraty/.test(prep.text) && /Kowale pilnują kluczy do końca/.test(prep.text) &&
        pp.st === "idzie" && pp.step === "w4Serce" && pp.w9 && pp.w9.borgar === "tell" && !!pp.k && pp.w === true && /Borgar zejdzie tam ze mną/.test(await W4ops()), pp);
    const a3b = await J("({ down: Act3Data.DOORS[1].down, hp: Act3Data.DEFENDERS.find(d => d.key === 'borgar').hp, start: Act3Data.DEFENDERS.find(d => d.key === 'borgar').lines.start })");
    t.check("Act III: Borgar who went down holds more (180) and knows what he defends", a3b.hp === 180 && a3b.down === 35 && /dziesiątym piętrze/.test(a3b.start), a3b);
    // his post at the tenth gate at night
    await t.go(140, 5, 13, 2);
    await at(67, 1.5, 60);
    const p10 = await J(`(function(){ const ids = [542, 543, 544].map(id => { const e = $gameMap.event(id); return e ? [e.x, e.y, e.isTransparent(), $gameMap.checkPassage(e.x, e.y, 15)] : null; }); return { ids }; })()`);
    t.check("the tenth gate (Map140) at 1:30: Borgar (542), his fire (543) and his basket (544) - on floor tiles, shown", p10.ids.every(x => x && !x[2] && x[3]), p10);
    await t.shot(path.join(SHOTS, "w4_posterunek_dziesiata_brama.png"));
    const pb = await talk("$gameMap.event(542)", []);
    const bread0 = await t.count(83);
    const bk1 = await talk("$gameMap.event(544)", []);
    const bread1 = await t.count(83);
    await t.popups({ clear: true });
    await talk("$gameMap.event(544)", []);
    const bkp = await t.popups();
    t.check("...Borgar at his fire ('Dziesiąta brama, ognisko, kosz z chlebem'); the basket: bread and water once a day ('Wracaj na górę. B.'), then empty",
        /Dziesiąta brama, ognisko/.test(pb.text) && /Wracaj na górę\. B\./.test(bk1.text) && bread1 === bread0 + 1 && bkp.some(p => /Kosz pusty/.test(p)), { pb: pb.text.slice(0, 100), bread0, bread1, bkp });
    await t.go(1, 52, 31, 8);
    await at(67, 1.6, 40);
    const away = await J(`({ tr: ${BORGAR}.isTransparent() })`);
    await at(67, 6, 40);
    const home = await J(`({ tr: ${BORGAR}.isTransparent() })`);
    t.check("...meanwhile the bar is empty (1-5); at 6:00 Borgar is back behind it", away.tr && !home.tr, { away, home });
    // 8: the Heart's ending - Borgar the guardian
    await t.eval("(function(){ Underground.state().ending = { kind: 'straznik', guardian: 'borgar', locks: 2, day: Tawerna.time.day() }; TownQuests.autoChecks(); return 0; })()");
    await t.frames(20);
    const end = await J("({ r: TownQuests.rec('W4').s, end: Kasztelan.state().end, ep: Kasztelan.epilogue('straznik', {}, 'borgar'), ep2: Kasztelan.epilogue('zniszczyc', {}, 'hero'), n: Journal.data().notes.find(n => n.title === 'Krew kasztelana') })");
    t.check("8. an ending of the Heart closes the arc: Borgar stayed the guardian - the note 'Krew kasztelana', no extra epilogue line (his own guardian lines); another ending: his fire at the tenth gate",
        end.r === "done" && end.end === "guardian" && end.ep === null && /dziesiątej bramie/.test(end.ep2 || "") && end.n && /strażnikiem Serca/.test(end.n.text), end);
    await t.eval("Underground.state().ending = null; 0");

    // ================================================================ F9: straight to each chapter
    const jumps = await J(`(function(){ const out = []; for (let i = 1; i <= 9; i++) { const g = Kasztelan.debugJump(i), r = TownQuests.rec('W4');
        out.push([i, g && g[0], r && r.step, Kasztelan.f9Name(i)]); } return out; })()`);
    t.check("F9 'W4: rozdział N' (1-8, the 7th twice): each puts W4 on its step and says where (steps 0, 1, 2, 4, 5, 6, 7, 8, 9)",
        jumps.map(j => j[2]).join() === "0,1,2,4,5,6,7,8,9" && jumps.every(j => j[1] > 0 && j[3]), jumps);
});
