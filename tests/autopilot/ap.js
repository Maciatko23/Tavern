// In-game autopilot for the watched play session (injected over CDP, NOT a game plugin).
// It runs inside Scene_Map.update, one step per game frame, driving the real keys (Input._currentState):
// paths over the tiles (8-way where both corners are free), walking by the keys, facing, O / Q / E, holding O,
// reading the menus to pick entries by name. Tasks run from a queue; reflexes (eat, rest) run between steps.
(function() {
    const VERSION = 72;
    if (window.AP && window.AP.version === VERSION) return "same";
    const AP = window.AP = { version: VERSION, queue: [], cur: null, curName: "", log: [], paused: false, reserve: 16, restTo: 90, frame: 0 };
    const hour = () => ($gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12);
    const clock = () => { const h = hour(); return Math.floor(h) + ":" + String(Math.floor((h % 1) * 60)).padStart(2, "0"); };
    const say = m => { AP.log.push("[" + clock() + "] " + m); if (AP.log.length > 80) AP.log.shift(); AP.saidAt = AP.frame; };
    AP.say = say;
    const DANGER = { boar: 1, wolf: 1 };
    AP.zones = [];
    const ZONE_R = 8, ZONE_FRAMES = 60 * 150;
    function inZone(x, y) {
        AP.zones = AP.zones.filter(z => AP.frame < z.until);
        return AP.zones.some(z => Math.hypot(x - z.x, y - z.y) < z.r);
    }
    AP.inZone = inZone;

    // ---- keys
    const held = new Set();
    function key(k, on) { Input._currentState[k] = on; if (on) held.add(k); else held.delete(k); }
    function releaseAll() { for (const k of [...held]) key(k, false); }
    function setMove(keys) { for (const k of ["left", "right", "up", "down"]) key(k, keys.includes(k)); }
    function* wait(n) { for (let i = 0; i < n; i++) yield; }
    function* press(k) { key(k, true); yield; yield; key(k, false); yield; yield; }

    // ---- state
    const P = () => $gamePlayer;
    const stamina = () => ($gameSystem.stamina ? $gameSystem.stamina() : 100);
    const staminaCap = () => {
        const max = $gameSystem.maxStamina ? $gameSystem.maxStamina() : 100;
        const r = window.Needs && Needs.enabled && Needs.enabled() && Needs.capRatio ? Needs.capRatio() : 1;
        const rc = window.Farming && Farming.restCap ? Farming.restCap() / max : 1;
        return Math.max(10, Math.round(max * Math.min(r, rc)) - 2);
    };
    const count = id => $gameParty.numItems($dataItems[id]);
    const totalItems = () => $gameParty.allItems().reduce((s, i) => s + $gameParty.numItems(i), 0);
    const scene = () => SceneManager._scene;
    const menuOpen = () => !!$gameTemp._farmMenuOpen;
    const busy = () => $gameMap.isEventRunning() || $gameMessage.isBusy();
    const working = () => !!(P()._toolSwing || P()._swingEvent || P()._holdStrike || (scene() && scene()._farmHold));
    const free = () => P().canMove() && !P().isMoving() && !menuOpen() && !$gameTemp._buildMode && !busy() && !working();
    function* standUp() {
        if (P().isMoving() || !working() || menuOpen()) return;
        const opts = [[2, "down"], [8, "up"], [4, "left"], [6, "right"]];
        const way = opts.find(([d]) => P().canPass(P().x, P().y, d)) || opts[0];
        for (let n = 0; n < 40 && working(); n++) { key(way[1], n < 3); yield; }
        key(way[1], false);
        yield* wait(4);
    }
    function* waitFree(max = 900) { let n = 0; while (!free() && n++ < max) yield; yield* wait(3); return free(); }
    function* closeMenus() { let n = 0; while ((menuOpen() || $gameTemp._buildMode) && n++ < 8) yield* press("cancel"); }

    // ---- paths: Dijkstra over the tiles, 8-way where both corners pass
    const W = () => $gameMap.width(), H = () => $gameMap.height();
    function passStep(x, y, dx, dy) {
        const p = P();
        if (dx && dy) {
            const h = dx > 0 ? 6 : 4, v = dy > 0 ? 2 : 8;
            return p.canPass(x, y, h) && p.canPass(x + dx, y, v) && p.canPass(x, y, v) && p.canPass(x, y + dy, h);
        }
        return p.canPass(x, y, dx > 0 ? 6 : dx < 0 ? 4 : dy > 0 ? 2 : 8);
    }
    const STEPS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.42], [1, -1, 1.42], [-1, 1, 1.42], [-1, -1, 1.42]];
    function exitTiles() {
        const out = new Set(), w = W();
        for (const e of $gameMap.events()) {
            const pg = e.page();
            if (pg && (pg.trigger === 1 || pg.trigger === 2) && pg.list.some(c => c.code === 201)) out.add(e.y * w + e.x);
        }
        return out;
    }
    function field(sx, sy) {
        AP.lastStep = 'field';
        const avoid = exitTiles();
        const nearExit = new Set();   // (the tiles round a crossing: dear, so no path brushes past one)
        for (const j of avoid) { const ex = j % W(), ey = (j / W()) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) nearExit.add((ey + dy) * W() + ex + dx); }
        const zoneCost = AP.zones.length > 0;
        const w = W(), h = H(), n = w * h, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
        const heap = [];
        const push = (d, i) => { heap.push([d, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
        const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
        dist[sy * w + sx] = 0; push(0, sy * w + sx);
        while (heap.length) {
            const [d, i] = pop();
            if (d > dist[i]) continue;
            const x = i % w, y = (i / w) | 0;
            for (const [dx, dy, c] of STEPS) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                const j = ny * w + nx, nd = d + c + (zoneCost && inZone(nx, ny) ? 40 : 0) + (nearExit.has(j) ? 30 : 0);
                if (nd >= dist[j] || avoid.has(j) || !passStep(x, y, dx, dy)) continue;
                dist[j] = nd; prev[j] = i; push(nd, j);
            }
        }
        return { dist, prev, w, sx, sy, at: (x, y) => dist[y * w + x] };
    }
    function pathFrom(f, tx, ty) {
        if (!isFinite(f.at(tx, ty))) return null;
        const out = []; let i = ty * f.w + tx;
        while (i !== -1) { out.unshift([i % f.w, (i / f.w) | 0]); i = f.prev[i]; }
        return out;
    }
    // turning points: runs of the same step become one segment
    function segments(path) {
        const segs = [];
        for (let k = 1; k < path.length; k++) {
            const dx = path[k][0] - path[k - 1][0], dy = path[k][1] - path[k - 1][1], last = segs[segs.length - 1];
            if (last && last.dx === dx && last.dy === dy) { last.x = path[k][0]; last.y = path[k][1]; }
            else segs.push({ dx, dy, x: path[k][0], y: path[k][1] });
        }
        return segs;
    }
    const TOL = 0.07;
    function* align(tx, ty) {
        for (let n = 0; n < 150; n++) {
            const dx = tx - P()._realX, dy = ty - P()._realY, keys = [];
            if (dx > TOL) keys.push("right"); else if (dx < -TOL) keys.push("left");
            if (dy > TOL) keys.push("down"); else if (dy < -TOL) keys.push("up");
            if (!keys.length) { setMove([]); return true; }
            setMove(keys);
            yield;
        }
        setMove([]);
        return false;
    }
    function* followSeg(s) {
        let last = "", still = 0;
        for (let n = 0; n < 1200; n++) {
            const rx = P()._realX, ry = P()._realY;
            const needX = s.dx !== 0 && (s.x - rx) * s.dx > TOL, needY = s.dy !== 0 && (s.y - ry) * s.dy > TOL;
            if (!needX && !needY) return true;
            const keys = [];
            if (needX) keys.push(s.dx > 0 ? "right" : "left");
            if (needY) keys.push(s.dy > 0 ? "down" : "up");
            setMove(keys);
            const k = rx.toFixed(3) + "," + ry.toFixed(3);
            still = k === last && P().canMove() ? still + 1 : 0;
            last = k;
            if (still > 16) { setMove([]); return false; }
            yield;
        }
        return false;
    }
    function* walkTo(tx, ty, f0) {
        if (inZone(tx, ty) && !inZone(P().x, P().y) && !(AP.frame < (AP.zoneFreeUntil || 0))) { say("tam jest dzik - później"); return false; }
        for (let attempt = 0; attempt < 4; attempt++) {
            yield* closeMenus();
            yield* standUp();
            const sx = P().x, sy = P().y;
            yield* align(sx, sy);
            if (P().x === tx && P().y === ty) return true;
            const f = attempt === 0 && f0 && f0.sx === P().x && f0.sy === P().y ? f0 : field(P().x, P().y);
            const path = pathFrom(f, tx, ty);
            if (!path) { say("nie ma drogi do " + tx + "," + ty); return false; }
            let stuck = false;
            for (const s of segments(path)) if (!(yield* followSeg(s))) { stuck = true; break; }
            setMove([]);
            if (!stuck) { yield* align(tx, ty); if (P().x === tx && P().y === ty) return true; }
            yield* wait(4);
        }
        setMove([]);
        return P().x === tx && P().y === ty;
    }

    // where to stand to work on these tiles (4 sides), the nearest by the path first
    const FACE = [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]];   // stand below -> face up ...
    function spotsFor(tiles, f, front) {
        tiles = tiles.map(t => (Array.isArray(t) ? t : [t.x, t.y]));
        const set = new Set(tiles.map(t => t[0] + "," + t[1])), out = [];
        const bottom = Math.max(...tiles.map(t => t[1]));
        for (const [tx, ty] of tiles) for (const [dx, dy, d] of FACE) {
            if (front && (ty !== bottom || d === 2)) continue;
            const x = tx + dx, y = ty + dy;
            if (!$gameMap.isValid(x, y) || set.has(x + "," + y)) continue;
            const c = f.at(x, y);
            if (isFinite(c)) out.push({ x, y, d, c });
        }
        return out.sort((a, b) => a.c - b.c);
    }
    function* goFace(tiles, f, front) {
        if (!f || f.sx !== P().x || f.sy !== P().y) f = field(P().x, P().y);
        const spots = spotsFor(tiles, f, front);
        for (const s of spots.slice(0, 4)) {
            if (!(yield* walkTo(s.x, s.y, f))) continue;
            yield* standUp();
            yield* waitFree(240);
            P().setDirection(s.d);
            AP.holdOff = AP.frame + 150;   // (bedtime waits till the work here is under way - a danger does not)
            yield* wait(3);
            return s;
        }
        return null;
    }

    // ---- menus: pick an entry by its name (tabs too)
    function* choose(name, max = 60) {
        let n = 0;
        while (!menuOpen() && n++ < max) yield;
        if (!menuOpen()) return false;
        yield* wait(4);
        const m = scene()._farmMenu, match = e => e && (e.name === name || (typeof e.name === "string" && e.name.startsWith(name)));
        if (m._tabs) {
            const ti = m._tabs.findIndex(t => t.entries.some(match));
            if (ti < 0) return false;
            for (let g = 0; m._tab !== ti && g < 10; g++) yield* press(m._tab < ti ? "right" : "left");
        }
        const idx = m._entries.findIndex(match);
        if (idx < 0) return false;
        if (m._entries[idx].enabled === false) { say("wyszarzone: " + name + (m._entries[idx].help ? " (" + String(m._entries[idx].help).split(/[.!\n]/)[0] + ")" : "")); return false; }
        for (let g = 0; m.index() !== idx && g < 60; g++) yield* press(m.index() < idx ? "down" : "up");
        yield* wait(3);
        yield* press("ok");
        return true;
    }
    const entryNames = () => (menuOpen() ? scene()._farmMenu._entries.map(e => e.name) : []);

    // ---- reflexes: eat when hungry or thirsty, rest when worn out
    const FOODS = [102, 139, 140];   // berries, wild apples, wild pears (water too)
    function* eat(itemId, n = 1) {
        yield* closeMenus();
        const name = $dataItems[itemId].name;
        yield* press("pagedown");
        let k = 0;
        while (!menuOpen() && k++ < 40) yield;
        if (!menuOpen()) return 0;
        let ate = 0;
        for (let i = 0; i < n && count(itemId) > 0; i++) {
            const before = count(itemId);
            if (!(yield* choose(name))) break;
            yield* wait(20);
            if (count(itemId) < before) ate++;
            else break;
            if (!menuOpen()) { yield* press("pagedown"); yield* wait(10); }
        }
        yield* closeMenus();
        if (ate) say("zjadł " + name + " x" + ate);
        return ate;
    }
    function groundDir(entry) {
        for (const d of [2, 4, 6, 8]) {
            const x = $gameMap.roundXWithDirection(P().x, d), y = $gameMap.roundYWithDirection(P().y, d);
            if (Farming.gatherAt(x, y) || Farming.stoneAt(x, y) || Farming.buildingAt(x, y)) continue;
            const m = Farming.menuFor(x, y);
            if (m && m.entries && m.entries.some(e => e.name === entry && e.enabled !== false)) return d;
        }
        return 0;
    }
    function* openGround(entry) {
        yield* closeMenus();
        yield* waitFree();
        let d = groundDir(entry);
        if (!d) {   // step somewhere with such a tile next to it
            const f = field(P().x, P().y);
            let best = null;
            for (let y = P().y - 7; y <= P().y + 7; y++) for (let x = P().x - 7; x <= P().x + 7; x++) {
                if (!$gameMap.isValid(x, y) || !$gameMap.isValid(x, y + 1) || !isFinite(f.at(x, y)) || Farming.gatherAt(x, y + 1) || Farming.stoneAt(x, y + 1) || Farming.buildingAt(x, y + 1)) continue;
                const m = Farming.menuFor(x, y + 1);
                if (m && m.entries && m.entries.some(e => e.name === entry && e.enabled !== false) && (!best || f.at(x, y) < best.c)) best = { x, y, c: f.at(x, y) };
            }
            if (!best || !(yield* walkTo(best.x, best.y, f))) return false;
            d = 2;
        }
        P().setDirection(d);
        yield* wait(3);
        yield* press("ok");
        return yield* choose(entry);
    }
    function* rest(to) {
        to = Math.min(to || AP.restTo, staminaCap());
        if ((hour() >= 20 || hour() < 4.5) && (built("bedroll") || built("tent")) && (yield* sleepNight())) return true;   // night: the bed, not the grass
        yield* closeMenus();
        yield* waitFree();
        // a tile around him where "Odpocznij" is on the menu
        let dir = 0;
        for (const d of [2, 4, 6, 8]) {
            const x = $gameMap.roundXWithDirection(P().x, d), y = $gameMap.roundYWithDirection(P().y, d);
            if (Farming.gatherAt(x, y) || Farming.stoneAt(x, y)) continue;
            const m = Farming.menuFor(x, y);
            if (m && m.entries && m.entries.some(e => e.name === "Odpocznij" && e.enabled !== false)) { dir = d; break; }
        }
        if (!dir) {   // step onto open grass first
            const f = field(P().x, P().y);
            let best = null;
            for (let y = P().y - 6; y <= P().y + 6; y++) for (let x = P().x - 6; x <= P().x + 6; x++) {
                if (!$gameMap.isValid(x, y + 1) || !isFinite(f.at(x, y)) || Farming.gatherAt(x, y + 1) || Farming.stoneAt(x, y + 1)) continue;
                const m = Farming.menuFor(x, y + 1);
                if (m && m.entries && m.entries.some(e => e.name === "Odpocznij" && e.enabled !== false) && (!best || f.at(x, y) < best.c)) best = { x, y, c: f.at(x, y) };
            }
            if (!best || !(yield* walkTo(best.x, best.y))) { say("nie ma gdzie usiąść"); return false; }
            dir = 2;
        }
        say("odpoczywa (wytrzymałość " + Math.round(stamina()) + " -> " + to + ")");
        const clockNow = () => $gameSystem.dayNightDay() * 24 + hour(), t0 = clockNow(), bed = built("bedroll") || built("tent");
        P().setDirection(dir);
        yield* wait(3);
        yield* press("ok");
        if (!(yield* choose("Odpocznij"))) { yield* closeMenus(); say("nie usiadł"); return false; }
        yield* wait(10);
        // he rests on by himself (an hour a second) and gets up at full strength; at bedtime (a bed to go to) a tap stands him up
        for (let n = 0; n < 60 * 40 && P()._toolSwing; n++) {
            if (bed && hour() >= 20 && hour() < 21) { yield* press(dir === 2 ? "up" : "down"); break; }
            yield;
        }
        yield* waitFree();
        say("wstał (" + Math.round(stamina()) + ", " + Math.round(clockNow() - t0) + " godz.)");
        return true;
    }
    function* drink() {
        const f = field(P().x, P().y);
        let best = null;
        for (let y = 0; y < H(); y++) for (let x = 0; x < W(); x++) {
            if (!Farming.isWaterTile(x, y)) continue;
            const s = spotsFor([[x, y]], f)[0];
            if (s && (!best || s.c < best.s.c)) best = { x, y, s };
        }
        if (!best || best.s.c > 60) return false;
        if (!(yield* goFace([[best.x, best.y]], f))) return false;
        let n = 0;
        while (Needs.state().water < 90 && n++ < 3) {
            const w0 = Needs.state().water;
            yield* press("ok");
            if (!(yield* choose("Napij się"))) { yield* closeMenus(); break; }
            yield* wait(20);
            yield* waitFree();
            yield* closeMenus();
            if (Needs.state().water <= w0) break;
        }
        say("napił się wody (" + Math.round(Needs.state().water) + ")");
        return true;
    }
    function* pickFruit() {
        const day = $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 0;
        AP.fruitTried = AP.fruitTried || {};
        const ok = e => ChoppableTree.isTree(e) && !gone(e) && !$gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "A"]) && (() => { const c = ChoppableTree.treeConfig(e); return c && c.fruit > 0; })() && !$gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "C"]) && AP.fruitTried[e.eventId()] !== day;
        let got = 0;
        for (let i = 0; i < 4; i++) {
            const e = nearestEvent(ok);
            if (!e) break;
            AP.fruitTried[e.eventId()] = day;
            const before = count(139) + count(140);
            if (!(yield* goFace([[e.x, e.y]]))) continue;
            yield* press("ok");
            yield* wait(30);
            yield* waitFree(240);
            yield* closeMenus();
            const n = count(139) + count(140) - before;
            if (n > 0) { got += n; say("zerwał owoce: +" + n); break; }
        }
        return got;
    }
    function* drinkVessel() {
        let drank = false;
        for (let i = 0; i < 4 && Needs.state().water < 80; i++) {
            const f = field(P().x, P().y);
            const full = myBuildings().filter(b => !b.site && Farming.BUILDINGS[b.type] && Farming.BUILDINGS[b.type].rain && Farming.bucketUnits(b) >= 1 && !AP.nearDanger(b.x, b.y) && !inZone(b.x, b.y));
            const b = full.map(b => ({ b, s: spotsFor(Farming.tilesOfBuilding(b.type, b.x, b.y).map(t => [t.x, t.y]), f, true)[0] })).filter(o => o.s).sort((a, c) => a.s.c - c.s.c)[0];
            if (!b) break;
            const w0 = Needs.state().water;
            if (!(yield* useEntry(b.b, "Napij się")) && Needs.state().water <= w0) break;
            drank = true;
        }
        if (drank) say("napił się deszczówki (" + Math.round(Needs.state().water) + ")");
        return drank;
    }
    const needsCapped = () => !!(window.Needs && Needs.enabled && Needs.enabled() && Needs.capRatio && Needs.capRatio() < 0.999);
    const needsLimit = () => (needsCapped() ? Math.round(($gameSystem.maxStamina ? $gameSystem.maxStamina() : 100) * Needs.capRatio()) : Infinity);
    function* feedUp() {
        if (AP.feedDepth > 0) return false;   // (gathering berries for it runs the reflexes again: not a second one inside)
        AP.feedDepth = 1;
        try { return yield* feedUpInner(); } finally { AP.feedDepth = 0; }
    }
    // what a food gives, [fed, water], as the game counts it: Needs.FEED, else the item's <Food:...> note (fed, water; fed from the
    // stamina it gives). Raw meat, raw fish and rot: [0, 0] (not eaten as they are)
    const NOT_RAW = new Set([94, 157, 159, 161, 98, 122]);
    function feedOf(id) {
        const it = $dataItems[id];
        if (!it || !window.Needs || NOT_RAW.has(id)) return [0, 0];
        const info = window.Survival && Survival.foodInfo ? Survival.foodInfo(it) : null;
        if (!info && !(Needs.FEED || {})[id]) return [0, 0];
        return Needs.foodValues ? Needs.foodValues(it, info || {}) : (Needs.FEED[id] || [0, 0]);
    }
    // the ids of the foods in the bag (worth eating for hunger or thirst)
    const bagFoods = () => $gameParty.items().map(it => it.id).filter(id => { const f = feedOf(id); return f[0] > 0 || f[1] > 0; });
    AP.feedOf = feedOf;
    function* feedUpInner() {
        if (!needsCapped()) return true;
        const FEED = new Proxy({}, { get: (_, id) => feedOf(Number(id)) });   // (a food's [fed, water] by its id)
        const atHand = bagFoods().length > 0 || (built("well") && Needs.state().water < 60) ||
            myBuildings().some(b => !b.site && Farming.BUILDINGS[b.type] && Farming.BUILDINGS[b.type].rain && Farming.bucketUnits(b) >= 1);
        if (!atHand && AP.frame - (AP.feedTry || -1e9) < 60 * 20) return false;   // (nothing at hand, out for more a moment ago)
        const s0 = Needs.state();
        say("głodny/spragniony (jedzenie " + Math.round(s0.food) + ", woda " + Math.round(s0.water) + ") - najpierw je i pije");
        for (let round = 0; round < 3 && needsCapped(); round++) {
            if (Needs.state().water < 50) { yield* drinkWell(); if (Needs.state().water < 50) yield* drinkVessel(); if (Needs.state().water < 50) yield* drink(); }
            // what there is in the bag: the most filling first; watery food while thirsty
            const thirsty = Needs.state().water < Needs.state().food;   // (the need that is worse first: watery food while thirsty)
            const foods = bagFoods().sort((a, b) => thirsty ? (FEED[b][1] - FEED[a][1]) || (FEED[b][0] - FEED[a][0]) : (FEED[b][0] + FEED[b][1]) - (FEED[a][0] + FEED[a][1]));
            for (const id of foods) {
                while (count(id) > 0 && ((FEED[id][0] > 0 && Needs.state().food < 60) || (FEED[id][1] > 0 && Needs.state().water < 60))) {
                    if (!(yield* eat(id, 1))) break;
                }
            }
            if (!needsCapped() && Needs.state().food >= 45 && Needs.state().water >= 45) break;   // (a margin: a rest makes him hungrier)
            // the pantry first (the next round eats what he took)
            if (round < 2 && (yield* fromPantry(Needs.state().food >= 45))) continue;   // (fed enough but thirsty: something watery)
            // nothing left to eat: fruit off the trees, berries off the bushes (the next round eats them)
            // (going out for more: not again within 20 s of the last time; then the next round eats what was brought)
            if (round < 2 && needsCapped() && count(102) + count(139) + count(140) === 0 && AP.frame - (AP.feedTry || -1e9) >= 60 * 20) {
                AP.feedTry = AP.frame;
                yield* pickFruit();
                if (count(102) + count(139) + count(140) === 0) yield* collect({ 102: count(102) + 4 }, 4);
            } else break;
        }
        const s1 = Needs.state();
        say(needsCapped() ? "dalej głodny/spragniony (jedzenie " + Math.round(s1.food) + ", woda " + Math.round(s1.water) + ")" : "najadł się i napił");
        return !needsCapped();
    }
    AP.feedUp = feedUp;
    // ---- the pantry: food keeps five times longer in it (Spoilage). He carries a few ready bites (the soonest to spoil), the rest
    // goes in; when hungry he takes from it before going out for more
    const PANTRY_KEEP = 3, RAW_MEATS = [94, 157, 159, 161];
    const pantryB = () => myBuildings("pantry").find(b => !b.site);
    const leftH = id => { const h = window.Spoilage && Spoilage.hoursLeft ? Spoilage.hoursLeft(id) : null; return h === null || h === undefined ? 1e9 : h; };
    const readyFood = id => { const f = feedOf(id); return f[0] > 0 || f[1] > 0; };
    function* storePantry(force) {
        const b = pantryB();
        if (!b || !window.Spoilage || $gameMap.mapId() !== HOME_MAP) return false;
        const cooking = built("campfire");   // (raw meat waits for the fire in the bag)
        const perish = $gameParty.items().filter(i => Spoilage.isPerishable(i) && !(cooking && RAW_MEATS.includes(i.id)));
        if (!perish.length) return false;
        const keep = {};
        let kept = 0;
        for (const i of perish.filter(i => readyFood(i.id)).sort((a, c) => leftH(a.id) - leftH(c.id))) {
            const n = Math.min(count(i.id), PANTRY_KEEP - kept);
            if (n > 0) { keep[i.id] = n; kept += n; }
        }
        const put = perish.map(i => [i, count(i.id) - (keep[i.id] || 0)]).filter(([, n]) => n > 0);
        const total = put.reduce((t, [, n]) => t + n, 0);
        if (!total || (!force && total < 3 && !put.some(([i]) => leftH(i.id) < 24))) return false;   // (one or two: not worth the walk yet)
        if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) return false;
        const done = [];
        for (const [i, n] of put) { const m = Farming.putInChest(b, i, n); if (m > 0) done.push(i.name + " ×" + m); }
        if (done.length) { say("odłożył do spiżarni: " + done.join(", ")); yield* wait(20); }
        return done.length > 0;
    }
    function* fromPantry(thirsty) {
        const b = pantryB();
        if (!b || !b.store || $gameMap.mapId() !== HOME_MAP || !window.Needs) return false;
        const F = new Proxy({}, { get: (_, id) => feedOf(Number(id)) }), k = thirsty ? 1 : 0;
        const pLeft = id => { const f = Spoilage.chestFreshness ? Spoilage.chestFreshness(b, id) : null; return f && f.hours !== undefined ? f.hours : 1e9; };
        const ids = Object.keys(b.store).filter(key => /^i\d+$/.test(key) && b.store[key] > 0).map(key => +key.slice(1))
            .filter(id => F[id][k] > 0).sort((a, c) => pLeft(a) - pLeft(c));
        if (!ids.length) return false;
        let need = 70 - (thirsty ? Needs.state().water : Needs.state().food);
        const take = [];
        for (const id of ids) {
            if (need <= 0) break;
            const n = Math.min(b.store["i" + id], Math.ceil(need / F[id][k]), 4);
            take.push([id, n]); need -= n * F[id][k];
        }
        if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) return false;
        const got = [];
        for (const [id, n] of take) { const m = Farming.takeFromChest(b, $dataItems[id], n); if (m > 0) got.push($dataItems[id].name + " ×" + m); }
        if (got.length) { say("wziął ze spiżarni: " + got.join(", ")); yield* wait(10); }
        return got.length > 0;
    }
    // rotten food: to the compost bin (4 of it -> 3 soil)
    function* compostRot() {
        const ROT = window.Spoilage ? Spoilage.ROT : 122;
        const b = myBuildings("compost").find(b => !b.site);
        if (!b || count(ROT) < 4 || b.job || $gameMap.mapId() !== HOME_MAP) return false;
        const r0 = count(ROT);
        yield* craft("compost", "Kompostuj zepsute jedzenie");
        if (count(ROT) < r0) { say("zepsute jedzenie do kompostownika (" + (r0 - count(ROT)) + ")"); return true; }
        return false;
    }
    function* tendPantry(force) {
        if (!force && AP.frame - (AP.pantryAt || -1e9) < 60 * 60) return;   // (once a game hour)
        AP.pantryAt = AP.frame;
        yield* storePantry(force);
        yield* compostRot();
    }
    AP.storePantry = storePantry; AP.fromPantry = fromPantry;
    function* reflexes() {
        const s = window.Needs && Needs.enabled && Needs.enabled() ? Needs.state() : null;
        if (needsCapped()) yield* feedUp();
        // (below 50: what is at hand first - the well, the pots, water, something watery in the bag; out for fruit only below 40)
        if (s && Needs.state().water < 50 && (yield* drinkWell())) { /* the well: as much as he likes */ }
        if (s && Needs.state().water < 50 && (yield* drinkVessel())) { /* rain water in the pots */ }
        if (s && Needs.state().water < 50 && (yield* drink())) { /* water first, it is free */ }
        if (s && Needs.state().water < 40 && count(102) + count(139) + count(140) === 0) yield* pickFruit();
        if (s && Needs.state().water < 50) {
            const wet = bagFoods().filter(id => feedOf(id)[1] > 0).sort((a, b) => feedOf(b)[1] - feedOf(a)[1]);
            for (const id of wet) while (count(id) > 0 && Needs.state().water < 80) { if (!(yield* eat(id, 1))) break; }
        }
        for (let t = 0; t < 2 && s && Needs.state().food < 50; t++) {
            const foods = bagFoods().filter(id => feedOf(id)[0] > 0).sort((a, b) => feedOf(b)[0] - feedOf(a)[0]);
            for (const id of foods) while (count(id) > 0 && Needs.state().food < 70) { if (!(yield* eat(id, 1))) break; }
            if (Needs.state().food >= 40 || t || !(yield* fromPantry(false))) break;   // (the pantry: a walk - below 40)
        }
        if (stamina() < Math.min(AP.reserve, staminaCap() - 5)) yield* restFast(AP.restTo);
    }

    // ---- tasks
    const gatherKind = (x, y) => (Farming.gatherAt(x, y) ? Farming.gatherKindOf(x, y) : Farming.stoneAt(x, y) ? "stone" : null);
    function* gather(kinds, n, okTile) {
        if (typeof kinds === "string") kinds = kinds.split(",");
        const bad = new Set();
        let got = 0;
        while (got < n) {
            yield* reflexes();
            const f = field(P().x, P().y);
            let best = null;
            for (let y = 0; y < H(); y++) for (let x = 0; x < W(); x++) {
                if (bad.has(x + "," + y) || AP.nearDanger(x, y) || inZone(x, y)) continue;
                const k = gatherKind(x, y);
                if (!k || !kinds.includes(k) || (okTile && !okTile(x, y, k))) continue;
                const s = spotsFor([[x, y]], f)[0];
                // standing on it and facing it from the tile before also works: the cheaper of the two
                if (s && (!best || s.c < best.s.c)) best = { x, y, k, s };
            }
            if (!best) { say("nie ma już: " + kinds.join(",")); return got; }
            const before = totalItems();
            const s = yield* goFace([[best.x, best.y]], f);
            const fx = $gameMap.roundXWithDirection(P().x, P().direction()), fy = $gameMap.roundYWithDirection(P().y, P().direction());
            if (s && fx === best.x && fy === best.y && gatherKind(fx, fy)) { yield* press("ok"); yield* wait(6); yield* waitFree(120); }
            if (menuOpen()) yield* closeMenus();
            const gain = totalItems() - before;
            if (gain > 0) { got++; say("+" + gain + " " + best.k); } else bad.add(best.x + "," + best.y);
        }
        return got;
    }
    // pick up the nearest of whatever is still short of the goal ({item id: count}), until all are there
    const KIND_ITEM = { branch: 77, stone: 64, fiber: 92, bush: 102, cone: 147, nettle: 149 };
    function* collect(goal, maxPicks = 80) {
        let picks = 0;
        for (let i = 0; i < maxPicks; i++) {
            const kinds = Object.keys(KIND_ITEM).filter(k => goal[KIND_ITEM[k]] !== undefined && count(KIND_ITEM[k]) < goal[KIND_ITEM[k]]);
            if (!kinds.length) return Math.max(1, picks);
            if (!(yield* gather(kinds, 1))) return picks;
            picks++;
        }
        return picks;
    }
    // hold O on these tiles (a tree, a log, a rock, a building site) until done() or nothing more happens
    function* holdOn(tiles, done, label, front) {
        for (let round = 0; round < 12; round++) {
            if (done()) return true;
            yield* reflexes();
            if (tiles.some(t => (Array.isArray(t) ? inZone(t[0], t[1]) : inZone(t.x, t.y)))) { say(label + ": tam jest dzik - później"); return false; }
            if (!(yield* goFace(tiles, null, front))) { say("nie dojdzie do: " + label); return false; }
            AP.holding = label; AP.holdEnd = Infinity;
            key("ok", true);
            let idle = 0;
            for (let n = 0; n < 60 * 90; n++) {
                yield;
                if (done()) break;
                if (menuOpen() && !(scene() && scene()._farmHold)) { key("ok", false); yield* closeMenus(); break; }
                if (stamina() < AP.reserve * 0.6) break;
                idle = working() || P()._restSit ? 0 : idle + 1;
                if (idle > 50) break;
            }
            key("ok", false);
            yield* wait(4);
            AP.holdEnd = AP.frame;   // (the last blow lands a moment after the key is let go)
            yield* closeMenus();
            if (done()) return true;
            if (stamina() < AP.reserve) {
                const s0 = stamina();
                yield* restFast(AP.restTo);
                if (stamina() <= s0 + 1) { say(label + ": brak sił (głód/pragnienie)"); return false; }
                continue;
            }
            if (idle > 50) { say(label + ": nic się nie dzieje"); return false; }
        }
        return done();
    }
    function evTag(e) { const m = (e.event().note || "").match(/<(\w+)/); return m ? m[1] : ""; }
    AP.bad = AP.bad || new Set();
    const badKey = e => $gameMap.mapId() + ":" + e.eventId();
    const gone = e => !e || e._erased || !e.page() || e._treeGone || AP.bad.has(badKey(e)) ||
        (["Log", "Rock", "Stump"].includes(evTag(e)) && $gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "A"]));
    function nearestEvent(pred) {
        const f = field(P().x, P().y);
        let best = null;
        for (const e of $gameMap.events()) {
            if (!pred(e) || AP.nearDanger(e.x, e.y) || inZone(e.x, e.y)) continue;
            const s = spotsFor([[e.x, e.y]], f)[0];
            if (s && (!best || s.c < best.c)) best = { e, c: s.c };
        }
        return best && best.e;
    }
    const fruitTree = e => { const c = ChoppableTree.treeConfig(e); return !!c && c.fruit > 0; };
    const standingTree = e => ChoppableTree.isTree(e) && !gone(e) && !$gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "A"]) && !fruitTree(e);
    const LOG_WOOD = { hits: 2, dropmin: 1, dropmax: 2, cost: 3 };   // (ChoppableTree LOG_DEFAULTS)
    function woodScore(e, walk) {
        const log = evTag(e) === "Log", cfg = log ? LOG_WOOD : ChoppableTree.treeConfig(e);
        const left = Math.max(1, (cfg.hits || 8) - (e._treeHits || 0));
        return (left * (cfg.cost || 5) + 0.2 * walk) / (((cfg.dropmin || 1) + (cfg.dropmax || 1)) / 2);
    }
    function bestWood(logsToo) {
        const f = field(P().x, P().y);
        let best = null;
        for (const e of $gameMap.events()) {
            const log = logsToo && evTag(e) === "Log" && !gone(e);
            if (!log && !standingTree(e)) continue;
            if (AP.nearDanger(e.x, e.y) || inZone(e.x, e.y)) continue;
            const s = spotsFor([[e.x, e.y]], f)[0];
            if (!s) continue;
            const sc = woodScore(e, s.c);
            if (!best || sc < best.sc) best = { e, sc, log };
        }
        return best;
    }
    AP.bestWood = bestWood;
    function* chopThis(e) {
        const w0 = count(61), cfg = ChoppableTree.treeConfig(e) || {};
        const ok = yield* holdOn([[e.x, e.y]], () => !standingTree(e), "drzewo " + e.eventId());
        yield* wait(40);
        say((ok ? "ścięte drzewo" : "nie ścięte drzewo") + " " + ((e.event().pages[0] || {}).image || {}).characterName.replace("!$", "") + " (+" + (count(61) - w0) + " drewna, " + (cfg.dropmin || "?") + "-" + (cfg.dropmax || "?") + ")");
        return ok;
    }
    function* chop(n = 1, pine) {
        let got = 0;
        if (!count(60) && !count(115)) { say("nie ma siekiery"); return 0; }
        for (let i = 0; i < n; i++) {
            const e = pine === undefined ? (bestWood(false) || {}).e : nearestEvent(ev => standingTree(ev) && ChoppableTree.isPine(ev) === !!pine);
            if (!e) { say("nie ma drzew"); break; }
            if (yield* chopThis(e)) got++;
        }
        return got;
    }
    function* harvest(tag, n = 1, pick) {   // Log, Rock, Stump (pick: that one first)
        let got = 0;
        for (let i = 0; i < n; i++) {
            const e = i === 0 && pick && !gone(pick) ? pick : nearestEvent(ev => evTag(ev) === tag && !gone(ev));
            if (!e) { say("nie ma: " + tag); break; }
            const before = totalItems(), id = e.eventId(), page = e._pageIndex;
            const ok = yield* holdOn([[e.x, e.y]], () => gone(e) || e._pageIndex !== page, tag + " " + id);
            if (totalItems() <= before) AP.bad.add(badKey(e));
            say(tag + " " + id + (ok ? " gotowe" : " nie") + " (+" + (totalItems() - before) + ")");
            if (ok) got++;
        }
        return got;
    }
    const myBuildings = type => ((Farming.farm().buildings || {})[$gameMap.mapId()] || []).filter(b => b && (!type || b.type === type));
    function* handCraft(name, times = 1) {   // a recipe from the Q list (Zrób młotek, Zrób leśne legowisko, Skręć linę...)
        let made = 0;
        for (let i = 0; i < times; i++) {
            yield* closeMenus();
            yield* waitFree();
            const before = totalItems();
            let ok = false;
            if (name === "Zrób młotek") { yield* press("pageup"); ok = yield* choose(name); }
            else if (yield* openGround("Wytwórz...")) { yield* wait(6); ok = yield* choose(name); }
            if (!ok) { yield* closeMenus(); say("nie ma przepisu: " + name); break; }
            yield* wait(10);
            yield* waitFree(60 * 30);
            yield* closeMenus();
            if (totalItems() !== before) made++;
        }
        say(name + " x" + made);
        return made;
    }
    function* craft(type, name, times = 1) {   // at a station: its menu, the recipe by name
        const b = myBuildings(type).filter(b => !b.site)[0];
        if (!b) { say("nie ma budynku: " + type); return 0; }
        let made = 0;
        for (let i = 0; i < times; i++) {
            yield* reflexes();
            if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) { say("nie dojdzie do " + type); break; }
            const before = totalItems();
            yield* press("ok");
            if (!(yield* choose(name))) { say("nie ma w menu: " + name + " (" + entryNames().join(", ") + ")"); yield* closeMenus(); break; }
            yield* wait(10);
            yield* waitFree(60 * 30);
            yield* closeMenus();
            if (totalItems() !== before) made++; else break;
        }
        say(name + " x" + made);
        return made;
    }
    // put a building near (nx, ny): the Q list, the cursor moved by the arrows, OK (he walks there), then the hammer until it stands
    function* build(type, nx, ny, instant) {
        const def = Farming.BUILDINGS[type];
        if (!def) return false;
        if ($gameMap.mapId() !== HOME_MAP) { say("nie buduje poza domem (mapa " + $gameMap.mapId() + ")"); return false; }
        const old = !instant && myBuildings(type).find(b => b.site);
        if (old) return yield* finishSite(old);
        const miss = Farming.missingMaterials(type);
        if (miss.length) { say("brak materiałów na " + def.name + ": " + JSON.stringify(miss)); return false; }
        nx = nx === undefined ? P().x : nx; ny = ny === undefined ? P().y : ny;
        const rows = def.h || 1;
        let spot = null;
        const f = field(P().x, P().y);
        for (let r = 0; r <= 16 && !spot; r++) for (let y = ny - r; y <= ny + r && !spot; y++) for (let x = nx - r; x <= nx + r && !spot; x++) {
            if (Math.max(Math.abs(x - nx), Math.abs(y - ny)) !== r) continue;
            if (inZone(x, y) || inZone(x, y + 2) || AP.nearDanger(x, y)) continue;   // (a boar about home: put it a bit further away, not give up)
            if (Farming.whyNotBuild(type, x, y, false, false)) continue;
            // a free tile to stand on two below the footprint, and room around the site to swing the hammer
            if (!isFinite(f.at(x, y + 2)) || !isFinite(f.at(x, y + 1))) continue;
            spot = { x, y };
        }
        if (!spot) { say("nie ma miejsca na " + def.name); return false; }
        say("stawia " + def.name + " na " + spot.x + "," + spot.y);
        if (!(yield* walkTo(spot.x, spot.y + 2))) { say("nie doszedł na miejsce"); return false; }
        P().setDirection(8);
        yield* wait(4);
        if (instant) {
            if (!(yield* openGround("Postaw..."))) { yield* closeMenus(); say("nie ma 'Postaw...'"); return false; }
            yield* wait(6);
            if (!(yield* choose(def.name))) { yield* closeMenus(); say("nie ma w 'Postaw...': " + def.name); return false; }
        } else {
            yield* press("pageup");
            if (!(yield* choose(def.name))) { yield* closeMenus(); say("nie ma w menu budowy: " + def.name); return false; }
        }
        let n = 0;
        while (!$gameTemp._buildMode && n++ < 60) yield;
        yield* wait(8);
        const mode = $gameTemp._buildMode;
        if (!mode) { say("tryb stawiania się nie włączył"); return false; }
        for (let g = 0; g < 30 && (mode.x !== spot.x || mode.y !== spot.y); g++) {
            yield* press(mode.x < spot.x ? "right" : mode.x > spot.x ? "left" : mode.y < spot.y ? "down" : "up");
            yield* wait(2);
        }
        yield* press("ok");
        n = 0;
        while ($gameTemp._buildMode && n++ < 60 * 20) yield;
        yield* waitFree();
        const b = Farming.buildingAt(spot.x, spot.y);
        if (!b) { say("plac budowy nie powstał"); return false; }
        if (!b.site) { say("stoi: " + def.name); return true; }
        const tiles = Farming.tilesOfBuilding(b.type, b.x, b.y);
        const ok = yield* holdOn(tiles, () => { const c = Farming.buildingAt(spot.x, spot.y); return !!c && !c.site; }, def.name, true);
        say(ok ? "zbudowane: " + def.name : "nie skończone: " + def.name);
        return ok;
    }

    // ---- the brain: what to make next, what it needs, where to get it
    const built = type => myBuildings(type).some(b => !b.site);
    const HOME = { x: 30, y: 14 };
    function* sleepNight() {
        const b = myBuildings("bedroll").filter(b => !b.site)[0] || myBuildings("tent").filter(b => !b.site)[0];
        if (!b) return false;
        if (threat()) return false;   // (a wolf or a boar after him: no sleep - the danger check deals with it)
        yield* closeMenus();
        if (!AP.pantryDepth) { AP.pantryDepth = 1; try { yield* tendPantry(true); } finally { AP.pantryDepth = 0; } }   // (the night: food into the pantry first)
        // a zone left round a boar's trail does not keep him up: only a boar (not fleeing) within 6 tiles of the bed does
        const boarNear = (window.Hunting && Hunting.animals || []).some(a => a && DANGER[a._kind] && a._kind !== "wolf" && a._hp > 0 && !a._dead && a._mode !== "flee" &&
            Math.hypot(a._realX - b.x, a._realY - b.y) < 6);
        if (!boarNear) AP.zoneFreeUntil = AP.frame + 60 * 40;
        let there;
        try { there = yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true); } finally { AP.zoneFreeUntil = 0; }
        if (!there) { if (boarNear && !AP.saidBoarBed) { AP.saidBoarBed = true; say("przy posłaniu dzik - śpi później"); } return false; }
        AP.saidBoarBed = false;
        yield* press("ok");
        if (!(yield* choose("Prześpij noc"))) { yield* closeMenus(); return false; }
        yield* wait(30);
        yield* waitFree(60 * 20);
        yield* closeMenus();
        say("przespał noc (wytrzymałość " + Math.round(stamina()) + ")");
        return true;
    }
    function* fireUp(b) {
        if (Farming.fireLit(b)) return true;
        if (Farming.rainingHere && Farming.rainingHere()) return false;   // (b.rainOut stays after a rain: not a reason)
        // what it takes: the fuel (a log, else a branch) and, the fire being out, the kindling (a cone, else one more branch)
        const needBranches = () => (count(61) > 0 ? 0 : 1) + (Farming.fireLit(b) || count(147) > 0 ? 0 : 1);
        if (count(77) < needBranches()) {
            say("brakuje na ogień - zbiera gałęzie i szyszki");
            yield* collect({ 77: needBranches() + 1, 147: 1 }, 6);
        }
        if (count(77) < needBranches()) { say("nie ma czym rozpalić ognia"); return false; }
        const fuel = count(61) > 0 ? "Dorzuć drewna" : "Dorzuć gałąź";
        if (!(yield* useEntry(b, fuel))) { say("nie udało się dorzucić do ognia"); return false; }
        say("dorzucił do ogniska: " + (fuel === "Dorzuć drewna" ? "drewno" : "gałąź"));
        return Farming.fireLit(b);
    }
    // raw rabbit on the fire: he sits with it on a stick until it is done (walking off would drop it)
    function* cookMeat() {
        const b = myBuildings("campfire").filter(b => !b.site)[0];
        if (!b || !count(94) || b.job) return;
        if (!(yield* fireUp(b))) return;
        if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) return;
        const raw0 = count(94), roast0 = count(95);
        yield* press("ok");
        if (!(yield* choose("Upiecz mięso zająca"))) { yield* closeMenus(); return; }
        say("piecze zająca");
        yield* wait(30);
        let n = 0;
        while ((working() || (b.job && !Farming.jobReady(b))) && n++ < 60 * 120) yield;
        yield* wait(10);
        yield* closeMenus();
        if (b.job && Farming.jobReady(b)) yield* collectJob(b);
        if (count(95) > roast0) say("upiekł zająca (+" + (count(95) - roast0) + ")");
        else if (count(94) < raw0) say("zając na ogniu");
    }
    function* restAt(type, entry, to) {
        const b = myBuildings(type).filter(b => !b.site)[0];
        if (!b) return false;
        if (type === "campfire" && !(yield* fireUp(b))) return false;
        const s0 = stamina();
        for (let i = 0; i < 8 && stamina() < to; i++) {
            if (type === "campfire" && !Farming.fireLit(b) && !(yield* fireUp(b))) break;   // (gone out meanwhile: fed again)
            if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) break;
            const before = stamina();
            yield* press("ok");
            if (!(yield* choose(entry))) { yield* closeMenus(); break; }
            yield* wait(20);
            yield* waitFree(60 * 40);   // (he rests on till full - or till the fire goes out: then it is fed and he sits again)
            yield* closeMenus();
            if (stamina() <= before) break;   // (nothing happened)
        }
        if (stamina() > s0) say((type === "bench" ? "odpoczął na ławce" : type === "shelter" ? "odpoczął pod wiatą" : "odpoczął przy ognisku") + " (" + Math.round(s0) + " -> " + Math.round(stamina()) + ")");
        return stamina() >= to;
    }
    function* restFast(to) {
        if (AP.restDepth > 0) return false;   // (already resting further up the chain)
        AP.restDepth = 1;
        try { return yield* restFastInner(to); } finally { AP.restDepth = 0; AP.feedDepth = 0; }
    }
    function* restFastInner(to) {
        if (needsCapped()) yield* feedUp();   // (eat and drink first: then the rest brings more back)
        if (needsCapped() && needsLimit() - stamina() < 30) { say("odpoczynek da mało (limit " + needsLimit() + " przez głód/pragnienie) - najpierw jedzenie i woda"); return false; }
        to = Math.min(to || AP.restTo, staminaCap());
        if ((hour() >= 20 || hour() < 4.5) && (built("bedroll") || built("tent")) && (yield* sleepNight())) return true;
        if (yield* restAt("shelter", "Usiądź i odpocznij", to)) return true;
        if (stamina() < to && (yield* restAt("campfire", "Odpocznij przy ogniu", to))) return true;
        if (stamina() < to && (yield* restAt("bench", "Usiądź i odpocznij", to))) return true;
        if (stamina() < to) return yield* rest(to);
        return true;
    }
    AP.restFast = restFast;
    function* nightCheck() {
        const h = hour();
        if (!(h >= 20 || h < 4.5)) return false;
        if (built("bedroll") || built("tent")) return yield* sleepNight();
        if (stamina() < 60) yield* restFast(95);
        return false;
    }
    function* keepFood() {
        if (!(window.Needs && Needs.enabled && Needs.enabled())) return;
        const fruit = count(102) + count(139) + count(140);
        if (fruit < 3) yield* collect({ 102: count(102) + 4 }, 3);
    }
    const tagged = (e, tag) => evTag(e) === tag && !gone(e);
    const stumpOf = e => !AP.bad.has(badKey(e)) && (ChoppableTree.isTree(e) && !gone(e) && $gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "A"]) && !$gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "B"])) || tagged(e, "Stump");
    function costTo(pred) {
        const f = field(P().x, P().y);
        let best = Infinity;
        for (const e of $gameMap.events()) if (pred(e)) { const s = spotsFor([[e.x, e.y]], f)[0]; if (s && s.c < best) best = s.c; }
        return best;
    }
    function* woodStep() {   // the cheapest wood first: a log, a stump (shovel), then a standing tree
        if (!count(60) && !count(115)) { say("nie ma siekiery"); return false; }
        const b = bestWood(true);
        if (b && b.log) return yield* harvest("Log", 1, b.e);
        if (AP.useStumps && count(62) > 0 && costTo(stumpOf) < 35) {   // (off: 20 stamina a stump and no wood seen)
            const e = nearestEvent(stumpOf);
            const w0 = totalItems();
            const ok = yield* holdOn([[e.x, e.y]], () => !stumpOf(e), "pniak " + e.eventId());
            if (totalItems() <= w0) AP.bad.add(badKey(e));
            say("pniak " + (ok ? "wykopany" : "nie"));
            return ok;
        }
        if (!b) { say("nie ma drzew"); return false; }
        return yield* chopThis(b.e);
    }
    function* digSoil() {
        const before = count(78);
        if (!(yield* openGround("Wykop ziemię"))) { yield* closeMenus(); return false; }
        yield* wait(10);
        yield* waitFree(60 * 20);
        yield* closeMenus();
        say("+" + (count(78) - before) + " ziemi");
        return count(78) > before;
    }
    const GROUND = [77, 64, 92, 102];
    const FORGED = {
        119: ["Wykuj głowicę siekiery", { 86: 3 }], 120: ["Wykuj grot kilofa", { 86: 3 }], 117: ["Wykuj ostrze piły", { 86: 2 }],
        138: ["Wykuj wiadro", { 86: 1, 80: 3 }]
    };
    function* obtain(need) {
        for (let guard = 0; guard < 300; guard++) {
            const short = Object.entries(need).map(([id, n]) => [+id, n]).filter(([id, n]) => count(id) < n);
            if (!short.length) return true;
            yield* reflexes();
            yield* nightCheck();
            if (yield* fromStockpile(short)) continue;   // (what the dog brought: first)
            const ground = {};
            for (const [id, n] of short) if (GROUND.includes(id)) ground[id] = n;
            if (Object.keys(ground).length) {
                if ((yield* collect(ground, 6)) > 0) continue;
                if (ground[64] && count(63) > 0 && (yield* harvest("Rock", 1))) continue;
                say("nie ma skąd wziąć: " + Object.keys(ground).map(id => $dataItems[id].name).join(", "));
                return false;
            }
            const [id] = short[0];
            if (id === 61) { if (!(yield* woodStep())) return false; continue; }
            if (id === 80) {
                if (!built("sawmill")) return false;
                if (count(61) < 3) { if (!(yield* woodStep())) return false; continue; }
                if (!(yield* craft("sawmill", count(118) > 0 ? "Piłuj deski piłą" : "Piłuj deski"))) return false;   // (the saw: 3 planks, half the time)
                continue;
            }
            if (id === 78) { if (!count(62) || !(yield* digSoil())) return false; continue; }
            if (id === 93) {
                if (count(92) < 4 && !(yield* obtain({ 92: 4 }))) return false;
                if (!(yield* handCraft("Skręć linę"))) return false;
                continue;
            }
            if (id === 84) {
                const bw = myBuildings("brickworks").find(b => !b.site);
                if (!bw) return false;
                if (bw.job) {
                    if (Farming.jobReady(bw)) { yield* collectJob(bw); continue; }
                    say("cegły się wypalają (" + Math.round(Farming.jobHoursLeft ? Farming.jobHoursLeft(bw) : 0) + " godz.)");
                    return false;   // (the other goals meanwhile)
                }
                if (!(yield* obtain({ 64: 3, 78: 3 }))) return false;
                yield* craft("brickworks", "Wypal cegły");
                return false;
            }
            if (id === 79) {   // charcoal: the kiln burns it from wood and soil (a job of some hours)
                const k = myBuildings("kiln").find(b => !b.site);
                if (!k) return false;
                if (k.job) {
                    if (Farming.jobReady(k)) { yield* collectJob(k); continue; }
                    say("piec zajęty (" + Math.round(Farming.jobHoursLeft ? Farming.jobHoursLeft(k) : 0) + " godz.)");
                    return false;
                }
                if (!(yield* obtain({ 61: 6, 78: 2 }))) return false;
                yield* craft("kiln", "Wypal węgiel drzewny");
                return false;
            }
            if (id === 85) {   // iron ore: a vein broken with the pickaxe
                if (!count(63) && !count(116)) { say("bez kilofa nie ma rudy"); return false; }
                if (!(yield* mineOre())) return false;
                continue;
            }
            if (id === 86) {   // iron: the forge smelts it from ore and charcoal (a job)
                const fg = myBuildings("forge").find(b => !b.site);
                if (!fg) return false;
                if (fg.job) {
                    if (Farming.jobReady(fg)) { yield* collectJob(fg); continue; }
                    say("żelazo się wytapia (" + Math.round(Farming.jobHoursLeft ? Farming.jobHoursLeft(fg) : 0) + " godz.)");
                    return false;
                }
                if (!(yield* obtain({ 85: 2, 79: 2 }))) return false;
                yield* craft("forge", "Wytop żelazo");
                return false;
            }
            if (FORGED[id]) {   // forged at the forge from iron: the heads of the iron tools, the saw blade, the bucket
                if (!built("forge")) return false;
                const [recipe, inputs] = FORGED[id];
                if (!(yield* obtain(inputs))) return false;
                if (!(yield* craft("forge", recipe))) return false;
                continue;
            }
            if (id === 88) {   // nails: forged from iron, ten at a time
                if (!built("forge")) return false;
                if (count(86) < 1 && !(yield* obtain({ 86: 1 }))) return false;
                if (!(yield* craft("forge", "Wykuj gwoździe"))) return false;
                continue;
            }
            say("nie wiem, skąd wziąć: " + $dataItems[id].name);
            return false;
        }
        return false;
    }
    // an iron ore vein ("!$Rock_Ore_Iron...") broken with the pickaxe
    const oreRock = e => !!e.event() && (e.event().pages || []).some(pg => pg.image && /Rock_Ore_Iron/.test(pg.image.characterName || "")) &&
        !$gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "A"]) && !!e.page() && !AP.bad.has(badKey(e)) && /Rock_Ore/.test(e.characterName() || e.page().image.characterName || "");
    function* mineOre() {
        const e = nearestEvent(oreRock);
        if (!e) { say("nie ma rudy żelaza w zasięgu"); return false; }
        const before = count(85), page = e._pageIndex;
        const ok = yield* holdOn([[e.x, e.y]], () => e._pageIndex !== page || $gameSelfSwitches.value([$gameMap.mapId(), e.eventId(), "A"]), "ruda " + e.eventId());
        if (count(85) <= before) AP.bad.add(badKey(e));
        say("ruda żelaza: +" + (count(85) - before));
        return count(85) > before || ok;
    }
    // the stockpile (the dog's finds): what is short is taken from it - he walks there and takes it out
    function* fromStockpile(short) {
        const sp = myBuildings("stockpile").find(b => !b.site);
        if (!sp || !sp.store) return false;
        const take = short.map(([id, n]) => [id, Math.min(n - count(id), sp.store["i" + id] || 0)]).filter(([id, n]) => n > 0);
        if (!take.length) return false;
        if (!(yield* goFace(Farming.tilesOfBuilding(sp.type, sp.x, sp.y), null, true))) return false;
        const got = [];
        for (const [id, n] of take) { const m = Farming.takeFromChest(sp, $dataItems[id], n); if (m > 0) got.push($dataItems[id].name + " ×" + m); }
        if (got.length) { say("wziął ze składowiska: " + got.join(", ")); yield* wait(20); }
        return got.length > 0;
    }
    function wellSite() {
        const w = AP.wellSite;
        const okWhy = why => !why || /dół/.test(why);   // (everything but the missing pit is fine there)
        if (w && w.map === $gameMap.mapId() && okWhy(Farming.whyNotBuild("well", w.x, w.y, false, false))) return w;
        const f = field(P().x, P().y);
        let best = null;
        for (let y = HOME.y - 10; y <= HOME.y + 10; y++) for (let x = HOME.x - 10; x <= HOME.x + 10; x++) {
            if (!okWhy(Farming.whyNotBuild("well", x, y, false, false))) continue;
            const tiles = Farming.tilesOfBuilding("well", x, y);
            if (!tiles.every(t => { const pl = Farming.plotAt(t.x, t.y); return pl && !pl.crop && (pl.s === "cleared" || pl.s === "raked") && !Farming.gatherAt(t.x, t.y) && !inZone(t.x, t.y) && !(window.Puddles && Puddles.wetAt(t.x, t.y)); })) continue;
            if (![0, 1].every(k => isFinite(f.at(x + k, y + 1)) && isFinite(f.at(x + k, y + 2)))) continue;   // (room to stand below it)
            const d = Math.hypot(x - HOME.x, y - HOME.y) - (tiles.reduce((t, c) => t + ((Farming.plotAt(c.x, c.y) || {}).dug || 0), 0));   // (a pit begun: that one)
            if (!best || d < best.d) best = { x, y, d };
        }
        AP.wellSite = best ? { x: best.x, y: best.y, map: $gameMap.mapId() } : null;
        return AP.wellSite;
    }
    function* buildWell() {
        if (!count(62)) { say("bez łopaty nie wykopie dołu na studnię"); return false; }
        const site = wellSite();
        if (!site) { say("nie ma miejsca na studnię"); return false; }
        const tiles = Farming.tilesOfBuilding("well", site.x, site.y);
        if (!tiles.every(t => ((Farming.plotAt(t.x, t.y) || {}).dug || 0) >= 3)) say("kopie dół na studnię (" + site.x + "," + site.y + ")");
        for (let n = 0; n < 24; n++) {
            const t = tiles.find(t => ((Farming.plotAt(t.x, t.y) || {}).dug || 0) < 3);
            if (!t) break;
            if (stamina() < 12) { yield* restFast(90); if (stamina() < 12) return false; }
            const d0 = (Farming.plotAt(t.x, t.y) || {}).dug || 0;
            yield* groundAction(t.x, t.y, "Wykop ziemię");
            if (((Farming.plotAt(t.x, t.y) || {}).dug || 0) <= d0) { say("nie da się kopać na " + t.x + "," + t.y); AP.wellSite = null; return false; }
        }
        if (!tiles.every(t => ((Farming.plotAt(t.x, t.y) || {}).dug || 0) >= 3)) return false;
        say("dół na studnię gotowy");
        yield* walkTo(site.x, site.y + 2);   // (off the pit: standing in it he is "something there" for the well)
        return yield* build("well", site.x, site.y);
    }
    // a drink at the well: clean water, as much as he likes
    function* drinkWell() {
        const b = myBuildings("well").find(b => !b.site);
        if (!b || !window.Needs || $gameMap.mapId() !== HOME_MAP) return false;
        const w0 = Needs.state().water;
        for (let n = 0; n < 4 && Needs.state().water < 90; n++) {
            if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) break;
            const w1 = Needs.state().water;
            yield* press("ok");
            if (!(yield* choose("Napij się"))) { yield* closeMenus(); break; }
            yield* wait(20); yield* waitFree(); yield* closeMenus();
            if (Needs.state().water <= w1) break;
        }
        if (Needs.state().water > w0) { say("napił się ze studni (" + Math.round(Needs.state().water) + ")"); return true; }
        return false;
    }
    AP.drinkWell = drinkWell; AP.buildWell = buildWell;
    const costOf = type => { const o = {}; for (const [id, n] of (Farming.BUILDINGS[type] || {}).cost || []) o[id] = (o[id] || 0) + n; return o; };
    const B = (n, type, dx, dy) => ({ n, done: () => built(type), get need() { return costOf(type); }, run: () => build(type, HOME.x + dx, HOME.y + dy) });
    const PLAN = [
        { n: "Młotek", done: () => count(89) > 0, need: { 77: 5, 64: 2, 92: 3 }, run: () => handCraft("Zrób młotek") },
        B("Warsztat", "workbench", 0, 0),
        { n: "Kamienna siekiera", done: () => count(60) > 0, need: { 77: 5, 64: 2, 92: 3 }, run: () => craft("workbench", "Zrób kamienną siekierę") },
        { n: "Leśne legowisko", done: () => built("bedroll"), need: { 77: 10, 92: 10 }, run: function* () { if (!count(128)) yield* handCraft("Zrób leśne legowisko"); return yield* build("bedroll", HOME.x - 4, HOME.y - 1, true); } },
        { n: "Kamienna łopata", done: () => count(62) > 0, need: { 61: 2, 77: 1, 64: 2 }, run: () => craft("workbench", "Zrób kamienną łopatę") },
        B("Ognisko", "campfire", -2, 3),
        B("Składowisko", "stockpile", 3, 4),   // (the dog brings its finds here; it is a chest too)
        // (the kiln early: it fires the clay pots - the water after rain)
        B("Piec ziemny", "kiln", 9, 3),
        { n: "Oszczep", done: () => count(154) > 0, need: { 61: 1, 64: 2, 93: 1 }, run: function* () { const ok = yield* craft("workbench", "Zrób oszczep"); if (count(154) > 0) $gameSystem._combatHand = "m154"; return ok; } },
        { n: "Kamienny kilof", done: () => count(63) > 0, need: { 61: 2, 77: 3, 64: 3 }, run: () => craft("workbench", "Zrób kamienny kilof") },
        { n: "Nóż kamienny", done: () => count(90) > 0 || count(91) > 0, need: { 61: 1, 64: 2, 77: 1 }, run: () => craft("workbench", "Zrób nóż kamienny") },
        B("Tartak", "sawmill", 5, 3),
        B("Buda", "doghouse", -3, -2),
        B("Ławka", "bench", -1, 1),
        B("Mała skrzynia", "chest_s", 3, -1),
        B("Wiata", "shelter", -7, 2),
        B("Kompostownik", "compost", 6, -1),
        B("Strach na wróble", "scarecrow", -5, 5),
        B("Cegielnia", "brickworks", 9, 7),
        { n: "Grabie", done: () => count(65) > 0, need: { 61: 1, 77: 4 }, run: () => craft("workbench", "Zrób grabie") },
        { n: "Motyka", done: () => count(66) > 0, need: { 61: 1, 77: 1, 64: 3 }, run: () => craft("workbench", "Zrób motykę") },
        { n: "Druga pułapka", done: () => myBuildings("snare").filter(b => !b.site).length >= 2, need: { 77: 4, 93: 2, 64: 1 },
            run: () => { const s0 = myBuildings("snare").find(b => !b.site); return build("snare", s0 ? s0.x + 6 : HOME.x - 4, s0 ? s0.y + 3 : HOME.y + 7); } },
        B("Ul", "hive", -6, -2),
        B("Pułapka", "snare", -8, 6),
        B("Spiżarnia", "pantry", 1, -4),
        B("Garbarnia", "tannery", -5, 8),
        B("Kuźnia", "forge", 13, 3),
        // the well: water for good (the bucket for it is forged; the pit under it dug with the shovel)
        { n: "Studnia", done: () => built("well"), get need() { return costOf("well"); }, run: buildWell },
        // iron tools: a third fewer blows, a little less strength a blow; the saw: 3 planks out of 3 wood, in half the time
        { n: "Żelazna siekiera", done: () => count(115) > 0, need: { 119: 1, 80: 1 }, run: () => craft("workbench", "Zmontuj żelazną siekierę") },
        { n: "Żelazny kilof", done: () => count(116) > 0, need: { 120: 1, 80: 1 }, run: () => craft("workbench", "Zmontuj żelazny kilof") },
        { n: "Piła", done: () => count(118) > 0, need: { 117: 1, 61: 2, 93: 1 }, run: () => craft("workbench", "Zmontuj piłę") },
        // a bucket to carry water (the first one went into the well): water for the dog's bowl, the cauldron's soups
        { n: "Wiadro", done: () => count(138) > 0 || !built("well"), need: { 138: 1 }, run: function* () { return count(138) > 0; } },
        B("Piekarnia", "bakery", 13, 7),
        B("Kurnik", "coop", -9, 0),
        B("Serowarnia", "dairy", 5, 8),
        B("Owczarnia", "pen", 2, 10)
    ];
    AP.PLAN = PLAN;
    function* collectJob(b) {
        if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) return false;
        const before = totalItems();
        yield* press("ok");
        const ok = yield* choose("Zbierz:");
        yield* wait(10);
        yield* closeMenus();
        if (totalItems() > before) say("odebrał z: " + Farming.BUILDINGS[b.type].name + " (+" + (totalItems() - before) + ")");
        return ok;
    }
    function* collectJobs() {
        for (const b of myBuildings().filter(b => !b.site && b.job && Farming.jobReady(b))) yield* collectJob(b);
    }
    // looking after what stands: a snare gets bait (berries only while there are 3+, they are his water too) and gives up its
    // rabbit; whatever a building has made (honey, compost...) is taken
    function* useEntry(b, name) {
        if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) return false;
        const before = totalItems();
        yield* press("ok");
        const ok = yield* choose(name);
        yield* wait(30);
        yield* waitFree(240);
        yield* closeMenus();
        return ok && totalItems() !== before;
    }
    function* tend() {
        for (const b of myBuildings().filter(b => !b.site)) {
            const def = Farming.BUILDINGS[b.type];
            if (!def) continue;
            if (def.lure) {
                const knife = count(90) > 0 || count(91) > 0;
                if (Farming.snareSprung(b) && knife && (yield* useEntry(b, "Zbierz:"))) {
                    say("wyjął zająca z pułapki");
                    for (const it of $dataItems.filter(i => i && i.meta && i.meta.Butcher && $gameParty.numItems(i) > 0)) {
                        while ($gameParty.numItems(it) > 0) {
                            const n0 = $gameParty.numItems(it);
                            $gameParty.leader().useItem(it);
                            if ($gameParty.numItems(it) >= n0) break;
                            say("oprawił: " + it.name);
                            yield* wait(30);
                        }
                    }
                }
                const bait = def.lure.baits.find(i => count(i) > (i === 102 ? 2 : 0));
                if (!Farming.snareBait(b) && !Farming.snareSprung(b) && bait && (yield* useEntry(b, "Załóż przynętę"))) say("założył przynętę: " + $dataItems[bait].name);
            } else if (def.produce && Farming.readyProduce(b) > 0) {
                if (yield* useEntry(b, "Zbierz:")) say("zebrał z: " + def.name);
            }
        }
    }
    // a tool worn below 30%: its "Napraw: ..." at the workbench (the materials fetched first), before it breaks
    function* maintainTools() {
        if (!window.Durability || !Durability.enabled || !Durability.enabled() || !built("workbench")) return;
        for (const r of Durability.repairRecipes()) {
            const id = r.repair, life = Durability.lifeOf(id), left = Durability.left(id);
            if (!(life > 0) || left > life * 0.3) continue;
            say($dataItems[id].name + ": zostało " + left + " z " + life + " - naprawa");
            const need = {};
            for (const [i, n] of r.inputs) need[i] = (need[i] || 0) + n;
            if (!(yield* obtain(need))) { say("brak materiałów na naprawę: " + $dataItems[id].name); continue; }
            if (yield* craft("workbench", r.name)) say("naprawione: " + $dataItems[id].name + " (" + Durability.left(id) + "/" + Durability.lifeOf(id) + ")");
        }
    }
    const MULTI = ["fence", "chest_s", "chest_l", "hive", "snare", "scarecrow"];
    function* finishSite(b) {
        const tiles = Farming.tilesOfBuilding(b.type, b.x, b.y);
        const def = Farming.BUILDINGS[b.type];
        say("dokańcza plac: " + def.name + " (" + b.site.done + "/" + b.site.need + ")");
        const ok = yield* holdOn(tiles, () => { const c = Farming.buildingAt(b.x, b.y); return !c || !c.site; }, def.name, true);
        say(ok ? "zbudowane: " + def.name : "nie skończone: " + def.name);
        return ok;
    }
    function* cancelSite(b) {
        const def = Farming.BUILDINGS[b.type];
        if (!(yield* goFace(Farming.tilesOfBuilding(b.type, b.x, b.y), null, true))) return false;
        yield* press("ok");
        let n = 0;
        while (!menuOpen() && n++ < 40) yield;
        const names = entryNames();
        const pick = names.find(x => x === "Zrezygnuj" || x === "Rozbierz plac budowy");
        const ok = pick ? yield* choose(pick) : false;
        yield* wait(10);
        yield* closeMenus();
        say((ok ? "rozebrał zbędny plac: " : "nie rozebrał placu: ") + def.name);
        return ok;
    }
    function* tidySites() {
        const seen = {};
        for (const b of myBuildings().filter(b => b.site)) {
            if (!MULTI.includes(b.type) && (seen[b.type] || built(b.type))) yield* cancelSite(b);
            else seen[b.type] = b;
        }
        for (const type in seen) {
            const b = seen[type], c = Farming.buildingAt(b.x, b.y);
            if (c && c.site) yield* finishSite(c);
        }
    }
    // levels: the attribute points go 2 to Siła (fewer blows) and 1 to Zręczność (faster work); the skill points to the work skills
    const SKILL_ORDER = ["g_chop", "s_tough", "b_hits", "g_chop", "s_tough", "b_hits", "g_chop", "s_tough", "b_hits", "g_wood", "g_cost", "g_wood", "g_cost",
        "s_food", "s_sleep", "s_sleep", "s_water", "g_mine", "g_mine", "g_mine", "b_cost", "b_cost", "g_forage", "g_forage", "c_fast", "c_fast", "c_fast"];
    function levelUp() {
        if (!window.Combat || !Combat.hero) return;
        const h = Combat.hero(), notice = (t, c) => { if ($gameTemp.pushTopNotice) $gameTemp.pushTopNotice(t, c || "#ffe070"); };
        if (h.points > 0) {
            const add = { str: 0, dex: 0 };
            for (let i = 0; i < h.points; i++) add[i % 3 === 2 ? "dex" : "str"]++;
            const n = h.points;
            if (Combat.spendPoints(add)) {
                const txt = "Punkty atrybutów (" + n + "): Siła +" + add.str + (add.dex ? ", Zręczność +" + add.dex : "");
                say(txt); notice(txt);
            }
        }
        for (let guard = 0; h.skillPoints > 0 && guard < 10; guard++) {
            const seen = {}, id = (SKILL_ORDER.map(id => [id, (seen[id] = (seen[id] || 0) + 1)]).find(([id, r]) => Combat.skillRank(id) < r && !Combat.skillBlock(id)) || [])[0];
            if (!id || !Combat.learnSkill(id)) break;
            const sk = Combat.SKILLS.find(s => s.id === id);
            const txt = "Nowa umiejętność: " + sk.name + (sk.ranks > 1 ? " (" + Combat.skillRank(id) + "/" + sk.ranks + ")" : "");
            say(txt); notice(txt, "#9ff0a8");
        }
    }
    AP.levelUp = levelUp;
    // water from clay (Puddles.js + Farming's pottery): after rain dig wet clay out of the puddles (shovel), shape pots at the workbench (3
    // clay), dry them under the Wiata's roof (else on the ground by home), fire them in the earth kiln and set them down by home to catch
    // the rain - until POTS_WANTED stand there
    const POTS_WANTED = 4;   // (the shelter's table holds four, the kiln fires four at once)
    const tablePots = () => myBuildings("shelter").reduce((n, b) => n + (b.pots || []).length, 0);
    const kilnPots = () => myBuildings("kiln").reduce((n, b) => n + (b.job && b.job.out && b.job.out[0] === 167 ? b.job.out[1] : 0), 0);
    const potsInPlay = () => myBuildings("clay_pot").length + myBuildings("pot").length + tablePots() + kilnPots() + count(165) + count(166) + count(167);
    function* digClayPuddle() {
        if (!window.Puddles || !count(62)) return false;
        const f = field(P().x, P().y);
        let best = null;
        for (const h of Puddles.hollows()) {
            if (Puddles.clayLeft(h) <= 0 || !(Puddles.fillOf(h) > 0) || AP.nearDanger(h.cx, h.cy) || inZone(h.cx, h.cy)) continue;
            for (const [x, y] of h.tiles) {
                if (!Puddles.wetAt(x, y)) continue;
                const sp = spotsFor([[x, y]], f)[0];
                if (sp && (!best || sp.c < best.sp.c)) best = { x, y, sp };
            }
        }
        if (!best) return false;
        const before = count(164);
        if (!(yield* goFace([[best.x, best.y]], f))) return false;
        yield* press("ok");
        yield* wait(8);
        if (!menuOpen()) { yield* waitFree(120); yield* press("ok"); }   // (a stone or a herb lying in the water was taken first)
        if (!(yield* choose("Wykop glinę"))) { yield* closeMenus(); return false; }
        yield* wait(20);
        yield* waitFree(240);
        yield* closeMenus();
        if (count(164) > before) say("wykopał glinę z kałuży (+" + (count(164) - before) + ")");
        return count(164) > before;
    }
    function* pottery() {
        if (!built("workbench") || !window.Puddles) return;
        // 1. clay, while puddles stand after rain
        const want = () => Math.max(0, POTS_WANTED - potsInPlay());
        for (let i = 0; i < 6 && want() > 0 && count(164) < want() * 3; i++) if (!(yield* digClayPuddle())) break;
        // 2. pots shaped at the workbench
        for (let i = 0; i < 4 && count(164) >= 3 && count(165) + myBuildings("pot").length + tablePots() < POTS_WANTED; i++) {
            if (!(yield* craft("workbench", "Ulep garnek"))) break;
        }
        // 3. drying: on the shelter's table (rain or not), else on the ground by home
        for (let i = 0; i < 4 && count(165) > 0; i++) {
            const sh = myBuildings("shelter").find(b => !b.site && (b.pots || []).length < Farming.BUILDINGS.shelter.table.slots);
            if (sh) { if (!(yield* useEntry(sh, "Postaw garnek na stole"))) break; say("postawił garnek na stole pod wiatą"); }
            else { if (!(yield* build("pot", HOME.x + 2 + i, HOME.y + 5, true))) break; say("postawił garnek do suszenia"); }
        }
        // 4. the dried ones taken
        for (const b of myBuildings("pot").filter(b => Farming.potDryness(b) >= 1)) if (yield* useEntry(b, "Zabierz wysuszony garnek")) say("zabrał wysuszony garnek");
        for (const sh of myBuildings("shelter").filter(b => !b.site)) {
            for (let i = 0; i < 4 && (sh.pots || []).some(p => Farming.tablePotDry(sh, p)); i++) if (!(yield* useEntry(sh, "Zabierz wysuszony garnek"))) break;
        }
        // 5. fired in the earth kiln (four at once when there are four)
        // (four at once when there are four; single ones only when no more are drying or coming - the kiln does not wait for nothing)
        const coming = count(165) + myBuildings("pot").length + tablePots() + (count(164) >= 3 ? 1 : 0);
        const kiln = myBuildings("kiln").find(b => !b.site && !b.job);
        if (kiln && (count(166) >= 4 || (count(166) > 0 && coming === 0))) {
            const four = count(166) >= 4, wood = four ? 5 : 2;
            if (count(61) >= wood || (yield* obtain({ 61: wood }))) {
                if (yield* craft("kiln", four ? "Wypal 4 garnki" : "Wypal garnek")) say("wypala garnki w piecu");
            }
        }
        // 6. the fired ones set down by home to catch the rain
        for (let i = 0; i < 4 && count(167) > 0; i++) {
            const k = myBuildings("clay_pot").length;
            if (!(yield* build("clay_pot", HOME.x - 3 + k * 2, HOME.y + 6, true))) break;
            say("postawił gliniany garnek na deszczówkę");
        }
    }
    AP.pottery = pottery;
    const HOME_MAP = 3;
    function* goHome() { return yield* goToMap(HOME_MAP); }
    function* goToMap(target) {
        const HOME_MAP_ = HOME_MAP, HOME_MAP__ = target;
        AP.goingHome = true;
        try {
            for (let tries = 0; tries < 3 && $gameMap.mapId() !== target; tries++) {
                const doors = $gameMap.events().filter(e => { const pg = e.page(); return pg && (pg.trigger === 1 || pg.trigger === 2) && pg.list.some(c => c.code === 201 && c.parameters[0] === 0 && c.parameters[1] === target); });
                if (!doors.length) { say("nie ma przejścia na mapę " + target + " z mapy " + $gameMap.mapId()); return false; }
                const f = field(P().x, P().y);
                let best = null;
                for (const e of doors) { const sp = spotsFor([[e.x, e.y]], f)[0]; if (sp && (!best || sp.c < best.sp.c)) best = { e, sp }; }
                if (!best) { say("nie dojdzie do przejścia do domu"); return false; }
                say(target === HOME_MAP_ ? "jest na innej mapie (" + $gameMap.mapId() + ") - wraca do domu" : "idzie na mapę " + target);
                if (!(yield* goFace([[best.e.x, best.e.y]], f))) continue;
                const e = best.e;
                for (let n = 0; n < 120 && $gameMap.mapId() !== target && !$gamePlayer.isTransferring(); n++) { setMove(keysToward(e.x - P()._realX, e.y - P()._realY)); yield; }
                setMove([]);
                for (let n = 0; n < 400 && ($gamePlayer.isTransferring() || SceneManager.isSceneChanging() || $gameMap.mapId() !== target); n++) yield;
                yield* wait(30);
            }
            const there = $gameMap.mapId() === target;
            say(target === HOME_MAP_ ? (there ? "wrócił do domu" : "nie udało się wrócić do domu") : (there ? "jest na mapie " + target : "nie doszedł na mapę " + target));
            void HOME_MAP__;
            return there;
        } finally { AP.goingHome = false; }
    }
    AP.goToMap = goToMap;
    // ---- survival first: hunger and thirst holding him down stop the building; he eats and drinks what there is, forages this map
    // (fruit, berries, mushrooms, wild potatoes and carrots) and, when home is picked bare, the meadow next door
    const NEAR_MAP = 4;
    const lowNeeds = () => { if (!(window.Needs && Needs.enabled && Needs.enabled())) return false; const n = Needs.state(); return needsCapped() || n.food < 30 || n.water < 30; };
    const FOOD_KINDS = ["berries", "bush", "mushroom", "wildPotato", "wildCarrot"];
    const foodTile = (x, y, k) => k !== "bush" || Farming.bushState(x, y) === "full";   // (a bare bush gives only fibre)
    function* forage(n) {
        const before = totalItems();
        yield* pickFruit();
        const thirsty = window.Needs && Needs.state().water < 40;
        // (thirsty: the watery ones first - berries; hungry: anything)
        if (thirsty) yield* gather(["berries", "bush"], Math.ceil(n / 2), foodTile);
        yield* gather(FOOD_KINDS, n, foodTile);
        const got = totalItems() - before;
        if (got > 0) say("nazbierał jedzenia: +" + got);
        return got;
    }
    function* survive() {
        if (!lowNeeds()) return false;
        AP.surviving = true;
        try {
            const n0 = Needs.state();
            say("głód/pragnienie (jedzenie " + Math.round(n0.food) + ", woda " + Math.round(n0.water) + ") - najpierw przetrwać");
            if (Needs.state().water < 60) yield* drinkWell();   // (the well: water for good - first, whatever else is short)
            yield* feedUp();
            if (!lowNeeds()) return true;
            const got = yield* forage(6);
            yield* feedUp();
            if (!lowNeeds()) return true;
            if (!got && $gameMap.mapId() === HOME_MAP && AP.frame - (AP.tripAt || -1e9) > 60 * 60 * 4) {   // (home picked bare: the meadow)
                AP.tripAt = AP.frame;
                say("w domu nic do zjedzenia - idzie na łąkę");
                AP.onTrip = true;
                try {
                    if (yield* goToMap(NEAR_MAP)) { yield* forage(12); yield* feedUp(); yield* goHome(); }
                } finally { AP.onTrip = false; }
            }
            return true;
        } finally { AP.surviving = false; }
    }
    AP.survive = survive;
    // ---- a small garden: the seeds of the wild potatoes and carrots go into raked and tilled ground by home (in their season);
    // the ripe crops are dug out
    const SEEDS = { 67: "Ziemniaki", 68: "Marchew" };
    const GARDEN = { w: 6, h: 2, reach: 12 };
    // the garden: a 6 x 2 patch of open grass (or of his own plots) near home, the nearest to it - found once, kept in AP.garden
    function gardenOk(x, y) {
        if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXy(x, y).length || Farming.buildingAt(x, y) || Farming.gatherAt(x, y)) return false;
        const pl = Farming.plotAt(x, y);
        if (pl && (pl.crop || pl.s === "raked" || pl.s === "tilled")) return true;   // (already his)
        return !!pl && pl.s === "cleared" && pl.natural && !(window.Puddles && Puddles.wetAt(x, y));
    }
    function gardenTiles() {
        const g = AP.garden;
        const tiles = g => { const out = []; for (let y = g.y; y < g.y + GARDEN.h; y++) for (let x = g.x; x < g.x + GARDEN.w; x++) out.push({ x, y }); return out; };
        if (g && g.map === $gameMap.mapId() && tiles(g).every(t => gardenOk(t.x, t.y))) return tiles(g);
        let best = null;
        for (let y = HOME.y - GARDEN.reach; y <= HOME.y + GARDEN.reach; y++) for (let x = HOME.x - GARDEN.reach; x <= HOME.x + GARDEN.reach; x++) {
            const cand = { x, y };
            if (!tiles(cand).every(t => gardenOk(t.x, t.y)) || ![0, 1, 2, 3, 4, 5].every(k => $gameMap.checkPassage(x + k, y + GARDEN.h, 0x0f))) continue;   // (and a row to stand on below it)
            if (tiles(cand).some(t => inZone(t.x, t.y))) continue;
            const d = Math.hypot(x + 3 - HOME.x, y - HOME.y);
            if (!best || d < best.d) best = { x, y, d };
        }
        if (!best) return [];
        AP.garden = { x: best.x, y: best.y, map: $gameMap.mapId() };
        say("grządka przy domu: " + best.x + "," + best.y);
        return tiles(best);
    }
    // birds eat crops no scarecrow guards (Birds: within 3 tiles of a finished one)
    const guardedTile = (x, y) => window.Birds && Birds.guarded ? Birds.guarded($gameMap.mapId(), x, y) :
        myBuildings("scarecrow").some(b => !b.site && Math.max(Math.abs(b.x - x), Math.abs(b.y - y)) <= 3);
    function* guardGarden(tiles) {
        if (tiles.every(t => guardedTile(t.x, t.y))) return true;
        if (AP.frame < (AP.crowFailUntil || 0) || !count(89)) return false;   // (no hammer: no scarecrow yet)
        const g = AP.garden;
        // a spot in the middle above or below the patch reaches all of it (6 wide: x+2 / x+3 cover x-1..x+5)
        const spots = [[g.x + 2, g.y - 1], [g.x + 3, g.y - 1], [g.x + 2, g.y + GARDEN.h], [g.x + 3, g.y + GARDEN.h]]
            .filter(([x, y]) => tiles.every(t => Math.max(Math.abs(t.x - x), Math.abs(t.y - y)) <= 3) && !Farming.whyNotBuild("scarecrow", x, y, false, false));
        if (!spots.length) { say("nie ma miejsca na stracha przy grządce"); AP.crowFailUntil = AP.frame + 60 * 60 * 3; return false; }
        say("grządka bez stracha - stawia stracha na wróble");
        const need = {};
        for (const [id, n] of Farming.BUILDINGS.scarecrow.cost || []) need[id] = n;
        if (!(yield* obtain(need))) { AP.crowFailUntil = AP.frame + 60 * 60 * 2; return false; }
        const [sx, sy] = spots.find(([x, y]) => !Farming.whyNotBuild("scarecrow", x, y, false, false)) || spots[0];
        yield* build("scarecrow", sx, sy);
        const ok = tiles.every(t => guardedTile(t.x, t.y));
        if (!ok) AP.crowFailUntil = AP.frame + 60 * 60 * 2;
        return ok;
    }
    function* groundAction(x, y, entry) {
        if (!(yield* goFace([[x, y]]))) return false;
        // something lying there (a branch, a stone, flax): the first press only picks it up - then the menu
        for (let k = 0; k < 3 && Farming.gatherAt(x, y); k++) { yield* press("ok"); yield* wait(10); yield* waitFree(120); yield* closeMenus(); }
        yield* press("ok");
        const ok = yield* choose(entry, 20);
        if (ok) { yield* wait(10); yield* waitFree(300); }
        yield* closeMenus();
        return ok;
    }
    function* harvestCrops() {
        if ($gameMap.mapId() !== HOME_MAP) return;
        const plots = (Farming.farm().plots || {})[$gameMap.mapId()] || {};
        for (const k of Object.keys(plots)) {
            const [x, y] = k.split(",").map(Number), pl = plots[k];
            if (!pl || !pl.crop || !Farming.isRipe(x, y, pl)) continue;
            const before = totalItems(), name = Farming.CROPS && Farming.CROPS[pl.crop] ? Farming.CROPS[pl.crop].name : pl.crop;
            if (!(yield* goFace([[x, y]]))) { say("nie dojdzie do grządki " + x + "," + y); continue; }
            const fx = $gameMap.roundXWithDirection(P().x, P().direction()), fy = $gameMap.roundYWithDirection(P().y, P().direction());
            for (let t = 0; t < 2 && totalItems() <= before; t++) {   // (settled first: a press while the last step ends is lost)
                yield* waitFree(60);
                yield* wait(6);
                yield* press("ok");
                yield* wait(20); yield* waitFree(200); yield* closeMenus();
            }
            if (totalItems() > before) say("zebrał plon: " + name);
            else say("nie zebrał " + name + " (stoi " + P().x + "," + P().y + " patrzy na " + fx + "," + fy + ", siły " + Math.round(stamina()) + ")");
        }
    }
    function* plantSeeds() {
        if ($gameMap.mapId() !== HOME_MAP || !count(65) || !count(66) || stamina() < 25) return;
        const season = Farming.seasonIndex ? Farming.seasonIndex($gameSystem.dayNightDay()) : 0;
        const seeds = Object.keys(SEEDS).map(Number).filter(id => count(id) > 0 && Object.values(Farming.CROPS || {}).some(c => c.seed === id && (!c.seasons || c.seasons.includes(season))));
        if (!seeds.length) return;
        const tiles = gardenTiles();
        if (!tiles.length || !(yield* guardGarden(tiles))) return;   // (no scarecrow: the birds would have it)
        let sown = 0;
        for (const t of tiles) {
            if (!seeds.some(id => count(id) > 0) || stamina() < 20 || sown >= 4) break;
            const plot = Farming.plotAt(t.x, t.y);
            if (plot && plot.crop) continue;
            if (Farming.buildingAt(t.x, t.y) || Farming.gatherAt(t.x, t.y) || !$gameMap.checkPassage(t.x, t.y, 0x0f) || $gameMap.eventsXy(t.x, t.y).length) continue;
            // grass -> raked -> tilled -> sown (each is its own entry on the ground menu)
            if (!plot || plot.s === "cleared") { if (!(yield* groundAction(t.x, t.y, "Zagrab ziemię"))) continue; }
            const p2 = Farming.plotAt(t.x, t.y);
            if (p2 && p2.s === "raked") { if (!(yield* groundAction(t.x, t.y, "Zaoraj ziemię"))) continue; }
            const p3 = Farming.plotAt(t.x, t.y);
            if (!p3 || p3.s !== "tilled" || p3.crop) continue;
            const id = seeds.find(q => count(q) > 0);
            if (yield* groundAction(t.x, t.y, "Zasiej: " + SEEDS[id])) { sown++; say("zasiał: " + SEEDS[id]); }
        }
    }
    AP.goHome = goHome;
    // the wild dog: meat thrown to it from a few steps (it keeps away), once an hour, until it trusts him; then to work (a kennel
    // there) - on the hunt instead while meat or hides are short
    const DOG_MEATS = [94, 95, 157, 158, 159, 160, 161, 162, 105, 98, 99, 106];
    const clockH = () => $gameSystem.dayNightDay() * 24 + hour();
    // ---- the dog's bowl at the kennel: food from the bag (what there is plenty of; raw meat first - a dog likes it best) and water
    // carried from the well in the bucket; when the dog runs low or the bowl is empty, at most every 3 game hours
    // (what keeps first: smoked meat and fish, roasted meats, fruit, potatoes and carrots - raw meat rots in the bowl in two days)
    const BOWL_FOOD = [105, 106, 158, 160, 162, 95, 99, 139, 140, 71, 72, 103, 102, 94, 157, 159, 161, 98];
    function* feedDog() {
        if (!window.Dog || !Dog.state().tame || $gameMap.mapId() !== HOME_MAP) return false;
        const k = Dog.kennel && Dog.kennel();
        if (!k || k.site) return false;
        const d = Dog.state(), max = (Farming.BUILDINGS.doghouse || {}).bowl || 3;
        const food = Object.keys(k.store || {}).filter(key => key !== "i122").reduce((t, key) => t + (k.store[key] || 0), 0), water = k.bowlWater || 0;
        const wantFood = food < 2 && (d.food < 50 || food === 0), wantWater = water < max && (d.water < 50 || water === 0);
        if (!wantFood && !wantWater) return false;
        if (AP.frame - (AP.bowlAt || -1e9) < 60 * 60 * 3) return false;
        AP.bowlAt = AP.frame;
        let did = false;
        if (wantFood) {
            // what he can spare: 2-3 pieces of what there is plenty of (4+), the food that keeps first; raw meat when there is nothing else
            const give = [];
            for (const id of BOWL_FOOD) {
                const n = count(id), raw = [94, 157, 159, 161, 98].includes(id), spare = n >= 8 ? 3 : n >= 4 ? 2 : raw ? Math.min(2, n) : 0;
                if (spare > 0) give.push([id, spare]);
                if (give.reduce((t, g) => t + g[1], 0) >= 3) break;
            }
            if (give.length && (yield* goFace(Farming.tilesOfBuilding(k.type, k.x, k.y), null, true))) {
                const put = [];
                for (const [id, n] of give) { const m = Farming.putInChest(k, $dataItems[id], n); if (m > 0) put.push($dataItems[id].name + " ×" + m); }
                if (put.length) { say("do miski psa: " + put.join(", ")); did = true; yield* wait(10); }
            }
        }
        if (wantWater) {
            if ((Farming.bagWater ? Farming.bagWater() : 0) < 1 && count(138) > 0) {   // (the bucket filled at the well first)
                const w = myBuildings("well").find(b => !b.site);
                if (w && (yield* goFace(Farming.tilesOfBuilding(w.type, w.x, w.y), null, true))) {
                    yield* press("ok");
                    if (yield* choose("Napełnij wiadro")) { yield* wait(20); yield* waitFree(); }
                    yield* closeMenus();
                }
            }
            for (let n = 0, refills = 0; n < max * 2 && (k.bowlWater || 0) < max; n++) {
                if ((Farming.bagWater ? Farming.bagWater() : 0) < 1 && !(Needs.skinCharges && Needs.skinCharges() >= 1)) {   // (the bucket empty: to the well again)
                    const w = myBuildings("well").find(b => !b.site);
                    if (!w || !count(138) || refills++ >= 2 || !(yield* goFace(Farming.tilesOfBuilding(w.type, w.x, w.y), null, true))) break;
                    yield* press("ok");
                    if (yield* choose("Napełnij wiadro")) { yield* wait(20); yield* waitFree(); }
                    yield* closeMenus();
                    if ((Farming.bagWater ? Farming.bagWater() : 0) < 1) break;
                }
                if (!(yield* goFace(Farming.tilesOfBuilding(k.type, k.x, k.y), null, true))) break;
                const w0 = k.bowlWater || 0, b0 = (Farming.bagWater ? Farming.bagWater() : 0) + (Needs.skinCharges ? Needs.skinCharges() : 0);
                yield* press("ok");
                if (!(yield* choose("Nalej wody do miski"))) { yield* closeMenus(); break; }
                yield* wait(10); yield* closeMenus();
                // (poured when the bucket or the skin has less - a thirsty dog may be drinking from the bowl at the same time)
                if ((k.bowlWater || 0) <= w0 && (Farming.bagWater ? Farming.bagWater() : 0) + (Needs.skinCharges ? Needs.skinCharges() : 0) >= b0) break;
            }
            if ((k.bowlWater || 0) > water) { say("wody w misce psa: " + k.bowlWater + "/" + max); did = true; }
        }
        return did;
    }
    AP.feedDog = feedDog;
    function* tameDog() {
        if (!window.Dog || $gameMap.mapId() !== HOME_MAP) return;
        const st = Dog.state(), g = Dog.dog;
        if (st.tame) return yield* manageDog();
        if (!g || clockH() - st.fedAt < 1.02) return;
        const meat = DOG_MEATS.find(id => count(id) > 0);
        if (!meat || Math.hypot(g.x - P().x, g.y - P().y) > 35) return;
        say("oswaja psa: rzuca mu mięso (" + (st.trust + 1) + "/3)");
        for (let tries = 0; tries < 5; tries++) {
            if (!Dog.dog || Dog.state().tame) break;
            const d = Dog.dog, f = field(P().x, P().y);
            // a tile three steps from it in line (so he faces it square), the nearest for him
            let best = null;
            for (const [sx, sy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
                const x = d.x + sx, y = d.y + sy;
                if ($gameMap.isValid(x, y) && isFinite(f.at(x, y)) && (!best || f.at(x, y) < best.c)) best = { x, y, c: f.at(x, y) };
            }
            if (!best) break;
            if (!(yield* walkTo(best.x, best.y, f))) continue;
            const dx = Dog.dog.x - P().x, dy = Dog.dog.y - P().y;
            P().setDirection(Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8));
            yield* wait(4);
            const fed = Dog.state().trust;
            yield* press("ok");
            if (yield* choose("Rzuć mu mięso", 20)) { yield* wait(20); yield* closeMenus(); }
            else yield* closeMenus();
            if (Dog.state().trust > fed || Dog.state().tame) { say(Dog.state().tame ? "pies oswojony!" : "pies zjadł (" + Dog.state().trust + "/3)"); break; }
        }
    }
    // the tame dog: the right job for it, told through its menu (he walks up to it)
    function* manageDog() {
        const st = Dog.state();
        if (!built("doghouse") || (st.hurtUntil || 0) > clockH()) return;
        // hunting while hides are wanted (a tannery and no tent yet) or meat is gone and he is getting hungry; else gathering
        const wantHunt = (built("tannery") && count(96) < 2 && count(121) === 0) || (DOG_MEATS.every(id => count(id) === 0) && window.Needs && Needs.enabled() && Needs.state().food < 55);
        const want = wantHunt ? "hunt" : "work";
        if (st.mode === want || clockH() - (AP.dogOrder || -99) < 6) return;
        AP.dogOrder = clockH();
        const entry = want === "hunt" ? "Poluj" : "Pracuj sam";
        for (let tries = 0; tries < 3 && Dog.state().mode !== want; tries++) {
            const d = Dog.dog;
            if (!d) break;
            if (!(yield* goFace([[d.x, d.y]]))) continue;
            yield* press("ok");
            if (yield* choose(entry, 20)) yield* wait(10);
            yield* closeMenus();
        }
        if (Dog.state().mode !== want) Dog.setMode(want);   // (it would not stand still for him: said from where he is)
        say("pies: " + (want === "hunt" ? "poluje" : "pracuje sam"));
    }
    // the carcasses the dog carried in (or anything he killed): dressed with the knife before they rot
    function* dressCarcasses() {
        if (!window.Hunting || !Hunting.carcasses || !(count(90) > 0 || count(91) > 0)) return;
        for (let i = 0; i < 3; i++) {
            const list = Hunting.carcasses().filter(c => !c.held && Math.hypot(c.x - P()._realX, c.y - P()._realY) < 30);
            if (!list.length) return;
            const c = list.sort((a, b) => Math.hypot(a.x - P()._realX, a.y - P()._realY) - Math.hypot(b.x - P()._realX, b.y - P()._realY))[0];
            const tx = Math.floor(c.x), ty = Math.floor(c.y);
            const n0 = Hunting.carcasses().length;
            if (!(yield* goFace([[tx, ty]]))) { c._apSkip = true; return; }
            yield* press("ok");
            yield* wait(40);
            yield* waitFree(200);
            yield* closeMenus();
            if (Hunting.carcasses().length < n0) say("oprawił tuszę: " + (Hunting.SPECIES[c.kind] ? Hunting.SPECIES[c.kind].name : c.kind));
            else return;
        }
    }
    function* play() {
        AP.wantPlay = true;
        AP.restDepth = 0; AP.feedDepth = 0; AP.onTrip = false; AP.goingHome = false; AP.pantryDepth = 0;
        say("gram sam - plan: " + PLAN.map(g => g.n).join(", "));
        for (let loop = 0; loop < 5000; loop++) {
            if ($gameMap.mapId() !== HOME_MAP && !AP.onTrip) { yield* goHome(); if ($gameMap.mapId() !== HOME_MAP) { yield* wait(600); continue; } }   // (the plan is for home: never builds elsewhere)
            yield* tendPantry(false);
            yield* feedDog();   // (the dog's bowl first - a minute's work; a hungry hero must not mean a starving dog)
            if (yield* survive()) { yield* nightCheck(); continue; }   // (hunger and thirst first: no work while they hold him down)
            yield* reflexes();
            yield* nightCheck();
            yield* keepFood();
            levelUp();
            yield* collectJobs();
            yield* cookMeat();
            yield* tend();
            yield* tameDog();
            yield* feedDog();
            yield* dressCarcasses();
            yield* harvestCrops();
            yield* plantSeeds();
            yield* cookMeat();
            yield* pottery();
            yield* maintainTools();
            yield* tidySites();
            const today = $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 0;
            if (AP.day !== today) { AP.day = today; PLAN.forEach(g => { g.fails = 0; }); }
            const g = PLAN.find(g => !g.done() && !((g.fails || 0) >= 3));
            if (!g) {   // (nothing to build now: it does not stop - it keeps the place, and tries the goals again after a while)
                if (PLAN.every(q => q.done())) { if (!AP.planDone) say("plan skończony - dogląda obejścia"); AP.planDone = true; }
                else if (AP.frame - (AP.idleSaid || -1e9) > 60 * 60) { AP.idleSaid = AP.frame; say("na razie nic nie wychodzi - zbiera jedzenie i spróbuje za godzinę"); }
                yield* forage(4);
                if (AP.frame - (AP.failReset || 0) > 60 * 60) { AP.failReset = AP.frame; PLAN.forEach(q => { q.fails = 0; }); }
                yield* wait(120);
                continue;
            }
            AP.goal = g.n;
            say("cel: " + g.n);
            if (!(yield* obtain(g.need))) { g.fails = (g.fails || 0) + 1; say("brakuje materiałów na: " + g.n); yield* wait(30); continue; }
            yield* reflexes();
            const ok = yield* g.run();
            if (!ok && !g.done()) { g.fails = (g.fails || 0) + 1; say("nie wyszło: " + g.n); }
            else { say("gotowe: " + g.n); PLAN.forEach(g => { g.fails = 0; }); }
        }
        return false;
    }

    const TASKS = {
        play, obtain, sleep: sleepNight, place: (t, x, y) => build(t, x, y, true), dig: digSoil, pottery, drinkVessel, restFast, collectJobs,
        walk: walkTo, gather, collect, goHome, goToMap, survive, forage, plantSeeds, harvestCrops, storePantry, fromPantry, compostRot, feedUp, buildWell, drinkWell, groundAction, feedDog, reflexes, tameDog, manageDog, dressCarcasses, mineOre, obtain, chop, harvest, build, craft, handCraft, rest, eat,
        wait: function* (frames) { yield* wait(frames); return true; },
        say: function* (text) { say(text); return true; },
        // repeat a list of tasks until the item counts are reached: ["until", {61: 6}, [["chop", 1], ["harvest", "Log", 1]]]
        until: function* (goal, steps, max = 30) {
            for (let r = 0; r < max; r++) {
                if (Object.entries(goal).every(([id, n]) => count(+id) >= n)) return true;
                let any = false;
                for (const [name, ...args] of steps) {
                    if (Object.entries(goal).every(([id, n]) => count(+id) >= n)) return true;
                    const v = yield* TASKS[name](...args);
                    if (v) any = true;
                }
                if (!any) return false;
            }
            return false;
        }
    };
    AP.TASKS = TASKS;
    AP._dbg = { field, spotsFor, pathFrom, segments, gatherKind, passStep };

    AP.run = function(list) { for (const t of list) AP.queue.push(t); return AP.queue.length; };
    AP.stop = function() { AP.queue = []; AP.cur = null; AP.fleeing = false; AP.saved = null; AP.restDepth = 0; AP.feedDepth = 0; AP.onTrip = false; AP.goingHome = false; AP.pantryDepth = 0; AP.wantPlay = false; releaseAll(); say("stop"); return true; };
    AP.onError = function(e) {
        say("BŁĄD " + e.message + " (" + (AP.curName || "-") + ", krok " + (AP.lastStep || "-") + ")");
        AP.cur = null; AP.fleeing = false; AP.saved = null; AP.restDepth = 0; AP.feedDepth = 0; AP.onTrip = false; AP.goingHome = false; AP.pantryDepth = 0; AP.queue = [];
        releaseAll();
        AP.errors = (AP.errors || []).filter(f => AP.frame - f < 60 * 60).concat([AP.frame]);
        if (AP.wantPlay && AP.errors.length <= 5) { AP.queue = [["play"]]; say("gra dalej od nowa"); }
    };
    AP.status = function() {
        const s = window.Needs ? Needs.state() : {};
        return { goal: AP.goal || "", cur: AP.curName, left: AP.queue.length, time: clock(), day: $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 0, pos: [P().x, P().y],
            st: Math.round(stamina()), food: Math.round(s.food || 0), water: Math.round(s.water || 0),
            items: $gameParty.allItems().map(i => i.name + " " + $gameParty.numItems(i)).join(", "), log: AP.log.slice(-14) };
    };
    function nearDanger(x, y) {
        if (!window.Hunting || !Hunting.animals) return false;
        // (a boar keeps to its place: work elsewhere; wolves come to him wherever he is - they are fought, not avoided)
        for (const a of Hunting.animals) if (a && DANGER[a._kind] && a._kind !== "wolf" && a._hp > 0 && a._mode !== "flee" && Math.hypot(a._realX - x, a._realY - y) < 6) return true;
        return false;
    }
    AP.nearDanger = nearDanger;
    function threat() {
        if (!window.Hunting || !Hunting.animals) return null;
        const px = P()._realX + 0.5, py = P()._realY + 0.5;
        let best = null;
        for (const a of Hunting.animals) {
            if (!a || !DANGER[a._kind] || !(a._hp > 0) || a._dead || a._mode === "flee") continue;
            const ax = a.centerX ? a.centerX() : a._realX + 0.5, ay = a.centerY ? a.centerY() : a._realY + 0.5, d = Math.hypot(ax - px, ay - py);
            const coming = a._mode && a._mode !== "roam" && a._mode !== "flee";
            if (d < (coming ? 9 : 3.5) && (!best || d < best.d)) best = { a, d, ax, ay };
        }
        return best;
    }
    // a charge coming at him: a roll (Space) across its line, to the open side - the boar then runs past (Hunting: "overshoot")
    const heroHp = () => { const a = $gameParty.leader(); return a && a.mhp ? a.hp / a.mhp : 1; };
    const breathFull = () => !(window.Combat && Combat.maxBreath) || Combat.breathNow() >= Combat.maxBreath() * 0.7;
    const rolling = () => !!(window.Combat && Combat.act && Combat.act.mode === "roll");
    function* dodgeFrom(ax, ay) {
        const px = P()._realX + 0.5, py = P()._realY + 0.5, vx = px - ax, vy = py - ay, L = Math.hypot(vx, vy) || 1;
        let sx = -vy / L, sy = vx / L;
        const dirOf = (x, y) => (Math.abs(x) >= Math.abs(y) ? (x > 0 ? 6 : 4) : (y > 0 ? 2 : 8));
        if (!P().canPass(P().x, P().y, dirOf(sx, sy))) { sx = -sx; sy = -sy; }
        const keys = [];
        if (sx > 0.38) keys.push("right"); else if (sx < -0.38) keys.push("left");
        if (sy > 0.38) keys.push("down"); else if (sy < -0.38) keys.push("up");
        setMove(keys);
        key("dodge", true); yield; yield; key("dodge", false);
        yield* wait(3);
        setMove([]);
        say("unik!");
        for (let n = 0; n < 40 && rolling(); n++) yield;
    }
    // stand and fight a boar (or a wolf): rolls away from its charges, strikes while it is open (running past, backing off, reeling);
    // gives up (and runs) below 45% health
    const OPEN = { recover: 1, stagger: 1 };
    const keysToward = (dx, dy) => { const L = Math.hypot(dx, dy) || 1, k = []; if (dx / L > 0.38) k.push("right"); else if (dx / L < -0.38) k.push("left"); if (dy / L > 0.38) k.push("down"); else if (dy / L < -0.38) k.push("up"); return k; };
    // nothing standing on the straight line between two points (tiles, centres): no tree/rock event, wall or building
    function clearLine(ax, ay, bx, by) {
        const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 0.25));
        const t0 = Math.floor(ax) + "," + Math.floor(ay), t1 = Math.floor(bx) + "," + Math.floor(by);
        for (let k = 1; k < n; k++) {
            const x = Math.floor(ax + (bx - ax) * k / n), y = Math.floor(ay + (by - ay) * k / n), key = x + "," + y;
            if (key === t0 || key === t1) continue;
            if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f)) return false;
            if ($gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())) return false;
            if (window.Farming && Farming.buildingAt && Farming.buildingAt(x, y)) return false;
        }
        return true;
    }
    AP.clearLine = clearLine;
    // the keys toward an animal: straight at it when the line is clear, else along the path round the tree (or whatever is between)
    function keysChase(ax, ay) {
        const px = P()._realX + 0.5, py = P()._realY + 0.5;
        if (clearLine(px, py, ax, ay)) return keysToward(ax - px, ay - py);
        const tx = Math.floor(ax), ty = Math.floor(ay);
        let c = AP.chase;
        if (!c || c.tx !== tx || c.ty !== ty || AP.frame - c.frame > 20 || c.from !== P().x + "," + P().y) {
            const path = pathFrom(field(P().x, P().y), tx, ty);
            c = AP.chase = { tx, ty, frame: AP.frame, from: P().x + "," + P().y, next: path && path.length > 1 ? path[1] : null };
        }
        if (!c.next) return keysToward(ax - px, ay - py);
        return keysToward(c.next[0] + 0.5 - px, c.next[1] + 0.5 - py);
    }
    // a tile near the animal (2.5-4.5 away) with a clear line to it, the nearest to walk to: to face it in the open, not round a tree
    function openSpotNear(ax, ay) {
        const f = field(P().x, P().y);
        let best = null;
        for (let y = Math.floor(ay) - 5; y <= Math.floor(ay) + 5; y++) for (let x = Math.floor(ax) - 5; x <= Math.floor(ax) + 5; x++) {
            if (!$gameMap.isValid(x, y) || !isFinite(f.at(x, y))) continue;
            const d = Math.hypot(x + 0.5 - ax, y + 0.5 - ay);
            if (d < 2.5 || d > 4.5 || !clearLine(x + 0.5, y + 0.5, ax, ay)) continue;
            if (!best || f.at(x, y) < best.c) best = { x, y, c: f.at(x, y) };
        }
        return best;
    }
    function* fight(t0) {
        const a = t0.a, name = Hunting.SPECIES[a._kind].name;
        say("walczy: " + name + " (życie " + Math.round(heroHp() * 100) + "%)");
        if (Combat.setCombatMode) Combat.setCombatMode(true);
        let won = false, hp0 = a._hp, progress = 0, blocked = 0, lastMove = -1e9, still = 0, lastPos = "";
        for (let n = 0; n < 60 * 60; n++) {
            if (!a || !(a._hp > 0) || a._dead) { won = true; break; }
            if (heroHp() < 0.45) { say("za słaby - ucieka"); break; }
            const px = P()._realX + 0.5, py = P()._realY + 0.5, ax = a._realX + 0.5, ay = a._realY + 0.5, d = Math.hypot(ax - px, ay - py);
            if (d > 12) break;   // (it ran off)
            if (a._mode === "roam") { say(name + " się uspokoił"); break; }   // (it lost interest: back to work)
            if (a._hp < hp0) { hp0 = a._hp; progress = n; }
            const pos = a._x + "," + a._y;
            still = pos === lastPos && !a.isMoving() ? still + 1 : 0;
            lastPos = pos;
            blocked = clearLine(px, py, ax, ay) ? 0 : blocked + 1;
            const stuck = a._mode === "charge" && !a._commit && still > 40;   // it runs at him into a bush and stands there
            // something between them while it snorts or comes (not stuck where he can walk round to it): out to where it sees him
            if (blocked > 45 && n - lastMove > 240 && (a._mode === "warn" || (a._mode === "charge" && still > 40 && d > 3)) && !rolling() && !AP.dodgeT && P().canMove()) {
                lastMove = n;
                const o = openSpotNear(ax, ay);
                if (o) { say("obchodzi przeszkodę"); setMove([]); key("shift", false); yield* walkTo(o.x, o.y); continue; }
            }
            if (n - progress > 60 * 30) { say("nie da się go dosięgnąć - odchodzi"); AP.noFightUntil = AP.frame + 60 * 120; break; }
            if (rolling() || AP.dodgeT) { yield; continue; }   // (a roll going on - the tick started it)
            if ((OPEN[a._mode] || stuck) && P().canMove()) {
                if (d > 1.25) { key("shift", breathFull()); setMove(keysChase(ax, ay)); yield; continue; }   // run up to it, round what is between (walk when out of breath)
                setMove([]); key("shift", false);
                P().setDirection(Math.abs(ax - px) >= Math.abs(ay - py) ? (ax > px ? 6 : 4) : (ay > py ? 2 : 8));
                yield* press("shoot");
                yield* wait(12);
                continue;
            }
            setMove([]); key("shift", false);
            if ((a._mode === "retreat" || a._mode === "flee") && d > 6) { won = !(a._hp > 0) || a._mode === "flee"; break; }   // (it gave up)
            yield;
        }
        if (Combat.setCombatMode) Combat.setCombatMode(false);
        releaseAll();
        if (won) say(name + " pokonany!");
        return won;
    }
    // wolves are faster than him: running away does not work. The pack circles him and sends one wolf at a time - it crouches and
    // growls ("windup", 38 frames), leaps at him (it bites from the leap's 6th frame), then stands a moment ("recover", 44 frames).
    // The tick rolls him across the leap as it springs; here he runs up to a wolf standing after its leap (or reeling) and strikes -
    // the leader first (its death breaks the pack). Walks, not runs: the breath is for the next roll.
    const wolvesOn = () => (window.Hunting && Hunting.animals || []).filter(w => w && w._kind === "wolf" && w._hp > 0 && !w._dead && w._mode !== "flee" && (w._engaged || w.playerDistance() < 8));
    function* fightPack() {
        let ws = wolvesOn();
        if (!ws.length) return true;
        say("walczy z wilkami: " + ws.length + " (życie " + Math.round(heroHp() * 100) + "%)");
        if (Combat.setCombatMode && !Combat.combatMode()) Combat.setCombatMode(true);
        const n0 = ws.length, still = new Map();   // (wolf -> where and since when it stands)
        for (let n = 0; n < 60 * 120; n++) {
            ws = wolvesOn();
            if (!ws.length) break;
            for (const w of ws) {
                const r = still.get(w);
                if (!r || Math.hypot(r.x - w._realX, r.y - w._realY) > 0.1) still.set(w, { x: w._realX, y: w._realY, n });
            }
            if (rolling() || AP.dodgeT || !P().canMove()) { setMove([]); yield; continue; }
            const standing = w => w._mode !== "windup" && w._mode !== "lunge" && n - (still.get(w) || { n }).n > 90 && w.playerDistance() < 3;
            const open = ws.filter(w => (w._mode === "recover" && w._modeT > 4) || w._stun > 0 || standing(w))
                .sort((a, b) => ((b._leader ? 1 : 0) - (a._leader ? 1 : 0)) || a.playerDistance() - b.playerDistance());
            const w = open[0];
            if (w) {
                const px = P()._realX + 0.5, py = P()._realY + 0.5, ax = w.centerX(), ay = w.centerY(), d = Math.hypot(ax - px, ay - py);
                if (d > 1.3) { key("shift", false); setMove(keysChase(ax, ay)); yield; continue; }
                setMove([]);
                P().setDirection(Math.abs(ax - px) >= Math.abs(ay - py) ? (ax > px ? 6 : 4) : (ay > py ? 2 : 8));
                yield* press("shoot");
                yield* wait(10);
                continue;
            }
            setMove([]); key("shift", false);
            yield;
        }
        if (Combat.setCombatMode && Combat.combatMode()) Combat.setCombatMode(false);
        releaseAll();
        const left = (window.Hunting && Hunting.animals || []).filter(w => w && w._kind === "wolf" && w._hp > 0 && !w._dead);
        say("wilki pokonane: " + (n0 - left.length) + " zabite, " + left.filter(w => w._mode === "flee").length + " uciekły (życie " + Math.round(heroHp() * 100) + "%)");
        return true;
    }
    // a wolf about to leap at him (the last frames of its growl) or just in the air: roll across its line
    function wolfLeaping() {
        if (!window.Hunting || !Hunting.animals) return null;
        for (const w of Hunting.animals) {
            if (!w || w._kind !== "wolf" || !(w._hp > 0) || w._dead) continue;
            const d = w.playerDistance();
            if (w._mode === "windup" && w._modeT <= 3 && d < 4.8) return w;
            if (w._mode === "lunge" && !w._bitten && (w._lungeT || 0) < 4 && d < 3.4) return w;
        }
        return null;
    }
    function* flee() {
        const t0 = threat();
        if (t0 && t0.a._kind !== "wolf") AP.zones.push({ x: t0.ax, y: t0.ay, r: ZONE_R, until: AP.frame + ZONE_FRAMES });
        say("uciekam: " + (t0 ? Hunting.SPECIES[t0.a._kind].name : "?") + " (" + (t0 ? t0.d.toFixed(1) : "") + " pól)");
        yield* closeMenus();
        for (let round = 0; round < 12; round++) {
            const t = threat();
            if (!t) break;
            // the reachable tile 6-10 steps away that is farthest from the animal
            const f = field(P().x, P().y);
            let best = null;
            for (let y = P().y - 10; y <= P().y + 10; y++) for (let x = P().x - 10; x <= P().x + 10; x++) {
                if (!$gameMap.isValid(x, y)) continue;
                const c = f.at(x, y);
                if (!isFinite(c) || c < 3 || c > 11) continue;
                const score = Math.hypot(x + 0.5 - t.ax, y + 0.5 - t.ay) - 0.25 * c;
                if (!best || score > best.score) best = { x, y, score };
            }
            if (!best) break;
            key("shift", breathFull());   // (running eats the breath a roll needs)
            yield* walkTo(best.x, best.y, f);
            key("shift", false);
        }
        key("shift", false);
        const t1 = threat() || (window.Hunting && Hunting.animals || []).filter(a => a && DANGER[a._kind] && a._hp > 0 && a._kind !== "wolf" && a._mode !== "flee").map(a => ({ a, ax: a._realX + 0.5, ay: a._realY + 0.5 }))[0];
        if (t1 && t1.a._kind !== "wolf") AP.zones.push({ x: t1.ax, y: t1.ay, r: ZONE_R, until: AP.frame + ZONE_FRAMES });
        say("bezpiecznie");
        return true;
    }
    function chargingClose() {
        if (!window.Hunting || !Hunting.animals) return null;
        const px = P()._realX + 0.5, py = P()._realY + 0.5;
        for (const a of Hunting.animals) {
            if (!a || !DANGER[a._kind] || !(a._hp > 0) || a._mode !== "charge") continue;
            const ax = a._realX + 0.5, ay = a._realY + 0.5;
            const d = Math.hypot(ax - px, ay - py);
            if (d < 2.05 && d > 0.9 && clearLine(ax, ay, px, py)) return { ax, ay };   // (earlier and the no-harm frames run out before it gets there)
        }
        return null;
    }
    function chargeComing(r) {
        if (!window.Hunting || !Hunting.animals) return false;
        const px = P()._realX + 0.5, py = P()._realY + 0.5;
        return Hunting.animals.some(a => a && DANGER[a._kind] && a._hp > 0 && a._mode === "charge" && !a._dead &&
            Math.hypot(a._realX + 0.5 - px, a._realY + 0.5 - py) < r && clearLine(a._realX + 0.5, a._realY + 0.5, px, py));
    }
    function dodgeKeys(ax, ay) {
        const px = P()._realX + 0.5, py = P()._realY + 0.5, vx = px - ax, vy = py - ay, L = Math.hypot(vx, vy) || 1;
        let sx = -vy / L, sy = vx / L;
        const room = (x, y) => {   // tiles clear that way (0..2)
            const d = Math.abs(x) >= Math.abs(y) ? (x > 0 ? 6 : 4) : (y > 0 ? 2 : 8), dx = d === 6 ? 1 : d === 4 ? -1 : 0, dy = d === 2 ? 1 : d === 8 ? -1 : 0;
            if (!P().canPass(P().x, P().y, d)) return 0;
            return P().canPass(P().x + dx, P().y + dy, d) ? 2 : 1;
        };
        if (room(-sx, -sy) > room(sx, sy)) { sx = -sx; sy = -sy; }
        return keysToward(sx, sy);
    }
    AP.tick = function() {
        AP.frame++;
        if (AP.dodgeT > 0) {   // a roll being pressed: the keys for three frames, then the task goes on
            AP.dodgeT--;
            setMove(AP.dodgeDir); key("dodge", AP.dodgeT > 0 && AP.dodgeT < 3);   // (the arrow one frame before Space)
            if (!AP.dodgeT) { key("dodge", false); setMove([]); say("unik!"); }
            return;
        }
        if ((AP.cur || AP.queue.length) && !rolling() && P().canMove() && !menuOpen()) {
            const c = chargingClose();
            if (c) { releaseAll(); AP.dodgeDir = dodgeKeys(c.ax, c.ay); AP.dodgeT = 4; return; }
            const w = wolfLeaping();
            if (w) { releaseAll(); AP.dodgeDir = dodgeKeys(w.centerX(), w.centerY()); AP.dodgeT = 4; return; }
            if (chargeComing(3.6)) { releaseAll(); return; }   // (brace: stand, the roll comes at 2 tiles)
        }
        if (AP.frame % (60 * 180) === 0 && free() && $gameSystem.isSaveEnabled()) {
            $gameSystem.onBeforeSave();
            DataManager.saveGame(0).then(() => say("zapisano")).catch(() => say("zapis nieudany"));
        }
        if (AP.frame % 10 === 0) {   // a tree struck while he was not chopping it: said in the log (where and during what)
            const first = !AP.treeHits;   // (the first look only notes what was struck before this autopilot was loaded)
            AP.treeHits = AP.treeHits || {};
            for (const e of $gameMap.events()) {
                const h = e._treeHits || 0, k = $gameMap.mapId() + ":" + e.eventId(), was = AP.treeHits[k] || 0;
                if (!first && h > was && ChoppableTree.isTree(e) && !(AP.holding && AP.holding.endsWith(" " + e.eventId()) && AP.frame - AP.holdEnd < 150)) say("UWAGA: cios w drzewo " + e.eventId() + " poza ścinaniem (" + (AP.curName || "-") + ", tryb walki " + !!(Combat.combatMode && Combat.combatMode()) + ")");
                AP.treeHits[k] = h;
            }
        }
        if (AP.paused) return;
        if (AP.wantPlay && !AP.goingHome && !AP.onTrip && $gameMap.mapId() !== HOME_MAP && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && free()) {
            releaseAll(); AP.cur = null; AP.fleeing = false; AP.saved = null; AP.restDepth = 0; AP.feedDepth = 0; AP.onTrip = false; AP.goingHome = false; AP.pantryDepth = 0;
            AP.queue = [["goHome"], ["play"]];
        }
        if ((AP.cur || AP.queue.length) && ((AP.frame - (AP.saidAt || 0) > 60 * 60 && free()) || AP.frame - (AP.saidAt || 0) > 60 * 120)) {
            const sc = SceneManager._scene;
            say("stoi od minuty: " + (AP.curName || "-") + " / krok " + (AP.lastStep || "-") + " / wytrz. " + Math.round(stamina()) + " / " + (sc ? sc.constructor.name : "") + " - zaczyna od nowa");
            releaseAll(); AP.cur = null; AP.fleeing = false; AP.saved = null; AP.restDepth = 0; AP.feedDepth = 0; AP.onTrip = false; AP.goingHome = false; AP.pantryDepth = 0; AP.queue = [["play"]];
            if (menuOpen() && SceneManager._scene && SceneManager._scene._farmMenu) Input._currentState.escape = true, setTimeout(() => { Input._currentState.escape = false; }, 80);
        }
        // danger first: the task waits (it is picked up again after running away)
        if (AP.fleeing && AP.curName === "sen" && AP.frame % 10 === 0 && threat()) {   // (going to bed and they come: out of bed, the menu shut)
            releaseAll();
            if (menuOpen()) { Input._currentState.escape = true; setTimeout(() => { Input._currentState.escape = false; }, 80); }
            AP.cur = AP.saved ? AP.saved.gen : null; AP.curName = AP.saved ? AP.saved.name : ""; AP.saved = null; AP.fleeing = false;
            say("zagrożenie - nie idzie spać");
        }
        if (!AP.fleeing && AP.frame % 10 === 0 && (AP.cur || AP.queue.length)) {
            const h = hour(), night = h >= 20 || h < 4.5;
            let gen = null, name = "";
            const t = threat();
            if (t && t.a._kind === "wolf" && t.a._mode !== "roam" && t.a._mode !== "flee") { gen = fightPack(); name = "wilki"; }
            else if (t) {
                const armed = window.Combat && Combat.handMelee && Combat.handMelee() > 0;
                if (armed && heroHp() >= 0.7 && stamina() >= 25 && t.a._mode !== "roam" && AP.frame > (AP.noFightUntil || 0)) { gen = fight(t); name = "walka"; }
                else { gen = flee(); name = "ucieczka"; }
            }
            else if (night && (built("bedroll") || built("tent")) && AP.frame - (AP.sleepTry || -1e9) > 60 * 40 && P().canMove() && !$gameTemp._buildMode && !menuOpen() && AP.frame > (AP.holdOff || 0)) {
                AP.sleepTry = AP.frame; gen = sleepNight(); name = "sen";
            }
            if (gen) {
                releaseAll();
                AP.saved = { gen: AP.cur, name: AP.curName };
                AP.cur = gen;
                AP.curName = name;
                AP.fleeing = true;
            }
        }
        if (AP.fleeing && !AP.cur) { AP.fleeing = false; AP.saved = null; }
        if (AP.fleeing) {
            const r = AP.cur.next();
            if (r.done) { releaseAll(); AP.fleeing = false; AP.cur = AP.saved.gen; AP.curName = AP.saved.name; AP.saved = null; }
            return;
        }
        if (!AP.cur) {
            if (!AP.queue.length) return;
            const [name, ...args] = AP.queue.shift();
            if (!TASKS[name]) { say("? " + name); return; }
            AP.curName = name + " " + JSON.stringify(args);
            AP.cur = TASKS[name](...args);
            say("> " + AP.curName);
        }
        const t0 = performance.now();
        const r = AP.cur.next();
        const dt = performance.now() - t0;
        if (dt > 25) { AP.slow = AP.slow || []; AP.slow.push([AP.curName.slice(0, 30), Math.round(dt), AP.lastStep || ""]); if (AP.slow.length > 40) AP.slow.shift(); }
        if (r.done) { say("< " + AP.curName + " = " + JSON.stringify(r.value)); AP.cur = null; AP.curName = ""; releaseAll(); }
    };
    if (!window.__APsummary) {
        let seen = 0;
        window.__APsummary = setInterval(() => {
            const sc = SceneManager._scene;
            if (!window.AP || !window.AP.cur || !sc || sc.constructor.name !== "Scene_DaySummary") { seen = 0; return; }
            if (++seen === 10) { Input._currentState.ok = true; setTimeout(() => { Input._currentState.ok = false; }, 120); seen = 0; }
        }, 500);
    }
    if (!window.__APorig) window.__APorig = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        try { if (window.AP) window.AP.tick(); }
        catch (e) { if (window.AP && window.AP.onError) window.AP.onError(e); else releaseAll(); }
        return window.__APorig.apply(this, arguments);
    };
    say("autopilot v" + VERSION);
    return "ok";
})();
