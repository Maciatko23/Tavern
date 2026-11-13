# -*- coding: utf-8 -*-
"""przed -> po: osiągalność pieszo (flood fill od wejść), miejsca tylko z orła zamknięte, plateau ze schodami osiągalne tylko schodami.
   python sprawdz.py [staging_dir]"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "mapy"))
import mapylib as L
STG = os.path.join(HERE, "staging", "data")
SHELVES = {13: [(101, 64), (36, 99)], 125: [(106, 31), (98, 46)]}          # eagle-only shelves: a cell in the middle of each top
STAIRS = {13: [((97, 96), (100, 99)), ((16, 98), (20, 101))]}                 # (a cell on the plateau top), (the stairs' lip cell)
for mid in (13, 125):
    a = L.Mapa(mid); b = L.Mapa(mid, path=os.path.join(STG, "Map%03d.json" % mid))
    ra = a.flood(a.starty()); rb = b.flood(b.starty())
    lost = sorted(ra - rb); new = sorted(rb - ra)
    print("Map%03d: osiągalnych przed %d, po %d; utracone %d %s; nowe %d %s" % (mid, len(ra), len(rb), len(lost), lost[:12], len(new), new[:12]))
    for c in SHELVES.get(mid, []):
        print("   półka orła (%d,%d): osiągalna pieszo przed: %s, po: %s" % (c[0], c[1], c in ra, c in rb))
    for (top, lip) in STAIRS.get(mid, []):
        print("   plateau (%d,%d): osiągalne przed %s, po %s" % (top[0], top[1], top in ra, top in rb))

# plateaus with stairs: with the stairs' cells walled up (a face tile) the top must not be reachable on foot
import json, copy
for mid, items in ((13, [((97, 96), [(100, 99), (101, 99), (100, 100), (101, 100), (100, 101), (101, 101)]), ((16, 98), [(20, 101), (21, 101), (20, 102), (21, 102), (20, 103), (21, 103)])]),):
    raw = json.load(open(os.path.join(STG, "Map%03d.json" % mid), encoding="utf-8"))
    for top, cells in items:
        t = copy.deepcopy(raw); n = t["width"] * t["height"]
        for (x, y) in cells: t["data"][y * t["width"] + x] = 1536 + 113
        mt = L.Mapa(mid, raw=t); r = mt.flood(mt.starty())
        print("   plateau (%d,%d) z zamurowanymi schodami: osiągalne pieszo: %s (ma być False)" % (top[0], top[1], top in r))
