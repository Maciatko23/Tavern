# Przerzedzenie nowego terenu 21 powiększonych map (2026-10-22, prośba użytkownika: „trochę mniej drzew i kamieni, mniej grzybów
# i mniej roślin - żeby było przejrzyściej i wydajniej”).
#
#   python tools/powieksz/przerzedz.py [mapy...] --dry-run      plan i liczby (nic nie pisze)
#   python tools/powieksz/przerzedz.py [mapy...] --out DIR      zmienione mapy do DIR (staging) + SHA.txt, raport.txt, stan_dodaj.json
#   python tools/powieksz/install.py DIR --archiwum dane_przed_przerzedzeniem [--wykonaj]   instalacja (edytor zamknięty)
#   (bez listy map: wszystkie z tools/powieksz/stan.json)
#
# Co robi: TYLKO nowa część mapy (x >= stara szerokość albo y >= stara wysokość, stan.json) i TYLKO obiekty generatora
# (powieksz.py: zdarzenia z numerami 1-499 z obrazkiem drzewa, krzaka, kamienia, pnia, kłody). Każdej grupy (drzewa / krzaki /
# kamienie / pnie i kłody) ubywa ok. 40% (UBYTEK):
#   1. najpierw „szum” - pojedyncze, rozsiane obiekty (najwyżej 1 sąsiad w promieniu 3 pól), najpierw te najbardziej samotne
#      (z nich znika najwyżej 3/4, żeby łąki nie były gołe, i najwyżej 60% ubytku grupy);
#   2. potem kępy: zawsze znika obiekt, który ma teraz najwięcej sąsiadów - las zostaje lasem, tylko rzadszym.
# Nie rusza: starej części mapy, zdarzeń bez obrazka natury (przejścia, zadania, ludzie), zdarzeń o numerach, które padają w kodzie
# wtyczek albo testach (event(N), przełączniki [mapa, N, "A"]), obiektów na miejscach paczek nowego terenu i tuż obok
# (tools/powieksz/miejsca_okolic.json - Okolice.spots() i OkoliceData.PLAN_SPOTS z działającej gry, tools/powieksz/miejsca_okolic.js;
# miejsca tylko dla orła, ściany i nurkowania: promień 3). Miejsca dla orła muszą zostać nieosiągalne pieszo: sprawdzane chodzeniem
# (jak Okolice.walk) przed i po - obiekty, bez których dałoby się tam dojść, zostają.
# Wolne kwadraty 4x4 (polany) w nowej części: liczone przed i po (przybywa ich, nie ubywa).
# Grzyby, zioła, jagody, gałęzie, kamyki (zbieractwo Farming) to nie zdarzenia - na nowym terenie jest ich połowa przez mnożnik
# w kodzie: js/plugins/Farming_Plots.js NEW_LAND_GATHER (tabela starych wymiarów: OkoliceData.OLD).
import json, os, sys, re, math, random, argparse, hashlib, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import powieksz as P   # (the editor's layout, the nature pictures, the footprints)

STATE = os.path.join(HERE, "stan.json")
SPOTS = os.path.join(HERE, "miejsca_okolic.json")
UBYTEK = 0.40          # the share of each group that goes
SZUM_R = 3.0           # the radius of the neighbours
SZUM_MAX = 1           # "noise": at most this many neighbours
SZUM_DO = 0.75         # at most this share of the noise goes
SZUM_CZESC = 0.6       # and at most this share of a group's quota (the rest from the clumps: the woods get thinner too)
RING = {"eagle": 3, "wall": 3, "dive": 3}   # the ring round a place kept as it is (other modes: 1)
GROUPS = ("drzewa", "krzaki", "kamienie", "pnie")
EDITOR_LAST_ID = P.EDITOR_LAST_ID
TS = P.TILESETS

def group_of(g):
    if "Trunk_Dead" in g or "Stump" in g or "Logs" in g or g in ("tile516", "tile678"): return "pnie"
    if P.is_tree(g): return "drzewa"
    if "Bush" in g: return "krzaki"
    return "kamienie"

