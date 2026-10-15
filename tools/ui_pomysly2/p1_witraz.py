# Pomysł 1 (runda 2): WITRAŻ - szkło i ołów. Kolorowe szkło w ołowianych ramkach, ciemne „dymne” szkło pod tekstem,
# kompas = rozeta (PixelLab), zegar = mała rozeta ze wskazówkami, paski = 4 ostrołukowe okna (lancety) w lewym dole.
import math
import numpy as np
from PIL import Image, ImageDraw
from common2 import *

LEAD = "#121318"; LEAD2 = "#2a2c34"
GLASS = {"ruby": ("#8a1a2c", "#c8304a", "#f07080"), "sapph": ("#1c3a8a", "#3a64c8", "#8ab0f8"),
         "emer": ("#1a6a3a", "#2ea05a", "#8ae0a0"), "amber": ("#a8701a", "#e0a43a", "#ffe08a"),
         "viol": ("#4a2a7a", "#7a4ab0", "#c0a0f0"), "clear": ("#7a8a88", "#b0c4c0", "#eaf4f0")}
NEED_GLASS = {"health": "ruby", "stamina": "emer", "food": "amber", "water": "sapph"}
SMOKE = ["#121724", "#141a28", "#161d2c"]
TXT = "#f4ecd8"; MUT = "#b8b0a0"; GOLD = "#f2c45a"
FU = lambda s: font("UncialAntiqua.ttf", s)
FS = lambda s: font("AlegreyaSans-Medium.ttf", s)
ORDER = ["ruby", "sapph", "amber", "emer", "viol", "sapph", "ruby", "amber"]


def t_(img, xy, s, f, fill=TXT, anchor="la"):
    text(img, xy, s, f, fill, anchor=anchor, stroke=2, sfill=(8, 8, 12, 230))


def glass_piece(lay, mask, kind, seed=0):
    """kawałek szkła: 3 tony + smuga światła"""
    dk, md, lt = GLASS[kind]
    h, w = mask.shape
    n = noise(w, h, cell=6, seed=seed, octaves=1)
    yy, xx = np.mgrid[0:h, 0:w]
    a = np.array(lay)
    a[mask & (n < 0.35)] = hexc(dk)
    a[mask & (n >= 0.35)] = hexc(md)
    streak = mask & (((xx - yy) % 11) == 0) & (n > 0.55)
    a[streak] = hexc(lt)
    return Image.fromarray(a)


