# -*- coding: utf-8 -*-
"""Zgodność gruntu w kratce krawędzi: odsetek chodliwych par kratek styku z tą samą parą rodzajów (warstwy 0-1, bez kształtu).
  python tools/swiat/szwy2/metryka.py [--dane DIR] [--pary]"""
import os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ARGV = list(sys.argv); sys.argv = sys.argv[:1]
for p in (os.path.join(ROOT, "tools", "mapy"), os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "swiat", "szwy")): sys.path.insert(0, p)
import mapylib as L
import zbuduj_szwy as Z
sys.argv = ARGV
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
dane = ARGV[ARGV.index("--dane") + 1] if "--dane" in ARGV else None
maps = {k: v for k, v in Z.mapy_swiata().items() if os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % k))}
def pl(mid):
    if dane and os.path.exists(os.path.join(dane, "Map%03d.json" % mid)): return os.path.join(dane, "Map%03d.json" % mid)
    return None
M = {k: L.Mapa(k, path=pl(k)) for k in maps}
def kind(t): return 0 if t == 0 else ((t - 2048) // 48 if t >= 2816 else ("t", t))
def para(m, x, y): return (kind(m.t(0, x, y)), kind(m.t(1, x, y)))
tot = same = 0; per = {}
for (a, b, kier, lo, hi) in Z.pary(maps):
    ax, ay, aw, ah = maps[a]; bx, by, bw, bh = maps[b]
    t = s = 0; roz = collections.Counter()
    for k in range(lo, hi):
        if kier == "EW": ca = (aw - 1, k - ay); cb = (0, k - by)
        else: ca = (k - ax, ah - 1); cb = (k - bx, 0)
        if not (M[a].stoi(*ca) and M[b].stoi(*cb)): continue
        t += 1; pa, pb = para(M[a], *ca), para(M[b], *cb)
        if pa == pb: s += 1
        else: roz[(pa, pb)] += 1
    per[(a, b)] = (t, s, roz); tot += t; same += s
print("chodliwych par kratek krawędzi: %d, ten sam grunt: %d (%.1f%%)" % (tot, same, 100.0 * same / max(1, tot)))
if "--pary" in ARGV:
    for p, (t, s, roz) in sorted(per.items(), key=lambda kv: kv[1][1] - kv[1][0])[:25]:
        if t > s: print(p, t, s, roz.most_common(3))
