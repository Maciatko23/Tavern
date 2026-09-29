/*:
 * @target MZ
 * @plugindesc Burza: ciemniejące niebo, błyskawice, grzmoty z opóźnieniem, wicher gnący drzewa, ukośna ulewa i lecące liście. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Survival
 * @orderAfter Survival
 *
 * @param thunderVolume
 * @text Głośność grzmotów
 * @type number
 * @min 0
 * @max 150
 * @default 100
 * @desc Procent głośności grzmotów i podmuchów (100 = jak w tabelach wtyczki).
 *
 * @help
 * BURZA
 *   Kiedy jest burza, planuje Survival.js (plan pogody na każdy dzień): część deszczowych dni to burze
 *   - latem najczęściej, zimą nigdy - po południu albo wieczorem, więc bywa też burza nocą.
 *   Ta wtyczka ją pokazuje i daje jej dźwięk. Siła burzy to liczba 0..1 (Survival.stormLevel):
 *
 *   Zbiera się (godzinę przed deszczem): niebo ciemnieje, zrywa się wiatr, drzewa i trawa gną się coraz
 *     mocniej, ptaki milkną, z daleka słychać pomruki i widać słabe łuny. Postać mówi w dymku "Idzie burza...", a gdy uderzy - "Burza!".
 *   Szaleje: ukośna ulewa (pogoda MZ "storm", z wiatrem w prawo), pioruny, wicher, lecące liście i gałązki,
 *     dym z ogniska kładzie się poziomo, cienie chmur znikają pod jednym ciemnym niebem.
 *   Odchodzi: grzmoty coraz dalsze i cichsze, wiatr słabnie, zostaje zwykły deszcz.
 *   Przejaśnia się: gdy burza słabnie, przez chmury przebijają się promienie słońca - kilka ciepłych,
 *     ukośnych smug światła z góry, lekko się przesuwają i przygasają; najjaśniejsze tuż po burzy, gasną
 *     po ok. 1,5 godziny gry. Tylko za dnia i pod gołym niebem.
 *
 * PIORUN
 *   Błysk: cały ekran na chwilę jaśnieje (czasem mignie dwa-trzy razy). W nocy błysk na moment zdejmuje
 *   ciemność (warstwa nocy z Farming_Render.js): widać cały las w prawdziwych kolorach, potem znów ciemno.
 *   Bliski piorun rysuje zygzak z nieba do ziemi, a ekran lekko drży.
 *   Grzmot przychodzi po błysku z opóźnieniem jak naprawdę (około 3 s na kilometr): bliski od razu i głośno,
 *   daleki po 2-3 sekundach, cicho i nisko. Pod dachem słychać tylko stłumione grzmoty (bez błysków).
 *
 * PIORUN W DRZEWO
 *   Bliski piorun w czasie ulewy może (30%) trafić w stojące drzewo na ekranie - najwyżej dwa drzewa
 *   jednego dnia burzy, nigdy owocowe ani tuż obok gracza. Zygzak kończy się na koronie, sypią się
 *   iskry i spalone liście, dymek "Piorun trafił w drzewo!". Drzewo zostaje zwęglone (ChoppableTree.js:
 *   czarne, kruche, daje węgiel drzewny zamiast drewna). Najpierw pas ognia schodzi od czubka do
 *   ziemi (ok. 0,2 godziny gry) i bucha z niego gęsty, ciemny dym. Potem drzewo przez 30 minut gry
 *   mieni się żarem, a z żarzących się miejsc snuje się jaśniejszy dym: z początku dużo, pod koniec
 *   cienka smużka. Dym unosi się, rozlewa i odpływa z wiatrem; w nocy żar lekko rozjaśnia mrok.
 *
 * DLA INNYCH WTYCZEK (window.Storm)
 *   level()  siła burzy teraz (0..1, niebo - także pod dachem)
 *   wind()   wiatr na tej mapie (0..1, 0 pod dachem; wygładzony) - ChoppableTree, SwayingFoliage, CloudShadows, dym
 *   clock()  zegar wiatru w sekundach: biegnie szybciej, gdy wieje (drzewa liczą z niego swoje kołysanie)
 *   flash()  jasność błysku teraz (0..1) - warstwa nocy
 *   rays()   siła promieni słońca po burzy (0..1)
 *   adjustTone(tone)  ton ekranu przyciemniony burzą - DayNightCycle
 *   strike(d, opts)  piorun teraz, d = odległość 0 (tuż obok) .. 1 (daleko); opts.tree = drzewo (zdarzenie)
 *            albo true (dowolne na ekranie) - testy i menu F9
 *
 * ZDARZENIA (szyna Tawerna.on)
 *   stormStart { day, hour, phase, level }  burza pojawia się na niebie (zbiera się)
 *   stormEnd   { day, hour, phase, level }  burza minęła (phase null, level 0)
 *              - obie widziane z mapy: też zaraz po wczytaniu gry, gdy niebo tam jest inne
 *   lightning  { d, strength, x, y, bolt, outdoors, hitTree, tree, mapId }  każdy piorun, także pod
 *              dachem (tam bez błysku, tylko grzmot): d 0 blisko .. 1 daleko, strength 1 .. 0,2,
 *              x, y w pikselach ekranu (y: koniec zygzaka albo null), hitTree + tree = trafione drzewo
 */
