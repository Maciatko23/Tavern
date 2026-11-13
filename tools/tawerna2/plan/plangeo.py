# The tavern's three floors as plan geometry, read from the real maps (data/Map001.json, Map025.json, Map026.json).
# Every cell is sorted into floor / wall face / wall / stairs / void by its tile; the builders' room tables
# (tools/tavern/parter_layout.py, upperlib.layout25/26) only give the rooms their names and are checked against the real
# floor (a room whose floor is not there any more fails loudly). A plan draws a wall as a line, so the 3/4 view's wall
# face above a room is room space in the plan: every wall is then one cell thick. Doors: the floor gaps through walls
# and the same-map door events (a door picture on a wall face that moves the hero through the wall).
# TAWERNA 2 copy (tools/tawerna2/plan): reads the STAGED maps (tools/tawerna2/staging/data/Map001|025|026.json) and has the new room tables.
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
T2 = os.path.abspath(os.path.join(HERE, ".."))
ROOT = os.path.abspath(os.path.join(T2, "..", ".."))
STAGE_DATA = os.path.join(T2, "staging", "data")
TAV = os.path.join(ROOT, "tools", "tavern")
sys.path.insert(0, TAV)

STAIR_A5 = {17, 33}      # the A5 step tiles (wooden stairs of Map001/025, marble of Map026)
VOID_A5 = {0}            # A5 black: the stairwells' dark and the Galeria's well

def load_map(mid):
    with open(os.path.join(STAGE_DATA, "Map%03d.json" % mid), "rb") as f:
        return json.loads(f.read().decode("utf-8"))

def classify(m):
    """(x, y) -> 'F' floor, 'W' wall face, 'B' wall top / border, 'S' stairs, 'V' void"""
    W, H, d = m["width"], m["height"], m["data"]
    out = {}
    for y in range(H):
        for x in range(W):
            v = d[y * W + x]
            if v >= 2048:
                k = (v - 2048) // 48
                if 80 <= k < 128: c = "F" if ((k - 80) // 8) % 2 == 0 else "W"
                elif 48 <= k < 80: c = "W"
                else: c = "B"
            elif 1536 <= v < 1664:
                a5 = v - 1536
                c = "S" if a5 in STAIR_A5 else "V" if a5 in VOID_A5 else "?"
            else:
                c = "B"
            out[(x, y)] = c
    # decorated A5 cells (hearths and stones in a wall face, bookshelves, the stage's boards): under a wall they are wall,
    # else floor (taken from the top down, so a column of them follows the wall above it)
    for (x, y) in sorted((c for c, k in out.items() if k == "?"), key=lambda c: (c[1], c[0])):
        out[(x, y)] = "W" if out.get((x, y - 1)) in ("W", "B") else "F"
    return out

def rect(x0, y0, x1, y1):
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}

# ------------------------------------------------------------------------------------------------ the rooms by floor
# kind: guest (open to the hero), service (the house's work rooms), private (staff, other guests, the reserved suites),
# hall (corridors and halls: bare parchment), stairs
class Room:
    def __init__(self, key, name, kind, rects, cut=(), label=None, sub=None, lx=None, ly=None, size=None, group=None):
        self.key, self.name, self.kind = key, name, kind
        self.rects, self.cut = list(rects), list(cut)
        self.label = label if label is not None else name
        self.sub = sub
        self.lx, self.ly, self.size = lx, ly, size
        self.group = group or key          # rooms of one suite share a group (one selection)
        self.floor, self.region = set(), set()
    def cells(self):
        c = set()
        for r in self.rects: c |= rect(*r)
        for r in self.cut: c -= rect(*r)
        return c

def fit(K, rect):
    """the bounding box of the real floor cells inside a layout rectangle (the layout rectangles of the new maps include the wall face)"""
    x0, y0, x1, y1 = rect
    cells = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if K.get((x, y)) == "F"]
    if not cells: return rect
    return (min(c[0] for c in cells), min(c[1] for c in cells), max(c[0] for c in cells), max(c[1] for c in cells))

