# Pomysł 4 (runda 2): LEN I ATRAMENT - schludny, jasny, typograficzny. Kremowe karty jak dobrze złożona książka:
# szeryfowa EB Garamond, linie 1 px atramentem, czerwień rubryk jako jedyny akcent, dużo powietrza.
# Paski: 4 pierścienie z ikoną w środku (lewy dół). Zapis gry z miniaturami miejsc.
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from common2 import *

PAPER = (243, 238, 226, 238); PAPER2 = (236, 229, 214, 255); INK = "#2b2620"; INK2 = "#6b6254"; INK3 = "#a79e8e"
RULE = (59, 51, 42, 255); HAIR = (190, 180, 162, 255); RED = "#a23a22"
COL = {"health": "#b8382e", "stamina": "#5a8a32", "food": "#c8861e", "water": "#2f6fb0"}
FG = lambda s, w=500: font("EBGaramond.ttf", s, w)
FC = lambda s: font("CormorantSC-Bold.ttf", s)


def sc(img, xy, s, size=14, fill=RED, anchor="l", sp=2):
    return spaced(img, xy, s.lower(), FC(size), fill, sp=sp, anchor=anchor)


def card(img, box, r=4, shadow=60):
    rpanel(img, box, PAPER, RULE, r=r, shadow=shadow)


def clock(img, cx, cy, r, hour):
    d = ImageDraw.Draw(img)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PAPER2, outline=hexc(INK))
    with Over(img) as o:
        o.ellipse((cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3), outline=HAIR)
    for k in range(12):
        a = math.radians(k * 30)
        L = 4 if k % 3 == 0 else 2
        x0, y0 = cx + math.sin(a) * (r - 4), cy - math.cos(a) * (r - 4)
        x1, y1 = cx + math.sin(a) * (r - 4 - L), cy - math.cos(a) * (r - 4 - L)
        d.line((x0, y0, x1, y1), fill=hexc(INK), width=1)
    (hx, hy), (mx, my) = hand_pts(cx, cy, hour, r * 0.5, r * 0.76)
    d.line((cx, cy, hx, hy), fill=hexc(INK), width=3)
    d.line((cx, cy, mx, my), fill=hexc(INK), width=1)
    d.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=hexc(RED))
    # pora dnia: czerwona kropka na zewnętrznej obręczy (24 h, południe u góry)
    a = math.radians(((hour - 12) % 24) * 15)
    sx, sy = cx + math.sin(a) * (r + 5), cy - math.cos(a) * (r + 5)
    d.ellipse((sx - 3, sy - 3, sx + 3, sy + 3), fill=hexc(RED))


def compass(img):
    c = G["compass"]; cx, cy, r = c["cx"], c["cy"], c["r"]
    with Over(img) as o:
        o.ellipse((cx - r + 1, cy - r + 3, cx + r + 1, cy + r + 4), fill=(0, 0, 0, 60))
        o.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PAPER, outline=RULE)
        o.ellipse((cx - r + 4, cy - r + 4, cx + r - 4, cy + r - 4), outline=HAIR)
    d = ImageDraw.Draw(img)
    for k in range(0, 360, 10):
        if k % 90 == 0:
            continue
        a = math.radians(k)
        L = 4 if k % 30 == 0 else 2
        x0, y0 = cx + math.sin(a) * (r - 4), cy - math.cos(a) * (r - 4)
        x1, y1 = cx + math.sin(a) * (r - 4 - L), cy - math.cos(a) * (r - 4 - L)
        d.line((x0, y0, x1, y1), fill=hexc(INK3 if L == 2 else INK2))
    for lab, deg in (("N", 0), ("E", 90), ("S", 180), ("W", 270)):
        x, y = compass_dir(cx, cy, r - 15, deg)
        text(img, (x, y - 1), lab, FG(16, 700), RED if lab == "N" else INK, anchor="mm")
    ang = c["angle"]
    tip = compass_dir(cx, cy, r - 4, ang)
    b1 = compass_dir(cx, cy, r - 14, ang - 8); b2 = compass_dir(cx, cy, r - 14, ang + 8)
    e = compass_dir(cx, cy, r - 14, ang)
    d.line((cx, cy, e[0], e[1]), fill=hexc(INK), width=1)
    d.polygon([tip, b1, b2], fill=hexc(RED))
    d.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=hexc(INK))
    f = FG(17, 600)
    lab = c["label"]
    w_ = tw(lab, f) + 24
    y0 = cy + r + 10
    card(img, (1272 - w_, y0, 1272, y0 + 28), r=3, shadow=50)
    text(img, (1272 - w_ / 2, y0 + 13), lab, f, INK, anchor="mm")
    card(img, (1170, y0 + 36, 1272, y0 + 70), r=3, shadow=50)
    put(img, icon(370), (1236, y0 + 37))
    text(img, (1230, y0 + 52), G["load"], FG(17, 600), INK, anchor="rm")


