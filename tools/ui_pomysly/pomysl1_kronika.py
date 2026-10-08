# Pomysł 1: KRONIKA - pergamin i atrament. HUD jak notatki na skrawkach pergaminu, dziennik jako otwarta księga.
import math
import numpy as np
from PIL import Image, ImageDraw
from uikit import *

INK = "#2e2014"; INK2 = "#5b4630"; INK3 = "#8a7454"
RED = "#9b2a1e"; RED2 = "#c4432f"
PARCH = ["#c9aa74", "#d9c08e", "#e6d2a2", "#efdeb4"]
INKS = {"health": "#a8301f", "stamina": "#4a7a2c", "food": "#b07a1e", "water": "#2d5a8c"}

F_HEAD = lambda s: font("PirataOne.ttf", s)
F_BODY = lambda s, w=500: font("Alegreya.ttf", s, w)


def parchment(w, h, seed=1, amp=3, torn=True, burnt=True, soft=False):
    """skrawek pergaminu: obraz RGBA + maska"""
    m = torn_mask(w, h, amp=amp, seed=seed) if torn else rect_mask(w, h)
    n = noise(w, h, cell=48 if soft else 22, seed=seed, octaves=4)
    pal = ["#e2cd9c", "#e8d6a8", "#eddcb0", "#f1e2b9"] if soft else PARCH
    tex = quant(n, pal, cuts=[0.12, 0.4, 0.75] if soft else [0.18, 0.42, 0.7])
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint_tex(img, m, tex)
    # plamy
    st = noise(w, h, cell=40, seed=seed + 7, octaves=2)
    paint(img, m & (st > (0.93 if soft else 0.82)), mix(PARCH[1], "#a88654", 0.2 if soft else 0.35))
    if burnt:
        d = dist_in(m, 4)
        paint(img, d == 3, mix(PARCH[0], "#8a6236", 0.25))
        paint(img, d == 2, "#b38c58")
        paint(img, d == 1, "#6e4a26")
    return img, m


def wax_seal(d=30, seed=3, mark=None):
    img = Image.new("RGBA", (d + 6, d + 6), (0, 0, 0, 0))
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:d + 6, 0:d + 6]
    c = (d + 5) / 2
    ang = np.arctan2(yy - c, xx - c)
    r = d / 2 + 2 * np.sin(ang * 5 + rng.random() * 6) * 0.6 + 1.2 * np.sin(ang * 9 + 1.3)
    m = ((xx - c) ** 2 + (yy - c) ** 2) <= r ** 2
    paint(img, m, "#7a1d14")
    inner = ((xx - c) ** 2 + (yy - c) ** 2) <= (d / 2 - 4) ** 2
    paint(img, inner, "#9b2a1e")
    paint(img, ring(inner, 1), "#5e130c")
    hl = inner & ((xx - c + 4) ** 2 + (yy - c + 4) ** 2 <= 9)
    paint(img, hl, "#c4503a")
    paint(img, ring(m, 1), "#4a0f0a")
    if mark:
        text(img, (c, c + 1), mark, F_HEAD(int(d * 0.62)), "#e8b8a0", anchor="mm")
    return img


def hatch_bar(img, x, y, w, h, ratio, col, low=False):
    d = ImageDraw.Draw(img)
    fw = int((w - 2) * ratio)
    # podmalówka (rozwodniony atrament) + kreskowanie
    wash = mix(col, PARCH[2], 0.62)
    rect(img, (x + 1, y + 1, x + fw, y + h - 2), wash)
    for k in range(-h, fw, 3):
        for t in range(h - 2):
            px = x + 1 + k + t; py = y + h - 2 - t
            if x + 1 <= px <= x + fw:
                d.point((px, py), fill=hexc(col))
    # ramka "piórem": linie wychodzą lekko za narożniki
    line(img, [(x - 1, y), (x + w, y)], INK)
    line(img, [(x, y + h - 1), (x + w + 1, y + h - 1)], INK)
    line(img, [(x, y - 1), (x, y + h)], INK)
    line(img, [(x + w - 1, y), (x + w - 1, y + h - 1)], INK)
    # podziałki co 25%
    for q in (0.25, 0.5, 0.75):
        qx = x + int(w * q)
        line(img, [(qx, y + h - 3), (qx, y + h - 1)], INK)
    if low:
        text(img, (x + w + 6, y - 6), "!", F_HEAD(22), RED)


