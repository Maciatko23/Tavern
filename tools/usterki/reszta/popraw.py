# -*- coding: utf-8 -*-
"""Usterki (przeglad ekranow 2026-11-11), mapy "reszta": 24, 4, 3, 20, 168, 175, 120(+121-124), 213, 1.
Odbudowuje z biezacego data/ -> tools/usterki/reszta/staging/data/MapNNN.json (nic w data/).  python popraw.py [id ...]"""
import os, sys, json, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import numpy as np
import wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging", "data")
at, put, reshape, ring = WS.at, WS.put, WS.reshape, WS.ring
GRASS = 2816            # A2 kind 16 shape 0

def load(mid):
    o, lay = WS.read_json("data/Map%03d.json" % mid); assert lay == "map"; return o
def save(m, mid):
    os.makedirs(STG, exist_ok=True)
    txt = WS.map_text(m).encode("utf-8")
    assert WS.map_text(json.loads(txt.decode("utf-8"))).encode("utf-8") == txt
    for i, e in enumerate(m["events"]): assert e is None or e["id"] == i, (mid, i)
    open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(txt)
def ev(m, i): return m["events"][i]
def clear(m, z, cells):
    for (x, y) in cells: put(m, z, x, y, 0)

# ---------------------------------------------------------------- Map024 Posiadlosc Lorda
def fix024(m):
    # (15,118) drewniany plot (A2-22) namalowany na licu poludniowego muru, wiersz 119
    clear(m, 1, [(x, 119) for x in range(15, 21)])
    # (29,119) krzaczki B-E 559 namalowane na licu muru, wiersz 119
    clear(m, 3, [(x, 119) for x in range(29, 38)])
    # (98,56) cienka kamienna listwa A5 (1536-1663) przez laka, niczego nie ogradza: zamiana na trawe
    cells = [(x, y) for y in range(m["height"]) for x in range(m["width"]) if 1536 <= at(m, 0, x, y) < 1664]
    for (x, y) in cells: put(m, 0, x, y, GRASS)
    reshape(m, 0, ring(cells, 1))
    # pionowy rzad kwiatow (nakladka A2-21 na warstwie 1) wzdluz listwy tez jest prosta kreska: usuniety
    fl = [(x, y) for y in range(59, 91) for x in (96, 97) if kind(m, 1, x, y) == 21 and not 65 <= y <= 70]
    clear(m, 1, fl); reshape(m, 1, ring(fl, 1)); print("  Map024 pas kwiatow wzdluz listwy usuniety:", len(fl))
    rc = [(90, 65), (91, 65), (97, 65), (90, 70), (97, 70), (96, 70), (97, 69), (90, 66)]   # prostokatna plama kwiatow: nieregularny obrys
    clear(m, 1, rc); reshape(m, 1, ring(rc, 1))
    fix024b(m)
    organic(m, (93, 62, 101, 82), (16, 17, 27), seed=3, amp=1.6, scale=6.0, smooth=2)   # prosty wschodni brzeg plamy 27 po zdjeciu listwy
    for (x, y) in cells:                     # region 2 (zawsze blokuje) pod listwa niczego juz nie pokazuje
        if at(m, 5, x, y) == 2: put(m, 5, x, y, 0)

def fix024b(m):
    # (row 10) region 2 (blokada) na golej trawie (20-21, 64-65): niewidzialna sciana
    for (x, y) in [(20, 64), (21, 64), (20, 65), (21, 65)]:
        if at(m, 5, x, y) == 2: put(m, 5, x, y, 0)
    # (row 04) ogrodzony sad (x32-43, y36-43): dwa grunty pod jednym obiektem - cale wnetrze jedna trawa
    cells = [(x, y) for y in range(37, 43) for x in range(33, 43) if kind(m, 0, x, y) in (27,)]
    for (x, y) in cells: put(m, 0, x, y, GRASS)
    reshape(m, 0, ring(cells, 1)); print("  Map024 sad: grunt ujednolicony", len(cells))
    # (row 13) sosna 54 przy wiezy zachodzi koronami na dach: kilka kratek w lewo
    c = free_cell(m, 28, 67, 65, ymax=70, xr=(22, 29), skip=(54,), r=2.0)
    if c: move_ev(m, 54, *c); print("  Map024 sosna 54 ->", c)
    # (row 35) szew w licu muru (65,118-119): zwykly kafel muru
    put(m, 0, 65, 118, 7090); put(m, 0, 65, 119, 7096)

def kind(m, z, x, y):
    t = at(m, z, x, y); return (t - 2048) // 48 if t >= 2048 else None
def occupied(m, x, y, r=1.5, skip=()):
    for e in m["events"]:
        if e and e["id"] not in skip and abs(e["x"] - x) <= r and abs(e["y"] - y) <= r: return True
    return False
