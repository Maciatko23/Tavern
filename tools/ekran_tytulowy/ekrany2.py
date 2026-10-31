# Makiety 11-16 ekranu tytułowego (docs/ekran_tytulowy/tytul_NN_*.png). Uruchom: python ekrany2.py [numery...]
# Tła: PixelLab Pro 320x180 (styl z wycinków gry) powiększone 4x bez wygładzania (art/prom.png, latarnia.png, susza.png,
# wisiorek_stol.png, grania.png, kronika.png). Bohater i wisiorek to prawdziwe grafiki gry (Hero_Walk.png, ikona wisiorka).
import sys
from ekrany import *

PL = lambda n: bg_art(n, 4)
BRONZE = ["#2a1808", "#5a3a14", "#a8742c", "#e0b060", "#fff0c8"]


def t11():
    """Prom o świcie"""
    img = grade(PL("prom.png"), bright=1.0, contrast=1.04)
    gradient(img, 0, 190, 0.45, 0.0, (10, 8, 24))
    gradient(img, 560, 720, 0.0, 0.72, (4, 6, 16))
    vignette(img, 0.4)
    metal_text(img, (640, 80), "TAWERNA", FT(84), GOLD, glow=("#ffb878", 16, 0.4), spacing=10)
    diamond_rule(img, 640, 140, 240, "#e0a060")
    spaced(img, (640, 166), "ostatni prom na Kruczą Wyspę", FSC(20), "#f4dcc0", sp=4, stroke=2, sfill=(0, 0, 0, 170))
    menu_row(img, 650, sel=1, gap=64, color="#fff2e0", mut="#d8cdd8", accent="#f0a870")
    return img


def t12():
    """Latarnia w morskiej mgle"""
    img = grade(PL("latarnia.png"), bright=0.95, contrast=1.05)
    gradient(img, 0, 0, 0.0, 0.9, (4, 5, 12), x0=760, x1=1280, horizontal=True)
    gradient(img, 560, 720, 0.0, 0.45, (4, 4, 10))
    glow_spot(img, 480, 120, 150, "#ffc070", 0.22)          # laterna
    vignette(img, 0.5)
    metal_text(img, (1216, 120), "Tawerna", FCo(92), SILV, anchor="rm", glow=("#ffd090", 16, 0.4), outline="#0a0e18")
    text(img, (1216, 182), "światło, które nie gaśnie", FG(22, 500), "#e8d8bc", anchor="rm", stroke=2, sfill=(0, 0, 0, 190))
    menu_column(img, 1216, 300, sel=1, step=46, align="r", marker="bar", accent="#f0b868")
    return img


def t13():
    """Susza: wyschnięta studnia na rynku"""
    img = grade(PL("susza.png"), bright=0.98, contrast=1.06, sat=1.05)
    gradient(img, 0, 250, 0.55, 0.0, (44, 26, 10))
    gradient(img, 520, 720, 0.0, 0.78, (30, 18, 8))
    dust(img, n=110, seed=21, box=(0, 80, W, 560), color="#fff0c0")
    rays(img, 1180, 0, n=6, length=760, spread=50, color="#fff0b8", alpha=0.10, up=False, seed=13)
    vignette(img, 0.45, color=(40, 20, 6))
    metal_text(img, (640, 84), "Tawerna", FCo(98), GOLD, glow=("#fff0b8", 14, 0.3), outline="#2a1808")
    text(img, (640, 148), "Woda jest cenniejsza niż złoto", FG(23, 600), "#f6e6c4", anchor="mm", stroke=2, sfill=(40, 20, 6, 200))
    menu_row(img, 650, sel=1, gap=64, color="#fff4dc", mut="#e6d4b0", accent="#f0c060")
    return img