def ink_clock(img, cx, cy, r, hour):
    d = ImageDraw.Draw(img)
    # noc (18-6) zakreskowana
    for yy in range(cy - r, cy + r + 1):
        for xx in range(cx - r, cx + r + 1):
            dx, dy = xx - cx, yy - cy
            if dx * dx + dy * dy <= (r - 4) ** 2:
                a = (math.degrees(math.atan2(dx, -dy)) + 360) % 360   # 0 = góra (12)
                h = a / 360 * 24  # tarcza 24-godzinna: południe u góry
                if (h > 7 and h < 17):
                    continue
                if (xx + yy) % 4 == 0:
                    d.point((xx, yy), fill=hexc(INK3))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=hexc(INK))
    d.ellipse((cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3), outline=hexc(INK2))
    f = F_BODY(11, 700)
    for i in range(24):
        a = math.radians(i * 15)
        ln = 5 if i % 6 == 0 else 2
        x0 = cx + math.sin(a) * (r - 3); y0 = cy - math.cos(a) * (r - 3)
        x1 = cx + math.sin(a) * (r - 3 - ln); y1 = cy - math.cos(a) * (r - 3 - ln)
        d.line((x0, y0, x1, y1), fill=hexc(INK))
    for lab, i in (("XII", 0), ("VI", 6), ("XVIII", 12), ("XXIV", 18)):
        pass
    # słońce w miejscu godziny (tarcza 24 h: 12 na górze)
    a = math.radians(((hour - 12) % 24) * 15)
    sx = cx + math.sin(a) * (r - 14); sy = cy - math.cos(a) * (r - 14)
    d.line((cx, cy, sx, sy), fill=hexc(INK), width=2)
    d.ellipse((sx - 6, sy - 6, sx + 6, sy + 6), fill=hexc("#e8b23a"), outline=hexc(INK))
    for k in range(8):
        b = math.radians(k * 45)
        d.line((sx + math.cos(b) * 8, sy + math.sin(b) * 8, sx + math.cos(b) * 10, sy + math.sin(b) * 10), fill=hexc(INK))
    d.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=hexc(RED))
    # księżyc po drugiej stronie (blado)
    mx = cx - math.sin(a) * (r - 14); my = cy + math.cos(a) * (r - 14)
    d.ellipse((mx - 4, my - 4, mx + 4, my + 4), outline=hexc(INK3))
    d.ellipse((mx - 1, my - 5, mx + 6, my + 3), fill=None)


