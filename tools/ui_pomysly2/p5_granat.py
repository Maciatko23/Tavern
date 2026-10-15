# Pomysł 5 (runda 2): GRANAT I ZŁOTO - schludny, klasyczny, symetryczny. Głęboki granat nocy, złota linia włoskowa,
# kapitaliki Cormorant, jedyny ornament = maleńkie romby w narożnikach. Paski: ikony napełniające się (lewy dół).
import math
import numpy as np
from PIL import Image, ImageDraw
from common2 import *

NAVY = (16, 22, 36, 228); NAVY2 = (22, 30, 48, 255); GOLD = "#d4b26a"; GOLD_L = (212, 178, 106, 200); GOLD_D = (212, 178, 106, 90)
TXT = "#efe9dc"; MUT = "#9aa3b4"; DIMC = (64, 78, 106)
FC = lambda s: font("CormorantSC-Bold.ttf", s)
FCo = lambda s, w=600: font("Cormorant.ttf", s, w)
FR = lambda s: font("AlegreyaSans-Regular.ttf", s)
FM = lambda s: font("AlegreyaSans-Medium.ttf", s)


def sc(img, xy, s, size=15, fill=GOLD, anchor="l", sp=3):
    return spaced(img, xy, s.lower(), FC(size), fill, sp=sp, anchor=anchor)


def diamond(o, x, y, r=3, fill=GOLD):
    o.polygon([(x, y - r), (x + r, y), (x, y + r), (x - r, y)], fill=hexc(fill) if isinstance(fill, str) else fill)


def npanel(img, box, r=6, corners=True, shadow=70):
    rpanel(img, box, NAVY, GOLD_D, r=r, shadow=shadow)
    x0, y0, x1, y1 = box
    with Over(img) as o:
        o.rounded_rectangle((x0 + 3, y0 + 3, x1 - 3, y1 - 3), radius=max(1, r - 2), outline=GOLD_L)
        if corners:
            for (x, y) in ((x0 + 3, y0 + 3), (x1 - 3, y0 + 3), (x0 + 3, y1 - 3), (x1 - 3, y1 - 3)):
                diamond(o, x, y, 3)


def rule(img, cx, y, half, gap=10):
    with Over(img) as o:
        o.line((cx - half, y, cx - gap, y), fill=GOLD_L)
        o.line((cx + gap, y, cx + half, y), fill=GOLD_L)
        diamond(o, cx, y, 4)


def clock(img, cx, cy, r, hour):
    with Over(img) as o:
        o.ellipse((cx - r, cy - r, cx + r, cy + r), fill=NAVY2, outline=GOLD_L)
        o.ellipse((cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3), outline=GOLD_D)
        # okienko pory dnia (dół tarczy): niebo z słońcem
        o.pieslice((cx - 11, cy + 4, cx + 11, cy + 26), 180, 360, fill=(70, 120, 170, 255))
        o.line((cx - 11, cy + 15, cx + 11, cy + 15), fill=GOLD_L)
        o.ellipse((cx - 3, cy + 7, cx + 3, cy + 13), fill=hexc("#ffd878"))
        for k in range(4):
            a = math.radians(k * 90)
            diamond(o, cx + math.sin(a) * (r - 7), cy - math.cos(a) * (r - 7), 2)
        for k in range(12):
            if k % 3 == 0:
                continue
            a = math.radians(k * 30)
            o.point((cx + math.sin(a) * (r - 7), cy - math.cos(a) * (r - 7)), fill=GOLD_L)
    d = ImageDraw.Draw(img)
    (hx, hy), (mx, my) = hand_pts(cx, cy, hour, r * 0.48, r * 0.74)
    d.line((cx, cy, hx, hy), fill=hexc(GOLD), width=3)
    d.line((cx, cy, mx, my), fill=hexc(TXT), width=1)
    d.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=hexc(GOLD))


