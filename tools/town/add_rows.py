# Adds N rows of grass at the bottom of the town (Map008) - user 2026-09-30: "dodać od dołu dodatkowe kratki tak ze 10 wierszy".
# Everything on the map keeps its place; the south exit (the events that transfer to Polna droga, Map022) moves down to the new
# bottom edge and Map022's way in (events 65-67) lands one row above it. The editor must be CLOSED.
#   python tools/town/add_rows.py [N]
import json, os, shutil, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from apply_tavern_interior import write_map, map_style

N = int(sys.argv[1]) if len(sys.argv) > 1 else 10
GRASS = 2816            # A2, the first autotile kind (the tileset author's grass), full shape
def P(*a): return os.path.join(ROOT, *a)
out = subprocess.run(["powershell", "-NoProfile", "-Command",
                      "Get-Process | Where-Object { $_.ProcessName -match 'RPG|rpgmz|Maker' } | Select-Object -ExpandProperty ProcessName"],
                     capture_output=True, text=True).stdout.strip()
if out: sys.exit("the RPG Maker editor is open - close it first")

BK = P("backup_art_2026-09-30", "town_rows")
os.makedirs(BK, exist_ok=True)
for f in ["Map008.json", "Map022.json"]:
    b = os.path.join(BK, f)
    if not os.path.exists(b): shutil.copy(P("data", f), b)

f8 = P("data", "Map008.json"); raw8 = open(f8, "rb").read(); m8 = json.loads(raw8.decode("utf-8")); st8 = map_style(raw8)
assert write_map(m8, st8) == raw8, "Map008 is not in the editor's format"
W, H = m8["width"], m8["height"]
H2 = H + N
old = m8["data"]
new = [0] * (W * H2 * 6)
for z in range(6):
    for y in range(H2):
        for x in range(W):
            new[(z * H2 + y) * W + x] = old[(z * H + y) * W + x] if y < H else (GRASS if z == 0 else 0)
m8["data"], m8["height"] = new, H2

# the south exit: the events on the old bottom row that transfer to Map022
moved = []
for e in m8["events"]:
    if not e or e["y"] != H - 1: continue
    if any(c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 22 for pg in e["pages"] for c in pg["list"]):
        e["y"] = H2 - 1; moved.append((e["id"], e["x"]))
assert moved, "no south exit found on the bottom row"
open(f8, "wb").write(write_map(m8, st8))

# Map022's way in: every transfer to Map008 that landed on the old row above the bottom now lands above the new bottom
f22 = P("data", "Map022.json"); raw22 = open(f22, "rb").read(); m22 = json.loads(raw22.decode("utf-8")); st22 = map_style(raw22)
assert write_map(m22, st22) == raw22, "Map022 is not in the editor's format"
fixed = []
for e in m22["events"]:
    if not e: continue
    for pg in e["pages"]:
        for c in pg["list"]:
            if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 8 and c["parameters"][3] == H - 2:
                c["parameters"][3] = H2 - 2; fixed.append((e["id"], c["parameters"][2]))
open(f22, "wb").write(write_map(m22, st22))
print("Map008: %dx%d -> %dx%d; south exit events %s now on row %d; Map022 transfers %s now land on row %d" % (W, H, W, H2, moved, H2 - 1, fixed, H2 - 2))
