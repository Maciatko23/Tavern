# Pomysł 5: TORBA WĘDROWCA - skóra, len i szwy. Bieda i przetrwanie: łatana skóra, surowy len, paski jak pasy płótna
# farbowane roślinami (marzanna, urzet, rezeda), mosiężne nity, pismo odręczne. Okno: plecak jako otwarta torba.
import math
import numpy as np
from PIL import Image, ImageDraw
from uikit import *

LEA = ["#2e1d11", "#3f2817", "#4f3320", "#5e3f29", "#6e4b31", "#86603f"]
LIN = ["#9e8e70", "#b3a382", "#c4b593", "#d3c6a6", "#e0d5b8"]
THREAD = "#eadfc0"; DTHREAD = "#3a2a1c"
INK = "#2e2218"; INK2 = "#5a4632"; ONL = "#f0e4c8"
BRASS = ["#4a3812", "#8a6a26", "#c09a42", "#ead07a"]
DYE = {"health": ["#a8443a", "#8a3028", "#6a2018"], "stamina": ["#8a9a52", "#6e7e3c", "#525e2a"],
       "food": ["#d0a03a", "#b0822a", "#8a641c"], "water": ["#5a78a8", "#45608a", "#32486a"]}
FK = lambda s: font("Kalam-Bold.ttf", s)
FR = lambda s: font("Kalam-Regular.ttf", s)


def leather(w, h, seed=1, r=8, mask=None, stitch=True, tone=0):
    m = mask if mask is not None else round_mask(w, h, r)
    n = noise(w, h, cell=40, seed=seed, octaves=2) * 0.55 + noise(w, h, cell=3, seed=seed + 1, octaves=1) * 0.45
    pal = LEA[1 + tone:5 + tone] if tone >= 0 else LEA[0:4]
    tex = np.array(quant(n, pal, cuts=[0.2, 0.5, 0.86]))
    rng = np.random.default_rng(seed)
    pores = rng.random((h, w)) > 0.95
    tex[pores] = hexc(LEA[max(0, tone)])
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint_tex(img, m, Image.fromarray(tex))
    yy, xx = np.mgrid[0:h, 0:w]
    paint(img, ring(erode(m, 1), 1) & (yy < h * 0.5), LEA[5])
    paint(img, ring(erode(m, 1), 1) & (yy >= h * 0.5), LEA[0])
    paint(img, ring(m, 1), "#160d06")
    if stitch:
        stitch_edge(img, m, 5, THREAD)
    return img, m


def stitch_edge(img, m, inset, col, dash=4, gap=3):
    """ścieg wzdłuż kształtu: obrys maski po wewnętrznej stronie, kreski + dziurki"""
    inner = erode(m, inset)
    e = ring(inner, 1)
    h, w = m.shape
    ys, xs = np.nonzero(e)
    cy, cx = h / 2, w / 2
    ang = np.arctan2((ys - cy) / h, (xs - cx) / w)
    order = np.argsort(ang)
    d = ImageDraw.Draw(img)
    per = dash + gap
    for k, i in enumerate(order):
        p = k % per
        if p < dash:
            d.point((xs[i] + 1, ys[i] + 1), fill=hexc("#140c06"))
            d.point((xs[i], ys[i]), fill=hexc(col))
        elif p == dash:
            d.point((xs[i], ys[i]), fill=hexc("#140c06"))


