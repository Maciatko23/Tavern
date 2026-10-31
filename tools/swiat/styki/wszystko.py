# -*- coding: utf-8 -*-
"""Cały łańcuch budowy stagingu styków: zbuduj_styki -> links z kafli -> Swiat_Data -> propozycja skał 13 -> kontrola kontraktu.
   python tools/swiat/styki/wszystko.py"""
import os, sys, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PY = sys.executable
def run(*a):
    print(">>", " ".join(a)); r = subprocess.run([PY, "-I" if False else "-X", "utf8"] + list(a), cwd=ROOT)
    if r.returncode and "swiat_styki" not in a[0]: sys.exit(r.returncode)
    return r.returncode
run("tools/swiat/styki/zbuduj_styki.py")
run("tools/mapy/swiat_styki.py", "--linki")
run("tools/mapy/swiat_do_gry.py", "--styki", "--wlacz", "--out", "tools/swiat/styki/staging/js/plugins/Swiat_Data.js")
run("tools/swiat/styki/zbuduj_skaly13.py")
rc = run("tools/mapy/swiat_styki.py", "--obraz", "docs/swiat_styki/po_kontrakt.png")
sys.exit(rc)
