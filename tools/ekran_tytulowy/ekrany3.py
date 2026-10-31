# Makiety 27-36 ekranu tytułowego (docs/ekran_tytulowy/tytul_NN_*.png). Uruchom: python ekrany3.py [numery...]
# Tła: PixelLab Pro 320x180 (styl z wycinków gry) powiększone 4x bez wygładzania (art/biblioteka.png, kupala.png, atlas_stol.png,
# szyld_deszcz.png, garnizon.png, pustelnia.png, wiosna.png, pies_chata.png, menhiry.png, dwor_noc.png).
# Na nr 33 bohater to prawdziwy sprite gry (Hero_Walk.png, boso, podarta koszula) z koszykiem dorysowanym pikselami.
import sys
from ekrany import *

PL = lambda n: bg_art(n, 4)


def t27():
    """Biblioteka w głębi podziemi"""
    img = grade(PL("biblioteka.png"), bright=0.95, contrast=1.05)
    gradient(img, 0, 250, 0.72, 0.0, (4, 6, 14))
    gradient(img, 540, 720, 0.0, 0.8, (4, 5, 12))
    dust(img, n=90, seed=27, box=(0, 40, W, 640), color="#bcd8ff")
    glow_spot(img, 460, 360, 120, "#ffa850", 0.14)
    glow_spot(img, 830, 650, 120, "#ffa850", 0.14)
    vignette(img, 0.5, color=(2, 4, 12))
    metal_text(img, (640, 86), "TAWERNA", FT(84), SILV, glow=("#8fc0ff", 14, 0.35), spacing=10, outline="#0a1020")
    diamond_rule(img, 640, 144, 240, "#7fa8e0")
    spaced(img, (640, 170), "księgi, których nikt nie dokończył", FSC(20), "#d4e4ff", sp=3, stroke=2, sfill=(0, 0, 0, 180))
    menu_row(img, 664, sel=1, gap=64, color="#eef4ff", mut="#b4c0d8", accent="#f0a860")
    return img


def t28():
    """Noc Kupały"""
    img = grade(PL("kupala.png"), bright=1.0, contrast=1.04)
    gradient(img, 0, 0, 0.85, 0.0, (4, 8, 8), x0=0, x1=640, horizontal=True)
    gradient(img, 560, 720, 0.0, 0.6, (3, 6, 6))
    fireflies(img, n=34, seed=28, box=(0, 100, W, 700))
    embers(img, n=26, seed=29, box=(900, 60, 1200, 330), size=(1, 3))
    glow_spot(img, 1000, 250, 230, "#ff9a40", 0.16)
    vignette(img, 0.5, color=(2, 6, 6))
    metal_text(img, (64, 100), "Tawerna", FP(104), GOLD, anchor="lm", glow=("#ffb050", 18, 0.35))
    text(img, (68, 168), "Noc Kupały · wianki płyną z prądem", FG(22, 500), "#f0e0b8", anchor="lm", stroke=2, sfill=(0, 0, 0, 190))
    menu_column(img, 88, 300, sel=1, step=46, align="l", marker="bar", accent="#f0c060")
    return img


def t29():
    """Atlas na stole"""
    img = grade(PL("atlas_stol.png"), bright=1.0, contrast=1.04)
    gradient(img, 0, 0, 0.0, 0.85, (6, 3, 2), x0=790, x1=1280, horizontal=True)
    glow_spot(img, 420, 250, 260, "#ffa850", 0.12)
    embers(img, n=8, seed=31, box=(410, 130, 450, 220), size=(1, 2))
    vignette(img, 0.45)
    metal_text(img, (1236, 110), "Tawerna", FP(100), GOLD, anchor="rm", glow=("#ffb050", 16, 0.3))
    text(img, (1236, 176), "Atlas Kruczej Wyspy", FG(22, 500), "#ecd8b0", anchor="rm", stroke=2, sfill=(0, 0, 0, 190))
    menu_column(img, 1236, 290, sel=1, step=46, align="r", marker="bar", accent="#e0a43a")
    return img


def t30():
    """Szyld Pod Złotym Kuflem w deszczu"""
    img = grade(PL("szyld_deszcz.png"), bright=1.0, contrast=1.05)
    gradient(img, 0, 0, 0.82, 0.0, (4, 6, 12), x0=0, x1=560, horizontal=True)
    gradient(img, 560, 720, 0.0, 0.5, (3, 4, 8))
    glow_spot(img, 533, 305, 120, "#ffb060", 0.22)
    glow_spot(img, 880, 640, 180, "#ffb060", 0.12)
    rain(img, n=420, seed=30, ang=0.15, length=(16, 34), alpha=(45, 110))
    rain(img, n=120, seed=34, ang=0.15, length=(30, 50), color=(210, 220, 240), alpha=(80, 140))
    vignette(img, 0.5)
    metal_text(img, (60, 100), "Tawerna", FP(104), GOLD, anchor="lm", glow=("#ffb050", 18, 0.35))
    text(img, (64, 168), "Pod Złotym Kuflem", FG(24, 600), "#f0dcb0", anchor="lm", stroke=2, sfill=(0, 0, 0, 200))
    menu_column(img, 84, 300, sel=1, step=46, align="l", marker="bar", accent="#e0a43a")
    return img


