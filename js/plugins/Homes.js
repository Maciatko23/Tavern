//=============================================================================
// Homes.js
//=============================================================================
// Whose the land is (the user, 2026-10-15: "niespłacony dług NIE kończy gry"):
//   - grandpa's field lost to the Lord (Story.js decides when and says the words): the Lord's men on the field for the scene (the
//     butler - Feliks, or Teodor once Feliks is gone - and two guards in the Lord's colours, hidden till the scene shows them),
//     the sign "Własność Lorda Zaleskiego" (!$Lord_Sign: the Lord's banner on a pole), a guard by it for the days of carrying things
//     off; then the field shut - a guard at both ways in (Skraj lasu, Łąka), every transfer onto it refused with a popup over the
//     hero; the hut's furniture stays in the hut with the field (a new hut may go up on the hero's own land), the dog comes along,
//     the yards' animals may be sold or taken in those days (Farming's menu); nothing on the field is deleted: bought back, it is
//     all the hero's again (the old hut boarded up if a new one stands meanwhile: taking it down gives back its furniture)
//   - two homes with land, for anyone, story or not, debt paid or not (the user 2026-10-15: no house in the town - "gdzie tam
//     miejsce na pole z tyłu"):
//       "Chata pod lasem" on Podgrodzie (Map111's rows added at the bottom by tools/domy/podgrodzie_zagroda.py): a log hut and a
//       fenced plot of 20 x 12 beside it, sold by the sołtys (8-16) for 600 G; the room Map154 (its bed and chest: Farming's,
//       put in at the purchase);
//       "Spalona zagroda" of the Ług family (Map168, west of Skraj lasu): bought through the quest D21 (Józek Łata's story, Marta,
//       the sołtys: 350 G - to the Lord, or by the old law through Marta), ~780 cells of land, the burnt house rebuilt by hand in
//       five stages (materials + blows, like a building site; the picture "!$Zagroda_Dom" shows the stage), then its room Map169.
//     Their land is region 8 of the map (<BuildRegion:8>): only there, only the owner's, Farming builds, digs and sows. Bought, it
//     is clean (nothing wild lying there at first, then things grow as anywhere). No well, no water (drought rule): the farm's old
//     well dug out is dry.
// Map files of the user (Map003, Map023, Map004, Map111's old part) are not changed: the people, the sign, the guards, the way to
// the farm and its signpost are events put into the map data as it loads (Tawerna.inject, ids 700-729).

