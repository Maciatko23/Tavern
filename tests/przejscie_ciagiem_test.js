// Przejście gry jednym ciągiem (2026-10-24, decyzja gracza po audycie przejścia - docs/AUDYT_PRZEJSCIA.md): od prologu, przez rozdział 1
// (dług), kratę W4, strażnika 10. piętra, piętro 50 i oblężenie tawerny (Akt III), Księgę sygnałów (W2), aż do Komnaty Serca i
// zakończenia. Skróty czasu są dozwolone (Prologue.speed, setDay, Underground.go między bramkami, złoto za pozostałe zmiany po trzech
// zagranych), ale każda bramka między aktami jest prawdziwa i przechodzona rozmową / miejscem jak w grze:
//   1. spłata 2500 G u Lorda przed dworem kończy rozdział 1 (Story) - dopiero wtedy rusza W4;
//   2. klucz kasztelana (pół znad baru, pół z kopca, Tadek) otwiera kratę w piwnicy (Underground.open); Borgar daje hasło;
//   3. strażnik dziesiątej bramy przepuszcza na słowa kasztelana (przełącznik 14);
//   4. piętro 50 z otwartą kratą uzbraja Akt III w mieście (act3Armed), następnej nocy rusza oblężenie (act3Start);
//   5. cztery fale pokonane - Act3.outcome (held / costly), bez tego Serce nie zna wyniku napadu;
//   6. Księga sygnałów wzięta w Archiwum (W2 rozdz. 6) + klucz z W4 = dwa zamki z trzech, drzwi Komnaty otwarte; wybór przy Sercu,
//      epilog (z wynikiem oblężenia), bohater budzi się w tawernie.
// Poza smoke i full (SKIP_FULL w tests/run.js) - tylko na życzenie, ok. 10-15 min:
//   node tests/run.js przejscie_ciagiem_test --port 9684 --timeout 1500
const kit = require("./lib/kit.js");

