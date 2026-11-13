# -*- coding: utf-8 -*-
"""Zaokraglanie kanciastych plam gruntu naturalnego (trawa 16, ziemia 17, piasek 24/25/26, ciemna trawa 27 - A2, warstwa 0).
Krok 2 planu "ladnie, rowno, nie kanciasto" (gracz 2026-11-10). Modul importowalny:

    stats = zaokraglij(m, mid, ochrona=[(x0, y0, x1, y1), ...], widoczne=False)

m = slownik mapy (width, height, tilesetId, data, events, note) - zmieniany W MIEJSCU (tylko warstwa 0; regiony nietkniete).
Co ruszamy: tylko kratki w okolicy "naruszen": pojedyncze kratki / paski jednej kratki / prostokatne plamy / proste odcinki obrysu
(> 4 kratki) miedzy dwoma gruntami naturalnymi. Reszta mapy bez zmian. Obrys: wielo-etykietowe wygladzenie (rozmycie gaussa wskaznikow
rodzajow) + niskoczestotliwosciowy szum (zgrubienia 3-4 kratki, amplituda ~ 1 kratka); z wielu wariantow wybierany ten z najmniejsza
liczba naruszen, areal plamy +-12%. Potem autokafle (WS.reshape) zmienionych kratek i ich 8 sasiadow.
NIE RUSZA (kratki + 1 kratka marginesu): kafle nienaturalne (woda, bruk, mury, klify, A5, drogi 39/40/43), warstwa 1 z plotami/murami/
nakladkami gruntu, warstwy 2-3, zdarzenia z obrazkiem budynku/plotu/bramy/drzwi/posagu i przeniesienia, prostokaty `ochrona`,
pas przy wodzie (SHORE kratek), 3 kratki przy krawedzi mapy; plamy dotykajace krawedzi mapy sa pomijane."""
import os, sys, re, math
import numpy as np
import cv2
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
for p in ("tools/rozszerzenia", "tools/mapy", "tools/newstart"): sys.path.insert(0, os.path.join(ROOT, p))
import wspolne as WS
import mapylib as L

NAT = (16, 17, 24, 25, 26, 27)
PLAMY_J = (17, 24, 27)
DECOR1 = {21, 28, 29, 31}           # nakladki-ozdobniki na warstwie 1, nie blokuja
SHORE = 3                           # pas przy wodzie (kratki), nietykalny
EDGE = 4
RUN_MAX = 4
DECOR_CHAR = {"!Town_Props", "!Decoration", "!Decoration2", "!Tavern_Props"}
NATURE_CHAR = re.compile(r"^!?\$?(Rock|Bush|Tree|Pine|Stump|Trunk|Log|Boulder|Big_Trees|Mushroom|Flower|Grass|Fern|Animal|Clover)", re.I)
SIGMAS = (1.2, 1.6)
AMPS = (0.35, 0.55, 0.8)
SCALES = (3.0, 4.0)
GROWS = (0.0, 0.08, 0.16)
SEEDS = (1, 2, 3, 4)


# ------------------------------------------------------------------ szum (wektorowy, deterministyczny)
def _h(ix, iy, seed):
    n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    n = n ^ (n >> 16)
    return (n & 0xFFFF) / 65535.0


def vnoise(X, Y, seed, scale):
    gx, gy = X / scale, Y / scale
    x0, y0 = np.floor(gx).astype(np.int64), np.floor(gy).astype(np.int64)
    fx, fy = gx - x0, gy - y0
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    top = _h(x0, y0, seed) * (1 - fx) + _h(x0 + 1, y0, seed) * fx
    bot = _h(x0, y0 + 1, seed) * (1 - fx) + _h(x0 + 1, y0 + 1, seed) * fx
    return top * (1 - fy) + bot * fy


# ------------------------------------------------------------------ ochrona
def dil(m, r):
    if r <= 0: return m.copy()
    k = np.ones((2 * r + 1, 2 * r + 1), np.uint8)
    return cv2.dilate(m.astype(np.uint8), k).astype(bool)


