# -*- coding: utf-8 -*-
"""Szwy świata: obraz każdego styku dwóch map (pas D kratek z jednej mapy sklejony z pasem z drugiej, jak jedna mapa)
i ranking, jak bardzo obie strony różnią się wyglądem tuż przy krawędzi (droga urwana, inna trawa, mur znika).
Nic nie zapisuje do data/ ani js/.
  python tools/mapy/swiat_szwy.py [--dane DIR] [--swiat Swiat_Data.js] [--out DIR] [--tylko 3,4] [--D 6]
Wynik: <out>/szew_<A>_<B>.png (A z lewej albo z góry), <out>/ranking.txt (najgorsze pierwsze), <out>/najgorsze.png."""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mapylib as M

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


DANE = arg("--dane")
SWIAT = arg("--swiat", os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"))
OUT = arg("--out", os.path.join(ROOT, "docs", "swiat_szwy"))
D = int(arg("--D", "6"))
SCALE = 0.5
TILE = int(48 * SCALE)
TYLKO = {int(x) for x in arg("--tylko").split(",")} if arg("--tylko") else None


def mapy_swiata():
    src = open(SWIAT, encoding="utf-8").read()
    i = src.index("maps:") + 5
    return {int(k): v for k, v in json.loads(src[i:src.index("},", i) + 1]).items()}


def plik(mid):
    for d in ([DANE] if DANE else []) + [os.path.join(ROOT, "data")]:
        p = os.path.join(d, "Map%03d.json" % mid)
        if os.path.exists(p): return p
    return None


def pary(maps):
    """(A, B, 'EW' albo 'NS', od, do) - A na zachód / na północ od B; od..do: kratki świata wzdłuż styku (do wyłącznie)"""
    out = []
    for a, (ax, ay, aw, ah) in maps.items():
        for b, (bx, by, bw, bh) in maps.items():
            if a == b: continue
            if ax + aw == bx:
                lo, hi = max(ay, by), min(ay + ah, by + bh)
                if hi > lo: out.append((a, b, "EW", lo, hi))
            if ay + ah == by:
                lo, hi = max(ax, bx), min(ax + aw, bx + bw)
                if hi > lo: out.append((a, b, "NS", lo, hi))
    return out


_cache = {}


def mapa(mid):
    if mid not in _cache: _cache[mid] = M.Mapa(mid, path=plik(mid))
    return _cache[mid]


def pas(mid, region):
    im = M.render(mapa(mid), region=region, scale=SCALE).convert("RGB")
    return im


def kolory_kratek(im, n, poziomo):
    """średni kolor każdej kratki w pasie jednej kratki (im: pas 1 kratki grubości)"""
    a = np.asarray(im, dtype=float)
    out = []
    for i in range(n):
        t = a[:, i * TILE:(i + 1) * TILE] if poziomo else a[i * TILE:(i + 1) * TILE, :]
        out.append(t.reshape(-1, 3).mean(0))
    return np.array(out)


def main():
    maps = {k: v for k, v in mapy_swiata().items() if plik(k)}
    os.makedirs(OUT, exist_ok=True)
    wyniki = []
    for (a, b, kier, lo, hi) in pary(maps):
        if TYLKO and a not in TYLKO and b not in TYLKO: continue
        ax, ay, aw, ah = maps[a]; bx, by, bw, bh = maps[b]
        n = hi - lo
        if kier == "EW":
            ra = (aw - D, lo - ay, aw - 1, hi - 1 - ay); rb = (0, lo - by, D - 1, hi - 1 - by)
            A, B = pas(a, ra), pas(b, rb)
            img = Image.new("RGB", (A.width + B.width, max(A.height, B.height)), (0, 0, 0))
            img.paste(A, (0, 0)); img.paste(B, (A.width, 0))
            ka = kolory_kratek(A.crop((A.width - TILE, 0, A.width, A.height)), n, False)
            kb = kolory_kratek(B.crop((0, 0, TILE, B.height)), n, False)
        else:
            ra = (lo - ax, ah - D, hi - 1 - ax, ah - 1); rb = (lo - bx, 0, hi - 1 - bx, D - 1)
            A, B = pas(a, ra), pas(b, rb)
            img = Image.new("RGB", (max(A.width, B.width), A.height + B.height), (0, 0, 0))
            img.paste(A, (0, 0)); img.paste(B, (0, A.height))
            ka = kolory_kratek(A.crop((0, A.height - TILE, A.width, A.height)), n, True)
            kb = kolory_kratek(B.crop((0, 0, B.width, TILE)), n, True)
        dist = np.sqrt(((ka - kb) ** 2).sum(1))
        zle = float((dist > 45).mean())
        # znaczniki szwu: krótkie kreski na końcach (nie zasłaniają samego styku)
        d = ImageDraw.Draw(img)
        if kier == "EW":
            x = A.width; d.line([(x, 0), (x, 6)], fill=(255, 40, 40), width=2); d.line([(x, img.height - 7), (x, img.height)], fill=(255, 40, 40), width=2)
        else:
            y = A.height; d.line([(0, y), (6, y)], fill=(255, 40, 40), width=2); d.line([(img.width - 7, y), (img.width, y)], fill=(255, 40, 40), width=2)
        p = os.path.join(OUT, "szew_%d_%d.png" % (a, b))
        img.save(p)
        wyniki.append((zle, float(dist.mean()), a, b, kier, n, p))
        print("%4d | %-4d %s %3d kratek  różne: %3.0f%%  śr. różnica %5.1f" % (a, b, kier, n, zle * 100, dist.mean()), flush=True)
    wyniki.sort(reverse=True)
    with open(os.path.join(OUT, "ranking.txt"), "w", encoding="utf-8") as f:
        f.write("udział kratek styku, które z obu stron wyglądają inaczej (średni kolor kratki różni się o > 45), najgorsze pierwsze\n")
        for (zle, sr, a, b, kier, n, p) in wyniki:
            f.write("%3.0f%%  śr %5.1f  %d | %d  %s  %d kratek  %s\n" % (zle * 100, sr, a, b, kier, n, os.path.basename(p)))
    print("zapisano", len(wyniki), "szwów do", OUT)


if __name__ == "__main__":
    main()
