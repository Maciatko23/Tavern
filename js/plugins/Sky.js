//=============================================================================
// Sky.js
//=============================================================================
// The sun and the sky (split out of ChoppableTree_Render.js and DayNightCycle.js, 2026-10-01): one sun for everything that depends on
// it - the screen's colour (DayNightCycle.js reads Sun.sky), the dark of the night (Farming_Render.js), the shadows - the shadows'
// tools (one layer, silhouettes, the shadows from fires and lamps), the light from the side, the sun rays and the morning mist.
// Other plugins: T.api("Sun") (also window.Sky). No load-order needs past TawernaCore: its layers are made on the map's first frame.

/*:
 * @target MZ
 * @plugindesc Niebo i słońce: kolor świtu i zachodu, cienie od słońca, ognia i lamp, światło z boku, promienie słońca, poranna mgła. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Sky.js - niebo i słońce
 * ============================================================================
 * Jedno słońce dla całej gry: jego wysokość (zależna od godziny i pory roku)
 * wyznacza:
 *   - kolor ekranu (DayNightCycle.js): niebieska godzina przed wschodem,
 *     różowo-pomarańczowy wschód, złota godzina, dzień, a wieczorem złoto,
 *     pomarańcz i czerwień zachodu, fiolet, granat, noc; latem dzień dłuższy
 *     (wschód 5:00, zachód 21:00), zimą krótszy (6:45 - 18:30);
 *   - ciemność nocy (Farming_Render.js) - od zachodu, nie wcześniej;
 *   - cienie: drzewa, kamienie, krzaki (ChoppableTree_Render.js), ludzie i
 *     zwierzęta (CharacterPolish.js) rzucają swój kształt - rano długi w
 *     lewo, w południe krótki, wieczorem w prawo; o wschodzie i zachodzie
 *     ledwo widoczny, w kolorze nieba (niebieskawy); w deszczu, pod chmurą i
 *     w nocy słabnie albo znika;
 *   - cienie od ognia i lamp: ogniska i piece w nocy (Farming_Render.js),
 *     kominki, świece, lampy w środku (RoomLighting.js), błysk pioruna;
 *   - cień leży na ziemi: to, co stoi (drzewo, krzak, kamień, człowiek,
 *     zwierzę, budynek), jest rysowane nad cieniami innych rzeczy - cień
 *     przechodzący za nim chowa się za nim. Nocą przy ogniu rzecz jest
 *     oświetlona tak jak ziemia u jej stóp: gdy stoi w cudzym cieniu, cień
 *     wspina się na nią (człowiek za sosną jest ciemny, cień człowieka
 *     sięga pnia drzewa albo dołu ściany chaty, nie dachu);
 *   - światło z boku w złotej godzinie: strona od słońca cieplejsza;
 *   - promienie słońca w złotej godzinie (ukośne smugi, rano od prawej,
 *     wieczorem od lewej) i poranna mgła (nie co dzień; gęstsza po deszczu).
 * Wszystko tylko na dworze, na mapie z barwieniem pory dnia (DayNightCycle).
 *
 * Dla innych wtyczek: Tawerna.api("Sun") (też window.Sky) - now(), sky(godz,
 * dzień), sunTimes(dzień), mistOfDay(dzień), forceMist(m, dzień), raysAt,
 * mistAt, cloudCover, layer, silhouette, occluder, lightBlockers,
 * cutLightShadows, standing (rzeczy stojące na ekranie); shadows = false
 * wyłącza cienie (testy).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Sky.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");

    // ---- the sun (user 2026-09-30: shadows that follow the sun): where it is and how bright, for the shadows the game draws itself -
    // the trees (here) and the people (CharacterPolish.js), through T.api("Sun"). (It lives here until it gets a plugin of its own: the
    // plugin list cannot be changed while the editor is open.) It rises on the right of the map (the east) and sets on the left, its
    // day as long as DayNightCycle's light (dawn 5-8, dusk 19-21); higher in summer, low in winter; none under a roof.
    //   light  0 (night, under a roof, a storm) .. 1 (full sun); rain or snow leaves a pale trace
    //   dx, dy the way a shadow falls on the screen (morning: to the left, noon: down - short, as under Winlu's own objects -,
    //          evening: to the right); len: the shadow's length on the ground for an object 1 px tall
    // ---- the sky (user 2026-10-01: dawn and sunset like the real ones): ONE sun for the screen's colour (DayNightCycle.js), the dark
    // of the night (Farming_Render.js) and the shadows. Its height (elev, deg) goes on below the horizon, so the twilight follows it:
    // the blue hour before sunrise (cool, grey), the pink glow, the golden hour, the day - and back in the evening through gold, orange
    // and red, purple, blue, night. The day is longer in summer, shorter in winter.
    const SUN_DAY = [[5.5, 20.5], [5, 21], [6, 19.5], [6.75, 18.5]];   // sunrise, sunset: spring, summer, autumn, winter
    const SUN_TOP = [48, 60, 40, 24];   // the sun's height at noon (deg): spring, summer, autumn, winter
    let sunCache = null;
    function sunElev(hour, season) {
        const [rise, set] = SUN_DAY[season || 0] || SUN_DAY[0], noon = (rise + set) / 2;
        let h = hour;
        if (h < noon - 12) h += 24;
        else if (h > noon + 12) h -= 24;
        const p = Math.max(-0.5, Math.min(1.5, (h - rise) / (set - rise)));
        return { elev: (SUN_TOP[season || 0] || 48) * Math.sin(Math.PI * p), p, morning: h < noon };
    }
    // the colour of the screen (RPG Maker's tone: red, green, blue, grey) by the sun's height, morning and evening apart
    const NIGHT_TONE = [-25, -25, 0, 30];
    // (user 2026-10-01: "zero cieni, słabo to wygląda; a co z tym porannym pomarańczem klimatycznym?" - warm orange, not a flat yellow)
    const SKY_EVENING = [   // [elev, tone]
        [-10, [-25, -25, 22, 30]], [-6, [-8, -28, 28, 26]], [-3, [30, -32, 12, 16]], [0, [64, -24, -30, 6]], [3, [62, -8, -46, 0]],
        [8, [40, 6, -34, 0]], [14, [16, 4, -14, 0]], [22, [0, 0, 0, 0]]
    ];
    const SKY_MORNING = [
        [-10, [-22, -20, 26, 36]], [-6, [-15, -18, 30, 30]], [-3, [12, -20, 20, 20]], [0, [50, -14, -20, 8]], [3, [54, -6, -40, 0]],
        [8, [34, 6, -30, 0]], [14, [14, 4, -12, 0]], [22, [0, 0, 0, 0]]
    ];
    const smooth = t => t * t * (3 - 2 * t);
    function skyAt(hour, day) {
        const season = T.time.season(day), { elev, morning } = sunElev(hour, season);
        const keys = morning ? SKY_MORNING : SKY_EVENING;
        let tone = keys[keys.length - 1][1];
        if (elev <= -14) tone = NIGHT_TONE;
        else if (elev <= keys[0][0]) { const t = smooth((elev + 14) / (keys[0][0] + 14)); tone = NIGHT_TONE.map((v, j) => Math.round(v + (keys[0][1][j] - v) * t)); }
        else for (let i = 0; i < keys.length - 1; i++) {
            const [e0, a] = keys[i], [e1, b] = keys[i + 1];
            if (elev >= e0 && elev <= e1) { const t = smooth((elev - e0) / (e1 - e0)); tone = a.map((v, j) => Math.round(v + (b[j] - v) * t)); break; }
        }
        // the dark of the night: none while the sun is 3 deg up, full when it is 10 deg down (after sunset the ground dims at once,
        // while the sky still glows)
        const dark = smooth(Math.max(0, Math.min(1, (3 - elev) / 13)));
        // the golden hour (for the light from the side and the coloured shadows): strongest with the sun low over the horizon
        const golden = elev >= 5 ? Math.max(0, 1 - (elev - 5) / 17) : elev >= -1 ? 1 : Math.max(0, 1 + (elev + 1) / 6);
        return { elev, morning, tone, dark, golden, side: morning ? 1 : -1 };   // side: 1 the sun on the right (east), -1 on the left
    }
    // a lightning flash (Storm.js) is a sun for a moment: everything throws a sharp, long shadow away from the bolt, by day and by
    // night (where it lifts the dark itself). Where it struck: the "lightning" bus event (screen px; y: the bolt's end, or null)
    let lastBolt = null;
    T.on("lightning", e => { if (e && e.outdoors) lastBolt = { x: e.x, y: e.y }; }, { owner: "Sky" });
    function sunNow() {
        if (sunCache && sunCache.frame === Graphics.frameCount) return sunCache;
        const sky = skyAt(T.time.hour()), { p } = sunElev(T.time.hour(), T.time.season());
        const sun = { frame: Graphics.frameCount, light: 0, dx: 0, dy: 1, len: 0, height: 0, sky };
        const survival = T.api("Survival"), outdoors = !survival || !survival.isOutdoors || survival.isOutdoors();
        sun.outdoors = outdoors;
        if (p > 0 && p < 1 && outdoors) {
            const height = sky.elev, phi = (p - 0.5) * Math.PI * 0.92;
            sun.height = height;
            sun.dx = Math.sin(phi);
            sun.dy = Math.cos(phi);
            sun.len = Math.min(2.4, 0.6 / Math.tan((Math.max(5, height) * Math.PI) / 180));
            // at sunrise and sunset only a faint, barely visible shadow (user 2026-10-01: "w tych porach leciutki cień, ledwo widoczny"):
            // about a fifth of noon's while the sun is under ~5 deg, growing through the golden hour, full from ~22 deg
            let light = smooth(Math.min(1, height / 3)) * (0.22 + 0.78 * smooth(Math.max(0, Math.min(1, (height - 4) / 18))));
            const type = $gameScreen.weatherType(), power = $gameScreen.weatherPower();
            if (type !== "none" && power > 0) light *= 1 - 0.8 * Math.min(1, power / 5);
            const storm = T.api("Storm");
            if (storm) light *= 1 - 0.9 * storm.level();
            sun.light = light;
        }
        const storm = T.api("Storm"), flash = outdoors && lastBolt && storm && storm.flash ? storm.flash() : 0;
        if (flash > 0.02 && flash * 1.6 > sun.light) {
            // away from the bolt, from the sky above the map: over the screen from where it struck, and towards the viewer
            const vx = Graphics.width / 2 - lastBolt.x, vy = Math.max(160, Graphics.height / 2 - (lastBolt.y === null ? -Graphics.height : lastBolt.y)) / SHADOW_FLAT;
            const k = Math.hypot(vx, vy) || 1;
            Object.assign(sun, { light: Math.min(1.4, flash * 1.6), dx: vx / k, dy: vy / k, len: 1.3, flash: true });
        }
        return (sunCache = sun);
    }

    // how much a passing cloud's shadow (CloudShadows.js) covers a spot of the map (px): the sun behind it, the shadows there fade
    function cloudCover(mx, my) {
        const set = SceneManager._scene && SceneManager._scene._spriteset, clouds = set && set._cloudSprites;
        if (!clouds) return 0;
        let cover = 0;
        for (const cloud of clouds) {
            const r = (cloud._radius || 0) * 0.8, d = Math.hypot(mx - cloud._wx, my - cloud._wy);
            if (d < r) cover = Math.max(cover, (1 - d / r) * (cloud.opacity / 255) * 3);
        }
        return Math.min(1, cover);
    }

    // A shadow is its thing's own shape - a frame of its picture turned into a soft dark silhouette (made once per frame of a picture)
    // - laid on the ground from its foot the way the sun throws it: long to the left in the morning, short under it at noon, long to
    // the right in the evening, shortened up and down the screen (the ground is seen at an angle).
    // All the sun's shadows of a map lie in ONE layer (under the characters, over the things on the ground), drawn solid and made
    // see-through together (an alpha filter on the layer): where two shadows overlap - the trees of a wood, a man in a tree's shadow -
    // the ground is not darker twice, as with real shadows. Each shadow's own alpha is only what dims it alone (a cloud over it, a
    // falling tree, a fading figure).
    const SUN_SHADOW_Z = 1.8, SUN_SHADOW_ALPHA = 0.36, SHADOW_FLAT = 0.55, SHADOW_PAD = 4;
    // The layer's one filter turns every shadow in it into the colour of the sky's shade and makes them see-through together: by day a
    // dark blue-grey, at the golden hour blue-violet (a shadow is lit by the blue sky, not by the sun - user 2026-10-01). A colour
    // matrix: rgb = the shade's colour, alpha = alpha x the layer's strength (SUN_SHADOW_ALPHA x the light).
    const SHADE_DAY = [0.04, 0.05, 0.1], SHADE_GOLDEN = [0.2, 0.12, 0.42];
    function sunShadowLayer(tilemap) {
        if (tilemap._sunShadowLayer) return tilemap._sunShadowLayer;
        const layer = new Sprite();
        layer.z = SUN_SHADOW_Z;
        let filter = null;
        try { filter = new PIXI.filters.ColorMatrixFilter(); } catch (e) { filter = null; }
        if (filter) layer.filters = [filter];
        layer._shadowFilter = filter;
        layer._shadowAlpha = SUN_SHADOW_ALPHA;
        layer.update = function() {
            Sprite.prototype.update.call(this);
            const sun = sunNow(), light = sun.light;
            this.visible = SunApi.shadows && light > 0.01;
            this._shadowAlpha = SUN_SHADOW_ALPHA * light;
            const f = this._shadowFilter;
            if (f) {
                const g = sun.flash ? 0 : sun.sky.golden, c = SHADE_DAY.map((v, i) => v + (SHADE_GOLDEN[i] - v) * g);
                this._shadeColour = c;
                f.matrix = [0, 0, 0, 0, c[0], 0, 0, 0, 0, c[1], 0, 0, 0, 0, c[2], 0, 0, 0, this._shadowAlpha, 0];
            }
        };
        tilemap._sunShadowLayer = layer;
        tilemap.addChild(layer);
        return layer;
    }
    // the layer's strength for a shadow in it: 1 with the filter (the layer holds the rest), else the whole of it on the shadow
    function layerAlpha(layer) {
        return layer._shadowFilter ? 1 : SUN_SHADOW_ALPHA * sunNow().light;
    }

    // a frame of a picture as a soft dark silhouette; its foot: the lowest solid row (_footRow) and the middle of the lowest rows
    // (_footX). skipPainted: none (null) for a picture that has a ground shadow painted in (translucent dark pixels at its foot)
    const silhouetteCache = new Map();
    function silhouetteBitmap(src, sx, sy, pw, ph, skipPainted, blurPx) {
        const key = (src._url || "") + "," + sx + "," + sy + "," + pw + "," + ph + (skipPainted ? ",p" : "") + (blurPx !== undefined ? ",b" + blurPx : "");
        if (silhouetteCache.has(key)) return silhouetteCache.get(key);
        const tmp = new Bitmap(pw, ph);
        tmp.blt(src, sx, sy, pw, ph, 0, 0);
        const img = tmp.context.getImageData(0, 0, pw, ph), d = img.data;
        let painted = 0, footRow = -1;
        for (let y = 0; y < ph; y++) {
            for (let x = 0; x < pw; x++) {
                const i = (y * pw + x) * 4;
                if (y >= ph * 0.7 && d[i + 3] > 0 && d[i + 3] < 230 && d[i] + d[i + 1] + d[i + 2] < 240) painted++;
                if (d[i + 3] > 128) footRow = y;
            }
        }
        let out = null;
        if (footRow >= 0 && !(skipPainted && painted >= 15)) {
            let left = pw, right = -1;
            for (let y = Math.max(0, footRow - 5); y <= footRow; y++) {
                for (let x = 0; x < pw; x++) if (d[(y * pw + x) * 4 + 3] > 128) { left = Math.min(left, x); right = Math.max(right, x); }
            }
            for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = 0; }
            tmp.context.putImageData(img, 0, 0);
            out = new Bitmap(pw + 2 * SHADOW_PAD, ph + 2 * SHADOW_PAD);
            const ctx = out.context;
            ctx.filter = "blur(" + (blurPx !== undefined ? blurPx : ph > 80 ? 2 : 1.2) + "px)";   // a person's shadow a little sharper than a tree's
            ctx.drawImage(tmp.canvas, SHADOW_PAD, SHADOW_PAD);
            ctx.filter = "none";
            out._baseTexture.update();
            out.smooth = true;
            out._footRow = footRow;                  // in the picture's frame
            out._footX = (left + right + 1) / 2;
            out._key = key;                          // (which picture and frame: for tests)
        }
        tmp.destroy();
        silhouetteCache.set(key, out);
        return out;
    }

    // A thing standing in the light (a tree, a person): its silhouette and where it stands - fx, fy: its foot on the screen; ax: the
    // column of the frame over it; sx, sy: its own scale (sx < 0: mirrored); top: how far its top is pushed aside (a tree's sway);
    // alpha: how solid it is now. cx, cy: the foot in the silhouette's canvas. Every tree and person keeps one (sprite._occluder) each
    // frame while on screen, night or day: the sun lays its shadow from it, and the fires of the night layer (Farming_Render.js) cut
    // theirs out of their light with it.
    function makeOccluder(bmp, fx, fy, ax, sx, sy, top, alpha) {
        return { bmp, fx, fy, ax, sx, sy, top: top || 0, alpha: alpha === undefined ? 1 : alpha, cx: SHADOW_PAD + ax, cy: SHADOW_PAD + bmp._footRow + 1 };
    }
    // the matrix (a, b, c, d, tx, ty - a PIXI.Matrix or any object) that lays an occluder's silhouette on the ground: (ux, uy) the way
    // its shadow runs over the ground (a unit vector, the ground not yet shortened), len its length for 1 px of height, widen its width.
    // Local x (across the thing) goes across the shadow, local y (up it, -h at the top) along it.
    function shadowMatrix(o, ux, uy, len, widen, out) {
        const h = o.bmp._footRow + 1, L = len * h * Math.abs(o.sy), w = widen || 1;
        out.a = o.sx * uy * w;
        out.b = -SHADOW_FLAT * o.sx * ux * w;
        out.c = -(L * ux + o.top) / h;
        out.d = (-SHADOW_FLAT * L * uy) / h;
        out.tx = o.fx;
        out.ty = o.fy;
        return out;
    }
    // a much softer copy of a silhouette (made once): the far part of a shadow from a wide light - a fire - has blurred edges.
    // It is SOFT_PAD px bigger on every side: its row y is the silhouette's row y - SOFT_PAD
    const SOFT_PAD = 8;
    function softSilhouette(bmp) {
        if (bmp._soft) return bmp._soft;
        const out = new Bitmap(bmp.width + 2 * SOFT_PAD, bmp.height + 2 * SOFT_PAD), ctx = out.context;
        ctx.filter = "blur(4px)";
        ctx.drawImage(bmp.canvas, SOFT_PAD, SOFT_PAD);
        ctx.filter = "none";
        out._baseTexture.update();
        out._pad = SOFT_PAD;
        return (bmp._soft = out);
    }
    // lay the sun's shadow (a Sprite) of an occluder
    function laySunShadow(shadow, o) {
        const sun = sunNow();
        if (shadow.bitmap !== o.bmp) shadow.bitmap = o.bmp;
        shadow.anchor.set(o.cx / o.bmp.width, o.cy / o.bmp.height);
        const m = shadow._matrix || (shadow._matrix = new PIXI.Matrix());
        shadow.transform.setFromMatrix(shadowMatrix(o, sun.dx, sun.dy, sun.len, 1, m));
    }
    // every thing in the light on this map now (trees and people on screen)
    function occluders(spriteset) {
        const out = [];
        for (const s of (spriteset && spriteset._characterSprites) || []) if (s._occluder && s.visible) out.push(s._occluder);
        return out;
    }
    // ---- shadows from a light that is a flame or a lamp - the fires at night (Farming_Render's night layer), the lamps, hearths and
    // candles inside (RoomLighting.js): every thing in its light throws one away from it, cut out of the light (in a shadow it is as
    // dark as around). A light: { x, y: the flame on the screen, r: how far it lights (a circle on the screen), gx, gy: the ground
    // under it, hf: how high the flame is (px), id }. The shadow of a thing h px tall at a ground distance d: d*h/(hf-h) long, at
    // most LIGHT_SHADOW_MAX times h and LIGHT_SHADOW_REACH of the light; short close by, long further off, dark at the feet and
    // fading away along it, soft-edged further off, and it breathes with the flame. It may run past the edge of the light: there it
    // has no light left to take, so it fades out with the light.
    const LIGHT_SHADOW = 0.85;        // how much of the light a shadow takes away at the feet (it fades further off)
    const LIGHT_BANDS = 8;            // bands across a shadow: it widens and fades along them
    const FLAME_WIDTH = 90;           // (px) a flame is no point: its shadows spread gently
    const LIGHT_SHADOW_MAX = 3;       // a shadow at most this many times as long as its thing is tall
    const LIGHT_SHADOW_REACH = 0.65;  // ...and at most this share of the light's radius
    function lightBlockers(l, things, age, flick) {
        const out = [], hf = Math.max(8, (l.hf || 16) * (0.96 + 0.08 * (flick || 1)));
        const gx = l.gx + 1.2 * Math.sin((age || 0) * 0.37 + (l.id || 0)), gy = l.gy;   // the flame sways a little: so do the shadows
        for (const o of things) {
            const vx = o.fx - gx, vy = (o.fy - gy) / SHADOW_FLAT, d = Math.hypot(vx, vy);   // (d: over the ground - shortened up and down the screen)
            // in the light: its circle ON THE SCREEN, as it is drawn (user: "cień nagle znika" when it was the ground distance)
            if (d < 10 || Math.hypot(o.fx - l.x, o.fy - l.y) > l.r) continue;
            // a tall thing (a tree) no longer than LIGHT_SHADOW_REACH of the light: its crown, high over the flame, would throw its
            // shadow far into the dark and leave only a thin line of trunk near it (user: "drzewa nie rzucają cienia od ogniska")
            const h = (o.bmp._footRow + 1) * Math.abs(o.sy), cap = Math.min(LIGHT_SHADOW_MAX * h, LIGHT_SHADOW_REACH * l.r);
            const len = (h >= hf - 2 ? cap : Math.min(cap, (d * h) / (hf - h))) / h;
            // (gx, gy, hf: the flame it was thrown from - how high this shadow climbs a thing standing in it, keepOffStanding)
            out.push({ o, ux: vx / d, uy: vy / d, len, L: len * h, d, m: shadowMatrix(o, vx / d, vy / d, len, 1.1, {}), gx, gy, hf });
        }
        return out;
    }
    // cut the shadows (lightBlockers) out of a light drawn on canvas context c: k - the canvas's scale to the screen (a half-size
    // layer: 0.5), ox, oy - where the canvas's corner is (in its own px). Drawn in bands across each shadow: the further from the feet,
    // the wider (the light spreads), the fainter (the lit ground around throws light back into it) and the softer (the sharp
    // silhouette at the feet cross-fades into its blurred copy) - no dark blob at the far end, no hard wall of dark.
    // A shadow lies on the GROUND (user 2026-10-08: "jeśli cień jednego drzewa wchodzi na inne drzewo, to powinien być za tym
    // drzewem" - "i ogólnie wszystkie cienie tak"): the shadows go into a mask of their own first, the things that stand in the light
    // (stands: standing(); without it the things that throw the shadows) are taken out of it - each keeps only the shadows that
    // climb it from its foot (keepOffStanding) - and then the mask is cut out of the light
    function cutLightShadows(c, blockers, k, ox, oy, stands) {
        const W = c.canvas.width, H = c.canvas.height, m = maskCanvas(W, H);
        drawLightShadows(m, blockers, k, ox, oy);
        keepOffStanding(m, blockers, stands || blockers.map(b => standOfOccluder(b.o, spriteOf(b.o))), k, ox, oy);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
        c.globalCompositeOperation = "destination-out";
        c.drawImage(m.canvas, 0, 0);
        c.globalCompositeOperation = "source-over";
    }
    // the character sprite of an occluder (its place in the drawing order)
    function spriteOf(o) {
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        return (set && set._characterSprites && set._characterSprites.find(s => s._occluder === o)) || null;
    }
    // the shadows themselves, dark (source-over) on a mask canvas c
    function drawLightShadows(c, blockers, k, ox, oy) {
        c.globalCompositeOperation = "source-over";
        for (const b of blockers) {
            const o = b.o, sharp = o.bmp.canvas, soft = softSilhouette(o.bmp), e = soft._pad, band = Math.ceil(o.cy / LIGHT_BANDS);
            for (const pass of [0, 1]) {
                const img = pass ? soft.canvas : sharp, H = img.height, W = img.width, shift = pass ? e : 0;
                for (let top = 0; top < H; top += band) {
                    const rows = Math.min(band, H - top), y0 = top - shift;   // (y0: the band's first row in the silhouette's own rows)
                    const mid = Math.max(0, Math.min(1, (o.cy - y0 - rows / 2) / (o.cy - 1)));
                    const blur = Math.max(0, Math.min(1, (mid - 0.12) / 0.45)), share = pass ? blur : 1 - blur;
                    if (share <= 0.01) continue;
                    c.globalAlpha = LIGHT_SHADOW * o.alpha * share * Math.pow(1 - 0.65 * mid, 1.3);
                    const m = shadowMatrix(o, b.ux, b.uy, b.len, 1.05 + Math.min(0.8, (b.L * mid) / (b.d + FLAME_WIDTH)), b.m);
                    c.setTransform(m.a * k, m.b * k, m.c * k, m.d * k, m.tx * k - ox, m.ty * k - oy);
                    c.drawImage(img, 0, top, W, rows + 1, -o.cx - shift, y0 - o.cy, W, rows + 1);
                }
            }
        }
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
        c.globalCompositeOperation = "source-over";
    }
    // a scratch canvas for one light and its shadows (one per size: made once)
    const scratchCanvases = new Map();
    function scratchCanvas(w, h) {
        const key = w + "x" + h;
        let c = scratchCanvases.get(key);
        if (!c) {
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            c = canvas.getContext("2d");
            scratchCanvases.set(key, c);
        }
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalCompositeOperation = "source-over";
        c.globalAlpha = 1;
        c.clearRect(0, 0, w, h);
        return c;
    }
    // the mask of one light's shadows (one per size, made once - apart from the scratch canvases: a caller draws its light on one of
    // those while its shadows go into this)
    const maskCanvases = new Map();
    function maskCanvas(w, h) {
        const key = w + "x" + h;
        let c = maskCanvases.get(key);
        if (!c) {
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            c = canvas.getContext("2d");
            maskCanvases.set(key, c);
        }
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalCompositeOperation = "source-over";
        c.globalAlpha = 1;
        c.clearRect(0, 0, w, h);
        return c;
    }

    // ---- the things that stand (user 2026-10-08: "jeśli cień jednego drzewa wchodzi na inne drzewo, to powinien być za tym
    // drzewem" + "i ogólnie wszystkie cienie tak"). A shadow lies on the ground. A thing that stands - a tree, a bush, a rock, a
    // person, an animal, a building, a statue - is drawn over the shadows of the others: the sun's shadows lie in a layer under the
    // characters (z SUN_SHADOW_Z), but the night's dark lies over everything, so a fire's shadows are kept off what stands by hand
    // (keepOffStanding): each thing is lit by the light where it stands. A shadow that reaches its foot climbs it - as high as the line
    // from the flame over the top of the thing throwing it reaches there (a man's shadow darkens a tree's trunk, a tree's shadow
    // darkens a man whole) - a wide thing, a building, only in the columns where it crosses its foot; a shadow that only passes behind
    // it on the screen is hidden by it.
    // A stand: { img, sx, sy, sw, sh: what is drawn (a canvas or a picture, its rectangle), lx, ly: where that rectangle starts in its
    // own space, m: its own space -> the screen ({a, b, c, d, tx, ty}), x0, y0, x1, y1: its box on the screen, base: its foot line,
    // fx: the middle of its foot, h: how tall it is, z, y, id: its place in the map's drawing order (the tilemap sorts its children by
    // z, then y, then spriteId: standOrder), alpha: how solid it is drawn (a tree the hero is behind: half - what is behind shows
    // through it, with its shadows), o: its occluder or null }
    const STAND_STEP = 4;      // px: how finely a shadow is followed along a thing's foot
    const CLIMB_FADE = 10;     // px: the soft upper edge of a shadow climbing a thing
    const PERSON_LIFT = 2;     // px: a person's foot (CharacterPolish.js, SUN_SHADOW_INSET) is 2 px up inside the figure
    function finishStand(st) {
        const m = st.m, xs = [st.lx, st.lx + st.sw], ys = [st.ly, st.ly + st.sh];
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const x of xs) for (const y of ys) {
            const X = m.a * x + m.c * y + m.tx, Y = m.b * x + m.d * y + m.ty;
            x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
        }
        return Object.assign(st, { x0, x1, y0, y1, h: Math.max(1, st.base - y0) });
    }
    // a tree, a rock, a person... by its occluder: its silhouette, standing up from its foot (o.lift: how far its foot is up inside
    // the picture; o.top: how far the crown sways - the silhouette is leaned with it)
    function standOfOccluder(o, sprite) {
        const bmp = o.bmp, h = bmp._footRow + 1, lift = o.lift === undefined ? PERSON_LIFT : o.lift;
        const m = { a: o.sx, b: 0, c: -(o.top || 0) / h, d: o.sy, tx: o.fx, ty: o.fy + o.sy * lift };
        return finishStand({ img: bmp.canvas, sx: 0, sy: 0, sw: bmp.width, sh: bmp.height, lx: -o.cx, ly: -o.cy, m, o, base: o.fy, fx: o.fx,
            z: sprite ? sprite.z || 0 : 3, y: sprite ? sprite.y : o.fy, id: sprite ? sprite.spriteId || 0 : 0 });
    }
    // the map's drawing order (Tilemap._compareChildOrder): the one drawn later is in front
    function standOrder(p, q) {
        return p.z !== q.z ? p.z - q.z : p.y !== q.y ? p.y - q.y : p.id - q.id;
    }
    // any other sprite that stands (a building, a fence, a statue, a lamp...): its own picture as it is drawn (a child of the tilemap
    // or of the spriteset: screen px). frame: the picture's rectangle (default: the sprite's own frame)
    function standOfSprite(s, frame) {
        const bmp = s.bitmap, f = frame || s._frame, img = bmp && (bmp._canvas || bmp._image);
        if (!img || !bmp.isReady() || !f || f.width <= 0 || f.height <= 0) return null;
        const m = { a: s.scale.x, b: 0, c: 0, d: s.scale.y, tx: s.x, ty: s.y };
        const base = s.y + (1 - s.anchor.y) * f.height * s.scale.y - 2;
        return finishStand({ img, sx: f.x, sy: f.y, sw: f.width, sh: f.height, lx: -s.anchor.x * f.width, ly: -s.anchor.y * f.height, m, o: null,
            base, fx: s.x, z: s.z || 0, y: s.y, id: s.spriteId || 0 });
    }
    // everything that stands on the screen now: the characters (by their occluders, or their pictures - an event that stands with or
    // over the characters: not one under them, which lies on the ground) and extra sprites (Farming_Render.js: its buildings)
    // how solid a character's sprite is drawn now: its opacity and the see-through of a tree, a decorative tree or a bush the hero is
    // behind or in (ChoppableTree_Render.js)
    const seen = k => (k === undefined ? 1 : k);
    function solidOf(s) {
        return Math.max(0, Math.min(1, (s.opacity / 255) * seen(s._seeThroughK) * seen(s._decorSeeK) * seen(s._bushSeeK)));
    }
    function standing(spriteset, extra) {
        const out = [];
        for (const s of (spriteset && spriteset._characterSprites) || []) {
            if (!s.visible || !s.parent) continue;
            const o = s._occluder, c = s._character;
            if (o) {
                if (o.stand !== false) out.push(Object.assign(standOfOccluder(o, s), { alpha: solidOf(s) }));
                continue;
            }
            if ((s.z || 0) < 3 || s.opacity <= 0 || !c || (c.isTransparent && c.isTransparent()) || !s.bitmap) continue;
            if (!s._frame || s._frame.width <= 0) continue;   // (drawn by its children, or nothing: a felled tree's sprite, its stump low)
            let frame = null;
            if (!s._tileId && s._characterName && s.patternWidth) {   // (the whole figure: a bush's depth cuts the sprite's own frame)
                const pw = s.patternWidth(), ph = s.patternHeight();
                if (!(pw > 0 && ph > 0)) continue;
                frame = new Rectangle((s.characterBlockX() + s.characterPatternX()) * pw, (s.characterBlockY() + s.characterPatternY()) * ph, pw, ph);
            }
            const st = standOfSprite(s, frame);
            if (st) out.push(Object.assign(st, { wide: st.x1 - st.x0 > WIDE * st.h, alpha: solidOf(s) }));
        }
        for (const s of extra || []) {
            const st = s && s.visible && s.alpha > 0 ? standOfSprite(s) : null;
            if (st) out.push(Object.assign(st, { wide: st.x1 - st.x0 > WIDE_PX }));   // (a building: its walls, column by column)
        }
        return out;
    }
    // draw a stand on canvas c (k, ox, oy as in cutLightShadows); X0..X1, Y0..Y1: only its part inside these screen px (its columns
    // only when it is not leaned - a swaying tree is always drawn across)
    function drawStand(c, st, k, ox, oy, X0, X1, Y0, Y1) {
        const m = st.m;
        let x0 = st.lx, x1 = st.lx + st.sw, y0 = st.ly, y1 = st.ly + st.sh;
        if (X0 !== undefined && m.c === 0) {
            const p = (X0 - m.tx) / m.a, q = (X1 - m.tx) / m.a;
            x0 = Math.max(x0, Math.min(p, q));
            x1 = Math.min(x1, Math.max(p, q));
        }
        if (Y0 !== undefined) {
            const p = (Y0 - m.ty) / m.d, q = (Y1 - m.ty) / m.d;
            y0 = Math.max(y0, Math.min(p, q));
            y1 = Math.min(y1, Math.max(p, q));
        }
        if (x1 - x0 < 0.5 || y1 - y0 < 0.5) return;
        c.setTransform(m.a * k, m.b * k, m.c * k, m.d * k, m.tx * k - ox, m.ty * k - oy);
        c.drawImage(st.img, st.sx + x0 - st.lx, st.sy + y0 - st.ly, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    }
    // the alpha of a silhouette's pixels (read once per silhouette)
    function alphaOf(bmp) {
        if (bmp._alphaData) return bmp._alphaData;
        const w = bmp.width, h = bmp.height, d = bmp.context.getImageData(0, 0, w, h).data, a = new Uint8Array(w * h);
        for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
        return (bmp._alphaData = a);
    }
    function alphaAt(bmp, u, v) {
        const x = Math.round(u), y = Math.round(v);
        if (x < 0 || y < 0 || x >= bmp.width || y >= bmp.height) return 0;
        return alphaOf(bmp)[y * bmp.width + x] / 255;
    }
    // a light's shadow ready to be asked "how dark are you here": the way back from the screen to the silhouette, and its box
    function shadeOf(b) {
        const o = b.o, h = o.bmp._footRow + 1, a1 = o.sx * b.uy, b1 = -SHADOW_FLAT * o.sx * b.ux;
        const c = -(b.L * b.ux + (o.top || 0)) / h, d = (-SHADOW_FLAT * b.L * b.uy) / h, det = a1 * d - b1 * c;
        const w = 1.15 + Math.min(0.8, b.L / (b.d + FLAME_WIDTH)), W = o.bmp.width, H = o.bmp.height;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const lx of [-o.cx - SOFT_PAD, W - o.cx + SOFT_PAD]) for (const ly of [-o.cy - SOFT_PAD, H - o.cy + SOFT_PAD]) {
            const X = a1 * w * lx + c * ly + o.fx, Y = b1 * w * lx + d * ly + o.fy;
            x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
        }
        return { b, a1, b1, c, d, det, x0, x1, y0, y1 };
    }
    // how much of the light a shadow takes away at a spot of the ground (screen px): as cutLightShadows draws it - the sharp silhouette
    // near the feet, the soft one further off, wider and fainter along it
    function shadeAt(sh, X, Y) {
        if (Math.abs(sh.det) < 1e-6) return 0;
        const b = sh.b, o = b.o, x = X - o.fx, y = Y - o.fy;
        const U = (x * sh.d - sh.c * y) / sh.det, ly = (sh.a1 * y - sh.b1 * x) / sh.det;
        if (ly > 1) return 0;   // (before its foot: the shadow starts there)
        const mid = Math.max(0, Math.min(1, -ly / (o.cy - 1)));
        const lx = U / (1.05 + Math.min(0.8, (b.L * mid) / (b.d + FLAME_WIDTH)));
        const blur = Math.max(0, Math.min(1, (mid - 0.12) / 0.45));
        let a = blur < 1 ? alphaAt(o.bmp, o.cx + lx, o.cy + ly) * (1 - blur) : 0;
        if (blur > 0) a += alphaAt(softSilhouette(o.bmp), o.cx + lx + SOFT_PAD, o.cy + ly + SOFT_PAD) * blur;
        return LIGHT_SHADOW * o.alpha * a * Math.pow(1 - 0.65 * mid, 1.3);
    }
    // take the things that stand out of a light's shadow mask c (back to front: the one in front covers the one behind), each with
    // only the shadows that climb it from its foot
    function keepOffStanding(c, blockers, stands, k, ox, oy) {
        if (!stands || !stands.length) return;
        // (only what stands in the light's round: the canvas's corners are dark anyway)
        const W = c.canvas.width, H = c.canvas.height, cx = (ox + W / 2) / k, cy = (oy + H / 2) / k, R = Math.min(W, H) / (2 * k);
        const inLight = st => {
            const dx = Math.max(st.x0 - cx, 0, cx - st.x1), dy = Math.max(st.y0 - cy, 0, cy - st.y1);
            return dx * dx + dy * dy < R * R;
        };
        const list = stands.filter(st => st && inLight(st)).sort(standOrder);
        if (!list.length) return;
        const shades = blockers.map(shadeOf), dirty = shades.slice();   // (dirty: where the mask has dark - the shadows, then the climbs)
        const touches = (st, r) => st.x1 > r.x0 && st.x0 < r.x1 && st.y1 > r.y0 && st.y0 < r.y1;
        for (const st of list) {
            if (!dirty.some(r => touches(st, r))) continue;   // (no dark where it stands: nothing to take off it)
            c.globalCompositeOperation = "destination-out";
            c.globalAlpha = st.alpha === undefined ? 1 : st.alpha;
            drawStand(c, st, k, ox, oy);
            c.globalCompositeOperation = "source-over";
            let climbed = false;
            for (const sh of shades) {
                if (sh.b.o === st.o || st.base < sh.y0 || st.base > sh.y1 || st.x1 < sh.x0 || st.x0 > sh.x1) continue;
                climbed = climbStand(c, st, sh, k, ox, oy) || climbed;
            }
            if (climbed) dirty.push(st);
        }
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
        c.globalCompositeOperation = "source-over";
    }
    // a shadow climbing a thing that stands in it: as dark as on the ground at its foot; up to where the line from the flame over the
    // top of the thing throwing it reaches there (d*: the ground distances from the flame), with a soft upper edge. A tree, a man, a
    // rock, a statue is in it or not by its foot - all of it across (stripes up a crown looked like cut-outs); a wide thing (st.wide)
    // - a building, an event wider than WIDE times its height - column by column along its foot (a man's shadow on part of a wall)
    const WIDE = 1.3, WIDE_PX = 40;
    function climbStand(c, st, sh, k, ox, oy) {
        const b = sh.b, hO = (b.o.bmp._footRow + 1) * Math.abs(b.o.sy), hf = b.hf || 16;
        const dT = Math.hypot(st.fx - b.gx, (st.base - b.gy) / SHADOW_FLAT);
        if (dT <= b.d) return false;   // (nearer to the flame than what throws it: not behind it)
        const climb = Math.min(st.h + CLIMB_FADE, Math.max(0, hf + ((hO - hf) * dT) / Math.max(1, b.d)));
        if (climb < 2) return false;
        if (!st.wide) {
            const w = st.o ? 4 * Math.abs(st.o.sx) : Math.min(8, (st.x1 - st.x0) / 6);
            if (st.fx + w < sh.x0 || st.fx - w > sh.x1) return false;
            const s = (shadeAt(sh, st.fx - w, st.base) + shadeAt(sh, st.fx, st.base) + shadeAt(sh, st.fx + w, st.base)) / 3;
            if (s <= 0.02) return false;
            climbRun(c, st, st.x0 - 1, st.x1 + 1, s, climb, k, ox, oy);
            return true;
        }
        const xs = Math.max(st.x0, sh.x0), xe = Math.min(st.x1, sh.x1);
        let from = xs, run = 0, any = false;
        for (let x = xs; ; x += STAND_STEP) {
            const s = x < xe ? Math.round(shadeAt(sh, x + STAND_STEP / 2, st.base) * 12) / 12 : 0;
            if (s !== run || x >= xe) {
                if (run > 0.02) { climbRun(c, st, from, Math.min(x, xe), run, climb, k, ox, oy); any = true; }
                from = x;
                run = s;
            }
            if (x >= xe) break;
        }
        return any;
    }
    // the part of a thing between columns x0..x1 from its foot up to `climb` px, darkened by s (half of it over the soft edge)
    function climbRun(c, st, x0, x1, s, climb, k, ox, oy) {
        const top = st.base - climb;
        s *= st.alpha === undefined ? 1 : st.alpha;
        if (top - CLIMB_FADE / 2 <= st.y0) {   // (up to its top: the soft edge over it is in the air)
            c.globalAlpha = s;
            drawStand(c, st, k, ox, oy, x0, x1, st.y0 - 1, st.y1 + 1);
            return;
        }
        c.globalAlpha = s;
        drawStand(c, st, k, ox, oy, x0, x1, top + CLIMB_FADE / 2, st.y1 + 1);
        c.globalAlpha = s / 2;
        drawStand(c, st, k, ox, oy, x0, x1, top - CLIMB_FADE / 2, top + CLIMB_FADE / 2);
    }

    // a signature of what throws shadows in a light now (a layer that keeps its last picture redraws when it changes)
    function blockersKey(blockers) {
        return blockers.map(b => Math.round(b.o.fx) + "," + Math.round(b.o.fy) + "," + (b.o.bmp._key || "") + "," + b.o.alpha.toFixed(2)).join(";");
    }
    const SunApi = T.api("Sun") || T.register("Sun", { now: sunNow, shadows: true });
    Object.assign(SunApi, { now: sunNow, cloudCover, layer: sunShadowLayer, layerAlpha, silhouette: silhouetteBitmap, occluder: makeOccluder,
        matrix: shadowMatrix, lay: laySunShadow, occluders, soft: softSilhouette, FLAT: SHADOW_FLAT, sky: skyAt, elevation: sunElev, NIGHT_TONE,
        lightBlockers, cutLightShadows, scratchCanvas, blockersKey, standing, standOfSprite, standOfOccluder, keepOffStanding, drawLightShadows,
        shadeOf, shadeAt, maskCanvas, standOrder });

    // ---- the light from the side at sunrise and sunset (user 2026-10-01): the side of the screen the sun is on (the right - the east -
    // in the morning, the left in the evening) is warmer and brighter, the other side cooler and bluish, strongest at the golden hour
    // (T.api("Sun").sky). Two screen-wide gradients over the map, under the dark of the night and the interface: a warm one added
    // (ADD), a cool one laid over (MULTIPLY). Only outdoors on a tinted map.
    const SIDE_WARM = [255, 142, 60], SIDE_COOL = [170, 182, 236], SIDE_WARM_ALPHA = 0.22, SIDE_COOL_ALPHA = 0.6;
    function gradientBitmap(stops) {
        const b = new Bitmap(256, 4), ctx = b.context, g = ctx.createLinearGradient(0, 0, 256, 0);
        for (const [at, c] of stops) g.addColorStop(at, c);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 4);
        b._baseTexture.update();
        return b;
    }
    Spriteset_Map.prototype.createSideLight = function() {
        const warm = new Sprite(gradientBitmap([[0, "rgba(" + SIDE_WARM + ",1)"], [0.55, "rgba(" + SIDE_WARM + ",0.15)"], [1, "rgba(" + SIDE_WARM + ",0)"]]));
        warm.blendMode = PIXI.BLEND_MODES.ADD;
        const cool = new Sprite(gradientBitmap([[0, "rgb(255,255,255)"], [0.45, "rgb(236,238,248)"], [1, "rgb(" + SIDE_COOL + ")"]]));
        cool.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        const layer = new Sprite();
        for (const s of [cool, warm]) {
            s.anchor.set(0.5, 0.5);
            s.x = Graphics.width / 2;
            s.y = Graphics.height / 2;
            layer.addChild(s);
        }
        layer._warm = warm;
        layer._cool = cool;
        layer.visible = false;
        this._sideLight = layer;
        const night = this._nightLight;   // (under the dark of the night - Farming_Render.js -, over the map)
        if (night && night.parent === this) this.addChildAt(layer, this.getChildIndex(night));
        else this.addChild(layer);
    };
    Spriteset_Map.prototype.updateSideLight = function() {
        const Sun = T.api("Sun");
        if (!this._sideLight) {
            if (!Sun || !Sun.sky) return;
            this.createSideLight();
        }
        const layer = this._sideLight, sun = Sun.now(), sky = sun.sky;
        const g = !!$gameSystem._dayNightTinting && sun.outdoors && !sun.flash ? sky.golden * (1 - 0.8 * (window.Storm ? Storm.level() : 0)) : 0;
        layer.visible = g > 0.01;
        if (!layer.visible) return;
        // (a scale that covers the screen; mirrored: the warm side where the sun is)
        const sx = (Graphics.width / 256) * 1.02, sy = (Graphics.height / 4) * 1.02;
        for (const s of [layer._warm, layer._cool]) s.scale.set(sky.side > 0 ? -sx : sx, sy);
        layer._warm.alpha = SIDE_WARM_ALPHA * g;
        layer._cool.alpha = SIDE_COOL_ALPHA * g;
        layer._golden = g;
    };

    // ---- the golden hour's sun rays and the morning mist (user 2026-10-01: "1 i 3"): two layers over the map, under the side light
    // and the dark of the night (so they take the sky's colour and dim with it). The mist under the rays: the light shines through it.
    function hash01(a, b) {
        let h = (a * 374761393 + b * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const smooth01 = t => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };
    const lerp3 = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const rgbInt = c => (c[0] << 16) | (c[1] << 8) | c[2];
    function rainingNow() {
        const type = $gameScreen.weatherType(), power = $gameScreen.weatherPower();
        return type !== "none" && power > 0 ? Math.min(1, power / 5) : 0;
    }

    // The rays: long soft shafts of warm light slanting in from the side the sun is on (from the upper right in the morning, the
    // upper left in the evening), the lower the sun the more aslant; from sunrise until the sun is ~20 deg up, and again from ~20 deg
    // down to sunset. Each stands on a spot of the map (they scroll with it), drifts and breathes; a passing cloud's shadow over its
    // foot puts it out, rain and a storm too.
    const RAY_SPACING = { x: 4, y: 11 }, RAY_ALPHA = 0.3, RAY_MORNING = [255, 214, 168], RAY_EVENING = [255, 188, 112];
    function raysAt(hour, day) {
        const Sun = T.api("Sun");
        if (!Sun || !Sun.sky) return 0;
        const e = Sun.sky(hour, day).elev;
        return smooth01(e / 1.5) * smooth01((20 - e) / 14);
    }
    function rayBitmap() {   // soft on both sides, fading in at the top and out at the foot
        const W = 64, H = 256, bmp = new Bitmap(W, H), ctx = bmp.context, img = ctx.createImageData(W, H), edge = Math.exp(-3);
        for (let y = 0; y < H; y++) {
            const v = y / H, fy = Math.min(1, v / 0.2) * Math.pow(1 - v, 0.9);
            for (let x = 0; x < W; x++) {
                const u = ((x + 0.5) / W) * 2 - 1, fx = Math.max(0, (Math.exp(-u * u * 3) - edge) / (1 - edge));
                const i = (y * W + x) * 4;
                img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = Math.round(255 * fx * fy);
            }
        }
        ctx.putImageData(img, 0, 0);
        bmp._baseTexture.update();
        return bmp;
    }

    // The mist: wide soft banks of it low over the ground at dawn, drifting slowly with the air; it gathers in the blue hour, is
    // thickest at sunrise and is gone when the sun is ~16 deg up. Not every morning: thicker in spring and autumn, after a wet
    // evening or a rainy night much thicker, a few mornings none; in the rain only half. Bluish grey before sunrise, warm in the
    // first light. SunApi.mistOfDay(day) - how misty a morning is (0..1); $gameSystem._mistForce { day, m } (F9) sets it.
    const MIST_SEASON = [0.75, 0.45, 0.95, 0.55], MIST_ALPHA = 0.5, MIST_BLUE = [188, 200, 224], MIST_WARM = [255, 234, 212];
    function mistOfDay(day) {
        const f = $gameSystem && $gameSystem._mistForce;
        if (f && f.day === day) return f.m;
        const r = hash01(day, 7331);
        let m = r < 0.3 ? 0 : (r - 0.3) / 0.7;   // (about a third of the mornings clear)
        const S = T.api("Survival"), plan = d => (S && S.weatherPlan ? S.weatherPlan(d) : null);
        const y = plan(day - 1), t = plan(day);
        const wet = (y && y.end >= 17) || (t && t.start < 9);
        m = m * (MIST_SEASON[T.time.season(day)] || 0.6) + (wet ? 0.45 : 0);
        return Math.min(1, m);
    }
    function mistAt(hour, day) {
        const Sun = T.api("Sun");
        if (!Sun || !Sun.sky) return 0;
        const sky = Sun.sky(hour, day);
        if (!sky.morning) return 0;
        return smooth01((sky.elev + 9) / 7) * smooth01((16 - sky.elev) / 12) * mistOfDay(day === undefined ? T.time.day() : day);
    }
    function mistBitmap(seed) {   // a soft wide bank: overlapping round puffs, blurred
        const W = 256, H = 96, bmp = new Bitmap(W, H), ctx = bmp.context;
        ctx.filter = "blur(7px)";
        for (let i = 0; i < 9; i++) {
            const x = 40 + hash01(seed, i) * (W - 80), y = 38 + hash01(seed, i + 50) * 22, r = 18 + hash01(seed, i + 90) * 26;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, "rgba(255,255,255,0.55)");
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 1.6, r * 0.75, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.filter = "none";
        bmp._baseTexture.update();
        return bmp;
    }

    Spriteset_Map.prototype.createSkyFx = function() {
        this._mistLayer = new Sprite();
        this._rayLayer = new Sprite();
        this._skyFxMap = 0;
        const above = this._sideLight && this._sideLight.parent === this ? this._sideLight : this._nightLight && this._nightLight.parent === this ? this._nightLight : null;
        for (const layer of [this._mistLayer, this._rayLayer]) {   // (in this order: the mist, the rays over it, then the side light)
            layer.visible = false;
            if (above) this.addChildAt(layer, this.getChildIndex(above));
            else this.addChild(layer);
        }
    };
    // the banks and the shafts of this map (made again on another map)
    Spriteset_Map.prototype.buildSkyFx = function() {
        const mapId = $gameMap.mapId(), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        this._skyFxMap = mapId;
        for (const layer of [this._mistLayer, this._rayLayer]) layer.removeChildren();
        const rb = rayBitmap(), cols = Math.ceil($gameMap.width() / RAY_SPACING.x) + 1, rows = Math.ceil($gameMap.height() / RAY_SPACING.y) + 2;
        let n = 0;
        for (let ry = 0; ry < rows; ry++) for (let rx = 0; rx < cols; rx++) {
            const k = mapId * 1000 + n++, sh = new Sprite(rb);
            sh.anchor.set(0.5, 1);
            sh.blendMode = PIXI.BLEND_MODES.ADD;
            sh._ray = { tx: (rx + 0.1 + 0.8 * hash01(k, 1)) * RAY_SPACING.x * tw, ty: (ry + 0.3 + 0.65 * hash01(k, 2)) * RAY_SPACING.y * th,
                w: 1.3 + 2 * hash01(k, 3), len: 1.05 + 0.45 * hash01(k, 4), ph: hash01(k, 5) * 6.28, sp: 0.006 + 0.007 * hash01(k, 6),
                drift: 14 + 30 * hash01(k, 7), top: 0.55 + 0.45 * hash01(k, 8), tilt: 0.06 * (hash01(k, 9) - 0.5), on: hash01(k, 10) < 0.7 };
            this._rayLayer.addChild(sh);
        }
        const shapes = [0, 1, 2].map(i => mistBitmap(mapId * 7 + i));
        const W = $gameMap.width() * tw, H = $gameMap.height() * th;
        const count = Math.max(8, Math.min(70, Math.round((W * H) / (Graphics.width * Graphics.height) * 10)));
        for (let i = 0; i < count; i++) {
            const k = mapId * 3000 + i, b = new Sprite(shapes[i % 3]);
            b.anchor.set(0.5, 0.5);
            const sc = 2 + 1.6 * hash01(k, 3);
            b.scale.set(sc * (hash01(k, 4) < 0.5 ? -1 : 1), sc * (0.8 + 0.3 * hash01(k, 5)));
            b._mist = { wx: hash01(k, 1) * W, wy: hash01(k, 2) * H, vx: 0.12 + 0.18 * hash01(k, 6), ph: hash01(k, 7) * 6.28, base: 0.5 + 0.5 * hash01(k, 8), half: 128 * sc };
            this._mistLayer.addChild(b);
        }
    };
    Spriteset_Map.prototype.updateSkyFx = function() {
        const Sun = T.api("Sun");
        if (!this._mistLayer) {
            if (!Sun || !Sun.sky) return;
            this.createSkyFx();
        }
        const sun = Sun.now(), sky = sun.sky, hour = T.time.hour(), on = !!$gameSystem._dayNightTinting && sun.outdoors;
        const storm = window.Storm ? Storm.level() : 0, rain = rainingNow();
        const rays = on && !sun.flash ? raysAt(hour) * (1 - rain) * (1 - storm) : 0;
        const mist = on ? mistAt(hour) * (1 - 0.5 * rain) : 0;
        this._mistLayer.visible = mist > 0.005;
        this._rayLayer.visible = rays > 0.005;
        this._skyFx = { rays, mist };
        if (!this._mistLayer.visible && !this._rayLayer.visible) return;
        if (this._skyFxMap !== $gameMap.mapId()) this.buildSkyFx();
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), GW = Graphics.width, GH = Graphics.height, f = Graphics.frameCount;
        if (this._rayLayer.visible) {
            const side = sky.side, tilt = side * (0.55 + 0.4 * smooth01((12 - sky.elev) / 12)), tint = rgbInt(sky.morning ? RAY_MORNING : RAY_EVENING);
            for (const sh of this._rayLayer.children) {
                const r = sh._ray, len = GH * r.len;
                const x = $gameMap.adjustX(r.tx / tw) * tw + Math.sin(f * r.sp * 0.35 + r.ph) * r.drift, y = $gameMap.adjustY(r.ty / th) * th;
                const reach = Math.sin(Math.abs(tilt)) * len;
                sh.visible = r.on && y > -40 && y - len < GH + 40 && x > -200 - (side > 0 ? 0 : reach) && x < GW + 200 + (side > 0 ? reach : 0);
                if (!sh.visible) continue;
                sh.x = Math.round(x);
                sh.y = Math.round(y);
                sh.rotation = tilt + r.tilt;
                sh.scale.set(r.w * (0.85 + 0.15 * Math.sin(f * r.sp + r.ph * 1.7)), len / 256);
                sh.tint = tint;
                const cloud = Sun.cloudCover ? Sun.cloudCover(r.tx, r.ty) : 0;
                sh.alpha = RAY_ALPHA * rays * (1 - 0.9 * cloud) * r.top * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(f * r.sp * 0.8 + r.ph)));
            }
        }
        if (this._mistLayer.visible) {
            const W = $gameMap.width() * tw, H = $gameMap.height() * th, tint = rgbInt(lerp3(MIST_BLUE, MIST_WARM, smooth01((sky.elev + 2) / 5)));
            const wind = 1 + 3 * (window.Storm ? Storm.wind() : 0);
            for (const b of this._mistLayer.children) {
                const m = b._mist;
                m.wx += m.vx * wind;
                if (m.wx - m.half > W) m.wx -= W + 2 * m.half;   // (round the map again)
                const x = $gameMap.adjustX(m.wx / tw) * tw, y = $gameMap.adjustY(m.wy / th) * th + Math.sin(f * 0.004 + m.ph) * 10;
                b.visible = x > -m.half && x < GW + m.half && y > -m.half && y < GH + m.half;
                if (!b.visible) continue;
                b.x = Math.round(x);
                b.y = Math.round(y);
                b.tint = tint;
                b.alpha = MIST_ALPHA * mist * m.base * (0.8 + 0.2 * Math.sin(f * 0.006 + m.ph * 1.3));
            }
        }
    };

    // the hours of sunrise and sunset on a day (the sun's height crossing the horizon), for menus and tests
    function sunTimes(day) {
        const Sun = T.api("Sun");
        if (!Sun || !Sun.sky) return { rise: 6, set: 20 };
        let rise = null, set = null, last = Sun.sky(0, day).elev;
        for (let h = 0.05; h <= 24; h += 0.05) {
            const e = Sun.sky(h, day).elev;
            if (last <= 0 && e > 0 && rise === null) rise = h;
            if (last > 0 && e <= 0) set = h;
            last = e;
        }
        return { rise: rise === null ? 6 : rise, set: set === null ? 20 : set };
    }


    Object.assign(SunApi, { raysAt, mistAt, mistOfDay, sunTimes,
        forceMist: (m, day) => { $gameSystem._mistForce = { day: day === undefined ? T.time.day() : day, m }; } });
    window.Sky = SunApi;

    // the side light, the rays and the mist: on the map's every frame, after the rest of the spriteset (made on the first one)
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateSideLight();
        this.updateSkyFx();
    };
})();
