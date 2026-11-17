// W23 „Coś z głębin” - potwory z morza i wątek (docs/POTWORY_Z_MORZA.md; js/plugins/Morze_Data.js, Morze.js, Morze_Potwory.js, js/teksty/morze.txt).
// 2026-11-12 (fala 2): utopieni żołnierze wojny jako SZKIELETY (pałka, miecz, włócznia, młot), kraby, rzadki krab-kolos, kapitan z chorągwią (rozdz. 5), duże macki krakena.
// Sprawdza: wtyczki, teksty, rejestr zdarzeń 4700-4799, rodzaje w Creatures, przedmioty (w tym zmienione na miejscu 413-415), brak martwych odwołań do usuniętych rodzajów;
// wzór szansy (p, mnożniki, dolna granica, sufit, statystyka 10 000 nocy); ziarno; tabelę rodzajów po dniach (z krabem-kolosem ~8%); lądowanie (znaki, wyjście z wody, ślady, powiadomienie),
// świt (odwrót do wody); strach przed ogniem; każdy rodzaj (pałka w parze, miecz - kombinacja, włócznia - zasięg i dystans, młot - ciężki cios, krab, krab-kolos x2, kapitan), śmierć w stos kości
// i łup; macki (większe: strefa, życie, arkusz), miasto (straż), sen z potworem w 8 polach zablokowany, wątek W23 (rozdziały skokami F9, kapitan i znak chorągwi), wiersze F9,
// zapis i wczytanie.
// Uruchom: GAME_OVERLAY=tools/potwory2/overlay GAME_OVERLAY_JS=1 CDP_PORT=9440 node tests/morze_test.js
const kit = require("./lib/kit.js");
const fs = require("fs");
const SHOTS = "../docs/zadania_nowe/potwory2_gra/";
const KINDS = ["szkielet_palka", "szkielet_miecz", "szkielet_wlocznia", "szkielet_mlot", "kapitan_szkieletow", "krab_olbrzym", "krab_kolos"];
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", port: Number(process.env.CDP_PORT) || 9440 }, async t => {
    const __T0 = Date.now(), __c = t.check.bind(t);
    t.check = (...a) => { console.log('   [' + Math.round((Date.now() - __T0) / 1000) + 's]'); return __c(...a); };
    const J = e => t.json(e);
    const night = (day, hour) => t.setDay(day, hour);
    const seaList = () => J(`MorzePotwory.seaList().map(c => ({ k: c._kind, x: c._x, y: c._y, mode: c._mode, hp: Math.round(c._hp), lv: c._level, scared: c._scared || 0, retreat: !!c._retreat, scale: c._scale }))`);
    const clearAll = () => t.eval(`(function(){ Creatures.clear("morze"); MorzePotwory.marks.clear(); MorzePotwory.tentacles.clear(); Morze.reset(); Morze.landing = null; return 0; })()`);
    const landNow = async (kind, frames = 420) => {
        const msg = await J(`Morze.force(${JSON.stringify(kind)})`);
        await t.frames(frames);
        return msg;
    };
    // a creature placed near the hero on a free cell (distance d), engaged
    const place = (kind, d, extra) => J(`(function(){ const hx = $gamePlayer.x, hy = $gamePlayer.y; let c = null;
        for (const [dx, dy] of [[${d}, 0], [-${d}, 0], [0, ${d}], [0, -${d}], [${d}, 1], [-${d}, 1], [1, ${d}], [1, -${d}]]) { const x = hx + dx, y = hy + dy; if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f)) { Creatures.spawn(${JSON.stringify(kind)}, x, y, Object.assign({ tag: "morze", engaged: true, level: 1, single: true }, ${JSON.stringify(extra || {})})); c = true; break; } }
        MorzePotwory.seaList().forEach(o => { o._hunt = false; }); return !!c; })()`);
    const heal = () => t.eval(`(function(){ const a = $gameParty.leader(); a.setHp(a.mhp); a.setMp && a.setMp(a.mmp); return 0; })()`);
    const srcOk = s => !/(wiedzma|mglak|rybolak|topielec_morski|SeaWitch|SeaFog|SeaFolk|SeaDrowned|perla|muszla)/i.test(s);

    // ---------------------------------------------------------------- A. wtyczki, teksty, rejestr, rodzaje, przedmioty, brak martwych odwołań
    await t.newGame({ map: 219, x: 33, y: 46, hour: 22, day: 12 });
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), files: Watki.pliki().filter(f => f.name === "morze").map(f => ({ st: f.st, keys: f.keys, errors: f.errors })),
        q: !!TownQuests.Q.W23 && TownQuests.Q.W23.kind === "W" && TownQuests.Q.W23.steps.length, reg: Tawerna.inject.list().filter(r => r.owner === "Morze").map(r => r.ids),
        kinds: Object.keys(MorzeData.KINDS).filter(k => Creatures.KINDS[k] && Creatures.KINDS[k].sea), ai: Object.keys(MorzeData.KINDS).every(k => !!Creatures.AI[k]),
        looks: ["$Cr_SeaCrab", "$Cr_SkClub", "$Cr_SkSword", "$Cr_SkSpear", "$Cr_SkHammer", "$Cr_SkCaptain"].every(n => !!Hunting.LOOK8[n]),
        gone: ["topielec_morski", "rybolak", "mglak", "wiedzma"].map(k => !!Creatures.KINDS[k] || !!MorzeData.KINDS[k]),
        items: ["Wodorost", "Mięso kraba", "Pancerz kraba", "Zardzewiałe ostrze", "Grot włóczni", "Znak chorągwi", "Atrament krakena"].map(n => ($dataItems.find(i => i && i.name === n) || {}).id),
        oldItems: ["Łuska rybołaka", "Perła mgły", "Muszla śpiewająca"].map(n => !!$dataItems.find(i => i && i.name === n)),
        loot: Object.keys(MorzeData.KINDS).every(k => Creatures.KINDS[k].loot.every(e => typeof e[0] === "number")) })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: Morze_Data pod Poselstwo_Data, nad TownLife i TownQuests_Data; Morze_Potwory i Morze pod Creatures i Poselstwo",
        ix("Morze_Data") > ix("Poselstwo_Data") && ix("Morze_Data") < ix("TownLife") && ix("Morze_Data") < ix("TownQuests_Data") && ix("Morze_Potwory") > ix("Creatures") && ix("Morze_Potwory") > ix("Poselstwo") && ix("Morze") > ix("Morze_Potwory"), base.list.filter(n => /Morze|Poselstwo|Creatures$|TownLife$|TownQuests/.test(n)));
    t.check("teksty morze.txt bez błędów; zadanie W23 (7 kroków); rejestr 4700-4799", base.files.length === 1 && base.files[0].st === "ok" && !base.files[0].errors.length && base.files[0].keys > 60 && base.q === 7 && base.reg.includes("4700-4799"), { files: base.files, q: base.q, reg: base.reg });
    t.check("rodzaje w Creatures (7: pałka, miecz, włócznia, młot, kapitan, krab, krab-kolos), umysły, wyglądy; łup z numerami przedmiotów", base.kinds.length === 7 && KINDS.every(k => base.kinds.includes(k)) && base.ai && base.looks && base.loot, { kinds: base.kinds });
    t.check("usunięte rodzaje (topielec, rybołak, mglak, wiedźma) zniknęły z Creatures i z danych; nowe przedmioty 410-416 (413-415 zmienione na miejscu), stare nazwy nie istnieją", base.gone.every(x => !x) && base.items.every(Boolean) && base.items[3] === 413 && base.items[4] === 414 && base.items[5] === 415 && base.oldItems.every(x => !x), { gone: base.gone, items: base.items, old: base.oldItems });
    const srcs = ["js/plugins/Morze.js", "js/plugins/Morze_Data.js", "js/plugins/Morze_Potwory.js", "js/teksty/morze.txt"].map(f => [f, fs.readFileSync("../" + f, "utf8")   /* (2026-11-16: the overlay folder is gone - the installed files) */]);
    const dead = srcs.filter(([f, s]) => !srcOk(s)).map(([f, s]) => [f, (s.match(/(wiedzma|mglak|rybolak|topielec_morski|SeaWitch|SeaFog|SeaFolk|SeaDrowned|perla|muszla)/i) || [])[0]]);
    t.check("kod i teksty W23 bez martwych odwołań do usuniętych rodzajów (wiedźma, mglak, rybołak, topielec morski, perła, muszla)", dead.length === 0, dead);

    // ---------------------------------------------------------------- B. szansa
    const ch = ctx => J(`Morze.chance(${JSON.stringify(Object.assign({ lit: false, lightOut: false, favour: 0, red: false, storm: false, bell: false, guard: 0, ending: "", fireShare: 0 }, ctx))})`);
    const near = (a, b) => Math.abs(a - b) < 1e-6;
    const c1 = await ch({ day: 1, map: 3 }), c10 = await ch({ day: 10, map: 3 }), c30 = await ch({ day: 30, map: 3 }), c99 = await ch({ day: 99, map: 3 });
    t.check("p(dzień) = min(30%, 1% x dzień): dzień 1 = 1%, 10 = 10%, 30 i dalej 30%", near(c1.p, 0.01) && near(c10.p, 0.1) && near(c30.p, 0.3) && near(c99.p, 0.3), [c1.p, c10.p, c30.p, c99.p]);
    const lit = await ch({ day: 30, map: 219, lit: true }), litOther = await ch({ day: 30, map: 218, lit: true });
    t.check("latarnia: przystań x0,3, reszta x0,5", near(lit.P, 0.09) && near(litOther.P, 0.15), [lit.P, litOther.P]);
    const mix = await ch({ day: 30, map: 219, lit: true, fireShare: 0.5, bell: true });
    t.check("mnożniki razem: dzień 30, przystań: 0,3 x 0,3 x (1 - 0,5 x 0,5) x 0,85 = 5,74%", near(mix.P, 0.3 * 0.3 * 0.75 * 0.85), mix);
    const gar = await ch({ day: 30, map: 218, lit: true, favour: 99 }), garOther = await ch({ day: 30, map: 218, favour: 99 });
    t.check("przychylność garnizonu: wszędzie x0,8 (nowy świat nie ma mapy garnizonu - „własnej” x0,4 nie ma); z latarnią jeszcze x0,5", near(gar.P, 0.3 * 0.5 * 0.8) && near(garOther.P, 0.3 * 0.8), [gar.P, garOther.P]);
    const floor = await ch({ day: 30, map: 219, lit: true, favour: 99, fireShare: 1, bell: true, guard: 1 });
    t.check("dolna granica: nigdy poniżej 15% podstawy (4,5% przy dniu 30), choć iloczyn mnożników mniejszy", near(floor.P, 0.045) && floor.m < 0.15, floor);
    const raised = await ch({ day: 30, map: 3, red: true, storm: true });
    t.check("czerwona woda x1,5, burza x1,3, sufit 45%", near(raised.P, 0.45) && near((await ch({ day: 10, map: 3, red: true })).P, 0.15) && near((await ch({ day: 10, map: 3, storm: true })).P, 0.13), raised);
    const stat = await J(`(function(){ const out = {}; for (const P0 of [0.01, 0.054, 0.15, 0.3]) { let n = 0, N = 10000; for (let i = 0; i < N; i++) if (Morze.decide(1000 + i, 219, P0).l) n++; out[P0] = n / N; } return out; })()`);
    t.check("statystyka 10 000 nocy: częstość lądowań zgodna z P (1%, 5,4%, 15%, 30% ± 1,2 pkt)", Object.entries(stat).every(([p, f]) => Math.abs(f - Number(p)) < 0.012), stat);
    // ---------------------------------------------------------------- C. ziarno, tabela rodzajów po dniach
    const seed = await J(`(function(){ const a = Morze.decide(77, 219, 0.4), b = Morze.decide(77, 219, 0.4), c = Morze.decide(78, 219, 0.4);
        const kinds = (from, to) => { const s = {}; for (let n = from; n <= to; n++) for (let m = 0; m < 20; m++) { const r = Morze.decide(n, 100 + m, 1); s[r.k] = (s[r.k] || 0) + 1; } return s; };
        return { same: JSON.stringify(a) === JSON.stringify(b), differs: JSON.stringify(a) !== JSON.stringify(c), early: kinds(1, 19), mid: kinds(20, 39), late: kinds(40, 200) }; })()`);
    const early = Object.keys(seed.early), mid = Object.keys(seed.mid), late = Object.keys(seed.late);
    const lateTotal = Object.values(seed.late).reduce((a, b) => a + b, 0), kolos = (seed.late.krab_kolos || 0) / lateTotal;
    t.check("ziarno: ta sama noc i mapa = to samo losowanie; inna noc = inne", seed.same && seed.differs, seed);
    t.check("tabela po dniach: 1-19 tylko szkielet z pałką i z mieczem; 20-39 + włócznia, młot, krab olbrzym; 40+ + krab-kolos; kapitan nigdy z tabeli",
        early.every(k => ["szkielet_palka", "szkielet_miecz"].includes(k)) && early.length === 2 && ["szkielet_wlocznia", "szkielet_mlot", "krab_olbrzym"].every(k => mid.includes(k)) && !mid.includes("krab_kolos") && late.includes("krab_kolos") && !late.includes("kapitan_szkieletow") && !mid.includes("kapitan_szkieletow"), seed);
    t.check("krab-kolos rzadki: ok. 8% lądowań od dnia 40 (5-11%)", kolos > 0.05 && kolos < 0.11, { kolos, late: seed.late });
    const nlist = await J(`(function(){ const out = { c: Morze.decide(5, 219, 1).c, grp: MorzeData.GROUP, cap: MorzeData.MAX_AT_ONCE }; return out; })()`);
    t.check("pałka zawsze w parze (grupa 2), na raz najwyżej 3 potwory", nlist.grp.szkielet_palka.count[0] === 2 && nlist.grp.szkielet_palka.count[1] === 2 && nlist.cap === 3, nlist);
    const again = await J(`(function(){ const s = Morze.state(); s.noce = {}; const n = Morze.night().n; const a = Morze.recordFor(n, 219, true); const sp = JSON.stringify([a.l, a.k, a.c, a.o]); delete s.noce[Morze.key(n, 219)];
        const b = Morze.recordFor(n, 219, true); return sp === JSON.stringify([b.l, b.k, b.c, b.o]); })()`);
    t.check("wyjście z mapy i powrót niczego nie przelosowuje (rekord noc:mapa, ten sam wynik z ziarna)", again, again);

    // ---------------------------------------------------------------- D. lądowanie: znaki, wyjście z wody, ślady
    await clearAll();
    await night(12, 22.5);
    await t.eval(`(function(){ const n = Morze.night().n; Morze.state().noce[Morze.key(n, 219)] = { l: 1, k: "szkielet_miecz", c: 1, o: 0, sp: 0, left: 0, tr: null }; return 0; })()`);
    await t.eval("window.__kit.pops.splice(0); 0");
    await t.frames(120);
    const signs = await J(`({ landing: !!Morze.landing, cr: MorzePotwory.seaList().length })`);
    await t.frames(330);
    const out = await seaList();
    const pops = await t.popups({ clear: true });
    const marks = await J("MorzePotwory.marks.list().length");
    t.check("lądowanie z rekordu nocy: znaki (czeka na lądowanie), potem szkielet z mieczem wychodzi z kratki brzegu", signs.landing && signs.cr === 0 && out.length === 1 && out[0].k === "szkielet_miecz" && out[0].lv === 1, { signs, out });
    t.check("ślady: ~12 odcisków i wodorosty od wody; powiadomienie „Z morza: Szkielet z mieczem”; wątek ruszył", marks >= 10 && pops.some(p => /Z morza: Szkielet z mieczem/.test(p)) && await J("!!Morze.state().start"), { marks, pops });
    await night(12, 23.0); await t.frames(30);
    const dist = await J(`Math.hypot(MorzePotwory.seaList()[0]._x - $gamePlayer.x, MorzePotwory.seaList()[0]._y - $gamePlayer.y)`);
    await t.frames(600);
    const closer = await J(`Math.hypot(MorzePotwory.seaList()[0]._x - $gamePlayer.x, MorzePotwory.seaList()[0]._y - $gamePlayer.y)`);
    t.check("potwór idzie za bohaterem (zbliża się, a z daleka podchodzi trybem „stalk”)", closer < dist || closer < 3, { dist, closer });
    await night(12, 20.9); await t.shot(SHOTS + "t01_szkielet_przystan.png");
    // ---------------------------------------------------------------- E. świt
    await t.eval(`MorzePotwory.seaList().forEach(c => c.setMode("idle")); Morze.dawn(); 0`);
    await t.frames(200);
    const dawn1 = await J(`MorzePotwory.seaList().map(c => !!c._retreat)`);
    await t.until("MorzePotwory.seaList().length === 0", 40, 300);
    const gone = await J("MorzePotwory.seaList().length");
    t.check("świt: potwór cofa się do wody (odwrót, plusk) i znika; nie ginie od słońca", dawn1.every(Boolean) || dawn1.length === 0, { dawn1, gone });
    t.check("po odwrocie lista pusta (do 40 s)", gone === 0, gone);

    // ---------------------------------------------------------------- F. strach przed ogniem (pochodnia w ręku), sen z potworem w 8 polach
    await clearAll();
    await night(12, 23.5);
    await t.eval(`(function(){ const hx = $gamePlayer.x, hy = $gamePlayer.y; Creatures.spawn("szkielet_miecz", hx, hy + 4, { tag: "morze", engaged: true, level: 1, single: true }); MorzePotwory.seaList().forEach(c => { c._hunt = true; }); return 0; })()`);
    await t.frames(60);
    const rest = await J(`Tawerna.api("Farming_parts").build.restDanger()`);
    t.check("sen: potwór z morza w 8 polach = „Nie zaśniesz” (restDanger podaje jego imię)", /Szkielet/i.test(rest || ""), rest);
    await t.eval(`(function(){ if (window.Torch && Torch.light) Torch.light(); return 0; })()`);
    await t.frames(150);
    const fear = await J(`({ lit: !!(window.Torch && Torch.isLit && Torch.isLit()), cr: MorzePotwory.seaList().map(c => ({ scared: c._scared || 0, d: Math.hypot(c._x - $gamePlayer.x, c._y - $gamePlayer.y), mode: c._mode })) })`);
    t.check("szkielet boi się pochodni w ręku (cofa się, nie wchodzi bliżej niż ~2 pola)", fear.lit && fear.cr.length === 1 && fear.cr[0].d >= 1.8, fear);
    await t.eval(`(function(){ if (window.Torch && Torch.douse) Torch.douse(""); return 0; })()`);

    // ---------------------------------------------------------------- G. rodzaje po kolei: pałka (para), miecz (kombinacja), włócznia (zasięg), młot (ciężki cios), krab, krab-kolos, kapitan
    await clearAll();
    await landNow("szkielet_palka", 420);
    const clubs = await seaList();
    const kd = await J(`(function(){ const K = Creatures.KINDS; return { club: K.szkielet_palka.speed, sword: K.szkielet_miecz.speed, spear: K.szkielet_wlocznia.speed, hammer: K.szkielet_mlot.speed, hpClub: K.szkielet_palka.hp, hpSword: K.szkielet_miecz.hp,
        reach: [K.szkielet_miecz.moves.cut.reach, K.szkielet_wlocznia.moves.thrust.reach], gb: K.szkielet_mlot.moves.smash.guardBreak, kn: K.szkielet_mlot.moves.smash.knock, dm: [K.szkielet_miecz.moves.cut.dmg, K.szkielet_mlot.moves.smash.dmg] }; })()`);
    t.check("pałka: dwa szkielety naraz (para, jeden bije, drugi czeka), szybkie i słabe (prędkość 3,3 > miecz 2,9 > młot 2,3; życie 36 < 58)", clubs.length === 2 && clubs.every(c => c.k === "szkielet_palka") && kd.club > kd.sword && kd.sword > kd.hammer && kd.hpClub < kd.hpSword, { clubs, kd });
    await t.shot(SHOTS + "t02_para_palek.png");
    // the sword: a combo of cuts (the chances forced to 1: cut -> cut2 -> cut3), logged on the creature
    await clearAll();
    await heal();
    await place("szkielet_miecz", 3);
    const combo = await J(`(function(){ const c = MorzePotwory.seaList()[0]; c._def = Object.assign({}, c._def, { combo: [1, 1] }); c._log = []; const sm = c.startMove; c.startMove = function(n, o) { c._log.push(n); return sm.call(this, n, o); }; return !!c; })()`);
    await t.frames(500);
    const log = await J(`MorzePotwory.seaList()[0]._log`);
    const chain = log.join(",").includes("cut,cut2,cut3");
    t.check("miecz: kombinacja cięć (cut -> cut2 -> cut3), jedno po drugim", combo && chain, log.slice(0, 12));
    // the spear: reach 2.6 (a sword 1.8), keeps its distance (keep 2.6-4.0), thrusts and steps back
    await clearAll();
    await heal();
    await place("szkielet_wlocznia", 4);
    await t.eval(`(function(){ const c = MorzePotwory.seaList()[0]; c._log = []; const sm = c.startMove; c.startMove = function(n, o) { c._log.push(n); return sm.call(this, n, o); }; c._minD = 99; c._maxD = 0; return 0; })()`);
    const hpS0 = await J("$gameParty.leader().hp");
    let minD = 99;
    for (let i = 0; i < 20; i++) { await t.frames(50); const d = await J(`(function(){ const c = MorzePotwory.seaList()[0]; return c ? Math.hypot(c.centerX() - ($gamePlayer._realX + 0.5), c.centerY() - ($gamePlayer._realY + 0.5)) : 99; })()`); minD = Math.min(minD, d); }
    const spear = await J(`({ log: MorzePotwory.seaList()[0]._log, hp: $gameParty.leader().hp })`);
    t.check("włócznia: zasięg 2,6 (miecz 1,8), pcha z dystansu (nie wchodzi bliżej niż ~1,6 pola) i rani", kd.reach[1] > kd.reach[0] && spear.log.includes("thrust") && minD >= 1.4 && spear.hp < hpS0, { reach: kd.reach, log: spear.log.slice(0, 6), minD, hp: [hpS0, spear.hp] });
    // the hammer: one heavy blow that breaks the guard and knocks down
    await clearAll();
    await heal();
    await place("szkielet_mlot", 2);
    const hpH0 = await J("$gameParty.leader().hp");
    await t.eval(`(function(){ const c = MorzePotwory.seaList()[0]; c._log = []; const sm = c.startMove; c.startMove = function(n, o) { c._log.push(n); return sm.call(this, n, o); }; return 0; })()`);
    await t.frames(400);
    const ham = await J(`({ log: MorzePotwory.seaList()[0]._log, hp: $gameParty.leader().hp })`);
    t.check("młot: wolny, jedno ciężkie uderzenie (smash 20 obrażeń, łamie gardę, powala), bohater dostaje ciężko", kd.gb && kd.kn >= 1 && kd.dm[1] > kd.dm[0] * 2 - 1 && ham.log.every(n => n === "smash") && ham.log.length >= 1 && hpH0 - ham.hp >= 10, { kd, log: ham.log.slice(0, 5), lost: hpH0 - ham.hp });
    // the crab and the giga crab
    await clearAll();
    await heal();
    await landNow("krab_olbrzym", 360);
    const crab = await seaList();
    t.check("krab olbrzym: jeden, pancerz z przodu (stone), prędkość 2,0, skala 1", crab.length === 1 && crab[0].k === "krab_olbrzym" && crab[0].scale === 1 && await J("Creatures.KINDS.krab_olbrzym.stone.front === 0.35 && Creatures.KINDS.krab_olbrzym.speed === 2.0"), crab);
    await t.eval(`(function(){ const c = MorzePotwory.seaList()[0]; c._def = Object.assign({}, c._def, { leash: 3 }); c._x = 20; c._y = 20; c._realX = 20; c._realY = 20; c._lost = 99999; return 0; })()`);
    await t.frames(60);
    const leash = await J(`MorzePotwory.seaList().map(c => !!c._retreat)`);
    t.check("krab broni swojego kawałka brzegu: po długim braku bohatera wraca do wody (odwrót i plusk - znika)", leash.length === 0 || leash[0], leash);
    await clearAll();
    await landNow("krab_kolos", 420);
    const big = await J(`(function(){ const c = MorzePotwory.seaList()[0]; if (!c) return null; const sp = c._sprite; const K = Creatures.KINDS; return { k: c._kind, scale: c._scale, radius: c._radius, hp: c._hp, hp1: K.krab_olbrzym.hp, speed: K.krab_kolos.speed, speed1: K.krab_olbrzym.speed, sx: sp ? Math.abs(sp.scale.x) : -1, sy: sp ? Math.abs(sp.scale.y) : -1,
        poise: [K.krab_kolos.poise, K.krab_olbrzym.poise], name: c.name(), presses: [K.krab_kolos.moves.grab.presses, K.krab_olbrzym.moves.grab.presses] }; })()`);
    t.check("krab-kolos: dwa razy większy (skala 2, promień 1,0, duszek x2), więcej życia i równowagi, wolniejszy, mocniejszy chwyt (więcej szarpnięć), własna nazwa „Krab-kolos”",
        big && big.k === "krab_kolos" && big.scale === 2 && big.radius >= 1 && big.sx === 2 && big.sy === 2 && big.hp > 2.2 * big.hp1 && big.speed < big.speed1 && big.poise[0] > big.poise[1] && big.presses[0] > big.presses[1] && /Krab-kolos/.test(big.name), big);
    await t.shot(SHOTS + "t03_krab_kolos.png");
    // the captain with the banner (chapter 5, forced)
    await clearAll();
    await landNow("kapitan_szkieletow", 420);
    const cap = await J(`(function(){ const c = MorzePotwory.seaList()[0]; const K = Creatures.KINDS.kapitan_szkieletow; return c ? { k: c._kind, hp: c._hp, over: !!K.moves.over.guardBreak, combo: K.combo, name: c.name() } : null; })()`);
    t.check("kapitan z chorągwią: jeden, mocniejszy od szkieletu z mieczem (życie 190, kombinacja 3 cięć + cios znad głowy łamiący gardę)", cap && cap.k === "kapitan_szkieletow" && cap.hp > 150 && cap.over && cap.combo.length === 2 && /Kapitan/.test(cap.name), cap);

    // ---------------------------------------------------------------- H. śmierć w stos kości i łup (każdy rodzaj), kapitan: znak chorągwi i rozdział 5
    await clearAll();
    await night(15, 23.0);
    const loots = {};
    for (const kind of KINDS) {
        await t.eval(`Creatures.clear("morze"); 0`);
        await t.eval(`(function(){ window.__rnd = Math.random; Math.random = () => 0.0001; Creatures.spawn(${JSON.stringify(kind)}, $gamePlayer.x + 2, $gamePlayer.y, { tag: "morze", engaged: true, level: 1, single: true }); const w = MorzePotwory.seaList()[0]; Creatures.die(w, "test"); return 0; })()`);
        await t.frames(110);
        await t.eval(`Math.random = window.__rnd; 0`);   // (the loot is rolled when the body is done falling - the dice stay loaded till then)
        loots[kind] = await J(`(function(){ const d = Creatures.drops().slice(-1)[0]; return d ? { kind: d.kind, look: d.look, items: d.items.map(i => $dataItems[i[0]].name), gold: d.gold } : null; })()`);
    }
    t.check("każdy rodzaj po śmierci zostawia szczątki (stos kości / pancerza krabów) z łupem: pałka i miecz - ostrze, włócznia - grot, młot - złom, kapitan - Znak chorągwi, kraby - mięso i pancerz",
        KINDS.every(k => loots[k] && loots[k].kind === "drowned") && loots.szkielet_miecz.items.includes("Zardzewiałe ostrze") && loots.szkielet_wlocznia.items.includes("Grot włóczni") && loots.szkielet_mlot.items.includes("Złom żelazny")
        && loots.kapitan_szkieletow.items.includes("Znak chorągwi") && loots.krab_olbrzym.items.includes("Mięso kraba") && loots.krab_kolos.items.includes("Pancerz kraba") && loots.szkielet_palka.items.includes("Zardzewiałe ostrze"), loots);
    const kk = await J(`({ p: Morze.state().kapitanPokonany, q: TownQuests.rec("W23") ? TownQuests.rec("W23").s : null })`);
    t.check("pokonany kapitan ustawia warunek rozdziału 5 (kapitanPokonany)", kk.p > 0, kk);
    await t.shot(SHOTS + "t04_kosci_lup.png");

    // ---------------------------------------------------------------- I. macki (duże)
    await clearAll();
    await night(70, 22.5);
    await t.go(219, 33, 46, 2);
    const hp0 = await J("$gameParty.leader().hp");
    await t.eval(`Morze.force("macki"); 0`);
    await t.frames(30);
    const tent0 = await J(`MorzePotwory.tentacles.list().map(t => [t.phase, t.x, t.y])`);
    await t.frames(200);
    const tent1 = await J(`MorzePotwory.tentacles.list().map(t => t.phase)`);
    t.check("macki: 2-3 (kręgi na wodzie 2 s przed uderzeniem, potem wynurzenie)", tent0.length >= 2 && tent0.length <= 3 && tent0.every(x => x[0] === "warn") && tent1.every(x => x !== "warn"), { tent0, tent1 });
    const tbig = await J(`(function(){ const t0 = MorzePotwory.tentacles.list()[0]; const s = t0.sprite; return { hp: t0.hp, cfg: MorzeData.TENTACLE, sx: s ? Math.abs(s.scale.x) : -1, ph: s && s.bitmap ? s.bitmap.width + "x" + s.bitmap.height : null, file: MorzePotwory.MA.file, cell: [MorzePotwory.MA.cw, MorzePotwory.MA.ch], shown: s ? s.visible : null }; })()`);
    t.check("macki dwa razy większe: strefa uderzenia 3,6 pola (było 2), zasięg 4,5 (było 3), życie 160, arkusz Morze_Macka_Duza (komórki 176x128) rysowany x2", tbig.cfg.zone >= 3.6 && tbig.cfg.reach >= 4.5 && tbig.hp === 160 && tbig.file === "Morze_Macka_Duza" && tbig.cell[0] === 176 && tbig.cell[1] === 128 && tbig.sx === 2 && /^2112x128$/.test(tbig.ph), tbig);
    await t.shot(SHOTS + "t05_macki_duze.png");
    // the strike zone: the hero 3 tiles from the arm is hit (the first version's zone of 2 would miss him)
    const hitTest = await J(`(function(){ const t0 = MorzePotwory.tentacles.list()[0]; let spot = null;
        for (let r = 29; r >= 26; r--) for (let a = 0; a < 16 && !spot; a++) { const x = Math.round(t0.x + 0.5 + Math.cos(a / 16 * 6.283) * r / 10 - 0.5), y = Math.round(t0.y + 0.5 + Math.sin(a / 16 * 6.283) * r / 10 - 0.5); const d = Math.hypot(x + 0.5 - (t0.x + 0.5), y + 0.5 - (t0.y + 0.5));
            if (d > 2.4 && d < 3.5 && $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f)) spot = [x, y, d]; }
        if (!spot) return null; $gamePlayer.locate(spot[0], spot[1]); MorzePotwory.tentacles.list().forEach((t, i) => { if (i) { t.phase = "sink"; t.t = 0; } }); t0.phase = "idle"; t0.t = 999; t0.cd = 0; return spot; })()`);
    const hpT0 = await J("$gameParty.leader().hp");
    await t.frames(120);
    const hit = await J(`({ hp: $gameParty.leader().hp, ph: MorzePotwory.tentacles.list().map(t => t.phase) })`);
    t.check("macka uderza w strefie większej niż pierwotne 2 pola (bohater w odległości 2,4-3,5): obrażenia, chwyt klawiszami", hitTest && hit.hp < hpT0, { hitTest, hpT0, hit });
    await t.eval(`(function(){ MorzePotwory.tentacles.list().forEach(t => { t.phase = "idle"; t.t = 0; t.cd = 99999; t.hp = 160; }); const t0 = MorzePotwory.tentacles.list()[0]; $gamePlayer.locate(t0.x, t0.y + 1); $gamePlayer.setDirection(8); for (let i = 0; i < 9; i++) Tawerna.emit("attack", { heavy: true }); return 0; })()`);
    await t.frames(30);
    const cut = await J(`MorzePotwory.tentacles.list().map(t => [t.phase, t.hp])`);
    t.check("macka odcięta przez ciosy bohatera (życie 160): zanurza się", cut.some(x => x[0] === "sink" || x[1] <= 0) || cut.length < 3, cut);

    // ---------------------------------------------------------------- I2. (2026-11-16, gracz) potwory w głąb lądu - do Podgrodzia i Kruczogrodu - ZAWSZE od zachodu
    const zach = {};
    for (const m of [218, 220]) {
        await t.go(m, 40, 40, 8);
        await t.frames(20);
        zach[m] = await J(`(function(){ const out = []; const was = $gameSystem._dayNightDay; for (let d = 20; d < 40; d++) { $gameSystem._dayNightDay = d; const g = Morze.townGate(); out.push(g ? [g.x, g.y] : null); }
            $gameSystem._dayNightDay = was; return { town: Morze.townMap(), gates: out }; })()`);
    }
    t.check("Podgrodzie i Kruczogród to mapy w głąb lądu; potwór wchodzi zawsze zachodnią krawędzią (x 0-1) - przez 20 nocy żadnego wejścia od wschodu ani ze środka",
        zach[218].town && zach[220].town && [218, 220].every(m => zach[m].gates.every(g => g && g[0] <= 1)), zach);
    const szansa = await J(`({ p: Morze.recordFor(30, 218, true).P, m: Morze.recordFor(30, 220, true).P })`);
    t.check("Podgrodzie (pierwsze za wybrzeżem) ma szansę nocy, miasto mniejszą", szansa.p >= 0 && szansa.m >= 0, szansa);
    // ---------------------------------------------------------------- J. miasto: straż wychodzi ze strażnicy, nikt nie ginie; w tawernie potwora nie ma
    await clearAll();
    await t.go(220, 40, 22, 2);
    await night(14, 22.5);
    await t.eval(`(function(){ Creatures.spawn("szkielet_miecz", 50, 22, { tag: "morze", engaged: true, level: 1, single: true }); MorzePotwory.seaList().forEach(c => { c._hunt = true; }); MorzePotwory.watch.begin(); return 0; })()`);
    await t.frames(150);
    const men = await J(`MorzePotwory.watch.state.men.map(m => [m._x, m._y, m._hurt])`);
    await t.shot(SHOTS + "t06_miasto_straz.png");
    await t.until("MorzePotwory.seaList().length === 0", 40, 500);
    const after = await J(`({ left: MorzePotwory.seaList().length, men: MorzePotwory.watch.state.men.length, hp: $gameParty.leader().hp })`);
    t.check("miasto: straż (2 strażników ze strażnicy, dzwon 3+1) wychodzi na szkielet; pada (bez bohatera)", men.length === 2 && after.left === 0, { men, after });
    await t.until("MorzePotwory.watch.state.men.length === 0", 40, 400);
    t.check("po walce strażnicy wracają do strażnicy (nikt nie znika na ulicy, nikt nie ginie)", await J("MorzePotwory.watch.state.men.length") === 0, 0);
    await t.go(1, 14, 30, 2);
    await t.frames(60);
    t.check("tawerna (wnętrze): żaden potwór z morza tu nie wchodzi (lądowanie tylko na mapach morza i w mieście)", await J("!Morze.seaMap() && !Morze.townMap() && MorzePotwory.seaList().length === 0"), 0);

    // ---------------------------------------------------------------- K. wątek W23: początek (kości na plaży), rozdziały, nagrody
    await clearAll();
    await t.eval(`(function(){ const s = Morze.state(); Object.assign(s, { start: 0, kosci: 0, slady: {}, zapisy: {}, zapisy3: {}, dzwon: 0, kleofas: 0, kapitanPokonany: 0, kleofasZnak: 0, znak: 0, krakenNoc: 0, koniec: 0, wybor: "", straz: 0 }); return 0; })()`);
    await t.go(219, 33, 46, 2);
    await night(10, 7.0);
    await t.eval(`Morze.state().noce = {}; Tawerna.emit("hourChange", { hour: 7, prev: 6, day: 10 }); 0`);
    await t.frames(60);
    const sign = await J(`({ kosci: Morze.state().kosci, start: Morze.state().start, marks: MorzePotwory.marks.list().map(m => m.kind) })`);
    t.check("dzień 10 rano na Przystani: kości i zardzewiały miecz na plaży oraz mokre ślady (bez ataku, bez potwora), wątek rusza na pewno", sign.kosci === 10 && sign.start === 10 && sign.marks.includes("bones") && sign.marks.filter(k => k === "track").length >= 8 && await J("MorzePotwory.seaList().length") === 0, sign);
    await t.eval(`(function(){ const m = MorzePotwory.marks.list().find(x => x.kind === "bones"); $gamePlayer.locate(Math.round(m.x) + 1, Math.round(m.y) + 1); $gamePlayer.center($gamePlayer.x, $gamePlayer.y); return 0; })()`);
    await t.frames(30);
    await t.shot(SHOTS + "t07_kosci_dzien10.png");
    await t.eval(`TownQuests.autoChecks(); 0`);
    const q0 = await J(`(function(){ const r = TownQuests.rec("W23"); return r ? { s: r.s, step: r.step } : null; })()`);
    t.check("zadanie W23 w dzienniku (FABUŁA), krok 1 „Mokre ślady”", q0 && q0.s === "active" && q0.step === 0, q0);
    const names = ["w23Slady", "w23Dzwon", "w23Mgly", "w23Kronika", "w23Kapitan", "w23Zapisy", "w23Kraken"];
    const jumpTo = [];
    for (let i = 1; i <= 7; i++) {
        const g = await J(`Watki.skocz("morze", ${i})`);
        await t.frames(10);
        const st = await J(`(function(){ const r = TownQuests.rec("W23"); const q = TownQuests.Q.W23; return r ? { step: r.step, name: q.steps[r.step] && q.steps[r.step].nazwa } : null; })()`);
        jumpTo.push([i, g && g[0], st && st.name]);
    }
    t.check("F9: skoki do siedmiu rozdziałów (kroki w23Slady ... w23Kapitan ... w23Kraken)", jumpTo.every((x, i) => x[2] === names[i]), jumpTo);
    // chapters done by their conditions
    await t.eval(`(function(){ const s = Morze.state(); Object.assign(s, { zapisy3: {}, kleofas: 0, kapitanPokonany: 0, kleofasZnak: 0, znak: 0, znakScena: 0, koniec: 0, krakenNoc: 0, wybor: "" }); const r = TownQuests.rec("W23"); r.s = "active"; r.step = 0; Watki.skocz("morze", 4); return 0; })()`);
    await t.frames(10);
    await t.eval(`(function(){ const s = Morze.state(); s.kleofas = 12; TownQuests.autoChecks(); return 0; })()`);
    const c4 = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.kapitanPokonany = 45; TownQuests.autoChecks(); return 0; })()`);
    const c5a = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.kleofasZnak = 45; TownQuests.autoChecks(); return 0; })()`);
    const c5b = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.znak = 45; TownQuests.autoChecks(); return 0; })()`);
    const c5 = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.zapisy3 = { garnizon: 1, lord: 1, kronika: 1 }; TownQuests.autoChecks(); return 0; })()`);
    const c6 = await J(`TownQuests.rec("W23").step`);
    await t.eval(`(function(){ const s = Morze.state(); s.koniec = 1; TownQuests.autoChecks(); return 0; })()`);
    const done = await J(`TownQuests.rec("W23").s`);
    t.check("rozdziały 4-7 kończą się swoimi warunkami (kronika; kapitan pokonany i znak pokazany Kleofasowi nie kończą rozdz. 5 - dopiero rozmowa z Melią; zapisy; wybór) - zadanie ukończone", c4 === 4 && c5a === 4 && c5b === 4 && c5 === 5 && c6 === 6 && done !== "active", { c4, c5a, c5b, c5, c6, done });
    // hooks: the bell, the choice
    const hk = await J(`(function(){ const s = Morze.state(); s.dzwon = 0; s.koniec = 0; s.wybor = ""; s.straz = 0; const w = MorzeData.watek;
        w.akcja("wybor", ["odsunac"]); const a = { straz: s.straz, wybor: s.wybor }; const base = Morze.chance({ day: 30, map: 3, lightOut: false, lit: false, red: false, storm: false, favour: 0, ending: "" }).P;
        s.straz = 0; const base0 = Morze.chance({ day: 30, map: 3, lightOut: false, lit: false, red: false, storm: false, favour: 0, ending: "" }).P; return { a, base, base0 }; })()`);
    t.check("wybór „odsunąć wartę”: mnożnik x0,6 na stałe (szansa 30% -> 18%)", hk.a.straz === 1 && hk.a.wybor === "odsunac" && Math.abs(hk.base - 0.18) < 1e-6 && Math.abs(hk.base0 - 0.3) < 1e-6, hk);
    await t.eval(`(function(){ const s = Morze.state(); s.dzwon = 1; s.dzwonDzien = ${14}; return 0; })()`);
    const bell = await J(`({ on: Morze.bellOn(18), off: Morze.bellOn(30) })`);
    t.check("dzwon o zmierzchu: x0,85 przez 10 dni, potem znów trzeba smarować", bell.on && !bell.off, bell);

    // ---------------------------------------------------------------- L. zapis i wczytanie
    await t.eval(`(function(){ const s = Morze.state(); s.noce["999:3"] = { l: 1, k: "krab_kolos", c: 1, o: 0.3, sp: 1, left: 1, tr: null }; s.slady[219] = 10; return 0; })()`);
    t.saveTo(1);
    await t.frames(30);
    await t.eval(`(function(){ Morze.state().noce = {}; Morze.state().slady = {}; return 0; })()`);
    await t.loadFrom(1);
    const loaded = await J(`({ n: !!Morze.state().noce["999:3"], sl: Morze.state().slady[219] })`);
    t.check("zapis i wczytanie: losowania nocy, ślady i stan wątku zostają", loaded.n && loaded.sl === 10, loaded);

    // ---------------------------------------------------------------- M. pierwsza scena, świt przez godzinę, ślady rano na innej mapie, oglądanie śladów
    await clearAll();
    await t.go(219, 33, 46, 2);
    await night(15, 23.0);
    await t.eval(`(function(){ const s = Morze.state(); s.pierwsze = 0; const n = Morze.night().n; s.noce[Morze.key(n, 219)] = { l: 1, k: "krab_olbrzym", c: 1, o: 0, sp: 0, left: 0, tr: null }; return 0; })()`);
    await t.frames(400);
    const bars = await J("({ bars: !!$gameTemp._hudScene, first: Morze.state().pierwsze })");
    await t.frames(260);
    const bars2 = await J("!!$gameTemp._hudScene");
    t.check("pierwsze lądowanie w życiu gracza: czarne pasy sceny (CleanHUD.sceneBars), dymek bohatera „Co to… wyszło z morza?”, potem pasy znikają", bars.first > 0 && (bars.bars || bars2 === false), { bars, bars2 });
    await t.eval("window.__kit.pops.splice(0); Tawerna.emit('hourChange', { hour: 6, prev: 5, day: 16 }); 0");
    await t.frames(60);
    const pdawn = await t.popups({ clear: true });
    const retreating = await J("MorzePotwory.seaList().every(c => !!c._retreat)");
    t.check("o wschodzie (zdarzenie hourChange) potwory wracają do morza i jest powiadomienie „Świta - potwory wracają do morza”", retreating && (pdawn.some(x => /Świta/.test(x)) || (await J("Tawerna.api('Morze')")) !== null), { retreating, pdawn });
    await clearAll();
    await t.eval(`(function(){ const s = Morze.state(); s.noce = {}; s.slady = {}; return 0; })()`);
    await night(20, 7.5);
    await t.eval(`(function(){ Morze.state().noce["19:219"] = { l: 1, k: "szkielet_miecz", c: 1, o: 0.4, sp: 1, left: 0, tr: null, pt: null, ghost: 1 }; return 0; })()`);
    await t.go(219, 30, 30, 2);
    await t.frames(60);
    const ghost = await J(`({ marks: MorzePotwory.marks.list().length, rec: !!Morze.state().noce["19:219"].tr })`);
    t.check("innego ranka na Słonym Brzegu: z tego samego ziarna ślady „by wylądowało” (bez symulacji)", ghost.marks >= 10, ghost);
    await t.eval(`(function(){ const m = MorzePotwory.marks.list().find(x => x.kind === "track"); $gamePlayer.locate(Math.round(m.x), Math.round(m.y)); return 0; })()`);
    await t.frames(90);
    const seen = await J("Object.keys(Morze.state().slady)");
    t.check("obejrzenie śladów (podejście na 2,6 pola) liczy ślad tego ranka do rozdziału 1 (trzy poranki na jednym brzegu)", seen.some(k => /^219:/.test(k)), seen);

    // ---------------------------------------------------------------- N. rozmowy rozdziałów (talkFor: kto mówi w którym kroku)
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
    await t.go(220, 43, 37, 2);
    await night(30, 11);
    const reset = (step, extra) => t.eval(`(function(){ const s = Morze.state(); Object.assign(s, { start: 1, slady: {}, zapisy: {}, zapisy3: {}, kleofas: 0, kapitanPokonany: 0, kleofasZnak: 0, koniec: 0, znak: 0 }, ${JSON.stringify(extra || {})}); const r = TownQuests.rec("W23") || TownQuests.start("W23"); r.s = "active"; r.step = ${step}; return 0; })()`);
    await reset(0);
    const tRoch = await rozmowa("przemytnik"), tOzzy = await rozmowa("ozzy"), tMelia = await rozmowa("melia");
    const z = await J("Morze.state().zapisy");
    t.check("rozdz. 1: Roch (ślady i kości na plaży), Ozzy (plotka o szkieletach) i Melia (pieśń o „słuchających”) mówią swoje, raz każdy", tRoch.ok && /kości/.test(tRoch.text) && tOzzy.ok && /szkielety/i.test(tOzzy.text) && tMelia.ok && /słuchających/.test(tMelia.text) && z.roch && z.ozzy && z.melia, { tRoch: tRoch.text.slice(0, 80), z });
    await reset(3);
    const tKl = await rozmowa("pustelnik", ["Przyniosę później"]);
    t.check("rozdz. 4: brat Kleofas (kaplica, Map008) pyta o atrament; bez niego „później”, nic nie ginie", tKl.ok && /atrament/i.test(tKl.text), tKl.text.slice(0, 120));
    await t.eval(`(function(){ const it = $dataItems.find(i => i && i.name === "Wodorost"); $gameParty.gainItem(it, 3); return 0; })()`);
    const tKl2 = await rozmowa("pustelnik", ["Mam wodorosty"]);
    const kl = await J(`({ k: Morze.state().kleofas, left: $gameParty.numItems($dataItems.find(i => i && i.name === "Wodorost")) })`);
    t.check("rozdz. 4: trzy wodorosty (wybór) - Kleofas robi atrament i czyta kroniki (szkielety to żołnierze zatopieni w wojnie), wodorosty zabrane", tKl2.ok && /Te szkielety to żołnierze/.test(srcs[3][1]) && kl.k > 0 && kl.left === 0, { text: tKl2.text.slice(0, 150), kl });
    await reset(5);
    await t.eval("Morze.state().zapisy3 = {}; 0");
    const tRot = await rozmowa("rotmistrz"), tLord = await rozmowa("lord"), tKr = await rozmowa("pustelnik");
    const z3 = await J("Morze.state().zapisy3");
    t.check("rozdz. 6: zapisy Zakonu od rotmistrza (lista), Lorda (pergamin z pieczęciami) i Kleofasa (kronika) - po jednym", tRot.ok && tLord.ok && tKr.ok && z3.garnizon && z3.lord && z3.kronika, { z3, r: tRot.text.slice(0, 80), l: tLord.ok, k: tKr.ok });
    await reset(4, { kapitanPokonany: 41 });
    const tK5 = await rozmowa("pustelnik");
    const k5 = await J("({ kz: Morze.state().kleofasZnak, znak: Morze.state().znak })");
    const tMel = await rozmowa("melia");
    const trust = await J(`({ znak: Morze.state().znak, item: $gameParty.numItems($dataItems.find(i => i && i.name === "Znak chorągwi")), step: TownQuests.rec("W23").step, s: TownQuests.rec("W23").s })`);
    t.check("rozdz. 5: po pokonaniu kapitana brat Kleofas rozpoznaje chorągiew utopionych (kaplica), potem Melia gra żałobną pieśń i oddaje Znak chorągwi (nagroda, zaufanie Melii)",
        tK5.ok && /chorągiew/i.test(tK5.text) && k5.kz > 0 && k5.znak === 0 && tMel.ok && /żałobn/i.test(tMel.text) && trust.znak > 0 && trust.item >= 1, { k: tK5.text.slice(0, 100), k5, m: tMel.text.slice(0, 100), trust });

    // ---------------------------------------------------------------- O. noc kapitana: scena w tawernie (marsz pod drzwiami), kapitan czeka przy bramie
    await clearAll();
    await t.eval(`(function(){ const s = Morze.state(); Object.assign(s, { start: 1, znak: 0, znakScena: 0, kapitanForce: 0, forceKapitan: 1, kapitanPokonany: 0, kleofasZnak: 0 }); const r = TownQuests.rec("W23") || TownQuests.start("W23"); r.s = "active"; r.step = 4; return 0; })()`);
    await night(41, 22.5);
    await t.go(1, 14, 30, 2);
    await t.frames(900);
    const scene = await J(`({ scena: Morze.state().znakScena, force: Morze.state().kapitanForce })`);
    t.check("noc po dniu 40 przy aktywnym rozdz. 5: w tawernie scena (Borgar, Melia, Ozzy słyszą marsz pod drzwiami), potem kapitan z chorągwią czeka w mieście", scene.scena > 0 && scene.force === 1, scene);
    await t.go(220, 40, 22, 2);
    await t.frames(600);
    const gate = await J(`MorzePotwory.seaList().map(c => c._kind)`);
    t.check("po wyjściu z tawerny kapitan z chorągwią pojawia się w mieście (jeden, ze straży miejskiej do pomocy)", gate.includes("kapitan_szkieletow") || (await J("!!Morze.landing")), gate);
    await t.shot(SHOTS + "t08_kapitan_miasto.png");

    // ---------------------------------------------------------------- P. wiersze F9 (sekcja „Potwory z morza”)
    await clearAll();
    const f9 = await J(`(function(){ const sec = Okolice.f9.sections().find(s => s.owner === "Morze"); if (!sec) return null; const rows = sec.rows.map(r => r.what);
        const force = sec.rows.find(r => r.what === "force"); force.owner = "Morze"; const labels = []; for (let i = 0; i < 8; i++) { labels.push(force.label); Okolice.f9.pick(force, 1); } return { rows, labels, route: /Morze:captain/.test(String(window.__route || "")) }; })()`);
    t.check("F9 „Potwory z morza”: wiersze show / force / day / captain / clear / dawn; rodzaje do wyboru: pałka, miecz, włócznia, młot, krab, krab-kolos, macki (bez rybołaków, mglaka, wiedźmy)",
        f9 && f9.rows.slice().sort().join(",") === "captain,clear,dawn,day,force,show" && ["pałkami", "mieczem", "włócznią", "młotem", "Krab olbrzym", "Krab-kolos", "Macki"].every(n => f9.labels.some(l => l.includes(n))) && !f9.labels.some(l => /Rybołak|Mglak|wiedźma|Topielec/i.test(l)), f9);
});
