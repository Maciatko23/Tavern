// W20 „Kruczy listonosz”: warianty i skróty (całą linię od startu gra poczta_test.js): trzy zakończenia finału, cztery wyjścia z listem do
// zmarłej Gryty, drzwi nocą, F9 (wiersze i skoki), przelot kruka z listem (S1), kruki na żerdziach.
//   GAME_OVERLAY=tools/listonosz/overlay GAME_OVERLAY_JS=1 node tests/run.js poczta_warianty_test --port 9921
const kit = (function(){ try { return require("./lib/kit.js"); } catch (e) { return require("../../../../tests/lib/kit.js"); } })();
const SHOTS = process.env.POCZTA_SHOTS || "poczta";

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const st = () => J("Poczta.stan()");
    const rec = () => J(`TownQuests.rec("W20") || null`);
    const step = async () => { const r = await rec(); return r ? r.s + ":" + r.step : "brak"; };
    const stol = `$gameMap.events().find(e => e.event().name === "Stół do sortowania listów")`;
    // a fresh game with W20 begun: the hero in the Kruczarnia, Gawron met (start 13), the quest at chapter n (1-5)
    const fresh = async (chapter, o = {}) => {
        await t.newGame({ map: 8, x: 112, y: 15, dir: 8, hour: o.hour || 10, day: o.day || 40, quiet: true, minimap: false });
        await t.eval("TownQuests.state().flags.krukTame = 12; 0");
        await t.frames(130);
        await t.eval("Poczta.stan().start = 13; Poczta.stan().oath = 'przysiegam'; 0");
        await t.eval(`PocztaData.watek.skocz(${chapter}); (function(){ const s = Poczta.stan(); for (const l of PocztaData.LISTY.filter(l => l.ch < ${chapter} || l.special === "dziadek")) { s.taken[l.id] = 13; s.done[l.id] = { day: 13, hour: 10, late: 0, opened: 0, how: "reka" }; } })(); 0`);
        await t.frames(20);
        await t.go(o.map || 214, o.x || 5, o.y || 9, 8); await t.frames(40);
    };

    // ---------------------------------------------------------------- F9 i skoki
    await fresh(1, { day: 14, hour: 8 });
    const f9 = await J(`(function(){ const s = Watki.f9.sekcje().filter(x => x.watek === "poczta"); return { n: s.length, rows: s.map(x => x.rows.map(r => r.label)), kinds: s.map(x => x.rows.map(r => r.kind)) }; })()`);
    t.check("F9: sekcja wątku W20 - wiersze „Torba”, „Czas”, „Zdrajca” i skok do rozdziału", f9.n === 2 && f9.rows[0].length === 3 && f9.rows[1].length === 1, f9);
    const j = await J(`(function(){ const s = Watki.f9.sekcje().find(x => x.watek === "poczta" && x.rows[0].pick); const g = Watki.f9.ok(s.rows[0]); return g; })()`);
    t.check("F9: skok do rozdziału 1 -> idzie do kruczarni", Array.isArray(j.go) && j.go[1] === 214, j);
    const r1 = await J(`Watki.f9.ok(Watki.f9.sekcje().find(x => x.watek === "poczta" && !x.rows[0].pick).rows[0])`);
    t.check("F9: „Torba: 6 listów” dodaje listy do torby", /Do torby/.test(r1.say || "") && (await st()).bag.length > 0, r1);

    // ---------------------------------------------------------------- drzwi nocą
    await fresh(1, { day: 20, hour: 23, map: 8, x: 112, y: 15 });
    await t.setHour(23); await t.frames(20);
    await t.eval("$gamePlayer.locate(112, 14); $gamePlayer.setDirection(8); 0");
    await t.hold("up", 70); await t.frames(30);
    t.check("drzwi kruczarni w nocy zamknięte (rozdział 1: Gawron śpi)", (await J("$gameMap.mapId()")) === 8);
    await t.eval("PocztaData.watek.skocz(3); $gamePlayer.locate(112, 14); $gamePlayer.setDirection(8); 0");
    await t.setHour(23); await t.frames(10);
    await t.hold("up", 70); await t.until("$gameMap.mapId() === 214", 20);
    t.check("od rozdziału 3 drzwi w nocy otwarte (nocna warta)", (await J("$gameMap.mapId()")) === 214);

    // ---------------------------------------------------------------- S1: kruk z listem nad miastem (6:30)
    await fresh(1, { day: 20, hour: 6.2, map: 8, x: 50, y: 56 });
    await t.setDay(21, 6.2); await t.frames(30);
    await t.eval("Poczta.stan().arrivals = {}; 0");
    await t.setHour(6.7);
    await t.frames(150);
    const fl = await J("({ fly: !!window.__pf, arr: Object.keys(Poczta.stan().arrivals) })");
    await t.shot(SHOTS + "/12_przelot.png");
    await t.frames(90);
    await t.shot(SHOTS + "/12_przelot_b.png");
    t.check("S1: rano o 6:30 kruki wróciły - zapisane, napis u góry", fl.arr.length === 1, fl);

    // ---------------------------------------------------------------- Gryta: grób, Kleofas, odesłanie
    await fresh(2, { day: 22, hour: 19 });
    await t.eval("Poczta.stan().bag = ['l2_gryta']; 0");
    await t.go(8, 8, 28, 8); await t.frames(40);
    const op0 = await J("TownQuests.state().opinion");
    await t.talkTo("$gameMap.event(4401)", ["Przeczytaj na grobie"], { secs: 30 });
    await t.frames(1700);
    const g1 = await st(), op1 = await J("TownQuests.state().opinion");
    t.check("Gryta (a): list na grobie (scena S4), Opinia +3, nic nie przepada", g1.gryta === "grob" && !g1.bag.includes("l2_gryta") && op1 - op0 === 3, { gryta: g1.gryta, op: op1 - op0 });
    await t.shot(SHOTS + "/13_grob.png");
    await t.eval("Poczta.stan().bag = ['l2_gryta']; Poczta.stan().gryta = ''; 0");
    await t.go(8, 8, 17, 8); await t.frames(60);
    await t.setHour(10); await t.frames(60);
    const kl = await t.talkTo("TownLife.eventOf('pustelnik')", ["Masz list."], { secs: 40 });
    t.check("Gryta (b): list zaniesiony Kleofasowi (zapisze w księdze zmarłych)", (await st()).gryta === "kleofas", { gryta: (await st()).gryta, text: kl.text.slice(0, 120) });
    await t.eval("Poczta.stan().bag = ['l2_gryta']; Poczta.stan().gryta = ''; 0");
    await t.go(214, 5, 9, 8); await t.frames(30);
    await t.talkTo(stol, ["Odeślij list nadawcy"], { secs: 30, place: false });
    t.check("Gryta (d): odesłany nadawcy (kruk wraca z „adresat nie żyje”)", (await st()).gryta === "odeslij" && !(await st()).bag.includes("l2_gryta"), (await st()).gryta);

    // ---------------------------------------------------------------- kruki na żerdziach: pięć, poruszają się
    await fresh(1, { day: 20, hour: 11 });
    const rv = await J(`$gameMap.events().filter(e => /^Żerdź \\(kruk/.test(e.event().name)).map(e => ({ x: e.x, y: e.y }))`);
    t.check("pięć żerdzi z krukami w wieży", rv.length === 5, rv);
    await t.eval("$gamePlayer.locate(14, 8); 0"); await t.frames(60);
    await t.shot(SHOTS + "/13_wnetrze_dzien.png");

    // ---------------------------------------------------------------- finał: trzy wyjścia
    for (const [pick, key, flag] of [["Przestaw go.", "przestaw", "listonoszFalszywe"], ["Niech ucieka promem.", "uciekaj", "listonoszUciekl"], ["Wydaj Witowi.", "wydaj", "listonoszWydany"]]) {
        await fresh(5, { day: 41, hour: 2.6 });
        const g0 = await t.gold();
        await t.talkTo(stol, ["Czekaj na Cyryla (3:00)", pick], { secs: 30, place: false, keep: true });
        await t.until("window.Poczta.stan().epilog > 0", 120);
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 60);
        await t.eval("window.__drv.on = false; 0");
        await t.frames(40);
        const s = await st();
        if (key === "wydaj") await t.shot(SHOTS + "/11_final.png");
        const cyrylGone = await J("TownLife.gone('cyryl')");
        t.check("finał (" + key + "): wybór zapisany, flaga " + flag + ", 60 G, wątek zakończony", s.finale === key && (await J(`!!TownQuests.state().flags.${flag}`)) && (await rec()).s === "done" && (await t.gold()) - g0 >= 60, { finale: s.finale, step: await step() });
        t.check("...Cyryl " + (key === "przestaw" ? "zostaje na stanowisku" : "znika z miasta"), key === "przestaw" ? !cyrylGone : !!cyrylGone, { gone: cyrylGone });
        if (key === "wydaj") t.check("...Wit wdzięczny: przychylność garnizonu rośnie", (await J("Garnizon.favor()")) >= 10, await J("Garnizon.favor()"));
    }
});
