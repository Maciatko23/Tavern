/*:
 * @target MZ
 * @plugindesc Menu deweloperskie (F9) w pięciu zakładkach: zdarzenia (czas, pogoda, ptaki, dzik), budowanie (każda budowla za darmo), przedmioty (dowolna ilość; narzędzia i broń / surowce / jedzenie), rdzeń (stany, numery zdarzeń, zegary mapy - TawernaCore.js) i kot Mruczek (co robi, każ mu). v1.6.0
 * @author Tawerna
 *
 * @param enabled
 * @text Włączone
 * @type boolean
 * @default true
 * @desc Wyłącz (false) przed wydaniem gry, żeby F9 nie działało u gracza. Włączone domyślnie na czas developmentu/testów.
 *
 * @help
 * Klawisz F9 (poza wiadomościami i innymi menu) otwiera prosty ekran z pięcioma zakładkami;
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
 *        klucz, dzwon i pieśń znane bez questów W2-W4; "Podziemia: wszystkie przystanki windy" włącza windę na 10-90.
 *      - "Bandyta w pobliżu", "Nożownik w pobliżu", "Łucznik w pobliżu", "Najemnik w pobliżu", "Zasadzka (2 bandytów i łucznik)",
 *        "Obóz bandytów (noc)", "Napad na śpiącego (bandyci)" (Humans.js, etap 3 walki): ludzie-wrogowie kilka pól od bohatera;
 *        obóz 9-16 pól dalej (w dzień zegar idzie na 22:00); napad - grupa, która przyszłaby po śpiącego, od razu w walce.
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
 * F9 otwiera się na tej zakładce (i podzakładce) i pozycji, na których ostatnio był. Esc (albo F9) zamyka.
 * Zakładki i podzakładki można też klikać myszą.
 * Tylko do testowania - przed wydaniem gry ustaw parametr "Włączone" na false.
 */