def t31():
    """Garnizon o świcie"""
    img = grade(PL("garnizon.png"), bright=1.0, contrast=1.03)
    gradient(img, 0, 0, 0.78, 0.0, (22, 10, 30), x0=0, x1=620, horizontal=True)
    gradient(img, 560, 720, 0.0, 0.6, (8, 6, 16))
    mist(img, 300, 560, seed=31, color=(240, 214, 214), alpha=0.28)
    vignette(img, 0.4, color=(14, 6, 20))
    metal_text(img, (60, 100), "TAWERNA", FT(76), GOLD, anchor="lm", glow=("#ffc070", 16, 0.35), spacing=6)
    diamond_rule(img, 250, 150, 190, "#e0a060")
    spaced(img, (60, 178), "brama nad zatoką, o świcie", FSC(19), "#f6dcc4", sp=3, anchor="l", stroke=2, sfill=(20, 8, 24, 190))
    menu_column(img, 84, 296, sel=1, step=46, align="l", marker="bar", accent="#f0b070")
    return img


def t32():
    """Pustelnia na klifie"""
    img = grade(PL("pustelnia.png"), bright=0.98, contrast=1.04)
    gradient(img, 0, 0, 0.8, 0.0, (14, 12, 20), x0=0, x1=640, horizontal=True)
    gradient(img, 560, 720, 0.0, 0.5, (8, 8, 12))
    mist(img, 250, 520, seed=32, color=(230, 226, 232), alpha=0.22)
    vignette(img, 0.4, color=(10, 8, 14))
    metal_text(img, (60, 100), "Tawerna", FCo(98), SILV, anchor="lm", glow=("#ffd8b0", 14, 0.35), outline="#0e1018")
    text(img, (64, 164), "cisza nad klifem", FG(23, 500), "#ecdcc8", anchor="lm", stroke=2, sfill=(10, 8, 14, 200))
    menu_column(img, 84, 292, sel=1, step=46, align="l", marker="bar", accent="#f0b878")
    return img


def _hero_basket(img, hx, hy, k=3):
    h = Image.open(os.path.join(ROOT, "img", "characters", "Hero_Walk.png")).convert("RGBA")
    fr = h.crop((0, 0, 64, 64))                       # bohater twarzą do widza, boso, podarta koszula
    fr = fr.crop(fr.getbbox())
    fr = fr.resize((fr.width * k, fr.height * k), Image.NEAREST)
    with Over(img) as o:
        o.ellipse((hx - fr.width * 0.5, hy - 10, hx + fr.width * 0.5, hy + 12), fill=(20, 40, 10, 110))
    img.alpha_composite(fr, (int(hx - fr.width / 2), int(hy - fr.height + 6)))
    bx, by = int(hx + fr.width * 0.28), int(hy - fr.height * 0.33)   # koszyk w ręku
    with Over(img) as o:
        o.rectangle((bx, by, bx + 30, by + 18), fill=(138, 90, 40, 255), outline=(70, 40, 16, 255))
        for i in range(4, 30, 8):
            o.line((bx + i, by + 1, bx + i, by + 17), fill=(96, 60, 24, 255))
        o.arc((bx + 2, by - 12, bx + 28, by + 8), 180, 360, fill=(70, 40, 16, 255), width=2)
        for dx, c in ((4, (240, 240, 240, 255)), (11, (250, 190, 200, 255)), (18, (255, 240, 150, 255)), (24, (240, 240, 240, 255))):
            o.rectangle((bx + dx, by - 5, bx + dx + 4, by - 1), fill=c)


def _butterfly(img, x, y, c, k=3):
    with Over(img) as o:
        for dx, dy in ((-1, -1), (1, -1), (-1, 0), (1, 0)):
            o.rectangle((x + dx * 2 * k, y + dy * k, x + dx * 2 * k + 2 * k - 1, y + dy * k + k - 1), fill=hexc(c))
        o.rectangle((x, y - k, x + k - 1, y + k), fill=(40, 30, 20, 255))


def t33():
    """Wiosna: sad i ścieżka do chaty dziadka"""
    img = grade(PL("wiosna.png"), bright=1.03, contrast=1.03, sat=1.04)
    _hero_basket(img, 690, 540)
    for x, y, c in ((300, 330, "#ffe070"), (470, 250, "#ffffff"), (880, 600, "#ffe070"), (1010, 330, "#f4a0c0"), (560, 620, "#ffffff")):
        _butterfly(img, x, y, c)
    gradient(img, 0, 220, 0.6, 0.0, (6, 20, 10))
    gradient(img, 590, 720, 0.0, 0.7, (6, 18, 8))
    vignette(img, 0.35, color=(6, 18, 8))
    metal_text(img, (640, 80), "Tawerna", FP(100), GOLD, glow=("#fff0b0", 14, 0.3), outline="#1c2a0c")
    text(img, (640, 148), "Wiosna u dziadka", FG(23, 600), "#fff0d0", anchor="mm", stroke=2, sfill=(6, 24, 10, 210))
    menu_row(img, 656, sel=1, gap=64, color="#fffbe8", mut="#d8e0c0", accent="#f0c860")
    return img


