# python tools/orzel/etapy_porownanie.py
#   -> docs/orzel/etapy_porownanie.png
#
# Biały orzeł, ETAP 1 (koncepcja): jajo i 5 etapów orła obok bohatera, wszystko w skali gry
# (1 piksel obrazka = 1 piksel gry, potem całość x2 najbliższym sąsiadem, jak w grze przy screenScale 2).
# Surowe obrazki z PixelLab leżą w tools/orzel/raw/ (pobrane 2026-10-18):
#   jajo_gniazdo.png   create_image_pro_flash 64x48  (wzór stylu: kruk 48x48)
#   piskle.png         create_image_pro_flash 32x32  (wzór: kruk 32x32)
#   mlody_v2.png       create_image_pro_flash 56x56  (wzór: kruk 48x48; mlody.png = pierwsza, za mała próba)
#   podrostek.png      create_image_pro_flash 80x80  (wzór: bohater 64x64)
#   prawie_dorosly.png create_image_pro_flash 112x112 (wzór: niedźwiedź 104x104)
#   dorosly.png        create_image_pro_flash 192x192 (wzór: niedźwiedź 104x104)
# Nic tu nie generuje w PixelLab i nic nie zmienia w grze.
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(ROOT, "docs", "orzel", "etapy_porownanie.png")
TILE = 48
SCALE = 2

GRASS_SRC = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior",
                         "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_A2_2_green.png")
HERO = os.path.join(ROOT, "img", "characters", "Hero_Walk.png")
HUT = os.path.join(ROOT, "img", "system", "Farm_Hut_L.png")
FONT = os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf")
FONT_B = os.path.join(ROOT, "fonts", "AlegreyaSans-Bold.ttf")

YELLOW = (255, 214, 64)
WHITE = (240, 236, 224)

# (plik, podpis, wiersz 2, wiersz 3)
STAGES = [
    ("jajo_gniazdo", "Jajo w gnieździe", "jajo ok. 0,4 pola", "3 dni w cieple"),
    ("piskle", "1. Pisklę", "ok. 0,5 pola", "dni 1-5"),
    ("mlody_v2", "2. Młody", "ok. 0,9 pola", "dni 6-12"),
    ("podrostek", "3. Podrostek", "ok. 1,2 pola", "dni 13-22"),
    ("prawie_dorosly", "4. Prawie dorosły", "ok. 2 pola", "dni 23-36"),
    ("dorosly", "5. Dorosły", "ok. 3 x 3 pola", "od dnia 37"),
]


def grass_tile():
    """A2 autotile 2816 (trawa z pola dziadka), kształt 0 - złożony z ćwiartek jak w silniku"""
    a2 = Image.open(GRASS_SRC).convert("RGBA")
    q = TILE // 2
    t = Image.new("RGBA", (TILE, TILE))
    # FLOOR_AUTOTILE_TABLE[0] = [[2,4],[1,4],[2,3],[1,3]] (ćwiartki 24 px)
    for i, (qx, qy) in enumerate([(2, 4), (1, 4), (2, 3), (1, 3)]):
        part = a2.crop((qx * q, qy * q, qx * q + q, qy * q + q))
        t.paste(part, ((i % 2) * q, (i // 2) * q))
    return t


def trimmed(im):
    bb = im.getbbox()
    return im.crop(bb)


def shadow(canvas, cx, y, w):
    """miękki cień pod stopami (jak CharacterPolish)"""
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    h = max(3, w // 5)
    d.ellipse((cx - w // 2, y - h // 2, cx + w // 2, y + h // 2), fill=(0, 0, 0, 70))
    canvas.alpha_composite(sh)


def main():
    hero_sheet = Image.open(HERO).convert("RGBA")
    hero = trimmed(hero_sheet.crop((0, 6 * 64, 64, 7 * 64)))   # stoi, patrzy w prawo (wiersz E)
    birds = [trimmed(Image.open(os.path.join(RAW, f + ".png")).convert("RGBA")) for f, *_ in STAGES]
    hut = Image.open(HUT).convert("RGBA")

    gap_pair = 6       # bohater - orzeł
    gap_group = 30     # między parami
    margin = 28
    widths = [hero.width + gap_pair + b.width for b in birds]
    W = margin * 2 + sum(widths) + gap_group * (len(birds) - 1) + gap_group + hut.width
    top = 34            # miejsce na tytuł (w pikselach gry)
    tallest = max(max(b.height for b in birds), hut.height)
    ground = top + tallest + 10
    H = ground + 52     # pod ziemią podpisy
    W = (W + TILE - 1) // TILE * TILE

    canvas = Image.new("RGBA", (W, H))
    g = grass_tile()
    for y in range(0, H, TILE):
        for x in range(0, W, TILE):
            canvas.paste(g, (x, y))
    # delikatna siatka pól: 1 pole = 48 px
    grid = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, TILE):
        gd.line((x, 0, x, H), fill=(255, 255, 255, 22))
    for y in range(ground % TILE, H, TILE):
        gd.line((0, y, W, y), fill=(255, 255, 255, 22))
    canvas.alpha_composite(grid)

    x = margin
    centers = []
    for (f, *_), b, w in zip(STAGES, birds, widths):
        hx, bx = x, x + hero.width + gap_pair
        shadow(canvas, hx + hero.width // 2, ground, hero.width)
        shadow(canvas, bx + b.width // 2, ground, int(b.width * 0.8))
        canvas.alpha_composite(hero, (hx, ground - hero.height))
        canvas.alpha_composite(b, (bx, ground - b.height))
        centers.append(x + w // 2)
        x += w + gap_group
    shadow(canvas, x + hut.width // 2, ground, hut.width)
    canvas.alpha_composite(hut, (x, ground - hut.height + 4))
    hut_center = x + hut.width // 2

    # x2 jak w grze, potem napisy w pełnej rozdzielczości
    big = canvas.resize((W * SCALE, H * SCALE), Image.NEAREST)
    d = ImageDraw.Draw(big)
    band = Image.new("RGBA", big.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    bd.rectangle((0, (ground + 4) * SCALE, W * SCALE, H * SCALE), fill=(0, 0, 0, 170))
    bd.rectangle((0, 0, W * SCALE, (top - 6) * SCALE), fill=(0, 0, 0, 170))
    big.alpha_composite(band)
    d = ImageDraw.Draw(big)
    f_title = ImageFont.truetype(FONT_B, 30)
    f_name = ImageFont.truetype(FONT_B, 24)
    f_small = ImageFont.truetype(FONT, 19)
    d.text((margin * SCALE, 10), "Biały orzeł - etapy wzrostu obok bohatera (skala gry: 1 pole = 48 px, siatka = pola)",
           font=f_title, fill=YELLOW)
    for (f, name, l2, l3), cx in zip(STAGES, centers):
        y0 = (ground + 8) * SCALE
        d.text((cx * SCALE, y0), name, font=f_name, fill=YELLOW, anchor="ma")
        d.text((cx * SCALE, y0 + 30), l2 + " · " + l3, font=f_small, fill=WHITE, anchor="ma")
    y0 = (ground + 8) * SCALE
    d.text((hut_center * SCALE, y0), "Chatka 5 x 3 pola", font=f_name, fill=WHITE, anchor="ma")
    d.text((hut_center * SCALE, y0 + 30), "dla porównania (budynek z gry)", font=f_small, fill=WHITE, anchor="ma")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    big.convert("RGB").save(OUT)
    print(OUT, big.size)


if __name__ == "__main__":
    main()
