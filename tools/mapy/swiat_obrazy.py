# -*- coding: utf-8 -*-
# Obrazy świata (PROJEKT): swiat_kratki.png (techniczny), swiat_kratki_podzial.png (puzzle), swiat_podglad.png (ładny podgląd bez ramek),
# swiat_zblizenia.png (styki map z brzegiem). Nic nie zapisuje do data/ ani js/.
#   python tools/mapy/swiat_obrazy.py
import os, sys, math, json, collections
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import swiat_kratki as K
import mapylib as L_

DOCS = K.DOCS
TMP = os.environ.get("KRUK_TMP", os.environ.get("TEMP", "."))
WW, WH = K.WW, K.WH


def miniatura(m, px):
    cache = os.path.join(TMP, "swiat_th_%d_%.3f.png" % (m, px))
    if os.path.exists(cache): return Image.open(cache).convert("RGBA")
    th = L_.render(L_.Mapa(m), scale=px / 48.0).convert("RGBA")
    th.save(cache); return th


def teren_atlasu():
    im = np.array(Image.open(K.ATLAS).convert("RGB")).astype(int)
    T = np.zeros((WH, WW), np.uint8)
    ys, xs = np.mgrid[0:WH, 0:WW]
    px = ((xs - K.OFF[0]) / K.S).astype(int) + 110; py = ((ys - K.OFF[1]) / K.S).astype(int) + 58
    ok = (px >= 0) & (px < 1280) & (py >= 0) & (py < 720)
    px = np.clip(px, 0, 1279); py = np.clip(py, 0, 719)
    r, g, b = im[py, px, 0], im[py, px, 1], im[py, px, 2]
    gory = (abs(r - g) < 16) & (abs(g - b) < 16) & (r > 50) & (r < 190)
    las = (g > r + 8) & (g > b + 10) & (g < 140)
    T[ok & gory] = 1; T[ok & las & ~gory] = 2
    return T


def alfa_ladu(L, px, miekkosc=0.7):
    """gładka maska lądu w skali obrazu (0-255): brzeg bez schodków"""
    im = Image.fromarray((L * 255).astype("uint8")).resize((WW * px, WH * px), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * miekkosc))
    a = np.array(im).astype(float)
    a = np.clip((a - 118) / 22.0, 0, 1)
    return (a * 255).astype("uint8")


def odleglosc_morza(L, maks=12):
    """odległość (w kratkach) od lądu dla kratek morza, do cieniowania płycizn"""
    d = np.full(L.shape, maks, float)
    cur = L.copy(); d[L] = 0
    for i in range(1, maks):
        nxt = K.dilate(cur, 1)
        d[nxt & ~cur] = i
        cur = nxt
    return d


