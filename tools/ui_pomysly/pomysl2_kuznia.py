# Pomysł 2: KUŹNIA - kute żelazo i żar. Rozwinięcie obecnego czarno-żółtego stylu: czarne kute płyty z nitami,
# paski jak rozgrzany metal (barwy nalotowe stali), pikselowa czcionka. Okno: plecak jako siatka przegródek.
import math
import numpy as np
from PIL import Image, ImageDraw
from uikit import *

IRON = ["#0b0c0e", "#16181b", "#1d2024", "#24272c", "#30343a", "#4a4f58", "#7d838d"]
TXT = "#ece4d4"; MUTED = "#9a948a"; YEL = "#ffd23f"; ORA = "#ff8a1f"; DORA = "#a8320f"
BARS = {
    "health": ["#ff7a5a", "#e0341f", "#a01c12"],
    "stamina": ["#ffe27a", "#ffc23a", "#c98a14"],
    "food": ["#ffb466", "#e07a2a", "#9c4a14"],
    "water": ["#9fd8ff", "#3f8fe0", "#1f4f9c"],
    "xp": ["#ffe9a0", "#ffd23f", "#c99a14"],
}
FB = lambda s=20: font("Jersey10.ttf", s)
FH = lambda s=48: font("Jacquard24.ttf", s)


def ptext(img, xy, s, f, fill, anchor="la", shadow=True):
    text(img, xy, s, f, fill, anchor=anchor, pixel=True, shadow=(1, 1, (0, 0, 0, 255)) if shadow else None)


def rivet(img, x, y):
    d = ImageDraw.Draw(img)
    d.rectangle((x, y, x + 3, y + 3), fill=hexc("#5a606a"))
    d.point((x, y), fill=hexc(IRON[0])); d.point((x + 3, y), fill=hexc(IRON[0])); d.point((x, y + 3), fill=hexc(IRON[0])); d.point((x + 3, y + 3), fill=hexc(IRON[0]))
    d.point((x + 1, y + 1), fill=hexc("#b4bac4")); d.point((x + 2, y + 1), fill=hexc("#8a909a"))
    d.point((x + 2, y + 2), fill=hexc("#33373e")); d.point((x + 1, y + 3), fill=hexc("#0a0a0c")); d.point((x + 2, y + 3), fill=hexc("#0a0a0c"))


def plate(img, x, y, w, h, cut=5, rivets=True, brackets=True, hot=False, alpha=None, seed=1):
    m = cut_mask(w, h, cut)
    soft_shadow(img, m, (x, y), (2, 3), 120, 3)
    n = noise(w, h, cell=5, seed=seed, octaves=2)
    tex = quant(n, [IRON[1], IRON[2], IRON[3]], cuts=[0.4, 0.66])
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    paint_tex(lay, m, tex)
    # faza: góra/lewo jasna, dół/prawo ciemna
    e = ring(m, 1); e2 = ring(erode(m, 1), 1)
    yy, xx = np.mgrid[0:h, 0:w]
    paint(lay, e2 & ((yy < h / 2) & (xx + yy < w)), IRON[5])
    paint(lay, e2 & ~((yy < h / 2) & (xx + yy < w)), IRON[0])
    paint(lay, e, "#050506")
    if alpha is not None:
        a = np.array(lay); a[..., 3] = (a[..., 3] * alpha).astype(np.uint8); lay = Image.fromarray(a)
    img.alpha_composite(lay, (x, y))
    if rivets and w > 30 and h > 24:
        for rx, ry in ((x + cut + 2, y + 4), (x + w - cut - 6, y + 4), (x + 4, y + h - 8), (x + w - 8, y + h - 8)):
            rivet(img, rx, ry)
    if brackets:
        hot_brackets(img, x, y, w, h)
    if hot:
        for k, c in enumerate((DORA, ORA)):
            line(img, [(x + cut + 2, y + h - 1 - k), (x + w - cut - 3, y + h - 1 - k)], c)


