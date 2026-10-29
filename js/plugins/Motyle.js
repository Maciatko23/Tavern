//=============================================================================
// Motyle.js
//=============================================================================
// Butterflies by day and moths by night (the user's whole package, 2026-10-18):
//   - butterflies on the flowery maps in spring and summer (a few in autumn, none in winter), by day, at the flowers: the flowery
//     tiles of the tilesets, the flowering bushes, Farming's wild plants, flowering potatoes, fruit trees in bloom, cabbages; none in
//     rain or a storm (they hide), more for a day after rain, fewer in a drought; the wind (Storm.wind + the plants' breeze) carries
//     them; a zigzag flight with soft turns; on a flower they open and shut their wings slowly
//   - four kinds (cytrynek, pawik, modraszek, bielinek) and a moth; the peacock only at dawn after rain; the cabbage white at cabbages
//   - a running hero scares them off; standing still or sneaking (C) one may land on his shoulder - or on his raven (Kruk.js)
//   - moths at night round every fire (campfire, torch in the hand or stuck in the ground, lanterns, braziers): small, flickering in
//     the firelight, kept off the flame's middle
//   - the net (item 180, the workbench): O at a butterfly swings it (Hero_Net), the caught kind goes into the journal's display case
//     ("Gablotka") and the butterfly is let go; the quest K54 (Ela) keeps a peacock in the net till dusk
//   - pollination (flowering crops, fruit trees, the hive - small bonuses) and the cabbage whites nibbling cabbages (a scarecrow or the
//     raven guarding the field keeps them off)
// Data and texts: Motyle_Data.js (above it in js/plugins.js). Not saved: the insects themselves (like Birds.js's flocks); saved
// (Tawerna.state "motyle"): the display case, the chronicle, the nibbled cabbages.

/*:
 * @target MZ
 * @plugindesc Motyle za dnia i ćmy nocą przy ogniu, siatka na motyle, gablotka w Dzienniku, zapylanie, bielinki na kapuście, K54. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Motyle_Data
 *
 * @param enabled
 * @text Motyle włączone
 * @type boolean
 * @default true
 *
 * @help
 * MOTYLE (mapy pod niebem z kwiatami; wiosna i lato, jesienią pojedyncze)
 *   Cytrynek, pawik (rzadki: tylko o świcie po deszczu), modraszek, bielinek
 *   (lubi kapustę). Lądują na kwiatach z kafelków, kwitnących krzakach,
 *   ziołach z ziemi, kwitnących ziemniakach i drzewach owocowych (wiosną).
 *   W deszcz i burzę chowają się; po deszczu jest ich więcej przez dobę, w suszę
 *   mniej. Wiatr znosi ich lot. Biegnący bohater je płoszy; gdy stoi albo się
 *   skrada (C), czasem motyl siada mu na ramieniu albo na kruku.
 * ĆMY: nocą krążą wokół ognia (ognisko, pochodnia, latarnia, kosz ogniowy).
 * SIATKA (przedmiot 180, warsztat: 2 gałęzie + 3 włókna): O przy motylu -
 *   zamach siatką. Złapany gatunek trafia do gablotki (Dziennik, dział
 *   „Gablotka”), a motyl odlatuje wolny.
 * ZAPYLANIE: ziemniaki i drzewa owocowe przy kwiatach dają czasem 1 sztukę
 *   więcej (35% razy siła zapylenia), ul - słoik miodu więcej (15% na słoik).
 *   Bielinki podgryzają kapustę (-1 główka, nigdy ostatnia); strach na wróble
 *   i kruk pilnujący pola je odpędzają.
 * F9 (Zdarzenia): „Motyle teraz”, „Ćmy przy ogniu (noc)”, „Daj siatkę”.
 * Stan w zapisie: Tawerna.state("motyle"). Dane: Motyle_Data.js.
 */

