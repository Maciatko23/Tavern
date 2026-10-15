# Pomysł 3 (runda 2): GRAFIT I MIEDŹ - schludny, minimalistyczny. Grafitowe półprzezroczyste panele z zaokrągleniem 8 px,
# jedna cienka linia, miedziany akcent, kapitaliki z oddechem, siatka 8 px. Paski: wachlarz 4 wycinków w lewym dolnym rogu.
import math
import numpy as np
from PIL import Image, ImageDraw
from common2 import *

PAN = (22, 23, 26, 214); PAN2 = (30, 32, 36, 235); LINE = (64, 66, 72, 255)
CU = "#d08a5a"; CU2 = "#8a5a3a"; TXT = "#ece6da"; MUT = "#9a958c"; DIM = "#5e5a54"
COL = {"health": "#d8605a", "stamina": "#94bf6e", "food": "#dda650", "water": "#62a6dc"}
FR = lambda s: font("AlegreyaSans-Regular.ttf", s)
FM = lambda s: font("AlegreyaSans-Medium.ttf", s)
FB = lambda s: font("AlegreyaSans-Bold.ttf", s)
FSC = lambda s: font("AlegreyaSansSC-Medium.ttf", s)


def sc(img, xy, s, size=13, fill=CU, anchor="l", sp=2):
    return spaced(img, xy, s.lower(), FSC(size), fill, sp=sp, anchor=anchor)


def clock(img, cx, cy, r, hour):
    with Over(img) as o:
        o.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PAN2, outline=LINE)
        o.ellipse((cx - r + 4, cy - r + 4, cx + r - 4, cy + r - 4), outline=hexc(CU2))
    d = ImageDraw.Draw(img)
    for k in range(12):
        a = math.radians(k * 30)
        x, y = cx + math.sin(a) * (r - 9), cy - math.cos(a) * (r - 9)
        if k % 3 == 0:
            d.rectangle((x - 1, y - 1, x + 1, y + 1), fill=hexc(TXT))
        else:
            d.point((x, y), fill=hexc(MUT))
    (hx, hy), (mx, my) = hand_pts(cx, cy, hour, r * 0.48, r * 0.72)
    d.line((cx, cy, hx, hy), fill=hexc(TXT), width=3)
    d.line((cx, cy, mx, my), fill=hexc(CU), width=2)
    d.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=hexc(CU))
    # pora dnia: małe słońce na obręczy w miejscu godziny 24 h (południe u góry)
    a = math.radians(((hour - 12) % 24) * 15)
    sx, sy = cx + math.sin(a) * r, cy - math.cos(a) * r
    d.ellipse((sx - 4, sy - 4, sx + 4, sy + 4), fill=hexc("#f2c25a"), outline=hexc("#16171a"))


def compass(img):
    c = G["compass"]; cx, cy, r = c["cx"], c["cy"], c["r"]
    with Over(img) as o:
        o.ellipse((cx - r - 1, cy - r + 2, cx + r + 1, cy + r + 4), fill=(0, 0, 0, 40))
        o.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PAN, outline=LINE)
    d = ImageDraw.Draw(img)
    for k in range(0, 360, 15):
        if k % 90 == 0:
            continue
        a = math.radians(k)
        L = 4 if k % 45 == 0 else 2
        x0, y0 = cx + math.sin(a) * (r - 3), cy - math.cos(a) * (r - 3)
        x1, y1 = cx + math.sin(a) * (r - 3 - L), cy - math.cos(a) * (r - 3 - L)
        d.line((x0, y0, x1, y1), fill=hexc(DIM))
    for lab, deg in (("N", 0), ("E", 90), ("S", 180), ("W", 270)):
        x, y = compass_dir(cx, cy, r - 13, deg)
        text(img, (x, y), lab, FB(15) if lab == "N" else FM(13), CU if lab == "N" else MUT, anchor="mm")
    ang = c["angle"]
    tip = compass_dir(cx, cy, r - 3, ang)
    b1 = compass_dir(cx, cy, r - 13, ang - 7); b2 = compass_dir(cx, cy, r - 13, ang + 7)
    e = compass_dir(cx, cy, r - 13, ang)
    d.line((cx, cy, e[0], e[1]), fill=hexc(CU), width=2)
    d.polygon([tip, b1, b2], fill=hexc(CU))
    d.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=hexc(TXT))
    f = FM(16)
    lab = c["label"]
    w_ = tw(lab, f) + 24
    y0 = cy + r + 10
    rpanel(img, (1272 - w_, y0, 1272, y0 + 26), PAN, LINE, r=13)
    text(img, (1272 - w_ / 2, y0 + 13), lab, f, TXT, anchor="mm")
    put(img, icon(370), (1238, y0 + 32))
    text(img, (1232, y0 + 48), G["load"], FM(16), TXT, anchor="rm", stroke=2, sfill=(0, 0, 0, 170))


