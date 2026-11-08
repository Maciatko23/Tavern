# -*- coding: utf-8 -*-
"""Obrazy prawdziwej mapy wyspy na nowo ze zdjęć map (po zmianach map: najpierw MAPY=wszystkie node tools/mapy/mapa_prawdziwa_zrzuty.js,
potem to). Ze zdjęć 8 px na kratkę (tools/mapy/zrzuty_prawdziwa) robi wszystko, czego szuka MapaWyspy.js (dane i kod bez zmian):
  - img/mapa_wyspy/<id>.png - 4 px na kratkę, brzegi bez sąsiedniej mapy (otwarte morze) miękko znikają na FEATHER px,
  - img/mapa_wyspy/mgla/<id>.png - mgła nad lądem mapy (rozmyta, wyblakła, jaśniejsza; woda przezroczysta - widać morze),
  - img/mapa_wyspy/morze.png - kafel otwartego morza 8 x 8 kratek z mapy 910.
(To samo, co mapa_prawdziwa.py i mapa_prawdziwa_mgla.py robiły z obrazami - zebrane, do powtarzania.)
  python tools/mapy/mapa_prawdziwa_obrazy.py              (do tools/mapy/staging_mapa/img/mapa_wyspy)
  python tools/mapy/mapa_prawdziwa_obrazy.py --wykonaj    (do img/mapa_wyspy)
  [--zrzuty <folder>]  zdjęcia z innego folderu niż tools/mapy/zrzuty_prawdziwa (mapy, których tam nie ma - z zrzuty_prawdziwa)
Mur raz (gracz 2026-11-07, wariant A): mapy z kopią muru sąsiadki zdejmuj z ich wersji bez kopii - python tools/mapy/kopie_murow.py,
potem GAME_OVERLAY=tools/mapy/staging_bez_kopii MAPY=<mapy, które wypisze> node tools/mapy/mapa_prawdziwa_zrzuty.js."""
import json, os, re, sys
import numpy as np
import cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
SHOTS0 = os.path.join(HERE, "zrzuty_prawdziwa")
SHOTS1 = sys.argv[sys.argv.index("--zrzuty") + 1] if "--zrzuty" in sys.argv else None
def shot_path(mid):
    p = os.path.join(SHOTS1, "%d.png" % mid) if SHOTS1 else None
    return p if p and os.path.exists(p) else os.path.join(SHOTS0, "%d.png" % mid)
OUT = os.path.join(ROOT, "img", "mapa_wyspy") if "--wykonaj" in sys.argv else os.path.join(HERE, "staging_mapa", "img", "mapa_wyspy")
os.makedirs(os.path.join(OUT, "mgla"), exist_ok=True)
PPT, FEATHER, PAD, FPPT = 4, 10, 3, 2
HAZE = np.array([196, 208, 214], float)
uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
data = open(os.path.join(ROOT, "js", "plugins", "MapaWyspy_Data.js"), "rb").read().decode("utf-8")
ids = [int(v) for v in re.search(r"const MAPY_OBRAZY = \[([^\]]*)\];", data).group(1).split(",")]


def tiles(m):
    d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8"))
    return d["width"], d["height"], d["data"]


def land_of(m):
    W, H, t = tiles(m); n = W * H
    return np.array([[0 if (2048 <= t[y * W + x] < 2816) or t[5 * n + y * W + x] == 61 else 1 for x in range(W)] for y in range(H)], np.uint8)


def covered(x, y, me):
    return any(k != me and r["x0"] <= x < r["x0"] + r["szer"] and r["y0"] <= y < r["y0"] + r["wys"] for k, r in uk.items())


total = 0
for mid in ids:
    r = uk[mid]; w, h = r["szer"], r["wys"]
    shot = Image.open(shot_path(mid)).convert("RGB")
    if shot.size != (w * 8, h * 8): raise SystemExit("mapa %d: zdjęcie %s, a powinno %dx%d" % (mid, shot.size, w * 8, h * 8))
    rgb = np.array(shot.resize((w * PPT, h * PPT), Image.LANCZOS))
    free = np.zeros((h * PPT + 2, w * PPT + 2), np.uint8)
    for x in range(w):
        if not covered(r["x0"] + x, r["y0"] - 1, mid): free[0, 1 + x * PPT:1 + (x + 1) * PPT] = 1
        if not covered(r["x0"] + x, r["y0"] + h, mid): free[-1, 1 + x * PPT:1 + (x + 1) * PPT] = 1
    for y in range(h):
        if not covered(r["x0"] - 1, r["y0"] + y, mid): free[1 + y * PPT:1 + (y + 1) * PPT, 0] = 1
        if not covered(r["x0"] + w, r["y0"] + y, mid): free[1 + y * PPT:1 + (y + 1) * PPT, -1] = 1
    alpha = np.clip(cv2.distanceTransform((1 - free).astype(np.uint8), cv2.DIST_L2, 5)[1:-1, 1:-1] / FEATHER, 0, 1) if free.any() else np.ones((h * PPT, w * PPT))
    p = os.path.join(OUT, "%d.png" % mid)
    Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA").save(p, optimize=True); total += os.path.getsize(p)
    # the fog over its land
    small = np.array(Image.fromarray(rgb).resize((w * FPPT, h * FPPT), Image.BOX)).astype(float)
    P = PAD * FPPT
    big = cv2.GaussianBlur(np.pad(small, ((P, P), (P, P), (0, 0)), mode="edge"), (0, 0), 2.2 * FPPT)
    big = (big * 0.4 + big.mean(2, keepdims=True) * 0.6) * 0.62 + HAZE * 0.38
    mask = np.zeros(big.shape[:2], np.float32)
    mask[P:-P, P:-P] = np.kron(land_of(mid), np.ones((FPPT, FPPT))).astype(np.float32)
    mask = np.clip(cv2.GaussianBlur(cv2.dilate(mask, np.ones((2 * FPPT + 1, 2 * FPPT + 1), np.uint8)), (0, 0), 1.6 * FPPT) * 1.4, 0, 1)
    p = os.path.join(OUT, "mgla", "%d.png" % mid)
    Image.fromarray(np.dstack([np.clip(big, 0, 255), mask * 255]).astype(np.uint8), "RGBA").save(p, optimize=True); total += os.path.getsize(p)
# the sea's tile
W, H, t = tiles(910); n = W * H
water = np.array([[2048 <= t[y * W + x] < 2816 and not any(t[z * n + y * W + x] for z in (1, 2, 3)) for x in range(W)] for y in range(H)])
deep = set(zip(*np.where(cv2.distanceTransform(water.astype(np.uint8), cv2.DIST_L1, 3) >= 10)[::-1]))
bx, by = next((x, y) for (x, y) in sorted(deep, key=lambda p: (p[1], p[0])) if all((x + i, y + j) in deep for i in range(8) for j in range(8)))
src910 = Image.open(shot_path(910)).convert("RGB").resize((uk[910]["szer"] * PPT, uk[910]["wys"] * PPT), Image.LANCZOS)
src910.crop((bx * PPT, by * PPT, (bx + 8) * PPT, (by + 8) * PPT)).save(os.path.join(OUT, "morze.png"))
print("obrazy: %d map + mgła + morze, %.1f MB -> %s" % (len(ids), total / 1048576.0, OUT))
