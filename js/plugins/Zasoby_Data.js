//=============================================================================
// Zasoby_Data.js
//=============================================================================
// PACZKA A „Woda i zasoby” (docs/rozszerzenia/PLAN.md, punkt 4) - the data of: źródełka, zagroda sąsiada ze studnią deszczową, dzikie
// ule, kręgi grzybów, Babka Jagna i jej zioła, ogródki, wysypisko i glinianka, kamieniołom bloków i żyły rudy, kraby i drewno z morza,
// spalony sad, pola mieszczan. Only data and texts here; the engine is Zasoby.js (below every system). What this file puts in at load:
//   - window.TownLifeExtra: Babka Jagna (id 2900, key "jagna", Map017) + her places in TownLifeData.SPOTS_BY_MAP[17]
//   - window.TownQuestsPacks: K55 (dzwonnik), K56 (znachorka), K57 (dziadek), K58 (praczka), D30 (Jagna), D31 (szmaciarz)
//   - QuestBoard: four notices (keys "zas_") into its TEMPLATES, the worth of the new items into its EV
//   - SpeechBubbles.BUSTS: Jagna's bust
//   - window.ZasobyData: the places (map by map, cells, event ids), the herbs, the loot tables, the numbers, the texts
// DROUGHT (the user's rule): the only new water is the five hidden springs (1-2 portions a day, dry in the heat, frozen in snow) and
// the neighbour's well that only gathers rain (4 portions at most). No quest gives water; the sea gives none.

/*:
 * @target MZ
 * @plugindesc [paczka A] Dane: Woda i zasoby - źródełka, zagroda sąsiada ze studnią deszczową, dzikie ule, kręgi grzybów, Babka Jagna i jej zioła, ogródki, wysypisko i glinianka, kamieniołom bloków i żyły rudy, kraby i drewno z morza, spalony sad, pola mieszczan. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Okolice_Data
 *
 * @help
 * ============================================================================
 * Zasoby_Data.js - dane paczki A „Woda i zasoby”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md. Silnik: Zasoby.js.
 * Numery zdarzeń: 2100-2299. Mieszkańcy TownLife: 2900-2904 (Jagna 2900).
 * Przedmioty: 185-199. Ikony: 464-479. Przełączniki: 21-22.
 * Zadania: K55-K58, D30-D31. Test: tests/zasoby_test.js (port 9551).
 *
 * Tu same dane: miejsca, zioła, łupy, liczby, teksty, mieszkanka (Jagna),
 * zadania (TownQuestsPacks), ogłoszenia tablicy (klucze zas_), popiersie.
 * ============================================================================
 */

