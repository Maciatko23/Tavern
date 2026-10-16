//=============================================================================
// Przystan.js
//=============================================================================
// The harbour on the island's west coast (Map125 "Przystań", behind Podgrodzie; interiors 126 Chata Janka, 127 Szopa przy pochylni,
// 128 Komora celna - tools/przystan, docs/przystan/KONCEPCJA.md, approved by the user 2026-10-14). Its people are TownLife residents
// (TownLife_Data.js: janek 939, przemytnik 940, celnik 941, straznik_przystan 942); their quests are TownQuests' (K47, K48, D20, W10 in
// TownQuests_Data.js). This plugin is what is the harbour's own:
//   - the first meetings, before any quest (TownLife.addTalkHook(fn, first)): Janek, who found the hero on the beach, gives back the
//     mother's scarf the sea threw up with the bundle (item 175, a keepsake); Roch Szkwał, the smuggler of the prologue, alive, hiding
//     under his first name - "hide that pendant"; the customs officer's ledger
//   - Janek's trade: he buys the sea's herring (173) and cod (174) and the pond's fish, sells smoked fish
//   - the ferry (TownQuests.isFerry: every 3 days) at the pier 9-15 with its ferryman (an injected event): no passage for the hero
//   - Roch's cutter: a wreck on the beach -> on the slipway (D20, flag d20Pochylnia) -> afloat (d20Gotowy); the night it sails (the
//     hero distracts the guard: d20Pomoc) and then a run every RUN_EVERY nights (Roch and the cutter away 21-6) with news and goods
//     from the mainland; or the hero gives him to the customs officer in the customs house (d20Wydany: 40 G, Roch gone for good)
//   - W10 "List do matki": the letter by the ferry (3 G - the officer reads it) or by the cutter; the news comes back (the thread
//     stays open: the mother does not come)
//   - Janek's boat away while he is at sea; the TownQuests handlers k47Rod, d20Noc, w10Wyslany, w10Wiesc; the sea's fishing bonus
//     after Janek's advice (Farming_Plots asks fishBonus)
// Ids 760-779 (Tawerna.inject, Map125): 760 the ferryman, 761-762 people off the ferry on the wave days.
// DROUGHT (the user's rule): the sea is salt (the map's <Water:salt>, Farming_Plots.js) - nothing here gives the hero water.

