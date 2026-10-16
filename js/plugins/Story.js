//=============================================================================
// Story.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Fabuła nowej gry: dom dziadka, dług u Lorda (spłata do terminu albo strata pola i odkup), praca u Borgara, rozdział 1 w dzienniku. v1.2.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TavernShift
 * @orderAfter Journal
 * @orderAfter MenuPanel
 *
 * @param debt
 * @text Dług (G)
 * @desc Ile dziadek jest winien Lordowi.
 * @type number
 * @min 1
 * @default 2500
 *
 * @param deadline
 * @text Termin (dzień)
 * @desc Ostatni dzień spłaty. Kamerdyner przyjmuje pieniądze jeszcze w nocy po nim; o świcie (6:00) następnego dnia pole przechodzi na Lorda.
 * @type number
 * @min 2
 * @default 60
 *
 * @param endOnDeadline
 * @text Termin działa
 * @desc Wyłączone: termin mija bez skutków - pole zostaje (do testów i botów).
 * @type boolean
 * @default true
 *
 * @param loseEndsGame
 * @text Przegrana kończy grę
 * @desc Włączone: jak dawniej - niespłacony dług o świcie po terminie kończy grę (ekran końca, bez zapisu). Wyłączone: pole przechodzi na Lorda, gra toczy się dalej.
 * @type boolean
 * @default false
 *
 * @param carryDays
 * @text Dni na wyniesienie dobytku
 * @desc Ile dni po stracie pola wolno jeszcze z niego zabierać rzeczy (do świtu kolejnego dnia).
 * @type number
 * @min 1
 * @default 3
 *
 * @param buybackPrice
 * @text Odkup pola (G)
 * @desc Za ile Lord odsprzeda pole po stracie (w ratach, bez terminu).
 * @type number
 * @min 1
 * @default 3000
 *
 * @param shiftFrom
 * @text Zmiana od godziny
 * @type number
 * @min 0
 * @max 23
 * @default 16
 *
 * @param shiftTo
 * @text Zmiana do godziny
 * @desc Borgar daje zmianę od „Zmiana od” do tej godziny (bez niej).
 * @type number
 * @min 1
 * @max 24
 * @default 21
 *
 * @param rewardXp
 * @text Nagroda za rozdział 1 (dośw.)
 * @type number
 * @min 0
 * @default 300
 *
 * @help
 * ============================================================================
 * Story.js - początek fabuły (tylko NOWA gra)
 * ============================================================================
 * Nowa gra zaczyna się w domu dziadka Stacha (mapa 19). Po rozjaśnieniu
 * ekranu dziadek opowiada o długu: 2500 G dla Lorda Leopolda Zaleskiego
 * (dwór obok tawerny, mapa 24), termin: dzień 60. Na swoim polu (mapa 3,
 * w grze z fabułą nazwana „Pole dziadka”) dziadek pozwala budować.
 * Pieniądze da praca u Borgara w tawernie „Pod Złotym Kuflem” (mapa 1):
 * zmiany od 16 do 21 (TavernShift.js).
 *
 * Postacie dochodzą w trakcie gry - pliki map zostają nietknięte:
 *  - dziadek Stach ($Npc_Dziadek, w stylu bohatera) w domu dziadka,
 *  - Lord Zaleski ($Npc_Lord, w stylu bohatera) przed drzwiami dworu za dnia
 *    (8-20); nocą przez drzwi odzywa się kamerdyner Feliks. Wtyczka szuka
 *    zdarzenia o nazwie „Drzwi dworu” i staje obok niego,
 *  - Borgar (istniejące zdarzenie na mapie 1): zatrudnia bohatera, daje
 *    zmianę (16-21, raz dziennie), skupuje towar, a „Pogadaj” prowadzi do
 *    jego zwykłych pytań. Z TavernLife.js dochodzą „Zjedz coś” i „Wynajmij
 *    pokój”.
 * Spłata: u Lorda (albo u kamerdynera) 100 / 500 / wszystko. Całość =
 * koniec rozdziału 1 (nagroda: doświadczenie, podziękowanie dziadka).
 * Przypomnienia: listy od Lorda w dniach 20, 40, 55, 59 i 60.
 * Termin: pieniądze liczą się do świtu (6:00) dnia po terminie - w tę
 * ostatnią noc przyjmuje je kamerdyner. O świcie, gdy dług wciąż
 * niespłacony, pole przechodzi na Lorda (gra toczy się dalej, zapis
 * działa): ludzie Lorda (kamerdyner i strażnicy) mierzą pole i stawiają
 * znak - scena, gdy bohater jest na polu albo pierwszy raz tam wejdzie;
 * gdzie indziej przychodzi list. Przez 3 dni (parametr) wolno z pola
 * zabrać, co się da (plony, skrzynie, rozbiórka, zwierzęta, pies, chatka);
 * potem pole jest zamknięte (Homes.js: strażnik, dymek nad bohaterem).
 * Lord odsprzeda pole za 3000 G (w ratach, bez terminu) - po spłacie
 * wraca z tym, co na nim zostało. Rozdział 1 kończy się spłatą ALBO
 * stratą pola; haczyk o drzwiach pod Kruczymi Skałami pada w obu.
 * Parametr „Przegrana kończy grę” przywraca dawny koniec gry (ekran
 * końca, bez zapisu). Wszystko czeka, aż bohater wstanie (odpoczynek) i
 * skończy rozmowę czy zmianę.
 *
 * Dziennik: rozdział „Rozdział 1: Dług dziadka” z celami. Stan długu
 * widać też w menu (P) i na porannej tabliczce dnia.
 *
 * Stary zapis (bez fabuły) i gra, która nie zaczyna się w domu dziadka,
 * działają jak dawniej: bez postaci, bez długu, bez terminu.
 *
 * Postacie fabuły to zdarzenia nr 901 (dziadek, mapa 19) i 902 (Lord,
 * mapa 24) dopisywane przy wczytaniu mapy - w edytorze ich nie widać.
 * Grafika dziadka: img/characters/$Npc_Dziadek.png (PixelLab, w stylu
 * bohatera; źródła i skrypt w tools/npc/).
 *
 * Dla innych wtyczek i testów: Story.state(), Story.active(), Story.pay(n)
 * (spłata poza rozmową; całość od razu kończy rozdział 1; po stracie
 * pola - rata odkupu), Story.left(), Story.daysLeft(), Story.skipIntro()
 * (rozmowa z dziadkiem jak wysłuchana - dla botów), Story.setDeadlineOn(
 * false) (termin bez skutków), Story.fieldLost() / fieldLocked() /
 * fieldBack() / carryLeft() / buyLeft() / chapterEnded() / halfWay().
 * Szyna rdzenia (Tawerna.on): debtPayment, debtPaid, fieldLost,
 * fieldLocked, fieldBack, buybackPayment i storyStep { step } przy każdym
 * kroku rozdziału 1 (talk, field, tavern, manor, lordMet, hired,
 * firstShift, chapterDone, chapterLost, measured, thanked, cellar...).
 *
 * Wymaga TawernaCore.js (pierwsza na liście wtyczek). Stan fabuły:
 * Tawerna.state "story" (w starszych zapisach $gameSystem._story).
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "Story";
    const T = window.Tawerna;
    if (!T) throw new Error("Story.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const DEBT = num(params.debt, 2500);
    const DEADLINE = num(params.deadline, 60);
    const END_ON_DEADLINE = params.endOnDeadline === undefined || params.endOnDeadline === "" ? true : params.endOnDeadline === "true";
    // (the user 2026-10-15: an unpaid debt no longer ends the game - the field goes to the Lord; the old ending sleeps behind this)
    const LOSE_ENDS = params.loseEndsGame === "true";
    const CARRY_DAYS = Math.max(1, num(params.carryDays, 3));
    const BUYBACK = Math.max(1, num(params.buybackPrice, 3000));
    const SHIFT_FROM = num(params.shiftFrom, 16), SHIFT_TO = num(params.shiftTo, 21);
    const SHIFT_HOURS = num(PluginManager.parameters("TavernShift").hours, 4);   // (how long a shift takes: TavernShift's own setting)
    const REWARD_XP = num(params.rewardXp, 300);

    const MAP = { house: 19, field: 3, tavern: 1, manor: 24, cellar: 9 };
    const LETTERS_BEFORE = [40, 20, 5, 1, 0];   // letters from the Lord: days before the deadline (60: days 20, 40, 55, 59, 60)
    // the Lord's butler: Feliks - or, once W1 has sent him away (TownLife "gone"), the new butler Teodor (user 2026-10-05)
    const butler = () => (window.TownLife && typeof TownLife.gone === "function" && TownLife.gone("feliks") ? "Teodor" : "Feliks");
    const LORD_HOURS = [8, 20];              // the Lord stands at his door by day (the butler's words say "od ósmej")
    const NIGHT = [22, 6];                   // grandpa dozes
    const DAWN = 6;                          // the debt counts till dawn of the day after the deadline (the Lord's men come at dawn)
    const SOUP = 131;                        // Kapuśniak (grandpa's cabbage)
    const PENDANT = 172;                     // Wisiorek z krukiem (the prologue: the mother gives it; in the bag from the story's start)
    const GOLD_ICON = 313;
    const TORCH = 59;                        // Pochodnia (the clue's goal: the way down under the tavern)
    const SHELTERS = ["shelter", "tent", "bedroll", "hut"];
    // the characters the story adds to maps (event ids far above what the editor gives out; Forestry's planted trees start at 1000)
    const NPCS = {
        grandpa: { id: 901, map: MAP.house, name: "Dziadek Stach", sheet: "$Npc_Dziadek", index: 0, face: ["People1", 6], at: [10, 6], dir: 2 },   // (on the rug by the hearth, beside his rocking chair - the whitewashed cottage, 2026-09-28)
        lord: { id: 902, map: MAP.manor, name: "Lord Leopold Zaleski", sheet: "$Npc_Lord", index: 0, face: ["People2", 4], at: null, dir: 2 }   // (hero-style sheet 2026-10-04; the face is still the old one)
    };
    // map names in a story game (the map files stay as they are: an old save keeps the old names)
    const MAP_NAMES = { [MAP.field]: "Pole dziadka" };
    const BORGAR_FACE = ["People3", 4];
    const CHAPTER = "Rozdział 1: Dług dziadka";

    // ------------------------------------------------------------------
    // State: Tawerna.state("story") = $gameSystem._tw.story (plain data only, saved with the game; an older save's
    // $gameSystem._story is taken over). A game without the story (an old save, an old-style start elsewhere) keeps an empty object
    // there: Story.state() is null then.
    // ------------------------------------------------------------------
    function newState() {
        return { v: 1, pending: true, debt: DEBT, deadline: DEADLINE, paid: 0, payments: [], intro: 0, hint: 0,
            flags: {}, letters: {}, shiftDay: -1, lastShift: null, done: 0, ended: 0, off: !END_ON_DEADLINE };
    }
    const KEY = "story";
    const store = T.state.define(KEY, () => ({}), { version: 1, adopt: "_story", owner: PLUGIN });
    const isStory = s => !!s && typeof s === "object" && s.debt !== undefined;
    const state = () => { if (!window.$gameSystem) return null; const s = store(); return isStory(s) ? s : null; };
    // a new story, or none (null): the saved object itself is replaced
    function setState(data) {
        store();
        $gameSystem._tw[KEY] = data && typeof data === "object" ? data : {};
    }
    // The old name $gameSystem._story stays a way to the state (the core's alias) and, as before, is nothing (undefined) in a game
    // without the story - old code and the tests ask !!$gameSystem._story. Put over the core's alias once a game is made or loaded.
    function keepOldName() {
        const sys = window.$gameSystem;
        if (!sys) return;
        Object.defineProperty(sys, "_story", { configurable: true, enumerable: false,
            get() { const r = this._tw, s = r && r[KEY]; return isStory(s) ? s : undefined; },
            set(v) { const r = this._tw || (this._tw = {}); r[KEY] = v && typeof v === "object" ? v : {}; } });
    }
    const active = () => { const s = state(); return !!s && !s.pending; };
    const day = () => T.time.day();
    const hour = () => T.time.hour();
    const left = () => { const s = state(); return s ? Math.max(0, s.debt - s.paid) : 0; };
    const daysLeft = () => { const s = state(); return s ? s.deadline - day() + 1 : 0; };   // (today counts: on the deadline day 1 is left)
    const isOpen = () => { const s = state(); return !!s && !s.pending && !s.done && !s.lost && s.paid < s.debt; };
    // past the deadline, before dawn: the last night (the butler still takes the money)
    const lastNight = () => { const s = state(); return !!s && !s.lost && day() === s.deadline + 1 && hour() < DAWN; };
    // the deadline gone by with the debt unpaid (dawn of the day after it) - the field goes to the Lord then
    function pastDue() {
        const s = state();
        if (!s || s.pending || s.off || s.done || s.paid >= s.debt) return false;
        const d = day(), h = hour();
        return d > s.deadline + 1 || (d === s.deadline + 1 && h >= DAWN);
    }
    // the old ending (the parameter "Przegrana kończy grę"): the game is over, nothing more is saved
    const doomed = () => LOSE_ENDS && pastDue();
    // ---- the field lost to the Lord (s.lost = { day, scene, locked, told }) and bought back (s.buy = { price, paid, payments, done })
    const lostState = () => { const s = state(); return s && s.lost ? s.lost : null; };
    const fieldBack = () => { const s = state(); return !!s && !!s.lost && !!s.buy && !!s.buy.done; };
    const fieldLost = () => !!lostState() && !fieldBack();
    const nowHours = () => day() * 24 + hour();
    const lockAt = () => { const L = lostState(); return L ? (L.day + CARRY_DAYS) * 24 + DAWN : Infinity; };
    // the carrying out is over: the field is shut (the guard, no way in)
    const fieldLocked = () => fieldLost() && (!!lostState().locked || nowHours() >= lockAt());
    // the days left to carry things off the field (today counts; 0 = the last night before the dawn that shuts it)
    const carryLeft = () => (fieldLost() && !fieldLocked() ? Math.max(0, lostState().day + CARRY_DAYS - day()) : 0);
    const buyLeft = () => { const s = state(); return s && s.buy ? Math.max(0, s.buy.price - s.buy.paid) : 0; };
    const buyOpen = () => fieldLost() && buyLeft() > 0;
    // chapter 1 over: the debt paid, or the field lost (the gates "after the debt" of the other plugins: W4, Act II)
    const chapterEnded = () => { const s = state(); return !!s && !s.pending && !!(s.done || s.lost); };
    // half way: half the debt paid before the deadline, or half the buyback (W3's chronicle verse at the Lord)
    const halfWay = () => { const s = state(); return !!s && (s.paid >= s.debt / 2 || (!!s.buy && s.buy.paid >= s.buy.price / 2) || fieldBack()); };
    // a step of chapter 1 done: its flag in the state set (once) and told on the bus as storyStep { step }
    const mark = name => { const s = state(); if (!s || s.flags[name]) return false; s.flags[name] = true; return true; };
    const tell = name => T.emit("storyStep", { step: name });
    function step(name) {
        if (!mark(name)) return false;
        tell(name);
        return true;
    }
    const U = () => T.api("UITheme") || { fill: "rgba(11,12,15,0.9)", line: "#3a3e46", accent: "#ffd23f", text: "#eceef0", muted: "#8a9099", panel: null, bar: null };

    // Polish words for counts
    const dni = n => (n === 1 ? "1 dzień" : n + " dni");
    function zostalo(n) {
        if (n === 1) return "został";
        const d = n % 10, t = n % 100;
        return d >= 2 && d <= 4 && (t < 12 || t > 14) ? "zostały" : "zostało";
    }
    // a phrase that stands on its own ("zostało 59 dni", "dziś ostatni dzień", "termin mija o świcie")
    const daysPhrase = n => (n > 1 ? zostalo(n) + " " + dni(n) : n === 1 ? "dziś ostatni dzień" : lastNight() ? "termin mija o świcie" : "termin minął");
    // what the Lord and his butler say about the debt
    // the carrying out as said: "zostały 3 dni", "dziś ostatni dzień", "o świcie pole zamkną"
    const carryPhrase = n => (n > 1 ? zostalo(n) + " " + dni(n) : n === 1 ? "dziś ostatni dzień" : "o świcie pole zamkną");
    function statusLine() {
        const s = state();
        if (!s) return "";
        if (fieldBack()) return "Pole odkupione: " + s.buy.price + " G.";
        if (s.lost) return (s.buy.paid > 0 ? "Za pole oddałeś już " + s.buy.paid + " z " + s.buy.price + " G, brakuje " + buyLeft() + " G."
            : "Pole odkupisz za " + s.buy.price + " G - w ratach, bez terminu.");
        if (s.done || s.paid >= s.debt) return "Dług spłacony: " + s.debt + " G.";
        const n = daysLeft(), when = n > 1 ? zostalo(n) + " " + dni(n) : n === 1 ? "to dziś" : lastNight() ? "mija o świcie" : "minął";
        return (s.paid > 0 ? "Oddałeś już " + s.paid + " G, brakuje " + left() + " G." : "Na razie nic nie oddałeś - brakuje " + left() + " G.") +
            " Termin: dzień " + s.deadline + " - " + when + ".";
    }

    // ------------------------------------------------------------------
    // Event commands: the talks are built as lists of ordinary commands (messages in the speech bubbles of SpeechBubbles.js,
    // choices, script calls back into this plugin). Only data - a game saved in the middle of a talk loads fine.
    // ------------------------------------------------------------------
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const WRAP_W = 540, PAGE_LINES = 3;
    let probe = null;
    // a line measured as it will be shown: \N[n] is the actor's name (the hero's own name from the prologue's name screen)
    const shownNames = text => String(text).replace(/\\N\[(\d+)\]/gi, (m, n) => (window.$gameActors && $gameActors.actor(Number(n)) ? $gameActors.actor(Number(n)).name() : ""));
    function wrap(text) {
        if (!probe) probe = new Bitmap(8, 8);
        probe.fontFace = $gameSystem.mainFontFace();
        probe.fontSize = $gameSystem.mainFontSize();
        const lines = [];
        for (const para of String(text).replace(/(\d) G\b/g, "$1 G").split("\n")) {   // (a sum keeps its "G" on its line)
            let line = "";
            for (const word of para.split(" ")) {
                const trial = line ? line + " " + word : word;
                if (line && probe.measureTextWidth(shownNames(trial)) > WRAP_W) { lines.push(line); line = word; } else line = trial;
            }
            lines.push(line);
        }
        return lines;
    }
    // who: 0 the hero, an event id, -1 the plain window; face: [name, index] (shown only in the plain window)
    function say(out, who, text, face, indent) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE_LINES) {
            out.push(C(101, [face ? face[0] : "", face ? face[1] : 0, 0, 2, ""], indent));
            lines.slice(i, i + PAGE_LINES).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + who + "]" : "") + l], indent)));
        }
        return out;
    }
    const script = (out, js, indent) => (out.push(C(355, [js], indent)), out);
    // options: [{ label, js }] - each branch calls back into the plugin; `cancel`: the option Esc picks
    function choose(out, options, cancel, indent) {
        const ind = indent || 0;
        out.push(C(102, [options.map(o => o.label), cancel === undefined ? options.length - 1 : cancel, 0, 2, 0], ind));
        options.forEach((o, i) => {
            out.push(C(402, [i, o.label], ind));
            for (const js of [].concat(o.js || [])) out.push(C(355, [js], ind + 1));
            out.push(C(0, [], ind + 1));
        });
        out.push(C(404, [], ind));
        return out;
    }
    const end = out => (out.push(C(0, [])), out);
    // runs a list after the current command of this interpreter (a child: the talk goes on in it)
    function run(interp, list) {
        if (interp && list && list.length) interp.setupChild(end(list), interp.eventId());
    }
    const stub = role => [C(355, ["Story.talk(this, \"" + role + "\")"]), C(0, [])];
    const STUBS = { borgar: stub("borgar"), door: stub("door"), grandpa: stub("grandpa"), lord: stub("lord") };

    // ------------------------------------------------------------------
    // The characters: event data put into the map's data when it loads (the core's Tawerna.inject, ids 901-902: before the map sets
    // its events up; again after every menu, because the map data is loaded anew while the events stay)
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function page(image, list, extra) {
        return Object.assign({ conditions: Object.assign({}, BLANK), directionFix: false, image, list,
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }, extra || {});
    }
    function npcData(role, x, y) {
        const n = NPCS[role];
        const pages = [page({ tileId: 0, characterName: n.sheet, direction: n.dir, pattern: 1, characterIndex: n.index }, STUBS[role])];
        if (role === "lord") {   // self switch A: he is inside (night) - nothing there
            pages.push(page({ tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }, [C(0, [])],
                { conditions: Object.assign({}, BLANK, { selfSwitchValid: true, selfSwitchCh: "A" }), priorityType: 0, through: true }));
        }
        return { id: n.id, name: n.name, note: "<Story:" + role + ">", x, y, pages };
    }
    const findDoorData = data => (data.events || []).find(e => e && /^Drzwi dworu/i.test(e.name || "")) || null;
    // when: a story there (a new game's story is still pending as its first map loads). A map set up without it (an old-style game
    // that began elsewhere: performTransfer drops the pending story first) has its story characters taken out of the data again by
    // the core. fixSaved off: a saved game keeps the characters it was saved with.
    T.inject([MAP.house, MAP.manor], { ids: [NPCS.grandpa.id, NPCS.lord.id], owner: PLUGIN, fixSaved: false, when: () => !!state(),
        build(data, mapId) {
            const out = [];
            for (const role of Object.keys(NPCS)) {
                const n = NPCS[role];
                if (n.map !== mapId) continue;
                let at = n.at;
                if (!at) { const door = findDoorData(data); at = door ? [door.x + 1, door.y + 1] : [Math.floor(data.width / 2), Math.floor(data.height / 2)]; }
                out.push(npcData(role, at[0], at[1]));
            }
            return out;
        } });
    // where they stand: grandpa by his armchair, the Lord beside the manor's door (found by its name: the door may be moved)
    function freeFor(ev, x, y) {
        if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
        return !$gameMap.eventsXy(x, y).some(e => e !== ev && e.isNormalPriority() && !e.isThrough());
    }
    function placeNear(ev, spots, x0, y0) {
        for (const [x, y] of spots) if (freeFor(ev, x, y)) return ev.locate(x, y);
        for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) === r && freeFor(ev, x0 + dx, y0 + dy)) return ev.locate(x0 + dx, y0 + dy);
        }
    }
    const npc = role => ($gameMap && $gameMap.mapId() === NPCS[role].map ? $gameMap.event(NPCS[role].id) || null : null);
    function doorEvent() {
        if (!$gameMap || $gameMap.mapId() !== MAP.manor) return null;
        return $gameMap.events().find(e => e.event() && /^Drzwi dworu/i.test(e.event().name || "")) || null;
    }
    function borgarEvent() {
        if (!$gameMap || $gameMap.mapId() !== MAP.tavern) return null;
        return $gameMap.events().find(e => roleOf(e) === "borgar") || null;
    }
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        if (!active()) return;
        const g = npc("grandpa");
        if (g) { const [x, y] = NPCS.grandpa.at; placeNear(g, [[x, y], [x - 1, y], [x, y + 1]], x, y); }
        const l = npc("lord"), d = doorEvent();
        if (l && d) placeNear(l, [[d.x + 1, d.y + 1], [d.x - 1, d.y + 1], [d.x + 2, d.y + 1], [d.x - 2, d.y + 1], [d.x + 1, d.y + 2], [d.x - 1, d.y + 2]], d.x, d.y + 1);
        syncLord();
    };
    const lordHere = () => hour() >= LORD_HOURS[0] && hour() < LORD_HOURS[1];
    function syncLord() {
        const l = npc("lord");
        if (!l) return;
        const key = [MAP.manor, NPCS.lord.id, "A"], away = !lordHere();
        if (!!$gameSelfSwitches.value(key) !== away) $gameSelfSwitches.setValue(key, away);
    }
    // the existing characters the story speaks through: Borgar (tavern) and the manor's door; their own commands stay reachable
    const roles = new WeakMap();
    function roleOf(ev) {
        if (roles.has(ev)) return roles.get(ev);
        let r = null;
        const d = ev.event(), p = d && d.pages && d.pages[0];
        // (only a character talked to: "Atmosfera - Borgar" is a parallel event of the same name)
        if (p && p.trigger <= 2 && ev._mapId === MAP.tavern) {
            if (/^Borgar\b/i.test(d.name || "") || (p.image && p.image.characterName === "People3_Tall" && p.image.characterIndex === 4)) r = "borgar";
        } else if (p && p.trigger <= 2 && ev._mapId === MAP.manor && /^Drzwi dworu/i.test(d.name || "")) r = "door";
        roles.set(ev, r);
        return r;
    }
    const ownList = ev => (ev.page() ? ev.page().list : null);
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        if (active()) { const r = roleOf(this); if (r) return STUBS[r]; }
        return _Game_Event_list.call(this);
    };

    // ------------------------------------------------------------------
    // The talks
    // ------------------------------------------------------------------
    const G = () => NPCS.grandpa.id, L = () => NPCS.lord.id;
    const gSay = (out, text) => say(out, G(), text, NPCS.grandpa.face);
    const hSay = (out, text) => say(out, 0, text, null);
    const lSay = (out, text) => say(out, L(), text, NPCS.lord.face);

    // grandpa's first talk - after the prologue (Prologue.js): the fisherman Janek found the hero on the beach, three days of fever,
    // grandpa reads his daughter's wet letter and goes quiet; then the debt, the field, Borgar and the Lord as before. \N[1] = the
    // name the player chose. (2026-10-12: replaces "No, nareszcie wstałeś!...", every fact of the old talk kept.)
    const pause = (out, frames) => (out.push(C(230, [frames])), out);
    function introList() {
        const o = [];
        gSay(o, "No, nareszcie otworzyłeś oczy. Rybak Janek przyniósł cię z plaży. Trzy dni gorączki, \\N[1]. Trzy dni.");
        hSay(o, "Dziadku...? To naprawdę ty?");
        gSay(o, "A kto inny, Lord Zaleski? Leż, leż. Ściskałeś w garści list. Ani na chwilę nie chciałeś puścić.");
        pause(o, 90);   // (he reads the letter; the fire crackles)
        gSay(o, "...Moja córka. Pisze, że twój ojciec przepadł na wojnie. A ona poszła go szukać. Że przypłynie następnym promem.");
        hSay(o, "Obiecała.");
        gSay(o, "To przypłynie. Twoja matka zawsze była uparta. Po mnie.");
        pause(o, 60);
        gSay(o, "A ja ci tu, wnuku, mam tylko... dług.");
        hSay(o, "Dług?");
        gSay(o, "Jestem winien Lordowi Zaleskiemu - temu z pięknego dworu obok tawerny - " + DEBT + " złotych monet. Termin: dzień " + DEADLINE + ".");
        hSay(o, DEBT + "?! Coś ty kupił, dziadku, krowę ze złota?");
        gSay(o, "Nasiona, narzędzia, dach po burzy... i parę chudych lat. Jak nie oddam w terminie, Lord zabierze moje pole za lasem. A to wszystko, co mamy. Teraz: co my mamy.");
        gSay(o, "Ja już za stary na siekierę, ale ty masz ręce i głowę. Pole jest twoje - stawiaj na nim, co zechcesz. Tylko tam: reszta ziemi w okolicy jest cudza.");
        gSay(o, "Droga: z podwórza na południe, leśną drogą do Polnej, stamtąd na południe na skraj lasu i dalej na zachód.");
        gSay(o, "A pieniądze... Borgar z tawerny „Pod Złotym Kuflem” szuka rąk do pracy, po południu i wieczorem. Z Polnej drogi ścieżką na północ. Dwór Lorda jest tuż obok - tam zanosisz spłatę.");
        hSay(o, "Czyli rano pole, wieczorem kufle. A spać kiedy?");
        gSay(o, "Na starość. Jak ja. I jak się wykurujesz, a nie od razu, gorączko jedna.");
        gSay(o, "Masz tu kapuśniak na drogę - z mojej kapusty. A wisiorek trzymaj przy sobie. Kruk w tej rodzinie... no, to długa historia. Opowiem ci kiedyś. No, zmykaj!");
        script(o, "Story.introDone()");
        return o;
    }
    const HINTS = [
        "Głodny? Na łąkach rosną jagody i grzyby - po deszczu wyłażą nowe. Dzikie ziemniaki i marchew wykopiesz gołymi rękami.",
        "Studni na polu nie ma, a susza trzyma. Łap deszczówkę: garnek, wiadro, beczka - co tylko masz.",
        "Borgar daje jedną zmianę dziennie, od " + SHIFT_FROM + " do " + SHIFT_TO + ". Przyjdź wypoczęty, bo zmęczony kufla nie udźwigniesz.",
        "Nadmiar plonów sprzedasz Borgarowi. Uczciwie płaci... jak na karczmarza.",
        "Twoje posłanie zawsze tu czeka. Pod dachem śpi się lepiej niż pod krzakiem.",
        "Zające łatwiej złapać we wnyki z przynętą niż gołymi rękami. Ja w twoim wieku... no, ja też nie łapałem.",
        "Na polu stawiaj, co chcesz - to nasza ziemia. Gdzie indziej Lord by się wściekł."
    ];
    const WHERE_TO_PAY = () => "Lord przyjmuje za dnia, od " + LORD_HOURS[0] + " do " + LORD_HOURS[1] + ", przed swoim dworem obok tawerny. Nocą zapukaj do drzwi - " + butler() + ", jego kamerdyner, też weźmie pieniądze.";
    // after the field is lost (the user 2026-10-15: sad but warm, no blame): where to sleep, the houses for sale, the buyback
    const LOSS_HINTS = [
        "Dom nie był w zastawie. Twoje posłanie stoi, gdzie stało - śpij tu, ile chcesz.",
        "Sołtys w ratuszu sprzedaje chatę pod lasem na Podgrodziu, z działką obok. Ziemia przy niej jest twoja - tam budujesz, co zechcesz.",
        "Borgar wynajmuje pokoje nad tawerną. Drogo, ale za to pod dachem i blisko roboty.",
        "Lord sprzedaje wszystko, co ma. Nawet ziemię, którą wziął. Kiedyś ją odkupimy - albo i nie. Ziemia to tylko ziemia.",
        "Na noc w lesie wystarczy namiot albo leśne legowisko. Ale pod dachem śpi się lepiej - wiesz, gdzie mnie szukać.",
        "Za Skrajem lasu, na zachód, stoi zagroda Ługów. Lord wziął ją za długi, jak nasze pole, a dom spłonął. Ziemi tam w bród - popytaj o nią na Podgrodziu."
    ];
    function lossFirstList() {
        const o = [], n = carryLeft();
        gSay(o, "Wnuku... Wiem. " + butler() + " był tu o świcie z pismem. Długo czytał, a ja długo nie słuchałem.");
        hSay(o, "Dziadku, ja... Zabrakło niewiele.");
        gSay(o, "Cicho. Nie po to cię matka do mnie przysłała, żebyś się zamartwiał o kawałek ziemi. Jesteś cały i zdrowy - to więcej, niż śmiałem prosić.");
        gSay(o, "Dom nie był w zastawie. Twoje posłanie stoi, gdzie stało, i będzie stało, póki ja tu jestem.");
        if (n > 0) gSay(o, "Tylko leć zabrać z pola, co twoje - " + (n === 1 ? "masz na to już tylko dzisiejszy dzień" : "masz na to " + dni(n)) + ". Narzędzia, co tam w skrzyniach, zwierzaki, psa. Bierz najpierw to, czego nie odbudujesz.");
        gSay(o, "A pole... Lord sprzedaje wszystko, co ma. Nawet ziemię, którą wziął. Może kiedyś je odkupimy. A jak nie - ziemia to tylko ziemia.");
        gSay(o, LOSS_HINTS[1]);
        gSay(o, LOSS_HINTS[5]);
        script(o, "Story.step(\"grandpaLost\")");
        script(o, "Tawerna.call(\"Homes\", \"hear\")");
        return o;
    }
    function grandpaLossList() {
        const s = state(), o = [];
        if (fieldBack()) {
            gSay(o, ["Pole znowu nasze. Czasem chodzę tam rano, tak tylko, popatrzeć.", "Odkupiłeś ziemię od samego Zaleskiego. Twoja matka by nie uwierzyła. Ja też ledwo wierzę."][s.hint++ % 2]);
            gSay(o, HINTS[s.hint % HINTS.length]);
            return o;
        }
        const n = carryLeft();
        if (n > 0) gSay(o, "Z pola zostało ci do zabrania " + (n === 1 ? "już tylko dziś" : dni(n)) + ". Potem straż Lorda nikogo tam nie wpuści.");
        else gSay(o, s.buy.paid > 0 ? "Za pole oddałeś już " + s.buy.paid + " z " + s.buy.price + " G. Nie śpiesz się - Lord nie ma terminu, a ja mam czas." : "Pole... Nie myśl o nim za dużo, wnuku. Lord odsprzeda je za " + s.buy.price + " G, kiedy będzie cię stać. Albo nigdy - też dobrze.");
        gSay(o, LOSS_HINTS[s.hint++ % LOSS_HINTS.length]);
        return o;
    }
    function grandpaList() {
        const s = state(), o = [], h = hour(), n = daysLeft();
        if (s.lost && !s.flags.grandpaLost) return lossFirstList();
        if (fieldBack() && !s.flags.thankedBack) {
            gSay(o, "Wnuku! " + butler() + " przyniósł akt odkupu. Pole za lasem znowu nasze - z tym, co na nim zostało!");
            gSay(o, "Trzy tysiące... Ile ty się nadźwigałeś kufli. Masz, dwa kapuśniaki. Na więcej mnie nie stać, ale serce mam pełne.");
            script(o, "Story.thanksBack()");
            return o;
        }
        if (s.done && !s.flags.thanked) {
            gSay(o, "Wnuku! " + butler() + ", kamerdyner Lorda, przyniósł pokwitowanie. Spłaciłeś wszystko, co do grosza!");
            gSay(o, "Pole zostaje przy nas. Nie wiem, jak ci dziękować... Masz, dwa kapuśniaki. Na więcej mnie nie stać - sam wiesz czemu.");
            script(o, "Story.thanks()");
            return o;
        }
        if (h >= NIGHT[0] || h < NIGHT[1]) {
            if (isOpen() && n <= 1) gSay(o, "Chrrr... Hm? Wnuku, czemu nie jesteś u Lorda?! Brakuje jeszcze " + left() + " G, a o świcie mija termin. " + butler() + " przyjmuje pieniądze i nocą - leć!");
            else if (fieldLost() && !fieldLocked() && carryLeft() <= 1) gSay(o, "Chrrr... Hm? Wnuku... O świcie straż Lorda zamyka pole. Zabrałeś już, co twoje?");
            else gSay(o, "Chrrr... Hm? A, to ty. Idź spać, jutro też jest dzień.");
            return o;
        }
        if (s.lost) return grandpaLossList();
        if (s.done) {
            gSay(o, ["Pole nasze, dług spłacony... a ja dalej nie mogę w to uwierzyć.", "Lord podobno raczył cię bajdami o starej twierdzy. On tak zawsze - nie słuchaj go za bardzo."][s.hint++ % 2]);
            gSay(o, HINTS[s.hint % HINTS.length]);
            return o;
        }
        let status;
        if (n <= 1) status = (n === 1 ? "Dziś mija termin!" : "Termin mija o świcie!") + " Brakuje jeszcze " + left() + " G - leć do Lorda z tym, co masz.";
        else {
            // praised only for what is paid: on pace means at least the share of the days gone by
            const pace = s.paid > 0 && s.paid >= s.debt * Math.max(0, day() - 1) / s.deadline, early = n > s.deadline * 5 / 6;
            status = s.paid > 0 ? "Lordowi oddałeś już " + s.paid + " z " + s.debt + " G. Do terminu " + zostalo(n) + " " + dni(n) + ". " +
                    (pace ? "Idzie ci lepiej niż mnie kiedykolwiek." : "Lord nie będzie czekał... ale ty dasz radę. Masz to po mnie.")
                : "Lordowi nie oddaliśmy jeszcze ani grosza, a do terminu " + zostalo(n) + " " + dni(n) + ". " +
                    (early ? "Czasu jeszcze sporo, ale nie zwlekaj." : "Lord nie będzie czekał... ale ty dasz radę. Masz to po mnie.");
        }
        gSay(o, status);
        let tip;
        if (n <= 5) tip = WHERE_TO_PAY();   // (the last days: where the money goes comes first)
        else if (!s.flags.field) tip = "Pole jest za lasem: z podwórza na południe, leśną drogą do Polnej, potem na południe na skraj lasu i na zachód.";
        else if (!s.flags.hired) tip = "Borgar szuka ludzi do pracy. Od " + SHIFT_FROM + " do " + SHIFT_TO + " zajrzyj do „Złotego Kufla”: z Polnej drogi ścieżką na północ.";
        else tip = HINTS[s.hint++ % HINTS.length];
        gSay(o, tip);
        return o;
    }
    // the Lord: the first meeting, then what is paid and a choice of how much
    // buy: the buyback of the lost field (the same ways to pay as the debt)
    function payOptions(who, buy) {
        const gold = $gameParty.gold(), need = buy ? buyLeft() : left(), opts = [], what = buy ? "buy" : "pay";
        // (a sum equal to all he has is left to "all you have")
        for (const n of [100, 500]) if (gold > n && need > n) opts.push({ label: "Oddaj " + n + " G", js: "Story.pick(this, \"" + who + "\", \"" + what + "\", " + n + ")" });
        const all = Math.min(gold, need);
        if (all > 0) opts.push({ label: all >= need ? (buy ? "Odkup pole (" + need + " G)" : "Spłać cały dług (" + need + " G)") : "Oddaj wszystko, co masz (" + all + " G)", js: "Story.pick(this, \"" + who + "\", \"" + what + "\", " + all + ")" });
        opts.push({ label: "Odejdź", js: [] });
        return opts;
    }
    // first: the Lord has just named the sum himself - no account read out, only the question
    function payList(who, spk, face, first, buy) {
        const o = [], status = first ? "" : statusLine() + " ";
        if ($gameParty.gold() <= 0) {
            say(o, spk, status + (who === "lord" ? (buy ? "Pusta sakiewka? Pole poczeka - ja nie mam terminu." : "Pusta sakiewka? Wróć, gdy coś zarobisz. Podobno Borgar z tawerny szuka ludzi.")
                : "Bez pieniędzy? Jaśnie pan przyjmuje tylko monety. " + butlerBye()), face);
            return o;
        }
        say(o, spk, status + (buy ? "Ile dziś dajesz za pole?" : first ? "Ile dziś przynosisz?" : "Ile dziś oddajesz?"), face);
        choose(o, payOptions(who, buy));
        return o;
    }
    // ---- the field lost: the Lord's offer to sell it back (the first time with the hook of the old fortress, if nobody told it yet)
    const HOOK = [
        "Mój dwór postawiono z kamieni dawnej twierdzy - Kruczych Skał. Najstarsze z nich wciąż leżą pod tawerną Borgara.",
        "Mój ojciec mawiał, że pod Kruczymi Skałami są drzwi, których nikt nie powinien otwierać. Gdybyś kiedyś znalazł zejście pod tawerną... przyjdź najpierw do mnie. To może być warte więcej niż pole."
    ];
    function lordLossList() {
        const s = state(), o = [], lo = lostState();
        if (fieldBack()) { lSay(o, "Pole znów wasze, akt podpisany. Pozdrów Stacha. A gdybyś coś znalazł pod tawerną Borgara... najpierw przyjdź z tym do mnie."); return o; }
        if (!s.flags.lordLost) {
            lSay(o, (s.flags.lordMet ? "A, wnuk Stacha. " : "Ty pewnie jesteś wnukiem Stacha. Lord Leopold Zaleski. ") + "Przykra sprawa z tym polem - ale akt to akt, a termin to termin.");
            lSay(o, "Nie jestem jednak zachłanny. Odsprzedam je: " + s.buy.price + " złotych monet, w ratach, jak dług. Bez terminu - ziemia nie ucieknie, a mnie się nie śpieszy z oraniem.");
            if (!lo.hook) { lSay(o, "Jeszcze jedno, młodzieńcze. " + HOOK[0]); lSay(o, HOOK[1]); script(o, "Story.hookTold()"); }
            else lSay(o, "I pamiętaj, co ci przekazał " + butler() + " o drzwiach pod Kruczymi Skałami. Nie żartowałem.");
            script(o, "Story.step(\"lordLost\")");
            if (!s.flags.lordMet) script(o, "Story.step(\"lordMet\")");
            return o.concat(payList("lord", L(), NPCS.lord.face, true, true));
        }
        return o.concat(payList("lord", L(), NPCS.lord.face, false, true));
    }
    // the last coin of the buyback: the field goes back to grandpa with what is left on it
    function buyFinalList(spk, face, byButler) {
        const o = [], s = state();
        if (byButler) {
            say(o, spk, "Całe " + s.buy.price + " złotych monet za pole. Zapisuję... i podpisuję w imieniu jaśnie pana - kazał, gdyby do tego doszło.", face);
            say(o, spk, "Pole wraca do Stacha z tym, co na nim zostało. Akt odkupu zaniosę mu osobiście, a strażnika odwołamy jeszcze dziś.", face);
        } else {
            say(o, spk, "Trzy tysiące, co do grosza. Słowo się rzekło: pole wraca do Stacha - z tym, co na nim zostało.", face);
            say(o, spk, butler() + " zaniesie mu akt odkupu, a strażnika odwołam jeszcze dziś. Ród Stacha mnie zaskakuje, młodzieńcze. Coraz częściej.", face);
        }
        script(o, "Story.fieldReturned()");
        return o;
    }
    // the butler's goodbye by the hour (he also answers the door at dawn, before the Lord comes out)
    const butlerBye = () => (hour() >= LORD_HOURS[1] || hour() < 4 ? "Dobranoc." : hour() < LORD_HOURS[0] ? "Jaśnie pan przyjmuje od ósmej." : "Do widzenia.");
    function lordList(fromDoor) {
        const s = state(), o = [];
        if (fromDoor) lSay(o, "Nie pukaj, młodzieńcze - stoję tuż obok!");
        if (s.lost) return o.concat(lordLossList());
        if (s.done) { lSay(o, "Pozdrów ode mnie Stacha. A gdybyś coś znalazł pod tawerną Borgara... najpierw przyjdź z tym do mnie."); return o; }
        if (s.paid >= s.debt) return o.concat(finalList(L(), NPCS.lord.face, false));   // (paid in full some other way: the end of the chapter now)
        const first = !s.flags.lordMet;
        if (first) {
            lSay(o, "Hola, hola! Kim jesteś i czemu depczesz mój dziedziniec?");
            hSay(o, "Jestem wnukiem Stacha. Przyszedłem w sprawie długu.");
            lSay(o, "Ach, Stach! Lord Leopold Zaleski, do usług... to znaczy raczej ty do moich. " + s.debt + " złotych monet, płatne do dnia " + s.deadline + ".");
            lSay(o, "Przynoś, ile masz. " + butler() + ", mój kamerdyner, zapisze każdy grosz. " + butler() + " zapisuje nawet to, co mówię przez sen.");
            script(o, "Story.step(\"lordMet\")");
        } else if (daysLeft() <= 5) lSay(o, "Termin tuż-tuż, młodzieńcze. " + butler() + " już ostrzy pióro.");
        return o.concat(payList("lord", L(), NPCS.lord.face, first));
    }
    function doorList(ev) {
        const s = state(), o = [], id = ev.eventId();
        if (npc("lord") && lordHere()) return lordList(true);
        hSay(o, "*puk, puk*");
        say(o, id, "Kto tam o tej porze? A, wnuk Stacha. Jaśnie pan " + (hour() < 12 ? "jeszcze" : "już") + " śpi.", null);
        if (s.lost) {
            if (fieldBack()) { say(o, id, "Pole odkupione, akt podpisany. " + butlerBye(), null); return o; }
            say(o, id, "Jeśli przyniosłeś pieniądze za pole, przyjmę je i zapiszę w księdze. Jaśnie pan przyjmuje gości od " + LORD_HOURS[0] + " do " + LORD_HOURS[1] + ".", null);
            return o.concat(payList("door", id, null, false, true));
        }
        if (s.done) { say(o, id, "Dług spłacony, młodzieńcze. " + butlerBye(), null); return o; }
        if (s.paid >= s.debt) return o.concat(finalList(id, null, true));
        say(o, id, "Jeśli przyniosłeś pieniądze, przyjmę je i zapiszę w księdze. " + (isOpen() && daysLeft() <= 1 ? "Termin mija o świcie - do tego czasu przyjmę każdą monetę."
            : "Jaśnie pan przyjmuje gości od " + LORD_HOURS[0] + " do " + LORD_HOURS[1] + "."), null);
        return o.concat(payList("door", id, null));
    }
    // Borgar: the first talk hires the hero; later a shift in the evening, selling, and his own talk ("Pogadaj")
    const bSay = (out, ev, text) => say(out, ev.eventId(), text, BORGAR_FACE);
    function shopCommands(ev) {
        const list = ownList(ev) || [], i = list.findIndex(c => c.code === 302);
        if (i < 0) return null;
        const out = [Object.assign({}, list[i], { indent: 0 })];
        for (let k = i + 1; k < list.length && list[k].code === 605; k++) out.push(Object.assign({}, list[k], { indent: 0 }));
        return out;
    }
    const inShiftHours = () => hour() >= SHIFT_FROM && hour() < SHIFT_TO;
    function borgarList(ev) {
        const s = state(), o = [];
        if (!s.flags.hired) {
            bSay(o, ev, "Hej, ty! Wyglądasz, jakbyś szukał roboty. Albo jedzenia. Albo jednego i drugiego.");
            hSay(o, "Dziadek Stach mówił, że potrzebujesz rąk do pracy.");
            bSay(o, ev, "Stach! Ten stary zrzęda jeszcze żyje? Ha! Winien mi za trzy kufle od zeszłej zimy... Nieważne.");
            bSay(o, ev, "Po południu i wieczorem mam urwanie głowy. Przychodź między " + SHIFT_FROM + " a " + SHIFT_TO + ": sprzątanie, beczka, kuchnia, sala. Płacę od roboty, a goście dorzucą napiwki.");
            bSay(o, ev, "Jedna zmiana dziennie - więcej nie wytrzymasz, uwierz mi. No, witaj w „Złotym Kuflu”!");
            script(o, "Story.step(\"hired\")");
            script(o, "Story.pick(this, \"borgar\", \"menu\")");
            return o;
        }
        return borgarMenu(ev, true);
    }
    function borgarMenu(ev, greet) {
        const s = state(), o = [], TS = T.api("TavernShift"), opts = [];
        const why = TS && TS.canStart ? TS.canStart() : null, today = s.shiftDay === day();
        let line;
        if (!TS) line = "Dziś nie ma roboty. Zajrzyj innym razem.";
        else if (!inShiftHours()) line = hour() < SHIFT_FROM ? "Zmiany są po południu i wieczorem, od " + SHIFT_FROM + " do " + SHIFT_TO + ". Teraz możesz najwyżej coś sprzedać."
            : "Za późno na zmianę - goście już się rozchodzą. Przyjdź jutro od " + SHIFT_FROM + ".";
        else if (today) line = "Na dziś wystarczy. Wracaj jutro od " + SHIFT_FROM + ".";
        else if (why) line = "Ledwo stoisz na nogach. Odpocznij, bo mi kufle potłuczesz.";
        else if (isOpen() && daysLeft() === 1) {   // the deadline day: a late shift ends after midnight - the butler still takes the money till dawn
            line = "Dziś mija termin u Lorda, a brakuje jeszcze " + left() + " G! " + (hour() + SHIFT_HOURS >= 24 ? "Zmiana skończy się po północy - potem" : "Po zmianie") +
                " prosto do dworu, kamerdyner przyjmuje pieniądze do świtu. Bierzesz?";
            opts.push({ label: "Weź zmianę", js: ["Story.pick(this, \"borgar\", \"shift\")", "Story.pick(this, \"borgar\", \"after\")"] });
        } else {
            line = greet ? "Sala sama się nie obsłuży. Bierzesz zmianę?" : "To jak, bierzesz zmianę?";
            opts.push({ label: "Weź zmianę", js: ["Story.pick(this, \"borgar\", \"shift\")", "Story.pick(this, \"borgar\", \"after\")"] });
        }
        if (TS && !opts.length) line += deadlineWarn();
        if (shopCommands(ev)) opts.push({ label: "Sprzedaj towar", js: "Story.pick(this, \"borgar\", \"shop\")" });
        opts.push(...(T.call("TavernLife", "borgarOptions", ev) || []));   // "Zjedz coś", "Wynajmij pokój" (TavernLife.js)
        opts.push({ label: "Pogadaj", js: "Story.pick(this, \"borgar\", \"chat\")" });
        opts.push({ label: "Nie teraz", js: [] });
        bSay(o, ev, line);
        choose(o, opts);
        return o;
    }
    function shiftIntro() {
        if (buyOpen()) return "Fartuch na grzbiet i do roboty! Na odkup pola dziadka brakuje jeszcze " + buyLeft() + " G - każda zmiana to krok bliżej.";
        if (fieldBack()) return "Fartuch na grzbiet! Pole odkupione, więc dziś pracujesz na własną kieszeń.";
        return isOpen() ? "Fartuch na grzbiet i do roboty! Do spłaty długu dziadka brakuje jeszcze " + left() + " G - każda zmiana to krok bliżej."
            : "Fartuch na grzbiet! Dług dziadka spłacony, więc dziś pracujesz na własną kieszeń.";
    }
    function afterShiftList(ev) {
        const s = state(), r = s.lastShift, o = [];
        s.lastShift = null;
        if (!r) return o;
        let t;
        if (r.aborted) t = "Uciekłeś w połowie zmiany? Trudno. Jutro spróbujemy jeszcze raz.";
        else if (r.grade >= 4) t = "Tak się robi! Goście zachwyceni, a ja spokojny. Zarobiłeś dziś " + r.total + " G.";
        else if (r.grade === 3) t = "Nieźle! Jeszcze trochę wprawy i będziesz lepszy ode mnie. Zarobiłeś dziś " + r.total + " G.";
        else t = "Bywało lepiej... Ale przynajmniej kufle całe. Prawie. Masz " + r.total + " G.";
        const warn = deadlineWarn();
        if (warn) t += warn;
        else if (isOpen()) t += " Lordowi wisicie jeszcze " + left() + " G - zanieś mu, zanim przepijesz.";
        else if (buyOpen() && !r.aborted) t += " Odkładaj na pole - Lord sprzedaje, ale nie rozdaje.";
        bSay(o, ev, t);
        return o;
    }
    // Borgar on the deadline day and the night after it: what is missing and that the butler takes it till dawn ("" otherwise)
    function deadlineWarn() {
        if (!isOpen() || daysLeft() > 1) return "";
        return daysLeft() === 1 ? " Dziś mija termin u Lorda, a brakuje jeszcze " + left() + " G - kamerdyner przyjmuje pieniądze do świtu."
            : " Do spłaty brakuje jeszcze " + left() + " G, a o świcie mija termin u Lorda! Biegnij do dworu - kamerdyner otworzy.";
    }
    // the end of chapter 1: the Lord's words - the old fortress as a REAL clue (user, 2026-09-27), the way into chapter 2: the goal
    // "Drzwi pod Kruczymi Skałami" (the tavern's cellar). He wants to hear first what is found - why is left open (docs/STORY.md)
    function finalList(spk, face, byButler) {
        const o = [], s = state(), sum = s.debt, hired = !!s.flags.hired;
        if (byButler) {
            say(o, spk, "Całe " + sum + " złotych monet, co do grosza! Jaśnie pan będzie zachwycony... na swój sposób.", face);
            say(o, spk, "Kazał przekazać, gdyby do tego doszło: pole zostaje przy was. Pokwitowanie zaniosę dziadkowi osobiście.", face);
            say(o, spk, hired ? "Skoro pracujesz u Borgara, powinieneś wiedzieć: dwór postawiono z kamieni dawnej twierdzy, Kruczych Skał. Najstarsze wciąż leżą pod jego tawerną."
                : "Znasz tawernę Borgara? Dwór postawiono z kamieni dawnej twierdzy, Kruczych Skał. Najstarsze wciąż leżą pod tawerną.", face);
            say(o, spk, "Jaśnie pan mawia, że pod Kruczymi Skałami są drzwi, których nikt nie powinien otwierać. I proszę mi wierzyć - wcale się przy tym nie śmieje.", face);
            say(o, spk, "Kazał też przekazać: gdybyś kiedyś znalazł zejście pod tawerną, przyjdź z tym najpierw do niego. Dobranoc... to znaczy, do widzenia.", face);
        } else {
            say(o, spk, "Całe " + sum + " złotych monet, co do grosza. Przyznam, nie wierzyłem, że ktoś z rodu Stacha odda choćby połowę.", face);
            say(o, spk, "Pole zostaje przy was. " + butler() + " zaniesie dziadkowi pokwitowanie - niech je sobie oprawi w ramkę.", face);
            say(o, spk, (hired ? "Jeszcze jedno, młodzieńcze. Pracujesz u Borgara, prawda? " : "Jeszcze jedno, młodzieńcze. Znasz tawernę Borgara? ") +
                "Mój dwór postawiono z kamieni dawnej twierdzy - Kruczych Skał. Najstarsze z nich wciąż leżą pod jego tawerną.", face);
            say(o, spk, "Mój ojciec mawiał, że pod Kruczymi Skałami są drzwi, których nikt nie powinien otwierać. Długo miałem to za bajdy dla dzieci.", face);
            say(o, spk, "Ale ojciec nie żartował, kiedy o tym mówił. I ja też nie żartuję. Gdybyś kiedyś znalazł zejście pod tawerną... przyjdź najpierw do mnie. Bywaj.", face);
        }
        script(o, "Story.chapterDone()");
        return o;
    }
    function endingList() {
        const o = [];
        hSay(o, (hour() < 9 ? "Świta... " : "Już dzień... ") + "Termin minął, a dług dziadka wciąż niespłacony.");
        o.push(C(221, []));
        script(o, "Story.showEnding()");
        return o;
    }

    // ------------------------------------------------------------------
    // The field lost (the user 2026-10-15): the Lord's men measure it and put up the sign - a short scene on the field (Homes.js puts
    // the people there: event ids CAST, hidden till the scene shows them), the three days of carrying things off, the field shut
    // ------------------------------------------------------------------
    const CAST = { butler: 700, measurer: 701, watch: 702 };
    // a move route of the scene (skippable: a blocked step never stops the scene); codes: numbers or { code, parameters }
    function route(out, id, codes, wait) {
        const list = codes.map(c => (typeof c === "number" ? { code: c, indent: null } : Object.assign({ indent: null }, c))).concat([{ code: 0 }]);
        out.push(C(205, [id, { list, repeat: false, skippable: true, wait: !!wait }]));
        return out;
    }
    const waitF = (out, n) => (out.push(C(230, [n])), out);
    const se = (out, name, vol, pitch) => (out.push(C(250, [{ name, volume: vol || 80, pitch: pitch || 100, pan: 0 }])), out);
    const balloon = (out, who, id) => (out.push(C(213, [who, id, false])), out);
    const TOWARD = 10, LEFT = 2, RIGHT = 3, FACE_DOWN = 16, FACE_LEFT = 17, FACE_RIGHT = 18;
    function measureList() {
        const o = [], s = state(), B = CAST.butler, M = CAST.measurer, W = CAST.watch, lo = lostState();
        script(o, "Tawerna.call(\"Homes\", \"castShow\")");
        waitF(o, 24);
        route(o, M, [TOWARD]);
        route(o, W, [TOWARD]);
        route(o, B, [TOWARD, TOWARD], true);
        balloon(o, -1, 1);
        waitF(o, 30);
        say(o, B, "Dzień dobry, młodzieńcze. Proszę się nie niepokoić - przychodzimy z pismem, nie z widłami.", null);
        hSay(o, "Z pismem? O tej porze?");
        say(o, B, "Termin minął o świcie, a dług Stacha wciąż niespłacony - zabrakło " + lo.missing + " G. Zgodnie z aktem pole za lasem należy od dziś do jaśnie pana Zaleskiego.", null);
        route(o, M, [LEFT, LEFT, LEFT, FACE_DOWN]);
        se(o, "Equip1", 60, 90);
        waitF(o, 40);
        say(o, M, "Czterdzieści kroków na trzydzieści. Zgadza się z aktem.", null);
        say(o, B, "Jaśnie pan nie jest potworem. Masz " + dni(CARRY_DAYS) + ": zbierz plony, opróżnij skrzynie, rozbierz, co postawiłeś, zabierz zwierzęta i psa. Co zostanie po " + (CARRY_DAYS === 3 ? "trzecim" : "ostatnim") + " świcie, zostaje przy polu.", null);
        route(o, W, [RIGHT, RIGHT, FACE_RIGHT], true);
        se(o, "Hammer", 70, 95); waitF(o, 16); se(o, "Hammer", 70, 105); waitF(o, 16);
        script(o, "Tawerna.call(\"Homes\", \"signShow\")");
        se(o, "Hammer", 75, 90); waitF(o, 20);
        say(o, W, "Znak stoi. Własność Lorda Zaleskiego.", null);
        say(o, B, "I jeszcze jedno. Jaśnie pan pole odsprzeda - " + s.buy.price + " złotych monet, w ratach, jak dług. Bez terminu. Wystarczy przyjść do dworu.", null);
        say(o, B, "Kazał też przekazać rzecz dziwniejszą. Dwór postawiono z kamieni dawnej twierdzy, Kruczych Skał - najstarsze leżą podobno pod tawerną Borgara.", null);
        say(o, B, "Pod Kruczymi Skałami są drzwi, których nikt nie powinien otwierać. Gdybyś kiedyś znalazł zejście pod tawerną, przyjdź z tym najpierw do niego. Jaśnie pan mówi, że to może być warte więcej niż pole... Ja tylko przekazuję.", null);
        hSay(o, (CARRY_DAYS === 3 ? "Trzy dni" : dni(CARRY_DAYS)) + "...");
        say(o, B, "Strażnik zostanie przy znaku, żeby nikt nie wynosił więcej, niż swoje. Pozdrów Stacha, młodzieńcze.", null);
        script(o, "Story.measured()");
        route(o, B, [RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT]);
        route(o, M, [RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT], true);
        script(o, "Tawerna.call(\"Homes\", \"castLeave\")");
        return o;
    }
    // the guard by the sign (the carrying-out days)
    function watchList(ev) {
        const o = [], id = ev.eventId(), n = carryLeft();
        if (fieldLocked() || !fieldLost()) { say(o, id, "Rozkaz to rozkaz, młodzieńcze.", null); return o; }
        say(o, id, n > 1 ? "Masz jeszcze " + dni(n) + ". Bierz, co twoje - ja tylko patrzę, żeby nikt nie zabrał więcej."
            : n === 1 ? "Dziś ostatni dzień. O świcie mam rozkaz nikogo tu nie wpuszczać." : "O świcie zamykamy pole. Pośpiesz się, młodzieńcze.", null);
        return o;
    }
    // the dawn that shuts the field, with the hero on it (or in his hut on it): the guard sees him out to the forest's edge
    function escortList(inHut) {
        const o = [];
        if (inHut) {
            hSay(o, "*Ktoś wali w drzwi chatki.*");
            say(o, -1, "Strażnik (zza drzwi): Minęły " + dni(CARRY_DAYS) + ", młodzieńcze! Pole należy teraz do jaśnie pana - wychodź, odprowadzę cię.", null);
        } else if ($gameMap.event(CAST.watch) && !$gameMap.event(CAST.watch).isTransparent()) {
            say(o, CAST.watch, "Minęły " + dni(CARRY_DAYS) + ", młodzieńcze. Pole należy teraz do jaśnie pana. Proszę za mną - bez awantur.", null);
        } else say(o, -1, "Strażnik Lorda: Minęły " + dni(CARRY_DAYS) + "! Pole należy teraz do jaśnie pana - proszę je opuścić.", null);
        hSay(o, "...Do widzenia, polu dziadka.");
        o.push(C(201, [0, 23, 1, 13, 6, 0]));   // (Skraj lasu, where the way from the field comes out)
        waitF(o, 20);
        script(o, "Tawerna.popup(\"Pole należy teraz do Lorda.\", { color: \"#ff9f8f\" })");
        return o;
    }
    // the words the Lord sends when the hero is not on the field at dawn (and the journal's note on the loss)
    function lostNoteText() {
        const s = state(), lo = lostState();
        return "Dzień " + lo.day + ": termin minął o świcie, a dług dziadka nie został spłacony (zabrakło " + lo.missing + " G). Pole za lasem należy teraz do Lorda Zaleskiego.\n" +
            "Mam " + dni(CARRY_DAYS) + " (do świtu dnia " + (lo.day + CARRY_DAYS) + "), żeby zabrać z pola, co moje: plony, skrzynie, budynki (rozbiórka oddaje część materiałów), zwierzęta z zagród i psa. Potem straż nikogo tam nie wpuści, a to, co zostanie, należy do Lorda.\n" +
            "Lord odsprzeda pole za " + s.buy.price + " G - w ratach, bez terminu (dwór obok tawerny: za dnia Lord, nocą kamerdyner). Po spłacie pole wróci z tym, co na nim zostało.\n" +
            "Dom dziadka nie był w zastawie - posłanie czeka. Pokój wynajmie Borgar, a sołtys w ratuszu (8-16) sprzedaje Chatę pod lasem na Podgrodziu (600 G) - z działką, na której wolno budować. Za Skrajem lasu, na zachód, stoi spalona zagroda Ługów: ziemia też zabrana za długi, odłogiem od lat - może da się ją odkupić i odbudować dom.\n" +
            "Słowa Lorda: dwór zbudowano z kamieni dawnej twierdzy - Kruczych Skał - a najstarsze leżą pod tawerną Borgara. Pod Kruczymi Skałami są podobno drzwi, których nikt nie powinien otwierać. Lord chce, żebym przyszedł najpierw do niego, jeśli coś znajdę. Ciekawe, dlaczego...";
    }
    function lostLetterText() {
        const s = state(), lo = lostState();
        return "Termin minął o świcie, a dług Stacha pozostał niespłacony (zabrakło " + lo.missing + " G). Zgodnie z aktem pole za lasem przechodzi na własność dworu - moi ludzie zmierzą je i postawią znak. " +
            "Daję ci " + dni(CARRY_DAYS) + " na zabranie z niego twoich rzeczy. Pole odsprzedam: " + s.buy.price + " G, w ratach, bez terminu. " +
            "Gdybyś szukał dachu nad głową: sołtys sprzedaje chatę pod lasem na Podgrodziu. A jeśli wolisz popiół - zagroda Ługów za Skrajem lasu też jest moja.\n" +
            "PS. Pod Kruczymi Skałami są drzwi, których nikt nie powinien otwierać. Gdybyś znalazł zejście pod tawerną Borgara, przyjdź najpierw do mnie. Leopold Zaleski.";
    }

    // ------------------------------------------------------------------
    // What the talks do
    // ------------------------------------------------------------------
    function talk(interp, role) {
        const ev = $gameMap.event(interp.eventId());
        if (!ev) return;
        if (!active()) {   // (the story is gone: the character's own commands)
            if (role === "borgar" || role === "door") run(interp, (_Game_Event_list.call(ev) || []).slice());
            return;
        }
        if (role === "grandpa" && state().intro !== 2) { state().intro = 1; run(interp, introList()); }   // (talked to before his talk began)
        else if (role === "grandpa") run(interp, grandpaList());
        else if (role === "lord") run(interp, lordList(false));
        else if (role === "door") run(interp, doorList(ev));
        else if (role === "borgar") run(interp, borgarList(ev));
        else if (role === "watch") run(interp, watchList(ev));
    }
    function pick(interp, role, what, arg) {
        const ev = $gameMap.event(interp.eventId()), s = state();
        if (!ev || !s) return;
        if (what === "buy") {
            const n = Math.min(Number(arg) || 0, $gameParty.gold(), buyLeft());
            const spk = role === "lord" ? L() : ev.eventId(), face = role === "lord" ? NPCS.lord.face : null, o = [];
            if (n <= 0) return;
            payBuy(n);
            if (s.buy.paid >= s.buy.price) return run(interp, buyFinalList(spk, face, role !== "lord"));
            say(o, spk, (role === "lord" ? butler() + ", zapisz: " : "Zapisuję: ") + n + " G za pole od wnuka Stacha. Brakuje jeszcze " + buyLeft() + " G.", face);
            return run(interp, o);
        }
        if (what === "pay") {
            const n = Math.min(Number(arg) || 0, $gameParty.gold(), left());
            const spk = role === "lord" ? L() : ev.eventId(), face = role === "lord" ? NPCS.lord.face : null, o = [];
            if (n <= 0) return;
            pay(n);
            if (s.paid >= s.debt) return run(interp, finalList(spk, face, role !== "lord"));
            say(o, spk, (role === "lord" ? butler() + ", zapisz: " : "Zapisuję: ") + n + " G od wnuka Stacha. Brakuje jeszcze " + left() + " G." +
                (daysLeft() <= 0 ? " O świcie termin mija." : daysLeft() <= 5 ? " Pospiesz się - termin tuż-tuż." : ""), face);
            return run(interp, o);
        }
        if (role !== "borgar") return;
        if (what === "menu") { if (inShiftHours()) run(interp, borgarMenu(ev, false)); return; }
        if (what === "chat") return run(interp, chatList(ev));
        if (what === "shop") return run(interp, shopCommands(ev));
        if (what === "shift") {
            const TS = T.api("TavernShift");
            if (!TS) return;
            s.lastShift = null;
            if (TS.start({ intro: shiftIntro(), onEnd: onShiftEnd })) s.shiftDay = day();
            return;
        }
        if (what === "after") return run(interp, afterShiftList(ev));
    }
    // "Pogadaj" for his own man: no greeting to a stranger - straight to his questions (his loop), without his "Sprzedaj towar"
    // (the story's menu has it)
    function chatList(ev) {
        const list = ownList(ev) || [], i = list.findIndex(c => c.code === 112);
        if (i < 0) return list.slice();
        const o = [];
        bSay(o, ev, "Pytaj, byle szybko - goście czekają.");
        return o.concat(dropChoice(list.slice(i).map(c => Object.assign({}, c, { indent: c.indent - list[i].indent })), "Sprzedaj towar"));
    }
    // a copy of the commands without one option of a choice (its branch goes, the later ones move up)
    function dropChoice(list, label) {
        const q = list.findIndex(c => c.code === 102 && c.parameters[0].includes(label));
        if (q < 0) return list;
        const ind = list[q].indent, k = list[q].parameters[0].indexOf(label), p = list[q].parameters.slice();
        const shift = v => (v > k ? v - 1 : v === k ? -1 : v);
        p[0] = p[0].filter((_, j) => j !== k);
        if (p[1] >= 0) p[1] = shift(p[1]);
        if (p[2] >= 0) p[2] = Math.max(0, shift(p[2]));
        const out = list.slice(0, q).concat([Object.assign({}, list[q], { parameters: p })]);
        let skip = false;
        for (let j = q + 1; j < list.length; j++) {
            const c = list[j];
            if (c.indent === ind && (c.code === 402 || c.code === 403 || c.code === 404)) skip = c.code === 402 && c.parameters[0] === k;
            if (skip) continue;
            out.push(c.indent === ind && c.code === 402 && c.parameters[0] > k ? Object.assign({}, c, { parameters: [c.parameters[0] - 1, c.parameters[1]] }) : c);
            if (c.indent === ind && c.code === 404) { out.push(...list.slice(j + 1)); break; }
        }
        return out;
    }
    // (kept only in TavernShift's memory while the shift runs - nothing of it is saved)
    function onShiftEnd(res) {
        const s = state();
        if (!s || !res) return;
        s.lastShift = { total: res.total || 0, grade: res.grade || 0, aborted: !!res.aborted, day: day() };
    }
    function pay(n) {
        const s = state();
        n = Math.min(Math.floor(n), $gameParty.gold(), left());
        if (!s || n <= 0) return 0;
        $gameParty.loseGold(n);
        s.paid += n;
        s.payments.push({ day: day(), n });
        T.audio.se("Coin", { volume: 80, pitch: 100 });
        T.emit("debtPayment", { amount: n, paid: s.paid, debt: s.debt, day: day() });
        if (s.paid >= s.debt) T.emit("debtPaid", { total: s.paid, debt: s.debt, day: day() });   // (a payment never goes over what is left)
        return n;
    }
    // for other plugins and bots: a payment outside the talks - the whole debt ends chapter 1 at once (in a talk the Lord's last
    // words end it); once the field is lost it goes onto the buyback (the last coin gives the field back at once)
    function payOutside(n) {
        const s = state();
        if (s && s.lost) {
            const got = payBuy(n);
            if (got > 0 && s.buy.paid >= s.buy.price && !s.buy.done) fieldReturned();
            return got;
        }
        const got = pay(n);
        if (got > 0 && s && s.paid >= s.debt && !s.done) chapterDone();
        return got;
    }
    // a payment towards the lost field (the buyback)
    function payBuy(n) {
        const s = state();
        if (!s || !s.buy || s.buy.done) return 0;
        n = Math.min(Math.floor(n), $gameParty.gold(), buyLeft());
        if (n <= 0) return 0;
        $gameParty.loseGold(n);
        s.buy.paid += n;
        s.buy.payments.push({ day: day(), n });
        T.audio.se("Coin", { volume: 80, pitch: 100 });
        T.emit("buybackPayment", { amount: n, paid: s.buy.paid, price: s.buy.price, day: day() });
        return n;
    }
    // the journal's goal ticked off without its "Cel wykonany" (the debt's goal when the field is lost: nothing to praise)
    function closeGoal(id) {
        const J = T.api("Journal"), d = J && J.data ? J.data() : null;
        if (!d || !d.done || d.done[id] !== undefined) return;
        d.done[id] = day();
        if (d.pinned === id) d.pinned = null;
    }
    // dawn after the deadline, the debt unpaid: the field goes to the Lord (the game goes on)
    function loseField() {
        const s = state();
        s.lost = { day: day(), scene: 0, locked: 0, hook: 0, noted: 0, missing: left() };
        s.buy = { price: BUYBACK, paid: 0, payments: [], done: 0 };
        mark("chapterLost");
        closeGoal("story_debt");
        if (!s.flags.field) closeGoal("story_field");
        syncGoals();
        T.emit("fieldLost", { day: day(), missing: s.lost.missing });
        tell("chapterLost");
        T.popup("Rozdział 1 zakończony: pole przepadło", { top: true, color: "#ffb4a0", sub: dni(CARRY_DAYS) + " na wyniesienie dobytku  ·  odkup: " + BUYBACK + " G" });
        if ($gameMap.mapId() === MAP.field && T.call("Homes", "castReady")) { startMeasure(); return; }   // (the Lord's men come over the field now)
        // elsewhere: the Lord's letter (the scene comes when he walks onto the field in the next days)
        s.lost.hook = 1;
        s.lost.noted = day();
        T.popup("List od Lorda Zaleskiego", { top: true, color: U().accent, sub: "Pole przechodzi na dwór. (Dziennik: Notatki)" });
        T.call("Journal", "addNote", "List od Lorda (dzień " + day() + ")", lostLetterText());
        T.call("Journal", "addNote", "Pole przepadło", lostNoteText());
        T.call("Journal", "evaluateGoals");
    }
    function startMeasure() {
        const lo = lostState();
        if (!lo || !$gameMap || $gameMap.mapId() !== MAP.field) return false;
        lo.scene = -1;   // (running: not again while it plays; measured() sets the day)
        $gameMap._interpreter.setup(end(measureList()), 0);
        return true;
    }
    // the end of the scene on the field: the hook told, the note (once), the step
    function measured() {
        const lo = lostState();
        if (!lo) return;
        lo.scene = day();
        lo.hook = 1;
        step("measured");
        if (!lo.noted) {
            lo.noted = day();
            T.call("Journal", "addNote", "Pole przepadło", lostNoteText());
        }
        T.call("Journal", "evaluateGoals");
    }
    const hookTold = () => { const lo = lostState(); if (lo) lo.hook = 1; };
    // dawn of the day after the carrying out: the field shut (Homes.js: the hut's furniture kept with the field, the dog comes along,
    // the guards at the ways in); with the hero on it, the guard sees him out
    function lockField() {
        const s = state(), lo = lostState(), here = $gameMap.mapId();
        const F = T.api("Farming"), farm = F && F.farm ? F.farm() : null;
        const fieldHut = !!farm && ((farm.buildings || {})[MAP.field] || []).some(b => b.type === "hut" && !b.site && !b.boarded);
        const inHut = here === 100 && fieldHut, onField = here === MAP.field || inHut;
        lo.locked = day();
        if (!lo.scene) lo.scene = -2;   // (never seen: the sign stands all the same)
        closeGoal("story_carry");
        T.emit("fieldLocked", { day: day() });
        tell("fieldLocked");
        if (onField) { $gameMap._interpreter.setup(end(escortList(inHut)), 0); return true; }
        T.popup("Pole dziadka zamknięte", { top: true, color: "#ff9f8f", sub: "Minęły " + dni(CARRY_DAYS) + " - pole należy teraz do Lorda." });
        T.call("Journal", "addNote", "List od Lorda (dzień " + day() + ")", "Minęły " + dni(CARRY_DAYS) + ". Pole za lasem jest własnością dworu, a moja straż pilnuje, by tak zostało. Oferta pozostaje aktualna: " + s.buy.price + " G, w ratach, bez terminu. Leopold Zaleski.");
        T.call("Journal", "evaluateGoals");
        return true;
    }
    // the last coin of the buyback: the field is grandpa's again, with what was left on it (Homes.js gives back the hut's furniture)
    function fieldReturned() {
        const s = state();
        if (!s || !s.buy || s.buy.done || s.buy.paid < s.buy.price) return;
        s.buy.done = day();
        if (REWARD_XP > 0) T.call("Combat", "gainXp", Math.round(REWARD_XP / 2), "odkup pola");
        T.popup("Pole dziadka znowu wasze!", { top: true, color: U().accent, sub: "Wraca z tym, co na nim zostało." });
        AudioManager.playMe({ name: "Victory1", volume: 70, pitch: 100, pan: 0 });
        T.call("Journal", "addNote", "Akt odkupu pola", "Dzień " + day() + ": oddałem Lordowi ostatnią ratę - razem " + s.buy.price + " G. Pole za lasem znowu należy do dziadka Stacha, a z nim wszystko, czego nie zdążyłem rozebrać. " + butler() + " zaniesie dziadkowi akt odkupu.");
        T.emit("fieldBack", { day: day(), price: s.buy.price });
        tell("fieldBack");
        T.call("Journal", "evaluateGoals");
    }
    function thanksBack() {
        const s = state();
        if (!s) return;
        const first = mark("thankedBack");
        if ($dataItems[SOUP]) $gameParty.gainItem($dataItems[SOUP], 2);
        if (first) tell("thankedBack");
    }
    function introDone() {
        const s = state();
        if (!s) return;
        s.intro = 2;
        const first = mark("talk");
        if ($dataItems[SOUP]) $gameParty.gainItem($dataItems[SOUP], 1);
        T.call("Journal", "addNote", "Dług dziadka Stacha", "Dziadek jest winien Lordowi Leopoldowi Zaleskiemu " + s.debt + " G. Termin: dzień " + s.deadline +
            " (pieniądze przyjmą jeszcze w nocy po nim, do świtu) - potem Lord zabierze jego pole za lasem.\nNa tym polu mogę budować (i tylko tam).\n" +
            "Borgar z tawerny „Pod Złotym Kuflem” daje pracę po południu i wieczorem, od " + SHIFT_FROM + " do " + SHIFT_TO + ".\n" +
            "Spłatę zanoszę do dworu Lorda, obok tawerny: za dnia (" + LORD_HOURS[0] + "-" + LORD_HOURS[1] + ") Lordowi, nocą kamerdynerowi.\n" +
            "Droga na pole: podwórze - Leśna droga - Polna droga - Skraj lasu - pole.\n" +
            "Droga do tawerny: podwórze - Leśna droga - Polna droga - ścieżką na północ. Dwór Lorda stoi na wschód od tawerny.");
        // the prologue's wet letter (the mother's): the first open thread
        const J = T.api("Journal"), notes = J && J.data ? (J.data().notes || []) : [];
        if (!notes.some(n => n.title === "List od matki")) T.call("Journal", "addNote", "List od matki",
            "Mokry, rozmyty list matki do dziadka Stacha. Straż Pewności - ludzie mówią na nich „Czarne Oczy” - spaliła naszą wieś, Brzozową Wolę. " +
            "Ojciec przepadł na wojnie; matka poszła za wojskiem go szukać. Obiecała, że przypłynie następnym promem.\n" +
            "Przemytnik zabrał mnie kutrem za ostatnie monety. Sztorm rozbił łódź - nie wiem, czy przeżył. Rybak Janek znalazł mnie na plaży.\n" +
            "Mam jeszcze wisiorek z krukiem po ojcu. Dziadek na jego widok milknie.");
        if (first) tell("talk");
    }
    function thanks() {
        const s = state();
        if (!s) return;
        const first = mark("thanked");
        if ($dataItems[SOUP]) $gameParty.gainItem($dataItems[SOUP], 2);
        if (first) tell("thanked");
    }
    function chapterDone() {
        const s = state();
        if (!s || s.done) return;
        s.done = day();
        if (REWARD_XP > 0) T.call("Combat", "gainXp", REWARD_XP, "rozdział 1");
        T.popup("Rozdział 1 zakończony: dług dziadka spłacony!", { top: true, color: U().accent, sub: "Pole zostaje przy was." });
        AudioManager.playMe({ name: "Victory1", volume: 70, pitch: 100, pan: 0 });
        T.call("Journal", "addNote", "Pokwitowanie od Lorda", "Dług dziadka spłacony w dniu " + s.done + ": " + s.debt + " G. Pole zostaje przy nas.\nW dworze wspomnieli, że zbudowano go z kamieni dawnej twierdzy - Kruczych Skał - a najstarsze z nich leżą pod tawerną Borgara. Pod Kruczymi Skałami są podobno drzwi, których nikt nie powinien otwierać.\nLord nie żartował. Chce, żebym przyszedł najpierw do niego, jeśli coś znajdę. Ciekawe, dlaczego...");
        T.call("Journal", "evaluateGoals");
        tell("chapterDone");
    }

    // ------------------------------------------------------------------
    // New game, loading, the first map
    // ------------------------------------------------------------------
    T.on("newGame", () => {
        keepOldName();
        setState(newState());   // (kept only when the game really begins in grandpa's house - see performTransfer)
        syncGoals();
    }, { owner: PLUGIN });
    T.on("load", () => {
        keepOldName();
        const s = state();
        if (s && s.intro === 1) s.intro = 0;   // (a talk cut off by a reload is told again)
        // (the field's scene cut off by a reload - its commands not running any more: it comes again on the field)
        if (s && s.lost && s.lost.scene === -1 && !($gameMap && $gameMap._interpreter && $gameMap._interpreter.isRunning())) s.lost.scene = 0;
        if (s) s.lastShift = null;
        syncGoals();
    }, { owner: PLUGIN });
    const _performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const s = state();
        if (s && s.pending && this.isTransferring()) {
            if (this._newMapId === MAP.house) {
                delete s.pending;
                // (the prologue's pendant: what the sea left him, with the wet letter)
                if ($dataItems[PENDANT] && $dataItems[PENDANT].name && !$gameParty.hasItem($dataItems[PENDANT])) $gameParty.gainItem($dataItems[PENDANT], 1);
            } else setState(null);   // an old-style start somewhere else: no story at all
            syncGoals();
        }
        _performTransfer.call(this);
        if (active()) onArrive($gameMap.mapId());
    };
    function onArrive(mapId) {
        if (mapId === MAP.field && step("field")) T.call("SpeechBubbles", "say", $gamePlayer, "Więc to jest pole dziadka...", 200);
        if (mapId === MAP.tavern) step("tavern");
        if (mapId === MAP.cellar) step("cellar");
        if (mapId === MAP.manor) step("manor");
    }
    // the first shift at Borgar's (TavernShift's own count; nothing more of it is kept here)
    T.on("shiftDone", e => { if (active() && e.done === 1) tell("firstShift"); }, { owner: PLUGIN });
    // the names the story gives (the map plate, Combat's "odkrycie: ..." notice)
    const _Game_Map_displayName = Game_Map.prototype.displayName;
    Game_Map.prototype.displayName = function() {
        return (active() && MAP_NAMES[this._mapId]) || _Game_Map_displayName.call(this);
    };

    // ------------------------------------------------------------------
    // The journal: chapter 1 and its goals (only in a story game; an old save's journal stays as it was)
    // ------------------------------------------------------------------
    function farmBuilt(mapId, types) {
        const list = (($gameSystem._farm || {}).buildings || {})[mapId] || [];
        return list.some(b => !b.site && types.includes(b.type));
    }
    // anywhere the hero may call his own (the lost field not counted)
    function farmBuiltAnywhere(types, notField) {
        const all = ($gameSystem._farm || {}).buildings || {}, F = T.api("Farming");
        return Object.keys(all).some(m => !(notField && Number(m) === MAP.field) && !(F && F.landHeld && F.landHeld(Number(m))) &&
            (all[m] || []).some(b => !b.site && !b.boarded && types.includes(b.type)));
    }
    function chapterIndex() {
        const J = T.api("Journal");
        if (!J || !J.CHAPTERS) return 0;
        let i = J.CHAPTERS.indexOf(CHAPTER);
        if (i < 0) i = J.CHAPTERS.push(CHAPTER) - 1;
        return i;
    }
    function storyGoals() {
        const ch = chapterIndex();
        return {
            talk: { id: "story_talk", story: true, ch, title: "Porozmawiaj z dziadkiem", item: SOUP, where: { person: "grandpa" }, after: [], done: () => !!(state() && state().flags.talk),
                text: "Dziadek Stach czeka w swoim domu. Ma ci coś ważnego do powiedzenia." },
            field: { id: "story_field", story: true, ch, title: "Dojdź na pole dziadka", item: 67, where: { map: MAP.field, name: "Pole dziadka" }, after: ["story_talk"], done: () => !!(state() && state().flags.field),
                text: "Z podwórza na południe, leśną drogą do Polnej, stamtąd na południe na skraj lasu i dalej na zachód. Tylko na tym polu wolno ci budować." },
            work: { id: "story_work", story: true, ch, title: "Znajdź pracę w tawernie", item: 81, where: { person: "borgar" }, after: ["story_field"], done: () => !!(state() && state().flags.hired),
                text: "Borgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy. Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim." },
            shift: { id: "story_shift", story: true, ch, title: "Przepracuj zmianę u Borgara", item: 81, where: { person: "borgar" }, after: ["story_work"],
                done: () => { const st = T.call("TavernShift", "stats"); return !!st && st.done > 0; },
                text: "Zmiany są po południu i wieczorem, od " + SHIFT_FROM + " do " + SHIFT_TO + ", jedna dziennie. Sprzątanie, beczka, kuchnia i sala - płaci od roboty, a goście dają napiwki." },
            shelter: { id: "story_shelter", story: true, ch, item: 121, after: ["story_field"],
                get title() { return lostState() ? "Zbuduj schronienie" : "Zbuduj schronienie na polu"; },
                get where() { return lostState() ? null : { map: MAP.field, name: "Pole dziadka" }; },
                done: () => (!lostState() && farmBuilt(MAP.field, SHELTERS)) || farmBuiltAnywhere(SHELTERS.concat(["bed"])),
                get text() { return lostState() ? "Postaw legowisko, namiot, wiatę albo chatkę - na własnej ziemi (chatę z działką sprzedaje sołtys, a zagrodę Ługów za Skrajem lasu da się odkupić), a namiot i leśne legowisko gdziekolwiek. Noc pod gołym niebem męczy i bywa niebezpieczna."
                    : "Na polu dziadka postaw legowisko, namiot, wiatę albo chatkę. Noc pod gołym niebem męczy i bywa niebezpieczna."; } },
            // ---- the field lost (only in the goals' list once it is: syncGoals)
            carry: { id: "story_carry", story: true, storyLoss: true, ch, item: 67, where: { map: MAP.field, name: "Pole dziadka" }, after: [], done: () => fieldLocked() || fieldBack(),
                get title() { const n = carryLeft(); return "Wynieś dobytek z pola (" + (n > 1 ? zostalo(n) + " " + dni(n) : n === 1 ? "ostatni dzień" : "do świtu") + ")"; },
                get text() {
                    const lo = lostState();
                    return "Pole przechodzi na Lorda o świcie dnia " + ((lo ? lo.day : 0) + CARRY_DAYS) + ". Do tego czasu zbierz plony, opróżnij skrzynie, rozbierz budynki (rozbiórka oddaje część materiałów), sprzedaj zwierzęta z zagród (menu zagrody) i zabierz psa. " +
                        "Meble z chatki zostaną w niej, jeśli ich nie wyniesiesz. Co zostanie na polu, należy potem do Lorda - wróci, gdy odkupisz pole.";
                } },
            roof: { id: "story_roof", story: true, storyLoss: true, ch, item: 80, where: { person: "soltys" }, after: [], done: () => !!T.call("Homes", "hasRoof") || farmBuiltAnywhere(["hut"], true),
                title: "Znajdź nowy dach nad głową",
                text: "Dom dziadka nie był w zastawie - posłanie zawsze czeka, a pokój wynajmie Borgar. Własny dach z ziemią, na której wolno budować: Chata pod lasem na Podgrodziu (sołtys w ratuszu, 8-16, 600 G) albo spalona zagroda Ługów za Skrajem lasu - do odkupienia i odbudowy. Chatkę postawisz od nowa na własnej ziemi." },
            buyback: { id: "story_buyback", story: true, storyLoss: true, ch, icon: GOLD_ICON, where: { person: "lord" }, after: [], done: () => fieldBack(),
                get title() { const s = state(); return s && s.buy ? "Odkup pole dziadka (" + Math.min(s.buy.paid, s.buy.price) + " / " + s.buy.price + " G)" : "Odkup pole dziadka"; },
                get text() { const s = state(); return "Lord odsprzeda pole za " + (s && s.buy ? s.buy.price : BUYBACK) + " G - w ratach, jak dług, bez terminu: za dnia (" + LORD_HOURS[0] + "-" + LORD_HOURS[1] + ") przed dworem, nocą u kamerdynera. " + (s && s.buy && s.buy.paid > 0 ? "Oddałeś już " + s.buy.paid + " G. " : "") + "Po spłacie pole wraca z tym, co na nim zostało."; } },
            cellar: { id: "story_cellar", story: true, ch, title: "Drzwi pod Kruczymi Skałami", item: TORCH, where: { map: MAP.tavern, name: "Tawerna" }, after: ["story_debt"],
                done: () => !!(state() && state().flags.cellar),
                text: "Lord mówił poważnie: najstarsze kamienie dawnej twierdzy leżą pod tawerną Borgara, a pod Kruczymi Skałami są drzwi, których nikt nie powinien otwierać. Rozejrzyj się w tawernie - może jest tam zejście do piwnic." },
            debt: { id: "story_debt", story: true, ch, icon: GOLD_ICON, where: { person: "lord" }, after: ["story_talk"], done: () => !!(state() && (state().done || state().paid >= state().debt)),
                get title() { const s = state(); return s && s.lost ? "Dług dziadka: pole przepadło (" + s.paid + "/" + s.debt + " G)" : s ? "Spłać dług dziadka (" + Math.min(s.paid, s.debt) + "/" + s.debt + " G)" : "Spłać dług dziadka"; },
                get text() {
                    const s = state();
                    if (!s) return "Dług dziadka.";
                    if (s.lost) return "Termin minął w dniu " + s.deadline + " - spłacono " + s.paid + " z " + s.debt + " G. O świcie dnia " + s.lost.day + " pole przeszło na Lorda Zaleskiego. Lord odsprzeda je za " + s.buy.price + " G.";
                    if (s.done || s.paid >= s.debt) return "Dług spłacony: " + s.debt + " G. Pole zostaje przy was.";
                    const n = daysLeft();
                    return "Spłacono " + s.paid + " z " + s.debt + " G, " + (n > 1 ? "do terminu " + daysPhrase(n) : n === 1 ? "dziś mija termin" : "termin mija o świcie") +
                        ". Dziś dzień " + day() + ", termin: dzień " + s.deadline + ". Pieniądze zanosisz Lordowi Zaleskiemu do dworu obok tawerny (za dnia, od " +
                        LORD_HOURS[0] + " do " + LORD_HOURS[1] + ") albo kamerdynerowi (nocą). W noc po terminie kamerdyner przyjmuje je jeszcze do świtu - o świcie Lord zabierze pole.";
                } }
        };
    }
    // the tracker (the first open goal in the list) leads: grandpa -> the field -> the job -> the first shift -> the first steps (the
    // survival goals of Journal's chapter 1, with the shelter after the workbench) -> the debt, which stays up till it is paid
    // the field lost: carrying off (right after the debt), then the cellar's clue as before, a new roof and the buyback after it
    function syncGoals() {
        const J = T.api("Journal");
        if (!J || !J.GOALS) return;
        const GOALS = J.GOALS, want = active(), has = GOALS.some(g => g.story);
        const wantLoss = want && !!lostState(), hasLoss = GOALS.some(g => g.storyLoss);
        if (wantLoss !== hasLoss && hasLoss) for (let i = GOALS.length - 1; i >= 0; i--) if (GOALS[i].storyLoss) GOALS.splice(i, 1);
        if (want !== has) {
            if (!want) { for (let i = GOALS.length - 1; i >= 0; i--) if (GOALS[i].story) GOALS.splice(i, 1); return; }
            const g = storyGoals(), at = id => { const i = GOALS.findIndex(x => x.id === id); return i < 0 ? -1 : i + 1; };
            const firstCh = GOALS.length ? GOALS[0].ch : 0;
            let end1 = 0;   // (just after the goals of Journal's first chapter)
            while (end1 < GOALS.length && GOALS[end1].ch === firstCh) end1++;
            GOALS.splice(end1, 0, g.debt, g.cellar);
            GOALS.unshift(g.talk, g.field, g.work, g.shift);
            let i = at("workbench");
            if (i < 0) i = at("story_shift");
            GOALS.splice(i, 0, g.shelter);
        }
        if (wantLoss && !GOALS.some(g => g.storyLoss)) {
            const g = storyGoals(), at = id => GOALS.findIndex(x => x.id === id);
            const d = at("story_debt");
            if (d >= 0) GOALS.splice(d + 1, 0, g.carry);
            const c = at("story_cellar");
            GOALS.splice(c >= 0 ? c + 1 : GOALS.length, 0, g.roof, g.buyback);
        }
    }

    // ------------------------------------------------------------------
    // On the map: the intro, the Lord's hours, the letters, the deadline
    // ------------------------------------------------------------------
    function startIntro() {
        const s = state(), g = npc("grandpa");
        if (!s || !g) return false;
        s.intro = 1;
        g.setDirection(g.x < $gamePlayer.x ? 6 : g.x > $gamePlayer.x ? 4 : g.y < $gamePlayer.y ? 2 : 8);
        $gamePlayer.setDirection(g.x < $gamePlayer.x ? 4 : g.x > $gamePlayer.x ? 6 : g.y < $gamePlayer.y ? 8 : 2);
        $gameMap._interpreter.setup(end(introList()), g.eventId());
        return true;
    }
    function letterText(d) {
        const s = state(), n = daysLeft(), sum = left() + " G";
        if (d >= s.deadline) return "Uprzejmie przypominam, że dziś mija termin spłaty długu (" + sum + "). " + butler() + " przyjmie pieniądze jeszcze tej nocy, do świtu. O świcie moi ludzie przyjdą zmierzyć pole.";
        if (d >= s.deadline - 1) return "Pojutrze o świcie pole przechodzi na własność dworu, chyba że wcześniej zobaczę " + sum + ". " + butler() + " już grzeje lak do pieczęci.";
        if (d >= s.deadline - 5) return "Do terminu " + daysPhrase(n) + ". Brakuje " + sum + ". " + butler() + " ostrzy pióro do aktu przejęcia pola - proszę go do tego nie zmuszać.";
        return "Uprzejmie przypominam o długu Stacha: " + sum + " do dnia " + s.deadline + ". Do terminu " + daysPhrase(n) + ". Z wyrazami szacunku, Leopold Zaleski. PS. " + butler() + " pozdrawia.";
    }
    function updateLetters() {
        const s = state(), today = day();
        if (!isOpen() || hour() < 6) return;
        const due = LETTERS_BEFORE.map(k => s.deadline - k).filter(d => d >= 2 && d <= today && !s.letters[d]);
        if (!due.length) return;
        for (const d of due) s.letters[d] = true;
        const d = Math.max(...due);
        T.popup("List od Lorda Zaleskiego", { top: true, color: U().accent, sub: "Do spłaty " + left() + " G - " + daysPhrase(daysLeft()) + ". (Dziennik: Notatki)" });
        T.call("Journal", "addNote", "List od Lorda (dzień " + today + ")", letterText(d));
        s.lastLetter = today;
    }
    function checkDeadline() {
        const s = state();
        if (!pastDue() || s.ended || s.lost) return false;
        if (!LOSE_ENDS) { loseField(); return true; }
        s.ended = day();   // (the old ending, behind the parameter "Przegrana kończy grę")
        $gameTemp._atmoAutosave = false;
        $gameMap._interpreter.setup(end(endingList()), 0);
        return true;
    }
    // the field lost: the scene when he walks onto it (the carrying-out days), then the dawn that shuts it
    function checkField() {
        const lo = lostState();
        if (!lo || !fieldLost()) return false;
        if (!lo.locked && nowHours() >= lockAt()) return lockField();
        if (!lo.locked && !lo.scene && $gameMap.mapId() === MAP.field && T.call("Homes", "castReady")) return startMeasure();
        return false;
    }
    T.on("mapReady", () => syncGoals(), { owner: PLUGIN });
    // calm: Tawerna.isCalm's "strict" (no talk, menu, build, mini-game, transfer, fade, day summary, rest or blow - when he is up)
    T.onMapUpdate(scene => {
        if (!active() || !$gameMap) return;
        const s = state(), n = scene._twFrames;   // (the frames this map scene has run)
        if (n % 30 === 0 && $gameMap.mapId() === MAP.manor) syncLord();
        if (!T.isCalm(scene, "strict")) return;
        if (s.intro !== 2 && $gameMap.mapId() === MAP.house && n > 40 && npc("grandpa")) { startIntro(); return; }
        if (checkDeadline()) return;
        if (n > 20 && checkField()) return;
        if (n % 20 === 0) updateLetters();
    }, { owner: PLUGIN, name: "chapter" });
    // the old ending only (the parameter "Przegrana kończy grę"): after the deadline, unpaid, nothing more is saved
    const _isSaveEnabled = Game_System.prototype.isSaveEnabled;
    Game_System.prototype.isSaveEnabled = function() {
        return _isSaveEnabled.call(this) && !(this === window.$gameSystem && doomed());
    };

    // ------------------------------------------------------------------
    // The ending: a screen with a short text, then Game Over (and the title: a save can be loaded)
    // ------------------------------------------------------------------
    function Scene_StoryEnding() {
        this.initialize(...arguments);
    }
    Scene_StoryEnding.prototype = Object.create(Scene_Base.prototype);
    Scene_StoryEnding.prototype.constructor = Scene_StoryEnding;
    Scene_StoryEnding.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        const W = Graphics.width, H = Graphics.height, s = state() || newState();
        this._back = new Sprite(new Bitmap(W, H));
        this._back.bitmap.fillAll("#050506");
        this.addChild(this._back);
        const pw = Math.min(780, W - 80), S = U(), lines = [], para = [
            "Świt " + (s.deadline + 1) + ". dnia przyniósł ludzi Lorda Zaleskiego - z pieczęcią, sznurem mierniczym i bardzo uprzejmym kamerdynerem.",
            "Dziadek Stach długo stał przy płocie i nic nie mówił. Pole za lasem, a z nim wszystko, co na nim postawiłeś, należy teraz do dworu.",
            "Może gdzieś, w innym zapisie, ta historia potoczy się inaczej..."
        ];
        const m = new Bitmap(8, 8);
        m.fontSize = 21;
        for (const p of para) {
            let line = "";
            for (const w of p.split(" ")) { const t = line ? line + " " + w : w; if (line && m.measureTextWidth(t) > pw - 80) { lines.push(line); line = w; } else line = t; }
            lines.push(line, "");
        }
        lines.pop();
        const h = 118 + lines.length * 28 + 76, b = new Bitmap(pw, h), ctx = b.context;
        if (S.panel) S.panel(ctx, 0, 0, pw, h, { cut: 8 }); else { ctx.fillStyle = S.fill; ctx.fillRect(0, 0, pw, h); }
        b.outlineWidth = 0;
        b.fontSize = 16; b.textColor = S.accent;
        b.drawText("KONIEC GRY", 40, 26, pw - 80, 22);
        b.fontSize = 34; b.textColor = S.text;
        b.drawText("Pole przepadło", 40, 50, pw - 80, 44);
        ctx.fillStyle = S.accent;
        ctx.fillRect(40, 100, 56, 2);
        b.fontSize = 21;
        let y = 118;
        for (const l of lines) { b.textColor = S.text; b.drawText(l, 40, y, pw - 80, 28); y += 28; }
        b.fontSize = 18; b.textColor = S.muted;
        b.drawText("Spłacono " + s.paid + " z " + s.debt + " G  ·  zabrakło " + Math.max(0, s.debt - s.paid) + " G", 40, h - 52, pw - 260, 28);
        b.fontSize = 20; b.textColor = S.accent;
        b.drawText("O - dalej", 40, h - 52, pw - 80, 28, "right");
        b._baseTexture.update();
        this._panel = new Sprite(b);
        this._panel.x = Math.round((W - pw) / 2);
        this._panel.y = Math.round((H - h) / 2);
        this.addChild(this._panel);
        this._t = 0;
    };
    Scene_StoryEnding.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        AudioManager.fadeOutBgm(2);
        AudioManager.fadeOutBgs(2);
        this.startFadeIn(45, false);
    };
    Scene_StoryEnding.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (++this._t < 60 || this.isBusy()) return;
        if (Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered()) {
            SoundManager.playOk();
            SceneManager.goto(Scene_Gameover);
        }
    };
    function showEnding() {
        $gameScreen.startFadeIn(1);
        SceneManager.goto(Scene_StoryEnding);
    }

    // ------------------------------------------------------------------
    // The debt where it can be seen: a line on the card of the P menu, a note on the morning's plate of the day
    // ------------------------------------------------------------------
    // the P menu (MenuPanel.js): on the right of the panel's foot band, beside the keys - "DŁUG DZIADKA [bar] 120 / 2500 G · do dnia 60 · ..."
    let lastMenuLine = "", lastMenuLabel = false;
    // short: without "do dnia 60" (a narrow band keeps the label rather than the day)
    function debtText(short) {
        const s = state();
        if (fieldBack()) return "odkupione · pole znowu wasze";
        if (s.lost) {
            const n = carryLeft();
            return s.buy.paid + " / " + s.buy.price + " G" + (fieldLocked() ? (short ? "" : "  ·  pole należy do Lorda") : "  ·  wynieś dobytek: " + carryPhrase(n));
        }
        if (s.done || s.paid >= s.debt) return "spłacony · pole zostaje przy was";
        return s.paid + " / " + s.debt + " G  ·  " + (short ? "" : "do dnia " + s.deadline + "  ·  ") + daysPhrase(daysLeft());
    }
    // area (MenuPanel.addFoot): y - the keys' line, right - the edge to keep to, room - the px between the last key and that edge
    function drawDebtFoot(b, area) {
        const s = state(), S = U(), ctx = b.context, lost = !!s.lost, paidAll = lost ? fieldBack() : s.done || s.paid >= s.debt;
        const y = area.y, right = area.right, room = area.room;
        const colour = paidAll ? "#9ff0a8" : (lost ? !fieldLocked() : daysLeft() <= 5) ? "#ff9f8f" : S.text;
        b.fontSize = 15;
        const label = lost ? "ODKUP POLA" : "DŁUG DZIADKA", lw = Math.ceil(b.measureTextWidth(label)), bw = 80;
        b.fontSize = 17;
        const full = debtText(false), short = debtText(true), wf = Math.ceil(b.measureTextWidth(full)), ws = Math.ceil(b.measureTextWidth(short));
        // what fits beside the keys: all of it; without the day of the deadline; then without the label; then the text alone
        const tries = [[full, wf, true, true], [short, ws, true, true], [short, ws, true, false], [short, ws, false, false]];
        const [text, tw, withBar, withLabel] = tries.find(([, w, bar, lab]) => w + (bar ? 12 + bw : 0) + (lab ? 10 + lw : 0) <= room) || tries[tries.length - 1];
        b.textColor = colour;
        b.drawText(text, right - tw, y - 1, tw + 4, 26, "left");
        let x = right - tw - 12;
        const part = lost ? s.buy.paid / s.buy.price : s.paid / s.debt;
        if (withBar && S.bar) { S.bar(ctx, x - bw, y + 8, bw, 8, Math.min(1, part), paidAll ? "#62c66a" : S.accent); x -= bw + 10; }
        if (withLabel) { b.fontSize = 15; b.textColor = S.muted; b.drawText(label, x - lw, y, lw + 4, 24, "left"); }
        b.fontSize = 22;
        lastMenuLine = text;
        lastMenuLabel = withLabel;
    }
    const MP = T.api("MenuPanel");
    if (MP && MP.addFoot) MP.addFoot({ owner: "Story", when: active, draw: drawDebtFoot });
    else {   // (without MenuPanel.js: a line under the status card)
        const _drawItem = Window_MenuStatus.prototype.drawItem;
        Window_MenuStatus.prototype.drawItem = function(index) {
            _drawItem.call(this, index);
            if (index !== 0 || (window.Window_MenuActor && this instanceof Window_MenuActor) || !active()) return;
            this.contents.fontSize = 18;
            this.changeTextColor(U().text);
            lastMenuLine = debtText();
            this.drawText("Dług dziadka: " + lastMenuLine, 0, this.innerHeight - 30, this.innerWidth, "right");
            this.resetFontSettings();
        };
    }
    const _queueDayBanner = Game_Temp.prototype.queueDayBanner;
    if (_queueDayBanner) {
        Game_Temp.prototype.queueDayBanner = function(text) {
            _queueDayBanner.call(this, text);
            if (!this._dayBanner) return;
            let add = "";
            if (fieldLost() && !fieldLocked() && carryLeft() >= 1) add = "z pola wynieś dobytek: " + carryPhrase(carryLeft());
            else if (isOpen() && daysLeft() >= 1) add = "do spłaty " + left() + " G, " + daysPhrase(daysLeft());
            if (!add) return;
            this._dayBanner.text = (this._dayBanner.text ? this._dayBanner.text + "   ·   " : "") + add.charAt(0).toUpperCase() + add.slice(1);
            this._lastDayBanner = this._dayBanner.title + " " + this._dayBanner.text;
        };
    }

    chapterIndex();
    window.Story = T.register(PLUGIN, {
        NPCS, MAP, DEBT, DEADLINE, DAWN, LETTERS_BEFORE, PENDANT, CAST, CARRY_DAYS, BUYBACK, LOSE_ENDS, state, active, left, daysLeft, lastNight, isOpen, statusLine, newState, pay: payOutside, talk, pick,
        introDone, thanks, thanksBack, chapterDone, startIntro, checkDeadline, showEnding, syncGoals, npc, doorEvent, borgarEvent, roleOf, doomed: () => doomed(), step,
        // the field lost and bought back
        pastDue: () => pastDue(), fieldLost: () => fieldLost(), fieldLocked: () => fieldLocked(), fieldBack: () => fieldBack(), carryLeft: () => carryLeft(),
        buyLeft: () => buyLeft(), buyOpen: () => buyOpen(), chapterEnded: () => chapterEnded(), halfWay: () => halfWay(), lockAt: () => lockAt(),
        loseField, startMeasure, measured, hookTold, lockField, fieldReturned, payBuy, checkField,
        lists: { intro: introList, grandpa: grandpaList, lord: lordList, borgar: ev => borgarList(ev), chat: ev => chatList(ev), ending: endingList,
            measure: measureList, escort: escortList, watch: ev => watchList(ev), lostNote: lostNoteText, lostLetter: lostLetterText },
        setDeadlineOn(on) { const s = state(); if (s) s.off = !on; },
        // bots and tests: grandpa's talk as if heard (a running one is cut short)
        skipIntro() {
            const s = state();
            if (!s || s.intro === 2) return false;
            if (s.intro === 1 && $gameMap && $gameMap.isEventRunning()) { $gameMap._interpreter.clear(); $gameMessage.clear(); const g = npc("grandpa"); if (g) g.unlock(); }
            introDone();
            return true;
        },
        get lastMenuLine() { return lastMenuLine; }, get lastMenuLabel() { return lastMenuLabel; }, Scene_StoryEnding
    });
})();
