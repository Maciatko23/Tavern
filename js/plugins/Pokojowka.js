//=============================================================================
// Pokojowka.js
//=============================================================================
// The tavern's chambermaid, Zośka (2026-11-16, the user: „dodaj pokojówkę, która sprząta pokoje, ale też zamiata wszędzie podłogę i dokłada
// do kominków drewna”). One injected event on each of the tavern's three floors (Map001 hall, Map025 floor I, Map026 floor II); she is on
// the floor of her shift only:
//    6- 9 the hall: sweeps, feeds the two fireplaces        9-13 floor I: sweeps the corridors, does the rooms
//   13-16 floor II: sweeps the gallery, does the suites     16-19 the hall again        19-22 floor I        22-6 asleep (the servants' room)
//   - sweeping: walks to a spot, sweeps there with her broom (turning left and right), goes on;
//   - a room: walks to its door in the corridor, goes in (out of sight a while), comes out;
//   - a fireplace: walks up to it, puts wood on (a crackle).
// A shift ends: she walks to the stairs and is gone; the next floor has her from then on. Nobody pops in sight. Nothing goes into the save.
// The action button: a short talk (js/teksty/pokojowka.txt). Other plugins and the tests: window.Pokojowka (state, shift, force).

/*:
 * @target MZ
 * @plugindesc Pokojówka Zośka: zamiata podłogi na wszystkich piętrach tawerny, sprząta pokoje, dokłada drewna do kominków. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Watki
 * @orderAfter Hunting
 * @orderAfter Kelnerka
 *
 * @help
 * Stan nie trafia do zapisu gry. Kwestie: js/teksty/pokojowka.txt.
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    const PLUGIN = "Pokojowka";
    const TK = Watki.teksty("pokojowka");
    const ID = 3312, SHEET = "$Npc_Pula_K2";
    // each floor: the stairs' cell she comes and goes by, where she sweeps, the fireplaces' cells (she stands there facing up)
    const FLOORS = {
        1: { stairs: [2, 36], sweep: [[14, 25], [8, 24], [20, 24], [14, 33], [6, 30], [22, 30], [14, 19], [9, 37], [19, 37]], fires: [[4, 16], [24, 16]] },
        25: { stairs: [2, 36], sweep: [[6, 17], [20, 18], [34, 17], [44, 18], [14, 26], [14, 37], [20, 38], [40, 38]], fires: [] },
        26: { stairs: [6, 36], sweep: [[8, 17], [24, 18], [40, 17], [14, 26], [14, 37], [22, 38], [2, 38]], fires: [] }
    };
    const SHIFTS = [[6, 9, 1], [9, 13, 25], [13, 16, 26], [16, 19, 1], [19, 22, 25]];   // from, to (hours), the map
    const IDLE_MIN = 1.5, IDLE_MAX = 5, SWEEP = 5, ROOM_MIN = 6, ROOM_MAX = 11, FIRE = 3;   // seconds
    const rnd = (a, b) => a + Math.random() * (b - a);
    const sec = s => Math.round(s * 60);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const hourNow = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : T.time.hour());
    const shiftMap = () => { const h = hourNow(), s = SHIFTS.find(q => h >= q[0] && h < q[1]); return s ? s[2] : 0; };
    const lines = k => { const v = TK && TK[k]; return Array.isArray(v) ? v : v ? Object.values(v) : []; };
    const free = c => $gameMap.isValid(c[0], c[1]) && $gameMap.checkPassage(c[0], c[1], 0x0f) && !($gamePlayer.x === c[0] && $gamePlayer.y === c[1]) &&
        !$gameMap.eventsXy(c[0], c[1]).some(e => e.eventId() !== ID && e.isNormalPriority() && !e.isThrough());

    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    T.inject(Object.keys(FLOORS).map(Number), { ids: [ID, ID], owner: PLUGIN, build: (data, mapId) => [{ id: ID, name: "Pokojówka Zośka", note: "", x: FLOORS[mapId].stairs[0], y: FLOORS[mapId].stairs[1],
        pages: [{ conditions: Object.assign({}, COND), directionFix: false, image: { tileId: 0, characterName: SHEET, direction: 2, pattern: 1, characterIndex: 0 },
            list: [{ code: 355, indent: 0, parameters: ["Pokojowka.rozmowa(this);"] }, { code: 0, indent: 0, parameters: [] }], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }] }] });

    // ------------------------------------------------------------------ the state (memory only)
    const S = { ev: null, map: 0, state: "", t: 0, goal: null, stuck: 0, broom: false, after: null, did: { sweep: 0, room: 0, fire: 0 } };
    const hide = (ev, on) => { ev.setTransparent(on); ev.setThrough(on); };
    const idle = () => { S.state = "idle"; S.broom = false; S.t = sec(rnd(IDLE_MIN, IDLE_MAX)); };
    function layOut(ev) {
        S.ev = ev; S.map = $gameMap.mapId(); S.goal = null; S.stuck = 0; S.broom = false; S.after = null;
        const F = FLOORS[S.map];
        if (shiftMap() !== S.map) { ev.locate(F.stairs[0], F.stairs[1]); hide(ev, true); S.state = "away"; return; }
        const c = pick(F.sweep.filter(free)) || F.stairs;
        ev.locate(c[0], c[1]); hide(ev, false); idle();
    }
    // ------------------------------------------------------------------ walking (as the hall's guests walk)
    function walkTo(x, y, then) { S.goal = { x, y, then }; S.stuck = 0; S.state = "walk"; }
    function stepWalk() {
        const ev = S.ev, g = S.goal;
        if (!g) { idle(); return; }
        if (ev.isMoving()) return;
        if (ev.x === g.x && ev.y === g.y) { S.goal = null; g.then(); return; }
        const H = window.Hunting, RA = window.RoamingActor;
        const d = H && H.path8 ? H.path8(ev, g.x, g.y, { key: "pokojowka" + S.map }).dir : ev.findDirectionTo(g.x, g.y);
        if (d > 0 && RA && RA.canStep(ev, ev.x, ev.y, d)) { ev.setThrough(false); RA.step(ev, d); S.stuck = 0; return; }
        // (2026-11-16, the user: „postać chodzi po murze”) no way on: she waits for whoever stands there; never through a wall. A place
        // she cannot reach is given up for another; on her way off the floor she just keeps waiting.
        S.stuck++;
        if (S.stuck > 150 && !S.leaving) { S.goal = null; idle(); }
    }
    // ------------------------------------------------------------------ her work
    const doors = () => $gameMap.events().filter(e => /^Drzwi ->/.test(e.event().name) && e.y === 15).map(e => [e.x, 16]).filter(free);
    function sweep() {
        const c = pick(FLOORS[S.map].sweep.filter(q => free(q) && !(q[0] === S.ev.x && q[1] === S.ev.y)));
        if (!c) { idle(); return; }
        walkTo(c[0], c[1], () => { S.state = "sweep"; S.broom = true; S.t = sec(SWEEP); S.did.sweep++; });
    }
    function room() {
        const c = pick(doors());
        if (!c) { sweep(); return; }
        walkTo(c[0], c[1], () => {
            const ev = S.ev;
            ev.setDirection(8);
            AudioManager.playSe({ name: "Door1", volume: 45, pitch: 100, pan: 0 });
            hide(ev, true); S.state = "inside"; S.t = sec(rnd(ROOM_MIN, ROOM_MAX)); S.did.room++;
            S.after = () => { AudioManager.playSe({ name: "Door1", volume: 40, pitch: 95, pan: 0 }); ev.setDirection(2); hide(ev, false); idle(); };
        });
    }
    function fire() {
        const c = pick(FLOORS[S.map].fires.filter(free));
        if (!c) { sweep(); return; }
        walkTo(c[0], c[1], () => {
            S.ev.setDirection(8); S.state = "fire"; S.t = sec(FIRE); S.did.fire++;
            AudioManager.playSe({ name: "Fire1", volume: 35, pitch: 110, pan: 0 });
        });
    }
    function next() {
        const F = FLOORS[S.map], r = Math.random();
        if (F.fires.length && r < 0.3) fire();
        else if (S.map !== 1 && r < 0.45) room();
        else sweep();
    }
    function leave() {
        const st = FLOORS[S.map].stairs;
        S.broom = false;
        walkTo(st[0], st[1], () => { S.ev.setDirection(8); hide(S.ev, true); S.state = "away"; });
        S.leaving = true;
    }
    const talking = ev => ev._locked || ($gameMap._interpreter.isRunning() && $gameMap._interpreter.eventId() === ev.eventId());

    T.onMapUpdate(() => {
        const here = window.$gameMap ? $gameMap.mapId() : 0;
        if (!FLOORS[here]) { S.ev = null; return; }
        const ev = $gameMap.event(ID);
        if (!ev) return;
        if (S.ev !== ev) { S.leaving = false; layOut(ev); }
        if (talking(ev)) return;
        const due = shiftMap() === here;
        if (S.state === "away") {
            if (due) { const st = FLOORS[here].stairs; ev.locate(st[0], st[1]); ev.setDirection(2); hide(ev, false); S.leaving = false; idle(); }
            return;
        }
        if (!due && !S.leaving && S.state !== "inside") { S.goal = null; leave(); return; }
        switch (S.state) {
            case "walk": stepWalk(); break;
            case "idle": if (--S.t <= 0) next(); break;
            case "sweep": if (S.t % 24 === 0) ev.setDirection(ev.direction() === 4 ? 6 : 4); if (--S.t <= 0) idle(); break;
            case "fire": if (--S.t <= 0) idle(); break;
            case "inside": if (--S.t <= 0) { const f = S.after; S.after = null; if (f) f(); } break;
        }
    }, { owner: PLUGIN, name: "pokojowka" });

    // ------------------------------------------------------------------ the broom in her hands while she sweeps
    let broom = null;
    function broomBitmap() {
        if (broom) return broom;
        broom = new Bitmap(10, 30);
        broom.fillRect(4, 0, 2, 20, "#3a2716"); broom.fillRect(5, 0, 1, 20, "#7c5a38");            // the stick
        broom.fillRect(2, 19, 6, 2, "#2c1c10");                                                      // the binding
        for (let x = 0; x < 10; x++) broom.fillRect(x, 21, 1, 7 + (x % 3), x % 2 ? "#c8a24a" : "#a07c30");   // the straw
        broom.fillRect(0, 21, 10, 1, "#6a4a1c");
        return broom;
    }
    const _update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _update.call(this);
        const mine = S.ev && this._character === S.ev;
        if (!mine && !this._pokojowkaBroom) return;
        if (mine && S.broom && !this._pokojowkaBroom) {
            const b = this._pokojowkaBroom = new Sprite(broomBitmap());
            b.anchor.set(0.5, 1); this.addChild(b);
        }
        const b = this._pokojowkaBroom;
        if (!b) return;
        b.visible = !!(mine && S.broom && S.state === "sweep");
        if (b.visible) { const left = S.ev.direction() === 4; b.x = left ? -13 : 13; b.y = 2; b.rotation = (left ? 0.35 : -0.35) + Math.sin(Graphics.frameCount / 5) * 0.12; }
    };

    // ------------------------------------------------------------------ the talk
    function rozmowa() {
        const l = lines(S.state === "sweep" ? "zamiata" : S.state === "fire" ? "ogien" : "rozmowa");
        if (!l.length) return;
        $gameMessage.setSpeakerName(TK.imie || "Zośka");
        $gameMessage.add(pick(l));
    }

    window.Pokojowka = T.register(PLUGIN, {
        rozmowa, shift: shiftMap,
        state: () => S.ev ? { state: S.state, map: S.map, x: S.ev.x, y: S.ev.y, broom: S.broom, hidden: S.ev.isTransparent(), goal: S.goal ? [S.goal.x, S.goal.y] : null, did: Object.assign({}, S.did) } : null,
        force: what => { if (!S.ev || S.state !== "idle") return false; ({ sweep, room, fire }[what] || next)(); return true; }
    });
})();
