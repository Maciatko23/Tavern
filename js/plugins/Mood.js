//=============================================================================
// Mood.js
//=============================================================================
// The picture's mood (user 2026-10-12: "programowy vibe"): three effects drawn over the WORLD only - the map's spriteset - never over
// the HUD, the windows, the bubbles or the menus (they live on the scene, outside the spriteset; the game shows no pictures):
//   1. bloom - bright things (flames, lamps, sunny windows, sparks, the Heart's light) spill a soft glow: the bright pixels of the
//      finished world (after the night's dark layer, so at night only the lights are bright) taken at a quarter of the size,
//      blurred and added back (a "screen" blend); white counts less than colour (snow, a white wall, text over a head);
//   2. colour grading by the time of day, the weather and the place - saturation, contrast, a cool/warm split of the shadows and
//      the lights, a pale lift; Sky.js already gives the hue of the hour (DayNightCycle's tone), so this only shapes it;
//   3. a vignette - darker corners, more at night, in caves and below; in combat mode it breathes.
// One PIXI filter (MoodFilter) first in the spriteset's own filter list (before MZ's flash/fade filter); its apply() runs the bloom
// passes on two small render textures shared by every map (no leaks on map changes) and then one full-screen pass.
// Other plugins: T.api("Mood") (also window.Mood).

