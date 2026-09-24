//=============================================================================
// SpeechBubbles.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Rozmowy w dymkach: tekst wiadomości pojawia się w dymku nad postacią, która mówi, z ogonkiem do niej. Krótkie okrzyki postaci (np. przed burzą). v1.0.0
 * @author Claude
 *
 * @help
 * Na mapie każda wiadomość (polecenie "Pokaż tekst") pojawia się w dymku nad
 * tym, kto mówi, zamiast w oknie na dole ekranu. Ogonek dymka wskazuje
 * mówiącego. Kto mówi:
 *  - wiadomość z twarzą bohatera (pierwszej osoby w drużynie) - gracz;
 *  - wiadomość z inną twarzą - zdarzenie, które ją pokazuje (np. Borgar);
 *  - wiadomość bez twarzy (opis, myśl, pytanie "Położyć się spać?") - gracz.
 * Twarzy w dymku nie ma. Wybory ("Pokaż wybory") pojawiają się obok dymka.
 * Gdy nad głową nie ma miejsca, dymek staje obok postaci (ogonek w bok),
 * a gdy i tam go brak - pod stopami (ogonek w górę).
 *
 * Kod w tekście wiadomości (w grze niewidoczny) wskazuje mówiącego wprost:
 *   \SPK[0]    gracz
 *   \SPK[5]    zdarzenie nr 5 na tej mapie
 *   \SPK[-1]   zwykłe okno na dole ekranu, bez dymka
 * W bitwie i poza mapą wiadomości są w zwykłym oknie; tak samo, gdy mówiący
 * jest poza ekranem.
 *
 * Dla innych wtyczek:
 *   SpeechBubbles.say(postać, "tekst", klatki)
 * krótki dymek nad postacią ($gamePlayer albo zdarzenie), który po chwili
 * sam znika i nie zatrzymuje gry (np. "Idzie burza..." z Survival.js).
 * Klatki można pominąć: czas zależy wtedy od długości tekstu.
 */

