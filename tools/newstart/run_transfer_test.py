# python run_transfer_test.py [applied dir]  - every transfer of layout.py walked in the game (transfer_test.js; CDP_PORT)
import json, os, subprocess, sys, tempfile
from layout import transfers, island_transfers, meadow_transfers, MAPS
HERE = os.path.dirname(os.path.abspath(__file__))
SIZE = {k: v["size"] for k, v in MAPS.items()}
# (2026-10-18) every map's size from its file (the outdoor maps doubled by tools/powieksz/powieksz.py)
_DATA = os.path.abspath(os.path.join(HERE, "..", "..", "data"))
def _size(mid):
    m = json.load(open(os.path.join(_DATA, "Map%03d.json" % mid), encoding="utf-8"))
    return (m["width"], m["height"])
SIZE.update({k: _size(k) for k in (3, 8, 111, 13, 125, 168, 20, 21, 22, 23, 24)})   # (Map008 = town C since 2026-09-29; Map111 Podgrodzie 2026-10-05,
#  + 20 rows at the bottom 2026-10-15: Chata pod lasem; Map125 Przystań 2026-10-14; Map168 Spalona zagroda 2026-10-15)
DOOR_WALK = {(19, 9, 12): 2, (20, 15, 7): 8, (24, 0, 16): 4}    # out through the doorway (down), in through the cottage door (up)
rows = []
for fm, x, y, tm, tx, ty, d, kind in transfers():
    w, h = SIZE[fm]
    if kind == "door": walk = DOOR_WALK[(fm, x, y)]
    elif y == 0: walk = 8
    elif y == h - 1: walk = 2
    elif x == 0: walk = 4
    else: walk = 6
    rows.append([fm, x, y, tm, tx, ty, d, kind, walk])
# (2026-10-15) Skraj lasu's west edge rows 6-8 <-> the burnt farm's east edge rows 11-13 (Homes.js puts the Map023 side in at
# runtime - ids 706-708 - so it is not in layout.py, whose apply scripts write the transfers into the map files)
for i in range(3):
    rows.append([23, 0, 6 + i, 168, 98, 11 + i, 4, "edge", 4])      # (2026-10-18: Map168 doubled to 100x72)
    rows.append([168, 99, 11 + i, 23, 1, 6 + i, 6, "edge", 6])
# (2026-10-16) the six island places (layout.py ISLAND_EDGES / ISLAND_DOORS): the harbour <-> the hermitage and the garrison, the
# hermitage <-> the Urwisko <-> the cape <-> the mountains, the garrison <-> the wreck (low tide), the Urwisko's grate <-> the cistern
SIZE.update({k: _size(k) for k in (155, 157, 159, 162, 165, 167)})
for fm, x, y, tm, tx, ty, d, kind, walk, setup in island_transfers():
    if walk is None:
        w, h = SIZE[fm]
        walk = 8 if y == 0 else 2 if y == h - 1 else 4 if x == 0 else 6
    rows.append([fm, x, y, tm, tx, ty, d, kind, walk] + ([setup] if setup else []))
# (2026-10-18) the meadows Łąka#2 (17) and Łąka#3 (18) joined to grandpa's field (layout.py MEADOW_EDGES, tools/apply_laki.py)
SIZE.update({k: _size(k) for k in (17, 18)})
for fm, x, y, tm, tx, ty, d, kind in meadow_transfers():
    w, h = SIZE[fm]
    walk = 8 if y == 0 else 2 if y == h - 1 else 4 if x == 0 else 6
    rows.append([fm, x, y, tm, tx, ty, d, kind, walk])
# (2026-10-18) the edge transfers written by hand in the outdoor maps' files (the user's own, e.g. Map003 N <-> Map004 S) - read from
# the files, so the maps doubled by tools/powieksz/powieksz.py are walked at their new edges too. Only events on the map's edge whose
# first page is a touch with no condition; the expected facing: the transfer's own, or the walk's when it keeps the direction (0).
OUTDOOR = [3, 4, 17, 18, 20, 21, 22, 23, 13, 175, 8, 24, 111, 125, 155, 157, 159, 162, 165, 120, 168]
have = {(r[0], r[1], r[2]) for r in rows}
DATA = os.path.abspath(os.path.join(HERE, "..", "..", "data"))
for fm in OUTDOOR:
    p = os.path.join(DATA, "Map%03d.json" % fm)
    if not os.path.exists(p): continue
    m = json.load(open(p, encoding="utf-8"))
    w, h = m["width"], m["height"]
    SIZE[fm] = (w, h)
    for e in m["events"]:
        if not e or (fm, e["x"], e["y"]) in have: continue
        x, y, pg = e["x"], e["y"], e["pages"][0]
        if not (x in (0, w - 1) or y in (0, h - 1)) or pg["trigger"] not in (1, 2): continue
        if any(v for k, v in pg["conditions"].items() if k.endswith("Valid")): continue
        cmd = next((c for c in pg["list"] if c["code"] == 201 and c["parameters"][0] == 0), None)
        if not cmd: continue
        walk = 8 if y == 0 else 2 if y == h - 1 else 4 if x == 0 else 6
        tm, tx, ty, d = cmd["parameters"][1:5]
        rows.append([fm, x, y, tm, tx, ty, d or walk, "edge (plik)", walk])
        have.add((fm, x, y))
f = os.path.join(tempfile.gettempdir(), "newstart_transfers.json")
json.dump(rows, open(f, "w"))
args = ["node", os.path.join(HERE, "transfer_test.js"), f] + sys.argv[1:2]
for attempt in range(3):
    out = subprocess.run(args, capture_output=True, text=True, encoding="utf-8").stdout
    if "Failed to load" not in out and "page error" not in out: break
print(out)
