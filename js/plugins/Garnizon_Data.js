//=============================================================================
// Garnizon_Data.js
//=============================================================================
// PAKIET D (docs/miejsca_wyspy/PAKIETY.md) - the data of: Garnizon nad zatoką (mapy 162, 163). The royal army of the mainland (the
// white banner with the phoenix), quartered on the island by the Lord's leave - he pays the Crown a war tax and so presses grandpa's
// debt. Here only data; the engine is Garnizon.js (below every system of the game).
//   - the residents (TownLife, fixed ids 945-947) -> window.TownLifeExtra: rotmistrz Florian Bełza, kwatermistrz Pafnucy Kłos (the
//     nights after a ferry day 23-1 at the kantor's back door on Map008 - "alt"), werbownik Szczepan Bęben (the days after the waves
//     on the town's market - "alt"); their places on Map162/163 are the maps' "Miejsce:" events, two more on Map008 (garnizon_*)
//   - the quests (TownQuests) -> window.TownQuestsPacks: K52 "Drewno dla garnizonu", D26 "Lista poborowa", D27 "Zboże dla obozu"
//     (their own steps: TownQuests.FX from Garnizon.js), the sacks of grain (v:worek_zboza), the residents' remarks after them
//   - window.GarnizonData: the military buying (prices, the wave and hunger multipliers), the favour's thresholds, the soldiers'
//     plans (events 640-669), the sandbar, the texts
// Event ids 640-669 (TawernaCore registry, owner "Garnizon"): 640-655 Map162 (the soldiers, the recruits), 656-659 Map008 (the
// recruiter's list on the market, the search), 660-663 Map111 (the search after D26 b).

