//=============================================================================
// Combat_UI.js
//=============================================================================
// What the fight and the hero look like (split out of Combat.js, 2026-09-29): on the map the floating numbers and sparks, the
// rushing animals' afterimages, the enemies' bars, the breath under the hero, the shield, the hero's and the animals' sprites
// (a flash when hurt, the flinch, stun stars); on the screen the weapon plate, the experience bar, the "Tryb walki" label and the
// level banner; and the Postać screen (P -> Postać: the attributes and the skill trees). Classes and functions only: Combat.js
// holds every engine hook and calls these.

/*:
 * @target MZ
 * @plugindesc Wygląd walki i ekran Postaci (część Combat.js): liczby i iskry, paski wrogów, oddech pod stopami, plakietka broni, pasek doświadczenia, napisy trybu i poziomu, menu P -> Postać. Sama nic nie robi - parametry i haki ma Combat.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Combat
 * @orderAfter Combat
 * @base Combat_Fight
 * @orderAfter Combat_Fight
 *
 * @help
 * ============================================================================
 * Combat_UI.js - wygląd walki i ekran Postaci
 * ============================================================================
 * Część Combat.js (wydzielona z niego): to, co widać - na mapie liczby,
 * iskry, paski wrogów, oddech pod stopami, tarcza; na ekranie plakietka
 * broni, pasek doświadczenia, napis "Tryb walki", "Poziom N!"; i ekran
 * Postaci w menu P (atrybuty i drzewka umiejętności). Sama nic nie robi:
 * woła ją Combat.js. Parametry ma Combat.js.
 *
 * KOLEJNOŚĆ: Skills_Data, Combat, Combat_Fight, Combat_UI. Dopóki nie jest
 * wpisana na listę wtyczek, Combat.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Combat_UI.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Combat_parts") || T.register("Combat_parts", {});
    if (P.ui) return;   // (put into the page twice: kept as it was)
    if (!P.core || !P.fight) throw new Error("Combat_UI.js: musi być pod Combat.js i Combat_Fight.js na liście wtyczek (one of them is missing or below)");
    const { hero, skillRank, skillBlock, skillById, skillText, secText, xpToNext, unspent, levelColor, learnSkill, spendPoints, ATTRS, ATTR_MAX, MAX_LEVEL,
        POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL, TREES, SKILLS, ROW_LEVEL, strMult, poiseMult, critChance, rollCost, rollIFrames, parryWindow, knockdownAt,
        woundChance, carryBonus, gatherBonus, dexWork, comboWindow, aimSteady, baseBreath, heroMhp, combatMode, se, foes, mindResist, mindTime } = P.core;
    const { act, px, py, easeOut, floaters, sparks, sparksAt, maxBreath, breathNow, isWinded, shield, armor, sneakMult, has, hand, handIcon, MELEE, ROLL_KIND, KNOCK_KIND } = P.fight;
    const H = () => T.api("Hunting");
    const style = () => T.api("UITheme");   // (UITheme.js's window.UIStyle: the game's panels and bars)

    // ==================================================================
    // Sprites: on the tilemap (the numbers, sparks, the bars of the enemies, the breath under the hero, the shield) and on the screen
    // (the weapon in hand, the experience, the mode, the level banner)
    // ==================================================================
    function textBitmap(text, color, size) {
        const w = Math.max(24, Math.ceil(text.length * size * 0.62) + 12), bmp = new Bitmap(w, size + 12);
        bmp.fontSize = size;
        bmp.fontBold = true;
        bmp.outlineColor = "rgba(0,0,0,0.95)";
        bmp.outlineWidth = 5;
        bmp.textColor = color;
        bmp.drawText(text, 0, 0, w, size + 12, "center");
        return bmp;
    }
    const ENEMY_BAR_W = 42;
    function drawEnemyBar(bmp, a) {
        const U = style() || {};
        bmp.clear();
        const ctx = bmp.context, hp = Math.max(0, a._hp / (a._maxHp || 1)), po = a._maxPoise ? Math.max(0, a._poise / a._maxPoise) : 0;
        const x = 18, w = ENEMY_BAR_W;
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(x - 1, 1, w + 2, 9);
        ctx.fillStyle = "#3a1614";
        ctx.fillRect(x, 2, w, 4);
        ctx.fillStyle = a._stun > 0 ? "#ff9f40" : "#e5484d";
        ctx.fillRect(x, 2, Math.round(w * hp), 4);
        ctx.fillStyle = "#2c2a18";
        ctx.fillRect(x, 7, w, 2);
        ctx.fillStyle = U.accent || "#ffd23f";
        ctx.fillRect(x, 7, Math.round(w * po), 2);
        if (a._level) {   // the level, coloured by how it compares with the hero's
            const lv = a._level, c = levelColor(lv), strong = lv - hero().level >= 4;
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(0, 0, 16, 11);
            bmp.fontSize = 11;
            bmp.fontBold = true;
            bmp.outlineWidth = 0;
            bmp.textColor = c;
            bmp.drawText(strong ? "☠" : String(lv), 0, -1, 16, 13, "center");
        }
        bmp._baseTexture.update();
    }
    // a hostile or hurt animal shows its bars (a calm deer grazing does not)
    function showsBar(a) {
        if (a._dead || !a._maxHp) return false;
        if (a._hp < a._maxHp || a._stun > 0) return true;
        return !!a._engaged && Math.hypot(a.centerX() - px(), a.centerY() - py()) < 12;
    }

    function Sprite_CombatLayer() {
        this.initialize(...arguments);
    }
    Sprite_CombatLayer.prototype = Object.create(Sprite.prototype);
    Sprite_CombatLayer.prototype.constructor = Sprite_CombatLayer;
    Sprite_CombatLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 8;
        this._breath = new Sprite(new Bitmap(46, 8));
        this._breath.anchor.set(0.5, 0);
        this._breath.opacity = 0;
        this.addChild(this._breath);
        this._breathKey = "";
        this._shield = new Sprite();
        this._shield.anchor.set(0.5, 0.5);
        this._shield.visible = false;
        this.addChild(this._shield);
        this._bars = new Map();
    };
    const toScreenX = x => Math.round($gameMap.adjustX(x - 0.5) * $gameMap.tileWidth() + $gameMap.tileWidth() / 2);
    const toScreenY = y => Math.round($gameMap.adjustY(y - 0.5) * $gameMap.tileHeight() + $gameMap.tileHeight() / 2);
    Sprite_CombatLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.updateTrails();
        this.updateFloaters();
        this.updateSparks();
        this.updateBreath();
        this.updateShield();
        this.updateBars();
    };
    // an animal rushing flat out (a boar on its locked line): TRAIL.n fading afterimages of its own sprite a few frames behind it
    // (under the characters), and dust from the hooves; when it stops they fade away
    const TRAIL = { n: 4, gap: 2, alpha: [160, 120, 80, 45], dust: 4 };
    Sprite_CombatLayer.prototype.updateTrails = function() {
        if (!this._trails) this._trails = new Map();
        const map = this.parent, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        const animals = foes();   // (the animals and the men - Humans.js)
        for (const a of animals) {
            const sp = a._sprite, rushing = typeof a.isRushing === "function" && a.isRushing() && sp && sp.parent === map;
            let tr = this._trails.get(a);
            if (!tr && !rushing) continue;
            if (!tr) { tr = { hist: [], ghosts: [], t: 0 }; this._trails.set(a, tr); }
            if (rushing) {
                tr.hist.unshift({ x: sp.x + ox, y: sp.y + oy, frame: sp._frame.clone(), bitmap: sp.bitmap, sx: sp.scale.x, sy: sp.scale.y });
                if (++tr.t % TRAIL.dust === 0 && !a.isJumping()) sparksAt(a.centerX(), a.centerY() + 0.4, "#9c8260", 3);   // (no dust in the air: a leaping wolf)
            } else tr.hist.unshift(null);   // (it stopped: the trail runs out)
            tr.hist.length = Math.min(tr.hist.length, TRAIL.n * TRAIL.gap + 1);
            for (let i = 0; i < TRAIL.n; i++) {
                let g = tr.ghosts[i];
                if (!g) {
                    g = new Sprite();
                    g.anchor.set(0.5, 1);
                    g.setBlendColor([255, 248, 230, 45]);
                    map.addChild(g);
                    tr.ghosts[i] = g;
                }
                const h = tr.hist[(i + 1) * TRAIL.gap];
                g.visible = !!h && !!sp;
                if (!g.visible) continue;
                if (g.bitmap !== h.bitmap) g.bitmap = h.bitmap;
                g.setFrame(h.frame.x, h.frame.y, h.frame.width, h.frame.height);
                g.x = Math.round(h.x - ox);
                g.y = Math.round(h.y - oy);
                g.scale.set(h.sx, h.sy);
                g.opacity = TRAIL.alpha[i];
                g.z = sp.z - 0.1;   // (under every character: an afterimage never covers the boar or the hero)
                g.spriteId = sp.spriteId - 1 - i;
            }
            if (tr.hist.every(h => !h) || !animals.includes(a)) this.dropTrail(a, tr);
        }
        for (const [a, tr] of this._trails) if (!animals.includes(a) || a._dead) this.dropTrail(a, tr);
    };
    Sprite_CombatLayer.prototype.dropTrail = function(a, tr) {
        for (const g of tr.ghosts) { if (g.parent) g.parent.removeChild(g); g.destroy(); }
        this._trails.delete(a);
    };
    // the floating words and numbers: each rises from where it was said and fades; ones that would cover each other are stacked - the
    // older keeps its place, a newer one goes up above it (a few frames' glide, never back down while it shows), so every line reads
    // (a hero's "Opierasz się!" under its "Hart ducha", the boss's "Odpowiedź!" over a "Utknął!"); one pushed far up fades sooner
    const FLOAT = { life: 50, rise: 26, gap: 3, far: 120 };
    Sprite_CombatLayer.prototype.updateFloaters = function() {
        const placed = [];
        // (the plates SurvivalHUD floats over the hero - a missing tool, the weather - stay where they are: the words go above them too;
        // same screen place only while the map is not zoomed)
        const loot = SceneManager._scene && SceneManager._scene._lootLayer;
        if (loot && floaters.length && $gameScreen.zoomScale() === 1) {
            for (const p of loot.children) if (p.bitmap && p.visible && p.alpha > 0.05) placed.push({ x: p.x, y: p.y + 2, w: p.bitmap.width * Math.abs(p.scale.x) + 6, h: p.bitmap.height * Math.abs(p.scale.y) + 4 });
        }
        for (const f of floaters.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0))) {
            if (!f.sprite) {
                const size = Math.round(20 * f.scale);
                f.sprite = new Sprite(textBitmap(f.text, f.color, size));
                f.sprite.anchor.set(0.5, 1);
                this.addChild(f.sprite);
                f.w = Math.ceil(f.sprite.bitmap.measureTextWidth(f.text)) + 10;   // (the letters and their outline, not the whole bitmap)
                f.h = size + 4;
                f.lift = -1;
            }
            f.t++;
            const k = f.t / FLOAT.life, x = toScreenX(f.x), y0 = toScreenY(f.y) - 6 - Math.round(FLOAT.rise * easeOut(Math.min(1, k * 1.6)));
            // up above every placed line it would touch (they are already sorted oldest first)
            let y = y0;
            for (let moved = true, n = 0; moved && n < 12; n++) {
                moved = false;
                for (const p of placed) {
                    if (Math.abs(p.x - x) * 2 >= p.w + f.w || y - f.h >= p.y || y <= p.y - p.h) continue;
                    y = p.y - p.h - FLOAT.gap;
                    moved = true;
                }
            }
            const want = y0 - y;
            f.lift = f.lift < 0 ? want : Math.max(f.lift, f.lift + (want - f.lift) * 0.4);
            if (f.lift > FLOAT.far) f.t++;   // (a tall stack: the top goes sooner)
            const shown = y0 - Math.round(f.lift);
            placed.push({ x, y: shown, w: f.w, h: f.h });
            f.sprite.x = x;
            f.sprite.y = shown + 6;   // (the bitmap's lower margin under the letters)
            f.sprite.opacity = k < 0.6 ? 255 : Math.round(255 * Math.max(0, 1 - (k - 0.6) / 0.4));
            const pop = f.t < 6 ? 1 + (6 - f.t) * 0.08 : 1;
            f.sprite.scale.set(pop, pop);
        }
        for (const f of floaters.filter(f => f.t >= FLOAT.life)) { this.removeChild(f.sprite); f.sprite.destroy(); }
        floaters.splice(0, floaters.length, ...floaters.filter(f => f.t < FLOAT.life));
    };
    Sprite_CombatLayer.prototype.updateSparks = function() {
        for (const s of sparks) {
            if (!s.sprite) {
                const bmp = new Bitmap(3, 3);
                bmp.fillRect(0, 0, 3, 3, s.color);
                s.sprite = new Sprite(bmp);
                s.sprite.anchor.set(0.5, 0.5);
                this.addChild(s.sprite);
            }
            s.t++;
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.004;
            s.sprite.x = toScreenX(s.x);
            s.sprite.y = toScreenY(s.y);
            s.sprite.opacity = Math.round(255 * (1 - s.t / s.life));
        }
        for (const s of sparks.filter(s => s.t >= s.life)) { this.removeChild(s.sprite); s.sprite.destroy(); }
        sparks.splice(0, sparks.length, ...sparks.filter(s => s.t < s.life));
    };
    // the breath: a thin bar under the hero's feet, only in a fight or while it is not full
    Sprite_CombatLayer.prototype.updateBreath = function() {
        const m = maxBreath(), b = breathNow(), show = act.combatT > 0 || b < m - 0.5, winded = isWinded();
        const s = this._breath;
        s.opacity = show ? Math.min(255, s.opacity + 25) : Math.max(0, s.opacity - 12);
        if (s.opacity <= 0) return;
        s.x = toScreenX(px());
        s.y = toScreenY(py()) + Math.round($gameMap.tileHeight() * 0.5) + 2;
        const flash = winded && Math.floor(Graphics.frameCount / 8) % 2 === 0;
        const key = Math.round(b) + ":" + m + ":" + (winded ? (flash ? "a" : "b") : "-");
        if (key === this._breathKey) return;
        this._breathKey = key;
        const bmp = s.bitmap, ctx = bmp.context, w = 42;
        bmp.clear();
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(1, 1, w + 2, 6);
        ctx.fillStyle = "#16303a";
        ctx.fillRect(2, 2, w, 4);
        ctx.fillStyle = winded ? (flash ? "#ff6b5e" : "#a0443a") : "#8fe3ff";
        ctx.fillRect(2, 2, Math.round(w * b / m), 4);
        bmp._baseTexture.update();
    };
    // the shield (its icon) in front of the hero while he guards
    Sprite_CombatLayer.prototype.updateShield = function() {
        const s = this._shield, on = act.mode === "block";
        s.visible = on && $gamePlayer.direction() !== 8;
        if (!s.visible) return;
        const sh = shield(), icon = sh ? $dataItems[sh.id].iconIndex : 0;
        if (s._icon !== icon) {
            s._icon = icon;
            const bmp = new Bitmap(32, 32);
            if (icon) {
                const set = ImageManager.loadSystem("IconSet");
                const draw = () => { bmp.blt(set, (icon % 16) * 32, Math.floor(icon / 16) * 32, 32, 32, 0, 0); };
                if (set.isReady()) draw(); else set.addLoadListener(draw);
            } else {   // guarding with the weapon: a pale arc
                const ctx = bmp.context;
                ctx.strokeStyle = "rgba(230,240,255,0.8)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(16, 22, 13, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();
                bmp._baseTexture.update();
            }
            s.bitmap = bmp;
        }
        const d = $gamePlayer.direction(), off = { 2: [0, -18], 4: [-15, -24], 6: [15, -24] }[d] || [0, -18];
        s.x = toScreenX(px()) + off[0];
        s.y = toScreenY(py()) + off[1];
        s.scale.set(d === 2 ? 0.8 : 0.55, 0.8);
        s.opacity = act.blockT <= parryWindow() ? 255 : 215;
    };
    Sprite_CombatLayer.prototype.updateBars = function() {
        const Hn = H(), animals = foes();   // (the animals and the men - Humans.js)
        const seen = new Set();
        for (const a of animals) {
            if (!showsBar(a)) continue;
            seen.add(a);
            let e = this._bars.get(a);
            if (!e) {
                e = { sprite: new Sprite(new Bitmap(ENEMY_BAR_W + 22, 12)), key: "" };
                e.sprite.anchor.set(0.5, 1);
                this.addChild(e.sprite);
                this._bars.set(a, e);
            }
            const key = Math.round(a._hp) + ":" + Math.round(a._poise || 0) + ":" + (a._stun > 0 ? 1 : 0) + ":" + a._level + ":" + hero().level;
            if (key !== e.key) { e.key = key; drawEnemyBar(e.sprite.bitmap, a); }
            const sprite = a._sprite, top = sprite && sprite.bitmap && sprite.bitmap.isReady() ? sprite.patternHeight() : 48;
            // (a big one - the bear: over its "?" / "!", which goes higher while it is reared up; a creature of the ruins says its own: barTop)
            const sp = (Hn && Hn.SPECIES[a.kind()]) || {}, my = sp.markYTall && ["warn", "pinWind", "swipeWind"].includes(a._mode) ? sp.markYTall : sp.markY;
            const tall = my !== undefined && my < -70 ? -my + 30 : 0, own = typeof a.barTop === "function" ? a.barTop() : 0;
            e.sprite.x = toScreenX(a.centerX()) - 9;
            e.sprite.y = toScreenY(a.centerY()) + Math.round($gameMap.tileHeight() / 2) - (own || Math.max(Math.min(top, 70), tall)) - 6 - (a.jumpHeight ? a.jumpHeight() : 0);
        }
        for (const [a, e] of this._bars) {
            if (seen.has(a)) continue;
            this.removeChild(e.sprite);
            e.sprite.destroy();
            this._bars.delete(a);
        }
    };

    // the weapon in hand, a small plate in the bottom right corner ([ and ] switch) - shown only in the combat mode (user)
    function Sprite_WeaponPlate() {
        this.initialize(...arguments);
    }
    Sprite_WeaponPlate.prototype = Object.create(Sprite.prototype);
    Sprite_WeaponPlate.prototype.constructor = Sprite_WeaponPlate;
    Sprite_WeaponPlate.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(230, 38));
        this.anchor.set(1, 1);
        this._key = null;
    };
    Sprite_WeaponPlate.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.x = Graphics.width - 14;
        this.y = Graphics.height - 14;
        const h = $gameSystem ? hand() : null;
        this.visible = !!h && combatMode() && !$gameMessage.isBusy() && !$gameTemp._farmMenuOpen;   // (only in the combat mode)
        if (!h || h === this._key) return;
        const set = ImageManager.loadSystem("IconSet");
        if (!set.isReady()) return;
        this._key = h;
        const bmp = this.bitmap, ctx = bmp.context, U = style();
        bmp.clear();
        if (U) U.panel(ctx, 0, 0, bmp.width, bmp.height, { cut: 4 });
        else { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, bmp.width, bmp.height); }
        const id = h[0] === "m" ? Number(h.slice(1)) : (has(126) ? 126 : 125), icon = handIcon(h);
        bmp.blt(set, (icon % 16) * 32, Math.floor(icon / 16) * 32, 32, 32, 4, 3);
        bmp.fontSize = 17;
        bmp.textColor = (U && U.text) || "#eceef0";
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText(h[0] === "m" ? MELEE[id].name : "Łuk / proca", 40, 0, 150, 38, "left");
        bmp.textColor = (U && U.muted) || "#9aa0a8";
        bmp.drawText("[ ]", bmp.width - 40, 0, 32, 38, "center");
    };
    // the level and the experience: a slim plate over the weapon plate (in its place when there is no weapon); it lights up when
    // experience comes, and shows a yellow "P" while there are points to give out (menu P -> Postać)
    const XP_W = 230, XP_H = 24;
    function Sprite_XpBar() {
        this.initialize(...arguments);
    }
    Sprite_XpBar.prototype = Object.create(Sprite.prototype);
    Sprite_XpBar.prototype.constructor = Sprite_XpBar;
    Sprite_XpBar.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(XP_W, XP_H));
        this.anchor.set(1, 1);
        this._key = "";
        this._glow = 0;
        this._lastXp = -1;
    };
    Sprite_XpBar.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!$gameSystem) return;
        const h = hero(), plate = SceneManager._scene && SceneManager._scene._weaponPlate;
        this.visible = !$gameMessage.isBusy() && !$gameTemp._farmMenuOpen;
        this.x = Graphics.width - 14;
        this.y = Graphics.height - 14 - (plate && plate.visible ? plate.height + 6 : 0);
        const total = h.level * 100000 + h.xp;
        if (this._lastXp >= 0 && total > this._lastXp) this._glow = 40;
        this._lastXp = total;
        if (this._glow > 0) this._glow--;
        const key = h.level + ":" + h.xp + ":" + unspent() + ":" + Math.ceil(this._glow / 4);
        if (key !== this._key) { this._key = key; this.redraw(); }
    };
    Sprite_XpBar.prototype.redraw = function() {
        const bmp = this.bitmap, ctx = bmp.context, U = style(), h = hero(), top = h.level >= MAX_LEVEL;
        bmp.clear();
        if (U) U.panel(ctx, 0, 0, XP_W, XP_H, { cut: 3, accent: false });
        else { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, XP_W, XP_H); }
        bmp.fontSize = 15;
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.textColor = (U && U.text) || "#eceef0";
        bmp.drawText("Poz. " + h.level, 7, 0, 60, XP_H, "left");
        const points = unspent(), bx = 62, bw = XP_W - bx - (points > 0 ? 30 : 10), ratio = top ? 1 : h.xp / xpToNext(h.level);
        const glow = this._glow / 40;
        const fill = glow > 0 ? "rgb(" + Math.round(170 + 85 * glow) + "," + Math.round(130 + 110 * glow) + ",255)" : "#a97cf0";
        if (U) U.bar(ctx, bx, 9, bw, 6, ratio, fill);
        else { ctx.fillStyle = "#16181c"; ctx.fillRect(bx, 9, bw, 6); ctx.fillStyle = fill; ctx.fillRect(bx, 9, Math.round(bw * ratio), 6); }
        if (points > 0) {   // points to give out: a small yellow "P" (the menu key)
            const ax = XP_W - 24;
            ctx.fillStyle = (U && U.accent) || "#ffd23f";
            ctx.fillRect(ax, 4, 17, 16);
            bmp.fontSize = 14;
            bmp.outlineWidth = 0;
            bmp.textColor = "#101216";
            bmp.drawText("P", ax, 1, 17, 22, "center");
        }
        bmp._baseTexture.update();
    };
    // "Tryb walki" at the top centre of the screen while the combat mode is on, pulsing slowly (MODE_PULSE frames a beat)
    function Sprite_ModeBadge() {
        this.initialize(...arguments);
    }
    Sprite_ModeBadge.prototype = Object.create(Sprite.prototype);
    Sprite_ModeBadge.prototype.constructor = Sprite_ModeBadge;
    Sprite_ModeBadge.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(170, 30));
        const bmp = this.bitmap, U = style();
        if (U) U.panel(bmp.context, 0, 0, 170, 30, { cut: 4 });
        bmp.fontSize = 17;
        bmp.textColor = "#ffb07f";
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText("Tryb walki", 0, 0, 170, 30, "center");
        this.anchor.set(0.5, 0);
        this.visible = false;
    };
    const MODE_PULSE = 84;
    Sprite_ModeBadge.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.visible = combatMode() && !$gameMessage.isBusy();
        this.x = Graphics.width / 2;
        this.y = 14;
        this.opacity = Math.round(165 + 90 * Math.cos(Graphics.frameCount * 2 * Math.PI / MODE_PULSE));   // (75..255)
    };
    // "Poziom N!" across the top of the screen for a few seconds (Combat.js tells the bus "levelUp")
    let levelBanner = null;   // { level, t }
    T.on("levelUp", e => { levelBanner = { level: e.level, t: 0 }; }, { owner: "Combat" });
    function Sprite_LevelBanner() {
        this.initialize(...arguments);
    }
    Sprite_LevelBanner.prototype = Object.create(Sprite.prototype);
    Sprite_LevelBanner.prototype.constructor = Sprite_LevelBanner;
    Sprite_LevelBanner.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(560, 86));
        this.anchor.set(0.5, 0);
        this.opacity = 0;
        this._shown = 0;
    };
    Sprite_LevelBanner.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.x = Graphics.width / 2;
        this.y = 70;
        if (!levelBanner) { this.opacity = 0; return; }
        if (this._shown !== levelBanner.level) {
            this._shown = levelBanner.level;
            const bmp = this.bitmap, ctx = bmp.context, U = style();
            bmp.clear();
            if (U) U.panel(ctx, 0, 0, bmp.width, bmp.height, { cut: 8, fill: "rgba(12,13,17,0.94)" });
            bmp.fontSize = 34;
            bmp.textColor = (U && U.accent) || "#ffd23f";
            bmp.outlineColor = "rgba(0,0,0,0.9)";
            bmp.outlineWidth = 4;
            bmp.drawText("Poziom " + levelBanner.level + "!", 0, 6, bmp.width, 44, "center");
            bmp.fontSize = 18;
            bmp.textColor = (U && U.text) || "#eceef0";
            bmp.drawText("+" + POINTS_PER_LEVEL + " punkty atrybutów, +" + SKILL_POINTS_PER_LEVEL + " punkt umiejętności  ·  menu P → Postać", 0, 48, bmp.width, 28, "center");
        }
        levelBanner.t++;
        const t = levelBanner.t;
        this.opacity = t < 20 ? t * 13 : t < 220 ? 255 : Math.max(0, 255 - (t - 220) * 8);
        if (t > 260) levelBanner = null;
    };

    // (Combat.js's hooks) the combat layer in the tilemap, over the characters; the plates and labels on the map's screen
    function addCombatLayer(spriteset) {
        spriteset._combatLayer = new Sprite_CombatLayer();
        spriteset._tilemap.addChild(spriteset._combatLayer);
        for (const f of floaters) f.sprite = null;
        for (const s of sparks) s.sprite = null;
    }
    function addHud(scene) {
        scene._weaponPlate = new Sprite_WeaponPlate();
        scene.addChild(scene._weaponPlate);
        scene._xpBar = new Sprite_XpBar();
        scene.addChild(scene._xpBar);
        scene._modeBadge = new Sprite_ModeBadge();
        scene.addChild(scene._modeBadge);
        scene._levelBanner = new Sprite_LevelBanner();
        scene.addChild(scene._levelBanner);
    }
    // (after every Sprite_Character.update) the hero's sprite: a red flash when hurt, the flinch; without a roll sheet the roll turns
    // the figure over. An animal's: a white flash when hit, stretched while it rushes, swaying with stars while it reels
    function updateCharacter(sprite) {
        const ch = sprite._character;
        if (ch === $gamePlayer) {
            const fear = act.stun > 0 && act.stunKind === "fear";   // (stage 4: frozen by a wraith's truth - pale, trembling)
            const tint = act.hurtT > 0 ? [255, 60, 50, Math.round(act.hurtT * 9)] : act.stun > 0 && act.stunKind === "down" && KNOCK_KIND < 0 ? [40, 40, 60, 90]
                : fear ? [150, 170, 255, 70 + Math.round(30 * Math.sin(Graphics.frameCount / 4))] : act.stun > 0 && act.stunKind === "held" ? [90, 140, 130, 60] : null;
            if (tint) { sprite.setBlendColor(tint); sprite._combatTint = true; } else if (sprite._combatTint) { sprite.setBlendColor([0, 0, 0, 0]); sprite._combatTint = false; }
            if (fear || (act.stun > 0 && act.stunKind === "held")) sprite.x += (Graphics.frameCount % 4 < 2 ? 1 : -1);
            if (act.flinchT > 0 && !$gamePlayer._toolSwing) {   // hit: he leans away from the blow on his feet, sinks a little, straightens up
                const e = Math.sin((1 - act.flinchT / act.flinchLen) * Math.PI), [hx, hy] = act.hitFrom || [0, 1];
                sprite.rotation = (Math.abs(hx) > 0.3 ? Math.sign(hx) : ($gamePlayer.direction() === 4 ? -1 : 1) * 0.5) * 0.3 * e;
                sprite.x += Math.round(hx * 5 * e);
                sprite.y += Math.round(hy * 3 * e);
                sprite.scale.y = 1 - 0.1 * e;
                sprite._flinching = true;
            } else if (sprite._flinching) {
                sprite._flinching = false;
                sprite.rotation = 0;
                sprite.scale.y = 1;
            }
            if (act.mode === "roll" && ROLL_KIND < 0) {   // (no sheet: the figure spins over once)
                const k = act.rollT / act.rollLen, side = act.rollDir[0] < 0 ? -1 : 1;
                sprite.rotation = side * Math.PI * 2 * easeOut(k);
                sprite.anchor.y = 0.72;
                sprite.y -= Math.round(sprite.patternHeight() * 0.28);
            } else if (sprite.rotation !== 0 && !sprite._flinching && ch === $gamePlayer) {
                sprite.rotation = 0;
                sprite.anchor.y = 1;
            }
        } else if (ch && ch.isAnimal) {
            const f = ch._flashT || 0;
            if (f > 0) { sprite.setBlendColor([255, 255, 255, Math.round(f * 25)]); sprite._combatTint = true; }
            else if (sprite._combatTint) { sprite.setBlendColor([0, 0, 0, 0]); sprite._combatTint = false; }
            // flat out: a little longer along the run, a little lower
            const rush = typeof ch.isRushing === "function" && ch.isRushing();
            if (rush || sprite._rushScale) {
                const d = ch.direction(), side = d === 4 || d === 6, sx = Math.sign(sprite.scale.x) || 1;
                sprite.scale.x = sx * (rush && side ? 1.1 : 1);
                sprite.scale.y = rush ? (side ? 0.94 : 1.08) : 1;
                sprite._rushScale = rush;
            }
            // reeling (its balance broken): it sways, and little stars turn over its head
            const st = ch._stun || 0;
            if (st > 0 && !ch._dead) {
                sprite.x += Math.floor(st / 3) % 2 ? 1 : -1;
                if (!sprite._stunStars) { sprite._stunStars = new Sprite(stunStarsBitmap()); sprite._stunStars.anchor.set(0.5, 0.5); sprite.addChild(sprite._stunStars); }
                sprite._stunStars.visible = true;
                sprite._stunStars.y = -Math.round(sprite.patternHeight() * 0.82);
                sprite._stunStars.scale.x = Math.cos(Graphics.frameCount / 7);
            } else if (sprite._stunStars) sprite._stunStars.visible = false;
        }
    }
    // three little yellow stars in a row (turned by scale.x: they seem to circle)
    let starsBmp = null;
    function stunStarsBitmap() {
        if (starsBmp) return starsBmp;
        starsBmp = new Bitmap(34, 14);
        const ctx = starsBmp.context;
        for (const [x, y] of [[5, 8], [17, 4], [29, 8]]) {
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillRect(x - 3, y - 1, 7, 3); ctx.fillRect(x - 1, y - 3, 3, 7);
            ctx.fillStyle = "#ffe066";
            ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5);
            ctx.fillStyle = "#fff8d0";
            ctx.fillRect(x, y, 1, 1);
        }
        starsBmp._baseTexture.update();
        return starsBmp;
    }

    // ==================================================================
    // P -> Postać: the level, the attributes (the free points given out) and the skills. MenuPanel.js's panel goes round it
    // when that plugin is there. Atrybuty: ←/→ put points on the chosen attribute (only planned until Enter confirms);
    // Umiejętności: Enter learns the chosen skill. Both ask first - nothing given out can be taken back.
    // ==================================================================
    const num2 = n => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
    // what each attribute does now: [label, value] (the preview evaluates it with the planned points)
    const ATTR_EFFECTS = {
        str: () => [["Obrażenia wręcz", "×" + num2(strMult())], ["Zbijanie równowagi wroga", "×" + num2(poiseMult())], ["Udźwig", "+" + carryBonus()],
            ["Rąbanie, kopanie, kucie", gatherBonus() > 0 ? "o " + (Math.round(gatherBonus() * 1000) / 10).toString().replace(".", ",") + "% mniej uderzeń" : "zwykłe"]],
        dex: () => [["Koszt przewrotu", rollCost() + " oddechu"], ["Nietykalność w przewrocie", secText(rollIFrames())],
            ["Czas na następny cios serii", secText(comboWindow())], ["Celowanie (łuk, proca)", aimSteady() > 0.999 ? "zwykłe" : "o " + Math.round((1 / aimSteady() - 1) * 100) + "% szybciej"],
            ["Praca (budowa, rąbanie, kucie)", dexWork() > 1.001 ? "o " + Math.round((dexWork() - 1) * 100) + "% szybciej" : "zwykła"],
            ["Strzał z ukrycia", "×" + num2(sneakMult(true))]],
        con: () => [["Życie", String(heroMhp())], ["Oddech (wypoczęty)", String(baseBreath())], ["Przewraca cię cios o sile", String(knockdownAt())],
            ["Szansa na ranę", Math.round(woundChance(1) * 100) + "% zwykłej"]],
        per: () => [["Okno parowania", secText(parryWindow())], ["Trafienie krytyczne", Math.round(critChance() * 100) + "%"], ["Atak z ukrycia", "×" + num2(sneakMult(false))]],
        wil: () => [["Opór przed „prawdą” i strachem", Math.round(mindResist(0) * 100) + "%"], ["Strach i zamęt trwają", Math.round(mindTime(1000) / 10) + "% zwykłego"]]
    };
    // runs fn with the planned points added to the attributes
    function withAttrs(add, fn) {
        const h = hero(), keep = h.attr;
        h.attr = Object.assign({}, keep);
        for (const a of ATTRS) h.attr[a.id] += add[a.id] || 0;
        try { return fn(); } finally { h.attr = keep; }
    }
    function wrapText(win, text, width) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const next = line ? line + " " + word : word;
                if (line && win.textWidth(next) > width) { out.push(line); line = word; } else line = next;
            }
            out.push(line);
        }
        return out;
    }
    const HERO_TABS = ["Atrybuty", "Umiejętności"];
    // from the panel's left: where the attribute list ends (Atrybuty); where the list of fields ends and where the tree ends (Umiejętności)
    const HERO_SPLIT = 430, DOMAIN_SPLIT = 235, TREE_SPLIT = 795;
    const uic = () => style() || { accent: "#ffd23f", text: "#eceef0", muted: "#8a9099", line: "#3a3e46", panel() {}, bar() {} };
    const treeSkills = treeId => SKILLS.filter(s => s.tree === treeId);

    // the list on the left of the Atrybuty page: the five attributes
    function Window_HeroList() { this.initialize(...arguments); }
    Window_HeroList.prototype = Object.create(Window_Selectable.prototype);
    Window_HeroList.prototype.constructor = Window_HeroList;
    Window_HeroList.prototype.initialize = function(rect, scene) {
        this._scene = scene;
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_HeroList.prototype.maxItems = function() { return ATTRS.length; };
    Window_HeroList.prototype.itemHeight = function() { return 66; };
    Window_HeroList.prototype.cursorRight = function() { this._scene.plan(ATTRS[this.index()].id, 1); };
    Window_HeroList.prototype.cursorLeft = function() { this._scene.plan(ATTRS[this.index()].id, -1); };
    Window_HeroList.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._scene && this._scene._list === this) this._scene.refreshDetail();
    };
    Window_HeroList.prototype.drawItem = function(index) {
        const U = uic(), ctx = this.contents.context, h = hero(), sc = this._scene;
        this.resetFontSettings();
        const a = ATTRS[index], add = sc._plan[a.id] || 0, v = h.attr[a.id], R = this.itemRectWithPadding(index), ty = R.y - 4;
        this.contents.fontSize = 22;
        this.changeTextColor(U.text);
        this.drawText(a.name, R.x + 4, ty, R.width - 90);
        this.contents.fontSize = 26;
        this.changeTextColor(add > 0 ? U.accent : U.text);
        this.drawText(String(v + add), R.x, ty, R.width - 6, "right");
        if (add > 0) {
            this.contents.fontSize = 18;
            this.drawText("+" + add, R.x, ty + 2, R.width - 44, "right");
        }
        const bw = R.width - 12, bx = R.x + 4, by = R.y + R.height - 14;
        U.bar(ctx, bx, by, bw, 5, (v + add) / ATTR_MAX, add > 0 ? U.accent : "#8fa4c8");
        if (add > 0) { ctx.fillStyle = "#8fa4c8"; ctx.fillRect(bx, by, Math.round(bw * v / ATTR_MAX), 5); }
        this.resetFontSettings();
    };
    // under the attributes: what he wears (stage 2) - the shield and the jacket (it is enough to have them in the bag), what each does
    // and how worn it is (Durability.js); a dash and where it is made when he has none
    Window_HeroList.prototype.drawAllItems = function() {
        Window_Selectable.prototype.drawAllItems.call(this);
        this.drawGear(ATTRS.length * this.itemHeight() + 10 - this.scrollBaseY());
    };
    Window_HeroList.prototype.drawGear = function(y) {
        const U = uic(), W = this.innerWidth, D = T.api("Durability"), sh = shield(), ar = armor(), c = this.contents;
        this.resetFontSettings();
        c.fillRect(4, y, W - 8, 1, U.line);
        c.fontSize = 13;
        this.changeTextColor(U.muted);
        c.drawText("WYPOSAŻENIE", 4, y + 4, W - 8, 16, "left");
        y += 24;
        // one row each (34 px, it has to fit under the five attributes): the icon, the name, under it what it does and its wear
        const row = (kind, owned, does, none) => {
            const item = owned ? $dataItems[owned.id] : null;
            if (item) this.drawIcon(item.iconIndex, 4, y);
            c.fontSize = 16;
            this.changeTextColor(item ? U.text : U.muted);
            c.drawText(item ? item.name : kind + ": " + none, item ? 42 : 4, y, W - 46, 18, "left");
            if (item) {
                const wear = D && D.lifeOf && D.lifeOf(owned.id) ? "  ·  " + D.left(owned.id) + "/" + D.lifeOf(owned.id) : "";
                c.fontSize = 13;
                this.changeTextColor(U.accent);
                c.drawText(does + wear, 42, y + 17, W - 46, 16, "left");
            }
            y += 34;
        };
        row("Tarcza", sh, sh ? "blok zatrzymuje " + Math.round(sh.reduce * 100) + "% ciosu" : "", "brak (warsztat)");
        row("Kurtka", ar, ar ? "obrażenia o " + Math.round(ar.reduce * 100) + "% mniejsze" : "", "brak (garbarnia)");
        this.resetFontSettings();
    };

    // ------------------------------------------------------------------
    // One skill tree: the field's name on top, the level each row needs on the left, the skills as
    // boxes on a 5 x 6 grid joined by lines from the skills that open them. A box: gold = learnt (filled when at the top rank),
    // white frame = can be learnt now (or as soon as there is a point), grey = still closed; the small bars are its ranks.
    // The arrows walk to the nearest box that way; ← with nothing more to the left goes back to the list of fields.
    // ------------------------------------------------------------------
    const TREE = { strip: 40, labelW: 48, rows: 6, cols: 5, nodeH: 50, padX: 12 };
    function Window_SkillTree() { this.initialize(...arguments); }
    Window_SkillTree.prototype = Object.create(Window_Selectable.prototype);
    Window_SkillTree.prototype.constructor = Window_SkillTree;
    Window_SkillTree.prototype.initialize = function(rect, scene) {
        this._scene = scene;
        this._nodes = [];
        this._treeId = TREES.length ? TREES[0].id : "";
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_SkillTree.prototype.setTree = function(treeId) {
        this._treeId = treeId;
        this._nodes = treeSkills(treeId);
        this.refresh();
    };
    Window_SkillTree.prototype.maxItems = function() { return this._nodes.length; };
    Window_SkillTree.prototype.ensureCursorVisible = function() {};   // (the whole tree fits: no scrolling)
    Window_SkillTree.prototype.processWheelScroll = function() {};
    Window_SkillTree.prototype.overallHeight = function() { return this.innerHeight; };
    Window_SkillTree.prototype.cell = function(row, col) {
        const W = this.innerWidth - TREE.labelW, pitchX = W / TREE.cols, pitchY = (this.innerHeight - TREE.strip) / TREE.rows;
        const w = Math.round(pitchX - TREE.padX), h = Math.min(TREE.nodeH, Math.round(pitchY - 16));
        return new Rectangle(Math.round(TREE.labelW + col * pitchX + (pitchX - w) / 2), Math.round(TREE.strip + row * pitchY + (pitchY - h) / 2), w, h);
    };
    Window_SkillTree.prototype.itemRect = function(index) {
        const s = this._nodes[index];
        return s ? this.cell(s.row, s.col) : new Rectangle(0, 0, 0, 0);
    };
    Window_SkillTree.prototype.moveTo = function(dx, dy) {
        const cur = this._nodes[this.index()];
        if (!cur) return;
        let best = -1, bestD = Infinity;
        this._nodes.forEach((s, i) => {
            const ddx = s.col - cur.col, ddy = s.row - cur.row;
            if (i === this.index() || (dx && Math.sign(ddx) !== dx) || (dy && Math.sign(ddy) !== dy)) return;
            const d = dx ? Math.abs(ddx) + Math.abs(ddy) * 3 : Math.abs(ddy) * 3 + Math.abs(ddx);   // (the nearest row / column first)
            if (d < bestD) { bestD = d; best = i; }
        });
        if (best >= 0) this.select(best);
    };
    // the key that brought the focus into the tree (→ / Enter on the list) must not act in it as well in the same frame
    Window_SkillTree.prototype.processCursorMove = function() { if (!(this._inputLock > 0)) Window_Selectable.prototype.processCursorMove.call(this); };
    Window_SkillTree.prototype.processHandling = function() { if (!(this._inputLock > 0)) Window_Selectable.prototype.processHandling.call(this); };
    Window_SkillTree.prototype.update = function() {
        Window_Selectable.prototype.update.call(this);
        if (this._inputLock > 0) this._inputLock--;
    };
    Window_SkillTree.prototype.cursorDown = function() { this.moveTo(0, 1); };
    Window_SkillTree.prototype.cursorUp = function() { this.moveTo(0, -1); };
    Window_SkillTree.prototype.cursorRight = function() { this.moveTo(1, 0); };
    Window_SkillTree.prototype.cursorLeft = function() {
        const i = this.index();
        this.moveTo(-1, 0);
        if (this.index() === i && this._scene && this._scene.focusDomains) this._scene.focusDomains();
    };
    Window_SkillTree.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._scene && this._scene._tree === this) this._scene.refreshDetail();
    };
    Window_SkillTree.prototype.drawAllItems = function() {
        this.drawStrip();
        this.drawLinks();
        for (let i = 0; i < this.maxItems(); i++) this.drawItem(i);
    };
    Window_SkillTree.prototype.drawStrip = function() {
        const U = uic(), c = this.contents, W = this.innerWidth, t = TREES.find(x => x.id === this._treeId);
        if (!t) return;
        const list = treeSkills(t.id), spent = list.reduce((a, s) => a + skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
        c.fontSize = 22;
        this.changeTextColor(U.accent);
        c.drawText(t.name, 0, 2, W, 30, "center");
        c.fontSize = 16;
        this.changeTextColor(U.muted);
        c.drawText("stopni " + spent + " / " + total, W - 214, 6, 210, 24, "right");
        // the level each row needs
        const h = hero();
        for (let r = 0; r < TREE.rows; r++) {
            const cell = this.cell(r, 0), lv = ROW_LEVEL[r] || 1;
            c.fontSize = 13;
            this.changeTextColor(h.level >= lv ? U.muted : "#8a5a52");
            c.drawText("poz.", 0, cell.y + cell.height / 2 - 16, TREE.labelW - 8, 16, "right");
            c.fontSize = 17;
            this.changeTextColor(h.level >= lv ? U.text : "#c47a6e");
            c.drawText(String(lv), 0, cell.y + cell.height / 2 - 1, TREE.labelW - 8, 18, "right");
        }
        this.resetFontSettings();
    };
    Window_SkillTree.prototype.drawLinks = function() {
        const ctx = this.contents.context, U = uic(), r0 = this.cell(0, 0), r1 = this.cell(1, 0);
        const halfGap = Math.max(3, Math.round((r1.y - (r0.y + r0.height)) / 2));   // the turn is just above the skill it leads to
        ctx.save();
        ctx.lineWidth = 2;
        for (const s of this._nodes) {
            for (const f of s.from) {
                const p = this._nodes.find(n => n.id === f);
                if (!p) continue;
                const a = this.cell(p.row, p.col), b = this.cell(s.row, s.col), open = skillRank(f) > 0;
                ctx.strokeStyle = open && skillRank(s.id) > 0 ? U.accent : open ? "rgba(236,238,240,0.6)" : "rgba(90,95,105,0.7)";
                const x1 = Math.round(a.x + a.width / 2) + 0.5, y1 = a.y + a.height, x2 = Math.round(b.x + b.width / 2) + 0.5, y2 = b.y;
                const midY = b.y - halfGap + 0.5;   // (right angles, like a family tree; a way over two rows turns only above its skill)
                ctx.beginPath();
                ctx.moveTo(x1, y1); ctx.lineTo(x1, midY); ctx.lineTo(x2, midY); ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        ctx.restore();
        this.contents._baseTexture.update();
    };
    // what state a skill's box shows: "full" (top rank), "part" (learnt, more ranks to go), "open" (can be learnt), "locked"
    function skillState(s) {
        const rank = skillRank(s.id), block = skillBlock(s.id);
        if (rank >= s.ranks) return "full";
        if (rank > 0) return "part";
        return !block || block === "Brak punktów umiejętności." ? "open" : "locked";
    }
    Window_SkillTree.prototype.drawItem = function(index) {
        const s = this._nodes[index], r = this.itemRect(index), U = uic(), c = this.contents, ctx = c.context;
        const rank = skillRank(s.id), st = skillState(s);
        const line = st === "locked" ? U.line : st === "open" ? "#c9ccd2" : U.accent;
        const fill = st === "full" ? "rgba(96,78,16,0.95)" : st === "part" ? "rgba(52,44,14,0.95)" : "rgba(16,17,21,0.95)";
        U.panel(ctx, r.x, r.y, r.width, r.height, { cut: 4, fill, line, accent: st === "full" || st === "part" });
        c.fontSize = 15;
        this.changeTextColor(st === "locked" ? U.muted : st === "open" ? U.text : st === "full" ? "#fff4c2" : U.accent);
        const lines = wrapText(this, s.name, r.width - 8).slice(0, 2), lh = 16, top = r.y + (lines.length > 1 ? 4 : 11);
        lines.forEach((ln, k) => c.drawText(ln, r.x + 4, top + k * lh, r.width - 8, lh, "center"));
        const pw = 8, gap = 3, total = s.ranks * pw + (s.ranks - 1) * gap, x0 = r.x + Math.round((r.width - total) / 2), y0 = r.y + r.height - 8;
        for (let k = 0; k < s.ranks; k++) {
            ctx.fillStyle = k < rank ? U.accent : st === "locked" ? "#2a2d33" : "#4a4e57";
            ctx.fillRect(x0 + k * (pw + gap), y0, pw, 4);
        }
        c._baseTexture.update();
        this.resetFontSettings();
    };

    // the band beside the tabs: the free points
    function drawHeroPoints(win, plan) {
        const U = uic(), h = hero(), planned = Object.values(plan).reduce((a, b) => a + b, 0), W = win.innerWidth;
        win.contents.clear();
        win.resetFontSettings();
        let x = W;
        const part = (label, n) => {
            win.contents.fontSize = 24;
            const nw = Math.ceil(win.textWidth(String(n))) + 4;
            win.changeTextColor(n > 0 ? U.accent : U.muted);
            win.drawText(String(n), x - nw, 0, nw, "right");
            x -= nw + 8;
            win.contents.fontSize = 18;
            const lw = Math.ceil(win.textWidth(label)) + 4;
            win.changeTextColor(U.muted);
            win.drawText(label, x - lw, 2, lw, "right");
            x -= lw + 26;
        };
        part("Punkty umiejętności", h.skillPoints);
        part("Punkty atrybutów", h.points - planned);
        win.resetFontSettings();
    }

    // the fields on the left of the Umiejętności tab: ↑↓ choose one (its tree shows beside it at once), → or Enter go into it.
    // Each line: the name (gold once a point is in it), the ranks taken of all, and a dot when something can be learnt there now.
    function Window_SkillDomains() { this.initialize(...arguments); }
    Window_SkillDomains.prototype = Object.create(Window_Selectable.prototype);
    Window_SkillDomains.prototype.constructor = Window_SkillDomains;
    Window_SkillDomains.prototype.initialize = function(rect, scene) {
        this._scene = scene;
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_SkillDomains.prototype.maxItems = function() { return TREES.length; };
    Window_SkillDomains.prototype.itemHeight = function() { return Math.max(30, Math.floor(this.innerHeight / Math.max(1, TREES.length))); };
    Window_SkillDomains.prototype.cursorRight = function() { this._scene.enterTree(); };
    Window_SkillDomains.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._scene && this._scene._domains === this && index >= 0) this._scene.showDomain(index);
    };
    Window_SkillDomains.prototype.drawItem = function(index) {
        const t = TREES[index], r = this.itemLineRect(index), U = uic(), list = treeSkills(t.id);
        const spent = list.reduce((a, s) => a + skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
        const ready = hero().skillPoints > 0 && list.some(s => { const st = skillState(s); return (st === "open" || st === "part") && !skillBlock(s.id); });
        this.resetFontSettings();
        this.contents.fontSize = 19;
        this.changeTextColor(spent > 0 ? U.accent : U.text);
        this.drawText(t.name, r.x + 2, r.y, r.width - 58);
        this.contents.fontSize = 15;
        this.changeTextColor(U.muted);
        this.drawText(spent + "/" + total, r.x, r.y + 1, r.width - (ready ? 16 : 2), "right");
        if (ready) {
            this.contents.fontSize = 18;
            this.changeTextColor(U.accent);
            this.drawText("•", r.x, r.y, r.width - 2, "right");
        }
        this.resetFontSettings();
    };

    // two tabs (Q / E): Atrybuty, Umiejętności (the fields on the left, the chosen field's tree in the middle)
    function Scene_Hero() { this.initialize(...arguments); }
    Scene_Hero.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Hero.prototype.constructor = Scene_Hero;
    Scene_Hero.prototype.prepare = function(tab) { this._startTab = tab || 0; };
    // a panel a little bigger than the usual wide one: the fields, a tree and its description side by side
    Scene_Hero.prototype.heroRect = function() {
        const w = Math.min(Graphics.boxWidth - 40, 1180), h = Math.min(Graphics.boxHeight - 40, 640);
        return new Rectangle(Math.round((Graphics.boxWidth - w) / 2), Math.round((Graphics.boxHeight - h) / 2), w, h);
    };
    Scene_Hero.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const MP = T.api("MenuPanel"), r = this.heroRect(), HEAD = MP ? MP.HEAD : 58, TABS = MP ? MP.TABS : 60, FOOT = MP ? MP.FOOT : 42;
        const top = r.y + HEAD + TABS, h = r.height - HEAD - TABS - FOOT;
        this._rect = r;
        this._bodyTop = top;
        this._bodyH = h;
        this._tab = this._startTab ? 1 : 0;
        this._focus = "domains";   // on Umiejętności: "domains" (the list of fields) or "tree"
        this._plan = {};
        this._tabs = new Window_Command(new Rectangle(r.x + 14, r.y + HEAD - 4, 400, 68));
        this._tabs.maxCols = () => HERO_TABS.length;
        this._tabs.makeCommandList = function() { HERO_TABS.forEach(t => this.addCommand(t, "tab")); };
        this._tabs.itemTextAlign = () => "center";
        this._tabs.refresh();
        this._tabs.deactivate();
        this.addWindow(this._tabs);
        this._points = new Window_Base(new Rectangle(r.x + 420, r.y + HEAD + 2, r.width - 440, 56));
        this.addWindow(this._points);
        this._detail = new Window_Base(new Rectangle(r.x + HERO_SPLIT + 8, top + 6, r.width - HERO_SPLIT - 18, h - 12));
        this.addWindow(this._detail);
        this._list = new Window_HeroList(new Rectangle(r.x + 10, top + 6, HERO_SPLIT - 18, h - 12), this);
        this._domains = new Window_SkillDomains(new Rectangle(r.x + 10, top + 6, DOMAIN_SPLIT - 16, h - 12), this);
        this._tree = new Window_SkillTree(new Rectangle(r.x + DOMAIN_SPLIT + 4, top + 4, TREE_SPLIT - DOMAIN_SPLIT - 8, h - 8), this);
        this._list.setHandler("ok", this.onOk.bind(this));
        this._list.setHandler("cancel", this.onCancel.bind(this));
        this._domains.setHandler("ok", () => this.enterTree());
        this._domains.setHandler("cancel", this.onCancel.bind(this));
        this._tree.setHandler("ok", this.onOk.bind(this));
        this._tree.setHandler("cancel", () => this.focusDomains());
        for (const w of [this._list, this._domains, this._tree]) {
            w.setHandler("pagedown", () => this.changeTab(1));
            w.setHandler("pageup", () => this.changeTab(-1));
            this.addWindow(w);
        }
        // the question before anything is given out (a small window over the rest)
        const cw = 520, ch = 214;
        this._confirm = new Window_Command(new Rectangle(r.x + Math.round((r.width - cw) / 2), r.y + Math.round((r.height - ch) / 2), cw, ch));
        this._confirm._lines = [];
        this._confirm.makeCommandList = function() { this.addCommand("Tak", "yes"); this.addCommand("Nie", "no"); };
        this._confirm.maxCols = () => 2;
        this._confirm.itemTextAlign = () => "center";
        const cf = this._confirm;
        cf.itemRect = function(index) {
            const rr = Window_Command.prototype.itemRect.call(this, index);
            rr.y = this.innerHeight - rr.height;
            return rr;
        };
        cf.drawAllItems = function() {
            const U = uic();
            this._lines.forEach((line, i) => {
                this.contents.fontSize = i === 0 ? 24 : 19;
                this.changeTextColor(i === 0 ? U.accent : U.text);
                this.drawText(line, 4, i === 0 ? 0 : 8 + i * 30, this.innerWidth - 8, "left");
            });
            this.resetFontSettings();
            Window_Command.prototype.drawAllItems.call(this);
        };
        cf.setHandler("yes", this.onConfirm.bind(this));
        cf.setHandler("no", this.onConfirmNo.bind(this));
        cf.setHandler("cancel", this.onConfirmNo.bind(this));
        cf.hide();
        cf.deactivate();
        this.addWindow(cf);
        if (MP && MP.Sprite_MenuPanel) {
            for (const w of [this._tabs, this._points, this._detail, this._list, this._domains, this._tree]) { w.opacity = 0; w.frameVisible = false; }
            this._menuPanel = new MP.Sprite_MenuPanel({ rect: r, title: "Postać", subtitle: this.subtitle(), tabs: true, splits: [HERO_SPLIT], hints: this.hints() });
            const i = this.children.indexOf(this._windowLayer);
            this.addChildAt(this._menuPanel, i >= 0 ? i : this.children.length);
        }
        this._domains.select(0);
        this.showTab();
    };
    Scene_Hero.prototype.subtitle = function() {
        const h = hero();
        return "Poziom " + h.level + (h.level >= MAX_LEVEL ? "  ·  najwyższy" : "  ·  " + h.xp + " / " + xpToNext(h.level) + " dośw. do następnego");
    };
    Scene_Hero.prototype.hints = function() {
        if (this._tab === 0) return [["↑↓", "wybierz"], ["←→", "rozdaj punkty"], ["Enter", "zatwierdź"], ["Q E", "zakładka"], ["Esc", "cofnij / wróć"]];
        if (this._focus === "tree") return [["strzałki", "wybierz"], ["Enter", "naucz się"], ["← Esc", "dziedziny"], ["Q E", "zakładka"]];
        return [["↑↓", "dziedzina"], ["→ Enter", "drzewko"], ["Q E", "zakładka"], ["Esc", "wróć"]];
    };
    // the window the keys go to now
    Scene_Hero.prototype.pageWindow = function() { return this._tab === 0 ? this._list : this._focus === "tree" ? this._tree : this._domains; };
    Scene_Hero.prototype.showTab = function() {
        const r = this._rect, attrs = this._tab === 0, split = attrs ? HERO_SPLIT : TREE_SPLIT;
        this._tabs.select(this._tab);
        this._detail.move(r.x + split + 8, this._bodyTop + 6, r.width - split - 18, this._bodyH - 12);
        this._detail.createContents();
        for (const w of [this._list, this._domains, this._tree]) w.deactivate();
        if (attrs) {
            this._domains.hide();
            this._tree.hide();
            this._list.show();
            this._list.refresh();
            this._list.select(Math.min(Math.max(0, this._list.index()), this._list.maxItems() - 1));
            this._list.activate();
        } else {
            this._list.hide();
            this._domains.show();
            this._tree.show();
            this._focus = "domains";
            this._tree.select(-1);
            this._domains.refresh();
            this._domains.activate();
            this.showDomain(Math.max(0, this._domains.index()));
        }
        if (this._menuPanel) this._menuPanel.set({ splits: attrs ? [HERO_SPLIT] : [DOMAIN_SPLIT, TREE_SPLIT] });
        this.refreshAll();
    };
    Scene_Hero.prototype.refreshAll = function() {
        if (this._tab === 0) this._list.refresh();
        else { this._domains.refresh(); this._tree.refresh(); }
        drawHeroPoints(this._points, this._plan);
        this.refreshDetail();
        if (this._menuPanel) this._menuPanel.set({ subtitle: this.subtitle(), hints: this.hints() });
    };
    Scene_Hero.prototype.changeTab = function(dir) {
        if (this._tab === 0 && Object.keys(this._plan).length) this._plan = {};   // (planned points are dropped when leaving the tab)
        this._tab = (this._tab + dir + HERO_TABS.length) % HERO_TABS.length;
        SoundManager.playCursor();
        this.showTab();
    };
    // the list of fields: the chosen field's tree shows beside it (not entered yet)
    Scene_Hero.prototype.showDomain = function(index) {
        const t = TREES[index];
        if (!t) return;
        if (this._tree._treeId !== t.id || !this._tree._nodes.length) { this._tree.setTree(t.id); this._treeLast = 0; }
        if (this._focus === "domains") this._tree.select(-1);
        this.refreshDetail();
    };
    // into the tree (→ / Enter on a field) and back out (← at its left edge, Esc)
    Scene_Hero.prototype.enterTree = function() {
        if (!this._tree._nodes.length) return;
        this._focus = "tree";
        this._domains.deactivate();
        this._tree._inputLock = 1;
        this._tree.activate();
        this._tree.select(Math.min(this._treeLast || 0, this._tree.maxItems() - 1));
        SoundManager.playCursor();
        if (this._menuPanel) this._menuPanel.set({ hints: this.hints() });
    };
    Scene_Hero.prototype.focusDomains = function() {
        this._treeLast = Math.max(0, this._tree.index());
        this._focus = "domains";
        this._tree.deactivate();
        this._tree.select(-1);
        this._domains.activate();
        SoundManager.playCursor();
        this.refreshDetail();
        if (this._menuPanel) this._menuPanel.set({ hints: this.hints() });
    };
    // ←/→ on an attribute: plan a point on it or take a planned one back
    Scene_Hero.prototype.plan = function(id, dir) {
        const h = hero(), planned = Object.values(this._plan).reduce((a, b) => a + b, 0), cur = this._plan[id] || 0;
        if (dir > 0 && (planned >= h.points || h.attr[id] + cur >= ATTR_MAX)) { SoundManager.playBuzzer(); return; }
        if (dir < 0 && cur <= 0) { SoundManager.playBuzzer(); return; }
        this._plan[id] = cur + dir;
        if (!this._plan[id]) delete this._plan[id];
        SoundManager.playCursor();
        this.refreshAll();
    };
    Scene_Hero.prototype.currentSkill = function() { return this._tab === 1 && this._focus === "tree" ? this._tree._nodes[this._tree.index()] || null : null; };
    Scene_Hero.prototype.onOk = function() {
        const h = hero();
        if (this._tab === 0) {
            const parts = ATTRS.filter(a => this._plan[a.id]).map(a => a.name + " " + h.attr[a.id] + " → " + (h.attr[a.id] + this._plan[a.id]));
            if (!parts.length) { SoundManager.playBuzzer(); this._list.activate(); return; }
            this.ask(["Rozdać punkty?", parts.join(",  "), "Tego nie da się cofnąć."]);
            return;
        }
        const sk = this.currentSkill(), block = sk && skillBlock(sk.id);
        if (!sk || block) { SoundManager.playBuzzer(); this._tree.activate(); return; }
        const rank = skillRank(sk.id);
        this.ask([(rank ? "Następny stopień: " : "Nauczyć się: ") + sk.name + (sk.ranks > 1 ? " (" + (rank + 1) + "/" + sk.ranks + ")" : "") + "?",
            "Kosztuje 1 punkt umiejętności.", "Tego nie da się cofnąć."]);
    };
    Scene_Hero.prototype.ask = function(lines) {
        const cf = this._confirm;
        cf._lines = lines;
        cf.refresh();
        cf.select(0);
        cf.show();
        cf.activate();
        this.pageWindow().deactivate();
    };
    Scene_Hero.prototype.closeAsk = function() {
        this._confirm.hide();
        this._confirm.deactivate();
        this.pageWindow().activate();
    };
    Scene_Hero.prototype.onConfirm = function() {
        let ok = false;
        if (this._tab === 0) { ok = spendPoints(this._plan); if (ok) this._plan = {}; }
        else { const sk = this.currentSkill(); ok = !!sk && learnSkill(sk.id); }
        se(ok ? "Up4" : "Buzzer1", 70, ok ? 115 : 100);
        this.closeAsk();
        this.refreshAll();
    };
    Scene_Hero.prototype.onConfirmNo = function() {
        this.closeAsk();
    };
    Scene_Hero.prototype.onCancel = function() {
        if (this._tab === 0 && Object.keys(this._plan).length) {   // Esc first drops the planned points
            this._plan = {};
            this.refreshAll();
            this._list.activate();
            return;
        }
        this.popScene();
    };
    Scene_Hero.prototype.refreshDetail = function() {
        const w = this._detail, U = uic(), ctx = w.contents.context, W = w.innerWidth, h = hero();
        w.contents.clear();
        w.resetFontSettings();
        const title = (text, right) => {
            w.contents.fontSize = 26;
            w.changeTextColor(U.accent);
            w.drawText(text, 0, 0, W - (right ? 120 : 0));
            if (right) { w.contents.fontSize = 18; w.changeTextColor(U.muted); w.drawText(right, 0, 6, W, "right"); }
            ctx.fillStyle = U.line;
            ctx.fillRect(0, 44, W, 1);
        };
        const para = (text, y, colour, size) => {
            w.contents.fontSize = size || 20;
            w.changeTextColor(colour || U.text);
            for (const line of wrapText(w, text, W - 4)) { w.drawText(line, 0, y, W); y += (size || 20) + 8; }
            return y;
        };
        const label = (text, y) => {
            w.contents.fontSize = 16;
            w.changeTextColor(U.muted);
            w.drawText(text.toUpperCase(), 0, y, W);
            return y + 26;
        };
        if (this._tab === 0) {
            const a = ATTRS[Math.max(0, this._list.index())], add = this._plan[a.id] || 0;
            title(a.name, add ? h.attr[a.id] + " → " + (h.attr[a.id] + add) : String(h.attr[a.id]) + " / " + ATTR_MAX);
            let y = para(a.desc, 56) + 10;
            y = label("Co daje teraz" + (Object.keys(this._plan).length ? "  →  po rozdaniu" : ""), y);
            const now = ATTR_EFFECTS[a.id](), next = withAttrs(this._plan, ATTR_EFFECTS[a.id]);
            // two columns sized by what is in them: the values now (right-aligned) and, with points planned, what they become (the
            // arrows one under another); a name too long for its line puts the values under it (the user's, 2026-09-25: "o 1,5% mniej
            // uderzeń" ran over "zwykłe")
            w.contents.fontSize = 20;
            const rows = now.map(([name, v], k) => ({ name, v, after: next[k][1] !== v ? "→ " + next[k][1] : "" }));
            const nw = Math.max(0, ...rows.map(r => (r.after ? Math.ceil(w.textWidth(r.after)) : 0))), gap = nw ? 18 : 0;
            for (const r of rows) {
                const under = Math.ceil(w.textWidth(r.name)) + 24 + Math.ceil(w.textWidth(r.v)) + gap + nw > W;
                w.changeTextColor(U.muted);
                w.drawText(r.name, 0, y, W);
                if (under) y += 28;
                w.changeTextColor(U.text);
                w.drawText(r.v, 0, y, W - nw - gap, "right");
                if (r.after) { w.changeTextColor(U.accent); w.drawText(r.after, W - nw, y, nw + 4); }
                y += 32;
            }
            y += 10;
            if (h.points === 0) para("Punkty atrybutów przychodzą z poziomem: " + POINTS_PER_LEVEL + " na każdy. Doświadczenie dają walka, cele z dziennika i odkrycia.", y, U.muted, 18);
            else para("Najwyżej " + ATTR_MAX + " w jednym atrybucie. ←/→ rozdziela punkty, Enter zatwierdza, Esc je cofa.", y, U.muted, 18);
            w.resetFontSettings();
            return;
        }
        const sk = this.currentSkill();
        if (!sk) {   // a field chosen on the list: what it is about and what is learnt in it
            const t = TREES[Math.max(0, this._domains.index())];
            if (!t) { w.resetFontSettings(); return; }
            const list = treeSkills(t.id), spent = list.reduce((a, s) => a + skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
            title(t.name, "stopni " + spent + " / " + total);
            let y = para(t.desc, 56) + 10;
            y = label("Umiesz", y);
            const known = list.filter(s => skillRank(s.id) > 0);
            if (!known.length) y = para("Jeszcze nic z tej dziedziny.", y, U.muted, 18);
            for (const s of known) {
                w.contents.fontSize = 18;
                w.changeTextColor(U.accent);
                w.drawText(s.name, 0, y, W - 60);
                w.changeTextColor(U.muted);
                w.drawText(s.ranks > 1 ? skillRank(s.id) + "/" + s.ranks : "✓", 0, y, W, "right");
                y += 26;
            }
            y += 10;
            const open = list.filter(s => !skillBlock(s.id)).length;
            para(open ? "Możesz się teraz nauczyć: " + open + ". → albo Enter: wejdź w drzewko." : "→ albo Enter: wejdź w drzewko i zobacz, czego wymagają umiejętności.", y, open ? U.accent : U.muted, 18);
            w.resetFontSettings();
            return;
        }
        const rank = skillRank(sk.id), full = rank >= sk.ranks, lv = ROW_LEVEL[sk.row] || 1;
        title(sk.name, sk.ranks > 1 ? "stopień " + rank + " / " + sk.ranks : rank ? "znana" : "");
        let y = 56;
        if (sk.ranks > 1 && rank === 0) y = label("Pierwszy stopień", y);
        else if (sk.ranks > 1) y = label("Teraz", y);
        y = para(skillText(sk, Math.max(1, rank)), y) + 4;
        if (rank > 0 && !full) { y = label("Następny stopień", y); y = para(skillText(sk, rank + 1), y, U.accent) + 4; }
        y = label("Wymagania", y + 4);
        const rows = [];
        if (lv > 1) rows.push([h.level >= lv, "Poziom postaci " + lv + "  (masz " + h.level + ")"]);
        if (sk.from.length) rows.push([sk.from.some(f => skillRank(f) > 0), "Najpierw: " + sk.from.map(f => skillById(f).name).join(" albo ")]);
        for (const a of ATTRS) if (sk.attr[a.id]) rows.push([h.attr[a.id] >= sk.attr[a.id], a.name + " " + sk.attr[a.id] + "  (masz " + h.attr[a.id] + ")"]);
        if (!full) rows.push([h.skillPoints >= 1, "1 punkt umiejętności  (masz " + h.skillPoints + ")"]);
        if (!rows.length) rows.push([true, "brak"]);
        for (const [ok, text] of rows) {
            w.contents.fontSize = 18;
            w.changeTextColor(ok ? "#62c66a" : "#ff8f7f");
            w.drawText(ok ? "✓" : "×", 0, y, 22, "center");
            w.changeTextColor(ok ? U.text : U.muted);
            for (const line of wrapText(w, text, W - 30)) { w.drawText(line, 28, y, W - 28); y += 26; }
        }
        y += 8;
        const block = skillBlock(sk.id);
        para(full ? (sk.ranks > 1 ? "Masz najwyższy stopień - działa zawsze." : "Znasz tę umiejętność - działa zawsze, bez żadnego klawisza.")
            : block ? block : "Enter: " + (rank ? "następny stopień." : "naucz się jej teraz."), y, full || !block ? U.accent : U.muted, 18);
        w.resetFontSettings();
    };

    P.ui = { addCombatLayer, addHud, updateCharacter, Scene_Hero, Sprite_CombatLayer, Sprite_WeaponPlate, Sprite_XpBar, Sprite_ModeBadge, Sprite_LevelBanner,
        Window_HeroList, Window_SkillTree, Window_SkillDomains };
})();
