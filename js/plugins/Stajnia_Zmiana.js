//=============================================================================
// Stajnia_Zmiana.js
//=============================================================================
// The stable shift ("zmiana w stajni"): a mini-game scene in the spirit of TavernShift.js (the same keys, cards, HUD, summary, the
// same Scene_MiniGame base, the Hall's Part / Figure / Prompt), four short parts of about 45 seconds each (about 3 minutes):
//  1. Obrządek - curry the three horses (hold O) and comb their manes; a horse that turns restless kicks if O is still held
//  2. Karmienie i pojenie - each horse's portion is on its board (oats, hay, water); water is scarce: the barrel holds a little more
//     than needed, running with a full bucket spills it
//  3. Gnój i słoma - muck out the boxes with the barrow, dump it on the heap, spread fresh straw
//  4. Konie podróżnych - horses of the ferry's travellers: take, put in a free box (the door closes, the number stays on it: remember
//     which), bring back saddled when the traveller asks; tips for speed and no mistakes
// The pay, the trust and the hours are Stajnia.js's (Stajnia.applyResult, called when the scene leaves). Texts: js/teksty/stajnia.txt.
// The look: the yard is drawn once into a picture (cached), the props are cut out of the map's own sheets (!Miasto2_Wnetrza and
// !House_Town: the horses, the hay, the saddle, the barrels), the people are the hero's and the travellers' map sheets.