/*:
 * @target MZ
 * @plugindesc [pakiet D] Dane: Garnizon nad zatoką (mapy 162, 163) - rotmistrz, kwatermistrz, werbownik, żołnierze, skup wojskowy, przychylność, zadania K52, D26, D27. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * ============================================================================
 * Garnizon_Data.js - dane garnizonu nad zatoką (pakiet D)
 * ============================================================================
 * Tylko dane. Silnik: Garnizon.js. Zasady: docs/miejsca_wyspy/PAKIETY.md.
 * Mieszkańcy: rotmistrz 945, kwatermistrz 946, werbownik 947.
 * Zadania: K52 „Drewno dla garnizonu”, D26 „Lista poborowa”, D27 „Zboże dla
 * obozu”. Numery zdarzeń: 640-669. Test: tests/garnizon_test.js (port 9504).
 * Woda: żadnej. Beczki „z wodą z promu” są pod strażą (tylko dymek).
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = 162, QUARTERS = 163, TOWN = 8, PODGRODZIE = 111;
    const WAVES = [10, 24, 38, 52];                 // the ferry's waves of people (TownQuests' calendar, Przystan.js)
    const RECRUIT_DAYS = WAVES.map(d => d + 1);      // the recruiter on the town's market the day after each wave

    // ------------------------------------------------------------------ the residents (TownLife, fixed ids)
    const RESIDENTS = [
        {
            // Florian Bełza, about 50, grey moustache, the phoenix on his tabard, a sabre, limps on the left leg; stern, just, tired of
            // the war; keeps the list of the missing. 6-7 drill, 7-12 the office (Map163), 12-13 the kitchen, 13-16 the round (the gate,
            // the shore, the pier, the tower), 16-20 the office, 20-22 by the fire, 22-6 asleep
            key: "rotmistrz", id: 945, name: "Rotmistrz Bełza", title: "rotmistrz chorągwi królewskiej", sheet: "$Npc_Rotmistrz", map: MAP, speed: 2,
            away: ["spi"],
            plan: [[0, "inside", "spi"], [6, "stand", "musztra"], [7, "inside", "kwatera_drzwi"], [12, "stand", "kuchnia"],
                   [13, "patrol", ["brama_wew", "brzeg", "pomost", "brzeg", "brama_wew", "wieza"]], [16, "inside", "kwatera_drzwi"],
                   [20, "stand", "ognisko"], [22, "inside", "spi"]],
            barks: {
                stand: ["Wyżej tarcza! Wyżej, mówię! Wróg nie będzie czekał, aż się wyśpisz.", "Krok! Krok! Kto zgubi krok, ten zgubi głowę.",
                        "Zupa jak zupa. Na wojnie każda dobra."],
                patrol: ["Wartownik! Co na wodzie? ...Nic? To patrz dalej.", "Ta łacha w odpływie... Kto chce, przejdzie do wraku suchą nogą. Pilnować."],
                rain: ["Deszcz. Prochu i tak nie mamy, to nie zamoknie.", "Do namiotów, kto nie na warcie!"],
                night: ["Spać, spać. Pobudka o szóstej, jak zawsze."],
                home: ["(Rotmistrz pisze coś długo, potem przekreśla.)", "Czterdziestu ludzi... dwudziestu dwóch zaginionych... Pióro mi się kończy, nie atrament."]
            },
            talk: {
                morning: ["Musztra o szóstej. Chłopcy klną, a potem żyją. Tak to działa.", "Ranek. Wtedy morze jest najuczciwsze - widać, co płynie."],
                day: ["Lord wpuścił nas za pieniądze. Korona chce za to podatku wojennego. Ty płacisz, on płaci, ja pilnuję. Wojna kosztuje każdego.",
                      "Twój dziadek, Stach... Lord mu nie popuści. Nie przez złość. Przez nasz podatek. Przykro mi, chłopcze.",
                      "Z tej wieży widać wrak na mieliźnie. Czarne Oczy. Nie pytaj, czego szukali. Ja też nie wiem."],
                evening: ["Przy ogniu nie ma stopni. Siadaj, jak chcesz. Tylko nie pytaj o bitwy.", "Noga mi dokucza na zmianę pogody. Lewa. Pamiątka spod Brzozowej Woli."],
                night: ["Po nocy w garnizonie kręcą się tylko wartownicy i złodzieje. Którym jesteś?"],
                rain: ["Deszcz. Niech pada. Beczki pełne to spokojni żołnierze."]
            }
        },
        {
            // Pafnucy Kłos, the quartermaster: fat, ruddy, a ledger and an abacus, an apron over the tabard; merry and bribable - part
            // of the royal grain goes at night to Baltazar. 7-18 the granary and his table (the buying), 18-22 by the fire, asleep in
            // his tent; the nights after a ferry day 23-1 at the kantor's back door in the town (W5's "three knocks") - there he is an
            // event of Garnizon.js on Map008 (659), not a TownLife alt: an alt switching at night while the hero is in the town would
            // leave TownLife's resident without an event there
            key: "kwatermistrz", id: 946, name: "Kwatermistrz Kłos", title: "kwatermistrz garnizonu", sheet: "$Npc_Kwatermistrz", map: MAP, speed: 2,
            away: ["namiot_kwat"],
            plan: [[0, "inside", "namiot_kwat"], [7, "work", "spichlerz"], [9, "stand", "skup"], [12, "stand", "kuchnia"], [13, "stand", "skup"],
                   [16, "work", "spichlerz"], [18, "stand", "ognisko_2"], [22, "inside", "namiot_kwat"]],
            barks: {
                work: ["Worek, dwa worki, trzy worki... a w księdze dwa. Hm. Poprawię potem.", "Jęczmień z rekwizycji. Suchy, czysty, królewski."],
                stand: ["Skup! Kto ma ziemniaki, kapustę, mięso wędzone? Król płaci!", "Liczydło nie kłamie. Ja czasem, ono nigdy."],
                rain: ["Plandeka na worki! Szybciej, szybciej!"],
                night: ["(Kłos chrapie w namiocie.)"]
            },
            talk: {
                morning: ["Ranek, a ja już po trzech rachunkach. Dwa się zgadzają.", "Zboże z rekwizycji leży w spichlerzu. Na wojnę. Wszystko na wojnę."],
                day: ["Kupuję dla wojska: zboże, warzywa, mięso, skóry, drewno, węgiel. Uczciwie. No, prawie.",
                      "Po każdej fali z promu wojsko je jak smok. Wtedy płacę więcej. Półtora raza!"],
                evening: ["Przy ogniu każdy ma brzuch. Ja mam dwa razy większy, to i dwa razy głodny.", "Zupa? Z naszego zboża. Ludzie w mieście patrzą na nią jak na złoto."],
                night: ["Ciii. Nocą skup zamknięty. Chyba że... nie, zamknięty."],
                rain: ["W deszcz worki gniją. A za zgniłe worki rotmistrz mnie zgnoi."]
            }
        },
        {
            // Szczepan Bęben, the recruiter, about 30: a hat with a feather, a drum at his belt, a loud voice ("Za króla, chłopcy!").
            // At his table before the gate 8-16; the day after each wave (11, 25, 39, 53) on the town's market 8:30-14:30
            key: "werbownik", id: 947, name: "Werbownik Bęben", title: "werbownik chorągwi królewskiej", sheet: "$Npc_Werbownik", map: MAP, speed: 3,
            away: ["koszary_drzwi"],
            plan: [[0, "inside", "koszary_drzwi"], [7, "wander", "przed_brama"], [8, "stand", "stol_werbownika"], [12, "wander", "przed_brama"],
                   [13, "stand", "stol_werbownika"], [16, "wander", "musztra"], [19, "stand", "ognisko"], [22, "inside", "koszary_drzwi"]],
            alt: {
                map: TOWN, when: "garnizonRynek",
                plan: [[0, "inside", "brama_pld"], [8.5, "stand", "garnizon_werbownik"], [14.5, "inside", "brama_pld"]],
                barks: { stand: ["Za króla, chłopcy! Buty, żołd i chwała!", "Kto silny i zdrowy, do mnie! Wojsko nie gryzie!", "Trrrum-tum-tum! Lista otwarta!"] },
                talk: { day: ["Lista otwarta do drugiej! Buty, żołd, strawa. A ty jesteś za młody - przyjdź za rok, to zapiszę cię pierwszego."] }
            },
            barks: {
                stand: ["Za króla, chłopcy! Trrrum-tum-tum!", "Buty, żołd i chwała! Kto się zapisze?", "Ty! Ty tam! ...A, za młody. Szkoda."],
                wander: ["Trrrum-tum... Bęben się nazywam i bęben noszę. Przypadek? Nie sądzę."],
                rain: ["Bęben nie lubi deszczu. Ja też nie."],
                night: ["(Bęben pod pachą, ziewa.) Jutro znowu lista..."]
            },
            talk: {
                morning: ["Wcześnie wstajesz! Wojsko lubi takich. Szkoda, że za młody jesteś."],
                day: ["Lista poborowa, królewska pieczęć. Dzień po każdej fali z promu - rynek w miasteczku. Bęben, lista i dobre słowo.",
                      "Ludzie chowają się przede mną po stodołach. A ja im daję buty! Buty! Kto im dał buty przez całe życie?"],
                evening: ["Za króla, chłopcy... (ciszej) i za tych, co nie wrócili."],
                night: ["Śpij, chłopcze. Werbownik też czasem śpi."],
                rain: ["W deszcz nikt się nie zapisuje. Ludzie wolą suche nogi od chwały."]
            }
        }
    ];
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);

    // their places: on Map162/163 the maps' "Miejsce:" events (these are only the defaults); on Map008 (TownLife's town spots) two
    // more, prefixed - never one of the town's own keys
    const TL = window.TownLifeData;
    if (TL) {
        TL.SPOTS_BY_MAP = TL.SPOTS_BY_MAP || {};
        TL.SPOTS_BY_MAP[MAP] = Object.assign(TL.SPOTS_BY_MAP[MAP] || {}, {
            spi: [42, 18, 8], musztra: [30, 23, 2], kwatera_drzwi: [42, 18, 8], kuchnia: [38, 29, 6], brama_wew: [36, 12, 2], pomost: [14, 26, 4],
            wieza: [49, 17, 8], ognisko: [39, 31, 8], brzeg: [17, 22, 4], spichlerz: [46, 31, 8], skup: [33, 29, 2], namiot_kwat: [32, 32, 8],
            ognisko_2: [42, 31, 8], stol_werbownika: [30, 8, 2], koszary_drzwi: [29, 15, 8], przed_brama: [33, 10, 2]
        });
        TL.SPOTS_BY_MAP[QUARTERS] = Object.assign(TL.SPOTS_BY_MAP[QUARTERS] || {}, { rotmistrz_wnetrze: [6, 4, 2] });
        if (TL.SPOTS) {
            const add = { garnizon_werbownik: [24, 46, 2] };
            for (const [k, v] of Object.entries(add)) if (!TL.SPOTS[k]) TL.SPOTS[k] = v;
        }
    }

    // ------------------------------------------------------------------ the quests (TownQuests packs)
    const Q_K52 = {
        id: "K52", kind: "K", title: "Drewno dla garnizonu", giver: "kwatermistrz", icon: 61, where: "Garnizon nad zatoką: kuchnia polowa", when: "od dnia 5, 8-18",
        desc: "Kuchnia polowa garnizonu zjada drwa jak smok. Kwatermistrz Kłos potrzebuje drewna i węgla - a potem chętnie coś od ciebie kupi.",
        offer: {
            cond: { hours: [8, 18], day: 5, flags: ["garnizonPoznany"] },
            say: ["Ty jesteś ten od rotmistrza? Wnuk Stacha? To słuchaj. Kuchnia polowa zjada drwa jak smok, a moi chłopcy rąbać nie umieją, tylko ciąć.",
                  "Dziesięć polan drewna i cztery worki węgla drzewnego. Przyniesiesz, dostaniesz dwadzieścia groszy - i wpiszę cię do księgi skupu. Będziesz mi sprzedawał."],
            yes: "Przyniosę drewno i węgiel.", no: "Nie teraz.",
            accept: ["Dziesięć i cztery! Liczydło nie zapomni, ja też nie."], decline: ["Drwa poczekają. Zupa nie."]
        },
        steps: [
            { type: "bring", to: "kwatermistrz", need: [[61, 10], [79, 4]], hours: [7, 22], text: "Przynieś kwatermistrzowi Kłosowi 10× Drewno i 4× Węgiel drzewny (garnizon nad zatoką).",
              remind: ["Dziesięć polan i cztery worki węgla. Liczydło czeka."], hero: ["> Drewno i węgiel dla kuchni polowej."],
              done: ["O! Suche, równe, porządne. Rotmistrz się ucieszy, a ja jeszcze bardziej.",
                     "Masz dwadzieścia groszy. I od dziś jesteś w mojej księdze: przynoś zboże, warzywa, mięso, skóry - wojsko kupi."] }
        ],
        reward: { gold: 20, xp: 50, flag: "k52Skup",
            note: ["Skup wojskowy", "Kwatermistrz Kłos z garnizonu nad zatoką kupuje dla wojska zboże, warzywa, wędzone mięso i ryby, skóry, strzały, drewno i węgiel. Przez tydzień po każdej fali z promu płaci półtora raza więcej. Ale kiedy w mieście głód, ludzie patrzą krzywo na każdy worek, który idzie na wojnę."] },
        rewardFxNote: "przychylność garnizonu +20 (Garnizon.js: flag k52Skup)"
    };
    const Q_D26 = {
        id: "D26", kind: "D", title: "Lista poborowa", giver: "werbownik", icon: 0, where: "Rynek w miasteczku, Podgrodzie, garnizon", when: "dzień po fali z promu (11, 25, 39, 53), 8-16",
        desc: "Werbownik Bęben musi zabrać do wojska trzech ludzi z miasteczka i Podgrodzia. Na liście: Bartek Kmieć, Zbych Smolarz, Darin z Kontynentu (Rafała z obozu szuka już kto inny - W6). Pomóc, ostrzec - czy zanieść rotmistrzowi coś lepszego niż rekrutów?",
        offer: {
            cond: { hours: [8, 16], fn: "d26Dzien" },
            say: ["Ty! Chłopak od Stacha! Słuchaj, mam kłopot. Rotmistrz chce trzech ludzi z tej fali. Trzech! A wszyscy chowają się po stodołach.",
                  "Lista: Bartek Kmieć, Zbych Smolarz z Podgrodzia i ten Darin z kontynentu. Był jeszcze jeden z obozu pod murem, Rafał, ale tego szuka już kto inny. Znasz ich. Ciebie posłuchają. Dziesięć groszy za każdego, co się zgłosi."],
            options: [
                { label: "Pomogę ci.", then: "accept", flag: "d26Pomoc", say: ["Wiedziałem! Powiedz im: buty, żołd, strawa. I że nikt ich nie pośle na pierwszą linię. Pierwszy tydzień."] },
                { label: "Zobaczę, co da się zrobić.", then: "accept", say: ["Zobacz, zobacz. Tylko szybko - ja muszę mieć trzech."] },
                { label: "Nie będę łapał ludzi do wojska.", then: "decline", say: ["Łapał? Ja nikogo nie łapię. Zapraszam! ...Dobra, idź."] }
            ]
        },
        steps: [
            { type: "custom", talk: "d26Ludzie", check: "d26Ludzie", vars: "d26Ludzie", ch: 1,
              text: "Lista poborowa: {lista} - porozmawiaj z każdym (namów albo ostrzeż). Załatwione: {n}/3. Albo zanieś rotmistrzowi Dziennik okrętu z wraku: dowód, że od morza nic nie grozi." }
        ],
        reward: { xp: 60 },
        lines: {
            ask: "Werbownik cię szuka. Jesteś na liście.",
            help: "Zgłoś się sam. Buty, żołd, strawa - i lepiej z własnej woli niż w łańcuchu.",
            warn: "Schowaj się na dzień albo dwa. Werbownik nie będzie czekał wiecznie.",
            deal: "Panie rotmistrzu... mam coś lepszego niż trzech rekrutów."
        }
    };
    const Q_D27 = {
        id: "D27", kind: "D", title: "Zboże dla obozu", giver: "ludmila", icon: 74, where: "Obóz pod murem, garnizon (spichlerz, kwatermistrz)", when: "po rekwizycji zboża (D14), nocą",
        desc: "Obóz uchodźców głoduje. Ludmiła prosi o cztery worki zboża. Zboże jest - w spichlerzu garnizonu, z rekwizycji. Kupić nocą od kwatermistrza „po cenie dla swoich” albo wynieść ze spichlerza obok wartownika?",
        offer: {
            cond: { hours: [7, 20], fn: "d27Gotowe" },
            say: ["(Ludmiła trzyma Elę za rękę.) Trzeci dzień jemy korzonki. Dwór zabrał zboże z pól, a garnizon ma pełny spichlerz. Na wojnę, mówią.",
                  "Cztery worki. Tylko cztery, na zimę dla dzieci. Mówią, że ich kwatermistrz nocą sprzedaje zboże kupcowi z kantoru... Może tobie też sprzeda?"],
            yes: "Zdobędę cztery worki.", no: "Nie dam rady.",
            accept: ["Niech ci Bóg... (urywa) Dziękuję. Przyjdź do nas pod mur, jak będziesz miał."], decline: ["Rozumiem. Każdy ma swoje."]
        },
        steps: [
            { type: "custom", check: "d27Worki", vars: "d27Worki", ch: 1,
              text: "Zdobądź 4 worki zboża z garnizonu: kup je nocą od kwatermistrza Kłosa (20-2, „po cenie dla swoich”) albo wynieś ze spichlerza (nocą, obok wartownika - skradaj się). Masz: {n}/4." },
            { type: "bring", to: "ludmila", need: [["v:worek_zboza", 4]], hours: [6, 22], ch: 2, text: "Zanieś Ludmile 4 worki zboża (obóz pod murem w miasteczku).",
              remind: ["Cztery worki... Nie śmiem prosić o więcej."], hero: ["> Cztery worki zboża. Dla dzieci."],
              done: ["(Ludmiła długo patrzy na worki, potem na ciebie.) Ela, zobacz... Zboże. Prawdziwe zboże.",
                     "Nie zapomnimy ci tego. Cały obóz nie zapomni."], reward: { opinion: 5 } },
            { type: "custom", talk: "d27Klos", check: "d27Klos", ch: 3,
              text: "Kłos sprzedaje królewskie zboże. Wydaj go rotmistrzowi (garnizon) - albo idź do Kłosa i powiedz, że będziesz milczał." }
        ],
        reward: { xp: 80, flag: "d27Done" },
        lines: {
            accuse: ["> Panie rotmistrzu. Kwatermistrz Kłos nocą sprzedaje zboże z rekwizycji. Kupiłem od niego cztery worki - dla obozu.",
                     "(Rotmistrz długo milczy.) Kłos. Pafnucy Kłos. Dwadzieścia lat z nim w polu...",
                     "Dobrze, że powiedziałeś. Popłynie najbliższym promem - w łańcuchu. A ty... worki niech zostaną w obozie. Nie widziałem ich."],
            accuseStolen: ["> Panie rotmistrzu. Kwatermistrz sprzedaje nocą zboże z rekwizycji kupcowi z kantoru.",
                           "Dowód? ...Księga. Sprawdzę jego księgę. (Rotmistrz wstaje.) Jeśli to prawda, Kłos popłynie najbliższym promem."],
            silent: ["> Nikomu nie powiem o nocnym zbożu.",
                     "(Kłos ociera czoło.) Ty... ty jesteś złoty chłopak. Złoty! Od dziś w skupie masz ode mnie lepszą cenę. Jak dla swojego."],
            klosGone: ["(Na miejscu kwatermistrza stoi młody żołnierz z księgą.) Kłos? Popłynął. W łańcuchu. Skup prowadzi teraz rotmistrz - przez mnie."]
        }
    };

    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({
        owner: "Garnizon",
        quests: [Q_K52, Q_D26, Q_D27],
        vitems: {
            worek_zboza: { name: "Worek zboża z rekwizycji", icon: 74 },
            glejt_wrak: { name: "Glejt garnizonu na wrak", icon: 0 }
        },
        remarks: [
            { id: "garnizonKlosWydany", who: "kupiec", flag: "klosWydany", lines: ["Słyszałeś? Kwatermistrz garnizonu popłynął w łańcuchu. Taki porządny człowiek... (Baltazar uśmiecha się krzywo.) Ktoś będzie musiał go zastąpić. W interesach."] },
            { id: "garnizonD27Ludmila", who: "ludmila", flag: "d27Done", lines: ["Dzieci jedzą. Pierwszy raz od tygodnia nikt nie płakał w nocy. Dziękuję ci jeszcze raz."] },
            { id: "garnizonD26Soltys", who: "soltys", flag: "d26Ostrzezeni", lines: ["Wojsko przetrząsało Podgrodzie. Szukali ludzi z listy. Nie znaleźli... Dobrze. Ale ktoś ich ostrzegł, a ja nie chcę wiedzieć kto."] },
            { id: "garnizonD26Wzieci", who: "praczka", flag: "d26Wzieci", lines: ["Ludzi biorą do wojska. Wczoraj z listy, jutro kto? Kto będzie rąbał drwa dla całego Podgrodzia?"] },
            { id: "garnizonD26Beben", who: "werbownik", flag: "d26Wzieci", lines: ["Trrrum! Mam ludzi z listy! Rotmistrz zadowolony, a ja mam spokój do następnej fali. Dziękuję ci, chłopcze."] },
            { id: "garnizonD26BebenPusto", who: "werbownik", flag: "d26Ostrzezeni", lines: ["Ktoś ich ostrzegł. Ludzie z listy jakby się pod ziemię zapadli... (Bęben patrzy na ciebie długo.) Nie, ty byś nie... prawda?"] }
        ]
    });

    // ------------------------------------------------------------------ the military buying (Kłos; after K52)
    // [item id, price a piece]; "food" - selling it in the hungry week costs the town's opinion
    const BUY = [
        { id: 74, price: 6, food: true }, { id: 71, price: 7, food: true }, { id: 72, price: 6, food: true }, { id: 73, price: 13, food: true },
        { id: 105, price: 24, food: true }, { id: 106, price: 21, food: true }, { id: 96, price: 9 }, { id: 97, price: 22 },
        { id: 127, price: 3 }, { id: 61, price: 6 }, { id: 79, price: 8 }
    ];
    const BUY_WAVE = 1.5, BUY_WAVE_DAYS = 7;          // half again dearer for a week after each wave
    const BUY_FRIEND = 1.2;                           // Kłos owes the hero (D27: he kept quiet)
    const HUNGER_DAYS = 7;                            // after the requisition (D14) the town is hungry for a week

    // ------------------------------------------------------------------ the favour of the garrison (0-100, start 20)
    const FAVOR = {
        start: 20, glejt: 40, smith: 60, defenders: 80, patrol: 10,
        // ansgar: 0 since the integration 2026-10-16 - W12's castaway handed over is worth +20 as the concept says, and Wrak.js gives it
        // itself (Garnizon.addFavor); the old +10 here came on top of it (+30)
        k52: 20, d26Help: 5, d26Warn: -10, d26Deal: 10, d27Accuse: 15, caught: -15, saleDay: 1, ansgar: 0, stonesSeen: -2
    };
    // the garrison's smith (a soldier at the anvil): from favour 60
    const SMITH = [{ id: 127, price: 3, n: 10 }, { id: 143, price: 55, n: 1 }];
    const GRAIN_PRICE = 15;                            // a sack "at the price for friends" (D27)

    // ------------------------------------------------------------------ the soldiers (events 640-655 on Map162)
    // plan: [hour, spot | [patrol spots], act] - act: "stand" (default), "work", "patrol", "inside" (hidden); the spots are the
    // map's "Miejsce:" events (z_*). sheet: A / B (the same man in two colours)
    const SOLDIERS = [
        { id: 640, name: "Wartownik", sheet: "A", role: "brama", plan: [[0, "z_noc_brama"], [6, "z_brama_l"], [22, "z_noc_brama"]], sentry: [22, 6] },
        { id: 641, name: "Wartownik", sheet: "B", role: "brama", plan: [[0, "inside", "z_koszary"], [6, "z_brama_p"], [14, "z_wieza"], [20, "z_ognisko_1"], [22, "inside", "z_koszary"]] },
        // (9-15 he rows the rescue boat to the wreck: he and the boat are away - Garnizon.js hides the boat then)
        { id: 642, name: "Żołnierz", sheet: "B", role: "pomost", plan: [[0, "z_noc_pomost"], [6, "z_cwicz_1"], [7, "z_pomost"], [9, "inside", "z_lodz"], [15, "z_pomost"], [19, "z_ognisko_2"], [22, "z_noc_pomost"]], sentry: [22, 6] },
        { id: 643, name: "Żołnierz", sheet: "A", role: "beczki", plan: [[0, "patrol", ["z_beczki", "z_spichlerz", "kwatera_drzwi", "z_brama_p", "kwatera_drzwi", "z_spichlerz"]], [6, "z_beczki"], [22, "patrol", ["z_beczki", "z_spichlerz", "kwatera_drzwi", "z_brama_p", "kwatera_drzwi", "z_spichlerz"]]], sentry: [22, 6] },
        { id: 644, name: "Żołnierz", sheet: "A", role: "cwiczy", plan: [[0, "inside", "z_namiot"], [6, "z_cwicz_2"], [12, "z_ognisko_1"], [13, "z_cwicz_2"], [17, "work", "z_spichlerz"], [19, "z_ognisko_1"], [21, "inside", "z_namiot"]] },
        { id: 645, name: "Żołnierz", sheet: "B", role: "cwiczy", plan: [[0, "inside", "z_namiot"], [6, "z_cwicz_3"], [12, "z_ognisko_2"], [13, "z_cwicz_3"], [17, "z_pomost"], [19, "z_ognisko_2"], [21, "inside", "z_namiot"]] },
        { id: 646, name: "Kowal garnizonu", sheet: "A", role: "kowal", plan: [[0, "inside", "z_koszary"], [7, "work", "z_kuznia"], [12, "z_ognisko_1"], [13, "work", "z_kuznia"], [19, "z_ognisko_1"], [21, "inside", "z_koszary"]] },
        { id: 647, name: "Wartownik na wieży", sheet: "B", role: "wieza", plan: [[0, "inside", "z_koszary"], [6, "z_wieza"], [14, "z_cwicz_1"], [18, "z_wieza"], [21, "inside", "z_koszary"]] }
    ];
    // the recruits of D26 (help): drilling in the garrison for RECRUIT_STAY days (their own sheets), events 648-651
    // (Rafał is not on the list: the deserter of W6 - recruiting him would cut across his own thread; the recruiter only mentions him)
    const RECRUITS = { bartek: { id: 648, spot: "z_cwicz_1" }, drwal: { id: 649, spot: "z_cwicz_2" }, uchodzca: { id: 650, spot: "z_cwicz_3" } };
    const RECRUIT_STAY = 12;
    // the patrol on the road (favour under 10), event 652 on Map162
    const PATROL = { id: 652, x: 22, y: 5 };
    // Map008: the recruiter's list on the market (656); the search after D26 b (657-658); Map111: the search (660-661)
    const TOWN_EVENTS = { list: { id: 656, x: 25, y: 47 }, search: [{ id: 657, x: 59, y: 89 }, { id: 658, x: 47, y: 89 }], klos: { id: 659, x: 13, y: 48, d: 6 } };
    const PODGRODZIE_EVENTS = [{ id: 660, x: 45, y: 21 }, { id: 661, x: 37, y: 14 }];
    // the captain's quarters (Map163): where the door of Map162 lands, where its doorway leads back
    const QUARTERS_LANDING = [6, 8], QUARTERS_EXIT = [42, 18];

    // ------------------------------------------------------------------ the sandbar (rows 20-21: sea tiles; at low tide sand)
    const BAR = { rows: [20, 21], x0: 0, x1: 11, picture: "Garnizon_Lacha", px: 0, py: 19, fadeFrom: 0.15, fadeTo: 0.3 };

    window.GarnizonData = { MAP, QUARTERS, TOWN, PODGRODZIE, WAVES, RECRUIT_DAYS, RESIDENTS, QUESTS: [Q_K52, Q_D26, Q_D27], BUY, BUY_WAVE,
        BUY_WAVE_DAYS, BUY_FRIEND, HUNGER_DAYS, FAVOR, SMITH, GRAIN_PRICE, SOLDIERS, RECRUITS, RECRUIT_STAY, PATROL, TOWN_EVENTS,
        PODGRODZIE_EVENTS, QUARTERS_LANDING, QUARTERS_EXIT, BAR, IDS: [640, 669] };
})();
