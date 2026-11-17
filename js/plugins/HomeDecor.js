//=============================================================================
// HomeDecor.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Dom dziadka zmienia się z historią i porami roku: pamiątki bohatera (pokwitowanie od Lorda, trofea, kufel, kości, ogłoszenie), ozdoby na każdą porę roku, Wigilia, wycinanki, ręcznik, malowana skrzynia, chodnik. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Farming
 * @orderAfter Hunting
 * @orderAfter Dog
 * @orderAfter Story
 * @orderAfter SpeechBubbles
 * @orderAfter UITheme
 * @orderAfter TavernShift
 * @orderAfter TavernDice
 * @orderAfter QuestBoard
 * @orderAfter TavernLife
 *
 * @param mapId
 * @text Mapa domu dziadka
 * @type number
 * @min 1
 * @default 224
 *
 * @param easterDays
 * @text Wielkanoc: ile dni
 * @desc Koszyczek z pisankami stoi na stole przez tyle dni wokół połowy wiosny.
 * @type number
 * @min 1
 * @max 10
 * @default 4
 *
 * @param wigiliaDays
 * @text Wigilia: ile dni
 * @desc Obrus z sianem, opłatek i snop stoją przez tyle dni wokół połowy zimy.
 * @type number
 * @min 1
 * @max 10
 * @default 5
 *
 * @param notices
 * @text Wiadomość o nowej pamiątce
 * @desc Krótki napis u góry ekranu, gdy w domu przybywa pamiątka.
 * @type boolean
 * @default true
 *
 * @help
 * Chata dziadka (mapa 224 na Podgrodziu - od 2026-11-17; dawny bielony dom,
 * mapa 19, odszedł ze starym światem) pamięta, co bohater przeżył, i zmienia
 * się z porami roku. Wszystkie ozdoby to zdarzenia 980-998 dokładane przez
 * wtyczkę do danych mapy przy jej wczytaniu (plików map wtyczka nie zmienia).
 * Obrazki: img/characters/!House_Decor.png i !$House_Decor_Big.png
 * (generator: tools/house/decor/make_decor.py).
 *
 * PAMIĄTKI (pojawiają się raz, gdy zasłużone, i zostają na zawsze):
 *  - pokwitowanie od Lorda w ramce, na kamiennej ścianie przy kominie, nad
 *    czosnkiem - gdy dług jest spłacony; wcześniej wisi tam pusty gwóźdź;
 *  - skóra wilka przy posłaniu bohatera - po jego pierwszym wilku;
 *  - poroże na ścianie nad posłaniem - po pierwszym jeleniu;
 *  - kieł dzika na rzemyku (na gwoździu, a gdy jest już poroże - na porożu)
 *    - po pierwszym dziku;
 *  - półka bohatera z cynowym kuflem od Borgara (po pierwszej zmianie
 *    w tawernie) i z kośćmi (po pierwszej wygranej w kości);
 *  - ogłoszenie z tablicy zleceń przypięte na kamiennej ścianie nad ziołami
 *    - po pierwszym wykonanym zleceniu.
 * Liczą się zwierzęta ubite przez bohatera (nie przez psa). W starym zapisie
 * (wtyczka dodana później) pamiątki biorą się z tego, co zapis już pamięta:
 * spłacony dług, zmiany u Borgara, wygrane w kości, zlecenia i licznik ubitych
 * zwierząt z Hunting.js (ten dawny licznik nie odróżnia zdobyczy psa).
 *
 * PORY ROKU (Farming.js: 28 dni każda, od dnia 1):
 *  - wiosna: bazie w dzbanku na skrzyni dziadka; w połowie wiosny przez kilka
 *    dni obok koszyczek z pisankami;
 *  - lato: polne kwiaty w dzbanku, zioła suszące się przy kominie;
 *  - jesień: wieniec dożynkowy przy kominie, kosz jabłek na skrzyni, dynie
 *    pod ścianą obok skrzyni;
 *  - zima: świerkowe gałązki nad pokwitowaniem; w połowie zimy przez kilka dni
 *    Wigilia: snop zboża pod ścianą obok skrzyni dziadka.
 *
 * ZAWSZE: wycinanka łowicka pod oknem, malowana skrzynia dziadka, chodnik
 * przy drzwiach. Przejścia, dywan przed paleniskiem i drzwi zostają wolne.
 * (Ozdoby, których chata nie ma gdzie postawić - ręcznik na obrazku Matki
 * Boskiej, obrus wigilijny na stole, wycinanki pod innymi oknami - czekają
 * w danych wtyczki na dom, który je pomieści: LAYOUTS w kodzie.)
 *
 * Korzysta z TawernaCore.js (musi stać wyżej na liście): stan w zapisie
 * (Tawerna.state, dawny $gameSystem._homeDecor przechodzi sam), wstawianie
 * zdarzeń (Tawerna.inject), kalendarz (Tawerna.time), zegar mapy i szyna
 * zdarzeń (kill, debtPaid, shiftDone, diceWin, questDone - pamiątka przychodzi,
 * gdy inna wtyczka powie, że coś się stało).
 *
 * Dla innych wtyczek i testów: HomeDecor.state(), HomeDecor.earn(klucz),
 * HomeDecor.lookOf(slot), HomeDecor.refresh(), HomeDecor.blockedCells(),
 * HomeDecor.season(dzień), HomeDecor.isEaster(dzień), HomeDecor.isWigilia(dzień).
 */

