//=============================================================================
// Kruk.js
//=============================================================================
// PAKIET B (docs/miejsca_wyspy/PAKIETY.md) - the engine of "Urwisko Kruków" (Map157) and the tame raven (concept approved by the
// user 2026-10-16: docs/miejsca_wyspy/KONCEPCJA.md section 4). The data and texts: Kruk_Data.js.
//   - the place is built: Wyspa.ready(157) once data/Map157.json is the real map (an XHR at the start, like Pustelnia.js): the
//     hermitage's east edge (Map155 47,17-18) leads here
//   - the raven is NOT an event: a bird of its own (x, y on the ground, z in px above it) drawn in the tilemap from img/system/Kruk.png
//     (cells 48 x 48: standing, cawing, pecking, taking off / landing, the flight loop, with a letter in the beak), its shadow on the
//     ground; it sits on perches (the field's grzęda, the Order's old perches, tree crowns, the cutter's mast), on the ground and on
//     the hero's shoulder, flies with a take-off, a flapping cruise, a glide and a landing
//   - K51 "Kruk z masztu": at dawn (5-7) the wild raven sits on the mast of the cutter's wreck at the harbour (Map125); the hero comes
//     near - it flies off and waits for him leg by leg: the harbour's top edge, the hermitage's raven cairn (Kleofas's line), a pine
//     at the Urwisko's west end, the old perch in the ravenry
//   - D24 "Oswojony kruk": three feedings in the ravenry on three days (meat or fish; no running near it, the dog left at home), then
//     it sits on the hero's shoulder: the ring (item 179) with the scroll (flag kronikaKarta6 -> Pustelnia gives card 6), the flag
//     krukTame, the naming screen (the prologue's, Prologue.Scene_HeroName - own texts); grandpa's talk; the perch on the field
//   - the tame raven: "Leć ze mną" (it flies along from map to map, sits on trees, the ground, the shoulder; waits outside the
//     interiors), "Zostań na grzędzie", "Pilnuj pola" (crows and sparrows chased from the crops round the perch - also while the
//     hero is away: the raids Birds.js would count are taken over here for the crops in reach), "Zanieś list" (once a day, to people
//     on the island, never over the sea: back in 1-2 hours with an answer; quest steps marked `kruk: true` count as delivered),
//     "Leć na zwiad" (once a day, a visited map: back with a TRUE report of today there - game, people, ore, berries, mushrooms -
//     at the top, in a bubble and in the journal, a red warning for wolves / a bear / boars / bandits), trinkets on the perch in the morning (coins, a lost thing, a foreign letter: read / give back / sell to
//     Baltazar), a warning caw when wolves, boars or bears come near; it eats from the perch's tray and drinks from its bowl (the
//     kennel's way), and hungry three days it goes back to the Urwisko (fed there once: back again). K: the raven's menu / call it.
//   - the Urwisko at night after D25: the strangers dig in the rubble - a camp of Humans.js on fixed seats (tag "kopaczeUrwisko")
// Ids 610-629 (Tawerna.inject, owner "Kruk"): not needed so far - everything here is drawn in code.
// DROUGHT (the user's rule): the sea here is salt (<Water:salt>); nothing gives the hero water.

