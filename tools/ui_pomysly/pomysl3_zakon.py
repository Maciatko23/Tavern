# Pomysł 3: ZAKON - kamień Twierdzy, runy i kruk. Zimny szary kamień z rytym obramowaniem, turkusowy blask Serca,
# godło kruka (PixelLab, art/kruk_godlo.png). Zegar jako kamienna tarcza z Sercem w środku, okrągła minimapa.
import math, os
import numpy as np
from PIL import Image, ImageDraw
from uikit import *

ST = ["#121316", "#1d1f23", "#272a2f", "#30343a", "#3b4047", "#4a5058", "#5d646d", "#7a828b", "#9aa2aa"]
TEAL = ["#0c2f2d", "#155a55", "#249a90", "#45d3c2", "#a8fff2"]
BONE = "#e8e4d8"; MUTED = "#a0a6ab"
LIQ = {"health": ["#ff7a7a", "#d23a3a", "#8a1c22"], "stamina": ["#a8fff2", "#45d3c2", "#1d8078"],
       "food": ["#ffd27a", "#e09a2a", "#8a5a14"], "water": ["#9fd0ff", "#3f86d8", "#1d4a8a"]}
FC = lambda s, w=700: font("Cinzel.ttf", s, w)
FS = lambda s: font("AlegreyaSans-Medium.ttf", s)
ART = os.path.join(HERE, "art")

# runy 5x7 (piksele '#')
RUNES = [
    ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    ["#....", "##...", "#.#..", "#..#.", "#.#..", "##...", "#...."],
    ["#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#", "#...#"],
    ["..#..", ".#.#.", "#.#.#", "..#..", "..#..", "..#..", "..#.."],
    ["#.#..", "##...", "#....", "#....", "#....", "#....", "#...."],
    ["..#..", "..#..", "#.#.#", ".###.", "..#..", "..#..", "..#.."],
    ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    [".#.#.", "#.#.#", ".#.#.", "..#..", ".#.#.", "#.#.#", ".#.#."],
]


def rune(img, x, y, k, col=TEAL[3], glow=TEAL[1]):
    g = RUNES[k % len(RUNES)]
    d = ImageDraw.Draw(img)
    if glow:
        for yy, row in enumerate(g):
            for xx, ch in enumerate(row):
                if ch == "#":
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        d.point((x + xx + dx, y + yy + dy), fill=hexc(glow, 160))
    for yy, row in enumerate(g):
        for xx, ch in enumerate(row):
            if ch == "#":
                d.point((x + xx, y + yy), fill=hexc(col))