(() => {
    "use strict";

    const enabled = PluginManager.parameters("Debug").enabled !== "false";
    if (!enabled) return;

    Input.keyMapper[120] = "debugmenu";   // F9

    function canOpen() {
        return !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode &&
            !($gamePlayer && $gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging());
    }

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (Input.isTriggered("debugmenu") && canOpen()) SceneManager.push(Scene_Debug);
        // a building chosen in the menu: placed once the map is back (Farming.js's placer, free and finished at once)
        if ($gameTemp._debugBuild && this === SceneManager._scene && !SceneManager.isSceneChanging() && !$gameTemp._buildMode && !$gameMessage.isBusy()) {
            const type = $gameTemp._debugBuild;
            $gameTemp._debugBuild = null;
            Farming.startFreePlacement(type);
        }
    };

    // the three tabs: their names and the key help shown over the list
    const TABS = [
        { name: "Zdarzenia", help: "↑↓ wybierz   OK wykonaj   Q / E zakładka   Esc zamknij" },
        { name: "Budowanie", help: "↑↓ wybierz   OK postaw (za darmo, od razu gotowe)   Q / E zakładka   Esc zamknij" },
        { name: "Przedmioty", help: "↑↓ wybierz   ←→ ilość   OK dodaj   Tab / [ ] rodzaj   Q / E zakładka   Esc zamknij" },
        { name: "Rdzeń", help: "↑↓ przewiń   OK odśwież   Q / E zakładka   Esc zamknij" },
        { name: "Kot", help: "↑↓ wybierz   OK każ mu (wraca na mapę)   na opisie OK odśwież   Q / E zakładka   Esc zamknij" }
    ];
    const ITEMS_TAB = 2, CORE_TAB = 3, CAT_TAB = 4;
    // ---- the cat tab (HomeLife.js's Mruczek): what it does now, where, for how long, what is next; its doings to send it to
    const CAT_SPOTS = [
        ["hearth", "Idź spać przy palenisku", "przy palenisku"],
        ["rug", "Idź na dywan", "na dywanie"],
        ["sill", "Wskocz na parapet okna", "na parapecie okna"],
        ["stroll", "Pospaceruj po izbie", "na spacerze po izbie"],
        ["feet", "Usiądź u stóp dziadka", "u stóp dziadka"],
        ["heroBed", "Idź spać na posłanie bohatera", "na posłaniu bohatera"]
    ];
    const CAT_STEP = { go: "idzie", face: "odwraca się", look: "rozgląda się", stay: "odpoczywa", stayFeet: "siedzi u stóp dziadka", curl: "zwija się do snu",
        uncurl: "przeciąga się i wstaje", hop: "skacze" };
    const CAT_DAY = [
        "W dzień (6-22) sam wybiera, co robić (bez powtarzania miejsca, poza paleniskiem):",
        "  - najczęściej śpi zwinięty przy palenisku (1-3 min),",
        "  - dywan: chwilę siedzi albo śpi (1-2 min),",
        "  - parapet okna we wnęce bohatera (8-19): podskok i 25-60 s na górze,",
        "  - spacer po izbie: idzie gdzieś i się rozgląda,",
        "  - u stóp dziadka, gdy ten buja się albo pali fajkę (często tam zasypia).",
        "W nocy (22-6): śpi na posłaniu bohatera (czasem przy palenisku), 2-5 min.",
        "Chodzi w 8 kierunkach, omija bohatera i dziadka (czeka, potem obchodzi),",
        "czasem przystaje i się rozgląda; nie wychodzi z domu, nie siada w drzwiach.",
        "Pogłaskany mruczy (~4 s, serduszko); raz dziennie +5 wytrzymałości."
    ];
    function catDoing(st) {
        if (st.purr > 0) return "mruczy (pogłaskany)";
        const spot = (CAT_SPOTS.find(r => r[0] === st.spot) || [])[2] || "";
        if (st.cur === "go" || st.moving) return "idzie" + (spot ? " - " + spot.replace(/^na spacerze po izbie$/, "spacer po izbie") : "");
        if (st.pose === "sleep") return "śpi zwinięty " + spot;
        if (st.pose === "curl") return "zwija się do snu " + spot;
        if (st.pose === "uncurl") return "przeciąga się i wstaje";
        if (st.cur === "stayFeet") return "siedzi u stóp dziadka";
        if (!st.perch && st.steps.includes("hop") && (st.spot === "sill" || st.spot === "heroBed"))   // (on the floor under it, before the jump)
            return st.spot === "sill" ? "siedzi pod oknem, zaraz wskoczy na parapet" : "siedzi przy posłaniu, zaraz na nie wskoczy";
        if (st.pose === "sit") return "siedzi " + spot;
        return (CAT_STEP[st.cur] || "stoi") + (spot ? " " + spot : "");
    }
    // the item tab's three kinds (a second band under the tabs; Tab or [ / ] switch them): tools and weapons, materials, food
    const KINDS = ["Narzędzia i broń", "Surowce", "Jedzenie"];
    const TOOL_EXTRA = [59, 127, 129, 138, 141, 142, 144];   // plain items that are tools all the same: torch, arrows, waterskin, bucket, cauldron, shears, tongs
    const RAW_FOOD = [94, 98, 157, 159, 161, 168];   // raw hare, fish, deer, boar, wolf, bear: food still to be cooked
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

    const heroLookLabel = () => "Nowa postać: " + (window.HeroLook && HeroLook.active() ? "włączona" : "wyłączona (stary Reid)");
    const layersLabel = () => "Warstwy z regionów: " + (window.RegionLayers && RegionLayers.overlay ? "ukryj kolory" : "pokaż kolory (1 zielony, 2 czerwony, 3 niebieski)");
    // Underground.js: go to a floor (0 = Ruiny Zamku, every 10th made by hand, 100 = the Heart's chamber); ←→ change the floor
    const ugFloorName = f => {
        const d = window.Underground_Data, hm = d && d.FLOORS && d.FLOORS[f];
        return f === 0 ? " (Ruiny Zamku)" : hm ? " (" + hm.name + ")" : "";
    };
    const ugFloorLabel = f => "Podziemia: piętro " + f + ugFloorName(f) + "   ←→ zmień (Shift: o 10), OK idź";
    const ugGateLabel = () => "Podziemia: zejście z piwnicy " + (window.Underground && Underground.isOpen() ? "otwarte (zamknij)" : "zamknięte (otwórz)");
    const ugLocksLabel = () => "Podziemia: zamki Serca na próbę " + (window.Underground && Underground.state().forceLocks.all ? "włączone (wyłącz)" : "wyłączone (włącz)");
    const ugLiftsLabel = () => "Podziemia: wszystkie przystanki windy" + (window.Underground && Underground.liftStops().length >= 9 ? " (już działają)" : "");
    // Creatures.js (combat stage 4): a creature of the ruins / a boss of the underground a few tiles away; ←→ choose which
    const crKeys = kind => (window.Creatures ? Object.keys(kind === "cr_boss" ? Creatures.BOSSES : Creatures.KINDS) : []);
    const crLabel = (kind, i) => {
        const key = crKeys(kind)[i] || "";
        if (kind === "cr_boss") { const b = Creatures.BOSSES[key] || {}; return "Boss podziemi: " + b.name + " (piętro " + b.floor + ")   ←→ zmień, OK przywołaj"; }
        const k = Creatures.KINDS[key] || {};
        return "Stwór z ruin: " + (k.plural ? k.plural + " (rój)" : k.name) + "   ←→ zmień, OK przywołaj";
    };
    // every row of the menu, each with its tab: 0 the events, 1 the buildings, 2 the items
    function allRows() {
        const rows = [
            { tab: 0, kind: "hour", label: "+1 godzina", icon: 240 },
            { tab: 0, kind: "day", label: "+1 dzień", icon: 241 }
        ];
        if (window.Sky && Sky.sunTimes) {   // the sky (Sky.js): jump to the dawn or the sunset, a misty morning
            rows.push({ tab: 0, kind: "dawn", label: "Godzina: świt (przed wschodem słońca)", icon: 240 },
                { tab: 0, kind: "dusk", label: "Godzina: zachód słońca", icon: 240 },
                { tab: 0, kind: "mist", label: "Gęsta mgła o świcie", icon: 70 });
        }
        if (window.Survival && Survival.forceStorm) {   // the weather (Survival.js plans it, Storm.js shows it)
            rows.push({ tab: 0, kind: "storm", label: "Burza teraz (2 godziny)", icon: 66 },
                { tab: 0, kind: "strike", label: "Piorun tuż obok", icon: 66 },
                { tab: 0, kind: "treestrike", label: "Piorun w drzewo (na ekranie)", icon: 66 },
                { tab: 0, kind: "calm", label: "Koniec pogody na dziś", icon: 70 });
        }
        if (window.Birds) {   // the birds (Birds.js): a flock landing near the player, a raid on the sown fields
            rows.push({ tab: 0, kind: "birds", label: "Stadko ptaków na ziemi", icon: 407 },
                { tab: 0, kind: "raid", label: "Nalot ptaków na pole", icon: 408 });
        }
        if (window.Hunting && Hunting.SPECIES.boar) rows.push({ tab: 0, kind: "boar", label: "Dzik w pobliżu", icon: 416 });   // Hunting.js: one boar a few tiles away
        if (window.Hunting && Hunting.SPECIES.wolf) rows.push({ tab: 0, kind: "wolves", label: "Wataha wilków (3)", icon: 416 });   // Hunting.js: a pack a few tiles away
        if (window.Hunting && Hunting.SPECIES.deer) rows.push({ tab: 0, kind: "deer", label: "Jeleń w pobliżu", icon: 420 });   // Hunting.js: a deer a few tiles away (any hour)
        if (window.Hunting && Hunting.SPECIES.bear) rows.push({ tab: 0, kind: "bear", label: "Niedźwiedź w pobliżu", icon: $dataItems[170] ? $dataItems[170].iconIndex : 416 });   // Hunting.js: a bear 7-10 tiles away (any hour)
        if (window.Humans) {   // Humans.js (combat stage 3): men a few tiles away, an ambush, a camp at night
            rows.push({ tab: 0, kind: "h_bandit", label: "Bandyta w pobliżu", icon: $dataItems[156] ? $dataItems[156].iconIndex : 418 },
                { tab: 0, kind: "h_knifer", label: "Nożownik w pobliżu", icon: $dataItems[91] ? $dataItems[91].iconIndex : 347 },
                { tab: 0, kind: "h_archer", label: "Łucznik w pobliżu", icon: $dataItems[126] ? $dataItems[126].iconIndex : 386 },
                { tab: 0, kind: "h_mercenary", label: "Najemnik w pobliżu", icon: $dataItems[155] ? $dataItems[155].iconIndex : 417 },
                { tab: 0, kind: "h_ambush", label: "Zasadzka (2 bandytów i łucznik)", icon: 76 },
                { tab: 0, kind: "h_camp", label: "Obóz bandytów (noc)", icon: 64 },
                { tab: 0, kind: "h_raid", label: "Napad na śpiącego (bandyci)", icon: 64 });
        }
        if (window.Creatures) rows.push({ tab: 0, kind: "cr_kind", pick: 0, label: crLabel("cr_kind", 0), icon: 189 },   // Creatures.js: one of the 8 kinds
            { tab: 0, kind: "cr_boss", pick: 0, label: crLabel("cr_boss", 0), icon: 189 });   // a boss (the guardian, floors 20-90)
        if (window.Combat) rows.push({ tab: 0, kind: "xp", label: "+200 doświadczenia", icon: 87 });   // Combat.js: to try the levels
        if (window.HeroLook) rows.push({ tab: 0, kind: "herolook", label: heroLookLabel(), icon: 84 });   // HeroLook.js: the new hero, on trial
        if (window.RegionLayers) rows.push({ tab: 0, kind: "layers", label: layersLabel(), icon: 190 });   // RegionLayers.js: the painted regions 1-3 in colour over the map
        if (window.Underground) rows.push({ tab: 0, kind: "underground", floor: 1, label: ugFloorLabel(1), icon: 189 },   // Underground.js: any floor
            { tab: 0, kind: "ugGate", label: ugGateLabel(), icon: 195 },   // the grate in the tavern's cellar (switch 11) on / off
            { tab: 0, kind: "ugLocks", label: ugLocksLabel(), icon: 195 },   // the Heart's three locks known without the quests (W2-W4)
            { tab: 0, kind: "ugLifts", label: ugLiftsLabel(), icon: 189 });  // every stop of the lift (floors 10-90) working
        if (window.Farming && Farming.startFreePlacement) {   // every building of Farming.js, put down free and finished
            for (const [type, def] of Object.entries(Farming.BUILDINGS)) {
                const iconItem = Farming.itemOf(def.pack || def.cost[0][0]);
                rows.push({ tab: 1, kind: "build", type, label: "Postaw: " + def.name, icon: iconItem ? iconItem.iconIndex : 0 });
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
        this._rows = tab === CORE_TAB ? this.coreRows() : tab === CAT_TAB ? this.catRows() : this._all.filter(r => r.tab === tab && (tab !== ITEMS_TAB || r.group === kind));
        this.refresh();
        this.select(Math.max(0, Math.min(index || 0, this._rows.length - 1)));
        this.ensureCursorVisible(true);
    };

    // the core tab: Tawerna.debug.lines() (TawernaCore.js), read as the tab opens; a line too wide for the list is cut at ", "
    // (the rest indented under it); the section lines ("Stany:", "Zegary mapy:"...) are the ones not indented
    Window_DebugList.prototype.coreRows = function() {
        const T = window.Tawerna, rows = [], width = this.innerWidth - this.itemPadding() * 2;
        const lines = T && T.debug ? T.debug.lines() : ["Brak TawernaCore.js - rdzeń nie jest wczytany"];
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
        if (!H || !H.catState) { info("Brak HomeLife.js - kota nie ma", true); return rows; }
        const st = H.catState(), icon = 0;   // (no icon of its own in the icon set)
        info("Kot Mruczek - teraz:", true);
        if (!st) {
            info("  Kot jest tylko w domu dziadka (mapa " + H.MAP + ") - tu go nie ma.");
            rows.push({ tab: CAT_TAB, kind: "catHouse", label: "Zabierz mnie do domu dziadka", icon });
        } else {
            info("  Robi: " + catDoing(st));
            info("  Gdzie: kratka " + st.x + ", " + st.y + (st.target && (st.target[0] !== st.x || st.target[1] !== st.y) ? " (idzie na " + st.target[0] + ", " + st.target[1] + ")" : ""));
            if (st.left > 0) info("  Jeszcze: ok. " + st.left + " s" + (!st.cur && !st.steps.length ? ", potem sam wybierze, co robić" : ""));
            if (st.steps.length) info("  Dalej: " + st.steps.map(t => CAT_STEP[t] || t).join(", "));
            info("Każ mu (menu wraca na mapę, żeby popatrzeć):", true);
            const can = H.catSpots();
            for (const [spot, label] of CAT_SPOTS) {
                if (can.includes(spot)) rows.push({ tab: CAT_TAB, kind: "cat", spot, label, icon });
                else if (spot === "feet") info("  (u stóp dziadka - tylko gdy dziadek siedzi w fotelu)");
            }
            rows.push({ tab: CAT_TAB, kind: "catChoose", label: "Niech sam wybierze, co robić", icon },
                { tab: CAT_TAB, kind: "catPet", label: "Pogłaszcz (mruczy)", icon: 82 });
        }
        info("Jego dzień:", true);
        for (const line of CAT_DAY) info("  " + line);
        return rows;
    };

    Window_DebugList.prototype.maxItems = function() {
        return this._rows.length;
    };

    // named rowData, not row: Window_Selectable already has its own row(index) (a scroll-position helper,
    // index / maxCols) that the engine calls internally - overwriting it crashed ensureCursorVisible
    Window_DebugList.prototype.rowData = function(index) {
        return this._rows[index >= 0 ? index : this.index()];
    };

    Window_DebugList.prototype.drawItem = function(index) {
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

    // left/right change the quantity of the highlighted item instead of moving the cursor
    Window_DebugList.prototype.cursorRight = function() {
        this.changeQty(1);
    };
    Window_DebugList.prototype.cursorLeft = function() {
        this.changeQty(-1);
    };
    Window_DebugList.prototype.changeQty = function(delta) {
        const row = this.rowData();
        if (row && row.kind === "underground") {   // (the floor to go to: 0-100; Shift: 10 at a time)
            row.floor = (row.floor + delta * (Input.isPressed("shift") ? 10 : 1) + 101 * 10) % 101;
            row.label = ugFloorLabel(row.floor);
            SoundManager.playCursor();
            this.redrawItem(this.index());
            return;
        }
        if (row && (row.kind === "cr_kind" || row.kind === "cr_boss")) {   // (which creature / boss)
            const n = crKeys(row.kind).length || 1;
            row.pick = (row.pick + delta + n) % n;
            row.label = crLabel(row.kind, row.pick);
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
        if (row.kind === "hour" || row.kind === "day") {
            $gameSystem.advanceDayNight(row.kind === "day" ? 24 : 1);
            $gameTemp.pushLootPopup(row.icon, row.label, "#9ff0a8");
        } else if (row.kind === "dawn" || row.kind === "dusk") {   // today's sunrise / sunset (the sun's height): back to the map to watch it
            const t = Sky.sunTimes($gameSystem.dayNightDay());
            $gameSystem.setDayNightHour(row.kind === "dawn" ? t.rise - 0.6 : t.set - 1);
            this.popScene();
        } else if (row.kind === "mist") {   // this morning's mist thick (past the morning: tomorrow's)
            const day = $gameSystem.dayNightDay(), t = Sky.sunTimes(day);
            Sky.forceMist(1, $gameSystem.dayNightHour() < t.rise + 2 ? day : day + 1);
            $gameTemp.pushLootPopup(row.icon, $gameSystem.dayNightHour() < t.rise + 2 ? "Mgła o świcie: dziś" : "Mgła o świcie: jutro", "#9ff0a8");
        } else if (row.kind === "storm" || row.kind === "calm") {
            if (row.kind === "storm") Survival.forceStorm(2);
            else Survival.calmWeather();
            this.popScene();   // back to the map to watch it
        } else if (row.kind === "birds" || row.kind === "raid") {
            this.popScene();   // started once the map is back (Birds.js needs its sprites)
            Birds.pending = row.kind;
        } else if (row.kind === "boar" || row.kind === "wolves" || row.kind === "deer" || row.kind === "bear") {
            this.popScene();   // spawned once the map is back
            Hunting.pending = row.kind;
        } else if (/^h_/.test(row.kind)) {   // Humans.js: spawned once the map is back
            this.popScene();
            Humans.pending = row.kind.slice(2);
        } else if (row.kind === "cr_kind" || row.kind === "cr_boss") {   // Creatures.js: spawned once the map is back
            this.popScene();
            Creatures.pending = crKeys(row.kind)[row.pick];
        } else if (row.kind === "xp") {
            Combat.gainXp(200, "F9");
        } else if (row.kind === "herolook") {   // the new hero on and off (the menu stays: the row says which)
            HeroLook.setActive(!HeroLook.active());
            row.label = heroLookLabel();
            this._list.redrawItem(this._list.index());
        } else if (row.kind === "underground") {   // Underground.js: to that floor's stairs (the gate does not matter here)
            Underground.go(row.floor);
            this.popScene();
        } else if (row.kind === "ugGate") {
            if (Underground.isOpen()) Underground.close(); else Underground.open();
            row.label = ugGateLabel();
            this._list.redrawItem(this._list.index());
        } else if (row.kind === "ugLocks") {   // (the menu stays: the row says which)
            Underground.forceLock("all", !Underground.state().forceLocks.all);
            row.label = ugLocksLabel();
            this._list.redrawItem(this._list.index());
        } else if (row.kind === "ugLifts") {
            for (const f of window.Underground_Data.LIFT.stops) Underground.state().lifts[f] = true;
            Underground.lift(true);
            row.label = ugLiftsLabel();
            this._list.redrawItem(this._list.index());
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
        } else {
            $gameParty.gainItem(row.item, row.qty);
            $gameTemp.pushLootPopup(row.item.iconIndex, row.item.name + " ×" + row.qty, "#f3e0a0");
        }
        SoundManager.playOk();
        this._list.activate();
    };

    window.Scene_Debug = Scene_Debug;
})();