def rooms001(K):
    # Tawerna 2 ground floor 63 x 55 (second method, tools/tawerna2/uklad.txt): the old hall block cut as it was (x-36); the top row of small
    # rooms; Borgar's room (key "jadalnia": the eavesdropping room of D42) is reached through the storeroom
    return [
        Room("sala", "Sala", "guest", [(1, 27, 27, 44), (0, 30, 0, 35), (28, 30, 28, 35), (0, 43, 0, 43)], label="Sala"),
        Room("scena", "Scena", "guest", [(29, 27, 47, 38)], label="Scena"),
        Room("gry", "Pokój gier", "guest", [(49, 27, 61, 38)], label="Pokój" + chr(10) + "gier"),
        Room("palarnia", "Palarnia", "guest", [(29, 43, 39, 53), (40, 46, 40, 48)], label="Palarnia"),
        Room("rzutki", "Sala rzutek", "guest", [(41, 43, 61, 53), (59, 39, 60, 42)], label="Sala" + chr(10) + "rzutek"),
        Room("sien", "Sień", "hall", [(1, 53, 27, 53), (5, 49, 23, 52), (12, 45, 16, 48)], label="Sień"),
        Room("korytarz", "Korytarz", "hall", [(1, 20, 48, 22), (13, 17, 15, 19), (23, 17, 23, 19), (32, 17, 32, 19), (42, 17, 42, 19)], label="Korytarz"),
        Room("kuchnia", "Kuchnia", "service", [(1, 4, 17, 16), (0, 9, 0, 14)], label="Kuchnia"),
        Room("piekarnia", "Piekarnia", "service", [(19, 4, 27, 16)], label="Piekarnia"),
        Room("spizarnia", "Spiżarnia", "service", [(29, 4, 35, 16)], label="Spiżarnia"),
        Room("sluzba", "Pokój służby", "private", [(37, 4, 47, 16)], label="Pokój" + chr(10) + "służby"),
        Room("magazyn", "Magazyn", "service", [(49, 14, 61, 22)], label="Magazyn"),
        Room("jadalnia", "Gabinet Borgara", "private", [(49, 4, 61, 10), (56, 11, 56, 13)], label="Gabinet" + chr(10) + "Borgara"),
    ]

def rooms025(K):
    # Tawerna 2, third layout (63 x 55): bands of rooms, two vertical halls (hall1, hall2), the stair hall at the bottom
    import json as _j
    L = _j.load(open(os.path.join(T2, "staging", "layout025.json"), encoding="utf-8"))
    out = []
    SPECIAL = {"hall1": [(11, 20, 17, 44), (12, 45, 16, 48)], "hall2": [(30, 20, 33, 48)], "nc": [(1, 16, 61, 19)],
               "sc": [(1, 53, 61, 53), (4, 49, 24, 52), (28, 49, 61, 52)]}
    NAMES = {"hall1": "Hall zachodni", "hall2": "Hall wschodni", "nc": "Korytarz północny", "sc": "Korytarz południowy"}
    for key, rect in L.items():
        if key in ("stairs_w", "stairs_e"): continue                # (the flights: stairs rooms from the step tiles)
        if key in SPECIAL:
            out.append(Room(key, NAMES[key], "hall", SPECIAL[key], label="Korytarz" if key in ("nc", "sc") else "Hall"))
            continue
        r = fit(K, tuple(rect))
        m = re.match(r"r(\d+)$", key)
        if m:
            w = r[2] - r[0] + 1
            sub = "1-os." if w <= 7 else "2-os." if w <= 9 else "rodzinny"
            out.append(Room(key, "Pokój %s" % m.group(1), "guest" if key in ("r1", "r2", "r3") else "private", [r], label=m.group(1), sub=sub))
            continue
        kind = {"chamber": "guest", "bath": "guest"}[key]
        name = {"chamber": "Komnata z kominkiem", "bath": "Łaźnia gości"}[key]
        out.append(Room(key, name, kind, [r], label={"chamber": "Komnata", "bath": "Łaźnia"}[key]))
    return out

