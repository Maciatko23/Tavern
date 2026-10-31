# -*- coding: utf-8 -*-
"""Osiagalnosc map od Domu dziadka (20) przed (data/ + zywy Swiat_Data.js) i po (staging etapu 2). python tools/swiat/etap2/osiagalnosc2.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "swiat", "etap1"))
import osiagalnosc as A
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
g0, i0 = A.graf(os.path.join(ROOT, "data"), os.path.join(ROOT, "js", "plugins", "Swiat_Data.js")); r0 = A.flood(g0, 20)
g1, i1 = A.graf(os.path.join(HERE, "staging", "data"), os.path.join(HERE, "staging", "js", "plugins", "Swiat_Data.js")); r1 = A.flood(g1, 20)
print("PRZED: osiagalne %d z %d" % (len(r0), len(i0)))
print("PO:    osiagalne %d z %d" % (len(r1), len(i1)))
lost = sorted(m for m in r0 if m not in r1)
print("STRACONE wzgledem dzis: %s" % (lost or "brak"))
print("nowo osiagalne: %s" % sorted(m for m in r1 if m not in r0))
sys.exit(1 if lost else 0)
