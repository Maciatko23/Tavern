# -*- coding: utf-8 -*-
"""Latarnia na cyplu Przystani (gracz 2026-11-08: „na dole po prawo, na wystającym cypelku latarnia morska - przystań ma latarnię i
pasuje do fabuły”). Przenosi z Przylądka (Map159, odstawiony) na cypel Map125 (wyspa.py CYPEL) to, co już jest w grze:
  - wieża (!$Latarnia_Wieza, <Latarnia:wieza>) z murem-blokadami - na końcu cypla, od strony morza; znacznik „laterna” przed drzwiami;
  - dzwon mgłowy (<Latarnia:dzwon>) i znacznik; słup i płyta strażnicy zakonu;
  - izba latarnika (kafle: ściany, dach, beczki tranu; drzwi <Town:door=latarnik>, dym, latarenka, znaczniki izba / izba_sen) - przy
    nasadzie cypla; drewutnia (kafle, zdarzenie, znacznik);
  - zatoczka szczątków (<Latarnia:szczatki>) i znaczniki obozu i napadu - na zachodnim brzegu cypla.
Wnętrza 160 / 161 - wyjścia na nowe miejsca; dane wtyczek (Latarnia_Data MAP, miejsca, Podróżni d40, Wrak / Kruk ready, Wyspa_Data
pakiet C, patrole Ludzi przylądka, Debug) - na Przystań. Szlak latarni do Osady Milczących - odstawiony z Osadą.
  python tools/plansza/latarnia.py   (po teren.py, przed drogi.py)"""
import json, os, re, sys
from plansza import ROOT, N, STG, W
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import numpy as np
import pieczatki as P
OUT = os.path.join(STG, "data"); PL = os.path.join(STG, "js", "plugins")
src = json.load(open(os.path.join(ROOT, "data", "Map159.json"), encoding="utf-8"))
SE = {e["id"]: e for e in src["events"] if e}
p125 = os.path.join(OUT, "Map125.json")
m = json.load(open(p125, encoding="utf-8")); t = m["data"]; n = N * N
NAT = re.compile(r"^!\$(Pine|Tree|Big_Trees|Bush|Rock|Boulder|Trunk|Stump|Log|Sapling)", re.I)
T_OLD, T_NEW = (22, 11), (92, 102)                     # (the tower's cell: on the Przylądek and on the hill's top at the cape's tip)
HUT, HUT_AT = (12, 15, 9, 8), (76, 95)                 # (the keeper's hut: its window on Map159 and its top-left on the cape's root)
WOOD, WOOD_AT = (25, 17, 7, 4), (83, 94)               # (the woodshed: beside the hut, clear of the tower's picture)
# (the order's post on the lower ledge, its slab on the beach, the debris cove and the camp on the west shore, the fog bell and its
# marker on the top beside the tower)
SINGLE = {8: (87, 100), 9: (91, 112), 14: (80, 108), 46: (80, 108), 45: (81, 110), 10: (95, 100), 47: (95, 101)}
# (gracz 2026-11-08: „na cypelku wzgórze i na wzgórzu ta latarnia”) the hill in two tiers as on the Przylądek (the author's terraces,
# tools/mountains/mtlib.py: A5 rims, two rows of rock face below each south edge, steps cut through the face): the lower ledge with
# steps up from the beach, the top with the tower and steps straight to its door
TIER1, STEPS1 = (86, 98, 96, 107), (87, 88)            # (x0, y0, x1, y1 - the rim row y1 carries the steps; the steps' columns)
TIER2, STEPS2 = (89, 98, 95, 103), (91, 93)
REL = [1, 2, 3, 4, 48, 52, 41]                         # (the tower, its wall blockers, laterna: kept where they stand to the tower)
# ---- the cape cleared: nature and stamps' events off it (the reserve), the ground kept
X0, Y0, X1, Y1 = 72, 92, 106, 117
m["events"] = [None if (e and X0 <= e["x"] <= X1 and Y0 <= e["y"] <= Y1 and NAT.match(e["pages"][0]["image"]["characterName"] or "")) else e for e in m["events"]]
pl = P.Plotno(N, N, m["tilesetId"]); pl.a = np.array(t, dtype=np.int32).reshape(6, N, N)
base = pl.a.copy()
for e in m["events"]:
    if e:
        for (dx, dy) in P.stopa(e): pl.zajete[(e["x"] + dx, e["y"] + dy)] = -1
placed = []   # (old event, new x, new y)
def stamp(win, at):
    st = P.wytnij(src, win[0], win[1], win[2], win[3], "latarnia", "latarnia", zdarzenia="brak", pelny=True, kontrola=False)
    pl.wstaw(st, at[0], at[1], zdarzenia=False, nadpisz_zdarzenia=False)
    for e in SE.values():
        if win[0] <= e["x"] < win[0] + win[2] and win[1] <= e["y"] < win[1] + win[3] and not NAT.match(e["pages"][0]["image"]["characterName"] or ""):
            placed.append((e, at[0] + e["x"] - win[0], at[1] + e["y"] - win[1]))
