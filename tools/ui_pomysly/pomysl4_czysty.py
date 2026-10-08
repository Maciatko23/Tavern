# Pomysł 4: CZYSTY WIDOK - nic nie zasłania. Bez paneli: sam tekst z obrysem, cienkie linie, kompas zamiast minimapy,
# potrzeby małe w lewym dole (i przy bohaterze tylko wtedy, gdy coś spada), menu P jako pierścień wokół bohatera.
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from uikit import *

WH = "#f6f2ea"; MUT = "#d0ccc2"; YEL = "#ffd23f"
COL = {"health": "#ff6b5e", "stamina": "#8fe06a", "food": "#ffb84a", "water": "#5ab8ff"}
F = lambda s: font("AlegreyaSans-Medium.ttf", s)
SH = (0, 0, 0, 210)


def t(img, xy, s, f, fill=WH, anchor="la", alpha=1.0):
    text(img, xy, s, f, fill, stroke=2, sfill=SH, anchor=anchor, alpha=alpha)


def edge_shade(img, top=90, bottom=80, a=0.38):
    """delikatne przyciemnienie przy górnej i dolnej krawędzi (żeby tekst był czytelny bez paneli)"""
    g = np.zeros((H, W), np.float32)
    for y in range(top):
        g[y] = max(g[y, 0], (1 - y / top) ** 1.6 * a)
    for y in range(bottom):
        g[H - 1 - y] = max(g[H - 1 - y, 0], (1 - y / bottom) ** 1.6 * a)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lay.putalpha(Image.fromarray((g * 255).astype(np.uint8)))
    img.alpha_composite(lay)


def thin_bar(img, x, y, w, ratio, col, h=4, alpha=1.0):
  with Over(img) as d:
    d.rectangle((x - 1, y - 1, x + w, y + h), fill=(0, 0, 0, int(150 * alpha)))
    d.rectangle((x, y, x + w - 1, y + h - 1), fill=(255, 255, 255, int(40 * alpha)))
    d.rectangle((x, y, x + int(w * ratio) - 1, y + h - 1), fill=hexc(col, int(255 * alpha)))


def sun_arc(img, x, y, w, hour):
  with Over(img) as d:
    r = w // 2
    cx, cy = x + r, y + r
    for k in range(0, 181, 3):
        a = math.radians(180 + k)
        px, py = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.55
        d.point((px + 1, py + 1), fill=SH)
        d.point((px, py), fill=hexc(WH, 200))
    d.line((x - 4, cy + 1, x + w + 4, cy + 1), fill=SH); d.line((x - 4, cy, x + w + 4, cy), fill=hexc(WH, 200))
    frac = (hour - 5) / 15   # wschód 5, zachód 20
    a = math.radians(180 + 180 * frac)
    sx, sy = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.55
    d.ellipse((sx - 6, sy - 6, sx + 6, sy + 6), fill=hexc("#000000", 160))
    d.ellipse((sx - 5, sy - 5, sx + 5, sy + 5), fill=hexc(YEL))
    d.ellipse((sx - 3, sy - 3, sx + 0, sy + 0), fill=hexc("#fff6c8"))


