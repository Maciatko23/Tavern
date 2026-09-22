//=============================================================================
// Atmosphere.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Klimat: dźwięki otoczenia (wiatr, deszcz, świerszcze, ptaki, żaby), kroki zależne od podłoża, muzyka zmieniająca się z porą dnia, autozapis po spaniu. v1.0.0
 * @author Claude
 *
 * @param ambience
 * @text Dźwięki otoczenia
 * @desc Wiatr, deszcz, noc ze świerszczami, woda przy stawie, gwar w tawernie, kapanie w jaskiniach.
 * @type boolean
 * @default true
 *
 * @param ambienceVolume
 * @text Głośność otoczenia (%)
 * @type number
 * @min 0
 * @max 150
 * @default 100
 *
 * @param birds
 * @text Ptaki, sowy i żaby
 * @desc Śpiew ptaków za dnia (syntezowany w grze), pohukiwanie sowy i rechot żab w nocy.
 * @type boolean
 * @default true
 *
 * @param footsteps
 * @text Kroki zależne od podłoża
 * @type boolean
 * @default true
 *
 * @param footstepVolume
 * @text Głośność kroków (%)
 * @type number
 * @min 0
 * @max 150
 * @default 60
 *
 * @param strideTiles
 * @text Odległość między krokami (kratki)
 * @type number
 * @decimals 2
 * @min 0.3
 * @default 1.1
 *
 * @param timeMusic
 * @text Muzyka zmienia się z porą dnia
 * @desc Dotyczy map z notatką <TimeMusic:on> oraz map zewnętrznych bez własnej muzyki (znacznik <Clouds:on>).
 * @type boolean
 * @default true
 *
 * @param musicVolume
 * @text Głośność tej muzyki (%)
 * @type number
 * @min 10
 * @max 100
 * @default 55
 *
 * @param musicDawn
 * @text Muzyka: świt (5:00 - 8:30)
 * @type file
 * @dir audio/bgm/
 * @default Field3
 *
 * @param musicDay
 * @text Muzyka: dzień (8:30 - 17:00)
 * @type file
 * @dir audio/bgm/
 * @default Field1
 *
 * @param musicDusk
 * @text Muzyka: zmierzch (17:00 - 20:00)
 * @type file
 * @dir audio/bgm/
 * @default Field2
 *
 * @param musicNight
 * @text Muzyka: noc (20:00 - 5:00)
 * @type file
 * @dir audio/bgm/
 * @default Theme6
 *
 * @param autosaveOnSleep
 * @text Autozapis po spaniu
 * @desc Po przespanej nocy (łóżko, legowisko) gra zapisuje się sama w miejscu Autozapis.
 * @type boolean
 * @default true
 *
 * @param tavernMaps
 * @text Mapy z gwarem tawerny (numery po przecinku)
 * @default 1
 *
 * @help
 * ============================================================================
 * Atmosphere.js
 * ============================================================================
 * DŹWIĘKI OTOCZENIA (jedno tło dźwiękowe naraz, płynne przejścia)
 *   Na zewnątrz: deszcz (lekki, mocny, ulewa według siły opadu), śnieg i wiatr,
 *   noc ze świerszczami, za dnia lekki wiatr, a w pobliżu wody szum wody.
 *   Wewnątrz: w tawernie gwar gości, w innych wnętrzach cisza, a gdy na
 *   zewnątrz pada, stłumiony deszcz. W jaskiniach kapanie.
 *   Do tego ptaki za dnia (o świcie częściej), sowa i żaby nocą.
 *   Rodzaj otoczenia wynika z tilesetu mapy. Notatka mapy <Ambience:outdoor>,
 *   <Ambience:tavern>, <Ambience:interior>, <Ambience:cave> lub <Ambience:off>
 *   ustawia go ręcznie.
 *
 * KROKI
 *   Gracz stawia kroki dźwięczące jak podłoże pod stopami: trawa, ziemia i
 *   ścieżki, świeżo zaorana ziemia, kamień, drewniana podłoga, piasek, śnieg
 *   (zimą na dworze) i woda. Dźwięki powstają w grze, więc nie ma plików.
 *
 * MUZYKA
 *   Na mapach zewnętrznych bez własnej muzyki gra utwór zależny od pory dnia
 *   i zmienia się płynnie: świt, dzień, zmierzch, noc. Utwory i głośność
 *   ustawiasz w parametrach. <TimeMusic:on> włącza to na innej mapie,
 *   <TimeMusic:off> wyłącza. Muzyka z zdarzeń (np. w scenie) ma pierwszeństwo.
 *
 * AUTOZAPIS
 *   Po przespanej nocy (łóżko albo co najmniej 4 godziny na legowisku) gra
 *   zapisuje się do slotu Autozapis i pokazuje krótką informację.
 *
 * Głośności biorą się z opcji gry (BGM, BGS, SE), więc suwaki działają.
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "Atmosphere";
    const params = PluginManager.parameters(pluginName);
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    const flag = (v, d) => (v === undefined || v === "" ? d : v === "true");
    const AMBIENCE = flag(params.ambience, true);
    const AMBIENCE_VOL = num(params.ambienceVolume, 100) / 100;
    const BIRDS = flag(params.birds, true);
    const FOOTSTEPS = flag(params.footsteps, true);
    const FOOT_VOL = num(params.footstepVolume, 60) / 100;
    const STRIDE = num(params.strideTiles, 1.1);
    const TIME_MUSIC = flag(params.timeMusic, true);
    const MUSIC_VOL = num(params.musicVolume, 55);
    const TRACKS = { dawn: params.musicDawn || "Field3", day: params.musicDay || "Field1", dusk: params.musicDusk || "Field2", night: params.musicNight || "Theme6" };
    const AUTOSAVE = flag(params.autosaveOnSleep, true);
    const TAVERN_MAPS = String(params.tavernMaps || "1").split(",").map(s => Number(s.trim())).filter(n => n > 0);

    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = list => list[Math.floor(Math.random() * list.length)];

    // ------------------------------------------------------------------
    // Time and place
    // ------------------------------------------------------------------
    function hourNow() {
        return $gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12;
    }
    function periodAt(h) {
        if (h >= 5 && h < 8.5) return "dawn";
        if (h >= 8.5 && h < 17) return "day";
        if (h >= 17 && h < 20) return "dusk";
        return "night";
    }
    function profileOf() {
        const note = ($dataMap && $dataMap.note) || "";
        const m = note.match(/<Ambience:\s*(\w+)\s*>/i);
        if (m) return m[1].toLowerCase();
        if (/<(Clouds|Weather):\s*on\s*>/i.test(note)) return "outdoor";
        const ts = $gameMap.tileset(), name = (ts && ts.name) || "";
        if (/Loch|Dungeon/i.test(name)) return "cave";
        if (/Wewn|Inside|Interior/i.test(name)) return TAVERN_MAPS.includes($gameMap.mapId()) ? "tavern" : "interior";
        if (/Zewn|Exterior|Outside|Świat/i.test(name)) return "outdoor";
        return "off";
    }
    // rain or snow: what falls on the player, or (indoors) what falls outside according to the daily plan
    function precipitation(profile) {
        if (profile === "outdoor") {
            const power = $gameScreen._weatherPowerTarget || 0;
            const type = $gameScreen.weatherType();
            if (power > 0 && (type === "rain" || type === "storm")) return { type: "rain", power };
            if (power > 0 && type === "snow") return { type: "snow", power };
            return null;
        }
        const S = window.Survival;
        const plan = S && S.currentWeather ? S.currentWeather() : null;
        return plan ? { type: plan.type, power: plan.power } : null;
    }
    const isWater = (x, y) => !!(window.Farming && Farming.isWaterTile && Farming.isWaterTile(x, y));
    function nearWater(radius) {
        let n = 0;
        for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius && isWater($gamePlayer.x + dx, $gamePlayer.y + dy)) n++;
        }
        return n;
    }

    // ------------------------------------------------------------------
    // The sound engine: everything is made of filtered noise and simple tones (no files)
    // ------------------------------------------------------------------
    let fallbackContext = null;
    function audioContext() {
        const c = (window.WebAudio && WebAudio._context) || fallbackContext || (fallbackContext = new (window.AudioContext || window.webkitAudioContext)());
        if (c.state === "suspended" && c.resume) c.resume().catch(() => {});
        return c;
    }
    const buses = new WeakMap();
    function bus(c, kind) {
        let b = buses.get(c);
        if (!b) { b = {}; buses.set(c, b); }
        if (!b[kind]) { b[kind] = c.createGain(); b[kind].connect(c.destination); }
        return b[kind];
    }
    const noises = new WeakMap();
    function noiseBuffer(c) {
        let buf = noises.get(c);
        if (!buf) {
            buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            noises.set(c, buf);
        }
        return buf;
    }
    // a burst of filtered noise: type/f/q the filter (f2: it glides there), attack and decay in seconds
    function burst(c, dest, when, o) {
        const src = c.createBufferSource(), filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = noiseBuffer(c);
        filt.type = o.type;
        filt.frequency.setValueAtTime(o.f, when);
        if (o.f2) filt.frequency.exponentialRampToValueAtTime(o.f2, when + o.decay);
        filt.Q.value = o.q || 0.7;
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(o.gain, when + (o.attack || 0.004));
        g.gain.exponentialRampToValueAtTime(0.0001, when + o.decay);
        src.connect(filt);
        filt.connect(g);
        g.connect(dest);
        src.start(when, Math.random() * 1.4, o.decay + 0.05);
    }
    // a tone that glides from f0 to f1
    function tone(c, dest, when, o) {
        const osc = c.createOscillator(), g = c.createGain();
        osc.type = o.type || "sine";
        osc.frequency.setValueAtTime(o.f0, when);
        if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, when + o.decay);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(o.gain, when + (o.attack || 0.004));
        g.gain.exponentialRampToValueAtTime(0.0001, when + o.decay);
        osc.connect(g);
        g.connect(dest);
        osc.start(when);
        osc.stop(when + o.decay + 0.05);
        if (o.vibrato) {
            const lfo = c.createOscillator(), depth = c.createGain();
            lfo.frequency.value = o.vibrato.rate;
            depth.gain.value = o.vibrato.depth;
            lfo.connect(depth);
            depth.connect(osc.frequency);
            lfo.start(when);
            lfo.stop(when + o.decay + 0.05);
        }
    }
    function panned(c, dest, pan) {
        if (!c.createStereoPanner) return dest;
        const p = c.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        p.connect(dest);
        return p;
    }

    // ---- footsteps: what a shoe does on each ground
    const STEP = {
        grass(c, d, t) {
            burst(c, d, t, { type: "lowpass", f: 650 * rand(0.9, 1.15), q: 0.7, decay: 0.11, gain: 0.55 });
            burst(c, d, t + 0.01, { type: "bandpass", f: 2800 * rand(0.9, 1.2), q: 0.8, decay: 0.07, gain: 0.11 });
            tone(c, d, t, { f0: 95, f1: 60, decay: 0.07, gain: 0.25 });
        },
        earth(c, d, t) {
            burst(c, d, t, { type: "bandpass", f: 900 * rand(0.9, 1.15), q: 0.9, decay: 0.09, gain: 0.6 });
            burst(c, d, t + 0.005, { type: "highpass", f: 3500, q: 0.7, decay: 0.03, gain: 0.12 });
            tone(c, d, t, { f0: 115, f1: 70, decay: 0.06, gain: 0.3 });
        },
        soil(c, d, t) {
            burst(c, d, t, { type: "lowpass", f: 500 * rand(0.9, 1.1), q: 0.7, decay: 0.13, gain: 0.55 });
            tone(c, d, t, { f0: 80, f1: 55, decay: 0.1, gain: 0.3 });
        },
        stone(c, d, t) {
            burst(c, d, t, { type: "highpass", f: 1800 * rand(0.9, 1.15), q: 0.8, decay: 0.045, gain: 0.55 });
            tone(c, d, t, { f0: 1400 * rand(0.95, 1.05), f1: 1100, decay: 0.05, gain: 0.1 });
            tone(c, d, t, { f0: 170, f1: 120, decay: 0.05, gain: 0.22 });
        },
        wood(c, d, t) {
            tone(c, d, t, { f0: 215 * rand(0.92, 1.1), f1: 150, decay: 0.09, gain: 0.55 });
            burst(c, d, t, { type: "bandpass", f: 1200, q: 3, decay: 0.05, gain: 0.3 });
            tone(c, d, t, { type: "triangle", f0: 520 * rand(0.95, 1.08), f1: 420, decay: 0.05, gain: 0.09 });
        },
        sand(c, d, t) {
            burst(c, d, t, { type: "highpass", f: 1500, q: 0.6, decay: 0.16, gain: 0.45 });
            burst(c, d, t, { type: "lowpass", f: 420, q: 0.7, decay: 0.08, gain: 0.3 });
        },
        snow(c, d, t) {
            [0, 0.035, 0.07].forEach((off, i) => burst(c, d, t + off, { type: "bandpass", f: 3500 * rand(0.85, 1.2), q: 0.8, decay: 0.05, gain: 0.35 - i * 0.05 }));
            burst(c, d, t, { type: "lowpass", f: 400, q: 0.7, decay: 0.1, gain: 0.3 });
        },
        water(c, d, t) {
            burst(c, d, t, { type: "bandpass", f: 1800 * rand(0.9, 1.15), q: 0.6, decay: 0.22, gain: 0.5 });
            burst(c, d, t, { type: "lowpass", f: 500, q: 0.7, decay: 0.3, gain: 0.35 });
            tone(c, d, t + 0.01, { f0: 300, f1: 700, decay: 0.12, gain: 0.12 });
        }
    };
    // c: any (offline) context, dest: where it goes, kind: one of STEP, wet: rain makes the ground splashy
    function footstep(c, dest, when, kind, gain, wet) {
        const g = c.createGain();
        g.gain.value = gain;
        g.connect(dest);
        const out = panned(c, g, rand(-0.12, 0.12));
        (STEP[kind] || STEP.earth)(c, out, when);
        if (wet && kind !== "water") burst(c, out, when + 0.005, { type: "bandpass", f: 4200, q: 0.7, decay: 0.07, gain: 0.2 });
    }

    // ---- birds and an owl
    function chirp(c, dest, when, f0, f1, dur, gain, vib) {
        tone(c, dest, when, { f0, f1, decay: dur, gain, attack: 0.006, vibrato: vib });
        tone(c, dest, when, { f0: f0 * 2, f1: f1 * 2, decay: dur * 0.9, gain: gain * 0.22, attack: 0.006 });
    }
    const BIRD = {
        tsit(c, d, t) {   // two or three short rising notes
            const n = 2 + Math.floor(Math.random() * 2), f = rand(2700, 3400);
            for (let i = 0; i < n; i++) chirp(c, d, t + i * 0.12, f, f * 1.45, 0.07, 0.35);
        },
        trill(c, d, t) {  // many quick alternating notes
            const n = 6 + Math.floor(Math.random() * 5), f = rand(3300, 4200);
            for (let i = 0; i < n; i++) chirp(c, d, t + i * 0.055, i % 2 ? f : f * 0.9, i % 2 ? f * 0.92 : f * 1.08, 0.04, 0.28);
        },
        whistle(c, d, t) { // a thrush-like slide and a lower answer
            const f = rand(2100, 2600);
            chirp(c, d, t, f, f * 1.4, 0.16, 0.3, { rate: 28, depth: 40 });
            chirp(c, d, t + 0.2, f * 1.4, f * 1.1, 0.14, 0.28, { rate: 30, depth: 35 });
            chirp(c, d, t + 0.5, f * 0.8, f * 1.05, 0.22, 0.26, { rate: 22, depth: 30 });
        },
        owl(c, d, t) {
            tone(c, d, t, { f0: 430, f1: 380, decay: 0.42, gain: 0.32, attack: 0.05, vibrato: { rate: 5, depth: 6 } });
            tone(c, d, t + 0.55, { f0: 400, f1: 340, decay: 0.75, gain: 0.3, attack: 0.05, vibrato: { rate: 5, depth: 6 } });
        }
    };
    function birdCall(c, dest, when, kind, pan) {
        const g = c.createGain();
        g.gain.value = 0.55;
        g.connect(dest);
        (BIRD[kind] || BIRD.tsit)(c, panned(c, g, pan), when);
    }

    // ------------------------------------------------------------------
    // The ground under the player's feet
    // ------------------------------------------------------------------
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        let h = 0;
        if (d > 0) {
            if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
            h *= 60;
            if (h < 0) h += 360;
        }
        return { h, s: max === 0 ? 0 : d / max, v: max };
    }
    function kindFromColour(c, indoors) {
        if (!c) return indoors ? "wood" : "grass";
        const { h, s, v } = rgbToHsv(c.r, c.g, c.b);
        if (s < 0.16) return v > 0.82 ? "snow" : "stone";
        if (h >= 70 && h <= 175) return "grass";
        if (h >= 12 && h <= 55) {
            if (indoors && s > 0.4) return "wood";
            if (!indoors && s > 0.55 && v > 0.55) return "sand";
            return "earth";
        }
        return indoors ? "wood" : "earth";
    }
    function groundKindAt(x, y) {
        const profile = profileOf();
        const indoors = profile === "tavern" || profile === "interior";
        if (profile === "cave") return "stone";
        for (let z = 0; z < 2; z++) {
            const id = $gameMap.tileId(x, y, z);
            if (id > 0 && Tilemap.isWaterTile(id) && $gameMap.isPassable(x, y, 2)) return "water";
        }
        if (!indoors && window.Farming && Farming.plotAt) {
            const plot = Farming.plotAt(x, y);
            if (plot && (plot.s === "tilled" || plot.s === "raked" || plot.crop)) return "soil";
        }
        const c = window.Minimap && Minimap.groundColourAt ? Minimap.groundColourAt(x, y) : null;
        let kind = kindFromColour(c, indoors);
        // winter outdoors: the ground is under snow
        if (!indoors && (kind === "grass" || kind === "earth") && window.Farming && Farming.seasonIndex && Farming.seasonIndex($gameSystem.dayNightDay()) === 3) kind = "snow";
        return kind;
    }

    // ------------------------------------------------------------------
    // The state of the sound around the player (updated from the map scene)
    // ------------------------------------------------------------------
    const state = {
        bed: null,           // { name, volume } playing now
        switching: 0,        // frames left of a fade out before the next bed starts
        nextBed: null,
        lastCheck: -999,
        nextBird: 0,
        nextOwl: 0,
        nextFrog: 0,
        nextCrow: 0,
        music: null,         // the track this plugin started
        musicPeriod: null,
        musicSwitch: 0,
        musicNext: null,
        takeOver: true,
        mapId: 0,
        stepAcc: 0,
        lastX: 0,
        lastY: 0,
        stepSide: 1
    };

    function desiredBed() {
        if (!AMBIENCE) return null;
        const profile = profileOf();
        const hour = hourNow(), period = periodAt(hour), precip = precipitation(profile);
        const day = $gameSystem.dayNightDay();
        if (profile === "outdoor") {
            if (precip && precip.type === "rain") {
                return precip.power >= 5 ? { name: "Rain4", volume: 70 } : precip.power >= 4 ? { name: "Rain3", volume: 62 } : { name: "Rain2", volume: 55 };
            }
            if (precip && precip.type === "snow") return { name: "Wind5", volume: 45 };
            if (period === "night") return { name: "Night", volume: 55 };
            if (nearWater(4) >= 4) return { name: "River", volume: 42 };
            return { name: day % 2 === 0 ? "Wind2" : "Wind4", volume: period === "day" ? 26 : 22 };
        }
        if (profile === "tavern") return precip && precip.type === "rain" ? { name: "Rain2", volume: 20 } : { name: hour >= 17 || hour < 3 ? "People2" : "People1", volume: 28 };
        if (profile === "interior") return precip && precip.type === "rain" ? { name: "Rain2", volume: 22 } : null;
        if (profile === "cave") return { name: "Drips", volume: 65 };
        return null;
    }
    function applyBed(want) {
        const cur = state.bed;
        if (state.switching > 0) { state.nextBed = want; return; }
        if (!want) {
            if (cur) { AudioManager.fadeOutBgs(2); state.bed = null; }
            return;
        }
        const vol = Math.round(want.volume * AMBIENCE_VOL);
        if (cur && cur.name === want.name) {
            if (Math.abs(cur.volume - vol) >= 2) {
                AudioManager.playBgs({ name: want.name, volume: vol, pitch: 100, pan: 0 });   // same track: only the volume changes
                cur.volume = vol;
            }
            return;
        }
        if (cur) {
            AudioManager.fadeOutBgs(1.5);
            state.switching = 95;
            state.nextBed = want;
            state.bed = null;
            return;
        }
        AudioManager.playBgs({ name: want.name, volume: vol, pitch: 100, pan: 0 });
        AudioManager.fadeInBgs(2);
        state.bed = { name: want.name, volume: vol };
    }

    function playBirds() {
        if (!BIRDS || !AMBIENCE) return;
        const profile = profileOf();
        if (profile !== "outdoor") return;
        const hour = hourNow(), period = periodAt(hour), precip = precipitation(profile), now = Graphics.frameCount;
        const c = audioContext(), dest = bus(c, "bgs");
        dest.gain.value = (ConfigManager.bgsVolume / 100) * AMBIENCE_VOL * 0.5;
        if (!precip && (period === "day" || period === "dawn" || period === "dusk")) {
            if (now >= state.nextBird) {
                birdCall(c, dest, c.currentTime + 0.02, pick(["tsit", "trill", "whistle", "tsit"]), rand(-0.8, 0.8));
                state.nextBird = now + Math.round(rand(period === "dawn" ? 4 : 9, period === "dawn" ? 10 : 22) * 60);
            }
            if (now >= state.nextCrow) {
                if (state.nextCrow > 0 && period !== "dusk") AudioManager.playSe({ name: "Crow", volume: 22, pitch: 108, pan: Math.round(rand(-60, 60)) });
                state.nextCrow = now + Math.round(rand(50, 130) * 60);
            }
        } else if (period === "night" && !precip) {
            if (now >= state.nextOwl) {
                if (state.nextOwl > 0) birdCall(c, dest, c.currentTime + 0.02, "owl", rand(-0.8, 0.8));
                state.nextOwl = now + Math.round(rand(25, 70) * 60);
            }
            if (now >= state.nextFrog) {
                if (state.nextFrog > 0 && nearWater(9) >= 4) AudioManager.playSe({ name: "Frog", volume: 30, pitch: Math.round(rand(92, 112)), pan: Math.round(rand(-50, 50)) });
                state.nextFrog = now + Math.round(rand(9, 22) * 60);
            }
        }
    }

    // ---- music that follows the hour
    function wantsTimeMusic() {
        if (!TIME_MUSIC || !$dataMap) return false;
        const note = $dataMap.note || "";
        if (/<TimeMusic:\s*off\s*>/i.test(note)) return false;
        if (/<TimeMusic:\s*on\s*>/i.test(note)) return true;
        return /<(Clouds|Weather):\s*on\s*>/i.test(note) && !$dataMap.autoplayBgm;
    }
    function musicTick() {
        if (!wantsTimeMusic()) { state.music = null; return; }
        const period = periodAt(hourNow());
        const track = TRACKS[period];
        if (!track) return;
        const cur = AudioManager._currentBgm;
        const mine = Object.values(TRACKS);
        // something else started by an event plays: leave it alone (after the first look at a new map)
        if (cur && cur.name && !mine.includes(cur.name) && !state.takeOver) return;
        if (state.musicSwitch > 0) { state.musicNext = { track, period }; return; }
        if (cur && cur.name === track) { state.music = track; state.musicPeriod = period; state.takeOver = false; return; }
        const volume = Math.round(MUSIC_VOL * ({ dawn: 0.9, day: 1, dusk: 0.95, night: 0.8 }[period] || 1));
        if (cur && cur.name) {
            AudioManager.fadeOutBgm(3);
            state.musicSwitch = 190;
            state.musicNext = { track, period };
            return;
        }
        AudioManager.playBgm({ name: track, volume, pitch: 100, pan: 0 });
        AudioManager.fadeInBgm(3);
        state.music = track;
        state.musicPeriod = period;
        state.takeOver = false;
    }

    // ---- a step for every stride
    function stepTick() {
        if (!FOOTSTEPS || !$gamePlayer) return;
        const x = $gamePlayer._realX, y = $gamePlayer._realY;
        const d = Math.abs(x - state.lastX) + Math.abs(y - state.lastY);
        state.lastX = x;
        state.lastY = y;
        if (d <= 0.0005 || d > 1.5 || $gamePlayer.isTransparent() || $gameMap.isEventRunning()) { if (d <= 0.0005) state.stepAcc = Math.min(state.stepAcc, STRIDE * 0.5); return; }
        state.stepAcc += d;
        if (state.stepAcc < STRIDE) return;
        state.stepAcc -= STRIDE;
        playStep($gamePlayer.x, $gamePlayer.y, $gamePlayer.isDashing());
    }
    function playStep(x, y, dash) {
        const c = audioContext(), dest = bus(c, "se");
        dest.gain.value = (ConfigManager.seVolume / 100) * FOOT_VOL;
        const kind = groundKindAt(x, y), profile = profileOf();
        const precip = precipitation(profile);
        footstep(c, dest, c.currentTime + 0.005, kind, (dash ? 1.2 : 1) * rand(0.85, 1.12), !!precip && precip.type === "rain" && profile === "outdoor");
        state.stepSide = -state.stepSide;
        state.steps = (state.steps || 0) + 1;
        state.lastKind = kind;
        return kind;
    }

    // ---- an autosave after a night's sleep
    function afterRest(def) {
        if (!AUTOSAVE) return;
        if (def && (def.restHours || 1) < 4) return;
        $gameTemp._atmoAutosave = true;
    }
    const _sleepUntilHour = Game_System.prototype.sleepUntilHour;
    Game_System.prototype.sleepUntilHour = function(hour) {
        const result = _sleepUntilHour.call(this, hour);
        if (AUTOSAVE) $gameTemp._atmoAutosave = true;
        return result;
    };
    Scene_Map.prototype.onAutosaveSuccess = function() {
        if ($gameTemp && typeof $gameTemp.pushLootPopup === "function") $gameTemp.pushLootPopup(0, "Gra zapisana (autozapis)", "#9fd4ff");
    };
    Scene_Map.prototype.onAutosaveFailure = function() {
        if ($gameTemp && typeof $gameTemp.pushLootPopup === "function") $gameTemp.pushLootPopup(0, "Autozapis nie powiódł się", "#ff9f8f");
    };

    // ------------------------------------------------------------------
    // The map scene drives everything
    // ------------------------------------------------------------------
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this.updateAtmosphere();
    };
    Scene_Map.prototype.updateAtmosphere = function() {
        if (!$gameSystem || !$dataMap || !$gamePlayer) return;
        if ($gameMap.mapId() !== state.mapId) {
            state.mapId = $gameMap.mapId();
            state.takeOver = true;
            state.lastCheck = -999;
            state.lastX = $gamePlayer._realX;
            state.lastY = $gamePlayer._realY;
            state.stepAcc = 0;
            state.nextBird = Graphics.frameCount + 120;
        }
        stepTick();
        const now = Graphics.frameCount;
        if (state.switching > 0 && --state.switching === 0) {
            const want = state.nextBed;
            state.nextBed = null;
            if (want) applyBed(want);
        }
        if (state.musicSwitch > 0 && --state.musicSwitch === 0) {
            const next = state.musicNext;
            state.musicNext = null;
            if (next && wantsTimeMusic()) {
                AudioManager.playBgm({ name: next.track, volume: Math.round(MUSIC_VOL * ({ dawn: 0.9, day: 1, dusk: 0.95, night: 0.8 }[next.period] || 1)), pitch: 100, pan: 0 });
                AudioManager.fadeInBgm(3);
                state.music = next.track;
                state.musicPeriod = next.period;
                state.takeOver = false;
            }
        }
        if (now - state.lastCheck >= 60) {
            state.lastCheck = now;
            applyBed(desiredBed());
            musicTick();
        }
        playBirds();
        // the autosave waits for a calm moment: no message or event, screen visible
        if ($gameTemp._atmoAutosave && !$gameMessage.isBusy() && !$gameMap.isEventRunning() && $gameScreen.brightness() >= 250 && !$gameTemp._pendingSummary) {
            $gameTemp._atmoAutosave = false;
            this.requestAutosave();
        }
    };

    window.Atmosphere = {
        periodAt, profileOf, desiredBed, groundKindAt, kindFromColour, footstep, birdCall, STEP, BIRD, playStep, afterRest, audioContext, bus,
        state, TRACKS, wantsTimeMusic, musicTick, applyBed
    };
})();
