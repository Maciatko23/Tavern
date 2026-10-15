# Pomysł 2 (runda 2): ZIELARNIA - szkło, korek, etykiety. Półka z czterema flaszkami (lewy dół), mosiężny zegarek
# kieszonkowy z okienkiem słońca, kompas żeglarski w drewnianej puszce, papierowe etykiety na sznurku, okna jak szafka
# zielarki: dziennik = kartoteka, plecak = szufladki z etykietami, opcje = rurki z płynem i korki.
import math
import numpy as np
from PIL import Image, ImageDraw
from common2 import *

WOOD = ["#2e1c10", "#3e2716", "#4e321c", "#5e3d22", "#704a2a", "#8a5e36"]
FELT = ["#18231b", "#1c281f", "#1f2c22"]
PAPER = ["#d9cba6", "#e4d8b6", "#ece2c4", "#f3ebd2"]
INK = "#2e2216"; INK2 = "#6a5640"; CREAM = "#f0e6cc"; MUT = "#b4ab94"
BRASS = ["#4a3812", "#7a5e22", "#b08a3a", "#d8b45a", "#f2dc8a"]
LIQ = {"health": ("#7a1420", "#b02a36", "#e0606a"), "stamina": ("#2a5a1a", "#4a8a2a", "#9acc6a"),
       "food": ("#8a5a10", "#c8861e", "#f0c060"), "water": ("#1a4a8a", "#3a7ac8", "#9acff0")}
FG = lambda s, w=600: font("EBGaramond.ttf", s, w)
FCS = lambda s: font("CormorantSC-Bold.ttf", s)


def t_(img, xy, s, f, fill=CREAM, anchor="la", stroke=2):
    text(img, xy, s, f, fill, anchor=anchor, stroke=stroke, sfill=(10, 8, 4, 220))


def wood(w, h, seed=1, tone=0, r=4, mask=None):
    m = mask if mask is not None else round_mask(w, h, r)
    n = noise(w, h, cell=10, seed=seed, octaves=3, aniso=(6, 0.6))
    pal = WOOD[1 + tone:5 + tone]
    tex = quant(n, pal, cuts=[0.3, 0.55, 0.78])
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint_tex(img, m, tex)
    yy = np.mgrid[0:h, 0:w][0]
    paint(img, ring(erode(m, 1), 1) & (yy < h / 2), WOOD[5])
    paint(img, ring(erode(m, 1), 1) & (yy >= h / 2), WOOD[0])
    paint(img, ring(m, 1), "#120a04")
    return img, m


def felt(w, h, seed=1):
    n = noise(w, h, cell=3, seed=seed, octaves=1) * 0.5 + noise(w, h, cell=30, seed=seed + 1, octaves=2) * 0.5
    return quant(n, FELT, cuts=[0.4, 0.62])


