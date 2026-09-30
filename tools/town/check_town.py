# python check_town.py [A] [B] [C]  -> prints every problem of the staged town maps, exit code 1 if any (the build must pass)
# Reads tools/town/staging/Map008_<X>.json (+ _meta.json) and checks it against the game's own rules (the passability of
# tools/tavern/engine.py: tile flags of tileset 9 + events "same as characters" + ChoppableTree's <Occupy> / solid pictures):
#   1 links     - ids 1..6 are today's six edge transfers (same commands) on the new bottom / right edges, id 7 is the tavern
#                 door with its transfer to Map001 50,82; the links of Map001 / Map022 / Map024 land on free, reachable cells
#   2 drought   - no water tile anywhere (A1, the A2 pond / puddle kinds)
#   3 solid     - every tile that looks solid (roofs, walls, fences, fortress pieces) is closed
#   4 invisible - every closed cell shows something solid there: a solid tile, or the picture of the event that closes it
#   5 reach     - from the south exit on foot: the east exit, the tavern door, every building's door, every stall, the well,
#                 every NPC spot (the spot itself free, a neighbour reachable); nothing closes an exit tile
#   6 program   - 15..20 buildings, 8+ of them (besides the tavern) with an interior; each building has its door event
#   7 people    - no event uses the RTP People / Actor sheets (the town's people come later as PixelLab characters)
#   8 pictures  - every picture of a known size closes exactly its drawn footprint (the !Town_Props / !Tavern_Yard things,
#                 the smithy's open forge, the big gates): no walking through a stall, a tent or the forge
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "tavern"))
sys.path.insert(0, os.path.join(HERE, "..", "newstart"))
sys.path.insert(0, HERE)
from engine import Engine, active_page, occupy_cells
from nslib import EXTRA
from townlib import tile_solid, tile_water, FLAGS9, load_json, ROOT, STAGING, TILESETS
import build_town_props as TP
import build_tavern_props as TY

# the footprint every known picture must close (None: it lies below the hero, walkable)
EXPECT = {}
for _i, (_n, _s, _w, _h, _o) in enumerate(TP.PROPS): EXPECT[(TP.SHEET,) + TP.image_of(_i)] = (_n, _o)
for _i, (_n, _s, _w, _h, _o) in enumerate(TY.PROPS): EXPECT[(TY.SHEET,) + TY.image_of(_i)] = (_n, _o)
BIG = {"!$Smith": {"left": 1, "right": 1, "up": 3}, "!$Gate_Wood1": {"left": 1, "right": 1},
       "!$Gate_Cathedral1": {"left": 1, "right": 1}, "!$Gate_Stone1": {"left": 1, "right": 1}}

def analyse(concept):
    """the facts check_town and render_town share: blocked cells (and by what), solid tiles, reachable cells"""
    mp = load_json(os.path.join(STAGING, "Map008_%s.json" % concept))
    meta = load_json(os.path.join(STAGING, "Map008_%s_meta.json" % concept))
    W, H, data = mp["width"], mp["height"], mp["data"]
    events = [e for e in mp["events"] if e]
    eng = Engine(W, H, data, FLAGS9, mp["events"])
    by = {}                       # cell -> (event id, event name, has picture)
    for e in events:
        pg = active_page(e)
        if not pg or pg["priorityType"] != 1 or pg["through"]: continue
        pic = pg["image"]["characterName"] or pg["image"]["tileId"]
        cells = occupy_cells(e["x"], e["y"], e.get("note")) + [(e["x"] + a, e["y"] + b) for a, b in EXTRA.get(pg["image"]["characterName"], [])]
        for c in cells:
            eng.block.add(c)
            by.setdefault(c, (e["id"], e["name"], bool(pic)))
    solid, flagged, water = set(), set(), set()
    for y in range(H):
        for x in range(W):
            ts = [data[(z * H + y) * W + x] for z in range(4)]
            if any(tile_solid(t) for t in ts): solid.add((x, y))
            if any(tile_water(t) for t in ts): water.add((x, y))
            if not eng.tile_open(x, y): flagged.add((x, y))
    sx = meta["south_exits"][1]
    start = (sx, H - 2)
    reach = eng.reach([start])
    return {"map": mp, "meta": meta, "eng": eng, "by": by, "solid": solid, "flagged": flagged, "water": water,
            "reach": reach, "start": start, "W": W, "H": H, "events": events}