def glass_panel(img, x, y, w, h, band=10, seed=1, smoke_alpha=235, cut=0):
    """panel: ołowiany obrys, pas z kolorowych szybek dookoła, w środku ciemne dymne szkło (czytelny tekst)"""
    m = cut_mask(w, h, cut) if cut else rect_mask(w, h)
    soft_shadow(img, m, (x, y), (3, 4), 140, 4)
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    inner = erode(m, band)
    border = m & ~inner
    # pas podzielony na szybki co ~26 px (po obwodzie)
    yy, xx = np.mgrid[0:h, 0:w]
    per = np.where(yy < band, xx, np.where(xx >= w - band, w + yy, np.where(yy >= h - band, w + h + (w - xx), 2 * w + h + (h - yy))))
    seg = (per // 26).astype(int)
    rng = np.random.default_rng(seed)
    kinds = [ORDER[(k + seed) % len(ORDER)] for k in range(int(seg.max()) + 2)]
    for k in np.unique(seg[border]):
        pm = border & (seg == k)
        lay = glass_piece(lay, pm, kinds[k], seed=seed * 31 + int(k))
    a = np.array(lay)
    # ołów między szybkami
    edges = np.zeros_like(border)
    edges[:, 1:] |= (seg[:, 1:] != seg[:, :-1]) & border[:, 1:]
    edges[1:, :] |= (seg[1:, :] != seg[:-1, :]) & border[1:, :]
    a[edges] = hexc(LEAD)
    # dymne szkło w środku
    n = noise(w, h, cell=40, seed=seed + 5, octaves=2)
    sm = quant(n, SMOKE, cuts=[0.35, 0.7])
    s = np.array(sm); s[..., 3] = smoke_alpha
    a[inner] = s[inner]
    a[ring(m, 2)] = hexc(LEAD)
    a[ring(inner, 2)] = hexc(LEAD)
    a[ring(m, 1)] = hexc("#000000")
    img.alpha_composite(Image.fromarray(a), (x, y))


def lancet_mask(w, h):
    yy, xx = np.mgrid[0:h, 0:w]
    rr = w * 0.9
    pointed = (((xx - (w - rr)) ** 2 + (yy - rr) ** 2) <= rr * rr) & (((xx - (rr - 1)) ** 2 + (yy - rr) ** 2) <= rr * rr)
    return (yy >= rr) | pointed


def lancet_gauge(img, x, y, w, h, ratio, kind, ic, low=False):
    """ostrołukowe okno: od dołu wypełnione kolorowym szkłem w romby (kwatery), góra - ciemne szkło"""
    m = lancet_mask(w, h)
    soft_shadow(img, m, (x, y), (2, 3), 140, 3)
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:h, 0:w]
    inner = erode(m, 3)
    level = int(h - 3 - (h - 6) * ratio)
    full = inner & (yy >= level)
    empty = inner & (yy < level)
    lay = glass_piece(lay, full, kind, seed=x)
    a = np.array(lay)
    a[empty] = hexc("#161c2a")
    a[empty & (((xx + yy) % 9) == 0)] = hexc("#222a3c")
    # kwatery: ołowiane romby
    diag = ((xx + yy) % 10 == 0) | ((xx - yy) % 10 == 0)
    a[inner & diag] = hexc(LEAD)
    # poziom szkła - jasna krawędź
    a[inner & (yy == level)] = hexc(GLASS[kind][2])
    a[ring(m, 3)] = hexc("#6a645a")
    a[ring(m, 2)] = hexc("#8a8478")
    a[ring(m, 1)] = hexc("#000000")
    img.alpha_composite(Image.fromarray(a), (x, y))
    # parapet + ikona
    d = ImageDraw.Draw(img)
    d.rectangle((x - 5, y + h, x + w + 4, y + h + 5), fill=hexc("#8a8478"), outline=hexc("#000000"))
    put(img, ic, (x + w // 2 - 16, y + h + 6))
    if low:
        with Over(img) as o:
            o.rectangle((x - 3, y - 3, x + w + 2, y + h + 2), outline=hexc(GLASS[kind][2], 200))


def rose_clock(img, cx, cy, r, hour):
    d = ImageDraw.Draw(img)
    m = circle_mask(2 * r + 1)
    soft_shadow(img, m, (cx - r, cy - r), (2, 3), 140, 3)
    lay = Image.new("RGBA", (2 * r + 1, 2 * r + 1), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:2 * r + 1, 0:2 * r + 1]
    ang = (np.degrees(np.arctan2(xx - r, -(yy - r))) + 360) % 360
    dist = np.sqrt((xx - r) ** 2 + (yy - r) ** 2)
    petals = m & (dist > r * 0.32) & (dist < r - 4)
    seg = (ang // 30).astype(int)
    for k in range(12):
        # dzień (6-18) jasne szkło bursztynowe/błękitne, noc - fiolet i szafir
        h = (k * 2 + 12) % 24   # tarcza 12 h, ale kolor wg pory: górna połowa dnia
        kind = ["amber", "sapph"][k % 2] if k not in (5, 6, 7) else ["viol", "sapph", "viol"][k - 5]
        lay = glass_piece(lay, petals & (seg == k), kind, seed=k)
    a = np.array(lay)
    a[m & (dist <= r * 0.32)] = hexc(GLASS["clear"][1])
    a[petals & ((ang % 30) < 1.6)] = hexc(LEAD)
    a[m & (np.abs(dist - r * 0.32) < 1.2)] = hexc(LEAD)
    a[m & (dist >= r - 4)] = hexc("#7a7468")
    a[m & (dist >= r - 2)] = hexc("#a09a8c")
    a[ring(m, 1)] = hexc("#000000")
    img.alpha_composite(Image.fromarray(a), (cx - r, cy - r))
    (hx, hy), (mx, my) = hand_pts(cx, cy, hour, r * 0.5, r * 0.78)
    for wdt, col in ((5, "#000000"), (3, LEAD2)):
        d.line((cx, cy, hx, hy), fill=hexc(col), width=wdt)
    for wdt, col in ((4, "#000000"), (2, GOLD)):
        d.line((cx, cy, mx, my), fill=hexc(col), width=wdt)
    d.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=hexc(GOLD), outline=hexc("#000000"))
    # słońce przy obręczy (pora dnia)
    a2 = math.radians(((hour - 12) % 24) * 15)
    sx, sy = cx + math.sin(a2) * (r + 7), cy - math.cos(a2) * (r + 7)
    d.ellipse((sx - 5, sy - 5, sx + 5, sy + 5), fill=hexc("#ffe08a"), outline=hexc("#000000"))


def rose_compass(img):
    c = G["compass"]; cx, cy, r = c["cx"], c["cy"], 48
    d = ImageDraw.Draw(img)
    m = circle_mask(2 * r + 1)
    soft_shadow(img, m, (cx - r, cy - r), (3, 4), 150, 4)
    paint(img, m, "#5a554c", (cx - r, cy - r))
    paint(img, erode(m, 2) & ~erode(m, 13), "#141820", (cx - r, cy - r))
    rose = load(os.path.join(ART2, "rozeta.png")).resize((78, 78), Image.LANCZOS)
    rm = circle_mask(78)
    a = np.array(rose); a[~rm] = 0
    # tło rozety (ołów) + lekkie przyciemnienie, żeby strzałka i litery czytały się
    paint(img, circle_mask(74), LEAD, (cx - 37, cy - 37))
    put(img, Image.fromarray(a), (cx - 39, cy - 39), alpha=0.9)
    paint(img, ring(m, 1), "#000000", (cx - r, cy - r))
    paint(img, ring(erode(m, 13), 1), "#8a8478", (cx - r, cy - r))
    for lab, deg in (("N", 0), ("E", 90), ("S", 180), ("W", 270)):
        x, y = compass_dir(cx, cy, r - 7, deg)
        t_(img, (x, y), lab, FS(16 if lab == "N" else 14), GOLD if lab == "N" else TXT, anchor="mm")
    # strzałka do celu: złote szkło
    ang = c["angle"]
    tx, ty = compass_dir(cx, cy, r + 6, ang)
    bx1, by1 = compass_dir(cx, cy, r - 10, ang - 9)
    bx2, by2 = compass_dir(cx, cy, r - 10, ang + 9)
    ex, ey = compass_dir(cx, cy, r - 16, ang)
    d.line((cx, cy, ex, ey), fill=hexc("#000000"), width=5)
    d.line((cx, cy, ex, ey), fill=hexc(GOLD), width=2)
    d.polygon([(tx, ty), (bx1, by1), (ex, ey), (bx2, by2)], fill=hexc(GOLD), outline=hexc("#000000"))
    d.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=hexc(GOLD), outline=hexc("#000000"))
    # podpis i obciążenie pod spodem
    f = FS(16)
    lab = c["label"]
    w_ = tw(lab, f) + 26
    glass_panel(img, 1272 - w_, cy + r + 8, w_, 26, band=4, seed=3, cut=3)
    t_(img, (1272 - w_ // 2, cy + r + 21), lab, f, GOLD, anchor="mm")
    put(img, icon(370), (1240, cy + r + 38))
    t_(img, (1236, cy + r + 46), G["load"], FS(17), TXT, anchor="ra")


def hud():
    img = bg2()
    # ---- zegar-rozeta + cel
    rose_clock(img, 50, 54, 34, G["hour"])
    f = FS(20)
    w_ = tw(G["goal"], f) + 62
    glass_panel(img, 94, 32, w_, 44, band=5, seed=7, cut=4)
    put(img, icon(G["goal_icon"]), (104, 38))
    t_(img, (142, 43), G["goal"], f, GOLD)
    # ---- nazwa miejsca
    f = FU(26)
    w_ = tw(G["map"], f) + 60
    glass_panel(img, 640 - w_ // 2, 8, w_, 46, band=6, seed=11, cut=6)
    t_(img, (640, 31), G["map"], f, TXT, anchor="mm")
    # ---- kompas-rozeta
    rose_compass(img)
    # ---- 4 lancety w lewym dole
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        x = 18 + i * 46
        lancet_gauge(img, x, 566, 30, 104, v, NEED_GLASS[k], need_icon(k), low=(k == "water"))
    # ---- dymek
    f = FS(18)
    w_ = tw(G["popup"], f) + 52
    x = G["hero"][0] - w_ // 2; y = G["hero"][1] - 80
    glass_panel(img, x, y, w_, 34, band=4, seed=13, cut=3)
    put(img, icon(391), (x + 6, y + 1))
    t_(img, (x + 42, y + 7), G["popup"], f)
    # ---- zdobycze
    for i, (ic, s) in enumerate(G["gains"]):
        f = FS(19)
        w_ = tw(s, f) + 58
        y = 594 + i * 40
        glass_panel(img, 1270 - w_, y, w_, 34, band=4, seed=20 + i, cut=3)
        put(img, icon(ic), (1270 - w_ + 8, y + 1))
        t_(img, (1270 - w_ + 46, y + 6), s, f)
    return img


# ------------------------------------------------------------------ okna
def frame(img, title, sub=None, X=110, Y=56, PW=1060, PH=600):
    glass_panel(img, X, Y, PW, PH, band=14, seed=40, cut=10)
    t_(img, (X + 34, Y + 26), title, FU(34), GOLD)
    if sub:
        t_(img, (X + PW - 34, Y + 34), sub, FS(18), MUT, anchor="ra")
    d = ImageDraw.Draw(img)
    d.line((X + 24, Y + 76, X + PW - 25, Y + 76), fill=hexc(LEAD), width=2)
    d.line((X + 24, Y + 78, X + PW - 25, Y + 78), fill=hexc("#3a4258"))
    return X, Y, PW, PH


def tabs(img, x, y, names, act=0, f=None):
    f = f or FS(18)
    for i, n in enumerate(names):
        w_ = tw(n, f) + 26
        kind = "amber" if i == act else "clear"
        m = cut_mask(w_, 30, 3)
        lay = Image.new("RGBA", (w_, 30), (0, 0, 0, 0))
        if i == act:
            lay = glass_piece(lay, m, "amber", seed=i)
        else:
            paint(lay, m, "#222a3a")
        paint(lay, ring(m, 1), LEAD)
        img.alpha_composite(lay, (x, y))
        t_(img, (x + w_ // 2, y + 15), n, f, "#1a1208" if i == act else MUT, anchor="mm") if i != act else text(img, (x + w_ // 2, y + 15), n, f, "#2a1a08", anchor="mm")
        x += w_ + 6


def keys(img, x, y, pairs):
    f = FS(16)
    for k, lab in pairs:
        kw = tw(k, f) + 14
        glass_panel(img, x, y, kw, 24, band=3, seed=x, cut=2)
        t_(img, (x + kw // 2, y + 12), k, f, GOLD, anchor="mm")
        t_(img, (x + kw + 6, y + 3), lab, f, MUT)
        x += kw + tw(lab, f) + 22


def journal():
    img = bg_menu2(0.55, 2.0, (6, 8, 16))
    X, Y, PW, PH = frame(img, "Dziennik", "Dzień 40 · lato · 11:01")
    tabs(img, X + 30, Y + 90, JTABS)
    d = ImageDraw.Draw(img)
    fl = FS(19)
    for i, (ic, name, done) in enumerate(GOALS):
        y = Y + 140 + i * 42
        if i == 0:
            with Over(img) as o:
                o.rectangle((X + 30, y - 4, X + 500, y + 34), fill=hexc("#e0a43a", 60), outline=hexc(GOLD))
        d.rectangle((X + 42, y + 8, X + 56, y + 22), outline=hexc("#8a8478"))
        if done:
            d.line((X + 44, y + 15, X + 48, y + 20, X + 58, y + 4), fill=hexc("#4ac26a"), width=2)
        put(img, icon(ic), (X + 66, y))
        t_(img, (X + 106, y + 6), name, fl, MUT if done else TXT)
    d.line((X + 520, Y + 132, X + 520, Y + PH - 60), fill=hexc(LEAD), width=2)
    # szczegóły: ikona w ostrołuku
    lx, ly = X + 548, Y + 136
    m = lancet_mask(70, 96)
    lay = Image.new("RGBA", (70, 96), (0, 0, 0, 0))
    lay = glass_piece(lay, erode(m, 3), "sapph", seed=3)
    a = np.array(lay); a[ring(m, 3)] = hexc("#8a8478"); a[ring(m, 1)] = hexc("#000000"); lay = Image.fromarray(a)
    img.alpha_composite(lay, (lx, ly))
    put(img, icon(337, 1.5), (lx + 11, ly + 34))
    t_(img, (lx + 90, ly + 4), "Znajdź pracę", FU(30), GOLD)
    t_(img, (lx + 90, ly + 40), "w tawernie", FU(30), GOLD)
    t_(img, (lx + 92, ly + 80), "Rozdział I · Dług dziadka", FS(17), MUT)
    y = ly + 120
    for ln in wrapf("Borgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy. Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim.", FS(19), 450):
        t_(img, (lx, y), ln, FS(19)); y += 26
    y += 14
    t_(img, (lx, y), "Skąd wziąć", FU(22), GOLD); y += 34
    put(img, icon(353), (lx, y - 6)); t_(img, (lx + 40, y), "Browar: Warz piwo", FS(18)); y += 40
    t_(img, (lx, y), "Kompas prowadzi: Tawerna · 151 kroków", FS(17), MUT)
    keys(img, X + 30, Y + PH - 46, [("←→", "zakładka"), ("↑↓", "wybierz"), ("Enter", "śledź cel"), ("Esc", "wróć")])
    t_(img, (X + PW - 34, Y + PH - 44), "Wykonano 41 z 77 celów", FS(17), GOLD, anchor="ra")
    return img


def bag():
    img = bg_menu2(0.55, 2.0, (6, 8, 16))
    X, Y, PW, PH = frame(img, "Plecak", "Obciążenie 41 / 120")
    tabs(img, X + 30, Y + 90, ["Wszystko", "Materiały", "Jedzenie", "Narzędzia"])
    d = ImageDraw.Draw(img)
    sel = 9
    fl = FS(19)
    for i, (iid, name, ic, n) in enumerate(BAG[:11]):
        col, row = i % 1, i
        y = Y + 136 + row * 36
        if i == sel:
            with Over(img) as o:
                o.rectangle((X + 30, y - 3, X + 500, y + 32), fill=hexc("#7a4ab0", 80), outline=hexc("#c0a0f0"))
        put(img, icon(ic), (X + 40, y - 1))
        t_(img, (X + 80, y + 4), name, fl, TXT)
        t_(img, (X + 490, y + 4), "×" + str(n), fl, MUT, anchor="ra")
        d.line((X + 34, y + 34, X + 496, y + 34), fill=hexc("#232a3a"))
    d.line((X + 520, Y + 132, X + 520, Y + PH - 60), fill=hexc(LEAD), width=2)
    # szczegóły: duża ikona w rozecie
    rx, ry = X + 548, Y + 136
    rose = load(os.path.join(ART2, "rozeta.png"))
    put(img, rose, (rx, ry), alpha=0.85)
    paint(img, circle_mask(44), "#141820", (rx + 26, ry + 26))
    put(img, icon(358), (rx + 32, ry + 32))
    t_(img, (rx + 116, ry + 14), "Jagody", FU(34), GOLD)
    t_(img, (rx + 118, ry + 56), "Masz: 6 · waga: 1", FS(18), MUT)
    y = ry + 116
    for ln in wrapf("Dzikie jagody. Słodkie i sycące, ale na chwilę. Dobre na drogę, gdy nie ma ognia.", FS(19), 450):
        t_(img, (rx, y), ln, FS(19)); y += 26
    y += 10
    t_(img, (rx, y), "Najstarsze zepsują się za 3 dni.", FS(18), "#8ae0a0"); y += 32
    t_(img, (rx, y), "Zjedz: kondycja +8, sytość +8, woda +10", FS(18), MUT); y += 44
    for k, (key, lab, kind) in enumerate((("Enter", "Zjedz", "amber"), ("X", "Wyrzuć", "clear"))):
        bx = rx + k * 170
        glass_panel(img, bx, y, 150, 36, band=4, seed=60 + k, cut=3)
        t_(img, (bx + 75, y + 18), key + ": " + lab, FS(18), GOLD if k == 0 else MUT, anchor="mm")
    keys(img, X + 30, Y + PH - 46, [("↑↓", "wybierz"), ("←→", "zakładka"), ("Enter", "użyj"), ("Esc", "wróć")])
    t_(img, (X + PW - 34, Y + PH - 44), "15 rzeczy · 330 monet", FS(17), GOLD, anchor="ra")
    return img


def hero():
    img = bg_menu2(0.55, 2.0, (6, 8, 16))
    X, Y, PW, PH = frame(img, "Postać", "Poziom 6 · 890 / 1200 dośw.")
    d = ImageDraw.Draw(img)
    # popiersie w ostrołukowym oknie (lancet z PixelLab jako obramienie)
    ax, ay, aw, ah = X + 40, Y + 100, 250, 380
    m = lancet_mask(aw, ah)
    soft_shadow(img, m, (ax, ay), (3, 4), 150, 4)
    lay = Image.new("RGBA", (aw, ah), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:ah, 0:aw]
    inner = erode(m, 12)
    band = m & ~inner
    seg = ((yy + xx // 3) // 24).astype(int)
    for k in np.unique(seg[band]):
        lay = glass_piece(lay, band & (seg == k), ORDER[int(k) % len(ORDER)], seed=int(k))
    a = np.array(lay)
    a[inner] = hexc("#1a2234")
    a[inner & (yy > ah * 0.55)] = hexc("#1e283c")
    a[band & ((seg[:, :] != np.roll(seg, 1, axis=0)))] = hexc(LEAD)
    a[ring(m, 2)] = hexc(LEAD); a[ring(inner, 2)] = hexc(LEAD); a[ring(m, 1)] = hexc("#000000")
    lay = Image.fromarray(a)
    bust = hero_bust().resize((int(330 * 0.68), int(350 * 0.68)), Image.LANCZOS)
    b2 = Image.new("RGBA", (aw, ah), (0, 0, 0, 0)); b2.alpha_composite(bust, ((aw - bust.width) // 2, ah - 12 - bust.height))
    ba = np.array(b2); ba[~inner] = 0
    lay.alpha_composite(Image.fromarray(ba))
    img.alpha_composite(lay, (ax, ay))
    t_(img, (ax + aw // 2, ay + ah + 22), "Reid · Poziom 6", FU(22), GOLD, anchor="mm")
    # cechy: szklane medaliony
    sx = X + 330
    t_(img, (sx, Y + 96), "Atrybuty", FU(24), GOLD)
    attrs = [("Siła", 5, "ruby"), ("Zręczność", 5, "emer"), ("Kondycja", 5, "amber"), ("Czujność", 5, "sapph"), ("Hart ducha", 5, "viol")]
    for i, (nm, v, kind) in enumerate(attrs):
        y = Y + 140 + i * 50
        mm = circle_mask(36)
        lay = Image.new("RGBA", (36, 36), (0, 0, 0, 0)); lay = glass_piece(lay, erode(mm, 2), kind, seed=i)
        a = np.array(lay); a[ring(mm, 2)] = hexc(LEAD); lay = Image.fromarray(a)
        img.alpha_composite(lay, (sx, y))
        t_(img, (sx + 18, y + 18), str(v), FS(18), "#ffffff", anchor="mm")
        t_(img, (sx + 48, y + 6), nm, FS(20), TXT if i else GOLD)
        with Over(img) as o:
            o.rectangle((sx + 170, y + 14, sx + 290, y + 20), fill=(0, 0, 0, 160))
            o.rectangle((sx + 170, y + 14, sx + 170 + int(120 * v / 60), y + 20), fill=hexc(GLASS[kind][2]))
    with Over(img) as o:
        o.rectangle((sx - 4, Y + 136, sx + 300, Y + 180), outline=hexc(GOLD))
    t_(img, (sx, Y + 400), "Punkty atrybutów: 15 · umiejętności: 5", FS(17), MUT)
    # potrzeby w lancetach + opis
    px = X + 690
    t_(img, (px, Y + 96), "Teraz", FU(24), GOLD)
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        lancet_gauge(img, px + i * 80 + 14, Y + 140, 34, 120, v, NEED_GLASS[k], need_icon(k), low=(k == "water"))
        t_(img, (px + i * 80 + 31, Y + 312), lab, FS(15), TXT, anchor="mm")
        t_(img, (px + i * 80 + 31, Y + 332), str(int(v * 100)) + "%", FS(15), MUT, anchor="mm")
    t_(img, (px, Y + 370), "Siła", FU(22), GOLD)
    y = Y + 404
    for ln in wrapf("Obrażenia wręcz, zbijanie równowagi wroga, udźwig; trochę mniej uderzeń przy rąbaniu, kopaniu i kuciu skał.", FS(17), 320):
        t_(img, (px, y), ln, FS(17)); y += 23
    keys(img, X + 30, Y + PH - 46, [("↑↓", "wybierz"), ("←→", "rozdaj"), ("Enter", "zatwierdź"), ("Q/E", "zakładka"), ("Esc", "wróć")])
    return img


if __name__ == "__main__":
    print(save2(hud(), "pomysl_1_witraz_hud.png"))
    print(save2(journal(), "pomysl_1_witraz_dziennik.png"))
    print(save2(bag(), "pomysl_1_witraz_plecak.png"))
    print(save2(hero(), "pomysl_1_witraz_postac.png"))
