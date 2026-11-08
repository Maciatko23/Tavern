# -*- coding: utf-8 -*-
"""WYSPY na mapach z samym morzem (gracz 2026-11-07: „te mapy, gdzie jest kawałek lądu i mnóstwo wody, to można dorobić wyspę” -
„rób każdą na bazie mapy A”). Etap 1: LĄD. Obecny brzeg mapy zostaje, jak jest; w otwartym morzu nowy ląd otoczony wodą:
  - obrys organiczny (jak plamy map próbnych: wygładzony, bez zębów, proste odcinki łamane), grunt mapy A: trawa (A2 16), przy
    wodzie pas ziemi (A2 17, jak brzeg tych map - CzerwonaWoda rysuje z niego zaokrąglony brzeg z suchym pasem), nie przy krawędzi
    mapy (sąsiednie mapy bez zmian);
  - pieczątki wycięte z map wzorcowych gracza (tools/mapy/pieczatki/dane): wzgórze gracza z Map990 (wzorzec nr 1) bez zmian,
    plamy ziemi, drzewa i kamienie z pieczątek (zdarzenia jak w źródle - drzewa do ścinania), drzewa >= 4 kratki od wody;
  - mielizna: pas ziemi od brzegu do wyspy (etap 2: zalewana w przypływie, Wyspa.tide - jak łacha wraku).
Zdarzenia mapy zostają z numerami (zapisy); nowe dostają numery od największego + 1.
  python tools/wyspy/buduj.py 917              (kopia w tools/wyspy/staging/data + raport; nic w grze)
  python tools/wyspy/buduj.py 917 --wykonaj    (do data/ - TYLKO przy zamkniętym edytorze; kopie: tools/wyspy/kopie_zapasowe/<czas>)"""
import copy, datetime, json, math, os, random, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import numpy as np
import pieczatki as P
import mapylib as L
import wspolne as WS
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

GRASS, SHORE = 16, 17          # A2 kinds of tileset 11: grass, the shore's earth band
WATER_KINDS = range(0, 16)     # A1

# per map: the island (centre, radii, seed of the outline), what is laid on it (stamps: whole = ground and all; "events" = only its
# events, placed if their cells are free island ground), the sandbar (points from the shore to the island, its half width)
ISLANDS = {
    917: {"name": "Wyspa Kormoranów", "c": (54, 35), "r": (30, 17), "seed": 9173, "wob": 0.18,
          "core": [("gracz_wzgorze_990", 39, 25)],      # (the island holds it with 3 cells of shore all round)
          "stamps": [("gracz_wzgorze_990", 39, 25, "whole"), ("plama_ziemi_c", 41, 42, "whole"), ("plama_ziemi_b", 70, 28, "whole"),
                     ("kepa_sosen", 45, 26, "events"), ("kepa_sosen", 27, 30, "events"), ("kepa_sosen", 64, 40, "events"),
                     ("skraj_lasu", 24, 38, "events")],
          "rocks": [(40, 49), (45, 50), (51, 51), (58, 51), (64, 50), (70, 47), (33, 46)],
          "bar": [(48, 4), (49, 10), (50, 17), (51, 24)], "bar_w": 1.3, "bar_region": 61},
    # (each different: a hill of the user's Góry, a dense wood, a stony islet, a sea stack, another hill of Góry, a single pine)
    920: {"name": "wyspa z okrągłym wzgórzem", "c": (36, 22), "r": (15, 12), "seed": 9201, "wob": 0.2,
          "core": [("c_wzgorze_013_a", 27, 13)],
          "stamps": [("c_wzgorze_013_a", 27, 13, "whole"), ("kepa_sosen", 38, 10, "events"), ("kepa_sosen", 22, 24, "events")],
          "things": [("!$Rock_Flat", 45, 29), ("!$Rock_Pile", 26, 31), ("!$Bush_Bare_Thicket", 47, 20)]},
    922: {"name": "leśna wyspa", "c": (34, 19), "r": (17, 12), "seed": 9221, "wob": 0.22,
          "stamps": [("las_geste_gory", 21, 5, "events"), ("kepa_sosen", 37, 19, "events")],
          "things": [("!$Bush_Bare_Wide", 27, 27), ("!$Bush_Bare_A", 43, 12), ("!$Rock_Cracked", 46, 25), ("!$Trunk_Dead", 24, 14)]},
    923: {"name": "kamienista wysepka", "c": (25, 20), "r": (9, 6), "seed": 9231, "wob": 0.25,
          "things": [("!$Rock_Cairn", 25, 19), ("!$Rock_Flat", 21, 21), ("!$Rock_Pile", 29, 21), ("!$Rock_Chunk", 23, 23), ("!$Tree_Small", 28, 18)]},
    935: {"name": "skalna iglica", "c": (15, 11), "r": (7, 6), "seed": 9351, "wob": 0.12,
          "plateau": {"top": (11, 6, 19, 12), "stairs": None}},
    951: {"name": "skała pod strażnicę", "c": (22, 19), "r": (14, 11), "seed": 9512, "wob": 0.18,
          "plateau": {"top": (12, 10, 31, 21), "stairs": (21, 22)},      # (a rock like a keep: high, its stairs to the south)
          "stamps": [("kepa_sosen", 13, 11, "events")],
          "things": [("!$Pine_C", 27, 13), ("!$Rock_Mound", 10, 25), ("!$Rock_Flat", 33, 24), ("!$Rock_Pile", 16, 27), ("!$Bush_Bare_A", 28, 27)]},
    # Sosnowy Klif: three skerries off the pine cliff - rocks for the gulls, out of reach (a view from the shore)
    910: {"name": "szkiery pod Sosnowym Klifem", "isles": [((30, 54), (4, 2.6), 9101, 0.25), ((60, 55), (5, 3), 9102, 0.25), ((92, 42), (3.5, 2.4), 9103, 0.25)],
          "things": [("!$Rock_Pile", 30, 54), ("!$Rock_Flat", 59, 55), ("!$Rock_Cracked", 62, 54), ("!$Rock_Chunk", 92, 42)]},
    918: {"name": "wysepka z jedną sosną", "c": (28, 12), "r": (6, 4), "seed": 9181, "wob": 0.18,
          "bar": [(29, 16), (30, 21), (31, 27)], "bar_w": 1.2, "bar_region": 61,
          "things": [("!$Pine_A", 28, 12), ("!$Rock_Flat", 25, 13), ("!$Rock_Chunk", 31, 11)]},
}

