# The palette map for building the town by hand (user 2026-09-30: "chcę mapę ręcznie zbudować", on the current town, with a
# palette of the author's buildings): data/Map101.json "Paleta miasteczka (do kopiowania)" under Okolice Tawerny in MapInfos,
# not linked to the game world. Every prefab of tools/town/prefabs/ stamped tile-for-tile (4 layers + shadows) with its events
# (signs, lamps, dormers, doors, the author's blockers), a name event at each one's top-left corner, grass around.
# The editor must be CLOSED. python tools/town/build_palette.py
import json, os, glob, shutil, subprocess, sys, copy
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from apply_tavern_interior import write_map, write_list, map_style

MAP_ID, PARENT = 101, 8
NAME = "Paleta miasteczka (do kopiowania)"
GAP, MAXW = 2, 62
GRASS = 2816            # A2, the first autotile kind (the author's grass), full shape

def P(*a): return os.path.join(ROOT, *a)
out = subprocess.run(["powershell", "-NoProfile", "-Command",
                      "Get-Process | Where-Object { $_.ProcessName -match 'RPG|rpgmz|Maker' } | Select-Object -ExpandProperty ProcessName"],
                     capture_output=True, text=True).stdout.strip()
if out: sys.exit("the RPG Maker editor is open - close it first")

prefabs = [json.load(open(f, encoding="utf-8")) for f in sorted(glob.glob(P("tools", "town", "prefabs", "*.json")))]
prefabs.sort(key=lambda p: (-p["h"], -p["w"]))
# shelves: left to right, a new row when the next one does not fit
place, x, y, rowh = [], GAP, GAP, 0
for p in prefabs:
    if x + p["w"] > MAXW - GAP: x, y, rowh = GAP, y + rowh + GAP + 1, 0
    place.append((p, x, y + 1))         # (+1: a row for the name event above it)
    x += p["w"] + GAP
    rowh = max(rowh, p["h"] + 1)
W, H = MAXW, y + rowh + GAP
data = [0] * (W * H * 6)
def put(z, x, y, v): data[(z * H + y) * W + x] = v
for yy in range(H):
    for xx in range(W): put(0, xx, yy, GRASS)

tmpl = json.load(open(P("data", "Map008.json"), encoding="utf-8"))
events = [None]
def add_event(e):
    e = copy.deepcopy(e); e["id"] = len(events); events.append(e)
blank_page = copy.deepcopy(next(e for e in tmpl["events"] if e)["pages"][0])
for p, px, py in place:
    for z in range(4):
        for j, row in enumerate(p["layers"][z]):
            for i, t in enumerate(row):
                if t: put(z, px + i, py + j, t)
    for j, row in enumerate(p["layers"][4]):
        for i, v in enumerate(row):
            if v: put(4, px + i, py + j, v)
    for ev in p["events"]:
        e = {k: copy.deepcopy(ev[k]) for k in ("name", "note", "pages")}
        e["x"], e["y"] = px + ev["x"], py + ev["y"]
        add_event(e)
    # the name, over its top-left corner (walk-through, no picture: only a label in the editor)
    pg = copy.deepcopy(blank_page)
    pg["image"] = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    pg["list"] = [{"code": 0, "indent": 0, "parameters": []}]
    pg["priorityType"], pg["through"], pg["trigger"] = 0, True, 0
    add_event({"name": "== %s (%dx%d) ==" % (p["name"], p["w"], p["h"]), "note": "", "pages": [pg], "x": px, "y": py - 1})

mp = {k: copy.deepcopy(v) for k, v in tmpl.items() if k not in ("data", "events")}
mp.update({"width": W, "height": H, "tilesetId": 11, "displayName": "Paleta miasteczka", "autoplayBgm": False, "autoplayBgs": False,
           "note": "Paleta: gotowe budynki autora tilesetu do kopiowania w edytorze. Nie jest częścią świata gry.",
           "data": data, "events": events, "encounterList": []})
dst = P("data", "Map%03d.json" % MAP_ID)
if os.path.exists(dst):
    bk = P("backup_art_2026-09-29", "town_install", "Map%03d_before_palette.json" % MAP_ID)
    if not os.path.exists(bk): shutil.copy(dst, bk)
open(dst, "wb").write(write_map(mp, "editor"))

# MapInfos: under Okolice Tawerny, at the end of the order
raw = open(P("data", "MapInfos.json"), "rb").read()
mi = json.loads(raw.decode("utf-8"))
assert write_list(mi) == raw, "MapInfos.json is not in the editor's format - stop"
bk = P("backup_art_2026-09-29", "town_install", "MapInfos_before_palette.json")
if not os.path.exists(bk): shutil.copy(P("data", "MapInfos.json"), bk)
while len(mi) <= MAP_ID: mi.append(None)
if not mi[MAP_ID]:
    order = max(m["order"] for m in mi if m) + 1
    mi[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": NAME, "order": order, "parentId": PARENT, "scrollX": 0, "scrollY": 0}
open(P("data", "MapInfos.json"), "wb").write(write_list(mi))

# the character sheets the prefabs use, copied when missing
SRC = [P("img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "characters"),
       P("img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "characters"),
       P("tools", "town", "staging", "characters")]
need = sorted({pg["image"]["characterName"] for e in events if e for pg in e["pages"] if pg["image"]["characterName"]})
for name in need:
    if os.path.exists(P("img", "characters", name + ".png")): continue
    src = next((os.path.join(d, name + ".png") for d in SRC if os.path.exists(os.path.join(d, name + ".png"))), None)
    if src: shutil.copy(src, P("img", "characters", name + ".png")); print("  copied", name)
    else: print("  MISSING", name)
print("ok: Map%03d %dx%d, %d prefabs, %d events" % (MAP_ID, W, H, len(place), len(events) - 1))
