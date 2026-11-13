# -*- coding: utf-8 -*-
"""Zdjęcie staged Map008: python tools/miasto4/shot4.py x0,y0,x1,y1 skala plik"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kontrola4 as K, mapylib
mp, raw = K.mapa()
reg = None if sys.argv[1] == "-" else tuple(map(int, sys.argv[1].split(",")))
im = mapylib.render(mp, region=reg, scale=float(sys.argv[2]))
im.convert("RGB").save(sys.argv[3]); print(sys.argv[3], im.size)
