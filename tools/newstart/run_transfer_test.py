# python run_transfer_test.py [applied dir]  - every transfer of layout.py walked in the game (transfer_test.js; CDP_PORT)
import json, os, subprocess, sys, tempfile
from layout import transfers, island_transfers, MAPS
HERE = os.path.dirname(os.path.abspath(__file__))
SIZE = {k: v["size"] for k, v in MAPS.items()}
SIZE.update({3: (40, 30), 8: (52, 69), 111: (46, 56), 13: (60, 48), 125: (56, 40), 168: (50, 36)})   # (Map008 = town C since 2026-09-29; Map111 Podgrodzie 2026-10-05,
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
    rows.append([23, 0, 6 + i, 168, 48, 11 + i, 4, "edge", 4])
    rows.append([168, 49, 11 + i, 23, 1, 6 + i, 6, "edge", 6])
# (2026-10-16) the six island places (layout.py ISLAND_EDGES / ISLAND_DOORS): the harbour <-> the hermitage and the garrison, the
# hermitage <-> the Urwisko <-> the cape <-> the mountains, the garrison <-> the wreck (low tide), the Urwisko's grate <-> the cistern
SIZE.update({155: (48, 36), 157: (56, 36), 159: (44, 40), 162: (56, 40), 165: (40, 30), 167: (40, 28)})
for fm, x, y, tm, tx, ty, d, kind, walk, setup in island_transfers():
    if walk is None:
        w, h = SIZE[fm]
        walk = 8 if y == 0 else 2 if y == h - 1 else 4 if x == 0 else 6
    rows.append([fm, x, y, tm, tx, ty, d, kind, walk] + ([setup] if setup else []))
f = os.path.join(tempfile.gettempdir(), "newstart_transfers.json")
json.dump(rows, open(f, "w"))
args = ["node", os.path.join(HERE, "transfer_test.js"), f] + sys.argv[1:2]
for attempt in range(3):
    out = subprocess.run(args, capture_output=True, text=True, encoding="utf-8").stdout
    if "Failed to load" not in out and "page error" not in out: break
print(out)
