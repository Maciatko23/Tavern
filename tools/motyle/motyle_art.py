# -*- coding: utf-8 -*-
"""Motyle i ćmy (Motyle.js): grafika z okazów PixelLab (art/raw_okazy.png - pięć przypiętych okazów w rzędzie, 256x64).

  img/system/Motyle.png       arkusz: wiersze = gatunki (cytrynek, pawik, modraszek, bielinek, cma), kolumny = klatki
                              0 otwarte (z góry), 1 w pół drogi w górę, 2 prawie złożone (spód skrzydeł), 3 końce w dół;
                              komórka 28x28, środek ciała w (14, 14); motyl ok. 18-22 px szerokości (2026-10-18: powiększone z 13 px)
  img/system/Motyle_Gablotka_<Gatunek>.png / _Cien.png   karty gablotki w Dzienniku (120x120)
  img/system/Motyle_Rysunek_Eli.png                       rysunek Eli (K54) na desce (120x120)
  art/ikona_441_siatka.png, ikona_442_rysunek.png, ikona_443_motyl.png, ikona_448..452_<gatunek>.png   ikony do IconSet
                              (wkleja je tools/motyle/install_icons.py)

  python tools/motyle/motyle_art.py [--out <katalog>]   (domyślnie img/system projektu)
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageEnhance

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), "art")
OUT = os.path.join(ROOT, "img", "system")
if "--out" in sys.argv:
    OUT = sys.argv[sys.argv.index("--out") + 1]

CELL = 28
BODY_X = 14
ORDER = ["cytrynek", "pawik", "modraszek", "bielinek", "cma"]
# the width of each kind on the sheet (px) and its outline; the undersides (frame 2) by brightness: light, dark
WIDTH = {"cytrynek": 21, "pawik": 22, "modraszek": 18, "bielinek": 21, "cma": 21}
OUTLINE = {"cytrynek": (52, 44, 16), "pawik": (30, 16, 12), "modraszek": (26, 34, 70), "bielinek": (70, 70, 66), "cma": (36, 28, 22)}
UNDER = {"cytrynek": [(224, 230, 142), (198, 206, 112)], "pawik": [(62, 46, 40), (44, 32, 28)], "modraszek": [(208, 200, 184), (184, 176, 160)],
         "bielinek": [(238, 234, 192), (214, 210, 166)], "cma": [(176, 162, 140), (140, 126, 106)]}
COLOURS = {"cytrynek": 6, "pawik": 8, "modraszek": 6, "bielinek": 7, "cma": 6}


def put(img, x, y, c):
    if 0 <= x < img.width and 0 <= y < img.height and c is not None:
        img.putpixel((x, y), c + (255,) if len(c) == 3 else c)


def specimens():
    """the five pinned specimens PixelLab drew in one row - cut apart by their columns"""
    im = Image.open(os.path.join(ART, "raw_okazy.png")).convert("RGBA")
    a = im.split()[3]
    cols = [any(a.getpixel((x, y)) > 0 for y in range(im.height)) for x in range(im.width)]
    runs, start = [], None
    for x, c in enumerate(cols + [False]):
        if c and start is None:
            start = x
        if not c and start is not None:
            runs.append((start, x - 1)); start = None
    out = []
    for x0, x1 in runs:
        sub = im.crop((x0, 0, x1 + 1, im.height))
        out.append(sub.crop(sub.getbbox()))
    return out


# ---- the in-game frames: the specimen shrunk to WIDTH, made symmetric, cut down to a few colours, a 1 px dark outline round it
def base_from_spec(key, spec):
    w = WIDTH[key]
    if key == "pawik":   # (the shrunk peacock goes dull brown: its reds lifted first)
        spec = ImageEnhance.Brightness(ImageEnhance.Color(spec).enhance(1.5)).enhance(1.2)
    h = max(9, round(spec.height * w / spec.width))
    small = spec.resize((w, h), Image.BOX)
    px = small.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255) if a > 110 else (0, 0, 0, 0)
    for y in range(h):   # symmetric about the middle column
        for x in range(w // 2):
            a, b = px[x, y], px[w - 1 - x, y]
            if a[3] or b[3]:
                src = [c for c in (a, b) if c[3]]
                m = tuple(sum(c[i] for c in src) // len(src) for i in range(3)) + (255,)
                px[x, y] = px[w - 1 - x, y] = m
    rgb = Image.new("RGB", small.size, (0, 0, 0))
    rgb.paste(small, (0, 0), small)
    q = rgb.quantize(colors=COLOURS[key], method=Image.MEDIANCUT).convert("RGBA")
    q.putalpha(small.split()[3])
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(q, (BODY_X - w // 2, (CELL - h) // 2))
    cp = cell.load()
    edge = [(x, y) for y in range(CELL) for x in range(CELL) if not cp[x, y][3] and
            any(0 <= x + dx < CELL and 0 <= y + dy < CELL and cp[x + dx, y + dy][3] == 255 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    for (x, y) in edge:
        cp[x, y] = OUTLINE[key] + (255,)
    if key == "pawik":   # the four eyes: a blue core in a yellow ring (forewing), a blue and black one (hindwing); mirrored
        for (x, y, c) in PAWIK_EYES:
            for xx in (x, 2 * BODY_X - 1 - x):
                if cp[xx, y][3]:
                    cp[xx, y] = c + (255,)
    if key == "cma":   # (a moth in firelight looks pale: its wings lightened toward a beige grey, the outline kept)
        for y in range(CELL):
            for x in range(CELL):
                c = cp[x, y]
                if c[3] and c[:3] != OUTLINE[key]:
                    cp[x, y] = tuple(int(c[i] * 0.55 + (226, 214, 196)[i] * 0.45) for i in range(3)) + (255,)
    return cell


# the peacock's eyes on its 28 px cell (the left wing; the right one mirrored about x 13.5)
YEL, BLU, BLU2, BLK = (238, 204, 98), (112, 170, 238), (64, 108, 198), (40, 24, 36)
PAWIK_EYES = [(4, 7, YEL), (5, 7, BLU), (6, 7, YEL), (4, 8, YEL), (5, 8, BLU2), (6, 8, YEL), (5, 6, YEL),
              (7, 15, YEL), (8, 15, BLU), (8, 16, BLK), (9, 15, YEL), (8, 14, YEL)]


def squash_img(img, k, darken=0.0, recolor=None, outline=None):
    """the wings tilted up: the picture squeezed toward the body; recolor = the undersides (by brightness)"""
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sp, op = img.load(), out.load()
    for y in range(img.height):
        for x in range(img.width):
            sx = BODY_X + int(round((x - BODY_X) / k))
            if not (0 <= sx < img.width):
                continue
            c = sp[sx, y]
            if not c[3]:
                continue
            if outline and c[:3] == outline:
                op[x, y] = c
                continue
            if recolor:
                lum = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255
                c = (recolor[0] if lum > 0.42 else recolor[1]) + (255,)
            elif darken:
                c = tuple(int(v * (1 - darken)) for v in c[:3]) + (255,)
            op[x, y] = c
    return out


def droop_img(img):
    """the wing tips a pixel lower (the down stroke)"""
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sp = img.load()
    for y in range(img.height - 1, -1, -1):
        for x in range(img.width):
            c = sp[x, y]
            if c[3]:
                dy = 1 if abs(x - BODY_X) >= 6 else 0
                if y + dy < img.height:
                    out.putpixel((x, y + dy), c)
    return out


def bases():
    return {key: base_from_spec(key, spec) for key, spec in zip(ORDER, specimens())}


def sheet(b):
    out = Image.new("RGBA", (CELL * 4, CELL * len(ORDER)), (0, 0, 0, 0))
    for i, key in enumerate(ORDER):
        base = b[key]
        fr = [base, squash_img(base, 0.6, darken=0.12, outline=OUTLINE[key]), squash_img(base, 0.28, recolor=UNDER[key], outline=OUTLINE[key]), droop_img(base)]
        for j, f in enumerate(fr):
            out.alpha_composite(f, (j * CELL, i * CELL))
    return out


# ---- the journal's display case
def card_spec(spec, shadow=False, size=120):
    """the specimen (twice its size, crisp pixels) pinned on a cream card in a dark wooden frame; not caught yet: a grey shadow and "?" """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle((2, 2, size - 3, size - 3), fill=(52, 38, 26, 255))
    d.line((2, 2, size - 3, 2), fill=(92, 68, 46, 255))
    d.line((2, 2, 2, size - 3), fill=(80, 58, 40, 255))
    d.rectangle((6, 6, size - 7, size - 7), fill=(216, 202, 170, 255))
    d.rectangle((6, 6, size - 7, size - 7), outline=(178, 160, 122, 255))
    k = 2 if spec.width * 2 <= size - 20 else 1
    big = spec.resize((spec.width * k, spec.height * k), Image.NEAREST)
    ox, oy = (size - big.width) // 2, (size - big.height) // 2 + 1
    if shadow:
        px = big.load()
        for y in range(big.height):
            for x in range(big.width):
                px[x, y] = (156, 142, 112, 255) if px[x, y][3] > 60 else (0, 0, 0, 0)
        img.alpha_composite(big, (ox, oy))
        q = ["..ooo..", ".o...o.", ".....o.", "....o..", "...o...", "...o...", ".......", "...o..."]
        for r, row in enumerate(q):
            for c, ch in enumerate(row):
                if ch == "o":
                    d.rectangle((size // 2 - 14 + c * 4, size // 2 - 16 + r * 4, size // 2 - 11 + c * 4, size // 2 - 13 + r * 4), fill=(100, 88, 66, 255))
        return img
    sh = Image.new("RGBA", big.size, (0, 0, 0, 0))
    sh.paste((112, 96, 70, 110), (0, 0), big.split()[3].point(lambda v: 255 if v > 60 else 0))
    img.alpha_composite(sh, (ox + 3, oy + 4))
    img.alpha_composite(big, (ox, oy))
    cx, cy = size // 2, oy + big.height // 3   # the pin through the thorax
    d.rectangle((cx - 2, cy - 2, cx + 2, cy + 2), fill=(36, 36, 42, 255))
    d.rectangle((cx - 1, cy - 1, cx, cy), fill=(206, 210, 220, 255))
    return img


def drawing_card(size=120):
    """Ela's drawing (art/raw_rysunek_eli.png, 96x96) pinned with two strips of tape on a dark board"""
    im = Image.open(os.path.join(ART, "raw_rysunek_eli.png")).convert("RGBA")
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle((2, 2, size - 3, size - 3), fill=(46, 36, 28, 255))
    ox, oy = (size - im.width) // 2, (size - im.height) // 2
    img.alpha_composite(Image.new("RGBA", im.size, (0, 0, 0, 90)), (ox + 3, oy + 3))
    img.alpha_composite(im, (ox, oy))
    for (x, y) in ((ox + 6, oy - 4), (ox + im.width - 22, oy - 4)):
        d.rectangle((x, y, x + 16, y + 7), fill=(232, 222, 176, 210))
    return img