def hot_brackets(img, x, y, w, h, L=10):
    d = ImageDraw.Draw(img)
    for (cx, cy, sx, sy) in ((x - 2, y - 2, 1, 1), (x + w + 1, y - 2, -1, 1), (x - 2, y + h + 1, 1, -1), (x + w + 1, y + h + 1, -1, -1)):
        if (sx, sy) in ((1, 1), (-1, -1)):
            for k in range(2):
                d.line((cx + sx * k, cy + sy * k, cx + sx * L, cy + sy * k), fill=hexc(YEL if k == 0 else ORA))
                d.line((cx + sx * k, cy + sy * k, cx + sx * k, cy + sy * L), fill=hexc(YEL if k == 0 else ORA))


def slot_bar(img, x, y, w, h, ratio, key, notch=10, blink=False):
    d = ImageDraw.Draw(img)
    d.rectangle((x - 1, y - 1, x + w, y + h), fill=hexc("#050506"))
    d.rectangle((x, y, x + w - 1, y + h - 1), fill=hexc("#0d0e10"))
    d.line((x, y, x + w - 1, y), fill=hexc("#000000"))
    d.line((x - 1, y + h, x + w, y + h), fill=hexc(IRON[4]))
    cols = BARS[key]
    fw = int((w - 2) * ratio)
    if fw > 0:
        n = len(cols)
        ih = h - 2
        for i, c in enumerate(cols):
            a = y + 1 + int(i * ih / n); b = y + 1 + int((i + 1) * ih / n) - 1
            d.rectangle((x + 1, a, x + fw, b), fill=hexc(c))
        d.line((x + fw, y + 1, x + fw, y + h - 2), fill=hexc("#fff2c0"))   # rozżarzony koniec
        d.line((x + 1, y + 1, x + fw, y + 1), fill=hexc(mix(cols[0], "#ffffff", 0.35)))
    for nx in range(x + notch, x + w - 1, notch):
        d.line((nx, y + 1, nx, y + h - 2), fill=hexc("#050506"))
    if blink:
        d.rectangle((x - 3, y - 3, x + w + 2, y + h + 2), outline=hexc("#ff5a3a"))


def iron_clock(img, cx, cy, r, hour):
    d = ImageDraw.Draw(img)
    m = circle_mask(2 * r + 1)
    soft_shadow(img, m, (cx - r, cy - r), (2, 3), 130, 3)
    paint(img, m, IRON[3], (cx - r, cy - r))
    paint(img, erode(m, 1) & ~erode(m, 3), IRON[5], (cx - r, cy - r))
    paint(img, erode(m, 3) & ~erode(m, 8), IRON[2], (cx - r, cy - r))
    paint(img, ring(erode(m, 8)), "#050506", (cx - r, cy - r))
    paint(img, erode(m, 9), "#101215", (cx - r, cy - r))
    paint(img, ring(m), "#050506", (cx - r, cy - r))
    for k in range(12):
        a = math.radians(k * 30)
        rr = r - 14
        px, py = cx + math.sin(a) * rr, cy - math.cos(a) * rr
        if k % 3 == 0:
            d.rectangle((px - 1, py - 1, px + 1, py + 1), fill=hexc(YEL))
        else:
            d.point((px, py), fill=hexc(ORA))
    for k in range(4):
        a = math.radians(45 + k * 90)
        rivet(img, int(cx + math.sin(a) * (r - 5)) - 2, int(cy - math.cos(a) * (r - 5)) - 2)
    hh = hour % 12
    ah = math.radians(hh * 30); am = math.radians((hour % 1) * 360)
    d.line((cx, cy, cx + math.sin(ah) * (r - 26), cy - math.cos(ah) * (r - 26)), fill=hexc(ORA), width=4)
    d.line((cx, cy, cx + math.sin(ah) * (r - 26), cy - math.cos(ah) * (r - 26)), fill=hexc(YEL), width=2)
    d.line((cx, cy, cx + math.sin(am) * (r - 16), cy - math.cos(am) * (r - 16)), fill=hexc("#d8d2c4"), width=1)
    rivet(img, cx - 2, cy - 2)


