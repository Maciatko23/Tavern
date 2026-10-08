//=============================================================================
// MenuRing.js
//=============================================================================
// The P menu of the clean look (CleanHUD.js; the mock-up docs/ui_pomysly/pomysl_4_czysty_okno.png): no panel - the map stays seen,
// darkened, with a clear patch round the hero, and the commands stand in a ring of round buttons round him (Plecak, Dziennik, Opcje,
// Zakończ grę, Zapisz grę, Postać - and any other plugin's command after them). The chosen one is at the top, bigger, its name and a
// short line over the ring; ←/→ turn the ring, Enter opens, Esc (or P) goes back to the game. On the left "who am I": the name, the
// level, the day, health / stamina / food / water with numbers, the coins and grandpa's debt with the days left; on the right what is
// on top of the bag ("Na wierzchu"). The bag, the journal and the rest open as before (MenuPanel.js's windows).
// It is the same Scene_Menu with the same command window (MenuPanel's order, the other plugins' commands and handlers): the window
// is only hidden and the ring drives it. The classic look ("Wygląd: Klasyczny" in Opcje) keeps MenuPanel's panel.

/*:
 * @target MZ
 * @plugindesc Czysty widok: menu P jako pierścień ikon wokół bohatera (mapa widoczna, po lewej „kim jestem”, po prawej podgląd plecaka). v1.0.0
 * @author Claude
 * @base CleanHUD
 * @orderAfter CleanHUD
 * @orderAfter MenuPanel
 * @orderAfter Journal
 * @orderAfter Combat_UI
 * @orderAfter Story
 *
 * @help
 * ============================================================================
 * MenuRing.js - menu P jako pierścień (Czysty widok)
 * ============================================================================
 * W czystym widoku menu P nie zasłania mapy: polecenia stoją w kręgu wokół
 * bohatera (Plecak, Dziennik, Opcje, Zakończ grę, Zapisz grę, Postać).
 *   ← →   obróć pierścień       Enter   otwórz       Esc / P   wróć do gry
 * Myszką: klik na kółko wybiera je, drugi klik otwiera.
 * Po lewej: imię, poziom, dzień, zdrowie, wytrzymałość, sytość, nawodnienie,
 * monety i dług dziadka. Po prawej: co leży na wierzchu w plecaku.
 * Plecak, dziennik, opcje i zapis otwierają się jak dotąd (MenuPanel.js).
 * W wyglądzie Klasycznym (Opcje → Wygląd) menu jest panelem jak wcześniej.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("MenuRing.js: brak TawernaCore.js (the Tawerna core is missing)");
    const CH = T.api("CleanHUD");
    if (!CH) throw new Error("MenuRing.js: musi być pod CleanHUD.js na liście wtyczek (CleanHUD is missing or below)");
    const PLUGIN = "MenuRing";
    if (T.api(PLUGIN)) return;
    const C = CH.C, textOut = CH.textOut, measure = CH.measure;

    // the ring's order, clockwise from the top (the mock-up's); the other plugins' commands come after these
    const ORDER = ["item", "journal", "options", "gameEnd", "save", "hero"];
    const LABELS = { item: "Plecak", journal: "Dziennik", hero: "Postać", options: "Opcje", save: "Zapisz grę", gameEnd: "Zakończ grę" };
    const ICONS = { item: [209, "green"], journal: [121, "dark"], options: [83, "dark"], gameEnd: [197, "green"], save: [246, "green"] };
    const RING = { R: 132, squash: 0.92, r: 27, rSel: 34, turn: 0.22, minX: 470, maxX: 810, minY: 250, maxY: 500, lift: 31 };
    const COL = { leftX: 60, rightX: 930, top: 210 };

    const W = () => Graphics.width, H = () => Graphics.height;
    const useRing = () => CH.isClean();

    // where the hero stood on the map's screen (his feet), noted as the map gives way to the menu
    // In the clean look the picture behind the menu is the map alone: the HUD, the cries, the plates are left out of it (the map's own
    // effects - the spriteset, a mind veil of the ruins' creatures - stay); the map scene is gone after this anyway.
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (SceneManager.isNextScene(Scene_Menu)) {
            const f = CH.heroFeet();
            $gameTemp._ringFeet = f ? { x: Math.round(f.x), y: Math.round(f.y) } : null;
            if (useRing()) for (const c of this.children) if (c !== this._spriteset && c !== this._mindVeil) c.renderable = false;
        }
        _Scene_Map_terminate.call(this);
    };
    function ringCentre() {
        let f = $gameTemp && $gameTemp._ringFeet;
        if (!f && $gamePlayer) {   // (no note - a menu opened another way: from the map's own numbers)
            const s = $gameScreen.zoomScale();
            f = { x: s * $gamePlayer.screenX() - $gameScreen.zoomX() * (s - 1), y: s * $gamePlayer.screenY() - $gameScreen.zoomY() * (s - 1) };
        }
        const x = f ? f.x : W() / 2, y = f ? f.y - RING.lift : H() / 2;
        return { x: Math.max(RING.minX, Math.min(RING.maxX, x)), y: Math.max(RING.minY, Math.min(RING.maxY, y)), hx: x, hy: y };
    }

    // ------------------------------------------------------------------
    // What the sides say
    // ------------------------------------------------------------------
    const plural = (n, a, b, c) => CH.pl(n, a, b, c);
    function weatherWord() {
        const S = T.api("Survival"), outdoors = S && S.isOutdoors ? S.isOutdoors() : true;
        if (!outdoors) return "pod dachem";
        const type = $gameScreen.weatherType(), on = ($gameScreen._weatherPowerTarget || $gameScreen.weatherPower() || 0) > 0;
        return on && type === "storm" ? "burza" : on && type === "rain" ? "deszcz" : on && type === "snow" ? "śnieg" : "pogodnie";
    }
    function dayWords() {
        const d = T.time.day(), h = T.time.hour();
        return "Dzień " + d + " · " + T.time.seasonName(d).toLowerCase() + " · " + CH.hm(h) + " · " + weatherWord();
    }
    function bagItems() {
        return $gameParty.items().filter(i => i && i.itypeId === 1);
    }
    function bagLine() {
        const n = $gameParty.items().length, L = CH.loadInfo();
        return n + " " + plural(n, "rzecz", "rzeczy", "rzeczy") + (L ? " · " + L.carried + " / " + L.cap : "");
    }
    // the short line over the ring, for the chosen command
    function subOf(sym) {
        if (sym === "item") return bagLine();
        if (sym === "journal") { const J = T.api("Journal"), g = J && J.currentGoal ? J.currentGoal() : null; return g ? "cel: " + g.title : "cele, surowce, receptury, notatki"; }
        if (sym === "hero") {
            const Cb = T.api("Combat"), h = Cb ? Cb.hero() : null, p = Cb && Cb.unspent ? Cb.unspent() : 0;
            return h ? "Poziom " + h.level + (p > 0 ? " · punkty do rozdania: " + p : "") : "";
        }
        if (sym === "options") return "dźwięk, wygląd, sterowanie";
        if (sym === "save") return "zapisz to, co już zrobiłeś";
        if (sym === "gameEnd") return "wróć do ekranu tytułowego";
        return "";
    }

    // ------------------------------------------------------------------
    // The pictures: the darkened map with a clear patch, the round buttons, the sides
    // ------------------------------------------------------------------
    function backBitmap(cx, cy) {
        const b = new Bitmap(W(), H()), ctx = b.context;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 1 / 1.15);
        const g = ctx.createRadialGradient(0, 0, 150, 0, 0, 410);
        g.addColorStop(0, "rgba(6,8,10,0.12)");
        g.addColorStop(1, "rgba(6,8,10,0.74)");
        ctx.fillStyle = g;
        ctx.fillRect(-cx - 10, -cy * 1.15 - 10, W() + 20, H() * 1.15 + 20);
        ctx.restore();
        b._baseTexture.update();
        return b;
    }
    // the hero's figure for "Postać": the standing frame of his walking sheet (HeroLook.js: 64 x 64 cells), head and shoulders
    function heroIcon(size) {
        const HL = window.HeroLook, look = HL && HL.active && HL.active();   // (the new hero is drawn from his own sheets, not the actor's)
        const name = look ? "Hero_Walk" : $gamePlayer.characterName(), idx = $gamePlayer.characterIndex(), src = ImageManager.loadCharacter(name);
        if (!src.isReady()) return null;
        const b = new Bitmap(size, size);
        b.context.imageSmoothingEnabled = false;
        if (/^Hero_/.test(name)) b.blt(src, 16, 4, 32, 32, 0, 0, size, size);
        else {
            const big = ImageManager.isBigCharacter(name), pw = src.width / (big ? 3 : 12), ph = src.height / (big ? 4 : 8);
            const sx = (big ? 0 : (idx % 4) * 3) * pw + pw, sy = (big ? 0 : Math.floor(idx / 4) * 4) * ph;
            b.blt(src, sx + pw * 0.15, sy, pw * 0.7, ph * 0.7, 0, 0, size, size);
        }
        return b;
    }
    function buttonBitmap(sym, selected, enabled) {
        const r = selected ? RING.rSel : RING.r, S = 2 * RING.rSel + 14, b = new Bitmap(S, S), ctx = b.context, c = S / 2;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); ctx.ellipse(c, c + 2, r + 3, r + 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(12,14,16,0.8)";
        ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeStyle = selected ? C.accent : enabled ? "rgba(246,242,234,0.6)" : "rgba(160,160,160,0.4)";
        ctx.beginPath(); ctx.arc(c, c, r - 0.5, 0, Math.PI * 2); ctx.stroke();
        if (selected) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,210,63,0.35)";
            ctx.beginPath(); ctx.arc(c, c, r - 4, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
        const size = selected ? 48 : 32, at = c - size / 2;
        let icon = null;
        if (sym === "hero") icon = heroIcon(size);
        else if (ICONS[sym]) icon = CH.iconBitmap(ICONS[sym][0], ICONS[sym][1]);
        if (icon) {
            b.context.imageSmoothingEnabled = false;
            b.paintOpacity = enabled ? 255 : 110;
            b.blt(icon, 0, 0, icon.width, icon.height, at, at, size, size);
            b.paintOpacity = 255;
        } else if (sym !== "hero" && !ICONS[sym]) {   // (another plugin's command: its first letter)
            textOut(b, (LABELS[sym] || sym).charAt(0).toUpperCase(), 0, c - 16, S, 32, "center", { size: selected ? 30 : 24, color: C.accent });
        } else return null;   // (a picture still loading: drawn again next frame)
        b._baseTexture.update();
        return b;
    }

    // ------------------------------------------------------------------
    // The menu scene in the clean look
    // ------------------------------------------------------------------
    const _create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _create.call(this);
        this._ringOn = useRing();
        if (this._ringOn) this.createRing();
    };
    Scene_Menu.prototype.createRing = function() {
        const cw = this._commandWindow;
        cw.hide();
        cw.deactivate();
        if (this._statusWindow) this._statusWindow.hide();
        if (this._goldWindow) this._goldWindow.hide();
        if (this._menuPanel) this._menuPanel.visible = false;
        if (this._backgroundSprite) { this._backgroundSprite.filters = []; this._backgroundSprite.opacity = 255; }
        // the commands in the ring's order
        const list = cw._list.map((c, i) => ({ sym: c.symbol, name: c.name, i }));
        const rank = s => { const k = ORDER.indexOf(s.sym); return k < 0 ? ORDER.length : k; };
        this._ring = list.sort((a, b) => rank(a) - rank(b) || a.i - b.i);
        const last = Window_MenuCommand._lastCommandSymbol, at = this._ring.findIndex(c => c.sym === (last || "item"));
        this._ringSel = Math.max(0, at);
        this._ringAngle = -this._ringSel * this.ringStep();
        const ctr = ringCentre();
        this._ringC = ctr;
        this._ringBack = new Sprite(backBitmap(ctr.x, ctr.y));
        this.addChildAt(this._ringBack, this.children.indexOf(this._windowLayer));
        this._ringGuide = new Sprite(this.guideBitmap());
        this._ringGuide.anchor.set(0.5, 0.5);
        this._ringGuide.move(ctr.x, ctr.y);
        this.addChildAt(this._ringGuide, this.children.indexOf(this._windowLayer));
        this._ringSides = new Sprite(new Bitmap(W(), H()));
        this.addChildAt(this._ringSides, this.children.indexOf(this._windowLayer));
        this._ringTitle = new Sprite(new Bitmap(520, 70));
        this._ringTitle.anchor.set(0.5, 1);
        this.addChildAt(this._ringTitle, this.children.indexOf(this._windowLayer));
        this._ringButtons = this._ring.map(c => {
            const s = new Sprite();
            s.anchor.set(0.5, 0.5);
            s._sym = c.sym;
            s._label = new Sprite();
            s._label.anchor.set(0.5, 0);
            this.addChildAt(s, this.children.indexOf(this._windowLayer));
            this.addChildAt(s._label, this.children.indexOf(this._windowLayer));
            return s;
        });
        this.refreshRing();
        this.drawSides();
    };
    Scene_Menu.prototype.ringStep = function() { return 360 / Math.max(1, this._ring.length); };
    Scene_Menu.prototype.guideBitmap = function() {
        const R = RING.R, w = R * 2 + 8, h = Math.ceil(R * RING.squash * 2) + 8, b = new Bitmap(w, h), ctx = b.context;
        ctx.save();
        ctx.setLineDash([1.5, 4]);
        ctx.strokeStyle = "rgba(246,242,234,0.32)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(w / 2, h / 2, R, R * RING.squash, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        b._baseTexture.update();
        return b;
    };
    const enabledAt = (scene, c) => scene._commandWindow.isCommandEnabled(c.i);
    // the buttons' pictures (the chosen one big) and the title over the ring
    Scene_Menu.prototype.refreshRing = function() {
        this._ringButtons.forEach((s, k) => {
            const c = this._ring[k], sel = k === this._ringSel, on = enabledAt(this, c), key = sel + ":" + on;
            if (s._key !== key || !s.bitmap) {
                const b = buttonBitmap(c.sym, sel, on);
                if (b) { s.bitmap = b; s._key = key; } else s._key = null;
            }
            if (!s._label.bitmap) {
                const text = LABELS[c.sym] || c.name, w = measure(text, 15) + 16, lb = new Bitmap(w, 22);
                textOut(lb, text, 0, 0, w, 22, "center", { size: 15, color: on ? C.muted : "#8a8a8a" });
                s._label.bitmap = lb;
            }
        });
        const c = this._ring[this._ringSel], b = this._ringTitle.bitmap;
        b.clear();
        const sub = subOf(c.sym);
        if (sub) textOut(b, CH.fit(sub, 16, 500), 0, 0, 520, 24, "center", { size: 16, color: C.muted });
        textOut(b, LABELS[c.sym] || c.name, 0, 24, 520, 42, "center", { size: 30, color: enabledAt(this, c) ? C.accent : "#9a9a9a" });
        const Cb = T.api("Combat"), points = c.sym === "hero" && Cb && Cb.unspent ? Cb.unspent() : 0;
        this._ringPoints = points;
    };
    // the sides: who am I (left), what is on top of the bag (right), the keys (bottom)
    Scene_Menu.prototype.drawSides = function() {
        const b = this._ringSides.bitmap, ctx = b.context;
        b.clear();
        const actor = $gameParty.leader(), Cb = T.api("Combat"), hero = Cb ? Cb.hero() : null;
        let x = COL.leftX, y = COL.top;
        const name = actor ? actor.name() : "";
        textOut(b, name, x, y - 6, 300, 46, "left", { size: 36 });
        if (hero) textOut(b, "Poziom " + hero.level, x + measure(name, 36) + 18, y + 7, 200, 30, "left", { size: 20, color: C.accent });
        textOut(b, dayWords(), x, y + 44, 360, 24, "left", { size: 16, color: C.muted });
        const v = CH.needValues(), rows = [["Zdrowie", "health", v.health, Math.round(v.health * 100) + "%"]];
        const st = Math.round($gameSystem.stamina ? $gameSystem.stamina() : 0);
        rows.push(["Wytrzymałość", "stamina", v.stamina, String(st)]);
        const N = T.api("Needs");
        if (v.food !== undefined && N) {
            const n = N.state();
            rows.push(["Sytość", "food", v.food, String(Math.round(n.food))]);
            rows.push(["Nawodnienie", "water", v.water, String(Math.round(n.water))]);
        }
        const tint = { health: "#ffb3aa", stamina: "#c8f3b4", food: "#ffd9a0", water: "#9fd6ff" };
        y += 84;
        for (const [label, key, ratio, val] of rows) {
            textOut(b, label, x, y - 4, 200, 28, "left", { size: 18 });
            textOut(b, val, x, y - 4, 230, 28, "right", { size: 18, color: ratio < 0.5 ? tint[key] : C.text });
            CH.thinBar(ctx, x, y + 26, 230, 4, ratio, C[key]);
            y += 40;
        }
        y += 14;
        textOut(b, "Sakiewka: " + $gameParty.gold() + " G", x, y - 4, 320, 26, "left", { size: 17 });
        y += 26;
        const ST = T.api("Story"), s = ST && ST.state ? ST.state() : null;
        if (s && s.debt !== undefined && !s.pending) {
            if (s.done || s.paid >= s.debt) textOut(b, "Dług dziadka spłacony", x, y - 4, 320, 26, "left", { size: 17, color: "#9ff0a8" });
            else {
                textOut(b, "Dług dziadka: " + Math.min(s.paid, s.debt) + " / " + s.debt + " G", x, y - 4, 320, 26, "left", { size: 17 });
                const n = ST.daysLeft ? ST.daysLeft() : 0;
                const left = n > 1 ? "zostało " + n + " " + plural(n, "dzień", "dni", "dni") : n === 1 ? "dziś mija termin" : "termin mija o świcie";
                textOut(b, left, x, y + 18, 320, 22, "left", { size: 15, color: n <= 5 ? "#ffb3aa" : C.muted });
            }
        }
        // the right: on top of the bag
        x = COL.rightX;
        y = COL.top;
        textOut(b, "Na wierzchu", x, y - 4, 280, 26, "left", { size: 18, color: C.muted });
        const items = bagItems(), shown = items.slice(0, 8);
        shown.forEach((it, k) => {
            const yy = y + 34 + k * 36;
            CH.drawIcon(b, it.iconIndex, x, yy - 4, 32);
            textOut(b, CH.fit(it.name, 18, 200), x + 40, yy - 2, 210, 28, "left", { size: 18 });
            textOut(b, "×" + $gameParty.numItems(it), x + 200, yy - 2, 80, 28, "right", { size: 18, color: C.muted });
        });
        if (!items.length) textOut(b, "pusto", x, y + 30, 200, 26, "left", { size: 17, color: C.muted });
        const more = $gameParty.items().length - shown.length;
        if (more > 0) textOut(b, "… i " + more + " " + plural(more, "inna rzecz", "inne", "innych"), x, y + 34 + shown.length * 36 + 2, 280, 24, "left", { size: 16, color: C.muted });
        // the keys
        textOut(b, "←  →  obróć        Enter  otwórz        Esc  wróć do gry", 0, H() - 44, W(), 28, "center", { size: 17 });
        b._baseTexture.update();
        this._sidesReady = CH.iconBitmap(ICONS.item[0]) !== null;
    };
    const _update = Scene_Menu.prototype.update;
    Scene_Menu.prototype.update = function() {
        _update.call(this);
        if (!this._ringOn) return;
        if (!this._sidesReady && CH.iconBitmap(ICONS.item[0])) this.drawSides();
        this.updateRingInput();
        this.updateRingPlaces();
    };
    Scene_Menu.prototype.updateRingInput = function() {
        if (SceneManager.isSceneChanging() || this._ringOpening || !this.isActive()) return;
        const n = this._ring.length;
        if (Input.isRepeated("right") || Input.isRepeated("down")) this.selectRing((this._ringSel + 1) % n);
        else if (Input.isRepeated("left") || Input.isRepeated("up")) this.selectRing((this._ringSel + n - 1) % n);
        else if (Input.isTriggered("ok")) this.openRing();
        else if (Input.isTriggered("cancel") || TouchInput.isCancelled()) { SoundManager.playCancel(); this.popScene(); }
        else if (TouchInput.isTriggered()) {
            const k = this._ringButtons.findIndex(s => Math.hypot(TouchInput.x - s.x, TouchInput.y - s.y) <= (s._key && s._key[0] === "t" ? RING.rSel : RING.r) + 4);
            if (k >= 0) { if (k === this._ringSel) this.openRing(); else this.selectRing(k); }
        }
    };
    Scene_Menu.prototype.selectRing = function(k) {
        if (k === this._ringSel) return;
        SoundManager.playCursor();
        const step = this.ringStep(), before = this._ringSel;
        this._ringSel = k;
        // (the ring turns the short way round)
        let d = (before - k) * step;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        this._ringTarget = (this._ringTarget === undefined ? this._ringAngle : this._ringTarget) + d;
        this._commandWindow.select(this._ring[k].i);
        this.refreshRing();
    };
    Scene_Menu.prototype.openRing = function() {
        const c = this._ring[this._ringSel], cw = this._commandWindow;
        if (!enabledAt(this, c)) { SoundManager.playBuzzer(); return; }
        SoundManager.playOk();
        Window_MenuCommand._lastCommandSymbol = c.sym;
        cw.select(c.i);
        cw.callOkHandler();
        cw.deactivate();   // (a handler that hands the focus back to the window: the ring keeps it, the window stays hidden)
    };
    Scene_Menu.prototype.updateRingPlaces = function() {
        if (this._ringTarget === undefined) this._ringTarget = this._ringAngle;
        this._ringAngle += (this._ringTarget - this._ringAngle) * RING.turn;
        if (Math.abs(this._ringTarget - this._ringAngle) < 0.05) this._ringAngle = this._ringTarget;
        const step = this.ringStep(), ctr = this._ringC;
        this._ringButtons.forEach((s, k) => {
            if (!s.bitmap || !s._key) this.refreshRing();
            const a = (-90 + k * step + this._ringAngle) * Math.PI / 180;
            s.x = Math.round(ctr.x + Math.cos(a) * RING.R);
            s.y = Math.round(ctr.y + Math.sin(a) * RING.R * RING.squash);
            const sel = k === this._ringSel;
            s._label.visible = !sel;
            s._label.x = s.x;
            s._label.y = s.y + RING.r + 2;
        });
        this._ringTitle.x = ctr.x;
        this._ringTitle.y = ctr.y - RING.R * RING.squash - RING.rSel - 8;
    };
    // (for the tests) what the ring shows
    Scene_Menu.prototype.ringInfo = function() {
        if (!this._ringOn) return null;
        return { centre: { x: this._ringC.x, y: this._ringC.y }, selected: this._ring[this._ringSel].sym, order: this._ring.map(c => c.sym),
            buttons: this._ringButtons.map(s => ({ sym: s._sym, x: s.x, y: s.y })), window: { visible: this._commandWindow.visible, active: this._commandWindow.active } };
    };

    window.MenuRing = T.register(PLUGIN, { ORDER, LABELS, ICONS, RING, ringCentre, subOf, dayWords,
        info: () => { const s = SceneManager._scene; return s instanceof Scene_Menu && s.ringInfo ? s.ringInfo() : null; } });
})();