def kinds_of(a):
    return np.where(a >= 2048, (a - 2048) // 48, -1)


def ochronione(m, mid, ochrona=()):
    W, H = m["width"], m["height"]; n = W * H
    D = np.array(m["data"], dtype=np.int64)
    t = [D[z * n:(z + 1) * n].reshape(H, W) for z in range(4)]
    K0, K1 = kinds_of(t[0]), kinds_of(t[1])
    nat0 = np.isin(K0, NAT)
    blk = ~nat0
    n1 = t[1] != 0
    dec = np.isin(K1, list(DECOR1))
    nat1 = np.isin(K1, NAT)
    cliff = (K1 == 47)
    raw = {"width": W, "height": H, "tilesetId": m["tilesetId"], "data": m["data"], "events": m["events"], "note": m.get("note", "")}
    mp = L.Mapa(mid, raw=raw)
    cache = {}

    def konstrukcja(tid):
        """kafel B-E / A5 jest elementem konstrukcji (blokuje, gwiazdka, budynek), a nie drobnym ozdobnikiem (kamyk, kwiatek, krzak)"""
        if tid not in cache:
            if tid >= 1536: cache[tid] = True          # A5 i autokafle
            else:
                f = mp.zest.flag(tid); cache[tid] = bool(f & 0x1F)
        return cache[tid]
    deco_tile = np.zeros((H, W), bool)
    for z in (1, 2, 3):
        for y, x in np.argwhere(t[z] != 0).tolist():
            tid = int(t[z][y, x])
            if tid >= 2048: continue
            if konstrukcja(tid): blk[y, x] = True
            else: deco_tile[y, x] = True
    blk |= n1 & (K1 >= 0) & ~dec & ~nat1 & ~cliff
    blk |= (t[2] >= 2048) | (t[3] >= 2048)
    water = ((t[0] >= 2048) & (t[0] < 2816)) | ((t[1] >= 2048) & (t[1] < 2816))
    # zdarzenia
    ev = np.zeros((H, W), bool)
    for e in mp.zd:
        if e.przenosi or e.drzwi or "<Drzwi" in e.note:
            cells = e.komorki()
        elif e.widoczne and not e.char and e.tile_id and not konstrukcja(e.tile_id):
            continue                                                            # zdarzenie-kafel B-E bedacy drobnym ozdobnikiem (krzak, kamyk)
        elif e.widoczne and not NATURE_CHAR.match(e.char or "") and not (e.char or "").startswith("$"):
            cells = e.komorki()
            if (e.char or "") in DECOR_CHAR and len(cells) <= 2: continue      # drobny rekwizyt (beczka, kosz...): grunt pod nim moze sie zmienic
        else:
            continue
        for (x, y) in cells:
            if 0 <= x < W and 0 <= y < H: ev[y, x] = True
    blk |= ev
    for (x0, y0, x1, y1) in ochrona:
        blk[max(0, y0):y1 + 1, max(0, x0):x1 + 1] = True
    nf = dil(blk, 1) | dil(water, SHORE) | nat1 | cliff
    ochronione.last = {"blk": blk, "ev": ev, "water": dil(water, SHORE), "nat1": nat1, "cliff": cliff}
    nf[:EDGE, :] = True; nf[-EDGE:, :] = True; nf[:, :EDGE] = True; nf[:, -EDGE:] = True
    return K0, nat0, nf


# ------------------------------------------------------------------ naruszenia
def _runs(vals):
    """vals: posortowane (klucz) -> grupy kolejnych kluczy"""
    out = []; i = 0
    while i < len(vals):
        j = i
        while j + 1 < len(vals) and vals[j + 1] == vals[j] + 1: j += 1
        out.append((i, j)); i = j + 1
    return out


def naruszenia(K, FN, kinds=NAT, edge_skip=True):
    """lista (opis, [kratki (x,y)], kind) naruszen na calej tablicy K (H,W): pojedyncze/paski, prostokaty, proste odcinki > RUN_MAX miedzy gruntami
    (obie strony wolne+naturalne). Plamy dotykajace krawedzi mapy pomijane."""
    H, W = K.shape; out = []
    for kk in kinds:
        m = (K == kk)
        if not m.any(): continue
        nl, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=4)
        for i in range(1, nl):
            x0, y0, bw, bh, area = st[i]
            if x0 == 0 or y0 == 0 or x0 + bw == W or y0 + bh == H: continue
            ys, xs = np.where(lab == i)
            cells = list(zip(xs.tolist(), ys.tolist()))
            if not FN[ys, xs].any(): continue
            if area == 1 or (min(bw, bh) == 1 and area <= 12):
                out.append(("mala", cells, kk)); continue
            if kk in PLAMY_J and area >= 8 and bw >= 4 and bh >= 3 and area >= 0.85 * bw * bh:
                out.append(("prostokat", cells, kk)); continue
    # proste odcinki: na poziomie masek calosci (obie strony FN)
    for kk in kinds:
        m = (K == kk) & FN
        if not m.any(): continue
        for nm, dy, dx in (("N", -1, 0), ("S", 1, 0), ("W", 0, -1), ("E", 0, 1)):
            nb = np.zeros_like(m); nbK = np.full(K.shape, -2)
            if dy == -1: nb[1:, :] = FN[:-1, :]; nbK[1:, :] = K[:-1, :]
            elif dy == 1: nb[:-1, :] = FN[1:, :]; nbK[:-1, :] = K[1:, :]
            elif dx == -1: nb[:, 1:] = FN[:, :-1]; nbK[:, 1:] = K[:, :-1]
            else: nb[:, :-1] = FN[:, 1:]; nbK[:, :-1] = K[:, 1:]
            bnd = m & nb & (nbK != kk) & np.isin(nbK, kinds)
            if dy:
                for y in np.unique(np.where(bnd)[0]):
                    xs = np.where(bnd[y])[0].tolist()
                    for a, b in _runs(xs):
                        if b - a + 1 > RUN_MAX:
                            out.append(("odcinek", [(xs[q], int(y)) for q in range(a, b + 1)], kk))
            else:
                for x in np.unique(np.where(bnd)[1]):
                    ys = np.where(bnd[:, x])[0].tolist()
                    for a, b in _runs(ys):
                        if b - a + 1 > RUN_MAX:
                            out.append(("odcinek", [(int(x), ys[q]) for q in range(a, b + 1)], kk))
    return out


