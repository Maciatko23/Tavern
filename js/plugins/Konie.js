//=============================================================================
// Konie.js
//=============================================================================
// The horses of the stable yard in Kruczogród (Map008, the fenced packed-earth yard east of the inn, x 62-78, y 9-25 inside; the log stable in its north-east corner, door event 209) and its
// water trough (player 2026-11-08: "kilka koni chodzących w środku ... coś czasem jedzą z ziemi, i jakiś wodopój"). Three horses (bay,
// grey, black) and the trough are injected events (Tawerna.inject, ids 3260-3269); the map file is not touched.
//  - a horse is a Game_Event with its own small mind (no move route): it stands, walks a few tiles, grazes (the head down at the ground,
//    the $Kon_<Name>_Pasie sheet), and now and then walks to the trough and drinks; it keeps inside the yard's rectangle, stays off the
//    cells in front of the stable door (the hero's way) and never leaves by the gate; the hero coming close makes it step aside;
//  - at night (21-6, each horse a little later / earlier than the others) the horses walk to the stable door (event 209), go in and
//    are hidden; in the morning they come out of it - nobody vanishes in sight;
//  - talking to a horse: a short line in a bubble and a snort (audio/se/Horse).
// Nothing is saved: after a load the horses are simply there again (the time of day decides where). Nothing runs off Map008.

