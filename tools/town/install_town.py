# Installs town C (the user approved it 2026-09-29: "wrzuć tą mapę, a ja ją doprecyzuję ręcznie").
# The RPG Maker editor must be CLOSED. Backups go to backup_art_2026-09-29/town_install/ first.
#  - data/Map008.json <- tools/town/staging/Map008_C2.json (editor format); closed doors show a popup "Zamknięte." (no message window)
#  - data/Tilesets.json: only tileset 11 is filled in (the tileset author's setup), every other entry stays byte-identical
#  - the transfers into Map008 from Map001 (10-12), Map022 (65-67), Map024 (65-67) move to the new edges
#  - the character sheets the town uses are copied into img/characters (never overwriting a different existing file)
import json, os, shutil, subprocess, sys, filecmp
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from apply_tavern_interior import write_map, write_list, map_style

def P(*a): return os.path.join(ROOT, *a)
BK = P("backup_art_2026-09-29", "town_install")

def editor_open():
    out = subprocess.run(["powershell", "-NoProfile", "-Command",
                          "Get-Process | Where-Object { $_.ProcessName -match 'RPG|rpgmz|Maker' } | Select-Object -ExpandProperty ProcessName"],
                         capture_output=True, text=True).stdout.strip()
    return out
if editor_open():
    sys.exit("the RPG Maker editor is open - close it first")

os.makedirs(BK, exist_ok=True)
for f in ["Map008.json", "Map001.json", "Map022.json", "Map024.json", "Tilesets.json"]:
    b = os.path.join(BK, f)
    if not os.path.exists(b): shutil.copy(P("data", f), b)

# ---------------------------------------------------------------- the map
town = json.load(open(P("tools", "town", "staging", "Map008_C2.json"), encoding="utf-8"))
closed = 0
for e in town["events"]:
    if e and e["name"].startswith("Drzwi:"):
        for pg in e["pages"]:
            pg["list"] = [{"code": 355, "indent": 0, "parameters": ["Tawerna.popup(\"Zamknięte.\", { color: \"info\" });"]},
                          {"code": 0, "indent": 0, "parameters": []}]
        closed += 1
raw_old = open(P("data", "Map008.json"), "rb").read()
open(P("data", "Map008.json"), "wb").write(write_map(town, map_style(raw_old)))
print("Map008: %dx%d, tileset %d, %d events, %d closed doors" % (town["width"], town["height"], town["tilesetId"], sum(1 for e in town["events"] if e), closed))

# ---------------------------------------------------------------- tileset 11
raw_ts = open(P("data", "Tilesets.json"), "rb").read()
cur = json.loads(raw_ts.decode("utf-8"))
assert write_list(cur) == raw_ts, "Tilesets.json is not in the editor's format - stop"
staged = json.load(open(P("tools", "town", "staging", "Tilesets_town.json"), encoding="utf-8"))
t11 = staged[11]
assert t11 and t11["id"] == 11 and not (cur[11] and cur[11]["name"]), "slot 11 is not free"
t11["name"] = "Miasteczko (Winlu autora)"
cur[11] = t11
open(P("data", "Tilesets.json"), "wb").write(write_list(cur))
print("Tilesets: slot 11 =", t11["name"], t11["tilesetNames"])

# ---------------------------------------------------------------- the transfers into the town
MOVES = {1: {10: (18, 14), 11: (19, 14), 12: (20, 14)},
         22: {65: (24, 57), 66: (25, 57), 67: (26, 57)},
         24: {65: (50, 30), 66: (50, 31), 67: (50, 32)}}
for mid, evs in MOVES.items():
    f = P("data", "Map%03d.json" % mid)
    raw = open(f, "rb").read()
    mp = json.loads(raw.decode("utf-8"))
    style = map_style(raw)
    assert write_map(mp, style) == raw, "Map%03d is not in the editor's format - stop" % mid
    for eid, (x, y) in evs.items():
        n = 0
        for pg in mp["events"][eid]["pages"]:
            for c in pg["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 8:
                    c["parameters"][2], c["parameters"][3] = x, y; n += 1
        assert n == 1, (mid, eid, n)
    open(f, "wb").write(write_map(mp, style))
    print("Map%03d: transfers moved" % mid, evs)

# ---------------------------------------------------------------- character sheets
SRC = [P("img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "characters"),
       P("img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "characters"),
       P("tools", "town", "staging", "characters")]
need = sorted({pg["image"]["characterName"] for e in town["events"] if e for pg in e["pages"] if pg["image"]["characterName"]})
for name in need:
    dst = P("img", "characters", name + ".png")
    src = next((os.path.join(d, name + ".png") for d in SRC if os.path.exists(os.path.join(d, name + ".png"))), None)
    if os.path.exists(dst):
        if src and not filecmp.cmp(src, dst, shallow=False): print("  kept the existing, different", name)
        continue
    if not src: print("  MISSING", name); continue
    shutil.copy(src, dst); print("  copied", name)
print("ok")