def t14():
    """Wisiorek z krukiem przy świecy"""
    img = grade(PL("wisiorek_stol.png"), bright=0.98, contrast=1.05)
    cx, cy = 600, 470
    ik = Image.open(os.path.join(ROOT, "tools", "prolog", "art", "ikona_wisiorek_kruk.png")).convert("RGBA")
    a0 = np.asarray(ik).copy(); a0[:7, :, 3] = 0; ik = Image.fromarray(a0)   # bez uciętych końców rzemyka
    ik = ik.resize((ik.width * 6, ik.height * 6), Image.NEAREST)
    arr = np.asarray(ik).astype(np.float32)           # ciepły odblask świecy na srebrze
    arr[..., 0] = np.clip(arr[..., 0] * 1.04 + 6, 0, 255); arr[..., 1] = arr[..., 1] * 0.97; arr[..., 2] = arr[..., 2] * 0.86
    ik = Image.fromarray(arr.astype(np.uint8))
    with Over(img) as o:
        o.ellipse((cx - 70, cy + 70, cx + 100, cy + 112), fill=(10, 4, 0, 130))
    img.alpha_composite(ik, (cx - 96, cy - 100))
    glow_spot(img, 240, 190, 330, "#ff9a40", 0.16)
    gradient(img, 0, 0, 0.0, 0.7, (4, 3, 4), x0=760, x1=1280, horizontal=True)
    vignette(img, 0.6)
    metal_text(img, (1226, 92), "Tawerna", FP(104), GOLD, anchor="rm", glow=("#ffb050", 18, 0.35))
    text(img, (1226, 160), "po matce został tylko kruk", FG(22, 500), "#e8d4b0", anchor="rm", stroke=2, sfill=(0, 0, 0, 190))
    menu_column(img, 1226, 540, sel=1, step=40, align="r", marker="bar", accent="#e0a43a", f=FM(22))
    return img


def t15():
    """Biały orzeł nad granią"""
    img = grade(PL("grania.png"), bright=1.0, contrast=1.03)
    h = Image.open(os.path.join(ROOT, "img", "characters", "Hero_Walk.png")).convert("RGBA")
    fr = h.crop((0, 4 * 64, 64, 5 * 64))          # bohater tyłem (idzie w górę), boso, podarta koszula
    fr = fr.crop(fr.getbbox())
    k = 4
    fr = fr.resize((fr.width * k, fr.height * k), Image.NEAREST)
    hx, hy = 250, 478                               # stopy na występie skalnym
    with Over(img) as o:
        o.ellipse((hx - fr.width * 0.55, hy - 14, hx + fr.width * 0.55, hy + 16), fill=(30, 14, 20, 120))
    img.alpha_composite(fr, (int(hx - fr.width / 2), int(hy - fr.height + 8)))
    gradient(img, 0, 0, 0.45, 0.0, (30, 12, 36), x0=0, x1=560, horizontal=True)
    gradient(img, 590, 720, 0.0, 0.7, (14, 8, 12))
    rays(img, 1000, 300, n=7, length=560, spread=70, color="#ffd090", alpha=0.07, up=True, seed=15)
    vignette(img, 0.4, color=(20, 8, 24))
    metal_text(img, (64, 84), "Tawerna", FT(78), GOLD, anchor="lm", glow=("#ffc070", 16, 0.35))
    text(img, (68, 140), "Orla Grań, o zachodzie", FG(23, 500), "#f6dcc0", anchor="lm", stroke=2, sfill=(30, 12, 30, 190))
    menu_row(img, 662, sel=1, gap=64, color="#fff0e0", mut="#d8c4cc", accent="#f0b070")
    return img


def t16():
    """Kronika zakonu w skryptorium"""
    img = grade(PL("kronika.png"), bright=0.98, contrast=1.05)
    gradient(img, 440, 720, 0.0, 0.7, (6, 3, 2), x0=0, x1=640)
    gradient(img, 0, 0, 0.72, 0.0, (6, 3, 2), x0=0, x1=700, horizontal=True) if False else None
    gradient(img, 560, 720, 0.0, 0.6, (6, 3, 2), x0=640, x1=1280)
    glow_spot(img, 565, 420, 260, "#ff9a40", 0.12)
    vignette(img, 0.45)
    metal_text(img, (60, 500), "Tawerna", FP(110), GOLD, anchor="lm", glow=("#ffb050", 16, 0.35))
    with Over(img) as o:
        o.line((64, 560, 380, 560), fill=hexc("#c99a3a")[:3] + (200,))
        o.polygon([(390, 555), (395, 560), (390, 565), (385, 560)], fill=hexc("#c99a3a"))
    text(img, (64, 590), "Kronika zakonu kruka", FG(22, 500), "#e8d4b0", anchor="lm", stroke=2, sfill=(0, 0, 0, 190))
    menu_row(img, 672, sel=1, gap=44, color="#fff0d8", mut="#d8c8aa", accent="#e0a43a", cx=400)
    return img


if __name__ == "__main__":
    want = [int(a) for a in sys.argv[1:]] or list(range(11, 17))
    names = {11: "prom_o_swicie", 12: "latarnia_w_mgle", 13: "susza", 14: "wisiorek_z_krukiem", 15: "bialy_orzel_nad_grania", 16: "kronika_zakonu"}
    for n in want:
        print(save(globals()[f"t{n}"](), f"tytul_{n:02d}_{names[n]}.png"))
