//=============================================================================
// Popiersie.js
//=============================================================================
// The hero's talk bust in PixelLab pixel art (2026-11-17, the user: "popiersie gracza z różnymi przedmiotami ... bardzo szczegółowo
// w PixelLab", "w rozmowach to samo popiersie, patrzące w lewą stronę, i do niego ekwipunek"): the base Hero_Bust_Baza (256x256,
// head and torso turned three-quarters left) with a layer for every worn piece that shows on a bust (Popiersie_Data.js: a hat, a
// hood, a helmet, a shirt, a jacket, armour, a cloak, a scarf, a bag...), each drawn on that same face in PixelLab and cut out
// (tools/popiersie_pl). A piece of another colour or material than its layer's own (the red kerchief, the bronze helmet) is put on
// that look's ramp by brightness - the ramps Ubior.js colours the hero on the map with. The bust is ONE live Bitmap, redrawn only
// when the outfit changes; whoever loads "Hero_Bust" (the talks, the menu card, the dice, the shift cards) gets it.

/*:
 * @target MZ
 * @plugindesc Popiersie bohatera z PixelLab: baza + warstwy noszonych rzeczy (hełmy, kaptury, koszule, zbroje, płaszcze), kolory jak na mapie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Ubior
 * @orderAfter Ubior_Bron
 *
 * @help
 * Popiersie.js - popiersie bohatera w rozmowach
 *   Portret bazowy (img/pictures/Hero_Bust_Baza.png) i warstwy
 *   (img/pictures/popiersie/<rodzina>.png + <rodzina>_ukryj.png - piksele
 *   bazy, które rzecz zasłania, np. włosy pod hełmem). Dane: Popiersie_Data.js
 *   (tools/popiersie_pl/instaluj.py). Rzecz o innym kolorze / materiale niż
 *   jej warstwa - przemalowana rampą jej wzoru z Ubior.patterns().
 *   Popiersie.key() - zestaw teraz; Popiersie.worn() - noszone rodziny.
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.PopiersieData;
    if (!T || !D) throw new Error("Popiersie.js: brak TawernaCore.js / Popiersie_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Popiersie", BUST = "Hero_Bust", SIZE = D.ROZMIAR || 256;
    const report = (where, e) => console.error("[Popiersie] " + where + ":", e);
    const U = () => window.Ubior;
    const _loadPicture = ImageManager.loadPicture;
    const pic = name => _loadPicture.call(ImageManager, name);

    // which family a worn look (wzor) or item falls into
    const byWzor = {}, byItem = {};
    for (const [k, f] of Object.entries(D.RODZINY)) {
        for (const w of f.wzory || []) byWzor[w] = k;
        for (const i of f.przedmioty || []) byItem[i] = k;
    }
    // the worn pieces that show on a bust: [{ fam, wzor }] in the families' drawing order (Equipment's slots -> Ubior.itemLook).
    // (2026-11-25, the user: "po zmianie ekwipunku rozmowa z kimś bardzo mocno spowalnia grę" - a talk asks for the bust every frame,
    // and this read Equipment.slots(): the whole card - the weapon's words, its traits, the wear, for an empty place the bag and the
    // shops searched. Now only the worn ids (Equipment.current), and the list is made again only when they change.)
    let wornSig = null, wornList = [];
    function worn() {
        const E = window.Equipment, out = [], seen = new Set();
        if (!E || !E.SLOTS || !E.current) return out;
        let ids = [];
        try { ids = E.SLOTS.map(d => E.current(d.id) || 0); } catch (e) { ids = []; }
        const sig = ids.join(",");
        if (sig === wornSig) return wornList;
        for (const id of ids) {
            if (!id) continue;
            let look = null;
            try { look = U() && U().itemLook ? U().itemLook(id) : null; } catch (e) { look = null; }
            const wz = look && look.wzor, fam = (wz && byWzor[wz]) || byItem[id];
            if (!fam || seen.has(fam)) continue;
            seen.add(fam);
            out.push({ fam, wzor: wz || null });
        }
        out.sort((a, b) => D.RODZINY[a.fam].kolejnosc - D.RODZINY[b.fam].kolejnosc);
        wornSig = sig;
        wornList = out;
        return out;
    }
    const keyOf = list => list.map(p => p.fam + ":" + (p.wzor || "")).join("|");

    // ---- the colours: a layer is drawn in its family's native look; another look of the family = its pixels on that look's ramp by
    // brightness. The native look: the family's look whose ramp's middle colour is nearest to the layer's own middle colour.
    const hex = h => { const n = parseInt(String(h).replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
    function rampOf(wzor) {
        try { const W = U() && U().patterns ? U().patterns() : null, p = W && W[wzor]; return p && p.rampa && p.rampa.length ? p.rampa : null; } catch (e) { return null; }
    }
    const nativeOf = {}, recoloured = new Map();
    function layerStats(bmp) {
        const cv = bmp._canvas || bmp._image, w = bmp.width, h = bmp.height;
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const ctx = c.getContext("2d"); ctx.drawImage(cv, 0, 0);
        const img = ctx.getImageData(0, 0, w, h), px = img.data, ls = [];
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 0) { ls.push(luma(px[i], px[i + 1], px[i + 2])); r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
        ls.sort((x, y) => x - y);
        return { img, ctx, c, lo: ls.length ? ls[Math.floor(ls.length * 0.04)] : 0, hi: ls.length ? ls[Math.floor(ls.length * 0.96)] : 255, mid: n ? [r / n, g / n, b / n] : [128, 128, 128] };
    }
    function native(fam, bmp) {
        if (nativeOf[fam] !== undefined) return nativeOf[fam];
        const st = layerStats(bmp);
        let best = null, bd = 1e9;
        for (const w of D.RODZINY[fam].wzory || []) {
            const r = rampOf(w);
            if (!r) continue;
            const m = hex(r[Math.floor(r.length / 2)]), d = Math.hypot(m[0] - st.mid[0], m[1] - st.mid[1], m[2] - st.mid[2]);
            if (d < bd) { bd = d; best = w; }
        }
        nativeOf[fam] = best;
        return best;
    }
    // the layer as a canvas in the wanted look (the native one: the picture as it is)
    function layerCanvas(fam, wzor, bmp) {
        const own = bmp._canvas || bmp._image;
        if (!wzor || wzor === native(fam, bmp)) return own;
        const ramp = rampOf(wzor);
        if (!ramp) return own;
        const ck = fam + "@" + wzor;
        if (recoloured.has(ck)) return recoloured.get(ck);
        const st = layerStats(bmp), px = st.img.data, R = ramp.map(hex), n = R.length, span = Math.max(1, st.hi - st.lo);
        for (let i = 0; i < px.length; i += 4) {
            if (!px[i + 3]) continue;
            const t = Math.min(1, Math.max(0, (luma(px[i], px[i + 1], px[i + 2]) - st.lo) / span)), c = R[Math.min(n - 1, Math.round(t * (n - 1)))];
            px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
        }
        st.ctx.putImageData(st.img, 0, 0);
        recoloured.set(ck, st.c);
        if (recoloured.size > 24) recoloured.delete(recoloured.keys().next().value);
        return st.c;
    }

    // ---- the live bust: one Bitmap, redrawn when the outfit (or a picture coming in) changes it
    let live = null, liveKey = null, pending = false;
    function redraw() {
        pending = false;
        const list = worn(), k = keyOf(list), base = pic(D.BAZA);
        const parts = list.map(p => ({ p, f: D.RODZINY[p.fam], bmp: pic(D.RODZINY[p.fam].plik), mask: D.RODZINY[p.fam].ukryj ? pic(D.RODZINY[p.fam].ukryj) : null }));
        const waiting = [base].concat(parts.map(x => x.bmp), parts.map(x => x.mask).filter(Boolean)).filter(b => !b.isReady());
        if (waiting.length) {
            if (!pending) { pending = true; waiting.forEach(b => b.addLoadListener(() => { liveKey = null; if (live) redraw(); })); }
            if (liveKey !== null) return;   // (the last good one stays until all is there)
        }
        if (k === liveKey) return;
        try {
            const ctx = live.context;
            ctx.save();
            ctx.clearRect(0, 0, SIZE, SIZE);
            if (base.isReady()) ctx.drawImage(base._canvas || base._image, 0, 0, SIZE, SIZE);
            // the base's pixels the pieces hide (the hair under a helmet, the tunic under a jacket's edge)
            ctx.globalCompositeOperation = "destination-out";
            for (const x of parts) if (x.mask && x.mask.isReady()) ctx.drawImage(x.mask._canvas || x.mask._image, 0, 0, SIZE, SIZE);
            ctx.globalCompositeOperation = "source-over";
            for (const x of parts) if (x.bmp.isReady()) ctx.drawImage(layerCanvas(x.p.fam, x.p.wzor, x.bmp), 0, 0, SIZE, SIZE);
            ctx.restore();
            live._baseTexture.update();
            if (!waiting.length) liveKey = k;
        } catch (e) { report("składanie", e); }
    }
    function bust() {
        if (!live) {
            live = new Bitmap(SIZE, SIZE);
            live._url = "img/pictures/" + BUST + ".png";
            live.smooth = false;
        }
        try { if (keyOf(worn()) !== liveKey) redraw(); } catch (e) { report("popiersie", e); }
        return live;
    }

    // ---- who asks for "Hero_Bust" gets the live one (outside Ubior's old painted-bust hook: this one wraps it)
    ImageManager.loadPicture = function(filename) {
        return filename === BUST ? bust() : _loadPicture.apply(this, arguments);
    };
    function hookUi() {
        const ui = T.ui;
        if (!ui || !ui.loadBust || ui._popiersieHooked) return;
        const load = ui.loadBust;
        ui.loadBust = function(name) { return name === BUST ? bust() : load.apply(this, arguments); };
        ui._popiersieHooked = true;
    }
    // (Ubior hooks the kit's loader when the first map is made: this one after it, so it is the outer one)
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        try { hookUi(); } catch (e) { report("podpięcie", e); }
    };
    // the base and every layer asked for early (a talk must not wait for them)
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        try {
            pic(D.BAZA);
            for (const f of Object.values(D.RODZINY)) { pic(f.plik); if (f.ukryj) pic(f.ukryj); }
        } catch (e) { report("wczytanie", e); }
    };
    // a new game / a load: the outfit may be another
    T.on("mapReady", () => { liveKey = liveKey === null ? null : "?"; });

    window.Popiersie = T.register(PLUGIN, {
        worn, key: () => keyOf(worn()), bust, redraw: () => { liveKey = "?"; return bust(); }, RODZINY: D.RODZINY
    });
})();