/*:
 * @target MZ
 * @plugindesc Konie na wybiegu stajni w Kruczogrodzie (Map008) i wodopój: chodzą, skubią trawę, piją, na noc idą do stajni. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Stajnia_Zmiana
 *
 * @help
 * Trzy konie (gniady, siwy, kary) na wybiegu przy stajni zajazdu i drewniany wodopój. Konie krążą po ogrodzonym
 * placu (nie wychodzą furtką, nie stają na dojściu do drzwi stajni), skubią ziemię, piją z wodopoju, ustępują
 * bohaterowi. Od 21 do 6 chodzą do stajni (drzwi: zdarzenie 209) i wracają rano. Rozmowa z koniem: parsknięcie.
 *
 * API: Konie.horses(), Konie.YARD, Konie.talk(ev), Konie.setAuto(bool), Konie.night()
 * Grafiki: img/characters/$Kon_Gniady / $Kon_Siwy / $Kon_Kary (+ _Pasie) i !$Wodopoj.
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Konie.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Konie";
    if (T.api(PLUGIN)) return;

    const MAP = 8;
    const IDS = { horses: [3260, 3261, 3262, 3276, 3277], trough: 3263 };
    const DOOR_ID = 209;                               // "Drzwi: Stajnia"
    const YARD = { x0: 84, x1: 98, y0: 11, y1: 22 };   // the cells a horse may stand on (the fence is 82 / 100 / 24; stable A above row 11, the hay wagon on row 23)
    // two identical vertical troughs against the west fence (x 83), a free cell row between them (y 18): each is a picture event (below the characters) on its
    // bottom cell, three invisible blockers on its cells, and two ripple events on the rows whose water a muzzle reaches (the top two cells)
    const TROUGHS = [
        { x: 83, y: 17, len: 3, pic: 3263, blockers: [3264, 3265, 3266], ripples: [3267, 3268] },
        { x: 83, y: 21, len: 3, pic: 3270, blockers: [3271, 3272, 3273], ripples: [3274, 3275] }
    ];
    const TROUGH = TROUGHS[0];
    // a drinking horse stands on the cell east of a trough's water rows and faces west: only its HEAD is over the water
    const SPOTS = [];
    for (const tr of TROUGHS) tr.ripples.forEach((id, i) => SPOTS.push({ x: tr.x + 1, y: tr.y - tr.len + 1 + i, face: 4, rip: id, tr }));
    const spotAt = (x, y) => SPOTS.find(s => s.x === x && s.y === y) || null;
    const DOOR_FALLBACK = { x: 92, y: 10 };            // (the real one is read from event 209 at run time)
    // five horses, each its own coat: bay, grey, black, and two recoloured from the bay / the grey (tools/konie/build_konie.py): a chestnut with a flaxen mane, a skewbald
    const HORSES = [
        { name: "Koń gniady", sheet: "$Kon_Gniady", at: [88, 16], out: 21.0, back: 6.0, gn: 9 },
        { name: "Koń siwy", sheet: "$Kon_Siwy", at: [94, 18], out: 21.2, back: 6.2, gn: 9 },
        { name: "Koń kary", sheet: "$Kon_Kary", at: [92, 21], out: 21.4, back: 6.4, gn: 9 },
        { name: "Koń kasztanowaty", sheet: "$Kon_Kasztan", at: [96, 14], out: 21.6, back: 6.6, gn: 9 },
        { name: "Koń srokaty", sheet: "$Kon_Srokaty", at: [89, 20], out: 21.8, back: 6.8, gn: 9 }
    ];
    // the sheets are wide: N frames x 4 rows (down, left, right, up); the sprite picks the frame by itself (see the hooks below)
    const WALK_N = 8;                                  // walk. Grazing / drinking: HORSES[i].gn frames, the head goes down, the last 3 are the nibble
    const NIBBLE = [0, -1, 0, 0, -1, -2, -1, 0];       // the head's bobs while it nibbles / sips (offsets from the last frame)
    const SIP_FROM = 3;                                // from this many frames before the last one the muzzle is on the ground / in the water
    const STAND = 0;                                   // the walk frame a standing horse shows
    const STRIDE = 1.5;                                // tiles a walk cycle (8 frames) carries a horse: the feet do not slide
    const SPEED_WALK = 2.6, SPEED_GOTO = 2.8;
    const STEP_GRAZE = 7, STEP_DRINK = 8;              // game frames a frame of the grazing / drinking clip
    const HALF = 1.45;                                 // tiles: a side-on horse's reach from its middle (the hero keeps this far from it)
    const TALKS = ["Koń parska i trąca cię chrapami.", "Koń strzyże uszami i patrzy na ciebie spokojnie.", "Koń szturcha cię łbem, jakby szukał smakołyka.",
        "Koń macha ogonem i cicho rży.", "Koń przestępuje z nogi na nogę i obwąchuje twoją dłoń.", "Ciepły koński oddech owiewa ci rękę."];
    const TROUGH_TALKS = ["Wodopój z bali. Woda stoi czysta i chłodna.", "Długie koryto pełne wody; konie pija tu o każdej porze."];
    const gnOf = name => { const h = HORSES.find(q => (name || "").indexOf(q.sheet) === 0); return h ? h.gn : 9; };
    const colsOf = name => (/_(Pasie|Pije)$/.test(name || "") ? gnOf(name) : WALK_N);

    let auto = true;                                   // tests: false = the horses stand still
    let always = null;                                 // tests: true = always out, false = always in the stable, null = by the clock
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const hour = () => T.time.hour();
    const isNight = h => (always !== null ? !always : h >= 21 || h < 6);

    // ------------------------------------------------------------------ the injected events (Map008 only)
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const cmd = (code, parameters) => ({ code, indent: 0, parameters });
    function eventData(id, name, x, y, sheet, script, anim) {
        const page = { conditions: Object.assign({}, BLANK), directionFix: !!anim,
            image: { tileId: 0, characterName: sheet, direction: 2, pattern: 0, characterIndex: 0 },
            list: [cmd(355, [script]), cmd(0, [])], moveFrequency: 3, moveRoute: { list: [cmd(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: anim ? 1 : 3, moveType: 0, priorityType: 1, stepAnime: !!anim, through: false, trigger: 0, walkAnime: false };
        return { id, name, note: "<Konie>", pages: [page], x, y };
    }
    function build(data, mapId) {
        if (mapId !== MAP) return [];
        const out = HORSES.map((h, i) => eventData(IDS.horses[i], h.name, h.at[0], h.at[1], h.sheet, "Konie.talk(this);", false));
        for (const tr of TROUGHS) {
            out.push(eventData(tr.pic, "Wodopój", tr.x, tr.y, "!$Wodopoj", "Konie.trough(this);", true));
            out[out.length - 1].pages[0].priorityType = 0;   // (the horses are drawn over it: the muzzle is over the water)
            tr.blockers.forEach((id, i) => out.push(eventData(id, "Wodopój (bok)", tr.x, tr.y - i, "", "Konie.trough(this);", false)));
        }
 SPOTS.forEach(sp => { const id = sp.rip, e = eventData(id, "Kręgi na wodzie", sp.tr.x, sp.y, "!$Wodopoj_Kregi", "", true); e.pages[0].priorityType = 0; e.pages[0].trigger = 0; e.pages[0].list = [cmd(0, [])]; e.note = "<Konie><Kregi>"; out.push(e); });
        return out;
    }
    T.inject(MAP, { ids: [3260, 3279], owner: PLUGIN, build });

    // ------------------------------------------------------------------ where a horse may stand (its body, not only its cell)
    function door() {
        const e = $gameMap.event(DOOR_ID);
        return e ? { x: e.x, y: e.y } : DOOR_FALLBACK;
    }
    const inYard = (x, y) => x >= YARD.x0 && x <= YARD.x1 && y >= YARD.y0 && y <= YARD.y1;
    // in front of the stable door: the hero's way in and out (two rows below the door, a cell to each side)
    function onHerWay(x, y) {
        const d = door();
        return Math.abs(x - d.x) <= 1 && y > d.y && y <= d.y + 2;
    }
    const isHoriz = f => f === 4 || f === 6;
    const horseEvents = () => IDS.horses.map(id => $gameMap.event(id));
    // a cell the body would lie over: the tile must be open, no thing (normal-priority event: a lamp, the trough's blockers, a cart, the
    // static horse) on it
    // (2026-11-12, wydajność) the things round the yard, laid on a grid every YARD_GRID_FRAMES frames: the engine's findDirectionTo
    // (goTo) asks canPass of some 600 cells in one search, each asked bodyClear's cells and the engine's own collision - and both
    // walked every event of the town for every cell (a horse heading for the stable at night stalled the game 60-230 ms). Bit 1: an
    // event that is not through (Game_Event.isCollidedWithEvents), bit 2: one of normal priority, not through, not hidden (cellOpen).
    // The horses are not on it - they move: asked as they are. Off the grid's box (yard + YARD_GRID_PAD): as before.
    const YARD_GRID_FRAMES = 15, YARD_GRID_PAD = 13;
    let yardGridMemo = null;
    function yardGrid() {
        const f = Graphics.frameCount, m = $gameMap.mapId(), n = $gameMap._events.length, G = yardGridMemo;
        if (G && G.map === m && G.n === n && f >= G.f && f - G.f < YARD_GRID_FRAMES) return G;
        const x0 = Math.max(0, YARD.x0 - YARD_GRID_PAD), x1 = Math.min($gameMap.width() - 1, YARD.x1 + YARD_GRID_PAD);
        const y0 = Math.max(0, YARD.y0 - YARD_GRID_PAD), y1 = Math.min($gameMap.height() - 1, YARD.y1 + YARD_GRID_PAD), w = x1 - x0 + 1;
        const bits = new Uint8Array(w * (y1 - y0 + 1));
        for (const e of $gameMap.events()) {
            if (!e || e.isThrough() || IDS.horses.includes(e.eventId())) continue;
            if (e._x < x0 - 12 || e._x > x1 + 12 || e._y < y0 - 12 || e._y > y1 + 12) continue;
            const b = 1 | (e.isNormalPriority() && !e._transparent ? 2 : 0);
            for (let r = 0; r <= 12; r++) {   // (ring by ring round it, as Tawerna.eventCells: a footprint is one rectangle with the event in it)
                let hit = false;
                for (let y = e._y - r; y <= e._y + r; y++) for (let x = e._x - r; x <= e._x + r; x++) {
                    if (Math.abs(x - e._x) !== r && Math.abs(y - e._y) !== r) continue;
                    if (!e.pos(x, y)) continue;
                    hit = true;
                    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) bits[(y - y0) * w + (x - x0)] |= b;
                }
                if (!hit && r > 0) break;
            }
        }
        return (yardGridMemo = { f, map: m, n, x0, x1, y0, y1, w, bits });
    }
    const onGrid = (G, x, y) => x >= G.x0 && x <= G.x1 && y >= G.y0 && y <= G.y1;
    function cellOpen(ev, x, y) {
        if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
        const G = yardGrid();
        if (onGrid(G, x, y)) {
            if (G.bits[(y - G.y0) * G.w + (x - G.x0)] & 2) return false;
            const hs = horseEvents();
            for (let i = 0; i < hs.length; i++) { const h = hs[i]; if (h && h !== ev && h.isNormalPriority() && !h._transparent && h.posNt(x, y)) return false; }
            return true;
        }
        const list = $gameMap.eventsXyNt(x, y);
        for (let i = 0; i < list.length; i++) { const e = list[i]; if (e !== ev && e.isNormalPriority() && !e.isThrough() && !e._transparent) return false; }
        return true;
    }
    function allowed(x, y) { return inYard(x, y) && !onHerWay(x, y); }
    // the body of a horse standing on (x, y) and facing f: side-on it lies over its cell and half of each neighbour on its row (a head
    // reaching for the trough's water is the one exception: the head side's cell may be the trough), end-on over its own cell
    function bodyClear(ev, x, y, f) {
        const k = ev._k, trip = k && k.doorTrip, side = isHoriz(f);
        const inWay = onHerWay(ev.x, ev.y);               // (a horse caught on the hero's way may step anywhere in the yard: it is on its way out of it)
        if (!trip && !allowed(x, y) && !(inWay && inYard(x, y))) return false;
        if (side) {
            const head = f === 4 ? x - 1 : x + 1, tail = f === 4 ? x + 1 : x - 1;
            const drinking = f === 4 && !!spotAt(x, y);
            if (!cellOpen(ev, x, y) || !cellOpen(ev, tail, y) || (!drinking && !cellOpen(ev, head, y))) return false;
            if (!trip && !inWay && (onHerWay(head, y) || onHerWay(tail, y))) return false;
        } else if (!cellOpen(ev, x, y)) return false;
        const others = horseEvents();
        for (let i = 0; i < others.length; i++) {
            const h = others[i];
            if (!h || h === ev || h._transparent || h._y !== y) continue;
            if (Math.abs(h._x - x) <= (side || isHoriz(h.direction()) ? 1 : 0)) return false;
        }
        const px = $gamePlayer._realX, py = $gamePlayer._realY;
        if (Math.abs(py - y) < 0.95 && Math.abs(px - x) < (side ? HALF : 0.95)) return false;
        return true;
    }

    // ------------------------------------------------------------------ the horse's mind
    function isHorse(ev) {
        if (ev._konie === undefined) ev._konie = /<Konie>/.test((ev.event() && ev.event().note) || "") && IDS.horses.includes(ev.eventId()) ? 1 : 0;
        return ev._konie === 1;
    }
    // which sheet: "" walking, "_Pasie" head to the ground, "_Pije" at the trough
    function setSheet(ev, kind) {
        const k = ev._k, name = HORSES[k.i].sheet + kind;
        if (ev._characterName !== name) ev.setImage(name, 0);
        k.sheet = kind;
    }
    function hideAt(ev, x, y) {
        ev.locate(x, y);
        ev.setTransparent(true);
        ev.setThrough(true);
        ev.setDirectionFix(false);
        ev._k.backing = false; ev._k.seq = null; rippleOff(ev._k);
        ev._k.mode = "inside";
    }
    // a free spot of the yard to start on, with a side it can face
    function freeCell(ev) {
        for (let n = 0; n < 60; n++) {
            const x = rnd(YARD.x0, YARD.x1), y = rnd(YARD.y0, YARD.y1);
            if (Math.hypot(x - $gamePlayer._realX, y - $gamePlayer._realY) < 3) continue;
            for (const d of [4, 6]) if (bodyClear(ev, x, y, d)) return { x, y, d };
        }
        return null;
    }
    function init(ev) {
        for (const sp of SPOTS) { const q = $gameMap.event(sp.rip); if (q) q.setTransparent(true); }
        const k = ev._k = { i: IDS.horses.indexOf(ev.eventId()), mode: "wait", t: rnd(30, 200), fr: STAND, sheet: "", acc: 0, lx: 0, ly: 0, seq: null, si: 0, sf: 0, step: 8, done: false,
            heading: 2, steps: 0, still: true, goal: null, stuck: 0, doorTrip: false, thirst: rnd(0, 2), tick: 0, rip: null };
        ev.setMoveSpeed(SPEED_WALK);
        ev.setWalkAnime(false);
        ev.setStepAnime(false);
        ev.setDirectionFix(false);
        k.backing = false;
        if (isNight(hour())) { const d = door(); hideAt(ev, d.x, d.y); return; }
        const c = freeCell(ev);
        if (c) { ev.locate(c.x, c.y); ev.setDirection(c.d); }
        k.lx = ev._realX; k.ly = ev._realY;
    }
    function goTo(ev, gx, gy) {                       // one step towards a cell; false when there is no way just now
        const k = ev._k;
        const d = ev.findDirectionTo(gx, gy);
        if (d > 0 && ev.canPass(ev.x, ev.y, d)) { ev.moveStraight(d); k.stuck = 0; return true; }
        k.stuck++;
        return false;
    }
    function rippleOff(k) { if (k.rip) { k.rip.setTransparent(true); k.rip = null; } }
    function wait(ev, lo, hi) {
        const k = ev._k; rippleOff(k); k.mode = "wait"; k.t = rnd(lo, hi); k.goal = null; k.doorTrip = false; k.stuck = 0; k.seq = null; k.done = false;
        if (k.sheet) setSheet(ev, "");
        k.backing = false;
        if (ev.isDirectionFixed()) ev.setDirectionFix(false);
        k.fr = STAND;
    }
    // the trough's side cells: [x, y, direction to face]
    // a drink spot is taken when anything stands on it, or another horse stands on it / is on its way to it (the spot is reserved by its goal)
    function spotTaken(ev, x, y) {
        if ($gameMap.eventsXyNt(x, y).some(e => e !== ev && !e.isThrough() && !e._transparent)) return true;
        for (const h of horseEvents()) if (h && h !== ev && !h._transparent && h._k && h._k.goal && h._k.goal.x === x && h._k.goal.y === y) return true;
        return false;
    }
    // a clip: head down (0-5), the nibble / sips `loops` times, head up again; one frame per `step` game frames
    function startClip(ev, kind, loops, step) {
        const k = ev._k, s = [];
        const gn = HORSES[k.i].gn;
        for (let f = 0; f < gn; f++) s.push(f);
        for (let n = 0; n < loops; n++) for (let i = 0; i < NIBBLE.length; i++) s.push(gn - 1 + NIBBLE[i]);
        for (let f = gn - 2; f >= 0; f--) s.push(f);
        if (!isHoriz(ev.direction())) ev.setDirection(bodyClear(ev, ev.x, ev.y, 6) || !bodyClear(ev, ev.x, ev.y, 4) ? 6 : 4);   // (grazing / drinking only side-on)
        k.seq = s; k.si = 0; k.sf = 0; k.step = step; k.done = false; k.fr = 0;
        setSheet(ev, kind);
    }
    function chooseNext(ev) {
        const k = ev._k, r = Math.random();
        if (r < 0.14 + k.thirst * 0.07) {                // the trough
            // the NEAREST trough with a free spot (a taken one: another horse on it or on its way to it); none free: something else now, later again
            let best = null, bd = 1e9;
            for (const s of SPOTS) { const d = Math.abs(s.x - ev.x) + Math.abs(s.y - ev.y); if (d < bd && !spotTaken(ev, s.x, s.y) && bodyClear(ev, s.x, s.y, s.face)) { best = s; bd = d; } }
            if (best) { k.mode = "goto"; k.goal = { x: best.x, y: best.y, face: best.face, then: "drink" }; k.stuck = 0; k.thirst = 0; ev.setMoveSpeed(SPEED_GOTO); return; }
        }
        if (r < 0.50) {                                  // grazing: side-on, on a spot its body fits
            const sides = [4, 6].filter(d => bodyClear(ev, ev.x, ev.y, d));
            if (sides.length) { ev.setDirection(sides[rnd(0, sides.length - 1)]); k.mode = "graze"; k.thirst++; startClip(ev, "_Pasie", rnd(3, 8), STEP_GRAZE); return; }
        }
        if (r < 0.62) {                                  // only looks around
            const dirs = [2, 4, 6, 8].filter(d => bodyClear(ev, ev.x, ev.y, d));
            if (dirs.length) ev.setDirection(dirs[rnd(0, dirs.length - 1)]);
            k.t = rnd(60, 160); return;
        }
        const dirs = [2, 4, 6, 8].filter(d => ev.canPass(ev.x, ev.y, d));
        if (!dirs.length) { k.t = rnd(60, 120); return; }
        k.heading = dirs.includes(k.heading) && Math.random() < 0.5 ? k.heading : dirs[rnd(0, dirs.length - 1)];
        k.steps = rnd(2, 6);
        k.mode = "walk";
        ev.setMoveSpeed(SPEED_WALK);
    }
    function awayFrom(ev) {
        const RA = window.RoamingActor;
        if (!RA) return 0;
        return RA.fleeDirection(ev, ev._realX - $gamePlayer._realX, ev._realY - $gamePlayer._realY, { startAtDistance: true, margin: 0.05 });
    }
    // the hero is near: a side-on horse is long, so the distance is read along its body
    function heroNear(ev) {
        const dx = Math.abs(ev._realX - $gamePlayer._realX), dy = Math.abs(ev._realY - $gamePlayer._realY);
        return isHoriz(ev.direction()) ? dx < 1.9 && dy < 1.1 : dx < 1.2 && dy < 1.4;
    }

    // The frame. Whenever the event's position changes (any move: a wander, to / from the trough, the step back after drinking, the way through the
    // stable door, a nudge) ONLY the walk plays - a clip in progress is dropped on the spot - and its frame is a function of the distance walked
    // (backwards when it moves against its facing), so the feet keep the ground. Standing, grazing and drinking never move the event.
    function animate(ev, k) {
        const dx = ev._realX - k.lx, dy = ev._realY - k.ly, dist = Math.abs(dx) + Math.abs(dy);
        k.still = dist === 0;                           // (a clip starts only on a frame the position did not change)
        if (dist > 0 && dist < 1.2) {
            if (k.mode === "graze" || k.mode === "drink") wait(ev, 60, 160);
            else if (k.seq || k.sheet) { k.seq = null; rippleOff(k); setSheet(ev, ""); }
            const md = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8);
            if (!k.backing && ev.direction() !== md) ev.setDirection(md);                 // the row shown is always the way it goes
            const d = ev.direction(), dot = dx * (d === 6 ? 1 : d === 4 ? -1 : 0) + dy * (d === 2 ? 1 : d === 8 ? -1 : 0);
            k.acc += dot < 0 ? -dist : dist;
            const n = Math.floor(k.acc * (WALK_N / STRIDE)) % WALK_N;
            k.fr = n < 0 ? n + WALK_N : n;
        } else if (k.seq) {
            if (++k.sf >= k.step) { k.sf = 0; k.si++; }
            if (k.si >= k.seq.length) { k.seq = null; k.done = true; }
            else {
                k.fr = k.seq[k.si];
                if (k.sheet === "_Pije") {               // rings on the water while the muzzle is in it
                    const sp = spotAt(ev.x, ev.y), rip = sp && k.fr >= HORSES[k.i].gn - SIP_FROM ? $gameMap.event(sp.rip) : null;
                    if (rip !== k.rip) { rippleOff(k); if (rip) { rip.setTransparent(false); k.rip = rip; } }
                }
            }
        } else if (!k.sheet && !ev.isMoving() && k.mode === "wait") k.fr = STAND;     // (between two steps of a walk the last frame stays)
        k.lx = ev._realX; k.ly = ev._realY;
    }

    function think(ev) {
        const k = ev._k || (init(ev), ev._k);
        animate(ev, k);
        if (!auto || ev._locked || ev.isMoving() || !k.still || ev._transparent && k.mode !== "inside") return;   // (a new order only on a frame the position stood still: the last bit of a step is never drawn with the next one's row)
        // the clock: night sends a horse to the stable, morning brings it out (each a little earlier / later than the others)
        if ((++k.tick & 15) === 0) {
            const h = hour(), me = HORSES[k.i];
            if (isNight(h) && k.mode !== "inside" && k.mode !== "tostable" && k.mode !== "backoff" && (always !== null || h >= me.out || h < 6) && k.mode !== "out") { wait(ev, 1, 1); k.mode = "tostable"; k.doorTrip = true; k.stuck = 0; ev.setMoveSpeed(SPEED_GOTO); }
            else if (!isNight(h) && k.mode === "inside" && (always !== null || h >= me.back)) {
                const d = door();
                ev.locate(d.x, d.y + 0);
                ev.setTransparent(false);
                ev.setThrough(false);
                ev.setDirection(2);
                k.mode = "out"; k.doorTrip = true; k.stuck = 0; ev.setMoveSpeed(SPEED_GOTO);
            }
        }
        switch (k.mode) {
            case "inside": return;
            case "tostable": {
                const d = door();
                if (ev.x === d.x && ev.y === d.y) { hideAt(ev, d.x, d.y); return; }
                if (ev.x === d.x && ev.y === d.y + 1) { ev.setThrough(true); ev.moveStraight(8); return; }   // the last step, over the doorstep
                if (!goTo(ev, d.x, d.y + 1) && k.stuck > 200) { ev.setThrough(true); const dd = ev.findDirectionTo(d.x, d.y + 1); if (dd > 0) ev.moveStraight(dd); ev.setThrough(false); k.stuck = 0; }
                return;
            }
            case "out": {
                const d = door();
                if (ev.x === d.x && ev.y === d.y) { ev.setThrough(true); ev.moveStraight(2); return; }   // over the doorstep, out of the wall
                ev.setThrough(false);
                if (ev.y >= d.y + 3 || ev.y > d.y + 1 && !onHerWay(ev.x, ev.y)) { wait(ev, 60, 200); ev.setMoveSpeed(SPEED_WALK); return; }
                if (!goTo(ev, d.x, d.y + 3) && k.stuck > 100) { wait(ev, 20, 60); ev.setMoveSpeed(SPEED_WALK); }
                return;
            }
            case "goto": {
                const g = k.goal;
                if (ev.x === g.x && ev.y === g.y && k.still) {
                    ev.setDirection(g.face); k.mode = g.then; ev.setMoveSpeed(SPEED_WALK);
                    startClip(ev, g.then === "drink" ? "_Pije" : "_Pasie", g.then === "drink" ? rnd(3, 5) : rnd(3, 8), g.then === "drink" ? STEP_DRINK : STEP_GRAZE);
                    return;
                }
                if (!goTo(ev, g.x, g.y) && k.stuck > 90) wait(ev, 40, 120);
                return;
            }
            case "drink": case "graze":
                if (k.done) {
                    k.done = false;
                    if (k.mode === "drink") {              // after drinking: a step back east, still facing the trough, never a turn over it
                        rippleOff(k); setSheet(ev, ""); k.fr = STAND; k.mode = "backoff"; k.backing = true; ev.setMoveSpeed(2.2);
                        if (ev.canPass(ev.x, ev.y, 6)) { ev.moveStraight(6); ev.setDirection(4); }   // (one step east, still facing the trough: the direction is put back at once)
                        else wait(ev, 80, 200);
                    } else wait(ev, 80, 260);
                    return;
                }
                if (heroNear(ev)) { const a = awayFrom(ev); if (a && (a !== 4 || k.mode !== "drink")) { wait(ev, 30, 70); if (ev.canPass(ev.x, ev.y, a)) ev.moveStraight(a); return; } }
                return;
            case "backoff":                                // the step is done: free again, the speed back
                ev.setMoveSpeed(SPEED_WALK); wait(ev, 70, 220);
                return;
            case "walk": {
                if (heroNear(ev)) { const a = awayFrom(ev); if (a && ev.canPass(ev.x, ev.y, a)) { ev.moveStraight(a); k.steps = 0; k.mode = "wait"; k.t = 40; return; } }
                if (k.steps > 0 && ev.canPass(ev.x, ev.y, k.heading)) { k.steps--; ev.moveStraight(k.heading); return; }
                wait(ev, 70, 260);
                return;
            }
            default: {                                    // "wait"
                if (onHerWay(ev.x, ev.y)) { k.mode = "out"; k.doorTrip = true; k.stuck = 0; ev.setMoveSpeed(SPEED_GOTO); return; }   // never stand on the way to the door: walk off it
                if (heroNear(ev)) { const a = awayFrom(ev); if (a && ev.canPass(ev.x, ev.y, a)) { ev.moveStraight(a); k.t = 40; return; } }
                if (--k.t <= 0) chooseNext(ev);
            }
        }
    }

    // ------------------------------------------------------------------ hooks (only the horses are touched)
    const _update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        _update.call(this);
        if (this._konie !== 0 && isHorse(this)) think(this);
    };
    const _selfMove = Game_Event.prototype.updateSelfMovement;
    Game_Event.prototype.updateSelfMovement = function() {
        if (this._konie === 1) return;
        _selfMove.call(this);
    };
    const _pattern = Game_Event.prototype.pattern;
    Game_Event.prototype.pattern = function() {
        return this._konie === 1 && this._k ? this._k.fr : _pattern.call(this);
    };
    // the body: a move needs the body's room on the cell it goes to AND on the one it turns on (side-on: the neighbours too)
    const _canPass = Game_Event.prototype.canPass;
    Game_Event.prototype.canPass = function(x, y, d) {
        if (this._konie === 1 && !this.isThrough()) {
            const f = this._k && this._k.backing ? this.direction() : d;
            if (!bodyClear(this, $gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d), f)) return false;
            if (isHoriz(f) && !bodyClear(this, x, y, f)) return false;
        }
        return _canPass.call(this, x, y, d);
    };
    // a horse's own collision with the events (the engine's canPass): from the yard's grid, the other horses as they are
    const _collidedEvents = Game_Event.prototype.isCollidedWithEvents;
    Game_Event.prototype.isCollidedWithEvents = function(x, y) {
        if (this._konie === 1) {
            const G = yardGrid();
            if (onGrid(G, x, y)) {
                if (G.bits[(y - G.y0) * G.w + (x - G.x0)] & 1) return true;
                const hs = horseEvents();
                for (let i = 0; i < hs.length; i++) { const h = hs[i]; if (h && h !== this && h.posNt(x, y)) return true; }
                return false;
            }
        }
        return _collidedEvents.call(this, x, y);
    };
    const _collided = Game_Event.prototype.isCollidedWithCharacters;
    Game_Event.prototype.isCollidedWithCharacters = function(x, y) {
        if (_collided.call(this, x, y)) return true;
        return this._konie === 1 && Math.abs($gamePlayer._realX - x) < 0.95 && Math.abs($gamePlayer._realY - y) < 0.95;
    };
    // the sprite: a wide sheet (N frames x 4 rows), the frame is the event's own number (clamped to the sheet the sprite holds right now)
    const _patternWidth = Sprite_Character.prototype.patternWidth;
    Sprite_Character.prototype.patternWidth = function() {
        const c = this._character;
        // (isHorse, not the cached flag: the sprite's first frame comes before the event's first update - the black one's 1024 px / 3 = a fractional frame, Sky.js's silhouette threw each frame)
        return c && c instanceof Game_Event && isHorse(c) && this.bitmap && this.bitmap.width ? this.bitmap.width / colsOf(this._characterName) : _patternWidth.call(this);
    };
    const _patternX = Sprite_Character.prototype.characterPatternX;
    Sprite_Character.prototype.characterPatternX = function() {
        const c = this._character;
        return c && c._konie === 1 && c._k ? Math.min(c._k.fr, colsOf(this._characterName) - 1) : _patternX.call(this);
    };

    // ------------------------------------------------------------------ talking
    function talk(ev) {
        const e = ev && ev.character ? ev.character(0) : ev;
        if (!e) return;
        if (e._k) { wait(e, 160, 160); }
        e.turnTowardCharacter($gamePlayer);
        const text = TALKS[rnd(0, TALKS.length - 1)];
        if (window.SpeechBubbles && SpeechBubbles.say) SpeechBubbles.say(e, text, 150); else T.popup(text);
        if (window.AudioManager) AudioManager.playSe({ name: "Horse", volume: 45, pitch: rnd(92, 108), pan: 0 });
    }
    function trough(ev) {
        const text = TROUGH_TALKS[rnd(0, TROUGH_TALKS.length - 1)];
        if (window.SpeechBubbles && SpeechBubbles.say) SpeechBubbles.say($gamePlayer, text, 150); else T.popup(text);
    }

    function horses() { return $gameMap && $gameMap.mapId() === MAP ? IDS.horses.map(id => $gameMap.event(id)).filter(Boolean) : []; }
    // after a load / entering the map nothing of a step back may survive: no fixed direction, no backing flag, no clip, the speed back
    const resetAll = () => { for (const e of horses()) { e.setDirectionFix(false); if (e._k) { e._k.backing = false; e._k.seq = null; e._k.done = false; rippleOff(e._k); if (e._k.mode === "backoff" || e._k.mode === "drink" || e._k.mode === "graze") { e.setMoveSpeed(SPEED_WALK); wait(e, 30, 90); } } } };
    T.on("mapEnter", resetAll, { owner: PLUGIN });
    T.on("load", resetAll, { owner: PLUGIN });

    window.Konie = T.register(PLUGIN, {
        IDS, MAP, YARD, TROUGH, TROUGHS, SPOTS, HORSES,
        horses, talk, trough, door, build, inYard, onHerWay, bodyClear,
        // tests / screenshots: put horse i on a spot and start the clip at once (no walking there)
        pose(i, x, y, d, kind) {
            const e = horses()[i], k = e && e._k;
            if (!e || !k) return false;
            wait(e, 99999, 99999); e.locate(x, y); e.setDirection(d); k.lx = e._realX; k.ly = e._realY;
            if (kind === "drink") { k.mode = "drink"; startClip(e, "_Pije", 4, STEP_DRINK); }
            else if (kind === "graze") { k.mode = "graze"; startClip(e, "_Pasie", 5, STEP_GRAZE); }
            return true;
        },
        setAuto(v) { auto = !!v; },
        always(v) { always = v === undefined ? always : v; return always; },
        night: () => isNight(hour()),
        state: () => horses().map(e => ({ id: e.eventId(), x: e.x, y: e.y, d: e.direction(), goal: e._k && e._k.goal ? { x: e._k.goal.x, y: e._k.goal.y } : null, rx: e._realX, ry: e._realY, backing: !!(e._k && e._k.backing), fixed: e.isDirectionFixed(), seq: !!(e._k && e._k.seq), mode: e._k ? e._k.mode : null, fr: e._k ? e._k.fr : 0, hidden: !!e._transparent, rip: !!(e._k && e._k.rip), sheet: e._characterName }))
    });
})();
