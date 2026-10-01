//=============================================================================
// ChoppableTree_Render.js
//=============================================================================
// How the things to gather look on the map (split out of ChoppableTree.js, 2026-09-29): the standing tree drawn in thin strips (the
// sway in the wind, the kick of a blow, the fall with the stump fading in under it), a tree burnt by lightning (its soot-black picture,
// the band of embers creeping down it, their glow and the spots Storm.js smokes from), the hit flash, the squash of a breaking rock or
// stump, a bush seen through while the hero stands in it, and the layer of flying chips and stones (Sprite_HitFxLayer, z 7). Functions
// and a class only: ChoppableTree.js holds every engine hook (the Sprite_Character methods call in here).

/*:
 * @target MZ
 * @plugindesc Wygląd rzeczy do zbierania (część ChoppableTree.js): kołysanie drzew, odrzut, upadek, spalone drzewo i żar, błysk trafienia, odłamki i kamienie. Sama nic nie robi - parametry i haki ma ChoppableTree.js. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base ChoppableTree
 * @orderAfter ChoppableTree
 *
 * @help
 * ============================================================================
 * ChoppableTree_Render.js - wygląd rzeczy do zbierania
 * ============================================================================
 * Część ChoppableTree.js (wydzielona z niego): drzewo rysowane w paskach
 * (kołysanie na wietrze, odrzut po uderzeniu, upadek i pieniek, który się
 * pojawia), drzewo spalone piorunem (czarny obraz, pasek żaru, poświata),
 * błysk trafienia, pękający kamień i pieniek, krzak, przez który widać
 * postać, odłamki i kamienie lecące do postaci. Sama nic nie robi: woła ją
 * ChoppableTree.js, który ma parametry.
 *
 * KOLEJNOŚĆ: ChoppableTree, ChoppableTree_Objects, ChoppableTree_Swing,
 * ChoppableTree_Render (zaraz pod ChoppableTree). Dopóki nie jest wpisana na
 * listę wtyczek, ChoppableTree.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("ChoppableTree_Render.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("ChoppableTree_parts") || T.register("ChoppableTree_parts", {});
    if (P.render) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("ChoppableTree_Render.js: musi być pod ChoppableTree.js na liście wtyczek (ChoppableTree.js is missing or below)");
    const missing = name => { throw new Error("ChoppableTree_Render.js: brak " + name + " (a part of ChoppableTree.js)"); };
    const { SWAY_CYCLE, CHARRED_TONE, FALL_FRAMES, BREAK_FRAMES, EMBER_FRONT, EMBER_SMOULDER, EMBER_LIFE, occupyConfig, isInsideArea, smoulderState } = P.core;
    const O = () => P.objects || missing("ChoppableTree_Objects.js");
    // the numbers of a thing (ChoppableTree_Objects.js)
    const treeConfig = event => O().treeConfig(event);
    const bushConfig = event => O().bushConfig(event);
    const isCharred = event => O().isCharred(event);

    const STRIP_HEIGHT = 6;
    const KICK_PIXELS = 7;
    const FLASH_FRAMES = 14;
    const FLASH_ALPHA = 170;

    // How far a falling tree has tipped over, 0 (upright) to 1 (flat on the
    // ground). It accelerates like a real fall. The same value drives the tilt
    // and the transparency, so the lower the tree gets the more it fades and
    // it is gone exactly when it reaches the ground.
    function fallTilt(frames) {
        const p = Math.min(1, frames / FALL_FRAMES);
        return p * p;
    }

    // ------------------------------------------------------------------
    // Rendering: the standing tree is drawn as thin horizontal strips, each shifted sideways by a
    // WHOLE number of pixels taken from a bending curve (trunk pinned at the ground, crown moving most).
    // Whole pixels on purpose. A fractional shift of a smoothed texture blurs the strip, and since the
    // blur depends on the fraction, bands of soft and sharp strips used to run up and down the crown
    // like glowing waves (worst in the evening, when the dark leaf edges blur into light ones). A shift
    // of a whole pixel keeps every strip exactly as sharp as the picture, so the sway only ever moves
    // the crown, it never changes how it looks.
    // ------------------------------------------------------------------

    // How far a strip at relative height h (0 = ground, 1 = top) follows the sway of the crown.
    function bendProfile(h) {
        return Math.pow(h, 1.7);
    }

    // The second, quicker bend of a springy trunk: the middle leans one way while the very top whips the other.
    function whipProfile(h) {
        return 1.6 * h * h * (1 - 1.6 * h);
    }

    // The wind on one tree right now. Gusts sweep across the map (their strength depends on the tree's x, so
    // neighbouring trees lean together), the crown lags the trunk only a little and no ripple runs up the tree.
    // In a storm (Storm.js: wind 0..1) the trees bend up to three times as far, lean hard downwind and shake faster; its clock
    // runs faster with the wind (a clock, not frameCount times a factor, so a rising wind never makes the trees jump).
    function treeWind(event, cfg, treeHeight) {
        if (!(cfg.sway > 0)) return null;
        const storm = T.api("Storm"), W = storm ? storm.wind() : 0;
        const t = storm ? storm.clock() : Graphics.frameCount / 60;
        const w = (2 * Math.PI) / SWAY_CYCLE;
        const phase = event.eventId() * 1.7 + event.x * 0.35;
        const gust = 0.5 + 0.5 * Math.sin((w * t) / 2.7 - event.x * 0.12);   // 0..1
        return {
            amp: treeHeight * Math.tan((cfg.sway * Math.PI) / 180) * (1 + 2 * W),
            lean: 0.6 * gust * (1 + W),        // a gust pushes the whole tree downwind
            swing: 0.3 + 0.6 * gust,           // and the main swing grows with it
            whip: 0.2 * (0.4 + 0.6 * gust) * (1 + 1.5 * W),   // the quick shiver of the crown
            swingPhase: w * t + phase,
            whipPhase: 2.7 * w * t + 1.7 * phase
        };
    }

    // Horizontal offset (px, not yet rounded) of a strip at relative height h.
    function treeOffset(event, wind, h) {
        let d = 0;
        if (wind) {
            const swing = Math.sin(wind.swingPhase - 0.35 * h);
            const whip = Math.sin(wind.whipPhase - 0.6 * h);
            d += wind.amp * (bendProfile(h) * (wind.lean + wind.swing * swing) + whipProfile(h) * wind.whip * whip);
        }
        if (event._treeKickAt !== undefined) {
            // The crown reacts a moment after the trunk, then rings out.
            const elapsed = (Graphics.frameCount - event._treeKickAt) / 60 - 0.07 * h;
            if (elapsed > 0 && elapsed < 2) {
                d += (event._treeKickDir || 1) * KICK_PIXELS * Math.exp(-3.2 * elapsed) *
                    Math.sin(2 * Math.PI * 2.3 * elapsed) * bendProfile(h);
            }
        }
        return d;
    }

    function hitFlashAlpha(event) {
        if (event._treeKickAt === undefined) return 0;
        const p = (Graphics.frameCount - event._treeKickAt) / FLASH_FRAMES;
        if (p < 0 || p >= 1) return 0;
        return Math.round(FLASH_ALPHA * (1 - p) * (1 - p));
    }

    function isTreeSprite() {
        const event = this._character;
        return event instanceof Game_Event && !!treeConfig(event) &&
            this._tileId === 0 && !!this._characterName &&
            !!this.bitmap && this.bitmap.isReady();
    }

    // The standing tree lives in _treeBody (a container: it is what tilts and
    // fades while falling). Under it sits _stumpPreview, which fades in while
    // the tree fades out, so the stump is already there when the tree is gone.
    function setTreeBodyVisible(visible) {
        if (this._treeBody) {
            this._treeBody.visible = visible;
            this._stumpPreview.visible = visible && this._stumpPreview.alpha > 0;
        }
    }

    function ensureTreeStrips(frameHeight) {
        if (!this._treeBody) {
            this._stumpPreview = new Sprite();
            this._stumpPreview.anchor.x = 0.5;
            this._stumpPreview.anchor.y = 1;
            this._stumpPreview.alpha = 0;
            this._stumpPreview.visible = false;
            this._treeBody = new Sprite();
            this.addChild(this._stumpPreview);
            this.addChild(this._treeBody);
        }
        if (this._treeStrips && this._treeStripsFor === frameHeight) return;
        if (this._treeStrips) {
            for (const strip of this._treeStrips) {
                this._treeBody.removeChild(strip);
            }
        }
        this._treeStrips = [];
        this._treeStripsFor = frameHeight;
        this._treeFrameKey = null;   // the new strips have no picture frame yet
        for (let row = 0; row < frameHeight; row += STRIP_HEIGHT) {
            const strip = new Sprite();
            strip.anchor.x = 0;
            strip.anchor.y = 0;
            strip._rowStart = row;
            strip._rowHeight = Math.min(STRIP_HEIGHT, frameHeight - row);
            this._treeStrips.push(strip);
            this._treeBody.addChild(strip);
        }
    }

    function updateTreeFrame() {
        const event = this._character;
        const cfg = treeConfig(event);
        const scale = (cfg && cfg.scale) || 1;
        const pw = this.patternWidth();
        const ph = this.patternHeight();
        const sx = (this.characterBlockX() + this.characterPatternX()) * pw;
        const sy = (this.characterBlockY() + this.characterPatternY()) * ph;
        // Own texture stays empty; the strips draw the tree. Smoothing is
        // only for the tilt while it falls; the sway itself moves whole pixels.
        this.setFrame(sx, sy, 0, ph);
        this.bitmap.smooth = true;
        this.ensureTreeStrips(ph);
        this._treeBody.visible = true;
        this.updateStumpPreviewFrame(event);
        const wind = treeWind(event, cfg, ph);
        const half = Math.floor(pw / 2);
        // a charred tree draws its strips from a soot-black copy of its picture (a colour tone on the sprite would dull its embers
        // too) - but while it still smoulders it keeps its own picture: the burn creeping down it covers it pixel by pixel
        const charred = isCharred(event), age = charred ? smoulderAge(event) : -1, burning = age >= 0 && age < EMBER_LIFE;
        const sooty = charred && !burning, pic = sooty ? charredBitmap(this.bitmap) : this.bitmap;
        // a new picture resets the strips' frames: set them again. The picture itself is part of the key: a fruit tree swapping its bare
        // sheet for the fruiting one (the same size, so the same sx/sy/pw) would otherwise keep the old frames - and a strip given a
        // bitmap that is still loading gets the WHOLE sheet as its frame once it loads (every row of it: the tree drawn over and over)
        const frameKey = (pic._url || "") + "," + sx + "," + sy + "," + pw + (sooty ? ",c" : "");
        const reframe = this._treeFrameKey !== frameKey;
        this._treeFrameKey = frameKey;
        // scale shrinks (or grows) the whole picture around the foot of the tree (local 0,0): both the
        // strip size and its position get the same factor, so a smaller tree still stands on its own tile.
        // Each strip reaches exactly to the whole pixel where the next one starts: a strip of 6 rows at 0.74 is 4.44 px high, and
        // with its top rounded a gap of up to a pixel was left under it (a line of grass across a young planted pine)
        for (const strip of this._treeStrips) {
            strip.bitmap = pic;
            strip.visible = true;
            if (reframe) strip.setFrame(sx, sy + strip._rowStart, pw, strip._rowHeight);
            const top = Math.round((strip._rowStart - ph) * scale), bottom = Math.round((strip._rowStart + strip._rowHeight - ph) * scale);
            strip.scale.x = scale;
            strip.scale.y = (bottom - top) / strip._rowHeight;
            const h = 1 - (strip._rowStart + strip._rowHeight / 2) / ph;
            strip.x = Math.round((treeOffset(event, wind, h) - half) * scale);
            strip.y = top;
        }
        this.updateEmbers(burning ? age : -1, sx, sy, pw, ph, scale);
    }

    // ---- a charred tree: its picture turned to soot (made once per picture), and the embers smouldering in it
    const charredCache = new Map();
    function charredBitmap(src) {
        const key = src._url || src;
        let out = charredCache.get(key);
        if (out) return out;
        const w = src.width, h = src.height;
        out = new Bitmap(w, h);
        out.blt(src, 0, 0, w, h, 0, 0);
        const ctx = out.context, img = ctx.getImageData(0, 0, w, h), d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            if (!d[i + 3]) continue;
            const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];   // the same as CHARRED_TONE: grey, then darker and a little warm
            d[i] = Math.max(0, l + CHARRED_TONE[0]);
            d[i + 1] = Math.max(0, l + CHARRED_TONE[1]);
            d[i + 2] = Math.max(0, l + CHARRED_TONE[2]);
        }
        ctx.putImageData(img, 0, 0);
        out._baseTexture.update();
        out.smooth = true;   // like the tree picture itself (only the tilt of a falling tree is smoothed)
        out._charred = true;
        charredCache.set(key, out);
        return out;
    }
    // The burn: after the strike the tree does not turn black at once. From the tip, where the bolt hit, a band of embers creeps
    // down it pixel by pixel (a ragged edge, over EMBER_FRONT hours): each pixel of the tree's own shape flares up yellow, cools
    // through orange and red and is left soot-black. Behind the band a few pixels keep smouldering, pulsing slowly, for half an
    // hour after the band has reached the foot (EMBER_LIFE hours after the strike; Storm.js smokes for as long and reads both numbers);
    // then the tree is simply drawn from its charred picture. _tw.smoulder has the hour each tree was struck ("mapId:eventId"; Storm.js
    // writes it). EMBER_FRONT, EMBER_SMOULDER, EMBER_LIFE: ChoppableTree.js (Storm.js reads them there).
    const EMBER_SPOTS = 16;   // glowing pixels handed to Storm.js each time the embers are drawn: the smoke rises from them
    const EMBER_COLOURS = [[128, 34, 16], [214, 72, 24], [255, 128, 32], [255, 184, 64], [255, 236, 170]];
    function smoulderAge(event) {
        const at = smoulderState()[event._mapId + ":" + event._eventId];
        return at === undefined ? -1 : T.time.day() * 24 + T.time.hour() - at;
    }
    function emberNoise(j, t) {   // 0..1, the same for the same pixel and moment
        let h = Math.imul(j ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(t + 1, 0xc2b2ae35);
        h ^= h >>> 15;
        h = Math.imul(h, 0x27d4eb2f);
        h ^= h >>> 13;
        return (h >>> 0) / 4294967296;
    }
    // every drawn pixel of this frame of the tree: when the burn reaches it, how fast it cools, its charred colour
    function buildEmbers(key, sx, sy, pw, ph) {
        this._emberKey = key;
        const tmp = new Bitmap(pw, ph);
        tmp.blt(this.bitmap, sx, sy, pw, ph, 0, 0);
        const src = tmp.context.getImageData(0, 0, pw, ph).data;
        tmp.destroy();
        const rowShows = y => { for (let x = 0; x < pw; x++) if (src[(y * pw + x) * 4 + 3] > 128) return true; return false; };
        let top = 0;   // the tip: the first row with something drawn on it
        while (top < ph && !rowShows(top)) top++;
        const idx = [], ign = [], cool = [], slow = [], soot = [];
        for (let y = top; y < ph; y++) {
            const k = (y - top) / Math.max(1, ph - top);   // 0 at the tip .. 1 at the foot
            for (let x = 0; x < pw; x++) {
                const i = y * pw + x, a = src[i * 4 + 3];
                if (a < 128) continue;
                idx.push(i);
                // (the jitter and the cooling scale with EMBER_FRONT, so the band keeps its thickness whatever its speed)
                ign.push(Math.max(0, k - 0.04) * EMBER_FRONT + Math.random() * 0.045 * EMBER_FRONT);   // a ragged edge: pixel by pixel
                const smoulders = Math.random() < 0.04;   // a few keep glowing long after the band has passed, dying out over the half hour
                slow.push(smoulders ? 1 : 0);
                cool.push(smoulders ? (0.35 + Math.random() * 0.55) * EMBER_SMOULDER : (0.015 + Math.random() * 0.035) * EMBER_FRONT);
                const l = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
                soot.push([Math.max(0, l + CHARRED_TONE[0]), Math.max(0, l + CHARRED_TONE[1]), Math.max(0, l + CHARRED_TONE[2]), a]);
            }
        }
        this._emberSites = { idx, ign, cool, slow, soot, n: idx.length, top };
        if (!this._emberBitmap || this._emberBitmap.width !== pw || this._emberBitmap.height !== ph) {
            this._emberBitmap = new Bitmap(pw, ph);
            this._emberBitmap.smooth = false;
        }
        this._emberImg = this._emberBitmap.context.createImageData(pw, ph);
        if (this._emberStrips) for (const e of this._emberStrips) this._treeBody.removeChild(e);
        this._emberStrips = this._treeStrips.map(strip => {
            const e = new Sprite(this._emberBitmap);
            e.setFrame(0, strip._rowStart, pw, strip._rowHeight);
            this._treeBody.addChild(e);   // over the tree's own strips, moving with them
            return e;
        });
        this._emberTick = -1;
    }
    // the burn at this moment: untouched pixels stay clear (the tree's own picture shows), burning ones glow, burnt ones are soot
    function drawEmbers(age, tick, ph) {
        const s = this._emberSites, d = this._emberImg.data;
        d.fill(0);
        const fadeFrom = EMBER_FRONT + EMBER_SMOULDER * 0.7;   // the last embers dim out over the end of the smouldering
        const fade = age > fadeFrom ? Math.max(0, 1 - (age - fadeFrom) / (EMBER_SMOULDER * 0.3)) : 1;
        const pw = this._emberBitmap.width, spots = [];
        let lit = 0, sumY = 0;
        for (let j = 0; j < s.n; j++) {
            const dt = age - s.ign[j];
            if (dt < 0) continue;
            const k = s.idx[j] * 4;
            let b = 0;
            if (dt < s.cool[j] * 6) {
                const flare = 0.02 * EMBER_FRONT, heat = dt < flare ? 1 : Math.exp(-(dt - flare) / s.cool[j]);
                // the band shimmers pixel by pixel; the ones left smouldering pulse slowly instead
                b = s.slow[j] ? heat * fade * (0.55 + 0.45 * Math.sin(j * 1.7 + tick * (0.12 + (j % 5) * 0.03)))
                    : heat * (0.72 + 0.28 * emberNoise(j, Math.floor((tick + (j % 3)) / 2)));   // mostly by heat: yellow at the front, then orange, red, black
            }
            if (b >= 0.12) {
                const c = EMBER_COLOURS[b > 0.82 ? 4 : b > 0.62 ? 3 : b > 0.42 ? 2 : b > 0.26 ? 1 : 0];
                d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
                if (b > 0.26) {
                    lit++;
                    sumY += Math.floor(s.idx[j] / pw);
                    // a fair handful of the glowing pixels (reservoir sampling) for the smoke
                    const r = lit <= EMBER_SPOTS ? lit - 1 : Math.floor(Math.random() * lit);
                    if (r < EMBER_SPOTS) spots[r] = { x: s.idx[j] % pw, y: Math.floor(s.idx[j] / pw), b };
                }
            } else {
                const c = s.soot[j];
                d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = c[3];
            }
        }
        this._emberBitmap.context.putImageData(this._emberImg, 0, 0);
        this._emberBitmap._baseTexture.update();
        // for the night layer: how much glows and where (from the foot of the picture, px)
        this._emberGlow = lit > 0 ? { heat: Math.min(1, lit / 80), up: ph - sumY / lit } : null;
        this._emberSpots = spots;
    }
    // age: hours since the strike while it smoulders, -1 otherwise
    function updateEmbers(age, sx, sy, pw, ph, scale) {
        if (age < 0) {
            if (this._emberStrips) for (const e of this._emberStrips) e.visible = false;
            this._emberGlow = null;
            this._emberSpots = null;
            return;
        }
        const key = sx + "," + sy + "," + pw + "," + ph + "," + this._treeStrips.length;
        if (this._emberKey !== key) this.buildEmbers(key, sx, sy, pw, ph);
        const tick = Math.floor(Graphics.frameCount / 3);
        if (tick !== this._emberTick) {
            this._emberTick = tick;
            this.drawEmbers(age, tick, ph);
        }
        this._emberScale = scale;
        this._treeStrips.forEach((strip, i) => {
            const e = this._emberStrips[i];
            e.visible = true;
            e.x = strip.x;
            e.y = strip.y;
            e.scale.x = strip.scale.x;
            e.scale.y = strip.scale.y;
        });
    }
    // the embers light the dark around them a little (Farming_Render's night layer cuts these holes): where most of them glow now
    function emberLights(spriteset) {
        const out = [];
        for (const s of (spriteset && spriteset._characterSprites) || []) {
            const g = s._emberGlow;
            if (!g || !s._treeBody || !s._treeBody.visible) continue;
            out.push({ x: s.x, y: s.y - g.up * (s._emberScale || 1), r: 40 + 40 * g.heat, i: 0.3 + 0.5 * g.heat, id: 5000 + s._character._eventId });
        }
        return out;
    }
    // where the embers of a smouldering tree glow now, on the screen: [{ x, y, b }] (b: 0.26..1, how hot), [] when nothing glows
    function emberSpots(sprite) {
        const spots = sprite && sprite._emberSpots, bmp = sprite && sprite._emberBitmap;
        if (!spots || !bmp || !sprite._treeBody || !sprite._treeBody.visible) return [];
        const k = sprite._emberScale || 1, half = bmp.width / 2, ph = bmp.height;
        return spots.filter(Boolean).map(p => ({ x: sprite.x + (p.x - half) * k, y: sprite.y - (ph - p.y) * k, b: p.b }));
    }

    // The tile the event turns into after it is felled (its next page's graphic).
    const stumpTileCache = new WeakMap();
    function stumpTileId(event) {
        if (stumpTileCache.has(event)) return stumpTileCache.get(event);
        const data = event.event();
        const page = data ? data.pages.slice(1).find(p => p.image && p.image.tileId > 0) : null;
        const id = page ? page.image.tileId : 0;
        stumpTileCache.set(event, id);
        return id;
    }

    // 0 until the tree has tipped a quarter of the way, fully shown by ~85%.
    function stumpPreviewAlpha(tilt) {
        return Math.max(0, Math.min(1, (tilt - 0.25) / 0.6));
    }

    function updateStumpPreviewFrame(event) {
        const tileId = stumpTileId(event);
        if (tileId === this._stumpPreviewTile) return;
        this._stumpPreviewTile = tileId;
        const preview = this._stumpPreview;
        if (tileId > 0) {
            const pw = $gameMap.tileWidth();
            const ph = $gameMap.tileHeight();
            preview.bitmap = this.tilesetBitmap(tileId);
            preview.setFrame(((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * pw,
                (Math.floor((tileId % 256) / 8) % 16) * ph, pw, ph);
        } else {
            preview.bitmap = null;
        }
    }

    // the stump of a charred tree is drawn soot-black with a colour tone (the standing tree has its own soot-black picture instead,
    // so that the tone does not dull its embers); the stump that fades in under a falling tree too
    function updateCharredTone(event) {
        const charred = isCharred(event), toned = charred && !this.isTreeSprite();
        if (toned !== !!this._charredOn) {
            this._charredOn = toned;
            this.setColorTone(toned ? CHARRED_TONE : [0, 0, 0, 0]);
        }
        if (this._stumpPreview && charred !== !!this._charredPreview) {
            this._charredPreview = charred;
            this._stumpPreview.setColorTone(charred ? CHARRED_TONE : [0, 0, 0, 0]);
        }
    }

    function updateHitFlash(event) {
        const alpha = hitFlashAlpha(event);
        if (alpha > 0 || this._treeFlashOn) {
            this.setBlendColor([255, 244, 210, alpha]);
            this._treeFlashOn = alpha > 0;
        }
    }

    function updateTreeEffects(event) {
        if (!this.isTreeSprite()) {
            // Stump / rock (tile or plain graphic): small jitter and highlight
            // on every hit, squash and fade while it breaks.
            if (this._treeShadow) this._treeShadow.visible = false;
            this._occluder = null;
            this.updateSimpleHitEffects(event);
            updateRockShadow.call(this, event);   // (a rock, a boulder, a tall stump: its own shadow; else nothing)
            return;
        }
        this.scale.x = 1;
        this.scale.y = 1;
        this.rotation = 0;
        // 0 = upright, 1 = on the ground (or already felled and waiting for the
        // stump page). The same value tips the tree, fades it out and fades the
        // stump in, so all three stay in step.
        let tilt = 0;
        if (event._treeFallT >= 0) {
            tilt = fallTilt(event._treeFallT);
        } else if (event._treeGone) {
            tilt = 1;
        }
        const body = this._treeBody;
        const preview = this._stumpPreview;
        body.rotation = (event._treeFallDir || 1) * (Math.PI / 2) * tilt;
        body.alpha = (1 - tilt) * stepSeeThrough(this, seeThroughTarget(this, event));   // (fades while the player is behind it)
        const noStump = isCharred(event) || !!(treeConfig(event) || {}).nostump;
        preview.alpha = noStump ? 0 : stumpPreviewAlpha(tilt);   // a charred tree (and a seedling) leaves no stump
        preview.visible = preview.alpha > 0 && !!preview.bitmap;
        this.updateHitFlash(event);
        updateTreeShadow.call(this, event, tilt);
    }

    function updateSimpleHitEffects(event) {
        this.rotation = 0;
        if (event._treeKickAt !== undefined) {
            const tau = (Graphics.frameCount - event._treeKickAt) / 60;
            if (tau >= 0 && tau < 1) {
                this.x += (event._treeKickDir || 1) * 3 * Math.exp(-6 * tau) * Math.sin(2 * Math.PI * 4 * tau);
            }
        }
        let scaleX = 1, scaleY = 1, sink = 0;
        if (event._breakT >= 0) {
            const p = Math.min(1, event._breakT / (BREAK_FRAMES[event._breakKind] || 30));
            if (event._breakKind !== "stump") {
                scaleX = 1 + 0.15 * p;
                scaleY = 1 - 0.5 * p;
            } else {
                scaleY = 1 - 0.35 * p;
                sink = 14 * p;
            }
        }
        this.scale.x = scaleX;
        this.scale.y = scaleY;
        this.y += sink;
        this.updateHitFlash(event);
        this.updateBushSeeThrough(event);
    }

    // A bush with a walkable edge fades a little while the player stands in it, so
    // you can see him (and the swing) among the leaves.
    const BUSH_SEE_THROUGH = 0.6;
    function updateBushSeeThrough(event) {
        if (!bushConfig(event)) return;   // only bushes: other events keep their own alpha
        const o = occupyConfig(event);
        const inside = !!o && o.soft > 0 && isInsideArea(event, o, $gamePlayer.x, $gamePlayer.y);
        const target = inside ? BUSH_SEE_THROUGH : 1;
        let k = this._bushSeeK === undefined ? 1 : this._bushSeeK;
        if (k !== target) {
            k += (target - k) * 0.25;
            if (Math.abs(target - k) < 0.02) k = target;
        }
        this._bushSeeK = k;   // (applied after the engine's updateOther, which resets the opacity every frame - ChoppableTree.js)
    }
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
    T.on("lightning", e => { if (e && e.outdoors) lastBolt = { x: e.x, y: e.y }; }, { owner: "ChoppableTree_Render" });
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
            out.push({ o, ux: vx / d, uy: vy / d, len, L: len * h, d, m: shadowMatrix(o, vx / d, vy / d, len, 1.1, {}) });
        }
        return out;
    }
    // cut the shadows (lightBlockers) out of a light drawn on canvas context c: k - the canvas's scale to the screen (a half-size
    // layer: 0.5), ox, oy - where the canvas's corner is (in its own px). Drawn in bands across each shadow: the further from the feet,
    // the wider (the light spreads), the fainter (the lit ground around throws light back into it) and the softer (the sharp
    // silhouette at the feet cross-fades into its blurred copy) - no dark blob at the far end, no hard wall of dark
    function cutLightShadows(c, blockers, k, ox, oy) {
        c.globalCompositeOperation = "destination-out";
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
    // a signature of what throws shadows in a light now (a layer that keeps its last picture redraws when it changes)
    function blockersKey(blockers) {
        return blockers.map(b => Math.round(b.o.fx) + "," + Math.round(b.o.fy) + "," + (b.o.bmp._key || "") + "," + b.o.alpha.toFixed(2)).join(";");
    }
    const SunApi = T.api("Sun") || T.register("Sun", { now: sunNow, shadows: true });
    Object.assign(SunApi, { now: sunNow, cloudCover, layer: sunShadowLayer, layerAlpha, silhouette: silhouetteBitmap, occluder: makeOccluder,
        matrix: shadowMatrix, lay: laySunShadow, occluders, soft: softSilhouette, FLAT: SHADOW_FLAT, sky: skyAt, elevation: sunElev, NIGHT_TONE,
        lightBlockers, cutLightShadows, scratchCanvas, blockersKey });

    // A tree's shadow (from the foot of the trunk, user: "od samego pieńka równo" - its lowest row and the middle of it, 4 px above
    // the frame's bottom on our trees, a little aside on the fruit trees; starting TREE_SHADOW_INSET px up inside the trunk, where
    // the tree hides the soft start of the blur). The crown's sway goes with it; it fades with the falling tree. A tree picture with a
    // ground shadow painted in gets none.
    const TREE_SHADOW_INSET = 4;
    const TREE_CROWN_SOLID = 0.9;   // a crown lets a little firelight through between its boughs
    function updateTreeShadow(event, tilt) {
        let shadow = this._treeShadow;
        const pw = this.patternWidth(), ph = this.patternHeight();
        const bmp = !event._treeGone && tilt < 1 && this.parent ? silhouetteBitmap(this.bitmap,
            (this.characterBlockX() + this.characterPatternX()) * pw, (this.characterBlockY() + this.characterPatternY()) * ph, pw, ph, true) : null;
        if (bmp) {
            const cfg = treeConfig(event), scale = (cfg && cfg.scale) || 1, h = bmp._footRow + 1;
            const sway = treeOffset(event, treeWind(event, cfg, ph), 1) * scale;   // the crown's sway, laid on the ground with it
            this._occluder = makeOccluder(bmp, this.x + (bmp._footX - pw / 2) * scale, this.y - (ph - h + TREE_SHADOW_INSET) * scale, bmp._footX, scale, scale, sway,
                TREE_CROWN_SOLID * (1 - tilt));   // (how much light a fire's shadow of it takes away: see Farming_Render.js)
        } else {
            this._occluder = null;
        }
        if (!bmp || !SunApi.shadows || sunNow().light <= 0.01) {
            if (shadow) shadow.visible = false;
            return;
        }
        const layer = sunShadowLayer(this.parent);
        if (!shadow) shadow = this._treeShadow = new Sprite();
        if (shadow.parent !== layer) layer.addChild(shadow);
        laySunShadow(shadow, this._occluder);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        shadow.alpha = layerAlpha(layer) * (sunNow().flash ? 1 : 1 - 0.85 * cloudCover((event._realX + 0.5) * tw, (event._realY + 1) * th)) * (1 - tilt);
        shadow.visible = this.visible && shadow.alpha > 0.005;
    }

    // ---- rocks (user 2026-10-01: "cienie kamienie"): stones, boulders, ore and tall stumps throw the sun's shadow in their own shape
    // too, and stand in a fire's way. Their pictures have a ground shadow painted in (translucent dark pixels, always as at noon): it
    // is turned down to AMBIENT_KEEP of itself - the soft shade right under a rock that stays at night too - and the sun lays the
    // real one. (The ore rocks and the rock pile have none painted.)
    const ROCK_PIC = /^!\$(Rock_|Boulder|Stump_|Bush_)/;
    // bushes too (user 2026-10-01: "gąszcze gałęzi też mogą cień rzucać fajnie"): a thicket of bare branches throws a lacy shadow - the
    // branches sharp in it (little blur) and the light coming through between them (lighter); a leafy bush a soft, full one
    function groundShadowKind(name) {
        if (/^!\$Bush_Bare/.test(name)) return { blur: 0.6, solid: 0.88 };
        if (/^!\$Bush_/.test(name)) return { blur: 1.2, solid: 0.9 };
        return { blur: undefined, solid: 1 };
    }
    const AMBIENT_KEEP = 0.35, ROCK_SHADOW_INSET = 2;
    // a rock is bulky: it stands on the ground with a whole footprint, whose middle lies behind the bottom edge we see (the picture is
    // seen from above at an angle). Its shadow comes from there - ROCK_DEPTH of its width (at most ROCK_DEPTH_MAX of its height) up
    // inside the picture: from the bottom edge it lay under the rock like a mirror image, "too low" (user 2026-10-01)
    const ROCK_DEPTH = 0.2, ROCK_DEPTH_MAX = 0.32;
    const softenedCache = new Map();
    function withSoftShade(src) {
        const key = src._url || src;
        let out = softenedCache.get(key);
        if (out) return out;
        const w = src.width, h = src.height;
        out = new Bitmap(w, h);
        out.blt(src, 0, 0, w, h, 0, 0);
        const ctx = out.context, img = ctx.getImageData(0, 0, w, h), d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] > 0 && d[i + 3] < 230 && d[i] + d[i + 1] + d[i + 2] < 240) d[i + 3] = Math.round(d[i + 3] * AMBIENT_KEEP);
        }
        ctx.putImageData(img, 0, 0);
        out._baseTexture.update();
        out.smooth = src.smooth;
        out._url = src._url;          // (the same picture for everything that asks which it is)
        out._softShade = true;
        softenedCache.set(key, out);
        return out;
    }
    // how wide a rock is (its solid pixels, px; read once per silhouette)
    function rockWidth(bmp) {
        if (bmp._solidW !== undefined) return bmp._solidW;
        const w = bmp.width, h = bmp.height, d = bmp.context.getImageData(0, 0, w, h).data;
        let x0 = w, x1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
        return (bmp._solidW = x1 >= x0 ? x1 - x0 + 1 : 0);
    }
    function updateRockShadow(event) {
        let shadow = this._treeShadow;
        const f = this._frame, rock = ROCK_PIC.test(this._characterName || "") && this.bitmap && this.bitmap.isReady() && this.parent && f && f.width > 0;
        if (rock && !this.bitmap._softShade) this.bitmap = withSoftShade(this.bitmap);   // (set once: the sprite keeps it while the picture is the same)
        const kind = rock ? groundShadowKind(this._characterName) : null;
        const bmp = rock && this.visible && this.opacity > 0 ? silhouetteBitmap(this.bitmap, f.x, f.y, f.width, f.height, false, kind.blur) : null;
        if (!bmp) {
            this._occluder = null;
            if (shadow) shadow.visible = false;
            return;
        }
        const sx = this.scale.x, sy = this.scale.y, h = bmp._footRow + 1;   // (squashed while it breaks: the shadow with it)
        const depth = Math.round(Math.min(rockWidth(bmp) * ROCK_DEPTH, h * ROCK_DEPTH_MAX));
        this._occluder = makeOccluder(bmp, this.x + (bmp._footX - f.width / 2) * sx, this.y - (f.height - h + ROCK_SHADOW_INSET + depth) * sy, bmp._footX, sx, sy, 0,
            kind.solid * this.opacity / 255);
        if (!SunApi.shadows || sunNow().light <= 0.01) {
            if (shadow) shadow.visible = false;
            return;
        }
        const layer = sunShadowLayer(this.parent);
        if (!shadow) shadow = this._treeShadow = new Sprite();
        if (shadow.parent !== layer) layer.addChild(shadow);
        laySunShadow(shadow, this._occluder);
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        shadow.alpha = layerAlpha(layer) * kind.solid * (this.opacity / 255) * (sunNow().flash ? 1 : 1 - 0.85 * cloudCover((event._realX + 0.5) * tw, (event._realY + 1) * th));
        shadow.visible = shadow.alpha > 0.005;
    }

    // A tree the player walks behind fades a little, so he stays in sight behind its crown - a choppable tree (its body) and a
    // decorative tree picture on an event (the whole sprite). Behind: his feet above the tree's base, inside its picture's width
    // and height; in front of it (or beside the trunk) he is drawn over it anyway.
    const TREE_SEE_THROUGH = 0.5;
    function seeThroughTarget(sprite, event) {
        if (event._treeGone || !sprite.bitmap || !sprite.bitmap.isReady()) return 1;
        const p = $gamePlayer, w = sprite.patternWidth(), h = sprite.patternHeight();
        const px = p.screenX(), py = p.screenY(), tx = sprite.x, ty = sprite.y;
        const behind = py < ty - 8 && py > ty - h + 16 && Math.abs(px - tx) < w / 2 - 6;
        return behind ? TREE_SEE_THROUGH : 1;
    }
    function stepSeeThrough(sprite, target) {
        let k = sprite._seeThroughK === undefined ? 1 : sprite._seeThroughK;
        if (k !== target) {
            k += (target - k) * 0.2;
            if (Math.abs(target - k) < 0.02) k = target;
        }
        sprite._seeThroughK = k;
        return k;
    }
    function updateDecorTreeSeeThrough(event) {
        this._decorSeeK = stepSeeThrough(this, seeThroughTarget(this, event));   // (applied after the engine's updateOther)
    }
    // ------------------------------------------------------------------
    // Hit effect particles. A layer in the tilemap (so it scrolls and zooms
    // with the map) that turns the entries queued in $gameTemp._hitFx into
    // small squares that fly off, fall to the ground and fade.
    // ------------------------------------------------------------------

    // count / final: particles per hit / on the last hit. speed, lift: sideways
    // and upward speed (px per frame), gravity, life (frames), size (px).
    const FX_TYPES = {
        wood: { colors: ["#e2bd7f", "#c99a5b", "#9a6a35", "#f3dfae"], count: 7, final: 13, speed: [0.6, 2.2], lift: [1.4, 3.4], gravity: 0.22, life: [26, 40], size: [2, 3], oy: -26 },
        rock: { colors: ["#b8bdc2", "#8f959b", "#d6d9dc", "#6b7075"], count: 6, final: 12, speed: [0.5, 2.0], lift: [1.2, 3.0], gravity: 0.24, life: [24, 36], size: [2, 3], oy: -18 },
        spark: { colors: ["#fff3b0", "#ffd45c", "#ffffff"], count: 5, final: 9, speed: [1.5, 3.6], lift: [0.5, 2.6], gravity: 0.12, life: [8, 14], size: [1, 2], oy: -18 },
        dirt: { colors: ["#5b3e27", "#79532f", "#3e2a1b", "#8a6a45"], count: 6, final: 12, speed: [0.4, 1.7], lift: [1.0, 2.6], gravity: 0.25, life: [24, 34], size: [2, 3], oy: -6 },
        leaf: { colors: ["#3f6b34", "#557f3c", "#2f5229", "#7f9a4a"], count: 12, final: 12, speed: [0.1, 0.9], lift: [-0.3, 0.6], gravity: 0.04, life: [46, 70], size: [2, 2], oy: -78, spread: 22 },
        bushleaf: { colors: ["#3f6b34", "#557f3c", "#2f5229", "#7f9a4a", "#93b653"], count: 7, final: 15, speed: [0.4, 2.2], lift: [0.5, 2.4], gravity: 0.09, life: [34, 56], size: [2, 3], oy: -20, spread: 14 },
        // dry twigs of the leafless thickets
        drytwig: { colors: ["#5f4e42", "#70614f", "#483b39", "#9d8371", "#7e674f"], count: 9, final: 18, speed: [0.6, 2.6], lift: [1.2, 3.2], gravity: 0.24, life: [28, 44], size: [2, 3], oy: -18, spread: 16 },
        twig: { colors: ["#7a5a34", "#9a7443", "#5e4326", "#b08a52"], count: 3, final: 8, speed: [0.6, 2.0], lift: [1.2, 2.8], gravity: 0.22, life: [24, 38], size: [2, 3], oy: -14, spread: 8 },
        // a tree struck by lightning (Storm.js): sparks out of the crown, burnt leaves and ash drifting down; chopping it, black chips (a spark now and then)
        ember: { colors: ["#ffd45c", "#ff9a2e", "#fff3b0", "#ff6a1a"], count: 10, final: 24, speed: [0.3, 2.2], lift: [0.8, 2.8], gravity: 0.06, life: [30, 60], size: [1, 2], oy: -92, spread: 24 },
        ash: { colors: ["#2a2622", "#3b3530", "#1c1a18", "#55504a"], count: 10, final: 16, speed: [0.1, 0.9], lift: [-0.3, 0.6], gravity: 0.04, life: [46, 70], size: [2, 2], oy: -78, spread: 22 },
        char: { colors: ["#1f1b18", "#2e2925", "#4a423b", "#141210", "#ff8a2a"], count: 7, final: 13, speed: [0.6, 2.2], lift: [1.4, 3.4], gravity: 0.22, life: [26, 40], size: [2, 3], oy: -26 },
        // whole little stones (the ones you get): they fly out, bounce, lie there for a
        // moment (settle frames, staggered) and then fly to the player
        stone: { pebble: true, count: 2, final: 4, speed: [0.9, 2.4], lift: [2.0, 3.0], gravity: 0.5, life: [0, 0], size: [6, 6], oy: -26, spread: 10, bounce: 0.42, settle: 30 }
    };
    const FX_MAX_PARTICLES = 140;
    const FX_MAX_PEBBLES = 12;

    // draw order (Sprite.z). Only one value lives here, but it is named for the same reason
    // Farming_Render.js keeps its own small Z table: a number alone (was "this.z = 7") does not say why.
    // Not shared with Farming_Render.js: this file keeps its own copy rather than depend on a table of
    // another plugin (this part may load before or after it).
    const Z = {
        hitFx: 7   // hit-effect particles (flying stones, chips), above the characters
    };

    // build (once) and cache a bitmap under `key` in `cache` (a plain object). buildFn does the actual
    // drawing and returns the bitmap; mirrors the helper of the same shape in Farming_Render.js (kept
    // local here for the same reason as the Z table above).
    function cachedBitmap(cache, key, buildFn) {
        if (!cache[key]) cache[key] = buildFn();
        return cache[key];
    }

    const fxBitmaps = {};
    function fxBitmap(color, size) {
        const key = color + size;
        return cachedBitmap(fxBitmaps, key, () => {
            const bitmap = new Bitmap(size, size);
            bitmap.fillRect(0, 0, size, size, color);
            return bitmap;
        });
    }
    // little pixel-art stones: [light, mid, dark, outline]
    const STONE_SHADES = [
        ["#c9cfd4", "#9aa1a7", "#6f757b", "#3a3f44"],
        ["#d2c29b", "#a8956a", "#7a6a48", "#3f3423"],
        ["#b7c4b0", "#8a9a84", "#5f6e5a", "#2f3a2d"]
    ];
    const stoneBitmaps = {};
    function stoneBitmap(shade) {
        return cachedBitmap(stoneBitmaps, shade, () => {
            const [light, mid, dark, line] = STONE_SHADES[shade];
            const bitmap = new Bitmap(7, 6);
            bitmap.fillRect(2, 0, 3, 1, line);
            bitmap.fillRect(1, 1, 5, 1, line);
            bitmap.fillRect(0, 2, 7, 2, line);
            bitmap.fillRect(1, 4, 5, 1, line);
            bitmap.fillRect(2, 5, 3, 1, line);
            bitmap.fillRect(2, 1, 3, 1, mid);
            bitmap.fillRect(1, 2, 5, 2, mid);
            bitmap.fillRect(2, 4, 3, 1, dark);
            bitmap.fillRect(2, 1, 2, 1, light);
            bitmap.fillRect(1, 2, 2, 1, light);
            bitmap.fillRect(4, 3, 2, 1, dark);
            return bitmap;
        });
    }
    // where the flying stones go: the player's chest
    function playerScreenPoint() {
        if (typeof $gamePlayer.screenX === "function") return { x: $gamePlayer.screenX(), y: $gamePlayer.screenY() - 24 };
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        return { x: $gameMap.adjustX($gamePlayer.x) * tw + tw / 2, y: $gameMap.adjustY($gamePlayer.y) * th + th / 2 };
    }
    const fxRandom = (a, b) => a + Math.random() * (b - a);
    const fxInt = range => Math.round(fxRandom(range[0], range[1]));

    function Sprite_HitFxLayer() {
        this.initialize(...arguments);
    }

    Sprite_HitFxLayer.prototype = Object.create(Sprite.prototype);
    Sprite_HitFxLayer.prototype.constructor = Sprite_HitFxLayer;

    Sprite_HitFxLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = Z.hitFx;   // above the characters
        this._particles = [];
    };

    Sprite_HitFxLayer.prototype.spawn = function(fx) {
        const type = FX_TYPES[fx.type];
        if (!type) return;
        const away = fx.dx !== 0 ? fx.dx : (Math.random() < 0.5 ? -1 : 1);
        const count = fx.count !== undefined ? Math.min(fx.count, FX_MAX_PEBBLES) : (fx.final ? type.final : type.count);
        for (let i = 0; i < count && this._particles.length < FX_MAX_PARTICLES; i++) {
            const size = fxInt(type.size);
            const sprite = new Sprite(type.pebble
                ? stoneBitmap(Math.floor(Math.random() * STONE_SHADES.length))
                : fxBitmap(type.colors[Math.floor(Math.random() * type.colors.length)], size));
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            const spread = type.spread || 3;
            const homeAt = type.pebble ? type.settle + i * 2 : -1;   // frame the stone starts flying to the player
            this._particles.push({
                sprite, bx: fx.bx, by: fx.by, bounce: type.bounce || 0, homeAt,
                // starts on the side of the target facing the player
                ox: -fx.dx * 9 + fxRandom(-spread, spread),
                oy: type.oy - fx.dy * 5 + fxRandom(-3, 3),
                vx: away * fxRandom(type.speed[0], type.speed[1]) + fxRandom(-0.9, 0.9),
                vy: -fxRandom(type.lift[0], type.lift[1]),
                gravity: type.gravity, age: 0, life: type.pebble ? homeAt + 45 : fxInt(type.life), floor: fxRandom(-2, 5)
            });
            this.addChild(sprite);
        }
    };

    // A stone flying to the player (in screen coordinates, so it follows the scrolling
    // map and a moving player). Returns true when it has arrived.
    Sprite_HitFxLayer.prototype.flyHome = function(p) {
        const target = playerScreenPoint();
        if (!p.homing) {
            p.homing = true;
            p.hx = p.sprite.x;
            p.hy = p.sprite.y;
        }
        const dx = target.x - p.hx, dy = target.y - p.hy, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) return true;
        const step = Math.max(3, dist * 0.22);
        p.hx += dx / dist * step;
        p.hy += dy / dist * step;
        p.sprite.x = Math.round(p.hx);
        p.sprite.y = Math.round(p.hy);
        p.sprite.alpha = 1;
        return false;
    };

    Sprite_HitFxLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const queue = typeof $gameTemp !== "undefined" && $gameTemp ? $gameTemp._hitFx : null;
        while (queue && queue.length > 0) this.spawn(queue.shift());
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        for (const p of this._particles.slice()) {
            p.age++;
            let done = p.age >= p.life;
            if (p.homeAt >= 0 && p.age >= p.homeAt) {
                done = this.flyHome(p) || done;
            } else {
                p.vy += p.gravity;
                p.ox += p.vx;
                p.oy += p.vy;
                if (p.oy > p.floor) {   // landed: it stays there and slides a little (stones bounce first)
                    p.oy = p.floor;
                    p.vy = p.bounce && p.vy > 1.4 ? -p.vy * p.bounce : 0;
                    p.vx *= p.bounce ? 0.75 : 0.6;
                }
                p.sprite.x = Math.round($gameMap.adjustX(p.bx) * tw + p.ox);
                p.sprite.y = Math.round($gameMap.adjustY(p.by) * th + p.oy);
                p.sprite.alpha = Math.min(1, (p.life - p.age) / 10);
            }
            if (done) {
                this.removeChild(p.sprite);
                this._particles.splice(this._particles.indexOf(p), 1);
            }
        }
    };

    P.render = { STRIP_HEIGHT, FX_TYPES, fallTilt, treeWind, treeOffset, hitFlashAlpha, charredBitmap, smoulderAge, stumpTileId, emberLights, emberSpots,
        isTreeSprite, setTreeBodyVisible, ensureTreeStrips, updateTreeFrame, buildEmbers, drawEmbers, updateEmbers, updateStumpPreviewFrame,
        updateCharredTone, updateHitFlash, updateTreeEffects, updateSimpleHitEffects, updateBushSeeThrough, updateDecorTreeSeeThrough,
        TREE_SEE_THROUGH, Sprite_HitFxLayer, sunNow, cloudCover, silhouetteBitmap, makeOccluder, shadowMatrix, laySunShadow, occluders, sunShadowLayer, updateTreeShadow,
        updateRockShadow, withSoftShade, ROCK_PIC };
})();
