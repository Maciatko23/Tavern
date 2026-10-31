# -*- coding: utf-8 -*-
"""Wykrywa proste jednorzędowe pasy gruntu wzdłuż szwu: ciąg > 3 kratek, w których grunt krawędzi różni się od rzędu 1, a rzędy 1 i 2 są takie same
(pas wysokości 1 kratki). python tools/swiat/szwy2/pasy.py [--dane DIR]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ARGV = list(sys.argv); sys.argv = sys.argv[:1]
for p in (os.path.join(ROOT, "tools", "mapy"), os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "swiat", "szwy")): sys.path.insert(0, p)
import mapylib as L
import zbuduj_szwy as Z
sys.argv = ARGV
sys.path.insert(0, HERE)
import zbuduj as B       # klucz_kafla: porównanie rodzajów po zastąpieniu (46 zestawu 9 = 31 zestawu 11)
dane = ARGV[ARGV.index("--dane") + 1] if "--dane" in ARGV else None
maps = {k: v for k, v in Z.mapy_swiata().items() if os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % k))}
def pl(mid):
    p = os.path.join(dane, "Map%03d.json" % mid) if dane else None
    return p if p and os.path.exists(p) else None
M = {k: L.Mapa(k, path=pl(k)) for k in maps}
def par(m, x, y, same):
    B.SAME = same
    return tuple(B.klucz_kafla(m.tsid, m.t(z, x, y))[0] for z in (0, 1))
bad = []
for (a, b, kier, lo, hi) in Z.pary(maps):
    if 13 in (a, b) or 120 in (a, b): continue
    ax, ay, aw, ah = maps[a]; bx, by, bw, bh = maps[b]
    for s, mid in (("a", a), ("b", b)):
        m = M[mid]; run = []; runs = []
        for k in range(lo, hi):
            if kier == "EW": c = [((aw - 1 - d, k - ay) if s == "a" else (d, k - by)) for d in range(3)]
            else: c = [((k - ax, ah - 1 - d) if s == "a" else (k - bx, d)) for d in range(3)]
            ok = all(m.inside(*q) and m.stoi(*q) for q in c)
            p0, p1, p2 = (par(m, *q, M[a].tsid == M[b].tsid) for q in c) if ok else (None, None, None)
            if ok and p0 != p1 and p1 == p2:
                run.append(k)
                if '--v' in ARGV: print('   ', a, b, mid, k, p0, p1)
            else:
                if len(run) > 3: runs.append(len(run))
                run = []
        if len(run) > 3: runs.append(len(run))
        if runs: bad.append((a, b, mid, runs))
print("pasy jednorzędowe (ciąg > 3):", len(bad))
for r in bad: print("  styk %d|%d strona mapy %d: ciągi %s" % r)