/*:
 * @target MZ
 * @plugindesc Przystań (mapa 125): Janek i chusta matki, Roch Szkwał i jego kuter, celnik Lorda, prom w dni promu, skup ryb, list do matki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TownLife
 * @orderAfter TownQuests
 *
 * @help
 * ============================================================================
 * Przystan.js - przystań na zachodnim brzegu wyspy
 * ============================================================================
 * Mapa 125 „Przystań” (za Podgrodziem), wnętrza 126 Chata Janka, 127 Szopa
 * przy pochylni, 128 Komora celna. Mieszkańcy są w TownLife_Data.js (Janek,
 * Roch, celnik Sambor Kwit, strażnik przystani), zadania w TownQuests_Data.js
 * (K47 „Pierwszy połów”, K48 „Sieci po sztormie”, D20 „Kuter na pochylni”,
 * W10 „List do matki”).
 *
 * Ta wtyczka:
 * - pierwsze spotkania: Janek oddaje Chustę matki (pamiątka), Roch żyje i
 *   każe schować wisiorek, celnik przedstawia się;
 * - Janek skupuje śledzie, dorsze i ryby, sprzedaje wędzoną rybę;
 * - prom stoi przy molo w dni promu (co 3 dni, 9-15), przewoźnik nie bierze
 *   nikogo bez glejtu Lorda, ale bierze listy;
 * - kuter Rocha: wrak na plaży, na pochylni, na wodzie; nocny rejs po
 *   wyborze w D20 (albo donos u celnika w komorze celnej);
 * - morze jest słone: picia nie ma (Farming_Plots.js, notatka <Water:salt>).
 *
 * Zdarzenia 760-779 na mapie 125: przewoźnik promu i ludzie z promu.
 * W skryptach: Przystan.state(), Przystan.kuterState(), Przystan.ferryNow().
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Przystan.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "Przystan";
    const MAP = 125, CUSTOMS = 128;
    const ITEM = { fish: 98, herring: 173, cod: 174, scarf: 175, tar: 176, smokedFish: 106, rod: 100, iron: 86, steel: 143, bandage: 152 };
    const SELL = { 173: 4, 174: 7, 98: 3 };                 // what Janek pays a piece
    const BUY_SMOKED = 16;                                   // a smoked fish from Janek
    const GOODS = [[86, 23], [143, 60], [152, 9]];           // Roch's goods from the mainland (half again dearer than the town)
    const LETTER_FERRY = 3, BETRAY_GOLD = 40, RUN_EVERY = 4;
    const WAVES = [10, 24, 38, 52];                          // the ferry's wave days (TownQuests' calendar, W6)
    const FERRY_HOURS = [9, 15];
    const IDS = [760, 779];
    const COIN_ICON = 314;
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const has = () => !!window.$gameSystem;

    // ------------------------------------------------------------------
    // The state (the save): the meetings live in TownQuests' flags (the quests' offers ask them), the rest here
    // ------------------------------------------------------------------
    const store = T.state.define("przystan", () => ({ celnikMet: 0, runDay0: 0, letterDay: 0, letterHour: 0, newsGiven: 0, sold: 0,
        janekBetrayTold: 0, newsN: 0 }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const flags = () => { const q = TQ(); return q && q.state ? q.state().flags : {}; };
    function setFlag(k) {
        const f = flags();
        if (!f[k]) f[k] = day();
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
        if (q && q.refreshMarkers) q.refreshMarkers();
    }
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const qRec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const atStep = (id, n) => { const r = qRec(id); return !!r && r.s === "active" && r.step === n; };

    // ------------------------------------------------------------------
    // The calendar: the ferry, the cutter's state and its runs
    // ------------------------------------------------------------------
    const ferryToday = (d = day()) => { const q = TQ(); return q && q.isFerry ? !!q.isFerry(d) : (d - 1) % 3 === 0; };
    const ferryNow = () => has() && ferryToday() && hour() >= FERRY_HOURS[0] && hour() < FERRY_HOURS[1];
    const waveNow = () => ferryNow() && WAVES.includes(day()) && hour() < 14;
    function kuterState() {
        const f = flags();
        if (f.d20Wydany) return "seized";
        if (f.d20Gotowy) return "water";
        if (f.d20Pochylnia) return "slip";
        return "beach";
    }
    const runNight = d => { const r0 = S().runDay0; return !!(has() && flags().d20Pomoc && r0 && d >= r0 && (d - r0) % RUN_EVERY === 0); };
    const kuterAway = () => has() && ((hour() >= 21 && runNight(day())) || (hour() < 6 && runNight(day() - 1)));
    // the last run that has come back (its day), 0 if none yet
    function lastRunBack() {
        if (!has() || !flags().d20Pomoc || !S().runDay0) return 0;
        const d = day(), h = hour();
        for (let r = d; r >= S().runDay0; r--) {
            if (!runNight(r)) continue;
            if (d > r + 1 || (d === r + 1 && h >= 6)) return r;
        }
        return 0;
    }
    const rochGone = () => has() && !!flags().d20Wydany;
    const fishBonus = () => (has() && flags().rybackaRada ? 0.1 : 0);

    // ------------------------------------------------------------------
    // Event commands: speech bubbles (\SPK[n]) and choices, the way TownQuests writes them
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const w of para.split(/\s+/)) {
                if (!w) continue;
                if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
            }
            if (line) out.push(line);
        }
        return out;
    }
    function sayTo(out, spk, text, ind) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""], ind));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l], ind)));
        }
        return out;
    }
    // "> text": the hero; "@key: text": another resident of the harbour (TownLife's event); else the one spoken to
    function linesTo(out, spk, arr, ind) {
        for (const raw of [].concat(arr || [])) {
            if (!raw) continue;
            const s = String(raw);
            if (s.startsWith("> ")) { sayTo(out, HERO, s.slice(2), ind); continue; }
            const m = /^@(\w+):\s*([\s\S]*)$/.exec(s);
            if (m) sayTo(out, speaker(m[1]), m[2], ind);
            else sayTo(out, spk, s, ind);
        }
        return out;
    }
    const act = (out, args, ind) => (out.push(C(355, ["Przystan.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    function choiceTo(out, labels, branches, cancel, ind) {
        const i0 = ind || 0;
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0], i0));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l], i0));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + i0 + 1 }));
            out.push(C(0, [], i0 + 1));
        });
        out.push(C(404, [], i0));
        return out;
    }
    const resident = key => { const L = TL(); return L && L.RESIDENTS ? L.RESIDENTS.find(r => r.key === key) || null : null; };
    function speaker(key) {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null, r = resident(key);
        return { id: ev && $gameMap.event(ev.eventId()) === ev ? ev.eventId() : -1, name: r ? r.name : key };
    }
    // the resident's usual line for now (TownLife's talk slots)
    function usual(key) {
        const L = TL(), t = L && L.lines ? L.lines(key) : null;
        if (!t) return "";
        const h = hour(), w = $gameScreen.weatherType(), rain = (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0;
        const slot = rain && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return "";
        S().usualN = (S().usualN || 0) + 1;
        return list[S().usualN % list.length];
    }
    // a quest of this resident's that wants him now (an offer or a hand-in): TownQuests speaks first then
    function questWants(key) {
        const q = TQ();
        if (!q || !q.markers) return false;
        if (q.refreshMarkers) q.refreshMarkers();
        const m = q.markers()[key];
        return m === "ready" || m === "new";
    }
    const questTalk = key => { const q = TQ(); return q && q.talkFor ? q.talkFor(key, false) : null; };

    // ------------------------------------------------------------------
    // TEXTS
    // ------------------------------------------------------------------
    const TX = {
        janekMeet: ["Ej... Ej! To ty! \\N[1], tak? To ty! Myślałem, że nie przeżyjesz. Siny byłeś jak dorsz w listopadzie.",
            "> To ty mnie znalazłeś? Na plaży?",
            "Ja. O świcie, pod wydmą, przy tym wraku. W garści list, ani myślałeś go puścić. Na szyi kruk, taki sam jak u Stacha. To wziąłem cię na plecy i do niego.",
            "> Dziękuję. Nie wiem, jak ci się odwdzięczę.",
            "Daj spokój. Morze daje, morze bierze. A jak raz odda człowieka żywego, to trzeba go zanieść, gdzie trzeba.",
            "A! Czekaj. Dwa dni później morze wyrzuciło jeszcze to. (Janek podaje ci mokry tobołek.) Chleb zjadły mewy, ser też. Ale chusta została. Haftowana, ładna."],
        janekMeet2: ["> To mamy... Haftowała ją całą zimę.",
            "To trzymaj blisko. ...No! Jakbyś chciał ryby, to wiesz, gdzie Janek. A jakbyś chciał je łowić, przyjdź o świcie. O świcie biorą najlepiej."],
        rochMeet: ["(Roch patrzy na ciebie długo.) ...No proszę. Chłopak od ostatnich monet. Żyjesz.",
            "> Ty! Myślałem, że morze cię wzięło. Stałeś przy sterze, a potem ta fala...",
            "Wzięło. I wypluło. Mnie zawsze wypluwa, nie smakuję mu. Trzy dni siedziałem na skałach za cyplem i piłem deszcz z kamieni. A kuter... sam widziałeś. Leży na plaży jak zdechły wieloryb.",
            "I ciszej z tym „przemytnikiem”. Tu jestem Roch, co łata sieci i nosi worki, jak przypłynie prom. Celnik Lorda za przemyt zabiera łódź, a człowieka zakuwa.",
            "> Nikomu nie powiem.",
            "Wiem. Dlatego jeszcze rozmawiamy. (Roch zerka na twoją szyję.) A to schowaj pod koszulę.",
            "> Wisiorek? Po dziadku. Matka mi go dała.",
            "W porcie Czarne Oczy przetrząsały każdą łódź właśnie za takimi kamieniami. Kruk na kamieniu. Kto go miał, ten dalej nie płynął. Czego szukają, nie wiem i wiedzieć nie chcę. Ale ty tego nie noś na wierzchu. Tu też ktoś skupuje kruki.",
            "Jakbyś chciał pomóc staremu... kuter da się jeszcze połatać. Deski, liny, smoła. Jak znowu popłynie, zawiozę na ląd list do twojej matki. Za darmo. No, prawie za darmo."],
        celnikMeet: ["Sambor Kwit, celnik dworu. (Celnik nie podnosi oczu znad księgi.) Opłata portowa: dwa grosze od tobołka. Ty nie masz tobołka, więc nic.",
            "Rozkaz dworu: każdy kamień z krukiem do zgłoszenia. Gdybyś jakiś znalazł - przynieś. Zapłacę uczciwie. Zapiszę uczciwie."],
        janekMenuAsk: ["Co tam, \\N[1]?", "Ryby, pogaduchy, czy tylko przechodzisz?", "Mów, chłopcze. Sieć poczeka."],
        janekSellNone: ["Nie masz ryb? To łów! Morze pełne, tylko głupie, nie samo do koszyka wskoczy."],
        janekSold: ["Dobre ryby. Masz, uczciwie, jak u Janka.", "Śledź jak srebro. Masz pieniądze."],
        janekBuyNo: ["Szesnaście groszy, chłopcze. Na kredyt to ja daję tylko mewom."],
        janekBuy: ["Masz, prosto z wędzarni. Jeszcze ciepła."],
        janekBetray: ["Roch... zabrali go. Ktoś doniósł. (Janek długo patrzy w morze.) Nie patrz tak na mnie. Ja nic nie mówię."],
        rochMenuAsk: ["Czego?", "Mów, chłopcze. Cicho.", "Hm?"],
        rochNightAsk: ["(Roch mówi szeptem.) Kuter gotowy. Strażnik chodzi po nabrzeżu do dwudziestej drugiej, potem siada przy koksowniku.",
            "Gdyby ktoś go zagadał... na kwadrans... wypłynę cicho, bez latarni."],
        rochNightHelp: ["> Zagadam strażnika. Płyń.",
            "> (Strażnik przy koksowniku słucha twojej opowieści o wilkach z Polnej drogi. Za plecami, bez latarni, kuter odbija od pochylni.)",
            "@straznik_przystan: ...I co, uciekłeś mu? Ha! Dobry z ciebie gawędziarz. A teraz zmykaj, noc.",
            "> (Kiedy oglądasz się na morze, kutra już nie ma. Tylko kruk krąży nad wodą.)"],
        rochNightLater: ["Nie dziś? Dobrze. Kuter poczeka. Ja też."],
        rochNews: [
            ["Byłem na lądzie. Brzozowa Wola spalona do gołej ziemi. Ludzie poszli za rzekę albo za wojskiem.",
                "Ale w obozie pod lasem baby gadały o kobiecie w chuście w czerwone kwiaty. Pytała o chłopca z krukiem. Poszła z taborem na północ, za wojskiem."],
            ["Na lądzie gorzej. Czarne Oczy zajęły port. Prom pływa już tylko z ich pieczęcią."],
            ["Kamienie z krukiem idą po trzy złote za sztukę. Ktoś je zbiera, i to nie dla pamiątki."],
            ["W porcie mówią, że ktoś z wyspy płaci za mapy wybrzeża. Złotem, nie miedziakami."],
            ["Wojsko ściąga każdą łódź na południe. Coś szykują. Albo czegoś szukają."]],
        rochLetter: ["List do matki? Daj. Schowam pod deskę w dziobie, tam nawet Czarne Oczy nie zaglądają.", "Jak ją znajdę, oddam do rąk. Jak nie - przywiozę, co ludzie mówią."],
        rochGoods: ["Z lądu przywiozłem to i owo. Drożej niż w mieście, bo i droga dłuższa."],
        rochGoodsNone: ["Nic dziś nie mam. Następnym razem."],
        ferry: ["Prom wraca na ląd o trzeciej. Na pokład tylko wojsko i ludzie z glejtem Lorda. Ty glejtu nie masz, chłopcze.",
            "Listy biorę. Trzy grosze, a celnik i tak każdy przeczyta."],
        ferryLetter: ["Trzy grosze. Dobrze. (Przewoźnik chowa list za pazuchę.) Pójdzie z najbliższym kursem. Odpowiedź, jak będzie, przywiozę."],
        ferryNews: ["Twój list doszedł do Brzozowej Woli. Wsi już nie ma, chłopcze. Spalona.",
            "Ale w obozie za rzeką baby gadały o kobiecie w chuście w czerwone kwiaty. Pytała o syna z krukiem na szyi. Poszła z taborem na północ, za wojskiem."],
        ferryNewsScarf: ["> (Wyjmujesz chustę matki.) Taka chusta? Takie kwiaty?", "Takie same. Tak mówiły. Takie same."],
        betrayAsk: ["> Panie celniku... na przystani ktoś szykuje kuter. Do przemytu."],
        betrayYes: ["Kuter? (Celnik odkłada pióro.) Ten łatacz sieci, Roch? Tak myślałem. Nikt nie łata sieci tak długo.",
            "Dobrze, chłopcze. Dwór pamięta przysługi. Masz, czterdzieści groszy. Wieczorem go zabierzemy. I kuter też."],
        // (2026-10-15) the red water (CzerwonaWoda.js): why nobody boils the sea, the legend of the blood of Kruczych Skał
        janekRed: ["Czerwona? To zakwit. W suszę morze przy brzegu gnije jak woda w beczce. Ryby się duszą, fale wyrzucają je na piasek.",
            "> A gdyby ją przegotować?",
            "Ojciec próbował. Rok suszy, beczki puste, to nagotował kocioł czerwonej. Pił i mówił, że słona, ale da się. Do rana go skręcało. Przeżył, ale do śmierci nie spojrzał na morze.",
            "Trucizna zakwitu nie ucieka z parą, chłopcze. Sól też nie. Wodę noszę z miasta, jak wszyscy.",
            "Starzy gadają, że to krew Kruczych Skał. Że coś pod skałą krwawi do morza, jak przychodzi susza. Bajki... ale w suszę zawsze czerwono."],
        janekGrey: ["Teraz szara. Deszcz ją przepłukał. Ale dalej słona - nie pij, choćby cię suszyło.",
            "Za parę dni bez deszczu znowu zakwitnie. Zawsze zakwita. Starzy mówią: krew Kruczych Skał wraca."],
        rochRed: ["Czerwona woda. Na lądzie mówią, że to znak wojny. Tu mówią, że krew Kruczych Skał. Ja mówię: nie pij i nie zadawaj pytań.",
            "Raz stałem w ciszy trzy dni na czerwonym. Kucharz pił przegotowaną. Pochowaliśmy go w tej samej wodzie."],
        refugees: [["Trzy dni na pokładzie. Ziemia się kołysze."], ["Gdzie tu miasto? Mówili, że za lasem, za takim biednym przedmieściem."],
            ["Celnik zabrał nam dwa grosze i nadzieję. Grosze były ważniejsze."]]
    };

    // ------------------------------------------------------------------
    // The talks: Janek, Roch, the customs officer (TownLife's hook, first), the ferryman (an injected event)
    // ------------------------------------------------------------------
    const pick = list => list[Math.floor(Math.random() * list.length)];
    function janekTalk(ev) {
        const spk = { id: ev.eventId(), name: "Janek" }, f = flags(), out = [];
        if (!f.janekMet) {
            linesTo(out, spk, TX.janekMeet);
            act(out, ["janekMet"]);
            return linesTo(out, spk, TX.janekMeet2);
        }
        if (f.d20Wydany && !S().janekBetrayTold) { act(out, ["janekBetrayTold"]); return linesTo(out, spk, TX.janekBetray); }
        if (questWants("janek")) { const q = questTalk("janek"); if (q && q.length) return q; }
        linesTo(out, spk, [pick(TX.janekMenuAsk)]);
        const labels = [], branches = [];
        const fish = [ITEM.herring, ITEM.cod, ITEM.fish].filter(id => count(id) > 0);
        labels.push(fish.length ? "Sprzedam ryby (" + fish.map(id => item(id).name.toLowerCase() + " ×" + count(id)).join(", ") + ")." : "Kupujesz ryby?");
        branches.push(fish.length ? act([], ["sell"]).concat(linesTo([], spk, [pick(TX.janekSold)])) : linesTo([], spk, TX.janekSellNone));
        labels.push("Kupię wędzoną rybę (" + BUY_SMOKED + " G).");
        branches.push(act([], ["buySmoked"]));
        const RW = T.api("CzerwonaWoda");
        if (RW && RW.seaHere && $gameMap.mapId() === MAP) { labels.push("A ta czerwona woda?"); branches.push(linesTo([], spk, RW.phase().grey ? TX.janekGrey : TX.janekRed)); }
        labels.push("Co słychać?");
        branches.push(linesTo([], spk, [usual("janek") || "Morze jak morze."]));
        labels.push("Bywaj.");
        branches.push([]);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    function rochTalk(ev) {
        const spk = { id: ev.eventId(), name: "Roch" }, f = flags(), out = [];
        if (!f.rochMet) { linesTo(out, spk, TX.rochMeet); act(out, ["rochMet"]); return out; }
        // D20's night: the cutter is ready - tonight, while the guard sits by the brazier
        const h = hour();
        if (atStep("D20", 6) && (h >= 20 || h < 2)) {
            linesTo(out, spk, TX.rochNightAsk);
            return choiceTo(out, ["Zagadam strażnika. Płyń.", "Jeszcze nie dziś."],
                [act([], ["d20Help"]).concat(linesTo([], spk, TX.rochNightHelp)), linesTo([], spk, TX.rochNightLater)], 1);
        }
        if (questWants("przemytnik")) { const q = questTalk("przemytnik"); if (q && q.length) return q; }
        // the news after a run (the first one with the letter to the mother: the mother's trace)
        const back = lastRunBack();
        if (back && S().newsGiven < back) {
            const first = f.w10Kuter && atStep("W10", 1) && (back > S().letterDay || (back === S().letterDay && S().letterHour < 21));
            act(out, ["rochNews", back, first ? 1 : 0]);
            return linesTo(out, spk, first ? TX.rochNews[0] : TX.rochNews[1 + (S().newsN % (TX.rochNews.length - 1))]);
        }
        linesTo(out, spk, [pick(TX.rochMenuAsk)]);
        const labels = [], branches = [];
        if (atStep("W10", 0) && f.d20Pomoc) { labels.push("Zawieziesz list do mojej matki?"); branches.push(act([], ["w10Kuter"]).concat(linesTo([], spk, TX.rochLetter))); }
        if (back && back >= day() - 2) {
            labels.push("Co przywiozłeś z lądu?");
            const sub = linesTo([], spk, TX.rochGoods);
            choiceTo(sub, GOODS.map(([id, p]) => item(id).name + " - " + p + " G").concat(["Nic nie trzeba."]),
                GOODS.map(([id]) => act([], ["buy", id])).concat([[]]));
            branches.push(sub);
        }
        if (T.api("CzerwonaWoda")) { labels.push("Czemu ta woda czerwona?"); branches.push(linesTo([], spk, TX.rochRed)); }
        labels.push("Co słychać?");
        branches.push(linesTo([], spk, [usual("przemytnik") || "Nic. I dobrze."]));
        labels.push("Bywaj.");
        branches.push([]);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    function celnikTalk(ev) {
        const spk = { id: ev.eventId(), name: "Sambor Kwit" }, out = [];
        if (!S().celnikMet) { act(out, ["celnikMet"]); return linesTo(out, spk, TX.celnikMeet); }
        // D20: the hero may give Roch away - in the customs house, at the officer's desk
        if ($gameMap.mapId() === CUSTOMS && atStep("D20", 6) && !flags().d20Wydany) {
            linesTo(out, spk, [usual("celnik") || "Słucham."]);
            return choiceTo(out, ["Ktoś szykuje kuter do przemytu.", "Nic, tylko patrzę."],
                [linesTo([], spk, TX.betrayAsk).concat(choiceTo([], ["Tak. To Roch, ten od sieci.", "Nie... pomyliłem się."],
                    [act([], ["d20Betray"]).concat(linesTo([], spk, TX.betrayYes)), linesTo([], spk, ["Pomyliłeś się. Dobrze. Ja też się czasem mylę. Rzadko."])], 1)), []], 1);
        }
        return null;
    }
    function hook(key, ev) {
        if (!has()) return null;
        if (key === "janek") return janekTalk(ev);
        if (key === "przemytnik") return rochTalk(ev);
        if (key === "celnik") return celnikTalk(ev);
        return null;
    }
    function hookTalk() {
        const L = TL();
        if (L && L.addTalkHook && !hookTalk.done) { hookTalk.done = true; L.addTalkHook((key, ev) => { try { return hook(key, ev); } catch (e) { console.error("[Przystan]", e); return null; } }, true); }
    }
    hookTalk();

    // the ferryman and the people off the ferry (injected events): Przystan.talk(this, "ferry" | "refugee")
    function talk(interp, who) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev || (ev._przystan && ev._przystan.hidden)) return;
        const out = [];
        if (who === "ferry") {
            const spk = { id: ev.eventId(), name: "Przewoźnik promu" }, f = flags();
            if (atStep("W10", 1) && f.w10Prom && day() >= S().letterDay + 3) {
                linesTo(out, spk, TX.ferryNews);
                if (count(ITEM.scarf) > 0) linesTo(out, spk, TX.ferryNewsScarf);
                act(out, ["ferryNews"]);
            } else {
                linesTo(out, spk, TX.ferry);
                if (atStep("W10", 0)) choiceTo(out, ["Weź list do mojej matki (" + LETTER_FERRY + " G).", "Nie, dziękuję."],
                    [act([], ["w10Ferry"]).concat(linesTo([], spk, TX.ferryLetter)), []], 1);
            }
        } else {
            const spk = { id: ev.eventId(), name: ev.event().name };
            linesTo(out, spk, TX.refugees[(ev.eventId() + day()) % TX.refugees.length]);
        }
        if (out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
    }

    // the script calls from the talks
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a, b] = args, f = flags();
        const stop = () => { if (interp && interp._list) interp._index = interp._list.length; };
        try {
            if (what === "janekMet") {
                if (!f.janekMet) {
                    setFlag("janekMet");
                    if (count(ITEM.scarf) < 1 && item(ITEM.scarf)) $gameParty.gainItem(item(ITEM.scarf), 1);
                    T.popup("Chusta matki", { top: true, color: "#ffd23f", sub: "Morze oddało ją razem z tobołkiem. Pamiątka." });
                    note("Chusta matki", "Rybak Janek znalazł mnie na plaży i zaniósł do dziadka. Dwa dni później morze wyrzuciło mój tobołek: została tylko chusta mamy, haftowana w czerwone kwiaty.");
                }
            } else if (what === "rochMet") {
                if (!f.rochMet) {
                    setFlag("rochMet");
                    note("Przemytnik żyje", "Przemytnik, który przewiózł mnie kutrem, przeżył sztorm. Na przystani mówią na niego Roch. Kazał schować wisiorek: na lądzie Czarne Oczy szukają kamieni z krukiem, a na wyspie ktoś je skupuje.");
                }
            } else if (what === "celnikMet") {
                S().celnikMet = day();
            } else if (what === "janekBetrayTold") {
                S().janekBetrayTold = day();
            } else if (what === "sell") {
                let gold = 0;
                for (const id of [ITEM.herring, ITEM.cod, ITEM.fish]) {
                    const n = count(id);
                    if (n > 0) { $gameParty.loseItem(item(id), n, false); gold += n * SELL[id]; }
                }
                if (gold > 0) { $gameParty.gainGold(gold); S().sold += gold; T.popup("+" + gold + " G", { icon: COIN_ICON, kind: "good" }); }
            } else if (what === "buySmoked") {
                if ($gameParty.gold() < BUY_SMOKED) { T.popup.need(COIN_ICON, "Potrzebujesz " + BUY_SMOKED + " G"); stop(); return; }
                $gameParty.loseGold(BUY_SMOKED);
                $gameParty.gainItem(item(ITEM.smokedFish), 1);
            } else if (what === "buy") {
                const g = GOODS.find(x => x[0] === a);
                if (!g) return;
                if ($gameParty.gold() < g[1]) { T.popup.need(COIN_ICON, "Potrzebujesz " + g[1] + " G"); stop(); return; }
                $gameParty.loseGold(g[1]);
                $gameParty.gainItem(item(g[0]), 1);
            } else if (what === "d20Help") {
                if (!f.d20Pomoc && atStep("D20", 6)) {
                    S().runDay0 = hour() < 6 ? day() - 1 : day();
                    setFlag("d20Pomoc");
                    note("Kuter wypłynął", "Zagadałem strażnika przy koksowniku, a Roch wypłynął nocą połatanym kutrem. Będzie pływał na ląd co kilka nocy i przywoził wieści - i towary.");
                }
            } else if (what === "d20Betray") {
                if (!f.d20Wydany && atStep("D20", 6)) {
                    $gameParty.gainGold(BETRAY_GOLD);
                    T.popup("+" + BETRAY_GOLD + " G", { icon: COIN_ICON, kind: "good" });
                    setFlag("d20Wydany");
                    const L = TL();
                    if (L && L.setGone) L.setGone("przemytnik", true);
                    note("Wydałem Rocha", "Doniosłem celnikowi na Rocha i jego kuter. Dostałem czterdzieści groszy. Wieczorem go zabrali - i kuter też.");
                }
            } else if (what === "rochNews") {
                S().newsGiven = Math.max(S().newsGiven, a || 0);
                if (b && f.w10Kuter && atStep("W10", 1)) newsOfMother("Roch przywiózł z lądu");
                else S().newsN = (S().newsN || 0) + 1;
            } else if (what === "w10Kuter") {
                if (atStep("W10", 0)) { S().letterDay = day(); S().letterHour = hour(); setFlag("w10Kuter"); }
            } else if (what === "w10Ferry") {
                if (!atStep("W10", 0)) return;
                if ($gameParty.gold() < LETTER_FERRY) { T.popup.need(COIN_ICON, "Potrzebujesz " + LETTER_FERRY + " G"); stop(); return; }
                $gameParty.loseGold(LETTER_FERRY);
                S().letterDay = day(); S().letterHour = hour();
                setFlag("w10Prom");
            } else if (what === "ferryNews") {
                if (atStep("W10", 1)) newsOfMother("Przewoźnik promu przywiózł");
            }
        } catch (e) { console.error("[Przystan] act " + JSON.stringify(args), e); }
    }
    function newsOfMother(who) {
        if (flags().w10Wiesc) return;
        setFlag("w10Wiesc");
        note("Wieści o mamie", who + " wieści z lądu: Brzozowa Wola spalona. W obozie za rzeką widziano kobietę w chuście w czerwone kwiaty - pytała o chłopca z krukiem. Poszła z taborem na północ, za wojskiem.");
    }

    // ------------------------------------------------------------------
    // TownQuests' handlers (its FX table is open: TownQuests.FX)
    // ------------------------------------------------------------------
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        q.FX.k47Rod = { pick() {
            if (count(ITEM.rod) > 0) { T.popup("Przecież masz wędkę", { icon: item(ITEM.rod).iconIndex, color: "#ffe9a8" }); return; }
            $gameParty.gainItem(item(ITEM.rod), 1);
        } };
        q.FX.d20Noc = { check: () => !!(flags().d20Pomoc || flags().d20Wydany) };
        q.FX.w10Wyslany = { check: () => !!(flags().w10Prom || flags().w10Kuter) };
        q.FX.w10Wiesc = { check: () => !!flags().w10Wiesc };
    }
    hookQuests();

    // TownLife's conditions by name (a plan entry may name them too)
    (() => {
        const L = TL();
        if (L && L.addCondition) {
            L.addCondition("promDzis", () => ferryNow());
            L.addCondition("kuterRejs", () => kuterAway());
        }
    })();

    // ------------------------------------------------------------------
    // The ferryman and the people off the ferry (ids 760-779, Map125) - there only while the ferry is (Przystan's update)
    // ------------------------------------------------------------------
    const PEOPLE = [
        { id: 760, name: "Przewoźnik promu", sheet: "$Npc_Kopacz", x: 11, y: 17, d: 2, who: "ferry", show: () => ferryNow() },
        { id: 761, name: "Człowiek z promu", sheet: "$Npc_Bogdan", x: 15, y: 16, d: 6, who: "refugee", show: () => waveNow() },
        { id: 762, name: "Kobieta z promu", sheet: "$Npc_Halina", x: 16, y: 16, d: 4, who: "refugee", show: () => waveNow() }
    ];
    function personData(p) {
        const page = {
            conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
                          switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
            directionFix: false, image: { tileId: 0, characterName: p.sheet, direction: p.d, pattern: 1, characterIndex: 0 },
            list: [C(355, ["Przystan.talk(this, " + JSON.stringify(p.who) + ");"]), C(0, [])],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true
        };
        return { id: p.id, name: p.name, note: "<Przystan:" + p.who + ">", pages: [page], x: p.x, y: p.y };
    }
    T.inject(MAP, { ids: IDS, owner: PLUGIN, build: () => PEOPLE.map(personData) });

    // ------------------------------------------------------------------
    // What is shown on the harbour: the ferry, Janek's boat, the cutter, the people of the ferry
    // ------------------------------------------------------------------
    let cache = null, tick = 0;
    function byName() {
        if (cache && cache.map === $gameMap.mapId() && cache.events === $gameMap._events) return cache.ev;
        const ev = {};
        for (const e of $gameMap.events()) { const n = e.event() && e.event().name; if (n) (ev[n] || (ev[n] = [])).push(e); }
        cache = { map: $gameMap.mapId(), events: $gameMap._events, ev };
        return ev;
    }
    function setShown(e, on) {
        if (!e) return;
        const st = e._przystan || (e._przystan = { prio: e._priorityType, through: e._through });
        if (on) {
            if (e._przystan.hidden === false) return;
            e.setTransparent(false); e.setThrough(st.through); e._priorityType = st.prio; st.hidden = false;
        } else {
            if (e._przystan.hidden === true) return;
            e.setTransparent(true); e.setThrough(true); e._priorityType = 0; st.hidden = true;
        }
    }
    function janekAtSea() {
        const L = TL(), r = resident("janek");
        if (!L || !L.entryAt || !r) return false;
        const e = L.entryAt(r, $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : hour());
        return e.act === "inside" && e.where === "na_morze";
    }
    function sync() {
        if (!has() || !$gameMap || $gameMap.mapId() !== MAP) return;
        const ev = byName(), k = kuterState(), away = kuterAway();
        const show = (name, on) => (ev[name] || []).forEach(e => setShown(e, on));
        show("Prom", ferryNow());
        show("Łódź Janka", !janekAtSea());
        show("Kuter: wrak na plaży", k === "beach");
        show("Kuter: na pochylni", k === "slip");
        // (on a run night the cutter goes once Roch is aboard: he walks to it and is gone - then it sails)
        const L = TL(), roch = L && L.eventOf ? L.eventOf("przemytnik") : null, aboard = !roch || !!(roch._town && roch._town.hidden);
        show("Kuter: na wodzie", k === "water" && !(away && aboard));
        for (const p of PEOPLE) setShown($gameMap.event(p.id), p.show());
    }
    // a thing hidden (the ferry on other days, the cutter that is elsewhere, the ferryman away) never starts
    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        if (this._przystan && this._przystan.hidden) return;
        _Game_Event_start.call(this);
    };
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        cache = null;
        hookQuests();
        hookTalk();
        if (this.mapId() === MAP) sync();
    };
    T.onMapUpdate(() => { if (++tick % 30 === 0) sync(); }, { owner: PLUGIN, name: "harbour" });

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, ITEM, IDS, SELL, GOODS, RUN_EVERY, state: () => S(), flags, act: actCall, talk, ferryToday, ferryNow, waveNow, kuterState, kuterAway,
        runNight, lastRunBack, rochGone, fishBonus, sync, janekAtSea, TX
    };
    window.Przystan = T.register(PLUGIN, api);
})();
