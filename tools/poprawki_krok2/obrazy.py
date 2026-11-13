# -*- coding: utf-8 -*-
"""Obrazki przed/po dla kroku 2 -> docs/audyt_map/poprawki/krok2/.   python tools/poprawki_krok2/obrazy.py [id ...] [--tylko-podglad]
Staging: tools/poprawki_krok2/staging/data (Map008: tools/miasto5/staging/data)"""
import json, os, sys
import numpy as np, cv2
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, HERE)
import mapylib as L
OUT = os.path.join(ROOT, "docs", "audyt_map", "poprawki", "krok2"); os.makedirs(OUT, exist_ok=True)
IDS = [162, 24, 13, 111, 8, 4, 125, 3, 20]

def stag(mid): return os.path.join(ROOT, "tools", "miasto5", "staging", "data", "Map008.json") if mid == 8 else os.path.join(HERE, "staging", "data", "Map%03d.json" % mid)

def changed_cells(a, b, W, H):
    n = W * H
    d = np.array(a.data[:n]) != np.array(b.data[:n])
    return d.reshape(H, W)

def boxes(d, pad=5, maxw=34, maxh=26):
    """zbiory zmian -> prostokaty kadrow (zlaczone, ograniczone)"""
    H, W = d.shape
    k = np.ones((2 * 7 + 1, 2 * 7 + 1), np.uint8)
    g = cv2.dilate(d.astype(np.uint8), k)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(g, connectivity=8)
    out = []
    for i in range(1, nl):
        ys, xs = np.where((lab == i) & d)
        if len(xs) == 0: continue
        x0, x1, y0, y1 = xs.min() - pad, xs.max() + pad, ys.min() - pad, ys.max() + pad
        # duze: pociac na kawalki
        for ya in range(y0, y1 + 1, maxh):
            for xa in range(x0, x1 + 1, maxw):
                xb, yb = min(x1, xa + maxw - 1), min(y1, ya + maxh - 1)
                if d[max(0, ya):yb + 1, max(0, xa):xb + 1].any():
                    out.append((max(0, xa), max(0, ya), min(W - 1, xb), min(H - 1, yb)))
    return out

def caption(w, text, h=26):
    im = Image.new("RGB", (w, h), (24, 22, 30)); ImageDraw.Draw(im).text((8, 5), text, font=L.font(15, True), fill=(255, 220, 90)); return im

def sheet(mid, mpa, mpb, r, scale, text):
    A = L.render(mpa, region=r, scale=scale).convert("RGB"); B = L.render(mpb, region=r, scale=scale).convert("RGB")
    w = A.width * 2 + 6; im = Image.new("RGB", (w, A.height + 26), (255, 255, 255))
    im.paste(caption(w, text)); im.paste(A, (0, 26)); im.paste(B, (A.width + 6, 26)); return im

def main(ids):
    for mid in ids:
        a = L.Mapa(mid); b = L.Mapa(mid, path=stag(mid))
        d = changed_cells(a, b, a.W, a.H)
        bx = boxes(d)
        print(mid, a.nazwa, "zmian", int(d.sum()), "kadry", len(bx))
        sc = 1.0 if len(bx) <= 6 else 0.75
        # kilka arkuszy: po 4 kadry
        per = 3; idx = 0
        for i in range(0, len(bx), per):
            grp = bx[i:i + per]
            ims = [sheet(mid, a, b, r, sc, "Map%03d %s  x%d-%d y%d-%d   LEWO: teraz | PRAWO: po kroku 2" % (mid, a.nazwa, r[0], r[2], r[1], r[3])) for r in grp]
            Wd = max(im.width for im in ims); Ht = sum(im.height for im in ims) + 8 * len(ims)
            full = Image.new("RGB", (Wd, Ht), (255, 255, 255)); y = 0
            for im in ims: full.paste(im, (0, y)); y += im.height + 8
            idx += 1
            full.save(os.path.join(OUT, "Map%03d_%02d.png" % (mid, idx)))
        # przeglad calej mapy
        s = 0.2
        A = L.render(a, scale=s).convert("RGB"); B = L.render(b, scale=s).convert("RGB")
        # zaznacz zmiany na "po"
        dd = ImageDraw.Draw(B)
        for y, x in zip(*np.where(d)):
            dd.rectangle([x * 48 * s, y * 48 * s, (x + 1) * 48 * s, (y + 1) * 48 * s], outline=(255, 60, 60))
        w = A.width * 2 + 6; im = Image.new("RGB", (w, A.height + 26), (255, 255, 255))
        im.paste(caption(w, "Map%03d %s - cala mapa   LEWO: teraz | PRAWO: po kroku 2 (czerwone ramki = zmienione kratki, %d)" % (mid, a.nazwa, int(d.sum())))); im.paste(A, (0, 26)); im.paste(B, (A.width + 6, 26))
        im.save(os.path.join(OUT, "Map%03d_przeglad.png" % mid))

if __name__ == "__main__":
    main([int(x) for x in sys.argv[1:] if x.isdigit()] or IDS)

def zestawienie():
    ims = []
    for mid in IDS:
        p = os.path.join(OUT, "Map%03d_przeglad.png" % mid)
        if os.path.exists(p):
            im = Image.open(p).convert("RGB"); r = 960 / im.width; ims.append(im.resize((960, int(im.height * r)), Image.LANCZOS))
    cols = 2; rows = (len(ims) + cols - 1) // cols
    h = max(i.height for i in ims)
    out = Image.new("RGB", (cols * 966, 34 + rows * (h + 6)), (255, 255, 255))
    out.paste(caption(out.width, "Krok 2 - zaokraglanie plam gruntu: zestawienie 9 map (lewo: teraz, prawo: po; czerwone ramki = zmienione kratki)", 30))
    for i, im in enumerate(ims): out.paste(im, ((i % cols) * 966, 34 + (i // cols) * (h + 6)))
    out.save(os.path.join(OUT, "zestawienie.png"))

if __name__ == "__main__" and not [x for x in sys.argv[1:] if x.isdigit()]:
    zestawienie()
