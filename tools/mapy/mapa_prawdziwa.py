# -*- coding: utf-8 -*-
"""Prawdziwa mapa wyspy pod E (gracz 2026-11-07: „a da się mapę prawdziwą zrobić, w sensie jakby oddaloną mocno, ale widać
malutkie drzewa i inne rzeczy?” -> „Szkic, x6”, „Tylko odwiedzone mapy”). Zakładka Mapa: cała wyspa dalej jako czytelny szkic
z nazwami; E - prawdziwa mapa (4 px na kratkę świata, ~x6): obrazy map świata w ich miejscach, tylko odwiedzonych (reszta wyspy:
ciemny ląd szkicu), nazwy miejsc z obwódką nad nimi (at6); Q / P - z powrotem szkic.
  - obrazy: tools/mapy/zrzuty_prawdziwa/<id>.png (8 px na kratkę, tools/mapy/mapa_prawdziwa_zrzuty.js) -> img/mapa_wyspy/<id>.png
    (4 px na kratkę),
  - dane (MapaWyspy_Data.js): SWIAT_BOX (pudełko wyspy w kratkach świata - to samo, na którym są x, y miejsc), MAPY_OBRAZY (mapy
    z obrazem: tylko o nie gra prosi - brak pliku dałby ekran błędu), at6 zamiast at3,
  - MapaWyspy.js: draw() z o.box / o.real / o.under; przybliżenie rysuje RAZ kawałek wokół obecnego i docelowego widoku, przesuwa
    się sama ramka obrazka (tools/mapy/mapa_wyspy_zoom.py dał szkic x3 - to zastępuje).
  python tools/mapy/mapa_prawdziwa.py              (kopia w tools/mapy/staging_mapa: js + img)
  python tools/mapy/mapa_prawdziwa.py --wykonaj    (do gry; kopie: tools/mapy/kopie_zapasowe/<czas>_prawdziwa)"""
import datetime, glob, json, os, re, shutil, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import swiat_mapa_wyspy as S
import mapa_wyspy_atlas as ATL
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging_mapa")
SHOTS = os.path.join(HERE, "zrzuty_prawdziwa")
PPT = 4
DO = ROOT if "--wykonaj" in sys.argv else STG


def rep(s, old, new, what):
    if s.count(old) != 1: raise SystemExit("%s: %r (%d)" % (what, old[:70], s.count(old)))
    return s.replace(old, new)


# the island's box in the world's tiles: exactly as mapa_wyspy_brzegowe.py made it (the old box with every map's rectangle, +3)
uk = S.uklad(); M = S.maska(); ys, xs = np.where(M); wl = S.wyspy_lad(uk); M = M.copy()
for m, (cells, _) in wl.items():
    for (x, y) in cells:
        if 0 <= y < M.shape[0] and 0 <= x < M.shape[1]: M[y, x] = True
ox0, oy0, ox1, oy1 = xs.min() - S.PAD, ys.min() - S.PAD, xs.max() + S.PAD, ys.max() + S.PAD
nx0 = min(ox0, min(r["x0"] for r in uk.values()) - 3); ny0 = min(oy0, min(r["y0"] for r in uk.values()) - 3)
nx1 = max(ox1, max(r["x0"] + r["szer"] for r in uk.values()) + 3); ny1 = max(oy1, max(r["y0"] + r["wys"] for r in uk.values()) + 3)
BOX = (int(nx0), int(ny0), int(nx1 - nx0), int(ny1 - ny0))
print("pudełko wyspy (kratki świata):", BOX)

# 1. the pictures
os.makedirs(os.path.join(DO, "img", "mapa_wyspy"), exist_ok=True)
ids, total = [], 0
for p in sorted(glob.glob(os.path.join(SHOTS, "*.png")), key=lambda q: int(os.path.basename(q)[:-4])):
    mid = int(os.path.basename(p)[:-4])
    if mid not in uk: continue
    r = uk[mid]
    im = Image.open(p).convert("RGB")
    if im.size != (r["szer"] * 8, r["wys"] * 8): raise SystemExit("mapa %d: obraz %s, a powinien %dx%d" % (mid, im.size, r["szer"] * 8, r["wys"] * 8))
    im = im.resize((r["szer"] * PPT, r["wys"] * PPT), Image.LANCZOS)
    out = os.path.join(DO, "img", "mapa_wyspy", "%d.png" % mid)
    im.save(out, optimize=True)
    ids.append(mid); total += os.path.getsize(out)
missing = sorted(set(int(k) for k in uk) - set(ids))
print("obrazy: %d map, %.1f MB%s" % (len(ids), total / 1048576.0, "; BEZ OBRAZU: %s" % missing if missing else ""))