def compass(img):
    c = G["compass"]; cx, cy, r = c["cx"], c["cy"], c["r"]
    with Over(img) as o:
        o.ellipse((cx - r + 1, cy - r + 3, cx + r + 1, cy + r + 4), fill=(0, 0, 0, 70))
        o.ellipse((cx - r, cy - r, cx + r, cy + r), fill=NAVY, outline=GOLD_D)
        o.ellipse((cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3), outline=GOLD_L)
        for k in (45, 135, 225, 315):
            a = math.radians(k)
            diamond(o, cx + math.sin(a) * (r - 11), cy - math.cos(a) * (r - 11), 2)
    for lab, deg in (("N", 0), ("E", 90), ("S", 180), ("W", 270)):
        x, y = compass_dir(cx, cy, r - 13, deg)
        text(img, (x, y - 1), lab, FC(17 if lab == "N" else 14), GOLD if lab == "N" else TXT, anchor="mm")
    d = ImageDraw.Draw(img)
    ang = c["angle"]
    tip = compass_dir(cx, cy, r - 3, ang); tail = compass_dir(cx, cy, 10, ang + 180)
    s1 = compass_dir(cx, cy, 5, ang + 90); s2 = compass_dir(cx, cy, 5, ang - 90)
    d.polygon([tip, s1, tail, s2], fill=hexc(GOLD), outline=hexc("#6a5428"))
    d.line((tip, tail), fill=hexc("#fff0c0"))
    d.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=hexc(NAVY2[:3]))
    f = FM(16)
    lab = c["label"]
    w_ = tw(lab, f) + 30
    y0 = cy + r + 10
    npanel(img, (1272 - w_, y0, 1272, y0 + 28), r=4, corners=False, shadow=50)
    text(img, (1272 - w_ / 2, y0 + 14), lab, f, TXT, anchor="mm")
    put(img, icon(370), (1238, y0 + 33))
    text(img, (1232, y0 + 49), G["load"], FM(16), TXT, anchor="rm", stroke=2, sfill=(0, 0, 0, 170))


