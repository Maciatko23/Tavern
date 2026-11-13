# -*- coding: utf-8 -*-
"""Approach A build: img/tilesets/Styl_FB/*.png + img/characters/*_FB.png + staged Tilesets.json (entry 17) + Map027.json -> tools/proba/styl/staging"""
import os, sys, json, re
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import restyl as R
ROOT = R.ROOT; STG = R.OUT
ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[17]["tilesetNames"]
SH = {"A3": 2, "A4": 3, "B": 5, "C": 6, "E": 8}
CH = ["!Fantasy_door1", "!Fantasy_door2", "!Fantasy_door3", "!Roof_Windows", "!Decoration", "!Signs", "!Town_Props", "!lamp", "!Tavern_Yard", "!House_Town", "!Flags_banner"]
src = {}
for k, i in SH.items(): src["T_" + k] = np.array(Image.open(os.path.join(ROOT, "img", "tilesets", ts[i] + ".png")).convert("RGBA"))
for n in CH: src["C_" + n] = np.array(Image.open(os.path.join(ROOT, "img", "characters", n + ".png")).convert("RGBA"))
e = src["T_E"]; yy, xx = np.mgrid[0:e.shape[0], 0:e.shape[1]]
a3 = src["T_A3"]; y3, x3 = np.mgrid[0:a3.shape[0], 0:a3.shape[1]]
slate = {"T_E": (yy >= 430) | ((xx >= 400) & (yy >= 380)), "T_A3": y3 < 288}
th3 = (y3 >= 96) & (y3 < 288) & (x3 >= 288) & (x3 < 384)
thatch = {"T_A3": th3}
pops = R.build_maps(src, slate, thatch)
os.makedirs(os.path.join(STG, "img", "tilesets", "Styl_FB"), exist_ok=True); os.makedirs(os.path.join(STG, "img", "characters"), exist_ok=True)
for k in src:
    opaque = k in ("T_A3", "T_A4")
    res = R.restyle(src[k], pops, slate=slate.get(k), outline=not opaque, thatch=thatch.get(k), tint=k in ("T_A3", "T_A4"))
    p = os.path.join(STG, "img", "tilesets", "Styl_FB", k[2:] + ".png") if k.startswith("T_") else os.path.join(STG, "img", "characters", k[2:] + "_FB.png")
    Image.fromarray(res).save(p)
# staged databases
tb = open(os.path.join(ROOT, "data", "Tilesets.json"), "rb").read()
i = tb.rfind(b'{"id":17,'); head, tail = tb[:i], tb[i:]
for k, ix in SH.items():
    tail = tail.replace(('"' + ts[ix] + '"').encode("utf-8"), ('"Styl_FB/' + k + '"').encode("utf-8"), 1)
os.makedirs(os.path.join(STG, "data"), exist_ok=True)
open(os.path.join(STG, "data", "Tilesets.json"), "wb").write(head + tail)
mb = open(os.path.join(ROOT, "data", "Map027.json"), "rb").read().decode("utf-8")
for n in CH: mb = mb.replace('"characterName":"%s"' % n, '"characterName":"%s_FB"' % n)
open(os.path.join(STG, "data", "Map027.json"), "wb").write(mb.encode("utf-8"))
print("done", sorted(os.listdir(os.path.join(STG, "img", "characters"))))
import hashlib
json.dump({"Tilesets.json": hashlib.sha1(tb).hexdigest(), "Map027.json": hashlib.sha1(open(os.path.join(ROOT, "data", "Map027.json"), "rb").read()).hexdigest()}, open(os.path.join(STG, "baza_a.json"), "w"), indent=1)