def punkty(vs, reg=None):
    """waga naruszen (tylko te, ktore dotykaja kratek maski reg, gdy podana)"""
    w = {"mala": 5, "prostokat": 3, "odcinek": 1}
    t = 0
    for v in vs:
        if reg is not None and not any(reg[y, x] for (x, y) in v[1]): continue
        t += w[v[0]]
    return t


# ------------------------------------------------------------------ jeden klaster
def optymalizuj(K, FN, A, Cmask, ys0, ys1, xs0, xs1, base_comp_sizes):
    """K: tablica rodzajow (zmieniana kopia zwracana), A: maska dozwolonych kratek (bool, cala mapa). Zwraca (Knew, score, V_after) albo None"""
    H, W = K.shape
    y0, y1, x0, x1 = max(0, ys0 - 8), min(H, ys1 + 9), max(0, xs0 - 8), min(W, xs1 + 9)
    Kw = K[y0:y1, x0:x1]; Aw = A[y0:y1, x0:x1]; Cw = Cmask[y0:y1, x0:x1].astype(np.float32); FNw = FN[y0:y1, x0:x1]
    h, w = Kw.shape
    YY, XX = np.mgrid[y0:y1, x0:x1]
    labs = [k for k in NAT if (Kw == k).any()]
    if len(labs) < 2: return None
    ind = {k: ((Kw == k).astype(np.float32) * Cw) for k in labs}
    size_before = {k: int(((Kw == k) & Aw).sum()) for k in labs}
    reg = dil(Aw, 2)
    v0 = punkty(naruszenia(Kw, FNw), reg)
    if v0 == 0: return None
    best = None
    for sg in SIGMAS:
        den = cv2.GaussianBlur(Cw, (0, 0), sg, borderType=cv2.BORDER_REFLECT)
        den = np.maximum(den, 1e-3)
        B = {k: cv2.GaussianBlur(ind[k], (0, 0), sg, borderType=cv2.BORDER_REFLECT) / den for k in labs}
        for scale in SCALES:
            for seed in SEEDS:
                nz = {k: (vnoise(XX, YY, seed * 31 + k * 7, scale) - 0.5) * 2 for k in labs}
                for amp in AMPS:
                    for g in GROWS:
                        sc = np.stack([B[k] + amp * nz[k] * 0.5 + (g if base_comp_sizes.get(k, 1e9) < 200 else 0) + 0.04 * (Kw == k) for k in labs])
                        new = np.array(labs)[np.argmax(sc, axis=0)]
                        Kn = np.where(Aw & (Cw > 0), new, Kw)
                        Kn = _clean(Kn, Kw, Aw, labs)
                        vs = naruszenia(Kn, FNw)
                        V = punkty(vs, reg)
                        chg = int((Kn != Kw).sum())
                        dev = 0.0
                        for k in labs:
                            sb = base_comp_sizes.get(k, 0)
                            if sb >= 8:
                                da = abs(int(((Kn == k) & Aw).sum()) - size_before[k]) / sb
                                dev = max(dev, da)
                        score = V * 100 + max(0.0, dev - 0.12) * 600 + dev * 20 + chg * 0.15
                        if best is None or score < best[1]: best = (Kn.copy(), score, V, dev, chg)
    if best is None: return None
    base_score = v0 * 100
    if best[1] >= base_score: return None
    Kfull = K.copy(); Kfull[y0:y1, x0:x1] = best[0]
    return Kfull, best[1], best[2], v0, best[3], best[4]


