//=============================================================================
// TownQuests_Data.js
//=============================================================================
// The town's quests (docs/QUESTY.md, user 2026-10-04: "zrób to wszystko co tylko możesz"): who gives them, when, what is said, the
// steps, the rewards - and the town's opinion of the hero ("Opinia w miasteczku"), its greetings, the market day, the calendar and
// the bell signals. TownQuests.js reads it; it stands right above it in the plugin list. Only data here (and texts) - the logic is
// in TownQuests.js; a quest that needs something special names a handler there (talk / tick / check / fx).
//
// A QUEST
//   id, kind ("K" short, "D" long, "W" arc), title, giver (a TownLife resident key, "lord" / "grandpa" = Story's people, null = it
//   starts by itself), icon (an item id: the journal's icon), where, when (journal texts), desc (what it is about)
//   offer:  { cond, say: [lines], yes, no, accept: [lines], decline: [lines], options: [...] (instead of yes / no), gives, vgives }
//           an option: { label, then: "accept" | "decline" | "refuse" (never again) | "close" (done at once), step, say, reward,
//           need (taken), cost (gold paid), flag, fx }; offer.pay: gold the giver pays at once; gives / vgives: handed over
//   lines:  { ... } the texts of a quest's own handler (TownQuests.js FX); react: K17's reactions
//   steps:  [ step, ... ] - one at a time; the journal shows the current one's `text`
//   reward: { gold, xp, opinion, items: [[id, n]], note: [title, text], clue, flag, opinionFirst (only the first time) }
//   fail:   { opinion, text } - a deadline missed
//   repeat: "daily" - can be taken again the next day
// A STEP
//   type:   bring (give `need` to `to`), talk (talk to `to`), spot (the quest's place on a map: SPOTS), wait (time passes), kill,
//           custom (a handler in TownQuests.js), pause (the arc waits for the author: "ciąg dalszy wkrótce")
//   when:   hours [a, b] (b < a: over midnight), dayRel n (n days after the step began), dayIs (that day), after [step, days] (that
//           many days after step `step` was done), clear (no rain), deadline { day (from the step's day) | abs, hour, late:
//           "fail" | "next" }
//   needs:  need [[itemId | "v:key", n]] (taken), needAny [[[...]], ...] (the first one the hero has), tools [[id, n]] (shown, kept),
//           water n (portions of the hero's own rain water, given away), showWater n (shown, kept), gold n (paid)
//   lines:  say (the speaker's), hero (the hero's, before), done (after), remind (not ready), early (not the time)
//   then:   gives [[id, n]], vgives { key: n }, reward, choice { ask: [lines], options: [{ label, say, reward, flag, fx }] }
// LINES: a string is said by the one spoken to; "> text" by the hero; "@key: text" by another resident (or "@lord", "@grandpa").
//   {gold}, {n}, {left}... are filled from the quest's numbers.
// (2026-10-05) autoStart: a quest with no offer that starts by itself when its handler (FX[autoStart]) says so (K37: the theft);
//   a step's ch: the arc's chapter shown in the journal (W1, W2: some chapters have more than one step); wet: a spot step's popup in
//   the rain. REMARKS: what a resident says once, the first talk after something happened (a flag) - before the greeting.
//
// DROUGHT (the user's rule): no quest, choice or resident gives the hero water - quests only ever TAKE the hero's own rain water.

/*:
 * @target MZ
 * @plugindesc Dane questów miasteczka: zadania, rozmowy, nagrody, Opinia w miasteczku, dzień targowy, kalendarz, sygnały dzwonu (dla TownQuests.js). v1.0.0
 * @author Claude
 * @help Same dane - działa z TownQuests.js (ma stać nad nim na liście wtyczek).
 */