# the user's hill grammar (his hill nr 1 on Map990, grass-topped A5 of tileset 11): rim, sides, lip, two rows of face, stairs
G5 = dict(rimL=88, rim=89, rimR=90, sideL=96, sideR=98, lipL=104, lip=105, lipR=106, f1L=112, f1=113, f1R=114, f2L=120, f2=121, f2R=122,
          v1=(73, 74), v2=(81, 82), stL=24, stR=26)


def plateau_tiles(top, stairs, seed):
    """{(x, y): A5 index or None (the top's ground)} of a closed plateau: rim row y0, lip row y1, the face y1+1, y1+2"""
    x0, y0, x1, y1 = top
    sx = stairs or (-99, -99)
    out = {}
    for y in range(y0, y1 + 3):
        for x in range(x0, x1 + 1):
            S = G5
            if y == y0: t = S["rimL"] if x == x0 else S["rimR"] if x == x1 else S["rim"]
            elif y < y1: t = S["sideL"] if x == x0 else S["sideR"] if x == x1 else None
            elif y == y1: t = None if x in sx else S["lipL"] if x == x0 else S["lipR"] if x == x1 else S["lip"]
            else:
                row = y - y1
                if x in sx: t = S["stL"] if x == sx[0] else S["stR"]
                elif row == 1: t = S["f1L"] if x in (x0, sx[1] + 1) else S["f1R"] if x in (x1, sx[0] - 1) else S["f1"]
                else: t = S["f2L"] if x == x0 else S["f2R"] if x == x1 else S["f2"]
                if t in (S["f1"], S["f2"]):
                    r = random.Random(seed * 1000 + x).random()
                    if 0 < x - x0 < x1 - x0 and r < 0.18: t = (S["v1"] if row == 1 else S["v2"])[0 if r < 0.09 else 1]
            out[(x, y)] = t
    return out


