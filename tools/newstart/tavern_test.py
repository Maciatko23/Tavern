# python tavern_test.py [applied dir]  - the tavern's surroundings walked in the game (tavern_test.js; set CDP_PORT):
# Map008 flooded from every entrance (the lane from "Polna droga", the road from the Lord's estate, the tavern's gate) - every
# exit reached, no closed pockets, no water; Map001 from the landing inside to its doorway; then every transfer that touches
# Map008 or the tavern's door, both ways. [applied dir] = python tools/apply_tavern_area.py --out DIR (else data/ as it is).
import json, os, subprocess, sys, tempfile
from layout import transfers
from tavern_layout import TAVERN_MAP, OUTSIDE_MAP, GATE_TILES, INSIDE_LANDING, EXITS, EXIT_DIRECTION
HERE = os.path.dirname(os.path.abspath(__file__))

edge = [t for t in transfers() if OUTSIDE_MAP in (t[0], t[3])]
SIZE = {8: (30, 24), 22: (40, 30), 24: (40, 30)}
rows = []
for fm, x, y, tm, tx, ty, d, kind in edge:
    w, h = SIZE[fm]
    walk = 8 if y == 0 else 2 if y == h - 1 else 4 if x == 0 else 6
    rows.append([fm, x, y, tm, tx, ty, d, kind, walk])
lx, ly, ld = INSIDE_LANDING
for (x, y) in GATE_TILES:                                  # into the tavern: walk up into the gate (it opens, then the transfer)
    rows.append([OUTSIDE_MAP, x, y, TAVERN_MAP, lx, ly, ld, "door", 8])
for (x, y), (tx, ty) in EXITS:                             # out: walk down onto the doorway
    rows.append([TAVERN_MAP, x, y, OUTSIDE_MAP, tx, ty, EXIT_DIRECTION, "door", 2])

exits8 = [[x, y] for fm, x, y, *_ in edge if fm == OUTSIDE_MAP]
lands8 = [[tx, ty] for fm, x, y, tm, tx, ty, *_ in edge if tm == OUTSIDE_MAP] + [[tx, ty] for _c, (tx, ty) in EXITS]
front = [[x, y + 1] for (x, y) in GATE_TILES]              # where the player stands to walk into the gate
spec = {"probes": [
    {"map": OUTSIDE_MAP, "starts": lands8, "need": exits8 + lands8 + front, "noPockets": True},
    {"map": TAVERN_MAP, "starts": [[lx, ly]], "need": [[x, y] for (x, y), _t in EXITS] + [[x, y - 1] for (x, y), _t in EXITS], "noPockets": False},
], "transfers": rows}
f = os.path.join(tempfile.gettempdir(), "tavern_area_spec.json")
json.dump(spec, open(f, "w"))
args = ["node", os.path.join(HERE, "tavern_test.js"), f] + sys.argv[1:2]
for attempt in range(3):
    out = subprocess.run(args, capture_output=True, text=True, encoding="utf-8").stdout
    if "Failed to load" not in out and "page error" not in out and "is not defined" not in out: break
print(out)
