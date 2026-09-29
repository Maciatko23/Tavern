# python check_house.py [A] [B]  -> prints every problem of the staged cottage, exit code 1 if any (the build must pass)
# The tavern's placement rules (tools/tavern/check_placement.py) for grandpa's cottage, read from the staged map,
# Map019_<X>_meta.json (what the generator placed where), the props' art boxes and the tileset-8 flags:
#   1 table items   - a thing standing on a table, a stool or a nightstand lies inside its top surface, EDGE px from
#                     every edge (nothing on edges or corners)
#   2 squeezed      - every seat and every thing standing on the floor has a walkable neighbour; a table has a free side
#                     or a reachable seat
#   3 walkways      - every floor cell is reachable from the landing; no 1-cell slot squeezed between furniture; the
#                     doorway and the partition opening stay free
#   4 wall rhythm   - wall things of one kind in one group hang at one height and at even spacing
#   5 symmetry      - the wall things of a room (groups ending "okna", "zioła", "półki", "drewno", "doniczki",
#                     "zasłony") mirror onto themselves about the room's axis (meta "axes": the hearth / the partition)
#   6 hooks         - the exit, the landing, the hero's bed (reachable from a free cell beside it, facing it), grandpa's
#                     spot and the new-game start are free and reachable
import os, sys, json
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
TAVERN = os.path.abspath(os.path.join(HERE, "..", "tavern"))
sys.path.insert(0, TAVERN)
from engine import Engine
import check_placement as CP

EDGE = 2
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))

def surfaces():
    """the tavern's table tops + the cottage's small tops (px inside the cell): the nightstand C(5,0) (its top is on the
    wall row), the small round table C(4,0..1), the big stool C(14,0)"""
    S = CP.surfaces()
    S[("C", 5, 0)] = (4, 22, 42, 37)
    S[("C", 4, 0)] = (10, 27, 38, 48); S[("C", 4, 1)] = (10, 0, 38, 4)
    S[("C", 14, 0)] = (13, 12, 36, 30)
    S[("B", 0, 3)] = (7, 13, 44, 22)          # the window's sill (flower pots)
    return S

def idx_art():
    """art boxes of every prop sheet frame used as a table thing: the tavern's index + the cottage's"""
    out = {}
    for p in (os.path.join(TAVERN, "props_index.json"), os.path.join(HERE, "house_props_index.json")):
        if os.path.exists(p):
            for k, v in load(p).items(): out[k] = v
    return out

