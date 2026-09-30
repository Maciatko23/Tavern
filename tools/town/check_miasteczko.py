# python check_miasteczko.py  -> prints every problem of tools/town/staging/Map008_C2.json, exit code 1 if any
# The town of prefabs on the town tileset 11 (the author's flags), checked with the game's own walking rules
# (tools/tavern/engine.py: tile flags + events "same as characters" + <Occupy>):
#   1 links     - ids 1..6 are today's six edge transfers (same commands) on the new bottom / right edges, id 7 the tavern door
#                 with today's pages; where Map001 / Map022 / Map024 land is free and reachable
#   2 drought   - no water tile (A1, the A2 pond looks 44 / 45)
#   3 solid     - no cell that looks solid (roofs, walls, gables, fortress pieces, rock faces) can be reached on foot
#   4 invisible - every cell an event without a picture closes shows something there: a solid-looking tile, a tile the
#                 author's flags close, a drawn thing of the B..E sheets, or the picture of another event drawn over it
#   5 reach     - from the south gate: the east gate, the tavern door, every building's door, every stall and the well,
#                 every NPC spot (the spot free, a neighbour reachable)
#   6 program   - 15..20 buildings, 8+ of them (besides the tavern) with an interior, each with its door event
#   7 people    - no RTP People / Actor sheets
#   8 walls     - every cell of the map's edge is closed, except the gates' exit cells
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "tavern"))
import mzrender as R
from engine import Engine, active_page, occupy_cells
from townlib import load_json, ROOT, STAGING

TS = os.path.join(STAGING, "Tilesets_town.json")
SLOT = 11
T = 48

def solid_look(t, fl):
    if t <= 0: return False
    if t >= 2048:
        k = (t - 2048) // 48
        return 48 <= k < 128 or k in (20, 22, 30, 38)          # roofs, walls, hedges, fences
    if 1536 <= t < 2048:
        r = (t - 1536) // 8
        return r in (9, 10, 14, 15)                             # rock faces
    star = (fl[t] & 0x10) != 0 if t < len(fl) else False
    if t < 256:                                                 # B: fortress pieces that are not drawn over the hero
        col, row = t % 8 + (8 if t >= 128 else 0), (t % 128) // 8
        return col >= 8 and row <= 8 and not star and not (col <= 10 and row in (7, 8))
    if 768 <= t < 1024:                                         # E: gables and gable walls
        tt = t - 768
        col, row = tt % 8 + (8 if tt >= 128 else 0), (tt % 128) // 8
        return col >= 8 or (4 <= col <= 7 and 9 <= row <= 11)
    return False

