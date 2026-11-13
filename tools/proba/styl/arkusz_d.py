# -*- coding: utf-8 -*-
"""Winlu D (Fantasy_Outside_D_green) w wyglądzie FB - te same rampy co reszta (pops z tych samych źródeł co zbuduj_a.py: arkusze zestawu 11
w wyglądzie B i oryginalne obrazki drzwi/ozdób), wynik img/tilesets/Styl_FB/D.png (2026-11-08: zestaw „Winlu (nowy styl)”)."""
import os, sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import restyl as R
ROOT = R.ROOT
ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[11]["tilesetNames"]
SH = {"A3": 2, "A4": 3, "B": 5, "C": 6, "E": 8}
CH = ["!Fantasy_door1", "!Fantasy_door2", "!Fantasy_door3", "!Roof_Windows", "!Decoration", "!Signs", "!Town_Props", "!lamp", "!Tavern_Yard", "!House_Town", "!Flags_banner"]
src = {}
for k, i in SH.items(): src["T_" + k] = np.array(Image.open(os.path.join(ROOT, "img", "tilesets", ts[i] + ".png")).convert("RGBA"))
for n in CH: src["C_" + n] = np.array(Image.open(os.path.join(ROOT, "img", "characters", n + ".png")).convert("RGBA"))
e = src["T_E"]; yy, xx = np.mgrid[0:e.shape[0], 0:e.shape[1]]
a3 = src["T_A3"]; y3, x3 = np.mgrid[0:a3.shape[0], 0:a3.shape[1]]
slate = {"T_E": (yy >= 430) | ((xx >= 400) & (yy >= 380)), "T_A3": y3 < 288}
thatch = {"T_A3": (y3 >= 96) & (y3 < 288) & (x3 >= 288) & (x3 < 384)}
pops = R.build_maps(src, slate, thatch)
d = np.array(Image.open(os.path.join(ROOT, "img", "tilesets", ts[7] + ".png")).convert("RGBA"))
res = R.restyle(d, pops, slate=None, outline=True, thatch=None, tint=False)
Image.fromarray(res).save(os.path.join(ROOT, "img", "tilesets", "Styl_FB", "D.png"))
print("Styl_FB/D.png", res.shape)