def _clean(Kn, Kw, Aw, labs):
    """usun 1-kratkowe wypustki i dziury, przeciecia po skosie (tylko w dozwolonych kratkach)"""
    h, w = Kn.shape; Kn = Kn.copy()
    cells = [(y, x) for y, x in np.argwhere(Aw).tolist() if 1 <= y < h - 2 and 1 <= x < w - 2]
    for _ in range(4):
        ch = False
        for (y, x) in cells:
            c = Kn[y, x]
            nb = (Kn[y - 1, x], Kn[y + 1, x], Kn[y, x - 1], Kn[y, x + 1])
            same = int(nb[0] == c) + int(nb[1] == c) + int(nb[2] == c) + int(nb[3] == c)
            if same <= 1:
                cnt = {}
                for q in nb:
                    if q != c: cnt[q] = cnt.get(q, 0) + 1
                q, qn = max(cnt.items(), key=lambda it: it[1])
                if qn >= 2 and q in labs: Kn[y, x] = q; ch = True
        for (y, x) in cells:
            a, b, c, d = Kn[y, x], Kn[y, x + 1], Kn[y + 1, x], Kn[y + 1, x + 1]
            if a == d and b == c and a != b:
                for (yy, xx, to) in ((y, x, b), (y + 1, x + 1, b), (y, x + 1, a), (y + 1, x, a)):
                    if Aw[yy, xx]: Kn[yy, xx] = to; ch = True; break
        if not ch: break
    return Kn


# ------------------------------------------------------------------ drogi (ziemia 17): cienkie czesci nie tracą kratek
ROAD_KIND = 17
STRAY_AREA = 12          # zbledne kratki ziemi: pojedyncze albo paski jednej kratki o <= tylu kratkach (nie droga, nie plama): mozna usunac


def is_stray(stat):
    return min(stat[2], stat[3]) == 1 and stat[4] <= STRAY_AREA


def keep_mask(K):
    """kratki ziemi 17 oryginalu, ktorych NIE wolno usunac: nalezą do plamy >= STRAY_AREA i lokalnie waskie
    (maks. odleglosc szachownicowa od nie-17 w ich 3x3 < 3, czyli plama ma tam < ok. 5 kratek szerokosci)"""
    m = (K == ROAD_KIND).astype(np.uint8)
    keep = np.zeros(K.shape, bool)
    if not m.any(): return keep
    dist = cv2.distanceTransform(m, cv2.DIST_C, 3)
    wide = cv2.dilate(dist, np.ones((3, 3), np.uint8)) >= 3
    nl, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=4)
    for i in range(1, nl):
        if is_stray(st[i]): continue
        keep |= (lab == i) & ~wide
    return keep


ROAD_THIN_SHARE = 0.5    # plama 17, w ktorej >= polowa kratek jest waska (< ok. 5 szerokosci), to droga: nie zmienia sie wcale


