//=============================================================================
// Wydajnosc.js
//=============================================================================
// The speed of the map on an average computer (2026-10-24, the player: "ma być super wydajnie na średnim kompie"; docs/WYDAJNOSC.md).
// What the engine does on every frame for nothing, done less - the picture and the game exactly as before:
//   - Sprite.update / Tilemap.update: a plain picture (no update of its own, no children) is not called - a tree is 25-40 strips,
//     the grass layer 2000 tufts, the shadow layer hundreds of shadows: thousands of empty calls a frame;
//   - the map scene's own filters (the fade, the screen's tone, the flash, Mood's colour grade) work over the whole screen: without
//     a filter area PIXI measured the bounds of every sprite on the map on every frame to find that it is the whole screen;
//   - a character sprite wholly off what is being drawn (the screen, with a wide margin) is not drawn - it is still updated as
//     always (its place, its look, its shadow's shape for the fires at night), only its quad is not sent to the graphics card;
//   - "is it an item / a weapon / an armour / a skill" (every count of a thing in the bag): yes at once for a database object that
//     stands at its own id, instead of a search through the whole list.
//   - (stage 2, the player agreed) a map event far off the screen updated every 4th frame (lazy); MZ's colour filters at rest switched
//     off (idleFilters: ±1/255 rounding); people's outlines drawn as a picture under them, not a filter of their own (outline:
//     CharacterPolish.js); the night's layer drawn every other frame while nothing moves (night: Farming_Render.js).
// The culls of the other plugins (the trees' strips and shadows, the people's shadows: ChoppableTree_Render.js, Sky.js,
// CharacterPolish.js) ask Tawerna.view.sees (TawernaCore.js) - wrapped here so that opts.cull switches them all.
// Other plugins: Tawerna.api("Wydajnosc") (also window.Wydajnosc) - opts { leaf, filterArea, cull, lazy, idleFilters, outline,
// night } (true: on; the tests switch them off to compare the picture), stats { culled, lazy } (the last frame), settleFilters(root).

