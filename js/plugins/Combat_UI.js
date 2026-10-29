//=============================================================================
// Combat_UI.js
//=============================================================================
// What the fight and the hero look like (split out of Combat.js, 2026-09-29): on the map the floating numbers and sparks, the
// rushing animals' afterimages, the enemies' bars, the breath under the hero, the shield, the hero's and the animals' sprites
// (a flash when hurt, the flinch, stun stars); on the screen the weapon plate, the experience bar, the "Tryb walki" label and the
// level banner. Classes and functions only: Combat.js holds every engine hook and calls these. (The old Postać screen - Scene_Hero,
// the attributes and the skill trees in MenuPanel's panel - is gone since 2026-10-28: the P menu's Postać and Umiejętności pages,
// MenuRing.js, are the only ones.)

/*:
 * @target MZ
 * @plugindesc Wygląd walki (część Combat.js): liczby i iskry, paski wrogów, oddech pod stopami, plakietka broni, pasek doświadczenia, napisy trybu i poziomu. Sama nic nie robi - parametry i haki ma Combat.js. v1.1.0
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
 * Combat_UI.js - wygląd walki
 * ============================================================================
 * Część Combat.js (wydzielona z niego): to, co widać - na mapie liczby,
 * iskry, paski wrogów, oddech pod stopami, tarcza; na ekranie plakietka
 * broni, pasek doświadczenia, napis "Tryb walki", "Poziom N!". Atrybuty
 * i drzewka umiejętności są w menu P (MenuRing.js: Postać, Umiejętności).
 * Sama nic nie robi: woła ją Combat.js. Parametry ma Combat.js.
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
    const { hero, xpToNext, unspent, levelColor, MAX_LEVEL, POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL, parryWindow, combatMode, foes } = P.core;
    const { act, px, py, easeOut, floaters, sparks, sparksAt, maxBreath, breathNow, isWinded, shield, has, hand, handIcon, MELEE, ROLL_KIND, KNOCK_KIND } = P.fight;
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
        const id = h[0] === "m" ? Number(h.slice(1)) : (P.fight.rangedItem ? P.fight.rangedItem() || 125 : has(126) ? 126 : 125), icon = handIcon(h);
        bmp.blt(set, (icon % 16) * 32, Math.floor(icon / 16) * 32, 32, 32, 4, 3);
        bmp.fontSize = 17;
        bmp.textColor = (U && U.text) || "#eceef0";
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText(h[0] === "m" ? MELEE[id].name : $dataItems[id] ? $dataItems[id].name : "Łuk / proca", 40, 0, 150, 38, "left");
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
            bmp.drawText("+" + POINTS_PER_LEVEL + " punkty atrybutów, +" + SKILL_POINTS_PER_LEVEL + " punkt umiejętności  ·  menu P → Postać, Umiejętności", 0, 48, bmp.width, 28, "center");
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
            // the hit (2026-10-14): the whole figure crisp white for HIT_WHITE frames of the screen (the hitstop does not lengthen it), then
            // a fading white while its _flashT runs out
            const f = ch._flashT || 0, white = ch._flashAt !== undefined && Graphics.frameCount - ch._flashAt <= HIT_WHITE;   // (the sprites go before the blow in a frame: 1..3)
            if (white || f > 0) { sprite.setBlendColor([255, 255, 255, white ? 255 : Math.min(150, Math.round(f * 20))]); sprite._combatTint = true; }
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
    const HIT_WHITE = 3;   // (frames of the pure white flash of a hit)
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

    P.ui = { addCombatLayer, addHud, updateCharacter, Sprite_CombatLayer, Sprite_WeaponPlate, Sprite_XpBar, Sprite_ModeBadge, Sprite_LevelBanner };
})();