/*:
 * @target MZ
 * @plugindesc Zmiana w stajni (Stajnia.js): mini-gra w czterech częściach - obrządek, karmienie i pojenie, gnój i słoma, konie podróżnych. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TawernaUI
 * @orderAfter TawernaUI
 * @base TavernShift_Parts
 * @orderAfter TavernShift_Parts
 * @orderAfter Stajnia
 *
 * @help
 * ============================================================================
 * Stajnia_Zmiana.js - zmiana w stajni
 * ============================================================================
 * Rano (5-13) raz dziennie: cztery części po około 45 sekund. Sterowanie jak
 * w zmianie w tawernie: WSAD / strzałki - ruch, Shift - szybciej, O - akcja
 * (przytrzymaj przy zgrzeble i widłach), P - pauza.
 * Płaca: dniówka (8 G + 2 G za poziom trudności) + premie za części + napiwki
 * podróżnych, pomniejszone o potrącenia. Zmiana trwa 3 godziny i kosztuje 25
 * wytrzymałości. Stan: Stajnia.js (zaufanie Szczepana).
 * Dla fabuły: Stajnia.startShift({ onEnd(wynik) }) albo Stajnia_Zmiana.start.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;
    if (!TW || !TW.ui || !TW.ui.Scene_MiniGame) throw new Error("Stajnia_Zmiana.js: brak TawernaCore.js / TawernaUI.js (the Tawerna core or the UI kit is missing)");
    if (TW.api("Stajnia_Zmiana")) return;
    const P = TW.api("TavernShift_parts");
    if (!P || !P.kit || !P.hall || !P.parts) throw new Error("Stajnia_Zmiana.js: musi być pod TavernShift_Parts na liście wtyczek (the tavern shift's family is missing)");
    const ui = TW.ui;
    const TK = Watki.teksty("stajnia");   // (the words of this file: js/teksty/stajnia.txt, scena.*)
    const get = key => { let o = TK; for (const p of String(key).split(".")) { if (!o || typeof o !== "object") return undefined; o = o[p]; } return o; };
    const W = (key, v) => { const t = get(key); return typeof t === "string" ? Watki.wstaw(t, v) : ""; };
    const L = key => { const t = get(key); return Array.isArray(t) ? t : typeof t === "string" ? [t] : []; };
    const { ST, GOOD, BAD, WARN, clamp, lerp, scoreColour, se, dirty, panel, bar, txt, measure, wrapLines, icon, keyCap, showIf, solidBitmap, TIP_SCALE } = P.kit;
    const { T, Figure, Part, heroLook, PEOPLE, Prompt, fmtTime, drawLegend, standPt, dirOf, ROOM_X, ROOM_Y, RC, RR, SIDE } = P.hall;

    const HOURS = 3, STAMINA = 25, BASE_WAGE = 8, MAX_LEVEL = 5;
    const BUST = "Kolodziej_Bust";
    const REACH = 32;
    const CELL = 144;   // the map sheets' cell
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const shuffle = (list, rng) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    // ==================================================================
    // Data
    // ==================================================================
    const PART_DEFS = {
        groom: { weight: 0.22, bonus: 3 },
        feed:  { weight: 0.28, bonus: 4 },
        muck:  { weight: 0.22, bonus: 3 },
        guests: { weight: 0.28, bonus: 6 }
    };
    // (the words are read when asked: the texts of the files are filled after the plugins load)
    for (const id of Object.keys(PART_DEFS)) Object.defineProperties(PART_DEFS[id], { title: { get: () => W("czesci." + id + ".tytul") }, sub: { get: () => W("czesci." + id + ".podtytul") } });
    const PART_ORDER = ["groom", "feed", "muck", "guests"];
    const GRADES = [null, 1, 2, 3, 4, 5].map(g => (g ? { get name() { return W("oceny." + g + ".nazwa"); }, get say() { return W("oceny." + g + ".powiedzenie"); } } : null));
    const gradeOf = s => (s >= 88 ? 5 : s >= 72 ? 4 : s >= 52 ? 3 : s >= 32 ? 2 : 1);
    const COATS = ["gniady", "siwy", "kary"];   // the columns 0-2 of the horses on the map's sheet
    const HORSES = [{ name: "Kasztan", coat: 0 }, { name: "Siwek", coat: 1 }, { name: "Węgiel", coat: 2 }];   // the stable's own, boxes 1-3
    function levelCfg(Lv) {
        return {
            groom: { time: Math.round((46 - Lv) * 60), curry: 96 + 6 * Lv, comb: 54 + 3 * Lv, wait: [150 - 8 * Lv, 250 - 12 * Lv], warn: 26, snap: 44 },
            feed: { time: Math.round((54 - Lv) * 60), oats: [1, 2], hay: [1, 2], water: [1, 2], spare: Lv >= 2 ? 1 : 2, cap: 2, spill: 44 },
            muck: { time: Math.round((56 - Lv) * 60), piles: 5 + (Lv >= 3 ? 1 : 0) + (Lv >= 5 ? 1 : 0), scoop: 26, cap: 3, strawCap: 2 },
            guests: {
                time: Math.round((78 - 2 * Lv) * 60), n: 3 + (Lv >= 3 ? 1 : 0) + (Lv >= 5 ? 1 : 0),
                arrive: [90, 780, 1500, 2300, 3000], lag: [1000, 900, 800, 700, 600].map(x => x - 40 * Lv),
                patienceIn: (20 - Lv) * 60, patienceOut: Math.round((24 - 1.5 * Lv) * 60)
            }
        };
    }

    // ==================================================================
    // The yard: 19 x 13 tiles (the tavern hall's size and place on the screen), three boxes in two rows, the stations along the bottom
    // ==================================================================
    const BOX_TX = [1, 7, 13], BOX_W = 5, BOX_H = 3;
    const BOXES = [];
    [1, 7].forEach((ty, r) => BOX_TX.forEach((tx, k) => BOXES.push({ i: r * 3 + k, row: r ? "B" : "A", tx, ty, w: BOX_W, h: BOX_H, num: r * 3 + k + 1, front: r ? ty : ty + BOX_H - 1 })));
    const STATION = {
        water: { tx: 1, ty: 10, w: 2, h: 2 }, oats: { tx: 4, ty: 10, w: 2, h: 2 }, saddle: { tx: 7, ty: 11, w: 1, h: 1 }, barrow: { tx: 8, ty: 11, w: 1, h: 1 },
        hay: { tx: 13, ty: 10, w: 3, h: 2 }, manure: { tx: 16, ty: 10, w: 2, h: 2 }, door: { tx: 8, ty: 12, w: 3, h: 1 }
    };
    const inRect = (r, tx, ty) => tx >= r.tx && tx < r.tx + r.w && ty >= r.ty && ty < r.ty + r.h;
    const rectPx = r => ({ x: r.tx * T, y: r.ty * T, w: r.w * T, h: r.h * T });
    // the sheets' props: [sheet, col, row, x0, y0, x1, y1] of the cell (the content's box, measured), drawn bottom-centre
    const PROPS = {
        horse: ["!Miasto2_Wnetrza", 0, 0, 56, 75, 136, 144], saddle: ["!Miasto2_Wnetrza", 0, 2, 47, 92, 97, 144], hay: ["!Miasto2_Wnetrza", 2, 2, 7, 48, 137, 144],
        trough: ["!Miasto2_Wnetrza", 0, 3, 49, 100, 142, 144], straw: ["!Miasto2_Wnetrza", 2, 3, 52, 107, 91, 144], fork: ["!Miasto2_Wnetrza", 6, 3, 61, 77, 81, 144],
        water: ["!House_Town", 3, 0, 51, 89, 92, 144], oats: ["!House_Town", 4, 0, 48, 58, 95, 144], bucket: ["!House_Town", 1, 3, 51, 98, 92, 144],
        cart: ["!House_Town", 1, 1, 48, 62, 144, 144]
    };
    const propFrame = (key, col) => { const p = PROPS[key]; return [(col === undefined ? p[1] : col) * CELL + p[3], p[2] * CELL + p[4], p[5] - p[3], p[6] - p[4]]; };
    function propSprite(key, col) {
        const p = PROPS[key], f = propFrame(key, col), s = new Sprite(ImageManager.loadCharacter(p[0]));
        s.setFrame(f[0], f[1], f[2], f[3]);
        s.anchor.set(0.5, 1);
        return s;
    }
    const seeded = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

    // the gate of a box: two rails, three posts (oy: the bitmap's top in room px), and the plate with the number
    function railsOf(c, bx, oy) {
        const x = bx.tx * T, y = bx.ty * T - oy, w = bx.w * T, h = bx.h * T;
        const ry = bx.row === "A" ? [y + h - 30, y + h - 14] : [y + 8, y + 22];
        for (const q of ry) { c.fillStyle = "#8a6338"; c.fillRect(x - 6, q, w + 12, 7); c.fillStyle = "#4a3320"; c.fillRect(x - 6, q + 7, w + 12, 3); }
        for (const px of [x - 6, x + w / 2 - 4, x + w - 2]) { c.fillStyle = "#6e4d2c"; c.fillRect(px, bx.row === "A" ? y + h - 36 : y + 2, 8, 40); c.fillStyle = "#3a2716"; c.fillRect(px, bx.row === "A" ? y + h - 36 : y + 2, 2, 40); }
    }
    function plateOf(b, bx, oy) {
        const cx = bx.tx * T + bx.w * T / 2, cy = (bx.row === "A" ? bx.ty * T + bx.h * T - 40 : bx.ty * T + 40) - oy;
        b.fillRect(cx - 17, cy - 12, 34, 24, "#2f2014"); b.fillRect(cx - 15, cy - 10, 30, 20, "#c8a15a");
        txt(b, String(bx.num), cx - 15, cy - 14, 30, { size: 20, color: "#2a1a0c", bold: true, align: "center" });
    }
    // the gates of the upper row drawn over the horses and the piles behind them (a small picture of its own, made once)
    const RAILS_Y = 146;
    let railsCache = null;
    function railsACanvas() {
        if (railsCache) return railsCache;
        const b = new Bitmap(RC * T, 56), c = b.context;
        for (const bx of BOXES) if (bx.row === "A") railsOf(c, bx, RAILS_Y);
        dirty(b);
        for (const bx of BOXES) if (bx.row === "A") plateOf(b, bx, RAILS_Y);
        return (railsCache = b);
    }
    // the yard's picture: the floor, the wall, the boxes; drawn once (the cache), 912 x 624
    let bgCache = null;
    function yardBgCanvas() {
        if (bgCache) return bgCache;
        const WD = RC * T, HT = RR * T, b = new Bitmap(WD, HT), c = b.context, r = seeded(181);
        c.fillStyle = "#65513b"; c.fillRect(0, 0, WD, HT);
        const dirt = ["#5a4731", "#70593f", "#614d38", "#7a6347", "#54422f"];
        for (let i = 0; i < 2200; i++) { c.fillStyle = dirt[Math.floor(r() * dirt.length)]; c.fillRect(Math.floor(r() * WD), Math.floor(r() * HT), 2 + Math.floor(r() * 5), 1 + Math.floor(r() * 3)); }
        // the aisle in the middle (worn boards from the door up to the boxes) and the door's sill
        c.fillStyle = "#7d6446"; c.fillRect(8 * T, 5 * T + 10, 3 * T, 7 * T - 10);
        for (let y = 5 * T + 10; y < HT; y += 16) { c.fillStyle = (y / 16) % 2 ? "#735b3f" : "#836a4b"; c.fillRect(8 * T, y, 3 * T, 14); c.fillStyle = "#4a3822"; c.fillRect(8 * T, y + 14, 3 * T, 2); }
        c.fillStyle = "#a68d68"; c.fillRect(8 * T - 4, HT - 22, 3 * T + 8, 22);   // (the sill: daylight)
        c.fillStyle = "#3b2a1a"; c.fillRect(8 * T - 10, HT - 150, 10, 150); c.fillRect(11 * T, HT - 150, 10, 150);   // (the door's posts)
        // the top wall: upright boards, a beam, the shadow under it
        for (let x = 0; x < WD; x += 24) { c.fillStyle = (x / 24) % 2 ? "#4d3826" : "#44301f"; c.fillRect(x, 0, 24, T); c.fillStyle = "#2a1d12"; c.fillRect(x, 0, 2, T); }
        c.fillStyle = "#6e4d2c"; c.fillRect(0, 30, WD, 10); c.fillStyle = "#2a1d12"; c.fillRect(0, 40, WD, 3);
        c.fillStyle = "rgba(0,0,0,0.28)"; c.fillRect(0, T, WD, 10);
        // the boxes: a straw floor, the posts, the back board, the rails of the gate and the plate with the number
        for (const bx of BOXES) {
            const x = bx.tx * T, y = bx.ty * T, w = bx.w * T, h = bx.h * T;
            c.fillStyle = "#b09353"; c.fillRect(x, y, w, h);
            for (let i = 0; i < 260; i++) { c.fillStyle = ["#c9ab63", "#9c8247", "#d4b872", "#8f7740"][Math.floor(r() * 4)]; c.fillRect(x + Math.floor(r() * (w - 4)), y + Math.floor(r() * (h - 2)), 3 + Math.floor(r() * 9), 1); }
            c.fillStyle = "rgba(60,40,20,0.35)"; c.fillRect(x, y, w, 8);
            c.fillStyle = "#5a3d22"; c.fillRect(x - 6, y, 8, h); c.fillRect(x + w - 2, y, 8, h);          // (the side posts)
            c.fillStyle = "#3a2716"; c.fillRect(x - 6, y, 2, h); c.fillRect(x + w + 4, y, 2, h);
            if (bx.row === "B") { c.fillStyle = "#4d3523"; c.fillRect(x - 6, y + h - 8, w + 12, 10); }   // (the back board of the lower row)
            if (bx.row === "B") railsOf(c, bx, 0);
        }
        dirty(b);
        for (const bx of BOXES) if (bx.row === "B") plateOf(b, bx, 0);
        return (bgCache = b);
    }
    // the room as baked pictures (tools/stajnia/wnetrze.py: the inside of the log stable); the canvas drawing above only when a file is missing
    const roomPic = name => ui.safeBitmap("img/pictures/" + name + ".png");
    const picOk = b => b.isReady() && !b.isError();
    const yardBg = () => { const b = roomPic("Stajnia_Wnetrze"); return picOk(b) ? b : yardBgCanvas(); };
    const railsA = () => { const b = roomPic("Stajnia_Wnetrze_Gora"); return picOk(b) ? b : railsACanvas(); };
    // a number plate (only with the baked pictures: the canvas drawing paints its own)
    const plateCache = {};
    function plateBitmap(num) {
        if (plateCache[num]) return plateCache[num];
        const b = new Bitmap(36, 28);
        b.fillRect(0, 0, 36, 28, "#2f2014"); b.fillRect(2, 2, 32, 24, "#c8a15a");
        txt(b, String(num), 3, 0, 30, { size: 20, color: "#2a1a0c", bold: true, align: "center" });
        return (plateCache[num] = b);
    }
    // the closed door of a box (over the horse): planks, a strap, the number
    let doorCache = null;
    function doorBitmap(num) {
        doorCache = doorCache || {};
        if (doorCache[num]) return doorCache[num];
        const w = BOX_W * T - 6, h = BOX_H * T - 8, b = new Bitmap(w, h), c = b.context;
        for (let x = 0; x < w; x += 20) { c.fillStyle = (x / 20) % 2 ? "#6d4a2a" : "#5f3f23"; c.fillRect(x, 0, 20, h); c.fillStyle = "#2c1d11"; c.fillRect(x, 0, 2, h); }
        c.fillStyle = "#2c1d11"; c.fillRect(0, 22, w, 8); c.fillRect(0, h - 30, w, 8); c.fillStyle = "#8a6a3a"; c.fillRect(0, 23, w, 2); c.fillRect(0, h - 29, w, 2);
        c.fillStyle = "#2f2014"; c.fillRect(w / 2 - 22, h / 2 - 17, 44, 34); c.fillStyle = "#c8a15a"; c.fillRect(w / 2 - 20, h / 2 - 15, 40, 30);
        dirty(b);
        txt(b, String(num), w / 2 - 20, h / 2 - 20, 40, { size: 28, color: "#2a1a0c", bold: true, align: "center" });
        return (doorCache[num] = b);
    }
    // a small barrow drawn in code (no picture of one on the sheets): 52 x 34
    let barrowCache = null;
    function barrowBitmap() {
        if (barrowCache) return barrowCache;
        const b = new Bitmap(56, 36), c = b.context;
        c.fillStyle = "#3b2a1a"; c.fillRect(0, 12, 16, 3); c.fillRect(0, 22, 16, 3); c.fillRect(2, 12, 3, 13);      // (the handles)
        c.fillStyle = "#7a5733"; c.beginPath(); c.moveTo(14, 6); c.lineTo(52, 6); c.lineTo(46, 24); c.lineTo(20, 24); c.closePath(); c.fill();
        c.fillStyle = "#4d3622"; c.fillRect(14, 6, 38, 3); c.fillRect(20, 21, 26, 3);
        c.fillStyle = "#2a2118"; c.beginPath(); c.arc(46, 27, 7, 0, 7); c.fill(); c.fillStyle = "#6b5a46"; c.beginPath(); c.arc(46, 27, 3, 0, 7); c.fill();
        dirty(b);
        return (barrowCache = b);
    }
    const heapBitmap = (() => {
        let cache = null;
        return () => {
            if (cache) return cache;
            const b = new Bitmap(92, 56), c = b.context, r = seeded(5);
            c.fillStyle = "rgba(20,12,4,0.35)"; c.beginPath(); c.ellipse(46, 46, 44, 9, 0, 0, 7); c.fill();                 // (the shadow)
            c.fillStyle = "#3b3a1f"; c.beginPath(); c.ellipse(46, 38, 42, 15, 0, 0, 7); c.fill();                           // (a dark brown-green base)
            c.fillStyle = "#4f4a26"; c.beginPath(); c.ellipse(46, 30, 34, 17, 0, 0, 7); c.fill();
            c.fillStyle = "#615a30"; c.beginPath(); c.ellipse(42, 22, 22, 10, 0, 0, 7); c.fill();                           // (the lit top)
            for (let i = 0; i < 90; i++) { c.fillStyle = ["#6e6a38", "#34311a", "#4a3a1e", "#8a7a3c"][Math.floor(r() * 4)]; c.fillRect(10 + Math.floor(r() * 72), 12 + Math.floor(r() * 32), 2 + Math.floor(r() * 4), 1 + Math.floor(r() * 2)); }
            for (let i = 0; i < 16; i++) { c.fillStyle = ["#e0c878", "#c9aa5c", "#f0dc9c"][i % 3]; c.fillRect(14 + Math.floor(r() * 62), 10 + Math.floor(r() * 30), 5 + Math.floor(r() * 7), 1); }   // (straw bits)
            c.fillStyle = "rgba(255,244,190,0.38)"; c.beginPath(); c.ellipse(38, 17, 13, 4, -0.3, 0, 7); c.fill();         // (a highlight)
            dirty(b);
            return (cache = b);
        };
    })();
    const pileBitmap = (() => {
        let cache = null;
        return () => {
            if (cache) return cache;
            const b = new Bitmap(40, 26), c = b.context, r = seeded(9);
            c.fillStyle = "#35261a"; c.beginPath(); c.ellipse(20, 17, 18, 8, 0, 0, 7); c.fill();
            c.fillStyle = "#4a3722"; c.beginPath(); c.ellipse(20, 13, 14, 8, 0, 0, 7); c.fill();
            for (let i = 0; i < 26; i++) { c.fillStyle = ["#6b5236", "#8a7440", "#2c2016"][Math.floor(r() * 3)]; c.fillRect(8 + Math.floor(r() * 24), 7 + Math.floor(r() * 12), 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2)); }
            dirty(b);
            return (cache = b);
        };
    })();
    const freshStrawBitmap = (() => {
        let cache = null;
        return () => {
            if (cache) return cache;
            const b = new Bitmap(44, 26), c = b.context, r = seeded(13);
            c.fillStyle = "#d6bd70"; c.beginPath(); c.ellipse(22, 14, 20, 9, 0, 0, 7); c.fill();
            for (let i = 0; i < 40; i++) { c.fillStyle = ["#e8d28a", "#caa95a", "#f0dc9c"][Math.floor(r() * 3)]; c.fillRect(4 + Math.floor(r() * 34), 5 + Math.floor(r() * 16), 5 + Math.floor(r() * 7), 1); }
            dirty(b);
            return (cache = b);
        };
    })();
    // the tiny glyphs of the portions (oats, hay, water) on the boards: drawn in code, 14 x 14
    function drawPortion(b, kind, x, y, filled) {
        const c = b.context;
        c.save();
        c.globalAlpha = filled ? 1 : 0.35;
        if (kind === "oats") { c.fillStyle = "#e3c04a"; c.beginPath(); c.ellipse(x + 7, y + 7, 3.5, 6.5, 0.5, 0, 7); c.fill(); c.fillStyle = "#a8862a"; c.fillRect(x + 6, y + 9, 2, 5); }
        else if (kind === "hay") { c.strokeStyle = "#d0b765"; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + 3 + i * 3, y + 13); c.lineTo(x + 1 + i * 4, y + 2); c.stroke(); } }
        else { c.fillStyle = "#5fb4ee"; c.beginPath(); c.moveTo(x + 7, y); c.quadraticCurveTo(x + 14, y + 8, x + 7, y + 14); c.quadraticCurveTo(x, y + 8, x + 7, y); c.fill(); }
        c.restore();
        dirty(b);
    }

    class Yard {
        constructor(part) {
            this.part = part;
            this.root = new Sprite();
            this.root.x = ROOM_X;
            this.root.y = ROOM_Y;
            this.bg = new Sprite(yardBg());
            this.root.addChild(this.bg);
            this.floor = new Sprite();   // (piles, straw: on the floor, under everyone)
            this.chars = new Sprite();
            this.over = new Sprite();
            this.root.addChild(this.floor);
            this.root.addChild(this.chars);
            this.root.addChild(this.over);
            this.railsA = new Sprite(railsA());
            this.railsA.y = RAILS_Y;
            this.over.addChild(this.railsA);
            if (this.bg.bitmap !== bgCache) for (const bx of BOXES) {   // (baked pictures: the plates are put on)
                const pl = new Sprite(plateBitmap(bx.num));
                pl.x = bx.tx * T + bx.w * T / 2 - 18; pl.y = (bx.row === "A" ? bx.ty * T + bx.h * T - 40 : bx.ty * T + 40) - 14;
                (bx.row === "A" ? this.over : this.floor).addChild(pl);
            }
            this.blocked = new Set();
            for (const bx of BOXES) for (let y = bx.ty; y < bx.ty + bx.h; y++) for (let x = bx.tx; x < bx.tx + bx.w; x++) this.blocked.add(x + "," + y);
            for (const k of Object.keys(STATION)) if (k !== "door") { const s = STATION[k]; for (let y = s.ty; y < s.ty + s.h; y++) for (let x = s.tx; x < s.tx + s.w; x++) this.blocked.add(x + "," + y); }
            this.stationSprites();
            this.shadeSprite();
        }
        // the props of the stations (bottom-centred on their rectangles), sorted among the people by their feet
        stationSprites() {
            const add = (spr, x, y) => { spr.x = Math.round(x); spr.y = Math.round(y); spr._sid = -1; this.chars.addChild(spr); return spr; };
            const mid = r => ({ x: (r.tx + r.w / 2) * T, y: (r.ty + r.h) * T });
            let p = mid(STATION.water); const barrel = add(propSprite("water"), p.x, p.y - 4); barrel.scale.set(1.5);
            p = mid(STATION.oats); add(propSprite("oats"), p.x, p.y - 2);
            p = mid(STATION.saddle); add(propSprite("saddle"), p.x, p.y - 2);
            p = mid(STATION.hay); add(propSprite("hay"), p.x, p.y - 2);
            this.barrowPark = new Sprite(barrowBitmap());
            this.barrowPark.anchor.set(0.5, 1);
            p = mid(STATION.barrow);
            add(this.barrowPark, p.x, p.y - 2);
            this.heap = new Sprite(heapBitmap());
            this.heap.anchor.set(0.5, 1);
            p = mid(STATION.manure);
            add(this.heap, p.x, p.y - 2);
            this.heap.scale.set(1.15);
                        this.setHeap(0);
        }
        setHeap(n) { this.heap.alpha = clamp(0.9 + n * 0.03, 0.9, 1); this.heap.scale.set(0.9 + Math.min(n, 6) * 0.09); }
        shadeSprite() {   // a soft vignette over the yard (one picture, made once)
            if (!Yard._vig) {
                const b = new Bitmap(RC * T, RR * T), c = b.context, g = c.createRadialGradient(RC * T / 2, RR * T / 2, 200, RC * T / 2, RR * T / 2, 560);
                g.addColorStop(0, "rgba(10,6,2,0)"); g.addColorStop(1, "rgba(10,6,2,0.5)");
                c.fillStyle = g; c.fillRect(0, 0, RC * T, RR * T);
                dirty(b);
                Yard._vig = b;
            }
            this.vig = new Sprite(Yard._vig);
            this.root.addChild(this.vig);
            this.root.removeChild(this.over);
            this.root.addChild(this.over);
        }
        addFigure(look, tx, ty, dir) {
            const f = new Figure(look), p = standPt(tx, ty);
            f.x = p.x; f.y = p.y + 4; f.dir = dir || 2;
            f.refresh();
            this.chars.addChild(f);
            return f;
        }
        // a horse in a box (the coat 0-2), drawn bottom-centre in the box; mirrored in the lower row (it faces the aisle)
        horseSprite(coat, bx, big) {
            const s = propSprite("horse", coat);
            s.scale.set(1.5, 1.5);
            this.placeHorse(s, bx);
            this.chars.addChild(s);
            s._sid = -2;
            return s;
        }
        placeHorse(s, bx) {
            s.x = bx.tx * T + bx.w * T / 2 + (bx.row === "A" ? 0 : 0);
            s.y = bx.row === "A" ? (bx.ty + bx.h) * T - 30 : (bx.ty + bx.h) * T - 12;
            s.scale.x = Math.abs(s.scale.x) * (bx.row === "A" ? 1 : -1);
        }
        walkable(tx, ty) { return tx >= 0 && tx < RC && ty >= 1 && ty < RR && !this.blocked.has(tx + "," + ty); }
        free(x, y) {
            const x0 = Math.floor((x - 11) / T), x1 = Math.floor((x + 11) / T), y0 = Math.floor((y - 10) / T), y1 = Math.floor((y + 2) / T);
            for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!this.walkable(tx, ty)) return false;
            return true;
        }
        move(h, dx, dy) {
            let moved = 0;
            if (dx) {
                if (this.free(h.x + dx, h.y)) { h.x += dx; moved += Math.abs(dx); } else if (!dy) {
                    for (let s = 1; s <= 14; s++) {
                        if (this.free(h.x + dx, h.y - s) && this.free(h.x, h.y - Math.min(2, s))) { h.y -= Math.min(2, s); moved += 1; break; }
                        if (this.free(h.x + dx, h.y + s) && this.free(h.x, h.y + Math.min(2, s))) { h.y += Math.min(2, s); moved += 1; break; }
                    }
                }
            }
            if (dy) {
                if (this.free(h.x, h.y + dy)) { h.y += dy; moved += Math.abs(dy); } else if (!dx) {
                    for (let s = 1; s <= 14; s++) {
                        if (this.free(h.x - s, h.y + dy) && this.free(h.x - Math.min(2, s), h.y)) { h.x -= Math.min(2, s); moved += 1; break; }
                        if (this.free(h.x + s, h.y + dy) && this.free(h.x + Math.min(2, s), h.y)) { h.x += Math.min(2, s); moved += 1; break; }
                    }
                }
            }
            return moved;
        }
        tileOf(x, y) { return { tx: Math.floor(x / T), ty: Math.floor((y - 6) / T) }; }
        path(fx, fy, gx, gy) {
            const s = this.tileOf(fx, fy), g = this.tileOf(gx, gy);
            const cells = TW.grid.astar8({ w: RC, h: RR, sx: s.tx, sy: s.ty, own: true, open: (x, y) => this.walkable(x, y), goal: (x, y) => x === g.tx && y === g.ty, est: (x, y) => Math.hypot(g.tx - x, g.ty - y) });
            return cells && cells.map(c => standPt(c % RC, Math.floor(c / RC)));
        }
        // the free tiles beside a rectangle (4 ways) as stand points
        stands(r) {
            const out = [], seen = new Set();
            for (let y = r.ty; y < r.ty + r.h; y++) for (let x = r.tx; x < r.tx + r.w; x++) {
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const tx = x + dx, ty = y + dy, k = tx + "," + ty;
                    if (inRect(r, tx, ty) || seen.has(k) || !this.walkable(tx, ty)) continue;
                    seen.add(k);
                    out.push(standPt(tx, ty));
                }
            }
            return out;
        }
        // the stand points of a station that are nearer to it than to any other station (a bot standing between two would work the wrong one)
        standsOf(key, rivals) {
            const own = rectPx(STATION[key]), others = (rivals || []).filter(k => k !== key).map(k => rectPx(STATION[k])).concat(BOXES.map(rectPx));
            const list = this.stands(STATION[key]).filter(p => { const h = { x: p.x, y: p.y }, d = this.reach(h, own); return others.every(o => this.reach(h, o) > d + 0.5); });
            return list.length ? list : this.stands(STATION[key]);
        }
        reach(h, r) {
            const px = h.x, py = h.y - 12, dx = Math.max(r.x - px, 0, px - (r.x + r.w)), dy = Math.max(r.y - py, 0, py - (r.y + r.h));
            return Math.hypot(dx, dy);
        }
        nearest(h, targets) {
            let best = null, bd = REACH + 0.001;
            for (const tg of targets) { const d = this.reach(h, tg.rect); if (d < bd) { bd = d; best = tg; } }
            return best;
        }
        sortChars() { this.chars.children.sort((a, b) => (a.y + (a._yoff || 0)) - (b.y + (b._yoff || 0)) || (a._sid || 0) - (b._sid || 0)); }
    }

    // ==================================================================
    // The common frame of the four parts: the yard, the hero, what he carries, the prompt, the side panel
    // ==================================================================
    const CARRY = {   // what the hands hold: the sheet's prop and the word
        oats: { prop: "oats", scale: 0.55 }, hay: { prop: "hay", scale: 0.4 }, water: { prop: "bucket", scale: 1 }, saddle: { prop: "saddle", scale: 1 }, straw: { prop: "straw", scale: 1 }
    };
    class YardPart extends Part {
        setup() {
            this.yard = new Yard(this);
            this.root.addChild(this.yard.root);
            const sp = standPt(9, 5);
            this.hero = { x: sp.x, y: sp.y, fig: null, hands: null, lead: null, stun: 0, moved: 0, runT: 0 };
            this.hero.fig = this.yard.addFigure(heroLook(), 9, 5, 8);
            this.hero.fig._sid = 1000;
            this.carry = new Sprite(new Bitmap(88, 60));
            this.carry.anchor.set(0.5, 1);
            this.carry.visible = false;
            this.yard.over.addChild(this.carry);
            this.prompt = new Prompt();
            this.yard.over.addChild(this.prompt);
            this.side = new Sprite(new Bitmap(SIDE.w, SIDE.h));
            this.side.x = SIDE.x; this.side.y = SIDE.y;
            this.root.addChild(this.side);
            this._sideKey = "";
            super.setup();
        }
        // the hero walks: keys -> move (a multiplier for the load; run: Shift may speed him up)
        walk(k, mul, run) {
            const h = this.hero, dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
            const sp = (run && k.shift ? 5.4 : 4.2) * (mul || 1), f = dx && dy ? Math.SQRT1_2 : 1;
            const moved = dx || dy ? this.yard.move(h, dx * sp * f, dy * sp * f) : 0;
            h.fig.moving = moved > 0.1;
            if (dx || dy) h.fig.dir = h.fig.look.eight ? dirOf(dx, dy) : dirOf(dy ? 0 : dx, dy);
            h.fig.advance(moved);
            h.fig.x = h.x; h.fig.y = h.y + 4;
            h.fig.refresh();
            h.moved = moved;
            h.running = !!(run && k.shift && moved > 0.1);
            return moved;
        }
        idle() { const h = this.hero; h.fig.moving = false; h.fig.refresh(); h.moved = 0; h.running = false; }
        setHands(kind, n) {
            const h = this.hero;
            h.hands = kind ? { kind, n: n || 1 } : null;
            this.drawCarry();
        }
        drawCarry() {
            const h = this.hero.hands, spr = this.carry;
            showIf(spr, h);
            if (!h) return;
            const b = spr.bitmap, def = CARRY[h.kind], p = PROPS[def.prop], f = propFrame(def.prop), sheet = ImageManager.loadCharacter(p[0]);
            b.clear();
            const w = Math.round(f[2] * def.scale), hh = Math.round(f[3] * def.scale);
            b.context.imageSmoothingEnabled = false;
            b.blt(sheet, f[0], f[1], f[2], f[3], Math.round((88 - w) / 2), 60 - hh - 4, w, hh);
            if (h.n > 1) txt(b, "x" + h.n, 52, 34, 34, { size: 18, color: ST().accent, bold: true, outline: 4 });
        }
        placeCarry() { const h = this.hero; this.carry.x = Math.round(h.x); this.carry.y = Math.round(h.y - 40); }
        showPrompt(tg, label) {
            if (!tg) { this.prompt.hide(); return; }
            this.prompt.show(label !== undefined ? label : tg.label, tg.rect.x + tg.rect.w / 2, tg.at === "box" ? tg.rect.y + 70 : tg.rect.y - 6, tg.hold ? tg.ratio : undefined, tg.busy);
        }
        // the side panel: a title, the lines, the keys; redrawn when `key` changes
        drawSide(key, draw) {
            if (key === this._sideKey) return;
            this._sideKey = key;
            const b = this.side.bitmap;
            b.clear();
            panel(b, 0, 0, SIDE.w, SIDE.h, { cut: 8, fill: "rgba(11,12,15,0.92)" });
            draw(b, ST());
            drawLegend(b, 18, SIDE.h - 120, [[["up", "left", "down", "right"], W("scena.klawisze.ruch")], [["Shift"], W("scena.klawisze.szybciej")], [["O"], W("scena.klawisze.akcja")], [["P"], W("scena.klawisze.pauza")]]);
        }
        end(score, data, good, bad) { this.complete(score, data, good, bad); }
        timeBonus(left, limit, share) { return Math.min(1, left / (limit * (share || 0.35))); }
    }

    // ==================================================================
    // Part 1: Obrządek (curry the horses, comb the manes)
    // ==================================================================
    class PartGroom extends YardPart {
        setup() {
            const c = this.cfg;
            this.limit = c.time;
            super.setup();
            const r = this.rng;
            this.horses = HORSES.map((H, i) => ({ i, name: H.name, coat: H.coat, curry: 0, comb: 0, wait: Math.round(c.wait[0] + r() * (c.wait[1] - c.wait[0])), warn: 0, snap: 0, spr: null, dust: 0 }));
            for (const h of this.horses) { h.spr = this.yard.horseSprite(h.coat, BOXES[h.i]); h.baseX = h.spr.x; h.baseY = h.spr.y; }
            this.kicks = 0;
            this.endWait = -1;
            this.target = null;
            this.active = null;
        }
        horseUnits(h) { return (h.curry + h.comb) / 2; }
        units() { const n = this.horses.length; return { total: n * 2, done: this.horses.reduce((s, h) => s + (h.curry >= 1 ? 1 : 0) + (h.comb >= 1 ? 1 : 0), 0), part: this.horses.reduce((s, h) => s + h.curry + h.comb, 0) }; }
        targets() {
            const out = [], C = L("scena.groom.cel");
            for (const h of this.horses) {
                const rect = rectPx(BOXES[h.i]);
                if (h.curry < 1) out.push({ kind: "curry", horse: h, rect, at: "box", hold: true, ratio: h.curry, label: Watki.wstaw(C[0] || "", { kto: h.name }) });
                else if (h.comb < 1) out.push({ kind: "comb", horse: h, rect, at: "box", hold: true, ratio: h.comb, label: Watki.wstaw(C[1] || "", { kto: h.name }) });
            }
            return out;
        }
        tick(k, kt) {
            if (this.done) return;
            const c = this.cfg, h = this.hero;
            if (h.stun > 0) { h.stun--; this.idle(); } else this.walk(k, 1, true);
            this.placeCarry();
            const tg = this.yard.nearest(h, this.targets());
            this.target = tg;
            const working = !!(tg && k.ok && h.stun <= 0);
            this.active = working ? tg.horse : null;
            // the horses' moods: the one being worked grows restless now and then (a warning, then it kicks whoever still holds O)
            for (const hs of this.horses) {
                if (hs === this.active && hs.warn === 0 && hs.snap === 0 && --hs.wait <= 0) { hs.warn = c.warn; this.float("!", ROOM_X + hs.baseX, ROOM_Y + hs.baseY - 120, WARN, 30); se("Horse", 50, 110); }
                if (hs.warn > 0 && --hs.warn === 0) hs.snap = c.snap;
                else if (hs.snap > 0 && --hs.snap === 0) hs.wait = Math.round(c.wait[0] + this.rng() * (c.wait[1] - c.wait[0]));
            }
            if (working) {
                const hs = tg.horse;
                if (hs.snap > 0) {
                    // kicked: half of the job gone, the hero stunned
                    hs.snap = 0; hs.wait = Math.round(c.wait[0] + this.rng() * (c.wait[1] - c.wait[0]));
                    if (tg.kind === "curry") hs.curry = Math.max(0, hs.curry - 0.25); else hs.comb = Math.max(0, hs.comb - 0.25);
                    h.stun = 44; this.kicks++;
                    se("Damage1", 60, 110);
                    this.float(W("scena.groom.kop"), ROOM_X + h.x, ROOM_Y + h.y - 70, BAD, 24);
                    this.burst(h.x + ROOM_X, h.y + ROOM_Y - 20, "#ffd2c0", 8, 2);
                } else if (hs.warn === 0) {
                    if (tg.kind === "curry") { hs.curry = Math.min(1, hs.curry + 1 / c.curry); if (++hs.dust % 9 === 1) { se("Wind7", 25, 160); this.burst(ROOM_X + hs.baseX - 20 + this.rng() * 40, ROOM_Y + hs.baseY - 40, "#d8c8a8", 3, 1.4); } if (hs.curry >= 1) this.finishedJob(hs, W("scena.groom.zgrzebloGotowe")); }
                    else { hs.comb = Math.min(1, hs.comb + 1 / c.comb); if (++hs.dust % 12 === 1) se("Cursor1", 20, 170); if (hs.comb >= 1) this.finishedJob(hs, W("scena.groom.grzywaGotowa")); }
                }
            }
            for (const hs of this.horses) {   // the horse's look: a shake on the warning, a rearing head on the snap
                const s = hs.spr;
                s.x = hs.baseX + (hs.warn > 0 ? Math.sin(this.t * 1.7) * 2 : 0);
                s.y = hs.baseY - (hs.snap > 0 ? 6 : 0);
                s.tint = hs.snap > 0 ? 0xff9a8a : hs.warn > 0 ? 0xffd9a0 : 0xffffff;
            }
            this.showPrompt(tg);
            this.yard.sortChars();
            this.tickFx();
            this.t++;
            const u = this.units();
            if (u.done >= u.total && this.endWait < 0) { this.endWait = 50; se("Applause1", 45, 120); this.float(W("scena.groom.wszystko"), ROOM_X + h.x, ROOM_Y + h.y - 70, ST().accent, 26); }
            if (this.endWait > 0 && --this.endWait === 0) this.finish();
            else if (this.t >= this.limit) this.finish();
        }
        finishedJob(hs, text) { se("Chime2", 50, 130); this.float(text, ROOM_X + hs.baseX, ROOM_Y + hs.baseY - 100, GOOD, 22); this.burst(ROOM_X + hs.baseX, ROOM_Y + hs.baseY - 50, "#fff7c0", 9, 2.2); }
        finish() {
            const u = this.units(), left = Math.max(0, this.limit - this.t), full = u.done >= u.total, good = [], bad = [];
            let s = 88 * u.part / u.total + (full ? 12 * this.timeBonus(left, this.limit) : 0) - 6 * this.kicks;
            if (full) good.push(W("scena.groom.dobre.wszystko", { sek: Math.ceil(left / 60) }));
            else bad.push(W("scena.groom.zle.niedokonczone", { ile: u.total - u.done }));
            if (this.kicks === 0 && u.done > 0) good.push(W("scena.groom.dobre.bezKopniakow"));
            if (this.kicks > 0) bad.push(W("scena.groom.zle.kopniaki", { ile: this.kicks }));
            this.end(s, { done: u.done, total: u.total, kicks: this.kicks, timeLeft: Math.round(left / 60), deduct: this.kicks }, good, bad);
        }
        skipData() { return { done: 0, total: 0, skipped: true, kicks: 0, deduct: 0 }; }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() { const left = Math.max(0, this.limit - this.t), u = this.units(); return { timer: left / this.limit, label: W("scena.groom.hud") + fmtTime(left), right: W("scena.zadania") + u.done + " / " + u.total }; }
        state() {
            const y = this.yard, h = this.hero;
            return { t: this.t, limit: this.limit, hero: { x: h.x, y: h.y }, stun: h.stun, kicks: this.kicks, target: this.target ? this.target.kind : null,
                horses: this.horses.map(x => ({ i: x.i, name: x.name, curry: x.curry, comb: x.comb, restless: x.warn > 0 || x.snap > 0, warn: x.warn, snap: x.snap, stands: y.stands(BOXES[x.i]) })) };
        }
        frame() {
            const u = this.units(), key = [this.horses.map(x => Math.round(x.curry * 20) + ":" + Math.round(x.comb * 20)).join(","), this.kicks].join("|");
            this.drawSide(key, (b, S) => {
                txt(b, W("scena.groom.bok"), 18, 14, SIDE.w - 36, { size: 22, color: S.accent, bold: true });
                let y = 58;
                for (const hs of this.horses) {
                    txt(b, hs.name, 18, y, 160, { size: 20, bold: true });
                    txt(b, W("scena.groom.zgrzeblo"), 18, y + 26, 100, { size: 16, color: S.muted });
                    bar(b, 110, y + 33, 180, 9, hs.curry, hs.curry >= 1 ? GOOD : S.accent);
                    txt(b, W("scena.groom.grzywa"), 18, y + 48, 100, { size: 16, color: S.muted });
                    bar(b, 110, y + 55, 180, 9, hs.comb, hs.comb >= 1 ? GOOD : S.accent);
                    y += 92;
                }
                txt(b, W("scena.groom.wskazowka"), 18, y + 4, SIDE.w - 36, { size: 16, color: S.muted });
            });
        }
    }

    // ==================================================================
    // Part 2: Karmienie i pojenie (oats, hay and the precious water)
    // ==================================================================
    const FOOD = ["oats", "hay", "water"];
    class PartFeed extends YardPart {
        setup() {
            const c = this.cfg, r = this.rng;
            this.limit = c.time;
            super.setup();
            const pick = rg => rg[0] + Math.floor(r() * (rg[1] - rg[0] + 1));
            this.horses = HORSES.map((H, i) => ({ i, name: H.name, coat: H.coat, need: { oats: pick(c.oats), hay: pick(c.hay), water: pick(c.water) }, given: { oats: 0, hay: 0, water: 0 }, plate: null, spr: null }));
            this.total = this.horses.reduce((s, h) => s + h.need.oats + h.need.hay + h.need.water, 0);
            const waterNeed = this.horses.reduce((s, h) => s + h.need.water, 0);
            this.stock = waterNeed + c.spare;
            this.stockMax = this.stock;
            this.mistakes = 0;
            this.spilled = 0;
            this.endWait = -1;
            for (const h of this.horses) {
                h.spr = this.yard.horseSprite(h.coat, BOXES[h.i]);
                h.plate = new Sprite(new Bitmap(232, 30));
                h.plate.x = BOXES[h.i].tx * T + 4; h.plate.y = 9;   // (hung on the wall above the box, clear of the horse)
                this.yard.floor.addChild(h.plate);
                this.drawPlate(h);
            }
            this.fork = null;
        }
        drawPlate(h) {
            const b = h.plate.bitmap;
            b.clear();
            panel(b, 0, 0, 232, 30, { cut: 3, fill: "rgba(20,14,8,0.88)", accent: false });
            txt(b, h.name, 8, 3, 80, { size: 16, bold: true, color: "#f0e2c0" });
            FOOD.forEach((kind, k) => {
                const x0 = 86 + k * 48;
                drawPortion(b, kind, x0, 8, true);
                for (let n = 0; n < h.need[kind]; n++) b.fillRect(x0 + 17 + n * 9, 11, 7, 8, n < h.given[kind] ? (kind === "water" ? "#5fb4ee" : kind === "oats" ? "#e3c04a" : "#d0b765") : "#4a3d2b");
            });
        }
        left(h) { return h.need.oats + h.need.hay + h.need.water - h.given.oats - h.given.hay - h.given.water; }
        given() { return this.horses.reduce((s, h) => s + h.given.oats + h.given.hay + h.given.water, 0); }
        targets() {
            const out = [], hands = this.hero.hands, C = L("scena.feed.cel"), names = L("scena.feed.nazwy"), cap = this.cfg.cap;
            for (const kind of FOOD) {
                const busy = !!hands && (hands.kind !== kind || hands.n >= cap), empty = kind === "water" && this.stock <= 0;
                out.push({ kind: "take", what: kind, rect: rectPx(STATION[kind === "hay" ? "hay" : kind]), busy: busy || empty,
                    label: empty ? W("scena.feed.pusta") : busy ? (hands && hands.n >= cap ? W("scena.feed.pelne") : W("scena.feed.zajete")) : Watki.wstaw(C[0] || "", { co: names[FOOD.indexOf(kind)] || kind }) });
            }
            if (hands) for (const h of this.horses) {
                const wants = h.given[hands.kind] < h.need[hands.kind];
                out.push({ kind: "give", horse: h, rect: rectPx(BOXES[h.i]), at: "box", busy: !wants,
                    label: wants ? Watki.wstaw(C[1] || "", { kto: h.name, co: names[FOOD.indexOf(hands.kind)] }) : Watki.wstaw(C[2] || "", { kto: h.name }) });
            }
            return out;
        }
        tick(k, kt) {
            if (this.done) return;
            const h = this.hero, c = this.cfg;
            this.walk(k, 1, true);
            this.placeCarry();
            // running with a full bucket spills the water (it is precious): one measure a while of running
            if (h.hands && h.hands.kind === "water" && h.running) {
                if (++h.runT >= c.spill) { h.runT = 0; this.spillWater(); }
            } else if (h.runT > 0) h.runT--;
            const tg = this.yard.nearest(h, this.targets());
            this.target = tg;
            if (tg && kt.ok) this.act(tg);
            this.showPrompt(tg);
            this.yard.sortChars();
            this.tickFx();
            this.t++;
            const g = this.given();
            if (g >= this.total && this.endWait < 0) { this.endWait = 50; se("Applause1", 45, 120); this.float(W("scena.feed.wszystko"), ROOM_X + h.x, ROOM_Y + h.y - 70, ST().accent, 26); }
            else if (this.endWait < 0 && this.stock <= 0 && !(h.hands && h.hands.kind === "water") && this.waterLeft() > 0 && this.t > 60 && this.horses.every(x => x.given.oats >= x.need.oats && x.given.hay >= x.need.hay)) this.endWait = 120;   // (no water left to give: no point going on)
            if (this.endWait > 0 && --this.endWait === 0) this.finish();
            else if (this.t >= this.limit) this.finish();
        }
        waterLeft() { return this.horses.reduce((s, h) => s + h.need.water - h.given.water, 0); }
        spillWater() {
            const h = this.hero;
            if (!h.hands || h.hands.kind !== "water") return;
            this.spilled++;
            this.mistakes++;
            se("Water2", 60, 90);
            this.float(W("scena.feed.rozlane"), ROOM_X + h.x, ROOM_Y + h.y - 70, BAD, 22);
            this.burst(ROOM_X + h.x, ROOM_Y + h.y - 20, "#7cc3f2", 8, 1.8, 0.08);
            if (--h.hands.n <= 0) this.setHands(null); else this.drawCarry();
        }
        act(tg) {
            const h = this.hero, fx = ROOM_X + h.x, fy = ROOM_Y + h.y - 70;
            if (tg.kind === "take") {
                if (tg.busy) { se("Buzzer1", 45); this.float(tg.label, fx, fy, WARN, 18); return; }
                if (tg.what === "water") this.stock--;
                this.setHands(tg.what, (h.hands ? h.hands.n : 0) + 1);
                se(tg.what === "water" ? "Water1" : "Equip2", 55, tg.what === "water" ? 110 : 100);
            } else {
                const kind = h.hands.kind, hs = tg.horse;
                if (hs.given[kind] < hs.need[kind]) {
                    hs.given[kind]++;
                    se(kind === "water" ? "Water3" : "Eat", 55, 100);
                    this.float("+1", ROOM_X + BOXES[hs.i].tx * T + 120, ROOM_Y + BOXES[hs.i].ty * T + 50, kind === "water" ? "#7cc3f2" : GOOD, 22);
                    this.drawPlate(hs);
                } else {
                    this.mistakes++;
                    if (kind === "water") this.spilled++;
                    se("Buzzer1", 55);
                    this.float(W("scena.feed.nie", { kto: hs.name }), fx, fy, BAD, 20);
                }
                if (--h.hands.n <= 0) this.setHands(null); else this.drawCarry();
            }
        }
        finish() {
            const g = this.given(), left = Math.max(0, this.limit - this.t), full = g >= this.total, good = [], bad = [];
            let s = 90 * g / this.total + (full ? 10 * this.timeBonus(left, this.limit) : 0) - 5 * this.mistakes;
            if (full) good.push(W("scena.feed.dobre.wszystko"));
            else bad.push(W("scena.feed.zle.brak", { ile: this.total - g }));
            if (this.spilled === 0 && g > 0) good.push(W("scena.feed.dobre.woda", { ile: this.stock }));
            if (this.spilled > 0) bad.push(W("scena.feed.zle.woda", { ile: this.spilled }));
            if (this.mistakes - this.spilled > 0) bad.push(W("scena.feed.zle.pomylki", { ile: this.mistakes - this.spilled }));
            this.end(s, { given: g, total: this.total, spilled: this.spilled, mistakes: this.mistakes, waterLeft: this.stock, timeLeft: Math.round(left / 60), deduct: this.mistakes }, good, bad);
        }
        skipData() { return { given: 0, total: 0, skipped: true, spilled: 0, mistakes: 0, deduct: 0 }; }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() { const left = Math.max(0, this.limit - this.t); return { timer: left / this.limit, label: W("scena.feed.hud") + fmtTime(left), right: W("scena.porcje") + this.given() + " / " + this.total }; }
        state() {
            const y = this.yard, h = this.hero;
            const st = {}; for (const k of FOOD) st[k] = y.standsOf(k, FOOD);
            return { t: this.t, limit: this.limit, hero: { x: h.x, y: h.y }, hands: h.hands ? { kind: h.hands.kind, n: h.hands.n } : null, stock: this.stock, total: this.total, given: this.given(),
                target: this.target ? this.target.kind + ":" + (this.target.what || (this.target.horse && this.target.horse.i)) : null, mistakes: this.mistakes, spilled: this.spilled, cap: this.cfg.cap,
                stations: st, horses: this.horses.map(x => ({ i: x.i, name: x.name, need: Object.assign({}, x.need), given: Object.assign({}, x.given), stands: y.stands(BOXES[x.i]) })) };
        }
        frame() {
            const key = [this.horses.map(h => h.given.oats + "" + h.given.hay + h.given.water).join(","), this.stock, this.spilled].join("|");
            this.drawSide(key, (b, S) => {
                txt(b, W("scena.feed.deska"), 18, 14, SIDE.w - 36, { size: 22, color: S.accent, bold: true });
                let y = 56;
                for (const hs of this.horses) {
                    const full = this.left(hs) === 0;
                    txt(b, hs.name, 18, y, 140, { size: 19, bold: true, color: full ? GOOD : S.text });
                    FOOD.forEach((kind, k) => { drawPortion(b, kind, 130 + k * 62, y + 4, true); txt(b, hs.given[kind] + "/" + hs.need[kind], 146 + k * 62, y, 44, { size: 17, color: hs.given[kind] >= hs.need[kind] ? GOOD : S.text }); });
                    y += 36;
                }
                y += 14;
                txt(b, W("scena.feed.woda"), 18, y, SIDE.w - 36, { size: 20, color: "#7cc3f2", bold: true });
                for (let i = 0; i < this.stockMax; i++) drawPortion(b, "water", 18 + i * 22, y + 32, i < this.stock);
                txt(b, W("scena.feed.woda2"), 18, y + 58, SIDE.w - 36, { size: 16, color: S.muted });
                txt(b, W("scena.feed.wskazowka"), 18, y + 96, SIDE.w - 36, { size: 16, color: S.muted });
            });
        }
    }

    // ==================================================================
    // Part 3: Gnój i słoma (the barrow, the heap, fresh straw)
    // ==================================================================
    class PartMuck extends YardPart {
        setup() {
            const c = this.cfg, r = this.rng;
            this.limit = c.time;
            super.setup();
            HORSES.forEach((H, i) => this.yard.horseSprite(H.coat, BOXES[i]));
            // the piles lie on the front row of the three boxes (where the barrow can reach them from the aisle)
            const cells = [];
            for (let b = 0; b < 3; b++) for (let k = 0; k < BOX_W; k++) cells.push({ box: b, tx: BOXES[b].tx + k, ty: BOXES[b].front });
            this.piles = shuffle(cells, r).slice(0, c.piles).map((p, i) => ({ i, tx: p.tx, ty: p.ty, box: p.box, state: "dirty", spr: null }));
            for (const p of this.piles) {
                p.spr = new Sprite(pileBitmap());
                p.spr.anchor.set(0.5, 1);
                p.spr.x = p.tx * T + 24; p.spr.y = p.ty * T + 36;
                this.yard.floor.addChild(p.spr);
            }
            this.barrow = { on: false, load: 0 };
            this.barrowSpr = new Sprite(barrowBitmap());
            this.barrowSpr.anchor.set(0.5, 1);
            this.barrowSpr.visible = false;
            this.yard.chars.addChild(this.barrowSpr);
            this.dumped = 0;
            this.scooped = 0;
            this.spread = 0;
            this.scoopT = 0;
            this.endWait = -1;
        }
        units() { return { total: this.piles.length * 2, done: this.scooped + this.spread }; }
        pileRect(p) { return { x: p.tx * T, y: p.ty * T, w: T, h: T }; }
        targets() {
            const out = [], h = this.hero, C = L("scena.muck.cel");
            const bw = this.barrow;
            if (!bw.on) out.push({ kind: "barrow", rect: rectPx(STATION.barrow), label: C[0] || "", busy: !!h.hands });
            else out.push({ kind: "park", rect: rectPx(STATION.barrow), label: bw.load > 0 ? C[1] || "" : C[2] || "", busy: bw.load > 0 });
            for (const p of this.piles) {
                if (p.state === "dirty") out.push({ kind: "scoop", pile: p, rect: this.pileRect(p), hold: true, ratio: this.scoopT / this.cfg.scoop, busy: !bw.on || bw.load >= this.cfg.cap, label: !bw.on ? C[3] || "" : bw.load >= this.cfg.cap ? C[4] || "" : C[5] || "" });
                else if (p.state === "clean" && h.hands && h.hands.kind === "straw") out.push({ kind: "spread", pile: p, rect: this.pileRect(p), label: C[6] || "" });
            }
            if (bw.on && bw.load > 0) out.push({ kind: "dump", rect: rectPx(STATION.manure), label: C[7] || "" });
            if (!bw.on) out.push({ kind: "hay", rect: rectPx(STATION.hay), busy: !!h.hands && (h.hands.kind !== "straw" || h.hands.n >= this.cfg.strawCap), label: h.hands && h.hands.n >= this.cfg.strawCap ? C[8] || "" : C[9] || "" });
            return out;
        }
        tick(k, kt) {
            if (this.done) return;
            const h = this.hero, c = this.cfg, bw = this.barrow;
            this.walk(k, bw.on ? 0.78 : 1, !bw.on);
            this.placeCarry();
            if (bw.on) {   // the barrow goes in front of the hero, the handles to him
                const d = h.fig.dir, ox = d === 4 || d === 7 || d === 1 ? -26 : d === 6 || d === 9 || d === 3 ? 26 : 0, oy = d === 8 || d === 7 || d === 9 ? -18 : d === 2 || d === 1 || d === 3 ? 12 : 0;
                this.barrowSpr.x = Math.round(h.x + ox); this.barrowSpr.y = Math.round(h.y + oy + 6); this.barrowSpr._sid = 1001;
                this.barrowSpr.scale.x = (d === 4 || d === 7 || d === 1) ? -1 : 1;
            }
            const tg = this.yard.nearest(h, this.targets());
            this.target = tg;
            let scooping = false;
            if (tg && tg.kind === "scoop" && !tg.busy && k.ok) {
                scooping = true;
                if (++this.scoopT % 8 === 1) { se("Sand", 40, 90); this.burst(ROOM_X + tg.pile.tx * T + 24, ROOM_Y + tg.pile.ty * T + 20, "#6b5236", 3, 1.4); }
                if (this.scoopT >= c.scoop) {
                    this.scoopT = 0;
                    tg.pile.state = "clean"; tg.pile.spr.bitmap = freshStrawBitmap(); tg.pile.spr.visible = false;
                    bw.load++; this.scooped++;
                    se("Equip2", 55, 80);
                    this.float(Watki.wstaw(W("scena.muck.tacz"), { ile: bw.load, max: c.cap }), ROOM_X + h.x, ROOM_Y + h.y - 70, GOOD, 20);
                }
            } else if (tg && kt.ok) this.act(tg);
            if (!scooping) this.scoopT = 0;
            this.showPrompt(tg);
            this.yard.sortChars();
            this.tickFx();
            this.t++;
            const u = this.units();
            if (u.done >= u.total && this.endWait < 0) { this.endWait = 50; se("Applause1", 45, 120); this.float(W("scena.muck.wszystko"), ROOM_X + h.x, ROOM_Y + h.y - 70, ST().accent, 26); }
            if (this.endWait > 0 && --this.endWait === 0) this.finish();
            else if (this.t >= this.limit) this.finish();
        }
        act(tg) {
            const h = this.hero, bw = this.barrow, fx = ROOM_X + h.x, fy = ROOM_Y + h.y - 70;
            if (tg.busy) { se("Buzzer1", 45); this.float(tg.label, fx, fy, WARN, 18); return; }
            if (tg.kind === "barrow") { bw.on = true; this.barrowSpr.visible = true; this.yard.barrowPark.visible = false; se("Equip1", 60, 90); }
            else if (tg.kind === "park") { bw.on = false; this.barrowSpr.visible = false; this.yard.barrowPark.visible = true; se("Equip1", 60, 80); }
            else if (tg.kind === "dump") {
                this.dumped += bw.load; this.yard.setHeap(this.dumped);
                this.float("+" + bw.load, ROOM_X + 17 * T, ROOM_Y + 9.6 * T, "#c9a875", 24);
                bw.load = 0; se("Sand", 60, 70);
                this.burst(ROOM_X + 17 * T, ROOM_Y + 10.4 * T, "#6b5236", 8, 1.8, 0.05);
            } else if (tg.kind === "hay") { this.setHands("straw", (h.hands ? h.hands.n : 0) + 1); se("Equip2", 55, 120); }
            else if (tg.kind === "spread") {
                tg.pile.state = "straw"; tg.pile.spr.visible = true; this.spread++;
                se("Sand", 40, 150);
                this.burst(ROOM_X + tg.pile.tx * T + 24, ROOM_Y + tg.pile.ty * T + 20, "#e8d28a", 6, 1.6);
                if (--h.hands.n <= 0) this.setHands(null); else this.drawCarry();
            }
        }
        finish() {
            const u = this.units(), left = Math.max(0, this.limit - this.t), full = u.done >= u.total, good = [], bad = [];
            let s = 90 * u.done / u.total + (full ? 10 * this.timeBonus(left, this.limit) : 0);
            this.ctx.manure = this.dumped;
            if (full) good.push(W("scena.muck.dobre.wszystko", { sek: Math.ceil(left / 60) }));
            else {
                if (this.scooped < this.piles.length) bad.push(W("scena.muck.zle.gnoj", { ile: this.piles.length - this.scooped }));
                if (this.spread < this.scooped) bad.push(W("scena.muck.zle.sloma", { ile: this.scooped - this.spread }));
            }
            if (this.dumped > 0) good.push(W("scena.muck.dobre.gnoj", { ile: this.dumped }));
            this.end(s, { done: u.done, total: u.total, manure: this.dumped, timeLeft: Math.round(left / 60), deduct: 0 }, good, bad);
        }
        skipData() { this.ctx.manure = 0; return { done: 0, total: 0, skipped: true, deduct: 0 }; }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() { const left = Math.max(0, this.limit - this.t), u = this.units(); return { timer: left / this.limit, label: W("scena.muck.hud") + fmtTime(left), right: W("scena.zadania") + u.done + " / " + u.total }; }
        state() {
            const y = this.yard, h = this.hero;
            return { t: this.t, limit: this.limit, hero: { x: h.x, y: h.y }, hands: h.hands ? { kind: h.hands.kind, n: h.hands.n } : null, barrow: { on: this.barrow.on, load: this.barrow.load }, cap: this.cfg.cap, strawCap: this.cfg.strawCap,
                target: this.target ? this.target.kind : null, scooped: this.scooped, spread: this.spread, dumped: this.dumped,
                stations: { barrow: y.standsOf("barrow", ["barrow", "manure", "hay"]), manure: y.standsOf("manure", ["barrow", "manure", "hay"]), hay: y.standsOf("hay", ["barrow", "manure", "hay"]) },
                piles: this.piles.map(p => ({ i: p.i, state: p.state, stands: y.stands({ tx: p.tx, ty: p.ty, w: 1, h: 1 }) })) };
        }
        frame() {
            const u = this.units(), key = [this.scooped, this.spread, this.dumped, this.barrow.on, this.barrow.load].join("|");
            this.drawSide(key, (b, S) => {
                txt(b, W("scena.muck.bok"), 18, 14, SIDE.w - 36, { size: 22, color: S.accent, bold: true });
                const rows = [[W("scena.muck.wiersz.gnoj"), this.scooped, this.piles.length], [W("scena.muck.wiersz.wysypane"), this.dumped, this.piles.length], [W("scena.muck.wiersz.sloma"), this.spread, this.piles.length]];
                let y = 58;
                for (const [name, v, n] of rows) { txt(b, name, 18, y, 160, { size: 19 }); bar(b, 130, y + 9, 120, 9, v / n, v >= n ? GOOD : S.accent); txt(b, v + "/" + n, 256, y, 44, { size: 18, color: v >= n ? GOOD : S.text, align: "right" }); y += 34; }
                txt(b, W("scena.muck.taczka") + this.barrow.load + " / " + this.cfg.cap, 18, y + 14, SIDE.w - 36, { size: 19, color: this.barrow.on ? S.accent : S.muted });
                txt(b, W("scena.muck.wskazowka"), 18, y + 54, SIDE.w - 36, { size: 16, color: S.muted });
            });
        }
    }

    // ==================================================================
    // Part 4: Konie podróżnych (take, put in a free box, remember, bring back saddled)
    // ==================================================================
    class PartGuests extends YardPart {
        setup() {
            const c = this.cfg, r = this.rng;
            this.limit = c.time;
            super.setup();
            // the resident horses stand in the upper boxes, quiet; the lower boxes are for the travellers
            HORSES.forEach((H, i) => this.yard.horseSprite(H.coat, BOXES[i]));
            this.boxes = [3, 4, 5].map(i => ({ i, horse: null, spr: null, door: null, closeAt: 0 }));
            for (const bx of this.boxes) {
                bx.door = new Sprite(doorBitmap(BOXES[bx.i].num));
                bx.door.x = BOXES[bx.i].tx * T + 3; bx.door.y = BOXES[bx.i].ty * T + 4;
                bx.door.visible = false;
                this.yard.over.addChild(bx.door);
            }
            const looks = shuffle(PEOPLE.guests, r), names = shuffle(L("scena.guests.nazwy"), r), coats = shuffle([0, 1, 2], r);
            this.tr = [];
            for (let n = 0; n < c.n; n++) this.tr.push({ id: n, name: names[n % names.length] || "Podróżny", look: looks[n % looks.length], coat: coats[n % 3], arrive: c.arrive[n], lag: c.lag[n], state: "future", t: 0, box: -1, fig: null, horse: null, mistakes: 0, q: 0, tip: 0, waited: 0, memo: 0, wasted: 0, waitedIn: 0 });
            this.lead = null;
            this.leadSpr = this.yard.horseSprite(0, BOXES[3]); this.leadSpr.visible = false;
            this.leadSpr.scale.set(1.2, 1.2); this.leadSpr._sid = 999;
            this.mistakes = 0;
            this.endWait = -1;
            this.fed = 0;
        }
        doorPt() { const d = rectPx(STATION.door); return { x: d.x + d.w / 2, y: d.y + d.h - 12 }; }
        // a traveller's figure at the door (x offset by his number), his horse beside it
        placeTrav(t, dx) { const p = this.doorPt(); t.fig.x = p.x + dx; t.fig.y = p.y + 6; t.fig.refresh(); }
        spawn(t) {
            const p = this.doorPt();
            t.fig = this.yard.addFigure(t.look, 9, 12, 8);
            t.fig._sid = 500 + t.id;
            t.fig.x = p.x + (t.id % 2 ? 30 : -30); t.fig.y = p.y + 70;   // (comes in from outside, below the door)
            t.fig.dir = 8; t.fig.moving = true; t.fig.refresh();
        }
        targets() {
            const out = [], h = this.hero, C = L("scena.guests.cel"), door = rectPx(STATION.door);
            door.y -= 6; door.h += 12;
            const waitingIn = this.tr.find(t => t.state === "waitIn"), backAsk = this.tr.filter(t => t.state === "back");
            if (waitingIn && !h.lead && !h.hands) out.push({ kind: "take", trav: waitingIn, rect: door, label: Watki.wstaw(C[0] || "", { kto: waitingIn.name, kon: COATS[waitingIn.coat] }) });
            if (h.lead && h.lead.trav.state === "led") for (const bx of this.boxes) if (!bx.horse) out.push({ kind: "stable", box: bx, rect: rectPx(BOXES[bx.i]), at: "box", label: Watki.wstaw(C[1] || "", { nr: BOXES[bx.i].num }) });
            if (h.lead && h.lead.trav.state === "out") out.push({ kind: "deliver", trav: h.lead.trav, rect: door, label: Watki.wstaw(C[2] || "", { kto: h.lead.trav.name }) });
            if (!h.lead && !h.hands && backAsk.length) out.push({ kind: "saddle", rect: rectPx(STATION.saddle), label: C[3] || "" });
            if (!h.lead && backAsk.length) for (const bx of this.boxes) if (bx.horse) out.push({ kind: "fetch", box: bx, rect: rectPx(BOXES[bx.i]), at: "box", busy: !h.hands, label: h.hands ? Watki.wstaw(C[4] || "", { nr: BOXES[bx.i].num }) : C[5] || "" });
            return out;
        }
        tick(k, kt) {
            if (this.done) return;
            const h = this.hero, c = this.cfg;
            this.walk(k, h.lead ? 0.85 : 1, !h.lead);
            this.placeCarry();
            // the travellers: their clocks
            for (const t of this.tr) this.tickTrav(t);
            const tg = this.yard.nearest(h, this.targets());
            this.target = tg;
            if (tg && kt.ok) this.act(tg);
            if (h.lead) { const l = this.leadSpr, bx = h.fig.dir === 4 || h.fig.dir === 7 || h.fig.dir === 1 ? 1 : -1; l.x += (h.x + bx * 38 - l.x) * 0.2; l.y += (h.y + 6 - l.y) * 0.2; l.scale.x = Math.abs(l.scale.x) * (h.fig.dir === 6 || h.fig.dir === 9 || h.fig.dir === 3 ? -1 : 1); }
            this.showPrompt(tg);
            this.yard.sortChars();
            this.tickFx();
            this.t++;
            const alive = this.tr.filter(t => t.state !== "gone").length;
            if (alive === 0 && this.endWait < 0) { this.endWait = 60; }
            if (this.endWait > 0 && --this.endWait === 0) this.finish();
            else if (this.t >= this.limit) this.finish();
        }
        tickTrav(t) {
            const c = this.cfg, p = this.doorPt();
            t.t++;
            if (t.state === "future") { if (this.t >= t.arrive) { t.state = "arriving"; t.t = 0; this.spawn(t); se("Door1", 40, 110); } return; }
            if (t.state === "arriving") {
                const dy = -70 / 44;
                t.fig.y += dy; t.fig.advance(Math.abs(dy)); t.fig.moving = true; t.fig.refresh();
                if (t.t >= 44) {
                    t.state = "waitIn"; t.t = 0; t.fig.moving = false; t.fig.dir = 8; t.fig.refresh();
                    t.horse = propSprite("horse", t.coat); t.horse.scale.set(1.2, 1.2);
                    t.horse.x = p.x + (t.id % 2 ? -44 : 44); t.horse.y = p.y + 6; t.horse._sid = 400 + t.id; this.yard.chars.addChild(t.horse);
                    this.float(Watki.wstaw(W("scena.guests.przyjechal"), { kto: t.name, kon: COATS[t.coat] }), ROOM_X + p.x, ROOM_Y + p.y - 100, ST().accent, 20);
                    se("Horse", 50, 100);
                }
                return;
            }
            if (t.state === "waitIn") {
                t.waited++;
                if (t.waited >= c.patienceIn) {   // out of patience: he rides off with his horse
                    this.fail(t, W("scena.guests.odjechal", { kto: t.name }));
                    this.leaveTrav(t, true);
                }
                return;
            }
            if (t.state === "led") return;
            if (t.state === "stored") {
                t.memo--;
                if (t.t >= t.lag) { t.state = "back"; t.t = 0; t.waited = 0; this.backTrav(t); }
                return;
            }
            if (t.state === "back") {
                t.waited++;
                if (t.waited >= c.patienceOut) {
                    this.fail(t, W("scena.guests.poszedl", { kto: t.name }));
                    const bx = this.boxes.find(b => b.horse && b.horse.trav === t);
                    if (bx) this.emptyBox(bx);
                    this.leaveTrav(t, false);
                }
                return;
            }
            if (t.state === "leaving") {
                t.fig.y += 1.6; t.fig.moving = true; t.fig.advance(1.6); t.fig.refresh();
                if (t.horse) { t.horse.y += 1.6; }
                if (t.t > 70) { this.yard.chars.removeChild(t.fig); t.fig.destroy(); t.fig = null; if (t.horse) { this.yard.chars.removeChild(t.horse); t.horse.destroy(); t.horse = null; } t.state = "gone"; }
            }
        }
        backTrav(t) {
            const p = this.doorPt();
            t.fig = t.fig || this.yard.addFigure(t.look, 9, 12, 8);
            t.fig._sid = 500 + t.id; t.fig.x = p.x + (t.id % 2 ? 30 : -30); t.fig.y = p.y + 6; t.fig.dir = 8; t.fig.moving = false; t.fig.refresh();
            this.float(Watki.wstaw(W("scena.guests.prosi"), { kto: t.name, kon: COATS[t.coat] }), ROOM_X + p.x, ROOM_Y + p.y - 100, WARN, 22);
            se("Door1", 40, 110);
        }
        leaveTrav(t, withHorse) { t.state = "leaving"; t.t = 0; t.fig.dir = 2; if (!withHorse && t.horse) { this.yard.chars.removeChild(t.horse); t.horse.destroy(); t.horse = null; } }
        fail(t, text) { t.q = 0; this.float(text, ROOM_X + this.doorPt().x, ROOM_Y + this.doorPt().y - 80, BAD, 20); se("Buzzer1", 55); }
        emptyBox(bx) {
            bx.horse = null;
            if (bx.spr) { this.yard.chars.removeChild(bx.spr); bx.spr.destroy(); bx.spr = null; }
            bx.door.visible = false;
        }
        act(tg) {
            const h = this.hero, fx = ROOM_X + h.x, fy = ROOM_Y + h.y - 70, p = this.doorPt();
            if (tg.busy) { se("Buzzer1", 45); this.float(tg.label, fx, fy, WARN, 18); return; }
            if (tg.kind === "take") {
                const t = tg.trav;
                t.state = "led"; t.t = 0; t.waitedIn = t.waited; t.waited = 0;
                this.yard.chars.removeChild(t.horse); t.horse.destroy(); t.horse = null;
                h.lead = { trav: t, coat: t.coat };
                this.leadSpr.visible = true; this.leadSpr.x = p.x; this.leadSpr.y = p.y;
                this.setCoat(this.leadSpr, t.coat);
                se("Horse", 55, 100);
                this.float(Watki.wstaw(W("scena.guests.prowadzisz"), { kon: COATS[t.coat] }), fx, fy, GOOD, 20);
                // the traveller goes off: he comes for the horse later
                t.state = "led"; t.fig.dir = 2; t.fig.moving = false;
                this.yard.chars.removeChild(t.fig); t.fig.destroy(); t.fig = null;
            } else if (tg.kind === "stable") {
                const t = h.lead.trav, bx = tg.box;
                bx.horse = { trav: t, coat: t.coat };
                bx.spr = this.yard.horseSprite(t.coat, BOXES[bx.i]); bx.spr.visible = true;
                bx.closeAt = this.t + 70;
                t.state = "stored"; t.t = 0; t.box = bx.i; t.memo = 360; t.q = 1;
                h.lead = null; this.leadSpr.visible = false;
                se("Door1", 55, 80);
                this.float(Watki.wstaw(W("scena.guests.boks"), { kon: COATS[t.coat], nr: BOXES[bx.i].num }), ROOM_X + BOXES[bx.i].tx * T + 120, ROOM_Y + BOXES[bx.i].ty * T - 8, ST().accent, 26);
                this.burst(ROOM_X + BOXES[bx.i].tx * T + 120, ROOM_Y + BOXES[bx.i].ty * T + 30, "#fff7c0", 8, 1.8);
            } else if (tg.kind === "saddle") { this.setHands("saddle", 1); se("Equip1", 60, 100); }
            else if (tg.kind === "fetch") {
                const bx = tg.box, t = bx.horse.trav;
                const asking = this.tr.find(x => x.state === "back" && x.coat === bx.horse.coat);
                if (!asking || asking !== t) { this.wrong(); return; }   // (a coat shared by two: only the asking one's own horse)
                this.emptyBox(bx);
                this.setHands(null);
                h.lead = { trav: t, coat: t.coat, saddled: true };
                t.state = "out"; t.t = 0;
                this.leadSpr.visible = true; this.leadSpr.x = h.x; this.leadSpr.y = h.y;
                this.setCoat(this.leadSpr, t.coat);
                se("Horse", 55, 110);
                this.float(W("scena.guests.osiodlany"), fx, fy, GOOD, 20);
            } else if (tg.kind === "deliver") {
                const t = tg.trav, left = 1 - clamp(t.waited / this.cfg.patienceOut, 0, 1), slow = clamp(t.waitedIn / this.cfg.patienceIn, 0, 1);
                t.q = clamp(1 - 0.2 * t.mistakes - 0.2 * slow - 0.3 * (1 - left), 0.35, 1);
                const trustL = TW.call("Stajnia", "trustLevel") || 0;
                t.tip = Math.max(1, Math.round((2 + 4 * left - t.mistakes) * (1 + 0.25 * (trustL >= 2 ? 1 : 0)) * TIP_SCALE));
                this.ctx.tips += t.tip;
                h.lead = null; this.leadSpr.visible = false;
                const p2 = this.doorPt();
                t.fig = t.fig || this.yard.addFigure(t.look, 9, 12, 8);
                t.fig.x = p2.x + (t.id % 2 ? 30 : -30); t.fig.y = p2.y + 6; t.fig._sid = 500 + t.id;
                t.horse = propSprite("horse", t.coat); t.horse.scale.set(1.2, 1.2); t.horse.x = p2.x + (t.id % 2 ? -44 : 44); t.horse.y = p2.y + 6; t.horse._sid = 400 + t.id; this.yard.chars.addChild(t.horse);
                this.leaveTrav(t, true);
                se("Coin", 60, 100);
                this.float(Watki.wstaw(W("scena.guests.napiwek"), { kwota: t.tip }), fx, fy, ST().accent, 26, 313);
            }
        }
        wrong() {
            const h = this.hero;
            h.hands = h.hands;   // (the saddle stays in his hands)
            this.mistakes++;
            const t = this.tr.find(x => x.state === "back");
            if (t) t.mistakes++;
            se("Buzzer1", 60);
            this.float(W("scena.guests.nieTen"), ROOM_X + h.x, ROOM_Y + h.y - 70, BAD, 22);
        }
        setCoat(spr, coat) { const f = propFrame("horse", coat); spr.setFrame(f[0], f[1], f[2], f[3]); }
        finish() {
            const good = [], bad = [], left = Math.max(0, this.limit - this.t);
            // a traveller not yet served when the time is out counts as lost
            let q = 0, served = 0;
            for (const t of this.tr) { if (t.q > 0 && t.state !== "stored" && t.state !== "led" && t.state !== "back" && t.state !== "waitIn" && t.state !== "future" && t.state !== "arriving") { q += t.q; served++; } }
            const n = this.tr.length, s = 100 * q / n;
            if (served === n) good.push(W("scena.guests.dobre.wszyscy"));
            else bad.push(W("scena.guests.zle.stracone", { ile: n - served }));
            if (served > 0 && this.mistakes === 0) good.push(W("scena.guests.dobre.bezPomylek"));
            if (this.mistakes > 0) bad.push(W("scena.guests.zle.pomylki", { ile: this.mistakes }));
            if (this.ctx.tips > 0) good.push(Watki.wstaw(W("scena.guests.dobre.napiwki"), { ile: this.tips() }));
            this.end(s, { served, total: n, mistakes: this.mistakes, tips: this.tips(), timeLeft: Math.round(left / 60), deduct: this.mistakes }, good, bad);
        }
        tips() { return this.tr.reduce((s, t) => s + (t.tip || 0), 0); }
        skipData() { return { served: 0, total: 0, skipped: true, mistakes: 0, deduct: 0 }; }
        progress() { return clamp(this.t / this.limit, 0, 1); }
        hud() { const left = Math.max(0, this.limit - this.t), done = this.tr.filter(t => t.state === "gone" || t.state === "leaving").length; return { timer: left / this.limit, label: W("scena.guests.hud") + fmtTime(left), right: W("scena.podrozni") + done + " / " + this.tr.length }; }
        state() {
            const y = this.yard, h = this.hero, door = rectPx(STATION.door);
            return { t: this.t, limit: this.limit, hero: { x: h.x, y: h.y }, hands: h.hands ? { kind: h.hands.kind, n: h.hands.n } : null, lead: h.lead ? { trav: h.lead.trav.id, coat: h.lead.coat, saddled: !!h.lead.saddled } : null,
                mistakes: this.mistakes, target: this.target ? this.target.kind : null,
                travellers: this.tr.map(t => ({ id: t.id, name: t.name, coat: t.coat, state: t.state, box: t.box, waited: t.waited, tip: t.tip, q: t.q })),
                boxes: this.boxes.map(b => ({ i: b.i, num: BOXES[b.i].num, closed: b.door.visible, free: !b.horse, coat: b.horse ? b.horse.coat : -1, stands: y.stands(BOXES[b.i]).filter(p => p.y < BOXES[b.i].ty * T) })),
                stations: { door: [standPt(9, 12), standPt(8, 12), standPt(10, 12)], saddle: y.standsOf("saddle", ["door"]) } };
        }
        frame() {
            for (const bx of this.boxes) if (bx.horse && bx.closeAt && this.t >= bx.closeAt) { bx.door.visible = true; bx.closeAt = 0; if (bx.spr) bx.spr.visible = false; }
            const key = [this.tr.map(t => t.state + (t.state === "stored" ? (t.memo > 0 ? "m" : "") : "") + Math.floor(t.waited / 60)).join(","), this.hero.lead ? 1 : 0, this.mistakes].join("|");
            this.drawSide(key, (b, S) => {
                txt(b, W("scena.guests.bok"), 18, 14, SIDE.w - 36, { size: 22, color: S.accent, bold: true });
                let y = 54;
                for (const t of this.tr) {
                    if (t.state === "future") continue;
                    const st = t.state, label = st === "waitIn" ? W("scena.guests.stan.czeka") : st === "led" ? W("scena.guests.stan.prowadzisz") : st === "stored" ? (t.memo > 0 ? Watki.wstaw(W("scena.guests.stan.zapamietaj"), { nr: BOXES[t.box].num }) : W("scena.guests.stan.wBoksie"))
                        : st === "back" ? W("scena.guests.stan.prosi") : st === "out" ? W("scena.guests.stan.odbiera") : W("scena.guests.stan.poszedl");
                    const hot = st === "back" || st === "waitIn", warn = hot && t.waited > (st === "back" ? this.cfg.patienceOut : this.cfg.patienceIn) * 0.7;
                    txt(b, t.name, 18, y, SIDE.w - 36, { size: 18, bold: true, color: st === "gone" || st === "leaving" ? S.muted : S.text });
                    txt(b, COATS[t.coat] + " · " + label, 18, y + 22, SIDE.w - 36, { size: 16, color: warn ? WARN : st === "stored" && t.memo > 0 ? S.accent : S.muted });
                    if (hot) bar(b, 18, y + 46, SIDE.w - 36, 6, 1 - t.waited / (st === "back" ? this.cfg.patienceOut : this.cfg.patienceIn), warn ? WARN : S.accent);
                    y += 62;
                }
                txt(b, W("scena.guests.wskazowka"), 18, SIDE.h - 190, SIDE.w - 36, { size: 15, color: S.muted });
            });
        }
    }

    // ==================================================================
    // The scene: the cards, the parts in turn, the HUD, the summary (the same frame as the tavern shift, its own pay)
    // ==================================================================
    const PART_CLASSES = { groom: PartGroom, feed: PartFeed, muck: PartMuck, guests: PartGuests };
    const progressOf = () => { const s = TW.call("Stajnia", "state"); return s ? s.shifts : 0; };

    function cardSpec(id, scene) {
        const Lv = scene.level, i = scene.partIndex + 1, n = scene.partIds.length;
        if (id === "intro") return {
            kicker: Watki.wstaw(W("scena.karta.intro.kicker"), { nr: scene.shiftNo, poziom: Lv ? Watki.wstaw(W("scena.karta.poziom"), { L: Lv }) : "" }), title: W("scena.karta.intro.tytul"), sub: W("scena.karta.intro.podtytul"),
            say: scene.opts.intro || W("scena.karta.intro.powiedzenie"),
            lines: scene.partIds.map((p, k) => (k + 1) + ". " + PART_DEFS[p].title + " - " + PART_DEFS[p].sub), keys: [[["P"], W("scena.karta.intro.klawisze")]]
        };
        const keys = { groom: [[["up", "left", "down", "right"], W("scena.klawisze.ruch")], [["O"], W("scena.karta.groom.klawisz")]], feed: [[["up", "left", "down", "right"], W("scena.klawisze.ruch")], [["O"], W("scena.karta.feed.klawisz")]],
            muck: [[["up", "left", "down", "right"], W("scena.klawisze.ruch")], [["O"], W("scena.karta.muck.klawisz")]], guests: [[["up", "left", "down", "right"], W("scena.klawisze.ruch")], [["O"], W("scena.karta.guests.klawisz")]] };
        return { kicker: Watki.wstaw(W("scena.karta.czesc"), { nr: i, z: n }), title: PART_DEFS[id].title, sub: PART_DEFS[id].sub, say: W("scena.karta." + id + ".powiedzenie"), lines: L("scena.karta." + id + ".linie"), keys: keys[id] };
    }

    class Scene_Stajnia extends ui.Scene_MiniGame {
        createGame() {
            this.opts = Object.assign({}, this.opts);
            const shifts = progressOf();
            this.shiftNo = shifts + 1;
            this.level = clamp(this.opts.level === undefined || this.opts.level === null || this.opts.level === "" ? Math.min(MAX_LEVEL, shifts) : Number(this.opts.level), 0, MAX_LEVEL);
            this.cfgs = levelCfg(this.level);
            this.ctx = { tips: 0, manure: 0 };
            this.partIds = (Array.isArray(this.opts.parts) && this.opts.parts.length ? this.opts.parts : PART_ORDER).filter(p => PART_DEFS[p]);
            this.turbo = clamp(Math.floor(this.opts.turbo || 1), 1, 20);
            this.cards = this.opts.cards !== false;
            this.startHour = TW.time.hour();
            ["!Miasto2_Wnetrza", "!House_Town", "People2_Tall", "People3_Tall", "Actor2_Tall", "$Npc_Kolodziej"].forEach(n => ImageManager.loadCharacter(n));
            ImageManager.loadCharacter(heroLook().name);
            this.preload(ui.loadBust(BUST));
            this.preload(roomPic("Stajnia_Wnetrze")); this.preload(roomPic("Stajnia_Wnetrze_Gora"));
            const Wd = Graphics.width, Ht = Graphics.height;
            this.hudSpr = new Sprite(new Bitmap(Wd, 80));
            this.hud.addChild(this.hudSpr);
            this.black = new Sprite(solidBitmap("#000000"));
            this.black.scale.set(Wd / 4, Ht / 4);
            this.black.opacity = 0;
            this.addChild(this.black);
        }
        createBackground() {
            this.bg = new Sprite(solidBitmap("#0a0806"));
            this.bg.scale.set(Graphics.width / 4, Graphics.height / 4);
            this.addChild(this.bg);
        }
        begin() {
            this.setPhase("none");
            this.partIndex = -1;
            this.part = null;
            this.results = {};
            if (this.cards) this.openCard("intro"); else this.nextPart();
        }
        readKeys() { this.touchOk = this.phase !== "play"; super.readKeys(); }
        keyDown(k) { return super.keyDown(k) || (k === "back" && Input.isPressed("menu")); }
        testHook() { return Stajnia_Zmiana.onTick; }
        dropTestHook() { Stajnia_Zmiana.onTick = null; }
        tick() {
            if (this.trans && this.tickTrans()) return;
            const k = this.keys, kt = this.trig;
            switch (this.phase) {
                case "play": this.part.tick(k, kt); if (this.part.done) this.endPart(); break;
                case "banner": if (this.phaseT > 20 && kt.ok) { se("Decision1", 60); this.overlay.visible = false; this.nextPart(); } break;
                case "summary": if (this.phaseT > 30 && kt.ok) { se("Decision1", 60); this.leave(); } break;
            }
        }
        updateCard() { if (this.trans && this.tickTrans()) return; super.updateCard(); }
        tickTrans() {
            const tr = this.trans;
            tr.t++;
            if (tr.t === tr.dur && tr.mid) tr.mid();
            this.black.opacity = 255 * (tr.t <= tr.dur ? tr.t / tr.dur : Math.max(0, 1 - (tr.t - tr.dur) / tr.dur));
            if (tr.t >= tr.dur * 2) { this.trans = null; this.black.opacity = 0; }
            return tr.t <= tr.dur;
        }
        frame() { if (this.part && this.phase !== "summary" && this.phase !== "leaving") { this.part.frame(); this.drawHud(); } }
        pause() {
            this.se("cancel");
            this.showChoice({ title: W("scena.pauza.tytul"), options: L("scena.pauza.opcje"), cancel: 0, w: 440, onPick: i => { if (i === 1) this.abort(); } });
        }
        openCard(id) {
            this.cardId = id;
            this.setPhase("card");
            const spec = Object.assign(cardSpec(id, this), { w: 980, h: 540, bust: BUST, who: "Szczepan", whoSub: W("scena.karta.kim"), foot: id === "intro" ? W("scena.karta.stopka.start") : W("scena.karta.stopka.dalej") });
            this.showCard(spec, () => { if (id === "intro") this.nextPart(); else this.setPhase("play"); });
        }
        nextPart() {
            this.partIndex++;
            if (this.partIndex >= this.partIds.length) { this.finishShift(false); return; }
            const go = () => {
                if (this.part) { this.stage.removeChild(this.part.root); this.part.root.destroy(); }
                const id = this.partIds[this.partIndex];
                this.part = new PART_CLASSES[id](this, id, this.cfgs[id]);
                this.part.setup();
                this.stage.addChild(this.part.root);
                this._hudKey = "";
                if (this.cards) this.openCard(id); else this.setPhase("play");
            };
            if (this.part || this.partIndex > 0) { this.phase = "trans"; this.trans = { t: 0, dur: 14, mid: go }; } else go();
        }
        endPart() {
            const p = this.part;
            this.results[p.id] = { result: p.result, good: p.good, bad: p.bad };
            if (this.cards) { this.setPhase("banner"); this.drawBanner(p); } else this.nextPart();
        }
        skipPart(score) {
            if (!this.part || this.part.done) return false;
            this.part.skip(clamp(Number(score) || 0, 0, 100));
            if (this.card) this.hideCard();
            if (this.phase === "card") this.phase = "play";
            if (this.phase === "play") this.endPart();
            return true;
        }
        abort() {
            if (this.card) this.hideCard();
            if (this.part && !this.part.done) this.part.done = true;
            this.finishShift(true);
        }
        finishShift(aborted) {
            const res = this.computeResult(aborted);
            this.result = res;
            this.setPhase("summary");
            this.drawSummary(res);
            if (res.grade >= 4 && !aborted) se("Applause1", 55);
        }
        leave() {
            const res = this.result;
            TW.call("Stajnia", "applyResult", res);
            Stajnia_Zmiana.lastResult = res;
            this.phase = "leaving";
            this.end(res);
            this.overlay.visible = true;
        }
        computeResult(aborted) {
            const parts = {}, good = [], bad = [];
            let wsum = 0, ssum = 0, bonus = 0, deduct = 0;
            for (const id of this.partIds) {
                const r = this.results[id];
                if (!r) continue;
                parts[id] = r.result;
                wsum += PART_DEFS[id].weight; ssum += PART_DEFS[id].weight * r.result.score; bonus += PART_DEFS[id].bonus * r.result.score / 100;
                deduct += r.result.deduct || 0;
                good.push(...r.good); bad.push(...r.bad);
            }
            const played = Object.keys(parts).length, frac = played / this.partIds.length, score = wsum ? Math.round(ssum / wsum) : 0;
            const trustL = TW.call("Stajnia", "trustLevel") || 0;
            const tips = aborted ? 0 : Math.max(0, Math.round(this.ctx.tips));
            const wage = BASE_WAGE + 2 * this.level + (trustL >= 1 ? 2 : 0);
            const grade = aborted ? 0 : gradeOf(score), bonusR = Math.round(bonus), extra = grade === 5 ? 3 : 0;
            const raw = wage + bonusR - deduct + extra, pay = aborted ? 0 : Math.max(3, raw);
            const hours = Math.round(HOURS * (aborted ? Math.max(0.25, frac) : 1) * 10) / 10, stamina = Math.round(STAMINA * (aborted ? Math.max(0.25, frac) : 1));
            if (aborted) bad.unshift(W("scena.wynik.przerwana"));
            return { pay, tips, total: pay + tips, grade, gradeName: grade ? GRADES[grade].name : W("scena.wynik.przerwanaNazwa"), score, level: this.level, shift: this.shiftNo, aborted: !!aborted, hours, stamina,
                wage: aborted ? 0 : wage, bonus: aborted ? 0 : bonusR, deduct: aborted ? 0 : deduct, extra: aborted ? 0 : extra, floor: aborted ? 0 : pay - raw, manure: this.ctx.manure || 0, parts, good: good.slice(0, 5), bad: bad.slice(0, 5) };
        }
        // ---- drawing
        clockText(frac) {
            const h = this.startHour + HOURS * frac, hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60);
            return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
        }
        drawHud() {
            const p = this.part;
            if (!p) return;
            const info = p.hud(), frac = (this.partIndex + p.progress()) / this.partIds.length;
            const key = JSON.stringify(info) + "|" + this.clockText(frac) + "|" + this.ctx.tips + "|" + this.partIndex;
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.hudSpr.bitmap, S = ST(), Wd = b.width, def = PART_DEFS[p.id];
            b.clear();
            panel(b, 8, 6, Wd - 16, 66, { cut: 6 });
            txt(b, Watki.wstaw(W("scena.hud.czesc"), { nr: this.partIndex + 1, z: this.partIds.length }), 26, 11, 300, { size: 15, color: S.muted, bold: true });
            txt(b, def.title + " · " + def.sub, 26, 30, 420, { size: 24, color: S.accent, bold: true });
            const mx = 460, mw = 380;
            if (info.label) txt(b, info.label, mx, 11, mw, { size: 17, align: "center" });
            if (info.timer !== undefined) { const r = clamp(info.timer, 0, 1); bar(b, mx, 44, mw, 10, r, r > 0.4 ? S.accent : r > 0.18 ? WARN : BAD); }
            txt(b, Watki.wstaw(W("scena.hud.napiwki"), { ile: Math.round(this.ctx.tips) }), Wd - 380, 10, 356, { size: 20, color: S.accent, bold: true, align: "right" });
            txt(b, Watki.wstaw(W("scena.hud.zmiana"), { prawa: (info.right ? info.right + "   ·   " : "") + this.clockText(frac), nr: this.shiftNo }), Wd - 520, 38, 496, { size: 16, color: S.muted, align: "right" });
        }
        drawBanner(p) {
            const b = this.overlay.bitmap, S = ST(), Wd = b.width, Ht = b.height;
            this.overlay.visible = true;
            b.clear();
            b.fillRect(0, 0, Wd, Ht, "rgba(0,0,0,0.5)");
            const pw = 620, lines = p.good.length + p.bad.length, ph = 190 + Math.max(1, lines) * 28, px = (Wd - pw) / 2, py = (Ht - ph) / 2;
            panel(b, px, py, pw, ph, { cut: 10 });
            const def = PART_DEFS[p.id], sc = p.result.score;
            txt(b, Watki.wstaw(W("scena.baner.gotowe"), { tytul: def.title }), px + 26, py + 18, pw - 52, { size: 28, color: S.accent, bold: true });
            txt(b, W("scena.baner.wynik"), px + 26, py + 64, 300, { size: 19, color: S.muted });
            txt(b, sc + " / 100", px + pw - 200, py + 58, 174, { size: 28, color: scoreColour(sc), bold: true, align: "right" });
            bar(b, px + 26, py + 100, pw - 52, 10, sc / 100, scoreColour(sc));
            let y = py + 126;
            for (const g of p.good) { b.fillRect(px + 31, y + 10, 6, 6, GOOD); txt(b, g, px + 48, y, pw - 74, { size: 19, color: GOOD }); y += 28; }
            for (const g of p.bad) { b.fillRect(px + 31, y + 10, 6, 6, BAD); txt(b, g, px + 48, y, pw - 74, { size: 19, color: BAD }); y += 28; }
            if (!lines) txt(b, sc >= 60 ? W("scena.baner.ladnie") : W("scena.baner.slabo"), px + 48, y, pw - 74, { size: 19 });
            txt(b, this.partIndex + 1 < this.partIds.length ? W("scena.baner.dalej") : W("scena.baner.koniec"), px, py + ph - 42, pw - 26, { size: 20, color: S.accent, bold: true, align: "right" });
        }
        drawSummary(res) {
            const b = this.overlay.bitmap, S = ST(), Wd = b.width, Ht = b.height;
            this.overlay.visible = true;
            b.clear();
            b.fillRect(0, 0, Wd, Ht, "rgba(0,0,0,0.72)");
            const pw = 1120, ph = 620, px = (Wd - pw) / 2, py = (Ht - ph) / 2;
            panel(b, px, py, pw, ph, { cut: 12 });
            const bust = ui.loadBust(BUST);
            if (bust.isReady() && bust.width) {
                const bw = 230, bh = Math.round(bust.height * bw / bust.width);
                b.context.imageSmoothingEnabled = true;
                b.blt(bust, 0, 0, bust.width, bust.height, px + 24, py + 30, bw, bh);
                b.fillRect(px + 24, py + 30 + bh, bw, 2, S.accent);
            }
            let y = py + 30 + 250 + 8;
            const say = res.aborted ? W("scena.wynik.przerwanaSlowo") : GRADES[res.grade].say;
            for (const l of wrapLines(b, "„" + say + "”", 220, 19)) { txt(b, l, px + 30, y, 224, { size: 19, color: "#d8dde3" }); y += 26; }
            txt(b, W("scena.wynik.podpis"), px + 30, y + 4, 220, { size: 17, color: S.accent, align: "right" });
            const x = px + 290, w = pw - 290 - 30;
            txt(b, res.aborted ? W("scena.wynik.przerwanaNaglowek") : Watki.wstaw(W("scena.wynik.naglowek"), { nr: res.shift }), x, py + 22, w, { size: 16, color: S.muted, bold: true });
            txt(b, res.aborted ? W("scena.wynik.przerwanaNazwa") : res.gradeName, x, py + 42, w, { size: 40, color: res.aborted ? BAD : S.accent, bold: true });
            for (let i = 0; i < 5; i++) {   // the grade in horseshoes (a gold ring each: filled or hollow)
                const ix = x + w - 5 * 42 + i * 42;
                b.context.save(); b.context.globalAlpha = i < res.grade ? 1 : 0.22;
                b.context.strokeStyle = S.accent; b.context.lineWidth = 6; b.context.beginPath(); b.context.arc(ix + 19, py + 56, 13, Math.PI * 0.85, Math.PI * 2.15); b.context.stroke();
                b.context.restore();
            }
            dirty(b);
            txt(b, Watki.wstaw(W("scena.wynik.punkty"), { ocena: res.grade || "-", pkt: res.score, poziom: res.level ? Watki.wstaw(W("scena.karta.poziom"), { L: res.level }) : "" }), x, py + 94, w, { size: 18, color: S.muted });
            y = py + 132;
            for (const id of this.partIds) {
                const r = res.parts[id], def = PART_DEFS[id];
                txt(b, def.title, x, y, 190, { size: 19, color: r ? S.text : S.muted });
                if (r) { bar(b, x + 196, y + 10, 210, 9, r.score / 100, scoreColour(r.score)); txt(b, String(r.score), x + 410, y, 60, { size: 19, color: scoreColour(r.score), bold: true, align: "right" }); }
                else txt(b, "-", x + 196, y, 200, { size: 19, color: S.muted });
                y += 32;
            }
            const mx = x + 506, mw = w - 506;
            let my = py + 128;
            const money = [[W("scena.wynik.dniowka"), res.wage, S.text, ""], [W("scena.wynik.premie"), res.bonus, GOOD, "+"], [W("scena.wynik.potracenia"), -res.deduct, res.deduct ? BAD : S.muted, ""]];
            if (res.extra) money.push([W("scena.wynik.dodatek"), res.extra, S.accent, "+"]);
            if (res.floor > 0) money.push([W("scena.wynik.minimum"), res.floor, S.text, "+"]);
            money.push([W("scena.wynik.napiwki"), res.tips, S.accent, "+"]);
            panel(b, mx - 14, my - 10, mw + 14, 30 * money.length + 64, { cut: 6, accent: false, fill: "rgba(20,22,27,0.9)" });
            for (const [nm, v, c, sign] of money) { txt(b, nm, mx, my, mw - 100, { size: 18, color: S.muted }); txt(b, sign + v + " G", mx + mw - 110, my, 96, { size: 18, color: c, bold: true, align: "right" }); my += 30; }
            b.fillRect(mx, my + 2, mw - 14, 1, S.line);
            txt(b, W("scena.wynik.razem"), mx, my + 12, mw - 120, { size: 22, color: S.accent, bold: true });
            txt(b, res.total + " G", mx + mw - 150, my + 8, 136, { size: 28, color: S.accent, bold: true, align: "right" });
            y = Math.max(y, my + 70);
            const colW = Math.floor((w - 20) / 2);
            txt(b, W("scena.wynik.dobrze"), x, y, colW, { size: 20, color: GOOD, bold: true });
            txt(b, W("scena.wynik.zle"), x + colW + 20, y, colW, { size: 20, color: BAD, bold: true });
            let gy = y + 34, by = y + 34;
            // (a point's dot only by its first line; its wrapped lines stand under the text)
            for (const g of res.good.length ? res.good : ["-"]) wrapLines(b, g, colW - 20, 18).forEach((l, k) => { if (!k) b.fillRect(x + 2, gy + 9, 6, 6, GOOD); txt(b, l, x + 18, gy, colW - 18, { size: 18 }); gy += 26; });
            for (const g of res.bad.length ? res.bad : [W("scena.wynik.nicZle")]) wrapLines(b, g, colW - 20, 18).forEach((l, k) => { if (!k) b.fillRect(x + colW + 22, by + 9, 6, 6, BAD); txt(b, l, x + colW + 38, by, colW - 18, { size: 18 }); by += 26; });
            const fy = py + ph - 50;
            b.fillRect(px + 24, fy - 10, pw - 48, 1, S.line);
            const end = this.startHour + res.hours, endH = String(Math.floor(end) % 24).padStart(2, "0") + ":" + String(Math.round((end % 1) * 60) % 60).padStart(2, "0");
            const trustPts = (TW.call("Stajnia", "state") || {}).trust || 0;
            txt(b, Watki.wstaw(W("scena.wynik.stopka"), { od: this.clockText(0), do: endH, wytrz: res.stamina, razem: res.total }), px + 30, fy, pw - 300, { size: 17, color: S.muted });
            txt(b, W("scena.wynik.ok"), px, fy - 2, pw - 30, { size: 21, color: S.accent, bold: true, align: "right" });
            if (!res.aborted) txt(b, Watki.wstaw(W("scena.wynik.zaufanie"), { pkt: trustPts + 1 + (res.grade >= 4 ? 1 : 0) }), px + 30, fy - 30, pw - 60, { size: 16, color: S.accent });
        }
    }
    Scene_Stajnia.gameId = "Stajnia";
    window.Scene_Stajnia = Scene_Stajnia;

    // ==================================================================
    // API
    // ==================================================================
    const scene = () => (ui.running instanceof Scene_Stajnia ? ui.running : null);
    const Stajnia_Zmiana = {
        PART_ORDER, levelCfg, GRADES, BOXES, STATION,
        onTick: null,
        lastResult: null,
        start(opts) { return ui.open(Scene_Stajnia, opts || {}); },
        isRunning: () => !!scene(),
        scene: () => scene(),
        level: () => Math.min(MAX_LEVEL, progressOf()),
        state() {
            const s = scene();
            if (!s) return null;
            return { phase: s.phase, paused: !!(s.card && s.card.kind === "choice"), part: s.part ? s.part.id : null, partIndex: s.partIndex, parts: s.partIds.slice(), level: s.level, tips: s.ctx.tips,
                card: s.phase === "card" ? s.cardId : null, data: s.part && s.phase === "play" ? s.part.state() : null, result: s.result || null };
        },
        skip(score) { const s = scene(); return s ? s.skipPart(score === undefined ? 100 : score) : false; },
        abort() { const s = scene(); if (s && (s.phase === "play" || s.phase === "card" || s.phase === "banner")) { s.abort(); return true; } return false; },
        path(fx, fy, tx, ty) { const s = scene(), p = s && s.part && s.part.yard; return p ? p.path(fx, fy, tx, ty) : null; }
    };
    window.Stajnia_Zmiana = TW.register("Stajnia_Zmiana", Stajnia_Zmiana);
})();