def free_cell(m, x0, y0, ymin, ymax=None, xr=(0, 9999), r=1.6, bad=(17,), skip=(), maxd=14):
    """najblizsza wolna kratka dla drzewa: trawa, bez kafli na warstwach 1-3, bez regionu, bez zdarzen w promieniu r"""
    best = None
    for y in range(max(ymin, 0), min(ymax if ymax is not None else m["height"] - 1, m["height"] - 1) + 1):
        for x in range(max(xr[0], 1), min(xr[1], m["width"] - 2) + 1):
            d = math.hypot(x - x0, y - y0)
            if d > maxd or (best and d >= best[0]): continue
            if kind(m, 0, x, y) in bad or kind(m, 0, x, y) is None: continue
            if any(at(m, z, x, y) for z in (1, 2, 3)) or at(m, 5, x, y): continue
            if occupied(m, x, y, r, skip): continue
            best = (d, x, y)
    return best[1:] if best else None
def move_ev(m, eid, x, y): m["events"][eid]["x"] = x; m["events"][eid]["y"] = y

# ---------------------------------------------------------------- Map120 Osada Milczacych
def fix120(m):
    # twarde prostokaty cienia (warstwa 4) przy domach: z calej mapy
    n = m["width"] * m["height"]
    for i in range(4 * n, 5 * n): m["data"][i] = 0
    # drzewa na/przy palisadzie (wiersz 29, x 3-37): korony i pnie nachodza na deski - na wolne kratki 3+ rzedy nizej
    for eid in (29, 34, 54, 43):
        e = ev(m, eid)
        c = free_cell(m, e["x"], max(e["y"], 34), 34, xr=(2, 40), skip=(eid,), r=2.2)
        print("  Map120 drzewo", eid, (e["x"], e["y"]), "->", c)
        if c: move_ev(m, eid, *c)
    # ciemne lacie bruku (A2 36 na warstwie 1) rozsiane po poludniowej lace wygladaja jak plamy oleju; drobne okruchy bruku (47) tez
    for (bb, cells) in comps(m, 1, {36}):
        if bb[1] >= 40: clear(m, 1, cells)
    for (bb, cells) in comps(m, 1, {47}): clear(m, 1, cells)
    fix120_hills(m)
    fix120_stone(m)

def fix120_stone(m):
    # (kontrola P4) kupka kamieni B 653/669 (warstwa 2) pod pniem drzewa (kafel 558 warstwy 3, przechodni): bohater wchodzil na kamienie w (33,20) - kupka zdjeta, duzy glaz obok zostaje
    for (x, y, t) in ((33, 19, 653), (33, 20, 669)):
        if at(m, 2, x, y) == t: put(m, 2, x, y, 0)

