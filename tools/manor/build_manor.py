# python tools/manor/build_manor.py [--out PATH]
# Lord Zaleski's manor (Map024, 40x30) built from the town's tileset (11, the Winlu author's own set) instead of the one big
# picture (!$Manor_Lord) with invisible blockers (user 2026-10-04: "usuń obrazek posiadłości i z tilesetów zbuduj coś
# profesjonalnego"). Built the author's way (tools/town/RECIPES.md):
#   - the middle: the author's fortress front (tools/town/prefabs/twierdza_front: gothic windows, red horse banners, knights,
#     cathedral gate) tile for tile, with a full four-row red roof (A3 k56) instead of its one-row edge, dormers and chimneys
#   - two lower wings of the same stone (A4 k98 band with lit gothic windows, k97 ledge, k105 ground floor with arched windows and
#     flower boxes) under their own red roofs, set back with a shadow, the Lord's banners and wall lanterns
#   - a round tower with a helm at each end (B(13..14,0..6) + !$Big_Decoration, as on the author's castle gate)
#   - a cobbled forecourt with fire baskets, the road from the west gate (the town) lined with lamps, a formal garden in the
#     south (hedge-bordered flower beds, a knight's statue on a round plaza, benches, trees) - no fountain: the drought
#   - a hedge round the estate; the pines on the west edge stay (choppable, ChoppableTree)
# Kept from the old map: the west edge transfers (events 65-67), the pines (52-64) and the door event (1, "Drzwi dworu" - Story.js
# finds it by name and puts the Lord beside it) moved onto the new gate. RegionLayers' region 2 painted afterwards
# (tools/town/paint_layers.py --map 24).
import os, sys, json, copy, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
from nslib import write_map, floor_shape, wall_shape, B, C, D

W, H, TILESET = 40, 30, 11
GRASS, GRASS_L, DIRT, HEDGE, STONES, FLOWERS, COBBLE, DARK = 16, 27, 17, 20, 23, 28, 40, 46     # A2 kinds (nslib numbering)
ROOF, BAND, LEDGE, GROUND_FLOOR = 56, 98, 97, 105                                                # A3 / A4 kinds

def load(path):
    with open(path, "rb") as f:
        return json.loads(f.read().decode("utf-8"))

class Builder:
    def __init__(self):
        self.k = [dict() for _ in range(4)]     # (x, y) -> autotile kind, shapes by same-kind neighbours (ground)
        self.t = [dict() for _ in range(4)]     # (x, y) -> exact tile id (buildings, pictures)
        self.shadow = {}
        self.events = []                        # (event dict without id)
    def kind(self, z, cells, k):
        for c in cells:
            self.k[z][c] = k
            self.t[z].pop(c, None)
    def tile(self, z, x, y, tid):
        self.t[z][(x, y)] = tid
        self.k[z].pop((x, y), None)
    def part(self, z, x0, y0, x1, y1, kind, wall):
        """a rectangle of one building autotile, its own edges (the editor's shapes for a lone block)"""
        cells = {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
        for (x, y) in cells:
            same = lambda dx, dy, x=x, y=y: (x + dx, y + dy) in cells
            self.tile(z, x, y, 2048 + kind * 48 + (wall_shape(same) if wall else floor_shape(same)))
    def resolve(self):
        data = [0] * (W * H * 6)
        for z in range(4):
            for (x, y), k in self.k[z].items():
                def same(dx, dy, x=x, y=y, z=z, k=k):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < W and 0 <= ny < H): return True
                    return self.k[z].get((nx, ny)) == k
                data[(z * H + y) * W + x] = 2048 + k * 48 + floor_shape(same)
            for (x, y), tid in self.t[z].items():
                data[(z * H + y) * W + x] = tid
        for (x, y), v in self.shadow.items(): data[(4 * H + y) * W + x] = v
        return data

def page(image=None, priority=1, trigger=0, through=False, step=False, dfix=True, lst=None, speed=3, freq=3):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": dfix, "image": image or pic(""), "list": (lst or []) + [{"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": freq, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": speed, "moveType": 0, "priorityType": priority, "stepAnime": step, "through": through, "trigger": trigger, "walkAnime": False}

def pic(name, index=0, direction=2, pattern=0, tile=0):
    return {"tileId": tile, "characterName": name, "direction": direction, "pattern": pattern, "characterIndex": index}

def rect(x0, y0, x1, y1):
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]

