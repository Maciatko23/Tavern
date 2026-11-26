# -*- coding: utf-8 -*-
"""ZBOCZA ZAMIAST UCIĘTYCH BRZEGÓW (tools/gory/zbocza.py, 2026-11-26)

Gracz (zrzut): przejścia między górami brzydkie - rysunek łańcucha (PixelLab) kończył się przy prawym brzegu obrazka uciętym szczytem,
prostą pionową krawędzią na ok. 100 pikseli. Tu: rysunek przycięty w dolinie przed tym szczytem, a dalej zbocze schodzi ukośnie (z lekką
nierównością) do podnóża; nowy brzeg dostaje ciemny obrys jak reszta rysunku. Źródła bez zmian w tools/gory/zrodla/.
  python tools/gory/zbocza.py
"""
import os, random
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "img", "pictures", "gory")


def trim(im):
    bb = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    return im.crop(bb)


def zbocze_prawe(name, szukaj=70):
    src = trim(Image.open(os.path.join(HERE, "zrodla", name + ".png")).convert("RGBA"))
    W, H = src.size
    px = src.load()
    top = []
    for x in range(W):
        t = next((y for y in range(H) if px[x, y][3] > 40), H)
        top.append(t)
    if sum(1 for y in range(H) if px[W - 1, y][3] > 40) < 20: return None   # (no cut edge there)
    # the valley: the lowest silhouette point among the last columns (before the cut peak)
    xv = max(range(W - szukaj, W - 8), key=lambda x: top[x])
    yv = top[xv]
    rnd = random.Random(5)
    k = (W - 1 - xv) / max(1, (H - 1 - yv))
    jag, out = 0, src.copy()
    o = out.load()
    for y in range(H):
        jag = max(-3, min(3, jag + rnd.choice((-1, 0, 0, 1))))
        xmax = xv if y < yv else int(xv + (y - yv) * k) + jag
        for x in range(max(0, xmax + 1), W):
            o[x, y] = (0, 0, 0, 0)
    # the dark outline along the new edge (the art's own darkest rock)
    dark = (28, 31, 40, 255)
    for y in range(H):
        for x in range(W - 1, -1, -1):
            if o[x, y][3] > 40:
                if x >= xv - 1:
                    o[x, y] = dark
                break
    out = trim(out)
    out.save(os.path.join(OUT, "Gory_" + name + ".png"), optimize=True)
    return (W, H), out.size, (xv, yv)


if __name__ == "__main__":
    for n in ("lancuch", "szczyt", "masyw", "turnie"):
        r = zbocze_prawe(n)
        print(n, "przycięte" if r else "bez zmian", r or "")
