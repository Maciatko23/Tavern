//=============================================================================
// TavernDice_Art.js
//=============================================================================
// The dice game's pictures (split out of TavernDice.js, 2026-09-29): the dice painted as ivory (ebony, stone, pear-wood...) cubes, the
// leather cup, the coins and the pot, the candles, the table with its green felt; the dice, cup, bubble, floating-word and spark
// sprites; the table's sounds (through the core's safe pool); the HUD (the top bar, the two players' plates, the buttons, the key
// hints, the words on the felt) and the panels over the table (the lobby, the rules, leaving, the end of a game) - drawn for
// TavernDice_Scene.js.

/*:
 * @target MZ
 * @plugindesc Rysunki gry w kości (TavernDice.js): kości, kubek, monety, stół z suknem, świece, dymki, pasek i panele stołu (lobby, zasady, koniec partii). Sama nic nie robi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
 * @base TavernDice
 * @orderAfter TavernDice
 *
 * @help
 * ============================================================================
 * TavernDice_Art.js - rysunki gry w kości
 * ============================================================================
 * Część TavernDice.js (wydzielona z niego): jak wygląda stół do kości i to,
 * co na nim. Sama nic nie robi - rysuje dla TavernDice_Scene.js. Parametry ma
 * TavernDice.js.
 *
 * KOLEJNOŚĆ: TavernDice_Data, TavernDice, TavernDice_Art, TavernDice_Scene.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;
    if (!TW || !TW.ui || !TW.ui.Scene_MiniGame) throw new Error("TavernDice_Art.js: brak TawernaCore.js / TawernaUI.js - muszą być wyżej na liście wtyczek (the Tawerna core or UI kit is missing)");
    const ui = TW.ui;
    const P = TW.api("TavernDice_parts") || TW.register("TavernDice_parts", {});
    if (P.art) return;   // (put into the page twice: kept as it was)
    if (!P.core || !P.data) throw new Error("TavernDice_Art.js: musi być pod TavernDice.js i TavernDice_Data.js na liście wtyczek (one of them is missing or below)");
    const { TARGET, QUICK_STAKE, gold, score, store, dayNow, hourNow, vsOf, ownedCount, heroSet, targetFor } = P.core;
    const { DIE_TYPES, SPECIAL_ORDER, OPPONENTS, OPP_ORDER } = P.data;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const easeInOut = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    const easeBack = t => { t = clamp(t, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

    // ==================================================================
    // Style and drawing: TawernaUI's (the game's black + bright yellow; the key caps, the buttons - drawn from this table's own once)
    // ==================================================================
    const ST = ui.style;
    const GOOD = "#8ee08a", BAD = "#ff7b6b", GOLD_TXT = "#ffe27a", FELT_GOLD = "rgba(222,184,98,";
    const COIN_ICON = ui.COIN_ICON;
    const dirty = ui.dirty, panel = ui.panel, bar = ui.bar, txt = ui.text, measure = ui.measure, wrapLines = ui.wrap, icon = ui.icon, keyHints = ui.keyHints, drawButton = ui.button;
    // a small solid triangle (the stake's arrows)
    function tri(ctx, dir, cx, cy, s, colour) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir] || 0);
        ctx.beginPath(); ctx.moveTo(s * 0.45, 0); ctx.lineTo(-s * 0.35, -s * 0.5); ctx.lineTo(-s * 0.35, s * 0.5); ctx.closePath();
        ctx.fillStyle = colour; ctx.fill();
        ctx.restore();
    }
    // a rounded rectangle path
    function rr(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    // a soft (blurred) shape: the canvas blur filter where there is one, else a few widening passes
    function soft(ctx, blur, draw) {
        if ("filter" in ctx) {
            ctx.save(); ctx.filter = "blur(" + blur + "px)"; draw(ctx, 0); ctx.restore();
        } else {
            for (let i = 4; i >= 1; i--) { ctx.save(); ctx.globalAlpha = 0.25; draw(ctx, blur * i / 4); ctx.restore(); }
        }
    }
    function smoothBitmap(w, h) { const b = new Bitmap(w, h); b.smooth = true; return b; }
    function solidBitmap(colour) { const b = new Bitmap(4, 4); b.fillAll(colour); return b; }

    // ==================================================================
    // The dice, drawn: an ivory (or ebony, stone, pear wood...) rounded cube seen from above with engraved pips
    // ==================================================================
    const LOOKS = {
        std: { c0: "#fffaf0", c1: "#f0e6cc", c2: "#d2c29d", edge: "rgba(120,96,60,0.30)", line: "rgba(66,48,28,0.6)", hi: "rgba(255,255,255,0.9)",
            lo: "rgba(110,86,52,0.45)", pip0: "#1b120a", pip1: "#5e4533", rim: "rgba(255,255,255,0.65)" },
        szczesciarz: { c0: "#fff5d6", c1: "#f3d78f", c2: "#c69743", edge: "rgba(140,96,30,0.32)", line: "rgba(118,78,18,0.8)", hi: "rgba(255,250,222,0.95)",
            lo: "rgba(130,90,30,0.5)", pip0: "#281809", pip1: "#6a4c2d", rim: "rgba(255,250,225,0.7)", red: ["#7a0d08", "#e2463b"], gild: true },
        wdowa: { c0: "#4c4855", c1: "#28252e", c2: "#0e0d11", edge: "rgba(0,0,0,0.45)", line: "rgba(0,0,0,0.9)", hi: "rgba(214,204,244,0.6)",
            lo: "rgba(0,0,0,0.6)", pip0: "#aaa4bb", pip1: "#ffffff", rim: "rgba(0,0,0,0.6)", light: true },
        krucze: { c0: "#6f7680", c1: "#444a53", c2: "#22262c", edge: "rgba(0,0,0,0.42)", line: "rgba(8,10,14,0.9)", hi: "rgba(222,232,242,0.5)",
            lo: "rgba(0,0,0,0.55)", pip0: "#a1acb7", pip1: "#eef3f7", rim: "rgba(0,0,0,0.55)", light: true, speckle: true, raven: true },
        grusza: { c0: "#f2c993", c1: "#d69f60", c2: "#a36731", edge: "rgba(90,45,10,0.35)", line: "rgba(76,38,10,0.75)", hi: "rgba(255,238,204,0.75)",
            lo: "rgba(90,45,10,0.5)", pip0: "#29160a", pip1: "#61401f", rim: "rgba(255,232,196,0.6)", grain: true }
    };
    const PIP_AT = (() => {
        const a = 0.27, m = 0.5, z = 0.73;
        return { 1: [[m, m]], 2: [[z, a], [a, z]], 3: [[z, a], [m, m], [a, z]], 4: [[a, a], [z, a], [a, z], [z, z]], 5: [[a, a], [z, a], [m, m], [a, z], [z, z]], 6: [[a, a], [z, a], [a, m], [z, m], [a, z], [z, z]] };
    })();
    function pip(ctx, x, y, r, L, red) {
        const off = L.light ? -r * 0.16 : r * 0.16;
        ctx.beginPath(); ctx.arc(x + off, y + off, r * 1.12, 0, Math.PI * 2); ctx.fillStyle = L.rim; ctx.fill();   // the pit's lit (or dark) edge
        const inner = red ? red[1] : L.pip1, outer = red ? red[0] : L.pip0, k = L.light ? -0.3 : 0.34;
        const g = ctx.createRadialGradient(x + r * k, y + r * k, r * 0.05, x, y, r);
        g.addColorStop(0, inner); g.addColorStop(1, outer);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    }
    // the raven of the Krucze Skały die (in place of the one), in a box of size s centred on (x, y)
    function raven(ctx, x, y, s, L) {
        const draw = (dx, dy, colour) => {
            ctx.save();
            ctx.translate(x + dx, y + dy); ctx.scale(s, s);
            ctx.fillStyle = colour; ctx.strokeStyle = colour; ctx.lineCap = "round";
            ctx.beginPath(); ctx.ellipse(-0.02, 0.05, 0.25, 0.14, -0.35, 0, Math.PI * 2); ctx.fill();          // body
            ctx.beginPath(); ctx.arc(0.2, -0.1, 0.09, 0, Math.PI * 2); ctx.fill();                              // head
            ctx.beginPath(); ctx.moveTo(0.26, -0.14); ctx.lineTo(0.42, -0.085); ctx.lineTo(0.26, -0.055); ctx.closePath(); ctx.fill();   // beak
            ctx.beginPath(); ctx.moveTo(-0.2, 0.1); ctx.lineTo(-0.44, 0.22); ctx.lineTo(-0.41, 0.09); ctx.lineTo(-0.19, 0.0); ctx.closePath(); ctx.fill();   // tail
            ctx.lineWidth = 0.035;
            ctx.beginPath(); ctx.moveTo(-0.02, 0.17); ctx.lineTo(-0.05, 0.29); ctx.moveTo(0.07, 0.16); ctx.lineTo(0.08, 0.29); ctx.stroke();   // legs
            ctx.restore();
        };
        draw(-s * 0.03, -s * 0.03, "rgba(0,0,0,0.6)");
        draw(0, 0, L.pip1);
        ctx.beginPath(); ctx.arc(x + s * 0.22, y - s * 0.11, s * 0.022, 0, Math.PI * 2); ctx.fillStyle = "#2a2e34"; ctx.fill();   // the eye
    }
    // a die of type with face up in a square of side S at (x, y) (px of ctx)
    function paintDie(ctx, x, y, S, face, type) {
        const L = LOOKS[type] || LOOKS.std, r = S * 0.2;
        ctx.save();
        rr(ctx, x, y, S, S, r);
        const g = ctx.createLinearGradient(x, y, x + S, y + S);
        g.addColorStop(0, L.c0); g.addColorStop(0.55, L.c1); g.addColorStop(1, L.c2);
        ctx.fillStyle = g; ctx.fill();
        ctx.save();
        rr(ctx, x, y, S, S, r); ctx.clip();
        if (L.grain) {   // pear wood: soft wavy grain
            for (let i = 0; i < 9; i++) {
                const yy = y + S * (0.08 + i * 0.105);
                ctx.beginPath(); ctx.moveTo(x, yy);
                ctx.bezierCurveTo(x + S * 0.3, yy + S * 0.04 * ((i % 3) - 1), x + S * 0.6, yy - S * 0.05, x + S, yy + S * 0.02);
                ctx.strokeStyle = i % 2 ? "rgba(120,62,18,0.22)" : "rgba(255,226,180,0.18)"; ctx.lineWidth = S * 0.018; ctx.stroke();
            }
        }
        if (L.speckle) {   // stone: specks
            let seed = 7;
            const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
            for (let i = 0; i < 70; i++) {
                ctx.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.16)";
                ctx.fillRect(x + rnd() * S, y + rnd() * S, S * 0.018, S * 0.018);
            }
        }
        const rg = ctx.createRadialGradient(x + S * 0.36, y + S * 0.32, S * 0.08, x + S * 0.5, y + S * 0.5, S * 0.78);
        rg.addColorStop(0, "rgba(255,255,255,0.16)"); rg.addColorStop(0.55, "rgba(255,255,255,0)"); rg.addColorStop(1, L.edge);
        ctx.fillStyle = rg; ctx.fillRect(x, y, S, S);
        ctx.restore();
        // the bevel: light on the upper-left rim, shade on the lower-right
        const bw = Math.max(1, S * 0.035);
        const bg = ctx.createLinearGradient(x, y, x + S, y + S);
        bg.addColorStop(0, L.hi); bg.addColorStop(0.45, "rgba(255,255,255,0)"); bg.addColorStop(0.6, "rgba(0,0,0,0)"); bg.addColorStop(1, L.lo);
        rr(ctx, x + bw, y + bw, S - bw * 2, S - bw * 2, r * 0.85);
        ctx.strokeStyle = bg; ctx.lineWidth = bw * 1.6; ctx.stroke();
        if (L.gild) { rr(ctx, x + bw * 2.4, y + bw * 2.4, S - bw * 4.8, S - bw * 4.8, r * 0.7); ctx.strokeStyle = "rgba(176,120,30,0.55)"; ctx.lineWidth = Math.max(1, S * 0.012); ctx.stroke(); }
        rr(ctx, x + 0.5, y + 0.5, S - 1, S - 1, r);
        ctx.strokeStyle = L.line; ctx.lineWidth = Math.max(1, S * 0.018); ctx.stroke();
        // the face
        if (face === 1 && L.raven) raven(ctx, x + S / 2, y + S / 2, S * 0.62, L);
        else {
            const pr = S * (face === 1 ? 0.118 : 0.085);
            for (const [px, py] of PIP_AT[face] || []) pip(ctx, x + px * S, y + py * S, pr, L, face === 1 && L.red ? L.red : null);
        }
        ctx.restore();
    }
    const TEX = { die: {}, misc: {} };
    const DIE_T = 128, DIE_S = 112, DIE_SCALE = 0.54;   // texture px, the body in it; on the table 112 * 0.54 = 60 px
    function dieBitmap(type, face) {
        const key = (LOOKS[type] ? type : "std") + ":" + face;
        if (TEX.die[key]) return TEX.die[key];
        const b = smoothBitmap(DIE_T, DIE_T), o = (DIE_T - DIE_S) / 2;
        paintDie(b.context, o, o, DIE_S, face, type);
        dirty(b);
        return (TEX.die[key] = b);
    }
    function miscBitmap(key, w, h, draw) {
        if (TEX.misc[key]) return TEX.misc[key];
        const b = smoothBitmap(w, h);
        draw(b.context, w, h, b);
        dirty(b);
        return (TEX.misc[key] = b);
    }
    // the die's soft shadow (the same scale as the die)
    const dieShadow = () => miscBitmap("dieShadow", 176, 176, ctx => soft(ctx, 9, (c, g) => { rr(c, 32 - g, 34 - g, DIE_S + g * 2, DIE_S + g * 2, 24); c.fillStyle = "rgba(0,0,0,0.62)"; c.fill(); }));
    // the yellow glow of a chosen die (added light)
    const dieGlow = () => miscBitmap("dieGlow", 184, 184, ctx => {
        ctx.save(); ctx.shadowColor = "rgba(255,210,63,1)"; ctx.shadowBlur = 22;
        rr(ctx, 36, 36, DIE_S, DIE_S, 24); ctx.strokeStyle = "rgba(255,214,80,0.95)"; ctx.lineWidth = 8; ctx.stroke();
        ctx.stroke(); ctx.restore();
    });
    // the keyboard's corner brackets round a die (screen px)
    const focusBitmap = () => miscBitmap("focus", 92, 92, ctx => {
        const a = 6, b = 86, L = 16;
        const corners = c => {
            c.beginPath();
            c.moveTo(a, a + L); c.lineTo(a, a); c.lineTo(a + L, a);
            c.moveTo(b - L, a); c.lineTo(b, a); c.lineTo(b, a + L);
            c.moveTo(b, b - L); c.lineTo(b, b); c.lineTo(b - L, b);
            c.moveTo(a + L, b); c.lineTo(a, b); c.lineTo(a, b - L);
        };
        ctx.lineCap = "square";
        corners(ctx); ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineWidth = 6; ctx.stroke();
        corners(ctx); ctx.strokeStyle = ST().accent; ctx.lineWidth = 3; ctx.stroke();
    });

    // ==================================================================
    // The leather cup (three-quarter view), its shadow; the coins, the pot; the candles
    // ==================================================================
    const CUP_W = 200, CUP_H = 236;
    function paintCup(ctx) {
        const cx = CUP_W / 2, top = 40, bot = 206, trx = 72, brx = 84, ery = 22;
        const body = () => {
            ctx.beginPath();
            ctx.moveTo(cx - trx, top); ctx.lineTo(cx - brx, bot);
            ctx.ellipse(cx, bot, brx, ery * 1.05, 0, Math.PI, 0, true);
            ctx.lineTo(cx + trx, top);
            ctx.ellipse(cx, top, trx, ery, 0, 0, Math.PI, false);
            ctx.closePath();
        };
        body();
        const g = ctx.createLinearGradient(cx - brx, 0, cx + brx, 0);
        g.addColorStop(0, "#2a1509"); g.addColorStop(0.16, "#5b331a"); g.addColorStop(0.36, "#94603a"); g.addColorStop(0.5, "#7d4a28");
        g.addColorStop(0.78, "#4a2812"); g.addColorStop(1, "#200f06");
        ctx.fillStyle = g; ctx.fill();
        ctx.save();
        body(); ctx.clip();
        let seed = 11;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 420; i++) {   // the leather's grain
            ctx.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,0.13)" : "rgba(255,210,160,0.06)";
            ctx.fillRect(cx - brx + rnd() * brx * 2, top + rnd() * (bot - top + 20), 1 + rnd() * 2.5, 1 + rnd() * 1.5);
        }
        for (const k of [-0.55, 0, 0.55]) {   // tooled grooves
            ctx.beginPath(); ctx.moveTo(cx + k * trx, top + 34); ctx.lineTo(cx + k * brx * 0.98, bot - 30);
            ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + k * trx + 2.5, top + 34); ctx.lineTo(cx + k * brx * 0.98 + 2.5, bot - 30);
            ctx.strokeStyle = "rgba(255,214,170,0.08)"; ctx.lineWidth = 1.5; ctx.stroke();
        }
        // the bands at the lip and at the base, with stitches
        const band = (y, rx, w) => {
            ctx.beginPath(); ctx.ellipse(cx, y, rx, ery, 0, 0.02, Math.PI - 0.02); ctx.strokeStyle = "rgba(38,18,8,0.9)"; ctx.lineWidth = w; ctx.stroke();
            ctx.beginPath(); ctx.ellipse(cx, y - w / 2 + 1, rx, ery, 0, 0.05, Math.PI - 0.05); ctx.strokeStyle = "rgba(255,214,170,0.14)"; ctx.lineWidth = 1.5; ctx.stroke();
            for (const d of [-w / 2 + 4, w / 2 - 4]) {
                ctx.save(); ctx.setLineDash([7, 6]);
                ctx.beginPath(); ctx.ellipse(cx, y + d, rx, ery, 0, 0.12, Math.PI - 0.12); ctx.strokeStyle = "rgba(236,212,166,0.85)"; ctx.lineWidth = 2; ctx.stroke();
                ctx.restore();
            }
        };
        band(top + 22, trx + 1.5, 20);
        band(bot - 22, brx - 1.5, 18);
        // the light down the left side
        const sh = ctx.createLinearGradient(cx - brx, 0, cx, 0);
        sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.55, "rgba(255,236,210,0.12)"); sh.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sh; ctx.fillRect(cx - brx, top, brx, bot - top + 30);
        ctx.restore();
        // the brass boss
        const bx = cx - 8, by = (top + bot) / 2 + 6;
        ctx.beginPath(); ctx.arc(bx + 1.5, by + 2, 17, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fill();
        const bg = ctx.createRadialGradient(bx - 6, by - 6, 2, bx, by, 17);
        bg.addColorStop(0, "#fff3c0"); bg.addColorStop(0.45, "#e0ac3e"); bg.addColorStop(1, "#7a5212");
        ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
        ctx.strokeStyle = "rgba(60,36,6,0.9)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(bx, by, 10.5, 0, Math.PI * 2); ctx.strokeStyle = "rgba(90,58,10,0.65)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); ctx.translate(bx, by);   // a small engraved die on it
        ctx.strokeStyle = "rgba(80,50,8,0.85)"; ctx.lineWidth = 1.6; rr(ctx, -5.5, -5.5, 11, 11, 2.5); ctx.stroke();
        ctx.fillStyle = "rgba(80,50,8,0.9)";
        for (const [px, py] of [[-2.4, -2.4], [0, 0], [2.4, 2.4]]) { ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        // the mouth: the rolled lip and the dark inside
        ctx.beginPath(); ctx.ellipse(cx, top, trx - 5, ery - 4, 0, 0, Math.PI * 2);
        const ig = ctx.createLinearGradient(0, top - ery, 0, top + ery);
        ig.addColorStop(0, "#3b2213"); ig.addColorStop(0.55, "#120904"); ig.addColorStop(1, "#070302");
        ctx.fillStyle = ig; ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, top, trx - 2, ery - 1.5, 0, 0, Math.PI * 2);
        const lg = ctx.createLinearGradient(0, top - ery, 0, top + ery);
        lg.addColorStop(0, "#4a2a15"); lg.addColorStop(0.5, "#6e4324"); lg.addColorStop(1, "#b07a4a");
        ctx.strokeStyle = lg; ctx.lineWidth = 7; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, top + 1, trx - 2, ery - 1.5, 0, 0.15, Math.PI - 0.15); ctx.strokeStyle = "rgba(255,226,190,0.35)"; ctx.lineWidth = 1.5; ctx.stroke();
        // the outline
        body(); ctx.strokeStyle = "rgba(16,8,3,0.75)"; ctx.lineWidth = 2; ctx.stroke();
    }
    const cupBitmap = () => miscBitmap("cup", CUP_W, CUP_H, paintCup);
    const cupShadow = () => miscBitmap("cupShadow", 240, 90, ctx => soft(ctx, 10, (c, g) => { c.beginPath(); c.ellipse(120, 45, 88 + g, 24 + g * 0.4, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.55)"; c.fill(); }));

    // a coin lying flat (seen from above, a little tilted): 2x texture 52 x 38
    function paintCoin(ctx, x, y, s) {
        const rx = 22 * s, ry = 14 * s, th = 5 * s;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - rx, y); ctx.lineTo(x - rx, y + th);
        ctx.ellipse(x, y + th, rx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(x + rx, y);
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI, false);
        ctx.closePath();
        const sg = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
        sg.addColorStop(0, "#6a4510"); sg.addColorStop(0.4, "#b98722"); sg.addColorStop(1, "#5a3a0c");
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = "rgba(50,30,4,0.7)"; ctx.lineWidth = 1.2 * s; ctx.stroke();
        const g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.45, 1, x, y, rx);
        g.addColorStop(0, "#fff6c4"); g.addColorStop(0.4, "#f2c64c"); g.addColorStop(1, "#b07c16");
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = "rgba(96,62,6,0.85)"; ctx.lineWidth = 1.2 * s; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2); ctx.strokeStyle = "rgba(140,96,18,0.55)"; ctx.lineWidth = 1.4 * s; ctx.stroke();
        // a star struck in the middle
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = (i % 2 ? 0.2 : 0.46) * rx * 0.62;
            const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * (ry / rx);
            if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fillStyle = "rgba(150,100,16,0.55)"; ctx.fill();
        ctx.restore();
    }
    const coinBitmap = () => miscBitmap("coin", 56, 44, ctx => paintCoin(ctx, 28, 18, 1));
    // the pot: n coins in little stacks plus a couple lying about (2x texture, 240 x 180, the base centred at 120, 150)
    function potBitmap(n) {
        const key = "pot" + n;
        if (TEX.misc[key]) return TEX.misc[key];
        const b = smoothBitmap(240, 180), ctx = b.context;
        soft(ctx, 8, (c, g) => { c.beginPath(); c.ellipse(120, 150, 92 + g, 24 + g * 0.4, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.45)"; c.fill(); });
        const k = n <= 0 ? 0 : n <= 6 ? 1 : n <= 12 ? 2 : n <= 20 ? 3 : 4, total = Math.min(n, 32), stacks = [];
        for (let i = 0; i < k; i++) stacks.push(Math.floor(total / k) + (i < total % k ? 1 : 0));
        const spots = [[120, 138], [82, 146], [158, 146], [112, 162]];
        // loose coins lying at the foot
        if (n >= 4) { paintCoin(ctx, 58, 160, 0.95); paintCoin(ctx, 186, 158, 0.95); }
        const order = stacks.map((h, i) => ({ h, x: spots[i][0], y: spots[i][1] })).sort((a, c) => a.y - c.y);
        for (const s of order) for (let k = 0; k < s.h; k++) paintCoin(ctx, s.x + ((k * 5) % 3) - 1, s.y - k * 8, 1);
        dirty(b);
        return (TEX.misc[key] = b);
    }
    // a candle on a brass dish (2x texture 64 x 120, the dish's middle at 32, 104); the flame is a sprite of its own
    const candleBitmap = () => miscBitmap("candle", 64, 120, ctx => {
        soft(ctx, 4, (c, g) => { c.beginPath(); c.ellipse(34, 108, 28 + g, 9 + g * 0.3, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.5)"; c.fill(); });
        const dg = ctx.createLinearGradient(4, 0, 60, 0);
        dg.addColorStop(0, "#6b4a12"); dg.addColorStop(0.35, "#f4d27a"); dg.addColorStop(0.6, "#c99a36"); dg.addColorStop(1, "#5e3f0c");
        ctx.beginPath(); ctx.ellipse(32, 104, 28, 10, 0, 0, Math.PI * 2); ctx.fillStyle = dg; ctx.fill();
        ctx.strokeStyle = "rgba(60,38,6,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(32, 102, 20, 6.5, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(90,60,10,0.55)"; ctx.fill();
        const wg = ctx.createLinearGradient(20, 0, 44, 0);
        wg.addColorStop(0, "#c9b27a"); wg.addColorStop(0.35, "#fff6dc"); wg.addColorStop(1, "#b9a169");
        ctx.beginPath(); ctx.moveTo(20, 46); ctx.lineTo(20, 100); ctx.ellipse(32, 100, 12, 4, 0, Math.PI, 0, true); ctx.lineTo(44, 46); ctx.closePath();
        ctx.fillStyle = wg; ctx.fill();
        ctx.beginPath(); ctx.moveTo(38, 48); ctx.quadraticCurveTo(41, 60, 39, 66); ctx.quadraticCurveTo(37, 70, 36, 62); ctx.closePath();   // a drip
        ctx.fillStyle = "rgba(255,248,226,0.9)"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(32, 46, 12, 4, 0, 0, Math.PI * 2); ctx.fillStyle = "#fff3d0"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(32, 46.5, 6, 2, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(220,190,120,0.8)"; ctx.fill();
        ctx.beginPath(); ctx.moveTo(32, 46); ctx.lineTo(32, 38); ctx.strokeStyle = "#241a12"; ctx.lineWidth = 2; ctx.stroke();
    });
    const flameBitmap = () => miscBitmap("flame", 40, 64, ctx => {
        const g = ctx.createRadialGradient(20, 44, 1, 20, 40, 26);
        g.addColorStop(0, "rgba(255,255,236,1)"); g.addColorStop(0.3, "rgba(255,226,120,0.95)"); g.addColorStop(0.65, "rgba(255,140,40,0.6)"); g.addColorStop(1, "rgba(255,90,20,0)");
        ctx.beginPath(); ctx.moveTo(20, 4); ctx.bezierCurveTo(28, 22, 34, 34, 32, 46); ctx.bezierCurveTo(30, 58, 10, 58, 8, 46); ctx.bezierCurveTo(6, 34, 12, 22, 20, 4); ctx.closePath();
        ctx.fillStyle = g; ctx.fill();
    });
    const glowBitmap = () => miscBitmap("glow", 256, 256, ctx => {
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, "rgba(255,190,110,0.55)"); g.addColorStop(0.35, "rgba(255,150,70,0.22)"); g.addColorStop(1, "rgba(255,120,40,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    });
    const sparkBitmap = () => miscBitmap("spark", 16, 16, ctx => {
        const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        g.addColorStop(0, "rgba(255,250,210,1)"); g.addColorStop(0.4, "rgba(255,190,80,0.9)"); g.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
    });
    const moteBitmap = () => miscBitmap("mote", 8, 8, ctx => {
        const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
        g.addColorStop(0, "rgba(255,226,170,0.9)"); g.addColorStop(1, "rgba(255,190,110,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 8);
    });
    const dustBitmap = () => miscBitmap("dust", 10, 10, ctx => {
        const g = ctx.createRadialGradient(5, 5, 0, 5, 5, 5);
        g.addColorStop(0, "rgba(190,210,170,0.55)"); g.addColorStop(1, "rgba(190,210,170,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 10, 10);
    });

    // ==================================================================
    // The table: dark wood boards round a green felt, brass corners, a gold line, the circle of the pot
    // ==================================================================
    const TBL = { x: 262, y: 62, w: 756, h: 550 }, RIM = 24;
    const FELT = { x: TBL.x + RIM, y: TBL.y + RIM, w: TBL.w - RIM * 2, h: TBL.h - RIM * 2 };
    const COL_W = 84;   // the columns of set-aside dice at both ends of the felt
    const ZONE = { x: FELT.x + COL_W + 10, y: FELT.y + 18, w: FELT.w - (COL_W + 10) * 2, h: FELT.h - 70 };   // where the dice land
    const POT = { x: FELT.x + FELT.w / 2, y: FELT.y + FELT.h / 2 - 16 };
    const HERO_COL = FELT.x + COL_W / 2 + 4, OPP_COL = FELT.x + FELT.w - COL_W / 2 - 4;
    // words printed along an ellipse (centred on the angle mid; under: read along the bottom, left to right)
    function arcWords(ctx, text, cx, cy, rx, ry, mid, colour, size, under) {
        ctx.save();
        ctx.font = "bold " + size + "px " + ($gameSystem && $gameSystem.mainFontFace ? $gameSystem.mainFontFace() : "sans-serif");
        ctx.fillStyle = colour; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const chars = Array.from(text), widths = chars.map(c => ctx.measureText(c).width + size * 0.18);
        const total = widths.reduce((a, w) => a + w, 0), r = (rx + ry) / 2;
        let a = mid - (under ? -1 : 1) * total / r / 2;
        chars.forEach((c, i) => {
            const step = widths[i] / r, at = a + (under ? -1 : 1) * step / 2;
            ctx.save();
            ctx.translate(cx + Math.cos(at) * rx, cy + Math.sin(at) * ry);
            ctx.rotate(at + (under ? -Math.PI / 2 : Math.PI / 2));
            ctx.fillText(c, 0, 0);
            ctx.restore();
            a += (under ? -1 : 1) * step;
        });
        ctx.restore();
    }
    function paintTable(b) {
        const ctx = b.context, ox = TBL.x - 30, oy = TBL.y - 24;   // (the bitmap starts here on the screen)
        const X = TBL.x - ox, Y = TBL.y - oy, W = TBL.w, H = TBL.h;
        soft(ctx, 16, (c, g) => { rr(c, X + 4 - g, Y + 14 - g, W + g * 2, H + g * 2, 26); c.fillStyle = "rgba(0,0,0,0.7)"; c.fill(); });
        // the four boards (mitred), each with its own grain
        let seed = 29;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const outer = () => rr(ctx, X, Y, W, H, 20);
        const fx = X + RIM, fy = Y + RIM, fw = W - RIM * 2, fh = H - RIM * 2;
        const boards = [
            { pts: [[X, Y], [X + W, Y], [fx + fw, fy], [fx, fy]], horiz: true, light: 1.12 },
            { pts: [[fx, fy + fh], [fx + fw, fy + fh], [X + W, Y + H], [X, Y + H]], horiz: true, light: 0.82 },
            { pts: [[X, Y], [fx, fy], [fx, fy + fh], [X, Y + H]], horiz: false, light: 1.0 },
            { pts: [[fx + fw, fy], [X + W, Y], [X + W, Y + H], [fx + fw, fy + fh]], horiz: false, light: 0.9 }
        ];
        const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => clamp(Math.round(v * k), 0, 255); return "rgb(" + f(n >> 16) + "," + f((n >> 8) & 255) + "," + f(n & 255) + ")"; };
        for (const bd of boards) {
            ctx.save();
            outer(); ctx.clip();
            ctx.beginPath(); bd.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.clip();
            const gr = bd.horiz ? ctx.createLinearGradient(0, bd.pts[0][1], 0, bd.pts[3][1]) : ctx.createLinearGradient(bd.pts[0][0], 0, bd.pts[1][0], 0);
            gr.addColorStop(0, shade("#5a361e", bd.light)); gr.addColorStop(0.5, shade("#462914", bd.light)); gr.addColorStop(1, shade("#2f1a0c", bd.light));
            ctx.fillStyle = gr; ctx.fillRect(X, Y, W, H);
            for (let i = 0; i < (bd.horiz ? 70 : 90); i++) {   // the grain along the board
                const dark = rnd() < 0.6, a = 0.05 + rnd() * 0.16;
                ctx.strokeStyle = dark ? "rgba(18,8,2," + a + ")" : "rgba(150,98,58," + a * 0.8 + ")";
                ctx.lineWidth = 0.6 + rnd() * 1.4;
                ctx.beginPath();
                if (bd.horiz) {
                    const y0 = Math.min(bd.pts[0][1], bd.pts[3][1]) + rnd() * RIM, amp = (rnd() - 0.5) * 3;
                    ctx.moveTo(X, y0); ctx.bezierCurveTo(X + W * 0.3, y0 + amp, X + W * 0.7, y0 - amp, X + W, y0 + amp * 0.5);
                } else {
                    const x0 = Math.min(bd.pts[0][0], bd.pts[1][0]) + rnd() * RIM, amp = (rnd() - 0.5) * 3;
                    ctx.moveTo(x0, Y); ctx.bezierCurveTo(x0 + amp, Y + H * 0.3, x0 - amp, Y + H * 0.7, x0 + amp * 0.5, Y + H);
                }
                ctx.stroke();
            }
            ctx.restore();
        }
        // mitre joints, the outer bevel, the lip round the felt
        ctx.save(); outer(); ctx.clip();
        ctx.strokeStyle = "rgba(10,4,0,0.6)"; ctx.lineWidth = 1.5;
        for (const [a, c] of [[[X, Y], [fx, fy]], [[X + W, Y], [fx + fw, fy]], [[X, Y + H], [fx, fy + fh]], [[X + W, Y + H], [fx + fw, fy + fh]]]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
        ctx.restore();
        rr(ctx, X + 1, Y + 1, W - 2, H - 2, 19); ctx.strokeStyle = "rgba(255,214,170,0.16)"; ctx.lineWidth = 2; ctx.stroke();
        rr(ctx, X + 0.5, Y + 0.5, W - 1, H - 1, 20); ctx.strokeStyle = "rgba(8,3,0,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
        // brass corners
        for (const [cx0, cy0, sx, sy] of [[X, Y, 1, 1], [X + W, Y, -1, 1], [X, Y + H, 1, -1], [X + W, Y + H, -1, -1]]) {
            ctx.save(); ctx.translate(cx0, cy0); ctx.scale(sx, sy);
            ctx.beginPath(); ctx.moveTo(6, 3); ctx.lineTo(40, 3); ctx.lineTo(40, 11); ctx.lineTo(11, 11); ctx.lineTo(11, 40); ctx.lineTo(3, 40); ctx.lineTo(3, 6); ctx.quadraticCurveTo(3, 3, 6, 3); ctx.closePath();
            const bg = ctx.createLinearGradient(0, 0, 40, 40);
            bg.addColorStop(0, "#fbe39a"); bg.addColorStop(0.4, "#c9973a"); bg.addColorStop(1, "#6e4b10");
            ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = "rgba(40,24,2,0.85)"; ctx.lineWidth = 1; ctx.stroke();
            for (const [rx, ry] of [[7, 7], [30, 7], [7, 30]]) { ctx.beginPath(); ctx.arc(rx, ry, 1.8, 0, Math.PI * 2); ctx.fillStyle = "#4a3208"; ctx.fill(); ctx.beginPath(); ctx.arc(rx - 0.5, ry - 0.5, 0.8, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,240,190,0.9)"; ctx.fill(); }
            ctx.restore();
        }
        // the felt
        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6); ctx.clip();
        const fg = ctx.createRadialGradient(fx + fw / 2, fy + fh * 0.46, 30, fx + fw / 2, fy + fh / 2, fw * 0.62);
        fg.addColorStop(0, "#2f6d4c"); fg.addColorStop(0.55, "#205239"); fg.addColorStop(1, "#123424");
        ctx.fillStyle = fg; ctx.fillRect(fx, fy, fw, fh);
        const img = ctx.getImageData(fx, fy, fw, fh), d = img.data;   // the nap of the cloth
        for (let i = 0; i < d.length; i += 4) {
            const n = (rnd() - 0.5) * 16 + (((i >> 2) % 3) - 1) * 1.5;
            d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n * 1.1, 0, 255); d[i + 2] = clamp(d[i + 2] + n * 0.9, 0, 255);
        }
        ctx.putImageData(img, fx, fy);
        // darker bands for the set-aside dice at both ends
        for (const x0 of [fx, fx + fw - COL_W]) { ctx.fillStyle = "rgba(0,0,0,0.13)"; ctx.fillRect(x0, fy, COL_W, fh); }
        // the shadow of the rim on the cloth
        for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, fy, 0, fy + 26, fx, fy, fw, 26], [0, fy + fh, 0, fy + fh - 22, fx, fy + fh - 22, fw, 22], [fx, 0, fx + 22, 0, fx, fy, 22, fh], [fx + fw, 0, fx + fw - 22, 0, fx + fw - 22, fy, 22, fh]]) {
            const sg = ctx.createLinearGradient(x0, y0, x1, y1);
            sg.addColorStop(0, "rgba(0,0,0,0.5)"); sg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = sg; ctx.fillRect(rx, ry, rw, rh);
        }
        ctx.restore();
        // gold lines: the border inside the felt, the columns' edges, the circle of the pot
        ctx.save();
        ctx.strokeStyle = FELT_GOLD + "0.34)"; ctx.lineWidth = 1.5;
        rr(ctx, fx + 10.5, fy + 10.5, fw - 21, fh - 21, 4); ctx.stroke();
        ctx.setLineDash([5, 6]); ctx.strokeStyle = FELT_GOLD + "0.22)"; ctx.lineWidth = 1;
        for (const x0 of [fx + COL_W + 0.5, fx + fw - COL_W - 0.5]) { ctx.beginPath(); ctx.moveTo(x0, fy + 22); ctx.lineTo(x0, fy + fh - 22); ctx.stroke(); }
        ctx.setLineDash([]);
        const px = POT.x - ox, py = POT.y - oy + 8;
        ctx.beginPath(); ctx.ellipse(px, py, 74, 58, 0, 0, Math.PI * 2); ctx.strokeStyle = FELT_GOLD + "0.26)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(px, py, 67, 51, 0, 0, Math.PI * 2); ctx.strokeStyle = FELT_GOLD + "0.12)"; ctx.lineWidth = 1; ctx.stroke();
        arcWords(ctx, "POD ZŁOTYM KUFLEM", px, py, 90, 72, -Math.PI / 2, FELT_GOLD + "0.30)", 13);
        ctx.restore();
        // the lip where the cloth meets the wood
        rr(ctx, fx - 0.5, fy - 0.5, fw + 1, fh + 1, 6); ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineWidth = 2; ctx.stroke();
        rr(ctx, fx - 2.5, fy - 2.5, fw + 5, fh + 5, 7); ctx.strokeStyle = "rgba(255,214,170,0.13)"; ctx.lineWidth = 1; ctx.stroke();
        dirty(b);
        return { x: ox, y: oy };
    }

    // ==================================================================
    // Sprites. Everything moves in logic ticks (tick()), so the tests' turbo speeds it all up alike.
    // ==================================================================
    // a die on the table: tx, ty = where it touches the cloth; h = how high above it; rot; k = size (1 on the table)
    class DieSprite extends Sprite {
        initialize(type, face, rng) {
            super.initialize();
            this.type = type;
            this.face = face;
            this.rng = rng || Math.random;
            this.shadow = new Sprite(dieShadow());
            this.glow = new Sprite(dieGlow());
            this.body = new Sprite(dieBitmap(type, face));
            for (const s of [this.shadow, this.glow, this.body]) { s.anchor.set(0.5, 0.5); this.addChild(s); }
            this.glow.blendMode = PIXI.BLEND_MODES.ADD;
            this.glow.visible = false;
            this.tx = 0; this.ty = 0; this.h = 0; this.rot = 0; this.k = 1;
            this.lift = 0; this.liftTo = 0; this.dim = 0; this.dimTo = 0; this.sq = 0; this.fade = 1;
            this.anim = null;
            this.t = 0;
            this.onImpact = null;
            this._blend = -1;
        }
        setFace(f) {
            if (f === this.face) return;
            this.face = f;
            this.body.bitmap = dieBitmap(this.type, f);
        }
        // thrown from (sx, sy) at height h0 to land on (ex, ey) after D ticks, ending turned by rot1
        fly(o) {
            this.tx = o.sx; this.ty = o.sy; this.h = o.h0;
            this.anim = { kind: "fly", t: 0, D: o.D, sx: o.sx, sy: o.sy, ex: o.ex, ey: o.ey, h0: o.h0, spin: o.spin, rot1: o.rot1, final: o.face, hits: 0, next: 0, delay: o.delay || 0 };
            this.rot = o.rot1 + o.spin;
            this.visible = !(o.delay > 0);
        }
        // slides (with a little hop of height arc) to (ex, ey), growing to size k1, in D ticks
        moveTo(ex, ey, D, k1, arc, rot1) {
            this.anim = { kind: "move", t: 0, D: Math.max(1, D), sx: this.tx, sy: this.ty, ex, ey, k0: this.k, k1: k1 === undefined ? this.k : k1, arc: arc || 0, r0: this.rot, r1: rot1 === undefined ? this.rot : rot1 };
        }
        fadeOut(D) { this.anim = { kind: "fade", t: 0, D: Math.max(1, D) }; }
        busy() { return !!this.anim; }
        tick() {
            this.t++;
            const a = this.anim;
            if (a && a.kind === "fly" && a.delay > 0) {   // (still in the cup)
                a.delay--;
                if (!a.delay) this.visible = true;
            } else if (a && a.kind === "fly") {
                a.t++;
                const u = clamp(a.t / a.D, 0, 1), p = 1 - Math.pow(1 - u, 2.3);
                this.tx = lerp(a.sx, a.ex, p);
                this.ty = lerp(a.sy, a.ey, p);
                const U = [0.4, 0.68, 0.84];
                if (u < U[0]) { const q = u / U[0]; this.h = a.h0 * (1 - q) + 44 * 4 * q * (1 - q); }
                else if (u < U[1]) { const q = (u - U[0]) / (U[1] - U[0]); this.h = 15 * 4 * q * (1 - q); }
                else if (u < U[2]) { const q = (u - U[1]) / (U[2] - U[1]); this.h = 4.5 * 4 * q * (1 - q); }
                else this.h = 0;
                while (a.hits < 3 && u >= U[a.hits]) { if (this.onImpact) this.onImpact(this, a.hits); a.hits++; }
                this.rot = a.rot1 + a.spin * (1 - easeOut(u));
                if (u < U[1]) {   // tumbling: other faces flash by, the cube looks squashed as it turns
                    if (a.t >= a.next) { this.setFace(1 + Math.floor(this.rng() * 6)); a.next = a.t + 3 + Math.floor(this.rng() * 3); }
                    this.sq = Math.abs(Math.sin(a.t * 0.55)) * (1 - u / U[1]);
                } else { this.setFace(a.final); this.sq = 0; }
                if (a.t >= a.D) { this.h = 0; this.sq = 0; this.rot = a.rot1; this.setFace(a.final); this.anim = null; }
            } else if (a && a.kind === "move") {
                a.t++;
                const u = easeInOut(a.t / a.D);
                this.tx = lerp(a.sx, a.ex, u);
                this.ty = lerp(a.sy, a.ey, u);
                this.k = lerp(a.k0, a.k1, u);
                this.h = a.arc * 4 * u * (1 - u);
                this.rot = lerp(a.r0, a.r1, u);
                if (a.t >= a.D) { this.h = 0; this.anim = null; }
            } else if (a && a.kind === "fade") {
                a.t++;
                this.fade = 1 - a.t / a.D;
                if (a.t >= a.D) { this.fade = 0; this.anim = null; this.visible = false; }
            }
            this.lift += clamp(this.liftTo - this.lift, -1 / 6, 1 / 6);
            this.dim += clamp(this.dimTo - this.dim, -1 / 10, 1 / 10);
            this.place();
        }
        place() {
            const lift = this.lift, h = this.h + lift * 7, base = DIE_SCALE * this.k;
            const s = base * (1 + h / 170 + lift * 0.05), sq = this.sq * 0.2;
            this.x = Math.round(this.tx * 2) / 2;
            this.y = Math.round(this.ty * 2) / 2;
            this.body.y = -h * 0.55;
            this.body.rotation = this.rot;
            this.body.scale.set(s * (1 - sq), s * (1 - sq * 0.4));
            this.shadow.x = 3 + h * 0.32;
            this.shadow.y = 5 + h * 0.42;
            this.shadow.rotation = this.rot;
            this.shadow.scale.set(base * (1 + h / 240));
            this.shadow.opacity = Math.round(255 * clamp(0.92 - h / 120, 0.25, 0.92) * this.fade);
            this.glow.visible = lift > 0.02;
            if (this.glow.visible) {
                this.glow.y = this.body.y;
                this.glow.rotation = this.rot;
                this.glow.scale.set(s);
                this.glow.opacity = Math.round(lift * (190 + 60 * Math.sin(this.t / 7)) * this.fade);
            }
            this.body.opacity = Math.round(255 * this.fade);
            const blend = Math.round(this.dim * 150);
            if (blend !== this._blend) { this._blend = blend; this.body.setBlendColor([24, 26, 30, blend]); }
        }
        // the die's box on the screen (for the mouse)
        hit(x, y) { const r = 34 * this.k; return Math.abs(x - this.x) <= r && Math.abs(y - (this.y + this.body.y)) <= r; }
    }

    // the leather cup: comes in from its owner's side, is shaken, tips the dice out and goes
    class CupSprite extends Sprite {
        initialize() {
            super.initialize();
            this.shadow = new Sprite(cupShadow());
            this.shadow.anchor.set(0.5, 0.5);
            this.shadow.scale.set(0.5);
            this.body = new Sprite(cupBitmap());
            this.body.anchor.set(0.5, 206 / CUP_H);   // (the middle of the base)
            this.body.scale.set(0.5);
            this.addChild(this.shadow);
            this.addChild(this.body);
            this.visible = false;
            this.mode = "hidden";
            this.t = 0;
            this.dir = 1;
            this.bx = 0; this.by = 0; this.lift = 0; this.rot = 0; this.alpha2 = 0;
            this.onRattle = null;
            this.onRelease = null;
        }
        // side: 1 = the hero's (tips to the right), -1 = the rival's; (x, y) where it stands
        enter(x, y, side) {
            this.dir = side;
            this.bx = x; this.by = y;
            this.mode = "enter"; this.t = 0;
            this.visible = true;
        }
        shake(ticks) { this.mode = "shake"; this.t = 0; this.shakeFor = ticks || 44; }
        pour() { this.mode = "pour"; this.t = 0; this.released = false; }
        leave() { this.mode = "leave"; this.t = 0; }
        mouth() {   // where the dice come out (screen px)
            const r = this.body.rotation, len = (206 - 40) * 0.5 + 8;
            return { x: this.x + Math.sin(r) * len, y: this.y + this.body.y - Math.cos(r) * len, h: 26 };
        }
        busy() { return this.mode === "enter" || this.mode === "shake" || this.mode === "pour" || this.mode === "leave"; }
        tick() {
            if (!this.visible) return;
            this.t++;
            const t = this.t;
            let ox = 0, oy = 0, rot = 0, lift = 0, op = 1;
            if (this.mode === "enter") {
                const u = easeOut(t / 14);
                ox = -this.dir * 60 * (1 - u); op = u;
                if (t >= 14) this.mode = "ready";
            } else if (this.mode === "shake") {
                const env = Math.sin(Math.PI * clamp(t / this.shakeFor, 0, 1));
                ox = Math.sin(t * 0.95) * 5 * env;
                oy = Math.cos(t * 1.3) * 2.5 * env;
                rot = Math.sin(t * 0.78) * 0.17 * env;
                lift = Math.abs(Math.sin(t * 0.42)) * 16 * env;
                if (this.onRattle && t % 5 === 1 && t < this.shakeFor - 3) this.onRattle(env);
                if (t >= this.shakeFor) this.mode = "ready";
            } else if (this.mode === "pour") {
                const u = easeBack(t / 12);
                rot = this.dir * 1.3 * u; lift = 18 * Math.min(1, t / 8); ox = this.dir * 14 * u;
                if (t === 7 && this.onRelease && !this.released) { this.released = true; this.onRelease(); }
                if (t >= 20) this.mode = "poured";
            } else if (this.mode === "poured") {
                rot = this.dir * 1.3; lift = 18; ox = this.dir * 14;
            } else if (this.mode === "leave") {
                const u = easeInOut(t / 18);
                rot = this.dir * 1.3 * (1 - u); lift = 18 * (1 - u); ox = this.dir * 14 - this.dir * 70 * u; op = 1 - u;
                if (t >= 18) { this.mode = "hidden"; this.visible = false; }
            }
            this.x = this.bx + ox;
            this.y = this.by + oy;
            this.body.y = -lift;
            this.body.rotation = rot;
            this.shadow.x = 6 + lift * 0.3; this.shadow.y = 6 + lift * 0.25;
            this.shadow.scale.set(0.5 * (1 - lift / 120));
            this.opacity = Math.round(255 * clamp(op, 0, 1));
        }
    }

    // a speech bubble above a bust (the table's own: narrower, its tail in the middle)
    const BUBBLE = { w: 236, font: 18, line: 24, pad: 13, tail: 13 };
    class BubbleSprite extends Sprite {
        initialize(side) {
            super.initialize();
            this.side = side;
            this.anchor.set(0.5, 1);
            this.t = 0; this.life = 0;
            this.visible = false;
            this.text = "";
        }
        say(text, frames) {
            this.text = String(text);
            const probe = new Bitmap(8, 8), inner = BUBBLE.w - BUBBLE.pad * 2;
            const lines = wrapLines(probe, this.text, inner, BUBBLE.font);
            const h = lines.length * BUBBLE.line + BUBBLE.pad * 2 - 4, H = h + BUBBLE.tail + 2;
            const b = new Bitmap(BUBBLE.w + 4, H), ctx = b.context, S = ST();
            const tailX = this.side === "left" ? BUBBLE.w * 0.5 : BUBBLE.w * 0.5;
            // the panel with its tail
            const x0 = 1.5, y0 = 1.5, w = BUBBLE.w - 1, c = 6;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x0 + c, y0); ctx.lineTo(x0 + w - c, y0); ctx.lineTo(x0 + w, y0 + c); ctx.lineTo(x0 + w, y0 + h - c); ctx.lineTo(x0 + w - c, y0 + h);
            ctx.lineTo(tailX + 10, y0 + h); ctx.lineTo(tailX + (this.side === "left" ? 6 : -6), y0 + h + BUBBLE.tail); ctx.lineTo(tailX - 10, y0 + h);
            ctx.lineTo(x0 + c, y0 + h); ctx.lineTo(x0, y0 + h - c); ctx.lineTo(x0, y0 + c); ctx.closePath();
            ctx.fillStyle = "rgba(11,12,15,0.9)"; ctx.fill();
            ctx.strokeStyle = S.line; ctx.lineWidth = 1; ctx.stroke();
            ctx.strokeStyle = S.accent; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x0 + 0.5, y0 + c + 10); ctx.lineTo(x0 + 0.5, y0 + c); ctx.lineTo(x0 + c, y0 + 0.5); ctx.lineTo(x0 + c + 10, y0 + 0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x0 + w - 0.5, y0 + h - c - 10); ctx.lineTo(x0 + w - 0.5, y0 + h - c); ctx.lineTo(x0 + w - c, y0 + h - 0.5); ctx.lineTo(x0 + w - c - 10, y0 + h - 0.5); ctx.stroke();
            ctx.restore();
            dirty(b);
            lines.forEach((l, i) => txt(b, l, x0 + BUBBLE.pad, y0 + BUBBLE.pad - 4 + i * BUBBLE.line, inner, { size: BUBBLE.font, color: S.text, lh: BUBBLE.line }));
            const old = this.bitmap;
            this.bitmap = b;
            if (old) old.destroy();
            this.anchor.set((tailX + (this.side === "left" ? 6 : -6)) / b.width, 1);
            this.t = 0;
            this.life = frames || clamp(110 + this.text.length * 3.2, 150, 360);
            this.visible = true;
        }
        hide() { if (this.visible && this.t < this.life - 14) this.t = this.life - 14; }
        tick() {
            if (!this.visible) return;
            this.t++;
            const k = Math.min(1, this.t / 10, (this.life - this.t) / 14);
            this.opacity = Math.round(255 * clamp(k, 0, 1));
            this.oy = Math.round(5 * (1 - Math.min(1, this.t / 10)));
            if (this.t >= this.life) { this.visible = false; this.text = ""; }
        }
        shown() { return this.visible && this.t < this.life - 14; }
    }

    // floating words: "+500 Mały strit"
    class FloatText extends Sprite {
        initialize(text, sub, colour, size) {
            const probe = new Bitmap(8, 8), s = size || 34;
            const w = Math.ceil(Math.max(measure(probe, text, s, true), sub ? measure(probe, sub, 19, true) : 0)) + 24;
            super.initialize(new Bitmap(w, s + (sub ? 34 : 14)));
            txt(this.bitmap, text, 0, 0, w, { size: s, color: colour || ST().accent, bold: true, outline: 5, align: "center" });
            if (sub) txt(this.bitmap, sub, 0, s + 4, w, { size: 19, color: "#f4f1e8", bold: true, outline: 4, align: "center" });
            this.anchor.set(0.5, 1);
            this.life = 0; this.max = 78; this.vy = -1.1;
        }
        tick() {
            this.life++;
            this.y += this.life < 22 ? this.vy : this.vy * 0.25;
            const s = this.life < 8 ? 0.7 + 0.3 * easeBack(this.life / 8) : 1;
            this.scale.set(s, s);
            this.opacity = this.life > this.max - 20 ? 255 * (this.max - this.life) / 20 : 255;
            return this.life < this.max;
        }
    }
    class Particle extends Sprite {
        initialize(bitmap, vx, vy, life, grav, add) {
            super.initialize(bitmap);
            this.anchor.set(0.5, 0.5);
            if (add) this.blendMode = PIXI.BLEND_MODES.ADD;
            this.vx = vx; this.vy = vy; this.life = 0; this.max = life; this.grav = grav || 0;
        }
        tick() {
            this.life++;
            this.x += this.vx; this.y += this.vy; this.vy += this.grav; this.vx *= 0.97;
            this.opacity = 255 * (1 - this.life / this.max);
            return this.life < this.max;
        }
    }

    // ==================================================================
    // Sounds (the RTP's own): the cup's rattle and the dice's clack are short clicks and knocks at random pitches. Through the core's
    // pool of preloaded players (a file that fails to load stays silent; a few a frame, so turbo does not pile them up)
    // ==================================================================
    function se(name, volume, pitch, pan) {
        if (name) TW.audio.se(name, { volume: volume || 80, pitch: pitch || 100, pan: pan || 0 });
    }
    const SND = {
        cursor: ["Cursor1", 50, 100], on: ["Switch1", 70, 132], off: ["Switch1", 55, 95], decide: ["Decision1", 60, 100], cancel: ["Cancel1", 60, 100],
        buzzer: ["Buzzer1", 50, 100], coin: ["Coin", 50, 100], coins: ["Shop1", 55, 105], bank: ["Item1", 55, 112], bust: ["Miss", 85, 80],
        hot: ["Fire1", 70, 115], hot2: ["Flash1", 40, 125], combo: ["Item3", 40, 125], big: ["Chime2", 55, 100], vision: ["Stare", 60, 100],
        laugh: ["Laugh", 40, 108], lose: ["Disappointment", 60, 100], page: ["Book1", 55, 100], tick: ["Cursor1", 25, 140]
    };
    const snd = (k, volK, pitchAdd) => { const s = SND[k]; if (s) se(s[0], Math.round(s[1] * (volK === undefined ? 1 : volK)), s[2] + (pitchAdd || 0)); };

    // ==================================================================
    // The HUD's places on the screen; the busts are TawernaUI's, BUST_H high
    // ==================================================================
    const BUST_H = 273;
    const HEADER = { x: 12, y: 8, w: 1256, h: 46 };
    const SIDE_L = { x: 12, y: 64, w: 240, h: 228 }, SIDE_R = { x: 1028, y: 64, w: 240, h: 228 };
    const BAR = { x: TBL.x, y: 620, w: TBL.w, h: 44 }, HINT = { x: TBL.x, y: 678, w: TBL.w, h: 32 };
    const BTN = [
        { id: "rules", x: 0, w: 118, label: "Zasady", small: true },
        { id: "roll", x: 162, w: 212, primary: true },
        { id: "bank", x: 382, w: 212, primary: true },
        { id: "leave", x: 638, w: 118, label: "Odejdź", small: true }
    ];

    // ==================================================================
    // The HUD and the panels over the table: methods of the table's scene (TavernDice_Scene.js takes them in)
    // ==================================================================
    class DicePanels {
        // ==============================================================
        // The HUD: the top bar, the two players' plates, the buttons, the key hints, the words on the cloth, the pot
        // ==============================================================
        drawHeader() {
            const g = this.game, S = ST(), h = hourNow();
            const clock = String(Math.floor(h) % 24).padStart(2, "0") + ":" + String(Math.floor((h % 1) * 60)).padStart(2, "0");
            const key = [this.phase === "lobby" ? "L" : "G", g ? g.key + ":" + g.stake + ":" + g.match.target : "", $gameParty.gold(), clock].join("|");
            if (key === this._hk) return;
            this._hk = key;
            const b = this.header.bitmap, W = b.width;
            b.clear();
            panel(b, 0, 0, W, HEADER.h, { cut: 6 });
            txt(b, "KOŚCI", 18, 8, 120, { size: 23, color: S.accent, bold: true });
            const w1 = Math.ceil(measure(b, "KOŚCI", 23, true));
            txt(b, "·   sala gier „Pod Złotym Kuflem”", 18 + w1 + 12, 12, 420, { size: 17, color: S.muted });
            if (g && this.phase !== "lobby") txt(b, g.opp.name + "   ·   stawka " + gold(g.stake) + "   ·   gra do " + g.match.target, W / 2 - 300, 11, 600, { size: 18, color: S.text, align: "center" });
            const gs = gold($gameParty.gold()), gw = Math.ceil(measure(b, gs, 20, true));
            txt(b, gs, W - 18 - gw, 10, gw + 4, { size: 20, color: S.accent, bold: true });
            icon(b, COIN_ICON, W - 18 - gw - 30, 10, 26);
            txt(b, clock + "   ·   dzień " + dayNow(), W - 18 - gw - 250, 12, 212, { size: 17, color: S.muted, align: "right" });
        }
        drawSides() {
            const g = this.game, on = !!g && (this.phase === "play" || this.phase === "end" || this.phase === "confirm" || (this.phase === "rules" && this.rulesBack !== "lobby"));
            this.panelL.visible = this.panelR.visible = on;
            if (!on) return;
            this.drawSide(0);
            this.drawSide(1);
        }
        drawSide(who) {
            const g = this.game, m = g.match, p = m.players[who], S = ST(), spr = who ? this.panelR : this.panelL, b = spr.bitmap, W = b.width, H = b.height;
            const active = g.started && m.cur === who && !m.over && this.phase !== "end";
            const turn = active ? m.turn.pts : 0;
            let sel = null;
            if (m.cur === who && this.phase === "play") {
                const lifted = this.dice.map((d, i) => (d.liftTo > 0 ? i : -1)).filter(i => i >= 0);
                if (lifted.length && m.thrown) { const s = score(lifted.map(i => m.thrown[i] && m.thrown[i].face)); sel = s.valid ? s.points : -1; }
            }
            const shown = Math.min(this.shown[who], p.total), dice = p.dice.join(",");
            const key = [who, active, shown, m.target, turn, sel, dice, $gameParty.gold(), m.winner].join("|");
            if (spr._key === key) return;
            spr._key = key;
            b.clear();
            panel(b, 0, 0, W, H, { cut: 6, line: active ? S.accentDim : S.line, fill: active ? "rgba(26,23,13,0.93)" : "rgba(11,12,15,0.9)" });
            const name = who ? g.opp.short : "Ty", sub = who ? g.opp.role + " · " + g.opp.style : "sakiewka: " + gold($gameParty.gold());
            txt(b, name, 16, 10, W - 110, { size: 24, color: S.accent, bold: true });
            if (active) {
                const tag = "RZUCA", tw = Math.ceil(measure(b, tag, 13, true)) + 16;
                ST().panel(b.context, W - 16 - tw, 16, tw, 20, { cut: 3, fill: S.accent, line: S.accent, accent: false }); dirty(b);
                txt(b, tag, W - 16 - tw, 16, tw, { size: 13, color: "#16171b", bold: true, align: "center", lh: 20 });
            } else if (m.over && m.winner === who) {
                const tag = "WYGRANA", tw = Math.ceil(measure(b, tag, 13, true)) + 16;
                ST().panel(b.context, W - 16 - tw, 16, tw, 20, { cut: 3, fill: "rgba(142,224,138,0.18)", line: GOOD, accent: false }); dirty(b);
                txt(b, tag, W - 16 - tw, 16, tw, { size: 13, color: GOOD, bold: true, align: "center", lh: 20 });
            }
            txt(b, sub, 16, 38, W - 32, { size: 15, color: who ? g.opp.styleColor : S.muted });
            const big = String(shown), bw = Math.ceil(measure(b, big, 46, true));
            txt(b, big, 14, 56, bw + 6, { size: 46, color: S.text, bold: true });
            txt(b, "/ " + m.target, 14 + bw + 8, 76, 100, { size: 18, color: S.muted });
            bar(b, 16, 124, W - 32, 7, shown / m.target, who ? g.opp.styleColor : S.accent);
            b.fillRect(16, 142, W - 32, 1, S.line);
            txt(b, "Tura", 16, 148, 100, { size: 17, color: S.muted });
            txt(b, turn > 0 ? "+" + turn : "—", W - 116, 145, 100, { size: 22, color: turn > 0 ? S.accent : "#5d636e", bold: turn > 0, align: "right" });
            txt(b, who ? "Odkłada" : "Wybrane", 16, 174, 100, { size: 17, color: S.muted });
            txt(b, sel === null ? "—" : sel < 0 ? "nie punktują" : "+" + sel, W - 136, 172, 120, { size: sel === null ? 20 : 19, color: sel === null ? "#5d636e" : sel < 0 ? BAD : GOOD, bold: sel !== null, align: "right" });
            txt(b, "Kości", 16, 200, 80, { size: 15, color: S.muted });
            p.dice.forEach((k, i) => paintDie(b.context, W - 16 - (6 - i) * 21 + 2, 201, 18, 5, k));
            dirty(b);
        }
        drawBar() {
            const on = this.phase === "play" || this.phase === "confirm" || (this.phase === "rules" && this.rulesBack === "play");
            this.bar.visible = on;
            if (!on) return;
            const btns = this.buttons(), fi = this.waitHero && this.focus.row === "btn" ? this.focus.i : -1;
            const key = btns.map(x => x.label + (x.enabled ? 1 : 0)).join("|") + "#" + fi;
            if (key === this._bk) return;
            this._bk = key;
            const b = this.bar.bitmap;
            b.clear();
            btns.forEach((x, i) => drawButton(b, x.x, 0, x.w, BAR.h, x.label, { focus: i === fi && x.enabled, disabled: !x.enabled, primary: x.primary, small: x.small }));
        }
        drawHint() {
            const p = this.phase, arrows = ["up", "left", "down", "right"];
            let rows;
            if (p === "lobby") rows = [[arrows, "wybór"], [["O"], "zatwierdź"], [["P"], "odejdź"]];
            else if (p === "rules") rows = [[["O"], "rozumiem"], [["P"], "zamknij"]];
            else if (p === "confirm") rows = [[["left", "right"], "wybór"], [["O"], "zatwierdź"], [["P"], "zostań przy stole"]];
            else if (p === "end") rows = [[["left", "right"], "wybór"], [["O"], "zatwierdź"], [["P"], "odejdź"]];
            else if (this.waitHero === "choose") rows = [[arrows, "kości i przyciski"], [["O"], "odłóż kość / wciśnij"], [["P"], "odejdź od stołu"]];
            else if (this.waitHero === "throw") rows = [[["O"], "rzuć kośćmi"], [["P"], "odejdź od stołu"]];
            else if (this.game && this.game.started && this.game.match.cur === 1) rows = [[["O"], "przytrzymaj: szybciej"], [["P"], "odejdź od stołu"]];
            else rows = [[["P"], "odejdź od stołu"]];
            const key = JSON.stringify(rows);
            if (key === this._hintKey) return;
            this._hintKey = key;
            const b = this.hint.bitmap;
            b.clear();
            const w = keyHints(b, rows, 0, 3, 26, 17, true);
            keyHints(b, rows, Math.round((b.width - w) / 2), 3, 26, 17);
        }
        // the words on the cloth: whose column is whose, the turn's points, what the chosen dice give, the pot
        drawFelt() {
            const g = this.game, S = ST();
            const m = g && g.match;
            let pill = "", pc = S.muted;
            if (g && this.phase !== "lobby") {
                if (m.over) pill = "";
                else if (!g.started) pill = "Rzut o pierwszeństwo: wyższe oczko zaczyna";
                else if (this.waitHero === "throw") { pill = "Twoja tura — rzuć kośćmi"; pc = S.text; }
                else if (this.waitHero === "choose") {
                    const s = this.selection();
                    if (!s.n) pill = this.pillFlash > 0 ? "Najpierw odłóż co najmniej jedną punktującą kość" : "Wybierz kości, które odkładasz";
                    else if (!s.valid) { pill = "Nie wszystkie wybrane kości punktują"; pc = BAD; }
                    else { pill = s.name + "  ·  " + s.points; pc = S.accent; }
                    if (this.pillFlash > 0) { this.pillFlash--; if (!s.n) pc = BAD; }
                } else if (m.cur === 1) {
                    const lifted = this.dice.map((d, i) => (d.liftTo > 0 ? i : -1)).filter(i => i >= 0);
                    if (lifted.length && m.thrown) { const s = score(lifted.map(i => m.thrown[i].face)); pill = g.opp.short + " odkłada: " + (s.valid ? s.name + "  ·  " + s.points : "..."); pc = S.text; }
                    else pill = "Tura: " + g.opp.short;
                }
            }
            const turns = g && g.started && !m.over ? [m.cur === 0 ? m.turn.pts : 0, m.cur === 1 ? m.turn.pts : 0] : [0, 0];
            const key = [g && this.phase !== "lobby" ? g.key : "", pill, pc, turns.join(","), g ? g.potShown : 0].join("|");
            if (key === this._fk) return;
            this._fk = key;
            const b = this.feltText.bitmap, W = b.width, H = b.height;
            b.clear();
            if (!g || this.phase === "lobby") return;
            const labels = [["TY", HERO_COL], [g.opp.short.toUpperCase(), OPP_COL]];
            for (const [text, cx] of labels) {
                const size = measure(b, text, 14, true) > COL_W - 8 ? 12 : 14;
                txt(b, text, cx - FELT.x - 50, 12 + (14 - size), 100, { size, color: "rgba(232,200,120,0.78)", bold: true, align: "center" });
            }
            turns.forEach((t, i) => { if (t > 0) txt(b, "+" + t, (i ? OPP_COL : HERO_COL) - FELT.x - 50, H - 44, 100, { size: 20, color: "rgba(255,226,140,0.95)", bold: true, align: "center", outline: 3 }); });
            if (g.potShown > 0) {   // the pot's label under the coins
                const s = "Pula " + gold(g.potShown), w = Math.ceil(measure(b, s, 16, true)) + 22, x = POT.x - FELT.x - w / 2, y = POT.y - FELT.y + 44;
                const ctx = b.context;
                rr(ctx, x, y, w, 24, 12); ctx.fillStyle = "rgba(8,10,9,0.72)"; ctx.fill(); ctx.strokeStyle = FELT_GOLD + "0.5)"; ctx.lineWidth = 1; ctx.stroke(); dirty(b);
                txt(b, s, x, y + 1, w, { size: 16, color: GOLD_TXT, bold: true, align: "center", lh: 22 });
            }
            if (pill) {
                const w = Math.ceil(measure(b, pill, 18, true)) + 40, x = W / 2 - w / 2, y = H - 40;
                const ctx = b.context;
                rr(ctx, x, y, w, 30, 15); ctx.fillStyle = "rgba(8,10,9,0.78)"; ctx.fill();
                ctx.strokeStyle = pc === S.accent ? "rgba(255,210,63,0.7)" : pc === BAD ? "rgba(255,123,107,0.7)" : FELT_GOLD + "0.35)"; ctx.lineWidth = 1; ctx.stroke(); dirty(b);
                txt(b, pill, x, y + 3, w, { size: 18, color: pc, bold: pc !== S.muted, align: "center", lh: 24 });
            }
        }
        drawPot() {
            const g = this.game, n = g && this.phase !== "lobby" && g.potShown > 0 ? clamp(Math.round(g.potShown / 4) + 2, 3, 32) : 0;
            if (n !== this._potN) {
                this._potN = n;
                this.potSpr.bitmap = n > 0 ? potBitmap(n) : null;
            }
        }

        // ==============================================================
        // The panels over the table: the lobby, the rules, leaving, the end of a game
        // ==============================================================
        drawOverlay() {
            const p = this.phase, show = p === "lobby" || p === "rules" || p === "confirm" || p === "end";
            this.overlay.visible = show;
            if (!show) { this.hits = null; return; }
            const key = this.overlayKey();
            if (key === this._ok) return;
            this._ok = key;
            const b = this.overlay.bitmap;
            b.clear();
            this.hits = [];
            if (p === "rules") {
                if (this.rulesBack === "lobby") this.drawLobby(b, true);
                this.drawRules(b);
            } else if (p === "lobby") this.drawLobby(b);
            else if (p === "confirm") this.drawConfirm(b);
            else if (p === "end") this.drawEnd(b);
        }
        overlayKey() {
            const L = this.lobby, p = this.phase;
            const ready = [ui.heroBust()].concat(OPP_ORDER.map(k => OPPONENTS[k].bust)).map(n => (ui.loadBust(n).isReady() ? 1 : 0)).join("")
                + (ImageManager.loadSystem("IconSet").isReady() ? 1 : 0);
            if (p === "lobby" || (p === "rules" && this.rulesBack === "lobby")) return [p, ready, L.row, L.i, L.sel, L.stakeI, L.slot, L.btn, store().set.join(), $gameParty.gold()].join("|");
            if (p === "confirm") return p + this.confirmSel;
            if (p === "end") return [p, ready, this.endSel, this.gameNo].join("|");
            return p + ready;
        }
        dim(b, a) { b.fillRect(0, 0, b.width, b.height, "rgba(0,0,0," + a + ")"); }
        drawLobby(b, under) {
            const S = ST(), L = this.lobby, px = 140, py = 48, pw = 1000, ph = 622;
            this.dim(b, 0.45);
            panel(b, px, py, pw, ph, { cut: 10 });
            txt(b, "SALA GIER · „POD ZŁOTYM KUFLEM”", px + 32, py + 20, 600, { size: 15, color: S.muted, bold: true });
            txt(b, "Kości", px + 32, py + 38, 400, { size: 44, color: S.accent, bold: true });
            txt(b, "Sześć kości, kubek i odrobina odwagi. Kto pierwszy dojdzie do celu, bierze całą pulę.", px + 32, py + 96, pw - 64, { size: 18, color: S.text });
            const h = hourNow(), clock = String(Math.floor(h) % 24).padStart(2, "0") + ":" + String(Math.floor((h % 1) * 60)).padStart(2, "0");
            txt(b, clock + " · dzień " + dayNow(), px + pw - 332, py + 22, 300, { size: 17, color: S.muted, align: "right" });
            txt(b, "Sakiewka: " + gold($gameParty.gold()), px + pw - 332, py + 46, 300, { size: 22, color: S.accent, bold: true, align: "right" });
            b.fillRect(px + 32, py + 132, pw - 64, 1, S.line);
            txt(b, "KTO SIEDZI PRZY STOLE", px + 32, py + 142, 400, { size: 14, color: S.muted, bold: true });
            txt(b, L.hint || "Kto siedzi przy stole, zależy od pory dnia.", px + 332, py + 142, pw - 364, { size: 14, color: L.hint ? "#c9b27a" : "#6d737c", align: "right" });
            const n = L.cards.length, gap = 22, cw = Math.min(212, Math.floor((pw - 64 - (n - 1) * gap) / Math.max(1, n))), ch = 226, total = n * cw + (n - 1) * gap, x0 = px + Math.round((pw - total) / 2), y0 = py + 168;
            if (!n) {
                txt(b, "Stoły puste. Wróć wieczorem.", px, y0 + 70, pw, { size: 30, color: S.accent, bold: true, align: "center" });
                txt(b, "O tej porze nikt nie gra w kości.", px, y0 + 114, pw, { size: 18, color: S.muted, align: "center" });
            }
            L.cards.forEach((c, i) => this.drawCard(b, c, x0 + i * (cw + gap), y0, cw, ch, i === L.sel, L.row === "cards" && i === L.i));
            // the chosen rival's words
            const card = this.lobbyCard();
            if (card) {
                const o = OPPONENTS[card.key], q = card.tired ? o.lines.tired[0] : o.quote;
                b.fillRect(px + 32, py + 408, 3, 26, S.accentDim);
                txt(b, "„" + q + "”", px + 46, py + 405, pw - 300, { size: 19, color: "#d8dde3" });
                txt(b, "— " + o.name, px + pw - 300, py + 407, 268, { size: 17, color: S.muted, align: "right" });
            }
            // the stake
            const sy = py + 452, stake = this.lobbyStake(), fS = L.row === "stake";
            txt(b, "STAWKA", px + 32, sy + 10, 120, { size: 14, color: S.muted, bold: true });
            const bx = px + 150, bw = 176;
            ST().panel(b.context, bx, sy, bw, 40, { cut: 4, fill: fS ? "rgba(255,210,63,0.12)" : "rgba(20,22,27,0.94)", line: fS ? S.accent : S.line, accent: fS });
            const tcol = card && stake ? (fS ? S.accent : S.text) : "#565b64";
            tri(b.context, "left", bx + 20, sy + 20, 14, tcol); tri(b.context, "right", bx + bw - 20, sy + 20, 14, tcol);
            dirty(b);
            txt(b, card ? gold(stake) : "—", bx, sy + 5, bw, { size: 24, color: card ? (fS ? S.accent : S.text) : "#565b64", bold: true, align: "center" });
            this.hits.push({ row: "stake", dir: -1, x: bx, y: sy, w: 44, h: 40 }, { row: "stake", dir: 1, x: bx + bw - 44, y: sy, w: 44, h: 40 }, { row: "stake", x: bx + 44, y: sy, w: bw - 88, h: 40 });
            if (card) {
                const afford = $gameParty.gold() >= stake;
                const tg = targetFor(stake, card.key), info = afford ? "pula " + gold(stake * 2) + "   ·   gra do " + tg + (tg < TARGET ? " (szybka partia)" : tg > TARGET ? " (wielka gra)" : "") : "Masz za mało złota na tę stawkę.";
                txt(b, info, bx + bw + 20, sy + 8, 520, { size: 18, color: afford ? S.text : BAD });
            }
            // the hero's six
            const dy = py + 506, fD = L.row === "dice", set = heroSet(), specials = this.hasSpecials();
            txt(b, "TWOJE KOŚCI", px + 32, dy + 10, 130, { size: 14, color: S.muted, bold: true });
            set.forEach((k, i) => {
                const x = px + 150 + i * 48, sz = 38;
                paintDie(b.context, x, dy + 1, sz, [5, 1, 3, 6, 2, 4][i], k);
                if (fD && i === L.slot) {
                    const c = b.context; c.save(); c.strokeStyle = S.accent; c.lineWidth = 2;
                    const a = x - 5, z = x + sz + 5, t = dy - 4, bo = dy + sz + 6, l = 9;
                    c.beginPath(); c.moveTo(a, t + l); c.lineTo(a, t); c.lineTo(a + l, t); c.moveTo(z - l, t); c.lineTo(z, t); c.lineTo(z, t + l);
                    c.moveTo(z, bo - l); c.lineTo(z, bo); c.lineTo(z - l, bo); c.moveTo(a + l, bo); c.lineTo(a, bo); c.lineTo(a, bo - l); c.stroke(); c.restore();
                }
                this.hits.push({ row: "dice", i, x: x - 4, y: dy - 4, w: sz + 8, h: sz + 10 });
            });
            dirty(b);
            const k = fD ? set[L.slot] : null, T = k ? DIE_TYPES[k] : null;
            if (specials && T) {
                txt(b, T.name, px + 452, dy - 2, pw - 480, { size: 19, color: S.accent, bold: true });
                txt(b, T.effect + (SPECIAL_ORDER.some(s => ownedCount(s) > 0) ? "   (O: zmień)" : ""), px + 452, dy + 22, pw - 480, { size: 15, color: S.muted });
            } else if (specials) {
                const names = SPECIAL_ORDER.filter(s => ownedCount(s) > 0).map(s => DIE_TYPES[s].name + (ownedCount(s) > 1 ? " ×" + ownedCount(s) : ""));
                txt(b, "Masz: " + names.join(", "), px + 452, dy - 2, pw - 480, { size: 17, color: S.text });
                txt(b, "Wybierz kość strzałkami i zmień ją klawiszem O.", px + 452, dy + 22, pw - 480, { size: 15, color: S.muted });
            } else {
                txt(b, "Sześć zwykłych kości z kości.", px + 452, dy - 2, pw - 480, { size: 17, color: S.text });
                txt(b, "Kości wyjątkowe zdobywa się przy stole i w przygodach.", px + 452, dy + 22, pw - 480, { size: 15, color: S.muted });
            }
            // the buttons
            const by = py + ph - 62, btns = [["Zasady", px + 32, 150, false], ["Siadam do gry", px + pw - 32 - 170 - 14 - 250, 250, true], ["Odchodzę", px + pw - 32 - 170, 170, false]];
            btns.forEach(([label, x, w, primary], i) => {
                const en = i !== 1 || this.canPlay();
                drawButton(b, x, by, w, 44, label, { focus: L.row === "buttons" && L.btn === i && en, disabled: !en, primary });
                this.hits.push({ row: "buttons", i, x, y: by, w, h: 44 });
            });
            if (under) this.hits = [];
        }
        drawCard(b, c, x, y, w, h, sel, foc) {
            const S = ST(), o = OPPONENTS[c.key], ctx = b.context, v = vsOf(c.key), off = c.tired || !c.afford;
            S.panel(ctx, x, y, w, h, { cut: 6, fill: sel ? "rgba(255,210,63,0.08)" : "rgba(18,20,24,0.96)", line: sel ? S.accent : S.line, accent: sel });
            // the bust in a warm little window
            const ix = x + 9, iy = y + 9, iw = w - 18, ih = 130;
            const bg = ctx.createRadialGradient(ix + iw / 2, iy + ih * 0.7, 10, ix + iw / 2, iy + ih * 0.6, iw * 0.7);
            bg.addColorStop(0, "rgba(120,74,34,0.9)"); bg.addColorStop(1, "rgba(28,18,10,0.95)");
            ctx.fillStyle = bg; ctx.fillRect(ix, iy, iw, ih);
            const bust = ui.loadBust(o.bust);
            if (bust.isReady() && bust.width) {
                ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
                ctx.imageSmoothingEnabled = true;
                const sw = bust.width * 0.7, sh = sw * ih / iw;
                ctx.drawImage(bust._canvas || bust._image, (bust.width - sw) / 2, 4, sw, sh, ix, iy, iw, ih);
                ctx.restore();
            }
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1; ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
            dirty(b);
            if (v.games > 0) {
                const rec = v.wins + " : " + v.losses, rw = Math.ceil(measure(b, rec, 13, true)) + 14;
                S.panel(ctx, ix + iw - rw - 5, iy + 5, rw, 20, { cut: 3, fill: "rgba(8,9,11,0.85)", accent: false }); dirty(b);
                txt(b, rec, ix + iw - rw - 5, iy + 5, rw, { size: 13, color: S.text, bold: true, align: "center", lh: 20 });
            }
            txt(b, o.short, x + 14, y + 144, w - 28, { size: 22, color: off ? S.muted : S.accent, bold: true });
            txt(b, o.role, x + 14, y + 172, w - 28, { size: 15, color: S.muted });
            const st = o.stakes, range = st.length > 1 ? st[0] + "–" + gold(st[st.length - 1]) : gold(st[0]);
            if (c.tired) txt(b, "Dziś już nie gra", x + 14, y + 194, w - 28, { size: 16, color: BAD, bold: true });
            else if (!c.afford) txt(b, range + " · za mała sakiewka", x + 14, y + 194, w - 28, { size: 16, color: BAD });
            else {
                txt(b, range, x + 14, y + 194, 90, { size: 16, color: S.text, bold: true });
                txt(b, o.style, x + 14, y + 194, w - 28, { size: 16, color: o.styleColor, align: "right" });
            }
            if (off) { ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(ix, iy, iw, ih); dirty(b); }
            if (foc && !sel) { ctx.strokeStyle = S.accent; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); dirty(b); }
            this.hits.push({ row: "cards", i: this.lobby.cards.indexOf(c), x, y, w, h });
        }
        drawRules(b) {
            const S = ST(), px = 120, py = 50, pw = 1040, ph = 618, ctx = b.context;
            this.dim(b, 0.6);
            panel(b, px, py, pw, ph, { cut: 10, fill: "rgba(11,12,15,0.985)" });
            txt(b, "JAK SIĘ GRA", px + 32, py + 20, 400, { size: 15, color: S.muted, bold: true });
            txt(b, "Zasady gry w kości", px + 32, py + 38, 600, { size: 38, color: S.accent, bold: true });
            const rules = [
                "Każdy ma sześć kości. Rzucasz wszystkimi naraz.",
                "Po każdym rzucie odkładasz co najmniej jedną punktującą kość. Potem zapisujesz punkty tury albo rzucasz dalej resztą kości.",
                "Rzut bez żadnej punktującej kości to „Pudło!” — punkty z tej tury przepadają.",
                "Odłożysz wszystkie sześć? „Gorące kości!” — rzucasz znowu całą szóstką, a punkty tury zostają.",
                "Liczą się tylko odłożone kości, a układy tylko w obrębie jednego rzutu.",
                "Wygrywa, kto pierwszy dojdzie do celu: 2000 punktów, przy małej stawce (do " + gold(QUICK_STAKE) + ") szybka partia do 1500. Zwycięzca bierze całą pulę."
            ];
            let y = py + 100;
            const cw = 452;
            for (const r of rules) {
                const ls = wrapLines(b, r, cw - 24, 18);
                b.fillRect(px + 38, y + 11, 6, 6, S.accent);
                for (const l of ls) { txt(b, l, px + 54, y, cw - 24, { size: 18, lh: 25 }); y += 25; }
                y += 9;
            }
            // the points, with little dice
            const tx = px + 540, tw = pw - 540 - 32;
            txt(b, "PUNKTY", tx, py + 104, 200, { size: 14, color: S.muted, bold: true });
            const rows = [
                [[1], "jedynka", "100"], [[5], "piątka", "50"], [[1, 1, 1], "trzy jedynki", "1000"],
                [[4, 4, 4], "trzy takie same", "oczko × 100"], [[4, 4, 4, 4], "cztery takie same", "× 2"],
                [[4, 4, 4, 4, 4], "pięć takich samych", "× 4"], [[4, 4, 4, 4, 4, 4], "sześć takich samych", "× 8"],
                [[1, 2, 3, 4, 5], "mały strit", "500"], [[2, 3, 4, 5, 6], "duży strit", "750"], [[1, 2, 3, 4, 5, 6], "pełny strit", "1500"]
            ];
            y = py + 130;
            rows.forEach(([faces, name, pts], i) => {
                if (i % 2 === 0) { ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.fillRect(tx - 8, y - 3, tw + 16, 38); }
                faces.forEach((f, j) => paintDie(ctx, tx + j * 27, y + 3, 24, f, "std"));
                txt(b, name, tx + 172, y + 3, 170, { size: 18, color: S.text });
                txt(b, pts, tx + tw - 130, y + 2, 130, { size: 19, color: S.accent, bold: true, align: "right" });
                y += 40;
            });
            dirty(b);
            txt(b, "Przykład: trzy czwórki to 400, cztery czwórki 800, pięć czwórek 1600.", tx - 8, y + 4, tw + 16, { size: 15, color: S.muted });
            b.fillRect(px + 32, py + ph - 64, pw - 64, 1, S.line);
            txt(b, "Zasady są zawsze pod przyciskiem „Zasady”.", px + 32, py + ph - 50, 600, { size: 16, color: S.muted });
            txt(b, "O — rozumiem, gramy", px + pw - 432, py + ph - 52, 400, { size: 21, color: S.accent, bold: true, align: "right" });
        }
        drawConfirm(b) {
            const S = ST(), g = this.game, pw = 560, ph = 236, px = (b.width - pw) / 2, py = (b.height - ph) / 2 - 20;
            this.dim(b, 0.55);
            panel(b, px, py, pw, ph, { cut: 10 });
            txt(b, "Odejść od stołu?", px + 30, py + 22, pw - 60, { size: 30, color: S.accent, bold: true });
            const text = "Partia trwa. Twoja stawka (" + gold(g.stake) + ") przepada, a " + g.opp.short + " zgarnia pulę.";
            let y = py + 76;
            for (const l of wrapLines(b, text, pw - 60, 19)) { txt(b, l, px + 30, y, pw - 60, { size: 19 }); y += 26; }
            [["Zostaję", px + 30, 230], ["Odchodzę", px + pw - 30 - 230, 230]].forEach(([label, x, w], i) => {
                drawButton(b, x, py + ph - 66, w, 44, label, { focus: this.confirmSel === i, primary: i === 0 });
                this.hits.push({ row: "confirm", i, x, y: py + ph - 66, w, h: 44 });
            });
        }
        drawEnd(b) {
            const S = ST(), g = this.game, m = g.match, rec = this.results[this.results.length - 1] || {}, won = !!rec.won;
            const gift = g.gift ? DIE_TYPES[g.gift] : null, blockWhy = this.againBlock(), boxed = !!(gift || g.giftGold);
            const pw = 780, ph = 404 + (boxed ? 88 : 0) + (boxed && blockWhy ? 26 : 0), px = TBL.x + (TBL.w - pw) / 2, py = TBL.y + (TBL.h - ph) / 2 - 6, ctx = b.context;
            this.dim(b, 0.35);
            panel(b, px, py, pw, ph, { cut: 10 });
            txt(b, "KONIEC PARTII · " + g.opp.name.toUpperCase(), px + 32, py + 20, pw - 64, { size: 15, color: S.muted, bold: true });
            txt(b, won ? "Wygrana!" : "Przegrana", px + 32, py + 38, 400, { size: 50, color: won ? S.accent : "#ff8f7f", bold: true });
            // the score
            const sc = "Ty  " + m.players[0].total + "  :  " + m.players[1].total + "  " + g.opp.short;
            txt(b, sc, px + pw - 432, py + 50, 400, { size: 24, color: S.text, bold: true, align: "right" });
            txt(b, "gra do " + m.target + " · tury: " + m.turnNo, px + pw - 432, py + 84, 400, { size: 15, color: S.muted, align: "right" });
            b.fillRect(px + 32, py + 116, pw - 64, 1, S.line);
            let y = py + 130;
            txt(b, won ? "+" + gold(g.pot + (g.giftGold || 0)) + " do sakiewki" : "Stawka przepada: −" + gold(g.stake), px + 32, y, 420, { size: 24, color: won ? GOOD : BAD, bold: true });
            if (won && g.xp) txt(b, "+" + g.xp + " dośw.", px + pw - 232, y + 4, 200, { size: 19, color: "#c9a6ff", bold: true, align: "right" });
            y += 44;
            const best = rec.best ? rec.best.name + " · " + rec.best.points : "—";
            txt(b, "Twój najlepszy rzut:  " + best, px + 32, y, pw - 64, { size: 18, color: S.text });
            y += 28;
            txt(b, "Pudła: " + m.players[0].busts + "   ·   gorące kości: " + m.players[0].hot + "   ·   w sakiewce: " + gold($gameParty.gold()), px + 32, y, pw - 64, { size: 17, color: S.muted });
            y += 40;
            const line = g.closing || "";
            if (line) {
                const ls = wrapLines(b, "„" + line + "”", pw - 110, 19);
                b.fillRect(px + 32, y + 2, 3, ls.length * 26 - 4, S.accentDim);
                for (const l of ls) { txt(b, l, px + 46, y, pw - 110, { size: 19, color: "#d8dde3" }); y += 26; }
                txt(b, "— " + g.opp.name, px + 46, y, pw - 110, { size: 16, color: S.muted });
                y += 30;
            }
            if (gift) {   // a special die from the rival
                const gy = py + ph - 62 - (blockWhy ? 36 : 12) - 78;
                S.panel(ctx, px + 32, gy, pw - 64, 78, { cut: 5, fill: "rgba(255,210,63,0.08)", line: S.accentDim, accent: false });
                paintDie(ctx, px + 48, gy + 11, 56, 1, g.gift);
                dirty(b);
                txt(b, "Nowa kość: " + gift.name, px + 124, gy + 10, pw - 180, { size: 21, color: S.accent, bold: true });
                txt(b, gift.effect, px + 124, gy + 40, pw - 180, { size: 16, color: S.text });
            } else if (g.giftGold) {   // the stranger's purse (the hero has his die already)
                const gy = py + ph - 62 - (blockWhy ? 36 : 12) - 78;
                S.panel(ctx, px + 32, gy, pw - 64, 78, { cut: 5, fill: "rgba(255,210,63,0.08)", line: S.accentDim, accent: false });
                const cb = coinBitmap();
                for (let i = 0; i < 4; i++) b.blt(cb, 0, 0, cb.width, cb.height, px + 50 + (i % 2) * 6, gy + 34 - i * 8, cb.width, cb.height);
                txt(b, "Sakiewka od nieznajomego: +" + gold(g.giftGold), px + 124, gy + 10, pw - 180, { size: 21, color: S.accent, bold: true });
                txt(b, "Kość z Kruczych Skał już masz - dostajesz złoto.", px + 124, gy + 40, pw - 180, { size: 16, color: S.text });
            }
            const by = py + ph - 62;
            if (blockWhy) txt(b, blockWhy, px + 32, by - 30, pw - 64, { size: 15, color: S.muted });
            const bw = 220, gap = 16, bx0 = px + pw - 32 - bw * 3 - gap * 2;
            this.endBtns.forEach((btn, i) => {
                const x = bx0 + i * (bw + gap);
                drawButton(b, x, by, bw, 44, btn.label, { focus: this.endSel === i && btn.enabled, disabled: !btn.enabled, primary: btn.primary });
                this.hits.push({ row: "end", i, x, y: by, w: bw, h: 44 });
            });
        }
    }


    P.art = {
        clamp, lerp, easeOut, easeInOut, easeBack, ST, GOOD, BAD, GOLD_TXT, FELT_GOLD, COIN_ICON, dirty, panel, bar, txt, measure, wrapLines, icon, keyHints, drawButton,
        tri, rr, soft, smoothBitmap, solidBitmap, LOOKS, paintDie, dieBitmap, miscBitmap, dieShadow, dieGlow, focusBitmap, cupBitmap, cupShadow, coinBitmap, potBitmap,
        candleBitmap, flameBitmap, glowBitmap, sparkBitmap, moteBitmap, dustBitmap, TBL, RIM, FELT, COL_W, ZONE, POT, HERO_COL, OPP_COL, paintTable,
        DieSprite, CupSprite, BubbleSprite, FloatText, Particle, se, SND, snd, BUST_H, HEADER, SIDE_L, SIDE_R, BAR, HINT, BTN, DicePanels
    };
})();