def stone(img, x, y, w, h, cut=4, seed=1, groove=True, shadow=True, mask=None):
    m = mask if mask is not None else cut_mask(w, h, cut)
    if shadow:
        soft_shadow(img, m, (x, y), (3, 4), 130, 3)
    n = noise(w, h, cell=26, seed=seed, octaves=3)
    tex = quant(n, ["#353940", "#3c4148", "#434850", "#4a5058"], cuts=[0.3, 0.55, 0.82])
    sp = noise(w, h, cell=2, seed=seed + 3, octaves=1)
    tex = np.array(tex); tex[sp > 0.93] = hexc("#2c3036"); tex[sp < 0.05] = hexc("#565c64"); tex = Image.fromarray(tex)
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint_tex(lay, m, tex)
    # spękania
    rng = np.random.default_rng(seed)
    dd = ImageDraw.Draw(lay)
    for _ in range(max(1, (w * h) // 9000)):
        cx, cy = rng.integers(8, max(9, w - 8)), rng.integers(8, max(9, h - 8))
        pts = [(cx, cy)]
        for k in range(rng.integers(3, 6)):
            cx += rng.integers(-5, 6); cy += rng.integers(2, 6)
            pts.append((cx, cy))
        dd.line(pts, fill=hexc(ST[2]))
    yy, xx = np.mgrid[0:h, 0:w]
    e1 = ring(m, 1); e2 = ring(erode(m, 1), 1); e3 = ring(erode(m, 2), 1)
    up = (yy < h / 2) & (xx + yy < w + 0)
    paint(lay, (e2 | e3) & up, ST[6])
    paint(lay, e2 & ~up, ST[1])
    paint(lay, e3 & ~up, ST[2])
    paint(lay, e1, "#08090a")
    if groove and w > 40 and h > 30:
        g = ring(erode(m, 6), 1)
        g2 = ring(erode(m, 7), 1)
        paint(lay, g, ST[1])
        paint(lay, g2 & ~up, ST[6])
    lay.putalpha(Image.fromarray(np.where(m, 255, 0).astype(np.uint8)))
    img.alpha_composite(lay, (x, y))


def engraved(img, xy, s, f, anchor="la", col=None):
    """litery ryte w kamieniu: ciemne + jasna krawędź pod spodem (albo świecące, gdy col)"""
    if col:
        text(img, (xy[0], xy[1]), s, f, hexc(TEAL[1], 200), anchor=anchor, stroke=1, sfill=hexc(TEAL[0], 160))
        text(img, xy, s, f, col, anchor=anchor)
        return
    text(img, (xy[0] - 1, xy[1] - 1), s, f, "#0c0d0f", anchor=anchor)
    text(img, (xy[0] + 1, xy[1] + 1), s, f, ST[6], anchor=anchor)
    text(img, xy, s, f, "#d6d2c6", anchor=anchor)


def channel(img, x, y, w, h, ratio, key, glow=False):
    d = ImageDraw.Draw(img)
    d.rectangle((x - 1, y - 1, x + w, y + h), fill=hexc("#08090a"))
    d.rectangle((x, y, x + w - 1, y + h - 1), fill=hexc("#101215"))
    d.line((x - 1, y + h, x + w, y + h), fill=hexc(ST[6]))
    d.line((x + w, y - 1, x + w, y + h), fill=hexc(ST[6]))
    cols = LIQ[key]
    fw = int((w - 2) * ratio)
    if fw > 0:
        ih = h - 2
        for i, c in enumerate(cols):
            a = y + 1 + int(i * ih / 3); b = y + 1 + int((i + 1) * ih / 3) - 1
            d.rectangle((x + 1, a, x + fw, b), fill=hexc(c))
        # lśnienie na powierzchni
        for k in range(x + 3, x + fw - 2, 9):
            d.point((k, y + 1), fill=hexc("#ffffff", 200))
    if glow:
        d.rectangle((x - 3, y - 3, x + w + 2, y + h + 2), outline=hexc(TEAL[2]))


def dial(img, cx, cy, r, hour):
    m = circle_mask(2 * r + 1)
    soft_shadow(img, m, (cx - r, cy - r), (3, 4), 140, 3)
    stone(img, cx - r, cy - r, 2 * r + 1, 2 * r + 1, seed=5, groove=False, shadow=False, mask=m)
    d = ImageDraw.Draw(img)
    inner = r - 16
    im_ = circle_mask(2 * inner + 1)
    # wnętrze: niebo dnia/nocy (górna połowa - dzień)
    sky = Image.new("RGBA", (2 * inner + 1, 2 * inner + 1), (0, 0, 0, 0))
    yy, xx = np.mgrid[0:2 * inner + 1, 0:2 * inner + 1]
    paint(sky, im_ & (yy <= inner), "#3d6e8a")
    paint(sky, im_ & (yy <= inner * 0.55), "#4f86a6")
    paint(sky, im_ & (yy > inner), "#141a2a")
    paint(sky, im_ & (yy > inner) & (yy <= inner + 2), "#2a3a2a")
    paint(sky, ring(im_), "#08090a")
    img.alpha_composite(sky, (cx - inner, cy - inner))
    for k in range(5):
        sx = cx - inner + 10 + k * 13; sy = cy + 8 + (k * 7) % 14
        d.point((sx, sy), fill=hexc("#c8d8ff"))
    # 12 run na pierścieniu
    for k in range(12):
        a = math.radians(k * 30)
        rx = cx + math.sin(a) * (r - 8) - 2; ry = cy - math.cos(a) * (r - 8) - 3
        rune(img, int(rx), int(ry), k, col=TEAL[2] if k % 3 else TEAL[3], glow=None)
    # słońce na swojej drodze (tarcza 24 h, południe u góry)
    a = math.radians(((hour - 12) % 24) * 15)
    sx = cx + math.sin(a) * (inner - 9); sy = cy - math.cos(a) * (inner - 9)
    d.ellipse((sx - 6, sy - 6, sx + 6, sy + 6), fill=hexc("#ffe08a"), outline=hexc("#c98a14"))
    d.ellipse((sx - 3, sy - 3, sx + 1, sy + 1), fill=hexc("#fff6d0"))
    # Serce w środku
    pts = [(cx, cy - 9), (cx + 7, cy), (cx, cy + 9), (cx - 7, cy)]
    d.polygon([(px, py) for px, py in pts], fill=hexc(TEAL[2]), outline=hexc(TEAL[0]))
    d.polygon([(cx, cy - 6), (cx + 3, cy - 1), (cx, cy + 2), (cx - 3, cy - 1)], fill=hexc(TEAL[3]))
    d.point((cx - 1, cy - 4), fill=hexc(TEAL[4]))


def round_map(d=150):
    mm = minimap()
    # wycinek wokół bohatera (marker w (134,45) mapy) - skala x1.6 najbliższym sąsiadem
    sc = 1.5
    big = mm.resize((int(mm.width * sc), int(mm.height * sc)), Image.NEAREST)
    cx, cy = int(134 * sc), int(70 * sc)
    x0 = max(0, min(big.width - d, cx - d // 2)); y0 = max(0, min(big.height - d, cy - d // 2))
    crop = big.crop((x0, y0, x0 + d, y0 + d))
    if crop.size != (d, d):
        c2 = Image.new("RGBA", (d, d), hexc(ST[2])); c2.paste(crop, (0, 0)); crop = c2
    m = circle_mask(d)
    a = np.array(crop); a[~m] = 0
    return Image.fromarray(a), (int(134 * sc) - x0, int(45 * sc) - y0)


def hud():
    img = bg_map()
    # ---- tarcza dnia + paski w rytych rynnach
    stone(img, 70, 10, 250, 128, cut=6, seed=2)
    vals = [("health", icon_bare(84), D["health"]), ("stamina", icon_bare(82), D["stamina"]),
            ("food", icon(390), D["food"]), ("water", icon(391), D["water"])]
    for i, (k, ic, v) in enumerate(vals):
        y = 16 + i * 28
        channel(img, 168, y + 11, 136, 10, v, k, glow=(k == "water"))
        put(img, ic, (132, y))
    dial(img, 64, 66, 58, D["hand"])
    stone(img, 14, 128, 210, 30, cut=4, seed=3, groove=False)
    engraved(img, (24, 135), "POŁUDNIE · DZIEŃ 40", FC(14))
    put(img, icon(370), (228, 126))
    text(img, (262, 133), "41/120", FS(17), BONE, shadow=(1, 1, (0, 0, 0, 255)))
    # ---- nazwa miejsca: kamienne nadproże z godłem
    f = FC(22)
    w_ = tw(D["map"].upper(), f) + 90
    x = 640 - w_ // 2
    stone(img, x, 10, w_, 42, cut=5, seed=7)
    engraved(img, (640 + 14, 32), D["map"].upper(), f, anchor="mm")
    em = load(os.path.join(ART, "kruk_godlo.png")).resize((40, 40), Image.NEAREST)
    put(img, em, (x + 6, 11))
    # ---- okrągła minimapa w kamiennym pierścieniu + cel na tablicy
    D_ = 150
    cx, cy = 1190, 86
    ringm = circle_mask(D_ + 24)
    stone(img, cx - (D_ + 24) // 2, cy - (D_ + 24) // 2, D_ + 24, D_ + 24, seed=9, groove=False, mask=ringm)
    rm, (hx, hy) = round_map(D_)
    img.alpha_composite(rm, (cx - D_ // 2, cy - D_ // 2))
    paint(img, ring(circle_mask(D_ + 2)), "#08090a", (cx - D_ // 2 - 1, cy - D_ // 2 - 1))
    dd = ImageDraw.Draw(img)
    px, py = cx - D_ // 2 + hx, cy - D_ // 2 + hy
    dd.polygon([(px, py - 6), (px + 5, py), (px, py + 6), (px - 5, py)], fill=hexc(TEAL[3]), outline=hexc("#08090a"))
    for k, lab in enumerate(("N", "E", "S", "W")):
        a = math.radians(k * 90)
        tx_ = cx + math.sin(a) * (D_ // 2 + 6); ty_ = cy - math.cos(a) * (D_ // 2 + 6)
        text(img, (tx_, ty_), lab, FC(13), TEAL[3] if k == 0 else BONE, anchor="mm", stroke=2, sfill=(8, 9, 10, 255))
    stone(img, 1046, 178, 226, 100, cut=5, seed=11)
    rune(img, 1060, 192, 3)
    text(img, (1072, 188), "CEL", FC(15), TEAL[3])
    put(img, icon(D["goal_icon"]), (1230, 186))
    text(img, (1060, 212), D["goal"], FS(18), BONE, shadow=(1, 1, (0, 0, 0, 255)))
    for k, ln in enumerate(wrap(D["goal_sub"], FS(15), 196)[:2]):
        text(img, (1060, 236 + k * 17), ln, FS(15), MUTED, shadow=(1, 1, (0, 0, 0, 255)))
    # ---- dymek nad bohaterem
    f = FS(18)
    w_ = tw(D["popup"], f) + 52
    x = D["hero"][0] - w_ // 2; y = D["hero"][1] - 80
    stone(img, x, y, w_, 34, cut=4, seed=13, groove=False)
    rect(img, (x + 4, y + 30, x + w_ - 5, y + 30), TEAL[3])
    put(img, icon(391), (x + 6, y + 1))
    text(img, (x + 42, y + 7), D["popup"], f, BONE, shadow=(1, 1, (0, 0, 0, 255)))
    # ---- zdobycze: małe tablice
    for i, (ic, s) in enumerate(D["gains"]):
        f = FS(20)
        w_ = tw(s, f) + 62
        y = 556 + i * 40
        x = 1270 - w_
        stone(img, x, y, w_, 34, cut=4, seed=20 + i, groove=False)
        rune(img, x + 6, y + 13, i + 4, col=TEAL[3])
        put(img, icon(ic), (x + 16, y + 1))
        text(img, (x + 52, y + 6), s, f, BONE, shadow=(1, 1, (0, 0, 0, 255)))
    # ---- doświadczenie: 10 run, 7 świeci + sześciokątny kamień z poziomem
    stone(img, 1030, 684, 242, 28, cut=4, seed=31, groove=False)
    for k in range(10):
        lit = k < int(D["xp"] * 10)
        rune(img, 1082 + k * 18, 694, k, col=TEAL[3] if lit else ST[2], glow=TEAL[1] if lit else None)
    hexm = np.zeros((40, 40), bool)
    yy, xx = np.mgrid[0:40, 0:40]
    hexm = (np.abs(xx - 19.5) <= 19) & (np.abs(yy - 19.5) <= 17) & (np.abs(xx - 19.5) * 0.5 + np.abs(yy - 19.5) <= 20)
    stone(img, 1010, 676, 40, 40, seed=33, groove=False, mask=hexm)
    engraved(img, (1030, 697), "VI", FC(16), anchor="mm", col=TEAL[4])
    return img


def window():
    img = bg_menu(0.6, 2.0, (4, 8, 10))
    X, Y, PW, PH = 160, 92, 960, 556
    stone(img, X, Y, PW, PH, cut=12, seed=40)
    # godło nad tablicą
    em = load(os.path.join(ART, "kruk_godlo.png")).resize((96, 96), Image.NEAREST)
    put(img, em, (640 - 48, Y - 40))
    engraved(img, (X + 34, Y + 22), "REID", FC(30))
    engraved(img, (X + 34 + tw("REID", FC(30)) + 14, Y + 32), "POZIOM VI", FC(16), col=TEAL[3])
    text(img, (X + PW - 34, Y + 26), "Dzień 40 · Lato · 11:05", FS(18), MUTED, anchor="ra", shadow=(1, 1, (0, 0, 0, 255)))
    dd = ImageDraw.Draw(img)
    dd.line((X + 20, Y + 70, X + PW - 21, Y + 70), fill=hexc(ST[1])); dd.line((X + 20, Y + 71, X + PW - 21, Y + 71), fill=hexc(ST[6]))
    # ---- polecenia: rzeźbione płyty
    cmds = [("Postać", 84), ("Plecak", 370), ("Dziennik", 121), ("Opcje", 83), ("Zapisz grę", 246), ("Zakończ grę", 197)]
    for i, (lab, ic) in enumerate(cmds):
        y = Y + 92 + i * 56
        sel = i == 0
        stone(img, X + 26, y, 220, 46, cut=4, seed=50 + i, groove=False, shadow=False)
        if sel:
            dd.rectangle((X + 24, y - 2, X + 247, y + 47), outline=hexc(TEAL[2]))
            dd.rectangle((X + 23, y - 3, X + 248, y + 48), outline=hexc(TEAL[0]))
        big = Image.new("RGBA", (12, 16), (0, 0, 0, 0))
        rune(big, 3, 4, i + 1, col=TEAL[3] if sel else "#d6d2c6", glow=None)
        big = big.resize((24, 32), Image.NEAREST)
        if sel:
            gl = Image.new("RGBA", (12, 16), (0, 0, 0, 0)); rune(gl, 3, 4, i + 1, col=TEAL[1], glow=TEAL[1]); put(img, gl.resize((24, 32), Image.NEAREST), (X + 52, y + 7))
        put(img, big, (X + 52, y + 7))
        if sel:
            engraved(img, (X + 90, y + 23), lab.upper(), FC(16), anchor="lm", col=TEAL[4])
        else:
            engraved(img, (X + 90, y + 23), lab.upper(), FC(16), anchor="lm")
    # ---- łukowe okno z popiersiem
    ax, ay, aw, ah = X + 270, Y + 92, 230, 300
    am = np.zeros((ah, aw), bool)
    yy, xx = np.mgrid[0:ah, 0:aw]
    r = aw / 2
    am = (yy >= r) | (((xx - aw / 2 + 0.5) ** 2 + (yy - r) ** 2) <= r * r)
    # gotycki ostrołuk: dwa okręgi
    rr = aw * 0.85
    pointed = (((xx - (aw - rr)) ** 2 + (yy - rr) ** 2) <= rr * rr) & (((xx - rr) ** 2 + (yy - rr) ** 2) <= rr * rr)
    am = (yy >= rr) | pointed
    am[:, :] &= True
    big = np.pad(am, 12, constant_values=False)
    for _ in range(12):
        b2 = big.copy(); b2[1:] |= big[:-1]; b2[:-1] |= big[1:]; b2[:, 1:] |= big[:, :-1]; b2[:, :-1] |= big[:, 1:]; big = b2
    stone(img, ax - 12, ay - 12, aw + 24, ah + 24, seed=60, groove=False, mask=big)
    inner = Image.new("RGBA", (aw, ah), (0, 0, 0, 0))
    paint(inner, am, "#0e1418")
    paint(inner, am & (yy > ah * 0.45), "#111a1e")
    bust = hero_bust().resize((int(330 * 0.68), int(350 * 0.68)), Image.LANCZOS)
    inner.alpha_composite(bust, ((aw - bust.width) // 2, ah - bust.height))
    a = np.array(inner); a[~am] = 0; inner = Image.fromarray(a)
    img.alpha_composite(inner, (ax, ay))
    paint(img, ring(am, 1), "#08090a", (ax, ay))
    paint(img, ring(erode(am, 1), 1), TEAL[1], (ax, ay))
    # ---- cechy w rynnach
    sx = X + 530
    rows = [("Zdrowie", "health", D["health"], "78%"), ("Wytrzymałość", "stamina", D["stamina"], "70 / 100"),
            ("Sytość", "food", D["food"], "64 / 100"), ("Nawodnienie", "water", D["water"], "Spragniony")]
    for i, (lab, k, v, val) in enumerate(rows):
        y = Y + 96 + i * 46
        text(img, (sx, y), lab, FS(19), BONE, shadow=(1, 1, (0, 0, 0, 255)))
        text(img, (X + PW - 34, y), val, FS(19), "#ff9a8a" if k == "water" else BONE, anchor="ra", shadow=(1, 1, (0, 0, 0, 255)))
        channel(img, sx, y + 26, X + PW - 34 - sx, 10, v, k)
    y = Y + 286
    engraved(img, (sx, y), "SAMOPOCZUCIE", FC(13), col=TEAL[3])
    stone(img, sx, y + 20, 110, 30, cut=3, seed=70, groove=False, shadow=False)
    text(img, (sx + 55, y + 35), "w normie", FS(17), BONE, anchor="mm")
    stone(img, sx + 118, y + 20, 130, 30, cut=3, seed=71, groove=False, shadow=False)
    text(img, (sx + 183, y + 35), "spragniony", FS(17), "#ff9a8a", anchor="mm")
    # ---- narzędzia w kamiennych gniazdach
    y = Y + 410
    dd.line((X + 270, y - 8, X + PW - 34, y - 8), fill=hexc(ST[1])); dd.line((X + 270, y - 7, X + PW - 34, y - 7), fill=hexc(ST[6]))
    engraved(img, (X + 270, y + 2), "NARZĘDZIA", FC(13), col=TEAL[3])
    wear = [0.9, 0.7, 0.85, 0.5, 0.95, 0.6, 0.3]
    for k, (iid, nm, ic) in enumerate(TOOLS[:7]):
        gx = X + 270 + k * 50
        dd.rectangle((gx, y + 24, gx + 42, y + 66), fill=hexc("#101215"), outline=hexc("#08090a"))
        dd.line((gx, y + 67, gx + 42, y + 67), fill=hexc(ST[6]))
        put(img, icon(ic), (gx + 5, y + 27))
        dd.rectangle((gx + 4, y + 61, gx + 4 + int(34 * wear[k]), y + 62), fill=hexc(TEAL[3] if wear[k] > 0.4 else "#e0703a"))
    engraved(img, (X + 640, y + 2), "OBCIĄŻENIE", FC(13), col=TEAL[3])
    text(img, (X + 640, y + 28), "41 / 120", FS(22), BONE, shadow=(1, 1, (0, 0, 0, 255)))
    engraved(img, (X + 780, y + 2), "MONETY", FC(13), col=TEAL[3])
    text(img, (X + 780, y + 28), "330", FS(22), "#ffd27a", shadow=(1, 1, (0, 0, 0, 255)))
    # ---- stopka: dług + klawisze
    fy = Y + PH - 50
    dd.line((X + 20, fy - 8, X + PW - 21, fy - 8), fill=hexc(ST[1])); dd.line((X + 20, fy - 7, X + PW - 21, fy - 7), fill=hexc(ST[6]))
    hx = X + 30
    for key, lab in (("↑↓", "wybierz"), ("Enter", "otwórz"), ("Esc", "zamknij")):
        kw = tw(key, FS(16)) + 16
        stone(img, hx, fy + 4, kw, 26, cut=3, seed=hx, groove=False, shadow=False)
        text(img, (hx + kw // 2, fy + 17), key, FS(16), BONE, anchor="mm")
        text(img, (hx + kw + 8, fy + 8), lab, FS(17), MUTED)
        hx += kw + tw(lab, FS(17)) + 28
    engraved(img, (X + 480, fy + 10), "DŁUG DZIADKA", FC(13), col=TEAL[3])
    channel(img, X + 600, fy + 12, 110, 8, 0.5, "food")
    text(img, (X + PW - 30, fy + 7), "1250 / 2500 G · zostało 21 dni", FS(17), BONE, anchor="ra")
    return img


if __name__ == "__main__":
    print(save(hud(), "pomysl_3_zakon_hud.png"))
    print(save(window(), "pomysl_3_zakon_okno.png"))