# ---- the ids the code names: event(N) / $gameMap.event(N) / [map, N, "A"] in js/plugins and tests (kept on every map)
def code_refs():
    ids = set()
    pats = [re.compile(r"\bevent\(\s*(\d{1,3})\s*\)"), re.compile(r"eventId\(\)\s*===\s*(\d{1,3})\b"),
            re.compile(r"\[\s*\d{1,3}\s*,\s*(\d{1,3})\s*,\s*[\"'][ABCD][\"']\s*\]")]
    for base in ("js/plugins", "tests"):
        for r, ds, fs in os.walk(os.path.join(ROOT, base)):
            ds[:] = [d for d in ds if d not in ("node_modules", "fixtures", "shots")]
            for f in fs:
                if not f.endswith(".js"): continue
                s = open(os.path.join(r, f), encoding="utf-8", errors="replace").read()
                for p in pats:
                    for mo in p.finditer(s):
                        n = int(mo.group(1))
                        if 0 < n <= EDITOR_LAST_ID: ids.add(n)
    return ids

def spots_by_map():
    out = collections.defaultdict(list)
    if not os.path.exists(SPOTS): raise SystemExit("STOP: brak %s (node tools/powieksz/miejsca_okolic.js przy działającym serwerze gry)" % SPOTS)
    d = json.load(open(SPOTS, encoding="utf-8"))
    seen = set()
    for s in d["spots"] + d["plan"]:
        k = (s["map"], s.get("key"))
        if k in seen: continue
        seen.add(k)
        out[s["map"]].append(s)
    return out

# ---- walking (Okolice.walk: 4 ways, both tiles' passage, blocking events in the way); RegionLayers 1 = open, 2 = shut
def walker(m, blockers):
    W, H, flags = m["width"], m["height"], TS[m["tilesetId"]]["flags"]
    d = m["data"]
    BIT = {2: 1, 4: 2, 6: 4, 8: 8}
    def ok(x, y, dd):
        r = d[(5 * H + y) * W + x]
        if r == 1: return True
        if r == 2: return False
        b = BIT[dd]
        for z in (3, 2, 1, 0):
            t = d[(z * H + y) * W + x]
            f = flags[t] if t < len(flags) and flags[t] is not None else 0
            if f & 0x10: continue
            if (f & b) == 0: return True
            if (f & b) == b: return False
        return False
    def walk(start):
        seen = {tuple(start)}
        q = [tuple(start)]
        while q:
            x, y = q.pop()
            for dd, dx, dy, rr in ((2, 0, 1, 8), (4, -1, 0, 6), (6, 1, 0, 4), (8, 0, -1, 2)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < W and 0 <= ny < H) or (nx, ny) in seen: continue
                if not ok(x, y, dd) or not ok(nx, ny, rr) or (nx, ny) in blockers: continue
                seen.add((nx, ny)); q.append((nx, ny))
        return seen
    return walk, ok

def blocking_cells(events):
    out = set()
    for e in events:
        if not e: continue
        p = e["pages"][0]
        if p["priorityType"] == 1 and not p["through"] and (p["image"]["characterName"] or p["image"]["tileId"]): out.add((e["x"], e["y"]))
    return out

def clearings(m, events, W0, H0):
    """free 4x4 squares (passable tiles, nothing standing, footprints counted) in the new part, counted without overlap"""
    W, H = m["width"], m["height"]
    _, ok = walker(m, set())
    taken = set()
    for e in events:
        if not e: continue
        g = P.pic_of(e)
        if g == "tile0": continue
        taken.add((e["x"], e["y"]))
        for dx, dy in P.EXTRA.get(g, []): taken.add((e["x"] + dx, e["y"] + dy))
    free = [[(x >= W0 or y >= H0) and (x, y) not in taken and any(ok(x, y, dd) for dd in (2, 4, 6, 8)) for x in range(W)] for y in range(H)]
    used, n = set(), 0
    for y in range(H - 3):
        for x in range(W - 3):
            if any((x + i, y + j) in used for i in range(4) for j in range(4)): continue
            if all(free[y + j][x + i] for i in range(4) for j in range(4)):
                n += 1
                used.update((x + i, y + j) for i in range(4) for j in range(4))
    return n

