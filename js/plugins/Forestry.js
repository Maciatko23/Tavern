//=============================================================================
// Forestry.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Leśnictwo: sosny sadzone z nasion (z szyszek) rosną przez kilka dni w prawdziwe drzewa, które ścinasz jak każde inne. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
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
 * Posadzone drzewa są zapisywane w grze (Tawerna.state "forest", w starszych
 * zapisach $gameSystem._forest) i przy każdym wczytaniu mapy dopisywane do jej
 * zdarzeń przez rdzeń (Tawerna.inject, numery 1000-1999, daleko od tych,
 * które nadaje edytor). Strony i pniak kopiują zwykłą sosnę z tej samej mapy
 * (albo, gdy jej nie ma, wbudowany wzór z pniakiem 516).
 *
 * JABŁOŃ (2026-11-19): z pestek jabłoni (zbierane przy zrywaniu jabłek albo
 * kupione u zielarki) - "Posadź jabłoń" w tym samym menu. Rośnie 12 dni:
 * kopczyk z siewką (!$Sapling_Apple, _2, _3), potem młode drzewko bez owoców
 * (!$Tree_FruitBare zmniejszony), a dorosła jabłoń rodzi Jabłka latem i jesienią
 * jak dzikie (ChoppableTree: fruit). Zapis: rekord ma sp: "apple".
 *
 * Wymaga TawernaCore.js (pierwsza na liście wtyczek).
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("las");   // (the words of this file: js/teksty/las.txt, kod.*)

    const PLUGIN = "Forestry";
    const T = window.Tawerna;
    if (!T) throw new Error("Forestry.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const params = PluginManager.parameters(PLUGIN);
    const GROW_DAYS = Math.max(1, Number(params.growDays) || 10);
    const SEED = 147;               // Szyszka (2026-11-16, the user: no shelled seeds any more - the cone itself is planted; was 148 Nasiona sosny)
    const PLANT_STAMINA = 2;
    const CROUCH_KIND = 6;          // ChoppableTree's crouch (sowing, collecting)
    const FIRST_ID = 1000;          // planted trees get event ids from here on, far above what the editor gives out
    // (2026-10-21, docs/rozszerzenia/PLAN.md) ...and end at 1999: from 2000 up the ids belong to the new terrain's packages (TawernaCore
    // registry). A new tree takes the first free id of the range (not the map's event count any more - the packages' events at 2000+
    // would push it out of the range); the old saves' trees (1000 and a little above) keep theirs.
    const LAST_ID = 1999;
    const GRAPHICS = ["!$Pine_A", "!$Pine_B", "!$Pine_C"];
    const DEFAULT_STUMP_TILE = 516;

    const day = () => T.time.day();
    const seedItem = () => $dataItems[SEED];
    const popup = (icon, text) => T.popup(text, { icon, color: "#cfe6a8" });
    const refuse = (icon, text) => T.popup.need(icon, text);   // (red: what is missing, why not here)

    // ------------------------------------------------------------------
    // Saved: Tawerna.state("forest") = $gameSystem._tw.forest = { maps: { mapId: [{ id, x, y, day, graphic }] } } (plain data; an
    // older save's $gameSystem._forest is taken over, and that name stays a way to it - Journal's "plant" goal reads it)
    // ------------------------------------------------------------------
    const store = T.state.define("forest", () => ({ maps: {} }), { version: 1, adopt: "_forest", owner: PLUGIN });
    function treesOf(mapId) {
        const maps = store().maps;
        return maps[mapId] || (maps[mapId] = []);
    }

    // A planted tree looks a little bigger every day: LOOKS are its ten pictures until it is grown (day 0 .. 9 with growDays 10; other
    // growDays stretch or squeeze them). First a heap of dug earth with a seedling in it, growing (its own pictures, one blow of the
    // axe takes it and gives nothing, no stump), then a small pine that grows to full size: ChoppableTree's scale (the picture shrinks
    // around the foot of the tree), the blows to fell it and the wood it gives
    const BRANCH = 77, WOOD = 61;
    const LOOKS = [{ pic: "!$Sapling" }, { pic: "!$Sapling_2" }, { pic: "!$Sapling_3" },
        { scale: 0.24 }, { scale: 0.32 }, { scale: 0.41 }, { scale: 0.51 }, { scale: 0.62 }, { scale: 0.74 }, { scale: 0.87 }];
    // (2026-11-19, the user: an apple tree from pips) the kinds of planted trees. A record without `sp` is a pine (the old saves).
    //   seed: what is put into the ground; grow: days to a grown tree; looks: its pictures until then (a pic = its own picture at full
    //   size, a scale = the grown picture - `young` while it grows - shrunk around the foot); full: the grown tree's scale (the wild
    //   apples on the maps stand at 0.6-0.7); fruit: what a grown one bears (ChoppableTree: in season, again after some days)
    const APPLE_PIPS = 499, APPLES = 505;
    const SPECIES = {
        pine: { key: "pine", seed: SEED, grow: GROW_DAYS, looks: LOOKS, graphics: GRAPHICS, full: 1, hits: 20, wood: [6, 8], name: "Posadzona sosna", tk: "" },
        apple: { key: "apple", seed: APPLE_PIPS, sown: true, grow: 12, graphics: ["!$Tree_Apple"], young: "!$Tree_FruitBare", bare: "!$Tree_FruitBare",
            full: 0.65, hits: 14, wood: [3, 5], fruit: APPLES, name: "Posadzona jabłoń", tk: "Jablon",
            looks: [{ pic: "!$Sapling_Apple" }, { pic: "!$Sapling_Apple" }, { pic: "!$Sapling_Apple_2" }, { pic: "!$Sapling_Apple_2" }, { pic: "!$Sapling_Apple_3" },
                { pic: "!$Sapling_Apple_3" }, { scale: 0.3 }, { scale: 0.4 }, { scale: 0.5 }, { scale: 0.62 }, { scale: 0.75 }, { scale: 0.88 }] }
    };
    const speciesOf = rec => SPECIES[(rec && rec.sp) || "pine"] || SPECIES.pine;
    const stageOf = rec => { const g = speciesOf(rec).grow; return Math.max(0, Math.min(g, day() - rec.day)); };   // whole days since planting, grow = grown
    const growthOf = rec => stageOf(rec) / speciesOf(rec).grow;                  // 0 just planted .. 1 grown up
    const lookOf = (k, sp) => { const L = (sp || SPECIES.pine).looks; return k >= 1 ? { scale: 1 } : L[Math.min(L.length - 1, Math.floor(k * L.length + 1e-9))]; };
    // the picture now: a seedling's own, the young tree (the fruit tree's bare picture while it grows), then the grown one
    const graphicOf = rec => { const sp = speciesOf(rec), k = growthOf(rec), look = lookOf(k, sp); return look.pic || (k < 1 && sp.young) || rec.graphic; };
    const YIELD_FROM = 0.5;   // a planted tree gives wood only from half grown on
    function statsOf(k, sp) {
        sp = sp || SPECIES.pine;
        const look = lookOf(k, sp), fruit = sp.fruit ? { fruit: k >= 1 ? sp.fruit : 0 } : {};
        // a seedling: one blow and it is gone - it gives nothing (2026-11-25, the user: "posadzona sosna po ścięciu nie powinna nic dawać";
        // till then a branch - a cone planted and cut at once was a free branch)
        if (look.pic) return Object.assign({ scale: 1, hits: 1, drop: BRANCH, dropmin: 0, dropmax: 0, nostump: 1 }, fruit);
        // a young tree under half grown: nothing either, and no stump to dig ("każda posadzona sosna nic nie daje, jak drzewo jest
        // troszkę większe, to odpowiednio daje dopiero"); from half grown the wood and the branches by its size
        if (k < YIELD_FROM) return Object.assign({ scale: +(look.scale * sp.full).toFixed(3), hits: Math.max(1, Math.round(sp.hits * k)), drop: WOOD, dropmin: 0, dropmax: 0, nostump: 1 }, fruit);
        return Object.assign({ scale: +(look.scale * sp.full).toFixed(3), hits: Math.max(1, Math.round(sp.hits * k)), drop: WOOD,
            dropmin: Math.max(1, Math.round(sp.wood[0] * k)), dropmax: Math.max(1, Math.round(sp.wood[1] * k)), nostump: 0 }, fruit);   // (like the big pine: ~0.35 wood a blow)
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
    // the planted apple tree's pages, as the wild apple trees of the maps have them: 0 bearing (pick the fruit), C bare (chop it),
    // A the stump (dig it), B gone. While it grows it stands on the bare page (C on): no fruit, it can be chopped
    function applePages() {
        const pages = builtInPages(), fruitPage = JSON.parse(JSON.stringify(pages[0])), bare = pages[0];
        fruitPage.image.characterName = SPECIES.apple.graphics[0];
        fruitPage.list[0].parameters = ["ChoppableTree", "pickFruit", "Zerwij owoce", {}];
        bare.conditions = Object.assign({}, BLANK_CONDITIONS, { selfSwitchCh: "C", selfSwitchValid: true });
        bare.image.characterName = SPECIES.apple.bare;
        return [fruitPage, bare, pages[1], pages[2]];
    }
    // an ordinary pine of the map (a <Tree> without fruit, with a Pine picture on its first page)
    function templatePages(data) {
        const pine = (data.events || []).find(e => e && /<Tree/i.test(e.note || "") && !/fruit=/i.test(e.note || "") && e.id < FIRST_ID &&
            e.pages && e.pages[0] && /Pine/.test(e.pages[0].image.characterName || ""));
        return pine ? pine.pages : builtInPages();
    }
    function eventData(rec, pages) {
        const sp = speciesOf(rec), copy = JSON.parse(JSON.stringify(sp.key === "apple" ? applePages() : pages));
        const s = statsOf(growthOf(rec), sp), pic = graphicOf(rec);
        copy[0].image.characterName = pic;
        if (sp.key === "apple" && s.fruit) copy[0].image.characterName = rec.graphic;   // (grown: the bearing page shows the fruit)
        if (sp.key === "apple" && !s.fruit) copy[1].image.characterName = pic;          // (growing: it stands on the bare page)
        return { id: rec.id, name: sp.name, x: rec.x, y: rec.y, pages: copy,
            note: "<Tree:hits=" + s.hits + ",sway=" + (sp.key === "apple" ? "1.0" : "0.9") + ",drop=" + s.drop + ",dropmin=" + s.dropmin + ",dropmax=" + s.dropmax + ",scale=" + s.scale + ",nostump=" + s.nostump +
                (s.fruit ? ",fruit=" + s.fruit : "") + "><Planted>" };
    }
    function putData(data, rec, pages) {
        for (let i = data.events.length; i < rec.id; i++) data.events[i] = null;   // (no holes: other code checks events for null)
        data.events[rec.id] = eventData(rec, pages);
    }
    const switchesOf = (mapId, id) => ["A", "B", "C", "D"].map(ch => [mapId, id, ch]);

    // loading a map: its planted trees go into $dataMap.events before the map sets its events up (the core's Tawerna.inject, ids
    // 1000 and up on every map). Every one of them, always: the map data is loaded again after each menu while the map's events stay
    // as they were, so an event must never lose its data.
    T.inject("*", { ids: [FIRST_ID, LAST_ID], owner: PLUGIN, build(data, mapId) {
        const list = window.$gameSystem && window.$gameSelfSwitches ? store().maps[mapId] : null;
        if (!list || list.length === 0) return null;
        const pages = templatePages(data);
        return list.map(rec => eventData(rec, pages));
    } });
    // A tree whose stump was dug out (self-switch B; a felled seedling has no stump) is only dropped when the map is really set up
    // again (Game_Map.setup: entering it, a reload) - its record, its switches and its data, and the place is free again.
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
        const rec = recFor(event._mapId, event._eventId), CT = T.api("ChoppableTree");
        if (!rec || !CT || !CT.treeConfig) return;
        const sp = speciesOf(rec), k = growthOf(rec), cfg = CT.treeConfig(event);
        event._plantedGrowth = k;
        if (cfg) Object.assign(cfg, statsOf(k, sp));
        // the picture of the day, in the map's data (the next page set-up) and on the event itself. Both separately: the map's data
        // is loaded again after the night (the day summary is a scene of its own) with the new picture already in it, while the
        // event on the map still shows yesterday's
        const pic = graphicOf(rec), data = event.event(), page = data && data.pages && data.pages[0];
        if (!page) return;
        if (sp.key === "apple") {
            // growing: on the bare page (C on), its picture the seedling / the young tree; grown: ChoppableTree keeps C by the fruit
            const grown = k >= 1, bare = data.pages[1], C = [event._mapId, event._eventId, "C"];
            page.image.characterName = grown ? rec.graphic : pic;
            if (bare) bare.image.characterName = grown ? sp.bare : pic;
            if (!grown && !$gameSelfSwitches.value(C)) $gameSelfSwitches.setValue(C, true);
            if (grown && CT.syncFruitSwitch) CT.syncFruitSwitch(event);
            if (event._pageIndex === 0 || event._pageIndex === 1) {
                const want = data.pages[event._pageIndex].image.characterName;
                if (event.characterName() !== want) event.setImage(want, 0);
            }
            return;
        }
        page.image.characterName = pic;
        if (event._pageIndex === 0 && event.characterName() !== pic) event.setImage(pic, page.image.characterIndex || 0);
    }
    function growAll(map) {
        for (const e of map.events()) if (e.eventId() >= FIRST_ID && e.eventId() <= LAST_ID) applyGrowth(e);
    }
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        growAll(this);
    };
    // a day gone by (on the map or in a night's sleep): every planted tree on the map is a little bigger; and each time the map is
    // up (a saved game loaded, back from a menu or the day's summary) its trees are brought to today
    T.on("dayStart", () => { if (window.$gameMap) growAll($gameMap); }, { owner: PLUGIN });
    T.on("mapReady", () => growAll($gameMap), { owner: PLUGIN });

    // ------------------------------------------------------------------
    // Planting
    // ------------------------------------------------------------------
    const outdoors = () => { const o = T.call("Survival", "isOutdoors"); return o === undefined ? true : o; };
    function standingTreeNear(x, y) {
        const CT = T.api("ChoppableTree");
        return $gameMap.events().some(e => Math.abs(e.x - x) <= 1 && Math.abs(e.y - y) <= 1 && CT && CT.isTree(e) &&
            !$gameSelfSwitches.value([e._mapId, e._eventId, "B"]));
    }
    // null when a pine can be planted here, else why not
    function whyNot(x, y) {
        const F = T.api("Farming");
        if (!F || !outdoors() || (F.isHutInterior && F.isHutInterior())) return TK.kod.whyNot[0];
        const plot = F.plotAt(x, y);
        if (!plot || plot.s !== "cleared") return TK.kod.whyNot[1];
        if (F.isWaterTile(x, y)) return TK.kod.whyNot[2];
        if (F.buildingAt(x, y) || $gameMap.eventsXy(x, y).length > 0) return TK.kod.whyNot[3];
        if ($gamePlayer.x === x && $gamePlayer.y === y) return TK.kod.whyNot[4];
        if (standingTreeNear(x, y)) return TK.kod.whyNot[5];
        return null;
    }
    // the first id of 1000-1999 neither the map's data nor a record of this map holds (0: the map is full)
    function nextId(mapId) {
        const taken = new Set(treesOf(mapId).map(r => r.id));
        const events = ($dataMap && $dataMap.events) || [];
        for (let id = FIRST_ID; id <= LAST_ID; id++) if (!taken.has(id) && !events[id]) return id;
        return 0;
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
    function plant(x, y, spKey) {
        const sp = SPECIES[spKey || "pine"] || SPECIES.pine, apple = sp.key === "apple";
        const seed = $dataItems[sp.seed], why = whyNot(x, y);
        if (!seed || $gameParty.numItems(seed) < 1) { refuse(seed ? seed.iconIndex : 0, apple ? TK.kod.plantJablon[0] : TK.kod.plant[0]); return false; }
        if (why) { refuse(seed.iconIndex, why); return false; }
        if (typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(PLANT_STAMINA)) { refuse(82, TK.kod.plant[1]); return false; }
        const done = () => {
            if (whyNot(x, y)) return;   // (something got there during the crouch)
            $gameParty.loseItem(seed, 1);
            const mapId = $gameMap.mapId(), F = T.api("Farming"), id = nextId(mapId);
            if (!id) { refuse(seed.iconIndex, TK.kod.done[0]); return; }
            const rec = { id, x, y, day: day(), graphic: sp.graphics[Math.floor(F ? F.hash2(x, y, 521) * sp.graphics.length : 0)] };
            if (apple) rec.sp = "apple";
            treesOf(mapId).push(rec);
            spawn(rec);
            T.audio.se("Earth1", { volume: 80, pitch: 110 });
            popup(seed.iconIndex, Watki.wstaw(apple ? TK.kod.doneJablon[0] : TK.kod.done[1], { GROW_DAYS: sp.grow }));
        };
        if (!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(CROUCH_KIND, done))) done();
        return true;
    }
    // the line of the ground menu (Farming.js shows it while there are seeds in the bag)
    function plantEntry(x, y, spKey) {
        if (spKey === "apple") return appleEntry(x, y);
        const seed = seedItem(), n = seed ? $gameParty.numItems(seed) : 0, why = whyNot(x, y);
        return { name: TK.kod.plantEntry[0], icon: seed ? seed.iconIndex : 0, right: "-" + PLANT_STAMINA, enabled: !why && n > 0,
            help: why || Watki.wstaw(TK.kod.plantEntry[1], { n: n, GROW_DAYS: GROW_DAYS }),
            tip: Watki.wstaw(TK.kod.plantEntry[2], { GROW_DAYS: GROW_DAYS }),
            facts: [Watki.wstaw(TK.kod.plantEntry[3], { n: n }), TK.kod.plantEntry[4]],
            run: () => plant(x, y) };
    }
    // (2026-11-19) "Posadź jabłoń": the same ground, one pip
    function appleEntry(x, y) {
        const sp = SPECIES.apple, seed = $dataItems[sp.seed], n = seed ? $gameParty.numItems(seed) : 0, why = whyNot(x, y), w = { n: n, GROW_DAYS: sp.grow };
        return { name: TK.kod.plantJablonEntry[0], icon: seed ? seed.iconIndex : 0, right: "-" + PLANT_STAMINA, enabled: !why && n > 0,
            help: why || Watki.wstaw(TK.kod.plantJablonEntry[1], w),
            tip: Watki.wstaw(TK.kod.plantJablonEntry[2], w),
            facts: [Watki.wstaw(TK.kod.plantJablonEntry[3], w), TK.kod.plantJablonEntry[4]],
            run: () => plant(x, y, "apple") };
    }

    window.Forestry = T.register(PLUGIN, { GROW_DAYS, FIRST_ID, LAST_ID, nextId, SEED, LOOKS, SPECIES, speciesOf, plant, plantEntry, appleEntry, whyNot, stageOf, growthOf, graphicOf, statsOf, treesOf, spawn, applyGrowth,
        state: store });
})();
