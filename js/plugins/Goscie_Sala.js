//=============================================================================
// Goscie_Sala.js
//=============================================================================
// The people at the tables of the tavern's hall, Map001 (2026-11-05; the player: "ludzie w tawernie dziwnie siedzą... z każdym można zamienić słowo, po ludzku... mogą wstawać, chodzić
// po tawernie, potem siadać, jeść i pić"; "dostosuj siedzącego do tych krzeseł"). The events "Gość stołowy (Przytulna)" 400-422 (<Siedzi:Key> in the note; the map file is not touched):
//   - in the evening each comes in by the door at an hour of his own, walks to a free round chair and sits on it (his hips on the seat: Przytulna_Siedzi_<Key>.png, tools/tavern/siadanie);
//     late at night he goes out again; a guest whose hour passed while the hero was away is simply there;
//   - sitting: eats from a bowl on the table, then drinks from his mug, each with its frames, resting in between;
//   - now and then he gets up and walks: to the bar, the fire, the stage or to a seated acquaintance, stands there a while and sits down again, his own chair or another free one;
//   - the action button: a talk through Tawerna.talk (js/teksty/goscie_sali.txt): greeting, "Kim jesteś?", "Co słychać?", "Masz dla mnie jakąś radę?" - he stops what he is doing for it.
// Chairs: the tile 390 beside a table, in the hall; never one with another event on it (the residents' gosc_N places, the hero's meal place, Ozzy). Nobody sits on a taken chair. Walking
// guests give way: when someone stands in the way they wait, then pass. A guest on his chair has the chair's own block; through it is the only thing a talk needs.
// Nothing goes into the save: the state lives in memory and is laid out again from the hour on entering the map. Switched with Przytulna (Opcje "Przytulna sala").
// Other plugins and the tests: window.GoscieSala (on, guests, seats, guest, force, stats).

