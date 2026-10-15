# 10 makiet ekranu tytułowego (docs/ekran_tytulowy/tytul_NN_*.png). Uruchom: python ekrany.py [numery...]
import sys
from tytul import *
import numpy as np

FT = lambda s: font("Cinzel.ttf", s, 700)          # klasyczne kapitaliki
FTb = lambda s: font("Cinzel.ttf", s, 900)
FP = lambda s: font("PirataOne.ttf", s)            # gotyk
FU = lambda s: font("UncialAntiqua.ttf", s)
FCo = lambda s: font("CormorantSC-Bold.ttf", s)
FG = lambda s, w=600: font("EBGaramond.ttf", s, w)


# 1 -------------------------------------------------------------------------------------------------------------------
def t01():
    """Tawerna nocą w deszczu"""
    img = bg_art("tawerna_deszcz.png")
    img = grade(img, bright=0.92, contrast=1.05)
    gradient(img, 0, 260, 0.62, 0.0, (6, 8, 16))
    gradient(img, 470, 720, 0.0, 0.7, (4, 5, 10))
    gradient(img, 0, 0, 0.55, 0.0, (4, 5, 10), x0=0, x1=520, horizontal=True)
    rain(img, n=520, seed=1, ang=0.18, length=(16, 34), alpha=(50, 120))
    rain(img, n=160, seed=9, ang=0.18, length=(30, 52), color=(210, 220, 240), alpha=(90, 160))
    glow_spot(img, 840, 560, 140, "#ffb060", 0.22)       # światło z drzwi na kałużach
    vignette(img, 0.6)
    metal_text(img, (640, 92), "TAWERNA", FT(92), CU, glow=("#ff9a50", 14, 0.35), spacing=10)
    diamond_rule(img, 640, 152, 230, COPPER)
    spaced(img, (640, 176), "opowieść spod ruin", FSC(20), "#e8c8a8", sp=4, stroke=2, sfill=(0, 0, 0, 170))
    menu_column(img, 96, 486, sel=1, step=44, align="l", marker="bar")
    keys_hint(img, 1256, 700, [("↑↓", "wybierz"), ("Enter", "zatwierdź")])
    return img


# 2 -------------------------------------------------------------------------------------------------------------------
def t02():
    """Kufel przy kominku"""
    img = bg_art("kufel_kominek.png")
    img = grade(img, bright=1.0, contrast=1.05)
    gradient(img, 0, 0, 0.82, 0.0, (10, 5, 2), x0=0, x1=620, horizontal=True)
    embers(img, n=70, seed=3, box=(820, 60, 1220, 420), size=(1, 3))
    glow_spot(img, 1000, 380, 260, "#ff8a3a", 0.18)
    vignette(img, 0.55)
    metal_text(img, (64, 132), "Tawerna", FP(120), GOLD, anchor="lm", glow=("#ffb050", 18, 0.35))
    with Over(img) as o:
        o.line((70, 196, 400, 196), fill=hexc("#c99a3a")[:3] + (200,))
        o.polygon([(410, 191), (415, 196), (410, 201), (405, 196)], fill=hexc("#c99a3a"))
    text(img, (70, 222), "Ciepły kąt na krańcu świata", FG(22, 500), "#e8d4b0", anchor="lm", stroke=2, sfill=(0, 0, 0, 170))
    menu_column(img, 88, 340, sel=0, step=46, align="l", marker="bar", accent="#e0a43a")
    keys_hint(img, 70, 692, [("↑↓", "wybierz"), ("Enter", "zatwierdź")], anchor="l")
    return img


