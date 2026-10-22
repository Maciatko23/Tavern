//=============================================================================
// Ludzie_Data.js
//=============================================================================
// PACZKA C „Ludzie” (docs/rozszerzenia/PLAN.md, punkt 6) - the data of: Zbych Smolarz i mielerz, pasterz z owcami, wędrowny handlarz,
// patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. Only data and texts here; the engine is
// Ludzie.js (below every system of the game). What goes where, at load time (this file stands above TownLife and TownQuests_Data):
//   - window.TownLifeExtra: the residents pasterz 2910, handlarz 2911 (one man, four stops: his "alt" map is a getter by the day of
//     his cycle - Ludzie.js adds the other stops to TownLife.HOMES), patrol_latarnia_1/2 2912-2913 (Map159), patrol_garnizon_1/2
//     2914-2915 (Map162); their places: TownLifeData.SPOTS_BY_MAP (the maps have no "Miejsce:" events of ours - Map001 and the user's
//     maps stay as they are)
//   - TownLifeData.RESIDENTS drwal (Zbych Smolarz, 926): an "alt" on Map021 on the kiln's days (d % 6 = 2, 3 - from 5:00), plan / talk /
//     barks there; "szalas_drzwi" into his away list (the night in the shed is not a night in his hut on Map113)
//   - window.TownQuestsPacks: K63 „Węgiel dla kowala”, K64 „Zabłąkana owca”, K65 „Zgubiony juk”, K66 „Nocny patrol”, D34 „Jaskinia
//     pod zatoczką”, D35 „Szyb pod Orlą Granią” (their own steps: TownQuests.FX from Ludzie.js), the pack v:juk, the remarks
//   - SpeechBubbles.BUSTS: $Npc_Pasterz -> Pasterz_Bust, $Npc_Handlarz -> Handlarz_Bust (tools/busts/make_pasterz.py, make_handlarz.py)
//   - window.LudzieData: the places (registered by the engine: Okolice.registerSpots("C", SPOTS)), the discoveries, the event ids and
//     their cells, the trades, the texts
// Event ids 2500-2699 (TawernaCore registry, owner "Ludzie"): Map021 2500-2519, Map022 2520-2539, Map004 2540-2569, Map003 2570-2579,
// Map013 2590-2609, Map125 2610-2619, Map168 2650-2659. Map177 (own map, tools/rozszerzenia/C/build_map177.py) has its own events.
// Water: nothing here gives water but the pedlar's barrel - dear, one draught a day (the user: "handlarz może mieć drogą wodę, ale bez
// zalewu"); the sea water in the cave is salt (<Water:salt>).

/*:
 * @target MZ
 * @plugindesc [paczka C] Dane: Ludzie - Zbych Smolarz i mielerz, pasterz z owcami, wędrowny handlarz, patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Okolice_Data
 *
 * @help
 * ============================================================================
 * Ludzie_Data.js - dane paczki C „Ludzie”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md. Silnik: Ludzie.js.
 * Numery zdarzeń: 2500-2699. Mieszkańcy TownLife: 2910-2915 (pasterz,
 * handlarz, dwa patrole po dwóch żołnierzy). Przedmioty: 210-214.
 * Ikony: 496-500. Mapa 177 „Jaskinia przemytników”.
 * Zadania: K63 „Węgiel dla kowala”, K64 „Zabłąkana owca”, K65 „Zgubiony
 * juk”, K66 „Nocny patrol”, D34 „Jaskinia pod zatoczką”, D35 „Szyb pod Orlą
 * Granią”. Test: tests/ludzie_test.js (port 9553).
 * Musi stać nad TownLife i TownQuests_Data (wpisuje mieszkańców i zadania).
 * ============================================================================
 */