def rooms026(K):
    import json as _j
    L = _j.load(open(os.path.join(T2, "staging", "layout026.json"), encoding="utf-8"))
    out = []
    SPECIAL = {"hall": [(11, 26, 17, 44), (12, 45, 16, 48), (1, 53, 27, 53), (5, 49, 23, 52)], "nc": [(1, 22, 61, 25)]}
    for key, rect in L.items():
        if key in ("stairs_w", "stairs_e"): continue
        if key in SPECIAL:
            out.append(Room(key, "Galeria apartamentów" if key == "nc" else "Hall", "hall", SPECIAL[key], label="Galeria" if key == "nc" else "Hall")); continue
        r = fit(K, tuple(rect))
        if key.startswith(("lord", "s4")):
            grp = "lord" if key.startswith("lord") else "s4"
            nm = "Apartament Lorda" if grp == "lord" else "Apartament Złoty"
            part = "sypialnia" if key.endswith("b") else ("salon" if key == "lorda" else "salonik")
            out.append(Room(key, nm, "guest" if grp == "s4" else "private", [r], label=nm.split(" ", 1)[1], sub=part, group=grp))
        elif key.startswith(("s2", "s3")):
            grp = key[:2]
            out.append(Room(key, "Apartament " + ("Błękitny" if grp == "s2" else "Zielony"), "private", [r], label=("Błękitny" if grp == "s2" else "Zielony"), sub="salonik" if key.endswith("a") else "sypialnia", group=grp))
        elif key.startswith("terrace"):
            if key == "terrace_b": r = (40, r[1], r[2], r[3])
            out.append(Room(key, "Taras", "hall", [r], label="Taras", group="terrace"))
        else:
            nm = {"lib": "Biblioteka", "salon": "Wielki salon"}[key]
            out.append(Room(key, nm, "private", [r], label=nm))
    return out

FLOORS = [
    {"map": 1, "name": "Parter", "title": "Parter", "rooms": rooms001, "axis": 14},
    {"map": 25, "name": "Pokoje gości", "title": "Piętro I · Pokoje gości", "rooms": rooms025},
    {"map": 26, "name": "Apartamenty", "title": "Piętro II · Apartamenty", "rooms": rooms026, "axis": 14},
]

# ------------------------------------------------------------------------------------------------ building one floor
def transfers(m):
    """[(event, x, y, map, tx, ty)] for every event that moves the hero (its first transfer command)"""
    out = []
    for e in m["events"]:
        if not e: continue
        for p in e["pages"]:
            hit = next((c for c in p["list"] if c["code"] == 201 and c["parameters"][0] == 0), None)
            if hit:
                pr = hit["parameters"]
                out.append((e, e["x"], e["y"], pr[1], pr[2], pr[3]))
                break
    return out

def build(fl, strict=True):
    mid = fl["map"]
    m = load_map(mid)
    W, H = m["width"], m["height"]
    K = classify(m)
    rooms = fl["rooms"](K)
    owner = {}
    problems = []
    links_all = transfers(m)
    # 0) step tiles with no way to another map on them are no stairs (the stage's two front steps): floor
    exits = {(x, y) for (e, x, y, tm, tx, ty) in links_all if tm != mid}
    stair_cells = {c for c, k in K.items() if k == "S"}
    flights = []
    seen = set()
    for c in sorted(stair_cells):
        if c in seen: continue
        todo, comp = [c], set()
        while todo:
            p = todo.pop()
            if p in seen or p not in stair_cells: continue
            seen.add(p); comp.add(p)
            x, y = p
            todo += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
        if comp & exits: flights.append(comp)
        else:
            for p in comp: K[p] = "F"
    # 1) each room's real floor inside its rectangle (the share counts the steps and the dark of stairwells as there)
    for r in rooms:
        want = r.cells()
        real = {c for c in want if K.get(c) == "F"}
        r.floor = real
        share = len({c for c in want if K.get(c) in ("F", "S", "V")}) / max(1, len(want))
        if share < 0.85:
            problems.append("%s: only %d%% of its floor is floor on Map%03d" % (r.name, share * 100, mid))
        for c in real: owner[c] = r
    # 2) the wall face above a room's top floor row is the room's in the plan (and the floor gaps inside that face)
    for r in rooms:
        r.region = set(r.floor)
        for (x, y) in sorted(r.floor):
            if (x, y - 1) in r.floor: continue
            yy = y - 1
            while yy >= 0 and K.get((x, yy)) in ("W", "F") and (x, yy) not in owner and yy >= y - 3:
                r.region.add((x, yy)); owner[(x, yy)] = r
                yy -= 1
    # 3) the flights of stairs become rooms of their own (kind "stairs"): up or down by the map they lead to
    ORDER = {1: 0, 25: 1, 26: 2}
    fl_info = []
    for comp in sorted(flights, key=lambda c: min(c)):
        to = next(tm for (e, x, y, tm, tx, ty) in links_all if (x, y) in comp and tm != mid)
        fl_info.append((comp, to, ORDER.get(to, 0) > ORDER.get(mid, 0)))
    ups = sum(1 for f in fl_info if f[2])
    for comp, to, up in fl_info:
        xs = [x for x, y in comp]
        twin = (ups if up else len(fl_info) - ups) > 1          # two flights the same way: told apart by the side
        west = min(xs) < fl.get("axis", 50)
        key = "schody_" + ("zach" if west else "wsch") if twin else "schody_" + ("gora" if up else "dol")
        name = ("Schody na piętro" if mid == 1 else "Schody na górę") if up else "Schody w dół"
        if twin: name += " (zachodnie)" if west else " (wschodnie)"
        r = Room(key, name, "stairs", [], label="")
        r.floor = set(comp); r.region = set(comp); r.to = to; r.up = up
        rooms.append(r)
        for c in comp: owner[c] = r
    # 4) door gaps: floor cells that no room owns (openings through a wall), and the cells a same-map door event crosses
    gaps = {c for c, k in K.items() if k == "F" and c not in owner}
    doors = []
    links = []
    crossing = set()
    for (e, x, y, tm, tx, ty) in links_all:
        if tm == mid:
            cells = []
            if x == tx:
                line = [(x, yy) for yy in range(min(y, ty), max(y, ty) + 1)]
            else:
                line = [(xx, y) for xx in range(min(x, tx), max(x, tx) + 1)] if y == ty else []
            for c in line:
                crossing.add(c)
                if c not in owner and K.get(c) in ("B", "W"): cells.append(c)
            for c in cells: gaps.add(c)
            doors.append({"event": e["id"], "x": x, "y": y, "to": (tx, ty), "cells": cells})
        else:
            links.append({"event": e["id"], "x": x, "y": y, "map": tm, "to": (tx, ty), "name": e["name"]})
    # walkable (for the way on the plan): floor, stairs, the gaps and the cells a door takes him across
    walk = {c for c, k in K.items() if k in ("F", "S")} | gaps | crossing
    if problems and strict:
        raise SystemExit("plan geometry does not match the map:\n  " + "\n  ".join(problems))
    return {"map": mid, "W": W, "H": H, "K": K, "rooms": rooms, "owner": owner, "flights": flights, "gaps": gaps,
            "doors": doors, "links": links, "walk": walk, "crossing": crossing, "events": m["events"], "problems": problems, "data": m}

