# -*- coding: utf-8 -*-
"""podglad statyczny: python pokaz.py MAPA x0,y0,x1,y1 plik [scale] [--staging]"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "mapy"))
import mapylib as L
mid = int(sys.argv[1]); r = tuple(int(v) for v in sys.argv[2].split(","))
sc = float(sys.argv[4]) if len(sys.argv) > 4 and not sys.argv[4].startswith("--") else 1.0
path = os.path.join(HERE, "staging", "data", "Map%03d.json" % mid) if "--staging" in sys.argv else None
mp = L.Mapa(mid, path=path)
im = L.render(mp, region=r, grid=False, scale=sc)
im.convert("RGB").save(sys.argv[3])
