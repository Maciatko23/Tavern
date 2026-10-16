//=============================================================================
// Latarnia_Data.js
//=============================================================================
// PAKIET C (docs/miejsca_wyspy/PAKIETY.md, koncepcja docs/miejsca_wyspy/KONCEPCJA.md punkt 5, zatwierdzona 2026-10-16) - the data of
// "Przylądek z latarnią" (Map159), "Izba latarnika" (Map160) and "Laterna" (Map161): the keeper Bazyli Krzesiwo, the sea fog at
// night, the lens (the Order's "Oko Strażnicy" ground from a crystal of the First - NOT a shard of the Heart) and its visions.
// Only data and texts - the engine is Latarnia.js.
//   - window.TownLifeExtra: the resident "latarnik" (fixed id 943) living on Map159 - asleep in his room by day, chopping wood in the
//     afternoon, up in the lantern room from dusk to dawn (the engine moves the hours of his plan with the sun: Sky.sunTimes); where
//     he is shown indoors (Map160 / Map161) is a GETTER in TownLifeData.SPOTS_BY_MAP - he stands only in the room his plan has him in
//   - window.TownQuestsPacks: K49 "Tran dla latarni", D22 "Księga mgieł", W11 "Soczewka", the things carried (the lens), remarks
//   - window.LatarniaData: the fog, the fuel, the visions, the raid, his own talk, the epilogue lines (for the integration)
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): the sea here is salt and red (<Water:salt>); nothing here gives the hero water. The lighthouse does NOT
// delay the ferry (the user's decision 14).

/*:
 * @target MZ
 * @plugindesc [pakiet C] Dane: przylądek z latarnią (mapy 159-161), latarnik Bazyli, mgła morska, soczewka i wizje, K49, D22, W11. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * Pakiet C - dane miejsca (silnik: Latarnia.js).
 * Mieszkaniec: latarnik Bazyli Krzesiwo (numer 943) na mapach 159-161.
 * Zadania: K49 „Tran dla latarni”, D22 „Księga mgieł”, W11 „Soczewka”.
 * Numery zdarzeń 630-639. Test: tests/latarnia_test.js (port 9503).
 */

