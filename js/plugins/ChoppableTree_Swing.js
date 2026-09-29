//=============================================================================
// ChoppableTree_Swing.js
//=============================================================================
// The hero's swings (split out of ChoppableTree.js, 2026-09-29): a swing started for an action (Farming.js, Hunting.js, Combat.js...)
// and stepped frame by frame (the pose held while something lasts), held O striking again and again, the swing sheets (img/system:
// the whole figure swings the tool) and, without a sheet, the tool of img/system/Tools.png turned about the grip. The kinds and their
// timing are ChoppableTree.js's SWING_KINDS (Combat.js reads them while it loads). Functions only: ChoppableTree.js holds every engine
// hook (Game_Player.startToolSwing / stepToolSwing, Sprite_Character.updateSwingSheet / updateToolSwing call in here).

/*:
 * @target MZ
 * @plugindesc Zamachy bohatera (część ChoppableTree.js): arkusze Swing_* i Hero_*, narzędzie bez arkusza, trzymane O. Sama nic nie robi - parametry i haki ma ChoppableTree.js. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base ChoppableTree
 * @orderAfter ChoppableTree
 *
 * @help
 * ============================================================================
 * ChoppableTree_Swing.js - zamachy bohatera
 * ============================================================================
 * Część ChoppableTree.js (wydzielona z niego): zamach narzędziem (siekiera,
 * kilof, łopata, grabie, motyka, młotek, wędka, proca, łuk, oszczep, pałka,
 * pięści, siedzenie, przewrót...) klatka po klatce z arkuszy img/system
 * (tablica SWING_KINDS w ChoppableTree.js), bez arkusza - narzędzie z
 * Tools.png; trzymane O uderza raz po raz. Sama nic nie robi: woła ją
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
    if (!T) throw new Error("ChoppableTree_Swing.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("ChoppableTree_parts") || T.register("ChoppableTree_parts", {});
    if (P.swing) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("ChoppableTree_Swing.js: musi być pod ChoppableTree.js na liście wtyczek (ChoppableTree.js is missing or below)");
    const { SWING_KINDS, swingKind } = P.core;

    const easeOut = x => 1 - (1 - x) * (1 - x);
    const easeIn = x => x * x;
    const easeInOut = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const clamp01 = x => Math.max(0, Math.min(1, x));
    const TOOL_SIZE = 32;
    const TOOL_PIVOT = { x: 16, y: 27 };
    // [wind-up angle, strike angle] in degrees for each tool (0 = held upright)
    const SWING_ANGLES = [[-70, 80], [-80, 85], [-30, 65], [-85, 70], [-75, 30]];

    // Pose of the tool at swing time f (0..1): its angle in radians (positive =
    // clockwise, before mirroring for the facing) and how far the body lunges
    // forward (0..1, peaking on the strike).
    function swingPose(f, tool) {
        const [windup, strike] = SWING_ANGLES[tool] || SWING_ANGLES[0];
        let deg;
        if (f < 0.42) deg = windup * easeOut(f / 0.42);
        else if (f < 0.5) deg = windup;
        else if (f < 0.6) deg = windup + (strike - windup) * easeIn((f - 0.5) / 0.1);
        else deg = strike * (1 - easeInOut(clamp01((f - 0.6) / 0.4)));
        return { angle: (deg * Math.PI) / 180, lunge: Math.sin(Math.PI * clamp01((f - 0.42) / 0.4)) };
    }

    // ------------------------------------------------------------------
    // A swing for an action that has no event to wait on (Game_Player.startToolSwing - the options: ChoppableTree.js)
    // ------------------------------------------------------------------
    function startToolSwing(kind, onImpact, onDone, opts) {
        if (!SWING_KINDS[kind] || this._toolSwing || this._swingEvent) return false;
        this._toolSwing = { _swingT: 0, _swingKind: kind, onImpact, onDone, opts: opts || null, _waiting: false, _wait: 0 };
        this._swingEvent = this._toolSwing;
        return true;
    }

    // one frame of the swing's animation; "hold" while the pose is held
    function stepToolSwing(swing) {
        const def = swingKind(swing._swingKind), opts = swing.opts;
        if (swing._waiting) {   // holding the pose until the action is over
            const cancelled = Input.isTriggered("cancel") || (!opts.keepOnMove && Input.dir4 !== 0);
            if (!cancelled && typeof opts.holdWhile === "function" && opts.holdWhile()) {
                swing._wait++;
                if (opts.onWait) opts.onWait(swing._wait);
                return "hold";
            }
            swing._waiting = false;
            swing._cancelled = cancelled;
            if (opts.onHoldEnd) opts.onHoldEnd(cancelled);
        }
        swing._swingT++;
        if (opts && opts.holdAt && swing._swingT === opts.holdAt && typeof opts.holdWhile === "function" && opts.holdWhile()) swing._waiting = true;   // waits before the impact
        if (swing._swingT === def.impact) {
            if (swing._cancelled) { this._toolSwing = null; if (this._swingEvent === swing) this._swingEvent = null; return; }   // aiming cancelled: no shot
            if (swing.onImpact) swing.onImpact();
            if (opts && !opts.holdAt && typeof opts.holdWhile === "function" && opts.holdWhile()) swing._waiting = true;
        }
        if (swing._swingT >= def.frames) {
            this._toolSwing = null;
            if (this._swingEvent === swing) this._swingEvent = null;
            if (swing.onDone) swing.onDone();
        }
    }

    // Held O at a tree, a bush, a log, a stump or a rock: a moment after each blow (sooner with Zręczność) the next one - for as long as
    // it is held and he stands where he stood; it stops when the thing falls or breaks, or he is too tired (the popup says so).
    const HOLD_PAUSE = 12;   // frames between two blows at the usual speed
    // a message or a menu (Q/E, a station) ends it; a running event only makes it wait a frame (the core's "calm" checks)
    const HOLD_STOP = { only: ["message", "farmMenu"] }, HOLD_WAIT = { only: ["event"] };
    function updateHoldStrike(p) {
        const h = p._holdStrike;
        if (!h || !(h.t > 0) || --h.t > 0) return;
        const e = h.map === $gameMap.mapId() ? $gameMap.event(h.id) : null;
        if (!e || !Input.isPressed("ok") || p.x !== h.x || p.y !== h.y || p.direction() !== h.d ||
            e._treeFallT >= 0 || e._breakT >= 0 || e._treeGone || !T.isCalm(null, HOLD_STOP)) { p._holdStrike = null; return; }
        if (e.isTreeAnimating() || !T.isCalm(null, HOLD_WAIT) || p.isMoving() || p._toolSwing || p._swingEvent) { h.t = 1; return; }   // (the shake, the event: a frame more)
        p._holdStrike = null;
        e.start();
    }

    // Real swing animation. Every kind of swing has a sheet in img/system (see
    // SWING_KINDS): 4 rows (down, left, right, up), one 96x96 cell per frame,
    // drawn from the same character. While it plays it replaces the walking
    // sprite, so the whole body swings the tool. Without a sheet the tool is
    // drawn over the normal sprite instead (below).
    const SHEET_CELL = 96;
    const SHEET_FEET = { x: 48, y: 80 };   // the point of a cell that stands on the tile
    const SHEET_ROW = { 2: 0, 4: 1, 6: 2, 8: 3 };
    // Which way the body steps toward the target (shorter up / down: the view is low top-down).
    const REACH_VECTOR = { 2: { x: 0, y: 0.7 }, 4: { x: -1, y: 0 }, 6: { x: 1, y: 0 }, 8: { x: 0, y: -0.7 } };

    // Frame to show t game frames into the swing: the wind-up is stretched so the
    // impact frame lands on the strike frame of the swing, then it is held
    // briefly and the recovery frames share the rest of the swing.
    function swingSheetFrame(kind, frames, row, t) {
        const def = swingKind(kind);
        const impact = Math.min(frames - 1, def.hit[row]);
        if (t < def.impact) return Math.floor(t / def.impact * impact);
        if (t < def.impact + def.hold) return impact;
        const after = frames - 1 - impact;
        const k = (t - def.impact - def.hold) / (def.frames - def.impact - def.hold);
        return Math.min(frames - 1, impact + 1 + Math.floor(k * after));
    }

    // 0..1: how far the body has stepped toward the target; full on the strike frame.
    function swingLunge(kind, t) {
        const def = swingKind(kind);
        if (t < def.impact) return easeInOut(clamp01(t / def.impact));
        return 1 - easeInOut(clamp01((t - def.impact - def.hold) / Math.max(1, def.frames - def.impact - def.hold)));
    }

    // "ready", "loading", or "none" when the swing has no sheet (or it failed to load).
    function swingSheetState(kind) {
        const def = SWING_KINDS[kind] ? swingKind(kind) : null;
        if (!def || !def.sheet) return "none";
        const bitmap = ImageManager.loadSystem(def.sheet);
        if (bitmap.isError && bitmap.isError()) return "none";
        return bitmap.isReady() ? "ready" : "loading";
    }

    // Draws the current swing frame in a child sprite anchored on the feet.
    // Returns true while a sheet is on screen (the walking sprite is hidden then).
    function updateSwingSheet() {
        const event = $gamePlayer._swingEvent;
        const kind = event && event._swingT >= 0 ? event._swingKind : undefined;
        if (kind === undefined || swingSheetState(kind) !== "ready") {
            if (this._swingBody) this._swingBody.visible = false;
            return false;
        }
        const def = swingKind(kind);
        const bitmap = ImageManager.loadSystem(def.sheet);
        if (bitmap.smooth) bitmap.smooth = false;
        if (!this._swingBody) {
            this._swingBody = new Sprite();
            this._swingBody.anchor.x = SHEET_FEET.x / SHEET_CELL;
            this._swingBody.anchor.y = SHEET_FEET.y / SHEET_CELL;
            this.addChild(this._swingBody);
        }
        const frames = Math.max(1, Math.floor(bitmap.width / SHEET_CELL));
        const dir = $gamePlayer.direction();
        const row = SHEET_ROW[dir] || 0;
        const reach = REACH_VECTOR[dir] || REACH_VECTOR[2];
        const lunge = def.reach * swingLunge(kind, event._swingT);
        const body = this._swingBody;
        body.bitmap = bitmap;
        let col = swingSheetFrame(kind, frames, row, event._swingT);
        // while it waits the figure shifts a little between two poses - unless opts.still (resting on the ground: sits quite still, hands folded)
        if (event._waiting && !(event.opts && event.opts.still)) col -= Math.floor(event._wait / ((event.opts && event.opts.wobble) || 22)) % 2;
        body.setFrame(col * SHEET_CELL, row * SHEET_CELL, SHEET_CELL, SHEET_CELL);
        body.x = reach.x * lunge;
        body.y = reach.y * lunge - ((event.opts && event.opts.lift) || 0);
        body.visible = true;
        return true;
    }

    // Fallback without a sheet. Where the tool is held for each facing (relative
    // to the feet), which way it is mirrored, and the direction the body leans
    // into the blow.
    const HAND = {
        2: { x: 9, y: -25, sign: 1, ax: 0, ay: 1 },
        4: { x: -6, y: -26, sign: -1, ax: -1, ay: 0 },
        6: { x: 6, y: -26, sign: 1, ax: 1, ay: 0 },
        8: { x: -9, y: -27, sign: -1, ax: 0, ay: -1 }
    };
    const LUNGE_PIXELS = 3;
    const VERTICAL_FORESHORTEN = 0.65;   // swings toward / away from the camera look shorter

    // The tool the player is swinging: a child sprite that rotates about the
    // grip, while the whole figure leans a few pixels into the strike.
    function updateToolSwing() {
        const event = $gamePlayer._swingEvent;
        const def = swingKind(event && event._swingKind);
        const active = !!event && event._swingT >= 0 && event._swingKind !== undefined && def.tool >= 0 &&
            swingSheetState(event._swingKind) === "none";
        if (!active) {
            if (this._toolSprite) this._toolSprite.visible = false;
            return;
        }
        if (!this._toolSprite) {
            this._toolSprite = new Sprite(ImageManager.loadSystem("Tools"));
            this._toolSprite.anchor.x = TOOL_PIVOT.x / TOOL_SIZE;
            this._toolSprite.anchor.y = TOOL_PIVOT.y / TOOL_SIZE;
            this.addChild(this._toolSprite);
        }
        const tool = this._toolSprite;
        const pose = swingPose(Math.min(1, event._swingT / def.frames), def.tool);
        const hand = HAND[$gamePlayer.direction()] || HAND[2];
        const vertical = hand.ax === 0;
        tool.visible = true;
        tool.setFrame(def.tool * TOOL_SIZE, 0, TOOL_SIZE, TOOL_SIZE);
        tool.x = hand.x;
        tool.y = hand.y;
        tool.scale.x = hand.sign;
        tool.rotation = hand.sign * pose.angle * (vertical ? VERTICAL_FORESHORTEN : 1);
        this.x += hand.ax * LUNGE_PIXELS * pose.lunge;
        this.y += hand.ay * LUNGE_PIXELS * 0.7 * pose.lunge;
    }

    P.swing = { HOLD_PAUSE, SHEET_CELL, SHEET_FEET, SHEET_ROW, REACH_VECTOR, HAND, startToolSwing, stepToolSwing, updateHoldStrike, swingPose,
        swingSheetFrame, swingLunge, swingSheetState, updateSwingSheet, updateToolSwing };
})();