def build():
    b = Builder()
    ev = lambda name, x, y, pages, note="": b.events.append({"name": name, "note": note, "pages": pages, "x": x, "y": y})

    # ---------------------------------------------------------------- ground
    b.kind(0, rect(0, 0, W - 1, H - 1), GRASS)
    for (x, y) in rect(0, 0, W - 1, H - 1):                       # lighter grass in soft patches
        if ((x * 7 + y * 13) % 11 == 0) or ((x * 3 + y * 5) % 17 == 0): b.k[0][(x, y)] = GRASS_L
    # the road from the west gate (rows 14-16) into the forecourt; the forecourt and the garden's middle walk
    road = rect(0, 14, 9, 16)
    court = rect(8, 13, 32, 18)
    walk = rect(19, 19, 21, 22)
    plaza = [(x, y) for (x, y) in rect(16, 22, 24, 27) if ((x - 20) / 4.4) ** 2 + ((y - 24.5) / 2.6) ** 2 <= 1]
    b.kind(0, road + court + walk + plaza, COBBLE)
    for (x, y) in [(8, 18), (32, 18), (9, 13), (8, 13), (32, 13), (31, 13)]: b.k[0][(x, y)] = GRASS   # (rounded corners)
    # moss and stones along the building's foot, darker grass under the hedges
    b.kind(1, rect(10, 13, 30, 13), STONES)

    # ---------------------------------------------------------------- the manor
    pf = load(ROOT + "tools/town/prefabs/twierdza_front.json")
    MX, MY = 17, 4                                   # the prefab's (0,0) on the map: its rows 1..8 -> 5..12, row 9 -> 13
    for py in range(1, 9):
        for px in range(7):
            b.tile(0, MX + px, MY + py, pf["layers"][0][py][px])
    for z in (2, 3):
        for py in range(1, 10):
            for px in range(7):
                t = pf["layers"][z][py][px]
                if t: b.tile(z, MX + px, MY + py, t)
    b.part(0, 17, 1, 23, 4, ROOF, True)              # the middle's full red roof
    for (x0, x1) in ((12, 16), (24, 28)):            # the wings
        b.part(0, x0, 4, x1, 7, ROOF, True)
        b.part(0, x0, 8, x1, 9, BAND, False)
        b.part(0, x0, 10, x1, 10, LEDGE, False)
        b.part(0, x0, 11, x1, 12, GROUND_FLOOR, True)
        for x in (x0 + 1, x0 + 3):                   # lit gothic windows upstairs, arched ones below with flower boxes
            b.tile(3, x, 8, B(1, 4)); b.tile(2, x, 9, B(1, 5))
            b.tile(3, x, 11, B(5, 4)); b.tile(2, x, 12, B(5, 5)); b.tile(3, x, 12, B(0, 1) if x0 == 12 else B(7, 1))
        b.tile(3, x0 + 2, 11, 0)
    for y in range(4, 8): b.shadow[(24, y)] = 5       # the right wing's roof in the middle's shadow
    for y in range(8, 13): b.shadow[(24, y)] = 5
    # chimneys (two cells on the roof) and their smoke
    for (x, y) in ((18, 1), (22, 1), (13, 4), (27, 4)):
        b.tile(3, x, y, B(2, 10)); b.tile(3, x, y + 1, B(2, 11))
        ev("Dym z komina", x, y, [page(pic("!Fantasy_chimney", 0, 2, 0), priority=2, step=True, through=True, speed=3, freq=3)])
    # dormers in the roofs (the town hall's)
    for (x, y) in ((19, 3), (21, 3), (14, 6), (26, 6)):
        ev("Lukarna", x, y, [page(pic("!Roof_Windows", 1, 2, 0), priority=1)])
    # the towers at the ends with their helms (as on the author's castle gate)
    for (tx, hd, hp) in ((10, 2, 1), (29, 2, 1)):        # (both the author's blue helm: direction 4 pattern 0 is a bell roof)
        b.kind(0, rect(tx, 7, tx + 1, 13), COBBLE)
        for r in range(7):
            b.tile(3, tx, 7 + r, B(13, r)); b.tile(3, tx + 1, 7 + r, B(14, r))
        ev("Hełm baszty", tx + 1, 9, [page(pic("!$Big_Decoration", 0, hd, hp), priority=2)])
    # the prefab's own events: banners, knights (the gate becomes the door below)
    for e in pf["events"]:
        p0 = e["pages"][0]
        name = p0["image"]["characterName"]
        if name in ("!Flags_banner", "!Statue"):
            ev("Chorągiew Lorda" if name == "!Flags_banner" else "Posąg rycerza", MX + e["x"], MY + e["y"], copy.deepcopy(e["pages"]))
    for x in (14, 26):                                # the Lord's banners on the wings, wall lanterns below them
        ev("Chorągiew Lorda", x, 9, [page(pic("!Flags_banner", 0, 4, 1), priority=1)])
        ev("Latarnia na ścianie", x, 12, [page(pic("!Decoration", 7, 2, 0), priority=2)], note="<Light:150,90,62,24><LightWhen:night>")

    # ---------------------------------------------------------------- the forecourt
    kp = load(ROOT + "tools/town/prefabs/kosze_zarowe.json")
    pillar = next(e for e in kp["events"] if e["pages"][0]["image"]["tileId"] == C(0, 1))
    flame = next(e for e in kp["events"] if e["pages"][0]["image"]["characterName"] == "!Decoration" and e["pages"][0]["image"]["characterIndex"] == 0)
    for x in (16, 24):
        b.tile(3, x, 14, C(0, 0)); b.tile(3, x, 16, C(0, 2))   # (the basket on top, the pillar's middle is the event, its foot below)
        ev("Kosz żarowy (słup)", x, 15, copy.deepcopy(pillar["pages"]))
        ev("Kosz żarowy (ogień)", x, 14, copy.deepcopy(flame["pages"]), note="<Light:200,120,60,16><LightFlicker:0.15>")
    for (x, y) in ((11, 15), (29, 15)):               # potted trees by the wings
        b.tile(3, x, y, C(7, 1)); b.tile(3, x, y - 1, C(7, 0))
    # the road's lamps
    for x in (3, 7):
        for y in (13, 17):
            ev("Latarnia", x, y, [page(pic("!lamp", 0, 2, 0), priority=1)], note="<Light:170,90,60,22><LightWhen:night>")

    # ---------------------------------------------------------------- the garden in the south
    for (x0, y0, x1, y1) in ((11, 20, 17, 22), (23, 20, 29, 22), (11, 25, 16, 27), (24, 25, 29, 27)):
        ring = [(x, y) for (x, y) in rect(x0, y0, x1, y1) if x in (x0, x1) or y in (y0, y1)]
        b.kind(1, ring, HEDGE)
        b.kind(1, rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1), FLOWERS)
    ev("Posąg rycerza", 20, 24, [page(pic("!Statue", 0, 2, 2), priority=1)])
    for (x, y) in ((17, 23), (22, 23)):               # benches by the plaza: C(10..11, 0..1), the seat over the legs
        b.tile(3, x, y, C(10, 0)); b.tile(3, x + 1, y, C(11, 0))
        b.tile(2, x, y + 1, C(10, 1)); b.tile(2, x + 1, y + 1, C(11, 1))
    # !$Big_Trees_green: direction 4 pattern 2 a big round tree, direction 2 pattern 2 a tall pine, direction 8 pattern 2 in blossom
    TREES = {"round": (4, 2), "pine": (2, 2), "blossom": (8, 2)}
    for (x, y, t) in ((9, 21, "round"), (31, 21, "round"), (9, 27, "blossom"), (31, 27, "blossom"), (13, 1, "round"), (27, 1, "round"),
                      (35, 6, "pine"), (35, 14, "pine"), (36, 23, "pine"), (37, 10, "round"), (34, 19, "blossom"), (37, 27, "round"),
                      (8, 4, "round"), (8, 9, "pine")):
        d_, p_ = TREES[t]
        ev("Drzewo w ogrodzie Lorda", x, y, [page(pic("!$Big_Trees_green", 0, d_, p_), priority=1)])
    for y in (19, 21):                                # clipped cypresses along the garden walk: C(5,0) over C(5,1)
        for x in (18, 22):
            b.tile(3, x, y, C(5, 0)); b.tile(2, x, y + 1, C(5, 1))
    # D tufts of flowers and ferns along the walls and hedges
    # (D(8..15,7..8) and (12..15,9..12): flowers, lilies, ferns; D(8..11,9..12) are holes and slopes of the ground - not those)
    for (x, y, c, r) in ((12, 13, 9, 8), (15, 13, 10, 8), (25, 13, 9, 8), (28, 13, 10, 8), (8, 19, 13, 10), (32, 19, 12, 11), (6, 24, 14, 8), (34, 26, 12, 10),
                         (33, 3, 9, 8), (38, 8, 13, 11), (33, 12, 14, 11), (38, 16, 8, 7), (33, 24, 12, 9), (7, 2, 11, 7), (7, 11, 12, 8), (8, 25, 13, 12)):
        b.tile(2, x, y, D(c, r))

    # ---------------------------------------------------------------- the hedge round the estate (the road's gap in the west)
    border = [(x, 0) for x in range(5, W)] + [(x, H - 1) for x in range(5, W)] + [(W - 1, y) for y in range(H)] + \
             [(5, y) for y in range(H) if not 12 <= y <= 18]
    b.kind(1, border, HEDGE)
    return b

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=ROOT + "data/Map024.json")
    a = ap.parse_args()
    old = load(ROOT + "data/Map024.json")
    if old["tilesetId"] != 9 or not any(e and e["pages"][0]["image"]["characterName"] == "!$Manor_Lord" for e in old["events"]):
        if a.out.endswith("data/Map024.json"):
            sys.exit("Map024 is not the old picture manor any more (built already?) - nothing done")
    b = build()
    data = b.resolve()
    # events: the kept ones with their ids (the door moved onto the gate), the new ones after them
    keep = {1} | set(range(52, 68))
    events = [None] * 68
    for e in old["events"]:
        if e and e["id"] in keep: events[e["id"]] = copy.deepcopy(e)
    door = events[1]
    door["x"], door["y"] = 20, 12
    for p in door["pages"]:
        p["image"] = pic("!$Gate_Cathedral1", 0, 2, 0)
        p["priorityType"] = 1
    for e in b.events:
        e = dict(e)
        e["id"] = len(events)
        events.append({"id": e["id"], "name": e["name"], "note": e["note"], "pages": e["pages"], "x": e["x"], "y": e["y"]})
    props = {k: v for k, v in old.items() if k not in ("data", "events")}
    props["tilesetId"] = TILESET
    write_map(a.out, props, data, events)
    print("Map024: manor built (%d events, tileset %d) -> %s" % (sum(1 for e in events if e), TILESET, a.out))

if __name__ == "__main__":
    main()
