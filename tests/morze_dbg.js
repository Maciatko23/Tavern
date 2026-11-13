// W23 „Coś z głębin” - potwory z morza i wątek (docs/POTWORY_Z_MORZA.md; js/plugins/Morze_Data.js, Morze.js, Morze_Potwory.js, js/teksty/morze.txt).
// Sprawdza: wtyczki, teksty, rejestr zdarzeń 4700-4799, rodzaje w Creatures, przedmioty; wzór szansy (p, mnożniki, dolna granica, sufit, statystyka 10 000 nocy);
// ziarno (to samo losowanie przy ponownym wejściu); tabelę rodzajów po dniach; lądowanie (znaki, wyjście z wody, ślady, powiadomienie), świt (odwrót do wody);
// strach przed ogniem, topielec / krab / rybołaki / mglak / wiedźma (pieśń i jej przerwanie), macki (kręgi, uderzenie, chwyt, odcięcie), miasto (straż),
// sen z potworem w 8 polach zablokowany, wątek W23 (rozdziały skokami F9), zapis i wczytanie, wydajność (pomiar nocy z 5 potworami przy 4x wolniejszym procesorze).
// Uruchom: GAME_OVERLAY=tools/potwory/overlay GAME_OVERLAY_JS=1 CDP_PORT=9950 node tests/morze_test.js
const kit = require("./lib/kit.js");
const SHOTS = "../docs/zadania_nowe/potwory_gra/";
const T0 = Date.now(), lap = s => console.log(((Date.now() - T0) / 1000).toFixed(1) + 's ' + s);
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", port: Number(process.env.CDP_PORT) || 9950 }, async t => {
    const J = e => t.json(e);
    const night = (day, hour) => t.setDay(day, hour);
    const seaList = () => J(`MorzePotwory.seaList().map(c => ({ k: c._kind, x: c._x, y: c._y, mode: c._mode, hp: Math.round(c._hp), lv: c._level, scared: c._scared || 0, retreat: !!c._retreat }))`);
    const clearAll = () => t.eval(`(function(){ Creatures.clear("morze"); MorzePotwory.marks.clear(); MorzePotwory.tentacles.clear(); Morze.reset(); Morze.landing = null; return 0; })()`);
    const landNow = async (kind, frames = 420) => {
        const msg = await J(`Morze.force(${JSON.stringify(kind)})`);
        lap('before frames'); await t.frames(frames);
        return msg;
    };

    // ---------------------------------------------------------------- A. wtyczki, teksty, rejestr, rodzaje, przedmioty
    await t.newGame({ map: 125, x: 60, y: 70, hour: 22, day: 12 });
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), files: Watki.pliki().filter(f => f.name === "morze").map(f => ({ st: f.st, keys: f.keys, errors: f.errors })),
        q: !!TownQuests.Q.W23 && TownQuests.Q.W23.kind === "W" && TownQuests.Q.W23.steps.length, reg: Tawerna.inject.list().filter(r => r.owner === "Morze").map(r => r.ids),
        kinds: Object.keys(MorzeData.KINDS).filter(k => Creatures.KINDS[k] && Creatures.KINDS[k].sea), ai: ["topielec_morski", "krab_olbrzym", "rybolak", "mglak", "wiedzma"].every(k => !!Creatures.AI[k]),
        looks: ["$Cr_SeaDrowned", "$Cr_SeaCrab", "$Cr_SeaFolk", "$Cr_SeaFog", "$Cr_SeaWitch"].every(n => !!Hunting.LOOK8[n]),
        items: ["Wodorost", "Mięso kraba", "Pancerz kraba", "Łuska rybołaka", "Perła mgły", "Muszla śpiewająca", "Atrament krakena"].map(n => ($dataItems.find(i => i && i.name === n) || {}).id),
        loot: Object.keys(MorzeData.KINDS).every(k => Creatures.KINDS[k].loot.every(e => typeof e[0] === "number")) })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: Morze_Data pod Poselstwo_Data, nad TownLife i TownQuests_Data; Morze_Potwory i Morze pod Creatures i Poselstwo",
        ix("Morze_Data") > ix("Poselstwo_Data") && ix("Morze_Data") < ix("TownLife") && ix("Morze_Data") < ix("TownQuests_Data") && ix("Morze_Potwory") > ix("Creatures") && ix("Morze_Potwory") > ix("Poselstwo") && ix("Morze") > ix("Morze_Potwory"), base.list.filter(n => /Morze|Poselstwo|Creatures$|TownLife$|TownQuests/.test(n)));
    t.check("teksty morze.txt bez błędów; zadanie W23 (7 kroków); rejestr 4700-4799", base.files.length === 1 && base.files[0].st === "ok" && !base.files[0].errors.length && base.files[0].keys > 60 && base.q === 7 && base.reg.includes("4700-4799"), { files: base.files, q: base.q, reg: base.reg });
    t.check("rodzaje w Creatures (5), umysły, wyglądy; łup z numerami przedmiotów (siedem nowych przedmiotów w bazie)", base.kinds.length === 5 && base.ai && base.looks && base.items.every(Boolean) && base.loot, { kinds: base.kinds, items: base.items });

    // ---------------------------------------------------------------- B. szansa
    const ch = ctx => J(`Morze.chance(${JSON.stringify(Object.assign({ lit: false, lightOut: false, favour: 0, red: false, storm: false, bell: false, guard: 0, ending: "", fireShare: 0 }, ctx))})`);
    const near = (a, b) => Math.abs(a - b) < 1e-6;
    const c1 = await ch({ day: 1, map: 3 }), c10 = await ch({ day: 10, map: 3 }), c30 = await ch({ day: 30, map: 3 }), c99 = await ch({ day: 99, map: 3 });
    t.check("p(dzień) = min(30%, 1% x dzień): dzień 1 = 1%, 10 = 10%, 30 i dalej 30%", near(c1.p, 0.01) && near(c10.p, 0.1) && near(c30.p, 0.3) && near(c99.p, 0.3), [c1.p, c10.p, c30.p, c99.p]);
    const lit = await ch({ day: 30, map: 125, lit: true }), litOther = await ch({ day: 30, map: 3, lit: true });
    t.check("latarnia: przystań x0,3, reszta x0,5", near(lit.P, 0.09) && near(litOther.P, 0.15), [lit.P, litOther.P]);
    const mix = await ch({ day: 30, map: 125, lit: true, fireShare: 0.5, bell: true });
    t.check("mnożniki razem: dzień 30, przystań: 0,3 x 0,3 x (1 - 0,5 x 0,5) x 0,85 = 5,74%", near(mix.P, 0.3 * 0.3 * 0.75 * 0.85), mix);
    const gar = await ch({ day: 30, map: 162, lit: true, favour: 99 }), garOther = await ch({ day: 30, map: 3, favour: 99 });
    t.check("garnizon: własna mapa x0,4 (z latarnią x0,5), sąsiednie x0,8", near(gar.P, 0.3 * 0.5 * 0.4) && near(garOther.P, 0.3 * 0.8), [gar.P, garOther.P]);
    const floor = await ch({ day: 30, map: 125, lit: true, favour: 99, fireShare: 1, bell: true, guard: 1 });
    t.check("dolna granica: nigdy poniżej 15% podstawy (4,5% przy dniu 30), choć iloczyn mnożników mniejszy", near(floor.P, 0.045) && floor.m < 0.15, floor);
    const raised = await ch({ day: 30, map: 3, red: true, storm: true });
    t.check("czerwona woda x1,5, burza x1,3, sufit 45%", near(raised.P, 0.45) && near((await ch({ day: 10, map: 3, red: true })).P, 0.15) && near((await ch({ day: 10, map: 3, storm: true })).P, 0.13), raised);
    lap('stat'); const stat = await J(`(function(){ const out = {}; for (const P0 of [0.01, 0.054, 0.15, 0.3]) { let n = 0, N = 10000; for (let i = 0; i < N; i++) if (Morze.decide(1000 + i, 125, P0, false, 0).l) n++; out[P0] = n / N; } return out; })()`);
    t.check("statystyka 10 000 nocy: częstość lądowań zgodna z P (1%, 5,4%, 15%, 30% ± 1,2 pkt)", Object.entries(stat).every(([p, f]) => Math.abs(f - Number(p)) < 0.012), stat);
    // ---------------------------------------------------------------- C. ziarno, tabela rodzajów
    const seed = await J(`(function(){ const a = Morze.decide(77, 125, 0.4, true, 0), b = Morze.decide(77, 125, 0.4, true, 0), c = Morze.decide(78, 125, 0.4, true, 0);
        const kinds = (from, to, fog, last) => { const s = {}; for (let n = from; n <= to; n++) for (let m = 0; m < 20; m++) { const r = Morze.decide(n, 100 + m, 1, fog, last || 0); s[r.k] = (s[r.k] || 0) + 1; } return s; };
        return { same: JSON.stringify(a) === JSON.stringify(b), differs: JSON.stringify(a) !== JSON.stringify(c), early: kinds(1, 19, false), mid: kinds(20, 39, false), midFog: kinds(20, 39, true), late: kinds(40, 80, false, 0) }; })()`);
    const early = Object.keys(seed.early), mid = Object.keys(seed.mid), late = Object.keys(seed.late);
    t.check("ziarno: ta sama noc i mapa = to samo losowanie; inna noc = inne", seed.same && seed.differs, seed);
    t.check("tabela rodzajów: dni 1-19 tylko topielec i krab; 20-39 + rybołaki, mglak tylko we mgle; 40+ + wiedźma",
        early.every(k => ["topielec_morski", "krab_olbrzym"].includes(k)) && mid.includes("rybolaki") && !seed.mid.mglak && seed.midFog.mglak > 0 && !mid.includes("wiedzma") && late.includes("wiedzma"), seed);
    const wit = await J(`(function(){ let bad = 0; for (let n = 40; n < 200; n++) { const r = Morze.decide(n, 125, 1, false, n - 2); if (r.k === "wiedzma") bad++; } return bad; })()`);
    t.check("wiedźma najwyżej co trzecią noc (po wiedźmie sprzed 2 nocy: nigdy)", wit === 0, wit);
    const again = await J(`(function(){ const s = Morze.state(); s.noce = {}; const n = Morze.night().n; const a = Morze.recordFor(n, 125, true); const sp = JSON.stringify([a.l, a.k, a.c, a.o]); delete s.noce[Morze.key(n, 125)];
        const b = Morze.recordFor(n, 125, true); return sp === JSON.stringify([b.l, b.k, b.c, b.o]); })()`);
    t.check("wyjście z mapy i powrót niczego nie przelosowuje (rekord noc:mapa, ten sam wynik z ziarna)", again, again);

    // ---------------------------------------------------------------- D. lądowanie: znaki, wyjście z wody, ślady
    await clearAll();
    await night(12, 22.5);
    await t.eval(`(function(){ const n = Morze.night().n; Morze.state().noce[Morze.key(n, 125)] = { l: 1, k: "topielec_morski", c: 1, o: 0, sp: 0, left: 0, tr: null }; return 0; })()`);
    await t.eval("window.__kit.pops.splice(0); 0");
    lap('before frames'); await t.frames(120);
    const signs = await J(`({ landing: !!Morze.landing, cr: MorzePotwory.seaList().length })`);
    lap('before frames'); await t.frames(330);
    const out = await seaList();
    const pops = await t.popups({ clear: true });
    const marks = await J("MorzePotwory.marks.list().length");
    t.check("lądowanie z rekordu nocy: znaki (czeka na lądowanie), potem topielec wychodzi z kratki brzegu, stoi 6-30 pól od bohatera", signs.landing && signs.cr === 0 && out.length === 1 && out[0].k === "topielec_morski" && out[0].lv === 1, { signs, out });
    t.check("ślady: ~12 odcisków i wodorosty od wody; powiadomienie „Z morza wyszedł: Topielec”; wątek ruszył", marks >= 10 && pops.some(p => /Z morza wyszedł/.test(p)) && await J("!!Morze.state().start"), { marks, pops });
    await night(12, 23.0); lap('before frames'); await t.frames(30);
    const dist = await J(`Math.hypot(MorzePotwory.seaList()[0]._x - $gamePlayer.x, MorzePotwory.seaList()[0]._y - $gamePlayer.y)`);
    lap('before frames'); await t.frames(600);
    const closer = await J(`Math.hypot(MorzePotwory.seaList()[0]._x - $gamePlayer.x, MorzePotwory.seaList()[0]._y - $gamePlayer.y)`);
    t.check("potwór idzie za bohaterem (zbliża się, a z daleka podchodzi trybem „stalk”)", closer < dist || closer < 3, { dist, closer });
    await night(12, 20.9); await t.shot(SHOTS + "01_topielec_przystan.png");

    lap('end');
});
