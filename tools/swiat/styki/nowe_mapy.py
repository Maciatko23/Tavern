# -*- coding: utf-8 -*-
"""Generator treści nowych map świata (960-964) w stylu sąsiadów (styki, druga runda):
  - brzeg morza z maski świata wygładzony (łuki zamiast schodków 45°), przy krawędziach sąsiadów surowa maska (szew bez skoku),
  - plamy gruntu i lasu organiczne (szum wielu skal + wygładzenie + usunięcie pojedynczych kafli), udziały gruntu jak u sąsiadów (+-20%),
  - zdarzenia (sosny trzech rodzajów, drzewa, krzaki, kamienie, pnie) KOPIOWANE od sąsiadów, w gęstości na 100 kratek lądu jak u sąsiadów, kępami,
  - ścieżki sąsiadów przechodzą przez krawędź i prowadzą do małego miejsca na mapie (polana z pniem, kamienny krąg, skałki z rudą, jabłoń, dryf na plaży)."""
import os, sys, copy, math, random, json, collections
import numpy as np
import cv2
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
import mapylib as L
import wspolne as W
import zbuduj as Z
import ogon as O
K = Z.K

KATEGORIE = [("drzewa", ("!$Pine_", "!$Tree_", "!$Big_Trees")), ("krzaki", ("!$Bush_",)), ("kamienie", ("!$Rock_",)), ("pnie", ("!$Trunk_", "!$Stump_", "!$Log"))]
POMIN = ("!$Urwisko", "!$Mt_Blocks", "!$Rock_Ore")      # miejsca fabularne / rudy: tylko w miejscu zbierania


ZAJ = set()      # kratki zajęte przez zdarzenia nowej mapy (obszary <Occupy> nie mogą się nakładać: kontrola Z2)


def kom(e):
    return set(L.Zdarzenie(e, None).komorki())


def kategoria(nazwa):
    for k, pre in KATEGORIE:
        if nazwa.startswith(pre): return k
    return None


