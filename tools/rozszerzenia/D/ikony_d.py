# Paczka D: wiersz ikon 512-527 (IconSet wiersz 32) - rysowany z ikon gry, kafli Winlu i obrazków paczki; 32 x 32, bez ramek, jak
# przedmioty od 320 w górę (drobny piksel, ciemny obrys). Używa go grafika.py (draw_icons) - wynik: tools/rozszerzenia/D/ikony.png.
#   512 Klucz Strażnika   513 Pióro Skrzydlatej Straży   514 Strzemię jeźdźca   515 Szarotka skalna   516 Warzucha nadmorska
#   517 Okucie z wraku    518 Tabliczka z kadłuba        519 Biały kamień milczenia 520 Zapiski strażnic 521 Błogosławieństwo drogi
#   522 Spokój Milczących 523 kapliczka  524 grób z krukiem  525 płyta z krukiem  526 orle gniazdo  527 kruk
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
WD = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_D_green.png")
WC = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets", "Fantasy_Outside_C.png")
KRUK = os.path.join(ROOT, "img", "system", "Kruk.png")
OL = (28, 24, 24, 255)


def icon(iconset, n):
    return iconset.crop((n % 16 * 32, n // 16 * 32, n % 16 * 32 + 32, n // 16 * 32 + 32))


def fit(src, size=30):
    """the content of src, made to fit 32 x 32 by whole rows/columns dropped (kept crisp), centred"""
    bb = src.getbbox()
    c = src.crop(bb) if bb else src
    from grafika import shrink
    f = min(1.0, size / max(c.width, c.height))
    if f < 1.0:
        c = shrink(c, f)
    out = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    out.alpha_composite(c, ((32 - c.width) // 2, (32 - c.height) // 2))
    return out


def outline(im, col=OL):
    out = im.copy()
    px, po = im.load(), out.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3]:
                continue
            if any(0 <= x + dx < im.width and 0 <= y + dy < im.height and px[x + dx, y + dy][3] > 128 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                po[x, y] = col
    return out


def recolor(im, fn):
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = fn(r, g, b, a)
    return im


lum = lambda r, g, b: 0.299 * r + 0.587 * g + 0.114 * b
RAVEN = ["..##.....", ".####....", "#######..", ".#######.", "..#####.#", "...#.#..."]


def raven(im, x, y, col):
    d = ImageDraw.Draw(im)
    for j, row in enumerate(RAVEN):
        for i, ch in enumerate(row):
            if ch == "#":
                d.point((x + i, y + j), fill=col)


def stone_key():
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    g1, g2, g3 = (96, 106, 104, 255), (138, 148, 144, 255), (176, 184, 180, 255)
    d.ellipse((3, 3, 15, 15), fill=g2)                   # the bow
    d.ellipse((6, 6, 12, 12), fill=(0, 0, 0, 0))
    d.line((13, 13, 26, 26), fill=g2, width=4)           # the shaft
    d.polygon([(22, 26), (26, 22), (29, 25), (25, 29)], fill=g1)   # the bit
    d.line((20, 24, 23, 27), fill=g1, width=2)
    d.line((4, 6, 8, 3), fill=g3)
    d.line((14, 12, 25, 23), fill=g3)
    im = outline(im)
    d = ImageDraw.Draw(im)
    for p in ((7, 10), (8, 10), (9, 9), (10, 9), (8, 8)):   # (a tiny raven mark on the bow)
        d.point(p, fill=(36, 40, 40, 255))
    return im


def feather_guard(iconset):
    im = icon(iconset, 455).copy()
    d = ImageDraw.Draw(im)
    # a silver band at the quill's end (the lower left of the game's feather)
    bb = im.getbbox()
    qx, qy = bb[0] + 4, bb[3] - 5
    d.line((qx - 1, qy - 2, qx + 3, qy + 2), fill=(200, 206, 214, 255), width=3)
    d.line((qx - 1, qy - 3, qx + 3, qy + 1), fill=(244, 246, 250, 255))
    d.point((qx + 1, qy), fill=(90, 96, 110, 255))
    return im


def stirrup():
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rust, dark, light = (138, 80, 48, 255), (84, 48, 30, 255), (190, 120, 72, 255)
    d.rectangle((13, 3, 19, 8), outline=dark, width=2)
    d.arc((6, 6, 26, 30), 180, 360, fill=rust, width=3)
    d.line((7, 17, 7, 25), fill=rust, width=3)
    d.line((25, 17, 25, 25), fill=rust, width=3)
    d.rectangle((4, 24, 28, 28), fill=rust)
    d.line((5, 25, 27, 25), fill=light)
    d.arc((8, 8, 24, 28), 200, 330, fill=light)
    return outline(im)


def edelweiss():
    fl = Image.open(WD).convert("RGBA").crop((12 * 48, 9 * 48, 13 * 48, 10 * 48))
    return outline(fit(fl, 28))


def seakale():
    lf = Image.open(WD).convert("RGBA").crop((9 * 48, 7 * 48, 10 * 48, 8 * 48))
    lf = recolor(lf, lambda r, g, b, a: (int(g * 0.48 + 18), int(g * 0.80 + 8), int(g * 0.66 + 22), a))
    return fit(lf, 30)


def fitting(iconset):
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    iron, dark, rust = (96, 92, 90, 255), (54, 50, 50, 255), (150, 82, 44, 255)
    d.polygon([(5, 8), (24, 8), (24, 13), (11, 13), (11, 27), (5, 27)], fill=iron)
    d.line((6, 9, 23, 9), fill=(150, 146, 142, 255))
    d.line((6, 9, 6, 26), fill=(150, 146, 142, 255))
    for x, y in ((8, 11), (20, 11), (8, 23)):
        d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=dark)
    for p in ((14, 12), (15, 12), (10, 18), (9, 20), (22, 10), (7, 15)):
        d.point(p, fill=rust)
    d.line((26, 6, 28, 2), fill=dark, width=2)   # (a bent nail)
    return outline(im)


def nameboard(iconset):
    b = icon(iconset, 336).copy()
    b = recolor(b, lambda r, g, b2, a: (int(r * 0.7), int(g * 0.62), int(b2 * 0.6), a))
    d = ImageDraw.Draw(b)
    # the white eye
    d.ellipse((10, 12, 22, 19), fill=(236, 236, 228, 255), outline=(40, 30, 24, 255))
    d.ellipse((14, 13, 18, 18), fill=(30, 30, 34, 255))
    d.point((15, 14), fill=(250, 250, 250, 255))
    return b


def white_stone(iconset):
    st = Image.open(os.path.join(ROOT, "img", "characters", "!$Rock_Round.png")).convert("RGBA").crop((48, 0, 96, 48))
    st = recolor(st, lambda r, g, b, a: (min(255, int(lum(r, g, b) * 0.8 + 100)), min(255, int(lum(r, g, b) * 0.8 + 102)), min(255, int(lum(r, g, b) * 0.8 + 106)), a))
    return fit(st, 26)


def card(iconset):
    c = icon(iconset, 439).copy()
    c = recolor(c, lambda r, g, b, a: (r, g, b, a) if lum(r, g, b) > 150 or a < 200 else (int(r * 0.9), int(g * 0.85), int(b * 0.7), a))
    d = ImageDraw.Draw(c)
    bb = c.getbbox()
    # the map's marks rubbed out: the paper's colour over its middle, a raven drawn there, lines of writing
    d.rectangle((bb[0] + 6, bb[1] + 6, bb[2] - 7, bb[3] - 7), fill=(226, 208, 168, 255))
    raven(c, 11, 10, (34, 30, 30, 255))
    for y in (18, 21, 24):
        d.line((10, y, 22, y), fill=(120, 96, 70, 255))
    return c


def candle():
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((13, 13, 19, 28), fill=(232, 220, 190, 255))
    d.line((14, 14, 14, 27), fill=(250, 244, 226, 255))
    d.line((18, 14, 18, 27), fill=(190, 176, 146, 255))
    d.rectangle((9, 27, 23, 29), fill=(110, 80, 50, 255))
    d.ellipse((13, 4, 19, 12), fill=(255, 196, 80, 255))
    d.ellipse((14, 6, 18, 11), fill=(255, 238, 170, 255))
    d.line((16, 11, 16, 13), fill=(40, 30, 24, 255))
    im = outline(im)
    raven(im, 2, 18, (30, 28, 30, 255))
    return im


def calm(iconset):
    st = white_stone(iconset)
    d = ImageDraw.Draw(st)
    # a closed eye on the stone
    d.arc((10, 13, 22, 21), 10, 170, fill=(70, 80, 96, 255), width=1)
    for x in (12, 16, 20):
        d.line((x, 19, x - 1 if x < 16 else x + 1 if x > 16 else x, 21), fill=(70, 80, 96, 255))
    return st


def shrine_icon(raw):
    k = raw("kapliczka")
    top = k.crop((0, 0, 48, 34))
    return outline(fit(top, 30))


def grave_icon():
    head = Image.open(WC).convert("RGBA").crop((12 * 48, 10 * 48, 13 * 48, 12 * 48))
    c = fit(head, 30)
    bb = c.getbbox()
    raven(c, (bb[0] + bb[2]) // 2 - 4, bb[1] + 4, (40, 46, 50, 255))
    return c


def plate_icon(raw):
    return fit(raw("plyta"), 30)


def nest_icon(raw):
    return fit(raw("gniazdo"), 30)


def raven_icon():
    k = Image.open(KRUK).convert("RGBA").crop((0, 0, 48, 48))
    return fit(k, 30)


def draw_icons(iconset, raw):
    icons = [stone_key(), feather_guard(iconset), stirrup(), edelweiss(), seakale(), fitting(iconset), nameboard(iconset),
             white_stone(iconset), card(iconset), candle(), calm(iconset), shrine_icon(raw), grave_icon(), plate_icon(raw),
             nest_icon(raw), raven_icon()]
    row = Image.new("RGBA", (512, 32), (0, 0, 0, 0))
    for i, im in enumerate(icons):
        assert im.size == (32, 32), (i, im.size)
        row.alpha_composite(im, (i * 32, 0))
    return row