def poly_szer(d, pts, w0, w1, col, px, T):
    """linia o zmiennej szerokości (kratki) z kółkami: gładka rzeka"""
    n = len(pts)
    for i in range(n - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        steps = max(2, int(math.hypot(x1 - x0, y1 - y0) * px / 2))
        for s in range(steps + 1):
            t = s / steps
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            w = (w0 + (w1 - w0) * ((i + t) / (n - 1))) * px / 2
            cx, cy = T(x + .5, y + .5)
            d.ellipse([cx - w, cy - w, cx + w, cy + w], fill=col)


def droga_gladka(d, pts, px, T, szer=2.2, kol=(205, 178, 122, 255), obw=(120, 92, 58, 255)):
    """droga o stałej szerokości z ciemniejszym obrysem"""
    ptsg = [T(x + .5, y + .5) for x, y in pts]
    for col, w in ((obw, szer * px + 3), (kol, szer * px)):
        d.line(ptsg, fill=col, width=int(w), joint="curve")
        for (cx, cy) in (ptsg[0], ptsg[-1]):
            d.ellipse([cx - w / 2, cy - w / 2, cx + w / 2, cy + w / 2], fill=col)


def rysuj_koryto(d, px, Tf, techniczny):
    """suche koryto rzeki (bez wody): ciemna skarpa, jasne popękane dno, otoczaki; część A (Góry, do wlotu pod wzgórzem zamkowym) wąska,
    część B (jar za zachodnim murem miasta do basenu Przystani) poszerza się ku ujściu"""
    rng2 = np.random.RandomState(11)
    for k, part in enumerate(K.KORYTO):
        rz = K.chaikin([K.W(p) for p in part], 3)
        w0, w1 = ((2.0, 3.4) if k == 0 else (3.2, 7.0))
        if techniczny:
            poly_szer(d, rz, w0, w1, (176, 150, 120, 255), px, Tf)
            continue
        poly_szer(d, rz, w0, w1, (118, 96, 68, 255), px, Tf)
        poly_szer(d, rz, w0 * 0.6, w1 * 0.8, (196, 182, 150, 255), px, Tf)
        n = len(rz)
        for i in range(n - 1):
            (x0, y0), (x1, y1) = rz[i], rz[i + 1]
            w = (w0 + (w1 - w0) * i / n) * 0.8 / 2
            for _ in range(int(math.hypot(x1 - x0, y1 - y0) * w * 0.9) + 1):
                t = rng2.rand(); ox, oy = (rng2.rand() - .5) * 2 * w, (rng2.rand() - .5) * 2 * w
                cx, cy = Tf(x0 + (x1 - x0) * t + .5 + ox * .8, y0 + (y1 - y0) * t + .5 + oy * .8)
                d.ellipse([cx - 1.4, cy - 1.1, cx + 1.4, cy + 1.1], fill=(150, 140, 124, 255))
    # wlot pod wzgórze zamkowe i wylot jaru: ciemne łuki
    for (pt, nm_) in ((K.WLOT, "wlot"), (K.WYLOT, "wylot")):
        cx, cy = Tf(*K.W(pt))
        r = 2.6 * px
        d.ellipse([cx - r, cy - r * .8, cx + r, cy + r * .8], fill=(40, 34, 28, 255), outline=(150, 130, 100, 255))
    # mosty: tam, gdzie droga przecina koryto
    for name, pts in K.ROADS.items():
        pw = K.chaikin([K.W(p) for p in pts], 3)
        for part in K.KORYTO:
            kw = K.chaikin([K.W(p) for p in part], 3)
            for p, q in zip(pw, pw[1:]):
                for u, v in zip(kw, kw[1:]):
                    x = _przeciecie(p, q, u, v)
                    if x:
                        cx, cy = Tf(*x)
                        d.rectangle([cx - 2.2 * px, cy - 1.4 * px, cx + 2.2 * px, cy + 1.4 * px], fill=(150, 122, 82, 255), outline=(70, 52, 30, 255))
                        break


def _przeciecie(p, q, u, v):
    d1 = (q[0] - p[0], q[1] - p[1]); d2 = (v[0] - u[0], v[1] - u[1])
    den = d1[0] * d2[1] - d1[1] * d2[0]
    if abs(den) < 1e-9: return None
    t = ((u[0] - p[0]) * d2[1] - (u[1] - p[1]) * d2[0]) / den
    r = ((u[0] - p[0]) * d1[1] - (u[1] - p[1]) * d1[0]) / den
    if 0 <= t <= 1 and 0 <= r <= 1: return (p[0] + d1[0] * t, p[1] + d1[1] * t)
    return None


def rysuj_drogi(d, px, Tf, techniczny):
    """drogi o stałej szerokości; każda kończy się przy celu (zdarzenie docelowe), na końcu mały pomost / lądowisko, nie w morzu"""
    for name, pts in K.ROADS.items():
        pg = K.chaikin([K.W(p) for p in pts], 3)
        if techniczny: droga_gladka(d, pg, px, Tf, szer=1.6, kol=(248, 226, 140, 255), obw=(90, 70, 40, 255))
        else: droga_gladka(d, pg, px, Tf)
        cx, cy = Tf(pg[-1][0] + .5, pg[-1][1] + .5)
        d.ellipse([cx - 1.8 * px, cy - 1.8 * px, cx + 1.8 * px, cy + 1.8 * px], fill=(205, 178, 122, 255), outline=(120, 92, 58, 255))


def nazwa_etykieta(m, sw):
    return NAZ.get(m) or ("N%d" % m)


NAZ = K.NAMES


def rysuj_podglad(sw, pas):
    px = 3
    L = sw.L
    alfa = Image.fromarray(alfa_ladu(L, px))
    # morze: cieniowanie od brzegu
    dist = odleglosc_morza(L)
    sea = np.zeros((WH, WW, 3), float)
    deep = np.array([22, 52, 98], float); shallow = np.array([70, 140, 178], float)
    t = np.clip(1 - dist / 9.0, 0, 1) ** 1.6
    sea[...] = deep + (shallow - deep) * t[..., None]
    seaim = Image.fromarray(sea.astype("uint8")).resize((WW * px, WH * px), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 1.2))
    img = seaim.convert("RGBA")
    # teren tła (tam, gdzie brak mapy): z Atlasu
    T = teren_atlasu()
    col = np.zeros((WH, WW, 3), np.uint8); col[...] = (104, 146, 84)
    col[T == 1] = (132, 128, 116); col[T == 2] = (84, 128, 74)
    land_bg = Image.fromarray(col).resize((WW * px, WH * px), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 0.8)).convert("RGBA")
    ld = land_bg.copy()
    # tekstura lasu / skał tam, gdzie nie ma miniatury (puszcza, nowe mapy)
    rng = np.random.RandomState(7)
    dtex = ImageDraw.Draw(ld)
    dist_s = odleglosc_morza(~L, 6)   # odległość od morza w głąb lądu (kratki)
    for ty in range(WH):
        for tx in range(WW):
            if not L[ty, tx]: continue
            if any(m in sw.size and sw.rects[m][0] <= tx < sw.rects[m][0] + sw.size[m][0] and sw.rects[m][1] <= ty < sw.rects[m][1] + sw.size[m][1] for m in ()): continue
            cls = T[ty, tx]
            r = rng.rand()
            cx, cy = (tx + rng.rand()) * px, (ty + rng.rand()) * px
            if cls == 1 and r < 0.5:
                dtex.polygon([(cx - 4, cy + 3), (cx, cy - 4), (cx + 4, cy + 3)], fill=(104, 100, 94, 255))
            elif r < 0.30:
                g = int(80 + rng.rand() * 34)
                dtex.ellipse([cx - 2.6, cy - 2.6, cx + 2.6, cy + 2.6], fill=(54 + g // 5, g + 28, 58, 255))
    # pokrycie miniaturami (kratki), rozmyte: miniatury znikają miękko tam, gdzie zaczyna się puszcza lub nowa mapa; wspólne krawędzie obecnych map zostają ostre
    covm = np.zeros((WH, WW), float)
    for m, (x, y, w, h) in sw.rects.items():
        if m in sw.size: covm[y:y + h, x:x + w] = 1.0
    covb = Image.fromarray((covm * 255).astype("uint8")).resize((WW * px, WH * px), Image.BILINEAR).filter(ImageFilter.GaussianBlur(px * 5.0))
    covb = covb.point(lambda v: int(255 * min(1.0, max(0.0, (v - 70) / 150.0))))
    layer = Image.new("RGBA", ld.size, (0, 0, 0, 0))
    for m, (x, y, w, h) in sw.rects.items():
        if m in sw.size:
            th = miniatura(m, px)
            layer.alpha_composite(th, (x * px, y * px))
    # woda z mapy, na której maska ma ląd (do przemalowania w etapach budowy): w podglądzie pokazujemy docelowy ląd, nie prostokąt wody
    hole = np.zeros((WH, WW), bool)
    for m, (x, y, w, h) in sw.rects.items():
        if m in sw.size:
            blk = K.woda_blk(m)[0]; oh, ow = blk.shape
            hole[y:y + oh, x:x + ow] |= blk & L[y:y + oh, x:x + ow]
    holeim = Image.fromarray((hole * 255).astype("uint8")).resize((WW * px, WH * px), Image.BILINEAR).filter(ImageFilter.GaussianBlur(px * 1.5))
    la = np.array(layer.split()[3]).astype(float) * np.array(covb).astype(float) / 255.0 * (1 - np.array(holeim).astype(float) / 255.0)
    layer.putalpha(Image.fromarray(la.astype("uint8")))
    ld.alpha_composite(layer)
    # plaża przy wodzie
    near = K.dilate(~L, 1) & L
    beach = Image.fromarray((near * 255).astype("uint8")).resize((WW * px, WH * px), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 0.9))
    sand = Image.new("RGBA", ld.size, (222, 204, 150, 255))
    ld = Image.composite(sand, ld, beach.point(lambda v: int(v * 0.55)))
    ld.putalpha(alfa)
    # piana
    foam = Image.fromarray(alfa_ladu(K.dilate(L, 1), px)).point(lambda v: int(v * 0.0))
    img.alpha_composite(ld)
    d = ImageDraw.Draw(img, "RGBA")

    def Tf(x, y): return (x * px, y * px)
    rysuj_koryto(d, px, Tf, False)
    rysuj_drogi(d, px, Tf, False)
    # nazwy
    from PIL import ImageFont
    f = K.font(17); fs = K.font(13, False)
    for m, (x, y, w, h) in sw.rects.items():
        if m not in sw.size: continue
        lab = K.NAMES[m]
        cx, cy = (x + w / 2) * px, (y + h / 2) * px
        tw = d.textlength(lab, font=f)
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1)):
            d.text((cx - tw / 2 + dx, cy + dy), lab, fill=(20, 28, 40, 230), font=f)
        d.text((cx - tw / 2, cy), lab, fill=(255, 246, 214, 255), font=f)
    # kadr
    box = (int((K.OFF[0] - 66) * px), int((K.OFF[1] - 30) * px), int((K.OFF[0] + 830) * px), int((K.OFF[1] + 480) * px))
    return img.crop(box).convert("RGB")