# ---- icons (32x32)
def icon_of(base):
    """a kind's icon: its open frame (about 20 px) in the middle of a 32 px cell"""
    bb = base.getbbox()
    fr = base.crop(bb)
    ic = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    ic.alpha_composite(fr, ((32 - fr.width) // 2, (32 - fr.height) // 2 + 1))
    return ic


def icon_net():
    """icon 441: the butterfly net - a light-wood stick from the lower left, a round hoop, the pale mesh bag"""
    ic = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    O, W1, W2 = (34, 24, 16), (196, 150, 96), (150, 104, 60)
    M1, M2, M3 = (236, 236, 228), (206, 208, 202), (170, 172, 168)
    for t in range(0, 13):
        x, y = 4 + t, 29 - t
        put(ic, x - 1, y, O); put(ic, x + 1, y, O); put(ic, x, y - 1, O); put(ic, x, y + 1, O)
    for t in range(0, 13):
        put(ic, 4 + t, 29 - t, W1 if t % 3 else W2)
    mesh = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    for y in range(32):
        for x in range(32):
            if ((x - 21) / 8.0) ** 2 + ((y - 11) / 7.0) ** 2 < 0.78:
                put(mesh, x, y, M3 if (x + y) % 3 == 0 else (M2 if (x - y) % 4 == 0 else M1))
    ic.alpha_composite(mesh)
    for k in range(0, 360, 4):
        a = math.radians(k)
        put(ic, int(round(21 + 8 * math.cos(a))), int(round(11 + 7 * math.sin(a))), W2)
    for k in range(0, 360, 3):
        a = math.radians(k)
        xi, yi = int(round(21 + 9 * math.cos(a))), int(round(11 + 8 * math.sin(a)))
        if ic.getpixel((xi, yi))[3] == 0:
            put(ic, xi, yi, O)
    for (x, y) in [(24, 19), (25, 19), (26, 19), (25, 20), (26, 20), (25, 21)]:
        put(ic, x, y, M2)
    for (x, y) in [(23, 19), (27, 19), (24, 20), (27, 20), (24, 21), (26, 21), (25, 22)]:
        if ic.getpixel((x, y))[3] == 0:
            put(ic, x, y, O)
    return ic


def icon_drawing():
    """icon 442: a small sheet of paper with Ela's red butterfly on it"""
    im = Image.open(os.path.join(ART, "raw_rysunek_eli.png")).convert("RGBA").resize((22, 22), Image.LANCZOS)
    ic = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(ic)
    d.rectangle((4, 3, 28, 29), fill=(34, 26, 18, 255))
    d.rectangle((5, 4, 27, 28), fill=(232, 222, 192, 255))
    ic.alpha_composite(im, (5, 5))
    q = ic.convert("RGB").quantize(colors=20, method=Image.MEDIANCUT).convert("RGBA")
    q.putalpha(ic.split()[3])
    ImageDraw.Draw(q).line((26, 4, 28, 6), fill=(196, 182, 150, 255))
    return q


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    b = bases()
    sheet(b).save(os.path.join(OUT, "Motyle.png"))
    for key, spec in zip(ORDER, specimens()):
        card_spec(spec).save(os.path.join(OUT, "Motyle_Gablotka_%s.png" % key.capitalize()))
        card_spec(spec, shadow=True).save(os.path.join(OUT, "Motyle_Gablotka_%s_Cien.png" % key.capitalize()))
    drawing_card().save(os.path.join(OUT, "Motyle_Rysunek_Eli.png"))
    icon_net().save(os.path.join(ART, "ikona_441_siatka.png"))
    icon_drawing().save(os.path.join(ART, "ikona_442_rysunek.png"))
    icon_of(b["cytrynek"]).save(os.path.join(ART, "ikona_443_motyl.png"))
    for i, key in enumerate(ORDER):   # the new row of IconSet (448-452): one icon a kind
        icon_of(b[key]).save(os.path.join(ART, "ikona_%d_%s.png" % (448 + i, key)))
    print("ok", OUT)
