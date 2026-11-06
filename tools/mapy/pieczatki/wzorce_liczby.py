# -*- coding: utf-8 -*-
"""Liczby „DNA stylu” 4 wzorców -> stdout (markdown). Użycie: python tools/mapy/pieczatki/wzorce_liczby.py"""
import os, sys, collections, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pieczatki as P, numpy as np
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
NAZ = {16: "trawa", 27: "trawa jasna/ciemna (27)", 24: "ziemia", 17: "ziemia/ścieżka (17)", 33: "deski", 6: "morze", 43: "bruk", 40: "bruk szary", 97: "mur/dach A4", 105: "mur A4", 60: "A3", 98: "A4", 55: "A3", 71: "A3", 34: "A3"}
DRZEWA = ("!$Pine", "!$Tree", "!$Big_Trees")
KRZAKI = ("!$Bush",)
SKALY = ("!$Rock", "!$Boulder")


def gr(e): return e["pages"][0]["image"]["characterName"]


def licz(mid, okno=None):
    raw = P.wczytaj(mid); a = P.warstwy_np(raw); H, W = raw["height"], raw["width"]
    x0, y0, x1, y1 = okno or (0, 0, W, H)
    n = (x1 - x0) * (y1 - y0)
    k0 = collections.Counter(); k1 = collections.Counter()
    for y in range(y0, y1):
        for x in range(x0, x1):
            t = int(a[0, y, x]); k0[P.rodzaj(t) if t >= 2048 else ("A5" if t else "-")] += 1
            t = int(a[1, y, x])
            if t: k1[P.rodzaj(t) if t >= 2048 else "B-E"] += 1
    ev = [e for e in raw["events"] if e and x0 <= e["x"] < x1 and y0 <= e["y"] < y1]
    dr = [e for e in ev if gr(e).startswith(DRZEWA)]
    kr = [e for e in ev if gr(e).startswith(KRZAKI)]
    sk = [e for e in ev if gr(e).startswith(SKALY)]
    sp = []
    for i, e in enumerate(dr):
        d = min((math.hypot(e["x"] - f["x"], e["y"] - f["y"]) for j, f in enumerate(dr) if j != i), default=0)
        sp.append(d)
    gg = collections.Counter(gr(e) for e in dr)
    # plamy ziemi: składowe kind 24/17 na warstwie 0
    m = np.isin(np.where(a[0] >= 2048, (a[0] - 2048) // 48, -1), (24, 17))[y0:y1, x0:x1]
    comps = [len(c) for c in P._skladowe({(x, y) for y in range(m.shape[0]) for x in range(m.shape[1]) if m[y, x]})]
    # obrzeże 2 kratek: skład gruntu
    ob = collections.Counter(); ob_ev = 0
    for y in range(H):
        for x in range(W):
            if min(x, y, W - 1 - x, H - 1 - y) < 2:
                t = int(a[0, y, x]); ob[P.rodzaj(t) if t >= 2048 else "A5"] += 1
    ob_ev = sum(1 for e in raw["events"] if e and min(e["x"], e["y"], W - 1 - e["x"], H - 1 - e["y"]) < 3 and gr(e).startswith(DRZEWA))
    return dict(mid=mid, W=W, H=H, n=n, k0=k0, k1=k1, dr=len(dr), kr=len(kr), sk=len(sk), sp=sp, gg=gg, comps=sorted(comps, reverse=True), ob=ob, ob_ev=ob_ev,
                ev=len(ev), reg=collections.Counter(int(v) for v in a[5].reshape(-1)))


def pct(c, n, k=7):
    return ", ".join("%s %.1f%%" % (NAZ.get(a_, a_), 100.0 * v / n) for a_, v in c.most_common(k))


if __name__ == "__main__":
    for mid, ok in ((13, None), (159, None), (8, (0, 103, 104, 138)), (3, None)):
        r = licz(mid, ok)
        n = r["n"]
        sp = np.array(r["sp"]) if r["sp"] else np.array([0])
        print("### Map%03d (%dx%d%s)" % (mid, r["W"], r["H"], ", teren za murem y>=103" if ok else ""))
        print("- grunt, warstwa 0: " + pct(r["k0"], n))
        print("- warstwa 1 (nakładki): " + pct(r["k1"], n, 7) + " (udział w kratkach %.0f%%)" % (100.0 * sum(r["k1"].values()) / n))
        print("- drzewa-zdarzenia: %d (%.1f na 100 kratek), krzaki %d (%.1f), skały %d (%.1f); zdarzeń razem %d" % (r["dr"], 100.0 * r["dr"] / n, r["kr"], 100.0 * r["kr"] / n, r["sk"], 100.0 * r["sk"] / n, r["ev"]))
        print("- odstęp drzewo-najbliższe drzewo: mediana %.1f kratki, 10%% najbliższych <= %.1f, 90%% <= %.1f" % (np.median(sp), np.percentile(sp, 10), np.percentile(sp, 90)))
        print("- grafiki drzew: " + ", ".join("%s %d" % (g.replace("!$", ""), v) for g, v in r["gg"].most_common(6)))
        c = r["comps"]
        print("- plamy ziemi (24/17, warstwa 0): %d plam, największe %s kratek, mediana %s" % (len(c), c[:4], int(np.median(c)) if c else 0))
        print("- regiony: " + str(dict(r["reg"].most_common(6))))
        print("- obrzeże 2 kratek: " + pct(r["ob"], sum(r["ob"].values()), 4) + "; drzew w pasie 3 kratek od krawędzi: %d" % r["ob_ev"])
        print()