def rysuj_techniczny(sw, sas, pas, nies, ed):
    px = 2.5
    img = Image.new("RGBA", (int(WW * px), int(WH * px)), (24, 48, 92, 255))
    d = ImageDraw.Draw(img, "RGBA")
    land = np.zeros((WH, WW, 4), np.uint8); land[sw.L] = (196, 176, 122, 255)
    land[sw.L_raven & ~sw.L] = (196, 176, 122, 255)
    img.alpha_composite(Image.fromarray(land, "RGBA").resize(img.size, Image.NEAREST))
    # wybrzuszenia (ląd dodany wokół treści): jaśniejszy żółty
    bul = np.zeros((WH, WW, 4), np.uint8); bul[sw.L & ~sw.L_raven] = (255, 235, 120, 120)
    img.alpha_composite(Image.fromarray(bul, "RGBA").resize(img.size, Image.NEAREST))
    F, FS = K.font(14), K.font(11)
    for m, (x, y, w, h) in sw.rects.items():
        X, Y = x * px, y * px
        if m in sw.size:
            ow, oh = sw.size[m]
            if (w, h) != (ow, oh):
                img.alpha_composite(Image.new("RGBA", (int(w * px), int(h * px)), (255, 255, 255, 40)), (int(X), int(Y)))
            th = miniatura(m, px)
            img.alpha_composite(th, (int(X), int(Y)))
            n = nies[m]
            ov = np.zeros((oh, ow, 4), np.uint8)
            ov[n["_morze"]] = (255, 40, 40, 150); ov[n["_lad"]] = (255, 205, 0, 100)
            img.alpha_composite(Image.fromarray(ov, "RGBA").resize((int(ow * px), int(oh * px)), Image.NEAREST), (int(X), int(Y)))
        else:
            d.rectangle([X, Y, X + w * px, Y + h * px], fill=(236, 140, 30, 55))
        d.rectangle([X, Y, X + w * px, Y + h * px], outline=(255, 170, 40, 255) if m not in sw.size else (255, 255, 255, 215), width=2 if m not in sw.size else 1)
    Tf = lambda x, y: (x * px, y * px)
    rysuj_koryto(d, px, Tf, True)
    rysuj_drogi(d, px, Tf, True)
    cov = sw.occ() >= 0
    ys, xs = np.where(sw.coast)
    for x, y in zip(xs, ys):
        c = (70, 255, 110, 255) if cov[y, x] else (255, 50, 50, 255)
        d.rectangle([x * px, y * px, (x + 1) * px, (y + 1) * px], fill=c)
    for m, (x, y, w, h) in sw.rects.items():
        lab = ("%d %s" % (m, K.NAMES[m]) if m in K.NAMES else "N%d %s" % (m, sw.new[m].get("nazwa", "")))
        if m in K.PLAYER: lab += " *"
        f = FS if m in sw.new else F
        X, Y = x * px + 4, y * px + 4
        tw = d.textlength(lab, font=f)
        d.rectangle([X - 1, Y - 1, X + tw + 5, Y + f.size + 3], fill=(8, 12, 22, 215))
        d.text((X + 2, Y), lab, fill=(255, 236, 150, 255), font=f)
    # legenda (panel po prawej u góry)
    lg = [((70, 255, 110, 255), "linia brzegu leży na mapie"), ((255, 50, 50, 255), "linia brzegu poza mapami"), ((255, 40, 40, 150), "pole czerwone: tu będzie morze (pusty teren)"),
          ((255, 235, 120, 140), "wybrzuszenie lądu wokół treści (budynki, miejsca)"),
          ((248, 226, 140, 255), "droga"), ((176, 150, 120, 255), "suche koryto rzeki (bez wody)"), ((255, 170, 40, 255), "ramka pomarańczowa: nowa mapa"), ((255, 255, 255, 215), "ramka biała: obecna mapa (* = mapa gracza)")]
    pw, ph = 470, 34 + len(lg) * 20
    px0, py0 = int((K.OFF[0] + 830) * px) - pw - 14, int((K.OFF[1] - 30) * px) + 14
    d.rectangle([px0, py0, px0 + pw, py0 + ph], fill=(8, 12, 22, 230), outline=(255, 255, 255, 120))
    d.text((px0 + 12, py0 + 8), "Świat Kruczej Wyspy w kratkach (0,70 kratki na piksel Atlasu)", fill=(255, 255, 255, 255), font=FS)
    for k, (c, t) in enumerate(lg):
        d.rectangle([px0 + 12, py0 + 32 + k * 20, px0 + 34, py0 + 42 + k * 20], fill=c); d.text((px0 + 44, py0 + 28 + k * 20), t, fill=(225, 225, 225, 255), font=FS)
    box = (int((K.OFF[0] - 50) * px), int((K.OFF[1] - 30) * px), int((K.OFF[0] + 830) * px), int((K.OFF[1] + 480) * px))
    return img.crop(box).convert("RGB")


