// W7 „Dwór z kamieni twierdzy” - wariant A (Dwor.js, Dwor_Data.js; docs/QUESTY.md W7): Lord nic nie wie, Feliks sprzedaje frakcji.
//   - dane: wtyczki na swoich miejscach, mapy 172-174 (hol, biblioteka, gabinet) pod Posiadłością Lorda, numery 570-599, plan dnia Feliksa
//   - rozdz. 1: wątek zaczyna się z długiem (Lord poznany), połowa spłacona -> rozdz. 2
//   - rozdz. 2: Lord zaprasza do środka (drzwi dworu w kodzie), oprowadza po holu (kruki w murze, trzy wyjęte), kronika rodu w bibliotece
//     = piąta zwrotka W3; potem drzwi dworu wpuszczają za dnia, nocą odpowiada kamerdyner
//   - rozdz. 3: śledzenie Feliksa: rynek (z bliska bez skradania - zauważa), hol za dnia, właz nocą (Feliks widzi - wyrzucony), kantor;
//     notatka „Plan dnia Feliksa”; wariant bez Feliksa (po W1 b): ślady u Teodora, Hanki, Kuby
//   - rozdz. 4: właz nocą -> kanał -> gabinet; szuflada: przepisz / zabierz / zostaw; Feliks wraca klapą - przyłapany; klapa z powrotem
//   - prawda: listy u Lorda (Feliks aresztowany, odpis z długu), odpis (strażnik przynosi oryginały), powiedziane bez listów (Lord sprawdza
//     sam, następnego dnia); listy zabrane i zwłoka - Feliks ucieka promem
//   - rozdz. 5-6: koniec rozdziału 1, Akt II: do kogo najpierw - Lord (100 G co tydzień, ekwipunek, jego ludzie za bohaterem - W9),
//     kłamstwo (wychodzi na jaw: myto, przeszukanie), milczenie (Feliks donosi - Akt III)
//   - rozdz. 7 i Serce: stance ally / rival, linijka Lorda o Feliksie, koniec wątku po scenie przy Sercu, epilog; W9: Lord pamięta pobitych
//   - F9: przeskok do rozdziału
// Przed instalacją (edytor otwarty): sam dopisuje Dwor_Data / Dwor do listy wtyczek (GAME_PLUGINS_ADD) i bierze mapy 172-174 z
// tools/w7/staging (nakładka), gdy data/ jeszcze ich nie ma. Po instalacji działa tak samo bez tego.
// Uruchom: CDP_PORT=9510 node tests/w7_test.js (serwer: node tools/serve.js). Zrzuty: docs/w7/*.png
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
if (!/"name":"Dwor"/.test(require("./lib/wtyczki.js").tekst()) && !process.env.GAME_PLUGINS_ADD) process.env.GAME_PLUGINS_ADD = "Kantor_Data:Dwor_Data;Rywal:Dwor";
const OVERLAY = fs.existsSync(path.join(ROOT, "data", "Map172.json")) ? undefined : "tools/w7/staging";
const kit = require("./lib/kit.js");
const DOCS = path.join(ROOT, "docs", "w7");

