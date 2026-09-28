//=============================================================================
// Story.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Fabuła nowej gry: dom dziadka, dług u Lorda (spłata do terminu), praca u Borgara, rozdział 1 w dzienniku. v1.1.0
 * @author Claude
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
 * @desc Ostatni dzień spłaty. Kamerdyner przyjmuje pieniądze jeszcze w nocy po nim; o świcie (6:00) następnego dnia - koniec gry.
 * @type number
 * @min 2
 * @default 60
 *
 * @param endOnDeadline
 * @text Koniec gry po terminie
 * @desc Wyłączone: termin mija, ale gra toczy się dalej (do testów).
 * @type boolean
 * @default true
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
 *  - Lord Zaleski (People2_Tall, 4) przed drzwiami dworu za dnia
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
 * niespłacony: ekran końca i powrót do tytułu (można wczytać zapis; od
 * tej chwili gra się już nie zapisuje). Koniec czeka, aż bohater wstanie
 * (odpoczynek) i skończy rozmowę czy zmianę.
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
 * (spłata poza rozmową; całość od razu kończy rozdział 1),
 * Story.left(), Story.daysLeft(), Story.skipIntro() (rozmowa z dziadkiem
 * jak wysłuchana - dla botów), Story.setDeadlineOn(false) (bez końca gry).
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "Story";
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const DEBT = num(params.debt, 2500);
    const DEADLINE = num(params.deadline, 60);
    const END_ON_DEADLINE = params.endOnDeadline === undefined || params.endOnDeadline === "" ? true : params.endOnDeadline === "true";
    const SHIFT_FROM = num(params.shiftFrom, 16), SHIFT_TO = num(params.shiftTo, 21);
    const SHIFT_HOURS = num(PluginManager.parameters("TavernShift").hours, 4);   // (how long a shift takes: TavernShift's own setting)
    const REWARD_XP = num(params.rewardXp, 300);

    const MAP = { house: 19, field: 3, tavern: 1, manor: 24, cellar: 9 };
    const LETTERS_BEFORE = [40, 20, 5, 1, 0];   // letters from the Lord: days before the deadline (60: days 20, 40, 55, 59, 60)
    const LORD_HOURS = [8, 20];              // the Lord stands at his door by day (the butler's words say "od ósmej")
    const NIGHT = [22, 6];                   // grandpa dozes
    const DAWN = 6;                          // the debt counts till dawn of the day after the deadline (the Lord's men come at dawn)
    const SOUP = 131;                        // Kapuśniak (grandpa's cabbage)
    const GOLD_ICON = 313;
    const TORCH = 59;                        // Pochodnia (the clue's goal: the way down under the tavern)
    const SHELTERS = ["shelter", "tent", "bedroll", "hut"];
    // the characters the story adds to maps (event ids far above what the editor gives out; Forestry's planted trees start at 1000)
    const NPCS = {
        grandpa: { id: 901, map: MAP.house, name: "Dziadek Stach", sheet: "$Npc_Dziadek", index: 0, face: ["People1", 6], at: [7, 5], dir: 2 },
        lord: { id: 902, map: MAP.manor, name: "Lord Leopold Zaleski", sheet: "People2_Tall", index: 4, face: ["People2", 4], at: null, dir: 2 }
    };
    // map names in a story game (the map files stay as they are: an old save keeps the old names)
    const MAP_NAMES = { [MAP.field]: "Pole dziadka" };
    const BORGAR_FACE = ["People3", 4];
    const CHAPTER = "Rozdział 1: Dług dziadka";

    // ------------------------------------------------------------------
    // State: $gameSystem._story (plain data only, saved with the game)
    // ------------------------------------------------------------------
    function newState() {
        return { v: 1, pending: true, debt: DEBT, deadline: DEADLINE, paid: 0, payments: [], intro: 0, hint: 0,
            flags: {}, letters: {}, shiftDay: -1, lastShift: null, done: 0, ended: 0, off: !END_ON_DEADLINE };
    }
    const state = () => (window.$gameSystem && $gameSystem._story) || null;
    const active = () => { const s = state(); return !!s && !s.pending; };
    const day = () => ($gameSystem && $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 1);
    const hour = () => ($gameSystem && $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12);
    const left = () => { const s = state(); return s ? Math.max(0, s.debt - s.paid) : 0; };
    const daysLeft = () => { const s = state(); return s ? s.deadline - day() + 1 : 0; };   // (today counts: on the deadline day 1 is left)
    const isOpen = () => { const s = state(); return !!s && !s.pending && !s.done && s.paid < s.debt; };
    // past the deadline, before dawn: the last night (the butler still takes the money)
    const lastNight = () => { const s = state(); return !!s && day() === s.deadline + 1 && hour() < DAWN; };
    function doomed(sys) {
        const s = sys && sys._story;
        if (!s || s.pending || s.off || s.done || s.paid >= s.debt || !sys.dayNightDay) return false;
        const d = sys.dayNightDay(), h = sys.dayNightHour ? sys.dayNightHour() : 12;
        return d > s.deadline + 1 || (d === s.deadline + 1 && h >= DAWN);
    }
    const U = () => window.UIStyle || { fill: "rgba(11,12,15,0.9)", line: "#3a3e46", accent: "#ffd23f", text: "#eceef0", muted: "#8a9099", panel: null, bar: null };

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
    function statusLine() {
        const s = state();
        if (!s) return "";
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
    function wrap(text) {
        if (!probe) probe = new Bitmap(8, 8);
        probe.fontFace = $gameSystem.mainFontFace();
        probe.fontSize = $gameSystem.mainFontSize();
        const lines = [];
        for (const para of String(text).replace(/(\d) G\b/g, "$1 G").split("\n")) {   // (a sum keeps its "G" on its line)
            let line = "";
            for (const word of para.split(" ")) {
                const trial = line ? line + " " + word : word;
                if (line && probe.measureTextWidth(trial) > WRAP_W) { lines.push(line); line = word; } else line = trial;
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
    // The characters: event data put into the map's data when it loads (before the map sets its events up; again after every
    // menu, because the map data is loaded anew while the events stay)
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
    function inject(data, mapId) {
        if (!state() || !data || !data.events) return;   // (a new game's story is still pending here: Game_Map.setup drops them if it goes)
        for (const role of Object.keys(NPCS)) {
            const n = NPCS[role];
            if (n.map !== mapId) continue;
            let at = n.at;
            if (!at) { const door = findDoorData(data); at = door ? [door.x + 1, door.y + 1] : [Math.floor(data.width / 2), Math.floor(data.height / 2)]; }
            for (let i = data.events.length; i < n.id; i++) data.events[i] = null;   // (no holes: other code checks for null)
            data.events[n.id] = npcData(role, at[0], at[1]);
        }
    }
    const findDoorData = data => (data.events || []).find(e => e && /^Drzwi dworu/i.test(e.name || "")) || null;
    let loadingMapId = 0;
    const _DataManager_loadMapData = DataManager.loadMapData;
    DataManager.loadMapData = function(mapId) {
        loadingMapId = mapId;
        _DataManager_loadMapData.call(this, mapId);
    };
    const _DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function(object) {
        _DataManager_onLoad.call(this, object);
        if (object === $dataMap && loadingMapId > 0) inject(object, loadingMapId);
    };
    // a map set up without the story (an old-style game that began elsewhere): its data keeps no story characters
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        if (!active() && $dataMap && $dataMap.events) {
            for (const n of Object.values(NPCS)) {
                const e = $dataMap.events[n.id];
                if (n.map === mapId && e && /<Story:/.test(e.note || "")) $dataMap.events[n.id] = null;
            }
        }
        _Game_Map_setup.call(this, mapId);
    };
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

    function introList() {
        const o = [];
        gSay(o, "No, nareszcie wstałeś! Już myślałem, że prześpisz całą wiosnę.");
        hSay(o, "Dzień dobry, dziadku. Minę masz, jakby ci lis kurę porwał.");
        gSay(o, "Gorzej. Jestem winien Lordowi Zaleskiemu - temu z pięknego dworu obok tawerny - " + DEBT + " złotych monet. Termin: dzień " + DEADLINE + ".");
        hSay(o, DEBT + "?! Coś ty kupił, dziadku, krowę ze złota?");
        gSay(o, "Nasiona, narzędzia, dach po burzy... i parę chudych lat. Jak nie oddam w terminie, Lord zabierze moje pole za lasem. A to wszystko, co mamy.");
        gSay(o, "Ja już za stary na siekierę, ale ty masz ręce i głowę. Pole jest twoje - stawiaj na nim, co zechcesz. Tylko tam: reszta ziemi w okolicy jest cudza.");
        gSay(o, "Droga: z podwórza na południe, leśną drogą do Polnej, stamtąd na południe na skraj lasu i dalej na zachód.");
        gSay(o, "A pieniądze... Borgar z tawerny „Pod Złotym Kuflem” szuka rąk do pracy, po południu i wieczorem. Z Polnej drogi ścieżką na północ. Dwór Lorda jest tuż obok - tam zanosisz spłatę.");
        hSay(o, "Czyli rano pole, wieczorem kufle. A spać kiedy?");
        gSay(o, "Na starość. Jak ja. Masz tu kapuśniak na drogę - z mojej kapusty. No, zmykaj!");
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
    const WHERE_TO_PAY = "Lord przyjmuje za dnia, od " + LORD_HOURS[0] + " do " + LORD_HOURS[1] + ", przed swoim dworem obok tawerny. Nocą zapukaj do drzwi - Feliks, jego kamerdyner, też weźmie pieniądze.";
    function grandpaList() {
        const s = state(), o = [], h = hour(), n = daysLeft();
        if (s.done && !s.flags.thanked) {
            gSay(o, "Wnuku! Feliks, kamerdyner Lorda, przyniósł pokwitowanie. Spłaciłeś wszystko, co do grosza!");
            gSay(o, "Pole zostaje przy nas. Nie wiem, jak ci dziękować... Masz, dwa kapuśniaki. Na więcej mnie nie stać - sam wiesz czemu.");
            script(o, "Story.thanks()");
            return o;
        }
        if (h >= NIGHT[0] || h < NIGHT[1]) {
            if (isOpen() && n <= 1) gSay(o, "Chrrr... Hm? Wnuku, czemu nie jesteś u Lorda?! Brakuje jeszcze " + left() + " G, a o świcie mija termin. Feliks przyjmuje pieniądze i nocą - leć!");
            else gSay(o, "Chrrr... Hm? A, to ty. Idź spać, jutro też jest dzień.");
            return o;
        }
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
        if (n <= 5) tip = WHERE_TO_PAY;   // (the last days: where the money goes comes first)
        else if (!s.flags.field) tip = "Pole jest za lasem: z podwórza na południe, leśną drogą do Polnej, potem na południe na skraj lasu i na zachód.";
        else if (!s.flags.hired) tip = "Borgar szuka ludzi do pracy. Od " + SHIFT_FROM + " do " + SHIFT_TO + " zajrzyj do „Złotego Kufla”: z Polnej drogi ścieżką na północ.";
        else tip = HINTS[s.hint++ % HINTS.length];
        gSay(o, tip);
        return o;
    }
    // the Lord: the first meeting, then what is paid and a choice of how much
    function payOptions(who) {
        const gold = $gameParty.gold(), need = left(), opts = [];
        // (a sum equal to all he has is left to "all you have")
        for (const n of [100, 500]) if (gold > n && need > n) opts.push({ label: "Oddaj " + n + " G", js: "Story.pick(this, \"" + who + "\", \"pay\", " + n + ")" });
        const all = Math.min(gold, need);
        if (all > 0) opts.push({ label: all >= need ? "Spłać cały dług (" + need + " G)" : "Oddaj wszystko, co masz (" + all + " G)", js: "Story.pick(this, \"" + who + "\", \"pay\", " + all + ")" });
        opts.push({ label: "Odejdź", js: [] });
        return opts;
    }
    // first: the Lord has just named the sum himself - no account read out, only the question
    function payList(who, spk, face, first) {
        const o = [], status = first ? "" : statusLine() + " ";
        if ($gameParty.gold() <= 0) {
            say(o, spk, status + (who === "lord" ? "Pusta sakiewka? Wróć, gdy coś zarobisz. Podobno Borgar z tawerny szuka ludzi." : "Bez pieniędzy? Jaśnie pan przyjmuje tylko monety. " + butlerBye()), face);
            return o;
        }
        say(o, spk, status + (first ? "Ile dziś przynosisz?" : "Ile dziś oddajesz?"), face);
        choose(o, payOptions(who));
        return o;
    }
    // the butler's goodbye by the hour (he also answers the door at dawn, before the Lord comes out)
    const butlerBye = () => (hour() >= LORD_HOURS[1] || hour() < 4 ? "Dobranoc." : hour() < LORD_HOURS[0] ? "Jaśnie pan przyjmuje od ósmej." : "Do widzenia.");
    function lordList(fromDoor) {
        const s = state(), o = [];
        if (fromDoor) lSay(o, "Nie pukaj, młodzieńcze - stoję tuż obok!");
        if (s.done) { lSay(o, "Pozdrów ode mnie Stacha. A gdybyś coś znalazł pod tawerną Borgara... najpierw przyjdź z tym do mnie."); return o; }
        if (s.paid >= s.debt) return o.concat(finalList(L(), NPCS.lord.face, false));   // (paid in full some other way: the end of the chapter now)
        const first = !s.flags.lordMet;
        if (first) {
            lSay(o, "Hola, hola! Kim jesteś i czemu depczesz mój dziedziniec?");
            hSay(o, "Jestem wnukiem Stacha. Przyszedłem w sprawie długu.");
            lSay(o, "Ach, Stach! Lord Leopold Zaleski, do usług... to znaczy raczej ty do moich. " + s.debt + " złotych monet, płatne do dnia " + s.deadline + ".");
            lSay(o, "Przynoś, ile masz. Feliks, mój kamerdyner, zapisze każdy grosz. Feliks zapisuje nawet to, co mówię przez sen.");
            script(o, "Story.state().flags.lordMet = true");
        } else if (daysLeft() <= 5) lSay(o, "Termin tuż-tuż, młodzieńcze. Feliks już ostrzy pióro.");
        return o.concat(payList("lord", L(), NPCS.lord.face, first));
    }
    function doorList(ev) {
        const s = state(), o = [], id = ev.eventId();
        if (npc("lord") && lordHere()) return lordList(true);
        hSay(o, "*puk, puk*");
        say(o, id, "Kto tam o tej porze? A, wnuk Stacha. Jaśnie pan " + (hour() < 12 ? "jeszcze" : "już") + " śpi.", null);
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
            script(o, "Story.state().flags.hired = true");
            script(o, "Story.pick(this, \"borgar\", \"menu\")");
            return o;
        }
        return borgarMenu(ev, true);
    }
    function borgarMenu(ev, greet) {
        const s = state(), o = [], TS = window.TavernShift, opts = [];
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
        if (window.TavernLife && TavernLife.borgarOptions) opts.push(...TavernLife.borgarOptions(ev));   // "Zjedz coś", "Wynajmij pokój" (TavernLife.js)
        opts.push({ label: "Pogadaj", js: "Story.pick(this, \"borgar\", \"chat\")" });
        opts.push({ label: "Nie teraz", js: [] });
        bSay(o, ev, line);
        choose(o, opts);
        return o;
    }
    function shiftIntro() {
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
            say(o, spk, "Pole zostaje przy was. Feliks zaniesie dziadkowi pokwitowanie - niech je sobie oprawi w ramkę.", face);
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
    }
    function pick(interp, role, what, arg) {
        const ev = $gameMap.event(interp.eventId()), s = state();
        if (!ev || !s) return;
        if (what === "pay") {
            const n = Math.min(Number(arg) || 0, $gameParty.gold(), left());
            const spk = role === "lord" ? L() : ev.eventId(), face = role === "lord" ? NPCS.lord.face : null, o = [];
            if (n <= 0) return;
            pay(n);
            if (s.paid >= s.debt) return run(interp, finalList(spk, face, role !== "lord"));
            say(o, spk, (role === "lord" ? "Feliks, zapisz: " : "Zapisuję: ") + n + " G od wnuka Stacha. Brakuje jeszcze " + left() + " G." +
                (daysLeft() <= 0 ? " O świcie termin mija." : daysLeft() <= 5 ? " Pospiesz się - termin tuż-tuż." : ""), face);
            return run(interp, o);
        }
        if (role !== "borgar") return;
        if (what === "menu") { if (inShiftHours()) run(interp, borgarMenu(ev, false)); return; }
        if (what === "chat") return run(interp, chatList(ev));
        if (what === "shop") return run(interp, shopCommands(ev));
        if (what === "shift") {
            const TS = window.TavernShift;
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
        AudioManager.playSe({ name: "Coin", volume: 80, pitch: 100, pan: 0 });
        return n;
    }
    // for other plugins and bots: a payment outside the talks - the whole debt ends chapter 1 at once (in a talk the Lord's last
    // words end it)
    function payOutside(n) {
        const got = pay(n), s = state();
        if (got > 0 && s && s.paid >= s.debt && !s.done) chapterDone();
        return got;
    }
    function introDone() {
        const s = state();
        if (!s) return;
        s.intro = 2;
        s.flags.talk = true;
        if ($dataItems[SOUP]) $gameParty.gainItem($dataItems[SOUP], 1);
        if (window.Journal && Journal.addNote) {
            Journal.addNote("Dług dziadka Stacha", "Dziadek jest winien Lordowi Leopoldowi Zaleskiemu " + s.debt + " G. Termin: dzień " + s.deadline +
                " (pieniądze przyjmą jeszcze w nocy po nim, do świtu) - potem Lord zabierze jego pole za lasem.\nNa tym polu mogę budować (i tylko tam).\n" +
                "Borgar z tawerny „Pod Złotym Kuflem” daje pracę po południu i wieczorem, od " + SHIFT_FROM + " do " + SHIFT_TO + ".\n" +
                "Spłatę zanoszę do dworu Lorda, obok tawerny: za dnia (" + LORD_HOURS[0] + "-" + LORD_HOURS[1] + ") Lordowi, nocą kamerdynerowi.\n" +
                "Droga na pole: podwórze - Leśna droga - Polna droga - Skraj lasu - pole.\n" +
                "Droga do tawerny: podwórze - Leśna droga - Polna droga - ścieżką na północ. Dwór Lorda stoi na wschód od tawerny.");
        }
    }
    function thanks() {
        const s = state();
        if (!s) return;
        s.flags.thanked = true;
        if ($dataItems[SOUP]) $gameParty.gainItem($dataItems[SOUP], 2);
    }
    function chapterDone() {
        const s = state();
        if (!s || s.done) return;
        s.done = day();
        if (window.Combat && Combat.gainXp && REWARD_XP > 0) Combat.gainXp(REWARD_XP, "rozdział 1");
        if ($gameTemp.pushTopNotice) $gameTemp.pushTopNotice("Rozdział 1 zakończony: dług dziadka spłacony!", U().accent, { sub: "Pole zostaje przy was." });
        AudioManager.playMe({ name: "Victory1", volume: 70, pitch: 100, pan: 0 });
        if (window.Journal && Journal.addNote) {
            Journal.addNote("Pokwitowanie od Lorda", "Dług dziadka spłacony w dniu " + s.done + ": " + s.debt + " G. Pole zostaje przy nas.\nW dworze wspomnieli, że zbudowano go z kamieni dawnej twierdzy - Kruczych Skał - a najstarsze z nich leżą pod tawerną Borgara. Pod Kruczymi Skałami są podobno drzwi, których nikt nie powinien otwierać.\nLord nie żartował. Chce, żebym przyszedł najpierw do niego, jeśli coś znajdę. Ciekawe, dlaczego...");
        }
        if (window.Journal && Journal.evaluateGoals) Journal.evaluateGoals();
    }

    // ------------------------------------------------------------------
    // New game, loading, the first map
    // ------------------------------------------------------------------
    const _setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _setupNewGame.call(this);
        $gameSystem._story = newState();   // (kept only when the game really begins in grandpa's house - see performTransfer)
        syncGoals();
    };
    const _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _extractSaveContents.call(this, contents);
        const s = state();
        if (s && s.intro === 1) s.intro = 0;   // (a talk cut off by a reload is told again)
        if (s) s.lastShift = null;
        syncGoals();
    };
    const _performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const s = state();
        if (s && s.pending && this.isTransferring()) {
            if (this._newMapId === MAP.house) delete s.pending;
            else delete $gameSystem._story;   // an old-style start somewhere else: no story at all
            syncGoals();
        }
        _performTransfer.call(this);
        if (active()) onArrive($gameMap.mapId());
    };
    function onArrive(mapId) {
        const s = state();
        if (mapId === MAP.field && !s.flags.field) {
            s.flags.field = true;
            if (window.SpeechBubbles) SpeechBubbles.say($gamePlayer, "Więc to jest pole dziadka...", 200);
        }
        if (mapId === MAP.tavern) s.flags.tavern = true;
        if (mapId === MAP.cellar) s.flags.cellar = true;
        if (mapId === MAP.manor) s.flags.manor = true;
    }
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
    function chapterIndex() {
        const J = window.Journal;
        if (!J || !J.CHAPTERS) return 0;
        let i = J.CHAPTERS.indexOf(CHAPTER);
        if (i < 0) i = J.CHAPTERS.push(CHAPTER) - 1;
        return i;
    }
    function storyGoals() {
        const ch = chapterIndex();
        return {
            talk: { id: "story_talk", story: true, ch, title: "Porozmawiaj z dziadkiem", item: SOUP, after: [], done: () => !!(state() && state().flags.talk),
                text: "Dziadek Stach czeka w swoim domu. Ma ci coś ważnego do powiedzenia." },
            field: { id: "story_field", story: true, ch, title: "Dojdź na pole dziadka", item: 67, after: ["story_talk"], done: () => !!(state() && state().flags.field),
                text: "Z podwórza na południe, leśną drogą do Polnej, stamtąd na południe na skraj lasu i dalej na zachód. Tylko na tym polu wolno ci budować." },
            work: { id: "story_work", story: true, ch, title: "Znajdź pracę w tawernie", item: 81, after: ["story_field"], done: () => !!(state() && state().flags.hired),
                text: "Borgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy. Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim." },
            shift: { id: "story_shift", story: true, ch, title: "Przepracuj zmianę u Borgara", item: 81, after: ["story_work"],
                done: () => !!(window.TavernShift && TavernShift.stats().done > 0),
                text: "Zmiany są po południu i wieczorem, od " + SHIFT_FROM + " do " + SHIFT_TO + ", jedna dziennie. Sprzątanie, beczka, kuchnia i sala - płaci od roboty, a goście dają napiwki." },
            shelter: { id: "story_shelter", story: true, ch, title: "Zbuduj schronienie na polu", item: 121, after: ["story_field"],
                done: () => farmBuilt(MAP.field, SHELTERS) || farmBuilt(100, ["bed"]),
                text: "Na polu dziadka postaw legowisko, namiot, wiatę albo chatkę. Noc pod gołym niebem męczy i bywa niebezpieczna." },
            cellar: { id: "story_cellar", story: true, ch, title: "Drzwi pod Kruczymi Skałami", item: TORCH, after: ["story_debt"],
                done: () => !!(state() && state().flags.cellar),
                text: "Lord mówił poważnie: najstarsze kamienie dawnej twierdzy leżą pod tawerną Borgara, a pod Kruczymi Skałami są drzwi, których nikt nie powinien otwierać. Rozejrzyj się w tawernie - może jest tam zejście do piwnic." },
            debt: { id: "story_debt", story: true, ch, icon: GOLD_ICON, after: ["story_talk"], done: () => !!(state() && (state().done || state().paid >= state().debt)),
                get title() { const s = state(); return s ? "Spłać dług dziadka (" + Math.min(s.paid, s.debt) + "/" + s.debt + " G)" : "Spłać dług dziadka"; },
                get text() {
                    const s = state();
                    if (!s) return "Dług dziadka.";
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
    function syncGoals() {
        const J = window.Journal;
        if (!J || !J.GOALS) return;
        const GOALS = J.GOALS, want = active(), has = GOALS.some(g => g.story);
        if (want === has) return;
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

    // ------------------------------------------------------------------
    // On the map: the intro, the Lord's hours, the letters, the deadline
    // ------------------------------------------------------------------
    function calm(scene) {
        return !SceneManager.isSceneChanging() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() && !$gamePlayer.isTransferring() &&
            !$gameTemp._pendingSummary && !(scene.isFading && scene.isFading()) && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode &&
            !(window.TavernShift && TavernShift.isRunning()) && !($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging());   // (a rest or a blow: when he is up)
    }
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
        if (d >= s.deadline) return "Uprzejmie przypominam, że dziś mija termin spłaty długu (" + sum + "). Feliks przyjmie pieniądze jeszcze tej nocy, do świtu. O świcie moi ludzie przyjdą zmierzyć pole.";
        if (d >= s.deadline - 1) return "Pojutrze o świcie pole przechodzi na własność dworu, chyba że wcześniej zobaczę " + sum + ". Feliks już grzeje lak do pieczęci.";
        if (d >= s.deadline - 5) return "Do terminu " + daysPhrase(n) + ". Brakuje " + sum + ". Feliks ostrzy pióro do aktu przejęcia pola - proszę go do tego nie zmuszać.";
        return "Uprzejmie przypominam o długu Stacha: " + sum + " do dnia " + s.deadline + ". Do terminu " + daysPhrase(n) + ". Z wyrazami szacunku, Leopold Zaleski. PS. Feliks pozdrawia.";
    }
    function updateLetters() {
        const s = state(), today = day();
        if (!isOpen() || hour() < 6) return;
        const due = LETTERS_BEFORE.map(k => s.deadline - k).filter(d => d >= 2 && d <= today && !s.letters[d]);
        if (!due.length) return;
        for (const d of due) s.letters[d] = true;
        const d = Math.max(...due);
        if ($gameTemp.pushTopNotice) $gameTemp.pushTopNotice("List od Lorda Zaleskiego", U().accent, { sub: "Do spłaty " + left() + " G - " + daysPhrase(daysLeft()) + ". (Dziennik: Notatki)" });
        if (window.Journal && Journal.addNote) Journal.addNote("List od Lorda (dzień " + today + ")", letterText(d));
        s.lastLetter = today;
    }
    function checkDeadline() {
        const s = state();
        if (!doomed($gameSystem) || s.ended) return false;
        s.ended = day();
        $gameTemp._atmoAutosave = false;
        $gameMap._interpreter.setup(end(endingList()), 0);
        return true;
    }
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        this._storyT = 0;
        syncGoals();
    };
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!active() || !$gameMap) return;
        this._storyT = (this._storyT || 0) + 1;
        const s = state();
        if (this._storyT % 30 === 0 && $gameMap.mapId() === MAP.manor) syncLord();
        if (!calm(this)) return;
        if (s.intro !== 2 && $gameMap.mapId() === MAP.house && this._storyT > 40 && npc("grandpa")) { startIntro(); return; }
        if (checkDeadline()) return;
        if (this._storyT % 20 === 0) updateLetters();
    };
    // after the deadline, unpaid: nothing more is saved (an autosave would keep a lost game)
    const _isSaveEnabled = Game_System.prototype.isSaveEnabled;
    Game_System.prototype.isSaveEnabled = function() {
        return _isSaveEnabled.call(this) && !doomed(this);
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
        if (s.done || s.paid >= s.debt) return "spłacony · pole zostaje przy was";
        return s.paid + " / " + s.debt + " G  ·  " + (short ? "" : "do dnia " + s.deadline + "  ·  ") + daysPhrase(daysLeft());
    }
    // how far in from the panel's left the key hints reach, with the gap after the last one (measured as MenuPanel draws them)
    function hintsWidth(b, hints) {
        let w = 24;
        for (const [key, what] of hints || []) {
            b.fontSize = 16;
            w += Math.max(26, Math.ceil(b.measureTextWidth(key)) + 14) + 8;
            b.fontSize = 18;
            w += Math.ceil(b.measureTextWidth(what)) + 24;
        }
        return w;
    }
    function drawDebtFoot(b, r, foot, hints) {
        const s = state(), S = U(), ctx = b.context, paidAll = s.done || s.paid >= s.debt;
        const y = r.y + r.height - foot + 9, right = r.x + r.width - 26, room = r.width - 26 - hintsWidth(b, hints);
        const colour = paidAll ? "#9ff0a8" : daysLeft() <= 5 ? "#ff9f8f" : S.text;
        b.fontSize = 15;
        const label = "DŁUG DZIADKA", lw = Math.ceil(b.measureTextWidth(label)), bw = 80;
        b.fontSize = 17;
        const full = debtText(false), short = debtText(true), wf = Math.ceil(b.measureTextWidth(full)), ws = Math.ceil(b.measureTextWidth(short));
        // what fits beside the keys: all of it; without the day of the deadline; then without the label; then the text alone
        const tries = [[full, wf, true, true], [short, ws, true, true], [short, ws, true, false], [short, ws, false, false]];
        const [text, tw, withBar, withLabel] = tries.find(([, w, bar, lab]) => w + (bar ? 12 + bw : 0) + (lab ? 10 + lw : 0) <= room) || tries[tries.length - 1];
        b.textColor = colour;
        b.drawText(text, right - tw, y - 1, tw + 4, 26, "left");
        let x = right - tw - 12;
        if (withBar && S.bar) { S.bar(ctx, x - bw, y + 8, bw, 8, Math.min(1, s.paid / s.debt), paidAll ? "#62c66a" : S.accent); x -= bw + 10; }
        if (withLabel) { b.fontSize = 15; b.textColor = S.muted; b.drawText(label, x - lw, y, lw + 4, 24, "left"); }
        b.fontSize = 22;
        lastMenuLine = text;
        lastMenuLabel = withLabel;
    }
    const MP = window.MenuPanel;
    if (MP && MP.Sprite_MenuPanel) {
        const _redraw = MP.Sprite_MenuPanel.prototype.redraw;
        MP.Sprite_MenuPanel.prototype.redraw = function() {
            _redraw.call(this);
            if (this._spec && this._spec.storyDebt && active()) drawDebtFoot(this.bitmap, this._spec.rect, MP.FOOT || 42, this._spec.hints);
        };
        const _Scene_Menu_create = Scene_Menu.prototype.create;
        Scene_Menu.prototype.create = function() {
            _Scene_Menu_create.call(this);
            if (active() && this._menuPanel && this._menuPanel._spec && this._menuPanel._spec.hints) this._menuPanel.set({ storyDebt: true });
        };
    } else {   // (without MenuPanel.js: a line under the status card)
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
            if (!isOpen() || !this._dayBanner || daysLeft() < 1) return;
            const add = "do spłaty " + left() + " G, " + daysPhrase(daysLeft());
            this._dayBanner.text = (this._dayBanner.text ? this._dayBanner.text + "   ·   " : "") + add.charAt(0).toUpperCase() + add.slice(1);
            this._lastDayBanner = this._dayBanner.title + " " + this._dayBanner.text;
        };
    }

    chapterIndex();
    window.Story = {
        NPCS, MAP, DEBT, DEADLINE, DAWN, LETTERS_BEFORE, state, active, left, daysLeft, lastNight, isOpen, statusLine, newState, pay: payOutside, talk, pick,
        introDone, thanks, chapterDone, startIntro, checkDeadline, showEnding, syncGoals, npc, doorEvent, borgarEvent, roleOf, doomed: () => doomed($gameSystem),
        lists: { intro: introList, grandpa: grandpaList, lord: lordList, borgar: ev => borgarList(ev), chat: ev => chatList(ev), ending: endingList },
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
    };
})();