def boundary(cells):
    """the outline of a set of cells: merged axis-aligned edges [(x0, y0, x1, y1)] in cell units"""
    hs, vs = {}, {}
    for (x, y) in cells:
        if (x, y - 1) not in cells: hs.setdefault(y, []).append(x)
        if (x, y + 1) not in cells: hs.setdefault(y + 1, []).append(x)
        if (x - 1, y) not in cells: vs.setdefault(x, []).append(y)
        if (x + 1, y) not in cells: vs.setdefault(x + 1, []).append(y)
    segs = []
    def runs(vals):
        vals = sorted(set(vals))
        out, a = [], None
        for v in vals:
            if a is None: a = b = v
            elif v == b + 1: b = v
            else: out.append((a, b)); a = b = v
        if a is not None: out.append((a, b))
        return out
    # (a horizontal edge at y between cells above/below; two cells of the set touching the edge from the two sides at
    # one x are both counted - an inner edge is never produced since the neighbour is in the set)
    for y, xs in hs.items():
        for a, b in runs(xs): segs.append((a, y, b + 1, y))
    for x, ys in vs.items():
        for a, b in runs(ys): segs.append((x, a, x, b + 1))
    return segs

def cover_rects(cells):
    """a few rectangles covering a set of cells exactly (greedy: widest runs, grown downwards)"""
    left = set(cells)
    out = []
    while left:
        y0 = min(y for (x, y) in left)
        x0 = min(x for (x, y) in left if y == y0)
        x1 = x0
        while (x1 + 1, y0) in left: x1 += 1
        y1 = y0
        while all((x, y1 + 1) in left for x in range(x0, x1 + 1)): y1 += 1
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): left.discard((x, y))
        out.append((x0, y0, x1, y1))
    return out

if __name__ == "__main__":
    for fl in FLOORS:
        g = build(fl, strict=False)
        print("Map%03d %s: %d rooms, %d flights, %d gaps, %d doors, %d links, problems: %s" % (
            g["map"], fl["name"], len(g["rooms"]), len(g["flights"]), len(g["gaps"]), len(g["doors"]), len(g["links"]), g["problems"] or "none"))
        for r in g["rooms"]:
            print("   %-12s %-28s %-8s floor %4d region %4d rects %d" % (r.key, r.name, r.kind, len(r.floor), len(r.region), len(cover_rects(r.region))))
