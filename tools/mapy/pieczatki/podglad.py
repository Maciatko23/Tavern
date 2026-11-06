# -*- coding: utf-8 -*-
"""Wycinek mapy z siatką i numerami kratek (do szukania pieczątek i opisów wzorców).
  python tools/mapy/pieczatki/podglad.py MAPA x0 y0 [szer wys] [wyjscie.png] [--bez-siatki] [--dane DIR]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, ".."))
import mapylib as L
from PIL import ImageDraw


def wycinek(mp, x0, y0, w=27, h=15, siatka=True, skala=1.0):
    x1, y1 = min(mp.W - 1, x0 + w - 1), min(mp.H - 1, y0 + h - 1)
    im = L.render(mp, region=(x0, y0, x1, y1), grid=siatka).convert("RGB")
    if siatka:
        d = ImageDraw.Draw(im)
        for x in range(x0, x1 + 1):
            if x % 5 == 0: d.text(((x - x0) * L.T + 2, 1), str(x), fill=(255, 255, 0))
        for y in range(y0, y1 + 1):
            if y % 5 == 0: d.text((2, (y - y0) * L.T + 1), str(y), fill=(0, 255, 255))
    if skala != 1.0: im = im.resize((int(im.width * skala), int(im.height * skala)))
    return im


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    mid, x0, y0 = int(a[0]), int(a[1]), int(a[2])
    w = int(a[3]) if len(a) > 3 and a[3].isdigit() else 27
    h = int(a[4]) if len(a) > 4 and a[4].isdigit() else 15
    out = [x for x in a if x.endswith(".png")]
    mp = L.Mapa(mid)
    wycinek(mp, x0, y0, w, h, "--bez-siatki" not in sys.argv).save(out[0] if out else "podglad.png")
