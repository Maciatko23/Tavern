# -*- coding: utf-8 -*-
"""Prawdziwa mapa wyspy: jeden prostokąt, morze i mgła (gracz 2026-11-07 do zrzutu przybliżenia: „czy to jest profesjonalnie?
mapa ma być jak kwadrat lub prostokąt; jak jest ciemno, wypełnij wodą, morzem”). Pod E zamiast czarnego tła i ciemnego lądu:
  - morze wszędzie poza mapami: kafel otwartego morza wycięty z obrazu mapy (img/mapa_wyspy/morze.png, 8 x 8 kratek, w siatce
    kratek świata - zlewa się z wodą na obrazach map),
  - niezwiedzone mapy: MGŁA - ich obraz rozmyty, wyblakły, jaśniejszy (img/mapa_wyspy/mgla/<id>.png, 2 px na kratkę, z miękkim
    brzegiem 3 kratki na zewnątrz): widać tylko plamy lądu, wody i miasta, nic z bliska; nachodzi miękko na brzeg zwiedzonej sąsiadki,
  - zwiedzone mapy ostre jak dotąd; szkicowego lądu i jego brzegu w prawdziwej mapie już nie ma.
Gotowe obrazki (gra nic nie rozmywa w czasie gry).
  python tools/mapy/mapa_prawdziwa_mgla.py              (kopia w tools/mapy/staging_mapa: js + img)
  python tools/mapy/mapa_prawdziwa_mgla.py --wykonaj    (do gry; kopie: tools/mapy/kopie_zapasowe/<czas>_mgla)"""
import datetime, json, os, re, shutil, sys
import numpy as np
import cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging_mapa")
DO = ROOT if "--wykonaj" in sys.argv else STG
SRC = os.path.join(ROOT, "img", "mapa_wyspy")   # (the real map's pictures, 4 px a tile)
PAD, FPPT = 3, 2   # (the fog's soft rim outside the map, tiles; the fog picture's px a tile)


def rep(s, old, new, what):
    if s.count(old) != 1: raise SystemExit("%s: %r (%d)" % (what, old[:70], s.count(old)))
    return s.replace(old, new)


data = open(os.path.join(PLUG, "MapaWyspy_Data.js"), "rb").read().decode("utf-8")
ids = [int(v) for v in re.search(r"const MAPY_OBRAZY = \[([^\]]*)\];", data).group(1).split(",")]
out_img = os.path.join(DO, "img", "mapa_wyspy"); os.makedirs(os.path.join(out_img, "mgla"), exist_ok=True)

# 1. the sea's tile: an 8 x 8 block of open sea (10+ tiles from anything but water) from map 910's picture, on the tiles' grid
d = json.load(open(os.path.join(ROOT, "data", "Map910.json"), encoding="utf-8"))
W, H, t = d["width"], d["height"], d["data"]; n = W * H
water = np.array([[2048 <= t[y * W + x] < 2816 and not any(t[z * n + y * W + x] for z in (1, 2, 3)) for x in range(W)] for y in range(H)])
dist = cv2.distanceTransform(water.astype(np.uint8), cv2.DIST_L1, 3)
deep = set(zip(*np.where(dist >= 10)[::-1]))
blk = next((x, y) for (x, y) in sorted(deep, key=lambda p: (p[1], p[0])) if all((x + i, y + j) in deep for i in range(8) for j in range(8)))
im = Image.open(os.path.join(SRC, "910.png")).convert("RGB")
sea = im.crop((blk[0] * 4, blk[1] * 4, (blk[0] + 8) * 4, (blk[1] + 8) * 4))
sea.save(os.path.join(out_img, "morze.png"))
print("morze: kafel 8x8 kratek z mapy 910 w (%d,%d), średnio %s" % (blk[0], blk[1], np.array(sea).reshape(-1, 3).mean(0).round(1)))

# 1b. the sharp pictures: their edges that touch no other map (the open sea round them) fade out over FEATHER px - the map's water
# joins the sea, a coast's reddish shallows are not cut by a straight line
sys.path.insert(0, HERE)
import swiat_mapa_wyspy as S
uk = S.uklad()
FEATHER = 10
def covered(x, y, me):   # (a world tile inside another map's rectangle)
    return any(k != me and r["x0"] <= x < r["x0"] + r["szer"] and r["y0"] <= y < r["y0"] + r["wys"] for k, r in uk.items())