# 3 -------------------------------------------------------------------------------------------------------------------
def t03():
    """Przekrój: tawerna na górze, ruiny i schody, Serce na dole"""
    img = bg_art("przekroj.png")
    img = grade(img, bright=0.95, contrast=1.06)
    gradient(img, 0, 0, 0.78, 0.0, (6, 6, 10), x0=0, x1=470, horizontal=True)
    rays(img, 636, 620, n=9, length=360, spread=80, color="#7ff0e0", alpha=0.16)
    dust(img, n=90, seed=6, box=(440, 470, 860, 700))
    embers(img, n=24, seed=8, box=(80, 160, 1200, 420), colors=("#ffd27a", "#ff9a3a"), size=(1, 2))
    vignette(img, 0.5)
    metal_text(img, (52, 300), "Tawerna", FT(78), CU, anchor="lm", glow=("#ff9a50", 12, 0.3))
    text(img, (56, 352), "Pod tawerną jest zamek.", FG(21, 500), "#e8d4b0", anchor="lm", stroke=2, sfill=(0, 0, 0, 190))
    text(img, (56, 378), "Pod zamkiem jest coś, czego zamek strzegł.", FG(21, 500), "#9fe8dc", anchor="lm", stroke=2, sfill=(0, 0, 0, 190))
    menu_column(img, 76, 468, sel=1, step=42, align="l", marker="bar", accent="#4fd0c0")
    with Over(img) as o:
        o.line((1244, 120, 1244, 690), fill=(220, 230, 230, 90))
        for y in (150, 300, 430, 560, 680):
            o.line((1238, y, 1250, y), fill=(220, 230, 230, 160))
    for y, lab in ((150, "Tawerna"), (300, "Ruiny zamku"), (430, "Piętro 10"), (560, "Piętro 50"), (680, "Piętro 100")):
        text(img, (1230, y), lab, FM(14), "#cfe8e4" if y < 600 else "#7ff0e0", anchor="rm", stroke=2, sfill=(0, 0, 0, 190))
    return img


# 4 -------------------------------------------------------------------------------------------------------------------
def t04():
    """Chata dziadka o świcie"""
    img = bg_art("chata_swit.png")
    img = grade(img, bright=1.02, contrast=1.02)
    gradient(img, 0, 220, 0.25, 0.0, (40, 20, 30))
    mist(img, 430, 700, seed=5, color=(232, 230, 240), alpha=0.5, cell=110)
    mist(img, 520, 720, seed=15, color=(240, 236, 240), alpha=0.35, cell=70)
    rays(img, 980, 180, n=6, length=700, spread=110, color="#ffe0a0", alpha=0.10, up=False, seed=4)
    gradient(img, 560, 720, 0.0, 0.55, (30, 22, 30))
    vignette(img, 0.35)
    metal_text(img, (640, 88), "Tawerna", FCo(96), GOLD, glow=("#fff0b8", 16, 0.35), outline="#3a2410", shadow=(0, 3, 110))
    text(img, (640, 150), "Dług dziadka · sześćdziesiąt dni", FG(22, 500), "#4a3424", anchor="mm")
    menu_row(img, 664, sel=0, gap=64, color="#fff8ec", mut="#f0e4d4", accent="#f0c060")
    return img


# 5 -------------------------------------------------------------------------------------------------------------------
def t05():
    """Ognisko w lesie, wilki w ciemności"""
    img = bg_art("ognisko.png")
    img = grade(img, bright=0.95, contrast=1.08)
    glow_spot(img, 760, 600, 300, "#ff8a3a", 0.18)
    embers(img, n=40, seed=11, box=(700, 380, 860, 600), size=(1, 2))
    fireflies(img, n=14, seed=4, box=(80, 200, 1200, 560))
    for (x, y) in ((150, 372), (176, 372), (442, 436), (462, 436), (1002, 412), (1024, 412), (1132, 386), (1150, 386), (290, 395), (308, 395)):
        glow_spot_small(img, x, y, 6, "#ffd040", 0.5)
    gradient(img, 0, 250, 0.55, 0.0, (2, 4, 6))
    vignette(img, 0.65, 1.8)
    metal_text(img, (640, 96), "TAWERNA", FT(84), CU, glow=("#ff7a30", 18, 0.4), spacing=8)
    spaced(img, (640, 152), "każde światło to ogień", FSC(19), "#e8b890", sp=4, stroke=2, sfill=(0, 0, 0, 180))
    menu_column(img, 1186, 500, sel=0, step=44, align="r", marker="bar")
    return img