(() => {
    "use strict";

    const O = window.OkoliceData, P = O ? O.PACKAGES.A : null;
    const VERSION = "1.1.0";
    const T = (a, b) => [a, b];
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));

    // ------------------------------------------------------------------
    // The items (PLAN.md 3.2; data/Items.json 185-199 through tools/rozszerzenia/instaluj.py) and the ones of the game we use
    // ------------------------------------------------------------------
    const ITEM = {
        wosk: 185, krab: 186, krabPieczony: 187, blok: 188, drewnoDryfowe: 189, arcydziegiel: 190, dziurawiec: 191, kozlek: 192,
        zlom: 193, moneta: 194, masc: 195, napar: 196,
        // (the game's)
        axe: 60, wood: 61, shovel: 62, pick: 63, hoe: 66, potatoSeed: 67, carrotSeed: 68, potato: 71, carrot: 72, cabbage: 73, barley: 74,
        honey: 76, charcoal: 79, planks: 80, ironOre: 85, can: 87, nails: 88, hammer: 89, knifeStone: 90, knifeIron: 91, fiber: 92, rope: 93,
        mushroom: 103, herb: 104, ironAxe: 115, ironPick: 116, wildApple: 139, shears: 142, clay: 164, bucket: 138
    };
    // the icons of the package's row (IconSet row 29: 464-479; tools/rozszerzenia/A/ikony.png) - item n -> icon 464 + (n - 185)
    const ICON = { wosk: 464, krab: 465, krabPieczony: 466, blok: 467, drewno: 468, arcydziegiel: 469, dziurawiec: 470, kozlek: 471,
        zlom: 472, moneta: 473, masc: 474, napar: 475, water: 391, stamina: 82, coin: 314, honey: 331, mushroom: 359, herb: 360, clay: 427 };

    // ------------------------------------------------------------------
    // The event ids (2100-2299, Tawerna.inject owner "Zasoby") map by map
    // ------------------------------------------------------------------
    const IDS = {
        17: [2100, 2129], 21: [2130, 2139], 13: [2140, 2154], 155: [2155, 2164], 168: [2165, 2184], 3: [2185, 2204],
        111: [2205, 2224], 125: [2225, 2229], 162: [2230, 2234], 8: [2235, 2299]
    };

    // ------------------------------------------------------------------
    // A1 the springs: the spring itself (sx, sy - the plan's "samo źródło"), its area (the registered spot), two mossy stones and, at
    // three of them, a clump of a wild rare herb (Jagna's D30 wants herbs "not from her glade")
    // ------------------------------------------------------------------
    const SPRINGS = [
        { key: "zrodlo_017", map: 17, x: 70, y: 54, w: 3, h: 2, sx: 71, sy: 54, id: 2100, stones: [2101, 2102], herb: { id: 2103, kind: "kozlek" },
          name: "Źródełko w mchu", where: "Omszała łąka", hint: "gęsty las na południowym wschodzie, mokry mech" },
        { key: "zrodlo_021", map: 21, x: 23, y: 42, w: 3, h: 2, sx: 24, sy: 42, id: 2130, stones: [2131, 2132], herb: { id: 2133, kind: "arcydziegiel" }, frogs: true,
          name: "Źródełko w lesie", where: "Leśna droga", hint: "las na południowym zachodzie, rechot żab o zmierzchu" },
        { key: "zrodlo_013", map: 13, x: 109, y: 77, w: 3, h: 2, sx: 110, sy: 77, id: 2140, stones: [2141, 2142],
          name: "Źródełko pod skałą", where: "Góry", hint: "pod skałą przy południowo-wschodnich ścianach" },
        { key: "zrodlo_155", map: 155, x: 58, y: 66, w: 3, h: 2, sx: 59, sy: 66, id: 2155, stones: [2156, 2157],
          name: "Źródełko w gąszczu", where: "Pustelnia", hint: "sosnowy gąszcz na południu, daleko od morza" },
        { key: "zrodlo_168", map: 168, x: 45, y: 54, w: 3, h: 2, sx: 46, sy: 54, id: 2165, stones: [2166, 2167], herb: { id: 2168, kind: "dziurawiec" },
          name: "Stare źródło Ługów", where: "Spalona zagroda", hint: "zarośla na południu, „stare źródło Ługów”" }
    ];
    // portions a day (PLAN.md A1): by the season, +1 after rain (today or yesterday, at most 3); 0 in the heat ("upał": summer and
    // 6+ dry days) and in a drought (10+ dry days); 0 while it snows today ("zamarzło")
    const SPRING_RULE = { base: [2, 1, 2, 1], rainBonus: 1, max: 3 };

    // ------------------------------------------------------------------
    // A2 the neighbour's farm (Map003, the new land south of the field)
    // ------------------------------------------------------------------
    const FARMSTEAD = {
        map: 3,
        ruin: { id: 2185, x: 42, y: 51, occupy: "<Occupy:left=2,right=2,up=2>", gives: [[ITEM.rope, 1], [ITEM.nails, 4]] },
        garden: { ids: [2188, 2189, 2190, 2191, 2192, 2193], cells: [[44, 52], [45, 52], [46, 52], [44, 53], [45, 53], [46, 53]], hits: 6, regrow: 12,
            veg: [ITEM.potato, ITEM.carrot], seeds: [ITEM.potatoSeed, ITEM.carrotSeed], n: [2, 4], seedChance: 0.5 },
        well: { id: 2194, x: 47, y: 53, clearHits: 12, fixHits: 15, cost: [[ITEM.blok, 4], [ITEM.rope, 2], [ITEM.planks, 2]], max: 4, rainHours: 2 },
        fence: { id: 2195, x: 39, y: 52 },
        blanks: [2186, 2187]
    };
    // A3 the wild hives by the pines (Map003): every 4 days; summer and autumn honey 1-2 + wax, spring honey 1, winter nothing
    const HIVES = [
        { key: "ul_1", id: 2196, x: 66, y: 38 }, { key: "ul_2", id: 2197, x: 76, y: 48 }, { key: "ul_3", id: 2198, x: 62, y: 55 }
    ];
    const HIVE_RULE = { every: 4, sting: 0.7, stingStamina: 20, stingHours: 2, smokeRange: 3 };

    // ------------------------------------------------------------------
    // A4 the fairy rings after rain (Map017): 8 mushrooms each, from 5:00 on a rainy day till 6:00 two days after the rain
    // ------------------------------------------------------------------
    const RINGS = [
        { key: "grzyby_krag1", centre: [54, 44], ids: [2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114],
          cells: [[54, 41], [56, 42], [57, 44], [56, 46], [54, 47], [52, 46], [51, 44], [52, 42]] },
        { key: "grzyby_krag2", centre: [63, 44], ids: [2115, 2116, 2117, 2118, 2119, 2120, 2121, 2122],
          cells: [[63, 41], [65, 42], [66, 44], [65, 46], [63, 47], [61, 46], [60, 44], [61, 42]] }
    ];

    // ------------------------------------------------------------------
    // A5 Jagna's glade (Map017) and the rare herbs: seasons (0 spring .. 3 winter), days to grow back
    // ------------------------------------------------------------------
    const HERBS = {
        arcydziegiel: { item: ITEM.arcydziegiel, seasons: [1, 2], regrow: 6, look: 0 },
        dziurawiec: { item: ITEM.dziurawiec, seasons: [1], regrow: 5, look: 1 },
        kozlek: { item: ITEM.kozlek, seasons: [0, 1, 2], regrow: 7, look: 2 }
    };
    Watki.scal(HERBS, "zasoby", "ziola");   // (its words: js/teksty/zasoby.txt, ziola)
    const GLADE = { map: 17, x: 65, y: 12, w: 5, h: 3, stand: [67, 15],
        herbs: [{ id: 2104, kind: "arcydziegiel", x: 66, y: 12 }, { id: 2105, kind: "dziurawiec", x: 68, y: 13 }, { id: 2106, kind: "kozlek", x: 66, y: 14 }] };

    // Babka Jagna: TownLife resident 2900 on Map017 - mornings at the glade on days without rain (the dew), evenings after rain by the
    // fairy rings; otherwise away in the forest. Never on Map023 (PLAN.md 1).
    const JAGNA_SPOTS = { jagna_polanka: [67, 15, 8], jagna_krag: [58, 44, 2], jagna_las: [69, 16, 2] };
    // (2026-10-22, integration) Jagna buys the cliff herbs of package D (plan 7.5: szarotka 228, warzucha 229 - only from the eagle),
    // once a day when the hero has some and she trusts him (trust >= 0)
    const JAGNA_BUYS = [{ id: 228, price: 20 }, { id: 229, price: 6 }];
    const JAGNA_BUY_TX = {
    };
    Watki.scal(JAGNA_BUY_TX, "zasoby", "jagnaSkup");   // (its words: js/teksty/zasoby.txt, jagnaSkup)
    const JAGNA = {
        key: "jagna", id: 2900, sheet: "$Npc_Jagna", map: 17, speed: 2,
        away: ["jagna_las"],
        plan: [[0, "inside", "jagna_las"], [5, "work", "jagna_polanka", "zasRosa"], [10, "inside", "jagna_las"],
               [18, "stand", "jagna_krag", "zasPoDeszczu"], [20, "inside", "jagna_las"]],
        barks: {
            night: []
        },
        talk: {
        }
    };
    Watki.scal(JAGNA, "zasoby", "mieszkaniec");   // (its words: js/teksty/zasoby.txt, mieszkaniec)

    // ------------------------------------------------------------------
    // A6 Podgrodzie (Map111): three kitchen gardens, the rubbish heap, the clay pit
    // ------------------------------------------------------------------
    const GARDENS = [
        { key: "ogrodek_1", owner: "praczka", ids: [2205, 2206, 2207, 2208], cells: [[61, 10], [63, 10], [62, 12], [64, 12]], crop: 2, veg: ITEM.cabbage },
        { key: "ogrodek_2", owner: "franek", ids: [2209, 2210, 2211, 2212], cells: [[66, 10], [68, 10], [67, 12], [69, 12]], crop: 0, veg: ITEM.potato },
        { key: "ogrodek_3", owner: "znachorka", ids: [2213, 2214, 2215, 2216], cells: [[71, 10], [73, 10], [72, 12], [74, 12]], crop: 1, veg: ITEM.carrot }
    ];
    const GARDEN_RULE = { hours: [6, 12], hits: 8, give: 2, opinion: 1, steal: 3, stealOpinion: -5, seeRange: 8, stealGap: 7 };
    const DUMP = { key: "wysypisko", map: 111, x: 70, y: 68, w: 6, h: 4, heaps: [{ id: 2217, x: 72, y: 70, main: true, pat: 0 }, { id: 2218, x: 74, y: 71, pat: 1 }, { id: 2219, x: 70, y: 68, pat: 2 }],
        perDay: 4, shovelBonus: 1,
        loot: [[ITEM.zlom, 30], [ITEM.fiber, 25], [ITEM.nails, 15], [ITEM.planks, 10], [ITEM.moneta, 8], [0, 12]] };
    const CLAYPIT = { key: "glinianka", map: 111, x: 46, y: 69, w: 5, h: 4, id: 2220, ex: 48, ey: 71, occupy: "<Occupy:left=1,right=1,up=1>", perDig: 2, perDay: 6, blanks: [2221, 2222, 2223, 2224] };
    // D31's things in the heap (TownQuests vitems): found while D31 is on, in this order
    const D31_THINGS = ["zas_medalik", "zas_klucz", "zas_moneta_kruk"];

    // ------------------------------------------------------------------
    // A7 the mountains (Map013): the block wall (6 blocks a week) and three ore veins (ChoppableTree mines them; they grow back in 7 days)
    // ------------------------------------------------------------------
    const QUARRY = { key: "kamieniolom_bloki", map: 13, x: 107, y: 80, w: 6, h: 3, ids: [2143, 2144, 2145], at: [[107, 81], [109, 81], [111, 81]],
        perWeek: 6, week: 7, hits: 10, ironHits: 6, cost: 6 };
    const VEINS = [
        { key: "zyla_1", id: 2146, x: 114, y: 78, image: "!$Rock_Ore_Iron_Cluster" },
        { key: "zyla_2", id: 2147, x: 104, y: 88, image: "!$Rock_Ore_Iron_Twin" },
        { key: "zyla_3", id: 2148, x: 111, y: 87, image: "!$Rock_Ore_Iron_Jagged" }
    ];
    const VEIN_RULE = { regrow: 7, note: "<Rock:drop=85,dropmin=1,dropmax=5>" };

    // ------------------------------------------------------------------
    // A8 the coast: the tidal pools (Map125's cove, made by pakiet 0) and the places where the sea throws wood
    // ------------------------------------------------------------------
    const POOLS = [{ key: "kaluza_1", map: 125, id: 2225, x: 15, y: 65 }, { key: "kaluza_2", map: 125, id: 2226, x: 15, y: 67 }];
    const CRAB_RULE = { chance: 0.65, sneakBonus: 0.15, failStamina: 5, flee: 0.5, max: 2 };
    const DRIFT = {
        125: [{ id: 2227, x: 17, y: 66 }, { id: 2228, x: 18, y: 65 }],
        155: [{ id: 2158, x: 3, y: 52 }, { id: 2159, x: 3, y: 56 }, { id: 2160, x: 4, y: 60 }],
        162: [{ id: 2230, x: 2, y: 47 }, { id: 2231, x: 2, y: 50 }, { id: 2232, x: 2, y: 62 }]
    };

    // ------------------------------------------------------------------
    // A9 the burnt orchard of the Ługs (Map168): eight trees, each pruned, dressed and watered on three days, then it lives again
    // ------------------------------------------------------------------
    const ORCHARD = { key: "sad_spalony", map: 168, x: 60, y: 20, w: 12, h: 5, ids: [2169, 2170, 2171, 2172, 2173, 2174, 2175, 2176],
        trees: [[61, 21], [64, 21], [67, 21], [70, 21], [61, 24], [64, 24], [67, 24], [70, 24]],
        pruneHits: 4, leafDays: 10, fruitEvery: 5, fruit: [2, 3], marta: { id: 2177, x: 65, y: 23, hours: [10, 13] }, blanks: [2178, 2179, 2180] };

    // ------------------------------------------------------------------
    // A10 the townsfolk's fields (Map008): day labour at sowing (spring, days 1-10) and harvest (autumn, days 1-14), 6-14
    // ------------------------------------------------------------------
    const FIELDS = [
        { key: "pole_1", x: 6, y: 104, w: 8, h: 4, crop: 3, item: ITEM.barley },
        { key: "pole_2", x: 32, y: 118, w: 8, h: 4, crop: 2, item: ITEM.cabbage },
        { key: "pole_3", x: 62, y: 104, w: 8, h: 5, crop: 0, item: ITEM.potato }
    ];
    const FIELD_RULE = { sow: [1, 10], reap: [1, 14], hours: [6, 14], hits: 20, cost: 2, gold: 15, give: 2, opinion: 1, theft: -4 };

    // ------------------------------------------------------------------
    // The places of the package (Okolice.registerSpots("A", ...); the collision test checks these). jagna_miejsce: a "zone" - she
    // walks, nothing of the package stands there (the plan's index lists it under C by mistake - PLAN_SPOTS)
    // ------------------------------------------------------------------
    const SPOTS = (O ? O.PLAN_SPOTS.filter(s => s.pkg === "A").map(s => Object.assign({}, s)) : []).concat([
        { key: "jagna_miejsce", map: 17, kind: "npc", name: "Miejsce Jagny", mode: "zone", x: 67, y: 15, w: 1, h: 1 }
    ]);

    // the discoveries (Okolice.discoverable; 25 xp each unless said)
    const DISCOVERIES = SPRINGS.map(s => ({ key: s.key, map: s.map, x: s.sx, y: s.sy, near: 1, name: s.name,
        text: "Źródełko (" + s.where + "): daje wodę kilka razy na dzień; w upał wysycha, zimą zamarza." })).concat([
        { key: "zagroda", map: 3, x: 42, y: 52, near: 3, name: "Zagroda Rzepków", text: "Opuszczona zagroda sąsiadów: chata bez dachu, zdziczały ogródek i sucha studnia. Rzepkowie poszli do miasta, kiedy studnia wyschła." },
        { key: "dzikie_ule", map: 3, x: 66, y: 38, near: -1, name: "Dzikie ule", text: "Trzy dziuple z pszczołami w sosnach za murem działki. Miód i wosk co kilka dni - z dymem i nożem, bo pszczoły żądlą." },
        { key: "grzyby_krag1", map: 17, x: 54, y: 44, near: -1, name: "Czarci krąg", text: "Po deszczu grzyby wyrastają tu w kręgu. Nocą w środku coś szepcze. Jagna mówi: grzybnia." },
        { key: "grzyby_krag2", map: 17, x: 63, y: 44, near: -1, name: "Czarci krąg (drugi)", text: "Drugi krąg obok pierwszego. Nocą mgła siada w jego środku." },
        { key: "ziola_jagny", map: 17, x: 67, y: 13, near: 2, name: "Polanka Jagny", text: "Ciche miejsce zielarki: kępy arcydzięgla, dziurawca i kozłka. Nie twoje - chyba że Jagna pozwoli." },
        { key: "wysypisko", map: 111, x: 72, y: 70, near: 2, name: "Wysypisko", text: "Kupa śmieci za chatami Podgrodzia. Złom, szmaty, gwoździe - i czasem coś cenniejszego. Raz na dzień." },
        { key: "glinianka", map: 111, x: 48, y: 71, near: 2, name: "Glinianka", text: "Dół z gliną. Łopatą wykopiesz mokrą glinę na garnki. Po deszczu stoi w nim mętna woda - nie do picia." },
        { key: "kamieniolom_bloki", map: 13, x: 109, y: 82, near: 2, name: "Ściana ciosowa", text: "Dawny kamieniołom bloków: kilofem wyrąbiesz blok kamienny. Ściana daje sześć bloków na tydzień." },
        { key: "zatoczka", map: 125, x: 17, y: 66, near: 2, name: "Zatoczka", text: "Mała zatoczka za przystanią. W odpływie kałuże z krabami, po sztormie morze wyrzuca tu drewno." },
        { key: "sad_spalony", map: 168, x: 65, y: 22, near: 3, name: "Spalony sad", text: "Osiem jabłonek Ługów spaliło się razem z domem. Przycięte, opatrzone i podlane mogą jeszcze ożyć." }
    ]);

    // ------------------------------------------------------------------
    // The texts (Polish, the game's)
    // ------------------------------------------------------------------
    const TX = {
        spring: {
            left: n => (n === 1 ? TX.spring.leftOne : fill(TX.spring.leftN, { n }))
        },
        farm: {
        },
        well: {
            note: n => fill(TX.well.noteN, { n })
        },
        hive: {
        },
        ring: {
        },
        herb: {
        },
        dump: {
        },
        clay: {
        },
        quarry: {
        },
        pool: {
        },
        drift: { },
        orchard: {
        },
        field: {
        },
        garden: {
        },
        needs: { missing: (name, have, n) => fill(TX.needs.missingN, { name, have, n }) }
    };
    Watki.scal(TX, "zasoby", "");   // (its words: js/teksty/zasoby.txt)

    // ------------------------------------------------------------------
    // The quests (TownQuests packs): K55-K58, D30-D31 - texts in TownQuests' format; the engine's handlers (check, vars, cond) are
    // in Zasoby.js (TownQuests.FX)
    // ------------------------------------------------------------------
    const Q_K55 = {
        id: "K55", kind: "K", giver: "dzwonnik", icon: ITEM.wosk,
        offer: {
            cond: { hours: [8, 18], day: 3 }
        },
        steps: [
            { type: "bring", to: "dzwonnik", need: [[ITEM.wosk, 4]], hours: [6, 21] }
        ],
        reward: { gold: 30, xp: 50, opinion: 2 }
    };
    Watki.scal(Q_K55, "zasoby", "zadania.K55");   // (its words: js/teksty/zasoby.txt, zadania.K55)
    const Q_K56 = {
        id: "K56", kind: "K", giver: "znachorka", icon: ITEM.cabbage,
        offer: {
            cond: { hours: [6, 18], day: 4 }
        },
        steps: [
            { type: "custom", check: "k56Dni", vars: "k56Dni", when: { deadline: { day: 7, late: "fail" } } }
        ],
        reward: { gold: 25, xp: 60, opinion: 2, items: [[ITEM.herb, 3]] },
        fail: { opinion: -1 }
    };
    Watki.scal(Q_K56, "zasoby", "zadania.K56");   // (its words: js/teksty/zasoby.txt, zadania.K56)
    const Q_K57 = {
        id: "K57", kind: "K", giver: "grandpa", icon: ITEM.bucket,
        offer: {
            cond: { day: 3, story: true }
        },
        steps: [
            { type: "custom", check: "k57Zagroda" },
            { type: "custom", check: "k57Oczyszczona" },
            { type: "custom", check: "k57Bloki", vars: "k57Bloki" },
            { type: "custom", check: "k57Naprawiona" }
        ],
        reward: { xp: 60 }
    };
    Watki.scal(Q_K57, "zasoby", "zadania.K57");   // (its words: js/teksty/zasoby.txt, zadania.K57)
    const Q_K58 = {
        id: "K58", kind: "K", giver: "praczka", icon: ITEM.wildApple,
        offer: {
            cond: { hours: [5, 17], fn: "k58Gotowe" }
        },
        steps: [
            { type: "custom", check: "k58Sad", vars: "k58Sad" },
            { type: "talk", to: "praczka", hours: [5, 22] }
        ],
        reward: { gold: 40, xp: 120, flag: "zasSadMarta" }
    };
    Watki.scal(Q_K58, "zasoby", "zadania.K58");   // (its words: js/teksty/zasoby.txt, zadania.K58)
    const Q_D30 = {
        id: "D30", kind: "D", giver: "jagna", icon: ITEM.kozlek,
        offer: {
            cond: { hours: [5, 20], fn: "d30Gotowe" }
        },
        steps: [
            { type: "bring", to: "jagna", need: [[ITEM.arcydziegiel, 1]], hours: [5, 21], ch: 1 },
            { type: "bring", to: "jagna", need: [[ITEM.dziurawiec, 1]], hours: [5, 21], ch: 2 },
            { type: "bring", to: "jagna", need: [[ITEM.kozlek, 1]], hours: [5, 21], ch: 3 }
        ],
        reward: { xp: 120, flag: "zasD30" }
    };
    Watki.scal(Q_D30, "zasoby", "zadania.D30");   // (its words: js/teksty/zasoby.txt, zadania.D30)
    const Q_D31 = {
        id: "D31", kind: "D", giver: "szmaciarz", icon: ITEM.moneta,
        offer: {
            cond: { hours: [7, 20], day: 3 }
        },
        steps: [
            { type: "custom", check: "d31Rzeczy", vars: "d31Rzeczy", ch: 1 },
            { type: "bring", to: "szmaciarz", need: [["v:zas_medalik", 1], ["v:zas_klucz", 1], ["v:zas_moneta_kruk", 1]], hours: [7, 22], ch: 2 }
        ],
        reward: { gold: 40, xp: 100, opinion: 3, flag: "zasMonetaKruk" }
    };
    Watki.scal(Q_D31, "zasoby", "zadania.D31");   // (its words: js/teksty/zasoby.txt, zadania.D31)

    const VITEMS = {
        zas_medalik: { icon: 314 },
        zas_klucz: { icon: 195 },
        zas_moneta_kruk: { icon: 473 }
    };
    Watki.scal(VITEMS, "zasoby", "rzeczy");   // (its words: js/teksty/zasoby.txt, rzeczy)
    const REMARKS = [
        { id: "zasJadwigaJagna", who: "znachorka", flag: "zasD30" },
        { id: "zasFranekSad", who: "franek", flag: "zasSadMarta" },
        { id: "zasKleofasMoneta", who: "pustelnik", flag: "zasMonetaKruk" }
    ];
    Watki.scal(REMARKS, "zasoby", "uwagi");   // (its words: js/teksty/zasoby.txt, uwagi)
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Zasoby", quests: [Q_K55, Q_K56, Q_K57, Q_K58, Q_D30, Q_D31], vitems: VITEMS, remarks: REMARKS });

    // ------------------------------------------------------------------
    // Babka Jagna into TownLife (the second range of ids) and her places on Map017
    // ------------------------------------------------------------------
    (window.TownLifeExtra = window.TownLifeExtra || []).push(JAGNA);
    const TLD = window.TownLifeData;
    if (TLD) {
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        TLD.SPOTS_BY_MAP[17] = Object.assign({}, TLD.SPOTS_BY_MAP[17] || {}, JAGNA_SPOTS);
    }

    // ------------------------------------------------------------------
    // The quest board: four notices (keys "zas_") and the worth of the new items
    // ------------------------------------------------------------------
    const QB_TEMPLATES = [
        { id: "zas_dziki_miod", type: "gather", giver: "melia", seasons: [1, 2],
            req: [{ item: ITEM.honey, n: [T(2, 2), T(2, 3), T(3, 4), null, null] }] },
        { id: "zas_ziola_rzadkie", type: "gather", giver: "jagna", seasons: [0, 1, 2], from: 6,
            req: [{ item: ITEM.kozlek, n: [null, T(1, 1), T(1, 2), T(2, 2), null] }] },
        { id: "zas_bloki", type: "gather", giver: "kazimierz", from: 8,
            req: [{ item: ITEM.blok, n: [null, T(2, 2), T(2, 3), T(3, 4), null] }] },
        { id: "zas_kraby", type: "craft", giver: "borgar", from: 5,
            req: [{ item: ITEM.krabPieczony, n: [T(2, 2), T(2, 3), T(3, 3), null, null] }] }
    ];
    Watki.scal(QB_TEMPLATES, "zasoby", "tablica", "id");   // (its words: js/teksty/zasoby.txt, tablica, by the id)
    const QB_EV = { 185: 4, 186: 5, 187: 8, 188: 6, 189: 2, 190: 6, 191: 6, 192: 5, 193: 3, 194: 5, 195: 8, 196: 8 };
    (function questBoard() {
        const TW = window.Tawerna, QBP = TW && TW.api("QuestBoard_parts"), data = QBP && QBP.data;
        if (!data || !Array.isArray(data.TEMPLATES)) return;
        for (const t of QB_TEMPLATES) if (!data.TEMPLATES.some(o => o.id === t.id)) data.TEMPLATES.push(t);
        if (data.EV) for (const k of Object.keys(QB_EV)) if (data.EV[k] === undefined) data.EV[k] = QB_EV[k];
    })();

    // Jagna's bust (tools/busts: Jagna_Bust in img/pictures - kit.py, 0 generations)
    (function bust() {
        const SB = window.SpeechBubbles;
        if (SB && SB.BUSTS && !SB.BUSTS["$Npc_Jagna:0"]) SB.BUSTS["$Npc_Jagna:0"] = "Jagna_Bust";
    })();

    // (2026-10-22, integration) the lines of the epilogue after the Heart (Underground.js asks Zasoby.epilogue): one or two by what the hero did
    const EPILOG = {
    };
    Watki.scal(EPILOG, "zasoby", "epilog");   // (its words: js/teksty/zasoby.txt, epilog)
    window.ZasobyData = { EPILOG, VERSION, PKG: "A", OWNER: "Zasoby", STATE: "zasoby", IDS_RANGE: P ? P.ids : [2100, 2299], RESIDENTS: P ? P.residents : [2900, 2904],
        ITEMS: P ? P.items : [185, 199], ICONS: P ? P.icons : [464, 479], SWITCHES: { studnia: 21, rez: 22 }, ITEM, ICON, IDS,
        SPRINGS, SPRING_RULE, FARMSTEAD, HIVES, HIVE_RULE, RINGS, HERBS, GLADE, JAGNA, JAGNA_SPOTS, JAGNA_BUYS, JAGNA_BUY_TX, GARDENS, GARDEN_RULE, DUMP, CLAYPIT, D31_THINGS,
        QUARRY, VEINS, VEIN_RULE, POOLS, CRAB_RULE, DRIFT, ORCHARD, FIELDS, FIELD_RULE, SPOTS, DISCOVERIES, TX,
        QUESTS: [Q_K55, Q_K56, Q_K57, Q_K58, Q_D30, Q_D31], QB_TEMPLATES, QB_EV, ready: true };
})();
