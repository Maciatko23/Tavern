//=============================================================================
// QuestBoard_Scene.js
//=============================================================================
// The quest board's scene (split out of QuestBoard.js, 2026-09-29): the wooden board with the notices, the big parchment of the
// focused one, the slate (fame, what is in hand, the purse), the keys and the mouse, accepting / turning in / giving up with their
// animations, Borgar's first explanation. A screen of its own over the board's picture (not a mini-game: no result, no pause - P
// leaves at once), so it stays a Scene_Base; its paper, fonts and ink are TawernaUI's.

/*:
 * @target MZ
 * @plugindesc Scena tablicy zleceń (QuestBoard.js): tablica z kartkami, szczegóły, łupek ze sławą, klawisze i mysz, przyjmowanie i oddawanie zleceń z animacją, pierwsze słowa Borgara. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
 * @base QuestBoard
 * @orderAfter QuestBoard
 * @orderAfter QuestBoard_Art
 *
 * @help
 * ============================================================================
 * QuestBoard_Scene.js - scena tablicy zleceń
 * ============================================================================
 * Część QuestBoard.js (wydzielona z niego): ekran tablicy w sieni tawerny.
 * Otwiera go QuestBoard.open() albo zdarzenie z <Tavern:board>. Parametry ma
 * QuestBoard.js.
 *
 * KOLEJNOŚĆ: QuestBoard_Data, QuestBoard, QuestBoard_Art, QuestBoard_Scene.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !T.ui || !T.ui.drawPaper) throw new Error("QuestBoard_Scene.js: brak TawernaCore.js / TawernaUI.js - muszą być wyżej na liście wtyczek (the Tawerna core or UI kit is missing)");
    const ui = T.ui;
    const P = T.api("QuestBoard_parts") || T.register("QuestBoard_parts", {});
    if (P.Scene) return;   // (put into the page twice: kept as it was)

    // QuestBoard.js's pieces, its tables and its pictures (QuestBoard_Art.js), bound as the board first opens (the family's files may
    // come in any order)
    let data, hasState, failDue, checkCycle, activeList, accept, turnIn, abandon, track, isReady, rowDone, have, daysLeft, reqName, repTier,
        iconOf, cycleOf, today, TIERS, MAX_ACTIVE, REFRESH_DAYS, REP_ABANDON, BEASTS, BORGAR_BUST, TUTORIAL,
        L, F, U, spaced, inkText, star, img, drawIcon, drawReqIcon, wrap, PART, ASSETS, Sprite_QBCard, Sprite_QBTag, drawDetail;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function bind() {
        if (!P.core || !P.data || !P.art) throw new Error("QuestBoard_Scene.js: brak QuestBoard.js / QuestBoard_Data.js / QuestBoard_Art.js");
        ({ data, hasState, failDue, checkCycle, activeList, accept, turnIn, abandon, track, isReady, rowDone, have, daysLeft, reqName, repTier,
            iconOf, cycleOf, today, TIERS, MAX_ACTIVE, REFRESH_DAYS, REP_ABANDON } = P.core);
        ({ BEASTS, BORGAR_BUST, TUTORIAL } = P.data);
        ({ L, F, U, spaced, inkText, star, img, drawIcon, drawReqIcon, wrap, PART, ASSETS, Sprite_QBCard, Sprite_QBTag, drawDetail } = P.art);
    }

    // ------------------------------------------------------------------
    // The scene
    // ------------------------------------------------------------------
    function Scene_QuestBoard() {
        this.initialize(...arguments);
    }
    Scene_QuestBoard.prototype = Object.create(Scene_Base.prototype);
    Scene_QuestBoard.prototype.constructor = Scene_QuestBoard;
    Scene_QuestBoard.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        bind();
        ui.ensureFonts();
        failDue();
        checkCycle();
        this.A = {
            back: ImageManager.loadSystem(ASSETS.back), paper: ImageManager.loadSystem(ASSETS.paper), parts: ImageManager.loadSystem(ASSETS.parts),
            iconSet: ImageManager.loadSystem("IconSet"),
            // (his own Borgar_Bust when it is there - SpeechBubbles' bustFile; through ImageManager so the scene waits for it)
            bust: ImageManager.loadPicture(ui.bustFile ? ui.bustFile(BORGAR_BUST) : BORGAR_BUST)
        };
        for (const k of Object.keys(BEASTS)) ImageManager.loadCharacter(BEASTS[k].sheet);
    };
    Scene_QuestBoard.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        this.build();
        this.startFadeIn(14, false);
        T.audio.se("Book1", { volume: 70, pitch: 105 });
        const d = data();
        if (!d.tutorial) this.showTutorial();
    };
    Scene_QuestBoard.prototype.terminate = function() {
        Scene_Base.prototype.terminate.call(this);
        if (hasState()) data().seen = data().cycle;
    };
    Scene_QuestBoard.prototype.build = function() {
        const A = this.A, W = Graphics.width, H = Graphics.height;
        this._back = new Sprite(A.back);
        this.addChild(this._back);
        this._tag = new Sprite_QBTag(A);
        this.addChild(this._tag);
        this._cardLayer = new Sprite();
        this.addChild(this._cardLayer);
        this._cards = [];
        const d = data();
        const order = d.board.slice().sort((a, b) => a.look.slot - b.look.slot);
        order.forEach((n, i) => { const c = new Sprite_QBCard(n, A); c.enter = -i * 0.12; this._cards.push(c); this._cardLayer.addChild(c); });
        this._brackets = new Sprite();
        this._brackets.anchor.set(0.5, 0.5);
        this.addChild(this._brackets);
        this._detail = new Sprite(new Bitmap(L.detail[2] - L.detail[0], L.detail[3] - L.detail[1] + 20));
        this._detail.x = L.detail[0];
        this._detail.y = L.detail[1];
        this.addChild(this._detail);
        this._buttons = new Sprite(new Bitmap(L.detail[2] - L.detail[0], 80));
        this._buttons.x = L.detail[0];
        this._buttons.y = L.detail[3] - 84;
        this.addChild(this._buttons);
        this._slate = new Sprite(new Bitmap(L.slate[2] - L.slate[0], L.slate[3] - L.slate[1]));
        this._slate.x = L.slate[0];
        this._slate.y = L.slate[1];
        this.addChild(this._slate);
        this._hints = new Sprite(new Bitmap(W, 30));
        this._hints.y = L.hints[1] - 4;
        this.addChild(this._hints);
        this.createAmbience();
        this._fx = new Sprite();
        this.addChild(this._fx);
        this._overlay = new Sprite(new Bitmap(W, H));
        this._overlay.visible = false;
        this.addChild(this._overlay);
        this._toast = new Sprite(new Bitmap(700, 34));   // (a short word at the bottom right, over the board's term)
        this._toast.x = L.hints[2] - 700 + 4;
        this._toast.y = L.hints[1] - 7;
        this._toast.opacity = 0;
        this.addChild(this._toast);
        this.mode = "browse";       // browse (moving between notices), choice (the buttons of the open notice), anim, tutorial
        this.focus = null;
        this.choices = [];
        this.choiceIndex = 0;
        this.purseShown = $gameParty.gold();
        this.debtShown = T.call("Story", "isOpen") ? T.call("Story", "left") : 0;
        this.repShown = d.rep;
        this.anim = null;
        this._mouse = [TouchInput.x, TouchInput.y];
        this._detailKey = "";
        const first = this._cards.find(c => c.n.state === "active" && isReady(c.n)) || this._cards[0] || this._tag;
        this.setFocus(first, true);
        this.drawSlate();
        this.drawHints();
    };

    // ---- the lamp over the board: its warm light breathes a little, dust drifts in it
    Scene_QuestBoard.prototype.createAmbience = function() {
        const W = Graphics.width, H = Graphics.height, b = new Bitmap(W, H), ctx = b.context;
        const g = ctx.createRadialGradient(404, 40, 20, 404, 120, 640);
        g.addColorStop(0, "rgba(255,196,120,1)");
        g.addColorStop(0.45, "rgba(255,170,90,0.35)");
        g.addColorStop(1, "rgba(255,150,70,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        b._baseTexture.update();
        this._glow = new Sprite(b);
        this._glow.blendMode = 1;   // (additive: the light lies on what is under it)
        this._glow.opacity = 18;
        this.addChild(this._glow);
        const dot = new Bitmap(4, 4), dc = dot.context;
        dc.fillStyle = "rgba(255,236,200,0.55)"; dc.fillRect(1, 0, 2, 4); dc.fillRect(0, 1, 4, 2);
        dc.fillStyle = "rgba(255,248,230,0.95)"; dc.fillRect(1, 1, 2, 2);
        dot._baseTexture.update();
        this._motes = [];
        for (let i = 0; i < 22; i++) {
            const m = new Sprite(dot);
            m.anchor.set(0.5, 0.5);
            m.blendMode = 1;
            this.resetMote(m, true);
            this._motes.push(m);
            this.addChild(m);
        }
    };
    Scene_QuestBoard.prototype.resetMote = function(m, anywhere) {
        m._x = 120 + Math.random() * 580;
        m._y = anywhere ? 90 + Math.random() * 520 : 610 + Math.random() * 40;
        m._vx = (Math.random() - 0.5) * 0.12;
        m._vy = -(0.08 + Math.random() * 0.18);
        m._ph = Math.random() * Math.PI * 2;
        m._life = 0;
        m._max = 500 + Math.random() * 700;
        const k = 0.5 + Math.random() * 0.8;
        m.scale.set(k, k);
    };
    Scene_QuestBoard.prototype.updateAmbience = function() {
        const t = Graphics.frameCount;
        this._glow.opacity = 16 + 5 * Math.sin(t / 37) + 3 * Math.sin(t / 11.3) + (Math.random() < 0.02 ? 4 : 0);
        for (const m of this._motes) {
            m._life++;
            m._x += m._vx + Math.sin(t / 90 + m._ph) * 0.12;
            m._y += m._vy;
            if (m._life > m._max || m._y < 80) this.resetMote(m, false);
            const fade = Math.min(1, m._life / 90, (m._max - m._life) / 90);
            m.x = m._x; m.y = m._y;
            m.opacity = Math.max(0, fade) * (110 + 70 * Math.sin(t / 23 + m._ph));
        }
    };

    // ---- focus and the detail
    const elementOf = el => (el && el.n ? el.n : el ? "rules" : null);
    Scene_QuestBoard.prototype.elements = function() {
        return this._cards.concat([this._tag]);
    };
    Scene_QuestBoard.prototype.setFocus = function(el, quiet) {
        if (this.focus === el) return;
        this.focus = el;
        for (const e of this.elements()) e.target = e === el ? 1 : 0;
        if (el === this._tag && !quiet) el.nudge();
        // the focused card on top of the others
        if (el && el !== this._tag) { this._cardLayer.removeChild(el); this._cardLayer.addChild(el); }
        if (!quiet) SoundManager.playCursor();
        this.mode = this.mode === "choice" ? "browse" : this.mode;
        this.refreshDetail(true);
    };
    Scene_QuestBoard.prototype.refreshDetail = function(slide) {
        const el = this.focus;
        drawDetail(this._detail.bitmap, this.A, el === this._tag ? null : el ? el.n : null, this);
        this.choices = this.choiceList();
        this.choiceIndex = Math.min(this.choiceIndex, Math.max(0, this.choices.length - 1));
        this.drawButtons();
        this.drawHints();
        if (slide) { this._detailT = 0; }
    };
    // the buttons of the open notice
    Scene_QuestBoard.prototype.choiceList = function() {
        const el = this.focus;
        if (!el) return [];
        if (el === this._tag) return [{ id: "close", label: "Rozumiem" }];
        const n = el.n;
        if (this._confirm) return [{ id: "abandonYes", label: "Tak, porzuć (sława -" + (REP_ABANDON + (n.urgent ? 2 : 0)) + ")" }, { id: "abandonNo", label: "Nie" }];
        if (n.state === "open") return [{ id: "accept", label: "Przyjmij zlecenie", enabled: activeList().length < MAX_ACTIVE }, { id: "leave", label: "Zostaw" }];
        if (n.state === "active") {
            const out = [];
            const ready = isReady(n);
            if (n.giver === "feliks" && ready && T.call("Story", "isOpen")) {
                out.push({ id: "turnIn", label: "Oddaj", enabled: true });
                out.push({ id: "turnInDebt", label: "Oddaj na dług", enabled: true });
            } else out.push({ id: "turnIn", label: "Oddaj zlecenie", enabled: ready });
            out.push({ id: "track", label: data().track === n.id ? "Nie śledź" : "Śledź" });
            out.push({ id: "abandon", label: "Porzuć" });
            return out;
        }
        return [{ id: "leave", label: "Zamknij" }];
    };
    Scene_QuestBoard.prototype.drawButtons = function() {
        const b = this._buttons.bitmap, ctx = b.context, S = U();
        b.clear();
        const list = this.choices;
        if (!list.length) { b._baseTexture.update(); return; }
        const W = b.width - 14, gap = 10, pad = 22;
        ctx.font = F.ui(19, false);
        const ws = list.map(c => Math.ceil(ctx.measureText(c.label).width) + 30);
        let total = ws.reduce((a, c) => a + c, 0) + gap * (ws.length - 1);
        const k = total > W - pad * 2 ? (W - pad * 2 - gap * (ws.length - 1)) / (total - gap * (ws.length - 1)) : 1;
        const widths = ws.map(w => Math.floor(w * k));
        total = widths.reduce((a, c) => a + c, 0) + gap * (widths.length - 1);
        let x = Math.round((W - total) / 2);
        this._buttonRects = [];
        list.forEach((c, i) => {
            const w = widths[i], sel = this.mode === "choice" && i === this.choiceIndex, dim = c.enabled === false;
            if (S.panel) S.panel(ctx, x, 18, w, 38, { cut: 5, fill: sel ? "rgba(11,12,15,0.96)" : "rgba(11,12,15,0.78)", line: sel ? S.accent : S.line, accent: sel });
            else { ctx.fillStyle = "rgba(11,12,15,0.85)"; ctx.fillRect(x, 18, w, 38); }
            ctx.font = F.ui(19, false);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = dim ? "#6a6f77" : sel ? S.accent : S.text;
            ctx.fillText(c.label, x + w / 2, 38, w - 12);
            this._buttonRects.push([this._buttons.x + x, this._buttons.y + 18, w, 38]);
            x += w + gap;
        });
        ctx.textBaseline = "alphabetic";
        this._buttons.opacity = this.mode === "choice" ? 255 : 150;
        this._buttons.visible = this.mode !== "anim";
        b._baseTexture.update();
    };
    Scene_QuestBoard.prototype.drawHints = function() {
        const b = this._hints.bitmap, ctx = b.context, S = U();
        b.clear();
        const list = this.mode === "choice" ? [["←→", "wybierz"], ["O", "potwierdź"], ["P", "wróć"]]
            : this.mode === "anim" ? [["O", "szybciej"]]
            : this.mode === "tutorial" ? [["O", "dalej"]]
            : [["↑↓←→", "wybierz kartkę"], ["O", this.focus && this.focus.n && this.focus.n.state === "active" ? (isReady(this.focus.n) ? "oddaj / opcje" : "opcje") : "otwórz"], ["P", "wyjdź"]];
        let x = L.hints[0] + 2;
        for (const [key, what] of list) {
            ctx.font = F.ui(15, true);
            const kw = Math.max(26, Math.ceil(ctx.measureText(key).width) + 14);
            if (S.panel) S.panel(ctx, x, 2, kw, 22, { cut: 3, fill: "rgba(11,12,15,0.9)", accent: false });
            ctx.fillStyle = S.accent;
            ctx.textAlign = "center";
            ctx.fillText(key, x + kw / 2, 18);
            x += kw + 7;
            ctx.font = F.ui(17, false);
            ctx.fillStyle = S.text;
            ctx.textAlign = "left";
            ctx.fillText(what, x, 19);
            x += Math.ceil(ctx.measureText(what).width) + 22;
        }
        // on the right: the term of the board
        const d = data(), next = (cycleOf(today()) + 1) * REFRESH_DAYS + 1, k = next - today();
        ctx.font = F.ui(16, false);
        ctx.fillStyle = S.muted;
        ctx.textAlign = "right";
        ctx.fillText("Nowe ogłoszenia: " + (k <= 1 ? "jutro" : "za " + k + " dni") + "  ·  zleceń w toku: " + activeList().length + "/" + MAX_ACTIVE, L.hints[2] - 4, 19);
        void d;
        b._baseTexture.update();
    };

    // the slate: the reputation, what is in hand, the purse
    Scene_QuestBoard.prototype.drawSlate = function() {
        const b = this._slate.bitmap, ctx = b.context, S = U(), d = data();
        b.clear();
        const chalk = "rgba(236,238,236,0.92)", dim = "rgba(200,205,205,0.55)", yellow = "rgba(255,210,63,0.95)";
        const rep = Math.round(this.repShown), t = repTier(rep);
        // left: the reputation
        ctx.font = F.caps(13); ctx.fillStyle = yellow;
        spaced(ctx, "SŁAWA W TAWERNIE", 22, 32, 1.8, "left");
        for (let i = 0; i < 5; i++) {
            const cx = 34 + i * 28, cy = 54, fillK = clamp((rep - i * 20) / 20, 0, 1);
            star(ctx, cx, cy, 12, "rgba(255,255,255,0.06)", "rgba(236,238,236,0.55)", 1.4);
            if (fillK > 0) {
                ctx.save();
                ctx.beginPath(); ctx.rect(cx - 13, cy + 13 - 26 * fillK, 26, 26 * fillK); ctx.clip();
                star(ctx, cx, cy, 12, "#ffd23f", "rgba(120,90,10,0.9)", 1);
                ctx.restore();
            }
        }
        inkText(ctx, rep + "/100", 214, 61, F.hand(18), dim, "right", 1);
        inkText(ctx, TIERS[t].name, 22, 94, F.handB(27), chalk, "left", 1);
        if (S.bar) S.bar(ctx, 22, 103, 184, 5, rep / 100, "#ffd23f");
        const next = TIERS[t + 1];
        inkText(ctx, next ? "dalej: " + next.name + " (" + next.rep + ")" : "najwyższa sława", 22, 126, F.hand(17), dim, "left", 1);
        // right: in hand
        const rx = 236;
        ctx.fillStyle = "rgba(236,238,236,0.18)";
        ctx.fillRect(rx - 12, 18, 1, 110);
        const act = activeList();
        ctx.font = F.caps(13); ctx.fillStyle = yellow;
        spaced(ctx, "W TOKU  " + act.length + "/" + MAX_ACTIVE, rx, 32, 1.8, "left");
        if (!act.length) inkText(ctx, "nic - zerwij jakąś kartkę", rx, 60, F.hand(19), dim, "left", 1);
        act.slice(0, 3).forEach((n, i) => {
            const y = 40 + i * 30, ready = isReady(n);
            const q = n.req.find(r => !rowDone(r)) || n.req[0];
            drawReqIcon(ctx, this.A, q, rx, y + 2, 22);
            const right = ready ? "gotowe!" : Math.min(have(q), q.n) + "/" + q.n + " · " + Math.max(0, daysLeft(n)) + " d";
            ctx.font = F.handB(19);
            const room = 418 - Math.ceil(ctx.measureText(right).width) - 10 - (rx + 28);
            ctx.font = F.hand(19);
            let title = n.title;
            if (ctx.measureText(title).width > room) {
                while (ctx.measureText(title + "…").width > room && title.length > 3) title = title.slice(0, -1);
                title = title.trim() + "…";
            }
            inkText(ctx, title, rx + 28, y + 19, F.hand(19), chalk, "left", 1);
            inkText(ctx, right, 418, y + 19, F.handB(19), ready ? "#9ff0a8" : daysLeft(n) <= 1 ? "#ff9f8f" : dim, "right", 1);
            if (data().track === n.id) { ctx.fillStyle = S.accent; ctx.fillRect(rx - 6, y + 6, 3, 16); }
        });
        // the purse (and grandpa's debt) along the bottom
        ctx.fillStyle = "rgba(236,238,236,0.18)";
        ctx.fillRect(18, 138, 410, 1);
        const py = 162;
        const parts = img(this.A.parts);
        if (parts) ctx.drawImage(parts, PART.coin[0] + 18, PART.coin[1] + 18, 28, 28, 22, py - 17, 20, 20);
        inkText(ctx, "Sakiewka: " + Math.round(this.purseShown) + " G", 48, py, F.handB(21), "#ffe27a", "left", 1);
        this._purseAt = [L.slate[0] + 32, L.slate[1] + py - 7];
        if (T.call("Story", "state") && T.call("Story", "active")) {
            const s = T.call("Story", "state"), left = Math.max(0, Math.round(this.debtShown !== undefined && this.anim && this.anim.debt ? this.debtShown : s.debt - s.paid));
            inkText(ctx, left > 0 ? "Dług dziadka: " + left + " G" : "Dług dziadka spłacony", rx, py, F.hand(20), left > 0 ? dim : "#9ff0a8", "left", 1);
            this._debtAt = [L.slate[0] + rx + 60, L.slate[1] + py - 7];
        }
        this._repAt = [L.slate[0] + 94, L.slate[1] + 54];
        b._baseTexture.update();
    };

    // ---- the yellow brackets round the focused element (the interface's cursor)
    Scene_QuestBoard.prototype.drawBrackets = function() {
        const spr = this._brackets, el = this.focus;
        spr.visible = !!el && this.mode !== "tutorial";
        if (!spr.visible) return;
        const lifted = el === this._tag ? 1.08 : 1.07, w = Math.round(el.w * lifted), h = Math.round(el.h * lifted), key = w + "x" + h;
        if (spr._key !== key) {   // four yellow corners (the interface's cursor), drawn once per size
            spr._key = key;
            const m = 8, bw = w + m * 2 + 6, bh = h + m * 2 + 6, b = new Bitmap(bw, bh), ctx = b.context, L2 = 14;
            const x0 = 3, y0 = 3, x1 = bw - 3, y1 = bh - 3;
            const corners = () => {
                ctx.beginPath();
                ctx.moveTo(x0, y0 + L2); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L2, y0);
                ctx.moveTo(x1 - L2, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L2);
                ctx.moveTo(x1, y1 - L2); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L2, y1);
                ctx.moveTo(x0 + L2, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L2);
            };
            ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 5; corners(); ctx.stroke();
            ctx.strokeStyle = U().accent; ctx.lineWidth = 2.5; corners(); ctx.stroke();
            b._baseTexture.update();
            spr.bitmap = b;
        }
        const k = el.lift, pulse = 1 + 0.012 * Math.sin(Graphics.frameCount / 10);
        spr.x = el.x;
        spr.y = el === this._tag ? el.y + el.h * el.scale.y / 2 : el.y;
        spr.scale.set(pulse, pulse);
        spr.opacity = Math.round(255 * (0.4 + 0.6 * k));
    };

    // ---- input
    Scene_QuestBoard.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (!this._cards) return;
        this._t = (this._t || 0) + 1;
        if (this._detailT !== undefined && this._detailT < 10) {
            this._detailT++;
            const e = this._detailT / 10;
            this._detail.x = L.detail[0] + Math.round((1 - e) * 14);
            this._detail.opacity = 120 + 135 * e;
        }
        if (this._toastT > 0) { this._toastT--; this._toast.opacity = Math.min(255, this._toastT * 12); }
        this.drawBrackets();
        this.updateAmbience();
        if (this.anim) { this.updateAnim(); return; }
        if (this.mode === "tutorial") { this.updateTutorial(); return; }
        if (this.isBusy()) return;
        this.updateMouse();
        if (this.mode === "browse") this.updateBrowse();
        else if (this.mode === "choice") this.updateChoice();
    };
    Scene_QuestBoard.prototype.updateMouse = function() {
        const mx = TouchInput.x, my = TouchInput.y, moved = mx !== this._mouse[0] || my !== this._mouse[1];
        this._mouse = [mx, my];
        if (moved) {
            if (this.mode === "browse") {
                const over = this.hitElement(mx, my);
                if (over && over !== this.focus) this.setFocus(over);
            } else if (this.mode === "choice" && this._buttonRects) {
                const i = this._buttonRects.findIndex(([x, y, w, h]) => mx >= x && mx <= x + w && my >= y && my <= y + h);
                if (i >= 0 && i !== this.choiceIndex) { this.choiceIndex = i; SoundManager.playCursor(); this.drawButtons(); }
            }
        }
    };
    Scene_QuestBoard.prototype.hitElement = function(mx, my) {
        const cards = this._cardLayer.children.slice().reverse();   // the top one first
        for (const c of cards) if (c.hits && c.hits(mx, my)) return c;
        return this._tag.hits(mx, my) ? this._tag : null;
    };
    Scene_QuestBoard.prototype.updateBrowse = function() {
        const dirs = [["left", -1, 0], ["right", 1, 0], ["up", 0, -1], ["down", 0, 1]];
        for (const [k, dx, dy] of dirs) if (Input.isRepeated(k)) { this.moveFocus(dx, dy); return; }
        if (Input.isTriggered("ok")) { this.openChoice(); return; }
        if (TouchInput.isTriggered()) {
            const over = this.hitElement(TouchInput.x, TouchInput.y);
            if (over) { this.setFocus(over, true); this.openChoice(); return; }
            if (this._buttonRects) {
                const i = this._buttonRects.findIndex(([x, y, w, h]) => TouchInput.x >= x && TouchInput.x <= x + w && TouchInput.y >= y && TouchInput.y <= y + h);
                if (i >= 0) { this.openChoice(); this.choiceIndex = i; this.drawButtons(); this.decide(); return; }
            }
        }
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) { SoundManager.playCancel(); this.popScene(); }
    };
    // the nearest element in that direction (the angle counts twice as much as the distance)
    Scene_QuestBoard.prototype.moveFocus = function(dx, dy) {
        const el = this.focus || this._cards[0];
        if (!el) return;
        const pos = e => [e.baseX !== undefined ? e.baseX : e.x, e.baseY !== undefined ? e.baseY : e.y + e.h / 2];
        const [x0, y0] = pos(el);
        let best = null, bestS = Infinity;
        for (const e of this.elements()) {
            if (e === el) continue;
            const [x, y] = pos(e), vx = x - x0, vy = y - y0, along = vx * dx + vy * dy;
            if (along < 12) continue;
            const across = Math.abs(vx * dy - vy * dx), s = along + across * 2;
            if (s < bestS) { bestS = s; best = e; }
        }
        if (best) this.setFocus(best);
    };
    Scene_QuestBoard.prototype.openChoice = function() {
        if (!this.focus) return;
        this._confirm = false;
        this.mode = "choice";
        this.choices = this.choiceList();
        const first = this.choices.findIndex(c => c.enabled !== false);
        this.choiceIndex = Math.max(0, first);
        SoundManager.playOk();
        if (this.focus === this._tag) this._tag.nudge();
        this.drawButtons();
        this.drawHints();
    };
    Scene_QuestBoard.prototype.closeChoice = function() {
        this._confirm = false;
        this.mode = "browse";
        this.refreshDetail(false);
    };
    Scene_QuestBoard.prototype.updateChoice = function() {
        const n = this.choices.length;
        if (Input.isRepeated("left") || Input.isRepeated("up")) { this.choiceIndex = (this.choiceIndex + n - 1) % n; SoundManager.playCursor(); this.drawButtons(); return; }
        if (Input.isRepeated("right") || Input.isRepeated("down")) { this.choiceIndex = (this.choiceIndex + 1) % n; SoundManager.playCursor(); this.drawButtons(); return; }
        if (Input.isTriggered("ok")) { this.decide(); return; }
        if (TouchInput.isTriggered() && this._buttonRects) {
            const i = this._buttonRects.findIndex(([x, y, w, h]) => TouchInput.x >= x && TouchInput.x <= x + w && TouchInput.y >= y && TouchInput.y <= y + h);
            if (i >= 0) { this.choiceIndex = i; this.drawButtons(); this.decide(); return; }
            const over = this.hitElement(TouchInput.x, TouchInput.y);
            if (over && over !== this.focus) { this.closeChoice(); this.setFocus(over, true); return; }
        }
        if (Input.isTriggered("cancel") || TouchInput.isCancelled()) { SoundManager.playCancel(); this.closeChoice(); }
    };
    Scene_QuestBoard.prototype.toast = function(text, color) {
        const b = this._toast.bitmap, ctx = b.context, S = U();
        b.clear();
        ctx.font = F.ui(18, false);
        const w = Math.min(b.width - 4, Math.ceil(ctx.measureText(text).width) + 28), x = b.width - w - 2;
        if (S.panel) S.panel(ctx, x, 2, w, 30, { cut: 4, fill: "rgba(11,12,15,0.97)", line: color || "#ff9f8f", accent: false });
        ctx.fillStyle = color || "#ff9f8f";
        ctx.textAlign = "center";
        ctx.fillText(text, x + w / 2, 23, w - 16);
        b._baseTexture.update();
        this._toastT = 150;
        this._toast.opacity = 255;
    };
    Scene_QuestBoard.prototype.decide = function() {
        const c = this.choices[this.choiceIndex], el = this.focus;
        if (!c || !el) return;
        const n = el.n;
        if (c.enabled === false) {
            SoundManager.playBuzzer();
            if (c.id === "accept") this.toast("Masz już " + MAX_ACTIVE + " zlecenia. Oddaj albo porzuć któreś.");
            else if (c.id === "turnIn") { const q = n.req.find(r => !rowDone(r)); this.toast(q ? "Brakuje: " + reqName(q) + " " + Math.min(have(q), q.n) + "/" + q.n : "Jeszcze nie gotowe."); }
            return;
        }
        switch (c.id) {
            case "close": case "leave": case "abandonNo":
                SoundManager.playCancel();
                this.closeChoice();
                return;
            case "accept": {
                const r = accept(n.id);
                if (!r.ok) { SoundManager.playBuzzer(); this.toast(r.why); return; }
                T.audio.se("Blow1", { volume: 55, pitch: 62 });
                T.audio.se("Book2", { volume: 60, pitch: 110 });
                el.refreshStamp(true);
                el.shake = 5;
                this.closeChoice();
                this.toast("Przyjęte. Postęp widać w dzienniku (J); „Śledź” pokaże je na ekranie.", "#ffd23f");
                this.drawSlate();
                return;
            }
            case "track":
                track(data().track === n.id ? null : n.id);
                SoundManager.playOk();
                this.drawSlate();
                this.choices = this.choiceList();
                this.drawButtons();
                this.toast(data().track === n.id ? "Śledzisz to zlecenie w okienku celu na ekranie." : "Już go nie śledzisz.", "#ffd23f");
                return;
            case "abandon":
                SoundManager.playOk();
                this._confirm = true;
                this.choices = this.choiceList();
                this.choiceIndex = 1;
                this.drawButtons();
                return;
            case "abandonYes": {
                const loss = abandon(n.id);
                this._confirm = false;
                T.audio.se("Book2", { volume: 70, pitch: 70 });
                this.tearOff(el);
                this.toast("Porzucone. Sława w tawernie -" + loss, "#ff9f8f");
                this.repShown = data().rep;
                this.drawSlate();
                return;
            }
            case "turnIn": case "turnInDebt":
                this.startTurnIn(el, c.id === "turnInDebt");
                return;
        }
    };
    // an abandoned notice: torn off the board, it falls away
    Scene_QuestBoard.prototype.tearOff = function(el) {
        this._cards = this._cards.filter(c => c !== el);
        this._falling = this._falling || [];
        el.vy = -2; el.vr = (Math.random() - 0.5) * 0.08;
        this._falling.push(el);
        this.mode = "browse";
        const next = this._cards[0] || this._tag;
        this.focus = null;
        this.setFocus(next, true);
    };

    // ---- turning in: the goods go into the card, the stamp, the coins fly to the purse, the stars fill
    Scene_QuestBoard.prototype.startTurnIn = function(el, debt) {
        const n = el.n, gone = n.req.filter(q => q.k === "item").map(q => [iconOf(q.id), q.n]);
        const before = { gold: $gameParty.gold(), rep: data().rep, debt: T.call("Story", "left") || 0 };
        const res = turnIn(n.id, { debt });
        if (!res) { SoundManager.playBuzzer(); return; }
        this.mode = "anim";
        this.drawHints();
        this.drawButtons();
        this.anim = { t: 0, el, res, gone, debt: debt && res.toDebt > 0, coins: [], goldFrom: before.gold, repFrom: before.rep, debtFrom: before.debt, paid: 0 };
        this.purseShown = before.gold;
        this.repShown = before.rep;
        this.debtShown = before.debt;
        // the goods from the purse corner into the card
        gone.forEach(([icon], i) => this.flyIcon(icon, this._purseAt || [1000, 640], [el.x, el.y], 6 * i, 26, true));
        if (gone.length) T.audio.se("Equip1", { volume: 55, pitch: 100 });
    };
    Scene_QuestBoard.prototype.flyIcon = function(icon, from, to, delay, dur, fade) {
        const b = new Bitmap(32, 32);
        const ctx = b.context;
        drawIcon(ctx, this.A.iconSet, icon, 0, 0, 32);
        b._baseTexture.update();
        const s = new Sprite(b);
        s.anchor.set(0.5, 0.5);
        s.visible = false;
        this._fx.addChild(s);
        (this._flyers = this._flyers || []).push({ s, from, to, delay, dur, t: 0, fade, arc: -60 });
    };
    Scene_QuestBoard.prototype.updateAnim = function() {
        const a = this.anim, el = a.el, fast = Input.isTriggered("ok") || TouchInput.isTriggered();
        a.t += fast ? 40 : 1;
        this.updateFlyers(fast);
        const STAMP = 34, COINS = 50;
        if (a.t >= STAMP && !a.stamped) {
            a.stamped = true;
            el.refreshStamp(true);
            el.shake = 6;
            T.audio.se("Blow1", { volume: 60, pitch: 58 });
            this.sparkles(el.x, el.y, 10, "#9ff0a8");
        }
        if (a.t >= COINS && !a.coinsOut) {
            a.coinsOut = true;
            const count = clamp(4 + Math.round(a.res.gold / 8), 5, 18), to = a.debt ? this._debtAt || this._purseAt : this._purseAt;
            a.coinCount = count;
            for (let i = 0; i < count; i++) {
                const b = new Bitmap(24, 24);
                b.context.drawImage(img(this.A.parts), PART.coin[0] + 18, PART.coin[1] + 18, 28, 28, 0, 0, 24, 24);
                b._baseTexture.update();
                const s = new Sprite(b);
                s.anchor.set(0.5, 0.5);
                s.visible = false;
                this._fx.addChild(s);
                const f = { s, from: [el.x + (Math.random() - 0.5) * 40, el.y + (Math.random() - 0.5) * 30], to: to || [1000, 640], delay: i * 3, dur: 34 + Math.random() * 12, t: 0, coin: true, arc: -90 - Math.random() * 80, spin: Math.random() * 6 };
                (this._flyers = this._flyers || []).push(f);
            }
            this.floatText("+" + a.res.xp + " dośw.", el.x, el.y - 40, "#c9a6ff");
        }
        // the stars fill after the coins
        if (a.t >= COINS + 40) {
            const k = clamp((a.t - COINS - 40) / 50, 0, 1);
            this.repShown = a.repFrom + (a.res.repAfter - a.repFrom) * (1 - Math.pow(1 - k, 2));
            if (k >= 1 && a.res.tierUp && !a.tierSaid) {
                a.tierSaid = true;
                T.audio.se("Chime2", { volume: 80, pitch: 100 });
                this.sparkles(this._repAt[0], this._repAt[1], 16, "#ffd23f");
                this.banner("Nowa sława: " + a.res.tierUp + "!");
            }
            if (a.gift === undefined && a.res.gift) { a.gift = true; this.flyIcon(iconOf(a.res.gift[0]), [el.x, el.y], this._purseAt, 0, 30, true); }
            if (!a.dieSaid && a.res.die) {
                a.dieSaid = true;
                const TD = T.api("TavernDice"), DT = TD && TD.DIE_TYPES && TD.DIE_TYPES[a.res.die];
                this.floatText("Nowa kość: " + (DT ? DT.name : a.res.die), el.x, el.y + 10, "#ffe27a");
            }
        }
        this.drawSlate();
        const end = COINS + 110 + (a.res.tierUp ? 40 : 0);
        if (a.t >= end && !(this._flyers || []).length) {
            this.purseShown = $gameParty.gold();
            this.repShown = data().rep;
            this.anim = null;
            this.mode = "browse";
            this.drawSlate();
            this.refreshDetail(false);
        }
    };
    Scene_QuestBoard.prototype.updateFlyers = function(fast) {
        const list = this._flyers || [];
        for (const f of list) {
            if (fast) { f.delay = 0; f.t = f.dur; }
            if (f.delay > 0) { f.delay--; continue; }
            f.t++;
            const k = clamp(f.t / f.dur, 0, 1), e = f.coin ? k * k * (3 - 2 * k) : 1 - Math.pow(1 - k, 2);
            const mx = (f.from[0] + f.to[0]) / 2, my = Math.min(f.from[1], f.to[1]) + f.arc;
            const x = (1 - e) * (1 - e) * f.from[0] + 2 * (1 - e) * e * mx + e * e * f.to[0];
            const y = (1 - e) * (1 - e) * f.from[1] + 2 * (1 - e) * e * my + e * e * f.to[1];
            f.s.visible = true;
            f.s.x = x; f.s.y = y;
            if (f.coin) { f.s.scale.x = Math.cos(f.t / 3 + f.spin); f.s.scale.y = 1; }
            if (f.fade) f.s.opacity = 255 * (k < 0.8 ? 1 : (1 - k) / 0.2);
            if (k >= 1 && !f.done) {
                f.done = true;
                if (f.coin && this.anim) {
                    const a = this.anim, share = a.res.gold / (a.coinCount || 1);
                    if (a.debt) { this.debtShown -= share; } else this.purseShown = Math.min($gameParty.gold(), this.purseShown + share);
                    if ((a.coinSe = (a.coinSe || 0) + 1) % 2 === 1) T.audio.se("Coin", { volume: 45, pitch: 95 + Math.floor(Math.random() * 40) });
                    this.sparkles(f.to[0], f.to[1], 2, "#ffe27a");
                }
                this._fx.removeChild(f.s);
            }
        }
        this._flyers = list.filter(f => !f.done);
        // the sparkles and the floating texts
        for (const s of this._fx.children.slice()) {
            if (s._life === undefined) continue;
            s._life--;
            s.x += s._vx; s.y += s._vy; s._vy += s._g || 0;
            s.opacity = Math.max(0, Math.min(255, s._life * 12));
            if (s._life <= 0) this._fx.removeChild(s);
        }
        // abandoned notices falling off the board
        for (const el of this._falling || []) {
            el.vy += 0.5; el.y += el.vy; el.baseY = el.y; el.rotation += el.vr; el.alpha = Math.max(0, el.alpha - 0.03);
            if (el.alpha <= 0 && el.parent) el.parent.removeChild(el);
        }
        this._falling = (this._falling || []).filter(el => el.parent);
    };
    const sparkleCache = {};
    function sparkleBitmap(color) {
        if (sparkleCache[color]) return sparkleCache[color];
        const b = new Bitmap(14, 14), ctx = b.context;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(8.5, 5.5); ctx.lineTo(14, 7); ctx.lineTo(8.5, 8.5); ctx.lineTo(7, 14); ctx.lineTo(5.5, 8.5); ctx.lineTo(0, 7); ctx.lineTo(5.5, 5.5); ctx.closePath(); ctx.fill();
        b._baseTexture.update();
        return (sparkleCache[color] = b);
    }
    Scene_QuestBoard.prototype.sparkles = function(x, y, n, color) {
        for (let i = 0; i < n; i++) {
            const s = new Sprite(sparkleBitmap(color));
            s.anchor.set(0.5, 0.5);
            s.x = x; s.y = y;
            const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 2.5;
            s._vx = Math.cos(a) * v; s._vy = Math.sin(a) * v - 1; s._g = 0.08; s._life = 22 + Math.floor(Math.random() * 12);
            s.scale.set(0.6 + Math.random() * 0.6, 0.6 + Math.random() * 0.6);
            this._fx.addChild(s);
        }
    };
    Scene_QuestBoard.prototype.floatText = function(text, x, y, color) {
        const probe = new Bitmap(8, 8);
        probe.fontSize = 24;
        const w = Math.ceil(probe.measureTextWidth(text)) + 20, b = new Bitmap(w, 34);
        b.fontSize = 24;
        b.textColor = color;
        b.outlineColor = "rgba(0,0,0,0.9)";
        b.outlineWidth = 4;
        b.drawText(text, 0, 0, w, 34, "center");
        const s = new Sprite(b);
        s.anchor.set(0.5, 0.5);
        s.x = x; s.y = y; s._vx = 0; s._vy = -0.7; s._g = 0; s._life = 80;
        this._fx.addChild(s);
    };
    Scene_QuestBoard.prototype.banner = function(text) {
        const S = U(), probe = new Bitmap(8, 8);
        probe.fontSize = 24;
        const w = Math.ceil(probe.measureTextWidth(text)) + 60, b = new Bitmap(w, 48), ctx = b.context;
        if (S.panel) S.panel(ctx, 0, 0, w, 48, { cut: 6 });
        b.fontSize = 24;
        b.textColor = S.accent;
        b.outlineWidth = 0;
        b.drawText(text, 0, 7, w, 34, "center");
        const s = new Sprite(b);
        s.anchor.set(0.5, 0.5);
        s.x = L.slate[0] + (L.slate[2] - L.slate[0]) / 2;
        s.y = L.slate[1] - 30;
        s._vx = 0; s._vy = -0.15; s._g = 0; s._life = 150;
        this._fx.addChild(s);
    };

    // ---- the first time: Borgar explains the board (his words: QuestBoard_Data.js)
    Scene_QuestBoard.prototype.showTutorial = function() {
        this.mode = "tutorial";
        this._tutPage = 0;
        this.drawTutorial();
        this.drawHints();
    };
    Scene_QuestBoard.prototype.drawTutorial = function() {
        const b = this._overlay.bitmap, ctx = b.context, S = U(), W = b.width, H = b.height;
        b.clear();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        // Borgar's bust at the bottom right, facing the panel on its left (as in the talks)
        const bust = img(this.A.bust), bh = 300, bw = bust ? Math.round(this.A.bust.width * bh / this.A.bust.height) : 0;
        const pw = 820, ph = 168, px = W - bw - pw + 20, py = H - ph - 52;
        if (S.panel) S.panel(ctx, px, py, pw, ph, { cut: 8 });
        else { ctx.fillStyle = S.fill; ctx.fillRect(px, py, pw, ph); }
        ctx.fillStyle = "rgba(11,12,15,0.9)";   // the tail towards the bust
        ctx.beginPath(); ctx.moveTo(px + pw - 1, py + 50); ctx.lineTo(px + pw + 18, py + 62); ctx.lineTo(px + pw - 1, py + 76); ctx.closePath(); ctx.fill();
        if (bust) {
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(bust, 0, 0, this.A.bust.width, this.A.bust.height, W - bw - 8, H - bh, bw, bh);
            ctx.restore();
        }
        ctx.font = F.ui(15, true);
        ctx.fillStyle = S.accent;
        ctx.textAlign = "left";
        spaced(ctx, "BORGAR", px + 30, py + 38, 2, "left");
        ctx.font = F.ui(21, false);
        ctx.fillStyle = S.text;
        const lines = wrap(ctx, TUTORIAL[this._tutPage], pw - 60);
        lines.forEach((l, i) => ctx.fillText(l, px + 30, py + 70 + i * 28));
        ctx.font = F.ui(16, false);
        ctx.fillStyle = S.muted;
        ctx.textAlign = "right";
        ctx.fillText((this._tutPage + 1) + "/" + TUTORIAL.length + "   O - dalej", px + pw - 22, py + ph - 16);
        b._baseTexture.update();
        this._overlay.visible = true;
    };
    Scene_QuestBoard.prototype.updateTutorial = function() {
        if (Input.isTriggered("ok") || Input.isTriggered("cancel") || TouchInput.isTriggered()) {
            SoundManager.playOk();
            this._tutPage++;
            if (this._tutPage >= TUTORIAL.length) {
                data().tutorial = true;
                this._overlay.visible = false;
                this.mode = "browse";
                this.drawHints();
            } else this.drawTutorial();
        }
    };

    P.Scene = Scene_QuestBoard;
    window.Scene_QuestBoard = Scene_QuestBoard;
})();