def picture_cells(mp, S):
    """cells covered (>= 25% opaque pixels) by each event's picture"""
    cover = {}
    for e in mp["events"]:
        if not e: continue
        pg = R.first_page(e)
        if not pg: continue
        im = pg["image"]
        if not im["characterName"]: continue
        fr = S.frame(im["characterName"], im["characterIndex"], im["direction"], im["pattern"])
        if fr is None: continue
        shift = 0 if im["characterName"].startswith("!") else 6
        x0 = e["x"] * T + T // 2 - fr.width // 2
        y0 = e["y"] * T + T - shift - fr.height
        a = fr.getchannel("A")
        for cy in range((y0) // T, (y0 + fr.height - 1) // T + 1):
            for cx in range((x0) // T, (x0 + fr.width - 1) // T + 1):
                box = (cx * T - x0, cy * T - y0, cx * T - x0 + T, cy * T - y0 + T)
                crop = a.crop(box)
                n = sum(crop.histogram()[64:])
                if n >= T * T * 0.25: cover.setdefault((cx, cy), []).append(e["id"])
    return cover

def analyse(concept="C2"):
    mp = load_json(os.path.join(STAGING, "Map008_%s.json" % concept))
    meta = load_json(os.path.join(STAGING, "Map008_%s_meta.json" % concept))
    fl = load_json(TS)[SLOT]["flags"]
    W, H, data = mp["width"], mp["height"], mp["data"]
    events = [e for e in mp["events"] if e]
    eng = Engine(W, H, data, fl, mp["events"])
    by = {}
    for e in events:
        pg = active_page(e)
        if not pg or pg["priorityType"] != 1 or pg["through"]: continue
        pic = bool(pg["image"]["characterName"] or pg["image"]["tileId"])
        for c in occupy_cells(e["x"], e["y"], e.get("note")):
            by.setdefault(c, (e["id"], e["name"], pic))
    solid, flagged, water, star = set(), set(), set(), set()
    for y in range(H):
        for x in range(W):
            ts = [data[(z * H + y) * W + x] for z in range(4)]
            if any(solid_look(t, fl) for t in ts): solid.add((x, y))
            if any(t >= 2048 and ((t - 2048) // 48 < 16 or (t - 2048) // 48 in (44, 45)) for t in ts): water.add((x, y))
            if not eng.tile_open(x, y): flagged.add((x, y))
            if any(0 < t < 1024 for t in ts[1:]): star.add((x, y))      # a drawn thing of the B..E sheets
    start = (meta["south_exits"][1], H - 2)
    reach = eng.reach([start])
    return {"map": mp, "meta": meta, "eng": eng, "by": by, "solid": solid, "flagged": flagged, "water": water, "star": star,
            "reach": reach, "start": start, "W": W, "H": H, "events": events, "flags": fl}

def check(concept="C2"):
    A = analyse(concept)
    mp, meta, eng, by, reach = A["map"], A["meta"], A["eng"], A["by"], A["reach"]
    W, H = A["W"], A["H"]
    base = load_json(ROOT + "data/Map008.json")
    probs = []
    ok = lambda cond, text: cond or probs.append(text)
    ev = {e["id"]: e for e in A["events"]}
    tr = lambda e: [c["parameters"] for c in e["pages"][0]["list"] if c["code"] == 201]
    # 1 links
    for i in range(1, 7):
        e, b = ev.get(i), base["events"][i]
        ok(e and tr(e) == tr(b) and e["name"] == b["name"], "event %d is not today's transfer '%s'" % (i, b["name"]))
        if e:
            ok((e["y"] == H - 1) if i <= 3 else (e["x"] == W - 1), "transfer %d is not on its edge" % i)
            ok((e["x"], e["y"]) not in eng.block and eng.tile_open(e["x"], e["y"]), "exit tile (%d,%d) is closed" % (e["x"], e["y"]))
    door = ev.get(7)
    ok(door and door["pages"] == base["events"][7]["pages"] and door["note"] == base["events"][7]["note"], "event 7 is not today's tavern door")
    for L in meta["links"]:
        ok((L["new"][2], L["new"][3]) in reach, "link Map%03d event %d lands on (%d,%d): not reachable" % (L["map"], L["event"], L["new"][2], L["new"][3]))
    # 2 drought
    ok(not A["water"], "water tiles at %s" % sorted(A["water"])[:10])
    # 3 nothing solid reachable
    bad = sorted(c for c in A["solid"] if c in reach)
    ok(not bad, "%d solid-looking cells reachable on foot: %s" % (len(bad), bad[:12]))
    # 4 invisible blocks over something visible
    cover = picture_cells(mp, R.Sheets(SLOT, TS))
    ghosts = []
    for c, (eid, name, pic) in by.items():
        if pic: continue
        if c in A["solid"] or c in A["flagged"] or c in A["star"]: continue
        if any(i != eid for i in cover.get(c, [])): continue
        ghosts.append((c, name))
    ok(not ghosts, "%d invisible blocks over nothing: %s" % (len(ghosts), sorted(ghosts)[:10]))
    # 5 reach
    ok((W - 2, meta["east_exits"][1]) in reach, "the east gate cannot be reached from the south gate")
    dx, dy = meta["door"]
    ok((dx, dy + 1) in reach, "the tavern door's front (%d,%d) cannot be reached" % (dx, dy + 1))
    for b in meta["buildings"]:
        ok(b.get("door") is not None, "%s: no door" % b["name"])
        if not b.get("door"): continue
        ok(tuple(b["front"]) in reach, "%s: its door's front %s cannot be reached" % (b["name"], b["front"]))
        if b["key"] != "tawerna":
            de = [e for e in A["events"] if "<Town:door=%s>" % b["key"] in (e.get("note") or "")]
            ok(len(de) == 1 and [de[0]["x"], de[0]["y"]] == b["door"], "%s: no door event at %s" % (b["name"], b["door"]))
    for e in A["events"]:
        if re.search(r"Stragan|studnia", e["name"], re.I):
            ok((e["x"], e["y"] + 1) in reach, "%s (%d,%d): its front cannot be reached" % (e["name"], e["x"], e["y"]))
    for key, x, y, d in meta["npcs"]:
        ok((x, y) not in eng.block and eng.tile_open(x, y), "NPC spot %s (%d,%d) is closed" % (key, x, y))
        ok((x, y) in reach, "NPC spot %s (%d,%d) cannot be reached" % (key, x, y))
    # 6 program
    nb = len(meta["buildings"])
    ok(15 <= nb <= 20, "%d buildings (want 15..20)" % nb)
    ni = sum(1 for b in meta["buildings"] if b["interior"] and b["key"] != "tawerna")
    ok(ni >= 8, "%d buildings with an interior besides the tavern (want 8+)" % ni)
    # 7 people
    rtp = [e["name"] for e in A["events"] for pg in e["pages"] if re.match(r"^\$?(People|Actor|SF_|Evil)", pg["image"]["characterName"] or "")]
    ok(not rtp, "RTP people sheets used: %s" % rtp[:5])
    # 8 walls: the map's edge closed except the gates' exit cells
    exits = {(x, H - 1) for x in meta["south_exits"]} | {(W - 1, y) for y in meta["east_exits"]}
    edge = {(x, 0) for x in range(W)} | {(x, H - 1) for x in range(W)} | {(0, y) for y in range(H)} | {(W - 1, y) for y in range(H)}
    holes = sorted(c for c in edge - exits if c in reach)
    ok(not holes, "the town wall has %d walkable cells on the map's edge: %s" % (len(holes), holes[:10]))
    return probs, A

def main():
    probs, A = check()
    print("Map008_C2: %dx%d, %d events, %d closed cells, %d reachable cells - %s" % (
        A["W"], A["H"], len(A["events"]), len(A["eng"].block | A["flagged"]), len(A["reach"]), "OK" if not probs else "%d PROBLEMS" % len(probs)))
    for p in probs: print("   -", p)
    sys.exit(1 if probs else 0)

if __name__ == "__main__":
    main()