def chain(img, x, y0, y1):
    d = ImageDraw.Draw(img)
    for k, yy in enumerate(range(y0, y1, 4)):
        if k % 2 == 0:
            d.rectangle((x - 1, yy, x + 1, yy + 4), outline=hexc(IRON[5]))
            d.point((x, yy + 2), fill=hexc(IRON[0]))
        else:
            d.line((x, yy, x, yy + 4), fill=hexc(IRON[6]))


def hud():
    img = bg_map()
    # ---- zegar + tabliczka pory dnia
    plate(img, 70, 16, 196, 52, cut=5, brackets=False, seed=3)
    ptext(img, (122, 18), D["phase"], FB(30), YEL)
    ptext(img, (124, 44), "dzień 40 · lato", FB(20), MUTED)
    iron_clock(img, 56, 56, 48, D["hand"])
    # ---- paski (bez liczb) + ciężar
    plate(img, 10, 112, 240, 160, cut=5, brackets=True, seed=5)
    rows = [("health", icon_bare(84)), ("stamina", icon_bare(82)), ("food", icon(390)), ("water", icon(391))]
    vals = {"health": D["health"], "stamina": D["stamina"], "food": D["food"], "water": D["water"]}
    for i, (k, ic) in enumerate(rows):
        y = 120 + i * 30
        slot_bar(img, 52, y + 9, 184, 12, vals[k], k, blink=(k == "water"))
        put(img, ic, (14, y))
    put(img, icon(370), (14, 238))
    ptext(img, (54, 244), "41 / 120", FB(20), TXT)
    slot_bar(img, 130, 250, 106, 6, 41 / 120, "xp", notch=200)
    # ---- nazwa miejsca: szyld na łańcuchach
    f = FB(30)
    w_ = tw(D["map"], f) + 52
    x = 640 - w_ // 2
    plate(img, x, 12, w_, 40, cut=4, brackets=False, seed=7)
    chain(img, x + 14, 0, 16); chain(img, x + w_ - 15, 0, 16)
    ptext(img, (640, 32), D["map"], f, TXT, anchor="mm")
    # ---- minimapa w kutej ramie + cel
    mx, my = 1046, 6
    plate(img, mx, my, 226, 168, cut=6, brackets=True, rivets=False, seed=9)
    mm = minimap()
    img.alpha_composite(mm, (mx + 16, my + 11))
    rect(img, (mx + 15, my + 10, mx + 16 + mm.width, my + 11 + mm.height), None, "#050506")
    for k in range(5):
        rivet(img, mx + 8 + k * 50, my + 3) if k < 5 else None
        rivet(img, mx + 8 + k * 50, my + 161)
    for k in range(3):
        rivet(img, mx + 4, my + 30 + k * 50); rivet(img, mx + 218, my + 30 + k * 50)
    plate(img, mx, 184, 226, 92, cut=5, brackets=True, seed=11)
    rect(img, (mx + 4, 190, mx + 6, 268), ORA); rect(img, (mx + 5, 190, mx + 5, 268), YEL)
    ptext(img, (mx + 16, 190), "CEL", FB(20), YEL)
    put(img, icon(D["goal_icon"]), (mx + 186, 190))
    ptext(img, (mx + 16, 212), D["goal"], FB(20), TXT)
    for k, ln in enumerate(wrap(D["goal_sub"], FB(20), 196)[:2]):
        ptext(img, (mx + 16, 234 + k * 18), ln, FB(20), MUTED)
    # ---- dymek nad bohaterem
    f = FB(20)
    w_ = tw(D["popup"], f) + 52
    x = D["hero"][0] - w_ // 2; y = D["hero"][1] - 80
    plate(img, x, y, w_, 34, cut=4, rivets=False, brackets=False, hot=True, seed=13)
    put(img, icon(391), (x + 6, y + 1))
    ptext(img, (x + 42, y + 8), D["popup"], f, TXT)
    # ---- zdobycze: żelazne plakietki z żarem
    for i, (ic, s) in enumerate(D["gains"]):
        f = FB(30)
        w_ = tw(s, f) + 60
        y = 560 + i * 40
        x = 1268 - w_
        plate(img, x, y, w_, 34, cut=4, rivets=False, brackets=False, seed=20 + i)
        rect(img, (x + 2, y + 6, x + 3, y + 27), ORA)
        put(img, icon(ic), (x + 10, y + 1))
        ptext(img, (x + 48, y + 3), s, f, TXT)
    # ---- doświadczenie
    plate(img, 1000, 682, 272, 30, cut=4, rivets=False, brackets=False, seed=31)
    ptext(img, (1012, 686), "Poz. 6", FB(20), YEL)
    slot_bar(img, 1066, 690, 196, 12, D["xp"], "xp", notch=20)
    return img


