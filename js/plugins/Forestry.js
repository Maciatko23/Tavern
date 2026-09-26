//=============================================================================
// Forestry.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Leśnictwo: sosny sadzone z nasion (z szyszek) rosną przez kilka dni w prawdziwe drzewa, które ścinasz jak każde inne. v1.0.0
 * @author Claude
 * @orderAfter ChoppableTree
 * @orderAfter Farming
 *
 * @param growDays
 * @text Dni do dorosłego drzewa
 * @desc Po tylu dniach gry sadzonka jest pełnym drzewem (do tego czasu co dzień jest trochę większa).
 * @type number
 * @min 1
 * @default 10
 *
 * @help
 * ============================================================================
 * LEŚNICTWO
 * ============================================================================
 * SZYSZKI leżą pod stojącymi sosnami (Farming.js, jak kamienie i zioła) i sypią
 * się ze ściętej sosny (ChoppableTree.js). W "Wytwórz..." wyłuskasz z dwóch
 * szyszek trzy nasiona sosny.
 *
 * SADZENIE: w menu nieuprawianej albo oczyszczonej ziemi, gdy masz nasiona,
 * pojawia się "Posadź sosnę" (-2 wytrzymałości, jedno nasiono). Nie posadzisz
 * jej tuż obok innego drzewa, na wodzie, pod budynkiem ani w chatce.
 *
 * WZROST: posadzona sosna jest zdarzeniem na mapie (jak drzewa wstawione w
 * edytorze). Rośnie growDays dni (domyślnie 10) i każdego dnia wygląda trochę
 * większa: dziesięć obrazków, zanim będzie dorosłym drzewem. Pierwsze trzy to
 * kopczyk świeżej ziemi z rosnącą siewką (!$Sapling, !$Sapling_2, !$Sapling_3):
 * jedno uderzenie siekierą da gałąź i nie zostawi pnia. Potem mała sosna
 * (obrazek sosny zmniejszony) rośnie z dnia na dzień do pełnej wielkości.
 * Ścinasz ją jak każde drzewo, ale młoda pada od mniejszej liczby uderzeń i daje
 * mniej drewna; szyszki sypią się dopiero z dorosłej. Po wykopaniu pnia miejsce
 * jest znowu wolne.
 *
 * Posadzone drzewa są zapisywane w grze ($gameSystem._forest) i przy każdym
 * wczytaniu mapy dopisywane do jej zdarzeń (numery od 1000 w górę, daleko od
 * tych, które nadaje edytor). Strony i pniak kopiują zwykłą sosnę z tej samej
 * mapy (albo, gdy jej nie ma, wbudowany wzór z pniakiem 516).
 * ============================================================================
 */

