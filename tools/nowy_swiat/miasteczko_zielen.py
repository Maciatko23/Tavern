# -*- coding: utf-8 -*-
"""Miasteczko (Map220), 2026-11-13 (gracz: „trochę więcej trawy daj od krawędzi wzgórz, ładnie wymieszaj z resztą; dodaj w wolnych
miejscach kwiaty, drzewa itd.”):
  1. trawa od krawędzi: ubita ziemia (A2 17) i bruk (A2 40) tuż przy krawędziach wzgórz i skarp (kafelki A5 poza schodami i płaskim
     gruntem) -> trawa: w odległości 1-2 kratek zawsze (bruk tylko 1), 3 kratek z szumem - nierówny pas, Ziemia.js miesza go
     stopniowo z resztą; dojścia do schodów i mostków (3 kratki w górę, kolumny schodów +-1) zostają z ziemi;
  2. drzewa w wolnych miejscach trawy: liściaste i sosny jak te na mapie (zdarzenia z <Tree:...>), tylko gdzie wokół pnia 3 x 3
     wolnej trawy, miejsce na koronę (3 x 3 nad pniem) to goły grunt, w pasie 5 x 7 wokół nie ma płotu, furtki ani dachu, nie na
     pasie nowej trawy przy skarpie; co najmniej 4 kratki od innych drzew i 6 od wiatraka;
  3. kwiaty i wysoka trawa (paleta D: czerwone, niebieskie, różowe, pomarańczowe, białe, żółte; wysoka trawa) w kępkach po 2-5 na
     wolnej trawie - bez kamyków i grzybów (nie mogą wyglądać jak rzeczy do zebrania).
  python tools/nowy_swiat/miasteczko_zielen.py [--podglad=<katalog>] [--wykonaj]"""
import copy, datetime, importlib.util, os, random, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
N = RW.N