def label(img, x, y, w, h, seed=1, hole=True, shadow=True):
    m = cut_mask(w, h, 5)
    if shadow:
        soft_shadow(img, m, (x, y), (2, 3), 100, 2)
    n = noise(w, h, cell=12, seed=seed, octaves=2)
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint_tex(lay, m, quant(n, PAPER, cuts=[0.15, 0.45, 0.8]))
    paint(lay, ring(m, 1), "#8a7650")
    img.alpha_composite(lay, (x, y))
    if hole:
        d = ImageDraw.Draw(img)
        d.ellipse((x + 5, y + h // 2 - 3, x + 11, y + h // 2 + 3), fill=hexc("#f7f1de"), outline=hexc("#8a7650"))
        d.ellipse((x + 7, y + h // 2 - 1, x + 9, y + h // 2 + 1), fill=hexc("#3a2a1a"))
    return m


def twine(img, pts):
    d = ImageDraw.Draw(img)
    d.line(pts, fill=hexc("#6a5030"), width=2)
    d.line([(p[0], p[1] - 1) for p in pts], fill=hexc("#c8aa78"), width=1)


def brass_ring(img, cx, cy, r, w=5):
    d = ImageDraw.Draw(img)
    d.ellipse((cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1), fill=hexc("#000000"))
    for k, c in enumerate((BRASS[1], BRASS[2], BRASS[3], BRASS[2])):
        d.ellipse((cx - r + k, cy - r + k, cx + r - k, cy + r - k), outline=hexc(c), width=1)
    d.arc((cx - r + 1, cy - r + 1, cx + r - 1, cy + r - 1), 200, 290, fill=hexc(BRASS[4]), width=2)
    d.ellipse((cx - r + w, cy - r + w, cx + r - w, cy + r - w), outline=hexc(BRASS[0]))


def pocket_watch(img, cx, cy, r, hour):
    d = ImageDraw.Draw(img)
    m = circle_mask(2 * r + 9)
    soft_shadow(img, m, (cx - r - 4, cy - r - 4), (2, 3), 150, 3)
    # ucho i koronka
    d.ellipse((cx - 7, cy - r - 13, cx + 7, cy - r + 1), outline=hexc(BRASS[2]), width=3)
    d.rectangle((cx - 4, cy - r - 4, cx + 4, cy - r + 2), fill=hexc(BRASS[3]), outline=hexc("#000000"))
    brass_ring(img, cx, cy, r + 4, 6)
    d.ellipse((cx - r + 2, cy - r + 2, cx + r - 2, cy + r - 2), fill=hexc("#f3ebd2"), outline=hexc(BRASS[1]))
    # okienko słońca (u góry tarczy): pół-koło nieba
    wx, wy, wr = cx, cy - r * 0.42, r * 0.36
    d.pieslice((wx - wr, wy - wr, wx + wr, wy + wr), 180, 360, fill=hexc("#8cc0e8"), outline=hexc(INK2))
    a = math.radians(180 + 180 * (hour - 5) / 15)
    sx, sy = wx + math.cos(a) * wr * 0.7, wy + math.sin(a) * wr * 0.7
    d.ellipse((sx - 3, sy - 3, sx + 3, sy + 3), fill=hexc("#f2b830"), outline=hexc("#8a5a10"))
    d.line((wx - wr, wy, wx + wr, wy), fill=hexc(INK2))
    for k in range(12):
        ak = math.radians(k * 30)
        ln = 4 if k % 3 == 0 else 2
        x0, y0 = cx + math.sin(ak) * (r - 3), cy - math.cos(ak) * (r - 3)
        x1, y1 = cx + math.sin(ak) * (r - 3 - ln), cy - math.cos(ak) * (r - 3 - ln)
        d.line((x0, y0, x1, y1), fill=hexc(INK), width=2 if k % 3 == 0 else 1)
    (hx, hy), (mx, my) = hand_pts(cx, cy, hour, r * 0.5, r * 0.78)
    d.line((cx, cy, hx, hy), fill=hexc(INK), width=3)
    d.line((cx, cy, mx, my), fill=hexc(INK), width=1)
    d.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=hexc(BRASS[3]), outline=hexc(INK))


def ship_compass(img):
    c = G["compass"]; cx, cy, r = c["cx"], c["cy"] + 2, 46
    d = ImageDraw.Draw(img)
    m = circle_mask(2 * r + 13)
    soft_shadow(img, m, (cx - r - 6, cy - r - 6), (3, 4), 160, 4)
    wm = circle_mask(2 * r + 13)
    wp, _ = wood(2 * r + 13, 2 * r + 13, seed=5, mask=wm)
    img.alpha_composite(wp, (cx - r - 6, cy - r - 6))
    brass_ring(img, cx, cy, r, 4)
    d.ellipse((cx - r + 4, cy - r + 4, cx + r - 4, cy + r - 4), fill=hexc("#ece2c4"))
    # róża wiatrów (atrament)
    for k in range(8):
        a = math.radians(k * 45)
        L = r - 18 if k % 2 == 0 else r - 26
        tip = (cx + math.sin(a) * L, cy - math.cos(a) * L)
        l1 = (cx + math.sin(a + 0.5) * 6, cy - math.cos(a + 0.5) * 6)
        l2 = (cx + math.sin(a - 0.5) * 6, cy - math.cos(a - 0.5) * 6)
        d.polygon([tip, l1, (cx, cy)], fill=hexc("#8a7650" if k % 2 else INK2))
        d.polygon([tip, l2, (cx, cy)], fill=hexc("#c8b88a" if k % 2 else "#a89068"))
    d.ellipse((cx - r + 13, cy - r + 13, cx + r - 13, cy + r - 13), outline=hexc("#a89068"))
    for lab, deg in (("N", 0), ("E", 90), ("S", 180), ("W", 270)):
        x, y = compass_dir(cx, cy, r - 11, deg)
        text(img, (x, y), lab, FG(15, 800), "#a01c1c" if lab == "N" else INK, anchor="mm")
    # igła: czerwony grot w stronę celu, czarny ogon
    ang = c["angle"]
    tip = compass_dir(cx, cy, r - 6, ang); tail = compass_dir(cx, cy, r - 22, ang + 180)
    s1 = compass_dir(cx, cy, 5, ang + 90); s2 = compass_dir(cx, cy, 5, ang - 90)
    d.polygon([tip, s1, (cx, cy), s2], fill=hexc("#c02020"), outline=hexc("#300808"))
    d.polygon([tail, s1, (cx, cy), s2], fill=hexc("#2a2a2a"), outline=hexc("#000000"))
    d.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=hexc(BRASS[3]), outline=hexc("#000000"))
    # szkiełko: odblask
    with Over(img) as o:
        o.arc((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), 200, 250, fill=(255, 255, 255, 120), width=3)
    # etykieta na sznurku + obciążenie
    f = FG(17)
    lab = c["label"]
    w_ = tw(lab, f) + 30
    lx, ly = 1272 - w_, cy + r + 14
    twine(img, [(cx - 20, cy + r + 4), (lx + 8, ly + 12)])
    label(img, lx, ly, w_, 28, seed=9)
    text(img, (lx + 18 + (w_ - 18) // 2, ly + 14), lab, f, INK, anchor="mm")
    put(img, icon(370), (1238, ly + 32))
    t_(img, (1234, ly + 39), G["load"], FG(18), CREAM, anchor="ra")


def flask(kind, w, h, ratio, key):
    """flaszka: kształt wg rodzaju, szkło z odblaskiem, płyn do poziomu, korek"""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:h, 0:w]
    cx = (w - 1) / 2
    neck_w, neck_h = w * 0.3, h * 0.22
    if kind == "round":       # okrągła kolba
        r = w * 0.48; cy = h - r - 1
        body = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r * r
    elif kind == "tall":      # wysoka butelka z ramionami
        body = (np.abs(xx - cx) <= w * 0.42) & (yy >= h * 0.36) & (yy <= h - 2)
        sh = (yy >= h * 0.24) & (yy < h * 0.36) & (np.abs(xx - cx) <= w * 0.16 + (yy - h * 0.24) * (w * 0.26) / (h * 0.12))
        body |= sh
    elif kind == "jar":       # przysadzisty słój
        body = (np.abs(xx - cx) <= w * 0.47) & (yy >= h * 0.34) & (yy <= h - 2)
        neck_w = w * 0.6; neck_h = h * 0.12
    else:                     # karafka (gruszka)
        r = w * 0.46; cy = h - r - 1
        body = (((xx - cx) ** 2 + (yy - cy) ** 2) <= r * r) | ((np.abs(xx - cx) <= w * 0.14 + np.clip(yy - h * 0.28, 0, None) * 0.5) & (yy >= h * 0.28) & (yy < cy))
    neck = (np.abs(xx - cx) <= neck_w / 2) & (yy >= h * 0.1) & (yy < h * 0.4)
    shape = body | neck
    inner = erode(shape, 2)
    top = np.nonzero(body.any(axis=1))[0][0]
    bot = h - 3
    level = int(bot - (bot - top) * ratio)
    dk, md, lt = LIQ[key]
    a = np.zeros((h, w, 4), np.uint8)
    a[inner] = hexc("#c8dcd4", 70)
    liq = inner & body & (yy >= level)
    a[liq] = hexc(md)
    a[liq & (xx > cx + w * 0.15)] = hexc(dk)
    a[inner & body & (yy == level)] = hexc(lt)
    # odblask szkła
    hl = inner & (xx >= cx - w * 0.32) & (xx <= cx - w * 0.24) & (yy > top + 4) & (yy < h - 8)
    a[hl] = hexc("#ffffff", 170)
    a[ring(shape, 2) & ~ring(shape, 1)] = hexc("#9ab8ae", 230)
    a[ring(shape, 1)] = hexc("#0e1410")
    out = Image.fromarray(a, "RGBA")
    d = ImageDraw.Draw(out)
    # korek
    cw = int(neck_w) + 4
    d.rectangle((cx - cw / 2, h * 0.02, cx + cw / 2, h * 0.14), fill=hexc("#c89a60"), outline=hexc("#3a2410"))
    d.line((cx - cw / 2 + 2, h * 0.05, cx + cw / 2 - 2, h * 0.05), fill=hexc("#e0bc84"))
    return out


def shelf_needs(img):
    sx, sy, sw = 10, 664, 236
    kinds = ["round", "tall", "jar", "carafe"]
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        fw, fh = 44, 78
        fx = sx + 12 + i * 56
        fl = flask(kinds[i], fw, fh, v, k)
        put(img, fl, (fx, sy - fh + 2))
    wp, wm = wood(sw, 14, seed=3, r=2, tone=1)
    soft_shadow(img, wm, (sx, sy), (2, 4), 150, 3)
    img.alpha_composite(wp, (sx, sy))
    d = ImageDraw.Draw(img)
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        fx = sx + 12 + i * 56 + 22
        twine(img, [(fx, sy + 12), (fx, sy + 18)])
        label(img, fx - 19, sy + 17, 38, 34, seed=40 + i, hole=False)
        put(img, need_icon(k), (fx - 16, sy + 18))
        if k == "water":
            text(img, (fx + 20, sy - 82), "!", FG(26, 800), "#e04040", stroke=2, sfill=(0, 0, 0, 220))
        d.rectangle((sx + 6 + i * 56, sy + 2, sx + 7 + i * 56, sy + 3), fill=hexc("#1a1008")) if False else None


def hud():
    img = bg2()
    pocket_watch(img, 50, 58, 34, G["hour"])
    f = FG(20, 700)
    w_ = tw(G["goal"], f) + 66
    twine(img, [(80, 46), (104, 54)])
    label(img, 100, 38, w_, 40, seed=7)
    put(img, icon(G["goal_icon"]), (116, 42))
    text(img, (154, 58), G["goal"], f, INK, anchor="lm")
    # nazwa miejsca: mosiężna tabliczka na deseczce
    f = FCS(28)
    w_ = tw(G["map"], f) + 50
    wp, wm = wood(w_ + 16, 50, seed=12, r=5)
    soft_shadow(img, wm, (640 - w_ // 2 - 8, 6), (2, 4), 140, 3)
    img.alpha_composite(wp, (640 - w_ // 2 - 8, 6))
    d = ImageDraw.Draw(img)
    d.rectangle((640 - w_ // 2, 13, 640 + w_ // 2, 49), fill=hexc(BRASS[2]), outline=hexc(BRASS[0]))
    d.line((640 - w_ // 2 + 1, 14, 640 + w_ // 2 - 1, 14), fill=hexc(BRASS[4]))
    for sxx in (640 - w_ // 2 + 5, 640 + w_ // 2 - 7):
        d.ellipse((sxx, 28, sxx + 3, 31), fill=hexc(BRASS[0]))
    text(img, (640, 31), G["map"], f, "#2a1c08", anchor="mm")
    ship_compass(img)
    shelf_needs(img)
    # dymek: etykieta
    f = FG(18, 700)
    w_ = tw(G["popup"], f) + 62
    x = G["hero"][0] - w_ // 2; y = G["hero"][1] - 80
    label(img, x, y, w_, 34, seed=13)
    put(img, icon(391), (x + 18, y + 1))
    text(img, (x + 54, y + 17), G["popup"], f, INK, anchor="lm")
    for i, (ic, s) in enumerate(G["gains"]):
        f = FG(19, 700)
        w_ = tw(s, f) + 70
        y = 594 + i * 40
        label(img, 1270 - w_, y, w_, 34, seed=20 + i)
        put(img, icon(ic), (1270 - w_ + 18, y + 1))
        text(img, (1270 - w_ + 56, y + 17), s, f, INK, anchor="lm")
    return img


# ------------------------------------------------------------------ okna: szafka zielarki
def cabinet(img, title, X=110, Y=56, PW=1060, PH=604):
    wp, wm = wood(PW, PH, seed=50, r=10)
    soft_shadow(img, wm, (X, Y), (6, 10), 170, 8)
    img.alpha_composite(wp, (X, Y))
    fe = felt(PW - 36, PH - 96, seed=3)
    m = rect_mask(PW - 36, PH - 96)
    lay = Image.new("RGBA", fe.size, (0, 0, 0, 0)); paint_tex(lay, m, fe)
    paint(lay, ring(m, 1), "#0a0e0a"); paint(lay, ring(erode(m, 1), 1), "#101810")
    img.alpha_composite(lay, (X + 18, Y + 70))
    # mosiężna tabliczka z tytułem
    f = FCS(34)
    w_ = tw(title, f) + 60
    d = ImageDraw.Draw(img)
    d.rectangle((X + 24, Y + 14, X + 24 + w_, Y + 58), fill=hexc(BRASS[2]), outline=hexc(BRASS[0]))
    d.line((X + 25, Y + 15, X + 23 + w_, Y + 15), fill=hexc(BRASS[4]))
    d.line((X + 25, Y + 57, X + 23 + w_, Y + 57), fill=hexc(BRASS[1]))
    for sxx in (X + 29, X + 17 + w_):
        d.ellipse((sxx, Y + 33, sxx + 4, Y + 37), fill=hexc(BRASS[0]))
    text(img, (X + 24 + w_ // 2, Y + 36), title, f, "#2a1c08", anchor="mm")
    return X, Y, PW, PH


def keys(img, x, y, pairs):
    f = FG(17, 700)
    for k, lab in pairs:
        kw = tw(k, f) + 16 if k[0].isalnum() else 34
        label(img, x, y, kw, 24, seed=x, hole=False, shadow=False)
        text(img, (x + kw // 2, y + 12), k, f if k[0].isalnum() else font("AlegreyaSans-Medium.ttf", 17), INK, anchor="mm")
        t_(img, (x + kw + 6, y + 1), lab, FG(17), MUT)
        x += kw + tw(lab, FG(17)) + 24


def journal():
    img = bg_menu2(0.55, 2.0, (10, 6, 2))
    X, Y, PW, PH = cabinet(img, "Dziennik")
    t_(img, (X + PW - 30, Y + 30), "Dzień 40 · lato · 11:01", FG(18), MUT, anchor="ra")
    # przekładki kartoteki (zakładki wystają w górę)
    tx = X + 34
    f = FG(16, 700)
    for i, n in enumerate(JTABS):
        w_ = tw(n, f) + 22
        act = i == 0
        m = cut_mask(w_, 28, 6)
        m[20:, :] = True
        lay = Image.new("RGBA", (w_, 28), (0, 0, 0, 0))
        paint(lay, m, "#f3ebd2" if act else ["#c8b88a", "#b8c4a0", "#c4b0a0", "#a8b8c0"][i % 4])
        paint(lay, ring(m, 1), "#5a4a30")
        img.alpha_composite(lay, (tx, Y + 82 + (0 if act else 4)))
        text(img, (tx + w_ // 2, Y + 96 + (0 if act else 4)), n, f, INK, anchor="mm")
        tx += w_ + 4
    # karty celów (lista) na kartotece
    lx, ly = X + 34, Y + 110
    label(img, lx, ly, 470, 410, seed=60, hole=False)
    d = ImageDraw.Draw(img)
    for k in range(ly + 46, ly + 400, 40):
        d.line((lx + 8, k, lx + 462, k), fill=hexc("#b8c8d8"))
    d.line((lx + 40, ly + 4, lx + 40, ly + 404), fill=hexc("#d89a9a"))
    for i, (ic, name, done) in enumerate(GOALS):
        y = ly + 12 + i * 40
        if i == 0:
            with Over(img) as o:
                o.rectangle((lx + 4, y - 2, lx + 465, y + 34), fill=hexc("#f2c45a", 110))
        d.rectangle((lx + 14, y + 10, lx + 28, y + 24), outline=hexc(INK2))
        if done:
            d.line((lx + 16, y + 17, lx + 20, y + 22, lx + 30, y + 6), fill=hexc("#2a7a2a"), width=2)
        put(img, icon(ic), (lx + 48, y + 1))
        text(img, (lx + 88, y + 6), name, FG(19, 700 if i == 0 else 500), INK2 if done else INK)
    # duża karta celu
    rx, ry = X + 530, Y + 110
    label(img, rx, ry, 490, 410, seed=61, hole=False)
    put(img, icon(337, 1.5), (rx + 26, ry + 20))
    text(img, (rx + 86, ry + 18), G["goal"], FG(28, 700), INK)
    text(img, (rx + 88, ry + 54), "Rozdział I · Dług dziadka", FG(17, 500), INK2)
    d.line((rx + 22, ry + 86, rx + 468, ry + 86), fill=hexc("#8a7650"))
    y = ry + 98
    for ln in wrapf("Borgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy. Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim.", FG(19, 500), 440):
        text(img, (rx + 24, y), ln, FG(19, 500), INK); y += 26
    y += 12
    text(img, (rx + 24, y), "Skąd wziąć", FCS(24), "#7a2a18"); y += 34
    put(img, icon(353), (rx + 22, y - 6)); text(img, (rx + 62, y), "Browar: Warz piwo", FG(18, 600), INK); y += 40
    text(img, (rx + 24, y), "Kompas: Tawerna · 151 kroków", FG(17, 500), INK2)
    # pieczątka „przypięty”
    with Over(img) as o:
        o.ellipse((rx + 370, ry + 300, rx + 466, ry + 396), outline=hexc("#a01c1c", 170), width=3)
    text(img, (rx + 418, ry + 348), "ŚLEDZONY", FCS(16), "#a01c1c", anchor="mm", alpha=0.75)
    keys(img, X + 34, Y + PH - 40, [("←→", "przekładka"), ("↑↓", "karta"), ("Enter", "śledź"), ("Esc", "wróć")])
    t_(img, (X + PW - 30, Y + PH - 38), "Wykonano 41 z 77 celów", FG(17, 700), BRASS[3], anchor="ra")
    return img


def bag():
    img = bg_menu2(0.55, 2.0, (10, 6, 2))
    X, Y, PW, PH = cabinet(img, "Plecak")
    t_(img, (X + PW - 30, Y + 30), "Obciążenie 41 / 120", FG(18), MUT, anchor="ra")
    # szafka z szufladkami 6 x 4
    gx, gy, cw, ch = X + 34, Y + 90, 98, 100
    sel = 9
    d = ImageDraw.Draw(img)
    for i in range(24):
        c, r = i % 6, i // 6
        x, y = gx + c * (cw + 4), gy + r * (ch + 4)
        out = 6 if i == sel else 0
        wp, wm = wood(cw, ch, seed=70 + i, r=2, tone=1 if i == sel else 0)
        if i == sel:
            soft_shadow(img, wm, (x - 3, y - out), (4, 8), 170, 4)
        img.alpha_composite(wp, (x - (3 if i == sel else 0), y - out))
        bx = x - (3 if i == sel else 0); by = y - out
        if i < len(BAG):
            _, name, ic, n = BAG[i]
            label(img, bx + 14, by + 10, cw - 28, 56, seed=80 + i, hole=False, shadow=False)
            put(img, icon(ic), (bx + cw // 2 - 16, by + 12))
            text(img, (bx + cw // 2, by + 54), "×" + str(n), FG(16, 700), INK, anchor="mm")
        # mosiężny uchwyt
        d.rounded_rectangle((bx + cw // 2 - 14, by + ch - 24, bx + cw // 2 + 14, by + ch - 14), radius=4, outline=hexc(BRASS[3]), width=2)
        d.rectangle((bx + cw // 2 - 16, by + ch - 21, bx + cw // 2 - 13, by + ch - 17), fill=hexc(BRASS[1]))
        d.rectangle((bx + cw // 2 + 13, by + ch - 21, bx + cw // 2 + 16, by + ch - 17), fill=hexc(BRASS[1]))
    # opis na dużej etykiecie
    rx, ry = gx + 6 * (cw + 4) + 14, Y + 90
    label(img, rx, ry, X + PW - 34 - rx, 412, seed=90, hole=False)
    put(img, icon(358, 2), (rx + 22, ry + 16))
    text(img, (rx + 96, ry + 18), "Jagody", FG(32, 700), INK)
    text(img, (rx + 98, ry + 58), "Masz: 6 · waga: 1", FG(17, 500), INK2)
    y = ry + 100
    for ln in wrapf("Dzikie jagody. Słodkie i sycące, ale na chwilę. Dobre na drogę, gdy nie ma ognia.", FG(18, 500), X + PW - 34 - rx - 40):
        text(img, (rx + 20, y), ln, FG(18, 500), INK); y += 25
    y += 10
    text(img, (rx + 20, y), "Najstarsze zepsują się za 3 dni.", FG(17, 700), "#2a6a1a"); y += 30
    text(img, (rx + 20, y), "Zjedz: kondycja +8,", FG(17, 500), INK2); y += 24
    text(img, (rx + 20, y), "sytość +8, woda +10", FG(17, 500), INK2); y += 40
    d.rectangle((rx + 20, y, rx + 150, y + 32), fill=hexc(BRASS[2]), outline=hexc(BRASS[0]))
    text(img, (rx + 85, y + 16), "Enter: Zjedz", FG(17, 700), "#2a1c08", anchor="mm")
    d.rectangle((rx + 160, y, rx + 260, y + 32), outline=hexc(INK2))
    text(img, (rx + 210, y + 16), "X: Wyrzuć", FG(17, 600), INK2, anchor="mm")
    keys(img, X + 34, Y + PH - 40, [("↑↓←→", "szufladka"), ("Q/E", "półka"), ("Enter", "użyj"), ("Esc", "wróć")])
    t_(img, (X + PW - 30, Y + PH - 38), "15 rzeczy · 330 monet", FG(17, 700), BRASS[3], anchor="ra")
    return img


def options():
    img = bg_menu2(0.55, 2.0, (10, 6, 2))
    X, Y, PW, PH = cabinet(img, "Opcje", X=230, Y=56, PW=820, PH=604)
    d = ImageDraw.Draw(img)
    rows = [("Wygląd", "Zielarnia", None), ("Automatyczny bieg", "nie", False), ("Zapamiętaj komendę", "nie", False),
            ("Dotykowe UI", "tak", True), ("Szybkie wyświetlanie tekstu", "nie", False), ("Prędkość biegu", "1", None),
            ("Głośność muzyki", 0.05, "v"), ("Głośność tła", 0.05, "v"), ("Głośność melodii", 0.05, "v"), ("Głośność dźwięków", 0.05, "v")]
    for i, (lab, val, kind) in enumerate(rows):
        y = Y + 86 + i * 42
        if i == 0:
            with Over(img) as o:
                o.rectangle((X + 30, y - 6, X + PW - 30, y + 36), fill=hexc("#f2c45a", 40), outline=hexc(BRASS[3]))
        t_(img, (X + 46, y + 4), lab, FG(20), CREAM)
        vx = X + 470
        if kind == "v":
            # szklana rurka z płynem
            with Over(img) as o:
                o.rounded_rectangle((vx, y + 8, vx + 260, y + 24), radius=8, fill=(200, 220, 212, 50), outline=hexc("#9ab8ae"))
            d.rounded_rectangle((vx + 2, y + 10, vx + 2 + max(14, int(256 * val)), y + 22), radius=6, fill=hexc(LIQ["food"][1]))
            d.line((vx + 8, y + 11, vx + 250, y + 11), fill=hexc("#ffffff"))
            d.rectangle((vx + 262, y + 6, vx + 274, y + 26), fill=hexc("#c89a60"), outline=hexc("#3a2410"))
            t_(img, (vx + 290, y + 4), "5%", FG(19), CREAM)
        elif kind is True or kind is False:
            # korek: wciśnięty (tak) / wyjęty (nie)
            for k, (txt, on) in enumerate((("tak", True), ("nie", False))):
                bx = vx + k * 120
                act = (kind == on)
                d.rounded_rectangle((bx, y + 2, bx + 104, y + 30), radius=6, fill=hexc("#c89a60" if act else "#3a2a1a"), outline=hexc("#1a1008"))
                text(img, (bx + 52, y + 16), txt, FG(18, 700), "#2a1408" if act else MUT, anchor="mm")
        else:
            label(img, vx, y, 240, 32, seed=100 + i, hole=False, shadow=False)
            text(img, (vx + 120, y + 16), "‹  " + str(val) + "  ›", FG(18, 700), INK, anchor="mm")
    t_(img, (X + 46, Y + PH - 74), "Przywróć ustawienia domyślne", FG(19), MUT)
    keys(img, X + 34, Y + PH - 40, [("↑↓", "wybierz"), ("←→", "zmień"), ("Esc", "wróć")])
    return img


if __name__ == "__main__":
    print(save2(hud(), "pomysl_2_zielarnia_hud.png"))
    print(save2(journal(), "pomysl_2_zielarnia_dziennik.png"))
    print(save2(bag(), "pomysl_2_zielarnia_plecak.png"))
    print(save2(options(), "pomysl_2_zielarnia_opcje.png"))
