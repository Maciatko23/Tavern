# -*- coding: utf-8 -*-
"""Cień wraku od samych desek (gracz 2026-11-07: „a to nie powinno iść idealnie od desek, żeby było naturalnie?”). Obrazek każdej części
wraku miał pod kadłubem namalowany piasek; warstwa cieni leży pod obrazkami (z 1.8), więc ten piasek zakrywał początek cienia i cień
zaczynał się dopiero pod obrazkiem. Teraz każda część to dwa obrazki tego samego rozmiaru:
  - !$1_Wrak_<X>_Duzy.png        sam kadłub (deski, maszty, żagle, liny) - zdarzenie jak było, „jak postacie”, nad cieniem,
  - !$1_Wrak_<X>_Duzy_Grunt.png  piasek, kamyki, deski leżące płasko - nowe zdarzenie „pod postaciami” (z 1) w tym samym miejscu, pod
                                 cieniem: cień kadłuba kładzie się na nim prosto od desek,
  - !$1_Wrak_<X>_Duzy_Cien.png   maska cienia = ten sam kadłub (Cienie.js, <Cienie:maska>); w każdej kolumnie, gdzie kadłub stoi
                                 w piasku, jego najniższa deska na czerwono - stąd zaczyna się cień (Cienie.js kładzie go paskami).
Oba obrazki razem dają dokładnie dawny obrazek (każdy piksel w jednym z nich).
Kadłub: od dołu w każdej kolumnie pierwsze miejsce, gdzie ciemne drewno idzie w górę co najmniej 16 px (cienkie deski leżące płasko
w piasku i kamyki są niższe - zostają gruntem), wygładzone; jasny ciepły piasek tuż nad tą linią - grunt; zamknięte dziury (piaskowe
piksele otoczone kadłubem) zostają kadłubem.
Źródło to zawsze PEŁNE obrazki (tools/wrak_duzy/pelne - trzy.py je tam kładzie), nie te z img/characters (tam już sam kadłub).
  python tools/wrak_duzy/grunt.py --zrodlo tools/wrak_duzy/pelne --do img/characters --mapa data/Map165.json data/Map165.json
  (zapis do data/ tylko przy zamkniętym edytorze; kopia mapy: kopie_zapasowe/<czas>_grunt)"""
import copy, datetime, glob, json, os, sys
import numpy as np
import cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
arg = lambda k, i=1: sys.argv[sys.argv.index(k) + i] if k in sys.argv else None
SRC, DST = arg("--zrodlo"), arg("--do")


