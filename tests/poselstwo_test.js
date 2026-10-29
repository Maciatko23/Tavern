// Podróżni z promu - etap 5: łańcuch W14 „Poselstwo” i sprawy D44 „Podatek wojenny”, D47 „Wolna Kompania”, D48 „Mapa Kruczej Wyspy”
// (docs/PODROZNI.md 2.3, 2.7, 2.8, 2.13, I6, I7, 4.1, 4.4; js/plugins/Poselstwo_Data.js + Poselstwo.js, Podroznicy5_Data.js +
// Podroznicy5.js, js/teksty/poselstwo.txt, podroznicy5.txt). Sprawdza:
//   - wtyczki na swoich miejscach, teksty bez błędów, zadania W14/D44/D47/D48 w TownQuests, rejestr (Poselstwo 3070-3089), sekcje F9,
//     mechanizmy etapów 2-3 zarejestrowane (podsłuch, nocne kroki, list pod drzwiami, przeszukanie, przepustka złotej kraty)
//   - Akt III: pielgrzymDonosi / mapaTwierdzy - jeden zwiadowca w fali 3; pielgrzymZlapany - fala 3 o jednego mniej (nie obok
//     ansgarAlly); poselstwoWyciek - łucznik w fali 2; kompaniaWroga - najemnik w fali 4; Kompania (najęta) wśród obrońców po dzwonie;
//     żołnierze garnizonu przy poselWdzieczny od przychylności 70
//   - W14 skokami F9: trzy poszlaki i Wit (wieża przed kradzieżą); kolacja u Borgara („w służbie”, krata otwarta) i u posła; narada
//     (Lord w salonie, poseł trzymany, podsłuch); Noc Kupały - kradzież udaremniona i kradzież; śledztwo (wosk, krata), konfrontacja,
//     list oddany posłowi (60 G, Renoma +8, przychylność +10); Lord; kopia przyłapana; wyciek (Albin odpływa z listem)
//   - D44: Feliks na korytarzu (zdarzenie 3080), podsłuch, raport (Feliks / Lord / 20 G), Erazm odpływa - zadanie przepada
//   - D47: burda (Renoma -1), siłowanie i kości z Hubertem (rywal sprawy), bójka na dziedzińcu (Humans), najęcie (60 G / za mało),
//     Wit (kompaniaWroga, wcześniejszy prom), Grum; odpływ Kompanii - przepada
//   - D48: druga wizyta Teofila - pamiątka i twierdza (25 G, mapaTwierdzy); przekonanie (Hart ducha 6); tuba (złapany / zabrana)
//   - zapis i wczytanie: stan wątków zostaje
// Uruchom: node tests/run.js poselstwo_test --port 9791
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
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
    const plain = s => String(s || "").replace(/\\SPK\[\d+\]/g, "").replace(/\s+/g, " ");
    const gadaj = async (ev, picks) => { const r = await t.talkTo(ev, picks, { secs: 25 }); r.text = plain(r.text); return r; };
    const W = id => J(`(function(){ const r = TownQuests.rec("${id}"); const q = TownQuests.Q["${id}"]; return r ? { s: r.s, step: r.step, name: q.steps[r.step] ? q.steps[r.step].nazwa : "" } : null; })()`);
    const flags = () => J("TownQuests.state().flags");
    const dzien = () => J("$gameSystem.dayNightDay()");
    const go = async (m, x, y, d, o) => { await t.eval("$gamePlayer.requestMapReload(); 0"); return t.go(m, x, y, d, o); };
    const skok = async (watek, n) => { const g = await J(`Watki.skocz(${JSON.stringify(watek)}, ${n})`); if (g) await go(g[0], g[1], g[2], g[3]); await t.frames(20); return g; };
    const renoma = () => J("Podroznicy.renoma()");

    // ---------------------------------------------------------------- wtyczki, teksty, zadania, rejestr, F9, mechanizmy
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), files: Watki.pliki().filter(f => f.name === "poselstwo" || f.name === "podroznicy5"),
        q: [["W14", "W"], ["D44", "D"], ["D47", "D"], ["D48", "D"]].map(([id, k]) => !!TownQuests.Q[id] && TownQuests.Q[id].kind === k),
        reg: Tawerna.inject.list().filter(r => r.owner === "Poselstwo").map(r => r.ids),
        api: !!window.Poselstwo && !!window.Podroznicy5 && Tawerna.api("Podroznicy5") === window.Podroznicy5,
        mech: Poselstwo.mechanizmy(), mech5: Podroznicy5.mechanizmy(), brama: Poselstwo.brama(), straz: typeof TavernLife.addRoomGuard === "function",
        f9: Watki.f9.sekcje().filter(s => s.watek === "poselstwo" || s.watek === "podroznicy5").map(s => [s.head, s.rows[0].kind, s.rows[0].label]) })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: Poselstwo_Data i Podroznicy5_Data pod Dezerter_Data, nad TownLife i TownQuests_Data; Poselstwo i Podroznicy5 pod Dezerter (i Intrygi)",
        base.api && ix("Poselstwo_Data") > ix("Dezerter_Data") && ix("Podroznicy5_Data") > ix("Poselstwo_Data") && ix("Podroznicy5_Data") < ix("TownLife") && ix("Podroznicy5_Data") < ix("TownQuests_Data") &&
        ix("Poselstwo") > ix("Dezerter") && ix("Poselstwo") > ix("Intrygi") && ix("Podroznicy5") > ix("Poselstwo"), base.list.filter(n => /Podr|Posel|Dezert|Intryg|TownLife$|TownQuests/.test(n)));
    t.check("teksty poselstwo.txt i podroznicy5.txt bez błędów; W14 (wątek), D44, D47, D48 w TownQuests; rejestr: Poselstwo 3070-3089 (zdarzenia 3070-3079, 3080-3089)",
        base.files.length === 2 && base.files.every(f => f.st === "ok" && !f.errors.length && f.keys > 100) && base.q.every(Boolean) && base.reg.includes("3070-3089") && base.reg.includes("3070-3079") && base.reg.includes("3080-3089"), base);
    t.check("F9: sekcje „Wątek W14 (Poselstwo):” i „Podróżni - sprawy etapu 5:”", base.f9.length === 2 && base.f9[0][0] === "Wątek W14 (Poselstwo):" && base.f9[0][1] === "isleW14" &&
        base.f9[1][0] === "Podróżni - sprawy etapu 5:" && base.f9[1][1] === "isleP5" && /D44/.test(base.f9[1][2]), base.f9);
    t.check("mechanizmy etapów 2-3: podsłuch (okno 15, narada, pokój 4), nocne kroki Albina, list pod drzwiami, przeszukanie (różaniec, notatki, tuba), przepustka krat; furtka pokoi",
        base.mech.podsluch && base.mech.kroki && base.mech.listy && base.mech.przeszukanie && base.mech5.podsluch && base.mech5.przeszukanie && base.brama && base.straz, base);

    // ---------------------------------------------------------------- Akt III: echa
    const a3 = await J(`(function(){ const A = Act3Data, w2 = A.WAVES.find(x => x.id === "w2"), w3 = A.WAVES.find(x => x.id === "w3"), w4 = A.WAVES.find(x => x.id === "w4"), z = A.TEXT.fale.imiona.zwiadowca;
        const zw = f => (w3.extra({ flags: f }) || []).filter(x => x.name === z).length;
        const d = k => A.DEFENDERS.find(x => x.key === k), komp = d("kompania");
        return { lista: A.WIEDZA_FRAKCJI, donosi: zw({ pielgrzymDonosi: 1 }), mapa: zw({ mapaTwierdzy: 1 }), oba: zw({ mapaTwierdzy: 1, pielgrzymDonosi: 1, kamienBaltazar: 1 }), pobita: zw({ mapaTwierdzy: 1, w9FrakcjaPobita: 1 }),
            mniej: w3.fewer({ flags: { pielgrzymZlapany: 1 } }) - w3.fewer({ flags: {} }), ansgar: w3.fewer({ flags: { pielgrzymZlapany: 1, ansgarAlly: 1 } }) - w3.fewer({ flags: { ansgarAlly: 1 } }),
            lucznik: (w2.extra({ flags: { poselstwoWyciek: 1 }, rafal: null }) || []).filter(x => x._wiedza).length, lucznikNie: (w2.extra({ flags: {}, rafal: null }) || []).filter(x => x._wiedza).length,
            najemnik: (w4.extra({ flags: { kompaniaWroga: 1 } }) || []).filter(x => x._fala4).length, najemnikNie: (w4.extra({ flags: {} }) || []).filter(x => x._fala4).length,
            komp: !!komp && komp.n === 2 && komp.help === true && komp.name === "Wolna Kompania" && !!komp.lines.start, kompTak: !!komp && komp.when({ bell: true, flags: { kompaniaNajeta: 1 } }),
            kompBezDzwonu: !!komp && komp.when({ bell: false, flags: { kompaniaNajeta: 1 } }), kompWroga: !!komp && komp.when({ bell: true, flags: { kompaniaNajeta: 1, kompaniaWroga: 1 } }) }; })()`);
    t.check("Akt III: pielgrzymDonosi i mapaTwierdzy na wspólnej liście wiedzy frakcji - jeden zwiadowca w fali 3 (z kamienBaltazar też jeden), przy w9FrakcjaPobita żaden",
        a3.lista.includes("pielgrzymDonosi") && a3.lista.includes("mapaTwierdzy") && a3.donosi === 1 && a3.mapa === 1 && a3.oba === 1 && a3.pobita === 0, a3);
    t.check("Akt III: pątnik złapany - fala 3 o jednego mniej, ale nie obok ansgarAlly; wyciek listu - łucznik w fali 2; Kompania wyrzucona - najemnik w fali 4",
        a3.mniej === 1 && a3.ansgar === 0 && a3.lucznik === 1 && a3.lucznikNie === 0 && a3.najemnik === 1 && a3.najemnikNie === 0, a3);
    t.check("Akt III: Wolna Kompania (najęta) - dwóch obrońców po dzwonie; bez dzwonu i przy kompaniaWroga nie", a3.komp && a3.kompTak && !a3.kompBezDzwonu && !a3.kompWroga, a3);

    // ================================================================ W14 skokami F9
    await t.newGame({ map: 8, x: 46, y: 49, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.gold(300);
    // ---------------------------------------------------------------- rozdz. 1: trzy poszlaki, Wit - wieża przed kradzieżą
    await skok("poselstwo", 1);
    const p1 = await J("({ e: Podroznicy.stan().obecni.pielgrzym, w: TownQuests.rec('W14') && TownQuests.rec('W14').s })");
    const am = await rozmowa("dzwonnik");
    await t.eval("Tawerna.emit('podsluch', { id: 'w14Okno', pelna: true }); Poselstwo.trop('borgar', 1); 0");
    await t.frames(10);
    const p2 = await J("({ tropy: Poselstwo.stan().tropy })"), w14a = await W("W14");
    t.check("F9 rozdz. 1: Albin na wyspie (pokój 15), W14 trwa; poszlaki: Ambroży, rozmowa pod oknem (podsłuch), Borgar - trzy, rozdz. 2 „Poseł Korony”",
        !!p1.e && p1.e.pokoj === "15" && p1.w === "active" && am.ok && !!p2.tropy.ambrozy && p2.tropy.okno === 1 && p2.tropy.borgar === 1 && w14a.name === "w14Posel", { p1, am: am.text.slice(0, 120), p2, w14a });
    const wi = await rozmowa("kapral", ["Zabierz go"]);
    const p3 = await J("({ s: Poselstwo.stan(), e: Podroznicy.stan().obecni.pielgrzym || null })"), f1 = await flags(), w14b = await W("W14");
    t.check("kapral Wit: „Zabierz go do wieży.” - Albin w wieży przed kradzieżą (pielgrzymZlapany, poza księgą), W14 - pożegnanie posła",
        wi.ok && p3.s.albin === "wieza" && f1.pielgrzymZlapany && !p3.e && w14b.name === "w14Spokoj", { wi: wi.text.slice(0, 120), choices: wi.choices, albin: p3.s.albin, w14b });

    // ---------------------------------------------------------------- rozdz. 2: kolacja u Borgara, „w służbie”, kolacja u posła
    await skok("poselstwo", 2);
    const k0 = await J(`({ posel: Podroznicy.stan().obecni.posel || null, rows: Tawerna.talk.rows("borgar", {}).map(r => r.label) })`);
    await t.eval(`Tawerna.talk.pick(null, "Poselstwo:kolacja", "borgar"); 0`);
    await t.frames(10);
    const k1 = await J("({ taca: TownQuests.vcount('taca_kolacja'), sluzba: Poselstwo.sluzba(), krata: TavernLife.gatePass(), s: Poselstwo.stan().sluzba, d: $gameSystem.dayNightDay() })");
    t.check("F9 rozdz. 2 (19:36): poseł z Ostapem w Apartamencie Złotym; u Borgara „Zanieś kolację do Złotego” - taca, „w służbie”: złota krata otwarta",
        !!k0.posel && k0.posel.pokoj === "zloty" && k0.rows.includes("Zanieś kolację do Złotego") && k1.taca === 1 && k1.sluzba && k1.krata && k1.s === k1.d, { k0, k1 });
    await go(26, 65, 41, 8);
    const ko = await rozmowa("posel");
    const w14c = await W("W14");
    t.check("kolacja u posła (tacę zostawia): rozdz. 3 „Narada”", ko.ok && (await J("TownQuests.vcount('taca_kolacja')")) === 0 && (await J("Poselstwo.stan().kolacje")) === 1 && w14c.name === "w14Narada",
        { ko: ko.text.slice(0, 120), w14c });

    // ---------------------------------------------------------------- rozdz. 3: narada w Wielkim salonie
    await skok("poselstwo", 3);
    await t.setHour(21.1);
    await t.frames(60);
    const n1 = await J("(function(){ const l = $gameMap.event(3070), f = $gameMap.event(3071); return { map: $gameMap.mapId(), lord: !!l && !l.isTransparent(), feliks: !!f && !f.isTransparent(), held: TownLife.held('posel') }; })()");
    await t.eval("Tawerna.emit('podsluch', { id: 'w14Narada', pelna: true }); 0");
    await t.frames(10);
    const w14d = await W("W14");
    t.check("F9 rozdz. 3, 21:06 na piętrze II: Lord i Feliks w salonie (3070, 3071), poseł trzymany na naradzie; podsłuch - rozdz. 4 „Noc Kupały”",
        n1.map === 26 && n1.lord && n1.feliks && n1.held && (await J("Poselstwo.stan().narada")) > 0 && w14d.name === "w14Kradziez", { n1, w14d });

    // ---------------------------------------------------------------- rozdz. 4: Noc Kupały - kradzież udaremniona; potem kradzież
    await skok("poselstwo", 4);
    const k = await dzien();
    await t.setDay(k + 1, 0.7);
    await t.eval("Poselstwo.zegar(); 0");
    await t.frames(80);
    const z1 = await J("({ s: Poselstwo.stan(), ostap: TownLife.gone('gwardzista') })"), f2 = await flags(), w14e = await W("W14");
    t.check("F9 rozdz. 4: po północy Albin pod Złotym (Ostap przy ognisku) - bohater obok: kradzież udaremniona, pielgrzymZdemaskowany, pożegnanie posła",
        z1.s.zapobiegl === k + 1 && !z1.s.kradziez && z1.ostap && f2.pielgrzymZdemaskowany && w14e.name === "w14Spokoj", { s: z1.s, ostap: z1.ostap, w14e });
    await skok("poselstwo", 4);
    const k2 = await dzien();
    await go(25, 45, 27, 8);
    await t.setDay(k2 + 1, 1.6);
    await t.eval("Poselstwo.zegar(); 0");
    await t.frames(20);
    const z2 = await J("({ s: Poselstwo.stan(), e: Podroznicy.stan().obecni.pielgrzym })");
    await t.setHour(6.2);
    await t.eval("Poselstwo.zegar(); 0");
    await t.frames(10);
    const z3 = await J("Poselstwo.stan()"), w14f = await W("W14");
    t.check("...nikt nie pilnuje: o 1:30 list znika (u Albina), Albin odpłynie najbliższym promem; rano poseł wie - rozdz. 4 „Śledztwo”",
        z2.s.kradziez === k2 + 1 && z2.s.list === "albin" && z2.e.zostal === 1 && z3.rano === k2 + 1 && w14f.name === "w14Sledztwo", { s: z2.s.kradziez, list: z2.s.list, e: z2.e, rano: z3.rano, w14f });

    // ---------------------------------------------------------------- rozdz. 4: ślady, konfrontacja, list u bohatera
    await skok("poselstwo", 5);
    await t.frames(30);
    const sw = await gadaj(3073, []);
    await go(25, 90, 18, 6);
    await t.frames(30);
    const sk = await gadaj(3074, []);
    const sl = await J("Poselstwo.stan().slady");
    const kf = await rozmowa("pielgrzym", ["Straż!"]);
    const f3 = await flags(), w14g = await W("W14");
    t.check("F9 rozdz. 5 (śledztwo): wosk na galerii (3073) i ślady sandałów przy kracie (3074); Albin: „Straż! Do wieży z nim.” - list u bohatera, rozdz. 5 „Co z listem”",
        sl.wosk === 1 && sl.krata === 1 && kf.ok && (await J("TownQuests.vcount('list_posla')")) === 1 && f3.pielgrzymZlapany && w14g.name === "w14List", { sw: sw.text.slice(0, 80), sk: sk.text.slice(0, 80), sl, kf: kf.text.slice(0, 120), w14g });
    const g0 = await t.gold(), r0 = await renoma(), fv0 = await J("Garnizon.favor()");
    const od = await rozmowa("posel", ["Oddaj list posłowi."]);
    const f4 = await flags(), w14h = await W("W14");
    t.check("list oddany posłowi: 60 G, Renoma +8, przychylność garnizonu +10, poselWdzieczny, W14 wykonany",
        od.ok && (await t.gold()) === g0 + 60 && (await renoma()) === Math.min(100, r0 + 8) && (await J("Garnizon.favor()")) === fv0 + 10 && f4.poselWdzieczny && w14h.s === "done", { od: od.text.slice(0, 120), w14h });

    // ---------------------------------------------------------------- rozdz. 5 skokiem: Lord; kopia przyłapana
    await skok("poselstwo", 7);
    const fv1 = await J("Garnizon.favor()");
    const lo = await rozmowa("lord", ["Pokaż Lordowi list"]);
    const f5 = await flags(), w14i = await W("W14");
    t.check("F9 rozdz. 5: list pokazany Lordowi - w14LordWie, przychylność -10, W14 wykonany", lo.ok && f5.w14LordWie && (await J("Garnizon.favor()")) === fv1 - 10 && w14i.s === "done" && (await J("Poselstwo.stan().koniec")) === "lord", { lo: lo.text.slice(0, 120), w14i });
    await skok("poselstwo", 7);
    await t.setHour(21.5);
    const r1 = await renoma();
    await t.eval(`Poselstwo.opts = { kopia: 0 }; Tawerna.talk.pick(null, "Poselstwo:papier", "borgar"); 0`);
    await t.frames(20);
    const kp = await J("({ s: Poselstwo.stan(), list: TownQuests.vcount('list_posla'), kopia: TownQuests.vcount('kopia_listu') })"), w14j = await W("W14");
    t.check("kopia nocą (papier od Borgara), Ostap wchodzi: list u Ostapa, Renoma -8, W14 wykonany (kopiaZlapany)", kp.s.koniec === "kopiaZlapany" && kp.list === 0 && kp.kopia === 0 && (await renoma()) === Math.max(0, r1 - 8) && w14j.s === "done", { s: kp.s.koniec, w14j });
    await t.eval("Poselstwo.opts = null; 0");

    // ---------------------------------------------------------------- wyciek: Albin odpływa z listem
    await skok("poselstwo", 6);
    const r2 = await renoma();
    await t.eval("(function(){ $gameSystem.setDayNightHour(15.4); Podroznicy.sync(); return 0; })()");
    await t.frames(10);
    const f6 = await flags(), w14k = await W("W14");
    t.check("F9 rozdz. 4 (molo): nikt nie zatrzymał Albina - odpływa z listem: poselstwoWyciek, W14 przepada, Renoma -3 (poszlaki wskazały)",
        f6.poselstwoWyciek && w14k.s === "failed" && (await renoma()) === Math.max(0, r2 - 3) && !(await J("Podroznicy.stan().obecni.pielgrzym")), { w14k, r2 });

    // ================================================================ D44 „Podatek wojenny”
    await t.newGame({ map: 8, x: 46, y: 49, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.gold(100);
    await skok("podroznicy5", 1);
    const d1 = await J("({ e: Podroznicy.stan().obecni.poborca || null, lista: Podroznicy.podsluch.lista(), kw: (Watki.teksty('podroznicy5').podsluch.d44 || []).length, noc: Podroznicy5.nocD44(), d: $gameSystem.dayNightDay() })");
    const w44a = await W("D44");
    await t.eval("Tawerna.emit('podsluch', { id: 'd44Noc', pelna: true }); 0");
    await t.frames(10);
    const w44b = await W("D44");
    t.check("F9 D44 noc: Erazm w pokoju 4, podsłuch pokoju 4 (pięć kwestii, noc dziś); usłyszane przez ścianę - raport", !!d1.e && d1.e.pokoj === "4" && d1.lista.includes("d44Noc") && d1.kw === 5 &&
        d1.noc === d1.d && w44a.name === "d44Noc" && (await J("Podroznicy5.stan().d44.slyszal")) === 1 && w44b.name === "d44Raport", { d1, w44a, w44b });
    await skok("podroznicy5", 1);
    await t.setHour(22.75);
    await go(25, 66, 49, 6);
    await t.frames(60);
    const fe = await J("(function(){ const e = $gameMap.event(3080); return e ? { x: e.x, y: e.y, shown: !e.isTransparent(), sheet: e.characterName() } : null; })()");
    const ft = await gadaj(3080, []);
    const w44c = await W("D44");
    t.check("22:45 na korytarzu gości: Feliks pod czwórką (zdarzenie 3080), zauważony - „Nie stój w przejściu”; raport",
        !!fe && fe.shown && fe.x === 68 && fe.y === 49 && fe.sheet === "$Npc_Feliks" && (await J("Podroznicy5.stan().d44.feliks")) > 0 && /Nie stój w przejściu/.test(ft.text) && w44c.name === "d44Raport", { fe, ft: ft.text, w44c });
    const fv2 = await J("Garnizon.favor()");
    const ra = await rozmowa("poborca", ["To Feliks"]);
    const f7 = await flags(), w44d = await W("D44");
    t.check("raport Erazma: „To Feliks płaci, nie Lord.” - raport o kamerdynerze, przychylność +5, D44 wykonane", /To zmienia raport/.test(ra.text) && f7.d44RaportFeliks && (await J("Garnizon.favor()")) === fv2 + 5 && w44d.s === "done", { ra: ra.text.slice(0, 160), w44d });
    await skok("podroznicy5", 2);
    const lr = await rozmowa("lord");
    const f8 = await flags(), w44e = await W("D44"), obs = await J("Dwor.state().obs.noc");
    t.check("F9 D44 raport - Lord: „Feliks? Niemożliwe.” - w7PoborcaMonety, obserwacja nocy W7, D44 wykonane", /Niemożliwe/.test(lr.text) && f8.w7PoborcaMonety && obs > 0 && w44e.s === "done", { lr: lr.text.slice(0, 160), obs, w44e });
    await skok("podroznicy5", 2);
    const g1 = await t.gold();
    await rozmowa("poborca", ["Biorę dwadzieścia"]);
    const f9 = await flags(), w44f = await W("D44");
    t.check("raport - donos: 20 G, w7FeliksCzujny, D44 wykonane", (await t.gold()) === g1 + 20 && f9.w7FeliksCzujny && w44f.s === "done", { w44f });
    await skok("podroznicy5", 1);
    await t.eval("(function(){ const e = Podroznicy.stan().obecni.poborca; e.do = $gameSystem.dayNightDay(); e.zostal = 1; $gameSystem.setDayNightHour(15.4); Podroznicy.sync(); return 0; })()");
    await t.frames(10);
    const w44g = await W("D44");
    t.check("Erazm odpływa przed nocą podatku - D44 przepada", w44g.s === "failed" && !(await J("Podroznicy.stan().obecni.poborca")), w44g);

    // ================================================================ D47 „Wolna Kompania”
    await skok("podroznicy5", 3);
    const c0 = await J("({ e: Podroznicy.stan().obecni.kompania || null, hub: !!TownLife.eventOf('kompania_1'), kos: Tawerna.api('TavernDice_parts').data.OPPONENTS.hubert || null, order: Tawerna.api('TavernDice_parts').data.OPP_ORDER })");
    const w47a = await W("D47");
    const r3 = await renoma();
    await t.eval("(function(){ const e = Podroznicy.stan().obecni.kompania; e.od = $gameSystem.dayNightDay() - 1; Podroznicy5.stan().d47.noc = 0; $gameSystem.setDayNightHour(1.2); Podroznicy5.burdy(); return 0; })()");
    const c1 = await J("Podroznicy5.stan().d47");
    t.check("F9 D47: Wolna Kompania na wyspie (Hubert w pokoju 9), D47 trwa; Hubert rywalem kości tylko tej sprawy; noc burd - Renoma -1",
        !!c0.e && c0.hub && !!c0.kos && c0.kos.name === "Hubert Szary" && !!c0.kos.lines.greet && !c0.order.includes("hubert") && w47a.s === "active" && c1.noce === 1 && (await renoma()) === Math.max(0, r3 - 1), { c0: { e: c0.e, hub: c0.hub, order: c0.order }, w47a, c1 });
    await t.setHour(19);
    // (the mini-games themselves: their own tests - here what the talk hands them and what their end does)
    const gry = await J(`(function(){ const TL = Tawerna.api("TavernLife"), TD = window.TavernDice, a = TL.armWrestle, s = TD.start; let arm = null, dice = null;
        TL.armWrestle = o => { arm = o; return true; }; TD.start = o => { dice = o; return true; };
        try { Podroznicy5.silowanie(); Podroznicy5.kosci(); } finally { TL.armWrestle = a; TD.start = s; }
        dice.onEnd({ last: { won: false } }); const po1 = TownQuests.rec("D47").s;
        arm.onEnd({ won: true });
        return { arm: { rival: arm.rival.name, level: arm.rival.level, stake: arm.stake, hello: arm.rival.lines.hello }, dice: { opp: dice.opponent, stake: dice.stake }, po1, po2: TownQuests.rec("D47").s, koniec: Podroznicy5.stan().d47.koniec }; })()`);
    const f10 = await flags();
    t.check("Hubert: siłowanie (rywal poziomu 3, 10 G) i kości (10 G) - przegrana w kości nic nie kończy, wygrana w siłowanie: szacunek, D47 wykonane (kompaniaSpokoj)",
        gry.arm.rival === "Hubert Szary" && gry.arm.level === 3 && gry.arm.stake === 10 && !!gry.arm.hello && gry.dice.opp === "hubert" && gry.dice.stake === 10 && gry.po1 === "active" && gry.po2 === "done" && gry.koniec === "gra" && f10.kompaniaSpokoj, gry);
    await skok("podroznicy5", 3);
    const bo = await rozmowa("kompania_1", ["Na dziedziniec"]);
    await go(8, 51, 27, 8, { calm: false });   // (the kit's quiet mode clears the men)
    await t.frames(60);
    const b1 = await J("({ trwa: Podroznicy5.bojka.trwa(), band: !!Humans.band('d47Bojka'), gone: TownLife.gone('kompania_1') })");
    const r4 = await renoma();
    await t.eval("Humans.clear('d47Bojka'); Tawerna.emit('heroRobbed', { tag: 'd47Bojka', gold: 0, items: [] }); 0");
    await t.frames(10);
    const w47b = await W("D47");
    t.check("„Na dziedziniec” - Hubert czeka na dziedzińcu tawerny (Humans, bez noży); przegrana bójka - też szacunek: Renoma +4, D47 wykonane",
        /Za kwadrans na dziedzińcu/.test(bo.text) && b1.trwa && b1.band && b1.gone && w47b.s === "done" && (await renoma()) === Math.min(100, r4 + 4) && !(await J("TownLife.gone('kompania_1')")), { bo: bo.text.slice(0, 100), b1, w47b });
    await skok("podroznicy5", 3);
    await t.gold(10);
    await rozmowa("kompania_1", ["Najmę"]);
    const w47c = await W("D47");
    await t.gold(100);
    const na = await rozmowa("kompania_1", ["Najmę"]);
    const f11 = await flags(), w47d = await W("D47");
    t.check("najęcie: za 10 G - nic (dymek); za 100 G - 60 G zostaje u Huberta, kompaniaNajeta, D47 wykonane",
        w47c.s === "active" && /trzy i jeden/.test(na.text) && (await t.gold()) === 40 && f11.kompaniaNajeta && w47d.s === "done", { w47c, na: na.text.slice(0, 120), w47d });
    await skok("podroznicy5", 3);
    await t.eval("TownQuests.state().flags.kompaniaNajeta = 0; 0");
    await rozmowa("kompania_1", ["Nic"]);
    const wt = await rozmowa("kapral", ["Wyrzuć"]);
    const f12 = await flags(), w47e = await W("D47"), ce = await J("({ e: Podroznicy.stan().obecni.kompania, d: $gameSystem.dayNightDay(), prom: Podroznicy.naPromie($gameSystem.dayNightDay() + 1) })");
    t.check("kapral Wit: „Wyrzuć ich.” - kompaniaWroga, Kompania odpłynie najbliższym promem, D47 wykonane", /Za mur z nimi/.test(wt.text) && f12.kompaniaWroga && ce.e.zostal === 1 && ce.e.do === ce.prom && w47e.s === "done", { wt: wt.text.slice(0, 120), ce, w47e });
    await skok("podroznicy5", 3);
    await t.eval("TownQuests.state().flags.grumAlly = 1; 0");
    const gr = await rozmowa("kompania_1", ["Grum chce"]);
    const w47f = await W("D47");
    t.check("Grum (sojusznik W8): „Znamy Gruma. Kiedyś był nasz.” - cisza bez walki, D47 wykonane", /Kiedyś był nasz/.test(gr.text) && w47f.s === "done" && (await J("Podroznicy5.stan().d47.koniec")) === "grum", { gr: gr.text.slice(0, 120), w47f });
    await t.eval("TownQuests.state().flags.grumAlly = 0; 0");
    await skok("podroznicy5", 3);
    await t.eval("(function(){ const e = Podroznicy.stan().obecni.kompania; e.do = $gameSystem.dayNightDay(); e.zostal = 1; $gameSystem.setDayNightHour(15.4); Podroznicy.sync(); return 0; })()");
    await t.frames(10);
    const w47g = await W("D47");
    t.check("Kompania odpływa nieuspokojona - D47 przepada", w47g.s === "failed", w47g);

    // ================================================================ D48 „Mapa Kruczej Wyspy” (Teofil, wizyta 2)
    await skok("podroznicy5", 4);
    const t0 = await J("({ e: Podroznicy.stan().obecni.kartograf || null })"), w48a = await W("D48");
    const g2 = await t.gold();
    const po = await rozmowa("kartograf", ["Narysujmy"]);
    const f13 = await flags(), w48b = await W("D48");
    t.check("F9 D48: Teofil na drugiej wizycie; pamiątka - Mapa Kruczej Wyspy; „Narysujmy twierdzę.” - 25 G, mapaTwierdzy, D48 wykonane",
        !!t0.e && t0.e.wizyta === 2 && w48a.name === "d48Mapa" && (await J("TownQuests.vcount('mapa_wyspy')")) === 1 && f13.mapaWyspyPamiatka && /dwadzieścia pięć/.test(po.text) && (await t.gold()) === g2 + 25 && f13.mapaTwierdzy && w48b.s === "done",
        { t0, w48a, po: po.text.slice(0, 160), w48b });
    await skok("podroznicy5", 4);
    await t.eval("Combat.hero().attr.wil = 1; 0");
    const pn = await rozmowa("kartograf", ["Nie rysuj"]);
    const w48c = await W("D48");
    await t.eval("Combat.hero().attr.wil = 6; 0");
    const pt = await rozmowa("kartograf", ["Nie rysuj"]);
    const f14 = await flags(), w48d = await W("D48");
    t.check("„Nie rysuj starych murów.” - bez kart kronik i Hartu: „Bez powodu?”; z Hartem ducha 6: puste pole, mapaBezTwierdzy, D48 wykonane",
        /Bez powodu/.test(pn.text) && w48c.s === "active" && /puste pole/.test(pt.text) && f14.mapaBezTwierdzy && w48d.s === "done", { pn: pn.text.slice(0, 100), pt: pt.text.slice(0, 120), w48d });
    await skok("podroznicy5", 4);
    await rozmowa("kartograf", ["(Zabiorę"]);
    const r5 = await renoma();
    const tu = await J("({ plan: Podroznicy5.stan().d48.plan, dla: Podroznicy.przeszukanie.dla(Podroznicy.stan().obecni.kartograf.pokoj, 'kufer') })");
    await t.eval("Intrygi.szukajTak(null, 'd48Tuba'); 0");
    await t.frames(10);
    const w48e = await W("D48");
    t.check("„Zabiorę mu ten szkic” - tuba w pokoju Teofila; przy nim w pokoju (16:00): złapany - Renoma -3, szkic idzie na ląd (mapaTwierdzy), D48 wykonane",
        tu.plan > 0 && tu.dla === "d48Tuba" && (await renoma()) === Math.max(0, r5 - 3) && (await J("Podroznicy5.stan().d48.koniec")) === "zlapany" && w48e.s === "done", { tu, w48e });
    await skok("podroznicy5", 4);
    await rozmowa("kartograf", ["(Zabiorę"]);
    await t.eval("(function(){ const s = window.IntrygiData && IntrygiData.watek ? IntrygiData.watek.S() : null; if (s && s.szukane) delete s.szukane.d48Tuba; if (s && s.zly) delete s.zly.kartograf; $gameSystem.setDayNightHour(10); return 0; })()");
    await t.frames(30);
    await t.eval("Intrygi.szukajTak(null, 'd48Tuba'); 0");
    await t.frames(10);
    const f15 = await flags(), w48f = await W("D48");
    t.check("...o 10:00 (Teofil w miasteczku): szkic zabrany z tuby - mapaSzkicZabrany, D48 wykonane", (await J("Podroznicy5.stan().d48.koniec")) === "szkic" && f15.mapaSzkicZabrany && w48f.s === "done", { w48f, koniec: await J("Podroznicy5.stan().d48.koniec") });

    // ---------------------------------------------------------------- zapis i wczytanie
    const st0 = await J("({ a: Poselstwo.stan(), b: Podroznicy5.stan() })");
    await t.saveTo(1);
    await t.loadFrom(1, { quiet: true });
    const st1 = await J("({ a: Poselstwo.stan(), b: Podroznicy5.stan() })");
    t.check("zapis i wczytanie: stan W14 i spraw etapu 5 ten sam", JSON.stringify(st0) === JSON.stringify(st1), { st0, st1 });
});