def fan(img, ox=20, oy=702, r0=62, r1=128):
    """wachlarz: 4 wycinki pierścienia od pionu do poziomu, każdy wypełniany od środka na zewnątrz (ostre krawędzie, 1 px)"""
    WD, GAP = 19.5, 4.0
    S = r1 + 4
    yy, xx = np.mgrid[-S:S + 1, -S:S + 1]
    dist = np.sqrt(xx ** 2 + yy ** 2)
    ang = np.degrees(np.arctan2(xx, -yy))          # 0 = w górę, 90 = w prawo
    lay = np.zeros(dist.shape + (4,), np.uint8)
    for i, (k, lab, v, _) in enumerate(G["needs"]):
        a0 = i * (WD + GAP); a1 = a0 + WD
        sect = (ang >= a0) & (ang <= a1) & (dist >= r0) & (dist <= r1)
        lay[sect] = (24, 25, 29, 200)
        rr = r0 + (r1 - r0) * v
        fill = sect & (dist <= rr)
        lay[fill] = hexc(COL[k], 240)
        lay[sect & (np.abs(dist - rr) < 1.0)] = hexc(mix(COL[k], "#ffffff", 0.35))
        edge = sect & ~erode(sect, 1)
        lay[edge & ~fill] = (78, 80, 86, 255)
        if k == "water":
            ring_ = (ang >= a0) & (ang <= a1) & (dist >= r1 + 3) & (dist <= r1 + 4)
            lay[ring_] = hexc(COL[k])
        mid = math.radians(a0 + WD / 2)
        cx_, cy_ = ox + math.sin(mid) * (r1 + 19), oy - math.cos(mid) * (r1 + 19)
        G.setdefault("_fan_icons", []).append((k, cx_, cy_))
    arc_in = (ang >= 0) & (ang <= 90) & (dist >= r0 - 7) & (dist < r0 - 6)
    lay[arc_in] = hexc(CU, 200)
    im = Image.fromarray(lay, "RGBA")
    soft_shadow(img, lay[..., 3] > 0, (ox - S, oy - S), (2, 3), 90, 3)
    img.alpha_composite(im, (ox - S, oy - S))
    for k, cx_, cy_ in G.pop("_fan_icons"):
        put(img, need_icon(k), (cx_ - 16, cy_ - 16))