def rysuj_podzial(sw, ed, pas):
    px = 2.5
    img = Image.new("RGBA", (int(WW * px), int(WH * px)), (24, 48, 92, 255))
    d = ImageDraw.Draw(img, "RGBA")
    land = np.zeros((WH, WW, 4), np.uint8); land[sw.L] = (74, 70, 56, 255)
    img.alpha_composite(Image.fromarray(land, "RGBA").resize(img.size, Image.NEAREST))
    F, FS = K.font(19), K.font(11)
    for m, (x, y, w, h) in sw.rects.items():
        col = (236, 140, 30, 95) if m in sw.new else ((255, 215, 0, 90) if m in K.PLAYER else (120, 176, 124, 90))
        d.rectangle([x * px, y * px, (x + w) * px, (y + h) * px], fill=col)
    C = {"morze": (80, 160, 255, 255), "sciana": (176, 126, 84, 255), "sasiad": (205, 205, 205, 255)}
    for m, (x, y, w, h) in sw.rects.items():
        for sd in "NESW":
            for sg in ed[m][sd]:
                o = -2 if sd in "ES" else 2
                if sd in "EW":
                    X = (x + (w if sd == "E" else 0)) * px + o; pts = [(X, sg["od"] * px), (X, sg["do"] * px)]
                else:
                    Yy = (y + (h if sd == "S" else 0)) * px + o; pts = [(sg["od"] * px, Yy), (sg["do"] * px, Yy)]
                d.line(pts, fill=C[sg["typ"]], width=3)
    for p in pas:
        a = sw.rects[p["a"]]
        if p["strona"] == "E":
            X = (a[0] + a[2]) * px; d.line([(X - 3, (p["pos"] - 1) * px), (X - 3, (p["pos"] + 2) * px)], fill=(70, 255, 110, 255), width=8)
        else:
            Yy = (a[1] + a[3]) * px; d.line([((p["pos"] - 1) * px, Yy - 3), ((p["pos"] + 2) * px, Yy - 3)], fill=(70, 255, 110, 255), width=8)
    for m, (x, y, w, h) in sw.rects.items():
        lab = str(m); tw = d.textlength(lab, font=F)
        d.text((x * px + w * px / 2 - tw / 2, y * px + h * px / 2 - 12), lab, fill=(255, 255, 255, 255), font=F)
        d.text((x * px + 5, y * px + 4), "%d x %d" % (w, h), fill=(255, 255, 255, 170), font=FS)
    lg = [((70, 255, 110, 255), "przejście (droga przecina wspólną krawędź)"), ((80, 160, 255, 255), "krawędź: morze"), ((176, 126, 84, 255), "krawędź: ściana (klif, gęsty las, góry)"),
          ((205, 205, 205, 255), "wspólna krawędź z sąsiadem, bez przejścia (ściana)"), ((255, 215, 0, 255), "złoty = mapa gracza"), ((236, 140, 30, 255), "pomarańczowy = nowa mapa (900+)")]
    pw, ph = 420, 34 + len(lg) * 18
    px0, py0 = int((K.OFF[0] + 830) * px) - pw - 14, int((K.OFF[1] - 30) * px) + 14
    d.rectangle([px0, py0, px0 + pw, py0 + ph], fill=(8, 12, 22, 230), outline=(255, 255, 255, 120))
    d.text((px0 + 12, py0 + 8), "Podział świata na mapy (puzzle)", fill=(255, 255, 255, 255), font=FS)
    for k, (c, t) in enumerate(lg):
        d.rectangle([px0 + 12, py0 + 32 + k * 18, px0 + 34, py0 + 40 + k * 18], fill=c); d.text((px0 + 44, py0 + 28 + k * 18), t, fill=(225, 225, 225, 255), font=FS)
    box = (int((K.OFF[0] - 50) * px), int((K.OFF[1] - 30) * px), int((K.OFF[0] + 830) * px), int((K.OFF[1] + 480) * px))
    return img.crop(box).convert("RGB")