(() => {
    "use strict";

    const MAP = 159, IZBA = 160, LATERNA = 161;
    const ITEM = { tran: 177, wood: 61, charcoal: 79, pendant: 172, rope: 0, herring: 173, cod: 174, tar: 176 };
    const L = () => window.Latarnia || null;

    // ------------------------------------------------------------------ the resident: Bazyli Krzesiwo
    // Plan (KONCEPCJA 5): dawn-8 puts the fire out and writes in the Book of Fogs (the lantern room, then his room), 8-15 asleep in his
    // room (away: the door bolted), 15-17 chops wood and carries fuel, 17-dusk eats and cleans the lens (his room), dusk-dawn by the
    // fire up in the lantern room (in a fog he rings the fog bell every hour - its rope runs down from the gallery). The hours of
    // dawn and dusk are the sun's of the day: Latarnia.js puts them into this same array each day (Sky.sunTimes).
    const PLAN = [[0, "inside", "laterna"], [6.4, "inside", "izba"], [8, "inside", "izba_sen"],
                  [15, "work", "drewutnia"], [17, "inside", "izba"], [20.3, "inside", "laterna"]];
    const RESIDENT = {
        key: "latarnik", id: 943, name: "Bazyli Krzesiwo", title: "latarnik", sheet: "$Npc_Latarnik", map: MAP, speed: 2,
        away: ["izba_sen"],
        plan: PLAN,
        barks: {
            work: ["Drewno na noc. Noc zawsze jest dłuższa, niż się myśli.", "(Bazyli rąbie równo, bez pośpiechu. Polano za polanem.)",
                "Tran śmierdzi, drewno dymi. Ogień nie wybiera."],
            stand: ["(Bazyli patrzy w morze jednym okiem. Drugie, białe, patrzy gdzie indziej.)"],
            rain: ["Deszcz. W deszcz morze kłamie mniej niż we mgle."],
            night: ["Nie stój po ciemku pod wieżą. Statki patrzą w ogień, nie pod nogi."],
            home: ["(Bazyli pisze coś w grubej księdze. Pióro skrzypi.)", "Ogień trzeba karmić jak dziecko. Po trochu i często.",
                "(Bazyli przeciera soczewkę skórką. Długo. Bardzo długo.)", "(Bazyli dorzuca do kosza polano i patrzy, jak się zajmuje.)"]
        },
        talk: {
            morning: ["Noc minęła. Żaden statek nie poszedł na skały. Zapisane.", "O świcie gaszę ogień. Dzień świeci sam."],
            day: ["Za dnia śpię. Jak sowa. Tylko mniej mądry.", "Drewno, tran, węgiel. Ogień nie pyta, skąd."],
            evening: ["Zaraz zmierzch. Trzeba wejść na górę.", "Soczewkę czyszczę co wieczór. Kurz to też mgła, tylko mała."],
            night: ["Nie gadaj tyle. Patrz na morze.", "Tam, gdzie ogień nie sięga, zaczyna się to, czego nie ma na żadnej mapie."],
            rain: ["W deszcz ogień widać na pół mili. We mgle - na rzut kamieniem. Dlatego dzwon."]
        }
    };
    (window.TownLifeExtra = window.TownLifeExtra || []).push(RESIDENT);
    // where he stands: the map's "Miejsce:" events win on Map159 (tools/latarnia/build.py puts them there); indoors only the room his
    // plan has him in now (a getter: TownLife reads it when the map loads - then always there, the engine decides who is shown - and
    // every frame indoors)
    const INDOOR = { 160: { place: "izba", at: [5, 7, 8] }, 161: { place: "laterna", at: [6, 5, 4] } };
    const TLD = window.TownLifeData;
    if (TLD && TLD.SPOTS_BY_MAP) {
        TLD.SPOTS_BY_MAP[MAP] = Object.assign({ laterna: [22, 10, 8], izba: [15, 19, 8], izba_sen: [15, 19, 8], drewutnia: [25, 19, 6] },
            TLD.SPOTS_BY_MAP[MAP] || {});
        for (const [mid, o] of Object.entries(INDOOR)) {
            const spots = TLD.SPOTS_BY_MAP[mid] = TLD.SPOTS_BY_MAP[mid] || {};
            Object.defineProperty(spots, "latarnik_wnetrze", { enumerable: true, configurable: true,
                get() { const l = L(); return l && l.indoorSpot ? l.indoorSpot(Number(mid)) : o.at; } });
        }
    }

    // ------------------------------------------------------------------ the fuel of the lighthouse (nights of fire)
    const FUEL = {
        start: 7, max: 20, perNight: 1,
        ferry: 4, ferryUntil: 24,          // (the ferry brings oil until the second wave - day 24: then war, the army takes all that burns)
        chop: 0.25,                        // (Bazyli's own driftwood, a day)
        value: { 177: 1, 79: 0.5, 61: 0.25 },
        price: { 177: 6, 79: 4, 61: 2 },
        sellMax: 10                        // (of each kind a day)
    };
    const FOG = { at: 0.6 };               // Sky.mistOfDay(the next morning) >= 0.6: the sea fog comes in at night

    // ------------------------------------------------------------------ the visions in the lens (D22): one a night, in a fog
    // pic: img/pictures/<pic>.png (PixelLab, tools/latarnia/art/build_art.py); line: the one sentence on the white board; note: the
    // journal's chapter of "Księga mgieł"; flag: set when seen (TownQuests flags: "mgla" is the contract's - Wrak.js W12 reads it)
    const VISIONS = [
        { n: 1, pic: "Latarnia_Wizja_1", title: "Statek bez bandery", flag: "latarniaWizja1",
            line: "Statek bez bandery przybija nocą. Nikt nie zapala na nim światła.",
            note: "W soczewce latarni: statek bez bandery i bez świateł wypływa z mgły i przybija nocą do kamienistego brzegu. Z łodzi wysiadają ludzie w kapturach, jedna przysłonięta latarnia. Bazyli nie powiedział, czy to już było, czy dopiero będzie." },
        { n: 2, pic: "Latarnia_Wizja_2", title: "Człowiek z piórem", flag: "mgla",
            line: "Człowiek z piórem stoi w czarnej wodzie i rysuje wyspę. Na nadgarstku ma białe oko.",
            note: "W soczewce latarni: chudy człowiek w długim płaszczu stoi po pas w czarnej wodzie i rysuje na karcie wybrzeże wyspy. Atrament kapie z pióra do wody. Na lewym nadgarstku ma wytatuowane białe, otwarte oko." },
        { n: 3, pic: "Latarnia_Wizja_3", title: "Kobieta nad rzeką", flag: "latarniaWizja3",
            line: "Kobieta w chuście w czerwone kwiaty ogląda się za siebie. Tabor idzie na północ.",
            note: "W soczewce latarni: kobieta w chuście w czerwone kwiaty stoi nad szeroką rzeką i ogląda się za siebie, a za nią długi tabor idzie na północ. Wyglądała jak mama. Tyle samo mówiły wieści z lądu: poszła z taborem na północ. Nic więcej szkło nie pokazało." }
    ];
    // "Ciężka głowa" the next morning: the cost of the stamina works (Survival.defineBuff) until noon; Hart ducha takes off a part of it
    const HEAVY = { key: "ciezkaGlowa", name: "Ciężka głowa", icon: 6, cost: 1.2, until: 12, power: 0.15 };

    // ------------------------------------------------------------------ W11: the raid on the lighthouse, the thieves
    const RAID = { after: 1, from: 0.5, until: 3, kinds: ["bandit", "knifer", "bandit"], inside: ["bandit", "knifer"], tag: "latarniaNapad",
        thieves: ["bandit", "bandit", "archer"], thievesTag: "latarniaZlodzieje", buyBack: 150, sale: 400 };

    // ------------------------------------------------------------------ Bazyli's own talk
    const TX = {
        meet: ["(Bazyli długo na ciebie patrzy. Jedno oko ma białe jak mleko.) Kruk na szyi.",
            "Widziałem go we mgle. Trzy noce temu. Na szyi chłopca, który wyszedł z morza.",
            "> ...Mnie? Trzy noce temu byłem jeszcze w gorączce u dziadka.",
            "Wiem. Zapisałem. (Bazyli stuka palcem w grubą księgę pod pachą.) Bazyli. Pilnuję ognia, żeby statki nie szły na skały. Czasem ogień pokazuje więcej, niż powinien.",
            "Jak przyniesiesz tranu, zapłacę. Jak będzie mgła, możesz wejść na górę. Ale tylko raz na noc. I nie pytaj mnie, co znaczy to, co zobaczysz."],
        meetNote: ["Latarnik z przylądka", "Na północno-wschodnim przylądku pilnuje ognia latarnik Bazyli Krzesiwo. Mówi, że trzy noce przed moim przebudzeniem widział we mgle kruka na szyi chłopca, który wyszedł z morza. Wszystko, co widzi w szkle latarni, zapisuje w Księdze mgieł."],
        ask: ["Hm.", "Mów.", "Słucham. Krótko, ogień czeka."],
        sell: ["Za drewno dwa grosze, za węgiel cztery, za tran sześć. Więcej nie dam, ale biorę zawsze."],
        sellNone: ["Nie masz nic, co się pali. Poza sobą."],
        sellDone: ["Ogień ci dziękuje. Ja też, tylko ciszej."],
        sellFull: ["Szopa pełna. Przynieś, jak ubędzie."],
        sellDay: ["Dziś już dość. Więcej nie zmieszczę w szopie."],
        weatherAgain: ["Już mówiłem dziś. Pogoda nie zmienia się od pytania."],
        weatherHead: "Jutro: {d1}. Pojutrze: {d2}.",
        book: ["„Noc spokojna. Morze czerwone aż po widnokrąg. Śnięte ryby na kamieniach.” Tyle dziś.",
            "„Kuter bez latarni minął cypel o drugiej. Nie mój interes.” Tak piszę. Krótko.",
            "Księga mgieł ma sto lat. Pisał ją latarnik przede mną i ten przed nim. Wszystko, co widzieli w szkle.",
            "Nie czytam ci, co tam jest. Czytają to ci, co przyjdą po mnie."],
        stock: "Opału na {n}.",
        stockNone: ["Nic. Dziś zgaśnie, jak nikt nie przyniesie."],
        stockFerry: ["Prom przywozi tran co tydzień. Póki przywozi."],
        stockWar: ["Prom już nie wozi tranu. Wojna. Jak nikt nie przyniesie, latarnia zgaśnie."],
        up: ["Drzwi na górę są otwarte. Tylko nie dotykaj ognia."],
        sleepyDay: ["(Bazyli przeciera twarz.) Śpię za dnia, chłopcze. Mów szybko."],
        mistComing: ["Dziś w nocy przyjdzie mgła. Czuję ją w kolanie i w tym oku, co nie widzi."],
        afterVision: ["Nie mów nic. Jeszcze nie.", "(Bazyli maczy pióro i coś zapisuje, nie patrząc na ciebie.)"],
        visionsDone: ["Szkło pokazało ci, co miało. Teraz pokazuje tylko twoją twarz."],
        // doors and things
        izbaAsleep: "Drzwi zaryglowane od środka. Zza nich słychać miarowe chrapanie.",
        towerDay: "Drzwi latarni zamknięte. Bazyli nosi klucz przy pasie.",
        towerNight: "Z góry dobiega głos Bazylego: „Nie teraz. Przyjdź z tranem albo we mgłę.”",
        towerMist: "Z góry woła Bazyli: „Wejdź. Mgła idzie.”",
        towerBroken: "Drzwi latarni wyważone. Zamek zwisa na jednym gwoździu.",
        edge: "Ścieżka na zachód urywa się nad osuwiskiem. Dalej nie przejdziesz.",
        slup: "Słup dawnej strażnicy zakonu. Na górze wykuty kruk z rozpostartymi skrzydłami - taki sam jak na twoim wisiorku.",
        slupNoPendant: "Słup dawnej strażnicy zakonu. Na górze wykuty kruk z rozpostartymi skrzydłami.",
        plyta: "Płyta posadzki dawnej strażnicy. Wyryty krąg i słowa: „Patrz, a nie pytaj”.",
        dzwon: "Dzwon mgłowy. Linka biegnie od jego serca aż na galerię latarni.",
        dzwonMist: "Dzwon mgłowy. Co godzinę, kiedy jest mgła, Bazyli ciągnie linkę z galerii.",
        drewno: "Drewutnia. Polana ułożone równo jak książki na półce.",
        beczki: "Beczki tranu. Zapas latarni: {n}.",
        beczkiNone: "Beczki tranu. Puste. Pachną tylko rybą.",
        lensDay: "Soczewka. Grube, zielonkawe szkło w mosiężnym pierścieniu. W dzień tylko szkło.",
        lensNoMist: "Soczewka. Za nią tylko ogień i noc nad morzem.",
        lensUsed: "Dziś już patrzyłeś. Szkło nie pokazuje dwa razy tej samej nocy.",
        lensNoQuest: ["(Bazyli kładzie dłoń na pierścieniu.) Najpierw pogadamy. Potem patrz."],
        lensNoBazyli: "Bez Bazylego nie dotykaj szkła.",
        lensGone: "Pusty pierścień. Ktoś wyważył soczewkę z oprawy.",
        lensBag: "Pusty pierścień. Soczewka jest w twojej torbie.",
        lensBroken: "Pęknięte szkło. Ogień przez nie świeci, ale mgła nic już w nim nie pokazuje.",
        lensSold: "Pusty pierścień. Soczewka płynie na ląd.",
        bookLook: "Księga mgieł. Gruba, oprawiona w skórę foczą. Pismo kilku rąk, coraz młodsze ku końcowi.",
        bookOwn: "Księga mgieł. Na ostatnich stronach twoje wizje, zapisane ręką Bazylego.",
        heavy: "Ciężka głowa",
        heavySub: "Po wizji: do południa prace kosztują więcej sił.",
        heavyResist: "Głowa lekka - Hart ducha",
        wreckEmpty: "Zatoczka szczątków. Nic nowego. Morze wyrzuca coś dopiero po sztormie.",
        wreckGot: "Morze wyrzuciło po sztormie",
        wreckEye: "Na desce rozbitej skrzyni wypalone oko - znak Czarnych Oczu.",
        bell: "Dzwon mgłowy",
        fireOut: "Latarnia nie świeci. Brak opału.",
        // Janek sells oil while K49 is on
        janekTran: ["Tran? Mam trochę z wątroby dorsza. Śmierdzi, ale się pali. Sześć groszy dzbanek."],
        janekTranBuy: ["Masz. Tylko nie rozlej w łodzi, bo mi ryby uciekną."],
        janekTranNone: ["Więcej nie mam. Wątroba dorsza to nie studnia."],
        // W11
        baltazar: ["Ach, przyjaciel! Ty bywasz na przylądku, prawda? U tego latarnika z bielmem.",
            "Mam kupca na lądzie, który płaci za stare szkła. Takie z latarni, w mosiężnym pierścieniu. Czterysta groszy, przyjacielu. Czterysta.",
            "Gdyby szkiełko... zginęło, nikt by nie płakał. Latarnia świeci ogniem, nie szkłem."],
        baltazarNo: ["> Nie sprzedam cudzego.", "Szkoda. Ktoś inny sprzeda. Zawsze ktoś sprzedaje."],
        baltazarMaybe: ["> Pomyślę.", "Myśl, przyjacielu. Tylko szybko. Mój kupiec nie lubi czekać."],
        warn: ["> Baltazar z kantoru chce kupić twoją soczewkę. Za czterysta.",
            "(Bazyli długo milczy.) Czterysta. Za szkło, w którym widać Serce przez łzy. Tanio.",
            "Przyjdą po nie. Widziałem to we mgle, tylko nie wiedziałem kiedy. Teraz wiem: jutro w nocy.",
            "Jak chcesz pomóc, czuwaj tu jutro w nocy. Po północy."],
        raidStart: "Ktoś wyważa drzwi latarni!",
        raidInside: "Na schodach kroki! Ktoś wbiegł na górę!",
        raidWin: "Latarnia obroniona",
        raidWinSub: "Soczewka została na miejscu.",
        raidLost: "Soczewka skradziona",
        raidLostSub: "Złodzieje czekają w zatoczce szczątków na łódź - tej nocy jeszcze tam będą.",
        bazyliRobbed: ["(Bazyli ma rozbitą wargę i siniak pod zdrowym okiem.) Przyszli we trzech. Wyważyli drzwi i wyrwali szkło z oprawy.",
            "Nie płyną od razu. Czekają na łódź w zatoczce, tam gdzie morze wyrzuca szczątki. Dziś w nocy jeszcze tam będą."],
        bazyliDefended: ["(Bazyli ociera krew z czoła.) Dobrze, że byłeś. Sam bym ich nie zatrzymał.",
            "Weź szkło do pustelnika na klifie. Kroniki znają je lepiej niż ja. I przynieś z powrotem."],
        bazyliGive: ["Weź szkło do pustelnika na klifie. Niech przeczyta w kronikach, czym jest. I przynieś z powrotem."],
        bazyliBagFirst: ["Masz je? Zanieś najpierw pustelnikowi. Potem pogadamy."],
        sack: "Worek złodziei. W środku, owinięta w szmatę - soczewka latarni.",
        sackGot: "Soczewka latarni",
        baltazarBack: ["Ach, szkiełko z latarni! Trafiło do mnie przez... pośrednika. Czysta uczciwość, przyjacielu.",
            "Dla ciebie - sto pięćdziesiąt groszy. Bo cię lubię."],
        baltazarBackYes: ["Interes to interes. Szkiełko twoje."],
        baltazarBackNo: ["Szkiełko poczeka. Mój kupiec - nie."],
        kleofas: ["> Bracie, to szkło z latarni na przylądku. Bazyli widzi w nim rzeczy we mgle.",
            "(Kleofas obraca soczewkę w palcach i długo patrzy przez nią na płomień świecy.) Zielonkawe. Ciężkie jak kamień. Takiego szkła nie robi żadna huta.",
            "(Kleofas wyjmuje najstarszą z kronik.) „Oko Strażnicy. Wyszlifowane z kryształu Pierwszych, z głębi, gdzie kamień świeci sam z siebie.”",
            "„We mgle odbija Serce jak przez łzy. Pokazuje, co Serce wie, ale nie odpowiada. Strażnica patrzyła przez nie na morze, żeby nikt nie przypłynął niezapowiedziany.”",
            "To nie jest kawałek Serca, chłopcze. Serce jest jedno. Ale ludzie na lądzie nie odróżniają odbicia od źródła. Dlatego płacą."],
        kleofasNote: ["Oko Strażnicy", "Brat Kleofas przeczytał w kronikach: soczewka latarni to „Oko Strażnicy”, wyszlifowane przez zakon z kryształu Pierwszych. We mgle odbija Serce jak przez łzy - pokazuje, co Serce wie, ale nie odpowiada. To nie odłamek Serca: Serce jest jedno."],
        bazyliReads: ["(Bazyli otwiera Księgę mgieł na pierwszej stronie, pisanej ręką kogoś bardzo starego.)",
            "„Oko Strażnicy. Szlifowane z kryształu Pierwszych. We mgle odbija Serce jak przez łzy. Nie odpowiada - pokazuje.”",
            "Tyle wiem od tego, co był przede mną. Pustelnik na klifie wiedziałby więcej, gdyby ktoś do niego doszedł."],
        choiceAsk: ["Teraz już wiesz, co to jest. Ja wiedziałem od dawna.", "Zrób, co trzeba. Ja tylko pilnuję ognia."],
        choiceLeave: ["> Zostaw je w latarni. Ty go pilnujesz najlepiej.",
            "(Bazyli wkłada soczewkę w pierścień i dokręca śruby.) Będzie świecić. I patrzeć. Ja też."],
        choiceBreak: ["> Rozbij je. Nikt więcej po nie nie przyjdzie.",
            "(Bazyli waży soczewkę w dłoni, potem uderza nią o kamienny parapet. Szkło pęka z dźwiękiem jak dzwon.)",
            "Latarnia będzie świecić dalej. Ogień nie potrzebuje oka. Tylko ja już nic nie zobaczę we mgle.",
            "(Wkłada pęknięte szkło z powrotem w pierścień.) Niech zostanie. Na pamiątkę."],
        choiceSell: ["> Sprzedam je Baltazarowi.",
            "(Bazyli patrzy na ciebie zdrowym okiem.) Twoja wola. Ja i tak widziałem dość.",
            "Tylko pamiętaj: kto kupuje szkło, chce widzieć, co ono widzi. Czarne Oczy będą wiedziały jedną noc więcej niż my."],
        sold: ["Ach! Szkiełko! (Baltazar ogląda soczewkę pod światło.) Piękne. Czterysta, jak mówiłem. Słowo kupca.",
            "Mój kupiec się ucieszy. A ty... ty niczego nie widziałeś, przyjacielu."],
        soldNote: ["Soczewka sprzedana", "Sprzedałem Oko Strażnicy Baltazarowi za czterysta groszy. Płynie na ląd. Bazyli mówi, że Czarne Oczy będą wiedziały jedną noc więcej niż my."],
        leaveNote: ["Oko Strażnicy zostaje", "Soczewka wróciła do latarni na przylądku. Bazyli jej pilnuje - i dalej patrzy przez nią we mgle."],
        breakNote: ["Oko Strażnicy rozbite", "Bazyli rozbił soczewkę o parapet. Latarnia świeci dalej, ale we mgle nikt już nic w niej nie zobaczy."]
    };

    // ------------------------------------------------------------------ the quests (TownQuests packs - docs/QUESTY_STAN.md "Jak dopisać")
    const K49 = {
        id: "K49", kind: "K", title: "Tran dla latarni", giver: "latarnik", icon: 176, where: "przylądek z latarnią", when: "od dnia 24",
        desc: "Od drugiej fali prom nie przywozi tranu. Bazylemu kończy się opał - bez niego latarnia zgaśnie, a statki pójdą na skały.",
        offer: {
            cond: { day: 24, flags: ["latarnikMet"] },
            say: ["Słuchaj. Od drugiej fali prom nie przywozi tranu. Wojsko bierze wszystko, co się pali.",
                "Opału mam na kilka nocy. Potem latarnia zgaśnie, a statki pójdą na skały. Albo przypłyną tam, gdzie nie powinny.",
                "Przynieś mi cztery dzbanki tranu i sześć polan. Tran wytopisz z ryb w kociołku - trzy ryby na dzbanek. Albo kup od Janka na przystani."],
            yes: "Przyniosę.", no: "Nie teraz.",
            accept: ["Ryby, kociołek, ogień. Smród na pół wyspy, ale się pali."],
            decline: ["To będę palił krzesłami."]
        },
        steps: [
            { type: "bring", to: "latarnik", need: [[177, 4], [61, 6]], fx: "k49Paliwo",
                text: "Przynieś Bazylemu 4× Tran i 6× Drewno (przylądek z latarnią). Tran: 3 surowe ryby w kociołku albo od Janka na przystani (6 G).",
                remind: ["Cztery dzbanki tranu i sześć polan. Ogień nie czeka."],
                hero: ["> Masz. Tran i drewno."],
                done: ["(Bazyli wącha tran, kiwa głową i niesie dzbanki do beczek.)", "Dobry. Rybny, gęsty. Tydzień nocy z głowy.",
                    "Masz. I... drzwi latarni są dla ciebie otwarte. Nocą też. Tylko nie dotykaj ognia."] }
        ],
        reward: { gold: 30, xp: 60, flag: "latarniaUfa",
            note: ["Tran dla latarni", "Przyniosłem Bazylemu tran i drewno. Latarnia na przylądku świeci dalej, a drzwi do laterny są dla mnie otwarte."] }
    };
    const D22 = {
        id: "D22", kind: "D", title: "Księga mgieł", giver: "latarnik", icon: 189, where: "laterna na przylądku, mgliste noce", when: "po pierwszej rozmowie z Bazylem",
        desc: "We mgle soczewka latarni pokazuje rzeczy, których nikt nie powinien wiedzieć. Bazyli wszystko zapisuje w Księdze mgieł.",
        offer: {
            cond: { flags: ["latarnikMet"], fn: "d22Ready" },
            say: ["Dziś w nocy przyjdzie mgła. Czuję ją w kolanie i w tym oku, co nie widzi.",
                "Jak przyjdzie, wejdź na górę. Spójrz w szkło. Raz. Potem nic nie mów.",
                "Trzy mgły. Trzy razy. Wtedy pogadamy."],
            yes: "Przyjdę.", no: "Nie dziś.",
            accept: ["Tylko raz na noc. Szkło nie lubi chciwych."],
            decline: ["Mgła wróci. Zawsze wraca."]
        },
        steps: [
            { type: "custom", check: "d22Wizje", vars: "d22Wizje",
                text: "W mgliste noce spójrz w soczewkę latarni (laterna na szczycie wieży, nocą we mgle, raz na noc). Wizje: {n}/3.{kiedy}" },
            { type: "custom", talk: "d22Koniec", text: "Bazyli pyta, co widziałeś. Powiedz mu - albo zachowaj to dla siebie." }
        ],
        reward: { gold: 60, xp: 120, flag: "kronikaKarta5",
            note: ["Księga mgieł", "Trzy mgliste noce przy soczewce latarni. Bazyli dał mi kartę, którą dawny latarnik przepisał do Księgi mgieł z kroniki zakonu - pisaną szyfrem."] }
    };
    const W11 = {
        id: "W11", kind: "W", title: "Soczewka", giver: null, icon: 0, where: "kantor Baltazara, przylądek z latarnią, pustelnia na klifie",
        when: "Akt II", desc: "Ktoś na lądzie płaci za „szkiełko z latarni”. Soczewka Bazylego to nie zwykłe szkło.",
        autoStart: "w11Auto",
        steps: [
            { ch: 1, type: "custom", talk: "w11Oferta", text: "Baltazar Vey pyta o „szkiełko z latarni”. Porozmawiaj z nim w kantorze (8–18)." },
            { ch: 2, type: "custom", talk: "w11Ostrzez", text: "Baltazar chce kupić soczewkę latarni za 400 G. Ostrzeż Bazylego (przylądek)." },
            { ch: 3, type: "custom", vars: "w11Vars", text: "Ktoś przyjdzie po soczewkę. Czuwaj przy latarni w nocy z dnia {d} na {d1} - po północy." },
            { ch: 4, type: "custom", talk: "w11Odkup", vars: "w11Vars", text: "Soczewkę skradziono. {gdzie}" },
            { ch: 5, type: "custom", talk: "w11Kleofas", vars: "w11Vars", text: "{kto}" },
            { ch: 6, type: "custom", talk: "w11Wybor", text: "Wiesz, czym jest Oko Strażnicy. Zdecyduj u Bazylego: zostawić soczewkę w latarni, rozbić ją albo sprzedać Baltazarowi." },
            { ch: 7, type: "custom", talk: "w11Sprzedaz", text: "Zanieś soczewkę Baltazarowi (kantor, 8–18) - 400 G." }
        ]
    };
    const VITEMS = {
        soczewka: { name: "Soczewka latarni (Oko Strażnicy)", icon: 176 }
    };
    const REMARKS = [
        { id: "latJanekOgien", who: "janek", flag: "latarniaZgasla", lines: ["Latarnia na przylądku zgasła tej nocy. Pierwszy raz, odkąd pamiętam. Rybacy mówią, że to zły znak. Ja mówię, że brak tranu."] },
        { id: "latCelnik", who: "celnik", flag: "latarnikMet", lines: ["Latarnik z przylądka? Zapisuje wszystko w swojej księdze. Nawet więcej niż ja. Tylko jego księgi nikt nie sprawdza."] },
        { id: "latRoch", who: "przemytnik", flag: "latarniaUfa", lines: ["Bazyli dalej pali? To dobrze. Bez jego ognia pół zatoki to same skały. Nawet przemytnik woli widzieć, gdzie umiera."] },
        { id: "latKleofas", who: "pustelnik", flag: "latarniaObroniona", lines: ["Słyszałem, że ktoś napadł na latarnię. Kroniki piszą, że po Oko przychodzili zawsze nocą. I zawsze odchodzili z pustymi rękami. Do teraz."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({
        owner: "Latarnia", quests: [K49, D22, W11], vitems: VITEMS, remarks: REMARKS,
        gossip: { latarnik: ["Chleb? Dziękuję. Zjem o świcie, jak zgaszę ogień. Przy ogniu nie jem - okruchy na soczewce."] }
    });

    // ------------------------------------------------------------------ the epilogue (floor 100, Underground_Data.js - the integration
    // puts these lines in; one sentence each, by the ending and by what became of the lens)
    const EPILOG = {
        zniszczenie: "Latarnia na przylądku świeci dalej, ale soczewka ślepnie: we mgle Bazyli widzi już tylko mgłę.",
        zasady: "Bazyli widzi w soczewce tylko w Noc Pytania - raz w roku, jak każe reguła zakonu.",
        rozbita: "Bazyli pali ogień w latarni za pękniętym szkłem i nigdy już nie zagląda w mgłę.",
        sprzedana: "Pusty pierścień w laternie przypomina Bazylemu, że Czarne Oczy wiedziały o jedną noc więcej.",
        zgasla: "Latarnia na przylądku zgasła na dobre. Rybacy wracają przed zmierzchem."
    };

    window.LatarniaData = { MAP, IZBA, LATERNA, ITEM, IDS: [630, 639], OWNER: "Latarnia", PLAN, RESIDENT, INDOOR, FUEL, FOG, VISIONS, HEAVY,
        RAID, TX, K49, D22, W11, VITEMS, REMARKS, EPILOG,
        // the lighthouse's fire on the tower's picture (tools/latarnia/art/art.json: px right of / above the middle of its foot)
        FIRE: { x: 2, y: 177, w: 12 }, TOWER: [22, 9], IZBA_DOOR: [15, 18], LANDING: { 160: [6, 8], 161: [5, 7] },
        // the beams seen from afar at night on the maps around: from beyond the right edge of the screen, sy = its height (a share)
        FAR: { 13: { side: "right", sy: 0.2 }, 157: { side: "right", sy: 0.3 } } };
})();