def linen(w, h, seed=1, torn=True, tint=None):
    m = torn_mask(w, h, amp=2, seed=seed, cell=4) if torn else rect_mask(w, h)
    yy, xx = np.mgrid[0:h, 0:w]
    n = noise(w, h, cell=30, seed=seed, octaves=2)
    weave = ((xx % 2) ^ (yy % 2)) * 0.16 + ((xx % 4) == 0) * 0.1 + ((yy % 3) == 0) * 0.08
    v = n * 0.4 + weave + 0.22
    pal = LIN[1:5] if tint is None else [mix(c, tint, 0.55) for c in LIN[1:5]]
    tex = quant(v, pal, cuts=[0.3, 0.44, 0.6])
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint_tex(img, m, tex)
    paint(img, ring(m, 1), mix(pal[0], "#3a2a1a", 0.5))
    # strzępy na krawędzi
    rng = np.random.default_rng(seed)
    d = ImageDraw.Draw(img)
    e = ring(m, 1); ys, xs = np.nonzero(e)
    for i in rng.choice(len(ys), size=max(1, len(ys) // 25), replace=False):
        y, x = ys[i], xs[i]
        dx = -1 if x < w / 2 else 1
        dy = -1 if y < h / 2 else 1
        if x < 3 or x > w - 4:
            d.point((x + dx, y), fill=hexc(pal[1]))
        elif y < 3 or y > h - 4:
            d.point((x, y + dy), fill=hexc(pal[1]))
    return img, m


def cloth_bar(img, x, y, w, h, ratio, key):
    """pasek: surowy len, wypełnienie = płótno farbowane roślinami, przyszyte ściegiem"""
    p, m = linen(w, h, seed=x + y, torn=False)
    img.alpha_composite(p, (x, y))
    fw = int(w * ratio)
    if fw > 2:
        cols = DYE[key]
        yy, xx = np.mgrid[0:h, 0:fw]
        weave = ((xx % 2) ^ (yy % 2)) * 0.5 + ((yy % 3) == 0) * 0.4
        n = noise(fw, h, cell=10, seed=x, octaves=1) * 0.6 + weave * 0.5
        dyed = quant(n / max(1e-6, n.max()), cols[::-1], cuts=[0.35, 0.7])
        img.alpha_composite(dyed, (x, y))
        # postrzępiony koniec
        d = ImageDraw.Draw(img)
        for k in range(0, h, 2):
            d.point((x + fw, y + k), fill=hexc(cols[0]))
    d = ImageDraw.Draw(img)
    d.rectangle((x - 1, y - 1, x + w, y + h), outline=hexc("#2a1a0e"))
    for k in range(x + 2, x + w - 2, 6):
        d.line((k, y + 1, k + 2, y + 1), fill=hexc(DTHREAD))
        d.line((k, y + h - 2, k + 2, y + h - 2), fill=hexc(DTHREAD))


def rivet(img, x, y):
    d = ImageDraw.Draw(img)
    d.ellipse((x, y, x + 5, y + 5), fill=hexc(BRASS[2]), outline=hexc(BRASS[0]))
    d.point((x + 2, y + 1), fill=hexc(BRASS[3])); d.point((x + 1, y + 2), fill=hexc(BRASS[3]))
    d.point((x + 3, y + 4), fill=hexc(BRASS[1]))


def sky_window(img, cx, cy, r, hour):
    d = ImageDraw.Draw(img)
    m = circle_mask(2 * r + 1)
    yy, xx = np.mgrid[0:2 * r + 1, 0:2 * r + 1]
    lay = Image.new("RGBA", (2 * r + 1, 2 * r + 1), (0, 0, 0, 0))
    bands = ["#7fb0d8", "#8fbcdc", "#a2c8e0", "#b8d4e0"]
    for i, c in enumerate(bands):
        paint(lay, m & (yy >= i * r * 0.28) & (yy < (i + 1) * r * 0.28 + 1), c)
    paint(lay, m & (yy >= 4 * r * 0.28), bands[-1])
    # słońce na łuku od wschodu (5) do zachodu (20)
    frac = (hour - 5) / 15
    a = math.radians(180 + 180 * frac)
    sx, sy = r + math.cos(a) * (r - 12), r + 6 + math.sin(a) * (r - 18)
    ld = ImageDraw.Draw(lay)
    ld.ellipse((sx - 7, sy - 7, sx + 7, sy + 7), fill=hexc("#ffe9a0"))
    ld.ellipse((sx - 5, sy - 5, sx + 5, sy + 5), fill=hexc("#ffd050"))
    # chmurka
    ld.ellipse((r - 20, r - 4, r - 4, r + 4), fill=hexc("#eef4f4")); ld.ellipse((r - 12, r - 8, r + 2, r + 2), fill=hexc("#eef4f4"))
    # wzgórza i świerki (sylwetki)
    hill = m & (yy > r + 10 + 4 * np.sin(xx / 7.0))
    paint(lay, hill, "#5e7a46")
    paint(lay, m & (yy > r + 18 + 3 * np.sin(xx / 5.0 + 1)), "#465e34")
    for tx_ in (r - 24, r - 15, r + 18):
        for k in range(10):
            ld.line((tx_ - k // 2, r + 6 + k, tx_ + k // 2, r + 6 + k), fill=hexc("#324a2a"))
    a2 = np.array(lay); a2[~m] = 0; lay = Image.fromarray(a2)
    img.alpha_composite(lay, (cx - r, cy - r))
    # mosiężny pierścień
    d.ellipse((cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3), outline=hexc(BRASS[1]), width=3)
    d.ellipse((cx - r - 4, cy - r - 4, cx + r + 4, cy + r + 4), outline=hexc(BRASS[0]))
    d.arc((cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2), 180, 300, fill=hexc(BRASS[3]))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=hexc("#1a1208"))


def tag(img, x, y, w, h, seed=1, hole="left", tint=None):
    """lniana metka z dziurką i sznurkiem"""
    p, m = linen(w, h, seed=seed, tint=tint)
    soft_shadow(img, m, (x, y), (2, 3), 90, 2)
    img.alpha_composite(p, (x, y))
    d = ImageDraw.Draw(img)
    if hole == "left":
        hx, hy = x + 9, y + h // 2
    else:
        hx, hy = x + w // 2, y + 8
    d.ellipse((hx - 3, hy - 3, hx + 3, hy + 3), fill=hexc(BRASS[1]), outline=hexc(BRASS[0]))
    d.ellipse((hx - 1, hy - 1, hx + 1, hy + 1), fill=hexc("#1a1208"))
    return hx, hy


def hud():
    img = bg_map()
    # ---- skórzana łata: okno nieba, pora, ciężar, paski z płótna
    p, m = leather(262, 236, seed=3)
    soft_shadow(img, m, (8, 6), (3, 4), 120, 3)
    img.alpha_composite(p, (8, 6))
    # łata na łacie (bieda): wyblakły granat
    d = ImageDraw.Draw(img)
    def patch(x, y, w, h, tint, seed):
        pp, pm = linen(w, h, seed=seed, tint=tint)
        img.alpha_composite(pp, (x, y))
        for k in range(x + 2, x + w - 2, 4):
            d.line((k, y + 2, k + 1, y + 2), fill=hexc(THREAD)); d.line((k, y + h - 3, k + 1, y + h - 3), fill=hexc(THREAD))
        for k in range(y + 2, y + h - 2, 4):
            d.line((x + 2, k, x + 2, k + 1), fill=hexc(THREAD)); d.line((x + w - 3, k, x + w - 3, k + 1), fill=hexc(THREAD))
    patch(228, 12, 34, 30, "#1e3a78", 8)
    sky_window(img, 60, 58, 40, D["hand"])
    text(img, (114, 14), D["phase"], FK(28), ONL, shadow=(1, 2, (20, 10, 4, 255)))
    text(img, (116, 50), "dzień 40, lato", FR(18), "#d8c8a4", shadow=(1, 1, (20, 10, 4, 255)))
    put(img, icon(370), (112, 70))
    text(img, (148, 74), "41 / 120", FK(19), ONL, shadow=(1, 1, (20, 10, 4, 255)))
    rows = [("health", icon_bare(84)), ("stamina", icon_bare(82)), ("food", icon(390)), ("water", icon(391))]
    vals = {"health": D["health"], "stamina": D["stamina"], "food": D["food"], "water": D["water"]}
    for i, (k, ic) in enumerate(rows):
        y = 110 + i * 31
        cloth_bar(img, 56, y + 8, 186, 14, vals[k], k)
        put(img, ic, (18, y))
    rivet(img, 14, 12); rivet(img, 260, 12); rivet(img, 14, 230);
    # ---- nazwa miejsca: metka na sznurku
    f = FK(26)
    w_ = tw(D["map"], f) + 50
    x = 640 - w_ // 2
    d.line((640, 0, 640 - w_ // 2 + 9, 30), fill=hexc("#cbb98e")); d.line((640, 0, 640 - w_ // 2 + 9, 31), fill=hexc("#5a4632"))
    hx, hy = tag(img, x, 14, w_, 40, seed=12)
    d.line((640 - 30, 0, hx, hy), fill=hexc("#d8c69a"))
    text(img, (x + 22 + (w_ - 22) // 2, 33), D["map"], f, INK, anchor="mm")
    # ---- mapa na skórze + cel na metce przypiętej szpilką
    p, m = leather(226, 172, seed=9)
    soft_shadow(img, m, (1046, 6), (3, 4), 120, 3)
    img.alpha_composite(p, (1046, 6))
    mm = minimap()
    a = np.array(mm).astype(np.float32)
    g = a[..., :3].mean(axis=2, keepdims=True)
    a[..., :3] = a[..., :3] * 0.55 + g * 0.25 + np.array([60, 40, 20]) * 0.2
    mm = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    img.alpha_composite(mm, (1062, 18))
    d.rectangle((1061, 17, 1062 + mm.width, 18 + mm.height), outline=hexc("#160d06"))
    # sznurowanie w rogach
    for (cx, cy) in ((1062, 18), (1062 + mm.width, 18), (1062, 18 + mm.height), (1062 + mm.width, 18 + mm.height)):
        d.line((cx - 5, cy - 5, cx + 5, cy + 5), fill=hexc(THREAD)); d.line((cx - 5, cy + 5, cx + 5, cy - 5), fill=hexc(THREAD))
    d.polygon([(1062 + 134, 18 + 39), (1062 + 140, 18 + 45), (1062 + 134, 18 + 51), (1062 + 128, 18 + 45)], fill=hexc("#c8402a"), outline=hexc("#2a1008"))
    p, m = linen(220, 98, seed=15)
    soft_shadow(img, m, (1050, 186), (3, 4), 100, 3)
    img.alpha_composite(p, (1050, 186))
    # szpilka
    d.line((1060, 182, 1084, 198), fill=hexc("#b8bcc0")); d.line((1061, 182, 1085, 198), fill=hexc("#6a6e72"))
    d.ellipse((1055, 177, 1063, 185), fill=hexc("#a8443a"), outline=hexc("#401410"))
    text(img, (1088, 188), "Cel:", FK(20), "#8a3028")
    put(img, icon(D["goal_icon"]), (1128, 182))
    text(img, (1062, 210), D["goal"], FK(18), INK)
    for k, ln in enumerate(wrap(D["goal_sub"], FR(15), 198)[:2]):
        text(img, (1062, 236 + k * 18), ln, FR(15), INK2)
    # ---- dymek nad bohaterem: metka
    f = FK(18)
    w_ = tw(D["popup"], f) + 60
    x = D["hero"][0] - w_ // 2; y = D["hero"][1] - 80
    tag(img, x, y, w_, 34, seed=21)
    put(img, icon(391), (x + 18, y + 1))
    text(img, (x + 52, y + 5), D["popup"], f, INK)
    # ---- zdobycze: metki
    for i, (ic, s) in enumerate(D["gains"]):
        f = FK(20)
        w_ = tw(s, f) + 72
        y = 554 + i * 40
        x = 1270 - w_
        tag(img, x, y, w_, 34, seed=30 + i)
        put(img, icon(ic), (x + 20, y + 1))
        text(img, (x + 56, y + 3), s, f, INK)
    # ---- doświadczenie: rzemień ze sprzączką, przeszyty do 72%
    p, m = leather(262, 26, seed=40, r=4, stitch=False, tone=1)
    img.alpha_composite(p, (1010, 688))
    d.rectangle((1012, 686, 1040, 714), outline=hexc(BRASS[2]), width=3)
    d.rectangle((1011, 685, 1041, 715), outline=hexc(BRASS[0]))
    d.line((1026, 688, 1026, 712), fill=hexc(BRASS[3]), width=2)
    text(img, (1050, 690), "Poz. 6", FK(16), "#e8d4a8", shadow=(1, 1, (20, 10, 4, 255)))
    x0, x1 = 1104, 1262
    for k in range(x0, x1, 7):
        d.ellipse((k, 699, k + 2, 701), fill=hexc("#1a0e06"))
        if (k - x0) / (x1 - x0) <= D["xp"]:
            d.line((k + 2, 700, k + 6, 700), fill=hexc("#f0c060"))
    return img


def window():
    img = bg_menu(0.5, 2.0, (20, 10, 4))
    X, Y, PW, PH = 120, 70, 1040, 580
    p, m = leather(PW, PH, seed=50, r=14)
    soft_shadow(img, m, (X, Y), (6, 10), 160, 8)
    img.alpha_composite(p, (X, Y))
    d = ImageDraw.Draw(img)
    # klapa torby u góry
    fm = round_mask(PW - 40, 70, 10)
    fp, _ = leather(PW - 40, 70, seed=51, r=10, mask=fm, tone=-1)
    img.alpha_composite(fp, (X + 20, Y + 10))
    text(img, (X + 50, Y + 20), "Plecak", FK(38), ONL, shadow=(2, 2, (20, 10, 4, 255)))
    # sprzączka
    bx = X + PW // 2 - 20
    sp, sm = leather(40, 70, seed=52, r=3, tone=-1, stitch=False)
    img.alpha_composite(sp, (bx, Y + 44))
    for k in range(Y + 48, Y + 112, 5):
        d.line((bx + 4, k, bx + 4, k + 2), fill=hexc(THREAD)); d.line((bx + 35, k, bx + 35, k + 2), fill=hexc(THREAD))
    d.rounded_rectangle((bx - 6, Y + 60, bx + 45, Y + 92), radius=5, outline=hexc(BRASS[0]), width=1)
    d.rounded_rectangle((bx - 5, Y + 61, bx + 44, Y + 91), radius=4, outline=hexc(BRASS[2]), width=3)
    d.line((bx - 3, Y + 62, bx + 40, Y + 62), fill=hexc(BRASS[3]))
    d.line((bx + 19, Y + 64, bx + 19, Y + 90), fill=hexc(BRASS[1]), width=3)
    d.line((bx + 18, Y + 64, bx + 18, Y + 88), fill=hexc(BRASS[3]))
    d.ellipse((bx + 16, Y + 100, bx + 22, Y + 106), fill=hexc("#140c06"))
    # ciężar na pasku
    text(img, (X + PW - 338, Y + 30), "Obciążenie", FR(18), "#d8c8a4", shadow=(1, 1, (20, 10, 4, 255)))
    cloth_bar(img, X + PW - 238, Y + 38, 150, 12, 41 / 120, "food")
    text(img, (X + PW - 72, Y + 26), "41/120", FK(18), ONL, anchor="ra" if False else "la", shadow=(1, 1, (20, 10, 4, 255)))
    # zakładki ze skóry
    tabs = ["Przedmioty", "Jedzenie", "Narzędzia"]
    tx = X + 40
    for i, t_ in enumerate(tabs):
        f = FK(19)
        w_ = tw(t_, f) + 40
        act = i == 0
        tp, tm = leather(w_, 36, seed=60 + i, r=6, tone=1 if act else 0)
        img.alpha_composite(tp, (tx, Y + 98))
        if act:
            rivet(img, tx + 6, Y + 113)
        text(img, (tx + w_ // 2 + (5 if act else 0), Y + 116), t_, f, ONL if act else "#bfa888", anchor="mm")
        tx += w_ + 8
    # podszewka: lista
    LX, LY, LW, LH = X + 30, Y + 138, 560, 380
    lp, lm = linen(LW, LH, seed=70, torn=False)
    img.alpha_composite(lp, (LX, LY))
    stitch_edge(img.crop((LX, LY, LX + LW, LY + LH)), lm, 1, DTHREAD) if False else None
    for k in range(LX + 3, LX + LW - 3, 7):
        d.line((k, LY + 3, k + 3, LY + 3), fill=hexc(DTHREAD)); d.line((k, LY + LH - 4, k + 3, LY + LH - 4), fill=hexc(DTHREAD))
    for k in range(LY + 3, LY + LH - 3, 7):
        d.line((LX + 3, k, LX + 3, k + 3), fill=hexc(DTHREAD)); d.line((LX + LW - 4, k, LX + LW - 4, k + 3), fill=hexc(DTHREAD))
    sel = 9
    for i, (iid, name, ic, n) in enumerate(BAG[:10]):
        y = LY + 14 + i * 36
        if i == sel:
            hp_, hm = linen(LW - 44, 34, seed=71, torn=False, tint="#fff0c8")
            img.alpha_composite(hp_, (LX + 34, y - 3))
            d.rectangle((LX + 34, y - 3, LX + LW - 11, y + 30), outline=hexc("#8a3028"))
            for k in range(LX + 38, LX + LW - 14, 6):
                d.line((k, y + 27, k + 3, y + 27), fill=hexc("#a8443a"))
            # igła z czerwoną nitką wskazuje wiersz
            d.line((LX + 8, y + 13, LX + 32, y + 13), fill=hexc("#dfe3e6")); d.line((LX + 8, y + 14, LX + 32, y + 14), fill=hexc("#7a7e82"))
            d.line((LX + 32, y + 13, LX + 34, y + 13), fill=hexc("#7a7e82"))
            d.rectangle((LX + 10, y + 13, LX + 12, y + 13), fill=hexc("#1a1208"))
            d.line((LX + 11, y + 14, LX + 6, y + 22, LX + 14, y + 28), fill=hexc("#b8443a"))
        put(img, icon(ic), (LX + 46, y - 1))
        text(img, (LX + 86, y + 1), name, FK(20) if i == sel else FR(20), INK)
        text(img, (LX + LW - 40, y + 1), "×" + str(n), FK(20), INK2, anchor="ra")
    # metka opisu przyszyta do skóry (prawa strona)
    DX, DY, DW, DH = X + 620, Y + 138, 390, 380
    dp, dm = linen(DW, DH, seed=80, tint="#e8dcc0")
    soft_shadow(img, dm, (DX, DY), (3, 4), 110, 3)
    img.alpha_composite(dp, (DX, DY))
    for k in range(DX + 4, DX + DW - 4, 7):
        d.line((k, DY + 4, k + 3, DY + 4), fill=hexc("#8a3028"))
    d.rectangle((DX + 20, DY + 22, DX + 20 + 75, DY + 22 + 75), fill=hexc(LIN[1]), outline=hexc("#5a4632"))
    put(img, icon(358, 2), (DX + 26, DY + 28))
    text(img, (DX + 110, DY + 20), "Jagody", FK(34), INK)
    text(img, (DX + 112, DY + 64), "Masz: 6 · waga: 1", FR(18), INK2)
    y = DY + 116
    d.line((DX + 20, y - 8, DX + DW - 20, y - 8), fill=hexc("#7a6648"))
    for ln in wrap("Dzikie jagody. Słodkie i sycące, ale na chwilę. Dobre na drogę, gdy nie ma ognia.", FR(19), DW - 44):
        text(img, (DX + 22, y), ln, FR(19), INK); y += 26
    y += 10
    text(img, (DX + 22, y), "Najstarsze zepsują się za 3 dni.", FK(18), "#5e7a2a"); y += 34
    text(img, (DX + 22, y), "Zjedz: +8 sił, sytość +8, woda +10", FR(18), INK2); y += 40
    for k, (key, lab) in enumerate((("Enter", "Zjedz"), ("X", "Wyrzuć"))):
        bx = DX + 22 + k * 170
        bp, bm = leather(150, 34, seed=90 + k, r=6, tone=1 if k == 0 else 0)
        img.alpha_composite(bp, (bx, y))
        text(img, (bx + 75, y + 17), key + ": " + lab, FK(18), ONL if k == 0 else "#bfa888", anchor="mm")
    # stopka: metki z klawiszami
    hx = X + 34
    for key, lab in (("↑↓", "wybierz"), ("←→", "zakładka"), ("Enter", "użyj"), ("Esc", "wróć")):
        f = FK(17)
        kw = tw(key, f) + 30
        tag(img, hx, Y + PH - 48, kw, 28, seed=hx)
        text(img, (hx + 18 + (kw - 18) // 2, Y + PH - 34), key, f if key[0].isalpha() else font("AlegreyaSans-Medium.ttf", 18), INK, anchor="mm")
        text(img, (hx + kw + 8, Y + PH - 47), lab, FR(18), "#e8d8b8", shadow=(1, 1, (20, 10, 4, 255)))
        hx += kw + tw(lab, FR(18)) + 26
    text(img, (X + PW - 40, Y + PH - 47), "330 monet", FK(18), "#ecd27a", anchor="ra", shadow=(1, 1, (20, 10, 4, 255)))
    return img


if __name__ == "__main__":
    print(save(hud(), "pomysl_5_torba_hud.png"))
    print(save(window(), "pomysl_5_torba_okno.png"))
