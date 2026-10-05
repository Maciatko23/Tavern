# python tools/tavern/v2/build_v2.py [room]  -> tools/tavern/v2/staging/Map001.json (+ out/v2_full.png, out/v2_small.png,
#                                              out/room_<key>.png for every room)
# The ground floor of the tavern, second build: v2layout.py's rooms, then each room furnished by its own function.
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from v2lib import *
from kit import Kit, P, ITEM, lamp
import v2layout as LY
import render2

STAGED = os.path.join(HERE, "staging", "Map001.json")
SRC = {e["id"]: e for e in load_json(BASE)["events"] if e}

def shell(m):
    for (key, name, (x0, y0, x1, y1), fk, wk, wh, kind) in LY.ROOMS:
        m.room(name, x0, y0, x1, y1, fk, wk, wall_h=wh, key=key)
    for (x0, y0, x1, y1, fk) in LY.OPENINGS:
        m.opening(x0, y0, x1, y1, fk)

import rooms_v2 as RM

def kept(m):
    """the vestibule's events (ids, places and pages as they are) and the four 'Atmosfera' parallel events"""
    for e in SRC.values():
        if in_keep(e["x"], e["y"]):
            m.keep_event(e, e["x"], e["y"], eid=e["id"])
    for eid in (5, 6, 7, 8):          # (parallel, no picture: in the dark column at the left, below the cut)
        m.keep_event(SRC[eid], 0, LY.DY + eid - 4, eid=eid)

ROOM_FUNCS = [("sala", RM.great_hall), ("biesiadna", RM.feast_hall), ("mysliwski", RM.hunters), ("scena", RM.stage_hall),
              ("gry", RM.games), ("laznia", RM.bath), ("jadalnia", RM.dining), ("palarnia", RM.reading), ("rzutki", RM.darts),
              ("korytarz", RM.corridor), ("kuchnia", RM.kitchen), ("piekarnia", RM.bakery), ("spizarnia", RM.pantry),
              ("wedzarnia", RM.smokehouse), ("browar", RM.brewery), ("sluzba", RM.staff), ("gabinet", RM.office),
              ("komorka", RM.old_stones), ("sklad", RM.storeroom), ("magazyn", RM.warehouse)]