def fix120_hills(m):
    """(wiersze 02, 04, 07) postrzepione stopnie wzgorza i 'labirynt' resztek muru: wszystkie odlamki A5 zdjete, w ich miejscu dwa
    nieregularne, zaokraglone wzgorza w gramatyce gracza (zielony wierzch): 'taras' (x53-68, y23-29) i mniejsze wzgorze na zachodzie"""
    from collections import Counter
    box = (38, 20, 72, 56)
    cnt = Counter(at(m, 0, x, y) for y in range(box[1] - 1, box[3] + 2) for x in range(box[0] - 1, box[2] + 2)
                  if at(m, 0, x, y) >= 2048 and not is_cliff_tile(at(m, 0, x, y)) and not (box[0] <= x <= box[2] and box[1] <= y <= box[3]))
    g = cnt.most_common(1)[0][0]; g = 2048 + ((g - 2048) // 48) * 48
    # 1. wszystkie odlamki wzgorz z okna
    for y in range(box[1], box[3] + 1):
        for x in range(box[0], box[2] + 1):
            for z in (0, 1):
                if is_cliff_tile(at(m, z, x, y)): put(m, z, x, y, g if z == 0 else 0)
            put(m, 4, x, y, 0)
    reshape(m, 0, ring([(x, y) for y in range(box[1], box[3] + 1) for x in range(box[0], box[2] + 1)], 1))
    out = []
    for (nm, top, st, sd, mx) in (("taras", (53, 23, 68, 29), (62, 63), 7, 2), ("zachodnie", (41, 34, 51, 41), (45, 46), 11, 2)):
        mask = hill_mask(top, sd, st, (), mx)
        face = build_hill(m, mask, (0, 0, -1, -1), GRASS_SET, st, g=g, name=nm)
        out += [(x, y) for (x, y) in mask if (x - 1, y) not in mask or (x + 1, y) not in mask or (x, y - 1) not in mask or (x, y + 1) not in mask] + face
        print("  Map120 wzgorze", nm, "wierzch", len(mask), "kratek, lico", len(face))
    # zdarzenia na obrysie/licu wzgorz: przesun na wolne kratki (gora: wewnatrz)
    bad = set(out)
    for e in [e for e in m["events"] if e]:
        if (e["x"], e["y"]) in bad and e["name"] != "":
            c = free_cell(m, e["x"], e["y"] + 3, e["y"] + 3, xr=(box[0], box[2] + 6), skip=(e["id"],), r=1.6)
            print("  Map120 zdarzenie na wzgorzu:", e["id"], e["name"], (e["x"], e["y"]), "->", c)
            if c: move_ev(m, e["id"], *c)

def comps(m, z, kinds_set, conn=8):
    import cv2
    W, H = m["width"], m["height"]
    a = np.zeros((H, W), np.uint8)
    for y in range(H):
        for x in range(W):
            t = at(m, z, x, y)
            if t >= 2048 and (t - 2048) // 48 in kinds_set: a[y, x] = 1
    n, lab, st, _ = cv2.connectedComponentsWithStats(a, connectivity=conn)
    return [(tuple(int(v) for v in st[i]), list(zip(*[q.tolist() for q in reversed(np.where(lab == i))]))) for i in range(1, n)]

def vnoise2(W, H, seed, scale):
    rnd = np.random.RandomState(seed)
    gw, gh = int(W / scale) + 3, int(H / scale) + 3
    g = rnd.rand(gh, gw).astype(np.float32)
    import cv2
    return cv2.resize(g, (gw * 8, gh * 8), interpolation=cv2.INTER_CUBIC)[:int(H * 8 / scale) + 1, :int(W * 8 / scale) + 1] if False else         cv2.resize(g, (int(gw * scale), int(gh * scale)), interpolation=cv2.INTER_CUBIC)[:H, :W]

def organic(m, win, kinds, seed=1, amp=3.0, scale=7.0, protect=None, smooth=1):
    """nieregularna, falista granica miedzy gruntami `kinds` (A2, warstwa 0) w oknie win=(x0,y0,x1,y1): pole etykiet zwichrowane
    niskoczestotliwosciowym szumem (przesuniecie +-amp kratek, skala `scale`), potem filtr wiekszosciowy (bez pojedynczych kratek).
    Kratki z kaflami na warstwach 1-3 (poza ozdobnikami A2 21/28/29/31 na warstwie 1), z regionem i z `protect`(x,y) zostaja.
    Autokafle zmienionych kratek i ich sasiadow przeliczone."""
    import cv2
    W, H = m["width"], m["height"]
    x0, y0, x1, y1 = win
    K = np.full((H, W), -1, np.int32)
    for y in range(H):
        for x in range(W):
            k = kind(m, 0, x, y)
            if k in kinds: K[y, x] = k
    def zn(sd):
        n = vnoise2(W, H, sd, scale) + 0.6 * vnoise2(W, H, sd + 100, scale * 0.4)
        return (n - n.mean()) / (n.std() + 1e-6)
    dx = zn(seed * 11 + 1) * amp          # amp = odchylenie standardowe przesuniecia w kratkach
    dy = zn(seed * 11 + 2) * amp
    YY, XX = np.mgrid[0:H, 0:W]
    sx = np.clip(np.rint(XX + dx).astype(int), 0, W - 1); sy = np.clip(np.rint(YY + dy).astype(int), 0, H - 1)
    new = K[sy, sx]
    new = np.where(new < 0, K, new)                                  # zrodlo nie jest gruntem: bez zmiany
    for _ in range(smooth):                                           # filtr wiekszosciowy 3x3
        out = new.copy()
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                if K[y, x] < 0: continue
                win3 = new[y - 1:y + 2, x - 1:x + 2].ravel(); win3 = win3[win3 >= 0]
                vals, cnt = np.unique(win3, return_counts=True)
                if cnt.max() >= 5: out[y, x] = vals[np.argmax(cnt)]
        new = out
    changed = []
    for y in range(max(y0, 0), min(y1, H - 1) + 1):
        for x in range(max(x0, 0), min(x1, W - 1) + 1):
            if K[y, x] < 0 or new[y, x] == K[y, x]: continue
            if any(at(m, z, x, y) and not (z == 1 and kind(m, 1, x, y) in (21, 28, 29, 31)) for z in (1, 2, 3)): continue
            if at(m, 5, x, y) or (protect and protect(x, y)): continue
            put(m, 0, x, y, 2048 + int(new[y, x]) * 48); changed.append((x, y))
    reshape(m, 0, ring(changed, 1))
    return changed


def organic_layer(m, z, win, kinds, seed=1, amp=2.5, scale=8.0, protect=None, smooth=2):
    """jak organic(), ale dla nakladek gruntu na warstwie z (np. A2 21/31/39 na warstwie 1): etykieta 99 = brak nakladki.
    Pole etykiet zwichrowane szumem + filtr wiekszosciowy: prostokatne plamy dostaja falisty, nieregularny obrys."""
    W, H = m["width"], m["height"]
    x0, y0, x1, y1 = win
    K = np.full((H, W), 99, np.int32)
    for y in range(H):
        for x in range(W):
            k = kind(m, z, x, y)
            if k in kinds: K[y, x] = k
    def zn(sd):
        n = vnoise2(W, H, sd, scale) + 0.6 * vnoise2(W, H, sd + 100, scale * 0.4)
        return (n - n.mean()) / (n.std() + 1e-6)
    dx = zn(seed * 11 + 1) * amp; dy = zn(seed * 11 + 2) * amp
    YY, XX = np.mgrid[0:H, 0:W]
    sx = np.clip(np.rint(XX + dx).astype(int), 0, W - 1); sy = np.clip(np.rint(YY + dy).astype(int), 0, H - 1)
    new = K[sy, sx]
    for _ in range(smooth):
        out = new.copy()
        for y in range(max(1, y0 - 1), min(H - 1, y1 + 2)):
            for x in range(max(1, x0 - 1), min(W - 1, x1 + 2)):
                win3 = new[y - 1:y + 2, x - 1:x + 2].ravel()
                vals, cnt = np.unique(win3, return_counts=True)
                if cnt.max() >= 5: out[y, x] = vals[np.argmax(cnt)]
        new = out
    changed = []
    for y in range(max(y0, 0), min(y1, H - 1) + 1):
        for x in range(max(x0, 0), min(x1, W - 1) + 1):
            if new[y, x] == K[y, x]: continue
            t = at(m, z, x, y)
            if t and K[y, x] == 99: continue                      # inny kafel (nie nakladka gruntu): nie ruszac
            if any(at(m, zz, x, y) for zz in (2, 3)) or at(m, 5, x, y) or (protect and protect(x, y)): continue
            if kind(m, 0, x, y) is None or kind(m, 0, x, y) < 16: continue   # nakladki tylko na lad (nie na wode/skale)
            put(m, z, x, y, 0 if new[y, x] == 99 else 2048 + int(new[y, x]) * 48); changed.append((x, y))
    reshape(m, z, ring(changed, 1))
    return changed


def ruin_gaps(m, seed, boxes, rims=(1630, 1637, 1639), gaps_per_run=(1, 2), glen=(1, 3), min_run=3):
    """cienkie krawedzie A5 (gora 1630, lewo 1637, prawo 1639) prostokatnego obrysu ruiny: z rzedow wyjmuje 1-2 odcinki po 1-3 kratki
    (zwalony mur), rogi i okolice schodow zostaja; wyjeta kratka dostaje grunt z sasiedztwa (A2 na warstwie 0)"""
    rnd = random.Random(seed)
    W, H = m["width"], m["height"]
    removed = []
    def run_cells(vertical, tile):
        runs = []
        for a in range(W if vertical else H):
            cur = []
            for b in range(H if vertical else W):
                x, y = (a, b) if vertical else (b, a)
                if at(m, 0, x, y) == tile: cur.append((x, y))
                else:
                    if len(cur) >= min_run: runs.append(cur)
                    cur = []
            if len(cur) >= min_run: runs.append(cur)
        return runs
    runs = [r for r in run_cells(False, 1630) + run_cells(True, 1637) + run_cells(True, 1639) if any(bx[0] <= r[0][0] <= bx[2] and bx[1] <= r[0][1] <= bx[3] for bx in boxes)]
    for r in runs:
        n = len(r); k = rnd.randint(*gaps_per_run) if n >= 5 else 1
        for _ in range(k):
            L = min(rnd.randint(*glen), max(1, n - 2))
            i0 = rnd.randint(1 if n > 3 else 0, max(1 if n > 3 else 0, n - L - (1 if n > 3 else 0)))
            removed += r[i0:i0 + L]
    removed = list(dict.fromkeys(removed))
    for (x, y) in removed:
        ks = []
        for (dx, dy) in ((0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            kk = kind(m, 0, x + dx, y + dy)
            if kk is not None and kk >= 16: ks.append(kk)
        put(m, 0, x, y, 2048 + (max(set(ks), key=ks.count) if ks else 24) * 48)
    reshape(m, 0, ring(removed, 1))
    return removed

def blobs(m, z, win, kinds, seed, thresh=0.62, scale=6.0, base=(24, 25), margin=2, avoid=None):
    """plamy gruntu/nakladek z szumu (progowanie) w oknie win: warstwa z, rodzaje kinds (rotacja po szumie), tylko na gruncie base"""
    W, H = m["width"], m["height"]
    x0, y0, x1, y1 = win
    n1 = vnoise2(W, H, seed, scale); n1 = (n1 - n1.min()) / (np.ptp(n1) + 1e-6)
    n2 = vnoise2(W, H, seed + 50, scale * 1.6); n2 = (n2 - n2.min()) / (np.ptp(n2) + 1e-6)
    evc = set((e["x"], e["y"]) for e in m["events"] if e)
    ch = []
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if n1[y, x] < thresh: continue
            if (x, y) in evc or at(m, 5, x, y) or any(at(m, zz, x, y) for zz in (2, 3)): continue
            if z == 1 and at(m, 1, x, y): continue
            ok = True
            for dy in range(-margin, margin + 1):
                for dx in range(-margin, margin + 1):
                    kk = kind(m, 0, x + dx, y + dy)
                    if kk not in base or (avoid and avoid(x + dx, y + dy)): ok = False; break
                if not ok: break
            if not ok: continue
            k = kinds[0] if len(kinds) == 1 else kinds[int(n2[y, x] * len(kinds)) % len(kinds)]
            put(m, z, x, y, 2048 + k * 48); ch.append((x, y))
    reshape(m, z, ring(ch, 1))
    return ch


# ---------------------------------------------------------------- wzgorza z nieregularnym, zaokraglonym obrysem (gramatyka kafli jak na Map990 / tools/wzgorza_popraw)
DIRT_SET = dict(rimL=93, rim=94, rimR=95, sideL=101, sideR=103, lipL=109, lip=110, lipR=111, f1L=117, f1=118, f1R=119, f2L=125, f2=126, f2R=127, v1=(73, 74), v2=(81, 82), stL=32, stR=34)
GRASS_SET = {k: (v - 5 if isinstance(v, int) and v >= 88 else v) for k, v in DIRT_SET.items()}; GRASS_SET.update(stL=24, stR=26)
A5_PLAIN = {76, 77, 78, 79, 84, 85, 86, 87}
def a5i(t): return t - 1536 if 1536 <= t < 1664 else None
def is_cliff_tile(t):
    i = a5i(t); return i is not None and ((i >= 72 and i not in A5_PLAIN) or 24 <= i <= 34)
def hash2(x, y):
    h = (x * 374761393 + y * 668265263) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return (h ^ (h >> 16)) / 4294967296.0
def inset_profile(rnd, n, mx=2, ends=(1, 0), flat=()):
    """profil wciec obrysu wzdluz jednego boku (n kratek): losowy marsz 0..mx o krok <=1, konce zaokraglone (ends), flat = indeksy bez wciecia"""
    v = [0] * n
    cur = rnd.choice([0, 1])
    for i in range(n):
        cur = max(0, min(mx, cur + rnd.choice([-1, 0, 0, 1])))
        v[i] = cur
    for j, e in enumerate(ends):
        if j < n: v[j] = max(v[j], e)
        if n - 1 - j >= 0: v[n - 1 - j] = max(v[n - 1 - j], e)
    for i in flat:
        if 0 <= i < n: v[i] = 0
    for _ in range(3):                       # sasiednie wartosci roznia sie najwyzej o 1 (bez ostrych schodow)
        for i in range(1, n):
            if v[i] > v[i - 1] + 1: v[i] = v[i - 1] + 1
        for i in range(n - 2, -1, -1):
            if v[i] > v[i + 1] + 1: v[i] = v[i + 1] + 1
    return v
def hill_mask(rect, seed, stairs, keep=(), mx=2):
    """maska wierzchu (z obrysem) wzgorza o prostokacie rect=(x0,y0,x1,y1) (wiersz obrysu y0 ... wiersz kantu y1): nieregularne, zaokraglone"""
    x0, y0, x1, y1 = rect
    for attempt in range(3000):
        rnd = random.Random(seed * 100 + attempt)
        w, h = x1 - x0 + 1, y1 - y0 + 1
        flat = [i - x0 for i in range((stairs[0] - 1) if stairs else 0, (stairs[1] + 2) if stairs else 0)]
        top = inset_profile(rnd, w, mx, (1, 0), ())
        bot = inset_profile(rnd, w, mx, (1, 0), flat)
        lef = inset_profile(rnd, h, mx, (1, 0), ())
        rig = inset_profile(rnd, h, mx, (1, 0), ())
        cells = {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)
                 if y >= y0 + top[x - x0] and y <= y1 - bot[x - x0] and x >= x0 + lef[y - y0] and x <= x1 - rig[y - y0]}
        # kazda kolumna jednym spojnym odcinkiem; kazdy wiersz tez; szerokosc >= 3
        ok = True
        for x in range(x0, x1 + 1):
            ys = sorted(y for (xx, y) in cells if xx == x)
            if ys and (ys[-1] - ys[0] + 1 != len(ys) or len(ys) < 3): ok = False
        for y in range(y0, y1 + 1):
            xs = sorted(x for (x, yy) in cells if yy == y)
            if xs and (xs[-1] - xs[0] + 1 != len(xs) or len(xs) < 3): ok = False
        if not ok: continue
        # miejsca na wierzchu (keep) musza byc we wnetrzu (nie na obrysie)
        inner = {(x, y) for (x, y) in cells if (x - 1, y) in cells and (x + 1, y) in cells and (x, y - 1) in cells and (x, y + 1) in cells}
        if any(c not in inner for c in keep): continue
        if stairs and any((x, y1) not in cells for x in stairs): continue
        return cells
    raise SystemExit("hill_mask: brak ksztaltu dla %s" % (rect,))
def build_hill(m, mask, clear, S, stairs=None, g=None, name=""):
    """wzgorze z maski wierzchu: obrys 3x3 (rogi zaokraglone), lico 2 rzedy pod kazda kolumna, schody (2 kolumny) w licu"""
    W, H = m["width"], m["height"]
    cx0, cy0, cx1, cy1 = clear
    if g is None:
        from collections import Counter
        cnt = Counter(at(m, 0, x, y) for y in range(cy0 - 1, cy1 + 2) for x in range(cx0 - 1, cx1 + 2)
                      if 0 <= x < W and 0 <= y < H and at(m, 0, x, y) >= 2048 and not is_cliff_tile(at(m, 0, x, y)) and (x < cx0 or x > cx1 or y < cy0 or y > cy1))
        g = cnt.most_common(1)[0][0]; g = 2048 + ((g - 2048) // 48) * 48
    ch0, ch1 = set(), set()
    for y in range(cy0, cy1 + 1):
        for x in range(cx0, cx1 + 1):
            for z in (0, 1):
                if is_cliff_tile(at(m, z, x, y)):
                    put(m, z, x, y, g if z == 0 else 0); (ch0 if z == 0 else ch1).add((x, y))
            put(m, 4, x, y, 0)
    cols = {}
    for (x, y) in mask: cols.setdefault(x, []).append(y)
    bot = {x: max(v) for x, v in cols.items()}
    face = {}
    for x, b in bot.items():
        for r in (1, 2): face[(x, b + r)] = r
    for (x, y) in mask:
        N, So, Wn, E = (x, y - 1) in mask, (x, y + 1) in mask, (x - 1, y) in mask, (x + 1, y) in mask
        if stairs and x in stairs and y == bot[x]:
            put(m, 0, x, y, g); ch0.add((x, y)); continue
        row = 0 if not N else (2 if not So else 1)
        col = 0 if not Wn else (2 if not E else 1)
        t = None
        if row == 0: t = (S["rimL"], S["rim"], S["rimR"])[col]
        elif row == 2: t = (S["lipL"], S["lip"], S["lipR"])[col]
        elif col == 0: t = S["sideL"]
        elif col == 2: t = S["sideR"]
        if t is not None:
            put(m, 0, x, y, 1536 + t); put(m, 1, x, y, 0)
        # wnetrze: grunt mapy (zostaje)
    for (x, y), r in face.items():
        if stairs and x in stairs:
            t = S["stL"] if x == stairs[0] else S["stR"]
        else:
            Lend = (x - 1, y) not in face or (stairs and x == stairs[1] + 1)
            Rend = (x + 1, y) not in face or (stairs and x == stairs[0] - 1)
            if r == 1: t = S["f1L"] if Lend else S["f1R"] if Rend else S["f1"]
            else: t = S["f2L"] if Lend else S["f2R"] if Rend else S["f2"]
            if not Lend and not Rend and not (stairs and (x in (stairs[0] - 1, stairs[1] + 1))):
                k = hash2(x, y)
                if k < 0.16: t = (S["v1"] if r == 1 else S["v2"])[0 if k < 0.08 else 1]
        put(m, 0, x, y, 1536 + t); put(m, 1, x, y, 0); put(m, 4, x, y, 0)
        # lico nie moze lezec na drzewie/zdarzeniu - sprawdza wywolujacy
    for (x, y) in mask:
        if at(m, 1, x, y) and ((x, y) not in mask or any((x + dx, y + dy) not in mask for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))): put(m, 1, x, y, 0); ch1.add((x, y))
    reshape(m, 0, ring(ch0, 1)); reshape(m, 1, ring(ch1 | ch0, 1))
    return list(face)

# ---------------------------------------------------------------- Map168 Spalona zagroda
def fix168(m):
    # spalone pole: prostokat ziemi (17) ~100x24 z prostymi brzegami i pionowe/poziome szwy gruntu: okragla nieregularna granica
    ch = organic(m, (0, 0, 129, 45), (16, 17, 27), seed=5, amp=2.6, scale=10.0, smooth=1)
    print("  Map168 ground cells changed:", len(ch))
    ch = organic(m, (0, 46, 129, 76), (16, 17, 27), seed=9, amp=2.4, scale=9.0)
    print("  Map168 south cells changed:", len(ch))
    # dlugie proste brzegi zatoki (poludniowy y~87, pionowe x~60 i x~96-100): falowanie linii brzegowej o +-1-2 kratki (woda <-> trawa tylko na styku)
    ch = organic(m, (3, 78, 126, 104), (6, 16, 17, 27), seed=21, amp=1.5, scale=7.0, smooth=1)
    print("  Map168 shore cells changed:", len(ch))
    # resztki plotu (A2-22) w wierszu 14: urywane odcinki po 3-5 kratek z dziurami, niczego nie ogradzaja: do usuniecia (row 01)
    fence = [(x, y) for y in range(m["height"]) for x in range(m["width"]) if kind(m, 1, x, y) == 22]
    clear(m, 1, fence); reshape(m, 1, ring(fence, 1))
    print("  Map168 fence stubs removed:", len(fence))
    # nakladki trawy/ziemi (A2 21/31/39 na warstwie 1) tworza prostokatne plamy z prostymi brzegami (np. wokol sadu): falisty obrys
    ch = organic_layer(m, 1, (0, 0, 129, 76), (21, 31, 39), seed=13, amp=2.4, scale=9.0)
    print("  Map168 layer-1 overlay cells changed:", len(ch))
    # (51,31) sosna stoi przy kamiennym cokole (x50-55, y24-30): korona nachodzi na jego lico - dwie kratki nizej
    c = free_cell(m, 51, 34, 33, ymax=36, xr=(47, 56), skip=(101,), r=1.6)
    if c: move_ev(m, 101, *c); print("  Map168 sosna 101 ->", c)

def near_water(m, r=3):
    import cv2
    W, H = m["width"], m["height"]
    w = np.zeros((H, W), np.uint8)
    for y in range(H):
        for x in range(W):
            k = kind(m, 0, x, y)
            if k is not None and k < 16: w[y, x] = 1
    d = cv2.dilate(w, np.ones((2 * r + 1, 2 * r + 1), np.uint8))
    return lambda x, y: bool(d[y, x])

# ---------------------------------------------------------------- Map175 Orla Gran
def fix175(m):
    # pionowe pasy zolto-zielonego gruntu (A2 25 na 24) o prostych krawedziach, szwy gruntu: falista nieregularna granica
    ch = organic(m, (0, 0, 117, 59), (24, 25, 26), seed=4, amp=2.4, scale=8.0, protect=near_water(m, 2))   # bez wschodniego plaskowyzu (x118+): tam zolte wysepki
    ch2 = organic(m, (60, 0, 100, 59), (24, 25, 26), seed=6, amp=3.6, scale=7.0, protect=near_water(m, 1))   # pas przy zachodnim brzegu jeziora
    print("  Map175 ground cells changed:", len(ch), len(ch2))
    # nakladki gruntu na warstwie 1 (jasnoniebieski bruk 8x1, jasnozielone paski 8x1 pod murem skarpy: wiersze 03, 11): nieregularny obrys
    ch = organic_layer(m, 1, (0, 0, 155, 59), (23, 25, 36, 39), seed=17, amp=2.2, scale=6.0, protect=near_water(m, 2))
    print("  Map175 layer-1 overlay cells changed:", len(ch))
    # jasnozielone paski (A5 1641 = plaska zielona gorna powierzchnia) na gornej krawedzi poludniowego muru skarpy (wiersz 11): zwykly szary gzyms muru (1646)
    n = 0
    for y in (56, 57):
        for x in range(m["width"]):
            if at(m, 0, x, y) == 1641 and (x, y) != (116, 57): put(m, 0, x, y, 1646); n += 1
    print("  Map175 zielone paski muru -> gzyms:", n)
    # trzy puste prostokatne obrysy ruin (cienkie krawedzie A5): zwalony mur - odcinki wyjete z gory/bokow, rogi i schody zostaja (wiersze 01, 07, 09)
    # (wiersze 01, 07, 09: prostokatne wzgorza-obrysy) trzy grzedy jako nieregularne, zaokraglone wzgorza w gramatyce gracza; schody, miejsca Zakonu i dzwonek zostaja
    for (nm, top, clr, st, keep, sd, mx) in (("grzeda 1", (63, 8, 70, 14), (61, 6, 72, 17), (66, 67), [(67, 11), (68, 12), (69, 13)], 1, 2),
                                             ("grzeda 3", (62, 39, 71, 46), (60, 37, 72, 50), (66, 67), [(67, 43), (68, 44), (69, 45)], 2, 2),
                                             ("maly pierscien", (33, 33, 38, 37), (31, 31, 39, 40), (35, 36), [], 3, 1)):
        mask = hill_mask(top, sd, st, keep, mx)
        face = build_hill(m, mask, clr, DIRT_SET, st, name=nm)
        print("  Map175 wzgorze", nm, "wierzch", len(mask), "kratek, lico", len(face))
    # wschodni plaskowyz (x120-155, y26-52): rowne szare pole - plamy kamienistej nakladki (A2 47), tylko kafle
    # (row 08 plaskowyz: plamy A2 47 wygladaly jak obcy bruk - zostaje rowne pole)

# ---------------------------------------------------------------- Map003 Kruczy Jar (mapa gracza: tylko dwa drobne poprawki)
def fix003(m):
    # (27,49) czarny kwadracik w scianie skaly: zbladzony kafel A5 1611 wsrod 1648 (row 20)
    for (x, y) in [(x, y) for y in range(m["height"]) for x in range(m["width"]) if at(m, 0, x, y) == 1611 and at(m, 0, x - 1, y) == 1648 and at(m, 0, x + 1, y) == 1648]:
        put(m, 0, x, y, 1648); print("  Map003 dziura w skale", (x, y))
    # (42,3) sosna (male drzewo 281) stoi pod resztka muru, korona zlewa sie z murem (row 03): dwie kratki nizej
    c = free_cell(m, 41, 7, 7, ymax=9, xr=(38, 46), skip=(281,), r=1.2)
    if c: move_ev(m, 281, *c); print("  Map003 drzewo 281 ->", c)

def fix003b(m):
    # ciemnoszare owale/plamy (nakladka A2 36 na warstwie 1) srodku pustej lak (rzedy 06, 16, 18, 19): wygladaja jak przypalona plama - zdjete
    n = 0
    for (bb, cells) in comps(m, 1, {36}):
        clear(m, 1, cells); reshape(m, 1, ring(cells, 1)); n += len(cells)
    print("  Map003 ciemne plamy (A2 36) zdjete:", n)

def fix004(m):
    # (row 23) glazy, rudy i krzaki w rownych rzedach i kolumnach (x22-32, y82-91): czesc przesunieta o 1 kratke na wolne miejsce - nieregularne skupisko
    rnd = random.Random(23)
    ids = [e["id"] for e in m["events"] if e and 22 <= e["x"] <= 32 and 82 <= e["y"] <= 91 and ("Rock" in (e["pages"][0]["image"].get("characterName") or "") or "Bush" in (e["pages"][0]["image"].get("characterName") or ""))]
    bigs = [e for e in m['events'] if e and any(w in (e['pages'][0]['image'].get('characterName') or '') for w in ('Wide', 'Hedge', 'Cluster', 'Boulder', 'Twin', 'Mound', 'Jagged'))]
    n = 0
    for i in ids:
        if rnd.random() < 0.45 or any(w in (ev(m, i)['pages'][0]['image'].get('characterName') or '') for w in ('Wide', 'Hedge', 'Cluster', 'Boulder', 'Twin', 'Mound', 'Jagged')): continue
        e = ev(m, i); dx, dy = rnd.choice([(-1, 0), (1, 0), (0, -1), (0, 1), (1, 1), (-1, -1), (1, -1), (-1, 1)])
        tx, ty = e["x"] + dx, e["y"] + dy
        if not (21 <= tx <= 33 and 81 <= ty <= 92): continue
        if kind(m, 0, tx, ty) is None or any(at(m, z, tx, ty) for z in (1, 2, 3)) or at(m, 5, tx, ty) or occupied(m, tx, ty, 0.9, (i,)) or any(abs(b['x'] - tx) <= 1.6 and abs(b['y'] - ty) <= 1.6 for b in bigs if b['id'] != i): continue
        move_ev(m, i, tx, ty); n += 1
    print("  Map004 skupisko skal przesuniete:", n, "z", len(ids))

def fix001(m):
    # (row 11) dwa ciemne puste dywany 3x5 (A2 21 na warstwie 1) w poludniowo-wschodniej sali wygladaja jak dziury w podlodze: zdjete (podloga)
    cells = []
    for (bb, cs) in comps(m, 1, {21, 37}):
        if 46 <= bb[0] <= 56 and 38 <= bb[1] <= 48 and len(cs) <= 40: cells += cs
    clear(m, 1, cells); print("  Map001 puste ciemne dywany zdjete:", len(cells))

def clear_shadows(m):
    n = m["width"] * m["height"]
    k = sum(1 for i in range(4 * n, 5 * n) if m["data"][i])
    for i in range(4 * n, 5 * n): m["data"][i] = 0
    print("  cienie edytora (warstwa 4) usuniete:", k)

def soften(m, seed, amp=1.8, scale=8.0, win=None):
    """prostokatne plamy gruntu (A2 16/17/27 na warstwie 0, wiersze ES-j/ES-b): falisty obrys, bez ruszania wody i kafli na warstwach 1-3"""
    ch = organic(m, win or (0, 0, m["width"] - 1, m["height"] - 1), (16, 17, 27), seed=seed, amp=amp, scale=scale, protect=near_water(m, 1), smooth=1)
    print("  grunt: komorek zmienionych", len(ch))
def fix020(m): clear_shadows(m)      # twarde prostokaty cienia przy chacie dziadka
def fix213(m): clear_shadows(m)      # kopalnia: ciemne prostokaty u stop scian (row 01/03/05)

def patch_js():
    """Zasoby_Data.js (staging): osm jablonek Ługow w nieregularnym, starym sadzie zamiast siatki 4x2 (pozostaja w tym samym obejsciu x60-71, y20-24; miejsce zadania (65,22), Marta (65,23) nietkniete)"""
    src = os.path.join(ROOT, "js", "plugins", "Zasoby_Data.js"); dst = os.path.join(HERE, "staging", "js", "plugins", "Zasoby_Data.js")
    t = open(src, "rb").read().decode("utf-8")
    old = "trees: [[61, 21], [64, 21], [67, 21], [70, 21], [61, 24], [64, 24], [67, 24], [70, 24]],"
    assert t.count(old) == 1
    t = t.replace(old, "trees: [[60, 21], [63, 20], [67, 21], [70, 20], [60, 24], [63, 24], [68, 24], [71, 23]],")
    os.makedirs(os.path.dirname(dst), exist_ok=True); open(dst, "wb").write(t.encode("utf-8")); print("  Zasoby_Data.js staged (sad)")

def fix003all(m): fix003(m); fix003b(m)
def fix020x(m): clear_shadows(m); soften(m, 20, win=(24, 64, 48, 75))   # (row 13: pasy ziemi na lace)
def fix004x(m): fix004(m)
FIX = {1: fix001, 4: fix004x, 121: fix020, 122: fix020, 123: fix020, 124: fix020, 3: fix003all, 20: fix020x, 213: fix213, 24: fix024, 120: fix120, 168: fix168, 175: fix175}
if __name__ == "__main__":
    ids = [int(a) for a in sys.argv[1:]] or sorted(FIX)
    for mid in ids:
        m = load(mid); FIX[mid](m); save(m, mid); print("Map%03d staged" % mid)
    if 168 in ids: patch_js()
