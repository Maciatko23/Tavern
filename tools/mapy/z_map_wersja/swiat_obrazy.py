# -*- coding: utf-8 -*-
# Obrazy świata „z map” (PROJEKT): swiat_podglad.png (ładny podgląd bez ramek), swiat_kratki.png (techniczny), swiat_kratki_podzial.png (puzzle),
# swiat_zblizenia.png (styki map z brzegiem). Nic nie zapisuje do data/ ani js/.
#   python tools/mapy/swiat_obrazy.py
import os, sys, math, json, collections
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import swiat_kratki as K
import uklad_szukaj as U
import mapylib as L_

DOCS = K.DOCS
TMP = os.environ.get("KRUK_TMP", os.environ.get("TEMP", "."))
SEA_DEEP = (22, 56, 104)
SEA_SHALLOW = (62, 128, 170)
SEA_FLAT = (40, 96, 150)


def dilate(a, r):
    out = a.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r: out |= np.roll(np.roll(a, dy, 0), dx, 1)
    return out


def miniatura(m, px):
    """obraz mapy w skali px na kratkę; 8 (+7 rzędów w dół) i 111 (+10 kolumn przed murem) uzupełnione gruntem; nowe mapy: ląd z profilu wody"""
    cache = os.path.join(TMP, "swiat2_th_%d_%dx%d_%.3f.png" % (m, U.SZ[m][0], U.SZ[m][1], px))
    if os.path.exists(cache): return Image.open(cache).convert("RGBA")
    w, h = U.SZ[m]
    if m in U.FILL:
        im = Image.new("RGBA", (int(w * px), int(h * px)), (96, 140, 84, 255))
        d = ImageDraw.Draw(im)
        rng = np.random.RandomState(m)
        for _ in range(int(w * h * 0.35)):
            x, y = rng.rand() * w * px, rng.rand() * h * px
            g = int(70 + rng.rand() * 40)
            d.ellipse([x - 2.4, y - 2.4, x + 2.4, y + 2.4], fill=(48 + g // 5, g + 28, 56, 255))
    else:
        base = L_.render(L_.Mapa(m), scale=px / 48.0).convert("RGBA")
        if m == 8:
            w0, h0 = base.size; extra = int(7 * px)
            im = Image.new("RGBA", (w0, h0 + extra)); im.paste(base, (0, 0)); strip = base.crop((0, h0 - int(px), w0, h0)).resize((w0, extra)); im.paste(strip, (0, h0))
        elif m == 159:
            w0, h0 = base.size; extra = int(6 * px)
            im = Image.new('RGBA', (w0, h0 + extra)); im.paste(base, (0, 0)); im.paste(base.crop((0, h0 - int(px), w0, h0)).resize((w0, extra)), (0, h0))
        elif m == 111:
            w0, h0 = base.size; cut = int(90 * px); extra = int(10 * px)
            im = Image.new("RGBA", (w0 + extra, h0)); im.paste(base.crop((0, 0, cut, h0)), (0, 0))
            im.paste(base.crop((cut - int(px), 0, cut, h0)).resize((extra, h0)), (cut, 0)); im.paste(base.crop((cut, 0, w0, h0)), (cut + extra, 0))
        else: im = base
        im = im.resize((int(w * px), int(h * px)), Image.LANCZOS) if im.size != (int(w * px), int(h * px)) else im
    im.save(cache)
    return im


def woda_wyswietlana(m):
    """maska wody do rysunku: istniejące mapy bez zmian; nowe mapy brzegowe z falistą linią brzegu (łuki), w kolumnach / rzędach przy krawędzi dokładnie jak profil (pas 16)"""
    if m not in U.FILL: return U.WM[m]
    t, w, h = U.FILL[m]
    rng = np.random.RandomState(m * 7 + 1)
    a = np.zeros((h, w), bool)
    def prof(n, base=16):
        x = np.linspace(0, 1, n)
        ph = rng.rand(3) * 6.28
        noise = 0.5 * np.sin(x * 5.0 + ph[0]) + 0.3 * np.sin(x * 11.0 + ph[1]) + 0.2 * np.sin(x * 17.0 + ph[2])
        env = np.sin(np.pi * x) ** 1.2            # na końcach (przy krawędziach bocznych) głębokość = pełny pas
        d = base - env * (4.0 + 3.0 * noise)
        d[:2] = base; d[-2:] = base
        return np.clip(np.round(d), 6, base).astype(int)
    if "E" in t:
        d = prof(h)
        for y in range(h): a[y, w - d[y]:] = True
    if "W" in t:
        d = prof(h)
        for y in range(h): a[y, :d[y]] = True
    if "S" in t:
        d = prof(w)
        for x in range(w): a[h - d[x]:, x] = True
    if "N" in t:
        d = prof(w)
        for x in range(w): a[:d[x], x] = True
    return a


def alfa_morza(WMm, px):
    """gładka maska wody (0-255) w skali obrazu dla jednej mapy"""
    h, w = WMm.shape
    a = Image.fromarray((WMm * 255).astype("uint8")).resize((int(w * px), int(h * px)), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 0.7))
    arr = np.clip((np.array(a).astype(float) - 100) / 55.0, 0, 1)
    return (arr * 255).astype("uint8")


def dziury(sw):
    """kratki poza mapami, do których morze nie dochodzi (wnętrze lądu bez map = nieprzechodni las)"""
    free = sw.O < 0
    reach = np.zeros_like(free)
    st = [(0, 0)]; reach[0, 0] = True
    H, W = free.shape
    while st:
        x, y = st.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            u, v = x + dx, y + dy
            if 0 <= u < W and 0 <= v < H and free[v, u] and not reach[v, u]: reach[v, u] = True; st.append((u, v))
    return free & ~reach


def rysuj_podglad(sw, px=3):
    H, W = sw.HHd, sw.WWd
    hol = dziury(sw)
    land = sw.L | hol
    dist = np.full(land.shape, 12.0)
    cur = land.copy(); dist[land] = 0
    for i in range(1, 12):
        nxt = dilate(cur, 1); dist[nxt & ~cur] = i; cur = nxt
    t = np.clip(1 - dist / 10.0, 0, 1) ** 1.6
    deep = np.array(SEA_DEEP, float); sh = np.array(SEA_SHALLOW, float)
    sea = deep + (sh - deep) * t[..., None]
    img = Image.fromarray(sea.astype("uint8")).resize((W * px, H * px), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 1.1)).convert("RGBA")
    # wnętrze bez map: las
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    rng = np.random.RandomState(5)
    ys, xs = np.where(hol)
    for x, y in zip(xs, ys):
        d.rectangle([x * px, y * px, (x + 1) * px, (y + 1) * px], fill=(92, 138, 80, 255))
        if rng.rand() < 0.4: d.ellipse([(x + .5) * px - 2.5, (y + .5) * px - 2.5, (x + .5) * px + 2.5, (y + .5) * px + 2.5], fill=(54, 100, 58, 255))
    lay = lay.filter(ImageFilter.GaussianBlur(px * 0.9))
    img.alpha_composite(lay)
    # mapy: miniatura z wodą zastąpioną jednolitym morzem (żadnych prostokątów wody)
    for m, (x, y, w, h) in sw.rects.items():
        th = miniatura(m, px).copy()
        al = np.array(th.split()[3]).astype(float)
        sa = alfa_morza(woda_wyswietlana(m), px).astype(float)
        th.putalpha(Image.fromarray((al * (1 - sa / 255.0)).astype("uint8")))
        img.alpha_composite(th, (x * px, y * px))
    # plaża: pas piasku przy wodzie
    near = dilate(~sw.L & ~hol, 1) & sw.L
    beach = Image.fromarray((near * 255).astype("uint8")).resize(img.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 0.8)).point(lambda v: int(v * 0.35))
    sand = Image.new("RGBA", img.size, (224, 206, 150, 255))
    sand.putalpha(beach)
    img.alpha_composite(sand)
    d = ImageDraw.Draw(img, "RGBA")
    f = K.font(17)
    for m, (x, y, w, h) in sw.rects.items():
        if m in U.FILL: continue
        lab = K.nazwa(m, sw)
        cx, cy = (x + w / 2) * px, (y + h / 2) * px
        tw = d.textlength(lab, font=f)
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)): d.text((cx - tw / 2 + dx, cy + dy), lab, fill=(20, 28, 40, 230), font=f)
        d.text((cx - tw / 2, cy), lab, fill=(255, 246, 214, 255), font=f)
    return img.convert("RGB")


