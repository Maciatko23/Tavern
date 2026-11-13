/*:
 * @target MZ
 * @plugindesc Menu deweloperskie (F9) w sześciu zakładkach: Szybkie (czas, doświadczenie, złoto, teksty, przenosiny do dziewięciu map planszy i do sali tawerny), Pogoda i morze (pogoda, pływ, woda w morzu, sztorm, ptaki, motyle), Walka i zwierzęta (zwierzęta, ludzie-wrogowie, stwory z ruin, łowy, bronie), Budowanie, Przedmioty (w tym ubrania) oraz Fabuła i postacie (dług, prolog, podziemia, Akt III, wątki, kruk, orzeł, kot, paczki nowego terenu). v2.0.0
 * @author Tawerna
 *
 * @param enabled
 * @text Włączone
 * @type boolean
 * @default true
 * @desc Wyłącz (false) przed wydaniem gry, żeby F9 nie działało u gracza. Włączone domyślnie na czas developmentu/testów.
 *
 * @help
 * Klawisz F9 (poza wiadomościami i innymi menu) otwiera prosty ekran z sześcioma zakładkami;
 * Q / E przełączają zakładki (jak w dzienniku), góra / dół wybierają, ←→ zmieniają wartość, OK wykonuje.
 * Wiersz może mieć pod sobą krótki opis (szary); nagłówki sekcji są żółte. Zakładki:
 *   1. Szybkie:
 *      Czas i gracz - "Statystyki zawsze pełne" (przełącznik), "+1 godzina", "+1 dzień" (Farming.js), "Godzina: świt" /
 *      "Godzina: zachód słońca" (Sky.js), "Pora roku" (←→ z kalendarza / wiosna / lato / jesień / zima, OK pokazuje: Tawerna.time.forceSeason),
 *      "+1000 G", "+200 doświadczenia", "+10 000 doświadczenia" (Combat.gainXp), "Wczytaj teksty od nowa" (Watki.przeladuj).
 *      Przenieś mnie do - Kruczogród (Map008), Kruczy Jar - działka dziadka (003), Dom dziadka (020, przed drzwiami chaty), Łąka pod Gawrą (004),
 *      Posiadłość Lorda (024), Góry i kamieniołom (013), Podgrodzie (111), Garnizon nad zatoką (162), Przystań (125), Tawerna - sala (001): każde na
 *      wolnym, przechodnim polu głównego miejsca mapy (ISLE_GO niżej); "Wnętrze: ..." (←→ wybiera wnętrze, OK idzie przy drzwiach - tylko wnętrza,
 *      do których w obecnym świecie da się wejść).
 *      Podgląd - "Mapa wyspy: wszystko odkryte" (MapaWyspy.js), "Warstwy z regionów" (RegionLayers.js).
 *   2. Pogoda i morze:
 *      Pogoda - "Gęsta mgła o świcie" (Sky.js), "Burza teraz", "Piorun tuż obok", "Piorun w drzewo", "Koniec pogody na dziś" (Survival.js / Storm.js);
 *      z paczek: deszcz wczoraj / upał dziś / śnieg dziś (paczka A) i "Pogoda dziś" (informacja, pakiet 0).
 *      Morze - jeden wiersz "Pływ" (←→ albo OK: z zegara / odpływ / przypływ - Wyspa.forceTide), "Woda w morzu" (CzerwonaWoda.force: z pogody /
 *      czerwona / szara), "Sztorm się skończył" (JEDEN wiersz: drewno z morza z paczki A ORAZ następny kawałek wraku z paczki D), "Mglista noc na przylądku".
 *      Ptaki i motyle - stadko na ziemi, nalot na pole (Birds.js); motyle, ćmy, siatka (Motyle.js).
 *   3. Walka i zwierzęta:
 *      Zwierzęta (Hunting.js): dzik, wataha wilków, jeleń, niedźwiedź. Ludzie-wrogowie (Humans.js): bandyta, nożownik, łucznik, najemnik, zasadzka,
 *      obóz (noc), napad na śpiącego. Zwierzęta kontra ludzie (Starcia.js). Ruiny (Creatures.js): stwór z ruin i boss podziemi (←→ wybiera, OK przywołuje).
 *      Łowy (paczka B): wataha i szczenięta, przyjaźń watahy, niedźwiedź w gawrze, sól + zasiadka, obóz rabusiów i myśliwych, kłusownictwo, zawody
 *      strzeleckie, zbłąkane zwierzęta. Bronie i zbroje (Bron.js): daj wszystkie, zestaw na poziom N (←→).
 *   4. Budowanie: "Postaw: ..." (każda budowla z Farming.js): wraca na mapę w zwykłym trybie stawiania (strzałki, R / Q / E odbija, OK stawia,
 *      Anuluj wraca), ale za darmo: bez materiałów, bez sił, bez placu budowy i młotka - budynek od razu stoi gotowy (zagroda od razu ze zwierzętami).
 *   5. Przedmioty: wszystkie przedmioty w trzech podzakładkach - "Narzędzia i broń" (na górze wiersze Ubioru: daj wszystkie ubrania, zdejmij wszystko;
 *      ich opis pokazuje pasek nad zakładkami), "Surowce", "Jedzenie" (Tab albo [ / ] je przełączają); ←→ ilość, OK dodaje do plecaka.
 *   6. Fabuła i postacie: Fabuła (świt dnia 61 bez spłaty, spłać dług, prolog), Podziemia i Serce (Underground_Data.js), Akt III (Act3_Data.js), sekcje wątków
 *      silnika Watki.js (skoki do rozdziałów W4, W5, W7, W9, W14, W15, W16, listy W10, podróżni z promu, intrygi na piętrach...), Postacie (oswojony kruk,
 *      przychylność garnizonu, cysterna), Biały orzeł (Orzel.js), Kot Mruczek (HomeLife.js: rozkazy, pogłaskaj, "Zabierz mnie do domu dziadka"),
 *      paczki: C (Ludzie), A (Woda i zasoby), D (Tajemnice) i "Miejsca z paczek" (wybieraki miejsc wszystkich paczek).
 * ROUTING (skąd biorą się wiersze): wiersze zakładek 1-3 i część 6 daje sam ten plik. Wiersze innych wtyczek rozdziela on sam:
 *   - sekcje wątków (Watki.f9.sekcje()): "podziemia" i "akt3" jako ich sekcje, każdy inny wątek jako swoja sekcja w zakładce 6;
 *   - sekcje paczek (Okolice.f9.sections()): każdy wiersz (właściciel + "what") trafia tam, gdzie wskazuje tabela ROUTE niżej (zakładka, sekcja,
 *     kolejność); wiersze, których tabela nie zna, idą do zakładki 6 pod własnym nagłówkiem paczki; powtórzenia (drugi pływ, drugi sztorm, +1000 G
 *     Bronii, +500 G Ubioru, "Orzeł dorosły, lot" paczki D) są pominięte - ich jedyną wersją jest wiersz tego pliku;
 *   - orzeł (Orzel.f9Rows()), kot (HomeLife), wiersz W10 (Przystan.js dokłada go do isleRows(), tu przesuwa się go między wątki).
 *   - wiersze, które przenoszą bohatera na mapę spoza świata (obozy i łowy na Leśnej drodze i Skraju lasu, mielerz, handlarz, pasterz,
 *     zbłąkane zwierzęta Ługów, gaj Milczących, Orla Grań, rozdział 6 wątku W5), są pominięte (ROUTE: false, OFF_ORZEL, OFF_CHAPTERS);
 *   - wybieraki miejsc paczek pomijają miejsca na mapach spoza świata (WORLD_EXTRA / SwiatData.maps), patrz placeVisible().
 * F9 otwiera się na tej zakładce (i podzakładce) i pozycji, na których ostatnio był. Esc (albo F9) zamyka.
 * Zakładki i podzakładki można też klikać myszą. Zakładki "Rdzeń" (Tawerna.debug.lines() zostaje w TawernaCore.js) i "Kot" (opis dnia kota) usunięto.
 * Tylko do testowania - przed wydaniem gry ustaw parametr "Włączone" na false.
 */
