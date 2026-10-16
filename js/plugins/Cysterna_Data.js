//=============================================================================
// Cysterna_Data.js
//=============================================================================
// PAKIET F (docs/miejsca_wyspy/PAKIETY.md) - the data of "Stara cysterna zakonu" (Map167, underground, under the tavern's hill),
// concept approved by the user 2026-10-16 (docs/miejsca_wyspy/KONCEPCJA.md section 8). Only data and texts - the engine is Cysterna.js.
//   - the reserve of the Order's water (0-100, 55 at the first visit; the state "cysterna"): every day 1 to the town's well, 1 to
//     the Lord's garden (0.5 with the sluice half open, 0 with the manor branch shut), 1 for each draw of the hero; rain gives it back
//     only through the rain gate (shut: 0, open: 1 + 0.5 for each of the four gutters on the Urwisko cleaned - K53: 3)
//   - the ladle of the Order: ONE draw a day (drink your fill, or fill ONE vessel: waterskin, bucket, clay pot, watering can), only
//     after D28; the chain reaches the third mark - under 30 the bucket hangs over the water. Under 15 the town's well gives less.
//   - window.TownQuestsPacks: D28 "Zapas zakonu", K53 "Rynny zakonu", the residents' remarks
//   - LEVEL_TILES: the basin's tiles for each band of the water (tools/cysterna/build.py writes them - the map file holds band 1)
// Stands under Wyspa_Data and above TownLife / TownQuests_Data (its fixed place in js/plugins.js - package 0).
// DROUGHT (the user's rule): the only new water of the game - late (Act II, after W1 rozdz. 7 and D28), one draw a day, a finite
// reserve shared with the town and the manor; no quest gives water as a reward.

/*:
 * @target MZ
 * @plugindesc [pakiet F] Dane: Stara cysterna zakonu (mapa 167) - zapas wody, czerpak raz dziennie, zasuwy, krata, D28 „Zapas zakonu”, K53 „Rynny zakonu”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 *
 * @help
 * Pakiet F - dane miejsca (silnik: Cysterna.js).
 * Stara cysterna zakonu (mapa 167): wejście za Zasuwą główną na piętrze 30
 * (po W1 rozdz. 7), wyjście kanałem przelewu do kraty na Urwisku.
 * Zapas wody 0-100 (na start 55), czerpak: jedno nabranie dziennie, łańcuch
 * sięga do trzeciego znaku (poniżej 30 nic).
 * Zadania: D28 „Zapas zakonu”, K53 „Rynny zakonu”. Numery zdarzeń 680-689
 * (rynny na Urwisku). Test: tests/cysterna_test.js (port 9506).
 */

