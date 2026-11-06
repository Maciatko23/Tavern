# -*- coding: utf-8 -*-
"""ANALIZA OSIĄGALNOŚCI: dla każdej zmienionej mapy: obszar osiągalny pieszo (od wejść: miejsca przybycia, kratki obok wyjść, otwarte krawędzie) PRZED
(data/) i PO (staging) usunięciu liści. Wypisuje nowe osiągalne kratki, ich składowe i to, co je otacza (zdarzenia z treścią, krawędzie, bramy).
  python tools/krawedzie_poprawa/analiza.py [--staging DIR] [--obraz]   (obrazy: docs/krawedzie_poprawa/analiza/MapNNN.png)"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib; L = lib.L
import numpy as np
from PIL import Image, ImageDraw
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STAGING = os.path.abspath(sys.argv[sys.argv.index("--staging") + 1]) if "--staging" in sys.argv else lib.STG


def krawedz_wolne(mp):
    out = []
    for x in range(mp.W): out += [(x, 0), (x, mp.H - 1)]
    for y in range(mp.H): out += [(0, y), (mp.W - 1, y)]
    return [c for c in out if mp.stoi(*c)]


def najwiekszy(mp):
    """największy chodliwy obszar mapy (kratki), gdy brak znanych wejść"""
    seen = set(); best = []
    for y in range(mp.H):
        for x in range(mp.W):
            if (x, y) in seen or not mp.stoi(x, y): continue
            c = mp.flood([(x, y)]); seen |= c
            if len(c) > len(best): best = list(c)
    return best


def osiagalne(mp, starty):
    return mp.flood([s for s in starty if mp.stoi(*s)])


def analiza(mid):
    p = os.path.join(STAGING, "data", "Map%03d.json" % mid)
    if not os.path.exists(p): return None
    przed = L.Mapa(mid); po = L.Mapa(mid, path=p)
    st = list(set(przed.starty()) | set(krawedz_wolne(przed)))
    R0 = osiagalne(przed, st)
    if len(R0) < 500: R0 = set(najwiekszy(przed))|R0
    R1 = osiagalne(po, list(R0))
    return przed, po, R0, R1


def zdarzenia_blisko(mp, kratki, r=2):
    """zdarzenia z treścią (przejścia, NPC itp.) w promieniu r od kratek"""
    out = {}
    ks = set(kratki)
    for e in mp.zd:
        if not e.page: continue
        if any((e.x + dx, e.y + dy) in ks for dx in range(-r, r + 1) for dy in range(-r, r + 1)):
            out[e.id] = (e.name, e.x, e.y)
    return out


if __name__ == "__main__":
    os.makedirs(os.path.join(lib.ROOT, "docs", "krawedzie_poprawa", "analiza"), exist_ok=True)
    wyn = {}
    for mid in lib.mapy_swiata() + [101]:
        r = analiza(mid)
        if not r: continue
        przed, po, R0, R1 = r
        nowe = R1 - R0
        a = np.zeros((po.H, po.W), bool)
        for (x, y) in nowe: a[y, x] = True
        skl = lib.skladowe(a, osiem=False)
        print("mapa %d: osiągalne %d -> %d, nowe %d kratek, składowych %d (największe %s)" % (mid, len(R0), len(R1), len(nowe), len(skl), sorted((len(c) for c in skl), reverse=True)[:5]))
        wyn[mid] = [[list(q) for q in c] for c in skl]
        if "--obraz" in sys.argv and nowe:
            sc = 0.25 if po.W * po.H > 6000 else 0.4
            im = L.render(po); d = ImageDraw.Draw(im, "RGBA")
            for (x, y) in nowe: d.rectangle((x * 48, y * 48, x * 48 + 47, y * 48 + 47), fill=(255, 0, 255, 110))
            im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS).save(os.path.join(lib.ROOT, "docs", "krawedzie_poprawa", "analiza", "Map%03d.png" % mid))
    json.dump(wyn, open(os.path.join(lib.STG, "analiza_nowe.json"), "w"), indent=0)