def hull_of(im):
    H, Wd = im.shape[:2]
    r, g, b, a = im[:, :, 0], im[:, :, 1], im[:, :, 2], im[:, :, 3]
    solid = a > 100
    lum = (r + g + b) / 3.0
    # the hull's bottom in each column: from below, the first place where wood (dark: lum < 80) goes up at least RUN px (gaps of up to
    # 2 px of a lighter plank's edge let through) - the thin planks lying flat in the sand and the pebbles are shorter, they stay ground
    wood = solid & (lum < 80)
    RUN = 16
    bottom = np.full(Wd, -1)
    for x in range(Wd):
        col = wood[:, x]; y = H - 1
        while y >= RUN:
            if not col[y]: y -= 1; continue
            k, gap, top = y, 0, y
            while k >= 0 and gap <= 2:
                if col[k]: gap = 0; top = k
                else: gap += 1
                k -= 1
            if y - top + 1 >= RUN: bottom[x] = y; break
            y = top - 1
    have = bottom >= 0
    smooth = bottom.copy()
    for x in range(Wd):
        w = bottom[max(0, x - 20):x + 21]; w = w[w >= 0]
        if len(w): smooth[x] = int(np.median(w))
    # (a column with no such run - a hanging rag, a rope, a thin rib at the picture's edge: the nearest columns' line)
    xs = np.where(have)[0]
    near = np.interp(np.arange(Wd), xs, smooth[xs]).astype(int) if len(xs) else np.full(Wd, -1)
    cut = np.where(have, np.minimum(bottom, smooth + 4), near)
    # ground: under the line (or the light warm sand just over it), and only what touches the painted sand's big patch - a rag's
    # lighter tip hanging in the air under its column's line stays the ship
    yy = np.arange(H)[:, None]
    cand = solid & ((yy > cut[None, :]) | ((lum > 95) & (r - b > 25) & (yy > cut[None, :] - 12)))
    sand = cand & (lum > 85) & (r - b > 20)
    ns, sl, ss, _ = cv2.connectedComponentsWithStats(sand.astype(np.uint8), 8)
    big = np.isin(sl, [i for i in range(1, ns) if ss[i, cv2.CC_STAT_AREA] >= 400])
    nc, cl = cv2.connectedComponents(cand.astype(np.uint8), connectivity=8)
    ground = np.isin(cl, [i for i in np.unique(cl[big]) if i])
    body = solid & ~ground
    # tiny bits cut off by the line, low by the ground (a pebble, a splinter): ground; higher up (a rag, a rope hanging): the ship
    nlab, lab, stats, cen = cv2.connectedComponentsWithStats(body.astype(np.uint8), 8)
    low = np.array([stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] - 1 > cut[min(Wd - 1, int(cen[i][0]))] - 20 for i in range(nlab)])
    keep = (stats[:, cv2.CC_STAT_AREA] >= 60) | ~low; keep[0] = False
    body = keep[lab]
    # the holes: what is not the hull and does not reach the picture's edge (4-connected) is inside it
    nlab, lab = cv2.connectedComponents((~body).astype(np.uint8), connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    inside = ~body & ~np.isin(lab, list(edge))
    body |= inside & solid
    return body & solid, solid, cut


def pictures():
    os.makedirs(DST, exist_ok=True)
    names = []
    for p in sorted(glob.glob(os.path.join(SRC, "!$1_Wrak_*_Duzy.png"))):
        n = os.path.basename(p)[:-4]
        im = np.array(Image.open(p).convert("RGBA"))
        hull, solid, cut = hull_of(im.astype(int))
        a = im.copy(); a[~hull] = 0
        g = im.copy(); g[hull | ~solid] = 0
        m = np.zeros_like(im); m[hull] = (0, 0, 0, 255)
        # the feet for Cienie.js: in each column where the hull stands in the painted sand (its lowest plank by the line, sand under
        # it) that plank's pixel red - the shadow starts there; the other columns (a rag, a rope, the bow's stem over the ground) take
        # the nearest marked ones'
        # (smoothed: the median of the marked columns 6 each way - a tuft of grass, a jagged plank do not make steps in the shadow)
        raw = {}
        for x in range(im.shape[1]):
            ys = np.where(hull[:, x])[0]
            if not len(ys): continue
            y = ys.max()
            if y >= cut[x] - 6 and (solid[y + 1:, x] & ~hull[y + 1:, x]).any(): raw[x] = y
        for x in raw:
            w = [raw[k] for k in range(x - 6, x + 7) if k in raw]
            m[int(np.median(w)), x] = (255, 0, 0, 255)
        marks = len(raw)
        Image.fromarray(a, "RGBA").save(os.path.join(DST, n + ".png"))
        Image.fromarray(g, "RGBA").save(os.path.join(DST, n + "_Grunt.png"))
        Image.fromarray(m, "RGBA").save(os.path.join(DST, n + "_Cien.png"))
        names.append(n)
        print("  %s %dx%d: kadłub %d px, grunt %d px, stopy w %d kolumnach" % (n, im.shape[1], im.shape[0], hull.sum(), (solid & ~hull).sum(), marks))
    return names


def map165(src, dst, names):
    raw = open(src, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    ev = m["events"]
    blank = None
    for e in ev:
        if e and e["name"].startswith("Blokada"): blank = e["pages"][0]; break
    for e in list(ev):
        if not e: continue
        n = e["pages"][0]["image"]["characterName"]
        if n not in names: continue
        g = next((q for q in ev if q and q["pages"][0]["image"]["characterName"] == n + "_Grunt"), None)
        if g is None:
            g = {"id": len(ev), "name": "", "note": "", "pages": [copy.deepcopy(blank)], "x": 0, "y": 0}; ev.append(g)
        g["name"] = "Wrak: piasek pod (" + e["name"].split(":", 1)[-1].strip() + ")"
        g["note"] = "<Cienie:off>"
        g["x"], g["y"] = e["x"], e["y"]
        pg = g["pages"][0]
        pg["image"] = {"tileId": 0, "characterName": n + "_Grunt", "direction": 2, "pattern": 0, "characterIndex": 0}
        pg["priorityType"] = 0; pg["through"] = True; pg["trigger"] = 0; pg["directionFix"] = True
        pg["walkAnime"] = False; pg["stepAnime"] = False
        pg["list"] = [{"code": 0, "indent": 0, "parameters": []}]
        print("  grunt %d pod zdarzeniem %d (%s) w (%d,%d)" % (g["id"], e["id"], n, e["x"], e["y"]))
    if os.path.abspath(dst).startswith(os.path.join(ROOT, "data")):
        W.need_editor_closed()
        kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_grunt")
        os.makedirs(kop, exist_ok=True)
        open(os.path.join(kop, os.path.basename(dst)), "wb").write(open(dst, "rb").read())
        print("  kopia mapy:", kop)
    open(dst, "wb").write(W.map_text(m).encode("utf-8"))


names = pictures()
if "--mapa" in sys.argv: map165(arg("--mapa"), arg("--mapa", 2), names)
