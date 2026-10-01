//=============================================================================
// DayNightCycle.js
//=============================================================================
// Z-order: must load after DustMotes.js/RoomLighting.js and before CloudShadows.js/SwayingFoliage.js; also must load before Atmosphere.js, which now reads its canonical periods.

/*:
 * @target MZ
 * @plugindesc Cykl dnia i nocy: upływ czasu, numer dnia, pory dnia i zabarwienie ekranu. v2.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @param secondsPerHour
 * @text Sekundy realne na 1 godzinę w grze
 * @type number
 * @min 1
 * @default 60
 * @desc Pełna doba (24h) = ta wartość x 24. Domyślnie 60 = pełny cykl w 24 minuty.
 *
 * @param startHour
 * @text Godzina startowa nowej gry
 * @type number
 * @min 0
 * @max 23
 * @default 9
 *
 * @param startDay
 * @text Numer dnia na starcie nowej gry
 * @type number
 * @min 1
 * @default 1
 *
 * @param defaultEnabled
 * @text Domyślnie zabarwiaj ekran na mapach
 * @type boolean
 * @default true
 * @desc Dotyczy tylko zabarwienia ekranu. Czas płynie na każdej mapie.
 *
 * @param pauseDuringEvents
 * @text Zatrzymuj czas podczas zdarzeń i rozmów
 * @type boolean
 * @default true
 * @desc Dzięki temu długa rozmowa nie "zjada" dnia.
 *
 * @param pauseSwitch
 * @text Przełącznik pauzy cyklu
 * @type switch
 * @default 0
 * @desc Gdy ON, czas stoi i zabarwienie nie jest zmieniane - przydatne, żeby samemu ustawić ton na czas cutscenki. 0 = brak.
 *
 * @param hourVariable
 * @text Zmienna z bieżącą godziną
 * @type variable
 * @default 0
 * @desc Jeśli ustawione, wpisywana jest tam aktualna godzina (0-23) - do warunków w eventach. 0 = brak.
 *
 * @param dayVariable
 * @text Zmienna z numerem dnia
 * @type variable
 * @default 0
 * @desc Jeśli ustawione, wpisywany jest tam numer dnia (1, 2, 3...). 0 = brak.
 *
 * @help
 * ============================================================================
 * DayNightCycle.js
 * ============================================================================
 * Ciągły cykl dnia i nocy. Czas w grze płynie na każdej mapie (także we
 * wnętrzach), a ekran zmienia zabarwienie między świtem, dniem, zmierzchem i
 * nocą.
 *
 * PORY DNIA:
 *   Świt 5-8, Poranek 8-11, Południe 11-15, Popołudnie 15-18,
 *   Wieczór 18-21, Noc 21-5.
 *
 * ZABARWIENIE EKRANU NA MAPIE:
 *   W notatce mapy (Map Properties > Note) wpisz jeden z tagów:
 *     <DayNight:on>   - zabarwiaj ekran według pory dnia
 *     <DayNight:off>  - bez zabarwienia (np. wnętrza z własnym oświetleniem
 *                       z pluginu RoomLighting). Czas nadal płynie.
 *   Bez tagu używane jest ustawienie "Domyślnie zabarwiaj ekran".
 *
 * SKRYPTY (np. w warunkach zdarzeń, komenda "Skrypt"):
 *   $gameSystem.dayNightHour()        - godzina jako liczba 0-24 (z ułamkiem)
 *   $gameSystem.dayNightDay()         - numer dnia
 *   $gameSystem.dayNightPeriod().name - nazwa pory dnia ("Poranek"...)
 *   $gameSystem.sleepUntilHour(7)     - przewija czas do 7:00 (następnego
 *                                       dnia, jeśli ta godzina już minęła)
 *
 * WSPÓŁPRACA Z RĘCZNYM "Change Screen Color Tone":
 *   Ten plugin nadpisuje zabarwienie ekranu co klatkę, więc normalna komenda
 *   zdarzenia "Zmień barwę ekranu" zostanie natychmiast przywrócona z
 *   powrotem. Jeśli chcesz ręcznie ustawić ton na czas cutscenki, włącz
 *   najpierw przełącznik pauzy (parametr "Przełącznik pauzy cyklu"), a po
 *   cutscence wyłącz go z powrotem.
 *
 * Czas i numer dnia są zapisywane w stanie gry (przetrwają zapis/wczytanie).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("DayNightCycle.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");

    const pluginName = "DayNightCycle";
    const params = PluginManager.parameters(pluginName);
    const num = (value, fallback) =>
        value !== undefined && value !== "" && isFinite(Number(value)) ? Number(value) : fallback;
    const SECONDS_PER_HOUR = num(params.secondsPerHour, 60) || 60;
    const START_HOUR = num(params.startHour, 9);
    const START_DAY = num(params.startDay, 1);
    const DEFAULT_ENABLED = params.defaultEnabled !== "false";
    const PAUSE_DURING_EVENTS = params.pauseDuringEvents !== "false";
    const PAUSE_SWITCH_ID = num(params.pauseSwitch, 0);
    const HOUR_VARIABLE_ID = num(params.hourVariable, 0);
    const DAY_VARIABLE_ID = num(params.dayVariable, 0);

    // Tone keyframes across a 24h day: [red, green, blue, gray], RPG Maker's
    // native screen-tone format. Interpolated smoothly between neighbours.
    const NIGHT_TONE = [-25, -25, 0, 30];   // only a cool, slightly grey tint: the darkness itself is a layer of Farming.js (Sprite_NightLight) with light cut out around fires
    const DAY_TONE = [0, 0, 0, 0];
    const KEYFRAMES = [
        { h: 0, tone: NIGHT_TONE },
        { h: 5, tone: NIGHT_TONE },
        { h: 7, tone: [20, -50, -70, 0] }, // dawn
        { h: 9, tone: DAY_TONE },
        { h: 17, tone: DAY_TONE },
        { h: 19, tone: [50, -40, -50, 0] }, // dusk
        { h: 21, tone: NIGHT_TONE },
        { h: 24, tone: NIGHT_TONE }
    ];

    // Times of day. "from" is the hour the period starts; night wraps past midnight.
    const PERIODS = [
        { id: "dawn", name: "Świt", from: 5 },
        { id: "morning", name: "Poranek", from: 8 },
        { id: "noon", name: "Południe", from: 11 },
        { id: "afternoon", name: "Popołudnie", from: 15 },
        { id: "evening", name: "Wieczór", from: 18 },
        { id: "night", name: "Noc", from: 21 }
    ];

    function periodAt(hour) {
        let found = PERIODS[PERIODS.length - 1]; // before 5:00 it is still night
        if (hour >= PERIODS[0].from) {
            for (const p of PERIODS) {
                if (hour >= p.from) found = p;
            }
        }
        return found;
    }

    // the screen's colour at an hour: the sky's (the sun's height: T.api("Sun").sky - ChoppableTree_Render.js), else the keyframes below
    function computeTone(hour) {
        const Sun = T.api("Sun");
        if (Sun && Sun.sky) return Sun.sky(hour).tone.slice();
        for (let i = 0; i < KEYFRAMES.length - 1; i++) {
            const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
            if (hour >= a.h && hour <= b.h) {
                const span = b.h - a.h || 1;
                const t = (hour - a.h) / span;
                return [0, 1, 2, 3].map(j => Math.round(a.tone[j] + (b.tone[j] - a.tone[j]) * t));
            }
        }
        return KEYFRAMES[0].tone.slice();
    }

    // <DayNight:on> / <DayNight:off> in the map's note, else the parameter ("on" wins when both are there)
    function isToneEnabled() {
        return T.mapFlag("DayNight", DEFAULT_ENABLED);
    }

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._dayNightHour = START_HOUR;
        this._dayNightDay = START_DAY;
    };

    Game_System.prototype.dayNightHour = function() {
        if (this._dayNightHour === undefined) this._dayNightHour = START_HOUR;
        return this._dayNightHour;
    };

    Game_System.prototype.dayNightDay = function() {
        if (this._dayNightDay === undefined) this._dayNightDay = START_DAY;
        return this._dayNightDay;
    };

    Game_System.prototype.setDayNightHour = function(hour) {
        this._dayNightHour = ((hour % 24) + 24) % 24;
    };

    // Moves time forward; crossing midnight starts a new day.
    Game_System.prototype.advanceDayNight = function(hours) {
        let hour = this.dayNightHour() + hours;
        let day = this.dayNightDay();
        while (hour >= 24) {
            hour -= 24;
            day += 1;
        }
        this._dayNightHour = hour;
        this._dayNightDay = day;
    };

    // Jumps to the given hour: today if it is still ahead, otherwise tomorrow.
    Game_System.prototype.sleepUntilHour = function(hour) {
        const target = ((hour % 24) + 24) % 24;
        if (target <= this.dayNightHour()) {
            this._dayNightDay = this.dayNightDay() + 1;
        }
        this._dayNightHour = target;
        syncVariables();
        return { day: this._dayNightDay, hour: target };
    };

    Game_System.prototype.dayNightPeriod = function() {
        return periodAt(this.dayNightHour());
    };

    function syncVariables() {
        if (HOUR_VARIABLE_ID > 0) {
            const hour = Math.floor($gameSystem.dayNightHour());
            if ($gameVariables.value(HOUR_VARIABLE_ID) !== hour) $gameVariables.setValue(HOUR_VARIABLE_ID, hour);
        }
        if (DAY_VARIABLE_ID > 0) {
            const day = $gameSystem.dayNightDay();
            if ($gameVariables.value(DAY_VARIABLE_ID) !== day) $gameVariables.setValue(DAY_VARIABLE_ID, day);
        }
    }

    Spriteset_Map.prototype.updateDayNight = function() {
        if (PAUSE_SWITCH_ID > 0 && $gameSwitches.value(PAUSE_SWITCH_ID)) return;
        if (!(PAUSE_DURING_EVENTS && $gameMap.isEventRunning())) {
            $gameSystem.advanceDayNight(1 / 60 / SECONDS_PER_HOUR);
        }
        syncVariables();
        if (isToneEnabled()) {
            const tone = computeTone($gameSystem.dayNightHour());
            $gameScreen.startTint(window.Storm && Storm.adjustTone ? Storm.adjustTone(tone) : tone, 0);   // a storm darkens the sky (Storm.js)
            $gameSystem._dayNightTinting = true;
        } else if ($gameSystem._dayNightTinting) {
            // Leaving a tinted map for one with the tint off: drop our tone once.
            $gameScreen.startTint([0, 0, 0, 0], 0);
            $gameSystem._dayNightTinting = false;
        }
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        this.updateDayNight();
        this.updateSideLight();
    };

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
        const g = isToneEnabled() && sun.outdoors && !sun.flash ? sky.golden * (1 - 0.8 * (window.Storm ? Storm.level() : 0)) : 0;
        layer.visible = g > 0.01;
        if (!layer.visible) return;
        // (a scale that covers the screen; mirrored: the warm side where the sun is)
        const sx = (Graphics.width / 256) * 1.02, sy = (Graphics.height / 4) * 1.02;
        for (const s of [layer._warm, layer._cool]) s.scale.set(sky.side > 0 ? -sx : sx, sy);
        layer._warm.alpha = SIDE_WARM_ALPHA * g;
        layer._cool.alpha = SIDE_COOL_ALPHA * g;
        layer._golden = g;
    };

    // Exposes the canonical hour->period mapping so other plugins (Atmosphere.js)
    // can derive their own coarser views of "what time is it" from the same
    // source instead of re-deriving separate, possibly-conflicting boundaries.
    window.DayNightCycle = { periodAt, PERIODS, computeTone };
})();