(() => {
    "use strict";

    // ------------------------------------------------------------------
    // "Opinia w miasteczku" 0-100 (separate from "Sława w tawernie" of the quest board)
    // ------------------------------------------------------------------
    const OPINION = {
        start: 10,
        tiers: [
            { at: 0 },
            { at: 20 },
            { at: 40 },
            { at: 60 },
            { at: 80 }
        ]
    };
    Watki.scal(OPINION, "miasto", "opinia");   // (its words: js/teksty/miasto.txt, opinia)

    // the first talk of the day: a greeting by the opinion's tier (0..4), then the resident's usual line
    const GREET = {
        any: [[], [], [],
            [], []],
        kowal: [[], [], [], [], []],
        piekarka: [[], [], [], [], []],
        woziwoda: [[], [], [], [], []],
        kapral: [[], [], [], [], []],
        dzwonnik: [[], [], [], [], []],
        kupiec: [[], [], [], [], []],
        soltys: [[], [], [], [], []],
        garbarz: [[], [], [], [], []],
        feliks: [[], [], [], [], []],
        bronek: [[], [], [], [], []],
        zosia: [[], [], [], [], []],
        ludmila: [[], [], [], [], []],
        ela: [[], [], [], [], []],
        rafal: [[], [], [], [], []],
        zlodziej: [[], [], [], [], []],
        gracz: [[], [], [], [], []],
        bartek: [[], [], [], [], []],
        woznica: [[], [], [], [], []],
        straznik: [[], [], [], [], []]
    };
    Watki.scal(GREET, "miasto", "powitania");   // (its words: js/teksty/miasto.txt, powitania)

    // ------------------------------------------------------------------
    // The market day (every 7 days: 7, 14, 21...) - more calls round the stalls
    // ------------------------------------------------------------------
    const MARKET = {
        every: 7, hours: [6, 14],
        barks: {
        }
    };
    Watki.scal(MARKET, "miasto", "targ");   // (its words: js/teksty/miasto.txt, targ)

    // ------------------------------------------------------------------
    // The calendar: the ferry every 3 days (the quest board's new notices come with it), the bigger dated days (docs/QUESTY.md 5.4).
    // `wait`: what the day still waits for (a map, characters) - the journal says it; nothing happens in the game yet.
    // ------------------------------------------------------------------
    const CALENDAR = {
        ferryEvery: 3,
        events: [
            { day: 10 },
            { day: 24 },
            { day: 33 },
            { day: 38 },
            { day: 42 },
            { day: 52 },
            { day: 56 }
        ]
    };
    Watki.scal(CALENDAR, "miasto", "kalendarz");   // (its words: js/teksty/miasto.txt, kalendarz)

    // ------------------------------------------------------------------
    // The bell's signals (W2 "Kod dzwonu"): what the hero can hear and note. `when`: what goes on at that moment.
    // ------------------------------------------------------------------
    const SIGNALS = {
        "3": { name: "trzy o trzeciej", pattern: [3], when: "Głęboka noc, miasto śpi. Ambroży dzwoni co noc, choć nikt go o to nie prosi.", meaning: "nocna straż: wszystko spokojnie" },
        "1-1-1-1": { name: "cztery pojedyncze", pattern: [1, 1, 1, 1], when: "Jedenasta w nocy: kapral Wit kończy obchód murów i wraca do bramy.", meaning: "zmiana warty" },
        "4+2": { name: "cztery i dwa", pattern: [4, 2], when: "Pierwszy deszcz po kilku dniach suszy.", meaning: "woda idzie" },
        "2+2+2": { name: "trzy razy po dwa", pattern: [2, 2, 2], when: "Burza - piorun uderzył niedaleko.", meaning: "ogień" },
        // (2026-10-05, W2 rozdz. 5-6: the rest of the Book of Signals; "pytanie" the hero rings himself at noon)
        "3+1": { name: "trzy i jeden", pattern: [3, 1], when: "Ktoś obcy kręci się nocą przy murach - puka do kantoru po północy.", meaning: "obcy w murach" },
        "5": { name: "pięć", pattern: [5], when: "Nocą ktoś otwiera bramę - wóz wjeżdża albo wyjeżdża.", meaning: "brama otwarta nocą" },
        "pytanie": { name: "siedem", pattern: [7], when: "Siedem uderzeń: w samo południe z wieży albo o północy w Noc Pytania.", meaning: "pytanie - wezwanie dla strażników zakonu" }
    };

    // things carried that are not items of the database (letters, a horseshoe, a crate...): the journal and the needs show them
    const VITEMS = {
        podkowa: { icon: 342 },
        bochen: { icon: 339 },
        list: { icon: 0 },
        petycja: { icon: 0 },
        skrzynia: { icon: 0 },
        podkowy: { icon: 342 },
        cwieki: { icon: 344 },
        zagiel: { icon: 348 },   // (2026-10-14, D20: the harbour)
        obwieszczenie: { icon: 0 },
        koszyki: { icon: 0 },
        lek: { icon: 0 },
        plaszcze: { icon: 368 },
        rysunek: { icon: 191 },
        pierscionek: { icon: 145 },
        sakiewka: { icon: 208 },
        kroniki: { icon: 189 },
        // (2026-10-06, the tavern's regulars)
        struna: { icon: 199 },
        czapka: { icon: 130 },
        pas: { icon: 148 },
        // (2026-10-06, W4) the castellan's key: two halves, then one
        klucz_borgar: { icon: 197 },
        klucz_kopiec: { icon: 198 },
        klucz_kasztelana: { icon: 195 },
        // (2026-10-07, W6 rozdz. 7) Ludmiła's kerchief for Marek: the horse Ela stitched on it
        chusta: { icon: 367 }
    };
    Watki.scal(VITEMS, "miasto", "rzeczy");   // (its words: js/teksty/miasto.txt, rzeczy)

    // the quests' places: events put into the maps (Tawerna.inject, ids 951-959 - the same id may serve another map). Shown and
    // usable only while a quest needs them (self switch A). wall: true - it is a wall / a window (O facing it); deco: a little
    // picture drawn on it (paper - a notice, glint - something shining, tracks - paw prints, doused - a drowned fire basket)
    const SPOTS = {
        bakery_window: { map: 8, id: 951, x: 38, y: 73, name: "Hanka (zza okienka)" },
        notice_tavern: { map: 8, id: 952, x: 52, y: 16, name: "Ściana tawerny", wall: true, deco: "paper", owner: null },
        notice_bakery: { map: 8, id: 953, x: 39, y: 73, name: "Ściana piekarni", wall: true, deco: "paper", owner: "piekarka" },
        notice_smithy: { map: 8, id: 954, x: 9, y: 62, name: "Ściana kuźni", wall: true, deco: "paper", owner: "kowal" },
        notice_kantor: { map: 8, id: 955, x: 19, y: 47, name: "Ściana kantoru", wall: true, deco: "paper", owner: "kupiec" },
        south_gate: { map: 8, id: 956, x: 53, y: 93, name: "Pod bramą południową", deco: "tracks" },
        watch_post: { map: 8, id: 957, x: 53, y: 28, name: "Posterunek przy bramie twierdzy" },
        east_brazier: { map: 8, id: 958, x: 101, y: 49, name: "Kosz żarowy", wall: true, deco: "doused" },
        horseshoe: { map: 22, id: 951, x: 20, y: 14, name: "Polna droga", deco: "glint" },
        // (2026-10-05) the places another agent built for these quests (docs/miasta_miejsca_zadan.md - on their "Miejsce:" markers):
        // Map118 "Dno studni", Map024 the orangery of the manor's garden, Map119 "Archiwum zakonu". img: [sheet, index, direction,
        // pattern] - a picture on the place's page (the ring's glint; Feliks and Kuba at the back gate at night); solid: it blocks (a
        // person); nomark: no yellow diamond over it
        k26_ring: { map: 118, id: 951, x: 5, y: 6, name: "Błysk w kałuży", img: ["!Quest_Places", 0, 2, 2] },
        w1_grate: { map: 118, id: 952, x: 5, y: 4, name: "Krata z krukiem" },
        // (2026-10-12) the user rebuilt the manor's garden (Map024): the pump, the gardener's table, the back gate and their markers are
        // gone - "to, co zmieniłem, ma zostać". The scene now uses what the garden has: the wooden hatch in the grass behind the orangery,
        // under the pine (the user's event at 3,20 - the raven is on its bolt), the orange tree's planter by the orangery's door (8,24 - a
        // loose board, the drawing under it), Feliks and Kuba by the hatch at night (Kuba is let in through the main gate - Wit takes his
        // cut). Own coordinates, no markers: the hero stands on the place (O) or faces it
        w1_pump: { map: 24, id: 951, x: 3, y: 21, name: "Właz z krukiem" },
        w1_drawer: { map: 24, id: 952, x: 8, y: 25, name: "Skrzynia drzewka pomarańczy" },
        w1_feliks: { map: 24, id: 953, x: 2, y: 20, name: "Feliks", img: ["$Npc_Feliks", 0, 6, 1], solid: true, nomark: true },
        w1_kuba: { map: 24, id: 954, x: 3, y: 19, name: "Kuba Woziwoda", img: ["$Npc_Woziwoda", 0, 2, 1], solid: true, nomark: true },
        w2_book: { map: 119, id: 951, x: 6, y: 6, name: "Księga sygnałów" },
        w2_chron: { map: 119, id: 952, x: 10, y: 5, name: "Kroniki zakonu" },
        // (2026-10-06) W3 a: Melia by the Kupała bonfire before the south gate (only that night; bust: her own)
        // (2026-10-06) W4: where the other half of the key lies - at the foot of the stone cairn in grandpa's yard (Map020, the cairn 8,5)
        w4_dig: { map: 20, id: 951, x: 8, y: 6, name: "Kopiec z krukiem", deco: "dig" },
        w3_kupala: { map: 8, id: 959, x: 51, y: 90, name: "Melia Srebrogłosa", img: ["$Npc_Melia", 0, 2, 1], solid: true, nomark: true, bust: "People2_8" },
        // (2026-10-06) W8 in the mountains: on the maps agent's markers ("Miejsce: <marker>" - docs/miasta_miejsca_zadan.md "Góry"; dx/dy
        // shift; x/y only a fallback) - Grum as a picture with his bust at each place, the commander's crate in the diggers' camp
        w8_start: { map: 13, id: 951, marker: "grum_przewodnik_start", x: 4, y: 38, name: "Grum", img: ["$Npc_Grum", 0, 4, 1], solid: true, bust: "Actor2_5" },
        w8_quarry: { map: 13, id: 952, marker: "kamieniolom_znak", dx: 1, x: 41, y: 18, name: "Grum", img: ["$Npc_Grum", 0, 8, 1], solid: true, bust: "Actor2_5" },
        w8_gate: { map: 13, id: 953, marker: "osada_brama", dx: 1, x: 7, y: 4, name: "Grum", img: ["$Npc_Grum", 0, 8, 1], solid: true, bust: "Actor2_5" },
        w8_cave: { map: 14, id: 951, marker: "marek", dx: -2, dy: 1, x: 28, y: 6, name: "Grum", img: ["$Npc_Grum", 0, 6, 1], solid: true, bust: "Actor2_5" },
        w8_crate: { map: 14, id: 952, marker: "list_kryjowka", x: 27, y: 11, name: "Skrzynia dowódcy" },
        w8_osada: { map: 120, id: 951, marker: "osada_grum", x: 21, y: 25, name: "Grum", img: ["$Npc_Grum", 0, 8, 1], solid: true, bust: "Actor2_5" },
        // (2026-10-07) W6 "Ludzie z promu". Ids 903-909 (TownQuests' second range - Map008's 951-959 are all taken): the props of the
        // ferry people's camp - shown while FX[show].show() says so (no quest step needed, no diamond): the first wave's tent and fire
        // under the wall (from day 10, while the camp is in the town), the second wave (day 24): a tent more and Bogdan and Halina
        // (PixelLab, the hero's style, standing) - in the town, or in Podgrodzie (Map111) when the town shut its gate; on grandpa's
        // field (Map003) the two of them work the week of the work duty (`at`: their cells next to the crops). note: added to the
        // event's note (Occupy - the tent's footprint); light: added only while shown when the map loads (the camp's fire: a flame);
        // step: an animated picture. talkFx: what the action button says (FX[talkFx].spot). The hiding places of Rafał (W6 rozdz. 4 a)
        // are ordinary quest places (951) on the guest rooms (Map025), grandpa's house (Map019) and the bell tower (Map108).
        w6_tent1: { map: 8, id: 903, x: 58, y: 92, name: "Namiot uchodźców", img: ["!$Mt_Tent", 0, 2, 1], solid: true, nomark: true, show: "w6Camp", talkFx: "w6Prop",
            note: "<Occupy:left=1,right=1,up=1>" },
        w6_fire: { map: 8, id: 905, x: 59, y: 90, name: "Ognisko obozu", img: ["!Decoration", 2, 4, 0], solid: true, nomark: true, step: true, show: "w6Camp", talkFx: "w6Prop",
            light: "<Light:190,255,150,70><LightFlicker:0.18,255,110,40><LightHeight:20>" },
        w6_tent2: { map: 8, id: 904, x: 46, y: 90, name: "Namiot uchodźców", img: ["!$Mt_Tent", 0, 2, 0], solid: true, nomark: true, show: "w6Second", talkFx: "w6Prop",
            note: "<Occupy:left=1,right=1,up=1>" },
        w6_bogdan: { map: 8, id: 906, x: 50, y: 90, name: "Bogdan", img: ["$Npc_Bogdan", 0, 4, 1], solid: true, nomark: true, show: "w6Second", talkFx: "w6Prop" },
        w6_halina: { map: 8, id: 907, x: 56, y: 91, name: "Halina", img: ["$Npc_Halina", 0, 6, 1], solid: true, nomark: true, show: "w6Second", talkFx: "w6Prop" },
        w6_tent2_o: { map: 111, id: 903, x: 42, y: 11, name: "Namiot uchodźców", img: ["!$Mt_Tent", 0, 2, 0], solid: true, nomark: true, show: "w6Second", talkFx: "w6Prop",
            note: "<Occupy:left=1,right=1,up=1>" },
        w6_bogdan_o: { map: 111, id: 906, x: 38, y: 12, name: "Bogdan", img: ["$Npc_Bogdan", 0, 2, 1], solid: true, nomark: true, show: "w6Second", talkFx: "w6Prop" },
        w6_halina_o: { map: 111, id: 907, x: 42, y: 14, name: "Halina", img: ["$Npc_Halina", 0, 4, 1], solid: true, nomark: true, show: "w6Second", talkFx: "w6Prop" },
        w6_help1: { map: 3, id: 906, x: 20, y: 26, at: "w6Helper", name: "Bogdan", img: ["$Npc_Bogdan", 0, 2, 1], solid: true, nomark: true, show: "w6Work", talkFx: "w6Prop" },
        w6_help2: { map: 3, id: 907, x: 22, y: 26, at: "w6Helper", name: "Halina", img: ["$Npc_Halina", 0, 2, 1], solid: true, nomark: true, show: "w6Work", talkFx: "w6Prop" },
        w6_hide_tavern: { map: 25, id: 951, x: 40, y: 38, name: "Rafał", img: ["$Npc_Rafal", 0, 4, 1], solid: true, nomark: true },
        w6_hide_grandpa: { map: 19, id: 951, x: 17, y: 6, name: "Rafał", img: ["$Npc_Rafal", 0, 2, 1], solid: true, nomark: true },
        w6_hide_belfry: { map: 108, id: 951, x: 8, y: 5, name: "Rafał", img: ["$Npc_Rafal", 0, 2, 1], solid: true, nomark: true },
        // (2026-10-14) the harbour (Map125, tools/przystan): D20 - the cutter's wreck on the beach, dragged onto the slipway at dawn
        przystan_wrak: { map: 125, id: 951, marker: "d20_wrak", x: 18, y: 35, name: "Wrak kutra" }
    };

    // W1 rozdz. 6 a/b: the sluice half open - the market well's ration (<Studnia:2>) gives this many draws a day more
    // (Farming_Plots.rationOf asks TownQuests.wellBonus). 0: the well stays as it is - the user 2026-10-05: "Dalej 2 dziennie" (the
    // mill runs again, the market well still gives little)
    const WELL_BONUS = 0;

    // what a resident says once - the first talk after something happened (a flag of the quests); gone: only while that resident is
    // away (TownLife.setGone), back: only once that resident is back
    const REMARKS = [
        { id: "kubaFledPiek", who: "piekarka", flag: "kubaFled", gone: "woziwoda" },
        { id: "kubaFledKowal", who: "kowal", flag: "kubaFled", gone: "woziwoda" },
        { id: "kubaFledKupiec", who: "kupiec", flag: "kubaFled", gone: "woziwoda" },
        { id: "kubaBack", who: "woziwoda", flag: "kubaFled", back: "woziwoda" },
        // (2026-10-17, W7: lordAlly comes also from the truth of W7 - Feliks's letters - so Kuba's and the guard's lines of W1's quiet way
        // ask W1 b's own flag kubaResent)
        { id: "kubaResent", who: "woziwoda", flag: "kubaResent" },
        { id: "kubaReveal", who: "woziwoda", flag: "w1Revealed" },
        { id: "witDegraded", who: "kapral", flag: "witDegraded" },
        { id: "soltysReveal", who: "soltys", flag: "w1Revealed" },
        { id: "hankaMill", who: "piekarka", flag: "millRuns" },
        { id: "guardLordW7", who: "straznik", flag: "kubaResent", and: "w7Prawda" },
        { id: "guardRevealW7", who: "straznik", flag: "w1Revealed", and: "w7Prawda" },
        { id: "guardLord", who: "straznik", flag: "kubaResent", unless: "w7Prawda" },
        { id: "guardReveal", who: "straznik", flag: "w1Revealed", unless: "w7Prawda" },
        { id: "kapralK37", who: "kapral", flag: "k37Seen" },
        { id: "szymekFree", who: "zlodziej", flag: "szymekFree" },
        { id: "bartekShare", who: "bartek", flag: "lucjanShare" },
        // (2026-10-06) the tavern's regulars and what they hear
        { id: "grumD6Won", who: "grum", flag: "d6Won" },
        { id: "grumD6Sold", who: "grum", flag: "d6Sold" },
        { id: "kupiecD6Crossed", who: "kupiec", flag: "d6Crossed" },
        { id: "kowalD6Won", who: "kowal", flag: "d6Won" },
        { id: "hankaOven", who: "piekarka", flag: "d13Oven" },
        { id: "grumD13", who: "grum", flag: "d13Done" },
        { id: "meliaBurned", who: "melia", flag: "w3Burned" },
        { id: "meliaSung", who: "melia", flag: "w3Sung" },
        { id: "ozzyCapGrum", who: "grum", flag: "k33Cap" },
        // (2026-10-06) W1 rozdz. 6 c - the ambush on Polna droga as a fight - and rozdz. 7, the cistern's sluice opened by the bell
        { id: "feliksAmbushWon", who: "feliks", flag: "w1AmbushWon" },
        { id: "feliksRobbed", who: "feliks", flag: "w1Robbed" },
        { id: "kapralAmbushWon", who: "kapral", flag: "w1AmbushWon" },
        { id: "soltysCistern", who: "soltys", flag: "cisternOpen" },
        { id: "kubaCistern", who: "woziwoda", flag: "cisternOpen" },
        { id: "hankaCistern", who: "piekarka", flag: "cisternOpen" },
        { id: "tadekCistern", who: "kowal", flag: "cisternOpen" },
        { id: "ambrozyCistern", who: "dzwonnik", flag: "cisternOpen" },
        { id: "baltazarCistern", who: "kupiec", flag: "cisternOpen" },
        { id: "feliksCistern", who: "feliks", flag: "cisternOpen" },
        // (2026-10-06) W9 rozdz. 6: what follows a truth told
        { id: "ludmilaLoaf", who: "ludmila", flag: "w9Loaf" },
        { id: "elaLullaby", who: "ela", flag: "w9Lullaby" },
        { id: "zosiaBell", who: "zosia", flag: "w9Bell" },
        // (2026-10-07) W6 "Ludzie z promu": what the town says after Rafał's fate, the vote, the Wigilia, Marek
        { id: "ludmilaGiven", who: "ludmila", flag: "rafalGiven" },
        { id: "elaGiven", who: "ela", flag: "rafalGiven" },
        { id: "kapralGiven", who: "kapral", flag: "rafalGiven" },
        { id: "ludmilaAlly", who: "ludmila", flag: "rafalAlly" },
        { id: "rafalAlly", who: "rafal", flag: "rafalAlly" },
        { id: "ludmilaSmuggled", who: "ludmila", flag: "rafalSmuggled" },
        { id: "kupiecSmuggled", who: "kupiec", flag: "rafalSmuggled" },
        { id: "ludmilaTaken", who: "ludmila", flag: "rafalTaken" },
        { id: "kapralTaken", who: "kapral", flag: "rafalTaken" },
        { id: "soltysOutside", who: "soltys", flag: "campOutside" },
        { id: "soltysInside", who: "soltys", flag: "campInside" },
        { id: "kubaInside", who: "woziwoda", flag: "campInside" },
        { id: "kubaOutside", who: "woziwoda", flag: "campOutside" },
        { id: "hankaWigilia", who: "piekarka", flag: "w6Wigilia" },
        { id: "grumMarek", who: "grum", flag: "marekSaved" },
        { id: "soltysMarek", who: "soltys", flag: "marekSaved" }
    ];
    Watki.scal(REMARKS, "miasto", "uwagi", "id");   // (its words: js/teksty/miasto.txt, uwagi, by the id)

    // K39: Lucjan Kość as a rival of TavernDice (put into TavernDice.OPPONENTS when the hero sits down with him - never at the
    // tavern's table): he always plays his loaded die (the lucky one's weights: ones far more often)
    const LUCJAN = {
        style: "szuler", styleColor: "#e0a85a",
        bust: "Gracz_Bust", sheet: null, index: 0,
        hours: [0, 24], stakes: [5], perDay: 3,
        ai: { bank: [0, 350, 400, 500, 800, 1800, Infinity], reckless: 0.05, chase: 1.7 },
        die: { key: "szczesciarz", chance: 1 },
        lines: {
        }
    };
    Watki.scal(LUCJAN, "miasto", "lucjan");   // (its words: js/teksty/miasto.txt, lucjan)

    // K5: what each one says when the bread comes (one a day, in turn) - the first time it goes into the journal
    const GOSSIP = {
        dzwonnik: [],
        kapral: [],
        ludmila: [],
        soltys: []
    };
    Watki.scal(GOSSIP, "miasto", "plotki");   // (its words: js/teksty/miasto.txt, plotki)

    // D17: what each one says when signing; the ones who will not
    const SIGN = {
    };
    Watki.scal(SIGN, "miasto", "podpisy");   // (its words: js/teksty/miasto.txt, podpisy)

    // ------------------------------------------------------------------
    // THE QUESTS
    // ------------------------------------------------------------------
    const H_KOWAL = [5.5, 17], H_PIEK = [6, 14], H_KUBA = [7, 14], H_WIT = [6, 18], H_PATROL = [18, 23], H_IGNAC = [6.5, 17];
    const QUESTS = [
        // =========================================================== K1
        {
            id: "K1", kind: "K", giver: "kowal", icon: 79,
            offer: {
                cond: { hours: H_KOWAL, day: 2 }
            },
            steps: [
                { type: "bring", to: "kowal", need: [[79, 5]], hours: H_KOWAL, fx: "k1Early" }
            ],
            reward: { gold: 15, xp: 50, opinion: 2 }
        },
        // =========================================================== K2
        {
            id: "K2", kind: "K", giver: "kowal", icon: 138,
            offer: {
                cond: { hours: H_KOWAL, day: 3, dry: 3 },
                options: [
                    { then: "accept" },
                    { then: "refuse" },
                    { then: "decline" }
                ]
            },
            steps: [
                { type: "bring", to: "kowal", water: 2, hours: H_KOWAL,
                    choice: { options: [
                        { reward: { gold: 25 } },
                        { reward: { items: [[88, 6]] } }
                    ] } }
            ],
            reward: { xp: 50, opinion: 3 }
        },
        // =========================================================== K3
        {
            id: "K3", kind: "K", giver: "kowal", icon: 86,
            offer: {
                cond: { hours: H_KOWAL, day: 2 }
            },
            steps: [
                { type: "spot", spot: "horseshoe", hours: [11, 14], clear: true, vgives: { podkowa: 1 } },
                { type: "bring", to: "kowal", need: [["v:podkowa", 1]], hours: H_KOWAL }
            ],
            reward: { gold: 10, xp: 50, opinion: 1 }
        },
        // =========================================================== K4
        {
            id: "K4", kind: "K", giver: "piekarka", icon: 61,
            offer: {
                cond: { hours: H_PIEK, day: 2 }
            },
            steps: [
                { type: "spot", spot: "bakery_window", dayRel: 1, hours: [3.5, 5], need: [[61, 4]],
                    deadline: { day: 1, hour: 5, late: "fail" } }
            ],
            reward: { gold: 8, items: [[83, 2]], xp: 50, opinion: 2 },
            fail: { opinion: -1 }
        },
        // =========================================================== K5
        {
            id: "K5", kind: "K", giver: "piekarka", icon: 83, repeat: "daily",
            offer: {
                cond: { hours: [6, 8.5] },
                vgives: { bochen: 4 }
            },
            steps: [
                { type: "custom", talk: "k5", targets: ["dzwonnik", "kapral", "ludmila", "soltys"], deadline: { day: 0, hour: 9, late: "fail" } },
                { type: "talk", to: "piekarka", hours: H_PIEK }
            ],
            reward: { gold: 12, xp: 20, opinionFirst: 1 },
            fail: { opinion: -1 }
        },
        // =========================================================== K6
        {
            id: "K6", kind: "K", giver: "piekarka", icon: 74,
            offer: {
                cond: { hours: H_PIEK, season: [1, 2] }
            },
            steps: [
                { type: "bring", to: "piekarka", need: [[74, 4]], hours: H_PIEK }
            ],
            reward: { gold: 10, items: [[136, 1]], xp: 50, opinion: 2 }
        },
        // =========================================================== K8
        {
            id: "K8", kind: "K", giver: "woziwoda", icon: 80,
            offer: {
                cond: { hours: H_KUBA, day: 2 }
            },
            steps: [
                { type: "bring", to: "woziwoda", need: [[80, 2], [88, 4]], tools: [[89, 1]], hours: H_KUBA, se: "Hammer" }
            ],
            reward: { gold: 10, xp: 50, opinion: 1, clue: "w1_barrel" }
        },
        // =========================================================== K9
        {
            id: "K9", kind: "K", giver: "woziwoda", icon: 0,
            offer: {
                cond: { hours: [7, 8.5], dry: 3, day: 3 },
                options: [
                    { then: "close", reward: { opinion: 3, xp: 50, items: [[131, 1]] },
                        fx: "k9Fair" },
                    { then: "close", reward: { opinion: -2, xp: 20 },
                        fx: "k9Dice" },
                    { then: "decline" }
                ]
            },
            steps: []
        },
        // =========================================================== K10
        {
            id: "K10", kind: "K", giver: "garbarz", icon: 129,
            offer: {
                cond: { hours: H_IGNAC }
            },
            steps: [
                { type: "bring", to: "garbarz", showWater: 1, hours: H_IGNAC }
            ],
            reward: { xp: 40, opinion: 1, clue: "w1_roses" }
        },
        // =========================================================== K11
        {
            id: "K11", kind: "K", giver: "kapral", icon: 61,
            offer: {
                cond: { hours: H_WIT },
                options: [
                    { then: "close", cost: 2, flag: "witKnows", reward: { xp: 20 } },
                    { then: "accept" },
                    { then: "decline" }
                ]
            },
            steps: [
                { type: "bring", to: "kapral", need: [[61, 6]], hours: H_WIT }
            ],
            reward: { xp: 50, opinion: 1, flag: "witKnows" }
        },
        // =========================================================== K12
        {
            id: "K12", kind: "K", giver: "kapral", icon: 59,
            offer: {
                cond: { hours: H_PATROL, day: 2 }
            },
            steps: [
                { type: "bring", to: "kapral", needAny: [[[159, 1]], [[157, 1]], [[59, 2]]], anyRewards: [{ items: [[59, 2]] }, { items: [[59, 2]] }, { gold: 8 }],
                    hours: H_PATROL }
            ],
            reward: { xp: 50, opinion: 1, clue: "w1_night" }
        },
        // =========================================================== K13
        {
            id: "K13", kind: "K", giver: "dzwonnik", icon: 93,
            offer: {
                cond: { hours: [6.3, 11.5], day: 2 }
            },
            steps: [
                { type: "bring", to: "dzwonnik", need: [[93, 2]], hours: [6.3, 12.3], deadline: { day: 0, hour: 12, late: "fail" } }
            ],
            reward: { gold: 10, xp: 50, opinion: 2 },
            fail: { opinion: -1, fx: "k13Silence" }
        },
        // =========================================================== K14
        {
            id: "K14", kind: "K", giver: "dzwonnik", icon: 0,
            offer: {
                cond: { hours: [17.5, 18.25], opinion: 20, day: 3 }
            },
            steps: [
                { type: "custom", talk: "bellTalk", target: 6,
                    deadline: { day: 0, hour: 18.4, late: "fail" } }
            ],
            reward: { xp: 50 },
            fail: { opinion: 0 },
            lines: {
            }
        },
        // =========================================================== K15
        {
            id: "K15", kind: "K", giver: "kupiec", icon: 0,
            offer: {
                cond: { hours: [21.5, 22.2], day: 3 },
                vgives: { skrzynia: 1 }, pay: 5
            },
            steps: [
                // (2026-10-05: the carter Wojciech waits with his cart before the south gate, 21:20-22:40 - TownLife "woznica")
                { type: "bring", to: "woznica", hours: [21.5, 22.5], need: [["v:skrzynia", 1]], deadline: { day: 0, hour: 22.5, late: "fail" },
                    talk: "k15Wit",
                    choice: { ask: [], options: [
                        { flag: "k15Clean" },
                        { flag: "k15Opened", clue: "w5_stones" }
                    ] } },
                { type: "custom", talk: "k15Pay" }
            ],
            reward: { xp: 50 },
            fail: { opinion: -1 },
            lines: {
            }
        },
        // =========================================================== K16
        {
            id: "K16", kind: "K", giver: "kupiec", icon: 103, repeat: "trade",
            offer: { cond: { hours: [8, 18], afterFerry: true }, custom: "k16Trade" },
            steps: [],
            lines: {
            },
            reward: { xp: 30, clue: "w8_stores" }
        },
        // =========================================================== K17
        {
            id: "K17", kind: "K", giver: "soltys", icon: 88,
            offer: {
                cond: { hours: [8, 18], day: 2 },
                vgives: { obwieszczenie: 4 }
            },
            steps: [
                { type: "custom", spotFx: "k17", spots: ["notice_tavern", "notice_bakery", "notice_smithy", "notice_kantor"], hours: [6, 20] },
                { type: "talk", to: "soltys", hours: [8, 18] }
            ],
            react: { },
            reward: { gold: 10, xp: 50, opinion: 1 }
        },
        // =========================================================== K20
        {
            id: "K20", kind: "K", giver: "garbarz", icon: 96,
            offer: {
                cond: { hours: H_IGNAC, has: [[96, 1]] },
                options: [
                    { then: "close", need: [[96, 1]], reward: { gold: 8, xp: 50, opinion: 1 }, fx: "k20Bonus" },
                    { then: "decline" }
                ]
            },
            steps: []
        },
        // =========================================================== K21
        {
            id: "K21", kind: "K", giver: "garbarz", icon: 147,
            offer: {
                cond: { hours: [6.5, 13], day: 2 }
            },
            steps: [
                { type: "bring", to: "garbarz", need: [[147, 10], [77, 4]], hours: H_IGNAC, deadline: { day: 0, hour: 17, late: "fail" } }
            ],
            reward: { gold: 12, xp: 50, opinion: 2 },
            fail: { opinion: -1 }
        },
        // =========================================================== K31
        {
            id: "K31", kind: "K", giver: "feliks", icon: 137,
            offer: {
                cond: { hours: [7, 10.5], day: 26, until: 33, story: true }
            },
            steps: [
                { type: "bring", to: "lord", need: [[137, 2], [136, 1]], dayIs: 33, hours: [8, 20], deadline: { abs: 33, hour: 20, late: "fail" },
                    choice: { ask: [], options: [
                        { reward: { gold: 40 } },
                        { reward: { gold: 40, debt: true } }
                    ] } }
            ],
            reward: { xp: 50, opinion: 2, flag: "lordNameDay" },
            fail: { opinion: 0 }
        },
        // =========================================================== K32
        {
            id: "K32", kind: "K", giver: "grandpa", icon: 0,
            offer: {
                cond: { day: 5, until: 20, story: true },
                auto: true, vgives: { list: 1 }
            },
            steps: [
                // (kruk: the tame raven may carry it - Kruk.js's letters, 2026-10-16)
                { type: "bring", to: "lord", need: [["v:list", 1]], hours: [8, 20], kruk: true }
            ],
            reward: { xp: 40, clue: "lord_stones" }
        },
        // =========================================================== K38
        {
            id: "K38", kind: "K", giver: "kapral", icon: 59,
            offer: {
                cond: { hours: H_PATROL, opinion: 20, day: 3 }
            },
            steps: [
                { type: "spot", spot: "watch_post", hours: [0.75, 1.5], deadline: { day: 1, hour: 1.5, late: "fail" } },
                { type: "custom", tick: "k38Watch" },
                { type: "talk", to: "kapral", hours: H_PATROL, sayFx: "k38Report" }
            ],
            reward: { gold: 15, xp: 50, opinion: 1 },
            fail: { opinion: -2 },
            lines: {
            }
        },
        // =========================================================== K26 (2026-10-05: the well's bottom, Map118)
        {
            id: "K26", kind: "K", giver: "zosia", icon: 0,
            offer: {
                cond: { hours: [[8.2, 12], [13.2, 18.5]], day: 3, clear: true }
            },
            steps: [
                { type: "spot", spot: "k26_ring", hours: [6, 20], clear: true, vgives: { pierscionek: 1 },
                    reward: { clue: "w1_well" } },
                { type: "bring", to: "zosia", need: [["v:pierscionek", 1]], hours: [[8.2, 12], [13.2, 18.5]] }
            ],
            reward: { xp: 50, opinion: 3 }
        },
        // =========================================================== K37 (2026-10-05: the victim is Feliks with the manor's purse - the
        // Lord himself never comes to the market; Feliks does the manor's shopping there, so the purse is still the Lord's money)
        {
            id: "K37", kind: "K", giver: "feliks", icon: 0, autoStart: "k37Theft",
            steps: [
                { type: "custom", tick: "k37Chase" },
                { type: "custom", talk: "k37Caught", tick: "k37Hold", vgives: { sakiewka: 1 } },
                { type: "bring", to: "feliks", need: [["v:sakiewka", 1]], hours: [7, 10.5],
                    reward: { debtCredit: 50, opinion: 2 } }
            ],
            reward: { xp: 60 },
            fail: { opinion: 0 },
            lines: {
            }
        },
        // =========================================================== K39 (2026-10-05: Bartek in the tavern, Lucjan at the market)
        {
            id: "K39", kind: "K", giver: "bartek", icon: 0,
            offer: {
                cond: { hours: [14, 21], day: 7 }
            },
            steps: [
                { type: "custom", talk: "k39Play" },
                { type: "custom", talk: "k39Choice" },
                { type: "talk", to: "bartek", hours: [14, 21],
                    reward: { gold: 5 } }
            ],
            reward: { xp: 60 },
            lines: {
            }
        },

        // =========================================================== K19
        {
            id: "K19", kind: "K", giver: "soltys", icon: 0,
            offer: {
                cond: { hours: [8, 18], day: 10 }
            },
            steps: [
                { type: "custom", talk: "k19Count", targets: ["ludmila", "ela", "rafal"] },
                { type: "talk", to: "soltys", hours: [8, 18],
                    choice: { ask: [], options: [
                        { flag: "campCountTrue", reward: { opinion: 1 } },
                        { flag: "rafalHidden" }
                    ] } }
            ],
            reward: { gold: 10, xp: 50 },
            lines: {
            }
        },
        // =========================================================== K27
        {
            id: "K27", kind: "K", giver: "ludmila", icon: 61,
            offer: {
                cond: { hours: [6.5, 20], day: 2, fn: "w6NotHated" }
            },
            steps: [
                { type: "bring", to: "ela", need: [[61, 1]], toolsAny: [91, 90], hours: [6.6, 20], talk: "k27Melia" }
            ],
            reward: { xp: 50, opinion: 3, clue: "w6_heart" },
            // (2026-10-06) the other way: Melia sings for Ela under the wall - and that evening the tavern's stage stays empty
            lines: {
            }
        },
        // =========================================================== K28
        {
            id: "K28", kind: "K", giver: "ludmila", icon: 131,
            offer: {
                cond: { hours: [6.5, 20], day: 3, fn: "w6NotHated" }
            },
            steps: [
                { type: "bring", to: "ludmila", needAny: [[[131, 2]], [[130, 2]], [[132, 2]]], hours: [6.5, 20], fx: "k28Winter" }
            ],
            reward: { xp: 50, opinion: 4, flag: "campFed" }
        },
        // =========================================================== K29
        {
            id: "K29", kind: "K", giver: "rafal", icon: 152,
            offer: {
                cond: { hours: [[4.5, 6.5], [21, 23.5]] }
            },
            steps: [
                { type: "bring", to: "rafal", need: [[152, 1]], hours: [[4.5, 6.5], [21, 23.5]], guard: "k29Guard" }
            ],
            reward: { xp: 40, flag: "rafalTrust" },
            lines: { }
        },
        // =========================================================== K30
        {
            id: "K30", kind: "K", giver: "feliks", icon: 0,
            offer: {
                cond: { hours: [7, 8.5], market: true, story: true },
                vgives: { koszyki: 3 }
            },
            steps: [
                { type: "bring", to: "lord", need: [["v:koszyki", 3]], hours: [8, 9], deadline: { day: 0, hour: 9, late: "fail" } }
            ],
            reward: { gold: 5, debtCredit: 5, xp: 30, opinion: 1 },
            fail: { opinion: -1 }
        },
        // =========================================================== D4
        {
            id: "D4", kind: "D", giver: "piekarka", icon: 83,
            offer: {
                cond: { hours: [6, 12], day: 11 }
            },
            steps: [
                { type: "custom", tick: "d4Ambush" },
                { type: "talk", to: "ela", hours: [6.6, 20],
                    choice: { ask: [], options: [
                        { },
                        { cost: 15 },
                        { cond: { opinion: 20 } }
                    ] } },
                { type: "talk", to: "piekarka", hours: [6, 14], sayFx: "d4Hanka", rewardFx: "d4Reward" }
            ],
            reward: { xp: 100 },
            lines: {
            }
        },
        // =========================================================== D10
        {
            id: "D10", kind: "D", giver: "ludmila", icon: 110,
            offer: {
                cond: { hours: [6.5, 20], day: 11, season: [0, 1], fn: "w6NotHated" }
            },
            steps: [
                { type: "bring", to: "ludmila", needAny: [[[110, 1]], [["v:lek", 1]]], water: 1, hours: [6.5, 20], talk: "d10Lek" },
                { type: "wait", days: 1, hour: 6 },
                { type: "talk", to: "ludmila", hours: [6.5, 20], sayFx: "d10Morning" }
            ],
            reward: { xp: 100, opinion: 6, flag: "elaHealed" },
            lines: {
            }
        },
        // =========================================================== D18
        {
            id: "D18", kind: "D", giver: "garbarz", icon: 112,
            offer: {
                cond: { hours: [6.5, 17], day: 70, season: [2] }
            },
            steps: [
                { type: "bring", to: "garbarz", need: [[96, 10], [111, 5]], hours: [6.5, 17] },
                { type: "talk", to: "garbarz", after: [0, 2], hours: [6.5, 17], vgives: { plaszcze: 5 } },
                { type: "custom", talk: "d18Give" }
            ],
            lines: {
            },
            reward: { xp: 100 }
        },
        // =========================================================== Podgrodzie (Map111), the poor suburb outside the west wall
        // (2026-10-05): one short errand from each of its residents. Givers live there (TownLife "map: 111"); in the evening and at
        // night they are at home - a bring step is handed over wherever the resident is (also in its cabin).
        // =========================================================== K40
        {
            id: "K40", kind: "K", giver: "praczka", icon: 138,
            offer: {
                cond: { hours: [5, 17], day: 2 }
            },
            steps: [
                { type: "bring", to: "praczka", water: 2, hours: [5, 22] }
            ],
            reward: { gold: 8, xp: 40, opinion: 2 }
        },
        // =========================================================== K41
        {
            id: "K41", kind: "K", giver: "znachorka", icon: 150,
            offer: {
                cond: { hours: [6, 18] }
            },
            steps: [
                { type: "bring", to: "znachorka", need: [[150, 3], [149, 2]], hours: [6, 22] }
            ],
            reward: { xp: 50, opinion: 2, items: [[152, 2]] }
        },
        // =========================================================== K42
        {
            id: "K42", kind: "K", giver: "szmaciarz", icon: 80,
            offer: {
                cond: { hours: [7, 20], day: 3 }
            },
            steps: [
                { type: "bring", to: "szmaciarz", need: [[80, 2], [88, 4]], tools: [[89, 1]], hours: [7, 22], se: "Hammer" }
            ],
            reward: { gold: 10, xp: 50, opinion: 2, items: [[93, 2]] }
        },
        // =========================================================== K43
        {
            id: "K43", kind: "K", giver: "uchodzca", icon: 61,
            offer: {
                cond: { hours: [17, 22] }
            },
            steps: [
                { type: "bring", to: "uchodzca", need: [[61, 6]], hours: [6, 23] }
            ],
            reward: { xp: 40, opinion: 3 }
        },
        // =========================================================== K44
        {
            id: "K44", kind: "K", giver: "drwal", icon: 93,
            offer: {
                cond: { hours: [15, 21.5] }
            },
            steps: [
                { type: "bring", to: "drwal", need: [[93, 2]], hours: [5, 22] }
            ],
            reward: { xp: 40, opinion: 2, items: [[79, 3]] }
        },
        // =========================================================== K45
        {
            id: "K45", kind: "K", giver: "klusownik", icon: 92,
            offer: {
                cond: { hours: [13, 20], day: 2 }
            },
            steps: [
                { type: "bring", to: "klusownik", need: [[92, 6]], hours: [5, 22] }
            ],
            reward: { xp: 40, opinion: 1, items: [[94, 2]] }
        },
        // =========================================================== K46
        {
            id: "K46", kind: "K", giver: "franek", icon: 83,
            offer: {
                cond: { hours: [7, 19] }
            },
            steps: [
                { type: "bring", to: "franek", need: [[83, 1]], hours: [6, 22] }
            ],
            reward: { xp: 20, opinion: 2 }
        },
        // =========================================================== D1
        {
            id: "D1", kind: "D", giver: "garbarz", icon: 113,
            offer: {
                cond: { hours: H_IGNAC, day: 5 }
            },
            steps: [
                { type: "bring", to: "garbarz", need: [[96, 3]], hours: H_IGNAC },
                { type: "bring", to: "kowal", need: [[86, 1]], hours: H_KOWAL, vgives: { cwieki: 1 } },
                { type: "talk", to: "garbarz", after: [0, 2], hours: [7, 8], need: [["v:cwieki", 1]] },
                { type: "talk", to: "garbarz", after: [2, 2], hours: H_IGNAC,
                    choice: { ask: [], options: [
                        { flag: "bootsHunter",
                            reward: { items: [[113, 1]] }, perk: { sneak: 0.2 } },
                        { flag: "bootsNailed",
                            reward: { items: [[113, 1]] }, perk: { cold: 0.25, "stamina.cost": 0.05 } }
                    ] } }
            ],
            reward: { xp: 100, opinion: 4 }
        },
        // =========================================================== D3
        {
            id: "D3", kind: "D", giver: "kowal", icon: 86,
            offer: {
                cond: { hours: [5.5, 14], day: 6 }
            },
            steps: [
                { type: "bring", to: "kowal", need: [[86, 2], [79, 1]], hours: [5.5, 16], vgives: { podkowy: 1 }, fx: "d3Forge",
                    deadline: { day: 0, hour: 16, late: "next", skip: 2 } },
                { type: "bring", to: "kapral", need: [["v:podkowy", 1]], hours: [6, 17.5], deadline: { day: 0, hour: 17.5, late: "next" } },
                { type: "bring", to: "soltys", need: [[88, 20]], hours: [8, 18], deadline: { day: 1, hour: 18, late: "next" } },
                { type: "bring", to: "garbarz", need: [[91, 1]], hours: H_IGNAC, deadline: { day: 1, hour: 17, late: "next" } },
                { type: "talk", to: "kowal", hours: H_KOWAL,
                    choice: { ask: [], options: [
                        { reward: { gold: 60 } },
                        { reward: { opinion: 6, xp: 50 }, flag: "tadekFriend" }
                    ] } }
            ],
            reward: { xp: 100, opinion: 2 }
        },
        // =========================================================== D5
        {
            id: "D5", kind: "D", giver: "kapral", icon: 127,
            offer: {
                cond: { hours: H_WIT, day: 8 },
                gives: [[127, 6]]
            },
            steps: [
                { type: "spot", spot: "south_gate", hours: [5, 9] },
                { type: "kill", kind: "wolf", map: 22, n: 2, night: true, spawn: 2 },
                { type: "kill", kind: "wolf", map: 23, n: 1, leader: true, night: true, spawn: 3 },
                { type: "talk", to: "kapral", hours: H_WIT,
                    choice: { ask: [], options: [
                        { flag: "witOwes", reward: { gold: 80 } },
                        { reward: { gold: 80, opinion: 5 } }
                    ] } }
            ],
            reward: { xp: 150 }
        },
        // =========================================================== D11
        {
            id: "D11", kind: "D", giver: "kapral", icon: 79,
            offer: {
                cond: { hours: H_PATROL, day: 6 }
            },
            steps: [
                { type: "custom", talk: "d11Deliver", upto: 3 },
                { type: "spot", spot: "east_brazier", hours: [21, 2], after: [0, 1],
                    choice: { ask: [], options: [
                        { flag: "d11Wit" },
                        { flag: "d11Kantor" }
                    ] } },
                { type: "custom", talk: "d11Report" },
                { type: "custom", talk: "d11Deliver", upto: 5 }
            ],
            reward: { gold: 70, xp: 100, opinion: 5 },
            lines: {
            }
        },
        // =========================================================== D14
        {
            id: "D14", kind: "D", giver: "kapral", icon: 74,
            offer: {
                cond: { hours: H_WIT, day: 24 },
                options: [
                    { then: "accept", step: 0 },
                    { then: "close", cost: 20, flag: "witBribed", reward: { opinion: -1, xp: 20 } },
                    { then: "accept", step: 1 }
                ]
            },
            steps: [
                { type: "bring", to: "kapral", need: [[74, 6]], hours: H_WIT, deadline: { day: 3, hour: 18, late: "fail" }, end: true,
                    reward: { debtCredit: 50, opinion: 0 } },
                { type: "custom", talk: "d14Inspect", dayAfter: 3 }
            ],
            reward: { xp: 50 },
            fail: { opinion: -2 },
            lines: {
            }
        },
        // =========================================================== D16
        {
            id: "D16", kind: "D", giver: "dzwonnik", icon: 0,
            offer: {
                cond: { hours: [6.3, 17.7], opinion: 40, day: 7 }
            },
            steps: [
                { type: "custom", talk: "bellLesson", days: 4 }
            ],
            lines: {
            },
            reward: { xp: 100, opinion: 5, flag: "bellKey" }
        },
        // =========================================================== D17
        {
            id: "D17", kind: "D", giver: "soltys", icon: 0,
            offer: {
                cond: { hours: [8, 18], day: 20, story: true }
            },
            steps: [
                { type: "custom", talk: "d17Sign", signers: ["kowal", "piekarka", "woziwoda", "garbarz", "dzwonnik", "kupiec"], signNeed: 5, vgives: { petycja: 1 } },
                { type: "bring", to: "lord", need: [["v:petycja", 1]], hours: [8, 20], kruk: true },
                { type: "talk", to: "soltys", hours: [8, 18] }
            ],
            reward: { gold: 30, xp: 100, opinion: 8, flag: "lordRemembers" }
        },

        // =========================================================== W1 (chapters 1-7; the user, 2026-10-05: Feliks is guilty, the Lord knows
        // nothing). 2026-10-06: 6 c's ambush is a real fight (Humans.js), 7 (the Order's cistern, Act II) opens the main sluice by the bell.
        {
            id: "W1", kind: "W", giver: null, icon: 138,
            clues: ["w1_barrel", "w1_roses", "w1_night", "w1_watch", "w1_well"], cluesNeed: 3,
            lines: {
                // rozdz. 3: Kuba at the market
                // rozdz. 5: the orangery at night
                // rozdz. 6: the big choice
                // (2026-10-17, W7 variant A - Dwor.js) after the truth of Feliks's letters (w7Prawda): the Lord knows Feliks sold to the Black
                // Eyes, not where the sluice is - that stays W1's. {fate}: Feliks in the tower, or gone over the sea (TownQuests.js w1AfterW7)
                w7: {
                    fate: { }
                },
                // (2026-10-06) rozdz. 6 c as a real fight (Humans.js, combat stage 3): two of Feliks's men - three, once he has paid 40 G
                // rozdz. 7 (Act II): the Order's cistern - the main sluice on floor 30 (Underground.js sends "undergroundSluice"), opened by the bell's
                // "water" signal four and two. The drought stays: the market well fills, but the sołtys keeps it under lock and rations it -
                // for the hero it still gives its two draws a day (the author: the well stays as it is after W1)
                shout: { }
            },
            steps: [
                { ch: 1, type: "custom", check: "w1Clues" },
                { ch: 2, type: "custom", tick: "w1Follow" },
                { ch: 3, type: "custom", talk: "w1Kuba" },
                { ch: 4, type: "spot", spot: "w1_grate",
                    reward: { xp: 60, clue: "w1_grate" } },
                { ch: 4, type: "talk", to: "kowal", hours: H_KOWAL },
                { ch: 5, type: "custom", tick: "w1Orangery", spotFx: "w1Orangery", spots: ["w1_pump", "w1_drawer", "w1_feliks", "w1_kuba"] },
                { ch: 6, type: "custom", talk: "w1Choice" },
                { ch: 6, type: "custom", talk: "w1Feliks", tick: "w1Ambush" },
                { ch: 6, type: "custom", tick: "w1Ambush" },
                // (2026-10-06) rozdz. 7 in Act II: find the main sluice of the Order's cistern (underground floor 30), then the bell's "water" signal
                { ch: 7, type: "custom", check: "w1Sluice" },
                { ch: 7, type: "custom", talk: "w1Bell" }
            ]
        },
        // =========================================================== W2 (chapters 1-6; 7 "Jedno pytanie" at the hermitage - Pustelnia.js; 8 waits)
        {
            id: "W2", kind: "W", giver: null, icon: 0,
            lines: {
            },
            steps: [
                { ch: 1, type: "custom", check: "w2Heard" },
                { ch: 1, type: "talk", to: "dzwonnik", hours: [6.3, 17.7] },
                { ch: 2, type: "custom", check: "w2Apprentice" },
                { ch: 3, type: "custom", check: "w2Table" },
                { ch: 4, type: "talk", to: "dzwonnik", hours: [17.7, 18.3],
                    fx: "w2Key" },
                { ch: 5, type: "custom", tick: "w2Garden" },
                { ch: 5, type: "custom", talk: "w2Ring" },
                { ch: 5, type: "custom", tick: "w2Shadow" },
                { ch: 6, type: "custom", spotFx: "w2Archive", spots: ["w2_book", "w2_chron"] },
                { ch: 6, type: "bring", to: "dzwonnik", need: [["v:kroniki", 1]], hours: [6, 18.3],
                    reward: { opinion: 3, xp: 50, flag: "ambrozyChronicles" } },
                // (2026-10-16, pakiet A - docs/miejsca_wyspy/KONCEPCJA.md 3: rozdz. 7 przeniesiony do pustelni na klifie) ONE step that walks its
                // own stages (Pustelnia.js: TownQuests.FX.w2Pytanie, r.t.w2s): Ambroży gives the bell's heart (Act II) -> brother Kleofas hangs it
                // in the scriptorium's tower -> the Night of the Question (the Wigilia, midnight: seven strikes) -> one question; after it the
                // step says rozdz. 8 "Alarm" waits (Act III). It stays the LAST step: rozdz. 6 jumps to q.steps.length - 1, and old saves
                // standing on the old pause (this index) land here
                { ch: 7, type: "custom", talk: "w2Pytanie", tick: "w2Pytanie", vars: "w2Pytanie" }
            ]
        },

        // ================================================================ THE TAVERN'S REGULARS (2026-10-06): Melia, Ozzy, Grum
        // =========================================================== K22
        {
            id: "K22", kind: "K", giver: "melia", icon: 163,
            offer: {
                cond: { hours: [10, 17], day: 2 }
            },
            steps: [
                { type: "bring", to: "garbarz", need: [[163, 2]], hours: [6.5, 17], fx: "k22Twist" },
                { type: "custom", talk: "k22String" },
                { type: "custom", talk: "k22Melia" }
            ],
            reward: { xp: 50, trust: { melia: 15 } },
            lines: {
            }
        },
        // =========================================================== K33
        {
            id: "K33", kind: "K", giver: "ozzy", icon: 0,
            offer: {
                cond: { hours: [17, 23], day: 3 }
            },
            steps: [
                { type: "custom", tick: "k33Shot" },
                { type: "custom", tick: "k33Pick" },
                { type: "bring", to: "ozzy", need: [["v:czapka", 1]] }
            ],
            reward: { xp: 50, items: [[81, 1]], trust: { ozzy: 10 }, flag: "k33Cap", clue: "w2_ozzy" },
            lines: {
            }
        },
        // =========================================================== D13
        {
            id: "D13", kind: "D", giver: "ozzy", icon: 0,
            offer: {
                custom: "d13Offer", cond: { hours: [18, 23.5], day: 5, fn: "d13Offer" }
            },
            steps: [
                { type: "custom", talk: "d13Bet" },
                { type: "custom", talk: "d13Check", tick: "d13Check" },
                { type: "custom", talk: "d13Pay" },
                { type: "custom", talk: "d13Ozzy" }
            ],
            reward: { xp: 100, trust: { ozzy: 15, grum: 5 }, flag: "d13Done", clue: "w9_ozzy" },
            lines: {
            }
        },
        // =========================================================== D6
        {
            id: "D6", kind: "D", giver: "kowal", icon: 0,
            offer: {
                cond: { hours: [5.5, 17], day: 4 }
            },
            steps: [
                { type: "custom", check: "d6Train", tick: "d6Late" },
                { type: "custom", talk: "d6Sign", tick: "d6Late" },
                { type: "custom", talk: "d6Tourney", tick: "d6Late" }
            ],
            reward: { xp: 80 },
            lines: {
            },
            rivals: [
                { key: "woznica", bust: "Woznica_Bust", level: 0,
                    lines: { } },
                { key: "kowal", bust: "Kowal_Bust", level: 2,
                    lines: { } },
                { key: "grum", bust: null, level: 4,
                    lines: { } }
            ]
        },
        // =========================================================== W3 (chapters 1-8; the kidnap at Kupała waits for human enemies)
        {
            id: "W3", kind: "W", giver: null, icon: 0,
            steps: [
                { ch: 1, type: "custom", talk: "w3Dream" },
                { ch: "2–6", type: "custom", talk: "w3Verse" },
                { ch: 7, type: "custom", talk: "w3Origin" },
                { ch: 8, type: "custom", talk: "w3Final" },
                { ch: 8, type: "custom", spotFx: "w3Kupala", spots: ["w3_kupala"], tick: "w3Kupala" },
                { ch: 8, type: "custom", tick: "w3Defend" },
                { ch: 8, type: "custom", talk: "w3Borgar" }
            ],
            reward: { xp: 200 },
            verses: [
                { key: "struna" },
                { key: "dzwon" },
                { key: "kolysanka" },
                { key: "cokoly" },
                { key: "kronika" },
                { key: "belkot" }
            ],
            hints: {
            },
            lines: {
            }
        },
        // =========================================================== W8 (chapters 1-6; 2026-10-06: the mountains are on the maps - Map013 "Góry i
        // kamieniołom", Map014 "Jaskinia", Map120 "Osada Milczących", their "Miejsce: ..." markers). Grum goes with the hero only as a
        // picture at each place (a quest's place with his sheet and bust) - there are no followers.
        {
            id: "W8", kind: "W", giver: null, icon: 0,
            steps: [
                { ch: 1, type: "custom", talk: "w8Ask" },
                { ch: 2, type: "custom", talk: "w8Hire" },
                { ch: 2, type: "custom", spotFx: "w8Trip", spots: ["w8_start"], tick: "w8Trip", vars: "w8Vars" },
                { ch: 2, type: "custom", spotFx: "w8Quarry", spots: ["w8_quarry"], tick: "w8Quarry", vars: "w8Vars" },
                { ch: 3, type: "custom", spotFx: "w8Camp", spots: ["w8_cave"] },
                { ch: 4, type: "custom", talk: "w8Letter", tick: "w8Wall", spotFx: "w8Crate", spots: ["w8_crate"], vars: "w8Vars" },
                { ch: 5, type: "custom", spotFx: "w8Osada", spots: ["w8_gate", "w8_osada"], vars: "w8Vars" },
                { ch: 6, type: "custom", talk: "w8Choice", vars: "w8Vars" },
                { ch: 6, type: "custom", tick: "w8Duel" }
            ],
            lines: {
                // ---- rozdz. 2 "Przewodnik" (2026-10-06)
                // ---- rozdz. 3 "Obóz kopaczy"
                // (2026-10-07) Marek already brought out by the hero (W6 rozdz. 7): his niche is empty
                // ---- rozdz. 4 "List z rozkazem"
                // ---- rozdz. 5 "Co Serce robi z człowiekiem" (Osada Milczących, Act II)
                // ---- rozdz. 6 "Wybór Gruma"
            }
        },
        // =========================================================== W4 (compact, 2026-10-06): the castellan's key opens the old grate in the cellar
        {
            id: "W4", kind: "W", giver: null, icon: 0,
            steps: [
                { ch: 1, type: "custom", talk: "w4Borgar" },
                { ch: 2, type: "spot", spot: "w4_dig", toolsAny: [62], fx: "w4Dig",
                    reward: { xp: 60 } },
                { ch: 3, type: "bring", to: "kowal", need: [["v:klucz_borgar", 1], ["v:klucz_kopiec", 1], [86, 1], [79, 2]], hours: [5.5, 17], fx: "w4Forge" },
                { ch: 3, type: "custom", talk: "w4Key" },
                { ch: 4, type: "custom", check: "w4Gate" },
                { ch: 5, type: "custom", talk: "w4Tell" },
                // (2026-10-17) chapters 6-8 - Kasztelan.js. (2026-10-23) Their steps are data now: Kasztelan_Data.js puts them here through
                // the thread engine (Watki.js) at indexes 6-9 - w4Rod, w4Konfrontacja, w4Piwnica, w4Serce - an old save's step number stays its
                // step; their words: js/teksty/kasztelan.txt. "Lord chce być pierwszy" (QUESTY ch. 5) is W7's chapter 6 (Dwor.js) - read there.
            ],
            lines: {
            }
        },
        // =========================================================== W9 rozdz. 6 (2026-10-06): the truths of the Truth Layer as talks in the town
        // The kartki of floors 76-99 (Underground.truths(), the bus "undergroundTruth") - back up top, the hero may tell each one to the
        // one it is about, or keep silent. One person at a time, asked once a day (a resident: before his talk; the tavern's regulars: a
        // topic in their menu; Borgar: a topic at the bar; the Lord and grandpa: before their story talk - grandpa also hears Mruczek's).
        // truths[who]: tell / keep (lines after the choice: the hero "> ...", the one spoken to), told / kept (a reward: opinion, trust,
        // flag, note), tellIf: [[flag, lines]] (more lines when a quest's flag is set). The chapters 1-5 and 7-8 are other systems' (the
        // tavern's cellar, the Underground's floors, its Heart and endings) - the arc stays open while there is a truth to tell.
        {
            id: "W9", kind: "W", giver: null, icon: 0,
            steps: [
                { ch: 6, type: "custom", talk: "w9Truth", vars: "w9Truth" }
            ],
            lines: {
            },
            // the ones a truth can be told to (Underground_Data.TRUTH_WHO keys); talk: who hears it (default: the same key)
            truths: {
                borgar: { talk: "borgar",
                    told: { flag: "borgarKnows" } },
                melia: { talk: "melia",
                    told: { trust: { melia: 5 }, flag: "w9Verse8" } },
                ozzy: { talk: "ozzy",
                    told: { trust: { ozzy: 5 } } },
                grum: { talk: "grum",
                    told: { trust: { grum: 5 }, flag: "grumLetterKnown" } },
                piekarka: { 
                    told: { opinion: 2, flag: "w9Loaf" } },
                woziwoda: { 
                    told: { opinion: 1 } },
                feliks: { 
                    told: { flag: "feliksShaken" } },
                dzwonnik: { 
                    told: { opinion: 1, flag: "w9Bell" } },
                kowal: { 
                    told: { opinion: 1 } },
                kapral: { 
                    told: { opinion: -1, flag: "witWary" } },
                ludmila: { 
                    told: { opinion: 2, flag: "w9Lullaby" } },
                lord: { talk: "lord",
                    tellIf: [["lordAlly", ["(Lord się uśmiecha, pierwszy raz bez dworskiej miny.) Przychodź czasem. Pogadać. O czymkolwiek."]]],
                    told: { flag: "lordTruth" } },
                soltys: { 
                    tellIf: [["cisternOpen", ["Teraz przynajmniej jest co liczyć. Zasypiam przy czterdziestym wiadrze. Pięknie."]]],
                    told: { opinion: 1 } },
                kupiec: { 
                    told: { flag: "balthazarWary" } },
                garbarz: { 
                    told: { opinion: 1 } },
                rafal: { 
                    told: { flag: "rafalTrust" } },
                dziadek: { talk: "grandpa",
                    told: { flag: "grandpaTruth" } },
                kot: { talk: "grandpa",
                    told: { flag: "catTruth" } }
            }
        },
        // =========================================================== W6 "Ludzie z promu" (2026-10-07: chapters 3-7; 1-2 are K19, K27, K28, K29, D4,
        // D10, D18 - their flags make the camp's trust). Rafał's story by the fire; the wanted poster (the tavern's quest board) and the
        // choice - hide him (the tavern's attic room, grandpa's house, the bell tower: each can be searched), turn him in, smuggle him on
        // the ferry through Baltazar; the second wave and the vote at the town hall (the weight of the hero's vote = his Opinia): the
        // gate shut (the camp moves out to Podgrodzie, wolves at night) or the refugees in with a week of work (two helpers harvest
        // grandpa's field by themselves); the winter's Wigilia (in the camp or in the tavern, the hero cooks for all); Marek (Act II):
        // Ludmiła's kerchief turns him from the wall in the diggers' cave, the hero leads him out (at night sneaking past the camp's
        // guard, by force, or a word with the guard) - flag marekSaved (W8 rozdz. 6 counts it) - and the reunion.
        // The outcome for Act III and the endings (TownQuests.state().flags / TownQuests.w6()): rafalAlly | rafalGiven + rafalEnemy |
        // rafalSmuggled | rafalTaken, campInside | campOutside, marekSaved, w6Wigilia (+ w6WigiliaCamp | w6WigiliaTavern).
        {
            id: "W6", kind: "W", giver: null, icon: 0,
            steps: [
                { ch: 2, type: "custom", check: "w6Trust", vars: "w6Vars" },
                { ch: 3, type: "custom", talk: "w6Story" },
                { ch: 4, type: "custom", talk: "w6Poster", tick: "w6Poster", spotFx: "w6Poster", spots: ["notice_tavern"], vars: "w6Vars" },
                { ch: 4, type: "custom", talk: "w6Choice", tick: "w6Choice", vars: "w6Vars" },
                { ch: 4, type: "custom", talk: "w6Hidden", tick: "w6Hidden", spotFx: "w6Hidden", spots: ["w6_hide_tavern", "w6_hide_grandpa", "w6_hide_belfry"], vars: "w6Vars" },
                { ch: 5, type: "custom", talk: "w6Vote", tick: "w6Wave", vars: "w6Vars" },
                { ch: 6, chFx: "w6Hub", type: "custom", talk: "w6Hub", tick: "w6Hub", vars: "w6Vars" }
            ],
            reward: { xp: 300, opinion: 2 },
            lines: {
                // ---- rozdz. 3 "Kim był Rafał"
                // ---- rozdz. 4 "List gończy"
                // ---- rozdz. 5 "Druga fala"
                quarrel: [[["woziwoda", "Po kolei! Najpierw piekarnia i kuźnia, potem reszta!"], ["ludmila", "Dziecko pić chce, nie piec!"]],
                    [["piekarka", "Przydział to przydział, kochana."], ["ludmila", "Przydział dla swoich. A my czyi?"]],
                    [["woziwoda", "Nowi z promu - do tyłu! Sołtys tak kazał!"], ["zlodziej", "A jak sołtys każe skakać do studni?"]],
                    [["kowal", "Woda dla kuźni! Bez wody nie ma podków!"], ["woziwoda", "Dla wszystkich po równo, Tadek!"]]]
            }
        },
        // =========================================================== (2026-10-14) THE HARBOUR (Map125, docs/przystan/KONCEPCJA.md)
        // Janek the fisherman and Roch Szkwał the smuggler (the prologue's people). Their first meetings, Janek's fish trade, the ferry,
        // the cutter's states and the night run: Przystan.js (its handlers: k47Rod, d20Noc, w10Wyslany, w10Wiesc - TownQuests.FX;
        // 2026-10-17 W10's letters: w10List1-3, w10BezFabuly, w10Vars)
        // =========================================================== K47
        {
            id: "K47", kind: "K", giver: "janek", icon: 173,
            offer: {
                cond: { hours: [8, 20], flags: ["janekMet"] },
                options: [
                    { then: "accept" },
                    { then: "accept", fx: "k47Rod" },
                    { then: "decline" }
                ]
            },
            steps: [
                { type: "bring", to: "janek", need: [[173, 2]], hours: [5, 21] }
            ],
            reward: { xp: 40, items: [[106, 2]], flag: "rybackaRada" }
        },
        // =========================================================== K48
        {
            id: "K48", kind: "K", giver: "janek", icon: 92,
            offer: {
                cond: { hours: [9, 20], flags: ["janekMet"] }
            },
            steps: [
                { type: "bring", to: "janek", need: [[92, 6], [93, 2]], hours: [6, 21] }
            ],
            reward: { gold: 20, xp: 40, items: [[106, 2]] }
        },
        // =========================================================== D20
        {
            id: "D20", kind: "D", giver: "przemytnik", icon: 80,
            offer: {
                cond: { hours: [6, 21], flags: ["rochMet"] }
            },
            steps: [
                { type: "talk", to: "janek", hours: [8, 20] },
                { type: "spot", spot: "przystan_wrak", hours: [5, 10], need: [[93, 2]],
                    reward: { flag: "d20Pochylnia" } },
                { type: "bring", to: "przemytnik", need: [[80, 8], [88, 20]], hours: [6, 22] },
                { type: "bring", to: "drwal", need: [[61, 6]], hours: [6, 21], gives: [[176, 2]] },
                { type: "bring", to: "praczka", need: [[92, 10]], hours: [6, 18], vgives: { zagiel: 1 } },
                { type: "bring", to: "przemytnik", need: [[176, 2], ["v:zagiel", 1]], hours: [6, 22],
                    reward: { flag: "d20Gotowy" } },
                { type: "custom", check: "d20Noc" }
            ],
            reward: { xp: 150 }
        },
        // =========================================================== W10
        {
            id: "W10", kind: "W", giver: "janek", icon: 175,
            offer: {
                cond: { hours: [8, 20], flags: ["janekMet"], day: 4 }
            },
            steps: [
                { type: "custom", check: "w10Wyslany", ch: 1 },
                { type: "custom", check: "w10Wiesc", ch: 2 },
                // (2026-10-17, the user's variant A - Przystan.js: the letters, the answers, the epilogue line, F9) the old "pause" was
                // step 2: a save waiting there now waits for the first letter. The mother's letters come by the ferry or Roch's cutter:
                // the first 8 days after the news, the second 10-16 days later, the third about Act III; grandpa reads the first one
                { type: "custom", check: "w10List1", ch: 3, reward: { xp: 40 } },
                { type: "talk", to: "grandpa", check: "w10BezFabuly", ch: 3,
                    reward: { xp: 60, flag: "w10Dziadek" } },
                { type: "custom", check: "w10List2", vars: "w10Vars", ch: 4, reward: { xp: 40 } },
                { type: "custom", check: "w10List3", vars: "w10Vars", ch: 5,
                    reward: { xp: 60 } }
            ],
            reward: { xp: 150 }
        }
    ];
    // the quests' words by the quest's id: js/teksty/zadania_k.txt (K), zadania_d.txt (D), w1.txt ... w10.txt (the threads)
    Watki.scal(QUESTS, "zadania_k", "zadania", "id");
    Watki.scal(QUESTS, "zadania_d", "zadania", "id");
    Watki.scal(QUESTS, "w1", "zadania", "id");
    Watki.scal(QUESTS, "w2", "zadania", "id");
    Watki.scal(QUESTS, "w3", "zadania", "id");
    Watki.scal(QUESTS, "w4", "zadania", "id");
    Watki.scal(QUESTS, "w6", "zadania", "id");
    Watki.scal(QUESTS, "w8", "zadania", "id");
    Watki.scal(QUESTS, "w9", "zadania", "id");
    Watki.scal(QUESTS, "w10", "zadania", "id");

    // (2026-10-16) Quests of other plugins (docs/miejsca_wyspy/PAKIETY.md): a data plugin ABOVE this one (e.g. Latarnia_Data.js) puts
    // its pack into window.TownQuestsPacks - { owner, quests: [...], spots: {...}, vitems: {...}, remarks: [...], gossip: {...} } -
    // and it is merged here, before TownQuests.js reads the tables (its places on new maps get their ids 951-959 like any other).
    // A quest id or a place / thing key that is already taken is left out (said in the console) - nothing of ours is ever replaced.
    // The quests' own steps (check / talk / fx...) go into TownQuests.FX from the plugin's engine, below TownQuests.
    const PACKS = [];
    (function mergePacks() {
        const packs = Array.isArray(window.TownQuestsPacks) ? window.TownQuestsPacks : [];
        const warn = m => { try { console.warn("TownQuests_Data: " + m); } catch (e) { /* (no console) */ } };
        for (const p of packs) {
            if (!p || typeof p !== "object") continue;
            const owner = String(p.owner || "?"), got = { owner, quests: [], spots: [], vitems: [], remarks: 0, gossip: [] };
            for (const q of p.quests || []) {
                if (!q || !q.id) continue;
                if (QUESTS.some(o => o.id === q.id)) { warn(owner + ": the quest id " + q.id + " is taken - left out"); continue; }
                QUESTS.push(q); got.quests.push(q.id);
            }
            for (const [k, v] of Object.entries(p.spots || {})) {
                if (SPOTS[k]) { warn(owner + ": the place " + k + " is taken - left out"); continue; }
                SPOTS[k] = v; got.spots.push(k);
            }
            for (const [k, v] of Object.entries(p.vitems || {})) {
                if (VITEMS[k]) { warn(owner + ": the thing v:" + k + " is taken - left out"); continue; }
                VITEMS[k] = v; got.vitems.push(k);
            }
            for (const r of p.remarks || []) {
                if (!r || !r.id || REMARKS.some(o => o.id === r.id)) { warn(owner + ": a remark without an id or with a taken id - left out"); continue; }
                REMARKS.push(r); got.remarks++;
            }
            for (const [k, v] of Object.entries(p.gossip || {})) {
                // (2026-10-24 audyt) a resident who already has gossip (Ambroży: the town's, Cysterna's and Zakon's) gets the pack's
                // lines after his own instead of losing them - once the words are in (the pack's list is filled from its file later)
                if (GOSSIP[k]) { if (Array.isArray(GOSSIP[k]) && Array.isArray(v)) Watki.poTekstach(() => { for (const line of v) if (!GOSSIP[k].includes(line)) GOSSIP[k].push(line); }); else warn(owner + ": the gossip of " + k + " is taken - left out"); continue; }
                GOSSIP[k] = v; got.gossip.push(k);
            }
            PACKS.push(got);
        }
    })();

    window.TownQuestsData = { OPINION, GREET, MARKET, CALENDAR, SIGNALS, VITEMS, SPOTS, GOSSIP, SIGN, QUESTS, WELL_BONUS, REMARKS, LUCJAN, PACKS };
})();
