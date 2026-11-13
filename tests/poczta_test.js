// W20 „Kruczy listonosz” (docs/zadania_nowe/kruczy_listonosz.md; dane: js/plugins/Poczta_Data.js, kod: js/plugins/Poczta.js, teksty: js/teksty/poczta.txt).
// Gra cały wątek od startu do trzech zakończeń na nakładce:
//   GAME_OVERLAY=tools/listonosz/overlay GAME_OVERLAY_JS=1 node tests/run.js poczta_test --port 9920
const kit = (function(){ try { return require("./lib/kit.js"); } catch (e) { return require("../../../../tests/lib/kit.js"); } })();
const SHOTS = process.env.POCZTA_SHOTS || "poczta";

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const P = e => J("Poczta." + e);
    const st = () => J("Poczta.stan()");
    const rec = () => J(`TownQuests.rec("W20") || null`);
    const step = async () => { const r = await rec(); return r ? r.s + ":" + r.step : "brak"; };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.frames(frames || 40); };
    const popups = () => t.popups({ clear: true });
    const talk = (key, picks, o) => t.talkTo(`TownLife.eventOf(${JSON.stringify(key)})`, picks || [], Object.assign({ secs: 40 }, o || {}));

    const stol = `$gameMap.events().find(e => e.event().name === "Stół do sortowania listów")`;
    const takeAll = async () => {
        await t.go(214, 5, 9, 8);
        await t.frames(20);
        const r = await t.talkTo(stol, ["Weź listy do torby"], { secs: 40, place: false });
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy() && !Poczta.isModal()", 30);
        return r;
    };
    const visit = async (key, x, y) => {   // na mapie, na której stoi mieszkaniec (TownLife)
        const m = await J(`(function(){ const r = TownLife.RESIDENTS.find(x => x.key === ${JSON.stringify(key)}); return r && r.map ? r.map : 8; })()`);
        await t.go(m, x || 10, y || 10, 8); await t.frames(50);
        return m;
    };
    const tavernTalk = async (role, picks) => {
        const pend = await J("$gameMessage.allText()");
        if (pend) console.log("NOTE message pending before the tavern:", JSON.stringify(pend).slice(0, 200));
        await t.finish(40);
        await t.go(1, 52, 14, 8); await t.frames(40);
        const ok = await t.until(`$gameMap.mapId() === 1 && !!TavernLife.npc(${JSON.stringify(role)})`, 30);
        if (!ok) console.log("NOTE tavern: " + role + " not found:", JSON.stringify(await t.json("({ modal: Poczta.isModal(), ev: $gameMap.isEventRunning(), msg: $gameMessage.isBusy(), transferring: $gamePlayer.isTransferring(), scene: SceneManager._scene.constructor.name, map: $gameMap.mapId(), hr: $gameSystem.dayNightHour(), names: $gameMap.events().filter(e => /Melia|Grum/i.test(e.event().name)).map(e => e.event().name) })")));
        return t.talkTo(`TavernLife.npc(${JSON.stringify(role)})`, picks || ["Bywaj."], { secs: 60 });
    };
    const OD = Number(process.env.POCZTA_OD || 1);   // POCZTA_OD=N: zaczyna od etapu N (nowa gra, wątek na rozdziale N) - szybsze poprawki
    const przygotuj = async n => {
        await t.newGame({ map: 8, x: 112, y: 15, dir: 8, hour: 10, day: 13, quiet: true, minimap: false });
        await t.eval("TownQuests.state().flags.krukTame = 12; 0");
        await t.frames(130);
        await t.eval("Poczta.stan().start = 13; Poczta.stan().oath = 'przysiegam'; 0");
        await t.eval(`PocztaData.watek.skocz(${n}); (function(){ const s = Poczta.stan(); for (const l of PocztaData.LISTY.filter(l => l.ch < ${n})) { s.taken[l.id] = 13; s.done[l.id] = { day: 13, hour: 10, late: 0, opened: 0, how: "reka" }; }
            if (${n} >= 3) { s.bez = 25; s.bezCzytany = 0; s.gryta = "sasiadka"; }
            if (${n} >= 4) { s.noc = 30; s.rzecz = "plama"; s.clue = { wicek: 28, sambor: 29, baltazar: 29, cyryl: 28, rzecz: 30 }; }
            if (${n} >= 5) { s.baits = 34; s.s6 = 38; s.cyrylZnany = 38; } })(); 0`);
        await t.frames(30);
    };
    const etap1 = async () => {
    // ---------------------------------------------------------------- dane i start
    await t.newGame({ map: 8, x: 112, y: 15, dir: 8, hour: 10, day: 13, quiet: true, minimap: false });
    await t.frames(30);
    const b = await J(`({ plug: !!window.Poczta, q: !!TownQuests.Q.W20, steps: TownQuests.Q.W20 ? TownQuests.Q.W20.steps.length : 0, map214: !!$dataMapInfos[214],
        letters: PocztaData.LISTY.length, tooMany: PocztaData.LISTY.some(l => !l.to && l.special !== "bez") })`);
    t.check("wtyczka Poczta, zadanie W20 (5 kroków), mapa 214, listy w danych (26)", b.plug && b.q && b.steps === 5 && b.map214 && b.letters === 26 && !b.tooMany, b);

    // drzwi: bez oswojonego kruka zamknięte
    await t.eval("$gamePlayer.locate(112, 14); $gamePlayer.setDirection(8); 0");
    await t.hold("up", 70); await t.frames(20);
    const m0 = await J("$gameMap.mapId()");
    t.check("kruczarnia zamknięta, dopóki wątek nie ruszył (K51/D24)", m0 === 8 && (await step()) === "brak");
    await t.eval("TownQuests.state().flags.krukTame = 12; 0");
    await t.frames(130);
    t.check("po oswojeniu kruka, od dnia 12: W20 w dzienniku (krok 1)", (await step()) === "active:0", await rec());
    await t.shot(SHOTS + "/01_drzwi.png");
    await t.eval("$gamePlayer.locate(112, 14); $gamePlayer.setDirection(8); 0");
    await t.eval(kit.DRIVER + "; window.__drv.on = true; window.__drv.picks = ['Przysięgam.']; 0");
    await t.hold("up", 70);
    await t.until("$gameMap.mapId() === 214", 20);
    await t.frames(60);
    t.check("drzwi prowadzą do mapy 214 (Kruczarnia)", (await J("$gameMap.mapId()")) === 214);
    await t.until("$gameMap.isEventRunning() || $gameMessage.isBusy()", 15);
    await t.shot(SHOTS + "/02_wnetrze_gawron.png");
    await t.frames(80);
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 90);
    await t.eval("window.__drv.on = false; 0");
    const s1 = await st();
    t.check("pierwsze spotkanie: Gawron przyjmuje (start dnia 13), przysięga", s1.start === 13 && s1.oath === "przysiegam", s1);

    // ---------------------------------------------------------------- stół: rano o 6:30 wraca kruk z listem
    await t.eval("$gamePlayer.locate(5, 9); $gamePlayer.setDirection(8); 0");
    await t.frames(10);
    const tb = await J(`Poczta.onTable().map(l => l.id)`);
    t.check("o 10:00 dnia 13 na stole leży list Hanki (kruk wrócił o 6:30)", tb.join() === "l1_hanka", tb);
    const r1 = await t.talkTo(stol, ["Weź listy do torby"], { secs: 30, place: false });
    const s2 = await st();
    t.check("stół: „Weź listy do torby” - list Hanki w torbie", s2.bag.join() === "l1_hanka", { bag: s2.bag, text: r1.text });
    await t.eval("$gamePlayer.locate(14, 9); 0"); await t.frames(30);
    await t.shot(SHOTS + "/03_wieza.png");
    await t.eval("$gamePlayer.locate(5, 9); 0"); await t.frames(5);
    await P("torba()"); await t.frames(10);
    await t.shot(SHOTS + "/04_torba.png");
    t.check("klawisz B / Poczta.torba: okno torby otwarte", await J("Poczta.isModal()"));
    await t.key("Escape"); await t.frames(10);
    t.check("Esc zamyka okno torby", !(await J("Poczta.isModal()")));

    // ---------------------------------------------------------------- tydzień 1: pierwsza torba
    const gold0 = await t.gold();
    await at(13, 10);
    await t.go(8, 33, 61, 8); await t.frames(60);
    const op0 = await J("TownQuests.state().opinion");
    const h1 = await talk("piekarka", ["Masz list."]);
    const g1 = await t.gold(), op1 = await J("TownQuests.state().opinion");
    t.check("doręczenie Hance (rano, w oknie): „Masz list.” -> list oddany, 3 G, Opinia +1", (await st()).done.l1_hanka && !(await st()).done.l1_hanka.late && g1 - gold0 === 3 && op1 - op0 === 1 && (await st()).bag.length === 0, { text: h1.text.slice(0, 200), g: g1 - gold0, op: op1 - op0 });
    await t.shot(SHOTS + "/05_doreczenie_hanka.png");
    // dzień 14: dwa listy rano
    await at(14, 8);
    await takeAll();
    t.check("dzień 14, 8:00: dwa listy w torbie (kowal, dzwonnik)", (await st()).bag.join() === "l1_tadek,l1_ambrozy", (await st()).bag);
    await t.go(8, 8, 64, 8); await t.frames(40);
    await talk("kowal", ["Masz list."]);
    await t.go(8, 85, 32, 8); await t.eval("TownLife.hold && 0"); await t.frames(30);
    await talk("dzwonnik", ["Masz list."]);
    t.check("kowal i dzwonnik dostali listy w oknach godzin", !!(await st()).done.l1_tadek && !!(await st()).done.l1_ambrozy && !(await st()).done.l1_tadek.late, (await st()).done);
    await at(14, 18);
    await takeAll();
    await t.go(8, 51, 29, 8); await t.frames(30);
    await talk("kapral", ["Masz list."]);
    await at(15, 9);
    await takeAll();
    await t.go(8, 83, 50, 8); await t.frames(40);
    await talk("soltys", ["Masz list."]);
    t.check("kapral i sołtys: pięć listów doręczonych w tygodniu 1", Object.keys((await st()).done).filter(k => /^l1_/.test(k)).length === 5, Object.keys((await st()).done));
    await at(16, 9);
    const gt = await takeAll();
    t.check("list z innym woskiem: Gawron zauważa „trzeci taki w tym miesiącu” - poszlaka (wosk), notatka o zdrajcy", !!(await st()).clue.wosk && (await J("(Journal.data().notes || []).some(n => /czyta/.test(n.title))")), { clue: (await st()).clue, notes: await J("(Journal.data().notes || []).map(n => n.title)") });
    await t.go(8, 15, 87, 8); await t.frames(40);
    await talk("garbarz", ["Masz list."]);
    t.check("garbarz dostał list z innym woskiem", !!(await st()).done.l1_garbarz);
    await at(17, 18);
    await t.go(214, 5, 9, 8); await t.frames(20);
    const dz = await t.talkTo(stol, [], { secs: 30, place: false, keep: true });
    await t.frames(30);
    t.check("dzień 17, 17:30: kruk Stacha - Gawron podaje list, okno listu otwarte (czarno-żółta ramka)", await J("Poczta.isModal()"), dz.text.slice(0, 100));
    await t.shot(SHOTS + "/06_list_dziadka.png");
    await t.press("ok"); await t.frames(20); await t.press("ok"); await t.frames(20);
    await t.eval("window.__drv.on = false; 0");
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 20);
    await t.frames(60);
    t.check("tydzień 1 zakończony: list dziadka przeczytany, krok 2 aktywny", (await step()) === "active:1" && !!(await st()).done.l1_dziadek, { step: await step() });
    };
    const etap2 = async () => {
    // ---------------------------------------------------------------- tydzień 2: listy z frontu (dni 20-25)
    await at(20, 18);
    await takeAll();
    t.check("tydzień 2: Grum i Melia - dwa listy w torbie (kruki wróciły o 17:30)", (await st()).bag.join() === "l2_grum,l2_melia", (await st()).bag);
    await t.setHour(18.1);
    const mm = await tavernTalk("melia", ["Masz list.", "Bywaj."]);
    t.check("Melia dostała list od siostry (okno 17-21:30)", !!(await st()).done.l2_melia && !(await st()).done.l2_melia.late, { done: (await st()).done.l2_melia, text: mm.text.slice(0, 200), choices: mm.choices, missing: mm.missing, bag: (await st()).bag, step: await step() });
    await t.setHour(19.6);
    const gm = await tavernTalk("grum", ["Masz list.", "Bywaj."]);
    t.check("S3: Grum czyta list („Kruczek nie żyje”), doręczony w oknie 19-22", !!(await st()).done.l2_grum && !(await st()).done.l2_grum.late && /Kruczek/.test(gm.text), gm.text.slice(0, 200));
    await t.frames(240);
    await t.shot(SHOTS + "/07_grum.png");
    t.check("...scena S3 odegrana (dzień zapisany)", (await st()).sc.s3 === 20);
    await at(21, 8);
    await takeAll();
    await t.go(8, 33, 61, 8); await t.frames(50);
    await talk("piekarka", ["Masz list."]);
    await at(22, 10);
    await takeAll();
    t.check("list do zmarłej Gryty w torbie", (await st()).bag.includes("l2_gryta"), (await st()).bag);
    await visit("wdowa");
    const gw = await talk("wdowa", ["Masz list."]);
    t.check("Gryta (c): list oddany sąsiadce - nic nie przepada", (await st()).gryta === "sasiadka" && !(await st()).bag.includes("l2_gryta"), { gryta: (await st()).gryta, text: gw.text.slice(0, 150) });
    await at(23, 10);
    await takeAll();
    await t.go(8, 53, 53, 8); await t.frames(60);
    await talk("zosia", ["Masz list."]);
    await at(24, 8);
    await takeAll();
    await t.eval("Kruk.state().stage = 'tame'; 0");
    await t.go(214, 5, 9, 8); await t.frames(20);
    await t.talkTo(stol, ["Wyślij kruka z listem"], { secs: 30, place: false });
    t.check("kruk bohatera niesie list do Kleofasa (raz dziennie)", (await st()).done.l2_kleofas && (await st()).done.l2_kleofas.how === "kruk", (await st()).done);
    await at(25, 8);
    await takeAll();
    t.check("list bez adresata w torbie (Gawron: „Nie wyszedł z mojego stołu”)", !!(await st()).bez && (await st()).bag.includes("l2_bez"), (await st()).bag);
    await t.frames(60);
    t.check("tydzień 2 zakończony: krok 3 (Kto czyta?)", (await step()) === "active:2", await step());
    };
    const etap3 = async () => {
    // ---------------------------------------------------------------- pokusa (trzy przeczytane listy) i spóźnienie
    await at(27, 21.7);
    await t.eval("Poczta.stan().bag = ['l3_baltazar', 'l3_ozzy', 'l2_bez']; 0");
    await t.go(8, 33, 61, 8);
    for (const id of ["l3_baltazar", "l3_ozzy", "l2_bez"]) {
        await t.eval(`Poczta.czytaj(${JSON.stringify(id)}); 0`); await t.frames(30);
        if (id === "l3_baltazar") await t.shot(SHOTS + "/08_okno_listu.png");
        await t.press("escape"); await t.frames(20);
    }
    const sc = await st();
    t.check("pokusa: trzy przeczytane listy -> Gawron traci zaufanie (zaufanie 0)", sc.secrets === 3 && sc.trust === 0, { secrets: sc.secrets, trust: sc.trust });
    await t.eval("Poczta.stan().bag = ['l3_baltazar']; 0");
    await visit("kupiec", 16, 50);
    const gold1 = await t.gold();
    await talk("kupiec", ["Masz list."]);
    const late = (await st()).done.l3_baltazar;
    t.check("spóźnienie: list Baltazara o 20:30 - doręczony, ale spóźniony, pieczęć otwarta", !!late && late.late === 1 && late.opened === 1, late);

    // ---------------------------------------------------------------- tydzień 3: poszlaki i noc w kruczarni
    await at(28, 19);
    await visit("cyryl"); await talk("cyryl", ["Wypytaj o otwarte listy"]);
    await at(28, 18.3);
    await visit("wicek"); await talk("wicek", ["Wypytaj o otwarte listy"]);
    await at(29, 10);
    await visit("kupiec"); await talk("kupiec", ["Wypytaj o otwarte listy"]);
    await at(29, 18.2);
    await visit("celnik"); await talk("celnik", ["Wypytaj o otwarte listy"]);
    const cl = (await st()).clue;
    t.check("cztery rozmowy: poszlaki wicek, sambor, baltazar, cyryl", !!(cl.wicek && cl.sambor && cl.baltazar && cl.cyryl), cl);
    await at(30, 23.5);
    await t.go(214, 5, 9, 8); await t.frames(30);
    await t.talkTo(stol, ["Czuwaj do trzeciej"], { secs: 30, place: false });
    await t.frames(400);
    await t.shot(SHOTS + "/09_noc_kaptur.png");
    await t.until("!!window.Poczta.stan().noc && !$gameMap.isEventRunning()", 60);
    await t.frames(200);
    await t.shot(SHOTS + "/09b_noc_kaptur.png");
    const sn = await st();
    t.check("S5: noc w kruczarni - zdrajca o 3:10 upuszcza rzecz (zielony wosk albo rękaw), poszlaka", !!sn.noc && /zielony|plama/.test(sn.rzecz) && !!sn.clue.rzecz, { noc: sn.noc, rzecz: sn.rzecz });
    await t.frames(60);
    t.check("tydzień 3 zakończony: krok 4 (Pułapka z listów)", (await step()) === "active:3", await step());
    };
    const etap4 = async () => {
    // ---------------------------------------------------------------- tydzień 4: pułapka
    await at(34, 10);
    await t.go(214, 5, 9, 8); await t.frames(30);
    await t.talkTo(stol, ["Napisz listy-przynęty"], { secs: 40, place: false });
    const bagB = (await st()).bag;
    t.check("trzy listy-przynęty w torbie (Wicek, Sambor, Cyryl)", ["p_wicek", "p_sambor", "p_cyryl"].every(id => bagB.includes(id)), bagB);
    await at(34, 19);
    await visit("cyryl"); await talk("cyryl", ["Masz list."]);
    await at(35, 18.3); await visit("wicek"); await talk("wicek", ["Masz list."]);
    await at(35, 18.4); await visit("celnik"); await talk("celnik", ["Masz list."]);
    t.check("przynęty doręczone jako „pomyłka w torbie”", !!(await st()).done.p_cyryl && !!(await st()).done.p_wicek && !!(await st()).done.p_sambor, Object.keys((await st()).done).filter(k => /^p_/.test(k)));
    await at(38, 23.2);
    await t.go(214, 5, 9, 8); await t.frames(30);
    await t.talkTo(stol, ["Czekaj w cieniu pod wieżą"], { secs: 30, place: false });
    await t.until("window.Poczta.stan().s6 > 0", 60);
    await t.frames(120);
    await t.shot(SHOTS + "/10_przynieta.png");
    await t.frames(900);
    t.check("S6: trzecia noc - Cyryl oddaje paczkę człowiekowi w kapturze; zdrajca znany; krok 5", !!(await st()).s6 && (await step()) === "active:4", { s6: (await st()).s6, step: await step() });
    };
    const etap5 = async () => {
    // ---------------------------------------------------------------- tydzień 5: prawda i wybór (wydaj)
    await at(41, 2.6);
    await t.go(214, 5, 9, 8); await t.frames(30);
    await t.talkTo(stol, ["Czekaj na Cyryla (3:00)", "Wydaj Witowi."], { secs: 30, place: false, keep: true });
    await t.until("window.Poczta.stan().epilog > 0", 120);
    await t.frames(60);
    await t.shot(SHOTS + "/11_final.png");
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 60);
    await t.eval("window.__drv.on = false; 0");
    const fin = await st();
    t.check("finał (wydaj): wybór zapisany, epilog, poczta na stałe, wątek zakończony", fin.finale === "wydaj" && fin.epilog > 0 && fin.poczta > 0 && ((await rec()).s === "done"), { finale: fin.finale, rec: await rec() });
    t.check("flaga finału: listonoszWydany", await J("!!TownQuests.state().flags.listonoszWydany"));    };
    const etapy = [null, etap1, etap2, etap3, etap4, etap5];
    if (OD > 1) await przygotuj(OD);
    for (let n = OD; n <= 5; n++) await etapy[n]();
});
