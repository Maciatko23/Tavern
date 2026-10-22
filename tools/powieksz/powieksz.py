# Powiększenie map pod gołym niebem (2026-10-18, decyzja użytkownika): każdy bok x2. OBECNA ZAWARTOŚĆ ZOSTAJE w lewym górnym rogu,
# w tych samych współrzędnych - nowy teren dochodzi na wschód i na południe. Zachodnia i północna krawędź się nie zmieniają.
#
#   python tools/powieksz/powieksz.py 3 17 ... --dry-run     pokazuje plan (nic nie pisze)
#   python tools/powieksz/powieksz.py 3 17 ... --out DIR     pisze zmienione pliki do DIR (staging; data/ nietknięte) + SHA.txt
#   python tools/powieksz/install.py DIR [--wykonaj]         instaluje staging (edytor zamknięty, kopie do archiwum)
#   python tools/powieksz/powieksz.py 3 8 13 --numery --out DIR   już powiększone mapy: nowe zdarzenia na wolne numery 1-499
#                                                                  (zob. EDITOR_LAST_ID), staging jak wyżej
#
# Co robi z mapą N (mapy w jednym wywołaniu po kolei - każda widzi zmiany poprzednich):
#   - nowa szerokość/wysokość = 2x; tablica kafli (6 warstw: 4 kafli, cienie, regiony) przepisana tak, że stara część zostaje bajt
#     w bajt; autokafle stykające się z nową częścią (ostatni stary wiersz/kolumna i pierwszy nowy) przeliczone - szwu nie widać;
#   - nowy teren w charakterze mapy (STYLES + to, co widać w starej części): rodzaje ziemi i nakładek w tych samych proporcjach co
#     w starej części, las z drzew tej mapy (sosny i obiekty z Map003 na mapach łąk, duże drzewa Winlu na mapach miasteczka/wybrzeża),
#     reszta obiektów (krzaki, kamienie, rudy, pnie, kłody) jako ZDARZENIA kopiowane z tej mapy, ok. tyle na kafel co w starej części;
#     morze ciągnie się dalej, gdzie stara krawędź była morzem (ta sama woda); w górach skalne wychodnie z krawędziami i ścianami
#     (tools/mountains/mtlib.py); obrzeże (żywopłot / ściana lasu) powtórzone na nowej krawędzi, jeśli stara krawędź je miała;
#     polany 5x5 bez niczego (lądowanie orła, budowanie); nowe zdarzenia dostają wolne numery 1-499 (od 500 w górę numery należą
#     do wtyczek - rejestr w js/plugins/TawernaCore.js); mapa, której nie starcza numerów, dostaje mniej obiektów, równo rozrzedzonych;
#   - drogi, ścieżki i łachy, które dochodziły do starej wschodniej / południowej krawędzi, idą dalej łukami do nowej krawędzi i
#     kończą się w tych samych kolumnach/wierszach (droga brukowana przy bramie przechodzi w polną); przejścia (zdarzenia z 201 albo
#     ze skryptem reserveTransfer) z tych krawędzi przeniesione na nową krawędź;
#   - polecenia przejścia (201 i reserveTransfer w skryptach) we WSZYSTKICH mapach i zdarzeniach wspólnych, które celują w starą
#     wschodnią/południową krawędź tej mapy (x = stara szer.-1, albo -2 przy wyjściu krawędziowym; y tak samo), dostają nową.
# Stan (powiększone mapy, stary i nowy rozmiar): tools/powieksz/stan.json. Każdy plik w układzie edytora.
import json, os, sys, math, random, copy, argparse, re, collections, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
sys.path.insert(0, os.path.join(ROOT, "tools", "mountains"))
import nslib as N
import mtlib as MT

DATA = os.path.join(ROOT, "data")
STATE = os.path.join(HERE, "stan.json")
TILESETS = json.load(open(os.path.join(DATA, "Tilesets.json"), encoding="utf-8"))

# ------------------------------------------------------------------ the editor's layout (and the cache of the files being changed)
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(",", ":"))
def map_text(m):
    props = {k: v for k, v in m.items() if k not in ("data", "events")}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(m["data"]) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(m["events"]) - 1 else "") for i, e in enumerate(m["events"])]
    lines += ["]", "}"]
    return "\n".join(lines)
def db_text(arr): return "[\n" + ",\n".join(dump(e) for e in arr) + "\n]"
LAYOUT, CACHE, CHANGED = {}, {}, set()
def read_file(name, strict=True):
    if name in CACHE: return CACHE[name]
    raw = open(os.path.join(DATA, name), "rb").read()
    o = json.loads(raw.decode("utf-8"))
    kind_map = name.startswith("Map")
    if (map_text(o) if kind_map else db_text(o)).encode("utf-8") == raw: LAYOUT[name] = "editor"
    elif dump(o).encode("utf-8") == raw: LAYOUT[name] = "line"
    else:
        LAYOUT[name] = None
        if strict: raise SystemExit("STOP: data/%s nie jest w układzie edytora (otwórz i zapisz w edytorze)" % name)
    CACHE[name] = o
    return o
def text_of(name, o):
    lay = LAYOUT.get(name)
    if lay is None: raise SystemExit("STOP: data/%s trzeba zmienić, ale ma nietypowy układ - otwórz i zapisz go w edytorze" % name)
    if lay == "line": return dump(o)
    return map_text(o) if name.startswith("Map") else db_text(o)

