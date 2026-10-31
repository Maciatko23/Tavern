# -*- coding: utf-8 -*-
# Układ świata z samych map: przeszukiwanie wiązkowe (beam search). Mapy dokładane po jednej, zawsze „przyklejone” krawędzią do już stojącej mapy
# (z zakładką), ocena: brak nakładania, zgodność wody i lądu na wspólnych krawędziach, zachowane przesunięcia przejść, zwartość.
# Potem zachłanne dokładanie nowych map brzegowych (wypełniaczy) w miejscach, gdzie krawędź z lądem nie ma sąsiada.
#   python tools/mapy/uklad_beam.py [szerokosc_wiazki]
import os, sys, json, math, random, itertools
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
import uklad_szukaj as U

IDS = [m for m in U.IDS if m not in U.FILL]
SZ, WM = U.SZ, U.WM
EXACT = {(a, b): d for a, b, d in U.EXACT}
FLEX = {(a, b): w for a, b, w in U.FLEX}
CHAIN = {155: (0, 16), 157: (96, 14), 159: (208, 0), 175: (216, 86), 120: (216, 146)}     # (159 +6 rzędów w dół: patrz WZROST)
WZROST = {159: (0, 6)}
ORDER = [13, 8, 111, 24, 3, 4, 23, 22, 20, 21, 125, 162, 165, 18, 17, 168]
ORDERS = {1: ORDER, 2: [13, 8, 24, 111, 22, 3, 4, 23, 20, 21, 125, 162, 165, 18, 17, 168], 3: [8, 13, 111, 24, 22, 21, 3, 20, 4, 23, 125, 162, 165, 18, 17, 168], 4: [13, 8, 111, 24, 3, 23, 4, 20, 22, 21, 125, 18, 17, 168, 162, 165]}
BIG = 1e7


def wm(m):
    a = WM[m]
    if m in WZROST:
        dw, dh = WZROST[m]
        a = np.vstack([a] + [a[-1:, :]] * dh)
    return a


WMX = {m: wm(m) for m in IDS}
SZX = {m: (WMX[m].shape[1], WMX[m].shape[0]) for m in IDS}


def ocena(pos, extra_open=0.0):
    """koszt układu częściowego (słownik id -> (x, y))"""
    ids = list(pos)
    W_, H_ = 900, 800
    O = np.full((H_, W_), -1, np.int16); Wr = np.zeros((H_, W_), bool)
    ox, oy = 100, 100
    over = 0
    for m in ids:
        x, y = pos[m][0] + ox, pos[m][1] + oy; w, h = SZX[m]
        if x < 2 or y < 2 or x + w > W_ - 2 or y + h > H_ - 2: return BIG * 2
        sl = (slice(y, y + h), slice(x, x + w))
        over += int((O[sl] >= 0).sum()); O[sl] = m; Wr[sl] = WMX[m]
    if over: return BIG + over
    mism = 0; shared = 0; openl = 0
    for m in ids:
        x, y = pos[m][0] + ox, pos[m][1] + oy; w, h = SZX[m]; a = WMX[m]
        for side in "NSWE":
            if side == "N": cells, own, ww = a[0, :], O[y - 1, x:x + w], Wr[y - 1, x:x + w]
            elif side == "S": cells, own, ww = a[h - 1, :], O[y + h, x:x + w], Wr[y + h, x:x + w]
            elif side == "W": cells, own, ww = a[:, 0], O[y:y + h, x - 1], Wr[y:y + h, x - 1]
            else: cells, own, ww = a[:, w - 1], O[y:y + h, x + w], Wr[y:y + h, x + w]
            cov = own >= 0
            mism += int((cov & (ww != cells)).sum()); shared += int(cov.sum()); openl += int(((~cov) & ~cells).sum())
    link = 0.0
    for (a, b), (dx, dy) in EXACT.items():
        if a in pos and b in pos: link += 12 * (abs(pos[b][0] - pos[a][0] - dx) + abs(pos[b][1] - pos[a][1] - dy))
    for (a, b), wg in FLEX.items():
        if a in pos and b in pos: link += wg * adj(pos, a, b)
    if 3 in pos and 20 in pos:
        x3, y3 = pos[3]; x20, y20 = pos[20]; w20 = SZX[20][0]
        link += 12 * abs(y20 - (y3 + 60)) + 12 * (max(0, x20 + 2 - (x3 + 8)) + max(0, (x3 + 11) - (x20 + w20 - 2)))
    if 3 in pos and 24 in pos:
        x3, y3 = pos[3]; x24, y24 = pos[24]; w24, h24 = SZX[24]
        link += 12 * abs(x24 + w24 - x3) + 12 * (max(0, y24 + 2 - (y3 + 14)) + max(0, (y3 + 17) - (y24 + h24 - 2)))
    if 8 in pos and 125 in pos:
        x8, y8 = pos[8]; h8 = SZX[8][1]; x125, y125 = pos[125]; w125 = SZX[125][0]
        link += 12 * abs(y125 - (y8 + h8)) + 12 * (max(0, x125 + 2 - (x8 + 24)) + max(0, (x8 + 27) - (x125 + w125 - 2)))
    xs = [pos[m][0] for m in ids]; ys = [pos[m][1] for m in ids]
    xe = [pos[m][0] + SZX[m][0] for m in ids]; ye = [pos[m][1] + SZX[m][1] for m in ids]
    box = (max(xe) - min(xs)) * (max(ye) - min(ys)) / 600.0
    return 6 * mism - 0.6 * shared + 1.5 * openl + link + box + extra_open


