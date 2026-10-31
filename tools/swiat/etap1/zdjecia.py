# -*- coding: utf-8 -*-
"""docs/swiat_etap1/: zdjecia przed/po z renderera map (tools/mapy/mapylib.py): data/ (przed) i staging/data/ (po)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as M
from PIL import Image, ImageDraw
OUT = os.path.join(ROOT, "docs", "swiat_etap1"); os.makedirs(OUT, exist_ok=True)
STG = os.path.join(HERE, "staging", "data")
def pa(mid, region, name, scale=1.0, w=None):
    for tag, path in (("przed", None), ("po", os.path.join(STG, "Map%03d.json" % mid))):
        mp = M.Mapa(mid, path=path)
        im = M.render(mp, region=region).convert("RGB")
        s = scale if w is None else w / im.width
        if s != 1: im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
        im.save(os.path.join(OUT, "%s_%s.png" % (name, tag)))
        print(name, tag, im.size)
if __name__ == "__main__":
    pa(8, (14, 0, 40, 12), "m008_brama_polnocna")
    pa(8, (14, 120, 40, 137), "m008_brama_poludniowa")
    pa(111, (78, 8, 101, 30), "m111_fosa_i_most_wycinek")
    pa(111, (72, 0, 101, 111), "m111_wschod_calosc", w=900)
    pa(111, (80, 88, 101, 111), "m111_przepust_wycinek")
    pa(125, (0, 0, 40, 30), "m125_basen_rog_NW")
    pa(125, (0, 0, 131, 79), "m125_calosc", w=1400)
    pa(13, (28, 80, 56, 95), "m013_wejscie_S")
    pa(13, (0, 0, 119, 95), "m013_szlak_calosc", w=1100)
    pa(8, (88, 10, 103, 26), "m008_brama_wschodnia")
    pa(22, (0, 30, 24, 54), "m022_wejscie_W_brama")
    pa(125, (20, 60, 45, 79), "m125_wyjscie_S_do_21")
