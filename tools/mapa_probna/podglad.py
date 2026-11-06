# -*- coding: utf-8 -*-
"""Podgląd map próbnych ze stagingu: całość (skala) i/lub wycinki 27x15. python tools/mapa_probna/podglad.py 990 [skala] [wyjscie.png]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
import mapylib as L, podglad
mid = int(sys.argv[1]); sk = float(sys.argv[2]) if len(sys.argv) > 2 else 0.4
raw = L.load_json(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid))
mp = L.Mapa(mid, raw=raw)
podglad.wycinek(mp, 0, 0, mp.W, mp.H, False, sk).save(sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, "staging", "Map%03d.png" % mid))
