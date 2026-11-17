# -*- coding: utf-8 -*-
"""Kopie murów / klifów sąsiadek z łączeń 2026-10-31 (2 kratki przy granicy = 2 kratki po drugiej stronie, przesunięte o 2 - tak jak
tools/mapy/kopie_murow.py), liczone na STARYCH mapach (data/) i starym układzie świata (docs/mapy/swiat_uklad.json). Na planszy 3x3
kopia zostaje tylko tam, gdzie ta sama sąsiadka styka się dalej tak samo (Podgrodzie | Kruczogród); reszta (Góry pod murem miasta,
Posiadłość przy wschodnim murze miasta, ...) wraca do gruntu.
  copies() -> [(mapa, sąsiadka, {(x, y): (sx, sy)})] w starych współrzędnych mapy"""
import json, os
from plansza import ROOT, W

uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
_maps = {}
def mapa(m):
    if m not in _maps: _maps[m] = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8"))
    return _maps[m]
def cell(m, x, y):
    d = mapa(m); w, h = d["width"], d["height"]
    if not (0 <= x < w and 0 <= y < h): return None
    v = [W.at(d, z, x, y) for z in range(4)]
    k = lambda a: ("A", (a - 2048) // 48) if a >= 2048 else ("T", a)
    return (k(v[0]), k(v[1]), v[2], v[3])
def struct(c):
    if c is None: return False
    if any(kk[0] == "A" and kk[1] >= 48 for kk in c[:2]): return True
    return bool(c[2] or c[3])

def copies():
    out = {}
    ids = sorted(uk)
    for a in ids:
        for b in ids:
            if a == b: continue
            ra, rb = uk[a], uk[b]
            if ra["y0"] + ra["wys"] == rb["y0"]:
                lo, hi = max(ra["x0"], rb["x0"]), min(ra["x0"] + ra["szer"], rb["x0"] + rb["szer"])
                ca = lambda p, d: (p - ra["x0"], ra["wys"] - 1 - d); cb = lambda p, d: (p - rb["x0"], d)
            elif ra["x0"] + ra["szer"] == rb["x0"]:
                lo, hi = max(ra["y0"], rb["y0"]), min(ra["y0"] + ra["wys"], rb["y0"] + rb["wys"])
                ca = lambda p, d: (ra["szer"] - 1 - d, p - ra["y0"]); cb = lambda p, d: (d, p - rb["y0"])
            else:
                continue
            for p in range(lo, hi):
                A = [cell(a, *ca(p, d)) for d in range(3)]; B = [cell(b, *cb(p, d)) for d in range(3)]
                if None in A[:2] or None in B[:2]: continue
                if not (A[1] == B[0] and A[0] == B[1] and (struct(B[0]) or struct(B[1]))): continue
                if 8 in (a, b): into = b if a == 8 else a
                elif struct(B[2]) and not struct(A[2]): into = a
                elif struct(A[2]) and not struct(B[2]): into = b
                else: continue
                partner = b if into == a else a
                c = ca if into == a else cb
                for d in (0, 1): out.setdefault((into, partner), {})[c(p, d)] = c(p, 2)
    return [(m, p, cells) for (m, p), cells in out.items()]