# ------------------------------------------------------------------ shapes (as the test maps' builder: tools/mapa_probna/zbuduj.py)
def wygladz(cells, ile=2):
    cs = set(cells)
    for _ in range(ile):
        kand = {(x + dx, y + dy) for (x, y) in cs for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
        nowe = set()
        for (x, y) in kand:
            n = sum(((x + dx, y + dy) in cs) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)
            if ((x, y) in cs and n >= 3) or ((x, y) not in cs and n >= 5): nowe.add((x, y))
        cs = nowe
    return cs


def lam_proste(cells, maks=4, rundy=8):
    cs = set(cells)
    for _ in range(rundy):
        zm = False
        for os_, sg in ((0, 1), (0, -1), (1, 1), (1, -1)):
            edge = {}
            for (x, y) in cs:
                key, v = (x, sg * y) if os_ == 0 else (y, sg * x)
                if key not in edge or v < edge[key]: edge[key] = v
            ks = sorted(edge); i = 0
            while i < len(ks):
                j = i
                while j + 1 < len(ks) and ks[j + 1] == ks[j] + 1 and edge[ks[j + 1]] == edge[ks[i]]: j += 1
                if j - i + 1 > maks:
                    mid = ks[(i + j) // 2]; v = edge[ks[i]] - 1
                    for q in (0, 1): cs.add((mid + q, sg * v) if os_ == 0 else (sg * v, mid + q))
                    zm = True
                i = j + 1
        if not zm: break
    return cs


def organiczna(cx, cy, rx, ry, seed, wob=0.2):
    r = random.Random(seed)
    ph = [r.uniform(0, 6.28) for _ in range(4)]
    cs = set()
    for y in range(int(cy - ry * 1.5) - 2, int(cy + ry * 1.5) + 3):
        for x in range(int(cx - rx * 1.5) - 2, int(cx + rx * 1.5) + 3):
            dx, dy = (x - cx) / rx, (y - cy) / ry
            a = math.atan2(dy, dx)
            w = 1 + wob * (0.5 * math.sin(2 * a + ph[0]) + 0.3 * math.sin(3 * a + ph[1]) + 0.2 * math.sin(5 * a + ph[2]))
            if abs(dx) ** 2 + abs(dy) ** 2 <= w ** 2: cs.add((x, y))
    return wygladz(cs, 2)   # (no breaking of straight runs: the coast is rounded by CzerwonaWoda - bumps made it look crenellated)


def pas(pts, hw):
    """cells of a band along a polyline, half width hw"""
    out = set()
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = int(max(abs(bx - ax), abs(by - ay)) * 3) + 1
        for k in range(n + 1):
            t = k / n; px, py = ax + (bx - ax) * t, ay + (by - ay) * t
            for y in range(int(py - hw) - 1, int(py + hw) + 2):
                for x in range(int(px - hw) - 1, int(px + hw) + 2):
                    if (x - px) ** 2 + (y - py) ** 2 <= hw * hw: out.add((x, y))
    return out


def build(mid, base=None):
    """base: the map as it was before its island (a backup) - built again from it; the map's own later changes kept (its name in the
    game, its events' names)"""
    cfg = ISLANDS[mid]
    path = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    raw = open(base or path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if WS.map_text(m).encode("utf-8") != raw: raise SystemExit("Map%03d nie jest w układzie edytora - nie ruszam" % mid)
    W, H = m["width"], m["height"]
    a = np.array(m["data"], dtype=np.int32).reshape(6, H, W)
    kind = lambda t: (t - 2048) // 48 if t >= 2048 else None
    is_water = lambda x, y: kind(int(a[0, y, x])) is not None and kind(int(a[0, y, x])) in WATER_KINDS
    report = []
    # the island: in the open sea, 3 cells off the map's edges and 4 off the land there is
    land0 = {(x, y) for y in range(H) for x in range(W) if not is_water(x, y)}
    near_land = P.pierscien(land0, 4)
    blob = set(organiczna(*cfg["c"], *cfg["r"], cfg["seed"], cfg.get("wob", 0.2))) if cfg.get("c") else set()
    for (c, r, sd, wb) in cfg.get("isles", []): blob |= set(organiczna(c[0], c[1], r[0], r[1], sd, wb))   # (several small ones: skerries)
    for (name, sx, sy) in cfg.get("core", []):   # a stamp the island must hold: its cells and 3 round them
        p = P.wczytaj_pieczatke(name)
        kr = {(sx + i, sy + j) for j in range(p["h"]) for i in range(p["w"]) if p["maska"][j * p["w"] + i]}
        blob |= P.pierscien(kr, 3)
    pl = cfg.get("plateau")
    if pl: blob |= P.pierscien(set(plateau_tiles(pl["top"], pl["stairs"], cfg["seed"])), 1)
    isl = {c for c in wygladz(blob, 3) if 3 <= c[0] < W - 3 and 3 <= c[1] < H - 3 and c not in near_land}
    isl = wygladz(isl, 1) & isl
    bar = set()
    if cfg.get("bar"):
        bar = {c for c in pas(cfg["bar"], cfg["bar_w"]) if 0 <= c[0] < W and 0 <= c[1] < H and is_water(*c)}
        bar = wygladz(bar | {c for c in P.pierscien(bar, 1) if c in isl}, 1) - isl
        bar = {c for c in bar if is_water(*c)}
    new_land = isl | bar
    # ground: grass inside, the shore's earth band (2 cells) by the water, the sandbar earth
    def water_dist(x, y, r=2):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                c = (x + dx, y + dy)
                if c not in new_land and c not in land0: return True
        return False
    for (x, y) in new_land:
        for z in range(1, 5): a[z, y, x] = 0
        a[5, y, x] = cfg.get("bar_region", 0) if (x, y) in bar else 0   # (the sandbar's region: under water but at low tide - Wrak.js FLOOD)
        a[0, y, x] = 2048 + 48 * (SHORE if (x, y) in bar or water_dist(x, y) else GRASS)
    # the stamps (the user's own pieces): whole ones lay their cells and events, "events" ones only their events
    evs = [e for e in m["events"] if e]
    next_id = max(e["id"] for e in evs) + 1
    taken = {}
    for e in evs:
        for (dx, dy) in P.stopa(e): taken[(e["x"] + dx, e["y"] + dy)] = e["id"]
    hill_cells, new_events, stamped = set(), [], set()
    if pl:
        for (x, y), t in plateau_tiles(pl["top"], pl["stairs"], cfg["seed"]).items():
            if t is not None:
                a[0, y, x] = 1536 + t; a[1, y, x] = 0; hill_cells.add((x, y))
            else: a[0, y, x] = 2048 + 48 * GRASS
            stamped.add((x, y))
        report.append("  płaskowyż %s, schody %s" % (pl["top"], pl["stairs"] or "brak (tylko orzeł)"))
    def add_event(ev, x, y, need_free_ground=True):
        nonlocal next_id
        cells = [(x + dx, y + dy) for (dx, dy) in P.stopa(ev)]
        if any(c in taken for c in cells): return False
        if need_free_ground and any(c not in isl or c in hill_cells or water_dist(*c, 3) for c in cells): return False
        e = copy.deepcopy(ev); e["id"] = next_id; e["x"] = x; e["y"] = y
        next_id += 1
        new_events.append(e)
        for c in cells: taken[c] = e["id"]
        return True
    for (name, sx, sy, mode) in cfg.get("stamps", []):
        p = P.wczytaj_pieczatke(name)
        w, h = p["w"], p["h"]
        placed = 0
        if mode == "whole":
            kr = set()
            for j in range(h):
                for i in range(w):
                    if p["maska"][j * w + i]: kr.add((sx + i, sy + j))
            bad = [c for c in kr if c not in isl]
            if bad: report.append("  UWAGA pieczątka %s wystaje poza wyspę w %d kratkach - pominięta" % (name, len(bad))); continue
            for (cx, cy) in kr:
                i, j = cx - sx, cy - sy
                for z in range(4):
                    v = p["warstwy"][z][j * w + i]
                    if z == 0 and v == 0 and p.get("zachowaj_grunt"): continue
                    a[z, cy, cx] = v
                a[4, cy, cx] = p["cienie"][j * w + i]
                a[5, cy, cx] = p["regiony"][j * w + i]
                if a[0, cy, cx] == 0: a[0, cy, cx] = 2048 + 48 * p["tlo"]
                if 1536 <= int(a[0, cy, cx]) < 1664: hill_cells.add((cx, cy))
            stamped |= kr
        for d in p["zdarzenia"]:
            if add_event(d["ev"], sx + d["dx"], sy + d["dy"]): placed += 1
        report.append("  pieczątka %-18s w (%d,%d) %-6s zdarzeń %d/%d" % (name, sx, sy, mode, placed, len(p["zdarzenia"])))
    # the cormorants' rocks on the shore (events of map A's own rocks - the mineable kinds, no barriers)
    a_map = json.loads(open(os.path.join(ROOT, "data", "Map990.json"), "rb").read().decode("utf-8"))
    rock_t = [e for e in a_map["events"] if e and e["pages"][0]["image"]["characterName"] in ("!$Rock_Flat", "!$Rock_Pile", "!$Rock_Cracked", "!$Rock_Chunk") and "<Zapora" not in (e.get("note") or "")]
    rocks = 0
    for k, (x, y) in enumerate(cfg.get("rocks", [])):
        if (x, y) in isl and (x, y) not in hill_cells and add_event(rock_t[k % len(rock_t)], x, y, need_free_ground=False): rocks += 1
    if cfg.get("rocks"): report.append("  skały na brzegu: %d" % rocks)
    things = 0
    for (name, x, y) in cfg.get("things", []):
        t = next((e for e in a_map["events"] if e and e["pages"][0]["image"]["characterName"] == name and "<Zapora" not in (e.get("note") or "")), None)
        if t is None: report.append("  UWAGA brak wzoru %s na mapie A" % name); continue
        tree = name.startswith("!$Pine") or name.startswith("!$Tree")
        if (x, y) in isl and (x, y) not in hill_cells and add_event(t, x, y, need_free_ground=tree): things += 1
        else: report.append("  nie postawione: %s (%d,%d)" % (name, x, y))
    if cfg.get("things"): report.append("  rzeczy z mapy A: %d/%d" % (things, len(cfg["things"])))
    # the autotiles round all that changed (the sea's edge too)
    ring = P.pierscien(new_land, 2)
    band = {c for c in ring if not (c in stamped and all((c[0] + dx, c[1] + dy) in stamped for dx in (-1, 0, 1) for dy in (-1, 0, 1)))}
    for z in (0, 1): P.przelicz_warstwe(a[z], band)
    m["data"] = [int(v) for v in a.reshape(-1)]
    m["events"] = m["events"] + new_events
    # checks: the island reached (over the sandbar), nothing that was reached lost, the events on land, trees off the water
    # (a map joined to its neighbours only by the world's seams has no transfer events: the walkable land on its edges is where one comes)
    before = L.Mapa(mid, raw=json.loads(raw.decode("utf-8")))
    starts = before.starty() or [(x, y) for y in range(H) for x in range(W) if (x in (0, W - 1) or y in (0, H - 1)) and before.stoi(x, y)]
    r0 = before.flood(starts)
    after = L.Mapa(mid, raw=m); r1 = after.flood(starts)
    on = sum(1 for c in isl if c in r1)
    lost = sorted(r0 - r1)
    report.append("  wyspa: %d kratek (w tym wzgórze %d), mielizna %d; osiągalne na wyspie %d; utracone gdzie indziej %d %s" %
                  (len(isl), len(hill_cells), len(bar), on, len(lost), lost[:8]))
    wet = [e["id"] for e in new_events if is_water(e["x"], e["y"]) and (e["x"], e["y"]) not in new_land]
    report.append("  nowe zdarzenia %d (numery %d-%d), w wodzie: %s" % (len(new_events), new_events[0]["id"] if new_events else 0, next_id - 1, wet or "żadne"))
    ok = (on > len(isl) // 3 if bar else True) and not lost and not wet
    return m, raw, report, ok


if __name__ == "__main__":
    mid = int(sys.argv[1])
    base = sys.argv[sys.argv.index("--baza") + 1] if "--baza" in sys.argv else None
    m, raw, report, ok = build(mid, base)
    if base:   # (what the map got after its island: the name in the game, the events' names)
        cur_raw = open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb").read()
        cur = json.loads(cur_raw.decode("utf-8"))
        m["displayName"] = cur["displayName"]
        names = {e["id"]: e["name"] for e in cur["events"] if e}
        for e in m["events"]:
            if e and e["id"] in names: e["name"] = names[e["id"]]
        raw = cur_raw
    print("Map%03d - %s" % (mid, ISLANDS[mid]["name"]))
    for r in report: print(r)
    out = WS.map_text(m).encode("utf-8")
    if "--wykonaj" in sys.argv:
        if not ok: raise SystemExit("sprawdzenia nie przeszły - nic nie zapisano")
        WS.need_editor_closed()
        kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
        os.makedirs(kop, exist_ok=True)
        open(os.path.join(kop, "Map%03d.json" % mid), "wb").write(raw)
        open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "wb").write(out)
        print("zapisane do data/; kopia:", kop)
    else:
        os.makedirs(STG, exist_ok=True)
        open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(out)
        print("WYNIK:", "ok" if ok else "BŁĄD", "- kopia w", STG)
