# -*- coding: utf-8 -*-
"""Makieta „łąki” na mapie próbnej A (gracz 2026-11-03: trawę w głębi lądu „jakoś nakładką upiększyć pomysłowo”; wybrane: odcienie łąki, od brzegu
w głąb, kwietne łany, wysoka trawa przy rzeczach; bez wiatru; „nie za gęsto i nie może na drzewo nachodzić”). Na zrzutach z gry
(tools/laka/zrzuty.js: zrzut i ten sam kadr bez postaci/drzew) dokłada nakładkę tak, jak zrobi to gra: na gruncie, pod drzewami i postaciami,
w świetle sceny (mnożnik = grunt ze zrzutu / goły kafel z mapylib), cienie drzew przyciemniają ją jak trawę.
Wynik: docs/laka/<miejsce>_przed.png / _po.png / _para.png.     python tools/laka/makieta.py"""
import os, sys, json, math, random
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as ml
T = 48
D_SHEET = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_D_green.png")
OUT = os.path.join(ROOT, "docs", "laka")


# ---------------------------------------------------------------- szum (ten sam w grze: hash kratki + gładka interpolacja)
def h2(x, y, s):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFFFFFF) / 4294967296.0


def szum(px, py, skala, s):
    """gładki szum 0..1 w pikselach mapy, oczko = skala kratek"""
    gx, gy = px / (skala * T), py / (skala * T)
    x0, y0 = math.floor(gx), math.floor(gy)
    fx, fy = gx - x0, gy - y0
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b, c, d = h2(x0, y0, s), h2(x0 + 1, y0, s), h2(x0, y0 + 1, s), h2(x0 + 1, y0 + 1, s)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy


def smooth(e0, e1, v):
    t = max(0.0, min(1.0, (v - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- pieczątki z arkusza D (pojedyncze kwiaty)
def skladowe(tile):
    a = np.array(tile)[:, :, 3] > 40
    H, W = a.shape
    seen = np.zeros_like(a)
    out = []
    for y in range(H):
        for x in range(W):
            if not a[y, x] or seen[y, x]: continue
            q = [(x, y)]; seen[y, x] = True; pts = []
            while q:
                cx, cy = q.pop(); pts.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < W and 0 <= ny < H and a[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; q.append((nx, ny))
            if len(pts) < 5: continue
            xs, ys = [p[0] for p in pts], [p[1] for p in pts]
            out.append(tile.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1)))
    return out


def pieczatki():
    sh = Image.open(D_SHEET).convert("RGBA")
    def tile(n):
        x = ((n // 128) * 8 + n % 8) * T; y = ((n % 128) // 8) * T
        return sh.crop((x, y, x + T, y + T))
    gat = {"czerwone": [184, 192], "niebieskie": [193, 194, 195], "turkusowe": [196, 197], "pomaranczowe": [198, 199], "biale": [204, 212], "zolte": [222, 223]}
    kw = {k: [s for n in v for s in skladowe(tile(n)) if s.width <= 26 and s.height <= 26] for k, v in gat.items()}
    return {k: v for k, v in kw.items() if v}


def poisson(rnd, SW, SH, odl, prob):
    """punkty co najmniej odl px od siebie, każdy przyjęty z prawdopodobieństwem prob(x, y)"""
    cell = odl / math.sqrt(2)
    grid = {}; pts = []
    for _ in range(int(SW * SH / (odl * odl) * 2.2)):
        x, y = rnd.uniform(0, SW - 1), rnd.uniform(0, SH - 1)
        gx, gy = int(x / cell), int(y / cell)
        ok = True
        for i in range(gx - 2, gx + 3):
            for j in range(gy - 2, gy + 3):
                q = grid.get((i, j))
                if q and (q[0] - x) ** 2 + (q[1] - y) ** 2 < odl * odl: ok = False; break
            if not ok: break
        if not ok: continue
        grid[(gx, gy)] = (x, y)
        if rnd.random() < prob(x, y): pts.append((x, y))
    return pts


def kepa(w, x, y, A, rnd, SW, SH):
    """kępa wysokiej trawy: 5-9 źdźbeł 7-13 px w barwach miejscowej trawy (ciemna, średnia, jasna)"""
    x, y = int(x), int(y)
    if not (4 <= x < SW - 4 and 14 <= y < SH): return
    base = A[min(SH - 1, y), x]
    dark, mid, light = base * np.array([0.62, 0.72, 0.62]), base * np.array([0.95, 1.08, 0.92]), base * np.array([1.18, 1.28, 1.05]) + 6
    for _ in range(rnd.randint(5, 9)):
        h = rnd.randint(7, 13); x0 = x + rnd.randint(-5, 5); lean = rnd.uniform(-0.35, 0.35)
        for k in range(h):
            px, py = int(round(x0 + lean * k)), y - k
            if not (0 <= px < SW and 0 <= py < SH): continue
            col = dark if k < h * 0.35 else mid if k < h * 0.8 else light
            w.putpixel((px, py), tuple(int(max(0, min(255, v))) for v in col) + (255,))


# ---------------------------------------------------------------- jedno miejsce
def makieta(nazwa, kw):
    info = json.load(open(os.path.join(HERE, "zrzuty", nazwa + ".json")))
    shot = Image.open(os.path.join(HERE, "zrzuty", nazwa + ".png")).convert("RGB")
    grunt = Image.open(os.path.join(HERE, "zrzuty", nazwa + "_grunt.png")).convert("RGB")
    SW, SH = shot.size
    ox, oy = math.ceil(info["dx"] * T), math.ceil(info["dy"] * T)
    mp = ml.Mapa(990)
    cx0, cy0 = ox // T, oy // T
    cx1, cy1 = min(mp.W - 1, (ox + SW) // T + 1), min(mp.H - 1, (oy + SH) // T + 1)
    goly = ml.render(mp, region=(cx0, cy0, cx1, cy1), hide=lambda e: True).convert("RGB")
    goly = goly.crop((ox - cx0 * T, oy - cy0 * T, ox - cx0 * T + SW, oy - cy0 * T + SH))
    A = np.asarray(grunt).astype(np.float32); S1 = np.asarray(shot).astype(np.float32); G = np.asarray(goly).astype(np.float32)
    lum = lambda X: X[:, :, 0] * 0.3 + X[:, :, 1] * 0.59 + X[:, :, 2] * 0.11
    swiatlo = np.clip((lum(S1) + 4) / (lum(G) + 4), 0.45, 1.35)
    swiatlo = np.asarray(Image.fromarray((swiatlo * 100).astype(np.uint8)).filter(ImageFilter.BoxBlur(10))).astype(np.float32) / 100
    zielone = (A[:, :, 1] > A[:, :, 0] + 10) & (A[:, :, 1] > A[:, :, 2] + 4)
    # rzeczy (drzewa, kamienie, postaci): zrzut różni się od gruntu nie samym przyciemnieniem; cień: to samo, tylko ciemniej
    l1, l2 = lum(S1) + 1, lum(A) + 1
    n1 = S1 / S1.sum(axis=2, keepdims=True).clip(1); n2 = A / A.sum(axis=2, keepdims=True).clip(1)
    rozne = np.abs(S1 - A).max(axis=2) > 10
    cien = rozne & (np.abs(n1 - n2).max(axis=2) < 0.03) & (l1 < l2)
    rzecz = rozne & ~cien
    rzecz = np.asarray(Image.fromarray((rzecz * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(5))) > 0
    # (podstawą jest sam zrzut: między dwoma zrzutami przesuwają się cienie chmur - grunt bez drzew służy tylko do znalezienia drzew)
    A = S1.copy()
    zielone = (A[:, :, 1] > A[:, :, 0] + 10) & (A[:, :, 1] > A[:, :, 2] + 4) & ~rzecz
    # odległość od wody (kratki A1), gładko na piksele
    dist = np.full((mp.H, mp.W), 99.0)
    q = deque()
    for y in range(mp.H):
        for x in range(mp.W):
            if 2048 <= mp.t(0, x, y) < 2048 + 16 * 48: dist[y, x] = 0; q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < mp.W and 0 <= ny < mp.H and dist[ny, nx] > dist[y, x] + 1: dist[ny, nx] = dist[y, x] + 1; q.append((nx, ny))
    yy, xx = np.mgrid[0:SH, 0:SW]
    mx, my = (xx + ox) / T - 0.5, (yy + oy) / T - 0.5
    ix, iy = np.clip(np.floor(mx).astype(int), 0, mp.W - 2), np.clip(np.floor(my).astype(int), 0, mp.H - 2)
    fx, fy = np.clip(mx - ix, 0, 1), np.clip(my - iy, 0, 1)
    d = dist[iy, ix] * (1 - fx) * (1 - fy) + dist[iy, ix + 1] * fx * (1 - fy) + dist[iy + 1, ix] * (1 - fx) * fy + dist[iy + 1, ix + 1] * fx * fy
    # 1-2. odcienie łąki + od brzegu w głąb (na trawie)
    vs = np.vectorize(lambda px, py: 0.65 * szum(px, py, 11, 7) + 0.35 * szum(px, py, 4.5, 8))
    low = vs((xx[::6, ::6] + ox).astype(float), (yy[::6, ::6] + oy).astype(float))
    n = np.asarray(Image.fromarray((low * 255).astype(np.uint8)).resize((SW, SH), Image.BILINEAR)).astype(np.float32) / 255 * 2 - 1
    n = np.clip(n * 1.6, -1, 1)
    sucho = np.vectorize(lambda v: smooth(8.5, 3.0, v))(d)
    bujnie = np.vectorize(lambda v: smooth(9.0, 17.0, v))(d)   # (kwiaty i bujna trawa dopiero w głębi lądu: od ~9 kratek od wody)
    B = A.copy()
    slon = np.clip(n, 0, 1)[..., None] * (1 - sucho[..., None]); cn = np.clip(-n, 0, 1)[..., None] * (1 - sucho[..., None])
    B = B * (1 + slon * np.array([0.12, 0.08, -0.10]))
    B = B * (1 - cn * np.array([0.17, 0.08, 0.11]) * (0.6 + 0.4 * bujnie[..., None]))
    L = lum(B)[..., None]
    sucha = np.concatenate([L * 1.10, L * 1.02, L * 0.72], axis=2)
    B = B * (1 - 0.42 * sucho[..., None]) + sucha * 0.42 * sucho[..., None]
    B = np.where(zielone[..., None], B, A)
    rnd = random.Random(990)
    warstwa = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    # stopy rzeczy: z kratki zdarzenia najniższy wiersz jego obrazka na zrzucie (drzewa rysują się paskami przesuniętymi wobec sprite'a)
    stopy = []
    for (ex, ey, ch, ci, normal) in info["ev"]:
        hx, hy = ex * T + 24 - ox, ey * T + 44 - oy
        x0, x1, y0, y1 = max(0, hx - 30), min(SW, hx + 30), max(0, hy - 40), min(SH, hy + 30)
        if x1 <= x0 or y1 <= y0: continue
        okno = rzecz[y0:y1, x0:x1]
        rows = np.where(okno.any(axis=1))[0]
        if not len(rows): continue
        fy = y0 + rows[-1]
        cols = np.where(rzecz[max(0, fy - 4):fy + 1, x0:x1].any(axis=0))[0]
        wc = np.where(rzecz[max(0, fy - 12):fy + 1, x0:x1].any(axis=0))[0]; w = int(wc.max() - wc.min() + 1) if len(wc) else 0
        stopy.append((x0 + int(cols.mean()), fy, w, ch))

    def wklej(st, x, y):
        x, y = int(x - st.width / 2), int(y - st.height)
        if x < 0 or y < 0 or x + st.width > SW or y + st.height > SH: return
        f = float(swiatlo[min(SH - 1, y + st.height - 1), min(SW - 1, x + st.width // 2)])
        a = np.asarray(st).astype(np.float32)
        a[:, :, :3] = np.clip(a[:, :, :3] * f * 0.92, 0, 255)
        warstwa.alpha_composite(Image.fromarray(a.astype(np.uint8)), (x, y))

    def trawa_tu(x, y, z=0):
        x, y = int(x), int(y)
        if not (z <= x < SW - z and z <= y < SH - z): return False
        return bool(zielone[y - z:y + z + 1, x - z:x + z + 1].all()) and not rzecz[y, x]

    def przy_stopie(x, y, r):
        return any((x - sx) ** 2 + ((y - sy) * 2.2) ** 2 < r * r for (sx, sy, w, c) in stopy)
    # 3. kwietne łany: rzadkie skupiska (kwiat co >= 13 px), gęstsze w środku, gatunki przechodzą płynnie, tylko w głębi lądu, nie przy pniach
    gatunki = list(kw.keys())

    def p_lan(x, y):
        c = szum(x + ox, y + oy, 7, 21)
        if c < 0.70: return 0
        return 0.55 * ((c - 0.70) / 0.30) ** 1.4 * bujnie[int(y), int(x)]
    for (x, y) in poisson(rnd, SW, SH, 13, p_lan):
        if not trawa_tu(x, y, 3) or przy_stopie(x, y, 34): continue
        g = gatunki[int(szum(x + ox, y + oy, 9, 44) * len(gatunki) * 1.25) % len(gatunki)]
        if rnd.random() < 0.12: g = rnd.choice(gatunki)
        wklej(rnd.choice(kw[g]), x, y + 4)
    # pojedyncze polne kwiatki tu i ówdzie w bujnej trawie
    for (x, y) in poisson(rnd, SW, SH, 70, lambda x, y: 0.22 * bujnie[int(y), int(x)]):
        if trawa_tu(x, y, 3) and not przy_stopie(x, y, 34): wklej(rnd.choice(kw[rnd.choice(gatunki)]), x, y + 4)
    # 4. przy rzeczach: igliwie pod iglastymi, kępy wysokiej trawy po bokach pni i skał
    for (sx, sy, w, ch) in stopy:
        iglaste = any(k in ch for k in ("Pine", "Big_Trees"))
        drzewo = iglaste or "Tree" in ch
        if iglaste:
            for _ in range(220):
                a, r = rnd.uniform(0, 2 * math.pi), math.sqrt(rnd.random())
                x, y = sx + math.cos(a) * r * 58, sy + 8 + math.sin(a) * r * 14
                if rnd.random() < r * 0.75 or not trawa_tu(x, y) or not trawa_tu(x + 1, y): continue
                col = rnd.choice([(150, 108, 58), (124, 90, 48), (172, 128, 70), (104, 78, 44)])
                f = max(0.8, float(swiatlo[int(y), int(x)]))
                c = tuple(int(v * f) for v in col) + (240,)
                warstwa.putpixel((int(x), int(y)), c)
                dx = rnd.choice((1, 1, -1))
                if trawa_tu(x + dx, y): warstwa.putpixel((int(x) + dx, int(y)), c)
        if drzewo or "Rock" in ch or "Bush" in ch:
            for side in (-1, 1):
                if rnd.random() < 0.25: continue
                x, y = sx + side * rnd.uniform(max(12, w * 0.25), max(20, w * 0.42)), sy + rnd.uniform(6, 11)
                if trawa_tu(x, y - 3): kepa(warstwa, x, y, A, rnd, SW, SH)
    # ściany wzgórz: wysoka trawa wzdłuż stóp (kratka pod ostatnim rzędem lica)
    for y in range(mp.H):
        for x in range(mp.W):
            if mp.t(0, x, y) - 1536 not in (120, 121, 122): continue
            bx, by = x * T - ox, (y + 1) * T - oy
            for k in range(2):
                px, py = bx + rnd.uniform(4, 44), by + rnd.uniform(2, 6)
                if trawa_tu(px, py - 2): kepa(warstwa, px, py, A, rnd, SW, SH)
    C = Image.fromarray(np.clip(B, 0, 255).astype(np.uint8)).convert("RGBA")
    C.alpha_composite(warstwa)
    Cn = np.asarray(C.convert("RGB")).astype(np.float32)
    # rzeczy z powrotem nad nakładką, cienie przyciemniają ją tak jak trawę
    F = np.where(rzecz[..., None], S1, Cn)
    fin = Image.fromarray(np.clip(F, 0, 255).astype(np.uint8))
    os.makedirs(OUT, exist_ok=True)
    # (gra rysuje 1280x720 i powiększa obraz 1,5 raza na pełny ekran 1920x1080 - tak jak u gracza)
    shot = shot.resize((SW * 3 // 2, SH * 3 // 2), Image.NEAREST); fin = fin.resize((SW * 3 // 2, SH * 3 // 2), Image.NEAREST)
    shot.save(os.path.join(OUT, nazwa + "_przed.png"))
    fin.save(os.path.join(OUT, nazwa + "_po.png"))
    box = (300, 250, 1260, 790)
    r = Image.new("RGB", (960 * 2 + 10, 540), (20, 20, 20)); r.paste(shot.crop(box), (0, 0)); r.paste(fin.crop(box), (970, 0))
    r.save(os.path.join(OUT, nazwa + "_para.png"))


def main():
    kw = pieczatki()
    print({k: len(v) for k, v in kw.items()})
    for n in ("brzeg", "sosny", "wzgorze"):
        makieta(n, kw)
        print(n, "->", os.path.join(OUT, n + "_para.png"))


if __name__ == "__main__":
    main()
