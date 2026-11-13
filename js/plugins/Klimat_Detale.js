//=============================================================================
// Klimat_Detale.js
//=============================================================================
// Small living details of the town (gracz 2026-11-09: „wszystko co się da i doda klimatu” - part C of three; A: ground and walls,
// B: weather and seasons are other plugins):
//   1. SIGNS: the hanging shop signs (!Signs) swing in the wind - the boards under a beam sway round their rings (a shear: the beam
//      stays put), the ones on a side bracket turn on their hinge (squeezed); a breeze always, much more with Storm.wind(), jerks in a
//      storm, now and then a quiet clink of the chain (SE "Chain") when one is on the screen in a strong wind.
//   2. WATER: open water barrels (Winlu C67, read from the tiles) and the horse troughs (Konie.js's injected !$Wodopoj events, read
//      from the map's events): small glints come and go on the surface by day; while it rains, rings from the drops.
//   3. STEAM: after a rain, in sunshine, thin wisps rise from the roofs (A3 roof cells) until they dry (about 2.5 hours of game time).
//   4. MOTES: tiny warm specks of dust and pollen drift in the morning (and, fainter, the evening) sun rays (Sky.js raysAt) over the
//      town's squares (region 31 - the squares where the eagle lands - and the boxes in MOTE_BOXES).
// Everything from ready pictures (tools/klimat/detale_obrazki.py: img/system/Klimat_Detal_*.png; the rings and glints, the steam,
// the motes), places read from the map when it loads (a map changed in the editor changes them too), sprites only for what is on the
// screen (pools). Outdoor maps only (Survival.isOutdoors); at the lowest graphics quality (Wydajnosc gfx.skyFx false) no steam and no motes.