def hud():
    img = bg2()
    # ---- lewy górny: zegar + cel w jednym panelu
    f = FM(20)
    w_ = 76 + tw(G["goal"], f) + 40 + 20
    rpanel(img, (12, 12, 12 + w_, 76), PAN, LINE, r=10)
    clock(img, 44, 44, 26, G["hour"])
    with Over(img) as o:
        o.line((82, 22, 82, 66), fill=LINE)
    sc(img, (96, 18), "Cel", 13)
    put(img, icon(G["goal_icon"]), (94, 37))
    text(img, (132, 52), G["goal"], f, TXT, anchor="lm")
    # ---- nazwa miejsca: kapitaliki z oddechem i cienkie linie (bez panelu)
    with Over(img) as o:
        o.rectangle((470, 10, 810, 50), fill=(0, 0, 0, 0))
    tot = spaced(img, (640, 16), "POLE DZIADKA", FM(24), TXT, sp=4, anchor="m", stroke=2, sfill=(0, 0, 0, 150))
    with Over(img) as o:
        for s in (-1, 1):
            x0 = 640 + s * (tot / 2 + 14)
            o.line((x0, 31, x0 + s * 60, 31), fill=hexc(CU, 220))
    compass(img)
    fan(img)
    # ---- dymek
    f = FM(18)
    w_ = tw(G["popup"], f) + 52
    x = G["hero"][0] - w_ // 2; y = G["hero"][1] - 78
    rpanel(img, (x, y, x + w_, y + 32), PAN, LINE, r=16)
    put(img, icon(391), (x + 6, y))
    text(img, (x + 40, y + 16), G["popup"], f, TXT, anchor="lm")
    # ---- zdobycze
    for i, (ic, s) in enumerate(G["gains"]):
        f = FM(18)
        w_ = tw(s, f) + 56
        y = 604 + i * 38
        rpanel(img, (1270 - w_, y, 1270, y + 32), PAN, LINE, r=16)
        put(img, icon(ic), (1270 - w_ + 6, y))
        text(img, (1270 - w_ + 44, y + 16), s, f, TXT, anchor="lm")
    return img


# ------------------------------------------------------------------ okna
def window(img, title, sub, X=120, Y=60, PW=1040, PH=600):
    rpanel(img, (X, Y, X + PW, Y + PH), (20, 21, 24, 240), LINE, r=12, shadow=90)
    text(img, (X + 32, Y + 40), title, FB(30), TXT, anchor="lm")
    if sub:
        text(img, (X + PW - 32, Y + 42), sub, FR(17), MUT, anchor="rm")
    with Over(img) as o:
        o.line((X + 32, Y + 72, X + PW - 32, Y + 72), fill=LINE)
        o.line((X + 32, Y + PH - 52, X + PW - 32, Y + PH - 52), fill=LINE)
    return X, Y, PW, PH


def tabs(img, x, y, names, act=0):
    f = FM(17)
    x0 = x
    for i, n in enumerate(names):
        col = TXT if i == act else MUT
        text(img, (x, y), n, f, col, anchor="lm")
        w_ = tw(n, f)
        if i == act:
            with Over(img) as o:
                o.rectangle((x, y + 14, x + w_, y + 15), fill=hexc(CU))
        x += w_ + 28


def foot(img, X, Y, PW, PH, pairs, right=None):
    keycaps(img, X + 32, Y + PH - 38, pairs, FM(15), LINE, (34, 36, 40, 255), TXT, MUT)
    if right:
        text(img, (X + PW - 32, Y + PH - 26), right, FM(16), CU, anchor="rm")


