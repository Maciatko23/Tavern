/*:
 * @target MZ
 * @plugindesc Mewy na Słonym Brzegu: szybują łukami nad wodą i plażą, stoją i dziobią na mokrym piasku, kołyszą się na falach i krzyczą. Płoszą się przed graczem, można je trafić z procy (pióra). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Birds
 *
 * @help
 * MEWY (2026-11-21; mapa 219 Słony Brzeg i każda mapa z <Mewy> w notatce)
 *   - W powietrzu 1-3 mewy krążą leniwymi łukami nad wodą i brzegiem, rzadko
 *     machają skrzydłami; po ziemi i wodzie suną ich cienie.
 *   - Na brzegu stadko 2-5 mew stoi na piasku tuż przy wodzie: dziobie, chodzi,
 *     rozgląda się. Gdy podchodzisz - najpierw odchodzą, potem z krzykiem
 *     zrywają się i siadają dalej na brzegu albo odlatują.
 *   - Na wodzie przy brzegu kołysze się czasem 1-2 mewy.
 *   - Krzyczą co jakiś czas (ciszej z daleka); przy zrywaniu się - "śmiech".
 *   - Od świtu do zmierzchu (5-20), nie w burzy.
 *   Trafiona z procy albo z łuku daje 2-3 pióra.
 * Grafika img/system/Bird_Gull.png (10 klatek 40x32), dźwięki audio/se/Mewa_*.ogg.
 */