# ------------------------------------------------------------------ event ids
# (2026-10-18) The new events take the map's free ids 1..EDITOR_LAST_ID. From 500 up the ids belong to the plugins (TawernaCore.js:
# the id registry - "ids are game-wide, the editor's own events stay far below"; Tawerna.inject leaves a plugin's event out when the
# map has its own event on that id, and Forestry's planted trees are 1000 and up on every map): the first install gave Map013
# ids up to 841 and Wyspa's way to the cape (690-698) and the eagle's climbers' path (500-501) were gone. The ids the file never
# used (from the old list's end) go first, then the holes left by deleted events (an old save may keep a deleted event's self
# switch); a map with more new objects than free ids gets fewer of them, thinned evenly over the new land (the most crowded go).
EDITOR_LAST_ID = 499
def thin(pts, n, seed):
    """n of the points pts [(x, y)], spread evenly: the greatest spacing that still keeps n (random order, seeded)"""
    rnd = random.Random(seed * 7 + 1)
    order = list(range(len(pts)))
    rnd.shuffle(order)
    def pick(d):
        cs, grid, kept = max(1, int(math.ceil(d))), {}, []
        for i in order:
            x, y = pts[i]
            gx, gy = x // cs, y // cs
            if all((pts[j][0] - x) ** 2 + (pts[j][1] - y) ** 2 >= d * d
                   for ax in (gx - 1, gx, gx + 1) for ay in (gy - 1, gy, gy + 1) for j in grid.get((ax, ay), ())):
                kept.append(i)
                grid.setdefault((gx, gy), []).append(i)
        return kept
    lo, hi, best = 0.0, 12.0, list(order)
    for _ in range(24):
        mid = (lo + hi) / 2
        k = pick(mid)
        if len(k) >= n: lo, best = mid, k
        else: hi = mid
    return best[:n]
def fit_ids(events, new, seed, log):
    """events: the map's list (its old events, None in the holes); new: [(x, y, e)] -> [(id, x, y, e)] on the free ids"""
    used = {e["id"] for e in events if e}
    free = [i for i in range(len(events), EDITOR_LAST_ID + 1)] + [i for i in range(1, min(len(events), EDITOR_LAST_ID + 1)) if i not in used]
    keep = list(range(len(new)))
    if len(new) > len(free):
        keep = sorted(thin([(x, y) for x, y, _ in new], len(free), seed))
        log("  numery: %d nowych obiektów, a wolnych numerów 1-%d tylko %d - zostaje %d (równo rozrzedzone)" % (len(new), EDITOR_LAST_ID, len(free), len(keep)))
    ids = sorted(free[:len(keep)])
    return [(ids[k],) + tuple(new[i]) for k, i in enumerate(keep)]
def put_events(events, fitted, make):
    for (nid, x, y, e) in fitted:
        while len(events) <= nid: events.append(None)
        events[nid] = make(nid, x, y, e)