def check(concept):
    mp_path = os.path.join(HERE, "staging", "Map019_%s.json" % concept)
    m = load(mp_path)
    meta = load(os.path.join(HERE, "staging", "Map019_%s_meta.json" % concept))
    flags = load(os.path.join(TAVERN, "staging", "tileset8_flags.json"))
    W, H, data = m["width"], m["height"], m["data"]
    events = [e for e in m["events"] if e]
    eng = Engine(W, H, data, flags, events)
    S = surfaces()
    IDX = idx_art()
    problems = defaultdict(list)
    def layer(z, x, y): return data[(z * H + y) * W + x]
    def surface_rect(x, y):
        for z in (3, 2, 1):
            ref = CP.tile_ref(layer(z, x, y))
            if ref and ref in S:
                b = S[ref]
                return (x * 48 + b[0], y * 48 + b[1], x * 48 + b[2], y * 48 + b[3])
        return None
    def inside_surface(box):
        x0, y0, x1, y1 = box
        fy0 = y1 - max(3, (y1 - y0) // 4)
        pts = [(x0 - EDGE, fy0), (x1 + EDGE - 1, fy0), (x0 - EDGE, y1 + EDGE - 1), (x1 + EDGE - 1, y1 + EDGE - 1),
               ((x0 + x1) // 2, (fy0 + y1) // 2)]
        for (px, py) in pts:
            r = surface_rect(px // 48, py // 48)
            if not r or not (r[0] <= px < r[2] and r[1] <= py < r[3]): return False
        return True
    things = meta["things"]
    sp = meta["spots"]
    # ---------------------------------------------------------------- 1 table items
    n_items = 0
    for th in things:
        if th["cat"] in ("tableitem", "counteritem", "sillitem") and th.get("event"):
            p = IDX.get(th["kind"], {})
            art = th.get("art") or p.get("art")
            fw, fh = th.get("fw") or p.get("w"), th.get("fh") or p.get("h")
            if not art: continue
            fx0 = th["x"] * 48 + 24 - fw // 2
            fy0 = (th["y"] + 1) * 48 - fh
            box = (fx0 + art[0], fy0 + art[1], fx0 + art[2], fy0 + art[3])
            n_items += 1
            if th["kind"] == "chochla": continue       # the ladle rests on the water barrel's rim
            if not inside_surface(box):
                problems["1 przedmiot poza blatem / na krawędzi"].append("%s @(%d,%d)" % (th["kind"], th["x"], th["y"]))
        if th["cat"] == "tabletile":
            b = CP.tile_art(th["sheet"], th["sc"], th["sr"])
            if not b: continue
            box = (th["x"] * 48 + b[0], th["y"] * 48 + b[1], th["x"] * 48 + b[2], th["y"] * 48 + b[3])
            n_items += 1
            if not inside_surface(box):
                problems["1 przedmiot poza blatem / na krawędzi"].append("%s(%d,%d) @(%d,%d)" % (th["sheet"], th["sc"], th["sr"], th["x"], th["y"]))
    # ---------------------------------------------------------------- 3 walkways (reachability first)
    landing = tuple(sp["landing"][:2])
    people = [tuple(sp[k][:2]) for k in ("grandpa",) if k in sp]
    seen = eng.reach([landing], ignore=people)
    floor = {(c[0], c[1]) for c in meta["floor"]}
    for c in sorted(floor):
        if c not in seen and eng.standable(*c) and c not in people:
            problems["3 zamknięte pole podłogi"].append("(%d,%d)" % c)
    furn_cat = {}
    for th in things:
        if th["cat"] in ("table", "seat", "floorprop", "counter", "furniture"):
            for c in th["cells"]: furn_cat[tuple(c)] = th["cat"]
    beds = {tuple(c) for th in things if th["kind"] in ("łóżko dziadka", "siennik") for c in th["cells"]}
    for c in seen:
        x, y = c
        nb = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        walk = [n for n in nb if n in seen]
        hard = [n for n in nb if furn_cat.get(n) in ("floorprop", "furniture", "counter", "table")]
        bedside = any(n in beds for n in nb)          # the slot beside a bed is where one gets in: it may be a nook
        if len(walk) == 1 and len(hard) >= 2 and c in floor and not bedside:
            problems["3 szczelina wciśnięta między meble"].append("(%d,%d)" % c)
    # the doorway and the openings stay free
    for (n, r) in meta["openings"]:
        for x in range(r[0], r[2] + 1):
            for y in range(r[1], r[3] + 1):
                if (x, y) not in seen: problems["3 przejście zablokowane"].append("%s (%d,%d)" % (n, x, y))
    # ---------------------------------------------------------------- 2 squeezed
    def has_free_neighbour(cells):
        cs = {tuple(c) for c in cells}
        for (x, y) in cs:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n not in cs and n in seen: return True
        return False
    for th in things:
        if th["cat"] in ("seat", "floorprop", "table") and not has_free_neighbour(th["cells"]):
            if th["cat"] == "table":
                grp = [t for t in things if t["cat"] == "seat" and (t.get("group") or "").split(" ")[0] == (th.get("group") or "").split(" ")[0]]
                if any(has_free_neighbour(t["cells"]) and any(abs(a[0] - b[0]) + abs(a[1] - b[1]) == 1 for a in t["cells"] for b in th["cells"]) for t in grp):
                    continue
            problems["2 ściśnięte (brak wolnego pola obok)"].append("%s %s @%s" % (th["cat"], th["kind"], th["cells"][0]))
    # ---------------------------------------------------------------- 4 wall rhythm
    by = defaultdict(list)
    for (grp, kind, x, y) in meta["wall_items"]:
        by[(grp, kind)].append((x, y))
    for (grp, kind), pts in by.items():
        if not grp or len(pts) < 2: continue
        ys = {y for x, y in pts}
        if len(ys) > 1:
            problems["4 różna wysokość na ścianie"].append("%s / %s: rzędy %s" % (grp, kind, sorted(ys)))
        xs = sorted(x for x, y in pts)
        if len(xs) >= 3:
            gaps = [b - a for a, b in zip(xs, xs[1:])]
            if max(gaps) - min(gaps) > 1:
                problems["4 nierówne odstępy na ścianie"].append("%s / %s: x %s" % (grp, kind, xs))
    # ---------------------------------------------------------------- 5 symmetry
    # meta "axes": (room, axis) with the axis in half cells (2 * x + 1 = the middle of column x); a thing's middle in
    # half cells is 2 * x + w; every group of the room ending in one of SYM must mirror onto itself about the axis
    SYM = ("okna", "zioła", "półki", "zasłony", "drewno", "doniczki")
    for (name, axis2) in meta.get("axes", []):
        grp = defaultdict(list)
        for th in things:
            g = th.get("group") or ""
            if g.startswith(name + " ") and g.split(" ")[-1] in SYM:
                grp[g].append(2 * th["x"] + th.get("w", 1))
        for (g, kind, x, y) in meta["wall_items"]:
            g = g or ""
            if g.startswith(name + " ") and g.split(" ")[-1] in SYM and kind == "window":
                grp[g].append(2 * x + 1)
        for g, xs in grp.items():
            xs = sorted(xs)
            if xs != sorted(2 * axis2 - v for v in xs):
                problems["5 brak symetrii"].append("%s: środki x %s (oś %.1f)" % (g, [v / 2.0 for v in xs], axis2 / 2.0))
    # ---------------------------------------------------------------- 6 hooks
    def reachable_beside(cells):
        return any((x + dx, y + dy) in seen for (x, y) in cells for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)))
    hooks = defaultdict(list)
    for (tag, x, y) in meta["hooks"]: hooks[tag].append((x, y))
    if not hooks.get("exit"): problems["6 brak zaczepu"].append("wyjście")
    if not hooks.get("sleep"): problems["6 brak zaczepu"].append("posłanie bohatera")
    for (x, y) in hooks.get("exit", []):
        if (x, y) not in seen: problems["6 zaczep nieosiągalny"].append("wyjście (%d,%d)" % (x, y))
    if hooks.get("sleep") and not reachable_beside(hooks["sleep"]):
        problems["6 zaczep nieosiągalny"].append("posłanie %s" % hooks["sleep"])
    for k in ("landing", "start", "grandpa"):
        if k not in sp: problems["6 brak zaczepu"].append(k); continue
        c = tuple(sp[k][:2])
        if not eng.standable(*c): problems["6 zaczep na zajętym polu"].append("%s %s" % (k, c))
        elif c not in seen and c not in people: problems["6 zaczep nieosiągalny"].append("%s %s" % (k, c))
    # grandpa must not stand in the way: his cell is not the only way anywhere
    if "grandpa" in sp:
        g = tuple(sp["grandpa"][:2])
        without = eng.reach([landing], ignore=())
        eng.block.add(g)
        blocked_by_him = [c for c in seen if c != g and c not in eng.reach([landing])]
        eng.block.discard(g)
        if blocked_by_him: problems["6 dziadek zagradza przejście"].append("%s odcina %d pól" % (g, len(blocked_by_him)))
    # ---------------------------------------------------------------- report
    total = sum(len(v) for v in problems.values())
    print("Map019_%s: %d rzeczy, %d przedmiotów na blatach, %d zdarzeń; osiągalne pola %d z %d" %
          (concept, len(things), n_items, len(events), len(seen), len(floor)))
    for k in sorted(problems):
        v = problems[k]
        print("  %s: %d  %s" % (k, len(v), "; ".join(v[:14]) + (" ..." if len(v) > 14 else "")))
    print("  WYNIK: %s" % ("OK - nic do poprawy" if not total else "%d problemów" % total))
    return total

def main():
    which = [a for a in sys.argv[1:] if a.isupper()] or ["A", "B"]
    bad = sum(check(c) for c in which)
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
