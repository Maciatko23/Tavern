//=============================================================================
// Farming_UI.js
//=============================================================================
// The farm's menus (split out of Farming.js, 2026-09-29): what the action button offers on a tile (a building, a site, a crop, the
// ground), the hand and the "Postaw..." menus, the build list (Q) and the food list (E), the list window with its title plate and
// the popup beside it, and the scene's menu methods (their bodies: Farming.js puts them on Scene_Map).
// Functions and classes only: Farming.js holds every engine hook.

/*:
 * @target MZ
 * @plugindesc Menu gospodarstwa (część Farming.js): co przycisk akcji proponuje na kratce, menu budowy (Q) i jedzenia (E), okno listy z tytułem i dymkiem opisu. Sama nic nie robi - parametry i haki ma Farming.js. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Farming
 * @orderAfter Farming
 *
 * @help
 * ============================================================================
 * Farming_UI.js - menu gospodarstwa
 * ============================================================================
 * Część Farming.js (wydzielona z niego): co przycisk akcji proponuje na
 * kratce (budynek, plac budowy, roślina, ziemia), menu "Wytwórz..." i
 * "Postaw...", lista budowy (Q) i jedzenia (E), okno listy z tabliczką
 * tytułu i dymkiem opisu obok. Sama nic nie robi: woła ją Farming.js.
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
    if (!T) throw new Error("Farming_UI.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Farming_parts") || T.register("Farming_parts", {});
    if (P.ui) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("Farming_UI.js: musi być pod Farming.js na liście wtyczek (Farming.js is missing or below)");
    const SCENE = {};   // the methods Farming.js puts on Scene_Map (their bodies)
    const { PL, B, S, link, ITEM, ICON, STAMINA, canMax, SEASON_NAMES, seasonIndex, seasonOf, GROUND_REST, CROPS, BUILDINGS,
        HAND_RECIPES, CROP_IDS, BUILDING_IDS, today, isHutInterior, hutOf, geoOf, buildingAt, solidAt, itemOf, countOf, complain,
        lockPlayer, NO_BUILD, menuHooks, rainingHere, hoursText, IMPROVE, costRows, targetTile, MENU_MARGIN } = P.core;
    const [plotAt, canCharges, needsOn, wellEntries, bucketUnits, bucketFor, bucketEntries, wateredRecently, isRipe, daysLeft,
        rake, till, plant, harvest, uproot, water, dig, potDryness, potHoursLeft, tablePots, tablePotDry, tablePotHoursLeft,
        tableEntries, potEntries, clayEntry] =
        link(PL, ["plotAt", "canCharges", "needsOn", "wellEntries", "bucketUnits", "bucketFor", "bucketEntries", "wateredRecently",
            "isRipe", "daysLeft", "rake", "till", "plant", "harvest", "uproot", "water", "dig", "potDryness", "potHoursLeft",
            "tablePots", "tablePotDry", "tablePotHoursLeft", "tableEntries", "potEntries", "clayEntry"]);
    const [mapAllowsBuilding, buildsAnywhere, tileIsFree, missingMaterials, siteHits, hitCost, upgradeEntry, packUp, wakeHour,
        sleepInTent, siteMenu, demolishBlock, demolish, readyProduce, daysToProduce, collect, snareSprung, snareBait,
        snareBaitEntry, rest, restDanger, sleepy, sleepyNote, whyNoRest, noRestHelp, groundRate, lieDown, enterHut, startPlacement] =
        link(B, ["mapAllowsBuilding", "buildsAnywhere", "tileIsFree", "missingMaterials", "siteHits", "hitCost", "upgradeEntry",
            "packUp", "wakeHour", "sleepInTent", "siteMenu", "demolishBlock", "demolish", "readyProduce", "daysToProduce",
            "collect", "snareSprung", "snareBait", "snareBaitEntry", "rest", "restDanger", "sleepy", "sleepyNote", "whyNoRest",
            "noRestHelp", "groundRate", "lieDown", "enterHut", "startPlacement"]);
    const [jobHoursLeft, jobPaused, jobReady, jobCount, jobFinished, jobCollectable, fireLit, fireOutText, feedFireEntries,
        recipeOf, missingInputs, chestKinds, openChest, ownedOutput, toolMissing, improved, resultText, craftManual,
        stationEntries, fireNote] =
        link(S, ["jobHoursLeft", "jobPaused", "jobReady", "jobCount", "jobFinished", "jobCollectable", "fireLit", "fireOutText",
            "feedFireEntries", "recipeOf", "missingInputs", "chestKinds", "openChest", "ownedOutput", "toolMissing", "improved",
            "resultText", "craftManual", "stationEntries", "fireNote"]);

    // ------------------------------------------------------------------
    // What the action button offers on a tile: { title, entries } where an entry
    // is { name, icon, costs, right, help, enabled, run }. null = nothing here;
    // { done: true } = the action was carried out right away (ripe crop).
    // ------------------------------------------------------------------
    // (no "Zostaw" line on any menu: cancel closes it)

    function costsOf(type) {
        return costRows(BUILDINGS[type].cost);
    }
    function costText(type) {
        return BUILDINGS[type].cost.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ");
    }

    // one line of a manual recipe (hand menu, workbench, forge...): costs with stock, what it gives; a tool that is
    // already owned stays on the list, dimmed; a recipe that needs a tool (the saw) is dimmed until it is in the bag
    function manualEntry(b, r) {
        const missing = missingInputs(r), out = itemOf(r.output[0]), own = ownedOutput(r), noTool = toolMissing(r), done = improved(r);
        let help;
        if (own) help = "Masz już: " + itemOf(own).name + ".";
        else if (done) help = IMPROVE[r.improve].doneText + ".";
        else if (noTool) help = "Potrzebujesz: " + noTool + ".";
        else if (missing.length > 0) help = "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + ".";
        else help = resultText(r, out) + ". Ręcznie: " + hoursText(r.hours) + ", -" + (r.stamina || 0) + " wytrzymałości.\n" + r.desc;
        const facts = ["Czas: " + hoursText(r.hours) + ", -" + (r.stamina || 0) + " wytrzymałości (praca ręczna)"];
        if (r.tool) facts.push("Wymaga: " + itemOf(r.tool).name + (noTool ? " (nie masz)" : " (masz)"));
        return { name: r.name, costs: costRows(r.inputs), enabled: !own && !done && !noTool && missing.length === 0, help,
            tip: (own ? "Masz już: " + itemOf(own).name + ".\n" : done ? IMPROVE[r.improve].doneText + ".\n" : "") + resultText(r, out) + ".\n" + r.desc, facts,
            run: () => craftManual(b, r) };
    }
    const handRecipeEntry = r => Object.assign(manualEntry(null, r), { icon: itemOf(r.output[0]).iconIndex });
    const hammerMissing = () => countOf(ITEM.hammer) < 1;
    const handNames = () => { const n = HAND_RECIPES.map(r => itemOf(r.output[0]).name.toLowerCase()); return n.length > 1 ? n.slice(0, -1).join(", ") + " i " + n[n.length - 1] : n.join(); };
    // the entry of the plot menu that opens the hand menu
    function handMenuEntry(x, y) {
        return { name: "Wytwórz...", icon: itemOf(ITEM.hammer).iconIndex, run: () => openHandMenu(x, y),
            help: "Rzeczy, które zrobisz sam, bez budynku: " + handNames() + ". Resztę narzędzi zrobisz w warsztacie.",
            tip: "Rzeczy, które zrobisz sam, z gałęzi, kamieni i lnu z ziemi, bez żadnego budynku: " + handNames() + ".\nMłotek jest potrzebny do budowy warsztatu, a w nim powstają wszystkie inne narzędzia." };
    }
    function openHandMenu(x, y) {
        const entries = HAND_RECIPES.map(handRecipeEntry);
        entries.push({ name: "Wróć", help: "", run: () => openMenu(x, y) });
        showMenu("Wytwarzanie ręczne", entries);
    }
    // the entry of the plot menu that opens the "pitch it straight away" menu (tent, bucket, forest bedroll)
    function placeMenuEntry(x, y) {
        // (away from the grandfather's field nothing of it may stand: the entry says so with the popup)
        if (!mapAllowsBuilding() && !BUILDING_IDS.some(t => BUILDINGS[t].instant && buildsAnywhere(BUILDINGS[t]))) {
            return { name: "Postaw...", icon: itemOf(ITEM.tent).iconIndex, run: () => complain(itemOf(ITEM.tent).iconIndex, NO_BUILD),
                help: NO_BUILD + ": " + placeNames() + " postawisz tylko tam.", tip: NO_BUILD + ": " + placeNames() + " postawisz tylko tam." };
        }
        return { name: "Postaw...", icon: itemOf(ITEM.tent).iconIndex, run: () => openPlaceMenu(x, y),
            help: "Stawiasz od razu, bez młotka: " + placeNames() + ".",
            tip: "Rzeczy, które stawiasz od razu, bez młotka i bez placu budowy: " + placeNames() + "." };
    }

    // shared by buildEntries/placeEntries: one menu entry per building type that passes `filter`, sharing all the
    // display logic (cost/help/facts) regardless of whether it needs a hammer and a site, or pitches straight away
    function buildingEntryList(x, y, filter) {
        const indoors = isHutInterior(), here = mapAllowsBuilding();   // (away from the grandfather's field: only what goes up anywhere - the snare)
        return BUILDING_IDS.filter(type => !BUILDINGS[type].noBuild && (indoors ? BUILDINGS[type].indoor : !BUILDINGS[type].indoorOnly) && (here || buildsAnywhere(BUILDINGS[type])) && filter(BUILDINGS[type])).map(type => {
            const def = BUILDINGS[type];
            const missing = missingMaterials(type);
            const built = !!def.single && !!hutOf();
            const how = def.instant ? "Wybierzesz miejsce, a stawia się od razu, bez młotka." : "Wybierzesz miejsce, a potem z młotkiem uderzasz w plac budowy.";
            let help = def.desc + "\nKoszt: " + costText(type) + ". " + how;
            if (missing.length > 0) help = "Brakuje: " + missing.map(([id, n]) => itemOf(id).name + " (" + countOf(id) + "/" + n + ")").join(", ") + ".\n" + def.desc;
            if (built) help = "Masz już chatkę: drugiej nie potrzeba.\n" + def.desc;
            const facts = [def.instant ? "Rozstawiasz od razu (-" + def.stamina + " wytrzymałości), bez młotka" : "Uderzeń młotkiem: " + siteHits(def) + " (po " + hitCost() + " wytrzymałości)"];
            if (def.w > 1 || (def.h || 1) > 1) facts.push("Zajmuje " + def.w + " × " + (def.h || 1) + " pól" + (def.yard ? " (ogrodzony wybieg)" : ""));
            return { name: def.name, costs: costsOf(type), help, enabled: missing.length === 0 && !built, run: () => startPlacement(type, x, y),
                tip: def.desc + "\n" + (def.instant ? "Wybierasz miejsce, a namiot stoi od razu." : "Najpierw wybierasz miejsce, potem młotkiem uderzasz w plac budowy."), facts };
        });
    }
    // real buildings: hammer + a construction site (the Q list; the ground menu has no "Zbuduj..." any more). Indoors
    // (equipping the hut) this still lists every piece of furniture regardless of instant/site, since "Wyposaż chatkę" is its own single, already-unified list.
    function buildEntries(x, y) {
        const indoors = isHutInterior();
        const list = buildingEntryList(x, y, def => indoors || !def.instant);
        // what can be built right now (the materials are in the bag) comes first, the rest after it; each part in the usual order (user)
        const entries = list.filter(e => e.enabled !== false).concat(list.filter(e => e.enabled === false));
        if (hammerMissing()) entries.unshift(handRecipeEntry(HAND_RECIPES.find(r => r.id === "hammer")));   // no hammer yet: the way to make one comes first, always
        return entries;
    }
    // things pitched straight from the bag: no hammer, no construction site (tent, bucket, forest bedroll)
    const placeNames = () => { const n = BUILDING_IDS.filter(t => BUILDINGS[t].instant).map(t => BUILDINGS[t].name.toLowerCase()); return n.length > 1 ? n.slice(0, -1).join(", ") + " i " + n[n.length - 1] : n.join(); };
    function placeEntries(x, y, direct) {
        const entries = buildingEntryList(x, y, def => !!def.instant);
        if (!direct) entries.push({ name: "Wróć", help: "", run: () => openMenu(x, y) });
        return entries;
    }

    function digEntry(x, y) {
        const soil = itemOf(ITEM.soil);
        return { name: "Wykop ziemię", icon: soil.iconIndex, right: "-" + STAMINA.dig,
            help: "Łopata. Wykopujesz 2-3 sztuki ziemi (do pieca i budowy). Masz teraz: " + countOf(ITEM.soil) + ".", run: () => dig(x, y) };
    }
    function waterEntry(x, y) {
        const plot = plotAt(x, y), active = wateredRecently(plot);
        return { name: "Podlej", icon: itemOf(ITEM.wateringCan).iconIndex, right: "-" + STAMINA.water,
            help: "Konewka (woda: " + canCharges() + "/" + canMax() + "). Rośliny rosną o 20% szybciej w dniu podlania i dzień później." + (active ? " Ta ziemia jest już podlana." : "") + (bucketFor(x, y) ? " Bez konewki podlejesz wodą z wiadra obok." : ""),
            run: () => water(x, y) };
    }

    // menu lines of a crafting station: the running job, its result, or the recipes
    // a station's menu has two tabs (left/right switch them), in this order: "Przepis" - the recipes (entries marked
    // tab: "recipe") with "Zbierz" on top when something is ready, the one it opens on - and "Akcja", everything else
    // (warming up, fuel, upgrades, demolishing). The running job itself is said under the building's name (buildingStatus).
    const TABS = [["recipe", "Przepis"], ["action", "Akcja"]];
    const splitTabs = entries => TABS.map(([id, name]) => ({ name, entries: entries.filter(e => (e.tab || "action") === id) }));
    // the line under a building's name in its menu (under the fire's note, if any): what it is making (the icon of the product, what is going on, how long it
    // still takes) or that it is ready; for the animals and the hive what has gathered, for a snare its bait or catch. null: nothing.
    function buildingStatus(b, def) {
        if (b.site) return null;
        if (def.table && tablePots(b).length) {
            const pots = tablePots(b), dryN = pots.filter(p => tablePotDry(b, p)).length, wet = pots.filter(p => !tablePotDry(b, p));
            const item = itemOf(wet.length ? ITEM.rawPot : ITEM.dryPot);
            if (!wet.length) return { icon: item.iconIndex, text: "Garnki na stole: " + pots.length + "/" + def.table.slots, right: "wyschły", ready: true };
            return { icon: item.iconIndex, text: "Garnki na stole: " + pots.length + "/" + def.table.slots + (dryN ? " (suche: " + dryN + ")" : ""), right: "schną jeszcze ~" + Math.max(...wet.map(p => tablePotHoursLeft(b, p))) + " godz.", ready: dryN > 0 };
        }
        if (def.dry) {
            const dry = potDryness(b) >= 1, item = itemOf(dry ? ITEM.dryPot : ITEM.rawPot);
            if (dry) return { icon: item.iconIndex, text: "Wysechł", right: "gotowy do wypalenia", ready: true };
            return { icon: item.iconIndex, text: rainingHere() ? "Moknie w deszczu: nie schnie" : "Schnie", right: "jeszcze ~" + potHoursLeft(b) + " godz." };
        }
        if (b.job) {
            // (a queue: "Trwa wypalanie 2/3: ..." - the one in the fire now of how many - and how many wait to be collected)
            const [id, n] = b.job.out, item = itemOf(id), r = recipeOf(b, b.job.recipe), what = item.name + (n > 1 ? " ×" + n : ""), count = jobCount(b), k = jobCollectable(b);
            if (jobReady(b)) return { icon: item.iconIndex, text: "Gotowe: " + item.name + (n * k > 1 ? " ×" + n * k : ""), right: "do zebrania", ready: true };
            if (jobPaused(b)) return { icon: item.iconIndex, text: "Stoi bez ognia: " + what, right: "rozpal ogień" };
            const step = count > 1 ? " " + Math.min(count, jobFinished(b) + 1) + "/" + count : "";
            return { icon: item.iconIndex, text: ((r && r.doing) || "Trwa praca") + step + ": " + what, right: (k > 0 ? "gotowe: " + k + ", " : "") + "jeszcze ~" + hoursText(jobHoursLeft(b)) };
        }
        const p = def.produce;
        if (!p) return null;
        const item = itemOf(p.item);
        if (def.lure) {
            const bait = snareBait(b);
            return snareSprung(b) ? { icon: item.iconIndex, text: "Złapany zając!", right: "do zebrania", ready: true }
                : bait ? { icon: itemOf(bait.item).iconIndex, text: "Przynęta: " + itemOf(bait.item).name, right: "czeka na zająca" }
                : null;
        }
        const n = readyProduce(b);
        return { icon: item.iconIndex, text: item.name + ": " + n + " / " + p.cap, right: n >= p.cap ? "pełne, zbierz" : "kolejne za " + daysToProduce(b) + " dn.", ready: n > 0 };
    }

    // a real building (not a build site): rest/produce/chest/sleep/recipes/upgrade/pack/demolish entries
    function buildingMenuFor(b) {
        const def = geoOf(b);
        const entries = [];
        if (def.door && !b.site) entries.push({ name: "Wejdź do środka", icon: 82, help: "Wchodzisz do chatki. Drzwi otwierasz też, po prostu w nie wchodząc.", run: () => enterHut(b) });
        if (def.rest) {
            const fireOut = !!def.fire && !fireLit(b);
            const no = whyNoRest();
            entries.push({ name: def.fire ? "Odpocznij przy ogniu" : "Usiądź i odpocznij", icon: 82, right: "+" + def.rest + "/godz.", enabled: !fireOut && !no,
                help: fireOut ? (b.rainOut ? fireOutText(b) : "Ogień wygasł. Dorzuć drewna, żeby odpocząć przy ogniu.")
                    : no ? noRestHelp(no)
                    : (def.fire ? "Siadasz przy ogniu" : "Siadasz") + " i odpoczywasz: co sekundę mija godzina i wraca " + def.rest + " wytrzymałości. Wstajesz sam, gdy wypoczniesz" +
                        (def.fire ? " albo ogień zgaśnie" : "") + ", albo kiedy chcesz (strzałki, O, Esc)." + (sleepy() ? "\n" + sleepyNote() : ""), run: () => rest(b) });
        }
        entries.push(...feedFireEntries(b));
        if (def.water) entries.push(...wellEntries());
        if (def.rain && !b.site) entries.push(...bucketEntries(b));
        if (def.produce) {
            const ready = readyProduce(b), item = itemOf(def.produce.item);
            const toolNote = def.produce.tool ? " Potrzebne: " + itemOf(def.produce.tool).name + "." : "";
            entries.push({ name: ready > 0 ? "Zbierz: " + item.name + " ×" + ready : "Zbierz: " + item.name, icon: item.iconIndex, enabled: ready > 0,
                help: (snareSprung(b) ? "W pułapce siedzi złapany zając. " : "") + (ready > 0 ? "Zabierasz wszystko, co jest gotowe."
                    : def.lure ? (snareBait(b) ? "Pusto. Przynęta leży, trzeba poczekać, aż jakiś zając się skusi." : "Pusto. Sama pułapka nic nie złapie: załóż przynętę.")
                    : "Jeszcze nic nie ma. Następna porcja za " + daysToProduce(b) + " dn.") + toolNote,
                run: () => collect(b) });
        }
        if (def.lure && !b.site) entries.push(snareBaitEntry(b, def));
        let title = def.name + (def.rain ? " (" + bucketUnits(b) + "/" + def.rain.max + ")" : "");
        if (def.slots) {
            if (!def.bowl) title += " (" + chestKinds(b) + "/" + def.slots + ")";   // (the kennel's bowl: its note says what is in it)
            entries.push({ name: def.openName || "Otwórz", right: chestKinds(b) + "/" + def.slots, help: def.openHelp || "Odkładaj i zabieraj przedmioty. Zmieści się " + def.slots + " rodzajów, po 99 sztuk.", run: () => openChest(b) });
        }
        if (def.sleep) entries.push({ name: "Prześpij noc", icon: itemOf(def.pack || def.cost[0][0]).iconIndex, right: def.sleepRestore < 1 ? "~" + Math.round(def.sleepRestore * 100) + "% sił" : "do rana",
            help: "Kładziesz się spać do " + wakeHour() + ":00. " + (def.sleepRestore < 1 ? "Odnawia około " + Math.round(def.sleepRestore * 100) + "% sił (" + (isHutInterior() ? "pod dachem chatki bez kary za deszcz i zimno" : "w deszczu, śniegu i zimą " + Math.round(def.sleepBad * 100) + "%") + "), " : "Odnawia wszystkie siły i zdrowie, ") + "dostajesz podsumowanie dnia, a gra zapisuje się sama.", run: () => sleepInTent(b) });
        if (def.sleep) {   // (outdoors, with a wolf or a boar after him: no sleep - greyed out, it says why)
            const danger = !isHutInterior() && restDanger();
            if (danger) Object.assign(entries[entries.length - 1], { enabled: false, help: "Nie zaśniesz - w pobliżu " + danger + "! Najpierw się z nim rozpraw albo uciekaj." });
        }
        if (def.dry && !b.site) entries.push(...potEntries(b));
        if (def.table && !b.site) entries.push(...tableEntries(b));
        if (def.recipes) entries.push(...stationEntries(b, def));
        if (def.upgrade && !b.job) entries.push(upgradeEntry(b, def));
        if (def.pack) {
            const wet = !!def.rain && bucketUnits(b) >= 1;   // a bucket with water in it is picked up together with the water: it just weighs more
            entries.push({ name: def.packName || "Złóż namiot", icon: itemOf(def.pack).iconIndex, enabled: true,
                help: (wet ? "Zabierasz z wodą w środku (" + bucketUnits(b) + "/" + def.rain.max + ").\n" : "") + (def.packHelp || "Składasz namiot i zabierasz go ze sobą. Rozstawisz go, gdzie zechcesz."), run: () => packUp(b) });
        }
        const back = def.refund || def.cost.map(([id, n]) => [id, Math.floor(n / 2)]).filter(([, n]) => n > 0);
        const block = demolishBlock(b);
        if (!def.pack && !def.dry) entries.push({ name: "Rozbierz", enabled: !block, help: block || "Zwraca połowę materiałów" + (back.length ? ": " + back.map(([id, n]) => itemOf(id).name + " ×" + n).join(", ") : "") + ".", run: () => demolish(b) });
        // other plugins add their own lines (Dog.js: the water in the kennel's bowl); one may give the note under the title
        let hookNote = null;
        for (const hook of menuHooks) { const n = hook(b, def, entries); if (typeof n === "string" && n) hookNote = n; }
        const status = buildingStatus(b, def), note = fireNote(b, def) || hookNote;
        return def.recipes ? { title, entries, tabs: splitTabs(entries), status, note } : { title, entries, status, note };
    }
    // a growing or ripe crop: harvest on the spot, or water/uproot menu
    function cropMenuFor(x, y, plot) {
        const def = CROPS[plot.crop];
        if (isRipe(x, y, plot)) { harvest(x, y); return { done: true }; }
        return {
            title: def.name + ": jeszcze " + daysLeft(x, y, plot) + " dn." + (wateredRecently(plot) ? " (podlane)" : ""),
            entries: [waterEntry(x, y), { name: "Wyrwij roślinę", help: "Usuwa roślinę. Pole wraca do zaoranej ziemi.", run: () => uproot(x, y) }]
        };
    }
    // bare ground: cleared (rake), raked (till), or tilled-empty (sow) - a plot with none of these is impossible here
    // (buildings are not on this menu: Q opens the build list from anywhere)
    function groundMenuFor(x, y, plot) {
        if (plot.s === "cleared") {
            const entries = [];
            const puddle = T.call("Puddles", "at", x, y) || null;   // (rain water standing on clay: Puddles.js)
            if (puddle) entries.push(clayEntry(x, y, puddle));
            if (plot.natural && !puddle) {   // resting comes first: sit down on the grass
                const no = whyNoRest(), rate = groundRate(), wet = rate < GROUND_REST;
                entries.push({ name: "Odpocznij", icon: 82, right: "+" + rate + "/godz.", enabled: !no,
                    help: no ? noRestHelp(no) : "Siadasz na trawie i odpoczywasz: co sekundę mija godzina i wraca " + rate + " wytrzymałości" +
                        (wet ? " (w deszczu na mokrej trawie tylko połowa)" : "") + ". Wstajesz sam, gdy wypoczniesz, albo kiedy chcesz (strzałki, O, Esc). W tym czasie głodniejesz i chce ci się pić." +
                        (sleepy() ? "\n" + sleepyNote() : ""),
                    run: () => lieDown(x, y) });
            }
            entries.push(handMenuEntry(x, y));
            if (!puddle) entries.push(digEntry(x, y));
            entries.push({ name: "Zagrab ziemię", icon: itemOf(ITEM.rake).iconIndex, right: "-" + STAMINA.rake, help: plot.natural ? "Grabie. Zrywa darń i przygotowuje ziemię pod orkę." : "Grabie. Przygotowuje ziemię pod orkę.", run: () => rake(x, y) });
            // with pine seeds in the bag: plant a tree here (Forestry.js)
            if (T.api("Forestry") && countOf(ITEM.pineSeed) > 0) entries.push(T.api("Forestry").plantEntry(x, y));
            entries.push(placeMenuEntry(x, y));
            return { title: puddle ? "Kałuża" : plot.natural ? "Nieuprawiana ziemia" : "Oczyszczona ziemia", entries };
        }
        if (plot.s === "raked") {
            return { title: "Zagrabiona ziemia", entries: [
                handMenuEntry(x, y),
                digEntry(x, y),
                { name: "Zaoraj ziemię", icon: itemOf(ITEM.hoe).iconIndex, right: "-" + STAMINA.hoe, help: "Motyka. Zaorana ziemia nadaje się do siewu.", run: () => till(x, y) },
                placeMenuEntry(x, y)] };
        }
        // tilled and empty: sow (or pre-water)
        const season = seasonIndex(today());
        const entries = CROP_IDS.map(id => {
            const def = CROPS[id], seed = itemOf(def.seed), n = countOf(def.seed);
            const inSeason = !def.seasons || def.seasons.includes(season);
            let help;
            if (!inSeason) help = "Nie sadzi się o tej porze roku (" + seasonOf(today()) + "). Pory: " + def.seasons.map(s => SEASON_NAMES[s]).join(", ") + ".";
            else if (n < 1) help = "Nie masz nasion: " + seed.name + ".";
            else help = "Dojrzeje za " + def.days + " dn. Zbiór: " + itemOf(def.produce).name + ".";
            return { name: "Zasiej: " + def.name, icon: seed.iconIndex, right: "×" + n, enabled: inSeason && n > 0, help, run: () => plant(x, y, id) };
        });
        entries.push(waterEntry(x, y));
        return { title: "Zaorana ziemia (" + seasonOf(today()) + ")" + (wateredRecently(plot) ? " - podlana" : ""), entries };
    }
    // dispatcher: figures out which case applies (building / build site / hut floor / crop / bare ground) and delegates
    function menuFor(x, y) {
        // any cell of a building answers with its menu (also the rows behind its front row, open to walk on since the straight redraw -
        // they answered nothing then: yard_test) - but the open ground inside a yard: nothing to do there (no digging, no sowing)
        const any = buildingAt(x, y), b = solidAt(x, y) || (any && !geoOf(any).yard ? any : null);
        if (!b && any) return null;
        if (b && b.site) return siteMenu(b, x, y);
        if (b) return buildingMenuFor(b);
        const plot = plotAt(x, y);
        if (!plot || !tileIsFree(x, y)) return null;
        if (plot.s === "floor") return { title: "Wyposaż chatkę", entries: buildEntries(x, y) };
        if (plot.crop) return cropMenuFor(x, y, plot);
        return groundMenuFor(x, y, plot);
    }

    // the menu is a window of the current map scene
    // tabs (optional): [{ name, entries }] - the window shows one tab at a time; entries is still the whole list
    // status (optional): { icon, text, right, ready } - a line under the title (buildingStatus)
    // note (optional): a plain line of text right under the title (fireNote)
    function showMenu(title, entries, kind, index, tabs, status, note) {
        const scene = SceneManager._scene;
        if (scene && typeof scene.openFarmMenu === "function") scene.openFarmMenu(title, entries, kind, index, tabs, status, note);
    }
    function openMenu(x, y) {
        const menu = menuFor(x, y);
        if (menu && menu.entries) showMenu(menu.title, menu.entries, undefined, undefined, menu.tabs, menu.status, menu.note);
    }
    function openPlaceMenu(x, y) {
        showMenu("Postaw", placeEntries(x, y));
    }

    // ---- Q and E on the map
    // Q: everything that can be built, from wherever the player stands (placing starts at the tile in front of them); in the hut only the furniture
    function openBuildKeyMenu() {
        let t = targetTile();
        if (!$gameMap.isValid(t.x, t.y)) t = { x: $gamePlayer.x, y: $gamePlayer.y };
        if (!mapAllowsBuilding()) complain(itemOf(ITEM.hammer).iconIndex, NO_BUILD);   // (the list keeps what may stand anywhere: the snare)
        showMenu(isHutInterior() ? "Wyposaż chatkę" : "Budowa", buildEntries(t.x, t.y), "build");
        return true;
    }

    // E: every dish in the bag; what it gives is in the popup, the ones that would do nothing now are greyed out and the popup says why
    const foodOf = item => { const sv = T.api("Survival"); return sv && sv.foodInfo && item && DataManager.isItem(item) ? sv.foodInfo(item) : null; };
    function foodFacts(item, food) {
        const facts = [];
        if (food.stamina) facts.push("Wytrzymałość: +" + food.stamina);
        const needs = T.api("Needs");
        if (needsOn() && needs.foodValues) {
            const [fed, water] = needs.foodValues(item, food);
            if (fed > 0) facts.push("Sytość: +" + fed);
            if (water > 0) facts.push("Nawodnienie: +" + water);
        }
        for (const [name, hours] of [[food.buff, food.hours], [food.buff2, food.hours2]]) {
            const sv = T.api("Survival"), buff = name && sv && sv.BUFFS && sv.BUFFS[name];
            if (buff && hours > 0) facts.push(buff.name + " (" + hours + " godz.): " + buff.desc);
        }
        const fresh = T.call("Spoilage", "freshnessText", item.id) || "";
        if (fresh) facts.push(fresh);
        return facts;
    }
    function whyNotEat(food) {
        if (food.buff) return "Teraz nic by ci to nie dało: masz pełnię sił, a efekt już działa.";
        return "Teraz nic by ci to nie dało: masz pełnię sił" + (needsOn() ? ", nie jesteś głodny ani spragniony" : "") + ".";
    }
    function foodEntry(item, food, index) {
        const can = $gameParty.canUse(item);
        return { name: item.name, icon: item.iconIndex, right: "×" + $gameParty.numItems(item), enabled: can,
            tip: item.description + (can ? "" : "\n" + whyNotEat(food)), facts: foodFacts(item, food), run: () => eatFromMenu(item, index) };
    }
    function eatFromMenu(item, index) {
        if (!$gameParty.hasItem(item) || !$gameParty.canUse(item)) return false;
        SoundManager.playUseItem();
        $gameParty.leader().useItem(item);   // Survival.js and Needs.js do the eating: stamina, buffs, hunger and thirst, the popup over the player
        openFoodKeyMenu(index, true);        // the menu stays: the next dish, the list already up to date
        return true;
    }
    function openFoodKeyMenu(index, quiet) {
        const entries = [];
        for (const item of $gameParty.items()) {
            const food = foodOf(item);
            if (food) entries.push(foodEntry(item, food, entries.length));
        }
        if (entries.length === 0) {
            if (!quiet) complain(ICON.hunger, "Nie masz nic do jedzenia");
            return false;
        }
        showMenu("Jedzenie", entries, "food", index);
        return true;
    }
    const openKeyMenu = kind => (kind === "build" ? openBuildKeyMenu() : openFoodKeyMenu());

    // ------------------------------------------------------------------
    // The menu: a list of entries with a help window under it (Scene_Map).
    // ------------------------------------------------------------------
    function Window_FarmList() {
        this.initialize(...arguments);
    }
    Window_FarmList.prototype = Object.create(Window_Command.prototype);
    Window_FarmList.prototype.constructor = Window_FarmList;

    Window_FarmList.prototype.initialize = function(rect) {
        this._entries = [];
        Window_Command.prototype.initialize.call(this, rect);
        this.hide();
        this.deactivate();
    };
    // the text of these menus (the list, its title plate and the popup) is MENU_SMALLER px smaller than the other windows'
    const MENU_SMALLER = 4;
    Window_FarmList.prototype.resetFontSettings = function() {
        Window_Command.prototype.resetFontSettings.call(this);
        this.contents.fontSize = $gameSystem.mainFontSize() - MENU_SMALLER;
    };

    Window_FarmList.prototype.makeCommandList = function() {
        for (const e of this._entries || []) this.addCommand(e.name, "entry", e.enabled !== false);
    };

    Window_FarmList.prototype.setup = function(title, entries, index, tabs) {
        this._title = title;
        this._tabs = tabs || null;
        this._tab = 0;
        this._entries = tabs ? tabs[0].entries : entries;
        this.refresh();
        this.select(Math.max(0, Math.min(index || 0, this._entries.length - 1)));
    };
    // a menu with tabs: left / right go to the neighbouring tab (up / down still move along the list) - but on a recipe that can be
    // queued (entry.qty, the job queue) they set how many at once (the tabs are still on Q / E there)
    Window_FarmList.prototype.processCursorMove = function() {
        if (this.isCursorMovable()) {
            const e = this.currentEntry();
            if (e && e.qty && typeof e.setQty === "function") {
                const step = Input.isRepeated("right") ? 1 : Input.isRepeated("left") ? -1 : 0;
                if (step) {
                    if (e.setQty(e.qty.n + step)) {
                        this.playCursorSound();
                        this.redrawCurrentItem();
                        if (this._helpWindow && this._helpWindow.rebuild) this._helpWindow.rebuild();
                    } else if (Input.isTriggered("right") || Input.isTriggered("left")) {
                        this.playBuzzerSound();
                    }
                    return;
                }
            }
        }
        if (this._tabs && this.isCursorMovable()) {
            const step = Input.isTriggered("right") ? 1 : Input.isTriggered("left") ? -1 : 0;
            if (step && this.switchTab(this._tab + step)) {
                this.playCursorSound();
                return;
            }
        }
        Window_Command.prototype.processCursorMove.call(this);
    };
    Window_FarmList.prototype.switchTab = function(tab) {
        if (!this._tabs || tab < 0 || tab >= this._tabs.length || tab === this._tab) return false;
        this._tab = tab;
        this._entries = this._tabs[tab].entries;
        this.refresh();
        this.select(0);
        this.callHandler("tab");
        this.callUpdateHelp();
        return true;
    };
    // Q and E: the scene decides (a build or food menu closes / switches, the others ignore them); the window stays active
    Window_FarmList.prototype.processPageup = function() {
        this.updateInputData();
        this.callHandler("pageup");
    };
    Window_FarmList.prototype.processPagedown = function() {
        this.updateInputData();
        this.callHandler("pagedown");
    };

    Window_FarmList.prototype.currentEntry = function() {
        return this._entries[this.index()] || null;
    };

    Window_FarmList.prototype.drawItem = function(index) {
        const entry = this._entries[index], rect = this.itemLineRect(index);
        this.changePaintOpacity(entry.enabled !== false);
        let x = rect.x, right = rect.x + rect.width;
        if (entry.costs) {
            for (let i = entry.costs.length - 1; i >= 0; i--) {
                const [icon, n] = entry.costs[i], label = "×" + n, w = this.textWidth(label);
                right -= w;
                this.drawText(label, right, rect.y, w, "left");
                right -= ImageManager.iconWidth + 2;
                this.drawIcon(icon, right, rect.y + 2);
                right -= 8;
            }
        } else if (entry.right) {
            const w = this.textWidth(entry.right);
            right -= w;
            this.drawText(entry.right, right, rect.y, w, "left");
            right -= 8;
        }
        if (entry.icon) {
            this.drawIcon(entry.icon, x, rect.y + 2);
            x += ImageManager.iconWidth + 4;
        }
        this.drawText(entry.name, x, rect.y, Math.max(0, right - x), "left");
        this.changePaintOpacity(true);
    };

    // The help window does not wrap lines by itself, and the hand-work texts are long.
    function wrapLines(win, text, maxWidth) {
        const lines = [];
        for (const paragraph of String(text).split("\n")) {
            let line = "";
            for (const word of paragraph.split(" ")) {
                const trial = line ? line + " " + word : word;
                if (line && win.textWidth(trial) > maxWidth) {
                    lines.push(line);
                    line = word;
                } else {
                    line = trial;
                }
            }
            lines.push(line);
        }
        return lines;
    }

    // The description of the highlighted entry is a popup to the right of the list, level with the row it belongs to.
    Window_FarmList.prototype.updateHelp = function() {
        this.followTip();
    };
    Window_FarmList.prototype.followTip = function() {
        const tip = this._helpWindow;
        if (!tip || this.index() < 0) return;
        const rect = this.itemRect(this.index());
        tip.showFor(this.currentEntry(), this.x + this.width + 18, this.y + this.padding + rect.y + rect.height / 2);
    };
    Window_FarmList.prototype.update = function() {
        Window_Command.prototype.update.call(this);
        if (this.visible && this.active) this.followTip();   // the list scrolls smoothly: keep the popup level with the row
    };

    // the name of the menu (what is being done to which thing), above the list
    function Window_FarmTitle() {
        this.initialize(...arguments);
    }
    Window_FarmTitle.prototype = Object.create(Window_Base.prototype);
    Window_FarmTitle.prototype.constructor = Window_FarmTitle;
    // tabs (optional): their names, drawn on a line under the title with the current one lit and underlined
    // status (optional, buildingStatus): a line between the two - the icon of what is being made, what is going on, and on the
    // right how long it still takes (green when it is ready)
    const STATUS_FONT = 24 - MENU_SMALLER;
    Window_FarmTitle.prototype.setTitle = function(text, tabs, status, note) {
        this._text = text || "";
        this._tabs = tabs || null;
        this._status = status || null;
        this._note = note || null;
        this.setTab(0);
    };
    Window_FarmTitle.prototype.noteWidth = function(note) {
        if (!note) return 0;
        this.resetFontSettings();
        this.contents.fontSize = STATUS_FONT;
        const w = this.textWidth(note);
        this.resetFontSettings();
        return w;
    };
    Window_FarmTitle.prototype.statusWidth = function(status) {
        if (!status) return 0;
        this.resetFontSettings();
        this.contents.fontSize = STATUS_FONT;
        const w = ImageManager.iconWidth + 6 + this.textWidth(status.text) + 24 + this.textWidth(status.right || "");
        this.resetFontSettings();
        return w;
    };
    Window_FarmTitle.prototype.drawStatus = function(status, y) {
        const c = this.contents, rightW = status.right ? this.textWidth(status.right) : 0;
        this.drawIcon(status.icon, 0, y + 2);
        const x = ImageManager.iconWidth + 6;
        this.changeTextColor(status.ready ? ColorManager.powerUpColor() : ColorManager.normalColor());
        this.drawText(status.text, x, y, Math.max(0, this.innerWidth - x - rightW - 12), "left");
        if (status.right) {
            this.changeTextColor(status.ready ? ColorManager.powerUpColor() : ColorManager.textColor(7));
            this.drawText(status.right, 0, y, this.innerWidth, "right");
        }
    };
    Window_FarmTitle.prototype.setTab = function(tab) {
        const c = this.contents;
        c.clear();
        this.resetFontSettings();
        c.fontSize = 28 - MENU_SMALLER;
        this.changeTextColor(ColorManager.textColor(16));
        this.drawText(this._text, 0, 0, this.innerWidth, "left");
        let line = 1;
        if (this._note) {
            c.fontSize = STATUS_FONT;
            this.changeTextColor(ColorManager.normalColor());
            this.drawText(this._note, 0, this.lineHeight() * line, this.innerWidth, "left");
            line++;
        }
        if (this._status) {
            c.fontSize = STATUS_FONT;
            this.drawStatus(this._status, this.lineHeight() * line);
            line++;
        }
        if (this._tabs) {
            const y = this.lineHeight() * line;
            c.fontSize = 24 - MENU_SMALLER;
            let x = 0;
            this._tabs.forEach((name, i) => {
                const w = this.textWidth(name), on = i === tab;
                this.changeTextColor(on ? ColorManager.normalColor() : ColorManager.textColor(7));
                this.changePaintOpacity(on);
                this.drawText(name, x, y, w + 4, "left");
                if (on) c.fillRect(x, y + this.lineHeight() - 6, w, 3, ColorManager.textColor(16));
                x += w + 28;
            });
            this.changePaintOpacity(false);
            this.changeTextColor(ColorManager.textColor(7));
            this.drawText(this._tabHint || "←  →", 0, y, this.innerWidth, "right");   // (Q  E where ← → set a recipe's count)
            this.changePaintOpacity(true);
        }
        this.resetFontSettings();
    };

    // The popup: name, description, facts and what is needed (green when it is in the bag, red when it is not).
    const TIP_FONT = 24 - MENU_SMALLER, TIP_LINE = 30 - MENU_SMALLER;
    function Window_FarmTip() {
        this.initialize(...arguments);
    }
    Window_FarmTip.prototype = Object.create(Window_Base.prototype);
    Window_FarmTip.prototype.constructor = Window_FarmTip;

    Window_FarmTip.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._entry = null;
        this._ops = [];
        this._shown = 99;
        this._baseX = rect.x;
        this._rowY = rect.y;
        this.pointer = null;   // the little notch pointing at the row (a sprite of the scene, set by Scene_Map)
        this.hide();
    };
    Window_FarmTip.prototype.hide = function() {
        Window_Base.prototype.hide.call(this);
        if (this.pointer) this.pointer.visible = false;
    };
    Window_FarmTip.prototype.reset = function() {
        this._entry = null;
        this.hide();
    };
    Window_FarmTip.prototype.bodyText = function(entry) {
        return entry.tip !== undefined ? entry.tip : (entry.help || "");
    };
    Window_FarmTip.prototype.hasContent = function(entry) {
        return !!entry && !!(this.bodyText(entry) || (entry.costs && entry.costs.length > 0) || (entry.facts && entry.facts.length > 0));
    };
    // the same entry changed (a queued recipe's count): drawn anew where it is, without sliding in again
    Window_FarmTip.prototype.rebuild = function() {
        if (!this._entry || !this.visible || !this.hasContent(this._entry)) return;
        this.build(this._entry);
        this.place();
    };
    Window_FarmTip.prototype.showFor = function(entry, x, rowY) {
        this._baseX = x;
        this._rowY = rowY;
        if (entry !== this._entry) {
            this._entry = entry;
            if (this.hasContent(entry)) {
                this.build(entry);
                this._shown = 0;
                this.show();
            } else {
                this.hide();
            }
        }
        this.place();
    };

    // measure everything first (the window is as tall as its content), then paint
    Window_FarmTip.prototype.build = function(entry) {
        this.width = Math.max(300, Math.min(440, Graphics.boxWidth - this._baseX - 16));
        this.resetFontSettings();
        this.contents.fontSize = TIP_FONT;
        const inner = this.width - this.padding * 2;
        const ops = [];
        let h = 0;
        const add = (op, height) => { op.y = h; ops.push(op); h += height; };
        add({ kind: "name", text: entry.name, icon: entry.icon }, 42 - MENU_SMALLER);
        add({ kind: "rule" }, 12);
        const body = this.bodyText(entry);
        if (body) for (const line of wrapLines(this, body, inner - 4)) add({ kind: "text", text: line }, TIP_LINE);
        if (entry.facts && entry.facts.length > 0) {
            h += 6;
            for (const fact of entry.facts) for (const line of wrapLines(this, fact, inner - 4)) add({ kind: "fact", text: line }, 28 - MENU_SMALLER);
        }
        if (entry.costs && entry.costs.length > 0) {
            h += 10;
            add({ kind: "heading", text: "Potrzebne" }, 30 - MENU_SMALLER);
            for (const cost of entry.costs) add({ kind: "cost", cost }, 34);
        }
        this._ops = ops;
        this.height = h + this.padding * 2;
        this.createContents();
        this.paintOps(inner);
    };

    Window_FarmTip.prototype.paintOps = function(inner) {
        const c = this.contents;
        for (const op of this._ops) {
            this.resetFontSettings();
            c.fontSize = TIP_FONT;
            if (op.kind === "name") {
                let x = 0;
                if (op.icon) {
                    this.drawIcon(op.icon, 0, op.y + 4);
                    x = ImageManager.iconWidth + 8;
                }
                c.fontSize = 30 - MENU_SMALLER;
                this.changeTextColor(ColorManager.textColor(16));
                this.drawText(op.text, x, op.y, inner - x);
            } else if (op.kind === "rule") {
                c.fillRect(0, op.y + 2, inner, 2, ColorManager.textColor(26));
            } else if (op.kind === "text") {
                this.drawText(op.text, 0, op.y - 3 - MENU_SMALLER / 2, inner);   // (centred in the shorter row)
            } else if (op.kind === "fact") {
                this.changeTextColor(ColorManager.textColor(7));
                c.fontSize = 22 - MENU_SMALLER;
                this.drawText(op.text, 0, op.y - 4 - MENU_SMALLER / 2, inner);
            } else if (op.kind === "heading") {
                this.changeTextColor(ColorManager.systemColor());
                this.drawText(op.text, 0, op.y - 3 - MENU_SMALLER / 2, inner);
            } else if (op.kind === "cost") {
                const [icon, need, have, name] = op.cost;
                this.drawIcon(icon, 0, op.y + 1);
                if (name === undefined) {
                    this.drawText("×" + need, ImageManager.iconWidth + 8, op.y - 1, inner - 44);
                } else {
                    this.drawText(name, ImageManager.iconWidth + 8, op.y - 1, inner - 44 - 110);
                    this.changeTextColor(ColorManager.textColor(have >= need ? 3 : 10));
                    this.drawText(have + " / " + need, inner - 110, op.y - 1, 110, "right");
                }
            }
        }
    };

    // level with the row, kept on the screen, sliding in a little; the notch shows which row it belongs to
    Window_FarmTip.prototype.place = function() {
        if (!this._entry || !this.visible) return;
        const slide = -Math.round(10 * (1 - Math.min(1, this._shown / 8)));
        const top = Math.round(Math.max(8, Math.min(Graphics.boxHeight - this.height - 8, this._rowY - this.height / 2)));
        this.x = this._baseX + slide;
        this.y = top;
        const p = this.pointer;
        if (p) {
            const layer = SceneManager._scene && SceneManager._scene._windowLayer;
            p.x = this.x - 15 + (layer ? layer.x : 0);
            p.y = Math.round(Math.max(top + 20, Math.min(top + this.height - 20, this._rowY)) - p.height / 2) + (layer ? layer.y : 0);
            p.alpha = this.opacity / 255;
            p.visible = true;
        }
    };
    Window_FarmTip.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (this.visible && this._shown < 8) {
            this._shown++;
            this.opacity = Math.round(255 * this._shown / 8);
            this.contentsOpacity = this.opacity;
        }
        this.place();
    };

    function makePointerBitmap() {
        const w = 17, h = 28, bmp = new Bitmap(w, h), ctx = bmp.context;
        ctx.fillStyle = "#0e1013";   // the colour of the window back at its edge (Window.png)
        ctx.beginPath();
        ctx.moveTo(w, 0); ctx.lineTo(2, h / 2); ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffd23f";   // the yellow of the corners and the cursor
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w, 1); ctx.lineTo(2, h / 2); ctx.lineTo(w, h - 1);
        ctx.stroke();
        bmp._baseTexture.update();
        return bmp;
    }

    SCENE.createFarmMenu = function() {
        const rect = new Rectangle(0, 0, 480, 100);
        this._farmHelp = new Window_Help(rect);   // only for placing a building now
        this._farmHelp.hide();
        this._farmTitle = new Window_FarmTitle(new Rectangle(0, 0, 300, 60));
        this._farmTitle.hide();
        this._farmTip = new Window_FarmTip(new Rectangle(0, 0, 400, 120));
        this._farmMenu = new Window_FarmList(rect);
        this._farmMenu.setHelpWindow(this._farmTip);
        this._farmMenu.setHandler("ok", this.onFarmOk.bind(this));
        this._farmMenu.setHandler("cancel", this.closeFarmMenu.bind(this));
        this._farmMenu.setHandler("pageup", this.onFarmKey.bind(this, "build"));
        this._farmMenu.setHandler("pagedown", this.onFarmKey.bind(this, "food"));
        this._farmMenu.setHandler("tab", () => this._farmTitle.setTab(this._farmMenu._tab));
        this.addWindow(this._farmHelp);
        this.addWindow(this._farmTitle);
        this.addWindow(this._farmMenu);
        this.addWindow(this._farmTip);
        // the notch of the popup lives above the window layer
        this._farmPointer = new Sprite(makePointerBitmap());
        this._farmPointer.visible = false;
        this._farmTip.pointer = this._farmPointer;
        this.addChild(this._farmPointer);
    };

    // wide enough for the longest line (name, and the icons with amounts that sit on its right)
    SCENE.farmMenuWidth = function(entries) {
        const menu = this._farmMenu;
        menu.resetFontSettings();
        let widest = 0;
        for (const e of entries) {
            // (a recipe that can be queued: as wide as it gets at its most, "×9" and the costs of all nine)
            let w = (e.icon ? ImageManager.iconWidth + 4 : 0) + menu.textWidth(e.wideName || e.name) + 24;
            const costs = e.wideCosts || e.costs;
            if (costs) for (const [, n] of costs) w += ImageManager.iconWidth + 2 + menu.textWidth("×" + n) + 8;
            else if (e.right) w += menu.textWidth(e.right) + 8;
            widest = Math.max(widest, w);
        }
        return Math.max(340, Math.min(560, widest + menu.padding * 2 + 8));
    };

    // docked in the bottom left corner: the name of the menu, the list under it, the popup to the right of the list
    SCENE.openFarmMenu = function(title, entries, kind, index, tabs, status, note) {
        const menu = this._farmMenu, plate = this._farmTitle;
        // with tabs the window is sized for all of them, so it does not jump when switching
        const all = tabs ? [].concat(...tabs.map(t => t.entries)) : entries;
        const rows = tabs ? Math.max(...tabs.map(t => t.entries.length)) : entries.length;
        const width = Math.max(this.farmMenuWidth(all), Math.min(560, Math.max(plate.statusWidth(status), plate.noteWidth(note)) + plate.padding * 2 + 8));
        const plateH = this.calcWindowHeight(1 + (tabs ? 1 : 0) + (status ? 1 : 0) + (note ? 1 : 0), false);
        // every menu (the build list, the food, the campfire, the stations...) grows with its entries but, with the name above it, takes
        // at most half the screen (user); the rest scrolls
        const itemH = Window_Selectable.prototype.itemHeight.call(menu), pad = menu.padding * 2;
        const cap = Math.max(3, Math.floor((Graphics.boxHeight / 2 - plateH - pad) / itemH));
        const listH = this.calcWindowHeight(Math.max(1, Math.min(rows, cap)), true);
        const x = MENU_MARGIN, y = Graphics.boxHeight - MENU_MARGIN - listH;
        menu.move(x, y, width, listH);
        plate.move(x, y - plateH, width, plateH);
        menu.createContents();   // the contents bitmap has to match the new size
        plate.createContents();
        plate._tabHint = all.some(e => e.qty) ? "Q  E" : "←  →";   // (← → set how many of a recipe there: the tabs are on Q / E)
        plate.setTitle(title, tabs ? tabs.map(t => t.name) : null, status, note);
        this._farmTip.reset();
        this._farmKind = kind || "";
        menu.setup(title, entries, index, tabs);
        plate.show();
        menu.show();
        menu.open();
        menu.activate();
        menu.callUpdateHelp();
        $gameTemp._farmMenuOpen = true;
    };

    SCENE.closeFarmMenu = function() {
        this._farmKind = "";
        this._farmHold = null;
        this._farmMenu.deactivate();
        this._farmMenu.hide();
        this._farmTitle.hide();
        this._farmTip.reset();
        this._farmHelp.hide();
        // the same press of "OK" that chose the entry must not act on the tile again
        if ($gameTemp._farmMenuOpen) lockPlayer(2);
        $gameTemp._farmMenuOpen = false;
    };

    SCENE.onFarmOk = function() {
        const entry = this._farmMenu.currentEntry();
        this.closeFarmMenu();
        if (entry && entry.run) entry.run();
    };

    // Q (build) and E (food) on the map; while one of these two menus is open the same key closes it and the other key switches to the other menu
    SCENE.onFarmKey = function(kind) {
        const now = this._farmKind, menu = this._farmMenu;
        if (menu._tabs) {   // a station's menu: Q / E switch its tabs, like in the journal
            if (menu.switchTab(menu._tab + (kind === "build" ? -1 : 1))) SoundManager.playCursor();
            return;
        }
        if (now !== "build" && now !== "food") return;   // the menu of a plot, a chest...: no use for Q and E
        if (now === kind) {
            SoundManager.playCancel();
            this.closeFarmMenu();
        } else if (openKeyMenu(kind)) {
            SoundManager.playCursor();
        }
    };

    P.ui = { SCENE, manualEntry, hammerMissing, handMenuEntry, menuFor, showMenu, openBuildKeyMenu, foodFacts, whyNotEat,
        openFoodKeyMenu, openKeyMenu };
})();
