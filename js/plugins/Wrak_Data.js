//=============================================================================
// Wrak_Data.js
//=============================================================================
// PAKIET E (docs/miejsca_wyspy/PAKIETY.md, koncepcja docs/miejsca_wyspy/KONCEPCJA.md punkt 7) - the data of: Wrak na mieliźnie
// (maps 165 "Wrak na mieliźnie", 166 "Wrak - pod pokładem") and the castaway in the tavern.
// Registered in js/plugins.js under Wyspa_Data, above TownLife and TownQuests (package 0), so what it puts into the shared tables
// is there before their engines read them:
//   - window.TownLifeExtra: the castaway "Eryk Sowa" (really Ansgar Wiel, the cartographer of "Biała Źrenica"), fixed id 948, key
//     "rozbitek"; he lives by the town's plan (Map008) - breakfast, drawing and evenings in the tavern (Map001 untouched: his seat is
//     TownLifeData.SPOTS_BY_MAP[1].gosc_9), the market, the walls, the well at night, sleeps in the guest rooms (Map025 untouched:
//     SPOTS_BY_MAP[25].rozbitek_wnetrze)
//   - window.TownQuestsPacks: D25 "Mapa z wraku" (Roch gives it from day 15, or it starts by itself on the wreck), W12 "Rozbitek"
//     (starts with the first clue: five clues, two are enough; the talk "in private" with four ways out), the things of both
//     (vitems), the residents' remarks after what happened
//   - window.WrakData: the package's own tables for Wrak.js (the tides on the two maps, the boat, the soldiers, the seven marks of
//     the chart, the texts)

