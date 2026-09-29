//=============================================================================
// HomeAmbience.js
//=============================================================================
// Load order: after TawernaCore.js (the frame runner, the sound layers, map data, tags, the calendar, the saved state), RoomLighting.js
// (its lights and <LightFlicker>), Survival.js, Storm.js and Atmosphere.js (only read).
// Z-order: sparks and steam live in the tilemap (under the room's darkness, over the hearth); the window views, the sun's dust,
// the lightning flash and the warm grade go over RoomLighting's darkness, under the pictures and the HUD.

/*:
 * @target MZ
 * @plugindesc Dom dziadka żyje: migoczący ogień z iskrami i parą, kurz w smugach słońca, widok za oknami, ciepły nastrój, dźwięki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter RoomLighting
 * @orderAfter Survival
 * @orderAfter Storm
 * @orderAfter Atmosphere
 *
 * @param maps
 * @text Mapy (numery po przecinku)
 * @desc Mapy z tym klimatem. Na każdej innej wystarczy notatka mapy <HomeAmbience>.
 * @default 19
 *
 * @param fireFlicker
 * @text Migotanie paleniska
 * @desc Siła migotania światła ognia (0 = bez). Kolor przechodzi przy tym z pomarańczu w bursztyn i z powrotem.
 * @type number
 * @decimals 2
 * @min 0
 * @max 0.5
 * @default 0.16
 *
 * @param candleFlicker
 * @text Migotanie świec
 * @type number
 * @decimals 2
 * @min 0
 * @max 0.5
 * @default 0.06
 *
 * @param sparks
 * @text Iskry z ognia
 * @type boolean
 * @default true
 *
 * @param steam
 * @text Para z kotła (0-1)
 * @desc Zwykła siła pary nad kotłem. HomeAmbience.setSteam(poziom) ją zmienia (np. gdy gotuje się zupa).
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 0.3
 *
 * @param dust
 * @text Drobinki kurzu w smudze słońca
 * @desc Ile drobinek unosi się w jednej smudze światła z okna (za dnia).
 * @type number
 * @min 0
 * @max 40
 * @default 14
 *
 * @param windowView
 * @text Widok za oknami
 * @type boolean
 * @default true
 *
 * @param windowTiles
 * @text Kafelki szyby (górny,dolny)
 * @desc Numery kafelków okna z szybą (tileset B): para górny,dolny; kilka par po średniku.
 * @default 16,24
 *
 * @param grading
 * @text Ciepły nastrój (kolor i winieta)
 * @type boolean
 * @default true
 *
 * @param gradeStrength
 * @text Siła nastroju (%)
 * @type number
 * @min 0
 * @max 200
 * @default 100
 *
 * @param sounds
 * @text Dźwięki domu
 * @desc Trzask ognia (głośniej przy palenisku), deszcz na dachu, wiatr w czasie burzy i śnieżycy, tykanie zegara.
 * @type boolean
 * @default true
 *
 * @param soundVolume
 * @text Głośność dźwięków domu (%)
 * @type number
 * @min 0
 * @max 150
 * @default 100
 *
 * @help
 * ============================================================================
 * HomeAmbience.js - dom dziadka żyje
 * ============================================================================
 * Działa na mapach z parametru "Mapy" (domyślnie 19) albo z notatką
 * <HomeAmbience>. Niczego nie zapisuje w plikach mapy.
 *
 * OGIEŃ
 *   Światło paleniska migocze (RoomLighting.js: <LightFlicker>) - jasność
 *   i zasięg falują jak prawdziwy płomień, kolor przechodzi z pomarańczu
 *   w bursztyn. Każda świeca migocze po swojemu, delikatnie. Z ognia
 *   unoszą się iskry (czasem cała garść, gdy trzaśnie polano) i gasną,
 *   zanim dolecą do szczytu komina. Nad kotłem snuje się para.
 *   Palenisko i świece rozpoznaje po nazwie eventu ze światłem <Light>
 *   ("Palenisko", "kominek", "ognisko" / "świeca", "lampa").
 *
 * SŁOŃCE
 *   W smugach słońca z okien (za dnia) unoszą się powoli drobinki kurzu.
 *   Gdy pada albo jest burza, smugi słońca przygasają.
 *
 * OKNA
 *   Za szybami widać dwór: niebo o każdej porze (różowy świt, błękit dnia,
 *   pomarańczowy zmierzch, granatowa noc z migoczącymi gwiazdami, czasem
 *   księżyc), las na horyzoncie, obłoki. Deszcz: smugi deszczu i krople
 *   spływające po szybie. Śnieg: płatki za oknem, a zimą szron wchodzący
 *   od rogów szyb (grubszy nocą). Burza: błyskawica rozświetla okna i na
 *   moment cały pokój (zgodnie z piorunami Storm.js).
 *   Widok jest rysowany tylko na samym szkle (bez ramy i firanek), a to, co
 *   stoi przed szybą (doniczki, kot), zostaje na wierzchu.
 *
 * NASTRÓJ
 *   Ciepły odcień i miękka winieta, mocniejsze wieczorem. Nad warstwą
 *   światła, pod interfejsem.
 *
 * DŹWIĘKI (pliki z audio/bgs, głośność z opcji gry)
 *   Cichy trzask ognia - głośniej przy palenisku, z właściwej strony.
 *   Gdy pada: kapanie (deszcz na dachu gra Atmosphere.js - nie podwaja się).
 *   Burza: wycie wiatru. Śnieżyca: cichy wiatr. Zegar (event z "zegar"
 *   w nazwie): tykanie. Nigdy głośniej niż tła Atmosphere.js.
 *
 * DLA INNYCH WTYCZEK (window.HomeAmbience)
 *   setSteam(poziom)  para nad kotłem 0..1 (np. 1 gdy gotuje się zupa);
 *                     setSteam(null) wraca do zwykłej. Zapisuje się w grze.
 *   steam()           obecny poziom pary
 *   isActive()        czy ta mapa ma klimat domu
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "HomeAmbience";
    const T = window.Tawerna;
    if (!T) throw new Error("HomeAmbience.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const P = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    const flag = (v, d) => (v === undefined || v === "" ? d : v === "true");
    const MAPS = String(P.maps || "19").split(",").map(s => Number(s.trim())).filter(n => n > 0);
    const FIRE_FLICKER = num(P.fireFlicker, 0.16);
    const CANDLE_FLICKER = num(P.candleFlicker, 0.06);
    const SPARKS = flag(P.sparks, true);
    const STEAM = Math.max(0, Math.min(1, num(P.steam, 0.3)));
    const DUST = Math.max(0, Math.min(40, Math.round(num(P.dust, 14))));
    const WINDOW_VIEW = flag(P.windowView, true);
    const WINDOW_PAIRS = String(P.windowTiles || "16,24").split(";").map(s => s.split(",").map(v => Number(v.trim())))
        .filter(p => p.length === 2 && p.every(n => n >= 0 && isFinite(n)));
    const GRADING = flag(P.grading, true);
    const GRADE = num(P.gradeStrength, 100) / 100;
    const SOUNDS = flag(P.sounds, true);
    const SOUND_VOL = num(P.soundVolume, 100) / 100;
    const AMBER = "132,84,20";   // the hearth's glow drifts from its own orange to this amber

    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
    const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
    const lerp = (a, b, t) => a + (b - a) * t;
    function hash(n) {
        const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
        return v - Math.floor(v);
    }
    // a seeded generator for the pictures built once (stars, frost, clouds)
    function rng(seed) {
        let s = (seed >>> 0) || 1;
        return () => {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = Math.imul(s ^ (s >>> 15), s | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    // value noise on a plane (seeded lattice, smoothstep between the points) and three octaves of it, 0..1
    function lattice2(ix, iy, seed) {
        const v = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453;
        return v - Math.floor(v);
    }
    function noise2(x, y, seed) {
        const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
        const u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
        const a = lattice2(ix, iy, seed), b = lattice2(ix + 1, iy, seed), c = lattice2(ix, iy + 1, seed), d = lattice2(ix + 1, iy + 1, seed);
        return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
    }
    const fbm2 = (x, y, seed) => 0.55 * noise2(x, y, seed) + 0.3 * noise2(x * 2.03, y * 2.03, seed + 11) + 0.15 * noise2(x * 4.1, y * 4.1, seed + 23);

    function isHomeMap(mapId, note) {
        return MAPS.includes(mapId) || T.hasTag(note || "", PLUGIN);
    }
    const onHome = () => !!($dataMap && $gameMap && isHomeMap($gameMap.mapId(), $dataMap.note));

    // ------------------------------------------------------------------
    // The map's notes, in memory only (data/*.json stays as it is): the flames flicker (RoomLighting's <LightFlicker>) and the
    // sun's dust is drawn here, so RoomLighting's own motes are turned off in these shafts
    // ------------------------------------------------------------------
    const FIRE_RE = /palenisk|kominek|ognisk|ogie[nń]|fireplace|campfire/i;
    const CANDLE_RE = /[śŚsS]wiec|lamp|latarn|kaganek|candle/i;
    function flameKind(data) {
        if (!data) return null;
        const page = data.pages && data.pages[0], img = (page && page.image && page.image.characterName) || "";
        const text = (data.name || "") + " " + img;
        return FIRE_RE.test(text) ? "fire" : CANDLE_RE.test(text) ? "candle" : null;
    }
    const hasLight = note => T.hasTag(note || "", "Light");   // (<Light> / <Light:...> in the event's note - RoomLighting's)
    function prepareMap(map) {
        if (!map || !map.events || map._homePrepared) return;
        map._homePrepared = true;
        for (const e of map.events) {
            if (!e || typeof e.note !== "string") continue;
            if (hasLight(e.note) && !T.hasTag(e.note, "LightFlicker")) {
                const kind = flameKind(e);
                if (kind === "fire" && FIRE_FLICKER > 0) e.note += "<LightFlicker:" + FIRE_FLICKER + "," + AMBER + ">";
                else if (kind === "candle" && CANDLE_FLICKER > 0) e.note += "<LightFlicker:" + CANDLE_FLICKER + ">";
            }
            if (DUST > 0 && T.hasTag(e.note, "LightCone")) e.note = e.note.replace(/(<LightCone:[^>]*?\bdust\s*=\s*)\d+/i, (m, head) => head + "0");
        }
    }
    T.onMapData((data, mapId) => { if (isHomeMap(mapId, data.note)) prepareMap(data); }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The world outside: the hour, the weather plan (Survival.js), the storm (Storm.js), the season (Farming.js)
    // ------------------------------------------------------------------
    const env = { hour: 12, day: 1, season: 0, night: 0, rainT: 0, snowT: 0, rain: 0, snow: 0, overT: 0, over: 0, storm: 0,
        frostT: 0, frost: 0, clouds: 0.2, fresh: true, lastDay: -1, lastHour: -99 };
    // 0 by day .. 1 in the evening and at night (as RoomLighting's lamps: evening 16-19, dawn 6-8)
    function nightCurve(h) {
        if (h >= 19 || h < 6) return 1;
        if (h >= 16) return smooth((h - 16) / 3);
        if (h < 8) return 1 - smooth((h - 6) / 2);
        return 0;
    }
    // how cold the glass is: 1 at night, 0 in the early afternoon
    function coldness(h) {
        if (h >= 22 || h < 6) return 1;
        if (h < 11) return 1 - smooth((h - 6) / 5);
        if (h < 15) return 0;
        return smooth((h - 15) / 7);
    }
    const seasonOf = day => T.time.season(day);
    // frost on the panes: all winter (thicker at night and when it snows) and on the cold nights of the last week of autumn
    function frostTarget(h, season, day, snow) {
        const inSeason = T.time.dayOfSeason(day);
        if (season === 3) return clamp01(0.5 + 0.4 * coldness(h) + 0.15 * snow);
        if (season === 2 && inSeason > 21) return 0.35 * coldness(h);
        return 0;
    }
    const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
    function readEnv() {
        const h = T.time.hour(), day = T.time.day();
        env.hour = h;
        env.day = day;
        env.season = seasonOf(day);
        env.night = nightCurve(h);
        const S = T.api("Survival"), plan = S && S.currentWeather ? S.currentWeather() : null;
        const p01 = plan ? clamp01((plan.power - 2) / 3) : 0;
        env.rainT = plan && plan.type !== "snow" ? 0.35 + 0.65 * p01 : 0;
        env.snowT = plan && plan.type === "snow" ? 0.35 + 0.65 * p01 : 0;
        env.storm = clamp01(T.util.num(T.call("Storm", "level"), 0));
        // the clouds gather in the hour and a half before the rain and clear in the hour after it
        const full = S && S.weatherPlan ? S.weatherPlan(day) : null;
        let gather = 0;
        if (full) gather = h < full.start ? smooth((h - (full.start - 1.5)) / 1.5) : h >= full.end ? 1 - smooth((h - full.end) / 1.2) : 1;
        env.overT = Math.max(plan ? 0.8 + 0.2 * p01 : 0, gather * 0.85, env.storm);
        env.clouds = 0.1 + 0.22 * hash(day * 3.7);   // how cloudy a fair day is
        env.frostT = frostTarget(h, env.season, day, env.snowT);
        // a new map, a night's sleep, a jump of the clock: the world as it is now, no fading in
        if (day !== env.lastDay || Math.abs(h - env.lastHour) > 0.2) env.fresh = true;
        env.lastDay = day;
        env.lastHour = h;
        if (env.fresh) {
            env.rain = env.rainT; env.snow = env.snowT; env.over = env.overT; env.frost = env.frostT;
            env.fresh = false;
        } else {
            env.rain = approach(env.rain, env.rainT, 0.004);
            env.snow = approach(env.snow, env.snowT, 0.004);
            env.over = approach(env.over, env.overT, 0.003);
            env.frost = approach(env.frost, env.frostT, 0.0006);   // (it creeps)
        }
    }

    // the sky through the glass by the hour: [hour, sky top rgb, horizon rgb, far hills rgb, pines rgb, lit clouds rgb, stars, light]
    const SKY = [
        [0.0, 10, 14, 36, 22, 30, 64, 20, 26, 50, 8, 11, 24, 30, 36, 62, 1, 0],
        [4.8, 10, 14, 36, 22, 30, 64, 20, 26, 50, 8, 11, 24, 30, 36, 62, 1, 0],
        [5.6, 30, 34, 76, 98, 76, 112, 44, 42, 70, 20, 20, 38, 92, 72, 102, 0.5, 0.2],
        [6.4, 84, 106, 168, 240, 172, 170, 98, 92, 124, 44, 46, 70, 248, 196, 196, 0.05, 0.55],
        [7.4, 98, 142, 202, 238, 208, 190, 112, 130, 140, 60, 82, 84, 252, 234, 222, 0, 0.85],
        [9.0, 92, 148, 214, 186, 216, 238, 116, 146, 156, 62, 92, 92, 248, 250, 252, 0, 1],
        [16.0, 96, 146, 208, 198, 216, 232, 118, 144, 152, 62, 88, 90, 248, 248, 250, 0, 1],
        [17.6, 104, 124, 186, 246, 198, 142, 128, 120, 126, 66, 66, 76, 252, 216, 172, 0, 0.85],
        [18.6, 92, 78, 142, 252, 148, 76, 110, 82, 96, 52, 42, 58, 250, 162, 112, 0, 0.6],
        [19.5, 36, 38, 90, 152, 84, 92, 60, 48, 74, 28, 24, 42, 122, 72, 92, 0.4, 0.3],
        [20.5, 14, 18, 48, 34, 38, 84, 22, 26, 52, 10, 12, 28, 36, 40, 70, 1, 0.05],
        [24.0, 10, 14, 36, 22, 30, 64, 20, 26, 50, 8, 11, 24, 30, 36, 62, 1, 0]
    ];
    const pal = new Float32Array(18);
    const PAL_TOP = 1, PAL_HOR = 4, PAL_HILL = 7, PAL_PINE = 10, PAL_CLOUD = 13, PAL_STARS = 16, PAL_LIGHT = 17;
    function palette(h) {
        let i = 0;
        while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
        const a = SKY[i], b = SKY[i + 1], t = clamp01((h - a[0]) / (b[0] - a[0] || 1));
        for (let k = 1; k < 18; k++) pal[k] = a[k] + (b[k] - a[k]) * t;
    }

    // ------------------------------------------------------------------
    // Shared pictures (made once)
    // ------------------------------------------------------------------
    const cache = {};
    function dotBitmap(kind) {
        if (cache[kind]) return cache[kind];
        let bmp;
        if (kind === "white") {
            bmp = new Bitmap(8, 8);
            bmp.fillAll("#ffffff");
        } else if (kind === "px1") {
            bmp = new Bitmap(1, 1);
            bmp.fillAll("#ffffff");
        } else if (kind === "px3") {   // a soft 3x3 fleck
            bmp = new Bitmap(3, 3);
            const ctx = bmp.context;
            [[1, 1, 1], [0, 1, 0.42], [2, 1, 0.42], [1, 0, 0.42], [1, 2, 0.42], [0, 0, 0.14], [2, 0, 0.14], [0, 2, 0.14], [2, 2, 0.14]].forEach(([x, y, a]) => {
                ctx.fillStyle = "rgba(255,255,255," + a + ")";
                ctx.fillRect(x, y, 1, 1);
            });
            bmp._baseTexture.update();
        } else if (kind === "bokeh") {   // a soft out-of-focus speck
            bmp = new Bitmap(5, 5);
            const ctx = bmp.context;
            for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
                const d = Math.hypot(x - 2, y - 2), a = d <= 0.5 ? 0.55 : d <= 1.5 ? 0.42 : d <= 2.3 ? 0.14 : 0;
                if (a > 0) { ctx.fillStyle = "rgba(255,255,255," + a + ")"; ctx.fillRect(x, y, 1, 1); }
            }
            bmp._baseTexture.update();
        }
        bmp.smooth = false;
        return (cache[kind] = bmp);
    }
    // a wisp of steam: a few soft overlapping lumps (three shapes)
    function steamBitmap(v) {
        const key = "steam" + v;
        if (cache[key]) return cache[key];
        const S = 24, bmp = new Bitmap(S, S), ctx = bmp.context, r = rng(900 + v * 17);
        const lumps = [[12, 13, 7]];
        for (let i = 0; i < 4; i++) lumps.push([12 + (r() - 0.5) * 9, 12 + (r() - 0.5) * 8, 3 + r() * 3.5]);
        for (const [x, y, rad] of lumps) {
            const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
            g.addColorStop(0, "rgba(255,255,255,0.8)");
            g.addColorStop(0.55, "rgba(255,255,255,0.38)");
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, S, S);
        }
        bmp._baseTexture.update();
        return (cache[key] = bmp);
    }
    // the vignette: clear in the middle, a soft warm-dark rim (screen space, stretched to the screen)
    function vignetteBitmap() {
        if (cache.vignette) return cache.vignette;
        const W = 320, H = 180, bmp = new Bitmap(W, H), ctx = bmp.context;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(1, H / W);
        const R = W * 0.62, g = ctx.createRadialGradient(0, 0, R * 0.42, 0, 0, R);
        g.addColorStop(0, "rgba(26,13,6,0)");
        g.addColorStop(0.55, "rgba(26,13,6,0.16)");
        g.addColorStop(1, "rgba(22,10,4,0.46)");
        ctx.fillStyle = g;
        ctx.fillRect(-W, -W, W * 2, W * 2);
        ctx.restore();
        bmp._baseTexture.update();
        return (cache.vignette = bmp);
    }
    // the clouds' noise: a tileable 64x32 field (the windows look through it as it drifts)
    const CLOUD_W = 64, CLOUD_H = 32;
    let cloudField = null;
    function clouds() {
        if (cloudField) return cloudField;
        cloudField = new Float32Array(CLOUD_W * CLOUD_H);
        const r = rng(4242), L = [];
        for (const [cw, ch, amp] of [[8, 4, 0.55], [16, 8, 0.3], [32, 16, 0.15]]) {
            const pts = new Float32Array(cw * ch);
            for (let i = 0; i < pts.length; i++) pts[i] = r();
            L.push({ cw, ch, amp, pts });
        }
        for (let y = 0; y < CLOUD_H; y++) for (let x = 0; x < CLOUD_W; x++) {
            let v = 0;
            for (const o of L) {
                const gx = (x / CLOUD_W) * o.cw, gy = (y / CLOUD_H) * o.ch, ix = Math.floor(gx), iy = Math.floor(gy);
                const fx = smooth(gx - ix), fy = smooth(gy - iy), x1 = (ix + 1) % o.cw, y1 = (iy + 1) % o.ch;
                const a = o.pts[iy * o.cw + ix], b = o.pts[iy * o.cw + x1], c = o.pts[y1 * o.cw + ix], d = o.pts[y1 * o.cw + x1];
                v += o.amp * lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
            }
            cloudField[y * CLOUD_W + x] = v;
        }
        return cloudField;
    }
    const rgbInt = (r, g, b) => ((Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b))));

    // ------------------------------------------------------------------
    // The hearth: sparks rising from the fire, steam curling up from the cauldron
    // ------------------------------------------------------------------
    // where the fire and the cauldron's rim are in a fire's picture, in px from the foot of its sprite ([dx, dy, half width])
    const FIRE_DEFS = { "!$Fireplace": { fire: [0, -57, 9], pot: [0, -74, 5], rise: [70, 110] } };
    const FIRE_DEFAULT = { fire: [0, -26, 8], pot: null, rise: [50, 80] };
    const SPARK_N = 32, STEAM_N = 18;
    const SPARK_HOT = [255, 238, 170], SPARK_MID = [255, 158, 62], SPARK_COOL = [196, 72, 34];

    function FireFx(fx, ev) {
        this._ev = ev;
        this._name = ev.characterName();
        this._def = FIRE_DEFS[this._name] || FIRE_DEFAULT;
        this.cont = new Sprite();
        this.cont.z = ev.screenZ();
        fx.tilemap.addChild(this.cont);
        this.sparks = [];
        this.puffs = [];
        for (let i = 0; i < SPARK_N; i++) {
            const s = new Sprite(dotBitmap(i % 2 === 0 ? "px3" : "px1"));
            s.anchor.set(0.5, 0.5);
            s.blendMode = PIXI.BLEND_MODES.ADD;
            s.visible = false;
            s._on = false;
            this.cont.addChild(s);
            this.sparks.push(s);
        }
        for (let i = 0; i < STEAM_N; i++) {
            const s = new Sprite(steamBitmap(i % 3));
            s.anchor.set(0.5, 0.5);
            s.visible = false;
            s._on = false;
            s.tint = 0xfff2e6;
            this.cont.addChild(s);
            this.puffs.push(s);
        }
        this._sparkAcc = 0;
        this._steamAcc = 0;
        this._burst = 60 + Math.floor(Math.random() * 120);
    }
    // the flame's strength now (the hearth light's flicker, RoomLighting): more sparks when it flares
    FireFx.prototype.flare = function(fx) {
        const light = fx.lightOf(this._ev.eventId());
        return light && light._flicker ? light._flicker.k : 1;
    };
    FireFx.prototype.spawnSpark = function() {
        let s = null;
        for (let i = 0; i < SPARK_N; i++) if (!this.sparks[i]._on) { s = this.sparks[i]; break; }
        if (!s) return;
        const f = this._def.fire, rise = this._def.rise;
        s._on = true;
        s.visible = true;
        s._x = f[0] + (Math.random() * 2 - 1) * f[2];
        s._y = f[1] + (Math.random() * 2 - 1) * 3;
        s._vx = (Math.random() - 0.5) * 0.5;
        s._vy = -(0.5 + Math.random() * 0.8);
        s._age = 0;
        s._life = 45 + Math.random() * 65;
        s._top = f[1] - (rise[0] + Math.random() * (rise[1] - rise[0]));   // it dies out before the top of the chimney
        s._ph = Math.random() * 6.283;
    };
    FireFx.prototype.spawnPuff = function(level) {
        const pot = this._def.pot;
        if (!pot) return;
        let s = null;
        for (let i = 0; i < STEAM_N; i++) if (!this.puffs[i]._on) { s = this.puffs[i]; break; }
        if (!s) return;
        s._on = true;
        s.visible = true;
        s._x = pot[0] + (Math.random() * 2 - 1) * pot[2];
        s._y = pot[1] + Math.random() * 2;
        s._vx = (Math.random() - 0.5) * 0.12;
        s._vy = -(0.22 + Math.random() * 0.2) * (0.85 + 0.35 * level);
        s._age = 0;
        s._life = 100 + Math.random() * 70;
        s._s0 = 0.28 + Math.random() * 0.14;
        s._s1 = 1.05 + Math.random() * 0.55 + level * 0.5;
        s._a0 = 0.2 + 0.32 * level;
        s._ph = Math.random() * 6.283;
        s.rotation = Math.random() * 6.283;
        s._vr = (Math.random() - 0.5) * 0.012;
    };
    FireFx.prototype.update = function(fx) {
        const ev = this._ev, cont = this.cont;
        const alive = ev && !ev._erased && ev.characterName() === this._name;
        const fx0 = ev.screenX(), fy0 = ev.screenY(), v = fx.view;
        const shown = alive && fx0 > v.x0 - 120 && fx0 < v.x1 + 120 && fy0 > v.y0 - 60 && fy0 - 180 < v.y1;
        cont.visible = shown;
        if (!shown) return;
        cont.z = ev.screenZ();
        cont.y = fy0 + 0.5;   // (sorted right after the hearth's own sprite: over it, under whoever stands in front)
        const T = fx.t;
        // sparks: a few all the time (more as the flame flares), now and then a handful when a log cracks
        if (SPARKS) {
            this._sparkAcc += 0.07 * (0.4 + this.flare(fx));
            while (this._sparkAcc >= 1) { this._sparkAcc -= 1; this.spawnSpark(); }
            if (--this._burst <= 0) {
                const n = 4 + Math.floor(Math.random() * 5);
                for (let i = 0; i < n; i++) this.spawnSpark();
                this._burst = 80 + Math.floor(Math.random() * 220);
            }
        }
        for (let i = 0; i < SPARK_N; i++) {
            const s = this.sparks[i];
            if (!s._on) continue;
            s._age++;
            s._vx += (Math.random() - 0.5) * 0.08 + Math.sin(T * 0.07 + s._ph) * 0.004;
            s._vx *= 0.96;
            s._vy = s._vy * 0.99 - 0.004;
            s._x += s._vx;
            s._y += s._vy;
            const k = s._age / s._life, nearTop = clamp01((s._y - s._top) / 14);
            if (k >= 1 || nearTop <= 0) { s._on = false; s.visible = false; continue; }
            const c0 = k < 0.35 ? SPARK_HOT : SPARK_MID, c1 = k < 0.35 ? SPARK_MID : SPARK_COOL, q = k < 0.35 ? k / 0.35 : (k - 0.35) / 0.65;
            s.tint = rgbInt(lerp(c0[0], c1[0], q), lerp(c0[1], c1[1], q), lerp(c0[2], c1[2], q));
            s.alpha = Math.min(1, 1.2 * Math.pow(1 - k, 1.1) * nearTop * (0.72 + 0.28 * Math.random()));
            s.x = Math.round(fx0 + s._x);
            s.y = Math.round(fy0 + s._y) - cont.y;
        }
        // steam: gentle by default, thicker when the soup cooks (setSteam)
        const level = fx.steamNow;
        this._steamAcc += 0.02 + 0.14 * level;
        while (this._steamAcc >= 1) { this._steamAcc -= 1; this.spawnPuff(level); }
        for (let i = 0; i < STEAM_N; i++) {
            const s = this.puffs[i];
            if (!s._on) continue;
            s._age++;
            const k = s._age / s._life;
            if (k >= 1) { s._on = false; s.visible = false; continue; }
            s._x += s._vx + Math.sin(s._ph + s._age * 0.045) * 0.2 * k;   // it curls more the higher it gets
            s._y += s._vy * (1 - 0.45 * k);
            const sc = s._s0 + (s._s1 - s._s0) * Math.sqrt(k);
            s.scale.set(sc, sc * 1.25);   // (a wisp: a little taller than wide)
            s.rotation += s._vr;
            s.alpha = s._a0 * Math.min(1, k / 0.08) * Math.pow(1 - k, 1.4);
            s.x = Math.round(fx0 + s._x);
            s.y = Math.round(fy0 + s._y) - cont.y;
        }
    };
    // (tests) how many sparks and puffs are in the air, the highest spark and the farthest one sideways, px from the foot
    FireFx.prototype.counts = function() {
        let sparks = 0, puffs = 0, minY = 0, spread = 0, puffTop = 0;
        for (const s of this.sparks) if (s._on) { sparks++; minY = Math.min(minY, s._y); spread = Math.max(spread, Math.abs(s._x)); }
        for (const s of this.puffs) if (s._on) { puffs++; puffTop = Math.min(puffTop, s._y); }
        return { sparks, puffs, highest: Math.round(minY), spread: Math.round(spread), puffTop: Math.round(puffTop), fire: this._def.fire[1],
            maxRise: this._def.rise[1], shown: this.cont.visible };
    };

    // ------------------------------------------------------------------
    // The window views: the outside drawn on the glass itself
    // ------------------------------------------------------------------
    const RAIN_N = 10, FLAKE_N = 16, DROP_N = 5;
    const FROST_REACH = 0.5;   // how far in from the corners the thickest frost reaches (the middle of a pane stays clear)
    let scratch = null;
    function scratchCanvas(w, h) {
        if (!scratch) scratch = document.createElement("canvas");
        if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
        const ctx = scratch.getContext("2d", { willReadFrequently: true });   // (read back often: kept in memory, not on the GPU)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        return ctx;
    }
    // the sheet and the source rectangle of an ordinary (not auto-) tile, as the tilemap draws it
    function tileSource(tileId) {
        if (!(tileId > 0) || (tileId >= Tilemap.TILE_ID_A1) || (tileId >= 1024 && !Tilemap.isTileA5(tileId))) return null;
        const set = Tilemap.isTileA5(tileId) ? 4 : 5 + Math.floor(tileId / 256);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        return { set, sx: ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * tw, sy: (Math.floor((tileId % 256) / 8) % 16) * th };
    }
    function tileImage(set) {
        const ts = $gameMap.tileset(), name = ts && ts.tilesetNames[set];
        if (!name) return null;
        const bmp = ImageManager.loadTileset(name);
        return bmp.isReady() ? bmp._image || bmp._canvas : undefined;   // (undefined: still loading)
    }

    function WindowView(fx, tx, ty, z) {
        this.tx = tx;
        this.ty = ty;
        this.z = z;
        this.built = false;
        this.sprite = null;
        this._fx = fx;
        this._paintAt = 0;
        this._occAt = 0;
        this._occSig = -1;
    }
    // reads the window's tiles (the glass and what hangs over it - the curtains) and works out the glass pixel by pixel
    WindowView.prototype.build = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), W = tw, H = th * 2;
        const own = [], cover = [];
        for (let dy = 0; dy < 2; dy++) {
            for (let z = 0; z < 4; z++) {
                const id = $gameMap.tileId(this.tx, this.ty + dy, z), src = tileSource(id);
                if (!src || z < this.z) continue;
                const img = tileImage(src.set);
                if (img === undefined) return false;   // (the sheet is not loaded yet: again next frame)
                if (img) (z === this.z ? own : cover).push({ img, src, dy });
            }
        }
        const draw = list => {
            const ctx = scratchCanvas(W, H);
            for (const t of list) ctx.drawImage(t.img, t.src.sx, t.src.sy, tw, th, 0, t.dy * th, tw, th);
            return ctx.getImageData(0, 0, W, H).data;
        };
        const win = draw(own), cov = draw(cover);
        // the glass: bluish pixels of the window's own tile; its commonest colour is the clear glass, lighter ones its soft rim
        const glass = new Uint8Array(W * H), counts = new Map();
        for (let i = 0; i < W * H; i++) {
            const r = win[i * 4], g = win[i * 4 + 1], b = win[i * 4 + 2], a = win[i * 4 + 3];
            if (a > 0 && b > r + 8 && b > g + 8) {
                glass[i] = 1;
                const key = (r << 16) | (g << 8) | b;
                counts.set(key, (counts.get(key) || 0) + 1);
            }
        }
        let main = 0, best = -1;
        counts.forEach((n, key) => { if (n > best) { best = n; main = key; } });
        const lum = key => ((key >> 16) & 255) * 0.3 + ((key >> 8) & 255) * 0.59 + (key & 255) * 0.11;
        const mainLum = lum(main);
        let x0 = W, y0 = H, x1 = -1, y1 = -1, gx0 = W, gy0 = H, gx1 = -1, gy1 = -1;
        const vis = new Float32Array(W * H);
        for (let i = 0; i < W * H; i++) {
            if (!glass[i]) continue;
            const x = i % W, y = (i / W) | 0;
            gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y);
            const key = (win[i * 4] << 16) | (win[i * 4 + 1] << 8) | win[i * 4 + 2];
            const ga = key === main || lum(key) <= mainLum + 4 ? 1 : 0.5;
            const ca = cov[i * 4 + 3] / 255;
            if (ca >= 0.99) continue;
            vis[i] = ga;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
        if (x1 < 0) { this.built = true; this.empty = true; return true; }
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1, n = bw * bh;
        Object.assign(this, { bx0: x0, by0: y0, bw, bh, n, gx0, gy0, gx1, gy1 });
        const gh = Math.max(1, gy1 - gy0);
        // the panes as they are seen (the glass between the glazing bars and the curtains) for the frost that grows from their corners
        const panes = [];
        for (let x = x0; x <= x1; x++) {
            let on = false;
            for (let y = y0; y <= y1 && !on; y++) on = vis[y * W + x] > 0.9;
            const last = panes[panes.length - 1];
            if (on) { if (last && last.open) last.x1 = x; else panes.push({ x0: x, x1: x, open: true }); }
            else if (last) last.open = false;
        }
        for (const p of panes) {
            p.y0 = H; p.y1 = -1;
            for (let y = 0; y < H; y++) for (let x = p.x0; x <= p.x1; x++) if (vis[y * W + x] > 0) { p.y0 = Math.min(p.y0, y); p.y1 = Math.max(p.y1, y); }
        }
        this.A = new Float32Array(n);
        this.cov = new Float32Array(n);
        this.covR = new Uint8Array(n); this.covG = new Uint8Array(n); this.covB = new Uint8Array(n);
        this.frostT = new Float32Array(n);
        this.ridge = new Float32Array(n);
        this.sheen = new Float32Array(n);
        this.occ = new Uint8Array(n);
        this.wet = new Float32Array(n);
        this.R = new Float32Array(n); this.G = new Float32Array(n); this.B = new Float32Array(n);
        this.yn = new Float32Array(bh);
        this.rowR = new Float32Array(bh); this.rowG = new Float32Array(bh); this.rowB = new Float32Array(bh);
        this.hillRow = new Float32Array(bw);
        this.pineRow = new Float32Array(bw);
        this.starIdx = new Int16Array(n).fill(-1);
        const wx0 = this.tx * tw + x0, seed = this.tx * 13 + this.ty * 7;
        for (let v = 0; v < bh; v++) this.yn[v] = (y0 + v - gy0) / gh;
        // the land on the horizon: far hills and, nearer, a line of pines (one landscape across all the windows)
        for (let u = 0; u < bw; u++) {
            const wx = wx0 + u;
            this.hillRow[u] = gy0 + (0.6 + 0.08 * (fbm2(wx / 26, 3.3, 5) - 0.5) * 2) * gh - y0;
            let top = gy0 + 0.8 * gh - y0;
            for (let c = Math.floor(wx / 6) - 2; c <= Math.floor(wx / 6) + 2; c++) {
                const cx = c * 6 + (hash(c * 1.7) - 0.5) * 3, hgt = 3 + hash(c * 3.1 + 9) * 4;
                top = Math.min(top, gy0 + 0.8 * gh - y0 - hgt + Math.abs(wx - cx) * 1.35);
            }
            this.pineRow[u] = top;
        }
        const r = rng(seed * 31 + 7);
        for (let i = 0; i < n; i++) {
            const u = i % bw, v = (i / bw) | 0, X = x0 + u, Y = y0 + v, bi = Y * W + X;
            this.A[i] = vis[bi];
            const ca = cov[bi * 4 + 3] / 255;
            if (ca > 0 && ca < 0.99) { this.cov[i] = ca; this.covR[i] = cov[bi * 4]; this.covG[i] = cov[bi * 4 + 1]; this.covB[i] = cov[bi * 4 + 2]; }
            // frost: from each pane's corners and along its edges, the middle stays clear; a feathery rim, crystal lines
            let pane = null;
            for (const p of panes) if (X >= p.x0 - 1 && X <= p.x1 + 1) { pane = p; break; }
            if (pane) {
                const hw = Math.max(1, (pane.x1 - pane.x0) / 2), hh = Math.max(1, (pane.y1 - pane.y0) / 2);
                const ex = clamp01(Math.min(X - pane.x0, pane.x1 - X) / hw), ey = clamp01(Math.min(Y - pane.y0, pane.y1 - Y) / hh);
                const eyLow = clamp01((pane.y1 - Y) / hh);   // (it gathers along the bottom a little more)
                const d = 0.6 * Math.sqrt(ex * ex + ey * ey) / 1.4142 + 0.4 * Math.min(ex, ey, eyLow * 1.25);
                this.frostT[i] = d + (fbm2(X * 0.33 + seed, Y * 0.33, 31) - 0.5) * 0.36;
                this.ridge[i] = 1 - Math.abs(2 * fbm2(X * 0.38, Y * 0.38 + seed, 47) - 1);
            } else this.frostT[i] = 9;
            // a faint diagonal sheen on the glass
            const sh = (X - Y * 0.7 + 400) % 19;
            this.sheen[i] = sh < 1.2 ? 1 : sh < 2.4 ? 0.45 : 0;
        }
        // stars: a handful in the open sky above the hills, spread out (never two side by side)
        const stars = [], sky = [];
        for (let i = 0; i < n; i++) { const u = i % bw, v = (i / bw) | 0; if (this.A[i] > 0.9 && v < this.hillRow[u] - 2 && v >= 1) sky.push(i); }
        const want = Math.min(12, 4 + Math.floor(sky.length / 70));
        for (let tries = 0; tries < 400 && stars.length < want && sky.length; tries++) {
            const i = sky[Math.floor(r() * sky.length)], u = i % bw, v = (i / bw) | 0;
            if (stars.every(j => Math.abs((j % bw) - u) + Math.abs(((j / bw) | 0) - v) >= 4)) { this.starIdx[i] = stars.length; stars.push(i); }
        }
        this.starB = new Float32Array(stars.length);
        this.starPh = new Float32Array(stars.length);
        this.starSp = new Float32Array(stars.length);
        for (let k = 0; k < stars.length; k++) {
            this.starB[k] = k % 4 === 0 ? 1 : 0.55 + r() * 0.35;   // (every fourth a bright one)
            this.starPh[k] = r() * 6.283;
            this.starSp[k] = 0.03 + r() * 0.05;
        }
        this.nStars = stars.length;
        this.starPos = Int32Array.from(stars);
        // rain streaks and snowflakes outside, drops on the glass (pools)
        this.rx = new Float32Array(RAIN_N); this.ry = new Float32Array(RAIN_N); this.rl = new Float32Array(RAIN_N); this.rv = new Float32Array(RAIN_N);
        for (let k = 0; k < RAIN_N; k++) this.respawnRain(k, true);
        this.fxs = new Float32Array(FLAKE_N); this.fys = new Float32Array(FLAKE_N); this.fvy = new Float32Array(FLAKE_N);
        this.fph = new Float32Array(FLAKE_N); this.fsz = new Uint8Array(FLAKE_N);
        for (let k = 0; k < FLAKE_N; k++) this.respawnFlake(k, true);
        this.dx = new Float32Array(DROP_N); this.dy = new Float32Array(DROP_N); this.dv = new Float32Array(DROP_N); this.dp = new Float32Array(DROP_N);
        for (let k = 0; k < DROP_N; k++) this.respawnDrop(k, true);
        const bmp = new Bitmap(bw, bh);
        bmp.smooth = false;
        this.img = bmp.context.createImageData(bw, bh);
        this.sprite = new Sprite(bmp);
        this._fx.windowLayer.addChild(this.sprite);
        this.built = true;
        return true;
    };
    WindowView.prototype.respawnRain = function(k, anywhere) {
        this.rx[k] = Math.random() * (this.bw + 8) - 2;
        this.ry[k] = anywhere ? Math.random() * this.bh : -Math.random() * this.bh * 0.6;
        this.rl[k] = 3 + Math.floor(Math.random() * 3);
        this.rv[k] = 2.4 + Math.random() * 1.4;
    };
    WindowView.prototype.respawnFlake = function(k, anywhere) {
        this.fxs[k] = Math.random() * (this.bw + 6) - 3;
        this.fys[k] = anywhere ? Math.random() * this.bh : -1 - Math.random() * 6;
        this.fvy[k] = 0.12 + Math.random() * 0.22;
        this.fph[k] = Math.random() * 6.283;
        this.fsz[k] = Math.random() < 0.25 ? 2 : 1;
    };
    WindowView.prototype.respawnDrop = function(k, anywhere) {
        this.dx[k] = Math.floor(Math.random() * this.bw);
        this.dy[k] = anywhere ? Math.random() * this.bh : Math.random() * this.bh * 0.55;
        this.dv[k] = 0.15 + Math.random() * 0.35;
        this.dp[k] = Math.random() * 60;
    };
    // what stands in front of the glass (the flower pots, the cat...) stays on top: its pixels are left out of the view
    WindowView.prototype.updateOccluders = function(fx, sx, sy) {
        const kids = fx.tilemap.children;
        let sig = 0;
        const hits = fx.occHits;
        hits.length = 0;
        for (let i = 0; i < kids.length; i++) {
            const c = kids[i];
            if (!c.visible || !(c instanceof Sprite) || c.alpha <= 0 || fx.ownSprite(c) || !c.bitmap || !(c.z > 0)) continue;   // (anything over the tiles)
            const f = c._frame, sw = Math.abs(c.scale.x), shh = Math.abs(c.scale.y);
            if (!f || f.width <= 0) continue;
            const left = c.x - c.anchor.x * f.width * sw - sx, top = c.y - c.anchor.y * f.height * shh - sy;
            if (left >= this.bw || top >= this.bh || left + f.width * sw <= 0 || top + f.height * shh <= 0) continue;
            hits.push(c);
            sig += (left * 3.1 + top * 7.7 + f.x * 1.3 + f.y * 2.9 + f.width * 0.7 + (c.bitmap.isReady() ? 5 : 0)) * (hits.length + 1);
        }
        if (sig === this._occSig) return;
        this._occSig = sig;
        this.occ.fill(0);
        if (!hits.length) return;
        const ctx = scratchCanvas(this.bw, this.bh);
        for (const c of hits) {
            const bmp = c.bitmap, img = bmp._canvas || bmp._image, f = c._frame;
            if (!img || !bmp.isReady()) { this._occSig = -1; continue; }
            const w = f.width * c.scale.x, h = f.height * c.scale.y;
            const left = c.x - c.anchor.x * w - sx, top = c.y - c.anchor.y * h - sy;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, c.alpha));
            ctx.translate(left, top);
            ctx.scale(Math.sign(w) || 1, Math.sign(h) || 1);
            ctx.drawImage(img, f.x, f.y, f.width, f.height, 0, 0, Math.abs(w), Math.abs(h));
            ctx.restore();
        }
        const data = ctx.getImageData(0, 0, this.bw, this.bh).data;
        for (let i = 0; i < this.n; i++) this.occ[i] = data[i * 4 + 3];
    };
    // the moon tonight: in which window, where on its way (right to left, 19:00 - 5:00), how full
    function moonNow(fx) {
        const h = env.hour, ni = h >= 12 ? env.day : env.day - 1;
        const phase = (((ni + 9) % 30) + 30) % 30 / 30, lit = 0.5 - 0.5 * Math.cos(phase * 6.283);
        const mt = ((h - 19 + 24) % 24) / 10;
        const M = fx.moon;
        M.on = fx.forceMoon !== false && (fx.forceMoon === true || lit > 0.3) && mt <= 1 && fx.windows.length > 0;
        M.win = fx.forceMoonWin >= 0 && fx.forceMoonWin < fx.windows.length ? fx.forceMoonWin : Math.floor(hash(ni * 1.37 + 0.5) * fx.windows.length) % Math.max(1, fx.windows.length);
        M.t = mt;
        M.lit = fx.forceMoon === true ? Math.max(lit, 0.75) : lit;
        M.wax = phase < 0.5;
    }
    WindowView.prototype.paint = function(fx, dt) {
        const n = this.n, bw = this.bw, bh = this.bh, R = this.R, G = this.G, B = this.B, A = this.A;
        const T = fx.t, O = env.over, S = env.storm, F = fx.flash, L = pal[PAL_LIGHT], gh = Math.max(1, this.gy1 - this.gy0);
        // the sky, row by row: the hour's gradient, greyed by the clouds of rain or snow, darkened by a storm, lit by lightning
        const gTopR = lerp(16, 128, L), gTopG = lerp(18, 138, L), gTopB = lerp(28, 150, L);
        const gHorR = lerp(26, 168, L), gHorG = lerp(28, 174, L), gHorB = lerp(38, 182, L);
        for (let v = 0; v < bh; v++) {
            const k = Math.pow(clamp01(this.yn[v]), 0.7);
            let r = lerp(pal[PAL_TOP], pal[PAL_HOR], k), g = lerp(pal[PAL_TOP + 1], pal[PAL_HOR + 1], k), b = lerp(pal[PAL_TOP + 2], pal[PAL_HOR + 2], k);
            if (O > 0) {
                const q = O * 0.88;
                r = lerp(r, lerp(gTopR, gHorR, k), q); g = lerp(g, lerp(gTopG, gHorG, k), q); b = lerp(b, lerp(gTopB, gHorB, k), q);
            }
            if (S > 0) { const q = S * 0.55; r = lerp(r, lerp(12, 66, L), q); g = lerp(g, lerp(14, 70, L), q); b = lerp(b, lerp(20, 84, L), q); }
            if (F > 0) { const q = F * 0.9; r = lerp(r, 232, q); g = lerp(g, 236, q); b = lerp(b, 255, q); }
            this.rowR[v] = r; this.rowG[v] = g; this.rowB[v] = b;
        }
        const field = clouds(), cov = Math.min(1, env.clouds + O * 0.9), ox = T * 0.012 + this.tx * 48 * 0.5, oy = T * 0.002;
        let cloR = lerp(pal[PAL_CLOUD], lerp(gHorR, 190, 0.3 * L), O), cloG = lerp(pal[PAL_CLOUD + 1], lerp(gHorG, 196, 0.3 * L), O), cloB = lerp(pal[PAL_CLOUD + 2], lerp(gHorB, 204, 0.3 * L), O);
        if (F > 0) { cloR = lerp(cloR, 222, F * 0.85); cloG = lerp(cloG, 226, F * 0.85); cloB = lerp(cloB, 244, F * 0.85); }   // (the lightning lights the clouds)
        const starsOn = pal[PAL_STARS] * (1 - O) * (1 - F);
        const winter = env.season === 3;
        const haze = Math.min(0.7, 0.4 * env.rain + 0.3 * env.snow + 0.2 * O);
        // the moon, if it is in this window now
        const M = fx.moon, moonHere = M.on && fx.windows[M.win] === this && starsOn > 0.05 && O < 0.7;
        const mu = moonHere ? Math.round(this.bw + 2 - M.t * (this.bw + 4)) : -99;
        const mv = moonHere ? Math.round((this.gy0 - this.by0) + (0.24 + 0.16 * (1 - Math.sin(M.t * Math.PI))) * gh) : -99;
        const shadowOff = (M.wax ? -1 : 1) * 4.4 * M.lit;   // (the shadow disc slides off as the moon fills)
        for (let p = 0; p < n; p++) {
            if (A[p] <= 0) continue;
            const u = p % bw, v = (p / bw) | 0;
            let r = this.rowR[v], g = this.rowG[v], b = this.rowB[v];
            // clouds drifting past
            const ci = ((((u + ox) | 0) % CLOUD_W) + CLOUD_W) % CLOUD_W + ((((v * 1.6 + oy) | 0) % CLOUD_H + CLOUD_H) % CLOUD_H) * CLOUD_W;
            const ca = smooth((field[ci] - (1 - cov) + 0.12) / 0.3) * (1 - 0.35 * this.yn[v]) * (0.55 + 0.45 * (1 - F));
            if (ca > 0) { r = lerp(r, cloR, ca * 0.8); g = lerp(g, cloG, ca * 0.8); b = lerp(b, cloB, ca * 0.8); }
            // the moon (with its phase) and the stars twinkling
            if (moonHere) {   // a crisp 5 px disc: the lit part pale gold, the rest only a little lighter than the sky; a faint halo
                const ddx = u - mu, ddy = v - mv, d2 = ddx * ddx + ddy * ddy, clear = (1 - O) * (1 - 0.6 * ca);
                if (d2 <= 5) {
                    const sdx = ddx - shadowOff;
                    if (sdx * sdx + ddy * ddy > 4.6) { r = lerp(r, 246, clear); g = lerp(g, 238, clear); b = lerp(b, 208, clear); }
                    else { r += 16 * clear; g += 18 * clear; b += 24 * clear; }
                } else if (d2 <= 13) {
                    const m = (d2 <= 8 ? 0.2 : 0.09) * clear * M.lit;
                    r = lerp(r, 214, m); g = lerp(g, 214, m); b = lerp(b, 206, m);
                }
            }
            const si = this.starIdx[p];
            if (si >= 0 && starsOn > 0) {
                const tw = 0.55 + 0.25 * Math.sin(T * this.starSp[si] + this.starPh[si]) + 0.2 * Math.sin(T * this.starSp[si] * 2.7 + this.starPh[si] * 1.3);
                const m = this.starB[si] * tw * starsOn * (1 - ca);
                r = lerp(r, 246, m); g = lerp(g, 248, m); b = lerp(b, 255, m);
            }
            // the land: far hills, then the pines (a white cap on each in winter; against a flash they turn black)
            if (v >= this.hillRow[u]) {
                let hr = pal[PAL_HILL], hg = pal[PAL_HILL + 1], hb = pal[PAL_HILL + 2];
                if (winter) { hr = lerp(hr, lerp(40, 214, L), 0.7); hg = lerp(hg, lerp(46, 222, L), 0.7); hb = lerp(hb, lerp(70, 236, L), 0.7); }
                if (v >= this.pineRow[u]) {
                    hr = pal[PAL_PINE]; hg = pal[PAL_PINE + 1]; hb = pal[PAL_PINE + 2];
                    if (winter && v - this.pineRow[u] < 1) { hr = lerp(46, 226, L); hg = lerp(52, 232, L); hb = lerp(76, 242, L); }
                }
                hr = lerp(hr, r, haze); hg = lerp(hg, g, haze); hb = lerp(hb, b, haze);
                if (F > 0) { hr *= 1 - 0.75 * F; hg *= 1 - 0.75 * F; hb *= 1 - 0.7 * F; }
                r = hr; g = hg; b = hb;
            }
            R[p] = r; G[p] = g; B[p] = b;
        }
        // the bright stars, at the top of their twinkle, cast a tiny cross
        if (starsOn > 0.3) {
            for (let k = 0; k < this.nStars; k++) {
                if (this.starB[k] < 1) continue;
                const tw = 0.55 + 0.25 * Math.sin(T * this.starSp[k] + this.starPh[k]) + 0.2 * Math.sin(T * this.starSp[k] * 2.7 + this.starPh[k] * 1.3);
                const m = (tw * starsOn - 0.72) * 0.9;
                if (m <= 0) continue;
                const p = this.starPos[k], u = p % bw, v = (p / bw) | 0;
                for (let q = 0; q < 4; q++) {
                    const nu = u + (q === 0 ? -1 : q === 1 ? 1 : 0), nv = v + (q === 2 ? -1 : q === 3 ? 1 : 0);
                    if (nu < 0 || nu >= bw || nv < 0 || nv >= bh) continue;
                    const np = nv * bw + nu;
                    if (A[np] <= 0 || nv >= this.hillRow[nu]) continue;
                    R[np] = lerp(R[np], 230, m); G[np] = lerp(G[np], 232, m); B[np] = lerp(B[np], 236, m);
                }
            }
        }
        // rain streaks outside (slanting harder in a storm)
        const nRain = Math.round(RAIN_N * env.rain), slant = 0.22 + 0.45 * S;
        for (let k = 0; k < RAIN_N; k++) {
            if (k >= nRain) continue;
            this.ry[k] += this.rv[k] * (1 + 0.5 * S) * dt;
            this.rx[k] += this.rv[k] * slant * dt * 0.5;
            if (this.ry[k] - this.rl[k] > bh || this.rx[k] > bw + 4) { this.respawnRain(k, false); continue; }
            for (let j = 0; j < this.rl[k]; j++) {
                const px = Math.round(this.rx[k] - slant * j * 0.5), py = Math.round(this.ry[k] - j);
                if (px < 0 || px >= bw || py < 0 || py >= bh) continue;
                const p = py * bw + px;
                if (A[p] <= 0) continue;
                const m = (0.58 - 0.36 * (j / this.rl[k])) * (0.65 + 0.35 * L);
                R[p] = lerp(R[p], this.rowR[py] + 70, m); G[p] = lerp(G[p], this.rowG[py] + 72, m); B[p] = lerp(B[p], this.rowB[py] + 78, m);
            }
        }
        // snowflakes drifting past
        const nFlakes = Math.round(FLAKE_N * env.snow);
        const fr = lerp(118, 240, L), fg = lerp(128, 244, L), fb = lerp(158, 250, L);
        for (let k = 0; k < FLAKE_N; k++) {
            if (k >= nFlakes) continue;
            this.fys[k] += this.fvy[k] * dt;
            this.fxs[k] += (Math.sin(T * 0.045 + this.fph[k]) * 0.18 + 0.05) * dt;
            if (this.fys[k] > bh + 1 || this.fxs[k] > bw + 3) { this.respawnFlake(k, false); continue; }
            const px = Math.round(this.fxs[k]), py = Math.round(this.fys[k]);
            for (let s = 0; s < this.fsz[k]; s++) {
                const qx = px + s;
                if (qx < 0 || qx >= bw || py < 0 || py >= bh) continue;
                const p = py * bw + qx;
                if (A[p] <= 0) continue;
                const m = s === 0 ? 0.92 : 0.45;
                R[p] = lerp(R[p], fr, m); G[p] = lerp(G[p], fg, m); B[p] = lerp(B[p], fb, m);
            }
        }
        // drops on the glass: they slide down in fits and starts and leave a wet trail behind
        const nDrops = env.rain > 0.05 ? Math.max(1, Math.round(DROP_N * env.rain)) : 0;
        const wetFade = Math.pow(0.975, dt);
        for (let p = 0; p < n; p++) if (this.wet[p] > 0.003) this.wet[p] *= wetFade; else this.wet[p] = 0;
        for (let k = 0; k < DROP_N; k++) {
            if (k >= nDrops) continue;
            if (this.dp[k] > 0) this.dp[k] -= dt;
            else {
                const y0 = this.dy[k];
                this.dy[k] += this.dv[k] * dt;
                if (Math.random() < 0.015 * dt) { this.dp[k] = 8 + Math.random() * 40; this.dv[k] = 0.15 + Math.random() * 0.45; }
                for (let y = Math.floor(y0); y <= Math.floor(this.dy[k]); y++) {
                    if (y >= 0 && y < bh) this.wet[y * bw + (this.dx[k] | 0)] = 1;
                }
                if (this.dy[k] > bh + 1) { this.respawnDrop(k, false); continue; }
            }
        }
        // the glass itself: wet trails, the drops, the frost, the sheen, the curtain's shade over it; then out to the picture
        const data = this.img.data, Fr = env.frost * FROST_REACH;
        const frR = lerp(122, 222, L), frG = lerp(146, 234, L), frB = lerp(192, 250, L);
        for (let p = 0; p < n; p++) {
            const a = A[p] * (1 - this.occ[p] / 255), o = p * 4;
            if (a <= 0) { data[o + 3] = 0; continue; }
            let r = R[p], g = G[p], b = B[p];
            const w = this.wet[p];
            if (w > 0) { r += 26 * w; g += 29 * w; b += 34 * w; }
            if (Fr > 0) {
                const t = this.frostT[p];
                if (t < Fr) {
                    const depth = Fr - t, cr = this.ridge[p];
                    const m = depth > 0.1 ? 0.62 + 0.14 * (cr - 0.5) : (depth / 0.1) * (0.3 + 0.55 * cr * cr);
                    const crystal = depth < 0.12 && cr > 0.78 ? 26 : 0;
                    r = lerp(r, frR + crystal, m); g = lerp(g, frG + crystal, m); b = lerp(b, frB + crystal, m);
                }
            }
            const sh = this.sheen[p];
            if (sh > 0) { const k = sh * (5 + 7 * L); r += k; g += k; b += k; }
            const c = this.cov[p];
            if (c > 0) { r = lerp(r, this.covR[p], c); g = lerp(g, this.covG[p], c); b = lerp(b, this.covB[p], c); }
            data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = a * 255;
        }
        // the drops on top: a bright point with a dark rim under it
        for (let k = 0; k < nDrops; k++) {
            const px = this.dx[k] | 0, py = Math.round(this.dy[k]);
            if (py >= 0 && py < bh) this.dot(data, px, py, 226, 236, 246, 0.95);
            if (py + 1 >= 0 && py + 1 < bh) this.dot(data, px, py + 1, this.rowR[py + 1] * 0.5, this.rowG[py + 1] * 0.52, this.rowB[py + 1] * 0.58, 0.62);
        }
        const bmp = this.sprite.bitmap;
        bmp.context.putImageData(this.img, 0, 0);
        bmp._baseTexture.update();
    };
    WindowView.prototype.dot = function(data, x, y, r, g, b, m) {
        if (x < 0 || x >= this.bw || y < 0 || y >= this.bh) return;
        const p = y * this.bw + x, o = p * 4;
        if (data[o + 3] === 0) return;
        data[o] = lerp(data[o], r, m); data[o + 1] = lerp(data[o + 1], g, m); data[o + 2] = lerp(data[o + 2], b, m);
    };
    WindowView.prototype.update = function(fx) {
        if (!this.built) {
            if (fx._builds > 0) return;   // (one window read a frame)
            fx._builds++;
            if (!this.build()) return;
        }
        if (this.empty) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const sx = Math.round($gameMap.adjustX(this.tx) * tw) + this.bx0, sy = Math.round($gameMap.adjustY(this.ty) * th) + this.by0;
        const v = fx.view, shown = sx + this.bw > v.x0 && sx < v.x1 && sy + this.bh > v.y0 && sy < v.y1;
        this.sprite.visible = shown;
        if (!shown) return;
        this.sprite.x = sx;
        this.sprite.y = sy;
        if (fx.t >= this._occAt) { this._occAt = fx.t + 3; this.updateOccluders(fx, sx, sy); }
        // repainted often while something moves on it (rain, snow, stars, the moon, lightning), rarely on a calm day
        const busy = env.rain > 0.01 || env.snow > 0.01 || fx.flash > 0 || pal[PAL_STARS] > 0.02 || env.frost !== env.frostT;
        if (fx.t >= this._paintAt) {
            const dt = Math.min(12, fx.t - (this._lastPaint || fx.t - 1));
            this._lastPaint = fx.t;
            this._paintAt = fx.t + (busy ? 2 : 10);
            this.paint(fx, dt);
        }
    };
    // what the test reads: the painted sky's average colour (its top half), and what is on the glass
    WindowView.prototype.sample = function(fx) {
        if (!this.built || this.empty) return null;
        const d = this.img.data, top = [0, 0, 0, 0], hor = [0, 0, 0, 0];
        let frost = 0, lit = 0, bright = 0;
        const Fr = env.frost * FROST_REACH;
        for (let p = 0; p < this.n; p++) {
            if (d[p * 4 + 3] === 0) continue;
            const u = p % this.bw, v = (p / this.bw) | 0, yn = this.yn[v];
            const acc = this.A[p] > 0.9 && this.occ[p] === 0 && v < this.hillRow[u] ? (yn < 0.4 ? top : yn < 0.62 ? hor : null) : null;
            if (acc) { acc[0] += d[p * 4]; acc[1] += d[p * 4 + 1]; acc[2] += d[p * 4 + 2]; acc[3]++; }
            if (Fr > 0 && this.frostT[p] < Fr) frost++;
            if (d[p * 4] + d[p * 4 + 1] + d[p * 4 + 2] > 600) bright++;
            lit++;
        }
        const avg = a => [Math.round(a[0] / Math.max(1, a[3])), Math.round(a[1] / Math.max(1, a[3])), Math.round(a[2] / Math.max(1, a[3]))];
        const M = fx.moon;
        return { x: this.tx, y: this.ty, top: avg(top), hor: avg(hor), px: lit, bright,
            frost, stars: this.nStars, rain: Math.round(RAIN_N * env.rain), flakes: Math.round(FLAKE_N * env.snow),
            drops: env.rain > 0.05 ? Math.max(1, Math.round(DROP_N * env.rain)) : 0, occluded: this.occ.reduce((s, a) => s + (a > 0 ? 1 : 0), 0),
            moon: M.on && fx.windows[M.win] === this && pal[PAL_STARS] * (1 - env.over) > 0.05 && env.over < 0.7,
            visible: !!(this.sprite && this.sprite.visible), bbox: [this.bx0, this.by0, this.bw, this.bh] };
    };

    // ------------------------------------------------------------------
    // Dust in the sun: slow specks drifting in each window's shaft of light (by day), a painting rather than noise
    // ------------------------------------------------------------------
    function Mote(hole, sprite) {
        this.hole = hole;
        this.spr = sprite;
        this.fade = 0;
        this.respawn(true);
    }
    Mote.prototype.respawn = function(anywhere) {
        const len = this.hole.geom.length, t0 = this.hole._tMin || 8;
        this.t = t0 + Math.random() * (len * 0.85 - t0);
        this.s = 0.15 + Math.random() * 0.7;
        this.vt = (Math.random() - 0.45) * 0.03;
        this.vs = (Math.random() - 0.5) * 0.0012;
        this.f1 = 0.006 + Math.random() * 0.01; this.p1 = Math.random() * 6.283;
        this.f2 = 0.005 + Math.random() * 0.008; this.p2 = Math.random() * 6.283;
        this.f3 = 0.02 + Math.random() * 0.03; this.p3 = Math.random() * 6.283;
        this.amp = 1.5 + Math.random() * 3.5;
        this.fade = anywhere ? Math.random() : 0;
        this.glint = 0;
    };

    // ------------------------------------------------------------------
    // All of it on one map (made with the map's spriteset, only on the home maps)
    // ------------------------------------------------------------------
    function HomeFx(spriteset) {
        this.set = spriteset;
        this.tilemap = spriteset._tilemap;
        this.t = 0;
        this.view = { x0: 0, y0: 0, x1: 0, y1: 0 };
        this.flash = 0;
        this.pulses = [{ at: -999, amp: 0 }, { at: -999, amp: 0 }, { at: -999, amp: 0 }];
        this.moon = { on: false, win: 0, t: 0, lit: 0, wax: true };
        this.forceMoon = null;
        this.forceMoonWin = -1;
        this.occHits = [];
        this.steamNow = steamWanted();
        this.perf = { ms: 0, max: 0, n: 0 };
        env.fresh = true;
        readEnv();
        palette(env.hour);
        const St = T.api("Storm");
        this._strikes = St && St.state ? St.state.strikes : 0;
        // over the room's darkness (RoomLighting's layer), in the map's coordinates: the window views, then the dust
        this.windowLayer = new Sprite();
        this.dustLayer = new Sprite();
        spriteset.addChild(this.windowLayer);
        spriteset.addChild(this.dustLayer);
        // in the screen's coordinates, over all of it (under the pictures and the HUD): the warm grade, the vignette, the flash
        this.screenLayer = new Sprite();
        spriteset.addChild(this.screenLayer);
        this.fires = [];
        for (const ev of $gameMap.events()) {
            const data = ev.event();
            if (data && hasLight(data.note) && flameKind(data) === "fire" && ev.characterName()) this.fires.push(new FireFx(this, ev));
        }
        this.windows = [];
        if (WINDOW_VIEW) this.findWindows();
        this.motes = [];
        this.cones = [];
        if (DUST > 0 && spriteset.roomLightHoles) {
            for (const hole of spriteset.roomLightHoles()) {
                if (hole.shape !== "cone" || !hole.geom) continue;
                this.cones.push(hole);
                for (let i = 0; i < DUST; i++) {
                    const r = Math.random(), kind = r < 0.58 ? "px1" : r < 0.9 ? "px3" : "bokeh";
                    const s = new Sprite(dotBitmap(kind));
                    s.anchor.set(0.5, 0.5);
                    s.blendMode = PIXI.BLEND_MODES.ADD;
                    s.tint = 0xffeccd;
                    s.visible = false;
                    this.dustLayer.addChild(s);
                    const m = new Mote(hole, s);
                    m.base = kind === "px1" ? 0.65 + Math.random() * 0.35 : kind === "px3" ? 0.45 + Math.random() * 0.25 : 0.24 + Math.random() * 0.16;
                    this.motes.push(m);
                }
            }
        }
        if (GRADING) this.createGrade();
    }
    HomeFx.prototype.ownSprite = function(c) {
        for (let i = 0; i < this.fires.length; i++) if (this.fires[i].cont === c) return true;
        return false;
    };
    HomeFx.prototype.lightOf = function(eventId) {
        const holes = this.set.roomLightHoles ? this.set.roomLightHoles() : [];
        for (let i = 0; i < holes.length; i++) if (holes[i].sprite._eventId === eventId) return holes[i].sprite;
        return null;
    };
    HomeFx.prototype.findWindows = function() {
        const W = $dataMap.width, H = $dataMap.height;
        for (const [top, bottom] of WINDOW_PAIRS) {
            for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) for (let z = 0; z < 4; z++) {
                if ($gameMap.tileId(x, y, z) === top && $gameMap.tileId(x, y + 1, z) === bottom) this.windows.push(new WindowView(this, x, y, z));
            }
        }
    };
    HomeFx.prototype.createGrade = function() {
        const white = dotBitmap("white"), W = Graphics.width, H = Graphics.height;
        const full = s => { s.scale.set(W / s.bitmap.width, H / s.bitmap.height); this.screenLayer.addChild(s); return s; };
        this.gradeMul = full(new Sprite(white));
        this.gradeMul.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this.gradeWash = full(new Sprite(white));
        this.gradeWash.tint = 0xffa050;
        const vig = vignetteBitmap();
        vig.smooth = true;
        this.vignette = full(new Sprite(vig));
        this.flashSprite = full(new Sprite(white));
        this.flashSprite.blendMode = PIXI.BLEND_MODES.ADD;
        this.flashSprite.tint = 0xdfe8ff;
        this.flashSprite.alpha = 0;
    };
    // a lightning strike (Storm.js counts them, also under a roof, where it shows no flash of its own): the flash here, as
    // Storm draws one outdoors - full for 3 frames, then fading, sometimes flickering twice or three times
    HomeFx.prototype.watchStorm = function() {
        const St = T.api("Storm"), st = St && St.state;
        if (st && st.strikes !== this._strikes) {
            this._strikes = st.strikes;
            this.strike(st.last ? st.last.d : 0.5);
        }
        let f = 0;
        for (let i = 0; i < 3; i++) {
            const p = this.pulses[i], age = this.t - p.at;
            if (age >= 0 && age < 40) f = Math.max(f, p.amp * (age < 3 ? 1 : Math.exp(-(age - 3) / 4.5)));
        }
        this.flash = Math.min(1, f);
    };
    HomeFx.prototype.strike = function(d) {
        const amp = 1 - 0.75 * clamp01(d), P = this.pulses;
        P[0].at = this.t; P[0].amp = amp;
        P[1].at = Math.random() < 0.6 ? this.t + 4 + Math.floor(Math.random() * 5) : -999; P[1].amp = amp * (0.5 + Math.random() * 0.4);
        P[2].at = Math.random() < 0.25 ? this.t + 10 + Math.floor(Math.random() * 7) : -999; P[2].amp = amp * 0.6;
        this.strikes = (this.strikes || 0) + 1;
    };
    HomeFx.prototype.updateView = function() {
        const s = this.set.scale.x || 1, v = this.view;
        v.x0 = -this.set.x / s;
        v.y0 = -this.set.y / s;
        v.x1 = v.x0 + Graphics.width / s;
        v.y1 = v.y0 + Graphics.height / s;
    };
    HomeFx.prototype.update = function() {
        const t0 = performance.now();
        this.t++;
        readEnv();
        palette(env.hour);
        this.updateView();
        this.watchStorm();
        moonNow(this);
        this.steamNow = approach(this.steamNow, steamWanted(), 0.01);
        // the sun through the windows dims under the clouds of rain, snow and storm (RoomLighting's _gain)
        for (let i = 0; i < this.cones.length; i++) this.cones[i].sprite._gain = Math.max(0.08, 1 - 0.9 * env.over);
        for (let i = 0; i < this.fires.length; i++) this.fires[i].update(this);
        this._builds = 0;
        for (let i = 0; i < this.windows.length; i++) this.windows[i].update(this);
        this.updateDust();
        this.updateGrade();
        const ms = performance.now() - t0, pf = this.perf;
        pf.n++;
        pf.ms += (ms - pf.ms) / Math.min(pf.n, 120);
        pf.max = Math.max(pf.max * 0.995, ms);
    };
    // where a shaft leaves its window's glass (the dust floats in the room, never over the view outside)
    HomeFx.prototype.coneStart = function(hole) {
        if (hole._tMin !== undefined) return hole._tMin;
        const light = hole.sprite;
        for (let i = 0; i < this.windows.length; i++) {
            const w = this.windows[i];
            if (!w.built) return -1;   // (not known yet: the dust waits)
            if (w.empty || !w.sprite) continue;
            if (light.x >= w.sprite.x - 12 && light.x <= w.sprite.x + w.bw + 12 && light.y <= w.sprite.y + w.bh + 4 && light.y >= w.sprite.y - 60) {
                return (hole._tMin = Math.max(8, w.sprite.y + w.bh - light.y + 4));
            }
        }
        return (hole._tMin = 8);
    };
    HomeFx.prototype.updateDust = function() {
        const T = this.t;
        for (let i = 0; i < this.motes.length; i++) {
            const m = this.motes[i], light = m.hole.sprite, spr = m.spr, w = light.visible ? light._weight : 0;
            const t0 = this.coneStart(m.hole);
            if (w < 0.02 || t0 < 0) { spr.visible = false; continue; }
            const g = m.hole.geom, len = g.length;
            // a slow shared current in each shaft, each speck swaying on its own
            m.t += m.vt + 0.012 * Math.sin(T * 0.004 + light.x * 0.01);
            m.s += m.vs + 0.0009 * Math.sin(T * 0.003 + light.y * 0.02);
            if (m.t < t0 || m.t > len * 0.9 || m.s < 0.05 || m.s > 0.95) { m.respawn(false); continue; }
            m.fade = Math.min(1, m.fade + 1 / 50);
            if (m.glint > 0) m.glint--; else if (Math.random() < 0.0015) m.glint = 24;   // catching the light for a moment
            const lx = g.nearLeft.x + g.leftDir.x * m.t, ly = g.nearLeft.y + g.leftDir.y * m.t;
            const rx = g.nearRight.x + g.rightDir.x * m.t, ry = g.nearRight.y + g.rightDir.y * m.t;
            const px = lx + (rx - lx) * m.s + Math.sin(T * m.f1 + m.p1) * m.amp, py = ly + (ry - ly) * m.s + Math.cos(T * m.f2 + m.p2) * m.amp * 0.6;
            const edge = smooth(Math.min(m.s, 1 - m.s) / 0.25), along = Math.pow(1 - m.t / len, 0.8) * smooth((m.t - t0) / 12);
            const shine = (0.75 + 0.25 * Math.sin(T * m.f3 + m.p3)) * (m.glint > 0 ? 1 + 0.9 * Math.sin((m.glint / 24) * Math.PI) : 1);
            spr.visible = true;
            spr.alpha = Math.min(1, w * m.base * edge * along * m.fade * shine);
            spr.x = Math.round(light.x + px);
            spr.y = Math.round(light.y + py);
        }
    };
    HomeFx.prototype.updateGrade = function() {
        const L = this.screenLayer, s = this.set.scale.x || 1;
        L.scale.set(1 / s, 1 / s);
        L.x = -this.set.x / s;
        L.y = -this.set.y / s;
        if (!this.gradeMul) return;
        const e = env.night, k = Math.min(1, GRADE);
        this.gradeMul.alpha = k;
        this.gradeMul.tint = rgbInt(255, lerp(248, 239, e) - 6 * Math.max(0, GRADE - 1), lerp(238, 216, e) - 14 * Math.max(0, GRADE - 1));
        this.gradeWash.alpha = (0.02 + 0.028 * e) * GRADE;
        this.vignette.alpha = Math.min(1, (0.38 + 0.34 * e) * GRADE);
        this.flashSprite.alpha = this.flash * 0.2;
    };

    // ------------------------------------------------------------------
    // The steam: what HomeLife.js (or anything) asks for; kept in the save (Tawerna.state "homeAmbience", once $gameSystem._homeAmbience)
    // ------------------------------------------------------------------
    const store = T.state.define("homeAmbience", {}, { version: 1, adopt: "_homeAmbience", owner: PLUGIN });
    function steamWanted() {
        const s = window.$gameSystem ? store() : null;
        return s && typeof s.steam === "number" ? s.steam : STEAM;
    }
    function setSteam(level) {
        if (!window.$gameSystem) return;
        const s = store();
        if (level === null || level === undefined || !isFinite(Number(level))) delete s.steam;
        else s.steam = clamp01(Number(level));
    }

    // ------------------------------------------------------------------
    // Hooks into the map's spriteset
    // ------------------------------------------------------------------
    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._home = onHome() ? new HomeFx(this) : null;
    };
    // every map frame (after the spriteset has moved everything into place)
    T.onMapUpdate(scene => {
        const ss = scene._spriteset;
        if (ss && ss._home) ss._home.update();
    }, { owner: PLUGIN, name: "fx" });

    // ------------------------------------------------------------------
    // Sounds: beds of their own beside Atmosphere.js's single BGS (fire, drips, wind, clock), each faded in and out
    // ------------------------------------------------------------------
    const ATMO = PluginManager.parameters("Atmosphere");
    const ATMO_ON = ATMO.ambience === undefined || ATMO.ambience === "" || ATMO.ambience === "true";
    const ATMO_VOL = num(ATMO.ambienceVolume, 100) / 100;
    // Atmosphere's interior bed (the muffled rain, Rain2 at 22): nothing here is ever louder. The files differ a lot (RMS measured:
    // Rain2 0.059, Fire1 0.074, Drips 0.017, Wind3 0.37, Wind5 0.17, Clock 0.03), so each bed's volume is set for its loudness:
    // at most the rain's (22 x 0.059 = 1.3) - the fire by the hearth 1.2, the storm's howl 1.3, the snow's wind 0.6, drips 0.35
    const MAX_VOL = 22;
    // (Tawerna.audio.bgsLayer: in over ~1.3 s, out ~0.9 s; the volume is the game's BGS option x this plugin's x Atmosphere's)
    const BEDS = [
        { key: "fire", name: "Fire1", pitch: 100 },
        { key: "rain", name: "Rain2", pitch: 100 },
        { key: "drips", name: "Drips", pitch: 100 },
        { key: "wind", name: "Wind3", pitch: 82 },
        { key: "snow", name: "Wind5", pitch: 90 },
        { key: "clock", name: "Clock", pitch: 100 }
    ].map(b => T.audio.bgsLayer(PLUGIN + ":" + b.key, { name: b.name, pitch: b.pitch, max: MAX_VOL, fadeIn: 80, fadeOut: 55,
        scale: () => SOUND_VOL * ATMO_VOL, owner: PLUGIN }));
    const BED = {};
    for (const b of BEDS) BED[b.key.slice(PLUGIN.length + 1)] = b;
    const sound = { mapId: 0, sources: null, lastCheck: -99 };
    function soundSources() {
        const fires = [], clocks = [];
        for (const ev of $gameMap.events()) {
            const data = ev.event();
            if (!data) continue;
            if (hasLight(data.note) && flameKind(data) === "fire") fires.push(ev);
            if (/zegar|clock/i.test(data.name || "") || T.hasTag(data.note || "", "Clock")) clocks.push(ev);
        }
        return { fires, clocks };
    }
    // the nearest one of them: its distance (tiles) and which side it is on (-1 left .. 1 right); false when there is none
    const near = { d: 0, pan: 0 };
    function nearest(list) {
        let best = null, bd = 1e9;
        for (let i = 0; i < list.length; i++) {
            const ev = list[i], d = Math.hypot(ev._realX - $gamePlayer._realX, ev._realY - $gamePlayer._realY);
            if (d < bd) { bd = d; best = ev; }
        }
        if (!best) return false;
        near.d = bd;
        near.pan = clamp01((best._realX - $gamePlayer._realX) / 14 + 0.5) * 2 - 1;
        return true;
    }
    function atmosphereRains() {   // Atmosphere.js already plays the rain on the roof: then only the drips are added here
        const A = T.api("Atmosphere");
        if (!A || !ATMO_ON) return false;
        const want = A.desiredBed ? A.desiredBed() : null, cur = A.state && A.state.bed;
        return !!((want && /^Rain/i.test(want.name)) || (cur && /^Rain/i.test(cur.name)));
    }
    function soundTargets() {
        for (let i = 0; i < BEDS.length; i++) BEDS[i].target = 0;
        if (!SOUNDS || !ATMO_ON || !onHome()) return;
        if ($gameMap.mapId() !== sound.mapId || !sound.sources) { sound.mapId = $gameMap.mapId(); sound.sources = soundSources(); }
        readEnv();
        if (nearest(sound.sources.fires)) {   // a quiet crackle, louder by the hearth, from its side
            BED.fire.target = 16 * Math.max(0.14, Math.min(1, 1.25 - near.d / 8));
            BED.fire.pan = near.pan * 0.6;
        }
        if (nearest(sound.sources.clocks)) {
            BED.clock.target = 20 * Math.max(0.25, Math.min(1, 1.2 - near.d / 7));
            BED.clock.pan = near.pan * 0.6;
        }
        if (env.rainT > 0) {
            BED.drips.target = 14 + 6 * env.rainT;
            if (!atmosphereRains()) BED.rain.target = 22;   // (only when Atmosphere.js does not play the rain on the roof)
        }
        if (env.storm > 0.08) BED.wind.target = 1.5 + 2 * env.storm;   // the howl of a storm round the house (a loud file)
        if (env.snowT > 0) BED.snow.target = 2 + 1.5 * env.snowT;
    }
    // what each bed should be now, every 10 frames (the core moves the beds toward it every frame, and stops them with every sound:
    // the title, a game over, a load, a scene's fade-out)
    T.onMapUpdate(() => {
        if (Graphics.frameCount - sound.lastCheck >= 10) { sound.lastCheck = Graphics.frameCount; soundTargets(); }
    }, { owner: PLUGIN, name: "sound" });

    // ------------------------------------------------------------------
    window.HomeAmbience = T.register(PLUGIN, {
        setSteam,
        steam: () => steamWanted(),
        isActive: onHome,
        fx: () => (SceneManager._scene && SceneManager._scene._spriteset && SceneManager._scene._spriteset._home) || null,
        env: () => env,
        palette: () => Array.from(pal),
        beds: () => BEDS.map(b => Object.assign(b.info(), { key: b.key.slice(PLUGIN.length + 1) })),
        windows: () => { const fx = window.HomeAmbience.fx(); return fx ? fx.windows.map(w => w.sample(fx)) : []; },
        fires: () => { const fx = window.HomeAmbience.fx(); return fx ? fx.fires.map(f => f.counts()) : []; },
        // tests and the F9 menu: a flash now (d: 0 close .. 1 far), the moon on (true) / off (false) / as the sky says (null)
        strike: d => { const fx = window.HomeAmbience.fx(); if (fx) fx.strike(d === undefined ? 0.1 : d); return !!fx; },
        setMoon: (on, win) => { const fx = window.HomeAmbience.fx(); if (fx) { fx.forceMoon = on; fx.forceMoonWin = win === undefined ? -1 : win; } },
        FIRE_DEFS, prepareMap, flameKind
    });
})();