stamp(HUT, HUT_AT); stamp(WOOD, WOOD_AT)
# (the windows bring the hut, the barrels and the wood - their ground stays the cape's own: the Przylądek's path, its stone strips and
# its terrace rims would be square patches here)
wcells = set()
for (win, at) in ((HUT, HUT_AT), (WOOD, WOOD_AT)):
    for j in range(win[3]):
        for i in range(win[2]):
            x, y = at[0] + i, at[1] + j
            v0, v1 = int(pl.a[0, y, x]), int(pl.a[1, y, x])
            if 2816 <= v0 < 4352 or 1536 + 64 <= v0 < 2048: pl.a[0, y, x] = base[0, y, x]; pl.a[4, y, x] = base[4, y, x]; wcells.add((x, y))
            if 2816 <= v1 < 4352 and W.kind_of(v1) == 23: pl.a[1, y, x] = base[1, y, x]; wcells.add((x, y))
pl.przelicz(wcells)
sys.path.insert(0, os.path.join(ROOT, "tools", "mountains"))
import mtlib as MT
CX0, CY0, CW, CH = 72, 92, 36, 25
box = lambda r: {(x - CX0, y - CY0) for y in range(r[1], r[3] + 1) for x in range(r[0], r[2] + 1)}
hill = MT.MMap(999, CW, CH, "x", "", seed=125)
hill.raise_to(box(TIER1), 1, "grass"); hill.raise_to(box(TIER2), 2, "grass")
hill.terraces()
hill.stairs(STEPS1[0] - CX0, STEPS1[1] - CX0, TIER1[3] - CY0); hill.stairs(STEPS2[0] - CX0, STEPS2[1] - CX0, TIER2[3] - CY0)
hd = hill.resolve()
hcells, rock = [], set()
for y in range(CH):
    for x in range(CW):
        c = (x, y)
        if hill.lv(*c) >= 1 or c in hill.faces or c in hill.stair_cells:
            X, Y = CX0 + x, CY0 + y
            if 2048 <= base[0, Y, X] < 2816: raise SystemExit("latarnia: wzgórze wchodzi w morze (%d,%d)" % (X, Y))
            pl.a[0, Y, X] = hd[y * CW + x]
            for z in (1, 2, 3, 4): pl.a[z, Y, X] = 0
            hcells.append((X, Y))
            if c in hill.faces or c in hill.stair_cells: rock.add((X, Y))
for z in (0, 1): P.przelicz_warstwe(pl.a[z], W.ring(set(hcells), 1) - set(hcells))   # (the ground round the hill only - the hill keeps mtlib's shapes)
# the path (earth in the grass, A2 17 - the author's own path kind): from the hut's door down the hill's west flank to the beach and
# along it to the lower steps
def path(pts, w=2):
    out = set()
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = max(abs(bx - ax), abs(by - ay))
        for k in range(n + 1):
            x = round(ax + (bx - ax) * k / n); y = round(ay + (by - ay) * k / n)
            for dx in range(w):
                for dy in range(w):
                    c = (x + dx, y + dy)
                    if 2816 <= pl.a[0, c[1], c[0]] < 4352 and not pl.a[2, c[1], c[0]] and not pl.a[3, c[1], c[0]] and c not in hcells: out.add(c)
    for (x, y) in out: pl.a[0, y, x] = 2048 + 17 * 48; pl.a[1, y, x] = 0
    pl.przelicz(out)
    return out
path([(79, 99), (79, 104), (81, 108), (84, 110), (88, 110)])
for i in REL: placed.append((SE[i], T_NEW[0] + SE[i]["x"] - T_OLD[0], T_NEW[1] + SE[i]["y"] - T_OLD[1]))
for i, (x, y) in SINGLE.items(): placed.append((SE[i], x, y))
for (e, x, y) in placed:
    if (x, y) in rock: raise SystemExit("latarnia: %s na skale / schodach (%d,%d)" % (e["name"], x, y))
m["data"] = [int(v) for v in pl.a.reshape(-1)]
# the events: their own ids where free (Latarnia's tags find them by name / tag), else the next free 1-499
used = {e["id"] for e in m["events"] if e}
free = [i for i in range(1, 500) if i not in used]
where = {}
for (e, x, y) in placed:
    if not (0 <= x < N and 0 <= y < N) or 2048 <= m["data"][y * N + x] < 2816: raise SystemExit("latarnia: %s wypada w morzu (%d,%d)" % (e["name"], x, y))
    ne = json.loads(json.dumps(e)); ne["id"] = free.pop(0); ne["x"], ne["y"] = x, y
    while len(m["events"]) <= ne["id"]: m["events"].append(None)
    m["events"][ne["id"]] = ne; where[e["id"]] = (x, y)
open(p125, "wb").write(W.map_text(m).encode("utf-8"))
izba, laterna, drewutnia = where[42], where[41], where[44]
# ---- the interiors' ways out
for mid, to in ((160, izba), (161, laterna)):
    d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
    k = 0
    for e in d["events"]:
        if not e: continue
        for pg in e["pages"]:
            for c in pg["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 159:
                    c["parameters"][1], c["parameters"][2], c["parameters"][3] = 125, to[0], to[1]; k += 1
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(d).encode("utf-8"))
    print("Map%03d: wyjść przepiętych na Przystań %d" % (mid, k))