/*:
 * @target MZ
 * @plugindesc [pakiet B] Urwisko Kruków (mapa 157) i oswojony kruk: kruczarnia, K51, D24, grzęda, listy, zwiad, błyskotki, pilnowanie pola. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa
 *
 * @help
 * ============================================================================
 * Kruk.js - Urwisko Kruków i oswojony kruk
 * ============================================================================
 * Mapa 157 „Urwisko Kruków”: ruiny murów twierdzy, kruczarnia zakonu, krata
 * przelewu cysterny, kamienie z krukiem w gruzie, nocą obóz obcych kopaczy.
 *
 * K51 „Kruk z masztu” (od Rocha): o świcie kruk siedzi na maszcie wraku kutra
 * i prowadzi bohatera przez pustelnię do kruczarni.
 * D24 „Oswojony kruk”: trzy karmienia w trzy dni, obrączka ze zwitkiem (karta
 * kroniki 6), imię od gracza, rozmowa z dziadkiem, grzęda na polu.
 *
 * Oswojony kruk (klawisz K - menu kruka; gdy go nie ma, przylatuje):
 * leć ze mną / zostań na grzędzie / pilnuj pola, zanieś list (raz dziennie,
 * tylko po wyspie), zwiad (raz dziennie: raport w dzienniku), nakarm. Rano na grzędzie czasem coś
 * leży. Kruk nie walczy i nie ginie: głodny trzy dni wraca na Urwisko.
 *
 * Grafika: img/system/Kruk.png (arkusz), Farm_Grzeda.png, Kruk_Grzeda_Stara.png,
 * img/characters/!$Urwisko_Gniazda.png (tools/kruk/art/build_sheet.py).
 * Test: tests/kruk_test.js (port 9502).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna, D = window.KrukData;
    if (!T) throw new Error("Kruk.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (!D) throw new Error("Kruk.js: brak Kruk_Data.js - musi być wyżej na liście wtyczek (the raven's data is missing)");
    const PLUGIN = "Kruk";
    const MAP = D.MAP, HARBOUR = D.HARBOUR, HERMITAGE = D.HERMITAGE;
    const SH = D.SHEET, R = D.RAVEN, TX = D.TX;
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const clock = () => day() * 24 + hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gamePlayer;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const iconOf = id => (item(id) ? item(id).iconIndex : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const W = () => window.Wyspa || T.api("Wyspa") || null;
    const F = () => window.Farming || null;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const TILE = () => $gameMap.tileWidth();

    // ------------------------------------------------------------------
    // The state (the save)
    // ------------------------------------------------------------------
    const store = T.state.define("kruk", () => ({
        stage: "wild",          // wild | tame | gone (hungry: back at the Urwisko)
        name: "", feeds: [], scaredUntil: 0, tamedDay: 0,
        mode: "follow", food: 80, water: 80, clock: null, zeroSince: 0,
        away: null,             // { kind: "letter" | "scout", until, to, map, quest }
        letterDay: 0, scoutDay: 0, sent: {}, opinion: {},
        scout: null,            // { day, map } - the marks shown there till the day's end
        trinket: null, trinketDay: 0,
        held: {}, gone: {},     // the foreign letters: held[id] = { read }, gone[id] = "back" | "sold"
        k51: { leg: 0 }, stones: {}, camp: { cleared: {}, seen: 0, n: 0 }, visited: {}, baltAsked: 0, nightSaid: 0
    }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const ravenName = () => (has() && S().name) || R.defaultName;
    const V = extra => Object.assign({ imie: ravenName(), need: R.feedNeed }, extra || {});
    const pop = (text, opts) => T.popup(fill(text, V(opts && opts.vars)), Object.assign({ color: "#f3e0a0", icon: D.RAVEN_ICON }, opts || {}));
    const popNeed = (icon, text) => T.popup.need(icon, fill(text, V()));

    // the quests' state (TownQuests): flags, records
    const qs = () => { const q = TQ(); return q && q.state ? q.state() : null; };
    const flag = k => { const s = qs(); return !!(s && s.flags && s.flags[k]); };
    function setFlag(k) {
        const w = W();
        if (w && w.setFlag) w.setFlag(k);
        else { const s = qs(); if (s && s.flags && !s.flags[k]) s.flags[k] = day(); }
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
        if (q && q.refreshMarkers) q.refreshMarkers();
    }
    const rec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const isDone = id => { const q = TQ(); return !!(q && q.isDone && q.isDone(id)); };
    const isActive = id => { const r = rec(id); return !!r && r.s === "active"; };
    const stepOf = id => { const r = rec(id); return r && r.s === "active" ? r.step : -1; };
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const xp = (n, why) => T.call("Combat", "gainXp", n, why, true) || 0;
    const autoChecks = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const outdoors = () => { const Sv = T.api("Survival"); return !!(Sv && Sv.isOutdoors ? Sv.isOutdoors() : T.mapFlag && T.mapFlag("Clouds", false)); };
    const tame = () => has() && S().stage === "tame";
    let built = false;   // data/Map157.json is the real map (not package 0's stub) - set by checkBuilt() below
    const sleeping = () => inHours(hour(), R.sleep);

    // ------------------------------------------------------------------
    // The perches of the field (Farming's building "grzeda") and the map's markers ("Miejsce: <key>")
    // ------------------------------------------------------------------
    function perches() {
        const Fm = F(), all = (Fm && Fm.farm && Fm.farm().buildings) || {}, out = [];
        for (const m of Object.keys(all)) {
            if (Fm.landHeld && Fm.landHeld(Number(m))) continue;   // (the field lost to the Lord: not its home - Homes.js)
            for (const b of all[m] || []) if (b && b.type === "grzeda" && !b.site) out.push({ b, map: Number(m) });
        }
        return out;
    }
    const perch = () => perches()[0] || null;
    const perchPoint = p => ({ x: p.b.x + 0.5, y: p.b.y + 1 - 1 / 48, z: SH.perchZ.grzeda });
    function marker(key) {
        if (!window.$dataMap || !$dataMap.events) return null;
        const e = $dataMap.events.find(ev => ev && ev.name === "Miejsce: " + key);
        return e ? { x: e.x, y: e.y } : null;
    }
    function eventNamed(re) {
        return $gameMap.events().find(e => e && e.event() && re.test(e.event().name || "") && !e._transparent && (e._przystan ? !e._przystan.hidden : true)) || null;
    }
    // a character's sprite in the map (its picture's height: a tree's crown, a rock's top)
    function spriteOfChar(ch) {
        const sc = SceneManager._scene, set = sc && sc._spriteset;
        return set && set._characterSprites ? set._characterSprites.find(s => s._character === ch) : null;
    }

    // ------------------------------------------------------------------
    // Birds (the raven and the Urwisko's flock): x, y - the point on the ground (tiles), z - px above it
    // ------------------------------------------------------------------
    const FLY = { speed: 0.085, fast: 0.15, cruise: [46, 96], takeoff: 5, land: 5, flap: 4 };
    function newBird(kind, x, y, z) {
        return { kind, x, y, z, facing: Math.random() < 0.5 ? 1 : -1, state: "sit", t: 0, anim: null, target: null, then: null,
            idle: Math.round(rand(90, 260)), letter: false, sprite: null, holder: null, shadow: null, high: false, gone: false, _dead: false };
    }
    function setAnim(b, row, frames, speed, then) { b.anim = { row, frames, i: 0, t: 0, speed, then }; }
    function caw(b, loud) {
        setAnim(b, SH.caw[0], SH.caw[1], 6, null);
        if (onScreen(b, 2)) T.audio.se("Crow", { volume: loud ? 55 : 32, pitch: Math.round(rand(72, 86)), pan: panOf(b.x) });
    }
    const panOf = x => Math.max(-80, Math.min(80, ((x - $gameMap.displayX()) / (T.view.w() / TILE()) - 0.5) * 140));
    function onScreen(b, margin) {
        const m = margin || 0, w = T.view.w() / TILE(), h = T.view.h() / TILE(), ox = $gameMap.displayX(), oy = $gameMap.displayY();   // (the world's view: Tawerna.view)
        return b.x > ox - m && b.x < ox + w + m && b.y - b.z / 48 > oy - m && b.y < oy + h + m;
    }
    // to (x, y, z): a take-off first when it sits; `p.off` - out of the screen and gone; `p.hero` - onto the hero's shoulder
    function flyTo(b, p, then) {
        b.target = p;
        b.then = then || null;
        b.anim = null;
        if (b.state !== "fly" && b.state !== "takeoff") { b.state = "takeoff"; b.t = 0; }
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        b.cruise = Math.max(p.z || 0, Math.min(FLY.cruise[1], FLY.cruise[0] + d * 6));
    }
    function landAt(b, p) {
        b.x = p.x; b.y = p.y; b.z = p.z || 0;
        b.state = p.hero ? "shoulder" : "sit";
        b.target = null;
        b.idle = Math.round(rand(80, 240));
    }
    function shoulderPoint() {
        const p = $gamePlayer, d = p.direction(), side = d === 4 ? 1 : d === 6 ? -1 : 1;
        return { x: p._realX + 0.5 + side * 0.17, y: p._realY + 0.98, z: 42, hero: true, facing: d === 4 ? -1 : d === 6 ? 1 : side, side };
    }
    function updateBird(b) {
        b.t++;
        if (b.state === "takeoff") {
            if (b.t >= SH.takeoff[1].length * FLY.takeoff) { b.state = "fly"; b.t = 0; b.z += 8; }
            if (b.target && Math.abs(b.target.x - b.x) > 0.05) b.facing = b.target.x > b.x ? 1 : -1;
            return;
        }
        if (b.state === "land") {
            if (b.t >= SH.takeoff[1].length * FLY.land) { const p = b.target; landAt(b, p); const then = b.then; b.then = null; if (then) then(b); }
            else if (b.target && b.target.hero) { const s = shoulderPoint(); b.x = s.x; b.y = s.y; b.z = s.z; }
            return;
        }
        if (b.state === "fly") {
            let tg = b.target;
            if (!tg) { b.state = "sit"; return; }
            if (tg.hero) tg = b.target = Object.assign({}, shoulderPoint());
            const dx = tg.x - b.x, dy = tg.y - b.y, d = Math.hypot(dx, dy);
            const step = Math.min(FLY.fast, FLY.speed + d * 0.004);
            if (Math.abs(dx) > 0.04) b.facing = dx > 0 ? 1 : -1;
            const tz = tg.z || 0;
            if (tg.off || d > 2.2) b.z += (b.cruise - b.z) * 0.04;
            else b.z = tz + (b.z - tz) * Math.max(0, (d - step) / Math.max(d, 0.001));
            if (d > step) { b.x += dx / d * step; b.y += dy / d * step; return; }
            b.x = tg.x; b.y = tg.y;
            if (tg.off) { b.gone = true; const then = b.then; b.then = null; if (then) then(b); return; }
            b.z = tz;
            b.state = "land"; b.t = 0;
            if (tg.facing) b.facing = tg.facing;
            return;
        }
        // sitting (a perch, the ground, the shoulder): the idle life
        if (b.state === "shoulder") {
            const s = shoulderPoint();
            b.x = s.x; b.y = s.y; b.z = s.z;
            if (!b.anim) b.facing = s.facing;
        }
        if (b.anim) {
            const a = b.anim;
            if (++a.t >= a.speed) { a.t = 0; a.i++; }
            if (a.i >= a.frames.length) { b.anim = null; if (a.then) a.then(b); }
            return;
        }
        // asleep on a perch at night: the feathers puffed, the head tucked under the wing (it settles down in four frames)
        const nap = b.state === "sit" && (b.z >= 20 || b.high) && !b.busy && sleeping();
        if (nap) { if ((b.nap || 0) < SH.sleep[1].length * 12) b.nap = (b.nap || 0) + 1; return; }
        b.nap = 0;
        if (--b.idle > 0) return;
        b.idle = Math.round(rand(120, 360));
        const r = Math.random();
        if (r < 0.3) caw(b);
        else if (r < 0.55 && (b.state === "shoulder" || b.z < 2 || b.kind !== "pet")) setAnim(b, SH.peck[0], SH.peck[1], 5, null);
        else if (b.state !== "shoulder") b.facing = -b.facing;
    }
    function frameOf(b) {
        if (b.state === "takeoff") { const i = Math.min(SH.takeoff[1].length - 1, Math.floor(b.t / FLY.takeoff)); return [SH.takeoff[0], SH.takeoff[1][i]]; }
        if (b.state === "land") { const i = Math.max(0, SH.takeoff[1].length - 1 - Math.floor(b.t / FLY.land)); return [SH.takeoff[0], SH.takeoff[1][i]]; }
        if (b.state === "fly") {
            const tg = b.target, d = tg ? Math.hypot(tg.x - b.x, tg.y - b.y) : 9;
            const gliding = !tg || tg.off ? Math.floor(b.t / 180) % 3 === 2 && b.z > 40 : d < 1.6;
            if (b.letter) return [SH.letterFly[0], SH.letterFly[1][gliding ? 2 : Math.floor(b.t / FLY.flap) % SH.letterFly[1].length]];
            if (gliding) return SH.glide;
            return [SH.fly[0], SH.fly[1][Math.floor(b.t / FLY.flap) % SH.fly[1].length]];
        }
        if (b.anim) return [b.anim.row, b.anim.frames[Math.min(b.anim.i, b.anim.frames.length - 1)]];
        if (b.nap) return [SH.sleep[0], SH.sleep[1][Math.min(SH.sleep[1].length - 1, Math.floor(b.nap / 12))]];
        return b.letter ? SH.letterStand : SH.stand;
    }

    // ---- the pictures: a holder at the bird's foot point (the tilemap sorts by it), the frame inside it at -z, a shadow
    let shadowBmp = null;
    function shadowBitmap() {
        if (shadowBmp) return shadowBmp;
        shadowBmp = new Bitmap(28, 10);
        const ctx = shadowBmp.context;
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.beginPath(); ctx.ellipse(14, 5, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
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
        spr.anchor.set(0.5, SH.feet / SH.cell);
        spr._character = b;
        spr.patternHeight = () => SH.height;   // (SpeechBubbles: the bubble over its head)
        holder.addChild(spr);
        sh.anchor.set(0.5, 0.5);
        sh.z = 1;
        tm.addChild(sh);
        tm.addChild(holder);
        b.holder = holder; b.sprite = spr; b.shadow = sh;
        b._sprite = spr;
        return true;
    }
    function dropSprite(b) {
        for (const s of [b.holder, b.shadow]) if (s && s.parent) s.parent.removeChild(s);
        b.holder = b.sprite = b.shadow = b._sprite = null;
    }
    function drawBird(b) {
        if (!ensureSprite(b)) return;
        const tw = TILE(), th = $gameMap.tileHeight(), gx = Math.round($gameMap.adjustX(b.x) * tw), gy = Math.round($gameMap.adjustY(b.y) * th);
        const [row, col] = frameOf(b), s = b.sprite, h = b.holder;
        s.setFrame(col * SH.cell, row * SH.cell, SH.cell, SH.cell);
        s.scale.x = b.facing;
        h.x = gx;
        const flying = b.state === "fly" || b.state === "takeoff" || b.state === "land";
        if (b.state === "shoulder" || (b.target && b.target.hero && b.state === "land")) {
            h.y = Math.round($gameMap.adjustY($gamePlayer._realY) * th) + th + 1;   // (sorted right after the hero: on his shoulder)
            s.y = -(h.y - gy) - b.z;
            h.z = 3;
        } else {
            h.y = gy;
            s.y = -Math.round(b.z);
            h.z = flying ? (b.z > 26 ? 9 : 3) : b.high || b.z >= 20 ? 6 : 3;   // (sitting up high: over the tree crowns and the upper tiles)
        }
        const sh = b.shadow;
        sh.x = gx; sh.y = gy;
        sh.visible = flying && b.z > 1 && !b.high;
        sh.alpha = Math.max(0.2, 1 - b.z / 150);
        sh.scale.set(Math.max(0.5, 1 - b.z / 260), 1);
    }

    // ------------------------------------------------------------------
    // The Order's old perches in the ravenry (pictures on the markers zerdz_1 / zerdz_2 of Map157)
    // ------------------------------------------------------------------
    let oldPerches = [];
    function drawOldPerches() {
        const tm = tilemap();
        if (!tm || $gameMap.mapId() !== MAP) { oldPerches = []; return; }
        if (!oldPerches.length || oldPerches.some(o => o.s.parent !== tm)) {
            for (const o of oldPerches) if (o.s.parent) o.s.parent.removeChild(o.s);
            oldPerches = [];
            for (const key of ["zerdz_1", "zerdz_2"]) {
                const m = marker(key);
                if (!m) continue;
                const s = new Sprite(ImageManager.loadSystem(SH.oldPerch));
                s.anchor.set(0.5, 1);
                s.z = 3;
                tm.addChild(s);
                oldPerches.push({ s, x: m.x + 0.5, y: m.y + 1 });
            }
        }
        const tw = TILE(), th = $gameMap.tileHeight();
        for (const o of oldPerches) { o.s.x = Math.round($gameMap.adjustX(o.x) * tw); o.s.y = Math.round($gameMap.adjustY(o.y) * th) - 1; }
    }
    function oldPerchPoint(key) {
        const m = marker(key);
        return m ? { x: m.x + 0.5, y: m.y + 1 - 1 / 48, z: SH.perchZ.stara } : null;
    }

    // ------------------------------------------------------------------
    // Where the raven is now (this map): the wild one, K51's legs, the tame one by its mode
    // ------------------------------------------------------------------
    let pet = null;      // the raven's bird on this map (or null)
    let flock = [];      // the Urwisko's ravens (decoration)
    // the cutter's mast at the harbour: the wreck on the beach or on the slipway (Przystan.js shows one of them)
    function mastPoint() {
        const ev = eventNamed(/^Kuter: (wrak na plaży|na pochylni)/) || eventNamed(/^Kuter/);
        if (!ev) return { x: 14.2, y: 35.95, z: 108, high: true };
        const wreck = /wrak|pochylni/.test(ev.event().name);
        const dx = wreck ? -63 / 48 : -0.6, dz = wreck ? 111 : 96;
        return { x: ev._realX + 0.5 + dx, y: ev._realY + 0.98, z: dz, high: true, facing: 1 };
    }
    // K51's legs: where the raven waits on each map, how near the hero must come, where it flies then
    function legs() {
        const cairn = () => { const e = eventNamed(/^Kopiec z krukiem/); return e ? { x: e._realX + 0.5, y: e._realY + 0.98, z: 34, high: true } : { x: 27.5, y: 19.98, z: 34, high: true }; };
        const pine = () => { const e = $gameMap.events().find(ev => ev && ev.x === 3 && ev.y === 18); const sp = e ? spriteOfChar(e) : null;
            return { x: 3.5, y: 18.98, z: sp && sp.patternHeight ? Math.round(sp.patternHeight() * 0.72) : 100, high: true }; };
        return [
            { map: HARBOUR, at: mastPoint, near: 4.5, go: () => ({ x: 15.5, y: 2.6, z: 0 }), dawn: true },
            { map: HARBOUR, at: () => ({ x: 15.5, y: 2.6, z: 0 }), near: 4, go: () => ({ x: 15.5, y: -3, z: 90, off: true }) },
            { map: HERMITAGE, at: cairn, near: 6, go: () => ({ x: 50, y: 17.5, z: 80, off: true }), kleofas: true },
            { map: MAP, at: pine, near: 6, go: () => oldPerchPoint("zerdz_2") },
            { map: MAP, at: () => oldPerchPoint("zerdz_2"), near: 3.2, end: true }
        ];
    }
    const k51On = () => isActive("K51");
    // the wild (or the hungry, gone) raven's place: null - not on this map
    function wildPlace() {
        const mapId = $gameMap.mapId(), s = S();
        if (!built) return null;   // (the Urwisko not built yet - package 0's stub: no raven anywhere)
        if (k51On() && s.k51.leg >= 1) {
            const L = legs()[Math.min(s.k51.leg, 4)], at = L.map === mapId ? L.at() : null;
            return at ? { leg: s.k51.leg, at } : null;
        }
        if (s.stage === "wild" && inHours(hour(), R.wildMast) && !isDone("K51")) return mapId === HARBOUR ? { leg: 0, at: mastPoint() } : null;
        if (mapId !== MAP || clock() < s.scaredUntil) return null;
        const at = oldPerchPoint("zerdz_2");
        return at ? { at, ravenry: true } : null;
    }
    // the tame raven: where it is on this map now ({ at, how: "perch" | "join" | "back" } or null)
    function tamePlace() {
        const s = S(), mapId = $gameMap.mapId(), p = perch();
        if (s.away || clock() < (s.fledUntil || 0)) return null;
        const onPerch = p && p.map === mapId ? { at: perchPoint(p), how: "perch" } : null;
        if (s.mode !== "follow" || (sleeping() && p)) return onPerch;
        if (!outdoors()) return null;
        return { how: "join" };
    }

    // spots near the hero for a following raven: a tree's crown, a rock, the ground, his shoulder
    function spotNearHero(avoidShoulder) {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.9, out = [];
        for (const e of $gameMap.events()) {
            if (!e || e._transparent || !e.characterName()) continue;
            const name = e.characterName(), d = Math.hypot(e.x + 0.5 - px, e.y + 1 - py);
            if (d < 1.5 || d > 6.5) continue;
            const tree = /Pine|Tree|Oak|Birch|Spruce|Fruit/i.test(name), rock = /Rock|Boulder|Stump|Trunk/i.test(name);
            if (!tree && !rock) continue;
            const sp = spriteOfChar(e), ph = sp && sp.patternHeight ? sp.patternHeight() : 48;
            out.push({ x: e._realX + 0.5, y: e._realY + 0.98, z: Math.round(ph * (tree ? 0.8 : 0.55)), high: true, w: tree ? 3 : 1 });
        }
        if (out.length && Math.random() < 0.55) {
            const tot = out.reduce((t, o) => t + o.w, 0);
            let r = Math.random() * tot;
            for (const o of out) if ((r -= o.w) <= 0) return o;
        }
        if (!avoidShoulder && Math.random() < 0.35) return shoulderPoint();
        for (let i = 0; i < 40; i++) {
            const a = rand(0, Math.PI * 2), d = rand(1.6, 3.2), x = Math.floor(px + Math.cos(a) * d), y = Math.floor(py + Math.sin(a) * d);
            if ($gameMap.isValid(x, y) && $gameMap.isPassable(x, y, 2) && $gameMap.eventsXy(x, y).length === 0 && !(F() && F().buildingAt && F().buildingAt(x, y)))
                return { x: x + 0.5, y: y + 0.85, z: 0 };
        }
        return shoulderPoint();
    }
    // a point off the screen on the side of (x, y) (or a random side)
    function offscreenFrom(x, y) {
        const w = T.view.w() / TILE(), h = T.view.h() / TILE(), ox = $gameMap.displayX(), oy = $gameMap.displayY();
        const cx = ox + w / 2, cy = oy + h / 2, dx = (x === undefined ? rand(-1, 1) : x - cx), dy = (y === undefined ? rand(-1, 1) : y - cy);
        if (Math.abs(dx) * h > Math.abs(dy) * w) return { x: dx > 0 ? ox + w + 3 : ox - 3, y: oy + rand(1, h - 1), z: 90, off: true };
        return { x: ox + rand(1, w - 1), y: dy > 0 ? oy + h + 4 : oy - 3, z: 90, off: true };
    }

    // ------------------------------------------------------------------
    // The raven's brain, every few frames
    // ------------------------------------------------------------------
    let thinkT = 0, heroStill = 0, lastHero = null;
    function spawnPet(at, flyIn) {
        if (!at) return null;
        if (flyIn) {
            const o = offscreenFrom();
            pet = newBird("pet", o.x, o.y, 80);
            pet.state = "fly"; pet.t = 0; pet.cruise = 80;
            pet.target = at;
            return pet;
        }
        pet = newBird("pet", at.x, at.y, at.z || 0);
        pet.high = !!at.high;
        if (at.hero) pet.state = "shoulder";
        if (at.facing) pet.facing = at.facing;
        return pet;
    }
    function removePet() { if (pet) dropSprite(pet); pet = null; }
    function sendOff(then) {   // it flies out of the screen and is gone from this map
        if (!pet) { if (then) then(); return; }
        const o = offscreenFrom(pet.x + rand(-6, 6), pet.y - 10);
        flyTo(pet, o, () => { removePet(); if (then) then(); });
    }
    function think() {
        if (!has()) return;
        const s = S();
        // the hero standing still (for landing on his shoulder)
        const hx = $gamePlayer._realX, hy = $gamePlayer._realY;
        if (lastHero && Math.abs(lastHero[0] - hx) < 0.01 && Math.abs(lastHero[1] - hy) < 0.01) heroStill++; else heroStill = 0;
        lastHero = [hx, hy];
        if (s.stage === "tame") return thinkTame();
        return thinkWild();
    }
    function thinkWild() {
        const s = S(), wp = wildPlace();
        if (!wp || !wp.at) { if (pet && pet.state !== "fly") sendOff(); else if (pet && !pet.target) removePet(); return; }
        if (!pet) { if (spawnPet(wp.at, false)) pet.wild = true; return; }
        if (pet.state === "fly" || pet.state === "takeoff" || pet.state === "land" || pet.busy) return;
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.9, d = Math.hypot(pet.x - px, pet.y - py);
        // K51: the hero came near - it caws and flies on
        if (wp.leg !== undefined && k51On()) {
            const L = legs()[Math.min(wp.leg, 4)];
            if (L.end) { if (d < L.near + 0.8) k51Arrive(); return; }
            if (L.dawn && !inHours(hour(), R.wildMast) && s.k51.leg === 0) return;
            if (d < L.near) {
                caw(pet, true);
                if (L.kleofas) kleofasLine();
                if (s.k51.leg === 0) { T.call("SpeechBubbles", "say", $gamePlayer, TX.k51Mast[1].replace(/^\(|\)$/g, ""), 200); }
                const go = L.go();
                pet.busy = true;
                setTimeout0(() => { if (pet) flyTo(pet, go, b => {
                    if (b) b.busy = false;
                    S().k51.leg = Math.max(S().k51.leg, wp.leg + 1);
                    if (go.off) removePet();
                    autoChecks();
                }); }, 30);
            } else if (Math.random() < 0.025 && d < 14) { caw(pet); T.call("SpeechBubbles", "say", pet, pick(TX.k51Wait), 120); }
            return;
        }
        // the young raven in the ravenry: a runner near it flies it off for an hour (taming)
        if (wp.ravenry && s.stage !== "tame" && $gamePlayer.isDashing && $gamePlayer.isDashing() && $gamePlayer.isMoving() && d < R.runScare) {
            s.scaredUntil = clock() + 1;
            caw(pet, true);
            popNeed(D.RAVEN_ICON, TX.feedRun);
            sendOff();
        }
    }
    // a little delay in frames (a caw first, then the take-off)
    const later = [];
    function setTimeout0(fn, frames) { later.push({ fn, at: Graphics.frameCount + (frames || 1) }); }
    function runLater() {
        for (const l of later.slice()) if (Graphics.frameCount >= l.at) { later.splice(later.indexOf(l), 1); try { l.fn(); } catch (e) { console.error("[Kruk]", e); } }
    }
    function kleofasLine() {
        const L = TL(), ev = L && L.eventOf ? L.eventOf("pustelnik") : null;
        const here = ev && $gameMap.event(ev.eventId()) === ev && !(ev._town && ev._town.hidden) && Math.hypot(ev._realX - $gamePlayer._realX, ev._realY - $gamePlayer._realY) < 14;
        if (here) T.call("SpeechBubbles", "say", ev, TX.k51Kleofas, 300);
        else T.call("SpeechBubbles", "say", $gamePlayer, TX.k51KleofasThink, 240);
    }
    function k51Arrive() {
        const s = S();
        if (s.k51.leg >= 5) return;
        s.k51.leg = 5;
        if (pet) caw(pet, true);
        T.call("SpeechBubbles", "say", $gamePlayer, TX.k51Ravenry.replace(/^\(|\)$/g, ""), 260);
        autoChecks();
    }
    function thinkTame() {
        const s = S(), tp = tamePlace();
        if (!tp) {
            if (pet && pet.state !== "fly" && onScreen(pet, 1)) { if (s.mode === "follow" && sleeping() && perch() && s.nightSaid !== day()) { s.nightSaid = day(); pop(TX.night); } sendOff(); }
            else if (pet && !pet.target) removePet();
            return;
        }
        if (!pet) {
            if (tp.how === "perch") { if (spawnPet(tp.at, false)) pet.high = true; }
            else spawnPet(spotNearHero(true), true);
            return;
        }
        if (pet.state === "fly" || pet.state === "takeoff" || pet.state === "land" || pet.busy) return;
        if (tp.how === "perch") {
            const at = tp.at;
            if (Math.hypot(pet.x - at.x, pet.y - at.y) > 0.2 || Math.abs(pet.z - at.z) > 2) { pet.high = true; flyTo(pet, Object.assign({ high: true }, at)); return; }
            if (s.mode === "guard") guardLive(at);
            return;
        }
        // following: near him, on a tree, the ground or his shoulder
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.9, d = Math.hypot(pet.x - px, pet.y - py);
        warnCheck();
        if (pet.state === "shoulder") {
            if (($gamePlayer.isDashing && $gamePlayer.isDashing() && $gamePlayer.isMoving()) || T.call("Combat", "inCombatMode") || $gameSystem._combatMode) { pet.high = false; flyTo(pet, spotNearHero(true)); }
            return;
        }
        if (d > 7 || (d > 4.5 && !$gamePlayer.isMoving() && Math.random() < 0.3)) { const sp = spotNearHero(false); pet.high = !!sp.high; flyTo(pet, sp); return; }
        if (heroStill > 6 && d < 6 && Math.random() < 0.12 && !$gameMap.isEventRunning()) { pet.high = false; flyTo(pet, shoulderPoint()); }
    }

    // ------------------------------------------------------------------
    // The Urwisko's flock (decoration): ravens on the towers, the crenels, the nests; one takes off now and then
    // ------------------------------------------------------------------
    const FLOCK_SPOTS = [[14.6, 4.6], [15.5, 4.45], [25.5, 5.55], [26.4, 5.6], [3.4, 5.35], [4.6, 5.3], [17.4, 6.35], [18.6, 6.3],
        [43.5, 5.3], [45.5, 5.35], [46.6, 5.3], [12.5, 9.75], [22.4, 9.8], [31.5, 8.8], [44.5, 8.75], [33.5, 10.6]];
    let flockT = 0;
    function syncFlock() {
        if ($gameMap.mapId() !== MAP || !built) { for (const b of flock) dropSprite(b); flock = []; return; }
        if (flock.length) return;
        const spots = FLOCK_SPOTS.slice().sort(() => Math.random() - 0.5).slice(0, 10);
        flock = spots.map(([x, y]) => { const b = newBird("flock", x, y, 0); b.high = y < 9; return b; });
        // the old perch next to the young raven: one of the flock sits there too
        const z1 = oldPerchPoint("zerdz_1");
        if (z1) { const b = newBird("flock", z1.x, z1.y, z1.z); b.high = true; b.facing = 1; flock.push(b); }
    }
    function updateFlock() {
        if (!flock.length) return;
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.9, running = $gamePlayer.isDashing && $gamePlayer.isDashing() && $gamePlayer.isMoving();
        if (--flockT <= 0 && !sleeping()) {
            flockT = Math.round(rand(240, 600));
            const sitting = flock.filter(b => b.state === "sit" && !b.anim);
            if (sitting.length) {
                const b = pick(sitting), free = FLOCK_SPOTS.filter(([x, y]) => !flock.some(o => Math.hypot(o.x - x, o.y - y) < 0.6 || (o.target && Math.hypot(o.target.x - x, o.target.y - y) < 0.6)));
                if (free.length) { const [x, y] = pick(free); if (Math.random() < 0.5) caw(b); flyTo(b, { x, y, z: 0, high: y < 9 }); b.high = false; }
            }
        }
        for (const b of flock) {
            updateBird(b);
            if (b.state === "sit" && b.target === null && b.z < 2 && running && Math.hypot(b.x - px, b.y - py) < 3.5) {
                const [x, y] = pick(FLOCK_SPOTS.slice(0, 11));
                caw(b, true); flyTo(b, { x, y, z: 0, high: true });
            }
            if (b.state === "sit" && b.target === null) b.high = b.y < 9 || b.z > 10;
            drawBird(b);
        }
    }

    // ------------------------------------------------------------------
    // Taming in the ravenry (D24's first step): meat or fish, three days
    // ------------------------------------------------------------------
    const FOOD = () => (D.FOOD && D.FOOD.length ? D.FOOD : [94, 98, 105, 173, 174]);
    const meatInBag = () => FOOD().find(id => count(id) > 0) || 0;
    const fedToday = () => S().feeds.includes(day());
    function dogAlong() {
        const Dg = T.api("Dog"), d = Dg && Dg.state ? Dg.state() : null;
        return !!(d && d.tame && d.mode === "follow" && d.map === $gameMap.mapId());
    }
    // why the young raven cannot be fed now (null: it can)
    function feedBlock() {
        if (!pet || !pet.wild || !wildPlace() || !wildPlace().ravenry) return TX.feedGone;
        if (!inHours(hour(), R.feedHours)) return TX.feedNight;
        if (dogAlong()) return TX.feedDog;
        if (fedToday()) return TX.feedDone;
        if (!meatInBag()) return TX.feedNoMeat;
        return null;
    }
    function openYoungMenu() {
        const s = S(), meat = meatInBag(), why = feedBlock();
        const n = s.feeds.length;
        const entries = [{ name: "Połóż mu mięso", icon: meat ? iconOf(meat) : D.RAVEN_ICON, right: meat ? item(meat).name : "", enabled: !why,
            help: why ? fill(why, V()) + "." : "Kładziesz kawałek mięsa na kamieniu pod żerdzią. Kruk bierze jedzenie z ręki dopiero po kilku dniach. Raz dziennie.", run: feedYoung }];
        const sc = SceneManager._scene;
        if (sc && sc.openFarmMenu) sc.openFarmMenu(s.stage === "gone" ? ravenName() : "Młody kruk", entries, undefined, undefined, undefined, undefined,
            s.stage === "gone" ? "Wrócił na Urwisko, bo był głodny. Nakarm go, to wróci z tobą." : "Karmienia: " + Math.min(n, R.feedNeed) + "/" + R.feedNeed + " (każde innego dnia).");
    }
    function feedYoung() {
        const why = feedBlock();
        if (why) { popNeed(meatInBag() ? D.RAVEN_ICON : iconOf(FOOD()[0]), why); return; }
        const s = S(), meat = meatInBag();
        $gameParty.loseItem(item(meat), 1);
        s.feeds.push(day());
        T.audio.se("Bite", { volume: 40, pitch: 130 });
        const n = s.feeds.length, back = pet ? { x: pet.x, y: pet.y, z: pet.z, high: true } : null;
        // it hops down by the hero, pecks, and (not tame yet) goes back up
        const ground = groundBy();
        pet.busy = true;
        flyTo(pet, ground, b => {
            setAnim(b, SH.peck[0], SH.peck[1], 5, bb => {
                if (S().stage === "gone") { regain(); bb.busy = false; return; }
                if (n >= R.feedNeed && S().stage === "wild") { tameNow(); bb.busy = false; return; }
                bb.high = true;
                flyTo(bb, back || oldPerchPoint("zerdz_2"), b3 => { b3.busy = false; });
            });
        });
        if (s.stage === "gone") return;
        pop(pick(TX.feedOk), { vars: { n: Math.min(n, R.feedNeed), need: R.feedNeed } });
        autoChecks();
    }
    function groundBy() {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.9, d = $gamePlayer.direction();
        const fx = d === 4 ? -1 : d === 6 ? 1 : 0, fy = d === 8 ? -1 : d === 2 ? 1 : 0;
        return { x: px + fx * 1.0 + (fx ? 0 : 0.6), y: py + fy * 0.9, z: 0, facing: fx ? -fx : -1 };
    }
    // the third feeding: on the shoulder, the ring with the scroll, the name
    function tameNow() {
        const s = S();
        if (s.stage === "tame") return;
        s.stage = "tame";
        s.tamedDay = day();
        s.mode = "follow";
        s.food = 85; s.water = 80; s.clock = clock();
        if (pet) { pet.wild = false; pet.high = false; flyTo(pet, shoulderPoint()); }
        if (item(D.ITEM.ring) && count(D.ITEM.ring) < 1) $gameParty.gainItem(item(D.ITEM.ring), 1);
        setFlag("kronikaKarta6");
        setFlag("krukTame");
        const list = [];
        for (const line of TX.tamed) { list.push(C(101, ["", 0, 0, 2, ""])); list.push(C(401, ["\\SPK[0]" + line])); }
        list.push(C(355, ["Kruk.act(this, [\"name\"])"]));
        list.push(C(0, []));
        if (!$gameMap.isEventRunning()) $gameMap._interpreter.setup(list, 0);
        else nameScene();
        T.popup(item(D.ITEM.ring) ? item(D.ITEM.ring).name : "Obrączka z krukiem", { top: true, color: "#ffd23f", sub: TX.ringSub, icon: iconOf(D.ITEM.ring) });
        autoChecks();
    }
    // the hungry raven fed at the Urwisko: back to the hero
    function regain() {
        const s = S();
        s.stage = "tame"; s.food = 70; s.zeroSince = 0; s.clock = clock(); s.mode = "follow";
        if (pet) { pet.wild = false; flyTo(pet, shoulderPoint()); }
        pop(TX.backHome);
    }

    // ------------------------------------------------------------------
    // The name: the prologue's screen (Prologue.Scene_HeroName) with the raven's texts
    // ------------------------------------------------------------------
    let Scene_RavenName = null;
    function ravenScene() {
        if (Scene_RavenName) return Scene_RavenName;
        const P = window.Prologue, Base = P && P.Scene_HeroName;
        if (!Base) return null;
        Scene_RavenName = class extends Base {
            create() {
                super.create();
                // (the map behind, blurred, instead of the title picture)
                const bmp = SceneManager.backgroundBitmap();
                if (bmp && this._bg) { this._bg.bitmap = bmp; this._bg.scale.set(1, 1); }
                this._name = [];
            }
            done() {
                if (this._leaving) return;
                let n = this.text().trim().replace(/\s+/g, " ");
                if (!n) n = R.defaultName;
                n = n.charAt(0).toLocaleUpperCase("pl") + n.slice(1);
                S().name = n;
                this._leaving = true;
                SoundManager.playOk();
                SceneManager.pop();
                T.popup(fill(TX.named, V()), { top: true, color: "#9ff0a8", icon: D.RAVEN_ICON });
            }
            back() { this.done(); }
            button(id) {
                if (id === "random") { this._name = Array.from(pick(R.names)); this._upper = false; SoundManager.playCursor(); this._dirty = true; return; }
                super.button(id);
            }
            redraw() {
                super.redraw();
                // the raven's words over the hero's (the panel's top lines and the empty field's grey name)
                const b = this._panel.bitmap, ctx = b.context, PW = b.width;
                ctx.save();
                ctx.fillStyle = "rgba(20,21,24,1)";
                ctx.fillRect(16, 18, PW - 36, 82);
                ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.font = "600 34px " + ($gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "serif"); ctx.fillStyle = "#ece6da";
                ctx.fillText("Jak nazwiesz kruka?", PW / 2, 46);
                ctx.font = "17px " + ($gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "serif"); ctx.fillStyle = "#b8b0a2";
                ctx.fillText("Kruk siedzi ci na ramieniu i przechyla łeb. Czeka.", PW / 2, 84);
                if (!this.text()) {   // (the field's grey "Reid" -> "Kruk")
                    ctx.fillStyle = "rgba(30,32,36,1)"; ctx.fillRect(150, 124, PW - 304, 44);
                    ctx.font = "bold 36px " + ($gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "serif"); ctx.fillStyle = "#5e5a54";
                    ctx.fillText(R.defaultName, PW / 2, 147);
                }
                ctx.fillStyle = "rgba(20,21,24,1)"; ctx.fillRect(200, b.height - 50, PW - 400, 30);
                ctx.font = "14px " + ($gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "serif"); ctx.fillStyle = "#77736b";
                ctx.fillText("Puste pole = „" + R.defaultName + "”", PW / 2, b.height - 34);
                ctx.restore();
                b._baseTexture.update();
            }
        };
        return Scene_RavenName;
    }
    function nameScene() {
        const Sc = ravenScene();
        if (!Sc) { S().name = S().name || R.defaultName; T.popup(fill(TX.named, V()), { top: true, color: "#9ff0a8" }); return false; }
        SceneManager.push(Sc);
        return true;
    }

    // ------------------------------------------------------------------
    // The needs: food and water by the clock; the perch's tray and bowl; three hungry days and it goes back to the Urwisko
    // ------------------------------------------------------------------
    function trayStacks(b) {
        const out = [];
        for (const key of Object.keys((b && b.store) || {})) {
            const id = Number(key.slice(1));
            if (key[0] !== "i" || !(b.store[key] > 0) || (window.Spoilage && id === Spoilage.ROT)) continue;
            out.push({ id, n: b.store[key] });
        }
        return out;
    }
    function eatFromTray(b) {
        const s = trayStacks(b)[0];
        if (!s) return false;
        const key = "i" + s.id;
        b.store[key] -= 1;
        if (b.store[key] <= 0) delete b.store[key];
        const list = b.fresh && b.fresh[s.id];
        if (list && list.length) { list[0].n -= 1; if (list[0].n <= 0) list.shift(); if (!list.length) delete b.fresh[s.id]; }
        S().food = Math.min(100, S().food + R.trayFood);
        return true;
    }
    function tickNeeds() {
        const s = S();
        if (s.stage !== "tame") return;
        const now = clock();
        if (s.clock === null || s.clock === undefined || now < s.clock) { s.clock = now; return; }
        const h = now - s.clock;
        if (h <= 0) return;
        s.clock = now;
        s.food = Math.max(0, s.food - R.drain.food * h);
        s.water = Math.max(0, s.water - R.drain.water * h);
        const p = perch();
        if (p) {
            if (p.b.store && p.b.store.i122) { delete p.b.store.i122; if (p.b.fresh) delete p.b.fresh[122]; }   // (rot thrown out)
            for (let n = 0; n < 4 && s.food < 60 && trayStacks(p.b).length; n++) eatFromTray(p.b);
            while (s.water < 60 && (p.b.bowlWater || 0) >= 1) { p.b.bowlWater -= 1; s.water = Math.min(100, s.water + R.bowlWater); }
            // (the bowl dry: a rain pot or the bucket on the perch's map - one portion -, a puddle there)
            const Fm = F();
            if (s.water < 50 && Fm && Fm.bucketUnits && Fm.takeBucketWater) {
                const pot = ((Fm.farm().buildings || {})[p.map] || []).find(b => !b.site && (Fm.BUILDINGS[b.type] || {}).rain && Fm.bucketUnits(b) >= 1);
                if (pot) { Fm.takeBucketWater(pot, 1); s.water = Math.min(100, s.water + 50); }
            }
            if (s.water < 50 && p.map === $gameMap.mapId() && window.Puddles && Puddles.wetAt) {
                let wet = false;
                for (let y = 0; y < $gameMap.height() && !wet; y++) for (let x = 0; x < $gameMap.width() && !wet; x++) wet = !!Puddles.wetAt(x, y);
                if (wet) s.water = Math.min(100, s.water + 40);
            }
        }
        if (s.water < 60 && rainingAt(day(), hour())) s.water = Math.min(100, s.water + 30 * h);   // (rain water from the puddles and the leaves)
        if (s.food <= 0) {
            if (!s.zeroSince) s.zeroSince = day();
            if (day() - s.zeroSince >= R.hungryLeave) {
                s.stage = "gone"; s.zeroSince = 0; s.away = null;
                pop(TX.leftHungry, { color: "#ffb4a0" });
                if (pet) sendOff();
            }
        } else s.zeroSince = 0;
    }
    function feedTame() {
        const meat = meatInBag();
        if (!meat) { popNeed(iconOf(FOOD()[0]), TX.feedNoMeat); return; }
        $gameParty.loseItem(item(meat), 1);
        S().food = Math.min(100, S().food + 50);
        T.audio.se("Bite", { volume: 40, pitch: 130 });
        if (pet && (pet.state === "sit" || pet.state === "shoulder")) setAnim(pet, SH.peck[0], SH.peck[1], 5, null);
        pop(TX.fed, { vars: { co: item(meat).name.toLowerCase() } });
    }
    function pourWater(b) {
        const Fm = F(), max = (Fm && Fm.BUILDINGS.grzeda && Fm.BUILDINGS.grzeda.bowl) || R.bowlMax;
        if ((b.bowlWater || 0) >= max) { T.popup(TX.bowlFull, { icon: 391, color: "#9fd4ff" }); return false; }
        if (Fm.bagWater && Fm.bagWater() >= 1) Fm.setBagWater(Fm.bagWater() - 1);
        else if (window.Needs && Needs.skinCharges && Needs.skinCharges() >= 1) Needs.state().skin = Needs.skinCharges() - 1;
        else { T.popup.need(391, TX.bowlNone); return false; }
        b.bowlWater = (b.bowlWater || 0) + 1;
        T.audio.se("Water1", { volume: 70, pitch: 115 });
        T.popup(fill(TX.bowl, { n: b.bowlWater, max }), { icon: 391, color: "#9fd4ff" });
        return true;
    }

    // ------------------------------------------------------------------
    // Letters: once a day to a person on the island (never over the sea), back in 1-2 hours with an answer
    // ------------------------------------------------------------------
    function known(L) {
        if (L.key === "grandpa") return true;
        if (L.ready && !(W() && W().isReady && W().isReady(L.ready))) return false;
        const Tl = TL(), res = Tl && Tl.RESIDENTS ? Tl.RESIDENTS.find(r => r.key === L.key) : null;
        if (!res) return false;
        return !L.flag || flag(L.flag);
    }
    // quest steps a raven may carry: an active "bring" step marked kruk: true, all it needs in the bag
    function questLetters() {
        const q = TQ(), out = [];
        if (!q || !q.QUESTS) return out;
        for (const Q of q.QUESTS) {
            const r = rec(Q.id);
            if (!r || r.s !== "active") continue;
            const st = Q.steps[r.step];
            if (!st || !st.kruk || st.type !== "bring") continue;
            out.push({ id: Q.id, step: r.step, to: st.to, title: Q.title });
        }
        return out;
    }
    function sendLetter(L, quest) {
        const s = S();
        if (s.letterDay === day()) { pop(TX.letterToday); return; }
        s.letterDay = day();
        s.away = { kind: "letter", to: L ? L.key : quest.to, name: L ? L.name : quest.title, until: clock() + rand(R.letterHours[0], R.letterHours[1]), quest: quest || null };
        pop(TX.letterGone, { vars: { kto: L ? L.name : quest.title } });
        if (pet) { pet.letter = true; pet.high = false; if (pet.state === "shoulder") pet.z = 42; sendOff(); }
    }
    function letterMenu() {
        const s = S(), entries = [];
        const done = s.letterDay === day();
        for (const qL of questLetters()) entries.push({ name: "Zadanie: " + qL.title, icon: D.RAVEN_ICON, enabled: !done, help: done ? fill(TX.letterToday, V()) : "Kruk zaniesie to, co trzeba, za ciebie.", run: () => sendLetter(null, qL) });
        for (const L of D.LETTERS) {
            if (!known(L)) continue;
            entries.push({ name: L.name, icon: D.RAVEN_ICON, enabled: !done, right: s.sent[L.key] ? "×" + s.sent[L.key] : "",
                help: done ? fill(TX.letterToday, V()) : "Kruk zaniesie list i wróci z odpowiedzią za godzinę albo dwie.", run: () => sendLetter(L) });
        }
        entries.push({ name: D.MOTHER.name, icon: D.RAVEN_ICON, enabled: false, help: D.MOTHER.why });
        const sc = SceneManager._scene;
        if (sc && sc.openFarmMenu) sc.openFarmMenu("Zanieś list", entries, undefined, undefined, undefined, undefined, "Raz dziennie. Tylko po wyspie.");
    }
    function scoutMaps() {
        const s = S(), infos = window.$dataMapInfos || [];
        const names = s.names || {};
        return Object.keys(s.visited).map(Number).filter(id => infos[id] && infos[id].name).map(id => ({ id, name: names[id] || (infos[id].name || "").replace(/^\s*\d+\s*[-.:]?\s*/, "") }));
    }
    function scoutMenu() {
        const s = S(), done = s.scoutDay === day(), entries = scoutMaps().map(m => ({ name: m.name, icon: D.RAVEN_ICON, enabled: !done,
            help: done ? fill(TX.scoutToday, V()) : "Kruk obleci okolicę i wróci z raportem na dziś: zwierzyna, ludzie, ruda, krzaki z jagodami i grzyby. Zapisze się w dzienniku; o niebezpieczeństwie ostrzeże.",
            run: () => sendScout(m) }));
        if (!entries.length) entries.push({ name: "Nie znasz jeszcze takich miejsc", enabled: false, help: "" });
        const sc = SceneManager._scene;
        if (sc && sc.openFarmMenu) sc.openFarmMenu("Leć na zwiad", entries, undefined, undefined, undefined, undefined, "Raz dziennie. Miejsca, w których byłeś.");
    }
    function sendScout(m) {
        const s = S();
        if (s.scoutDay === day()) { pop(TX.scoutToday); return; }
        s.scoutDay = day();
        s.away = { kind: "scout", map: m.id, name: m.name, until: clock() + R.scoutHours };
        loadMap(m.id);
        pop(TX.scoutGone, { vars: { gdzie: m.name } });
        if (pet) sendOff();
    }
    // back: it flies in to the hero (outdoors), the answer in a bubble over it
    function checkAway() {
        const s = S(), a = s.away;
        if (!a || clock() < a.until) return;
        if ($gameMap.isEventRunning()) return;
        if (a.kind === "scout") {   // (the map's file: loaded when the raven set off - or now, after a load of the game)
            if (mapData[a.map] === undefined) { loadMap(a.map); return; }
            if (mapData[a.map] === null) return;
        }
        s.away = null;
        if (a.kind === "letter") {
            let text = null;
            if (a.quest) {
                const before = stepOf(a.quest.id);
                const q = TQ();
                if (q && q.act) q.act(null, [a.quest.id, "hand", a.quest.step, -1]);
                text = stepOf(a.quest.id) !== before ? fill(TX.letterQuest, V({ co: a.quest.title })) : fill(TX.letterQuestFail, V());
            } else {
                const L = D.LETTERS.find(x => x.key === a.to);
                text = L ? pick(L.replies) : fill(TX.letterBack, V());
                s.sent[a.to] = (s.sent[a.to] || 0) + 1;
                if (!s.opinion[a.to] && a.to !== "grandpa") {   // (the first letter to a resident: he likes it - Opinion +1, once)
                    s.opinion[a.to] = day();
                    const q = TQ();
                    if (q && q.addOpinion) q.addOpinion(1, "list przez kruka");
                }
            }
            arriveWith(text, true);
        } else if (a.kind === "scout") finishScout(a);
    }
    function arriveWith(text, letter, quiet) {
        const s = S();
        if (outdoors() && s.stage === "tame") {
            removePet();
            const sp = spotNearHero(true);
            spawnPet(sp, true);
            pet.letter = letter;
            pet.high = !!sp.high;
            pet.then = b => { b.letter = false; caw(b); T.call("SpeechBubbles", "say", b, text, 360); };
        }
        if (!quiet) T.popup(text, { color: "#f3e0a0", icon: D.RAVEN_ICON });
    }

    // ------------------------------------------------------------------
    // Trinkets on the perch in the morning; the foreign letters (read / give back / sell to Baltazar)
    // ------------------------------------------------------------------
    function rollTrinket() {
        const s = S();
        if (s.trinketDay === day() || hour() < 6 || s.stage !== "tame" || !perch()) return;
        s.trinketDay = day();
        if (s.trinket) return;   // (yesterday's still lies there)
        const T0 = D.TRINKET, r = Math.random();
        if (r < T0.chance.coins) s.trinket = { kind: "coins", n: T0.coins[0] + Math.floor(Math.random() * (T0.coins[1] - T0.coins[0] + 1)) };
        else if (r < T0.chance.coins + T0.chance.thing) { const t = pick(T0.things); s.trinket = { kind: "thing", id: t[0], n: t[1], text: t[2] }; }
        else if (r < T0.chance.coins + T0.chance.thing + T0.chance.letter) {
            const free = D.FOREIGN.filter(L => !s.held[L.id] && !s.gone[L.id] && ownerAround(L.owner));
            if (free.length) s.trinket = { kind: "letter", id: pick(free).id };
        }
    }
    const ownerAround = key => { const Tl = TL(); return !!(Tl && Tl.RESIDENTS && Tl.RESIDENTS.some(r => r.key === key)) && !T.call("TownLife", "gone", key); };
    function trinketLabel(t) {
        if (!t) return "";
        if (t.kind === "coins") return t.n + " G";
        if (t.kind === "thing") return (item(t.id) ? item(t.id).name : "?") + (t.n > 1 ? " ×" + t.n : "");
        const L = D.FOREIGN.find(x => x.id === t.id);
        return L ? L.name : "list";
    }
    function takeTrinket() {
        const s = S(), t = s.trinket;
        if (!t) return;
        s.trinket = null;
        if (t.kind === "coins") { $gameParty.gainGold(t.n); T.popup(fill(TX.trinketCoins, V({ n: t.n })), { icon: 314, kind: "gold" }); return; }
        if (t.kind === "thing") { if (item(t.id)) $gameParty.gainItem(item(t.id), t.n); T.popup(t.text, { icon: iconOf(t.id), color: "#f3e0a0" }); return; }
        const L = D.FOREIGN.find(x => x.id === t.id);
        if (!L) return;
        s.held[L.id] = { read: false };
        T.popup(fill(TX.trinketLetter, V({ co: L.name })), { icon: 189, color: "#ffe27a" });
        letterChoice(L);
    }
    function letterChoice(L) {
        const sc = SceneManager._scene;
        if (!sc || !sc.openFarmMenu) return;
        sc.openFarmMenu(fill(TX.letterAsk, { co: L.name }), [
            { name: TX.letterRead, icon: 189, help: "Czytasz cudzy list. Właściciel to pozna po pieczęci.", run: () => readForeign(L) },
            { name: TX.letterKeep, icon: 189, help: "Chowasz list. Oddasz go " + L.ownerName + (L.sell ? " albo sprzedasz Baltazarowi w kantorze." : "."), run: () => {} }
        ], undefined, undefined, undefined, undefined, "Właściciel: " + L.ownerName);
    }
    function readForeign(L) {
        const s = S(), h = s.held[L.id];
        if (!h) return;
        h.read = true;
        note(L.name, L.text);
        T.call("SpeechBubbles", "say", $gamePlayer, L.text, 420);
    }
    // a resident's talk (TownLife's hook, first): the letter goes back to its owner; Baltazar buys the others once a day
    function heldFor(key) { const s = S(); return D.FOREIGN.filter(L => s.held[L.id] && L.owner === key); }
    function talkHook(key, ev) {
        if (!has()) return null;
        const q = TQ();
        if (q && q.markers && (q.markers()[key] === "ready")) return null;   // (a quest's hand-in first)
        const spk = { id: ev.eventId(), name: (TL() && TL().RESIDENTS.find(r => r.key === key) || {}).name || key };
        const mine = heldFor(key);
        if (mine.length) {
            const L = mine[0], out = [], h = S().held[L.id];
            sayTo(out, { id: 0 }, "To chyba twoje. Kruk przyniósł.");
            for (const line of h.read ? L.backRead : L.back) sayTo(out, spk, line);
            out.push(C(355, ["Kruk.act(this, [\"back\", " + JSON.stringify(L.id) + "])"]));
            return out;
        }
        if (key === "kupiec" && S().baltAsked !== day()) {
            const sell = D.FOREIGN.filter(L => S().held[L.id] && L.sell > 0);
            if (!sell.length) return null;
            S().baltAsked = day();
            const out = [];
            sayTo(out, { id: 0 }, TX.letterSellAsk[0].replace(/^> /, ""));
            sayTo(out, spk, TX.letterSellAsk[1]);
            const labels = sell.map(L => fill(TX.letterSellOpt, { co: L.name, g: L.sell })).concat(["Nic. Zapomnij."]);
            const branches = sell.map(L => [C(355, ["Kruk.act(this, [\"sell\", " + JSON.stringify(L.id) + "])"])].concat(sayTo([], spk, TX.letterSold[0]))).concat([[]]);
            out.push(C(102, [labels, labels.length - 1, 0, 2, 0]));
            labels.forEach((l, i) => { out.push(C(402, [i, l])); for (const c of branches[i]) out.push(Object.assign({}, c, { indent: (c.indent || 0) + 1 })); out.push(C(0, [], 1)); });
            out.push(C(404, []));
            return out;
        }
        return null;
    }
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        let line = "";
        for (const w of String(text).split(/\s+/)) {
            if (!w) continue;
            if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
        }
        if (line) out.push(line);
        return out;
    }
    function sayTo(out, spk, text) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""]));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l])));
        }
        return out;
    }
    (function hookTalk() {
        const L = TL();
        if (L && L.addTalkHook) L.addTalkHook((key, ev) => { try { return talkHook(key, ev); } catch (e) { console.error("[Kruk]", e); return null; } }, true);
    })();

    // ------------------------------------------------------------------
    // "Pilnuj pola": live - it flies at a flock on the crops round the perch; away - Birds' raids on those crops are taken over here
    // ------------------------------------------------------------------
    const guarded = (p, x, y) => Math.max(Math.abs(p.b.x - x), Math.abs(p.b.y - y)) <= R.guardRadius;
    let chased = null;
    function guardLive(at) {
        const B = window.Birds, p = perch();
        if (!B || !p || !pet || pet.busy) return;
        const fl = (B.flocks || []).find(f => (f.mode === "raid" || f.mode === "ground") && !f.leaving && f.birds.some(b => b.z < 6 && guarded(p, Math.floor(b.x), Math.floor(b.y - 0.3))));
        if (!fl) return;
        const cx = fl.birds.reduce((t, b) => t + b.x, 0) / fl.birds.length, cy = fl.birds.reduce((t, b) => t + b.y, 0) / fl.birds.length;
        pet.busy = true;
        pet.high = false;
        caw(pet, true);
        if (chased !== fl) { chased = fl; pop(TX.chase); }
        setTimeout0(() => { if (pet) flyTo(pet, { x: cx, y: cy, z: 24 }, b => {
            B.scare(fl, at.x, at.y);
            caw(b, true);
            b.high = true;
            flyTo(b, Object.assign({ high: true }, at), b2 => { b2.busy = false; });
        }); }, 24);
    }
    // before Birds' own check (priority -5): the raids planned on this map while the hero was away - the crops round the perch are
    // kept, the rest eaten the way Birds.js would (Birds.eatPlant); the visit then counts as seen (its `upto` moved past it)
    const rainingAt = (d, h) => { const Sv = T.api("Survival"), plan = Sv && Sv.weatherPlan ? Sv.weatherPlan(d) : null; return !!plan && plan.type === "rain" && h >= plan.start - (plan.storm ? 1 : 0) && h < plan.end; };
    function guardAway() {
        const B = window.Birds, s = S(), p = perch();
        if (!B || !B.store || !B.visitsOf || s.stage !== "tame" || s.mode !== "guard" || s.away || !p || p.map !== $gameMap.mapId()) return;
        const mapId = $gameMap.mapId(), rec0 = B.store().maps[mapId];
        if (!rec0 || rec0.upto === undefined) return;
        const now = clock();
        if (rec0.upto >= now) return;
        let saved = 0, eaten = 0, upto = rec0.upto;
        for (let d = Math.floor(rec0.upto / 24); d <= Math.floor(now / 24) && d <= Math.floor(rec0.upto / 24) + 60; d++) {
            for (const v of B.visitsOf(mapId, d)) {
                const st = d * 24 + v.start, en = st + v.hours;
                if (st <= rec0.upto || st > now) continue;
                if (now < en) { rec0.upto = Math.max(rec0.upto, upto); return finishAway(saved, eaten); }   // (one going on now: Birds starts it live)
                upto = st;
                if (rainingAt(d, v.start)) continue;
                const crops = (B.openCrops(mapId) || []).filter(c => c.plot.day === undefined || c.plot.day <= d);
                saved += crops.filter(c => guarded(p, c.x, c.y)).length ? 1 : 0;
                for (const c of crops.filter(c => !guarded(p, c.x, c.y)).sort(() => Math.random() - 0.5).slice(0, v.size)) if (B.eatPlant(mapId, c.x, c.y)) eaten++;
            }
        }
        rec0.upto = Math.max(rec0.upto, upto);
        finishAway(saved, eaten);
    }
    function finishAway(saved, eaten) {
        if (saved) pop(TX.chaseAway);
        if (eaten) T.popup("Pod twoją nieobecność ptaki wyjadły " + eaten + (eaten === 1 ? " roślinę" : eaten < 5 ? " rośliny" : " roślin") + " (za daleko od grzędy)", { icon: iconOf(146), color: "#ffb4a0" });
    }

    // ------------------------------------------------------------------
    // The warning: wolves, boars, bears near the hero - a caw
    // ------------------------------------------------------------------
    let warnAt = -99999;
    function warnCheck() {
        const H = window.Hunting;
        if (!H || !H.animals || !pet || Graphics.frameCount - warnAt < R.warnGap) return;
        const px = $gamePlayer._realX, py = $gamePlayer._realY;
        const a = H.animals.find(an => an && !an._dead && ["wolf", "boar", "bear"].includes(an.kind && an.kind()) && Math.hypot(an._realX - px, an._realY - py) < R.warnRange);
        if (!a) return;
        warnAt = Graphics.frameCount;
        caw(pet, true);
        T.call("SpeechBubbles", "say", pet, "Kra! Kra!", 120);
        pop(TX.warn, { color: "#ffb4a0" });
        if (pet.state === "shoulder") { pet.high = false; flyTo(pet, spotNearHero(true)); }
    }

    // ------------------------------------------------------------------
    // The scouting (2026-10-17, the user's: a report instead of marks). Back from a map the raven tells at once what is there TODAY:
    // a notice at the top, a bubble over it, a note "Zwiad kruka: <map>" in the journal (one per map, the newest kept) and, for
    // wolves, a bear's tracks, boars and bandits, a red warning over the hero and a caw. The report is TRUE - what the hero finds
    // there this day - worked out with the game's own rules while that map is not loaded:
    //   - game: Hunting.mapTargets() asked about that map (its id and its file's note lent for one synchronous call, asMap) minus
    //     Hunting.killedToday: populate() fills a map up to exactly that in each species' hours (only the hours still to come today
    //     are told); a bear comes by chance only (Hunting.bearChance) - so "ślady niedźwiedzia", never a number
    //   - people: tonight's camp of Humans.js is decided NOW with its own rule (HumansData.CAMP, the note <Camp:x> / <Humans:off>,
    //     the calm days, the rest after a cleared camp; the size as Humans rolls it) and kept in S().plans; on that map at night the
    //     plan goes into Humans' state before Humans rolls its own (enforcePlan, priority -5: Humans.makeCamp of that size - or "no
    //     camp"); the day's ambush only as "możliwa zasadzka" (a chance, never certain); the Urwisko's diggers by their own rule
    //   - ore: the map file's ore veins not mined yet (their self switch A - rocks do not grow back)
    //   - berries, mushrooms: the tiles that can hold them are noted while the hero is on the map (S().cat: Farming.gatherKindOf +
    //     gatherSpot, once a season); for today Farming.bushState (that map's picks) and Farming.mushroomBirth with farm().stones
    //   A map never catalogued (visited before this) - its berries and mushrooms are not told at all, rather than guessed.
    const mapData = {};   // mapId -> the map file's JSON (its note, its events), loaded when the raven sets off
    function loadMap(id) {
        if (mapData[id]) return;
        mapData[id] = null;
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map" + String(id).padStart(3, "0") + ".json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => { try { mapData[id] = xhr.status < 400 ? JSON.parse(xhr.responseText) : false; } catch (e) { mapData[id] = false; } };
            xhr.onerror = () => { mapData[id] = false; };
            xhr.send();
        } catch (e) { mapData[id] = false; }
    }
    // a function of another plugin that reads "this map" ($gameMap.mapId(), $dataMap's note) asked about map `id`: one synchronous
    // call with the id and the file lent, everything put back after
    function asMap(id, data, fn) {
        const oldId = $gameMap._mapId, oldData = window.$dataMap;
        try { $gameMap._mapId = id; if (data) window.$dataMap = data; return fn(); }
        finally { $gameMap._mapId = oldId; window.$dataMap = oldData; }
    }
    const tagOf = (data, name) => T.tag(String((data && data.note) || ""), name);
    function plural(n, one, few, many) {
        if (n === 1) return one;
        const d = n % 10, dd = n % 100;
        return d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14) ? few : many;
    }
    const GAME = {
        rabbit: n => n + " " + plural(n, "zając", "zające", "zajęcy"),
        deer: n => (n === 1 ? "jeleń" : n + " " + plural(n, "jeleń", "jelenie", "jeleni")),
        boar: n => (n === 1 ? "dzik" : n + " " + plural(n, "dzik", "dziki", "dzików")),
        wolf: n => (n === 1 ? "wilk" : "wataha wilków (" + n + ")")
    };
    // when, of what is left of today, a species is about: "" now, "rano" / "po południu" / "wieczorem" / "nocą", null - not today
    function whenToday(windows, h) {
        let next = null;
        for (const [a, b] of windows) {
            if (h >= a && h < b) return "";
            if (a > h && (next === null || a < next)) next = a;
        }
        if (next === null) return null;
        return next >= 20 ? "nocą" : next >= 17 ? "wieczorem" : next >= 12 ? "po południu" : "rano";
    }
    // the night the report speaks of (its key: the day it starts on - as Humans.nightKey): tonight, or the one going on
    function nightKeyNow() {
        const HD = window.HumansData, to = HD && HD.CAMP ? HD.CAMP.to : 5;
        return hour() < to ? day() - 1 : day();
    }
    function campChanceFor(id, data) {
        const HD = window.HumansData;
        if (!HD || !HD.CAMP) return 0;
        const off = tagOf(data, "Humans");
        if (off && /^off$/i.test(off.raw)) return 0;
        const tag = tagOf(data, "Camp");
        if (tag) return /^off$/i.test(tag.raw) ? 0 : Math.max(0, Math.min(1, Number(tag.raw) || 0));
        return HD.CAMP.maps[id] || 0;
    }
    // tonight's camp on map `id` - decided once (the plan Humans then has to follow there)
    function planNight(id, data) {
        const Hm = T.api("Humans"), HD = window.HumansData;
        if (!Hm || !Hm.state || !HD || !HD.CAMP) return null;
        const C0 = HD.CAMP, key = nightKeyNow(), s = S(), plans = s.plans || (s.plans = {});
        const cur = Hm.state().camps[id];
        if (cur && cur.night === key) {   // (Humans has rolled this night already: that is what stands there)
            plans[id] = { night: key, camp: !cur.none && !cur.over, size: cur.members ? cur.members.filter(m => m.state === "alive").length : 0, fixed: true };
            return plans[id];
        }
        if (plans[id] && plans[id].night === key) return plans[id];
        // (Humans asks these at the night's first check: day() then is the key itself, or the next day after midnight)
        const p = campChanceFor(id, data), cleared = Hm.state().cleared[id], rested = cleared !== undefined && key - cleared < C0.rest;
        const camp = key > C0.calmDays && !rested && p > 0 && Math.random() < p;
        plans[id] = { night: key, camp, size: camp ? C0.size[0] + Math.floor(Math.random() * (C0.size[1] - C0.size[0] + 1)) : 0 };
        return plans[id];
    }
    // on that map at night: the plan goes in before Humans rolls its own (its camp check runs at priority 0, this at -5)
    function enforcePlan() {
        const Hm = T.api("Humans"), HD = window.HumansData, s = S();
        if (!Hm || !HD || !HD.CAMP || !s.plans) return;
        const id = $gameMap.mapId(), plan = s.plans[id];
        if (!plan || plan.fixed || id === MAP) return;
        const h = hour();
        if (!(h >= HD.CAMP.from || h < HD.CAMP.to)) return;
        const key = Hm.nightKey ? Hm.nightKey() : nightKeyNow();
        if (plan.night !== key) return;
        const st = Hm.state(), cur = st.camps[id];
        plan.fixed = true;
        if (cur && cur.night === key) return;
        if (!plan.camp) { st.camps[id] = { night: key, none: true }; return; }
        let c = null;
        for (const far of [HD.CAMP.far, 9, 5]) { c = Hm.makeCamp ? Hm.makeCamp({ size: plan.size, far }) : null; if (c) break; }
        st.camps[id] = c || { night: key, none: true };
    }
    function ambushChanceFor(id, data) {
        const HD = window.HumansData;
        if (!HD || !HD.AMBUSH) return 0;
        const off = tagOf(data, "Humans");
        if (off && /^off$/i.test(off.raw)) return 0;
        const tag = tagOf(data, "Ambush");
        return tag ? (/^off$/i.test(tag.raw) ? 0 : Number(tag.raw) || 0) : HD.AMBUSH.maps[id] || 0;
    }
    // the tiles a map can hold berry bushes and mushrooms on (noted while the hero is there; once a season - mushrooms not in winter)
    let catPending = false;
    function buildCatalog() {
        const Fm = F(), s = S(), id = $gameMap.mapId();
        if (!Fm || !Fm.gatherKindOf || !Fm.gatherSpot || !outdoors()) return true;
        const cats = s.cat || (s.cat = {}), season = T.time.season(), old = cats[id], W0 = $gameMap.width(), H0 = $gameMap.height();
        if (old && old.season === season && old.w === W0) return true;
        if (Fm.groundInfoAt && Fm.groundInfoAt(1, 1) === undefined) return false;   // (the ground pictures still loading)
        const winter = !((Fm.GATHER && Fm.GATHER.mushroom && Fm.GATHER.mushroom.seasons) || [0, 1, 2]).includes(season);
        const bush = [], mush = [];
        for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
            const k = Fm.gatherKindOf(x, y);
            if (k !== "bush" && k !== "mushroom") continue;
            const g = Fm.gatherSpot(x, y);
            if (g === undefined) return false;
            if (k === "bush" && g === "bush") bush.push(y * W0 + x);
            else if (k === "mushroom" && g === "mushroom") mush.push(y * W0 + x);
        }
        cats[id] = { season, w: W0, bush, mush: winter && old && old.w === W0 ? old.mush : mush, day: day() };
        return true;
    }
    // what is on map `id` today: { parts, warn, text, warnText, catalogued }
    function scoutReport(id) {
        const data = mapData[id] || null, s = S(), parts = [], warn = [], H = window.Hunting, HP = T.api("Hunting_parts"), h = hour();
        // the game (Hunting.js: populate fills up to these in the species' hours)
        if (H && H.mapTargets && H.SPECIES && !(HP && HP.core && HP.core.ENABLED === false)) {
            const targets = asMap(id, data, () => H.mapTargets()) || {}, killed = k => (H.killedToday ? H.killedToday(id, k) : 0);
            for (const kind of ["rabbit", "deer", "boar", "wolf"]) {
                const n = Math.max(0, (targets[kind] || 0) - killed(kind));
                const when = n && H.SPECIES[kind] ? whenToday(H.SPECIES[kind].hours, h) : null;
                if (!n || when === null) continue;
                const phrase = GAME[kind](n) + (when ? " " + when : "");
                parts.push(phrase);
                if (kind === "wolf" || kind === "boar") warn.push(phrase);
            }
            if (H.bearChance && H.SPECIES.bear && killed("bear") === 0 && whenToday(H.SPECIES.bear.hours, h) !== null) {
                let bear = false;
                for (let hh = Math.floor(h); hh < 24 && !bear; hh++) bear = asMap(id, data, () => H.bearChance(hh)) > 0;
                if (bear) { parts.push("ślady niedźwiedzia"); warn.push("ślady niedźwiedzia"); }
            }
        }
        // people: tonight's camp (decided now and kept), the Urwisko's diggers, the chance of an ambush on the road
        if (id === MAP) {
            if (campNightFor(nightKeyNow())) { parts.push("obcy kopacze nocą (3)"); warn.push("obcy kopacze nocą (3)"); }
        } else {
            const plan = planNight(id, data), HD = window.HumansData;
            if (plan && plan.camp && plan.size > 0) {
                const ph = "obóz bandytów nocą (" + plan.size + ")";
                parts.push(ph); warn.push(ph);
            }
            const amb = ambushChanceFor(id, data);
            if (amb > 0 && HD && HD.AMBUSH && day() > HD.AMBUSH.calmDays && h < HD.AMBUSH.hours[1]) { parts.push("możliwa zasadzka przy drodze"); warn.push("możliwa zasadzka przy drodze"); }
        }
        // ore: the veins of the map's file not mined yet
        if (data && data.events) {
            let ore = 0;
            for (const e of data.events) {
                const pg = e && e.pages && e.pages[0];
                if (!pg || !/^!\$Rock_Ore/.test(pg.image.characterName || "") || $gameSelfSwitches.value([id, e.id, "A"])) continue;
                ore++;
            }
            if (ore) parts.push(ore + " " + plural(ore, "żyła rudy", "żyły rudy", "żył rudy"));
        }
        // berries and mushrooms (the map's catalogue, today's state of each tile)
        const cat = (s.cat || {})[id], Fm = F();
        if (cat && Fm && Fm.farm) {
            const W0 = cat.w, plots = Fm.farm().plots[id] || {}, picks = (Fm.farm().stones || {})[id] || {};
            const built = new Set();
            if (Fm.geoOf && Fm.cellsOfGeo) for (const b of Fm.farm().buildings[id] || []) for (const c of Fm.cellsOfGeo(Fm.geoOf(b), b.x, b.y)) built.add(c.x + "," + c.y);
            const free = k => !plots[k] && !built.has(k);
            let berries = 0, mush = 0;
            for (const n of cat.bush || []) {
                const x = n % W0, y = Math.floor(n / W0), k = x + "," + y;
                if (free(k) && asMap(id, data, () => Fm.bushState(x, y)) === "full") berries++;
            }
            const seasons = (Fm.GATHER && Fm.GATHER.mushroom && Fm.GATHER.mushroom.seasons) || [0, 1, 2];
            if (seasons.includes(T.time.season())) for (const n of cat.mush || []) {
                const x = n % W0, y = Math.floor(n / W0), k = x + "," + y, born = Fm.mushroomBirth(x, y);
                if (born !== null && free(k) && (picks[k] === undefined || born > picks[k])) mush++;
            }
            if (berries) parts.push(berries + " " + plural(berries, "krzak jagód", "krzaki jagód", "krzaków jagód"));
            if (mush) parts.push(mush + " " + plural(mush, "grzyb", "grzyby", "grzybów"));
        }
        const text = parts.length ? parts.join(", ") : TX.scoutEmpty;
        return { parts, warn, text, warnText: warn.join(", "), catalogued: !!cat };
    }
    // the raven is back: the report at the top, in a bubble over it, in the journal; the danger in red, with a caw
    function finishScout(a) {
        const s = S(), r = scoutReport(a.map), name = a.name || "?";
        s.scout = { day: day(), map: a.map, name, text: r.text, warn: r.warnText, at: clock() };
        const title = fill(TX.scoutTitle, { gdzie: name });
        T.popup(title, { top: true, color: "#ffe27a", sub: r.text + (r.catalogued ? "" : " " + TX.scoutNoCat) });
        const mins = Math.floor((hour() % 1) * 60);
        const when = "Dzień " + day() + " (" + String(T.time.seasonName()).toLowerCase() + "), godz. " + Math.floor(hour()) + ":" + String(mins).padStart(2, "0");
        const J = T.api("Journal");
        if (J && J.data) { const notes = J.data().notes || []; for (let i = notes.length - 1; i >= 0; i--) if (notes[i] && notes[i].title === title) notes.splice(i, 1); }
        note(title, when + ". " + r.text + "." + (r.warn.length ? "\n" + fill(TX.scoutWarn, { gdzie: name, co: r.warnText }) : "") + (r.catalogued ? "" : "\n" + TX.scoutNoCat));
        if (r.warn.length) {
            T.popup(fill(TX.scoutWarn, { gdzie: name, co: r.warnText }), { color: "#ff7a6a", icon: D.RAVEN_ICON });
            T.audio.se("Crow", { volume: 60, pitch: 78 });
        }
        arriveWith(fill(TX.scoutBubble, { gdzie: name, co: r.text }), false, true);
        return r;
    }

    // the trinket on the perch's tray: its icon, small, with a glint now and then
    let trinketSpr = null;
    function drawTrinket() {
        const tm = tilemap(), s = S(), p = perch(), t0 = s.trinket;
        const show = !!(tm && t0 && p && p.map === $gameMap.mapId());
        if (!show) { if (trinketSpr && trinketSpr.parent) trinketSpr.parent.removeChild(trinketSpr); trinketSpr = null; return; }
        if (!trinketSpr || trinketSpr.parent !== tm) {
            trinketSpr = new Sprite(ImageManager.loadSystem("IconSet"));
            trinketSpr.anchor.set(0.5, 1);
            trinketSpr.scale.set(0.5, 0.5);
            trinketSpr.z = 3;
            tm.addChild(trinketSpr);
        }
        const icon = t0.kind === "coins" ? 314 : t0.kind === "letter" ? 189 : iconOf(t0.id);
        trinketSpr.setFrame((icon % 16) * 32, Math.floor(icon / 16) * 32, 32, 32);
        trinketSpr.x = Math.round(($gameMap.adjustX(p.b.x + 0.5) + 0.32) * TILE());
        trinketSpr.y = Math.round(($gameMap.adjustY(p.b.y) + 1) * $gameMap.tileHeight()) - 2;
        const k = Graphics.frameCount % 150;
        trinketSpr.setColorTone && trinketSpr.setBlendColor([255, 255, 220, k < 12 ? Math.round(160 * Math.sin(k / 12 * Math.PI)) : 0]);
    }

    // ------------------------------------------------------------------
    // The Urwisko at night after D25: the strangers dig in the rubble (a camp of Humans.js on fixed seats)
    // ------------------------------------------------------------------
    const CAMP_TAG = "kopaczeUrwisko";
    function campNightFor(key) {
        const HD = window.HumansData, s = S();
        if (!T.api("Humans") || !HD || !HD.CAMP || !(isDone("D25") || flag("dziennikOkretu"))) return false;
        return !(s.camp.cleared[key] || (s.camp.n || 0) >= 3 || key % 3 === 0);
    }
    function campNight() {
        const Hm = T.api("Humans"), HD = window.HumansData;
        if (!Hm || !Hm.state || !HD || !HD.CAMP) return null;
        const h = hour();
        if (!(h >= HD.CAMP.from || h < HD.CAMP.to)) return null;
        const key = Hm.nightKey ? Hm.nightKey() : (h >= HD.CAMP.from ? day() : day() - 1);
        return campNightFor(key) ? key : null;
    }
    function campCheck() {
        if ($gameMap.mapId() !== MAP || !built) return;
        const key = campNight(), Hm = T.api("Humans");
        if (key === null || !Hm) return;
        const st = Hm.state(), cur = st.camps[MAP];
        if (cur && cur.night === key && !cur.none) return;
        const m = marker("oboz") || { x: 47, y: 22 };
        const seats = [[-1, 0, "sit"], [1, 0, "sit"], [1, 2, "sleep"]];
        st.camps[MAP] = { id: 157000 + key, mapId: MAP, night: key, x: m.x, y: m.y, over: false, tag: CAMP_TAG,
            members: seats.map(([dx, dy, mode], i) => ({ kind: i === 1 ? "knifer" : "bandit", seat: { x: m.x + dx, y: m.y + dy }, mode, state: "alive", level: 0 })) };
        if (Hm.campCheck) Hm.campCheck();
    }
    // frightened (the hero knocked down beside it, a thunderbolt close by): it flies off to the Urwisko and comes back in the morning
    function frighten() {
        const s = S();
        if (s.stage !== "tame" || !pet || pet.kind !== "pet" || clock() < (s.fledUntil || 0)) return;
        s.fledUntil = (hour() < 6 ? day() : day() + 1) * 24 + 6;
        caw(pet, true);
        pop(TX.fled, { color: "#ffb4a0" });
        pet.busy = false;
        sendOff();
    }
    T.on("heroDown", () => { if (has()) frighten(); }, { owner: PLUGIN });
    T.on("lightning", p => { if (has() && p && p.strength >= 0.85 && outdoors()) frighten(); }, { owner: PLUGIN });
    T.on("humansDone", p => {
        if (!has() || !p || p.tag !== CAMP_TAG) return;
        const Hm = T.api("Humans"), key = Hm && Hm.nightKey ? Hm.nightKey() : day();
        const s = S();
        s.camp.cleared[key] = day();
        s.camp.n = (s.camp.n || 0) + 1;
        if (s.camp.n === 3) note("Urwisko spokojne", "Trzy noce z rzędu przepędziłem obcych kopaczy z Urwiska. Chyba dali sobie spokój z kamieniami z krukiem. Na razie.");
    }, { owner: PLUGIN });
    function campSeen() {
        const s = S(), Hm = T.api("Humans");
        if (s.camp.seen || $gameMap.mapId() !== MAP || !Hm || !Hm.band) return;
        const band = Hm.band(CAMP_TAG);
        if (!band || !band.members.some(h => !h._dead && Math.hypot(h._realX - $gamePlayer._realX, h._realY - $gamePlayer._realY) < 11)) return;
        s.camp.seen = day();
        note(TX.campNote[0], TX.campNote[1]);
        const h = band.members.find(m => !m._dead);
        if (h) T.call("SpeechBubbles", "say", h, pick(TX.campBark), 220);
    }

    // ------------------------------------------------------------------
    // The menus: the young raven (the ravenry), the tame one (K, or OK facing it), the perch's own lines (Farming's menu hook)
    // ------------------------------------------------------------------
    function openRavenMenu() {
        const s = S(), sc = SceneManager._scene, p = perch();
        if (!sc || !sc.openFarmMenu) return;
        if (s.stage !== "tame") { openYoungMenu(); return; }
        const meat = meatInBag(), held = D.FOREIGN.filter(L => s.held[L.id]);
        const entries = [
            { name: "Pogłaszcz", icon: D.RAVEN_ICON, help: "Kruk stroszy pióra.", run: () => { if (pet) caw(pet); pop(TX.pet); } },
            { name: "Leć ze mną", icon: D.RAVEN_ICON, enabled: s.mode !== "follow", help: "Kruk leci z tobą z mapy na mapę i siada na drzewach, na ziemi albo na twoim ramieniu. Przed domami czeka na zewnątrz.", run: () => setMode("follow") },
            { name: "Zostań na grzędzie", icon: D.RAVEN_ICON, enabled: !!p && s.mode !== "perch", help: p ? "Kruk wraca na grzędę i tam czeka." : fill(TX.noPerch, V()) + ".", run: () => setMode("perch") },
            { name: "Pilnuj pola", icon: D.RAVEN_ICON, enabled: !!p && s.mode !== "guard", help: p ? "Kruk siedzi na grzędzie i przegania wrony i wróble z zasiewów w promieniu " + R.guardRadius + " pól - także pod twoją nieobecność." : fill(TX.noPerch, V()) + ".", run: () => setMode("guard") },
            { name: "Nakarm", icon: meat ? iconOf(meat) : D.RAVEN_ICON, enabled: !!meat, right: meat ? item(meat).name : "", help: meat ? "Kruk zje kawałek mięsa albo rybę." : fill(TX.feedNoMeat, V()) + ".", run: feedTame },
            { name: "Zanieś list", icon: 189, enabled: s.letterDay !== day(), right: s.letterDay === day() ? "jutro" : "", help: "Raz dziennie: list do kogoś na wyspie. Kruk wróci z odpowiedzią.", run: letterMenu },
            { name: "Leć na zwiad", icon: D.RAVEN_ICON, enabled: s.scoutDay !== day(), right: s.scoutDay === day() ? "jutro" : "", help: "Raz dziennie: kruk obleci miejsce, w którym byłeś, i wróci z raportem na dziś (zapisze go w dzienniku, ostrzeże przed niebezpieczeństwem).", run: scoutMenu }
        ];
        for (const L of held) entries.push({ name: "Cudzy list: " + L.name, icon: 189, help: "Właściciel: " + L.ownerName + ". " + (s.held[L.id].read ? "Przeczytany." : "Nieprzeczytany."), run: () => letterChoice(L) });
        sc.openFarmMenu(fill(TX.menuTitle, V()), entries, undefined, undefined, undefined, undefined, statusNote());
    }
    function statusNote() {
        const s = S();
        const mode = { follow: "leci z tobą", perch: "na grzędzie", guard: "pilnuje pola" }[s.mode] || s.mode;
        return "Jedzenie " + Math.round(s.food) + " · Woda " + Math.round(s.water) + " · " + mode + (s.away ? " · w drodze" : "");
    }
    function setMode(mode) {
        const s = S(), p = perch();
        if ((mode === "perch" || mode === "guard") && !p) { popNeed(D.RAVEN_ICON, TX.noPerch); return; }
        s.mode = mode;
        pop(mode === "follow" ? TX.follow : mode === "perch" ? TX.stay : TX.guard);
        if (pet && mode !== "follow" && p.map !== $gameMap.mapId()) { pop(TX.perchFar); sendOff(); }
    }
    // K on the map: the raven's menu - or it is called (it comes flying, following again)
    const KEY = 75;
    if (!Input.keyMapper[KEY]) Input.keyMapper[KEY] = "raven";
    function callRaven() {
        const s = S();
        if (s.stage !== "tame") return false;
        if (s.away) { pop(TX.busy); return true; }
        if (pet && pet.kind === "pet") { openRavenMenu(); return true; }
        if (!outdoors()) { pop("{imie} czeka na zewnątrz"); return true; }
        s.mode = "follow";
        pop(TX.follow);
        thinkT = 0;
        return true;
    }
    // OK facing the raven (on the ground, a low perch, a tree near him): its menu
    function petAhead() {
        if (!pet || pet.state === "fly" || pet.state === "takeoff" || pet.state === "land") return false;
        const p = $gamePlayer, dir = p.direction();
        const fx = p._realX + 0.5 + (dir === 4 ? -1 : dir === 6 ? 1 : 0), fy = p._realY + 0.9 + (dir === 8 ? -1 : dir === 2 ? 1 : 0);
        return Math.hypot(pet.x - fx, pet.y - fy) < 0.85 && pet.state !== "shoulder";
    }
    const CALM_MENU = { only: ["onMap", "event", "farmMenu"] };
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && has() && petAhead() && (S().stage === "tame" || (pet.wild && wildPlace() && wildPlace().ravenry)) && T.isCalm(SceneManager._scene, CALM_MENU)) {
            openRavenMenu();
            return true;
        }
        return _triggerButtonAction.call(this);
    };
    T.onMapUpdate(scene => {
        if (!has() || !Input.isTriggered("raven") || !T.isCalm(scene, CALM_MENU)) return;
        if (!callRaven() && S().stage !== "tame") return;
    }, { owner: PLUGIN, name: "key" });
    // the perch's own lines (Farming's building menu): the trinket, the bowl, the raven
    if (window.Farming && Farming.addMenuHook) Farming.addMenuHook((b, def, entries) => {
        if (!b || b.type !== "grzeda" || b.site) return null;
        const s = S(), max = def.bowl || R.bowlMax, at = Math.max(0, entries.findIndex(e => e.name === def.openName) + 1);
        const haveWater = (F().bagWater && F().bagWater() >= 1) || (window.Needs && Needs.skinCharges && Needs.skinCharges() >= 1);
        const add = [];
        if (s.trinket) add.push({ name: "Weź, co przyniósł kruk", icon: s.trinket.kind === "coins" ? 314 : s.trinket.kind === "letter" ? 189 : iconOf(s.trinket.id), right: trinketLabel(s.trinket),
            help: "Rano na grzędzie coś leży. Kruki znoszą, co błyszczy - i co komuś wypadło.", run: takeTrinket });
        add.push({ name: "Nalej wody do miseczki", icon: 391, right: (b.bowlWater || 0) + "/" + max, enabled: (b.bowlWater || 0) < max && !!haveWater,
            help: (b.bowlWater || 0) >= max ? TX.bowlFull + "." : haveWater ? "Nalewasz porcję wody z wiadra (albo z bukłaka). Kruk napije się, kiedy zechce." : TX.bowlNone + ".", run: () => pourWater(b) });
        if (s.stage === "tame") add.push({ name: "Kruk: " + ravenName(), icon: D.RAVEN_ICON, help: "Menu kruka (albo klawisz K).", run: openRavenMenu });
        entries.splice(at, 0, ...add);
        return s.stage === "tame" ? statusNote() : "Grzęda czeka na kruka.";
    });

    // ------------------------------------------------------------------
    // The map's things: looks (the ravenry, the nests, the stones, the grate), the edges
    // ------------------------------------------------------------------
    function look(interp, what) {
        if (!has()) return;
        if (what === "kruczarnia") {
            if (pet && pet.wild && wildPlace() && wildPlace().ravenry) {
                if (!inHours(hour(), R.feedHours)) { T.popup(TX.ravenryNight, { color: "info" }); return; }
                if (S().stage !== "tame") { if (!S().feeds.length && S().stage === "wild") T.popup(TX.ravenryLook, { color: "info" }); openYoungMenu(); return; }
            }
            T.popup(S().stage === "tame" ? fill("Stare żerdzie zakonu. {imie} czasem tu zagląda - do swoich.", V()) : TX.ravenryEmpty, { color: "info" });
        } else if (what === "baszta") T.popup(TX.towerLook, { color: "info" });
        else if (what === "gniazdo") T.popup(TX.nestLook, { color: "info" });
        else if (/^kamien\d$/.test(what)) {
            const n = Number(what.slice(6));
            T.popup(TX.stoneLook[(n - 1) % TX.stoneLook.length], { color: "info" });
            const s = S();
            if (!s.stones[n]) { s.stones[n] = day(); if (Object.keys(s.stones).length === 1) note(TX.stoneNote[0], TX.stoneNote[1]); }
        } else if (what === "krata") {
            const wet = rainingAt(day(), hour()) || rainingAt(day() - 1, 20);
            T.popup(wet ? TX.grateWet : TX.grate, { color: "info" });
        }
    }
    let edgeAt = 0;
    function edge(interp, which) {
        if (Graphics.frameCount - edgeAt < 60) return;
        edgeAt = Graphics.frameCount;
        T.popup(which === "zbocze" ? TX.edgeSlope : TX.edgeEast, { color: "info" });
    }

    // the script calls from the talks: Kruk.act(this, [what, ...])
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a] = args, s = S();
        try {
            if (what === "name") nameScene();
            else if (what === "back") {
                const L = D.FOREIGN.find(x => x.id === a), h = s.held[a];
                if (!L || !h) return;
                delete s.held[a];
                s.gone[a] = "back";
                if (!h.read) {
                    const q = TQ();
                    if (q && q.addOpinion) q.addOpinion(1, "oddany list");
                    setFlag("krukUfa_" + L.owner);
                }
                if (L.backGold) { $gameParty.gainGold(L.backGold); T.popup("+" + L.backGold + " G", { icon: 314, kind: "gold" }); }
            } else if (what === "sell") {
                const L = D.FOREIGN.find(x => x.id === a);
                if (!L || !s.held[a]) return;
                delete s.held[a];
                s.gone[a] = "sold";
                $gameParty.gainGold(L.sell);
                T.popup("+" + L.sell + " G", { icon: 314, kind: "gold" });
                setFlag("krukBaltazarWie");
            }
        } catch (e) { console.error("[Kruk] act " + JSON.stringify(args), e); }
    }

    // ------------------------------------------------------------------
    // TownQuests' handlers: K51, D24
    // ------------------------------------------------------------------
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        Object.assign(q.FX, {
            k51Ready: { cond: () => !!(W() && W().isReady && W().isReady(MAP) && W().isReady(HERMITAGE)) && S().stage === "wild" },
            k51Mast: { check: () => S().k51.leg >= 1 || S().stage !== "wild" },
            k51Follow: {
                check: () => S().k51.leg >= 5 || S().stage !== "wild",
                vars: () => {
                    const leg = S().k51.leg;
                    return { gdzie: leg <= 1 ? "Kruk czeka przy górnej krawędzi przystani (ścieżka na klif)." : leg === 2 ? "Kruk przysiadł przy pustelni na klifie." : "Kruk poleciał na wschód, na Urwisko Kruków." };
                }
            },
            d24Start: () => isDone("K51") || S().feeds.length > 0 || S().stage === "tame",
            d24Feed: { check: () => S().stage === "tame" || S().feeds.length >= R.feedNeed, vars: () => ({ n: Math.min(R.feedNeed, S().feeds.length) }) },
            d24Ring: { blocked: () => count(D.ITEM.ring) < 1 },
            d24Perch: { check: () => perches().length > 0, vars: () => ({ imie: ravenName() }) }
        });
    }
    hookQuests();

    // ------------------------------------------------------------------
    // The place is built: the hermitage's east edge leads here (Wyspa.js) - only once data/Map157.json is the real map (package 0's
    // stub has the note <Wyspa:szkielet>); read once at the start, the way the engine reads its data files
    // ------------------------------------------------------------------
    (function checkBuilt() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map" + String(MAP).padStart(3, "0") + ".json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                try {
                    const n = xhr.status < 400 ? String(JSON.parse(xhr.responseText).note || "") : "<Wyspa:szkielet>";
                    if (!/<Wyspa:szkielet>/.test(n)) { built = true; const w = W(); if (w && w.ready) w.ready(MAP); }
                } catch (e) { /* (no map: not built) */ }
            };
            xhr.send();
        } catch (e) { /* (no XHR: not built) */ }
    })();

    // ------------------------------------------------------------------
    // The map's clock
    // ------------------------------------------------------------------
    let auto = true;
    function reset() {
        removePet();
        for (const b of flock) dropSprite(b);
        flock = [];
        oldPerches = [];
        trinketSpr = null;
        later.length = 0;
        thinkT = 0;
    }
    T.on("mapEnter", () => reset(), { owner: PLUGIN });
    T.on("load", () => reset(), { owner: PLUGIN });
    T.on("mapReady", () => {
        if (!has()) return;
        hookQuests();
        if (outdoors()) { const s0 = S(); s0.visited[$gameMap.mapId()] = day(); (s0.names = s0.names || {})[$gameMap.mapId()] = $gameMap.displayName() || ""; catPending = true; }
        // K51: the hero is ahead of the raven - it was faster (the next map's leg)
        const s = S();
        if (k51On() && s.k51.leg >= 1 && s.k51.leg < 5) {
            const L = legs(), first = L.findIndex(l => l.map === $gameMap.mapId());
            if (first > s.k51.leg) s.k51.leg = first;
        }
        campCheck();
    }, { owner: PLUGIN });
    T.onMapUpdate(() => { if (has() && auto) { try { guardAway(); } catch (e) { /* (Birds' own count goes on) */ } } }, { owner: PLUGIN, name: "guardAway", priority: -5 });
    // tonight's camp as the raven told it (before Humans' own camp check, which runs at priority 0)
    T.onMapUpdate(() => { if (has()) { try { enforcePlan(); } catch (e) { /* (Humans rolls its own) */ } } }, { owner: PLUGIN, name: "nightPlan", priority: -5 });
    let slow = 0, failed = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try { frame(); }
        catch (e) {   // (never take the map's clock down for the other systems: told once, the raven is reset)
            if (!failed++) console.warn("[Kruk] wyjątek w zegarze kruka: " + (e && e.message));
            reset();
        }
    }, { owner: PLUGIN, name: "raven" });
    function frame() {
        runLater();
        if (++slow % 60 === 0) { tickNeeds(); checkAway(); rollTrinket(); campSeen(); if (slow % 600 === 0) campCheck(); }
        if (auto && --thinkT <= 0) { thinkT = 15; think(); }
        if (pet) {
            updateBird(pet);
            if (pet && pet.gone) removePet();
            else if (pet) drawBird(pet);
        }
        syncFlock();
        updateFlock();
        drawOldPerches();
        drawTrinket();
        if (catPending && slow % 60 === 30) catPending = !buildCatalog();
    }

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, DATA: D, state: () => S(), look, edge, act: actCall, built: () => built,
        get pet() { return pet; }, get flock() { return flock; },
        auto: v => { auto = !!v; return auto; }, reset, think, tameNow, feedYoung, feedBlock, openRavenMenu, openYoungMenu, setMode, callRaven,
        sendLetter: key => { const L = D.LETTERS.find(x => x.key === key); if (L) sendLetter(L); return !!L; },
        sendScout: id => sendScout({ id, name: (S().names || {})[id] || ((window.$dataMapInfos || [])[id] || {}).name || "?" }), checkAway, rollTrinket, takeTrinket,
        // (for Birds.guarded, if the integration wants it: the crop at (x, y) of map mapId is under the raven's eye now)
        guards: (mapId, x, y) => { if (!has()) return false; const s = S(), p = perch(); return s.stage === "tame" && s.mode === "guard" && !s.away && !!p && p.map === Number(mapId) && guarded(p, x, y); },
        perches, perch, wildPlace, tamePlace, legs, mastPoint, spotNearHero, guardAway, guardLive, warnCheck, campNight, campNightFor, campCheck,
        // (the scouting: the report of a map now, its catalogue, tonight's plan, the map files read)
        scoutReport, finishScout, buildCatalog, planNight, enforcePlan, loadMap, mapLoaded: id => !!mapData[id], whenToday, plural,
        nameScene, ravenScene, frameOf, frighten, shoulderPoint, questLetters, known, talkHook, tickNeeds
    };
    window.Kruk = T.register(PLUGIN, api);
})();
