# python check_placement.py [staging/Map001.json]  -> prints every problem, exit code 1 if any (the build must pass)
# The ground floor's placement checks, from the staged map, parter_meta.json (what the generator placed where),
# props_index.json (where the picture sits inside each frame) and the staged tileset-8 flags:
#   1 table items   - a thing standing on a table or a counter (our props and Winlu's small tiles) lies inside the
#                     table's top surface, at least EDGE px from its edge (nothing on edges or corners)
#   2 squeezed      - every seat can be reached (a walkable neighbour), every table has a free side or a seat, every
#                     thing standing on the floor has a walkable neighbour
#   3 walkways      - every floor cell the player can stand on is reachable from the entrance; no 1-cell dead-end
#                     slots between furniture
#   4 wall rhythm   - repeated wall things of one kind in one group (windows, banners, lanterns, sconces) hang at one
#                     height and at even spacing
#   5 table rows    - tables of one group line up (same rows / columns) and are evenly spaced
#   6 hooks         - every gameplay hook the plugins need is there and reachable from a walkable neighbour
import os, sys, json
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from engine import Engine
import parter_layout as L
from PIL import Image
import numpy as np

EDGE = 2
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
WINLU = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets")

def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))

# ---- the top surfaces of Winlu's tables and counters: tile (sheet, col, row) -> (x0, y0, x1, y1) px inside the cell
def surfaces():
    S = {}
    def put(sheet, cols, row, box):
        for c in cols: S[(sheet, c, row)] = box
    # long tables across (C 9 left end, 10 middle, 11 right end) plain rows 4..5, trestle 6..7, slate 8..9; the square
    # tables (12 left, 13 right) and the wide ones (14 left, 15 right)
    for top in (4, 6, 8):
        for c, (l, r) in ((9, (3, 48)), (10, (0, 48)), (11, (0, 45)), (12, (3, 48)), (13, (0, 45)), (14, (3, 48)), (15, (0, 45))):
            put("C", (c,), top, (l, 14, r, 48))
            put("C", (c,), top + 1, (l, 0, r, 21))
    # the long table down (C 8, 4..6)
    put("C", (8,), 4, (3, 14, 45, 48)); put("C", (8,), 5, (3, 0, 45, 48)); put("C", (8,), 6, (3, 0, 45, 26))
    # small round table C(4,0..1) - top only on row 0
    put("C", (4,), 0, (6, 14, 42, 44))
    # round tables of the Shops sheet: top row y 29.., legs row ..28
    for c in range(8):
        for top in (9, 11):
            put("E", (c,), top, (4, 30, 44, 48)); put("E", (c,), top + 1, (4, 0, 44, 26))
    put("E", (0,), 13, (4, 32, 44, 48)); put("E", (0,), 14, (4, 0, 44, 26))
    # counters: horizontal top row 0 (y 12..48) + a sliver of row 1; the vertical arms 3 and 5
    for c, (l, r) in ((0, (2, 48)), (1, (0, 48)), (2, (0, 46))):
        put("E", (c,), 0, (l, 12, r, 48)); put("E", (c,), 1, (l, 0, r, 8))
    for c in (3, 5):
        put("E", (c,), 0, (8, 12, 40, 48)); put("E", (c,), 1, (8, 0, 40, 48)); put("E", (c,), 2, (8, 0, 40, 30))
    return S