def rings(img, x0=12, y0=640):
    card(img, (x0, y0, x0 + 252, y0 + 68), r=34)
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        cx, cy = x0 + 34 + i * 61, y0 + 34
        ring_gauge(img, cx, cy, 25, v, hexc(COL[k]), HAIR, width=4)
        put(img, need_icon(k), (cx - 16, cy - 16))
        if k == "water":
            d = ImageDraw.Draw(img)
            d.ellipse((cx + 16, cy - 26, cx + 24, cy - 18), fill=hexc(RED), outline=hexc(PAPER[:3]))


def hud():
    img = bg2()
    f = FG(21, 600)
    w_ = 78 + tw(G["goal"], f) + 60
    card(img, (12, 12, 12 + w_, 78))
    clock(img, 45, 45, 24, G["hour"])
    with Over(img) as o:
        o.line((84, 22, 84, 68), fill=HAIR)
    sc(img, (98, 17), "Cel", 14)
    put(img, icon(G["goal_icon"]), (96, 38))
    text(img, (134, 54), G["goal"], f, INK, anchor="lm")
    # nazwa miejsca
    s = "Pole dziadka"
    ff = FC(24)
    tot = sum(tw(ch, ff) if ch != " " else tw("n", ff) for ch in s.lower()) + 3 * (len(s) - 1)
    card(img, (640 - tot / 2 - 26, 10, 640 + tot / 2 + 26, 48), r=19, shadow=50)
    spaced(img, (640, 13), s.lower(), ff, INK, sp=3, anchor="m")
    compass(img)
    rings(img)
    f = FG(18, 600)
    w_ = tw(G["popup"], f) + 52
    x = G["hero"][0] - w_ // 2; y = G["hero"][1] - 78
    card(img, (x, y, x + w_, y + 32), r=16, shadow=50)
    put(img, icon(391), (x + 6, y))
    text(img, (x + 40, y + 15), G["popup"], f, INK, anchor="lm")
    for i, (ic, s_) in enumerate(G["gains"]):
        f = FG(18, 600)
        w_ = tw(s_, f) + 56
        y = 604 + i * 38
        card(img, (1270 - w_, y, 1270, y + 32), r=16, shadow=50)
        put(img, icon(ic), (1270 - w_ + 6, y))
        text(img, (1270 - w_ + 44, y + 15), s_, f, INK, anchor="lm")
    return img


# ------------------------------------------------------------------ okna
def window(img, title, sub, X=140, Y=56, PW=1000, PH=608):
    card(img, (X, Y, X + PW, Y + PH), r=4, shadow=110)
    with Over(img) as o:
        o.rectangle((X + 6, Y + 6, X + PW - 6, Y + PH - 6), outline=HAIR)
    text(img, (X + 40, Y + 46), title, FG(36, 600), INK, anchor="lm")
    if sub:
        text(img, (X + PW - 40, Y + 48), sub, FG(18, 500), INK2, anchor="rm")
    with Over(img) as o:
        o.line((X + 40, Y + 80, X + PW - 40, Y + 80), fill=RULE)
        o.line((X + 40, Y + 83, X + PW - 40, Y + 83), fill=HAIR)
        o.line((X + 40, Y + PH - 54, X + PW - 40, Y + PH - 54), fill=HAIR)
    return X, Y, PW, PH


def tabs(img, x, y, names, act=0):
    f = FC(16)
    for i, n in enumerate(names):
        w_ = spaced(img, (x, y), n.lower(), f, RED if i == act else INK2, sp=2)
        if i == act:
            with Over(img) as o:
                o.line((x, y + 26, x + w_, y + 26), fill=hexc(RED))
        x += w_ + 30


def foot(img, X, Y, PW, PH, pairs, right=None):
    keycaps(img, X + 40, Y + PH - 40, pairs, FG(16, 600), RULE, PAPER2, INK, INK2, h=24, r=3)
    if right:
        text(img, (X + PW - 40, Y + PH - 28), right, FG(17, 600), RED, anchor="rm")