/*:
 * @target MZ
 * @plugindesc Wydajność mapy: mniej pustej pracy silnika co klatkę (puste aktualizacje, granice filtrów, postacie poza ekranem); Opcje - Jakość grafiki (Automatycznie / Wysoka / Średnia / Niska). v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Wydajnosc.js - wydajność mapy na średnim komputerze
 * ============================================================================
 * Gra wygląda i działa tak samo - silnik robi tylko mniej pustej pracy:
 *   - obrazki bez własnej aktualizacji i bez dzieci (paski drzew, kępki
 *     trawy, cienie) nie są wołane co klatkę;
 *   - filtry sceny mapy (ściemnianie, ton ekranu, błysk, Mood) mają pole
 *     całego ekranu - silnik nie mierzy co klatkę granic wszystkich
 *     obrazków na mapie;
 *   - postać / zdarzenie całe poza ekranem (z dużym zapasem) nie jest
 *     rysowane (dalej jest aktualizowane jak zawsze);
 *   - „czy to przedmiot / broń / zbroja / umiejętność” (każde liczenie
 *     rzeczy w torbie) od razu dla obiektu z bazy na swoim miejscu.
 * Odcinanie tego, czego nie widać (paski drzew, cienie) w innych wtyczkach
 * pyta Tawerna.view.sees - opts.cull wyłącza je wszystkie naraz.
 * Etap 2 (zgoda gracza): zdarzenia daleko poza ekranem odświeżane co 4.
 * klatkę, filtry kolorów MZ w spoczynku wyłączone (±1/255), kontur postaci
 * jako obrazek pod nią (bez filtra na osobę), warstwa nocy co drugą klatkę,
 * gdy nic się nie rusza.
 * Liczby przed i po, zalecenia: docs/WYDAJNOSC.md. Test: tests/wydajnosc_test.js.
 * Dla innych wtyczek: Tawerna.api("Wydajnosc") - opts (leaf, filterArea, cull,
 * lazy, idleFilters, outline, night: true/false), stats, settleFilters.
 *
 * JAKOŚĆ GRAFIKI (Opcje, pod „Wygląd”; zapis w ustawieniach, działa od razu):
 *   Automatycznie (domyślnie) - gra mierzy czas klatki i schodzi o poziom
 *     niżej, gdy przez kilka sekund nie trzyma ~55 kl/s; wyżej wraca dopiero
 *     po zmianie mapy, gdy jest zapas; poziom, który dwa razy nie utrzymał
 *     się na tej samej mapie, nie jest już w tej sesji próbowany (bez migania).
 *   Wysoka - wszystko jak dotąd.
 *   Średnia - bez poświaty (Mood); trawa, deszcz, liście burzy, ptaki i motyle
 *     o połowę rzadsze; noc rysowana w 1/3 ekranu; dalekie zdarzenia co 8. klatkę.
 *   Niska - bez barw nastroju, bez trawy, bez cieni słońca od kamieni, krzaków
 *     i pieńków, bez cieni od ognia nocą, bez promieni słońca i mgły; minimum
 *     cząsteczek; noc w 1/4 ekranu. Światła ognia zostają zawsze.
 * Dla innych wtyczek: Tawerna.api("Wydajnosc").gfx (mood, bloom, particles,
 * grass, critters, lazyEvery, smallShadows, fireShadows, nightScale, skyFx,
 * level, setting, version) i .quality (get, level, set, note, auto).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Wydajnosc.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "Wydajnosc";
    const opts = { leaf: true, filterArea: true, cull: true, idleFilters: true, lazy: true, night: true, outline: true };
    const stats = { culled: 0, frame: -1, drawing: -1, lazy: 0, lazyFrame: -1 };

    // ---- the empty updates: MZ's Sprite.update calls update() on every child; a plain Sprite's update only does the same for its
    // own children - with none it does nothing. Such a child is passed over (the same children, in the same order, as before: the
    // list is read live, so a child that removes itself or another during its update is met the same way as by MZ's for...of)
    const SpriteUpdate = function() {
        const list = this.children;
        if (!opts.leaf) { for (const child of list) if (child.update) child.update(); return; }
        for (let i = 0; i < list.length; i++) {
            const child = list[i];
            if (child.update === SpriteUpdate && child.children.length === 0) continue;   // (a plain picture: nothing to do)
            if (child.update) child.update();
        }
    };
    Sprite.prototype.update = SpriteUpdate;
    Tilemap.prototype.update = function() {
        this.animationCount++;
        this.animationFrame = Math.floor(this.animationCount / 30);
        SpriteUpdate.call(this);
    };

    // ---- the filters' area: the map scene (its fade), its spriteset (the flash, the brightness; Mood's grade) and the spriteset's
    // base (the screen's tone) always cover the whole screen - a black screen sprite lies in the base, as big as the world - so PIXI
    // fitted the bounds it measured (every sprite of the map, every frame) to the screen anyway. The screen given at once.
    const screenArea = () => (Graphics._app && Graphics._app.renderer && Graphics._app.renderer.screen) || null;
    function setArea(o, area) {
        if (!o) return;
        const want = opts.filterArea ? area : null;
        if (o.filterArea !== want && (o._wyArea || !o.filterArea)) { o.filterArea = want; o._wyArea = !!want; }   // (never one another plugin set)
    }
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        const area = screenArea(), set = this._spriteset;
        if (!area) return;
        setArea(this, area);
        if (set) { setArea(set, area); setArea(set._baseSprite, area); }
    };

    // ---- a character off the screen is not drawn. At the time of drawing its world matrix is the one of this frame; the target is the
    // screen - or the filter's texture of the screen, or a snapshot of it - whose part of the world is renderer.renderTexture.sourceFrame.
    // Its box: the frame round its anchor (a tree's frame is 0 px wide - its strips draw it: the height both ways), CULL_PAD round it
    // for what it carries (a marker over the head, a crown swaying, a bubble). Never the hero and his followers.
    const CULL_PAD = 160;
    const _render = Sprite_Character.prototype.render;
    Sprite_Character.prototype.render = function(renderer) {
        if (opts.cull && this.visible && this.renderable && this.worldAlpha > 0 && offTarget(this, renderer)) {
            const drawing = renderer.textureGC ? renderer.textureGC.count : Graphics.frameCount;   // (PIXI counts its drawings there)
            if (stats.drawing !== drawing) { stats.drawing = drawing; stats.culled = 0; }
            stats.frame = Graphics.frameCount;
            stats.culled++;
            return;
        }
        _render.call(this, renderer);
    };
    function offTarget(sprite, renderer) {
        const c = sprite._character;
        if (!c || c === $gamePlayer || (typeof Game_Follower !== "undefined" && c instanceof Game_Follower)) return false;
        const rt = renderer.renderTexture, f = rt && rt.sourceFrame, wt = sprite.worldTransform, fr = sprite._frame;
        if (!f || !(f.width > 0) || !fr || wt.b !== 0 || wt.c !== 0) return false;   // (turned or skewed: drawn as always)
        const size = Math.max(fr.width, fr.height), kx = Math.abs(wt.a), ky = Math.abs(wt.d);
        const hx = size * kx + CULL_PAD, hy = size * ky + CULL_PAD;
        return wt.tx + hx < f.x || wt.tx - hx > f.x + f.width || wt.ty + hy < f.y || wt.ty - hy > f.y + f.height;
    }

    // ---- the culls of the other plugins ask Tawerna.view.sees (the trees' strips, the shadows - ChoppableTree_Render.js, Sky.js,
    // CharacterPolish.js): opts.cull false - everything counts as on the screen (the tests compare the picture both ways)
    const _sees = T.view && T.view.sees;
    if (_sees) T.view.sees = function(x0, y0, x1, y1) { return !opts.cull || _sees(x0, y0, x1, y1); };

    // ---- "is it an item / a weapon / an armour / a skill": MZ looks for the object in the whole database list ($dataItems.includes)
    // on every count of a thing in the bag - the clothes and the gear (Equipment.js) count every wearable thing several times a frame.
    // An object that stands at its own id in the list is in it: yes at once; anything else is asked as before (the same answers).
    const fastIs = (orig, list) => function(item) {
        const data = list();
        if (item && data && data[item.id] === item) return true;
        return orig.call(this, item);
    };
    DataManager.isItem = fastIs(DataManager.isItem, () => window.$dataItems);
    DataManager.isWeapon = fastIs(DataManager.isWeapon, () => window.$dataWeapons);
    DataManager.isArmor = fastIs(DataManager.isArmor, () => window.$dataArmors);
    DataManager.isSkill = fastIs(DataManager.isSkill, () => window.$dataSkills);

    // ---- far off the screen, a map event's sprite is updated every 4th frame (the player agreed, 2026-10-24): beyond the margin round
    // the screen (below) nothing of it shows - not its shadow, not its shape in a light - and the game itself (the events' pages,
    // moves, timers) runs in Game_Map.update, not here. Only plain map events (Game_Event): never the hero, his followers,
    // the animals, the dog, men, creatures, the eagle (their own classes); never a tree falling or burning, a rock breaking, the town's
    // statue with its cap (TownQuests: its fall is counted in the sprite). Its place is asked of the event (where it is this frame),
    // so it is updated every frame again as soon as it comes near. A sprite's first two updates are always made.
    // By day the margin is the sun's shadow's reach (its length now, for the thing's height) and a little more; at night, in a dark
    // room, under a lightning flash the lights' reach (FAR_PAD: past any fire's, lamp's, torch's - the things' shapes for the shadows
    // of the lights are kept by the sprites)
    // (the graphics' quality - below: every LAZY_EVERY-th frame at "Wysoka", gfx.lazyEvery at a lower one; with no shadows from the
    // fires at night - "Niska" - nothing far needs its shape for them: the day's margin then)
    const FAR_PAD = 512, DAY_PAD = 128, LAZY_EVERY = 4;
    let padMemo = { f: -1, night: true, len: 2.4 };
    function padNow() {
        if (padMemo.f === Graphics.frameCount) return padMemo;
        const set = SceneManager._scene && SceneManager._scene._spriteset, Sun = T.api("Sun"), sun = Sun && Sun.now ? Sun.now() : null;
        const night = !sun || !!sun.flash || !set || !!set._darknessSprite || !!(set._nightLight && set._nightLight.visible);
        padMemo = { f: Graphics.frameCount, night: night && (gfx.fireShadows || !!set && !!set._darknessSprite), len: sun && sun.light > 0.01 ? sun.len : 0 };
        return padMemo;
    }
    function farAway(sprite, c) {
        const r = T.view.rect && T.view.rect();
        if (!r) return false;
        const fr = sprite._frame, size = fr ? Math.max(fr.width, fr.height) : 0, x = c.screenX(), y = c.screenY(), P = padNow();
        const pad = (P.night ? FAR_PAD : DAY_PAD + 1.2 * P.len * size) + size;
        return x + pad < r.x0 || x - pad > r.x1 || y + pad < r.y0 || y - pad - size > r.y1;
    }
    function lazyNow(sprite) {
        const c = sprite._character;
        if (!(c instanceof Game_Event) || (sprite._wySeen = (sprite._wySeen || 0) + 1) <= 2) return false;
        if (((Graphics.frameCount + sprite.spriteId) % gfx.lazyEvery) === 0) return false;   // (its turn: spread over the frames)
        if (c._treeFallT >= 0 || c._breakT >= 0 || sprite._emberSpots || sprite._emberGlow || sprite._tqCap) return false;
        return farAway(sprite, c);
    }
    // put round the whole update when a map's sprites are made - outside every plugin's own hook on it (each once: one put round a
    // hook added later goes outside that one too, and both decide alike)
    function installLazy() {
        const cur = Sprite_Character.prototype.update;
        if (cur._wyLazy) return;
        const lazy = function() {
            if (opts.lazy && lazyNow(this)) {
                if (stats.lazyFrame !== Graphics.frameCount) { stats.lazyFrame = Graphics.frameCount; stats.lazy = 0; }
                stats.lazy++;
                return;
            }
            cur.call(this);
        };
        lazy._wyLazy = true;
        Sprite_Character.prototype.update = lazy;
    }
    const _createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        installLazy();
        _createCharacters.call(this);
    };

    // ---- MZ's colour filter (the screen's tone, the flash, the fade, a sprite's hue / tone / blend colour) at rest - no hue, no tone,
    // no blend colour, full brightness - is switched off: it was a whole pass over what it covers that changes nothing but a
    // rounding (the colour through HSL and back: ±1/255 - the player agreed, 2026-10-24). A sprite once flashed (a tree hit, a rock)
    // kept its filter on for good. It switches on again with the first value that does something.
    const atRest = u => u.hue === 0 && u.brightness === 255 && u.blendColor[3] === 0 &&
        u.colorTone[0] === 0 && u.colorTone[1] === 0 && u.colorTone[2] === 0 && u.colorTone[3] === 0;
    function settle(f) { f.enabled = !(opts.idleFilters && atRest(f.uniforms)); }
    for (const name of ["initialize", "setHue", "setColorTone", "setBlendColor", "setBrightness"]) {
        const orig = ColorFilter.prototype[name];
        ColorFilter.prototype[name] = function() { orig.apply(this, arguments); settle(this); };
    }

    // every colour filter under a display object settled again (after opts.idleFilters was switched: the tests)
    function settleFilters(root) {
        let n = 0;
        const walk = o => {
            for (const f of o.filters || []) if (f instanceof ColorFilter) { settle(f); n++; }
            for (const c of o.children || []) walk(c);
        };
        if (root) walk(root);
        return n;
    }

    // ==================================================================
    // The graphics' quality (2026-10-24, the player: "Jakość grafiki" in Opcje, for weaker computers; docs/WYDAJNOSC.md, section
    // "Jakość grafiki"). One setting (ConfigManager.gfxQuality): 0 Automatycznie (the default), 1 Wysoka, 2 Średnia, 3 Niska.
    // Wysoka is the picture as it was; Średnia lighter effects without changing the game's character; Niska the fastest.
    // The other plugins read `gfx` (one object for the whole game, changed in place: Tawerna.api("Wydajnosc").gfx) - each field is
    // what Wysoka has unless the level says otherwise:
    //   mood         Mood.js's colour grade and vignette (false: none)       bloom        Mood.js's glow round the lights
    //   particles    the share of the weather's drops / flakes (MZ's Weather, here) and of a storm's flying leaves (Storm.js)
    //   grass        the share of the tufts on the meadows (GroundDetail.js; 0: no tufts and no patches)
    //   critters     the share of the birds of a flyover or of a flock on the ground (Birds.js - never a raid on the crops) and of the
    //                butterflies and moths at once (Motyle.js)
    //   lazyEvery    a map event far off the screen updated every n-th frame (above)
    //   smallShadows the sun's shadows of the rocks, the bushes and the stumps (ChoppableTree_Render.js; the trees' and the people's stay)
    //   fireShadows  the things' shadows in the light of the fires at night outdoors (Farming_Render.js; the fires' light itself stays -
    //                "every light is a fire"); the lamps and the hearths in a room keep theirs (RoomLighting.js)
    //   nightScale   the night's layer drawn at 1/n of the screen (Farming_Render.js: 2 as before)
    //   skyFx        the golden hour's sun rays and the morning mist (Sky.js)
    // `version` goes up with every change of the level (GroundDetail lays its tufts again, the night its layer).
    // ==================================================================
    const QUALITY = ["auto", "high", "medium", "low"];
    const QUALITY_NAMES = ["Automatycznie", "Wysoka", "Średnia", "Niska"];
    const PRESETS = {
        high: { mood: true, bloom: true, particles: 1, grass: 1, critters: 1, lazyEvery: LAZY_EVERY, smallShadows: true, fireShadows: true, nightScale: 2, skyFx: true },
        medium: { mood: true, bloom: false, particles: 0.6, grass: 0.5, critters: 0.5, lazyEvery: 8, smallShadows: true, fireShadows: true, nightScale: 3, skyFx: true },
        low: { mood: false, bloom: false, particles: 0.3, grass: 0, critters: 0.34, lazyEvery: 8, smallShadows: false, fireShadows: false, nightScale: 4, skyFx: false }
    };
    // what each choice turns off - the line under the row in Opcje (Automatycznie: what it does, and the level it chose now)
    const QUALITY_NOTES = {
        auto: "Gra sama schodzi niżej, gdy klatki zwalniają; wyżej wraca po zmianie mapy. Teraz: ",
        high: "Nic nie wyłącza: poświata, barwy, wszystkie cienie, gęsta trawa, cała pogoda, ptaki i motyle.",
        medium: "Wyłącza poświatę; trawa, deszcz, ptaki i motyle o połowę rzadsze; noc i dalekie rzeczy rysowane rzadziej.",
        low: "Wyłącza barwy nastroju, trawę, cienie kamieni, krzaków i od ognia, promienie i mgłę; minimum pogody. Ogień świeci."
    };
    const gfx = Object.assign({ setting: "auto", level: "high", version: 0 }, PRESETS.high);
    const DEFAULT_SETTING = 0;
    const settingOf = v => (v === undefined || v === null || !(Number(v) >= 0 && Number(v) <= 3) ? DEFAULT_SETTING : Math.round(Number(v)));
    const levelIndex = name => Math.max(1, QUALITY.indexOf(name));
    if (ConfigManager.gfxQuality === undefined) ConfigManager.gfxQuality = DEFAULT_SETTING;
    if (ConfigManager.gfxAuto === undefined) ConfigManager.gfxAuto = 1;
    const _gfxMake = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _gfxMake.call(this);
        config.gfxQuality = settingOf(this.gfxQuality);
        config.gfxAuto = Math.max(1, Math.min(3, Math.round(Number(this.gfxAuto)) || 1));
        return config;
    };
    const _gfxApply = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _gfxApply.call(this, config);
        this.gfxQuality = settingOf(config ? config.gfxQuality : undefined);
        const a = config ? Math.round(Number(config.gfxAuto)) : 1;
        this.gfxAuto = a >= 1 && a <= 3 ? a : 1;
        applyQuality();
    };
    // the level now: the chosen one, or Automatycznie's (ConfigManager.gfxAuto, kept in the config file: a weaker computer starts
    // where it ended last time and goes up again on a map with room to spare)
    function applyQuality() {
        const setting = QUALITY[settingOf(ConfigManager.gfxQuality)];
        const level = setting === "auto" ? QUALITY[Math.max(1, Math.min(3, ConfigManager.gfxAuto || 1))] : setting;
        appliedSetting = ConfigManager.gfxQuality;
        appliedAuto = ConfigManager.gfxAuto;
        if (gfx.setting === setting && gfx.level === level) return false;
        Object.assign(gfx, PRESETS[level], { setting, level, version: gfx.version + 1 });
        return true;
    }
    let appliedSetting = null, appliedAuto = null;
    // on the map's every frame: a value set straight into ConfigManager (the tests, the default button) is taken at once
    function keepQuality() {
        if (appliedSetting !== ConfigManager.gfxQuality || appliedAuto !== ConfigManager.gfxAuto) applyQuality();
    }
    applyQuality();

    // ---- the weather's drops and flakes (MZ's Weather: power x 10 sprites) - gfx.particles of them
    const _weatherAll = Weather.prototype._updateAllSprites;
    Weather.prototype._updateAllSprites = function() {
        const k = gfx.particles;
        if (!(k < 1)) return _weatherAll.call(this);
        const power = this.power;
        this.power = power * k;
        try { _weatherAll.call(this); } finally { this.power = power; }
    };

    // ---- Automatycznie: the time between the drawn frames on the map, in windows of AUTO.window frames (each gap counted at most
    // AUTO.clamp ms: a single hitch - a map loading, a save - does not decide; over a second - the window hidden - the window is
    // dropped). AUTO.slow windows in a row under AUTO.fps (~55 kl/s) -> a level lower. Never up on the same map; after a change of
    // the map (once there, after AUTO.upWindows windows) a level higher if every window kept AUTO.upFps and the frame's own work
    // (the update + the drawing) left room - under AUTO.upWork ms. A level that went up and had to come down again on the same map
    // gets a strike; after AUTO.strikes of them Automatycznie no longer goes up to it (this session) - no back and forth.
    const AUTO = { window: 60, clamp: 50, fps: 55, slow: 4, settle: 2, upWindows: 3, upFps: 58, upWork: 9, strikes: 2 };
    const auto = { spriteset: null, map: 0, last: 0, win: { n: 0, dt: 0, work: 0 }, list: [], settle: AUTO.settle, upTried: false, downHere: false,
        cameUp: null, strikes: { high: 0, medium: 0 }, log: [], setting: null };
    function autoReset(settle) {
        auto.win = { n: 0, dt: 0, work: 0 };
        auto.list = [];
        auto.settle = settle;
        auto.last = 0;
    }
    function autoStep(dir, why) {
        const from = gfx.level, to = QUALITY[levelIndex(from) + dir];
        if (!to || to === "auto") return false;
        if (dir > 0 && auto.cameUp === from && auto.strikes[from] !== undefined) auto.strikes[from]++;   // (it went up here and could not keep it)
        auto.cameUp = dir < 0 ? to : null;
        if (dir > 0) auto.downHere = true;
        ConfigManager.gfxAuto = levelIndex(to);
        applyQuality();
        auto.log.push({ frame: Graphics.frameCount, map: auto.map, from, to, why });
        if (auto.log.length > 40) auto.log.shift();
        autoReset(AUTO.settle);
        try { ConfigManager.save(); } catch (e) { /* the level stays for this session */ }
        return true;
    }
    function autoWindow() {
        const w = auto.win, fps = (w.n * 1000) / Math.max(1, w.dt), work = w.work / Math.max(1, w.n);
        auto.win = { n: 0, dt: 0, work: 0 };
        if (auto.settle > 0) { auto.settle--; return; }
        auto.list.push({ fps: +fps.toFixed(1), work: +work.toFixed(2) });
        if (auto.list.length > 8) auto.list.shift();
        const lastSlow = auto.list.slice(-AUTO.slow);
        if (gfx.level !== "low" && lastSlow.length === AUTO.slow && lastSlow.every(x => x.fps < AUTO.fps)) {
            autoStep(1, "wolno: " + lastSlow.map(x => x.fps).join(", ") + " kl/s");
            return;
        }
        if (auto.upTried || auto.downHere || gfx.level === "high" || auto.list.length < AUTO.upWindows) return;
        auto.upTried = true;   // (one look a map, once it has settled)
        const up = QUALITY[levelIndex(gfx.level) - 1], seen = auto.list.slice(-AUTO.upWindows), meanWork = seen.reduce((s, x) => s + x.work, 0) / seen.length;
        if ((auto.strikes[up] || 0) < AUTO.strikes && seen.every(x => x.fps >= AUTO.upFps) && meanWork <= AUTO.upWork) {
            autoStep(-1, "zapas: " + meanWork.toFixed(1) + " ms pracy na klatkę");
        }
    }
    function autoTick(t0, t1) {
        const s = SceneManager._scene;
        if (gfx.setting !== "auto" || !(s instanceof Scene_Map) || !s._started || !s._spriteset || SceneManager.isSceneChanging() ||
            !window.$gamePlayer || $gamePlayer.isTransferring() || (typeof document !== "undefined" && document.hidden)) { auto.last = 0; auto.setting = gfx.setting; return; }
        if (auto.setting !== "auto") { auto.setting = "auto"; autoReset(AUTO.settle); }   // (just chosen in Opcje: a fresh look)
        if (s._spriteset !== auto.spriteset) {   // (the map scene made again - after the menu, a talk scene - or another map)
            auto.spriteset = s._spriteset;
            const map = $gameMap.mapId();
            if (map !== auto.map) { auto.map = map; auto.upTried = false; auto.downHere = false; auto.cameUp = null; }
            autoReset(AUTO.settle);
        }
        if (auto.last) {
            const dt = t0 - auto.last;
            if (dt > 1000) { auto.win = { n: 0, dt: 0, work: 0 }; }
            else {
                const w = auto.win;
                w.n++;
                w.dt += Math.min(dt, AUTO.clamp);
                w.work += t1 - t0;
                if (w.n >= AUTO.window) autoWindow();
            }
        }
        auto.last = t0;
    }
    const _onTick = Graphics._onTick;
    Graphics._onTick = function(deltaTime) {
        const t0 = performance.now();
        _onTick.call(this, deltaTime);
        try { autoTick(t0, performance.now()); } catch (e) { /* never stop the frame */ }
    };
    const _sceneMapStart = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        keepQuality();
        _sceneMapStart.call(this);
    };
    const _sceneMapUpdateQ = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        keepQuality();
        _sceneMapUpdateQ.call(this);
    };

    // ---- the row in Opcje (both looks: the Grafit menu - MenuRing.js - and the classic options): "Jakość grafiki" right under
    // "Wygląd", and under it a line of small text - what the chosen level turns off - which the cursor passes over. A / D a level
    // (no further than the ends), O the next one round. Put round the options' window once every plugin is in (OptionEx.js puts its
    // own methods in place of the engine's), at Scene_Boot's start - or at once when put into a running page.
    const OPT_SYMBOL = "gfxQuality", NOTE_SYMBOL = "gfxQualityNote";
    function qualityNote() {
        const setting = QUALITY[settingOf(ConfigManager.gfxQuality)];
        return setting === "auto" ? QUALITY_NOTES.auto + QUALITY_NAMES[levelIndex(gfx.level)] + "." : QUALITY_NOTES[setting];
    }
    let optionsWrapped = false;
    function wrapOptions() {
        if (optionsWrapped) return;
        optionsWrapped = true;
        const P = Window_Options.prototype;
        const _make = P.makeCommandList;
        P.makeCommandList = function() {
            _make.call(this);
            const at = this._list.findIndex(c => c.symbol === "uiClean") + 1;
            this._list.splice(at, 0, { name: "Jakość grafiki", symbol: OPT_SYMBOL, enabled: true, ext: null }, { name: "", symbol: NOTE_SYMBOL, enabled: false, ext: null });
        };
        const _status = P.statusText;
        P.statusText = function(index) {
            const symbol = this.commandSymbol(index);
            if (symbol === OPT_SYMBOL) return QUALITY_NAMES[settingOf(ConfigManager.gfxQuality)];
            if (symbol === NOTE_SYMBOL) return "";
            return _status.call(this, index);
        };
        // the cursor passes over the line of text (down: the row under it; up: the row above it; a click on it: the nearer one)
        const _select = P.select;
        P.select = function(index) {
            if (index >= 0 && this._list && this._list[index] && this._list[index].symbol === NOTE_SYMBOL) {
                const from = this.index(), step = from > index ? -1 : 1, to = index + step;
                index = to >= 0 && to < this.maxItems() ? to : index - step;
            }
            _select.call(this, index);
        };
        const step = (w, forward, wrap) => {
            const v = settingOf(ConfigManager.gfxQuality), n = v + (forward ? 1 : -1);
            const next = n > 3 ? (wrap ? 0 : 3) : n < 0 ? (wrap ? 3 : 0) : n;
            if (next === v) return;
            w.changeValue(OPT_SYMBOL, next);
            if (getComputedValue(w) !== next) ConfigManager.gfxQuality = next;   // (without OptionEx.js's changeValue)
            applyQuality();
            const note = w.findSymbol(NOTE_SYMBOL);
            if (note >= 0) w.redrawItem(note);
        };
        const getComputedValue = w => w.getConfigValue(OPT_SYMBOL);
        const _ok = P.processOk, _right = P.cursorRight, _left = P.cursorLeft;
        P.processOk = function() {
            if (this.commandSymbol(this.index()) === OPT_SYMBOL) { step(this, true, true); return; }
            _ok.apply(this, arguments);
        };
        P.cursorRight = function() {
            if (this.commandSymbol(this.index()) === OPT_SYMBOL) { step(this, true, false); return; }
            _right.apply(this, arguments);
        };
        P.cursorLeft = function() {
            if (this.commandSymbol(this.index()) === OPT_SYMBOL) { step(this, false, false); return; }
            _left.apply(this, arguments);
        };
        if (P.cursorPagedown) {
            const _pd = P.cursorPagedown, _pu = P.cursorPageup;
            P.cursorPagedown = function() { if (this.commandSymbol(this.index()) === OPT_SYMBOL) step(this, true, false); else _pd.apply(this, arguments); };
            P.cursorPageup = function() { if (this.commandSymbol(this.index()) === OPT_SYMBOL) step(this, false, false); else _pu.apply(this, arguments); };
        }
        const _restore = P.restoreDefaultValues;
        if (_restore) {
            P.restoreDefaultValues = function() {
                _restore.apply(this, arguments);
                ConfigManager.gfxQuality = DEFAULT_SETTING;
                applyQuality();
            };
        }
        // the line of text: small, dimmer, across the whole row (the Grafit look - CleanHUD's text, as the other rows; else the window's)
        const _draw = P.drawItem;
        P.drawItem = function(index) {
            if (this.commandSymbol(index) !== NOTE_SYMBOL) return _draw.call(this, index);
            const r = this.itemLineRect ? this.itemLineRect(index, false) : this.itemRect(index), s = this.itemLineRect ? this.itemLineRect(index, true) : r;
            const x = r.x + 12, w = Math.max(r.width, s.x + s.width - r.x) - 16, text = qualityNote(), CH = T.api("CleanHUD");
            if (T.api("MenuRing") && CH && CH.isClean && CH.isClean() && CH.textOut) {
                CH.textOut(this.contents, text, x, r.y, w, r.height, "left", { size: 15, color: CH.C.muted, plain: true });
                return;
            }
            this.resetFontSettings();
            this.contents.fontSize = Math.max(14, Math.round(this.contents.fontSize * 0.7));
            this.changeTextColor(ColorManager.textColor(8));
            this.drawText(text, x, r.y, w, "left");
            this.resetFontSettings();
        };
    }
    if (window.SceneManager && SceneManager._scene && !(SceneManager._scene instanceof Scene_Boot)) wrapOptions();
    else {
        const _bootStart = Scene_Boot.prototype.start;
        Scene_Boot.prototype.start = function() {
            wrapOptions();
            _bootStart.call(this);
        };
    }

    // for the other plugins and the tests: the level now and its parts (gfx), the choice (set: 0-3 or "auto" / "high" / "medium" /
    // "low"; save: also into the config file), the line of Opcje, Automatycznie's state, its numbers (tune) and its fresh start
    const quality = {
        gfx, PRESETS, NAMES: QUALITY_NAMES, LEVELS: QUALITY, NOTES: QUALITY_NOTES, AUTO,
        get: () => QUALITY[settingOf(ConfigManager.gfxQuality)],
        level: () => gfx.level,
        set(v, o) {
            const i = typeof v === "string" ? QUALITY.indexOf(v) : Number(v);
            if (!(i >= 0 && i <= 3)) return false;
            ConfigManager.gfxQuality = i;
            if (o && o.auto) ConfigManager.gfxAuto = levelIndex(o.auto);
            applyQuality();
            if (o && o.save) ConfigManager.save();
            return gfx.level;
        },
        note: qualityNote,
        auto: {
            state: () => ({ setting: gfx.setting, level: gfx.level, map: auto.map, settle: auto.settle, windows: auto.list.slice(), upTried: auto.upTried,
                downHere: auto.downHere, cameUp: auto.cameUp, strikes: Object.assign({}, auto.strikes), log: auto.log.slice() }),
            tune(o) { Object.assign(AUTO, o || {}); return Object.assign({}, AUTO); },
            reset() { auto.spriteset = null; auto.map = 0; auto.strikes = { high: 0, medium: 0 }; auto.log = []; auto.cameUp = null; autoReset(AUTO.settle); return true; }
        }
    };

    window.Wydajnosc = T.register(PLUGIN, { opts, stats, offTarget, settleFilters, gfx, quality });
})();
