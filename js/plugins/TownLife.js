//=============================================================================
// TownLife.js
//=============================================================================
// The town lives by the clock (user 2026-10-04: "ogarnij mechanizm, że miasto ma rozkład dnia"): every resident of
// TownLife_Data.js is put on the town map (Map008) as an event (ids 910-949, Tawerna.inject), and does what its plan says at this
// hour - walks there along a real path (Hunting.js's path8, steps of RoamingActor), stands, works, strolls, patrols the walls, goes
// in through a door (hidden till it comes out again). Coming onto the map, or the clock jumping (a night's sleep, F9), puts everyone
// straight where they should be. When the hero passes, they call out (SpeechBubbles.say) - by what they do, the rain, the night;
// spoken to (the action button) they answer by the time of day and the weather. Ambroży rings the bell on the full hours he
// stands at it (6, 12, 18 - and 3 at night).
// Other plugins and tests: T.api("TownLife") (also window.TownLife): residents, spot(key), entryAt(res, hour), eventOf(key),
// placeAll(), talk(interpreter), state(key).
// (v1.1.0, 2026-10-05) A resident may live on another outdoor map ("map" in its data - Podgrodzie, Map111, the poor suburb outside
// the west wall): it is put there and lives its day there; the spots of that map are TownLifeData.SPOTS_BY_MAP[map] and its
// "Miejsce: <key>" events. Map008's residents work as before.
// (v1.2.0, 2026-10-05) Residents who are not always there: "when" in a resident's data (a condition's name - "market": only on the
// market days) keeps it away (hidden) on the other days; a plan entry may have a condition as its 4th field (the entry counts only
// while the condition holds); a resident can be sent away for good or for some days (setGone(key, true | untilDay), kept in the
// save: Tawerna.state("townLife")); another plugin can take a resident over for a while (hold(key, true, [x, y]): its plan stops
// driving it, it walks to [x, y] and stands). The residents with none of these live exactly as before.
// (v1.3.0, 2026-10-07, W6 "Ludzie z promu") A resident may move house: "alt" in its data - { map, when, plan, talk, barks } - while the
// condition `when` holds (a condition registered with addCondition; an unknown one does NOT switch it) it lives on alt.map by alt.plan
// (and says alt.talk / alt.barks): the camp of the ferry people moves out to Podgrodzie when the town shuts its gate. Coming onto its
// old map it is away (hidden); the new map puts it in as it loads.
// (v1.4.0, 2026-10-16, the six island places - docs/miejsca_wyspy/PAKIETY.md) Residents of other plugins come in through
// window.TownLifeExtra (a data plugin above this one pushes them there), each with its own fixed event id (943-948 given out); an
// indoor place may be a default of TownLifeData.SPOTS_BY_MAP[map] when the map has no "Miejsce:" event for it (Map001 untouched).
// (v1.5.0, 2026-10-17, W5 "Towary z kontynentu") A resident may be "inside" somewhere that is not its home: "indoor" in its data maps an
// inside entry's place to an indoor spot name - { w5_lada: "ludmila_lada" }: while the plan says "inside w5_lada" the resident stands on
// the spot "ludmila_lada" of whichever interior has it (Ludmiła behind the counter of the town's honest kantor, Map103), not at home.
// (v1.6.0, 2026-10-21, the new terrain - docs/rozszerzenia/PLAN.md) A second range of ids for the residents of other plugins:
// TownLifeExtra takes an id of 910-949 (as before) or of TownLifeData.EXTRA_RANGE (2900-2949); one Tawerna.inject per range.
// (v1.7.0, 2026-10-22, the new Podgrodzie - docs/podgrodzie/NOWE_PODGRODZIE.md) a third range, 2950-2959 (TawernaCore's registry):
// TownLifeData.EXTRA_RANGES lists every range past 910-949 ([[2900, 2949], [2950, 2959]]) - one Tawerna.inject per range, ids of
// TownLifeExtra checked against all of them.
// (v1.8.0, 2026-10-23, docs/ROZMOWY.md) A resident's talk goes through the core's one service (Tawerna.talk.run, who = its key): the
// other systems' takeovers by their named priorities, else its own line; addTalkHook is only an old door onto it. Hidden residents never
// start through the core's Tawerna.onEventStart.

