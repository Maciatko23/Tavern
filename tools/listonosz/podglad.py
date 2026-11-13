# -*- coding: utf-8 -*-
"""Statyczny podglad Map214 ze stagingu tools/listonosz/staging (z arkuszami z tools/listonosz/overlay) + kontrole wnetrz
   python tools/listonosz/podglad.py [--plain] [--check]"""
import os, sys, shutil
MINE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(MINE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "interiors"))
import irender as IR
import check_interiors as CI
import preview as PV
STAG = os.path.join(MINE, "staging")
CI.STAGING = STAG; PV.STAGING = STAG
chars = os.path.join(IR.HERE, "chars"); os.makedirs(chars, exist_ok=True)
for f in os.listdir(os.path.join(MINE, "art")):
    if f.startswith("!$Kruczarnia"): shutil.copy2(os.path.join(MINE, "overlay", "img", "characters", f), os.path.join(chars, f))
out = os.path.join(STAG, "podglad_214.png")
if "--check" in sys.argv:
    r = CI.check(214); print("kontrola:", r)
PV.preview(214, out, plain="--plain" in sys.argv)
print(out)
shutil.rmtree(chars, ignore_errors=True)   # (the copies of the sheets for the renderer only)
