//=============================================================================
// Morze.js
//=============================================================================
// W23 "Coś z głębin" (docs/POTWORY_Z_MORZA.md) - the ENGINE of the sea monsters and of the thread; the data: Morze_Data.js, the words:
// js/teksty/morze.txt, the creatures themselves (the minds, the looks, the tracks, the tentacles, the town's watch): Morze_Potwory.js.
//   - the chance of a night: p(day) = min(30%, 1% x day); on a sea map P = p x the multipliers (lighthouse, garrison, fires on the shore, the
//     bell, the watch) never under 15% of p, then the raises (red water x1.5, a storm x1.3, the lighthouse out x1.2), a ceiling of 45%
//   - ONE roll a night and a map (a seed of the night and the map: leaving and coming back never rerolls); the hour of the landing from the
//     same seed; one counter compared in the 30-frame tick while a landing is waiting - nothing per frame, no scans
//   - the landing: signs (a bark, rings and a splash at the shore), the creatures come out of the water at one of six shore points (found
//     once a map, kept in memory), wet tracks from the water; at dawn they go back; the dead lie as carcasses (Creatures.js)
//   - maps the hero is not on: no simulation - in the morning the same seed lays the tracks where it "would have landed"
//   - the town (Map008, inland): half of the harbour's chance, they come in through the gate; the watch fights (Morze_Potwory.js)
//   - the kraken's tentacles: only the harbour (Map125), after day 60, 4% a night, never two nights running
//   - the thread W23 in seven chapters; F9 rows (Okolice.f9, section "Potwory z morza")
// API: window.Morze (Tawerna.api("Morze")).