def t34():
    """Pies przy chacie o zachodzie"""
    img = grade(PL("pies_chata.png"), bright=1.0, contrast=1.04)
    gradient(img, 0, 0, 0.72, 0.0, (18, 8, 22), x0=0, x1=600, horizontal=True)
    gradient(img, 590, 720, 0.0, 0.5, (14, 6, 12))
    glow_spot(img, 622, 480, 100, "#ffb050", 0.18)
    glow_spot(img, 1100, 480, 100, "#ffb050", 0.18)
    embers(img, n=10, seed=34, box=(1030, 20, 1090, 120), size=(1, 2))
    vignette(img, 0.4, color=(14, 6, 18))
    metal_text(img, (60, 90), "Tawerna", FP(100), GOLD, anchor="lm", glow=("#ffb050", 16, 0.35))
    text(img, (64, 156), "psi sen przy progu", FG(23, 500), "#f6dcc0", anchor="lm", stroke=2, sfill=(20, 8, 22, 200))
    menu_column(img, 84, 290, sel=1, step=46, align="l", marker="bar", accent="#f0b070")
    return img


def t35():
    """Krąg menhirów w nocnej mgle"""
    img = grade(PL("menhiry.png"), bright=1.02, contrast=1.04)
    gradient(img, 0, 0, 0.0, 0.86, (4, 8, 16), x0=860, x1=1280, horizontal=True)
    gradient(img, 560, 720, 0.0, 0.5, (3, 6, 12))
    mist(img, 380, 700, seed=35, color=(190, 210, 225), alpha=0.18)
    glow_spot(img, 640, 60, 200, "#cfe0ff", 0.10)
    vignette(img, 0.45, color=(2, 6, 12))
    metal_text(img, (1236, 96), "TAWERNA", FT(70), SILV, anchor="rm", glow=("#a0c8ff", 14, 0.35), spacing=6, outline="#0a1020")
    spaced(img, (1236, 148), "tam, gdzie cień wskazuje godzinę", FSC(17), "#d4e0f4", sp=2, anchor="r", stroke=2, sfill=(0, 0, 0, 190))
    menu_column(img, 1236, 260, sel=1, step=46, align="r", marker="bar", accent="#9cc4f0")
    return img


def _raven(img, x, y, flip=1, k=5):
    rows = ["......XX..", ".....XXXXX", "..XXXXXXX.", "XXXXXXXXX.", ".XXXXXXX..", "...X.X...."]    # kruk z boku: dziób, ogon, nogi
    cells = {(i if flip > 0 else 9 - i, j) for j, row in enumerate(rows) for i, ch in enumerate(row) if ch == "X"}
    with Over(img) as o:
        for (i, j) in cells:                                  # najpierw jasny obrys (2 px), potem ciemne ciało
            o.rectangle((x + i * k - 2, y + j * k - 2, x + i * k + k + 1, y + j * k + k + 1), fill=(140, 164, 206, 255))
        for (i, j) in cells:
            o.rectangle((x + i * k, y + j * k, x + i * k + k - 1, y + j * k + k - 1), fill=(3, 4, 8, 255))


def t36():
    """Dwór Lorda nocą"""
    img = grade(PL("dwor_noc.png"), bright=0.95, contrast=1.06)
    gradient(img, 0, 0, 0.82, 0.0, (2, 4, 10), x0=0, x1=520, horizontal=True)
    gradient(img, 560, 720, 0.0, 0.6, (2, 3, 8))
    for rx, ry, fl in ((700, 70, 1), (742, 64, 1), (1010, 160, -1), (1040, 150, 1), (905, 104, -1)):   # kruki na kalenicy
        _raven(img, rx, ry, fl)
    glow_spot(img, 347, 493, 90, "#ffa040", 0.28)
    glow_spot(img, 438, 530, 90, "#ffa040", 0.22)
    vignette(img, 0.6, color=(2, 4, 10))
    metal_text(img, (60, 90), "TAWERNA", FT(70), SILV, anchor="lm", glow=("#8ab8ff", 14, 0.3), spacing=5, outline="#06080e")
    spaced(img, (60, 140), "dwór, który patrzy", FSC(19), "#c8d8f0", sp=3, anchor="l", stroke=2, sfill=(0, 0, 0, 200))
    menu_column(img, 70, 232, sel=1, step=46, align="l", marker="bar", accent="#e8a050")
    return img


if __name__ == "__main__":
    want = [int(a) for a in sys.argv[1:]] or list(range(27, 37))
    names = {27: "biblioteka_w_podziemiu", 28: "noc_kupaly", 29: "atlas_na_stole", 30: "szyld_pod_zlotym_kuflem", 31: "garnizon_o_swicie",
             32: "pustelnia_na_klifie", 33: "wiosna", 34: "pies_przy_chacie", 35: "krag_menhirow", 36: "dwor_lorda_noca"}
    for n in want:
        print(save(globals()[f"t{n}"](), f"tytul_{n:02d}_{names[n]}.png"))
