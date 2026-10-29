//=============================================================================
// Motyle_Data.js
//=============================================================================
// The data of the butterflies and the moths (Motyle.js is the engine): the five kinds, where they live (the maps and how many), which
// tiles of the tilesets are flowers, the numbers of the pollination and of the cabbage whites, the net, the journal's display case,
// the texts - and the town quest K54 "Motyl z oczkami" (Ela, the refugees' camp) as a TownQuests pack.
// Stands under Birds (js/plugins.js) and above TownQuests_Data (the pack is read there).

/*:
 * @target MZ
 * @plugindesc Dane motyli i ciem: gatunki, mapy, kafelki kwiatów, zapylanie, siatka, gablotka, zadanie K54 „Motyl z oczkami”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Birds
 *
 * @help
 * Motyle_Data.js - tylko dane i teksty (silnik: Motyle.js, zaraz pod nią).
 *
 * Gatunki: cytrynek, pawik (rzadki: tylko o świcie po deszczu), modraszek,
 * bielinek (lubi kapustę) i ćma (nocą przy ogniu).
 * Mapy z motylami: łąki (4, 17, 18), Kruczy Jar (3), podwórze dziadka (20),
 * ogród Lorda (24), ogród rycerzy na mapie 8, działki domów (111, 168 - tylko
 * kupiona ziemia), pustelnia (155); inne mapy pod niebem z tilesetem łąk -
 * nieliczne. Miasta, wnętrza i podziemia - bez motyli.
 * Zadanie K54 „Motyl z oczkami” (Ela) - pakiet TownQuests.
 * Przedmioty: 180 Siatka na motyle, 181 Rysunek Eli (pamiątka).
 */

