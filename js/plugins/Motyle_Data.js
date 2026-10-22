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
 * @orderAfter Birds
 *
 * @help
 * Motyle_Data.js - tylko dane i teksty (silnik: Motyle.js, zaraz pod nią).
 *
 * Gatunki: cytrynek, pawik (rzadki: tylko o świcie po deszczu), modraszek,
 * bielinek (lubi kapustę) i ćma (nocą przy ogniu).
 * Mapy z motylami: łąki (4, 17, 18), pole dziadka (3), podwórze dziadka (20),
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
        cytrynek: { name: "Cytrynek", latin: "Gonepteryx rhamni", row: 0, season: [3, 1.6, 1.4, 0], speed: 1.15, shy: 1.7, net: 0.72, size: 1,
            card: "Motyle_Gablotka_Cytrynek",
            desc: "Pierwszy motyl wiosny. Cytrynowożółty, z ostro zakończonymi skrzydłami i pomarańczową kropką na każdym z nich. Zimuje jako dorosły motyl w gęstwinie, więc budzi się, kiedy w cieniu jeszcze leży śnieg.",
            where: "Łąki, pole dziadka, ogrody. Najwięcej wiosną, latem mniej, jesienią pojedyncze." },
        pawik: { name: "Pawik", latin: "Aglais io", row: 1, season: [0, 0, 0, 0], speed: 1.05, shy: 2.1, net: 0.55, size: 1, rare: true, likes: ["nettle"],
            card: "Motyle_Gablotka_Pawik",
            desc: "Rdzawoczerwony, z czterema oczkami jak na pawim piórze - błękitnymi, w żółtej obwódce. Złożone skrzydła ma niemal czarne, jak zeschły liść. Jego gąsienice żyją na pokrzywach.",
            where: "Rzadki: wylatuje tylko o świcie po deszczu, wiosną i latem, kiedy słońce suszy kwiaty. Lubi pokrzywy." },
        modraszek: { name: "Modraszek", latin: "Polyommatus icarus", row: 2, season: [1, 3, 0.4, 0], speed: 1.35, shy: 1.4, net: 0.6, size: 0.85,
            card: "Motyle_Gablotka_Modraszek",
            desc: "Mały, błękitny jak niebo nad łąką, z białą frędzlą na brzegach skrzydeł. Spód skrzydeł ma szarobeżowy, w pomarańczowe kropki. Szybki i płochliwy - najtrudniej go złapać.",
            where: "Kwitnące łąki, najwięcej latem." },
        bielinek: { name: "Bielinek", latin: "Pieris brassicae", row: 3, season: [1.6, 2.2, 1.8, 0], speed: 1.1, shy: 1.5, net: 0.78, size: 1, likes: ["cabbage"],
            card: "Motyle_Gablotka_Bielinek",
            desc: "Biały, z czarnymi końcami przednich skrzydeł i czarnymi kropkami. Leci wszędzie tam, gdzie rośnie kapusta: składa na niej jaja, a gąsienice obgryzają liście.",
            where: "Wszędzie przy kwiatach, jesienią przy kapuście. Strach na wróble albo kruk pilnujący pola odpędzą go od grządek." },
        cma: { name: "Ćma", latin: "nocny gatunek", row: 4, season: [1, 1, 0.6, 0], speed: 1.4, shy: 1.0, net: 0.82, size: 0.95, night: true,
            card: "Motyle_Gablotka_Cma",
            desc: "Szarobrązowa ćma o trójkątnych skrzydłach. Za dnia śpi przyklejona do kory, nocą leci do każdego ognia: krąży wokół ogniska, pochodni i latarni, aż zakręci się jej w głowie.",
            where: "Nocą przy ogniu: ogniska, pochodnie (także wbite w ziemię), latarnie, kosze ogniowe. Najłatwiej ją złapać właśnie przy płomieniu." }
    };
    const ORDER = ["cytrynek", "pawik", "modraszek", "bielinek", "cma"];

    // where they live: map -> how many (1 = a meadow full of flowers). zone: only that rectangle of the map (x0, y0, x1, y1); region: only
    // the bought land of <BuildRegion:N> (Homes.js), and only once it is the hero's own
    const MAPS = {
        4: { k: 1, name: "łąka" }, 17: { k: 1, name: "łąka" }, 18: { k: 1, name: "łąka" },
        24: { k: 1, name: "ogród Lorda" },
        3: { k: 0.85, name: "pole dziadka" }, 20: { k: 0.8, name: "podwórze dziadka" },
        8: { k: 0.8, name: "ogród rycerzy", zone: [1, 5, 12, 16] },
        111: { k: 0.8, name: "działka pod lasem", region: true }, 168: { k: 0.8, name: "Spalona zagroda", region: true },
        155: { k: 0.6, name: "pustelnia" },
        12: { k: 0 }   // (the Dark Forest: none)
    };
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
    const NET_RECIPE = { id: "butterfly_net", name: "Zrób siatkę na motyle", inputs: [[ITEM.branch, 2], [ITEM.fiber, 3]], output: [ITEM.net, 1], manual: true, unique: true,
        hours: 1, stamina: 2, startSe: "Item1",
        desc: "Długi kij, obręcz z giętkiej gałązki i worek z lnianego włókna. Podejdź do motyla (najlepiej skradając się, C) i naciśnij O. Złapany trafia do gablotki w Dzienniku, a ty go wypuszczasz." };
    const REACH = 1.15;   // tiles round the net's point in front of him (0.9 tile ahead)

    const TX = {
        caught: "Złapany: ",
        newKind: "Nowy okaz w gablotce",
        missed: "Uciekł...",
        released: "Wypuszczasz go. Odlatuje.",
        pawikNet: "Pawik w siatce. Pokaż go Eli przed zmierzchem.",
        pawikGone: "Pawik w siatce osłabł. Wypuszczasz go - odfruwa.",
        noNet: "Potrzebujesz siatki na motyle",
        honey: "Motyle przy kwiatach: +",
        crop: "Zapylone kwiaty: +",
        nibbled: "Bielinki podgryzły kapustę: -",
        full: "Gablotka pełna: wszystkie gatunki",
        f9none: "Nie ma tu ognia - wbijam pochodnię",
        f9moths: "Ćmy lecą do ognia",
        f9butter: "Motyle: łąka, lato, po deszczu",
        f9net: "Siatka na motyle"
    };

    // the journal's display case (Journal tab "Gablotka")
    const CASE = {
        tab: "Gablotka",
        title: "Gablotka z motylami",
        pollenTitle: "Zapylanie",
        pollen: "Motyle przy kwiatach zapylają to, co kwitnie: zbiór ziemniaków (kwitną) i owoce dzikich jabłoni i grusz bywają większe o jedną sztukę, a ul w pobliżu kwiatów daje czasem słoik miodu więcej. Najwięcej wiosną i latem, jesienią mniej, zimą wcale. Bielinki za to podgryzają kapustę - strach na wróble albo kruk pilnujący pola je odpędzą.",
        kleofasHint: "Brat Kleofas z pustelni na klifie spisze złapane gatunki w kronice - jeśli ma czym pisać.",
        empty: "Gablotka jest pusta. Zrób w warsztacie siatkę na motyle (gałęzie i włókno), podejdź do motyla - najlepiej skradając się (C) - i naciśnij O.",
        drawingTitle: "Rysunek Eli",
        drawing: "Pawik z czterema oczkami, Ela w chustce i ja z siatką. Kredka trochę się kruszyła, więc słońce ma tylko pół promieni. Ela mówi, że to dlatego, że było rano."
    };

    // brother Kleofas writes the kinds into the chronicle (Motyle.js: a talk of his while the hero has a kind he has not written yet)
    const KLEOFAS = {
        partial: ["Motyle? (Kleofas sięga po pióro.) Mów, jakie złapałeś.", "> {lista}.", "Zapisane. Zakon spisał zielnik, ale motyli nikt nigdy nie liczył. Będziesz pierwszy."],
        full: ["Cytrynek, pawik, modraszek, bielinek i ćma. Pięć. (Kleofas dmucha na atrament.)",
            "Pszczoły nie dadzą rady same. Motyle zapylają to, czego pszczołom się nie chce. Masz - z moich uli. Zasłużyłeś."],
        note: ["Kronika motyli", "Brat Kleofas wpisał do kroniki wszystkie pięć gatunków z mojej gablotki: cytrynka, pawika, modraszka, bielinka i ćmę. Pierwsza taka lista od czasów zakonu."],
        reward: { items: [[ITEM.honey, 2]], xp: 40 }
    };

    // ------------------------------------------------------------------ K54 "Motyl z oczkami" (docs/QUESTY.md, the next free K number)
    const K54 = {
        id: "K54", kind: "K", title: "Motyl z oczkami", giver: "ela", icon: ICON.butterfly, where: "obóz uchodźców (Ela)", when: "wiosną i latem, za dnia, od dnia 3",
        desc: "Ela widziała w książce mamy motyla z oczkami na skrzydłach - pawika. Żywego nie widziała nigdy. Złap go siatką i pokaż jej. Nie zabijaj.",
        offer: {
            cond: { hours: [7, 19], day: 3, fn: "k54Pora" },
            say: ["Mama miała książkę z obrazkami. Taką ze zwierzętami. Spaliła się razem z chatą...",
                "Był tam motyl z oczkami na skrzydłach! Cztery oczka, niebieskie, z żółtym. Mama mówi, że to pawik.",
                "Ja jeszcze nigdy takiego nie widziałam. Naprawdę. Złapiesz mi? Tylko go nie zabijaj!"],
            yes: "Złapię i ci pokażę.", no: "Może kiedyś.",
            accept: ["Mama mówi, że pawiki wylatują rano po deszczu, jak słońce suszy skrzydła. I że lubią pokrzywy, bo tam się rodzą.",
                "Łapie się je siatką. Taką na kiju. Ty umiesz wszystko zrobić, prawda?"],
            decline: ["Dobrze... To narysuję go sobie jeszcze raz. Z pamięci."]
        },
        steps: [
            { type: "bring", to: "ela", need: [["v:pawik", 1]], hours: [6, 21],
                text: "Zrób siatkę na motyle (warsztat: gałęzie i włókno), złap pawika i pokaż go Eli w obozie. Pawiki latają tylko o świcie po deszczu, wiosną i latem, i lubią pokrzywy. W siatce wytrzyma do zmierzchu.",
                remind: ["Pawik! Z oczkami! Rano po deszczu, pamiętasz?"],
                hero: ["> Ela, chodź tu. Powoli... Zobacz, co mam w siatce."],
                done: ["(Ela przykłada nos do siatki i wstrzymuje oddech.)", "Oczka! Cztery! Patrzą na mnie... Jest ładniejszy niż w książce!",
                    "Wypuścimy go? Razem? Na trzy... Leć, motylku!", "(Pawik wyfruwa z siatki, okrąża obóz i znika nad murem.)",
                    "Poczekaj! Mam coś dla ciebie. Narysowałam go wczoraj, z pamięci. Teraz wiem, że dobrze. I ciebie dorysowałam. Z siatką."] }
        ],
        reward: { xp: 60, opinion: 2, flag: "elaMotyl", items: [[ITEM.drawing, 1]],
            note: ["Motyl z oczkami", "Złapałem pawika i pokazałem go Eli. Wypuściliśmy go razem, a ona dała mi swój rysunek: pawik, ona i ja z siatką. Ludmiła się uśmiechnęła - pierwszy raz, odkąd ją znam."] }
    };
    const VITEMS = { pawik: { name: "Pawik w siatce", icon: ICON.butterfly } };
    const REMARKS = [
        { id: "elaMotylLudmila", who: "ludmila", flag: "elaMotyl", lines: ["Ela narysowała tego motyla już dziesięć razy. Na desce, na piasku, na ścianie namiotu. Dziękuję ci. Długo się tak nie śmiała."] },
        { id: "elaMotylEla", who: "ela", flag: "elaMotyl", lines: ["Myślisz, że pawik wróci? Mama mówi, że jak się coś wypuści, to wraca. Albo jego dzieci."] }
    ];
    (window.TownQuestsPacks = window.TownQuestsPacks || []).push({ owner: "Motyle", quests: [K54], vitems: VITEMS, remarks: REMARKS });

    window.MotyleData = { ITEM, ICON, SHEET, SPECIES, ORDER, MAPS, WILD, FLOWERS, LIMITS, WEATHER, SEASON_K, RUN_SHY, SNEAK_SHY, PAWIK, SHOULDER,
        POLLEN, CABBAGE, NET_RECIPE, REACH, TX, CASE, KLEOFAS, K54, VITEMS, REMARKS };
})();
