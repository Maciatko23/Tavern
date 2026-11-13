// (CZĘŚĆ: sam wątek W23 - rozdziały, rozmowy, zapis; pełny test: morze_test.js) W23 „Coś z głębin” - potwory z morza i wątek (docs/POTWORY_Z_MORZA.md; js/plugins/Morze_Data.js, Morze.js, Morze_Potwory.js, js/teksty/morze.txt).
// Sprawdza: wtyczki, teksty, rejestr zdarzeń 4700-4799, rodzaje w Creatures, przedmioty; wzór szansy (p, mnożniki, dolna granica, sufit, statystyka 10 000 nocy);
// ziarno (to samo losowanie przy ponownym wejściu); tabelę rodzajów po dniach; lądowanie (znaki, wyjście z wody, ślady, powiadomienie), świt (odwrót do wody);
// strach przed ogniem, topielec / krab / rybołaki / mglak / wiedźma (pieśń i jej przerwanie), macki (kręgi, uderzenie, chwyt, odcięcie), miasto (straż),
// sen z potworem w 8 polach zablokowany, wątek W23 (rozdziały skokami F9), zapis i wczytanie, wydajność (pomiar nocy z 5 potworami przy 4x wolniejszym procesorze).
// Uruchom: GAME_OVERLAY=tools/potwory/overlay GAME_OVERLAY_JS=1 CDP_PORT=9950 node tests/morze_test.js
const kit = require("./lib/kit.js");
const SHOTS = "../docs/zadania_nowe/potwory_gra/";
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", port: Number(process.env.CDP_PORT) || 9950 }, async t => {
    const J = e => t.json(e);
    const night = (day, hour) => t.setDay(day, hour);
    const seaList = () => J(`MorzePotwory.seaList().map(c => ({ k: c._kind, x: c._x, y: c._y, mode: c._mode, hp: Math.round(c._hp), lv: c._level, scared: c._scared || 0, retreat: !!c._retreat }))`);
    const clearAll = () => t.eval(`(function(){ Creatures.clear("morze"); MorzePotwory.marks.clear(); MorzePotwory.tentacles.clear(); Morze.reset(); Morze.landing = null; return 0; })()`);
    const landNow = async (kind, frames = 420) => {
        const msg = await J(`Morze.force(${JSON.stringify(kind)})`);
        await t.frames(frames);
        return msg;
    };

    await t.newGame({ map: 125, x: 60, y: 70, hour: 22, day: 12 });
    // ---------------------------------------------------------------- J. wątek W23: początek, rozdziały, nagrody
    await clearAll();
    await t.eval(`(function(){ const s = Morze.state(); Object.assign(s, { start: 0, rybak: 0, slady: {}, zapisy: {}, zapisy3: {}, dzwon: 0, kleofas: 0, wiedzmaPokonana: 0, krakenNoc: 0, koniec: 0, wybor: "", straz: 0 }); return 0; })()`);
    await t.go(125, 60, 70, 2);
    await night(10, 7.0);
    await t.eval(`Morze.state().noce = {}; Tawerna.emit("hourChange", { hour: 7, prev: 6, day: 10 }); 0`);
    await t.frames(60);
    const sign = await J(`({ rybak: Morze.state().rybak, start: Morze.state().start, marks: MorzePotwory.marks.list().map(m => m.kind) })`);
    t.check("dzień 10 rano na Przystani: martwy rybak i mokre ślady (bez ataku), wątek rusza na pewno", sign.rybak === 10 && sign.start === 10 && sign.marks.includes("body") && sign.marks.filter(k => k === "track").length >= 8, sign);
    await t.eval(`TownQuests.autoChecks(); 0`);
    const q0 = await J(`(function(){ const r = TownQuests.rec("W23"); return r ? { s: r.s, step: r.step } : null; })()`);
    t.check("zadanie W23 w dzienniku (FABUŁA), krok 1 „Mokre ślady”", q0 && q0.s === "active" && q0.step === 0, q0);
    const names = ["w23Slady", "w23Dzwon", "w23Mgly", "w23Kronika", "w23Piesn", "w23Zapisy", "w23Kraken"];
    const jumpTo = [];
    for (let i = 1; i <= 7; i++) {
        const g = await J(`Watki.skocz("morze", ${i})`);
        await t.frames(10);
        const st = await J(`(function(){ const r = TownQuests.rec("W23"); const q = TownQuests.Q.W23; return r ? { step: r.step, name: q.steps[r.step] && q.steps[r.step].nazwa } : null; })()`);
        jumpTo.push([i, g && g[0], st && st.name]);
    }
    t.check("F9: skoki do siedmiu rozdziałów (kroki w23Slady ... w23Kraken)", jumpTo.every((x, i) => x[2] === names[i]), jumpTo);
    // chapters done by their conditions
    await t.eval(`(function(){ const s = Morze.state(); Object.assign(s, { zapisy3: {}, kleofas: 0, wiedzmaPokonana: 0, piesn: 0, piesnScena: 0, koniec: 0, krakenNoc: 0, wybor: "" }); const r = TownQuests.rec("W23"); r.s = "active"; r.step = 0; Watki.skocz("morze", 4); return 0; })()`);
    await t.frames(10);
    await t.eval(`(function(){ const s = Morze.state(); s.kleofas = 12; TownQuests.autoChecks(); return 0; })()`);
    const c4 = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.wiedzmaPokonana = 45; TownQuests.autoChecks(); return 0; })()`);
    const c5a = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.piesn = 45; TownQuests.autoChecks(); return 0; })()`);
    const c5 = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.zapisy3 = { garnizon: 1, lord: 1, kronika: 1 }; TownQuests.autoChecks(); return 0; })()`);
    const c6 = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.koniec = 1; TownQuests.autoChecks(); return 0; })()`);
    const done = await J(`TownQuests.rec("W23").s`);
    t.check("rozdziały 4-7 kończą się swoimi warunkami (kronika, pieśń - dopiero po rozmowie z Melią, zapisy, wybór przy Kraken) - zadanie ukończone", c4 === 4 && c5a === 4 && c5 === 5 && c6 === 6 && done !== "active", { c4, c5a, c5, c6, done });
    // hooks: the bell, the ink, the choice
    const hk = await J(`(function(){ const s = Morze.state(); s.dzwon = 0; s.koniec = 0; s.wybor = ""; s.straz = 0; const w = MorzeData.watek;
        w.akcja("wybor", ["odsunac"]); const a = { straz: s.straz, wybor: s.wybor }; const base = Morze.chance({ day: 30, map: 3, lightOut: false, lit: false, red: false, storm: false, favour: 0, ending: "" }).P;
        s.straz = 0; const base0 = Morze.chance({ day: 30, map: 3, lightOut: false, lit: false, red: false, storm: false, favour: 0, ending: "" }).P; return { a, base, base0 }; })()`);
    t.check("wybór „odsunąć wartę”: mnożnik x0,6 na stałe (szansa 30% -> 18%)", hk.a.straz === 1 && hk.a.wybor === "odsunac" && Math.abs(hk.base - 0.18) < 1e-6 && Math.abs(hk.base0 - 0.3) < 1e-6, hk);
    await t.eval(`(function(){ const s = Morze.state(); s.dzwon = 1; s.dzwonDzien = ${14}; return 0; })()`);
    const bell = await J(`({ on: Morze.bellOn(18), off: Morze.bellOn(30) })`);
    t.check("dzwon o zmierzchu: x0,85 przez 10 dni, potem znów trzeba smarować", bell.on && !bell.off, bell);
    // ---------------------------------------------------------------- K. zapis i wczytanie
    await t.eval(`(function(){ const s = Morze.state(); s.noce["999:3"] = { l: 1, k: "krab_olbrzym", c: 1, o: 0.3, sp: 1, left: 1, tr: null }; s.slady[125] = 10; return 0; })()`);
    t.saveTo(1);
    await t.frames(30);
    await t.eval(`(function(){ Morze.state().noce = {}; Morze.state().slady = {}; return 0; })()`);
    await t.loadFrom(1);
    const loaded = await J(`({ n: !!Morze.state().noce["999:3"], sl: Morze.state().slady[125] })`);
    t.check("zapis i wczytanie: losowania nocy, ślady i stan wątku zostają", loaded.n && loaded.sl === 10, loaded);


    // ---------------------------------------------------------------- M. rozmowy rozdziałów (talkFor: kto mówi w którym kroku)
    const plain = x => String(x || "").replace(/\SPK\[\d+\]/g, "").replace(/\s+/g, " ");
    async function rozmowa(key, picks) {
        await t.eval(kit.DRIVER + "; 0");
        const ok = await t.eval(`(function(){ const L = TownQuests.talkFor(${JSON.stringify(key)}); if (!L || !L.length) return false; const D = window.__drv; D.on = true;
            D.picks = ${JSON.stringify(picks || [])}; D.waiting = null; D.mark = D.log.length; D.cmark = D.choices.length; D.missing = [];
            $gameMap._interpreter.setup(L.concat([{ code: 0, indent: 0, parameters: [] }]), 0); return true; })()`);
        if (!ok) return { ok: false, text: "" };
        await t.frames(4);
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 40);
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark), missing: window.__drv.missing })");
        await t.eval("window.__drv.on = false; 0");
        return { ok: true, text: plain(out.log.map(l => l.t).join(" / ")), missing: out.missing };
    }
    await clearAll();
    await t.go(8, 51, 31, 2);
    await night(30, 11);
    const reset = (step, extra) => t.eval(`(function(){ const s = Morze.state(); Object.assign(s, { start: 1, slady: {}, zapisy: {}, zapisy3: {}, kleofas: 0, wiedzmaPokonana: 0, koniec: 0, piesn: 0 }, ${JSON.stringify(extra || {})}); const r = TownQuests.rec("W23") || TownQuests.start("W23"); r.s = "active"; r.step = ${step}; return 0; })()`);
    await reset(0);
    const tRoch = await rozmowa("przemytnik"), tOzzy = await rozmowa("ozzy"), tMelia = await rozmowa("melia");
    const z = await J("Morze.state().zapisy");
    t.check("rozdz. 1: Roch (ślady na plaży), Ozzy (plotka o dzwonie) i Melia (pieśń o „słuchających”) mówią swoje, raz każdy", tRoch.ok && /Ślady|ślady/.test(tRoch.text) && tOzzy.ok && /zabobon|dzwon/i.test(tOzzy.text) && tMelia.ok && /słuchających/.test(tMelia.text) && z.roch && z.ozzy && z.melia, { tRoch: tRoch.text.slice(0, 80), z });
    await reset(3);
    const tKl = await rozmowa("pustelnik", ["Przyniosę później"]);
    t.check("rozdz. 4: brat Kleofas (kaplica, Map008) pyta o atrament; bez niego „później”, nic nie ginie", tKl.ok && /atrament/i.test(tKl.text), tKl.text.slice(0, 120));
    await t.eval(`(function(){ const it = $dataItems.find(i => i && i.name === "Wodorost"); $gameParty.gainItem(it, 3); return 0; })()`);
    const tKl2 = await rozmowa("pustelnik", ["Mam wodorosty"]);
    const kl = await J(`({ k: Morze.state().kleofas, left: $gameParty.numItems($dataItems.find(i => i && i.name === "Wodorost")) })`);
    t.check("rozdz. 4: trzy wodorosty (wybór) - Kleofas robi atrament i czyta kroniki (utopieni z okrętu Rozbitka), wodorosty zabrane", tKl2.ok && kl.k > 0 && kl.left === 0, { text: tKl2.text.slice(0, 150), kl });
    await reset(5);
    await t.eval("Morze.state().zapisy3 = {}; 0");
    const tRot = await rozmowa("rotmistrz"), tLord = await rozmowa("lord"), tKr = await rozmowa("pustelnik");
    const z3 = await J("Morze.state().zapisy3");
    t.check("rozdz. 6: zapisy Zakonu od rotmistrza (lista), Lorda (pieśń pergamin z pieczęciami) i Kleofasa (kronika) - po jednym", tRot.ok && tLord.ok && tKr.ok && z3.garnizon && z3.lord && z3.kronika, { z3, r: tRot.text.slice(0, 80), l: tLord.ok, k: tKr.ok });
    await reset(4, { wiedzmaPokonana: 41 });
    const tMel = await rozmowa("melia");
    t.check("rozdz. 5: po przerwanej pieśni Melia dziękuje i oddaje zaufanie (muszla śpiewająca w plecaku)", tMel.ok && /muszl/i.test(tMel.text) && await J(`$gameParty.numItems($dataItems.find(i => i && i.name === "Muszla śpiewająca")) >= 1`), tMel.text.slice(0, 100));
});
