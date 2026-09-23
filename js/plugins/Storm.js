/*:
 * @target MZ
 * @plugindesc Burza: ciemniejące niebo, błyskawice, grzmoty z opóźnieniem, wicher gnący drzewa, ukośna ulewa i lecące liście. v1.0.0
 * @author Tawerna
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
 *     mocniej, ptaki milkną, z daleka słychać pomruki i widać słabe łuny. Dymek "Zbiera się na burzę".
 *   Szaleje: ukośna ulewa (pogoda MZ "storm", z wiatrem w prawo), pioruny, wicher, lecące liście i gałązki,
 *     dym z ogniska kładzie się poziomo, cienie chmur znikają pod jednym ciemnym niebem.
 *   Odchodzi: grzmoty coraz dalsze i cichsze, wiatr słabnie, zostaje zwykły deszcz.
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
 *   czarne, kruche, daje węgiel drzewny zamiast drewna) i przez godzinę gry się tli: z korony idzie
 *   dym, w nocy żarzy się.
 *
 * DLA INNYCH WTYCZEK (window.Storm)
 *   level()  siła burzy teraz (0..1, niebo - także pod dachem)
 *   wind()   wiatr na tej mapie (0..1, 0 pod dachem; wygładzony) - ChoppableTree, SwayingFoliage, CloudShadows, dym
 *   clock()  zegar wiatru w sekundach: biegnie szybciej, gdy wieje (drzewa liczą z niego swoje kołysanie)
 *   flash()  jasność błysku teraz (0..1) - warstwa nocy
 *   adjustTone(tone)  ton ekranu przyciemniony burzą - DayNightCycle
 *   strike(d, opts)  piorun teraz, d = odległość 0 (tuż obok) .. 1 (daleko); opts.tree = drzewo (zdarzenie)
 *            albo true (dowolne na ekranie) - testy i menu F9
 */