def adj(pos, a, b):
    ax, ay = pos[a]; bx, by = pos[b]; aw, ah = SZX[a]; bw, bh = SZX[b]
    best = 1e9
    for gap in (abs(bx - (ax + aw)), abs(ax - (bx + bw))):
        ov = min(ay + ah, by + bh) - max(ay, by); best = min(best, gap * 4 + max(0, 24 - ov) * 4)
    for gap in (abs(by - (ay + ah)), abs(ay - (by + bh))):
        ov = min(ax + aw, bx + bw) - max(ax, bx); best = min(best, gap * 4 + max(0, 24 - ov) * 4)
    return best


def kandydaci(pos, m, rnd):
    w, h = SZX[m]
    out = set()
    for j, (xj, yj) in pos.items():
        wj, hj = SZX[j]
        offs_y = {0, hj - h, (hj - h) // 2, 24 - h, hj - 24}
        offs_x = {0, wj - w, (wj - w) // 2, 24 - w, wj - 24}
        for (a, b), (dx, dy) in EXACT.items():           # przesunięcia z przejść
            if a == j and b == m: out.add((xj + dx, yj + dy))
            if b == j and a == m: out.add((xj - dx, yj - dy))
        for oy in offs_y: out.add((xj + wj, yj + oy)); out.add((xj - w, yj + oy))
        for ox in offs_x: out.add((xj + ox, yj + hj)); out.add((xj + ox, yj - h))
        for _ in range(3):
            out.add((xj + wj, yj + rnd.randint(24 - h, hj - 24))); out.add((xj - w, yj + rnd.randint(24 - h, hj - 24)))
            out.add((xj + rnd.randint(24 - w, wj - 24), yj + hj)); out.add((xj + rnd.randint(24 - w, wj - 24), yj - h))
    return out


def beam(B=30, seed=1):
    rnd = random.Random(seed)
    start = {m: CHAIN[m] for m in CHAIN}
    stany = [(ocena(start), start)]
    for m in ORDERS.get(seed, ORDER):
        nowe = []
        for e0, pos in stany:
            for c in kandydaci(pos, m, rnd):
                p2 = dict(pos); p2[m] = c
                e = ocena(p2)
                if e < BIG: nowe.append((e, p2))
        nowe.sort(key=lambda t: t[0])
        # różnorodność: nie powtarzaj tych samych układów
        uniq = []; seen = set()
        for e, p in nowe:
            k = tuple(sorted(p.items()))
            if k in seen: continue
            seen.add(k); uniq.append((e, p))
            if len(uniq) >= B: break
        stany = uniq
        print(m, "stanow", len(stany), "najlepszy %.0f" % stany[0][0] if stany else "-"); sys.stdout.flush()
        if not stany: break
    return stany


# ---------------------------------------------------------------------------------------------- wypełniacze (nowe mapy brzegowe)
TYPY = {"E": (76, 80), "W": (76, 80), "S": (80, 76), "N": (80, 76), "NE": (96, 96), "NW": (96, 96), "SE": (96, 96), "SW": (96, 96),
        "EE": (76, 120), "SS": (120, 76), "WW": (76, 120), "NN": (120, 76)}


def dodaj_wypelniacz(spec, fid, typ):
    w, h = TYPY[typ][0], TYPY[typ][1]
    t = typ[0] if typ in ("EE", "SS", "WW", "NN") else typ
    SZX[fid] = (w, h); WMX[fid] = U.band(t, w, h)
    spec[fid] = (t, w, h)


def wypelnij(pos, maks=30, spec=None, koszt=25):
    spec = dict(spec or {})
    nid = max([900] + list(spec)) + 1
    cur = ocena(pos)
    for it in range(maks):
        best = None
        # kandydaci: przy każdej mapie (też już dołożonej) z otwartą krawędzią lądu
        for j, (xj, yj) in list(pos.items()):
            wj, hj = SZX[j]
            for typ in TYPY:
                w, h = TYPY[typ]
                cand = set()
                for oy in (0, hj - h, -h + 16, hj - 16, (hj - h) // 2):
                    cand.add((xj + wj, yj + oy)); cand.add((xj - w, yj + oy))
                for ox in (0, wj - w, -w + 16, wj - 16, (wj - w) // 2):
                    cand.add((xj + ox, yj + hj)); cand.add((xj + ox, yj - h))
                for c in cand:
                    SZX[nid] = (w, h); WMX[nid] = U.band(typ[0] if typ in ("EE", "SS", "WW", "NN") else typ, w, h)
                    p2 = dict(pos); p2[nid] = c
                    e = ocena(p2, extra_open=0)
                    if e < BIG:
                        e += koszt   # koszt nowej mapy
                        if best is None or e < best[0]: best = (e, c, typ, nid)
        if best is None or best[0] >= cur - 1: break
        e, c, typ, fid = best
        dodaj_wypelniacz(spec, fid, typ)
        pos[fid] = c
        cur = ocena(pos)
        print("wypelniacz", fid, typ, c, "energia %.0f" % cur); sys.stdout.flush()
        nid = fid + 1
    return pos, spec




def otwarte(pos):
    """odcinki krawędzi z lądem bez sąsiada: (mapa, strona, od, do)"""
    ox, oy = 100, 100
    O = np.full((800, 900), -1, np.int16)
    for m in pos:
        x, y = pos[m][0] + ox, pos[m][1] + oy; w, h = SZX[m]
        O[y:y + h, x:x + w] = m
    out = []
    for m in pos:
        x, y = pos[m][0] + ox, pos[m][1] + oy; w, h = SZX[m]; a = WMX[m]
        for side in "NSWE":
            if side == "N": cells, own = a[0, :], O[y - 1, x:x + w]
            elif side == "S": cells, own = a[h - 1, :], O[y + h, x:x + w]
            elif side == "W": cells, own = a[:, 0], O[y:y + h, x - 1]
            else: cells, own = a[:, w - 1], O[y:y + h, x + w]
            bad = (own < 0) & ~cells
            i = 0; n = len(bad)
            while i < n:
                if bad[i]:
                    j = i
                    while j < n and bad[j]: j += 1
                    out.append((m, side, i, j)); i = j
                else: i += 1
    return out


ROZM = [(60, 60), (80, 60), (60, 80), (80, 80), (100, 80), (80, 100), (120, 80), (100, 100)]
TYPY2 = ["", "N", "S", "E", "W", "NE", "NW", "SE", "SW"]


def zamkniecie(pos):
    """koszt domknięcia: tylko otwarty ląd, niezgodne styki i nakładanie (bez nagrody za zwartość)"""
    ox, oy = 100, 100
    O = np.full((800, 900), -1, np.int16); Wr = np.zeros((800, 900), bool); over = 0
    for m in pos:
        x, y = pos[m][0] + ox, pos[m][1] + oy; w, h = SZX[m]
        if x < 2 or y < 2 or x + w > 898 or y + h > 798: return BIG
        sl = (slice(y, y + h), slice(x, x + w)); over += int((O[sl] >= 0).sum()); O[sl] = m; Wr[sl] = WMX[m]
    if over: return BIG
    mism = 0; openl = 0
    for m in pos:
        x, y = pos[m][0] + ox, pos[m][1] + oy; w, h = SZX[m]; a = WMX[m]
        for side in "NSWE":
            if side == "N": cells, own, ww = a[0, :], O[y - 1, x:x + w], Wr[y - 1, x:x + w]
            elif side == "S": cells, own, ww = a[h - 1, :], O[y + h, x:x + w], Wr[y + h, x:x + w]
            elif side == "W": cells, own, ww = a[:, 0], O[y:y + h, x - 1], Wr[y:y + h, x - 1]
            else: cells, own, ww = a[:, w - 1], O[y:y + h, x + w], Wr[y:y + h, x + w]
            cov = own >= 0
            mism += int((cov & (ww != cells)).sum()); openl += int(((~cov) & ~cells).sum())
    return 3 * openl + 6 * mism


def wypelnij2(pos, spec, maks=40, koszt=40):
    spec = dict(spec)
    nid = max([900] + list(spec)) + 1
    cur = zamkniecie(pos)
    for it in range(maks):
        runs = otwarte(pos)
        if not runs: break
        best = None
        for (m, side, a, b) in runs:
            x, y = pos[m]; w, h = SZX[m]
            for (fw, fh) in ROZM:
                for typ in TYPY2:
                    if (side == "E" and "W" in typ) or (side == "W" and "E" in typ) or (side == "N" and "S" in typ) or (side == "S" and "N" in typ): continue
                    ln = fh if side in "EW" else fw
                    for off in (a, b - ln, a - 16, b + 16 - ln, (a + b - ln) // 2):
                        if side == "E": c = (x + w, y + off)
                        elif side == "W": c = (x - fw, y + off)
                        elif side == "S": c = (x + off, y + h)
                        else: c = (x + off, y - fh)
                        SZX[nid] = (fw, fh); WMX[nid] = U.band(typ, fw, fh)
                        p2 = dict(pos); p2[nid] = c
                        e = zamkniecie(p2)
                        if e < BIG:
                            e += koszt
                            if best is None or e < best[0]: best = (e, c, typ, fw, fh)
        if best is None or best[0] >= cur - 0.5: break
        e, c, typ, fw, fh = best
        SZX[nid] = (fw, fh); WMX[nid] = U.band(typ, fw, fh)
        pos[nid] = c; spec[nid] = (typ, fw, fh)
        cur = zamkniecie(pos)
        print("wyp2", nid, repr(typ), fw, fh, c, "energia %.0f otwarte %d" % (cur, sum(b - a for _, _, a, b in otwarte(pos)))); sys.stdout.flush()
        nid += 1
    return pos, spec




def lancuch(pos, m, side, a, b, ext_a, ext_b, depth):
    """ścianka nowych map brzegowych wzdłuż odcinka (a, b) krawędzi `side` mapy m: kawałki 60-120 kratek, morze od zewnątrz,
    na końcach morze też z boku (róg) tam, gdzie ścianka wystaje poza odcinek"""
    x, y = pos[m]; w, h = SZX[m]
    start = a - ext_a; total = (b - a) + ext_a + ext_b
    n = max(1, int(math.ceil(total / 120.0)))
    while total / n < 60 and n > 1: n -= 1
    lens = [total // n + (1 if i < total % n else 0) for i in range(n)]
    if min(lens) < 60: return None
    out = []
    pos0 = start
    for i, ln in enumerate(lens):
        typ = {"E": "E", "W": "W", "N": "N", "S": "S"}[side]
        if side in "EW":
            if i == 0 and ext_a > 0: typ += "N"
            if i == n - 1 and ext_b > 0: typ += "S"
            fw, fh = depth, ln
            c = (x + w, y + pos0) if side == "E" else (x - fw, y + pos0)
        else:
            if i == 0 and ext_a > 0: typ += "W"
            if i == n - 1 and ext_b > 0: typ += "E"
            fw, fh = ln, depth
            c = (x + pos0, y + h) if side == "S" else (x + pos0, y - fh)
        out.append((typ, fw, fh, c))
        pos0 += ln
    return out


def wypelnij3(pos, spec, maks=40):
    spec = dict(spec)
    nid = max([900] + list(spec)) + 1
    cur = zamkniecie(pos)
    for it in range(maks):
        runs = otwarte(pos)
        if not runs: break
        best = None
        for (m, side, a, b) in runs:
            for ext_a in (0, 8, 16, 24):
                for ext_b in (0, 8, 16, 24):
                    for depth in (60, 76, 96):
                        ch = lancuch(pos, m, side, a, b, ext_a, ext_b, depth)
                        if not ch: continue
                        p2 = dict(pos); ids = []
                        for k, (typ, fw, fh, c) in enumerate(ch):
                            fid = nid + k
                            SZX[fid] = (fw, fh); WMX[fid] = U.band(typ, fw, fh); p2[fid] = c; ids.append(fid)
                        e = zamkniecie(p2)
                        if e < BIG:
                            e += 30 * len(ch)
                            if best is None or e < best[0]: best = (e, ch)
        if best is None or best[0] >= cur - 0.5: break
        e, ch = best
        for typ, fw, fh, c in ch:
            SZX[nid] = (fw, fh); WMX[nid] = U.band(typ, fw, fh); pos[nid] = c; spec[nid] = (typ, fw, fh); nid += 1
        cur = zamkniecie(pos)
        print("lancuch", len(ch), [(t, w, h) for t, w, h, c in ch], "energia %.0f otwarte %d" % (cur, sum(b - a for _, _, a, b in otwarte(pos)))); sys.stdout.flush()
    return pos, spec


if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "--dalej3":
    d = json.load(open(sys.argv[2]))
    spec0 = {int(k): tuple(v) for k, v in d["wypelniacze"].items()}
    for fid, (t, w, h) in spec0.items(): SZX[fid] = (w, h); WMX[fid] = U.band(t, w, h)
    pos = {int(k): tuple(v) for k, v in d["pozycje"].items()}
    pos2, spec = wypelnij3(pos, spec0)
    json.dump({"pozycje": {str(m): list(map(int, p)) for m, p in pos2.items()}, "wypelniacze": {str(k): list(v) for k, v in spec.items()}}, open(sys.argv[3], "w"))
    sys.exit(0)
if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "--dalej2":
    d = json.load(open(sys.argv[2]))
    spec0 = {int(k): tuple(v) for k, v in d["wypelniacze"].items()}
    for fid, (t, w, h) in spec0.items(): SZX[fid] = (w, h); WMX[fid] = U.band(t, w, h)
    pos = {int(k): tuple(v) for k, v in d["pozycje"].items()}
    pos2, spec = wypelnij2(pos, spec0)
    json.dump({"pozycje": {str(m): list(map(int, p)) for m, p in pos2.items()}, "wypelniacze": {str(k): list(v) for k, v in spec.items()}}, open(sys.argv[3], "w"))
    sys.exit(0)
if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "--dalej":
    d = json.load(open(sys.argv[2]))
    spec0 = {int(k): tuple(v) for k, v in d["wypelniacze"].items()}
    for fid, (t, w, h) in spec0.items(): SZX[fid] = (w, h); WMX[fid] = U.band(t, w, h)
    pos = {int(k): tuple(v) for k, v in d["pozycje"].items()}
    pos2, spec = wypelnij(pos, maks=40, spec=spec0, koszt=int(sys.argv[3]) if len(sys.argv) > 3 else 10)
    json.dump({"pozycje": {str(m): list(map(int, p)) for m, p in pos2.items()}, "wypelniacze": {str(k): list(v) for k, v in spec.items()}}, open(sys.argv[4] if len(sys.argv) > 4 else sys.argv[2], "w"))
    sys.exit(0)
if __name__ == "__main__":
    B = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    st = beam(B, seed)
    e, pos = st[0]
    json.dump({str(m): list(map(int, p)) for m, p in pos.items()}, open(os.path.join(os.environ.get("KRUK_TMP", "."), "beam_%d.json" % seed), "w"))
    print("koniec, energia %.0f" % e)
    pos2, spec = wypelnij3(dict(pos), {})
    json.dump({"pozycje": {str(m): list(map(int, p)) for m, p in pos2.items()}, "wypelniacze": {str(k): list(v) for k, v in spec.items()}},
              open(os.path.join(os.environ.get("KRUK_TMP", "."), "beam_wyp_%d.json" % seed), "w"))