def thin_map(mid, st, spots, refs, log):
    name = "Map%03d.json" % mid
    m = P.read_file(name)
    W0, H0 = st["old"]
    if [m["width"], m["height"]] != st["new"]: raise SystemExit("STOP: Map%03d ma inny rozmiar niż w stan.json" % mid)
    ts = m["tilesetId"]
    events = m["events"]
    is_new = lambda e: e["x"] >= W0 or e["y"] >= H0
    cand = [e for e in events if e and is_new(e) and e["id"] <= EDITOR_LAST_ID and P.is_nature(P.pic_of(e), ts) and not P.is_transfer_event(e)]
    # the kept ones: named by the code, on the packages' places (and a ring round them)
    guard = {}
    for s in spots:
        r = RING.get(s.get("mode"), 1)
        for (x, y) in s["cells"]:
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1): guard.setdefault((x + dx, y + dy), s["key"])
    keep = {e["id"]: "kod" for e in cand if e["id"] in refs}
    for e in cand:
        cells = [(e["x"], e["y"])] + [(e["x"] + dx, e["y"] + dy) for dx, dy in P.EXTRA.get(P.pic_of(e), [])]
        for c in cells:
            if c in guard and e["id"] not in keep: keep[e["id"]] = guard[c]
    pos = {e["id"]: (e["x"], e["y"]) for e in cand}
    grp = {e["id"]: group_of(P.pic_of(e)) for e in cand}
    # the neighbours (every object of the generator counts, the kept ones too)
    cell = collections.defaultdict(list)
    for i, (x, y) in pos.items(): cell[(int(x // SZUM_R), int(y // SZUM_R))].append(i)
    def near(i):
        x, y = pos[i]; cx, cy = int(x // SZUM_R), int(y // SZUM_R)
        return [j for ax in (cx - 1, cx, cx + 1) for ay in (cy - 1, cy, cy + 1) for j in cell.get((ax, ay), ())
                if j != i and (pos[j][0] - x) ** 2 + (pos[j][1] - y) ** 2 <= SZUM_R * SZUM_R]
    nb = {i: set(near(i)) for i in pos}
    rnd = random.Random(st["seed"] * 31 + 7)
    tie = {i: rnd.random() for i in pos}
    alive = set(pos)
    total = collections.Counter(grp.values())
    quota = {g: int(round(UBYTEK * total[g])) for g in GROUPS}
    gone = []
    def drop(i):
        alive.discard(i); gone.append(i)
        for j in nb[i]: nb[j].discard(i)
    removed = collections.Counter()
    # 1. the noise first: the loneliest
    noise = sorted([i for i in pos if i not in keep and len(nb[i]) <= SZUM_MAX], key=lambda i: (len(nb[i]), tie[i]))
    by_g = collections.defaultdict(list)
    for i in noise: by_g[grp[i]].append(i)
    for g, lst in by_g.items():
        for i in lst[:min(int(round(SZUM_CZESC * quota[g])), int(math.ceil(SZUM_DO * len(lst))))]:
            drop(i); removed[g] += 1
    n_noise = len(gone)
    # 2. the clumps: the most crowded one goes, group by group in turn
    while True:
        moved = False
        for g in GROUPS:
            if removed[g] >= quota[g]: continue
            pool = [i for i in alive if grp[i] == g and i not in keep]
            if not pool: continue
            i = max(pool, key=lambda i: (len(nb[i]), tie[i]))
            drop(i); removed[g] += 1; moved = True
        if not moved: break
    # the eagle's places: still out of reach on foot (as before)
    eagle = [s for s in spots if s.get("mode") == "eagle"]
    others = [e for e in events if e and e["id"] not in pos]
    entry = (st.get("entry") or ENTRY.get(mid))
    restored = []
    if eagle and entry:
        def reach(ids):
            walk, _ = walker(m, blocking_cells(others + [e for e in cand if e["id"] in ids]))
            return walk(entry)
        before = reach(set(pos))
        for _ in range(20):
            after = reach(alive)
            bad = [(s["key"], c) for s in eagle for c in map(tuple, s["cells"]) if c not in before and c in after]
            if not bad: break
            # put back the removed objects nearest to the opened places (5 at a time)
            back = sorted([i for i in gone if i not in alive], key=lambda i: min((pos[i][0] - c[0]) ** 2 + (pos[i][1] - c[1]) ** 2 for _, c in bad))[:5]
            for i in back: alive.add(i); restored.append(i); keep[i] = "orzeł"
        else:
            raise SystemExit("STOP: Map%03d - miejsca orła wciąż dostępne pieszo po przerzedzeniu" % mid)
    final_gone = [i for i in gone if i not in alive]
    before_clear = clearings(m, events, W0, H0)
    gone_set = set(final_gone)
    m["events"] = [None if (e and e["id"] in gone_set) else e for e in events]
    after_clear = clearings(m, m["events"], W0, H0)
    if final_gone: P.CHANGED.add(name)
    n_all_before = sum(1 for e in events if e)
    n_all_after = sum(1 for e in m["events"] if e)
    left = collections.Counter(grp[i] for i in alive)
    log("Map%03d: obiekty generatora %d -> %d (%s); zdarzenia razem %d -> %d; szum %d, chronione %d%s; polany 4x4 %d -> %d" % (
        mid, len(cand), len(alive), ", ".join("%s %d->%d" % (g, total[g], left[g]) for g in GROUPS if total[g]),
        n_all_before, n_all_after, n_noise, len(keep), (", przywrócone dla orła %d" % len(restored)) if restored else "", before_clear, after_clear))
    kinds = collections.Counter(keep.values())
    if kinds: log("  chronione: " + ", ".join("%s %d" % kv for kv in kinds.most_common()))
    return dict(st, przerzedzenie={"dnia": "2026-10-22", "obiekty": [len(cand), len(alive)], "zdarzenia": [n_all_before, n_all_after],
                                   "polany4x4": [before_clear, after_clear]})

ENTRY = {}
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("maps", nargs="*", type=int)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out")
    args = ap.parse_args()
    if not args.dry_run and not args.out: raise SystemExit("Użyj --out DIR (staging) albo --dry-run; do data/ pisze install.py ze stagingu.")
    state = json.load(open(STATE, encoding="utf-8"))
    okd = open(os.path.join(ROOT, "js", "plugins", "Okolice_Data.js"), encoding="utf-8").read()
    mo = re.search(r"const ENTRY = \{([^}]*)\}", okd)
    if mo:
        for k, x, y in re.findall(r"(\d+):\s*\[(\d+),\s*(\d+)\]", mo.group(1)): ENTRY[int(k)] = (int(x), int(y))
    maps = args.maps or sorted(int(k) for k in state)
    spots, refs = spots_by_map(), code_refs()
    lines, add = [], {}
    log = lambda s: (print(s), lines.append(s))
    for mid in maps:
        st = state.get(str(mid))
        if not st: raise SystemExit("STOP: Map%03d nie jest powiększona (stan.json)" % mid)
        if st.get("przerzedzenie"): raise SystemExit("STOP: Map%03d już przerzedzona (%s)" % (mid, st["przerzedzenie"]))
        add[str(mid)] = thin_map(mid, st, spots.get(mid, []), refs, log)
    if args.dry_run:
        print("(dry-run: nic nie zapisano; zmieniłyby się: %s)" % ", ".join(sorted(P.CHANGED))); return
    os.makedirs(args.out, exist_ok=True)
    sha = lambda b: hashlib.sha1(b).hexdigest()
    with open(os.path.join(args.out, "SHA.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("# plik\tsha1 nowej wersji\tsha1 obecnej w data/\n")
        for name in sorted(P.CHANGED):
            text = P.text_of(name, P.CACHE[name]).encode("utf-8")
            open(os.path.join(args.out, name), "wb").write(text)
            f.write("data/%s\t%s\t%s\n" % (name, sha(text), sha(open(os.path.join(P.DATA, name), "rb").read())))
    json.dump(add, open(os.path.join(args.out, "stan_dodaj.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(args.out, "raport.txt"), "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
    print("staging: %d plików -> %s" % (len(P.CHANGED), args.out))

if __name__ == "__main__":
    main()