def wybierz_styki(sw, bk, ile=3):
    """styki z brzegiem między obecnymi mapami (z miniaturami); różne miejsca"""
    cand = []
    for e in bk:
        if e["a"] in sw.size and e["b"] in sw.size and e["przeciecia"]:
            for c in e["przeciecia"]:
                cand.append((e, c))
    pick = []
    for e, c in cand:
        pos = (e["od"] + e["do"]) // 2
        pt = (sw.rects[e["a"]][0] + sw.rects[e["a"]][2], c["pos"]) if e["strona"] == "E" else (c["pos"], sw.rects[e["a"]][1] + sw.rects[e["a"]][3])
        if all(math.hypot(pt[0] - q[2][0], pt[1] - q[2][1]) > 120 for q in pick): pick.append((e, c, pt))
        if len(pick) >= ile: break
    return pick


def rysuj_zblizenia(sw, bk):
    px = 10
    pick = wybierz_styki(sw, bk)
    tiles = []
    HW, HH = 50, 22
    for (e, c, pt) in pick:
        cx, cy = int(pt[0]), int(pt[1])
        x0, y0 = cx - HW, cy - HH
        W_, H_ = 2 * HW, 2 * HH
        img = Image.new("RGBA", (W_ * px, H_ * px), (40, 95, 150, 255))
        for m in (e["a"], e["b"]):
            rx, ry, rw, rh = sw.rects[m]
            ix0, iy0 = max(rx, x0), max(ry, y0); ix1, iy1 = min(rx + rw, x0 + W_), min(ry + rh, y0 + H_)
            if ix1 <= ix0 or iy1 <= iy0: continue
            mp = L_.Mapa(m)
            crop = L_.render(mp, region=(ix0 - rx, iy0 - ry, ix1 - rx - 1, iy1 - ry - 1), scale=px / 48.0).convert("RGBA")
            img.alpha_composite(crop, ((ix0 - x0) * px, (iy0 - y0) * px))
        # morze z tej samej maski, gładki brzeg
        sub = sw.L[y0:y0 + H_, x0:x0 + W_]
        al = np.array(Image.fromarray((sub * 255).astype("uint8")).resize((W_ * px, H_ * px), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 0.8))).astype(float)
        a = np.clip((al - 118) / 22.0, 0, 1)
        seaim = Image.new("RGBA", img.size, (44, 104, 160, 255))
        rgba = np.array(seaim); rgba[..., 3] = ((1 - a) * 235).astype("uint8")
        img.alpha_composite(Image.fromarray(rgba, "RGBA"))
        # linia brzegu (gładki kontur)
        edge = (np.abs(np.gradient(a, axis=0)) + np.abs(np.gradient(a, axis=1))) > 0.05
        d = ImageDraw.Draw(img, "RGBA")
        ov = np.zeros(a.shape + (4,), np.uint8); ov[edge] = (255, 255, 255, 230)
        img.alpha_composite(Image.fromarray(ov, "RGBA"))
        # krawędź map i punkt przecięcia
        for m in (e["a"], e["b"]):
            rx, ry, rw, rh = sw.rects[m]
            d.rectangle([(rx - x0) * px, (ry - y0) * px, (rx + rw - x0) * px - 1, (ry + rh - y0) * px - 1], outline=(255, 190, 40, 255), width=2)
        f = K.font(15)
        for m in (e["a"], e["b"]):
            rx, ry, rw, rh = sw.rects[m]
            lab = "%d %s" % (m, K.NAMES.get(m) or "")
            tx = (rx - x0) * px + 8 if (rx - x0) * px + 8 > 4 else 8
            d.rectangle([max(4, tx - 4), 6, max(4, tx - 4) + d.textlength(lab, font=f) + 10, 28], fill=(8, 12, 22, 220))
            d.text((max(4, tx), 8), lab, fill=(255, 236, 150, 255), font=f)
        qx, qy = (pt[0] - x0) * px, (pt[1] - y0) * px
        d.ellipse([qx - 7, qy - 7, qx + 7, qy + 7], outline=(255, 70, 70, 255), width=3)
        cap = "styk %d | %d: brzeg przecina krawędź w kratce świata %s = %d, kąt %s° (jedna wartość po obu stronach), skok na granicy: 0" % (
            e["a"], e["b"], "y" if e["strona"] == "E" else "x", c["pos"], c["kat"])
        d.rectangle([0, img.height - 28, img.width, img.height], fill=(8, 12, 22, 230))
        d.text((10, img.height - 24), cap, fill=(240, 240, 240, 255), font=K.font(14, False))
        tiles.append(img.convert("RGB"))
    if not tiles: return None
    Wd = max(t.width for t in tiles); Hd = sum(t.height for t in tiles) + 8 * (len(tiles) - 1) + 46
    out = Image.new("RGB", (Wd, Hd), (14, 18, 28))
    d = ImageDraw.Draw(out)
    d.text((10, 10), "Zbliżenia styków map z brzegiem: obie mapy obok siebie, linia brzegu (biała) przechodzi przez krawędź w tej samej kratce i pod tym samym kątem", fill=(255, 255, 255), font=K.font(16))
    y = 40
    for t in tiles:
        out.paste(t, (0, y)); y += t.height + 8
    return out


if __name__ == "__main__":
    sw, sas, pas, nies, ed, stare, bk, J = K.wszystko()
    rysuj_techniczny(sw, sas, pas, nies, ed).save(os.path.join(DOCS, "swiat_kratki.png"))
    rysuj_podzial(sw, ed, pas).save(os.path.join(DOCS, "swiat_kratki_podzial.png"))
    rysuj_podglad(sw, pas).save(os.path.join(DOCS, "swiat_podglad.png"))
    z = rysuj_zblizenia(sw, bk)
    if z: z.save(os.path.join(DOCS, "swiat_zblizenia.png"))
    print("obrazy gotowe")