(() => {
    "use strict";

    const O = window.OkoliceData, P = O ? O.PACKAGES.C : null;
    const VERSION = "1.1.0";

    // ------------------------------------------------------------------ the maps and the event ids (2500-2699, ~20 a map)
    const MAP = { droga: 21, polna: 22, laka: 4, domek: 3, menhiry: 18, omszala: 17, gory: 13, przystan: 125, jaskinia: 177, zagroda: 168,
        przyladek: 159, garnizon: 162, miasto: 8, podgrodzie: 111 };
    const EV = {
        mielerz: 2500, dym: 2501, szalas: 2502, ogien021: 2503, tobol021: 2504, juk: 2505,
        woz022: 2520, osiol022: 2521, ogien022: 2522,
        koszar: 2540, plot: [2541, 2553], woz004: 2554, ogien004: 2555, krzak004: 2556,
        woz003: 2570, osiol003: 2571, ogien003: 2572,
        namiotA: 2590, namiotB: 2591, skrzyniaKop: 2592, ogienKop: 2593, szyb: 2594, krzak013: 2595, skrzynkiA: 2596, skrzynkiB: 2597,
        wylot: 2610,
        krzyz: [2650, 2651, 2652], lawka: 2653, marta: 2654
    };

    // ------------------------------------------------------------------ the places (Okolice.registerSpots("C", SPOTS) - the collision test)
    // the same as the plan's (OkoliceData.PLAN_SPOTS, pkg C), checked again 2026-10-21; "jagna_miejsce" is package A's (Jagna) - not here
    const SPOTS = [
        { key: "mielerz", map: 21, kind: "kiln", name: "Mielerz", mode: "reach", x: 48, y: 17, w: 3, h: 3 },
        { key: "szalas_wegl", map: 21, kind: "shed", name: "Szałas węglarza", mode: "reach", x: 52, y: 20, w: 3, h: 2 },
        { key: "postoj_021", map: 21, kind: "wagon", name: "Postój handlarza (Leśna droga)", mode: "reach", x: 54, y: 16, w: 2, h: 2 },
        { key: "juk_021", map: 21, kind: "pack", name: "Zgubiony juk", mode: "reach", cells: [[55, 12], [61, 11], [67, 8]] },
        { key: "postoj_handlarza", map: 22, kind: "wagon", name: "Postój handlarza", mode: "reach", x: 49, y: 19, w: 6, h: 4 },
        { key: "koszar", map: 4, kind: "fold", name: "Koszar", mode: "reach", x: 50, y: 40, w: 5, h: 4 },
        { key: "pastwisko", map: 4, kind: "pasture", name: "Pastwisko", mode: "zone", x: 43, y: 44, w: 7, h: 6 },
        { key: "postoj_004", map: 4, kind: "wagon", name: "Postój handlarza (Łąka)", mode: "reach", x: 59, y: 10, w: 4, h: 2 },
        { key: "postoj_003", map: 3, kind: "wagon", name: "Postój handlarza (pole dziadka)", mode: "reach", x: 59, y: 9, w: 4, h: 3 },
        { key: "pastwisko_018", map: 18, kind: "pasture", name: "Pastwisko przy menhirach", mode: "reach", x: 65, y: 29, w: 7, h: 5 },
        { key: "owca_017", map: 17, kind: "sheep", name: "Zabłąkana owca", mode: "reach", cells: [[40, 40], [60, 38], [72, 30]] },
        { key: "oboz_kopaczy", map: 13, kind: "camp", name: "Obóz kopaczy", mode: "reach", x: 97, y: 70, w: 8, h: 6 },
        { key: "szyb_czo", map: 13, kind: "shaft", name: "Szyb poszukiwawczy", mode: "wall", cells: [[105, 71]] },
        { key: "jaskinia_wejscie", map: 125, kind: "cave", name: "Wejście do jaskini", mode: "wall", cells: [[16, 64], [17, 64]] },
        { key: "grob_lugow", map: 168, kind: "grave", name: "Stare groby Ługów", mode: "reach", x: 88, y: 26, w: 3, h: 2 },
        { key: "patrol_159", map: 159, kind: "patrol", name: "Obchód patrolu", mode: "reach", cells: [[53, 45], [70, 40], [80, 53], [60, 61], [50, 70]] },
        { key: "patrol_162", map: 162, kind: "patrol", name: "Obchód patrolu", mode: "reach", cells: [[60, 45], [91, 45], [95, 65], [65, 70]] }
    ];

    // ------------------------------------------------------------------ the discoveries (Okolice.discoverable; 25 PD each)
    const DISCOVER = [
        { key: "lud_mielerz", map: 21, x: 49, y: 20, near: 2, name: "Mielerz Zbycha", icon: 334,
          text: "Kopiec polan obłożony darnią przy Leśnej drodze. Zbych Smolarz pali tu węgiel drzewny: co szósty dzień rozpala, dwa dni kopiec się tli i dymi, nocą żarzy się jak oko. W dni wypału Zbych śpi obok, w szałasie." },
        { key: "lud_koszar", map: 4, x: 52, y: 44, near: 2, name: "Koszar pasterza", icon: 367,
          text: "Wiklinowa zagroda na Łące. Wawrzyn Owczarz pasie tu sześć owiec, wieczorem zagania je za płot - wilki nocą nie przeskoczą plecionki. Co trzeci dzień pasie stado przy menhirach." },
        { key: "lud_postoj", map: 22, x: 51, y: 21, near: 2, name: "Postój wędrownego handlarza", icon: 496,
          text: "Wóz pod plandeką, osiołek i ognisko przy Polnej drodze. Szymon Juczny krąży czterema postojami: Polna droga, Leśna droga, Łąka, pole dziadka - dzień tu, dzień tam. Sprzedaje to, czego w miasteczku nie ma, i słyszy, co gdzie leży." },
        { key: "lud_oboz", map: 13, x: 100, y: 73, near: 3, name: "Obóz kopaczy Czarnych Oczu", icon: 499,
          text: "Dwa namioty pod skałą na wschodzie gór i szyb wykuty w kamieniu. Kopacze Czarnych Oczu drążą tu coś po cichu - za dnia pilnują, nocą śpią przy ognisku." },
        { key: "lud_jaskinia", map: 125, x: 16, y: 65, near: 1, name: "Jaskinia pod zatoczką", icon: 498,
          text: "Skalny otwór nad zatoczką przemytników, zalewany przez przypływ. Wejść można tylko w odpływie. Ktoś tu bywa nocą - na piasku ślady skrzyń." },
        { key: "lud_groby", map: 168, x: 89, y: 27, near: 1, name: "Stare groby Ługów", icon: 190,
          text: "Trzy omszałe krzyże i ławka na skraju spalonej zagrody. Tu leżą rodzice i dziadkowie Jana Ługa - starsi niż jego krzyż przy drodze." }
    ];

    // ------------------------------------------------------------------ the cycles
    const CYCLE = {
        kiln: { every: 6, work: [2, 3], dawn: 5 },               // Zbych at the kiln: days d % 6 = 2, 3 (a "day" from 5:00)
        stops: [22, 21, 4, 3], dawn: 6,                          // the pedlar: d % 4 -> the map (a "day" from 6:00)
        pasture018: { every: 3, at: 2, hours: [7.5, 17.5] },    // the shepherd with the flock by the menhirs
        flock: { size: 6, out: 7, home: 18.5 }                   // the sheep: out at 7, into the fold at 18:30
    };
    // the kiln's look: cold / burning / ready by the day of its cycle (and K63's own burn); see Ludzie.kilnState()
    const KILN = { burn: [2, 3], ready: [4], coal: 4, coalMax: 10, wood: 12, give: 8, days: 2 };

    // ------------------------------------------------------------------ the residents (TownLife, fixed ids 2910-2915)
    const P159 = ["lud_p159_1", "lud_p159_2", "lud_p159_3", "lud_p159_4", "lud_p159_5"];
    const P162 = ["lud_p162_1", "lud_p162_2", "lud_p162_3", "lud_p162_4"];
    const PATROL_BARKS = {
        patrol: ["Rabusie kręcą się po drogach. Widziałeś kogoś obcego?", "Ludzie z białym okiem na płaszczu... jak zobaczysz, daj znać do garnizonu.",
                 "Krok równo! Patrzeć w krzaki, nie w niebo.", "Obcy na wybrzeżu? Mów od razu, chłopcze."],
        rain: ["Mokro jak w wiadrze. A obchód i tak trzeba zrobić."],
        night: ["Kto idzie? ...A, ty. Wracaj do domu, nocą tu niebezpiecznie."]
    };
    const PATROL_TALK = {
        morning: ["Obchód o świcie. Rotmistrz mówi: kto rano chodzi, ten wieczorem śpi spokojnie."],
        day: ["Rabusie z lasu napadają na wozy. A od morza przychodzą obcy z białym okiem na szyi. Czarne Oczy, tak ich zwą. Uważaj na nich.",
              "Patrolujemy brzeg i drogi. Jak coś zobaczysz - garnizon nad zatoką, rotmistrz Bełza."],
        evening: ["Koniec obchodu. Jeszcze tylko do bramy i spać."],
        night: ["Noc. Nie łaź sam po wybrzeżu."],
        rain: ["Deszcz to dobra pora dla złodziei. Oczy szeroko."]
    };
    const RESIDENTS = [
        {
            // Wawrzyn Owczarz, the shepherd (about 55, a sheepskin coat, a felt hat, a crook): by the fold at dawn, the flock on the
            // pasture by day, he drives them in at half past six, sleeps in the fold. Every third day (d % 3 = 2) by the menhirs (Map018)
            key: "pasterz", id: 2910, name: "Wawrzyn Owczarz", title: "pasterz", sheet: "$Npc_Pasterz", map: MAP.laka, speed: 3,
            away: ["koszar_brama"],
            plan: [[0, "inside", "koszar_brama"], [6, "stand", "koszar_brama"], [7, "wander", "pastwisko"], [12, "stand", "pastwisko_cien"],
                   [13, "wander", "pastwisko"], [18.5, "stand", "pastwisko_brzeg"], [19.5, "stand", "koszar_brama"], [21, "inside", "koszar_brama"]],
            alt: {
                map: MAP.menhiry, when: "ludPasterz018",
                plan: [[0, "wander", "pastwisko_018"], [12, "stand", "pastwisko_018_kamien"], [13, "wander", "pastwisko_018"]],
                barks: { wander: ["Tu trawa lepsza. Kamienie trzymają rosę.", "Hej, owieczki, nie pod kamienie! Tam niedobrze."],
                         stand: ["Stare kamienie. Mój dziad mówił, że one pamiętają."] },
                talk: { day: ["Co trzeci dzień przyprowadzam je tutaj. Między kamieniami trawa nie wysycha. Dziwne miejsce, ale owce je lubią.",
                              "Nocą bym tu nie został. Kamienie rzucają cienie, nawet jak nie ma słońca."] }
            },
            barks: {
                stand: ["Hej, hej, owieczki, do domu!", "Raz, dwa, trzy... sześć. Wszystkie.", "Tylko nie wchodź do koszaru, spłoszysz je."],
                wander: ["Trawa coraz suchsza. Jeszcze tydzień bez deszczu i będę pasł na kamieniach.", "Hej, Siwa! Nie odchodź!", "Wilk w nocy wył za lasem. Trzeba pilnować."],
                rain: ["Deszcz! Owce mokre, ale trawa odżyje.", "Pod koszar, pod koszar!"],
                night: ["Śpij, chłopcze. Owce śpią, wilki nie."]
            },
            talk: {
                morning: ["Wstaję przed owcami, kładę się po nich. Takie życie pasterza.", "Wełna, mleko, ser - od moich owiec. Jak chcesz, sprzedam. Uczciwie."],
                day: ["Sześć owiec, mój cały majątek. Wilki biorą jedną na rok, susza drugą. Dlatego koszar z wikliny - plecionki wilk nie przeskoczy.",
                      "Lizawki brakuje. Owce bez soli chudną. Jak masz bryłę soli, kupię."],
                evening: ["Wieczorem zaganiam je za płot. Policz ze mną: jedna, dwie... sześć. Dobrze.", "Po burzy zawsze którejś brakuje. Głupie zwierzę ucieka przed grzmotem i nie wie dokąd."],
                night: ["Cicho. Nasłuchuję wilków."],
                rain: ["Deszcz to dla mnie święto. Trawa odrośnie."]
            }
        },
        {
            // Szymon Juczny, the travelling pedlar (about 40, a travel cloak, a wide hat, packs on his back): four stops in turn - Polna
            // droga (the main one: the wagon, the donkey), Leśna droga, Łąka, the field of grandpa (d % 4); trades 8-18, by the fire in the
            // evening, asleep under the wagon's tarp at night. His "alt" map is the day's stop (a getter: Ludzie.js's ludHandlarzW)
            key: "handlarz", id: 2911, name: "Szymon Juczny", title: "wędrowny handlarz", sheet: "$Npc_Handlarz", map: MAP.polna, speed: 3,
            away: ["handlarz_woz"],
            plan: [[0, "inside", "handlarz_woz"], [6.5, "stand", "handlarz_lada"], [8, "work", "handlarz_lada"], [18, "wander", "handlarz_lada"],
                   [19.5, "stand", "handlarz_sen"], [22, "inside", "handlarz_woz"]],
            alt: { get map() { const L = window.Ludzie; try { return L && L.stopMap ? L.stopMap() : MAP.polna; } catch (e) { return MAP.polna; } }, when: "ludHandlarzW" },
            barks: {
                work: ["Przyprawy z kontynentu! Lina, gwoździe, strzały!", "Kupuję skóry i wełnę, płacę lepiej niż w mieście!", "Mapa okolic, jedyna taka! Kto kupi?"],
                stand: ["Rozkładam towar, chwileczkę.", "Hej, chłopcze! Wóz otwarty."],
                wander: ["Jeszcze godzinka i zwijam kram.", "Dziś mało ludzi. Jutro inna droga."],
                rain: ["Plandeka na towar! Szybciej, osiołku, nie stój!"],
                night: ["Ognisko grzeje. Siadaj, jak chcesz, tylko nic nie ruszaj z wozu."]
            },
            talk: {
                morning: ["Rano rozkładam towar. Cztery drogi, cztery postoje - Polna, Leśna, Łąka i pole twojego dziadka. Dzień tu, dzień tam.",
                          "Co dzień inny towar. Co mi wpadnie w ręce po drodze, to sprzedaję."],
                day: ["Chodzę od wsi do wsi od dwudziestu lat. Słyszę to, czego w miasteczku nikt ci nie powie.",
                      "Skupuję skóry, wełnę, miód, wosk, rzadkie zioła, poroże, pazury. Płacę lepiej niż w mieście - bo w mieście płacą źle."],
                evening: ["Wieczorem siadam przy ogniu. Osiołek je, ja liczę. Zwykle wychodzi, że mniej niż rano.", "Woda? Mam beczkę. Ale wody nie rozdaję - wiozę ją z daleka. Łyk raz na dzień, i drogo."],
                night: ["Śpię jednym okiem. Rabusie lubią wędrownych kupców."],
                rain: ["Deszcz moczy plandekę, ale napełnia beczkę. Pół na pół."]
            }
        },
        {
            key: "patrol_latarnia_1", id: 2912, name: "Żołnierz z patrolu", title: "patrol garnizonu (przylądek)", sheet: "$Npc_Zolnierz", map: MAP.przyladek, speed: 3,
            away: ["lud_p159_noc"],
            plan: [[0, "inside", "lud_p159_noc"], [7, "patrol", P159], [19, "inside", "lud_p159_noc"], [21, "patrol", P159, "ludNocnyPatrol"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        },
        {
            key: "patrol_latarnia_2", id: 2913, name: "Żołnierz z patrolu", title: "patrol garnizonu (przylądek)", sheet: "$Npc_Zolnierz_B", map: MAP.przyladek, speed: 3,
            away: ["lud_p159_noc"],
            plan: [[0, "inside", "lud_p159_noc"], [7, "patrol", P159], [19, "inside", "lud_p159_noc"], [21, "patrol", P159, "ludNocnyPatrol"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        },
        {
            key: "patrol_garnizon_1", id: 2914, name: "Żołnierz z patrolu", title: "patrol garnizonu (wybrzeże)", sheet: "$Npc_Zolnierz", map: MAP.garnizon, speed: 3,
            away: ["koszary_drzwi"],
            plan: [[0, "inside", "koszary_drzwi"], [7, "patrol", P162], [19, "inside", "koszary_drzwi"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        },
        {
            key: "patrol_garnizon_2", id: 2915, name: "Żołnierz z patrolu", title: "patrol garnizonu (wybrzeże)", sheet: "$Npc_Zolnierz_B", map: MAP.garnizon, speed: 3,
            away: ["koszary_drzwi"],
            plan: [[0, "inside", "koszary_drzwi"], [7, "patrol", P162], [19, "inside", "koszary_drzwi"]],
            barks: PATROL_BARKS, talk: PATROL_TALK
        }
    ];
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);
    // the pairs: the second walks one cell behind the first (Ludzie.js: TownLife.hold while they patrol)
    const PAIRS = [["patrol_latarnia_1", "patrol_latarnia_2"], ["patrol_garnizon_1", "patrol_garnizon_2"]];

    // ------------------------------------------------------------------ Zbych Smolarz (TownLife's drwal, 926): the kiln's days on Map021
    const ZBYCH_ALT = {
        map: MAP.droga, when: "ludMielerz",
        plan: [[0, "inside", "szalas_drzwi"], [5.5, "work", "mielerz_praca"], [12, "stand", "szalas_przed"], [13, "work", "mielerz_praca"],
               [17, "wander", "mielerz_obchod"], [20.5, "inside", "szalas_drzwi"]],
        barks: {
            work: ["Ciągu za dużo... zatkać dziurę darnią.", "Dym siwy - dobrze. Dym żółty - źle. Dziś siwy.", "Nie podchodź blisko, chłopcze, kopiec może się zapaść."],
            stand: ["Kawałek chleba, łyk wody i z powrotem do kopca."],
            wander: ["W nocy trzeba pilnować. Kopiec nie lubi wiatru. Ani złodziei."],
            rain: ["Deszcz na mielerz - jak woda na kowadło. Szybko, płachtą!"],
            night: ["Śpię przy kopcu. Węgiel sam się nie zrobi."]
        },
        talk: {
            morning: ["Mielerz rozpalony. Dwa dni tli się pod darnią, potem rozgarniam - i jest węgiel. Kowal bierze najwięcej.",
                      "Masz drewno? Dwanaście polan - po wypale dostaniesz osiem worków węgla. Uczciwie."],
            day: ["Węgiel drzewny po cztery grosze. Więcej niż dziesięć z jednego wypału nie dam - kowal by mnie zabił.",
                  "Las Lorda za plecami. Ja biorę tylko suche, leżące. Gajowy wie i milczy."],
            evening: ["Wieczorem obchodzę kopiec dookoła. Każda dziura w darni to stracony węgiel."],
            night: ["Śpię w szałasie, jednym okiem. Rabusie wiedzą, że węgiel to grosz."],
            rain: ["Deszcz? Dla mielerza zły, dla lasu dobry. Niech pada."]
        }
    };
    const TLD = window.TownLifeData;
    if (TLD && Array.isArray(TLD.RESIDENTS)) {
        const zb = TLD.RESIDENTS.find(r => r.key === "drwal");
        if (zb && !zb.alt) {
            zb.alt = ZBYCH_ALT;
            zb.away = (zb.away || []).concat(["szalas_drzwi"]);
        }
    }
    // the places of our residents on their maps (no "Miejsce:" events of ours on the user's maps; a user's event of the same name wins)
    const SPOTS_BY_MAP = {
        21: { mielerz_praca: [51, 19, 4], mielerz_obchod: [50, 21, 8], szalas_przed: [53, 22, 2], szalas_drzwi: [53, 22, 8],
              handlarz_lada: [54, 17, 2], handlarz_sen: [54, 16, 6], handlarz_woz: [54, 16, 6] },
        22: { handlarz_lada: [53, 21, 2], handlarz_sen: [54, 22, 4], handlarz_woz: [52, 21, 8] },
        4: { koszar_brama: [52, 44, 8], pastwisko: [46, 46, 2], pastwisko_cien: [44, 44, 2], pastwisko_brzeg: [50, 45, 4],
             handlarz_lada: [62, 11, 2], handlarz_sen: [62, 11, 8], handlarz_woz: [62, 11, 8] },
        3: { handlarz_lada: [61, 11, 2], handlarz_sen: [61, 11, 6], handlarz_woz: [61, 11, 8] },
        18: { pastwisko_018: [68, 31, 2], pastwisko_018_kamien: [66, 30, 6] },
        159: { lud_p159_1: [53, 45, 2], lud_p159_2: [70, 40, 6], lud_p159_3: [80, 53, 2], lud_p159_4: [60, 61, 4], lud_p159_5: [50, 70, 8], lud_p159_noc: [30, 77, 2] },
        162: { lud_p162_1: [60, 45, 6], lud_p162_2: [91, 45, 2], lud_p162_3: [95, 65, 4], lud_p162_4: [65, 70, 8] }
    };
    if (TLD) {
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        for (const [m, spots] of Object.entries(SPOTS_BY_MAP)) {
            const have = TLD.SPOTS_BY_MAP[m] = TLD.SPOTS_BY_MAP[m] || {};
            for (const [k, v] of Object.entries(spots)) if (!have[k]) have[k] = v;
        }
    }

    // ------------------------------------------------------------------ the busts (tools/busts/make_pasterz.py, make_handlarz.py)
    const SB = window.SpeechBubbles;
    if (SB && SB.BUSTS) {
        SB.BUSTS["$Npc_Pasterz:0"] = "Pasterz_Bust";
        SB.BUSTS["$Npc_Handlarz:0"] = "Handlarz_Bust";
    }

    // ------------------------------------------------------------------ the trades
    const ITEMS = { przyprawy: 210, mapa: 211, skrzynia: 212, dziennik: 213, koc: 214, sol: 200 };
    // the pedlar sells five of these a day (a hash of the day picks them; the map of the area always, till bought once)
    const PEDLAR_SELLS = [
        { id: 210, price: 8, n: 1 }, { id: 200, price: 12, n: 1 }, { id: 93, price: 6, n: 1 }, { id: 88, price: 2, n: 5 }, { id: 127, price: 1, n: 10 },
        { id: 67, price: 3, n: 2 }, { id: 68, price: 3, n: 2 }, { id: 69, price: 3, n: 2 }, { id: 70, price: 3, n: 2 }
    ];
    const PEDLAR_MAP = { id: 211, price: 60 };
    // what he buys (a piece): 20% over the town's half price; an item not in the database yet (another package's) is left out
    const PEDLAR_BUYS = [
        { id: 96, price: 5 }, { id: 97, price: 12 }, { id: 111, price: 6 }, { id: 76, price: 9 }, { id: 185, price: 6 },
        { id: 190, price: 14 }, { id: 191, price: 12 }, { id: 192, price: 12 }, { id: 201, price: 30 }, { id: 203, price: 25 }, { id: 230, price: 15 }
    ];
    // his barrel: one draught a day, dear (dearer in the heat and the drought)
    const PEDLAR_WATER = { price: 12, hot: 20, drought: 30, sip: 35 };
    const PEDLAR_DISCOUNT = 0.9;          // K65: the pack brought back - 10% off for good
    const SHEPHERD_SELLS = [{ id: 111, price: 5, n: 1 }, { id: 124, price: 6, n: 1 }, { id: 123, price: 2, n: 1 }, { id: 214, price: 25, n: 1 }];
    const SHEPHERD_BUYS = [{ id: 200, price: 15 }];
    const SHEPHERD_DISCOUNT = 0.8;        // K64: the sheep brought back - 20% off
    const SHEARING = { season: 0, from: 10, to: 20, tool: 142, wool: 3, gold: 10, hours: 1 };   // spring, days 10-20 of the season
    const BLANKET = { item: 214, bonus: 0.5 };   // resting on the ground with the blanket: +50% (20 -> 30 an hour)
    const SMITH = { steel: 143, price: 50, perDay: 1 };   // K63: the smith sells steel 10% under the garrison's 55 G

    // ------------------------------------------------------------------ the quests (TownQuests packs; their own steps: Ludzie.js FX)
    const K63 = {
        id: "K63", kind: "K", title: "Węgiel dla kowala", giver: "kowal", icon: 79, where: "Kuźnia; mielerz Zbycha przy Leśnej drodze", when: "od dnia 4, 7–18",
        desc: "Kowal Tadek potrzebuje dziesięciu worków węgla drzewnego w pięć dni. Zbych Smolarz wypali je, jeśli dostanie drewno - i jeśli ktoś przypilnuje kopca w noc wypału.",
        offer: {
            cond: { hours: [7, 18], day: 4 },
            say: ["Węgla mi brakuje. Palenisko gaśnie, a zamówień pełno. Dziesięć worków potrzebuję, w pięć dni.",
                  "Zbych Smolarz pali węgiel w mielerzu przy Leśnej drodze. Zanieś mu drewno, niech wypali dla mnie. Zapłacę uczciwie."],
            yes: "Załatwię węgiel.", no: "Nie teraz.",
            accept: ["Dziesięć worków, pięć dni. Liczę na ciebie, chłopcze."], decline: ["Trudno. Palenisko poczeka. Ja nie."]
        },
        steps: [
            { type: "bring", to: "drwal", need: [[61, 12]], hours: [6, 20], fx: "ludK63Drewno",
              text: "Zanieś Zbychowi Smolarzowi 12× Drewno (Podgrodzie, a w dni wypału mielerz przy Leśnej drodze; 6–20).",
              hero: ["> Kowal Tadek potrzebuje węgla. Przyniosłem drewno na wypał."],
              done: ["Dwanaście polan, suche. Dobre. Dziś wieczorem rozpalę mielerz przy Leśnej drodze.",
                     "Tylko... w noc wypału rabusie lubią rozkopać kopiec i wynieść węgiel, zanim ostygnie. Przypilnujesz go ze mną tej nocy?"],
              remind: ["Dwanaście polan suchego drewna. Bez tego nie rozpalę."] },
            { type: "custom", check: "ludK63Noc", tick: "ludK63Noc", vars: "ludK63Vars",
              text: "Noc wypału (dzień {noc}, 22–2): pilnuj mielerza przy Leśnej drodze. Rabusie kręcą się po lesie." },
            { type: "custom", talk: "ludK63Wegiel", vars: "ludK63Vars",
              text: "Odbierz węgiel od Zbycha - gotowy dnia {gotowy} (przy mielerzu albo w Podgrodziu)." },
            { type: "bring", to: "kowal", need: [[79, 10]], hours: [6, 21],
              text: "Zanieś kowalowi Tadkowi 10× Węgiel drzewny (kuźnia w miasteczku).",
              hero: ["> Węgiel od Zbycha. Dziesięć worków."],
              done: ["O! Czarny, lekki, dźwięczy jak trzeba. Zbych umie palić.",
                     "Masz czterdzieści groszy. I słuchaj: stal ode mnie dostaniesz taniej niż u wojskowych. Raz na dzień, dla przyjaciela."],
              remind: ["Dziesięć worków węgla. Palenisko czeka."] }
        ],
        reward: { gold: 40, opinion: 3, xp: 100, flag: "ludKowalRabat",
            note: ["Stal od kowala", "Kowal Tadek sprzedaje mi stal taniej niż kowal garnizonu - raz na dzień, „dla przyjaciela”. Za węgiel, który przywiozłem od Zbycha."] },
        fail: { opinion: -2, text: "Kowal nie doczekał się węgla." }
    };
    const K64 = {
        id: "K64", kind: "K", title: "Zabłąkana owca", giver: "pasterz", icon: 111, where: "Łąka (koszar), Omszała łąka", when: "po burzy, 7–19",
        desc: "Po burzy Wawrzynowi Owczarzowi brakuje owcy. Uciekła przed grzmotem na Omszałą łąkę. Trzeba ją znaleźć i przyprowadzić do koszaru.",
        offer: {
            cond: { hours: [7, 19], fn: "ludPoBurzy" },
            say: ["Pięć. Liczę i liczę - pięć. Siwa uciekła w burzę. Głupia, boi się grzmotu i leci przed siebie.",
                  "Pewnie na Omszałej łące, tam zawsze ucieka. Ja nie mogę zostawić stada. Przyprowadzisz ją? Pójdzie za tobą, jak ją zawołasz."],
            yes: "Przyprowadzę Siwą.", no: "Nie mam czasu.",
            accept: ["Dzięki ci! Podejdź do niej spokojnie, nie biegnij. Pójdzie."], decline: ["Trudno... wilki będą miały ucztę."]
        },
        steps: [
            { type: "custom", check: "ludOwcaIdzie", vars: "ludOwcaVars",
              text: "Znajdź Siwą na Omszałej łące (pasterz mówi: {gdzie}) i podejdź do niej - przycisk akcji: pójdzie za tobą." },
            { type: "custom", check: "ludOwcaDoma", vars: "ludOwcaVars",
              text: "Zaprowadź Siwą na Łąkę, na pastwisko pod koszarem. Idzie za tobą - nie biegnij." },
            { type: "talk", to: "pasterz", hours: [6, 22], text: "Powiedz Wawrzynowi, że Siwa wróciła.",
              say: ["> Siwa wróciła. Cała i zdrowa."],
              done: ["Siwa! Ty głupia... (pasterz drapie owcę za uchem) Sześć. Znowu sześć.",
                     "Masz ser, trzy krążki, i trzydzieści groszy. A u mnie odtąd płacisz mniej - jak swój."] }
        ],
        reward: { gold: 30, xp: 80, items: [[124, 3]], flag: "ludOwcaRabat",
            note: ["Swój u pasterza", "Wawrzyn Owczarz sprzedaje mi wełnę, ser, mleko i koc taniej - za Siwą, którą przyprowadziłem po burzy."] }
    };
    const K65 = {
        id: "K65", kind: "K", title: "Zgubiony juk", giver: "handlarz", icon: 210, where: "Leśna droga (na wschód od mielerza)", when: "od dnia 3, 8–18",
        desc: "Szymonowi Jucznemu spadł z wozu juk na Leśnej drodze. Trzeba go znaleźć przed drugą nocą - zanim rabusie z lasu rozbiją przy nim obóz.",
        offer: {
            cond: { hours: [8, 18], day: 3 },
            say: ["Nieszczęście, chłopcze. Na Leśnej drodze, za mielerzem, juk mi spadł z wozu. Nawet nie wiem kiedy - osiołek szarpnął na wybojach.",
                  "W juku przyprawy z kontynentu. Jak go rabusie znajdą, przepadło. Dwie noce - potem rozbijają tam obóz. Znajdziesz go?"],
            yes: "Poszukam juka.", no: "Nie teraz.",
            accept: ["Na wschód od mielerza, przy drodze. Skórzany, z rzemieniami. Pośpiesz się."], decline: ["Szkoda. Przyprawy pachniały jak raj."]
        },
        steps: [
            { type: "custom", check: "ludJuk", vars: "ludJukVars", deadline: { day: 2, hour: 5, text: "Rabusie znaleźli juk pierwsi." },
              text: "Znajdź juk handlarza na Leśnej drodze, przy drodze na wschód od mielerza ({gdzie}) - przed drugą nocą (do dnia {do}, 5:00)." },
            { type: "bring", to: "handlarz", need: [["v:juk", 1]], hours: [6, 21], vars: "ludJukVars",
              text: "Oddaj juk Szymonowi Jucznemu (dziś: {postoj}).",
              hero: ["> Twój juk. Leżał przy drodze."],
              done: ["Mój juk! Cały! (handlarz zagląda do środka) Przyprawy są, pieczęć cała.", "Dwadzieścia pięć groszy. I u mnie zawsze taniej - słowo wędrownego kupca."],
              remind: ["Skórzany juk z rzemieniami. Leśna droga, za mielerzem."] }
        ],
        reward: { gold: 25, xp: 60, flag: "ludJukRabat",
            note: ["Taniej u handlarza", "Szymon Juczny sprzedaje mi taniej - za juk, który znalazłem na Leśnej drodze."] }
    };
    const K66 = {
        id: "K66", kind: "K", title: "Nocny patrol", giver: "rotmistrz", icon: 127, where: "Przylądek z latarnią (nocą)", when: "od dnia 6, 8–20",
        desc: "Rotmistrz Bełza chce, żebyś poszedł z nocnym patrolem po przylądku przy latarni. Rabusie napadają tam na ludzi, a jego żołnierze są młodzi.",
        offer: {
            cond: { hours: [8, 20], day: 6, flags: ["garnizonPoznany"] },
            say: ["Patrol na przylądku przy latarni. Dwóch żółtodziobów. Rabusie wiedzą, że nocą wracają do koszar - i wtedy napadają.",
                  "Dziś w nocy puszczę patrol jeszcze raz, od dziewiątej do północy. Pójdziesz z nimi? Ty znasz las lepiej niż oni."],
            yes: "Pójdę z patrolem.", no: "Nie tej nocy.",
            accept: ["O dziewiątej spod latarni. Trzymaj się blisko nich."], decline: ["Rozumiem. Noc jest długa, a ty jeden."]
        },
        steps: [
            { type: "custom", check: "ludPatrolNoc", tick: "ludPatrolNoc", vars: "ludPatrolVars", deadline: { day: 1, hour: 0.5, text: "Patrol poszedł bez ciebie." },
              text: "Dziś w nocy (21–24) idź z patrolem po przylądku z latarnią. Żołnierze wyruszają o 21 - trzymaj się blisko nich." },
            { type: "talk", to: "rotmistrz", hours: [6, 22], text: "Zamelduj rotmistrzowi Bełzie, jak poszedł patrol (garnizon nad zatoką).",
              say: ["> Rabusie napadli na patrol przy latarni. Odparliśmy ich."],
              done: ["(Rotmistrz kiwa głową.) Żołnierze mówią, że stanąłeś pierwszy. Dobrze.", "Trzydzieści groszy. I garnizon będzie o tobie pamiętał."] }
        ],
        reward: { gold: 30, xp: 100, flag: "ludPatrolDone" },
        fail: { opinion: 0, text: "Patrol poszedł bez ciebie." }
    };
    const D34 = {
        id: "D34", kind: "D", title: "Jaskinia pod zatoczką", giver: "celnik", icon: 212, autoStart: "ludD34Start",
        where: "Przystań: zatoczka przemytników, jaskinia (tylko w odpływie)", when: "od W5 rozdz. 4",
        desc: "Przemytnicy Baltazara mają skład w jaskini pod zatoczką. Wejść można tylko w odpływie, nocą pilnuje Sławek. Skrzynia przemytu - komu ją oddać?",
        offer: {
            cond: { hours: [8, 18], fn: "ludJaskiniaOtwarta" },
            say: ["Ty jesteś od Stacha. Słuchaj. Przemytnicy Baltazara trzymają towar w jaskini pod zatoczką. Wejście tylko w odpływie - dlatego nikt go nie pilnuje.",
                  "Przynieś mi skrzynię ze składu. Z pieczęcią kruka. Zapisze się w księdze - i dostaniesz czterdzieści groszy."],
            yes: "Przyniosę skrzynię.", no: "Nie mieszam się w to.",
            accept: ["Uważaj na odpływ. Woda wraca szybko. I nocą jest tam Sławek - człowiek Baltazara."], decline: ["Jak chcesz. Księga poczeka."]
        },
        steps: [
            { type: "custom", check: "ludSkrzynia", text: "Znajdź skład przemytników w jaskini pod zatoczką (przystań, na południowym zachodzie; wejście tylko w odpływie) i zabierz Skrzynię przemytu z niszy. Nocą pilnuje Sławek." },
            { type: "custom", talk: "ludKomuSkrzynia", vars: "ludD34Vars",
              text: "Skrzynia przemytu jest ciężka. Oddaj ją celnikowi Samborowi (przystań){balt}." }
        ],
        reward: { xp: 150, note: ["Jaskinia przemytników", "Pod zatoczką przemytników, w skale nad przystanią, Baltazar miał skład. W odpływie można tam wejść suchą nogą."] }
    };
    const D35 = {
        id: "D35", kind: "D", title: "Szyb pod Orlą Granią", giver: null, autoStart: "ludD35Start", icon: 213,
        where: "Góry i kamieniołom: obóz kopaczy na wschodzie", when: "W8 od rozdz. 3",
        desc: "Kopacze Czarnych Oczu drążą szyb w skale na wschodzie gór. Dziennik ich dowódcy powie po co. Potem: zasypać szyb, powiedzieć Grumowi - albo rotmistrzowi.",
        steps: [
            { type: "custom", check: "ludDziennik",
              text: "Obóz kopaczy Czarnych Oczu (Góry, na wschodzie): w skrzyni dowódcy przy namiotach leży jego dziennik. Zabierz go po cichu - nocą kopacze śpią." },
            { type: "custom", talk: "ludSzybKomu", check: "ludSzybKoniec", vars: "ludD35Vars",
              text: "„Kopią ku piętru pięćdziesiątemu od góry…” Co z szybem? Zasyp go (Lina i piła, przy szybie){grum}, albo powiedz rotmistrzowi (garnizon nad zatoką)." }
        ],
        reward: { xp: 150 }
    };
    const VITEMS = { juk: { name: "Juk handlarza", icon: 496 } };
    const REMARKS = [
        { id: "ludRochSkrzynie", who: "przemytnik", flag: "ludObieSkrzynie", lines: ["Dwie skrzynie Baltazara? Jedna w jaskini, druga w gąszczu, gdzie tylko ptak doleci... (Roch gwiżdże.) Chłopcze, ty masz nosa lepszego niż celnik.",
            "Baltazar policzy straty i zacznie szukać, kto mu je zrobił. Uważaj na przystani."] },
        { id: "ludMartaGroby", who: "praczka", flag: "ludGroby", lines: ["Byłeś przy starych grobach Ługów? Ktoś je oczyścił... (Marta ociera oczy.) To ty.",
            "Tam leżą rodzice Jana i jego dziadkowie. Jan mówił, że stary Ług przyszedł tu z kontynentu, kiedy zagroda była jeszcze lasem. Dziękuję."] },
        { id: "ludKowalWegiel", who: "drwal", flag: "ludKowalRabat", lines: ["Tadek zadowolony z węgla? To dobrze. Przyjdź, jak będziesz miał drewno - zawsze coś wypalę."] },
        { id: "ludRotmistrzSzyb", who: "rotmistrz", flag: "ludSzybRotmistrz", lines: ["Moi ludzie rozbili obóz kopaczy pod skałą. Szyb zasypany. Czarne Oczy kopały ku podziemiom zakonu... Dobrze, że powiedziałeś mnie, a nie komuś innemu."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Ludzie", quests: [K63, K64, K65, K66, D34, D35], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------ the camps and places of the quests
    const JUK_SPOTS = [[55, 12], [61, 11], [67, 8]];
    const SHEEP_SPOTS = [[40, 40], [60, 38], [72, 30]];
    const SHEEP_WHERE = ["przy starym dębie na zachodzie", "między krzakami w środku łąki", "na północnym wschodzie, pod lasem"];
    const PASTURE = { 4: { x: 43, y: 44, w: 7, h: 6 }, 18: { x: 65, y: 29, w: 7, h: 5 } };
    const FOLD = { cells: [[51, 41], [52, 41], [53, 41], [51, 42], [52, 42], [53, 42]], gate: [52, 43], fence: [[50, 40], [51, 40], [52, 40], [53, 40], [54, 40],
        [50, 41], [54, 41], [50, 42], [54, 42], [50, 43], [51, 43], [53, 43], [54, 43]] };
    const KILN_AT = { x: 49, y: 19 }, SHED_AT = { x: 53, y: 21 };
    const STOPS = {
        22: { woz: [51, 20], osiol: [49, 20], ogien: [53, 22] },
        21: { ogien: [55, 16], tobol: [55, 17] },
        4: { woz: [60, 11], ogien: [62, 10] },
        3: { woz: [60, 10], osiol: [62, 9], ogien: [62, 11] }
    };
    const CAMP = { tentA: [99, 72], tentB: [103, 72], chest: [101, 73], fire: [100, 75], shaft: [105, 71], shaftFront: [105, 72], bush: [98, 70],
        crates: [[97, 74], [102, 74]], seats: [[99, 75], [101, 75], [100, 74]], worker: [105, 73], sleeper: [98, 74], near: 10 };
    const CAMP_MEN = [
        { kind: "mercenary", look: "Merc" }, { kind: "bandit", look: "Merc" }, { kind: "bandit", look: "Merc" }, { kind: "knifer", look: "Merc" }
    ];
    const CAVE = { mouth: [16, 64], front: [16, 65], back: [16, 65], landing: [3, 11], exit: [3, 12], niche: [13, 2], table: [9, 5], seat: [10, 6],
        slawek: { kind: "bandit", look: "Bandit", hours: [22, 4] } };
    const GRAVES = { crosses: [[88, 26], [89, 26], [90, 26]], bench: [88, 27], marta: [90, 27], blows: 4 };
    const PATROL_AMBUSH = { map: 159, at: [70, 40], r: 4, kinds: ["bandit", "bandit", "knifer"], hours: [21, 24] };
    const KILN_AMBUSH = { map: 21, r: 14, kinds: ["bandit", "bandit"], hours: [22, 2], wait: 600 };
    const SHAFT = { rope: 93, saw: 118, blows: 6 };

    // ------------------------------------------------------------------ the texts
    const TX = {
        menu: { buy: "Pokaż towar.", sell: "Sprzedam ci coś.", talk: "Co słychać?", bye: "Bywaj.", water: "Łyk wody z beczki", rumour: "Słyszałeś coś ciekawego?",
                coal: "Kupię węgiel", wood: "Dam drewno na wypał", collect: "Odbiorę węgiel.", shear: "Pomogę przy strzyży.", steel: "Kupię stal", nothing: "Nic." },
        pedlarHello: ["Witaj, wędrowcze! Patrz, wybieraj. Co dzień co innego.", "Hej, chłopcze od Stacha! Dziś mam coś dla ciebie.", "Towar z czterech dróg. Wybieraj."],
        pedlarNight: ["Nocą nie handluję. Przyjdź rano, po ósmej."],
        pedlarNoBuy: ["Nie masz nic, co bym wziął. Skóry, wełna, miód, wosk, rzadkie zioła, trofea - to kupuję."],
        pedlarMapSold: "Mapę już masz - drugiej takiej nie zrobię.",
        pedlarWaterDone: "Dziś już piłeś z mojej beczki. Jutro.",
        pedlarWaterNone: "Beczka sucha. Upał wypił wszystko.",
        pedlarWaterLine: "Łyk z beczki. Woda z daleka - stąd cena.",
        rumourNone: ["Nic nowego. Wszystko, o czym słyszałem, już wiesz."],
        rumourDone: ["Dziś już ci mówiłem, co wiem. Jutro coś usłyszę."],
        rumour: "Ludzie gadają, że na mapie „{map}” jest {name}. Popytaj, poszukaj.",
        shepherdHello: ["Owce zdrowe, wełna gęsta. Co ci trzeba?", "A, chłopak od Stacha. Mleka? Sera?"],
        shepherdNight: ["Śpię przy owcach. Przyjdź rano."],
        shearNo: "Strzyża wiosną, w środku pory. Teraz owce nie dadzą.",
        shearDone: "Dziś już strzygliśmy. Jutro, jak chcesz.",
        shearOk: ["Trzymaj ją mocno za kark... o tak. (Godzina mija na strzyży.) Masz wełnę i dziesięć groszy. Dobra robota."],
        zbychHello: ["Węgla trzeba? Albo drewno masz?", "Siekiera, kopiec, dym. Czego chcesz?"],
        coalOut: "Z tego wypału już nic nie zostało. Za kilka dni nowy.",
        woodOk: "Dwanaście polan. Za dwa dni będzie z tego osiem worków węgla.",
        woodBusy: "Jeden wypał naraz, chłopcze. Ten twój jeszcze się tli.",
        collectWait: "Jeszcze się tli. Dnia {day} rozgarnę.",
        collectOk: "Osiem worków, czarne jak noc. Twoje.",
        smithHello: ["Stal? Dla ciebie zawsze. Raz na dzień, taniej niż u wojskowych."],
        smithDone: "Dziś już brałeś. Jutro.",
        kiln: { cold: "Zimny mielerz. Polana pod darnią czekają na ogień.", burn: "Mielerz się tli. Gorąco bije spod darni - nie podchodź.", ready: "Węgiel gotowy. Kopiec rozgarnięty, czarne bryły dymią jeszcze." },
        shed: "Szałas węglarza. Siennik, kociołek i siekiera. Zbych tu śpi w dni wypału.",
        wagon: "Wóz handlarza. Plandeka zawiązana na supły - nie ruszaj.",
        donkey: "Osiołek. Patrzy na ciebie, jakby pytał o marchew.",
        fold: "Koszar z wikliny. Owce za płotem są bezpieczne.",
        camp: { tent: "Namiot kopaczy. Śmierdzi potem i dymem.", crates: "Skrzynie z narzędziami: kilofy, łopaty, liny.", fireDay: "Ognisko kopaczy.",
                chestEmpty: "Pusta skrzynia. Dziennik już zabrałeś.", chestTaken: "W skrzyni pod kocem - gruby notes w skórzanej oprawie. Dziennik dowódcy.",
                shaft: "Szyb wykuty w skale, obity belkami. W dole czarno. Kopią ku podziemiom.", shaftDone: "Szyb zasypany. Belki zawalone, wejście pełne kamieni.",
                shaftNeed: "Żeby podciąć stemple, trzeba piły. I liny, żeby zwalić belki." },
        journalNote: ["Dziennik kopacza", "„Kopią ku piętru pięćdziesiątemu od góry. Kamień miękki, sztolnia idzie szybko. Białe oko każe się śpieszyć - zanim zakon się obudzi.” - z dziennika dowódcy kopaczy Czarnych Oczu (obóz pod skałą, Góry)."],
        shaftDone: ["Ostatnie podcięcie - belki trzeszczą, strop się sypie. Szyb zasypany. Kopacze nie wrócą tu szybko."],
        shaftGrum: ["> Kopacze Czarnych Oczu drążą szyb pod skałą, na wschodzie gór. Ku piętru pięćdziesiątemu. Mam ich dziennik.",
                    "(Grum długo milczy.) Pięćdziesiąte... od góry. To moi mocodawcy, chłopcze. Albo ich rywale. Tak czy owak - dobrze, że mi powiedziałeś.",
                    "Pójdę tam z ludźmi. Kopacze zwiną obóz. A ty... trzymaj ten dziennik przy sobie."],
        shaftCaptain: ["> Panie rotmistrzu. Pod skałą na wschodzie gór kopacze z białym okiem drążą szyb. Ku podziemiom zakonu. Mam ich dziennik.",
                       "(Rotmistrz bierze dziennik, czyta.) Czarne Oczy... na naszej wyspie. Wyślę ludzi jeszcze dziś. Obóz będzie rozbity, szyb zasypany.",
                       "Dobrze zrobiłeś, chłopcze. Garnizon to zapamięta."],
        cave: { closed: "Otwór zawalony głazami. Ktoś je tu ułożył - celowo.", flooded: "Wejście zalane. Trzeba odpływu.", enter: "Wchodzisz do jaskini...",
                niche: "Nisza w skale. Pusto - skrzynię już zabrałeś.", nicheLook: "W niszy skrzynia z wypalonym krukiem. Ciężka.",
                table: "Stół przemytników. Rejestr: skrzynie, kamienie z krukiem, worki zboża. Pismo Baltazara.", barrel: "Beczki z solą i suszoną rybą. Na wieku znak kruka.",
                salt: "Woda morska. Słona - nie do picia." },
        caveTake: ["Weź skrzynię (ciężka).", "Wyłam wieko i zajrzyj.", "Zostaw."],
        caveOpened: ["Pod wiekiem: przyprawy w woreczkach, gwoździe, sakiewka z groszem... i pusta przegródka po kamieniu z krukiem. Celnik się dowie, że ktoś tu był."],
        crateCelnik: ["> Skrzynia z jaskini pod zatoczką. Pieczęć kruka.", "(Celnik zapisuje długo.) Jedna skrzynia, pieczęć kruka, skład przemytników... Zgadza się.",
                      "Czterdzieści groszy. I w księdze stoi teraz, że wnuk Stacha jest po stronie prawa."],
        crateCelnik2: ["Druga? (Celnik unosi brwi.) Skąd... nie, nie mów. Dwadzieścia więcej. I nikomu ani słowa."],
        crateBaltazar: ["> Twoja skrzynia. Z jaskini pod zatoczką.", "(Baltazar uśmiecha się szeroko.) Mój przyjaciel! Wiedziałem, że jesteś rozsądny. Dziewięćdziesiąt groszy.",
                        "Celnik nic nie wie, prawda? Prawda."],
        crateBaltazar2: ["I druga? Ach, przyjacielu... Czterdzieści więcej. Rozsądek się opłaca."],
        crateLabel: { celnik: "Oddaj skrzynię celnikowi.", baltazar: "Oddaj skrzynię Baltazarowi.", keep: "Jeszcze nie." },
        stash: "Druga skrzynia przemytu z pieczęcią kruka. Ciężka.",
        graves: { dirty: "Stary krzyż, zarośnięty chwastami i mchem.", clean: "Oczyszczony krzyż. Ktoś tu dba o pamięć.", cleaning: "Wyrywasz chwasty, zdzierasz mech...",
                  done: ["Trzy stare krzyże czyste. Ławka znowu widać. Ługowie mają tu spokój."], bench: "Stara ławka przy grobach. Usiąść, pomyśleć." },
        martaLines: [["(Marta poprawia kamyki przy krzyżach.) Rodzice Jana. I dziadkowie. Dobrze, że ktoś tu zajrzał.", "Przychodzę raz na jakiś czas. Posiedzę - i do prania."],
                     ["Stary Ług przyszedł tu z kontynentu, jak zagroda była jeszcze lasem. Tak mówił Jan.", "Idź, idź. Ja jeszcze chwilę."]],
        patrolSearch: ["Stój! Przeszukanie. Rozkaz rotmistrza."],
        patrolNight: ["Do broni! Rabusie!", "Za króla!"],
        patrolNightStart: "Patrol wyrusza spod latarni. Trzymaj się blisko.",
        kilnNight: "Ktoś skrada się do mielerza...",
        sheepFound: "Siwa idzie za tobą.",
        sheepHome: "Siwa wróciła do stada.",
        sheepLook: "Owca pasterza. Beczy na twój widok.",
        sheepLost: "Zabłąkana owca. Drży i beczy żałośnie.",
        blanket: "Koc grzeje: odpoczywasz szybciej."
    };

    // the items of the package (installed by tools/rozszerzenia/instaluj.py from tools/rozszerzenia/C/przedmioty.json)
    const ITEM_NAMES = { 210: "Przyprawy", 211: "Mapa okolic", 212: "Skrzynia przemytu", 213: "Dziennik kopacza", 214: "Wełniany koc" };

    // (2026-10-22, integration) the lines of the epilogue after the Heart (Underground.js asks Ludzie.epilogue): one or two by what the hero did
    const EPILOG = {
        graves: "Marta Ługowa siada czasem przy starych grobach w lesie, tych, które oczyściłeś. Mówi, że teraz widać imiona - i że dziadkowie Jana mieliby co opowiadać.",
        cave: {
            celnik: "Jaskinia pod zatoczką stoi pusta: celnik Sambor przybił przy wejściu deskę z pieczęcią. Przemytnicy szukają nowej dziury w brzegu.",
            baltazar: "Skrzynia z jaskini wróciła do Baltazara. W jego księgach stoisz teraz po stronie zysków - a on niczego nie zapomina.",
            otwarta: "Jaskinię pod zatoczką zalewa przypływ jak dawniej. O wyłamanej skrzyni mówi się na przystani szeptem - nikt nie wie, że to ty."
        }
    };
    window.LudzieData = { EPILOG, VERSION, PKG: "C", OWNER: "Ludzie", IDS: P ? P.ids : [2500, 2699], RESIDENT_IDS: P ? P.residents : [2910, 2929],
        ITEM_IDS: P ? P.items : [210, 224], ICONS: P ? P.icons : [496, 511], SWITCHES: P ? P.switches : [25, 26], MAP, EV, SPOTS, DISCOVER, CYCLE, KILN,
        RESIDENTS, PAIRS, ZBYCH_ALT, SPOTS_BY_MAP, ITEMS, ITEM_NAMES, PEDLAR_SELLS, PEDLAR_MAP, PEDLAR_BUYS, PEDLAR_WATER, PEDLAR_DISCOUNT,
        SHEPHERD_SELLS, SHEPHERD_BUYS, SHEPHERD_DISCOUNT, SHEARING, BLANKET, SMITH, QUESTS: { K63, K64, K65, K66, D34, D35 }, VITEMS, REMARKS,
        JUK_SPOTS, SHEEP_SPOTS, SHEEP_WHERE, PASTURE, FOLD, KILN_AT, SHED_AT, STOPS, CAMP, CAMP_MEN, CAVE, GRAVES, PATROL_AMBUSH, KILN_AMBUSH, SHAFT,
        TX, P159, P162, ready: true };
})();