/*:
 * @target MZ
 * @plugindesc Klimat obrazu: poświata świateł, barwy zależne od pory dnia, pogody i miejsca, winieta. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Sky
 * @orderAfter Farming_Render
 *
 * @param defaultOn
 * @text Domyślnie włączone
 * @type boolean
 * @on Wł
 * @off Wył
 * @default true
 * @desc Czy efekty obrazu są włączone w nowej instalacji (gracz zmienia to w Opcjach).
 *
 * @param strength
 * @text Domyślna siła (%)
 * @type number
 * @min 0
 * @max 100
 * @default 100
 *
 * @help
 * ============================================================================
 * Mood.js - klimat obrazu
 * ============================================================================
 * Trzy efekty na świecie gry (mapa, postacie, noc, światła, pogoda) - nigdy
 * na interfejsie (zegar, cele, dymki, okna, menu):
 *
 *   POŚWIATA - jasne rzeczy rozlewają miękki blask: płomienie ognisk,
 *     pochodni i kuźni, latarnie i świece, okna ze słońcem, iskry, światło
 *     Serca w podziemiach. Nocą wyraźna, w dzień ledwo widoczna. Biel (śnieg,
 *     białe ściany, napisy) świeci słabiej niż kolor ognia. W chwili błysku
 *     pioruna gaśnie (błysk sam jest światłem).
 *
 *   BARWY - zależne od pory dnia, pogody i miejsca: świeży chłodny poranek,
 *     ciepłe popołudnie, złota godzina (chłodne cienie, ciepłe światła),
 *     chłodna niebieskawa noc, w której ogień zostaje ciepły; w deszczu i
 *     burzy przygaszone, szarawe; zimą bledsze i chłodne; w podziemiach
 *     zielonkawo-szare, w jaskini i piwnicy chłodne, w tawernie i domach
 *     ciepło-bursztynowe. Przejścia są płynne. Odcień godziny daje Sky.js
 *     (DayNightCycle) - tu tylko nasycenie, kontrast i podział tonów.
 *
 *   WINIETA - delikatnie ciemniejsze rogi; mocniej nocą, w jaskini i w
 *     podziemiach; w trybie walki lekko pulsuje.
 *
 * OPCJE (Opcje, w obu wyglądach - Grafit i Klasyczny):
 *   Efekty obrazu: Wł / Wył, Siła efektów 0-100%, Poświata, Barwy pory
 *   dnia, Winieta (każde Wł / Wył).
 *
 * NOTATKA MAPY (niekonieczna - rodzaj miejsca jest rozpoznawany sam):
 *   <Mood:outdoor> <Mood:interior> <Mood:cave> <Mood:underground>
 *   <Mood:darkforest> - las ponury jak Mroczny Las (ciemniejszy, stłumiony,
 *     chłodny, zielonkawo-sine cienie, mocna winieta także w dzień; ogień
 *     zostaje ciepły i świeci jak wszędzie),
 *   <Mood:off> - bez efektów na tej mapie.
 *   Bez tagu: piętra podziemi (Underground.js) = podziemia, Mroczny Las
 *   (mapa 12 albo mapa o tej nazwie) = ponury las, <Ambience:cave> =
 *   jaskinia, mapa pod niebem (Survival) = na dworze, reszta = wnętrze.
 *
 * Dla innych wtyczek i testów: Tawerna.api("Mood") (też window.Mood) -
 * info(), kindOf(), target(), snap(), filter(), LOOKS.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Mood.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "Mood";
    if (T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)

    const params = PluginManager.parameters(PLUGIN);
    const DEFAULT_ON = params.defaultOn !== "false";
    const DEFAULT_POWER = params.strength !== undefined && params.strength !== "" && isFinite(Number(params.strength)) ? Math.max(0, Math.min(100, Number(params.strength))) : 100;

    // ------------------------------------------------------------------
    // The options (kept in the config file): the main switch, the strength (a 0-100% slider) and each effect on its own
    // ------------------------------------------------------------------
    const OPT = { on: "moodFx", power: "moodPower", bloom: "moodBloom", grade: "moodGrade", vig: "moodVignette" };
    const DEFAULTS = { [OPT.on]: DEFAULT_ON, [OPT.power]: DEFAULT_POWER, [OPT.bloom]: true, [OPT.grade]: true, [OPT.vig]: true };
    const SWITCHES = [OPT.on, OPT.bloom, OPT.grade, OPT.vig];
    const ROWS = [["Efekty obrazu", OPT.on], ["Siła efektów", OPT.power], ["Poświata", OPT.bloom], ["Barwy pory dnia", OPT.grade], ["Winieta", OPT.vig]];
    for (const k in DEFAULTS) if (ConfigManager[k] === undefined) ConfigManager[k] = DEFAULTS[k];
    const _makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _makeData.call(this);
        for (const k in DEFAULTS) config[k] = this[k] === undefined ? DEFAULTS[k] : this[k];
        return config;
    };
    const _applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _applyData.call(this, config);
        for (const k in DEFAULTS) {
            const v = config ? config[k] : undefined;
            this[k] = v === undefined ? DEFAULTS[k] : k === OPT.power ? Math.max(0, Math.min(100, Number(v) || 0)) : !!v;
        }
    };
    const opt = k => (ConfigManager[k] === undefined ? DEFAULTS[k] : ConfigManager[k]);

    // the rows: right under "Wygląd" (CleanHUD.js) when it is there, else first; the effect rows greyed while the main switch is off
    const _addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _addGeneralOptions.call(this);
        const at = this._list.findIndex(c => c.symbol === "uiClean") + 1, main = !!opt(OPT.on);
        const rows = ROWS.map(([name, symbol]) => ({ name, symbol, enabled: symbol === OPT.on || main, ext: null }));
        this._list.splice(at, 0, ...rows);
    };
    // the strength is a slider like the volumes (OptionEx.js and MenuRing.js draw it as a bar, 5% a step, 0-100)
    const _isVolumeSymbol = Window_Options.prototype.isVolumeSymbol;
    Window_Options.prototype.isVolumeSymbol = function(symbol) {
        return symbol === OPT.power || _isVolumeSymbol.call(this, symbol);
    };
    const _statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (SWITCHES.includes(symbol)) return this.getConfigValue(symbol) ? "Wł" : "Wył";
        return _statusText.call(this, index);
    };
    const _changeValue = Window_Options.prototype.changeValue;
    Window_Options.prototype.changeValue = function(symbol, value) {
        const before = this.getConfigValue(symbol);
        _changeValue.call(this, symbol, value);
        if (symbol === OPT.on && before !== this.getConfigValue(symbol)) {   // (the effect rows grey out / come back)
            const i = this.index();
            this.refresh();
            this.select(i);
        }
    };
    const _restoreDefaults = Window_Options.prototype.restoreDefaultValues;
    if (_restoreDefaults) {
        Window_Options.prototype.restoreDefaultValues = function() {
            _restoreDefaults.call(this);
            for (const k in DEFAULTS) ConfigManager[k] = DEFAULTS[k];
        };
    }
    // the graphite look (MenuRing.js) writes "Tak" / "Nie" for every switch: these say "Wł" / "Wył" there too, in the same style.
    // Put round the row drawing only once every plugin is in (at Scene_Boot's start, or at once when put into a running page), so it
    // is the outer one wherever this plugin stands on the list.
    let drawWrapped = false;
    function wrapDrawItem() {
        if (drawWrapped) return;
        drawWrapped = true;
        const _drawItem = Window_Options.prototype.drawItem;
        Window_Options.prototype.drawItem = function(index) {
            const symbol = this.commandSymbol(index), CH = T.api("CleanHUD");
            if (SWITCHES.includes(symbol) && T.api("MenuRing") && CH && CH.isClean && CH.isClean() && CH.textOut && this.itemLineRect) {
                const r = this.itemLineRect(index, false), s = this.itemLineRect(index, true), c = this.contents, C = CH.C;
                const en = this.isCommandEnabled(index), on = !!this.getConfigValue(symbol);
                CH.textOut(c, this.commandName(index), r.x, r.y, r.width, r.height, "left", { size: 18, color: en ? C.text : C.dim, plain: true });
                CH.textOut(c, on ? "Wł" : "Wył", s.x, s.y, s.width - 4, s.height, "right", { size: 17, color: on && en ? C.accent : C.muted, plain: true });
                return;
            }
            _drawItem.call(this, index);
        };
    }
    if (window.SceneManager && SceneManager._scene && !(SceneManager._scene instanceof Scene_Boot)) wrapDrawItem();
    else {
        const _bootStart = Scene_Boot.prototype.start;
        Scene_Boot.prototype.start = function() {
            wrapDrawItem();
            _bootStart.call(this);
        };
    }

    // ------------------------------------------------------------------
    // The shaders
    // ------------------------------------------------------------------
    // one vertex shader for every pass: vTextureCoord for the filter's input (the world, in PIXI's pooled texture), vUv 0..1 over the
    // frame for our own small textures (made exactly the frame's size), vScreen 0..1 over the screen (the vignette)
    const VERT = `
attribute vec2 aVertexPosition;
uniform mat3 projectionMatrix;
uniform vec4 inputSize;
uniform vec4 outputFrame;
uniform vec2 uScreen;
varying vec2 vTextureCoord;
varying vec2 vUv;
varying vec2 vScreen;
void main(void) {
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.0)) + outputFrame.xy;
    gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aVertexPosition * (outputFrame.zw * inputSize.zw);
    vUv = aVertexPosition;
    vScreen = position / uScreen;
}`;
    // the bright pass: a 4x4 average (4 bilinear taps) of the world into a quarter-size texture, only what is over the threshold
    // (by the brightest channel - a saturated flame is bright though its luma is not), white weighed down (uBright.z), and what is
    // much brighter than the ring round it (8 taps, uLocal.z px away) counts in full - a flame, a spark, a lamp's core -, evenly lit
    // ground only by uLocal.x (else the whole pool of a torch's light would glare)
    const FRAG_BRIGHT = `
precision highp float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 inputClamp;
uniform vec2 uStep;
uniform vec3 uBright;
uniform vec3 uLocal;
vec3 tap(vec2 o) { return texture2D(uSampler, clamp(vTextureCoord + o * uStep, inputClamp.xy, inputClamp.zw)).rgb; }
float mx3(vec3 c) { return max(c.r, max(c.g, c.b)); }
void main(void) {
    vec3 c = 0.25 * (tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0)));
    float r = uLocal.z, d = r * 0.7071;
    float ring = 0.125 * (mx3(tap(vec2(r, 0.0))) + mx3(tap(vec2(-r, 0.0))) + mx3(tap(vec2(0.0, r))) + mx3(tap(vec2(0.0, -r)))
        + mx3(tap(vec2(d, d))) + mx3(tap(vec2(-d, d))) + mx3(tap(vec2(d, -d))) + mx3(tap(vec2(-d, -d))));
    float mx = mx3(c);
    float mn = min(c.r, min(c.g, c.b));
    float sat = (mx - mn) / max(mx, 0.0001);
    float local = smoothstep(0.0, uLocal.y, mx - ring);
    float k = smoothstep(uBright.x, uBright.x + uBright.y, mx) * mix(uBright.z, 1.0, sat) * mix(uLocal.x, 1.0, local);
    gl_FragColor = vec4(c * k, 1.0);
}`;
    // a separable gaussian (9 taps in 5 bilinear reads) over our small texture; uDir = one step in uv, times the spread
    const FRAG_BLUR = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSampler;
uniform vec2 uDir;
void main(void) {
    vec3 c = texture2D(uSampler, vUv).rgb * 0.2270270270;
    c += (texture2D(uSampler, vUv + uDir * 1.3846153846).rgb + texture2D(uSampler, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
    c += (texture2D(uSampler, vUv + uDir * 3.2307692308).rgb + texture2D(uSampler, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
    gl_FragColor = vec4(c, 1.0);
}`;
    // the last pass: the grading, the bloom added (screen blend: it does not burn to white), the vignette, a whisper of dither
    // (no bands in the dark gradients). uSat = (saturation in the darks, in the lights, contrast, gain); uVig = (strength, where it
    // starts 0..1, the screen's aspect, the bloom's strength); the bloom = its close core + its wide halo (uBloomMix), its colour
    // kept saturated (uBloomSat: a fire's glow stays orange, not cream) and tinted (uBloomTint: gold at the golden hour)
    const FRAG_MAIN = `
precision highp float;
varying vec2 vTextureCoord;
varying vec2 vUv;
varying vec2 vScreen;
uniform sampler2D uSampler;
uniform sampler2D uBloomTex;
uniform sampler2D uBloomWide;
uniform vec4 inputClamp;
uniform vec4 uSat;
uniform vec3 uShadow;
uniform vec3 uHigh;
uniform vec3 uLift;
uniform vec4 uVig;
uniform vec3 uVigCol;
uniform vec3 uBloomMix;
uniform vec3 uBloomTint;
uniform vec4 uSplit;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(void) {
    vec4 src = texture2D(uSampler, clamp(vTextureCoord, inputClamp.xy, inputClamp.zw));
    vec3 c = src.a > 0.0 ? src.rgb / src.a : vec3(0.0);
    float Y = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(Y), c, mix(uSat.x, uSat.y, smoothstep(uSplit.x, uSplit.y, Y)));
    c = (c - 0.42) * uSat.z + 0.42;
    c *= mix(uShadow, uHigh, smoothstep(uSplit.z, uSplit.w, Y));
    c = c + uLift * (1.0 - c);
    c = clamp(c * uSat.w, 0.0, 1.0);
    vec3 b = texture2D(uBloomTex, vUv).rgb * uBloomMix.x + texture2D(uBloomWide, vUv).rgb * uBloomMix.y;
    b = max(mix(vec3(dot(b, vec3(0.2126, 0.7152, 0.0722))), b, uBloomMix.z), 0.0) * uBloomTint * uVig.w;
    c = 1.0 - (1.0 - c) * (1.0 - clamp(b, 0.0, 1.0));
    vec2 q = (vScreen - 0.5) * vec2(uVig.z, 1.0);
    float d = length(q) / length(vec2(0.5 * uVig.z, 0.5));
    c = mix(c, uVigCol, smoothstep(uVig.y, 1.05, d) * uVig.x);
    c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(clamp(c, 0.0, 1.0) * src.a, src.a);
}`;

    // ------------------------------------------------------------------
    // The filter: one for the whole game (the spriteset of every map gets the same one: no new textures per map)
    // ------------------------------------------------------------------
    const BLOOM_RES = 0.25;            // the bloom's textures: a quarter of the screen each way
    // the blurs one after another (in steps of the small texture): the first makes the close core (kept in A), the next two the
    // wide halo (in C); a small flame gets both - a bright rim and a soft glow round it
    const BLOOM_SPREADS = [1, 2.2, 4];
    const BLOOM_CORE = 0.7, BLOOM_WIDE = 1.0;   // how much of each goes into the picture
    const LOCAL_RADIUS = 10, LOCAL_RANGE = 0.22;   // the ring round a bright spot (px) and how much brighter than it counts as a light
    let RT = null;
    function bloomTargets(w, h) {
        if (!RT || RT.w !== w || RT.h !== h) {
            if (RT) for (const k of ["a", "b", "c"]) RT[k].destroy(true);
            const o = { width: w, height: h, resolution: BLOOM_RES, scaleMode: PIXI.SCALE_MODES.LINEAR };
            RT = { w, h, a: PIXI.RenderTexture.create(o), b: PIXI.RenderTexture.create(o), c: PIXI.RenderTexture.create(o) };
            RT.pw = RT.a.baseTexture.realWidth;
            RT.ph = RT.a.baseTexture.realHeight;
        }
        return RT;
    }
    let F = null;   // { main, bright, blurs }
    function filters() {
        if (F) return F;
        const screen = () => [Graphics.width, Graphics.height];
        const main = new PIXI.Filter(VERT, FRAG_MAIN, { uScreen: screen(), uBloomTex: PIXI.Texture.WHITE, uBloomWide: PIXI.Texture.WHITE, uSat: [1, 1, 1, 1],
            uShadow: [1, 1, 1], uHigh: [1, 1, 1], uLift: [0, 0, 0], uVig: [0, 0.5, 16 / 9, 0], uVigCol: [0, 0, 0], uBloomMix: [0.7, 1, 1.3], uBloomTint: [1, 1, 1], uSplit: [0.08, 0.7, 0.04, 0.8] });
        const bright = new PIXI.Filter(VERT, FRAG_BRIGHT, { uScreen: screen(), uStep: [1 / 2048, 1 / 1024], uBright: [0.9, 0.2, 0.3], uLocal: [0.3, LOCAL_RANGE, LOCAL_RADIUS] });
        const blurs = [];
        for (let i = 0; i < BLOOM_SPREADS.length * 2; i++) blurs.push(new PIXI.Filter(VERT, FRAG_BLUR, { uScreen: screen(), uDir: [0, 0] }));
        const CLEAR = PIXI.CLEAR_MODES.CLEAR;
        main.apply = function(fm, input, output, clearMode) {
            const u = this.uniforms, f = input.filterFrame;
            u.uScreen = screen();
            if (u.uVig[3] > 0.002 && f && f.width > 8 && f.height > 8) {
                const rt = bloomTargets(Math.ceil(f.width), Math.ceil(f.height));
                rt.a.filterFrame = rt.b.filterFrame = rt.c.filterFrame = f;
                bright.uniforms.uStep = [1 / input.width, 1 / input.height];
                bright.uniforms.uScreen = u.uScreen;
                fm.applyFilter(bright, input, rt.a, CLEAR);
                const blur = (i, from, to) => {
                    const h = blurs[2 * i], v = blurs[2 * i + 1], sp = BLOOM_SPREADS[i];
                    h.uniforms.uDir = [sp / rt.pw, 0];
                    v.uniforms.uDir = [0, sp / rt.ph];
                    h.uniforms.uScreen = v.uniforms.uScreen = u.uScreen;
                    fm.applyFilter(h, from, rt.b, CLEAR);
                    fm.applyFilter(v, rt.b, to, CLEAR);
                };
                blur(0, rt.a, rt.a);   // the core
                blur(1, rt.a, rt.c);   // the halo, from the core
                blur(2, rt.c, rt.c);
                u.uBloomTex = rt.a;
                u.uBloomWide = rt.c;
                Mood.stats.bloomPasses++;
            } else u.uBloomTex = u.uBloomWide = PIXI.Texture.WHITE;   // (times 0)
            fm.applyFilter(this, input, output, clearMode);
            Mood.stats.frames++;
        };
        main._moodFilter = true;
        F = { main, bright, blurs };
        return F;
    }

    // ------------------------------------------------------------------
    // The looks: what each kind of place / time asks of the picture. Their parts:
    //   satLo, satHi  saturation in the darks / in the lights (1 = as it is)
    //   con, gain     contrast round a mid grey, brightness
    //   shadow, high  colour balance of the darks / of the lights (multiplied)
    //   lift          a pale veil lifting the darks towards a colour (haze, winter air)
    //   vig, vigIn, vigCol   the vignette: strength in the corners, where it starts (0 the centre .. 1 the corner), its colour
    //   bloom, thr, knee, white   the glow: strength, the threshold (brightest channel), how soft it starts, how much white counts
    //   split                     where the darks end and the lights begin (luma): saturation from..to, balance from..to
    //   flat                      how much evenly lit bright ground glows (1: as much as a flame brighter than what is round it)
    //   bloomSat, bloomTint       the glow's own saturation (>1: a fire's glow stays orange) and colour
    // Every look keeps the LIGHTS warm and full (a fire is a fire everywhere - user rule: every light is a flame); the place's own
    // colour (blue night, green-grey depths, cool stone) goes into the darks and the middle tones.
    // ------------------------------------------------------------------
    const NEUTRAL = { satLo: 1, satHi: 1, con: 1, gain: 1, shadow: [1, 1, 1], high: [1, 1, 1], lift: [0, 0, 0],
        vig: 0, vigIn: 0.5, vigCol: [0, 0, 0], bloom: 0, thr: 0.9, knee: 0.2, white: 0.3, flat: 0.3, bloomSat: 1.3, bloomTint: [1, 1, 1], split: [0.08, 0.7, 0.04, 0.8] };
    const look = o => Object.assign({}, NEUTRAL, o);
    const LOOKS = {
        neutral: look({}),
        // by day under the sky: barely anything - a clean picture, a light frame
        day: look({ satLo: 1.03, satHi: 1.06, con: 1.04, shadow: [0.99, 1.0, 1.03], high: [1.01, 1.01, 0.99],
            vig: 0.2, vigIn: 0.5, vigCol: [0.02, 0.03, 0.05], bloom: 0.25, thr: 0.86, knee: 0.12, white: 0.2, flat: 0.4 }),
        // a fresh, slightly cool morning
        morning: look({ satLo: 1.0, satHi: 1.04, con: 1.03, shadow: [0.96, 0.99, 1.06], high: [1.02, 1.01, 0.98], lift: [0.004, 0.008, 0.016],
            vig: 0.22, vigIn: 0.48, vigCol: [0.01, 0.02, 0.05], bloom: 0.3, thr: 0.82, knee: 0.14, white: 0.25, flat: 0.4 }),
        // a warm afternoon (before the golden hour)
        afternoon: look({ satLo: 1.05, satHi: 1.1, con: 1.05, shadow: [0.98, 0.98, 1.02], high: [1.05, 1.01, 0.93],
            vig: 0.22, vigIn: 0.48, vigCol: [0.04, 0.025, 0.02], bloom: 0.3, thr: 0.84, knee: 0.13, white: 0.22, flat: 0.4, bloomTint: [1, 0.95, 0.85] }),
        // the golden hour: cool shadows, warm gold lights, more contrast, a golden glow on what the low sun lights
        golden: look({ satLo: 1.02, satHi: 1.14, con: 1.07, gain: 1.01, shadow: [0.92, 0.95, 1.07], high: [1.08, 1.01, 0.88], lift: [0.008, 0, 0.01],
            vig: 0.32, vigIn: 0.42, vigCol: [0.06, 0.02, 0.05], bloom: 0.6, thr: 0.72, knee: 0.2, white: 0.35, flat: 0.45, bloomSat: 1.4, bloomTint: [1, 0.86, 0.6] }),
        // the night: blue in the dark, the fire stays warm, a strong glow round the flames, heavy corners
        night: look({ satLo: 0.8, satHi: 1.1, con: 1.0, gain: 1.03, shadow: [0.9, 0.97, 1.16], high: [1.06, 1.0, 0.9], lift: [0, 0.004, 0.014],
            vig: 0.48, vigIn: 0.38, vigCol: [0, 0.005, 0.025], bloom: 1.2, thr: 0.55, knee: 0.3, white: 0.4, flat: 0.12, bloomSat: 1.5 }),
        // the tavern and the houses: warm amber, candles and the fire glowing
        interior: look({ satLo: 1.02, satHi: 1.1, con: 1.04, shadow: [1.02, 0.97, 0.89], high: [1.07, 1.0, 0.88], lift: [0.008, 0.004, 0],
            vig: 0.34, vigIn: 0.42, vigCol: [0.05, 0.025, 0], bloom: 0.9, thr: 0.62, knee: 0.25, white: 0.35, flat: 0.22, bloomSat: 1.4 }),
        interiorNight: look({ satLo: 1.0, satHi: 1.1, con: 1.04, shadow: [1.0, 0.96, 0.9], high: [1.07, 1.0, 0.87], lift: [0.006, 0.003, 0],
            vig: 0.42, vigIn: 0.4, vigCol: [0.04, 0.02, 0], bloom: 1.1, thr: 0.58, knee: 0.28, white: 0.35, flat: 0.16, bloomSat: 1.5 }),
        // a cave, the cellar, the bottom of the well: cool grey stone, the fires warm and glowing
        cave: look({ satLo: 0.78, satHi: 1.08, con: 1.06, shadow: [0.93, 0.98, 1.07], high: [1.05, 1.0, 0.9], lift: [0, 0.004, 0.01],
            vig: 0.55, vigIn: 0.35, vigCol: [0, 0.01, 0.02], bloom: 1.0, thr: 0.62, knee: 0.28, white: 0.3, flat: 0.12, bloomSat: 1.5 }),
        // the floors below the castle: green-grey, damp, the heaviest corners; the fires (and the Heart) still glow
        underground: look({ satLo: 0.66, satHi: 1.05, con: 1.08, shadow: [0.9, 1.05, 0.96], high: [1.05, 1.0, 0.9], lift: [0, 0.012, 0.006],
            vig: 0.62, vigIn: 0.32, vigCol: [0, 0.02, 0.012], bloom: 1.1, thr: 0.6, knee: 0.28, white: 0.4, flat: 0.15, bloomSat: 1.4 })
    };
    const KEYS = Object.keys(NEUTRAL);
    const lerp = (a, b, t) => a + (b - a) * t;
    function mixLook(a, b, t) {
        const out = {};
        if (t <= 0) { for (const k of KEYS) out[k] = Array.isArray(a[k]) ? a[k].slice() : a[k]; return out; }
        for (const k of KEYS) out[k] = Array.isArray(a[k]) ? a[k].map((v, i) => lerp(v, b[k][i], t)) : lerp(a[k], b[k], t);
        return out;
    }
    const mix3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
    const add3 = (a, b, t) => a.map((v, i) => v + b[i] * t);
    const clamp01 = x => Math.max(0, Math.min(1, x));

    // ------------------------------------------------------------------
    // What the picture asks for now
    // ------------------------------------------------------------------
    // the kind of place: <Mood:...> in the map's note, else the floors below (Underground.js), the Dark Forest (map 12 "Mroczny
    // Las" - by its id or its name, the map itself is the user's), <Ambience:cave>, under the sky (Survival.js: <Clouds:on> /
    // <Weather:on>), a room with its own darkness (<Dark:on>), a tinted map, else a room
    const KINDS = ["outdoor", "interior", "cave", "underground", "darkforest", "off"];
    const DARK_FOREST_MAPS = [12], DARK_FOREST_NAME = /mroczn\S*\s+las/i;
    const isDarkForest = id => DARK_FOREST_MAPS.includes(id) || !!(window.$dataMapInfos && $dataMapInfos[id] && DARK_FOREST_NAME.test($dataMapInfos[id].name || ""));
    let kindCache = { map: -1, kind: "outdoor" };
    function kindOf() {
        if (!window.$dataMap || !window.$gameMap) return "outdoor";
        const id = $gameMap.mapId();
        if (kindCache.map === id && kindCache.data === $dataMap) return kindCache.kind;
        let kind = null;
        const tag = T.mapTag("Mood"), raw = tag && tag.raw ? String(tag.raw).trim().toLowerCase() : "";
        if (KINDS.includes(raw)) kind = raw;
        if (!kind) {
            const U = T.api("Underground"), amb = T.mapTag("Ambience"), a = amb && amb.raw ? String(amb.raw).trim().toLowerCase() : "";
            const S = T.api("Survival");
            if (U && U.isUnderground && U.isUnderground(id)) kind = "underground";
            else if (isDarkForest(id)) kind = "darkforest";
            else if (a === "cave") kind = "cave";
            else if (S && S.isOutdoors && S.isOutdoors()) kind = "outdoor";
            else if (a === "outdoor") kind = "outdoor";
            else if (T.mapFlag("Dark", false)) kind = "interior";
            else kind = T.mapFlag("DayNight", true) ? "outdoor" : "interior";
        }
        kindCache = { map: id, data: $dataMap, kind };
        return kind;
    }
    function weatherNow() {
        const type = $gameScreen.weatherType(), power = $gameScreen.weatherPower();
        const S = T.api("Storm");
        return {
            rain: (type === "rain" || type === "storm") && power > 0 ? clamp01(power / 5) : 0,
            snow: type === "snow" && power > 0 ? clamp01(power / 5) : 0,
            storm: S && S.level ? clamp01(S.level()) : 0,
            flash: S && S.flash ? clamp01(S.flash()) : 0
        };
    }
    function skyNow() {
        const Sun = T.api("Sun");
        return Sun && Sun.sky ? Sun.sky(T.time.hour()) : { elev: 40, dark: 0, golden: 0, morning: true };
    }
    // the Dark Forest (user 2026-10-12: "robimy"): the wood's own gloom laid over the hour's outdoor look - darker, more muted and
    // colder in the darks and the middle tones, green-livid shadows, heavy corners also by day. The lights stay warm (every light is
    // a flame) and a fire / a torch glows as anywhere. Less of it at night, where the night's dark layer already does most.
    // By day the split moves up: the sunlit leaves and grass are the wood's middle tones, not lights (else they warmed up); at
    // night it is the usual one, so the ground a torch lights stays warm.
    const DARK_FOREST = { shadow: [0.6, 0.74, 0.8], high: [1.05, 1.0, 0.9], lift: [0.004, 0.014, 0.022], vigCol: [0, 0.018, 0.022],
        split: [0.3, 0.92, 0.3, 0.95] };
    function darkForest(P, dark) {
        const k = 1 - 0.45 * dark;
        P.split = mix3(P.split, DARK_FOREST.split, 1 - dark);
        P.satLo *= 1 - 0.42 * k; P.satHi *= 1 - 0.1 * k;
        P.con *= 1 + 0.06 * k;
        P.gain *= 1 - 0.06 * k;
        P.shadow = P.shadow.map((v, i) => v * lerp(1, DARK_FOREST.shadow[i], k));
        P.high = mix3(P.high, DARK_FOREST.high, 0.4);
        P.lift = add3(P.lift, DARK_FOREST.lift, k);
        P.vig = Math.max(P.vig + 0.22, 0.48); P.vigIn = Math.min(P.vigIn, 0.32);
        P.vigCol = mix3(P.vigCol, DARK_FOREST.vigCol, 0.7);
        P.bloom = Math.max(P.bloom, 0.5); P.thr = Math.min(P.thr, 0.78); P.flat = Math.min(P.flat, 0.2);
    }
    // the look before the options (strength, the effects on / off)
    function target() {
        const kind = kindOf(), sky = skyNow(), dark = clamp01(sky.dark);
        let P;
        if (kind === "off") return { kind, look: mixLook(LOOKS.neutral, LOOKS.neutral, 0) };
        if (kind === "outdoor" || kind === "darkforest") {
            // the sun's way through its day (0 sunrise .. 0.5 noon .. 1 sunset): the fresh morning fades out by 0.35, the warm
            // afternoon comes in from 0.55 (none at noon in any season - no step there)
            const Sun = T.api("Sun"), p = Sun && Sun.elevation ? Sun.elevation(T.time.hour(), T.time.season()).p : 0.5;
            P = mixLook(LOOKS.day, LOOKS.morning, clamp01(1 - p / 0.35));
            P = mixLook(P, LOOKS.afternoon, clamp01((p - 0.55) / 0.3));
            P = mixLook(P, LOOKS.golden, clamp01(sky.golden) * (1 - dark));
            P = mixLook(P, LOOKS.night, dark);
            const w = weatherNow(), winter = T.time.season() === 3 ? 1 : Math.max(0, w.snow * 0.6), day = 1 - dark;
            // rain: grey, flat, a cool haze; a storm darker, more contrast, heavy corners
            const r = Math.max(w.rain, w.storm * 0.8), L = w.storm;
            if (r > 0) {
                P.satLo *= 1 - 0.32 * r; P.satHi *= 1 - 0.28 * r; P.con *= 1 - 0.05 * r;
                P.lift = add3(P.lift, [0.018, 0.022, 0.03], r * day);
                P.shadow = mix3(P.shadow, [0.96, 0.99, 1.05], 0.6 * r); P.high = mix3(P.high, [0.98, 1.0, 1.02], 0.6 * r);
                P.bloom *= 1 - 0.5 * r; P.vig += 0.06 * r;
            }
            if (L > 0) {
                P.satLo *= 1 - 0.15 * L; P.satHi *= 1 - 0.12 * L; P.con *= 1 + 0.07 * L; P.vig += 0.14 * L;
                P.vigCol = mix3(P.vigCol, [0, 0.01, 0.03], L);
            }
            // winter: paler and cooler; snow does not glow
            if (winter > 0) {
                P.satLo *= 1 - 0.26 * winter; P.satHi *= 1 - 0.18 * winter;
                P.lift = add3(P.lift, [0.024, 0.032, 0.046], winter * day);
                P.shadow = mix3(P.shadow, [0.95, 0.99, 1.08], 0.6 * winter); P.high = mix3(P.high, [0.99, 1.0, 1.03], 0.5 * winter);
                P.thr += 0.06 * winter * day; P.white *= 1 - 0.5 * winter;
            }
            if (kind === "darkforest") darkForest(P, dark);
            // a lightning flash is a light of its own: no glow on it, the corners lit too
            if (w.flash > 0) { P.bloom *= 1 - w.flash; P.vig *= 1 - 0.6 * w.flash; }
        } else if (kind === "interior") P = mixLook(LOOKS.interior, LOOKS.interiorNight, dark);
        else P = mixLook(LOOKS[kind] || LOOKS.neutral, LOOKS.neutral, 0);
        return { kind, look: P };
    }
    // the options on a look: the strength (0..1) towards the neutral one, an effect off = its part neutral
    function withOptions(P) {
        const s = clamp01(Number(opt(OPT.power)) / 100), out = mixLook(LOOKS.neutral, P, opt(OPT.grade) ? s : 0);
        out.bloom = opt(OPT.bloom) ? P.bloom * s : 0;
        out.thr = P.thr; out.knee = P.knee; out.white = P.white; out.flat = P.flat; out.bloomSat = P.bloomSat; out.bloomTint = P.bloomTint.slice(); out.split = P.split.slice();
        out.vig = opt(OPT.vig) ? P.vig * s : 0;
        out.vigIn = P.vigIn; out.vigCol = P.vigCol.slice();
        return out;
    }
    const combatOn = () => !!T.call("Combat", "combatMode");
    const isOn = () => !!opt(OPT.on) && Number(opt(OPT.power)) > 0;

    // ------------------------------------------------------------------
    // On the map: the filter first in the spriteset's own list (the world only), the look eased towards what is asked
    // ------------------------------------------------------------------
    const EASE = 0.05;   // per frame: about half the way in 13 frames - the weather and the hour move slowly anyway
    const PULSE = 84;    // the combat vignette breathes once in 84 frames (1.4 s)
    Spriteset_Map.prototype.updateMood = function() {
        const f = filters().main;
        if (!this.filters) this.filters = [];
        if (this.filters[0] !== f) this.filters = [f].concat(this.filters.filter(x => x !== f));
        const on = isOn();
        const t = on ? target() : null;
        const want = on && t.kind !== "off" ? withOptions(t.look) : null;
        if (!want) {
            f.enabled = false;
            this._moodCur = null;
            this._mood = { on: false, kind: t ? t.kind : kindOf() };
            return;
        }
        const first = !this._moodCur;
        this._moodCur = first ? mixLook(want, want, 0) : mixLook(this._moodCur, want, EASE);
        this._moodCombat = lerp(this._moodCombat || 0, combatOn() ? 1 : 0, first ? 1 : 0.06);
        const P = this._moodCur, cb = this._moodCombat * (opt(OPT.vig) ? clamp01(Number(opt(OPT.power)) / 100) : 0);
        const pulse = 0.5 + 0.5 * Math.sin((Graphics.frameCount / PULSE) * Math.PI * 2);
        const vig = Math.min(0.85, P.vig + cb * (0.1 + 0.06 * pulse));
        const vigCol = mix3(P.vigCol, [0.09, 0.0, 0.0], cb * 0.45);
        const off1 = v => Math.abs(v - 1) > 0.002;
        const gradeOn = off1(P.satLo) || off1(P.satHi) || off1(P.con) || off1(P.gain) || P.lift.some(v => v > 0.001) || P.shadow.some(off1) || P.high.some(off1);
        f.enabled = gradeOn || vig > 0.003 || P.bloom > 0.003;
        const u = f.uniforms;
        u.uSat = [P.satLo, P.satHi, P.con, P.gain];
        u.uShadow = P.shadow.slice();
        u.uHigh = P.high.slice();
        u.uLift = P.lift.slice();
        u.uVig = [vig, P.vigIn, Graphics.width / Graphics.height, P.bloom];
        u.uVigCol = vigCol;
        u.uBloomMix = [BLOOM_CORE, BLOOM_WIDE, P.bloomSat];
        u.uBloomTint = P.bloomTint.slice();
        u.uSplit = P.split.slice();
        F.bright.uniforms.uBright = [P.thr, P.knee, P.white];
        F.bright.uniforms.uLocal = [P.flat, LOCAL_RANGE, LOCAL_RADIUS];
        this._mood = { on: true, kind: t.kind, vig, pulse, combat: this._moodCombat, bloom: P.bloom };
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateMood();
    };

    // ------------------------------------------------------------------
    // For other plugins and the tests
    // ------------------------------------------------------------------
    const set = () => (SceneManager._scene instanceof Scene_Map ? SceneManager._scene._spriteset : null);
    const Mood = {
        OPT, LOOKS, NEUTRAL, KINDS, BLOOM_RES, BLOOM_SPREADS, DARK_FOREST, isDarkForest,
        stats: { frames: 0, bloomPasses: 0 },
        kindOf,
        target: () => target(),
        wanted: () => (isOn() ? withOptions(target().look) : null),
        isOn,
        filter: () => filters().main,
        // the look now (eased) and what it is made of
        info() {
            const s = set(), f = F && F.main;
            return { on: isOn(), kind: kindOf(), state: s ? s._mood || null : null, cur: s && s._moodCur ? JSON.parse(JSON.stringify(s._moodCur)) : null,
                enabled: !!(f && f.enabled), inSpriteset: !!(s && f && s.filters && s.filters[0] === f),
                options: Object.fromEntries(Object.values(OPT).map(k => [k, opt(k)])) };
        },
        // the look jumps to what is asked now (screenshots, tests)
        snap() { const s = set(); if (s) { s._moodCur = null; s.updateMood(); } return !!s; },
        // the map's kind read again (after its note was changed in memory)
        refresh() { kindCache = { map: -1, kind: "outdoor" }; return kindOf(); },
        setOption(key, value) { const k = OPT[key] || key; ConfigManager[k] = value; return opt(k); }
    };
    window.Mood = T.register(PLUGIN, Mood);
})();