/*:
 * @target MZ
 * @plugindesc Ziemia: działka dziadka po stracie (ludzie Lorda, znak, dni na wyniesienie dobytku, straż), Chata pod lasem u sołtysa i Spalona zagroda Ługów do odbudowy (zadanie D21). v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Farming
 * @orderAfter Livestock
 * @orderAfter Dog
 * @orderAfter Story
 * @orderAfter TownLife
 * @orderAfter TownQuests
 *
 * @param priceHut
 * @text Cena Chaty pod lasem (G)
 * @desc Podgrodzie, chata z bali z działką obok (sprzedaje sołtys).
 * @type number
 * @min 1
 * @default 600
 *
 * @param priceFarm
 * @text Cena Spalonej zagrody (G)
 * @desc Zadanie D21: od dworu albo przez Martę - ta sama kwota.
 * @type number
 * @min 1
 * @default 350
 *
 * @help
 * ============================================================================
 * Homes.js - działka dziadka po stracie, Chata pod lasem i Spalona zagroda
 * ============================================================================
 * DZIAŁKA (gra z fabułą, Story.js): gdy o świcie po terminie dług nie jest
 * spłacony, działka przechodzi na Lorda. Na działce (mapa 3, Kruczy Jar) pojawiają się na
 * scenę ludzie Lorda: kamerdyner (Feliks albo Teodor) i dwóch strażników;
 * stawiają znak „Własność Lorda Zaleskiego”. Jeden strażnik zostaje przy
 * znaku na dni wynoszenia dobytku (parametr Story.js, domyślnie 3). W te
 * dni: plony, skrzynie, rozbiórka (połowa materiałów, jak zawsze), w menu
 * zagrody „Sprzedaj zwierzęta” albo „Zabierz zwierzęta” (zamieszkają w nowej
 * zagrodzie tego rodzaju, postawionej na własnej ziemi), pies. Budować na
 * działce już nie wolno. Potem działka jest zamknięta: strażnik przy wejściach
 * (Skraj lasu, Łąka), przejście odmawia dymkiem „Działka należy teraz do
 * Lorda.”. Meble chatki zostają w niej (należą do działki); nową chatkę można
 * postawić na własnej ziemi. Pies, którego buda została na działce, idzie z
 * bohaterem. Nic nie jest kasowane: po odkupie (Story.js) działka wraca z tym,
 * co na niej zostało.
 *
 * CHATA POD LASEM (Podgrodzie, na dole mapy, drzwi 6,40) - 600 G u sołtysa
 * (8-16, przed ratuszem albo w środku; w rozmowie pozycja „Domy na
 * sprzedaż”, gdy bohater już o nich słyszał): izba z paleniskiem, łóżko i
 * mała skrzynia; obok ogrodzona działka 20 x 12.
 *
 * SPALONA ZAGRODA (mapa 168, na zachód od Skraju lasu): zadanie D21 -
 * zgliszcza albo krzyż, Józek Łata, Marta Ługowa, sołtys (350 G: od dworu,
 * Opinia -2, albo po staremu przez Martę, Opinia +5). Potem odbudowa domu
 * w pięciu etapach (akcja przy zgliszczach): uprzątnięcie (łopata albo
 * siekiera; z gruzu kamień, drewno, gwoździe i osmalony konik Franka -
 * oddany Marcie, Opinia +2), podmurówka, ściany z bali, dach, drzwi z
 * paleniskiem (młotek). Gotowy dom: dym z komina, izba (mapa 169) z
 * łóżkiem, dużą skrzynią i kredensem. Stara studnia: do odkopania, sucha.
 * Marta przychodzi czasem na grób męża (co 7 dni, 15-18).
 *
 * Ziemia obu domów to region 8 mapy (notatka <BuildRegion:8>): tylko tam i
 * tylko właściciel buduje, kopie i sieje - wszystko, także chatkę (jedna na
 * grę). Przy kupnie jest czysta, potem rośnie na niej jak wszędzie.
 *
 * Mapy: 154 Chata pod lasem (izba), 168 Spalona zagroda, 169 Dom Ługów
 * (tools/domy/build.py, ruina.py, podgrodzie_zagroda.py, install.py).
 * Zdarzenia 700-729 dopisywane przy wczytaniu mapy (rezerwacja w
 * TawernaCore.js).
 *
 * Dla innych wtyczek i testów: Homes.HOUSES, owns(key), ownsAny(),
 * homeLand(), buy(interp, key) / buyNow(key), grantLand(key, how), hear(),
 * stage(), work(), castReady(), castShow(), signShow(), castLeave(),
 * door(interp, key), ruin(interp). Szyna: homeBought { key },
 * zagrodaStage { stage }.
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("domy");   // (the words of this file: js/teksty/domy.txt, kod.*)

    const PLUGIN = "Homes";
    const T = window.Tawerna;
    if (!T) throw new Error("Homes.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));

    const FIELD = 3, HUT_MAP = 100, EDGE = 23, MEADOW = 4, PODGRODZIE = 111, ZAGRODA = 168;
    const IDS = [700, 729];
    const CAST = { butler: 700, measurer: 701, watch: 702 };
    const SIGN = 703, GUARD_EDGE = 704, GUARD_MEADOW = 705;
    const WAY = [706, 707, 708], SIGNPOST = 709, SMOKE = 711, MARTA = 712;
    const SALE_HOURS = [8, 16];
    const GOLD_ICON = 313;
    const BUILD_REGION = 8;
    // the yards' animals sold in the carrying-out days (a buyer from the town): G an animal
    const PRICE = { cow: 60, sheep: 30, hen: 8 };
    const ANIMALS = {};
    Watki.scal(ANIMALS, "domy", "zwierzeta");   // (its words: js/teksty/domy.txt, zwierzeta)
    // the homes: the map of their land (region 8 there), the room (its landing from the door), the furniture Farming draws and runs,
    // put in at the purchase - the farm's when the house is rebuilt (tools/domy/build.py keeps their cells free)
    const HOUSES = {
        chata: { key: "chata", price: num(params.priceHut, 600), soltys: true,
            land: PODGRODZIE, doorName: /Chata pod lasem/, front: [8, 81], inside: 154, landing: [4, 8, 8],
            furniture: [{ type: "bed", x: 7, y: 4 }, { type: "chest_s", x: 9, y: 4 }] },
        zagroda: { key: "zagroda", price: num(params.priceFarm, 350), soltys: false,
            land: ZAGRODA, front: [20, 10], inside: 169, landing: [6, 8, 8],
            furniture: [{ type: "bed", x: 9, y: 4 }, { type: "larder", x: 11, y: 4 }, { type: "chest_l", x: 1, y: 4 }] }
    };
    Watki.scal(HOUSES, "domy", "domy");   // (its words: js/teksty/domy.txt, domy)
    const KEYS = Object.keys(HOUSES);
    const houseOfLand = mapId => KEYS.map(k => HOUSES[k]).find(h => h.land === mapId) || null;
    const houseOfRoom = mapId => KEYS.map(k => HOUSES[k]).find(h => h.inside === mapId) || null;

    // the burnt house: the work from one stage to the next (materials taken at the start, then blows like a building site's)
    const STAGE_NAMES = [];
    Watki.scal(STAGE_NAMES, "domy", "etapy");   // (its words: js/teksty/domy.txt, etapy)
    const WORK = [
        { cost: [], hits: 30, clear: true, yield: [[64, 12], [61, 6], [88, 6]] },
        { cost: [[64, 30], [164, 8]], hits: 30 },
        { cost: [[61, 30], [88, 30]], hits: 50 },
        { cost: [[80, 20], [92, 25], [88, 20]], hits: 40 },
        { cost: [[80, 12], [86, 4], [84, 12]], hits: 30 }
    ];
    Watki.scal(WORK, "domy", "prace");   // (its words: js/teksty/domy.txt, prace)
    const WELL_HITS = 15;
    const ITEM = { stone: 64, wood: 61, nails: 88, shovel: 62, axe: 60, ironAxe: 115, steelAxe: 407, hammer: 89 };
    const KIND = { hammer: 7, shovel: 2, axe: 0 };

    // state: owned { key: day }, heard (the day he first heard of the homes), told (the sołtys's long words said), herd { animal: n }
    // (animals taken off the lost field, waiting for a new yard), bark (the day the sołtys last cried the hut), clean { mapId: day }
    // (the land bought: its wild things gone that day - put on the map when it is next entered), zag { stage, work: { i, need, done },
    // well, wellDone, seen, how: "lord" | "marta" }
    const store = T.state.define("homes", () => ({ owned: {}, heard: 0, told: 0, herd: {}, bark: 0, clean: {}, zag: { stage: 0, work: null, well: 0, wellDone: 0, seen: 0, how: null } }),
        { version: 2, owner: PLUGIN, migrate: (s, from) => {
            if (from < 2) {   // (v1.0.0: the town house and the plank hut - never sold in a released game; the field part is as it was)
                s.owned = {}; s.clean = {}; s.purge = [154, 169, 170];
                s.zag = { stage: 0, work: null, well: 0, wellDone: 0, seen: 0, how: null };
            }
            return s;
        } });
    const S = () => { const s = store(); if (!s.zag) s.zag = { stage: 0, work: null, well: 0, wellDone: 0, seen: 0, how: null }; if (!s.clean) s.clean = {}; return s; };
    const Z = () => S().zag;
    const day = () => T.time.day();
    const hour = () => T.time.hour();
    const owns = key => !!S().owned[key];
    const ownsAny = () => KEYS.some(owns);
    const forSale = () => KEYS.filter(k => HOUSES[k].soltys && !owns(k));
    const stage = () => Math.max(0, Math.min(5, Z().stage || 0));
    // the hero's own land for the compass and the goals: grandpa's field while it is his, else the first land he owns
    function homeLand() {
        const St = story();
        if (St && !St.fieldLost()) return FIELD;
        const k = KEYS.find(owns);
        return k ? HOUSES[k].land : St ? null : FIELD;
    }

    const F = () => T.api("Farming");
    const story = () => { const St = T.api("Story"); try { return St && St.active && St.active() ? St : null; } catch (e) { return null; } };
    const storyGame = () => { const St = T.api("Story"); try { return !!(St && St.state && St.state()); } catch (e) { return false; } };
    const fieldLost = () => { const St = story(); return !!St && St.fieldLost(); };
    const fieldLocked = () => { const St = story(); return !!St && St.fieldLocked(); };
    const butlerName = () => (window.TownLife && typeof TownLife.gone === "function" && TownLife.gone("feliks") ? "Teodor" : "Feliks");
    const sw = (mapId, id, on) => $gameSelfSwitches.setValue([mapId, id, "A"], !!on);
    const swOn = (mapId, id) => !!$gameSelfSwitches.value([mapId, id, "A"]);
    const itemOf = id => $dataItems[id];
    const iconOf = id => (itemOf(id) ? itemOf(id).iconIndex : 0);
    const countOf = id => (itemOf(id) ? $gameParty.numItems(itemOf(id)) : 0);
    let popAt = 0;
    const popupOnce = (text, opts) => { if (Graphics.frameCount - popAt < 60) return; popAt = Graphics.frameCount; T.popup(text, opts); };

    // ------------------------------------------------------------------
    // Event commands (talks in speech bubbles)
    // ------------------------------------------------------------------
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const end = out => (out.push(C(0, [])), out);
    let probe = null;
    function wrap(text) {
        if (!probe) probe = new Bitmap(8, 8);
        probe.fontFace = $gameSystem.mainFontFace();
        probe.fontSize = $gameSystem.mainFontSize();
        const lines = [];
        let line = "";
        for (const word of String(text).replace(/(\d) G\b/g, "$1 G").split(" ")) {
            const trial = line ? line + " " + word : word;
            if (line && probe.measureTextWidth(trial) > 540) { lines.push(line); line = word; } else line = trial;
        }
        lines.push(line);
        return lines;
    }
    function say(out, who, text, name) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += 3) {
            out.push(C(101, ["", 0, 0, 2, name || ""]));
            lines.slice(i, i + 3).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + who + "]" : "") + l])));
        }
        return out;
    }
    function choose(out, options, cancel) {
        out.push(C(102, [options.map(o => o.label), cancel === undefined ? options.length - 1 : cancel, 0, 2, 0]));
        options.forEach((o, i) => {
            out.push(C(402, [i, o.label]));
            for (const js of [].concat(o.js || [])) out.push(C(355, [js], 1));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        return out;
    }

    // ------------------------------------------------------------------
    // Farming: whose the land is (the field shut: someone else's - its hut no longer counts, nothing is built there from the loss on;
    // a home's land: region 8 of its map, only its owner's)
    // ------------------------------------------------------------------
    function fieldHut() {
        const f = F(), list = f && f.farm ? ((f.farm().buildings || {})[FIELD] || []) : [];
        return list.find(b => b.type === "hut" && !b.boarded) || null;
    }
    const rule = {
        held: mapId => mapId === FIELD && fieldLocked(),
        own(mapId) { const h = houseOfLand(mapId); return h ? owns(h.key) : undefined; },
        refuse(mapId) {
            if (fieldLost()) {
                if (mapId === FIELD) return TK.kod.refuse[0];
                if (mapId === HUT_MAP) { const h = F().hutOf ? F().hutOf() : null; if (h && h.mapId === FIELD) return TK.kod.refuse[0]; }
            }
            const house = houseOfLand(mapId);
            if (house && !owns(house.key)) return TK.kod.refuse[1];
            return null;
        },
        noBuild: () => (ownsAny() || (storyGame() && T.call("Story", "state") && T.call("Story", "state").lost) ? TK.kod.noBuild[0] : null)
    };
    if (F() && F().addLandRule) F().addLandRule(rule);

    // ------------------------------------------------------------------
    // The events put into the maps' data (ids 700-729): the Lord's men and the sign on the field (hidden till their self switch A),
    // the guards at the ways in (from the dawn that shuts the field), the way from Skraj lasu to the burnt farm and its signpost, the
    // farm's chimney smoke (the house rebuilt) and Marta at her husband's grave
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function page(image, list, extra) {
        return Object.assign({ conditions: Object.assign({}, BLANK), directionFix: false, image: Object.assign({ tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 1 }, image || {}),
            list: list || [C(0, [])], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }, extra || {});
    }
    const onA = { conditions: Object.assign({}, BLANK, { selfSwitchValid: true, selfSwitchCh: "A" }) };
    const hidden = () => page({}, null, { priorityType: 0, through: true });
    // someone shown while its self switch A is on (nothing there otherwise)
    function shownOnA(id, name, x, y, image, list, extra) {
        return { id, name, note: "<Homes:" + id + ">", x, y, pages: [hidden(), page(image, list, Object.assign({}, onA, extra || {}))] };
    }
    const stub = js => [C(355, [js]), C(0, [])];
    // (the words read by name: the sign of the field, the sołtys as a speaker, the burnt horse of D21)
    const WORDS = {};
    Watki.scal(WORDS, "domy", "slowa");   // (its words: js/teksty/domy.txt, slowa)
    // where the sign stands: by the way in from the forest's edge (east), on a cell no building of the field covers
    const SIGN_SPOTS = [[37, 11], [36, 11], [37, 15], [36, 15], [35, 11], [35, 15], [34, 11], [37, 10], [37, 16]];
    function fieldCellsTaken() {
        const f = F(), taken = new Set();
        if (!f || !f.farm) return taken;
        for (const b of (f.farm().buildings || {})[FIELD] || []) for (const c of f.cellsOfGeo(f.geoOf(b), b.x, b.y)) taken.add(c.x + "," + c.y);
        return taken;
    }
    function signSpot() {
        const taken = fieldCellsTaken();
        return SIGN_SPOTS.find(([x, y]) => !taken.has(x + "," + y)) || SIGN_SPOTS[0];
    }
    T.inject([FIELD], { ids: [CAST.butler, SIGN], owner: PLUGIN, when: () => storyGame(), build() {
        const b = butlerName(), [sx, sy] = signSpot();
        return [
            shownOnA(CAST.butler, b, 37, 12, { characterName: b === "Teodor" ? "$Npc_Kamerdyner" : "$Npc_Feliks" }, null, { through: true }),
            shownOnA(CAST.measurer, TK.kod.build[0], 37, 13, { characterName: "$Npc_Straznik" }, null, { through: true }),
            shownOnA(CAST.watch, TK.kod.build[0], 37, 14, { characterName: "$Npc_Straznik" }, stub("Story.talk(this, \"watch\")")),
            shownOnA(SIGN, TK.kod.build[1], sx, sy, { characterName: "!$Lord_Sign", direction: 2, pattern: 1 },
                stub("Tawerna.popup(" + JSON.stringify(WORDS.znak) + ", { color: \"info\" })"), { stepAnime: true, walkAnime: false, moveSpeed: 2, moveFrequency: 2 })
        ];
    } });
    // the guards at the two ways onto the field (shown once it is shut)
    const GUARD_TALK = "Tawerna.call(\"Homes\", \"guardTalk\", this)";
    T.inject([MEADOW], { ids: [GUARD_MEADOW, GUARD_MEADOW], owner: PLUGIN, when: () => storyGame(), build: () => [
        // (2026-10-18) Łąka (Map004) doubled to 80x60: its south exit to the field moved from row 29 to row 59 - he stands beside it
        shownOnA(GUARD_MEADOW, TK.kod.build[0], 27, 58, { characterName: "$Npc_Straznik", direction: 4 }, stub(GUARD_TALK))] });
    // Skraj lasu: the guard (story), the way west to the burnt farm (its west edge above the way onto the field: the open grass of
    // rows 6-8, the user's tiles untouched) and the signpost by it (everyone)
    T.inject([EDGE], { ids: [GUARD_EDGE, SIGNPOST], owner: PLUGIN, build() {
        const out = WAY.map((id, i) => ({ id, name: TK.kod.build[2], note: "", x: 0, y: 6 + i,
            // (2026-10-18: the burnt farm doubled to 100x72 - its east edge is x 99, one inside it 98)
            pages: [page({ characterName: "" }, [C(201, [0, ZAGRODA, 98, 11 + i, 4, 0]), C(0, [])], { priorityType: 0, trigger: 1, walkAnime: false })] }));
        out.push({ id: SIGNPOST, name: TK.kod.build[3], note: "", x: 1, y: 5,
            pages: [page({ characterName: "!$Drogowskaz", direction: 2, pattern: 1 }, stub("Tawerna.call(\"Homes\", \"signpost\")"), { directionFix: true, walkAnime: false })] });
        if (storyGame()) out.push(shownOnA(GUARD_EDGE, TK.kod.build[0], 1, 11, { characterName: "$Npc_Straznik", direction: 2 }, stub(GUARD_TALK)));
        return out;
    } });
    // the burnt farm: the chimney's smoke once the house is rebuilt, Marta at the cross (her husband's grave) some afternoons
    // (2026-10-23, the user: chimney smoke badly placed) the rebuilt house draws its own chimney: smoke only (no second stone block),
    // its base at the chimney's opening (the house 20,9: the opening at x 901, y 271 in the map's pixels)
    const smokeEv = () => {
        const e = shownOnA(SMOKE, TK.kod.smokeEv[0], 18, 5, { characterName: "!$Dym_Komin", direction: 2, pattern: 1 }, null,
            { priorityType: 2, through: true, stepAnime: true, walkAnime: false, directionFix: true, moveSpeed: 3, moveFrequency: 3 });
        e.note += "<Px:14,-15>";
        return e;
    };
    T.inject([ZAGRODA], { ids: [SMOKE, MARTA], owner: PLUGIN, build: () => [
        smokeEv(),
        shownOnA(MARTA, TK.kod.build[4], 33, 5, { characterName: "$Npc_Praczka", direction: 6 }, stub("Tawerna.call(\"Homes\", \"martaTalk\", this)"),
            { directionFix: false, walkAnime: true })
    ] });
    // Podgrodzie's "Chata pod lasem" (the door Map111 got with its new rows): its words while it is for sale, the way in once bought
    const roles = new WeakMap();
    function roleOf(ev) {
        if (roles.has(ev)) return roles.get(ev);
        const d = ev.event();
        let r = null;
        if (d && ev._mapId === PODGRODZIE && HOUSES.chata.doorName.test(d.name || "")) r = "chata";
        else if (d && ev._mapId === ZAGRODA && /^<Zagroda:dom>/.test(d.note || "")) r = "house";
        roles.set(ev, r);
        return r;
    }
    const CHATA_STUB = stub("Tawerna.call(\"Homes\", \"door\", this, \"chata\")");
    // (2026-10-23) the core's one list hook: a scene at a door, after Kantor's, before TownQuests' (as the old wrappers)
    T.onEventList(ev => (roleOf(ev) === "chata" ? CHATA_STUB : null), { owner: PLUGIN, priority: T.onEventList.PRIORITY.scene + 10 });
    // the farm's house: its picture's frame is the stage (0-2 on the "down" row, 3-5 on the "left" one of !$Zagroda_Dom)
    const _setupPageSettings = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _setupPageSettings.call(this);
        if (roleOf(this) === "house") showStage(this);
    };
    function showStage(ev) {
        const s = stage(), d = s < 3 ? 2 : 4, p = s % 3;
        ev._originalDirection = d; ev._direction = d;
        ev._originalPattern = p; ev._pattern = p;
    }
    const houseEvent = () => (window.$gameMap && $gameMap.mapId() === ZAGRODA ? $gameMap.events().find(e => roleOf(e) === "house") || null : null);

    // a door of a home: for sale - the words over the hero (and he has heard of it); his own - in (the door opens, as the town's do)
    function door(interp, key) {
        const h = HOUSES[key];
        if (!h || !interp) return;
        if (!owns(key)) {
            S().heard = S().heard || day();
            popupOnce(Watki.wstaw(TK.kod.door[0], { price: h.price }), { color: "info" });
            return;
        }
        goIn(interp, h, true);
    }
    function goIn(interp, h, opening) {
        const [x, y, d] = h.landing;
        const open = { list: [{ code: 36 }, { code: 17 }, { code: 15, parameters: [3] }, { code: 18 }, { code: 15, parameters: [3] }, { code: 19 }, { code: 15, parameters: [3] }, { code: 0 }],
            repeat: false, skippable: true, wait: true };
        const list = [C(250, [{ name: "Door1", volume: 80, pitch: 100, pan: 0 }])];
        if (opening) list.push(C(205, [0, open]));
        list.push(C(201, [0, h.inside, x, y, d, 0]), C(0, []));
        interp.setupChild(list, interp.eventId());
    }

    // ------------------------------------------------------------------
    // The field lost: the scene's people (Story.js's measure list calls these), the sign, the guard by it, the dawn that shuts it
    // ------------------------------------------------------------------
    const onField = () => !!window.$gameMap && $gameMap.mapId() === FIELD;
    const castReady = () => onField() && !!$gameMap.event(CAST.butler) && !!$gameMap.event(CAST.watch);
    function freeCell(x, y, but) {
        if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
        if ($gamePlayer.x === x && $gamePlayer.y === y) return false;
        const f = F();
        if (f && f.solidAt && f.solidAt(x, y)) return false;
        return !$gameMap.eventsXyNt(x, y).some(e => !(but || []).includes(e) && e.isNormalPriority() && !e.isThrough() && !e._erased);
    }
    function near(x0, y0, prefer, but) {
        for (const [dx, dy] of prefer) if (freeCell(x0 + dx, y0 + dy, but)) return [x0 + dx, y0 + dy];
        for (let r = 1; r <= 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) === r && freeCell(x0 + dx, y0 + dy, but)) return [x0 + dx, y0 + dy];
        }
        return [x0, y0];
    }
    // the Lord's men come over the field from the road (east): beside the hero, facing him
    function castShow() {
        if (!castReady()) return false;
        const px = $gamePlayer.x, py = $gamePlayer.y, cast = [CAST.butler, CAST.measurer, CAST.watch].map(id => $gameMap.event(id));
        const spots = [[[3, 0], [-3, 0], [0, 3], [0, -3]], [[4, -1], [-4, -1], [1, 3], [1, -3]], [[4, 1], [-4, 1], [-1, 3], [-1, -3]]];
        cast.forEach((ev, i) => {
            const [x, y] = near(px, py, spots[i], cast);
            ev.locate(x, y);
            ev.setDirection(Math.abs(x - px) >= Math.abs(y - py) ? (x > px ? 4 : 6) : (y > py ? 8 : 2));
            sw(FIELD, ev.eventId(), true);
        });
        $gameMap.requestRefresh();
        return true;
    }
    function signShow() {
        sw(FIELD, SIGN, true);
        if (onField()) $gameMap.requestRefresh();
        return true;
    }
    // the butler and the measurer go; the watch stands by the sign till the field is shut
    function castLeave() {
        sw(FIELD, CAST.butler, false);
        sw(FIELD, CAST.measurer, false);
        if (onField()) {
            const s = $gameMap.event(SIGN), w = $gameMap.event(CAST.watch);
            if (s && w) { const [x, y] = near(s.x, s.y, [[-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1]], [w]); w.locate(x, y); w.setDirection(2); }
            $gameMap.requestRefresh();
        }
        return true;
    }
    function guardTalk(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev) return;
        const out = [];
        say(out, ev.eventId(), fieldLocked() ? TK.kod.guardTalk[0]
            : TK.kod.guardTalk[1]);
        interp.setupChild(end(out), ev.eventId());
    }

    // the dawn that shuts the field (Story.js tells it, before its escort talk)
    T.on("fieldLocked", () => {
        sw(FIELD, SIGN, true);
        if (!onField()) sw(FIELD, CAST.watch, false);   // (on the field he says the last words himself; he goes with the map)
        sw(FIELD, CAST.butler, false); sw(FIELD, CAST.measurer, false);
        sw(EDGE, GUARD_EDGE, true); sw(MEADOW, GUARD_MEADOW, true);
        if (window.$gameMap) $gameMap.requestRefresh();
        // the hut's furniture stays in the hut, with the field (Map100 empty for a new hut on the hero's own land)
        const f = F(), hut = fieldHut();
        if (f && f.farm && hut && !hut.site) {
            const fm = f.farm(), inside = fm.buildings[HUT_MAP] || [];
            hut.held = (hut.held || []).concat(inside.splice(0));
            fm.buildings[HUT_MAP] = inside;
            fm.rev = (fm.rev || 0) + 1;
        }
        // the dog: its kennel stays on the field - it comes along with the hero
        const D = T.api("Dog"), d = D && D.state ? D.state() : null;
        if (d && d.tame && (d.map === FIELD || d.map === HUT_MAP)) {
            const here = window.$gameMap ? $gameMap.mapId() : 0, there = here === FIELD || here === HUT_MAP ? EDGE : here;
            d.map = there; d.x = -1; d.y = -1; d.mode = "follow";
            if (here !== FIELD && here !== HUT_MAP) T.popup(TK.kod.glowna[0], { icon: 431, color: "#cfe6a8" });
        }
    }, { owner: PLUGIN });
    // the field bought back: the sign and the guards go, the hut's furniture comes back (or the old hut is boarded up while a new one stands)
    T.on("fieldBack", () => {
        for (const id of [CAST.butler, CAST.measurer, CAST.watch, SIGN]) sw(FIELD, id, false);
        sw(EDGE, GUARD_EDGE, false); sw(MEADOW, GUARD_MEADOW, false);
        if (window.$gameMap) $gameMap.requestRefresh();
        const f = F();
        if (!f || !f.farm) return;
        const fm = f.farm(), all = fm.buildings || {};
        const other = Object.keys(all).some(m => Number(m) !== FIELD && (all[m] || []).some(b => b.type === "hut" && !b.boarded));
        for (const hut of (all[FIELD] || []).filter(b => b.type === "hut" && !b.boarded)) {
            if (other) { hut.boarded = true; continue; }
            if (hut.held && hut.held.length) { fm.buildings[HUT_MAP] = (fm.buildings[HUT_MAP] || []).concat(hut.held); }
            delete hut.held;
        }
        fm.rev = (fm.rev || 0) + 1;
    }, { owner: PLUGIN });
    T.on("fieldLost", () => { if (!S().heard) S().heard = day(); }, { owner: PLUGIN });
    // a save loaded with the field's scene cut off (Story.js starts it again): its people hidden till it shows them
    T.on("load", () => {
        const s = storyGame() ? T.call("Story", "state") : null;
        if (s && s.lost && !s.lost.scene) for (const id of [CAST.butler, CAST.measurer, CAST.watch]) sw(FIELD, id, false);
    }, { owner: PLUGIN });

    // the way onto the shut field: no (a popup over the hero, a step back); out of the old hut's room: to the forest's edge
    const _reserveTransfer = Game_Player.prototype.reserveTransfer;
    Game_Player.prototype.reserveTransfer = function(mapId, x, y, d, fadeType) {
        if (mapId === FIELD && fieldLocked() && !($gameTemp && $gameTemp._homesLetIn) && window.$gameMap && $gameMap.mapId() !== FIELD) {
            if ($gameMap.mapId() === HUT_MAP) return _reserveTransfer.call(this, EDGE, 1, 13, 6, fadeType);
            popupOnce(TK.kod.reserveTransfer[0], { color: "#ff9f8f" });
            stepBack(this);
            return;
        }
        return _reserveTransfer.apply(this, arguments);
    };
    function stepBack(p) {
        const back = { 2: 8, 4: 6, 6: 4, 8: 2 }[p.direction()] || 6;
        const x = $gameMap.roundXWithDirection(p.x, back), y = $gameMap.roundYWithDirection(p.y, back);
        if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f)) { p.locate(x, y); p.setDirection(back === 6 ? 6 : back === 4 ? 4 : back === 8 ? 8 : 2); }
    }
    // leaving the field after the dawn that shut it (the escort): the guard by the sign goes with the map
    const _performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const leaving = this.isTransferring() && window.$gameMap && $gameMap.mapId() === FIELD && this._newMapId !== FIELD;
        _performTransfer.call(this);
        if (leaving && fieldLocked()) sw(FIELD, CAST.watch, false);
    };

    // ------------------------------------------------------------------
    // The yards' animals in the carrying-out days: sold on the spot, or taken along (they live in the next yard of their kind he puts up)
    // ------------------------------------------------------------------
    if (F() && F().addMenuHook) F().addMenuHook((b, def, entries) => {
        if (!def.yard || b.site) return null;
        const a = def.yard.animal, names = ANIMALS[a] || [TK.kod.glowna[1], TK.kod.glowna[2], "zagrodzie"];
        if (b.empty) return Watki.wstaw(TK.kod.glowna[5], { "1": names[0], "2": b.empty === "taken" ? TK.kod.glowna[3] : TK.kod.glowna[4] });
        if (!onField() || !fieldLost() || fieldLocked()) return null;
        const n = def.yard.count || 1, price = (PRICE[a] || 10) * n;
        entries.unshift(
            { name: Watki.wstaw(TK.kod.glowna[6], { price: price }), icon: GOLD_ICON, help: Watki.wstaw(TK.kod.glowna[7], { n: n, "2": PRICE[a] || 10 }), run: () => sellAnimals(b, price, names) },
            { name: TK.kod.glowna[8], icon: 82, help: Watki.wstaw(TK.kod.glowna[9], { "1": names[1] }), run: () => takeAnimals(b, a, n, names) });
        return null;
    });
    function sellAnimals(b, price, names) {
        b.empty = "sold";
        $gameParty.gainGold(price);
        T.audio.se("Coin", { volume: 80, pitch: 100 });
        T.popup(Watki.wstaw(TK.kod.sellAnimals[0], { "1": names[1], price: price }), { icon: GOLD_ICON, kind: "gold" });
        if (window.Livestock && Livestock.sync) Livestock.sync();
    }
    function takeAnimals(b, a, n, names) {
        b.empty = "taken";
        S().herd[a] = (S().herd[a] || 0) + n;
        T.popup(Watki.wstaw(TK.kod.takeAnimals[0], { "1": names[1] }), { icon: 82, color: "#cfe6a8" });
        if (window.Livestock && Livestock.sync) Livestock.sync();
    }
    T.on("build", e => {
        if (!e || !e.done || e.mapId === FIELD) return;
        const f = F(), def = f && f.BUILDINGS ? f.BUILDINGS[e.type] : null, a = def && def.yard && def.yard.animal;
        if (!a || !(S().herd[a] > 0)) return;
        S().herd[a] = 0;
        const names = ANIMALS[a] || [TK.kod.glowna[1], TK.kod.glowna[2], "zagrodzie"];
        T.popup(Watki.wstaw(TK.kod.glowna[10], { "1": names[0], "2": names[2] }), { icon: 82, color: "#9ff0a8" });
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The hut for sale: the sołtys (8-16) - his talk as ever, then "Domy na sprzedaż" once the hero has heard of it
    // ------------------------------------------------------------------
    const saleHours = () => hour() >= SALE_HOURS[0] && hour() < SALE_HOURS[1];
    // (the sołtys as a speaker: WORDS.soltys)
    // "Domy na sprzedaż" (the item after his usual talk, the user 2026-10-15): what he has, then buying
    function soltysList(ev) {
        const o = [], id = ev.eventId(), s = S(), left = forSale();
        if (!s.told) {
            say(o, id, TK.kod.soltysList[0], WORDS.soltys);
            say(o, id, Watki.wstaw(TK.kod.soltysList[1], { price: HOUSES.chata.price }), WORDS.soltys);
            say(o, id, TK.kod.soltysList[2], WORDS.soltys);
            if (!owns("zagroda")) say(o, id, TK.kod.soltysList[3], WORDS.soltys);
            o.push(C(355, ["Tawerna.call(\"Homes\", \"told\")"]));
        } else say(o, id, TK.kod.soltysList[4], WORDS.soltys);
        const opts = left.map(k => ({ label: Watki.wstaw(TK.kod.soltysList[5], { what: HOUSES[k].what, price: HOUSES[k].price }), js: "Tawerna.call(\"Homes\", \"buy\", this, \"" + k + "\")" }));
        opts.push({ label: TK.kod.soltysList[6], js: [] });
        return choose(o, opts);
    }
    // his talk as ever (the quests, the greeting, his usual words: the takeovers below this one), then one more item:
    // "Domy na sprzedaż" - only once the hero has heard of the hut, in the town hall's hours, while it is for sale
    // (2026-10-23, docs/ROZMOWY.md: the core's talk service, "wrap" - right above the quests, as the old hook)
    const L0 = T.api("TownLife");
    T.talk.takeover({ owner: PLUGIN, who: "soltys", priority: T.talk.PRIORITY.wrap, run: ctx => {
        const ev = ctx.ev;
        if (!ev) return null;
        if (!S().heard || !forSale().length || !saleHours()) return null;
        const out = [C(355, ["Tawerna.call(\"Homes\", \"chat\", this)"])];
        return choose(out, [{ label: TK.kod.run[0], js: "Tawerna.call(\"Homes\", \"offer\", this)" }, { label: TK.kod.run[1], js: [] }]);
    } });
    // the usual talk in a child of this one (the rest of the takeovers and TownLife's own words, without this one); the item comes after it
    function chat(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev || !window.TownLife) return;
        TownLife.talk(interp, { skip: PLUGIN });
    }
    function offer(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev) return;
        try { interp.setupChild(end(soltysList(ev)), ev.eventId()); } catch (e) { console.error("[Homes]", e); }
    }
    // the purchase: the gold, the key, the furniture in the hut, the land clean, the deed in the journal
    function buyNow(key) {
        const h = HOUSES[key];
        if (!h || !h.soltys || owns(key) || $gameParty.gold() < h.price) return false;
        $gameParty.loseGold(h.price);
        own(h);
        furnish(h);
        T.audio.se("Coin", { volume: 80, pitch: 100 });
        T.popup(Watki.wstaw(TK.kod.buyNow[0], { name: h.name }), { top: true, color: "#ffd23f", sub: TK.kod.buyNow[1] });
        T.call("Journal", "addNote", Watki.wstaw(TK.kod.buyNow[2], { name: h.name }), Watki.wstaw(TK.kod.buyNow[3], { "1": day(), what: h.what, price: h.price, where: h.where }));
        T.emit("homeBought", { key, day: day(), price: h.price });
        T.call("Journal", "evaluateGoals");
        return true;
    }
    function own(h) {
        S().owned[h.key] = day();
        S().heard = S().heard || day();
        S().clean[h.land] = day();
        if (window.$gameMap && $gameMap.mapId() === h.land) cleanLand(h.land);
    }
    function buy(interp, key) {
        const h = HOUSES[key], ev = interp && $gameMap.event(interp.eventId());
        if (!h || !ev || owns(key)) return;
        const out = [];
        if ($gameParty.gold() < h.price) {
            T.popup(Watki.wstaw(TK.kod.buy[0], { "1": $gameParty.gold(), price: h.price }), { icon: GOLD_ICON, kind: "need" });
            say(out, ev.eventId(), TK.kod.buy[1], WORDS.soltys);
        } else {
            buyNow(key);
            say(out, ev.eventId(), Watki.wstaw(TK.kod.buy[2], { "1": h.name.toLowerCase() }), WORDS.soltys);
        }
        interp.setupChild(end(out), ev.eventId());
    }
    // the farm of the Ług family made the hero's (D21: the sołtys's deed, 350 G paid there)
    function grantLand(key, how) {
        const h = HOUSES[key];
        if (!h || owns(key)) return false;
        own(h);
        if (key === "zagroda") Z().how = how || Z().how || "lord";
        T.popup(Watki.wstaw(TK.kod.grantLand[0], { name: h.name }), { top: true, color: "#ffd23f", sub: TK.kod.grantLand[1] });
        T.call("Journal", "addNote", Watki.wstaw(TK.kod.grantLand[0], { name: h.name }), Watki.wstaw(TK.kod.grantLand[4], { "1": day(), "2": how === "marta" ? TK.kod.grantLand[2] : TK.kod.grantLand[3], price: h.price, where: h.where }));
        T.emit("homeBought", { key, day: day(), price: h.price });
        T.call("Journal", "evaluateGoals");
        return true;
    }
    // a home's furniture (Farming's: the bed, the chests - they stay with the house)
    function furnish(h) {
        const f = F();
        if (!f || !f.farm) return;
        const fm = f.farm(), list = fm.buildings[h.inside] || (fm.buildings[h.inside] = []);
        for (const it of h.furniture) {
            if (list.some(b => b.type === it.type && b.x === it.x && b.y === it.y)) continue;
            list.push({ id: fm.nextId++, type: it.type, x: it.x, y: it.y, last: f.today(), v: 3, fixed: true });
        }
        fm.rev = (fm.rev || 0) + 1;
    }
    // the land bought is clean: whatever wild grew on its region (stones, flax, herbs, wild bushes) gone on the day of the purchase -
    // it comes back as it does anywhere (Farming: a picked thing after its days, a bush after 8); put on the map when it is entered
    function cleanLand(mapId) {
        const f = F(), d = S().clean[mapId];
        if (!f || !f.farm || !d || !window.$dataMap || $gameMap.mapId() !== mapId) return false;
        const fm = f.farm(), key = (x, y) => x + "," + y;
        const stones = (fm.stones || (fm.stones = {}))[mapId] || (fm.stones[mapId] = {});
        const bushes = (fm.bushes || (fm.bushes = {}))[mapId] || (fm.bushes[mapId] = {});
        for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) {
            if ($gameMap.regionId(x, y) !== BUILD_REGION) continue;
            const k = key(x, y);
            if (!(stones[k] >= d)) stones[k] = d;
            if (!bushes[k] || !(bushes[k].day >= d)) bushes[k] = { stage: "gone", day: d };
        }
        S().clean[mapId] = -d;   // (done: negative keeps the day for the record)
        fm.rev = (fm.rev || 0) + 1;
        return true;
    }
    // the sołtys cries the hut on the square once a day while the hero is near (that is how he hears of it)
    T.onMapUpdate(scene => {
        if (scene._twFrames % 60 !== 30 || !forSale().length || !saleHours() || S().bark === day()) return;
        const L = window.TownLife, ev = L && L.eventOf ? L.eventOf("soltys") : null;
        if (!ev || ev._transparent || $gameMap.isEventRunning() || Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) > 7) return;
        S().bark = day();
        S().heard = S().heard || day();
        L.say("soltys", TK.kod.glowna[11]);
    }, { owner: PLUGIN, name: "soltys" });

    // ------------------------------------------------------------------
    // The burnt farm: the ruin's menu (Farming's look), the work stage by stage, the well, the cross, Marta at the grave
    // ------------------------------------------------------------------
    const onFarm = () => !!window.$gameMap && $gameMap.mapId() === ZAGRODA;
    const tq = () => T.api("TownQuests");
    const seen = () => {
        if (!Z().seen) { Z().seen = day(); const Q = tq(); if (Q && Q.autoChecks) Q.autoChecks(); }
    };
    let menuAsk = null;   // (the menu opens once the event that asked for it has ended)
    function ruin(interp) {
        if (!onFarm()) return;
        if (!owns("zagroda")) {
            const first = !Z().seen;
            seen();
            popupOnce(first ? TK.kod.ruin[0]
                : TK.kod.ruin[1], { color: "info" });
            return;
        }
        if (stage() >= 5) { goIn(interp, HOUSES.zagroda, false); return; }   // (the picture is the house: no door animation)
        menuAsk = "house";
    }
    function well(interp) {
        if (!onFarm()) return;
        const z = Z();
        if (!owns("zagroda")) { popupOnce(TK.kod.well[0], { color: "info" }); return; }
        if (z.wellDone) { popupOnce(TK.kod.well[1], { color: "info" }); return; }
        menuAsk = "well";
    }
    function cross() {
        seen();
        popupOnce(TK.kod.cross[0], { color: "info" });
    }
    function signpost() {
        popupOnce(TK.kod.signpost[0], { color: "info" });
    }
    const workOf = () => (stage() < 5 ? WORK[stage()] : null);
    const hitsOf = w => Math.max(1, Math.round(w.hits * (1 - Math.min(0.75, Number(T.call("Combat", "perk", "build.hits")) || 0))));
    const hitCost = () => { const f = F(); return f && f.hitCost ? f.hitCost() : 2; };
    const costText = w => (w.cost.length ? w.cost.map(([id, n]) => Watki.wstaw(TK.kod.costText[0], { "1": itemOf(id) ? itemOf(id).name : "?", n: n, "3": countOf(id) })).join(", ") : TK.kod.costText[1]);
    // the tool for the work: clearing - the shovel, else an axe; building - the hammer
    function toolFor(target) {
        if (target === "well") return countOf(ITEM.shovel) > 0 ? { id: ITEM.shovel, kind: KIND.shovel } : null;
        const w = workOf();
        if (w && w.clear) {
            if (countOf(ITEM.shovel) > 0) return { id: ITEM.shovel, kind: KIND.shovel };
            const axe = [ITEM.steelAxe, ITEM.ironAxe, ITEM.axe].find(id => countOf(id) > 0);
            return axe ? { id: axe, kind: KIND.axe } : null;
        }
        return countOf(ITEM.hammer) > 0 ? { id: ITEM.hammer, kind: KIND.hammer } : null;
    }
    function needTool(target) {
        const clear = target === "house" && workOf() && workOf().clear;
        T.popup.need(iconOf(target === "well" || clear ? ITEM.shovel : ITEM.hammer),
            target === "well" ? Watki.wstaw(TK.kod.needTool[0], { name: itemOf(ITEM.shovel).name }) : clear ? TK.kod.needTool[1] : Watki.wstaw(TK.kod.needTool[0], { name: itemOf(ITEM.hammer).name }));
    }
    function houseMenu() {
        const z = Z(), w = workOf();
        if (!w) return null;
        const going = z.work && z.work.i === stage();
        const left = going ? z.work.need - z.work.done : hitsOf(w);
        const tool = w.clear ? TK.kod.houseMenu[0] : TK.kod.houseMenu[1];
        const title = Watki.wstaw(TK.kod.houseMenu[2], { "1": STAGE_NAMES[stage()], "2": going ? " - " + w.name.toLowerCase() + " (" + z.work.done + "/" + z.work.need + ")" : "" });
        const entries = [{ name: going ? Watki.wstaw(TK.kod.houseMenu[3], { "1": w.name.toLowerCase() }) : (w.clear ? "" : TK.kod.houseMenu[4]) + w.name, icon: iconOf(w.clear ? ITEM.shovel : ITEM.hammer), right: "-" + hitCost(),
            help: Watki.wstaw(TK.kod.houseMenu[7], { help: w.help, "2": going ? Watki.wstaw(TK.kod.houseMenu[5], { left: left }) : Watki.wstaw(TK.kod.houseMenu[6], { "1": costText(w), left: left }), tool: tool, "4": hitCost() }),
            run: () => (going ? strike("house") : begin()) }];
        const next = WORK.slice(stage() + 1).map(x => x.name.toLowerCase()).join(", ");
        if (next) entries.push({ name: TK.kod.houseMenu[8], icon: iconOf(80), help: Watki.wstaw(TK.kod.houseMenu[9], { next: next }), run: () => {} });
        return { title, entries };
    }
    function wellMenu() {
        const z = Z();
        return { title: Watki.wstaw(TK.kod.wellMenu[0], { "1": z.well ? " (" + z.well + "/" + WELL_HITS + ")" : "" }), entries: [{ name: z.well ? TK.kod.wellMenu[1] : TK.kod.wellMenu[2], icon: iconOf(ITEM.shovel), right: "-" + hitCost(),
            help: Watki.wstaw(TK.kod.wellMenu[3], { "1": WELL_HITS - z.well, "2": hitCost() }), run: () => strike("well") }] };
    }
    T.onMapUpdate(scene => {
        if (!menuAsk || $gameMap.isEventRunning()) return;
        const what = menuAsk, menu = what === "well" ? wellMenu() : houseMenu();
        menuAsk = null;
        if (menu && scene.openFarmMenu) scene.openFarmMenu(menu.title, menu.entries);
    }, { owner: PLUGIN, name: "farmMenu" });
    // the materials go in at the start of a stage (a missing one: a popup over the hero), then the first blow
    function begin() {
        const w = workOf(), z = Z();
        if (!w || !owns("zagroda")) return false;
        if (!toolFor("house")) { needTool("house"); return false; }
        const miss = w.cost.filter(([id, n]) => countOf(id) < n);
        if (miss.length) {
            for (const [id, n] of miss.slice(0, 2)) T.popup.need(iconOf(id), Watki.wstaw(TK.kod.begin[0], { name: itemOf(id).name, "2": countOf(id), n: n }));
            return false;
        }
        for (const [id, n] of w.cost) $gameParty.loseItem(itemOf(id), n, false);
        z.work = { i: stage(), need: hitsOf(w), done: 0 };
        return strike("house");
    }
    // one blow: the strength, the tool's swing, the tool worn; held O goes on (a moment after each blow, while he faces it)
    const FACE = { house: () => houseCells(), well: () => wellCells() };
    function houseCells() {
        const ev = houseEvent();
        if (!ev) return [];
        const out = [];
        for (let dy = -2; dy <= 0; dy++) for (let dx = -2; dx <= 2; dx++) out.push([ev.x + dx, ev.y + dy]);
        return out;
    }
    function wellCells() {
        const ev = window.$gameMap ? $gameMap.events().find(e => e.event() && /^Stara studnia/.test(e.event().name)) : null;
        return ev ? [[ev.x, ev.y], [ev.x + 1, ev.y], [ev.x, ev.y - 1], [ev.x + 1, ev.y - 1]] : [];   // (<Occupy:right=1,up=1>)
    }
    function facing(target) {
        const p = $gamePlayer, d = p.direction();
        const x = $gameMap.roundXWithDirection(p.x, d), y = $gameMap.roundYWithDirection(p.y, d);
        return FACE[target]().some(([cx, cy]) => cx === x && cy === y);
    }
    let again = null;
    function strike(target) {
        const tool = toolFor(target);
        if (!tool) { needTool(target); return false; }
        if (target === "house" && !(Z().work && Z().work.i === stage())) return false;
        if (target === "well" && Z().wellDone) return false;
        const cost = hitCost();
        if (cost > 0 && typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(cost)) { T.popup.need(82, TK.kod.strike[0]); return false; }
        const c = T.api("Combat"), rate = c && c.workSpeed ? c.workSpeed() : 1;
        const next = () => { again = { target, at: Graphics.frameCount + Math.max(2, Math.round(12 / rate)) }; };
        const started = $gamePlayer.startToolSwing && $gamePlayer.startToolSwing(tool.kind, () => blow(target, tool), next, { rate });
        if (!started) blow(target, tool);
        return true;
    }
    T.onMapUpdate(() => {
        if (!again || Graphics.frameCount < again.at) return;
        const a = again;
        again = null;
        if (!onFarm() || !Input.isPressed("ok") || !T.isCalm(null, { only: ["farmMenu", "build", "event", "message", "tool"] }) || !facing(a.target)) return;
        if (a.target === "house" ? Z().work && Z().work.i === stage() : !Z().wellDone) strike(a.target);
    }, { owner: PLUGIN, name: "hold" });
    function blow(target, tool) {
        const z = Z();
        T.call("Durability", "use", tool.id);
        const cells = FACE[target](), c = cells.length ? cells[Math.floor(cells.length / 2)] : [$gamePlayer.x, $gamePlayer.y];
        let last = false;
        if (target === "well") {
            z.well = Math.min(WELL_HITS, (z.well || 0) + 1);
            last = z.well >= WELL_HITS;
            T.audio.se("Earth1", { volume: 85, pitch: 95 + Math.floor(Math.random() * 10) });
            if (last) wellDug();
        } else {
            const w = z.work;
            if (!w) return;
            w.done++;
            last = w.done >= w.need;
            T.audio.se(tool.kind === KIND.hammer ? "Hammer" : "Earth1", { volume: 90, pitch: 95 + Math.floor(Math.random() * 10) });
            if (last) stageDone();
        }
        if ($gameTemp) ($gameTemp._hitFx || ($gameTemp._hitFx = [])).push({ type: target === "well" ? "stone" : "wood", final: last, bx: c[0] + 0.5, by: c[1] + 1,
            dx: Math.sign(c[0] - $gamePlayer.x), dy: Math.sign(c[1] - $gamePlayer.y) });
    }
    function stageDone() {
        const z = Z(), w = WORK[stage()];
        z.work = null;
        z.stage = stage() + 1;
        for (const [id, n] of w.yield || []) $gameParty.gainItem(itemOf(id), n);
        const ev = houseEvent();
        if (ev) showStage(ev);
        T.audio.se("Hammer", { volume: 90, pitch: 90 });
        const s = stage();
        if (w.clear) {
            const Q = tq();
            if (Q && Q.state && Q.isActive && Q.isActive("D21")) { const v = Q.state().v; v.konik = (v.konik || 0) + 1; }
            T.popup(TK.kod.stageDone[0], { top: true, color: "#9ff0a8", sub: TK.kod.stageDone[1] });
        } else T.popup(Watki.wstaw(TK.kod.stageDone[2], { "1": STAGE_NAMES[s] }), { top: true, color: "#9ff0a8", sub: s < 5 ? Watki.wstaw(TK.kod.stageDone[3], { "1": WORK[s].name.toLowerCase() }) : TK.kod.stageDone[4] });
        if (s >= 5) {
            furnish(HOUSES.zagroda);
            sw(ZAGRODA, SMOKE, true);
            if (onFarm()) $gameMap.requestRefresh();
            T.call("Journal", "addNote", TK.kod.stageDone[5], Watki.wstaw(TK.kod.stageDone[6], { "1": day() }));
        }
        T.emit("zagrodaStage", { stage: s });
        const Q = tq();
        if (Q && Q.autoChecks) Q.autoChecks();
        T.call("Journal", "evaluateGoals");
    }
    function wellDug() {
        Z().wellDone = day();
        T.popup(TK.kod.wellDug[0], { top: true, color: "#cfe6a8", sub: TK.kod.wellDug[1] });
        T.call("Journal", "addNote", TK.kod.wellDug[2], Watki.wstaw(TK.kod.wellDug[3], { "1": day() }));
    }

    // Marta at her husband's grave: once the quest is over (her son's toy given back), every 7th day, 15-18 (TownLife keeps her
    // away from Podgrodzie for those hours - Homes wraps her `when`)
    function martaAway() {
        if (!window.$gameSystem || !owns("zagroda")) return false;
        const Q = tq(), r = Q && Q.rec ? Q.rec("D21") : null;
        if (!r || !(r.s === "done" || r.step >= 5)) return false;
        const h = hour();
        return day() % 7 === 3 && h >= 15 && h < 18;
    }
    if (L0 && L0.RESIDENTS) {
        const r = L0.RESIDENTS.find(x => x.key === "praczka");
        if (r && !r._homes) {
            const was = r.when;
            r.when = () => !martaAway() && (was === undefined || was === null || (L0.condOk ? L0.condOk(was) : true));
            r._homes = true;
        }
    }
    let martaShown = null;
    T.onMapUpdate(scene => {
        if (!onFarm() || scene._twFrames % 30 !== 7) return;
        const on = martaAway();
        if (on !== martaShown || on !== swOn(ZAGRODA, MARTA)) { martaShown = on; sw(ZAGRODA, MARTA, on); $gameMap.requestRefresh(); }
    }, { owner: PLUGIN, name: "marta" });
    const MARTA_WORDS = { dni: [
        [],
        [],
        []
    ] };
    Watki.scal(MARTA_WORDS, "domy", "marta");   // (its words: js/teksty/domy.txt, marta)
    const MARTA_LINES = MARTA_WORDS.dni;
    function martaTalk(interp) {
        const ev = interp && $gameMap.event(interp.eventId());
        if (!ev) return;
        const lines = MARTA_LINES[day() % MARTA_LINES.length], out = [];
        ev.turnTowardPlayer();
        for (const l of lines) say(out, ev.eventId(), l, TK.kod.martaTalk[0]);
        interp.setupChild(end(out), ev.eventId());
    }

    // a map entered: the farm's house shows its stage, its smoke and Marta; bought land made clean; a home's furniture there
    T.on("mapReady", () => {
        const id = $gameMap.mapId();
        if (S().clean[id] > 0) cleanLand(id);
        const room = houseOfRoom(id);
        if (room && owns(room.key) && (room.key !== "zagroda" || stage() >= 5)) furnish(room);
        if (id === ZAGRODA) {
            const ev = houseEvent();
            if (ev) showStage(ev);
            if (swOn(ZAGRODA, SMOKE) !== (stage() >= 5)) { sw(ZAGRODA, SMOKE, stage() >= 5); $gameMap.requestRefresh(); }
            martaShown = null;
        }
    }, { owner: PLUGIN });
    // (v1.0.0's homes - the town house and the plank hut, sold for one day before the user's change: their fixed furniture out of the
    // rooms that are now the farm's)
    T.on("load", () => {
        const s = S(), f = F();
        if (!s.purge || !f || !f.farm) return;
        const fm = f.farm();
        for (const m of s.purge) if (fm.buildings[m]) fm.buildings[m] = fm.buildings[m].filter(b => !b.fixed);
        delete s.purge;
        fm.rev = (fm.rev || 0) + 1;
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The quest D21 "Spalona zagroda" (TownQuests' engine; it lives here with the farm it is about): the ruin or the cross ->
    // Józek Łata's story -> Marta -> the sołtys (350 G: to the Lord, or by the old law through Marta) -> the ruin cleared -> the
    // toy back to Marta -> the house rebuilt
    // ------------------------------------------------------------------
    const D21 = {
        id: "D21", kind: "D", giver: null, icon: 61, autoStart: "d21Start",
        steps: [
            { type: "talk", to: "szmaciarz", hours: [7, 20] },
            { type: "talk", to: "praczka", hours: [6, 21] },
            { type: "talk", to: "soltys", hours: [8, 16], gold: num(params.priceFarm, 350), vars: "d21Vars",
                choice: { 
                    options: [
                        { flag: "d21Lord", fx: "d21Deed", reward: { opinion: -2 } },
                        { flag: "d21Marta", fx: "d21Deed", reward: { opinion: 5 } }
                    ] } },
            { type: "custom", check: "d21Clear" },
            { type: "bring", to: "praczka", need: [["v:konik", 1]], hours: [6, 21], reward: { opinion: 2 } },
            { type: "custom", check: "d21Built" }
        ],
        reward: { xp: 200 }
    };
    Watki.scal(D21, "domy", "zadania.D21");   // (its words: js/teksty/domy.txt, zadania.D21)
    (function registerD21() {
        const Q = window.TownQuests, D = window.TownQuestsData;
        if (!Q || !Q.QUESTS || !Q.FX) return;
        if (D && D.VITEMS && !D.VITEMS.konik) Object.defineProperty(D.VITEMS, "konik", { enumerable: true,
            value: { get name() { return WORDS.konik; }, get icon() { return window.$dataItems && $dataItems[ITEM.wood] ? $dataItems[ITEM.wood].iconIndex : 0; } } });
        Object.assign(Q.FX, {
            d21Start: () => !!Z().seen,
            d21Clear: { check: () => stage() >= 1 },
            d21Built: { check: () => stage() >= 5 },
            d21Deed: { pick: (q, op) => grantLand("zagroda", op && op.flag === "d21Marta" ? "marta" : "lord") },
            d21Vars: { vars: () => ({ price: HOUSES.zagroda.price }) }   // ({price} of the sołtys's step: TownQuests fills it)
        });
        if (!Q.Q.D21) { Q.QUESTS.push(D21); Q.Q.D21 = D21; }
    })();

    window.Homes = T.register(PLUGIN, {
        HOUSES, CAST, SIGN, GUARD_EDGE, GUARD_MEADOW, WAY, SIGNPOST, SMOKE, MARTA, PRICE, IDS, WORK, STAGE_NAMES, WELL_HITS, BUILD_REGION, D21,
        state: () => S(), owns, ownsAny, forSale, homeLand, hasRoof: () => owns("chata") || (owns("zagroda") && stage() >= 5), homeMaps: () => KEYS.filter(owns).map(k => HOUSES[k].land),
        hear: () => { S().heard = S().heard || day(); return true; }, told: () => { S().told = day(); return true; },
        door, buy, buyNow, grantLand, chat, offer, furnish, cleanLand, soltysList: ev => soltysList(ev), guardTalk,
        castReady, castShow, signShow, castLeave, rule,
        stage, work: () => Z().work, ruin, well, cross, signpost, begin, strike, martaAway, martaTalk, houseMenu, wellMenu,
        // (the tests) a stage set at once - its picture, its furniture and smoke at 5
        setStage(s) { Z().stage = Math.max(0, Math.min(5, s)); Z().work = null; const ev = houseEvent(); if (ev) showStage(ev); if (stage() >= 5) { furnish(HOUSES.zagroda); sw(ZAGRODA, SMOKE, true); } if (onFarm()) $gameMap.requestRefresh(); return stage(); }
    });
})();
