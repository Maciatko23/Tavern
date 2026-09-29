# python run_transfer_test.py [applied dir]  - every transfer of layout.py walked in the game (transfer_test.js; CDP_PORT)
import json, os, subprocess, sys, tempfile
from layout import transfers, MAPS
HERE = os.path.dirname(os.path.abspath(__file__))
SIZE = {k: v["size"] for k, v in MAPS.items()}
SIZE.update({3: (40, 30), 8: (30, 24)})
DOOR_WALK = {(19, 9, 12): 2, (20, 15, 7): 8}    # out through the doorway (down), in through the cottage door (up)
rows = []
for fm, x, y, tm, tx, ty, d, kind in transfers():
    w, h = SIZE[fm]
    if kind == "door": walk = DOOR_WALK[(fm, x, y)]
    elif y == 0: walk = 8
    elif y == h - 1: walk = 2
    elif x == 0: walk = 4
    else: walk = 6
    rows.append([fm, x, y, tm, tx, ty, d, kind, walk])
f = os.path.join(tempfile.gettempdir(), "newstart_transfers.json")
json.dump(rows, open(f, "w"))
args = ["node", os.path.join(HERE, "transfer_test.js"), f] + sys.argv[1:2]
for attempt in range(3):
    out = subprocess.run(args, capture_output=True, text=True, encoding="utf-8").stdout
    if "Failed to load" not in out and "page error" not in out: break
print(out)