/*:
 * @target MZ
 * @plugindesc [W23] Potwory z morza - silnik: szansa nocy, losowanie z ziarna, lądowanie, świt, ślady, miasto, macki, wątek W23 „Coś z głębin”, wiersze F9. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Morze_Data
 * @base Morze_Potwory
 * @base Creatures
 * @orderAfter Morze_Potwory
 * @orderAfter Poselstwo
 *
 * @help
 * ============================================================================
 * Morze.js - potwory z morza i wątek W23 (docs/POTWORY_Z_MORZA.md)
 * ============================================================================
 * Co noc z morza mogą wyjść potwory; szansa rośnie z numerem dnia, a gracz
 * może ją obniżać (latarnia, garnizon, ogniska na brzegu, dzwon). F9 →
 * „Potwory z morza”. W skryptach: Morze.chance(), Morze.force(rodzaj).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.MorzeData;
    if (!T || !window.Watki || !D) throw new Error("Morze.js: brak TawernaCore.js / Watki.js / Morze_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Morze";
    const w = D.watek, TX = D.TX;
    const fill = Watki.wstaw;
    const S = () => w.S();
    const tx = k => w.tekst(k);
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gamePlayer;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const hash = T.util.hash;
    const clamp = T.util.clamp;
    const report = (where, e) => console.error("[Morze] " + where + ":", e);
    const P = () => window.MorzePotwory;
    const L = () => T.api("Latarnia");
    const TQ = () => T.api("TownQuests");
    const heroX = () => $gamePlayer._realX + 0.5, heroY = () => $gamePlayer._realY + 0.5;
    const mapId = () => $gameMap.mapId();
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

    T.inject.reserve(D.OWNER, D.IDS[0], D.IDS[1], "W23 Coś z głębin (potwory z morza: znaczniki i macki - rysowane duszkami, bez zdarzeń)");

    // ==================================================================
    // 1. Time: the night of a day = dusk + 0.5 h ... next dawn - 0.5 h
    // ==================================================================
    function sunOf(d) {
        const La = L();
        if (La && La.dusk && La.dawn) { try { return { set: La.dusk(d), rise: La.dawn(d) }; } catch (e) { /* fallback below */ } }
        const s = window.Sky && Sky.sunTimes ? Sky.sunTimes(d) : { rise: 6, set: 20 };
        return { set: s.set - 0.3, rise: s.rise };
    }
    // { n: the night's number (the day it began on), off: hours since its start, len: its length, inWin }
    function nightInfo(d, h) {
        d = d === undefined ? day() : d; h = h === undefined ? hour() : h;
        const n = h >= 12 ? d : d - 1;
        const a = sunOf(n), b = sunOf(n + 1);
        const start = a.set + D.NIGHT.fromDusk, len = 24 - start + b.rise - D.NIGHT.toDawn;
        const off = h >= 12 ? h - start : (24 - start) + h;
        return { n, off, len, start, inWin: off >= 0 && off <= len, rise: b.rise };
    }
    const nightNow = () => { try { return nightInfo(); } catch (e) { return { n: 0, off: -1, len: 0, inWin: false }; } };

    // ==================================================================
    // 2. Sea maps, the six shore points, the fires near them
    // ==================================================================
    const seaMap = () => !!(window.$dataMap && /<Water:\s*salt\s*>/i.test($dataMap.note || "")) && mapId() <= D.NO_SEA_MAPS_ABOVE && !D.OUT_OF_WORLD.includes(mapId());
    const townMap = () => mapId() === D.MAP.miasto;
    const shoreCache = {};
    function shorePoints() {
        const id = mapId();
        if (shoreCache[id]) return shoreCache[id];
        const Pm = P(), W = $gameMap.width(), H = $gameMap.height(), cand = [];
        let sx = 0, sy = 0;
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
            if (!$gameMap.checkPassage(x, y, 0x0f) || !Pm.waterNear(x, y) || Pm.isWater(x, y)) continue;
            if ($gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())) continue;
            cand.push({ x, y }); sx += x; sy += y;
        }
        const pts = [];
        if (cand.length) {
            const cx = sx / cand.length, cy = sy / cand.length;
            for (const c of cand) c.a = Math.atan2(c.y - cy, c.x - cx);
            cand.sort((a, b) => a.a - b.a);
            const n = Math.min(6, cand.length);
            for (let i = 0; i < n; i++) pts.push(cand[Math.floor((i + 0.5) * cand.length / n)]);
        }
        return (shoreCache[id] = pts);
    }
    // the share of the six shore points sheltered by a fire (a fire within FIRE_R): the fires of Starcia.fires() (the camp-fires, the stuck torches)
    function fireShare(pts) {
        if (!pts.length) return 0;
        const fires = P() ? P().fires() : [];
        const covered = pt => fires.some(f => !f.hero && Math.hypot(f.x - pt.x - 0.5, f.y - pt.y - 0.5) <= D.FIRE_R);
        return pts.filter(covered).length / pts.length;
    }
    const coveredPoint = pt => (P() ? P().fires() : []).some(f => !f.hero && Math.hypot(f.x - pt.x - 0.5, f.y - pt.y - 0.5) <= D.FIRE_R);

    // ==================================================================
    // 3. The chance
    // ==================================================================
    const baseP = d => Math.min(D.CHANCE.max, D.CHANCE.perDay * d);
    function endingKind() { const U = T.api("Underground"); try { const e = U && U.ending ? U.ending() : null; return e && e.kind ? e.kind : ""; } catch (e) { return ""; } }
    // ctx: { map, day, pts (shore points: for the fires), lit, favour, red, storm, bell, guard, ending } - all optional (read from the game when missing)
    function chanceOf(ctx) {
        const c = ctx || {}, d = c.day === undefined ? nightNow().n : c.day, map = c.map === undefined ? (has() ? mapId() : D.MAP.przystan) : c.map;
        const ed = c.ending === undefined ? endingKind() : c.ending, E = D.ENDING[ed] || null;
        let p = baseP(d);
        if (E && E.final && S().koniec >= 2) return { p: 0, P: 0, parts: [["ending", 0]], ending: ed };
        if (E && E.fixed !== undefined) p = E.fixed;
        const parts = [];
        let m = 1;
        const La = L();
        const lit = c.lit === undefined ? !!(La && La.lit && La.lit()) : c.lit;
        if (lit) { const k = map === D.MAP.przystan ? D.MULT.lighthouse.przystan : D.MULT.lighthouse.other; m *= k; parts.push(["latarnia", k]); }
        const fav = c.favour === undefined ? (() => { const G = T.api("Garnizon"); try { return G && G.favor ? G.favor() : 0; } catch (e) { return 0; } })() : c.favour;
        if (fav >= D.MULT.garrison.favour) { const k = map === D.MAP.garnizon ? D.MULT.garrison.own : D.MULT.garrison.other; m *= k; parts.push(["garnizon", k]); }
        const share = c.fireShare !== undefined ? c.fireShare : (has() && map === mapId() && seaMap() ? fireShare(shorePoints()) : 0);
        if (share > 0) { const k = 1 - D.MULT.fire * share; m *= k; parts.push(["ogniska", k]); }
        const storm = c.storm === undefined ? stormNow() : c.storm;
        const bell = c.bell === undefined ? bellOn(d) && !storm : c.bell;
        if (bell) { m *= D.MULT.bell; parts.push(["dzwon", D.MULT.bell]); }
        if ((c.guard === undefined ? S().straz : c.guard)) { m *= D.MULT.guard; parts.push(["straz", D.MULT.guard]); }
        if (E && E.mult) { m *= E.mult; parts.push(["zakonczenie", E.mult]); }
        let P0 = Math.max(p * m, p * D.CHANCE.floor);
        const red = c.red === undefined ? redNow() : c.red;
        if (red) { P0 *= D.MULT.red; parts.push(["czerwona woda", D.MULT.red]); }
        if (storm) { P0 *= D.MULT.storm; parts.push(["burza", D.MULT.storm]); }
        if (!lit && c.lightOut !== false && L() && (L().info ? !!(L().info().built) : true)) { P0 *= D.MULT.lightOut; parts.push(["latarnia zgasła", D.MULT.lightOut]); }
        P0 = Math.min(P0, E && E.ceiling ? E.ceiling : D.CHANCE.ceiling);
        return { p, P: P0, m, parts, ending: ed, share };
    }
    const stormNow = () => { const St = T.api("Storm"); try { return !!(St && St.level && St.level() > 0.3); } catch (e) { return false; } };
    const redNow = () => { const C = T.api("CzerwonaWoda"); try { return !!(C && C.isRed && C.isRed()); } catch (e) { return false; } };
    const bellOn = d => !!S().dzwon && d - S().dzwonDzien < D.BELL_DAYS;

    // the pure decision of a night on a map (the seed: the night and the map) - the same each time
    function decide(n, map, P0, fog, last) {
        const u = hash(n * 7 + 11, map * 31 + 1);
        const rec = { l: u < P0 ? 1 : 0, k: "", c: 1, o: hash(n * 7 + 13, map * 31 + 3), sp: 0, left: 0, tr: null };
        if (!rec.l) return rec;
        const row = D.TABLE.find(r => n >= r.from && n <= r.to) || D.TABLE[0];
        let ws = Object.assign({}, row.w);
        if (!fog) delete ws.mglak; else if (row.fogW && ws.mglak !== undefined) ws.mglak = row.fogW;
        if (row.witchEvery && last && n - last < row.witchEvery) delete ws.wiedzma;
        const total = Object.values(ws).reduce((a, b) => a + b, 0);
        let r = hash(n * 7 + 17, map * 31 + 2) * total;
        for (const [k, v] of Object.entries(ws)) { if ((r -= v) < 0) { rec.k = k; break; } }
        if (!rec.k) rec.k = Object.keys(ws)[0];
        const range = (n >= 10 && row.n10 ? row.n10 : row.n);
        rec.c = D.GROUP[rec.k] ? 1 : range[0] + Math.floor(hash(n * 7 + 19, map * 31 + 4) * (range[1] - range[0] + 1));
        rec.o = hash(n * 7 + 13, map * 31 + 3);
        return rec;
    }

    // ==================================================================
    // 4. The record of a night on a map (saved in the thread's state; old nights cleared after 3)
    // ==================================================================
    const key = (n, map) => n + ":" + map;
    function recordFor(n, map, make) {
        const s = S(), k = key(n, map);
        if (s.noce[k]) return s.noce[k];
        if (!make) return null;
        for (const o of Object.keys(s.noce)) if (n - Number(o.split(":")[0]) > 3) delete s.noce[o];
        let info = chanceOf({ map, day: n });
        const La = L();
        let fog = false;
        try { fog = !!(La && La.fogTonight && La.fogTonight(n)); } catch (e) { fog = false; }
        const rec = decide(n, map, map === D.MAP.miasto ? D.MULT.town * chanceOf({ map: D.MAP.przystan, day: n }).P : info.P, fog, s.ostatniaWiedzma);
        rec.P = Math.round(info.P * 1000) / 1000;
        if (rec.k === "wiedzma") s.ostatniaWiedzma = n;
        s.noce[k] = rec;
        return rec;
    }

    // ==================================================================
    // 5. The landing
    // ==================================================================
    let landing = null;      // { rec, pt, t, n, map } while a landing waits (signs, then the creatures)
    let tick = 0;
    const levelOf = n => 1 + Math.floor(n / D.LEVEL_EVERY);
    function pickPoint(pts, town) {
        const hx = $gamePlayer.x, hy = $gamePlayer.y;
        const free = pts.filter(p => !coveredPoint(p));
        const pool = free.length ? free : [];
        if (!pool.length) return null;
        const ok = pool.filter(p => { const d = Math.hypot(p.x - hx, p.y - hy); return d >= 10 && d <= 26; });
        const list = ok.length ? ok : pool;
        return list.slice().sort((a, b) => Math.abs(Math.hypot(a.x - hx, a.y - hy) - 16) - Math.abs(Math.hypot(b.x - hx, b.y - hy) - 16))[0];
    }
    const waterCellNear = pt => {
        const Pm = P();
        for (let r = 1; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Pm.isWater(pt.x + dx, pt.y + dy)) return { x: pt.x + dx, y: pt.y + dy };
        return { x: pt.x, y: pt.y };
    };
    function ringsAt(x, y, n) { const C = window.Creatures; if (C && C.rings) for (let i = 0; i < n; i++) C.rings.push({ x: x + 0.5 + (Math.random() - 0.5), y: y + 0.5 + (Math.random() - 0.5), r: 0.9, t: -i * 10, life: 50, kind: "ripple" }); }
    function beginLanding(rec, n, map, forced) {
        let pts = shorePoints(), pt = null;
        if (town) { pt = townGate(); }
        else pt = rec.pt && !forced ? rec.pt : pickPoint(pts, false);
        if (!pt) { rec.sp = 1; return; }
        rec.pt = pt;
        landing = { rec, pt, t: 0, n, map, forced: !!forced };
        try { const g = D.GROUP[rec.k] || { kind: rec.k }; P().warm([g.kind].concat(g.with ? [g.with.kind] : [])); } catch (e) { /* the shadows are cut later then */ }
    }
    var town = false;
    function townGate() {
        // the town's gates towards the harbour and the suburb (the west gate and the south one): the monster comes through one of them
        const gates = [[4, 63], [31, 108]], g = gates[hash(nightNow().n, 5) < 0.5 ? 0 : 1];
        for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = g[0] + dx, y = g[1] + dy;
            if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough())) return { x, y, gate: true };
        }
        return null;
    }
    function landingTick() {
        const l = landing;
        if (!l) return;
        l.t += 30;
        const Pm = P();
        const w0 = l.gate ? null : waterCellNear(l.pt);
        if (l.t === 30) {
            // the signs: a bark (the dog), the surf booming, rings on the water, a dark patch
            if (!l.pt.gate) { ringsAt(w0.x, w0.y, 3); T.audio.se("Water1", { volume: 70, pitch: 65 }); }
            try { const Dg = T.api("Dog"); if (Dg && Dg.bark) Dg.bark(); else T.audio.se("Dog", { volume: 60, pitch: 90 }); } catch (e) { /* no dog */ }
        }
        if (l.t === 150 && !l.pt.gate) { ringsAt(w0.x, w0.y, 4); T.audio.se("Water2", { volume: 80, pitch: 70 }); }
        if (l.t >= (l.forced ? 120 : 300)) { const rec = l.rec; landing = null; spawnLanding(rec, l.pt, l.n, l.map); }
    }
    function spawnLanding(rec, pt, n, map) {
        const Pm = P();
        if (!Pm) return;
        const lv = levelOf(n);
        const kinds = D.GROUP[rec.k] || { kind: rec.k, count: [rec.c, rec.c] };
        const room = D.MAX_AT_ONCE - Pm.seaList().length;
        if (room <= 0) return;
        let made = Pm.spawnGroup(kinds.kind, Math.min(room, rnd(kinds.count[0], kinds.count[1])), pt.x, pt.y, lv);
        if (kinds.with && Pm.seaList().length < D.MAX_AT_ONCE) made = made.concat(Pm.spawnGroup(kinds.with.kind, Math.min(D.MAX_AT_ONCE - Pm.seaList().length, rnd(kinds.with.count[0], kinds.with.count[1])), pt.x, pt.y, lv));
        rec.sp = 1; rec.left = made.length;
        if (!made.length) return;
        // the tracks: ~10 wet prints from the water to the place the creatures stand
        if (!rec.tr) rec.tr = tracksFrom(pt);
        Pm.marks.add(rec.tr.map(t => ({ x: t[0], y: t[1], kind: t[2] })));
        Pm.splash(pt.x + 0.5, pt.y + 0.5);
        const name = D.NAMES[rec.k] || "";
        T.popup(fill(tx("napis.wyszedl"), { nazwa: name }), { icon: 98, color: "#9fe8ff" });
        T.emit("morzeLanding", { kind: rec.k, n, map, count: made.length });
        const s = S();
        if (!s.pierwsze) firstScene(rec);
        if (!s.start) startThread("landing");
        s.ostatnia = n;
        if (made.some(c => c._kind === "wiedzma")) s.wiedzma = n;
    }
    function tracksFrom(pt) {
        const out = [], hx = $gamePlayer.x + 0.5, hy = $gamePlayer.y + 0.5;
        let x = pt.x, y = pt.y;
        const dx = hx - x, dy = hy - y, d = Math.hypot(dx, dy) || 1;
        const len = Math.min(10, Math.max(5, d - 2));
        for (let i = 0; i < 10; i++) {
            const k = i / 9 * len;
            const px = x + dx / d * k + ((i % 2) ? 0.25 : -0.25) * (-dy / d) + (hash(i, pt.x) - 0.5) * 0.3;
            const py = y + dy / d * k + ((i % 2) ? 0.25 : -0.25) * (dx / d) + (hash(i, pt.y) - 0.5) * 0.3;
            out.push([Math.round(px * 100) / 100, Math.round(py * 100) / 100, "track"]);
        }
        out.push([x + 0.2, y + 0.1, "weed"], [x - 0.3, y + 0.5, "weed"]);
        return out;
    }
    // the first time in the player's life: bars, the hero's bubble, the note that starts the thread
    function firstScene(rec) {
        const s = S();
        s.pierwsze = day();
        try { T.call("CleanHUD", "sceneBars", true); } catch (e) { /* no HUD */ }
        const SB = T.api("SpeechBubbles");
        let t = 0, h = null;
        const step = () => {
            if (!has()) return;
            if (t === 60 && SB && SB.say) SB.say($gamePlayer, tx("scena.bohater"), 200);
            if (t === 330) { try { T.call("CleanHUD", "sceneBars", false); } catch (e) { /* none */ } }
            if (t === 420) { w.mysl([tx("scena.mysl")]); if (h) h.off(); }   // (the hero's thought after the bubble and the bars, not over them)
            t++;
        };
        h = T.onMapUpdate(step, { owner: PLUGIN, name: PLUGIN + "Scena" });
    }
    function startThread(why) {
        const s = S();
        if (s.start) return;
        s.start = day();
        const p = w.pair("notatki.start"); if (p) T.call("Journal", "addNote", p[0], p[1]);
        const q = TQ(); if (q && q.autoChecks) q.autoChecks();
    }

    // ---- the morning after: the same seed lays the tracks where it "would have landed" on the map the hero comes to (no simulation)
    function morningTracks() {
        const d = day(), h = hour();
        if (!seaMap() || h < nightInfo(d, 12).rise || h >= 12) return;
        const n = d - 1;
        let rec = recordFor(n, mapId(), false);
        if (!rec) { rec = recordFor(n, mapId(), true); rec.ghost = 1; rec.sp = 1; }
        if (!rec.l) return;
        const Pm = P();
        if (!rec.pt) { const pts = shorePoints(); rec.pt = pts.length ? pts[Math.floor(hash(n, mapId() * 5) * pts.length)] : null; }
        if (!rec.pt) return;
        if (!rec.tr) { rec.tr = tracksFrom(rec.pt); }
        Pm.marks.clear();
        Pm.marks.add(rec.tr.map(t => ({ x: t[0], y: t[1], kind: t[2] })));
    }
    // the guaranteed first sign: the morning of day 10 at the harbour (Map125): a dead fisherman, wet tracks (no attack)
    function firstSign() {
        const s = S();
        if (s.rybak || mapId() !== D.FIRST.map || day() < D.FIRST.day || hour() < D.FIRST.hour) return;
        const pts = shorePoints();
        if (!pts.length) return;
        const pt = pts.slice().sort((a, b) => Math.hypot(a.x - $gamePlayer.x, a.y - $gamePlayer.y) - Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y))[0];
        const fake = { pt, tr: tracksFrom({ x: pt.x, y: pt.y }) };
        const body = [pt.x + 0.3, pt.y - 1.2, "body"];
        P().marks.add(fake.tr.map(t => ({ x: t[0], y: t[1], kind: t[2] })).concat([{ x: body[0], y: body[1], kind: "body" }]));
        s.rybak = day(); s.rybakPt = pt;
        const key = day() + ":" + mapId();
        // the morning's record of that night: a tracks-only landing
        const rec = { l: 1, k: "pierwszy", c: 0, o: 0, sp: 1, left: 0, tr: fake.tr.concat([[body[0], body[1], "body"]]), pt, ghost: 1 };
        s.noce[(day() - 1) + ":" + mapId()] = rec;
        if (!s.start) startThread("day10");
    }

    // ==================================================================
    // 6. The tick: one counter on the map, nothing while there is nothing waiting
    // ==================================================================
    let armedMap = 0;
    // W19: on the smugglers' night in the cove (and in every W19 scene there) no sea-monster roll, landing or sign (Mlyn.blocksSea)
    const mlynBlok = () => { try { return !!(window.Mlyn && window.Mlyn.blocksSea && window.Mlyn.blocksSea(mapId())); } catch (e) { return false; } };
    function arm() {
        if (mlynBlok()) return;
        // on a sea map at night, once a map entry (and once a night): the roll; the landing waits for its hour
        if (!has() || !D || !P()) return;
        town = townMap();
        if (!(seaMap() || town)) { landing = null; return; }
        const ni = nightNow();
        if (!ni.inWin) return;
        const s = S();
        if (s.koniec >= 2) return;
        const rec = recordFor(ni.n, mapId(), true);
        if (rec.l && !rec.sp && !landing) { landing = null; rec.armed = 1; }
        if (!rec.l && !rec.kr && mapId() === D.TENTACLE.map && day() >= D.CHANCE.tentacleFrom) krakenRoll(ni, rec);
    }
    function krakenRoll(ni, rec) {
        rec.kr = 1;
        const s = S();
        if (s.ostatniaMacka === ni.n - 1 && ni.n > 1) return;
        const La = L(), lit = !!(La && La.lit && La.lit());
        const share = fireShare(shorePoints());
        const pk = Math.min(0.45, D.CHANCE.tentacle * (lit ? D.MULT.lighthouse.przystan : 1) * (1 - D.MULT.fire * share));
        if (hash(ni.n * 7 + 23, mapId() * 31 + 9) < pk) { rec.mk = 1; rec.mo = hash(ni.n * 7 + 29, mapId()); }
    }
    function nightTick() {
        if (!has() || !P()) return;
        if (mlynBlok()) { landing = null; return; }
        if (landing) { if (seaMap() || townMap()) landingTick(); else landing = null; return; }   // (a forced landing - F9 - goes on by day too)
        const ni = nightNow();
        const s = S();
        if (!(seaMap() || townMap()) || !ni.inWin || s.koniec >= 2) return;
        const rec = recordFor(ni.n, mapId(), false);
        if (!rec) return;
        if (rec.l && !rec.sp && ni.off / ni.len >= rec.o) beginLanding(rec, ni.n, mapId(), false);
        else if (rec.l && !rec.sp && landing === null && rec.armed && hour() !== rec.hr && ni.off / ni.len < rec.o) { rec.hr = hour(); }
        if (rec.mk && !rec.mspawn && ni.off / ni.len >= rec.mo) spawnTentacles(rec, ni);
    }
    function spawnTentacles(rec, ni) {
        const pts = shorePoints().filter(p => !coveredPoint(p));
        if (!pts.length) { rec.mspawn = 1; return; }
        rec.mspawn = 1; S().ostatniaMacka = ni.n; S().kraken = S().kraken || day();
        const near = pts.slice().sort((a, b) => Math.hypot(a.x - $gamePlayer.x, a.y - $gamePlayer.y) - Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y)).slice(0, rnd(D.TENTACLE.count[0], D.TENTACLE.count[1]));
        for (const p of near) { const c = waterCellNear(p); P().tentacles.add(c.x, c.y); }
        T.popup(tx("napis.macki"), { icon: 98, color: "#ff9f8f" });
        T.emit("morzeLanding", { kind: "macki", n: ni.n, map: mapId(), count: near.length });
    }
    function tentaclesDone() {
        const s = S();
        if (s.krakenNoc || !P() || P().tentacles.list().length) return;
        s.krakenNoc = day();
        T.popup(tx("napis.mackiKoniec"), { top: true, color: "#9ff0a8" });
        const q = TQ(); if (q && q.autoChecks) q.autoChecks();
    }
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            nightTick();
            if (landing === null && S().kraken && P() && !P().tentacles.list().length && S().ostatniaMacka === nightNow().n && !S().krakenNoc && D.TENTACLE.map === mapId()) tentaclesDone();
            if (P() && P().marks.list().length) { const n = P().marks.seenBy(2.6); if (n) markSeen(); }
        } catch (e) { report("tick", e); }
    }, { owner: PLUGIN, name: "morze", every: 30 });
    function markSeen() {
        if (mlynBlok()) return;
        const s = S(), id = mapId();
        if (!s.slady[id]) {
            s.slady[id] = day();
            const n = Object.keys(s.slady).length;
            T.popup(fill(tx("napis.slady"), { n: Math.min(3, n) }), { icon: 98, color: "#9fe8ff" });
            if (!s.start) startThread("slady");
            const q = TQ(); if (q && q.autoChecks) q.autoChecks();
        }
    }

    // ---- the hours: dusk arms the roll, the landing waits for its hour; dawn sends them back
    T.on("hourChange", p => {
        if (!has() || !P()) return;
        try {
            const ni = nightInfo(p.day, p.hour);
            if (p.hour >= ni.rise && (p.prev === undefined || p.prev < ni.rise) && p.hour < 12) dawn();
            arm();
            if (p.hour >= 6 && p.hour < 12) { morningTracks(); firstSign(); }
            if (p.hour >= 12) P().marks.clear();
        } catch (e) { report("hourChange", e); }
    }, { owner: PLUGIN });
    function dawn() {
        const Pm = P(), n = Pm.dawn();
        if (n) T.popup(tx("napis.swit"), { top: true, color: "#9fe8ff" });
        Pm.tentacles.list().forEach(t => { t.phase = "sink"; t.t = 0; });
        Pm.watch.end();
        landing = null;
    }
    T.on("mapReady", () => {
        if (!has()) return;
        try {
            landing = null;
            town = townMap();
            const P2 = P();
            if (!P2) return;
            P2.registerAll(); P2.resolveLoot();
            P2.marks.clear();
            const d = day(), h = hour();
            if (seaMap()) {
                // tracks still lying (until noon): of last night (the morning) or of tonight's landing
                const ni = nightInfo(d, h), rec = recordFor(ni.n, mapId(), false);
                if (rec && rec.l && rec.tr && (h < 12 || ni.inWin || h >= 12 && day() === ni.n)) P2.marks.add(rec.tr.map(t => ({ x: t[0], y: t[1], kind: t[2] })));
                else if (h >= ni.rise && h < 12) morningTracks();
                if (h >= 6 && h < 12) firstSign();
                if (rec && rec.sp && rec.left > 0 && ni.inWin && !rec.done) { rec.sp = 0; rec.pt = null; }   // (he came back the same night: it comes out again)
            }
            if (town && S().wiedzmaForce) forceWitch();
            if (seaMap() || town) { arm(); watchIfMonsters(); }
        } catch (e) { report("mapReady", e); }
    }, { owner: PLUGIN });
    function watchIfMonsters() { if (town && P()) P().watch.begin(); }
    T.on("morzeLanding", () => { if (townMap() && P()) P().watch.begin(); }, { owner: PLUGIN });
    T.on("kill", e => {
        if (!e || !e.creature || !window.MorzeData || !D.KINDS[e.kind]) return;
        try {
            const ni = nightNow(), s = S(), rec = recordFor(ni.n, mapId(), false);
            if (rec) { rec.left = Math.max(0, (rec.left || 1) - 1); if (!rec.left) rec.done = 1; }
            if (e.kind === "wiedzma") { s.wiedzmaPokonana = day(); const q = TQ(); if (q && q.autoChecks) q.autoChecks(); const p = w.pair("notatki.wiedzma"); if (p) T.call("Journal", "addNote", p[0], p[1]); }
            if (e.kind === "mglak") s.perla = (s.perla || 0) + 1;
        } catch (x) { report("kill", x); }
    }, { owner: PLUGIN });
    T.on("load", () => { landing = null; for (const k of Object.keys(shoreCache)) delete shoreCache[k]; }, { owner: PLUGIN });

    // ---- the fabular night of chapter 5: the song reaches the tavern; then the first witch waits at the gate
    function forceWitch() {
        const s = S();
        s.wiedzmaForce = 0;
        const ni = nightNow();
        const rec = { l: 1, k: "wiedzma", c: 1, o: 0, sp: 0, left: 0, tr: null, forced: 1 };
        s.noce[key(ni.n, mapId())] = rec;
        beginLanding(rec, ni.n, mapId(), true);
    }
    T.on("mapReady", () => {
        if (!has() || mapId() !== D.MAP.tawerna) return;
        const s = S(), q = TQ(), r = q && q.rec ? q.rec("W23") : null;
        if (!r || r.s !== "active" || s.piesn || s.piesnScena || day() < 40 && !s.forcePiesn) return;
        const ni = nightNow();
        if (!ni.inWin) return;
        const step = w.stepOf ? w.stepOf("W23") : null;
        if (!w.at("w23Piesn")) return;
        s.piesnScena = day();
        piesnWTawernie();
    }, { owner: PLUGIN });
    function piesnWTawernie() {
        const SB = T.api("SpeechBubbles"), s = S();
        const talk = [["borgar", "scena.piesn.borgar"], ["melia", "scena.piesn.melia"], ["ozzy", "scena.piesn.ozzy"]];
        let i = 0, t = 0, h = null;
        T.audio.se("Saint3", { volume: 50, pitch: 70 });
        const step = () => {
            if (!has() || mapId() !== D.MAP.tawerna) { if (h) h.off(); return; }
            if (++t % 150 === 0 && i < talk.length) {
                const ev = evOf(talk[i][0]);
                if (ev && SB && SB.say) SB.say(ev, tx(talk[i][1]), 180);
                i++;
            }
            if (t > 700) { if (h) h.off(); s.wiedzmaForce = 1; w.mysl([tx("scena.piesn.mysl")]); }
        };
        h = T.onMapUpdate(step, { owner: PLUGIN, name: PLUGIN + "Piesn" });
    }
    function evOf(who) {
        const Lf = T.api("TownLife");
        let ev = Lf && Lf.eventOf ? Lf.eventOf(who) : null;
        if (ev) return ev;
        const TLf = T.api("TavernLife");
        try { if (TLf && TLf.eventOf) ev = TLf.eventOf(who); } catch (e) { ev = null; }
        return ev || null;
    }

    // ==================================================================
    // 7. The hooks of the thread
    // ==================================================================
    const item = name => (window.$dataItems || []).find(i => i && i.name === name) || null;
    const count = name => { const it = item(name); return it ? $gameParty.numItems(it) : 0; };
    const note = (k, vars) => { const p = w.pair("notatki." + k, vars || {}); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const recheck = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    function ringBell(n) {
        let i = 0, t = 0, h = null;
        h = T.onMapUpdate(() => { if (++t % 70 === 0) { T.audio.se("Bell1", { volume: 80, pitch: 62 }); if (++i >= n && h) h.off(); } }, { owner: PLUGIN, name: PLUGIN + "Dzwon" });
    }
    w.haki({
        morzeStart: () => !!S().start,
        w23Zmienne: () => {
            const s = S(), n = Object.keys(s.slady).length + (s.zapisy.roch && !s.slady[D.MAP.przystan] ? 0 : 0);
            return { n: Math.min(3, n), dzien: S().dzwonDzien || "-", dni: Math.max(0, D.BELL_DAYS - (day() - (s.dzwonDzien || 0))),
                zapisy: Object.keys(s.zapisy3).filter(k => s.zapisy3[k]).length, ciag: ciag(), wybor: s.wybor || "-" };
        },
        zapis3: (ctx, who, k) => {
            const s = S();
            s.zapisy[who] = 1;
            if (who === "roch") { s.slady[D.MAP.przystan] = s.slady[D.MAP.przystan] || day(); }
            T.popup(fill(tx("napis.slady"), { n: Math.min(3, Object.keys(s.slady).length) }), { icon: 98, color: "#9fe8ff" });
            if (who === "roch") note("roch");
            recheck();
        },
        dzwonOddany: () => {
            const s = S();
            s.dzwon = 1; s.dzwonDzien = day();
            ringBell(7);
            note("dzwon", { dni: D.BELL_DAYS });
            T.popup(fill(tx("napis.dzwon"), { p: Math.round((1 - D.MULT.bell) * 100) }), { top: true, color: "#9ff0a8" });
        },
        mglyOddane: () => { const s = S(); s.mgly = day(); note("mgly"); T.popup(tx("napis.mgly"), { top: true, color: "#9ff0a8" }); },
        maAtrament: () => count(D.ITEM_NAMES.atrament) >= 1,
        maWodorosty: () => count(D.ITEM_NAMES.wodorost) >= 3,
        kleofas: (ctx, how) => {
            const s = S();
            if (how === "atrament") { const it = item(D.ITEM_NAMES.atrament); if (it) $gameParty.loseItem(it, 1); }
            else { const it = item(D.ITEM_NAMES.wodorost); if (it) $gameParty.loseItem(it, 3); }
            s.kleofas = day();
            note("kleofas");
            recheck();
        },
        meliaPo: () => {
            const s = S();
            s.piesn = s.piesn || day();
            const it = item(D.ITEM_NAMES.muszla); if (it && $gameParty.numItems(it) < 1) $gameParty.gainItem(it, 1);
            T.call("TavernLife", "addTrust", "melia", 5);
            note("piesn");
            recheck();
        },
        zapisyGotowe: () => !!w.at("w23Zapisy") || Object.keys(S().zapisy3).length > 0,
        zapis: (ctx, who) => {
            const s = S();
            s.zapisy3[who] = day();
            T.popup(fill(tx("napis.zapis"), { n: Object.keys(s.zapisy3).filter(k => s.zapisy3[k]).length }), { icon: 98, color: "#ffe9a8" });
            if (Object.keys(s.zapisy3).length >= 3) note("zapisy", { ciag: ciag() });
            recheck();
        },
        krakenPo: () => !!S().krakenNoc,
        wybor: (ctx, how) => {
            const s = S();
            s.wybor = how; s.koniec = 1;
            if (how === "odsunac") { s.straz = 1; note("odsunac"); }
            else if (how === "odciac") { note("odciac"); }
            else { note("zostawic"); }
            recheck();
        },
        f9Przygotuj: ctx => {
            const k = Number(ctx.skok) || 1, s = S();
            if (!s.start) s.start = day();
            if (k >= 2 && day() < 10) $gameSystem._dayNightDay = 10;
            if (k >= 2) for (const m of [D.MAP.przystan, D.MAP.jar, D.MAP.laka]) s.slady[m] = s.slady[m] || day();
            if (k >= 3) { s.dzwon = 1; s.dzwonDzien = day(); }
            if (k >= 4) s.mgly = day();
            if (k >= 5) { s.kleofas = day(); s.forcePiesn = 1; if (day() < 40) $gameSystem._dayNightDay = 40; }
            if (k >= 6) { s.wiedzmaPokonana = day(); s.piesn = day(); }
            if (k >= 7) { s.zapisy3 = { garnizon: day(), lord: day(), kronika: day() }; if (day() < 60) $gameSystem._dayNightDay = 60; }
            if (k === 7) { s.krakenNoc = 0; }
        }
    });
    // the pull of the Heart (chapter 6): the days since the cellar was opened + the floors the hero went down to
    function ciag() {
        const U = T.api("Underground");
        let floors = 0;
        try { floors = U && U.deepest ? U.deepest() : 0; } catch (e) { floors = 0; }
        return Math.max(0, day() - 3) + floors;
    }

    // ==================================================================
    // 8. F9 (Okolice.f9: the section "Potwory z morza")
    // ==================================================================
    const F9KIND = ["topielec_morski", "krab_olbrzym", "rybolaki", "mglak", "wiedzma", "macki"];
    const F9DAYS = [1, 20, 40, 60];
    let f9Kind = 0, f9Day = 0;
    function show() {
        if (!has()) return "";
        const ni = nightNow(), c = chanceOf({ day: ni.n || day() });
        const parts = c.parts.map(p => p[0] + " x" + p[1]).join(", ");
        const rec = recordFor(ni.n, mapId(), false);
        return fill(tx("f9.szansa"), { dzien: day(), p: Math.round(c.p * 1000) / 10, P: Math.round(c.P * 1000) / 10, m: parts || "-", los: rec ? (rec.l ? rec.k : "nie") : "-" });
    }
    function forceKind(kind) {
        if (!has() || !P()) return tx("f9.brak");
        const ni = nightNow();
        if (kind === "macki") {
            if (mapId() !== D.TENTACLE.map) return tx("f9.tylkoPrzystan");
            const pts = shorePoints();
            const near = pts.slice().sort((a, b) => Math.hypot(a.x - $gamePlayer.x, a.y - $gamePlayer.y) - Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y)).slice(0, 3);
            for (const p of near) { const c = waterCellNear(p); P().tentacles.add(c.x, c.y); }
            S().ostatniaMacka = ni.n;
            return tx("f9.macki");
        }
        if (!seaMap() && !townMap()) return tx("f9.nieMorze");
        town = townMap();
        P().registerAll(); P().resolveLoot();
        const rec = { l: 1, k: kind, c: kind === "topielec_morski" || kind === "krab_olbrzym" ? 1 : 1, o: 0, sp: 0, left: 0, tr: null, forced: 1 };
        S().noce[key(ni.n, mapId())] = rec;
        beginLanding(rec, ni.n, mapId(), true);
        return fill(tx("f9.laduja"), { nazwa: D.NAMES[kind] });
    }
    function f9Rows() {
        const K = F9KIND[f9Kind], DD = F9DAYS[f9Day];
        return [
            { label: tx("f9.pokaz.label"), icon: 98, desc: tx("f9.pokaz.desc"), what: "show" },
            { label: fill(tx("f9.zrob.label"), { nazwa: D.NAMES[K] }), icon: 98, desc: tx("f9.zrob.desc"), what: "force", pick: f9Kind },
            { label: fill(tx("f9.dzien.label"), { d: DD }), icon: 98, desc: tx("f9.dzien.desc"), what: "day", pick: f9Day },
            { label: tx("f9.mgla.label"), icon: 98, desc: tx("f9.mgla.desc"), what: "fog" },
            { label: tx("f9.czysc.label"), icon: 98, desc: tx("f9.czysc.desc"), what: "clear" },
            { label: tx("f9.swit.label"), icon: 98, desc: tx("f9.swit.desc"), what: "dawn" }
        ];
    }
    function f9Pick(row, delta) {
        if (row.what === "force") { f9Kind = (f9Kind + delta + F9KIND.length) % F9KIND.length; row.pick = f9Kind; row.label = fill(tx("f9.zrob.label"), { nazwa: D.NAMES[F9KIND[f9Kind]] }); }
        if (row.what === "day") { f9Day = (f9Day + delta + F9DAYS.length) % F9DAYS.length; row.pick = f9Day; row.label = fill(tx("f9.dzien.label"), { d: F9DAYS[f9Day] }); }
    }
    function f9Ok(row) {
        if (!has()) return { say: tx("f9.brak"), bad: true };
        switch (row.what) {
            case "show": return { say: show() };
            case "force": return { say: forceKind(F9KIND[f9Kind]) };
            case "day": $gameSystem._dayNightDay = F9DAYS[f9Day]; return { say: fill(tx("f9.dzien.ok"), { d: F9DAYS[f9Day] }) };
            case "fog": { const La = L(); if (La && La.forceFog) La.forceFog(); else if (window.Sky && Sky.forceMist) Sky.forceMist(0.9); return { say: tx("f9.mgla.ok") }; }
            case "clear": { S().noce = {}; landing = null; if (P()) { P().marks.clear(); P().tentacles.clear(); } S().ostatnia = 0; S().ostatniaMacka = 0; S().ostatniaWiedzma = 0; return { say: tx("f9.czysc.ok") }; }
            case "dawn": dawn(); return { say: tx("f9.swit.ok") };
        }
        return null;
    }
    (function reg() {
        const add = () => { const O = T.api("Okolice"); if (O && O.f9 && O.f9.add) { O.f9.add({ owner: PLUGIN, get title() { return tx("f9.tytul"); }, rows: f9Rows, pick: f9Pick, ok: f9Ok }); return true; } return false; };
        if (!add()) T.on("mapReady", function once() { if (add()) T.off && T.off("mapReady", once); }, { owner: PLUGIN + "F9" });
    })();

    // ==================================================================
    // 9. API
    // ==================================================================
    window.Morze = T.register(PLUGIN, {
        D, state: S, chance: ctx => chanceOf(ctx), baseP, decide, nightInfo, night: nightNow, shorePoints, fireShare, seaMap, townMap, recordFor, key,
        force: forceKind, show, arm, dawn, nightTick, landingTick, startThread, ciag, bellOn, levelOf,
        get landing() { return landing; }, set landing(v) { landing = v; },
        spawnTentacles: () => forceKind("macki"),
        reset: () => { S().noce = {}; landing = null; }
    });
})();