def land_of(mid):
    d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
    W, H, t = d["width"], d["height"], d["data"]; n = W * H
    return np.array([[0 if (2048 <= t[y * W + x] < 2816) or t[5 * n + y * W + x] == 61 else 1 for x in range(W)] for y in range(H)], np.uint8)
feathered = 0
for mid in ids:
    r = uk[mid]; w, h = r["szer"], r["wys"]
    rgb = np.array(Image.open(os.path.join(SRC, "%d.png" % mid)).convert("RGB"))
    free = np.zeros((h * 4 + 2, w * 4 + 2), np.uint8)   # (a frame one px round the picture: 1 where the sea is beyond)
    for x in range(w):
        if not covered(r["x0"] + x, r["y0"] - 1, mid): free[0, 1 + x * 4:1 + x * 4 + 4] = 1
        if not covered(r["x0"] + x, r["y0"] + h, mid): free[-1, 1 + x * 4:1 + x * 4 + 4] = 1
    for y in range(h):
        if not covered(r["x0"] - 1, r["y0"] + y, mid): free[1 + y * 4:1 + y * 4 + 4, 0] = 1
        if not covered(r["x0"] + w, r["y0"] + y, mid): free[1 + y * 4:1 + y * 4 + 4, -1] = 1
    if free.any():
        dist = cv2.distanceTransform((1 - free).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1]
        alpha = np.clip(dist / FEATHER, 0, 1)
        feathered += 1
    else:
        alpha = np.ones((h * 4, w * 4))
    Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA").save(os.path.join(out_img, "%d.png" % mid), optimize=True)
print("ostre obrazy: %d map, %d z miękkim brzegiem nad otwartym morzem" % (len(ids), feathered))

# 2. the fog of every map's LAND (its water stays the sea): blurred (2 tiles), washed out, lighter; a soft rim round the land
HAZE = np.array([196, 208, 214], float)
total = 0
for mid in ids:
    src = Image.open(os.path.join(SRC, "%d.png" % mid)).convert("RGB")
    w, h = src.width // 4, src.height // 4
    land = land_of(mid)
    small = np.array(src.resize((w * FPPT, h * FPPT), Image.BOX)).astype(float)
    P = PAD * FPPT
    big = np.pad(small, ((P, P), (P, P), (0, 0)), mode="edge")
    big = cv2.GaussianBlur(big, (0, 0), 2.2 * FPPT)
    lum = big.mean(2, keepdims=True)
    big = big * 0.4 + lum * 0.6                      # (washed out)
    big = big * 0.62 + HAZE * 0.38                   # (a light haze over it)
    mask = np.zeros(big.shape[:2], np.float32)
    mask[P:-P, P:-P] = np.kron(land, np.ones((FPPT, FPPT))).astype(np.float32)   # (only the land: the water shows the sea)
    mask = cv2.dilate(mask, np.ones((2 * FPPT + 1, 2 * FPPT + 1), np.uint8))
    mask = np.clip(cv2.GaussianBlur(mask, (0, 0), 1.6 * FPPT) * 1.4, 0, 1)
    rgba = np.dstack([np.clip(big, 0, 255), mask * 255]).astype(np.uint8)
    p = os.path.join(out_img, "mgla", "%d.png" % mid)
    Image.fromarray(rgba, "RGBA").save(p, optimize=True)
    total += os.path.getsize(p)
print("mgła: %d map, %.2f MB" % (len(ids), total / 1048576.0))

# 3. MapaWyspy.js: the sea's pattern under the real map, the fog over the maps not visited, no sketch land in it
mw = open(os.path.join(PLUG, "MapaWyspy.js"), "rb").read().decode("utf-8")
Wn = "MapaWyspy.js"
if "mgla/" in mw: raise SystemExit("już zrobione: MapaWyspy.js ma mgłę")
mw = rep(mw, """        if (o.sea !== false) { ctx.fillStyle = K.sea; if (c && c.roundPath) { c.roundPath(ctx, rect.x, rect.y, rect.w, rect.h, 12); ctx.fill(); } else ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
        for (const line of [null].concat(D.BRZEGI || [])) {   // (the island, then its islets)""",
"""        if (o.seaFill) o.seaFill(ctx);   // (the real map: the sea's own picture)
        else if (o.sea !== false) { ctx.fillStyle = K.sea; if (c && c.roundPath) { c.roundPath(ctx, rect.x, rect.y, rect.w, rect.h, 12); ctx.fill(); } else ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
        for (const line of o.real ? [] : [null].concat(D.BRZEGI || [])) {   // (the island, then its islets; the real map: its pictures)""", Wn)