def journal():
    img = bg_menu2(0.45, 2.5, (20, 14, 6))
    X, Y, PW, PH = window(img, "Dziennik", "Dzień czterdziesty · lato · 11:01")
    tabs(img, X + 40, Y + 98, JTABS)
    lx, ly = X + 40, Y + 144
    for i, (ic, name, done) in enumerate(GOALS):
        y = ly + i * 40
        if i == 0:
            with Over(img) as o:
                o.rectangle((lx - 10, y - 2, lx + 420, y + 36), fill=(162, 58, 34, 26))
                o.rectangle((lx - 10, y - 2, lx - 8, y + 36), fill=hexc(RED))
        put(img, icon(ic), (lx, y + 1))
        text(img, (lx + 44, y + 17), name, FG(19, 600 if i == 0 else 500), INK3 if done else INK, anchor="lm")
        if done:
            with Over(img) as o:
                o.line((lx + 44, y + 19, lx + 44 + tw(name, FG(19)), y + 19), fill=hexc(INK3))
            text(img, (lx + 420, y + 17), "dzień 31", FG(15, 500), INK3, anchor="rm")
    with Over(img) as o:
        o.line((X + 492, Y + 140, X + 492, Y + PH - 70), fill=HAIR)
    rx, ry, rw = X + 524, Y + 140, PW - 524 - 40
    sc(img, (rx, ry), "Rozdział I · Dług dziadka", 15)
    text(img, (rx, ry + 44), "Znajdź pracę", FG(34, 600), INK, anchor="lm")
    text(img, (rx, ry + 82), "w tawernie", FG(34, 600), INK, anchor="lm")
    y = ry + 116
    # inicjał rubrykowy
    text(img, (rx, y - 6), "B", FG(58, 600), RED)
    body = wrapf("orgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy.", FG(19), rw - 50)
    for k, ln in enumerate(body):
        text(img, (rx + 46, y + k * 27), ln, FG(19), INK)
    y += max(2, len(body)) * 27
    for ln in wrapf("Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim.", FG(19), rw):
        text(img, (rx, y), ln, FG(19), INK); y += 27
    y += 16
    sc(img, (rx, y), "Skąd wziąć", 14); y += 30
    put(img, icon(353), (rx, y - 4)); text(img, (rx + 42, y + 12), "Browar: Warz piwo", FG(18, 600), INK, anchor="lm"); y += 44
    sc(img, (rx, y), "Kierunek", 14); y += 30
    text(img, (rx, y + 6), "Tawerna · sto pięćdziesiąt jeden kroków", FG(18, 500), INK, anchor="lm")
    foot(img, X, Y, PW, PH, [("←→", "zakładka"), ("↑↓", "wybierz"), ("Enter", "śledź"), ("Esc", "wróć")], "Wykonano 41 z 77")
    return img


def bag():
    img = bg_menu2(0.45, 2.5, (20, 14, 6))
    X, Y, PW, PH = window(img, "Plecak", "Obciążenie 41 / 120 · 330 monet")
    tabs(img, X + 40, Y + 98, ["Wszystko", "Materiały", "Jedzenie", "Narzędzia"])
    lx, ly, lw = X + 40, Y + 142, 470
    groups = [("Materiały", [0, 1, 4, 5, 6, 7]), ("Jedzenie", [8, 9, 10, 11])]
    y = ly
    selname = "Jagody"
    f = FG(19)
    for gname, idx in groups:
        sc(img, (lx, y), gname, 13, INK2); y += 24
        for i in idx:
            _, name, ic, n = BAG[i]
            if name == selname:
                with Over(img) as o:
                    o.rectangle((lx - 10, y - 2, lx + lw, y + 29), fill=(162, 58, 34, 26))
                    o.rectangle((lx - 10, y - 2, lx - 8, y + 29), fill=hexc(RED))
            put(img, icon(ic), (lx, y - 2))
            text(img, (lx + 40, y + 13), name, f, INK, anchor="lm")
            nw = tw(name, f)
            # kropki prowadzące do liczby (jak w spisie treści)
            d = ImageDraw.Draw(img)
            for k in range(int(lx + 48 + nw), int(lx + lw - 40), 6):
                d.point((k, y + 19), fill=hexc(INK3))
            text(img, (lx + lw, y + 13), str(n), FG(19, 600), INK, anchor="rm")
            y += 32
        y += 6
    text(img, (lx + lw / 2, y + 6), "niżej: nasiona, strzały i 3 inne…", FG(16, 500), INK3, anchor="mm")
    with Over(img) as o:
        o.line((X + 540, Y + 140, X + 540, Y + PH - 70), fill=HAIR)
    rx, ry, rw = X + 572, Y + 140, PW - 572 - 40
    put(img, icon(358, 2), (rx, ry))
    sc(img, (rx + 82, ry + 4), "Jedzenie", 14)
    text(img, (rx + 82, ry + 44), "Jagody", FG(34, 600), INK, anchor="lm")
    y = ry + 90
    for lab, val in (("Masz", "6"), ("Waga", "1"), ("Świeżość", "jeszcze 3 dni")):
        text(img, (rx, y), lab, FG(18), INK2, anchor="lm")
        text(img, (rx + rw, y), val, FG(18, 600), "#3f6a1e" if lab == "Świeżość" else INK, anchor="rm")
        with Over(img) as o:
            o.line((rx, y + 15, rx + rw, y + 15), fill=HAIR)
        y += 34
    y += 8
    for ln in wrapf("Dzikie jagody. Słodkie i sycące, ale na chwilę. Dobre na drogę, gdy nie ma ognia.", FG(19), rw):
        text(img, (rx, y), ln, FG(19), INK); y += 27
    y += 10
    text(img, (rx, y), "Kondycja +8 · sytość +8 · woda +10", FG(17, 500), INK2); y += 46
    rpanel(img, (rx, y, rx + 150, y + 36), hexc(INK), None, r=3, shadow=0)
    text(img, (rx + 75, y + 17), "Zjedz", FG(19, 600), "#f3eee2", anchor="mm")
    rpanel(img, (rx + 162, y, rx + 300, y + 36), None, RULE, r=3, shadow=0)
    text(img, (rx + 231, y + 17), "Wyrzuć", FG(19, 500), INK, anchor="mm")
    foot(img, X, Y, PW, PH, [("↑↓", "wybierz"), ("←→", "zakładka"), ("Enter", "użyj"), ("Esc", "wróć")], "15 rzeczy")
    return img


