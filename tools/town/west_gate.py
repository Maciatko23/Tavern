# python tools/town/west_gate.py [--dry] [--out preview.json]
# The west gate of the town (Map008) to Podgrodzie, the poor quarter outside the wall (Map111; user 2026-10-05: "daj jeszcze
# wyjście z mapy na zachód ... droga możesz iść w lewo przy kowalu"). Modelled on east_gate.py. The crafts terrace's street
# (rows 49-53) runs west past the smithy up to the west wall exactly between two round towers (the north one ends on row 49,
# the south / corner one starts on 52) - the mirror of the east gate:
#   - the wall band (x 0-1, rows 50-51) opened: cobble like the street, the battlement bits (B 12,1) on x 1 taken off
#   - the stone well with the little roof that stood right in front of the gap (C 8..9, 6..9 at 2-3, 49..52) moved into the
#     tanners' yard by the laundry shed (15-16, 46..49; its base closes 15-16, 48..49); the cat that lay there (event 136,
#     a "Nature" picture) moved two cells right to (18,46); the barrels and the woodpile by the wall stay where they were
#   - the poor side's gate: no banners - a lantern hung on the north tower over the gap, a signpost at the street's end
#   - the exits (0, 50..51) -> Map111 (44, 17..18) facing left; Map111's east edge (45, 17..18) lands here on (1, 50..51)
#   - RegionLayers: the opened cells free (region 0), the signpost closes its own cell (its picture is an event)
# Floor autotile shapes (A2, A4 tops) are recomputed round the changes like the editor draws them; wall sides stay. Refuses to run
# on a map that is not in the expected state (already opened, the well gone, cells taken). Backups: backup_art_2026-10-05/podgrodzie/.
import os, sys, json, copy, argparse, shutil, datetime, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
from nslib import write_map, floor_shape, is_wall_kind

COBBLE, WALL_TOP = 24 + 16, 97                 # (nslib kinds: A2 kinds + 16; the A4 wall top)
GATE = [(0, 50), (1, 50), (0, 51), (1, 51)]
WELL_FROM, WELL_TO = (2, 49), (15, 46)          # the top-left cell; the well is 2 wide, 4 tall (3 rows on layer 3, its base on layer 2)
CAT_ID, CAT_FROM, CAT_TO = 136, (16, 46), (18, 46)
LANTERN = (1, 49)                               # on the north tower's foot, over the gap
SIGNPOST = (2, 49)
PODGRODZIE, LANDING_X, ROW_OFF = 111, 44, 33     # Map111's rows = Map008's rows - 33
BACKUP = ROOT + "backup_art_2026-10-05/podgrodzie/"

def load(path):
    with open(path, "rb") as f:
        return json.loads(f.read().decode("utf-8"))

def page(image, lst, trigger=0, priority=1, step=False, through=False, dfix=True):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": dfix, "image": image, "list": lst + [{"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": priority, "stepAnime": step, "through": through, "trigger": trigger, "walkAnime": False}

def pic(name, index=0, direction=2, pattern=0, tile=0):
    return {"tileId": tile, "characterName": name, "direction": direction, "pattern": pattern, "characterIndex": index}

def C(col, row): return 256 + (row * 8 + col % 8) + (128 if col >= 8 else 0)