(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Storm.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    const PLUGIN = "Storm";
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v !== undefined && v !== "" && isFinite(Number(v)) ? Number(v) : d);
    const VOLUME = num(params.thunderVolume, 100) / 100;

    // Sounds, picked by measuring the RTP files (envelope and brightness): the deep, rolling ones make the rumble (played
    // low and slow when far away), the bright ones that start at full strength are the crack of a strike close by (a rumble
    // follows it). Thunder12-14 are left out: bright and crackling, they are the zap of a spell, not a storm. The gusts are
    // the wind whooshes that rise and fall slowly (the hissy Wind2/Wind8 sound like a sword).
    const CRACKS = ["Thunder10", "Thunder8", "Thunder6"];
    const RUMBLES = ["Thunder9", "Thunder7", "Thunder11", "Thunder1", "Thunder4", "Thunder5"];
    const GUSTS = ["Wind10", "Wind11", "Wind9", "Wind6"];

    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const clamp01 = v => Math.max(0, Math.min(1, v));

    const state = {
        t: 0,             // frames of the map scene (the storm only lives while the map runs)
        level: 0,         // the sky, 0..1
        phase: null,      // "gather" | "rage" | "pass" | null
        outdoors: false,
        wind: 0,          // smoothed, this map
        clock: 0,         // wind clock, seconds
        pulses: [],       // flash pulses { at, amp }
        flash: 0,
        nextStrike: 0,
        nextGust: 0,
        thunders: [],     // { at, se }
        strikes: 0,       // how many so far (tests)
        last: null,       // the last strike { d, bolt, at }
        rays: 0           // the sun breaking through after a storm, 0..1 (raysAt)
    };
    const pending = [];   // strikes asked for while the map was not running (the F9 menu): their opts

    // the trees hit on a storm day, kept in the save (Tawerna.state "stormTrees"; once $gameSystem._stormTrees, still there as an alias)
    const trees = T.state.define("stormTrees", () => ({ day: 0, n: 0 }), { version: 1, adopt: "_stormTrees", owner: PLUGIN });

    const survival = () => T.api("Survival");
    const chopper = () => T.api("ChoppableTree");
    // the hour each struck tree was hit: ChoppableTree.js's saved state "smoulder" (its embers read it too; an older save's
    // $gameSystem._smoulder is taken over there). Without ChoppableTree.js: nothing smoulders (a throwaway {}, nothing defined here)
    const smoulders = () => (T.state.spec("smoulder") ? T.state("smoulder") : {});
    function readSky() {
        const S = survival();
        if (!S || !S.stormLevel || !$gameSystem || !$gameSystem.dayNightDay) return;
        const day = T.time.day(), hour = T.time.hour();
        state.level = S.stormLevel(day, hour);
        state.phase = state.level > 0 ? S.stormPhase(day, hour) : null;
        state.outdoors = !!(S.isOutdoors && S.isOutdoors());
        state.rays = state.outdoors ? raysAt(day, hour) : 0;
    }
    // ---- the sun breaks through as the storm passes (user): from RAYS.from hours before the storm's end (it is dying away) until
    // RAYS.until hours after it, rising over RAYS.rise and fading over the last RAYS.fall; only by day (dimmer at dawn and dusk)
    const RAYS = { from: -0.25, rise: 0.35, until: 1.5, fall: 0.75, dawn: 6, dusk: 19.5 };
    function raysAt(day, hour) {
        const S = survival(), plan = S && S.weatherPlan ? S.weatherPlan(day) : null, st = plan && plan.storm;
        if (!st) return 0;
        const t = hour - st.end;
        if (t < RAYS.from || t > RAYS.until) return 0;
        const up = clamp01((t - RAYS.from) / RAYS.rise), down = clamp01((RAYS.until - t) / RAYS.fall);
        const light = clamp01(Math.min(hour - RAYS.dawn, RAYS.dusk - hour));
        return Math.min(up, down) * light;
    }

    // ---- lightning
    function flashAt(t) {
        let v = 0;
        for (const p of state.pulses) if (t >= p.at) v = Math.max(v, p.amp * (t - p.at < 3 ? 1 : Math.exp(-(t - p.at - 3) / 4.5)));   // full for 3 frames, then fading
        return v;
    }
    // (through the core's pool: a file that does not load stays silent instead of stopping the game)
    function playSe(name, volume, pitch, pan) {
        const muffled = !state.outdoors;   // under a roof: quieter and duller
        T.audio.se(name, { volume: Math.round(volume * VOLUME * (muffled ? 0.5 : 1)), pitch: Math.round(pitch - (muffled ? 12 : 0)), pan: Math.round(pan || 0) });
    }
    // ---- lightning hitting a tree (ChoppableTree.js chars it: charcoal instead of wood). Only a close strike while the
    // storm rages, only a tree on the screen (not right next to the player), at most TREES_PER_STORM a day.
    const TREE_CHANCE = 0.3, TREES_PER_STORM = 2;
    // how long a struck tree burns down (the band of embers from the tip to the foot) and smoulders in all: ChoppableTree.js's numbers
    const burnHours = () => (chopper() && chopper().EMBER_FRONT) || 0.2;
    const smoulderHours = () => (chopper() && chopper().EMBER_LIFE) || 0.7;
    const hoursNow = () => T.time.day() * 24 + T.time.hour();
    function treesHitToday() {
        const s = trees();
        return s.day === T.time.day() ? s.n : 0;
    }
    function spriteOf(event) {
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        return set && set._characterSprites ? set._characterSprites.find(s => s._character === event) : null;
    }
    // where the lightning hits: the top of the crown, on the screen
    function crownOf(event) {
        // (a sprite that has not been updated yet - the first frame of a map scene - has no bitmap: then a usual tree height)
        const s = spriteOf(event), h = s && s.bitmap && s.bitmap.isReady() ? s.patternHeight() : 144;
        return { x: event.screenX(), y: event.screenY() - h * 0.72 };
    }
    function treeInView() {
        const C = chopper();
        if (!C || !C.strikeableTrees) return null;
        const W = Graphics.width, H = Graphics.height;
        const list = C.strikeableTrees().filter(e => {
            const x = e.screenX(), y = e.screenY();
            return x > 40 && x < W - 40 && y > 140 && y < H + 20 && Math.abs(e.x - $gamePlayer.x) + Math.abs(e.y - $gamePlayer.y) >= 2;
        });
        return list.length ? pick(list) : null;
    }
    function hitTree(tree, pan) {
        const C = chopper();
        if (!C.charTree(tree)) return false;
        const day = T.time.day(), s = trees();
        if (s.day !== day) { s.day = day; s.n = 0; }
        s.n++;
        smoulders()[$gameMap.mapId() + ":" + tree.eventId()] = hoursNow();
        state.thunders.push({ at: state.t + 8, se: ["Fire2", 70, 90, pan] });   // the crown catches fire for a moment
        const coal = $dataItems[C.CHARCOAL];
        T.popup("Piorun trafił w drzewo!", { icon: coal ? coal.iconIndex : 0, color: "#ffc27a" });
        return true;
    }

    // a strike d (0 = right here .. 1 = far away): the flash at once, the thunder after the sound has travelled.
    // opts.tree: a tree to hit (tests; true = any tree in view)
    function strike(d, opts) {
        d = clamp01(d === undefined ? Math.random() : d);
        let tree = null;
        if (state.outdoors && ((opts && opts.tree) || (state.phase === "rage" && d < 0.3 && treesHitToday() < TREES_PER_STORM && Math.random() < TREE_CHANCE))) {
            tree = opts && opts.tree instanceof Game_Event ? opts.tree : treeInView();
            if (tree) d = Math.min(d, 0.1);
            else if (opts && opts.tree) T.popup("Nie ma tu drzewa, w które mógłby trafić", { color: "#bcd8ff" });   // F9
        }
        const t = state.t, crown = tree ? crownOf(tree) : null;
        const x = crown ? clamp01(crown.x / Graphics.width) : rand(0.12, 0.88), pan = (x - 0.5) * 120;
        let bolt = false;
        if (state.outdoors) {
            const amp = 1 - 0.8 * d;
            state.pulses.push({ at: t, amp });
            if (Math.random() < 0.6) state.pulses.push({ at: t + Math.round(rand(4, 8)), amp: amp * rand(0.5, 0.9) });
            if (Math.random() < 0.25) state.pulses.push({ at: t + Math.round(rand(10, 16)), amp: amp * 0.6 });
            if (crown) { bolt = true; state.bolt = { x, ground: crown.y / Graphics.height, at: t, amp, fresh: true, tree: true }; }
            else if (d < 0.3 || (d < 0.55 && Math.random() < 0.6)) { bolt = true; state.bolt = { x, ground: 0.25 + 0.5 * (1 - d), at: t, amp, fresh: true }; }
            if (d < 0.2) $gameScreen.startShake(4, 9, 20);
        }
        const struck = !!tree && hitTree(tree, pan);
        const delay = Math.round(4 + d * 190);   // about 3 s for the far ones
        if (d < 0.22) {
            state.thunders.push({ at: t + Math.round(rand(1, 5)), se: [pick(CRACKS), rand(92, 100), rand(95, 108), pan] });
            state.thunders.push({ at: t + Math.round(rand(16, 26)), se: [pick(RUMBLES), 70, rand(78, 88), pan] });
        } else if (d < 0.55) {
            state.thunders.push({ at: t + delay, se: [pick(RUMBLES), 80 - 45 * (d - 0.22), rand(84, 96), pan] });
        } else {
            state.thunders.push({ at: t + delay, se: [pick(RUMBLES), 50 - 25 * (d - 0.55), rand(58, 72), pan * 0.6] });
        }
        state.strikes++;
        state.last = { d, bolt, at: t, tree: struck ? tree.eventId() : 0 };
        // the bus: every strike (under a roof too: no flash there, only the thunder); x, y in screen pixels (y: the bolt's end, or null)
        T.emit("lightning", { d, strength: 1 - 0.8 * d, x: Math.round(x * Graphics.width), y: bolt ? Math.round(state.bolt.ground * Graphics.height) : null,
            bolt, outdoors: state.outdoors, hitTree: struck, tree: state.last.tree, mapId: $gameMap.mapId() });
    }
    // when the next strike comes, and how far: gathering and passing, only far ones; raging, one in three close
    function scheduleStrikes() {
        if (state.level < 0.2 || !state.phase) return;
        if (state.t < state.nextStrike) return;
        if (state.nextStrike > 0) {
            if (state.phase === "rage") strike(Math.random() < 0.33 ? rand(0, 0.22) : rand(0.22, 1));
            else strike(rand(state.phase === "gather" ? 0.75 : 0.55, 1));
        }
        const gap = state.phase === "rage" ? rand(3, 8) / (0.6 + 0.4 * state.level) : rand(8, 16);
        state.nextStrike = state.t + Math.round(gap * 60);
    }
    function playThunders() {
        if (!state.thunders.length) return;
        const due = state.thunders.filter(x => state.t >= x.at);
        if (!due.length) return;
        state.thunders = state.thunders.filter(x => state.t < x.at);
        for (const x of due) playSe(...x.se);
    }
    function playGusts() {
        if (!state.outdoors || state.wind < 0.35) return;
        if (state.t < state.nextGust) return;
        if (state.nextGust > 0) playSe(pick(GUSTS), 18 + 30 * state.wind, rand(70, 88), rand(-70, 70));
        state.nextGust = state.t + Math.round((rand(4, 10) / (0.5 + state.wind)) * 60);
    }

    // the bus: "stormStart" as a storm shows in the sky, "stormEnd" when it is gone (seen from the map: also right after a load)
    let stormOn = false;
    function stormEdge() {
        const on = state.level > 0;
        if (on === stormOn) return;
        stormOn = on;
        T.emit(on ? "stormStart" : "stormEnd", { day: T.time.day(), hour: T.time.hour(), phase: state.phase, level: state.level });
    }

    // settled: frames the map scene has been running (the F9 strike waits until the map is back on the screen)
    function update(settled) {
        state.t++;
        readSky();
        stormEdge();
        const target = state.outdoors ? state.level : 0;
        state.wind += Math.max(-0.02, Math.min(0.02, target - state.wind));   // no sudden jumps (map change, F9)
        state.clock += (1 + 0.9 * state.wind) / 60;
        if (pending.length && settled > 20) strike(0.08, pending.shift());   // asked for from the F9 menu
        scheduleStrikes();
        playThunders();
        playGusts();
        state.pulses = state.pulses.filter(p => state.t - p.at < 40);
        state.flash = state.outdoors ? Math.min(1, flashAt(state.t)) : 0;
    }

    // the sky darkens with the storm (added to DayNightCycle's tone of the hour; the flash itself is its own layer)
    function adjustTone(tone) {
        const L = state.outdoors ? state.level : 0;
        if (L <= 0) return tone;
        return [tone[0] - 52 * L, tone[1] - 46 * L, tone[2] - 20 * L, Math.min(255, tone[3] + 72 * L)].map(v => Math.round(Math.max(-255, Math.min(255, v))));
    }

    // ---- the rain of a storm slants with the wind (to the right, like the clouds and the trees), harder as it blows
    Weather.prototype._updateStormSprite = function(sprite) {
        sprite.bitmap = this._stormBitmap;
        const W = Math.max(0.5, state.wind);
        sprite.rotation = -(Math.PI / 12 + (Math.PI / 12) * W);
        const v = 9 + 3 * W;
        sprite.ax -= v * Math.sin(sprite.rotation);
        sprite.ay += v * Math.cos(sprite.rotation);
        sprite.opacity -= 8;
    };
    const _Weather_rebornSprite = Weather.prototype._rebornSprite;
    Weather.prototype._rebornSprite = function(sprite) {
        _Weather_rebornSprite.call(this, sprite);
        if (this.type === "storm") sprite.ax -= 60;   // it drifts right, so it is born further left
    };

    // ---- leaves and twigs flying across the screen
    const LEAF_COUNT = 40;
    let leafBitmaps = null;
    function makeLeafBitmaps() {
        if (leafBitmaps) return leafBitmaps;
        const shapes = [
            [".##..", "####.", ".###.", "...#."],   // a leaf with its stem
            ["..##.", ".###.", "###..", "#...."],
            [".#.", "###", ".#."],
            ["#######"],                           // a twig
            ["##....", "..####", "....#."]          // a forked twig
        ];
        const leafColours = ["#5d8a3a", "#77a046", "#4a6e2c", "#8a6a32", "#a88a3c", "#6f8f3a"];
        leafBitmaps = [];
        for (let k = 0; k < 10; k++) {
            const shape = shapes[k % shapes.length], twig = shape.length === 1 || shape[0].length > 5;
            const colour = twig ? (k % 2 ? "#6b4a2a" : "#5a3d22") : leafColours[k % leafColours.length];
            const w = Math.max(...shape.map(r => r.length)), h = shape.length;
            const bmp = new Bitmap(w, h);
            bmp.smooth = false;
            shape.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === "#") bmp.fillRect(x, y, 1, 1, colour); });
            leafBitmaps.push(bmp);
        }
        return leafBitmaps;
    }
    function Sprite_StormLeaves() {
        this.initialize(...arguments);
    }
    Sprite_StormLeaves.prototype = Object.create(Sprite.prototype);
    Sprite_StormLeaves.prototype.constructor = Sprite_StormLeaves;
    Sprite_StormLeaves.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        const bitmaps = makeLeafBitmaps();
        this._leaves = [];
        for (let i = 0; i < LEAF_COUNT; i++) {
            const s = new Sprite(bitmaps[i % bitmaps.length]);
            s.anchor.set(0.5, 0.5);
            s.scale.set(2, 2);
            s.visible = false;
            s._active = false;
            this.addChild(s);
            this._leaves.push(s);
        }
    };
    Sprite_StormLeaves.prototype.respawn = function(s, anywhere) {
        const W = Graphics.width, H = Graphics.height;
        s.x = anywhere ? rand(0, W) : -rand(10, 260);
        s.y = rand(-20, H * 0.92);
        s._vx = rand(5, 10);
        s._vy = rand(0.2, 1.4);
        s._ph = rand(0, Math.PI * 2);
        s._dph = rand(0.08, 0.22);
        s._bob = rand(0.6, 2.2);
        s._spin = rand(-0.35, 0.35);
    };
    Sprite_StormLeaves.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const n = state.outdoors ? Math.round(LEAF_COUNT * clamp01((state.wind - 0.25) / 0.75)) : 0;
        const k = 0.5 + state.wind;
        this._leaves.forEach((s, i) => {
            if (i >= n) {   // not needed now: finish crossing the screen, then rest
                if (!s._active) return;
                if (s.x > Graphics.width + 20) { s._active = false; s.visible = false; return; }
            } else if (!s._active) {
                s._active = true;
                s.visible = true;
                this.respawn(s, state.t < 5);
            }
            s._ph += s._dph;
            s.x += s._vx * k;
            s.y += s._vy + Math.sin(s._ph) * s._bob;
            s.rotation += s._spin;
            if (s.x > Graphics.width + 20 || s.y > Graphics.height + 20) {
                if (i < n) this.respawn(s, false);
                else { s._active = false; s.visible = false; }
            }
        });
    };

    // ---- a struck tree smokes while it burns and smoulders. Pixel-art puffs (2 px cells, like the chimneys' smoke) rise from where
    // its embers glow at the moment (ChoppableTree.emberSpots): while the band of fire creeps down the tree, thick dark smoke streams
    // up from it; then, for the half hour the embers left in it smoulder, paler smoke rises in a few thin columns from glowing
    // spots (each column goes out after a while and another starts elsewhere) - five at first, a single wisp as the last embers die.
    // A puff is small and faint where it leaves the tree and grows denser and wider as it climbs. Every puff keeps its place on the
    // map (it scrolls with it), slows and spreads as it climbs, sways more the higher it gets, and the wind carries it off. Under the
    // night layer, so the dark covers it too. smoulders() = { "mapId:eventId": hour it was hit } (_tw.smoulder)
    const SMOKE_TONES = { dark: ["#8a8480", "#6a6561", "#4e4a47"], pale: ["#cfd1d4", "#adb0b5", "#8b8f95"] };
    const SMOKE_KINDS = 4, MAX_PUFFS = 120;
    const smokeCache = {};
    function smokeBitmap(tone, v) {
        const key = tone + v;
        if (smokeCache[key]) return smokeCache[key];
        const S = 24, bmp = new Bitmap(S, S), ctx = bmp.context;
        let seed = v * 7919 + (tone === "dark" ? 131 : 17);
        const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        // a few overlapping round lumps, cut into 2 px cells: light towards the upper left, darker underneath, a dithered rim
        const lumps = [[12, 13, 6]];
        for (let i = 0; i < 4; i++) lumps.push([12 + (r() - 0.5) * 9, 12 + (r() - 0.5) * 7, 2.5 + r() * 3]);
        const [light, mid, dark] = SMOKE_TONES[tone];
        for (let py = 0; py < S; py += 2) {
            for (let px = 0; px < S; px += 2) {
                const cx = px + 1, cy = py + 1, d = Math.min(...lumps.map(([x, y, rr]) => Math.hypot(cx - x, cy - y) - rr));
                if (d > 0 || (d > -1.6 && (px + py) % 4 === 0)) continue;
                ctx.fillStyle = cx + cy < 21 ? light : cx + cy > 27 ? dark : mid;
                ctx.fillRect(px, py, 2, 2);
            }
        }
        bmp._baseTexture.update();
        return (smokeCache[key] = bmp);
    }
    function Sprite_Smoulder() {
        this.initialize(...arguments);
    }
    Sprite_Smoulder.prototype = Object.create(Sprite.prototype);
    Sprite_Smoulder.prototype.constructor = Sprite_Smoulder;
    Sprite_Smoulder.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._entries = {};
    };
    // one struck tree: its puffs (parts: the particles, puffs: their sprites), how much is due to come out (acc), fade when it stops
    Sprite_Smoulder.prototype.entry = function(key) {
        return this._entries[key] || (this._entries[key] = { parts: [], puffs: [], vents: [], acc: 0, fade: 1, event: null });
    };
    Sprite_Smoulder.prototype.drop = function(key) {
        const e = this._entries[key];
        if (!e) return;
        for (const p of e.puffs) this.removeChild(p);
        delete this._entries[key];
    };
    // a glowing pixel of the tree now (or, before the embers are drawn, a place in its crown), relative to the foot of the tree
    function emberSpot(event) {
        const C = chopper(), spots = C && C.emberSpots ? C.emberSpots(spriteOf(event)) : [];
        if (spots.length) {
            const s = spots[Math.floor(Math.random() * spots.length)];
            return { dx: s.x - event.screenX(), dy: s.y - event.screenY() };
        }
        const c = crownOf(event);
        return { dx: c.x - event.screenX() + rand(-10, 10), dy: c.y - event.screenY() + rand(-6, 30) };
    }
    // a new puff: while it burns, from the band of fire (a glowing pixel, anywhere along it); while it smoulders, from one of its columns
    Sprite_Smoulder.prototype.spawn = function(e, burning, strength) {
        const from = burning || !e.vents.length ? emberSpot(e.event) : e.vents[Math.floor(Math.random() * e.vents.length)];
        let q = e.parts.find(p => !p.alive);
        if (!q) {
            if (e.parts.length >= MAX_PUFFS) return;
            const spr = new Sprite();
            spr.anchor.set(0.5, 0.5);
            this.addChild(spr);
            q = { spr };
            e.parts.push(q);
            e.puffs.push(spr);
        }
        const tone = (Math.random() < 0.8) === burning ? "dark" : "pale";   // mostly dark while it burns, mostly pale while it smoulders
        q.spr.bitmap = smokeBitmap(tone, Math.floor(Math.random() * SMOKE_KINDS));
        q.spr.visible = true;
        Object.assign(q, { alive: true, t: 0, life: burning ? rand(110, 170) : rand(220, 320), dx: from.dx + rand(-2, 2), dy: from.dy - (burning ? 6 : 2),
            vy: burning ? -rand(1.3, 1.8) : -rand(0.8, 1.1), vx: rand(-0.08, 0.08), s0: burning ? rand(0.45, 0.7) : rand(0.3, 0.45), s1: burning ? rand(2.6, 3.4) : rand(2.2, 3),
            a: burning ? 0.95 : 0.9 * (0.45 + 0.55 * strength), ph: Math.random() * 6.28, sw: rand(0.12, 0.3), ramp: burning ? 0.22 : 0.28 });
    };
    // the puffs in the air: up, slower as they spread, swaying, carried off by the wind, fading
    Sprite_Smoulder.prototype.drift = function(e) {
        if (!e.event) return;
        const fx = e.event.screenX(), fy = e.event.screenY(), W = state.wind;
        for (const q of e.parts) {
            if (!q.alive) continue;
            const k = ++q.t / q.life;
            if (k >= 1) { q.alive = false; q.spr.visible = false; q.spr.alpha = 0; continue; }
            q.dx += q.vx + Math.sin(q.ph + q.t * 0.05) * q.sw * Math.min(1, k * 3) * (1 - 0.5 * W) + (0.1 + 1.3 * W) * Math.min(1, k * 2);
            q.dy += q.vy * (1 - 0.55 * k) * (1 - 0.45 * W);
            q.spr.x = Math.round(fx + q.dx);
            q.spr.y = Math.round(fy + q.dy);
            const sc = q.s0 + (q.s1 - q.s0) * Math.sqrt(k);
            q.spr.scale.set(sc, sc);
            q.spr.alpha = q.a * Math.min(1, k / q.ramp) * Math.pow(1 - k, 1.3) * e.fade;   // faint where it leaves the tree
        }
    };
    Sprite_Smoulder.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const store = $gameSystem ? smoulders() : {}, now = hoursNow(), mapId = $gameMap.mapId();
        const front = burnHours(), life = smoulderHours(), live = {}, C = chopper();
        for (const key of Object.keys(store)) {
            const age = now - store[key];
            if (age > life || age < 0) { delete store[key]; continue; }
            const [m, id] = key.split(":").map(Number), event = m === mapId ? $gameMap.event(id) : null;
            if (!event || !C || !C.isCharred(event) || $gameSelfSwitches.value([m, id, "A"])) continue;   // felled: it stops
            live[key] = true;
            const e = this.entry(key), burning = age < front;
            e.event = event;
            e.fade = 1;
            // (strength: 1 when the band reaches the foot, 0 when the last ember dies; the smoke thins faster than linearly at first)
            const strength = burning ? 1 : clamp01(1 - (age - front) / (life - front));
            if (burning) e.vents.length = 0;
            else {   // the columns: 5 when the band has passed, 1 at the end; each goes out after a while and another starts elsewhere
                const want = 1 + Math.round(4 * strength);
                e.vents = e.vents.filter(v => v.until > state.t).slice(0, want);
                while (e.vents.length < want) e.vents.push(Object.assign(emberSpot(event), { until: state.t + rand(180, 480) }));
            }
            e.acc += burning ? 0.5 : 0.08 + 0.3 * Math.pow(strength, 1.4);   // puffs a frame
            while (e.acc >= 1) { e.acc--; this.spawn(e, burning, strength); }
        }
        for (const key of Object.keys(this._entries)) {
            const e = this._entries[key];
            if (!live[key]) e.fade = Math.max(0, e.fade - 1 / 30);   // felled, or burnt out: what is still in the air fades away
            this.drift(e);
            if (!live[key] && (e.fade === 0 || !e.parts.some(q => q.alive))) this.drop(key);
        }
    };

    // ---- the flash over everything (a cold white light added to the picture) and the bolt
    function Sprite_StormSky() {
        this.initialize(...arguments);
    }
    Sprite_StormSky.prototype = Object.create(PIXI.Container.prototype);
    Sprite_StormSky.prototype.constructor = Sprite_StormSky;
    Sprite_StormSky.prototype.initialize = function() {
        PIXI.Container.call(this);
        this._light = new PIXI.Graphics();
        this._light.beginFill(0xdfe8ff, 1);
        this._light.drawRect(-64, -64, Graphics.width + 128, Graphics.height + 128);   // wider than the screen: it shakes with it
        this._light.endFill();
        this._light.blendMode = PIXI.BLEND_MODES.ADD;
        this._light.alpha = 0;
        this.addChild(this._light);
        this._bolt = new PIXI.Graphics();
        this._bolt.alpha = 0;
        this.addChild(this._bolt);
    };
    function boltPath(x0, y0, x1, y1, rough) {
        let pts = [{ x: x0, y: y0 }, { x: x1, y: y1 }], off = rough;
        for (let k = 0; k < 6; k++) {
            const next = [pts[0]];
            for (let i = 0; i < pts.length - 1; i++) {
                const a = pts[i], b = pts[i + 1];
                next.push({ x: (a.x + b.x) / 2 + rand(-1, 1) * off, y: (a.y + b.y) / 2 + rand(-1, 1) * off * 0.2 }, b);
            }
            pts = next;
            off *= 0.55;
        }
        return pts;
    }
    Sprite_StormSky.prototype.drawBolt = function(bolt) {
        const g = this._bolt, W = Graphics.width, H = Graphics.height;
        const x0 = bolt.x * W + rand(-80, 80), x1 = bolt.x * W, y1 = bolt.ground * H;   // (a tree: y1 is its crown)
        const main = boltPath(x0, -20, x1, y1, 90);
        const branches = [];
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
            const from = main[Math.floor(rand(0.2, 0.7) * main.length)];
            branches.push(boltPath(from.x, from.y, from.x + rand(-140, 140), from.y + rand(60, 170), 40).slice(0, 40));
        }
        g.clear();
        const stroke = (pts, width, colour, alpha) => {
            g.lineStyle(width, colour, alpha);
            g.moveTo(Math.round(pts[0].x), Math.round(pts[0].y));
            for (const p of pts) g.lineTo(Math.round(p.x), Math.round(p.y));
        };
        for (const [w, c, a] of [[16, 0x7f9cff, 0.18], [6, 0xc9d6ff, 0.6], [3, 0xffffff, 1]]) {
            stroke(main, w, c, a);
            for (const b of branches) stroke(b, Math.max(1, w / 2), c, a * 0.8);
        }
    };
    const nightNow = () => ($gameSystem._dayNightTinting && T.call("Farming", "nightAmount")) || 0;
    Sprite_StormSky.prototype.update = function() {
        const night = nightNow();
        this._light.alpha = state.flash * (0.5 - 0.22 * night);   // at night the lifted darkness does most of the work
        const bolt = state.bolt;
        if (bolt && bolt.fresh) { bolt.fresh = false; this.drawBolt(bolt); }
        if (bolt && state.t - bolt.at < 22) this._bolt.alpha = clamp01((state.flash / Math.max(0.01, bolt.amp)) * 1.3);
        else { this._bolt.alpha = 0; if (bolt) state.bolt = null; }
    };

    // ---- the sun rays: soft shafts of warm light slanting down from the upper left (screen space, over the rain, under the flash);
    // each drifts and breathes on its own, so the light seems to come through moving gaps in the clouds
    function rayBitmap() {   // bright near the top, fading down; soft on both sides
        const W = 64, H = 256, bmp = new Bitmap(W, H), ctx = bmp.context, img = ctx.createImageData(W, H), edge = Math.exp(-3.2);
        for (let y = 0; y < H; y++) {
            const v = y / H, fy = Math.min(1, v / 0.12) * Math.pow(1 - v, 1.5);
            for (let x = 0; x < W; x++) {
                const u = ((x + 0.5) / W) * 2 - 1, fx = Math.max(0, (Math.exp(-u * u * 3.2) - edge) / (1 - edge));
                const i = (y * W + x) * 4;
                img.data[i] = 255; img.data[i + 1] = 236; img.data[i + 2] = 188; img.data[i + 3] = Math.round(255 * fx * fy);
            }
        }
        ctx.putImageData(img, 0, 0);
        bmp._baseTexture.update();
        return bmp;
    }
    // the shafts fall on spots of the MAP (RAY_SPACING tiles apart, a little scattered) and scroll with it like the cloud shadows;
    // each shaft stands on its spot and reaches up-left out of the screen (the sun is up to the left)
    const RAY_TILT = -0.38, RAY_SPACING = { x: 4.5, y: 14 };
    function Sprite_SunRays() {
        this.initialize(...arguments);
    }
    Sprite_SunRays.prototype = Object.create(PIXI.Container.prototype);
    Sprite_SunRays.prototype.constructor = Sprite_SunRays;
    Sprite_SunRays.prototype.initialize = function() {
        PIXI.Container.call(this);
        this._bmp = rayBitmap();
        this._shafts = [];
        this._mapId = 0;
        this._shown = 0;
        this.visible = false;
    };
    // the shafts of this map: a scattered grid of spots over all of it
    Sprite_SunRays.prototype.build = function() {
        for (const sh of this._shafts) this.removeChild(sh);
        this._shafts = [];
        this._mapId = $gameMap.mapId();
        const cols = Math.ceil($gameMap.width() / RAY_SPACING.x) + 1, rows = Math.ceil($gameMap.height() / RAY_SPACING.y) + 1;
        for (let ry = 0; ry < rows; ry++) {
            for (let rx = 0; rx < cols; rx++) {
                const sh = new Sprite(this._bmp);
                sh.anchor.set(0.5, 1);   // (standing on its spot)
                sh.rotation = RAY_TILT + rand(-0.04, 0.04);
                sh.blendMode = PIXI.BLEND_MODES.ADD;
                sh._ray = { tx: (rx + rand(0.1, 0.9)) * RAY_SPACING.x, ty: (ry + rand(0.3, 0.95)) * RAY_SPACING.y, w: rand(1.5, 3.4), len: rand(0.95, 1.25),
                    ph: rand(0, Math.PI * 2), sp: rand(0.006, 0.013), drift: rand(18, 46), top: rand(0.34, 0.5), on: Math.random() < 0.8 };
                this.addChild(sh);
                this._shafts.push(sh);
            }
        }
    };
    Sprite_SunRays.prototype.update = function() {
        this._shown += Math.max(-0.01, Math.min(0.01, state.rays - this._shown));   // (no sudden jumps: a map change, F9)
        this.visible = this._shown > 0.002;
        if (!this.visible || !$gameMap) return;
        if (this._mapId !== $gameMap.mapId()) this.build();
        const W = Graphics.width, H = Graphics.height, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const k = this._shown * (1 - nightNow()), lean = Math.sin(-RAY_TILT);
        for (const sh of this._shafts) {
            const r = sh._ray, t = state.t, len = H * r.len;
            const x = $gameMap.adjustX(r.tx) * tw + Math.sin(t * r.sp * 0.35 + r.ph) * r.drift, y = $gameMap.adjustY(r.ty) * th;
            // (only what reaches the screen: the shaft runs from its spot up-left for len px)
            sh.visible = r.on && y > -40 && y - len * 0.95 < H + 40 && x > -120 && x - len * lean < W + 120;
            if (!sh.visible) continue;
            sh.x = Math.round(x);
            sh.y = Math.round(y);
            sh.scale.x = r.w * (0.85 + 0.15 * Math.sin(t * r.sp + r.ph * 1.7));
            sh.scale.y = len / 256;
            sh.opacity = Math.round(255 * k * (r.top * 0.45 + r.top * 0.55 * (0.5 + 0.5 * Math.sin(t * r.sp * 0.8 + r.ph))));
        }
    };

    const _Spriteset_Map_createWeather = Spriteset_Map.prototype.createWeather;
    Spriteset_Map.prototype.createWeather = function() {
        _Spriteset_Map_createWeather.call(this);
        // a new map's sprites (a transfer, a load) start with its own sky: the scene updates the spriteset once as it makes it, before
        // the map's first frame - with the last map's sky the leaves of a storm outside would fly through a house
        readSky();
        state.flash = state.outdoors ? Math.min(1, flashAt(state.t)) : 0;
        this._stormLeaves = new Sprite_StormLeaves();
        this._smoulder = new Sprite_Smoulder();
        const under = this._nightLight ? this.children.indexOf(this._nightLight) : -1;   // under the night, so the leaves and the smoke darken with it
        if (under >= 0) { this.addChildAt(this._stormLeaves, under); this.addChildAt(this._smoulder, under); }
        else { this.addChild(this._smoulder); this.addChild(this._stormLeaves); }
        this._sunRays = new Sprite_SunRays();
        this.addChild(this._sunRays);   // over the rain, under the flash
        this._stormSky = new Sprite_StormSky();
        this.addChild(this._stormSky);   // over the rain
    };
    // the sky, the wind, the strikes and the thunder: once a map frame, on the core's runner (settled: the frames this map scene has run)
    T.onMapUpdate(scene => update(scene._twFrames || 0), { owner: PLUGIN, name: "sky" });
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._stormSky) this._stormSky.update();
        // the rain is drawn over the night layer: in the dark it is only a faint sheen, until a flash lights every drop
        if (this._weather) this._weather.alpha = 1 - 0.7 * nightNow() * (1 - state.flash);
    };

    window.Storm = T.register(PLUGIN, {
        level: () => state.level,
        phase: () => state.phase,
        wind: () => state.wind,
        clock: () => state.clock,
        flash: () => state.flash,
        rays: () => state.rays,
        raysAt,
        adjustTone,
        strike,
        pending,   // strikes asked for while the map was not running (the F9 menu): their opts
        state
    });
})();