# 2. the data
data = open(os.path.join(PLUG, "MapaWyspy_Data.js"), "rb").read().decode("utf-8")
if "SWIAT_BOX" in data: raise SystemExit("już zrobione: MapaWyspy_Data.js ma SWIAT_BOX")
data = re.sub(r", at3: \[[^\]]*\]", "", data)   # (the sketch x3's names: no more)
a = data.index("    const DROGI = ["); b = data.index("\n    ];", a)
rd = [(x.strip('"'), y.strip('"')) for x, y in re.findall(r'\[("podziemia"|\d+), ("podziemia"|\d+)\]', data[a:b])]
data, n, nl, bad = ATL.place(data, rd, key="at6", side=0, bw=BOX[2] * PPT, bh=BOX[3] * PPT)
print("napisy x6: %d miejsc, %d z kreską%s" % (n, nl, "; ZACHODZĄ: %s" % bad if bad else ", nic nie zachodzi"))
data = rep(data, "    window.MapaWyspyData = { ASPEKT, MIEJSCA, PODZIEMIA, DROGI, BRZEG, BRZEGI, KORYTO, LAS, WNETRZA, LUDZIE_FABULY };",
           "    // (2026-11-07, the real map under E - tools/mapy/mapa_prawdziwa.py) the island's box in the world's tiles (the places' x, y are on it),\n"
           "    // the maps that have their picture (img/mapa_wyspy/<id>.png, 4 px a tile)\n"
           "    const SWIAT_BOX = [%d, %d, %d, %d];\n    const MAPY_OBRAZY = [%s];\n\n" % (BOX[0], BOX[1], BOX[2], BOX[3], ", ".join(map(str, ids))) +
           "    window.MapaWyspyData = { ASPEKT, MIEJSCA, PODZIEMIA, DROGI, BRZEG, BRZEGI, KORYTO, LAS, WNETRZA, LUDZIE_FABULY, SWIAT_BOX, MAPY_OBRAZY };", "Data")
data = rep(data, "wnętrza przypisane do miejsc. v2.2.0", "wnętrza przypisane do miejsc. v2.3.0", "Data")

# 3. MapaWyspy.js
mw = open(os.path.join(PLUG, "MapaWyspy.js"), "rb").read().decode("utf-8")
W = "MapaWyspy.js"
mw = rep(mw, "at3: p.at3 || null,", "at6: p.at6 || null,", W)
mw = rep(mw, "const ctx = b.context, c = CH(), list = o.nodes || nodes(), box = boxIn(rect), out = [];", "const ctx = b.context, c = CH(), list = o.nodes || nodes(), box = o.box || boxIn(rect), out = [];", W)
mw = rep(mw, """            ctx.lineWidth = 1.5;
            ctx.strokeStyle = K.shore;
            ctx.stroke();
        }
        if (D.LAS && D.LAS.length) {""", """            ctx.lineWidth = 1.5;
            ctx.strokeStyle = K.shore;
            ctx.stroke();
        }
        if (o.under) o.under(ctx, box);   // (the real map: the visited maps' pictures over the land)
        if (!o.real && D.LAS && D.LAS.length) {""", W)
mw = rep(mw, "        if (D.KORYTO && D.KORYTO.length) {", "        if (!o.real && D.KORYTO && D.KORYTO.length) {", W)
mw = rep(mw, "        for (const [a, b2] of roads()) {", "        for (const [a, b2] of o.real ? [] : roads()) {   // (the real map: its own ways are seen)", W)
mw = rep(mw, """            const p = at(box, n), on = o.cursor !== undefined && o.cursor !== null && String(o.cursor) === n.key;""",
         """            const p = at(box, n), on = o.cursor !== undefined && o.cursor !== null && String(o.cursor) === n.key;
            if (o.real && (p.x < -260 || p.y < -60 || p.x > b.width + 260 || p.y > b.height + 60)) continue;   // (far off this part of the real map)""", W)
mw = rep(mw, """    // draw(bitmap, rect, o): the sea in the rect, the island, the roads, the places. o: { cursor, nodes (nodes()), selectable(key) -> bool""",
         """    // (2026-11-07) o.box: the island's box itself (not fitted in the rect); o.real: the real map - no forest, riverbed, roads, only
    // the places near the picture; o.under(ctx, box): drawn over the land, under the places
    // draw(bitmap, rect, o): the sea in the rect, the island, the roads, the places. o: { cursor, nodes (nodes()), selectable(key) -> bool""", W)