# ---- the plugins (the staged copy when there is one)
def src_js(f):
    q = os.path.join(PL, f)
    return open(q if os.path.exists(q) else os.path.join(ROOT, "js", "plugins", f), "rb").read().decode("utf-8")
def put(f, pairs):
    s = src_js(f)
    for old, new in pairs:
        if s.count(old) != 1: raise SystemExit("%s: nie znalazłem: %s" % (f, old[:90]))
        s = s.replace(old, new)
    os.makedirs(PL, exist_ok=True); open(os.path.join(PL, f), "wb").write(s.encode("utf-8"))
put("Latarnia_Data.js", [
    ("const MAP = 159, IZBA = 160, LATERNA = 161;", "const MAP = 125, IZBA = 160, LATERNA = 161;   // (plansza 3x3, 2026-11-08: the lighthouse on Przystań's cape)"),
    ("laterna: [22, 12, 8], izba: [15, 19, 8], izba_sen: [15, 19, 8], drewutnia: [25, 19, 6]",
     "laterna: [%d, %d, 8], izba: [%d, %d, 8], izba_sen: [%d, %d, 8], drewutnia: [%d, %d, 6]" % (laterna + izba + izba + drewutnia)),
    ('FAR: { 13: { side: "right", sy: 0.2 }, 157: { side: "right", sy: 0.3 } } };', 'FAR: {} };   // (the beams far off beyond an edge: none on the board for now)')])
put("Podroznicy_Data.js", [('d40_latarnia: { map: 159, id: 951, marker: "laterna", dx: 1, x: 23, y: 12,', 'd40_latarnia: { map: 125, id: 951, marker: "laterna", dx: 1, x: %d, y: %d,' % (laterna[0] + 1, laterna[1]))])
put("Wrak_Data.js", [('{ key: "latarnia", map: 159, ready: 159 }', '{ key: "latarnia", map: 125, ready: 125 }')])
put("Kruk_Data.js", [('{ key: "latarnik", ready: 159 }', '{ key: "latarnik", ready: 125 }')])
put("Wyspa_Data.js", [("przyladek: 159,", "przyladek: 125,"), ('C: { owner: "Latarnia", maps: [159, 160, 161],', 'C: { owner: "Latarnia", maps: [125, 160, 161],')])
# the cape's night patrols (Ludzie): from the Przylądek's forest to the forest above the cape
PAT = [(60, 70), (75, 62), (88, 80), (70, 88), (55, 84)]
put("Ludzie_Data.js", [
    ('{ key: "patrol_159", map: 159, kind: "patrol", mode: "reach", cells: [[53, 45], [70, 40], [80, 53], [60, 61], [50, 70]] }',
     '{ key: "patrol_159", map: 125, kind: "patrol", mode: "reach", cells: [%s] }' % ", ".join("[%d, %d]" % c for c in PAT)),
    ("159: { lud_p159_1: [53, 45, 2], lud_p159_2: [70, 40, 6], lud_p159_3: [80, 53, 2], lud_p159_4: [60, 61, 4], lud_p159_5: [50, 70, 8], lud_p159_noc: [30, 77, 2] },",
     "125: Object.assign({ lud_p159_1: [60, 70, 2], lud_p159_2: [75, 62, 6], lud_p159_3: [88, 80, 2], lud_p159_4: [70, 88, 4], lud_p159_5: [55, 84, 8], lud_p159_noc: [84, 94, 2] }, {}),"),
    ("const PATROL_AMBUSH = { map: 159, at: [70, 40],", "const PATROL_AMBUSH = { map: 125, at: [75, 62],"),
    ("przyladek: 159,", "przyladek: 125,")])
put("Ludzie.js", [("[159, 53, 46, 2], [162, ", "[125, 60, 70, 2], [162, "), ("159, 53, 46, 2] };", "125, 60, 70, 2] };")])
put("Okolice_Data.js", [('{key: "patrol_159", pkg: "C", map: 159, kind: "patrol", mode: "reach", name: "Obchód patrolu", cells: [[53, 45], [70, 40], [80, 53], [60, 61], [50, 70]]}',
                         '{key: "patrol_159", pkg: "C", map: 125, kind: "patrol", mode: "reach", name: "Obchód patrolu", cells: [%s]}' % ", ".join("[%d, %d]" % c for c in PAT))])
put("Debug.js", [('{ id: "latarnia", map: 159, x: 30, y: 78, d: 8 }', '{ id: "latarnia", map: 125, x: %d, y: %d, d: 2 }' % (izba[0], izba[1] + 2))])
print("latarnia na cyplu: wieża (%d,%d), izba drzwi ~(%d,%d), drewutnia (%d,%d); zdarzeń %d" % (T_NEW + izba + drewutnia + (len(placed),)))