def rysuj_techniczny(sw, ct, nz, px=2.5):
    H, W = sw.HHd, sw.WWd
    img = Image.new("RGBA", (int(W * px), int(H * px)), SEA_FLAT + (255,))
    d = ImageDraw.Draw(img, "RGBA")
    hol = dziury(sw)
    arr = np.zeros((H, W, 4), np.uint8); arr[hol] = (92, 138, 80, 255)
    img.alpha_composite(Image.fromarray(arr, "RGBA").resize(img.size, Image.NEAREST))
    F, FS = K.font(14), K.font(11)
    for m, (x, y, w, h) in sw.rects.items():
        th = miniatura(m, px)
        img.alpha_composite(th, (int(x * px), int(y * px)))
        d.rectangle([x * px, y * px, (x + w) * px, (y + h) * px], outline=(255, 170, 40, 255) if m in U.FILL else (255, 255, 255, 220), width=2 if m in U.FILL else 1)
        if m in U.FILL: d.rectangle([x * px, y * px, (x + w) * px, (y + h) * px], fill=(236, 140, 30, 40))
    # krawędzie: wspólne zielone, morze niebieskie
    for m, (x, y, w, h) in sw.rects.items():
        for side in "NSWE":
            cells, own, ww, (ox, oy, dx, dy) = sw.brzeg_kolumny(m, side)
            for i in range(len(cells)):
                X, Y = ox + dx * i, oy + dy * i
                if own[i] >= 0: continue
                if side in "NS": pts = [(X * px, (y if side == "N" else y + h) * px)] * 2 + [((X + 1) * px, (y if side == "N" else y + h) * px)]
                else: pts = [((x if side == "W" else x + w) * px, Y * px), ((x if side == "W" else x + w) * px, (Y + 1) * px)]
                d.line(pts[-2:] if side in "NS" else pts, fill=(255, 40, 40, 255) if not cells[i] else (90, 170, 255, 255), width=3)
    for m, (x, y, w, h) in sw.rects.items():
        lab = ("%d %s" % (m, K.NAMES[m]) if m in K.NAMES else "N%d %s" % (m, sw.nazwy.get(m, "")))
        if m in K.PLAYER: lab += " *"
        fnt = FS if m in U.FILL else F
        X, Y = x * px + 4, y * px + 4
        tw = d.textlength(lab, font=fnt)
        d.rectangle([X - 1, Y - 1, X + tw + 5, Y + fnt.size + 3], fill=(8, 12, 22, 215))
        d.text((X + 2, Y), lab, fill=(255, 236, 150, 255), font=fnt)
    lg = [((255, 255, 255, 220), "mapa obecna (* = gracza)"), ((255, 170, 40, 255), "nowa mapa brzegowa"), ((90, 170, 255, 255), "krawędź bez sąsiada: morze (dobrze)"),
          ((255, 40, 40, 255), "krawędź bez sąsiada z LĄDEM (ucięta, do naprawy)"), ((92, 138, 80, 255), "wnętrze bez map: nieprzechodni las")]
    pw, ph = 420, 30 + len(lg) * 19
    x0, y0 = int(W * px) - pw - 14, 14
    d.rectangle([x0, y0, x0 + pw, y0 + ph], fill=(8, 12, 22, 235), outline=(255, 255, 255, 120))
    d.text((x0 + 12, y0 + 6), "Świat z samych map (rysunek techniczny)", fill=(255, 255, 255, 255), font=FS)
    for k, (c, t) in enumerate(lg):
        d.rectangle([x0 + 12, y0 + 28 + k * 19, x0 + 34, y0 + 38 + k * 19], fill=c); d.text((x0 + 44, y0 + 24 + k * 19), t, fill=(225, 225, 225, 255), font=FS)
    return img.convert("RGB")