def check(concept):
    A = analyse(concept)
    mp, meta, eng, by, solid, reach = A["map"], A["meta"], A["eng"], A["by"], A["solid"], A["reach"]
    W, H = A["W"], A["H"]
    base = load_json(ROOT + "data/Map008.json")
    probs = []
    ok = lambda cond, text: cond or probs.append(text)
    ev = {e["id"]: e for e in A["events"]}
    # ---- 1 links
    for i in range(1, 7):
        e, b = ev.get(i), base["events"][i]
        tr = lambda e: [c["parameters"] for c in e["pages"][0]["list"] if c["code"] == 201]
        ok(e and tr(e) == tr(b) and e["name"] == b["name"], "event %d is not today's transfer '%s'" % (i, b["name"]))
        if e:
            edge = (e["y"] == H - 1) if i <= 3 else (e["x"] == W - 1)
            ok(edge, "transfer %d is not on its edge (%d,%d)" % (i, e["x"], e["y"]))
            ok((e["x"], e["y"]) not in eng.block, "exit tile (%d,%d) is closed" % (e["x"], e["y"]))
    door = ev.get(7)
    ok(door and door["name"] == base["events"][7]["name"] and door["pages"] == base["events"][7]["pages"] and door["note"] == base["events"][7]["note"],
       "event 7 is not today's tavern door (pages / note must stay as they are)")
    for L in meta["links"]:
        tx, ty = L["new"][2], L["new"][3]
        ok((tx, ty) in reach, "link Map%03d event %d lands on (%d,%d): not reachable / closed" % (L["map"], L["event"], tx, ty))
    # ---- 2 drought
    ok(not A["water"], "water tiles at %s" % sorted(A["water"])[:10])
    # ---- 3 solid tiles closed
    open_solid = sorted(c for c in solid if c not in eng.block and c not in A["flagged"])
    ok(not open_solid, "%d solid-looking cells can be walked through: %s" % (len(open_solid), open_solid[:12]))
    # ---- 4 nothing invisible closes a cell
    ghosts = sorted(c for c, (eid, name, pic) in by.items() if not pic and c not in solid)
    ok(not ghosts, "%d invisible blocks over nothing solid: %s" % (len(ghosts), [(c, by[c][1]) for c in ghosts[:10]]))
    outside = sorted(c for c in eng.block if not (0 <= c[0] < W and 0 <= c[1] < H))
    ok(not outside, "blocks outside the map: %s" % outside[:5])
    # ---- 5 reach
    ex = meta["east_exits"][1]
    ok((W - 2, ex) in reach, "the east exit (Posiadłość Lorda) cannot be reached from the south exit")
    dx, dy = meta["door"]
    ok((dx, dy + 1) in reach, "the tavern door's front (%d,%d) cannot be reached" % (dx, dy + 1))
    for b in meta["buildings"]:
        fx, fy = b["front"]
        ok((fx, fy) in reach, "%s: its door's front (%d,%d) cannot be reached" % (b["name"], fx, fy))
        if b["key"] != "tawerna":
            de = [e for e in A["events"] if "<Town:door=%s>" % b["key"] in (e.get("note") or "")]
            ok(len(de) == 1 and (de[0]["x"], de[0]["y"]) == tuple(b["door"]), "%s: no door event at %s" % (b["name"], b["door"]))
    for e in A["events"]:
        pic = e["pages"][0]["image"]["characterName"]
        if pic == "!Town_Props" and e["pages"][0]["priorityType"] == 1 and re.search(r"stall|Stragan|Beczki z wodą|studnia", e["name"], re.I):
            ok((e["x"], e["y"] + 1) in reach, "%s (%d,%d): its front cannot be reached" % (e["name"], e["x"], e["y"]))
    for key, x, y, d in meta["npcs"]:
        ok((x, y) not in eng.block and eng.tile_open(x, y), "NPC spot %s (%d,%d) is closed" % (key, x, y))
        near = [(x + a, y + b) for a, b in ((0, 1), (0, -1), (1, 0), (-1, 0))]
        ok((x, y) in reach or any(n in reach for n in near), "NPC spot %s (%d,%d): no reachable cell beside it" % (key, x, y))
    # ---- 6 program
    nb = len(meta["buildings"])
    ok(15 <= nb <= 20, "%d buildings (want 15..20)" % nb)
    ni = sum(1 for b in meta["buildings"] if b["interior"] and b["key"] != "tawerna")
    ok(ni >= 8, "%d buildings with an interior besides the tavern (want 8+)" % ni)
    # ---- 7 people
    rtp = [e["name"] for e in A["events"] for pg in e["pages"] if re.match(r"^(People|Actor|SF_|\$?People|Evil)", pg["image"]["characterName"] or "")]
    ok(not rtp, "RTP people sheets used: %s" % rtp[:5])
    # ---- 8 pictures close their drawn footprint
    for e in A["events"]:
        pg = active_page(e)
        if not pg: continue
        im = pg["image"]
        key = (im["characterName"], im["characterIndex"], im["direction"], im["pattern"])
        closes = pg["priorityType"] == 1 and not pg["through"]
        got = set(occupy_cells(e["x"], e["y"], e.get("note"))) if closes else set()
        if key in EXPECT:
            name, o = EXPECT[key]
        elif im["characterName"] in BIG:
            name, o = im["characterName"], BIG[im["characterName"]]
        else:
            continue
        want = set() if o is None else {(e["x"] + a, e["y"] + b) for b in range(-o.get("up", 0), o.get("down", 0) + 1) for a in range(-o.get("left", 0), o.get("right", 0) + 1)}
        ok(got == want, "%s '%s' (%d,%d) closes %d cells, its picture covers %d" % (name, e["name"], e["x"], e["y"], len(got), len(want)))
    return probs, A

def main():
    which = [a for a in sys.argv[1:] if len(a) == 1] or ["A", "B", "C"]
    bad = 0
    for c in which:
        if not os.path.exists(os.path.join(STAGING, "Map008_%s.json" % c)):
            print("Map008_%s: not built" % c); bad += 1; continue
        probs, A = check(c)
        blocked = len(A["eng"].block)
        print("Map008_%s: %dx%d, %d events, %d closed cells, %d solid tiles, %d reachable cells - %s" % (
            c, A["W"], A["H"], len(A["events"]), blocked, len(A["solid"]), len(A["reach"]), "OK" if not probs else "%d PROBLEMS" % len(probs)))
        for p in probs: print("   -", p)
        bad += len(probs)
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
