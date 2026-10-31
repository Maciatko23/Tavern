# -*- coding: utf-8 -*-
"""Pomocnik: odczyt map i kafli (dekodowanie autokafli, flagi przejścia) dla narzędzi próby."""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
FLAGS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[8]["flags"]
def load(path): return json.load(open(path, encoding="utf-8"))
def tile(m, l, x, y): return m["data"][(l * m["height"] + y) * m["width"] + x]
def setT(m, l, x, y, v): m["data"][(l * m["height"] + y) * m["width"] + x] = v
def isAuto(t): return t >= 2048
def kind(t):
    if t < 2048: return None
    if t < 2816: return (t - 2048) // 48  # A1
    if t < 4352: return 16 + (t - 2816) // 48  # A2
    if t < 5888: return 48 + (t - 4352) // 48  # A3
    return 80 + (t - 5888) // 48  # A4/A5.. approx
def shape(t): return (t - 2048) % 48 if t >= 2048 else None
def base(t): return t - shape(t) if t >= 2048 else t
def passable4(m, x, y):
    # pierwsza (od góry) kratka z flagą nie-gwiazdkową decyduje; jak MZ: warstwy 3..0
    for l in (3, 2, 1, 0):
        t = tile(m, l, x, y)
        f = FLAGS[t] if t < len(FLAGS) else 0
        if f & 0x10: continue
        return (f & 0x0f) != 0x0f
    return False
