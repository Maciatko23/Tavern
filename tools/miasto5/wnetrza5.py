# -*- coding: utf-8 -*-
"""Wyjścia wnętrz na nowy Kruczogród (tools/miasto5): każde wnętrze, do którego prowadzą drzwi miasta, wypuszcza bohatera na kratkę
tuż pod tymi drzwiami (kilka drzwi do jednego wnętrza: najbliższe miejscu przybycia). Drzwi tawerny (zdarzenie 22) prowadzą tam,
gdzie dziś (nowa tawerna, tools/tawerna2). Czyta tools/miasto5/staging/data/Map008.json i data/MapNNN.json, pisze kopie do staging.
  python tools/miasto5/wnetrza5.py"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
STG = os.path.join(HERE, "staging", "data")
P8 = os.path.join(STG, "Map008.json")
town = json.load(open(P8, encoding="utf-8"))
cur = json.load(open(os.path.join(ROOT, "data", "Map008.json"), encoding="utf-8"))
def transfers(e):
    for p in e["pages"]:
        for c in p["list"]:
            if c["code"] == 201 and c["parameters"][0] == 0: yield c
# the tavern door: the same target as in today's town (the installed tavern2)
tav_now = [c["parameters"][1:5] for e in cur["events"] if e and (e["x"], e["y"]) == (51, 16) for c in transfers(e) if c["parameters"][1] == 1]
assert tav_now, "no tavern door at 51,16 in today's Map008"
for c in transfers(town["events"][22]):
    if c["parameters"][1] == 1: c["parameters"][1:5] = list(tav_now[0])
print("tawerna: drzwi 22 ->", tav_now[0])
open(P8, "wb").write(WS.map_text(town).encode("utf-8"))
doors = {}
for e in town["events"]:
    if not e: continue
    for c in transfers(e):
        m = c["parameters"][1]
        if m not in (8, 1): doors.setdefault(m, []).append((e["x"], e["y"], c["parameters"][2], c["parameters"][3], e["name"]))
changed = 0
for mid, ds in sorted(doors.items()):
    p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    if not os.path.exists(p): print("BRAK mapy", mid); continue
    m = json.load(open(p, encoding="utf-8")); n = 0
    for e in m["events"]:
        if not e: continue
        for c in transfers(e):
            if c["parameters"][1] != 8: continue
            dx, dy, ix, iy, nm = min(ds, key=lambda d: (d[2] - e["x"]) ** 2 + (d[3] - e["y"]) ** 2)
            new = [dx, dy + 1]
            if c["parameters"][2:4] != new:
                print("Map%03d #%d %-26s %s -> %s  (%s)" % (mid, e["id"], e["name"][:26], c["parameters"][2:4], new, nm)); c["parameters"][2:4] = new; n += 1
    if n:
        open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(WS.map_text(m).encode("utf-8")); changed += 1
print("wnętrza zmienione: %d" % changed)