def drogi(K):
    """kratki drog (2026-11-10, gracz widzial wyprostowana droge na Map004): cale plamy ziemi 17, w ktorych >= ROAD_THIN_SHARE kratek
    jest lokalnie waskich - drogi rysowal autor recznie; ani nie traca, ani nie zyskuja kratek (zyskiwanie prostowalo ich faliste brzegi
    i laczylo je z plamami obok)"""
    m = (K == ROAD_KIND).astype(np.uint8)
    road = np.zeros(K.shape, bool)
    if not m.any(): return road
    dist = cv2.distanceTransform(m, cv2.DIST_C, 3)
    thin = (cv2.dilate(dist, np.ones((3, 3), np.uint8)) < 3) & (m > 0)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=4)
    for i in range(1, nl):
        if is_stray(st[i]): continue
        comp = lab == i
        if (thin & comp).sum() >= ROAD_THIN_SHARE * st[i][4]: road |= comp
    return road


def napraw_polaczenia(K, orig):
    """kazda oryginalna plama 17 (>= STRAY_AREA) ma zostac jednym kawalkiem: gdy nie, przywroc jej usuniete kratki"""
    m0 = (orig == ROAD_KIND).astype(np.uint8)
    nl0, lab0, st0, _ = cv2.connectedComponentsWithStats(m0, connectivity=4)
    fixed = 0
    for i in range(1, nl0):
        if is_stray(st0[i]): continue
        comp = lab0 == i
        for _ in range(3):
            kept = comp & (K == ROAD_KIND)
            nl, lab = cv2.connectedComponents((K == ROAD_KIND).astype(np.uint8), connectivity=4)
            if len(set(np.unique(lab[kept]).tolist())) <= 1: break
            K[comp & (K != ROAD_KIND)] = ROAD_KIND; fixed += 1
    return fixed


# ------------------------------------------------------------------ cala mapa
def zaokraglij(m, mid, ochrona=(), passes=3, log=None):
    W, H = m["width"], m["height"]; n = W * H
    K0, nat0, nf = ochronione(m, mid, ochrona)
    K = np.where(nat0, K0, -1).astype(np.int64)
    FN = nat0 & ~nf
    orig = K.copy()
    KEEP = keep_mask(orig)
    FROZEN = dil(drogi(orig), 1)                                 # (drogi i kratka wokol nich: bez zmian)
    nclusters = 0; left = []
    for ps in range(passes):
        vs = naruszenia(K, FN)
        if not vs: break
        progress = False
        for (opis, cells, kk) in vs:
            b = np.zeros((H, W), bool)
            for (x, y) in cells: b[y, x] = True
            b = dil(dil(b, 1), 1) if opis == "odcinek" else dil(b, 3)
            Ai = b & FN & ~KEEP & ~FROZEN
            if not Ai.any(): continue
            ys, xs = np.where(Ai)
            sizes = {}
            for k2 in NAT:
                mk = (K == k2)
                if not (mk & Ai).any(): continue
                nc, lb, sts, _ = cv2.connectedComponentsWithStats(mk.astype(np.uint8), connectivity=4)
                ids = set(np.unique(lb[Ai & mk]).tolist()) - {0}
                sizes[k2] = int(sum(sts[j][4] for j in ids))
            r = optymalizuj(K, FN, Ai, nat0, ys.min(), ys.max(), xs.min(), xs.max(), sizes)
            if r is None: continue
            Kn, score, V, v0, dev, chg = r
            K = Kn; progress = True; nclusters += 1
            if log: log("  %s %d (%d,%d): naruszenia %d -> %d, areal %.0f%%, zmian %d" % (opis, kk, xs.min(), ys.min(), v0, V, dev * 100, chg))
        if not progress: break
    napraw_polaczenia(K, orig)
    # dziurki w drogach (2026-11-10: kratka trawy srodku drogi Przystani): skladowa innego gruntu <= 2 kratek, cala otoczona ziemia 17 -> 17
    other = FN & (K != ROAD_KIND) & (K >= 0)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(other.astype(np.uint8), connectivity=4)
    for i in range(1, nl):
        if st[i][4] > 2: continue
        comp = lab == i
        ring = dil(comp, 1) & ~comp
        if (K[ring] == ROAD_KIND).all(): K[comp] = ROAD_KIND
    changed = [(int(x), int(y)) for y, x in zip(*np.where(K != orig))]
    # zapis kafli warstwy 0
    for (x, y) in changed:
        m["data"][y * W + x] = 2048 + int(K[y, x]) * 48
    ring = WS.ring(changed, 1)
    WS.reshape(m, 0, ring)
    return {"zmienione": len(changed), "klastry": nclusters, "zostalo": len(naruszenia(K, FN)), "komorki": changed}
