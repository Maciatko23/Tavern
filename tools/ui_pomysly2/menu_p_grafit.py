# Trzy projekty menu P w stylu „Grafit i miedź” (wybrany 2026-10-08), zamiast pierścienia:
#  A - karta bohatera (popiersie pośrodku, wokół statystyki i sloty, menu jako zakładki u góry)
#  B - panel wysuwany z lewej z dużymi ikonami + podgląd zaznaczonej pozycji po prawej (mapa widoczna)
#  C - hub z kafelkami-kartami (jak menu współczesnych gier)
# Dane prawdziwe: zrzuty/menu_dane.json (dane_menu.js) z zapisu day40_farm.
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from common2 import *
from p3_grafit import PAN, PAN2, LINE, CU, CU2, TXT, MUT, DIM, COL, FR, FM, FB, FSC, sc

M = json.load(open(os.path.join(SHOTS2, "menu_dane.json"), encoding="utf8"))
NAME, LVL, XP, XPN = M["name"], M["hero"]["level"], M["hero"]["xp"], 1200
NEEDS = [("health", "Życie", 0.78, "78%"), ("stamina", "Kondycja", 0.70, "70"), ("food", "Sytość", 0.64, "64"), ("water", "Nawodnienie", 0.41, "41")]
TOOLS = M["tools"]
ITEMS_N, (WEI, CAP) = M["items"], M["weight"]
GOLD_, DEBT_LEFT, DAYS = M["gold"], M["debt"]["left"], M["debt"]["days"]
DONE, GOALS_N = M["done"], M["goals"]
WHEN = "Dzień 40 · lato · 11:03 · pogodnie"
CARD = (30, 32, 36, 238); CARD_HI = (38, 40, 46, 250)
GREEN_OK = "#9fd08a"; WARN = "#e8806a"


def menu_icons():
    return [("Plecak", icon_key(209, "green")), ("Dziennik", icon_key(121, "dark")), ("Postać", hero_sprite(0, 1).crop((16, 4, 48, 36))),
            ("Opcje", icon_key(83, "dark")), ("Zapisz grę", icon_key(246, "green")), ("Zakończ grę", icon_key(197, "green"))]


def blur_bg(dim=0.55, blur=3.0):
    im = bg2().filter(ImageFilter.GaussianBlur(blur))
    im.alpha_composite(Image.new("RGBA", im.size, (10, 10, 12, int(255 * dim))))
    return im