(() => {
    "use strict";
    const TK = Watki.teksty("f9");   // (the words of this file: js/teksty/f9.txt, kod.*)
    const T = window.Tawerna;   // (the calendar: the season row)

    const enabled = PluginManager.parameters("Debug").enabled !== "false";
    if (!enabled) return;

    Input.keyMapper[120] = "debugmenu";   // F9

    function canOpen() {
        return !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode &&
            !($gamePlayer && $gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging());
    }

    // F9 on the map; what the menu left for the map to do. The core's clock of the map (TawernaCore), in the order its own hook on
    // Scene_Map.update had: after Spoilage's and Needs', before every other clock
    window.Tawerna.onMapUpdate(scene => {
        if (Input.isTriggered("debugmenu") && canOpen()) SceneManager.push(Scene_Debug);
        // a building chosen in the menu: placed once the map is back (Farming.js's placer, free and finished at once)
        if ($gameTemp._debugBuild && scene === SceneManager._scene && !SceneManager.isSceneChanging() && !$gameTemp._buildMode && !$gameMessage.isBusy()) {
            const type = $gameTemp._debugBuild;
            $gameTemp._debugBuild = null;
            Farming.startFreePlacement(type);
        }
        // the story tab's acts that need the map (the raven's name screen, the prologue's film): once the map is back and calm
        if ($gameTemp._isleAct && scene === SceneManager._scene && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() &&
            !$gameMessage.isBusy() && !$gameMap.isEventRunning()) {
            const what = $gameTemp._isleAct;
            $gameTemp._isleAct = null;
            if (what === "raven" && window.Kruk && Kruk.tameNow) Kruk.tameNow();
            else if (what === "prologue" && window.Prologue && Prologue.replay) Prologue.replay();
        }
    }, { owner: "Debug", name: "f9", priority: -100 });

    // the tabs: their names and the key help shown over the list (js/teksty/f9.txt, karty.<n>.name / .help); the heads of their sections: sekcje.<id>
    const TABS = Watki.scal([{}, {}, {}, {}, {}, {}], "f9", "karty");
    const QUICK_TAB = 0, WEATHER_TAB = 1, FIGHT_TAB = 2, BUILD_TAB = 3, ITEMS_TAB = 4, STORY_TAB = 5;
    const twoLines = tab => tab !== BUILD_TAB && tab !== ITEMS_TAB;   // (a row and its description under it; the building and item tabs: a single line)
    // ---- "Przenieś mnie do:" (2026-11-11, the user's layout): the nine maps of the board and the tavern hall. Where to go: { id, map, x, y,
    // d (facing) } - each a free, walkable cell (the 3x3 around it too, no event on it) at the map's main place, found in the game; the name
    // (nazwa) and the line under it (opis): js/teksty/f9.txt, tele.<id>. (Gone with the world's change: Pustelnia 155, Urwisko 157,
    // the cape 159, the wreck 165, the cistern 167, the burnt farm 168, the test maps 990 / 991 / 027 - no way leads there any more.)
    const ISLE_GO = [
        { id: "kruczogrod", map: 8, x: 51, y: 53, d: 2 },
        { id: "jar", map: 3, x: 60, y: 61, d: 2 },
        { id: "dom", map: 20, x: 46, y: 48, d: 8 },
        { id: "laka", map: 4, x: 60, y: 60, d: 2 },
        { id: "dwor", map: 24, x: 40, y: 75, d: 8 },
        { id: "gory", map: 13, x: 44, y: 50, d: 2 },
        { id: "podgrodzie", map: 111, x: 60, y: 62, d: 2 },
        { id: "garnizon", map: 162, x: 52, y: 49, d: 2 },
        { id: "przystan", map: 125, x: 20, y: 7, d: 2 },
        { id: "tawerna", map: 1, x: 31, y: 28, d: 2 }
    ];
    Watki.scal(ISLE_GO, "f9", "tele", "id");
    // the rooms inside ("Wnętrze": ←→): { id, map, x, y, d } - the names: js/teksty/f9.txt, wyspa.wnetrza.<id>.nazwa. Only the rooms one can still
    // enter in the world (a door on the harbour, the garrison, Podgrodzie, the town's counting-house, the manor); left out: the scriptorium (155),
    // the wreck's hold (166), the Ługs' house (169) - their outdoor maps are not in the world
    const ISLE_INSIDE = [
        { id: "izbaLatarnika", map: 160, x: 6, y: 8, d: 8 }, { id: "laterna", map: 161, x: 5, y: 7, d: 8 },
        { id: "kwatera", map: 163, x: 6, y: 8, d: 8 }, { id: "chata", map: 154, x: 4, y: 8, d: 8 },
        { id: "piwnicaKantoru", map: 171, x: 2, y: 4, d: 2 },
        // (2026-10-17) W7: the manor's rooms (Dwor.js, maps 172-174)
        { id: "dworHol", map: 172, x: 11, y: 13, d: 8 }, { id: "dworBiblioteka", map: 173, x: 8, y: 10, d: 8 },
        { id: "dworGabinet", map: 174, x: 7, y: 9, d: 8 }];
    Watki.scal(ISLE_INSIDE, "f9", "wyspa.wnetrza", "id");
    // the world: the maps of the board (SwiatData.js) and the tavern hall; the package place pickers skip a place on any other map
    const WORLD_EXTRA = [1];
    // (2026-11-11) SwiatData.extra: the pockets (the Silent's huts, Pustelnia + Urwisko, Spalona zagroda) and the mine with Orla Grań belong to the world too
    const inWorld = map => !window.SwiatData || !SwiatData.maps || !!SwiatData.maps[map] || (SwiatData.extra || []).includes(Number(map)) || WORLD_EXTRA.includes(Number(map));
    const placeGo = p => [p.nazwa, p.map, p.x, p.y, p.d];   // (as go() takes it: [name, map, x, y, facing])
    const WATER = [null, "red", "grey"], WATER_NAME = Watki.scal({}, "f9", "wyspa.woda");   // (the sea's colour forced: its word by the key)
    const isleIcon = id => ($dataItems[id] ? $dataItems[id].iconIndex : 0);
    const storyOn = () => !!(window.Story && Story.active && Story.active());
    // (2026-10-17) W4 "Krew kasztelana", W5 "Towary z kontynentu", W7 "Dwór z kamieni twierdzy", W9 ch. 3 "Rywal w ruinach": straight
    // to a chapter / the rival forced - since 2026-10-23 (W4) and 2026-10-29 (W5, W7, W9) the rows of the thread engine (Watki.f9: the
    // jumps and the rows in the threads' data - Kasztelan_Data, Kantor_Data, Dwor_Data, Rywal_Data); this file knows none of them
    const isleLabel = {
        inside: i => Watki.wstaw(TK.kod.inside[0], { nazwa: ISLE_INSIDE[i].nazwa }),
        water: () => {
            const C = window.CzerwonaWoda;
            if (!C || !C.force) return TK.kod.water[0];
            const f = C.forced();
            return Watki.wstaw(TK.kod.water[3], { "1": f ? Watki.wstaw(TK.kod.water[1], { "1": WATER_NAME[f] }) : Watki.wstaw(TK.kod.water[2], { "1": C.phase().grey ? "szara" : "czerwona" }) });
        },
        lose: () => {
            if (!storyOn()) return TK.kod.lose[0];
            const s = Story.state();
            if (s.lost) return Watki.wstaw(TK.kod.lose[1], { day: s.lost.day });
            if (s.done || s.paid >= s.debt) return TK.kod.lose[2];
            return TK.kod.lose[3];
        },
        pay: () => {
            if (!storyOn()) return TK.kod.pay[0];
            const s = Story.state();
            if (s.lost) return s.buy && s.buy.done ? Watki.wstaw(TK.kod.pay[1], { done: s.buy.done }) : Watki.wstaw(TK.kod.pay[2], { "1": Story.buyLeft() });
            if (s.done || s.paid >= s.debt) return Watki.wstaw(TK.kod.pay[3], { paid: s.paid, debt: s.debt });
            return Watki.wstaw(TK.kod.pay[4], { "1": Story.left(), debt: s.debt });
        },
        raven: () => {
            if (!window.Kruk) return TK.kod.raven[0];
            const s = Kruk.state();
            return s && s.stage === "tame" ? Watki.wstaw(TK.kod.raven[1], { "1": s.name || "Kruk" }) : TK.kod.raven[2];
        },
        // (2026-10-23) the texts' files read again (Watki.przeladuj): the last result in the label
        texts: () => {
            const W = window.Watki;
            if (!W || !W.przeladuj) return TK.kod.texts[0];
            const r = W.ostatnieWczytanie();
            return Watki.wstaw(TK.kod.texts[2], { "1": r ? "   (" + r.text + ")" : Watki.wstaw(TK.kod.texts[1], { length: W.pliki().length }) });
        },
        favor: () => (window.Garnizon && Garnizon.favor ? Watki.wstaw(TK.kod.favor[0], { "1": Garnizon.favor() }) : TK.kod.favor[1]),
        cistern: () => {
            const q = window.TownQuests, f = q && q.state ? q.state().flags : {};
            return f.cisternOpen ? Watki.wstaw(TK.kod.cistern[0], { cisternOpen: f.cisternOpen }) : TK.kod.cistern[1];
        }
    };
    // ---- the cat (HomeLife.js's Mruczek): its doings to send it to (id: HomeLife's spot; rozkaz: the row that sends it there - js/teksty/f9.txt,
    // kot.miejsca.<id>); its rows are the "Kot Mruczek" section of the last tab (dynamicRows). The tab with the description of its day is gone.
    const CAT_SPOTS = Watki.scal([{ id: "hearth" }, { id: "rug" }, { id: "sill" }, { id: "stroll" }, { id: "feet" }, { id: "heroBed" }], "f9", "kot.miejsca", "id");
    // the item tab's three kinds (a second band under the tabs; Tab or [ / ] switch them): tools and weapons, materials, food
    const KINDS = Watki.scal([], "f9", "przedmioty.rodzaje");   // (js/teksty/f9.txt)
    const TOOL_EXTRA = [59, 127, 129, 138, 141, 142, 144];   // plain items that are tools all the same: torch, arrows, waterskin, bucket, cauldron, shears, tongs
    const RAW_FOOD = [94, 98, 157, 159, 161, 168, 173, 174];   // raw hare, fish, deer, boar, wolf, bear, herring, cod: food still to be cooked
    function kindOf(item) {
        if (item.itypeId === 2 || TOOL_EXTRA.includes(item.id)) return 0;   // (the database's key items: tools, weapons, the shield, clothes, the tent)
        const m = item.meta || {};
        if (m.Food || m.Butcher || m.Bandage || RAW_FOOD.includes(item.id) || (window.Spoilage && item.id === Spoilage.ROT) ||
            isStock(item)) return 2;   // (also the bandage and the database's potions: used up like food)
        return 1;
    }
    // the database's own potions and boosters (not the game's food): at the end of the food list
    const isStock = item => !(item.meta && item.meta.Food) && item.consumable && item.effects.length > 0 && !TOOL_EXTRA.includes(item.id);
    // where the menu was last time (the tab, the kind of item, the row in each of them): F9 opens there again
    const last = { tab: 0, kind: 0, index: {} };
    const spot = (tab, kind) => (tab === ITEMS_TAB ? tab + ":" + kind : String(tab));

    const layersLabel = () => Watki.wstaw(TK.kod.layersLabel[2], { "1": window.RegionLayers && RegionLayers.overlay ? TK.kod.layersLabel[0] : TK.kod.layersLabel[1] });
    // (2026-10-29) the sections of the thread engine (Watki.f9.sekcje()), by the thread's `zakladka`: "zdarzenia" (the underground's and Act III's
    // rows, put in sections of their own) or "wyspa" (every other thread: its own head and rows); a row keeps every field the thread gave it
    const threadSections = tab => (window.Watki && Watki.f9 ? Watki.f9.sekcje().filter(s => (s.zakladka || "wyspa") === tab) : []);
    // Creatures.js (combat stage 4): a creature of the ruins / a boss of the underground a few tiles away; ←→ choose which
    const crKeys = kind => (window.Creatures ? Object.keys(kind === "cr_boss" ? Creatures.BOSSES : Creatures.KINDS) : []);
    const crLabel = (kind, i) => {
        const key = crKeys(kind)[i] || "";
        if (kind === "cr_boss") { const b = Creatures.BOSSES[key] || {}; return Watki.wstaw(TK.kod.crLabel[0], { name: b.name, floor: b.floor }); }
        const k = Creatures.KINDS[key] || {};
        return Watki.wstaw(TK.kod.crLabel[2], { "1": k.plural ? Watki.wstaw(TK.kod.crLabel[1], { plural: k.plural }) : k.name });
    };
    // (the rows of the menu: allRows below for this file's own, dynamicRows for the other plugins' - each with its tab and section)
    // ---- "Statystyki zawsze pełne" (2026-11-07, the user: "dodaj mi do menu F9 przełącznik, że wszystkie statystyki gracza są na full
    // i nie maleją (życie, wytrzymałość, głód itd.)"): while on, every map frame puts back to full what fell - the hero's (and the
    // party's) life, the strength (stamina), food and water (Needs.js), the breath of a fight (Combat_Fight.js) and the sleep (the
    // hours awake: Farming's lastSleep, as a sleep does). Kept by the browser (localStorage), not in a save: it stays across loads.
    const PELNE_KEY = "tawerna_f9_pelne";
    let pelne = false;
    try { pelne = localStorage.getItem(PELNE_KEY) === "1"; } catch (e) { pelne = false; }
    const pelneLabel = () => TK.kod.pelne[pelne ? 1 : 0];
    function keepFull() {
        if (!pelne || !window.$gameParty || !window.$gameSystem) return;
        for (const a of $gameParty.members()) if (a.isAlive() && a.hp < a.mhp) a.setHp(a.mhp);
        if (typeof $gameSystem.setStamina === "function" && $gameSystem.stamina() < $gameSystem.maxStamina()) $gameSystem.setStamina($gameSystem.maxStamina());
        const N = window.Tawerna.api("Needs"), n = N && N.state ? N.state() : null;
        if (n) { if (n.food < 100) n.food = 100; if (n.water < 100) n.water = 100; }
        const CP = window.Tawerna.api("Combat_parts");
        if (CP && CP.fight && CP.fight.fillBreath) CP.fight.fillBreath();
        const F = window.Farming;
        if (F && F.farm && F.clockHours) { const f = F.farm(), now = F.clockHours(); if (f && f.lastSleep !== now) f.lastSleep = now; }
    }
    window.Tawerna.onMapUpdate(keepFull, { owner: "Debug", name: "pelne" });
    // the season row: 0 = from the calendar, 1..4 = spring..winter shown (Tawerna.time.forceSeason; not saved)
    function seasonLabel(pick) {
        const name = pick ? T.time.SEASONS[pick - 1] : Watki.wstaw(TK.kod.pora[1], { pora: T.time.SEASONS[Math.floor(((Math.max(1, T.time.day()) - 1) / T.time.seasonLength()) % 4)] });
        return Watki.wstaw(TK.kod.pora[0], { pora: name });
    }
    function applySeason(pick) {
        T.time.forceSeason(pick ? pick - 1 : null);
        // winter: the snow of Klimat_Pogoda at once (it builds up from the snow weather otherwise); another season: from the weather
        if (window.KlimatPogoda && KlimatPogoda.force) KlimatPogoda.force({ snow: pick === 4 ? 1 : null, now: true });
    }
    // ---- the routing of the rows other plugins give (Okolice.f9.sections(): the packages; "owner:what" of a row -> where it goes). Each:
    // [tab, section, order in the section, (a key of wiersze.<key> in the texts that renames the row)]; false - left out: a duplicate of a
    // row this file has (the tide and the storm's end are one row each; +1000 G once; the white eagle's flight is the eagle section's).
    // A row the table does not know goes to the last tab under the head of its package. The sections of a tab: ORDER; their heads: sekcje.<id>
    const ROUTE = {
        "Okolice:spot": [STORY_TAB, "miejsca", 1], "Okolice:check": [STORY_TAB, "miejsca", 6], "Okolice:all": [STORY_TAB, "miejsca", 7],
        "Okolice:forget": [STORY_TAB, "miejsca", 8], "Okolice:weather": [WEATHER_TAB, "pogoda", 5],
        "Zasoby:go": [STORY_TAB, "miejsca", 2], "Zasoby:rain": [WEATHER_TAB, "pogoda", 2], "Zasoby:hot": [WEATHER_TAB, "pogoda", 3],
        "Zasoby:snow": [WEATHER_TAB, "pogoda", 4], "Zasoby:tide": false, "Zasoby:storm": false,
        "Zasoby:well": [STORY_TAB, "zasoby", 1], "Zasoby:tree": [STORY_TAB, "zasoby", 2], "Zasoby:d30": [STORY_TAB, "zasoby", 3], "Zasoby:reset": [STORY_TAB, "zasoby", 4],
        "Lowy:place": [STORY_TAB, "miejsca", 3], "Lowy:den": [FIGHT_TAB, "lowy", 1], "Lowy:friend": [FIGHT_TAB, "lowy", 2], "Lowy:bear": [FIGHT_TAB, "lowy", 3],
        "Lowy:salt": [FIGHT_TAB, "lowy", 4], "Lowy:rab": [FIGHT_TAB, "lowy", 5], "Lowy:czo": [FIGHT_TAB, "lowy", 6], "Lowy:poach": [FIGHT_TAB, "lowy", 7],
        "Lowy:contest": [FIGHT_TAB, "lowy", 8], "Lowy:strays": [FIGHT_TAB, "lowy", 9],
        "Ludzie:go": [STORY_TAB, "miejsca", 4], "Ludzie:kiln": [STORY_TAB, "ludziePaczka", 1], "Ludzie:stop": [STORY_TAB, "ludziePaczka", 2], "Ludzie:p018": [STORY_TAB, "ludziePaczka", 3], "Ludzie:patrol": [STORY_TAB, "ludziePaczka", 4], "Ludzie:camp": [STORY_TAB, "ludziePaczka", 5],
        "Ludzie:tide": [STORY_TAB, "ludziePaczka", 6, "zatoczka"], "Ludzie:cave": [STORY_TAB, "ludziePaczka", 7], "Ludzie:storm": [STORY_TAB, "ludziePaczka", 8],
        "Zakon:spot": [STORY_TAB, "miejsca", 5], "Zakon:shadow": [STORY_TAB, "zakon", 1], "Zakon:key": [STORY_TAB, "zakon", 2], "Zakon:cards": [STORY_TAB, "zakon", 3],
        "Zakon:eagle": false, "Zakon:storm": false, "Zakon:tide": false, "Zakon:act2": [STORY_TAB, "zakon", 4], "Zakon:grove": [STORY_TAB, "zakon", 5],
        "Ubior_Sklepy:all": [ITEMS_TAB, "ubior", 1], "Ubior_Sklepy:off": [ITEMS_TAB, "ubior", 2], "Ubior_Sklepy:gold": false,
        "Bron:all": [FIGHT_TAB, "bron", 1], "Bron:set": [FIGHT_TAB, "bron", 2], "Bron:gold": false,
        // (2026-11-12) W23 "Coś z głębin": the sea monsters' rows beside the other enemies
        "Morze:show": [FIGHT_TAB, "potwory", 1], "Morze:force": [FIGHT_TAB, "potwory", 2], "Morze:day": [FIGHT_TAB, "potwory", 3],
        "Morze:captain": [FIGHT_TAB, "potwory", 4], "Morze:dawn": [FIGHT_TAB, "potwory", 5], "Morze:clear": [FIGHT_TAB, "potwory", 6]
    };
    // (2026-11-11, the user) a row whose act moves the hero to a map outside the world is left out too: the hunts and camps of Leśna droga and
    // Skraj lasu (Lowy: den, rab, czo; Ludzie: kiln, stop, p018), the Ługs' strayed animals (168), the grove of the Silent (120); likewise the
    // eagle's two rows to the Orla Grań (175) and W5's chapter 6 (the ferry night on Polna droga, 22). A map is in the world when
    // inWorld() says so; the rows were found by running every OK with the transfers recorded (tests/debug_menu_test.js does it again).
    const OFF_ORZEL = (window.SwiatData && (SwiatData.extra || []).includes(175)) ? [] : ["kradziez", "gran"];   // (the Orla Grań is in the world now: through the mine)
    const OFF_CHAPTERS = {};   // (2026-11-11: W5 chapter 6, the ferry night, is on Kruczy Jar now)
    const chapterHidden = row => !!row.watek && (OFF_CHAPTERS[row.watek] || []).includes(row.pick);
    // the rows that choose a place to go to: the ones on maps outside the world are skipped as ←→ goes through them
    const PICKERS = ["Okolice:spot", "Zasoby:go", "Lowy:place", "Ludzie:go", "Zakon:spot"];
    const ORDER = {
        [QUICK_TAB]: ["czas", "tele", "podglad"],
        [WEATHER_TAB]: ["pogoda", "morze", "ptaki"],
        [FIGHT_TAB]: ["zwierzeta", "wrogowie", "starcia", "ruiny", "potwory", "lowy", "bron"],
        [ITEMS_TAB]: ["ubior"],
        [STORY_TAB]: ["fabula", "podziemia", "akt3", "@watki", "postacie", "orzel", "kot", "ludziePaczka", "zasoby", "zakon", "miejsca"]   // ("@watki": every thread section)
    };
    const packageSections = () => (window.Okolice && Okolice.f9 && Okolice.f9.sections ? Okolice.f9.sections() : []);
    const packageRow = (owner, what) => {
        const sec = packageSections().find(s => s.owner === owner), r = sec && sec.rows.find(x => x.what === what);
        return r ? Object.assign({ owner }, r) : null;
    };
    // where a picker row leads now: its own OK asked and taken back (Ludzie's forces the low tide at the harbour and the cave)
    function peekGo(row) {
        const W = window.Wyspa, tide = W && W.tideForced ? W.tideForced() : null;
        let r = null;
        try { r = Okolice.f9.ok(row); } catch (e) { r = null; }
        if (W && W.forceTide && W.tideForced() !== tide) W.forceTide(tide);
        return r && r.go ? r.go : null;
    }
    const placeVisible = row => { const g = peekGo(row); return !g || inWorld(g[1]); };
    // ←→ on a package row; on a picker one step further while the place is on a map outside the world
    function packagePick(row, delta) {
        Okolice.f9.pick(row, delta);
        if (!PICKERS.includes(row.owner + ":" + row.what)) return;
        for (let n = 0; n < 700 && !placeVisible(row); n++) Okolice.f9.pick(row, delta || 1);
    }
    // the tide, one row: ←→ / OK go round "from the clock" -> low -> high (Zasoby.js's own row does it and wakes its puddles; else Wyspa.js)
    function cycleTide(delta) {
        const W = window.Wyspa;
        if (!W || !W.forceTide) return;
        const z = packageRow("Zasoby", "tide");
        if (z && Okolice.f9.ok) { for (let n = delta < 0 ? 2 : 1; n > 0; n--) Okolice.f9.ok(z); return; }
        const seq = [null, "low", "high"];
        W.forceTide(seq[(seq.indexOf(W.tideForced()) + (delta < 0 ? 2 : 1)) % 3]);
    }
    const tideLabel = () => {
        const W = window.Wyspa, f = W && W.tideForced ? W.tideForced() : null;
        return f ? TK.plyw[f] : Watki.wstaw(TK.plyw.zegar, { "1": W && W.tide && W.tide().low ? TK.plyw.low2 : TK.plyw.high2 });
    };
    // the storm's end, one row: the driftwood on the shores (package A) and the next piece of the wreck (package D)
    const stormEnd = () => ["Zasoby", "Zakon"].map(o => packageRow(o, "storm")).filter(Boolean);
    // the rows other plugins give, each in its place (ROUTE): the threads of the engine, the white eagle, the cat, the packages
    function dynamicRows() {
        const out = [], mk = (tab, sec, kind, label, icon, desc, more) => out.push(Object.assign({ tab, sec, kind, label, icon, desc }, more || {}));
        // (2026-10-23) the threads with chapter jumps or rows of their own in their data - the ferry's travellers, W15, W16, W4, W5, W7, W9...:
        // each its head and its rows (Watki.f9.sekcje() / wybierz(row, delta) / ok(row)); a thread's data registers them, never this file
        for (const sec of threadSections("wyspa"))
            for (const r of sec.rows) {
                const row = Object.assign({}, r, { tab: STORY_TAB, sec: "w:" + sec.watek, secHead: sec.head, desc: r.desc || "" });
                for (let n = 0; n < 14 && chapterHidden(row); n++) Watki.f9.wybierz(row, 1);
                out.push(row);
            }
        // (2026-10-18) the white eagle (Orzel.js): its rows come from the plugin - Orzel.f9Rows() / f9Pick(row, delta) / f9(row)
        if (window.Orzel && Orzel.f9Rows) for (const r of Orzel.f9Rows()) if (!OFF_ORZEL.includes(r.what)) mk(STORY_TAB, "orzel", "isleEagle", r.label, r.icon, r.desc, { what: r.what, pick: r.pick });
        // the cat (HomeLife.js): its orders, the choice left to it, a stroke, the way to grandpa's house
        const H = window.HomeLife;
        if (H && H.catState) {
            const st = H.catState(), can = st ? H.catSpots() : [];
            for (const { id: spot, rozkaz: label } of CAT_SPOTS) if (can.includes(spot)) mk(STORY_TAB, "kot", "cat", label, 0, TK.opis.cat, { spot });
            if (st) mk(STORY_TAB, "kot", "catChoose", TK.kod.catRows[12], 0, TK.opis.catChoose);
            if (st) mk(STORY_TAB, "kot", "catPet", TK.kod.catRows[13], 82, TK.opis.catPet);
            mk(STORY_TAB, "kot", "catHouse", TK.kod.catRows[3], 0, TK.opis.catHouse);
        }
        // (2026-10-21) the new terrain's packages (docs/rozszerzenia/PLAN.md): Okolice.f9 - sections() / pick(row, delta) / ok(row); a package
        // registers its rows with Okolice.f9.add({ owner, title, rows, pick, ok }) and never edits this file
        for (const sec of packageSections()) {
            for (const r of sec.rows) {
                const key = sec.owner + ":" + r.what, rt = ROUTE[key];
                if (rt === false) continue;
                const [tab, id, ord, name] = rt || [STORY_TAB, "inne:" + sec.owner, 9];
                const words = name ? TK.wiersze[name] : null;
                const row = { tab, sec: id, secHead: rt ? undefined : sec.title, ord, kind: "isleOkolice", label: words ? words.label : r.label, icon: r.icon,
                    desc: words ? words.desc : r.desc, owner: sec.owner, what: r.what, pick: r.pick };
                if (PICKERS.includes(key)) for (let n = 0; n < 700 && !placeVisible(row); n++) Okolice.f9.pick(row, 1);
                out.push(row);
            }
        }
        return out;
    }
    // the rows of a tab in their sections: { head, a row per entry } - the static rows (allRows: `sec`) and the dynamic ones, by `ord`
    function layoutOf(tab, all) {
        const bag = {}, put = r => { const b = bag[r.sec] || (bag[r.sec] = { head: r.secHead, rows: [] }); b.rows.push(r); };
        for (const r of all) if (r.tab === tab && r.sec) put(r);
        for (const r of dynamicRows()) if (r.tab === tab) put(r);
        const ids = [];
        // the threads by their number (W4, W5 ... W23), the ones without one (the travellers, the intrigues) first, as they came
        const wNum = k => { const m = /W(\d+)/.exec(bag[k].head || ""); return m ? +m[1] : -1; };
        const watki = () => Object.keys(bag).filter(k => k.indexOf("w:") === 0).map((k, i) => [k, wNum(k), i]).sort((a, c) => (a[1] - c[1]) || (a[2] - c[2])).map(e => e[0]);
        for (const id of ORDER[tab]) { if (id === "@watki") ids.push(...watki()); else ids.push(id); }
        ids.push(...Object.keys(bag).filter(k => !ids.includes(k)));
        const out = [];
        for (const id of ids) {
            const b = bag[id];
            if (!b || !b.rows.length) continue;
            out.push({ tab, sec: id, kind: "info", label: b.head || TK.sekcje[id] || id, head: true });
            out.push(...b.rows.sort((a, c) => (a.ord || 0) - (c.ord || 0)));
        }
        return out;
    }
    // every row of the menu this file gives itself, each with its tab and section (the order here is the order in the section); a label that
    // changes between two visits has `fresh(row)`, called each time the tab is read
    function allRows() {
        const rows = [], add = (tab, sec, kind, label, icon, desc, more) => { const d = desc || TK.opis[kind], r = Object.assign({ tab, sec, kind, label, icon }, d ? { desc: d } : {}, more || {}); rows.push(r); return r; };
        const K = TK.kod, Q = QUICK_TAB, W = WEATHER_TAB, F = FIGHT_TAB;
        // ---- Szybkie
        // "Statystyki zawsze pełne" (2026-11-07, the user: "dodaj mi do menu F9 przełącznik, że wszystkie statystyki gracza są na full
        // i nie maleją (życie, wytrzymałość, głód itd.)"): see keepFull below
        add(Q, "czas", "pelne", pelneLabel(), 84);
        add(Q, "czas", "hour", K.allRows[0], 240);
        add(Q, "czas", "day", K.allRows[1], 241);
        if (window.Sky && Sky.sunTimes) {   // the sky (Sky.js): jump to the dawn or the sunset
            add(Q, "czas", "dawn", K.allRows[2], 240);
            add(Q, "czas", "dusk", K.allRows[3], 240);
        }
        // the season row: 0 = from the calendar, 1..4 = spring..winter shown
        const seasonPick = T.time.forced === null ? 0 : T.time.forced + 1;
        add(Q, "czas", "season", seasonLabel(seasonPick), 241, "", { pick: seasonPick });
        add(Q, "czas", "isleGold", "+1000 G", 314, K.isleRows[11]);
        if (window.Combat) add(Q, "czas", "xp", K.allRows[28], 87);   // Combat.js: to try the levels
        add(Q, "czas", "isleXp", K.isleRows[12], 87, K.isleRows[13]);
        add(Q, "czas", "isleTexts", "", 189, K.isleRows[16], { fresh: r => { r.label = isleLabel.texts(); } });
        ISLE_GO.forEach((g, i) => add(Q, "tele", "isleGo", g.nazwa, 190, g.opis, { go: i }));
        add(Q, "tele", "isleInside", "", 189, K.isleRows[1], { pick: 0, fresh: r => { r.pick = last.isle || 0; r.label = isleLabel.inside(r.pick); } });
        // (2026-11-07) the island's sketch (MapaWyspy.js, menu P „Mapa”): every place known, with its name - a switch
        if (window.MapaWyspy && MapaWyspy.revealAll) add(Q, "podglad", "isleMapa", "", 497, K.mapa[4], { fresh: r => { r.label = K.mapa[MapaWyspy.revealAll() ? 1 : 0]; } });
        if (window.RegionLayers) add(Q, "podglad", "layers", layersLabel(), 190);   // RegionLayers.js: the painted regions 1-3 in colour over the map
        // ---- Pogoda i morze
        if (window.Sky && Sky.sunTimes) add(W, "pogoda", "mist", K.allRows[4], 70);
        if (window.Survival && Survival.forceStorm) {   // the weather (Survival.js plans it, Storm.js shows it)
            add(W, "pogoda", "storm", K.allRows[5], 66);
            add(W, "pogoda", "strike", K.allRows[6], 66);
            add(W, "pogoda", "treestrike", K.allRows[7], 66);
            add(W, "pogoda", "calm", K.allRows[8], 70);
        }
        if (window.Wyspa && Wyspa.forceTide) add(W, "morze", "isleTide", "", 70, TK.plyw.opis, { fresh: r => { r.label = tideLabel(); } });
        add(W, "morze", "isleWater", "", isleIcon(173) || 70, K.isleRows[7], { fresh: r => { r.label = isleLabel.water(); } });
        add(W, "morze", "isleStorm", TK.burzaKoniec.label, 70, TK.burzaKoniec.opis, { fresh: r => { r.icon = (stormEnd()[0] || {}).icon || 70; } });
        add(W, "morze", "isleFog", K.isleRows[5], 70, K.isleRows[6]);
        if (window.Birds) {   // the birds (Birds.js): a flock landing near the player, a raid on the sown fields
            add(W, "ptaki", "birds", K.allRows[9], 407);
            add(W, "ptaki", "raid", K.allRows[10], 408);
        }
        if (window.Motyle) {   // the butterflies (Motyle.js): a summer meadow after rain here and now (a peacock too), moths at a fire at night, the net
            add(W, "ptaki", "motyle", K.allRows[11], Motyle.ICON.butterfly);
            add(W, "ptaki", "cmy", K.allRows[12], Motyle.ICON.butterfly);
            add(W, "ptaki", "siatka", K.allRows[13], Motyle.ICON.net);
        }
        // ---- Walka i zwierzęta
        const item = id => ($dataItems[id] ? $dataItems[id].iconIndex : null);
        if (window.Hunting && Hunting.SPECIES.boar) add(F, "zwierzeta", "boar", K.allRows[14], 416);   // Hunting.js: one boar a few tiles away
        if (window.Hunting && Hunting.SPECIES.wolf) add(F, "zwierzeta", "wolves", K.allRows[15], 416);   // a pack a few tiles away
        if (window.Hunting && Hunting.SPECIES.deer) add(F, "zwierzeta", "deer", K.allRows[16], 420);   // a deer a few tiles away (any hour)
        if (window.Hunting && Hunting.SPECIES.bear) add(F, "zwierzeta", "bear", K.allRows[17], item(170) || 416);   // a bear 7-10 tiles away (any hour)
        if (window.Humans) {   // Humans.js (combat stage 3): men a few tiles away, an ambush, a camp at night
            add(F, "wrogowie", "h_bandit", K.allRows[18], item(156) || 418);
            add(F, "wrogowie", "h_knifer", K.allRows[19], item(91) || 347);
            add(F, "wrogowie", "h_archer", K.allRows[20], item(126) || 386);
            add(F, "wrogowie", "h_mercenary", K.allRows[21], item(155) || 417);
            add(F, "wrogowie", "h_ambush", K.allRows[22], 76);
            add(F, "wrogowie", "h_camp", K.allRows[23], 64);
            add(F, "wrogowie", "h_raid", K.allRows[24], 64);
        }
        if (window.Starcia && window.Humans && window.Hunting) {   // Starcia.js: the beasts and the men fight each other (watch it from aside)
            add(F, "starcia", "st_camp", K.allRows[25], 416);
            add(F, "starcia", "st_boar", K.allRows[26], 416);
            add(F, "starcia", "st_bear", K.allRows[27], item(170) || 416);
        }
        if (window.Creatures) {   // Creatures.js: one of the 8 kinds, a boss (the guardian, floors 20-90)
            add(F, "ruiny", "cr_kind", crLabel("cr_kind", 0), 189, "", { pick: 0 });
            add(F, "ruiny", "cr_boss", crLabel("cr_boss", 0), 189, "", { pick: 0 });
        }
        // ---- Fabuła i postacie
        add(STORY_TAB, "fabula", "isleLose", "", 241, K.isleRows[9], { fresh: r => { r.label = isleLabel.lose(); } });
        add(STORY_TAB, "fabula", "islePay", "", 314, K.isleRows[10], { fresh: r => { r.label = isleLabel.pay(); } });
        add(STORY_TAB, "fabula", "islePrologue", K.isleRows[14], isleIcon(172) || 87, K.isleRows[15]);
        // the threads' rows of the first sections (Watki.f9, zakladka "zdarzenia"): the underground (a floor, the grate, the locks, the lift, the
        // Heart's endings - Underground_Data.js), Act III (arm, now, clear - Act3_Data.js); ←→ and OK go to the engine (row.watek)
        for (const sec of threadSections("zdarzenia")) {
            const fixed = sec.watek === "podziemia" || sec.watek === "akt3";
            for (const r of sec.rows) rows.push(Object.assign({}, r, { tab: STORY_TAB, sec: fixed ? sec.watek : "w:" + sec.watek, secHead: fixed ? undefined : sec.head, desc: r.desc || TK.opis[r.kind] }));
        }
        add(STORY_TAB, "postacie", "isleRaven", "", isleIcon(179) || 87, K.isleRows[17], { fresh: r => { r.label = isleLabel.raven(); } });
        add(STORY_TAB, "postacie", "isleFavor", "", isleIcon(155) || 87, K.isleRows[18], { fresh: r => { r.label = isleLabel.favor(); } });
        add(STORY_TAB, "postacie", "isleCistern", "", 391, K.isleRows[19], { fresh: r => { r.label = isleLabel.cistern(); } });
        // ---- Budowanie, Przedmioty
        if (window.Farming && Farming.startFreePlacement) {   // every building of Farming.js, put down free and finished
            for (const [type, def] of Object.entries(Farming.BUILDINGS)) {
                const iconItem = Farming.itemOf(def.pack || def.cost[0][0]);
                rows.push({ tab: BUILD_TAB, kind: "build", type, label: Watki.wstaw(K.allRows[29], { name: def.name }), icon: iconItem ? iconItem.iconIndex : 0 });
            }
        }
        const items = $dataItems.filter(item => item && item.name && !/^-{3,}/.test(item.name));   // (not the database's "-----" dividers)
        for (const item of items.sort((a, b) => isStock(a) - isStock(b))) rows.push({ tab: ITEMS_TAB, kind: "item", group: kindOf(item), item, qty: 1 });
        return rows;
    }

    // ---- the list: the rows of one tab
    function Window_DebugList(rect) {
        this.initialize(rect);
    }
    Window_DebugList.prototype = Object.create(Window_Selectable.prototype);
    Window_DebugList.prototype.constructor = Window_DebugList;

    Window_DebugList.prototype.initialize = function(rect) {
        // built before the base class's own initialize (below) is even called: Window_Selectable's constructor
        // already deactivates/reselects itself, which touches maxItems() and the row data right away
        this._all = allRows();
        this._tab = 0;
        this._rows = [];   // (the scene reads the tab it opens on: showTab -> setTab)
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
        this.select(0);
        this.activate();
    };

    // show the rows of tab `tab` (on the item tab: of kind `kind`), the cursor on row `index`
    Window_DebugList.prototype.setTab = function(tab, index, kind) {
        this._tab = tab;
        this._rows = this.rowsOf(tab, kind || 0);
        this.refresh();
        this.select(Math.max(0, Math.min(index || 0, this._rows.length - 1)));
        this.ensureCursorVisible(true);
    };

    // the rows of a tab, read as it opens (and again after each act that stays in the menu): the sections with their heads (layoutOf), each
    // changing label read again (fresh); the building tab is its static list, the item tab's first kind has the clothes' section on top
    Window_DebugList.prototype.rowsOf = function(tab, kind) {
        let rows;
        if (tab === BUILD_TAB) rows = this._all.filter(r => r.tab === tab);
        else if (tab === ITEMS_TAB) rows = (kind === 0 ? layoutOf(tab, this._all) : []).concat(this._all.filter(r => r.tab === tab && r.group === kind));
        else if (tab === STORY_TAB) rows = this.placeExtras(this.isleRows());
        else rows = layoutOf(tab, this._all);
        for (const r of rows) if (r.fresh) r.fresh(r);
        return rows;
    };

    // the last tab's sections (its old name: Przystan.js wraps this method to add the W10 row after the last of them)
    Window_DebugList.prototype.isleRows = function() {
        return layoutOf(STORY_TAB, this._all);
    };
    // what another plugin put after the sections (a row with no `sec`: Przystan.js's W10 head and row) goes in with the threads, before "Postacie"
    Window_DebugList.prototype.placeExtras = function(rows) {
        const extra = rows.filter(r => !r.sec);
        if (!extra.length) return rows;
        // (2026-11-12) in the order of the threads' numbers: before the first thread head numbered above it (W10 between W9 and W14)
        const num = r => { const m = /W(\d+)/.exec((r && r.label) || ""); return m ? +m[1] : null; };
        const own = rows.filter(r => r.sec), n = num(extra.find(r => r.head)), post = own.findIndex(r => r.head && r.sec === "postacie");
        let i = n === null ? -1 : own.findIndex(r => r.head && String(r.sec).indexOf("w:") === 0 && num(r) !== null && num(r) > n);
        if (i < 0) i = post;
        own.splice(i < 0 ? own.length : i, 0, ...extra);
        return own;
    };

    Window_DebugList.prototype.maxItems = function() {
        return this._rows.length;
    };
    // (the tabs with descriptions: two lines a row - the row and its description under it)
    Window_DebugList.prototype.itemHeight = function() {
        const h = Window_Selectable.prototype.itemHeight.call(this);
        return twoLines(this._tab) ? h + 22 : h;
    };

    // named rowData, not row: Window_Selectable already has its own row(index) (a scroll-position helper,
    // index / maxCols) that the engine calls internally - overwriting it crashed ensureCursorVisible
    Window_DebugList.prototype.rowData = function(index) {
        return this._rows[index >= 0 ? index : this.index()];
    };

    Window_DebugList.prototype.drawItem = function(index) {
        if (twoLines(this._tab)) return this.drawIsleItem(index);
        const row = this._rows[index], rect = this.itemLineRect(index);
        if (row.kind === "info") {   // (a head: text only)
            this.changeTextColor(row.head ? ColorManager.systemColor() : ColorManager.normalColor());
            this.drawText(row.label, rect.x, rect.y, rect.width, "left");
            this.resetTextColor();
            return;
        }
        this.drawIcon(row.icon || (row.item && row.item.iconIndex) || 0, rect.x, rect.y + 2);
        const textX = rect.x + ImageManager.iconWidth + 4;
        this.drawText(row.label || row.item.name, textX, rect.y, rect.width - ImageManager.iconWidth - 4, "left");
        if (row.kind === "item") {
            const label = "×" + row.qty, w = this.textWidth(label) + 6;
            this.drawText(label, rect.x + rect.width - w, rect.y, w, "right");
        }
    };

    // the row of a tab with descriptions: a header (the system colour), or the icon and the label with its description under it (smaller, grey)
    Window_DebugList.prototype.drawIsleItem = function(index) {
        const row = this._rows[index], rect = this.itemRect(index), pad = this.itemPadding(), x = rect.x + pad, w = rect.width - pad * 2;
        if (row.kind === "info") {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(row.label, x, rect.y + Math.floor((rect.height - this.lineHeight()) / 2), w, "left");
            this.resetTextColor();
            return;
        }
        const lone = !row.desc;   // (no line under it: the row is centred in its height)
        this.drawIcon(row.icon || 0, x, lone ? rect.y + Math.floor((rect.height - ImageManager.iconHeight) / 2) : rect.y + 4);
        const tx = x + ImageManager.iconWidth + 6, tw = w - ImageManager.iconWidth - 6;
        this.drawText(row.label, tx, lone ? rect.y + Math.floor((rect.height - this.lineHeight()) / 2) : rect.y, tw, "left");
        if (row.desc) {
            this.contents.fontSize = 16;
            this.changeTextColor("#a9a39a");
            this.drawText(row.desc, tx + 6, rect.y + 30, tw - 6, "left");
            this.resetFontSettings();
            this.resetTextColor();
        }
    };

    // left/right change the quantity of the highlighted item instead of moving the cursor
    Window_DebugList.prototype.cursorRight = function() {
        this.changeQty(1);
    };
    Window_DebugList.prototype.cursorLeft = function() {
        this.changeQty(-1);
    };
    Window_DebugList.prototype.changeQty = function(delta) {
        const row = this.rowData();
        if (row && (row.kind === "cr_kind" || row.kind === "cr_boss")) {   // (which creature / boss)
            const n = crKeys(row.kind).length || 1;
            row.pick = (row.pick + delta + n) % n;
            row.label = crLabel(row.kind, row.pick);
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.kind === "season") {   // (which season)
            row.pick = (row.pick + delta + 5) % 5;
            row.label = seasonLabel(row.pick);
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.kind === "isleInside") {   // (which room)
            row.pick = last.isle = (row.pick + delta + ISLE_INSIDE.length) % ISLE_INSIDE.length;
            row.label = isleLabel.inside(row.pick);
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.kind === "isleWater" && window.CzerwonaWoda && CzerwonaWoda.force) {   // (from the weather / red / grey)
            CzerwonaWoda.force(WATER[(WATER.indexOf(CzerwonaWoda.forced()) + delta + WATER.length) % WATER.length]);
            row.label = isleLabel.water();
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.kind === "isleTide") {   // (the tide: from the clock / low / high)
            cycleTide(delta);
            row.label = tideLabel();
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.watek && window.Watki && Watki.f9) {   // (a row of a thread of the engine - any tab: its chapter, floor, variant...)
            Watki.f9.wybierz(row, delta);
            for (let n = 0; n < 14 && chapterHidden(row); n++) Watki.f9.wybierz(row, delta || 1);
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.kind === "isleEagle" && row.pick !== undefined && window.Orzel && Orzel.f9Pick) {   // (the white eagle's stage: 1-5)
            Orzel.f9Pick(row, delta);
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.kind === "isleOkolice" && row.pick !== undefined && window.Okolice && Okolice.f9) {   // (a package's row with a choice)
            packagePick(row, delta);
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && row.kind === "isleFavor" && window.Garnizon && Garnizon.addFavor) {   // (the garrison's favour: 20 at a time)
            Garnizon.addFavor(delta * 20, "F9", true);
            row.label = isleLabel.favor();
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (!row || row.kind !== "item") return;
        row.qty = Math.max(1, Math.min(999, row.qty + delta));
        SoundManager.playCursor();
        this.redrawItem(this.index());
    };

    // ---- the scene: the key help, the tab band (on the item tab a second band of the kinds), the list; Q / E switch the tabs,
    // Tab or [ / ] the kinds, a click on either band too; F9/Esc close it
    function Scene_Debug() {
        this.initialize(...arguments);
    }
    Scene_Debug.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Debug.prototype.constructor = Scene_Debug;

    // a band of names, one of them marked (not active itself: the list keeps the keys)
    function band(rect, names) {
        const w = new Window_Command(rect);
        w.maxCols = () => names.length;
        w.makeCommandList = function() { names.forEach(n => this.addCommand(n, "tab")); };
        w.itemTextAlign = () => "center";
        w.refresh();
        w.deactivate();
        return w;
    }

    Scene_Debug.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const top = this.mainAreaTop(), helpH = this.calcWindowHeight(1, false), tabsH = this.calcWindowHeight(1, true);
        this._help = new Window_Base(new Rectangle(0, top, Graphics.boxWidth, helpH));
        this.addWindow(this._help);
        this._tabs = band(new Rectangle(0, top + helpH, Graphics.boxWidth, tabsH), TABS.map(t => t.name));
        this.addWindow(this._tabs);
        this._kinds = band(new Rectangle(0, top + helpH + tabsH, Graphics.boxWidth, tabsH), KINDS);
        this.addWindow(this._kinds);
        this._listTop = top + helpH + tabsH;   // (the list starts lower on the item tab, under the kinds)
        this._bandH = tabsH;
        this._list = new Window_DebugList(new Rectangle(0, this._listTop, Graphics.boxWidth, this.mainAreaHeight() - helpH - tabsH));
        this._list.setHandler("ok", this.onOk.bind(this));
        this._list.setHandler("cancel", this.popScene.bind(this));
        this._list.setHandler("pagedown", () => this.changeTab(1));
        this._list.setHandler("pageup", () => this.changeTab(-1));
        this.addWindow(this._list);
        this.showTab(last.tab);
    };

    Scene_Debug.prototype.showTab = function(tab) {
        this._tab = tab;
        last.tab = tab;
        this._tabs.select(tab);
        const items = tab === ITEMS_TAB, y = this._listTop + (items ? this._bandH : 0);
        this._kinds.visible = items;
        this._kinds.select(last.kind);
        if (this._list.y !== y) {
            this._list.move(0, y, Graphics.boxWidth, this._list.y + this._list.height - y);
            this._list.createContents();
        }
        this._list.setTab(tab, last.index[spot(tab, last.kind)], last.kind);
        this._list.activate();
        this.drawHelp(TABS[tab].help);
    };
    // the line over the tabs: the keys of the tab - and on the tabs of one-line rows the description of the row under the cursor (its small grey line)
    Scene_Debug.prototype.drawHelp = function(text, small) {
        this._helpText = text;
        this._help.contents.clear();
        this._help.contents.fontSize = small ? 16 : $gameSystem.mainFontSize();
        this._help.drawText(text, 0, 0, this._help.innerWidth, "center");
        this._help.resetFontSettings();
    };
    Scene_Debug.prototype.updateHelp = function() {
        const row = this._list.rowData(), desc = !twoLines(this._list._tab) && row && row.desc ? row.desc : "";
        const text = desc || TABS[this._list._tab].help;
        if (text !== this._helpText) this.drawHelp(text, !!desc);
    };
    // Przystan.js adds a row to the last tab as the scene is made (after the tab was first read): read it once more
    Scene_Debug.prototype.start = function() {
        Scene_MenuBase.prototype.start.call(this);
        if (this._tab === STORY_TAB) this._list.setTab(this._tab, this._list.index());
    };
    Scene_Debug.prototype.remember = function() {
        last.index[spot(this._tab, last.kind)] = this._list.index();
    };
    Scene_Debug.prototype.changeTab = function(dir) {
        this.goTo((this._tab + dir + TABS.length) % TABS.length, last.kind);
    };
    Scene_Debug.prototype.changeKind = function(dir) {
        this.goTo(ITEMS_TAB, (last.kind + dir + KINDS.length) % KINDS.length);
    };
    Scene_Debug.prototype.goTo = function(tab, kind) {
        this.remember();
        SoundManager.playCursor();
        last.kind = kind;
        this.showTab(tab);
    };

    Scene_Debug.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (Input.isTriggered("debugmenu")) return this.popScene();   // F9 closes it too
        this.updateHelp();
        if (this._tab === ITEMS_TAB && (Input.isTriggered("tab") || Input.isTriggered("keyRB"))) this.changeKind(1);
        else if (this._tab === ITEMS_TAB && Input.isTriggered("keyLB")) this.changeKind(-1);
        else if (TouchInput.isClicked()) {   // a click on a tab or on a kind
            const t = this._tabs.hitIndex(), k = this._kinds.visible ? this._kinds.hitIndex() : -1;
            if (t >= 0 && t !== this._tab) this.goTo(t, last.kind);
            else if (k >= 0 && k !== last.kind) this.goTo(ITEMS_TAB, k);
        }
    };
    Scene_Debug.prototype.terminate = function() {
        Scene_MenuBase.prototype.terminate.call(this);
        this.remember();   // open here again next time
    };

    Scene_Debug.prototype.onOk = function() {
        const row = this._list.rowData();
        if (row.watek && window.Watki && Watki.f9) {   // a row of a thread of the engine (any tab): its OK - then the labels read again
            if (this.onThreadOk(row)) return;     // (gone back to the map)
            if (twoLines(this._list._tab)) this._list.setTab(this._list._tab, this._list.index());   // (the list's own tab: a test may set it without the scene)
            else this._list.redrawItem(this._list.index());
        } else if (row.kind === "pelne") {   // the switch: on / off, its label read again
            pelne = !pelne;
            try { localStorage.setItem(PELNE_KEY, pelne ? "1" : "0"); } catch (e) {}
            row.label = pelneLabel();
            this._list.redrawItem(this._list.index());
            keepFull();
            $gameTemp.pushLootPopup(row.icon, TK.kod.pelne[pelne ? 2 : 3], "#9ff0a8");
        } else if (row.kind === "hour" || row.kind === "day") {
            $gameSystem.advanceDayNight(row.kind === "day" ? 24 : 1);
            $gameTemp.pushLootPopup(row.icon, row.label, "#9ff0a8");
        } else if (row.kind === "dawn" || row.kind === "dusk") {   // today's sunrise / sunset (the sun's height): back to the map to watch it
            const t = Sky.sunTimes($gameSystem.dayNightDay());
            $gameSystem.setDayNightHour(row.kind === "dawn" ? t.rise - 0.6 : t.set - 1);
            this.popScene();
        } else if (row.kind === "mist") {   // this morning's mist thick (past the morning: tomorrow's)
            const day = $gameSystem.dayNightDay(), t = Sky.sunTimes(day);
            Sky.forceMist(1, $gameSystem.dayNightHour() < t.rise + 2 ? day : day + 1);
            $gameTemp.pushLootPopup(row.icon, $gameSystem.dayNightHour() < t.rise + 2 ? TK.kod.onOk[0] : TK.kod.onOk[1], "#9ff0a8");
        } else if (row.kind === "storm" || row.kind === "calm") {
            if (row.kind === "storm") Survival.forceStorm(2);
            else Survival.calmWeather();
            this.popScene();   // back to the map to watch it
        } else if (row.kind === "birds" || row.kind === "raid") {
            this.popScene();   // started once the map is back (Birds.js needs its sprites)
            Birds.pending = row.kind;
        } else if (row.kind === "motyle" || row.kind === "cmy") {
            this.popScene();   // started once the map is back (Motyle.js needs its sprites and the fires on the screen)
            Motyle.pending = row.kind;
        } else if (row.kind === "siatka") {
            $gameParty.gainItem($dataItems[Motyle.ITEM.net], 1);
            $gameTemp.pushLootPopup(row.icon, TK.kod.onOk[2], "#9ff0a8");
        } else if (row.kind === "boar" || row.kind === "wolves" || row.kind === "deer" || row.kind === "bear") {
            this.popScene();   // spawned once the map is back
            Hunting.pending = row.kind;
        } else if (/^h_/.test(row.kind)) {   // Humans.js: spawned once the map is back
            this.popScene();
            Humans.pending = row.kind.slice(2);
        } else if (/^st_/.test(row.kind)) {   // Starcia.js: the beasts and the men, once the map is back
            this.popScene();
            Starcia.pending = row.kind.slice(3);
        } else if (row.kind === "cr_kind" || row.kind === "cr_boss") {   // Creatures.js: spawned once the map is back
            this.popScene();
            Creatures.pending = crKeys(row.kind)[row.pick];
        } else if (row.kind === "season") {   // the season shown on the map (back to the map to look; a map change redraws its pictures)
            applySeason(row.pick);
            $gameTemp.pushLootPopup(row.icon, row.label, "#9ff0a8");
            this.popScene();
            if ($gamePlayer && $gameMap.mapId()) $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 2);
        } else if (row.kind === "xp") {
            Combat.gainXp(200, "F9");
        } else if (row.kind === "layers") {   // the regions' colours on and off (the menu stays: the row says which)
            RegionLayers.overlay = !RegionLayers.overlay;
            row.label = layersLabel();
            this._list.redrawItem(this._list.index());
        } else if (row.kind === "build") {
            $gameTemp._debugBuild = row.type;   // the placer starts once the map is back
            this.popScene();
        } else if (row.kind === "strike" || row.kind === "treestrike") {
            // struck once the map runs again (Storm.js)
            if (window.Storm) Storm.pending.push(row.kind === "treestrike" ? { tree: true } : {});
            this.popScene();
        } else if (row.kind === "cat" || row.kind === "catChoose" || row.kind === "catPet") {   // the cat (HomeLife.js): back to the map to watch it
            if (row.kind === "cat") HomeLife.catGo(row.spot);
            else if (row.kind === "catChoose") HomeLife.catChoose();
            else HomeLife.pet();
            this.popScene();
        } else if (row.kind === "catHouse") {   // to grandpa's house, by the hearth
            $gamePlayer.reserveTransfer(HomeLife.MAP, 9, 7, 2, 0);
            this.popScene();
        } else if (row.kind === "info") {   // a head: the tab read again
            this._list.setTab(this._list._tab, this._list.index());
        } else if (/^isle/.test(row.kind)) {   // the rows of the story's kind (the places, the sea, the people, the packages)
            if (this.onIsleOk(row)) return;     // (gone back to the map)
            this._list.setTab(this._list._tab, this._list.index());   // (the labels read again)
        } else {
            $gameParty.gainItem(row.item, row.qty);
            $gameTemp.pushLootPopup(row.item.iconIndex, row.item.name + " ×" + row.qty, "#f3e0a0");
        }
        SoundManager.playOk();
        this._list.activate();
    };

    // a row of a thread of the engine (Watki.f9.ok - any tab): a place to go ({ go }), back to the map ({ back }), a popup ({ say,
    // bad }) or nothing ({} - the menu stays); true when the menu closed
    Scene_Debug.prototype.onThreadOk = function(row) {
        const r = Watki.f9.ok(row) || {};
        if (r.go && !$dataMapInfos[r.go[1]]) { $gameTemp.pushLootPopup(row.icon, Watki.wstaw(TK.kod.go[0], { "1": r.go[1] }), "#ffb4a0"); return false; }
        if (r.go) $gamePlayer.reserveTransfer(r.go[1], r.go[2], r.go[3], r.go[4], 0);
        if (r.go || r.back) { SoundManager.playOk(); this.popScene(); return true; }
        if (r.say) $gameTemp.pushLootPopup(row.icon, r.say, r.bad ? "#ffb4a0" : "#9ff0a8");
        return false;
    };

    // the OK of the "isle..." rows: true when the menu closed (back to the map), false when it stays
    Scene_Debug.prototype.onIsleOk = function(row) {
        const say = (icon, text, bad) => $gameTemp.pushLootPopup(icon, text, bad ? "#ffb4a0" : "#9ff0a8");
        const back = () => { SoundManager.playOk(); this.popScene(); return true; };
        const go = g => {
            if (!$dataMapInfos[g[1]]) { say(row.icon, Watki.wstaw(TK.kod.go[0], { "1": g[1] }), true); return false; }
            $gamePlayer.reserveTransfer(g[1], g[2], g[3], g[4], 0);
            return back();
        };
        if (row.watek && window.Watki && Watki.f9) return this.onThreadOk(row);   // (a thread of the engine - onOk sends it there itself)
        switch (row.kind) {
            case "isleGo": {
                return go(placeGo(ISLE_GO[row.go]));
            }
            case "isleInside": return go(placeGo(ISLE_INSIDE[row.pick]));
            case "isleMapa": {
                const on = MapaWyspy.revealAll(!MapaWyspy.revealAll());
                row.label = TK.kod.mapa[on ? 1 : 0];
                say(row.icon, TK.kod.mapa[on ? 2 : 3]);
                break;
            }
            case "isleTide":
                cycleTide(1);
                break;
            case "isleStorm": {   // (the storm's end: the driftwood of package A and the next piece of the wreck of package D, both)
                const rs = stormEnd();
                if (!rs.length) { say(row.icon, TK.kod.onIsleOk[16], true); break; }
                for (const r of rs) { const a = Okolice.f9.ok(r); if (a && a.say) say(row.icon, a.say, !!a.bad); }
                break;
            }
            case "isleFog": {
                const L = window.Latarnia, Q = window.TownQuests;
                if (!L || !L.nightNow || !window.Sky || !Sky.forceMist) { say(row.icon, TK.kod.onIsleOk[0], true); break; }
                if (L.nightNow() === null) $gameSystem.setDayNightHour(23);
                const nk = L.nightNow() === null ? $gameSystem.dayNightDay() : L.nightNow();
                Sky.forceMist(1, nk + 1);                                   // (the fog of the night = tomorrow's misty morning)
                if (Q && Q.start && !Q.isActive("D22") && !Q.isDone("D22")) Q.start("D22");
                if (L.state) L.state().visionNight = -99;                    // (a vision tonight, even if one was seen)
                return go(["Laterna", 161, 5, 7, 8]);
            }
            case "isleWater":
                if (window.CzerwonaWoda && CzerwonaWoda.force) CzerwonaWoda.force(WATER[(WATER.indexOf(CzerwonaWoda.forced()) + 1) % WATER.length]);
                break;
            case "isleLose": {
                if (!storyOn()) { say(row.icon, TK.kod.onIsleOk[1], true); break; }
                const s = Story.state();
                if (s.lost || s.done || s.paid >= s.debt || s.pending) { say(row.icon, s.lost ? TK.kod.onIsleOk[2] : TK.kod.onIsleOk[3], true); break; }
                s.off = false;                                              // (the deadline on, as in a real game)
                window.Tawerna.state("clock").day = s.deadline + 1;   // (DayNightCycle's clock; $gameSystem._dayNightDay before)
                $gameSystem.setDayNightHour((Story.DAWN || 6) + 0.05);
                return go([TK.kod.onIsleOk[4], Story.MAP && Story.MAP.field ? Story.MAP.field : 3, 22, 14, 2]);
            }
            case "islePay": {
                if (!storyOn()) { say(row.icon, TK.kod.onIsleOk[1], true); break; }
                const s = Story.state(), lost = !!s.lost;
                const n = lost ? (s.buy && s.buy.done ? 0 : Story.buyLeft()) : s.done ? 0 : Story.left();
                if (!(n > 0)) { say(row.icon, TK.kod.onIsleOk[5], true); break; }
                $gameParty.gainGold(n);
                const got = Story.pay(n);
                say(row.icon, Watki.wstaw(TK.kod.onIsleOk[8], { "1": (lost ? TK.kod.onIsleOk[6] : TK.kod.onIsleOk[7]) + got }));
                break;
            }
            case "isleGold":
                $gameParty.gainGold(1000);
                say(row.icon, "+1000 G");
                break;
            case "isleXp": {
                if (!window.Combat || !Combat.gainXp) { say(row.icon, TK.kod.onIsleOk[9], true); break; }
                const lv0 = Combat.hero().level, got = Combat.gainXp(10000, "F9");
                if (!got) { say(row.icon, TK.kod.onIsleOk[10], true); break; }
                const lv = Combat.hero().level;
                say(row.icon, Watki.wstaw(TK.kod.onIsleOk[12], { "1": lv > lv0 ? Watki.wstaw(TK.kod.onIsleOk[11], { lv0: lv0, lv: lv }) : "" }));
                break;
            }
            case "islePrologue":
                if (!window.Prologue || !Prologue.replay) { say(row.icon, TK.kod.onIsleOk[13], true); break; }
                $gameTemp._isleAct = "prologue";   // (pushed over the map once it is back: Debug's Scene_Map.update)
                return back();
            case "isleRaven":
                if (!window.Kruk || !Kruk.tameNow) { say(row.icon, TK.kod.onIsleOk[14], true); break; }
                if (Kruk.state().stage === "tame") { say(row.icon, TK.kod.onIsleOk[15], true); break; }
                $gameTemp._isleAct = "raven";
                return back();
            case "isleFavor":
                if (window.Garnizon && Garnizon.addFavor) Garnizon.addFavor(20, "F9", true);
                break;
            case "isleOkolice": {   // (the new terrain's packages: Okolice.f9.ok says what happened - "back", a place to go, a popup)
                if (!window.Okolice || !Okolice.f9) { say(row.icon, TK.kod.onIsleOk[16], true); break; }
                const r = Okolice.f9.ok(row);
                if (r && r.go) return go(r.go);
                if (r && r.back) return back();
                if (r && r.say) say(row.icon, r.say, !!r.bad);
                break;
            }
            case "isleEagle": {   // (the white eagle: Orzel.f9 says what happened - "back" to the map, a place to go, a popup)
                if (!window.Orzel || !Orzel.f9) { say(row.icon, TK.kod.onIsleOk[17], true); break; }
                const r = Orzel.f9(row);
                if (r && r.go) return go(r.go);
                if (r && r.back) return back();
                if (r && r.say) say(row.icon, r.say, !!r.bad);
                break;
            }
            case "isleTexts": {   // (the texts' files again: the label and a notice on the map say how it went)
                if (!window.Watki || !Watki.przeladuj) { say(row.icon, TK.kod.onIsleOk[25], true); break; }
                Watki.przeladuj(r => {
                    if (window.Tawerna) Tawerna.popup(r.text, { top: true, color: r.bad ? "#ff9f8f" : "#9ff0a8" });
                    const s = SceneManager._scene;
                    if (s instanceof Scene_Debug && s._list && twoLines(s._list._tab)) s._list.setTab(s._list._tab, s._list.index());
                });
                break;
            }
            case "isleCistern": {
                const q = window.TownQuests, f = q && q.state ? q.state().flags : null;
                if (!f) { say(row.icon, TK.kod.onIsleOk[26], true); break; }
                for (const k of ["cisternOpen", "sluiceHalf", "millRuns", "kubaHonest"]) if (!f[k]) f[k] = $gameSystem.dayNightDay();
                if (window.Cysterna && Cysterna.syncSwitches) Cysterna.syncSwitches();
                say(row.icon, TK.kod.onIsleOk[27]);
                break;
            }
        }
        return false;   // (onOk's own end: the OK sound, the list active again)
    };

    window.Scene_Debug = Scene_Debug;
})();
