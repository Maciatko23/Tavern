//=============================================================================
// Zmiana_Sala.js
//=============================================================================
// The tavern shift played LIVE on the tavern's own map, Map001 (2026-11-18, the user: "da się zrobić, żeby minigra z pracą w tawernie
// bazowała na faktycznej tawernie, czyli aktualnych stołach w tym głównym holu?" - and of the two ways: "na żywo na mapie karczmy").
// Borgar gives the shift as before (Story.js -> TavernShift.start); in the tavern it is not a scene of its own any more:
//   1. PRZED OTWARCIEM: the hall's real tables (the 16 long ones of the main hall) - a few dirty: stand by one, hold O; wood from the
//      pile by the entrance's fireplace to the hall's two fireplaces; sacks and buckets of rubbish into the kitchen's bin (through the
//      door behind the bar; 2026-11-18 the user: "niech w kuchni będzie kosz na śmieci i tam wszystko wrzuca" - was: the front door). The guests
//      who were sitting finish and go out (the hall is being got ready).
//   2. PIWO: behind the bar, at the barrels - O: the keg's close-up (TavernShift's own part, as a close-up: nothing paid there).
//   3. KUCHNIA: through the door behind the bar, at the stove beside Jagna - O: the kitchen's close-up.
//   4. WIECZÓR NA SALI: Borgar opens the door; the hall's guests (Goscie_Sala.js, their own looks and seated figures) come in one by
//      one, sit only at a CLEAN table and order (a bubble over the head with what they want and their patience); the dishes stand on
//      the counter (O: take, two at most), O by the guest: served; they eat or drink, pay a tip by how fast it came and how good it
//      was, go - and leave the table dirty; the fire goes down: wood from the pile. A cold hall makes them lose patience faster.
// Then the shift's summary (TavernShift's scene: the pay, the tips, the grade - the same reckoning as ever, the hours not added: they
// went by on the map). Meanwhile: Jagna keeps to the stove, Zośka leaves the fires to the hero, the game cannot be saved, the tavern
// cannot be left (Borgar: "Kończę zmianę" breaks it off - no day's pay, the tips kept, as before).
// Nothing of it goes into the save (the save is off while it runs).

/*:
 * @target MZ
 * @plugindesc Zmiana w karczmie na żywo na mapie (Map001): prawdziwe stoły, kominki, lada i goście sali; piwo i kuchnia jako zbliżenia. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TavernShift
 * @orderAfter TavernShift_Parts
 * @orderAfter Goscie_Sala
 * @orderAfter Kelnerka
 * @orderAfter Pokojowka
 *
 * @help
 * Zmiana_Sala.js
 *   Gdy bohater bierze zmianę u Borgara w karczmie (Map001), zmiana toczy się na mapie karczmy:
 *   sprzątanie prawdziwych stołów, drewno do kominków, śmieci za drzwi, piwo przy beczkach i kuchnia
 *   (zbliżenia jak dawniej), wieczorem obsługa gości sali przy prawdziwych stołach.
 *   Teksty: js/teksty/zmiana.txt (zywo.*). API: window.ZmianaSala (running, state, skip, abort).
 */

