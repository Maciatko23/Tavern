# -*- coding: utf-8 -*-
"""Krok 1b planszy: teren na NOWYM lądzie 9 map (po przesun.py i wyspa.py). Na kratkach dorobionych (staging/nowe_<id>.json), które
zostały lądem (staging/lad.json), kładzie PIECZĄTKI - gotowe, zakończone kawałki wycięte z map wzorcowych gracza
(tools/mapy/pieczatki: wzgórza, lasy, plamy ziemi, sady, skały, koryto, kępy sosen) - z doborem pod charakter mapy (MOTYW):
  - pieczątka cała na nowym lądzie, >= OD_WODY kratek od morza (pas brzegu zostaje pusty - CzerwonaWoda rysuje tam kamienie, ziemię i
    suchą trawę), >= 2 kratki od starej treści mapy i od innych pieczątek;
  - zestaw kafli: pieczątka z tego samego zestawu albo bez kafli, których drugi zestaw nie ma (arkusze C / E, rodzaje A2 34/35/46/47);
  - zdarzenia (drzewa do ścinania, kamienie, krzaki) z pieczątek - tylko w budżecie wolnych numerów 1-499 mapy (stare numery
    zdarzeń zostają: zapisy gry); pieczątka, której zdarzenia się nie zmieszczą, idzie bez nich tylko, gdy nie jest lasem;
  - kształty autokafli przeliczone na styku (Plotno.wstaw).
  python tools/plansza/teren.py [mapa ...]     (wszystkie 9 bez numerów; pisze tools/plansza/staging/data)"""
import json, os, random, sys
import numpy as np
from plansza import ROOT, N, BOARD, STG, W
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import pieczatki as P
OUT = os.path.join(STG, "data")
OD_WODY, ODSTEP, PROB = 7, 2, 250
GRANICA = 12   # (gracz 2026-11-08: „żeby nie było wzgórz pomiędzy przejściami map” - no hill / cliff / rock stamp this near a border with
               # another map of the board)
WZGORZA = {"gracz_wzgorze_990", "wzgorze_a", "wzgorze_b", "wzgorze_c", "c_wzgorze_003", "c_wzgorze_013_a", "c_wzgorze_013_b",
           "wzgorze_ruiny_jar", "cypel_trzy_poziomy", "kamieniolom_polki", "kamieniolom_schody", "polka_dluga_schody", "polka_prosta_a", "skaly_rumowisko"}
# per map: (stamp, weight, at most) - the map's character
LAS = ["las_geste_gory", "las_geste_jar"]
MOTYW = {
    162: [("plama_ziemi_a", 3, 2), ("plama_ziemi_b", 3, 2), ("skaly_rumowisko", 2, 1), ("kepa_sosen", 4, 4), ("skraj_lasu", 2, 1), ("c_plama_013_1", 2, 2)],
    24: [("sad_jabloni", 5, 3), ("kepa_sosen", 4, 3), ("plama_ziemi_159", 2, 1), ("skraj_lasu", 3, 1), ("sciezka_zakret", 1, 1), ("gracz_wzgorze_990", 2, 1)],
    13: [("c_wzgorze_013_a", 4, 1), ("c_wzgorze_013_b", 4, 1), ("skaly_rumowisko", 3, 2), ("las_geste_gory", 2, 1), ("c_plama_013_0", 2, 1), ("c_plama_013_2", 2, 1)],
    111: [("plama_ziemi_c", 3, 2), ("kepa_sosen", 4, 3), ("sad_jabloni", 3, 2), ("plama_ziemi_159", 2, 1), ("koryto_suche", 1, 1)],
    8: [("kepa_sosen", 3, 2), ("plama_ziemi_c", 2, 1), ("sad_jabloni", 2, 1)],
    4: [("las_geste_gory", 4, 2), ("las_geste_jar", 3, 1), ("gracz_wzgorze_990", 3, 1), ("koryto_suche", 3, 1), ("kepa_sosen", 4, 4), ("skraj_lasu", 3, 2), ("plama_ziemi_a", 2, 2), ("skaly_rumowisko", 2, 1)],
    125: [("kepa_sosen", 4, 3), ("plama_ziemi_b", 3, 2), ("skraj_lasu", 2, 1), ("plama_ziemi_c", 2, 1)],
    3: [("c_wzgorze_003", 3, 1), ("wzgorze_ruiny_jar", 2, 1), ("las_geste_jar", 4, 2), ("sad_jabloni", 3, 2), ("skaly_rumowisko", 2, 1), ("kepa_sosen", 4, 3), ("koryto_suche", 2, 1), ("plama_ziemi_a", 2, 2)],
    20: [("las_geste_jar", 4, 2), ("sad_jabloni", 4, 2), ("kepa_sosen", 4, 3), ("plama_ziemi_b", 2, 2), ("skaly_rumowisko", 2, 1), ("c_wzgorze_003", 2, 1)],
}


