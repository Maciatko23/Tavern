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

/*:
 * @target MZ
 * @plugindesc Miasteczko żyje według zegara: mieszkańcy chodzą, pracują, wchodzą do domów i tawerny, wołają, rozmawiają; dzwon wybija godziny. v1.1.0
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
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna, D = window.TownLifeData, PLUGIN = "TownLife";
    if (!D) throw new Error("TownLife.js: TownLife_Data.js must stand above it in the plugin list");
    const MAP = D.MAP, FIRST = D.FIRST_ID, LAST = FIRST + 39;
    const RES = D.RESIDENTS;
    const WANDER_R = 3;                 // tiles round the spot a stroll goes
    const BARK_NEAR = 4.5;              // tiles: the hero this close hears a call
    const BARK_GAP = [900, 1800];       // frames between one resident's calls
    const BARK_GLOBAL = 300;            // frames between any two calls
    const STUCK_HIDDEN = 120;           // frames stuck on the way, off the screen: it gets there anyway
    const STUCK_SEEN = 900;             // ...and on the screen
    const BELL_SE = { name: "Bell3", volume: 70, pitch: 85, pan: 0 };

    // the outdoor map each resident lives on (Map008 unless its data says "map"), and all such maps
    const homeOf = r => r.map || MAP;
    const HOMES = new Set(RES.map(homeOf));
    const isTown = () => !!($gameMap && HOMES.has($gameMap.mapId()));
    const baseSpots = mapId => (mapId === MAP ? D.SPOTS : (D.SPOTS_BY_MAP && D.SPOTS_BY_MAP[mapId]) || {});
    const resOf = id => (id >= FIRST && id < FIRST + RES.length ? RES[id - FIRST] : null);
    const hourNow = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const raining = () => { const w = $gameScreen.weatherType(); return (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0; };
    const isNight = h => h >= 21 || h < 5;
    const pick = list => list[Math.floor(Math.random() * list.length)];

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
    function entryAt(res, h) {
        let i = res.plan.length - 1;
        for (let k = 0; k < res.plan.length; k++) if (res.plan[k][0] <= h) i = k;
        const [hour, act, where] = res.plan[i];
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
        return { id: FIRST + i, name: res.name + " (" + res.title + ")", note: "<Town:" + res.key + ">", pages: [page], x: at[0], y: at[1] };
    }
    // indoors on other maps: the tavern's guests stand on "Miejsce: gosc_N" (Map001; N = the order of the residents with a
    // "tawerna" entry in their plans) and the residents at home on "Miejsce: <key>_wnetrze" (their interior's map) - put on
    // every map that has such a spot, shown only while the plan has them in there
    const GUESTS = RES.filter(r => r.plan.some(p => p[2] === "tawerna")).map(r => r.key);
    const indoorName = (res, e) => (e.where === "tawerna" ? "gosc_" + (GUESTS.indexOf(res.key) + 1) : res.key + "_wnetrze");
    function eventSpot(events, name) {
        for (const ev of events || []) {
            if (!ev || !new RegExp("^Miejsce:\\s*" + name + "\\s*$", "i").test(ev.name || "")) continue;
            const img = ev.pages && ev.pages[0] && ev.pages[0].image;
            return [ev.x, ev.y, img ? img.direction : 2];
        }
        return null;
    }
    T.inject("*", { ids: [FIRST, LAST], owner: PLUGIN, build(data, mapId) {
        if (HOMES.has(mapId)) return RES.map((r, i) => (homeOf(r) === mapId ? eventData(r, i, data, null, mapId) : null)).filter(Boolean);
        const out = [];
        RES.forEach((r, i) => {
            const names = [r.key + "_wnetrze"].concat(GUESTS.includes(r.key) ? ["gosc_" + (GUESTS.indexOf(r.key) + 1)] : []);
            const at = names.map(n => eventSpot(data.events, n)).find(Boolean);
            if (at) out.push(eventData(r, i, data, at, mapId));
        });
        return out;
    } });

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
    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        if (this._town && this._town.hidden) return;
        _Game_Event_start.call(this);
    };
    const stateOf = ev => ev._town || (ev._town = { i: -1, patrol: 0, stuck: 0, hidden: false, nextBark: 0, wait: 0, talkN: 0, wanderTo: null });

    // straight where the plan puts it now (coming onto the map, the clock jumping)
    function place(ev) {
        const res = resOf(ev.eventId());
        if (!res) return;
        const st = stateOf(ev), e = entryAt(res, hourNow()), first = firstSpot(e);
        st.i = e.i; st.patrol = 0; st.stuck = 0; st.wanderTo = null; st.wait = 0;
        const at = e.act === "wander" && first ? (st.wanderTo = wanderSpot(first)) : first;
        if (at) { ev.locate(at[0], at[1]); ev.setDirection(at[2]); }
        if (e.act === "inside") hide(ev, st); else show(ev, st);
    }
    // indoors: there while the plan has them inside this very place, hidden otherwise
    function placeIndoor(ev) {
        const res = resOf(ev.eventId());
        if (!res) return;
        const st = stateOf(ev), e = entryAt(res, hourNow());
        const at = e.act === "inside" ? eventSpot($dataMap.events, indoorName(res, e)) : null;
        if (at && st.hidden !== false) { ev.locate(at[0], at[1]); ev.setDirection(at[2]); show(ev, st); }
        else if (at && (ev.x !== at[0] || ev.y !== at[1]) && !talking(ev)) { ev.locate(at[0], at[1]); ev.setDirection(at[2]); }
        else if (!at && !st.hidden) hide(ev, st);
        st.here = !!at;
    }
    function residents() {
        if (!$gameMap) return [];
        const out = [];
        for (let id = FIRST; id < FIRST + RES.length; id++) { const ev = $gameMap.event(id); if (ev) out.push(ev); }
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
        return x > -48 && y > -48 && x < Graphics.width + 48 && y < Graphics.height + 96;
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

    // calls when the hero passes
    function barks(ev, h) {
        const res = resOf(ev.eventId()), st = stateOf(ev), now = Graphics.frameCount, SB = T.api("SpeechBubbles");
        if (!SB || st.hidden || now < st.nextBark || now < nextBarkAny || $gameMap.isEventRunning()) return;
        if (Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) > BARK_NEAR) return;
        const e = entryAt(res, h), b = res.barks || {};
        const list = (!isTown() ? (e.where === "tawerna" ? b.tavern : b.home) :
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
    // other plugins (quests) speak first: fn(key, event, interpreter) -> a list of event commands (it ends the talk) or null
    const talkHooks = [];
    function talk(interp) {
        const ev = $gameMap.event(interp.eventId()), res = ev && resOf(ev.eventId());
        if (!res || stateOf(ev).hidden) return;
        for (const fn of talkHooks) {
            let list = null;
            try { list = fn(res.key, ev, interp); } catch (e) { console.error(e); }
            if (list && list.length) { interp.setupChild(list.concat([{ code: 0, indent: 0, parameters: [] }]), ev.eventId()); return; }
        }
        const h = hourNow(), t = res.talk || {};
        const slot = raining() && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return;
        const st = stateOf(ev), text = list[st.talkN++ % list.length], lines = wrap(text), out = [];
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push({ code: 101, indent: 0, parameters: ["", 0, 0, 2, res.name] });
            lines.slice(i, i + PAGE).forEach((l, j) => out.push({ code: 401, indent: 0, parameters: [(j === 0 ? "\\SPK[" + ev.eventId() + "]" : "") + l] }));
        }
        out.push({ code: 0, indent: 0, parameters: [] });
        interp.setupChild(out, ev.eventId());
    }

    // ------------------------------------------------------------------
    const api = {
        RESIDENTS: RES, spot, entryAt, placeAll, talk, residents, homeOf, HOMES,
        addTalkHook: fn => { if (typeof fn === "function" && !talkHooks.includes(fn)) talkHooks.push(fn); },
        say: (key, text) => { const ev = api.eventOf(key), SB = T.api("SpeechBubbles"); if (ev && SB && !stateOf(ev).hidden) SB.say(ev, text); },
        // the lines a resident says (the plugin's own: for a hook that wants the usual talk after its part)
        lines: key => { const r = RES.find(x => x.key === key); return r ? r.talk : null; },
        eventOf: key => residents().find(e => (resOf(e.eventId()) || {}).key === key) || null,
        state: key => { const ev = api.eventOf(key); return ev ? Object.assign({ x: ev.x, y: ev.y, act: entryAt(resOf(ev.eventId()), hourNow()).act }, ev._town) : null; },
        ringing: () => ringing.left
    };
    window.TownLife = T.register(PLUGIN, api);
})();