kit.test({ port: 9510, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e), E = e => t.eval(e);
    const st = () => J(`({ step: Dwor.step(), s: Dwor.state(), map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, hour: +$gameSystem.dayNightHour().toFixed(2),
        day: $gameSystem.dayNightDay(), gold: $gameParty.gold(), f: TownQuests.state().flags, v: TownQuests.state().v, paid: Story.state().paid,
        felGone: TownLife.gone("feliks"), rec: TownQuests.rec("W7") })`);
    const setTime = (d, h) => E(`(function(){ $gameSystem._dayNightDay = ${d}; $gameSystem.setDayNightHour(${h}); TownQuests.autoChecks(); return 0; })()`);
    const go = async (map, x, y, dir) => { const ok = await t.go(map, x, y, dir || 2, { calm: false }); await E("Survival.calmWeather && Survival.calmWeather(); 0"); await t.frames(10); return ok; };
    const shot = name => t.shot(path.join(DOCS, name));
    // (the Lord's page follows the hour every 30 frames - Story.js: some frames first)
    const lordTalk = async (picks, o) => { await t.until("!!$gameMap.event(Story.NPCS.lord.id) && !!$gameMap.event(Story.NPCS.lord.id).characterName()", 5); await t.frames(4);
        const r = await t.talkTo("$gameMap.event(Story.NPCS.lord.id)", picks || [], Object.assign({ secs: 40 }, o || {})); r.text = r.text.replace(/\s+/g, " "); return r; };
    const named = n => `$gameMap.events().find(e => e.event() && e.event().name === ${JSON.stringify(n)})`;
    const resident = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const talkRes = async (key, picks, o) => {
        const ok = await t.until(`!!${resident(key)} && !${resident(key)}._town.hidden`, 15);
        if (!ok) return { text: "", done: false, missing: ["nie ma: " + key] };
        await E(`__standBy(${resident(key)}.eventId()); 0`);
        return t.talkTo(resident(key), picks || [], Object.assign({ place: false }, o || {}));
    };
    // a talk held on the line matching `re` (the driver stops pressing there): the screenshot, then on to the end
    const HOLD = `(function(){ if (window.__w7h) return 0; window.__w7h = { re: null, held: false };
        const _s = Window_Message.prototype.startMessage;
        Window_Message.prototype.startMessage = function() { _s.call(this); const h = window.__w7h, d = window.__drv;
            if (h.re && d && new RegExp(h.re).test($gameMessage.allText())) { d.holdAt = d.log.length; h.held = true; h.re = null; } };
        return 0; })()`;
    async function heldTalk(start, re, file, frames) {
        await E(`window.__w7h.re = ${JSON.stringify(re)}; window.__w7h.held = false; 0`);
        const p = start();
        const held = await t.until("window.__w7h.held", 40);
        await t.frames(frames || 40);
        if (held && file) await shot(file);
        await E("window.__drv.holdAt = -1; 0");
        const r = await p;
        r.held = held;
        return r;
    }
    fs.mkdirSync(DOCS, { recursive: true });
    await E(kit.DRIVER + "; 0");
    await E(HOLD);

    // ===================================================================== dane
    const pl = await J(`(function(){ const n = $plugins.filter(p => p.status).map(p => p.name);
        const fel = TownLife.RESIDENTS.find(r => r.key === "feliks"), teo = TownLife.RESIDENTS.find(r => r.key === "kamerdyner");
        return { n: ["Kantor_Data", "Dwor_Data", "TownLife", "TownQuests", "Rywal", "Dwor", "CleanHUD"].map(x => n.indexOf(x)),
            maps: [172, 173, 174].map(i => $dataMapInfos[i] ? [$dataMapInfos[i].name, $dataMapInfos[i].parentId] : null),
            reg: Tawerna.inject.list().filter(r => r.owner === "Dwor").map(r => r.ids), w7: !!TownQuests.Q.W7 && TownQuests.Q.W7.steps.length,
            fel: [fel.plan.map(p => p[0] + p[1] + p[2]).join(","), fel.indoor && fel.indoor.dwor], teo: teo.indoor && teo.indoor.dwor }; })()`);
    const [kd, dd, tl, tq, rw, dw, ch] = pl.n;
    t.check("wtyczki: Dwor_Data pod Kantor_Data i nad TownLife/TownQuests, Dwor pod Rywal (W9) i nad CleanHUD",
        kd >= 0 && dd === kd + 1 && dd < tl && dd < tq && dw === rw + 1 && dw < ch, pl.n);
    t.check("mapy 172 „Dwór - Hol” (pod 24), 173 „Dwór - Biblioteka” i 174 „Dwór - Gabinet” (pod holem), numery 570-599 właściciela Dwor, W7 ma 8 kroków",
        JSON.stringify(pl.maps) === JSON.stringify([["Dwór - Hol", 24], ["Dwór - Biblioteka", 172], ["Dwór - Gabinet", 172]]) && pl.reg.includes("570-599") && pl.w7 === 8, pl);
    t.check("plan dnia Feliksa: rynek od 6:00, hol dworu 10:30-20 (miejsce feliks_hol), noc w dworze; Teodor tak samo (kamerdyner_hol)",
        /^0insidebrama_wsch,6wanderstragan1,.*10\.5insidedwor,20insidebrama_wsch$/.test(pl.fel[0]) && pl.fel[1] === "feliks_hol" && pl.teo === "kamerdyner_hol", pl);

    // ===================================================================== rozdz. 1: dług
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true });
    // W3 collecting its verses: the chronicle's verse comes in the library (started now - its notice gone before the pictures)
    await E(`(function(){ const q = TownQuests, i = q.Q.W3.steps.findIndex(x => x.talk === "w3Verse"); if (i >= 0 && !q.isActive("W3")) q.start("W3", i); return 0; })()`);
    await setTime(9, 10);
    await go(24, 20, 15, 8);
    let s = await st();
    t.check("rozdz. 1: zanim bohater pozna Lorda - wątku nie ma", !s.rec, s.rec);
    const meet = await lordTalk(["Odejdź"]);
    await E("TownQuests.autoChecks(); 0");
    s = await st();
    t.check("...pierwsza rozmowa z Lordem (spłata dziadka) zaczyna „Dwór z kamieni twierdzy” - krok „Dług”", s.step === "w7Dlug" && /Lord Leopold Zaleski/.test(meet.text), { step: s.step, t: meet.text.slice(0, 120) });
    await t.gold(1250);
    await E("Story.pay(1250); TownQuests.autoChecks(); 0");
    s = await st();
    t.check("...połowa długu (1250 G) spłacona - rozdz. 2 „Zaproszenie”", s.step === "w7Zapro" && s.paid === 1250, { step: s.step, paid: s.paid });

    // ===================================================================== rozdz. 2: zaproszenie, hol, kronika
    const door0 = await J("({ list: $gameMap.event(1).list()[0].parameters[0] })");
    t.check("...przed zaproszeniem drzwi dworu mówią po staremu (Story.js)", /Story\.talk/.test(door0.list), door0);
    await E("window.__drv.holdAt = -1; 0");
    const inv = await heldTalk(() => lordTalk(["Wejdę."], { keep: true }), "Liczysz\\. Kruk", "hol_kruki.png", 150);
    await t.until("Dwor.state().tourGone === 1 && !$gameMap.isEventRunning()", 60);
    await E("window.__drv.on = false; 0");
    s = await st();
    const hall = await J(`({ ravens: $gameMap.events().filter(e => /<Dwor:kruk>/.test(e.event().note)).length, gone: $gameMap.events().filter(e => /<Dwor:brak>/.test(e.event().note)).length,
        lordHidden: $gameMap.event(570).isTransparent(), log: window.__drv.log.slice(-14).map(l => l.t).join(" / ") })`);
    t.check("...Lord zaprasza („Wejdę.”) - drzwi dworu, hol (mapa 172): kamienie twierdzy, " + hall.ravens + " kruków w murze i trzy wyjęte (świeża zaprawa)",
        s.map === 172 && hall.ravens >= 12 && hall.gone === 3 && inv.held, { map: s.map, hall });
    t.check("...Lord oprowadza: co dziesiąty kamień z krukiem, „Feliks dba o mury”, „ja liczę gości” - i idzie do biblioteki", /dziesiąty ma wyrytego kruka/.test(inv.text + hall.log) && /liczę gości/.test(hall.log) && hall.lordHidden, hall.log.slice(0, 300));
    await go(173, 8, 10, 8);
    const lordBib = await J("({ shown: !$gameMap.event(571).isTransparent(), at: [$gameMap.event(571).x, $gameMap.event(571).y] })");
    const kron = await heldTalk(() => t.talkTo(named("Kronika rodu Zaleskich"), [], { secs: 30 }), "Dwór z kamieni - kamień pamięta", "biblioteka_kronika.png", 150);
    s = await st();
    const w3 = await J("({ verse: TownQuests.hasVerse('kronika'), note: Journal.data().notes.some(n => n.title === 'Kronika rodu Zaleskich') })");
    t.check("...biblioteka (mapa 173): Lord przy pulpicie czyta kronikę rodu - piąta zwrotka W3 („Dwór z kamieni - kamień pamięta”), notatka, rozdz. 3",
        lordBib.shown && kron.held && /To bajki, ale ładne/.test(kron.text) && w3.verse && w3.note && s.step === "w7Feliks" && !!s.f.w7Kronika, { lordBib, w3, step: s.step });
    await t.frames(40);
    t.check("...po kronice Lord znika z biblioteki (oprowadzanie skończone, drzwi dworu otwarte od ósmej do ósmej)", await J("$gameMap.event(571).isTransparent()") && s.s.invited > 0);
    // the door now: by day into the hall, at night the butler (Story)
    await go(24, 20, 13, 8);
    await t.talkTo(1, [], { place: false, secs: 15 });
    t.check("...drzwi dworu za dnia (12:00): zaproszony wchodzi do holu", (await E("$gameMap.mapId()")) === 172);
    await setTime(9, 21);
    await go(24, 20, 13, 8);
    const night = await t.talkTo(1, ["Odejdź"], { place: false, secs: 15 });
    t.check("...nocą (21:00) te same drzwi - puk, puk, odzywa się kamerdyner (spłata długu), do środka nie wpuszcza", (await E("$gameMap.mapId()")) === 24 && /Kto tam o tej porze/.test(night.text), night.text.slice(0, 120));
    await t.saveTo(1);

    // ===================================================================== rozdz. 3: dwa życia Feliksa
    // the market: too close without sneaking - he notices (nothing seen that day)
    await setTime(10, 7.2);
    await go(8, 51, 52, 8);
    await t.until(`!!${resident("feliks")} && !${resident("feliks")}._town.hidden`, 15);
    await E(`(function(){ const f = ${resident("feliks")}; $gamePlayer.locate(f.x, f.y + 1); Hunting.setSneak(false); return 0; })()`);
    await t.until(`Dwor.state().spotted.rano === $gameSystem.dayNightDay()`, 10);
    s = await st();
    const spot = await J("SpeechBubbles.log.slice(-4)");
    t.check("rozdz. 3: na rynku tuż obok Feliksa bez skradania - „Pan coś ode mnie chciał?” - tego ranka nic nie widać", s.s.spotted.rano === 10 && !s.s.obs.rano && spot.some(l => /Pan coś ode mnie chciał/.test(l)), spot);
    await t.locate(51, 65, 8);   // (away from him before the clock moves on - else he notices the next morning at once)
    await setTime(11, 7.2);
    await go(8, 51, 52, 8);
    for (let i = 0; i < 20 && !(await J("!!Dwor.state().obs.rano")); i++) {   // (following him round the stalls, a few steps behind)
        await E(`(function(){ const f = ${resident("feliks")}; $gamePlayer.locate(f.x + 3, f.y + 3); Hunting.setSneak(true); return 0; })()`);
        await t.frames(60);
    }
    await E("Hunting.setSneak(false); 0");
    s = await st();
    t.check("...następnego ranka z kilku kroków, skradając się (C): Feliks kupuje papier, lak i atrament na kopy - pierwsza obserwacja", !!s.s.obs.rano, s.s.obs);
    // the hall by day: behind the lectern
    await setTime(11, 12);
    await go(172, 16, 7, 6);
    await t.until("!!Dwor.state().obs.dzien", 20);
    s = await st();
    t.check("...za dnia w holu dworu: Feliks za pulpitem, kluczyk od kantorka chowa w kałamarzu", !!s.s.obs.dzien, s.s.obs);
    await t.saveTo(2);
    // the hatch at night: seen by Feliks - thrown out
    await setTime(12, 1.6);
    await go(24, 4, 21, 4);
    await E("TownLife.hold('straznik', true, [19, 28]); Hunting.setSneak(false); 0");
    await t.until("!!$gameMap.event(575) && !$gameMap.event(575).isTransparent()", 10);
    await t.until("$gameMap.mapId() === 8", 30);
    s = await st();
    t.check("...nocą przy włazie Feliks widzi bohatera („Kto tam?! Straż!”) - wyrzucony za bramę dworu, Opinia −3", s.map === 8 && !s.s.obs.noc, { map: s.map, obs: s.s.obs });
    // ...sneaking, from aside
    await setTime(13, 1.6);
    await go(24, 2, 23, 8);
    await E("TownLife.hold('straznik', true, [19, 28]); Hunting.setSneak(true); 0");
    await t.until("!!$gameMap.event(575) && !$gameMap.event(575).isTransparent()", 10);
    await t.frames(150);
    await shot("sledzenie_noc.png");
    await t.until("!!Dwor.state().obs.noc", 25);
    s = await st();
    const plan = await J("(Journal.data().notes.find(n => n.title === 'Plan dnia Feliksa') || {}).text || ''");
    t.check("...skradając się z boku: Feliks wychodzi SPOD włazu i napełnia Kubie beczki - trzecia obserwacja, rozdz. 4 „Gabinet nocą”",
        !!s.s.obs.noc && s.step === "w7Gabinet" && /SPOD włazu/.test(plan) && /6–10:30/.test(plan) && /kałamarza/.test(plan), { obs: s.s.obs, step: s.step, plan: plan.slice(0, 160) });
    await E("Hunting.setSneak(false); TownLife.hold('straznik', false); 0");
    // the kantor's midnight - the fourth line of the plan (Kantor.js's witness)
    await E("Kantor.state().guests.feliks = $gameSystem.dayNightDay(); 0");
    await t.frames(40);
    t.check("...noc przy kantorze (Kantor.js widział Feliksa przy tylnych drzwiach) - czwarty wpis planu", !!(await J("Dwor.state().obs.kantor")) && /tylne drzwi kantoru Baltazara/.test(await J("Dwor.planText()")));

    // ===================================================================== rozdz. 4: gabinet nocą
    await setTime(13, 22.5);
    await go(24, 3, 21, 8);
    const hatchList = await J("$gameMap.event(2).list()[0].parameters[0]");
    const down = await t.talkTo(2, ["Zejdź do kanału."], { place: false, secs: 20 });
    await t.until("$gameMap.mapId() === 174", 15);
    s = await st();
    t.check("rozdz. 4: nocą właz z krukiem za oranżerią (zdarzenie autora) - kanał zakonu - klapa w podłodze gabinetu (mapa 174)",
        /Dwor\.hatch/.test(hatchList) && s.map === 174 && /Kanał prowadzi pod dworem/.test(down.text), { hatchList, map: s.map });
    await t.saveTo(3);
    const draw = await t.talkTo(named("Kantorek Feliksa (szuflada)"), ["Przepisz"], { place: true, secs: 40, shotAtChoice: path.join(DOCS, "gabinet_listy.png") });
    draw.text = draw.text.replace(/\s+/g, " ");
    s = await st();
    t.check("...kantorek Feliksa: kluczyk w kałamarzu, listy „Do sztabu Straży Pewności” jego ręką (woda, kruki z holu, wnuk Stacha)",
        /kałamarzu/.test(draw.text) && /Do sztabu Straży Pewności/.test(draw.text) && /trzy z krukiem/.test(draw.text) && /Pan nic nie wie/.test(draw.text), draw.text.slice(0, 300));
    t.check("...„Przepisz je” - pół godziny przy świecy, odpis w torbie, listy zostają; rozdz. 4 „Prawda dla Lorda”",
        s.v.odpis_listow === 1 && !s.v.listy_feliksa && s.s.letters === "copy" && s.hour >= 22.95 && s.step === "w7Prawda", { v: s.v, letters: s.s.letters, hour: s.hour, step: s.step });
    await t.saveTo(4);
    // caught: Feliks comes up through the trapdoor at 3:00
    await t.loadFrom(3, { quiet: true });
    await E("window.__drv.on = true; window.__drv.picks = []; window.__drv.holdAt = -1; 0");
    await setTime(14, 2.96);
    await t.until("$gameMap.mapId() === 24", 30);
    await E("window.__drv.on = false; 0");
    s = await st();
    const tops = await t.notices();
    t.check("...o 3:00 Feliks wraca klapą do gabinetu - przyłapany, wyprowadzony przed dwór, klapa zaryglowana na dwie noce",
        s.map === 24 && s.s.bolt >= 13 && !!s.f.w7FeliksCzujny && tops.some(x => /Feliks cię przyłapał/.test(x)), { map: s.map, bolt: s.s.bolt, tops: tops.slice(-3) });
    // take the letters (and back down the trapdoor)
    await t.loadFrom(3, { quiet: true });
    await t.talkTo(named("Kantorek Feliksa (szuflada)"), ["Zabierz"], { place: true, secs: 40 });
    s = await st();
    t.check("...„Zabierz listy” - plik listów w torbie", s.v.listy_feliksa === 1 && s.s.letters === "take" && s.step === "w7Prawda", { v: s.v, step: s.step });
    await t.talkTo(named("Klapa w podłodze"), ["Zejdź."], { place: true, secs: 20 });
    await t.until("$gameMap.mapId() === 24", 15);
    t.check("...klapą z powrotem do kanału - wyjście włazem za oranżerią (Map024 3,21)", (await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]")).join() === "24,3,21");
    await t.saveTo(5);

    // ===================================================================== prawda dla Lorda
    await setTime(14, 10);
    await go(24, 20, 15, 8);
    const paid0 = (await st()).paid;
    const truth = await heldTalk(() => lordTalk(["Pokaż Lordowi listy", "Odejdź"]), "Mój ojciec mawiał", "rozmowa_prawda.png", 150);
    s = await st();
    t.check("prawda: listy Feliksa u Lorda - łamie się („Liczyłem gości”, podatek wojenny dla Korony, „Mój ojciec mawiał: przyjdź najpierw do mnie”)",
        truth.held && /Liczyłem gości/.test(truth.text) && /podatek wojenny/.test(truth.text), truth.text.slice(0, 200));
    t.check("...Feliks do wieży (aresztowany, znika z miasta), Lord sojusznikiem (lordAlly, w7Prawda), 250 G odpisu z długu",
        !!s.f.lordAlly && !!s.f.w7Prawda && !!s.f.w7FeliksZatrzymany && s.felGone && s.paid === paid0 + 250 && s.s.fate === "arrest" && !s.v.listy_feliksa,
        { f: [s.f.lordAlly, s.f.w7Prawda, s.f.w7FeliksZatrzymany], gone: s.felGone, paid: [paid0, s.paid], fate: s.s.fate });
    t.check("...rozdz. 5 „Ostatnia spłata” (dług jeszcze otwarty); w kantorze Feliks już nie stuka (Kantor.js)",
        s.step === "w7Splata" && (await J("TownLife.gone('feliks') && !!TownQuests.state().flags.feliksArrested")), s.step);
    // copy: the Lord sends the guard for the originals
    await t.loadFrom(4, { quiet: true });
    await setTime(14, 10);
    await go(24, 20, 15, 8);
    const tc = await lordTalk(["Pokaż Lordowi listy", "Odejdź"]);
    s = await st();
    t.check("...z odpisem: „To nie jego pismo - to twoje” - strażnik przynosi oryginały z kantorka, Lord łamie lak; Feliks aresztowany",
        /Bartosz! Gabinet, kantorek/.test(tc.text) && s.s.how === "copy" && s.s.fate === "arrest" && !!s.f.lordAlly, { how: s.s.how, fate: s.s.fate });
    // told without the letters: the Lord checks himself, the truth the next day
    await t.loadFrom(3, { quiet: true });
    await t.talkTo(named("Kantorek Feliksa (szuflada)"), ["Zostaw"], { place: true, secs: 40 });
    s = await st();
    t.check("...„Zostaw je” - bez dowodu, krok prawdy czeka (listy w kantorku)", s.s.letters === "left" && s.step === "w7Prawda", { letters: s.s.letters, step: s.step });
    await setTime(14, 10);
    await go(24, 20, 15, 8);
    const told = await lordTalk(["Powiedz Lordowi", "Odejdź"]);
    const same = await lordTalk(["Odejdź"]);
    await setTime(15, 10);
    await go(24, 20, 15, 8);
    const next = await lordTalk(["Odejdź"]);
    s = await st();
    t.check("...albo inaczej: powiedziane bez listów - „Sprawdzę sam. Przyjdź jutro.”; nazajutrz „Sprawdziłem. Kantorek, kałamarz, kluczyk.” - prawda",
        /Sprawdzę sam/.test(told.text) && !/Sprawdziłem/.test(same.text) && /Sprawdziłem/.test(next.text) && !!s.f.w7Prawda && s.s.how === "check" && s.s.fate === "arrest",
        { told: told.text.slice(0, 100), next: next.text.slice(0, 100), how: s.s.how });
    // taken and kept: Feliks notices, the first ferry after - gone; the truth later: fled
    await t.loadFrom(5, { quiet: true });
    const flee = await J("(function(){ let d = Dwor.state().lettersDay + 1; while (!TownQuests.isFerry(d)) d++; return d; })()");
    await setTime(flee, 7);
    await go(24, 20, 15, 8);
    await t.frames(40);
    s = await st();
    t.check("...listy zabrane, a Lord nic nie wie: Feliks zauważa i ucieka pierwszym promem (dzień " + flee + ")", !!s.f.w7FeliksUciekl && s.felGone && s.s.fate === "fled", { fate: s.s.fate, f: s.f.w7FeliksUciekl });
    await setTime(flee, 10);
    const fled = await lordTalk(["Pokaż Lordowi listy", "Odejdź"]);
    s = await st();
    t.check("...prawda po ucieczce: „Uciekł, mówisz? Promem?” - Lord i tak sojusznikiem", /Uciekł, mówisz/.test(fled.text) && !!s.f.w7Prawda && s.s.fate === "fled", fled.text.slice(-200));

    // ===================================================================== rozdz. 5-6: ostatnia spłata, Akt II
    await t.loadFrom(5, { quiet: true });
    await setTime(14, 10);
    await go(24, 20, 15, 8);
    await lordTalk(["Pokaż Lordowi listy", "Odejdź"]);
    await t.gold(5000);
    await E("Story.pay(Story.left()); TownQuests.autoChecks(); 0");
    s = await st();
    t.check("rozdz. 5: dług spłacony (Story) - rozdz. 6 „Do kogo najpierw” czeka na zejście pod tawernę", s.step === "w7Najpierw" && /zejdziesz pod tawernę/.test(await J("Dwor.vars().najpierw")), s.step);
    const askEarly = await lordTalk(["Odejdź"]);
    t.check("...zanim krata stoi otworem, Lord o nic nie pyta", !/Kruczymi Skałami\?/.test(askEarly.text));
    await E("Underground.open(); 0");
    await go(10, 10, 10, 2);
    await go(24, 20, 15, 8);
    await t.saveTo(6);
    t.check("...krata otwarta, bohater był w Ruinach Zamku", await J("Dwor.beenDown()"));
    // the Lord first
    const g0 = await t.gold();
    const first = await lordTalk(["Powiem panu wszystko", "Odejdź"]);
    s = await st();
    const after = await J(`({ gear: [59, 93, 152, 127].map(i => $gameParty.numItems($dataItems[i])), stance: Underground.lordStance(Underground.world()) })`);
    t.check("rozdz. 6: „Powiem panu wszystko” - sto groszy, ekwipunek ze zbrojowni (pochodnie, liny, opatrunki, strzały), w7LordFirst",
        /ród Stacha ma honor/.test(first.text) && s.gold === g0 + 100 && after.gear.every(n => n > 0) && !!s.f.w7LordFirst && s.step === "w7Serce", { gold: [g0, s.gold], gear: after.gear, step: s.step });
    t.check("...Lord przy Sercu: sojusznik (Underground.lordStance)", after.stance === "ally", after);
    const rv = await J(`(function(){ try { return Rywal.who(true); } catch (e) { return String(e); } })()`);
    t.check("...W9: jego ludzie schodzą za bohaterem - rywal w ruinach to „ludzie Lorda” (powód lordFirst)", !!rv && rv.key === "lord" && rv.why === "lordFirst", rv);
    const act3 = await J("(function(){ const d = (Act3Data.DEFENDERS || []).find(x => x.key === 'straz'); return d ? d.when({ flags: TownQuests.state().flags }) : null; })()");
    t.check("...Akt III: dwóch strażników dworu broni tawerny", act3 === true, act3);
    await setTime((await st()).day + 7, 10);
    await go(24, 20, 15, 8);
    const g1 = await t.gold();
    const week = await lordTalk(["Odejdź"]);
    t.check("...tydzień później: „Twoje sto groszy” (+100 G)", /Twoje sto groszy/.test(week.text) && (await t.gold()) === g1 + 100, week.text.slice(0, 100));
    // the lie
    await t.loadFrom(6, { quiet: true });
    await lordTalk(["Nic tam nie ma", "Odejdź"]);
    s = await st();
    t.check("...„Nic tam nie ma, panie. Kurz i szczury.” - w7Klamstwo, na razie nic", !!s.f.w7Klamstwo && !s.s.lieOut, s.s.najpierw);
    await E("TownQuests.state().v.kamien_kruk = 3; 0");
    const lieDay = s.day;
    await setTime(lieDay + 7, 9);
    await go(24, 20, 16, 8);
    await t.until("Dwor.state().lieOut > 0", 10);
    await setTime(lieDay + 8, 9);
    await t.until("Dwor.state().searched > 0", 20);
    s = await st();
    const tops2 = await t.notices();
    t.check("...kłamstwo wychodzi na jaw po tygodniu: wrogość dworu, przeszukanie chaty (zabrane 3 kamienie z krukiem)",
        !!s.f.w7KlamstwoWyszlo && s.s.searched > 0 && !s.v.kamien_kruk && tops2.some(x => /Lord wie, że skłamałeś/.test(x)), { searched: s.s.searched, v: s.v, tops: tops2.slice(-3) });
    t.check("...Lord przy Sercu: rywal, nawet jako dawny sojusznik", (await J("Underground.lordStance(Underground.world())")) === "rival");
    const doorLie = await J("$gameMap.event(1).list()[0].parameters[0]");
    t.check("...drzwi dworu już nie wpuszczają (kłamca nie wejdzie)", !/Dwor\.door/.test(doorLie), doorLie);
    const g2 = await t.gold(50);
    await go(8, 99, 51, 4);
    await t.until("Dwor.state().toll === $gameSystem.dayNightDay()", 10);
    t.check("...wyższe myto przy bramie wschodniej: 5 G", (await t.gold()) === g2 - 5, await t.gold());
    // silence with Feliks still at the manor (the letters left, the Lord never told): Feliks spies
    await t.loadFrom(3, { quiet: true });
    await t.talkTo(named("Kantorek Feliksa (szuflada)"), ["Zostaw"], { place: true, secs: 40 });
    await t.gold(5000);
    await E("Story.pay(Story.left()); Underground.open(); TownQuests.autoChecks(); 0");
    await go(10, 10, 10, 2);
    await setTime(15, 10);
    await go(24, 20, 15, 8);
    s = await st();
    const sil = await lordTalk(["Tego nie powiem", "Odejdź"]);
    s = await st();
    const spy = await J("(function(){ const w = (Act3Data.WAVES || []).find(x => x.id === 'w3'); return w ? w.extra({ flags: TownQuests.state().flags }).map(x => x.name) : null; })()");
    t.check("...milczenie, a Feliks wciąż w dworze: słyszał każde słowo - donosi frakcji (w Akcie III „Zwiadowca z ruin” od kuchni)",
        /Szanuję milczenie/.test(sil.text) && /Słyszał każde słowo/.test(sil.text) && !!s.f.w7FeliksDonosi && Array.isArray(spy) && spy.includes("Zwiadowca z ruin"), { spy, step: s.step, t: sil.text.slice(-120) });
    t.check("...Lord przy Sercu: nieobecny (nic nie wie)", (await J("Underground.lordStance(Underground.world())")) === "absent");

    // ===================================================================== rozdz. 7: Lord przy Sercu, W9, epilog
    await t.loadFrom(6, { quiet: true });
    await lordTalk(["Powiem panu wszystko", "Odejdź"]);
    const heart = await J(`(function(){ const w = Underground.world(); return { lf: w.lordFlags, feliks: w.feliks, w7: w.w7, stance: w.lord.stance }; })()`);
    const line = await J(`(function(){ const H = window.Underground_Data ? Underground_Data.HEART : null; if (!H) return null;
        const w = Underground.world(); const fns = H.LORD.arrive.ally.filter(x => Array.isArray(x) && typeof x[1] === "function"); return fns.map(f => f[1](w)).join(" | "); })()`);
    t.check("Serce: świat Underground czyta W7 (lordFlags.w7 / first, Feliks „arrested”, w7.truth) - stance ally",
        heart.lf.w7 && heart.lf.first && heart.feliks === "arrested" && heart.w7 && heart.w7.truth && heart.stance === "ally", heart);
    t.check("...Lord przy Sercu mówi o Feliksie i kamieniach (linijka W7 w scenie „ally”), pytanie o syna Kazimierza zostaje", /Feliks wyjmował mi ze ścian kruki/.test(line || ""), line);
    const epi = await J("Dwor.epilogue()");
    t.check("...epilog dworu: „W holu dworu brakuje trzech kruków”", /brakuje trzech kruków/.test(epi || ""), epi);
    await E("Tawerna.emit('undergroundLord', { stance: 'ally', choice: 'allow', told: null }); 0");
    s = await st();
    t.check("...po scenie przy Sercu (Underground: Lord pyta o syna) wątek W7 się kończy, notatka „Lord przy Sercu”",
        s.rec && s.rec.s === "done" && (await J("Journal.data().notes.some(n => n.title === 'Lord przy Sercu' && /Kazimierza/.test(n.text))")), s.rec);
    // W9: the Lord's men beaten in the ruins - the Lord remembers, the guard is cooler
    await t.loadFrom(6, { quiet: true });
    await E("TownQuests.state().flags.w9DworPobity = $gameSystem.dayNightDay(); 0");
    const w9 = await lordTalk(["Odejdź"]);
    t.check("W9 (propozycja koordynatora): pobici ludzie Lorda w ruinach - Lord pamięta („Bartosz kuleje... Pamiętam, kto skończył.”)", /Pamiętam, kto skończył/.test(w9.text), w9.text.slice(0, 160));
    const rem = await J("(function(){ const s = TownQuests.state(); s.said = s.said || {}; s.said.w7Straz = 1; const r = TownQuests.remarkFor('straznik'); return r ? r.id : null; })()");
    t.check("...a strażnik dworu chłodniejszy (uwaga przy pierwszej rozmowie)", rem === "w7StrazW9", rem);

    // ===================================================================== bez Feliksa (W1 b): ślady i Teodor
    await t.loadFrom(1, { quiet: true });
    await E("TownLife.setGone('feliks', true); for (const k of ['lordAlly', 'kubaResent', 'sluiceHalf']) TownQuests.state().flags[k] = $gameSystem.dayNightDay(); 0");
    await setTime(11, 12);
    await go(172, 16, 7, 6);
    const teo = await talkRes("kamerdyner", []);
    await go(8, 34, 61, 8);
    await setTime(11, 9);
    const han = await talkRes("piekarka", []);
    await setTime(11, 10);
    await talkRes("woziwoda", []);   // (his remark of W1 b first)
    const kub = await talkRes("woziwoda", []);
    s = await st();
    t.check("bez Feliksa (po W1 b): ślady - Teodor w holu (kantorek, kałamarz), Hanka (papier i lak), Kuba (wychodził spod włazu) - rozdz. 4",
        /Kantorek w gabinecie/.test(teo.text) && /Papier i lak/.test(han.text) && /spod włazu/.test(kub.text) && s.step === "w7Gabinet", { step: s.step, tr: s.s.traces });

    // ===================================================================== W1 i W7 w obu kolejnościach
    const w1At = (talk, extra) => E(`(function(){ const q = TownQuests, i = q.Q.W1.steps.findIndex(s => s.talk === ${JSON.stringify(talk)});
        const r = q.rec("W1"); if (!r || r.s !== "active") q.start("W1", i); else { r.step = i; r.sday = $gameSystem.dayNightDay(); } ${extra || ""} q.refreshMarkers(); return i; })()`);
    const saidAll = keys => E(`(function(){ const s = TownQuests.state(); s.said = s.said || {}; for (const k of ${JSON.stringify(keys)}) s.said[k] = 1; return 0; })()`);
    // W7 first, then W1 ch. 6 the quiet way: the Lord knows of Feliks, not of the sluice
    await t.loadFrom(5, { quiet: true });
    await setTime(14, 10);
    await go(24, 20, 15, 8);
    await lordTalk(["Pokaż Lordowi listy", "Odejdź"]);
    await w1At("w1Choice", "TownQuests.state().v.rysunek = 1;");
    const w1b = await lordTalk(["Pokaż Lordowi rysunek", "Odejdź"]);
    s = await st();
    const nLord = await J("(Journal.data().notes.filter(n => n.title === 'Śluza otwarta po cichu').pop() || {}).text || ''");
    t.check("W1 po prawdzie z W7: rysunek śluzy u Lorda - „Znowu jego ręka”, o Feliksie wiedział, o zasuwie nie; Feliks w wieży, śluza do połowy (dalej sprawa W1)",
        /Znowu jego ręka/.test(w1b.text) && /Feliks siedzi w wieży/.test(w1b.text) && !/Nic nie wiedział|Mój dziadek postawił dwór na kanale zakonu\?/.test(w1b.text) &&
        !!s.f.sluiceHalf && /O Feliksie wiedział już/.test(nLord), { t: w1b.text.slice(0, 260), note: nLord.slice(0, 120) });
    await saidAll(["w7Straz"]);
    const g7 = await J("(function(){ const r = TownQuests.remarkFor('straznik'); return r ? r.id : null; })()");
    const gLines = await J("TownLife.lines('straznik').morning.concat(TownLife.lines('straznik').night)");
    t.check("...strażnik dworu: uwaga o śluzie (nie „Feliks wyjechał”), a w zwykłych kwestiach Feliksa już nie ma", g7 === "guardLordW7" && !gLines.some(l => /Feliks dba|Rozkaz Feliksa/.test(l)), { g7, gLines });
    // W7 first, then W1 ch. 6 at the market (a market day), and W1 ch. 3 Kuba
    await t.loadFrom(5, { quiet: true });
    await setTime(14, 10);
    await go(24, 20, 15, 8);
    await lordTalk(["Pokaż Lordowi listy", "Odejdź"]);
    await w1At("w1Kuba");
    await saidAll(["w7Kuba", "w7Soltys", "w7Hanka"]);
    await go(8, 51, 52, 8);
    const kuba = await talkRes("woziwoda", ["Będę milczał"]);
    const flat = x => x.replace(/\s+\/\s+/g, " ").replace(/\s+/g, " ");   // (the talk's pages joined)
    t.check("...W1 rozdz. 3 po W7: Kuba - „Feliks siedzi w wieży, a zasuwy pod włazem nikt nie ruszył”; Lord wie o listach, o zasuwie nie",
        /Feliks siedzi w wieży, a zasuwy pod włazem nikt nie ruszył/.test(flat(kuba.text)) && /O zasuwie nie wie/.test(flat(kuba.text)), flat(kuba.text).slice(150, 700));
    await w1At("w1Choice", "TownQuests.state().v.rysunek = 1;");
    const rev = await talkRes("soltys", ["Ujawnijmy to"]);
    s = await st();
    t.check("...W1 rozdz. 6 na targu po W7: Lord „nie blednie” - Feliks już w wieży, nie znał tylko zasuwy; śluza do połowy",
        /Nie blednie/.test(flat(rev.text)) && /Raz przyszedłeś z tym najpierw do mnie/.test(flat(rev.text)) && !!s.f.w1Revealed && !!s.f.sluiceHalf, flat(rev.text).slice(300, 1000));
    t.check("...Lord przy Sercu dalej sojusznik (prawda z W7 waży więcej niż wstyd na targu)", (await J("Underground.lordStance(Underground.world())")) === "ally" ||
        !(await J("Story.chapterEnded()")));
    // W1 first: b (the quiet way) - the invitation of a friend, the truth: "I sent him away for the water"
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true });
    await setTime(20, 10);
    await J("Dwor.debugJump(2)");
    await E("(function(){ const f = TownQuests.state().flags; for (const k of ['lordAlly', 'sluiceHalf', 'millRuns', 'kubaResent']) f[k] = 18; TownLife.setGone('feliks', true); return 0; })()");
    await go(24, 20, 15, 8);
    const invB = await lordTalk(["Innym razem", "Odejdź"]);
    await E("(function(){ const f = TownQuests.state().flags; delete f.lordAlly; delete f.kubaResent; f.w1Revealed = 18; f.lordCold = 18; Dwor.state().zaproNo = 0; return 0; })()");
    const invA = await lordTalk(["Innym razem", "Odejdź"]);
    t.check("W1 przed W7: zaproszenie po cichej drodze W1 b („Mój przyjaciel od zasuwy”) i po targu W1 a („Po tamtym targu...”)",
        /Mój przyjaciel od zasuwy/.test(invB.text) && /Po tamtym targu/.test(invA.text), { b: invB.text.slice(0, 120), a: invA.text.slice(0, 120) });
    await E("(function(){ const f = TownQuests.state().flags; delete f.w1Revealed; delete f.lordCold; f.lordAlly = 18; f.kubaResent = 18; return 0; })()");
    await J("Dwor.debugJump(5)");
    await setTime(21, 10);
    await go(24, 20, 15, 8);
    const trB = await lordTalk(["Pokaż Lordowi listy", "Odejdź"]);
    t.check("...prawda po W1 b: „Odprawiłem go za wodę - po cichu, z sakiewką na drogę”", /Odprawiłem go za wodę/.test(trB.text) && (await J("Dwor.state().fate")) === "sent", trB.text.slice(-260));
    // W1 c (the hush money) then W7: the letter of the twenty groszy, the Lord's word on it, W1 back at its choice
    await t.loadFrom(3, { quiet: true });
    await w1At("w1Feliks", "TownQuests.state().flags.feliksPays = 12; const rr = TownQuests.rec('W1'); rr.t.deal = 12; rr.t.paid = 12; rr.t.got = 20; TownQuests.state().v.rysunek = 1;");
    const drC = await t.talkTo(named("Kantorek Feliksa (szuflada)"), ["Zabierz"], { place: true, secs: 40 });
    await setTime(14, 10);
    await go(24, 20, 15, 8);
    const trC = await lordTalk(["Pokaż Lordowi listy", "Odejdź"]);
    const w1c = await J("(function(){ const r = TownQuests.rec('W1'); return { step: TownQuests.Q.W1.steps[r.step].talk || TownQuests.Q.W1.steps[r.step].tick, broke: !!TownQuests.state().flags.feliksBroke, note: Journal.data().notes.some(n => n.title === 'Feliks już nie płaci') }; })()");
    t.check("W1 6 c przed W7: w listach „Płacę mu dwadzieścia groszy”, Lord: „Brałeś od niego pieniądze... A jednak przyszedłeś”; Feliks w wieży - W1 wraca do wyboru z rysunkiem",
        /Płacę mu dwadzieścia groszy/.test(drC.text.replace(/\s+/g, " ")) && /Brałeś od niego pieniądze/.test(trC.text) && w1c.step === "w1Choice" && w1c.broke && w1c.note, { w1c, t: trC.text.slice(0, 200) });

    // ===================================================================== F9
    await t.loadFrom(1, { quiet: true });
    const g = await J("Dwor.debugJump(4)");
    s = await st();
    t.check("F9 „W7: rozdział 4”: plan Feliksa gotowy, noc 22:30, przy włazie za oranżerią", JSON.stringify(g) === "[24,3,22,8]" && s.step === "w7Gabinet" && s.hour === 22.5, { g, step: s.step });
});