(() => {
    "use strict";
    const TK = Watki.teksty("motyle");   // (the words of this file: js/teksty/motyle.txt, kod.*)

    const PLUGIN = "Motyle";
    const T = window.Tawerna;
    if (!T) throw new Error("Motyle.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const D = window.MotyleData;
    const w = Watki.get("motyle");   // (the thread: Motyle_Data.js - K54, Kleofas's chronicle)
    if (!D) throw new Error("Motyle.js: brak Motyle_Data.js - musi stać wyżej na liście wtyczek (the butterflies' data is missing)");
    // (2026-10-23) the words: js/teksty/motyle.txt (D.TX; D.TX.kod - the words of this file)
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const params = PluginManager.parameters(PLUGIN);
    const ENABLED = params.enabled !== "false";
    const SP = D.SPECIES, ORDER = D.ORDER, SH = D.SHEET;

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const smooth = t => { const k = clamp(t, 0, 1); return k * k * (3 - 2 * k); };
    const TW = () => $gameMap.tileWidth(), TH = () => $gameMap.tileHeight();
    const day = () => T.time.day(), hour = () => T.time.hour(), season = d => T.time.season(d);
    function hash(n, salt) {
        let h = Math.imul(n | 0, 374761393) ^ Math.imul(salt | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const h2 = (x, y, s) => hash(x * 7919 + y * 104729, s);
    function pickWeighted(table) {
        let sum = 0;
        for (const [, w] of table) sum += Math.max(0, w);
        if (sum <= 0) return null;
        let r = Math.random() * sum;
        for (const [v, w] of table) { if ((r -= Math.max(0, w)) <= 0) return v; }
        return table[table.length - 1][0];
    }
    const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
    const itemOf = id => (window.$dataItems ? $dataItems[id] : null);
    const kindIcon = k => (D.ICON.kinds && D.ICON.kinds[k]) || D.ICON.butterfly;   // (each kind its own icon: IconSet's new row 448-452)
    const nameOf = k => (SP[k] ? SP[k].name : k);

    // the saved state: the display case (the first day each kind was caught, how many times), the chronicle (the kinds brother Kleofas
    // wrote down, his reward), the cabbages the whites nibbled, the day a peacock went into the net (K54)
    const store = T.state.define("motyle", () => ({ caught: {}, counts: {}, kron: {}, kronDone: false, nibble: {}, pawikNet: 0, stats: { swings: 0, caught: 0, missed: 0 } }),
        { version: 1, owner: PLUGIN });

    // ------------------------------------------------------------------
    // The world: under the sky, not the underground, the weather, the hour, the sun
    // ------------------------------------------------------------------
    const outdoors = () => !!T.call("Survival", "isOutdoors");
    const underground = () => { const U = T.api("Underground"); try { return !!(U && U.isUnderground && U.isUnderground($gameMap.mapId())); } catch (e) { return false; } };
    const planOf = d => T.call("Survival", "weatherPlan", d) || null;
    function rainingNow() {
        const p = planOf(day()), h = hour();
        return !!p && h >= p.start && h < p.end;
    }
    const stormLevel = () => Number(T.call("Survival", "stormLevel", day(), hour())) || 0;
    // hours since the last rain ended (0 while it rains, Infinity: none in the last days)
    function hoursSinceRain() {
        const d0 = day(), now = d0 * 24 + hour();
        for (let d = d0; d >= Math.max(1, d0 - 3); d--) {
            const p = planOf(d);
            if (!p || p.type !== "rain") continue;
            const s = d * 24 + p.start, e = d * 24 + p.end;
            if (s > now) continue;
            return now < e ? 0 : now - e;
        }
        return Infinity;
    }
    // the days without rain before today (the same rule as TownQuests.dryDays: a day with a rain plan ends the count; rain today
    // that has begun - 0)
    function dryDays() {
        const p0 = planOf(day());
        if (p0 && p0.type === "rain" && hour() >= p0.start) return 0;
        let n = 0;
        for (let d = day() - 1; d >= 1 && n < 30; d--) { const p = planOf(d); if (p && p.type === "rain") break; n++; }
        return n;
    }
    let sunCache = { d: -1, t: { rise: 6, set: 20 } };
    function sunOf(d) {
        if (sunCache.d !== d) {
            const S = T.api("Sun") || window.Sky;
            let t = { rise: 6, set: 20 };
            try { if (S && S.sunTimes) t = S.sunTimes(d); } catch (e) { /* (no sky: the defaults) */ }
            sunCache = { d, t };
        }
        return sunCache.t;
    }
    const nightAmount = () => { const F = window.Farming; try { return F && F.nightAmount ? F.nightAmount() : (T.time.isNight() ? 1 : 0); } catch (e) { return 0; } };
    const wind = () => (window.Storm && Storm.wind ? Storm.wind() : 0);
    function gustNoise(s) { return 0.5 * Math.sin(s) + 0.3 * Math.sin(2.13 * s + 1.7) + 0.2 * Math.sin(4.37 * s + 0.4); }

    // ------------------------------------------------------------------
    // The map: how many live here and where (D.MAPS; a map's own <Motyle:off> / <Motyle:0.5> wins)
    // ------------------------------------------------------------------
    let force = null;   // the F9 row: { until (frame), season, afterRain }
    function profileOf(mapId) {
        if (!window.$dataMap || !outdoors() || underground()) return null;
        const tag = T.mapTag("Motyle");
        if (tag) {
            const v = tag.pos[0];
            if (v === "off" || v === 0) return null;
            if (typeof v === "number" && v > 0) return Object.assign({ name: "mapa" }, D.MAPS[mapId] || {}, { k: v });
        }
        const m = D.MAPS[mapId];
        if (m) return m.k > 0 ? m : null;
        if (D.WILD.tilesets.includes($dataMap.tilesetId)) return { k: D.WILD.k, name: "dzicz" };
        return null;
    }
    let prof = null, profMap = -1;
    function profile() {
        const id = $gameMap.mapId();
        if (profMap !== id) { profMap = id; prof = profileOf(id); }
        if (force && Graphics.frameCount < force.until) return prof || { k: 1, name: "F9" };
        return prof;
    }
    // a tile where they may be (the knights' garden of the town, the bought land of a home)
    function zoneOk(p, x, y) {
        if (!p) return false;
        if (p.zone) { const [x0, y0, x1, y1] = p.zone; if (x < x0 || x > x1 || y < y0 || y > y1) return false; }
        if (p.region) {
            const F = window.Farming, br = F && F.buildRegion ? F.buildRegion() : 0;
            if (!br || $gameMap.regionId(x, y) !== br || !(F.landOwned && F.landOwned($gameMap.mapId()))) return false;
        }
        return true;
    }

    // ---- the flowers (landing spots): { x, y (the ground point, map px), z (px up to the bloom), kind: flower | nettle | crop |
    // cabbage | tree | ground, tx, ty (the tile), plant (a swaying plant of the ground: its tip moves), w (weight), guard }
    let spots = [], spotsKey = null, spotsWait = 0;
    const A2_FROM = 2816, A2_TO = 4352;
    function buildSpots() {
        const out = [], p = profile(), mapId = $gameMap.mapId();
        if (!p || !window.$dataMap) { spots = out; return true; }
        const tw = TW(), th = TH(), W = $gameMap.width(), H = $gameMap.height(), data = $dataMap.data || [];
        const A2 = new Set(D.FLOWERS.a2), UP = new Set(D.FLOWERS.upper), TALL = new Set(D.FLOWERS.tall);
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                if (!zoneOk(p, x, y)) continue;
                let fl = false, z = 4;
                for (const L of [0, 1]) {
                    const t = data[(L * H + y) * W + x];
                    if (t >= A2_FROM && t < A2_TO && A2.has(Math.floor((t - A2_FROM) / 48))) fl = true;
                }
                for (const L of [2, 3]) {
                    const t = data[(L * H + y) * W + x];
                    if (UP.has(t)) { fl = true; z = TALL.has(t) ? 16 : 8; }
                }
                if (fl) out.push({ x: (x + 0.25 + 0.5 * h2(x, y, 11)) * tw, y: (y + 0.55 + 0.35 * h2(x, y, 12)) * th, z, kind: "flower", tx: x, ty: y, w: 1 });
            }
        }
        // the flowering bushes; the fruit trees in bloom (spring)
        const CT = T.api("ChoppableTree"), spring = season() === 0;
        for (const ev of $gameMap.events()) {
            if (!ev || !zoneOk(p, ev.x, ev.y)) continue;
            const name = ev.characterName ? ev.characterName() : "";
            if (D.FLOWERS.events.test(name)) out.push({ x: (ev.x + 0.5) * tw + rand(-8, 8), y: (ev.y + 0.9) * th, z: 16, kind: "flower", tx: ev.x, ty: ev.y, w: 1.2 });
            else if (spring && CT && CT.treeConfig && /^!\$Tree_(Apple|Pear|FruitBare)/.test(name)) {
                const cfg = CT.treeConfig(ev), on = ch => $gameSelfSwitches.value([ev._mapId, ev._eventId, ch]);
                if (cfg && cfg.fruit && !on("A") && !on("B")) out.push({ x: (ev.x + 0.5) * tw + rand(-24, 24), y: (ev.y + 1) * th - 2, z: rand(64, 92), kind: "tree", tx: ev.x, ty: ev.y, w: 1.5 });
            }
        }
        // the wild plants of the ground (Farming_Render's swaying ones: the bloom on the tip moves with the wind)
        const set = SceneManager._scene && SceneManager._scene._spriteset, layer = set && set._stoneLayer, F = window.Farming;
        if (layer && F && F.gatherAt) {
            if (!layer._stamp) return false;   // (not built yet: again in a moment)
            for (const e of layer._swaying || []) {
                if (!e.key) continue;
                const [x, y] = e.key.split(",").map(Number);
                if (!zoneOk(p, x, y)) continue;
                const kind = F.gatherAt(x, y), share = D.FLOWERS.gather[kind];
                if (share === undefined) continue;
                out.push({ x: e.gx, y: e.gy, z: Math.max(6, (e.h || 16) - 4), kind: kind === "nettle" ? "nettle" : "flower", tx: x, ty: y, plant: e, w: share });
            }
        }
        // the crops: potatoes in flower, the cabbages (the cabbage whites)
        const plots = F && F.farm ? (F.farm().plots[mapId] || {}) : {};
        for (const k of Object.keys(plots)) {
            const plot = plots[k];
            if (!plot || !plot.crop) continue;
            const [x, y] = k.split(",").map(Number);
            const fc = D.FLOWERS.crops[plot.crop];
            if (fc && F.cropStage && F.cropStage(x, y, plot) >= fc.from) out.push({ x: (x + 0.5) * tw, y: (y + 0.85) * th, z: fc.z, kind: "crop", tx: x, ty: y, w: 0.9 });
            else if (plot.crop === D.FLOWERS.cabbage && (!F.cropStage || F.cropStage(x, y, plot) >= 1)) out.push({ x: (x + 0.5) * tw, y: (y + 0.85) * th, z: 9, kind: "cabbage", tx: x, ty: y, w: 1, guard: guardedAt(mapId, x, y) });
        }
        spots = out;
        return true;
    }
    function spotsStamp() {
        const F = window.Farming;
        return $gameMap.mapId() + ":" + day() + ":" + (F && F.gatherRev ? F.gatherRev() : 0) + ":" + (F && F.farm ? F.farm().rev : 0) + ":" + season();
    }
    function refreshSpots(now) {
        if (!now && --spotsWait > 0) return;
        spotsWait = 120;
        const key = spotsStamp();
        if (key === spotsKey) return;
        if (buildSpots()) spotsKey = key; else spotsWait = 10;
    }
    // a scarecrow (radius 3) or the raven guarding the field (Birds.guarded, Kruk.guards)
    function guardedAt(mapId, x, y) {
        const B = T.api("Birds"), K = T.api("Kruk");
        try { if (B && B.guarded && B.guarded(mapId, x, y)) return true; } catch (e) { /* (no birds) */ }
        try { if (K && K.guards && K.guards(mapId, x, y)) return true; } catch (e) { /* (no raven) */ }
        return false;
    }
    // the flower spots within r tiles of a tile (crops, fruit trees and wild flowers count; cabbages do not flower)
    function flowersNear(x, y, r) {
        const tw = TW(), th = TH();
        let n = 0;
        for (const s of spots) if (s.kind !== "cabbage" && s.kind !== "ground" && Math.hypot(s.x / tw - (x + 0.5), s.y / th - (y + 0.85)) <= r) n++;
        return n;
    }

    // ------------------------------------------------------------------
    // How many should fly now (the season, the hour, the weather)
    // ------------------------------------------------------------------
    function dayFactor(h, d) {
        const s = sunOf(d), a = s.rise + 1, b = s.rise + 3, c = s.set - 3, e = s.set - 0.75;
        if (h <= a || h >= e) return 0;
        if (h < b) return smooth((h - a) / (b - a));
        if (h > c) return smooth((e - h) / (e - c));
        return 1;
    }
    // the graphics' quality (Wydajnosc.js, Opcje -> Jakość grafiki): gfx.critters - the share of the butterflies wanted and of the
    // moths at the fires at once (1 Wysoka, 0.5 Średnia, about a third Niska)
    const critterShare = () => { const W = T.api("Wydajnosc"), k = W && W.gfx && typeof W.gfx.critters === "number" ? W.gfx.critters : 1; return Math.max(0, Math.min(1, k)); };
    // { k, n, why }: n butterflies on the map round the screen
    function wanted() {
        const p = profile();
        if (!ENABLED || !p) return { n: 0, why: TK.kod.wanted[0] };
        const forced = !!(force && Graphics.frameCount < force.until);
        const s = forced ? force.season : season();
        let k = p.k * D.SEASON_K[s];
        if (k <= 0) return { n: 0, why: "zima" };
        const hk = forced ? 1 : dayFactor(hour(), day());
        if (hk <= 0) return { n: 0, why: "noc" };
        let wk = 1, why = "pogoda";
        if (!forced) {
            if (rainingNow()) return { n: 0, why: "deszcz" };
            if (stormLevel() > 0) { wk *= D.WEATHER.gather; why = TK.kod.wanted[1]; }
            const since = hoursSinceRain();
            if (since > 0 && since <= D.WEATHER.afterRainHours) { wk *= D.WEATHER.afterRain; why = TK.kod.wanted[2]; }
            const dd = dryDays();
            if (dd >= D.WEATHER.dry2[0]) { wk *= D.WEATHER.dry2[1]; why = "susza"; } else if (dd >= D.WEATHER.dry1[0]) { wk *= D.WEATHER.dry1[1]; why = "sucho"; }
            if (wind() >= D.WEATHER.windy[0]) wk *= D.WEATHER.windy[1];
        } else { wk *= D.WEATHER.afterRain; why = "F9"; }
        const near = spotsNearView(), fk = forced ? 1 : Math.min(1, near / 5);
        let n = Math.round(D.LIMITS.base * k * hk * wk * fk * critterShare());
        if (s === 2) n = Math.min(n, D.LIMITS.autumnMax);
        return { n: clamp(n, 0, D.LIMITS.max), k, hk, wk, near, why };
    }
    // the screen and a margin round it (map px)
    function view(margin) {
        const tw = TW(), th = TH(), m = (margin || 0) * tw;
        const x0 = $gameMap.displayX() * tw, y0 = $gameMap.displayY() * th;
        return { x0: x0 - m, y0: y0 - m, x1: x0 + T.view.w() + m, y1: y0 + T.view.h() + m };   // (the world's view: Tawerna.view)
    }
    const inView = (v, x, y) => x >= v.x0 && x <= v.x1 && y >= v.y0 && y <= v.y1;
    function spotsNearView() {
        const v = view(4);
        let n = 0;
        for (const s of spots) if (s.kind !== "ground" && inView(v, s.x, s.y)) n++;
        return n;
    }

    // ------------------------------------------------------------------
    // The insects
    // ------------------------------------------------------------------
    // { kind, x, y (the ground point, map px), z (px up), vx, vy, h (heading), state: fly | sit | flee | shoulder | leave | hide |
    //   released | orbit (a moth) | come | go, t, ph, tx, ty, tz, spot, sit: {...}, free (frames it ignores everything), alpha, holder,
    //   spr, shadow, moth: { light, a, rx, ry, w } }
    let flyers = [], moths = [];
    let shoulderB = null;
    let heroStill = 0, pawikDay = {};
    const SPEED_K = 1;
    function newInsect(kind, x, y, z) {
        return { kind, x, y, z, vx: 0, vy: 0, h: rand(0, Math.PI * 2), state: "fly", t: 0, ph: rand(0, 6.283), tx: x, ty: y, tz: z, spot: null, sit: null,
            free: 0, alpha: 1, glide: 0, nib: 0, holder: null, spr: null, shadow: null, moth: null, wait: 0 };
    }
    const occupied = s => flyers.some(b => b.spot === s && (b.state === "sit" || b.state === "fly"));
    // a spot to fly to: near (within `r` tiles), not taken; the kind's likes weigh more (the cabbage white: cabbages; the peacock: nettles)
    function chooseSpot(b, r, awayFrom) {
        const tw = TW(), th = TH(), likes = (SP[b.kind] && SP[b.kind].likes) || [];
        const table = [];
        for (const s of spots) {
            if (s.kind === "cabbage" && (s.guard || b.kind !== "bielinek")) continue;
            if (s.kind === "nettle" && b.kind !== "pawik" && Math.random() < 0.5) continue;
            const d = Math.hypot(s.x - b.x, s.y - b.y) / tw;
            if (d > r || occupied(s)) continue;
            if (awayFrom && Math.hypot(s.x / tw - awayFrom.x, s.y / th - awayFrom.y) < 3) continue;
            let w = (s.w || 1) * (1 / (1 + d * 0.25));
            if (likes.includes(s.kind)) w *= 6;
            table.push([s, w]);
        }
        return table.length ? pickWeighted(table) : null;
    }
    function wanderPoint(b, r) {
        const tw = TW(), th = TH();
        for (let i = 0; i < 12; i++) {
            const a = rand(0, Math.PI * 2), d = rand(1.5, r) * tw, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d * 0.8;
            const tx = Math.floor(x / tw), ty = Math.floor(y / th);
            if ($gameMap.isValid(tx, ty)) return { x, y };
        }
        return { x: b.x, y: b.y };
    }
    function flyTo(b, s) {
        b.spot = s || null;
        if (s) { b.tx = s.x; b.ty = s.y; } else { const w = wanderPoint(b, 5); b.tx = w.x; b.ty = w.y; }
        b.tz = rand(14, 34);
        if (b.state !== "flee" && b.state !== "released") b.state = "fly";
        b.sit = null;
    }
    function heroPoint() { return { x: $gamePlayer._realX + 0.5, y: $gamePlayer._realY + 0.9 }; }
    // the kind of a new butterfly (by the season; a spot it likes may decide it)
    function kindFor(spot) {
        const forced = !!(force && Graphics.frameCount < force.until), s = forced ? force.season : season();
        if (spot && spot.kind === "cabbage") return "bielinek";
        const table = ORDER.filter(k => !SP[k].rare && !SP[k].night).map(k => [k, SP[k].season[s]]);
        return pickWeighted(table) || "bielinek";
    }
    // a new butterfly: sitting on a spot (the map just came up), or flying in from beyond the screen's edge to a spot
    function spawn(kind, opts) {
        const o = opts || {}, tw = TW(), th = TH();
        const b = newInsect(kind || "cytrynek", 0, 0, 20);
        let s = o.spot || null;
        if (!s && !o.at) {
            const v = view(3), near = spots.filter(p => inView(v, p.x, p.y) && !occupied(p) && (p.kind !== "cabbage" || ((kind === "bielinek" || !kind) && !p.guard)));
            const liked = near.filter(p => ((SP[b.kind] && SP[b.kind].likes) || []).includes(p.kind));
            s = liked.length && Math.random() < 0.8 ? pick(liked) : near.length ? pick(near) : null;
        }
        if (!kind) b.kind = kindFor(s);
        if (o.at) {
            b.x = o.at.x; b.y = o.at.y; b.z = o.at.z || 24;
        } else if (o.sitting && s) {
            b.x = s.x; b.y = s.y; b.z = s.z;
        } else {
            // from beyond the edge of the screen nearest to the spot (or round the hero)
            const v = view(0), aim = s || { x: ($gamePlayer._realX + 0.5) * tw + rand(-4, 4) * tw, y: ($gamePlayer._realY + 1) * th + rand(-3, 3) * th };
            const side = pick(["l", "r", "t", "b"]);
            b.x = side === "l" ? v.x0 - tw : side === "r" ? v.x1 + tw : clamp(aim.x + rand(-3, 3) * tw, v.x0, v.x1);
            b.y = side === "t" ? v.y0 - th : side === "b" ? v.y1 + th : clamp(aim.y + rand(-2, 2) * th, v.y0, v.y1);
            b.z = rand(24, 40);
        }
        flyers.push(b);
        if (o.state) { b.state = o.state; b.free = o.free || 0; b.fleeT = o.fleeT || 150; const w = wanderPoint(b, 7); b.tx = w.x; b.ty = w.y; b.tz = 40; }
        else if (o.sitting && s) land(b, s);
        else flyTo(b, s);
        return b;
    }
    function land(b, s) {
        b.spot = s;
        b.state = "sit";
        b.x = s.x; b.y = s.y; b.z = s.z;
        b.sit = { left: Math.round(rand(240, 720)), phase: "open", hold: Math.round(rand(60, 160)) };
        b.vx = b.vy = 0;
    }
    function takeOff(b, then) {
        b.sit = null;
        if (then === "leave") { leave(b); return; }
        const s = chooseSpot(b, 7);
        flyTo(b, s && Math.random() < 0.8 ? s : null);
    }
    function leave(b) {
        const v = view(0), tw = TW();
        b.state = "leave"; b.spot = null; b.sit = null;
        const side = Math.random() < 0.5 ? -1 : 1;
        b.tx = side < 0 ? v.x0 - 3 * tw : v.x1 + 3 * tw;
        b.ty = b.y + rand(-3, 3) * tw;
        b.tz = 60;
    }
    function hide(b) {
        if (b.state === "hide") return;
        b.state = "hide"; b.sit = null;
        const s = chooseSpot(b, 3);
        b.tx = s ? s.x : b.x + rand(-20, 20); b.ty = s ? s.y : b.y + rand(-12, 12); b.tz = 2;
        b.hideT = 0;
    }
    // scared: up and away from the hero, then it settles somewhere further on
    function flee(b, from) {
        if (b === shoulderB) shoulderB = null;
        const tw = TW(), th = TH(), a = Math.atan2(b.y / th - from.y, b.x / tw - from.x) + rand(-0.6, 0.6), d = rand(4, 7) * tw;
        b.state = "flee"; b.spot = null; b.sit = null; b.fleeT = Math.round(rand(80, 140));
        b.tx = b.x + Math.cos(a) * d; b.ty = b.y + Math.sin(a) * d * 0.8; b.tz = rand(34, 52);
        if (b.z < 6) b.z = 6;
    }
    function removeInsect(b) {
        dropSprite(b);
        flyers = flyers.filter(x => x !== b);
        moths = moths.filter(x => x !== b);
        if (shoulderB === b) shoulderB = null;
    }

    // ---- one butterfly, one frame
    function updateFlyer(b, W) {
        b.t++;
        if (b.free > 0) b.free--;
        const sp = SP[b.kind] || SP.cytrynek, tw = TW(), th = TH();
        if (b.state === "sit") return updateSitting(b);
        if (b.state === "shoulder") return updateShoulder(b);
        // flying (fly, flee, leave, hide, released)
        const fast = b.state === "flee" || b.state === "released" ? 1.7 : b.state === "leave" ? 1.25 : 1;
        const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
        const want = Math.atan2(dy, dx);
        b.h += clamp(angDiff(b.h, want), -0.07, 0.07);
        const near = clamp(d / 36, 0.25, 1);
        const zig = (0.75 * Math.sin(b.t * 0.11 + b.ph) + 0.35 * Math.sin(b.t * 0.29 + b.ph * 2)) * near;
        const he = b.h + zig, spd = sp.speed * SPEED_K * fast * (0.55 + 0.45 * near);
        // the wind: the plants' breeze, gusts rolling downwind, Storm.wind (they drift to the right, the game's wind)
        const gust = Math.max(0, gustNoise((b.x + 0.4 * b.y) / 180 - b.t * 0.006 * (1 + W.storm)));
        const wx = W.breeze * 0.22 * (0.4 + gust) + W.storm * 1.1;
        b.vx = Math.cos(he) * spd + wx;
        b.vy = Math.sin(he) * spd * 0.85;
        b.x += b.vx;
        b.y += b.vy;
        // height: a cruise with a bob, down to the bloom near the spot
        const bob = 4 * Math.sin(b.t * 0.09 + b.ph) + 1.2 * Math.sin(b.t * 0.9);
        let tz = b.tz;
        if (b.spot && b.state === "fly" && d < 44) tz = b.spot.z + (b.tz - b.spot.z) * (d / 44);
        b.z += (tz + (b.state === "fly" && d < 10 ? 0 : bob) - b.z) * 0.08;
        if (b.z < 1) b.z = 1;
        if (Math.random() < 0.004) b.glide = Math.round(rand(6, 14));
        if (b.glide > 0) b.glide--;
        if (b.state === "fly") {
            if (b.spot && (b.spot.kind === "cabbage" && b.spot.guard)) { b.spot = null; flyTo(b, chooseSpot(b, 6)); }
            if (b.spot && d < 4 && Math.abs(b.z - b.spot.z) < 4) { land(b, b.spot); return; }
            if (!b.spot && d < 10) { const s = chooseSpot(b, 7); flyTo(b, s && Math.random() < 0.75 ? s : null); }
        } else if (b.state === "flee" || b.state === "released") {
            if (--b.fleeT <= 0 || d < 10) { b.state = "fly"; b.free = Math.max(b.free, 60); takeOff(b); }
        } else if (b.state === "leave") {
            const v = view(1);
            if (!inView(v, b.x, b.y)) { removeInsect(b); return; }
            if (d < 10) { b.tx += (b.tx > b.x ? 1 : -1) * 3 * tw; }
        } else if (b.state === "hide") {
            b.tz = 2;
            if (d < 6 || ++b.hideT > 120) { b.alpha -= 0.025; b.z = Math.max(1, b.z - 0.3); }
            if (b.alpha <= 0) { removeInsect(b); return; }
        }
        void th;
    }
    // on a flower: the wings open and shut slowly, now and then it walks round a little, then off to the next
    function updateSitting(b) {
        const s = b.spot, st = b.sit;
        if (!s || !st) { takeOff(b); return; }
        b.x = s.x + (s.plant ? (s.plant.bend || 0) * 0.85 : 0);
        b.y = s.y;
        b.z = s.z + (s.plant ? -Math.abs(s.plant.bend || 0) * 0.15 : 0);
        if (--st.hold <= 0) {
            if (st.phase === "open") { st.phase = Math.random() < 0.75 ? "closing" : "open"; st.hold = st.phase === "closing" ? 7 : Math.round(rand(50, 120)); }
            else if (st.phase === "closing") { st.phase = "shut"; st.hold = Math.round(rand(40, 110)); }
            else if (st.phase === "shut") { st.phase = "opening"; st.hold = 7; }
            else { st.phase = "open"; st.hold = Math.round(rand(70, 180)); }
        }
        // a cabbage white on a cabbage gnaws it (the harvest loses a head) - not on a guarded one
        if (b.kind === "bielinek" && s.kind === "cabbage") {
            if (s.guard) { takeOff(b); return; }
            if (++b.nib === D.CABBAGE.nibble) markNibbled($gameMap.mapId(), s.tx, s.ty);
        }
        if (--st.left <= 0) takeOff(b);
    }
    function markNibbled(mapId, x, y) {
        const n = store().nibble, m = n[mapId] || (n[mapId] = {});
        m[x + "," + y] = day();
    }

    // ---- the shoulder (or the raven): a still hero, or a sneaking one
    function shoulderPoint(onRaven) {
        const K = T.api("Kruk"), pet = K && K.pet;
        if (onRaven && pet) return { x: pet.x * TW(), y: pet.y * TH(), z: (pet.z || 0) + 26 };
        const p = $gamePlayer, dd = p.direction();
        let side = dd === 4 ? 1 : dd === 6 ? -1 : -1;
        if (pet && pet.state === "shoulder") side = -side * (dd === 4 || dd === 6 ? 1 : -1);   // (the other shoulder than the raven's)
        return { x: (p._realX + 0.5 + side * 0.2) * TW(), y: (p._realY + 0.98) * TH(), z: D.SHOULDER.z };
    }
    function updateShoulder(b) {
        const S = D.SHOULDER, onRaven = b.onRaven, K = T.api("Kruk"), pet = K && K.pet;
        if (onRaven && (!pet || (pet.state !== "sit" && pet.state !== "shoulder"))) { flee(b, heroPoint()); return; }
        const pt = shoulderPoint(onRaven);
        const p = $gamePlayer, moving = p.isMoving(), sneak = !!T.call("Hunting", "sneaking");
        if ((!onRaven && moving && !sneak) || (p.isDashing() && moving) || swinging() || combatOn()) { b.landing = false; flee(b, heroPoint()); return; }
        if (b.landing) {   // flying in to it
            const dx = pt.x - b.x, dy = pt.y - b.y, d = Math.hypot(dx, dy);
            const st = Math.min(d, 1.4);
            if (d > 0.5) { b.x += dx / d * st; b.y += dy / d * st; }
            b.z += (pt.z - b.z) * 0.12;
            if (d < 1.5 && Math.abs(pt.z - b.z) < 2) { b.landing = false; b.sit = { left: Math.round(rand(S.stay[0], S.stay[1])), phase: "open", hold: 90 }; }
            return;
        }
        b.x = pt.x; b.y = pt.y; b.z = pt.z;
        const st = b.sit;
        if (--st.hold <= 0) {
            if (st.phase === "open") { st.phase = "closing"; st.hold = 7; }
            else if (st.phase === "closing") { st.phase = "shut"; st.hold = Math.round(rand(50, 120)); }
            else if (st.phase === "shut") { st.phase = "opening"; st.hold = 7; }
            else { st.phase = "open"; st.hold = Math.round(rand(80, 200)); }
        }
        // the raven notices it now and then: it pecks at it (the butterfly is off) or lets it be
        if (onRaven && b.peck !== undefined && --b.peck <= 0) {
            b.peck = undefined;
            try { const KD = window.KrukData, row = KD && KD.SHEET && KD.SHEET.peck; if (pet && row) pet.anim = { row: row[0], frames: row[1], i: 0, t: 0, speed: 5, then: null }; } catch (e) { /* (no raven sheet) */ }
            flee(b, { x: pt.x / TW(), y: pt.y / TH() });
            return;
        }
        if (--st.left <= 0) { b.landing = false; flee(b, heroPoint()); }
    }
    const swinging = () => !!($gamePlayer && $gamePlayer._swingEvent);
    const combatOn = () => !!($gameSystem && $gameSystem._combatMode);
    function tryShoulder() {
        const S = D.SHOULDER;
        if (shoulderB || combatOn() || swinging()) return;
        const sneak = !!T.call("Hunting", "sneaking");
        if (heroStill < S.still && !(sneak)) return;
        if ($gamePlayer.isDashing() && $gamePlayer.isMoving()) return;
        if (Math.random() >= (sneak && heroStill < S.still ? S.sneakChance : S.chance)) return;
        const hp = heroPoint(), tw = TW(), th = TH();
        const cand = flyers.filter(b => (b.state === "fly" || b.state === "sit") && b.free <= 0 && Math.hypot(b.x / tw - hp.x, b.y / th - hp.y) < 5);
        if (!cand.length) return;
        const b = pick(cand), K = T.api("Kruk"), pet = K && K.pet;
        const raven = !!pet && (pet.state === "sit" || pet.state === "shoulder") && Math.hypot(pet.x - hp.x, pet.y - hp.y) < 6 && Math.random() < S.raven;
        sendToShoulder(b, raven);
    }
    function sendToShoulder(b, raven) {
        b.state = "shoulder"; b.spot = null; b.landing = true; b.onRaven = !!raven;
        b.sit = { left: 600, phase: "open", hold: 60 };
        b.peck = raven && Math.random() < D.SHOULDER.ravenPeck ? Math.round(rand(60, 150)) : undefined;
        shoulderB = b;
        return b;
    }

    // ---- the hero scares them: running past (RUN_SHY tiles), walking up (the kind's shy distance), sneaking only right up close
    function awareness(b) {
        if (b.free > 0 || b.state === "leave" || b.state === "hide" || b.state === "flee" || b.state === "shoulder" || b.state === "released") return;
        const p = $gamePlayer;
        if (!p.isMoving()) return;
        const hp = heroPoint(), d = Math.hypot(b.x / TW() - hp.x, b.y / TH() - hp.y);
        const sneak = !!T.call("Hunting", "sneaking"), run = p.isDashing() && !sneak;
        const shy = (SP[b.kind] || SP.cytrynek).shy * (b.state === "sit" ? 1 : 0.6);
        if (run ? d < D.RUN_SHY : sneak ? d < D.SNEAK_SHY && Math.random() < 0.5 : d < shy) flee(b, hp);
    }

    // ---- the population: what should fly now - new ones come in (or sit there already when the map comes up), extra ones go
    let popWait = 0, fresh = 0, auto = true;   // (auto: false - the tests: no butterflies come or go by themselves, except the F9 ones)
    function updatePopulation() {
        if (--popWait > 0) return;
        popWait = 30;
        const forced = !!(force && Graphics.frameCount < force.until);
        if (!auto && !forced) return;
        const w = wanted(), v = view(6), vis = view(0.5), pawik = pawikNow();
        // far off the screen: gone (they live only round it)
        for (const b of flyers.slice()) if (!inView(v, b.x, b.y) && b !== shoulderB) removeInsect(b);
        const keep = b => b === shoulderB || (b.kind === "pawik" && pawik);
        const live = flyers.filter(b => b.state !== "leave" && b.state !== "hide" && !(b.kind === "pawik" && pawik));
        if (w.n === 0) {
            const raining = !forced && rainingNow();
            for (const b of live) if (!keep(b) || raining) { if (raining || w.why === "noc") hide(b); else leave(b); }
        } else {
            if (live.length > w.n) { const far = live.filter(b => !keep(b)).sort((a, c) => dist2(c) - dist2(a)); for (const b of far.slice(0, live.length - w.n)) leave(b); }
            const onScreen = flyers.filter(b => inView(vis, b.x, b.y)).length;
            if (live.length < w.n && onScreen < D.LIMITS.maxOnScreen) {
                const sitting = fresh > 0;   // (the first moments on a map: they are there already, sitting on the flowers)
                const n = sitting ? w.n - live.length : 1;
                for (let i = 0; i < n; i++) spawn(null, { sitting: sitting && Math.random() < 0.7 });
            }
        }
        // the peacock: at dawn the morning after a rain, one on this map (once a day)
        if (pawik && !flyers.some(b => b.kind === "pawik") && pawikDay[$gameMap.mapId()] !== day()) {
            pawikDay[$gameMap.mapId()] = day();
            const nettles = spots.filter(s => s.kind === "nettle"), s = nettles.length ? pick(nettles) : null;
            spawn("pawik", { spot: s, sitting: fresh > 0 });
        }
        if (!pawik && !forced) for (const b of flyers) if (b.kind === "pawik" && b.state !== "leave" && b.state !== "released" && b !== shoulderB) leave(b);
        if (fresh > 0 && spotsKey !== null) fresh--;
    }
    const dist2 = b => { const hp = heroPoint(); return (b.x / TW() - hp.x) ** 2 + (b.y / TH() - hp.y) ** 2; };
    // the peacock's dawn: from just before sunrise to PAWIK.hours after it, the morning after a rain, on a butterfly map with flowers,
    // in spring or summer, not raining, PAWIK.chance of such mornings (the same for the whole day and map)
    function pawikNow() {
        const p = profile();
        if (!p || !spots.length) return false;
        if (force && Graphics.frameCount < force.until) return true;
        if (!D.PAWIK.seasons.includes(season()) || rainingNow()) return false;
        const d = day(), h = hour(), s = sunOf(d);
        if (h < s.rise - 0.25 || h > s.rise + D.PAWIK.hours) return false;
        const since = hoursSinceRain();
        if (!(since > 0 && since <= D.PAWIK.rain)) return false;
        return hash(d * 31 + $gameMap.mapId(), 77) < D.PAWIK.chance;
    }

    // ------------------------------------------------------------------
    // Moths at night round the fires
    // ------------------------------------------------------------------
    let lightsNow = [], lightsWait = 0;
    // a dark room (RoomLighting's <Dark:on>: its own darkness with holes for the lamps and candles) - the moths come in there too,
    // fewer (the user 2026-10-18: "we wnętrzach przy świecach w ciemnych pokojach, po 1-2 na źródło, z umiarem")
    function roomDark() {
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        return !!(set && set._darknessSprite && Array.isArray(set._roomHoles));
    }
    function mothTime() {
        if (!ENABLED || !window.$dataMap || underground()) return false;
        const out = outdoors();
        if (!out && !roomDark()) return false;
        if (force && force.moths && Graphics.frameCount < force.until) return true;
        if (out && (rainingNow() || stormLevel() > 0.3)) return false;
        if (D.SEASON_K[season()] <= 0) return false;
        return nightAmount() > (out ? 0.35 : 0.5);
    }
    // the fires on the screen (Farming_Render's night layer knows them all: campfires, stations burning, <Light> lamps and braziers,
    // the torch in the hand and the stuck ones, the camps of Humans.js...) -> map px; a light without ground (a tree's embers) is left out
    function readLights() {
        const set = SceneManager._scene && SceneManager._scene._spriteset, nl = set && set._nightLight;
        if (!outdoors() && roomDark()) return roomLights(set);
        if (!nl || typeof nl.lights !== "function") return [];
        let list = [];
        try { list = nl.lights() || []; } catch (e) { return []; }
        const ox = $gameMap.displayX() * TW(), oy = $gameMap.displayY() * TH(), out = [];
        for (const l of list) {
            if (l.gx === undefined || l.gy === undefined) continue;
            if (l.x < -96 || l.x > T.view.w() + 96 || l.y < -96 || l.y > T.view.h() + 96) continue;
            const fx = l.x + ox, fy = l.y + oy, gx = l.gx + ox, gy = l.gy + oy;
            const count = l.id === 7000 ? 2 : l.id >= 7100 && l.id < 7200 ? 1 : l.r >= 280 ? 3 : l.r >= 160 ? 2 : 1;
            out.push({ id: l.id, fx, fy, gx, gy, hf: l.hf || 20, r: l.r, count });
        }
        return out;
    }
    // indoors: the flames among RoomLighting's lights (a circle with a flicker - candles, lamps, the fireplace; not a window's cone of
    // daylight, not a soft fill light), lit now, on the screen; a candle 1 moth, a bigger flame 2 - and not every one: some candles
    // have none tonight (hash of the light and the day)
    function roomLights(set) {
        const tw = TW(), th = TH(), ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th, out = [];
        for (const h of set._roomHoles || []) {
            const sp = h.sprite;
            if (h.shape !== "circle" || h.soft || !sp || !sp.visible || !sp._flicker) continue;
            if ((typeof sp._weight === "number" ? sp._weight : 1) < 0.3) continue;
            if (sp.x < -96 || sp.x > T.view.w() + 96 || sp.y < -96 || sp.y > T.view.h() + 96) continue;
            const id = 90000 + (sp._tileY || 0) * 500 + (sp._tileX || 0);
            if (hash(id, day()) >= 0.65 && !(force && force.moths)) continue;
            const fx = sp.x + ox, fy = sp.y + oy - 8;   // (the flame a little above the light's middle: a candle on a stool, a lamp)
            out.push({ id, fx, fy, gx: fx, gy: fy + 8 + th / 2 - 4, hf: th / 2, r: h.radius, count: h.radius <= 140 ? 1 : 2, room: true });
        }
        return out;
    }
    function updateMoths(W) {
        const on = mothTime();
        if (--lightsWait <= 0 || !on) {
            lightsWait = 3;
            lightsNow = on ? readLights() : [];
        }
        // each light keeps its moths (the cap over all of them); a light gone - its moths fly off into the dark
        const byId = new Map(lightsNow.map(l => [l.id, l]));
        if (on && (Graphics.frameCount % 20 === 0 || force)) {
            let total = moths.filter(m => m.state !== "go").length;
            const cap = Math.max(1, Math.round((lightsNow.some(l => l.room) ? D.LIMITS.roomMoths : D.LIMITS.moths) * critterShare()));
            for (const l of lightsNow) {
                const have = moths.filter(m => m.moth.light === l.id && m.state !== "go").length;
                for (let i = have; i < l.count && total < cap; i++, total++) spawnMoth(l, fresh > 0 || (force && force.moths));
            }
        }
        for (const m of moths.slice()) {
            const l = byId.get(m.moth.light);
            if ((!l || !on) && m.state !== "go") { m.state = "go"; m.tx = m.x + rand(-5, 5) * TW(); m.ty = m.y + rand(-3, 3) * TH(); }
            updateMoth(m, l, W);
        }
    }
    function spawnMoth(l, atOnce) {
        const tw = TW(), a = rand(0, Math.PI * 2), far = l.room ? 0.5 : 1;   // (in a room from a dark corner nearer by)
        const m = newInsect("cma", l.gx + Math.cos(a) * rand(3, 5) * tw * far, l.gy + Math.sin(a) * rand(2, 4) * tw * far, rand(30, 50));
        const small = l.room && l.r <= 140;   // (a candle: a tight circle round its small flame)
        m.moth = { light: l.id, a: rand(0, Math.PI * 2), rx: small ? rand(16, 24) : rand(22, 36), ry: small ? rand(8, 12) : rand(10, 16), w: rand(0.05, 0.1) * (Math.random() < 0.5 ? -1 : 1),
            dart: 0, k: 1, up: small ? rand(8, 16) : rand(12, 26) };
        m.state = atOnce ? "orbit" : "come";
        if (atOnce) { m.x = l.gx; m.y = l.gy; }
        moths.push(m);
        return m;
    }
    // the orbit: an ellipse round the flame, lifted a little so it passes over the fire's middle (never resting on it), now and then a
    // dart out and back; in front of the flame (the lower half of the ellipse) the moth is drawn over the fire, behind it under it
    function updateMoth(m, l, W) {
        m.t++;
        if (m.free > 0) m.free--;
        const mo = m.moth;
        if (m.state === "go" || m.state === "released") {
            const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
            if (d > 2) { m.x += dx / d * 1.6; m.y += dy / d * 1.6; }
            m.z += (50 - m.z) * 0.03;
            m.alpha -= m.state === "go" ? 0.012 : 0;
            if (m.state === "released" && (--m.fleeT <= 0) && l) m.state = "come";
            if (m.alpha <= 0 || (m.state === "released" && !l && m.fleeT <= 0)) removeInsect(m);
            return;
        }
        if (!l) return;
        if (Math.random() < 0.006 && !mo.dart) mo.dart = Math.round(rand(24, 50));
        let k = 1;
        if (mo.dart > 0) { mo.dart--; k = 1 + 0.9 * Math.sin(Math.PI * (1 - mo.dart / 50)); }
        mo.k += (k - mo.k) * 0.1;
        mo.a += mo.w * (1 + 0.35 * Math.sin(m.t * 0.05 + m.ph));
        // (each its own height over the flame - a loose swarm round and above it, not a ring at the stones' level)
        const lift = Math.min(mo.up, 8 + l.hf * 0.6);
        const ox = Math.cos(mo.a) * mo.rx * mo.k + Math.sin(m.t * 0.31 + m.ph) * 2;
        const oy = Math.sin(mo.a) * mo.ry * mo.k;
        const tx = l.gx + (l.fx - l.gx) + ox, groundY = l.gy, zt = (l.gy - l.fy) + lift - oy * 0.8 + Math.sin(m.t * 0.17 + m.ph) * 5;
        if (m.state === "come") {
            const dx = tx - m.x, dy = groundY - m.y, d = Math.hypot(dx, dy);
            if (d > 3) { m.x += dx / d * 1.8; m.y += dy / d * 1.8; m.z += (zt - m.z) * 0.06; return; }
            m.state = "orbit";
        }
        m.x = tx;
        m.y = groundY;
        m.z = Math.max(4, zt);
        mo.front = Math.sin(mo.a) > 0;
        mo.fx = l.fx; mo.fy = l.fy;
    }

    // ------------------------------------------------------------------
    // Drawing: a holder at the insect's ground point (the tilemap sorts it with the characters), the picture in it at -z, a small
    // shadow on the ground under a flying one. A pool: the sprites are made once and moved, never rebuilt every frame
    // ------------------------------------------------------------------
    let shadowBmp = null;
    function shadowBitmap() {
        if (shadowBmp) return shadowBmp;
        shadowBmp = new Bitmap(10, 4);
        const ctx = shadowBmp.context;
        ctx.fillStyle = "rgba(0,0,0,0.30)";
        ctx.beginPath(); ctx.ellipse(5, 2, 4.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        shadowBmp._baseTexture.update();
        return shadowBmp;
    }
    function tilemap() {
        const s = SceneManager._scene;
        return s instanceof Scene_Map && s._spriteset ? s._spriteset._tilemap : null;
    }
    function ensureSprite(b) {
        const tm = tilemap();
        if (!tm) return false;
        if (b.holder && b.holder.parent === tm) return true;
        dropSprite(b);
        const holder = new Sprite(), spr = new Sprite(ImageManager.loadSystem(SH.file)), sh = new Sprite(shadowBitmap());
        spr.anchor.set(0.5, 0.5);
        holder.addChild(spr);
        holder.z = 3;
        sh.anchor.set(0.5, 0.5);
        sh.z = 1;
        tm.addChild(sh);
        tm.addChild(holder);
        b.holder = holder; b.spr = spr; b.shadow = sh;
        holder._motyl = b;
        return true;
    }
    function dropSprite(b) {
        for (const s of [b.holder, b.shadow]) if (s && s.parent) s.parent.removeChild(s);
        b.holder = b.spr = b.shadow = null;
    }
    const FLAP = [SH.open, SH.half, SH.shut, SH.half];
    function frameOf(b) {
        if (b.state === "sit" || (b.state === "shoulder" && !b.landing)) {
            const ph = b.sit ? b.sit.phase : "open";
            return ph === "open" ? SH.open : ph === "shut" ? SH.shut : SH.half;
        }
        if (b.glide > 0) return b.glide % 12 < 6 ? SH.open : SH.down;
        const rate = b.kind === "cma" ? 1 : 2;
        return FLAP[Math.floor(b.t / rate) % 4];
    }
    let drawn = 0;
    function drawInsect(b, vis) {
        const tw = TW(), th = TH(), sx = b.x - $gameMap.displayX() * tw, sy = b.y - $gameMap.displayY() * th;
        const on = sx > -40 && sx < T.view.w() + 40 && sy - b.z > -40 && sy < T.view.h() + 60;
        if (!on) { if (b.holder) { b.holder.visible = false; b.shadow.visible = false; } return; }
        if (!ensureSprite(b)) return;
        drawn++;
        const h = b.holder, s = b.spr, sp = SP[b.kind] || SP.cytrynek, row = sp.row;
        h.visible = true;
        s.setFrame(frameOf(b) * SH.cell, row * SH.cell, SH.cell, SH.cell);
        h.x = Math.round(sx);
        let gy = Math.round(sy);
        if (b.state === "shoulder" && !b.onRaven) gy = Math.round(($gamePlayer._realY + 1) * th - $gameMap.displayY() * th) + 1;   // (drawn just after the hero)
        if (b.moth && b.state === "orbit") gy += b.moth.front ? 2 : -2;                                                           // (in front of / behind the flame)
        h.y = gy;
        s.y = -Math.round(b.z) - (gy - Math.round(sy));
        s.x = 0;
        const flying = !(b.state === "sit" || (b.state === "shoulder" && !b.landing));
        s.rotation = flying ? clamp(b.vx * 0.1, -0.25, 0.25) : 0;
        s.scale.set(1, 1);
        let alpha = b.alpha;
        if (b.moth) {   // the firelight on it: warm, flickering; over the flame's middle a little see-through
            const f = 0.5 + 0.5 * Math.sin(b.t * 0.37 + b.ph) * Math.sin(b.t * 0.13);
            const g = Math.round(206 + 34 * f), bl = Math.round(150 + 60 * f);
            s.tint = (255 << 16) | (g << 8) | bl;
            if (b.state === "orbit" && b.moth.front && Math.abs(Math.cos(b.moth.a)) < 0.45) alpha *= 0.62;
            alpha *= 0.82 + 0.18 * f;
        } else s.tint = 0xffffff;
        h.alpha = clamp(alpha, 0, 1);
        const sh = b.shadow;
        sh.x = h.x; sh.y = Math.round(sy);
        sh.visible = !b.moth && flying && b.z > 3 && b.state !== "shoulder";
        sh.alpha = Math.max(0.15, 0.7 - b.z / 90) * h.alpha;
        void vis;
    }

    // ------------------------------------------------------------------
    // The net (item 180): made at the workbench; O at a butterfly swings it (the hero's own sheet Hero_Net, kind "net")
    // ------------------------------------------------------------------
    (function addRecipe() {
        const F = window.Farming, wb = F && F.BUILDINGS && F.BUILDINGS.workbench;
        if (wb && Array.isArray(wb.recipes) && !wb.recipes.some(r => r.id === D.NET_RECIPE.id)) wb.recipes.push(D.NET_RECIPE);   // (the data's own object: its name and description come from js/teksty/motyle.txt when the game starts)
    })();
    let NET_KIND = -1;
    (function addSwing() {
        const CP = T.api("ChoppableTree_parts"), list = CP && CP.core && CP.core.SWING_KINDS;
        if (!list) return;
        let i = list.findIndex(k => k && k.name === "net");
        if (i < 0) { list.push({ sheet: "Swing_Club", name: "net", tool: -1, frames: 40, impact: 24, hold: 2, reach: 2, hit: [4, 5, 5, 4] }); i = list.length - 1; }
        NET_KIND = i;
    })();
    // the new hero's sheet (HeroLook stands lower in the list: put in once every plugin is there)
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        const L = window.HeroLook;
        if (L && L.SWINGS && NET_KIND >= 0 && !L.SWINGS[NET_KIND]) L.SWINGS[NET_KIND] = { sheet: "Hero_Net", hit: [10, 10, 10, 10] };
        addCaseTab();
    };
    const hasNet = () => !!(window.$gameParty && itemOf(D.ITEM.net) && $gameParty.hasItem(itemOf(D.ITEM.net)));
    const NET_UP = 74;
    // the net's point: 0.9 tile in front of him (tiles)
    function netPoint() {
        const p = $gamePlayer, d = p.direction(), hp = heroPoint();
        return { x: hp.x + (d === 6 ? 0.9 : d === 4 ? -0.9 : 0), y: hp.y + (d === 2 ? 0.75 : d === 8 ? -0.95 : -0.1) };
    }
    function netTargets(reach) {
        const np = netPoint(), tw = TW(), th = TH(), r = reach || D.REACH;
        // (the net on its long stick reaches up to NET_UP px: a moth over a torch, a butterfly on the shoulder - not one high in a tree)
        const all = flyers.concat(moths).filter(b => b.state !== "leave" && b.state !== "hide" && b.state !== "go" && b.free <= 0 && b.z <= NET_UP);
        return all.map(b => ({ b, d: Math.hypot(b.x / tw - np.x, b.y / th - np.y) })).filter(o => o.d <= r).sort((a, c) => a.d - c.d);
    }
    // someone to talk to (an event started by the action button) in front of him or under him: O is for them, not the net
    function eventAhead(p) {
        const d = p.direction(), x = $gameMap.roundXWithDirection(p.x, d), y = $gameMap.roundYWithDirection(p.y, d);
        const talks = e => e && e.isTriggerIn && e.isTriggerIn([0]) && !e._erased && e.page() && (e.list() || []).length > 1;
        return $gameMap.eventsXy(x, y).some(e => talks(e) && e.isNormalPriority()) || $gameMap.eventsXy(p.x, p.y).some(e => talks(e) && !e.isNormalPriority());
    }
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (ENABLED && Input.isTriggered("ok") && !this._swingEvent && hasNet() && !combatOn() && netTargets(D.REACH + 0.25).length && !eventAhead(this)) {
            if (swingNet()) return true;
        }
        return _Game_Player_triggerButtonAction.call(this);
    };
    // the swing: the ones near take fright with the kind's chance; on the swing's impact frame the nearest within reach is caught or
    // gets away (the roll: the kind's net chance x how it is: sitting, flying, on the shoulder; sneaking a little better)
    function swingNet() {
        if (NET_KIND < 0 || !$gamePlayer.startToolSwing) return false;
        const sneak = !!T.call("Hunting", "sneaking");
        if (!$gamePlayer.startToolSwing(NET_KIND, () => netImpact(sneak), null)) return false;
        store().stats.swings++;
        T.audio.se("Wind7", { volume: 35, pitch: 160 });
        const hp = heroPoint(), tw = TW(), th = TH();
        for (const b of flyers) {
            if (b.state === "shoulder" || b.free > 0 || netOpts.roll !== null) continue;   // (the tests' fixed roll: no fright either)
            const d = Math.hypot(b.x / tw - hp.x, b.y / th - hp.y);
            if (d < 2.6 && Math.random() < (1 - (SP[b.kind] || SP.cytrynek).net) * 0.5) flee(b, hp);
        }
        return true;
    }
    function netChance(b, sneak) {
        const sp = SP[b.kind] || SP.cytrynek;
        const how = b.state === "shoulder" ? 1.3 : b.state === "sit" ? 1.2 : 0.85;
        return Math.min(0.95, sp.net * how * (sneak ? 1.1 : 1) * (netOpts.k || 1));
    }
    const netOpts = { k: 1, roll: null };   // (the tests: roll 0..1 instead of Math.random)
    function netImpact(sneak) {
        const got = netTargets(D.REACH + 0.25);   // (the net sweeps an arc: as wide as what started the swing - a moth circling a flame moves on)
        if (!got.length) { T.popup(D.TX.missed, { icon: D.ICON.net, color: "#d8d2c4" }); store().stats.missed++; return null; }
        const b = got[0].b, roll = netOpts.roll === null ? Math.random() : netOpts.roll;
        if (roll < netChance(b, sneak)) return caught(b);
        store().stats.missed++;
        if (b.moth) { b.state = "released"; b.fleeT = 60; b.tx = b.x + rand(-2, 2) * TW(); b.ty = b.y + rand(-2, 2) * TH(); }
        else flee(b, heroPoint());
        T.popup(D.TX.missed, { icon: D.ICON.net, color: "#d8d2c4" });
        return null;
    }
    // caught: into the display case; the butterfly flies out of the net again (the peacock for Ela stays in it, K54)
    function caught(b) {
        const s = store(), kind = b.kind, first = !s.caught[kind];
        if (first) s.caught[kind] = day();
        s.counts[kind] = (s.counts[kind] || 0) + 1;
        s.stats.caught++;
        T.audio.se("Item1", { volume: 55, pitch: 130 });
        T.popup(D.TX.caught + nameOf(kind), { icon: kindIcon(kind), kind: "good" });
        if (first) {
            const n = ORDER.filter(k => s.caught[k]).length;
            T.popup(D.TX.newKind, { top: true, color: "#ffe27a", sub: fill(D.TX.kod.nowyOkaz, { nazwa: nameOf(kind), n, z: ORDER.length }) + (n === ORDER.length ? "  ·  " + D.TX.full : "") });
        }
        T.emit("butterflyCaught", { kind, first });
        if (kind === "pawik" && questActive("K54") && vcount("pawik") === 0) {
            vgive("pawik", 1);
            s.pawikNet = day();
            removeInsect(b);
            T.popup(D.TX.pawikNet, { top: true, color: "#ffe27a", sub: D.TX.kod.zadaniePawik });
            refreshQuest();
            return { kind, kept: true };
        }
        release(b);
        return { kind, kept: false };
    }
    function release(b) {
        const np = netPoint(), tw = TW(), th = TH();
        if (b === shoulderB) shoulderB = null;
        b.x = np.x * tw; b.y = np.y * th; b.z = 26;
        b.free = 300; b.spot = null; b.sit = null; b.landing = false;
        if (b.moth) { b.state = "released"; b.fleeT = 90; b.tx = b.x + rand(-3, 3) * tw; b.ty = b.y + rand(-2, 2) * th; return; }
        b.state = "released"; b.fleeT = 150;
        const a = rand(0, Math.PI * 2);
        b.tx = b.x + Math.cos(a) * 5 * tw; b.ty = b.y + Math.sin(a) * 4 * th; b.tz = 44;
    }

    // ------------------------------------------------------------------
    // The quest K54 (the thread's, Motyle_Data.js - the engine Watki.js): the offer only while peacocks fly (spring, summer, the first
    // week of autumn); the peacock in the net lives till dusk; done - it flies up from Ela
    // ------------------------------------------------------------------
    const { vcount, vgive, vtake } = w;
    const questActive = id => w.active(id);
    const qflag = k => w.flag(k);
    function refreshQuest() { const q = T.api("TownQuests"); try { if (q && q.refreshMarkers) q.refreshMarkers(); if (q && q.autoChecks) q.autoChecks(); } catch (e) { /* (no quests) */ } }
    T.on("townQuestDone", e => {
        if (!e || e.id !== "K54") return;
        // the peacock flies up out of the net by Ela, round the camp and away
        const L = T.api("TownLife"), ev = L && L.eventOf ? L.eventOf("ela") : null, tw = TW(), th = TH();
        const at = ev ? { x: (ev._realX + 0.5) * tw, y: (ev._realY + 0.95) * th, z: 30 } : { x: ($gamePlayer._realX + 0.5) * tw, y: ($gamePlayer._realY + 0.95) * th, z: 30 };
        const b = spawn("pawik", { at, state: "released", free: 600 });
        b.fleeT = 200;
        store().pawikNet = 0;
    }, { owner: PLUGIN });
    // a peacock held too long: let go at dusk (or the next day)
    T.on("hourChange", () => {
        if (vcount("pawik") <= 0) return;
        const s = store(), h = hour();
        if (h >= 21 || (s.pawikNet && day() > s.pawikNet)) {
            vtake("pawik", 1);
            s.pawikNet = 0;
            T.popup(D.TX.pawikGone, { icon: D.ICON.butterfly, color: "#d8d2c4" });
            if (profile()) { const tw = TW(), th = TH(); spawn("pawik", { at: { x: ($gamePlayer._realX + 0.5) * tw, y: ($gamePlayer._realY + 0.95) * th, z: 30 }, state: "released", free: 600 }); }
            refreshQuest();
        }
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // Brother Kleofas (Pustelnia) writes the kinds into the chronicle: a short talk while there are kinds he has not written yet; the
    // whole display case - his thanks and honey. Only once he has ink (K50 done: the flag kleofasCzyta). The talk: Motyle_Data
    // rozmowy.kronika
    // ------------------------------------------------------------------
    function kleofasTalk(ev) {
        if (!qflag("kleofasCzyta")) return null;
        const s = store(), fresh = ORDER.filter(k => s.caught[k] && !s.kron[k]);
        if (!fresh.length) return null;
        return w.rozmowa("kronika", { spk: { id: ev.eventId(), name: D.TX.kod.kleofas }, swieze: fresh, lista: fresh.map(nameOf).join(", "),
            wszystkie: ORDER.every(k => s.caught[k]), juzCala: !!s.kronDone });
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: the chronicle of butterflies is an errand at Kleofas's talk - right after
    // Latarnia's, before every other takeover (as the old hook, put first at the first map)
    function hookTalk() {
        if (hookTalk.done) return;
        hookTalk.done = true;
        T.talk.takeover({ owner: PLUGIN, who: "pustelnik", priority: T.talk.PRIORITY.errand + 10,
            run: ctx => { try { return kleofasTalk(ctx.ev); } catch (e) { console.error("[Motyle]", e); return null; } } });
    }
    hookTalk();
    // the kinds written (a, the list) - the whole case (b): his honey, the note
    function chronicle(a, b) {
        const s = store();
        for (const k of a || []) s.kron[k] = day();
        if (b && !s.kronDone && ORDER.every(k => s.kron[k])) {
            s.kronDone = day();
            const rw = D.KLEOFAS.reward;
            for (const [id, n] of rw.items || []) if (itemOf(id)) $gameParty.gainItem(itemOf(id), n);
            if (rw.xp) T.call("Combat", "gainXp", rw.xp, D.KLEOFAS.note[0]);
            T.call("Journal", "addNote", D.KLEOFAS.note[0], D.KLEOFAS.note[1]);
            T.popup(D.KLEOFAS.note[0], { top: true, color: "#9ff0a8", sub: fill(D.TX.kod.kronikaNagroda, { xp: rw.xp }) });
        }
    }
    w.haki({
        poraPawika: () => { const s = season(); return s === 0 || s === 1 || (s === 2 && T.time.dayOfSeason() <= 7); },
        kronika: (ctx, a, b) => chronicle(a, b)
    });
    // (the old script call of the chronicle's talk - a talk saved before 2026-10-28; the new one goes to Watki.act)
    function act(interp, args) {
        if (!Array.isArray(args)) return;
        const [what, a, b] = args;
        if (what === "kron") chronicle(a, b);
    }

    // ------------------------------------------------------------------
    // Pollination and the cabbage whites
    // ------------------------------------------------------------------
    // 0..1: the pollinators of a place on this map (the map's kind x the season x the flowers near); season: false = do not count the
    // season (a fruit picked in autumn blossomed in spring)
    function pollen(mapId, x, y, useSeason) {
        if (Number(mapId) !== $gameMap.mapId()) return 0;
        const p = profileOf(mapId);
        if (!p || !zoneOk(p, x, y)) return 0;
        if (!spots.length) buildSpots();
        const near = flowersNear(x, y, D.POLLEN.radius);
        const fk = near >= 2 ? 1 : near === 1 ? 0.5 : 0;
        return Math.min(1, p.k) * (useSeason === false ? 1 : D.POLLEN.season[season()]) * fk;
    }
    // the hive (Farming_Build.collect asks): extra jars
    function produceBonus(b, n) {
        const F = window.Farming, def = F && F.BUILDINGS && b && F.BUILDINGS[b.type];
        if (!def || !def.produce || def.produce.item !== D.ITEM.honey || !(n > 0)) return 0;
        const p = pollen($gameMap.mapId(), b.x, b.y);
        let extra = 0;
        for (let i = 0; i < n; i++) if (Math.random() < D.POLLEN.honey * p) extra++;
        if (extra) T.popup(D.TX.honey + extra + " " + (itemOf(D.ITEM.honey) ? itemOf(D.ITEM.honey).name : D.TX.kod.miod), { icon: D.ICON.butterfly, kind: "good" });
        return extra;
    }
    // the harvest (Farming's bus): a flowering crop by flowers +1 now and then; a nibbled cabbage -1 (never the last head)
    T.on("harvest", e => {
        if (!e || !window.$gameMap || Number(e.mapId) !== $gameMap.mapId()) return;
        const F = window.Farming, crop = F && F.CROPS ? F.CROPS[e.crop] : null, item = crop ? itemOf(crop.produce) : null;
        if (!item) return;
        if (D.FLOWERS.crops[e.crop]) {
            const p = pollen(e.mapId, e.x, e.y);
            if (p > 0 && Math.random() < D.POLLEN.crop * p) {
                $gameParty.gainItem(item, 1);
                T.popup(D.TX.crop + "1 " + item.name, { icon: D.ICON.butterfly, kind: "good" });
            }
        }
        if (e.crop === D.FLOWERS.cabbage) {
            const n = store().nibble, m = n[e.mapId] || {}, key = e.x + "," + e.y, marked = !!m[key];
            delete m[key];
            if (guardedAt(e.mapId, e.x, e.y)) return;
            const p = profileOf(e.mapId), autumn = season(day() - 2) === 2;
            const lose = marked || (!!p && autumn && Math.random() < D.CABBAGE.away * Math.min(1, p.k));
            if (lose && e.n >= 2) {
                $gameParty.loseItem(item, D.CABBAGE.loss);
                T.popup(D.TX.nibbled + D.CABBAGE.loss + " " + item.name, { icon: D.ICON.butterfly, color: "#ffb4a0" });
            }
        }
    }, { owner: PLUGIN });
    // the fruit trees (ChoppableTree's "Zerwij owoce"): picked by flowers that were pollinated in spring - one more now and then
    (function hookFruit() {
        const CP = T.api("ChoppableTree_parts"), O = CP && CP.objects;
        if (!O || typeof O.pickFruit !== "function" || O.pickFruit._motyle) return;
        const base = O.pickFruit;
        O.pickFruit = function(interp) {
            const ev = interp && $gameMap.event(interp._eventId), key = ev ? [ev._mapId, ev._eventId, "C"] : null;
            const before = key ? $gameSelfSwitches.value(key) : true;
            const out = base.apply(this, arguments);
            if (ev && !before && $gameSelfSwitches.value(key)) fruitBonus(ev);
            return out;
        };
        O.pickFruit._motyle = true;
    })();
    function fruitBonus(ev) {
        const CT = T.api("ChoppableTree"), cfg = CT && CT.treeConfig ? CT.treeConfig(ev) : null, item = cfg && itemOf(cfg.fruit);
        if (!item) return 0;
        const p = pollen(ev._mapId, ev.x, ev.y, false);
        if (!(p > 0) || Math.random() >= D.POLLEN.fruit * p) return 0;
        $gameParty.gainItem(item, 1);
        T.popup(D.TX.crop + "1 " + item.name, { icon: D.ICON.butterfly, kind: "good" });
        return 1;
    }

    // ------------------------------------------------------------------
    // The journal's display case ("Gablotka" - Journal.addTab; MenuRing's Dziennik shows it as a section)
    // ------------------------------------------------------------------
    function caseItems() {
        const s = store(), out = [];
        for (const k of ORDER) {
            const got = !!s.caught[k];
            out.push({ label: got ? nameOf(k) : nameOf(k) + D.TX.kod.niezlapany, icon: got ? kindIcon(k) : 0, mark: got ? "done" : "todo", right: got ? "×" + (s.counts[k] || 1) : "", dim: !got, motyl: k });
        }
        out.push({ label: D.CASE.pollenTitle, icon: itemOf(D.ITEM.honey) ? itemOf(D.ITEM.honey).iconIndex : 0, mark: "todo", info: "pollen" });
        if (qflag("elaMotyl") || ($gameParty && itemOf(D.ITEM.drawing) && $gameParty.hasItem(itemOf(D.ITEM.drawing)))) out.push({ label: D.CASE.drawingTitle, icon: D.ICON.drawing, mark: "done", info: "drawing" });
        if (s.kronDone) out.push({ label: D.KLEOFAS.note[0], icon: 189, mark: "done", info: "kron" });
        return out;
    }
    function caseDetail(it) {
        const s = store();
        if (!it) return { ops: [{ k: "title", text: D.CASE.title }, { k: "rule" }, { k: "p", text: D.CASE.empty }] };
        if (it.info === "pollen") {
            return { ops: [{ k: "title", text: D.CASE.pollenTitle }, { k: "sub", text: D.TX.kod.zapylanieSub }, { k: "rule" }, { k: "p", text: D.CASE.pollen },
                { k: "h", text: D.TX.kod.liczby }, { k: "p", text: fill(D.TX.kod.liczbyTekst, { crop: Math.round(D.POLLEN.crop * 100), honey: Math.round(D.POLLEN.honey * 100) }) },
                { k: "muted", text: D.CASE.kleofasHint }] };
        }
        if (it.info === "drawing") return { ops: [{ k: "title", text: D.CASE.drawingTitle, narrow: true }, { k: "sub", text: D.TX.kod.rysunekSub, narrow: true }, { k: "rule" }, { k: "p", text: D.CASE.drawing, narrow: true }], image: "Motyle_Rysunek_Eli" };
        if (it.info === "kron") return { ops: [{ k: "title", text: D.KLEOFAS.note[0] }, { k: "rule" }, { k: "p", text: D.KLEOFAS.note[1] }] };
        const k = it.motyl, sp = SP[k], got = !!s.caught[k];
        if (!sp) return { ops: [] };
        // (the card stands top right: the title and the first paragraph beside it, narrower - "narrow")
        const ops = [{ k: "title", text: sp.name, narrow: true }, { k: "sub", text: sp.latin + (got ? fill(D.TX.kod.zlapanyDnia, { dzien: s.caught[k] }) : D.TX.kod.jeszczeNie), narrow: true }, { k: "rule" }];
        ops.push({ k: "p", text: got ? sp.desc : D.TX.kod.opisPozniej, narrow: true });
        ops.push({ k: "h", text: D.TX.kod.gdzie }, { k: "p", text: sp.where });
        if (got) ops.push({ k: "muted", text: fill(D.TX.kod.wGablotce, { n: s.counts[k] || 1 }) + (s.kron[k] ? D.TX.kod.wKronice : "") });
        return { ops, image: sp.card + (got ? "" : "_Cien") };
    }
    function addCaseTab() {
        const J = T.api("Journal");
        if (!J || !J.addTab || (J.TABS || []).includes(D.CASE.tab)) return;
        J.addTab({ name: D.CASE.tab, items: () => caseItems(), detail: it => caseDetail(it),
            legend: () => { const s = store(), n = ORDER.filter(k => s.caught[k]).length; return fill(D.TX.kod.legenda, { n, z: ORDER.length }) + (s.kronDone ? D.TX.kod.legendaKronika : ""); },
            help: D.TX.kod.pomoc });
    }
    // the cards load with the journal's scene (no blank frame)
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        ImageManager.loadSystem(SH.file);
    };

    // ------------------------------------------------------------------
    // The map's clock: the population, each insect, the moths, the shoulder, the F9 rows; a new map / a loaded game starts empty
    // ------------------------------------------------------------------
    function reset() {
        for (const b of flyers.concat(moths)) dropSprite(b);
        flyers = []; moths = []; shoulderB = null;
        spots = []; spotsKey = null; spotsWait = 0;
        profMap = -1; prof = null; popWait = 0; fresh = 6; lightsNow = []; lightsWait = 0; heroStill = 0;
        if (force && force.map !== undefined && window.$gameMap && force.map !== $gameMap.mapId()) force = null;
    }
    T.on("mapEnter", () => reset(), { owner: PLUGIN });
    T.on("load", () => { reset(); force = null; }, { owner: PLUGIN });
    T.on("newGame", () => { reset(); force = null; }, { owner: PLUGIN });
    T.on("mapReady", () => { hookTalk(); }, { owner: PLUGIN });
    const perf = { ms: 0, n: 0, max: 0, drawn: 0 };
    T.onMapUpdate(scene => {
        if (!ENABLED || !window.$gameMap || !$gamePlayer) return;
        const t0 = performance.now();
        if (Motyle.pending) startPending(Motyle.pending);
        if ($gamePlayer.isMoving()) heroStill = 0; else heroStill++;
        if (force && Graphics.frameCount >= force.until) force = null;
        refreshSpots(false);
        const W = { breeze: 0.18 + 0.12 * (0.5 + 0.5 * Math.sin(Graphics.frameCount / 60 * 0.07 + 1)), storm: wind() };
        updatePopulation();
        if (Graphics.frameCount % D.SHOULDER.every === 0) tryShoulder();
        const aware = Graphics.frameCount % 6 === 0;
        for (const b of flyers.slice()) { if (aware) awareness(b); updateFlyer(b, W); }
        updateMoths(W);
        drawn = 0;
        for (const b of flyers) drawInsect(b);
        for (const m of moths) drawInsect(m);
        const ms = performance.now() - t0;
        perf.n++; perf.ms += (ms - perf.ms) / Math.min(perf.n, 120); perf.max = Math.max(perf.max * 0.995, ms); perf.drawn = drawn;
        void scene;
    }, { owner: PLUGIN, name: "motyle" });
    // the F9 rows (Debug.js): butterflies now (a summer meadow after rain, for two minutes, a peacock among them); moths at a fire at night
    function startPending(what) {
        Motyle.pending = null;
        const tw = TW(), th = TH();
        if (what === "motyle") {
            force = { until: Graphics.frameCount + 60 * 120, season: 1, afterRain: true, map: $gameMap.mapId() };
            profMap = -1; spotsKey = null; refreshSpots(true);
            if (!spots.length) {   // (no flowers on this map: the grass round the hero will do)
                const hp = heroPoint();
                for (let i = 0; i < 10; i++) spots.push({ x: (hp.x + rand(-5, 5)) * tw, y: (hp.y + rand(-4, 4)) * th, z: 3, kind: "ground", w: 1 });
            }
            fresh = 2; popWait = 0;
            updatePopulation();
            if (!flyers.some(b => b.kind === "pawik")) spawn("pawik", { sitting: true });
            T.popup(D.TX.f9butter, { icon: D.ICON.butterfly, color: "#9ff0a8" });
        } else if (what === "cmy") {
            const d = day();
            if (hour() < 21.5 && hour() > 4) $gameSystem.setDayNightHour(22.5);
            T.call("Survival", "calmWeather");
            force = { until: Graphics.frameCount + 60 * 120, season: 1, moths: true, map: $gameMap.mapId() };
            // no fire on the screen (a torch does not count - it may be about to burn down): a fresh torch stuck in the ground beside him
            const fires = readLights().filter(l => !(l.id === 7000 || (l.id >= 7100 && l.id < 7200)));
            if (!fires.length) {
                const Tr = T.api("Torch"), p = $gamePlayer, dd = p.direction();
                const ahead = [dd === 6 ? 1 : dd === 4 ? -1 : 0, dd === 2 ? 1 : dd === 8 ? -1 : 0];
                const cells = [ahead, [ahead[1], ahead[0]], [-ahead[1], -ahead[0]], [-ahead[0], -ahead[1]], [0, 0]];
                if (Tr && Tr.plantTorch) {
                    try {
                        if (!Tr.isLit()) Tr.light();   // (a torch lit in his hand first: only a burning one goes into the ground)
                        for (const [dx, dy] of cells) if (Tr.plantTorch(p.x + dx, p.y + dy, { instant: true, quiet: true })) break;
                    } catch (e) { /* (no room) */ }
                }
                T.popup(D.TX.f9none, { icon: 436, color: "#ffd9a8" });
            } else T.popup(D.TX.f9moths, { icon: D.ICON.butterfly, color: "#9ff0a8" });
            lightsNow = readLights();
            lightsWait = 0; fresh = 2;
            void d;
        }
    }

    // ------------------------------------------------------------------
    // The API (F9, the tests, Farming_Build's hive)
    // ------------------------------------------------------------------
    const Motyle = window.Motyle = T.register(PLUGIN, {
        DATA: D, ITEM: D.ITEM, ICON: D.ICON, SPECIES: SP, ORDER,
        get flyers() { return flyers; }, get moths() { return moths; }, get spots() { return spots; }, get shoulder() { return shoulderB; },
        get netKind() { return NET_KIND; }, get force() { return force; }, set force(v) { force = v; },
        pending: null, netOpts, perf, store, auto: v => { auto = !!v; }, wanted, profile, profileOf, refreshSpots: () => { spotsKey = null; refreshSpots(true); return spots.length; },
        spawn, spawnMoth, land, flee, leave, hide, sendToShoulder, caught, release, swingNet, netTargets, netPoint, netChance, hasNet,
        pawikNow, hoursSinceRain, rainingNow, dryDays, dayFactor, mothTime, readLights: () => readLights(),
        pollen, produceBonus, fruitBonus, guardedAt, markNibbled, flowersNear, caseItems, caseDetail, kleofasTalk, act, reset,
        clear: () => { for (const b of flyers.concat(moths)) dropSprite(b); flyers = []; moths = []; shoulderB = null; }
    });
})();