(() => {
    "use strict";

    const params = PluginManager.parameters("Forestry");
    const GROW_DAYS = Math.max(1, Number(params.growDays) || 10);
    const SEED = 148;               // Nasiona sosny
    const PLANT_STAMINA = 2;
    const CROUCH_KIND = 6;          // ChoppableTree's crouch (sowing, collecting)
    const FIRST_ID = 1000;          // planted trees get event ids from here on, far above what the editor gives out
    const GRAPHICS = ["!$Pine_A", "!$Pine_B", "!$Pine_C"];
    const DEFAULT_STUMP_TILE = 516;

    const day = () => ($gameSystem && typeof $gameSystem.dayNightDay === "function" ? $gameSystem.dayNightDay() : 1);
    const seedItem = () => $dataItems[SEED];
    function popup(icon, text, color) { $gameTemp.pushLootPopup(icon, text, color || "#cfe6a8"); }

    // ------------------------------------------------------------------
    // Saved: $gameSystem._forest = { maps: { mapId: [{ id, x, y, day, graphic }] } }
    // ------------------------------------------------------------------
    function store() {
        if (!$gameSystem._forest) $gameSystem._forest = { maps: {} };
        return $gameSystem._forest;
    }
    function treesOf(mapId) {
        const maps = store().maps;
        return maps[mapId] || (maps[mapId] = []);
    }

    // A planted tree looks a little bigger every day: LOOKS are its ten pictures until it is grown (day 0 .. 9 with growDays 10; other
    // growDays stretch or squeeze them). First a heap of dug earth with a seedling in it, growing (its own pictures, one blow of the
    // axe gives a branch and leaves no stump), then a small pine that grows to full size: ChoppableTree's scale (the picture shrinks
    // around the foot of the tree), the blows to fell it and the wood it gives
    const BRANCH = 77, WOOD = 61;
    const LOOKS = [{ pic: "!$Sapling" }, { pic: "!$Sapling_2" }, { pic: "!$Sapling_3" },
        { scale: 0.24 }, { scale: 0.32 }, { scale: 0.41 }, { scale: 0.51 }, { scale: 0.62 }, { scale: 0.74 }, { scale: 0.87 }];
    const stageOf = rec => Math.max(0, Math.min(GROW_DAYS, day() - rec.day));   // whole days since planting, GROW_DAYS = grown
    const growthOf = rec => stageOf(rec) / GROW_DAYS;                            // 0 just planted .. 1 grown up
    const lookOf = k => (k >= 1 ? { scale: 1 } : LOOKS[Math.min(LOOKS.length - 1, Math.floor(k * LOOKS.length + 1e-9))]);
    const graphicOf = rec => lookOf(growthOf(rec)).pic || rec.graphic;
    function statsOf(k) {
        const look = lookOf(k);
        if (look.pic) return { scale: 1, hits: 1, drop: BRANCH, dropmin: 1, dropmax: 1, nostump: 1 };
        return { scale: look.scale, hits: Math.max(1, Math.round(20 * k)), drop: WOOD,
            dropmin: Math.max(1, Math.round(6 * k)), dropmax: Math.max(1, Math.round(8 * k)), nostump: 0 };   // (like the big pine: ~0.35 wood a blow)
    }

    // ------------------------------------------------------------------
    // The event of a planted tree: the pages of a pine on this map (its stump tile and commands), the planted picture on the first
    // ------------------------------------------------------------------
    const BLANK_CONDITIONS = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function builtInPages() {
        const page = (cond, image, command, label, dirFix) => ({ conditions: Object.assign({}, BLANK_CONDITIONS, cond), directionFix: dirFix, image,
            list: command ? [{ code: 357, indent: 0, parameters: ["ChoppableTree", command, label, {}] }, { code: 0, indent: 0, parameters: [] }] : [{ code: 0, indent: 0, parameters: [] }],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: command ? 1 : 0,
            stepAnime: false, through: !command, trigger: 0, walkAnime: false });
        return [
            page({}, { tileId: 0, characterName: GRAPHICS[0], direction: 2, pattern: 1, characterIndex: 0 }, "chop", "Uderz w drzewo", true),
            page({ selfSwitchCh: "A", selfSwitchValid: true }, { tileId: DEFAULT_STUMP_TILE, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }, "dig", "Kop pieniek", false),
            page({ selfSwitchCh: "B", selfSwitchValid: true }, { tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }, null, "", false)
        ];
    }
    // an ordinary pine of the map (a <Tree> without fruit, with a Pine picture on its first page)
    function templatePages(data) {
        const pine = (data.events || []).find(e => e && /<Tree/i.test(e.note || "") && !/fruit=/i.test(e.note || "") && e.id < FIRST_ID &&
            e.pages && e.pages[0] && /Pine/.test(e.pages[0].image.characterName || ""));
        return pine ? pine.pages : builtInPages();
    }
    function eventData(rec, pages) {
        const copy = JSON.parse(JSON.stringify(pages));
        copy[0].image.characterName = graphicOf(rec);
        const s = statsOf(growthOf(rec));
        return { id: rec.id, name: "Posadzona sosna", x: rec.x, y: rec.y, pages: copy,
            note: "<Tree:hits=" + s.hits + ",sway=0.9,drop=" + s.drop + ",dropmin=" + s.dropmin + ",dropmax=" + s.dropmax + ",scale=" + s.scale + ",nostump=" + s.nostump + "><Planted>" };
    }
    function putData(data, rec, pages) {
        for (let i = data.events.length; i < rec.id; i++) data.events[i] = null;   // (no holes: other code checks events for null)
        data.events[rec.id] = eventData(rec, pages);
    }
    const switchesOf = (mapId, id) => ["A", "B", "C", "D"].map(ch => [mapId, id, ch]);

    // loading a map: its planted trees go into $dataMap.events before the map sets its events up. Every one of them, always: the map
    // data is loaded again after each menu while the map's events stay as they were, so an event must never lose its data.
    // A tree whose stump was dug out (self-switch B; a felled seedling has no stump) is only dropped when the map is really set up
    // again (Game_Map.setup: entering it, a reload) - its record, its switches and its data, and the place is free again.
    let loadingMapId = 0;
    const _DataManager_loadMapData = DataManager.loadMapData;
    DataManager.loadMapData = function(mapId) {
        loadingMapId = mapId;
        _DataManager_loadMapData.call(this, mapId);
    };
    const _DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function(object) {
        _DataManager_onLoad.call(this, object);
        if (object === $dataMap && loadingMapId > 0 && $gameSystem && $gameSelfSwitches) inject(object, loadingMapId);
    };
    function inject(data, mapId) {
        const list = store().maps[mapId];
        if (!list || list.length === 0 || !data.events) return;
        const pages = templatePages(data);
        for (const rec of list) putData(data, rec, pages);
    }
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        const maps = store().maps, list = maps[mapId];
        if (list && list.length && $dataMap && $dataMap.events) {
            maps[mapId] = list.filter(rec => {
                if (!$gameSelfSwitches.value([mapId, rec.id, "B"])) return true;
                for (const k of switchesOf(mapId, rec.id)) $gameSelfSwitches.setValue(k, false);
                $dataMap.events[rec.id] = null;   // (so no event is made for it)
                return false;
            });
        }
        _Game_Map_setup.call(this, mapId);
    };

    // the growth of a planted tree, into ChoppableTree's cached numbers (read every frame for the picture's size). The event keeps only
    // the number (_plantedGrowth, saved with it; Farming.js drops no cones under a pine that is still growing), the record stays in the store.
    function recFor(mapId, eventId) {
        return (store().maps[mapId] || []).find(r => r.id === eventId) || null;
    }
    function applyGrowth(event) {
        const rec = recFor(event._mapId, event._eventId);
        if (!rec || !window.ChoppableTree || !ChoppableTree.treeConfig) return;
        const k = growthOf(rec), cfg = ChoppableTree.treeConfig(event);
        event._plantedGrowth = k;
        if (cfg) Object.assign(cfg, statsOf(k));
        // the picture of the day, in the map's data (the next page set-up) and on the event itself. Both separately: the map's data
        // is loaded again after the night (the day summary is a scene of its own) with the new picture already in it, while the
        // event on the map still shows yesterday's
        const pic = graphicOf(rec), data = event.event(), page = data && data.pages && data.pages[0];
        if (!page) return;
        page.image.characterName = pic;
        if (event._pageIndex === 0 && event.characterName() !== pic) event.setImage(pic, page.image.characterIndex || 0);
    }
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        for (const e of this.events()) if (e.eventId() >= FIRST_ID) applyGrowth(e);
    };
    // once a second: when a day has gone by, every planted tree on the map is a little bigger
    let lastDay = -1, checkWait = 0;
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (--checkWait > 0) return;
        checkWait = 60;
        const d = day();
        if (d === lastDay) return;
        lastDay = d;
        for (const e of $gameMap.events()) if (e.eventId() >= FIRST_ID) applyGrowth(e);
    };

    // ------------------------------------------------------------------
    // Planting
    // ------------------------------------------------------------------
    const outdoors = () => (window.Survival && Survival.isOutdoors ? Survival.isOutdoors() : true);
    function standingTreeNear(x, y) {
        return $gameMap.events().some(e => Math.abs(e.x - x) <= 1 && Math.abs(e.y - y) <= 1 && window.ChoppableTree && ChoppableTree.isTree(e) &&
            !$gameSelfSwitches.value([e._mapId, e._eventId, "B"]));
    }
    // null when a pine can be planted here, else why not
    function whyNot(x, y) {
        const F = window.Farming;
        if (!F || !outdoors() || (F.isHutInterior && F.isHutInterior())) return "Drzewo posadzisz tylko pod gołym niebem.";
        const plot = F.plotAt(x, y);
        if (!plot || plot.s !== "cleared") return "Sadzonkę wsadzisz w zwykłą albo oczyszczoną ziemię.";
        if (F.isWaterTile(x, y)) return "Tu jest woda.";
        if (F.buildingAt(x, y) || $gameMap.eventsXy(x, y).length > 0) return "To miejsce jest zajęte.";
        if ($gamePlayer.x === x && $gamePlayer.y === y) return "Stoisz w tym miejscu.";
        if (standingTreeNear(x, y)) return "Za blisko innego drzewa: zostaw mu miejsce na korzenie.";
        return null;
    }
    function nextId(mapId) {
        let id = Math.max(FIRST_ID, $dataMap.events.length);
        for (const r of treesOf(mapId)) id = Math.max(id, r.id + 1);
        return id;
    }
    // puts the event on the map now (the saved record makes it come back with the map later)
    function spawn(rec) {
        const mapId = $gameMap.mapId();
        for (const k of switchesOf(mapId, rec.id)) $gameSelfSwitches.setValue(k, false);   // (an old tree with this number may have left them)
        putData($dataMap, rec, templatePages($dataMap));
        const event = new Game_Event(mapId, rec.id);
        $gameMap._events[rec.id] = event;
        applyGrowth(event);
        const set = SceneManager._scene instanceof Scene_Map ? SceneManager._scene._spriteset : null;
        if (set && set._tilemap) {
            const sprite = new Sprite_Character(event);
            set._characterSprites.push(sprite);
            set._tilemap.addChild(sprite);
        }
        return event;
    }
    function plant(x, y) {
        const seed = seedItem(), why = whyNot(x, y);
        if (!seed || $gameParty.numItems(seed) < 1) { popup(seed ? seed.iconIndex : 0, "Nie masz nasion sosny", "#ff9f8f"); return false; }
        if (why) { popup(seed.iconIndex, why, "#ff9f8f"); return false; }
        if (typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(PLANT_STAMINA)) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        const done = () => {
            if (whyNot(x, y)) return;   // (something got there during the crouch)
            $gameParty.loseItem(seed, 1);
            const mapId = $gameMap.mapId();
            const rec = { id: nextId(mapId), x, y, day: day(), graphic: GRAPHICS[Math.floor(window.Farming ? Farming.hash2(x, y, 521) * GRAPHICS.length : 0)] };
            treesOf(mapId).push(rec);
            spawn(rec);
            AudioManager.playSe({ name: "Earth1", volume: 80, pitch: 110, pan: 0 });
            popup(seed.iconIndex, "Posadzono sosnę. Za " + GROW_DAYS + " dni będzie drzewem.");
        };
        if (!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(CROUCH_KIND, done))) done();
        return true;
    }
    // the line of the ground menu (Farming.js shows it while there are seeds in the bag)
    function plantEntry(x, y) {
        const seed = seedItem(), n = seed ? $gameParty.numItems(seed) : 0, why = whyNot(x, y);
        return { name: "Posadź sosnę", icon: seed ? seed.iconIndex : 0, right: "-" + PLANT_STAMINA, enabled: !why && n > 0,
            help: why || "Wsadzasz w ziemię nasiono sosny (masz " + n + "). Sadzonka rośnie " + GROW_DAYS + " dni w dorosłe drzewo, które zetniesz siekierą. Młode drzewko da mniej drewna, a szyszki sypią się dopiero z dorosłego.",
            tip: "Wsadzasz w ziemię jedno nasiono sosny. Sadzonka od razu stoi na mapie i przez " + GROW_DAYS + " dni rośnie z dnia na dzień w dorosłe drzewo.",
            facts: ["Masz nasion: " + n, "Młode drzewo: mniej uderzeń siekierą i mniej drewna"],
            run: () => plant(x, y) };
    }

    window.Forestry = { GROW_DAYS, FIRST_ID, SEED, LOOKS, plant, plantEntry, whyNot, stageOf, growthOf, graphicOf, statsOf, treesOf, spawn, applyGrowth };
})();