(() => {
    "use strict";

    const MAX_W = 760;                              // the widest a bubble's text gets (px)
    const TAIL = { w: 18, h: 14, inset: 20 };       // the tail: base width, length, how near the corners its base may go
    const GAP = 2;                                  // px between the tail's tip and the speaker's head (or feet)
    const EDGE = 8;                                 // px kept free at the screen's edges
    const CUT = 5;                                  // the cut corners of the panel (as the windows)
    const BARK = { font: 20, line: 28, padX: 14, padY: 7, fadeIn: 10, fadeOut: 18 };

    const style = () => window.UIStyle || { fill: "rgba(11,12,15,0.9)", line: "#3a3e46", accent: "#ffd23f", text: "#eceef0" };

    // ------------------------------------------------------------------
    // The picture: a panel like the windows (cut corners, a thin grey line, yellow brackets on two corners) with a tail on one
    // edge, pointing at the speaker. tail = { edge: "bottom" | "top" | "left" | "right", base, tipX, tipY }: base = the middle
    // of the tail's root along that edge (px from the panel's left or top), the tip in the bitmap's px. The bitmap is the panel
    // plus TAIL.h on the tail's side; the panel starts at (ox, oy) in it.
    // ------------------------------------------------------------------
    const tailOffset = edge => ({ ox: edge === "left" ? TAIL.h : 0, oy: edge === "top" ? TAIL.h : 0 });
    const bubbleSize = (w, h, edge) => (edge === "left" || edge === "right" ? { bw: w + TAIL.h, bh: h } : { bw: w, bh: h + TAIL.h });
    function paintBubble(bmp, w, h, tail) {
        const ctx = bmp.context, S = style(), c = CUT, hw = TAIL.w / 2, e = tail.edge;
        const { ox, oy } = tailOffset(e), L0 = ox + 0.5, T0 = oy + 0.5, R0 = ox + w - 0.5, B0 = oy + h - 0.5;
        const tip = () => ctx.lineTo(tail.tipX, tail.tipY);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(L0 + c, T0);
        if (e === "top") { ctx.lineTo(ox + tail.base - hw, T0); tip(); ctx.lineTo(ox + tail.base + hw, T0); }
        ctx.lineTo(R0 - c, T0);
        ctx.lineTo(R0, T0 + c);
        if (e === "right") { ctx.lineTo(R0, oy + tail.base - hw); tip(); ctx.lineTo(R0, oy + tail.base + hw); }
        ctx.lineTo(R0, B0 - c);
        ctx.lineTo(R0 - c, B0);
        if (e === "bottom") { ctx.lineTo(ox + tail.base + hw, B0); tip(); ctx.lineTo(ox + tail.base - hw, B0); }
        ctx.lineTo(L0 + c, B0);
        ctx.lineTo(L0, B0 - c);
        if (e === "left") { ctx.lineTo(L0, oy + tail.base + hw); tip(); ctx.lineTo(L0, oy + tail.base - hw); }
        ctx.lineTo(L0, T0 + c);
        ctx.closePath();
        ctx.fillStyle = "rgba(11,12,15,0.94)";
        ctx.fill();
        ctx.strokeStyle = S.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        // the yellow brackets of the windows: top-left and bottom-right
        const L = Math.max(3, Math.min(10, w / 4, h / 2 - c)), x0 = ox, y0 = oy, x1 = ox + w, y1 = oy + h;
        ctx.strokeStyle = S.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0 + 1, y0 + c + L); ctx.lineTo(x0 + 1, y0 + c); ctx.lineTo(x0 + c, y0 + 1); ctx.lineTo(x0 + c + L, y0 + 1);
        ctx.moveTo(x1 - 1, y1 - c - L); ctx.lineTo(x1 - 1, y1 - c); ctx.lineTo(x1 - c, y1 - 1); ctx.lineTo(x1 - c - L, y1 - 1);
        ctx.stroke();
        ctx.restore();
        bmp._baseTexture.update();
    }
    // where a w x h panel goes for a speaker (head: headOf): above the head (the tail down to it); with no room there, beside
    // the face (right, else left; the tail sideways); else under the feet (the tail up). -> { x, y, tail } (the panel's top-left)
    const SIDE_GAP = 14;   // px from the head's middle to the tail's tip, sideways
    function placePanel(w, h, head) {
        const W = Graphics.boxWidth, H = Graphics.boxHeight;
        const clampX = x => Math.max(EDGE, Math.min(W - EDGE - w, Math.round(x))), clampY = y => Math.max(EDGE, Math.min(H - EDGE - h, Math.round(y)));
        const root = (size, point) => Math.max(TAIL.inset, Math.min(size - TAIL.inset, Math.round(point)));
        if (head.top - GAP - TAIL.h - h >= EDGE) {
            const x = clampX(head.x - w / 2), y = Math.round(head.top - GAP - TAIL.h - h);
            const tipX = Math.max(CUT + 2, Math.min(w - CUT - 2, Math.round(head.x - x)));
            return { x, y, tail: { edge: "bottom", base: root(w, tipX), tipX, tipY: h + TAIL.h } };
        }
        const faceY = head.top + Math.min(20, (head.foot - head.top) / 3);   // (level with the face)
        const rightX = head.x + SIDE_GAP + TAIL.h, leftX = head.x - SIDE_GAP - TAIL.h - w;
        const onRight = rightX + w <= W - EDGE;
        if (onRight || leftX >= EDGE) {
            const x = Math.round(onRight ? rightX : leftX), y = clampY(faceY - Math.min(h / 2, 26)), at = Math.round(faceY - y);
            const tipY = Math.max(2, Math.min(h - 2, at));
            return { x, y, tail: { edge: onRight ? "left" : "right", base: root(h, at), tipX: onRight ? 0 : w + TAIL.h, tipY } };
        }
        const x = clampX(head.x - w / 2), y = Math.min(H - EDGE - h, Math.round(head.foot + GAP + TAIL.h));
        const tipX = Math.max(CUT + 2, Math.min(w - CUT - 2, Math.round(head.x - x)));
        return { x, y, tail: { edge: "top", base: root(w, tipX), tipX, tipY: 0 } };
    }

    // ------------------------------------------------------------------
    // Where a character is on the screen: just above its head, and its feet (window-layer coordinates; the map may be zoomed)
    // ------------------------------------------------------------------
    function spriteOf(ch) {
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        return set && set._characterSprites ? set._characterSprites.find(s => s._character === ch) : null;
    }
    function headOf(ch) {
        const s = spriteOf(ch);
        if (!s || !s.bitmap || !s.parent) return null;
        const h = typeof s.patternHeight === "function" ? s.patternHeight() : 48;
        const layer = SceneManager._scene._windowLayer, ox = layer ? layer.x : 0, oy = layer ? layer.y : 0;
        const top = s.toGlobal(new Point(0, -h)), foot = s.toGlobal(new Point(0, 0));
        return { x: top.x - ox, top: top.y - oy, foot: foot.y - oy };
    }
    const onScreen = p => !!p && p.x >= 0 && p.x <= Graphics.boxWidth && p.foot >= 0 && p.top <= Graphics.boxHeight;

    // ------------------------------------------------------------------
    // Who speaks: "Pokaż tekst" notes the event running it (and a \SPK[n] in the text); the face tells the rest
    // ------------------------------------------------------------------
    const _Game_Message_clear = Game_Message.prototype.clear;
    Game_Message.prototype.clear = function() {
        _Game_Message_clear.call(this);
        this._speaker = null;
    };
    const _command101 = Game_Interpreter.prototype.command101;
    Game_Interpreter.prototype.command101 = function(params) {
        const busy = $gameMessage.isBusy();
        const result = _command101.call(this, params);
        if (!busy && $gameMessage.hasText()) {
            const sp = { eventId: this.eventId() };
            $gameMessage._texts = $gameMessage._texts.map(t => t.replace(/\\SPK\[(-?\d+)\]/gi, (m, n) => { sp.forced = Number(n); return ""; }));
            $gameMessage._speaker = sp;
        }
        return result;
    };
    // the character the message comes from, or null (the usual window)
    function speakerOf() {
        if (!(SceneManager._scene instanceof Scene_Map) || !$gameMap || !$gamePlayer) return null;
        const sp = $gameMessage._speaker || {};
        let ch;
        if (sp.forced !== undefined) ch = sp.forced < 0 ? null : sp.forced === 0 ? $gamePlayer : $gameMap.event(sp.forced);
        else {
            const face = $gameMessage.faceName(), lead = $gameParty.leader();
            if (!face || (lead && lead.faceName() === face && lead.faceIndex() === $gameMessage.faceIndex())) ch = $gamePlayer;
            else ch = sp.eventId > 0 ? $gameMap.event(sp.eventId) : null;
        }
        return ch && onScreen(headOf(ch)) ? ch : null;
    }

    // the size of a message's text, measured by a plain window (the message window's own measuring would already run its \. \! waits
    // and page breaks)
    let measurer = null;
    function measure(text) {
        if (!measurer) measurer = new Window_Base(new Rectangle(0, 0, MAX_W + 64, 640));
        return measurer.textSizeEx(text);
    }

    // ------------------------------------------------------------------
    // The message window as a bubble: sized to its text, over the speaker, no face, the window itself invisible
    // (the bubble sprite behind the text is the panel)
    // ------------------------------------------------------------------
    const _Window_Message_initialize = Window_Message.prototype.initialize;
    Window_Message.prototype.initialize = function(rect) {
        _Window_Message_initialize.call(this, rect);
        this._bubbleOf = null;
        this._bubbleSprite = new Sprite();
        this._bubbleSprite.visible = false;
        this.addChildToBack(this._bubbleSprite);
    };
    const _startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        this._bubbleOf = speakerOf();
        _startMessage.call(this);
    };
    const _newLineX = Window_Message.prototype.newLineX;
    Window_Message.prototype.newLineX = function(textState) {
        if (!this._bubbleOf) return _newLineX.call(this, textState);
        return textState.rtl ? this.innerWidth - 4 : 4;
    };
    const _drawMessageFace = Window_Message.prototype.drawMessageFace;
    Window_Message.prototype.drawMessageFace = function() {
        if (!this._bubbleOf) _drawMessageFace.call(this);
    };
    const _updateBackground = Window_Message.prototype.updateBackground;
    Window_Message.prototype.updateBackground = function() {
        _updateBackground.call(this);
        if (this._bubbleOf) this.setBackgroundType(2);   // (transparent: the bubble is the panel)
    };
    const _updatePlacement = Window_Message.prototype.updatePlacement;
    Window_Message.prototype.updatePlacement = function() {
        if (!this._classicRect) this._classicRect = new Rectangle(this.x, this.y, this.width, this.height);
        if (this._bubbleOf && this.placeBubble()) return;
        this._bubbleOf = null;
        this._bubbleSprite.visible = false;
        const r = this._classicRect;
        if (this.x !== r.x || this.width !== r.width || this.height !== r.height) {
            this.move(r.x, this.y, r.width, r.height);
            this.createContents();
        }
        _updatePlacement.call(this);
    };
    Window_Message.prototype.placeBubble = function() {
        const head = headOf(this._bubbleOf);
        if (!onScreen(head)) return false;
        const size = measure($gameMessage.allText()), pad = this.padding;
        const w = Math.min(MAX_W + pad * 2, Math.ceil(size.width) + 12 + pad * 2), h = Math.ceil(size.height) + pad * 2;
        const at = placePanel(w, h, head);
        if (this.x !== at.x || this.y !== at.y || this.width !== w || this.height !== h) {
            this.move(at.x, at.y, w, h);
            this.createContents();
        }
        const { bw, bh } = bubbleSize(w, h, at.tail.edge), off = tailOffset(at.tail.edge), bmp = new Bitmap(bw, bh), bs = this._bubbleSprite;
        paintBubble(bmp, w, h, at.tail);
        bs.bitmap = bmp;
        bs.x = -off.ox;
        bs.y = -off.oy;
        bs.visible = true;
        this._bubbleEdge = at.tail.edge;
        return true;
    };
    // the bubble opens and closes with the window
    const _Window_Message_update = Window_Message.prototype.update;
    Window_Message.prototype.update = function() {
        _Window_Message_update.call(this);
        const bs = this._bubbleSprite;
        if (!bs) return;
        const k = this.openness / 255;
        bs.visible = !!this._bubbleOf && k > 0;
        bs.alpha = k;
    };
    // the choices: beside the bubble (right, else left), level with it
    const _choicePlacement = Window_ChoiceList.prototype.updatePlacement;
    Window_ChoiceList.prototype.updatePlacement = function() {
        _choicePlacement.call(this);
        const mw = this._messageWindow;
        if (!mw || !mw._bubbleOf || !mw.isOpen()) return;
        const right = mw.x + mw.width + 8, left = mw.x - 8 - this.width;
        this.x = right + this.width <= Graphics.boxWidth - EDGE ? right : Math.max(EDGE, left);
        this.y = Math.max(EDGE, Math.min(Graphics.boxHeight - EDGE - this.height, mw.y));
    };

    // ------------------------------------------------------------------
    // Short cries: a small bubble over a character for a few seconds while the game goes on
    // ------------------------------------------------------------------
    const barks = [];   // { ch, text, t, life }
    const log = [];     // what was said (tests read it)
    function say(ch, text, frames) {
        if (!ch || !text) return;
        text = String(text);
        for (const b of barks) if (b.ch === ch && b.t < b.life - BARK.fadeOut) b.t = b.life - BARK.fadeOut;   // the speaker's last cry goes
        barks.push({ ch, text, t: 0, life: frames || Math.min(360, 150 + text.length * 5) });
        log.push(text);
        if (log.length > 20) log.shift();
    }

    function Sprite_Barks() {
        this.initialize(...arguments);
    }
    Sprite_Barks.prototype = Object.create(Sprite.prototype);
    Sprite_Barks.prototype.constructor = Sprite_Barks;
    Sprite_Barks.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._shown = new Map();   // bark -> its sprite
    };
    Sprite_Barks.prototype.update = function() {
        Sprite.prototype.update.call(this);
        for (const b of barks.slice()) {
            b.t++;
            const gone = b.t >= b.life || (b.ch !== $gamePlayer && !$gameMap.events().includes(b.ch));
            let s = this._shown.get(b);
            if (gone) {
                barks.splice(barks.indexOf(b), 1);
                if (s) { this.removeChild(s); this._shown.delete(b); }
                continue;
            }
            const head = headOf(b.ch);
            if (!s) {
                s = new Sprite();
                s._w = 0;
                this.addChild(s);
                this._shown.set(b, s);
            }
            if (!onScreen(head)) { s.visible = false; continue; }
            if (!s._w) {   // measured once
                const probe = new Bitmap(8, 8);
                probe.fontSize = BARK.font;
                s._w = Math.ceil(probe.measureTextWidth(b.text)) + BARK.padX * 2;
                s._h = BARK.line + BARK.padY * 2;
            }
            const at = placePanel(s._w, s._h, head), key = at.tail.edge + ":" + at.tail.tipX + ":" + at.tail.tipY;
            if (s._key !== key) {   // drawn again only when the tail has to turn or move (the speaker near an edge of the screen)
                s._key = key;
                const { bw, bh } = bubbleSize(s._w, s._h, at.tail.edge), off = tailOffset(at.tail.edge), bmp = new Bitmap(bw, bh);
                paintBubble(bmp, s._w, s._h, at.tail);
                bmp.fontSize = BARK.font;
                bmp.textColor = style().text;
                bmp.outlineWidth = 0;
                bmp.drawText(b.text, off.ox, off.oy + BARK.padY, s._w, BARK.line, "center");
                s.bitmap = bmp;
                s._off = off;
            }
            s.visible = true;
            s.x = at.x - s._off.ox;
            s.y = at.y - s._off.oy - Math.round(4 * (1 - Math.min(1, b.t / BARK.fadeIn)));   // (it rises a little as it appears)
            s.opacity = Math.round(255 * Math.min(1, b.t / BARK.fadeIn, (b.life - b.t) / BARK.fadeOut));
        }
    };
    // screen space, over the map and the HUD, under the windows
    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this._barks = new Sprite_Barks();
        this.addChildAt(this._barks, this.getChildIndex(this._windowLayer));
    };
    // a new map: the cries of the old one are gone
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        barks.length = 0;
    };

    window.SpeechBubbles = { say, get barks() { return barks; }, log, speakerOf, headOf };
})();