# 6 -------------------------------------------------------------------------------------------------------------------
def t06():
    """Minimalistyczny: czerń, kruk na szyldzie, miedziany napis"""
    img = Image.new("RGBA", (W, H), (12, 12, 14, 255))
    n = noise(W, H, cell=3, seed=1, octaves=1)
    a = np.asarray(img).astype(np.int16).copy()
    a[..., :3] = np.clip(a[..., :3] + (n[..., None] * 6).astype(np.int16), 0, 255)
    img = Image.fromarray(a.astype(np.uint8))
    glow_spot(img, 640, 300, 360, "#ff8a3a", 0.12)
    glow_spot(img, 640, 330, 160, "#ffb060", 0.10)
    sign = Image.open(os.path.join(ART, "szyld.png")).convert("RGBA")
    sign = sign.resize((sign.width * 2, sign.height * 2), Image.NEAREST)
    put(img, sign, (640 - sign.width // 2 - 20, 100))
    glow_spot_small(img, 640, 430, 40, "#ffb060", 0.35)
    metal_text(img, (640, 466), "T A W E R N A", FT(46), CU, glow=("#ff9a50", 10, 0.25))
    diamond_rule(img, 640, 504, 150, COPPER)
    menu_row(img, 584, sel=1, gap=60, accent=COPPER)
    spaced(img, (640, 692), "krucza wyspa", FSC(14), "#8a7a6a", sp=3)
    return img


# 7 -------------------------------------------------------------------------------------------------------------------
def t07():
    """Burza nad tawerną (prawdziwy zrzut z gry: Storm.js)"""
    img = bg_shot("tawerna_burza_b.png")
    img = grade(img, bright=1.05, contrast=1.12, sat=0.9)
    gradient(img, 0, 0, 0.0, 0.62, (6, 8, 16), x0=700, x1=1280, horizontal=True)
    gradient(img, 380, 720, 0.0, 0.55, (6, 8, 16))
    rain(img, n=220, seed=3, ang=0.28, length=(24, 44), color=(200, 215, 240), alpha=(70, 140))
    vignette(img, 0.55)
    metal_text(img, (1216, 452), "TAWERNA", FT(70), SILV, anchor="rm", glow=("#bcd8ff", 16, 0.45), outline="#0a0e18")
    spaced(img, (1216, 500), "gdy grzmi, wszyscy schodzą się pod dach", FSC(16), "#c8d8f0", sp=2, anchor="r", stroke=2, sfill=(0, 0, 0, 190))
    menu_row(img, 600, sel=1, gap=40, color="#f0f4ff", mut="#b8c4d8", accent="#9fc8ff", cx=1216 - 225)
    return img


# 8 -------------------------------------------------------------------------------------------------------------------
def t08():
    """Atlas Kruczej Wyspy"""
    img = bg_art("atlas.png")
    img = grade(img, bright=1.0, contrast=1.04)
    vignette(img, 0.55, 1.6, color=(40, 20, 6))
    INK = "#2e2014"
    with Over(img) as o:
        o.rounded_rectangle((44, 470, 420, 690), radius=10, fill=(236, 214, 168, 235), outline=(60, 40, 20, 255), width=2)
        o.rounded_rectangle((52, 478, 412, 682), radius=8, outline=(120, 80, 40, 200))
    text(img, (232, 518), "Tawerna", FP(64), "#7a1d14", anchor="mm")
    text(img, (232, 556), "Atlas Kruczej Wyspy", FG(18, 600), INK, anchor="mm")
    with Over(img) as o:
        o.line((90, 574, 374, 574), fill=(90, 60, 30, 200))
    for i, it in enumerate(MENU):
        y = 598 + i * 24
        on = i == 1
        if on:
            with Over(img) as o:
                o.polygon([(110, y - 5), (118, y), (110, y + 5)], fill=hexc("#7a1d14"))
        text(img, (126, y), it, FG(19, 700 if on else 500), "#7a1d14" if on else INK, anchor="lm")
        if on:
            text(img, (226, y + 1), "· " + SAVE, FG(14, 500), "#6a5236", anchor="lm")
    cx, cy = 404, 478
    with Over(img) as o:
        o.ellipse((cx - 20, cy - 20, cx + 20, cy + 20), fill=(122, 29, 20, 255), outline=(70, 14, 10, 255))
        o.ellipse((cx - 13, cy - 13, cx + 13, cy + 13), outline=(170, 60, 44, 255))
    kr = Image.open(os.path.join(ROOT, "tools", "ui_pomysly", "art", "kruk_godlo.png")).convert("RGBA").resize((26, 26), Image.LANCZOS)
    a = np.asarray(kr).copy(); a[..., :3] = (60, 14, 10); kr = Image.fromarray(a)
    put(img, kr, (cx - 13, cy - 13))
    return img


# 9 -------------------------------------------------------------------------------------------------------------------
def t09():
    """Zima: śnieg i ciepłe okna"""
    img = bg_art("zima.png")
    img = grade(img, bright=0.98, contrast=1.04)
    gradient(img, 0, 200, 0.45, 0.0, (6, 10, 24))
    snow(img, n=420, seed=2)
    glow_spot(img, 560, 520, 120, "#ffc070", 0.16)
    vignette(img, 0.5)
    metal_text(img, (1210, 90), "Tawerna", FCo(84), ["#2a3a5a", "#5a6a8a", "#c8d4e8", "#eef4ff", "#ffffff"], anchor="rm", glow=("#c8e0ff", 14, 0.35), outline="#0c1428")
    text(img, (1210, 146), "Zima na Kruczej Wyspie jest długa.", FG(20, 500), "#dce6f4", anchor="rm", stroke=2, sfill=(6, 10, 24, 200))
    menu_panel(img, (1010, 470, 1230, 680), sel=1, accent="#f0b060", fill=(14, 18, 30, 205), line=(90, 110, 140, 200))
    return img


# 10 ------------------------------------------------------------------------------------------------------------------
def t10():
    """Komnata Serca"""
    img = bg_art("komnata_serca.png")
    img = grade(img, bright=0.96, contrast=1.08)
    rays(img, 636, 420, n=8, length=420, spread=60, color="#7ff0e0", alpha=0.16)
    dust(img, n=140, seed=12, box=(380, 40, 900, 520))
    glow_spot(img, 636, 340, 240, "#3fd0c0", 0.18)
    gradient(img, 560, 720, 0.0, 0.75, (2, 8, 10))
    vignette(img, 0.6)
    metal_text(img, (640, 60), "TAWERNA", FT(64), TEAL, glow=("#7ff0e0", 16, 0.45), outline="#031a18", spacing=8)
    spaced(img, (640, 108), "serce twierdzy czeka", FSC(18), "#9fe8dc", sp=4, stroke=2, sfill=(0, 0, 0, 190))
    menu_row(img, 664, sel=1, gap=64, color="#e8fffb", mut="#9fc8c2", accent="#4fd0c0")
    return img


if __name__ == "__main__":
    want =[int(a) for a in sys.argv[1:]] or list(range(1, 11))
    names = {1: "tawerna_w_deszczu", 2: "kufel_przy_kominku", 3: "przekroj_do_serca", 4: "chata_o_swicie", 5: "ognisko_i_wilki",
             6: "kruk_na_szyldzie", 7: "burza_nad_tawerna", 8: "atlas_kruczej_wyspy", 9: "zima", 10: "komnata_serca"}
    for n in want:
        fn = globals().get(f"t{n:02d}")
        if fn:
            print(save(fn(), f"tytul_{n:02d}_{names[n]}.png"))