W = H = 80
GRASS, EARTH, DARK, COBBLE = 16, 17, 27, 40
STAIRS = 1569
A5_FLAT = {1612, 1613, 1614, 1615, 1620, 1621, 1622, 1623, 1633, 1638}
FLOWERS = ((696, 704), (705, 706, 707), (708, 709), (710, 711), (716, 724), (734, 735))
TALL = (699,)     # (not 732 / 733: those are drawn ABOVE characters - they covered the windmill; 2026-11-13 fixed)
TREE_TEMPLATES = {"Drzewo (ozdobne)": 0.55, "Sosna": 0.25, "Sosna (średnia)": 0.20}
N_TREES, N_CLUMPS, SEED = 16, 34, 220
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def main():
    m, lay = RW.read_json("data/Map220.json")
    d = m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    rnd = random.Random(SEED)
    ev_at = {}
    for e in m["events"]:
        if e: ev_at.setdefault((e["x"], e["y"]), []).append(e)
    # ---- 1. grass from the hill edges
    edge = [(x, y) for y in range(H) for x in range(W) if 1536 <= at(0, x, y) < 2048 and at(0, x, y) not in A5_FLAT and at(0, x, y) != STAIRS]
    stairs = [(x, y) for y in range(H) for x in range(W) if at(0, x, y) == STAIRS]
    bridges = [(x, y) for y in range(H) for x in range(W) if at(5, x, y) == 4]
    keep = set()
    for (sx, sy) in stairs + bridges:
        for dx in (-1, 0, 1):
            for dy in range(-3, 4): keep.add((sx + dx, sy + dy))
    dist = {}
    for (ex, ey) in edge:
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                p = (ex + dx, ey + dy); dd = max(abs(dx), abs(dy))
                if dd and (p not in dist or dd < dist[p]): dist[p] = dd
    changed, n_grass = set(), 0
    for (x, y), dd in dist.items():
        if not (0 <= x < W and 0 <= y < H) or (x, y) in keep or (x, y) in ev_at: continue
        k = kind(at(0, x, y))
        if k not in (EARTH, COBBLE) or at(1, x, y) or at(2, x, y) or at(3, x, y) or at(5, x, y) not in (0, 31): continue
        n = RW_noise(x, y)
        want = dd <= 1 or (k == EARTH and (dd == 2 or (dd == 3 and n < 0.45)))
        if want: put(0, x, y, 2048 + GRASS * 48); changed.add((x, y)); n_grass += 1
    # ---- free grass for things
    def grass(x, y):
        if not (0 <= x < W and 0 <= y < H): return False
        t = at(0, x, y)
        return (kind(t) in (GRASS, DARK) or t == 1633) and not at(1, x, y) and not at(2, x, y) and not at(3, x, y) and at(5, x, y) == 0 and (x, y) not in ev_at
    def roofish(x, y): return 0 <= x < W and 0 <= y < H and 4352 <= at(0, x, y) < 8192
    spots = [e for e in m["events"] if e and (e["name"].startswith("Miejsce:") or e["name"].startswith("Drzwi:") or "Latarnia" in e["name"])]
    near_spot = {(e["x"] + dx, e["y"] + dy) for e in spots for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
    # ---- 2. trees
    trees = [(e["x"], e["y"]) for e in m["events"] if e and "<Tree:" in (e["note"] or "")]
    tmpl = {}
    for e in m["events"]:
        if e and "<Tree:" in (e["note"] or "") and e["name"] in TREE_TEMPLATES and e["name"] not in tmpl: tmpl[e["name"]] = e
    if set(tmpl) != set(TREE_TEMPLATES): raise SystemExit("STOP: brak wzorów drzew: %s" % (set(TREE_TEMPLATES) - set(tmpl)))
    def open_ground(x, y):   # the crown's room: plain ground, nothing standing, no field / building / bridge
        if not (0 <= x < W and 0 <= y < H): return False
        t = at(0, x, y)
        return (kind(t) in (GRASS, EARTH, DARK, COBBLE) or t in A5_FLAT) and not at(2, x, y) and not at(3, x, y)             and kind(at(1, x, y)) not in (22, 33) and at(5, x, y) in (0, 31) and (x, y) not in ev_at   # (no fence / gate under the crown)
    mill = [(e["x"], e["y"]) for e in m["events"] if e and e["name"] == "Wiatrak"]
    cand = [(x, y) for y in range(8, 73) for x in range(2, 78)
            if all(grass(x + dx, y + dy) and (x + dx, y + dy) not in changed for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            and all(open_ground(x + dx, y + dy) for dx in (-1, 0, 1) for dy in range(-3, 0))
            and not any(0 <= x + dx < W and 0 <= y + dy < H and kind(at(1, x + dx, y + dy)) in (22, 33)
                        for dx in (-2, -1, 0, 1, 2) for dy in range(-5, 2))
            and not any(roofish(x + dx, y + dy) for dx in (-2, -1, 0, 1, 2) for dy in range(-4, 2))
            and not any(max(abs(x - mx), abs(y - my)) < 6 for (mx, my) in mill)
            and (x, y) not in near_spot]
    rnd.shuffle(cand)
    added = []
    free_ids = [i for i, e in enumerate(m["events"]) if i and e is None]
    def add(e):
        nid = free_ids.pop(0) if free_ids else len(m["events"])
        if nid >= 500: raise SystemExit("STOP: brak numeru zdarzenia < 500")
        while len(m["events"]) <= nid: m["events"].append(None)
        e["id"] = nid; m["events"][nid] = e; ev_at.setdefault((e["x"], e["y"]), []).append(e)
        return nid
    names = list(TREE_TEMPLATES); weights = [TREE_TEMPLATES[n] for n in names]
    for (x, y) in cand:
        if len(added) >= N_TREES: break
        if any(max(abs(x - tx), abs(y - ty)) < 4 for (tx, ty) in trees): continue
        if not all(grass(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)): continue
        e = copy.deepcopy(tmpl[rnd.choices(names, weights)[0]]); e["x"], e["y"] = x, y
        add(e); trees.append((x, y)); added.append((e["id"], e["name"], x, y))
    # ---- 3. clumps of flowers and tall grass
    fcells = [(x, y) for y in range(7, 73) for x in range(1, 79) if grass(x, y) and (x, y) not in near_spot]
    rnd.shuffle(fcells)
    used, n_fl, clumps = set(), 0, 0
    for (cx, cy) in fcells:
        if clumps >= N_CLUMPS: break
        if any(max(abs(cx - ux), abs(cy - uy)) < 4 for (ux, uy) in used): continue
        pick = TALL if rnd.random() < 0.2 else FLOWERS[rnd.randrange(len(FLOWERS))]
        size = rnd.randint(2, 5); placed = 0
        ring = [(cx, cy)] + [(cx + dx, cy + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]
        rnd.shuffle(ring[1:])
        for (x, y) in ring:
            if placed >= size: break
            if grass(x, y) and (x, y) not in near_spot and not at(2, x, y):
                put(2, x, y, rnd.choice(pick)); placed += 1; n_fl += 1
        if placed: used.add((cx, cy)); clumps += 1
    # ---- shapes of the grass band
    for (x, y) in RW.ring(changed, 1):
        if not (0 <= x < W and 0 <= y < H): continue
        k = kind(at(0, x, y))
        if k is None or N.is_wall_kind(k) or not RW.shapes_by_floor(k): continue
        def same(dx, dy, x=x, y=y, k=k):
            ax, ay = x + dx, y + dy
            if not (0 <= ax < W and 0 <= ay < H): return True
            return kind(at(0, ax, ay)) == k
        put(0, x, y, 2048 + k * 48 + N.floor_shape(same))
    print("Trawa od krawędzi: %d kratek; nowe drzewa: %d %s; kwiaty / wysoka trawa: %d kafelków w %d kępkach"
          % (n_grass, len(added), [(a[1], a[2], a[3]) for a in added], n_fl, clumps))
    for a in sys.argv:
        if a.startswith("--podglad="):
            p = a.split("=", 1)[1]
            open(os.path.join(p, "Map220.json"), "wb").write(RW.json_text(m, lay)); print("  podgląd: " + p)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "miasteczko_zielen_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map220.json"), bak)
    open(os.path.join(ROOT, "data", "Map220.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


def RW_noise(x, y):
    """a smooth 0..1 noise over the map (cells), stable per cell"""
    import math
    def h(i, j): return ((math.sin(i * 127.1 + j * 311.7) * 43758.5453) % 1.0)
    gx, gy = x / 3.0, y / 3.0
    i, j = int(gx), int(gy); fx, fy = gx - i, gy - j
    u, v = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v


if __name__ == "__main__":
    main()
