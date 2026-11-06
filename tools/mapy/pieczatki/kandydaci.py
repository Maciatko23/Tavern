# -*- coding: utf-8 -*-
"""Szukanie kandydatów na pieczątki: domknięte „plamy” (kratki nie-tła razem ze zdarzeniami) w mapie wzorcowej.
  python tools/mapy/pieczatki/kandydaci.py MAPA tlo [minpole] [maxbok] > lista; obraz: --arkusz PLIK"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pieczatki as P, numpy as np


def plamy(raw, tlo, maxbok=26, minpole=12, scal=2, zdarz=True):
    a = P.warstwy_np(raw); H, W = raw["height"], raw["width"]
    nt = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if not P.tlo_kratki(a, x, y, tlo): nt[y, x] = True
    for e in (raw["events"] if zdarz else []):
        if e and P.zdarzenie_ozdobne(e):
            for (dx, dy) in P.stopa(e):
                if 0 <= e["x"] + dx < W and 0 <= e["y"] + dy < H: nt[e["y"] + dy, e["x"] + dx] = True
    # scalanie: zamknięcie o `scal`
    m = nt.copy()
    for _ in range(scal):
        n = m.copy()
        n[1:, :] |= m[:-1, :]; n[:-1, :] |= m[1:, :]; n[:, 1:] |= m[:, :-1]; n[:, :-1] |= m[:, 1:]
        m = n
    seen = np.zeros_like(m); out = []
    for y in range(H):
        for x in range(W):
            if m[y, x] and not seen[y, x]:
                st = [(x, y)]; seen[y, x] = True; c = []
                while st:
                    cx, cy = st.pop(); c.append((cx, cy))
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            u, v = cx + dx, cy + dy
                            if 0 <= u < W and 0 <= v < H and m[v, u] and not seen[v, u]: seen[v, u] = True; st.append((u, v))
                cc = [q for q in c if nt[q[1], q[0]]]
                if len(cc) < minpole: continue
                xs = [q[0] for q in cc]; ys = [q[1] for q in cc]
                bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
                if bw > maxbok or bh > maxbok: continue
                if min(xs) < 2 or min(ys) < 2 or max(xs) > W - 3 or max(ys) > H - 3: continue
                out.append((len(cc), min(xs), min(ys), bw, bh))
    return sorted(out, reverse=True)


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    mid = int(a[0]); tlo = tuple(int(v) for v in a[1].split(','))
    mn = int(a[2]) if len(a) > 2 else 12
    mb = int(a[3]) if len(a) > 3 else 26
    raw = P.wczytaj(mid)
    for i, (n, x, y, w, h) in enumerate(plamy(raw, tlo, mb, mn)): print(i, n, x, y, w, h)
