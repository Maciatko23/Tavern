//=============================================================================
// Podroznicy_Data.js
//=============================================================================
// The ferry's travellers (docs/PODROZNI.md, stage 1 "the core", 2026-10-28) - the DATA. The engine: Podroznicy.js.
// Stands in the plugin list under the other packages' data (Zakon_Data) and above TownLife and TownQuests_Data, so that:
//   - window.TownLifeExtra gets the travellers as residents of the town (TownLife's fourth range of ids, 3020-3049): the cast 3020-3033,
//     the Free Company 3034-3037, four "places of the pool" 3038-3041 (whoever of the pool is on the island wears them), Ksenia 3042,
//     "the guest of room three" 3043; 3044-3049 spare. Their name, sheet, map, plan, places indoors and words are getters asking the
//     engine (window.Podroznicy) - a traveller lives in the town only while on the island (the book), elsewhere it has no event;
//   - the thread "podroznicy" (Watki.js) is made before TownQuests_Data: its state (Tawerna.state "podroznicy", version 1), its words
//     (js/teksty/podroznicy.txt), the talks and its F9 section; stage 2 puts the cast's quests here (zadania: K71...);
//   - the town's spots the travellers walk to (TownLifeData.SPOTS), the rooms' places upstairs (SPOTS_BY_MAP[25]), the busts of the
//     stand-in sheets (SpeechBubbles.BUSTS) - the sheets are made by tools/podroznicy/zastepcze.py, PixelLab's will replace the files.
// What is when (the cast's windows, the stays, the rooms) is the table of docs/PODROZNI.md 1.2; the engine plans each ferry by it.