# the A2 kinds the two tilesets draw differently (9 vs 11: 34, 35, 46, 47): the nearest kind by colour with the same passability
_TS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
_col = {}
def kolor(tsid, k):
    if (tsid, k) not in _col:
        from PIL import Image
        img = Image.open(os.path.join(ROOT, "img", "tilesets", _TS[tsid]["tilesetNames"][1] + ".png")).convert("RGB")
        r = k - 16; bx, by = (r % 8) * 96, (r // 8) * 144
        a = np.asarray(img.crop((bx + 24, by + 72, bx + 72, by + 120))).reshape(-1, 3).mean(0)
        fl = _TS[tsid]["flags"]; i = 2048 + k * 48
        _col[(tsid, k)] = (a, (fl[i] if i < len(fl) else 0) & 0x0f)   # (tileset 9 lists no flags past A1: passable)
    return _col[(tsid, k)]
def zamiennik(k, src, dst):
    c0, b0 = kolor(src, k)
    best = min((float(((kolor(dst, k2)[0] - c0) ** 2).sum()), k2) for k2 in range(16, 48) if k2 not in (34, 35, 46, 47) and kolor(dst, k2)[1] == b0)
    return best[1]
def dopasuj(p, tsid):
    """the stamp in this tileset: None when it needs the C / E sheets (tileset 9 has none), else a copy with the unlike A2 kinds swapped"""
    q = json.loads(json.dumps(p))
    if p["tsid"] == tsid:
        if tsid == 9:
            for z in (0, 1):
                L = q["warstwy"][z]
                for i, v in enumerate(L):
                    if 2048 + 40 * 48 <= v < 2048 + 44 * 48: L[i] = 2048 + 27 * 48 + (v - 2048) % 48
        return q
    for z in range(4):
        L = q["warstwy"][z]
        for i, v in enumerate(L):
            if 256 <= v < 512 or 768 <= v < 1024:
                if tsid == 9: return None
            if 2048 + 16 * 48 <= v < 2048 + 48 * 48:
                k = (v - 2048) // 48
                if tsid == 9 and k in (34, 35):   # (the grey rubble: the meadow maps have none - their own earth patches, kind 27)
                    L[i] = 2048 + 27 * 48 + (v - 2048) % 48; continue
                if k in (34, 35, 46, 47): L[i] = 2048 + zamiennik(k, p["tsid"], tsid) * 48 + (v - 2048) % 48
    q["tsid"] = tsid
    if tsid == 9:   # (no cobbles nor streets on the meadow maps - whatever a stamp's kind was mapped to: their earth, kind 27)
        for z in (0, 1):
            L = q["warstwy"][z]
            for i, v in enumerate(L):
                if 2048 + 40 * 48 <= v < 2048 + 44 * 48: L[i] = 2048 + 27 * 48 + (v - 2048) % 48
    return q


_op = {}
def krycie(tsid, k):   # how much of an A2 kind's sheet block is opaque (a full ground ~1, an overlay - tufts, flowers - well under)
    if (tsid, k) not in _op:
        from PIL import Image
        img = Image.open(os.path.join(ROOT, "img", "tilesets", _TS[tsid]["tilesetNames"][1] + ".png")).convert("RGBA")
        r = k - 16; bx, by = (r % 8) * 96, (r // 8) * 144
        _op[(tsid, k)] = float((np.asarray(img.crop((bx, by, bx + 96, by + 144)))[..., 3] > 128).mean())
    return _op[(tsid, k)]
def grunt_na_dol(p):
    """(gracz 2026-11-08 on Łąka pod Gawrą: „kanciasto i sztywno”) a full ground kind on layer 1 - grey rubble, cobbles, earth - is drawn
    with the autotile's square edges over the grass; on the GROUND layer Ziemia.js redraws its border as a soft, uneven line. So every
    full ground of the stamp's layer 1 goes down to layer 0 (overlays - tufts, flowers, small stones - stay on layer 1)"""
    w = p["w"]
    for i, v in enumerate(p["warstwy"][1]):
        if 2048 + 23 * 48 <= v < 2048 + 24 * 48: p["warstwy"][1][i] = 0; continue   # (gracz 2026-11-08: „wywal te dziwne płotki kamienne”)
        if 2048 + 16 * 48 <= v < 2048 + 48 * 48 and krycie(p["tsid"], (v - 2048) // 48) >= 0.95:
            p["warstwy"][0][i] = 2048 + ((v - 2048) // 48) * 48
            p["warstwy"][1][i] = 0
    return p


import math
NAT_EV = ("Pine", "Tree", "Big_Trees", "Bush", "Sapling", "Rock", "Boulder", "Stump", "Log", "Trunk", "Fern", "Mushroom", "Flower", "Grass")
def organiczna(p, rnd, name):
    """(gracz 2026-11-08 on the whole island's picture: „stempelki ... wycinki mapy losowo” - square forests, patches with straight
    edges) a stamp that is not a hill takes a rounded, uneven shape inside its window: a wobbly ellipse (a few waves round it, its own
    for every copy); outside it nothing of the stamp is laid (the ground there stays the map's own); its trees, bushes and stones thin
    out towards the rim (fewer the nearer the edge), so a forest ends in single trees, not in a straight row"""
    if name in WZGORZA: return p
    p = json.loads(json.dumps(p))
    w, h = p["w"], p["h"]
    cx, cy, rx, ry = (w - 1) / 2.0, (h - 1) / 2.0, max(1.0, w / 2.0), max(1.0, h / 2.0)
    ph = [rnd.uniform(0, 6.283) for _ in range(3)]
    amp = [rnd.uniform(0.08, 0.14), rnd.uniform(0.05, 0.09), rnd.uniform(0.03, 0.06)]
    def rr(i, j):   # (the cell's distance from the middle against the wobbly rim: < 1 inside)
        dx, dy = (i - cx) / rx, (j - cy) / ry
        a = math.atan2(dy, dx)
        edge = 0.84 + amp[0] * math.sin(2 * a + ph[0]) + amp[1] * math.sin(3 * a + ph[1]) + amp[2] * math.sin(5 * a + ph[2])
        return math.hypot(dx, dy) / edge
    for j in range(h):
        for i in range(w):
            if p["maska"][j * w + i] and rr(i, j) > 1.0: p["maska"][j * w + i] = 0
    keep = []
    for d in p.get("zdarzenia", []):
        i, j = d["dx"], d["dy"]
        if not (0 <= i < w and 0 <= j < h) or not p["maska"][j * w + i]: continue
        pic = d["ev"]["pages"][0]["image"]["characterName"] or ""
        r = rr(i, j)
        if any(k in pic for k in NAT_EV) and r > 0.62 and rnd.random() > (1.0 - r) / 0.38 * 0.85 + 0.1: continue   # (thinner to the rim)
        keep.append(d)
    p["zdarzenia"] = keep
    return p


# (gracz 2026-11-08 on the whole island: „ładnie, równo i różnorodnie”) copies of the player's hills stood in the new fields like small
# pedestals, the same shape again and again: no hill stamps on the new land (the mountains' own excepted - Góry have no new land now)
for _mid in MOTYW:
    if _mid != 13: MOTYW[_mid] = [e for e in MOTYW[_mid] if e[0] not in WZGORZA or e[0] == "skaly_rumowisko"]
lad = {int(k): {tuple(c) for c in v} for k, v in json.load(open(os.path.join(STG, "lad.json"))).items()}
only = [int(a) for a in sys.argv[1:] if a.isdigit()] or list(BOARD)
for mid in only:
    raw = json.load(open(os.path.join(OUT, "Map%03d.json" % mid), encoding="utf-8"))
    fresh = {tuple(c) for c in json.load(open(os.path.join(STG, "nowe_%d.json" % mid)))["fresh"]}
    land = lad[mid]
    ts = raw["tilesetId"]
    # the sea's distance (cells), the area the stamps may take
    water = np.ones((N, N), np.uint8)
    for (x, y) in land: water[y, x] = 0
    import cv2
    dist = cv2.distanceTransform((1 - water).astype(np.uint8), cv2.DIST_L2, 3)
    old = {(x, y) for y in range(N) for x in range(N)} - fresh
    near_old = W.ring(old, ODSTEP) if old else set()
    from plansza import RESERWA
    area = {c for c in fresh & land if dist[c[1], c[0]] >= OD_WODY and c not in near_old
            and not any(x0 <= c[0] <= x1 and y0 <= c[1] <= y1 for (x0, y0, x1, y1) in RESERWA.get(mid, []))}
    # the canvas with the map as it is; the old events occupy their cells (they stay with their numbers)
    pl = P.Plotno(N, N, ts)
    pl.a = np.array(raw["data"], dtype=np.int32).reshape(6, N, N)
    for e in raw["events"]:
        if e:
            for (dx, dy) in P.stopa(e): pl.zajete[(e["x"] + dx, e["y"] + dy)] = -1
    used = {e["id"] for e in raw["events"] if e}
    free_ids = [i for i in range(1, 500) if i not in used]
    budget = max(0, len(free_ids) - 15)
    rnd = random.Random(1000 + mid)
    taken, placed, n_ev = set(), [], 0
    pool = []
    PASSES = 3   # (the pool goes round a few times: every stamp gets its chances on what is left)
    for name, wgt, most in MOTYW.get(mid, []):
        p = dopasuj(P.wczytaj_pieczatke(name), ts)
        if p is None: continue
        p = grunt_na_dol(json.loads(json.dumps(p)))
        pool += [(name, p)] * (wgt * PASSES)
    counts = {}
    rnd.shuffle(pool)
    for name, p in sorted(pool, key=lambda np_: -np_[1]["w"] * np_[1]["h"] + rnd.random()):   # (big ones first: they need room)
        most = dict((a, c) for a, b, c in MOTYW[mid])[name]
        if len(p.get("zdarzenia", [])) <= 5: most *= 3   # (stamps of ground and hills: little to update, the big empty grass needs them)
        if counts.get(name, 0) >= most: continue
        w, h = p["w"], p["h"]
        mask = [(i, j) for j in range(h) for i in range(w) if p["maska"][j * w + i]]
        evn = len(p.get("zdarzenia", []))
        with_ev = n_ev + evn <= budget
        if not with_ev and (name in LAS or evn > 5): continue   # (a forest, an orchard, a rubble without its trees / stones: nothing but bare ground)
        col, row = BOARD[mid][0], BOARD[mid][1]
        def near_border(x, y):   # (the cell's distance to a side shared with another map of the board)
            return ((col > 0 and x < GRANICA) or (col < 2 and x >= N - GRANICA) or (row > 0 and y < GRANICA) or (row < 2 and y >= N - GRANICA))
        cands = [c for c in area if c[0] + w <= N and c[1] + h <= N]
        if name in WZGORZA:
            cands = [c for c in cands if not any(near_border(c[0] + i, c[1] + j) for (i, j) in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)))]
        if not cands: continue
        for _ in range(PROB):
            x, y = rnd.choice(cands)
            cells = {(x + i, y + j) for (i, j) in mask}
            if not cells <= area or cells & taken: continue
            ring = W.ring(cells, ODSTEP)
            if ring & taken: continue
            q = organiczna(p, rnd, name)
            if with_ev: n_ev += len(q.get("zdarzenia", [])) - evn
            pl.wstaw(q, x, y, zdarzenia=with_ev, nadpisz_zdarzenia=False)
            taken |= ring
            counts[name] = counts.get(name, 0) + 1
            if with_ev: n_ev += evn
            placed.append("%s(%d,%d)%s" % (name, x, y, "" if with_ev else " bez zdarzeń"))
            break
    # the new events: free numbers 1-499, the old ones untouched
    new_events = [e for e in pl.ev]
    out_ev = list(raw["events"])
    k = 0
    for e in sorted(new_events, key=lambda e: (e["y"], e["x"])):
        if k >= len(free_ids): break
        i = free_ids[k]; k += 1
        d = json.loads(json.dumps(e["ev"]))
        ne = {"id": i, "name": d.get("name", ""), "note": d.get("note", ""), "pages": d["pages"], "x": e["x"], "y": e["y"]}
        while len(out_ev) <= i: out_ev.append(None)
        out_ev[i] = ne
    raw["data"] = [int(v) for v in pl.a.reshape(-1)]
    raw["events"] = out_ev
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(raw).encode("utf-8"))
    print("Map%03d: obszar %d kratek, pieczątek %d, nowych zdarzeń %d (budżet %d): %s" % (mid, len(area), len(placed), k, budget, ", ".join(placed)))