(() => {
    "use strict";
    const TK = Watki.teksty("dom_dziadka");   // (the words of this file: js/teksty/dom_dziadka.txt, ozdoby.*)

    const PLUGIN = "HomeDecor";
    const T = window.Tawerna;
    if (!T) throw new Error("HomeDecor.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const MAP_ID = num(params.mapId, 224);
    const EASTER_DAYS = num(params.easterDays, 4);
    const WIGILIA_DAYS = num(params.wigiliaDays, 5);
    const NOTICES = params.notices !== "false";

    // <decor-data> (tools/house/decor/make_decor.py writes this line - do not edit by hand)
    const DECOR_ART = {"rogi":["!House_Decor",0,2,0,1,2,[56,64,88,109],[]],"kiel":["!House_Decor",0,2,1,1,2,[67,69,77,91],[]],"kiel_rog":["!House_Decor",0,2,2,1,2,[54,80,64,100],[]],"list":["!House_Decor",1,2,0,4,5,[65,89,80,109],[]],"polka_kufel":["!House_Decor",1,2,1,3,2,[53,72,91,101],[["kufel",65,72,81,89]]],"polka_kosci":["!House_Decor",1,2,2,3,2,[53,79,91,101],[["kosci",66,80,81,89]]],"polka_oba":["!House_Decor",2,2,0,3,2,[53,72,91,101],[["kufel",56,72,72,89],["kosci",75,80,90,89]]],"skora":["!House_Decor",2,2,1,3,6,[6,64,90,113],[]],"gwozdz":["!House_Decor",2,2,2,17,2,[72,73,74,75],[]],"pokwitowanie":["!House_Decor",3,2,0,17,2,[55,71,89,102],[]],"pokwitowanie_zima":["!House_Decor",3,2,1,17,2,[52,59,92,102],[]],"recznik":["!House_Decor",3,2,2,15,2,[49,68,95,114],[]],"recznik_zima":["!House_Decor",0,4,0,15,2,[49,59,95,114],[]],"chodnik":["!House_Decor",0,4,1,16,6,[17,107,127,133],[]],"wyc_2":["!House_Decor",0,4,2,2,3,[63,86,82,112],[]],"wyc_16":["!House_Decor",1,4,0,16,3,[63,86,82,112],[]],"wyc_7":["!House_Decor",1,4,1,7,3,[60,87,85,112],[]],"wyc_11":["!House_Decor",1,4,2,11,3,[60,87,85,112],[]],"ziola":["!House_Decor",2,4,0,9,2,[55,96,90,126],[]],"wieniec":["!House_Decor",2,4,1,9,2,[52,54,92,112],[]],"bazie":["!House_Decor",2,4,2,4,10,[49,71,70,102],[]],"kwiaty":["!House_Decor",3,4,0,4,10,[47,69,71,102],[]],"pisanki":["!House_Decor",3,4,1,2,10,[68,74,96,102],[]],"jablka":["!House_Decor",3,4,2,2,10,[69,78,96,102],[]],"wigilia":["!$House_Decor_Big",0,2,0,2,11,[72,124,171,183],[]],"dynie_l":["!House_Decor",0,6,0,8,11,[51,100,93,139],[]],"dynie_r":["!House_Decor",0,6,1,10,11,[51,100,93,139],[]],"snop":["!House_Decor",0,6,2,17,7,[54,86,91,140],[]],"skrzynia":["!House_Decor",1,6,0,17,8,[48,85,95,121],[]]};
    // </decor-data>

    // ------------------------------------------------------------------
    // The slots: one event each (ids 980..998 on the house map). prio: 0 below the characters, 1 like them (it blocks), 2 over them
    // (on a piece of furniture that is itself an event - the chest's lid); z: drawn lower than the other things below the characters
    // (a rug, a tablecloth - the candle stays on top); px: its picture moved that many pixels, lookPx: the same for one look only;
    // need: an event of the map that must stand where the house was designed (else the slot is left out: the map was edited)
    // (2026-11-17, the new world) the house is grandpa's tiny hut in Podgrodzie, Map224 (8 x 9: the grandson's corner - bed, candle on
    // a stool, pegs, a picture, the window - is the old cottage's corner, the hearth with the rocking chair on the stone wall right of
    // it, the chest by the door). Fewer slots than the old 19 x 13 cottage (Map019, gone with the old world): one window - one
    // wycinanka; no Holy Mother picture - no towel; no table - the jug and the basket stand on grandpa's chest, no Christmas cloth
    // (the sheaf stays); the receipt, the harvest wreath and the summer herbs on the stone wall by the fire
    // ------------------------------------------------------------------
    const LAYOUTS = {
        224: {
            size: [8, 9],
            slots: [
                { id: 980, key: "rogi", x: 1, y: 2, prio: 0, need: "bed" },        // (over his bed, above the picture)
                { id: 981, key: "kiel", x: 1, y: 2, prio: 0, need: "bed" },
                { id: 982, key: "list", x: 4, y: 2, prio: 0, px: [0, -20], need: "hearth" },   // (pinned on the stone wall over the herbs)
                { id: 983, key: "polka", x: 3, y: 2, prio: 0, need: "pegs" },      // (over the pegs, as in the old corner)
                { id: 984, key: "skora", x: 3, y: 6, prio: 0, z: 0.5, need: "bed" },   // (on the floor beside his bed)
                { id: 985, key: "rama", x: 6, y: 2, prio: 0, px: [0, -14], need: "hearth" },   // (the stone wall over the garlic)
                { id: 987, key: "wyc_2", x: 2, y: 3, prio: 0 },                     // (under the window)
                { id: 991, key: "chodnik", x: 5, y: 7, prio: 0, z: 0.5, need: "door" },   // (the rag runner inside the door)
                { id: 992, key: "komin", x: 6, y: 3, prio: 0, lookPx: { wieniec: [0, 30] }, need: "hearth" },   // (the stone wall right of the fire)
                { id: 993, key: "stol_p", x: 1, y: 7, prio: 2, px: [1, -8], need: "chest" },   // (the jug: the left half of the chest's lid)
                { id: 994, key: "stol_l", x: 1, y: 7, prio: 2, px: [-2, -8], need: "chest" },  // (the basket: the right half, in front of the jug)
                // (the pumpkins by the wall beside the chest: by the door they would stand on the runner's ends)
                { id: 996, key: "dynie_l", x: 2, y: 7, prio: 1, need: "chest" },
                { id: 997, key: "dynie_r", x: 3, y: 7, prio: 1, need: "chest" },
                { id: 998, key: "snop", x: 2, y: 7, prio: 1, need: "chest" }        // (by the wall beside the chest - the corner above it is grandpa's place at the chest)
            ],
            // what must stand where (the events of the hut the decorations are laid out around)
            anchors: {
                bed: d => hasEvent(d, 1, 4, e => /Posłanie/i.test(e.name)),
                pegs: d => hasEvent(d, 3, 3, e => imageOf(e) === "!House_Props"),
                hearth: d => hasEvent(d, 5, 4, e => /Palenisko/i.test(e.name)),
                door: d => hasEvent(d, 5, 8, e => /^Drzwi/i.test(e.name)),
                chest: d => hasEvent(d, 1, 7, e => /Skrzynia dziadka/i.test(e.name))
            },
            table: []   // (Christmas Eve's table: none in the hut)
        }
    };
    const LAY = LAYOUTS[MAP_ID] || { size: [0, 0], slots: [], anchors: {}, table: [] };
    const SLOTS = LAY.slots;
    const SLOT_BY_ID = {};
    for (const s of SLOTS) SLOT_BY_ID[s.id] = s;
    const ANCHORS = LAY.anchors;
    function imageOf(e) { const p = e.pages && e.pages[0]; return p && p.image ? p.image.characterName : ""; }
    function hasEvent(d, x, y, test) { return (d.events || []).some(e => e && e.x === x && e.y === y && test(e)); }

    // the keepsakes and the notice when one comes
    const EARNED_NOTE = Watki.scal({}, "dom_dziadka", "pamiatki");   // (by the keepsake: js/teksty/dom_dziadka.txt, pamiatki)

    // ------------------------------------------------------------------
    // State: Tawerna.state("homeDecor") = $gameSystem._tw.homeDecor (plain data, saved with the game; an older save's
    // $gameSystem._homeDecor is taken over as it loads)
    //   got: { receipt | wolf | deer | boar | tankard | dice | notice: the day it came }, kills: the hero's own (wolf, deer, boar),
    //   noticeTitle: the first contract's title, seeded: an older game's past looked at once
    // ------------------------------------------------------------------
    const blank = () => ({ v: 1, got: {}, kills: {}, noticeTitle: "", seeded: 0 });
    const state = T.state.define("homeDecor", blank, { version: 1, adopt: "_homeDecor", owner: PLUGIN });
    const day = () => T.time.day();
    function safe(fn, dflt) { try { const v = fn(); return v === undefined ? dflt : v; } catch (e) { return dflt; } }

    // one keepsake earned (once): kept, told, the house redrawn
    function earn(key, quiet) {
        const s = state();
        if (s.got[key]) return false;
        s.got[key] = day();
        if (!quiet && NOTICES && EARNED_NOTE[key]) T.popup(TK.ozdoby.earn[0], { top: true, color: "#ffd23f", sub: EARNED_NOTE[key] + "." });
        dirty = true;
        return true;
    }
    // the other plugins' states: read as a game loads (an older save's past, seedPast / checkEarned); after that their events tell
    // (the receipt: the debt paid - or, the field lost, its buyback: the Lord's deed in the frame - 2026-10-15)
    const storyPaid = () => safe(() => { const st = T.call("Story", "state"); return !!st && !st.pending && !!(st.done || st.paid >= st.debt || (st.buy && st.buy.done)); }, false);
    const storyActive = () => safe(() => !!T.call("Story", "active"), false);
    const shiftsDone = () => safe(() => (T.call("TavernShift", "stats") || {}).done || 0, 0);
    const diceWins = () => safe(() => (T.has("TavernDice") ? (T.call("TavernDice", "stats") || {}).wins || 0 : 0), 0);
    function firstContract() {
        return safe(() => {
            if (!T.has("QuestBoard")) return null;
            const q = T.call("QuestBoard", "state");
            if (!q || !q.stats || !(q.stats.done > 0)) return null;
            const done = (q.history || []).filter(h => h && h.state === "done");
            return { title: done.length ? String(done[done.length - 1].title || "") : "" };
        }, null);
    }
    // the states other plugins keep: looked at as a game loads and on HomeDecor.refresh()
    function checkEarned() {
        if (!window.$gameSystem) return;
        const s = state();
        if (!s.got.receipt && storyPaid()) earn("receipt");
        if (!s.got.tankard && shiftsDone() > 0) earn("tankard");
        if (!s.got.dice && diceWins() > 0) earn("dice");
        if (!s.got.notice) {
            const c = firstContract();
            if (c) { s.noticeTitle = c.title; earn("notice"); }
        }
    }
    // an older game (the plugin added later): what the save already knows counts at once, quietly. The kills: Hunting.js's own
    // tally (it does not tell the hero's from the dog's)
    function seedPast() {
        const s = state();
        if (s.seeded) return;
        s.seeded = 1;
        const kills = safe(() => (T.call("Hunting", "hunt") || {}).kills || {}, {});
        for (const k of ["wolf", "deer", "boar"]) if ((kills[k] || 0) > 0) { s.kills[k] = kills[k]; earn(k, true); }
        if (storyPaid()) earn("receipt", true);
        if (shiftsDone() > 0) earn("tankard", true);
        if (diceWins() > 0) earn("dice", true);
        const c = firstContract();
        if (c) { s.noticeTitle = c.title; earn("notice", true); }
    }

    // What the other plugins tell on the bus (docs/ARCHITEKTURA.md 5): the hero's kills (not the dog's), the debt paid, a shift
    // done, a dice game won, a contract done
    T.on("kill", e => {
        if (!e || e.by !== "hero" || !window.$gameSystem || !["wolf", "deer", "boar"].includes(e.kind)) return;
        const s = state();
        s.kills[e.kind] = (s.kills[e.kind] || 0) + 1;
        earn(e.kind);
    }, { owner: PLUGIN });
    T.on("debtPaid", () => { if (storyPaid()) earn("receipt"); }, { owner: PLUGIN });
    T.on("fieldBack", () => { if (storyPaid()) earn("receipt"); }, { owner: PLUGIN });
    T.on("shiftDone", () => earn("tankard"), { owner: PLUGIN });
    T.on("diceWin", () => earn("dice"), { owner: PLUGIN });
    T.on("questDone", e => {
        const s = state();
        if (s.got.notice) return;
        s.noticeTitle = String((e && e.title) || "");   // (the first contract's)
        earn("notice");
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // Seasons: Tawerna.time (Farming.js's: 0 spring, 1 summer, 2 autumn, 3 winter; seasonLength days each from day 1); Easter and
    // Christmas Eve a few days round the middle of their season (28 days: Easter 13-16 of spring, Christmas Eve 12-16 of winter)
    // ------------------------------------------------------------------
    const season = d => T.time.season(d);
    const dayOfSeason = d => T.time.dayOfSeason(d);
    const isEaster = d => T.time.isEaster(d, EASTER_DAYS);
    const isWigilia = d => T.time.isWigilia(d, WIGILIA_DAYS);

    // ------------------------------------------------------------------
    // What each slot shows now (a look key of DECOR_ART or null)
    // ------------------------------------------------------------------
    function lookOf(key, d) {
        d = d === undefined ? day() : d;
        const g = state().got, se = season(d), wig = isWigilia(d);
        switch (key) {
            case "rogi": return g.deer ? "rogi" : null;
            case "kiel": return g.boar ? (g.deer ? "kiel_rog" : "kiel") : null;
            case "list": return g.notice ? "list" : null;
            case "polka": return g.tankard && g.dice ? "polka_oba" : g.tankard ? "polka_kufel" : g.dice ? "polka_kosci" : null;
            case "skora": return g.wolf ? "skora" : null;
            case "rama": return g.receipt ? (se === 3 ? "pokwitowanie_zima" : "pokwitowanie") : storyActive() ? "gwozdz" : null;
            case "recznik": return se === 3 ? "recznik_zima" : "recznik";
            case "wyc_2": case "wyc_7": case "wyc_11": case "wyc_16": case "chodnik": return key;
            case "komin": return se === 1 ? "ziola" : se === 2 ? "wieniec" : null;
            case "stol_p": return wig ? null : se === 0 ? "bazie" : se === 1 ? "kwiaty" : null;
            case "stol_l": return wig ? null : isEaster(d) ? "pisanki" : se === 2 ? "jablka" : null;
            case "wigilia": return wig ? "wigilia" : null;
            case "dynie_l": case "dynie_r": return se === 2 ? key : null;
            case "snop": return wig ? "snop" : null;
        }
        return null;
    }
    const onHouse = () => !!($gameMap && $gameMap.mapId() === MAP_ID);
    function slotOf(ev) {
        const s = ev && ev._mapId === MAP_ID ? SLOT_BY_ID[ev._eventId] : null;
        return s && T.hasTag(ev, PLUGIN) ? s : null;   // (<HomeDecor:key>: ours, not an editor's event on that id)
    }

    // ------------------------------------------------------------------
    // The events: put into the house's data as it loads (like Story.js's people), only the slots whose anchors stand
    // ------------------------------------------------------------------
    const BLANK_COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function slotData(s) {
        return { id: s.id, name: "Ozdoba: " + s.key, note: "<HomeDecor:" + s.key + ">", x: s.x, y: s.y, pages: [{
            conditions: Object.assign({}, BLANK_COND), directionFix: true,
            image: { tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 },
            list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 0, stepAnime: false, through: true, trigger: 0, walkAnime: false }] };
    }
    // (only into the house as it was designed - its size - and only the slots whose anchors stand; an editor's own event on a slot's
    // id is left alone by the core, and a game saved in the house before this plugin gets the events as it loads)
    T.inject(MAP_ID, { ids: [980, 998], owner: PLUGIN, build(data) {
        if (data.width !== LAY.size[0] || data.height !== LAY.size[1]) return [];
        return SLOTS.filter(s => !s.need || safe(() => ANCHORS[s.need](data), false)).map(slotData);
    } });
    // the house's things as it comes up (after a transfer, a load, a menu: the map's tiles are loaded anew)
    T.on("mapReady", () => { if (onHouse()) refreshHouse(true); }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // Showing a look on its event (the page itself has no picture: set after every page setup)
    // ------------------------------------------------------------------
    function artOf(look) { return look ? DECOR_ART[look] || null : null; }
    function occupied(ev) {
        const near = c => c && c !== ev && Math.abs(c._realX - ev.x) < 0.95 && Math.abs(c._realY - ev.y) < 0.95;
        if (near($gamePlayer)) return true;
        return $gameMap.events().some(e => e !== ev && !slotOf(e) && !e.isThrough() && e.characterName() && near(e));
    }
    function show(ev, look) {
        const s = slotOf(ev), a = artOf(look);
        if (!s) return;
        if (a && s.prio === 1 && ev._decorLook !== look && ev._decorShown !== true && occupied(ev)) return;   // (someone stands there: next time)
        ev._decorLook = a ? look : null;
        ev._decorShown = !!a;
        ev._decorZ = s.z;
        ev._decorPx = a ? (s.lookPx && s.lookPx[look]) || s.px || null : null;   // (the picture moved off its cell: the sprite hook below)
        if (a) {
            ev.setImage(a[0], a[1]);
            ev._direction = a[2]; ev._originalDirection = a[2];
            ev._originalPattern = a[3]; ev.setPattern(a[3]);
            ev.setPriorityType(s.prio);
            ev.setThrough(s.prio !== 1);
        } else {
            ev.setImage("", 0);
            ev.setPriorityType(0);
            ev.setThrough(true);
        }
        ev.setStepAnime(false); ev.setWalkAnime(false);
    }
    // grandpa's chest (the map's own event "Skrzynia dziadka", Winlu's !Fantasy_chest) is shown painted
    function isGrandpasChest(ev) {
        if (!ev || ev._mapId !== MAP_ID) return false;
        const d = safe(() => ev.event(), null), p = safe(() => ev.page(), null);
        return !!(d && p && /Skrzynia dziadka/i.test(d.name || "") && p.image && p.image.characterName === "!Fantasy_chest");
    }
    function paintChest(ev) {
        const a = artOf("skrzynia");
        if (!a) return;
        ev.setImage(a[0], a[1]);
        ev._direction = a[2]; ev._originalDirection = a[2];
        ev._originalPattern = a[3]; ev.setPattern(a[3]);
        ev._decorLook = "skrzynia";
    }
    const _Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _Game_Event_setupPageSettings.call(this);
        const s = slotOf(this);
        if (s) show(this, lookOf(s.key));
        else if (isGrandpasChest(this)) paintChest(this);
    };
    // a slot's picture moved that many pixels (px, or lookPx for one of its looks - the harvest wreath hangs lower than the herbs)
    T.sprite.hook({ owner: PLUGIN, method: "updatePosition", when: sp => !!(sp._character && sp._character._decorPx),
        after(sp) { const o = sp._character && sp._character._decorPx; if (o) { sp.x += o[0]; sp.y += o[1]; } } });
    const _Game_Event_screenZ = Game_Event.prototype.screenZ;
    Game_Event.prototype.screenZ = function() {
        if (this._decorZ !== undefined && this._decorShown) return this._decorZ;
        return _Game_Event_screenZ.call(this);
    };

    // Christmas Eve: the dishes (Winlu D tiles) are taken off the table while the cloth lies on it, and put back after
    const TABLE_CELLS = LAY.table;   // (the house's table cells: none in the hut)
    let cleared = null;   // { data: the map's tile array, list: [[index, tileId]] taken off }
    function clearTable(on) {
        if (!$dataMap || !Array.isArray($dataMap.data) || !onHouse()) return false;
        if (cleared && cleared.data !== $dataMap.data) cleared = null;         // (the map was loaded anew: its tiles are whole)
        const W = $dataMap.width, H = $dataMap.height, data = $dataMap.data;
        if (on && !cleared) {
            const list = [];
            for (const [x, y] of TABLE_CELLS) for (const z of [2, 3]) {
                const i = (z * H + y) * W + x, t = data[i];
                if (t >= 512 && t < 768) { list.push([i, t]); data[i] = 0; }   // (D: tableware, food)
            }
            cleared = { data, list };
            return list.length > 0;
        }
        if (!on && cleared) {
            for (const [i, t] of cleared.list) data[i] = t;
            const any = cleared.list.length > 0;
            cleared = null;
            return any;
        }
        return false;
    }

    // everything shown as it should be now (the slots, the chest, the table); a key of it all tells when to redraw
    let dirty = true, lastKey = "";
    function houseKey() {
        const d = day();
        return SLOTS.map(s => lookOf(s.key, d) || "-").join("|");
    }
    function refreshHouse(force) {
        if (!onHouse()) return;
        const key = houseKey();
        if (!force && !dirty && key === lastKey) return;
        dirty = false; lastKey = key;
        for (const ev of $gameMap.events()) {
            const s = slotOf(ev);
            // (what stands on the floor and blocks - the pumpkins, the sheaf - changes only as the house is entered or on an
            // explicit refresh: the people's ways, worked out as they come in, stay true during a visit)
            if (s && s.prio === 1 && !force && ev._decorLook !== undefined) continue;
            // (a game saved with the table's things where they stood before the candle moved: on their places now)
            if (s && (ev.x !== s.x || ev.y !== s.y)) ev.locate(s.x, s.y);
            if (s) show(ev, lookOf(s.key));
            else if (isGrandpasChest(ev) && ev._decorLook !== "skrzynia") paintChest(ev);
        }
        const tableChanged = clearTable(isWigilia(day()));
        if (tableChanged) {
            const sc = SceneManager._scene, tm = sc && sc._spriteset && sc._spriteset._tilemap;
            if (tm && typeof tm.refresh === "function") tm.refresh();
        }
    }
    T.on("mapLeave", () => { cleared = null; }, { owner: PLUGIN });
    T.on("mapEnter", e => { if (e.mapId === MAP_ID) { dirty = true; clearTable(isWigilia(day())); } }, { owner: PLUGIN });
    // now and then: the house as it should be (the day's look, a keepsake just earned)
    T.onMapUpdate(() => {
        if (onHouse()) refreshHouse(false);
    }, { owner: PLUGIN, name: "refresh", every: 30 });

    // the sheets come with the map (the first look does not wait for them)
    T.onMapData(() => { for (const f of ["!House_Decor", "!$House_Decor_Big"]) ImageManager.loadCharacter(f); }, { owner: PLUGIN });   // (the sheets of FRAME below)

    // ------------------------------------------------------------------
    // New game, loading (the state itself is made / taken over by the core)
    // ------------------------------------------------------------------
    T.on("newGame", () => {
        state().seeded = 1;       // (a new life: nothing from before)
        dirty = true;
    }, { owner: PLUGIN });
    T.on("load", () => {
        seedPast();
        checkEarned();
        dirty = true;
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // For other plugins and the tests
    // ------------------------------------------------------------------
    // -> [{ ev, look, x0, y0, x1, y1, px }] in map tiles: the picture box of every shown decoration and of its parts (the shelf's
    //    tankard and dice) - for the tests: nothing stands on the hearth rug, the runner or the doorway
    const FRAME = { "!House_Decor": [144, 144], "!$House_Decor_Big": [288, 192] };
    function shownBoxes() {
        const out = [];
        if (!onHouse()) return out;
        for (const ev of $gameMap.events()) {
            const look = ev._decorLook;
            if (!look || (!slotOf(ev) && look !== "skrzynia") || ev.isTransparent()) continue;
            const a = artOf(look);
            if (!a) continue;
            const [fw, fh] = FRAME[a[0]] || [144, 144];
            const po = ev._decorPx || [0, 0], ox = ev._realX * 48 + 24 - fw / 2 + po[0], oy = (ev._realY + 1) * 48 - fh + po[1];
            const box = b => ({ ev, look, x0: (ox + b[0]) / 48, y0: (oy + b[1]) / 48, x1: (ox + b[2]) / 48, y1: (oy + b[3]) / 48, px: [b[0], b[1], b[2], b[3]] });
            for (const p of a[7] || []) out.push(Object.assign(box(p.slice(1)), { part: true }));
            out.push(box(a[6]));
        }
        return out;
    }
    // the cells the decorations close now (the pumpkins, the sheaf): nobody should be sent through them
    function blockedCells() {
        if (!onHouse()) return [];
        return $gameMap.events().filter(ev => { const s = slotOf(ev); return s && s.prio === 1 && ev._decorShown && !ev.isThrough(); }).map(ev => [ev.x, ev.y]);
    }
    window.HomeDecor = T.register(PLUGIN, {
        MAP_ID, SLOTS, DECOR_ART, state, earn, checkEarned, seedPast, lookOf, season, dayOfSeason, isEaster, isWigilia,
        refresh: () => { dirty = true; checkEarned(); refreshHouse(true); }, blockedCells, shownBoxes,
        tableCleared: () => !!(cleared && cleared.list.length)
    });
})();