a = mw.index("    const ZOOM = 3;")
b = mw.index("\n", a) + 1
mw = mw[:a] + """    // (the atlas's rows over and under the sketch, px - tools/mapy/mapa_wyspy_atlas.py counts on them)
    // (2026-11-07, the user: "a da się mapę prawdziwą zrobić - jakby oddaloną mocno, ale widać malutkie drzewa i inne rzeczy?" ->
    // "Szkic, x6", "Tylko odwiedzone mapy") E: the REAL map - the world's maps as pictures (img/mapa_wyspy/<id>.png, PPT px a tile:
    // tools/mapy/mapa_prawdziwa.py), only the visited ones; the rest of the island its dark land; the names (at6) over them
    const PPT = 4, BOXW = D.SWIAT_BOX ? D.SWIAT_BOX[2] * PPT : 0, BOXH = D.SWIAT_BOX ? D.SWIAT_BOX[3] * PPT : 0;
    const REAL = (D.MAPY_OBRAZY || []).map(String);   // (only these are asked for: a missing picture would stop the game)
""" + mw[b:]
s0 = mw.index("""        // (2026-11-07, the user: "da się tę mapę powiększyć ze 3 razy i po niej się poruszać?" -> the cursor over the places) E: the""")
s1 = mw.index("""            if (this._card) return;
            if (Input.isTriggered("pagedown")) { this.zoomIn(); return; }   // (E)""")