def save_screen():
    img = bg_menu2(0.45, 2.5, (20, 14, 6))
    X, Y, PW, PH = window(img, "Zapisz grę", "W którym pliku zapisać?")
    day = bg2(); night = bg2(night=True)
    slots = [("Autozapis", "Dzień 40 · lato · 06:00", "Pole dziadka · po przespanej nocy", (day, (380, 120))),
             ("Plik 1", "Dzień 40 · lato · 11:01", "Pole dziadka · czas gry 14:22", (day, (520, 240))),
             ("Plik 2", "Dzień 38 · lato · 21:30", "Pole dziadka · wieczór · czas gry 13:05", (night, (300, 260))),
             ("Plik 3", None, None, None)]
    y = Y + 104
    for i, (name, l1, l2, th) in enumerate(slots):
        sel = i == 1
        bx0, bx1 = X + 40, X + PW - 40
        if sel:
            with Over(img) as o:
                o.rectangle((bx0, y, bx1, y + 96), fill=(162, 58, 34, 22), outline=hexc(RED))
        else:
            with Over(img) as o:
                o.rectangle((bx0, y, bx1, y + 96), outline=HAIR)
        if th:
            im, (cx, cy) = th
            crop = im.crop((cx, cy, cx + 320, cy + 180)).resize((152, 86), Image.LANCZOS)
            img.alpha_composite(crop, (bx0 + 6, y + 5))
            with Over(img) as o:
                o.rectangle((bx0 + 5, y + 4, bx0 + 158, y + 91), outline=RULE)
            text(img, (bx0 + 184, y + 22), name, FG(24, 600), INK, anchor="lm")
            text(img, (bx0 + 184, y + 52), l1, FG(19, 600), INK, anchor="lm")
            text(img, (bx0 + 184, y + 77), l2, FG(17, 500), INK2, anchor="lm")
            text(img, (bx1 - 16, y + 22), ["08.10.2026, 06:00", "08.10.2026, 11:40", "07.10.2026, 22:15"][i], FG(16, 500), INK3, anchor="rm")
        else:
            with Over(img) as o:
                o.rectangle((bx0 + 5, y + 4, bx0 + 158, y + 91), outline=HAIR)
            text(img, (bx0 + 82, y + 48), "pusty", FG(17, 500), INK3, anchor="mm")
            text(img, (bx0 + 184, y + 22), name, FG(24, 600), INK3, anchor="lm")
        if sel:
            sc(img, (bx1 - 16, y + 66), "Zapisz tutaj", 14, RED, anchor="r")
        y += 106
    foot(img, X, Y, PW, PH, [("↑↓", "wybierz"), ("Enter", "zapisz"), ("Esc", "wróć")], None)
    return img


if __name__ == "__main__":
    print(save2(hud(), "pomysl_4_len_hud.png"))
    print(save2(journal(), "pomysl_4_len_dziennik.png"))
    print(save2(bag(), "pomysl_4_len_plecak.png"))
    print(save2(save_screen(), "pomysl_4_len_zapis.png"))
