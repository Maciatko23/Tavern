//=============================================================================
// Wesele_Data.js
//=============================================================================
// The thread W18 "Wesele w Złotym Kuflu" (docs/zadania_nowe/wesele.md, 2026-11-11) - the DATA; the engine: Wesele.js, the two mini-games
// (the table plan, the first dance): Wesele_Gry.js, the words: js/teksty/wesele.txt.
// Wojciech the carter (TownLife "woznica") marries Dorota Igła the seamstress ("szwaczka") in the tavern's hall (Map001); Borgar
// cannot say no and the whole weight falls on the hero: the food, Melia's songs, the hall's decorations, the table plan, brother
// Kleofas. The day of the wedding (22) ends with the groom gone after the toast, a brawl in the hall and a night's search through
// the whole tavern (Map001, 25, 26). Days 19-22, the morning of 23 is the epilogue. No new map: everything is Tawerna.inject (ids
// 3200-3239 i 3280-3299, owner "Wesele") on the tavern's three maps; the groom's and the bride's wedding clothes are two new sheets.
// Stands under Dezerter_Data and above TownLife and TownQuests_Data (the quest W18 goes into window.TownQuestsPacks).
// The quest has six steps (the document's ten chapters, the three parallel preparations being one): 1 the commission (Borgar's
// topic), 2 the preparations (food, songs, decorations, the guests, the ceremony - in any order), 3 the wedding and the feast, 4 the
// groom's gone and the brawl, 5 the night's search, 6 the morning after.

