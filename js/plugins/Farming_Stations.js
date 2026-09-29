//=============================================================================
// Farming_Stations.js
//=============================================================================
// The crafting stations and the chests (split out of Farming.js, 2026-09-29): a station's job in the background and the queue,
// the fires (fuel, rain putting them out, kindling), the recipes (inputs, any meat, water from the bucket), roasting by the fire
// or on the tripod, hand work (sawing, forging, the tools, repairs), a station's recipe lines, and the chests with their screen.
// Functions and classes only: Farming.js holds every engine hook.

/*:
 * @target MZ
 * @plugindesc Stanowiska i skrzynie (część Farming.js): praca w tle i kolejka, ogień i paliwo, przepisy, pieczenie przy ognisku, praca ręczna, skrzynie i ich ekran. Sama nic nie robi - parametry i haki ma Farming.js. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Farming
 * @orderAfter Farming
 *
 * @help
 * ============================================================================
 * Farming_Stations.js - stanowiska i skrzynie
 * ============================================================================
 * Część Farming.js (wydzielona z niego): praca stanowisk w tle i kolejka,
 * ogień (paliwo, deszcz, rozpałka), przepisy (surowce, dowolne mięso, woda
 * z wiadra), pieczenie na patyku i na trójnogu, praca ręczna (piłowanie,
 * kucie, narzędzia, naprawy), wiersze przepisów w menu budynku, skrzynie
 * i ich ekran (plecak - skrzynia). Sama nic nie robi: woła ją Farming.js.
 * Parametry ma Farming.js.
 *
 * KOLEJNOŚĆ: Farming, Farming_Plots, Farming_Build, Farming_Stations,
 * Farming_UI (potem Farming_Render). Dopóki nie jest wpisana na listę
 * wtyczek, Farming.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Farming_Stations.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Farming_parts") || T.register("Farming_parts", {});
    if (P.stations) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("Farming_Stations.js: musi być pod Farming.js na liście wtyczek (Farming.js is missing or below)");
    const { PL, UI, link, num, ITEM, RAKE_KIND, CROUCH_KIND, ROAST_KIND, ROAST_WAIT_KIND, SIT_MAX_SECONDS, HAMMER_KIND, SE,
        BUILDINGS, farm, buildingsOf, changed, geoOf, itemOf, countOf, popup, complain, spaceFor, complainNoSpace, playSe,
        spendStamina, perk, perkRoll, useTool, requireItem, fx, later, lockPlayer, swingThen, missingOf, hasClock, clockHours,
        FUEL_MAX, FUEL_START, FUEL_PER_WOOD, FUEL_PER_BRANCH, SMOULDER_HOURS, weatherHere, rainingHere, RAW_MEATS, MEAT_LABEL,
        meatCount, QUEUE_MAX, clockText, hoursText, IMPROVE, costRows } = P.core;
    const [ownsBucket, bagWater, setBagWater] =
        link(PL, ["ownsBucket", "bagWater", "setBagWater"]);
    const [manualEntry] =
        link(UI, ["manualEntry"]);

    // ---- crafting stations: one job at a time, timed by the game clock (DayNightCycle)
    function jobHoursLeft(b) {
        if (!b.job) return 0;
        if (b.job.pausedAt === undefined && geoOf(b).fire) fuelLeft(b);   // (the rain may have just stopped the fire under it)
        const now = b.job && b.job.pausedAt !== undefined ? b.job.pausedAt : clockHours();
        return b.job ? Math.max(0, b.job.start + b.job.hours - now) : 0;
    }
    // food on a fire that the rain put out: it stands until the fire is lit again
    function jobPaused(b) {
        if (b.job && geoOf(b).fire) fuelLeft(b);
        return !!b.job && b.job.pausedAt !== undefined;
    }
    function jobReady(b) {
        return !!b.job && (!hasClock() || jobHoursLeft(b) <= 0);
    }
    // ---- the job queue (the user's stage 1, 2026-09-27): a station makes `count` of one recipe one after another. b.job.hours is the
    // whole run (count x each), taken = how many were collected already; a job of one (and every job of an old save) has none of these
    const jobCount = b => (b.job ? b.job.count || 1 : 0);
    const jobEach = b => (b.job ? b.job.each || b.job.hours / jobCount(b) : 0);
    // how many are finished (collected ones included)
    function jobFinished(b) {
        if (!b.job) return 0;
        const n = jobCount(b);
        if (jobReady(b)) return n;
        return Math.max(0, Math.min(n - 1, Math.floor((b.job.hours - jobHoursLeft(b)) / Math.max(1e-6, jobEach(b)) + 1e-6)));
    }
    // finished and waiting to be collected
    const jobCollectable = b => Math.max(0, jobFinished(b) - ((b.job && b.job.taken) || 0));
    // ---- fire fuel: a campfire (and what grows from it - tripod, cauldron) slowly burns down and goes out; lazily
    // computed from the game clock, same as everything else timed here, so nothing needs to tick every frame.
    function fuelLeft(b) {
        const def = geoOf(b);
        if (!def.fire) return Infinity;   // no animated fire on this building (older cauldrons built before the flame) - never fuel-gated
        if (b.fuel === undefined) { b.fuel = FUEL_START; b.fuelSince = clockHours(); }
        douse(b);
        return Math.max(0, b.fuel - Math.max(0, clockHours() - b.fuelSince));
    }
    // ---- rain puts a fire out (user): the moment rain starts on a burning fire its flames die and it only smokes, for as long as it
    // rains and half an hour after (outAt = the end of the rain). Nothing burns meanwhile: the wood still in it stays there, soaked
    // (b.soaked), and food on it stops roasting (job.pausedAt). After the rain it has to be lit again (kindling + fuel, as any dead
    // fire); then the soaked wood burns too and the food roasts on. No fire can be lit while it rains. Worked out lazily from the
    // weather plan (Survival.weatherPlan), so it also happens while the player is away; the map is the current one (a fire is only
    // ever looked at on its own map), and a map without weather (Survival.isOutdoors) never rains on its fires.
    function firstRain(h0, h1) {
        const sv = T.api("Survival");
        if (!(sv && sv.weatherPlan) || !(h1 > h0)) return null;
        const d0 = Math.floor(h0 / 24), d1 = Math.min(Math.floor(h1 / 24), d0 + 60);
        for (let day = d0; day <= d1; day++) {
            const plan = sv.weatherPlan(day);
            if (!plan || plan.type !== "rain") continue;
            const a = day * 24 + plan.start, z = day * 24 + plan.end;
            if (z > h0 && a < h1) return { start: Math.max(a, h0), end: z };
        }
        return null;
    }
    function douse(b) {
        if (b.rainOut || !hasClock()) return;   // already put out (until it is lit again)
        if (!weatherHere()) return;   // (looked at from a map without weather: left for when it is seen from its own map)
        const now = clockHours(), from = Math.max(b.fuelSince, b.rainSeen || 0);
        b.rainSeen = now;
        const rain = firstRain(from, b.job ? now : Math.min(now, b.fuelSince + b.fuel));   // while it burned (food on it keeps it going)
        if (!rain) return;
        b.soaked = Math.min(FUEL_MAX, (b.soaked || 0) + Math.max(0, b.fuel - Math.max(0, rain.start - b.fuelSince)));
        b.fuel = 0;
        b.fuelSince = rain.start;
        b.rainOut = { start: rain.start, end: rain.end };
        b.outAt = rain.end;
        if (b.job && b.job.start + b.job.hours > rain.start) b.job.pausedAt = Math.max(rain.start, b.job.start);
    }
    function addFuel(b, hours) {
        const left = fuelLeft(b), now = clockHours();
        b.fuel = Math.min(FUEL_MAX, left + hours + (b.soaked || 0));   // (lit again after rain: the soaked wood left in it burns too)
        b.fuelSince = b.rainSeen = now;
        if (b.job && b.job.pausedAt !== undefined) {   // the food on it roasts on
            b.job.start += now - b.job.pausedAt;
            delete b.job.pausedAt;
        }
        delete b.outAt;
        delete b.soaked;
        delete b.rainOut;
    }
    // lit for display/warming purposes: real fuel, or a job already burning in it (started while it still had fuel -
    // it does not go dark under food that is mid-roast just because the background clock ran on while you were away); never
    // after rain has put it out
    function fireLit(b) {
        const left = fuelLeft(b);   // (first: it also works out whether rain has put it out)
        if (b.rainOut) return false;
        return left > 0 || !!b.job;
    }
    // why a fire is dark, for menus and popups
    function fireOutText(b) {
        if (!b.rainOut) return "Ogień wygasł.";
        return rainingHere() ? "Deszcz zgasił ogień. W deszczu go nie rozpalisz." : "Deszcz zgasił ogień. Rozpal go od nowa.";
    }
    // a gone-out fire smoulders: 1 the moment it went out, down to 0 after SMOULDER_HOURS (0 while it burns). It went out when
    // the fuel ran out, or later, when the food that kept it going came off (outAt)
    function smoulderOf(b) {
        if (!geoOf(b).fire || fireLit(b)) return 0;
        const since = clockHours() - Math.max(b.fuelSince + b.fuel, b.outAt || 0);
        return since >= SMOULDER_HOURS ? 0 : 1 - Math.max(0, since) / SMOULDER_HOURS;
    }
    // the food comes off the fire: with no fuel left it goes out now
    function endJob(b) {
        delete b.job;
        if (geoOf(b).fire && fuelLeft(b) <= 0 && !b.rainOut) b.outAt = clockHours();
    }
    // A fire that has gone out is lit again with kindling: a pine cone (the best), else one more branch
    function kindlingFor(fuelId) {
        if (countOf(ITEM.cone) > 0) return ITEM.cone;
        return countOf(ITEM.branch) >= (fuelId === ITEM.branch ? 2 : 1) ? ITEM.branch : null;
    }
    function feedFireEntries(b) {
        const def = geoOf(b);
        if (!def.fire) return [];
        const out = !fireLit(b), wet = rainingHere();
        const status = out ? fireOutText(b) : "";   // (how long it still burns is said under the name: fireNote)
        const relight = " Rozpalisz go od nowa: na rozpałkę pójdzie szyszka (bez szyszek - jeszcze jedna gałąź).";
        const feed = (fuelId, hours, name, done) => {
            const kindling = out ? kindlingFor(fuelId) : null, fuel = itemOf(fuelId);
            if (wet) return { name, icon: fuel.iconIndex, right: "×1", enabled: false, help: "Pada deszcz: nie rozpalisz ognia ani nie dołożysz do niego, póki leje.", run: () => false };
            return { name, icon: fuel.iconIndex, right: "×1", enabled: countOf(fuelId) > 0 && (!out || !!kindling),
                help: (out ? status + relight + (kindling ? "" : " Nie masz ani szyszki, ani gałęzi.") + " " : "") + done + (out && b.soaked > 0 ? " Mokre drewno, które w nim zostało, też się rozpali." : ""),
                run: () => {
                    $gameParty.loseItem(fuel, 1, false);
                    if (kindling) $gameParty.loseItem(itemOf(kindling), 1, false);
                    addFuel(b, hours * (1 + perk("fire.fuel")));
                    changed();
                    playSe(SE.build, 95);
                    popup(fuel.iconIndex, kindling ? "Rozpalono ogień (rozpałka: " + itemOf(kindling).name.toLowerCase() + ")" : name === "Dorzuć drewna" ? "Dorzucono drewna" : "Dorzucono gałąź", "#f3e0a0");
                    return true;
                } };
        };
        return [
            feed(ITEM.wood, FUEL_PER_WOOD, "Dorzuć drewna", "Drewno daje " + hoursText(FUEL_PER_WOOD) + " ognia."),
            feed(ITEM.branch, FUEL_PER_BRANCH, "Dorzuć gałąź", "Gałąź daje " + hoursText(FUEL_PER_BRANCH) + " ognia - gorzej niż drewno.")
        ];
    }
    function recipeOf(b, id) {
        return ((BUILDINGS[b.type] || {}).recipes || []).find(r => r.id === id) || null;
    }
    // n: how many of the recipe at once (the job queue)
    function missingInputs(r, n) {
        n = n || 1;
        const missing = missingOf(r.inputs.map(([id, k]) => [id, k * n]));
        if (r.meat && meatCount() < r.meat * n) missing.push([ITEM.rawMeat, r.meat * n, "meat"]);   // (the third field: "any raw meat")
        return missing;
    }
    // "any raw meat" (r.meat pieces): the soups, the stew and the smokehouse take the meat of whatever animal; the kinds there is
    // most of go first
    function spendMeat(n) {
        for (const id of RAW_MEATS().sort((a, b) => countOf(b) - countOf(a))) {
            const take = Math.min(n, countOf(id));
            if (take > 0) { $gameParty.loseItem(itemOf(id), take, false); n -= take; }
            if (n <= 0) break;
        }
    }
    const missingName = pair => pair[2] === "meat" ? MEAT_LABEL : itemOf(pair[0]).name;
    const missingHave = pair => pair[2] === "meat" ? meatCount() : countOf(pair[0]);
    // recipes that need water (the cauldron's soups): null when fine, else the reason for a popup/help line
    function waterProblem(r, n) {
        if (!r.water) return null;
        const need = r.water * (n || 1);
        if (!ownsBucket()) return "Potrzebujesz wiadra";
        if (bagWater() < need) return "Za mało wody w wiadrze (" + bagWater() + "/" + need + ")";
        return null;
    }
    function costRowsWithWater(r, n) {
        n = n || 1;
        const rows = costRows(r.inputs.map(([id, k]) => [id, k * n]));
        if (r.meat) rows.push([itemOf(ITEM.rawMeat).iconIndex, r.meat * n, meatCount(), MEAT_LABEL]);
        if (r.water) rows.push([itemOf(ITEM.bucket).iconIndex, r.water * n, bagWater(), "woda"]);
        return rows;
    }
    // how many of a background recipe can be queued at once: what the bag pays for (its inputs, any meat, the water in the bucket), at most
    // QUEUE_MAX; at a fire only as many as its fuel lasts for (at least one: a job on it keeps it burning). 0 = not even one.
    // A recipe sat at on a stick (the campfire) is always one: he sits by the fire with it (queueable).
    const queueable = (b, r) => !(r.roast && !geoOf(b).hang);
    function queueMax(b, r) {
        if (!queueable(b, r)) return Math.min(1, queueMaxOf(r));
        let n = queueMaxOf(r);
        if (geoOf(b).fire && n > 1) n = Math.min(n, Math.max(1, Math.floor(fuelLeft(b) / Math.max(0.01, jobHours(b, r)) + 1e-6)));
        return n;
    }
    function queueMaxOf(r) {
        let n = QUEUE_MAX;
        for (const [id, need] of r.inputs) n = Math.min(n, Math.floor(countOf(id) / need));
        if (r.meat) n = Math.min(n, Math.floor(meatCount() / r.meat));
        if (r.water) n = Math.min(n, ownsBucket() ? Math.floor(bagWater() / r.water) : 0);
        return Math.max(0, n);
    }
    // the count last chosen for a recipe of a kind of station (this session; the menu starts there, if the bag still allows it)
    const jobCounts = () => $gameTemp._jobCounts || ($gameTemp._jobCounts = {});
    // Rzemiosło / Kuchnia: the stations work faster; the cooking ones and the smelting ones have skills of their own
    const COOK_STATIONS = ["campfire", "tripod", "cauldron", "smokehouse", "bakery", "brewery"], SMELT_STATIONS = ["kiln", "brickworks", "forge", "huta"];
    function jobHours(b, r) {
        let k = 1 - perk("craft.speed");
        if (b && COOK_STATIONS.includes(b.type)) k -= perk("cook.speed");
        if (b && SMELT_STATIONS.includes(b.type)) k -= perk("smelt.speed");
        return r.hours * Math.max(0.3, k);
    }
    // Oszczędny: now and then one of the materials comes back
    function giveBackOne(r) {
        if (!r.inputs.length || !perkRoll("craft.save")) return;
        const [id] = r.inputs[Math.floor(Math.random() * r.inputs.length)];
        $gameParty.gainItem(itemOf(id), 1);
    }
    // Podwójna robota / Większe porcje: a double batch - never of a tool or of something one has once (key items)
    function doubles(id, cooking) {
        const item = itemOf(id);
        const du = T.api("Durability");
        if (!item || item.itypeId === 2 || (du && du.TOOLS && du.TOOLS[id])) return false;
        return perkRoll(cooking ? "cook.double" : "craft.double");
    }
    // count: how many of it one after another (the job queue; 1 when left out) - all their inputs are paid now, the strength once
    function startJob(b, recipeId, count) {
        const r = recipeOf(b, recipeId);
        if (!r || b.job) return false;
        const n = queueable(b, r) ? Math.max(1, Math.min(QUEUE_MAX, Math.floor(count) || 1)) : 1;
        if (geoOf(b).fire && !fireLit(b)) { complain(itemOf(ITEM.wood).iconIndex, b.rainOut ? fireOutText(b) : "Ogień wygasł. Dorzuć drewna."); return false; }
        if (r.tool && !requireItem(r.tool)) return false;
        const waterBad = waterProblem(r, n);
        if (waterBad) { complain(itemOf(ITEM.bucket).iconIndex, waterBad); return false; }
        const missing = missingInputs(r, n);
        if (missing.length > 0) { complain(itemOf(missing[0][0]).iconIndex, "Brakuje: " + missingName(missing[0])); return false; }
        if (!spendStamina(r.stamina || 0)) return false;
        for (const [id, k] of r.inputs) $gameParty.loseItem(itemOf(id), k * n, false);
        if (r.meat) spendMeat(r.meat * n);
        if (r.water) setBagWater(bagWater() - r.water * n);
        for (let i = 0; i < n; i++) giveBackOne(r);
        const begin = () => {
            const each = jobHours(b, r);
            b.job = { recipe: r.id, start: clockHours(), hours: each * n, out: r.output.slice(), sit: !!r.roast && !geoOf(b).hang && $gamePlayer.isToolSwinging() };   // sit: the player is at the fire for it (on a stick, not on a tripod)
            if (n > 1) Object.assign(b.job, { count: n, each, taken: 0 });
            playSe(r.startSe || BUILDINGS[b.type].startSe || SE.kindle, 90);
            fx(b.x, b.y, "dirt", false);
        };
        if (!r.roast) {
            swingThen(CROUCH_KIND, begin);
            return true;
        }
        // A tripod: the food is hung on the hook and roasts by itself, like in any oven (a background job): the player may leave, or wait
        // beside it (waitAtFire), and collects it from the fire when it is done.
        if (geoOf(b).hang) {
            swingThen(CROUCH_KIND, begin);
            return true;
        }
        // On a stick: the player sits at the fire with the food until it is done (r.hours of game time, run faster when that would take
        // long), then stands up with it. Cancel / a direction key gets up early: then nothing is roasted and nothing stays on the fire -
        // the raw food goes back to the bag.
        const sph = num(PluginManager.parameters("DayNightCycle").secondsPerHour, 60) || 60;
        const extra = Math.max(0, (jobHours(b, r) * sph / SIT_MAX_SECONDS - 1) / 60 / sph);   // extra game hours per frame while waiting
        swingThen(ROAST_KIND, begin, {
            holdWhile: () => !!b.job && !jobPaused(b) && !jobReady(b) && buildingsOf($gameMap.mapId()).indexOf(b) >= 0,
            onWait: () => { if (extra > 0 && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(extra); },
            onHoldEnd: cancelled => {
                if (!cancelled && b.job && jobReady(b)) collectJob(b);
                else if (b.job && b.job.sit) {
                    const rained = jobPaused(b);
                    giveUpRoast(b, rained);
                    if (rained) popup(itemOf(r.inputs[0][0]).iconIndex, "Deszcz zgasił ogień: nie upiekło się", "#ffb4a0");
                }
            }
        });
        return true;
    }
    // Sitting beside the tripod while the food on it roasts (optional). Getting up early does not spoil anything: it keeps roasting.
    function waitAtFire(b) {
        if (!b.job || jobReady(b) || jobPaused(b)) return false;
        const sph = num(PluginManager.parameters("DayNightCycle").secondsPerHour, 60) || 60;
        const extra = Math.max(0, (jobHoursLeft(b) * sph / SIT_MAX_SECONDS - 1) / 60 / sph);
        swingThen(ROAST_WAIT_KIND, () => {}, {
            holdWhile: () => !!b.job && !jobPaused(b) && !jobReady(b) && buildingsOf($gameMap.mapId()).indexOf(b) >= 0,
            onWait: () => { if (extra > 0 && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(extra); },
            onHoldEnd: cancelled => { if (!cancelled && b.job && jobReady(b)) collectJob(b); }
        });
        return true;
    }
    // the player got up before the food was done: nothing is roasted and nothing stays on the fire, the raw food goes back to the bag
    function giveUpRoast(b, silent) {
        const r = b.job ? recipeOf(b, b.job.recipe) : null;
        endJob(b);
        if (r) for (const [id, n] of r.inputs) $gameParty.gainItem(itemOf(id), n);
        changed();
        if (r && !silent) popup(itemOf(r.inputs[0][0]).iconIndex, "Nie upiekło się", "#ffb4a0");
    }
    // what is finished goes into the bag (of a queue: those done so far, as many as there is room for; the rest goes on)
    function collectJob(b) {
        const k = jobCollectable(b);
        if (k < 1) return false;
        const [id, n] = b.job.out, item = itemOf(id);
        const fit = Math.min(k, Math.floor(($gameParty.maxItems(item) - countOf(id)) / Math.max(1, n)));
        if (fit < 1) { complainNoSpace(item); return false; }
        swingThen(CROUCH_KIND, () => giveJobOutput(b, fit));
        return true;
    }
    // k: how many of the finished ones (all that are finished when left out); the job ends with the last of its count
    function giveJobOutput(b, k) {
        if (!b.job) return;
        const [id, n] = b.job.out, item = itemOf(id), cooking = COOK_STATIONS.includes(b.type), recipe = b.job.recipe;
        const take = Math.max(1, Math.min(k || jobCollectable(b) || 1, jobCount(b) - (b.job.taken || 0)));
        let got = 0;
        for (let i = 0; i < take; i++) got += n * (doubles(id, cooking) ? 2 : 1);
        const taken = (b.job.taken || 0) + take;
        if (taken >= jobCount(b)) endJob(b);
        else b.job.taken = taken;
        playSe(SE.collect, 100);
        $gameParty.gainItem(item, got);
        T.emit("craft", { station: b.type, item: id, n: got, recipe });
    }
    // a recipe chosen while the last one waits to be collected: that goes into the bag first, at once (the new job's crouch follows) -
    // the user's, 2026-09-26: "póki gotowego nie zbierze, nie może użyć innych opcji budynku". false (with a popup) when there is no room for it
    function takeReadyFirst(b) {
        if (!b.job || !jobReady(b)) return true;
        const [id, n] = b.job.out, item = itemOf(id), k = jobCollectable(b);
        if (!spaceFor(item, n * k)) { complainNoSpace(item); return false; }
        giveJobOutput(b, k);
        return true;
    }
    // ---- storage chests: b.store = { "i78": n, "w3": n, "a5": n } (item / weapon / armor id -> count)
    const isChest = b => !!(BUILDINGS[b.type] && BUILDINGS[b.type].slots);
    const itemKey = item => (DataManager.isItem(item) ? "i" : DataManager.isWeapon(item) ? "w" : "a") + item.id;
    function itemByKey(k) {
        const table = k[0] === "i" ? $dataItems : k[0] === "w" ? $dataWeapons : $dataArmors;
        return table[Number(k.slice(1))] || null;
    }
    // key items (tools, story items) never go into a chest
    const storable = item => !!item && !!item.name && !(DataManager.isItem(item) && item.itypeId === 2);
    function chestStacks(b) {
        const order = { i: 0, w: 1, a: 2 }, out = [];
        for (const k of Object.keys(b.store || {})) {
            const item = itemByKey(k);
            if (item && b.store[k] > 0) out.push({ item, n: b.store[k], k });
        }
        out.sort((p, q) => order[p.k[0]] - order[q.k[0]] || p.item.id - q.item.id);
        return out;
    }
    const chestKinds = b => Object.keys(b.store || {}).filter(k => b.store[k] > 0).length;
    const chestSlots = b => (BUILDINGS[b.type] || {}).slots || 0;
    const chestHolds = (b, item) => (b.store && b.store[itemKey(item)]) || 0;
    // what the party carries and may put away
    function packStacks() {
        return $gameParty.allItems().filter(storable).map(item => ({ item, n: $gameParty.numItems(item) })).filter(s => s.n > 0);
    }
    // food and what it is made of: the pantry takes only this
    const FOOD_EXTRA = [74, 76, 81, 82, 92];   // barley, honey, beer, flour, flax fibre
    const isFood = item => !!item && DataManager.isItem(item) && (!!T.call("FoodTable", "has", item) || !!(item.meta && item.meta.Food) || FOOD_EXTRA.includes(item.id) || !!T.call("Spoilage", "isPerishable", item) || item.id === ITEM.rot);
    // null when it can move, otherwise the reason (direction: "put" into the chest, "take" out of it)
    function whyNotMove(b, item, direction) {
        if (direction === "put") {
            if (!storable(item)) return "Tego nie da się schować.";
            if (BUILDINGS[b.type].foodOnly && !isFood(item)) return "Tu trzyma się tylko jedzenie.";
            if (chestHolds(b, item) === 0 && chestKinds(b) >= chestSlots(b)) return "Skrzynia jest pełna.";
            if (chestHolds(b, item) >= $gameParty.maxItems(item)) return "Stos w skrzyni jest pełny.";
            return null;
        }
        if (chestHolds(b, item) < 1) return "Tego nie ma w skrzyni.";
        if ($gameParty.numItems(item) >= $gameParty.maxItems(item)) return "Stos w plecaku jest pełny.";
        return null;
    }
    // moves up to n; returns how many really moved
    function putInChest(b, item, n) {
        if (whyNotMove(b, item, "put") || !(n >= 1)) return 0;
        const k = itemKey(item), held = chestHolds(b, item);
        const moved = Math.min(n, $gameParty.numItems(item), $gameParty.maxItems(item) - held);
        if (moved < 1) return 0;
        $gameParty.loseItem(item, moved, false);
        T.call("Spoilage", "chestPut", b, item, moved);   // the food keeps its age inside
        if (!b.store) b.store = {};
        b.store[k] = held + moved;
        return moved;
    }
    function takeFromChest(b, item, n) {
        if (whyNotMove(b, item, "take") || !(n >= 1)) return 0;
        const k = itemKey(item), held = chestHolds(b, item);
        const moved = Math.min(n, held, $gameParty.maxItems(item) - $gameParty.numItems(item));
        if (moved < 1) return 0;
        T.call("Spoilage", "chestPreload", b, item, moved);   // ...and gets it back in the bag
        $gameParty.gainItem(item, moved);
        if (held - moved > 0) b.store[k] = held - moved; else delete b.store[k];
        return moved;
    }
    function openChest(b) {
        if (!isChest(b)) return false;
        lockPlayer(2);
        playSe(SE.chest, 100);
        SceneManager.push(Scene_Chest);
        SceneManager.prepareNextScene($gameMap.mapId(), b.id);
        const scene = SceneManager._scene;   // like Scene_Map.callMenu: settle the map before the snapshot
        if (scene && scene._mapNameWindow) scene._mapNameWindow.hide();
        if (scene && scene._waitCount !== undefined) scene._waitCount = 2;
        return true;
    }

    // A recipe done by hand (sawing, forging): it happens right now, costs stamina, and the time it
    // takes passes in front of the player (a short swing and pause) - nothing keeps working by itself.
    // unique recipes: the item that makes it pointless (the result itself or one that replaces it), 0 when none
    function ownedOutput(r) {
        if (!r.unique) return 0;
        if (countOf(r.output[0]) >= 1) return r.output[0];
        if (r.alsoBuilt && Object.values(farm().buildings).some(list => (list || []).some(b => b.type === r.alsoBuilt))) return r.output[0];   // pitched somewhere
        return (r.also || []).find(id => countOf(id) >= 1) || 0;
    }
    // a tool the recipe needs in the bag (it is not used up): its name when it is missing, "" otherwise
    const toolMissing = r => r.tool && countOf(r.tool) < 1 ? itemOf(r.tool).name : "";
    const improved = r => !!(r.improve && IMPROVE[r.improve] && IMPROVE[r.improve].done());
    const resultText = (r, out) => (r.repair ? "Naprawiasz: " + out.name : r.result ? "Wynik: " + r.result : "Wynik: " + out.name + " ×" + r.output[1]);
    // the swing the body makes for a hand recipe: hammering (workbench, forge) and sawing look like it
    const craftSwing = r => r.swing === "crouch" ? CROUCH_KIND : r.startSe === "Hammer" ? HAMMER_KIND : r.startSe === "Slash1" ? RAKE_KIND : CROUCH_KIND;
    function craftManual(b, r) {
        const out = itemOf(r.output[0]), own = r.repair ? 0 : ownedOutput(r);
        if (own) { complain(itemOf(own).iconIndex, "Masz już: " + itemOf(own).name); return false; }
        if (improved(r)) { complain(out.iconIndex, IMPROVE[r.improve].doneText); return false; }
        if (toolMissing(r)) { complain(itemOf(r.tool).iconIndex, "Potrzebujesz: " + toolMissing(r)); return false; }
        const missing = missingInputs(r);
        if (missing.length > 0) { complain(itemOf(missing[0][0]).iconIndex, "Brakuje: " + missingName(missing[0])); return false; }
        if (!r.repair && !r.improve && !spaceFor(out, r.output[1])) { complainNoSpace(out); return false; }
        if (!spendStamina(r.stamina || 0)) return false;
        for (const [id, n] of r.inputs) $gameParty.loseItem(itemOf(id), n, false);
        if (!r.repair && !r.improve) giveBackOne(r);
        const se = r.startSe || (b && BUILDINGS[b.type] && BUILDINGS[b.type].startSe) || SE.build;
        swingThen(craftSwing(r), () => {
            lockPlayer(62);   // about a second, matching the sounds and the pause below
            playSe(se, 90);
            later(9, () => playSe(se, 80));
            later(18, () => playSe(se, 95));
            later(32, () => {
                if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(jobHours(b, r));
                if (r.repair) {
                    T.call("Durability", "repair", r.repair);
                    popup(out.iconIndex, out.name + ": naprawione", "#9ff0a8");
                } else if (r.improve && IMPROVE[r.improve]) {
                    IMPROVE[r.improve].run();
                    popup(out.iconIndex, IMPROVE[r.improve].text(), "#9ff0a8");
                } else {
                    const got = r.output[1] * (doubles(r.output[0], false) ? 2 : 1);
                    $gameParty.gainItem(out, got);
                    if (r.tool) useTool(r.tool);
                    T.emit("craft", { station: b ? b.type : "hand", item: r.output[0], n: got, recipe: r.id });
                }
            });
        });
        return true;
    }

    // one background recipe of a station's "Przepis" tab. One that can start now and can be queued carries qty { n, max }: ← / → on
    // it (Window_FarmList) set how many at once (setQty rebuilds the line: "×n" after the name, the costs of all n) - up to what the
    // bag pays for (queueMax); OK starts them all. count: the n to show (the last one chosen for this recipe when left out)
    function recipeEntry(b, def, r, busy, readyNote, count) {
        const out = itemOf(r.output[0]), missing = missingInputs(r), waterBad = waterProblem(r);
        const enabled = !busy && missing.length === 0 && !waterBad;
        const canQueue = enabled && queueable(b, r), max = canQueue ? Math.max(1, queueMax(b, r)) : 1, key = b.type + ":" + r.id;
        const n = canQueue ? Math.max(1, Math.min(max, count || jobCounts()[key] || 1)) : 1;
        const sit = r.roast ? "\n" + (def.hang ? "Zawieszasz to na haczyku trójnogu: piecze się samo, możesz odejść." : "Siedzisz z tym na patyku nad ogniem. Jeśli odejdziesz przed końcem, nic się nie upiecze.") : "";
        const toolNote = r.tool ? " Potrzebne: " + itemOf(r.tool).name + "." : "";
        const waterNote = r.water ? " Potrzeba: " + r.water + " porcji wody z wiadra." : "";
        const time = n > 1 ? n + " × " + hoursText(r.hours).replace(/\.$/, "") + " po kolei" : hoursText(r.hours).replace(/\.$/, "");
        const help = busy ? busy
            : missing.length > 0 ? "Brakuje: " + missing.map(p => missingName(p) + " (" + missingHave(p) + "/" + p[1] + ")").join(", ") + "." + toolNote + waterNote
            : waterBad ? waterBad + "." + waterNote
            : "Wynik: " + out.name + " ×" + r.output[1] * n + ", " + time + ".\n" + r.desc + sit + toolNote + readyNote;
        const facts = [r.roast && !def.hang ? "Czas: " + hoursText(r.hours) + " (siedzisz przy ogniu; odejście przerywa pieczenie)" : "Czas: " + hoursText(r.hours) + (n > 1 ? " za każdą sztukę, razem " + hoursText(r.hours * n) : "") + (def.hang ? " (piecze się na trójnogu, możesz odejść)" : " (piec pracuje w tle)")];
        if (canQueue) facts.push("Ile naraz: ×" + n + " (strzałki ← →" + (max > 1 ? ", najwięcej ×" + max : ": na więcej brakuje materiałów") + "; zakładki: Q / E)");
        const e = { name: r.name + (n > 1 ? " ×" + n : ""), costs: costRowsWithWater(r, n), enabled, help, run: () => { if (takeReadyFirst(b)) startJob(b, r.id, n); }, tab: "recipe",
            tip: (busy ? busy + "\n" : "") + "Wynik: " + out.name + " ×" + r.output[1] * n + ".\n" + r.desc, facts };
        if (canQueue) {
            Object.assign(e, { qty: { n, max }, wideName: r.name + (max > 1 ? " ×" + max : ""), wideCosts: costRowsWithWater(r, max) });
            // (a method: the window calls it on the line it shows; true when the count changed)
            e.setQty = function(v) {
                const m = Math.max(1, Math.min(this.qty.max, v));
                if (m === this.qty.n) return false;
                jobCounts()[key] = m;
                Object.assign(this, recipeEntry(b, def, r, busy, readyNote, m));
                return true;
            };
        }
        return e;
    }
    // menu lines of a crafting station: the running job and its result, then the recipes. While something is inside,
    // the background recipes stay on the list, greyed out with the reason, so the "Przepis" tab never goes empty.
    function stationEntries(b, def) {
        const entries = [];
        const autoRecipes = def.recipes.filter(r => !r.manual), manualRecipes = def.recipes.filter(r => r.manual);
        let busy = null, readyNote = "";
        if (b.job) {
            const [id, n] = b.job.out, item = itemOf(id), k = jobCollectable(b), count = jobCount(b);
            if (jobReady(b)) {   // (the recipes stay open: choosing one takes this into the bag first)
                entries.push({ name: "Zbierz: " + item.name + " ×" + n * k, icon: item.iconIndex, help: "Gotowe. Zabierasz " + item.name + " ×" + n * k + " do plecaka.", run: () => collectJob(b), tab: "recipe" });
                readyNote = "\nNajpierw zabierasz gotowe: " + item.name + " ×" + n * k + ".";
            } else {   // (what is going on and how long it takes is said under the building's name: buildingStatus)
                if (k > 0) entries.push({ name: "Zbierz: " + item.name + " ×" + n * k, icon: item.iconIndex, tab: "recipe", run: () => collectJob(b),   // (a queue: the finished ones, the rest goes on)
                    help: "Gotowe " + k + " z " + count + ". Zabierasz " + item.name + " ×" + n * k + " do plecaka, a reszta robi się dalej." });
                if (def.hang && !jobPaused(b)) entries.push({ name: "Poczekaj przy ogniu", icon: 82, help: "Siadasz przy ogniu, aż się upiecze. Możesz też wstać i odejść: piecze się dalej.", run: () => waitAtFire(b) });
                const r = recipeOf(b, b.job.recipe);
                busy = ((r && r.doing) || "Trwa praca") + (count > 1 ? " " + Math.min(count, jobFinished(b) + 1) + "/" + count : "") + ": " + item.name + ". Poczekaj, aż się skończy (jeszcze ~" + hoursText(jobHoursLeft(b)) + ").";
            }
        }
        for (const r of autoRecipes) entries.push(recipeEntry(b, def, r, busy, readyNote));
        // hand work is available at any time (also while the fire of the same building burns)
        for (const r of manualRecipes) entries.push(Object.assign(manualEntry(b, r), { tab: "recipe" }));
        if (def.repairs && T.api("Durability")) for (const r of T.api("Durability").repairRecipes()) entries.push(Object.assign(manualEntry(b, r), { tab: "recipe" }));
        return entries;
    }

    // a fire's plain line right under its name: when it goes out
    function fireNote(b, def) {
        if (!def.fire || b.site) return null;
        const left = fuelLeft(b);
        if (b.rainOut) return rainingHere() ? "Deszcz przygasił ogień" : "Deszcz zgasił ogień";
        return left > 0 ? "Zgaśnie za " + clockText(left) : b.job ? "Zgaśnie, gdy zdejmiesz jedzenie z ognia" : "Ogień wygasł";
    }
    // ------------------------------------------------------------------
    // The chest screen: the pack on the left, the chest on the right.
    // ------------------------------------------------------------------
    function Window_ChestList() {
        this.initialize(...arguments);
    }
    Window_ChestList.prototype = Object.create(Window_Selectable.prototype);
    Window_ChestList.prototype.constructor = Window_ChestList;

    Window_ChestList.prototype.initialize = function(rect, emptyText) {
        this._stacks = [];
        this._emptyText = emptyText || "";
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_ChestList.prototype.maxItems = function() {
        return this._stacks.length;
    };
    Window_ChestList.prototype.currentStack = function() {
        return this._stacks[this.index()] || null;
    };
    Window_ChestList.prototype.item = function() {
        const stack = this.currentStack();
        return stack ? stack.item : null;
    };
    Window_ChestList.prototype.isCurrentItemEnabled = function() {
        return !!this.currentStack();
    };
    // the lists keep the cursor where it was, clamped to the new length
    Window_ChestList.prototype.setStacks = function(stacks) {
        this._stacks = stacks;
        this.refresh();
        this.select(stacks.length > 0 ? Math.max(0, Math.min(this.index(), stacks.length - 1)) : -1);
    };
    // the chest's own list (_chest set): food shows how long it stays good in there - longer in a pantry (Spoilage.js; the user's, 2026-09-25)
    Window_ChestList.prototype.freshness = function(item) {
        const sp = T.api("Spoilage");
        return this._chest && sp && sp.chestFreshness ? sp.chestFreshness(this._chest, item.id) : null;
    };
    Window_ChestList.prototype.drawItem = function(index) {
        const stack = this._stacks[index], rect = this.itemLineRect(index);
        const label = "×" + stack.n, w = this.textWidth("×99") + 4, fresh = this.freshness(stack.item);
        const fw = fresh ? this.textWidth(fresh.text) + 16 : 0;
        this.drawItemName(stack.item, rect.x, rect.y, rect.width - w - fw);
        if (fresh) {   // (the colours of the bag's numbers: yellow past half its life, red near the end)
            this.changeTextColor(ColorManager.textColor(fresh.ratio <= 1 - T.api("Spoilage").WARN_AT ? 18 : fresh.ratio <= 0.5 ? 17 : 8));
            this.drawText(fresh.text, rect.x, rect.y, rect.width - w - 8, "right");
            this.resetTextColor();
        }
        this.drawText(label, rect.x, rect.y, rect.width, "right");
    };
    Window_ChestList.prototype.drawAllItems = function() {
        Window_Selectable.prototype.drawAllItems.call(this);
        if (this._stacks.length === 0) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(this._emptyText, 0, 0, this.innerWidth, "center");
            this.resetTextColor();
        }
    };
    Window_ChestList.prototype.updateHelp = function() {
        const item = this.item(), fresh = item && this.freshness(item);
        if (fresh && this._helpWindow) {
            const where = BUILDINGS[this._chest.type].keeps < 1 ? "Tu jedzenie psuje się wolniej: n" : "N";
            this._helpWindow.setText(item.description + "\n" + where + "ajstarsza sztuka zepsuje się tu za " + fresh.text + ".");
            return;
        }
        this.setHelpWindowItem(item);
    };
    // the screen stays on the same list after a move: OK / page keys do not deactivate the window
    Window_ChestList.prototype.processOk = function() {
        this.updateInputData();
        this.callOkHandler();
    };
    Window_ChestList.prototype.processPagedown = function() {
        this.updateInputData();
        this.callHandler("pagedown");
    };
    Window_ChestList.prototype.processPageup = function() {
        this.updateInputData();
        this.callHandler("pageup");
    };
    Window_ChestList.prototype.processHandling = function() {
        if (this.isOpenAndActive() && (Input.isTriggered("left") || Input.isTriggered("right"))) {
            this.updateInputData();
            this.callHandler("side");
            return;
        }
        Window_Selectable.prototype.processHandling.call(this);
    };

    const CHEST_STEPS = [1, 5, 10, 0];   // how many to move at once, 0 = the whole stack
    const stepLabel = s => s === 0 ? "wszystko" : "×" + s;

    function Scene_Chest() {
        this.initialize(...arguments);
    }
    Scene_Chest.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Chest.prototype.constructor = Scene_Chest;

    Scene_Chest.prototype.prepare = function(mapId, buildingId) {
        this._mapId = mapId;
        this._buildingId = buildingId;
    };
    Scene_Chest.prototype.chest = function() {
        return (farm().buildings[this._mapId] || []).find(b => b.id === this._buildingId) || null;
    };
    Scene_Chest.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this._step = 0;
        this._note = "";
        this.createHelpWindow();
        this.createTitleWindows();
        this.createListWindows();
        this.createFooterWindow();
        this.refreshAll();
        this.focus(this._packList);
    };
    Scene_Chest.prototype.halfWidth = function() {
        return Math.floor(Graphics.boxWidth / 2);
    };
    Scene_Chest.prototype.titleHeight = function() {
        return this.calcWindowHeight(1, false);
    };
    Scene_Chest.prototype.footerHeight = function() {
        return this.calcWindowHeight(2, false);
    };
    Scene_Chest.prototype.listTop = function() {
        return this.mainAreaTop() + this.titleHeight();
    };
    Scene_Chest.prototype.createTitleWindows = function() {
        const half = this.halfWidth(), top = this.mainAreaTop(), h = this.titleHeight();
        this._packTitle = new Window_Help(new Rectangle(0, top, half, h));
        this._chestTitle = new Window_Help(new Rectangle(half, top, Graphics.boxWidth - half, h));
        this.addWindow(this._packTitle);
        this.addWindow(this._chestTitle);
    };
    Scene_Chest.prototype.createListWindows = function() {
        const half = this.halfWidth(), top = this.listTop();
        const h = this.mainAreaBottom() - this.footerHeight() - top;
        this._packList = new Window_ChestList(new Rectangle(0, top, half, h), "Plecak jest pusty");
        this._chestList = new Window_ChestList(new Rectangle(half, top, Graphics.boxWidth - half, h), "Skrzynia jest pusta");
        for (const list of [this._packList, this._chestList]) {
            list.setHelpWindow(this._helpWindow);
            list.setHandler("ok", this.onTransfer.bind(this));
            list.setHandler("cancel", this.popScene.bind(this));
            list.setHandler("side", this.onSide.bind(this));
            list.setHandler("pagedown", this.onStep.bind(this, 1));
            list.setHandler("pageup", this.onStep.bind(this, -1));
            this.addWindow(list);
        }
    };
    Scene_Chest.prototype.createFooterWindow = function() {
        const h = this.footerHeight();
        this._footer = new Window_Help(new Rectangle(0, this.mainAreaBottom() - h, Graphics.boxWidth, h));
        this.addWindow(this._footer);
    };
    Scene_Chest.prototype.otherList = function() {
        return this._focusList === this._packList ? this._chestList : this._packList;
    };
    Scene_Chest.prototype.focus = function(list) {
        this._focusList = list;
        this.otherList().deactivate();
        list.activate();
        this._packList.contentsOpacity = this._focusList === this._packList ? 255 : 150;
        this._chestList.contentsOpacity = this._focusList === this._chestList ? 255 : 150;
        this.refreshTitles();
    };
    Scene_Chest.prototype.refreshAll = function() {
        const b = this.chest();
        this._chestList._chest = b;   // (its food: how long it keeps in there)
        this._packList.setStacks(packStacks());
        this._chestList.setStacks(b ? chestStacks(b) : []);
        this.refreshTitles();
        this.refreshFooter();
    };
    Scene_Chest.prototype.refreshTitles = function() {
        const b = this.chest();
        if (!b || !this._focusList) return;
        const colour = list => this._focusList === list ? "\\C[0]" : "\\C[16]";
        this._packTitle.setText(colour(this._packList) + "Plecak");
        this._chestTitle.setText(colour(this._chestList) + BUILDINGS[b.type].name + "  " + chestKinds(b) + "/" + chestSlots(b));
    };
    Scene_Chest.prototype.refreshFooter = function() {
        const line1 = "OK: przenieś   Lewo/Prawo: strona   Anuluj: wyjdź";
        const line2 = "Q/E: ilość naraz \\C[17]" + stepLabel(CHEST_STEPS[this._step]) + "\\C[0]" + (this._note ? "    \\C[2]" + this._note : "");
        this._footer.setText(line1 + "\n" + line2);
    };
    Scene_Chest.prototype.onSide = function() {
        this.focus(this.otherList());
        SoundManager.playCursor();
    };
    Scene_Chest.prototype.onStep = function(direction) {
        this._step = (this._step + direction + CHEST_STEPS.length) % CHEST_STEPS.length;
        this._note = "";
        this.refreshFooter();
        SoundManager.playCursor();
    };
    Scene_Chest.prototype.onTransfer = function() {
        const b = this.chest(), list = this._focusList, stack = list.currentStack();
        if (!b || !stack) { SoundManager.playBuzzer(); return; }
        const toChest = list === this._packList;
        const step = CHEST_STEPS[this._step], want = step === 0 ? stack.n : step;
        const moved = toChest ? putInChest(b, stack.item, want) : takeFromChest(b, stack.item, want);
        if (moved < 1) {
            this._note = whyNotMove(b, stack.item, toChest ? "put" : "take") || "Nic się nie przeniosło.";
            SoundManager.playBuzzer();
        } else {
            this._note = "";
            playSe(SE.move, 100);
        }
        this.refreshAll();
        // a list that has just run empty hands the cursor over to the other one
        if (list.maxItems() === 0 && this.otherList().maxItems() > 0) this.focus(this.otherList());
        else list.reselect();
    };
    // a click on the other list switches to it
    Scene_Chest.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (this._focusList && TouchInput.isTriggered()) {
            const other = this.otherList();
            if (other.isTouchedInsideFrame()) this.focus(other);
        }
    };


    P.stations = { jobHoursLeft, jobPaused, jobReady, jobCount, jobFinished, jobCollectable, fuelLeft, fireLit, fireOutText,
        smoulderOf, feedFireEntries, recipeOf, missingInputs, queueMax, jobHours, startJob, giveUpRoast, collectJob,
        takeReadyFirst, isChest, chestStacks, chestKinds, chestHolds, packStacks, isFood, whyNotMove, putInChest, takeFromChest,
        openChest, ownedOutput, toolMissing, improved, resultText, craftManual, recipeEntry, stationEntries, fireNote,
        Window_ChestList, Scene_Chest };
})();
