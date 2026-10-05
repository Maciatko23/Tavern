# python tools/town/east_gate.py [--dry]
# The east gate to the Lord's manor on the town (Map008), put back after the user's rebuild walled it up (user 2026-10-04:
# "wschodnia brama musi być, przejście ładne do posesji lorda"). The crafts terrace's street (rows 49-53) and its light paved path
# (row 50) run up to the east wall exactly between two round towers (the north one ends on row 49, the south one starts on 52):
#   - the wall band (x 50-51, rows 50-51) opened: cobble, the light path carried on through the gate to the map's edge
#   - the stone well that stood in the way (48, 50-52, B tiles) moved to (45, 51-53), off the path
#   - Lord Zaleski's colours (!Flags_banner 0, the red banner with the black horse) on the north tower over the gate
#   - two fire baskets (tools/town/prefabs/kosze_zarowe: the pillar tile + its flame) flanking the gate on the town side
#   - a signpost at the paths' crossing; the exits (51, 50..51) -> Map024 (1, 14..15); Map024's west edge (0, 14..16) -> here
#   - RegionLayers: the opened cells free (region 0), the fire baskets' pillars region 2; the wall's blocker event 192 shortened
# Autotile shapes recomputed only for floor kinds (A2 ground, A4 wall tops) around the changes: they match the editor's own
# (checked on the untouched cells); wall sides are left as they are. Refuses to run on a map that is not in the expected state.
import os, sys, json, copy, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
from nslib import write_map, floor_shape, is_wall_kind

COBBLE, PATH_BASE, PATH_TOP, WALL_TOP = 24 + 16, 27 + 16, 30 + 16, 97   # (nslib kinds: A2 kinds + 16; the A4 wall top)
GATE = [(50, 50), (51, 50), (50, 51), (51, 51)]
PATH = [(48, 50), (49, 50), (50, 50), (51, 50)]
WELL_FROM, WELL_TO = (48, 50), (45, 51)        # the top cell; the well is 3 cells tall
BANNERS = [(50, 49), (51, 49)]
BASKETS = [(49, 49), (49, 53)]                  # the pillars; the flames one cell above
SIGNPOST = (47, 52)
EXITS = [((51, 50), (1, 14)), ((51, 51), (1, 15))]
ENTRIES = {65: (50, 50), 66: (50, 51), 67: (50, 51)}   # Map024's west edge events -> where they land here

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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    mp, m24 = load(ROOT + "data/Map008.json"), load(ROOT + "data/Map024.json")
    W, H, d = mp["width"], mp["height"], mp["data"]
    I = lambda x, y, z: (z * H + y) * W + x
    kind = lambda t: (t - 2048) // 48 if t >= 2048 else None

    # ---- the map must be the one this was made for
    problems = []
    for (x, y) in GATE:
        if kind(d[I(x, y, 0)]) != WALL_TOP: problems.append("(%d,%d) is not the wall top" % (x, y))
    if [d[I(WELL_FROM[0], WELL_FROM[1] + i, 3)] for i in range(3)] != [465, 473, 481]:
        problems.append("the well is not at (48, 50..52)")
    for (x, y) in [(45, 51), (45, 52), (45, 53), SIGNPOST] + BASKETS + [(bx, by - 1) for bx, by in BASKETS]:
        if d[I(x, y, 2)] or d[I(x, y, 3)]: problems.append("(%d,%d) is not free" % (x, y))
    taken = {(e["x"], e["y"]) for e in mp["events"] if e}
    for c in [SIGNPOST] + BASKETS + [(bx, by - 1) for bx, by in BASKETS] + BANNERS + [x for x, _ in EXITS]:
        if c in taken: problems.append("an event already stands on %s" % (c,))
    if problems: sys.exit("Map008 is not as expected: " + "; ".join(problems))

    # ---- tiles: the gate opened, the path carried through, the well moved
    for (x, y) in GATE:
        for z in (1, 2, 3, 4): d[I(x, y, z)] = 0
        d[I(x, y, 0)] = 2048 + COBBLE * 48
        d[I(x, y, 5)] = 0                                  # (RegionLayers: free)
    for (x, y) in BASKETS: d[I(x, y, 5)] = 2               # (the pillar tile is a star tile: walkable without RegionLayers' region 2)
    for (x, y) in PATH:
        d[I(x, y, 0)] = 2048 + PATH_BASE * 48
        d[I(x, y, 1)] = 2048 + PATH_TOP * 48
    wx, wy = WELL_FROM
    tx, ty = WELL_TO
    for i in range(3):
        d[I(tx, ty + i, 3)] = d[I(wx, wy + i, 3)]
        d[I(wx, wy + i, 3)] = 0
    # the autotile shapes of the floor kinds around the changes, as the editor would draw them
    for z in (0, 1):
        for y in range(46, 56):
            for x in range(43, W):
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
    for (x, y), (tx2, ty2) in EXITS:
        add("Przejście -> Posiadłość Lorda", x, y, [page(pic(""), [{"code": 201, "indent": 0, "parameters": [0, 24, tx2, ty2, 6, 0]}],
                                                         trigger=1, priority=0, dfix=False)])
    for (x, y) in BANNERS:
        add("Chorągiew Lorda Zaleskiego", x, y, [page(pic("!Flags_banner", 0, 4, 1), [])])
    pf = load(os.path.join(HERE, "prefabs", "kosze_zarowe.json"))
    pillar = next(e for e in pf["events"] if e["pages"][0]["image"]["tileId"] == 264)
    flame = next(e for e in pf["events"] if e["pages"][0]["image"]["characterName"] == "!Decoration" and e["pages"][0]["image"]["characterIndex"] == 0)
    for (x, y) in BASKETS:
        add("Kosz żarowy (słup)", x, y, copy.deepcopy(pillar["pages"]))
        add("Kosz żarowy (ogień)", x, y - 1, copy.deepcopy(flame["pages"]), note="<Light:200,120,60,16><LightFlicker:0.15>")   # (RoomLighting: lit once the town gets <Dark:on>)
    text = ["Drogowskaz. Na wschód: brama Lorda i droga", "do Posiadłości Lorda Zaleskiego.", "Na zachód: warsztaty, schody na rynek."]
    lst = [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}] + [{"code": 401, "indent": 0, "parameters": [t]} for t in text]
    add("Drogowskaz", SIGNPOST[0], SIGNPOST[1], [page(pic("!Tavern_Yard", 2, 6), lst)])
    for e in events:
        if e and e["id"] == 192 and e["note"] == "<Occupy:right=1,up=6>":
            e["note"] = "<Occupy:right=1,up=4>"            # (rows 52-56: the south tower and the wall under it, not the gate)

    # ---- Map024's west edge lands in the gate
    for eid, (x, y) in ENTRIES.items():
        for p in m24["events"][eid]["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][1] == 8:
                    c["parameters"][2], c["parameters"][3] = x, y

    print("east gate: %d cells opened, path to the edge, well moved to %s, new events %d..%d, Map024 entries -> %s"
          % (len(GATE), WELL_TO, first_new, events[-1]["id"], ENTRIES))
    if a.dry: return
    write_map(ROOT + "data/Map008.json", mp, d, events)
    write_map(ROOT + "data/Map024.json", m24, m24["data"], m24["events"])

if __name__ == "__main__":
    main()
