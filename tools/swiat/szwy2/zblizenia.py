# -*- coding: utf-8 -*-
"""Zbliżenia szwów 1:1 (przed nad po) do docs/swiat_szwy2/zblizenia/: pas 8 kratek z każdej mapy, okno 20 kratek wzdłuż szwu o największej różnicy.
  python tools/swiat/szwy2/zblizenia.py 23,17 900,23 ...     (kolejność jak w swiat_szwy: A z lewej/z góry)"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ARGV = list(sys.argv[1:]); sys.argv = sys.argv[:1]
for p in (os.path.join(ROOT, "tools", "mapy"), os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "swiat", "szwy")): sys.path.insert(0, p)
import numpy as np
from PIL import Image, ImageDraw, ImageChops
import mapylib as L
import zbuduj_szwy as Z
STG = os.path.join(ROOT, "tools", "swiat", "szwy2", "staging", "data"); OUT = os.path.join(ROOT, "docs", "swiat_szwy2", "zblizenia"); os.makedirs(OUT, exist_ok=True)
maps = Z.mapy_swiata(); D = 8; OKNO = 20
def mapa(mid, stg):
    p = os.path.join(STG, "Map%03d.json" % mid) if stg else None
    return L.Mapa(mid, path=p if p and os.path.exists(p) else None)
def obraz(a, b, stg, lo, hi, kier):
    ax, ay, aw, ah = maps[a]; bx, by, bw, bh = maps[b]
    A, B = mapa(a, stg), mapa(b, stg)
    if kier == "EW":
        ia = L.render(A, region=(aw - D, lo - ay, aw - 1, hi - 1 - ay), scale=1.0).convert("RGB"); ib = L.render(B, region=(0, lo - by, D - 1, hi - 1 - by), scale=1.0).convert("RGB")
        im = Image.new("RGB", (ia.width + ib.width, ia.height)); im.paste(ia, (0, 0)); im.paste(ib, (ia.width, 0)); return im
    ia = L.render(A, region=(lo - ax, ah - D, hi - 1 - ax, ah - 1), scale=1.0).convert("RGB"); ib = L.render(B, region=(lo - bx, 0, hi - 1 - bx, D - 1), scale=1.0).convert("RGB")
    im = Image.new("RGB", (ia.width, ia.height + ib.height)); im.paste(ia, (0, 0)); im.paste(ib, (0, ia.height)); return im
for arg in ARGV:
    a, b = (int(x) for x in arg.split(","))
    pr = next((q for q in Z.pary(maps) if q[0] == a and q[1] == b), None)
    if not pr: print("brak styku", arg); continue
    _, _, kier, lo, hi = pr
    # okno o największej różnicy przed/po (przesuwane po 4 kratki)
    best = (-1, lo)
    full0, full1 = obraz(a, b, False, lo, hi, kier), obraz(a, b, True, lo, hi, kier)
    n = hi - lo
    diff = np.asarray(ImageChops.difference(full0, full1)).sum(2)
    prof = diff.sum(0 if kier == "EW" else 1)
    prof = np.add.reduceat(prof, np.arange(0, len(prof), 48))
    for s in range(0, max(1, n - OKNO + 1)):
        v = prof[s:s + OKNO].sum()
        if v > best[0]: best = (v, s)
    s = best[1]; w = min(OKNO, n)
    if kier == "EW": c = (0, s * 48, full0.width, (s + w) * 48)
    else: c = (s * 48, 0, (s + w) * 48, full0.height)
    A0, A1 = full0.crop(c), full1.crop(c)
    horiz = kier == "NS"
    if horiz:
        im = Image.new("RGB", (A0.width, A0.height * 2 + 10), (255, 0, 0)); im.paste(A0, (0, 0)); im.paste(A1, (0, A0.height + 10))
    else:
        im = Image.new("RGB", (A0.width * 2 + 10, A0.height), (255, 0, 0)); im.paste(A0, (0, 0)); im.paste(A1, (A0.width + 10, 0))
    p = os.path.join(OUT, "zblizenie_%d_%d.png" % (a, b)); im.save(p); print(p, im.size, "okno kratek %d..%d" % (lo + s, lo + s + w))