def scroll_banner(img, cx, y, label):
    f = F_HEAD(28)
    w = tw(label, f) + 48; h = 36
    x = cx - w // 2
    # końce wstęgi (ciemniejsze, z wcięciem "V" na zewnątrz)
    th = h - 10; mid = (th - 1) / 2
    yy, xx = np.mgrid[0:th, 0:34]
    for side in (-1, 1):
        outer = xx if side < 0 else 33 - xx
        depth = 9 - np.abs(yy - mid) * 9 / mid
        mm = outer >= depth
        tail = Image.new("RGBA", (34, th), (0, 0, 0, 0))
        paint(tail, mm, "#a8824e")
        paint(tail, mm & (yy == th - 1 - 0), "#8a6236")
        paint(tail, ring(mm), "#5e3e1e")
        ex = x - 26 if side < 0 else x + w - 8
        img.alpha_composite(tail, (ex, y + 8))
        # zagięcie (cień pod wstęgą)
        rect(img, ((x - 2) if side < 0 else (x + w - 6), y + 8 + th - 4, (x + 6) if side < 0 else (x + w + 2), y + 8 + th - 1), "#4a2e14")
    p, m = parchment(w, h, seed=11, amp=1)
    hard_shadow(img, m, (x, y), (2, 3), (0, 0, 0, 80))
    img.alpha_composite(p, (x, y))
    text(img, (cx, y + h // 2 + 1), label, f, INK, anchor="mm")


def sepia_map():
    mm = minimap().convert("L")
    a = np.asarray(mm, np.float32) / 255
    a = (a - a.min()) / max(1e-6, a.max() - a.min())
    img = quant(a, ["#4e3820", "#8a6a40", "#bf9f6c", "#ead7aa"], cuts=[0.33, 0.45, 0.6])
    return img


def hud():
    img = bg_map()
    # ---- lewy górny skrawek: zegar dnia, pora, ciężar, paski
    p, m = parchment(250, 238, seed=4)
    soft_shadow(img, m, (8, 6), (3, 4), 90, 3)
    img.alpha_composite(p, (8, 6))
    ink_clock(img, 8 + 58, 6 + 56, 46, D["hand"])
    text(img, (126, 14), D["phase"], F_HEAD(30), INK)
    text(img, (127, 50), "dzień 40 · lato", F_BODY(16, 600), INK2)
    put(img, icon(370), (122, 70))
    text(img, (157, 78), "41 / 120", F_BODY(17, 700), INK)
    rows = [("health", icon_bare(84), D["health"]), ("stamina", icon_bare(82), D["stamina"]), ("food", icon(390), D["food"]), ("water", icon(391), D["water"])]
    for i, (k, ic, v) in enumerate(rows):
        y = 116 + i * 30
        put(img, ic, (16, y - 2))
        hatch_bar(img, 56, y + 8, 168, 12, v, INKS[k], low=(k == "water"))
    # ---- nazwa miejsca: wstęga
    scroll_banner(img, 640, 8, D["map"])
    # ---- prawy górny: mapa na pergaminie + cel z pieczęcią
    p, m = parchment(220, 176, seed=9)
    soft_shadow(img, m, (1050, 6), (3, 4), 90, 3)
    img.alpha_composite(p, (1050, 6))
    sm = sepia_map()
    img.alpha_composite(sm, (1063, 20))
    rect(img, (1062, 19, 1063 + sm.width, 20 + sm.height), None, INK)
    d = ImageDraw.Draw(img)
    hx, hy = 1063 + 134, 20 + 45
    d.line((hx - 4, hy - 4, hx + 4, hy + 4), fill=hexc(RED), width=2); d.line((hx - 4, hy + 4, hx + 4, hy - 4), fill=hexc(RED), width=2)
    # róża wiatrów
    cx, cy = 1238, 150
    d.polygon([(cx, cy - 11), (cx + 3, cy), (cx, cy + 4), (cx - 3, cy)], fill=hexc(INK))
    d.polygon([(cx, cy + 11), (cx + 3, cy), (cx, cy - 4), (cx - 3, cy)], outline=hexc(INK))
    text(img, (cx, cy - 20), "N", F_BODY(12, 800), INK, anchor="mm")
    p, m = parchment(220, 100, seed=15)
    soft_shadow(img, m, (1050, 188), (3, 4), 90, 3)
    img.alpha_composite(p, (1050, 188))
    img.alpha_composite(wax_seal(26, 5, "C"), (1040, 178))
    text(img, (1078, 194), "Cel", F_HEAD(22), RED)
    text(img, (1062, 222), D["goal"], F_BODY(17, 800), INK)
    for k, ln in enumerate(wrap(D["goal_sub"], F_BODY(14, 500), 196)[:2]):
        text(img, (1062, 245 + k * 17), ln, F_BODY(14, 500), INK2)
    # ---- dymek nad bohaterem
    f = F_BODY(17, 700)
    w_ = tw(D["popup"], f) + 50
    p, m = parchment(w_, 34, seed=21, amp=2)
    x = D["hero"][0] - w_ // 2; y = D["hero"][1] - 78
    hard_shadow(img, m, (x, y), (2, 2), (0, 0, 0, 70))
    img.alpha_composite(p, (x, y))
    put(img, icon(391), (x + 6, y + 1))
    text(img, (x + 40, y + 7), D["popup"], f, INK)
    # ---- zdobycze: paski pergaminu
    for i, (ic, s) in enumerate(D["gains"]):
        f = F_BODY(19, 700)
        w_ = tw(s, f) + 58
        y = 556 + i * 40
        x = 1268 - w_ - (i % 2) * 6
        p, m = parchment(w_, 34, seed=30 + i, amp=2)
        hard_shadow(img, m, (x, y), (2, 2), (0, 0, 0, 70))
        img.alpha_composite(p, (x, y))
        put(img, icon(ic), (x + 8, y + 1))
        text(img, (x + 46, y + 6), s, f, INK)
    # ---- doświadczenie: pieczęć z poziomem i pasek
    p, m = parchment(250, 24, seed=40, amp=1)
    img.alpha_composite(p, (1018, 686))
    hatch_bar(img, 1050, 692, 208, 10, D["xp"], "#8a5a1e")
    img.alpha_composite(wax_seal(30, 8, "6"), (1000, 676))
    return img


def window():
    img = bg_menu(0.5, 2.0, (20, 10, 0))
    X, Y, BW, BH = 120, 74, 1040, 570
    d = ImageDraw.Draw(img)
    # ---- zakładki-wstążki nad księgą
    tabs = JTABS
    tx = X + 40
    ftab = F_BODY(16, 700)
    cols = ["#7a2a1e", "#4a5a2a", "#2d4a6a", "#6a4a1e", "#5a3a5a", "#3a5a5a", "#6a5a2a", "#4a3a2a"]
    for i, t in enumerate(tabs):
        w_ = tw(t, ftab) + 26
        act = i == 0
        h_ = 40 if act else 30
        y_ = Y - h_ + 8
        col = RED if act else mix(cols[i], "#000000", 0.15)
        rect(img, (tx, y_, tx + w_, Y + 12), col)
        rect(img, (tx, y_, tx + w_, y_), mix(col, "#ffffff", 0.25))
        line(img, [(tx, y_), (tx, Y + 12)], "#1e120a"); line(img, [(tx + w_, y_), (tx + w_, Y + 12)], "#1e120a")
        line(img, [(tx, y_ - 1), (tx + w_, y_ - 1)], "#1e120a")
        text(img, (tx + w_ // 2, y_ + 15), t, ftab, "#f3dfb0" if act else "#d9c49a", anchor="mm")
        tx += w_ + 6
    # ---- okładka
    cover = Image.new("RGBA", (BW, BH), (0, 0, 0, 0))
    cm = round_mask(BW, BH, 10)
    n = noise(BW, BH, cell=30, seed=2, octaves=3)
    paint_tex(cover, cm, quant(n, ["#3a2214", "#46291a", "#52301e"], cuts=[0.35, 0.7]))
    paint(cover, ring(cm, 1), "#170c06")
    paint(cover, ring(erode(cm, 1), 1), "#6a4128")
    soft_shadow(img, cm, (X, Y), (6, 10), 150, 8)
    img.alpha_composite(cover, (X, Y))
    # mosiężne narożniki
    for (cx, cy, sx, sy) in ((X, Y, 1, 1), (X + BW - 1, Y, -1, 1), (X, Y + BH - 1, 1, -1), (X + BW - 1, Y + BH - 1, -1, -1)):
        pts = [(cx, cy), (cx + sx * 34, cy), (cx, cy + sy * 34)]
        d.polygon(pts, fill=hexc("#b08a3a"), outline=hexc("#3a2810"))
        d.line((cx + sx * 4, cy + sy * 24, cx + sx * 24, cy + sy * 4), fill=hexc("#e0c070"))
    # ---- strony
    PW = (BW - 40) // 2
    pages = []
    for k in range(2):
        px = X + 18 + k * (PW + 4); py = Y + 14
        # krawędzie kartek (stos)
        for s in range(3, 0, -1):
            off = s * 2
            rect(img, (px + (off if k == 1 else -off), py + off, px + PW - 1 + (off if k == 1 else -off), py + BH - 30 + off), "#d9c08e" if s % 2 else "#b8995e")
        p, m = parchment(PW, BH - 30, seed=50 + k, amp=0, torn=False, burnt=False, soft=True)
        img.alpha_composite(p, (px, py))
        pages.append((px, py))
    # cień grzbietu
    gx = X + 18 + PW + 2
    for i, c in enumerate(["#8a6a3e", "#a8865a", "#bfa070", "#cfb284"]):
        a = 1 + i * 4
        rect(img, (gx - 2 - a - 3, Y + 14, gx - 2 - a, Y + BH - 17), c)
        rect(img, (gx + 2 + a, Y + 14, gx + 2 + a + 3, Y + BH - 17), c)
    rect(img, (gx - 3, Y + 10, gx + 3, Y + BH - 14), "#3a2214")
    # ---- lewa strona: lista celów
    lx, ly = pages[0]
    text(img, (lx + 34, ly + 14), "Cele", F_HEAD(40), RED)
    text(img, (lx + 140, ly + 32), "Rozdział I · Dług dziadka", F_BODY(17, 600), INK2)
    d.line((lx + 34, ly + 66, lx + PW - 34, ly + 66), fill=hexc(INK))
    cxm = lx + PW // 2
    d.polygon([(cxm, ly + 62), (cxm + 5, ly + 66), (cxm, ly + 70), (cxm - 5, ly + 66)], fill=hexc(RED))
    fl = F_BODY(19, 600)
    for i, (ic, name, done) in enumerate(GOALS):
        y = ly + 82 + i * 42
        if i == 0:
            # czerwona podmalówka pod wybranym wierszem + wskazująca rączka (☞) piórem
            wm = torn_mask(PW - 70, 36, amp=2, seed=77)
            paint(img, wm, mix("#c4432f", PARCH[2], 0.72), (lx + 40, y - 2))
            fh = F_BODY(26, 700)
            text(img, (lx + 12, y + 2), "☞", font("Alegreya.ttf", 28), RED) if False else None
            d.polygon([(lx + 16, y + 8), (lx + 30, y + 16), (lx + 16, y + 24)], fill=hexc(RED), outline=hexc("#5e130c"))
        # pole wyboru piórem
        bx, by = lx + 46, y + 9
        d.rectangle((bx, by, bx + 14, by + 14), outline=hexc(INK))
        if done:
            d.line((bx + 2, by + 7, bx + 6, by + 12, bx + 16, by - 3), fill=hexc(RED), width=2)
        put(img, icon(ic), (lx + 70, y + 1))
        text(img, (lx + 110, y + 6), name, fl, INK3 if done else INK)
        if done:
            line(img, [(lx + 108, y + 19), (lx + 110 + tw(name, fl) + 2, y + 18)], INK2)
    text(img, (lx + PW // 2, ly + BH - 64), "— wykonano 41 z 77 celów —", F_BODY(15, 600), INK2, anchor="mm")
    # ---- prawa strona: opis z inicjałem
    rx, ry = pages[1]
    put(img, icon(337), (rx + 34, ry + 22))
    text(img, (rx + 74, ry + 14), D["goal"], F_HEAD(36), INK)
    text(img, (rx + 36, ry + 62), "Rozdział I · Dług dziadka", F_BODY(16, 600), INK2)
    d.line((rx + 34, ry + 88, rx + PW - 34, ry + 88), fill=hexc(INK))
    # iluminowany inicjał
    ix, iy = rx + 36, ry + 104
    rect(img, (ix, iy, ix + 58, iy + 58), "#2d4a7a")
    rect(img, (ix + 3, iy + 3, ix + 55, iy + 55), "#c99a2e")
    rect(img, (ix + 6, iy + 6, ix + 52, iy + 52), "#2d4a7a")
    for k in range(0, 46, 6):
        d.point((ix + 9 + k, iy + 9), fill=hexc("#c99a2e")); d.point((ix + 9, iy + 9 + k), fill=hexc("#c99a2e"))
    text(img, (ix + 30, iy + 31), "B", F_HEAD(50), "#f3e2b8", anchor="mm")
    body = "orgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy. Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim."
    fb = F_BODY(19, 500)
    lines = wrap(body, fb, PW - 140)
    y = iy - 2
    for k, ln in enumerate(lines):
        if k == 3:
            break
        text(img, (ix + 68, y), ln, fb, INK); y += 24
    rest = " ".join(lines[3:])
    for ln in wrap(rest, fb, PW - 72):
        text(img, (ix, y), ln, fb, INK); y += 24
    y += 14
    text(img, (rx + 36, y), "Skąd wziąć", F_HEAD(26), RED); y += 36
    put(img, icon(353), (rx + 36, y - 4))
    text(img, (rx + 76, y), "Browar: Warz piwo", F_BODY(18, 600), INK); y += 40
    text(img, (rx + 36, y), "Nagroda", F_HEAD(26), RED); y += 36
    text(img, (rx + 36, y), "+50 doświadczenia, praca u Borgara", F_BODY(18, 600), INK); y += 44
    d.line((rx + 36, y, rx + 120, y), fill=hexc(INK3))
    text(img, (rx + 36, y + 10), "Enter: przypnij cel do skrawka na ekranie.", F_BODY(15, 500), INK3)
    text(img, (rx + PW // 2, ry + BH - 64), "— dzień 40 · lato · 11:05 —", F_BODY(15, 600), INK2, anchor="mm")
    # ---- podpowiedzi klawiszy pod księgą (małe pieczęcie)
    hx = X + 40
    for key, lab in (("←→", "zakładka"), ("↑↓", "wybierz"), ("Enter", "przypnij"), ("Esc", "zamknij")):
        fk = F_BODY(15, 800)
        kw = tw(key, fk) + 16
        p, m = parchment(kw, 24, seed=hx, amp=1)
        img.alpha_composite(p, (hx, Y + BH + 10))
        text(img, (hx + kw // 2, Y + BH + 22), key, fk, INK, anchor="mm")
        text(img, (hx + kw + 8, Y + BH + 13), lab, F_BODY(16, 600), "#efdeb4")
        hx += kw + tw(lab, F_BODY(16, 600)) + 30
    return img


if __name__ == "__main__":
    print(save(hud(), "pomysl_1_kronika_hud.png"))
    print(save(window(), "pomysl_1_kronika_okno.png"))