/*:
 * @target MZ
 * @plugindesc [pakiet E] Dane: Wrak na mieliźnie (mapy 165, 166), rozbitek Eryk Sowa (948), zadania D25 „Mapa z wraku” i W12 „Rozbitek”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * ============================================================================
 * Wrak_Data.js - dane pakietu E: wrak na mieliźnie i rozbitek w tawernie
 * ============================================================================
 * Mieszkaniec: rozbitek „Eryk Sowa” (numer 948) - rano i wieczorem w tawernie
 * (wolny stołek przy stole, miejsce gosc_9 z danych), w południe na rynku,
 * pod wieczór na murach, nocą przy studni, śpi w Pokojach gości.
 * Zadania: D25 „Mapa z wraku” (od dnia 15, od Rocha; albo samo na wraku),
 * W12 „Rozbitek” (poszlaki: dwie z pięciu, potem rozmowa w cztery oczy).
 * Silnik: Wrak.js. Zasady pakietów: docs/miejsca_wyspy/PAKIETY.md.
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = 165, UNDER = 166;

    // ------------------------------------------------------------------ the tides on the package's maps: region -> the level (0 low
    // water .. 1 high) from which its cells are under water; "low" = everything but the low water (Wyspa.tide().low, switch 20)
    const FLOOD = {
        165: { 61: "low", 62: 0.45, 63: 0.75 },
        166: { 64: 0.45, 65: 0.2 }
    };

    // ------------------------------------------------------------------ the castaway
    const RES = { key: "rozbitek", id: 948 };
    const SPOTS_TOWN = {   // Map008 (the town's spots; new keys only)
        rozbitek_noc: [24, 17, 8],        // (the tavern's gate: he goes in to sleep upstairs)
        rozbitek_rynek: [28, 35, 2],      // the market, the far side from the money changer's
        rozbitek_mury: [3, 19, 4],        // under the west wall, looking towards the sea
        rozbitek_studnia: [25, 34, 4]     // the market well at night (the sleeve rolled up - W12's clue)
    };
    const SPOT_TAVERN = [61, 33, 4];      // Map001: the free stool at the right-hand table (gosc_9 - Map001 unchanged)
    const SPOT_ROOMS = [6, 38, 4];        // Map025: room 7, by the narrow bed (Map025 unchanged)

    const resident = {
        key: RES.key, id: RES.id, name: "Eryk Sowa", title: "kupiec suknem z lądu", sheet: "$Npc_Rozbitek", speed: 3,
        plan: [[0, "inside", "rozbitek_noc"], [8, "inside", "tawerna"], [10, "wander", "rozbitek_rynek"], [13, "inside", "tawerna"],
               [17, "stand", "rozbitek_mury"], [19, "inside", "tawerna"], [22, "work", "rozbitek_studnia"], [23, "inside", "rozbitek_noc"]],
        barks: {
            wander: ["Ile za ten chleb? ...Drogo. Jak wszędzie.", "Ładne światło na tym rynku. Szkoda, że węgla mało.",
                "(Eryk szkicuje coś na skrawku papieru i chowa go do rękawa.)"],
            stand: ["Morze. Zawsze to samo morze.", "(Eryk patrzy na zatokę, aż oczy mu łzawią.)", "Stąd widać mieliznę. I to, co na niej leży."],
            work: ["Zimna. Dobrze.", "Kto tam? ...A, to ty. Idź spać."],
            rain: ["Deszcz. Na morzu deszcz to łaska. Na lądzie tylko błoto."],
            night: ["Późno. Nie widziałeś mnie."],
            tavern: ["Portret za piwo! Kto chętny?", "Sukno było. Teraz jest węgiel i papier.", "Borgar, jeszcze jedno. Na kredyt? ...Nie? To nie."],
            home: ["(Eryk śpi niespokojnie i mamrocze coś w obcym języku.)"]
        },
        talk: {
            morning: ["Rano rysuję najlepiej. Twarze są jeszcze szczere.", "Śniadanie u Borgara. Owsianka jak klej, ale ciepła."],
            day: ["Ludzie płacą za portret piwem. Dobry interes, póki wątroba wytrzyma.", "Nie pytaj o sukno. Sukno poszło na dno."],
            evening: ["Wieczorem tawerna gada. Ja słucham. I rysuję.", "Melia śpiewa o krukach. Ładnie śpiewa. Za ładnie."],
            night: ["Po nocy nie rysuję. Po nocy ludzie mają za dużo cieni na twarzy."],
            rain: ["Morze w deszcz wygląda jak w domu. Prawie."]
        }
    };
    (window.TownLifeExtra = window.TownLifeExtra || []).push(resident);
    const TLD = window.TownLifeData;
    if (TLD) {
        if (TLD.SPOTS) for (const [k, v] of Object.entries(SPOTS_TOWN)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        // (gosc_9: the tavern's next guest seat - Wrak.js checks the number once TownLife has counted its guests)
        TLD.SPOTS_BY_MAP[1] = Object.assign({}, { gosc_9: SPOT_TAVERN }, TLD.SPOTS_BY_MAP[1] || {});
        TLD.SPOTS_BY_MAP[25] = Object.assign({}, TLD.SPOTS_BY_MAP[25] || {}, { rozbitek_wnetrze: SPOT_ROOMS });
    }

    // ------------------------------------------------------------------ the quests (TownQuests)
    const ICON = { map: 190, log: 189, key: 196, coins: 208, stone: 319, paper: 191 };
    const D25 = {
        id: "D25", kind: "D", title: "Mapa z wraku", giver: "przemytnik", icon: ICON.map,
        where: "Wrak na mieliźnie (łódź Janka z przystani albo łacha od garnizonu w odpływie)", when: "od dnia 15",
        desc: "Na mieliźnie w zatoce leży „Biała Źrenica” - okręt Czarnych Oczu, rozbity tej samej nocy co kuter Rocha. Roch mówi, że w kajucie kapitana muszą być mapy.",
        offer: {
            cond: { day: 15, hours: [6, 21], flags: ["rochMet"], noFlags: ["d20Wydany"], fn: "d25Ready" },   // (d25Ready: the wreck's map is in data/)
            say: ["Widziałeś okręt na mieliźnie? Tam, za cyplem. Czarne Oczy. Rozbił się tej samej nocy co mój kuter.",
                "Taki okręt nie pływa bez map. A ich mapy to mapy kamieni z krukiem. Kto wie, czego szukają, ten wie, przed czym się chować.",
                "Żołnierze z garnizonu wyławiają z niego, co się da, ale pod pokład nie schodzą. Boją się szczurów i wody."],
            yes: "Popłynę na wrak.", no: "Nie teraz.",
            accept: ["Janek cię podwiezie, za dnia. Albo idź po łasze od garnizonu, kiedy morze odejdzie. Tylko nie daj się złapać żołnierzom bez glejtu."],
            decline: ["Wrak nie ucieknie. Chyba że morze go zabierze."]
        },
        autoStart: "d25Auto",
        steps: [
            { type: "custom", check: "d25Wrak", text: "Dostań się na wrak na mieliźnie: łodzią Janka (przystań, za dnia) albo pieszo po łasze od garnizonu, w odpływie." },
            { type: "custom", check: "d25Klucz", text: "Zejdź pod pokład przez dziurę w burcie i znajdź klucz bosmana. Dolna ładownia jest sucha tylko przy niskiej wodzie." },
            { type: "custom", check: "d25Kajuta", text: "Otwórz kluczem kajutę kapitana i przeszukaj biurko i skrzynię." },
            { type: "custom", talk: "d25Kamienie", text: "Pięć kamieni z krukiem: zgłoś je celnikowi (przystań, 5 G za sztukę), sprzedaj Baltazarowi (kantor, 15 G za sztukę) albo zatrzymaj i pokaż dziadkowi." }
        ],
        reward: { xp: 100 }
    };
    const W12 = {
        id: "W12", kind: "W", title: "Rozbitek", giver: RES.key, icon: ICON.paper,
        where: "Tawerna, rynek, Podgrodzie, wrak", when: "po spotkaniu Eryka Sowy",
        desc: "Eryk Sowa rysuje w tawernie portrety za piwo i mówi, że handlował suknem. Sukna nikt nie widział, a palce ma czarne od atramentu.",
        autoStart: "w12Auto",
        steps: [
            { ch: 1, type: "custom", check: "w12Poszlaki", vars: "w12Vars",
                text: "Kim jest Eryk Sowa? Zbierz poszlaki ({n} z 2): dziennik okrętu z wraku, Józek Łata z Podgrodzia, wizja w latarni, podwinięty rękaw nocą przy studni, cudzy list." },
            { ch: 2, type: "custom", talk: "w12Talk", text: "Porozmawiaj z Erykiem w cztery oczy (tawerna, rynek albo mury)." },
            { ch: 3, type: "custom", talk: "w12Map", text: "Zanieś fałszywą mapę Baltazarowi (kantor, 8-18)." }
        ]
    };

    const VITEMS = {
        dziennik_okretu: { name: "Dziennik okrętu „Białej Źrenicy”", icon: ICON.log },
        klucz_bosmana: { name: "Klucz bosmana", icon: ICON.key },
        kamien_kruk: { name: "Kamień z krukiem", icon: ICON.stone },
        monety_oko: { name: "Monety z okiem", icon: ICON.coins },
        falszywa_mapa: { name: "Fałszywa mapa kamieni (rysunek Ansgara)", icon: ICON.paper },
        mapa_ansgara: { name: "Mapa Ansgara: kamienie z krukiem na wyspie", icon: ICON.map },
        portret: { name: "Portret węglem (od Eryka Sowy)", icon: ICON.paper }
    };
    const REMARKS = [
        { id: "wrakJanek", who: "janek", flag: "wrakByl", lines: ["Byłeś na tym wraku? Ja bym tam nie lazł. Morze chodzi tam pod piachem jak kot pod kocem."] },
        { id: "wrakRoch", who: "przemytnik", flag: "dziennikOkretu", lines: ["Masz ich dziennik? Nie pokazuj go nikomu na przystani. Celnik czyta wszystko, co ma litery."] },
        { id: "ansgarMelia", who: "melia", flag: "ansgarGiven",
            lines: ["(Melia nie podnosi wzroku znad lutni.) Eryk narysował mnie kiedyś. Za darmo. A ty go wydałeś wojsku.", "Nie mam dziś ochoty na żarty. Ani jutro."] },
        { id: "ansgarCelnik", who: "celnik", flag: "ansgarGiven", lines: ["Wojsko zabrało tego rysownika z tawerny. Kartograf Czarnych Oczu, mówią. Zapisałem go w księdze. Uczciwie."] },
        { id: "ansgarFledRoch", who: "przemytnik", flag: "ansgarFled",
            lines: ["Twój kartograf rzygał przez całą drogę. Ale dopłynął. Kazał ci powiedzieć: „Oko nie śpi, ale mruga”.", "Nie wiem, co to znaczy, i nie chcę wiedzieć."] },
        { id: "ansgarAllyMelia", who: "melia", flag: "ansgarAlly", lines: ["Eryk znowu mnie rysuje. Mówi, że ma lepszą rękę, odkąd lżej mu na sercu. Coś ty mu powiedział?"] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Wrak", quests: [D25, W12], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------ the seven marks of the chart from the captain's cabin
    // (item 178): the white eyes. `ready`: a place of another package - only once Wyspa.isReady(map)
    const MARKS = [
        { key: "tawerna", name: "Wzgórze tawerny", map: 8, x: 24, y: 18 },
        { key: "kamieniolom", name: "Kamieniołom w Górach", map: 13, x: 40, y: 18 },
        { key: "latarnia", name: "Przylądek z latarnią", map: 159, ready: 159 },
        { key: "pustelnia", name: "Pustelnia na klifie", map: 155, ready: 155 },
        { key: "urwisko", name: "Urwisko Kruków", map: 157, ready: 157 },
        { key: "kopiec", name: "Kopiec z krukiem przy chacie dziadka", map: 20, x: 8, y: 7 },
        { key: "dwor", name: "Dwór Lorda", map: 24, x: 20, y: 13 }
    ];

    // ------------------------------------------------------------------ W12's clues
    const CLUES = {
        dziennik: { name: "Dziennik okrętu", text: "W dzienniku „Białej Źrenicy”, na liście załogi: „Ansgar Wiel, kartograf. Blizna nad lewą brwią, palce w atramencie, oko wytatuowane na lewym nadgarstku”." },
        jozek: { name: "Płaszcz od Józka Łaty", text: "Józek Łata sprzedał po sztormie swój stary szary płaszcz obcemu. Ten zapłacił dziwnym groszem: z okiem zamiast korony." },
        wizja: { name: "Wizja w latarni", text: "W mgle soczewka latarni pokazała człowieka z piórem, który rysuje wybrzeże wyspy - i białe oko na jego nadgarstku." },
        tatuaz: { name: "Tatuaż przy studni", text: "Nocą przy studni Eryk podwinął rękaw, żeby się umyć. Na lewym nadgarstku ma wytatuowane otwarte oko." },
        list: { name: "Cudzy list", text: "Kruk przyniósł list, który nie był do mnie: szyfr, którego nie umiem przeczytać, i pieczęć z okiem. Zaczyna się od słów „Do A.W.”." }
    };

    window.WrakData = {
        MAP, UNDER, IDS: [670, 679], OWNER: "Wrak", FLOOD, RES, SPOTS_TOWN, SPOT_TAVERN, SPOT_ROOMS, MARKS, CLUES, ICON, ITEM_MAP: 178,
        // Janek's boat: from the harbour by day (no storm), after his "Pierwszy połów" (K47); he waits two hours by the wreck
        BOAT: { from: 15, hours: [8, 17], wait: 2, harbour: [12, 7, 6], landing: [35, 18, 2], boat: [35, 17], janek: [36, 18, 4], needQuest: "K47" },
        // the garrison's soldiers with their rescue boat (9-15, not in a storm): without the pass (flag glejtWrak) the fine
        SOLDIERS: { hours: [9, 15], see: 4.5, seeSneak: 2.2, fine: 20, favor: -10, sheet: "$Npc_Straznik", sheetKing: "$Npc_Zolnierz",
            boat: [23, 26], men: [[21, 18, 8], [25, 18, 4]] },
        BREACH: [17, 15], UNDER_LANDING: [4, 11, 8], EDGE_LAND: [[38, 20], [38, 21]],
        RAT: { at: [14, 6], max: 3, level: 1 },
        STONES: { celnik: 5, kupiec: 15, n: 5 },
        W12_GOLD: { given: 80, sold: 100 }, W12_XP: { given: 150, ally: 200, fled: 250, double: 200 },
        RAID: { after: [5, 9], chance: 0.35 }
    };
})();