def journal():
    img = bg_menu2(0.5, 2.0, (6, 6, 8))
    X, Y, PW, PH = window(img, "Dziennik", "Dzień 40 · lato · 11:01")
    tabs(img, X + 32, Y + 100, JTABS)
    lx, ly, lw = X + 32, Y + 136, 440
    for i, (ic, name, done) in enumerate(GOALS):
        y = ly + i * 42
        if i == 0:
            rpanel(img, (lx - 8, y, lx + lw, y + 40), (40, 42, 47, 255), None, r=6, shadow=0)
            with Over(img) as o:
                o.rectangle((lx - 8, y + 8, lx - 6, y + 32), fill=hexc(CU))
        with Over(img) as o:
            o.ellipse((lx + 6, y + 13, lx + 20, y + 27), outline=hexc(CU if done else MUT), width=1)
            if done:
                o.ellipse((lx + 9, y + 16, lx + 17, y + 24), fill=hexc(CU))
        put(img, icon(ic), (lx + 32, y + 4))
        text(img, (lx + 74, y + 20), name, FM(18), DIM if done else TXT, anchor="lm")
    with Over(img) as o:
        o.line((X + 504, Y + 136, X + 504, Y + PH - 68), fill=LINE)
    rx, ry = X + 536, Y + 136
    rpanel(img, (rx, ry, rx + 64, ry + 64), (34, 36, 40, 255), LINE, r=10, shadow=0)
    put(img, icon(337, 1.5), (rx + 8, ry + 8))
    sc(img, (rx + 84, ry + 4), "Rozdział I · Dług dziadka", 13)
    text(img, (rx + 84, ry + 42), G["goal"], FB(26), TXT, anchor="lm")
    y = ry + 86
    for ln in wrapf("Borgar, karczmarz z tawerny „Pod Złotym Kuflem”, szuka rąk do pracy. Tawerna stoi przy ścieżce na północ od Polnej drogi. Porozmawiaj z nim.", FR(18), 440):
        text(img, (rx, y), ln, FR(18), TXT); y += 27
    y += 12
    sc(img, (rx, y), "Skąd wziąć", 13); y += 26
    put(img, icon(353), (rx, y - 4)); text(img, (rx + 42, y + 12), "Browar: Warz piwo", FM(17), TXT, anchor="lm"); y += 42
    sc(img, (rx, y), "Kierunek", 13); y += 26
    text(img, (rx, y + 8), "Tawerna · 151 kroków na wschód", FM(17), TXT, anchor="lm"); y += 40
    sc(img, (rx, y), "Postęp rozdziału", 13); y += 28
    with Over(img) as o:
        o.rounded_rectangle((rx, y, rx + 440, y + 4), radius=2, fill=(50, 52, 58, 255))
        o.rounded_rectangle((rx, y, rx + int(440 * 0.6), y + 4), radius=2, fill=hexc(CU))
    text(img, (rx + 440, y + 18), "6 z 10", FR(15), MUT, anchor="rm")
    foot(img, X, Y, PW, PH, [("←→", "zakładka"), ("↑↓", "wybierz"), ("Enter", "śledź cel"), ("Esc", "wróć")], "Wykonano 41 z 77 celów")
    return img