def fbm(h, w, seed, skale=(18, 8, 3), wagi=(0.55, 0.3, 0.15)):
    rng = np.random.RandomState(seed)
    out = np.zeros((h, w), np.float32)
    for s, wg in zip(skale, wagi):
        g = rng.rand(h // s + 3, w // s + 3).astype(np.float32)
        r = cv2.resize(g, ((w // s + 3) * s, (h // s + 3) * s), interpolation=cv2.INTER_CUBIC)
        ox, oy = rng.randint(0, s), rng.randint(0, s)
        out += wg * r[oy:oy + h, ox:ox + w]
    return (out - out.min()) / (out.max() - out.min() + 1e-9)


def wygladz_bin(a, sigma=1.3, prog=0.5, min_plama=8):
    """maska bool: zaokrąglona (rozmycie + próg), bez drobnych plam i dziur"""
    f = cv2.GaussianBlur(a.astype(np.float32), (0, 0), sigma) > prog
    f = f.astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(f, connectivity=4)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < min_plama: f[lab == i] = 0
    inv = (1 - f).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, connectivity=4)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < min_plama: f[lab == i] = 1
    return f.astype(bool)


def statystyki(sasiedzi):
    """z map sąsiadów: gęstość zdarzeń na 100 kratek lądu wg kategorii, udziały gruntu, pula szablonów zdarzeń"""
    dens = collections.defaultdict(list); grunt = collections.Counter(); szab = collections.defaultdict(list); las = []
    for mid in sasiedzi:
        m = Z.wczytaj(mid); w, h = m["width"], m["height"]
        d0 = m["data"][:w * h]; d1 = m["data"][w * h:2 * w * h]
        lad = [(i, t) for i, t in enumerate(d0) if not (2048 <= t < 2816)]
        n = max(1, len(lad))
        for i, t in lad:
            if t >= 2816: grunt[(t - 2048) // 48] += 1
        las.append(sum(1 for i, _ in lad if d1[i] and (d1[i] - 2048) // 48 == 20) / n)
        cnt = collections.Counter()
        for e in m["events"]:
            if not e: continue
            pg = e["pages"][0]; ch = pg["image"]["characterName"]
            if not ch.startswith("!$") or any(ch.startswith(p) for p in POMIN): continue
            if any(c["code"] == 201 for p in e["pages"] for c in p["list"]): continue
            k = kategoria(ch)
            if not k: continue
            cnt[k] += 1; szab[(k, ch)].append(e)
        for k, _ in KATEGORIE: dens[k].append(100.0 * cnt[k] / n)
    tot = sum(grunt.values()) or 1
    return {k: float(np.mean(v)) for k, v in dens.items()}, {k: v / tot for k, v in grunt.items()}, szab, float(np.mean(las))


def narysuj(st, mid, sp):
    x0, y0, w, h = sp["rect"]
    sas = sp["sasiedzi"]
    dens, grunt, szab, las_frac = statystyki(sas)
    pr = {k: v for k, v in Z.wczytaj(sp["wzor"]).items() if k not in ("data", "events", "width", "height")}
    pr["displayName"] = sp["nazwa"]; pr["encounterList"] = []; pr["tilesetId"] = 11
    pr["note"] = "<Clouds:on>\n<Farm:off>\n<Water:salt>"
    m = dict(pr); m["width"], m["height"] = w, h; m["data"] = [0] * (6 * w * h); m["events"] = [None]
    Z.NOWE_MAPY.add(id(m))
    # ---- ląd: maska świata z marginesem, wygładzona; przy krawędziach sąsiadów surowa
    PAD = 14
    raw = np.zeros((h + 2 * PAD, w + 2 * PAD), bool)
    for yy in range(h + 2 * PAD):
        for xx in range(w + 2 * PAD): raw[yy, xx] = O.lad(x0 + xx - PAD, y0 + yy - PAD)
    # brzeg: wypaczenie pola gładkim szumem (nieregularny, bez prostych odcinków) + rozmycie (łuki zamiast schodków 45 stopni)
    dxn = (fbm(h + 2 * PAD, w + 2 * PAD, sp["seed"] + 21, skale=(14, 6), wagi=(0.7, 0.3)) - 0.5) * 7.0
    dyn = (fbm(h + 2 * PAD, w + 2 * PAD, sp["seed"] + 22, skale=(14, 6), wagi=(0.7, 0.3)) - 0.5) * 7.0
    gx, gy = np.meshgrid(np.arange(w + 2 * PAD, dtype=np.float32), np.arange(h + 2 * PAD, dtype=np.float32))
    warp = cv2.remap(raw.astype(np.float32), gx + dxn.astype(np.float32), gy + dyn.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    gl = cv2.GaussianBlur(warp, (0, 0), 2.2) > 0.5
    lad = gl[PAD:PAD + h, PAD:PAD + w].copy(); rw = raw[PAD:PAD + h, PAD:PAD + w]
    zajete = set(sp.get("sasiaduja", ()))       # strony mapy, przy których jest sąsiad: "N", "S", "W", "E"
    for yy in range(h):
        for xx in range(w):
            d = min(xx if "W" in zajete else 99, w - 1 - xx if "E" in zajete else 99, yy if "N" in zajete else 99, h - 1 - yy if "S" in zajete else 99)
            if d <= 1: lad[yy, xx] = rw[yy, xx]
            elif d <= 4 and rw[yy, xx] == lad[yy, xx]: pass
    morze = ~lad
    # ---- grunt: udziały jak u sąsiadów
    n_lad = int(lad.sum())
    inl = cv2.distanceTransform(lad.astype(np.uint8), cv2.DIST_L2, 3)
    f27 = grunt.get(27, 0.05); f17 = grunt.get(17, 0.05) * 0.5
    r1 = fbm(h, w, sp["seed"] + 1); r2 = fbm(h, w, sp["seed"] + 2, skale=(14, 6, 3))
    q = lambda a, p: np.quantile(a[lad], 1 - p) if n_lad else 1.0
    p27 = wygladz_bin(r1 > q(r1, f27), 1.4, 0.5, 10) & lad
    p17 = wygladz_bin(r2 > q(r2, f17), 1.2, 0.5, 6) & lad & ~p27 & (inl > 3)
    # ---- las (warstwa 1, kind 20): gęstość jak u sąsiadów, plamy organiczne
    rl = fbm(h, w, sp["seed"] + 3, skale=(20, 9, 4), wagi=(0.5, 0.33, 0.17))
    las = wygladz_bin(rl > q(rl, max(0.12, min(0.55, las_frac))), 1.5, 0.5, 14) & lad & (inl > 3.5)
    for yy in range(h):
        for xx in range(w):
            if morze[yy, xx]:
                Z.kafel(m, 0, xx, yy, K(6))
            else:
                near = inl[yy, xx] <= 1.6 or (inl[yy, xx] <= 2.7 and r2[yy, xx] > 0.5)
                Z.kafel(m, 0, xx, yy, K(17) if near else K(27) if p27[yy, xx] else K(17) if p17[yy, xx] else K(16))
                if las[yy, xx]: Z.kafel(m, 1, xx, yy, K(20))
    # ---- ścieżki i miejsce zbierania
    wolne = set()
    poi = miejsce(m, sp, lad, inl, las, x0, y0, w, h)
    sciezki(m, st, sp, x0, y0, w, h, lad, inl, poi, wolne)
    # ---- zdarzenia z gęstością sąsiadów
    umiesc(m, szab, dens, lad, inl, las, wolne, poi, sp["seed"], n_lad)
    pula = {}
    for src in (157, 13, 120, 18, 910, 950, 162):
        for e in Z.wczytaj(src)["events"]:
            if e and e["pages"][0]["image"]["characterName"].startswith("!$") and not any(c["code"] == 201 for p in e["pages"] for c in p["list"]): pula.setdefault(e["pages"][0]["image"]["characterName"], e)
    zdarzenia_miejsca(m, sp, poi, pula)
    sp["_poi"] = poi; sp["_log"] = list(umiesc.log); umiesc.log.clear(); sp["_ladu"] = n_lad
    W.reshape(m, 0, {(x, y) for x in range(w) for y in range(h)}); W.reshape(m, 1, {(x, y) for x in range(w) for y in range(h)})
    return m, dens, grunt


def miejsce(m, sp, lad, inl, las, x0, y0, w, h):
    """środek małej polany (promień 4) z dala od krawędzi i morza; czyści las, kładzie grunt, zdarzenia miejsca"""
    rnd = random.Random(sp["seed"] + 9)
    kand = [(x, y) for y in range(10, h - 10) for x in range(10, w - 10) if inl[y, x] > 9]
    if not kand: kand = [(x, y) for y in range(5, h - 5) for x in range(5, w - 5) if inl[y, x] > 5]
    if not kand: kand = [(w // 2, h // 2)]
    cx, cy = rnd.choice(kand)
    for y in range(max(0, cy - 5), min(h, cy + 6)):
        for x in range(max(0, cx - 5), min(w, cx + 6)):
            d = math.hypot(x - cx, y - cy) + 0.7 * math.sin(x * 1.7 + y * 0.9 + sp["seed"])
            if d <= 4.3 and lad[y, x]:
                W.put(m, 1, x, y, 0); Z.kafel(m, 0, x, y, K(16) if d > 2.2 else K(27))
    return (cx, cy)


def sciezki(m, st, sp, x0, y0, w, h, lad, inl, poi, wolne):
    """ścieżki sąsiadów przez krawędź (kafle gruntu dróg: kind 17/26/40 przy krawędzi i dalej od morza) -> do miejsca zbierania"""
    cx, cy = poi
    starty = []
    for (b, side) in sp["styki"]:
        mb = Z.wczytaj(b); bw, bh = mb["width"], mb["height"]
        bx0, by0 = st.rect_swiata(b)
        # kratki krawędzi b od strony tej mapy; świat -> lokalnie
        if side == "N": pts = [(bx0 + x, by0 + bh - 1) for x in range(bw)]
        elif side == "S": pts = [(bx0 + x, by0) for x in range(bw)]
        elif side == "W": pts = [(bx0 + bw - 1, by0 + y) for y in range(bh)]
        else: pts = [(bx0, by0 + y) for y in range(bh)]
        biegi = []; cur = []
        for (wx, wy) in pts:
            lx, ly = wx - bx0, wy - by0
            t = mb["data"][ly * bw + lx]
            k = (t - 2048) // 48 if t >= 2816 else None
            tu = (wx - x0, wy - y0)
            ok = k in (17, 26, 40) and 0 <= (tu[0] if side in "NS" else tu[1]) < (w if side in "NS" else h)
            if ok and O.lad(wx, wy) and all(O.lad(wx + dx, wy + dy) for dx in (-4, 4) for dy in (-4, 4)):
                cur.append((wx, wy))
            else:
                if len(cur) >= 2: biegi.append(cur)
                cur = []
        if len(cur) >= 2: biegi.append(cur)
        for bg in biegi:
            wx, wy = bg[len(bg) // 2]
            lx, ly = wx - x0, wy - y0
            if side == "N": lx, ly = lx, 0
            elif side == "S": lx, ly = lx, h - 1
            elif side == "W": lx, ly = 0, ly
            else: lx, ly = w - 1, ly
            if 0 <= lx < w and 0 <= ly < h: starty.append((lx, ly, side))
    for (lx, ly, side) in starty[:4]:
        dx, dy = {"N": (0, 1), "S": (0, -1), "W": (1, 0), "E": (-1, 0)}[side]
        mid1 = (lx + dx * 6 + (cx - lx) * 0.35, ly + dy * 6 + (cy - ly) * 0.35)
        mid2 = (lx + (cx - lx) * 0.7 + 2 * math.sin(lx + ly), ly + (cy - ly) * 0.7 + 2 * math.cos(lx - ly))
        pts = [(lx, ly), (lx + dx * 3, ly + dy * 3), mid1, mid2, (cx, cy)]
        cells = O.dysk(set(), O.wygladz([(float(a), float(b)) for a, b in pts], 3), 1.5)
        for (x, y) in cells:
            if 0 <= x < w and 0 <= y < h and lad[y, x] and inl[y, x] > 1.2:
                Z.kafel(m, 0, x, y, K(17))
                for z in (1, 2, 3): Z.kafel(m, z, x, y, 0)
                wolne.add((x, y))
    st.log("  %s: ścieżek od sąsiadów: %d" % (sp["nazwa"], len(starty)))


def umiesc(m, szab, dens, lad, inl, las, wolne, poi, seed, n_lad):
    rnd = random.Random(seed + 5)
    h, w = lad.shape
    cx, cy = poi
    zaj = set()
    def wolna(x, y):
        return 1 < x < w - 2 and 1 < y < h - 2 and lad[y, x] and not las[y, x] and inl[y, x] > 2 and (x, y) not in wolne and (x, y) not in zaj \
            and math.hypot(x - cx, y - cy) > 5.5 and W.kind_of(W.at(m, 0, x, y)) in (16, 27)
    ZAJ.clear()
    kand = [(x, y) for y in range(h) for x in range(w) if wolna(x, y)]
    for kat, _ in KATEGORIE:
        cel = int(round(dens.get(kat, 0) * n_lad / 100.0))
        szk = [(ch, ev) for (k, ch), ev in szab.items() if k == kat]
        if not szk or not kand: continue
        wag = [len(ev) for ch, ev in szk]
        postawione = 0; proby = 0
        while postawione < cel and proby < cel * 60:
            proby += 1
            sx, sy = rnd.choice(kand)
            ile = rnd.randint(2, 5) if kat in ("drzewa", "krzaki") else rnd.randint(1, 2)     # kępy
            for _ in range(ile):
                if postawione >= cel: break
                x = int(round(sx + rnd.gauss(0, 2.2))); y = int(round(sy + rnd.gauss(0, 2.2)))
                if not (0 <= x < w and 0 <= y < h) or not wolna(x, y): continue
                if any(abs(x - a) + abs(y - b) < (3 if kat == "drzewa" else 2) for (a, b) in zaj): continue
                ch, ev = rnd.choices(szk, weights=wag)[0]
                e = copy.deepcopy(rnd.choice(ev)); e["x"], e["y"] = x, y
                k_ = kom(e)
                if k_ & ZAJ or any(not (0 <= a < w and 0 <= b < h) for (a, b) in k_): continue
                Z.dodaj(m, e, bulk=True); zaj.add((x, y)); ZAJ.update(k_); postawione += 1
        st_ = (kat, cel, postawione)
        umiesc.log.append(st_)


umiesc.log = []


def zdarzenia_miejsca(m, sp, poi, szablony):
    """zdarzenia małego miejsca zbierania wokół poi"""
    cx, cy = poi
    rnd = random.Random(sp["seed"] + 11)
    def poloz(ch, dx, dy):
        e0 = szablony.get(ch)
        if not e0: return False
        e = copy.deepcopy(e0); e["x"], e["y"] = cx + dx, cy + dy
        k_ = kom(e)
        if k_ & ZAJ: return False
        Z.dodaj(m, e, bulk=True); ZAJ.update(k_); return True
    typ = sp["miejsce"]
    if typ == "krag":
        poloz("!$Rock_Cairn", 0, 0)
        for k in range(6):
            a = k * math.pi / 3 + 0.3; poloz(rnd.choice(["!$Rock_Mossy", "!$Rock_Flat", "!$Rock_Cracked"]), int(round(3 * math.cos(a))), int(round(3 * math.sin(a))))
    elif typ == "pien":
        poloz("!$Stump_Tall", 0, 0); poloz("!$Trunk_Dead", -2, 1); poloz("!$Trunk_Dead", 2, 2); poloz("!$Bush_Bare_Wide", 3, -2); poloz("!$Bush_Bare_A", -3, -2); poloz("!$Rock_Mossy", 1, -3)
    elif typ == "ruda":
        poloz("!$Rock_Ore_Iron", 0, 0); poloz("!$Rock_Ore_Iron", 2, 1); poloz("!$Rock_Twin", -2, 0); poloz("!$Rock_Pile", 1, -2); poloz("!$Rock_Mossy", -1, 2)
    elif typ == "jablon":
        poloz("!$Tree_Apple", 0, -1); poloz("!$Trunk_Dead", -3, 1); poloz("!$Bush_Bare_Vines", 3, 1); poloz("!$Bush_Bare_A", -2, -3); poloz("!$Rock_Mossy", 2, 3)
    elif typ == "dryf":
        poloz("!$Trunk_Dead", 0, 0); poloz("!$Trunk_Dead", 3, 1); poloz("!$Trunk_Dead", -2, 2); poloz("!$Rock_Flat", 2, -2); poloz("!$Bush_Bare_Wide", -3, -1)
