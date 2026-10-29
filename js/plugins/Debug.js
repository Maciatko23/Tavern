/*:
 * @target MZ
 * @plugindesc Menu deweloperskie (F9) w sześciu zakładkach: zdarzenia (czas, pogoda, ptaki, dzik), budowanie (każda budowla za darmo), przedmioty (dowolna ilość; narzędzia i broń / surowce / jedzenie), rdzeń (stany, numery zdarzeń, zegary mapy - TawernaCore.js), kot Mruczek (co robi, każ mu) oraz wyspa i fabuła (przejścia do nowych miejsc, pływy, mgła, czerwona woda, strata działki, dług, prolog, kruk, garnizon, cysterna, wątki W4, W5, W7 i W9, wiersze paczek nowego terenu z Okolice.js). v1.11.0
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
 * Q / E przełączają zakładki (jak w dzienniku), góra / dół wybierają:
 *   1. Zdarzenia:
 *      - "+1 godzina" / "+1 dzień": przesuwa zegar gry (tak jak w Farming.js).
 *      - "Godzina: świt", "Godzina: zachód słońca": zegar na chwilę przed wschodem / godzinę przed zachodem
 *        (wraca na mapę); "Gęsta mgła o świcie": dzisiejszy (albo jutrzejszy) ranek mglisty (Sky.js).
 *      - "Burza teraz", "Piorun tuż obok", "Piorun w drzewo", "Koniec pogody na dziś": pogoda (Survival.js / Storm.js).
 *      - "Stadko ptaków na ziemi", "Nalot ptaków na pole": ptaki (Birds.js) - nalot tylko, gdy na mapie coś rośnie
 *        poza zasięgiem stracha na wróble.
 *      - "Dzik w pobliżu", "Wataha wilków (3)", "Jeleń w pobliżu", "Niedźwiedź w pobliżu" (Hunting.js), "+200 doświadczenia" (Combat.js).
 *      - "Podziemia: piętro N" (Underground.js): ←→ wybiera piętro 0-100 (z Shiftem o 10; 0 Ruiny Zamku, co 10. piętro
 *        zrobione ręcznie, 100 Komnata Serca), OK przenosi tam (przy schodach w górę, bez względu na kratę i bossów);
 *        "Podziemia: zejście z piwnicy" otwiera / zamyka kratę (przełącznik 11); "Podziemia: zamki Serca na próbę" -
 *        klucz, dzwon i pieśń znane bez questów W2-W4; "Podziemia: wszystkie przystanki windy" włącza windę na 10-90;
 *        "Serce: zakończenie / świat / Lord przy Sercu" - zakończenie zagrane w wybranym świecie.
 *      - "Akt III: uzbrój napad", "Akt III: napad na tawernę teraz", "Akt III: wyczyść stan napadu" (Act3.js).
 *      (Od 2026-10-29 wiersze podziemi i Aktu III daje silnik wątków Watki.js z danych wątków „podziemia” i „akt3” -
 *      Underground_Data.js / Act3_Data.js, f9: { zakladka: "zdarzenia" }; ten plik nie zna tych wtyczek.)
 *      - "Bandyta w pobliżu", "Nożownik w pobliżu", "Łucznik w pobliżu", "Najemnik w pobliżu", "Zasadzka (2 bandytów i łucznik)",
 *        "Obóz bandytów (noc)", "Napad na śpiącego (bandyci)" (Humans.js, etap 3 walki): ludzie-wrogowie kilka pól od bohatera;
 *        obóz 9-16 pól dalej (w dzień zegar idzie na 22:00); napad - grupa, która przyszłaby po śpiącego, od razu w walce.
 *      - "Wilki przy obozie bandytów (noc)", "Dzik i bandyta", "Niedźwiedź i bandyta" (Starcia.js): zwierzęta i ludzie walczą
 *        ze sobą kilka pól od bohatera - obóz z ogniskiem i wataha, która pod niego podchodzi (w dzień zegar idzie na 22:00);
 *        bandyta z dzikiem / niedźwiedziem, który go zauważył.
 *      - "Stwór z ruin: ..." i "Boss podziemi: ..." (Creatures.js, etap 4 walki): ←→ wybiera rodzaj / bossa, OK przywołuje go
 *        4-7 pól od bohatera (na piętrze 10 "Strażnik dziesiątej bramy" to walka ze strażnikiem przy bramie).
 *   2. Budowanie: "Postaw: ..." (każda budowla z Farming.js): wraca na mapę w zwykłym trybie stawiania (strzałki,
 *      R / Q / E odbija, OK stawia, Anuluj wraca), ale za darmo: bez materiałów, bez sił, bez placu budowy
 *      i młotka - budynek od razu stoi gotowy (zagroda od razu ze zwierzętami). Nie trzeba oczyszczać
 *      ziemi, ale nie stanie na wodzie, drzewie, skale ani na innym budynku. Płoty stawia się jeden po drugim.
 *   3. Przedmioty: wszystkie przedmioty w trzech podzakładkach - "Narzędzia i broń", "Surowce",
 *      "Jedzenie" (Tab albo [ / ] je przełączają, można też kliknąć); strzałki w lewo/prawo zmieniają
 *      ilość przy podświetlonej pozycji, OK dodaje ją do plecaka.
 *   4. Rdzeń: to, co trzyma TawernaCore.js (Tawerna.debug.lines()): czas zegarów mapy na klatkę,
 *      zapisane stany z wersjami, każdy zegar mapy z jego czasem (ms), numery wstawianych zdarzeń
 *      (czyj jest który zakres), co wstawiono na tej mapie, kto słucha szyny zdarzeń.
 *      Tylko do czytania: strzałki przewijają, OK czyta wszystko jeszcze raz.
 *   5. Kot: kot Mruczek z domu dziadka (HomeLife.js) - co robi teraz (śpi, idzie, siedzi, mruczy),
 *      gdzie jest, jak długo jeszcze i co ma dalej w planie; polecenia: idź spać przy palenisku,
 *      na dywan, wskocz na parapet, pospaceruj po izbie, usiądź u stóp dziadka (gdy dziadek siedzi
 *      w fotelu), idź spać na posłanie, niech sam wybierze, pogłaszcz (mruczy) - po wyborze menu
 *      wraca na mapę, żeby popatrzeć. Poza domem dziadka: "Zabierz mnie do domu dziadka".
 *      Na dole: jego dzień (co robi o jakiej porze). OK na opisie czyta wszystko jeszcze raz.
 *   6. Wyspa i fabuła (sześć miejsc Kruczej Wyspy, docs/miejsca_wyspy/, i wielkie chwile fabuły). Każdy
 *      wiersz ma pod sobą krótki opis (szary). Wiersze:
 *      Przenieś mnie do:
 *      - "Przystań", "Pustelnia na klifie", "Urwisko Kruków", "Przylądek z latarnią", "Garnizon nad zatoką",
 *        "Wrak na mieliźnie", "Stara cysterna zakonu", "Chata pod lasem", "Spalona zagroda": przenosi na pole,
 *        na którym ląduje się zwykłym przejściem (zawsze da się na nim stać). Wrak ustawia też odpływ (łacha sucha).
 *      - "Wnętrze: ..." - ←→ wybiera wnętrze (skryptorium, izba latarnika, laterna, kwatera rotmistrza, wrak pod
 *        pokładem, izba chaty pod lasem, Dom Ługów, piwnica kantoru), OK przenosi tam, przy drzwiach.
 *      Morze i pogoda:
 *      - "Odpływ teraz" / "Przypływ teraz": pływ wymuszony od razu (Wyspa.forceTide; przełącznik 20 idzie za nim);
 *        drugi raz OK na tym samym wierszu: pływy znowu z zegara. Nie zapisuje się w zapisie gry.
 *      - "Mglista noc na przylądku": noc (23:00, jeśli jest dzień), mgła morska tej nocy (jutrzejszy ranek mglisty),
 *        D22 „Księga mgieł” zaczęte, jeśli jeszcze nie było; przenosi do laterny - OK przy soczewce pokazuje wizję.
 *      - "Woda w morzu": ←→ albo OK - z pogody / czerwona / szara (CzerwonaWoda.force; nie zapisuje się).
 *      Fabuła:
 *      - "Świt dnia 61 bez spłaty": zegar na świt dnia po terminie, bohater na działce dziadka - działka przechodzi na
 *        Lorda, scena ludzi dworu (Story.js); tylko w grze z fabułą, gdy dług nie jest spłacony.
 *      - "Spłać dług" (po stracie działki: "Odkup działkę"): dodaje brakujące złoto i od razu je płaci.
 *      - "+1000 G".
 *      - "+10 000 doświadczenia": Combat.gainXp(10000) - poziomy i punkty jak za zwykłe zdobycie.
 *      - "Odtwórz prolog": sam film „Ostatni prom” (bez ekranu imienia), potem powrót na mapę, na to samo
 *        miejsce - stan gry bez zmian, muzyka mapy wraca.
 *      Postacie:
 *      - "Oswojony kruk od razu": kruk z Urwiska oswojony (obrączka, flagi krukTame i kronikaKarta6), potem
 *        ekran imienia (puste pole = "Kruk"); klawisz K otwiera jego menu.
 *      - "Przychylność garnizonu: N / 100": ← -20, → +20 (OK też +20); progi 40 / 60 / 80 działają jak w grze.
 *      - "Otwórz cysternę": to, co daje dzwon „cztery i dwa” (W1 rozdz. 7): flagi cisternOpen, sluiceHalf,
 *        millRuns, kubaHonest - zasuwa na piętrze 30 prowadzi do starej cysterny, D28 może się zacząć.
 *      Wątek W4 (Borgar, krew kasztelana - Kasztelan.js):
 *      - "W4: rozdział N - ...": ←→ wybiera rozdział 1-8 wątku „Krew kasztelana” (rozdział 7 dwa razy:
 *        konfrontacja przy barze i noc w piwnicy), OK ustawia go (dług, klucze, krata, poszlaki, flagi, pora)
 *        i przenosi tam, gdzie się dzieje. Rozdział 8: Borgar idzie z bohaterem - nocą jego ognisko przy
 *        dziesiątej bramie. (Od 2026-10-23 ten wiersz daje silnik wątków Watki.js z danych wątku -
 *        Kasztelan_Data.js; tak samo każdy wątek silnika ze skokami: Watki.f9.)
 *      Wątek W5 (kantor Baltazara):
 *      - "W5: rozdział N - ...": ←→ wybiera rozdział 1-7 wątku „Towary z kontynentu”, OK ustawia go (flagi
 *        rozdziałów wcześniejszych, pora dnia) i przenosi tam, gdzie się dzieje (skoki z Kantor_Data.js).
 *      Wątek W7 (dwór Lorda, Dwor.js):
 *      - "W7: rozdział N - ...": ←→ wybiera rozdział 1-7 wątku „Dwór z kamieni twierdzy”, OK ustawia go (spłaty, flagi
 *        rozdziałów wcześniejszych, pora dnia) i przenosi tam, gdzie się dzieje (skoki z Dwor_Data.js). Wnętrza dworu (hol,
 *        biblioteka, gabinet) są też w wierszu „Wnętrze”.
 *      Wątek W9 (rywal w ruinach, Rywal.js):
 *      - "W9: rywal (wymuś wariant): ...": ←→ z gry / ludzie Baltazara / Grum z najemnikami / ludzie Lorda /
 *        kopacze Czarnych Oczu; OK: krata otwarta, rywal już w drodze (piętro 3), bohater w Ruinach Zamku.
 *      - "W9: rywal - spotkanie na piętrze N": ←→ piętro 1-10, OK: rywal (wariant z wiersza wyżej) czeka na tym
 *        piętrze, bohater na jego schodach w górę (Rywal.debugMeet).
 *      (Od 2026-10-29 sekcje W5, W7 i W9 też daje silnik wątków - f9 w danych wątków „kantor”, „dwor”, „rywal”.)
 * F9 otwiera się na tej zakładce (i podzakładce) i pozycji, na których ostatnio był. Esc (albo F9) zamyka.
 * Zakładki i podzakładki można też klikać myszą.
 * Tylko do testowania - przed wydaniem gry ustaw parametr "Włączone" na false.
 */