def bag():
    img = bg_menu2(0.5, 2.0, (6, 6, 8))
    X, Y, PW, PH = window(img, "Plecak", None)
    # obciążenie w nagłówku: cienki pasek
    sc(img, (X + PW - 290, Y + 33), "Obciążenie", 13, MUT)
    with Over(img) as o:
        o.rounded_rectangle((X + PW - 186, Y + 39, X + PW - 96, Y + 43), radius=2, fill=(50, 52, 58, 255))
        o.rounded_rectangle((X + PW - 186, Y + 39, X + PW - 186 + int(90 * 41 / 120), Y + 43), radius=2, fill=hexc(CU))
    text(img, (X + PW - 32, Y + 42), "41 / 120", FM(17), TXT, anchor="rm")
    tabs(img, X + 32, Y + 100, ["Wszystko", "Materiały", "Jedzenie", "Narzędzia", "Do zadań"])
    gx, gy, cs, gap = X + 32, Y + 128, 56, 8
    sel = 9
    for i in range(40):
        c, r = i % 8, i // 8
        x, y = gx + c * (cs + gap), gy + r * (cs + gap)
        on = i == sel
        rpanel(img, (x, y, x + cs, y + cs), (40, 42, 47, 255) if on else (30, 32, 36, 255), hexc(CU) if on else (48, 50, 56, 255), r=8, lw=2 if on else 1, shadow=0)
        if i < len(BAG):
            _, name, ic, n = BAG[i]
            put(img, icon(ic), (x + 12, y + 8))
            text(img, (x + cs - 6, y + cs - 4), str(n), FM(14), TXT, anchor="rd", stroke=2, sfill=(20, 21, 24, 255))
    rx = gx + 8 * (cs + gap) + 16
    rw = X + PW - 32 - rx
    with Over(img) as o:
        o.line((rx - 16, Y + 92, rx - 16, Y + PH - 68), fill=LINE)
    rx += 8; rw -= 8
    rpanel(img, (rx, gy, rx + 64, gy + 64), (34, 36, 40, 255), LINE, r=10, shadow=0)
    put(img, icon(358, 1.5), (rx + 8, gy + 8))
    sc(img, (rx + 82, gy + 4), "Jedzenie", 13)
    text(img, (rx + 82, gy + 40), "Jagody", FB(26), TXT, anchor="lm")
    y = gy + 84
    for lab, val in (("Masz", "6"), ("Waga", "1 za sztukę"), ("Świeżość", "zepsują się za 3 dni")):
        text(img, (rx, y), lab, FR(16), MUT, anchor="lm")
        text(img, (rx + rw, y), val, FM(16), "#9fd08a" if lab == "Świeżość" else TXT, anchor="rm")
        with Over(img) as o:
            o.line((rx, y + 14, rx + rw, y + 14), fill=(44, 46, 52, 255))
        y += 32
    y += 8
    for ln in wrapf("Dzikie jagody. Słodkie i sycące, ale na chwilę. Dobre na drogę, gdy nie ma ognia.", FR(17), rw):
        text(img, (rx, y), ln, FR(17), TXT); y += 25
    y += 12
    sc(img, (rx, y), "Po zjedzeniu", 13); y += 26
    for lab, val, k in (("Kondycja", "+8", "stamina"), ("Sytość", "+8", "food"), ("Nawodnienie", "+10", "water")):
        with Over(img) as o:
            o.ellipse((rx, y - 4, rx + 8, y + 4), fill=hexc(COL[k]))
        text(img, (rx + 16, y), lab, FR(16), TXT, anchor="lm")
        text(img, (rx + rw, y), val, FM(16), TXT, anchor="rm")
        y += 24
    by = Y + PH - 104
    rpanel(img, (rx, by, rx + 140, by + 36), hexc(CU), None, r=8, shadow=0)
    text(img, (rx + 70, by + 18), "Zjedz", FB(17), "#1a1310", anchor="mm")
    rpanel(img, (rx + 152, by, rx + 280, by + 36), None, LINE, r=8, shadow=0)
    text(img, (rx + 216, by + 18), "Wyrzuć", FM(17), MUT, anchor="mm")
    foot(img, X, Y, PW, PH, [("↑↓←→", "wybierz"), ("Q/E", "zakładka"), ("Enter", "użyj"), ("Esc", "wróć")], "15 rzeczy · 330 monet")
    return img