def compass(img, cx, y, w=440, heading=0, goal_deg=-8):
    x0 = cx - w // 2
    # linia znikająca na końcach
    with Over(img) as d:
      for x in range(w):
        a = min(1, min(x, w - x) / 60)
        d.point((x0 + x, y + 1), fill=(0, 0, 0, int(160 * a)))
        d.point((x0 + x, y), fill=hexc(WH, int(200 * a)))
    d = ImageDraw.Draw(img)
    labs = {0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW"}
    for deg in range(-120, 121, 15):
        x = cx + deg * (w / 2) / 120
        a = min(1, min(x - x0, x0 + w - x) / 60)
        if a <= 0:
            continue
        hd = (deg + heading) % 360
        if hd in labs:
            t(img, (x, y - 14), labs[hd], F(17 if len(labs[hd]) == 1 else 13), YEL if hd == 0 else WH, anchor="mm", alpha=a)
        else:
            d.line((x, y - 4, x, y), fill=hexc(mix("#9aa29a", WH, a)))
    gx = cx + goal_deg * (w / 2) / 120
    d.polygon([(gx, y + 5), (gx + 6, y + 11), (gx, y + 17), (gx - 6, y + 11)], fill=hexc(YEL), outline=SH)
    t(img, (gx, y + 30), "Tawerna · 140 kroków", F(15), YEL, anchor="mm")


def needs_ring(img, cx, cy, vals):
    """łuk przed stopami bohatera: 4 odcinki potrzeb (pokazywany tylko, gdy coś spada; tu mruga woda)"""
    ov = Over(img); d = ov.__enter__()
    rx, ry = 34, 13
    for k, (key, v) in enumerate(vals):
        a0 = 18 + k * 37; a1 = a0 + 33
        for s_ in range(a0 * 2, a1 * 2):
            s = s_ / 2
            px, py = cx + math.cos(math.radians(s)) * rx, cy + math.sin(math.radians(s)) * ry
            d.rectangle((px - 2, py - 2, px + 2, py + 2), fill=(0, 0, 0, 150))
    for k, (key, v) in enumerate(vals):
        a0 = 18 + k * 37; a1 = a0 + 33
        for s_ in range(a0 * 2, a1 * 2):
            s = s_ / 2
            if (s - a0) / 33 > v:
                continue
            px, py = cx + math.cos(math.radians(s)) * rx, cy + math.sin(math.radians(s)) * ry
            d.rectangle((px - 1, py - 1, px, py), fill=hexc(COL[key]))
    ov.__exit__()


def hud():
    img = bg_map()
    edge_shade(img)
    # ---- lewy górny róg: godzina, łuk słońca, dzień, cel
    t(img, (20, 10), D["hour"], F(34))
    sun_arc(img, 112, 16, 74, D["hand"])
    t(img, (20, 52), "Południe · dzień 40 · lato", F(17), MUT)
    put(img, icon(D["goal_icon"]), (14, 78))
    t(img, (50, 80), D["goal"], F(19), YEL)
    t(img, (50, 104), "Borgar · ścieżka na północ", F(15), MUT)
    # ---- kompas u góry, nazwa miejsca pod nim (gaśnie po wejściu)
    compass(img, 640, 30)
    fz = F(40)
    lw = tw(D["map"], fz)
    t(img, (640, 96), D["map"], fz, WH, anchor="mm", alpha=0.85)
    ov = Over(img); d = ov.__enter__()
    for side in (-1, 1):
        for k in range(90):
            x = 640 + side * (lw // 2 + 16 + k)
            d.point((x, 98), fill=hexc(WH, int(200 * (1 - k / 90) * 0.85)))
    ov.__exit__()
    t(img, (640, 124), "M: pokaż mapę", F(13), MUT, anchor="mm", alpha=0.7)
    # ---- prawy górny róg: nic (minimapa pod M) - tylko mała ikona stanu pogody i ciężar
    put(img, icon(370), (1222, 10))
    t(img, (1214, 18), "41 / 120", F(17), WH, anchor="ra")
    # ---- potrzeby: lewy dół, cienkie paski bez ramek
    rows = [("health", icon_key(84, "dark"), D["health"]), ("stamina", icon_bare(82), D["stamina"]),
            ("food", icon(390), D["food"]), ("water", icon(391), D["water"])]
    for i, (k, ic, v) in enumerate(rows):
        x = 18 + i * 128
        put(img, ic, (x, 670))
        thin_bar(img, x + 36, 685, 80, v, COL[k], h=5)
    with Over(img) as d:
        d.rectangle((18 + 3 * 128 - 3, 667, 18 + 3 * 128 + 118, 705), outline=hexc("#5ab8ff", 200))
    # ---- przy bohaterze: łuk potrzeb pod stopami + myśl bez dymka
    hx, hy = D["hero_feet"]
    needs_ring(img, hx, hy + 2, [("health", D["health"]), ("stamina", D["stamina"]), ("food", D["food"]), ("water", D["water"])])
    put(img, icon(391), (hx - 82, D["hero"][1] - 74))
    t(img, (hx - 46, D["hero"][1] - 68), D["popup"] + "…", F(19), "#bfe4ff")
    # ---- zdobycze: sam tekst z ikoną, starsze bledną
    for i, (ic, s) in enumerate(D["gains"]):
        a = [0.55, 0.8, 1.0][i]
        y = 600 + i * 30
        f = F(20)
        put(img, icon(ic), (1262 - tw(s, f) - 40, y - 6), alpha=a)
        t(img, (1262, y), s, f, WH, anchor="ra", alpha=a)
    # ---- doświadczenie: kreska na samym dole
    with Over(img) as d:
        d.rectangle((0, 715, W, 719), fill=(0, 0, 0, 140))
        d.rectangle((0, 716, int(W * D["xp"]), 719), fill=hexc(YEL, 230))
    t(img, (int(W * D["xp"]) - 6, 692), "Poz. 6", F(15), YEL, anchor="ra")
    return img


def window():
    img = bg_map()
    hx, hy = D["hero"][0], D["hero"][1] + 2
    # przyciemnienie z jasnym kręgiem wokół bohatera
    yy, xx = np.mgrid[0:H, 0:W]
    dist = np.sqrt((xx - hx) ** 2 + ((yy - hy) * 1.15) ** 2)
    a = np.clip((dist - 150) / 260, 0, 1) * 0.62 + 0.12
    lay = Image.new("RGBA", (W, H), (6, 8, 10, 0)); lay.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    img.alpha_composite(lay)
    d = ImageDraw.Draw(img)
    # ---- pierścień poleceń
    items = [("Plecak", icon_key(209, "green")), ("Dziennik", icon_key(121, "dark")), ("Opcje", icon_key(83, "dark")),
             ("Zakończ grę", icon_key(197, "green")), ("Zapisz grę", icon_key(246, "green")), ("Postać", None)]
    R = 132
    for k, (lab, ic) in enumerate(items):
        ang = math.radians(-90 + k * 60)
        cx, cy = hx + math.cos(ang) * R, hy + math.sin(ang) * R * 0.92
        sel = k == 0
        r = 34 if sel else 27
        with Over(img) as o:
            o.ellipse((cx - r - 3, cy - r - 1, cx + r + 3, cy + r + 5), fill=(0, 0, 0, 90))
            o.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(12, 14, 16, 200), outline=hexc(YEL if sel else WH, 255 if sel else 150))
            if sel:
                o.ellipse((cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3), outline=hexc(YEL, 90))
        if ic is None:
            hs = hero_sprite(0, 1).crop((16, 4, 48, 36))
            ic = hs
        if sel:
            ic = ic.resize((48, 48), Image.NEAREST)
            put(img, ic, (cx - 24, cy - 24))
        else:
            put(img, ic, (cx - 16, cy - 16))
        if not sel:
            t(img, (cx, cy + r + 12), lab, F(15), MUT, anchor="mm")
    # cienki okrąg prowadzący
    ov = Over(img); d = ov.__enter__()
    for s in range(0, 360, 2):
        px, py = hx + math.cos(math.radians(s)) * R, hy + math.sin(math.radians(s)) * R * 0.92
        d.point((px, py), fill=hexc(WH, 60))
    ov.__exit__()
    # podpis wybranego nad pierścieniem
    t(img, (hx, hy - R - 58), "Plecak", F(30), YEL, anchor="mm")
    t(img, (hx, hy - R - 82), "15 rzeczy · 41 / 120", F(16), MUT, anchor="mm")
    # ---- lewa kolumna: kim jestem (bez ramki)
    x0, y0 = 60, 210
    t(img, (x0, y0), "Reid", F(36))
    t(img, (x0 + 84, y0 + 13), "Poziom 6", F(20), YEL)
    t(img, (x0, y0 + 46), "Dzień 40 · lato · 11:05 · bezchmurnie", F(16), MUT)
    rows = [("Zdrowie", "health", D["health"], "78%"), ("Wytrzymałość", "stamina", D["stamina"], "70"),
            ("Sytość", "food", D["food"], "64"), ("Nawodnienie", "water", D["water"], "41")]
    for i, (lab, k, v, val) in enumerate(rows):
        y = y0 + 84 + i * 40
        t(img, (x0, y), lab, F(18))
        t(img, (x0 + 230, y), val, F(18), "#9fd6ff" if k == "water" else WH, anchor="ra")
        thin_bar(img, x0, y + 26, 230, v, COL[k], h=4)
    t(img, (x0, y0 + 260), "Dług dziadka: 1250 / 2500 G", F(17), WH)
    t(img, (x0, y0 + 282), "zostało 21 dni", F(15), MUT)
    # ---- prawa kolumna: podgląd zawartości wybranego (plecak)
    x1, y1 = 930, 210
    t(img, (x1, y1), "Na wierzchu", F(18), MUT)
    for k, (iid, name, ic, n) in enumerate(BAG[:8]):
        y = y1 + 34 + k * 36
        put(img, icon(ic), (x1, y - 4))
        t(img, (x1 + 40, y), name, F(18))
        t(img, (x1 + 280, y), "×" + str(n), F(18), MUT, anchor="ra")
    t(img, (x1, y1 + 34 + 8 * 36 + 4), "… i 7 innych", F(16), MUT)
    # ---- podpowiedź na dole
    t(img, (640, 690), "←  →  obróć      Enter  otwórz      Esc  wróć do gry", F(17), WH, anchor="mm")
    return img


if __name__ == "__main__":
    print(save(hud(), "pomysl_4_czysty_hud.png"))
    print(save(window(), "pomysl_4_czysty_okno.png"))