/*:
 * @target MZ
 * @plugindesc [W18] Dane wątku „Wesele w Złotym Kuflu”: Wojciech i Dorota, przygotowania, plan stołów, ślub, bójka, noc poszukiwań, poranek. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Dezerter_Data
 *
 * @help
 * ============================================================================
 * Wesele_Data.js - dane wątku W18 „Wesele w Złotym Kuflu”
 * ============================================================================
 * Same dane: silnik to Wesele.js (+ Wesele_Gry.js), teksty js/teksty/wesele.txt.
 * Musi stać nad TownLife.js i TownQuests_Data.js. Numery zdarzeń 3200-3239 i 3280-3299
 * (właściciel "Wesele"): mapy 1, 25 i 26 (karczma i jej piętra).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Wesele_Data.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");

    // ------------------------------------------------------------------ the calendar, the maps, the numbers
    const DNI = { od: 19, ceremonia: 22, epilog: 23, ostatni: 23, nieWziete: 20 };
    const GODZ = { zlecenie: [9, 18], ceremonia: 15, uczta: [17, 18.5, 20], toast: 19, taniec: 20.5, znik: 22, bojka: 22.25, bojkaWczesnie: 22, noc: 23, nocDo: 4, poranek: [6, 12], kawalerski: [20, 23] };
    const MAP = { karczma: 1, pietro: 25, apartamenty: 26, miasto: 8 };
    const IDS = [3200, 3299], OWNER = "Wesele";
    const WARUNKI = { opinia: 20, renoma: 40, melia: 15 };
    // the groom, the bride, brother Kleofas: the wedding sheets (the carter's and the seamstress's in Sunday clothes) and the hermit's
    const POSTAC = { pan: "$Npc_PanMlody", panna: "$Npc_PannaMloda", kleofas: "$Npc_Pustelnik", kot: "$Animal_Cat" };
    // the food: the dishes of the kitchen (items 130-137; Hanka's tart separately), each worth its quality in the feast's mood
    const DANIA = { 130: 8, 131: 7, 132: 7, 133: 3, 134: 3, 135: 4, 136: 8, 137: 4 };   // (the soups and the stew are the feast; the porridge and mushrooms are poor)
    const TORT = { miod: 76, jagody: 102, maka: 82, ilosc: [2, 3], dni: 1 };
    const ZIOLA = 104, ZIOLA_N = 6, PLACKI = 10;
    const POCHODNIE = 2, POCHODNIA = 59;
    const PIESNI = ["kufel", "wianek", "mlyn", "kowal", "prom"];   // (the last is "sad" - Melia turns it down)
    const PIESN_SMUTNA = "prom";
    const STRUNY = 8;
    // the 8 + 10 + 12 places of the hall (Map001): 6 wreaths + 4 sashes, 12 candles, the tables (x of the table, the stools' x, rows y)
    const SALA = { stoly: [{ x: [3, 5] }, { x: [7, 9] }, { x: [19, 21] }, { x: [23, 25] }], wiersze: [33, 34, 35], drzwi: [14, 54], wejscie: [14, 51] };
    const DEKOR = [
        // [x, y, kind (wianek | szarfa), px offset y] - the wall above the stools' rows, the pillars and the bar's ends
        [4, 26, "wianek"], [9, 26, "wianek"], [19, 26, "wianek"], [24, 26, "wianek"], [12, 33, "wianek"], [16, 33, "wianek"],
        [4, 32, "szarfa"], [8, 32, "szarfa"], [20, 32, "szarfa"], [24, 32, "szarfa"]
    ];
    const SWIECE = [[4, 33], [4, 35], [8, 33], [8, 35], [20, 33], [20, 35], [24, 33], [24, 35], [11, 30], [17, 30]];
    const LADA = { x: 12, y: 8 }, TORT_MIEJSCE = { x: 6, y: 8 }, TABLICA = { x: 18, y: 49 };
    // the cards (docs 3A): the 14 named guests and the 4 relatives, their sheets (the seated sheets: Przytulna_Siedzi_<Key>)
    const KARTY = [
        { k: "tadek", imie: "Tadek Młot", cialo: "Kowal" }, { k: "kuba", imie: "Kuba Woziwoda", cialo: "Woziwoda" }, { k: "bartek", imie: "Bartek Kmieć", cialo: "Bartek" },
        { k: "soltys", imie: "Bronisław, sołtys", cialo: "Soltys" }, { k: "hanka", imie: "Hanka Mączna", cialo: "Pula_Z" }, { k: "agata", imie: "Agata, przekupka", cialo: "Pula_K" },
        { k: "halina", imie: "Halina, wdowa", cialo: "Pula_K2" }, { k: "leon", imie: "Leon Dłuto", cialo: "Pula_M2" }, { k: "mietek", imie: "Mietek Kwaśniak", cialo: "Pula_M" },
        { k: "wit", imie: "Kapral Wit", cialo: "Pula_S" }, { k: "ambrozy", imie: "Ambroży", cialo: "Pula_S2" }, { k: "ignac", imie: "Ignac", cialo: "Pula_M3" },
        { k: "lucjan", imie: "Lucjan Kość", cialo: "Pula_Z2" }, { k: "stefa", imie: "Ciotka Stefa", cialo: "Pula_K3" },
        { k: "rp1", imie: "Ciotka Wiesia (rodzina panny)", cialo: "Pula_K" }, { k: "rp2", imie: "Kuzynka Basia (rodzina panny)", cialo: "Pula_Z" },
        { k: "rm1", imie: "Wuj Stasiek (rodzina pana)", cialo: "Woziwoda" }, { k: "rm2", imie: "Wuj Marcin (rodzina pana)", cialo: "Pula_M2" }
    ];
    // the 7 feuds (a spark each when at one table) and the one love (next to each other: +3), and who tells of them (the gossips)
    const WASNIE = [["hanka", "agata"], ["tadek", "kuba"], ["wit", "mietek"], ["ignac", "bartek"], ["halina", "stefa"], ["rp1", "rm1"], ["rp2", "rm2"]];
    const MILOSC = ["leon", "halina"];
    const PLOTKARZE = { opiekunka: [4, 5, 6], piekarka: [0], kowal: [1], kapral: [2], bartek: [3], szwaczka: [5, 6] };   // (the feuds each tells of, by index)
    const PLOTKI_POTRZEBA = 4;
    const NASTROJ = { baza: 38, danie: 1, tort: 9, piesn: 4, wianek: 1.5, szarfa: 1, swieca: 0.5, plan0: 12, planIskra: -3, milosc: 3, toast: [-6, 5, 8], taniec: 8, podanePrzed: -4 };
    const BOJKA = { male: [1, 3], duza: 4, statysci: [3, 8], czas: 90, samaPo: 120, szkodaStala: 20, szkodaIskra: 8 };
    const DZWIEK = { stol: ["Blow3", 70, 70], tlucze: ["Break1", 70, 100], drzwi: ["Door1", 70, 90], dzwon: ["Bell3", 70, 100] };
    // the search (docs 3C): the seven places - [map, x, y, a trace]
    const MIEJSCA = [
        { k: "beczka", map: MAP.karczma, id: 3231, x: 11, y: 27 }, { k: "kuchnia", map: MAP.karczma, id: 3204, x: 9, y: 12 }, { k: "gry", map: MAP.karczma, id: 3205, x: 54, y: 33 },
        { k: "palarnia", map: MAP.karczma, id: 3206, x: 31, y: 45 }, { k: "drzwi", map: MAP.pietro, id: 3232, x: 10, y: 33 }, { k: "platki", map: MAP.pietro, id: 3233, x: 20, y: 51 },
        { k: "taras", map: MAP.apartamenty, id: 3200, x: 46, y: 52 }
    ];
    const NAGRODA = { borgar: { gold: 20, xp: 40 }, para: { gold: 30, bonus: 15 }, napiwki: { prog: 70, max: 35 }, wykup: 30, renoma: 8, opinia: 4, melia: 10, grum: 5, ozzy: 3 };
    const KONCOWKI = { A: { renoma: 8, opinia: 4 }, B: { renoma: 6, opinia: 3 }, C: { renoma: 3, opinia: 1 }, D: { renoma: 0, opinia: 0 } };

    // ------------------------------------------------------------------ the talks (the trees; the words: wesele.txt)
    // (a song not taken yet: the hook piesnWybrana(k))
    const PW = k => ({ nie: { hak: "piesnWybrana", args: [k] } });
    const w = Watki.watek({
        id: "wesele", wtyczka: "Wesele", teksty: "wesele",
        // version 1 - see Wesele.js (stan()): the commission (z: 0 not yet | 1 taken | -1 not taken: the modest wedding), the dishes and the tart,
        // Melia's songs, the wreaths, sashes, the candles, Kleofas, the gossips, the plan, the bachelor's night, the ring, the mood, the
        // scenes seen, the brawl, the search, the ending
        stan: { klucz: "wesele", wersja: 1, domyslne: () => ({
            z: 0, zDzien: 0, pochodnie: 0, dania: [], tort: 0, tortDzien: 0, mak: 0, muzyka: 0, piesni: {}, struny: 0, wianki: 0, szarfy: 0, wiszace: [], swiece: [],
            kleo: 0, plotki: [], plan: {}, planOk: 0, iskry: -1, milosc: 0, kawalerski: 0, pierscien: "ma", nastroj: 0, nastrojCzesci: {}, podane: [], przemowa: 0,
            taniec: -1, scen: {}, bojka: { rozmiar: 0, sposob: "", szkody: 0, t0: 0, koniec: 0 }, szuka: { t0: 0, odw: [], znal: 0, wie: 0, koniec: 0 },
            koniec: "", epilog: 0, nagroda: 0, melia: 0, cichy: 0, grumOk: 0 }) },
        mowa: { akapity: true, kto: key => w.hak("mowca", null, key) },
        mysli: { klatki: 220, odstep: 230, czekaj: true },
        zadania: {
            W18: { kind: "W", giver: null, icon: 0,
                start: ["mozeZlecenie"],
                kroki: [
                    // 1 "Zlecenie": Borgar's topic at the bar (19-20, 9-18)
                    { nazwa: "w18Zlecenie", ch: 1, gotowe: "stan:z=1", zmienne: "w18Zm",
                        temat: { kto: "borgar", etykieta: "temat.borgar", gdy: "mozeZlecenie", tresc: [{ rozmowa: "zlecenie" }] } },
                    // 2 "Przygotowania": the five points of Borgar's list in any order; the day 22, 15:00 is the ceremony
                    { nazwa: "w18Przygot", ch: 2, gotowe: "poPrzygotowaniach", zmienne: "w18Zm",
                        temat: { kto: ["melia", "grum"], etykieta: "temat.regular", gdy: "regularGdy", tresc: [{ rozmowa: "regular" }] },
                        rozmowy: [
                            { kto: "piekarka", gdy: "hankaTort", tresc: [{ rozmowa: "hanka" }] },
                            { kto: "wdowa", gdy: "halinaWianki", tresc: [{ rozmowa: "halina" }] },
                            { kto: "szwaczka", gdy: "dorotaSzarfy", tresc: [{ rozmowa: "dorota" }] },
                            { kto: "pustelnik", gdy: "kleofasProsba", tresc: [{ rozmowa: "kleofas" }] },
                            { kto: "soltys", gdy: "soltysProsba", tresc: [{ rozmowa: "soltys" }] },
                            { kto: "opiekunka", gdy: "plotkaStefa", tresc: [{ rozmowa: "plotka", ustaw: { kto: "opiekunka" } }] },
                            { kto: "kowal", gdy: "plotkaTadek", tresc: [{ rozmowa: "plotka", ustaw: { kto: "kowal" } }] },
                            { kto: "kapral", gdy: "plotkaWit", tresc: [{ rozmowa: "plotka", ustaw: { kto: "kapral" } }] },
                            { kto: "bartek", gdy: "plotkaBartek", tresc: [{ rozmowa: "plotka", ustaw: { kto: "bartek" } }] }
                        ] },
                    // 3 "Ślub i uczta": the day 22 from 15:00 - the scenes and the courses (Wesele.js)
                    { nazwa: "w18Slub", ch: 3, gotowe: "stan:scen.uczta=1", zmienne: "w18Zm" },
                    // 4 "Zniknięcie i bójka"
                    { nazwa: "w18Bojka", ch: 4, gotowe: "stan:bojka.koniec>0", zmienne: "w18Zm" },
                    // 5 "Noc poszukiwań"
                    { nazwa: "w18Noc", ch: 5, gotowe: "stan:szuka.koniec>0", zmienne: "w18Zm" },
                    // 6 "Poranek"
                    { nazwa: "w18Poranek", ch: 6, gotowe: "stan:epilog>0", zmienne: "w18Zm" }
                ],
                fail: {} }
        },
        paczka: {},
        rozmowy: {
            // the commission (Borgar, at the bar)
            zlecenie: ["borgar.prosba", { zmienne: { dni: 3 }, wybor: [
                { etykieta: "borgar.opcja.tak", tresc: ["borgar.tak", { zrob: "przyjmij" }] },
                { etykieta: "borgar.opcja.co", tresc: ["borgar.co", { wybor: [
                    { etykieta: "borgar.opcja.tak", tresc: ["borgar.tak", { zrob: "przyjmij" }] },
                    { etykieta: "borgar.opcja.nie", tresc: ["borgar.nie", { zrob: "odmow" }] }], anuluj: "ostatnia" }] },
                { etykieta: "borgar.opcja.nie", tresc: ["borgar.nie", { zrob: "odmow" }] }
            ], anuluj: "ostatnia" }],
            // Melia (the songs) or Grum (the bachelor's night), by whom the hero speaks to
            regular: [{ jesli: "ctx:key=grum", to: [{ rozmowa: "kawalerski" }], inaczej: [{ rozmowa: "melia" }] }],
            // Melia: the songs - the toast, the dance, the lullaby (three choices; the sad song is turned down)
            melia: [{ jesli: "meliaObrazona", to: ["melia.obrazona"], inaczej: [{ jesli: "piesniGotowe", to: ["melia.gotowe"], inaczej: [
                { jesli: { nie: "struny" }, to: [{ rozmowa: "struny" }], inaczej: ["melia.intro", { rozmowa: "piesn1" }] }] }] }],
            piesn1: ["melia.toast", { wybor: [
                { etykieta: "piesn.kufel", tresc: [{ zrob: "piesn", args: ["toast", "kufel"] }, { rozmowa: "piesn2" }] },
                { etykieta: "piesn.wianek", tresc: [{ zrob: "piesn", args: ["toast", "wianek"] }, { rozmowa: "piesn2" }] },
                { etykieta: "piesn.mlyn", tresc: [{ zrob: "piesn", args: ["toast", "mlyn"] }, { rozmowa: "piesn2" }] },
                { etykieta: "piesn.kowal", tresc: [{ zrob: "piesn", args: ["toast", "kowal"] }, { rozmowa: "piesn2" }] },
                { etykieta: "piesn.prom", tresc: ["melia.smutna", { skrypt: "Wesele.ponow(this, 'piesn1')" }] },
                { etykieta: "melia.opcja.pozniej", tresc: [] }], anuluj: "ostatnia" }],
            piesn2: ["melia.taniec", { wybor: [
                { gdy: PW("kufel"), etykieta: "piesn.kufel", tresc: [{ zrob: "piesn", args: ["taniec", "kufel"] }, { rozmowa: "piesn3" }] },
                { gdy: PW("wianek"), etykieta: "piesn.wianek", tresc: [{ zrob: "piesn", args: ["taniec", "wianek"] }, { rozmowa: "piesn3" }] },
                { gdy: PW("mlyn"), etykieta: "piesn.mlyn", tresc: [{ zrob: "piesn", args: ["taniec", "mlyn"] }, { rozmowa: "piesn3" }] },
                { gdy: PW("kowal"), etykieta: "piesn.kowal", tresc: [{ zrob: "piesn", args: ["taniec", "kowal"] }, { rozmowa: "piesn3" }] },
                { etykieta: "piesn.prom", tresc: ["melia.smutna", { skrypt: "Wesele.ponow(this, 'piesn2')" }] },
                { etykieta: "melia.opcja.pozniej", tresc: [] }], anuluj: "ostatnia" }],
            piesn3: ["melia.kolysanka", { wybor: [
                { gdy: PW("kufel"), etykieta: "piesn.kufel", tresc: [{ zrob: "piesn", args: ["kolysanka", "kufel"] }, { zrob: "proba" }] },
                { gdy: PW("wianek"), etykieta: "piesn.wianek", tresc: [{ zrob: "piesn", args: ["kolysanka", "wianek"] }, { zrob: "proba" }] },
                { gdy: PW("mlyn"), etykieta: "piesn.mlyn", tresc: [{ zrob: "piesn", args: ["kolysanka", "mlyn"] }, { zrob: "proba" }] },
                { gdy: PW("kowal"), etykieta: "piesn.kowal", tresc: [{ zrob: "piesn", args: ["kolysanka", "kowal"] }, { zrob: "proba" }] },
                { etykieta: "piesn.prom", tresc: ["melia.smutna", { skrypt: "Wesele.ponow(this, 'piesn3')" }] },
                { etykieta: "melia.opcja.pozniej", tresc: [] }], anuluj: "ostatnia" }],
            // the strings: if K22 is not done, Melia's lute needs them (a price)
            struny: ["melia.struny", "melia.strunyPyta", { zmienne: { cena: STRUNY }, wybor: [
                { etykieta: "melia.opcja.kup", gdy: { hak: "stac", args: ["struny"] }, tresc: [{ zrob: "kupStruny" }, "melia.strunyDzieki"] },
                { etykieta: "melia.opcja.pozniej", tresc: [] }], anuluj: "ostatnia" }],
            // Hanka's tart: the order (2 honey + 3 blueberries, the flour is hers) and the pickup
            hanka: [{ jesli: "tortGotowy", to: ["hanka.odbior", { zrob: "odbierzTort" }], inaczej: [{ jesli: "tortZamowiony", to: ["hanka.czeka"],
                inaczej: [{ jesli: "tortSklad", to: ["hanka.zamowienie", { zrob: "zamowTort" }, "hanka.zamowione"], inaczej: ["hanka.brak", "hanka.placek"] }] }] },
                { rozmowa: "plotka", ustaw: { kto: "piekarka" } }],
            // Halina: wreaths out of the herbs
            halina: [{ jesli: "wiankiSa", to: ["halina.gotowe"], inaczej: [{ jesli: "ziolaSa", to: ["halina.plecie", { zrob: "wianki" }, "halina.dzieki"], inaczej: ["halina.potrzeba"] }] }],
            // Dorota: the sashes, and what she tells of the families
            dorota: [{ jesli: "!szarfySa", to: ["dorota.szarfy", { zrob: "szarfy" }], inaczej: [{ jesli: "plotkaDorota", to: ["dorota.rody", { zrob: "plotka", args: ["szwaczka"] }], inaczej: ["dorota.nic"] }] }],
            // Kleofas (on the cliff) or the village headman: who marries them
            kleofas: ["kleofas.prosba", { wybor: [
                { etykieta: "kleofas.opcja.tak", tresc: ["kleofas.tak", { zrob: "kleofas", args: [1] }] },
                { etykieta: "kleofas.opcja.pozniej", tresc: [] }], anuluj: "ostatnia" }],
            soltys: ["soltys.prosba", { wybor: [
                { etykieta: "soltys.opcja.tak", tresc: ["soltys.tak", { zrob: "kleofas", args: [2] }] },
                { etykieta: "soltys.opcja.pozniej", tresc: [] }], anuluj: "ostatnia" }],
            // a gossip: who does not sit with whom (the feuds the one tells of)
            plotka: [{ hak: "plotkaLinie" }, { zrob: "plotka", args: [{ ctx: "kto" }] }],
            // the counter in the kitchen: the dishes (up to three) and the tart
            lada: [{ jesli: "!zlecenieBierze", to: ["lada.nic"], inaczej: [{ jesli: "ucztaTrwa", to: [{ zrob: "ladaPodaj" }], inaczej: ["lada.pytanie", { wybor: [
                { etykieta: "lada.opcja.danie", tresc: [{ rozmowa: "ladaDania" }] },
                { etykieta: "lada.opcja.tort", tresc: [{ zrob: "ladaTort" }] },
                { etykieta: "lada.opcja.zostaw", tresc: [] }], anuluj: "ostatnia" }] }] }],
            ladaDania: ["lada.wybierz", { wybor: [130, 131, 132, 133, 134, 135, 136, 137].map(id => ({ etykieta: "danie." + id, tresc: [{ zrob: "ladaDanie", args: [id] }] }))
                .concat([{ etykieta: "lada.opcja.nie", tresc: [] }]), anuluj: "ostatnia" }],
            // the garland: hang a wreath or a sash on a yellow rhomb; a candle: light it
            // the plan board in the hall (the table plan window)
            tablica: [{ jesli: "!zlecenieBierze", to: ["tablica.nic"], inaczej: ["tablica.pyta", { wybor: [
                { etykieta: "tablica.opcja.plan", tresc: [{ zrob: "plan" }] },
                { etykieta: "tablica.opcja.zostaw", tresc: [] }], anuluj: "ostatnia" }] }],
            // the bachelor's night (21, 20:00-23:00): the game room
            kawalerski: ["kaw.grum", { wybor: [
                { etykieta: "kaw.opcja.zart", tresc: ["kaw.zart", { zrob: "kawalerski", args: ["zart"] }, { rozmowa: "kawalerskiKosci" }] },
                { etykieta: "kaw.opcja.dyskretnie", tresc: ["kaw.dyskretnie", { zrob: "kawalerski", args: ["dyskretnie"] }, { rozmowa: "kawalerskiKosci" }] }], anuluj: "ostatnia" }],
            kawalerskiKosci: ["kaw.pierscien", { wybor: [
                { etykieta: "kaw.opcja.gram", tresc: [{ zrob: "kosci" }] },
                { etykieta: "kaw.opcja.odciagam", tresc: ["kaw.odciagam", { zrob: "odciagnij" }] },
                { etykieta: "kaw.opcja.nic", tresc: ["kaw.nic", { zrob: "przegrany" }] }], anuluj: "ostatnia" }],
            // the groom on the terrace (the end of the search)
            pan: ["pan.taras", { wybor: [
                { etykieta: "pan.opcja.przemowa", tresc: ["pan.przemowa", { rozmowa: "panPierscien" }] },
                { etykieta: "pan.opcja.pierscien", tresc: [{ rozmowa: "panPierscien" }] },
                { etykieta: "pan.opcja.wracaj", tresc: ["pan.wracaj", { zrob: "znaleziony" }] }], anuluj: "ostatnia" }],
            panPierscien: [{ jesli: "pierscienStracony", to: ["pan.pierscienStracony", { wybor: [
                { etykieta: "pan.opcja.wykup", gdy: { hak: "stac", args: ["wykup"] }, tresc: ["pan.wykup", { zrob: "wykup" }, { zrob: "znaleziony" }] },
                { etykieta: "pan.opcja.rewanz", tresc: ["pan.rewanz", { zrob: "rewanz" }] },
                { etykieta: "pan.opcja.wracaj", tresc: ["pan.wracaj", { zrob: "znaleziony" }] }], anuluj: "ostatnia" }], inaczej: ["pan.jestOk", { zrob: "znaleziony" }] }],
            // the morning: the bride and the groom in the hall
            poranek: ["poranek.dorota", { wybor: [
                { etykieta: "poranek.opcja.prawda", tresc: ["poranek.prawda", { zrob: "poranek", args: ["prawda"] }] },
                { etykieta: "poranek.opcja.klamstwo", tresc: ["poranek.klamstwo", { zrob: "poranek", args: ["klamstwo"] }] }], anuluj: "ostatnia" }],
            // the speeches of the toast (the hero, asked by Borgar)
            toast: ["toast.pyta", { wybor: [
                { etykieta: "toast.opcja.czula", tresc: ["toast.czula.mowa", { zrob: "przemowa", args: [1] }] },
                { etykieta: "toast.opcja.dowcipna", tresc: ["toast.dowcipna.mowa", { zrob: "przemowa", args: [2] }] },
                { etykieta: "toast.opcja.niezgrabna", tresc: ["toast.niezgrabna.mowa", { zrob: "przemowa", args: [3] }] }], anuluj: 2 }],
            // the brawl: the four ways of putting it out (the hero's choice)
            bojka: ["bojka.pyta", { wybor: [
                { etykieta: "bojka.opcja.dzwonek", tresc: [{ zrob: "uspokoj", args: ["dzwonek"] }] },
                { etykieta: "bojka.opcja.piesn", gdy: "meliaPiesn", tresc: [{ zrob: "uspokoj", args: ["piesn"] }] },
                { etykieta: "bojka.opcja.ryk", gdy: "grumRyk", tresc: [{ zrob: "uspokoj", args: ["ryk"] }] },
                { etykieta: "bojka.opcja.prawda", gdy: "wieGdzie", tresc: [{ zrob: "uspokoj", args: ["prawda"] }] },
                { etykieta: "bojka.opcja.nic", tresc: [] }], anuluj: "ostatnia" }]
        },
        akcje: {
            przyjmij: [{ hak: "przyjmij" }],
            odmow: [{ hak: "odmow" }],
            piesn: [{ hak: "piesn", args: [{ arg: 0 }, { arg: 1 }] }],
            proba: [{ hak: "proba" }],
            kupStruny: [{ hak: "kupStruny" }],
            zamowTort: [{ hak: "zamowTort" }],
            odbierzTort: [{ hak: "odbierzTort" }],
            wianki: [{ hak: "wiankiZrob" }],
            szarfy: [{ hak: "szarfyZrob" }],
            kleofas: [{ hak: "kleofas", args: [{ arg: 0 }] }],
            plotka: [{ hak: "plotka", args: [{ arg: 0 }] }],
            plan: [{ hak: "planOkno" }],
            kawalerski: [{ hak: "kawalerski", args: [{ arg: 0 }] }],
            kosci: [{ hak: "kosci" }],
            odciagnij: [{ hak: "odciagnij" }],
            ladaDanie: [{ hak: "ladaDanie", args: [{ arg: 0 }] }],
            ladaTort: [{ hak: "ladaTort" }],
            ladaPodaj: [{ hak: "ladaPodaj" }],
            przegrany: [{ hak: "przegrany" }],
            rewanz: [{ hak: "rewanz" }],
            wykup: [{ hak: "wykup" }],
            znaleziony: [{ hak: "znaleziony" }],
            poranek: [{ hak: "poranek", args: [{ arg: 0 }] }],
            przemowa: [{ hak: "przemowa", args: [{ arg: 0 }] }],
            uspokoj: [{ hak: "uspokoj", args: [{ arg: 0 }] }]
        },
        // F9 ("Wyspa i fabuła" - the section "Wątek W18"): the jumps to each chapter and two rows to set (the sparks, the ring)
        f9: { naglowek: "f9.naglowek", etykieta: "f9.etykieta", opis: "f9.opis", brak: "f9.brak",
            wiersze: [
                { co: "iskry", etykieta: "f9.iskry.etykieta", opis: "f9.iskry.opis", zmienne: "f9Zm", wybierz: "f9Iskry" },
                { co: "pierscien", etykieta: "f9.pierscien.etykieta", opis: "f9.pierscien.opis", zmienne: "f9Zm", wybierz: "f9Pierscien" }
            ] },
        skoki: {
            przed: [{ hak: "f9Przygotuj" }],
            lista: {
                1: { ch: 1, krok: "w18Zlecenie", godzina: 10, dzien: 19, idz: [MAP.karczma, 14, 31, 8] },
                2: { ch: 2, krok: "w18Przygot", godzina: 10, dzien: 20, idz: [MAP.karczma, 14, 31, 8] },
                3: { ch: 2, krok: "w18Przygot", godzina: 12, dzien: 21, idz: [MAP.karczma, 18, 50, 8] },
                4: { ch: 3, krok: "w18Slub", godzina: 14.9, dzien: 22, idz: [MAP.karczma, 14, 46, 8] },
                5: { ch: 4, krok: "w18Bojka", godzina: 21.9, dzien: 22, idz: [MAP.karczma, 14, 38, 8] },
                6: { ch: 5, krok: "w18Noc", godzina: 23.1, dzien: 22, idz: [MAP.karczma, 14, 38, 8] },
                7: { ch: 6, krok: "w18Poranek", godzina: 7, dzien: 23, idz: [MAP.karczma, 14, 38, 8] }
            }
        }
    });

    window.WeseleData = { DNI, GODZ, MAP, IDS, OWNER, WARUNKI, POSTAC, DANIA, TORT, ZIOLA, ZIOLA_N, PLACKI, POCHODNIE, POCHODNIA, PIESNI, PIESN_SMUTNA, STRUNY, SALA, DEKOR, SWIECE,
        LADA, TORT_MIEJSCE, TABLICA, KARTY, WASNIE, MILOSC, PLOTKARZE, PLOTKI_POTRZEBA, NASTROJ, BOJKA, DZWIEK, MIEJSCA, NAGRODA, KONCOWKI, TX: w.tx, W18: w.Q.W18, watek: w };
})();