# pieces whose own passage flags are not what they look like: the pot of a plant lets the hero through (its leaves above
# do not), a 1-cell crate or woodpile drawn over two cells closes both. Regions (RegionLayers.js) put that right cell by
# cell: 2 = blocked, 3 = drawn over the hero and walkable
POT_OPEN = {"plant", "plant_pink", "plant_flowers"}
TOP_OVER = {"plant", "plant_pink", "plant_flowers", "crate", "crate_cloth", "woodpile", "broken_crate"}
def fix_regions(m):
    floor = lambda x, y: (m.kind_at(0, x, y) or 0) >= 80 and ((m.kind_at(0, x, y) - 80) // 8) % 2 == 0
    for (name, x, y) in m.things:
        if name in POT_OPEN and floor(x, y):
            m.region.setdefault((x, y), 2)
        if name in TOP_OVER and floor(x, y - 1):
            m.region.setdefault((x, y - 1), 3)

# soft fill lights (links.json "fill", <LightSoft>) where the evening would leave a dark hole between the lamps: a grid over
# each room, a fill wherever no lamp is within reach; none in the storerooms and the old stones (dim on purpose)
NO_FILL = {"sklad", "magazyn", "komorka", "wedzarnia"}
def fill_lights(m, step=5, reach=3.5):
    import math
    lamps = [(e["x"], e["y"]) for e in m.events if "<Light:" in (e.get("note") or "")]
    n = 0
    for (key, name, (x0, y0, x1, y1), fk, wk, wh, kind) in LY.ROOMS:
        if key in NO_FILL: continue
        xs = list(range(x0 + 2, x1 - 1, step)) or [(x0 + x1) // 2]
        ys = list(range(y0 + 2, y1 - 1, step)) or [(y0 + y1) // 2]
        for y in ys:
            for x in xs:
                if all(math.hypot(x - a, y - b) > reach for (a, b) in lamps):
                    m.light(x, y, lamp("fill"), "wypelnienie"); lamps.append((x, y)); n += 1
    return n

def build(only=None):
    m = Map2()
    shell(m)
    k = Kit(m)
    kept(m)
    for key, fn in ROOM_FUNCS:
        fn(m, k)
    fix_regions(m)
    print("fill lights:", fill_lights(m))
    return m

ROOM_BOX = {r[0]: (r[2][0] - 1, r[2][1] - r[5] - 1, r[2][2] + 1, r[2][3] + 1) for r in LY.ROOMS}

def check(m, mp):
    """walk the staged map like the game: what the landing reaches, pockets of open floor nobody reaches, hooks"""
    data = mp["data"]
    solid = set(m.solid_events)
    seen = reach(data, solid, (50, 82))
    out = []
    for (key, name, (x0, y0, x1, y1), fk, wk, wh, kind) in LY.ROOMS:
        cells = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
        open_ = [c for c in cells if all(passable_dirs(data, *c).values()) and c not in solid]
        got = [c for c in cells if c in seen]
        lost = [c for c in open_ if c not in seen]
        out.append("%-10s reach %3d/%3d open-unreached %d %s" % (key, len(got), len(cells), len(lost), lost[:6]))
    return seen, out

PACK_CHARS = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/characters/"
OVERLAY = os.path.join(HERE, "overlay")
def make_overlay(mp):
    """tools/tavern/v2/overlay: the staged Map001 and the author's character sheets it uses that img/characters lacks
    (tests/cdp.js serves it over the game's files with GAME_OVERLAY)"""
    import shutil
    os.makedirs(os.path.join(OVERLAY, "data"), exist_ok=True)
    os.makedirs(os.path.join(OVERLAY, "img", "characters"), exist_ok=True)
    shutil.copyfile(STAGED, os.path.join(OVERLAY, "data", "Map001.json"))
    need = set()
    for e in mp["events"]:
        if not e: continue
        for pg in e["pages"]:
            n = pg["image"]["characterName"]
            if n and not os.path.exists(ROOT + "img/characters/" + n + ".png"): need.add(n)
    copied = []
    for n in sorted(need):
        src = PACK_CHARS + n + ".png"
        if os.path.exists(src):
            shutil.copyfile(src, os.path.join(OVERLAY, "img", "characters", n + ".png")); copied.append(n)
        else: print("MISSING character sheet", n)
    return copied

if __name__ == "__main__":
    m = build()
    des = m.design()
    bad = m.check_keep_edges(des["data"])
    print("vestibule edge mismatches:", bad[:20], len(bad))
    seen, rep = check(m, des)
    print(chr(10).join(rep))
    mp = m.write(STAGED, crop=LY.DY)
    print("map %dx%d (the top %d empty rows cut), %d events" % (mp["props"]["width"], mp["props"]["height"], LY.DY, len([e for e in mp["events"] if e])))
    print("overlay sheets:", make_overlay(mp))
    full = {**mp["props"], "data": mp["data"], "events": mp["events"]}
    im = render2.render(full)
    im.save(os.path.join(HERE, "out", "v2_full.png"))
    im.resize((im.width // 4, im.height // 4)).save(os.path.join(HERE, "out", "v2_small.png"))
    for key in (sys.argv[1:] or []):
        x0, y0, x1, y1 = ROOM_BOX[key] if key in ROOM_BOX else (36, 52, 64, 83)
        y0, y1 = y0 - LY.DY, y1 - LY.DY
        im.crop((x0 * 48, y0 * 48, (x1 + 1) * 48, (y1 + 1) * 48)).save(os.path.join(HERE, "out", "room_%s.png" % key))
