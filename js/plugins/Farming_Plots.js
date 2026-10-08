//=============================================================================
// Farming_Plots.js
//=============================================================================
// The ground and what grows on it (split out of Farming.js, 2026-09-29): which tile is soil (by the look of its picture), the
// plots, the things lying about (stones, flax, berries and bushes, mushrooms, herbs, cones, wild vegetables), water (the can, a
// drink, the waterskin, the bucket, fishing), the buckets and pots that gather rain, the crops' growth, the tools on a plot (rake,
// hoe, sowing, harvest, watering, digging), wet clay and the pots drying on the ground or on the shelter's table.
// Functions and classes only: Farming.js holds every engine hook.

/*:
 * @target MZ
 * @plugindesc Ziemia i uprawy (część Farming.js): które kratki są ziemią, pola, zbieractwo, woda, wiadra i garnki na deszczówkę, wzrost roślin, grabienie, orka, siew, zbiór, podlewanie, kopanie, glina i suszenie garnków. Sama nic nie robi - parametry i haki ma Farming.js. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Farming
 * @orderAfter Farming
 *
 * @help
 * ============================================================================
 * Farming_Plots.js - ziemia i uprawy
 * ============================================================================
 * Część Farming.js (wydzielona z niego): rozpoznawanie ziemi po wyglądzie
 * kafla, pola, rzeczy leżące na ziemi (kamienie, len, jagody i krzaki,
 * grzyby, zioła, szyszki, dzikie warzywa), woda (konewka, picie, bukłak,
 * wiadro, wędka), wiadra i garnki zbierające deszcz, wzrost roślin,
 * narzędzia na polu (grabie, motyka, siew, zbiór, podlewanie, łopata),
 * mokra glina i garnki schnące na ziemi i na stole wiaty. Sama nic nie
 * robi: woła ją Farming.js. Parametry ma Farming.js.
 *
 * KOLEJNOŚĆ: Farming, Farming_Plots, Farming_Build, Farming_Stations,
 * Farming_UI (potem Farming_Render). Dopóki nie jest wpisana na listę
 * wtyczek, Farming.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Farming_Plots.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Farming_parts") || T.register("Farming_parts", {});
    if (P.plots) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("Farming_Plots.js: musi być pod Farming.js na liście wtyczek (Farming.js is missing or below)");
    const { FARM_REGION, BLOCK_REGION, AUTO_GROUND, ITEM, ICON, STAMINA, canMax, SEED_CHANCE, GROWTH, SCARECROW_BONUS,
        SCARECROW_RANGE, WATER_BONUS, WATER_GRACE_DAYS, seasonIndex, seasonOf, RAKE_KIND, HOE_KIND, CROUCH_KIND, FISH_KIND,
        SHOVEL_KIND, DIG_YIELD, CLAY_YIELD, SE, CROPS, BUILDINGS, CROP_IDS, TILE, farm, today, key, plotsOf, buildingsOf, changed,
        isHutInterior, hutFloor, geoOf, buildingAt, GATHER, GATHER_KINDS, BUSH_SHARE, MUSHROOM_POOL, MUSHROOM_LIFE, CONE_SHARE,
        BUCKET_REACH, itemOf, countOf, rand, popup, complain, spaceFor, complainNoSpace, playSe, spendStamina, perk, perkRoll,
        knowsSkill, farmCost, foodIsFree, useTool, requireItem, fx, later, lockPlayer, swingThen, hasClock, clockHours,
        weatherHere, hash2 } = P.core;

    // ---- ordinary ground: which tiles count as farmland without anything being cleared
    function mapAllowsFarming() {
        const farm = T.mapFlag("Farm", null, "first");   // (<Farm:on> / <Farm:off> in the map's note: the first one)
        if (farm !== null) return farm;
        return !T.mapFlag("Dark", false);   // rooms with <Dark:on> are indoors
    }

    // Where a tile's picture lies in the tileset sheets: { set, x, y } (null for
    // tiles that are never ground: water, walls, roofs).
    function tilePicture(tileId) {
        if (Tilemap.isTileA1(tileId) || Tilemap.isTileA3(tileId) || Tilemap.isTileA4(tileId)) return null;
        if (Tilemap.isTileA2(tileId)) {
            const k = Tilemap.getAutotileKind(tileId) - 16;
            return { set: 1, x: (k % 8) * 96, y: Math.floor(k / 8) * 144 + 48 };   // the plain fill piece of the autotile
        }
        if (Tilemap.isTileA5(tileId)) {
            const i = tileId - Tilemap.TILE_ID_A5;
            return { set: 4, x: (i % 8) * TILE, y: Math.floor(i / 8) * TILE };
        }
        return {
            set: 5 + Math.floor(tileId / 256),
            x: ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * TILE,
            y: (Math.floor((tileId % 256) / 8) % 16) * TILE
        };
    }

    // Soft ground looks like grass (green) or bare earth (brown/olive, not
    // reddish like wood, not grey like stone). Many decorative ground autotiles
    // (grass tufts, moss and dirt patches) are drawn as a soft, feathered blob
    // that does not fill its tile edge to edge, so a moderate opaque coverage is
    // enough to judge by colour; a tile that is (almost) fully transparent here
    // tells us nothing (some custom tilesets have blank, unused autotile kinds)
    // and is reported as null rather than "not soil".
    // -> "grass" | "earth" | false (not soft ground) | null (nothing drawn here);
    // the average colour of the opaque pixels is kept in `.tint` of the returned info.
    function soilKindOf(pixels) {
        let n = 0, opaque = 0, r = 0, g = 0, b = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            n++;
            if (pixels[i + 3] < 200) continue;
            opaque++; r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2];
        }
        if (opaque < n * 0.05) return { kind: null };     // nothing meaningful is drawn here
        if (opaque < n * 0.35) return { kind: false };    // too sparse to be the ground itself
        r /= opaque; g /= opaque; b /= opaque;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        if (d === 0) return { kind: false };
        let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
        const s = d / max, v = max / 255;
        const grass = h >= 110 && h <= 150 && s >= 0.30 && v >= 0.44;
        const earth = h >= 38 && h <= 98 && s >= 0.22 && s <= 0.42 && v >= 0.42 && v <= 0.62;
        return { kind: grass ? "grass" : earth ? "earth" : false, tint: [Math.round(r), Math.round(g), Math.round(b)] };
    }
    function looksLikeSoil(pixels) {
        const kind = soilKindOf(pixels).kind;
        return kind === null ? null : !!kind;
    }

    // { kind, tint } of a tile's picture, or undefined while its tileset image is still loading
    const soilTileCache = new Map();
    function tileGround(tileId) {
        const tileset = $gameMap.tileset();
        if (!tileset || tileId <= 0) return { kind: false };
        const k = tileset.id + ":" + tileId;
        if (soilTileCache.has(k)) return soilTileCache.get(k);
        const pic = tilePicture(tileId);
        let result = { kind: false };
        if (pic) {
            const bitmap = ImageManager.loadTileset(tileset.tilesetNames[pic.set]);
            if (!bitmap || !bitmap.isReady()) return undefined;   // not decided yet: ask again next time
            result = soilKindOf(bitmap.context.getImageData(pic.x + 10, pic.y + 10, 28, 28).data);
        }
        soilTileCache.set(k, result);
        return result;
    }

    // true / false, or null when the tile's picture is blank (nothing to judge).
    function isSoilTile(tileId) {
        const ground = tileGround(tileId);
        if (!ground) return false;
        return ground.kind === null ? null : !!ground.kind;
    }

    // What the player actually sees as ground: the upper autotile layer, unless
    // it turns out to be a blank autotile kind (kind null) - then the lower layer
    // underneath is what is visually shown instead.
    function groundInfoAt(x, y) {
        const upper = $gameMap.tileId(x, y, 1);
        if (upper > 0) {
            const ground = tileGround(upper);
            if (ground === undefined) return undefined;
            if (ground.kind !== null) return ground;
        }
        return tileGround($gameMap.tileId(x, y, 0));
    }
    function groundIsSoil(x, y) {
        const ground = groundInfoAt(x, y);
        return !!(ground && ground.kind);
    }
    function hasObjectTile(x, y) {
        return $gameMap.tileId(x, y, 2) > 0 || $gameMap.tileId(x, y, 3) > 0;
    }

    function naturalFarmland(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        const region = $gameMap.regionId(x, y);
        if (BLOCK_REGION > 0 && region === BLOCK_REGION) return false;
        if (!$gameMap.checkPassage(x, y, 0x0f)) return false;
        if (FARM_REGION > 0 && region === FARM_REGION) return true;   // painted by the author
        if (!AUTO_GROUND || !mapAllowsFarming()) return false;
        if ($gameMap.eventsXy(x, y).length > 0 || hasObjectTile(x, y)) return false;
        return groundIsSoil(x, y);
    }

    // The plot on a tile: the stored one, or a virtual "cleared" one on ordinary
    // ground (see naturalFarmland).
    function plotAt(x, y, mapId) {
        mapId = mapId === undefined ? $gameMap.mapId() : mapId;
        const stored = (farm().plots[mapId] || {})[key(x, y)];
        if (stored) return stored;
        if (mapId === $gameMap.mapId() && isHutInterior(mapId) && hutFloor(x, y)) return { s: "floor", indoor: true };   // the floor of the hut: ground for furniture
        if (mapId === $gameMap.mapId() && bushSolid(x, y, mapId)) return null;   // a bush grows there
        if (mapId === $gameMap.mapId() && naturalFarmland(x, y)) return { s: "cleared", natural: true };
        return null;
    }
    // a virtual plot becomes a stored one as soon as something is done on it (indoors nothing is stored: there is no soil)
    function ensurePlot(x, y) {
        if (isHutInterior()) return { s: "floor", indoor: true };
        const plots = plotsOf($gameMap.mapId());
        if (!plots[key(x, y)]) plots[key(x, y)] = { s: "cleared" };
        return plots[key(x, y)];
    }

    // A new building marks its ground as cleared land; the tiles that were plain natural ground before are remembered (b.claimed), so that
    // taking the building away (bucket, tent, demolishing, giving up a site) gives the ground back as it was, unless it was worked on meanwhile
    function claimGround(tiles) {
        const fresh = [];
        if (isHutInterior()) return fresh;
        const plots = plotsOf($gameMap.mapId());
        for (const t of tiles) {
            const k = key(t.x, t.y);
            if (!plots[k]) { fresh.push(k); plots[k] = { s: "cleared" }; }
        }
        return fresh;
    }
    function releaseGround(b, mapId) {
        const plots = farm().plots[mapId];
        if (!plots || !b.claimed) return;
        for (const k of b.claimed) {
            const p = plots[k];
            if (p && p.s === "cleared" && !p.crop && !p.dug && p.watered === undefined) delete plots[k];
        }
        changed();
    }

    // ---- things lying about on the ground, picked up by hand (no tool): small stones, wild flax (fibre),
    // berries, mushrooms and herbs. Where they lie is fixed by the tile (a hash) and the season decides which
    // of them are out; only the picked ones are saved: $gameSystem._farm.stones[mapId]["x,y"] = the day
    // (they grow back later).
    let stoneRev = 0;   // bumped when one is taken, so the drawing layer refreshes
    const gatherRev = () => stoneRev;   // Farming_Render.js reads the counter through this (a plain export would freeze at its value at load time)
    const stonesOf = mapId => {
        const f = farm();
        if (!f.stones) f.stones = {};
        return f.stones[mapId] || (f.stones[mapId] = {});
    };
    function gatherKindOf(x, y) {
        if (hash2(x, y, 811) < BUSH_SHARE) return "bush";
        const r = hash2(x, y, 301);
        let acc = 0;
        for (const k of GATHER_KINDS) {
            const g = GATHER[k];
            // (only the first `keep` of the kind's stretch holds it: fewer, on the same tiles; the rest of the stretch lies bare)
            if (r < acc + g.share) return r < acc + g.share * (g.keep === undefined ? 1 : g.keep) ? k : null;
            acc += g.share;
        }
        if (coneTiles().has(key(x, y)) && hash2(x, y, 907) < CONE_SHARE) return "cone";
        return hash2(x, y, 733) < MUSHROOM_POOL ? "mushroom" : null;
    }
    // ---- cones fall under the pines: the tiles within 2 of a standing pine (a "!$Pine_..." picture, not felled; a pine planted by
    // Forestry.js only once it has grown up). Worked out again each day and when the map or its events change.
    let coneCache = { stamp: "", tiles: new Set() };
    function coneTiles() {
        if (!$gameMap || !$dataMap) return coneCache.tiles;
        // (asked on every passability check through bushSolid: the stamp is kept cheap, no copy of the event list)
        const stamp = $gameMap.mapId() + ":" + today() + ":" + $gameMap._events.length;
        if (coneCache.stamp === stamp) return coneCache.tiles;
        const tiles = new Set();
        for (const e of $gameMap.events()) {
            const data = e.event(), page = data && data.pages && data.pages[0];
            if (!page || !/Pine/.test(page.image.characterName || "") || e._plantedGrowth < 1) continue;
            if ($gameSelfSwitches.value([e._mapId, e._eventId, "A"])) continue;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx || dy) tiles.add(key(e.x + dx, e.y + dy));
        }
        coneCache = { stamp, tiles };
        return tiles;
    }
    // ---- mushrooms: on a tile of the pool a new one may appear each day (seldom; in the days after rain many more; never in winter) and it stays for
    // MUSHROOM_LIFE days unless it is picked. Nothing is stored except the day it was picked.
    const rainOn = day => { const p = T.call("Survival", "weatherPlan", day); return !!p && p.type === "rain"; };
    function mushroomChance(day) {
        const base = [0.003, 0.004, 0.008, 0][seasonIndex(day)];
        return Math.min(0.9, base * (rainOn(day) || rainOn(day - 1) ? 14 : 1));
    }
    // the day the mushroom that stands on the tile now was born (the newest of the last MUSHROOM_LIFE days), or null
    function mushroomBirth(x, y) {
        const day = today();
        for (let d = day; d > day - MUSHROOM_LIFE && d >= 1; d--) {
            if (hash2(x * 5 + d * 101, y * 7 + d * 29, 741) < mushroomChance(d)) return d;
        }
        return null;
    }
    // ---- berry bushes: full (berries), picked -> bare for 4 days (then it fruits again) or, picked bare, gone for 8 days (then it grows back);
    // in winter it stands bare. farm().bushes[mapId]["x,y"] = { stage: "empty" | "gone", day }
    const bushesOf = mapId => {
        const f = farm();
        if (!f.bushes) f.bushes = {};
        return f.bushes[mapId] || (f.bushes[mapId] = {});
    };
    function bushState(x, y) {
        const rec = ((farm().bushes || {})[$gameMap.mapId()] || {})[key(x, y)], day = today(), fruit = seasonIndex(day) !== 3;
        if (!rec) return fruit ? "full" : "empty";
        if (rec.stage === "gone") return day - rec.day >= 8 ? (fruit ? "full" : "empty") : "gone";
        return day - rec.day >= 4 && fruit ? "full" : "empty";
    }
    // a bush keeps the player out (a cache: the answer changes only with the day, a pick or a building)
    const bushCache = new Map();
    function bushSolid(x, y, mapId) {
        if (gatherKindOf(x, y) !== "bush") return false;
        const stamp = today() + ":" + stoneRev + ":" + farm().rev, k = mapId + ":" + x + "," + y, c = bushCache.get(k);
        if (c && c.stamp === stamp) return c.solid;
        const solid = !!(mapId === $gameMap.mapId() && gatherAt(x, y) === "bush");
        bushCache.set(k, { stamp, solid });
        return solid;
    }
    // the kind that lies on a tile (in this season), false, or undefined while the ground pictures are still loading
    function gatherSpot(x, y) {
        const kind = gatherKindOf(x, y);
        if (!kind) return false;
        if (!$gameMap.isValid(x, y) || !AUTO_GROUND || !mapAllowsFarming()) return false;
        if (BLOCK_REGION > 0 && $gameMap.regionId(x, y) === BLOCK_REGION) return false;
        if (!$gameMap.checkPassage(x, y, 0x0f)) return false;
        if ($gameMap.eventsXy(x, y).length > 0 || hasObjectTile(x, y)) return false;
        if ((farm().plots[$gameMap.mapId()] || {})[key(x, y)] || buildingAt(x, y)) return false;   // cleared or built-on ground has none
        const g = GATHER[kind];
        if (g.seasons && !g.seasons.includes(seasonIndex(today()))) return false;
        if (kind === "mushroom" && mushroomChance(today()) <= 0 && mushroomBirth(x, y) === null) return false;
        const ground = groundInfoAt(x, y);
        if (ground === undefined) return undefined;
        return ground && ground.kind ? kind : false;
    }
    function gatherAt(x, y) {
        const kind = gatherSpot(x, y);
        if (!kind) return false;
        if (kind === "bush") return bushState(x, y) === "gone" ? false : "bush";
        const picked = ((farm().stones || {})[$gameMap.mapId()] || {})[key(x, y)];
        if (kind === "mushroom") {
            const born = mushroomBirth(x, y);
            return born !== null && (picked === undefined || born > picked) ? kind : false;
        }
        return picked === undefined || today() - picked >= GATHER[kind].respawn ? kind : false;
    }
    // the small-stone view of the same thing (kept for events and tests)
    function stoneSpot(x, y) {
        const kind = gatherSpot(x, y);
        return kind === undefined ? undefined : kind === "stone";
    }
    const stoneAt = (x, y) => gatherAt(x, y) === "stone";
    function pickGather(x, y) {
        const kind = gatherAt(x, y);
        if (!kind) return false;
        if (kind === "bush") return pickBush(x, y);
        const g = GATHER[kind], item = itemOf(g.item), n = rand(g.count) + (perkRoll("forage.yield") ? 1 : 0);
        if (!spaceFor(item, n)) { complainNoSpace(item); return false; }
        const sting = kind === "nettle";   // nettles sting bare hands: a little more strength, and a word about it once a day
        if (!spendStamina(foodIsFree(g.item) ? 0 : (knowsSkill("g_quick") ? 0 : STAMINA.pickup) + (sting ? 1 : 0))) return false;
        swingThen(CROUCH_KIND, () => {
            stonesOf($gameMap.mapId())[key(x, y)] = today();
            stoneRev++;
            playSe(SE.collect, 105);
            $gameParty.gainItem(item, n);
            if (g.seed && Math.random() < g.seed[1]) $gameParty.gainItem(itemOf(g.seed[0]), rand(g.seed[2]));   // (a wild vegetable: its seeds too, sometimes)
            if (sting && farm().stungDay !== today()) {
                farm().stungDay = today();
                popup(item.iconIndex, "Pokrzywa parzy! (-1 wytrzymałości)", "#ffb070");
            }
        });
        return true;
    }
    const pickStone = pickGather;
    // someone else takes what lies on a tile (the dog, Dog.js): the tile is used up as by a pick, nothing goes into the bag;
    // returns { kind, item, n } or null
    function takeGatherFor(x, y) {
        const kind = gatherAt(x, y);
        if (!kind) return null;
        if (kind === "bush") {
            const full = bushState(x, y) === "full";
            bushesOf($gameMap.mapId())[key(x, y)] = { stage: full ? "empty" : "gone", day: today() };
            stoneRev++;
            return { kind, item: full ? ITEM.berries : ITEM.fiber, n: full ? rand(GATHER.bush.count) : rand([1, 2]) };
        }
        const g = GATHER[kind];
        stonesOf($gameMap.mapId())[key(x, y)] = today();
        stoneRev++;
        return { kind, item: g.item, n: rand(g.count) };
    }
    // a bush with berries gives berries and stays bare; a bare bush gives fibre and is gone for a while
    function pickBush(x, y) {
        const full = bushState(x, y) === "full", item = itemOf(full ? ITEM.berries : ITEM.fiber), n = (full ? rand(GATHER.bush.count) : rand([1, 2])) + (perkRoll("forage.yield") ? 1 : 0);
        if (!spaceFor(item, n)) { complainNoSpace(item); return false; }
        if (!spendStamina(full && foodIsFree(ITEM.berries) ? 0 : STAMINA.pickup)) return false;
        swingThen(CROUCH_KIND, () => {
            bushesOf($gameMap.mapId())[key(x, y)] = { stage: full ? "empty" : "gone", day: today() };
            stoneRev++;
            playSe(SE.collect, full ? 108 : 95);
            $gameParty.gainItem(item, n);
            if (!full) popup(item.iconIndex, "Krzak poszedł na włókna", "#cfe6a8");
        });
        return true;
    }

    // ---- water: the can, a drink, fishing
    const canCharges = () => (farm().can ? farm().can.charges : canMax());   // a new can is full
    const setCanCharges = n => { farm().can = { charges: Math.max(0, Math.min(canMax(), n)) }; };
    function isWaterTile(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) {
            const id = $gameMap.tileId(x, y, z);
            if (id > 0 && Tilemap.isWaterTile(id)) return true;
        }
        return false;
    }
    // src: a bucket to take the water from (its portions run out); without it the water is unlimited (a pond, a well)
    const bucketEmpty = src => complain(itemOf((src && BUILDINGS[src.type].pack) || ITEM.bucket).iconIndex, (src && BUILDINGS[src.type].rain.empty) || "Wiadro jest puste");
    function fillCan(src) {
        const can = itemOf(ITEM.wateringCan);
        if (!$gameParty.hasItem(can)) { complain(can.iconIndex, "Nie masz konewki"); return false; }
        if (canCharges() >= canMax()) { complain(can.iconIndex, "Konewka jest pełna"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(src); return false; }
        swingThen(CROUCH_KIND, () => {
            let now = canMax();
            if (src) {
                const take = Math.min(canMax() - canCharges(), bucketUnits(src));
                takeBucketWater(src, take);
                now = canCharges() + take;
            }
            setCanCharges(now);
            playSe(SE.water, 100);
            popup(can.iconIndex, (now >= canMax() ? "Konewka pełna (" : "Konewka (") + now + "/" + canMax() + ")", "#9fd4ff");
        });
        return true;
    }
    const NS = () => T.api("Needs");   // (Needs.js: hunger, thirst, the waterskin)
    const needsOn = () => !!T.call("Needs", "enabled");
    const thirsty = () => needsOn() && NS().state().water < 95;
    function drink(src) {
        const tired = typeof $gameSystem.staminaRatio === "function" && $gameSystem.staminaRatio() < 0.98;
        if (!thirsty() && !(tired && !needsOn())) { complain(ICON.thirst, "Nie chce ci się pić"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(src); return false; }
        swingThen(CROUCH_KIND, () => {
            if (src) takeBucketWater(src, 1);
            if (needsOn()) {
                const got = NS().drink(drinkAmount(src));
                $gameSystem.changeStamina(3);
                playSe(SE.water, 105);
                popup(ICON.thirst, "Nawodnienie +" + got, "#9fd4ff");
            } else {
                $gameSystem.changeStamina(8);
                playSe(SE.water, 105);
                popup(ICON.stamina, "+8 wytrzymałości", "#9ff0a8");
            }
        });
        return true;
    }
    function fillSkin(src) {
        const skin = itemOf(ITEM.skin);
        if (!needsOn() || !NS().ownsSkin()) { complain(skin.iconIndex, "Potrzebujesz bukłaka"); return false; }
        if (NS().skinCharges() >= NS().SKIN.max) { complain(skin.iconIndex, "Bukłak jest pełny"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(src); return false; }
        swingThen(CROUCH_KIND, () => {
            if (src) {
                const take = Math.min(NS().SKIN.max - NS().skinCharges(), bucketUnits(src));
                takeBucketWater(src, take);
                NS().state().skin = NS().skinCharges() + take;
            } else {
                NS().fillSkin();
            }
            playSe(SE.water, 100);
            popup(skin.iconIndex, (NS().skinCharges() >= NS().SKIN.max ? "Bukłak pełny (" : "Bukłak (") + NS().skinCharges() + "/" + NS().SKIN.max + ")", "#9fd4ff");
        });
        return true;
    }
    function fillBucket(src) {
        const bucket = itemOf(ITEM.bucket), max = BUILDINGS.bucket.rain.max;
        if (!ownsBucket()) { complain(bucket.iconIndex, "Potrzebujesz wiadra"); return false; }
        if (bagWater() >= max) { complain(bucket.iconIndex, "Wiadro jest pełne"); return false; }
        if (src && bucketUnits(src) < 1) { bucketEmpty(src); return false; }
        swingThen(CROUCH_KIND, () => {
            let now = max;
            if (src) {
                const take = Math.min(max - bagWater(), bucketUnits(src));
                takeBucketWater(src, take);
                now = bagWater() + take;
            }
            setBagWater(now);
            playSe(SE.water, 100);
            popup(bucket.iconIndex, (now >= max ? "Wiadro pełne (" : "Wiadro (") + now + "/" + max + ")", "#9fd4ff");
        });
        return true;
    }
    function goFishing() {
        if (!requireItem(ITEM.rod) || !spendStamina(STAMINA.fish)) return false;
        const rod = itemOf(ITEM.rod);
        swingThen(FISH_KIND, () => {
            useTool(ITEM.rod);
            lockPlayer(130);
            playSe(SE.water, 90);
            popup(rod.iconIndex, "Zarzucasz wędkę...", "#cfe6ff");
            later(96, () => {
                const hour = T.time.hour();
                let chance = 0.5 + ((hour >= 5 && hour < 8) || (hour >= 17 && hour < 20) ? 0.25 : 0) + (["rain", "storm"].includes($gameScreen.weatherType()) ? 0.1 : 0) - (seasonIndex(today()) === 3 ? 0.2 : 0) + perk("fish");
                if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(1);
                const roll = Math.random();
                if (roll < chance) {
                    playSe(SE.harvest, 105);
                    $gameParty.gainItem(itemOf(ITEM.fish), Math.random() < 0.25 ? 2 : 1);
                } else if (roll < chance + 0.15) {
                    $gameParty.gainItem(itemOf(ITEM.fiber), 1);   // waterweed
                } else {
                    complain(rod.iconIndex, "Nic nie bierze");
                }
            });
        });
        return true;
    }
    // src: the bucket the water comes from (its portions), none for a well or a pond
    const hasWater = src => !src || bucketUnits(src) >= 1;
    const drinkAmount = src => (src && BUILDINGS[src.type].rain.drink) || (needsOn() ? NS().TAP_DRINK : 8);
    const portions = src => (src ? "\n" + (src.type === "bucket" ? "Wiadro" : BUILDINGS[src.type].name) + ": " + bucketUnits(src) + "/" + BUILDINGS[src.type].rain.max + " porcji deszczówki." : "")
        + (src && BUILDINGS[src.type].rain.wear ? " Zużycie: " + (src.uses || 0) + "/" + BUILDINGS[src.type].rain.wear + "." : "");
    function canEntry(src) {
        const can = itemOf(ITEM.wateringCan), have = $gameParty.hasItem(can);
        return { name: "Napełnij konewkę", icon: can.iconIndex, right: have ? canCharges() + "/" + canMax() : "", enabled: have && canCharges() < canMax() && hasWater(src),
            help: (have ? "Konewka mieści " + canMax() + " podlań." : "Nie masz konewki. Wykuje się ją w kuźni.") + portions(src), run: () => fillCan(src) };
    }
    function drinkEntry(src) {
        return { name: "Napij się", icon: 391, right: needsOn() ? "+" + drinkAmount(src) : "+8", enabled: (thirsty() || (!needsOn() && $gameSystem.staminaRatio() < 0.98)) && hasWater(src),
            help: (needsOn() ? "Chłodna woda gasi pragnienie (+" + drinkAmount(src) + ") i trochę odświeża." : "Chłodna woda odświeża.") + portions(src), run: () => drink(src) };
    }
    function skinEntry(src) {
        const have = needsOn() && NS().ownsSkin(), max = needsOn() ? NS().SKIN.max : 4;
        return { name: "Napełnij bukłak", icon: itemOf(ITEM.skin).iconIndex, right: have ? NS().skinCharges() + "/" + max : "", enabled: have && NS().skinCharges() < max && hasWater(src),
            help: (have ? "Bukłak mieści " + max + (max >= 2 && max <= 4 ? " łyki" : " łyków") + " po " + NS().SKIN.sip + ". Pijesz z niego klawiszem G albo z menu Przedmioty." : "Nie masz bukłaka. Zrobisz go z wyprawionej skóry (garbarnia) w menu „Wytwórz...”.") + portions(src), run: () => fillSkin(src) };
    }
    function bucketEntry(src) {
        const max = BUILDINGS.bucket.rain.max, have = ownsBucket();
        return { name: "Napełnij wiadro", icon: itemOf(ITEM.bucket).iconIndex, right: have ? bagWater() + "/" + max : "", enabled: have && bagWater() < max && hasWater(src),
            help: (have ? "Wiadro mieści " + max + " porcji wody. Potrzebne do gotowania w kociołku." : "Nie masz wiadra. Wykujesz je w kuźni z desek i żelaza.") + portions(src), run: () => fillBucket(src) };
    }
    function wellEntries() {
        return [drinkEntry(), skinEntry(), canEntry(), bucketEntry()];
    }
    // ---- a well that gives little (the town's market well - user 2026-10-05: "studnia daje, ale mało", the sołtys rations it): an
    // event with <Studnia:N> in its note lets the hero draw N times a day - a drink, the waterskin, the can, the bucket: one draw each.
    // Its page runs Farming.rationWell(this). The day's draws in the farm state (per map and event name - a well of two events counts once).
    // (+ TownQuests.wellBonus: the town's quests may give the well more - W1, the sluice half open: one draw a day more)
    function rationOf(ev) {
        const m = ev && ev.event().note && /<Studnia:\s*(\d+)\s*>/i.exec(ev.event().note);
        const more = m ? Math.max(0, Math.floor(Number(T.call("TownQuests", "wellBonus", $gameMap.mapId(), ev.event().name)) || 0)) : 0;
        return m ? { key: $gameMap.mapId() + ":" + ev.event().name, max: Number(m[1]) + more, name: ev.event().name } : null;
    }
    function rationLeft(r) {
        const rec = (farm().rations || {})[r.key];
        return rec && rec.day === today() ? Math.max(0, r.max - rec.n) : r.max;
    }
    function rationUse(r) {
        const all = farm().rations || (farm().rations = {}), rec = all[r.key];
        all[r.key] = rec && rec.day === today() ? { day: rec.day, n: rec.n + 1 } : { day: today(), n: 1 };
        changed();
    }
    function rationMenu(r) {
        const left = rationLeft(r), note = "\nStudnia daje mało - sołtys przydziela wodę: " + r.max + (r.max === 1 ? " nabranie" : " nabrania") + " na dzień. Zostało dziś: " + left + ".";
        const wrap = e => Object.assign({}, e, { enabled: e.enabled && left > 0, help: e.help + note,
            run: () => {
                if (rationLeft(r) < 1) { complain(ICON.thirst, "Na dziś koniec przydziału"); return false; }
                const ok = e.run();
                if (ok) rationUse(r);
                return ok;
            } });
        return { title: (r.name || "Studnia") + " (" + left + "/" + r.max + " na dziś)", entries: wellEntries().map(wrap) };
    }
    function rationWell(interpOrEvent) {
        const ev = interpOrEvent && typeof interpOrEvent.eventId === "function" ? $gameMap.event(interpOrEvent.eventId()) : interpOrEvent;
        const r = rationOf(ev);
        if (!r) return false;
        if (rationLeft(r) < 1) { complain(ICON.thirst, "Na dziś koniec przydziału wody"); return false; }
        const menu = rationMenu(r), scene = SceneManager._scene;
        if (scene && typeof scene.openFarmMenu === "function") scene.openFarmMenu(menu.title, menu.entries);
        return true;
    }
    // ---- the bucket: it collects rain by itself, hour by hour of the weather plan (Survival.weatherPlan), also while the player is away
    function rainHoursBetween(h0, h1) {
        const sv = T.api("Survival");
        if (!(sv && sv.weatherPlan) || !(h1 > h0)) return 0;
        let total = 0;
        const d0 = Math.floor(h0 / 24), d1 = Math.min(Math.floor(h1 / 24), d0 + 60);
        for (let day = d0; day <= d1; day++) {
            const plan = sv.weatherPlan(day);
            if (!plan || plan.type !== "rain") continue;
            const a = Math.max(h0, day * 24 + plan.start), z = Math.min(h1, day * 24 + plan.end);
            if (z > a) total += z - a;
        }
        return total;
    }
    function bucketSync(b) {
        const def = BUILDINGS[b.type];
        if (!def || !def.rain || b.site) return 0;
        const now = clockHours();
        if (b.wt === undefined || now < b.wt) b.wt = now;
        if (now > b.wt) {
            // (clay seeps - taken off first, so a pot in the rain still shows full)
            const left = Math.max(0, (b.water || 0) - (def.rain.leak ? (now - b.wt) / 24 * def.rain.leak : 0));
            b.water = Math.min(def.rain.max, left + rainHoursBetween(b.wt, now) * def.rain.rate);
            b.wt = now;
        }
        return b.water || 0;
    }
    // (a seeping clay pot loses water all the time: a hair under a whole portion - minutes of seeping - still counts as the portion)
    // (0 for what holds no rain water - a well: the dog asked it and the game stopped on "reading 'leak'", 2026-09-26)
    const bucketUnits = b => { const def = BUILDINGS[b.type]; return def && def.rain ? Math.floor(bucketSync(b) + (def.rain.leak ? 0.02 : 1e-6)) : 0; };
    function takeBucketWater(b, n) {
        b.water = Math.max(0, bucketSync(b) - n);
        const def = BUILDINGS[b.type];
        if (def.rain.wear) {
            b.uses = (b.uses || 0) + 1;
            if (b.uses >= def.rain.wear) later(20, () => crackVessel(b));
        }
        changed();
    }
    function crackVessel(b) {
        const list = buildingsOf($gameMap.mapId()), i = list.indexOf(b);
        if (i < 0) return;
        list.splice(i, 1);
        releaseGround(b, $gameMap.mapId());
        changed();
        playSe("Crash", 80);
        popup(itemOf(BUILDINGS[b.type].pack || ITEM.firedPot).iconIndex, BUILDINGS[b.type].name + " pękł", "#ffb070");
    }
    // a vessel with rain.own taken into the bag keeps its water and wear (farm().vesselBag[type] = [{ water, uses }]); set down again, it has them back
    function stowVessel(b) {
        const f = farm(), bag = f.vesselBag || (f.vesselBag = {});
        (bag[b.type] || (bag[b.type] = [])).push({ water: bucketSync(b), uses: b.uses || 0 });
    }
    function unstowVessel(b) {
        const list = (farm().vesselBag || {})[b.type];
        const rec = list && list.pop();
        if (!rec) return;
        b.water = rec.water;
        b.uses = rec.uses;
        b.wt = clockHours();
    }
    // The bucket you carry in the bag: one shared water level (like the waterskin/watering can), not tracked per
    // item copy - RPG Maker items only count how many you have, not per-instance state, and the game already
    // solves this the same way for those two.
    const ownsBucket = () => $gameParty.hasItem(itemOf(ITEM.bucket));
    const bagWater = () => farm().bagWater || 0;
    function setBagWater(n) {
        farm().bagWater = Math.max(0, Math.min(BUILDINGS.bucket.rain.max, n));
        changed();
    }
    const bagWaterWeight = () => bagWater();   // 1 weight unit per carried portion (Survival.js reads this)
    function bucketFor(x, y) {
        let best = null, bestD = 1e9;
        for (const b of buildingsOf($gameMap.mapId())) {
            if (!BUILDINGS[b.type] || !BUILDINGS[b.type].rain || b.site || bucketUnits(b) < 1) continue;
            const d = Math.max(Math.abs(b.x - x), Math.abs(b.y - y));
            if (d <= BUCKET_REACH && d < bestD) { best = b; bestD = d; }
        }
        return best;
    }
    function pourOut(b) {
        if (bucketUnits(b) < 1) return false;
        swingThen(CROUCH_KIND, () => {
            b.water = 0;
            changed();
            playSe(SE.water, 90);
            popup(itemOf(ITEM.bucket).iconIndex, "Wylano wodę", "#9fd4ff");
        });
        return true;
    }
    function bucketEntries(b) {
        const rain = BUILDINGS[b.type].rain, max = rain.max, n = bucketUnits(b);
        const icon = itemOf(BUILDINGS[b.type].pack || ITEM.bucket).iconIndex, word = rain.in || "w wiadrze";
        return [{ name: n >= 1 ? "Woda " + word + ": " + n + "/" + max : (rain.empty || "Wiadro jest puste"), icon, right: n + "/" + max, enabled: false,
                help: (n >= 1 ? "Deszczówka zebrana " + word + ". Pijesz ją, napełniasz nią konewkę i bukłak albo podlewasz rośliny w pobliżu." : "Zbiera deszcz: każda godzina deszczu to " + (rain.rate === 1 ? "jedna porcja" : String(rain.rate).replace(".", ",") + " porcji") + " (do " + max + ").")
                    + (rain.leak ? " Glina powoli ją przesącza: porcja na dobę." : "") + (rain.wear ? " Zużycie: " + (b.uses || 0) + "/" + rain.wear + " - potem pęknie." : "") },
            drinkEntry(b), skinEntry(b), canEntry(b), bucketEntry(b),
            { name: "Wylej wodę", icon, enabled: n >= 1, help: "Wylewasz wodę na ziemię.", run: () => pourOut(b) }];
    }
    function waterMenu() {
        const rod = itemOf(ITEM.rod), have = $gameParty.hasItem(rod);
        return { title: "Woda", entries: [
            { name: "Zarzuć wędkę", icon: rod.iconIndex, right: "-" + STAMINA.fish, enabled: have,
                help: have ? "Ryby biorą najlepiej o świcie i o zmierzchu. Wędkowanie trwa około godziny." : "Potrzebujesz wędki. Robi się ją przy tartaku.", run: goFishing },
            drinkEntry(), skinEntry(), canEntry(), bucketEntry()] };
    }
    // rain waters every tilled plot
    function rainWater() {
        const plots = farm().plots || {};
        for (const mapId of Object.keys(plots)) {
            for (const k of Object.keys(plots[mapId])) {
                if (plots[mapId][k].s === "tilled") plots[mapId][k].watered = today();
            }
        }
        changed();
    }

    // ---- growth
    function scarecrowNear(x, y) {
        return buildingsOf($gameMap.mapId()).some(b => b.type === "scarecrow" && !b.site &&
            Math.abs(b.x - x) <= SCARECROW_RANGE && Math.abs(b.y - y) <= SCARECROW_RANGE);
    }
    // watered today or on the day before still gets the bonus - a day's grace so
    // missing one watering does not immediately undo it
    function wateredRecently(plot) {
        return !!plot && plot.watered !== undefined && today() - plot.watered <= WATER_GRACE_DAYS + Math.round(perk("water.days"));
    }
    // plot is optional: callers that only care about the location (e.g. deciding
    // whether to build a scarecrow) can leave it out and get no watering bonus.
    function growthRate(x, y, plot) {
        return GROWTH * (scarecrowNear(x, y) ? SCARECROW_BONUS : 1) * (wateredRecently(plot) ? WATER_BONUS : 1) * (1 + perk("crop.growth"));
    }
    function grownDays(x, y, plot) {
        return Math.floor(Math.max(0, today() - plot.day) * growthRate(x, y, plot));
    }
    function isRipe(x, y, plot) {
        return !!plot.crop && grownDays(x, y, plot) >= CROPS[plot.crop].days;
    }
    // 0 just sown, 1 sprout, 2 growing, 3 ripe
    function cropStage(x, y, plot) {
        const def = CROPS[plot.crop], days = grownDays(x, y, plot);
        if (days >= def.days) return 3;
        return Math.min(2, Math.floor(days / def.days * 3));
    }
    function daysLeft(x, y, plot) {
        const def = CROPS[plot.crop], rate = growthRate(x, y, plot);
        const elapsed = Math.max(0, today() - plot.day) * rate;
        return Math.max(1, Math.ceil((def.days - elapsed) / rate));
    }

    // ------------------------------------------------------------------
    // Actions. Each one checks tool / materials / stamina itself and returns
    // true when it went ahead.
    // ------------------------------------------------------------------
    function rake(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.s !== "cleared" || !requireItem(ITEM.rake) || !spendStamina(farmCost(STAMINA.rake))) return false;
        swingThen(RAKE_KIND, () => {
            useTool(ITEM.rake);
            const raked = ensurePlot(x, y);
            raked.s = "raked";
            delete raked.dug;   // the raking levels a pit
            changed();
            playSe(SE.rake, 95 + Math.floor(Math.random() * 10));
            fx(x, y, "dirt", false);
            if (Math.random() < SEED_CHANCE) {
                const found = CROPS[CROP_IDS[Math.floor(Math.random() * CROP_IDS.length)]];
                $gameParty.gainItem(itemOf(found.seed), 1);
            }
        });
        return true;
    }

    function till(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.s !== "raked" || !requireItem(ITEM.hoe) || !spendStamina(farmCost(STAMINA.hoe))) return false;
        swingThen(HOE_KIND, () => {
            useTool(ITEM.hoe);
            const stored = ensurePlot(x, y);
            stored.s = "tilled";
            stored.crop = null;
            changed();
            playSe(SE.hoe, 95 + Math.floor(Math.random() * 10));
            fx(x, y, "dirt", true);
        });
        return true;
    }

    function plant(x, y, cropId) {
        const plot = plotAt(x, y), def = CROPS[cropId];
        if (!plot || plot.s !== "tilled" || plot.crop || !def) return false;
        if (def.seasons && !def.seasons.includes(seasonIndex(today()))) {
            complain(itemOf(def.seed).iconIndex, def.name + " nie sadzi się o tej porze roku (" + seasonOf(today()) + ")");
            return false;
        }
        if (countOf(def.seed) < 1) { complain(itemOf(def.seed).iconIndex, "Brak nasion: " + itemOf(def.seed).name); return false; }
        if (!spendStamina(farmCost(STAMINA.plant))) return false;
        $gameParty.loseItem(itemOf(def.seed), 1, false);
        swingThen(CROUCH_KIND, () => {
            const stored = ensurePlot(x, y);
            stored.crop = cropId;
            stored.day = today();
            changed();
            playSe(SE.plant, 105);
        });
        return true;
    }

    function harvest(x, y) {
        const plot = plotAt(x, y);
        if (!plot || !plot.crop || !isRipe(x, y, plot) || !spendStamina(foodIsFree(CROPS[plot.crop].produce) ? 0 : farmCost(STAMINA.harvest))) return false;
        const def = CROPS[plot.crop], crop = plot.crop;
        swingThen(CROUCH_KIND, () => {
            plot.crop = null;
            delete plot.day;
            changed();
            playSe(SE.harvest, 100);
            fx(x, y, "leaf", false);
            let n = rand(def.yield);
            if (perkRoll("crop.yield")) n++;   // (Rolnictwo: Obfite zbiory, Złoty plon, Nasiennik)
            if (perkRoll("crop.double")) n *= 2;
            $gameParty.gainItem(itemOf(def.produce), n);
            const seeds = rand(def.seeds) + (perkRoll("seed.chance") ? 1 : 0);
            if (seeds > 0) $gameParty.gainItem(itemOf(def.seed), seeds);
            T.emit("harvest", { crop, item: def.produce, n, seeds, x, y, mapId: $gameMap.mapId() });
        });
        return true;
    }

    function uproot(x, y) {
        const plot = plotAt(x, y);
        if (!plot || !plot.crop) return false;
        swingThen(CROUCH_KIND, () => {
            plot.crop = null;
            delete plot.day;
            changed();
            playSe(SE.uproot, 110);
            fx(x, y, "dirt", false);
        });
        return true;
    }

    // Watering gives a growth bonus for today and tomorrow (see wateredRecently).
    // Works on any tilled plot, sown or not, so the ground can be pre-watered.
    function water(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.s !== "tilled") return false;
        const canOk = $gameParty.hasItem(itemOf(ITEM.wateringCan)) && canCharges() > 0;
        const bucket = canOk ? null : bucketFor(x, y);   // no (or an empty) can: a bucket with rain water close by will do
        if (!bucket) {
            if (!requireItem(ITEM.wateringCan)) return false;
            if (canCharges() <= 0) { complain(itemOf(ITEM.wateringCan).iconIndex, "Konewka jest pusta. Napełnij ją w studni albo w stawie."); return false; }
        }
        if (!spendStamina(farmCost(STAMINA.water))) return false;
        swingThen(CROUCH_KIND, () => {
            if (bucket) takeBucketWater(bucket, 1); else setCanCharges(canCharges() - 1);
            ensurePlot(x, y).watered = today();
            changed();
            playSe(SE.water, 100);
            fx(x, y, "dirt", false);
        });
        return true;
    }

    // Soil comes out of any cleared or raked ground (also plain grass) with the shovel.
    function dig(x, y) {
        const plot = plotAt(x, y);
        if (!plot || plot.crop || (plot.s !== "cleared" && plot.s !== "raked")) return false;
        if (!requireItem(ITEM.shovel)) return false;
        const soil = itemOf(ITEM.soil);
        if ($gameParty.maxItems(soil) - countOf(ITEM.soil) < 1) { complain(soil.iconIndex, "Masz już dość ziemi"); return false; }
        if (!spendStamina(farmCost(STAMINA.dig))) return false;
        swingThen(SHOVEL_KIND, () => {
            useTool(ITEM.shovel);
            const stored = ensurePlot(x, y);
            if (stored.s === "raked") stored.s = "cleared";   // the rake marks are dug up
            stored.dug = Math.min(3, (stored.dug || 0) + 1);   // a pit: the ground shows that soil was taken (deeper with every shovelful, up to 3)
            changed();
            playSe(SE.dig, 95 + Math.floor(Math.random() * 10));
            fx(x, y, "dirt", false);
            $gameParty.gainItem(soil, rand(DIG_YIELD));
        });
        return true;
    }

    // ---- wet clay: dug with the shovel out of a puddle after rain (Puddles.js keeps the water and how much clay a puddle has left)
    function digClay(x, y) {
        const puddle = T.call("Puddles", "at", x, y);
        const clay = itemOf(ITEM.clay);
        if (!puddle) return false;
        if (T.api("Puddles").clayLeft(puddle.hollow) <= 0) { complain(clay.iconIndex, "Gliny tu już nie ma"); return false; }
        if (!requireItem(ITEM.shovel)) return false;
        if ($gameParty.maxItems(clay) - countOf(ITEM.clay) < 1) { complain(clay.iconIndex, "Masz już dość gliny"); return false; }
        if (!spendStamina(farmCost(STAMINA.dig))) return false;
        swingThen(SHOVEL_KIND, () => {
            useTool(ITEM.shovel);
            T.api("Puddles").takeClay(puddle.hollow);
            playSe(SE.dig, 80 + Math.floor(Math.random() * 10));
            fx(x, y, "dirt", false);
            $gameParty.gainItem(clay, rand(CLAY_YIELD));
        });
        return true;
    }
    // ---- a clay pot drying where it was set down: how far dry (0..1) - the hours since it was put there, less the hours of rain on it
    function potDryness(b) {
        const def = geoOf(b);
        if (!def || !def.dry || !hasClock()) return 0;
        const now = clockHours();
        if (b.dryFrom === undefined || now < b.dryFrom) { b.dryFrom = now; changed(); }
        const rain = weatherHere() ? rainHoursBetween(b.dryFrom, now) : 0;   // (under a roof - the hut - no rain on it)
        return Math.max(0, Math.min(1, (now - b.dryFrom - rain) / def.dry.hours));
    }
    const potHoursLeft = b => Math.max(1, Math.ceil((1 - potDryness(b)) * geoOf(b).dry.hours));
    // ---- the shelter's table: raw pots dry there under the roof, the rain does not reach them. b.pots = [{ from: clock hour }]
    const tablePots = b => b.pots || (b.pots = []);
    const tablePotDry = (b, p) => hasClock() && clockHours() - p.from >= geoOf(b).table.hours;
    const tablePotHoursLeft = (b, p) => Math.max(1, Math.ceil(geoOf(b).table.hours - (clockHours() - p.from)));
    function putPotOnTable(b) {
        const def = geoOf(b), raw = itemOf(ITEM.rawPot);
        if (!def.table) return false;
        if (tablePots(b).length >= def.table.slots) { complain(raw.iconIndex, "Na stole nie ma już miejsca"); return false; }
        if (countOf(ITEM.rawPot) < 1) { complain(raw.iconIndex, "Nie masz surowego garnka"); return false; }
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            if (countOf(ITEM.rawPot) < 1 || tablePots(b).length >= def.table.slots) return;
            $gameParty.loseItem(raw, 1);
            tablePots(b).push({ from: clockHours() });
            changed();
            playSe("Equip1", 90);
            popup(raw.iconIndex, "Garnek na stole: schnie pod dachem", "#cfe6a8");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    // one pot off the table: dry = a dried one (for the kiln), otherwise one still drying (it comes back raw)
    function takeTablePot(b, dry) {
        const p = tablePots(b).find(p => tablePotDry(b, p) === !!dry);
        if (!p) return false;
        const item = itemOf(dry ? ITEM.dryPot : ITEM.rawPot);
        if (!spaceFor(item, 1)) { complainNoSpace(item); return false; }
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const i = tablePots(b).indexOf(p);
            if (i < 0) return;
            tablePots(b).splice(i, 1);
            $gameParty.gainItem(item, 1);
            changed();
            playSe("Equip1", 100);
            popup(item.iconIndex, "Zabrano: " + item.name, "#f3e0a0");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    function tableEntries(b) {
        const def = geoOf(b), pots = tablePots(b), dryN = pots.filter(p => tablePotDry(b, p)).length, wetN = pots.length - dryN;
        const raw = itemOf(ITEM.rawPot), dried = itemOf(ITEM.dryPot), have = countOf(ITEM.rawPot);
        const out = [{ name: "Postaw garnek na stole", icon: raw.iconIndex, right: pots.length + "/" + def.table.slots, enabled: pots.length < def.table.slots && have > 0,
            help: pots.length >= def.table.slots ? "Stół jest pełny (" + def.table.slots + " garnki). Zabierz te, które wyschły."
                : have > 0 ? "Stawiasz surowy garnek na stole (masz " + have + "). Pod dachem schnie " + def.table.hours + " godz. - także w deszczu."
                : "Nie masz surowego garnka. Ulepisz go na Warsztacie z mokrej gliny.",
            run: () => putPotOnTable(b) }];
        if (dryN) out.push({ name: "Zabierz wysuszony garnek", icon: dried.iconIndex, right: "×" + dryN,
            help: "Zabierasz jeden wysuszony garnek (na stole suchych: " + dryN + "). Teraz trzeba go wypalić w piecu.", run: () => takeTablePot(b, true) });
        if (wetN) {
            const soonest = Math.min(...pots.filter(p => !tablePotDry(b, p)).map(p => tablePotHoursLeft(b, p)));
            out.push({ name: "Zabierz mokry garnek", icon: raw.iconIndex, right: "×" + wetN,
                help: "Zabierasz jeden garnek, który jeszcze schnie (mokrych: " + wetN + ", najbliższy wyschnie za ~" + soonest + " godz.). Zabrany teraz zostanie surowym garnkiem.", run: () => takeTablePot(b, false) });
        }
        return out;
    }
    function takePot(b) {
        if (!b || !geoOf(b).dry) return false;
        const dry = potDryness(b) >= 1, item = itemOf(dry ? ITEM.dryPot : ITEM.rawPot);
        if (!spaceFor(item, 1)) { complainNoSpace(item); return false; }
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const list = buildingsOf($gameMap.mapId());
            if (list.indexOf(b) < 0) return;
            list.splice(list.indexOf(b), 1);
            releaseGround(b, $gameMap.mapId());
            changed();
            $gameParty.gainItem(item, 1);
            playSe("Equip1", 100);
            popup(item.iconIndex, "Zabrano: " + item.name, "#f3e0a0");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    function potEntries(b) {
        const dry = potDryness(b) >= 1, item = itemOf(dry ? ITEM.dryPot : ITEM.rawPot);
        return [{ name: dry ? "Zabierz wysuszony garnek" : "Zabierz garnek", icon: item.iconIndex,
            help: dry ? "Garnek wysechł na kość. Zabierasz go: teraz trzeba go wypalić w piecu, żeby trzymał wodę."
                : "Garnek jest jeszcze miękki: schnie jeszcze około " + potHoursLeft(b) + " godz. suchej pogody (kiedy pada, nie schnie). Zabrany teraz zostanie surowym garnkiem i zacznie schnąć od nowa, gdy go znów postawisz.",
            run: () => takePot(b) }];
    }
    function clayEntry(x, y, puddle) {
        const left = T.api("Puddles").clayLeft(puddle.hollow), clay = itemOf(ITEM.clay);
        return { name: "Wykop glinę", icon: clay.iconIndex, right: "-" + STAMINA.dig, enabled: left > 0,
            help: left > 0 ? "Łopata. Spod wody wybierasz mokrą, lepką glinę (" + CLAY_YIELD[0] + "-" + CLAY_YIELD[1] + "). Z tej kałuży wykopiesz ją jeszcze " + left + (left === 1 ? " raz." : " razy.") + " Masz teraz: " + countOf(ITEM.clay) + "."
                : "Gliny tu już nie ma - wybrałeś ją całą. Po następnym deszczu kałuże zbiorą się w innych miejscach.",
            tip: "Glina leży tam, gdzie po deszczu stoi woda: nie przepuszcza jej, więc tworzą się na niej kałuże.",
            run: () => digClay(x, y) };
    }


    // after a load or a new game (Farming.js asks): what is worked out from the saved state is worked out afresh - the bushes in the
    // way, the cones under the pines, and the drawing layer's counter (Farming_Render.js draws what lies about anew)
    function freshCaches() {
        bushCache.clear();
        coneCache = { stamp: "", tiles: new Set() };
        stoneRev++;
    }

    P.plots = { isSoilTile, groundInfoAt, groundIsSoil, hasObjectTile, naturalFarmland, plotAt, claimGround, releaseGround,
        gatherRev, gatherKindOf, mushroomChance, mushroomBirth, bushState, bushSolid, gatherSpot, gatherAt, stoneSpot, stoneAt,
        pickGather, pickStone, takeGatherFor, canCharges, isWaterTile, fillCan, needsOn, drink, fillSkin, goFishing, wellEntries,
        rationWell, rationLeft, rationOf,
        rainHoursBetween, bucketSync, bucketUnits, takeBucketWater, stowVessel, unstowVessel, ownsBucket, bagWater, setBagWater,
        bagWaterWeight, bucketFor, bucketEntries, waterMenu, rainWater, wateredRecently, growthRate, isRipe, cropStage, daysLeft,
        rake, till, plant, harvest, uproot, water, dig, digClay, potDryness, potHoursLeft, tablePots, tablePotDry,
        tablePotHoursLeft, putPotOnTable, takeTablePot, tableEntries, takePot, potEntries, clayEntry, freshCaches };
})();