def bar(img, x, y, w, ratio, col, h=4):
    with Over(img) as o:
        o.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=(52, 54, 60, 255))
        if ratio > 0:
            o.rounded_rectangle((x, y, x + max(h, int(w * ratio)), y + h), radius=h // 2, fill=hexc(col))


def glow(img, box, r=12, col=(208, 138, 90), a=90, blur=10):
    x0, y0, x1, y1 = box
    pad = blur * 3
    lay = Image.new("L", (x1 - x0 + 2 * pad, y1 - y0 + 2 * pad), 0)
    ImageDraw.Draw(lay).rounded_rectangle((pad, pad, pad + x1 - x0, pad + y1 - y0), radius=r, fill=a)
    lay = lay.filter(ImageFilter.GaussianBlur(blur))
    c = Image.new("RGBA", lay.size, col + (0,)); c.putalpha(lay)
    img.alpha_composite(c, (x0 - pad, y0 - pad))


def bust_tile(img, x, y, w, h, scale=0.62, dx=0, dy=0, r=10):
    b = hero_bust()
    b = b.resize((int(b.width * scale), int(b.height * scale)), Image.LANCZOS)
    tile = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tile.alpha_composite(b, ((w - b.width) // 2 + dx, dy))
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
    a = np.array(tile); a[..., 3] = np.minimum(a[..., 3], np.array(m)); tile = Image.fromarray(a)
    rpanel(img, (x, y, x + w, y + h), (36, 38, 43, 255), LINE, r=r, shadow=0)
    img.alpha_composite(tile, (x, y))
    with Over(img) as o:
        o.rounded_rectangle((x, y, x + w, y + h), radius=r, outline=LINE)


def foot_keys(img, cx, y, pairs):
    f = FM(15)
    total = sum(max(24, tw(k, f) + 14) + tw(l, f) + 26 for k, l in pairs) - 26
    keycaps(img, cx - total / 2, y, pairs, f, LINE, (28, 29, 33, 235), TXT, "#d8d2c6")


def tool_slot(img, x, y, t, s=48):
    rpanel(img, (x, y, x + s, y + s), (34, 36, 41, 255), LINE, r=8, shadow=0)
    put(img, icon(t["icon"]), (x + (s - 32) // 2, y + 5))
    r = t["left"] / t["life"]
    bar(img, x + 6, y + s - 8, s - 12, r, GREEN_OK if r > 0.5 else "#dda650", h=3)


# =====================================================================================================================
def menu_A():
    """karta bohatera"""
    img = blur_bg(0.6, 3.0)
    # ---- zakładki u góry (pozycje menu)
    items = menu_icons()
    f = FM(18)
    widths = [32 + 8 + tw(n, f) for n, _ in items]
    gap = 34
    total = sum(widths) + gap * (len(items) - 1)
    x = 640 - total / 2
    act = 2
    keycaps(img, x - 56, 30, [("Q", "")], FM(15), LINE, (28, 29, 33, 235), TXT, MUT)
    for i, (n, ic) in enumerate(items):
        on = i == act
        put(img, ic, (x, 26), alpha=1.0 if on else 0.55)
        text(img, (x + 40, 42), n, FB(18) if on else f, TXT if on else MUT, anchor="lm")
        if on:
            with Over(img) as o:
                o.rounded_rectangle((x - 6, 72, x + widths[i] + 6, 74), radius=1, fill=hexc(CU))
        x += widths[i] + gap
    keycaps(img, x - gap + 22, 30, [("E", "")], FM(15), LINE, (28, 29, 33, 235), TXT, MUT)
    with Over(img) as o:
        o.line((60, 80, 1220, 80), fill=LINE)
    # ---- scena: krąg za popiersiem
    cx, cy = 640, 360
    with Over(img) as o:
        o.ellipse((cx - 190, cy - 190, cx + 190, cy + 190), fill=(26, 27, 31, 200), outline=LINE)
        o.ellipse((cx - 178, cy - 178, cx + 178, cy + 178), outline=hexc(CU2))
        o.arc((cx - 178, cy - 178, cx + 178, cy + 178), -90, -90 + 360 * XP / XPN, fill=hexc(CU), width=3)
    b = hero_bust(); b = b.resize((int(b.width * 1.08), int(b.height * 1.08)), Image.LANCZOS)
    bm = np.array(b)
    # obetnij popiersie do kręgu (dół płasko na podstawie)
    yy, xx = np.mgrid[0:b.height, 0:b.width]
    bx0, by0 = cx - b.width // 2, cy + 150 - b.height
    inside = ((xx + bx0 - cx) ** 2 + (yy + by0 - cy) ** 2) <= 176 ** 2
    bm[~inside, 3] = 0
    img.alpha_composite(Image.fromarray(bm), (bx0, by0))
    # tabliczka z imieniem i poziomem pod kręgiem
    rpanel(img, (cx - 130, cy + 158, cx + 130, cy + 222), PAN2, LINE, r=10)
    text(img, (cx, cy + 180), NAME, FB(26), TXT, anchor="mm")
    text(img, (cx, cy + 207), f"Poziom {LVL} · {XP} / {XPN} dośw.", FM(15), CU, anchor="mm")
    # ---- lewa kolumna: stan + atrybuty
    lx, ly, lw = 96, 112, 300
    rpanel(img, (lx, ly, lx + lw, ly + 228), PAN, LINE, r=12)
    sc(img, (lx + 20, ly + 14), "Stan", 13)
    y = ly + 52
    for k, lab, v, val in NEEDS:
        put(img, need_icon(k), (lx + 14, y - 16))
        text(img, (lx + 54, y - 2), lab, FR(16), TXT, anchor="lm")
        text(img, (lx + lw - 20, y - 2), val, FM(16), WARN if k == "water" else TXT, anchor="rm")
        bar(img, lx + 54, y + 12, lw - 74, v, COL[k], h=3)
        y += 44
    rpanel(img, (lx, ly + 244, lx + lw, ly + 488), PAN, LINE, r=12)
    sc(img, (lx + 20, ly + 258), "Atrybuty", 13)
    text(img, (lx + lw - 20, ly + 266), f"{M['hero']['points']} pkt do rozdania", FM(14), CU, anchor="rm")
    attrs = ["Siła", "Zręczność", "Kondycja", "Czujność", "Hart ducha"]
    y = ly + 300
    for i, a in enumerate(attrs):
        if i == 0:
            rpanel(img, (lx + 10, y - 16, lx + lw - 10, y + 18), (44, 46, 52, 255), None, r=6, shadow=0)
            with Over(img) as o:
                o.rectangle((lx + 10, y - 8, lx + 12, y + 10), fill=hexc(CU))
        text(img, (lx + 24, y), a, FM(17), TXT, anchor="lm")
        text(img, (lx + lw - 58, y), "5", FB(18), TXT, anchor="rm")
        rpanel(img, (lx + lw - 46, y - 11, lx + lw - 24, y + 11), None, hexc(CU) if i == 0 else LINE, r=5, shadow=0)
        text(img, (lx + lw - 35, y), "+", FB(16), CU if i == 0 else MUT, anchor="mm")
        y += 37
    # ---- prawa kolumna: sloty
    rx, ry, rw = 884, 112, 300
    rpanel(img, (rx, ry, rx + rw, ry + 488), PAN, LINE, r=12)
    sc(img, (rx + 20, ry + 14), "Narzędzia", 13)
    text(img, (rx + rw - 20, ry + 22), f"{len(TOOLS)} · zużycie", FM(14), MUT, anchor="rm")
    order = [t for t in TOOLS if t["name"] not in ("Proca", "Oszczep")]
    for i, t in enumerate(order[:10]):
        c, r = i % 5, i // 5
        tool_slot(img, rx + 18 + c * 54, ry + 46 + r * 56, t)
    sc(img, (rx + 20, ry + 176), "Broń", 13)
    for i, t in enumerate([t for t in TOOLS if t["name"] in ("Oszczep", "Proca")]):
        tool_slot(img, rx + 18 + i * 54, ry + 202, t)
        text(img, (rx + 18 + i * 54 + 24, ry + 262), t["name"], FR(13), MUT, anchor="mm")
    sc(img, (rx + 20, ry + 290), "Na sobie", 13)
    for i, (nm, where) in enumerate((("Kurtka", "garbarnia"), ("Tarcza", "warsztat"))):
        x0, y0 = rx + 18, ry + 316 + i * 58
        with Over(img) as o:
            o.rounded_rectangle((x0, y0, x0 + 48, y0 + 48), radius=8, outline=(80, 82, 90, 255))
        dashed(img, x0 + 6, y0 + 24, x0 + 42, y0 + 24, (90, 92, 100, 255), 3, 3)
        text(img, (x0 + 62, y0 + 14), nm, FM(17), TXT, anchor="lm")
        text(img, (x0 + 62, y0 + 36), "brak · zrobisz: " + where, FR(14), MUT, anchor="lm")
    sc(img, (rx + 20, ry + 438), "Towarzysz", 13)
    text(img, (rx + 20, ry + 466), "Pies · oswojony", FM(16), TXT, anchor="lm")
    # linie od slotów do postaci (cienkie, miedziane)
    with Over(img) as o:
        for (x0, y0, x1, y1) in ((lx + lw, ly + 120, cx - 172, cy - 60), (rx, ry + 100, cx + 172, cy - 60), (rx, ry + 340, cx + 170, cy + 80)):
            o.line((x0, y0, (x0 + x1) / 2, y0), fill=(208, 138, 90, 110))
            o.line(((x0 + x1) / 2, y0, x1, y1), fill=(208, 138, 90, 110))
            o.ellipse((x1 - 3, y1 - 3, x1 + 3, y1 + 3), fill=(208, 138, 90, 200))
    # ---- dół: cel, sakiewka, dług
    y0 = 618
    rpanel(img, (96, y0, 1184, y0 + 48), PAN, LINE, r=12)
    put(img, icon(337), (110, y0 + 8))
    sc(img, (150, y0 + 6), "Cel", 12)
    text(img, (150, y0 + 32), M["goal"]["title"] + " · Tawerna, 151 kroków", FM(16), TXT, anchor="lm")
    with Over(img) as o:
        o.line((640, y0 + 10, 640, y0 + 38), fill=LINE); o.line((850, y0 + 10, 850, y0 + 38), fill=LINE)
    sc(img, (660, y0 + 6), "Sakiewka", 12)
    text(img, (660, y0 + 32), f"{GOLD_} G", FM(16), "#e8c87a", anchor="lm")
    sc(img, (870, y0 + 6), "Dług dziadka", 12)
    text(img, (870, y0 + 32), f"{2500 - DEBT_LEFT} / 2500 G", FM(16), TXT, anchor="lm")
    bar(img, 990, y0 + 30, 110, (2500 - DEBT_LEFT) / 2500, CU, h=4)
    text(img, (1168, y0 + 32), f"{DAYS} dni", FM(16), TXT, anchor="rm")
    foot_keys(img, 640, 684, [("Q/E", "zakładka"), ("↑↓←→", "wybierz"), ("Enter", "rozdaj / otwórz"), ("Esc", "wróć do gry")])
    return img


# =====================================================================================================================
def menu_B():
    """panel z lewej + podgląd"""
    img = bg2()
    # mapa przygaszona tylko trochę; lekki gradient od lewej
    g = np.zeros((H, W), np.float32)
    g[:] = np.clip(1 - np.arange(W) / 900, 0, 1)[None, :] * 0.55 + 0.18
    lay = Image.new("RGBA", (W, H), (10, 10, 12, 0)); lay.putalpha(Image.fromarray((g * 255).astype(np.uint8)))
    img.alpha_composite(lay)
    PW = 372
    with Over(img) as o:
        o.rectangle((0, 0, PW, H), fill=(20, 21, 24, 242))
        o.line((PW, 0, PW, H), fill=LINE)
        o.line((PW + 1, 0, PW + 1, H), fill=(208, 138, 90, 70))
    # nagłówek: kim jestem
    bust_tile(img, 24, 24, 76, 76, scale=0.5, dx=-6, dy=-6)
    text(img, (116, 44), NAME, FB(26), TXT, anchor="lm")
    sc(img, (116, 62), f"Poziom {LVL}", 13)
    bar(img, 116, 90, 230, XP / XPN, CU, h=4)
    text(img, (346, 74), f"{XP}/{XPN}", FR(13), MUT, anchor="rm")
    y = 124
    for i, (k, lab, v, val) in enumerate(NEEDS):
        x = 24 + i * 84
        put(img, need_icon(k), (x - 4, y - 4))
        text(img, (x + 32, y + 12), val, FM(16), WARN if k == "water" else TXT, anchor="lm")
        bar(img, x + 2, y + 32, 70, v, COL[k], h=3)
    with Over(img) as o:
        o.line((24, 176, PW - 24, 176), fill=LINE)
    # pozycje menu
    subs = [f"{ITEMS_N} rzeczy · {WEI} / {CAP}", M["goal"]["title"], f"{M['hero']['points']} pkt atrybutów do rozdania",
            "Wygląd, dźwięk, sterowanie", "Plik 1 · dzień 40", "Wróć do ekranu tytułowego"]
    sel = 0
    for i, ((n, ic), sub) in enumerate(zip(menu_icons(), subs)):
        y = 192 + i * 68
        on = i == sel
        if on:
            rpanel(img, (14, y, PW - 14, y + 60), (44, 46, 52, 255), None, r=10, shadow=0)
            with Over(img) as o:
                o.rounded_rectangle((14, y + 12, 17, y + 48), radius=1, fill=hexc(CU))
        cxx = 56 + (6 if on else 0)
        with Over(img) as o:
            o.ellipse((cxx - 24, y + 6, cxx + 24, y + 54), fill=(52, 54, 60, 255) if on else (34, 36, 41, 255), outline=hexc(CU) if on else LINE, width=2 if on else 1)
        put(img, ic, (cxx - 16, y + 14))
        text(img, (cxx + 40, y + 22), n, FB(21) if on else FM(20), TXT if on else "#cfc9bd", anchor="lm")
        text(img, (cxx + 40, y + 44), sub, FR(14), CU if on else MUT, anchor="lm")
        if on:
            text(img, (PW - 34, y + 30), "›", FB(30), CU, anchor="mm")
    with Over(img) as o:
        o.line((24, 610, PW - 24, 610), fill=LINE)
    sc(img, (24, 622), "Sakiewka", 12, MUT)
    text(img, (PW - 24, 630), f"{GOLD_} G", FM(16), "#e8c87a", anchor="rm")
    sc(img, (24, 648), "Dług dziadka", 12, MUT)
    text(img, (PW - 24, 656), f"{DEBT_LEFT} G · {DAYS} dni", FM(16), TXT, anchor="rm")
    bar(img, 24, 676, PW - 48, (2500 - DEBT_LEFT) / 2500, CU, h=3)
    # ---- podgląd: Plecak
    X, Y, PWr, PH = 452, 96, 760, 470
    rpanel(img, (X, Y, X + PWr, Y + PH), (22, 23, 26, 232), LINE, r=14, shadow=90)
    put(img, icon_key(209, "green").resize((48, 48), Image.NEAREST), (X + 28, Y + 24))
    text(img, (X + 90, Y + 40), "Plecak", FB(30), TXT, anchor="lm")
    text(img, (X + 90, Y + 66), f"{ITEMS_N} rzeczy · 330 monet", FR(15), MUT, anchor="lm")
    sc(img, (X + PWr - 240, Y + 30), "Obciążenie", 12, MUT)
    bar(img, X + PWr - 240, Y + 54, 150, WEI / CAP, CU, h=5)
    text(img, (X + PWr - 28, Y + 56), f"{WEI} / {CAP}", FM(17), TXT, anchor="rm")
    with Over(img) as o:
        o.line((X + 28, Y + 92, X + PWr - 28, Y + 92), fill=LINE)
    cats = [("Materiały", 11), ("Jedzenie", 6), ("Nasiona", 3), ("Narzędzia", 12), ("Inne", 2)]
    x = X + 28
    for nm, n in cats:
        s = f"{nm}  {n}"
        rpanel(img, (x, Y + 106, x + tw(s, FM(15)) + 22, Y + 132), (36, 38, 43, 255), LINE, r=13, shadow=0)
        text(img, (x + 11, Y + 119), s, FM(15), TXT, anchor="lm")
        x += tw(s, FM(15)) + 32
    sc(img, (X + 28, Y + 150), "Na wierzchu", 12)
    for i, (_, name, ic, n) in enumerate(BAG[:14]):
        c, r = i % 7, i // 7
        x0, y0 = X + 28 + c * 66, Y + 174 + r * 66
        rpanel(img, (x0, y0, x0 + 58, y0 + 58), (34, 36, 41, 255), LINE, r=8, shadow=0)
        put(img, icon(ic), (x0 + 13, y0 + 8))
        text(img, (x0 + 52, y0 + 52), str(n), FM(13), TXT, anchor="rd", stroke=2, sfill=(30, 32, 36, 255))
    sc(img, (X + 28, Y + 322), "Narzędzia · zużycie", 12)
    for i, t in enumerate(TOOLS[:12]):
        tool_slot(img, X + 28 + i * 58, Y + 346, t, s=50)
    text(img, (X + 28, Y + PH - 34), "Enter otwiera plecak · Jagody zepsują się za 3 dni", FR(15), MUT, anchor="lm")
    rpanel(img, (640, 672, 1024, 704), (20, 21, 24, 220), LINE, r=16, shadow=40)
    foot_keys(img, 832, 676, [("↑↓", "wybierz"), ("Enter / →", "otwórz"), ("Esc / P", "wróć do gry")])
    return img


# =====================================================================================================================
def card(img, box, sel=False, r=14):
    if sel:
        glow(img, box, r=r, a=110, blur=10)
        rpanel(img, box, CARD_HI, hexc(CU), r=r, lw=2, shadow=0)
    else:
        rpanel(img, box, CARD, LINE, r=r, shadow=60)


def card_head(img, x, y, ic, title, right=None, big=True):
    put(img, ic, (x, y))
    text(img, (x + 42, y + 16), title, FB(22) if big else FB(19), TXT, anchor="lm")
    if right:
        return right


def menu_C():
    """hub z kafelkami"""
    img = blur_bg(0.62, 4.0)
    # nagłówek
    text(img, (80, 48), NAME, FB(34), TXT, anchor="lm")
    rpanel(img, (80 + tw(NAME, FB(34)) + 14, 34, 80 + tw(NAME, FB(34)) + 104, 62), (44, 46, 52, 255), hexc(CU), r=14, shadow=0)
    text(img, (80 + tw(NAME, FB(34)) + 59, 48), f"Poziom {LVL}", FM(15), CU, anchor="mm")
    text(img, (1200, 40), WHEN, FR(16), MUT, anchor="rm")
    text(img, (1200, 62), "Pole dziadka", FM(16), TXT, anchor="rm")
    ic = menu_icons()
    # rząd 1: Plecak (zaznaczony) | Dziennik
    x0, y0 = 80, 92
    A = (x0, y0, x0 + 548, y0 + 252)
    card(img, A, sel=True)
    put(img, ic[0][1], (A[0] + 22, A[1] + 20))
    text(img, (A[0] + 64, A[1] + 36), "Plecak", FB(24), TXT, anchor="lm")
    text(img, (A[2] - 22, A[1] + 36), f"{ITEMS_N} rzeczy", FM(16), CU, anchor="rm")
    bar(img, A[0] + 22, A[1] + 66, 504 - 90, WEI / CAP, CU, h=5)
    text(img, (A[2] - 22, A[1] + 68), f"{WEI} / {CAP}", FM(15), TXT, anchor="rm")
    for i, (_, name, ic_, n) in enumerate(BAG[:14]):
        c, r = i % 7, i // 7
        bx, by = A[0] + 22 + c * 72, A[1] + 90 + r * 72
        rpanel(img, (bx, by, bx + 62, by + 62), (40, 42, 47, 255), LINE, r=8, shadow=0)
        put(img, icon(ic_), (bx + 15, by + 10))
        text(img, (bx + 56, by + 56), str(n), FM(13), TXT, anchor="rd", stroke=2, sfill=(40, 42, 47, 255))
    B = (x0 + 564, y0, 1200, y0 + 252)
    card(img, B)
    put(img, ic[1][1], (B[0] + 22, B[1] + 20))
    text(img, (B[0] + 64, B[1] + 36), "Dziennik", FB(24), TXT, anchor="lm")
    text(img, (B[2] - 22, B[1] + 36), f"{DONE} / {GOALS_N} celów", FM(16), MUT, anchor="rm")
    rpanel(img, (B[0] + 22, B[1] + 64, B[2] - 22, B[1] + 150), (40, 42, 47, 255), LINE, r=10, shadow=0)
    put(img, icon(337, 1.5), (B[0] + 34, B[1] + 82))
    sc(img, (B[0] + 96, B[1] + 74), "Śledzony cel · Rozdział I", 12)
    text(img, (B[0] + 96, B[1] + 106), M["goal"]["title"], FB(20), TXT, anchor="lm")
    text(img, (B[0] + 96, B[1] + 132), "Tawerna · 151 kroków na wschód", FR(15), MUT, anchor="lm")
    for i, (gic, gname, _) in enumerate(GOALS[1:3]):
        yy = B[1] + 176 + i * 36
        put(img, icon(gic), (B[0] + 26, yy - 14), alpha=0.8)
        text(img, (B[0] + 64, yy + 2), gname, FR(16), "#cfc9bd", anchor="lm")
    # rząd 2: Postać | Dług dziadka i sakiewka
    y1 = y0 + 252 + 16
    Cc = (x0, y1, x0 + 548, y1 + 176)
    card(img, Cc)
    bust_tile(img, Cc[0] + 20, Cc[1] + 20, 120, 136, scale=0.52, dx=-4, dy=-4)
    with Over(img) as o:
        o.arc((Cc[0] + 162, Cc[1] + 30, Cc[0] + 222, Cc[1] + 90), -90, -90 + 360 * XP / XPN, fill=hexc(CU), width=4)
        o.arc((Cc[0] + 162, Cc[1] + 30, Cc[0] + 222, Cc[1] + 90), -90 + 360 * XP / XPN, 270, fill=(52, 54, 60, 255), width=4)
    text(img, (Cc[0] + 192, Cc[1] + 60), str(LVL), FB(24), TXT, anchor="mm")
    text(img, (Cc[0] + 236, Cc[1] + 46), "Postać", FB(24), TXT, anchor="lm")
    text(img, (Cc[0] + 236, Cc[1] + 72), f"{XP} / {XPN} dośw.", FR(15), MUT, anchor="lm")
    rpanel(img, (Cc[0] + 236, Cc[1] + 92, Cc[0] + 236 + 196, Cc[1] + 118), None, hexc(CU), r=13, shadow=0)
    text(img, (Cc[0] + 334, Cc[1] + 105), f"{M['hero']['points']} pkt · {M['hero']['skillPoints']} umiejętności", FM(14), CU, anchor="mm")
    for i, (k, lab, v, val) in enumerate(NEEDS):
        xx = Cc[0] + 162 + i * 92
        put(img, need_icon(k), (xx - 4, Cc[1] + 124))
        text(img, (xx + 30, Cc[1] + 140), val, FM(15), WARN if k == "water" else TXT, anchor="lm")
        bar(img, xx, Cc[1] + 160, 72, v, COL[k], h=3)
    D = (x0 + 564, y1, 1200, y1 + 176)
    card(img, D)
    sc(img, (D[0] + 22, D[1] + 18), "Dług dziadka u Lorda", 13)
    text(img, (D[0] + 22, D[1] + 66), f"{DEBT_LEFT} G", FB(34), TXT, anchor="lm")
    text(img, (D[0] + 22 + tw(f"{DEBT_LEFT} G", FB(34)) + 10, D[1] + 70), "zostało do spłaty", FR(16), MUT, anchor="lm")
    text(img, (D[2] - 22, D[1] + 66), f"{DAYS} dni", FB(26), WARN, anchor="rm")
    bar(img, D[0] + 22, D[1] + 100, D[2] - D[0] - 44, (2500 - DEBT_LEFT) / 2500, CU, h=6)
    text(img, (D[0] + 22, D[1] + 124), f"Spłacono {2500 - DEBT_LEFT} z 2500 G", FR(15), MUT, anchor="lm")
    text(img, (D[2] - 22, D[1] + 124), "do terminu", FR(15), MUT, anchor="rm")
    with Over(img) as o:
        o.line((D[0] + 22, D[1] + 140, D[2] - 22, D[1] + 140), fill=LINE)
    text(img, (D[0] + 22, D[1] + 158), "Sakiewka", FR(15), MUT, anchor="lm")
    text(img, (D[2] - 22, D[1] + 158), f"{GOLD_} G", FM(16), "#e8c87a", anchor="rm")
    # rząd 3: Opcje | Zapisz grę | Zakończ grę
    y2 = y1 + 176 + 16
    w3 = (1200 - x0 - 32) // 3
    for i, (k, sub) in enumerate(((3, "Wygląd: Grafit · dźwięk 5%"), (4, "Plik 1 · dzień 40"), (5, "Do ekranu tytułowego"))):
        bx = x0 + i * (w3 + 16)
        bxx = (bx, y2, bx + w3, y2 + 72)
        card(img, bxx)
        put(img, ic[k][1], (bx + 20, y2 + 20))
        text(img, (bx + 64, y2 + 26), ic[k][0], FB(19), TXT, anchor="lm")
        text(img, (bx + 64, y2 + 50), sub, FR(14), MUT, anchor="lm")
    foot_keys(img, 640, 682, [("↑↓←→", "kafelek"), ("Enter", "otwórz"), ("1–6", "skrót"), ("Esc / P", "wróć do gry")])
    return img


if __name__ == "__main__":
    print(save2(menu_A(), "menu_p_A.png"))
    print(save2(menu_B(), "menu_p_B.png"))
    print(save2(menu_C(), "menu_p_C.png"))