/*:
 * @target MZ
 * @plugindesc Detale klimatu: szyldy kołyszą się na wietrze, błyski i kręgi deszczu na wodzie w beczkach i korytach, para z dachów w słońcu po deszczu, pyłki w porannych promieniach. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Klimat_Miasta
 *
 * @help
 * Bez ustawień. Działa na mapach pod gołym niebem.
 *  - Szyldy (grafika !Signs): kołysanie na wietrze, mocniej w burzy, czasem cichy brzęk łańcucha.
 *  - Woda: otwarte beczki z wodą (kafel C67) i koryta dla koni - błyski za dnia, kręgi od kropli w deszczu.
 *  - Para: po deszczu, w słońcu, z dachów unoszą się smużki pary, aż wyschną (ok. 2,5 godziny gry).
 *  - Pyłki: w porannych (i słabiej wieczornych) promieniach słońca nad placami miasta (region 31 i MOTE_BOXES).
 * API: KlimatDetale.info() (liczby dla testów).
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Klimat_Detale.js: brak TawernaCore.js");
    const PLUGIN = "Klimat_Detale";

    const MOTE_BOXES = { 8: [[29, 17, 76, 27], [30, 37, 73, 63]] };   // (the castle courtyard and the market of Kruczogród)
    const MOTE_REGION = 31;
    const C67 = 256 + 67;
    const BARREL = { cx: 24, cy: 36, rx: 11, ry: 4 };                 // the water's ellipse in the C67 tile (px)
    const TROUGH = { x0: 13, x1: 36, y0: 18, y1: 118, fh: 156 };       // the water's box in the !$Wodopoj frame (48 x 156)
    const STEAM_SHARE = 0.22, STEAM_DRY = 2.5;                         // roof cells that steam; hours it takes a roof to dry

    const rand = (a, b) => a + Math.random() * (b - a);
    const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + (k || 0) * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const smooth = t => { const k = Math.max(0, Math.min(1, t)); return k * k * (3 - 2 * k); };
    const hour = () => (typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const day = () => (typeof $gameSystem.dayNightDay === "function" ? $gameSystem.dayNightDay() : 1);
    const night = () => (window.Farming && Farming.nightAmount ? Farming.nightAmount() : 0);
    const wind = () => (window.Storm && Storm.wind ? Storm.wind() : 0);
    const windClock = () => (window.Storm && Storm.clock ? Storm.clock() : Graphics.frameCount / 60);
    const rainPower = () => { const w = $gameScreen.weatherType(); return (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0 ? Math.min(1, $gameScreen.weatherPower() / 6) : 0; };
    const outdoors = () => !!(window.Survival && Survival.isOutdoors && Survival.isOutdoors());
    const lowGfx = () => { const W = T.api("Wydajnosc"); return !!(W && W.gfx && W.gfx.skyFx === false); };
    const season = () => (window.Farming && Farming.seasonIndex ? Farming.seasonIndex(day()) : 1);
    const Sun = () => T.api("Sun") || window.Sky || null;

    // ------------------------------------------------------------------ 1. signs (on the character sprites themselves)
    // !Signs: blocks 0-3, rows 0-1 (directions 2, 4): a board under a beam (beam rows 0-5, rings 6-8, the board from 9) - sways round
    // the rings; blocks 0-3 rows 2-3 (directions 6, 8): a board on a bracket at its left, blocks 4-7: at its right - turns on the hinge
    const HOOK_Y = 6;
    let signFx = false, creakT = 0;
    const _updSprite = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _updSprite.call(this);
        const c = this._character;
        if (signFx && c && c._characterName === "!Signs" && !c._tileId && this.visible) swingSign(this, c);
        else if (this._twSw) unswing(this);
    };
    function unswing(s) {
        s.anchor.set(0.5, 1); s.skew.x = 0; s.scale.x = 1; s._twSw = null;
    }
    function swingSign(s, c) {
        const st = s._twSw || (s._twSw = { a: 0, v: 0, ph: hash(c.x, c.y, 3) * 6.28 });
        const w = wind(), breeze = 0.18 + 0.82 * w;
        const t = windClock() * (2.2 + 2.6 * w) + st.ph;
        const target = (0.012 + 0.042 * w) * Math.sin(t) * (0.75 + 0.25 * Math.sin(t * 0.37 + st.ph));
        st.v += (target - st.a) * 0.06 - st.v * 0.11;
        if (w > 0.55 && Math.random() < 0.02 * w) st.v += rand(-1, 1) * 0.007 * w;   // (a gust's jerk in a storm)
        st.a = Math.max(-0.075, Math.min(0.075, st.a + st.v));
        const block = c.characterIndex(), side = block >= 4 ? 1 : c.direction() >= 6 ? -1 : 0;
        const ph = s.patternHeight ? s.patternHeight() : 48, pw = s.patternWidth ? s.patternWidth() : 48;
        if (side === 0) {   // under a beam: a shear round the rings (the beam above them stays put)
            s.anchor.set(0.5, HOOK_Y / ph);
            s.y -= ph - HOOK_Y;
            s.skew.x = st.a;
            s.scale.x = 1;
        } else {            // on a side bracket: the board turns on its hinge (squeezed towards the bracket)
            const ax = side < 0 ? 1 / pw : (pw - 2) / pw;
            s.anchor.set(ax, 1);
            s.x += (ax - 0.5) * pw;
            s.skew.x = 0;
            s.scale.x = 1 - Math.min(0.22, Math.abs(st.a) * 2.6 * breeze);
        }
    }

    // ------------------------------------------------------------------ the map's places
    let places = null;
    function scan() {
        const d = $dataMap.data, W = $dataMap.width, H = $dataMap.height;
        const at = (z, x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(z * H + y) * W + x] || 0);
        const kind = v => (v >= 2048 ? Math.floor((v - 2048) / 48) : -1);
        const barrels = [], roofs = [], motes = [];
        const boxes = MOTE_BOXES[$gameMap.mapId()] || [];
        const roofSheet = /roof/i.test(($gameMap.tileset() && $gameMap.tileset().tilesetNames[8]) || "");   // (sheet E: the gable roofs)
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (at(2, x, y) === C67 || at(3, x, y) === C67) barrels.push(water("barrel", x, y));
            const k = kind(at(0, x, y)), e2 = at(2, x, y), e3 = at(3, x, y);
            const eRoof = roofSheet && ((e2 >= 768 && e2 < 1024) || (e3 >= 768 && e3 < 1024));
            if (((k >= 48 && k < 80) || eRoof) && hash(x, y, 21) < STEAM_SHARE) roofs.push({ x, y, t: 0, wait: Math.floor(hash(x, y, 4) * 200), jx: 0, spr: null });
            if ($gameMap.regionId(x, y) === MOTE_REGION || boxes.some(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3])) motes.push(x + y * W);
        }
        places = { data: $dataMap, mapId: $gameMap.mapId(), barrels, troughs: [], troughSig: "", roofs, moteCells: motes, W };
        return places;
    }
    const placesNow = () => (places && places.data === $dataMap ? places : scan());
    function water(kind, x, y, ev) {
        return { kind, x, y, ev, glints: [{ t: 0, life: 0, px: 0, py: 0, f: 0, spr: null }, ...(kind === "trough" ? [{ t: 0, life: 0, px: 0, py: 0, f: 0, spr: null }, { t: 0, life: 0, px: 0, py: 0, f: 0, spr: null }] : [])],
            rings: [], ringT: 0 };
    }
    function syncTroughs(p) {   // (Konie.js injects them as the map starts; checked once a second)
        if (Graphics.frameCount % 60 !== 0 && p.troughSig) return;
        const list = $gameMap.events().filter(e => e && e.characterName() === "!$Wodopoj" && !e._erased);
        const sig = list.map(e => e.eventId() + ":" + e.x + "," + e.y).join("|");
        if (sig === p.troughSig) return;
        for (const tr of p.troughs) dropWater(tr);
        p.troughs = list.map(e => water("trough", e.x, e.y, e.eventId()));
        p.troughSig = sig;
    }
    // a random point on the water (map px) and the surface's z in the tilemap
    function surfacePoint(wt) {
        const tw = 48;
        if (wt.kind === "barrel") {
            const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 0.8;
            return [wt.x * tw + BARREL.cx + Math.cos(a) * r * BARREL.rx, wt.y * tw + BARREL.cy + Math.sin(a) * r * BARREL.ry];
        }
        const top = (wt.y + 1) * tw - TROUGH.fh;
        return [wt.x * tw + rand(TROUGH.x0 + 3, TROUGH.x1 - 3), top + rand(TROUGH.y0 + 6, TROUGH.y1 - 6)];
    }
    const surfaceZ = wt => (wt.kind === "barrel" ? 4.5 : 1.5);   // (the barrel's top is a ☆ tile; the trough lies under the people)

    // ------------------------------------------------------------------ sprites (pooled, in the tilemap)
    let set = null, tm = null, bmpWater = null, bmpSteam = null, bmpMote = null;
    const pools = { glint: [], ring: [], steam: [], mote: [] };
    function take(kind, bmp, z, blend) {
        let s = pools[kind].pop();
        if (!s) { s = new Sprite(bmp); s.anchor.set(0.5, 0.5); if (blend) s.blendMode = blend; tm.addChild(s); }
        s.z = z; s.visible = true; return s;
    }
    function give(kind, s) { if (s) { s.visible = false; pools[kind].push(s); } }
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        set = this; tm = this._tilemap;
        for (const k in pools) pools[k] = [];
        bmpWater = ImageManager.loadSystem("Klimat_Detal_Woda"); bmpSteam = ImageManager.loadSystem("Klimat_Detal_Para"); bmpMote = ImageManager.loadSystem("Klimat_Detal_Pylek");
        const p = placesNow();
        for (const w of p.barrels.concat(p.troughs)) { for (const g of w.glints) g.spr = null; w.rings = []; }
        for (const r of p.roofs) r.spr = null;
        motes = [];
        p.troughSig = "";
    };
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _update.call(this);
        if (set !== this) return;
        try { frame(); } catch (e) { if (!failed++) console.warn("[Klimat_Detale] " + (e && e.message)); }
    };
    let failed = 0;

    const view = () => {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        return { tw, th, x0: $gameMap.displayX() - 2, y0: $gameMap.displayY() - 3, x1: $gameMap.displayX() + Graphics.width / tw + 2, y1: $gameMap.displayY() + Graphics.height / th + 3 };
    };
    const SX = (px, v) => Math.round($gameMap.adjustX(px / v.tw) * v.tw), SY = (py, v) => Math.round($gameMap.adjustY(py / v.th) * v.th);
    function frame() {
        const out = outdoors();
        signFx = out;
        const p = placesNow(), v = view();
        if (!out) { clearAll(p); return; }
        if (failed > 0 && Graphics.frameCount % 600 === 0) failed = 0;
        syncTroughs(p);
        const h = hour(), nt = night(), rain = rainPower();
        for (const wt of p.barrels) waterFx(wt, v, nt, rain);
        for (const wt of p.troughs) waterFx(wt, v, nt, rain);
        steam(p, v, h, rain);
        moteFx(p, v, h, rain);
        signSound(v);
    }
    function clearAll(p) {
        for (const wt of p.barrels.concat(p.troughs)) dropWater(wt);
        for (const r of p.roofs) { give("steam", r.spr); r.spr = null; }
        for (const m of motes) give("mote", m.spr);
        motes = [];
    }
    function dropWater(wt) {
        for (const g of wt.glints) { give("glint", g.spr); g.spr = null; }
        for (const r of wt.rings) give("ring", r.spr);
        wt.rings = [];
    }

    // ---- 2. water: glints by day, rings in the rain
    function waterFx(wt, v, nt, rain) {
        const on = wt.x > v.x0 && wt.x < v.x1 && wt.y > v.y0 && wt.y < v.y1 + 2;
        if (!on) { if (wt.glints[0].spr || wt.rings.length) dropWater(wt); return; }
        const z = surfaceZ(wt), day = 1 - 0.85 * nt, calm = rain > 0 ? 0.45 : 1;
        for (const g of wt.glints) {
            if (++g.t >= g.life) { g.t = 0; g.life = Math.round(rand(70, 170)); [g.px, g.py] = surfacePoint(wt); g.f = Math.floor(Math.random() * 4); g.dx = rand(-0.06, 0.06); }
            const s = g.spr || (g.spr = take("glint", bmpWater, z, 1));
            s.setFrame(g.f * 16, 0, 16, 8);
            s.x = SX(g.px + g.dx * g.t, v); s.y = SY(g.py, v);
            s.opacity = Math.round(255 * (wt.kind === "barrel" ? 0.8 : 0.55) * day * calm * Math.sin(Math.PI * g.t / g.life));
        }
        if (rain > 0) {
            wt.ringT -= rain * (wt.kind === "trough" ? 2.2 : 0.8);
            if (wt.ringT <= 0) { wt.ringT = rand(30, 70); const [px, py] = surfacePoint(wt); wt.rings.push({ px, py, t: 0, spr: take("ring", bmpWater, z, 0) }); }
        }
        for (let i = wt.rings.length - 1; i >= 0; i--) {
            const r = wt.rings[i], f = Math.floor(r.t / 5);
            if (f >= 6) { give("ring", r.spr); wt.rings.splice(i, 1); continue; }
            r.t++;
            r.spr.setFrame(f * 16, 8, 16, 8); r.spr.x = SX(r.px, v); r.spr.y = SY(r.py, v); r.spr.opacity = Math.round(255 * (0.55 + 0.25 * (1 - nt)));
        }
    }

    // ---- 3. steam off the roofs after a rain, in the sun
    function wetness(rain) {
        if (rain > 0) return 0;
        const S = window.Survival;
        if (!S || !S.weatherPlan) return 0;
        const d = day(), h = hour();
        let since = Infinity;
        for (const dd of [d, d - 1]) {
            const plan = S.weatherPlan(dd);
            if (!plan || plan.type !== "rain") continue;
            const end = (dd - d) * 24 + plan.end;
            if (h >= end) since = Math.min(since, h - end);
        }
        return since === Infinity ? 0 : Math.max(0, 1 - since / STEAM_DRY);
    }
    function steam(p, v, h, rain) {
        let k = 0;
        if (!lowGfx() && season() !== 3) {
            const sun = Sun(), elev = sun && sun.sky ? sun.sky(h).elev : 0;
            k = wetness(rain) * smooth((elev - 4) / 12);
        }
        for (const r of p.roofs) {
            const on = k > 0.03 && r.x > v.x0 && r.x < v.x1 && r.y > v.y0 && r.y < v.y1 + 1;
            if (!on) { if (r.spr) { give("steam", r.spr); r.spr = null; } continue; }
            if (r.wait > 0) { r.wait--; if (r.spr) r.spr.visible = false; continue; }
            const f = Math.floor(r.t / 9);
            if (f >= 8) { r.t = 0; r.wait = Math.round(rand(10, 90) / Math.max(0.3, k)); r.jx = rand(-12, 12); continue; }
            r.t++;
            const s = r.spr || (r.spr = take("steam", bmpSteam, 6, 0));
            s.visible = true; s.anchor.set(0.5, 1); s.scale.set(1.6, 1.6);
            s.setFrame(f * 32, 0, 32, 64);
            s.x = SX(r.x * 48 + 24 + r.jx, v); s.y = SY(r.y * 48 + 34, v);
            s.opacity = Math.round(255 * Math.min(1, 1.35 * k));
        }
    }

    // ---- 4. motes in the low sun's rays over the squares
    let motes = [], moteVis = [], moteVisAt = 99, moteWant = 0;
    function moteFx(p, v, h, rain) {
        let want = 0;
        if (!lowGfx() && rain <= 0 && p.moteCells.length) {
            const sun = Sun(), rays = sun && sun.raysAt ? sun.raysAt(h) : 0, morning = sun && sun.sky ? sun.sky(h).morning : h < 12;
            want = Math.round(56 * rays * (morning ? 1 : 0.6) * (1 - 0.7 * (window.Storm && Storm.level ? Storm.level() : 0)));
        }
        if (++moteVisAt > 30 || moteVisAt < 0) {   // (the squares' cells on the screen, twice a second; an own count: a new game resets the frame count)
            moteVisAt = 0;
            moteVis = p.moteCells.filter(i => { const x = i % p.W, y = Math.floor(i / p.W); return x > v.x0 + 1 && x < v.x1 - 1 && y > v.y0 + 2 && y < v.y1 - 2; });
        }
        if (!moteVis.length) want = 0;
        moteWant = want;
        while (motes.length < want && moteVis.length) {
            const i = moteVis[Math.floor(Math.random() * moteVis.length)];
            motes.push({ px: (i % p.W) * 48 + rand(0, 48), py: Math.floor(i / p.W) * 48 + rand(0, 48), up: rand(10, 70), vx: rand(-0.12, 0.05), vy: rand(-0.1, 0.04),
                ph: rand(0, 6.28), t: 0, life: Math.round(rand(260, 640)), f: Math.random() < 0.2 ? 0 : Math.random() < 0.62 ? 1 : 2, spr: take("mote", bmpMote, 8, 0) });
        }
        for (let i = motes.length - 1; i >= 0; i--) {
            const m = motes[i];
            m.t++;
            const gone = m.t >= m.life || (motes.length > want && m.t > 30 && Math.random() < 0.02);
            if (gone) { give("mote", m.spr); motes.splice(i, 1); continue; }
            m.px += m.vx + 0.08 * Math.sin(m.t * 0.021 + m.ph); m.py += m.vy + 0.05 * Math.sin(m.t * 0.017 + m.ph * 2);
            const s = m.spr;
            s.setFrame(m.f * 6, 0, 6, 6); s.scale.set(m.f === 2 ? 1.5 : 1.34, m.f === 2 ? 1.5 : 1.34); s.x = SX(m.px, v); s.y = SY(m.py - m.up, v);
            const fade = Math.min(1, m.t / 50, (m.life - m.t) / 60);
            s.opacity = Math.round(255 * 0.85 * fade * (0.45 + 0.55 * Math.sin(m.t * 0.09 + m.ph)));
        }
    }

    // ---- the chain's clink in a strong wind (one sign on the screen, rarely, quietly)
    function signSound(v) {
        const w = wind();
        if (w < 0.45 || --creakT > 0) return;
        creakT = Math.round(rand(480, 1400) / w);
        const s = $gameMap.events().find(e => e._characterName === "!Signs" && e.x > v.x0 + 2 && e.x < v.x1 - 2 && e.y > v.y0 + 3 && e.y < v.y1 - 3);
        if (s && T.audio && T.audio.se) T.audio.se("Chain", { volume: Math.round(10 + 14 * w), pitch: Math.round(rand(125, 150)) });
    }

    window.KlimatDetale = T.register ? T.register(PLUGIN, {
        info: () => { const p = places && places.data === $dataMap ? places : null; return p ? { barrels: p.barrels.length, troughs: p.troughs.length, roofs: p.roofs.length, moteCells: p.moteCells.length,
            glints: p.barrels.concat(p.troughs).reduce((n, w) => n + w.glints.filter(g => g.spr && g.spr.visible && g.spr.opacity > 0).length, 0),
            rings: p.barrels.concat(p.troughs).reduce((n, w) => n + w.rings.length, 0), steam: p.roofs.filter(r => r.spr && r.spr.visible).length, motes: motes.length, moteWant, moteVis: moteVis.length,
            signs: (set && set._characterSprites || []).filter(s => s._twSw).length } : null; },
        wetness: () => wetness(rainPower())
    }) : null;
})();