# ------------------------------------------------------------------ tiles
def kind_of(t): return (t - 2048) // 48 if t >= 2048 else None
def is_water_kind(k): return k is not None and 0 <= k < 16
def shapes_by_floor(k):
    """autotile kinds whose shape is the floor table: A1 except the waterfalls, A2, the tops of A4"""
    if k is None: return False
    if k < 16: return k < 4 or k % 2 == 0
    return 16 <= k < 48 or (k >= 80 and ((k - 80) // 8) % 2 == 0)

def reshape(data, W, H, z, cells):
    """the editor's floor-autotile shapes for these cells of layer z (off the map counts as the same kind)"""
    base = z * W * H
    for (x, y) in cells:
        if not (0 <= x < W and 0 <= y < H): continue
        k = kind_of(data[base + y * W + x])
        if not shapes_by_floor(k): continue
        def same(dx, dy):
            nx, ny = x + dx, y + dy
            if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
            return kind_of(data[base + ny * W + nx]) == k
        data[base + y * W + x] = 2048 + k * 48 + N.floor_shape(same)

def ring_cells(cells, r=1):
    out = set()
    for (x, y) in cells:
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1): out.add((x + dx, y + dy))
    return out

# ------------------------------------------------------------------ what counts as natural (per tileset: the A2 sheets differ)
NAT_L0 = {16, 17, 24, 25, 26, 27}
NAT_L1 = {9: {21, 28, 29, 46}, 11: {20, 21, 25, 26, 28, 29, 31, 36, 37, 47}}   # (tileset 9: 20 is the forest wall of the frames, not a patch)
PAVED_L0 = {32, 33, 40, 41, 42, 43}             # cobble, planks, pavements (a town road at a gate)
PATH_L1 = 39
TREE_PICS = ("Pine", "Tree_", "Big_Trees", "Trunk_Dead")
NATURE_PICS = TREE_PICS + ("Bush_Bare", "Rock", "Boulder", "Stump", "Logs")
NATURE_TILES = {9: {"tile516", "tile678"}}      # the stump and the log of tileset 9 (B tiles: another tileset shows something else)
def pic_of(e):
    im = e["pages"][0]["image"]
    return im["characterName"] or ("tile%d" % im["tileId"])
def is_tree(g): return any(k in g for k in TREE_PICS)
def is_nature(g, ts): return any(g.startswith("!$" + k) or g.startswith(k) or ("$" + k) in g for k in NATURE_PICS) or g in NATURE_TILES.get(ts, set())
N.EXTRA["!$Big_Trees_green"] = N.fp(left=1, right=1)   # (the same dict mtlib's MMap.free reads)
EXTRA = N.EXTRA

# ------------------------------------------------------------------ the maps (style, seed, cells kept free, extra exits made by code)
# family: laka (tileset 9 meadows, fields, roads), gory (rock outcrops), wybrzeze (the sea goes on), okolica (land round a town/estate)
# runs: exits that only code puts in (Wyspa.js EDGES): side and the old cells along the edge
# region_new: the region of every new cell (Map003: 9 = "not grandpa's field" - Farming_Build.js refuses building there)
# land_only_paths: the new part is sea except the paths (the wreck's sandbar)
STYLES = {
    4: {"family": "laka", "seed": 404},
    3: {"family": "laka", "seed": 303, "region_new": 9},
    17: {"family": "laka", "seed": 1717},
    18: {"family": "laka", "seed": 1818},
    20: {"family": "laka", "seed": 2020},
    21: {"family": "laka", "seed": 2121},
    22: {"family": "laka", "seed": 2222},
    23: {"family": "laka", "seed": 2323},
    13: {"family": "gory", "seed": 1313, "runs": [("E", [11, 12, 13])]},
    175: {"family": "gory", "seed": 17575},
    120: {"family": "gory", "seed": 12020},
    8: {"family": "okolica", "seed": 808},
    24: {"family": "okolica", "seed": 2424},
    111: {"family": "okolica", "seed": 11111},
    168: {"family": "okolica", "seed": 16868},
    125: {"family": "wybrzeze", "seed": 12525, "runs": [("S", [21, 22, 23])]},
    155: {"family": "wybrzeze", "seed": 15555},
    157: {"family": "wybrzeze", "seed": 15757},
    159: {"family": "wybrzeze", "seed": 15959},
    162: {"family": "wybrzeze", "seed": 16262},
    165: {"family": "wybrzeze", "seed": 16565, "land_only_paths": True},
}

# the countryside round a town / on the coast when the map's old part has few objects: Map003's kinds (pictures, not tileset tiles)
COUNTRY = {"!$Bush_Bare_A": 4, "!$Bush_Bare_B": 3, "!$Bush_Bare_Tall": 3, "!$Bush_Bare_Wide": 3, "!$Bush_Bare_Thicket": 1,
           "!$Rock_Flat": 2, "!$Rock_Mossy": 2, "!$Rock_Cracked": 1, "!$Rock_Pile": 1, "!$Boulder_A": 1, "!$Stump_Tall": 1,
           "!$Trunk_Dead": 1, "!$Tree_Apple": 1, "!$Tree_Pear": 1, "!$Tree_Small": 2}

# ------------------------------------------------------------------ transfers (201 or a script with reserveTransfer)
RT = re.compile(r"reserveTransfer\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)")
def is_transfer_event(e):
    for p in e["pages"]:
        for c in p["list"]:
            if c["code"] == 201 and c["parameters"][0] == 0: return True
            if c["code"] in (355, 655) and RT.search(str(c["parameters"][0])): return True
    return False

# ------------------------------------------------------------------ the analysis of the old part
def analyse(m):
    W, H, d, ts = m["width"], m["height"], m["data"], m["tilesetId"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    nat1 = NAT_L1.get(ts, NAT_L1[9])
    l0, l1, land = collections.Counter(), collections.Counter(), []
    water0, water1 = collections.Counter(), collections.Counter()
    for y in range(H):
        for x in range(W):
            k0 = kind_of(at(0, x, y))
            if is_water_kind(k0):
                near = x >= W - 4 or y >= H - 4
                water0[k0] += 3 if near else 1
                water1[kind_of(at(1, x, y))] += 3 if near else 1
                continue
            if k0 in NAT_L0 and not at(2, x, y) and not at(3, x, y) and at(5, x, y) != 2 and 2 <= x < W - 2 and 2 <= y < H - 2:   # (not the edge bands: frames)
                l0[k0] += 1; land.append((x, y))
                k1 = kind_of(at(1, x, y))
                if k1 in nat1: l1[k1] += 1
    landset = set(land)
    events = [e for e in m["events"] if e]
    trees = [(e["x"], e["y"]) for e in events if is_tree(pic_of(e))]
    near_tree = landset & ring_cells(trees, 1)
    under = collections.Counter(kind_of(at(1, x, y)) for (x, y) in near_tree if kind_of(at(1, x, y)) in nat1)
    floor = under.most_common(1)[0][0] if under and under.most_common(1)[0][1] > 0.3 * max(1, len(near_tree)) else None
    wooded = landset & ring_cells(trees, 2)
    woods_frac = len(wooded) / float(max(1, len(landset)))
    kinds = collections.defaultdict(list)
    for e in events:
        g = pic_of(e)
        if is_nature(g, ts) and not is_transfer_event(e): kinds[g].append(e)
    over = {k: n for k, n in l1.items() if k != floor}
    total_land = float(max(1, len(landset)))
    floor_cells = sum(1 for (x, y) in landset if kind_of(at(1, x, y)) == floor) if floor else 0
    return {
        "base": l0.most_common(1)[0][0] if l0 else 16,
        "l0": {k: n / total_land for k, n in l0.items()},
        "floor": floor, "floor_frac": floor_cells / total_land,
        "over": {k: n / total_land for k, n in over.items()},
        "woods_frac": woods_frac, "land": len(landset),
        "water0": water0.most_common(1)[0][0] if water0 else None,
        "water1": {k: n / float(sum(water1.values())) for k, n in water1.items()} if water1 else {},
        "kinds": kinds, "trees": trees,
    }

# ------------------------------------------------------------------ the paths carried on to the new edges
def edge_runs(vals):
    vals = sorted(set(vals))
    runs, cur = [], []
    for v in vals:
        if cur and v != cur[-1] + 1: runs.append(cur); cur = []
        cur.append(v)
    if cur: runs.append(cur)
    return runs

def catmull(points, steps=6):
    out = []
    P = [points[0]] + points + [points[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for s in range(steps):
            t = s / steps
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 +
                                    (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(points[-1])
    return out

def carry_path(run, W, H, W2, H2, side, rnd, straight=False):
    """the run of the old edge carried on to the new edge: a few gentle bends, straight at both ends, ending in the same columns
    (side 'S': run = columns at y = H-1, ends at y = H2-1; 'E': run = rows at x = W-1, ends at x = W2-1)"""
    a, b = run[0], run[-1]
    wdt = b - a + 1
    c = (a + b) / 2.0
    L0, L1, span = (H - 1, H2 - 1, W2) if side == "S" else (W - 1, W2 - 1, H2)
    lo, hi = wdt / 2.0 + 2, span - 1 - wdt / 2.0 - 2
    n = max(3, int((L1 - L0) / 9))
    amp = 0.0 if straight else min(7.0, span / 9.0)
    phase = rnd.uniform(0, math.pi * 2)
    pts = [(c, L0), (c, L0 + 2)]
    for i in range(1, n):
        t = i / n
        along = L0 + 2 + t * (L1 - 4 - L0 - 2)
        across = c + amp * math.sin(phase + t * math.pi * 1.6) * math.sin(t * math.pi) + (0 if straight else rnd.uniform(-1.2, 1.2))
        pts.append((max(lo, min(hi, across)), along))
    pts += [(c, L1 - 3), (c, L1)]
    curve = [(q[0] + 0.5, q[1] + 0.5) for q in catmull(pts)]
    half = wdt / 2.0
    cells = set()
    for along in range(L0 + 1, L1 + 1):
        for across in range(0, span):
            px, py = (across, along) if side == "S" else (along, across)
            if N.line_dist(across + 0.5, along + 0.5, curve) <= half + 0.25 * (N.noise(px, py, 991) - 0.5) * 2: cells.add((px, py))
    for v in range(a, b + 1):
        cells.add((v, L1) if side == "S" else (L1, v))
    return cells

# ------------------------------------------------------------------ one map
def enlarge(mid, st, log):
    name = "Map%03d.json" % mid
    m = read_file(name)
    W, H, ts = m["width"], m["height"], m["tilesetId"]
    W2, H2 = W * 2, H * 2
    seed = st["seed"]
    rnd = random.Random(seed)
    old = m["data"]
    at_old = lambda z, x, y: old[(z * H + y) * W + x]
    A = analyse(m)
    data = [0] * (6 * W2 * H2)
    for z in range(6):
        for y in range(H):
            data[(z * H2 + y) * W2:(z * H2 + y) * W2 + W] = old[(z * H + y) * W:(z * H + y) * W + W]
    NEW = {(x, y) for y in range(H2) for x in range(W2) if x >= W or y >= H}
    family = st["family"]
    log("Map%03d %s: %dx%d -> %dx%d (%s; ziemia: %s, las %.0f%%, pod drzewami: %s, woda: %s)" % (
        mid, m["displayName"], W, H, W2, H2, family, A["base"], 100 * A["woods_frac"], A["floor"], A["water0"]))

    # ---- the exits on the old east / south edge: transfer events, paths, roads, sandbars, and the code-made ones
    edge_tr = [e for e in m["events"] if e and is_transfer_event(e) and (e["x"] == W - 1 or e["y"] == H - 1)]
    flags = TILESETS[ts]["flags"]
    blockers = {(e["x"], e["y"]) for e in m["events"] if e and pic_of(e) != "tile0" and e["pages"][0]["priorityType"] == 1}
    def walkable(x, y):
        r = at_old(5, x, y)
        if r == 1: return True
        if r == 2 or (x, y) in blockers: return False
        for z in (3, 2, 1, 0):
            t = at_old(z, x, y)
            f = flags[t] if t < len(flags) else 0
            if f & 0x10: continue
            if (f & 0x0f) == 0: return True
            if (f & 0x0f) == 0x0f: return False
        return False
    def exit_cell(x, y):
        k0, k1 = kind_of(at_old(0, x, y)), kind_of(at_old(1, x, y))
        return (k1 == PATH_L1 or k0 in PAVED_L0 or (st.get("land_only_paths") and k0 in NAT_L0)) and walkable(x, y)
    tr_s = [e["x"] for e in edge_tr if e["y"] == H - 1]
    tr_e = [e["y"] for e in edge_tr if e["x"] == W - 1]
    code_s = [v for side, cells in st.get("runs", []) if side == "S" for v in cells]
    code_e = [v for side, cells in st.get("runs", []) if side == "E" for v in cells]
    def keep_runs(vals, musts):
        out = []
        for run in edge_runs(vals):
            if len(run) >= 2 or set(run) & set(musts): out.extend(run)
        return out
    s_vals = keep_runs([x for x in range(W) if exit_cell(x, H - 1)] + tr_s + code_s, tr_s + code_s)
    e_vals = keep_runs([y for y in range(H) if exit_cell(W - 1, y)] + tr_e + code_e, tr_e + code_e)
    paths, path_l0, path_reg = set(), {}, {}
    for side, vals in (("S", s_vals), ("E", e_vals)):
        for run in edge_runs(vals):
            cells = [(v, H - 1) if side == "S" else (W - 1, v) for v in run]
            prof0 = collections.Counter(kind_of(at_old(0, x, y)) for x, y in cells).most_common(1)[0][0]
            prof1 = collections.Counter(kind_of(at_old(1, x, y)) for x, y in cells).most_common(1)[0][0]
            reg = collections.Counter(at_old(5, x, y) for x, y in cells).most_common(1)[0][0]
            pc = carry_path(run, W, H, W2, H2, side, rnd, straight=bool(st.get("land_only_paths"))) & NEW
            for c in pc:
                d_in = (c[1] - (H - 1)) if side == "S" else (c[0] - (W - 1))
                if prof0 in PAVED_L0 and d_in <= 3 + int(2 * N.noise(c[0], c[1], 17)): path_l0[c] = prof0          # the town road at the gate
                elif st.get("land_only_paths"): path_l0[c] = prof0                                                  # the sandbar's sand
                if reg in (61, 62, 63, 64, 65) or (reg and reg not in (2, 3)): path_reg[c] = reg
            paths |= pc
            has_tr = any((e["y"] == H - 1 and e["x"] in run) if side == "S" else (e["x"] == W - 1 and e["y"] in run) for e in edge_tr)
            log("  droga %s %d-%d -> nowa krawędź (%d kafli)%s%s" % ({"S": "S, kolumny", "E": "E, wiersze"}[side], run[0], run[-1], len(pc),
                ", przejścia przeniesione" if has_tr else "", (", bruk przy bramie" if prof0 in PAVED_L0 else "") + (", region %d" % reg if reg else "")))
    nearpath = ring_cells(paths, 1) & NEW

    # ---- water (the sea goes on where the old edge was sea)
    def water_old(x, y): return is_water_kind(kind_of(at_old(0, x, y)))
    water = set()
    e_w = [sum(water_old(W - 1 - k, y) for k in range(3)) >= 2 for y in range(H)]
    s_w = [sum(water_old(x, H - 1 - k) for k in range(3)) >= 2 for x in range(W)]
    if st.get("land_only_paths"):
        water = NEW - paths
    elif any(e_w) or any(s_w):
        for (x, y) in NEW:
            wob = int(round(6 * (N.lowfreq(x, y, seed + 201, 7.0) - 0.5)))
            if x >= W and y < H:
                w = e_w[max(0, min(H - 1, y + wob))]
            elif y >= H and x < W:
                w = s_w[max(0, min(W - 1, x + wob))]
            else:
                ce, cs = e_w[H - 1], s_w[W - 1]
                w = (ce and cs) or ((ce or cs) and N.lowfreq(x, y, seed + 202, 8.0) > 0.5)
            if w: water.add((x, y))
        for _ in range(2):   # no single-tile islands or ponds
            flip = set()
            for c in NEW:
                n = sum(((c[0] + dx, c[1] + dy) in water) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy))
                if c in water and n <= 2: flip.add(c)
                if c not in water and n >= 6 and c not in paths: flip.add(c)
            water ^= flip
        water -= paths
    land = NEW - water

    # ---- the frame (hedge / forest wall) of the old east / south edge, repeated on the new edges
    frame = {}   # (x, y) -> [l0, l1, l2, l3, shadow, region] copied from the old frame
    def framed(cells):
        f = sum(1 for (x, y) in cells if kind_of(at_old(1, x, y)) == 20 or kind_of(at_old(0, x, y)) in (118, 119))
        return f >= 0.7 * len(cells)
    def cell_of(x, y): return [at_old(z, x, y) for z in range(6)]
    e_band = [(W - 2, y) for y in range(H)] + [(W - 1, y) for y in range(H)]
    s_band = [(x, H - 2) for x in range(W)] + [(x, H - 1) for x in range(W)]
    frame_e = framed([(W - 1, y) for y in range(H) if (W - 1, y) not in set((W - 1, v) for v in e_vals)])
    frame_s = framed([(x, H - 1) for x in range(W) if x not in set(s_vals)])
    if frame_e:
        typical = [y for y in range(2, H - 2) if (kind_of(at_old(1, W - 1, y)) == 20 or kind_of(at_old(0, W - 1, y)) in (118, 119)) and y not in e_vals]
        for y in range(H2 - (2 if frame_s else 0)):
            sy = y if y < H - 2 else typical[(y * 7) % len(typical)] if typical else y % H
            for k in (0, 1): frame[(W2 - 2 + k, y)] = cell_of(W - 2 + k, sy)
    if frame_s:
        typical = [x for x in range(2, W - 2) if (kind_of(at_old(1, x, H - 1)) == 20 or kind_of(at_old(0, x, H - 1)) in (118, 119)) and x not in s_vals]
        for x in range(W2 - (2 if frame_e else 0)):
            sx = x if x < W - 2 else typical[(x * 7) % len(typical)] if typical else x % W
            for k in (0, 1): frame[(x, H2 - 2 + k)] = cell_of(sx, H - 2 + k)
    if frame_e and frame_s:
        for dx in (0, 1):
            for dy in (0, 1): frame[(W2 - 2 + dx, H2 - 2 + dy)] = cell_of(W - 2 + dx, H - 2 + dy)
    for c in list(frame):
        if c in paths or c in nearpath and (c[0] >= W2 - 2 or c[1] >= H2 - 2) and c in ring_cells(paths, 0): frame.pop(c, None)
    for c in paths: frame.pop(c, None)
    if frame: log("  obrzeże powtórzone na nowej krawędzi: %s" % "+".join(s for s, f in (("E", frame_e), ("S", frame_s)) if f))

    # ---- the clearings (5x5, nothing on them)
    clearings = []
    cand = sorted(c for c in land if 3 <= c[0] < W2 - 4 and 3 <= c[1] < H2 - 4 and (c[0] >= W + 3 or c[1] >= H + 3))
    rnd.shuffle(cand)
    want = max(2, len(land) // 650)
    for (x, y) in cand:
        if len(clearings) >= want: break
        box = {(x + dx, y + dy) for dx in range(-2, 3) for dy in range(-2, 3)}
        if not box <= land or box & set(frame) or box & nearpath: continue
        if any(math.hypot(x - a, y - b) < 11 for a, b in clearings): continue
        clearings.append((x, y))
    clear = {(x + dx, y + dy) for (x, y) in clearings for dx in range(-2, 3) for dy in range(-2, 3)}

    # ---- the map object for the new part (tileset 11 maps: mtlib's terraces for the rock outcrops)
    mp = MT.MMap(mid, W2, H2, m["displayName"], m["note"], seed=seed, tileset=ts)
    mp.taken = {(x, y) for y in range(H) for x in range(W)} | set(frame)
    for e in m["events"]:
        if not e: continue
        for dx, dy in EXTRA.get(pic_of(e), []): mp.taken.add((e["x"] + dx, e["y"] + dy))
    mp.keep_free = paths | clear | water | {(e["x"] if e["x"] != W - 1 else W2 - 1, e["y"] if e["y"] != H - 1 else H2 - 1) for e in edge_tr}
    outcrop_cells = set()
    if family == "gory" and ts == 11:
        n_out = max(2, len(land) // 900)
        cand = sorted(c for c in land if c[0] >= W + 4 or c[1] >= H + 4)
        rnd.shuffle(cand)
        made = 0
        for (cx, cy) in cand:
            if made >= n_out: break
            rx, ry = rnd.uniform(3, 6.5), rnd.uniform(2.5, 4.5)
            blob = {(x, y) for y in range(int(cy - ry - 1), int(cy + ry + 2)) for x in range(int(cx - rx - 1), int(cx + rx + 2))
                    if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + 0.35 * (N.noise(x, y, cx * 7 + cy) - 0.5) * 2}
            zone = ring_cells(blob, 1) | {(x, y + k) for (x, y) in blob for k in (1, 2, 3)}
            if not zone <= land or zone & (ring_cells(paths, 3) | clear | set(frame) | mp.taken): continue
            if any(x < 2 or y < 2 or x >= W2 - 2 or y >= H2 - 4 for (x, y) in zone): continue
            outcrop_cells |= zone
            mp.raise_to(blob, 1, "dirt" if A["base"] == 24 else "grass")
            made += 1
        log("  wychodnie skalne: %d" % made)

    # ---- the woods
    target = max(0.12, min(0.6, A["woods_frac"]))
    trees_kinds = {g: es for g, es in A["kinds"].items() if is_tree(g)}
    other_kinds = {g: es for g, es in A["kinds"].items() if not is_tree(g)}
    score = {c: N.lowfreq(c[0], c[1], seed, 8.0) for c in land}
    cutoff = sorted(score.values(), reverse=True)[int(target * len(score))] if score and target < 1 else 0
    woods = {c for c, v in score.items() if v >= cutoff}
    for (x, y) in land:   # the old woods by the seam go on a few tiles (ragged)
        d_in = max(x - (W - 1), y - (H - 1))
        if d_in <= 3 + int(5 * N.lowfreq(x, y, seed + 5, 4.0)):
            s = (min(x, W - 1), min(y, H - 1))
            if any(math.hypot(s[0] - a, s[1] - b) <= 2.5 for a, b in A["trees"]): woods.add((x, y))
    woods -= paths | nearpath | clear | outcrop_cells
    woods -= set(frame)

    # ---- the events: trees in the woods, the rest by the old mix
    def put(x, y, g):
        if g not in A["kinds"] and g not in N.TMPL: return False
        if not mp.free(x, y, g) or (x, y) in outcrop_cells: return False
        for dx, dy in EXTRA.get(g, []):
            if (x + dx, y + dy) in outcrop_cells or (x + dx, y + dy) in water: return False
        src = rnd.choice(A["kinds"][g]) if g in A["kinds"] else N.TMPL[g]
        e = copy.deepcopy(src)
        mp.add(x, y, {"name": e["name"], "note": e["note"], "pages": e["pages"]}, [(x + dx, y + dy) for dx, dy in EXTRA.get(g, [])])
        return True
    scale = min(3.0, len(land) / float(max(1, A["land"])))
    placed = collections.Counter()
    if trees_kinds:
        tw = [(g, len(es)) for g, es in trees_kinds.items()]
        tot = float(sum(n for g, n in tw))
        big = any("Big_Trees" in g for g, n in tw)
        spots = [t for t in A["trees"] if t[0] >= W - 5 or t[1] >= H - 5]
        cells = sorted(woods)
        rnd.shuffle(cells)
        for (x, y) in cells:
            sp = (2.8 + 1.6 * N.lowfreq(x, y, seed + 77)) if big else (2.1 + 1.4 * N.lowfreq(x, y, seed + 77))
            if all(math.hypot(x - a, y - b) >= sp for a, b in spots):
                r = rnd.random() * tot
                for g, n in tw:
                    r -= n
                    if r <= 0: break
                if put(x, y, g): spots.append((x, y)); placed[g] += 1; placed["_trees"] += 1
    open_land = sorted(land - woods - paths - clear - nearpath - outcrop_cells - set(frame))
    mix = {g: len(es) * scale for g, es in other_kinds.items()}
    if sum(mix.values()) < 0.012 * len(land) and family in ("okolica", "wybrzeze") and not st.get("land_only_paths"):
        mix = {g: w * 0.022 * len(land) / sum(COUNTRY.values()) for g, w in COUNTRY.items()}
    for g, k in sorted(mix.items()):
        k = int(round(k))
        if k <= 0: continue
        mp.scatter(open_land, k, lambda x, y, g=g: put(x, y, g) and (placed.update([g]) or True), min_gap=2)
    log("  obiekty: %d (drzewa %d; %s)" % (sum(v for k, v in placed.items() if k != "_trees"), placed["_trees"],
        ", ".join("%s %d" % (g.replace("!$", ""), n) for g, n in placed.most_common() if g != "_trees" and not is_tree(g))[:200]))

    # ---- the ground of the new part
    tree_cells = [(x, y) for x, y, e in mp.events if is_tree(e["pages"][0]["image"]["characterName"])]
    floor = set()
    if A["floor"]:
        floor = set(woods)
        for (tx, ty) in tree_cells:
            for yy in range(ty - 3, ty + 3):
                for xx in range(tx - 3, tx + 4):
                    if ((xx - tx) / 2.2) ** 2 + ((yy - ty + 0.5) / 1.8) ** 2 <= 1 + 0.5 * (N.noise(xx, yy, tx * 31 + ty) - 0.5) * 2: floor.add((xx, yy))
        floor &= land
        floor -= paths | clear | outcrop_cells | set(frame)
    base = A["base"]
    l0 = {}
    alts = sorted(((k, f) for k, f in A["l0"].items() if k != base), key=lambda kv: -kv[1])
    for i, (k, f) in enumerate(alts[:3]):
        if f < 0.02: continue
        sc = {c: N.lowfreq(c[0], c[1], seed + 11 + i * 13, 6.0) for c in land if c not in l0}
        if not sc: continue
        cut = sorted(sc.values(), reverse=True)[min(len(sc) - 1, int(f * len(land)))]
        for c, v in sc.items():
            if v >= cut and c not in paths: l0[c] = k
    l1 = {}
    for c in floor: l1[c] = A["floor"]
    for i, (k, f) in enumerate(sorted(A["over"].items(), key=lambda kv: -kv[1])[:4]):
        if f < 0.01: continue
        want = int(f * len(land))
        free_c = sorted(land - floor - paths - clear - outcrop_cells - set(frame) - set(l1))
        rnd.shuffle(free_c)
        got = 0
        for (cx, cy) in free_c:
            if got >= want: break
            rx, ry, sd = 1 + rnd.random() * 1.6, 0.8 + rnd.random() * 1.1, rnd.randrange(1 << 30)
            for yy in range(int(cy - ry - 2), int(cy + ry + 3)):
                for xx in range(int(cx - rx - 2), int(cx + rx + 3)):
                    c = (xx, yy)
                    if c in land and c not in l1 and c not in paths and c not in clear and c not in outcrop_cells and c not in frame and \
                       ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1 + 0.4 * (N.noise(xx, yy, sd) - 0.5) * 2:
                        l1[c] = k; got += 1
    # (the meadows of tileset 9: tall grass round the woods, like the generator of the meadows)
    if ts == 9 and 21 in A["over"]:
        for c in ring_cells(floor) - floor:
            if c in land and c not in l1 and c not in paths and c not in clear and c not in frame and N.noise(*c, seed + 51) < 0.55: l1[c] = 21
    w0 = A["water0"] if A["water0"] is not None else 10
    w1s = sorted(((k, f) for k, f in A["water1"].items() if k is not None and f > 0.05), key=lambda kv: -kv[1])
    for (x, y) in NEW:
        c = (x, y)
        if c in water:
            mp.layers[0][c] = ("k", w0)
            for i, (k, f) in enumerate(w1s[:1]):
                if N.lowfreq(x, y, seed + 300, 5.0) < f: mp.layers[1][c] = ("k", k)
            continue
        mp.layers[0][c] = ("k", path_l0.get(c, l0.get(c, base)))
        if c in paths and c not in path_l0 and not st.get("land_only_paths"): mp.layers[1][c] = ("k", PATH_L1)
        elif c in paths and c in path_l0 and path_l0[c] in PAVED_L0: pass
        elif c in l1: mp.layers[1][c] = ("k", l1[c])
    if outcrop_cells:
        def ground(level, x, y):
            if level == 0:
                t = mp.layers[0].get((x, y))
                return t[1] if t and t[0] == "k" else base
            return 24 if mp.style.get(level) == "dirt" else 16
        mp.terraces(ground=ground)
        for c in outcrop_cells:
            mp.layers[1].pop(c, None)
    res = mp.resolve()
    for (x, y) in NEW:
        for z in range(4):
            data[(z * H2 + y) * W2 + x] = res[(z * H2 + y) * W2 + x]
        data[(5 * H2 + y) * W2 + x] = path_reg.get((x, y), st.get("region_new", 0))
    for c, vals in frame.items():
        x, y = c
        for z in range(6):
            data[(z * H2 + y) * W2 + x] = vals[z]
        if st.get("region_new") and not vals[5]: data[(5 * H2 + y) * W2 + x] = st["region_new"]
    # the seam: the last old row/column and the first new ones, by the editor's rule (the frame's copies keep their own shapes)
    seam = {(x, y) for x in range(W2) for y in range(H2) if (W - 2 <= x <= W + 1 and y <= H + 1) or (H - 2 <= y <= H + 1 and x <= W + 1)}
    seam |= (ring_cells(paths) | ring_cells(set(frame))) & NEW   # (the frame's copies get their shapes from their new neighbours too)
    for z in (0, 1):
        reshape(data, W2, H2, z, seam)

    # ---- the events: the old ones as they are (the edge transfers moved), the new ones after them
    events = m["events"]
    moved = []
    for e in events:
        if not e: continue
        if any(e["id"] == x["id"] for x in edge_tr):
            ox, oy = e["x"], e["y"]
            if e["x"] == W - 1: e["x"] = W2 - 1
            if e["y"] == H - 1: e["y"] = H2 - 1
            moved.append("%d (%d,%d)->(%d,%d)" % (e["id"], ox, oy, e["x"], e["y"]))
    fitted = fit_ids(events, mp.events, seed, log)
    put_events(events, fitted, lambda nid, x, y, e: {"id": nid, "name": e["name"], "note": e["note"], "pages": copy.deepcopy(e["pages"]), "x": x, "y": y})
    m["width"], m["height"], m["data"] = W2, H2, data
    CHANGED.add(name)
    log("  zdarzenia: %d nowych (numery %s); przeniesione przejścia: %s" % (len(fitted), "%d-%d" % (min(f[0] for f in fitted), max(f[0] for f in fitted)) if fitted else "-", ", ".join(moved) or "-"))

    # ---- every transfer into the old east / south edge of this map: to the new edge
    retarget = []
    def fix(src, tx, ty, src_edge):
        nx = W2 - 1 if tx == W - 1 else (W2 - 2 if tx == W - 2 and src_edge else tx)
        ny = H2 - 1 if ty == H - 1 else (H2 - 2 if ty == H - 2 and src_edge else ty)
        if (nx, ny) != (tx, ty): retarget.append("%s: (%d,%d) -> (%d,%d)" % (src, tx, ty, nx, ny))
        return nx, ny
    def fix_list(lst, src, src_edge):
        hit = False
        for c in lst or []:
            if c.get("code") == 201 and c["parameters"][0] == 0 and c["parameters"][1] == mid:
                p = c["parameters"]
                nx, ny = fix(src, p[2], p[3], src_edge)
                if (nx, ny) != (p[2], p[3]): p[2], p[3] = nx, ny; hit = True
            elif c.get("code") in (355, 655) and isinstance(c["parameters"][0], str):
                s = c["parameters"][0]
                def sub(mo):
                    if int(mo.group(1)) != mid: return mo.group(0)
                    nx, ny = fix(src + " (skrypt)", int(mo.group(2)), int(mo.group(3)), src_edge)
                    return "reserveTransfer(%s, %d, %d" % (mo.group(1), nx, ny)
                s2 = RT.sub(sub, s)
                if s2 != s: c["parameters"][0] = s2; hit = True
        return hit
    for f in sorted(os.listdir(DATA)):
        if not (f.startswith("Map") and f[3:6].isdigit() and f.endswith(".json")): continue
        o = read_file(f, strict=False)
        for e in o["events"]:
            if not e: continue
            on_edge = e["x"] in (0, o["width"] - 1) or e["y"] in (0, o["height"] - 1)
            for pg in e["pages"]:
                if fix_list(pg["list"], "%s ev%d" % (f[:-5], e["id"]), on_edge): CHANGED.add(f)
    for dbn in ("CommonEvents", "Troops"):
        o = read_file(dbn + ".json", strict=False)
        for e in o:
            if not e: continue
            for lst in ([e.get("list")] if dbn == "CommonEvents" else [p.get("list") for p in e.get("pages", [])]):
                if fix_list(lst, "%s %d" % (dbn, e["id"]), False): CHANGED.add(dbn + ".json")
    for r in retarget: log("  przejście do tej mapy przestawione: " + r)
    return {"old": [W, H], "new": [W2, H2], "seed": seed, "events_new": len(fitted)}

# the maps enlarged before fit_ids: their new events (the ids the file had not got before the enlargement - the first copy in the
# archive, install.py's dane_przed_powiekszeniem) onto the free ids, the same way as a new run would put them
BEFORE = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-10-18", "dane_przed_powiekszeniem", "data")
def renumber(mid, st, log):
    if not st: raise SystemExit("STOP: Map%03d nie jest w stan.json (nie powiększona)" % mid)
    name = "Map%03d.json" % mid
    bak = os.path.join(BEFORE, name)
    if not os.path.exists(bak): raise SystemExit("STOP: brak kopii sprzed powiększenia: %s" % bak)
    old_list = json.load(open(bak, encoding="utf-8"))["events"]
    old_ids = {e["id"] for e in old_list if e}
    m = read_file(name)
    if [m["width"], m["height"]] != st["new"]: raise SystemExit("STOP: Map%03d ma inny rozmiar niż w stan.json" % mid)
    events = [None] * len(old_list)   # (the old list's length, as enlarge() saw it)
    for e in m["events"]:
        if e and e["id"] in old_ids: events[e["id"]] = e
    new = [(e["x"], e["y"], e) for e in m["events"] if e and e["id"] not in old_ids]
    fitted = fit_ids(events, new, st["seed"], log)
    put_events(events, fitted, lambda nid, x, y, e: dict(e, id=nid))
    before = [e["id"] for _, _, e in new]
    m["events"] = events
    if [f[3]["id"] for f in fitted] != [f[0] for f in fitted] or len(fitted) != len(new): CHANGED.add(name)
    log("Map%03d: %d nowych zdarzeń (numery %d-%d) -> %d (numery %s)" % (mid, len(new), min(before) if before else 0, max(before) if before else 0,
        len(fitted), "%d-%d" % (min(f[0] for f in fitted), max(f[0] for f in fitted)) if fitted else "-"))
    return dict(st, events_new=len(fitted))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("maps", nargs="+", type=int)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--numery", action="store_true", help="już powiększone mapy: nowe zdarzenia na wolne numery 1-499")
    args = ap.parse_args()
    if not args.dry_run and not args.out:
        raise SystemExit("Użyj --out DIR (staging) albo --dry-run; do data/ pisze install.py ze stagingu.")
    state = json.load(open(STATE, encoding="utf-8")) if os.path.exists(STATE) else {}
    state_add = {}
    lines = []
    log = lambda s: (print(s), lines.append(s))
    for mid in args.maps:
        if args.numery:
            state_add[str(mid)] = renumber(mid, state.get(str(mid)), log)
            continue
        if str(mid) in state: raise SystemExit("STOP: Map%03d już powiększona (%s)" % (mid, state[str(mid)]))
        if mid not in STYLES: raise SystemExit("STOP: brak stylu dla mapy %d" % mid)
        state_add[str(mid)] = enlarge(mid, STYLES[mid], log)
    if args.dry_run:
        print("(dry-run: nic nie zapisano; zmieniłyby się: %s)" % ", ".join(sorted(CHANGED))); return
    os.makedirs(args.out, exist_ok=True)
    sha = lambda b: hashlib.sha1(b).hexdigest()
    with open(os.path.join(args.out, "SHA.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("# plik\tsha1 nowej wersji\tsha1 obecnej w data/\n")
        for name in sorted(CHANGED):
            text = text_of(name, CACHE[name]).encode("utf-8")
            open(os.path.join(args.out, name), "wb").write(text)
            f.write("data/%s\t%s\t%s\n" % (name, sha(text), sha(open(os.path.join(DATA, name), "rb").read())))
    json.dump(state_add, open(os.path.join(args.out, "stan_dodaj.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(args.out, "raport.txt"), "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
    print("staging: %d plików -> %s" % (len(CHANGED), args.out))

if __name__ == "__main__":
    main()
