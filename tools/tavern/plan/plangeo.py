# The tavern's three floors as plan geometry, read from the real maps (data/Map001.json, Map025.json, Map026.json).
# Every cell is sorted into floor / wall face / wall / stairs / void by its tile; the builders' room tables
# (tools/tavern/parter_layout.py, upperlib.layout25/26) only give the rooms their names and are checked against the real
# floor (a room whose floor is not there any more fails loudly). A plan draws a wall as a line, so the 3/4 view's wall
# face above a room is room space in the plan: every wall is then one cell thick. Doors: the floor gaps through walls
# and the same-map door events (a door picture on a wall face that moves the hero through the wall).
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
TAV = os.path.abspath(os.path.join(HERE, ".."))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ROOT = os.path.abspath(os.path.join(TAV, "..", ".."))
sys.path.insert(0, TAV)

STAIR_A5 = {17, 33}      # the A5 step tiles (wooden stairs of Map001/025, marble of Map026)
VOID_A5 = {0}            # A5 black: the stairwells' dark and the Galeria's well

def load_map(mid):
    with open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb") as f:
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

def rooms001():
    import parter_layout as P
    KIND = {"Pokój służby": "private", "Gabinet Borgara": "private", "Korytarz": "hall", "Sień": "hall"}
    SERVICE = {"Stare mury", "Skład", "Browar", "Magazyn", "Wędzarnia", "Spiżarnia", "Kuchnia", "Piekarnia"}
    KEYS = {"Stare mury": "komorka", "Skład": "sklad", "Browar": "browar", "Pokój służby": "sluzba", "Gabinet Borgara": "gabinet",
            "Magazyn": "magazyn", "Wędzarnia": "wedzarnia", "Korytarz": "korytarz", "Spiżarnia": "spizarnia", "Kuchnia": "kuchnia",
            "Piekarnia": "piekarnia", "Pokój myśliwski": "mysliwski", "Sala biesiadna": "biesiadna", "Sala ze sceną": "scena",
            "Pokój gier": "gry", "Łaźnia": "laznia", "Sala rzutek": "rzutki", "Wielka sala": "sala", "Jadalnia prywatna": "jadalnia",
            "Palarnia i czytelnia": "palarnia", "Sień": "sien"}
    # the old stones behind the storeroom are shown as what anyone sees there: a plain lumber room (no word of the old walls)
    NAMES = {"Stare mury": "Komórka"}
    LABELS = {"Pokój myśliwski": "Pokój\nmyśliwski", "Sala biesiadna": "Sala\nbiesiadna", "Sala ze sceną": "Sala\nze sceną",
              "Pokój służby": "Pokój\nsłużby", "Gabinet Borgara": "Gabinet\nBorgara", "Palarnia i czytelnia": "Palarnia\ni czytelnia",
              "Jadalnia prywatna": "Jadalnia\nprywatna", "Pokój gier": "Pokój\ngier", "Sala rzutek": "Sala\nrzutek"}
    out = []
    for (n, r, fk, wk, col, grp) in P.ROOMS:
        kind = KIND.get(n, "service" if n in SERVICE else "guest")
        rects = [r] + list(P.ROOM_EXTRA.get(n, []))
        out.append(Room(KEYS[n], NAMES.get(n, n), kind, rects, P.ROOM_CUT.get(n, []), label=LABELS.get(n, NAMES.get(n, n))))
    return out

def rooms025():
    import upperlib as UL
    L = UL.layout25()
    out = []
    for sp in L["spaces"]:
        if sp.number:
            kind = "guest" if sp.rent else "private"
            out.append(Room("r%d" % sp.number, "Pokój %d" % sp.number, kind, [(sp.x0, sp.y0, sp.x1, sp.y1)], label=str(sp.number),
                            sub=UL.SIZE_PL.get(sp.size, "")))
            continue
        if sp.key == "up": continue          # (the flight itself: a stairs room from the map's step tiles)
        kind = {"nc": "hall", "sc": "hall", "gal": "hall", "hall": "hall", "lounge": "guest", "chamber": "guest",
                "bath": "guest", "linen": "service", "maid": "private"}[sp.key]
        name = {"lounge": "Salonik gości", "chamber": "Komnata z kominkiem"}.get(sp.key, sp.label)
        label = {"lounge": "Salonik\ngości", "chamber": "Komnata", "maid": "Pokój\npokojówki", "linen": "Bieliź-\nniarka",
                 "hall": "Hall\nschodowy"}.get(sp.key, name)
        # the stair hall's rectangle holds the stairwell and its side walls: only its upper part is floor
        cut = [(40, 63, 45, 69), (51, 63, 56, 69), (46, 63, 50, 69)] if sp.key == "hall" else []
        out.append(Room(sp.key, name, kind, [(sp.x0, sp.y0, sp.x1, sp.y1)], cut=cut, label=label))
    return out

def rooms026():
    import upperlib as UL
    L = UL.layout26()
    SUITE = {"s1": "Apartament Różany", "lord": "Apartament Lorda", "s2": "Apartament Błękitny", "s3": "Apartament Zielony",
             "s4": "Apartament Złoty"}
    out = []
    for sp in L["spaces"]:
        k = sp.key
        grp = k[:2] if k[:2] in ("s1", "s2", "s3", "s4") else "lord" if k.startswith("lord") else k
        if grp in SUITE:
            part = "sypialnia" if k.endswith("b") else ("salon" if k == "lorda" else "salonik")
            kind = "guest" if grp == "s4" else "private"
            out.append(Room(k, SUITE[grp], kind, [(sp.x0, sp.y0, sp.x1, sp.y1)], label=SUITE[grp].split(" ", 1)[1], sub=part, group=grp))
            continue
        kind = {"hall": "hall", "serv": "service", "bathlux": "guest", "lib": "guest", "salon": "guest", "dining": "guest",
                "terrace": "guest"}[k]
        label = {"serv": "Kącik\nsłużby", "hall": "Wielka galeria", "salon": "Wielki salon"}.get(k, sp.label)
        out.append(Room(k, sp.label, kind, [(sp.x0, sp.y0, sp.x1, sp.y1)], label=label))
    return out

FLOORS = [
    {"map": 1, "name": "Parter", "title": "Parter", "rooms": rooms001},
    {"map": 25, "name": "Pokoje gości", "title": "Piętro I · Pokoje gości", "rooms": rooms025},
    {"map": 26, "name": "Apartamenty", "title": "Piętro II · Apartamenty", "rooms": rooms026},
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
    rooms = fl["rooms"]()
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