(() => {
    "use strict";
    const PLUGIN = "Mewy";
    const T = window.Tawerna;
    if (!T) throw new Error("Mewy.js: brak TawernaCore.js");

    // (2026-11-21, the user: "da się jakoś fajnie, ładnie i klimatycznie dodać mewy na słonym brzegu?" ... "ok rób")
    const MAPS = [219];                    // Słony Brzeg; any map with <Mewy> in its note too
    const SHEET = "Bird_Gull", CW = 40, CH = 32, LEGS = 16, FOOT = 30;   // the sheet: 40 x 32 cells, the legs at x 16, the feet on row 29
    // beat: 8 cells of one wingbeat (0 = wings up, 4 = down); glide: 4 cells (0 = flat, 1-3 the wings flexing) - 2026-11-21, the user:
    // "te mewy mogą bardziej szczegółowo, profesjonalnie i płynniej latać, bardziej naturalnie" (cells 2, 3, 7 - the first flight poses - unused)
    const F = { stand: 0, peck: 1, half: 4, deep: 5, slight: 6, walk1: 8, walk2: 9, beat: 10, glide: 18 };
    const SIGHT = 7.5, RADIUS = 0.38, FEATHERS = 146;
    const CALLS = ["Mewa_Krzyk1", "Mewa_Krzyk2"], LAUGH = "Mewa_Smiech";
    const GLIDE = { speed: 0.042, turn: 0.011, z: [65, 130], life: [3600, 7200] };   // tiles a frame, radians a frame, px up, frames
    const WALK = 0.018, FLEE = 0.032, FLY = 0.07;
    const rand = T.util.rand, pick = T.util.pick;
    const TILE = () => $gameMap.tileWidth();

    // ------------------------------------------------------------------
    // Where: the shore of the map (computed once a map)
    // ------------------------------------------------------------------
    let geo = null;
    function here() {
        if (!window.$gameMap || !window.$dataMap) return false;
        return MAPS.includes($gameMap.mapId()) || /<Mewy>/i.test($dataMap.note || "");
    }
    const isWater = (x, y) => $gameMap.isValid(x, y) && Tilemap.isWaterTile($gameMap.tileId(x, y, 0));
    function stinks(x, y) { return !!(window.CzerwonaWoda && CzerwonaWoda.nearShore && CzerwonaWoda.nearShore(x, y, 3)); }
    function freeLand(x, y) {
        if (!$gameMap.isValid(x, y) || isWater(x, y) || !$gameMap.isPassable(x, y, 2) || $gameMap.eventsXy(x, y).length) return false;
        return !(window.Farming && Farming.buildingAt && Farming.buildingAt(x, y));
    }
    function buildGeo() {
        if (geo && geo.data === $dataMap) return geo;
        const W = $gameMap.width(), H = $gameMap.height(), water = new Uint8Array(W * H), dist = new Float32Array(W * H).fill(99);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isWater(x, y)) water[y * W + x] = 1;
        // the coastline: cells where water and land meet; the distance of every cell from it (8-way steps)
        const q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const w = water[y * W + x];
            let edge = false;
            for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < W && ny < H && water[ny * W + nx] !== w) { edge = true; break; }
            }
            if (edge) { dist[y * W + x] = 0; q.push(y * W + x); }
        }
        for (let i = 0; i < q.length; i++) {
            const c = q[i], x = c % W, y = (c - x) / W;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                const n = ny * W + nx, d = dist[c] + (dx && dy ? 1.41 : 1);
                if (d < dist[n]) { dist[n] = d; q.push(n); }
            }
        }
        const shore = [], swim = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const c = y * W + x;
            if (!water[c] && dist[c] <= 1.5 && freeLand(x, y) && !stinks(x, y)) shore.push({ x, y });   // the wet sand by the water
            if (water[c] && dist[c] >= 1 && dist[c] <= 3.5) swim.push({ x, y });                       // the water close in
        }
        geo = { data: $dataMap, W, H, water, dist, shore, swim };
        return geo;
    }
    const coastDist = (x, y) => { const g = geo, cx = Math.floor(x), cy = Math.floor(y); return cx < 0 || cy < 0 || cx >= g.W || cy >= g.H ? 99 : g.dist[cy * g.W + cx]; };
    const waterAt = (x, y) => { const g = geo, cx = Math.floor(x), cy = Math.floor(y); return cx >= 0 && cy >= 0 && cx < g.W && cy < g.H && !!g.water[cy * g.W + cx]; };

    // the view in tiles
    function view() {
        const w = T.view.w() / TILE(), h = T.view.h() / TILE(), x = $gameMap.displayX(), y = $gameMap.displayY();
        return { x0: x, y0: y, x1: x + w, y1: y + h, w, h };
    }
    const onView = (x, y, m) => { const v = view(); return x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m; };
    const heroX = () => $gamePlayer._realX + 0.5, heroY = () => $gamePlayer._realY + 0.5;
    // a spot of a list on the screen, `away` tiles or more from the hero (and at most `far`)
    function spotOf(list, away, far) {
        const v = view(), hx = heroX(), hy = heroY(), ok = list.filter(p => p.x > v.x0 + 1 && p.x < v.x1 - 2 && p.y > v.y0 + 1 && p.y < v.y1 - 2 && Math.hypot(p.x + 0.5 - hx, p.y + 0.5 - hy) >= away && Math.hypot(p.x + 0.5 - hx, p.y + 0.5 - hy) <= far);
        return ok.length ? pick(ok) : null;
    }
    // a point just off the screen, on the side nearest to (x, y) or any
    function offPoint(x, y) {
        const v = view();
        const side = x === undefined ? pick(["l", "r", "t", "b"]) : [["l", x - v.x0], ["r", v.x1 - x], ["t", y - v.y0], ["b", v.y1 - y]].sort((a, b) => a[1] - b[1])[0][0];
        if (side === "l") return { x: v.x0 - 4, y: rand(v.y0, v.y1) };
        if (side === "r") return { x: v.x1 + 4, y: rand(v.y0, v.y1) };
        if (side === "t") return { x: rand(v.x0, v.x1), y: v.y0 - 4 };
        return { x: rand(v.x0, v.x1), y: v.y1 + 4 };
    }

    // ------------------------------------------------------------------
    // When: day light, not in a storm
    // ------------------------------------------------------------------
    function stormNow() {
        if ($gameScreen && $gameScreen.weatherType && $gameScreen.weatherType() === "storm") return true;
        const plan = window.Survival && Survival.weatherPlan ? Survival.weatherPlan(T.time.day()) : null, h = T.time.hour();
        return !!plan && !!plan.storm && h >= plan.start - 1 && h < plan.end;
    }
    const gullTime = () => { const h = T.time.hour(); return h >= 5 && h < 20 && !stormNow(); };

    // ------------------------------------------------------------------
    // The gulls
    // gull: { x, y (on the ground / the water under it, tiles), z (px up), mode: "glide" | "land" | "ground" | "float" | "lift" | "leave",
    //         h (heading, rad), wp (where it glides to), facing, t, act, actT, pk, flock, home, calls, _aware, sprite, shadow }
    // ------------------------------------------------------------------
    let gulls = [], flock = null, auto = true, timers = { glide: 0, flock: 0, swim: 0 };
    function newGull(x, y, z, mode) {
        const facing = Math.random() < 0.5 ? 1 : -1;
        // (flight: w the turn's own speed, vz the climb, spd the speed, sx the drawn facing - it turns round through its edge -, rot the
        // body's tilt, beat/beats the wingbeat and how many more, flex the glide's wing flex, zt/ztT the height it makes for and till when)
        return { x, y, z, mode, h: rand(0, Math.PI * 2), wp: null, facing, t: Math.floor(rand(0, 1000)), act: "idle", actT: 30,
            pk: null, flock: null, home: null, life: 0, nextCall: Math.round(rand(300, 1200)), _aware: 0, sprite: null, shadow: null, ph: rand(0, 6),
            w: 0, vz: 0, spd: GLIDE.speed, sx: facing, rot: 0, beat: 0, beats: 0, flex: null, flexT: 0, zt: z, ztT: Math.round(rand(200, 600)) };
    }
    const critters = () => { const W = T.api("Wydajnosc"); return W && W.gfx && typeof W.gfx.critters === "number" ? W.gfx.critters : 1; };
    const count = n => Math.max(1, Math.round(n * Math.min(1, critters())));

    // a gull gliding about the shore; `inView`: it starts over the screen (on arrival on the map), else off it
    function spawnGlider(inView) {
        const g = buildGeo(), v = view();
        let x, y;
        if (inView) {
            const band = g.shore.concat(g.swim).filter(p => p.x > v.x0 && p.x < v.x1 && p.y > v.y0 && p.y < v.y1);
            const p = band.length ? pick(band) : { x: rand(v.x0, v.x1), y: rand(v.y0, v.y1) };
            x = p.x + 0.5; y = p.y + 0.5;
        } else { const p = offPoint(); x = p.x; y = p.y; }
        const gl = newGull(x, y, rand(GLIDE.z[0], GLIDE.z[1]), "glide");
        gl.life = Math.round(rand(GLIDE.life[0], GLIDE.life[1]));
        gl.h = Math.atan2(v.y0 + v.h / 2 - y, v.x0 + v.w / 2 - x) + rand(-0.6, 0.6);
        gl.facing = gl.sx = Math.cos(gl.h) >= 0 ? 1 : -1;
        gulls.push(gl);
        return gl;
    }
    // a flock on the wet sand; `placed`: already standing there (on arrival on the map), else it flies in
    function spawnFlock(placed) {
        const g = buildGeo(), away = SIGHT * 0.6 + 1.2;
        const spot = spotOf(g.shore, away, 13) || (placed ? null : spotOf(g.shore, away, 30));
        if (!spot) return null;
        const n = count(2 + Math.floor(Math.random() * 4)), f = { gulls: [], spot, t: 0, stay: Math.round(rand(3600, 9000)), moves: 0 };
        const near = g.shore.filter(p => Math.hypot(p.x - spot.x, p.y - spot.y) <= 2.5);
        const from = offPoint();
        for (let i = 0; i < n; i++) {
            const p = pick(near.length ? near : [spot]), tx = p.x + rand(0.25, 0.75), ty = p.y + rand(0.45, 0.9);
            const gl = placed ? newGull(tx, ty, 0, "ground") : newGull(from.x + rand(-1, 1), from.y + rand(-1, 1), rand(60, 90), "land");
            gl.tx = tx; gl.ty = ty; gl.flock = f; gl.home = spot; gl.actT = Math.round(rand(20, 120)); gl.settle = placed ? 60 : 0;
            f.gulls.push(gl);
            gulls.push(gl);
        }
        flock = f;
        return f;
    }
    // a gull that settles on the water near the shore
    function spawnSwimmer() {
        const g = buildGeo(), spot = spotOf(g.swim, SIGHT * 0.5, 14);
        if (!spot) return null;
        const from = offPoint(), gl = newGull(from.x, from.y, rand(60, 90), "land");
        gl.tx = spot.x + 0.5; gl.ty = spot.y + 0.6; gl.swim = true; gl.home = spot;
        gulls.push(gl);
        return gl;
    }

    // ---- sounds: a cry now and then, quieter far off; the laugh when they take off
    function cry(gl, name, loud) {
        const d = Math.hypot(gl.x - heroX(), gl.y - heroY()), vol = Math.round((loud || 42) * Math.max(0, 1 - d / 18));
        if (vol < 6) return;
        const v = view(), pan = Math.max(-80, Math.min(80, ((gl.x - v.x0) / v.w - 0.5) * 150));
        AudioManager.playSe({ name: name || pick(CALLS), volume: vol, pitch: Math.round(rand(92, 108)), pan: Math.round(pan) });
    }

    // ---- flying
    const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    // the turn's own speed eases in and out (round, even arcs, no sudden swerve); maxTurn radians a frame at most
    function turnTo(gl, tx, ty, maxTurn) {
        const d = wrap(Math.atan2(ty - gl.y, tx - gl.x) - gl.h), want = Math.max(-maxTurn, Math.min(maxTurn, d * 0.02));
        gl.w += Math.max(-0.0006, Math.min(0.0006, want - gl.w));
        gl.h = wrap(gl.h + gl.w);
    }
    function faceBy(gl, dx) { if (Math.abs(dx) > 0.25) gl.facing = dx > 0 ? 1 : -1; }
    // a waypoint along the shore on (or near) the screen: they circle where you are
    function wayPoint() {
        const g = geo, v = view(), band = g.shore.concat(g.swim).filter(p => p.x > v.x0 - 4 && p.x < v.x1 + 4 && p.y > v.y0 - 4 && p.y < v.y1 + 4);
        const p = band.length ? pick(band) : { x: rand(v.x0, v.x1), y: rand(v.y0, v.y1) };
        return { x: p.x + 0.5 + rand(-1.5, 1.5), y: p.y + 0.5 + rand(-1.5, 1.5) };
    }
    // the wings: `beats` whole wingbeats (8 cells, `rate` cells a frame), then the glide; out of a run of beats the wings come to rest
    // through the flex's V, and in a long glide they flex now and then
    const FLEXES = [[1, 2, 3], [3, 1], [1], [2, 1]];
    function wings(gl, rate) {
        if (gl.beats > 0) {
            gl.beat += rate;
            if (gl.beat >= 8) { gl.beat -= 8; if (--gl.beats <= 0) { gl.beat = 0; gl.flex = [2, 1]; gl.flexT = 7; } }
            return;
        }
        if (gl.flex) { if (--gl.flexT <= 0) { gl.flex.shift(); gl.flexT = 9; if (!gl.flex.length) gl.flex = null; } }
        else if (Math.random() < 0.006) { gl.flex = pick(FLEXES).slice(); gl.flexT = 9; }
    }
    const wingFrame = gl => (gl.beats > 0 ? F.beat + (Math.floor(gl.beat) % 8) : F.glide + (gl.flex ? gl.flex[0] : 0));
    function updateGlide(gl) {
        gl.life--;
        if (gl.mode === "glide" && (gl.life <= 0 || !gullTime() || !auto)) { gl.mode = "leave"; gl.wp = offPoint(gl.x, gl.y); gl.zt = GLIDE.z[1] + 20; gl.ztT = 99999; }
        if (!gl.wp || (gl.mode === "glide" && (Math.hypot(gl.wp.x - gl.x, gl.wp.y - gl.y) < 1.5 || (gl.t % 900) === 0))) gl.wp = gl.mode === "leave" ? offPoint(gl.x, gl.y) : wayPoint();
        // the height: a new one now and then - up with wing beats, slower; down in a glide, faster
        if (--gl.ztT <= 0) { gl.zt = rand(GLIDE.z[0], GLIDE.z[1]); gl.ztT = Math.round(rand(360, 1000)); }
        const dz = gl.zt - gl.z;
        gl.vz += (Math.max(-0.4, Math.min(0.5, dz * 0.012)) - gl.vz) * 0.03;
        gl.z += gl.vz;
        if (gl.beats <= 0 && Math.random() < (dz > 12 ? 0.03 : gl.mode === "leave" ? 0.008 : 0.0025)) gl.beats = 2 + Math.floor(Math.random() * 4);
        turnTo(gl, gl.wp.x, gl.wp.y, GLIDE.turn);
        const want = GLIDE.speed * (gl.mode === "leave" ? 1.35 : 1) * (1 - gl.vz * 0.5);
        gl.spd += (want - gl.spd) * 0.02;
        gl.x += Math.cos(gl.h) * gl.spd;
        gl.y += Math.sin(gl.h) * gl.spd;
        faceBy(gl, Math.cos(gl.h));
        wings(gl, 1 / 3);
        if (gl.mode === "leave" && !onView(gl.x, gl.y, 3)) gl.gone = true;
        if (gl.mode === "glide" && --gl.nextCall <= 0) { gl.nextCall = Math.round(rand(600, 1500)); if (onView(gl.x, gl.y, 0)) cry(gl); }
    }
    // flying in to land (on the sand or on the water): from far it comes round in an arc, near it makes straight for the spot, slowing,
    // gliding down - and the last bit it brakes with quick wing beats
    function updateLand(gl) {
        const dx = gl.tx - gl.x, dy = gl.ty - gl.y, d = Math.hypot(dx, dy), spd = FLY * Math.max(0.3, Math.min(1, d / 3)), z0 = gl.z;
        if (d <= spd + 0.01) {
            gl.x = gl.tx; gl.y = gl.ty; gl.z = 0; gl.vz = 0; gl.zIn = undefined;
            gl.beats = 0; gl.flex = null;
            gl.mode = gl.swim ? "float" : "ground";
            gl.act = "idle"; gl.actT = Math.round(rand(20, 80)); gl.settle = 40;
            return;
        }
        if (d > 3) { turnTo(gl, gl.tx, gl.ty, 0.03); gl.x += Math.cos(gl.h) * spd; gl.y += Math.sin(gl.h) * spd; }
        else {
            gl.h = wrap(gl.h + Math.max(-0.08, Math.min(0.08, wrap(Math.atan2(dy, dx) - gl.h))));
            gl.x += dx / d * spd; gl.y += dy / d * spd;
        }
        if (d < 4) {
            if (gl.zIn === undefined) gl.zIn = gl.z;
            gl.z += (Math.max(0, (d - 0.15) / 3.85) * gl.zIn - gl.z) * 0.12;
        }
        gl.vz = gl.z - z0;
        gl.spd = spd;
        faceBy(gl, Math.cos(gl.h));
        if (d < 2.2 && gl.beats <= 0) gl.beats = 3;
        else if (d >= 2.2 && gl.beats <= 0 && Math.random() < 0.004) gl.beats = 2;
        wings(gl, d < 2.2 ? 0.5 : 1 / 3);
    }
    // off the ground / the water: quick beats, up fast at first and easing off, slow off the ground and faster as it climbs; then on to
    // land elsewhere (tx, ty) or away in a glide
    function updateLift(gl) {
        const top = gl.lift || 70, z0 = gl.z, spd = FLY * Math.min(1, 0.4 + gl.z / top);
        gl.z = Math.min(top, gl.z + Math.max(0.4, (top - gl.z) * 0.035));
        gl.vz = gl.z - z0;
        gl.spd = spd;
        gl.beats = Math.max(gl.beats, 1);
        wings(gl, gl.z < top * 0.6 ? 0.5 : 0.36);
        if (gl.relocating) {
            const d = Math.hypot(gl.tx - gl.x, gl.ty - gl.y);
            if (d < 4 && gl.z > 20) { gl.mode = "land"; gl.zIn = undefined; return; }
            turnTo(gl, gl.tx, gl.ty, 0.04);
        } else if (gl.z >= top - 0.5) {
            gl.mode = "leave"; gl.zt = top + 30; gl.ztT = 99999; gl.wp = offPoint(gl.x, gl.y); gl.beats = 2;
        }
        gl.x += Math.cos(gl.h) * spd;
        gl.y += Math.sin(gl.h) * spd;
        faceBy(gl, Math.cos(gl.h));
    }
    function takeOff(gl, away, relocateTo) {
        gl.mode = "lift";
        gl._aware = 0;
        gl.pk = null;
        gl.lift = rand(55, 85);
        gl.z = Math.max(gl.z, 2);
        gl.w = 0; gl.beats = 3; gl.beat = 0; gl.flex = null;
        if (relocateTo) { gl.relocating = true; gl.swim = false; gl.tx = relocateTo.x + rand(0.25, 0.75); gl.ty = relocateTo.y + rand(0.45, 0.9); gl.h = Math.atan2(gl.ty - gl.y, gl.tx - gl.x) + rand(-0.4, 0.4); }
        else { gl.relocating = false; gl.h = away !== undefined ? away + rand(-0.5, 0.5) : rand(0, Math.PI * 2); }
    }
    // the hero came too close (or a shot): the flock takes off with a laugh - six times in ten to land further along the shore
    // (at most 3 times), else away
    function flush(f, fromX, fromY) {
        if (!f || f.leaving) return;
        const live = f.gulls.filter(g => g.mode === "ground");
        if (!live.length) return;
        cry(live[0], LAUGH, 55);
        const cx = live.reduce((s, g) => s + g.x, 0) / live.length, cy = live.reduce((s, g) => s + g.y, 0) / live.length;
        const away = Math.atan2(cy - fromY, cx - fromX);
        let spot = null;
        if (f.moves < 3 && Math.random() < 0.6) {
            const keep = SIGHT * 0.6 + 1.5, cand = geo.shore.filter(p => {
                const d = Math.hypot(p.x - cx, p.y - cy), dh = Math.hypot(p.x + 0.5 - fromX, p.y + 0.5 - fromY);
                return d >= 5 && d <= 10 && dh >= keep && Math.cos(Math.atan2(p.y - cy, p.x - cx) - away) > 0.2;
            });
            if (cand.length) spot = pick(cand);
        }
        if (spot) {
            f.moves++; f.spot = spot;
            const near = geo.shore.filter(p => Math.hypot(p.x - spot.x, p.y - spot.y) <= 2.5);
            for (const g of live) { g.home = spot; takeOff(g, away, pick(near.length ? near : [spot])); }
        } else {
            f.leaving = true;
            for (const g of live) takeOff(g, away);
        }
        AudioManager.playSe({ name: "Wind7", volume: 40, pitch: 140, pan: 0 });   // the wings
    }

    // ---- on the sand: watch the hero, peck, walk a little, look about; uneasy: walk off; afraid: fly
    const PECK = { step: 7, reach: 10, tap: 26, jab: 9 };
    const newPeck = () => ({ t: 0, taps: 1 + Math.floor(Math.random() * 3), rest: Math.round(rand(30, 90)) });
    const peckLength = p => PECK.step * 4 + PECK.reach + p.taps * PECK.tap + p.rest;
    function peckFrame(p) {
        let t = p.t;
        if (t < PECK.step) return F.slight;
        if (t < PECK.step * 2) return F.half;
        t -= PECK.step * 2;
        if (t < PECK.reach) return F.peck;
        t -= PECK.reach;
        if (t < p.taps * PECK.tap) return t % PECK.tap < PECK.jab ? F.deep : F.peck;
        t -= p.taps * PECK.tap;
        if (t < PECK.step) return F.half;
        if (t < PECK.step * 2) return F.slight;
        return F.stand;
    }
    // can a gull walk straight from (x0, y0) to (x1, y1): every step on land it can stand on (2026-11-25, the user: "mewy przy brzegu się
    // zacinają i nie mogą ruszyć" - a walk across a bay of water, or a flight from the hero straight into the sea, stopped at once and
    // began again the next frame)
    function pathClear(x0, y0, x1, y1) {
        const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.25));
        for (let i = 1; i <= n; i++) {
            const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n - 0.3;
            if (waterAt(x, y) || !$gameMap.isPassable(Math.floor(x), Math.floor(y), 2)) return false;
        }
        return true;
    }
    // the best way to walk off from the hero: of eight ways, the clear one that ends farthest from him; null: none - it flies
    function fleeTarget(gl) {
        const hx = heroX(), hy = heroY();
        let best = null, bd = Math.hypot(gl.x - hx, gl.y - hy) + 0.4;
        for (let k = 0; k < 8; k++) {
            const a = k * Math.PI / 4, tx = gl.x + Math.cos(a) * 1.6, ty = gl.y + Math.sin(a) * 1.6, d = Math.hypot(tx - hx, ty - hy);
            if (d > bd && pathClear(gl.x, gl.y, tx, ty)) { bd = d; best = { x: tx, y: ty }; }
        }
        return best;
    }
    function walkTo(gl, tx, ty, speed) {
        const dx = tx - gl.x, dy = ty - gl.y, d = Math.hypot(dx, dy);
        if (d <= speed) { gl.x = tx; gl.y = ty; return true; }
        const nx = gl.x + dx / d * speed, ny = gl.y + dy / d * speed;
        if (waterAt(nx, ny - 0.3) || !$gameMap.isPassable(Math.floor(nx), Math.floor(ny - 0.3), 2)) return true;   // (not into the sea, not into a rock)
        gl.x = nx; gl.y = ny;
        faceBy(gl, dx);
        return false;
    }
    function updateGround(gl) {
        if (gl.settle > 0) gl.settle--;
        const aware = gl.settle > 0 ? 0 : window.Hunting && Hunting.updateAwareness ? Hunting.updateAwareness(gl, gl.x, gl.y - 0.25, SIGHT) : 0;
        const close = Math.hypot(heroX() - gl.x, heroY() - gl.y) < 2.2;
        if (aware >= 1 || close) { flush(gl.flock, heroX(), heroY()); return; }
        if (aware >= 0.3) {   // uneasy: it walks off along the sand, away from him
            if (gl.act !== "flee" && gl.act !== "look") {
                const to = fleeTarget(gl);
                if (!to) { flush(gl.flock, heroX(), heroY()); return; }   // (nowhere to walk off to: up it goes)
                gl.act = "flee"; gl.tx = to.x; gl.ty = to.y; gl.pk = null;
            }
            if (gl.act === "flee" && walkTo(gl, gl.tx, gl.ty, FLEE)) { gl.act = "look"; gl.actT = 40; }
            else if (gl.act === "look") { gl.facing = heroX() > gl.x ? 1 : -1; if (--gl.actT <= 0) gl.act = "idle"; }   // (it watches him a moment, then walks off again if he is still near)
            return;
        }
        if (--gl.nextCall <= 0) { gl.nextCall = Math.round(rand(900, 2400)); if (onView(gl.x, gl.y, 0)) cry(gl); }
        if (gl.act === "flee" || gl.act === "look") { gl.facing = heroX() > gl.x ? 1 : -1; if (--gl.actT > 0) return; gl.act = "idle"; gl.actT = 20; }
        if (gl.act === "peck") {
            if (!gl.pk) gl.pk = newPeck();
            if (++gl.pk.t < peckLength(gl.pk)) return;
            gl.pk = null;
            if (--gl.actT > 0) return;
        } else if (gl.act === "walk") {
            if (!walkTo(gl, gl.tx, gl.ty, WALK) && --gl.actT > 0) return;
        } else if (--gl.actT > 0) return;
        const r = Math.random();
        if (r < 0.45) { gl.act = "peck"; gl.actT = 1 + Math.floor(Math.random() * 3); gl.pk = null; }
        else if (r < 0.75) {   // a few steps along the wet sand, near its spot
            const near = geo.shore.filter(p => Math.hypot(p.x + 0.5 - gl.x, p.y + 0.7 - gl.y) <= 2 && (!gl.home || Math.hypot(p.x - gl.home.x, p.y - gl.home.y) <= 3));
            const p = near.length ? pick(near) : null, tx = p ? p.x + rand(0.2, 0.8) : 0, ty = p ? p.y + rand(0.45, 0.9) : 0;
            if (p && pathClear(gl.x, gl.y, tx, ty)) { gl.act = "walk"; gl.tx = tx; gl.ty = ty; gl.actT = 240; }   // (only where a straight walk leads, not across water)
            else { gl.act = "idle"; gl.actT = 60; }
        } else { gl.act = "idle"; gl.actT = Math.round(rand(40, 140)); if (Math.random() < 0.5) gl.facing = -gl.facing; }
    }
    // ---- on the water: it rocks on the waves, drifts a little, turns now and then; too close: it goes
    function updateFloat(gl) {
        if (gl.settle > 0) gl.settle--;
        const aware = gl.settle > 0 ? 0 : window.Hunting && Hunting.updateAwareness ? Hunting.updateAwareness(gl, gl.x, gl.y - 0.25, SIGHT * 0.6) : 0;
        if (aware >= 1 || Math.hypot(heroX() - gl.x, heroY() - gl.y) < 1.8) { cry(gl, LAUGH, 45); takeOff(gl, Math.atan2(gl.y - heroY(), gl.x - heroX())); return; }
        if (--gl.actT <= 0) {
            gl.actT = Math.round(rand(120, 360));
            if (Math.random() < 0.4) gl.facing = -gl.facing;
            const a = rand(0, Math.PI * 2);
            gl.dx = Math.cos(a) * 0.003; gl.dy = Math.sin(a) * 0.002;
        }
        const nx = gl.x + (gl.dx || 0), ny = gl.y + (gl.dy || 0);
        if (waterAt(nx, ny - 0.3) && coastDist(nx, ny) <= 4) { gl.x = nx; gl.y = ny; }
        if ((!gullTime() || !auto) && Math.random() < 0.01) takeOff(gl);   // (dusk, a storm: they go, one by one)
        if (--gl.nextCall <= 0) { gl.nextCall = Math.round(rand(1500, 3600)); if (onView(gl.x, gl.y, 0)) cry(gl); }
    }

    function updateGull(gl) {
        gl.t++;
        if (gl.mode === "glide" || gl.mode === "leave") updateGlide(gl);
        else if (gl.mode === "land") updateLand(gl);
        else if (gl.mode === "lift") updateLift(gl);
        else if (gl.mode === "ground") updateGround(gl);
        else if (gl.mode === "float") updateFloat(gl);
    }
    function updateFlock() {
        if (!flock) return;
        flock.t++;
        flock.gulls = flock.gulls.filter(g => !g.gone);
        const down = flock.gulls.filter(g => g.mode === "ground" || g.mode === "land" || (g.mode === "lift" && g.relocating));
        if (!down.length) { flock = null; return; }
        if (!flock.leaving && (flock.t > flock.stay || !gullTime() || !auto)) { flock.leaving = true; const a = rand(0, Math.PI * 2); for (const g of down) if (g.mode === "ground") takeOff(g, a); }
        if (flock.fright && --flock.fright.t <= 0) { flush(flock, flock.fright.x, flock.fright.y); flock.fright = null; }
    }

    // ---- shots (Hunting.js): the gulls on the sand and on the water are targets; a shot near them frightens the flock
    function killGull(gl) {
        gulls = gulls.filter(g => g !== gl);
        dropSprite(gl);
        featherBurst(gl);
        AudioManager.playSe({ name: "Damage1", volume: 70, pitch: 140, pan: 0 });
        const perk = window.Combat && Combat.perk ? Combat.perk("feathers") : 0;
        const n = 2 + Math.floor(Math.random() * 2) + Math.round(perk || 0);
        if ($dataItems[FEATHERS]) $gameParty.gainItem($dataItems[FEATHERS], n);
        if (gl.flock) flush(gl.flock, heroX(), heroY());
        for (const g of gulls) if (g.mode === "float" && Math.hypot(g.x - gl.x, g.y - gl.y) < 6) takeOff(g, Math.atan2(g.y - heroY(), g.x - heroX()));
        return n;
    }
    if (window.Hunting && Hunting.addTargets) {
        Hunting.addTargets(() => gulls.filter(g => (g.mode === "ground" || g.mode === "float") && !g.gone).map(g => ({ x: g.x, y: g.y - 0.3, radius: RADIUS, ref: g, hit: () => killGull(g) })));
        Hunting.onNoise((x, y, r) => {
            if (flock && !flock.fright && flock.gulls.some(g => g.mode === "ground" && Math.hypot(g.x - x, g.y - y) <= r + 3)) flock.fright = { t: 18, x, y };
            for (const g of gulls) if (g.mode === "float" && Math.hypot(g.x - x, g.y - y) <= r + 3) takeOff(g, Math.atan2(g.y - y, g.x - x));
        });
    }

    // ------------------------------------------------------------------
    // Drawing: a sprite a gull in the tilemap (on the sand and the water among the characters, in the air over all) and its shadow
    // ------------------------------------------------------------------
    let shadowBmp = null, rippleBmp = null;
    function shadowBitmap() {
        if (shadowBmp) return shadowBmp;
        shadowBmp = new Bitmap(22, 8);
        const c = shadowBmp.context;
        c.fillStyle = "rgba(0,0,0,0.32)";
        c.beginPath(); c.ellipse(11, 4, 10, 3, 0, 0, Math.PI * 2); c.fill();
        shadowBmp._baseTexture.update();
        return shadowBmp;
    }
    function rippleBitmap() {   // the ring of water round a gull on the waves
        if (rippleBmp) return rippleBmp;
        rippleBmp = new Bitmap(30, 8);
        const c = rippleBmp.context;
        c.strokeStyle = "rgba(235,245,255,0.55)";
        c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(15, 4, 13, 2.6, 0, 0, Math.PI * 2); c.stroke();
        rippleBmp._baseTexture.update();
        return rippleBmp;
    }
    function tilemap() {
        const s = SceneManager._scene;
        return s instanceof Scene_Map && s._spriteset ? s._spriteset._tilemap : null;
    }
    function ensureSprite(gl) {
        const tm = tilemap();
        if (!tm || (gl.sprite && gl.sprite.parent === tm)) return;
        gl.sprite = new Sprite(ImageManager.loadSystem(SHEET));
        gl.shadow = new Sprite(shadowBitmap());
        gl.shadow.anchor.set(0.5, 0.5);
        gl.shadow.z = 1;
        gl.ripple = new Sprite(rippleBitmap());
        gl.ripple.anchor.set(0.5, 0.5);
        gl.ripple.z = 1;
        tm.addChild(gl.shadow);
        tm.addChild(gl.ripple);
        tm.addChild(gl.sprite);
        gl._markSprite = null;
    }
    function dropSprite(gl) {
        for (const s of [gl.sprite, gl.shadow, gl.ripple]) if (s && s.parent) s.parent.removeChild(s);
        gl.sprite = gl.shadow = gl.ripple = null;
    }
    function drawGull(gl) {
        if (!onView(gl.x, gl.y - gl.z / TILE(), 4)) { if (gl.sprite) gl.sprite.visible = gl.shadow.visible = gl.ripple.visible = false; return; }
        ensureSprite(gl);
        const s = gl.sprite;
        if (!s) return;
        s.visible = true;
        const tw = TILE(), th = $gameMap.tileHeight(), gx = Math.round($gameMap.adjustX(gl.x) * tw), gy = Math.round($gameMap.adjustY(gl.y) * th);
        const air = gl.z > 1;
        let frame = F.stand, cropH = CH;
        if (air) frame = wingFrame(gl);
        else if (gl.mode === "float") { frame = F.stand; cropH = CH - 9; }   // (on the water: the legs under it)
        else if (gl.act === "peck" && gl.pk) frame = peckFrame(gl.pk);
        else if ((gl.act === "walk" || gl.act === "flee") && Math.hypot(gl.tx - gl.x, gl.ty - gl.y) > 0.02) frame = Math.floor(gl.t / 9) % 2 ? F.walk1 : F.walk2;
        s.setFrame(frame * CW, 0, CW, cropH);
        if (air) s.anchor.set(0.5, 0.5);
        else s.anchor.set(LEGS / CW, gl.mode === "float" ? 1 : FOOT / CH);
        // turning round: the body narrows through its edge and widens the other way, no mirror flip at once
        gl.sx += (gl.facing - gl.sx) * (air ? 0.16 : 0.3);
        // in the air the body follows its path on the screen: nose down going down the screen or gliding down, up climbing (a little)
        let tilt = 0;
        if (air) {
            const vx = Math.cos(gl.h) * gl.spd * tw, vy = Math.sin(gl.h) * gl.spd * th - gl.vz;
            tilt = Math.max(-0.4, Math.min(0.4, Math.atan2(vy, Math.abs(vx) + 0.6) * 0.55)) * (gl.sx >= 0 ? 1 : -1);
        }
        gl.rot += (tilt - gl.rot) * 0.08;
        s.rotation = gl.rot;
        const k = air ? 1 + gl.z / 900 : 1;   // (a little larger high up: nearer the eye)
        s.scale.set((Math.abs(gl.sx) < 0.12 ? 0.12 * (gl.sx < 0 ? -1 : 1) : gl.sx) * k, k);
        const bob = gl.mode === "float" ? Math.sin(gl.t * 0.06 + gl.ph) * 1.5 + 3 : 0;
        s.x = gx;
        s.y = gy - gl.z + bob - (air ? FOOT - CH / 2 : 0);   // (in the air its middle where a standing gull's body is: it touches down without a jump)
        s.z = air && gl.z > 20 ? 9 : 3;
        const sh = gl.shadow;
        sh.x = gx; sh.y = gy;
        sh.visible = air;
        sh.alpha = Math.max(0.2, 1 - gl.z / 170) * (waterAt(gl.x, gl.y) ? 0.6 : 1);
        sh.scale.set(Math.max(0.55, 1 - gl.z / 300), Math.max(0.55, 1 - gl.z / 300));   // (higher up: a smaller, fainter shadow)
        const rp = gl.ripple;
        rp.visible = gl.mode === "float";
        if (rp.visible) { rp.x = gx; rp.y = gy + 3 + bob * 0.3; rp.scale.set(1 + 0.08 * Math.sin(gl.t * 0.05 + gl.ph), 1); rp.alpha = 0.6 + 0.2 * Math.sin(gl.t * 0.05); }
        if (window.Hunting && Hunting.updateMark) Hunting.updateMark(gl, s, -24, gl.mode === "ground" || gl.mode === "float" ? gl._aware : 0);
        if (gl._markSprite) gl._markSprite.scale.x = gl.sx < 0 ? -1 : 1;   // (the gull is mirrored, its "?" must not be)
    }
    const feathers = [];
    function featherBurst(gl) {
        const tm = tilemap();
        if (!tm) return;
        for (let i = 0; i < 10; i++) {
            const bmp = new Bitmap(3, 2);
            bmp.fillRect(0, 0, 3, 2, pick(["#f2f2ee", "#c9ccd2", "#9aa0aa"]));
            const s = new Sprite(bmp);
            s.anchor.set(0.5, 0.5);
            s.z = 8;
            tm.addChild(s);
            feathers.push({ s, x: gl.x + rand(-0.2, 0.2), y: gl.y - 0.3, z: rand(4, 14) + gl.z, vx: rand(-0.02, 0.02), vz: rand(0.3, 1), t: 0, ph: rand(0, 6) });
        }
    }
    function updateFeathers() {
        const tw = TILE(), th = $gameMap.tileHeight();
        for (const f of feathers) {
            f.t++;
            f.vz -= 0.03;
            f.z = Math.max(0, f.z + Math.max(-0.35, f.vz));
            f.x += f.vx + Math.sin(f.t * 0.15 + f.ph) * 0.006;
            f.s.x = Math.round($gameMap.adjustX(f.x) * tw);
            f.s.y = Math.round($gameMap.adjustY(f.y) * th - f.z);
            f.s.rotation = Math.sin(f.t * 0.2 + f.ph) * 0.8;
            f.s.alpha = f.t < 100 ? 1 : Math.max(0, 1 - (f.t - 100) / 40);
        }
        for (const f of feathers.filter(f => f.t > 140)) if (f.s.parent) f.s.parent.removeChild(f.s);
        feathers.splice(0, feathers.length, ...feathers.filter(f => f.t <= 140));
    }

    // ------------------------------------------------------------------
    // The map drives it: on arrival on the shore by day a gull or two is already up and a flock already stands on the sand; then
    // more come now and then (gliders kept at 2-3, one flock at a time, at most 2 on the water)
    // ------------------------------------------------------------------
    function reset() {
        for (const g of gulls) dropSprite(g);
        for (const f of feathers) if (f.s.parent) f.s.parent.removeChild(f.s);
        feathers.length = 0;
        gulls = [];
        flock = null;
        geo = null;
        timers = { glide: Math.round(rand(600, 1400)), flock: Math.round(rand(1800, 3600)), swim: Math.round(rand(900, 2400)), first: 20 };
    }
    T.on("mapEnter", () => reset(), { owner: PLUGIN });
    T.on("load", () => reset(), { owner: PLUGIN });
    T.onMapUpdate(() => {
        if (!$gameMap || !$gamePlayer) return;
        if (!here()) { if (gulls.length) reset(); return; }
        buildGeo();
        if (auto && gullTime()) {
            if (timers.first > 0 && --timers.first === 0) {   // (a moment after arriving: the shore is not empty)
                spawnGlider(true);
                if (Math.random() < 0.5) spawnGlider(true);
                spawnFlock(true);
            }
            const gliders = gulls.filter(g => g.mode === "glide").length, want = count(2 + (Math.random() < 0.3 ? 1 : 0));
            if (--timers.glide <= 0) { timers.glide = Math.round(rand(900, 2400)); if (gliders < want) spawnGlider(false); }
            if (--timers.flock <= 0) { timers.flock = Math.round(rand(2400, 5400)); if (!flock) spawnFlock(false); }
            if (--timers.swim <= 0) { timers.swim = Math.round(rand(2400, 6000)); if (gulls.filter(g => g.swim || g.mode === "float").length < count(2)) spawnSwimmer(); }
        }
        for (const g of gulls.slice()) updateGull(g);
        updateFlock();
        gulls = gulls.filter(g => { if (g.gone) { dropSprite(g); return false; } return true; });
        for (const g of gulls) drawGull(g);
        updateFeathers();
    }, { owner: PLUGIN, name: "mewy" });

    window.Mewy = T.register(PLUGIN, {
        MAPS, auto: v => { auto = !!v; }, reset, here, spawnGlider, spawnFlock, spawnSwimmer, flush: () => flock && flush(flock, heroX(), heroY()),
        get gulls() { return gulls; }, get flock() { return flock; }, geo: () => (here() ? buildGeo() : null), killGull
    });
})();