def rysuj_podzial(sw, sas, px=2.5):
    H, W = sw.HHd, sw.WWd
    img = Image.new("RGBA", (int(W * px), int(H * px)), SEA_FLAT + (255,))
    d = ImageDraw.Draw(img, "RGBA")
    F, FS = K.font(19), K.font(11)
    for m, (x, y, w, h) in sw.rects.items():
        col = (236, 140, 30, 110) if m in U.FILL else ((255, 215, 0, 100) if m in K.PLAYER else (120, 176, 124, 100))
        d.rectangle([x * px, y * px, (x + w) * px, (y + h) * px], fill=col, outline=(255, 255, 255, 230), width=1)
        lab = str(m); tw = d.textlength(lab, font=F)
        d.text((x * px + w * px / 2 - tw / 2, y * px + h * px / 2 - 12), lab, fill=(255, 255, 255, 255), font=F)
        d.text((x * px + 5, y * px + 4), "%d x %d" % (w, h), fill=(255, 255, 255, 170), font=FS)
    for (a, sa, b, sb, lo, hi) in sas:
        ax, ay, aw, ah = sw.rects[a]
        if sa == "E": d.line([((ax + aw) * px, lo * px), ((ax + aw) * px, hi * px)], fill=(70, 255, 110, 255), width=3)
        else: d.line([(lo * px, (ay + ah) * px), (hi * px, (ay + ah) * px)], fill=(70, 255, 110, 255), width=3)
    lg = [((70, 255, 110, 255), "wspólna krawędź"), ((255, 215, 0, 255), "mapa gracza"), ((236, 140, 30, 255), "nowa mapa")]
    x0, y0 = int(W * px) - 250, 14
    d.rectangle([x0, y0, x0 + 236, y0 + 20 + len(lg) * 19], fill=(8, 12, 22, 235), outline=(255, 255, 255, 120))
    for k, (c, t) in enumerate(lg):
        d.rectangle([x0 + 12, y0 + 12 + k * 19, x0 + 34, y0 + 22 + k * 19], fill=c); d.text((x0 + 44, y0 + 8 + k * 19), t, fill=(225, 225, 225, 255), font=FS)
    return img.convert("RGB")


