# python check_interiors.py [102 103 ...]  -> every problem of the staged interiors, exit code 1 if any
# The cottage's placement rules (tools/house/check_house.py) for the town interiors, read from the staged map, its
# _meta.json and the installed tileset-8 passage flags (data/Tilesets.json):
#   1 table items  - a thing standing on a table / counter / stool lies inside its top, 2 px from every edge
#   2 squeezed     - every seat and floor thing has a walkable neighbour (a table: a free side or a reachable seat)
#   3 walkways     - every floor cell is reachable from every landing; no 1-cell slot squeezed between furniture;
#                    the openings (doorways) stay free
#   4 wall rhythm  - wall things of one kind in one group hang at one height, evenly spaced
#   6 hooks        - every exit and landing reachable; every resident spot free, reachable, and not cutting the room
import os, sys, json
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern"))
sys.path.insert(0, os.path.join(ROOT, "tools", "house"))
from engine import Engine            # noqa: E402
import check_placement as CP          # noqa: E402
import check_house as CH              # noqa: E402

EDGE = 2
STAGING = os.path.join(HERE, "staging")

def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))

def flags8():
    return load(os.path.join(ROOT, "data", "Tilesets.json"))[8]["flags"]

def surfaces():
    S = CH.surfaces()
    S[("C", 6, 0)] = (4, 26, 44, 48); S[("C", 6, 1)] = (4, 0, 44, 6)          # the small square table C(6,0..1)
    S[("C", 3, 2)] = (4, 26, 44, 48)                                         # the writing desk C(3,2..3): its top
    S[("C", 6, 4)] = (2, 22, 48, 48); S[("C", 7, 4)] = (0, 22, 46, 48)       # the sideboard C(6..7,4..5)
    S[("C", 6, 2)] = (2, 22, 48, 48); S[("C", 7, 2)] = (0, 22, 46, 48)       # the sideboard C(6..7,2..3)
    S[("C", 5, 2)] = (6, 22, 42, 48)                                         # the stand C(5,2..3)
    return S