mw = rep(mw, """        // the visited maps' pictures (each asked once; one not ready yet is drawn when it comes)
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
        };""", """        // the maps' pictures (each asked once; one not ready yet is drawn when it comes): a visited map sharp, the others their FOG
        // (2026-11-07, the user: "mapa ma być jak prostokąt; jak jest ciemno, wypełnij wodą, morzem" - img/mapa_wyspy/mgla/<id>.png:
        // blurred, washed out, a soft rim FOG_PAD tiles round the map - tools/mapy/mapa_prawdziwa_mgla.py)
        const FOG_PAD = 3;
        const pic = (view, folder, name) => {
            const bm = ImageManager.loadBitmap(folder, name);
            if (!bm.isReady() && !bm._mwWait) { bm._mwWait = true; bm.addLoadListener(() => { bm._mwWait = false; view._zoomDirty = true; }); }
            return bm;
        };
        MapaView.prototype.realPics = function() {
            const out = [], R = window.SwiatData && window.SwiatData.maps;
            if (!R) return out;
            for (const id of REAL) {
                if (!R[id]) continue;
                const [x0, y0, w, h] = R[id], x = (x0 - D.SWIAT_BOX[0]) * PPT, y = (y0 - D.SWIAT_BOX[1]) * PPT;
                if (discovered(id)) out.push({ bm: pic(this, "img/mapa_wyspy/", id), x, y, w: w * PPT, h: h * PPT, fog: false });
                else out.push({ bm: pic(this, "img/mapa_wyspy/mgla/", id), x: x - FOG_PAD * PPT, y: y - FOG_PAD * PPT, w: (w + 2 * FOG_PAD) * PPT, h: (h + 2 * FOG_PAD) * PPT, fog: true });
            }
            out.sort((a, b) => a.fog - b.fog);   // (the fog over the sharp ones: its soft rim lies over a visited neighbour's edge)
            return out;
        };""", Wn)
mw = rep(mw, """            const pics = this.realPics(), box = { x: -x0, y: -y0, w: BOXW, h: BOXH };
            draw(bm, box, { box, real: true, nodes: nodes(), atlas: true, atKey: "at6", cursor: null,""",
"""            const pics = this.realPics(), box = { x: -x0, y: -y0, w: BOXW, h: BOXH }, sea = pic(this, "img/mapa_wyspy/", "morze");
            // the sea: its picture over the whole part, on the world's grid of tiles (it joins the maps' own water)
            const seaFill = ctx => {
                if (!sea.isReady()) { ctx.fillStyle = "rgb(76,142,147)"; ctx.fillRect(0, 0, w, h); return; }
                const src = sea._canvas || sea._image, pat = ctx.createPattern(src, "repeat"), s = sea.width;
                const ox = (((-x0) % s) + s) % s, oy = (((-y0) % s) + s) % s;
                ctx.save(); ctx.translate(ox - s, oy - s); ctx.fillStyle = pat; ctx.fillRect(0, 0, w + 2 * s, h + 2 * s); ctx.restore();
            };
            draw(bm, box, { box, real: true, nodes: nodes(), atlas: true, atKey: "at6", cursor: null, seaFill,""", Wn)
mw = rep(mw, "i wybór miejsca na schemacie; E/Q prawdziwa mapa (x6, odwiedzone mapy). v1.3.0", "i wybór miejsca na schemacie; E/Q prawdziwa mapa (x6, odwiedzone mapy, mgła, morze). v1.4.0", Wn)

os.makedirs(os.path.join(DO, "js", "plugins"), exist_ok=True)
if DO == ROOT:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_mgla"); os.makedirs(kop, exist_ok=True)
    shutil.copy(os.path.join(PLUG, "MapaWyspy.js"), kop)
    print("kopia:", kop)
open(os.path.join(DO, "js", "plugins", "MapaWyspy.js"), "wb").write(mw.encode("utf-8"))
print("zapisane w", DO)