def wybierz_styki(sw, bk, ile=3):
    cand = []
    for e in bk:
        for c in e["przeciecia"]:
            cand.append((e, c))
    pick = []
    for e, c in cand:
        a = sw.rects[e["a"]]
        pt = (a[0] + a[2], c["pos"]) if e["strona"] == "E" else (c["pos"], a[1] + a[3])
        if all(math.hypot(pt[0] - q[2][0], pt[1] - q[2][1]) > 100 for q in pick): pick.append((e, c, pt))
        if len(pick) >= ile: break
    return pick


def rysuj_zblizenia(sw, bk):
    px = 10
    pick = wybierz_styki(sw, bk)
    tiles = []
    HW, HH = 46, 22
    for (e, c, pt) in pick:
        cx, cy = int(pt[0]), int(pt[1])
        x0, y0 = cx - HW, cy - HH
        Wt, Ht = 2 * HW, 2 * HH
        img = Image.new("RGBA", (Wt * px, Ht * px), SEA_FLAT + (255,))
        for m in (e["a"], e["b"]):
            rx, ry, rw, rh = sw.rects[m]
            ix0, iy0 = max(rx, x0), max(ry, y0); ix1, iy1 = min(rx + rw, x0 + Wt), min(ry + rh, y0 + Ht)
            if ix1 <= ix0 or iy1 <= iy0: continue
            th = miniatura(m, px)
            crop = th.crop(((ix0 - rx) * px, (iy0 - ry) * px, (ix1 - rx) * px, (iy1 - ry) * px)).copy()
            wmm = woda_wyswietlana(m)[iy0 - ry:iy1 - ry, ix0 - rx:ix1 - rx]
            sa = alfa_morza(wmm, px).astype(float)
            al = np.array(crop.split()[3]).astype(float)
            crop.putalpha(Image.fromarray((al * (1 - sa / 255.0)).astype("uint8")))
            img.alpha_composite(crop, ((ix0 - x0) * px, (iy0 - y0) * px))
        d = ImageDraw.Draw(img, "RGBA")
        # kontur brzegu (gładki)
        sub = sw.L[y0:y0 + Ht, x0:x0 + Wt]
        al = np.array(Image.fromarray((sub * 255).astype("uint8")).resize((Wt * px, Ht * px), Image.BICUBIC).filter(ImageFilter.GaussianBlur(px * 0.8))).astype(float)
        a = np.clip((al - 118) / 22.0, 0, 1)
        edge = (np.abs(np.gradient(a, axis=0)) + np.abs(np.gradient(a, axis=1))) > 0.05
        ov = np.zeros(a.shape + (4,), np.uint8); ov[edge] = (255, 255, 255, 230)
        img.alpha_composite(Image.fromarray(ov, "RGBA"))
        for m in (e["a"], e["b"]):
            rx, ry, rw, rh = sw.rects[m]
            d.rectangle([(rx - x0) * px, (ry - y0) * px, (rx + rw - x0) * px - 1, (ry + rh - y0) * px - 1], outline=(255, 190, 40, 255), width=2)
        f = K.font(15)
        for m in (e["a"], e["b"]):
            rx, ry, rw, rh = sw.rects[m]
            lab = "%d %s" % (m, K.nazwa(m, sw))
            tx = max(8, (rx - x0) * px + 8)
            d.rectangle([tx - 4, 6, tx - 4 + d.textlength(lab, font=f) + 10, 28], fill=(8, 12, 22, 220)); d.text((tx, 8), lab, fill=(255, 236, 150, 255), font=f)
        qx, qy = (pt[0] - x0) * px, (pt[1] - y0) * px
        d.ellipse([qx - 7, qy - 7, qx + 7, qy + 7], outline=(255, 70, 70, 255), width=3)
        cap = "styk %d | %d: brzeg przecina krawędź w kratce świata %s = %d, kąt %s° (jedna wartość po obu stronach), skok na granicy: %d" % (
            e["a"], e["b"], "y" if e["strona"] == "E" else "x", c["pos"], c["kat"], e["skok_kratek"])
        d.rectangle([0, img.height - 28, img.width, img.height], fill=(8, 12, 22, 230)); d.text((10, img.height - 24), cap, fill=(240, 240, 240, 255), font=K.font(14, False))
        tiles.append(img.convert("RGB"))
    if not tiles: return None
    Wd = max(t.width for t in tiles); Hd = sum(t.height for t in tiles) + 8 * (len(tiles) - 1) + 46
    out = Image.new("RGB", (Wd, Hd), (14, 18, 28)); d = ImageDraw.Draw(out)
    d.text((10, 10), "Zbliżenia styków map z brzegiem: obie mapy obok siebie, linia brzegu (biała) przechodzi przez krawędź w tej samej kratce i pod tym samym kątem", fill=(255, 255, 255), font=K.font(16))
    y = 40
    for t in tiles: out.paste(t, (0, y)); y += t.height + 8
    return out


if __name__ == "__main__":
    sw, sas = K.wszystko()
    bk = sw.brzeg_na_krawedziach(sas)
    ct = sw.ucięte(); nz = sw.niezgodne()
    rysuj_techniczny(sw, ct, nz).save(os.path.join(DOCS, "swiat_kratki.png"))
    rysuj_podzial(sw, sas).save(os.path.join(DOCS, "swiat_kratki_podzial.png"))
    rysuj_podglad(sw).save(os.path.join(DOCS, "swiat_podglad.png"))
    z = rysuj_zblizenia(sw, bk)
    if z: z.save(os.path.join(DOCS, "swiat_zblizenia.png"))
    print("obrazy gotowe")