/*:
 * @target MZ
 * @plugindesc Podróżni z promu - dane: obsada (okna przybycia, pobyt, pokoje), pula losowa, pokoje 4-24, plany dnia, Renoma, scena przybycia; mieszkańcy TownLife 3020-3049. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Zakon_Data
 *
 * @help
 * ============================================================================
 * Podroznicy_Data.js - dane podróżnych z promu (docs/PODROZNI.md)
 * ============================================================================
 * Same dane - silnik: Podroznicy.js. Teksty: js/teksty/podroznicy.txt.
 * Obsada: kto, kiedy (okno: najwcześniej, warunek, najpóźniej), na ile
 * (promy), który pokój. Pula: 16 typów zwykłych podróżnych na zastępczych
 * arkuszach. Pokoje gości 4-24 (bez 7 - Eryk Sowa); pokoje 1 i 2 zawsze
 * dla bohatera, 3 i Złoty tylko z furtką TavernLife (etap 3).
 * Miejsca w sali (Map001) stawia gracz: zdarzenia „Miejsce: podrozny_1”
 * ... „podrozny_6”, „kompania_1..4”, „grajek”, „medyk” - bez nich podróżni
 * siedzą u siebie w pokoju na piętrze.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Podroznicy_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");
    const P = () => window.Podroznicy || null;   // (the engine: below on the list - asked only in the game)

    // ------------------------------------------------------------------ numbers
    const IDS = { aktorzy: [3002, 3008], rekwizyty: [3010, 3017], mieszkancy: [3020, 3049] };
    const LIMIT = { rozdzial: 4, renoma: 5, akt2: 5, renomaProg: 60 };   // travellers on the island at once (a group counts as one)
    const NOWYCH_NA_PROM = 3;                                            // the cast and the pool together
    const PULA_NA_PROM = 2;                                              // at most from the pool on one ferry
    const ZLOTO_PRZYSLUG = 10;                                           // the pool's small favours: at most this much gold a ferry
    const GODZINY = { plan: 6, przybija: 9, molo: 11, wDrodze: 12, sala: 12, rachunek: 11, odjazdMolo: 14, odplywa: 15 };
    const RENOMA = { start: 30, min: 0, max: 100, log: 30,
        // the words of the book: the first threshold the renown is at or above (js/teksty/podroznicy.txt renoma.opis.<prog>)
        opisy: [80, 60, 40, 20, 0],
        bezKonca: -2 };                                                  // a traveller gone with his matter not settled

    // ------------------------------------------------------------------ the rooms of the guests' floor (Map025): the type (the plan
    // of the tavern - TavernLife_Plan.js PLAN_DATA), the price of a night (Borgar's takings: 1-os. 8, 2-os. 15, rodzinny 20 G) and the
    // place of a traveller "at home" (tools/podroznicy/miejsca_pokoi.py - by his chest or candle; a "Miejsce: pokoj_<n>" event the
    // user puts on Map025 moves it). 1, 2 and 3 are the hero's (3 and the Gold suite only with TavernLife's gate - stage 3); 7 is
    // Eryk Sowa's (the castaway, Wrak_Data.js)
    const CENY = { "1-os.": 8, "2-os.": 15, rodzinny: 20 };
    const POKOJE = {
        4: { typ: "rodzinny", miejsce: [67, 38, 8] }, 5: { typ: "2-os.", miejsce: [14, 38, 8] }, 6: { typ: "2-os.", miejsce: [84, 42, 2] },
        8: { typ: "1-os.", miejsce: [92, 39, 4] }, 9: { typ: "2-os.", miejsce: [28, 63, 2] }, 10: { typ: "2-os.", miejsce: [68, 63, 2] },
        11: { typ: "rodzinny", miejsce: [24, 63, 2] }, 12: { typ: "2-os.", miejsce: [72, 63, 2] }, 13: { typ: "rodzinny", miejsce: [11, 65, 2] },
        14: { typ: "rodzinny", miejsce: [85, 65, 2] }, 15: { typ: "1-os.", miejsce: [39, 27, 4] }, 16: { typ: "1-os.", miejsce: [59, 27, 4] },
        17: { typ: "2-os.", miejsce: [67, 27, 4] }, 18: { typ: "rodzinny", miejsce: [77, 27, 4] }, 19: { typ: "rodzinny", miejsce: [89, 27, 4] },
        20: { typ: "rodzinny", miejsce: [31, 6, 4] }, 21: { typ: "1-os.", miejsce: [23, 8, 4] }, 22: { typ: "2-os.", miejsce: [13, 6, 4] },
        23: { typ: "1-os.", miejsce: [5, 8, 4] }, 24: { typ: "2-os.", miejsce: [86, 10, 2] }
    };
    // the hero's rooms: never a traveller's (1, 2); 3 and the Gold suite only for a traveller whose data says so (wymaga: "furtka")
    const POKOJE_BOHATERA = { 1: true, 2: true, 3: "furtka", zloty: "furtka" };
    const POKOJ_ERYKA = 7;
    const POKOJ_RAFALA = 1;   // (W6: Rafał hidden in the tavern - "krewniak Borgara" in the book)
    const MIEJSCA_W_SALI = 6; // the user's "Miejsce: podrozny_1..6" on Map001

    // ------------------------------------------------------------------ the cast (docs/PODROZNI.md 1.2), in the table's order - the
    // ferry is planned in this order while there is room. Each visit: od (the earliest day; or po: { kto, dni } - days after another's
    // arrival), gdy (a condition: "dzien:31", "obecny:<key>" / "byl:<key>" (another traveller on the island / once here), "flaga:x"
    // (TownQuests' flag), and the game's - "miasteczko" (the hero has been to the town), "kartograf" (6+ places on the island's map from
    // day 16, 10+ earlier), "zmiany:3" (shifts at Borgar's), "janek" (met), "w8" / "w3" (W8 begun / W3 going), "pokoj" (a room rented
    // once), "akt2"; "!..." not, "a&b" both, "a|b" either - Podroznicy.logika.warunek), do (the latest: the first visit
    // comes then anyway; a return's window ends), promy (the stay: ferries) or doDnia (leaves on that day, at least one ferry later).
    // wymaga: "furtka" - only once TavernLife can refuse a hero's room taken (stage 3: room 3, the Gold suite). przystan: on the ferry
    // days 9-15 on the pier (Urszula). profil: the day's plan (PLANY below). grupa: one place in the limit, several residents.
    // miejsce: the hall's place it would like (Map001 "Miejsce: podrozny_<n>"). kobieta: the words of a woman ("odpłynęła").
    // zadania: the quests of its matter (stage 2: "K71"...) - while one is going on at its departure, it stays a ferry longer, once
    const OBSADA = [
        { key: "tobiasz", id: 3020, arkusz: "$Npc_Tobiasz", pokoj: 23, profil: "goniec", miejsce: 1, zadania: ["K71", "K72"],
            wizyty: [{ od: 4, do: 7, gdy: "miasteczko", promy: 1 }, { od: 13, do: 16, promy: 1 }, { od: 25, do: 28, promy: 1 },
                { od: 37, do: 40, promy: 1 }, { od: 46, do: 49, promy: 1 }, { od: 55, do: 58, promy: 1 }] },
        { key: "medyk", id: 3021, arkusz: "$Npc_Medyk", pokoj: 11, profil: "medyk", miejsce: 5, zadania: ["D39"],
            wizyty: [{ od: 7, do: 7, promy: 2 }, { od: 52, do: 58, promy: 2 }] },
        { key: "zboze", id: 3024, arkusz: "$Npc_Zboze", pokoj: 20, profil: "zboze", miejsce: 6, zadania: ["D42"],
            wizyty: [{ od: 10, do: 10, promy: 2 }, { od: 46, do: 52, gdy: "!flaga:zbozeZdemaskowany", promy: 2 }] },
        { key: "relikwie", id: 3028, arkusz: "$Npc_Relikwie", pokoj: 12, profil: "relikwie", miejsce: 3,
            wizyty: [{ od: 13, do: 16, doDnia: 25 }, { od: 61, do: 120, gdy: "akt2&!flaga:gasparZdemaskowany", promy: 2 }] },
        { key: "kartograf", id: 3022, arkusz: "$Npc_Kartograf", pokoj: 22, profil: "kartograf", miejsce: 2, zadania: ["D40"],
            wizyty: [{ od: 10, do: 19, gdy: "kartograf", promy: 2 }, { od: 40, do: 46, promy: 2 }] },
        { key: "ksenia", id: 3042, arkusz: "$Npc_Ksenia", pokoj: 18, profil: "ksenia", miejsce: 4, kobieta: true,
            wizyty: [{ od: 16, do: 22, gdy: "zmiany:3", promy: 2 }] },
        { key: "wizytator", id: 3029, arkusz: "$Npc_Wizytator", pokoj: 16, profil: "wizytator", miejsce: 2,
            wizyty: [{ po: { kto: "relikwie", dni: 6 }, do: 22, gdy: "obecny:relikwie|byl:relikwie", promy: 3 }] },
        { key: "urszula", id: 3025, arkusz: "$Npc_Urszula", pokoj: 21, profil: "urszula", miejsce: 6, przystan: true, kobieta: true, zadania: ["D43"],
            wizyty: [{ od: 19, do: 22, gdy: "janek", promy: 3 }] },
        { key: "dezerter", id: 3030, arkusz: "$Npc_Dezerter", pokoj: 5, profil: "dezerter", miejsce: 4,
            wizyty: [{ od: 25, do: 25, doDnia: 37 }] },
        { key: "lowczyni", id: 3031, arkusz: "$Npc_Lowczyni", pokoj: 6, profil: "lowczyni", miejsce: 5, kobieta: true,
            wizyty: [{ po: { kto: "dezerter", dni: 3 }, gdy: "obecny:dezerter", promy: 2 }] },
        { key: "kompania", grupa: ["kompania_1", "kompania_2", "kompania_3", "kompania_4"], pokoje: [9, 9, 10, 10], profil: "kompania", kobieta: true,
            wizyty: [{ od: 28, do: 31, gdy: "w8|dzien:31", promy: 3 }] },
        { key: "grajek", id: 3023, arkusz: "$Npc_Grajek", pokoj: 17, profil: "grajek", miejsce: 1, zadania: ["D41"],
            wizyty: [{ od: 22, do: 34, gdy: "w3|dzien:31", doDnia: 43 }] },
        { key: "poborca", id: 3026, arkusz: "$Npc_Poborca", pokoj: 4, profil: "poborca", miejsce: 3,
            wizyty: [{ od: 34, do: 34, promy: 2 }] },
        { key: "pielgrzym", id: 3027, arkusz: "$Npc_Pielgrzym", pokoj: 15, profil: "pielgrzym", miejsce: 2,
            wizyty: [{ od: 37, do: 37, promy: 3 }, { od: 61, do: 120, gdy: "akt2&!flaga:pielgrzymZlapany&!flaga:pielgrzymZdemaskowany", promy: 2 }] },
        { key: "posel", grupa: ["posel", "gwardzista"], pokoje: ["zloty", "zloty"], profil: "posel", wymaga: "furtka",
            wizyty: [{ od: 40, do: 43, gdy: "obecny:pielgrzym", promy: 2 }] },
        { key: "trojka", id: 3043, arkusz: "$Npc_Trojka", pokoj: 3, profil: "trojka", wymaga: "furtka",
            wizyty: [{ od: 46, do: 52, gdy: "pokoj", promy: 2 }] }
    ];
    // the residents of the groups (one place in the limit; their rooms: the group's `pokoje` in order)
    const CZLONKOWIE = {
        kompania_1: { id: 3034, arkusz: "$Npc_Kompania_1", miejsce: "kompania_1" },
        kompania_2: { id: 3035, arkusz: "$Npc_Kompania_2", miejsce: "kompania_2" },
        kompania_3: { id: 3036, arkusz: "$Npc_Kompania_3", miejsce: "kompania_3" },
        kompania_4: { id: 3037, arkusz: "$Npc_Kompania_4", miejsce: "kompania_4" },
        posel: { id: 3032, arkusz: "$Npc_Posel" },
        gwardzista: { id: 3033, arkusz: "$Npc_Gwardzista" }
    };

    // ------------------------------------------------------------------ the pool: 16 kinds of ordinary travellers (docs/PODROZNI.md
    // 1.2) - a body (four stand-in bodies in a few colours each), a woman or not (the names), richer (more often from renown 60);
    // przysluga: one small favour (stage 1: "daj" - the hero gives things for a reward, "usluga" - he pays for a service, "rada" -
    // the traveller's knowledge; the others - carrying, leading, looking for a child - come with stage 2 as small quests)
    const CIALA = {
        m: ["$Npc_Pula_M", "$Npc_Pula_M2", "$Npc_Pula_M3"],
        k: ["$Npc_Pula_K", "$Npc_Pula_K2", "$Npc_Pula_K3"],
        s: ["$Npc_Pula_S", "$Npc_Pula_S2"],
        z: ["$Npc_Pula_Z", "$Npc_Pula_Z2"]
    };
    const PULA = {
        flisak: { cialo: "z", profil: "flisak" },
        kupiec_sukno: { cialo: "m", profil: "kupiec", zamozny: true },
        patniczka: { cialo: "k", kobieta: true, profil: "pielgrzym" },
        zolnierz: { cialo: "m", profil: "zolnierz" },
        kowal: { cialo: "m", profil: "rzemieslnik", zamozny: true, przysluga: { co: "usluga", cena: 5, hak: "naostrz" } },
        cyrulik: { cialo: "m", profil: "uczony", zamozny: true, przysluga: { co: "daj", rzeczy: [[150, 3]], zloto: 5 } },
        uczen: { cialo: "m", profil: "kupiec", zamozny: true },
        wyspiarz: { cialo: "s", profil: "wyspiarz" },
        matka: { cialo: "k", kobieta: true, profil: "zwykly" },
        mysliwy: { cialo: "m", profil: "zwykly" },
        skryba: { cialo: "s", profil: "uczony", zamozny: true },
        szwaczka: { cialo: "k", kobieta: true, profil: "kupiec" },
        mnich: { cialo: "s", profil: "pielgrzym", przysluga: { co: "daj", rzeczy: [[83, 1]], opinia: 1 } },
        marynarz: { cialo: "z", profil: "flisak", przysluga: { co: "rada", hak: "pogoda" } },
        zielarka: { cialo: "k", kobieta: true, profil: "zwykly" },
        kostkarz: { cialo: "m", profil: "zolnierz" }
    };
    const SLOTY_PULI = [{ key: "pula_1", id: 3038 }, { key: "pula_2", id: 3039 }, { key: "pula_3", id: 3040 }, { key: "pula_4", id: 3041 }];
    const POBYT_PULI = [1, 2];   // ferries

    // ------------------------------------------------------------------ the day of a traveller (docs/PODROZNI.md 1.4): the night in the
    // room 23-7, the breakfast in the hall 7-9, the morning's business (rano), the dinner 12-14, the afternoon (popoludnie), the evening
    // in the hall 18-23. The spots are TownLife's (Map008; "Miejsce:" events); podr_sala / podr_pokoj / podr_medyk / podr_grajek - in
    // the tavern (the hall's place of the user, else the room upstairs); podr_droga / podr_dwor / podr_przystan - away ("w drodze")
    const PLANY = {
        zwykly: { rano: [[9, "wander", "plac_9"]], popoludnie: [[14, "wander", "skwer"], [16.5, "inside", "podr_pokoj"]] },
        goniec: { rano: [[9, "patrol", ["ratusz_przed", "plac_studnia", "kantor_przed", "plac_tablica", "przed_tawerna"]]],
            popoludnie: [[14, "patrol", ["skwer", "plac_8", "dom_mieszczan", "plac_studnia"]]] },
        medyk: { sniadanie: [[7, "inside", "podr_sala"], [8, "inside", "podr_medyk"]], rano: [[11, "inside", "podr_sala"]],
            popoludnie: [[14, "wander", "pod_murem"]] },
        kartograf: { rano: [[9, "wander", "plac_studnia"]], popoludnie: [[14, "wander", "brama_twierdzy"], [15, "inside", "podr_sala"]] },
        grajek: { rano: [[9, "wander", "rynek_srodek"]], popoludnie: [[14, "wander", "skwer"]], wieczor: [[18, "inside", "podr_grajek"]] },
        // (D42: at 11 Zenon walks off to the garrison - Kłos's scales; the dinner at 12 brings him back)
        zboze: { rano: [[9, "wander", "kantor_rog"], [11, "inside", "podr_droga"]], popoludnie: [[14, "wander", "plac_6"], [16, "inside", "podr_sala"]] },
        relikwie: { rano: [[9, "wander", "plac_5"]], popoludnie: [[14, "wander", "plac_7"], [17, "wander", "kantor_przed"]] },
        ksenia: { rano: [[9, "wander", "stragan_2"]], popoludnie: [[14, "inside", "podr_pokoj"]] },
        wizytator: { rano: [[9, "wander", "kaplica_lawka"]], popoludnie: [[14, "wander", "ogrod_zakonu"], [16, "inside", "podr_sala"]] },
        urszula: { rano: [[9, "wander", "plac_tablica"]], popoludnie: [[14, "inside", "podr_sala"]] },
        dezerter: { sniadanie: [[6, "work", "plac_studnia"], [7, "inside", "podr_sala"]], rano: [[9, "wander", "pod_murem"]],
            popoludnie: [[14, "wander", "stodola"]] },
        lowczyni: { rano: [[9, "stand", "brama_twierdzy"]], popoludnie: [[14, "wander", "przed_tawerna"]] },
        kompania: { rano: [[9, "inside", "podr_pokoj"]], popoludnie: [[14, "wander", "skwer"]], noc: 1 },
        poborca: { rano: [[8, "inside", "podr_dwor"]], popoludnie: [[14, "inside", "podr_pokoj"]], wieczor: [[18, "inside", "podr_pokoj"]] },
        pielgrzym: { sniadanie: [[6.5, "wander", "kaplica_lawka"], [8, "inside", "podr_sala"]], rano: [[9, "wander", "ogrod_zakonu"]],
            popoludnie: [[14, "wander", "plyta"]] },
        posel: { rano: [[9, "inside", "podr_pokoj"]], popoludnie: [[14, "inside", "podr_pokoj"]] },
        trojka: { sniadanie: [[7, "inside", "podr_pokoj"]], rano: [[9, "inside", "podr_pokoj"]], popoludnie: [[14, "inside", "podr_pokoj"]],
            wieczor: [[18, "inside", "podr_pokoj"]] },
        // the pool's
        kupiec: { rano: [[9, "wander", "plac_6"]], popoludnie: [[14, "wander", "stragan_5"], [16.5, "inside", "podr_sala"]] },
        rzemieslnik: { rano: [[9, "wander", "plac_11"]], popoludnie: [[14, "wander", "plac_3"], [16.5, "inside", "podr_sala"]] },
        uczony: { rano: [[9, "wander", "dom_mieszczan"]], popoludnie: [[14, "inside", "podr_sala"]] },
        flisak: { rano: [[9, "wander", "plac_12"]], popoludnie: [[14, "wander", "przed_tawerna"], [16, "inside", "podr_sala"]] },
        zolnierz: { rano: [[9, "wander", "plac_tablica"]], popoludnie: [[14, "wander", "brama_twierdzy"], [16, "inside", "podr_sala"]] },
        wyspiarz: { rano: [[9, "wander", "rynek_lawka"]], popoludnie: [[14, "wander", "przed_tawerna"], [16, "inside", "podr_sala"]] }
    };
    // the town's spots of the travellers (Map008; never one of the town's own keys): the tavern's gate (the hall, the room) and the
    // ways off the town (the south gate - to Podgrodzie and the harbour; the east gate - to the manor)
    const SPOTS_MIASTA = { podr_sala: [51, 17, 8], podr_pokoj: [51, 17, 8], podr_medyk: [51, 17, 8], podr_grajek: [51, 17, 8],
        podr_droga: [52, 92, 2], podr_przystan: [52, 92, 2], podr_dwor: [100, 51, 6] };
    const W_DRODZE = ["podr_droga", "podr_przystan", "podr_dwor"];   // (TownLife's away: "inside" there = gone, in no interior)

    // ------------------------------------------------------------------ the harbour (Map125): the ferry comes at 9 - the scene of
    // the landing (docs/PODROZNI.md 8.1, example 1); the actors 3002-3008 stand on the pier 9-11 (the arrived), 14-15 (the leaving),
    // 9-15 on the ferry days (who watches the faces); the gangway 3010
    const SCENA = {
        mapa: 125,
        trap: [12, 18],                                  // the gangway's prop (the ferry lies at 11,21)
        zejscie: [12, 19],                               // where one comes off the ferry
        molo: [[14, 17, 6], [15, 17, 6], [16, 17, 6], [13, 16, 2], [14, 16, 2]],   // where the arrived stand till 11:00
        odjazd: [[13, 17, 4], [14, 17, 4], [15, 17, 4], [16, 17, 4], [13, 16, 2]],  // the leaving at 14-15 (facing the ferry)
        straz: [[17, 17, 8], [16, 16, 2]],               // who watches (Urszula; later Szczerba)
        kamera: [14, 18],                                // the cell the camera looks at
        celnik: "celnik", przewoznik: 760,               // Sambor (TownLife) and the ferryman (Przystan's 760)
        fala: [761, 762],                                // Przystan's people of a wave (on day 10: Ludmiła and Ela)
        klatki: { kamera: 70, krok: 14, dymek: 150, przerwa: 40, trzymaj: 72, zwloka: 90 }   // (zwloka: frames on the map before it may start)
    };

    // ------------------------------------------------------------------ the war's news by its stage (docs/PODROZNI.md 1.2): the key
    // of the words wiesci.<etap>
    const ETAPY_WOJNY = [{ do: 20, etap: "etap1" }, { do: 40, etap: "etap2" }, { do: 9999, etap: "etap3" }];

    // ------------------------------------------------------------------ stage 2 (2026-10-29): the first six's matters (docs/PODROZNI.md
    // 2.1-2.6) - the quests K71, K72, D39, D40, D41, D42, D43 of the thread below (their words: js/teksty/podroznicy.txt, zadania.*);
    // the hooks they name, the wall (I2), Antek and Zenon at the garrison, the sketches: Podroznicy_Sprawy.js
    const SPRAWY = {
        renoma: { K71: 2, D39: 3, D40: 3 },          // the renown when done (D41, D42, D43: by the choice - Podroznicy_Sprawy.js)
        k71: { listy: ["hanka", "soltys", "marta", "feliks"], zaList: 2, czujnosc: 6 },
        // K72: 2-3 letters a visit from these (the island's people); on the visit that begins on day 13 one is to brother Kleofas
        k72: { zaList: 2, ile: [2, 3], kleofasOd: 13,
            adresaci: ["piekarka", "kowal", "garbarz", "dzwonnik", "praczka", "celnik", "rotmistrz", "latarnik", "pustelnik", "znachorka"] },
        d39: { opinia: 20, poNocy: 3, przepis: "podr_opatrunek" },   // poNocy: hours after the night before the sołtys's talk
        d40: { szkice: 5, mapa: 178, slawa: 3 },
        d41: { zaklad: 10, miod: 137, prog: 20, natchniony: 4, kupala: 42, melia: { pogodz: 5, wygrana: 10, przegrana: -5 }, renoma: { pogodz: 3, odpraw: -2 } },
        d42: { cena: 8, najwyzej: 20, jeczmien: 74, garnizon: 162, sledzenie: [11, 13.5], widzi: 7, celnik: 5, chleb: 83,
            narada: { po: 2, godziny: [20, 22.5] }, opinia: { ujawnij: 5, handel: -2 } },
        d43: { wykup: 40, przychylnosc: 40, hart: 5, garnizon: 5, renoma: 4, opinia: 3 },
        // the actors at the garrison (Map162; ids of Podroznicy's actors): Antek among the recruits (D43, 7-19), Zenon at Kłos's scales
        // (D42, his walk 11-13:30)
        aktorzy: {
            antek: { id: 3009, mapa: 162, x: 25, y: 22, dir: 2, arkusz: "$Npc_Zolnierz_B", indeks: 0, godziny: [7, 19], bust: "none" },   // (the soldiers' bust is a grown man - none for a boy of 16)
            zenon: { id: 3008, mapa: 162, x: 34, y: 29, dir: 4, arkusz: "$Npc_Zboze", indeks: 0, godziny: [11, 13.5] }
        }
    };
    // the letters and the things carried (their words: rzeczy.*)
    const VITEMS = { list_hanka: { icon: 191 }, list_soltys: { icon: 191 }, list_marta: { icon: 191 }, list_feliks: { icon: 191 }, list_poczta: { icon: 191 } };
    Watki.scal(VITEMS, "podroznicy", "rzeczy");
    // what a resident says once, the first talk after it (their words: uwagi.<n>.lines): Ludmiła's letter left with Borgar (K71);
    // Urszula once the hero has read his mother's first letter (W10); Hanka after Zenon is shown up
    const REMARKS = [
        { id: "k71Ludmila", who: "ludmila", flag: "k71ListLudmily" },
        { id: "d43Urszula", who: "urszula", flag: "w10List1" },
        { id: "d42Hanka", who: "piekarka", flag: "zbozeZdemaskowany" }
    ];
    Watki.scal(REMARKS, "podroznicy", "uwagi");
    // D40: the view points of the sketches (TownQuests' places, shown while the step wants them; 5 of these 6)
    const SPOTS = {
        d40_pustelnia: { map: 155, id: 951, marker: "urwisko", dx: 1, x: 8, y: 7, deco: "glint" },
        d40_urwisko: { map: 157, id: 951, marker: "kruczarnia", dy: 1, x: 26, y: 13, deco: "glint" },
        d40_latarnia: { map: 159, id: 951, marker: "laterna", dx: 1, x: 23, y: 10, deco: "glint" },
        d40_garnizon: { map: 162, id: 951, marker: "wieza", dx: 1, x: 50, y: 17, deco: "glint" },
        d40_gory: { map: 13, id: 954, marker: "punkt_widokowy", dx: 1, x: 58, y: 12, deco: "glint" },
        d40_przystan: { map: 125, id: 952, marker: "nabrzeze_rog", dx: 1, x: 21, y: 10, deco: "glint" }
    };
    Watki.scal(SPOTS, "podroznicy", "miejsca");   // (name: miejsca.<key>.name)
    const D40_SPOTS = Object.keys(SPOTS);
    // I2 - the conversations through a wall (Podroznicy_Sprawy.js: Podroznicy.podsluch); pokoj: a room of the tavern's plan (a
    // number upstairs, a key of the plan: "jadalnia"); gdy: a hook; kwestie: the words ("kto: tekst", {keywords}); prog: the Czujność
    // that hears the keywords (the hero starts with 5 - D42's talk wants a point more)
    const PODSLUCH = [
        { id: "d42Narada", mapa: 1, pokoj: "jadalnia", godziny: SPRAWY.d42.narada.godziny, kwestie: "podsluch.narada", prog: 6, raz: true, gdy: "d42Narada" }
    ];
    const K72_ROZMOWY = SPRAWY.k72.adresaci.map(k => ({ kto: k, gdy: { hak: "k72Dla", args: [k] }, tresc: ["k72.do." + k, { zrob: "k72List", args: [k] }] }));

    // ------------------------------------------------------------------ the thread (Watki.js): the state, the words, the talks, F9
    const w = Watki.watek({
        id: "podroznicy", wtyczka: "Podroznicy", teksty: "podroznicy",
        // version 1 (docs/PODROZNI.md 1.9); last: null - an older save's first look (nobody arrives "backwards": the day it is loaded
        // counts as planned); a new game sets 0 (Podroznicy.js, newGame). Stage 2's fields (k71...d43, podsluch) - a save without them
        // gets the defaults (the core fills the missing keys)
        stan: { klucz: "podroznicy", wersja: 1, domyslne: () => ({
            seed: 0, last: null, noc: 0, obecni: {}, byli: {}, wizyty: {}, ksiega: {}, pula: {}, sloty: [null, null, null, null],
            renoma: RENOMA.start, renomaLog: [], utarg: 0, utargTyg: { t: 0, g: 0 }, zlotoProm: {}, poznani: {}, intrygi: {},
            widziane: { sceny: {}, historyjki: {} },
            k71: { oddane: {}, otwarty: "", lord: 0 }, k72: { wizyta: "", adresaci: [], oddane: {} },
            d39: { oklad: "", noc: 0, soltys: "" }, d40: { szkice: {}, mapa: 0 },
            d41: { droga: "", zaklad: "", wygral: "", zwrotka: "" }, d42: { slady: {}, wybor: "", sprzedal: 0 }, d43: { slady: {}, wybor: "" },
            podsluch: {} }) },
        mowa: { akapity: true },
        zadania: {
            // K71 "Listy z lądu" (Tobiasz, his first visit): four letters about the island, the butler's - delivered, steamed open at
            // Borgar's kettle (Czujność 6+: no trace) or shown to the Lord; the fifth (Ludmiła's) stays with Borgar; back to Tobiasz
            K71: { kind: "K", giver: "tobiasz", icon: 191, oferta: "k71Oferta",
                offer: { cond: { hours: [8, 22] }, vgives: { list_hanka: 1, list_soltys: 1, list_marta: 1, list_feliks: 1 } },
                kroki: [
                    { nazwa: "k71Listy", gotowe: "ile:k71.oddane>=4", zmienne: "k71Zmienne", rozmowy: [
                        { kto: "piekarka", gdy: "v:list_hanka", tresc: ["k71.hanka", { zrob: "k71List", args: ["hanka"] }] },
                        { kto: "soltys", gdy: "v:list_soltys", tresc: ["k71.soltys", { zrob: "k71List", args: ["soltys"] }] },
                        { kto: "praczka", gdy: "v:list_marta", tresc: ["k71.marta", { zrob: "k71List", args: ["marta"] }] },
                        { kto: "feliks", gdy: "v:list_feliks", tresc: [{ jesli: "stan:k71.otwarty=slad", to: ["k71.feliksSlad"], inaczej: ["k71.feliks"] },
                            { zrob: "k71List", args: ["feliks"] }] },
                        { kto: "lord", gdy: ["v:list_feliks", "!stan:k71.lord"], gotowa: false, znacznik: false, tresc: ["k71.lord", { zrob: "k71Lord" }] }
                    ] },
                    { nazwa: "k71Powrot", type: "talk", to: "tobiasz", hours: [7, 23] }
                ],
                reward: { gold: 4, xp: 40 } },
            // K72 "Poczta z lądu" (each of Tobiasz's returns, once a visit): 2-3 letters about the island, 2 G each
            K72: { kind: "K", giver: "tobiasz", icon: 191, repeat: "daily", oferta: "k72Oferta", offer: { cond: { hours: [8, 22] } },
                kroki: [{ nazwa: "k72Listy", gotowe: "k72Gotowe", zmienne: "k72Zmienne", rozmowy: K72_ROZMOWY }],
                reward: { xp: 30 } },
            // D39 "Gorączka z promu" (Konstanty): yarrow and garlic, two portions of the hero's own water, the night at the sick man's
            // side (room 11, the fire for boiling water), the sołtys's shed in the morning
            D39: { kind: "D", giver: "medyk", icon: 150, oferta: "d39Oferta", offer: { cond: { hours: [8, 21] } },
                kroki: [
                    { nazwa: "d39Ziola", type: "bring", to: "medyk", need: [[150, 3], [151, 2]], hours: [7, 23] },
                    { nazwa: "d39Woda", type: "bring", to: "medyk", water: 2, hours: [7, 23] },
                    { nazwa: "d39Noc", rozmowy: [{ kto: "medyk", gdy: { godziny: [22, 4] }, tresc: [{ rozmowa: "d39Noc" }] }] },
                    { nazwa: "d39Soltys", rozmowy: [{ kto: "soltys", gdy: ["d39PoNocy", { godziny: [6, 19] }], tresc: [{ rozmowa: "d39Soltys" }] }] }
                ],
                reward: { gold: 15, xp: 100 } },
            // D40 "Mapa dla kartografa" (Teofil, visit 1): five sketches from the view points, given in the Palarnia 15-19 (the wreck's
            // map shown - W12's clue "kartograf"); the island's map gets his sketch
            D40: { kind: "D", giver: "kartograf", icon: 190, oferta: "d40Oferta", offer: { cond: { hours: [9, 22] } },
                kroki: [
                    { nazwa: "d40Szkice", type: "custom", spots: D40_SPOTS, gotowe: "ile:d40.szkice>=" + SPRAWY.d40.szkice, zmienne: "d40Zmienne",
                        haki: { wanted: "d40Chce", spot: "d40Szkic" } },
                    { nazwa: "d40Oddaj", rozmowy: [{ kto: "kartograf", gdy: { godziny: [15, 23.5] }, tresc: [{ rozmowa: "d40Oddaj" }] }] }
                ],
                reward: { gold: 30, xp: 120 } },
            // D41 "Pieśń z lądu" (Jędrek): one stage for two - make peace (Melia 18-21, Jędrek 21-24), a contest of the guests' voices
            // with a bet, or send him off; then the verse from the mainland (a jug of mead - or he won)
            D41: { kind: "D", giver: "grajek", icon: 137, oferta: "d41Oferta", offer: { cond: { hours: [10, 23.5] } },
                kroki: [
                    { nazwa: "d41Scena", rozmowy: [{ kto: "grajek", tresc: [{ rozmowa: "d41Scena" }] }] },
                    { nazwa: "d41Melia", rozmowy: [{ kto: "melia", gdy: { godziny: [18, 21] }, tresc: ["d41.melia", { zrob: "d41Melia" }] }] },
                    { nazwa: "d41Jedrek", rozmowy: [{ kto: "grajek", gdy: { godziny: [21, 24] }, tresc: ["d41.pogodzeni", { zrob: "d41Pogodz" }] }] },
                    { nazwa: "d41Zwrotka", rozmowy: [{ kto: "grajek", tresc: [{ rozmowa: "d41Zwrotka" }] }] }
                ],
                reward: {} },
            // D42 "Zboże w suszę" (Hanka): whom Zenon sells to - two of: the talk with Kłos through the dining room's door (day 12,
            // 20:00 - I2), following him to the garrison at 11, the customs book at the harbour (5 G; stage 3: his room 20); then
            // a) the sołtys's meeting, b) sell him the hero's barley, c) four sacks for the camp, d) Kłos told
            D42: { kind: "D", giver: "piekarka", icon: 74, oferta: "d42Oferta", offer: { cond: { hours: [6, 18] } },
                kroki: [
                    { nazwa: "d42Slady", gotowe: "ile:d42.slady>=2", zmienne: "d42Zmienne", rozmowy: [
                        { kto: "celnik", gdy: "!stan:d42.slady.celnik", znacznik: false, tresc: [{ rozmowa: "d42Celnik" }] }
                    ] },
                    { nazwa: "d42Wybor", rozmowy: [{ kto: "piekarka", gdy: { godziny: [6, 19] }, tresc: [{ rozmowa: "d42Wybor" }] }] },
                    { nazwa: "d42Zebranie", rozmowy: [{ kto: "soltys", gdy: { godziny: [8, 19] }, tresc: ["d42.zebranie", { zrob: "d42Koniec", args: ["a"] }] }] },
                    { nazwa: "d42Worki", rozmowy: [{ kto: "zboze", tresc: ["d42.worki", { zrob: "d42Koniec", args: ["c"] }] }] },
                    { nazwa: "d42Klos", rozmowy: [{ kto: "kwatermistrz", gdy: { godziny: [7, 22] }, tresc: ["d42.klos", { zrob: "d42Koniec", args: ["d"] }] }] }
                ],
                reward: {} },
            // D43 "Matka szuka syna" (Urszula): two of the captain, the recruiter's book, Darin or Rafał; Antek among the recruits
            // (Map162, 7-19); a) he goes to her, b) bought out (40 G or the garrison's favour 40+), c) his own choice, d) silence
            D43: { kind: "D", giver: "urszula", icon: 191, oferta: "d43Oferta", offer: { cond: { hours: [8, 20] } },
                kroki: [
                    { nazwa: "d43Rozpytaj", gotowe: "ile:d43.slady>=2", zmienne: "d43Zmienne", rozmowy: [
                        { kto: "rotmistrz", gdy: "!stan:d43.slady.rotmistrz", tresc: ["d43.rotmistrz", { zrob: "d43Slad", args: ["rotmistrz"] }] },
                        { kto: "werbownik", gdy: "!stan:d43.slady.werbownik", tresc: ["d43.werbownik", { zrob: "d43Slad", args: ["werbownik"] }] },
                        { kto: "uchodzca", gdy: "!stan:d43.slady.prom", tresc: ["d43.darin", { zrob: "d43Slad", args: ["prom"] }] },
                        { kto: "rafal", gdy: "!stan:d43.slady.prom", tresc: ["d43.rafal", { zrob: "d43Slad", args: ["prom"] }] }
                    ] },
                    { nazwa: "d43Antek", gotowe: "stan:d43.wybor", zmienne: "d43Zmienne" },
                    { nazwa: "d43Wykup", rozmowy: [{ kto: "rotmistrz", tresc: [{ rozmowa: "d43Wykup" }] }] }
                ],
                reward: {} }
        },
        paczka: { vitems: VITEMS, remarks: REMARKS, spots: SPOTS },
        rozmowy: {
            // K71: the butler's letter over Borgar's kettle (Borgar's option)
            k71Para: ["k71.para.borgar", { jesli: { hak: "czujnosc", args: [SPRAWY.k71.czujnosc] },
                to: ["k71.para.czysto", { zrob: "k71Para", args: ["czysto"] }], inaczej: ["k71.para.slad", { zrob: "k71Para", args: ["slad"] }] }, "k71.para.tresc"],
            // D39: the night (a choice at 2:00), the sołtys's shed
            d39Noc: ["d39.noc.wstep", { wybor: [
                { etykieta: "d39.noc.zimny", tresc: ["d39.noc.zimnyTak", { zrob: "d39Oklad", args: ["zimny"] }] },
                { etykieta: "d39.noc.koc", tresc: ["d39.noc.kocTak", { zrob: "d39Oklad", args: ["koc"] }] }
            ], anuluj: -1 }],
            d39Soltys: ["d39.soltys.zaraza", { wybor: [
                { etykieta: "d39.soltys.za", tresc: [{ jesli: { lub: [{ hak: "opinia", args: [SPRAWY.d39.opinia] }, "stan:d39.oklad=zimny"] },
                    to: ["d39.soltys.zaTak", { zrob: "d39Soltys", args: ["za"] }], inaczej: ["d39.soltys.zaNie", { zrob: "d39Soltys", args: ["szopa"] }] }] },
                { etykieta: "d39.soltys.szopa", tresc: ["d39.soltys.szopaTak", { zrob: "d39Soltys", args: ["szopa"] }] }
            ], anuluj: -1 }],
            // D40: the sketches given (the wreck's map, when he has it), the walls under the tavern
            d40Oddaj: ["d40.oddaj", { jesli: "maMapeWraku", to: [{ wybor: [
                { etykieta: "d40.mapa.pokaz", tresc: ["d40.mapa.teofil", { zrob: "d40Mapa" }] },
                { etykieta: "d40.mapa.nie", tresc: [] }], anuluj: 1 }] }, "d40.mury", { zrob: "d40Koniec" }],
            // D41: the stage, the contest (the winner is known before the bet is said: Melia's trust), the verse
            d41Scena: ["d41.scena.wstep", { wybor: [
                { etykieta: "d41.scena.pogodz", tresc: ["d41.scena.pogodzTak", { zrob: "d41Droga", args: ["pogodz"] }] },
                { etykieta: "d41.scena.zawody", gdy: { hak: "zloto", args: [SPRAWY.d41.zaklad] }, tresc: [{ rozmowa: "d41Zawody" }] },
                { etykieta: "d41.scena.odpraw", tresc: ["d41.scena.odprawTak", { zrob: "d41Odpraw" }] },
                { etykieta: "d41.scena.pozniej", tresc: [] }
            ], anuluj: "ostatnia" }],
            d41Zawody: ["d41.zawody.wstep", { wybor: [
                { etykieta: "d41.zawody.melia", tresc: [{ jesli: "d41MeliaWygra",
                    to: ["d41.zawody.wygrywaMelia", "d41.zawody.zakladTak", { zrob: "d41Zawody", args: ["melia", "melia"] }],
                    inaczej: ["d41.zawody.wygrywaJedrek", "d41.zawody.zakladNie", { zrob: "d41Zawody", args: ["melia", "jedrek"] }] }] },
                { etykieta: "d41.zawody.jedrek", tresc: [{ jesli: "d41MeliaWygra",
                    to: ["d41.zawody.wygrywaMelia", "d41.zawody.zakladNie", { zrob: "d41Zawody", args: ["jedrek", "melia"] }],
                    inaczej: ["d41.zawody.wygrywaJedrek", "d41.zawody.zakladTak", { zrob: "d41Zawody", args: ["jedrek", "jedrek"] }] }] }
            ], anuluj: -1 }],
            d41Zwrotka: [{ jesli: "stan:d41.wygral=jedrek", to: [{ rozmowa: "d41Spiew", ustaw: { miod: 0 } }],
                inaczej: [{ jesli: "maMiod", to: ["d41.zwrotka.miod", { rozmowa: "d41Spiew", ustaw: { miod: 1 } }], inaczej: ["d41.zwrotka.bezMiodu"] }] }],
            d41Spiew: [{ jesli: "d41BrakZwrotki", to: ["d41.spiew.zwrotka", { hak: "d41Wers" }, "d41.spiew.zLadu"], inaczej: ["d41.spiew.wojskowa"] },
                { zrob: "d41Zwrotka", args: [{ ctx: "miod" }] }],
            // D42: the customs book, Hanka's choice
            d42Celnik: ["d42.celnik.pyta", { wybor: [
                { etykieta: "d42.celnik.plac", gdy: { hak: "zloto", args: [SPRAWY.d42.celnik] }, tresc: ["d42.celnik.ksiega", { zrob: "d42Celnik" }] },
                { etykieta: "d42.celnik.nie", tresc: [] }
            ], anuluj: 1 }],
            d42Wybor: ["d42.wybor.hanka", { wybor: [
                { etykieta: "d42.wybor.a", tresc: ["d42.wybor.aTak", { zrob: "d42Wybor", args: ["a"] }] },
                { etykieta: "d42.wybor.b", tresc: ["d42.wybor.bTak", { zrob: "d42Wybor", args: ["b"] }] },
                { etykieta: "d42.wybor.c", gdy: "d42ZnaUmowe", tresc: ["d42.wybor.cTak", { zrob: "d42Wybor", args: ["c"] }] },
                { etykieta: "d42.wybor.d", tresc: ["d42.wybor.dTak", { zrob: "d42Wybor", args: ["d"] }] },
                { etykieta: "d42.wybor.pozniej", tresc: [] }
            ], anuluj: "ostatnia" }],
            // D43: Antek (his event at the garrison), the captain's price
            d43Antek: ["d43.antek.wstep", { wybor: [
                { etykieta: "d43.antek.a", gdy: { lub: [{ hak: "hart", args: [SPRAWY.d43.hart] }, "flaga:w10List1"] },
                    tresc: [{ jesli: "flaga:w10List1", to: ["d43.antek.aList"], inaczej: ["d43.antek.aHart"] }, "d43.antek.aTak", { zrob: "d43Koniec", args: ["a"] }] },
                { etykieta: "d43.antek.b", tresc: ["d43.antek.bTak", { zrob: "d43Wybor", args: ["b"] }] },
                { etykieta: "d43.antek.c", tresc: ["d43.antek.cTak", { zrob: "d43Koniec", args: ["c"] }] },
                { etykieta: "d43.antek.d", tresc: ["d43.antek.dTak", { zrob: "d43Koniec", args: ["d"] }] },
                { etykieta: "d43.antek.pozniej", tresc: [] }
            ], anuluj: "ostatnia" }],
            d43Wykup: ["d43.wykup.pyta", { wybor: [
                { etykieta: "d43.wykup.zloto", gdy: { hak: "zloto", args: [SPRAWY.d43.wykup] }, tresc: ["d43.wykup.tak", { zrob: "d43Wykup", args: ["zloto"] }] },
                { etykieta: "d43.wykup.przysluga", gdy: { hak: "przychylnosc", args: [SPRAWY.d43.przychylnosc] }, tresc: ["d43.wykup.tak", { zrob: "d43Wykup", args: ["przysluga"] }] },
                { etykieta: "d43.wykup.nie", tresc: [] }
            ], anuluj: "ostatnia" }]
        },
        akcje: {
            k71List: [{ gdy: "!krok:k71Listy", koniec: true }, { hak: "k71List", args: [{ arg: 0 }] },
                { gdy: ["ctx:args.0=feliks", "stan:k71.otwarty=slad"], zrob: [{ flaga: "w7FeliksCzujny" }] }, { sprawdz: true }],
            k71Lord: [{ gdy: "stan:k71.lord", koniec: true }, { stan: { "k71.lord": "dzis" } }, { hak: "w7Papier" }, { notatka: "k71.notatka.lord" }],
            k71Para: [{ gdy: "stan:k71.otwarty", koniec: true }, { stan: { "k71.otwarty": { arg: 0 } } }, { hak: "w7Papier" }, { notatka: "k71.notatka.para" }],
            k72List: [{ hak: "k72List", args: [{ arg: 0 }] }, { sprawdz: true }],
            d39Oklad: [{ gdy: "!krok:d39Noc", koniec: true }, { stan: { "d39.oklad": { arg: 0 }, "d39.noc": { hak: "teraz" } } }, { krok: "d39Noc", nagroda: { xp: 30 } }],
            d39Soltys: [{ gdy: "!krok:d39Soltys", koniec: true }, { stan: { "d39.soltys": { arg: 0 } } }, { flaga: "d39Przepis" }, { hak: "przepisy" },
                { gdy: "ctx:args.0=szopa", zrob: [{ flaga: "d39Szopa" }, { notatka: "d39.notatka.szopa" }, { krok: "d39Soltys" }, { koniec: true }] },
                { notatka: "d39.notatka.za" }, { krok: "d39Soltys", nagroda: { opinion: 3 } }],
            d40Mapa: [{ gdy: "stan:d40.mapa", koniec: true }, { stan: { "d40.mapa": "dzis" } }, { hak: "wrakPoszlaka" }],
            d40Koniec: [{ gdy: "!krok:d40Oddaj", koniec: true }, { flaga: "szkicKartografa" }, { hak: "slawa", args: [SPRAWY.d40.slawa] }, { notatka: "d40.notatka" },
                { krok: "d40Oddaj" }],
            d41Droga: [{ gdy: "!krok:d41Scena", koniec: true }, { stan: { "d41.droga": { arg: 0 } } }, { krok: "d41Scena", do: "d41Melia" }],
            d41Zawody: [{ gdy: "!krok:d41Scena", koniec: true }, { stan: { "d41.droga": "zawody", "d41.zaklad": { arg: 0 }, "d41.wygral": { arg: 1 } } },
                { hak: "d41Zawody" }, { krok: "d41Scena", do: "d41Zwrotka", nagroda: { xp: 30 } }],
            d41Odpraw: [{ gdy: "!krok:d41Scena", koniec: true }, { stan: { "d41.droga": "odpraw" } }, { hak: "renomaZmien", args: [SPRAWY.d41.renoma.odpraw, "D41"] },
                { notatka: "d41.notatka.odpraw" }, { hak: "zakoncz", args: ["D41", { xp: 20 }] }],
            d41Melia: [{ gdy: "!krok:d41Melia", koniec: true }, { krok: "d41Melia" }],
            d41Pogodz: [{ gdy: "!krok:d41Jedrek", koniec: true }, { hak: "zaufanie", args: ["melia", SPRAWY.d41.melia.pogodz] },
                { hak: "renomaZmien", args: [SPRAWY.d41.renoma.pogodz, "D41"] }, { krok: "d41Jedrek", nagroda: { xp: 30 } }],
            d41Zwrotka: [{ gdy: "!krok:d41Zwrotka", koniec: true }, { hak: "d41Zwrotka", args: [{ arg: 0 }] }, { krok: "d41Zwrotka", nagroda: { xp: 100 } }],
            d42Celnik: [{ gdy: "stan:d42.slady.celnik", koniec: true }, { hak: "placi", args: [SPRAWY.d42.celnik] }, { hak: "d42Slad", args: ["celnik"] }],
            d42Wybor: [{ gdy: "!krok:d42Wybor", koniec: true }, { stan: { "d42.wybor": { arg: 0 } } },
                { gdy: "ctx:args.0=a", zrob: [{ krok: "d42Wybor", do: "d42Zebranie" }, { koniec: true }] },
                { gdy: "ctx:args.0=b", zrob: [{ hak: "d42Koniec", args: ["b"] }, { koniec: true }] },
                { gdy: "ctx:args.0=c", zrob: [{ krok: "d42Wybor", do: "d42Worki" }, { koniec: true }] },
                { krok: "d42Wybor", do: "d42Klos" }],
            d42Koniec: [{ hak: "d42Koniec", args: [{ arg: 0 }] }],
            d43Slad: [{ gdy: { nie: "krok:d43Rozpytaj" }, koniec: true }, { hak: "d43Slad", args: [{ arg: 0 }] }, { sprawdz: true }],
            d43Wybor: [{ gdy: "!krok:d43Antek", koniec: true }, { stan: { "d43.wybor": { arg: 0 } } }, { krok: "d43Antek", do: "d43Wykup" }],
            d43Wykup: [{ gdy: "!krok:d43Wykup", koniec: true }, { gdy: "ctx:args.0=zloto", zrob: [{ hak: "placi", args: [SPRAWY.d43.wykup] }] }, { hak: "d43Koniec", args: ["b"] }],
            d43Koniec: [{ hak: "d43Koniec", args: [{ arg: 0 }] }]
        },
        // F9 ("Wyspa i fabuła"): the rows of the section come from the engine (Podroznicy.f9)
        f9: { naglowek: "f9.naglowek",
            wiersze: () => (P() ? P().f9.wiersze() : []),
            wybierz: (row, delta) => (P() ? P().f9.wybierz(row, delta) : false),
            ok: row => (P() ? P().f9.ok(row) : { say: "Brak Podroznicy.js", bad: true }) }
    });

    // ------------------------------------------------------------------ the residents (TownLife, window.TownLifeExtra)
    const PUSTE = Object.freeze({});
    const bledy = {};
    const PLAN_ZAPAS = [[0, "inside", "podr_droga"]];
    // the day's plan of a profile (docs/PODROZNI.md 1.4): the night in the room, the breakfast, the morning, the dinner in the hall,
    // the afternoon, the evening; the engine lays the arrival / the departure / the pier over it
    function baza(pr) {
        const out = [];
        if (pr.noc) out.push([0, "inside", "podr_sala"], [1, "inside", "podr_pokoj"]); else out.push([0, "inside", "podr_pokoj"]);
        out.push(...(pr.sniadanie || [[7, "inside", "podr_sala"]]), ...(pr.rano || [[9, "wander", "plac_9"]]), [12, "inside", "podr_sala"],
            ...(pr.popoludnie || [[14, "inside", "podr_pokoj"]]), ...(pr.wieczor || [[18, "inside", "podr_sala"]]));
        if (!pr.noc) out.push([23, "inside", "podr_pokoj"]);
        return out.map((e, i) => [e, i]).sort((a, b) => a[0][0] - b[0][0] || a[1] - b[1]).map(x => x[0]);
    }
    // without the engine (the tools: tools/audyt, the map checks) a cast's resident has its ordinary day and its own room for every
    // place indoors; the pool's places - away
    function zapas(key) {
        const c = OBSADA.find(x => x.key === key) || OBSADA.find(x => x.grupa && x.grupa.includes(key));
        if (!c) return { plan: PLAN_ZAPAS, indoor: PUSTE };
        const i = c.grupa ? c.grupa.indexOf(key) : -1, room = i >= 0 ? c.pokoje[i] : c.pokoj;
        const pokoj = POKOJE[room] ? "pokoj_" + room + (i % 2 === 1 ? "_2" : "") : "";
        return { plan: baza(PLANY[c.profil] || PLANY.zwykly),
            indoor: pokoj ? Object.freeze({ podr_sala: pokoj, podr_pokoj: pokoj, podr_medyk: pokoj, podr_grajek: pokoj }) : PUSTE };
    }
    function mieszkaniec(key, id, arkusz) {
        const r = { key, id, speed: 3, away: W_DRODZE };
        const z = zapas(key);
        // (a getter never throws: TownLife asks them every frame - a mistake is told once and the default given)
        const get = (name, fn, dflt) => Object.defineProperty(r, name, { get: () => {
            const e = P();
            if (!e) return typeof dflt === "function" ? dflt() : dflt;
            try { return fn(e); } catch (er) { if (!bledy[name]) { bledy[name] = 1; console.error("[Podroznicy] " + key + "." + name, er); } return typeof dflt === "function" ? dflt() : dflt; }
        }, enumerable: true, configurable: true });
        const slowo = f => () => { const v = w.tekstMoze("obsada." + key + "." + f); return Array.isArray(v) ? v[0] || "" : v || ""; };
        get("name", e => e.imie(key), slowo("imie"));
        get("title", e => e.tytul(key), slowo("tytul"));
        get("sheet", e => e.arkusz(key), arkusz);
        get("map", e => e.mapa(key), 8);            // (8 while on the island - the town is its home; -1 else: no event anywhere)
        get("plan", e => e.plan(key), z.plan);
        get("indoor", e => e.wnetrze(key), z.indoor);
        get("barks", e => e.okrzyki(key), PUSTE);
        get("talk", e => e.mowa(key), PUSTE);
        r.when = () => { const e = P(); try { return !!(e && e.jest(key)); } catch (er) { return false; } };
        return r;
    }
    const RESIDENTS = [];
    for (const c of OBSADA) if (c.id) RESIDENTS.push(mieszkaniec(c.key, c.id, c.arkusz));
    for (const [key, m] of Object.entries(CZLONKOWIE)) RESIDENTS.push(mieszkaniec(key, m.id, m.arkusz));
    for (const s of SLOTY_PULI) RESIDENTS.push(mieszkaniec(s.key, s.id, CIALA.m[0]));
    (window.TownLifeExtra = window.TownLifeExtra || []).push(...RESIDENTS);

    const TLD = window.TownLifeData;
    if (TLD) {
        if (TLD.SPOTS) for (const [k, v] of Object.entries(SPOTS_MIASTA)) if (!TLD.SPOTS[k]) TLD.SPOTS[k] = v;
        TLD.SPOTS_BY_MAP = TLD.SPOTS_BY_MAP || {};
        const up = {};
        for (const [n, p] of Object.entries(POKOJE)) { up["pokoj_" + n] = p.miejsce; up["pokoj_" + n + "_2"] = [p.miejsce[0] + (p.miejsce[2] === 6 ? -1 : 1), p.miejsce[1], p.miejsce[2]]; }
        TLD.SPOTS_BY_MAP[25] = Object.assign({}, up, TLD.SPOTS_BY_MAP[25] || {});
    }
    // the actors of the harbour's scenes and props (3002-3017): put in by the engine - this one stands above TownLife on the list, so
    // its build comes first on every map: the engine notes the hall's places (Map001's "Miejsce:" events) before TownLife's residents ask
    T.inject("*", { ids: [IDS.aktorzy[0], IDS.rekwizyty[1]], owner: "Podroznicy", build: (data, mapId) => { const e = P(); return e ? e.wstaw(data, mapId) : []; } });

    // the busts of the stand-in sheets (the same rule recoloured them - tools/podroznicy/zastepcze.py): one bust a sheet
    const SB = window.SpeechBubbles;
    if (SB && SB.BUSTS) {
        const sheets = OBSADA.filter(c => c.arkusz).map(c => c.arkusz).concat(Object.values(CZLONKOWIE).map(m => m.arkusz), [].concat(...Object.values(CIALA)));
        for (const s of sheets) SB.BUSTS[s + ":0"] = s.replace(/^\$Npc_/, "") + "_Bust";
    }

    window.PodroznicyData = {
        IDS, LIMIT, NOWYCH_NA_PROM, PULA_NA_PROM, ZLOTO_PRZYSLUG, GODZINY, RENOMA, CENY, POKOJE, POKOJE_BOHATERA, POKOJ_ERYKA, POKOJ_RAFALA,
        MIEJSCA_W_SALI, OBSADA, CZLONKOWIE, CIALA, PULA, SLOTY_PULI, POBYT_PULI, PLANY, SPOTS_MIASTA, W_DRODZE, SCENA, ETAPY_WOJNY,
        RESIDENTS, TX: w.tx, watek: w, baza, SPRAWY, VITEMS, REMARKS, SPOTS, PODSLUCH, Q: w.Q
    };
})();
