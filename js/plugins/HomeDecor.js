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
 * @default 19
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
 * Dom dziadka (mapa 19, „Bielona chata”) pamięta, co bohater przeżył, i zmienia
 * się z porami roku. Wszystkie ozdoby to zdarzenia 980-998 dokładane przez
 * wtyczkę do danych mapy przy jej wczytaniu (plików map wtyczka nie zmienia).
 * Obrazki: img/characters/!House_Decor.png i !$House_Decor_Big.png
 * (generator: tools/house/decor/make_decor.py).
 *
 * PAMIĄTKI (pojawiają się raz, gdy zasłużone, i zostają na zawsze):
 *  - pokwitowanie od Lorda w ramce, na ścianie we wnęce dziadka (obok obrazka
 *    Matki Boskiej, symetrycznie względem okna) - gdy dług jest spłacony;
 *    wcześniej wisi tam pusty gwóźdź;
 *  - skóra wilka przy posłaniu bohatera - po jego pierwszym wilku;
 *  - poroże na ścianie nad posłaniem - po pierwszym jeleniu;
 *  - kieł dzika na rzemyku (na gwoździu, a gdy jest już poroże - na porożu)
 *    - po pierwszym dziku;
 *  - półka bohatera z cynowym kuflem od Borgara (po pierwszej zmianie
 *    w tawernie) i z kośćmi (po pierwszej wygranej w kości);
 *  - ogłoszenie z tablicy zleceń przypięte przy posłaniu - po pierwszym
 *    wykonanym zleceniu.
 * Liczą się zwierzęta ubite przez bohatera (nie przez psa). W starym zapisie
 * (wtyczka dodana później) pamiątki biorą się z tego, co zapis już pamięta:
 * spłacony dług, zmiany u Borgara, wygrane w kości, zlecenia i licznik ubitych
 * zwierząt z Hunting.js (ten dawny licznik nie odróżnia zdobyczy psa).
 *
 * PORY ROKU (Farming.js: 28 dni każda, od dnia 1):
 *  - wiosna: bazie w dzbanku na stole; w połowie wiosny przez kilka dni
 *    koszyczek z pisankami;
 *  - lato: polne kwiaty w dzbanku, zioła suszące się przy kominie;
 *  - jesień: wieniec dożynkowy na kominie, kosz jabłek, dynie przy drzwiach;
 *  - zima: świerkowe gałązki nad obrazkami; w połowie zimy przez kilka dni
 *    Wigilia: obrus z sianem i opłatek na stole, snop zboża w kącie za
 *    skrzynią dziadka.
 *
 * ZAWSZE: wycinanki łowickie pod czterema oknami, haftowany ręcznik na
 * obrazku Matki Boskiej, malowana skrzynia dziadka, chodnik przy jego łóżku.
 *
 * Najechanie myszą na ozdobę pokazuje jej wspomnienie; przycisk akcji (O)
 * w stronę ozdoby - bohater mówi je w dymku (kolejne O - następna ozdoba
 * w tę stronę). Przejścia, dywan przed paleniskiem i drzwi zostają wolne.
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

    const PLUGIN = "HomeDecor";
    const T = window.Tawerna;
    if (!T) throw new Error("HomeDecor.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const MAP_ID = num(params.mapId, 19);
    const EASTER_DAYS = num(params.easterDays, 4);
    const WIGILIA_DAYS = num(params.wigiliaDays, 5);
    const NOTICES = params.notices !== "false";

    // <decor-data> (tools/house/decor/make_decor.py writes this line - do not edit by hand)
    const DECOR_ART = {"rogi":["!House_Decor",0,2,0,1,2,[56,64,88,109],[]],"kiel":["!House_Decor",0,2,1,1,2,[67,69,77,91],[]],"kiel_rog":["!House_Decor",0,2,2,1,2,[54,80,64,100],[]],"list":["!House_Decor",1,2,0,4,5,[65,89,80,109],[]],"polka_kufel":["!House_Decor",1,2,1,3,2,[53,72,91,101],[["kufel",65,72,81,89]]],"polka_kosci":["!House_Decor",1,2,2,3,2,[53,79,91,101],[["kosci",66,80,81,89]]],"polka_oba":["!House_Decor",2,2,0,3,2,[53,72,91,101],[["kufel",56,72,72,89],["kosci",75,80,90,89]]],"skora":["!House_Decor",2,2,1,3,6,[6,64,90,113],[]],"gwozdz":["!House_Decor",2,2,2,17,2,[72,73,74,75],[]],"pokwitowanie":["!House_Decor",3,2,0,17,2,[55,71,89,102],[]],"pokwitowanie_zima":["!House_Decor",3,2,1,17,2,[52,59,92,102],[]],"recznik":["!House_Decor",3,2,2,15,2,[49,68,95,114],[]],"recznik_zima":["!House_Decor",0,4,0,15,2,[49,59,95,114],[]],"chodnik":["!House_Decor",0,4,1,16,6,[17,107,127,133],[]],"wyc_2":["!House_Decor",0,4,2,2,3,[63,86,82,112],[]],"wyc_16":["!House_Decor",1,4,0,16,3,[63,86,82,112],[]],"wyc_7":["!House_Decor",1,4,1,7,3,[60,87,85,112],[]],"wyc_11":["!House_Decor",1,4,2,11,3,[60,87,85,112],[]],"ziola":["!House_Decor",2,4,0,9,2,[55,96,90,126],[]],"wieniec":["!House_Decor",2,4,1,9,2,[52,54,92,112],[]],"bazie":["!House_Decor",2,4,2,4,10,[49,71,70,102],[]],"kwiaty":["!House_Decor",3,4,0,4,10,[47,69,71,102],[]],"pisanki":["!House_Decor",3,4,1,2,10,[68,74,96,102],[]],"jablka":["!House_Decor",3,4,2,2,10,[69,78,96,102],[]],"wigilia":["!$House_Decor_Big",0,2,0,3,10,[69,120,219,183],[]],"dynie_l":["!House_Decor",0,6,0,8,11,[51,100,93,139],[]],"dynie_r":["!House_Decor",0,6,1,10,11,[51,100,93,139],[]],"snop":["!House_Decor",0,6,2,17,7,[54,86,91,140],[]],"skrzynia":["!House_Decor",1,6,0,17,8,[48,85,95,121],[]]};
    // </decor-data>
    const FRAME = { "!House_Decor": [144, 144], "!$House_Decor_Big": [288, 192] };

    // ------------------------------------------------------------------
    // The slots: one event each (ids 980..998 on the house map). prio: 0 below the characters, 1 like them (it blocks);
    // z: drawn lower than the other things below the characters (a rug, a tablecloth - the candle stays on top);
    // need: an event of the map that must stand where the house was designed (else the slot is left out: the map was edited)
    // ------------------------------------------------------------------
    const SLOTS = [
        { id: 980, key: "rogi", x: 1, y: 2, prio: 0, need: "bed" },
        { id: 981, key: "kiel", x: 1, y: 2, prio: 0, need: "bed" },
        { id: 982, key: "list", x: 4, y: 5, prio: 0, need: "bed" },   // (on the plank partition: the user's painting hangs at 1,3 since 2026-09-29)
        { id: 983, key: "polka", x: 3, y: 2, prio: 0, need: "pegs" },
        { id: 984, key: "skora", x: 3, y: 6, prio: 0, z: 0.5, need: "bed" },
        { id: 985, key: "rama", x: 17, y: 2, prio: 0, need: "picture" },
        { id: 986, key: "recznik", x: 15, y: 2, prio: 0, need: "picture" },
        { id: 987, key: "wyc_2", x: 2, y: 3, prio: 0 },
        { id: 988, key: "wyc_7", x: 7, y: 3, prio: 0 },
        { id: 989, key: "wyc_11", x: 11, y: 3, prio: 0 },
        { id: 990, key: "wyc_16", x: 16, y: 3, prio: 0 },
        { id: 991, key: "chodnik", x: 16, y: 6, prio: 0, z: 0.5, need: "quilt" },
        { id: 992, key: "komin", x: 9, y: 2, prio: 0, need: "hearth" },
        { id: 993, key: "stol_p", x: 4, y: 10, prio: 0, need: "table" },   // (the table is 3 tiles since the user's edit of 2026-09-29)
        { id: 994, key: "stol_l", x: 2, y: 10, prio: 0, need: "table" },
        { id: 995, key: "wigilia", x: 3, y: 10, prio: 0, z: 0.8, need: "table" },
        { id: 996, key: "dynie_l", x: 8, y: 11, prio: 1, need: "door" },
        { id: 997, key: "dynie_r", x: 10, y: 11, prio: 1, need: "door" },
        { id: 998, key: "snop", x: 17, y: 7, prio: 1, need: "chest" }
    ];
    const SLOT_BY_ID = {};
    for (const s of SLOTS) SLOT_BY_ID[s.id] = s;
    // what must stand where (the events of Map019 the decorations are laid out around)
    const ANCHORS = {
        bed: d => hasEvent(d, 1, 4, e => /Posłanie/i.test(e.name)),
        pegs: d => hasEvent(d, 3, 3, e => imageOf(e) === "!House_Props"),
        picture: d => hasEvent(d, 15, 2, e => /Matki Boskiej/i.test(e.name)),
        quilt: d => hasEvent(d, 17, 5, e => /Kołdra/i.test(e.name) || imageOf(e) === "!$House_Quilt"),
        hearth: d => hasEvent(d, 9, 4, e => /Palenisko/i.test(e.name)),
        table: d => hasEvent(d, 3, 10, e => /świeca/i.test(e.name)),
        door: d => hasEvent(d, 9, 12, e => /^Drzwi/i.test(e.name)),
        chest: d => hasEvent(d, 17, 8, e => /Skrzynia dziadka/i.test(e.name))
    };
    function imageOf(e) { const p = e.pages && e.pages[0]; return p && p.image ? p.image.characterName : ""; }
    function hasEvent(d, x, y, test) { return (d.events || []).some(e => e && e.x === x && e.y === y && test(e)); }

    // the memory lines (hover / the action button)
    const LINES = {
        rogi: "Poroże mojego pierwszego jelenia. Młody widłak, ale mój.",
        kiel: "Kieł mojego pierwszego dzika. Szarżował prosto na mnie...",
        skora: "Skóra pierwszego wilka. Mało brakowało...",
        list: () => { const t = state().noticeTitle; return t ? "Moje pierwsze zlecenie: „" + t + "”. Wisi na pamiątkę." : "Moje pierwsze zlecenie z tablicy w tawernie. Wisi na pamiątkę."; },
        kufel: "Cynowy kufel od Borgara - na pamiątkę pierwszej zmiany w tawernie.",
        kosci: "Moje kości. Z nimi pierwszy raz kogoś ograłem w tawernie.",
        pokwitowanie: "„Dług Stanisława spłacony co do grosza. Pole zostaje przy nim.” - L. Zaleski",
        pokwitowanieDziadek: "Oprawiłem, jak Lord radził. Niech wisi - niech każdy widzi, że u nas długów nie ma.",
        gwozdz: "Pusty gwóźdź. Dziadek mówi: „Tu zawiśnie pokwitowanie od Lorda”.",
        recznik: "Haftowany ręcznik na obrazku Matki Boskiej. Krzyżyki wyszywała jeszcze babcia.",
        recznik_zima: "Świerk nad obrazkiem, pod nim haftowany ręcznik. Zima w chacie.",
        gwiazda: "Wycinanka z kolorowego papieru. Wycina się je nożycami do strzyżenia owiec.",
        leluja: "Leluja z kolorowego papieru - każda warstwa naklejona osobno.",
        chodnik: "Chodnik tkany ze starych szmat. W tym domu nic się nie marnuje.",
        skrzynia: "Malowana skrzynia - wiano babci. Dziadek trzyma w niej odświętne ubranie.",
        ziola: "Zioła suszą się przy ciepłym kominie: dziurawiec, rumianek i mięta.",
        wieniec: "Wieniec dożynkowy z tegorocznych kłosów. Wisi do wiosny.",
        bazie: "Bazie w dzbanku. Wiosna idzie.",
        kwiaty: "Polne kwiaty: maki, chabry i rumianek.",
        pisanki: "Koszyczek z pisankami na Wielkanoc. Dziadek maluje je woskiem.",
        jablka: "Kosz jabłek. Pachną na całą izbę.",
        dynie: "Dynie z pola - będzie zupa na zimę.",
        wigilia: "Opłatek na stole, sianko pod obrusem - Wigilia w chacie.",
        snop: "Snop zboża w kącie za skrzynią - na Wigilię, na dobry rok."
    };
    // the line of a look (a part of it: the shelf's tankard or dice)
    const LOOK_LINE = { rogi: "rogi", kiel: "kiel", kiel_rog: "kiel", skora: "skora", list: "list", polka_kufel: "kufel", polka_kosci: "kosci",
        polka_oba: "kufel", pokwitowanie: "pokwitowanie", pokwitowanie_zima: "pokwitowanie", gwozdz: "gwozdz", recznik: "recznik",
        recznik_zima: "recznik_zima", wyc_2: "leluja", wyc_16: "leluja", wyc_7: "gwiazda", wyc_11: "gwiazda", chodnik: "chodnik",
        ziola: "ziola", wieniec: "wieniec", bazie: "bazie", kwiaty: "kwiaty", pisanki: "pisanki", jablka: "jablka", dynie_l: "dynie",
        dynie_r: "dynie", wigilia: "wigilia", snop: "snop", skrzynia: "skrzynia" };
    const lineOf = k => { const v = LINES[k]; return typeof v === "function" ? v() : v || ""; };
    // the keepsakes and the notice when one comes
    const EARNED_NOTE = { receipt: "Pokwitowanie od Lorda zawisło w ramce", wolf: "Skóra wilka leży przy twoim posłaniu",
        deer: "Poroże jelenia wisi nad twoim posłaniem", boar: "Kieł dzika wisi na rzemyku przy posłaniu", tankard: "Kufel od Borgara stoi na twojej półce",
        dice: "Twoje kości leżą na półce", notice: "Ogłoszenie z pierwszego zlecenia wisi przy posłaniu" };

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
        if (!quiet && NOTICES && EARNED_NOTE[key]) T.popup("Nowa pamiątka w domu dziadka", { top: true, color: "#ffd23f", sub: EARNED_NOTE[key] + "." });
        dirty = true;
        return true;
    }
    // the other plugins' states: read as a game loads (an older save's past, seedPast / checkEarned); after that their events tell
    const storyPaid = () => safe(() => { const st = T.call("Story", "state"); return !!st && !st.pending && !!(st.done || st.paid >= st.debt); }, false);
    const storyActive = () => safe(() => !!T.call("Story", "active"), false);
    const shiftsDone = () => safe(() => (T.call("TavernShift", "stats") || {}).done || 0, 0);
    const diceWins = () => safe(() => ($gameSystem._dice ? (T.call("TavernDice", "stats") || {}).wins || 0 : 0), 0);   // (_dice: not made by asking)
    function firstContract() {
        return safe(() => {
            if (!$gameSystem._quests || !T.has("QuestBoard")) return null;
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
        if (data.width !== 19 || data.height !== 13) return [];
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
    const _Game_Event_screenZ = Game_Event.prototype.screenZ;
    Game_Event.prototype.screenZ = function() {
        if (this._decorZ !== undefined && this._decorShown) return this._decorZ;
        return _Game_Event_screenZ.call(this);
    };

    // Christmas Eve: the dishes (Winlu D tiles) are taken off the table while the cloth lies on it, and put back after
    const TABLE_CELLS = [[2, 9], [3, 9], [4, 9], [2, 10], [3, 10], [4, 10]];
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
    T.onMapUpdate(scene => {
        if (onHouse()) updateHover(scene);
        else if (scene._decorTip) scene._decorTip.visible = false;
    }, { owner: PLUGIN, name: "hover" });

    // the sheets come with the map (the first look does not wait for them)
    T.onMapData(() => { for (const f of Object.keys(FRAME)) ImageManager.loadCharacter(f); }, { owner: PLUGIN });

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
    // Where a decoration is: its picture's box on the map (tiles) and on the screen
    // ------------------------------------------------------------------
    // -> [{ ev, look, key (line), x0, y0, x1, y1 }] in map tiles: every part of every shown decoration (the shelf: its tankard
    //    and its dice), then the whole picture
    function shownBoxes() {
        const out = [];
        if (!onHouse()) return out;
        for (const ev of $gameMap.events()) {
            const look = ev._decorLook;
            if (!look || (!slotOf(ev) && look !== "skrzynia") || ev.isTransparent()) continue;
            const a = artOf(look);
            if (!a) continue;
            const [fw, fh] = FRAME[a[0]] || [144, 144];
            const ox = ev._realX * 48 + 24 - fw / 2, oy = (ev._realY + 1) * 48 - fh;
            const box = (b, key) => ({ ev, look, key, x0: (ox + b[0]) / 48, y0: (oy + b[1]) / 48, x1: (ox + b[2]) / 48, y1: (oy + b[3]) / 48,
                px: [b[0], b[1], b[2], b[3]] });
            for (const p of a[7] || []) out.push(Object.assign(box(p.slice(1), p[0]), { part: true }));
            out.push(box(a[6], LOOK_LINE[look]));
        }
        return out;
    }
    // the line to say / show for a box (the receipt: grandpa's words when he is in the room)
    function lineFor(b, forLook) {
        if (b.key === "pokwitowanie" && forLook) {
            const g = safe(() => T.call("Story", "npc", "grandpa") || null, null);
            if (g && !g.isTransparent() && g.characterName()) return { who: g, text: LINES.pokwitowanieDziadek };
        }
        if (b.look === "polka_oba" && !b.part) return { who: $gamePlayer, text: lineOf("kufel") + " " + lineOf("kosci") };
        return { who: $gamePlayer, text: lineOf(b.key) };
    }

    // ---- the action button: the decoration the hero faces (a cone in front of him); pressed again soon - the next one that way
    const look = { last: null, at: 0, pos: "", line: "", key: "" };   // (the last one looked at: O again soon, same spot -> the next)
    // the decorations in front of the hero, the likeliest first: how far ahead the box's near edge is, plus (heavier) how far it
    // lies to the side of the line he looks along (0 when the box spans that line); a cone that widens with the distance
    function candidates() {
        const p = $gamePlayer, hx = p._realX + 0.5, hy = p._realY + 0.5, d = p.direction();
        const list = [], seen = new Set();
        for (const b of shownBoxes()) {
            const id = b.ev.eventId() + ":" + (b.part ? b.key : "*");
            if (seen.has(id)) continue;
            if (!b.part && ((artOf(b.look) || [])[7] || []).length) continue;   // (the shelf's things are looked at one by one)
            let fwd, lat;
            if (d === 8 || d === 2) {
                fwd = d === 8 ? hy - b.y1 : b.y0 - hy;
                lat = hx < b.x0 ? b.x0 - hx : hx > b.x1 ? hx - b.x1 : 0;
            } else {
                fwd = d === 4 ? hx - b.x1 : b.x0 - hx;
                lat = hy < b.y0 ? b.y0 - hy : hy > b.y1 ? hy - b.y1 : 0;
            }
            const flat = (slotOf(b.ev) || {}).z !== undefined;
            if (fwd < (flat ? 0.2 : -0.3) || fwd > 4.8 || lat > 0.6 + fwd * 0.9) continue;   // (a rug he stands on is not what he looks at)
            seen.add(id);
            list.push({ b, id, score: Math.max(0, fwd) + lat * 2.5 });
        }
        list.sort((a, c) => a.score - c.score);
        return list;
    }
    function lookAround() {
        if (!onHouse() || !T.isCalm(SceneManager._scene, "input")) return false;
        const list = candidates();
        if (!list.length) return false;
        const now = Graphics.frameCount;
        let pick = list[0];
        if (look.last && now - look.at < 240 && look.pos === $gamePlayer.x + "," + $gamePlayer.y + "," + $gamePlayer.direction()) {
            const i = list.findIndex(c => c.id === look.last);
            if (i >= 0) pick = list[(i + 1) % list.length];
        }
        look.last = pick.id; look.at = now; look.pos = $gamePlayer.x + "," + $gamePlayer.y + "," + $gamePlayer.direction();
        const l = lineFor(pick.b, true);
        look.line = l.text; look.key = pick.b.key;
        const SB = T.api("SpeechBubbles");
        if (SB && SB.say) SB.say(l.who, l.text);
        else $gameMessage.add(l.text);
        return true;
    }
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (_Game_Player_triggerButtonAction.call(this)) return true;
        if (Input.isTriggered("ok") && onHouse()) return lookAround();
        return false;
    };

    // ---- the mouse: a small plate with the line beside the cursor while it is over a decoration
    function Sprite_DecorTip() { this.initialize(...arguments); }
    Sprite_DecorTip.prototype = Object.create(Sprite.prototype);
    Sprite_DecorTip.prototype.constructor = Sprite_DecorTip;
    Sprite_DecorTip.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(420, 44));
        this.visible = false;
        this._text = "";
    };
    Sprite_DecorTip.prototype.setText = function(text) {
        if (text === this._text) return;
        this._text = text;
        const b = this.bitmap, U = window.UIStyle;
        b.clear();
        b.fontSize = 18;
        if ($gameSystem) b.fontFace = $gameSystem.mainFontFace();
        const w = Math.min(416, Math.ceil(b.measureTextWidth(text)) + 24);
        if (U && U.panel) U.panel(b.context, 1, 1, w, 34, { cut: 4 });
        else { b.fillRect(1, 1, w, 34, "rgba(11,12,15,0.9)"); }
        b.textColor = U ? U.text : "#eceef0";
        b.outlineWidth = 0;
        b.drawText(text, 12, 3, w - 20, 30, "left");
        if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
        this._w = w;
    };
    let hoverBox = null;
    function spriteOf(scene, ev) {
        const ss = scene._spriteset;
        return ss && ss._characterSprites ? ss._characterSprites.find(s => s._character === ev) || null : null;
    }
    // the decoration under the mouse (the smallest box first: the tankard before the shelf)
    function decorAtScreen(scene, mx, my) {
        let best = null;
        for (const b of shownBoxes()) {
            const sp = spriteOf(scene, b.ev);
            if (!sp || !sp.worldTransform || !sp.visible) continue;
            const fw = sp.patternWidth ? sp.patternWidth() : 144, fh = sp.patternHeight ? sp.patternHeight() : 144;
            const p0 = sp.worldTransform.apply(new PIXI.Point(b.px[0] - fw / 2, b.px[1] - fh));
            const p1 = sp.worldTransform.apply(new PIXI.Point(b.px[2] - fw / 2, b.px[3] - fh));
            if (mx >= Math.min(p0.x, p1.x) && mx < Math.max(p0.x, p1.x) && my >= Math.min(p0.y, p1.y) && my < Math.max(p0.y, p1.y)) {
                const area = (b.x1 - b.x0) * (b.y1 - b.y0);
                if (!best || area < best.area) best = { b, area };
            }
        }
        return best ? best.b : null;
    }
    function updateHover(scene) {
        if (!scene._decorTip) {
            scene._decorTip = new Sprite_DecorTip();
            scene.addChild(scene._decorTip);
        }
        const tip = scene._decorTip;
        if (!T.isCalm(scene)) { tip.visible = false; hoverBox = null; return; }
        if (TouchInput.isHovered() || TouchInput.isMoved() || Graphics.frameCount % 10 === 0) {
            const inside = TouchInput.x > 0 || TouchInput.y > 0;
            hoverBox = inside ? decorAtScreen(scene, TouchInput.x, TouchInput.y) : null;
        }
        if (!hoverBox) { tip.visible = false; return; }
        tip.setText(lineFor(hoverBox, false).text);
        tip.visible = true;
        tip.x = Math.min(Graphics.width - tip._w - 6, TouchInput.x + 16);
        tip.y = Math.max(6, TouchInput.y - 44);
    }

    // ------------------------------------------------------------------
    // For other plugins and the tests
    // ------------------------------------------------------------------
    // the cells the decorations close now (the pumpkins, the sheaf): nobody should be sent through them
    function blockedCells() {
        if (!onHouse()) return [];
        return $gameMap.events().filter(ev => { const s = slotOf(ev); return s && s.prio === 1 && ev._decorShown && !ev.isThrough(); }).map(ev => [ev.x, ev.y]);
    }
    window.HomeDecor = T.register(PLUGIN, {
        MAP_ID, SLOTS, LINES, DECOR_ART, state, earn, checkEarned, seedPast, lookOf, season, dayOfSeason, isEaster, isWigilia,
        refresh: () => { dirty = true; checkEarned(); refreshHouse(true); }, blockedCells, shownBoxes, candidates, lookAround,
        lineOf, get lastLine() { return look.line; }, get lastKey() { return look.key; }, get hover() { return hoverBox; },
        decorAtScreen: (x, y) => decorAtScreen(SceneManager._scene, x, y), tableCleared: () => !!(cleared && cleared.list.length)
    });
})();
