# -*- coding: utf-8 -*-
"""Drzwi Kruczogrodu z kafli paczki jako zdarzenia z animacją otwierania (gracz 2026-11-08: „wszystkie drzwi z tilesetów jako zdarzenie
i animacja otwierania przy wchodzeniu do domku” - drzwi do wnętrz; domy bez wnętrz zostają z kafla).
Dla każdego zdarzenia drzwi na mapie 8 (przejście 201, nie studnia ani płyta): obrazek img/characters/!$Drzwi_K_<id>.png (3 x 4 klatki
48 x 96 - kratka drzwi i ta nad nią): wiersz 1 zamknięte = dokładnie kafle B-E z mapy (więc nic nie skacze), wiersze 2-4 skrzydło
drzwi (drewno wykryte po barwie, otwór z wypełnionymi dziurami) zwęża się do zawiasu po lewej, a w otworze ciemne wnętrze. Zdarzenie
dostaje ten obrazek (kierunek w dół, klatka środkowa); jego lista z otwieraniem (skręty w lewo / prawo / w górę) zostaje - brakującą
dokłada. Po zmianie drzwi w edytorze: uruchomić znowu (przy zamkniętym edytorze).
  python tools/miasto3/drzwi/drzwi.py              (tylko obrazki + podgląd tools/miasto3/drzwi/klatki.png)
  python tools/miasto3/drzwi/drzwi.py --wykonaj    (też zdarzenia w data/Map008.json; kopia do archiwum)"""
import colorsys, datetime, json, os, shutil, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
T = 48
DO = "--wykonaj" in sys.argv
SKIP = {"Studnia miejska: zejście", "Płyta w ścieżce (ogród rycerzy)"}
P = os.path.join(ROOT, "data", "Map008.json")
m = json.load(open(P, encoding="utf-8")); Wd, Hd = m["width"], m["height"]; n = Wd * Hd; d = m["data"]
ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[m["tilesetId"]]
sheets = [Image.open(os.path.join(ROOT, "img", "tilesets", nm + ".png")).convert("RGBA") if nm else None for nm in ts["tilesetNames"][5:9]]