def check(mid, quiet=False):
    m = load(os.path.join(STAGING, "Map%03d.json" % mid))
    meta = load(os.path.join(STAGING, "Map%03d_meta.json" % mid))
    W, H, data = m["width"], m["height"], m["data"]
    events = [e for e in m["events"] if e]
    eng = Engine(W, H, data, flags8(), events)
    S = surfaces()
    IDX = CH.idx_art()
    IDX.update(load(os.path.join(HERE, "props_index.json")) if os.path.exists(os.path.join(HERE, "props_index.json")) else {})
    problems = defaultdict(list)
    def layer(z, x, y): return data[(z * H + y) * W + x]
    def surface_rect(x, y):
        if not (0 <= x < W and 0 <= y < H): return None
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
    # ---------------------------------------------------------------- 1 table items
    for th in things:
        if th["cat"] in ("tableitem", "counteritem") and th.get("event"):
            p = IDX.get(th["kind"], {})
            art = th.get("art") or p.get("art")
            fw, fh = th.get("fw") or p.get("w"), th.get("fh") or p.get("h")
            if not art or th["kind"] in ("chochla",): continue
            fx0 = th["x"] * 48 + 24 - fw // 2
            fy0 = (th["y"] + 1) * 48 - fh
            box = (fx0 + art[0], fy0 + art[1], fx0 + art[2], fy0 + art[3])
            if not inside_surface(box):
                problems["1 przedmiot poza blatem / na krawędzi"].append("%s @(%d,%d)" % (th["kind"], th["x"], th["y"]))
        if th["cat"] == "tabletile":
            b = CP.tile_art(th["sheet"], th["sc"], th["sr"])
            if not b: continue
            box = (th["x"] * 48 + b[0], th["y"] * 48 + b[1], th["x"] * 48 + b[2], th["y"] * 48 + b[3])
            if not inside_surface(box):
                problems["1 przedmiot poza blatem / na krawędzi"].append("%s(%d,%d) @(%d,%d)" % (th["sheet"], th["sc"], th["sr"], th["x"], th["y"]))
    # ---------------------------------------------------------------- 3 walkways
    landings = [tuple(e["landing"][:2]) for e in meta["exits"]]
    people = [(r["x"], r["y"]) for r in meta["residents"]]
    floor = {(c[0], c[1]) for c in meta["floor"]}
    seen = eng.reach(landings[:1], ignore=people)
    for L in landings:
        if L not in seen: problems["3 wejścia nie łączą się"].append("lądowanie %s" % (L,))
    for c in sorted(floor):
        if c not in seen and eng.standable(*c) and c not in people:
            problems["3 zamknięte pole podłogi"].append("(%d,%d)" % c)
    furn_cat = {}
    for th in things:
        if th["cat"] in ("table", "seat", "floorprop", "counter", "furniture"):
            for c in th["cells"]: furn_cat[tuple(c)] = th["cat"]
    beds = {tuple(c) for th in things if "łóżko" in th["kind"] or "siennik" in th["kind"] or "prycza" in th["kind"] for c in th["cells"]}
    for c in seen:
        x, y = c
        nb = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        walk = [n for n in nb if n in seen]
        hard = [n for n in nb if furn_cat.get(n) in ("floorprop", "furniture", "counter", "table")]
        bedside = any(n in beds for n in nb)
        if len(walk) == 1 and len(hard) >= 2 and c in floor and not bedside and c not in people:
            problems["3 szczelina wciśnięta między meble"].append("(%d,%d)" % c)
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
                grp = [t for t in things if t["cat"] == "seat"]
                if any(has_free_neighbour(t["cells"]) and any(abs(a[0] - b[0]) + abs(a[1] - b[1]) == 1 for a in t["cells"] for b in th["cells"]) for t in grp):
                    continue
            if th.get("nook"): continue
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
    # ---------------------------------------------------------------- 6 hooks
    for ex in meta["exits"]:
        if (ex["x"], ex["y"]) not in seen: problems["6 wyjście nieosiągalne"].append("(%d,%d)" % (ex["x"], ex["y"]))
    for r in meta["residents"]:
        c = (r["x"], r["y"])
        if not eng.standable(*c): problems["6 miejsce mieszkańca zajęte"].append("%s %s" % (r["key"], c))
        elif c not in seen: problems["6 miejsce mieszkańca nieosiągalne"].append("%s %s" % (r["key"], c))
        eng.block.add(c)
        cut = [q for q in seen if q != c and q not in people and q not in eng.reach(landings[:1], ignore=[p for p in people if p != c])]
        eng.block.discard(c)
        if cut: problems["6 mieszkaniec zagradza przejście"].append("%s %s odcina %d pól" % (r["key"], c, len(cut)))
        # one can speak to him: a reachable cell beside, or across a counter
        near = [(c[0] + dx, c[1] + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        if not any(n in seen for n in near) and not any(n in seen for n in [(c[0], c[1] + 3)]):
            problems["6 z mieszkańcem nie da się porozmawiać"].append(r["key"])
    total = sum(len(v) for v in problems.values())
    if not quiet or total:
        print("Map%03d %s: %d rzeczy, %d zdarzeń; osiągalne %d z %d pól podłogi" % (mid, meta["display"], len(things), len(events), len(seen & floor), len(floor)))
        for k in sorted(problems):
            v = problems[k]
            print("  %s: %d  %s" % (k, len(v), "; ".join(v[:14]) + (" ..." if len(v) > 14 else "")))
        print("  WYNIK: %s" % ("OK" if not total else "%d problemów" % total))
    return total, seen

def staged_ids():
    return sorted(int(f[3:6]) for f in os.listdir(STAGING) if f.startswith("Map") and f.endswith(".json") and "_" not in f)

def main():
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or staged_ids()
    bad = sum(check(i)[0] for i in ids)
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