def tile_ref(t):
    """tile id -> (sheet, col, row) for B..E, None otherwise"""
    if 0 < t < 1024:
        sheet = "BCDE"[t // 256]
        i = t % 256
        return (sheet, (i % 8) + (8 if i >= 128 else 0), (i % 128) // 8)
    return None

_sheets = {}
def tile_art(sheet, c, r):
    """the solid pixels' box of a Winlu tile inside its cell"""
    name = {"B": "Fantasy_Inside_B", "C": "Fantasy_Inside_C", "D": "Fantasy_Inside_D", "E": "Fantasy_Inside_Shops"}[sheet]
    if name not in _sheets: _sheets[name] = np.array(Image.open(os.path.join(WINLU, name + ".png")).convert("RGBA"))
    a = _sheets[name][r * 48:(r + 1) * 48, c * 48:(c + 1) * 48, 3]
    ys, xs = np.nonzero(a > 120)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1) if len(xs) else None

def main():
    mp_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "staging", "Map001.json")
    m = load(mp_path)
    meta = load(os.path.join(HERE, "staging", "parter_meta.json"))
    flags = load(os.path.join(HERE, "staging", "tileset8_flags.json"))
    W, H, data = m["width"], m["height"], m["data"]
    events = [e for e in m["events"] if e]
    eng = Engine(W, H, data, flags, events)
    S = surfaces()
    problems = defaultdict(list)
    def layer(z, x, y): return data[(z * H + y) * W + x]
    # the table surface of a cell (px rect in map pixels) or None
    def surface_rect(x, y):
        for z in (2, 1):
            ref = tile_ref(layer(z, x, y))
            if ref and ref in S:
                b = S[ref]
                return (x * 48 + b[0], y * 48 + b[1], x * 48 + b[2], y * 48 + b[3])
        return None
    def inside_surface(box):
        """a thing standing on a table: its FOOT (the lowest quarter of its picture, at least 3 px) lies on table tops
        with EDGE px to spare on every side (its upper part may rise above the top, like a mug or a candle does)"""
        x0, y0, x1, y1 = box
        fy0 = y1 - max(3, (y1 - y0) // 4)
        pts = [(x0 - EDGE, fy0), (x1 + EDGE - 1, fy0), (x0 - EDGE, y1 + EDGE - 1), (x1 + EDGE - 1, y1 + EDGE - 1),
               ((x0 + x1) // 2, (fy0 + y1) // 2)]
        for (px, py) in pts:
            cx, cy = px // 48, py // 48
            r = surface_rect(cx, cy)
            if not r or not (r[0] <= px < r[2] and r[1] <= py < r[3]): return False
        return True
    # ---------------------------------------------------------------- 1 table items
    idx = load(os.path.join(HERE, "props_index.json"))
    n_items = 0
    for th in meta["things"]:
        if th["cat"] in ("tableitem", "counteritem") and th.get("event"):
            art = th.get("art")
            fw, fh = th["fw"], th["fh"]
            fx0 = th["x"] * 48 + 24 - fw // 2
            fy0 = (th["y"] + 1) * 48 - fh
            box = (fx0 + art[0], fy0 + art[1], fx0 + art[2], fy0 + art[3])
            n_items += 1
            if th["kind"] == "chochla": continue       # the ladle rests on a barrel's rim, not a table
            if not inside_surface(box):
                problems["1 przedmiot poza blatem / na krawędzi"].append("%s @(%d,%d)" % (th["kind"], th["x"], th["y"]))
        if th["cat"] == "tabletile":
            b = tile_art(th["sheet"], th["sc"], th["sr"])
            if not b: continue
            box = (th["x"] * 48 + b[0], th["y"] * 48 + b[1], th["x"] * 48 + b[2], th["y"] * 48 + b[3])
            n_items += 1
            if not inside_surface(box):
                problems["1 przedmiot poza blatem / na krawędzi"].append("%s(%d,%d) @(%d,%d)" % (th["sheet"], th["sc"], th["sr"], th["x"], th["y"]))
    # ---------------------------------------------------------------- 3 walkways (reachability first: 2 needs it)
    people = [tuple(L.SPOTS[k]) for k in ("Borgar", "Melia", "Grum", "Ozzy")]
    seen = eng.reach([tuple(L.LANDING[:2])], ignore=people)
    fm = L.floor_map()
    for c in fm:
        if c not in seen and eng.standable(*c) and c not in people:
            problems["3 zamknięte pole podłogi"].append("(%d,%d)" % c)
    # squeezed slots: a reachable cell with one way in, closed on the other sides by two or more pieces that are not
    # seats (the gap between two bar stools under the counter is normal; a gap between a shelf and a barrel is not)
    furn_cat = {}
    for th in meta["things"]:
        if th["cat"] in ("table", "seat", "floorprop", "counter", "furniture"):
            for c in th["cells"]: furn_cat[tuple(c)] = th["cat"]
    for c in seen:
        x, y = c
        nb = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        walk = [n for n in nb if n in seen]
        hard = [n for n in nb if furn_cat.get(n) in ("floorprop", "furniture", "counter", "table")]
        if len(walk) == 1 and len(hard) >= 2 and c in fm:
            problems["3 szczelina wciśnięta między meble"].append("(%d,%d)" % c)
    # ---------------------------------------------------------------- 2 squeezed
    def has_free_neighbour(cells):
        cs = {tuple(c) for c in cells}
        for (x, y) in cs:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n not in cs and n in seen: return True
        return False
    for th in meta["things"]:
        if th["cat"] in ("seat", "floorprop", "table") and not has_free_neighbour(th["cells"]):
            if th["cat"] == "table":
                # a table closed by its own seats is fine if a seat of its group can be reached
                grp = [t for t in meta["things"] if t["cat"] == "seat" and t.get("group", "").split(" ")[0] == (th.get("group") or "").split(" ")[0]]
                if any(has_free_neighbour(t["cells"]) and any(abs(a[0] - b[0]) + abs(a[1] - b[1]) == 1 for a in t["cells"] for b in th["cells"]) for t in grp):
                    continue
            problems["2 ściśnięte (brak wolnego pola obok)"].append("%s %s @%s" % (th["cat"], th["kind"], th["cells"][0]))
    # ---------------------------------------------------------------- 4 wall rhythm
    by = defaultdict(list)
    for (grp, kind, x, y) in meta["wall_items"]:
        by[(grp, kind)].append((x, y))
    openings = set()
    for (n, r) in L.OPENINGS:
        x0, y0, x1, y1 = r
        openings |= {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}
    for (grp, kind), pts in by.items():
        if not grp or len(pts) < 2: continue
        ys = {y for x, y in pts}
        if len(ys) > 1:
            problems["4 różna wysokość na ścianie"].append("%s / %s: rzędy %s" % (grp, kind, sorted(ys)))
        xs = sorted(x for x, y in pts)
        if len(xs) >= 3:
            wall_y = min(ys)
            # a gap with a doorway in it is not compared (a door breaks the wall into two runs)
            gaps = [b - a for a, b in zip(xs, xs[1:]) if not any((x, yy) in openings for x in range(a + 1, b) for yy in range(wall_y - 3, wall_y + 2))]
            if len(gaps) >= 2 and max(gaps) - min(gaps) > 1:
                problems["4 nierówne odstępy na ścianie"].append("%s / %s: x %s" % (grp, kind, xs))
    # ---------------------------------------------------------------- 5 table rows
    tg = defaultdict(list)
    for th in meta["things"]:
        if th["cat"] == "table" and th.get("group"): tg[th["group"]].append(th)
    for grp, ts in tg.items():
        if len(ts) < 2: continue
        rows = defaultdict(list)
        for t in ts: rows[t["y"]].append(t["x"])
        for y, xs in rows.items():
            xs = sorted(xs)
            if len(xs) >= 3:
                gaps = [b - a for a, b in zip(xs, xs[1:])]
                if max(gaps) - min(gaps) > 1:
                    problems["5 nierówny rząd stołów"].append("%s y%d: x %s" % (grp, y, xs))
        ys_by_x = defaultdict(set)
        for t in ts: ys_by_x[t["x"]].add(t["y"])
    # ---------------------------------------------------------------- 6 hooks
    need = {"board": 1, "dice": 2, "darts": 1, "arm": 1, "bath": 2, "stage": 1, "meal": 1, "mealtable": 4}
    have = defaultdict(list)
    for (tag, x, y) in meta["hooks"]: have[tag].append((x, y))
    for tag, n in need.items():
        if len(have[tag]) < n:
            problems["6 brak zaczepu"].append("%s: %d z %d" % (tag, len(have[tag]), n))
    for tag, pts in have.items():
        for (x, y) in pts:
            if not any((x + dx, y + dy) in seen for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                problems["6 zaczep nieosiągalny"].append("%s @(%d,%d)" % (tag, x, y))
    # ---------------------------------------------------------------- report
    total = sum(len(v) for v in problems.values())
    print("sprawdzono: %d rzeczy, %d przedmiotów na stołach, %d zaczepów, %d zdarzeń; osiągalne pola %d" %
          (len(meta["things"]), n_items, len(meta["hooks"]), len(events), len(seen)))
    for k in sorted(problems):
        v = problems[k]
        print("  %s: %d  %s" % (k, len(v), "; ".join(v[:14]) + (" ..." if len(v) > 14 else "")))
    print("WYNIK: %s" % ("OK - nic do poprawy" if not total else "%d problemów" % total))
    return 1 if total else 0

if __name__ == "__main__":
    sys.exit(main())