def tile_img(v):
    if not (0 < v < 1024) or not sheets[v // 256]: return None
    i = v % 256
    sx = (i % 8 + (8 if i >= 128 else 0)) * T; sy = ((i % 128) // 8) * T
    return sheets[v // 256].crop((sx, sy, sx + T, sy + T))


def region(x, y):
    """the door cell and the one above it: the B-E tiles of layers 0-3 as the map draws them"""
    im = Image.new("RGBA", (T, 2 * T), (0, 0, 0, 0))
    for j, yy in enumerate((y - 1, y)):
        if not (0 <= yy < Hd): continue
        for z in range(4):
            ti = tile_img(d[z * n + yy * Wd + x])
            if ti: im.alpha_composite(ti, (0, j * T))
    return im


# (2026-11-08, after the first try: the wood of thatch, log walls and roofs passed for the door) the door's box per kind - the B-E tile
# of the door cell -> (x0, x1, y0, y1) in the 48 x 96 frame (the cell above is rows 0-47); the leaf is the wood inside it
BOX = {765: (2, 46, 10, 86), 1002: (4, 45, 6, 77), 67: (4, 45, 6, 77), 604: (0, 47, 2, 84), 761: (2, 46, 10, 86), 114: (2, 46, 38, 95),
       762: (2, 46, 10, 86), 330: (2, 34, 26, 95), 202: (0, 30, 6, 95), 558: (2, 42, 14, 84), 505: (2, 46, 16, 95), 102: (2, 44, 20, 95),
       252: (8, 30, 6, 95), 429: (0, 47, 12, 84), 881: (0, 47, 4, 95), 441: (2, 46, 18, 95), 686: (0, 22, 10, 82), 638: (2, 44, 16, 92),
       189: (2, 44, 6, 84), 851: (4, 36, 0, 66), 372: (1, 46, 49, 93)}   # (372: the log stable's door, 2026-11-08)
CUR = {"box": None}


def leaf_mask(im):
    a = np.asarray(im).astype(np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3]
    hsv = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
    wood = (al > 0.5) & (h >= 6) & (h <= 40) & (s > 0.22) & (v > 0.10) & (v < 0.66)
    iron = (al > 0.5) & (v < 0.22)                                   # (straps, rings, the dark gaps between planks)
    mk = (wood | iron).astype(np.uint8)
    if CUR["box"]:
        x0, x1, y0, y1 = CUR["box"]; box = np.zeros_like(mk); box[y0:y1 + 1, x0:x1 + 1] = 1; mk &= box
    mk = cv2.morphologyEx(mk, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    if CUR["box"]:   # (in its box the wood is the leaf: each row from its first to its last leaf pixel, rows with little wood left out)
        out = np.zeros(mk.shape, bool)
        for yy in range(mk.shape[0]):
            xs = np.where(mk[yy])[0]
            if len(xs) >= 4: out[yy, xs.min():xs.max() + 1] = True
        return out if out.sum() >= 150 else None
    # the component that holds the bottom middle (the door stands on the cell's bottom)
    cnt, lab = cv2.connectedComponents(mk)
    seeds = [lab[yy, xx] for yy in range(2 * T - 14, 2 * T - 2) for xx in range(T // 2 - 8, T // 2 + 8) if lab[yy, xx]]
    if not seeds: return None
    k = max(set(seeds), key=seeds.count)
    leaf = (lab == k).astype(np.uint8)
    # holes filled (the door is one opening); the opening's sides straight per row (the frame of the door stays)
    filled = leaf.copy()
    ff = np.zeros((leaf.shape[0] + 2, leaf.shape[1] + 2), np.uint8)
    inv = (1 - leaf).astype(np.uint8)
    cv2.floodFill(inv, ff, (0, 0), 0)
    filled |= inv
    if filled.sum() < 250: return None
    return filled.astype(bool)


def frames(im):
    mk = leaf_mask(im)
    if mk is None: return None
    base = np.asarray(im).copy()
    ys, xs = np.where(mk)
    x0, x1 = xs.min(), xs.max()
    out = [base]
    for k in (0.62, 0.34, 0.12):
        f = base.copy()
        # the dark inside: warm black, a little lighter low (the floor), only where the leaf was
        for yy in range(mk.shape[0]):
            row = np.where(mk[yy])[0]
            if not len(row): continue
            t = yy / mk.shape[0]
            col = np.array([24 + 14 * t, 17 + 9 * t, 12 + 6 * t, 255])
            f[yy, row] = col
        # the leaf: squeezed to the hinge (left), a dark edge on its free side
        for yy in range(mk.shape[0]):
            row = np.where(mk[yy])[0]
            if not len(row): continue
            a, b = row.min(), row.max()
            w = b - a + 1; nw = max(2, int(round(w * k)))
            src = base[yy, a:b + 1]
            idx = np.clip((np.arange(nw) * (w / nw)).astype(int), 0, w - 1)
            seg = src[idx].astype(np.float32)
            seg[..., :3] *= 0.80 + 0.2 * k                              # (turned away from the light)
            f[yy, a:a + nw] = seg.astype(np.uint8)
            if a + nw < 48: f[yy, a + nw] = [10, 7, 5, 255]
        out.append(f)
    return out


def sheet(fr):
    s = np.zeros((4 * 2 * T, 3 * T, 4), np.uint8)
    for r, f in enumerate(fr):
        for c in range(3): s[r * 2 * T:(r + 1) * 2 * T, c * T:(c + 1) * T] = f
    return Image.fromarray(s, "RGBA")


ROUTE = [{"code": 36, "indent": None}, {"code": 17, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 18, "indent": None},
         {"code": 15, "indent": None, "parameters": [3]}, {"code": 19, "indent": None}, {"code": 15, "indent": None, "parameters": [3]}, {"code": 0}]

done, skipped, prev = [], [], []
for e in m["events"]:
    if not e or e["name"] in SKIP: continue
    if not any(c["code"] == 201 for pg in e["pages"] for c in pg["list"]): continue
    if e["pages"][0]["trigger"] not in (0, 1): continue
    im = region(e["x"], e["y"])
    door_tiles = [v for v in (d[z * n + e["y"] * Wd + e["x"]] for z in range(4)) if 0 < v < 1024]
    CUR["box"] = next((BOX[v] for v in reversed(door_tiles) if v in BOX), None)
    fr = frames(im)
    if fr is None: skipped.append("%d %s" % (e["id"], e["name"])); continue
    name = "!$Drzwi_K_%d" % e["id"]
    sheet(fr).save(os.path.join(ROOT, "img", "characters", name + ".png"), optimize=True)
    prev.append((e["id"], fr)); done.append((e, name))
# the preview: every door, its four frames
pv = Image.new("RGBA", (len(prev) * 4 * (T + 2) // 2 + 20, 2 * (2 * T + 20)), (40, 40, 44, 255))
dr = ImageDraw.Draw(pv)
half = (len(prev) + 1) // 2
for k, (i, fr) in enumerate(prev):
    ox, oy = (k % half) * (4 * (T + 2)), (k // half) * (2 * T + 20)
    dr.text((ox + 2, oy + 2), str(i), fill=(255, 230, 90, 255))
    for j, f in enumerate(fr): pv.alpha_composite(Image.fromarray(f, "RGBA"), (ox + j * (T + 2), oy + 16))
pv.save(os.path.join(HERE, "klatki.png"))
print("drzwi: obrazków %d, pominięte (nie znalazłem skrzydła) %d %s" % (len(done), len(skipped), skipped))
if not DO: print("(obrazki gotowe; zdarzenia bez zmian - --wykonaj)"); raise SystemExit(0)

W.need_editor_closed()
W.take_lock("drzwi Kruczogrodu")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "drzwi_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True); shutil.copy2(P, bak)
    m = json.load(open(P, encoding="utf-8"))   # (read again just before the change)
    ids = {e["id"]: nm for e, nm in done}
    for e in m["events"]:
        if not e or e["id"] not in ids: continue
        for pg in e["pages"]:
            if not any(c["code"] == 201 for c in pg["list"]) and pg["image"]["characterName"] == "": continue
            pg["image"].update({"characterName": ids[e["id"]], "characterIndex": 0, "direction": 2, "pattern": 1, "tileId": 0})
            pg["directionFix"] = True; pg["stepAnime"] = False; pg["walkAnime"] = False; pg["priorityType"] = 1
            if any(c["code"] == 201 for c in pg["list"]) and not any(c["code"] == 205 for c in pg["list"]):
                k = next(i for i, c in enumerate(pg["list"]) if c["code"] == 201)
                ind = pg["list"][k]["indent"]
                cmds = [{"code": 250, "indent": ind, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]},
                        {"code": 205, "indent": ind, "parameters": [0, {"list": ROUTE, "repeat": False, "skippable": False, "wait": True}]}]
                cmds += [{"code": 505, "indent": ind, "parameters": [c]} for c in ROUTE[:-1]]
                pg["list"][k:k] = cmds
    open(P, "wb").write(W.map_text(m).encode("utf-8"))
    print("zdarzenia drzwi: %d (kopia mapy: %s)" % (len(ids), bak))
finally:
    W.drop_lock()