def window():
    img = bg_menu(0.55, 2.0, (8, 6, 4))
    X, Y, PW, PH = 130, 96, 1020, 528
    plate(img, X, Y, PW, PH, cut=10, brackets=True, rivets=False, seed=40)
    for k in range(0, PW - 30, 60):
        rivet(img, X + 14 + k, Y + 5); rivet(img, X + 14 + k, Y + PH - 9)
    # głowa
    ptext(img, (X + 30, Y + 16), "Plecak", FB(40), YEL)
    ptext(img, (X + PW - 300, Y + 24), "Obciążenie", FB(20), MUTED)
    ptext(img, (X + PW - 200, Y + 24), "41 / 120", FB(20), TXT)
    slot_bar(img, X + PW - 124, Y + 30, 96, 8, 41 / 120, "xp", notch=12)
    line(img, [(X + 18, Y + 66), (X + PW - 19, Y + 66)], "#050506")
    line(img, [(X + 18, Y + 67), (X + PW - 19, Y + 67)], IRON[4])
    # zakładki
    tabs = ["Wszystko", "Materiały", "Jedzenie", "Narzędzia", "Do zadań"]
    tx = X + 24
    for i, t in enumerate(tabs):
        f = FB(20)
        w_ = tw(t, f) + 34
        act = i == 0
        plate(img, tx, Y + 80, w_, 30, cut=4, rivets=False, brackets=False, hot=act, seed=50 + i)
        ptext(img, (tx + w_ // 2, Y + 95), t, f, YEL if act else MUTED, anchor="mm")
        tx += w_ + 8
    # siatka przegródek 8 x 5
    gx, gy, cs, gap = X + 24, Y + 126, 60, 6
    sel = 2
    for r in range(5):
        for c in range(8):
            i = r * 8 + c
            x = gx + c * (cs + gap); y = gy + r * (cs + gap)
            d = ImageDraw.Draw(img)
            d.rectangle((x, y, x + cs - 1, y + cs - 1), fill=hexc("#0c0d0f"))
            d.line((x, y, x + cs - 1, y), fill=hexc("#000000")); d.line((x, y, x, y + cs - 1), fill=hexc("#000000"))
            d.line((x + 1, y + cs - 1, x + cs - 1, y + cs - 1), fill=hexc(IRON[4])); d.line((x + cs - 1, y + 1, x + cs - 1, y + cs - 1), fill=hexc(IRON[4]))
            if i < len(BAG):
                _, name, ic, n = BAG[i]
                if i == sel:
                    d.rectangle((x + 1, y + 1, x + cs - 2, y + cs - 2), fill=hexc("#2a1a0c"))
                put(img, icon(ic), (x + 14, y + 10))
                ptext(img, (x + cs - 5, y + cs - 3), "×" + str(n), FB(20), TXT, anchor="rs")
                if name == "Jagody":
                    d.rectangle((x + 4, y + 4, x + 7, y + 7), fill=hexc("#8ad06a"))
                if name == "Zepsute jedzenie":
                    d.rectangle((x + 4, y + 4, x + 7, y + 7), fill=hexc("#c0503a"))
            if i == sel:
                for k, c_ in enumerate((YEL, ORA, DORA)):
                    d.rectangle((x - k - 1, y - k - 1, x + cs + k, y + cs + k), outline=hexc(c_))
    # kolumna opisu
    dx = gx + 8 * (cs + gap) + 14
    dw = X + PW - 24 - dx
    plate(img, dx, gy, dw, 5 * (cs + gap) - gap, cut=6, rivets=False, brackets=False, seed=60)
    d = ImageDraw.Draw(img)
    d.rectangle((dx + 14, gy + 14, dx + 14 + 79, gy + 14 + 79), fill=hexc("#0c0d0f"), outline=hexc("#050506"))
    put(img, icon(322, 2), (dx + 22, gy + 22))
    ptext(img, (dx + 108, gy + 16), "Nasiona", FB(30), YEL)
    ptext(img, (dx + 108, gy + 42), "ziemniaka", FB(30), YEL)
    ptext(img, (dx + 108, gy + 74), "Masz: 3   Waga: 1", FB(20), MUTED)
    line(img, [(dx + 14, gy + 108), (dx + dw - 15, gy + 108)], "#050506")
    line(img, [(dx + 14, gy + 109), (dx + dw - 15, gy + 109)], IRON[4])
    y = gy + 122
    for ln in wrap("Sadzeniaki. Ziemniaki dojrzewają cztery dni. Sadzi się je w zaoranej ziemi od wiosny do jesieni.", FB(20), dw - 30):
        ptext(img, (dx + 16, y), ln, FB(20), TXT); y += 22
    y += 12
    ptext(img, (dx + 16, y), "Gdzie użyć", FB(20), YEL); y += 24
    put(img, icon(321), (dx + 14, y - 4)); ptext(img, (dx + 52, y + 2), "Zaorane pole (motyka)", FB(20), TXT); y += 36
    put(img, icon(326), (dx + 14, y - 4)); ptext(img, (dx + 52, y + 2), "Plon: 3-5 ziemniaków", FB(20), TXT); y += 40
    # przyciski akcji
    for k, (key, lab) in enumerate((("Enter", "Użyj"), ("X", "Upuść"))):
        bx = dx + 16 + k * 150
        plate(img, bx, gy + 5 * (cs + gap) - gap - 50, 136, 34, cut=4, rivets=False, brackets=False, hot=(k == 0), seed=70 + k)
        ptext(img, (bx + 68, gy + 5 * (cs + gap) - gap - 33), key + "  " + lab, FB(20), YEL if k == 0 else MUTED, anchor="mm")
    # stopka
    fy = Y + PH - 36
    hx = X + 26
    for key, lab in (("Strzałki", "wybierz"), ("Q/E", "zakładka"), ("Enter", "użyj"), ("Esc", "wróć")):
        f = FB(20)
        kw = tw(key, f) + 16
        d.rectangle((hx, fy, hx + kw, fy + 22), fill=hexc(IRON[3]), outline=hexc("#050506"))
        d.line((hx + 1, fy + 1, hx + kw - 1, fy + 1), fill=hexc(IRON[5]))
        ptext(img, (hx + kw // 2, fy + 11), key, f, TXT, anchor="mm")
        ptext(img, (hx + kw + 8, fy + 2), lab, f, MUTED)
        hx += kw + tw(lab, f) + 30
    ptext(img, (X + PW - 30, fy + 2), "15 rzeczy · 330 monet", FB(20), YEL, anchor="ra")
    return img


if __name__ == "__main__":
    print(save(hud(), "pomysl_2_kuznia_hud.png"))
    print(save(window(), "pomysl_2_kuznia_okno.png"))
