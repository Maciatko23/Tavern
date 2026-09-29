//=============================================================================
// ChoppableTree_Objects.js
//=============================================================================
// What each thing to gather is and what happens to it (split out of ChoppableTree.js, 2026-09-29): the kinds (the ready-made bushes
// and rocks and the numbers they give), an event's numbers (its tag, else its picture), fruit trees (the season, the picking, the
// regrowth), a tree struck by lightning, the blow (the tool, the iron tool, the skills, the strength, the swing it starts), the moment
// the tool connects (the count, the chips, the shake), the fall and the break, what drops, the ground set free, the bus's "chop".
// Functions only: ChoppableTree.js holds every engine hook (the event's methods call in here).

/*:
 * @target MZ
 * @plugindesc Rzeczy do zbierania (część ChoppableTree.js): drzewa i owoce, krzaki, kamienie, ruda, pieńki, kłody - uderzenia, łup, upadek i rozbicie. Sama nic nie robi - parametry i haki ma ChoppableTree.js. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base ChoppableTree
 * @orderAfter ChoppableTree
 *
 * @help
 * ============================================================================
 * ChoppableTree_Objects.js - rzeczy do zbierania
 * ============================================================================
 * Część ChoppableTree.js (wydzielona z niego): co jest drzewem, krzakiem,
 * kamieniem, żyłą rudy, pieńkiem albo kłodą (gotowe obrazy i ich liczby -
 * tablice BUSH_PROFILES i ROCK_PROFILES), ile uderzeń, co wypada, owoce,
 * drzewo trafione piorunem, upadek i rozbicie, zwolniona ziemia, zdarzenie
 * szyny "chop". Sama nic nie robi: woła ją ChoppableTree.js, który ma
 * parametry.
 *
 * KOLEJNOŚĆ: ChoppableTree, ChoppableTree_Objects, ChoppableTree_Swing,
 * ChoppableTree_Render (zaraz pod ChoppableTree). Dopóki nie jest wpisana na
 * listę wtyczek, ChoppableTree.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("ChoppableTree_Objects.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("ChoppableTree_parts") || T.register("ChoppableTree_parts", {});
    if (P.objects) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("ChoppableTree_Objects.js: musi być pod ChoppableTree.js na liście wtyczek (ChoppableTree.js is missing or below)");
    const missing = name => { throw new Error("ChoppableTree_Objects.js: brak " + name + " (a part of ChoppableTree.js)"); };
    const { TREE_DEFAULTS, ROCK_DEFAULTS, STUMP_DEFAULTS, LOG_DEFAULTS, BUSH_DEFAULTS, FRUIT_SEASON_FROM, FRUIT_SEASON_TO,
        FRUIT_REGROW_DAYS, FRUIT_SE, CHARCOAL, CONE, CHARRED_DROP, CHARRED_STUMP_DROP, CHARRED_HITS, CHOP_SE, FALL_SE, DIG_SE, MINE_SE, BREAK_SE,
        PICKUP_SE, BUSH_SE, SWING_KIND, FALL_FRAMES, BREAK_FRAMES, swingKind, configCaches, readConfig, occupyConfig, isInsideArea, fruitState } = P.core;
    const S = () => P.swing || missing("ChoppableTree_Swing.js");

    // ------------------------------------------------------------------
    // The kinds: the ready-made bushes and rocks (a picture is enough), and an event's numbers (its tag, else its picture)
    // ------------------------------------------------------------------
    // Every picture named "!$Bush_..." is a bush: no note, no commands needed.
    const BUSH_GRAPHIC = /^!\$Bush_/;
    // What the ready-made bushes give: hits to cut, branches dropped, stamina per
    // hit. Bushes that are not listed use BUSH_DEFAULTS.
    const TUFT = { hits: 1, dropmin: 1, dropmax: 1, cost: 2 };
    const BUSH_PROFILES = {
        "!$Bush_Big": { hits: 2, dropmin: 3, dropmax: 5, cost: 5 },
        "!$Bush_Medium": { hits: 2, dropmin: 2, dropmax: 4, cost: 4 },
        "!$Bush_Wide": { hits: 2, dropmin: 2, dropmax: 3, cost: 4 },
        "!$Bush_Small": TUFT, "!$Bush_Grass": TUFT, "!$Bush_Fern_A": TUFT, "!$Bush_Fern_B": TUFT,
        "!$Bush_Snow_Tuft_A": TUFT, "!$Bush_Snow_Tuft_B": TUFT, "!$Bush_Bud_B": TUFT,
        // leafless thickets: dense woody tangles, more hits and more branches than leafy bushes
        "!$Bush_Bare_A": { hits: 2, dropmin: 2, dropmax: 3, cost: 4, bare: 1 },
        "!$Bush_Bare_B": { hits: 2, dropmin: 2, dropmax: 3, cost: 4, bare: 1 },
        "!$Bush_Bare_Tall": { hits: 2, dropmin: 3, dropmax: 4, cost: 5, bare: 1 },
        "!$Bush_Bare_Wide": { hits: 2, dropmin: 3, dropmax: 5, cost: 5, bare: 1 },
        "!$Bush_Bare_Hedge": { hits: 5, dropmin: 4, dropmax: 6, cost: 5, bare: 1 },
        "!$Bush_Bare_Thicket": { hits: 5, dropmin: 4, dropmax: 6, cost: 6, bare: 1 },
        "!$Bush_Bare_Vines": { hits: 5, dropmin: 4, dropmax: 6, cost: 6, bare: 1 },
        "!$Bush_Bare_Big": { hits: 6, dropmin: 5, dropmax: 8, cost: 7, bare: 1 }
    };
    // Every picture named "!$Rock_..." (and the boulder) is a rock: no note, no
    // commands needed. hits, stones dropped and stamina per hit by size. An event
    // with a <Rock> note keeps using the plugin parameters plus its note.
    const ROCK_GRAPHIC = /^!\$(Rock_|Boulder_)/;
    const SMALL_ROCK = { hits: 6, dropmin: 1, dropmax: 2, cost: 5 };   // (the numbers of blows: the user's, 2026-09-24)
    const ROCK_PROFILES = {
        "!$Boulder_A": { hits: 20, dropmin: 2, dropmax: 4, cost: 7 },
        "!$Rock_Tall": { hits: 16, dropmin: 2, dropmax: 3, cost: 6 },
        "!$Rock_Slab": { hits: 4, dropmin: 2, dropmax: 4, cost: 6 },
        "!$Rock_Mound": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Pile": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Grey": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Tan": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Snow_Grey": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Snow_Tan": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Flat": SMALL_ROCK, "!$Rock_Round": SMALL_ROCK, "!$Rock_Steps": SMALL_ROCK,
        // loose pebbles and rubble lie on the ground: tool 0 = picked up by hand (no pickaxe, no swing)
        "!$Rock_Pebbles": { tool: 0, hits: 1, dropmin: 1, dropmax: 1, cost: 1, title: "Podniesiono kamień!" },
        "!$Rock_Boulder_Crack": { hits: 20, dropmin: 2, dropmax: 4, cost: 7 },
        "!$Rock_Jagged": { hits: 20, dropmin: 2, dropmax: 4, cost: 7 },
        "!$Rock_Twin": { hits: 4, dropmin: 2, dropmax: 3, cost: 6 },
        "!$Rock_Wide": { hits: 14, dropmin: 3, dropmax: 5, cost: 7 },
        "!$Rock_Huge": { hits: 18, dropmin: 4, dropmax: 7, cost: 8 },
        "!$Rock_Spire": { hits: 16, dropmin: 2, dropmax: 3, cost: 6 },
        "!$Rock_Column": { hits: 4, dropmin: 2, dropmax: 4, cost: 6 },
        "!$Rock_Cluster": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Long": { hits: 4, dropmin: 2, dropmax: 4, cost: 6 },
        "!$Rock_Rubble": { tool: 0, hits: 1, dropmin: 1, dropmax: 2, cost: 1, title: "Podniesiono kamienie!" },
        "!$Rock_Cracked": { hits: 16, dropmin: 1, dropmax: 3, cost: 6 },
        "!$Rock_Cairn": SMALL_ROCK, "!$Rock_Chunk": SMALL_ROCK, "!$Rock_Mossy": SMALL_ROCK,
        // an ore vein: tougher than a plain rock, gives iron ore instead of stone (Farming/kuźnia)
        "!$Rock_Ore_Iron": { hits: 26, dropmin: 1, dropmax: 2, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        // more shapes of the same vein (the bigger, the more ore and the more blows)
        "!$Rock_Ore_Iron_Chunk": { hits: 22, dropmin: 1, dropmax: 2, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Spire": { hits: 26, dropmin: 2, dropmax: 3, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Cluster": { hits: 26, dropmin: 2, dropmax: 3, cost: 7, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Twin": { hits: 30, dropmin: 3, dropmax: 4, cost: 8, drop: 85, title: "Wydobyto rudę żelaza!" },
        "!$Rock_Ore_Iron_Jagged": { hits: 30, dropmin: 3, dropmax: 5, cost: 8, drop: 85, title: "Wydobyto rudę żelaza!" }
    };
    const treeConfig = event => readConfig(event, "Tree", TREE_DEFAULTS);
    // a pine (its first page shows a "...Pine..." picture): a grown one sheds cones as it falls
    const isPine = event => { const data = event.event(), page = data && data.pages && data.pages[0]; return !!page && /Pine/.test(page.image.characterName || ""); };

    // A "!$Rock_..." / "!$Boulder_..." picture on one of the event's pages, if any.
    function rockGraphic(event) {
        const data = event.event();
        const page = data && data.pages ? data.pages.find(pg => pg.image && ROCK_GRAPHIC.test(pg.image.characterName || "")) : null;
        return page ? page.image.characterName : "";
    }
    const rockConfig = event => {
        const graphic = rockGraphic(event);
        return readConfig(event, "Rock", ROCK_DEFAULTS, graphic ? Object.assign({}, ROCK_DEFAULTS, ROCK_PROFILES[graphic] || SMALL_ROCK) : null);
    };
    const stumpConfig = event => readConfig(event, "Stump", STUMP_DEFAULTS);
    const logConfig = event => readConfig(event, "Log", LOG_DEFAULTS);

    // The "!$Bush_..." picture an event shows (or showed before it was chopped:
    // the first page that has one).
    function bushGraphic(event) {
        const data = event.event();
        const page = data && data.pages ? data.pages.find(pg => pg.image && BUSH_GRAPHIC.test(pg.image.characterName || "")) : null;
        return page ? page.image.characterName : "";
    }
    // <Bush> note, or a bush picture (then the numbers come from BUSH_PROFILES).
    // Not for events that are already a tree, rock, stump or log.
    function bushConfig(event) {
        if (configCaches.Bush.has(event)) return configCaches.Bush.get(event);
        if (treeConfig(event) || rockConfig(event) || stumpConfig(event) || logConfig(event)) {
            configCaches.Bush.set(event, null);
            return null;
        }
        const graphic = bushGraphic(event);
        const defaults = Object.assign({}, BUSH_DEFAULTS, BUSH_PROFILES[graphic]);
        return readConfig(event, "Bush", defaults, graphic ? defaults : null);
    }
    const anyHarvestConfig = event => treeConfig(event) || rockConfig(event) || stumpConfig(event) || logConfig(event) || bushConfig(event);
    // what lies low - a log, a stump (a <Stump>, or a felled tree not yet dug out), a bush: a rabbit hops over it (Hunting.js)
    function isLow(event) {
        if (logConfig(event) || stumpConfig(event) || bushConfig(event)) return true;
        const sw = s => $gameSelfSwitches.value([event._mapId, event._eventId, s]);
        return !!treeConfig(event) && sw("A") && !sw("B");
    }

    // ---- fruit trees: a Tree that also carries fruit while standing (wild apple / pear). Picking
    // the fruit (self-switch C on) is the only way to make it choppable; it grows back after some
    // days, only in season. _tw.treeFruit = { "mapId:eventId": dayItWasPicked } (ChoppableTree.js: fruitState)
    const treeFruitStore = () => fruitState();
    const fruitKey = event => event._mapId + ":" + event._eventId;
    function fruitSeasonNow() {
        const s = T.time.season();   // (the calendar of the core: the same seasons as Farming.js)
        return s >= FRUIT_SEASON_FROM && s <= FRUIT_SEASON_TO;
    }
    // should self-switch C be OFF (fruiting) right now?
    function shouldFruit(event, cfg) {
        if (!cfg || !cfg.fruit || !fruitSeasonNow()) return false;
        const picked = treeFruitStore()[fruitKey(event)];
        return picked === undefined || T.time.day() - picked >= FRUIT_REGROW_DAYS;
    }
    // keeps self-switch C in sync with shouldFruit() before the event's page is (re)picked
    function syncFruitSwitch(event) {
        const cfg = treeConfig(event);
        if (!cfg || !cfg.fruit) return;
        const want = !shouldFruit(event, cfg);   // C on = bare
        if ($gameSelfSwitches.value([event._mapId, event._eventId, "C"]) !== want) {
            $gameSelfSwitches.setValue([event._mapId, event._eventId, "C"], want);
        }
    }
    // "Zerwij owoce z drzewa" (the plugin command pickFruit): the fruit into the bag, the tree bare (self-switch C) till it grows again
    function pickFruit(interpreter) {
        const event = $gameMap.event(interpreter._eventId);
        if (!event || event.isTreeAnimating()) return;
        const cfg = treeConfig(event);
        if (!cfg || !cfg.fruit) return;
        giveReward("Zerwano owoce!", cfg.fruit, cfg.fruitmin, cfg.fruitmax);
        playSe(FRUIT_SE, 105);
        treeFruitStore()[fruitKey(event)] = T.time.day();
        $gameSelfSwitches.setValue([event._mapId, event._eventId, "C"], true);
    }

    // ---- a tree struck by lightning (Storm.js) is charred: self-switch D (saved with the game). It stays where it
    // is, black; it falls after half the blows and gives charcoal instead of wood, and so does its stump.
    const isCharred = event => !!event && !!treeConfig(event) && $gameSelfSwitches.value([event._mapId, event._eventId, "D"]);
    // a standing tree lightning can hit: an ordinary one (not a fruit tree), not felled, showing its picture
    function isStandingTree(event) {
        const cfg = treeConfig(event);
        if (!cfg || cfg.fruit) return false;
        const on = ch => $gameSelfSwitches.value([event._mapId, event._eventId, ch]);
        return !on("A") && !on("B") && event.tileId() === 0 && !!event.characterName();
    }
    const strikeableTrees = () => $gameMap.events().filter(e => isStandingTree(e) && !isCharred(e) && !e.isTreeAnimating());
    function charTree(event) {
        if (!isStandingTree(event) || isCharred(event)) return false;
        $gameSelfSwitches.setValue([event._mapId, event._eventId, "D"], true);
        queueFxAt(event, "ember", true);   // sparks out of the crown and burnt leaves drifting down
        queueFxAt(event, "ash", true);
        return true;
    }

    // The tile of the event nearest to the player: where the tool actually hits.
    function targetTile(event) {
        const o = occupyConfig(event);
        if (!o) return { x: event.x, y: event.y };
        if (isInsideArea(event, o, $gamePlayer.x, $gamePlayer.y)) {
            // standing on a soft edge tile: the tool hits the tile he is facing
            const d = $gamePlayer.direction();
            const fx = $gamePlayer.x + (d === 6 ? 1 : d === 4 ? -1 : 0), fy = $gamePlayer.y + (d === 2 ? 1 : d === 8 ? -1 : 0);
            if (isInsideArea(event, o, fx, fy)) return { x: fx, y: fy };
        }
        return {
            x: Math.max(event.x - o.left, Math.min(event.x + o.right, $gamePlayer.x)),
            y: Math.max(event.y - o.up, Math.min(event.y + o.down, $gamePlayer.y))
        };
    }

    function playSe(name, pitch) {
        T.audio.se(name, { volume: 90, pitch });   // (the core's pool: a file that does not load stays silent)
    }

    const SHAKE_FRAMES = 6;

    // ------------------------------------------------------------------
    // The event's clocks every frame (Game_Event.updateTreeAnimation): the shake, the swing (the blow lands on its strike frame), the
    // invisible hold, the fall, the break
    // ------------------------------------------------------------------
    function updateTreeAnimation() {
        if (this._treeShake > 0) {
            this._treeShake--;
        }
        if (this._swingT >= 0) {
            const swing = swingKind(this._swingKind);
            this._swingT += this._swingRate || 1;   // (Zręczność: a quicker swing, workSpeed)
            if (!this._hitLanded && this._swingT >= swing.impact && this._pendingAction) {
                this._hitLanded = true;
                applyPendingAction(this);
            }
            if (this._swingT >= swing.frames) {
                this._swingT = -1;
                if ($gamePlayer._swingEvent === this) $gamePlayer._swingEvent = null;
                const h = $gamePlayer._holdStrike;
                if (h && h.id === this._eventId && h.map === this._mapId) h.t = Math.max(2, Math.round(S().HOLD_PAUSE / (this._swingRate || 1)));   // held O: the next blow soon
            }
        }
        if (this._treeGone && ++this._treeGoneFrames > 3) {
            this.releaseInvisibleHold();
        }
        if (this._treeFallT >= 0) {
            this._treeFallT++;
            if (this._treeFallT >= FALL_FRAMES) {
                playSe(FALL_SE, 100);
                this.finishTreeFall();
            }
        }
        if (this._breakT >= 0) {
            this._breakT++;
            const total = BREAK_FRAMES[this._breakKind] || 30;
            const p = Math.min(1, this._breakT / total);
            this.setOpacity(Math.round(255 * (1 - p * p)));
            if (this._breakT >= total) {
                this.finishBreak();
            }
        }
    }

    // The ground a destroyed object stood on (its base tiles) becomes cleared land
    // that can be raked, ploughed, sown or built on (Farming.js keeps track of it).
    // original: use the picture of the event's first page (what it showed before it
    // was destroyed) to work out how much ground it covered.
    function clearLandUnder(event, original) {
        if (typeof $gameSystem.clearLand !== "function") return;
        const pages = event.event() && event.event().pages;
        const name = original && pages && pages[0] ? pages[0].image.characterName : undefined;
        const o = occupyConfig(event, name) || { left: 0, right: 0, up: 0, down: 0 };
        const tiles = [];
        for (let y = event.y; y <= event.y + o.down; y++) {
            for (let x = event.x - o.left; x <= event.x + o.right; x++) tiles.push({ x, y });
        }
        $gameSystem.clearLand(event._mapId, tiles);
    }

    // Objects that were destroyed before the farming system existed (or in an
    // older save) free their ground too, as soon as the map is set up.
    function isDestroyedHarvest(event) {
        if (!(event instanceof Game_Event)) return false;
        const on = ch => $gameSelfSwitches.value([event._mapId, event._eventId, ch]);
        if (rockConfig(event) || logConfig(event) || bushConfig(event)) return on("A");
        if (stumpConfig(event) || treeConfig(event)) return on("B");   // a felled tree only leaves a stump
        return false;
    }

    const rollCount = (min, max) => min + Math.floor(Math.random() * (Math.max(max, min) - min + 1));

    // fixed: the number was already decided (the stones that flew out of the rock)
    // bonusKey: a skill's chance of one piece more (Zbieractwo: "chop.yield", "mine.yield", "forage.yield")
    // returns how many were given (the bus's "chop": drops)
    function giveReward(title, itemId, min, max, fixed, bonusKey) {
        const item = $dataItems[itemId];
        let count = fixed !== undefined ? fixed : rollCount(min, max);
        if (bonusKey && count > 0 && perkRoll(bonusKey)) count++;
        // With SurvivalHUD loaded, gainItem shows a floating "+N item" over the
        // player; without it fall back to plain messages.
        const hasPopups = typeof $gameTemp.pushLootPopup === "function";
        if (!hasPopups) $gameMessage.add(title);
        if (item && count > 0) {
            $gameParty.gainItem(item, count);
            if (!hasPopups) $gameMessage.add("Zdobyto: \\I[" + item.iconIndex + "]" + item.name + " x" + count);
        }
        return item && count > 0 ? count : 0;
    }

    function finishTreeFall() {
        this._treeFallT = -1;
        // The sprite keeps the tree gone and the stump preview fully shown until
        // the next frame swaps in the real stump page.
        this._treeGone = true;
        this._treeGoneFrames = 0;
        const cfg = treeConfig(this) || TREE_DEFAULTS, drops = [], charred = isCharred(this);
        if (charred) {
            // burnt to the roots: no stump is left (straight to the empty page), the ground under it is free at once
            drops.push({ item: CHARCOAL, amount: giveReward("Ścięto zwęglone drzewo!", CHARCOAL, CHARRED_DROP[0], CHARRED_DROP[1]) });
            clearLandUnder(this);
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
        } else {
            drops.push({ item: cfg.drop, amount: giveReward("Ścięto drzewo!", cfg.drop, cfg.dropmin, cfg.dropmax, undefined, "chop.yield") });
            // a grown pine sheds its cones as it falls (a young planted one has none yet)
            if (isPine(this) && (cfg.scale || 1) >= 0.9 && $dataItems[CONE]) {
                const cones = 1 + Math.floor(Math.random() * 3);
                $gameParty.gainItem($dataItems[CONE], cones);
                drops.push({ item: CONE, amount: cones });
            }
            if (cfg.nostump) {   // (a seedling: nothing to dig out afterwards)
                clearLandUnder(this);
                $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
            }
        }
        $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
        chopDone(this, "tree", charred || !!cfg.nostump, drops, charred, false);
    }

    function finishBreak() {
        const kind = this._breakKind, drops = [];
        let what = "stump", charred = false, hand = false;
        this._breakT = -1;
        clearLandUnder(this);
        this.holdInvisibleUntilPageChange();
        if (kind === "rock") {
            const cfg = rockConfig(this) || ROCK_DEFAULTS;
            drops.push({ item: cfg.drop, amount: giveReward(cfg.title || "Rozbito kamień!", cfg.drop, cfg.dropmin, cfg.dropmax, this._dropCount, cfg.tool > 0 ? "mine.yield" : "forage.yield") });
            if (cfg.tool > 0 && cfg.drop !== IRON_ORE && $dataItems[IRON_ORE] && perkRoll("ore")) {   // (Oko na kruszec)
                $gameParty.gainItem($dataItems[IRON_ORE], 1);
                drops.push({ item: IRON_ORE, amount: 1 });
            }
            this._dropCount = undefined;
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
            what = cfg.drop === IRON_ORE ? "ore" : "rock";
            hand = !(cfg.tool > 0);
        } else if (kind === "bush") {
            const cfg = bushConfig(this) || BUSH_DEFAULTS;
            drops.push({ item: cfg.drop, amount: giveReward("Ścięto krzak!", cfg.drop, cfg.dropmin, cfg.dropmax, undefined, "chop.yield") });
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
            what = "bush";
            hand = !(cfg.tool > 0);
        } else if (kind === "log") {
            const cfg = logConfig(this) || LOG_DEFAULTS;
            drops.push({ item: cfg.drop, amount: giveReward(cfg.tool > 0 ? "Rozrąbano kłodę!" : "Zebrano drewno!", cfg.drop, cfg.dropmin, cfg.dropmax, undefined, cfg.tool > 0 ? "chop.yield" : "forage.yield") });
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "A"], true);
            what = "log";
            hand = !(cfg.tool > 0);
        } else if (isCharred(this)) {   // (only a stump left by a charred tree felled before they stopped leaving one)
            drops.push({ item: CHARCOAL, amount: giveReward("Wykopano zwęglony pieniek!", CHARCOAL, CHARRED_STUMP_DROP[0], CHARRED_STUMP_DROP[1]) });
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
            charred = true;
        } else {
            const cfg = treeConfig(this) || stumpConfig(this) || STUMP_DEFAULTS;
            drops.push({ item: cfg.digdrop, amount: giveReward("Wykopano pieniek!", cfg.digdrop, cfg.digmin, cfg.digmax, undefined, "chop.yield") });
            $gameSelfSwitches.setValue([this._mapId, this._eventId, "B"], true);
        }
        chopDone(this, what, true, drops, charred, hand);
    }

    // The bus: a thing finished (docs/ARCHITEKTURA.md, section 5). kind: "tree" (felled), "stump" (dug out), "rock", "ore" (a vein),
    // "bush", "log"; done: nothing of it is left, its ground is free (a felled tree leaves its stump: false); drops: what went into the
    // bag, [{ item, amount }]; charred: a tree struck by lightning, or its stump; hand: picked up without a tool (pebbles, rubble)
    function chopDone(event, kind, done, drops, charred, hand) {
        T.emit("chop", { kind, id: event._eventId, mapId: event._mapId, x: event.x, y: event.y, done: !!done,
            drops: drops.filter(d => d.amount > 0), charred: !!charred, hand: !!hand, event });
    }

    // What a command does depends on the event's tag: <Log> / <Tree> for chop,
    // <Tree> / <Stump> for dig, <Rock> for mine.
    function strikeSetup(event, kind) {
        if (kind === "chop") {
            const log = logConfig(event);
            if (log) {
                return { tool: log.tool, needed: log.hits, cost: log.tool > 0 ? log.cost : 0, se: log.tool > 0 ? CHOP_SE : PICKUP_SE, finish: "log",
                    missing: "Potrzebujesz siekiery" };
            }
            const tree = treeConfig(event);
            const bush = !tree && bushConfig(event);
            if (bush) {
                return { tool: bush.tool, needed: bush.hits, cost: bush.cost, se: BUSH_SE, finish: "bush", bare: !!bush.bare,
                    missing: "Potrzebujesz siekiery" };
            }
            const cfg = tree || TREE_DEFAULTS;
            const charred = isCharred(event);   // brittle: half the blows, black chips and ash instead of wood and leaves
            return { tool: cfg.axe, needed: charred ? CHARRED_HITS : cfg.hits, cost: cfg.cost, se: CHOP_SE, finish: "fall",
                fx: charred ? ["char"] : null, fallFx: charred ? "ash" : "leaf", missing: "Potrzebujesz siekiery" };
        }
        if (kind === "dig") {
            const treeCfg = treeConfig(event);
            const cfg = treeCfg || stumpConfig(event) || STUMP_DEFAULTS;
            return { tool: cfg.shovel, needed: cfg.digs, cost: treeCfg ? treeCfg.digcost : cfg.cost, se: DIG_SE, finish: "stump",
                missing: "Potrzebujesz łopaty" };
        }
        const cfg = rockConfig(event) || ROCK_DEFAULTS;
        return { tool: cfg.tool, needed: cfg.hits, cost: cfg.cost, se: cfg.tool > 0 ? MINE_SE : PICKUP_SE, finish: "rock",
            missing: "Potrzebujesz kilofa" };
    }

    // A forged iron axe (115) / pickaxe (116), made in the forge (Farming.js), REPLACES the plain tool: it works
    // on its own (the old axe / pickaxe may be gone) and is clearly better - about a third fewer blows and a
    // little less stamina per blow. The first blow on every object says how much it saved.
    const IRON_HIT_FACTOR = 0.65;
    const IRON_ITEM = { axe: 115, pick: 116 };
    function ironTool(tool) {
        const id = tool > 0 && tool === TREE_DEFAULTS.axe ? IRON_ITEM.axe : tool > 0 && tool === ROCK_DEFAULTS.tool ? IRON_ITEM.pick : 0;
        const item = id ? $dataItems[id] : null;
        return item && $gameParty.hasItem(item) ? item : null;
    }
    function ownsTool(tool) {
        return $gameParty.hasItem($dataItems[tool]) || !!ironTool(tool);
    }
    function applyIronTool(action) {
        const item = ironTool(action.tool);
        if (!item) return;
        const before = action.needed;
        action.needed = Math.max(1, Math.round(before * IRON_HIT_FACTOR));
        if (action.cost > 1) action.cost = Math.max(1, Math.round(action.cost * 0.75));
        action.ironItem = item;
        action.ironFrom = before;
    }
    // the hero's skills (Combat.js, Skills_Data.js): perk(key) = what the learnt skills add up to for an effect, perkRoll(key) = a
    // roll against it (a chance), knowsSkill(id) = that one skill is learnt
    const perk = key => { const v = T.call("Combat", "perk", key); return v === undefined ? 0 : v; };
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    const knowsSkill = id => !!T.call("Combat", "hasSkill", id);
    const IRON_ORE = 85;
    // Zbieractwo: fewer blows and less strength for chopping, digging out stumps and mining; picking up by hand is free ("Szybkie ręce")
    function applySkills(action) {
        if (action.tool > 0) {
            // Siła a little (Combat.gatherBonus: 0.5% a point over 5), the Zbieractwo skills a lot
            const bonus = T.call("Combat", "gatherBonus"), str = bonus === undefined ? 0 : bonus;
            const fewer = Math.min(0.75, perk(action.finish === "rock" ? "mine.hits" : "chop.hits") + str);
            if (fewer > 0) action.needed = Math.max(1, Math.round(action.needed * (1 - fewer)));
            if (action.cost > 0) action.cost = Math.max(0.5, action.cost * (1 - Math.min(0.75, perk("gather.cost"))));
        } else if (knowsSkill("g_quick")) action.cost = 0;
    }

    const SLOW_SWING = { fall: 0.5, rock: 0.5 };   // chopping a standing tree (axe) and mining a rock or ore (pickaxe) go at half the speed (the swing and the pause; the user's)
    const workSpeed = () => { const v = T.call("Combat", "workSpeed"); return v === undefined ? 1 : v; };

    function blowsText(n) {
        return n + (n === 1 ? " uderzenie" : n < 5 ? " uderzenia" : " uderzeń");
    }

    // What is missing (a tool, strength) is always said by a popup over the player - the same as the messages of
    // Farming.js - and never by the message window. (Only without the popup layer does it fall back to the window.)
    function needPopup(icon, text) {
        if ($gameTemp && typeof $gameTemp.pushLootPopup === "function") T.popup.need(icon, text);
        else $gameMessage.add(text);
    }

    function strike(interpreter, kind) {
        const event = $gameMap.event(interpreter._eventId);
        if (!event || event.isTreeAnimating()) return;
        const action = strikeSetup(event, kind);
        applyIronTool(action);
        applySkills(action);
        if (action.tool > 0 && !ownsTool(action.tool)) {
            needPopup($dataItems[action.tool] ? $dataItems[action.tool].iconIndex : 0, action.missing);
            return;
        }
        if (action.cost > 0 && typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(action.cost)) {
            needPopup(82, "Jesteś zbyt zmęczony");
            return;
        }
        if (action.tool > 0) T.call("Durability", "use", action.ironItem ? action.ironItem.id : action.tool);   // one blow wears the tool
        event._pendingAction = action;
        if (action.tool > 0) {
            // Swing the tool; the hit itself lands on the strike frame.
            event._swingKind = SWING_KIND[action.finish];
            event._swingT = 0;
            event._swingRate = workSpeed() * (SLOW_SWING[action.finish] || 1);   // (a standing tree, a rock: slower, the user's)
            event._hitLanded = false;
            $gamePlayer._swingEvent = event;
            $gamePlayer._holdStrike = { id: event.eventId(), map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, d: $gamePlayer.direction(), t: 0 };   // (ids: nothing big in a save)
        } else {
            applyPendingAction(event);   // picking something up by hand: no swing
        }
        interpreter.setWaitMode("treeAnimation");
    }

    // ------------------------------------------------------------------
    // Hit effects: chips, sparks, dirt and leaves flying off the target when a
    // tool connects. The game side only queues them in $gameTemp._hitFx; the
    // layer of ChoppableTree_Render.js turns them into little falling squares.
    // ------------------------------------------------------------------
    const BARE_BUSH_FX = ["drytwig", "twig"];   // leafless: dry twigs, no green leaves
    const FX_BY_FINISH = { fall: ["wood"], log: ["wood"], rock: ["rock", "spark"], stump: ["dirt"], bush: ["bushleaf", "twig"] };

    // count: how many particles (otherwise the type's own number)
    function queueHitFx(event, type, final, count) {
        if (typeof $gameTemp === "undefined" || !$gameTemp) return;
        if (!$gameTemp._hitFx) $gameTemp._hitFx = [];
        // The effect starts on the side of the target that faces the player
        // (of the tile of a big object that is nearest to the player).
        const tile = targetTile(event);
        $gameTemp._hitFx.push({
            type, final: !!final, count,
            bx: tile.x + 0.5, by: tile.y + 1,
            dx: Math.sign(tile.x - $gamePlayer.x), dy: Math.sign(tile.y - $gamePlayer.y)
        });
    }

    // the same, from the object itself rather than from the side the player hits it (lightning)
    function queueFxAt(event, type, final, count) {
        if (typeof $gameTemp === "undefined" || !$gameTemp) return;
        if (!$gameTemp._hitFx) $gameTemp._hitFx = [];
        $gameTemp._hitFx.push({ type, final: !!final, count, bx: event.x + 0.5, by: event.y + 1, dx: 0, dy: 0 });
    }

    function shakeScreen(power, duration) {
        if (typeof $gameScreen !== "undefined" && $gameScreen && $gameScreen.startShake) {
            $gameScreen.startShake(power, 9, duration);
        }
    }

    // The moment the tool connects: sound, knock-back / flash, hit counting and
    // the start of the felling / breaking animation.
    function applyPendingAction(event) {
        const action = event._pendingAction;
        event._pendingAction = null;
        if (!action) return;
        event._treeHits = (event._treeHits || 0) + 1;
        playSe(action.se, 90 + Math.floor(Math.random() * 20));
        event._treeShake = SHAKE_FRAMES;
        event._treeKickAt = Graphics.frameCount;
        // The hit pushes the target away from the player.
        event._treeKickDir = $gamePlayer.x <= event.x ? 1 : -1;
        const last = event._treeHits >= action.needed;
        if (event._treeHits === 1 && action.ironItem && action.ironFrom > action.needed) {
            T.popup(action.ironItem.name + ": " + blowsText(action.needed) + " zamiast " + action.ironFrom, { icon: action.ironItem.iconIndex, color: "#ffd866" });
        }
        for (const type of (action.bare ? BARE_BUSH_FX : action.fx || FX_BY_FINISH[action.finish]) || []) queueHitFx(event, type, last);
        if (action.finish === "rock") shakeScreen(last ? 3 : 2, last ? 14 : 7);
        if (last) {
            event._treeHits = 0;
            if (action.finish === "fall") {
                event._treeFallDir = event._treeKickDir;
                event._treeFallT = 0;
                queueHitFx(event, action.fallFx || "leaf", true);
            } else {
                event._breakKind = action.finish;
                event._breakT = 0;
                if (action.finish !== "bush") playSe(BREAK_SE, 100);
                if (action.finish === "rock") {
                    // the stones you get are decided now and fly out of the rock
                    const cfg = rockConfig(event) || ROCK_DEFAULTS;
                    event._dropCount = rollCount(cfg.dropmin, cfg.dropmax);
                    queueHitFx(event, "stone", true, event._dropCount);
                }
            }
        }
    }

    P.objects = { BUSH_PROFILES, ROCK_PROFILES, TUFT, SMALL_ROCK, BUSH_GRAPHIC, ROCK_GRAPHIC, IRON_ORE, IRON_ITEM, SLOW_SWING, FX_BY_FINISH, BARE_BUSH_FX,
        treeConfig, rockConfig, stumpConfig, logConfig, bushConfig, anyHarvestConfig, rockGraphic, bushGraphic, isPine, isLow,
        fruitSeasonNow, shouldFruit, syncFruitSwitch, pickFruit, isCharred, isStandingTree, strikeableTrees, charTree, targetTile,
        updateTreeAnimation, finishTreeFall, finishBreak, clearLandUnder, isDestroyedHarvest, giveReward, strikeSetup, ironTool, ownsTool,
        applyIronTool, applySkills, perk, perkRoll, knowsSkill, workSpeed, needPopup, strike, applyPendingAction, queueHitFx, queueFxAt, chopDone };
})();