(() => {
    "use strict";

    const ITEM = { net: 180, drawing: 181, honey: 76, branch: 77, fiber: 92 };
    // the icons: 441 the net, 442 Ela's drawing, 443 a butterfly (popups), and a row of IconSet of their own (2026-10-18, the sheet grew a
    // row of 16 cells: 448-463) - 448 cytrynek, 449 pawik, 450 modraszek, 451 bielinek, 452 the moth (the display case's list)
    const ICON = { net: 441, drawing: 442, butterfly: 443, kinds: { cytrynek: 448, pawik: 449, modraszek: 450, bielinek: 451, cma: 452 } };
    // img/system/Motyle.png (tools/motyle/motyle_art.py): a row a kind, cells of 28x28, the body at x 14 (a butterfly ~18-22 px wide -
    // made bigger 2026-10-18: the 13 px ones were hardly seen); frames: 0 the wings open (from above), 1 half way up, 2 almost shut
    // (the undersides), 3 the tips down
    const SHEET = { file: "Motyle", cell: 28, body: 14, open: 0, half: 1, shut: 2, down: 3 };

    // the kinds. row: the sheet's row; season: how common in spring / summer / autumn / winter (the share among the day's flyers); speed:
    // px a frame in the air; shy: tiles a walking hero may come before it takes off (running: RUN_SHY for all); net: the chance a swing of
    // the net catches it (sitting x1.2, flying x0.85, on the shoulder x1.3, sneaking x1.1 - at most 0.95); likes: where it lands most
    const SPECIES = {
        cytrynek: { row: 0, season: [3, 1.6, 1.4, 0], speed: 1.15, shy: 1.7, net: 0.72, size: 1,
            card: "Motyle_Gablotka_Cytrynek" },
        pawik: { row: 1, season: [0, 0, 0, 0], speed: 1.05, shy: 2.1, net: 0.55, size: 1, rare: true, likes: ["nettle"],
            card: "Motyle_Gablotka_Pawik" },
        modraszek: { row: 2, season: [1, 3, 0.4, 0], speed: 1.35, shy: 1.4, net: 0.6, size: 0.85,
            card: "Motyle_Gablotka_Modraszek" },
        bielinek: { row: 3, season: [1.6, 2.2, 1.8, 0], speed: 1.1, shy: 1.5, net: 0.78, size: 1, likes: ["cabbage"],
            card: "Motyle_Gablotka_Bielinek" },
        cma: { row: 4, season: [1, 1, 0.6, 0], speed: 1.4, shy: 1.0, net: 0.82, size: 0.95, night: true,
            card: "Motyle_Gablotka_Cma" }
    };
    Watki.scal(SPECIES, "motyle", "gatunki");   // (its words: js/teksty/motyle.txt, gatunki)
    const ORDER = ["cytrynek", "pawik", "modraszek", "bielinek", "cma"];

    // where they live: map -> how many (1 = a meadow full of flowers). zone: only that rectangle of the map (x0, y0, x1, y1); region: only
    // the bought land of <BuildRegion:N> (Homes.js), and only once it is the hero's own
    const MAPS = {
        4: { k: 1 }, 17: { k: 1 }, 18: { k: 1 },
        24: { k: 1 },
        3: { k: 0.85 }, 20: { k: 0.8 },
        8: { k: 0.8, zone: [1, 5, 12, 16] },
        111: { k: 0.8, region: true }, 168: { k: 0.8, region: true },
        155: { k: 0.6 },
        12: { k: 0 }   // (the Dark Forest: none)
    };
    Watki.scal(MAPS, "motyle", "mapy");   // (its words: js/teksty/motyle.txt, mapy)
    const WILD = { k: 0.35, tilesets: [9] };   // other outdoor maps of the meadows' tileset: a few

    // which tiles are flowers. A2: the autotile kinds of the flowery meadow (12 the mixed one, 13 the blue stars); upper: B/C/D tiles
    // of the green Winlu sheets (flower beds, window boxes, single flowers - not the toadstools); events: the flowering bushes;
    // gather: the plants of Farming's ground (the share they count as a flower; the nettle mostly for the peacock)
    const FLOWERS = {
        a2: [12, 13],
        upper: [7, 8, 15, 262, 270, 276, 284, 474, 696, 700, 701, 704, 705, 706, 707, 708, 709, 710, 734],
        tall: [700, 701, 262, 270, 276, 284],
        events: /^!\$Bush_(Flower|Clover)/,
        gather: { fiber: 1, herb: 1, yarrow: 1, garlic: 0.6, wildCarrot: 0.8, nettle: 0.5 },
        crops: { potato: { from: 2, z: 13 } },   // the crops that flower (from that stage of growth)
        cabbage: "cabbage"
    };

    // how many fly: MAX_ON_SCREEN at most on the screen, MAX on the map round it; the day's shape (hours after sunrise / before sunset);
    // after rain more (a day), in a drought fewer, in rain and a storm none (they hide)
    const LIMITS = { maxOnScreen: 8, max: 12, moths: 10, base: 7, autumnMax: 2, roomMoths: 4 };   // (roomMoths: in a dark room, all its candles together)
    const WEATHER = { afterRain: 1.6, afterRainHours: 24, dry1: [6, 0.65], dry2: [10, 0.4], windy: [0.5, 0.5], gather: 0.3 };
    const SEASON_K = [1, 1.15, 0.3, 0];
    const RUN_SHY = 3.2;                 // tiles: a running hero scares off every butterfly this near
    const SNEAK_SHY = 0.55;              // tiles: sneaking (C), only this near (and half the time)
    // the peacock: at dawn (from just before sunrise to PAWIK_HOURS after it) the morning after a rain (rain that ended within
    // PAWIK_RAIN hours before sunrise, or rain this early morning that is over); on a butterfly map with flowers, PAWIK_CHANCE of the days
    const PAWIK = { hours: 2.5, rain: 18, chance: 0.7, seasons: [0, 1] };
    // the shoulder: a still (or sneaking) hero now and then has a butterfly land on him or on his raven
    const SHOULDER = { still: 150, every: 60, chance: 0.06, sneakChance: 0.04, stay: [240, 600], z: 50, raven: 0.4, ravenPeck: 0.5 };

    // pollination (the user: a small bonus): butterflies at flowers - a flowering crop (potato), a fruit tree, a beehive - with flower
    // spots within RADIUS tiles. The extra is a roll per harvest / pick / jar: crops and fruit +1 at CROP / FRUIT x p, honey each jar
    // +1 at HONEY x p; p = the place's pollinators 0..1 (the map's kind x the season [1, 1, 0.5, 0] x flowers near: 2+ spots 1, 1 spot 0.5)
    const POLLEN = { radius: 5, crop: 0.35, fruit: 0.35, honey: 0.15, season: [1, 1, 0.5, 0] };
    // the cabbage whites at the cabbages: one sitting on a cabbage NIBBLE frames marks it; at the harvest a marked cabbage loses 1 head
    // (never the last); not watched, a cabbage that grew in the autumn loses one at AWAY x the map's kind. A scarecrow (radius 3) or
    // the raven guarding the field keeps them off
    const CABBAGE = { nibble: 600, away: 0.2, loss: 1 };

    // the net: made at the workbench, cheap (2 branches, 3 fibres)
    const NET_RECIPE = { id: "butterfly_net", inputs: [[ITEM.branch, 2], [ITEM.fiber, 3]], output: [ITEM.net, 1], manual: true, unique: true,
        hours: 1, stamina: 2, startSe: "Item1" };
    Watki.scal(NET_RECIPE, "motyle", "przepis");   // (its words: js/teksty/motyle.txt, przepis)
    const REACH = 1.15;   // tiles round the net's point in front of him (0.9 tile ahead)

    const TX = Watki.teksty("motyle");

    // the journal's display case (Journal tab "Gablotka")
    const CASE = {
        tab: "Gablotka"
    };
    Watki.scal(CASE, "motyle", "gablotka");   // (its words: js/teksty/motyle.txt, gablotka)

    // brother Kleofas writes the kinds into the chronicle (Motyle.js: a talk of his while the hero has a kind he has not written yet)
    const KLEOFAS = {
        reward: { items: [[ITEM.honey, 2]], xp: 40 }
    };
    Watki.scal(KLEOFAS, "motyle", "kleofas");   // (its words: js/teksty/motyle.txt, kleofas)

    // ------------------------------------------------------------------ the things carried, the remarks (they go with the quest's pack)
    const VITEMS = { pawik: { icon: ICON.butterfly } };
    Watki.scal(VITEMS, "motyle", "rzeczy");   // (its words: js/teksty/motyle.txt, rzeczy)
    const REMARKS = [
        { id: "elaMotylLudmila", who: "ludmila", flag: "elaMotyl" },
        { id: "elaMotylEla", who: "ela", flag: "elaMotyl" }
    ];
    Watki.scal(REMARKS, "motyle", "uwagi");   // (its words: js/teksty/motyle.txt, uwagi)

    // ------------------------------------------------------------------ the thread (the engine Watki.js, docs/WATKI_DANE.md): K54 "Motyl
    // z oczkami" (docs/QUESTY.md, the next free K number - its words: js/teksty/motyle.txt, zadania.K54; into window.TownQuestsPacks
    // with the things and the remarks) and Kleofas's chronicle of the kinds (the hooks: Motyle.js)
    const w = Watki.watek({
        id: "motyle", wtyczka: "Motyle", teksty: "motyle",
        zadania: {
            // the offer only while peacocks fly (spring, summer, the first week of autumn)
            K54: { kind: "K", giver: "ela", icon: ICON.butterfly, offer: { cond: { hours: [7, 19], day: 3, fn: "k54Pora" } }, oferta: "poraPawika",
                kroki: [{ nazwa: "k54Pawik", type: "bring", to: "ela", need: [["v:pawik", 1]], hours: [6, 21] }],
                reward: { xp: 60, opinion: 2, flag: "elaMotyl", items: [[ITEM.drawing, 1]] } }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS },
        // brother Kleofas writes the kinds not written yet (ctx.swieze, their names ctx.lista); the whole case (ctx.wszystkie) - his thanks
        rozmowy: {
            kronika: [{ jesli: { i: ["ctx:wszystkie", "!ctx:juzCala"] }, to: ["kleofas.full"], inaczej: [{ mow: "kleofas.partial", zmienne: { lista: { ctx: "lista" } } }] },
                { zrob: "kronika", args: [{ ctx: "swieze" }, { ctx: "wszystkie" }] }]
        },
        akcje: { kronika: [{ hak: "kronika", args: [{ arg: 0 }, { arg: 1 }] }] }
    });
    const K54 = w.Q.K54;

    window.MotyleData = { ITEM, ICON, SHEET, SPECIES, ORDER, MAPS, WILD, FLOWERS, LIMITS, WEATHER, SEASON_K, RUN_SHY, SNEAK_SHY, PAWIK, SHOULDER,
        POLLEN, CABBAGE, NET_RECIPE, REACH, TX, CASE, KLEOFAS, K54, VITEMS, REMARKS };
})();