(() => {
    "use strict";

    const MAP = 167, FLOOR30 = 147, URWISKO = 157, TOWN = 8;
    const IDS = [680, 689];                     // Tawerna.inject on the other maps: 680-683 the gutters on the Urwisko (K53)
    const SW = { krata: 17, zasuwa: 18 };       // WyspaData.SWITCHES: krataUrwisko, zasuwaCysterny
    const ITEM = { pickaxe: 63, ironPick: 116, shovel: 62, skin: 129, bucket: 138, firedPot: 167, can: 87 };
    const ICON = { water: 391, stamina: 82, pick: 0 };

    // ------------------------------------------------------------------ the reserve
    const RESERVE = {
        start: 55, max: 100,
        draw: 1,                  // what one draw of the hero takes
        reach: 30,                // the chain reaches the third mark: under it the bucket hangs over the water
        low: 15, lowBack: 20,     // under 15 the town's well gives less (one draw), the town grumbles; again over 20: it is over
        town: 1,                  // a day to the market well (since the bell's four and two - W1 rozdz. 7)
        manor: 1, manorHalf: 0.5, // a day to the Lord's garden (the sluice half open after W1: 0.5; the branch shut: 0)
        rainOpen: 1, rainGutter: 0.5,   // a rainy day with the rain gate open: 1, + 0.5 for each gutter cleaned (all four: 3)
        lowOpinion: -2            // the town's opinion the first day under 15 (each time it falls there)
    };
    // the water shown in the map: the band of the reserve (>= BANDS[b]); the number of the basin's north wall rows above the water
    const BANDS = [75, 50, 30, 15, 0];
    const BASE_BAND = 1;
    // the ladle's chain frames (!$Cysterna_Czerpak: frame index -> [direction, pattern]); the frames: 0 rest, 1 halfway, 2 at the
    // chain's end (dry), 3-5 dipped in the water of the bands 0-2, 6-8 full (rest, halfway, low), 9 low, 10-11 shaken at the end
    const LADLE_FRAMES = [[2, 0], [2, 1], [2, 2], [4, 0], [4, 1], [4, 2], [6, 0], [6, 1], [6, 2], [8, 0], [8, 1], [8, 2]];
    // the sequences [frame, frames shown] - down to the water of a band and up full, or down to the chain's end and up empty
    const LADLE_SEQ = {
        0: [[0, 10], [3, 40], [6, 50]],
        1: [[0, 8], [1, 12], [4, 40], [7, 14], [6, 40]],
        2: [[0, 8], [1, 10], [9, 10], [5, 40], [8, 12], [7, 12], [6, 40]],
        dry: [[0, 8], [1, 10], [9, 10], [2, 24], [11, 10], [10, 10], [11, 10], [2, 30], [9, 10], [1, 10], [0, 6]]
    };
    const WINDLASS = [2, 4, 6, 4];               // the windlass's lever frames while it turns
    // the drowned (Creatures.js "topielec"): at the markers "Miejsce: topielec_N" - two the first time, then now and then one
    const DROWNED = { first: 2, later: 0.5, tag: "cysterna" };
    // the gutters on the Urwisko (package B's markers "Miejsce: rynna_1..4"): the debris (a picture event, 680-683)
    const GUTTER = { n: 4, image: "!$Rock_Rubble", stamina: 8, gateStamina: 10 };

    // ------------------------------------------------------------------ the words
    const ORD_GEN = ["", "pierwszego", "drugiego", "trzeciego", "czwartego", "piątego", "szóstego", "siódmego", "ósmego", "dziewiątego", "dziesiątego"];
    const TX = {
        // the ladle
        wedged: "Korba czerpaka zaklinowana żelaznym klinem z krukiem.",
        wedgedThink: ["> Ktoś tu pilnował racji. Najpierw zobaczę, czyja to woda i ile jej zostało."],
        unwedge: ["> (Wybijam klin z korby czerpaka.) Jedno nabranie na dzień - tak stoi w Księdze racji. Tak będzie."],
        usedToday: "Dziś już czerpałeś. Reguła zakonu: jedno nabranie na dzień.",
        tooLow: "Łańcuch za krótki - kubeł wisi nad wodą.",
        tooLowThink: ["> Żelazna obręcz przy trzecim znaku wystaje z wody. Dalej łańcuch nie sięga - i tak miało być."],
        menuTitle: "Czerpak zakonu",
        menuNote: "Jedno nabranie na dzień: napij się do syta albo napełnij jedno naczynie.",
        drinkName: "Napij się do syta", drinkHelp: "Zimna woda z głębi cysterny. Pijesz, ile wlezie - to twoje jedyne nabranie dziś.",
        potName: "Napełnij gliniany garnek", potHelp: "Garnek z plecaka: 3 porcje wody. Jedno nabranie dziś.", potNone: "Nie masz glinianego garnka w plecaku.",
        potFull: "Garnki w plecaku są pełne.",
        oneDraw: "\nTo twoje jedyne nabranie dziś (reguła zakonu).",
        drank: "Nawodnienie +", drankStamina: "+8 wytrzymałości", notThirsty: "Nie chce ci się pić",
        // the post
        post: (lv, gen) => (lv >= 100 ? "Słup miary: woda sięga dziesiątego znaku, pod sam kapitel. Cysterna pełna." :
            lv < 10 ? "Słup miary: woda nie sięga nawet pierwszego znaku." : "Słup miary: woda sięga " + gen + " znaku."),
        postReach: "Łańcuch czerpaka sięga do trzeciego znaku - woda jest w zasięgu.",
        postDry: "Żelazna obręcz przy trzecim znaku wystaje z wody - łańcuch czerpaka jej nie dosięgnie.",
        // the gates
        grateShut: "Krata z krukiem. Zamknięta - od środka trzyma ją rygiel z dźwignią obok.",
        grateBlocked: "Za kratą kanał zasypany gruzem. Tędy jeszcze nie wyjdziesz.",
        leverPull: "Krata przelewu otwarta", leverSub: "Przejście na Urwisko - teraz w obie strony.",
        leverDone: "Dźwignia opuszczona. Krata stoi otworem.",
        leverThink: ["> Za kratą świeże powietrze i krzyk mew. Urwisko - prosto nad morzem."],
        rainShut: "Zasuwa deszczowa: zardzewiała na amen.",
        rainOpen: "Zasuwa deszczowa otwarta", rainOpenSub: "Deszcz z Urwiska znów spłynie do cysterny.",
        rainTired: "Jesteś zbyt zmęczony",
        rainClogged: ["> Z kanału ledwo kapie. Rynny na Urwisku muszą być zapchane."],
        rainLook: n => "Zasuwa deszczowa otwarta. Rynny na Urwisku: oczyszczone " + n + "/4.",
        branchFirst: ["> (Łańcuch zasuwy świeżo nasmarowany. Na belce ktoś wydrapał: „F.”)",
            "> Gałąź dworska. Woda płynie pod posadzką na wschód, pod dwór Lorda. Feliks tu bywał - i to niedawno."],
        branchAsk: "Zamknąć gałąź dworską? Ogród Lorda zostanie bez wody.",
        branchClose: "Zamknij gałąź.", branchLeave: "Zostaw, jak jest.",
        branchClosed: "Gałąź dworska zamknięta", branchClosedSub: "Ogród Lorda zostaje bez wody. Zapas cysterny starczy na dłużej.",
        branchLeft: ["> Niech płynie. Na razie."],
        branchShut: "Zasuwa gałęzi dworskiej zamknięta. Klin siedzi mocno.",
        branchLord: ["> Lord się dowie, kto mu zakręcił wodę. Prędzej czy później."],
        // the water of the tank
        tankWater: "Przy brzegu woda stoi pod kożuchem szlamu. Czysta jest tylko z głębi - z czerpaka.",
        // the gutters on the Urwisko
        gutterLook: "Rynna zakonu, wykuta w skale - zapchana gruzem i starym gniazdem.",
        gutterNeed: "Potrzebujesz kilofa albo łopaty",
        gutterDone: n => "Rynna oczyszczona (" + n + "/4)",
        gutterAll: ["> Wszystkie cztery czyste. Przy następnym deszczu woda spłynie do cysterny, a nie do morza."],
        // the arrival
        firstVisit: ["> (Za zasuwą chłód i zapach mokrego kamienia. A potem - woda. Dużo wody. Stoi w ciemności od stuleci.)",
            "> Stara cysterna zakonu. Prawdziwy zapas pod wzgórzem."],
        arrive: lv => "Stara cysterna zakonu  ·  zapas " + Math.round(lv) + "/100",
        // the town's well under 15
        wellLow: "Studnia prawie sucha - sołtys daje dziś jedno nabranie",
        lowNotice: "Cysterna zakonu prawie pusta", lowSub: "Studnia na rynku daje mniej. Ludzie szemrzą."
    };
    // the notes read in the cistern (the message window, like the Order's notes underground; the first time into the journal)
    const NOTES = {
        ksiega: { title: "Księga racji wodnego", where: "Stara cysterna zakonu",
            lines: ["„Jedno wiadro na strażnika na dzień. Kto bierze dwa, ten pije z cudzego dzbana.”",
                "„Pół dla twierdzy, ćwierć dla miasta, ćwierć dla tych, co przyjdą.”",
                "„Łańcuch czerpaka skuto tak, by sięgał do trzeciego znaku. Poniżej trzeciego woda należy do miasta. Łańcucha nie przedłużać.”",
                "„Rynny na Urwisku czyścić po każdej jesieni. Zasuwę deszczową trzymać otwartą, póki pada.”",
                "„Gałąź pod kasztelanię otwierać tylko w oblężenie.”",
                "(Ostatni wpis, drżącą ręką:) „Wody na czterdzieści lat, jeśli nikt nie będzie chciwy.”"],
            note: "W kącie wodnego leży Księga racji. Reguła zakonu: jedno wiadro na strażnika na dzień - „kto bierze dwa, ten pije z cudzego dzbana”. Łańcuch czerpaka sięga tylko do trzeciego znaku na słupie miary: poniżej woda należy do miasta. Rynny na Urwisku trzeba czyścić, zasuwę deszczową trzymać otwartą. Gałąź pod kasztelanię - dziś pod dwór Lorda - otwierano tylko w oblężenie." },
        tablica: { title: "Tablica nad czerpakiem", where: "Stara cysterna zakonu",
            lines: ["Na kamiennej tablicy wykuto kubeł na łańcuchu i trzy słowa: JEDNO NA DZIEŃ.",
                "Pod spodem ktoś wydrapał kreski - dzień po dniu, jak więzień w celi. Urywają się po czterdziestu."],
            note: "" }
    };
    const NOTE_DONE = ["Racje zakonu", "Pod wzgórzem tawerny jest stara cysterna zakonu - prawdziwy zapas wody, za Zasuwą główną z trzydziestego piętra. Czerpak daje jedno nabranie na dzień, a łańcuch sięga tylko do trzeciego znaku na słupie miary. Z tej samej wody pije studnia na rynku i ogród Lorda, a przybywa jej tylko z deszczu, przez rynny na Urwisku. Kanał przelewu wychodzi kratą z krukiem na Urwisko."];

    // ------------------------------------------------------------------ the quests (TownQuests packs - docs/QUESTY_STAN.md "Jak dopisać")
    const D28 = {
        id: "D28", kind: "D", title: "Zapas zakonu", giver: null, icon: 391, autoStart: "d28Start",
        where: "podziemia: piętro 30 (Wielka cysterna) → Stara cysterna zakonu", when: "Akt II, po rozdz. 7 „Wody spod Kruczych Skał” (W1)",
        desc: "Cztery i dwa otworzyło nie tylko kanał pod rynek. Za Zasuwą główną na trzydziestym piętrze stoi stara cysterna zakonu - zapas wody pod wzgórzem. Ile jej zostało i komu płynie?",
        steps: [
            { type: "custom", check: "d28Wejdz", text: "Zasuwa główna w Wielkiej cysternie (piętro 30, winda kasztelana) stoi otworem. Przejdź za nią." },
            { type: "custom", check: "d28Ksiega", vars: "d28Vars", text: "Stara cysterna zakonu. W wodzie czają się topielce. Znajdź w kącie wodnego Księgę racji i obejrzyj słup miary przy grobli ({n}/2)." },
            { type: "custom", check: "d28Krata", text: "Kanał przelewu prowadzi do kraty z krukiem na Urwisku. Otwórz ją dźwignią od środka (kanał na północnym wschodzie)." },
            { type: "custom", check: "d28Galaz", text: "Gałąź dworska (wnęka we wschodniej ścianie) puszcza wodę pod dwór Lorda. Zamknij ją albo zostaw - twoja decyzja." }
        ],
        reward: { xp: 150, note: NOTE_DONE }
    };
    const K53 = {
        id: "K53", kind: "K", title: "Rynny zakonu", giver: null, icon: 391, autoStart: "k53Start",
        where: "Stara cysterna zakonu → Urwisko Kruków", when: "Akt II, po „Zapasie zakonu”",
        desc: "Cysterna pije deszcz z rynien wykutych w skale Urwiska. Przez lata zapchały się gruzem i gniazdami, a zasuwa deszczowa zardzewiała. Deszcz spływa do morza.",
        steps: [
            { type: "custom", check: "k53Zasuwa", text: "Otwórz zasuwę deszczową w cysternie (północna ściana, obok kanału przelewu)." },
            { type: "custom", check: "k53Rynny", vars: "k53Vars", text: "Oczyść rynny zakonu na Urwisku z gruzu i gniazd ({n}/4) - kilofem albo łopatą." }
        ],
        reward: { xp: 60, opinion: 3, flag: "rynnyCzyste",
            note: ["Rynny zakonu", "Otworzyłem zasuwę deszczową w starej cysternie i oczyściłem cztery rynny zakonu na Urwisku. Każdy deszcz znowu napełnia cysternę - trzy razy więcej niż przez zapchane rynny."] }
    };
    const REMARKS = [
        { id: "cystSoltys", who: "soltys", flag: "cysternaOtwarta", lines: ["Byłeś pod wzgórzem, przy starej cysternie? Mój dziad mówił, że tam jest woda na sto lat. I że nikt jej nie liczy. Policz, skoro już tam chodzisz."] },
        { id: "cystNiskoSoltys", who: "soltys", flag: "cysternaNisko", lines: ["Studnia ledwo ciurka. Jedno nabranie na dom, więcej nie dam. Woda pod rynkiem się kończy - słychać to po echu."] },
        { id: "cystNiskoKuba", who: "woziwoda", flag: "cysternaNisko", lines: ["Beczki wożę pół puste. W studni widać dno. Jak tak dalej pójdzie, będę woził piasek."] },
        { id: "cystGalazStraz", who: "straznik", flag: "galazDworskaZamknieta", lines: ["Pompa w oranżerii charczy na sucho. Jaśnie pan pytał, kto zakręcił wodę. Ja nic nie wiem. I ty też nic nie wiesz, prawda?"] },
        { id: "cystGalazKowal", who: "kowal", flag: "galazDworskaZamknieta", lines: ["Słyszałem, że dworski ogród usycha. A w studni jakby więcej wody. Nie pytam, kto to zrobił. Ale piwo mu stawiam."] },
        { id: "cystRynny", who: "dzwonnik", flag: "rynnyCzyste", lines: ["Pada, a ja słyszę wodę pod wzgórzem. Jak za mojego mistrza. Ktoś oczyścił rynny na Urwisku? ...Cztery i dwa, chłopcze. Woda idzie."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({
        owner: "Cysterna", quests: [D28, K53], remarks: REMARKS,
        gossip: { dzwonnik: ["Cysterna zakonu? Mój mistrz mówił: jedno wiadro na strażnika na dzień. I że kto bierze dwa, ten pije z cudzego dzbana. Dziś nikt nie liczy wiader."] }
    });

    // <POZIOMY> (tools/cysterna/build.py - nie zmieniaj ręcznie)
    const LEVEL_TILES = {
        0: [367,7915,2082,368,7914,2068,369,7914,2068,370,7914,2068,371,7914,2068,372,7914,2068,373,7914,2068,374,7914,2068,375,7914,2068,376,7914,2068,377,7918,2084,382,7915,2082,383,7914,2068,384,7914,2068,385,7914,2068,386,7914,2068,387,7914,2068,388,7914,2068,389,7914,2068,390,7914,2068,391,7914,2068,392,7918,2084,407,2082,2064,408,2068,2048,409,2068,2048,410,2068,2048,411,2068,2048,412,2068,2048,413,2068,2048,414,2068,2048,415,2068,2048,416,2068,2048,417,2084,2072,422,2082,2064,423,2068,2048,424,2068,2048,425,2068,2048,426,2068,2048,427,2068,2048,428,2068,2048,429,2068,2048,430,2068,2048,431,2068,2048,432,2084,2072],
        2: [367,7915,7907,368,7914,7906,369,7914,7906,370,7914,7906,371,7914,7906,372,7914,7906,373,7914,7906,374,7914,7906,375,7914,7906,376,7914,7906,377,7918,7910,382,7915,7907,383,7914,7906,384,7914,7906,385,7914,7906,386,7914,7906,387,7914,7906,388,7914,7906,389,7914,7906,390,7914,7906,391,7914,7906,392,7918,7910,407,2082,7913,408,2068,7912,409,2068,7912,410,2068,7912,411,2068,7912,412,2068,7912,413,2068,7912,414,2068,7912,415,2068,7912,416,2068,7912,417,2084,7916,422,2082,7913,423,2068,7912,424,2068,7912,425,2068,7912,426,2068,7912,427,2068,7912,428,2068,7912,429,2068,7912,430,2068,7912,431,2068,7912,432,2084,7916,447,2064,2082,448,2048,2068,449,2048,2068,450,2048,2068,451,2048,2068,452,2048,2068,453,2048,2068,454,2048,2068,455,2048,2068,456,2048,2068,457,2072,2084,462,2064,2082,463,2048,2068,464,2048,2068,465,2048,2068,466,2048,2068,467,2048,2068,468,2048,2068,469,2048,2068,470,2048,2068,471,2048,2068,472,2072,2084],
        3: [367,7915,7907,368,7914,7906,369,7914,7906,370,7914,7906,371,7914,7906,372,7914,7906,373,7914,7906,374,7914,7906,375,7914,7906,376,7914,7906,377,7918,7910,382,7915,7907,383,7914,7906,384,7914,7906,385,7914,7906,386,7914,7906,387,7914,7906,388,7914,7906,389,7914,7906,390,7914,7906,391,7914,7906,392,7918,7910,407,2082,7905,408,2068,7904,409,2068,7904,410,2068,7904,411,2068,7904,412,2068,7904,413,2068,7904,414,2068,7904,415,2068,7904,416,2068,7904,417,2084,7908,422,2082,7905,423,2068,7904,424,2068,7904,425,2068,7904,426,2068,7904,427,2068,7904,428,2068,7904,429,2068,7904,430,2068,7904,431,2068,7904,432,2084,7908,447,2064,7913,448,2048,7912,449,2048,7912,450,2048,7912,451,2048,7912,452,2048,7912,453,2048,7912,454,2048,7912,455,2048,7912,456,2048,7912,457,2072,7916,462,2064,7913,463,2048,7912,464,2048,7912,465,2048,7912,466,2048,7912,467,2048,7912,468,2048,7912,469,2048,7912,470,2048,7912,471,2048,7912,472,2072,7916,487,2064,2082,488,2048,2068,489,2048,2068,490,2048,2068,491,2048,2068,492,2048,2068,493,2048,2068,494,2048,2068,495,2048,2068,496,2048,2068,497,2072,2084,502,2064,2082,503,2048,2068,504,2048,2068,505,2048,2068,506,2048,2068,507,2048,2068,508,2048,2068,509,2048,2068,510,2048,2068,511,2048,2068,512,2072,2084],
        4: [367,7915,7907,368,7914,7906,369,7914,7906,370,7914,7906,371,7914,7906,372,7914,7906,373,7914,7906,374,7914,7906,375,7914,7906,376,7914,7906,377,7918,7910,382,7915,7907,383,7914,7906,384,7914,7906,385,7914,7906,386,7914,7906,387,7914,7906,388,7914,7906,389,7914,7906,390,7914,7906,391,7914,7906,392,7918,7910,407,2082,7905,408,2068,7904,409,2068,7904,410,2068,7904,411,2068,7904,412,2068,7904,413,2068,7904,414,2068,7904,415,2068,7904,416,2068,7904,417,2084,7908,422,2082,7905,423,2068,7904,424,2068,7904,425,2068,7904,426,2068,7904,427,2068,7904,428,2068,7904,429,2068,7904,430,2068,7904,431,2068,7904,432,2084,7908,447,2064,7905,448,2048,7904,449,2048,7904,450,2048,7904,451,2048,7904,452,2048,7904,453,2048,7904,454,2048,7904,455,2048,7904,456,2048,7904,457,2072,7908,462,2064,7905,463,2048,7904,464,2048,7904,465,2048,7904,466,2048,7904,467,2048,7904,468,2048,7904,469,2048,7904,470,2048,7904,471,2048,7904,472,2072,7908,487,2064,7913,488,2048,7912,489,2048,7912,490,2048,7912,491,2048,7912,492,2048,7912,493,2048,7912,494,2048,7912,495,2048,7912,496,2048,7912,497,2072,7916,502,2064,7913,503,2048,7912,504,2048,7912,505,2048,7912,506,2048,7912,507,2048,7912,508,2048,7912,509,2048,7912,510,2048,7912,511,2048,7912,512,2072,7916,527,2064,2082,528,2048,2068,529,2048,2068,530,2048,2068,531,2048,2068,532,2048,2068,533,2048,2068,534,2048,2068,535,2048,2068,536,2048,2068,537,2072,2084,542,2064,2082,543,2048,2068,544,2048,2068,545,2048,2068,546,2048,2068,547,2048,2068,548,2048,2068,549,2048,2068,550,2048,2068,551,2048,2068,552,2072,2084]
    };
    // </POZIOMY>

    window.CysternaData = { MAP, FLOOR30, URWISKO, TOWN, IDS, SW, ITEM, ICON, RESERVE, BANDS, BASE_BAND, LADLE_FRAMES, LADLE_SEQ, WINDLASS,
        DROWNED, GUTTER, ORD_GEN, TX, NOTES, NOTE_DONE, D28, K53, REMARKS, LEVEL_TILES };
})();
