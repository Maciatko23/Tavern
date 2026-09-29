//=============================================================================
// Farming_Build.js
//=============================================================================
// Building (split out of Farming.js, 2026-09-29): where a building may stand, the building sites and the hammer, what goes up at
// once (the tent, the bucket, the bedroll), upgrades, taking down, what the animals and the hive give, the snares and their bait,
// the hut (its door and its furniture), placing a building with the walk to the spot, resting (the grass, a bench, a fire) and a
// night's sleep outdoors.
// Functions and classes only: Farming.js holds every engine hook.

/*:
 * @target MZ
 * @plugindesc Budowanie (część Farming.js): gdzie wolno stawiać, plac budowy i młotek, rzeczy stawiane od razu, rozbudowa, rozbiórka, zbiory z budynków, pułapki, chatka, stawianie z podejściem na miejsce, odpoczynek i sen. Sama nic nie robi - parametry i haki ma Farming.js. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Farming
 * @orderAfter Farming
 *
 * @help
 * ============================================================================
 * Farming_Build.js - budowanie
 * ============================================================================
 * Część Farming.js (wydzielona z niego): gdzie wolno budować, plac budowy
 * i uderzenia młotkiem, rzeczy stawiane od razu (namiot, wiadro,
 * legowisko), rozbudowa, rozbiórka, zbiory z budynków (jajka, miód,
 * mleko), pułapki i przynęta, chatka (drzwi i meble), stawianie budynku z
 * podejściem na miejsce, odpoczynek (trawa, ławka, ogień) i sen w terenie.
 * Sama nic nie robi: woła ją Farming.js. Parametry ma Farming.js.
 *
 * KOLEJNOŚĆ: Farming, Farming_Plots, Farming_Build, Farming_Stations,
 * Farming_UI (potem Farming_Render). Dopóki nie jest wpisana na listę
 * wtyczek, Farming.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Farming_Build.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Farming_parts") || T.register("Farming_parts", {});
    if (P.build) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("Farming_Build.js: musi być pod Farming.js na liście wtyczek (Farming.js is missing or below)");
    const SCENE = {};   // the methods Farming.js puts on Scene_Map (their bodies)
    const { PL, S, UI, link, tellBuild, num, ITEM, ICON, STAMINA, seasonIndex, CROUCH_KIND, SIT_KIND, HAMMER_KIND, SE, GROUND_REST,
        GROUND_REST_WET, REST_HOURS_A_SECOND, SLEEP_DEBT_HOURS, SLEEP_CAP, BUILDINGS, BUILD_MAPS, farm, today, key, buildingsOf,
        changed, HUT_MAP, HUT_ROOM, isHutInterior, hutFloor, hutOf, hutDoorCell, mirrorGeo, geoOf, cellsOfGeo, buildingAt, itemOf,
        countOf, popup, complain, spaceFor, complainNoSpace, playSe, spendStamina, perk, perkRoll, useTool, requireItem, fx, later,
        lockPlayer, swingThen, NO_BUILD, missingOf, hasClock, clockHours, rainingHere, hoursText, costRows, targetTile,
        MENU_MARGIN, BUILD_RANGE } = P.core;
    const [hasObjectTile, plotAt, claimGround, releaseGround, bucketUnits, stowVessel, unstowVessel, bagWater, setBagWater] =
        link(PL, ["hasObjectTile", "plotAt", "claimGround", "releaseGround", "bucketUnits", "stowVessel", "unstowVessel",
            "bagWater", "setBagWater"]);
    const [jobReady, fuelLeft, fireLit, fireOutText, takeReadyFirst, isChest, chestStacks, chestKinds, takeFromChest] =
        link(S, ["jobReady", "fuelLeft", "fireLit", "fireOutText", "takeReadyFirst", "isChest", "chestStacks", "chestKinds",
            "takeFromChest"]);
    const [hammerMissing, handMenuEntry] =
        link(UI, ["hammerMissing", "handMenuEntry"]);

    // ---- the hut's furniture (the hut's map and floor, hutOf and its door: Farming.js)
    // would the furniture leave the player without a way to the doormat? (a 4-neighbour walk over the floor)
    function hutShutsIn(type, x, y) {
        const px = $gamePlayer.x, py = $gamePlayer.y;
        if (px < HUT_ROOM.x0 || px > HUT_ROOM.x1 || py < HUT_ROOM.y0 || py > HUT_ROOM.y1) return false;
        const blocked = new Set(cellsOfGeo(BUILDINGS[type], x, y).map(c => key(c.x, c.y)));
        for (const b of farm().buildings[HUT_MAP] || []) for (const c of cellsOfGeo(geoOf(b), b.x, b.y)) blocked.add(key(c.x, c.y));
        const seen = new Set([key($gamePlayer.x, $gamePlayer.y)]), queue = [[$gamePlayer.x, $gamePlayer.y]];
        while (queue.length) {
            const [cx, cy] = queue.shift();
            if (cx === HUT_ROOM.doorX && cy === HUT_ROOM.y1) return false;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = cx + dx, ny = cy + dy, k = key(nx, ny);
                if (nx < HUT_ROOM.x0 || nx > HUT_ROOM.x1 || ny < HUT_ROOM.y0 || ny > HUT_ROOM.y1 || seen.has(k) || blocked.has(k)) continue;
                seen.add(k);
                queue.push([nx, ny]);
            }
        }
        return true;
    }
    // furniture that stands where the floor is no longer (an older, smaller room) goes back to the bag, chests emptied first
    function hutSanitize(say) {
        const list = farm().buildings[HUT_MAP];
        if (!list || !list.length) return;
        let moved = 0;
        for (const b of list.slice()) {
            const g = geoOf(b);
            if (cellsOfGeo(g, b.x, b.y).every(c => hutFloor(c.x, c.y))) continue;
            for (const s of isChest(b) ? chestStacks(b) : []) takeFromChest(b, s.item, s.n);
            if (isChest(b) && chestKinds(b) > 0) continue;   // the bag is full: leave it, nothing is lost
            for (const [id, n] of g.cost) $gameParty.gainItem(itemOf(id), n);
            list.splice(list.indexOf(b), 1);
            moved++;
        }
        if (moved) {
            changed();
            if (say) popup(itemOf(ITEM.planks).iconIndex, "Meble z chatki wróciły do plecaka", "#f3e0a0");
        }
    }
    // ---- building
    // where the player may build (the user's, 2026-09-27: "Gracz może budować tylko na polu dziadka, ale zbierać rzeczy może z każdej
    // mapy - pułapki jako jedyne można na każdej mapie"): the maps of BUILD_MAPS (Farming_Data.js: the grandfather's field, the hut), or a
    // map whose note says <Build:on> (<Build:off> forbids it on a listed one); a building marked anywhere, or with lure (the snare), goes
    // up on any map. The F9 placer (free) ignores it.
    function mapAllowsBuilding(mapId) {
        mapId = mapId === undefined ? $gameMap.mapId() : mapId;
        if (mapId === $gameMap.mapId() && $dataMap) {
            const tag = T.mapFlag("Build", null, "first");
            if (tag !== null) return tag;
        }
        return BUILD_MAPS.includes(mapId);
    }
    const buildsAnywhere = def => !!def && !!(def.anywhere || def.lure);
    const mayBuildHere = type => buildsAnywhere(BUILDINGS[type]) || mapAllowsBuilding();
    function tilesOfBuilding(type, x, y) {
        return cellsOfGeo(BUILDINGS[type], x, y);
    }
    function tileIsFree(x, y) {
        return $gameMap.eventsXy(x, y).every(e => !e.isNormalPriority()) &&
            !($gamePlayer.x === x && $gamePlayer.y === y);
    }
    // null when it can be built there, otherwise the reason. type: the building being placed (a dug-out pit is fine under a well, which needs one)
    // free: the F9 placer (Debug.js) - no cleared ground needed, only somewhere a building can stand (walkable, no tree or rock tile)
    function tileWhyNot(x, y, type, free) {
        if (!$gameMap.isValid(x, y)) return "Tu się nie zmieści.";
        if (isHutInterior() && !hutFloor(x, y)) return x === HUT_ROOM.doorX && (y === HUT_ROOM.y1 || y === HUT_ROOM.doorY) ? "Zostaw przejście do drzwi." : "Tu się nie zmieści.";
        const h = hutOf();
        if (h && !isHutInterior() && h.mapId === $gameMap.mapId()) {
            const d = hutDoorCell(h);
            if (x === d.x && y === d.y + 1) return "Zostaw wejście do chatki.";
        }
        const plot = plotAt(x, y);
        if (!plot && !free) return "Trzeba oczyszczonej ziemi.";
        if (!plot && (!$gameMap.checkPassage(x, y, 0x0f) || hasObjectTile(x, y))) return "Tu nic nie stanie.";
        if (plot && plot.s === "tilled") return "Zaoranej ziemi nie zabudujesz.";
        if (plot && plot.dug && type !== "well" && !free) return "Najpierw zagrab dół.";
        if (buildingAt(x, y)) return "Tu już coś stoi.";
        if (!tileIsFree(x, y)) return "Coś tu stoi.";
        return null;
    }
    // a 2x2 block, entirely within the given cells, dug to the bottom (depth 3): what a well needs under it
    function has2x2Pit(cells) {
        const set = new Set(cells.map(c => key(c.x, c.y)));
        for (const c of cells) {
            const corners = [[c.x, c.y], [c.x + 1, c.y], [c.x, c.y + 1], [c.x + 1, c.y + 1]];
            if (!corners.every(([cx, cy]) => set.has(key(cx, cy)))) continue;
            if (corners.every(([cx, cy]) => (plotAt(cx, cy) || {}).dug === 3)) return true;
        }
        return false;
    }
    function whyNotBuild(type, x, y, flip, free) {
        const def = flip ? mirrorGeo(BUILDINGS[type]) : BUILDINGS[type];
        if (!free && !mayBuildHere(type)) return NO_BUILD + ".";
        if (def.single && hutOf()) return "Masz już chatkę.";
        if (isHutInterior() && !def.indoor) return "Tego nie postawisz w chatce.";
        if (isHutInterior() && hutShutsIn(type, x, y)) return "Zablokowałbyś sobie wyjście.";
        if (def.indoorOnly && !isHutInterior()) return "To stawia się tylko w chatce.";
        if (def.door) {   // the way to the door must stay open
            const fx = x + def.door.dx, fy = y + 1;
            if (!$gameMap.isValid(fx, fy) || !$gameMap.checkPassage(fx, fy, 0x0f) || buildingAt(fx, fy) || hasObjectTile(fx, fy)) return "Przed drzwiami musi być wolne miejsce.";
        }
        for (const t of tilesOfBuilding(type, x, y)) {
            const why = tileWhyNot(t.x, t.y, type, free);
            if (why) return why;
        }
        if (type === "well" && !free && !has2x2Pit(tilesOfBuilding(type, x, y))) return "Potrzebny dół 2×2 wykopany do dna (poziom 3) w miejscu studni.";
        return null;
    }
    function missingMaterials(type) {
        return missingOf(BUILDINGS[type].cost);
    }
    function build(type, x, y, flip) {
        const def = BUILDINGS[type];
        if (!def) return false;
        const why = whyNotBuild(type, x, y, flip);
        if (why) { complain(itemOf(ITEM.wood).iconIndex, why); return false; }
        const missing = missingMaterials(type);
        if (missing.length > 0) { const m = itemOf(missing[0][0]); complain(m.iconIndex, "Brakuje: " + m.name); return false; }
        if (!spendStamina(def.stamina)) return false;
        for (const [id, n] of def.cost) $gameParty.loseItem(itemOf(id), n, false);
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const fresh = claimGround(tilesOfBuilding(type, x, y));
            const b = Object.assign({ id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh }, flip ? { flip: true } : {});
            if (def.rain && def.rain.own) unstowVessel(b);
            buildingsOf($gameMap.mapId()).push(b);
            changed();
            playSe(SE.build, 100);
            later(10, () => playSe(SE.build, 90));
            later(20, () => playSe(SE.build, 105));
            fx(x, y, "wood", true);
            tellBuild(b, true, "direct");
            if (!crouched) lockPlayer(30);   // the crouch already keeps the player busy
        });
        return true;
    }
    // ---- building sites. Choosing a place only marks it: the materials are delivered right away, but
    // nothing stands there yet. The player has to come with a hammer and strike (the action button, one
    // swing each, costing stamina) until the building is done; the blueprint fills up from the bottom.
    const hitsNeeded = def => def.hits || Math.max(2, Math.ceil(def.stamina / Math.max(1, STAMINA.buildHit)));
    // with the Budownictwo skills: fewer blows, and less strength for each
    const siteHits = def => Math.max(1, Math.round(hitsNeeded(def) * (1 - Math.min(0.75, perk("build.hits")))));
    const hitCost = () => Math.round(STAMINA.buildHit * (1 - Math.min(0.8, perk("build.cost"))) * 10) / 10;
    // A building without a site (the tent): the item goes in, it stands at once and no hammer is needed.
    function pitchInstant(type, x, y, flip) {
        const def = BUILDINGS[type];
        const why = whyNotBuild(type, x, y, flip);
        const iconItem = itemOf(def.pack || def.cost[0][0]);
        if (why) { complain(iconItem.iconIndex, why); return false; }
        const missing = missingMaterials(type);
        if (missing.length > 0) { complain(iconItem.iconIndex, "Brakuje: " + itemOf(missing[0][0]).name); return false; }
        if (!spendStamina(def.stamina)) return false;
        for (const [id, n] of def.cost) $gameParty.loseItem(itemOf(id), n, false);
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const fresh = claimGround(tilesOfBuilding(type, x, y));
            const carryWater = def.rain ? bagWater() : 0;   // the bucket you place keeps the water you were carrying in it
            const b = Object.assign({ id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh }, def.rain ? { water: carryWater, wt: clockHours() } : {}, flip ? { flip: true } : {});
            buildingsOf($gameMap.mapId()).push(b);
            if (carryWater > 0) setBagWater(0);
            changed();
            playSe("Equip2", 100);
            later(12, () => playSe("Equip2", 85));
            popup(iconItem.iconIndex, "Rozstawiono: " + def.name, "#f3e0a0");
            tellBuild(b, true, "instant");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    // room for a building around an existing one (its own tile is not counted): free, passable ground, nothing sown or ploughed
    function roomFor(type, x, y, ignoreX, ignoreY) {
        for (const t of tilesOfBuilding(type, x, y)) {
            if (t.x === ignoreX && t.y === ignoreY) continue;
            const plot = plotAt(t.x, t.y);
            if (!$gameMap.isValid(t.x, t.y) || !$gameMap.checkPassage(t.x, t.y, 0x0f) || buildingAt(t.x, t.y) || !tileIsFree(t.x, t.y) || hasObjectTile(t.x, t.y)) return false;
            if (plot && (plot.s === "tilled" || plot.crop)) return false;
        }
        return true;
    }
    // The campfire grows into a cauldron: the fire (and its stones) stay where they are, the cauldron is built around them
    function upgradeBuilding(b) {
        const up = (geoOf(b) || {}).upgrade;
        if (!up) return false;
        const target = BUILDINGS[up.to], first = itemOf(up.cost[0][0]);
        if (b.job && !jobReady(b)) { complain(first.iconIndex, "Najpierw zbierz z ognia"); return false; }   // (still cooking)
        const missing = up.cost.filter(([id, n]) => countOf(id) < n);
        if (missing.length > 0) { complain(itemOf(missing[0][0]).iconIndex, "Potrzebujesz: " + itemOf(missing[0][0]).name); return false; }
        if (up.tool && !requireItem(up.tool)) return false;
        const ax = b.x - up.dx, ay = b.y;   // the fire is the tile up.dx from the left end of the bottom row of what is built around it
        if (!roomFor(up.to, ax, ay, b.x, b.y)) { complain(itemOf(ITEM.stone).iconIndex, "Za mało miejsca wokół ogniska"); return false; }
        if (!takeReadyFirst(b)) return false;   // (what is done on the fire: into the bag first)
        if (!spendStamina(up.stamina)) return false;
        for (const [id, n] of up.cost) $gameParty.loseItem(itemOf(id), n, false);
        swingThen(up.tool === ITEM.hammer ? HAMMER_KIND : CROUCH_KIND, () => {
            if (up.tool) useTool(up.tool);
            const list = buildingsOf($gameMap.mapId());
            const at = list.indexOf(b);
            if (at < 0) return;
            list.splice(at, 1);
            const fresh = (b.claimed || []).concat(claimGround(tilesOfBuilding(up.to, ax, ay)));
            const fuel = {};   // the same fire, still burning down (or put out)
            if (b.fuel !== undefined) { fuelLeft(b); for (const k of ["fuel", "fuelSince", "outAt", "soaked", "rainOut", "rainSeen"]) if (b[k] !== undefined) fuel[k] = b[k]; }
            const grown = Object.assign({ id: farm().nextId++, type: up.to, x: ax, y: ay, last: today(), v: 3, claimed: fresh }, b.flip ? { flip: true } : {}, fuel);
            list.push(grown);
            changed();
            playSe(SE.build, 100);
            later(10, () => playSe(SE.build, 90));
            popup(itemOf(up.tool || up.cost[0][0]).iconIndex, up.done || "Rozbudowano: " + target.name, "#9ff0a8");
            tellBuild(grown, true, "upgrade");
        });
        return true;
    }
    // like a building on the build list: the costs with what is in the bag, dimmed with "Brakuje: ..." until everything is there
    function upgradeEntry(b, def) {
        const up = def.upgrade, cost = up.cost.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ");
        const missing = missingOf(up.cost);
        const help = missing.length > 0
            ? "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + ".\n" + up.help
            : up.help + "\nKoszt: " + cost + ".";
        return { name: up.name, icon: itemOf(up.cost[0][0]).iconIndex, costs: costRows(up.cost), enabled: missing.length === 0, help,
            tip: up.help, facts: ["-" + up.stamina + " wytrzymałości, bez młotka"], run: () => upgradeBuilding(b) };
    }

    // Folds the tent back into its item (a tent with nothing inside has nothing to block it).
    function packUp(b) {
        const def = BUILDINGS[b.type], item = itemOf(def.pack);
        if (!spaceFor(item, 1)) { complainNoSpace(item); return false; }
        const carryWater = def.rain && !def.rain.own ? bucketUnits(b) : 0;   // the bucket keeps its water: it joins the shared carried level
        if (def.rain && def.rain.own) stowVessel(b);   // (a clay pot: its own water and wear, kept for it)
        let crouched = false;
        crouched = swingThen(CROUCH_KIND, () => {
            const list = buildingsOf($gameMap.mapId());
            if (list.indexOf(b) < 0) return;
            list.splice(list.indexOf(b), 1);
            releaseGround(b, $gameMap.mapId());
            changed();
            $gameParty.gainItem(item, 1);
            if (carryWater > 0) setBagWater(bagWater() + carryWater);
            playSe("Equip1", 100);
            const packed = def.packedText || "Złożono: " + def.name;
            popup(item.iconIndex, carryWater > 0 ? packed + " (" + bagWater() + "/" + BUILDINGS.bucket.rain.max + ")" : packed, "#f3e0a0");
            if (!crouched) lockPlayer(30);
        });
        return true;
    }
    // The hour the SurvivalHUD plugin wakes you at (the same as after a night in a bed).
    const wakeHour = () => num(PluginManager.parameters("SurvivalHUD").wakeHour, 7);
    // A night in a tent = a night in a bed: time jumps to the morning (Journal writes the day summary,
    // Atmosphere saves the game - both listen to the core's `wake` after sleepUntilHour), strength and health are restored, a message greets the new day.
    // rain, snow or winter: the forest bed is damp and cold (the tent stays dry)
    const harshNight = () => ["rain", "storm", "snow"].includes($gameScreen.weatherType()) || seasonIndex(today()) === 3;
    // a lit fire (campfire, tripod, cauldron) within 6 tiles of the bed: the wolves keep off it half the time
    const fireNear = b => buildingsOf($gameMap.mapId()).some(f => !f.site && geoOf(f).fire && fireLit(f) && Math.hypot(f.x - b.x, f.y - b.y) <= 6);
    function sleepInTent(b) {
        if (typeof $gameSystem.sleepUntilHour !== "function") { complain(ICON.stamina, "Tu się nie da spać"); return false; }
        const danger = !isHutInterior() && restDanger();
        if (danger) { complain(ICON.stamina, "Nie zaśniesz - w pobliżu " + danger + "!"); return false; }
        const def = BUILDINGS[b.type];
        // the night outdoors: a pack may come (Hunting.js) - then he wakes at that hour, with part of the rest, and they are there
        const now = clockHours();
        let wakeAt = Math.floor(now / 24) * 24 + wakeHour();
        if (wakeAt <= now) wakeAt += 24;
        const hunting = T.api("Hunting"), raid = !isHutInterior() && hunting && hunting.nightRaid ? hunting.nightRaid(now, wakeAt, { fire: fireNear(b) }) : null;
        const bad = def.sleepBad !== undefined && !isHutInterior() && harshNight();   // under the roof of the hut the weather does not matter
        const restore = Math.min(1, (bad ? def.sleepBad : def.sleepRestore !== undefined ? def.sleepRestore : 1) * (1 + perk("sleep.rest")));
        const morning = restore >= 1 ? "Czujesz się wypoczęty." : bad ? "Spałeś w zimnie i wilgoci. Sił odzyskałeś niewiele." : "Spałeś twardo. Sił odzyskałeś tylko część.";
        // the screen goes dark for a moment while the night passes, then the new day comes up; the greeting is a small plate at the
        // top of the screen (SurvivalHUD.js), shown after the day summary (Journal.js)
        lockPlayer(150);
        $gameScreen.startFadeOut(30);
        later(45, () => {
            AudioManager.playMe({ name: PluginManager.parameters("SurvivalHUD").sleepMe || "Inn1", volume: 90, pitch: 100, pan: 0 });
            if (raid !== null) {   // woken by the wolves: the part of the night slept, the part of the rest
                const part = Math.max(0, Math.min(1, (raid - now) / (wakeAt - now)));
                $gameSystem.sleepUntilHour(raid % 24);
                if (typeof $gameSystem.setStamina === "function") $gameSystem.setStamina(Math.max($gameSystem.stamina(), Math.round($gameSystem.maxStamina() * restore * part)));
                for (const member of $gameParty.members()) member.setHp(Math.min(member.mhp, member.hp + Math.round((member.mhp - member.hp) * part)));
                const dogApi = T.api("Dog"), ds = dogApi && dogApi.state && dogApi.state(), dog = ds && ds.tame && ds.map === $gameMap.mapId() && dogApi.dog;
                hunting.raidPack(!!dog);
                const bubbles = T.api("SpeechBubbles");
                if (bubbles) {
                    if (dog) bubbles.say(dog, "Hau! Hau!");
                    bubbles.say($gamePlayer, "Wilki!");
                }
                b.last = today();
                return;
            }
            $gameSystem.sleepUntilHour(wakeHour());
            if (typeof $gameSystem.setStamina === "function") $gameSystem.setStamina(Math.max($gameSystem.stamina(), Math.round($gameSystem.maxStamina() * restore)));
            for (const member of $gameParty.members()) member.recoverAll();
            if (b.type === "tent") farm().tentNights = (farm().tentNights || 0) + 1; else farm().bedNights = (farm().bedNights || 0) + 1;
            b.last = today();
        });
        later(75, () => $gameScreen.startFadeIn(40));
        later(115, () => {
            if (raid !== null) {   // (not the new day's greeting: the wolves)
                if (!T.popup("Obudziły cię wilki!", { top: true, color: "#ff9f8f" })) popup(ICON.stamina, "Obudziły cię wilki!", "#ff9f8f");   // (at the top; without that plate over him)
                return;
            }
            if (typeof $gameTemp.queueDayBanner === "function") $gameTemp.queueDayBanner(morning);
            else { $gameMessage.add("Dzień " + T.time.day() + ". " + T.time.period().name + "."); $gameMessage.add(morning); }
        });
        return true;
    }
    function placeSite(type, x, y, flip) {
        const def = BUILDINGS[type];
        if (!def) return false;
        if (def.instant) return pitchInstant(type, x, y, flip);
        const why = whyNotBuild(type, x, y, flip);
        if (why) { complain(itemOf(ITEM.wood).iconIndex, why); return false; }
        const missing = missingMaterials(type);
        if (missing.length > 0) { const m = itemOf(missing[0][0]); complain(m.iconIndex, "Brakuje: " + m.name); return false; }
        for (const [id, n] of def.cost) $gameParty.loseItem(itemOf(id), n, false);
        const fresh = claimGround(tilesOfBuilding(type, x, y));
        const b = { id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh, site: { need: siteHits(def), done: 0 }, ...(flip ? { flip: true } : {}) };
        buildingsOf($gameMap.mapId()).push(b);
        changed();
        playSe(SE.plant, 95);
        popup(itemOf(ITEM.hammer).iconIndex, "Plac budowy: " + def.name, "#f3e0a0");
        if (!$gameParty.hasItem(itemOf(ITEM.hammer))) complain(itemOf(ITEM.hammer).iconIndex, "Potrzebujesz młotka");
        tellBuild(b, false, "site");
        return true;
    }
    // the F9 placer (Debug.js): the building stands at once, finished - no materials, no strength, no site, no hammer
    function placeFree(type, x, y, flip) {
        const def = BUILDINGS[type];
        if (!def) return false;
        const why = whyNotBuild(type, x, y, flip, true);
        if (why) { complain(itemOf(ITEM.wood).iconIndex, why); return false; }
        const fresh = claimGround(tilesOfBuilding(type, x, y));
        const b = Object.assign({ id: farm().nextId++, type, x, y, last: today(), v: 3, claimed: fresh },
            def.rain ? { water: 0, wt: clockHours() } : {}, flip ? { flip: true } : {});
        buildingsOf($gameMap.mapId()).push(b);
        changed();
        playSe(SE.build, 100);
        popup(itemOf(def.pack || def.cost[0][0]).iconIndex, "Postawiono (F9): " + def.name, "#9ff0a8");
        tellBuild(b, true, "free");
        return true;
    }
    // one blow at the site in front of the player (x, y = the tile that is hit)
    // Held O (the action button) goes on striking: after each blow, a moment later the next one - for as long as it is held, he faces
    // the site and has the strength. Zręczność makes the hammer quicker (the swing and the pause, Combat.workSpeed).
    const AUTO_PAUSE = 12;   // frames between two blows at the usual speed
    const workSpeed = () => { const c = T.api("Combat"); return c && c.workSpeed ? c.workSpeed() : 1; };
    const HOLD_CALM = { only: ["farmMenu", "build", "event", "message", "tool"] };   // (no farm menu, building being placed, event, message, swing)
    function holdingOn(b) {
        if (!Input.isPressed("ok") || !b.site || buildingsOf($gameMap.mapId()).indexOf(b) < 0) return false;
        if (!T.isCalm(null, HOLD_CALM)) return false;
        const t = targetTile();
        return buildingAt(t.x, t.y) === b;
    }
    function strikeSite(b, x, y) {
        const site = b.site, def = BUILDINGS[b.type];
        if (!site || !requireItem(ITEM.hammer) || !spendStamina(hitCost())) return false;
        const rate = workSpeed();
        const again = () => { if (b.site) later(Math.max(2, Math.round(AUTO_PAUSE / rate)), () => { if (holdingOn(b)) strikeSite(b, x, y); }); };
        const started = $gamePlayer.startToolSwing && $gamePlayer.startToolSwing(HAMMER_KIND, () => blow(), again, { rate });
        if (!started) blow();
        return true;
        function blow() {
            useTool(ITEM.hammer);
            site.done++;
            const last = site.done >= site.need;
            playSe(SE.build, 95 + Math.floor(Math.random() * 10));
            if (last) {
                later(9, () => playSe(SE.build, 90));
                later(18, () => playSe(SE.build, 105));
                delete b.site;
                b.last = today();
                popup(itemOf(ITEM.hammer).iconIndex, "Gotowe: " + def.name, "#9ff0a8");
                for (const [id] of def.cost) if (perkRoll("build.spare")) $gameParty.gainItem(itemOf(id), 1);   // (Budownictwo: Resztki)
            }
            fx(x, y, "wood", last);
            changed();
            if (last) tellBuild(b, true, "hammer");
        }
    }
    // what taking a site down gives back: everything before the first blow, then less the further it got - down to half (as
    // for a finished building) just before the last blow (the user's, 2026-09-25: a half-built site can be taken down too)
    function siteRefund(b) {
        const f = b.site ? Math.min(1, b.site.done / Math.max(1, b.site.need)) : 1;
        return BUILDINGS[b.type].cost.map(([id, n]) => [id, Math.round(n * (1 - 0.5 * f))]);
    }
    function cancelSite(b) {
        if (!b.site) return false;
        const back = siteRefund(b), begun = b.site.done > 0;
        const list = buildingsOf($gameMap.mapId());
        list.splice(list.indexOf(b), 1);
        releaseGround(b, $gameMap.mapId());
        for (const [id, n] of back) if (n > 0) $gameParty.gainItem(itemOf(id), n);
        changed();
        playSe(SE.demolish, 100);
        if (begun) fx(b.x, b.y, "wood", true);
        return true;
    }
    // O on a site: its menu - "Zacznij budować" / "Buduj dalej" first, then taking it down. Holding O on (SITE_HOLD frames) chooses
    // the first by itself and goes on striking (Scene_Map: _farmHold), so building still takes one long press.
    function siteMenu(b, x, y) {
        const def = BUILDINGS[b.type], left = b.site.need - b.site.done, begun = b.site.done > 0;
        const back = siteRefund(b).filter(([, n]) => n > 0).map(([id, n]) => itemOf(id).name + " ×" + n).join(", ");
        const build = { name: begun ? "Buduj dalej" : "Zacznij budować", icon: itemOf(ITEM.hammer).iconIndex, right: "-" + hitCost(), run: () => strikeSite(b, x, y),
            help: "Potrzebny młotek. Każde uderzenie kosztuje " + hitCost() + " wytrzymałości, " + (begun ? "zostało ich " : "a potrzeba ich ") + left + ". Przytrzymaj O, a będziesz uderzać bez przerwy." };
        return { title: "Plac budowy: " + def.name + " (" + b.site.done + "/" + b.site.need + ")", hold: build.run, entries: [
            ...(hammerMissing() ? [handMenuEntry(x, y)] : []),
            build,
            { name: begun ? "Rozbierz plac budowy" : "Zrezygnuj", run: () => cancelSite(b),
                help: begun ? "Budowa przepada. Zwraca część materiałów: " + (back || "nic") + "." : "Zwraca wszystkie materiały." }] };
    }

    // null when the building may be taken down, otherwise the reason
    function demolishBlock(b) {
        if (b.job && !jobReady(b)) return "W środku coś się jeszcze robi. Poczekaj, aż się skończy.";   // (a finished one is taken into the bag first)
        if (chestKinds(b) > 0) return BUILDINGS[b.type].bowl ? "Najpierw zabierz jedzenie z miski." : "Najpierw opróżnij skrzynię.";
        if ((b.pots || []).length > 0) return "Najpierw zabierz garnki ze stołu.";
        if (b.type === "hut" && (farm().buildings[HUT_MAP] || []).length > 0) return "Najpierw wynieś z chatki wszystkie meble.";
        return null;
    }
    function demolish(b) {
        const def = geoOf(b);   // a building of the old size gives back half of what it cost then
        const block = demolishBlock(b);
        if (block) { complain(itemOf(ITEM.wood).iconIndex, block); return false; }
        if (!takeReadyFirst(b)) return false;
        const list = buildingsOf($gameMap.mapId());
        list.splice(list.indexOf(b), 1);
        releaseGround(b, $gameMap.mapId());
        changed();
        playSe(SE.demolish, 100);
        fx(b.x, b.y, "wood", true);
        const more = Math.min(0.5, perk("build.refund"));   // (Budownictwo: Rozbiórka - half of the cost back, and more)
        const back = def.refund ? def.refund.map(([id, n]) => [id, Math.floor(n * (1 + 2 * more))]) : def.cost.map(([id, n]) => [id, Math.floor(n * (0.5 + more))]);
        for (const [id, n] of back) {
            if (n > 0) $gameParty.gainItem(itemOf(id), n);
        }
        return true;
    }
    function readyProduce(b) {
        const p = BUILDINGS[b.type].produce;
        if (!p) return 0;
        return Math.min(p.cap, Math.floor(Math.max(0, today() - b.last) / p.period) * p.amount + (b.caught || 0));
    }
    function daysToProduce(b) {
        const p = BUILDINGS[b.type].produce;
        return Math.max(1, p.period - Math.max(0, today() - b.last) % p.period);
    }
    function collect(b) {
        const n = readyProduce(b);
        if (n < 1) return false;
        const tool = BUILDINGS[b.type].produce.tool;
        if (tool && !requireItem(tool)) return false;
        swingThen(CROUCH_KIND, () => {
            b.last = today();
            const hunting = T.api("Hunting"), snare = (b.caught || 0) > 0 && hunting && hunting.takeFromSnare;
            b.caught = 0;   // (a snare: the rabbit taken out, it is set again)
            changed();
            playSe(SE.collect, 100);
            if (snare) hunting.takeFromSnare(b.x, b.y);   // (with a knife dressed at once; without, its carcass lies there)
            else $gameParty.gainItem(itemOf(BUILDINGS[b.type].produce.item), n + (perkRoll("produce.more") ? 1 : 0));   // (Rolnictwo: Hodowca)
        });
        return true;
    }
    // ---- a snare (a building with `lure`): it catches nothing by itself. Bait in it (b.bait = { item, until: clock hours }) draws
    // live rabbits (Hunting.js); one may be caught - one at a time, the snare holds the rabbit (b.caught) until it is collected. The
    // bait lasts lure.baitHours or until the first rabbit (caught, or scared off with it).
    function snares(mapId) {
        return (farm().buildings[mapId === undefined ? $gameMap.mapId() : mapId] || []).filter(b => !b.site && BUILDINGS[b.type] && BUILDINGS[b.type].lure);
    }
    const snareSprung = b => (b.caught || 0) > 0;
    function snareBait(b) {
        if (b.bait && b.bait.until <= clockHours()) { b.bait = null; changed(); }   // gone off / eaten by the ants
        return b.bait || null;
    }
    function snareCatch(b) {
        if (snareSprung(b)) return false;
        b.caught = 1;
        b.bait = null;
        changed();
        return true;
    }
    function snareEatBait(b) {
        if (!b.bait) return;
        b.bait = null;
        changed();
    }
    function baitSnare(b) {
        const lure = BUILDINGS[b.type].lure, id = lure.baits.find(i => countOf(i) > 0);
        if (!id) { complain(itemOf(lure.baits[0]).iconIndex, "Nie masz przynęty"); return false; }
        if (snareSprung(b)) { complain(itemOf(ITEM.carcass).iconIndex, "W pułapce siedzi zając"); return false; }
        swingThen(CROUCH_KIND, () => {
            $gameParty.loseItem(itemOf(id), 1);
            b.bait = { item: id, at: clockHours(), until: clockHours() + lure.baitHours };
            changed();
            playSe(SE.move, 110);
            popup(itemOf(id).iconIndex, "Przynęta w pułapce: " + itemOf(id).name, "#cfe6a8");
        });
        return true;
    }
    function snareBaitEntry(b, def) {
        const lure = def.lure, bait = snareBait(b);
        if (bait) {
            const left = Math.max(1, Math.round(bait.until - clockHours()));
            return { name: "Przynęta: " + itemOf(bait.item).name, icon: itemOf(bait.item).iconIndex, right: left + " h", enabled: false,
                help: "Leży w pułapce jeszcze około " + left + " godz. albo do pierwszego zająca. Zające zwąchają ją nawet z " + lure.radius + " kratek." };
        }
        const id = lure.baits.find(i => countOf(i) > 0), sprung = snareSprung(b);
        return { name: "Załóż przynętę", icon: itemOf(id || lure.baits[0]).iconIndex, right: id ? "-1" : "", enabled: !!id && !sprung,
            help: sprung ? "W pułapce siedzi zając: najpierw go zabierz."
                : id ? "Kładziesz w pułapce: " + itemOf(id).name + " (masz " + countOf(id) + "). Bez przynęty pułapka nic nie złapie; tę zające zwąchają z " + lure.radius + " kratek. Wystarczy na dobę albo do pierwszego zająca."
                : "Nie masz przynęty, a bez niej pułapka nic nie złapie. Zające skuszą się na: " + lure.baits.map(i => itemOf(i).name.toLowerCase()).join(", ") + ".",
            run: () => baitSnare(b) };
    }
    function rest(b) {
        const def = BUILDINGS[b.type];
        const no = whyNoRest();
        if (no) { complain(ICON.stamina, no); return false; }
        if (def.fire && !fireLit(b)) { complain(itemOf(ITEM.wood).iconIndex, b.rainOut ? fireOutText(b) : "Ogień wygasł. Dorzuć drewna."); return false; }
        if (!$gamePlayer.startToolSwing) return false;
        const rate = () => (def.fire && !fireLit(b) ? 0 : def.rest);   // (a fire that goes out gives nothing more: he gets up)
        const why = { place: def.fire ? "Ogień wygasł" : "" };
        if (def.seats) {   // on a bench (the shelter's: the front or the back one, whichever side he came from)
            const p = $gamePlayer, back = p.y < b.y, seat = back ? def.seats.back : def.seats.front;
            const from = { rx: p._realX, ry: p._realY, x: p._x, y: p._y, d: p.direction() };
            const mid = b.x + def.w / 2 - 0.5, span = def.seats.span / $gameMap.tileWidth();
            const put = (rx, ry) => { p._realX = rx; p._realY = ry; p._x = Math.round(rx); p._y = Math.round(ry); };
            put(Math.max(mid - span, Math.min(mid + span, p._realX)), b.y + seat.dy);
            p.setDirection(seat.dir || (back ? 2 : 8));
            const opts = restingOpts(rate, true, why);
            opts.lift = seat.lift;
            const ok = p.startToolSwing(SIT_KIND, () => {}, () => { put(from.rx, from.ry); p._x = from.x; p._y = from.y; p.setDirection(from.d); }, opts);
            if (!ok) { put(from.rx, from.ry); p._x = from.x; p._y = from.y; p.setDirection(from.d); return false; }
            return true;
        }
        // by a fire he sits down on the ground (shifting a little now and then)
        return $gamePlayer.startToolSwing(SIT_KIND, () => {}, undefined, restingOpts(rate, !def.fire, why));
    }
    // The rest, frame by frame while he sits (the sitting swing waits on its impact frame): rate() = stamina an hour here now (0: the
    // place gives nothing any more - the fire went out). Each frame 1/60 of REST_HOURS_A_SECOND hours go by (so all that runs with
    // the clock - hunger, thirst, healing, the fire's fuel, the weather - goes on as usual) and the strength comes back by that much.
    // It ends by itself at full strength (restCeiling: the sleep and the hunger caps), on a hit, when a boar or a wolf comes at him,
    // or when the place stops giving; the player ends it with a direction key or Esc (ChoppableTree), O or a click (here).
    function restingOpts(rate, still, why) {
        const r = { hours: 0, gained: 0, hp: heroHpNow(), end: "" };
        const step = REST_HOURS_A_SECOND / 60;
        return {
            still,
            holdWhile: () => {
                if (r.end) return false;
                if (Input.isTriggered("ok") || TouchInput.isTriggered()) { r.end = "up"; return false; }
                if ($gameSystem.stamina() >= restCeiling() - 0.05) { r.end = "full"; return false; }
                return true;
            },
            onWait: () => {
                const perHour = rate();
                if (!(perHour > 0)) { r.end = "place"; return; }
                if (heroHpNow() < r.hp) { r.end = "hit"; return; }
                const danger = restDanger();
                if (danger) { r.end = "danger"; r.danger = danger; return; }
                if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(step);
                r.hours += step;
                const before = $gameSystem.stamina();
                $gameSystem.changeStamina(restGain(perHour * step * (1 + perk("sleep.rest"))));
                r.gained += $gameSystem.stamina() - before;
                if ($gameSystem.stamina() >= restCeiling() - 0.05) r.end = "full";
            },
            onHoldEnd: () => {
                if (r.hours > 0) {
                    T.call("Journal", "afterRest");   // (a rest through midnight: the day's summary)
                    T.call("Atmosphere", "afterRest", { restHours: r.hours });   // a long rest saves the game (autosave)
                    playSe(SE.rest, 100);
                    popup(ICON.stamina, "+" + Math.round(r.gained) + " wytrzymałości (" + hoursText(r.hours) + ")", "#9ff0a8");
                }
                if (r.end === "danger") later(20, () => complain(ICON.stamina, r.danger + "! Wstajesz."));
                else if (r.end === "place" && why && why.place) later(20, () => complain(itemOf(ITEM.wood).iconIndex, why.place));
                else if (r.end === "full" && sleepy() && $gameSystem.stamina() >= restCap() - 0.5) later(40, () => complain(ICON.stamina, "Bez snu lepiej nie wypoczniesz"));
                else if (r.end === "full" && needsCeiling() < restCap()) later(40, () => complain(ICON.stamina, "Głodny i spragniony więcej sił nie odzyskasz"));
            }
        };
    }
    const heroHpNow = () => { const a = $gameParty.leader(); return a ? a.hp : 0; };
    // a boar or wolves coming at him (not roaming about, not running away) within 8 tiles: the name of the first, else ""
    function restDanger() {
        const hunting = T.api("Hunting");
        if (!hunting || !hunting.animals || !hunting.SPECIES) return "";
        for (const a of hunting.animals) {
            const sp = a && hunting.SPECIES[a.kind()];
            if (!sp || !sp.aggressive || a._dead || !(a._hp > 0) || a._mode === "roam" || a._mode === "flee") continue;
            // (a wolf of a pack that hunts him counts while it is anywhere near - it circles off and comes back)
            if (a.playerDistance() < (a._engaged ? 16 : 8)) return sp.name;
        }
        return "";
    }
    // ---- the need of sleep
    function awakeHours() {
        if (!hasClock()) return 0;
        const now = clockHours(), f = farm();
        if (f.lastSleep === undefined || f.lastSleep > now) f.lastSleep = now;
        return now - f.lastSleep;
    }
    const sleepy = () => awakeHours() >= SLEEP_DEBT_HOURS;
    // as far as a rest (not a sleep) can bring the strength now
    const restCap = () => Math.round($gameSystem.maxStamina() * (sleepy() ? SLEEP_CAP : 1));
    const restGain = amount => Math.max(0, Math.min(amount, restCap() - $gameSystem.stamina()));
    // hungry or thirsty, the strength stops lower still (Needs.js); a rest ends there too
    const needsCeiling = () => { const n = T.api("Needs"); return n && n.capRatio && (!n.enabled || n.enabled()) ? Math.round($gameSystem.maxStamina() * n.capRatio()) : Infinity; };
    const restCeiling = () => Math.min(restCap(), needsCeiling());
    const sleepyNote = () => "Nie spałeś od " + Math.floor(awakeHours()) + " godz.: bez snu odpoczynek przywróci najwyżej " + Math.round(SLEEP_CAP * 100) + "% sił. Prześpij się.";
    // why a rest now gives nothing (null: it gives)
    function whyNoRest() {
        if ($gameSystem.stamina() < restCeiling() - 0.5) return null;
        if (needsCeiling() < restCap() - 0.5) return "Głodny i spragniony więcej sił nie odzyskasz - zjedz i napij się";
        return sleepy() ? "Bez snu lepiej nie wypoczniesz - prześpij się" : "Nie jesteś zmęczony";
    }
    // the menu's help when no rest is possible
    const noRestHelp = no => (sleepy() && !(needsCeiling() < restCap() - 0.5) ? sleepyNote() : no + ".");
    // no building needed: he sits down on the grass right where he stands (the sitting swing, hands folded - quite still, no shifting
    // between two poses like by the fire) and rests (restingOpts): GROUND_REST an hour, GROUND_REST_WET in the rain
    const groundRate = () => (rainingHere() ? GROUND_REST_WET : GROUND_REST);
    function lieDown(x, y) {
        const no = whyNoRest();
        if (no) { complain(ICON.stamina, no); return false; }
        return !!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(SIT_KIND, () => {}, undefined, restingOpts(groundRate, true)));
    }

    // ---- the hut's door: the doorway is a passable cell, stepping into it (or "Wejdź do środka") changes the map; the doormat inside leads out
    const HUT_DOOR_CALM = { only: ["transfer", "event"] };   // (not while going to another map or in an event)
    function enterHut(b) {
        if (!b || b.site || !T.isCalm(null, HUT_DOOR_CALM)) return false;
        hutSanitize(true);
        playSe("Door1", 100);
        $gamePlayer.reserveTransfer(HUT_MAP, HUT_ROOM.doorX, HUT_ROOM.y1, 8, 0);
        return true;
    }
    function leaveHut() {
        if ($gamePlayer.isTransferring()) return false;
        const h = hutOf();
        playSe("Door1", 90);
        if (h) {
            const d = hutDoorCell(h);
            $gamePlayer.reserveTransfer(h.mapId, d.x, d.y + 1, 2, 0);
        } else {
            $gamePlayer.reserveTransfer(3, 8, 10, 2, 0);   // the hut is gone: back to the farm
        }
        return true;
    }
    // ------------------------------------------------------------------
    // Placing a building: after choosing it in the build menu a grid appears around the player and a
    // see-through picture of the building follows a cursor. Arrows (or the mouse) move it, OK / a click
    // builds, cancel / a right click goes back. Green = it can stand there, red = it cannot (with the reason).
    // ------------------------------------------------------------------
    // walking up to the spot before putting a building down (user): WALK_STILL frames without reaching a new tile, or WALK_MAX in
    // all, and he gives up ("Nie dojdziesz tam")
    const WALK_STILL = 90, WALK_MAX = 900;
    // the free tile beside the footprint nearest to the player (where he stands to build); a corner only when no side is
    // free; null when there is none
    function standTileFor(type, x, y) {
        const cells = tilesOfBuilding(type, x, y), inside = new Set(cells.map(c => c.x + "," + c.y));
        let best = null, bestD = Infinity;
        for (const c of cells) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const tx = c.x + dx, ty = c.y + dy;
            if (inside.has(tx + "," + ty) || !$gameMap.isValid(tx, ty) || !$gameMap.checkPassage(tx, ty, 0x0f) || buildingAt(tx, ty)) continue;
            if ($gameMap.eventsXy(tx, ty).some(e => e.isNormalPriority())) continue;
            const d = Math.hypot(tx - $gamePlayer.x, ty - $gamePlayer.y) + (dx && dy ? 100 : 0) + (dy > 0 && dx === 0 ? -0.3 : 0);   // (in front of it a little better)
            if (d < bestD) { bestD = d; best = { x: tx, y: ty }; }
        }
        return best;
    }
    // he already stands right beside it (next to one of its tiles, not at a corner)
    function besideFootprint(type, x, y) {
        return tilesOfBuilding(type, x, y).some(c => Math.abs(c.x - $gamePlayer.x) + Math.abs(c.y - $gamePlayer.y) === 1);
    }

    function placementProblem(type, x, y, flip, free) {
        const def = BUILDINGS[type];
        const rows = def.h || 1;   // the nearest tile of the whole footprint counts
        const far = Math.max(0, x - $gamePlayer.x, $gamePlayer.x - (x + def.w - 1), (y - rows + 1) - $gamePlayer.y, $gamePlayer.y - y);
        if (far > BUILD_RANGE) return "Za daleko od ciebie.";
        const why = whyNotBuild(type, x, y, flip, free);
        if (why) return why;
        if (!free && missingMaterials(type).length > 0) return "Brakuje materiałów.";
        return null;
    }
    // the F9 placer (Debug.js): the usual placing on the tile in front of the player, but free and finished at once
    function startFreePlacement(type) {
        const scene = SceneManager._scene;
        if (!BUILDINGS[type] || !(scene instanceof Scene_Map) || typeof scene.startBuildMode !== "function") return false;
        const t = targetTile();
        scene.startBuildMode(type, t.x, t.y, true);
        return true;
    }

    function startPlacement(type, x, y) {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || typeof scene.startBuildMode !== "function") return build(type, x, y);
        scene.startBuildMode(type, x, y);
        return true;
    }

    SCENE.startBuildMode = function(type, x, y, free) {
        $gameTemp._buildMode = { type, x, y, wait: 4, hover: null, flip: false, free: !!free };
        const help = this._farmHelp, width = Math.min(600, Graphics.boxWidth - 40), helpH = this.calcWindowHeight(4, false);
        help.move(MENU_MARGIN, Math.max(8, Graphics.boxHeight - helpH - MENU_MARGIN), width, helpH);
        help.createContents();
        help.show();
        this.refreshBuildHelp();
    };

    SCENE.endBuildMode = function() {
        $gameTemp._buildMode = null;
        this._farmHelp.hide();
        lockPlayer(2);   // the same key press must not act on the map
    };

    SCENE.refreshBuildHelp = function() {
        const mode = $gameTemp._buildMode;
        if (!mode) return;
        const def = BUILDINGS[mode.type], problem = placementProblem(mode.type, mode.x, mode.y, mode.flip, mode.free);
        // text codes: \C[n] a colour of the window palette (16 brass, 3 green, 10 red, 7 muted), \I[n] an icon
        const help = this._farmHelp;
        const cost = BUILDINGS[mode.type].cost.map(([id, n]) => "\\I[" + itemOf(id).iconIndex + "]\\C[" + (countOf(id) >= n ? 3 : 10) + "]" + countOf(id) + "/" + n + "\\C[0]").join("   ");
        if (mode.walk) {
            help.setText("\\C[16]Stawianie: " + def.name + "\\C[0]\n\\C[3]Idziesz na miejsce budowy...\\C[0]\n\n\\C[7]Strzałki albo Anuluj: przerwij");
            return;
        }
        help.setText("\\C[16]Stawianie: " + def.name + "\\C[0]\n" + (mode.free ? "\\C[3]F9: za darmo, od razu gotowe\\C[0]" : "Koszt:  " + cost) + "\n" + (problem ? "\\C[10]" + problem : "\\C[3]Można tu postawić.") + "\\C[0]\n\\C[7]Strzałki: ruch   OK: " + (mode.free ? "postaw" : "podejdź i postaw") + "   " + (mode.type === "fence" ? "" : "R / Q / E: odbij" + (mode.flip ? " (odbite)" : "") + "   ") + "Anuluj: wróć");
    };

    const BUILD_CALM = { only: ["event", "message", "transfer"] };   // (an event, a message or a transfer ends the placing)
    SCENE.updateBuildMode = function() {
        const mode = $gameTemp._buildMode, def = mode && BUILDINGS[mode.type];
        if (!def) return;
        if (!T.isCalm(this, BUILD_CALM)) {
            if (mode.walk) $gameTemp.clearDestination();
            $gameTemp._buildMode = null;
            this._farmHelp.hide();
            return;
        }
        if (mode.walk) { this.updateBuildWalk(mode); return; }
        if (mode.wait > 0) { mode.wait--; return; }   // the press of "OK" that picked the building is still fresh
        let x = mode.x, y = mode.y;
        if (Input.isRepeated("left")) x--; else if (Input.isRepeated("right")) x++;
        if (Input.isRepeated("up")) y--; else if (Input.isRepeated("down")) y++;
        if (TouchInput.isHovered() && (!mode.hover || mode.hover.x !== TouchInput.x || mode.hover.y !== TouchInput.y)) {
            mode.hover = { x: TouchInput.x, y: TouchInput.y };
            x = $gameMap.canvasToMapX(TouchInput.x);
            y = $gameMap.canvasToMapY(TouchInput.y);
        }
        // the cursor stays on the map, near the player and on the screen
        const screenW = Math.floor($gameMap.screenTileX()), screenH = Math.floor($gameMap.screenTileY());
        x = Math.max($gamePlayer.x - BUILD_RANGE, Math.min($gamePlayer.x + BUILD_RANGE, x));
        y = Math.max($gamePlayer.y - BUILD_RANGE, Math.min($gamePlayer.y + BUILD_RANGE, y));
        const rows = def.h || 1;
        x = Math.max(0, Math.min($gameMap.width() - def.w, x));
        y = Math.max(rows - 1, Math.min($gameMap.height() - 1, y));
        if ($gameMap.adjustX(x) < 0 || $gameMap.adjustX(x) > screenW - def.w) x = mode.x;
        if ($gameMap.adjustY(y - rows + 1) < 0 || $gameMap.adjustY(y) > screenH - 1) y = mode.y;
        if (x !== mode.x || y !== mode.y) {
            mode.x = x;
            mode.y = y;
            SoundManager.playCursor();
        }
        if (mode.type !== "fence" && (Input.isTriggered("flip") || Input.isTriggered("pageup") || Input.isTriggered("pagedown"))) {   // mirror the building before it is put down (R, Q or E)
            mode.flip = !mode.flip;
            SoundManager.playCursor();
        }
        const key = mode.x + "," + mode.y + ":" + farm().rev + ":" + missingMaterials(mode.type).length + ":" + $gamePlayer.x + "," + $gamePlayer.y + ":" + mode.flip;
        if (key !== mode.key) {
            mode.key = key;
            this.refreshBuildHelp();
        }
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
            SoundManager.playCancel();
            this.endBuildMode();
            return;
        }
        const confirm = Input.isTriggered("ok") || TouchInput.isTriggered();
        if (!confirm || $gameTemp._farmLock > 0) return;
        const problem = placementProblem(mode.type, mode.x, mode.y, mode.flip, mode.free);
        if (problem) {
            SoundManager.playBuzzer();
            complain(itemOf(ITEM.wood).iconIndex, problem);
            return;
        }
        // first he walks up to it (the F9 placer puts it down at once); already beside it, it goes down now
        if (!mode.free && !besideFootprint(mode.type, mode.x, mode.y)) {
            const stand = standTileFor(mode.type, mode.x, mode.y);
            if (!stand) { SoundManager.playBuzzer(); complain(itemOf(ITEM.wood).iconIndex, "Nie dojdziesz tam"); return; }
            mode.walk = { tx: stand.x, ty: stand.y, t: 0, still: 0, lx: $gamePlayer.x, ly: $gamePlayer.y };
            $gameTemp.setDestination(stand.x, stand.y);
            this.refreshBuildHelp();
            return;
        }
        this.putDownBuilding(mode);
    };
    // he faces the spot and puts it down (a site, or a tent / bed / bucket at once)
    SCENE.putDownBuilding = function(mode) {
        const cells = tilesOfBuilding(mode.type, mode.x, mode.y);
        const c = cells.reduce((a, b) => Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y) < Math.hypot(a.x - $gamePlayer.x, a.y - $gamePlayer.y) ? b : a, cells[0]);
        const dx = c.x - $gamePlayer.x, dy = c.y - $gamePlayer.y;
        if (dx || dy) $gamePlayer.setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8));
        if ((mode.free ? placeFree : placeSite)(mode.type, mode.x, mode.y, mode.flip) && mode.type !== "fence") this.endBuildMode();   // fences: keep going, one after another
        else this.refreshBuildHelp();
    };
    // walking to the spot: there - it goes down; a direction key or cancel - back to choosing; stuck - he gives up
    SCENE.updateBuildWalk = function(mode) {
        const w = mode.walk, p = $gamePlayer;
        if (Input.dir8 !== 0 || Input.isTriggered("cancel") || TouchInput.isCancelled()) {
            $gameTemp.clearDestination();
            mode.walk = null;
            mode.wait = 4;
            SoundManager.playCancel();
            this.refreshBuildHelp();
            return;
        }
        if ((p.x === w.tx && p.y === w.ty) || besideFootprint(mode.type, mode.x, mode.y)) {
            $gameTemp.clearDestination();
            if (p.isMoving()) return;   // (the last step settles)
            mode.walk = null;
            if (placementProblem(mode.type, mode.x, mode.y, mode.flip, mode.free)) { SoundManager.playBuzzer(); complain(itemOf(ITEM.wood).iconIndex, placementProblem(mode.type, mode.x, mode.y, mode.flip, mode.free)); this.refreshBuildHelp(); return; }
            this.putDownBuilding(mode);
            return;
        }
        w.t++;
        if (p.x !== w.lx || p.y !== w.ly) { w.lx = p.x; w.ly = p.y; w.still = 0; }
        else w.still++;
        if (w.still > WALK_STILL || w.t > WALK_MAX) {
            $gameTemp.clearDestination();
            mode.walk = null;
            SoundManager.playBuzzer();
            complain(itemOf(ITEM.wood).iconIndex, "Nie dojdziesz tam");
            this.refreshBuildHelp();
            return;
        }
        // (a click on the map must not lead him elsewhere)
        if (!$gameTemp.isDestinationValid() || $gameTemp.destinationX() !== w.tx || $gameTemp.destinationY() !== w.ty) $gameTemp.setDestination(w.tx, w.ty);
    };


    P.build = { SCENE, hutShutsIn, hutSanitize, mapAllowsBuilding, buildsAnywhere, tilesOfBuilding, tileIsFree, tileWhyNot,
        whyNotBuild, missingMaterials, build, siteHits, hitCost, pitchInstant, roomFor, upgradeBuilding, upgradeEntry, packUp,
        wakeHour, sleepInTent, placeSite, placeFree, strikeSite, cancelSite, siteMenu, demolishBlock, demolish, readyProduce,
        daysToProduce, collect, snares, snareSprung, snareBait, snareCatch, snareEatBait, baitSnare, snareBaitEntry, rest,
        restDanger, awakeHours, sleepy, restCap, sleepyNote, whyNoRest, noRestHelp, groundRate, lieDown, enterHut, leaveHut,
        placementProblem, startFreePlacement, startPlacement };
})();
