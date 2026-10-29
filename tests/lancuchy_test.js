// Podróżni z promu - etap 4: łańcuchy W15 „Święte kości” i W16 „Dezerter” (docs/PODROZNI.md 4.2-4.4; js/plugins/SwieteKosci_Data.js +
// SwieteKosci.js, Dezerter_Data.js + Dezerter.js, js/teksty/swiete_kosci.txt, dezerter.txt). Sprawdza:
//   - wtyczki na swoich miejscach (dane pod Podroznicy_Data, nad TownLife i TownQuests_Data; silniki pod Podroznicy), teksty wczytane bez
//     błędów, zadania W15 i W16 w TownQuests (paczki), rejestr numerów (Lancuchy 3050-3069), sekcje F9 obu wątków
//   - Akt III: wiedza frakcji (kamienBaltazar) - najwyżej jeden zwiadowca w fali 3, nie sumuje się z w9FrakcjaWie, nic przy
//     w9FrakcjaPobita; tymonGarnizon - żołnierze królewscy przy przychylności 60 (i Tymon z nimi); tymonOboz - Tomek obok Rafała
//   - W15 od początku: Gaspar na wyspie (dzień 13), pierwsza rozmowa - wątek; medalik z menu Gaspara; kazanie w dniu targowym (14);
//     dwie opinie o kościach (Ignac, Tadek z medalikiem); brat Augustyn; noc sprzedaży - kurier na piętrze (dowód); skrzynka na rynku
//     (Gaspar zdemaskowany, kamień i spis); kamień dla Ambrożego (ambrozyTrust), spis dla Augustyna; pożegnanie - 25 G, Sława +3
//   - W15 skokami F9: działka (30 G, kamienBaltazar - zwiadowca w fali 3); zakończenie bez bohatera (Gaspar odpływa - zadanie przepada)
//   - W16 skokami F9: rozmowa o północy w pokoju 5 (zaufanie - zdanie o chorągwi brzozowskiej, notatka), kryjówka w dzwonnicy (Tymon
//     poza księgą, jego zdarzenie w dzwonnicy), odpływ Szczerby - szukała i nie znalazła (tymonOboz); rotmistrz Bełza (tymonGarnizon,
//     przysięga, Tymon w garnizonie); noc pod piątką (Szczerba pod drzwiami, zwłoka do promu, potem zabrany); wskazanie (60 G, wydany)
//   - zapis i wczytanie: stan łańcuchów zostaje
// Uruchom: node tests/run.js lancuchy_test --port 9791
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 30); };
    // a quest's talk with a resident (TownQuests: what the step says to `key`), driven to its end; picks - the choices by prefix
    async function rozmowa(key, picks) {
        await t.eval(kit.DRIVER + "; 0");
        const ok = await t.eval(`(function(){ const L = TownQuests.talkFor(${JSON.stringify(key)}); if (!L || !L.length) return false; const D = window.__drv; D.on = true;
            D.picks = ${JSON.stringify(picks || [])}; D.waiting = null; D.mark = D.log.length; D.cmark = D.choices.length; D.missing = [];
            $gameMap._interpreter.setup(L.concat([{ code: 0, indent: 0, parameters: [] }]), 0); return true; })()`);
        if (!ok) return { ok: false, text: "", choices: [], missing: [] };
        await t.frames(4);
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 30);
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark), choices: window.__drv.choices.slice(window.__drv.cmark), missing: window.__drv.missing })");
        await t.eval("window.__drv.on = false; 0");
        out.ok = true;
        out.text = plain(out.log.map(l => l.t).join(" / "));
        return out;
    }
    // (a window's lines joined, the bubbles' codes out: a sentence reads as one line)
    const plain = s => String(s || "").replace(/\\SPK\[\d+\]/g, "").replace(/\s+/g, " ");
    const gadaj = async (ev, picks) => { const r = await t.talkTo(ev, picks, { secs: 25 }); r.text = plain(r.text); return r; };
    const W = id => J(`(function(){ const r = TownQuests.rec("${id}"); const q = TownQuests.Q["${id}"]; return r ? { s: r.s, step: r.step, name: q.steps[r.step] ? q.steps[r.step].nazwa : "" } : null; })()`);
    const flags = () => J("TownQuests.state().flags");
    // (a transfer to the map the hero is on keeps its live events: the map set up again - the travellers who came since get theirs)
    const go = async (m, x, y, d) => { await t.eval("$gamePlayer.requestMapReload(); 0"); return t.go(m, x, y, d); };
    const skok = async (watek, n) => { const g = await J(`Watki.skocz(${JSON.stringify(watek)}, ${n})`); if (g) await go(g[0], g[1], g[2], g[3]); await t.frames(20); return g; };

    // ---------------------------------------------------------------- wtyczki, teksty, zadania, rejestr, F9
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), files: Watki.pliki().filter(f => f.name === "swiete_kosci" || f.name === "dezerter"),
        q: ["W15", "W16"].map(id => !!TownQuests.Q[id] && TownQuests.Q[id].kind === "W"), reg: Tawerna.inject.list().filter(r => r.owner === "Lancuchy").map(r => r.ids),
        api: !!window.SwieteKosci && !!window.Dezerter && Tawerna.api("SwieteKosci") === window.SwieteKosci })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: SwieteKosci_Data i Dezerter_Data pod Podroznicy_Data, nad TownLife i TownQuests_Data; SwieteKosci i Dezerter pod Podroznicy",
        base.api && ix("SwieteKosci_Data") > ix("Podroznicy_Data") && ix("Dezerter_Data") > ix("SwieteKosci_Data") && ix("Dezerter_Data") < ix("TownLife") && ix("Dezerter_Data") < ix("TownQuests_Data") &&
        ix("SwieteKosci") > ix("Podroznicy") && ix("Dezerter") > ix("SwieteKosci"), base.list.filter(n => /Podr|Swiete|Dezert|TownLife$|TownQuests/.test(n)));
    t.check("teksty swiete_kosci.txt i dezerter.txt wczytane bez błędów; W15 i W16 w TownQuests (wątki), rejestr: Lancuchy 3050-3069",
        base.files.length === 2 && base.files.every(f => f.st === "ok" && !f.errors.length && f.keys > 90) && base.q.every(Boolean) && base.reg.some(r => r === "3050-3069"), base);

    // ---------------------------------------------------------------- Akt III: echa
    const a3 = await J(`(function(){ const A = Act3Data, w3 = A.WAVES.find(x => x.id === "w3"), z = A.TEXT.fale.imiona.zwiadowca;
        const n = f => (w3.extra({ flags: f }) || []).filter(x => x.name === z).length;
        const d = k => A.DEFENDERS.find(x => x.key === k);
        return { lista: A.WIEDZA_FRAKCJI, kamien: n({ kamienBaltazar: 1 }), oba: n({ kamienBaltazar: 1, w9FrakcjaWie: 1 }), feliks: n({ kamienBaltazar: 1, w7FeliksDonosi: 1 }),
            pobita: n({ kamienBaltazar: 1, w9FrakcjaPobita: 1 }), nic: n({}), tymon: !!d("tymon"), oboz: !!d("tymon_oboz"),
            obozTak: d("tymon_oboz").when({ rafal: "ally", flags: { tymonOboz: 1 } }), obozNie: d("tymon_oboz").when({ rafal: "gone", flags: { tymonOboz: 1 } }) }; })()`);
    t.check("Akt III: wiedza frakcji (kamienBaltazar) - jeden zwiadowca w fali 3; z w9FrakcjaWie albo w7FeliksDonosi dalej jeden; przy w9FrakcjaPobita żaden",
        a3.lista.includes("kamienBaltazar") && a3.kamien === 1 && a3.oba === 1 && a3.feliks === 1 && a3.pobita === 0 && a3.nic === 0, a3);
    t.check("Akt III: obrońcy Tymon (z żołnierzami) i Tomek z obozu - ten tylko obok Rafała", a3.tymon && a3.oboz && a3.obozTak && !a3.obozNie, a3);

    // ================================================================ W15 od początku
    await t.newGame({ map: 8, x: 46, y: 49, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.gold(200);
    await at(13, 14.5, 10);   // (the ferry of day 13 brings him - "w drodze" till noon, the hall 12-14, then the town)
    await t.eval("Podroznicy.przyplyn('relikwie'); 0");
    await go(8, 46, 49, 8);
    const g0 = await J("({ e: Podroznicy.stan().obecni.relikwie, ev: !!TownLife.eventOf('relikwie'), w: TownQuests.rec('W15') })");
    t.check("dzień 13: Gaspar Lis na wyspie (pokój 12), jego zdarzenie w miasteczku; W15 jeszcze nie ruszył", !!g0.e && g0.e.pokoj === "12" && g0.ev && !g0.w, g0);
    const meet = await gadaj("TownLife.eventOf('relikwie')", []);
    await t.eval("TownQuests.autoChecks(); 0");
    const w15a = await W("W15");
    t.check("pierwsza rozmowa z Gasparem („Kość palca świętego strażnika”) - wątek W15, rozdz. 1 „Kram Gaspara”", /Kość palca/.test(meet.text) && !!w15a && w15a.s === "active" && w15a.name === "w15Kram", { text: meet.text.slice(0, 160), w15a });
    const med = await gadaj("TownLife.eventOf('relikwie')", ["Kup medalik"]);
    const m1 = await J("({ v: TownQuests.vcount('medalik_gaspara'), g: $gameParty.gold() })");
    t.check("menu Gaspara: „Kup medalik (2 G)” - medalik w torbie, 198 G", m1.v === 1 && m1.g === 198 && /Medalik świętego/.test(med.text), { m1, choices: med.choices });

    // ---------------------------------------------------------------- kazanie (dzień targowy 14, 9-12)
    await at(14, 9.6, 20);
    await go(8, 46, 49, 8);
    await t.eval("(function(){ const e = TownLife.eventOf('relikwie'); if (e) $gamePlayer.locate(e.x, e.y + 1); return 0; })()");
    await t.until("SwieteKosci.stan().kazanie > 0", 15, 200);
    await t.frames(30);
    const kaz = await J("({ k: SwieteKosci.stan().kazanie, d: SwieteKosci.dzienKazania(), f: !!TownQuests.state().flags.w15Kazanie, trwa: SwieteKosci.scena.trwa() })");
    const w15b = await W("W15");
    t.check("dzień 14 (targ), 9:36 przy Gasparze: kazanie (dymki, tłum), flaga w15Kazanie; W15 dalej - „Fałszywe kości”", kaz.k === 14 && kaz.d === 14 && kaz.f && w15b.name === "w15Falsz", { kaz, w15b });

    // ---------------------------------------------------------------- fałszywe kości: Ignac, Tadek z medalikiem
    const ig = await rozmowa("garbarz");
    const td = await rozmowa("kowal");
    const w15c = await W("W15");
    t.check("Ignac: „kość barania”, Tadek (medalik): „cyna” - dwie opinie, W15 rozdz. 2 „Wizytator z Lipnicy”",
        /barania/.test(ig.text) && /Cyna/.test(td.text) && w15c.name === "w15Augustyn", { ig: ig.text.slice(0, 100), td: td.text.slice(0, 100), w15c });

    // ---------------------------------------------------------------- brat Augustyn
    await at(19, 10, 10);
    await t.eval("Podroznicy.przyplyn('wizytator'); 0");
    const au = await rozmowa("wizytator");
    const w15d = await W("W15");
    t.check("brat Augustyn: „sprzedaje księgi naszego klasztoru” - rozdz. 2 „Dowód”", /księgi naszego klasztoru/.test(au.text) && w15d.name === "w15Dowod", { au: au.text.slice(0, 120), w15d });

    // ---------------------------------------------------------------- noc sprzedaży: kurier na piętrze gości
    await t.eval("SwieteKosci.stan().noc = $gameSystem.dayNightDay(); 0");
    await at(19, 22.2, 10);
    await go(25, 78, 51, 6);
    await t.frames(40);
    const ku = await J("(function(){ const e = $gameMap.event(3050); return e ? { x: e.x, y: e.y, shown: !e.isTransparent(), sheet: e.characterName(), widoczny: SwieteKosci.kurierWidoczny() } : null; })()");
    const kt = await gadaj(3050, []);
    await t.frames(20);
    const w15e = await W("W15");
    const dw = await J("SwieteKosci.stan().dowod");
    t.check("22:12, piętro gości: kurier w kapturze pod drzwiami pokoju 12 (zdarzenie 3050); rozmowa - dowód, rozdz. 3 „Skrzynka Gaspara”",
        !!ku && ku.shown && ku.x === 81 && ku.y === 52 && /Pan Vey płaci/.test(kt.text) && dw.kurier === 1 && w15e.name === "w15Skrzynka", { ku, kt: kt.text.slice(0, 120), dw, w15e });

    // ---------------------------------------------------------------- skrzynka na rynku (przy kapralu)
    const op0 = await J("TownQuests.opinion()"), re0 = await J("Podroznicy.renoma()");
    const sk = await rozmowa("relikwie", ["Otwórz skrzynkę"]);
    const sk1 = await J("({ k: TownQuests.vcount('kamien_gaspara'), s: TownQuests.vcount('spis_lipnicy'), skrz: SwieteKosci.stan().skrzynka, op: TownQuests.opinion(), re: Podroznicy.renoma() })");
    const f1 = await flags();
    const w15f = await W("W15");
    t.check("skrzynka na rynku: Gaspar zdemaskowany (Opinia +6, Renoma +3), w torbie kamień z krukiem i spis z Lipnicy; rozdz. 4 „Kamień i spis”",
        /Karty brata Dobiesza/.test(sk.text) && f1.gasparZdemaskowany && sk1.k === 1 && sk1.s === 1 && sk1.skrz === "rynek" && sk1.op === op0 + 6 && sk1.re === re0 + 3 && w15f.name === "w15Komu",
        { sk1, op0, re0, w15f, choices: sk.choices });

    // ---------------------------------------------------------------- kamień dla Ambrożego, spis dla Augustyna, pożegnanie
    const am = await rozmowa("dzwonnik", ["Oddaj kamień"]);
    const sp = await rozmowa("wizytator", ["Oddaj spis bratu"]);
    const f2 = await flags();
    const w15g = await W("W15");
    t.check("kamień u Ambrożego (ambrozyTrust - dzwoni sam w Akcie III), spis u Augustyna; rozdz. 5 „Pożegnanie”",
        /pod belką/.test(am.text) && f2.ambrozyTrust && f2.kamienAmbrozy && f2.spisAugustyn && w15g.name === "w15Pozegnanie", { am: am.text.slice(0, 100), sp: sp.text.slice(0, 100), w15g });
    const gold0 = await t.gold(), rep0 = await J("QuestBoard.reputation()");
    const po = await rozmowa("wizytator");
    const w15h = await W("W15");
    const gold1 = await t.gold(), rep1 = await J("QuestBoard.reputation()");
    t.check("pożegnanie Augustyna: jałmużna 25 G, Sława +3, W15 wykonany", /jałmużna klasztoru/.test(po.text) && w15h.s === "done" && gold1 === gold0 + 25 && rep1 === Math.min(100, rep0 + 3), { gold0, gold1, rep0, rep1, w15h });

    // ---------------------------------------------------------------- zapis i wczytanie
    const st0 = await J("SwieteKosci.stan()");
    await t.saveTo(1);
    await t.loadFrom(1, { quiet: true });
    const st1 = await J("SwieteKosci.stan()");
    t.check("zapis i wczytanie: stan W15 ten sam", JSON.stringify(st0) === JSON.stringify(st1), { st0, st1 });

    // ================================================================ W15 skokami F9: działka, bez bohatera
    const f9 = await J(`Watki.f9.sekcje().filter(s => s.watek === "swiete_kosci" || s.watek === "dezerter").map(s => [s.head, s.rows[0].kind, s.rows[0].label])`);
    t.check("F9: sekcje „Wątek W15 (Święte kości):” i „Wątek W16 (Dezerter):” z rozdziałami", f9.length === 2 && f9[0][0] === "Wątek W15 (Święte kości):" && f9[1][1] === "isleW16" && /W16: rozdział 1/.test(f9[1][2]), f9);
    await skok("swiete_kosci", 5);
    const goldA = await t.gold();
    await rozmowa("relikwie", ["Dogadajmy się"]);
    const f3 = await flags();
    const w15i = await W("W15");
    const zw = await J(`(function(){ const w3 = Act3Data.WAVES.find(x => x.id === "w3"); return (w3.extra({ flags: TownQuests.state().flags }) || []).filter(x => x.name === Act3Data.TEXT.fale.imiona.zwiadowca).length; })()`);
    t.check("F9 rozdz. 3, „Dogadajmy się”: 30 G, gasparPuszczony i kamienBaltazar (zwiadowca w fali 3 - jeden); od razu pożegnanie",
        (await t.gold()) === goldA + 30 && f3.gasparPuszczony && f3.kamienBaltazar && zw === 1 && w15i.name === "w15Pozegnanie", { w15i, zw });
    await skok("swiete_kosci", 2);
    const re1 = await J("Podroznicy.renoma()");
    await t.eval("(function(){ const e = Podroznicy.stan().obecni.relikwie; e.do = $gameSystem.dayNightDay(); e.zostal = 1; $gameSystem.setDayNightHour(15.4); Podroznicy.sync(); return 0; })()");
    await t.frames(10);
    const w15j = await W("W15"), f4 = await flags();
    t.check("bez bohatera: Gaspar odpływa ze skrzynką - W15 przepada, gasparUciekl, Renoma -2", w15j.s === "failed" && f4.gasparUciekl && (await J("Podroznicy.renoma()")) === re1 - 2 && !(await J("Podroznicy.stan().obecni.relikwie")), { w15j });

    // ================================================================ W16 skokami F9
    // ---------------------------------------------------------------- po północy w pokoju 5: spowiedź, chorągiew brzozowska, kryjówka
    await skok("dezerter", 3);
    await t.eval("Dezerter.stan().zaufanie.ostrzezony = $gameSystem.dayNightDay(); 0");
    const spo = await rozmowa("dezerter", ["Schowaj się", "W dzwonnicy"]);
    const d1 = await J("({ s: Dezerter.stan(), ksiega: !!Podroznicy.stan().obecni.dezerter, gdzie: Dezerter.gdzieTymon() })");
    const f5 = await flags();
    const w16a = await W("W16");
    t.check("0:30 w pokoju 5: Tymon mówi, kim jest; ufa (ostrzeżony + rozmowa) - zdanie o chorągwi brzozowskiej, notatka, tymonBrzozowa",
        /Tymon Wrzos/.test(spo.text) && /Chorągiew brzozowska stała na lewym skrzydle. Ich nie zabijali. Brali. Całymi rzędami./.test(spo.text) && f5.tymonBrzozowa, { text: spo.text.slice(0, 300), missing: spo.missing });
    t.check("...kryjówka w dzwonnicy: plan ukrycie, Tymon poza księgą tawerny, W16 rozdz. 3", d1.s.plan === "ukrycie" && d1.s.gdzie === "dzwonnica" && !d1.ksiega && d1.gdzie === "dzwonnica" && w16a.name === "w16Plan", { d1, w16a });
    await go(108, 6, 7, 8);
    await t.frames(30);
    const tyd = await J("(function(){ const e = $gameMap.event(3060); return e ? { x: e.x, y: e.y, shown: !e.isTransparent(), sheet: e.characterName() } : null; })()");
    const tyt = await gadaj(3060, []);
    t.check("dzwonnica (mapa 108): Tymon w kryjówce (zdarzenie 3060), mówi o Ambrożym", !!tyd && tyd.shown && tyd.x === 6 && /Ambroży/.test(tyt.text), { tyd, text: tyt.text });

    // ---------------------------------------------------------------- odpływ Szczerby: szukała i nie znalazła -> obóz
    await t.eval("Dezerter.opts = { los: 99 }; 0");
    await skok("dezerter", 7);
    await t.setHour(8.05);
    await t.frames(80);
    const d2 = await J("({ s: Dezerter.stan(), sz: Podroznicy.stan().obecni.lowczyni || null, d: $gameSystem.dayNightDay() })");
    const w16b = await W("W16"), f6 = await flags();
    t.check("ostatni dzień Szczerby, 8:00: szukała w dzwonnicy i nie znalazła (los 99) - tymonOboz, W16 wykonany",
        d2.s.szukala === d2.d && d2.s.los === 99 && d2.s.koniec === "oboz" && f6.tymonOboz && w16b.s === "done", { d2, w16b });

    // ---------------------------------------------------------------- rotmistrz Bełza: garnizon (przychylność 55)
    await skok("dezerter", 5);
    const fv0 = await J("Garnizon.favor()");
    const be = await rozmowa("rotmistrz");
    await t.frames(60);
    const w16c = await W("W16"), f7 = await flags();
    const tg = await J("(function(){ const e = $gameMap.event(3060); return { map: $gameMap.mapId(), ev: e ? { x: e.x, y: e.y, shown: !e.isTransparent() } : null, gdzie: Dezerter.gdzieTymon(), przysiega: Dezerter.stan().przysiega, fv: Garnizon.favor() }; })()");
    t.check("garnizon, rotmistrz Bełza (przychylność 55): „Na mojej wyspie... zobaczymy.” - tymonGarnizon, przychylność +5, Tymon przy placu ćwiczeń, przysięga",
        /Na mojej wyspie/.test(be.text) && f7.tymonGarnizon && w16c.s === "done" && tg.fv === fv0 + 5 && tg.map === 162 && !!tg.ev && tg.ev.shown && tg.gdzie === "garnizon" && tg.przysiega === -1, { be: be.text.slice(0, 120), tg, fv0 });
    const zol = await J(`(function(){ const A = Act3Data, g = A.DEFENDERS.find(d => d.key === "garnizon"), ty = A.DEFENDERS.find(d => d.key === "tymon"), c = { bell: true, flags: TownQuests.state().flags };
        const r = { g60: g.when(c), t60: ty.when(c), cisza: g.when({ bell: false, flags: c.flags }) };
        Garnizon.addFavor(59 - Garnizon.favor(), "test", true); r.g59 = g.when(c); r.t59 = ty.when(c); return r; })()`);
    t.check("Akt III: przy przychylności 60 żołnierze królewscy przychodzą (i Tymon z nimi), przy 59 - nie; bez dzwonu nikt", zol.g60 && zol.t60 && !zol.g59 && !zol.t59 && !zol.cisza, zol);

    // ---------------------------------------------------------------- noc pod piątką: Szczerba pod drzwiami, zwłoka, potem zabrany
    await skok("dezerter", 4);
    await t.frames(150);
    const n1 = await J("({ trwa: Dezerter.nocTeraz(), held: TownLife.held('lowczyni'), tymon: !!Podroznicy.stan().obecni.dezerter })");
    const no = await rozmowa("lowczyni", ["Daj mu czas"]);
    const d3 = await J("Dezerter.stan()");
    const day4 = await J("$gameSystem.dayNightDay()");
    t.check("noc pod piątką (23:06): Szczerba czeka pod drzwiami (TownLife.hold); „Daj mu czas” - zwłoka do jej promu",
        n1.trwa && n1.held && n1.tymon && /Odwagę masz/.test(no.text) && d3.zwloka > 0, { n1, no: no.text.slice(0, 120), zwloka: d3.zwloka });
    await at(day4 + 1, 2.5, 80);
    const d4 = await J("Dezerter.stan()");
    // (her ferry: the last one - a stay made longer once already)
    const szDo = await J("(function(){ const e = Podroznicy.stan().obecni.lowczyni; e.zostal = 1; return e.do; })()");
    await at(szDo, 8.1, 80);
    const d5 = await J("({ s: Dezerter.stan(), gone: TownLife.gone('dezerter'), t: Podroznicy.stan().obecni.dezerter || null })");
    const f8 = await flags(), w16d = await W("W16");
    t.check("...2:30 - nikt nie zabrany (zwłoka); dzień jej promu, 8:00 - zabiera Tymona żywego (tymonZabrany), odpłynie jej promem",
        !d4.koniec && d5.s.koniec === "zabrany" && f8.tymonZabrany && d5.gone && !!d5.t && d5.t.do === szDo && w16d.s === "done", { d4: d4.koniec, d5, w16d });

    // ---------------------------------------------------------------- wskazanie: 60 G, Szczerba przychodzi tej nocy
    await skok("dezerter", 2);
    const goldB = await t.gold(), opB = await J("TownQuests.opinion()");
    await rozmowa("lowczyni", ["Wiem, gdzie śpi"]);
    const d6 = await J("Dezerter.stan()");
    const day6 = await J("$gameSystem.dayNightDay()");
    await at(day6 + 1, 2.5, 80);
    const d7 = await J("Dezerter.stan()"), f9b = await flags();
    t.check("Szczerba: „Wiem, gdzie śpi” - 60 G, plan wydany, noc tego dnia; po nocy: wydany (tymonWydany, Opinia -4)",
        d6.wskazal === day6 && d6.noc === day6 && d6.plan === "wydany" && (await t.gold()) === goldB + 60 && d7.koniec === "wydany" && f9b.tymonWydany && (await J("TownQuests.opinion()")) === opB - 4, { d6, d7: d7.koniec });

    // ---------------------------------------------------------------- przemyt u Baltazara (50 G); molo - kłamstwo (80 G)
    await skok("dezerter", 6);
    await t.gold(300);
    const ba = await rozmowa("kupiec", ["Zapłać"]);
    const d8 = await J("({ s: Dezerter.stan(), ksiega: !!Podroznicy.stan().obecni.dezerter })"), f10 = await flags(), w16e = await W("W16");
    t.check("F9 rozdz. 3 przemyt: Baltazar - 50 G, skrzynia na południe (tymonPrzemyt, tymonBaltazar), Tymon poza księgą, W16 wykonany",
        /Skrzynia, noc/.test(ba.text) && (await t.gold()) === 250 && d8.s.koniec === "przemyt" && f10.tymonPrzemyt && f10.tymonBaltazar && !d8.ksiega && w16e.s === "done", { ba: ba.text.slice(0, 100), d8, w16e });
    await skok("dezerter", 2);
    const goldC = await t.gold();
    await rozmowa("lowczyni", ["Przyprowadzę"]);
    const lie = await rozmowa("dezerter", ["Chodź na przystań"]);
    const d9 = await J("Dezerter.stan()"), w16f = await W("W16");
    t.check("Szczerba: „Przyprowadzę go na molo” - potem Tomek za dnia: „Chodź na przystań” - 80 G, wydany na molo, W16 wykonany",
        /Kajdany szczęknęły/.test(lie.text) && (await t.gold()) === goldC + 80 && d9.koniec === "molo" && w16f.s === "done", { lie: lie.text.slice(0, 160), choices: lie.choices, d9: d9.koniec, w16f });


    // ---------------------------------------------------------------- „Pomyślę” - kubek do góry dnem u Borgara (znak dla Szczerby)
    await skok("dezerter", 2);
    const goldD = await t.gold();
    await rozmowa("lowczyni", ["Pomyślę"]);
    const kub = await J(`(function(){ const rows = Tawerna.talk.rows("borgar", {}).map(r => r.label); const ok = Tawerna.talk.pick(null, "Dezerter:kubek", "borgar");
        return { rows, ok, s: Dezerter.stan() }; })()`);
    t.check("Szczerba: „Pomyślę” - u Borgara „Odstaw kubek do góry dnem”: wskazanie, 60 G, Szczerba przyjdzie tej nocy",
        kub.rows.includes("Odstaw kubek do góry dnem") && kub.ok && kub.s.wskazal > 0 && kub.s.plan === "wydany" && (await t.gold()) === goldD + 60, kub);

    // ---------------------------------------------------------------- bęben werbownika na rynku (dzień po fali), nowa gra
    await t.newGame({ map: 8, x: 27, y: 51, dir: 8, hour: 10, quiet: true, minimap: false });
    await at(25, 14, 10);
    await t.eval("Podroznicy.przyplyn('dezerter'); 0");
    await at(26, 9.3, 10);
    await go(8, 27, 51, 8);
    await t.until("TownLife.held('dezerter')", 10, 200);
    await t.eval("(function(){ const e = TownLife.eventOf('dezerter'); if (e) e.locate(27, 49); return 0; })()");
    await t.until("Dezerter.stan().beben > 0", 15, 200);
    await t.frames(30);
    const bb = await J("({ s: Dezerter.stan(), w: TownQuests.rec('W16') ? TownQuests.rec('W16').s : null, werb: !!TownLife.eventOf('werbownik'), trwa: Dezerter.scena.trwa(), held: TownLife.held('dezerter') })");
    t.check("dzień 26, 9:20 na rynku: werbownik bije w bęben, Tomek przy bębnie drży (scena) - W16 rusza, poszlaka „bęben”",
        bb.werb && bb.s.beben === 26 && bb.w === "active" && bb.trwa && bb.held, bb);
    await t.until("!Dezerter.scena.trwa()", 30, 300);
    const bb2 = await J("({ tropy: Dezerter.stan().tropy, held: TownLife.held('dezerter') })");
    t.check("...po scenie: poszlaka zapisana, Tomek wraca do swojego planu", bb2.tropy.beben === 1 && !bb2.held, bb2);

});
