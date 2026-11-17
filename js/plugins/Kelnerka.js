//=============================================================================
// Kelnerka.js
//=============================================================================
// The tavern's waitress, Jagna (2026-11-16, the user: „trzeba dorobić kelnerkę, która z kuchni nosi ludziom do stołów rzeczy”). One injected
// event on the hall's map (Map001):
//   - she works in the kitchen by the stove; every now and then she takes a bowl, comes out by the back door behind the bar ("Drzwi na
//     zaplecze" - the kitchen has no other way), carries it to a guest sitting at a table (Goscie_Sala), says a word, goes back;
//   - with nobody at the tables she wipes the bar from time to time;
//   - at night (0-6) she goes up the west stairs to the servants' room and is gone from the hall; at six she comes down again.
// Nobody pops in or out in sight: she always walks to the door or the stairs. Nothing goes into the save - laid out from the hour.
// The action button: a short talk (js/teksty/kelnerka.txt). Other plugins and the tests: window.Kelnerka (state, force).

/*:
 * @target MZ
 * @plugindesc Kelnerka Jagna: nosi z kuchni miski do gości przy stołach, przeciera ladę, nocą idzie spać na górę. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Watki
 * @orderAfter Hunting
 * @orderAfter Goscie_Sala
 *
 * @help
 * Stan nie trafia do zapisu gry. Kwestie: js/teksty/kelnerka.txt.
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    const PLUGIN = "Kelnerka";
    const TK = Watki.teksty("kelnerka");
    const MAP = 1, ID = 3310, SHEET = "$Npc_Pula_K3";
    const DOOR = { x: 14, y: 14 }, KITCHEN = { x: 14, y: 9 }, STOVE = { x: 12, y: 6 }, STAIRS = { x: 2, y: 36 }, BAR = { x: 12, y: 15 };
    const SLEEP_FROM = 0, SLEEP_TO = 6;                  // hours
    const COOK_MIN = 7, COOK_MAX = 16, SERVE = 2.2, WIPE = 4, DOOR_WAIT = 0.7;   // seconds
    const rnd = (a, b) => a + Math.random() * (b - a);
    const sec = s => Math.round(s * 60);
    const hourNow = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : T.time.hour());
    const sleepy = () => { const h = hourNow(); return h >= SLEEP_FROM && h < SLEEP_TO; };
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const lines = k => { const v = TK && TK[k]; return Array.isArray(v) ? v : v ? Object.values(v) : []; };

    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    T.inject([MAP], { ids: [ID, ID], owner: PLUGIN, build: () => [{ id: ID, name: "Kelnerka Jagna", note: "", x: STOVE.x, y: STOVE.y, pages: [{ conditions: Object.assign({}, COND),
        directionFix: false, image: { tileId: 0, characterName: SHEET, direction: 2, pattern: 1, characterIndex: 0 },
        list: [{ code: 355, indent: 0, parameters: ["Kelnerka.rozmowa(this);"] }, { code: 0, indent: 0, parameters: [] }], moveFrequency: 3,
        moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
        priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }] }] });

    // ------------------------------------------------------------------ the state (memory only)
    const S = { ev: null, state: "", t: 0, goal: null, stuck: 0, carry: false };
    const inKitchen = ev => ev.y <= 9;
    const hide = (ev, on) => { ev.setTransparent(on); ev.setThrough(on); };
    function layOut(ev) {
        S.ev = ev; S.goal = null; S.carry = false; S.stuck = 0;
        ev.setMoveSpeed(3);
        if (sleepy()) { ev.locate(STAIRS.x, STAIRS.y); hide(ev, true); S.state = "asleep"; }
        else { ev.locate(STOVE.x, STOVE.y); ev.setDirection(8); hide(ev, false); S.state = "cook"; S.t = sec(rnd(3, COOK_MAX)); }
    }
    // ------------------------------------------------------------------ walking (as the hall's guests walk)
    function walkTo(x, y, then) { S.goal = { x, y, then }; S.stuck = 0; }
    function stepWalk() {
        const ev = S.ev, g = S.goal;
        if (!g || ev.isMoving()) return;
        if (ev.x === g.x && ev.y === g.y) { S.goal = null; g.then(); return; }
        const H = window.Hunting, RA = window.RoamingActor;
        const d = H && H.path8 ? H.path8(ev, g.x, g.y, { key: "sala" }).dir : ev.findDirectionTo(g.x, g.y);
        if (d > 0 && RA && RA.canStep(ev, ev.x, ev.y, d)) { ev.setThrough(false); RA.step(ev, d); S.stuck = 0; return; }
        // (2026-11-16, the user: „postać chodzi po murze”) no way on: she waits for whoever stands there; never through a wall. A guest
        // she cannot reach: back to the kitchen with the bowl (on her way home or to bed she just keeps waiting).
        S.stuck++;
        if (S.stuck > 150 && S.carry) { S.stuck = 0; S.goal = null; backToStove(); }
    }
    // through the back door: to its cell on one side, a moment out of sight, out on the other side
    function throughDoor(toKitchen, then) {
        const a = toKitchen ? DOOR : KITCHEN, b = toKitchen ? KITCHEN : DOOR;
        walkTo(a.x, a.y, () => {
            const ev = S.ev;
            ev.setDirection(toKitchen ? 8 : 2);
            AudioManager.playSe({ name: "Door1", volume: 45, pitch: 100, pan: 0 });
            hide(ev, true); S.state = "door"; S.t = sec(DOOR_WAIT);
            S.after = () => { ev.locate(b.x, b.y); ev.setDirection(toKitchen ? 8 : 2); hide(ev, false); then(); };
        });
        S.state = "walk";
    }
    const toHall = then => { if (inKitchen(S.ev)) throughDoor(false, then); else then(); };
    function backToStove() {
        S.carry = false;
        const home = () => { walkTo(STOVE.x, STOVE.y, () => { S.ev.setDirection(8); S.state = "cook"; S.t = sec(rnd(COOK_MIN, COOK_MAX)); }); S.state = "walk"; };
        if (inKitchen(S.ev)) home(); else throughDoor(true, home);
    }
    // ------------------------------------------------------------------ what she does
    function seatedGuest() {
        const G = window.GoscieSala;
        if (!G || !G.guests || !G.seats) return null;
        const seats = G.seats(), sit = G.guests().filter(g => g.state === "sit" && g.seat);
        const list = sit.map(g => { const s = seats.find(q => q.x === g.seat[0] && q.y === g.seat[1]); return s ? { id: g.id, x: s.ax, y: s.ay, sx: s.x, sy: s.y } : null; })
            .filter(c => c && !($gamePlayer.x === c.x && $gamePlayer.y === c.y) && $gameMap.checkPassage(c.x, c.y, 0x0f));
        return list.length ? pick(list) : null;
    }
    function serve() {
        const c = seatedGuest();
        if (!c) { if (Math.random() < 0.5) { wipe(); } else { S.t = sec(rnd(COOK_MIN, COOK_MAX)); } return; }
        S.carry = true;
        toHall(() => {
            walkTo(c.x, c.y, () => {
                const ev = S.ev;
                ev.setDirection(c.sx > ev.x ? 6 : c.sx < ev.x ? 4 : c.sy > ev.y ? 2 : 8);
                S.carry = false; S.state = "serve"; S.t = sec(SERVE);
                const sb = T.api("SpeechBubbles") || window.SpeechBubbles, l = lines("podaje");
                if (sb && sb.say && l.length) sb.say(ev, pick(l));
            });
            S.state = "walk";
        });
    }
    function wipe() {
        toHall(() => { walkTo(BAR.x, BAR.y, () => { S.ev.setDirection(2); S.state = "wipe"; S.t = sec(WIPE); }); S.state = "walk"; });
    }
    function goToBed() {
        S.carry = false;
        toHall(() => { walkTo(STAIRS.x, STAIRS.y, () => { S.ev.setDirection(8); hide(S.ev, true); S.state = "asleep"; }); S.state = "walk"; });
        S.state = "walk"; S.bed = true;
    }
    function wakeUp() {
        const ev = S.ev;
        ev.locate(STAIRS.x, STAIRS.y); ev.setDirection(2); hide(ev, false); S.bed = false;
        backToStove();
    }
    const talking = ev => ev._locked || ($gameMap._interpreter.isRunning() && $gameMap._interpreter.eventId() === ev.eventId());

    T.onMapUpdate(() => {
        if (!window.$gameMap || $gameMap.mapId() !== MAP) { S.ev = null; return; }
        const ev = $gameMap.event(ID);
        if (!ev) return;
        if (S.ev !== ev) layOut(ev);
        if (talking(ev)) return;
        if (S.state === "asleep") { if (!sleepy()) wakeUp(); return; }
        if (sleepy() && !S.bed && S.state !== "door") { S.goal = null; goToBed(); return; }
        switch (S.state) {
            case "walk": stepWalk(); break;
            case "door": if (--S.t <= 0) { const f = S.after; S.after = null; S.state = "walk"; if (f) f(); } break;
            case "cook": if (--S.t <= 0) serve(); break;
            case "serve": case "wipe": if (--S.t <= 0) backToStove(); break;
        }
    }, { owner: PLUGIN, name: "kelnerka" });

    // ------------------------------------------------------------------ the bowl in her hands while she carries
    let bowl = null;
    function bowlBitmap() {
        if (bowl) return bowl;
        const ROWS = ["....dddddddd....", "..ddwwwwwwwwdd..", ".dwwsSsssSSsswwd", "dwssSSsSssSssSwd", ".dwsssSSsSsssd..", "..dbbbbbbbbbbd..", "...dbbbbbbbbd...", "....dddddddd...."];
        const PAL = { d: "#2c1c10", w: "#8a6038", b: "#6a4526", s: "#8c4a22", S: "#c07a38" };
        bowl = new Bitmap(16, 8);
        ROWS.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (PAL[r[x]]) bowl.fillRect(x, y, 1, 1, PAL[r[x]]); });
        return bowl;
    }
    const _update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _update.call(this);
        const mine = S.ev && this._character === S.ev;
        if (!mine && !this._kelnerkaBowl) return;
        if (mine && S.carry && !this._kelnerkaBowl) {
            const b = this._kelnerkaBowl = new Sprite(bowlBitmap());
            b.anchor.set(0.5, 1); this.addChild(b);
        }
        const b = this._kelnerkaBowl;
        if (!b) return;
        b.visible = !!(mine && S.carry);
        if (b.visible) { const d = S.ev.direction(); b.x = d === 4 ? -9 : d === 6 ? 9 : 0; b.y = -20; b.visible = d !== 8; }   // (carried in front of her: from behind it is hidden)
    };

    // ------------------------------------------------------------------ the talk
    function rozmowa() {
        const l = lines(S.carry ? "zajeta" : sleepy() ? "noc" : "rozmowa");
        if (!l.length) return;
        $gameMessage.setSpeakerName(TK.imie || "Jagna");
        $gameMessage.add(pick(l));
    }

    window.Kelnerka = T.register(PLUGIN, {
        rozmowa,
        state: () => S.ev ? { state: S.state, x: S.ev.x, y: S.ev.y, carry: S.carry, hidden: S.ev.isTransparent(), goal: S.goal ? [S.goal.x, S.goal.y] : null, t: S.t } : null,
        force: what => { if (!S.ev || S.state !== "cook") return false; if (what === "wipe") wipe(); else { S.t = 0; } return true; }
    });
})();