def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") for l in out.splitlines())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--out", help="write the result here instead of data/Map008.json (a preview; no backup)")
    a = ap.parse_args()
    path = ROOT + "data/Map008.json"
    mp = load(path)
    W, H, d = mp["width"], mp["height"], mp["data"]
    I = lambda x, y, z: (z * H + y) * W + x
    kind = lambda t: (t - 2048) // 48 if t >= 2048 else None

    # ---- the map must be the one this was made for
    wx, wy = WELL_FROM
    tx, ty = WELL_TO
    well = {(0, 0, 3): C(8, 6), (1, 0, 3): C(9, 6), (0, 1, 3): C(8, 7), (1, 1, 3): C(9, 7), (0, 2, 3): C(8, 8), (1, 2, 3): C(9, 8),
            (0, 3, 2): C(8, 9), (1, 3, 2): C(9, 9)}
    problems = []
    for (x, y) in GATE:
        if kind(d[I(x, y, 0)]) != WALL_TOP: problems.append("(%d,%d) is not the wall top (already open?)" % (x, y))
    for (i, j, z), t in well.items():
        if d[I(wx + i, wy + j, z)] != t: problems.append("the well is not at (2..3, 49..52)")
        if d[I(tx + i, ty + j, 2)] or d[I(tx + i, ty + j, 3)]: problems.append("(%d,%d) is not free" % (tx + i, ty + j))
    for c in (SIGNPOST,):
        if d[I(c[0], c[1], 2)]: problems.append("%s is not free" % (c,))
    evs = {e["id"]: e for e in mp["events"] if e}
    taken = {(e["x"], e["y"]) for e in evs.values()}
    cat = evs.get(CAT_ID)
    if not cat or (cat["x"], cat["y"]) != CAT_FROM: problems.append("event %d is not the cat on %s" % (CAT_ID, CAT_FROM))
    for c in [SIGNPOST, LANTERN, CAT_TO] + [(0, 50), (0, 51)] + [(tx + i, ty + j) for i in range(2) for j in range(4)]:
        if c in taken and c != CAT_FROM: problems.append("an event already stands on %s" % (c,))
    if problems: sys.exit("Map008 is not as expected: " + "; ".join(sorted(set(problems))))

    # ---- tiles: the gap opened, the well moved
    for (x, y) in GATE:
        for z in (1, 2, 3, 4): d[I(x, y, z)] = 0
        d[I(x, y, 0)] = 2048 + COBBLE * 48
        d[I(x, y, 5)] = 0                                  # (RegionLayers: free)
    for (i, j, z), t in well.items():
        d[I(wx + i, wy + j, z)] = 0
        d[I(tx + i, ty + j, z)] = t
    # the autotile shapes of the floor kinds round the gap, as the editor would draw them
    for z in (0, 1):
        for y in range(46, 56):
            for x in range(0, 6):
                t = d[I(x, y, z)]
                k = kind(t)
                if k is None or k < 16 or is_wall_kind(k): continue
                def same(dx, dy, x=x, y=y, z=z, k=k):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
                    return kind(d[I(nx, ny, z)]) == k
                d[I(x, y, z)] = 2048 + k * 48 + floor_shape(same)

    # ---- events
    events = mp["events"]
    first_new = len(events)
    def add(name, x, y, pages, note=""):
        e = {"id": len(events), "name": name, "note": note, "pages": pages, "x": x, "y": y}
        events.append(e)
        return e
    for r in (50, 51):
        add("Przejście -> Podgrodzie", 0, r, [page(pic(""), [{"code": 201, "indent": 0, "parameters": [0, PODGRODZIE, LANDING_X, r - ROW_OFF, 4, 0]}],
                                                  trigger=1, priority=0, dfix=False)])
    add("Latarnia na baszcie", LANTERN[0], LANTERN[1], [page(pic("!Decoration", 7, 2, 0), [], priority=2, through=True)],
        note="<Light:150,90,62,24><LightWhen:night>")
    text = ["Drogowskaz. Na zachód: brama zachodnia i Podgrodzie,", "chaty biedoty za murem.",
            "Na wschód: warsztaty, schody na rynek, brama Lorda."]
    lst = [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}] + [{"code": 401, "indent": 0, "parameters": [t]} for t in text]
    add("Drogowskaz (brama zachodnia)", SIGNPOST[0], SIGNPOST[1], [page(pic("!Tavern_Yard", 2, 6), lst)])
    cat["x"], cat["y"] = CAT_TO

    print("west gate: %d cells opened, the well moved %s -> %s, the cat -> %s, new events %d..%d"
          % (len(GATE), WELL_FROM, WELL_TO, CAT_TO, first_new, events[-1]["id"]))
    if a.dry: return
    if a.out:
        write_map(a.out, mp, d, events); return
    if editor_running(): sys.exit("STOP: the RPG Maker MZ editor is running - close it first.")
    os.makedirs(BACKUP, exist_ok=True)
    shutil.copy2(path, BACKUP + "Map008_before_west_gate_%s.json" % datetime.datetime.now().strftime("%H%M%S"))
    write_map(path, mp, d, events)

if __name__ == "__main__":
    main()