mw = mw[:s0] + """        // (2026-11-07) the real map's field: the cursor over the places (W/S/A/D as on the sketch), the field sliding after it. A part
        // round the field's view and the view it slides to is drawn ONCE into a picture (draw() with the visited maps' pictures under
        // the places); the slide moves only that picture's frame
        let ringKept = null;
        const ringBitmap = () => {
            if (ringKept) return ringKept;
            const bm = new Bitmap(40, 40), x = bm.context;
            x.beginPath(); x.arc(20, 20, 14, 0, Math.PI * 2); x.fillStyle = "rgba(255,210,63,0.18)"; x.fill();
            x.beginPath(); x.arc(20, 20, 12, 0, Math.PI * 2); x.lineWidth = 2; x.strokeStyle = K.acc; x.stroke();
            bm._baseTexture.update();
            return (ringKept = bm);
        };
        const zxy = n => ({ x: n.x * BOXW, y: n.y * BOXH });   // (a place's point on the real map)
        // the visited maps' pictures (each asked once; one not ready yet is drawn when it comes)
        MapaView.prototype.realPics = function() {
            const out = [], R = window.SwiatData && window.SwiatData.maps;
            if (!R) return out;
            for (const id of REAL) {
                if (!discovered(id) || !R[id]) continue;
                const bm = ImageManager.loadBitmap("img/mapa_wyspy/", id);
                if (!bm.isReady() && !bm._mwWait) { bm._mwWait = true; bm.addLoadListener(() => { bm._mwWait = false; this._zoomDirty = true; }); }
                const [x0, y0, w, h] = R[id];
                out.push({ bm, x: (x0 - D.SWIAT_BOX[0]) * PPT, y: (y0 - D.SWIAT_BOX[1]) * PPT, w: w * PPT, h: h * PPT });
            }
            return out;
        };
        // the field's view (its top-left on the real map) round a point, kept on the map
        MapaView.prototype.viewAt = function(cx, cy) {
            const f = this._field;
            return { x: Math.round(Math.max(0, Math.min(BOXW - f.w, cx - f.w / 2))), y: Math.round(Math.max(0, Math.min(BOXH - f.h, cy - f.h / 2))) };
        };
        // the picture of the part round both views (a long jump: only the new one, no slide)
        MapaView.prototype.renderReal = function(a, b) {
            const f = this._field;
            let x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x) + f.w, y1 = Math.max(a.y, b.y) + f.h;
            if ((x1 - x0) * (y1 - y0) > 3.2e6) { x0 = b.x; y0 = b.y; x1 = b.x + f.w; y1 = b.y + f.h; this._zc = { x: b.x + f.w / 2, y: b.y + f.h / 2 }; }
            const w = x1 - x0, h = y1 - y0;
            let bm = this._zs.bitmap;
            if (!bm || bm.width !== w || bm.height !== h) { if (bm) bm.destroy(); bm = new Bitmap(w, h); this._zs.bitmap = bm; } else bm.clear();
            const pics = this.realPics(), box = { x: -x0, y: -y0, w: BOXW, h: BOXH };
            draw(bm, box, { box, real: true, nodes: nodes(), atlas: true, atKey: "at6", cursor: null,
                under: () => { for (const q of pics) if (q.bm.isReady() && q.x + q.w > x0 && q.x < x1 && q.y + q.h > y0 && q.y < y1) bm.blt(q.bm, 0, 0, q.bm.width, q.bm.height, q.x - x0, q.y - y0, q.w, q.h); } });
            bm._baseTexture.update();
            this._region = { x: x0, y: y0, w, h };
            this._zoomDirty = false;
        };
        // the picture holds where the field is and where it slides to (else drawn again)
        MapaView.prototype.ensureRegion = function(force) {
            const f = this._field, R = this._region, n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor));
            const cur = this.viewAt(this._zc.x, this._zc.y), tgt = n ? this.viewAt(n.x, n.y) : cur;
            const inside = v => !!R && v.x >= R.x && v.y >= R.y && v.x + f.w <= R.x + R.w && v.y + f.h <= R.y + R.h;
            if (force || !inside(cur) || !inside(tgt)) this.renderReal(cur, tgt);
        };
        MapaView.prototype.zoomIn = function() {
            const f = this._field;
            if (this._zoom || !f || !BOXW) { if (this._zoom) SoundManager.playBuzzer(); return; }
            if (!this._zs) { this._zs = new Sprite(); this.root.addChild(this._zs); this._ring = new Sprite(ringBitmap()); this._ring.anchor.set(0.5, 0.5); this.root.addChild(this._ring); }
            this._zoom = true;
            this._zoomNodes = nodes().map(q => Object.assign({}, q, zxy(q)));   // (the places on the real map: the cursor's moves)
            const n = this._zoomNodes.find(q => q.key === String(this._cursor)), v = n ? this.viewAt(n.x, n.y) : this.viewAt(BOXW / 2, BOXH / 2);
            this._zc = { x: v.x + f.w / 2, y: v.y + f.h / 2 };
            this._region = null;
            SoundManager.playCursor();
            this.redraw();
            this.scene.drawKeys();
        };
        MapaView.prototype.dropZoom = function() {
            this._zoom = false;
            this._zoomNodes = null;
            this._region = null;
            if (this._zs && this._zs.bitmap) { const bm = this._zs.bitmap; this._zs.bitmap = null; bm.destroy(); }
            if (this._zs) this._zs.visible = false;
            if (this._ring) this._ring.visible = false;
        };
        MapaView.prototype.zoomOut = function() {
            if (!this._zoom) return false;
            this.dropZoom();
            SoundManager.playCancel();
            this.redraw();
            this.scene.drawKeys();
            return true;
        };
        // the picture's frame at the slide's place, the cursor's ring over its place
        MapaView.prototype.place = function() {
            const f = this._field, bm = this._zs && this._zs.bitmap, R = this._region;
            if (!this._zoom || !f || !bm || !this._zc || !R) return;
            const v = this.viewAt(this._zc.x, this._zc.y);
            this._zs.setFrame(Math.max(0, Math.min(R.w - f.w, v.x - R.x)), Math.max(0, Math.min(R.h - f.h, v.y - R.y)), f.w, f.h);
            this._zs.x = f.x; this._zs.y = f.y;
            this._zs.visible = !this._card;
            const n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor)), rx = n ? n.x - v.x : -1, ry = n ? n.y - v.y : -1;
            this._ring.visible = !!n && !this._card && rx >= 0 && rx <= f.w && ry >= 0 && ry <= f.h;
            if (n) { this._ring.x = f.x + rx; this._ring.y = f.y + ry; }
            this._view = [v.x, v.y];
        };
        MapaView.prototype.update = function() {
            if (!this.ready()) return;
            if (this._zoom && this._zc && !this._card) {
                if (this._zoomDirty) { this.ensureRegion(true); this.place(); }   // (a picture came)
                const n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor));
                if (n) {   // the slide: a fifth of the way each frame, to the cursor's view
                    const t = this.viewAt(n.x, n.y), f = this._field, tx = t.x + f.w / 2, ty = t.y + f.h / 2, dx = tx - this._zc.x, dy = ty - this._zc.y;
                    if (Math.abs(dx) + Math.abs(dy) > 0.6) { this._zc.x += Math.abs(dx) < 1 ? dx : dx * 0.2; this._zc.y += Math.abs(dy) < 1 ? dy : dy * 0.2; this.place(); }
                }
            }
""" + mw[s1:]
mw = rep(mw, """            if (this._zoom) this.place();   // (zoomed: its own picture over the field)""",
         """            if (this._zoom) { this.ensureRegion(); this.place(); }   // (the real map: its own picture over the field)""", W)
mw = rep(mw, "i wybór miejsca na schemacie; E/Q przybliżenie x3. v1.2.0", "i wybór miejsca na schemacie; E/Q prawdziwa mapa (x6, odwiedzone mapy). v1.3.0", W)

os.makedirs(os.path.join(DO, "js", "plugins"), exist_ok=True)
if DO == ROOT:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_prawdziwa"); os.makedirs(kop, exist_ok=True)
    for f in ("MapaWyspy_Data.js", "MapaWyspy.js"): shutil.copy(os.path.join(PLUG, f), kop)
    print("kopie:", kop)
for f, s in (("MapaWyspy_Data.js", data), ("MapaWyspy.js", mw)): open(os.path.join(DO, "js", "plugins", f), "wb").write(s.encode("utf-8"))
print("zapisane w", DO)