(() => {
    "use strict";
    const TK = Watki.teksty("f9");   // (the words of this file: js/teksty/f9.txt, kod.*)

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
        // the island tab's acts that need the map (the raven's name screen, the prologue's film): once the map is back and calm
        if ($gameTemp._isleAct && scene === SceneManager._scene && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() &&
            !$gameMessage.isBusy() && !$gameMap.isEventRunning()) {
            const what = $gameTemp._isleAct;
            $gameTemp._isleAct = null;
            if (what === "raven" && window.Kruk && Kruk.tameNow) Kruk.tameNow();
            else if (what === "prologue" && window.Prologue && Prologue.replay) Prologue.replay();
        }
    }, { owner: "Debug", name: "f9", priority: -100 });

    // the tabs: their names and the key help shown over the list (js/teksty/f9.txt, zakladki.<n>.name / .help)
    const TABS = Watki.scal([{}, {}, {}, {}, {}, {}], "f9", "zakladki");
    const ITEMS_TAB = 2, CORE_TAB = 3, CAT_TAB = 4, ISLE_TAB = 5;
    // ---- the island tab ("Wyspa i fabuła", 2026-10-16 - the user's decision): the six island places and the story's big moments at
    // once. Where to go: { id, map, x, y, d (facing), low (the low tide set) } - each the landing tile of the place's own way in
    // (always walkable); its name (nazwa) and the line under it (opis): js/teksty/f9.txt, wyspa.miejsca.<id>
    // (2026-10-18: the outdoor maps doubled - tools/powieksz: the landings by their east / south edges moved with them)
    const ISLE_GO = [
        { id: "przystan", map: 125, x: 110, y: 19, d: 4 },
        { id: "pustelnia", map: 155, x: 24, y: 70, d: 8 },
        { id: "urwisko", map: 157, x: 1, y: 19, d: 6 },
        { id: "latarnia", map: 159, x: 30, y: 78, d: 8 },
        { id: "garnizon", map: 162, x: 22, y: 1, d: 2 },
        { id: "wrak", map: 165, x: 78, y: 20, d: 4, low: true },
        { id: "cysterna", map: 167, x: 3, y: 20, d: 6 },
        { id: "chata", map: 111, x: 8, y: 81, d: 2 },
        { id: "zagroda", map: 168, x: 98, y: 12, d: 4 }
    ];
    Watki.scal(ISLE_GO, "f9", "wyspa.miejsca", "id");
    // the rooms inside ("Wnętrze": ←→): { id, map, x, y, d } - the names: js/teksty/f9.txt, wyspa.wnetrza.<id>.nazwa
    const ISLE_INSIDE = [
        { id: "skryptorium", map: 156, x: 6, y: 8, d: 8 }, { id: "izbaLatarnika", map: 160, x: 6, y: 8, d: 8 },
        { id: "laterna", map: 161, x: 5, y: 7, d: 8 }, { id: "kwatera", map: 163, x: 6, y: 8, d: 8 },
        { id: "wrak", map: 166, x: 4, y: 11, d: 8 }, { id: "chata", map: 154, x: 4, y: 8, d: 8 },
        { id: "domLugow", map: 169, x: 6, y: 8, d: 8 }, { id: "piwnicaKantoru", map: 171, x: 2, y: 4, d: 2 },
        // (2026-10-17) W7: the manor's rooms (Dwor.js, maps 172-174)
        { id: "dworHol", map: 172, x: 11, y: 13, d: 8 }, { id: "dworBiblioteka", map: 173, x: 8, y: 10, d: 8 },
        { id: "dworGabinet", map: 174, x: 7, y: 9, d: 8 }];
    Watki.scal(ISLE_INSIDE, "f9", "wyspa.wnetrza", "id");
    const placeGo = p => [p.nazwa, p.map, p.x, p.y, p.d];   // (as go() takes it: [name, map, x, y, facing])
    const WATER = [null, "red", "grey"], WATER_NAME = Watki.scal({}, "f9", "wyspa.woda");   // (the sea's colour forced: its word by the key)
    const isleIcon = id => ($dataItems[id] ? $dataItems[id].iconIndex : 0);
    const storyOn = () => !!(window.Story && Story.active && Story.active());
    // (2026-10-17) W4 "Krew kasztelana", W5 "Towary z kontynentu", W7 "Dwór z kamieni twierdzy", W9 ch. 3 "Rywal w ruinach": straight
    // to a chapter / the rival forced - since 2026-10-23 (W4) and 2026-10-29 (W5, W7, W9) the rows of the thread engine (Watki.f9: the
    // jumps and the rows in the threads' data - Kasztelan_Data, Kantor_Data, Dwor_Data, Rywal_Data); this file knows none of them
    const isleLabel = {
        inside: i => Watki.wstaw(TK.kod.inside[0], { nazwa: ISLE_INSIDE[i].nazwa }),
        tide: kind => {
            const W = window.Wyspa, name = kind === "low" ? TK.kod.tide[0] : TK.kod.tide[1];
            if (!W || !W.forceTide) return Watki.wstaw(TK.kod.tide[2], { name: name });
            const f = W.tideForced();
            if (f === kind) return Watki.wstaw(TK.kod.tide[3], { name: name });
            return Watki.wstaw(TK.kod.tide[7], { name: name, "2": f ? "" : Watki.wstaw(TK.kod.tide[6], { "1": W.tide().low ? TK.kod.tide[4] : TK.kod.tide[5] }) });
        },
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
    // ---- the cat tab (HomeLife.js's Mruczek): what it does now, where, for how long, what is next; its doings to send it to
    // (id: HomeLife's spot; rozkaz: the row that sends it there, gdzie: where it is - js/teksty/f9.txt, kot.miejsca.<id>)
    const CAT_SPOTS = Watki.scal([{ id: "hearth" }, { id: "rug" }, { id: "sill" }, { id: "stroll" }, { id: "feet" }, { id: "heroBed" }], "f9", "kot.miejsca", "id");
    // what it is doing (HomeLife's steps: go, face, look...) and its day, as the tab tells them: js/teksty/f9.txt, kot.kroki / kot.dzien
    const CAT_STEP = Watki.scal({}, "f9", "kot.kroki"), CAT_DAY = Watki.scal([], "f9", "kot.dzien");
    function catDoing(st) {
        if (st.purr > 0) return TK.kod.catDoing[0];
        const spot = (CAT_SPOTS.find(r => r.id === st.spot) || {}).gdzie || "";
        if (st.cur === "go" || st.moving) return "idzie" + (spot ? " - " + (st.spot === "stroll" ? TK.kod.catDoing[1] : spot) : "");   // (the stroll's own words here)
        if (st.pose === "sleep") return Watki.wstaw(TK.kod.catDoing[2], { spot: spot });
        if (st.pose === "curl") return Watki.wstaw(TK.kod.catDoing[3], { spot: spot });
        if (st.pose === "uncurl") return TK.kod.catDoing[4];
        if (st.cur === "stayFeet") return TK.kod.catDoing[5];
        if (!st.perch && st.steps.includes("hop") && (st.spot === "sill" || st.spot === "heroBed"))   // (on the floor under it, before the jump)
            return st.spot === "sill" ? TK.kod.catDoing[6] : TK.kod.catDoing[7];
        if (st.pose === "sit") return Watki.wstaw(TK.kod.catDoing[8], { spot: spot });
        return (CAT_STEP[st.cur] || "stoi") + (spot ? " " + spot : "");
    }
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
    // (2026-10-29) the sections of the thread engine (Watki.f9.sekcje()) on a tab: "zdarzenia" (this first tab - the rows only: the
    // underground's, Act III's) or "wyspa" (the island tab - a header and the rows); a row keeps every field the thread gave it
    const threadSections = tab => (window.Watki && Watki.f9 ? Watki.f9.sekcje().filter(s => (s.zakladka || "wyspa") === tab) : []);
    // Creatures.js (combat stage 4): a creature of the ruins / a boss of the underground a few tiles away; ←→ choose which
    const crKeys = kind => (window.Creatures ? Object.keys(kind === "cr_boss" ? Creatures.BOSSES : Creatures.KINDS) : []);
    const crLabel = (kind, i) => {
        const key = crKeys(kind)[i] || "";
        if (kind === "cr_boss") { const b = Creatures.BOSSES[key] || {}; return Watki.wstaw(TK.kod.crLabel[0], { name: b.name, floor: b.floor }); }
        const k = Creatures.KINDS[key] || {};
        return Watki.wstaw(TK.kod.crLabel[2], { "1": k.plural ? Watki.wstaw(TK.kod.crLabel[1], { plural: k.plural }) : k.name });
    };
    // every row of the menu, each with its tab: 0 the events, 1 the buildings, 2 the items
    function allRows() {
        const rows = [
            { tab: 0, kind: "hour", label: TK.kod.allRows[0], icon: 240 },
            { tab: 0, kind: "day", label: TK.kod.allRows[1], icon: 241 }
        ];
        if (window.Sky && Sky.sunTimes) {   // the sky (Sky.js): jump to the dawn or the sunset, a misty morning
            rows.push({ tab: 0, kind: "dawn", label: TK.kod.allRows[2], icon: 240 },
                { tab: 0, kind: "dusk", label: TK.kod.allRows[3], icon: 240 },
                { tab: 0, kind: "mist", label: TK.kod.allRows[4], icon: 70 });
        }
        if (window.Survival && Survival.forceStorm) {   // the weather (Survival.js plans it, Storm.js shows it)
            rows.push({ tab: 0, kind: "storm", label: TK.kod.allRows[5], icon: 66 },
                { tab: 0, kind: "strike", label: TK.kod.allRows[6], icon: 66 },
                { tab: 0, kind: "treestrike", label: TK.kod.allRows[7], icon: 66 },
                { tab: 0, kind: "calm", label: TK.kod.allRows[8], icon: 70 });
        }
        if (window.Birds) {   // the birds (Birds.js): a flock landing near the player, a raid on the sown fields
            rows.push({ tab: 0, kind: "birds", label: TK.kod.allRows[9], icon: 407 },
                { tab: 0, kind: "raid", label: TK.kod.allRows[10], icon: 408 });
        }
        if (window.Motyle) {   // the butterflies (Motyle.js): a summer meadow after rain here and now (a peacock too), moths at a fire at night, the net
            rows.push({ tab: 0, kind: "motyle", label: TK.kod.allRows[11], icon: Motyle.ICON.butterfly },
                { tab: 0, kind: "cmy", label: TK.kod.allRows[12], icon: Motyle.ICON.butterfly },
                { tab: 0, kind: "siatka", label: TK.kod.allRows[13], icon: Motyle.ICON.net });
        }
        if (window.Hunting && Hunting.SPECIES.boar) rows.push({ tab: 0, kind: "boar", label: TK.kod.allRows[14], icon: 416 });   // Hunting.js: one boar a few tiles away
        if (window.Hunting && Hunting.SPECIES.wolf) rows.push({ tab: 0, kind: "wolves", label: TK.kod.allRows[15], icon: 416 });   // Hunting.js: a pack a few tiles away
        if (window.Hunting && Hunting.SPECIES.deer) rows.push({ tab: 0, kind: "deer", label: TK.kod.allRows[16], icon: 420 });   // Hunting.js: a deer a few tiles away (any hour)
        if (window.Hunting && Hunting.SPECIES.bear) rows.push({ tab: 0, kind: "bear", label: TK.kod.allRows[17], icon: $dataItems[170] ? $dataItems[170].iconIndex : 416 });   // Hunting.js: a bear 7-10 tiles away (any hour)
        if (window.Humans) {   // Humans.js (combat stage 3): men a few tiles away, an ambush, a camp at night
            rows.push({ tab: 0, kind: "h_bandit", label: TK.kod.allRows[18], icon: $dataItems[156] ? $dataItems[156].iconIndex : 418 },
                { tab: 0, kind: "h_knifer", label: TK.kod.allRows[19], icon: $dataItems[91] ? $dataItems[91].iconIndex : 347 },
                { tab: 0, kind: "h_archer", label: TK.kod.allRows[20], icon: $dataItems[126] ? $dataItems[126].iconIndex : 386 },
                { tab: 0, kind: "h_mercenary", label: TK.kod.allRows[21], icon: $dataItems[155] ? $dataItems[155].iconIndex : 417 },
                { tab: 0, kind: "h_ambush", label: TK.kod.allRows[22], icon: 76 },
                { tab: 0, kind: "h_camp", label: TK.kod.allRows[23], icon: 64 },
                { tab: 0, kind: "h_raid", label: TK.kod.allRows[24], icon: 64 });
        }
        if (window.Starcia && window.Humans && window.Hunting) {   // Starcia.js: the beasts and the men fight each other (watch it from aside)
            rows.push({ tab: 0, kind: "st_camp", label: TK.kod.allRows[25], icon: 416 },
                { tab: 0, kind: "st_boar", label: TK.kod.allRows[26], icon: 416 },
                { tab: 0, kind: "st_bear", label: TK.kod.allRows[27], icon: $dataItems[170] ? $dataItems[170].iconIndex : 416 });
        }
        if (window.Creatures) rows.push({ tab: 0, kind: "cr_kind", pick: 0, label: crLabel("cr_kind", 0), icon: 189 },   // Creatures.js: one of the 8 kinds
            { tab: 0, kind: "cr_boss", pick: 0, label: crLabel("cr_boss", 0), icon: 189 });   // a boss (the guardian, floors 20-90)
        if (window.Combat) rows.push({ tab: 0, kind: "xp", label: TK.kod.allRows[28], icon: 87 });   // Combat.js: to try the levels
        if (window.RegionLayers) rows.push({ tab: 0, kind: "layers", label: layersLabel(), icon: 190 });   // RegionLayers.js: the painted regions 1-3 in colour over the map
        // the threads' rows of this tab (Watki.f9, zakladka "zdarzenia"): the underground (a floor, the grate, the locks, the lift, the
        // Heart's endings - Underground_Data.js), Act III (arm, now, clear - Act3_Data.js); ←→ and OK go to the engine (row.watek)
        for (const sec of threadSections("zdarzenia")) for (const r of sec.rows) rows.push(Object.assign({}, r, { tab: 0 }));
        if (window.Farming && Farming.startFreePlacement) {   // every building of Farming.js, put down free and finished
            for (const [type, def] of Object.entries(Farming.BUILDINGS)) {
                const iconItem = Farming.itemOf(def.pack || def.cost[0][0]);
                rows.push({ tab: 1, kind: "build", type, label: Watki.wstaw(TK.kod.allRows[29], { name: def.name }), icon: iconItem ? iconItem.iconIndex : 0 });
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
        this._rows = this._all.filter(r => r.tab === 0);
        Window_Selectable.prototype.initialize.call(this, rect);
        this.refresh();
        this.select(0);
        this.activate();
    };

    // show the rows of tab `tab` (on the item tab: of kind `kind`), the cursor on row `index`
    Window_DebugList.prototype.setTab = function(tab, index, kind) {
        this._tab = tab;
        this._rows = tab === CORE_TAB ? this.coreRows() : tab === CAT_TAB ? this.catRows() : tab === ISLE_TAB ? this.isleRows()
            : this._all.filter(r => r.tab === tab && (tab !== ITEMS_TAB || r.group === kind));
        this.refresh();
        this.select(Math.max(0, Math.min(index || 0, this._rows.length - 1)));
        this.ensureCursorVisible(true);
    };

    // the core tab: Tawerna.debug.lines() (TawernaCore.js), read as the tab opens; a line too wide for the list is cut at ", "
    // (the rest indented under it); the section lines ("Stany:", "Zegary mapy:"...) are the ones not indented
    Window_DebugList.prototype.coreRows = function() {
        const T = window.Tawerna, rows = [], width = this.innerWidth - this.itemPadding() * 2;
        const lines = T && T.debug ? T.debug.lines() : [TK.kod.coreRows[0]];
        for (const text of lines) {
            const indent = /^\s*/.exec(text)[0] + "    ";
            let row = "";
            for (const part of String(text).split(/(?<=, )/)) {
                if (row.trim() && this.textWidth(row + part) > width) { rows.push(row.replace(/\s+$/, "")); row = indent + part; }
                else row += part;
            }
            rows.push(row);
        }
        return rows.map(label => ({ tab: CORE_TAB, kind: "info", label, head: !/^\s/.test(label) }));
    };

    // the cat tab: read as the tab opens (and again with OK on a line of text)
    Window_DebugList.prototype.catRows = function() {
        const H = window.HomeLife, rows = [], info = (label, head) => rows.push({ tab: CAT_TAB, kind: "info", label, head: !!head });
        if (!H || !H.catState) { info(TK.kod.catRows[0], true); return rows; }
        const st = H.catState(), icon = 0;   // (no icon of its own in the icon set)
        info(TK.kod.catRows[1], true);
        if (!st) {
            info(Watki.wstaw(TK.kod.catRows[2], { MAP: H.MAP }));
            rows.push({ tab: CAT_TAB, kind: "catHouse", label: TK.kod.catRows[3], icon });
        } else {
            info(Watki.wstaw(TK.kod.catRows[4], { "1": catDoing(st) }));
            info(Watki.wstaw(TK.kod.catRows[6], { x: st.x, y: st.y, "3": st.target && (st.target[0] !== st.x || st.target[1] !== st.y) ? Watki.wstaw(TK.kod.catRows[5], { "1": st.target[0], "2": st.target[1] }) : "" }));
            if (st.left > 0) info(Watki.wstaw(TK.kod.catRows[8], { left: st.left, "2": !st.cur && !st.steps.length ? TK.kod.catRows[7] : "" }));
            if (st.steps.length) info(Watki.wstaw(TK.kod.catRows[9], { "1": st.steps.map(t => CAT_STEP[t] || t).join(", ") }));
            info(TK.kod.catRows[10], true);
            const can = H.catSpots();
            for (const { id: spot, rozkaz: label } of CAT_SPOTS) {
                if (can.includes(spot)) rows.push({ tab: CAT_TAB, kind: "cat", spot, label, icon });
                else if (spot === "feet") info(TK.kod.catRows[11]);
            }
            rows.push({ tab: CAT_TAB, kind: "catChoose", label: TK.kod.catRows[12], icon },
                { tab: CAT_TAB, kind: "catPet", label: TK.kod.catRows[13], icon: 82 });
        }
        info(TK.kod.catRows[14], true);
        for (const line of CAT_DAY) info("  " + line);
        return rows;
    };

    // the island tab: read as the tab opens (and after each act that stays in the menu); headers, then the rows, each with its line
    // under it (desc)
    Window_DebugList.prototype.isleRows = function() {
        const rows = [], head = label => rows.push({ tab: ISLE_TAB, kind: "info", label, head: true });
        const row = (kind, label, icon, desc, more) => rows.push(Object.assign({ tab: ISLE_TAB, kind, label, icon, desc }, more || {}));
        head(TK.kod.isleRows[0]);
        ISLE_GO.forEach((g, i) => row("isleGo", g.nazwa, 190, g.opis, { go: i }));
        row("isleInside", isleLabel.inside(last.isle || 0), 189, TK.kod.isleRows[1], { pick: last.isle || 0 });
        head(TK.kod.isleRows[2]);
        row("isleTide", isleLabel.tide("low"), 70, TK.kod.isleRows[3], { tide: "low" });
        row("isleTide", isleLabel.tide("high"), 70, TK.kod.isleRows[4], { tide: "high" });
        row("isleFog", TK.kod.isleRows[5], 70, TK.kod.isleRows[6]);
        row("isleWater", isleLabel.water(), isleIcon(173) || 70, TK.kod.isleRows[7]);
        head(TK.kod.isleRows[8]);
        row("isleLose", isleLabel.lose(), 241, TK.kod.isleRows[9]);
        row("islePay", isleLabel.pay(), 314, TK.kod.isleRows[10]);
        row("isleGold", "+1000 G", 314, TK.kod.isleRows[11]);
        row("isleXp", TK.kod.isleRows[12], 87, TK.kod.isleRows[13]);
        row("islePrologue", TK.kod.isleRows[14], isleIcon(172) || 87, TK.kod.isleRows[15]);
        row("isleTexts", isleLabel.texts(), 189, TK.kod.isleRows[16]);
        head("Postacie:");
        row("isleRaven", isleLabel.raven(), isleIcon(179) || 87, TK.kod.isleRows[17]);
        row("isleFavor", isleLabel.favor(), isleIcon(155) || 87, TK.kod.isleRows[18]);
        row("isleCistern", isleLabel.cistern(), 391, TK.kod.isleRows[19]);
        // (2026-10-18) the white eagle (Orzel.js): its rows come from the plugin - Orzel.f9Rows() / f9Pick(row, delta) / f9(row)
        if (window.Orzel && Orzel.f9Rows) {
            head(TK.kod.isleRows[20]);
            for (const r of Orzel.f9Rows()) row("isleEagle", r.label, r.icon, r.desc, { what: r.what, pick: r.pick });
        }
        // (2026-10-23) the threads of the engine (Watki.js) with chapter jumps or rows of their own in their data - the ferry's
        // travellers, W15, W16, W4, W5, W7, W9...: each its header and its rows (Watki.f9.sekcje() / wybierz(row, delta) / ok(row)); a
        // thread's data registers them, never this file
        for (const sec of threadSections("wyspa")) {
            head(sec.head);
            for (const r of sec.rows) rows.push(Object.assign({}, r, { tab: ISLE_TAB, desc: r.desc || "" }));
        }
        // (2026-10-21) the new terrain's packages (docs/rozszerzenia/PLAN.md): their rows come from Okolice.f9 - sections() / pick(row, delta)
        // / ok(row); a package registers them with Okolice.f9.add({ owner, title, rows, pick, ok }) and never edits this file
        if (window.Okolice && Okolice.f9 && Okolice.f9.sections) {
            for (const sec of Okolice.f9.sections()) {
                head(sec.title);
                for (const r of sec.rows) row("isleOkolice", r.label, r.icon, r.desc, { owner: sec.owner, what: r.what, pick: r.pick });
            }
        }
        return rows;
    };

    Window_DebugList.prototype.maxItems = function() {
        return this._rows.length;
    };
    // (the island tab: two lines a row - the row and its description under it)
    Window_DebugList.prototype.itemHeight = function() {
        const h = Window_Selectable.prototype.itemHeight.call(this);
        return this._tab === ISLE_TAB ? h + 22 : h;
    };

    // named rowData, not row: Window_Selectable already has its own row(index) (a scroll-position helper,
    // index / maxCols) that the engine calls internally - overwriting it crashed ensureCursorVisible
    Window_DebugList.prototype.rowData = function(index) {
        return this._rows[index >= 0 ? index : this.index()];
    };

    Window_DebugList.prototype.drawItem = function(index) {
        if (this._tab === ISLE_TAB) return this.drawIsleItem(index);
        const row = this._rows[index], rect = this.itemLineRect(index);
        if (row.kind === "info") {   // (the core tab: text only)
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

    // the island tab's row: a header (the system colour), or the icon and the label with its description under it (smaller, grey)
    Window_DebugList.prototype.drawIsleItem = function(index) {
        const row = this._rows[index], rect = this.itemRect(index), pad = this.itemPadding(), x = rect.x + pad, w = rect.width - pad * 2;
        if (row.kind === "info") {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(row.label, x, rect.y + Math.floor((rect.height - this.lineHeight()) / 2), w, "left");
            this.resetTextColor();
            return;
        }
        this.drawIcon(row.icon || 0, x, rect.y + 4);
        const tx = x + ImageManager.iconWidth + 6, tw = w - ImageManager.iconWidth - 6;
        this.drawText(row.label, tx, rect.y, tw, "left");
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
        if (row && row.watek && window.Watki && Watki.f9) {   // (a row of a thread of the engine - any tab: its chapter, floor, variant...)
            Watki.f9.wybierz(row, delta);
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
            Okolice.f9.pick(row, delta);
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
        this._help.contents.clear();
        this._help.drawText(TABS[tab].help, 0, 0, this._help.innerWidth, "center");
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
            if (this._tab === ISLE_TAB) this._list.setTab(this._tab, this._list.index());
            else this._list.redrawItem(this._list.index());
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
        } else if (row.kind === "info") {   // the core tab and the cat tab: read again
            this._list.setTab(this._tab, this._list.index());
        } else if (/^isle/.test(row.kind)) {   // the island tab
            if (this.onIsleOk(row)) return;     // (gone back to the map)
            this._list.setTab(this._tab, this._list.index());   // (the labels read again)
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

    // the island tab's OK: true when the menu closed (back to the map), false when it stays
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
                const g = ISLE_GO[row.go];
                if (g.low && window.Wyspa && Wyspa.forceTide) Wyspa.forceTide("low");
                return go(placeGo(g));
            }
            case "isleInside": return go(placeGo(ISLE_INSIDE[row.pick]));
            case "isleTide":
                if (window.Wyspa && Wyspa.forceTide) Wyspa.forceTide(Wyspa.tideForced() === row.tide ? null : row.tide);
                break;
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
                    if (s instanceof Scene_Debug && s._list && s._tab === ISLE_TAB) s._list.setTab(s._tab, s._list.index());
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
