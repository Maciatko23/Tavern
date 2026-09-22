//=============================================================================
// DayNightCycle.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Cykl dnia i nocy: upływ czasu, numer dnia, pory dnia i zabarwienie ekranu. v2.0.0
 * @author Claude
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

    function computeTone(hour) {
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

    function isToneEnabled() {
        const note = $dataMap && $dataMap.note ? $dataMap.note : "";
        if (/<DayNight:\s*off\s*>/i.test(note)) return false;
        if (/<DayNight:\s*on\s*>/i.test(note)) return true;
        return DEFAULT_ENABLED;
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
            $gameScreen.startTint(computeTone($gameSystem.dayNightHour()), 0);
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
    };
})();