(() => {
    "use strict";

    const params = PluginManager.parameters("Storm");
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
        last: null        // the last strike { d, bolt, at }
    };

    const survival = () => window.Survival;
    function readSky() {
        const S = survival();
        if (!S || !S.stormLevel || !$gameSystem || !$gameSystem.dayNightDay) return;
        const day = $gameSystem.dayNightDay(), hour = $gameSystem.dayNightHour();
        state.level = S.stormLevel(day, hour);
        state.phase = state.level > 0 ? S.stormPhase(day, hour) : null;
        state.outdoors = !!(S.isOutdoors && S.isOutdoors());
    }

    // ---- lightning
    function flashAt(t) {
        let v = 0;
        for (const p of state.pulses) if (t >= p.at) v = Math.max(v, p.amp * (t - p.at < 3 ? 1 : Math.exp(-(t - p.at - 3) / 4.5)));   // full for 3 frames, then fading
        return v;
    }
    function playSe(name, volume, pitch, pan) {
        const muffled = !state.outdoors;   // under a roof: quieter and duller
        AudioManager.playSe({ name, volume: Math.round(volume * VOLUME * (muffled ? 0.5 : 1)), pitch: Math.round(pitch - (muffled ? 12 : 0)), pan: Math.round(pan || 0) });
    }
    // ---- lightning hitting a tree (ChoppableTree.js chars it: charcoal instead of wood). Only a close strike while the
    // storm rages, only a tree on the screen (not right next to the player), at most TREES_PER_STORM a day.
    const TREE_CHANCE = 0.3, TREES_PER_STORM = 2, SMOULDER_HOURS = 1;
    const hoursNow = () => $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();
    function treesHitToday() {
        const s = $gameSystem._stormTrees;
        return s && s.day === $gameSystem.dayNightDay() ? s.n : 0;
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
        const C = window.ChoppableTree;
        if (!C || !C.strikeableTrees) return null;
        const W = Graphics.width, H = Graphics.height;
        const list = C.strikeableTrees().filter(e => {
            const x = e.screenX(), y = e.screenY();
            return x > 40 && x < W - 40 && y > 140 && y < H + 20 && Math.abs(e.x - $gamePlayer.x) + Math.abs(e.y - $gamePlayer.y) >= 2;
        });
        return list.length ? pick(list) : null;
    }
    function hitTree(tree, pan) {
        if (!window.ChoppableTree.charTree(tree)) return false;
        const day = $gameSystem.dayNightDay(), s = $gameSystem._stormTrees;
        $gameSystem._stormTrees = { day, n: (s && s.day === day ? s.n : 0) + 1 };
        ($gameSystem._smoulder = $gameSystem._smoulder || {})[$gameMap.mapId() + ":" + tree.eventId()] = hoursNow();
        state.thunders.push({ at: state.t + 8, se: ["Fire2", 70, 90, pan] });   // the crown catches fire for a moment
        const coal = $dataItems[window.ChoppableTree.CHARCOAL];
        if ($gameTemp.pushLootPopup) $gameTemp.pushLootPopup(coal ? coal.iconIndex : 0, "Piorun trafił w drzewo!", "#ffc27a");
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
            else if (opts && opts.tree && $gameTemp.pushLootPopup) $gameTemp.pushLootPopup(0, "Nie ma tu drzewa, w które mógłby trafić", "#bcd8ff");   // F9
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

    // settled: frames the map scene has been running (the F9 strike waits until the map is back on the screen)
    function update(settled) {
        state.t++;
        readSky();
        const target = state.outdoors ? state.level : 0;
        state.wind += Math.max(-0.02, Math.min(0.02, target - state.wind));   // no sudden jumps (map change, F9)
        state.clock += (1 + 0.9 * state.wind) / 60;
        if (window.Storm.pending.length && settled > 20) strike(0.08, window.Storm.pending.shift());   // asked for from the F9 menu
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

    // ---- a struck tree smoulders for SMOULDER_HOURS: smoke from its crown, blown with the wind (under the night layer). The embers
    // glowing in the tree pixel by pixel are ChoppableTree.js's (they read the same store). $gameSystem._smoulder = { "mapId:eventId": hour it was hit }
    let smokeBmp = null;
    function smokeBitmap() {
        if (smokeBmp) return smokeBmp;
        smokeBmp = new Bitmap(24, 24);
        const ctx = smokeBmp.context, g = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
        g.addColorStop(0, "rgba(96,92,88,0.75)");
        g.addColorStop(0.6, "rgba(84,80,76,0.35)");
        g.addColorStop(1, "rgba(80,76,72,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 24, 24);
        smokeBmp._baseTexture.update();
        return smokeBmp;
    }
    const PUFFS = 6, PUFF_FRAMES = 150;
    function Sprite_Smoulder() {
        this.initialize(...arguments);
    }
    Sprite_Smoulder.prototype = Object.create(Sprite.prototype);
    Sprite_Smoulder.prototype.constructor = Sprite_Smoulder;
    Sprite_Smoulder.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._entries = {};
    };
    Sprite_Smoulder.prototype.entry = function(key) {
        if (this._entries[key]) return this._entries[key];
        const puffs = [];
        for (let i = 0; i < PUFFS; i++) {
            const p = new Sprite(smokeBitmap());
            p.anchor.set(0.5, 0.5);
            this.addChild(p);
            puffs.push(p);
        }
        return (this._entries[key] = { puffs });
    };
    Sprite_Smoulder.prototype.drop = function(key) {
        const e = this._entries[key];
        if (!e) return;
        for (const p of e.puffs) this.removeChild(p);
        delete this._entries[key];
    };
    Sprite_Smoulder.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const store = ($gameSystem && $gameSystem._smoulder) || {}, now = hoursNow(), mapId = $gameMap.mapId();
        const live = {};
        for (const key of Object.keys(store)) {
            const age = now - store[key];
            if (age > SMOULDER_HOURS || age < 0) { delete store[key]; continue; }
            const [m, id] = key.split(":").map(Number), event = m === mapId ? $gameMap.event(id) : null;
            if (!event || !window.ChoppableTree || !ChoppableTree.isCharred(event) || $gameSelfSwitches.value([m, id, "A"])) continue;   // felled: it stops
            live[key] = true;
            const e = this.entry(key), c = crownOf(event), strength = 1 - age / SMOULDER_HOURS, W = state.wind;
            e.puffs.forEach((p, i) => {
                const t = ((state.t + i * (PUFF_FRAMES / PUFFS) + id * 17) % PUFF_FRAMES) / PUFF_FRAMES;
                p.x = c.x + Math.sin(t * 5 + i * 1.9) * 4 * (1 - 0.5 * W) + t * (12 + 70 * W);
                p.y = c.y + 14 - t * 60 * (1 - 0.5 * W);
                p.alpha = Math.min(1, t / 0.15) * (1 - t) * 0.7 * (0.3 + 0.7 * strength);
                p.scale.set(0.7 + t * 1.4, 0.7 + t * 1.4);
            });
        }
        for (const key of Object.keys(this._entries)) if (!live[key]) this.drop(key);
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
    const nightNow = () => (window.Farming && Farming.nightAmount && $gameSystem._dayNightTinting ? Farming.nightAmount() : 0);
    Sprite_StormSky.prototype.update = function() {
        const night = nightNow();
        this._light.alpha = state.flash * (0.5 - 0.22 * night);   // at night the lifted darkness does most of the work
        const bolt = state.bolt;
        if (bolt && bolt.fresh) { bolt.fresh = false; this.drawBolt(bolt); }
        if (bolt && state.t - bolt.at < 22) this._bolt.alpha = clamp01((state.flash / Math.max(0.01, bolt.amp)) * 1.3);
        else { this._bolt.alpha = 0; if (bolt) state.bolt = null; }
    };

    const _Spriteset_Map_createWeather = Spriteset_Map.prototype.createWeather;
    Spriteset_Map.prototype.createWeather = function() {
        _Spriteset_Map_createWeather.call(this);
        this._stormLeaves = new Sprite_StormLeaves();
        this._smoulder = new Sprite_Smoulder();
        const under = this._nightLight ? this.children.indexOf(this._nightLight) : -1;   // under the night, so the leaves and the smoke darken with it
        if (under >= 0) { this.addChildAt(this._stormLeaves, under); this.addChildAt(this._smoulder, under); }
        else { this.addChild(this._smoulder); this.addChild(this._stormLeaves); }
        this._stormSky = new Sprite_StormSky();
        this.addChild(this._stormSky);   // over the rain
    };
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        this._stormFrames = (this._stormFrames || 0) + 1;
        update(this._stormFrames);
        _Spriteset_Map_update.call(this);
        if (this._stormSky) this._stormSky.update();
        // the rain is drawn over the night layer: in the dark it is only a faint sheen, until a flash lights every drop
        if (this._weather) this._weather.alpha = 1 - 0.7 * nightNow() * (1 - state.flash);
    };

    window.Storm = {
        level: () => state.level,
        phase: () => state.phase,
        wind: () => state.wind,
        clock: () => state.clock,
        flash: () => state.flash,
        adjustTone,
        strike,
        pending: [],   // strikes asked for while the map was not running (the F9 menu): their opts
        state
    };
})();