/*:
 * @target MZ
 * @plugindesc Goście w sali tawerny: wieczorem przychodzą, siadają na krzesłach, jedzą, piją, chodzą po sali, można z każdym porozmawiać. Działa razem z „Przytulną salą”. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Watki
 * @orderAfter Przytulna
 * @orderAfter Hunting
 *
 * @help
 * Stan nie trafia do zapisu gry. Kwestie: js/teksty/goscie_sali.txt.
 * Klatki siedzenia: img/characters/Przytulna_Siedzi_<Klucz>.png (wiersze 0-1 pije, 2-3 je).
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    const PLUGIN = "Goscie_Sala";
    const TK = Watki.teksty("goscie_sali");
    const MAP = 1, ID0 = 400, ID1 = 422;
    const HALL = { x0: 37, y0: 27, x1: 83, y1: 44 };
    const CHAIR = 390, TABLE_TILES = [416, 424, 432, 439, 447], TABLE_TILES2 = [842, 850, 859, 867, 863, 871, 844, 852];   // (the chair; long and small tables on layer 3, round ones on layer 2)
    const DOOR = { x: 50, y: 52 }, BAR = [[46, 31], [48, 31], [50, 31], [52, 31], [54, 31], [56, 31]], STAGE = [[71, 33], [73, 33], [75, 33], [77, 33]];
    const CELL = 88, FEET = 76;                  // the sheets' cells; the row laid on the event's screenY (Przytulna's own format)
    // sitting down (user 2026-11-05: "idąc postacie wchodzą na stołek i wtedy przejście na siedzenie"): on foot onto the stool, there the
    // sheet's rows 4-5: standing, lowering, lower, then seated; getting up the other way round. DY: the walking figure's feet stand 4 px lower
    const SETTLE_STEP = 6, SETTLE_N = 3, SETTLE_FRAMES = SETTLE_STEP * SETTLE_N, SETTLE_DY = [4, 2, 1];
    const MAX_WALKING = 4;
    const SIT_MIN = 40, SIT_MAX = 150, STAND_MIN = 10, STAND_MAX = 30, REST_MIN = 5, REST_MAX = 13, EAT_FOR = 45;   // seconds of play
    const EVENING_FROM = 17, ARRIVE_SPREAD = 2.5, LEAVE_FROM = 23.5, LEAVE_SPREAD = 1.5;   // hours
    const SPEED = 3, LATE = 0.5;
    const BOWL_ROWS = ["....dddddddd....", "..ddwwwwwwwwdd..", ".dwwsSsssSSsswwd", "dwssSSsSssSssSwd", ".dwsssSSsSsssd..", "..dbbbbbbbbbbd..", "...dbbbbbbbbd...", "....dddddddd...."];
    const BOWL_PAL = { d: "#2c1c10", w: "#8a6038", b: "#6a4526", s: "#8c4a22", S: "#c07a38" };

    const rnd = (a, b) => a + Math.random() * (b - a);
    const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const P = () => T.api("Przytulna") || window.Przytulna;
    const on = () => { const p = P(); return !!(p && p.on && p.on()); };
    const here = () => !!(window.$gameMap && $gameMap.mapId() === MAP);
    const hourNow = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : T.time.hour());
    const talking = ev => ev._locked || ($gameMap._interpreter.isRunning() && $gameMap._interpreter.eventId() === ev.eventId());
    const textOf = g => (TK.goscie && TK.goscie["g" + g.id]) || {};

    // ------------------------------------------------------------------
    // The chairs of the hall
    // ------------------------------------------------------------------
    let SEATS = null;
    function chairs() {
        if (SEATS && SEATS.data === $dataMap.data) return SEATS;
        const W = $dataMap.width, H = $dataMap.height, d = $dataMap.data, list = [];
        const t = (z, x, y) => d[(z * H + y) * W + x];
        const table = (x, y) => TABLE_TILES.includes(t(3, x, y)) || TABLE_TILES2.includes(t(2, x, y));
        // (a figure standing there - Ozzy - closes the aisle as much as a wall would)
        const standing = (x, y) => $dataMap.events.some(e => e && !(e.id >= ID0 && e.id <= ID1) && e.x === x && e.y === y && e.pages.some(p => p.priorityType === 1 && (p.image.characterName || p.image.tileId)));
        const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && $gameMap.checkPassage(x, y, 0x0f) && !standing(x, y);
        for (let y = HALL.y0; y <= HALL.y1; y++) for (let x = HALL.x0; x <= HALL.x1; x++) {
            const side = table(x + 1, y) ? 6 : table(x - 1, y) ? 4 : 0;
            if (!side) continue;
            const isChair = t(3, x, y) === CHAIR;
            const isOurs = $dataMap.events.some(e => e && e.id >= ID0 && e.id <= ID1 && e.x === x && e.y === y);
            if (!isChair && !isOurs) continue;
            // the cell he steps onto it from: the side away from the table; a chair stands there (two back to back): slantwise from beside
            // that chair - he still comes sideways, facing the table (user 2026-11-05: "z boku też może wejść"); else above or below
            const bx = side === 6 ? x - 1 : x + 1, aisle = [[bx, y], [bx, y + 1], [bx, y - 1], [x, y + 1], [x, y - 1]].find(c => free(c[0], c[1]));
            if (!aisle) continue;
            const other = $dataMap.events.some(e => e && !(e.id >= ID0 && e.id <= ID1) && e.x === x && e.y === y && (e.name || e.pages.some(p => p.image.characterName)));
            if (other) continue;
            list.push({ x, y, side, ax: aisle[0], ay: aisle[1], by: null, table: [x + (side === 6 ? 1 : -1), y] });
        }
        SEATS = { data: d, list, at: new Map(list.map(s => [s.x * 1000 + s.y, s])) };
        return SEATS;
    }
    const seatAt = (x, y) => chairs().at.get(x * 1000 + y) || null;
    function freeSeat(prefer) {
        const list = chairs().list.filter(s => !s.by && !(($gamePlayer.x === s.ax && $gamePlayer.y === s.ay)));
        if (!list.length) return null;
        if (prefer) { const near = list.filter(s => Math.abs(s.x - prefer.x) + Math.abs(s.y - prefer.y) < 14); if (near.length) return near[Math.floor(Math.random() * near.length)]; }
        return list[Math.floor(Math.random() * list.length)];
    }

    // ------------------------------------------------------------------
    // The guests' state (memory only)
    // ------------------------------------------------------------------
    const S = { key: null, guests: [], walking: 0, now: 0 };
    function arrivalOf(g) { return EVENING_FROM + hash(g.id, 11) * ARRIVE_SPREAD; }
    function departureOf(g) { return LEAVE_FROM + hash(g.id, 12) * LEAVE_SPREAD; }
    function present(g, h) {
        const dep = departureOf(g), lateH = h < 12 ? h + 24 : h;   // (the night goes on past midnight)
        return lateH >= arrivalOf(g) && lateH < dep;
    }
    function setSprite(g) {   // the walking figure of his look (also what the talks' bust is taken from)
        const ev = g.ev, name = "$Npc_" + g.key;
        if (ev.characterName() !== name) ev.setImage(name, 0);
        ev._directionFix = false; ev._walkAnime = true; ev._stepAnime = false;
        ev._moveSpeed = SPEED;
    }
    function takeSeat(g, seat) { if (g.seat && g.seat !== seat) g.seat.by = null; g.seat = seat; if (seat) seat.by = g; }
    function sitNow(g, seat) {
        takeSeat(g, seat);
        const ev = g.ev;
        ev.setTransparent(false);
        setSprite(g);
        ev.locate(seat.x, seat.y);
        ev.setThrough(true);
        g.state = "sit"; g.sitUntil = S.now + rnd(SIT_MIN, SIT_MAX); g.act = g.hungry ? "eat" : "drink"; g.actUntil = g.hungry ? S.now + EAT_FOR : 0; g.nextAct = S.now + rnd(1, REST_MAX); g.t0 = -1;
    }
    function setOut(g) {
        takeSeat(g, null);
        g.state = "out"; g.t0 = -1; g.goal = null;
        g.ev.setTransparent(true); g.ev.setThrough(true);
        g.ev.locate(DOOR.x, DOOR.y);
    }
    function layOut() {
        const h = hourNow();
        S.key = $gameMap.event(ID0) || null; S.guests = []; S.walking = 0;
        SEATS = null;
        const seats = chairs();
        for (const s of seats.list) s.by = null;
        for (let id = ID0; id <= ID1; id++) {
            const ev = $gameMap.event(id), d = ev && ev.event();
            const m = d && /<Siedzi:(\w+)>/i.exec(d.note || "");
            if (!m) continue;
            const g = { id, ev, key: m[1], home: seatAt(d.x, d.y), seat: null, state: "out", hungry: hash(id, 13) < 0.6, stuck: 0, goal: null, t0: -1, act: "drink", out: 0 };
            S.guests.push(g);
            if (present(g, h) && g.home && !g.home.by) sitNow(g, g.home);
            else setOut(g);
        }
    }
    // the events' list: one script command (the map file stays as it is)
    T.onEventList(ev => (here() && ev.eventId() >= ID0 && ev.eventId() <= ID1 && on() ? [{ code: 355, indent: 0, parameters: ["GoscieSala.talk(this)"] }, { code: 0, indent: 0, parameters: [] }] : null), { owner: PLUGIN, name: "talk" });
    T.onEventStart(ev => {
        if (!here() || ev.eventId() < ID0 || ev.eventId() > ID1) return false;
        const g = S.guests.find(x => x.id === ev.eventId());
        return !on() || !g || g.state === "out";
    }, { owner: PLUGIN, priority: "hidden" });

    // ------------------------------------------------------------------
    // Walking
    // ------------------------------------------------------------------
    function walkTo(g, x, y, then) { g.goal = { x, y, then }; g.state = "walk"; g.stuck = 0; g.ev.setThrough(false); }
    function stepWalk(g) {
        const ev = g.ev;
        if (!g.goal || ev.isMoving()) return;
        if (ev.x === g.goal.x && ev.y === g.goal.y) { const f = g.goal.then; g.goal = null; ev.setThrough(true); f(); return; }
        const H = window.Hunting, RA = window.RoamingActor;
        const d = H && H.path8 ? H.path8(ev, g.goal.x, g.goal.y, { key: "sala" }).dir : ev.findDirectionTo(g.goal.x, g.goal.y);
        if (d > 0 && RA.canStep(ev, ev.x, ev.y, d)) { ev.setThrough(false); RA.step(ev, d); g.stuck = 0; return; }
        // someone stands in the way: wait a moment, then pass (nobody blocks the hero, nobody stands stuck)
        g.stuck++;
        if (g.stuck > 45) {
            ev.setThrough(true);
            const dir = ev.findDirectionTo(g.goal.x, g.goal.y);
            if (dir > 0) ev.moveStraight(dir);
            if (g.stuck > 240) { ev.locate(g.goal.x, g.goal.y); g.stuck = 0; }
        }
    }
    // one step on foot over what a walker does not cross (onto the stool, off it)
    function stepTo(g, x, y) {
        const ev = g.ev, h = x > ev.x ? 6 : x < ev.x ? 4 : 0, v = y > ev.y ? 2 : y < ev.y ? 8 : 0;
        ev.setThrough(true);
        if (h && v) { ev.setDirection(h); ev.moveDiagonally(h, v); }
        else { ev.setDirection(h || v); ev.moveStraight(h || v); }
    }
    // where he steps off the stool: his usual cell, unless the hero stands on it
    function offCell(seat) {
        const bx = seat.side === 6 ? seat.x - 1 : seat.x + 1;
        return [[seat.ax, seat.ay], [bx, seat.y], [bx, seat.y + 1], [bx, seat.y - 1], [seat.x, seat.y + 1], [seat.x, seat.y - 1]]
            .find(c => !($gamePlayer.x === c[0] && $gamePlayer.y === c[1]) && $gameMap.isValid(c[0], c[1]) && $gameMap.checkPassage(c[0], c[1], 0x0f)) || null;
    }
    function goSit(g, seat) {
        takeSeat(g, seat);
        walkTo(g, seat.ax, seat.ay, () => {
            if (!seat.by || seat.by !== g) { const s2 = freeSeat(seat); if (s2) goSit(g, s2); else leave(g); return; }
            stepTo(g, seat.x, seat.y);
            g.state = "mount";
        });
    }
    function leave(g) {
        takeSeat(g, null);
        walkTo(g, DOOR.x, DOOR.y, () => setOut(g));
    }
    // where to stretch his legs: the bar, the fire, the stage, or to someone sitting
    function outingSpot(g) {
        const r = Math.random(), free = c => $gameMap.checkPassage(c[0], c[1], 0x0f) && !$gameMap.eventsXyNt(c[0], c[1]).some(e => e.isNormalPriority()) && !S.guests.some(o => o !== g && o.goal && o.goal.x === c[0] && o.goal.y === c[1]);
        const pick = (list, face) => { const l = list.filter(free); return l.length ? { c: l[Math.floor(Math.random() * l.length)], face } : null; };
        if (r < 0.4) { const seated = S.guests.filter(o => o !== g && o.state === "sit" && o.seat && free([o.seat.ax, o.seat.ay])); if (seated.length) { const o = seated[Math.floor(Math.random() * seated.length)]; return { c: [o.seat.ax, o.seat.ay], faceTo: o }; } }
        if (r < 0.75) return pick(BAR, 8);
        if (r < 0.88) return pick(STAGE, 8);
        return pick(BAR, 8);
    }
    function rise(g) { g.t = 0; g.state = "rising"; }
    function afterRise(g) {
        const h = hourNow();
        if (!present(g, h)) { leave(g); return; }
        const spot = outingSpot(g);
        if (!spot) { const back = g.seat || freeSeat() || g.home; if (back) goSit(g, back); else leave(g); return; }
        const seatBack = g.seat;
        if (Math.random() < 0.3) takeSeat(g, null);   // (his chair is free for another: he will find one when he comes back)
        else g.seatBack = seatBack;
        walkTo(g, spot.c[0], spot.c[1], () => {
            g.state = "stand"; g.standUntil = S.now + rnd(STAND_MIN, STAND_MAX); g.ev.setThrough(false);
            if (spot.faceTo) g.ev.turnTowardCharacter(spot.faceTo.ev); else if (spot.face) g.ev.setDirection(spot.face);
        });
    }

    // ------------------------------------------------------------------
    // A frame of the hall's life
    // ------------------------------------------------------------------
    const onFeet = g => g.state !== "sit" && g.state !== "out";
    function tick() {
        S.now += 1 / 60;
        const h = hourNow(), running = $gameMap.isEventRunning();
        S.walking = S.guests.filter(onFeet).length;
        for (const g of S.guests) {
            if (talking(g.ev)) continue;
            switch (g.state) {
                case "out":
                    if (present(g, h) && !running) {
                        const seat = (g.home && !g.home.by ? g.home : freeSeat());
                        if (!seat) break;
                        // (the hour jumped - a sleep, a scene, a test: he has been here a while; only those coming in now walk, a few at a time)
                        if ((h < 12 ? h + 24 : h) - arrivalOf(g) > LATE) { sitNow(g, seat); break; }
                        if (S.walking >= MAX_WALKING) break;
                        S.walking++;
                        g.ev.setTransparent(false); setSprite(g); g.ev.locate(DOOR.x, DOOR.y); g.ev.setDirection(8);
                        goSit(g, seat);
                    }
                    break;
                case "walk": stepWalk(g); break;
                case "mount":                    // on his way onto the stool; there he turns the way he sits
                    if (g.ev.isMoving()) break;
                    g.ev.setDirection(g.seat.side); g.t = 0; g.state = "settle";
                    break;
                case "settle":
                    if (++g.t >= SETTLE_FRAMES) sitNow(g, g.seat);
                    break;
                case "rising":                   // up on the stool, then a step off it (the hero on that cell: another one beside it)
                    if (++g.t >= SETTLE_FRAMES) { const off = offCell(g.seat); if (off) { setSprite(g); stepTo(g, off[0], off[1]); g.state = "dismount"; } }
                    break;
                case "dismount":
                    if (g.ev.isMoving()) break;
                    g.ev.setThrough(false); afterRise(g);
                    break;
                case "stand":
                    if (S.now >= g.standUntil && !running) {
                        const back = g.seatBack && (!g.seatBack.by || g.seatBack.by === g) ? g.seatBack : g.seat || freeSeat(g.ev);
                        g.seatBack = null;
                        if (back && present(g, h)) goSit(g, back); else leave(g);
                    }
                    break;
                case "sit":
                    if (g.t0 < 0 && S.now >= g.nextAct) { if (g.act === "eat" && S.now >= g.actUntil) { g.act = "drink"; g.hungry = false; } g.t0 = S.now; }
                    if (g.t0 >= 0 && (S.now - g.t0) * 8 >= 8) { g.t0 = -1; g.nextAct = S.now + rnd(REST_MIN, REST_MAX); }
                    if (!running && g.t0 < 0 && (S.now >= g.sitUntil || !present(g, h))) {
                        if (!present(g, h)) { rise(g); break; }
                        if (S.walking < MAX_WALKING) { rise(g); S.walking++; } else g.sitUntil = S.now + rnd(5, 20);
                    }
                    break;
            }
        }
    }

    // ------------------------------------------------------------------
    // The pictures: the seated figure (a sprite of the tilemap, sorted with the characters) and the bowl on the table
    // ------------------------------------------------------------------
    let bowlBm = null;
    function bowlBitmap() {
        if (bowlBm) return bowlBm;
        const w = BOWL_ROWS[0].length, h = BOWL_ROWS.length, b = new Bitmap(w, h), c = b.context;
        BOWL_ROWS.forEach((r, y) => { for (let x = 0; x < w; x++) if (r[x] !== ".") { c.fillStyle = BOWL_PAL[r[x]]; c.fillRect(x, y, 1, 1); } });
        if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
        b.smooth = false;
        return (bowlBm = b);
    }
    function charSprite(set, g) {   // (kept on the guest's own memory-only record: the event goes into the save, a sprite must not)
        const list = set._characterSprites || [];
        return g.cs && list.includes(g.cs) ? g.cs : (g.cs = list.find(s => s._character === g.ev) || null);
    }
    function hideFigure(cs, hide) {
        if (!cs) return;
        if (hide) { cs._przytHide = true; cs._wyKeep = true; cs.opacity = 0; }
        else if (cs._przytHide) { cs._przytHide = false; cs._wyKeep = false; cs.opacity = 255; }
    }
    function drawGuest(set, g) {
        const tm = set._tilemap, ev = g.ev, cs = charSprite(set, g);
        const pics = set._salaPics || (set._salaPics = new Map());
        let p = pics.get(g.id);
        const settling = g.state === "settle" || g.state === "rising";
        const seated = (g.state === "sit" || settling) && g.seat;
        if (!seated) {
            if (p) { p.sp.visible = false; p.bowl.visible = false; }
            hideFigure(cs, false);
            return;
        }
        if (!p) {
            const bmp = ImageManager.loadBitmap("img/characters/", "Przytulna_Siedzi_" + g.key);
            const sp = new Sprite(bmp); sp.anchor.set(0.5, FEET / CELL); sp.update = function() {};
            const bowl = new Sprite(bowlBitmap()); bowl.anchor.set(0.5, 1); bowl.z = 1.6; bowl.update = function() {};
            tm.addChild(sp); tm.addChild(bowl);
            p = { sp, bowl, bmp };
            pics.set(g.id, p);
        }
        if (!p.bmp.isReady()) { p.sp.visible = false; hideFigure(cs, false); return; }
        const seat = g.seat, side = seat ? seat.side : (ev.direction() === 4 ? 4 : 6), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const eats = g.act === "eat" && p.bmp.height >= CELL * 4;
        let f = 0, row = (eats ? 2 : 0) + (side === 6 ? 0 : 1), dy = 0;
        if (settling && p.bmp.height >= CELL * 6) {
            const k = Math.min(SETTLE_N - 1, Math.floor(g.t / SETTLE_STEP));
            f = g.state === "settle" ? k : SETTLE_N - 1 - k;
            row = 4 + (side === 6 ? 0 : 1); dy = SETTLE_DY[f];
        } else if (g.t0 >= 0 && g.state === "sit") { const cols = Math.floor(p.bmp.width / CELL); f = 1 + Math.floor((S.now - g.t0) * 8); if (f >= cols) f = 0; }
        p.sp.setFrame(f * CELL, row * CELL, CELL, CELL);
        // the place: on the chair
        const sx = c => $gameMap.adjustX(c) * tw + tw / 2, sy = c => $gameMap.adjustY(c) * th + th - 6;
        const x = seat ? sx(seat.x) : ev.screenX(), y = (seat ? sy(seat.y) : ev.screenY()) + dy;
        p.sp.x = Math.round(x); p.sp.y = Math.round(y); p.sp.z = 3; p.sp.visible = true;
        hideFigure(cs, true);
        // the bowl of a guest who is eating: on the table in front of him
        const showBowl = g.state === "sit" && (g.act === "eat") && seat && seat.table;
        p.bowl.visible = !!showBowl;
        if (showBowl) { p.bowl.x = Math.round(sx(seat.table[0]) + (side === 6 ? -8 : 8)); p.bowl.y = Math.round(sy(seat.table[1]) - 10); }
    }
    const _spritesetUpdate = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _spritesetUpdate.call(this);
        if (!here() || !on()) {
            if (this._salaPics) for (const p of this._salaPics.values()) { p.sp.visible = false; p.bowl.visible = false; }
            if (here() && S.key) { for (const g of S.guests) { hideFigure(charSprite(this, g), false); g.ev.setTransparent(true); } S.key = null; }
            return;
        }
        if (S.key !== ($gameMap.event(ID0) || null)) layOut();
        if (this._salaFrame === Graphics.frameCount) return;   // (a frame drawn again does not move them on)
        this._salaFrame = Graphics.frameCount;
        tick();
        for (const g of S.guests) drawGuest(this, g);
    };

    // ------------------------------------------------------------------
    // The talk
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
    function say(g, text) {
        const lines = wrap(text), out = [];
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push({ code: 101, indent: 0, parameters: ["", 0, 0, 2, textOf(g).imie || ""] });
            lines.slice(i, i + PAGE).forEach((l, j) => out.push({ code: 401, indent: 0, parameters: [(j === 0 ? "\\SPK[" + g.id + "]" : "") + l] }));
        }
        return out;
    }
    const nextOf = (g, key, list) => { g.said = g.said || {}; const n = g.said[key] || 0; g.said[key] = n + 1; return list[n % list.length]; };
    const END = () => ({ code: 0, indent: 0, parameters: [] });
    function menuCommands(g, ctx) {
        const tx = textOf(g), q = TK.pytania || {}, rows = [];
        // (the line is picked when it is asked for, so the ones not asked are not used up; after it the menu again)
        const row = (label, key) => { const list = tx[key]; if (label && list && list.length) rows.push({ label, cmds: [{ code: 355, indent: 0, parameters: ["GoscieSala.answer(this, " + g.id + ", " + JSON.stringify(key) + ")"] }] }); };
        row(q.kim, "kim"); row(q.slychac, "slychac"); row(q.rada, "rada");
        const all = T.talk.rows("gosc_sali", ctx || {}, rows), out = [];
        T.talk.menu(out, all, { label: q.bywaj || "Bywaj.", cmds: tx.bye ? say(g, tx.bye) : [] });
        return out;
    }
    const api = {
        on, here,
        talk(interp) {
            const ev = $gameMap.event(interp.eventId()), g = S.guests.find(x => x.id === ev.eventId());
            if (!g) return false;
            T.talk.run(interp, "gosc_sali", { ev, owner: PLUGIN, base: ctx => {
                const tx = textOf(g);
                return (tx.witaj && tx.witaj.length ? say(g, nextOf(g, "witaj", tx.witaj)) : []).concat(menuCommands(g, ctx));
            } });
            return true;
        },
        answer(interp, id, key) {
            const g = S.guests.find(x => x.id === id), list = g && textOf(g)[key];
            if (list && list.length) interp.setupChild(say(g, nextOf(g, key, list)).concat(menuCommands(g, {})).concat([END()]), interp.eventId());
            return true;
        },
        guests: () => S.guests.map(g => ({ id: g.id, key: g.key, state: g.state, act: g.act, x: g.ev.x, y: g.ev.y, seat: g.seat ? [g.seat.x, g.seat.y] : null, goal: g.goal ? [g.goal.x, g.goal.y] : null, imie: textOf(g).imie || "" })),
        seats: () => chairs().list.map(s => ({ x: s.x, y: s.y, side: s.side, ax: s.ax, ay: s.ay, by: s.by ? s.by.id : 0 })),
        // tests: make him do it now
        force(id, what) {
            const g = S.guests.find(x => x.id === id);
            if (!g) return false;
            if (what === "rise" && g.state === "sit") rise(g);
            else if (what === "eat" && g.state === "sit") { g.act = "eat"; g.actUntil = S.now + EAT_FOR; g.t0 = S.now; }
            else if (what === "drink" && g.state === "sit") { g.act = "drink"; g.t0 = S.now; }
            else if (what === "back" && g.state === "stand") g.standUntil = S.now;
            else return false;
            return true;
        },
        layOut,
        // tests: one frame of the hall's life and pictures (its cost)
        frame() { const set = SceneManager._scene && SceneManager._scene._spriteset; tick(); if (set) for (const g of S.guests) drawGuest(set, g); return true; },
        stats: () => ({ guests: S.guests.length, sit: S.guests.filter(g => g.state === "sit").length, out: S.guests.filter(g => g.state === "out").length, walking: S.guests.filter(onFeet).length, seats: SEATS ? SEATS.list.length : 0 })
    };
    window.GoscieSala = T.register(PLUGIN, api);
})();