def menu_p():
    img = bg2()
    hx, hy = G["hero"][0], G["hero"][1] + 2
    yy, xx = np.mgrid[0:H, 0:W]
    dist = np.sqrt((xx - hx) ** 2 + ((yy - hy) * 1.15) ** 2)
    a = np.clip((dist - 140) / 240, 0, 1) * 0.6 + 0.18
    lay = Image.new("RGBA", (W, H), (10, 10, 12, 0)); lay.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    img.alpha_composite(lay)
    items = [("Plecak", icon_key(209, "green")), ("Dziennik", icon_key(121, "dark")), ("Opcje", icon_key(83, "dark")),
             ("Zakończ grę", icon_key(197, "green")), ("Zapisz grę", icon_key(246, "green")), ("Postać", hero_sprite(0, 1).crop((16, 4, 48, 36)))]
    R = 126
    with Over(img) as o:
        o.ellipse((hx - R, hy - R * 0.92, hx + R, hy + R * 0.92), outline=(236, 230, 218, 50))
    for k, (lab, ic) in enumerate(items):
        ang = math.radians(-90 + k * 60)
        cx, cy = hx + math.cos(ang) * R, hy + math.sin(ang) * R * 0.92
        sel = k == 0
        r = 30 if sel else 25
        with Over(img) as o:
            o.ellipse((cx - r, cy - r + 3, cx + r, cy + r + 3), fill=(0, 0, 0, 60))
            o.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(28, 29, 33, 235), outline=hexc(CU) if sel else LINE, width=2 if sel else 1)
        put(img, ic, (cx - 16, cy - 16))
        if not sel:
            text(img, (cx, cy + r + 13), lab, FM(15), MUT, anchor="mm", stroke=2, sfill=(0, 0, 0, 150))
    text(img, (hx, hy - R - 60), "Plecak", FB(28), TXT, anchor="mm", stroke=2, sfill=(0, 0, 0, 150))
    spaced(img, (hx, hy - R - 92), "15 rzeczy · 41/120", FSC(13), CU, sp=2, anchor="m")
    # lewa karta: kim jestem
    X0, Y0, W0 = 48, 168, 300
    rpanel(img, (X0, Y0, X0 + W0, Y0 + 400), PAN, LINE, r=12)
    bust = hero_bust().resize((110, 117), Image.LANCZOS)
    rpanel(img, (X0 + 20, Y0 + 20, X0 + 104, Y0 + 104), (34, 36, 40, 255), LINE, r=10, shadow=0)
    tile = Image.new("RGBA", (84, 84), (0, 0, 0, 0)); tile.alpha_composite(bust, (-13, -4))
    m = np.array(tile); rm = np.zeros((84, 84), bool); rm[1:83, 1:83] = True; m[~rm] = 0
    img.alpha_composite(Image.fromarray(m), (X0 + 20, Y0 + 20))
    text(img, (X0 + 120, Y0 + 44), "Reid", FB(26), TXT, anchor="lm")
    sc(img, (X0 + 120, Y0 + 62), "Poziom 6", 13)
    text(img, (X0 + 120, Y0 + 92), "Dzień 40 · lato · 11:01", FR(15), MUT, anchor="lm")
    y = Y0 + 132
    for k, lab, v, _ in G["needs"]:
        text(img, (X0 + 20, y), lab, FR(16), TXT, anchor="lm")
        text(img, (X0 + W0 - 20, y), str(int(v * 100)), FM(16), TXT, anchor="rm")
        with Over(img) as o:
            o.rounded_rectangle((X0 + 20, y + 14, X0 + W0 - 20, y + 17), radius=2, fill=(50, 52, 58, 255))
            o.rounded_rectangle((X0 + 20, y + 14, X0 + 20 + int((W0 - 40) * v), y + 17), radius=2, fill=hexc(COL[k]))
        y += 44
    with Over(img) as o:
        o.line((X0 + 20, y, X0 + W0 - 20, y), fill=LINE)
    y += 22
    for lab, val in (("Sakiewka", "330 G"), ("Dług dziadka", "1250 / 2500 G"), ("Zostało", "21 dni")):
        text(img, (X0 + 20, y), lab, FR(16), MUT, anchor="lm"); text(img, (X0 + W0 - 20, y), val, FM(16), TXT, anchor="rm"); y += 26
    # prawa karta: na wierzchu
    X1 = W - 48 - 300
    rpanel(img, (X1, Y0, X1 + 300, Y0 + 400), PAN, LINE, r=12)
    sc(img, (X1 + 20, Y0 + 18), "Na wierzchu", 13)
    y = Y0 + 56
    for _, name, ic, n in BAG[:8]:
        put(img, icon(ic), (X1 + 16, y - 16))
        text(img, (X1 + 56, y), name, FR(16), TXT, anchor="lm")
        text(img, (X1 + 280, y), str(n), FM(16), MUT, anchor="rm")
        y += 40
    text(img, (X1 + 20, y - 4), "i 7 innych", FR(15), MUT, anchor="lm")
    keycaps(img, 470, 680, [("←→", "obróć"), ("Enter", "otwórz"), ("Esc", "wróć do gry")], FM(15), LINE, (28, 29, 33, 230), TXT, "#d8d2c6")
    return img


if __name__ == "__main__":
    print(save2(hud(), "pomysl_3_grafit_hud.png"))
    print(save2(journal(), "pomysl_3_grafit_dziennik.png"))
    print(save2(bag(), "pomysl_3_grafit_plecak.png"))
    print(save2(menu_p(), "pomysl_3_grafit_menu_p.png"))
