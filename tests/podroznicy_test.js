// Podróżni z promu - etap 1, rdzeń systemu (docs/PODROZNI.md; js/plugins/Podroznicy_Data.js + Podroznicy.js, js/teksty/podroznicy.txt).
// Szkielet głównego testu (etapy 2-8 dopisują swoje części). Sprawdza:
//   - wtyczki na swoich miejscach (dane nad TownLife i TownQuests_Data, silnik pod TownQuests i Przystanią), teksty wczytane bez błędów,
//     24 mieszkańców podróżnych w czwartym zakresie TownLife (3020-3049), rejestr numerów (Podroznicy 3002-3019)
//   - W6 po poprawkach (rozdz. 5): fale 10/25/37/52 (dni promu), Ludmiła i Ela dopiero od fali 1 (dzień 10, od południa), K5 przed falą
//     z Kubą zamiast Ludmiły
//   - nowa gra: stan (ziarno, prom dnia 1 zaplanowany), dzień 4 - Tobiasz Goniec przypływa (pokój 23, do dnia 7), jest w księdze,
//     w drodze do południa, po południu chodzi po miasteczku; pierwsza rozmowa i menu („Skąd płyniesz?”); księga gości u Borgara (opcja)
//   - noc: Tobiasz w swoim pokoju na piętrze (bez znaczników sali na Map001 - zapas: pokój)
//   - zapis i wczytanie w środku pobytu: te same osoby, pokoje, ziarno
//   - dzień 7: Tobiasz odpływa o 15:00 (byli), Konstanty przypływa (pokój 11); pokoje 1 i 2 nigdy
//   - przystań, dzień 10 (fala 1, Zenon): scena przybycia o 9:00 (pasy, kamera, zdarzenie trwa), przytrzymane P - koniec, przybyli na molo
//   - stary zapis (fixture day40_farm): nikt „wstecz”; najbliższy prom - jeden spóźniony z obsady (Tobiasz)
//   - F9: sekcja „Podróżni z promu” (Watki.f9) z wierszami; „Przypłyń teraz” działa
// Uruchom: node tests/run.js podroznicy_test --port 9761 (albo CDP_PORT=9761 node tests/podroznicy_test.js)
const kit = require("./lib/kit.js");

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const st = () => J("Podroznicy.stan()");
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 30); };

    // ---------------------------------------------------------------- wtyczki, teksty, mieszkańcy, rejestr
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), file: (Watki.pliki().find(f => f.name === "podroznicy") || {}),
        res: TownLife.RESIDENTS.filter(r => r.id >= 3020 && r.id <= 3049).map(r => r.key), reg: Tawerna.inject.list().filter(r => r.owner === "Podroznicy").map(r => r.ids),
        ranges: TownLifeData.EXTRA_RANGES, waves: TownQuests.waves(), api: !!window.Podroznicy && Tawerna.api("Podroznicy") === window.Podroznicy })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: Podroznicy_Data nad TownLife i TownQuests_Data, Podroznicy pod TownQuests i Przystan; API w rdzeniu",
        base.api && ix("Podroznicy_Data") > 0 && ix("Podroznicy_Data") < ix("TownLife") && ix("Podroznicy_Data") < ix("TownQuests_Data") && ix("Podroznicy") > ix("TownQuests") && ix("Podroznicy") > ix("Przystan"), base.list.filter(n => /Podr|TownLife|TownQuests|Przystan/.test(n)));
    t.check("teksty js/teksty/podroznicy.txt wczytane przed tytułem, bez błędów", base.file.st === "ok" && base.file.errors.length === 0 && base.file.keys > 250, base.file);
    t.check("24 podróżnych jako mieszkańcy TownLife (czwarty zakres 3020-3049), rejestr: Podroznicy 3002-3019, fale W6 10/25/37/52",
        base.res.length === 24 && JSON.stringify(base.ranges).includes("[3020,3049]") && base.reg.some(r => /^3002-30(17|19)$/.test(r)) && base.waves.join() === "10,25,37,52", base);

    // ---------------------------------------------------------------- nowa gra w miasteczku: stan, prom dnia 1
    await t.newGame({ map: 8, x: 53, y: 55, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.frames(20);
    const s1 = await st();
    t.check("nowa gra: ziarno puli, prom dnia 1 zaplanowany (last 1), renoma 30, pokoje bohatera wolne", s1.seed > 0 && s1.last === 1 && s1.renoma === 30 && !s1.ksiega["1"] && !s1.ksiega["2"], s1);

    // ---------------------------------------------------------------- W6: Ludmiła i Ela od pierwszej fali, K5 z Kubą
    await at(5, 8, 20);
    const w6a = await J(`({ lud: TownLife.absent("ludmila"), ela: TownLife.absent("ela"), k5: TownQuests.Q.K5.steps[0].targetsBefore.targets, k27: TownQuests.offerable("K27") })`);
    await at(10, 11, 20);
    const w6b = await J(`({ lud: TownLife.absent("ludmila") })`);
    await at(10, 12.5, 20);
    const w6c = await J(`({ lud: TownLife.absent("ludmila"), ela: TownLife.absent("ela") })`);
    t.check("W6: dzień 5 - Ludmiły i Eli jeszcze nie ma (K27 bez oferty, K5 - czwarty bochen dla Kuby); dzień 10 rano na molo, od południa w miasteczku",
        w6a.lud && w6a.ela && w6a.k5.includes("woziwoda") && !w6a.k27 && w6b.lud && !w6c.lud && !w6c.ela, { w6a, w6b, w6c });

    // ---------------------------------------------------------------- dzień 4: Tobiasz Goniec (nowa gra od początku, jak u gracza)
    await t.newGame({ map: 8, x: 53, y: 55, dir: 8, hour: 10, quiet: true, minimap: false });
    await at(4, 7, 30);
    const s4 = await st();
    const tob = s4.obecni.tobiasz;
    t.check("dzień 4, 7:00: Tobiasz przypłynął - pokój 23, do dnia 7, w księdze; pokoje 1, 2 i 7 nie w księdze",
        !!tob && tob.od === 4 && tob.do === 7 && tob.pokoj === "23" && s4.ksiega["23"] === "tobiasz" && !s4.ksiega["1"] && !s4.ksiega["2"] && !s4.ksiega["7"], s4);
    const way = await J(`(function(){ const e = TownLife.eventOf("tobiasz"), s = e && TownLife.state("tobiasz"); return { ev: !!e, hidden: s ? s.hidden : null, plan: TownLife.entryAt(TownLife.RESIDENTS.find(r => r.key === "tobiasz"), 7.5) }; })()`);
    t.check("...do południa „w drodze” (ukryty w miasteczku, plan: podr_droga)", way.ev && way.hidden === true && way.plan.where === "podr_droga", way);
    await at(4, 14.5, 60);
    const walk = await J(`(function(){ const s = TownLife.state("tobiasz"); return s ? { hidden: s.hidden, act: s.act, x: s.x, y: s.y, sheet: TownLife.eventOf("tobiasz").characterName() } : null; })()`);
    t.check("...14:30: chodzi po miasteczku (obchód z listami), zastępczy arkusz $Npc_Tobiasz", !!walk && walk.hidden === false && walk.act === "patrol" && walk.sheet === "$Npc_Tobiasz", walk);
    const meet = await t.talkTo("TownLife.eventOf('tobiasz')", [], { secs: 25 });
    t.check("pierwsza rozmowa: Tobiasz się przedstawia („poczta lądowa”)", /poczta lądowa/.test(meet.text), meet.text.slice(0, 200));
    // (etap 2: druga rozmowa - oferta K71 „Listy z lądu”; tu odmowa, menu dopiero potem)
    const offer = await t.talkTo("TownLife.eventOf('tobiasz')", ["Nie mam czasu"], { secs: 25 });
    t.check("druga rozmowa: oferta K71 „Listy z lądu” (cztery adresy) - odmowa", /cztery adresy/.test(offer.text) && !(await J("!!TownQuests.rec('K71') && TownQuests.rec('K71').s === 'active'")), offer.text.slice(0, 200));
    const menu = await t.talkTo("TownLife.eventOf('tobiasz')", ["Skąd płyniesz"], { secs: 25 });
    t.check("...potem jego menu: „Skąd płyniesz?” - z Brzozowej Woli", /Brzozowej Woli/.test(menu.text) && (menu.choices || []).some(c => /Skąd płyniesz/.test(JSON.stringify(c))), { text: menu.text.slice(0, 200), choices: menu.choices });
    const book = await J(`({ lines: Podroznicy.ksiegaLinie(), opt: Tawerna.talk.options("borgar").map(o => o.id) })`);
    t.check("księga gości: opcja u Borgara; wiersz „Pokój 23: Tobiasz Goniec, posłaniec z lądu - do dnia 7”, renoma i utarg",
        book.opt.includes("Podroznicy:ksiega") && book.lines.some(l => /^Pokój 23: Tobiasz Goniec, posłaniec z lądu - do dnia 7$/.test(l)) && book.lines.some(l => /^Renoma karczmy: 30/.test(l)) && book.lines.some(l => /^Utarg z pokoi/.test(l)), book);

    // ---------------------------------------------------------------- noc: w swoim pokoju na piętrze (zapas bez znaczników sali)
    await t.go(25, 48, 62, 8);
    await at(4, 23.5, 30);
    const room = await J(`(function(){ const e = TownLife.eventOf("tobiasz"); return e ? { x: e.x, y: e.y, hidden: e._town.hidden, sala: Podroznicy.wnetrze("tobiasz") } : null; })()`);
    t.check("23:30, piętro gości (Map025): Tobiasz u siebie - pokój 23 przy kufrze (5,8)", !!room && room.x === 5 && room.y === 8 && room.hidden === false, room);

    // ---------------------------------------------------------------- zapis i wczytanie w środku pobytu
    // (migawka tuż przed zapisem: o 15:00 dnia 4 ktoś z puli mógł już odpłynąć)
    const s4z = await st();
    await t.saveTo(1);
    await t.loadFrom(1, { quiet: true });
    const s5 = await st();
    t.check("zapis i wczytanie: te same osoby, pokoje i ziarno", JSON.stringify(s5.obecni) === JSON.stringify(s4z.obecni) && s5.seed === s4z.seed && JSON.stringify(s5.ksiega) === JSON.stringify(s4z.ksiega), { s4: s4z.obecni, s5: s5.obecni });

    // ---------------------------------------------------------------- dzień 7: odpływ Tobiasza, przypływ Konstantego
    await t.go(8, 53, 55, 8);
    await at(7, 15.5, 40);
    const s7 = await st();
    t.check("dzień 7, 15:30: Tobiasz odpłynął (byli 4-7), Konstanty Mak przypłynął (pokój 11); nikt w pokojach 1 i 2",
        !s7.obecni.tobiasz && (s7.byli.tobiasz || []).some(v => v.od === 4 && v.do === 7) && !!s7.obecni.medyk && s7.obecni.medyk.pokoj === "11" && !s7.ksiega["1"] && !s7.ksiega["2"], s7);
    t.check("utarg Borgara z nocy podróżnych (noc 5, 6, 7 Tobiasza w 1-os.: 8 G za noc)", s7.utarg >= 24, s7.utarg);

    // ---------------------------------------------------------------- przystań: scena przybycia (dzień 10, fala 1, Zenon)
    await at(10, 8.97, 5);
    await t.eval("Podroznicy.auto(true); 0");   // (after the calm: the tests' quiet mode turns the scene off)
    await t.go(125, 20, 16, 4, { calm: false });
    const started = await t.until("Podroznicy.scena.trwa()", 30, 200);
    await t.frames(90);
    const sc = await J(`({ s: Podroznicy.scena.stan() ? { kino: Podroznicy.scena.stan().kino, cast: Podroznicy.scena.stan().cast.map(c => c.rk) } : null, ev: $gameMap.isEventRunning() })`);
    t.check("dzień 10, 9:00 na przystani: scena przybycia - pasy kinowe, zdarzenie trwa, wśród przybyłych Zenon", started && !!sc.s && sc.s.kino && sc.ev && sc.s.cast.includes("zboze"), sc);
    await t.shot("../docs/podroznicy/scena_przybycia.png").catch(() => null);
    await t.hold("escape", 80);
    await t.frames(30);
    const after = await J(`({ trwa: Podroznicy.scena.trwa(), ev: $gameMap.isEventRunning(), widziana: !!Podroznicy.stan().widziane.sceny.prom10, molo: Podroznicy.naMolo().map(a => a.rk),
        aktor: (function(){ const e = $gameMap.event(3002); return e ? { x: e.x, y: e.y, sheet: e.characterName(), shown: !e.isTransparent() } : null; })() })`);
    t.check("...przytrzymane P: scena skończona od razu (stan jak po całej), zapamiętana; przybyli stoją na molo (aktor 3002 widoczny)",
        !after.trwa && !after.ev && after.widziana && after.molo.includes("zboze") && !!after.aktor && after.aktor.shown, after);
    await t.eval("Podroznicy.auto(false); 0");

    // ---------------------------------------------------------------- stary zapis: nikt „wstecz”, potem spóźnieni po jednym
    await t.loadFixture("day40_farm", { quiet: true });
    await t.frames(30);
    const old = await st();
    const d0 = await J("$gameSystem.dayNightDay()");
    t.check("stary zapis (day40_farm): nowy klucz stanu, ten dzień jako już zaplanowany - nikt nie przypływa „wstecz”", old.last === d0 && !Object.keys(old.obecni).some(k => !/^p/.test(k)), { last: old.last, d0, obecni: old.obecni });
    const fd = await J(`(function(){ for (let d = ${d0} + 1; d < ${d0} + 6; d++) if (TownQuests.isFerry(d)) return d; return 0; })()`);
    await at(fd, 7, 30);
    const old2 = await st();
    const cast = Object.keys(old2.obecni).filter(k => !/^p/.test(k));
    t.check("...najbliższy prom (dzień " + fd + "): jeden spóźniony z obsady, w kolejności tabeli - Tobiasz", cast.length === 1 && cast[0] === "tobiasz", old2.obecni);

    // ---------------------------------------------------------------- F9: sekcja wątku z wierszami
    const f9 = await J(`(function(){ const sec = Watki.f9.sekcje().find(s => s.watek === "podroznicy"); return sec ? { head: sec.head, rows: sec.rows.map(r => r.kind) } : null; })()`);
    t.check("F9 „Wyspa i fabuła”: sekcja „Podróżni z promu:” - prom, przypłyń, odpływ, wyczyść, renoma, ziarno, scena",
        !!f9 && f9.head === "Podróżni z promu:" && ["prom", "przyplyn", "odplyw", "wyczysc", "renoma", "ziarno", "scena"].every(k => f9.rows.includes("isleWatek:" + k)), f9);
    const pk = await J(`(function(){ const row = Watki.f9.sekcje().find(s => s.watek === "podroznicy").rows.find(r => r.kind === "isleWatek:przyplyn");
        for (let i = 0; i < 20 && !/Teofil/.test(row.label); i++) Watki.f9.wybierz(row, 1); const r = Watki.f9.ok(row); return { r, label: row.label, e: Podroznicy.stan().obecni.kartograf || null }; })()`);
    t.check("F9 „Przypłyń teraz: Teofil Cyrkiel” - kartograf na wyspie (pokój 22 albo najbliższy 2-os.)", !!pk.e && /Teofil Cyrkiel/.test(pk.r.say || ""), pk);
});