(() => {
    "use strict";
    const PLUGIN = "Zmiana_Sala";
    const T = window.Tawerna;
    const P = T && T.api("TavernShift_parts");
    if (!P || !P.kit || !P.hall) throw new Error("Zmiana_Sala.js: brak TavernShift.js / TavernShift_Hall.js wyżej na liście wtyczek");
    // (the words load after the plugins: read when used, never kept from the load)
    const K = P.kit, H = P.hall, TK = K.TK, Z = () => TK.zywo || {};
    const { ST, GOOD, BAD, WARN, clamp, se, panel, bar, txt, icon, dirty, DISHES, MENU_ORDER, dishIcon } = K;
    const C = () => TK.czesci || {};
    const MAP = 1;

    // ------------------------------------------------------------------
    // The tavern's places (Map001, the smaller ground floor of 2026-11-16)
    // ------------------------------------------------------------------
    const KEGS = [{ x: 11, y: 14 }, { x: 16, y: 14 }];                 // the barrels behind the bar (the hero at y 15 under them)
    const STOVES = [{ x: 7, y: 5 }, { x: 9, y: 5 }, { x: 11, y: 5 }];  // the kitchen's stoves (the hero at y 6 under them)
    const FIRES = [{ x: 4, y: 14 }, { x: 24, y: 14 }];                // the hall's two fireplaces
    const PILE = { x: 21, y: 36.4 };                                   // the wood by the entrance's fireplace (20,36) (22,36)
    const BIN = { x: 15, y: 9 };                                       // the kitchen's rubbish bin (an empty wicker basket, Map001 event 455), right of the door from the hall
    // the bar: its front row (y 17, the hero takes from below it) and its top (y 16) where the dishes stand - the candles at 10 and 18,
    // Borgar's book at 14, the plants moved to the side counters (2026-11-18 the user: "jedzenie musi być na ladzie równo położone",
    // "na ladzie równo, a nie na krawędzi", "kwiatki zdjąć z lady"): each half of the top (11-13, 15-17) holds its dishes spread evenly
    const COUNTER_Y = 17, COUNTER_TOP = 16, COUNTER_L = 12, COUNTER_R = 16;
    const HALL = { x0: 1, x1: 27, y0: 18, y1: 31 };                   // the main hall (its long tables)
    const TABLE_TILES = [416, 424, 432, 439, 447];                     // the long tables (layer 3) - as Goscie_Sala
    const BORGAR = [1, 38, 52];                                        // Borgar, the meal at the counter, the counter's talk
    const REACH = 1.5;                                                 // tiles from the hero's middle to a thing's middle
    // the old room was 19 x 13 cells, the hall is ~28 x 14 with the wood and the door far off: the times stretched for it
    const STRETCH = { clean: 2.4, serve: 1.6, spawn: 1.6, patience: 1.7, fire: 1.5 };
    const ICON = { table: 400, wood: 381, coin: K.GOLD_ICON || 313, fire: 381 };
    // the log in his hands: the firewood's own picture (Drewno, item 61 - what goes on a campfire; 2026-11-18 the user: "ładna ikonka
    // drewna taka co się wrzuca do ogniska")
    const logIcon = () => (window.$dataItems && $dataItems[61] && $dataItems[61].iconIndex) || ICON.wood;
    // the rubbish: one picture (img/system/Zmiana_Smieci.png, PixelLab in the Winlu style, 2026-11-18 - was the RTP sack and bucket,
    // and a flour sack's icon in his hands): a tied sack of scraps (cell 0) and a bucket of peelings (cell 1), each set on its 48 px
    // cell's floor - lying in the hall as it is, over his head the same picture (its painted box)
    const RUBBISH = "Zmiana_Smieci";
    const RUBBISH_BOX = { sack: [8, 10, 32, 36], bucket: [55, 10, 33, 36] };

    const G = () => window.GoscieSala && window.GoscieSala.shift;
    const here = () => !!(window.$gameMap && $gameMap.mapId() === MAP);
    const wstaw = (s, o) => (window.Watki && Watki.wstaw ? Watki.wstaw(String(s || ""), o) : String(s || ""));
    const say = (ch, text, frames) => { const sb = T.api("SpeechBubbles") || window.SpeechBubbles; if (sb && sb.say && ch && text) sb.say(ch, text, frames); };
    const pop = (text, o) => { if (T.popup && text) T.popup(text, o || {}); };
    const hero = () => ({ x: $gamePlayer._realX, y: $gamePlayer._realY });
    const dist = (a, x, y) => Math.hypot(a.x - x, a.y - y);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pickW = list => { const sum = list.reduce((s, k) => s + (DISHES[k].weight || 1), 0); let r = Math.random() * sum; for (const k of list) { r -= DISHES[k].weight || 1; if (r <= 0) return k; } return list[0]; };

    // ------------------------------------------------------------------
    // The hall's tables: the long tables' tiles joined (4-way), with their chairs (Goscie_Sala's seats beside them)
    // ------------------------------------------------------------------
    function hallTables() {
        const W = $dataMap.width, Hh = $dataMap.height, d = $dataMap.data, seen = new Set(), out = [];
        const isT = (x, y) => x >= HALL.x0 && x <= HALL.x1 && y >= HALL.y0 && y <= HALL.y1 && TABLE_TILES.includes(d[(3 * Hh + y) * W + x]);
        for (let y = HALL.y0; y <= HALL.y1; y++) for (let x = HALL.x0; x <= HALL.x1; x++) {
            if (!isT(x, y) || seen.has(x * 1000 + y)) continue;
            const cells = [], st = [[x, y]];
            seen.add(x * 1000 + y);
            while (st.length) {
                const [cx, cy] = st.pop();
                cells.push([cx, cy]);
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = cx + dx, ny = cy + dy;
                    if (isT(nx, ny) && !seen.has(nx * 1000 + ny)) { seen.add(nx * 1000 + ny); st.push([nx, ny]); }
                }
            }
            const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
            out.push({ id: out.length, cells, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), dirty: 0, wipe: 0, seats: [] });
        }
        const seats = G() ? G().seats() : [];
        for (const s of seats) {
            const tb = out.find(t => t.cells.some(c => c[0] === s.table[0] && c[1] === s.table[1]));
            if (tb) tb.seats.push(s);
        }
        return out;
    }
    const tableOfSeat = seat => (L && seat ? L.tables.find(t => t.seats.includes(seat)) : null);
    function nearTable(h, list) {   // the nearest of these tables with a cell in reach
        let best = null, bd = 99;
        for (const tb of list) for (const c of tb.cells) { const d = dist(h, c[0], c[1]); if (d < bd) { bd = d; best = tb; } }
        return bd <= REACH ? best : null;
    }

    // ------------------------------------------------------------------
    // The shift's state (memory only: the save is off while it runs)
    // ------------------------------------------------------------------
    let L = null;
    const running = () => !!L;
    function wants(opts) { return here() && !L && !!window.GoscieSala && !!G() && !(opts && opts.scene); }
    function start(opts) {
        const st = K.stats(), level = clamp(opts.level === undefined || opts.level === null || opts.level === "" ? Math.min(K.MAX_LEVEL, st.done) : Number(opts.level), 0, K.MAX_LEVEL);
        L = {
            opts: Object.assign({}, opts), level, cfg: K.levelCfg(level), shiftNo: st.done + 1, startHour: T.time.hour(), startDay: T.time.day(),
            phase: "intro", t: 0, limit: 0, ctx: { tips: 0 }, results: {}, partIds: K.PART_ORDER.slice(), carry: [], tables: hallTables(),
            sacks: [], wood: { need: 0, done: 0 }, trashDone: 0, fire: 3, guests: new Map(), schedule: [], used: new Set(), stats: null,
            hold: null, notes: [], introDone: false, closeUp: false, cold: 0
        };
        G().begin({ pick: pickSeat, onSeated, onLeft, noSeat });
        return true;
    }

    // ---- 1. before the doors open
    function beginClean() {
        const c = L.cfg.clean;
        L.phase = "clean"; L.t = 0; L.limit = Math.round(c.time * STRETCH.clean);
        // the dirty tables: of the hall's tables, the guests' crumbs and rings from the day
        const tabs = L.tables.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(c.tables, L.tables.length));
        for (const tb of tabs) { tb.dirty = 1; tb.wipe = 0; }
        L.tablesTotal = tabs.length;
        L.wood = { need: c.wood, done: 0 };
        L.fire = 0;
        L.sacks = sackSpots(c.trash).map((p, i) => ({ x: p[0], y: p[1], kind: i % 2 ? "bucket" : "sack", state: "lying" }));
        L.trashDone = 0;
        announce(Z().faza && Z().faza.clean, Z().hint && Z().hint.clean);
    }
    // free floor cells of the hall, away from the bar and the tables' ends, a few cells apart
    function sackSpots(n) {
        const out = [], free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).length;
        const cand = [];
        for (let y = 19; y <= 31; y++) for (let x = 1; x <= 27; x++) if (free(x, y) && !(x >= 11 && x <= 17)) cand.push([x, y]);
        cand.sort(() => Math.random() - 0.5);
        for (const c of cand) { if (out.every(o => Math.abs(o[0] - c[0]) + Math.abs(o[1] - c[1]) >= 5)) out.push(c); if (out.length >= n) break; }
        return out;
    }
    const tablesClean = () => L.tables.filter(t => t.dirty > 0).length === 0 ? L.tablesTotal : L.tablesTotal - L.tables.filter(t => t.dirty > 0).length;
    function cleanUnits() { return { total: L.tablesTotal + L.wood.need + L.sacks.length, done: tablesClean() + L.wood.done + L.trashDone }; }
    function finishClean() {
        const u = cleanUnits(), left = Math.max(0, L.limit - L.t);
        let s = 90 * u.done / Math.max(1, u.total);
        if (u.done >= u.total) s += 10 * Math.min(1, left / (L.limit * 0.35));
        L.ctx.fire = L.wood.done;
        const tables = tablesClean(), good = [], bad = [], F = C().finish || [];
        if (u.done >= u.total) good.push(wstaw(F[0], { "1": Math.ceil(left / 60) }));
        else {
            if (tables < L.tablesTotal) bad.push(wstaw(F[1], { "1": L.tablesTotal - tables }));
            if (L.wood.done < L.wood.need) bad.push(wstaw(F[2], { "1": L.wood.need - L.wood.done }));
            if (L.trashDone < L.sacks.length) bad.push(wstaw(F[3], { "1": L.sacks.length - L.trashDone }));
            if (u.done > 0 && tables === L.tablesTotal) good.push(F[4]);
        }
        L.results.clean = { result: { score: Math.round(clamp(s, 0, 100)), done: u.done, total: u.total, timeLeft: Math.round(left / 60), tables: [tables, L.tablesTotal],
            wood: [L.wood.done, L.wood.need], trash: [L.trashDone, L.sacks.length] }, good, bad };
        // what was not carried out stays where it lies; what he holds he keeps (a log goes on the fire later)
        L.sacks = L.sacks.filter(s => s.state === "carried");
        L.carry = L.carry.filter(c => c.kind === "log" || (c.kind === "sack" && L.sacks.includes(c.sack)));
        L.phase = "beer"; L.t = 0;
        announce(Z().faza && Z().faza.beer, Z().hint && Z().hint.beer);
    }

    // ---- 2-3. the close-ups (the scene's own parts: their result back here, nothing paid)
    function closeUp(id) {
        if (L.closeUp) return;
        L.closeUp = true;
        se(id === "beer" ? "Water1" : "Fire1", 50, 110);
        T.api("TavernShift").start({ closeUp: true, parts: [id], level: L.level, ctx: L.ctx, onEnd: r => {
            if (!L) return;
            L.closeUp = false;
            if (r && r.ctx) Object.assign(L.ctx, r.ctx);
            const pr = r && r.parts && r.parts[id];
            L.results[id] = pr ? { result: pr.result, good: pr.good || [], bad: pr.bad || [] } : { result: { score: 0, skipped: true }, good: [], bad: [] };
            if (id === "beer") { L.phase = "kitchen"; L.t = 0; announce(Z().faza && Z().faza.kitchen, Z().hint && Z().hint.kitchen); }
            else beginServe();
        } });
    }

    // ---- 4. the evening: the guests
    function beginServe() {
        const c = L.cfg.serve;
        L.phase = "serve"; L.t = 0; L.limit = Math.round(c.time * STRETCH.serve);
        L.menu = MENU_ORDER.filter(k => c.menu.includes(k));
        L.fire = L.ctx.fire === undefined ? 3 : clamp(L.ctx.fire, 0, 3);
        L.stats = { guests: 0, orders: 0, served: 0, mistakes: 0, walkouts: 0, noSeat: 0, speed: 0, tips: 0, cold: 0 };
        const span = Math.round(c.spawnEnd * STRETCH.spawn) - 60;
        L.schedule = [];
        for (let i = 0; i < c.guests; i++) L.schedule.push(Math.round(60 + (i + 0.15 + Math.random() * 0.6) * span / c.guests));
        announce(Z().faza && Z().faza.serve, Z().hint && Z().hint.serve);
        pop(Z().popup && Z().popup.otwarte, { icon: 88 });
        se("Door2", 50, 100);
        const b = $gameMap.event(BORGAR[0]);
        if (b) say(b, Z().popup && Z().popup.otwarte, 150);
    }
    // the seat for a guest coming in: a free chair at a clean table of the main hall
    function pickSeat() {
        if (!L || L.phase !== "serve") return null;
        const free = [];
        for (const tb of L.tables) if (tb.dirty <= 0) for (const s of tb.seats) if (!s.by && !($gamePlayer.x === s.ax && $gamePlayer.y === s.ay)) free.push(s);
        return free.length ? free[Math.floor(Math.random() * free.length)] : null;
    }
    function onSeated(g) {
        if (!L || L.phase !== "serve" || !L.guests.has(g.id)) return;
        const o = L.guests.get(g.id), c = L.cfg.serve;
        const order = [pickW(L.menu)];
        if (Math.random() < c.double) order.push(pickW(L.menu));
        Object.assign(o, { state: "wait", order, got: order.map(() => false), max: Math.round(c.patience * STRETCH.patience), patience: Math.round(c.patience * STRETCH.patience), tip: 0, eatT: 0, seat: g.seat });
        L.stats.orders += order.length;
        se("Cursor1", 35, 120);
    }
    function onLeft(g) {
        if (!L) return;
        const o = L.guests.get(g.id);
        if (o) o.state = "gone";
    }
    function noSeat(g) {
        if (!L || !L.stats) return;
        const o = L.guests.get(g.id);
        if (o && o.state === "coming") { o.state = "gone"; L.stats.noSeat++; say(g.ev, (C().tickGuest || [])[0]); }
    }
    function bringGuest() {
        const raw = G().raw().filter(g => g.state === "out" && !L.used.has(g.id) && !g.shiftIn);
        if (!raw.length) return false;
        const g = raw[Math.floor(Math.random() * raw.length)];
        if (!G().bring(g.id)) return false;
        L.used.add(g.id);
        L.guests.set(g.id, { g, state: "coming", order: [], got: [] });
        L.stats.guests++;
        return true;
    }
    const wantsDish = (o, key) => o.state === "wait" && o.order.some((k, i) => k === key && !o.got[i]);
    function serveDish(o, key) {
        const i = o.order.findIndex((k, j) => k === key && !o.got[j]);
        o.got[i] = true;
        const d = DISHES[key], ratio = clamp(o.patience / o.max, 0, 1);
        const q = d.q === "beer" ? (L.ctx.beerQ === undefined ? 0.7 : 0.6 + 0.6 * L.ctx.beerQ) : d.q === "kitchen" ? (L.ctx.kitchenQ === undefined ? 0.7 : L.ctx.kitchenQ) : 1;
        o.tip += d.tip * (0.4 + 0.8 * ratio) * q * (K.TIP_SCALE || 1);
        L.stats.served++; L.stats.speed += ratio;
        se("Item3", 55, 110);
        const A = C().act || [];
        if (o.got.every(Boolean)) {
            o.state = "eat"; o.eatT = L.cfg.serve.eat;
            G().serve(o.g.id, o.order.every(k => k === "beer" || k === "mead") ? "drink" : "eat");
            say(o.g.ev, ratio > 0.6 ? A[4] : A[5], 100);
        }
    }
    function payAndGo(o) {
        const tip = Math.round(o.tip);
        if (tip > 0) {
            L.ctx.tips += tip; L.stats.tips += tip;
            floatText("+" + tip + " G", o.seat ? o.seat.x : o.g.ev.x, o.seat ? o.seat.y : o.g.ev.y, ST().accent);
            se("Coin", 50, 100);
        }
        const tb = tableOfSeat(o.seat);
        if (tb) { tb.dirty = 1; tb.wipe = 0; }   // (his crumbs and his mug's ring)
        o.state = "leave";
        G().send(o.g.id);
    }
    function finishServe() {
        const s = L.stats;
        const waiting = [...L.guests.values()].filter(o => o.state === "wait");
        const unserved = waiting.reduce((a, o) => a + o.order.filter((k, i) => !o.got[i]).length, 0);
        const orders = Math.max(1, s.orders);
        const ratio = s.served / orders, speed = s.served ? s.speed / s.served : 0;
        const score = 100 * (0.65 * ratio + 0.35 * speed * ratio) - 5 * s.mistakes - 6 * s.walkouts - 3 * s.noSeat;
        for (const o of L.guests.values()) if (o.state === "eat") { const tip = Math.round(o.tip); L.ctx.tips += tip; s.tips += tip; }
        const g = [], b = [], F = C().finish || [];
        if (s.served >= orders && s.served > 0) g.push(wstaw(F[13], { guests: s.guests }));
        else if (s.served > 0) g.push(wstaw(F[14], { served: s.served, orders }));
        if (speed >= 0.6 && s.served >= 3) g.push(wstaw(F[15], { tips: s.tips }));
        if (s.mistakes) b.push(wstaw(F[16], { mistakes: s.mistakes }));
        if (s.walkouts) b.push(wstaw(F[17], { walkouts: s.walkouts }));
        if (s.noSeat) b.push(wstaw(F[18], { noSeat: s.noSeat }));
        if (unserved) b.push(wstaw(F[19], { unserved }));
        if (s.cold > 600) b.push(F[20]);
        L.results.serve = { result: { score: Math.round(clamp(score, 0, 100)), guests: s.guests, orders, served: s.served, mistakes: s.mistakes, walkouts: s.walkouts,
            noSeat: s.noSeat, unserved, tips: s.tips, speed: Math.round(speed * 100) / 100 }, good: g, bad: b };
        end(false);
    }

    // ---- the end: the summary (TavernShift's scene - the pay to the purse there), the hall back to its hours
    function end(aborted) {
        if (!L || L.phase === "end") return;
        const l = L;
        l.phase = "end";
        for (const o of l.guests.values()) if (o.state !== "gone" && o.state !== "out") G().send(o.g.id);
        l.carry = [];
        const res = K.resultOf({ partIds: l.partIds, results: l.results, ctx: l.ctx, level: l.level, shiftNo: l.shiftNo }, aborted);
        res.live = true;
        const now = (T.time.day() - l.startDay) * 24 + T.time.hour() - l.startHour;
        res.hours = Math.max(0, Math.round(now * 10) / 10);
        pop(Z().popup && Z().popup.koniec, { icon: 88 });
        const onEnd = l.opts.onEnd;
        const finish = () => {
            T.api("TavernShift").start({ summary: res, startHour: l.startHour, level: l.level, onEnd: r => {
                L = null;
                if (G()) G().end();
                if (typeof onEnd === "function") onEnd(r);
            } });
        };
        // (the summary opens once the map is free: not in the middle of a talk or a close-up)
        l.pendingEnd = finish;
    }
    function abort() {
        if (!L || L.phase === "end" || L.phase === "intro") { if (L && L.phase === "intro") { L = null; if (G()) G().end(); } return false; }
        end(true);
        return true;
    }

    // ------------------------------------------------------------------
    // The hero's hands: up to two dishes, or two logs, or one sack
    // ------------------------------------------------------------------
    const holds = kind => L.carry.filter(c => c.kind === kind).length;
    function canTake(kind) {
        if (!L.carry.length) return true;
        if (L.carry[0].kind !== kind) return false;
        return kind !== "sack" && L.carry.length < 2;
    }

    // ------------------------------------------------------------------
    // What O does here: the nearest thing in reach that wants him
    // ------------------------------------------------------------------
    function targetNow() {
        if (!L || L.phase === "intro" || L.phase === "end" || L.closeUp) return null;
        const h = hero(), A = C().cel || {}, cz = Z().cel || {};
        const carry = L.carry[0] ? L.carry[0].kind : null;
        // the guests (the evening)
        if (L.phase === "serve") {
            let best = null, bd = 99;
            for (const o of L.guests.values()) {
                if (o.state !== "wait" || !o.seat) continue;
                const d = dist(h, o.seat.x, o.seat.y);
                if (d < bd && d <= REACH + 0.4) { bd = d; best = o; }
            }
            if (best) {
                const dish = L.carry.find(c => c.kind === "dish" && wantsDish(best, c.key));
                if (dish) return { kind: "give", o: best, dish, label: (A.podaj || "Podaj: ") + DISHES[dish.key].name };
                if (carry === "dish") return { kind: "wrong", o: best, label: (A.podaj || "Podaj: ") + DISHES[L.carry[0].key].name };
                const want = best.order.filter((k, i) => !best.got[i]).map(k => DISHES[k].name).join(", ");
                return { kind: "look", o: best, label: (A.chce || "Chce: ") + want, dim: true };
            }
            // the counter's dishes
            if (h.y >= COUNTER_Y + 0.5 && h.y <= COUNTER_Y + 1.6) {
                const slots = counterSlots();
                let sb = null, sd = 99;
                for (const s of slots) { const d = Math.abs(h.x - s.x); if (d < sd && d <= 0.75) { sd = d; sb = s; } }
                if (sb) {
                    if (L.carry.some(c => c.kind === "dish" && c.key === sb.key)) return { kind: "back", slot: sb, label: (A.odstaw || "Odstaw: ") + DISHES[sb.key].name };
                    if (!canTake("dish")) return { kind: "full", label: carry && carry !== "dish" ? A.zajete : (C().tick || [])[5], dim: true };
                    return { kind: "dish", slot: sb, label: (A.wez || "Weź: ") + DISHES[sb.key].name };
                }
            }
        }
        // the close-ups
        if (L.phase === "beer" && KEGS.some(k => dist(h, k.x, k.y) <= REACH)) return { kind: "keg", label: cz.nalej };
        if (L.phase === "kitchen" && STOVES.some(k => dist(h, k.x, k.y) <= REACH + 0.2)) return { kind: "stove", label: cz.gotuj };
        // the rubbish
        if (carry === "sack" && dist(h, BIN.x, BIN.y) <= REACH + 0.3) return { kind: "dump", label: (Z().cel && Z().cel.kosz) || A.wyrzuc };
        for (const s of L.sacks) if (s.state === "lying" && dist(h, s.x, s.y) <= REACH) return carry ? { kind: "full", label: A.zajete, dim: true } : { kind: "sack", sack: s, label: s.kind === "sack" ? A.worek : A.kubel };
        // the fire, the wood
        if (carry === "log") for (const f of FIRES) if (dist(h, f.x, f.y) <= REACH + 0.2) return { kind: "fire", f, label: A.doKominka };
        if (dist(h, PILE.x, PILE.y) <= REACH + 0.3 && (L.phase === "clean" || L.phase === "serve" || L.phase === "beer" || L.phase === "kitchen")) {
            return canTake("log") ? { kind: "log", label: cz.drewno } : { kind: "full", label: A.zajete, dim: true };
        }
        // a dirty table (hold O)
        const tb = nearTable(h, L.tables.filter(t => t.dirty > 0));
        if (tb) return { kind: "wipe", tb, label: (A.przetrzyj || "Przetrzyj stół") + ((C().tick || [])[1] || ""), hold: true };
        return null;
    }
    function act(tg) {
        const A = C().act || [];
        switch (tg.kind) {
            case "give": L.carry.splice(L.carry.indexOf(tg.dish), 1); serveDish(tg.o, tg.dish.key); break;
            case "wrong":
                L.stats.mistakes++; tg.o.patience -= tg.o.max * 0.15; tg.o.shake = 20;
                se("Buzzer1", 40, 110); say(tg.o.g.ev, A[3], 90);
                break;
            case "look": se("Cursor1", 30, 100); break;
            case "dish": L.carry.push({ kind: "dish", key: tg.slot.key }); se("Equip1", 45, 120); break;
            case "back": L.carry.splice(L.carry.findIndex(c => c.kind === "dish" && c.key === tg.slot.key), 1); se("Equip1", 40, 100); break;
            case "keg": closeUp("beer"); break;
            case "stove": closeUp("kitchen"); break;
            case "sack": tg.sack.state = "carried"; L.carry = [{ kind: "sack", sack: tg.sack }]; se("Equip2", 45, 90); break;
            case "dump": {
                const c = L.carry[0];
                if (c && c.sack) c.sack.state = "out";
                L.carry = [];
                if (L.phase === "clean") L.trashDone++;
                se("Equip2", 50, 60);
                floatText("✓", BIN.x, BIN.y - 1, GOOD);
                break;
            }
            case "log": L.carry.push({ kind: "log" }); se("Equip2", 50, 70); break;
            case "fire": {
                L.carry.splice(L.carry.findIndex(c => c.kind === "log"), 1);
                L.fire = Math.min(3, L.fire + 1);
                if (L.phase === "clean" && L.wood.done < L.wood.need) { L.wood.done++; floatText(wstaw(A[1], { done: L.wood.done, need: L.wood.need }), tg.f.x, tg.f.y - 1, ST().accent); }
                se("Fire1", 55, 100);
                break;
            }
            case "full": se("Buzzer2", 30, 100); break;
        }
    }
    // the dishes on the bar's top (the menu's own): the first half (the odd one too) on the left of the book, the rest on the right,
    // spread evenly over the half's three tiles (1: its middle, 2: its ends, 3: each) - 4 dishes stand every second tile, 6 fill it;
    // x the tile it stands on, y the bar's front row (the hero below it), tx: the tile to stand under it
    function counterSlots() {
        const menu = L.menu || [], nl = Math.ceil(menu.length / 2), nr = menu.length - nl;
        const half = (k, c) => Array.from({ length: k }, (_, i) => k === 1 ? c : c - 1 + i * 2 / (k - 1));
        const xs = half(nl, COUNTER_L).concat(half(nr, COUNTER_R));
        return menu.map((key, i) => ({ key, x: xs[i], y: COUNTER_Y, tx: Math.round(xs[i]) }));
    }

    // ------------------------------------------------------------------
    // A frame of the shift (the map's own frame: stopped while a talk, a message or a close-up holds the map)
    // ------------------------------------------------------------------
    function tick() {
        if (!L) return;
        if (!here()) { abort(); return; }
        if (L.pendingEnd && !$gameMap.isEventRunning() && !$gameMessage.isBusy() && !$gamePlayer.isTransferring()) { const f = L.pendingEnd; L.pendingEnd = null; f(); return; }
        if (L.phase === "end") return;
        if ($gameMap.isEventRunning() || $gameMessage.isBusy() || L.closeUp) return;
        if (L.phase === "intro") {
            if (!L.introDone) { L.introDone = true; introTalk(); return; }
            beginClean();
            return;
        }
        L.t++;
        const tg = targetNow();
        L.target = tg;
        // O: a press acts; a dirty table wants O held
        if (tg && tg.hold) {
            if (Input.isPressed("ok")) {
                const tb = tg.tb, need = L.phase === "serve" ? L.cfg.serve.wipe : L.cfg.clean.wipe;
                tb.wipe++;
                if (tb.wipe % 8 === 1) se("Water1", 30, 150);
                if (tb.wipe >= need) { tb.dirty = 0; tb.wipe = 0; se("Chime2", 45, 130); floatText("✓", (tb.x0 + tb.x1) / 2, tb.y0 - 0.5, GOOD); }
            }
        } else if (tg && L.pressed) act(tg);
        L.pressed = false;
        // the fire burns down (in the evening; before the doors open it only takes the wood)
        if (L.phase === "serve") {
            L.fire = Math.max(0, L.fire - L.cfg.serve.fireDecay / STRETCH.fire);
            if (L.fire <= 0) L.stats.cold++;
            if (L.fire > 0 && L.fire < 1 && !L.warnedLow) { L.warnedLow = true; pop((C().frame || [])[29], { icon: ICON.fire }); }
            if (L.fire >= 1) L.warnedLow = false;
            if (L.fire <= 0 && !L.warnedOut) { L.warnedOut = true; pop((C().tick || [])[4], { icon: ICON.fire }); }
            if (L.fire > 0) L.warnedOut = false;
        }
        switch (L.phase) {
            case "clean": {
                const u = cleanUnits();
                if (u.done >= u.total) { pop(Z().popup && Z().popup.posprzatane, { icon: ICON.table }); finishClean(); }
                else if (L.t >= L.limit) finishClean();
                break;
            }
            case "serve": {
                while (L.schedule.length && L.t >= L.schedule[0]) { if (bringGuest()) L.schedule.shift(); else { L.schedule[0] += 120; break; } }
                for (const o of L.guests.values()) {
                    if (o.state === "wait") {
                        o.patience -= L.fire <= 0 ? 1.5 : 1;
                        if (o.patience <= 0) { o.state = "leave"; L.stats.walkouts++; se("Buzzer1", 40, 90); say(o.g.ev, (C().tickGuest || [])[1], 120); G().send(o.g.id); }
                    } else if (o.state === "eat") {
                        if (--o.eatT <= 0) payAndGo(o);
                    }
                }
                const quiet = !L.schedule.length && [...L.guests.values()].every(o => o.state === "leave" || o.state === "gone");
                if (L.t >= L.limit || (quiet && L.t > 600)) finishServe();
                break;
            }
        }
    }
    // Borgar's few words to begin with (bubbles over him; the map waits for them)
    function introTalk() {
        const lines = [L.opts.intro].concat([0, 1, 2].map(i => (Z().intro || [])[i])).filter(Boolean);
        const list = [];
        for (const l of lines) {
            list.push({ code: 101, indent: 0, parameters: ["", 0, 0, 2, "Borgar"] });
            list.push({ code: 401, indent: 0, parameters: ["\\SPK[" + BORGAR[0] + "]" + l] });
        }
        list.push({ code: 0, indent: 0, parameters: [] });
        $gameMap._interpreter.setup(list, 0);
    }

    // ------------------------------------------------------------------
    // The engine's hooks
    // ------------------------------------------------------------------
    // O: the shift's thing in reach takes the press (not a talk with the guest he serves, not the counter's meal)
    const _triggerButton = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (L && here() && L.phase !== "intro" && L.phase !== "end" && Input.isTriggered("ok")) {
            const tg = targetNow();
            if (tg) { if (!tg.hold) L.pressed = true; return true; }
        }
        return _triggerButton.call(this);
    };
    // the shift goes on: nobody leaves the tavern (a word why), the game is not saved
    const _reserve = Game_Player.prototype.reserveTransfer;
    Game_Player.prototype.reserveTransfer = function(mapId) {
        if (L && L.phase !== "end" && here() && mapId !== MAP) { pop(Z().popup && Z().popup.nieWychodz, { icon: 88 }); return; }
        return _reserve.apply(this, arguments);
    };
    const _saveOn = Game_System.prototype.isSaveEnabled;
    Game_System.prototype.isSaveEnabled = function() { return L ? false : _saveOn.call(this); };
    // Borgar during the shift: back to work, or break it off
    T.onEventList(ev => {
        if (!L || !here() || L.phase === "end" || !BORGAR.includes(ev.eventId())) return null;
        const B = Z().borgar || {};
        return [
            { code: 101, indent: 0, parameters: ["", 0, 0, 2, "Borgar"] },
            { code: 401, indent: 0, parameters: ["\\SPK[" + BORGAR[0] + "]" + (B[0] || "") ] },
            { code: 102, indent: 0, parameters: [[B.dalej || "Pracuję dalej", B.koniec || "Kończę zmianę"], 0, 0, 2, 0] },
            { code: 402, indent: 0, parameters: [0, B.dalej || ""] },
            { code: 0, indent: 1, parameters: [] },
            { code: 402, indent: 0, parameters: [1, B.koniec || ""] },
            { code: 355, indent: 1, parameters: ["ZmianaSala.abort()"] },
            { code: 0, indent: 1, parameters: [] },
            { code: 404, indent: 0, parameters: [] },
            { code: 0, indent: 0, parameters: [] }
        ];
    }, { owner: PLUGIN, priority: "scene" });
    // the shift's frame: after the map's own
    // the rubbish picture asked for as the tavern's map is made: the scene waits for it, so the sacks lie there from the shift's first
    // frame (not a moment later)
    const _mapCreate = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _mapCreate.call(this);
        if (($gamePlayer.isTransferring() ? $gamePlayer.newMapId() : $gameMap.mapId()) === MAP) ImageManager.loadSystem(RUBBISH);
    };
    const _mapUpdate = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _mapUpdate.call(this);
        if (!L) { if (V && V.set) hideAll(); return; }
        try { tick(); draw(this); } catch (e) { console.error("Zmiana_Sala.js:", e); }
    };

    // ------------------------------------------------------------------
    // The pictures: the stains on the tables, the dishes on the counter, the sacks, the bubbles, the fire, the hands, the bar at the top
    // ------------------------------------------------------------------
    let V = null;
    function stainBitmap(tb) {
        const w = (tb.x1 - tb.x0 + 1) * 48, h = (tb.y1 - tb.y0 + 1) * 48, b = new Bitmap(w, h), ctx = b.context, n = Math.round(w * h / 420);
        for (let i = 0; i < n; i++) {
            const x = 8 + ((i * 37 + tb.id * 13) % Math.max(1, w - 16)), y = 6 + ((i * 17 + tb.id * 7) % Math.max(1, h - 14)), r = 3 + ((i * 5 + tb.id) % 5);
            ctx.fillStyle = i % 3 ? "rgba(96,58,24,0.5)" : "rgba(60,36,14,0.55)";
            ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = "rgba(240,225,190,0.7)";
        for (let i = 0; i < n + 4; i++) ctx.fillRect(6 + ((i * 29 + tb.id * 11) % Math.max(1, w - 12)), 6 + ((i * 13 + tb.id * 3) % Math.max(1, h - 12)), 2, 2);   // crumbs
        ctx.strokeStyle = "rgba(70,40,16,0.55)"; ctx.lineWidth = 2;   // a mug's ring
        ctx.beginPath(); ctx.arc(w / 2 + ((tb.id * 7) % 9) - 4, h / 3, 6, 0, Math.PI * 2); ctx.stroke();
        dirty(b);
        return b;
    }
    function build(set) {
        const tm = set._tilemap, v = { set, tm, stains: new Map(), sacks: new Map(), bubbles: new Map(), floats: [] };
        const mk = (bmp, z) => { const s = new Sprite(bmp); s.z = z; s.update = function() {}; tm.addChild(s); return s; };
        // (the bar's boards are the tilemap's upper layer (z 4, over the people behind it): the dishes standing on them above it)
        v.dishes = MENU_ORDER.map(() => mk(new Bitmap(36, 36), 4.5));
        v.fires = FIRES.map(() => { const s = mk(new Bitmap(84, 22), 9); s.anchor.set(0.5, 1); return s; });
        v.hands = mk(new Bitmap(84, 40), 9); v.hands.anchor.set(0.5, 1);
        v.prompt = new H.Prompt(); set.addChild(v.prompt); v.prompt.hide();
        // (at the bottom: the top's middle is the game's notices' place)
        v.hud = new Sprite(new Bitmap(640, 84)); v.hud.x = Math.round((Graphics.width - 640) / 2); v.hud.y = Graphics.height - 84 - 10; set.addChild(v.hud);
        v.mk = mk;
        return v;
    }
    function vis(scene) {
        const set = scene && scene._spriteset;
        if (!set || !set._tilemap) return null;
        if (V && V.set === set) return V;
        V = build(set);
        return V;
    }
    function hideAll() {
        const v = V;
        if (!v) return;
        for (const s of [...v.stains.values(), ...v.sacks.values(), ...v.bubbles.values(), ...v.dishes, ...v.fires, v.hands, v.hud]) if (s) s.visible = false;
        if (v.prompt) v.prompt.hide();
        for (const f of v.floats) f.s.visible = false;
        v.floats = [];
    }
    // what is painted on a small bitmap: the middle of its columns, its lowest row (a dish set down on the counter by its picture)
    function paintedBox(b) {
        const w = b.width, h = b.height, d = b.context.getImageData(0, 0, w, h).data;
        let x0 = w, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; y1 = y; }
        return x1 < 0 ? { cx: w / 2, y1: h - 3 } : { cx: (x0 + x1 + 1) / 2, y1: y1 + 1 };
    }
    const sx = c => $gameMap.adjustX(c) * $gameMap.tileWidth() + $gameMap.tileWidth() / 2;
    const sy = c => $gameMap.adjustY(c) * $gameMap.tileHeight() + $gameMap.tileHeight() / 2;
    function floatText(text, x, y, colour) {
        const v = V;
        if (!v || !text) return;
        const b = new Bitmap(220, 34);
        txt(b, String(text), 0, 2, 220, { size: 20, color: colour || ST().accent, bold: true, align: "center" });
        const s = v.mk(b, 9); s.anchor.set(0.5, 1);
        v.floats.push({ s, x, y, t: 0 });
    }
    function draw(scene) {
        const v = vis(scene);
        if (!v || !L) return;
        const tw = $gameMap.tileWidth(), live = L.phase !== "intro" && L.phase !== "end";
        // the stains
        for (const tb of L.tables) {
            let s = v.stains.get(tb.id);
            if (tb.dirty > 0 && live) {
                if (!s) { s = v.mk(stainBitmap(tb), 1.6); v.stains.set(tb.id, s); }
                const need = L.phase === "serve" ? L.cfg.serve.wipe : L.cfg.clean.wipe;
                s.visible = true; s.opacity = Math.round(255 * clamp(1 - tb.wipe / need, 0.15, 1));
                s.x = Math.round($gameMap.adjustX(tb.x0) * tw); s.y = Math.round($gameMap.adjustY(tb.y0) * tw);
            } else if (s) s.visible = false;
        }
        // the sacks and buckets lying in the hall
        for (const sk of L.sacks) {
            let s = v.sacks.get(sk);
            if (!s) { s = new Sprite(ImageManager.loadSystem(RUBBISH)); s.setFrame(sk.kind === "sack" ? 0 : 48, 0, 48, 48); s.z = 1.7; s.update = function() {}; v.tm.addChild(s); v.sacks.set(sk, s); }
            s.visible = sk.state === "lying" && live;
            s.x = Math.round($gameMap.adjustX(sk.x) * tw); s.y = Math.round($gameMap.adjustY(sk.y) * tw);
        }
        // the dishes on the counter (the evening)
        const slots = L.phase === "serve" ? counterSlots() : [];
        v.dishes.forEach((s, i) => {
            const sl = slots[i];
            s.visible = !!sl;
            if (!sl) return;
            // (drawn once the icon sheet is in; then set down by its own picture: the middle of what is painted over the slot, its
            // bottom on one line - a mug, a loaf and a bowl stand level)
            if (s._key !== sl.key) { s.bitmap.clear(); if (icon(s.bitmap, dishIcon(sl.key), 2, 2, 32)) { s._key = sl.key; s._box = paintedBox(s.bitmap); } }
            const bx = s._box || { cx: 18, y1: 33 };
            s.x = Math.round(sx(sl.x) - bx.cx); s.y = Math.round(sy(COUNTER_TOP) + 27 - bx.y1);   // (on the top's boards, a little in front of the book - not on the edge)
        });
        // the fires' meters
        FIRES.forEach((f, i) => {
            const s = v.fires[i], show = live && (L.phase === "serve" || L.phase === "clean");
            s.visible = show;
            if (!show) return;
            const key = Math.round(L.fire * 10);
            if (s._key !== key) {
                s._key = key;
                const b = s.bitmap; b.clear();
                panel(b, 0, 0, 84, 22, { cut: 3, fill: "rgba(11,12,15,0.85)" });
                icon(b, ICON.fire, 2, 1, 20);
                bar(b, 26, 8, 54, 7, clamp(L.fire / 3, 0, 1), L.fire >= 1.5 ? GOOD : L.fire > 0.5 ? WARN : BAD);
            }
            s.x = Math.round(sx(f.x)); s.y = Math.round(sy(f.y) - 40);
        });
        // the guests' bubbles: what they want and their patience
        for (const [id, o] of L.guests) {
            let s = v.bubbles.get(id);
            const show = live && o.state === "wait" && o.seat;
            if (!show) { if (s) s.visible = false; continue; }
            if (!s) { s = v.mk(new Bitmap(112, 70), 9); s.anchor.set(0.5, 1); v.bubbles.set(id, s); }
            s.visible = true;
            const shake = o.shake > 0 ? Math.sin(o.shake--) * 3 : 0;
            s.x = Math.round(sx(o.seat.x) + shake); s.y = Math.round(sy(o.seat.y) - 44);
            const ratio = clamp(o.patience / o.max, 0, 1), want = o.order.filter((k, i) => !o.got[i]);
            const key = want.join(",") + "|" + Math.round(ratio * 30);
            if (s._key === key) continue;
            s._key = key;
            const b = s.bitmap; b.clear();
            const w = Math.max(56, 12 + want.length * 38), x0 = Math.round((112 - w) / 2);
            H.drawBubble(b, x0, 4, w, 52, ratio);
            want.forEach((k, i) => icon(b, dishIcon(k), x0 + 8 + i * 38 + (want.length === 1 ? (w - 16 - 34) / 2 : 0), 8, 34));
            bar(b, x0 + 6, 46, w - 12, 5, ratio, ratio > 0.5 ? GOOD : ratio > 0.25 ? WARN : BAD);
        }
        // what he carries: over his head
        const hk = L.carry.map(c => c.kind === "dish" ? c.key : c.kind === "sack" ? "sack:" + (c.sack && c.sack.kind) : c.kind).join(",");
        v.hands.visible = live && L.carry.length > 0;
        if (v.hands._key !== hk) {
            const b = v.hands.bitmap; b.clear();
            let ok = true;
            L.carry.forEach((c, i) => {
                const x = 4 + i * 38 + (L.carry.length === 1 ? 19 : 0);
                if (c.kind === "sack") {   // (the sack or the bucket he picked up: its own picture, 1:1, its foot on the icons' line)
                    const img = ImageManager.loadSystem(RUBBISH), r = RUBBISH_BOX[c.sack && c.sack.kind === "bucket" ? "bucket" : "sack"];
                    if (!img.isReady()) { ok = false; return; }
                    b.blt(img, r[0], r[1], r[2], r[3], Math.round(x + 17 - r[2] / 2), 36 - r[3]);
                    return;
                }
                ok = icon(b, c.kind === "dish" ? dishIcon(c.key) : logIcon(), x, 2, 34) && ok;
            });
            if (ok) v.hands._key = hk;   // (the icon sheet not in yet: drawn again next frame)
        }
        v.hands.x = Math.round($gamePlayer.screenX()); v.hands.y = Math.round($gamePlayer.screenY() - 64);
        // O: what it does here
        const tg = live && !$gameMap.isEventRunning() ? L.target : null;
        if (tg && tg.label) {
            const need = tg.hold ? (L.phase === "serve" ? L.cfg.serve.wipe : L.cfg.clean.wipe) : 0;
            v.prompt.show(tg.label, $gamePlayer.screenX(), $gamePlayer.screenY() + 46, tg.hold ? tg.tb.wipe / need : undefined, !!tg.dim);
        } else v.prompt.hide();
        // the floating words
        v.floats = v.floats.filter(f => {
            f.t++;
            f.s.x = Math.round(sx(f.x)); f.s.y = Math.round(sy(f.y) - 20 - f.t * 0.6);
            f.s.opacity = Math.round(255 * clamp(1 - (f.t - 40) / 30, 0, 1));
            if (f.t > 70) { if (f.s.parent) f.s.parent.removeChild(f.s); return false; }
            return true;
        });
        drawHud(v);
    }
    function drawHud(v) {
        v.hud.visible = L.phase !== "intro" && L.phase !== "end";
        if (!v.hud.visible) return;
        const ph = L.phase, F = Z().faza || {}, Hn = Z().hint || {};
        const timed = ph === "clean" || ph === "serve", left = timed ? Math.max(0, L.limit - L.t) : 0;
        let row = "";
        if (ph === "clean") row = (Z().stoly || "Stoły") + " " + tablesClean() + "/" + L.tablesTotal + "   ·   " + (Z().drewno || "Drewno") + " " + L.wood.done + "/" + L.wood.need + "   ·   " + (Z().smieci || "Śmieci") + " " + L.trashDone + "/" + L.sacks.length;
        else if (ph === "serve") {
            const waiting = [...L.guests.values()].filter(o => o.state === "wait").length;
            row = (Z().obsluzeni || "Obsłużeni") + " " + L.stats.served + "   ·   " + (Z().czekaja || "Czekają") + " " + waiting + "   ·   " + (Z().napiwki || "Napiwki") + " " + Math.round(L.ctx.tips) + " G";
        } else row = Hn[ph] || "";
        const key = ph + "|" + Math.ceil(left / 60) + "|" + row;
        if (v.hud._key === key) return;
        v.hud._key = key;
        const b = v.hud.bitmap; b.clear();
        panel(b, 0, 0, 640, 80, { cut: 6, fill: "rgba(11,12,15,0.88)" });
        txt(b, F[ph] || "", 18, 8, 400, { size: 24, color: ST().accent, bold: true });
        txt(b, wstaw(Z().zmianaNr, { "1": L.shiftNo }), 18, 8, 604, { size: 16, color: ST().muted, align: "right" });
        if (timed) {
            const ratio = left / Math.max(1, L.limit);
            bar(b, 18, 40, 604, 6, ratio, ratio > 0.35 ? ST().accent : ratio > 0.15 ? WARN : BAD);
            txt(b, row, 18, 50, 470, { size: 17, color: ST().text });
            txt(b, wstaw(Z().zostalo, { "1": Math.ceil(left / 60) + " s" }), 18, 50, 604, { size: 17, color: ST().muted, align: "right" });
        } else txt(b, row, 18, 44, 604, { size: 19, color: ST().text });
    }
    function announce(title, hint) {
        if (title) pop(wstaw(Z().popup && Z().popup.dalej, { "1": title }), { icon: 88, sub: hint || "" });
    }

    // ------------------------------------------------------------------
    // API (TavernShift.js: P.live; tests: window.ZmianaSala)
    // ------------------------------------------------------------------
    P.live = { wants, start, running };
    const api = {
        running,
        abort,
        state: () => L ? { phase: L.phase, t: L.t, limit: L.limit, level: L.level, carry: L.carry.map(c => c.kind === "dish" ? c.key : c.kind), fire: Math.round(L.fire * 100) / 100,
            dirty: L.tables.filter(t => t.dirty > 0).map(t => t.id), tables: L.tables.map(t => ({ id: t.id, x0: t.x0, y0: t.y0, x1: t.x1, y1: t.y1, seats: t.seats.length, dirty: t.dirty })),
            sacks: L.sacks.map(s => ({ x: s.x, y: s.y, state: s.state })), wood: Object.assign({}, L.wood), trash: L.trashDone, tips: L.ctx.tips,
            guests: [...L.guests.values()].map(o => ({ id: o.g.id, state: o.state, order: o.order.slice(), got: o.got.slice(), seat: o.seat ? [o.seat.x, o.seat.y] : null, patience: Math.round(o.patience) })),
            stats: L.stats ? Object.assign({}, L.stats) : null, results: Object.keys(L.results), target: L.target ? { kind: L.target.kind, label: L.target.label } : null,
            slots: L.phase === "serve" ? counterSlots() : [] } : null,
        // tests and the debug menu: the phase ends now (clean: everything done; serve: as it stands)
        skip() {
            if (!L) return false;
            if (L.phase === "clean") { for (const tb of L.tables) tb.dirty = 0; L.wood.done = L.wood.need; for (const s of L.sacks) s.state = "out"; L.trashDone = L.sacks.length; return true; }
            if (L.phase === "beer" || L.phase === "kitchen") { L.results[L.phase] = { result: { score: 80, skipped: true }, good: [], bad: [] }; if (L.phase === "beer") { L.phase = "kitchen"; L.t = 0; } else beginServe(); return true; }
            if (L.phase === "serve") { L.t = L.limit; return true; }
            return false;
        },
        PLACES: { KEGS, STOVES, FIRES, PILE, BIN, COUNTER_Y, COUNTER_TOP, COUNTER_L, COUNTER_R },
        pictures: () => V   // (tests: the sprites of the shift on the map)
    };
    window.ZmianaSala = T.register ? T.register(PLUGIN, api) : api;
})();