kit.test({ port: 9684, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const talk = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 40 }, o || {})); if (!r.done) await t.finish(); return flat(r); };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const step = async id => { const r = await J(`TownQuests.rec(${JSON.stringify(id)})`); return r ? r.s + ":" + r.step : "none"; };
    const keyMs = async (code, id, key, ms) => {
        await t.b.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: id, key });
        await t.wait(ms || 80);
        await t.b.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, code: id, key });
        await t.wait(120);
    };
    // (no kit.newGame here - the game is started from the title like a player does; the kit's quiet settings by hand)
    t.settings = { calm: true, needsOff: true, quiet: true, minimap: false };
    // (the kit's quiet settings after every transfer switch Act3 off - on again after each one, as act3_test does)
    const go0 = t.go.bind(t);
    t.go = async (...a) => { const r = await go0(...a); await t.eval("if (window.Act3) Act3.auto(true); 0"); return r; };

    // ===================================================================== 0. prolog „Ostatni prom”
    const titleReady = "(SceneManager._scene instanceof Scene_Title && window.TitleScreen && TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active)";
    const onName = "(window.Prologue && Prologue.info() && Prologue.info().screen === 'name')";
    const onFilm = "(window.Prologue && Prologue.info() && Prologue.info().screen === 'film')";
    const onHouse = "(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && $gameMap.mapId() === 19)";
    await t.until(titleReady, 30);
    await t.frames(20);
    await keyMs(79, "KeyO", "o");   // „Nowa gra”
    const named = await t.until(onName, 15);
    // (Enter on the empty field = „Reid”; the screen takes a moment to listen - pressed again when the film has not started)
    let film = false;
    for (let i = 0; i < 4 && !film; i++) { await t.frames(30); await t.key("Enter"); film = await t.until(onFilm, 6); }
    if (!film) { for (const ch of "Reid") { await t.b.send("Input.dispatchKeyEvent", { type: "keyDown", key: ch, text: ch, unmodifiedText: ch }); await t.b.send("Input.dispatchKeyEvent", { type: "keyUp", key: ch }); await t.frames(3); } await t.key("Enter"); film = await t.until(onFilm, 10); }
    await t.eval("Prologue.speed(10); 0");
    await t.eval(kit.DRIVER + "; 0");
    await t.eval("window.__drv.on = true; window.__drv.picks = []; 0");   // (the talks that start by themselves - the intro - go on)
    const landed = await t.until(onHouse, 300);
    const run = await J("window.Prologue ? Prologue.lastRun : null");
    t.check("prolog: „Nowa gra” → imię (puste = Reid) → film sześciu scen → dom dziadka (Map019)",
        named && film && landed && run && JSON.stringify(run.log) === JSON.stringify(["kronika", "wies", "chata", "port", "sztorm", "plaza"]) && (await t.eval("$gameActors.actor(1).name()")) === "Reid", { named, film, landed, log: run && run.log });

    // ===================================================================== 1. rozdział 1: intro, działka, Borgar, zmiany, spłata
    const introDone = await t.until("$gameSystem._story && $gameSystem._story.intro === 2 && !$gameMap.isEventRunning() && !$gameMessage.isBusy()", 120);
    await t.calm();
    await t.frames(20);
    const s0 = await J("Story.state()");
    t.check("rozdział 1: intro dziadka przeszło samo - dług 2500 do dnia 60, nic nie spłacone", introDone && s0 && s0.intro === 2 && s0.debt === 2500 && s0.paid === 0 && s0.deadline === 60, s0 && { intro: s0.intro, debt: s0.debt, paid: s0.paid, deadline: s0.deadline });
    await t.go(3, 26, 17, 2);
    await t.frames(40);
    t.check("działka dziadka (Map003 „Kruczy Jar”): krok „field” odhaczony", !!(await J("Story.state().flags.field")));
    await t.go(1, 52, 31, 8);
    await at(2, 10, 30);
    const hire = await talk("Story.borgarEvent()", []);
    t.check("tawerna o 10:00: Borgar najmuje bohatera (flaga hired)", hire.done && !!(await J("Story.state().flags.hired")), hire.text.slice(0, 160));
    // three evening shifts played for real (TavernShift's test hook: every part skipped with a score of 90, O on the cards)
    const shiftHook = `(function(){ window.__shiftT = 0; if ($gameSystem.setStamina) $gameSystem.setStamina(100);
        TavernShift.onTick = function(scene) { const st = TavernShift.state(), I = Input._currentState; I.ok = false; if (!st) return;
            if (st.phase === "play") TavernShift.skip(90); else if (++window.__shiftT % 8 === 0) I.ok = true; }; return 0; })()`;
    let shifts = 0, earned = 0, lastShift = null;
    for (let d = 2; d <= 4; d++) {
        await at(d, 16.5, 20);
        await t.eval(shiftHook);
        const g0 = await t.gold();
        const sh = await talk("Story.borgarEvent()", ["Weź zmianę"], { secs: 150 });
        await t.eval("TavernShift.onTick = null; Input._currentState.ok = false; 0");
        const g1 = await t.gold();
        lastShift = { day: d, done: sh.done, gold: g1 - g0, choices: sh.choices[0] };
        if (sh.done && g1 > g0) { shifts++; earned += g1 - g0; }
    }
    t.check("trzy wieczorne zmiany u Borgara (dni 2-4) zagrane i zapłacone (TavernShift)", shifts === 3 && earned > 0, { shifts, earned, lastShift });
    // the other ~35 shifts: a shortcut of time - their gold straight into the purse; the payment itself is the real one
    await t.eval("$gameParty.gainGold(2500); 0");
    await t.go(24, 1, 15, 6);
    await at(30, 10, 40);
    await t.eval("(function(){ const e = $gameMap.event(902); $gamePlayer.locate(e.x - 1, e.y + 3); $gamePlayer.setDirection(8); return 0; })()");
    const pay = await talk("$gameMap.event(902)", ["Spłać cały dług"], { secs: 90 });   // (with the whole sum in the purse the row says "Spłać cały dług (2500 G)")
    const s1 = await J("({ paid: Story.state().paid, done: Story.state().done, ended: Story.chapterEnded(), gold: $gameParty.gold() })");
    t.check("BRAMKA 1: spłata 2500 G u Lorda przed dworem - rozdział 1 zakończony (Story.chapterEnded), Lord o drzwiach pod Kruczymi Skałami",
        pay.done && s1.paid === 2500 && !!s1.done && s1.ended && /drzwi|Kruczymi Skałami/i.test(pay.text), { s1, text: pay.text.slice(-300) });

    // ===================================================================== 2. W4: klucz kasztelana otwiera kratę
    await t.eval("TownQuests.autoChecks(); 0");
    await t.frames(30);
    t.check("W4 „Krew kasztelana” rusza sam po spłacie", (await step("W4")) === "active:0", await step("W4"));
    await t.go(1, 52, 31, 8);
    await at(31, 11, 30);
    const b1 = await talk("$gameMap.event(1)", ["Zapytaj o stare kamienie", "Nie teraz"]);
    t.check("a. Borgar przy barze: pół klucza znad baru „na szczęście”", (await J("TownQuests.vcount('klucz_borgar')")) === 1 && (await step("W4")) === "active:1", { step: await step("W4"), text: b1.text.slice(0, 200) });
    await t.go(20, 8, 7, 8);
    await at(31, 13, 30);
    await t.give(62, 1);   // (the stone spade - normally the workbench's)
    const dig = await talk("$gameMap.event(951)", [], { place: false });
    t.check("b. kopiec z krukiem na podwórzu dziadka: druga połowa klucza wykopana", (await J("TownQuests.vcount('klucz_kopiec')")) === 1 && (await step("W4")) === "active:2", { step: await step("W4"), text: dig.text.slice(0, 160) });
    await t.go(8, 9, 64, 4);
    await at(32, 10, 40);
    await t.eval("(function(){ const s = TownQuests.state(); for (const q of TownQuests.QUESTS) if (q.giver === 'kowal' && !s.q[q.id]) s.q[q.id] = { s: 'done', step: 0, day: 1, sday: 1, end: 1, t: { done: {} }, times: 1 }; return 0; })()");   // (Tadek's own offers out of the way)
    await t.give(86, 1);
    await t.give(79, 2);
    const tk = await talk("TownLife.eventOf('kowal')", []);
    await at(33, 8, 40);
    const tk2 = await talk("TownLife.eventOf('kowal')", []);
    t.check("c. Tadek łączy połówki (żelazo, węgiel), nazajutrz rano - Klucz kasztelana", (await J("TownQuests.vcount('klucz_kasztelana')")) === 1 && (await step("W4")) === "active:4", { step: await step("W4"), tk: tk.text.slice(-160), tk2: tk2.text.slice(-160) });
    await t.go(9, 15, 3, 8);
    await t.frames(20);
    const g2 = await talk("$gameMap.event(7)", [], { place: false });
    const open = await J("({ open: Underground.isOpen(), sw: $gameSwitches.value(11) })");
    t.check("BRAMKA 2: klucz kasztelana otwiera kratę w piwnicy tawerny (Underground.open, przełącznik 11)", open.open && open.sw && (await step("W4")) === "active:5", { open, step: await step("W4"), text: g2.text.slice(-160) });
    await t.go(1, 52, 31, 8);
    await at(33, 12, 30);
    const b2 = await talk("$gameMap.event(1)", ["Krata w piwnicy", "Nie teraz"]);
    t.check("d. Borgar: „Nie pytam o to, czego nie chcę wiedzieć” - hasło strażnika (borgarSaying), W4 idzie w rozdział 6", !!(await J("TownQuests.state().flags.borgarSaying")) && /Nie pytam o to, czego nie chcę wiedzieć/.test(b2.text), b2.text.slice(-200));

    // ===================================================================== 3. podziemia: strażnik dziesiątej bramy, piętro 50
    await t.eval("Underground.go(10); 0");   // (floors 1-9: a shortcut of time)
    await t.until(t.onMap(140), 20);
    await t.frames(20);
    const gid = await t.eval(`$gameMap.events().find(e => e.event().name === "Pusta zbroja strażnika").eventId()`);
    await t.locate(19, 16, 8);
    await t.hold("up", 16);
    const woke = await t.until("$gameMap.isEventRunning() && $gameMap._interpreter.eventId() === " + gid, 8, 50);
    await t.finish();
    const right = await talk(gid, ["Nie pytam"]);
    const gate = await J(`({ gate: $gameSwitches.value(14), pass: $gameMap.eventsXy(19, 12).every(e => e.isThrough() || !e.isNormalPriority()) })`);
    t.check("BRAMKA 3: strażnik dziesiątej bramy budzi się na linii; słowa kasztelana otwierają bramę (przełącznik 14)", woke && gate.gate && gate.pass && /SŁOWA KASZTELANA/.test(right.text), { woke, gate, text: right.text.slice(-200) });
    await t.eval("Underground.go(50); 0");   // (floors 11-49: a shortcut)
    await t.until(t.onMap(149), 20);
    await t.frames(30);
    const deep = await J("({ deepest: Underground.deepest(), open: Underground.isOpen(), map: $gameMap.mapId() })");
    t.check("piętro 50 „Przekop kopaczy” osiągnięte z otwartą kratą (najgłębsze piętro = 50)", deep.deepest >= 50 && deep.open && deep.map === 149, deep);

    // ===================================================================== 4. Akt III: uzbrojenie w mieście, noc napadu, cztery fale
    await t.eval(`(function(){ window.__bus = []; for (const n of ['act3Armed', 'act3Start', 'act3Done']) Tawerna.on(n, e => __bus.push(Object.assign({ n }, e)), { owner: 'Ciag' });
        Act3.auto(true); Combat.gainXp(6000, 'test'); $gameParty.leader().recoverAll(); Act3.DATA.PACE.gap = 40; Act3.DATA.PACE.firstGap = 30;
        if (window.TownQuests) TownQuests.bellOpts = { bot: 'target' }; return 0; })()`);
    await t.go(8, 51, 19, 8);
    await t.frames(80);
    const armed = await J("({ ph: Act3.phase(), sd: Act3.state().siegeDay, d: $gameSystem.dayNightDay(), n: __bus.filter(b => b.n === 'act3Armed').length })");
    t.check("BRAMKA 4: po piętrze 50 w miasteczku - Akt III uzbrojony (act3Armed), napad zaplanowany na następną noc", armed.ph === "armed" && armed.sd === armed.d + 1 && armed.n === 1, armed);
    await t.eval("$gameSystem._dayNightDay = Act3.state().siegeDay; $gameSystem.setDayNightHour(22); 0");
    await t.frames(60);
    const started = await t.until("Act3.phase() === 'siege'", 40);
    t.check("noc napadu na mapie miasta: oblężenie rusza (act3Start), lina dzwonu pod dzwonnicą", started && (await J("__bus.filter(b => b.n === 'act3Start').length")) === 1 && !!(await J("$gameMap.event(859)")), { started });
    // the hero kept on his feet (the archers shoot him from afar); the bell rung by himself (nobody trusts him yet); the waves beaten
    // one after another (Act3.clearWave - the fight itself is Humans.js's, tested in act3_test / humans_test)
    await t.eval("window.__god = setInterval(() => { if ($gameParty.leader()) $gameParty.leader().recoverAll(); }, 100); 0");
    await t.frames(200);
    await t.eval("Act3.bellRope(); 0");
    const rung = await t.until("Act3.siege() && Act3.siege().bell === 'hero'", 60);
    await t.until(t.onMap(8), 20);
    t.check("dzwon „trzy i jeden” zabity przez bohatera (mini-gra dzwonu z liny)", rung, await J("Act3.siege() && Act3.siege().bell"));
    const clearWave = async () => {
        await t.until("(function(){ const s = Act3.siege(); if (!s) return true; const W = s.waves[s.wave]; return !W || W.state !== 'pending' && (W.spawned || W.state !== 'live') && Act3.members(s.wave).length > 0 || (W && W.state === 'breached'); })()", 90);
        await t.eval("Act3.clearWave(); 0");
        await t.frames(70);
    };
    await clearWave();
    await clearWave();
    const outside = await t.until("Act3.siege() && Act3.siege().wave >= 2", 60);
    t.check("dwie fale na mapie miasta pokonane - napastnicy idą do środka", outside, await J("Act3.siege() && { wave: Act3.siege().wave, damage: Math.round(Act3.siege().damage) }"));
    await t.go(1, 50, 52, 8, { calm: false });   // (not the kit's calm: it clears Humans.js's men - the wave coming in)
    await t.frames(30);
    await clearWave();
    await clearWave();
    const done3 = await t.until("Act3.phase() === 'done'", 90);
    await t.eval("clearInterval(window.__god); window.__god = null; 0");
    const out = await J("({ out: Act3.outcome(), held: !!TownQuests.state().flags.act3Held, costly: !!TownQuests.state().flags.act3Costly, bus: __bus.filter(b => b.n === 'act3Done').map(b => b.result) })");
    t.check("BRAMKA 5: cztery fale pokonane - oblężenie rozstrzygnięte: Act3.outcome held / costly, flaga, szyna act3Done",
        done3 && out.out && ["held", "costly"].includes(out.out.result) && (out.held || out.costly) && out.bus.length === 1, { done3, out: out.out && { result: out.out.result, defenders: out.out.defenders, damage: out.out.damage }, bus: out.bus });
    await t.frames(120);

    // ===================================================================== 5. zamki Serca: klucz (W4) i Księga sygnałów (W2 rozdz. 6, Archiwum)
    await t.eval("(function(){ const s = TownQuests.state(); s.flags.gardenKey = 9; s.flags.bellKey = 9; TownQuests.start('W2', 8); return 0; })()");   // (W2 rozdz. 1-5: a shortcut to the Archive step)
    await t.go(119, 6, 7, 8);
    await t.frames(30);
    await t.eval("TownQuests.syncSpots(); 0");
    await t.frames(10);
    const book = await talk("$gameMap.event(951)", [], { place: false });
    const lk = await J("Underground.locks()");
    t.check("W2 rozdz. 6: Księga sygnałów wzięta w Archiwum zakonu (signalBook) - zamek sygnału znany, zamek klucza znany z W4, pieśni (W3) nie",
        /Dzwon mówi|Księga/.test(book.text) && !!(await J("TownQuests.state().flags.signalBook")) && lk.keyKnown && lk.signalKnown && !lk.songKnown, { lk, text: book.text.slice(0, 200) });

    // ===================================================================== 6. Komnata Serca: dwa zamki z trzech, wybór, epilog
    await t.eval("Underground.shortcut(false); Underground.go(100); 0");   // (floors 51-99: a shortcut)
    await t.until(t.onMap(11), 20);
    await t.frames(30);
    const id100 = n => t.eval(`$gameMap.events().find(e => e.event().name === ${JSON.stringify(n)}).eventId()`);
    const keyYes = await talk(await id100("Zamek z krukiem"), []);
    const bell = await talk(await id100("Kamienny dzwon"), ["Siedem"]);
    await t.frames(10);
    const l2 = await J("Underground.locks()");
    t.check("BRAMKA 6: Komnata Serca - klucz kasztelana w zamku z krukiem, siedem uderzeń w kamienny dzwon: dwa zamki z trzech, drzwi otwarte",
        /Klucz kasztelana wchodzi/.test(keyYes.text) && /Siedem uderzeń/.test(bell.text) && l2.open === 2 && l2.door, { l2, key: keyYes.text.slice(-120), bell: bell.text.slice(-120) });
    const heartId = await id100("Serce Twierdzy");
    await t.locate(15, 8, 8);
    await t.eval("Underground.film.setSpeed(0.25); 0");
    const end = await t.talkTo(heartId, ["Zapieczętować", "Tak", "Wrócić"], { place: false, secs: 420 });
    let back = false;   // (the hero slept till the morning: the day's summary opens by itself - closed first)
    for (let i = 0; i < 8 && !back; i++) { await t.dismiss(); back = await t.until(t.onMap(1) + " && !$gameTemp._pendingSummary", 5); }
    await t.dismiss();
    await t.frames(30);
    const fin = await J("(function(){ const w = Underground.world(); return { ending: Underground.state().ending, map: $gameMap.mapId(), siege: w.siege && w.siege.result, debtPaid: w.debtPaid, book: w.book }; })()");
    t.check("zakończenie „Zapieczętować z zasadami”: epilog z KONIEC, bohater budzi się w tawernie, zakończenie zapisane (2 zamki); świat epilogu zna spłatę, Księgę i wynik oblężenia",
        back && /KONIEC/.test(end.text) && fin.ending && fin.ending.kind === "zapieczetowac" && fin.ending.locks === 2 && fin.map === 1 && fin.debtPaid && fin.book && ["held", "costly"].includes(fin.siege),
        { back, fin: { kind: fin.ending && fin.ending.kind, locks: fin.ending && fin.ending.locks, map: fin.map, siege: fin.siege, debtPaid: fin.debtPaid, book: fin.book }, done: end.done, missing: end.missing, text: end.text.slice(-300) });
});