def needs_row(img, x0=12, y0=626):
    T = 70
    npanel(img, (x0, y0, x0 + 4 * T + 12, y0 + T + 12), r=6)
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        cx = x0 + 6 + i * T + T // 2
        ic = icon_fill(need_icon(k), v, dim=DIMC).resize((64, 64), Image.NEAREST)
        put(img, ic, (cx - 32, y0 + 6 + T // 2 - 32))
        if i:
            with Over(img) as o:
                o.line((x0 + 6 + i * T, y0 + 16, x0 + 6 + i * T, y0 + T - 4), fill=GOLD_D)
        if k == "water":
            with Over(img) as o:
                diamond(o, cx + 24, y0 + 14, 4, "#ff8a7a")


def hud():
    img = bg2()
    f = FM(20)
    w_ = 82 + tw(G["goal"], f) + 60
    npanel(img, (12, 12, 12 + w_, 80))
    clock(img, 47, 46, 26, G["hour"])
    with Over(img) as o:
        o.line((86, 24, 86, 68), fill=GOLD_D)
    sc(img, (100, 18), "Cel", 14)
    put(img, icon(G["goal_icon"]), (98, 40))
    text(img, (136, 56), G["goal"], f, TXT, anchor="lm")
    # nazwa miejsca: kapitaliki i linia z rombem (bez panelu)
    tot = spaced(img, (640, 12), "pole dziadka", FC(26), TXT, sp=4, anchor="m", stroke=2, sfill=(8, 12, 20, 170))
    rule(img, 640, 48, tot / 2 + 10)
    compass(img)
    needs_row(img)
    f = FM(18)
    w_ = tw(G["popup"], f) + 54
    x = G["hero"][0] - w_ // 2; y = G["hero"][1] - 80
    npanel(img, (x, y, x + w_, y + 34), r=4, corners=False, shadow=50)
    put(img, icon(391), (x + 8, y + 1))
    text(img, (x + 44, y + 17), G["popup"], f, TXT, anchor="lm")
    for i, (ic, s_) in enumerate(G["gains"]):
        f = FM(18)
        w_ = tw(s_, f) + 58
        y = 604 + i * 38
        npanel(img, (1270 - w_, y, 1270, y + 32), r=4, corners=False, shadow=50)
        put(img, icon(ic), (1270 - w_ + 7, y))
        text(img, (1270 - w_ + 46, y + 16), s_, f, TXT, anchor="lm")
    return img


# ------------------------------------------------------------------ okna
def window(img, title, sub, X=140, Y=50, PW=1000, PH=620):
    npanel(img, (X, Y, X + PW, Y + PH), r=8, shadow=120)
    cx = X + PW // 2
    tot = spaced(img, (cx, Y + 22), title.lower(), FC(34), GOLD, sp=5, anchor="m")
    rule(img, cx, Y + 72, 260)
    if sub:
        text(img, (cx, Y + 92), sub, FR(16), MUT, anchor="mm")
    return X, Y, PW, PH


def ctabs(img, cx, y, names, act=0):
    f = FC(16)
    widths = [sum(tw(ch, f) if ch != " " else tw("n", f) for ch in n.lower()) + 2 * (len(n) - 1) for n in names]
    total = sum(widths) + 26 * (len(names) - 1)
    x = cx - total / 2
    for i, n in enumerate(names):
        spaced(img, (x, y), n.lower(), f, GOLD if i == act else MUT, sp=2)
        if i == act:
            with Over(img) as o:
                diamond(o, x + widths[i] / 2, y + 30, 3)
        x += widths[i] + 26


def foot(img, X, Y, PW, PH, pairs):
    f = FM(15)
    total = sum(max(24, tw(k, f) + 14) + tw(l, f) + 26 for k, l in pairs) - 26
    keycaps(img, X + PW / 2 - total / 2, Y + PH - 40, pairs, f, GOLD_D, NAVY2, GOLD, MUT, h=24, r=4)


def journal():
    img = bg_menu2(0.55, 2.0, (6, 10, 22))
    X, Y, PW, PH = window(img, "Dziennik", "Dzień 40 · lato · 11:01 · wykonano 41 z 77 celów")
    ctabs(img, X + PW // 2, Y + 112, JTABS)
    lx, ly = X + 48, Y + 166
    for i, (ic, name, done) in enumerate(GOALS):
        y = ly + i * 40
        if i == 0:
            with Over(img) as o:
                o.rounded_rectangle((lx - 10, y - 2, lx + 410, y + 36), radius=4, fill=(212, 178, 106, 34), outline=GOLD_D)
                diamond(o, lx - 10, y + 17, 4)
        put(img, icon(ic), (lx + 6, y + 1))
        text(img, (lx + 48, y + 17), name, FM(18), "#5d6678" if done else TXT, anchor="lm")
        if done:
            with Over(img) as o:
                diamond(o, lx + 398, y + 17, 3)
    with Over(img) as o:
        o.line((X + PW // 2 + 10, Y + 166, X + PW // 2 + 10, Y + PH - 74), fill=GOLD_D)
    rx, rw = X + PW // 2 + 40, PW // 2 - 88
    rcx = rx + rw // 2
    ry = Y + 162
    with Over(img) as o:
        o.ellipse((rcx - 34, ry, rcx + 34, ry + 68), fill=NAVY2, outline=GOLD_L)
    put(img, icon(337, 1.5), (rcx - 24, ry + 10))
    sc(img, (rcx, ry + 80), "Rozdział I · Dług dziadka", 13, anchor="m")
    text(img, (rcx, ry + 126), G["goal"], FCo(32, 700), TXT, anchor="mm")
    y = ry + 168
    for ln in wrapf("Borgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy. Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim.", FR(18), rw):
        text(img, (rcx, y), ln, FR(18), TXT, anchor="ma"); y += 26
    y += 12
    rule(img, rcx, y, 80, 8); y += 22
    sc(img, (rcx, y), "Skąd wziąć", 13, anchor="m"); y += 30
    put(img, icon(353), (rcx - 90, y - 6)); text(img, (rcx - 52, y + 10), "Browar: Warz piwo", FM(17), TXT, anchor="lm"); y += 40
    text(img, (rcx, y + 6), "Kompas prowadzi: Tawerna · 151 kroków", FR(16), MUT, anchor="mm")
    foot(img, X, Y, PW, PH, [("←→", "zakładka"), ("↑↓", "wybierz"), ("Enter", "śledź cel"), ("Esc", "wróć")])
    return img


def bag():
    img = bg_menu2(0.55, 2.0, (6, 10, 22))
    X, Y, PW, PH = window(img, "Plecak", "Obciążenie 41 / 120 · 330 monet")
    ctabs(img, X + PW // 2, Y + 112, ["Wszystko", "Materiały", "Jedzenie", "Narzędzia"])
    # dwie kolumny po 6
    sel = 9
    for i, (_, name, ic, n) in enumerate(BAG[:12]):
        col, row = i // 6, i % 6
        x = X + 48 + col * 460; y = Y + 164 + row * 40
        if i == sel:
            with Over(img) as o:
                o.rounded_rectangle((x - 10, y - 3, x + 430, y + 35), radius=4, fill=(212, 178, 106, 34), outline=GOLD_D)
                diamond(o, x - 10, y + 16, 4)
        put(img, icon(ic), (x + 4, y))
        text(img, (x + 46, y + 16), name, FM(18), TXT, anchor="lm")
        text(img, (x + 420, y + 16), str(n), FM(18), GOLD, anchor="rm")
    with Over(img) as o:
        o.line((X + PW // 2, Y + 164, X + PW // 2, Y + 398), fill=GOLD_D)
    # pas opisu na dole
    by = Y + 418
    rule(img, X + PW // 2, by, 440, 10)
    with Over(img) as o:
        o.ellipse((X + 52, by + 22, X + 128, by + 98), fill=NAVY2, outline=GOLD_L)
    put(img, icon(358, 1.5), (X + 66, by + 36))
    text(img, (X + 150, by + 40), "Jagody", FCo(32, 700), TXT, anchor="lm")
    sc(img, (X + 150, by + 62), "Jedzenie · masz 6 · waga 1", 13)
    text(img, (X + 150, by + 100), "Dzikie jagody. Słodkie i sycące, ale na chwilę.", FR(17), TXT, anchor="lm")
    # efekty po prawej
    ex = X + 640
    for j, (lab, val) in enumerate((("Kondycja", "+8"), ("Sytość", "+8"), ("Nawodnienie", "+10"), ("Świeżość", "3 dni"))):
        y = by + 30 + j * 24
        text(img, (ex, y), lab, FR(16), MUT, anchor="lm")
        text(img, (ex + 300, y), val, FM(16), "#a8d890" if lab == "Świeżość" else TXT, anchor="rm")
    foot(img, X, Y, PW, PH, [("↑↓←→", "wybierz"), ("Q/E", "zakładka"), ("Enter", "zjedz"), ("X", "wyrzuć"), ("Esc", "wróć")])
    return img


def hero():
    img = bg_menu2(0.55, 2.0, (6, 10, 22))
    X, Y, PW, PH = window(img, "Postać", "Reid · poziom 6 · 890 / 1200 doświadczenia")
    cx = X + PW // 2
    # medalion z popiersiem
    R = 120
    cy = Y + 270
    m = circle_mask(2 * R)
    bust = hero_bust().resize((int(330 * 0.78), int(350 * 0.78)), Image.LANCZOS)
    lay = Image.new("RGBA", (2 * R, 2 * R), NAVY2)
    lay.alpha_composite(bust, ((2 * R - bust.width) // 2, 2 * R - bust.height + 18))
    a = np.array(lay); a[~m] = 0
    img.alpha_composite(Image.fromarray(a), (cx - R, cy - R))
    with Over(img) as o:
        o.ellipse((cx - R, cy - R, cx + R, cy + R), outline=GOLD_L, width=2)
        o.ellipse((cx - R - 6, cy - R - 6, cx + R + 6, cy + R + 6), outline=GOLD_D)
        for k in range(4):
            aa = math.radians(k * 90)
            diamond(o, cx + math.sin(aa) * (R + 6), cy - math.cos(aa) * (R + 6), 4)
    # atrybuty symetrycznie
    attrs = [("Siła", 5), ("Zręczność", 5), ("Kondycja", 5), ("Czujność", 5), ("Hart ducha", 5), ("Punkty", 15)]
    for i, (nm, v) in enumerate(attrs):
        left = i < 3
        y = Y + 186 + (i % 3) * 64
        if left:
            x1 = cx - R - 40
            sc(img, (x1, y), nm, 15, GOLD if i == 0 else MUT, anchor="r")
            text(img, (x1, y + 36), str(v), FCo(30, 700), TXT, anchor="rm")
            if i == 0:
                with Over(img) as o:
                    diamond(o, x1 - 62, y + 9, 4)
        else:
            x1 = cx + R + 40
            sc(img, (x1, y), nm if nm != "Punkty" else "Do rozdania", 15, MUT)
            text(img, (x1, y + 36), str(v), FCo(30, 700), GOLD if nm == "Punkty" else TXT, anchor="lm")
    # potrzeby: rząd ikon napełnionych, wycentrowany
    y = Y + 430
    rule(img, cx, y, 300, 10)
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        x = cx - 270 + i * 180
        ic = icon_fill(need_icon(k), v, dim=DIMC).resize((48, 48), Image.NEAREST)
        put(img, ic, (x - 24, y + 18))
        text(img, (x + 34, y + 34), lab, FR(16), MUT, anchor="lm")
        text(img, (x + 34, y + 56), str(int(v * 100)) + "%", FM(18), TXT, anchor="lm")
    text(img, (cx, Y + PH - 64), "Siła: obrażenia wręcz, zbijanie równowagi, udźwig; mniej uderzeń przy rąbaniu i kopaniu.", FR(16), MUT, anchor="mm")
    foot(img, X, Y, PW, PH, [("↑↓", "wybierz"), ("←→", "rozdaj"), ("Enter", "zatwierdź"), ("Q/E", "umiejętności"), ("Esc", "wróć")])
    return img


if __name__ == "__main__":
    print(save2(hud(), "pomysl_5_granat_hud.png"))
    print(save2(journal(), "pomysl_5_granat_dziennik.png"))
    print(save2(bag(), "pomysl_5_granat_plecak.png"))
    print(save2(hero(), "pomysl_5_granat_postac.png"))