/*:
 * @target MZ
 * @plugindesc Miasteczko żyje według zegara: mieszkańcy chodzą, pracują, wchodzą do domów i tawerny, wołają, rozmawiają; dzwon wybija godziny. v1.8.0
 * @author Claude
 *
 * @help
 * ============================================================================
 * TownLife.js - rozkład dnia miasteczka
 * ============================================================================
 * Mieszkańcy, ich plany dnia, okrzyki i rozmowy są w TownLife_Data.js (ma
 * stać nad tym pluginem). Postacie pojawiają się same na mapie 8 (Okolice
 * Tawerny) - w edytorze ich nie widać (zdarzenia 910-949). Mieszkaniec z
 * "map: N" w danych żyje na mapie N (np. Podgrodzie, mapa 111).
 *
 * Miejsca (kowadło, stragan, brama...) mają domyślne pola w danych. Żeby
 * przesunąć miejsce, postaw na mapie zdarzenie o nazwie "Miejsce: <klucz>",
 * np. "Miejsce: kowadlo" - mieszkaniec pójdzie tam, gdzie ono stoi
 * (kierunek bierze z grafiki zdarzenia, jeśli ją ma).
 *
 * Czynności: inside (wchodzi do środka i znika), stand (stoi), work
 * (pracuje), wander (spaceruje w pobliżu), patrol (obchodzi listę miejsc),
 * bell (stoi przy dzwonie - o pełnej godzinie dzwon bije).
 *
 * Nie zawsze w mieście: "when: 'market'" w danych mieszkańca = jest tylko
 * w dni targowe; czwarte pole wpisu planu (np. "market", "!market") = ten
 * wpis liczy się tylko wtedy. W skryptach: TownLife.setGone("feliks", true)
 * (zniknął na zawsze), TownLife.setGone("woziwoda", 20) (nie ma go do dnia
 * 20), TownLife.setGone(klucz, false) (wraca).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna, D = window.TownLifeData, PLUGIN = "TownLife";
    if (!D) throw new Error("TownLife.js: TownLife_Data.js must stand above it in the plugin list");
    const MAP = D.MAP, FIRST = D.FIRST_ID, LAST = FIRST + 39;
    // (2026-10-21, docs/rozszerzenia/PLAN.md) a second range for the residents of the new terrain's packages (TownLifeExtra with an id
    // of 2900-2949: A 2900-2904, B 2905-2909, C 2910-2929, D 2930-2939) - 910-949 is full
    const EXTRA = D.EXTRA_RANGE || [2900, 2949];
    // (v1.7.0, 2026-10-22) every range past 910-949: TownLifeData.EXTRA_RANGES (the second one and the new Podgrodzie's third,
    // 2950-2959 - docs/podgrodzie/NOWE_PODGRODZIE.md); old data with only EXTRA_RANGE keeps its one range
    const RANGES = (Array.isArray(D.EXTRA_RANGES) && D.EXTRA_RANGES.length ? D.EXTRA_RANGES : [EXTRA]).map(r => [Number(r[0]), Number(r[1])]);
    const inExtra = id => RANGES.some(r => id >= r[0] && id <= r[1]);
    const RES = D.RESIDENTS;
    // (2026-10-16, docs/miejsca_wyspy/PAKIETY.md) residents of other plugins: a data plugin above this one puts them into
    // window.TownLifeExtra, each with its OWN fixed event id (910-949, given out in the plan) - the ids of the residents above stay
    // FIRST + their place in the list, whatever plugins come or go. A resident without an id, with a taken id or key, or with an id
    // the list's own residents would use, is left out (said in the console).
    (function mergeExtra() {
        const extra = Array.isArray(window.TownLifeExtra) ? window.TownLifeExtra : [];
        const warn = m => { try { console.warn("TownLife: " + m); } catch (e) { /* (no console) */ } };
        const plain = RES.filter(r => !r.id).length;
        for (const r of extra) {
            if (!r || !r.key) continue;
            const id = Number(r.id);
            if (!(id >= FIRST + plain && id <= LAST) && !inExtra(id)) { warn(r.key + ": the id " + r.id + " is not free (" + (FIRST + plain) + "-" + LAST + " or " + RANGES.map(x => x[0] + "-" + x[1]).join(", ") + ") - left out"); continue; }
            if (RES.some(o => o.key === r.key || o.id === id)) { warn(r.key + ": the key or the id " + id + " is taken - left out"); continue; }
            RES.push(r);
        }
    })();
    const idOf = (r, i) => (r.id ? Number(r.id) : FIRST + i);
    const BY_ID = new Map(RES.map((r, i) => [idOf(r, i), r]));
    const IDS = Array.from(BY_ID.keys()).sort((a, b) => a - b);
    const WANDER_R = 3;                // tiles round the spot a stroll goes
    const BARK_NEAR = 4.5;              // tiles: the hero this close hears a call
    const BARK_GAP = [900, 1800];       // frames between one resident's calls
    const BARK_GLOBAL = 300;            // frames between any two calls
    const STUCK_HIDDEN = 120;           // frames stuck on the way, off the screen: it gets there anyway
    const STUCK_SEEN = 900;             // ...and on the screen
    const BELL_SE = { name: "Bell3", volume: 70, pitch: 85, pan: 0 };

    // the outdoor map each resident lives on (Map008 unless its data says "map"; its "alt" map while alt.when holds - v1.3.0), and
    // all such maps
    const altOn = r => !!(r.alt && window.$gameSystem && COND[r.alt.when] && condOk(r.alt.when));
    const homeOf = r => (altOn(r) ? r.alt.map : r.map || MAP);
    const HOMES = new Set(RES.map(r => r.map || MAP).concat(RES.filter(r => r.alt).map(r => r.alt.map)));
    const planOf = r => (altOn(r) && r.alt.plan ? r.alt.plan : r.plan);
    const talkOf = r => (altOn(r) && r.alt.talk ? r.alt.talk : r.talk);
    const barksOf = r => (altOn(r) && r.alt.barks ? r.alt.barks : r.barks);
    const isTown = () => !!($gameMap && HOMES.has($gameMap.mapId()));
    const baseSpots = mapId => (mapId === MAP ? D.SPOTS : (D.SPOTS_BY_MAP && D.SPOTS_BY_MAP[mapId]) || {});
    const resOf = id => BY_ID.get(id) || null;
    const hourNow = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const raining = () => { const w = $gameScreen.weatherType(); return (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0; };
    const isNight = h => h >= 21 || h < 5;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const dayNow = () => (T && T.time ? T.time.day() : 1);

    // ------------------------------------------------------------------
    // Not always there (v1.2.0): conditions ("when" of a resident, the 4th field of a plan entry), the residents gone (the save)
    // ------------------------------------------------------------------
    const store = T.state.define("townLife", () => ({ gone: {} }), { version: 1, owner: PLUGIN });
    const COND = {
        market: () => { const d = dayNow(), Q = T.api("TownQuests"); return Q && typeof Q.isMarket === "function" ? !!Q.isMarket(d) : d % 7 === 0; }
    };
    // a condition: a name (registered; "!name" the opposite; an unknown one holds) or a function
    function condOk(c) {
        if (!c) return true;
        let v = true;
        try {
            if (typeof c === "function") v = !!c();
            else { const neg = c[0] === "!", f = COND[neg ? c.slice(1) : c]; v = f ? !!f() !== neg : true; }
        } catch (e) { v = true; }
        return v;
    }
    function isGone(key) {
        if (!window.$gameSystem) return false;
        const g = store().gone[key];
        return g === true || (typeof g === "number" && dayNow() < g);
    }
    // (v1.3.0: on one of the outdoor maps, a resident who lives on another one now - moved out - is away here too)
    const absent = res => isGone(res.key) || !condOk(res.when) || (!!res.alt && isTown() && homeOf(res) !== $gameMap.mapId());

    // ------------------------------------------------------------------
    // Spots: the data's; an event "Miejsce: <key>" on the map moves one (its direction from its picture, if it has one)
    // ------------------------------------------------------------------
    let spotMap = null, spotMapId = 0;
    function spotsFrom(events, mapId) {
        const out = Object.assign({}, baseSpots(mapId));
        for (const e of events || []) {
            const m = e && /^Miejsce:\s*(\S+)/i.exec(e.name || "");
            if (!m) continue;
            // (the facing: the event picture's; a spot the data has no default for takes the page's direction even with no
            // picture - Podgrodzie's spots, 2026-10-05)
            const old = out[m[1]], img = e.pages && e.pages[0] && e.pages[0].image;
            out[m[1]] = [e.x, e.y, img && (img.characterName || !old) ? img.direction : old ? old[2] : 2];
        }
        return out;
    }
    function spot(key) {
        if (!spotMap || spotMapId !== $gameMap.mapId()) { spotMap = spotsFrom($dataMap && $dataMap.events, $gameMap.mapId()); spotMapId = $gameMap.mapId(); }
        return spotMap[key] || null;
    }

    // ------------------------------------------------------------------
    // The plan: the entry for an hour (the last one starting at or before it; before the first: the day's last one)
    // ------------------------------------------------------------------
    // (an entry with a condition counts only while it holds - v1.2.0)
    function entryAt(res, h) {
        const plan = planOf(res);   // (v1.3.0: the alt plan while the resident lives on its alt map)
        let i = -1, last = -1;
        for (let k = 0; k < plan.length; k++) {
            if (!condOk(plan[k][3])) continue;
            last = k;
            if (plan[k][0] <= h) i = k;
        }
        if (i < 0) i = last >= 0 ? last : plan.length - 1;
        const [hour, act, where] = plan[i];
        return { i, hour, act, where };
    }
    // where an entry sends the resident now: [x, y, dir]
    function targetOf(ev, e, st) {
        if (e.act === "patrol") return spot(e.where[(st.patrol || 0) % e.where.length]);
        if (e.act === "wander" && st.wanderTo) return st.wanderTo;
        return spot(e.where);
    }
    const firstSpot = e => spot(e.act === "patrol" ? e.where[0] : e.where);

    // ------------------------------------------------------------------
    // Onto the map: one event per resident, where its plan puts it now
    // ------------------------------------------------------------------
    function eventData(res, i, data, here, mapId) {
        const spots = spotsFrom(data.events, mapId), e = entryAt(res, hourNow());
        const at = here || spots[e.act === "patrol" ? e.where[0] : e.where] || [1, 1, 2];
        const page = {
            conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
                          switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
            directionFix: false, image: { tileId: 0, characterName: res.sheet, direction: at[2], pattern: 1, characterIndex: 0 },
            list: [{ code: 355, indent: 0, parameters: ["TownLife.talk(this);"] }, { code: 0, indent: 0, parameters: [] }],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: res.speed || 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true
        };
        return { id: idOf(res, i), name: res.name + " (" + res.title + ")", note: "<Town:" + res.key + ">", pages: [page], x: at[0], y: at[1] };
    }
    // indoors on other maps: the tavern's guests stand on "Miejsce: gosc_N" (Map001; N = the order of the residents with a
    // "tawerna" entry in their plans) and the residents at home on "Miejsce: <key>_wnetrze" (their interior's map) - put on
    // every map that has such a spot, shown only while the plan has them in there
    const GUESTS = RES.filter(r => r.plan.some(p => p[2] === "tawerna")).map(r => r.key);
    // (2026-10-14) away: the spots where "inside" means gone off somewhere else, not home (Janek out at sea, Roch on a night run) -
    // shown in no interior then
    // (v1.5.0: res.indoor - an inside place that is not home: its own indoor spot, e.g. a counter in someone else's house)
    const indoorName = (res, e) => (res.away && res.away.includes(e.where) ? null : e.where === "tawerna" ? "gosc_" + (GUESTS.indexOf(res.key) + 1)
        : res.indoor && res.indoor[e.where] ? res.indoor[e.where] : res.key + "_wnetrze");
    function eventSpot(events, name) {
        for (const ev of events || []) {
            if (!ev || !new RegExp("^Miejsce:\\s*" + name + "\\s*$", "i").test(ev.name || "")) continue;
            const img = ev.pages && ev.pages[0] && ev.pages[0].image;
            return [ev.x, ev.y, img ? img.direction : 2];
        }
        return null;
    }
    // (2026-10-16) an indoor place the map has no "Miejsce:" event for may come from the data: TownLifeData.SPOTS_BY_MAP[map][name]
    // (the tavern Map001 stays as the user made it - a guest beyond gosc_8 sits on a place given in the data)
    const indoorSpot = (events, mapId, name) => eventSpot(events, name) || ((D.SPOTS_BY_MAP && D.SPOTS_BY_MAP[mapId]) || {})[name] || null;
    function residentEvents(data, mapId) {
        if (HOMES.has(mapId)) return RES.map((r, i) => (homeOf(r) === mapId ? eventData(r, i, data, null, mapId) : null)).filter(Boolean);
        const out = [];
        RES.forEach((r, i) => {
            const names = [r.key + "_wnetrze"].concat(GUESTS.includes(r.key) ? ["gosc_" + (GUESTS.indexOf(r.key) + 1)] : [], r.indoor ? Object.values(r.indoor) : []);
            const at = names.map(n => indoorSpot(data.events, mapId, n)).find(Boolean);
            if (at) out.push(eventData(r, i, data, at, mapId));
        });
        return out;
    }
    // (2026-10-21) one injection per range of ids (the core takes only the ids of its range from each)
    const inRange = (lo, hi) => e => !!e && e.id >= lo && e.id <= hi;
    T.inject("*", { ids: [FIRST, LAST], owner: PLUGIN, build: (data, mapId) => residentEvents(data, mapId).filter(inRange(FIRST, LAST)) });
    for (const [lo, hi] of RANGES) T.inject("*", { ids: [lo, hi], owner: PLUGIN, build: (data, mapId) => residentEvents(data, mapId).filter(inRange(lo, hi)) });

    // ------------------------------------------------------------------
    // Hidden (inside a building): not seen, not in the way, not spoken to
    // ------------------------------------------------------------------
    function hide(ev, st) {
        st.hidden = true;
        ev.setTransparent(true);
        ev.setThrough(true);
        ev._priorityType = 0;
    }
    function show(ev, st) {
        st.hidden = false;
        ev.setTransparent(false);
        ev.setThrough(false);
        ev._priorityType = 1;
    }
    // hidden, it never starts: it stands on the cell in front of its door, and the action button pressed there is for the door
    // (2026-10-23: the core's one start hook - Tawerna.onEventStart)
    T.onEventStart(ev => !!(ev._town && ev._town.hidden), { owner: PLUGIN, priority: "hidden" });
    const stateOf = ev => ev._town || (ev._town = { i: -1, patrol: 0, stuck: 0, hidden: false, nextBark: 0, wait: 0, talkN: 0, wanderTo: null });

    // straight where the plan puts it now (coming onto the map, the clock jumping)
    function place(ev) {
        const res = resOf(ev.eventId());
        if (!res) return;
        const st = stateOf(ev);
        if (st.held) return;   // (another plugin has it for now)
        const e = entryAt(res, hourNow()), first = firstSpot(e);
        st.i = e.i; st.patrol = 0; st.stuck = 0; st.wanderTo = null; st.wait = 0;
        const at = e.act === "wander" && first ? (st.wanderTo = wanderSpot(first)) : first;
        if (at) { ev.locate(at[0], at[1]); ev.setDirection(at[2]); }
        st.absent = absent(res);
        if (e.act === "inside" || st.absent) hide(ev, st); else show(ev, st);
    }
    // indoors: there while the plan has them inside this very place, hidden otherwise
    function placeIndoor(ev) {
        const res = resOf(ev.eventId());
        if (!res) return;
        const st = stateOf(ev), e = entryAt(res, hourNow());
        const name = e.act === "inside" && !absent(res) ? indoorName(res, e) : null;
        const at = name ? indoorSpot($dataMap.events, $gameMap.mapId(), name) : null;
        if (at && st.hidden !== false) { ev.locate(at[0], at[1]); ev.setDirection(at[2]); show(ev, st); }
        else if (at && (ev.x !== at[0] || ev.y !== at[1]) && !talking(ev)) { ev.locate(at[0], at[1]); ev.setDirection(at[2]); }
        else if (!at && !st.hidden) hide(ev, st);
        st.here = !!at;
    }
    function residents() {
        if (!$gameMap) return [];
        const out = [];
        for (const id of IDS) { const ev = $gameMap.event(id); if (ev) out.push(ev); }
        return out;
    }
    function placeAll() { for (const ev of residents()) place(ev); }

    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        spotMap = null;
        lastHour = null;
        if (isTown()) placeAll();
        else for (const ev of residents()) { stateOf(ev).hidden = null; placeIndoor(ev); }
    };

    // ------------------------------------------------------------------
    // Each frame: everyone does what the hour says
    // ------------------------------------------------------------------
    let lastHour = null, lastWhole = null, nextBarkAny = 0;
    const onScreen = ev => {
        const x = ev.screenX(), y = ev.screenY();
        return x > -48 && y > -48 && x < T.view.w() + 48 && y < T.view.h() + 96;   // (the world's view: Tawerna.view)
    };
    const talking = ev => ev._locked || ($gameMap._interpreter.isRunning() && $gameMap._interpreter.eventId() === ev.eventId());

    function walk(ev, st, tx, ty) {
        const H = window.Hunting, RA = window.RoamingActor;
        const d = H && H.path8 ? H.path8(ev, tx, ty, { key: "town" }).dir : ev.findDirectionTo(tx, ty);
        if (d > 0 && (RA ? RA.canStep(ev, ev.x, ev.y, d) : ev.canPass(ev.x, ev.y, d))) {
            if (RA) RA.step(ev, d); else ev.moveStraight(d);
            st.stuck = 0;
            return;
        }
        st.stuck++;
        if (st.stuck > (onScreen(ev) ? STUCK_SEEN : STUCK_HIDDEN)) {   // (it got there round some other way - unless someone stands there)
            const taken = ($gamePlayer.x === tx && $gamePlayer.y === ty) || $gameMap.eventsXyNt(tx, ty).some(o => o !== ev && o.isNormalPriority());
            if (!taken) ev.locate(tx, ty);
            else if (st.wanderTo) st.wanderTo = null;   // (a stroll picks another cell)
            st.stuck = 0;
        }
    }
    function wanderSpot(at) {
        for (let k = 0; k < 12; k++) {
            const x = at[0] + Math.round((Math.random() * 2 - 1) * WANDER_R), y = at[1] + Math.round((Math.random() * 2 - 1) * WANDER_R);
            if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority())) {
                return [x, y, [2, 4, 6, 8][Math.floor(Math.random() * 4)]];
            }
        }
        return at;
    }
    function drive(ev, h) {
        const res = resOf(ev.eventId()), st = stateOf(ev);
        if (!res || talking(ev) || ev.isMoving()) return;
        if (st.held) {   // (taken over: it walks where it was sent and stands there)
            if (st.goTo && (ev.x !== st.goTo[0] || ev.y !== st.goTo[1])) walk(ev, st, st.goTo[0], st.goTo[1]);
            return;
        }
        if (absent(res)) { if (!st.hidden) hide(ev, st); st.absent = true; return; }   // (away today: hidden all day)
        if (st.absent) { st.absent = false; place(ev); return; }                       // (back: where the plan has it now)
        const e = entryAt(res, h);
        if (st.i !== e.i) {                              // a new part of the day: out of the door, off to the next spot
            st.i = e.i; st.patrol = 0; st.stuck = 0; st.wanderTo = null; st.wait = 0;
            if (st.hidden && e.act !== "inside") show(ev, st);
        }
        if (st.hidden) return;
        if (e.act === "wander" && !st.wanderTo) st.wanderTo = wanderSpot(spot(e.where));
        const at = targetOf(ev, e, st);
        if (!at) return;
        if (ev.x !== at[0] || ev.y !== at[1]) { walk(ev, st, at[0], at[1]); return; }
        // there
        switch (e.act) {
            case "inside": hide(ev, st); return;
            case "patrol": st.patrol = (st.patrol || 0) + 1; return;
            case "wander":
                if (st.wait-- > 0) return;
                st.wanderTo = wanderSpot(spot(e.where));
                st.wait = 120 + Math.floor(Math.random() * 240);
                ev.setDirection(at[2]);
                return;
            case "work":                                  // busy: a look aside now and then, back to the work
                if (st.wait-- > 0) return;
                ev.setDirection(ev.direction() === at[2] ? [2, 4, 6, 8].filter(d => d !== at[2] && d !== 10 - at[2])[Math.floor(Math.random() * 2)] : at[2]);
                st.wait = ev.direction() === at[2] ? 150 + Math.floor(Math.random() * 200) : 40;
                return;
            default: if (ev.direction() !== at[2]) ev.setDirection(at[2]);
        }
    }

    // (2026-10-17) off its own maps, "inside" a place that is not home (res.indoor - Rysiek by his snares on Skraj lasu): the place's
    // name, whose own lines (barks[place] / talk[place]) it says there instead of the home ones; null anywhere else
    const outPlace = (res, e) => (!isTown() && e.act === "inside" && res.indoor && res.indoor[e.where] ? e.where : null);
    // calls when the hero passes
    function barks(ev, h) {
        const res = resOf(ev.eventId()), st = stateOf(ev), now = Graphics.frameCount, SB = T.api("SpeechBubbles");
        if (!SB || st.hidden || now < st.nextBark || now < nextBarkAny || $gameMap.isEventRunning()) return;
        if (Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) > BARK_NEAR) return;
        const e = entryAt(res, h), b = barksOf(res) || {}, out = outPlace(res, e);
        const list = (!isTown() ? (out && b[out] && b[out].length ? b[out] : e.where === "tawerna" ? b.tavern : b.home) :
            raining() && b.rain && b.rain.length ? b.rain : isNight(h) && b.night && b.night.length ? b.night : b[e.act]) || [];
        st.nextBark = now + BARK_GAP[0] + Math.floor(Math.random() * (BARK_GAP[1] - BARK_GAP[0]));
        if (!list.length) return;
        SB.say(ev, pick(list));
        nextBarkAny = now + BARK_GLOBAL;
    }

    // the bell: on a full hour, while Ambroży stands at it
    const ringing = { left: 0, next: 0 };
    function bell(hourWhole) {
        const ev = residents().find(e => (resOf(e.eventId()) || {}).key === "dzwonnik");
        if (!ev) return;
        const e = entryAt(resOf(ev.eventId()), hourWhole + 0.01);
        if (e.act !== "bell") return;
        ringing.left = hourWhole % 12 || 12;
        ringing.next = 0;
    }
    function updateBell() {
        if (ringing.left <= 0 || Graphics.frameCount < ringing.next) return;
        AudioManager.playSe(BELL_SE);
        ringing.left--;
        ringing.next = Graphics.frameCount + 50;
    }

    function tick() {
        const h = hourNow();
        if (lastHour !== null) {
            const jump = Math.abs(h - lastHour), d = Math.min(jump, 24 - jump);
            if (d > 0.25) placeAll();                    // (slept, F9: everyone where they should be)
        }
        const whole = Math.floor(h);
        if (lastWhole !== null && whole !== lastWhole && Math.abs(h - lastHour) < 0.25) bell(whole);
        lastHour = h; lastWhole = whole;
        for (const ev of residents()) { drive(ev, h); barks(ev, h); }
        updateBell();
    }
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (!sceneActive) return;
        if (isTown()) tick();
        else {
            const list = residents();
            if (list.length) { const h = hourNow(); for (const ev of list) { placeIndoor(ev); barks(ev, h); } }
        }
    };

    // ------------------------------------------------------------------
    // Spoken to: what they say now (by the time of day and the weather), each time the next line
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        let line = "";
        for (const w of String(text).split(/\s+/)) {
            if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
        }
        if (line) out.push(line);
        return out;
    }
    // (2026-10-23, docs/ROZMOWY.md) a resident's talk goes through the core's service: the takeovers of the other systems first (their
    // named priorities - Tawerna.talk.PRIORITY: the quests, the shops, the first meetings...), else the resident's own line of the hour.
    // who = the resident's key. opts.skip: an owner left out this time ("Porozmawiaj", "Nie, w innej sprawie": the rest of the talk)
    function ownLines(res, ev) {
        const h = hourNow(), t = talkOf(res) || {}, place = outPlace(res, entryAt(res, h));
        const slot = raining() && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = (place && t[place] && t[place].length ? t[place] : null) || t[slot] || t.day || [];
        if (!list.length) return null;
        const st = stateOf(ev), text = list[st.talkN++ % list.length], lines = wrap(text), out = [];
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push({ code: 101, indent: 0, parameters: ["", 0, 0, 2, res.name] });
            lines.slice(i, i + PAGE).forEach((l, j) => out.push({ code: 401, indent: 0, parameters: [(j === 0 ? "\\SPK[" + ev.eventId() + "]" : "") + l] }));
        }
        return out;
    }
    function talk(interp, opts) {
        const ev = $gameMap.event(interp.eventId()), res = ev && resOf(ev.eventId());
        if (!res || stateOf(ev).hidden) return;
        T.talk.run(interp, res.key, { ev, owner: PLUGIN, skip: opts && opts.skip, base: () => ownLines(res, ev) });
    }
    // (old) TownLife.addTalkHook(fn(key, ev, interp), first): kept for a plugin from outside - a takeover of the core's service at
    // "owner" (first) or "after" (else) priority; the game's own plugins register Tawerna.talk.takeover with their own priority
    let oldHooks = 0;
    function addTalkHook(fn, first) {
        if (typeof fn !== "function" || fn._twTalk) return;
        fn._twTalk = true;
        T.util.warnOnce("addTalkHook", "TownLife.addTalkHook is old - use Tawerna.talk.takeover({ owner, who, priority, run }) (docs/ROZMOWY.md)");
        T.talk.takeover({ owner: "addTalkHook", name: String(++oldHooks), who: (key => RES.some(r => r.key === key)), priority: first ? T.talk.PRIORITY.owner + oldHooks / 1000 : T.talk.PRIORITY.after - oldHooks / 1000,
            run: ctx => fn(ctx.who, ctx.ev, ctx.interp) });
    }

    // ------------------------------------------------------------------
    const api = {
        RESIDENTS: RES, spot, entryAt, placeAll, talk, residents, homeOf, HOMES,
        // (2026-10-23) old: Tawerna.talk.takeover instead (docs/ROZMOWY.md)
        addTalkHook,
        say: (key, text) => { const ev = api.eventOf(key), SB = T.api("SpeechBubbles"); if (ev && SB && !stateOf(ev).hidden) SB.say(ev, text); },
        // the lines a resident says (the plugin's own: for a hook that wants the usual talk after its part)
        lines: key => { const r = RES.find(x => x.key === key); return r ? talkOf(r) : null; },
        eventOf: key => residents().find(e => (resOf(e.eventId()) || {}).key === key) || null,
        state: key => { const ev = api.eventOf(key); return ev ? Object.assign({ x: ev.x, y: ev.y, act: entryAt(resOf(ev.eventId()), hourNow()).act }, ev._town) : null; },
        ringing: () => ringing.left,
        // (v1.2.0) conditions, residents gone, residents taken over by another plugin
        addCondition: (name, fn) => { if (name && typeof fn === "function") COND[name] = fn; },
        condOk,
        gone: key => isGone(key),
        absent: key => { const r = RES.find(x => x.key === key); return !!r && absent(r); },
        // v: true (gone for good), a day (gone until that day), false (back)
        setGone(key, v) {
            const g = store().gone;
            if (v === true || (typeof v === "number" && v > 0)) g[key] = v; else delete g[key];
            const ev = api.eventOf(key);
            if (ev && isGone(key) && !stateOf(ev).held) { hide(ev, stateOf(ev)); stateOf(ev).absent = true; }
            return isGone(key);
        },
        // on: the plan stops driving it; to: [x, y] - it walks there (path8) and stands. Off: back to its plan
        hold(key, on, to) {
            const ev = api.eventOf(key);
            if (!ev) return false;
            const st = stateOf(ev);
            st.held = !!on;
            st.goTo = on && to ? [to[0], to[1]] : null;
            st.stuck = 0;
            if (on && st.hidden) show(ev, st);
            if (!on) { st.i = -1; st.wanderTo = null; }
            return true;
        },
        held: key => { const ev = api.eventOf(key); return !!ev && !!stateOf(ev).held; }
    };
    window.TownLife = T.register(PLUGIN, api);
})();
