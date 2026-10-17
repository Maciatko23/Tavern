# python tools/w5/art.py [--preview PATH]
# Obrazki wątku W5 „Towary z kontynentu” (Kantor.js) jako jeden arkusz postaci RPG Maker: img/characters/!W5_Kantor.png -
# klatki 144 x 144 jak !House_Town (tools/interiors/props.py): komórka zdarzenia to dolne środkowe 48 x 48 klatki (rzecz na
# dwie kratki wypełnia prawe dwie trzecie: zdarzenie stoi na LEWEJ kratce), arkusz "!" (bez podniesienia o 6 px).
# Wszystko złożone z grafik autora zestawu Winlu, które gra już ma (żadnego RTP, żadnych generacji PixelLab):
#   - wóz: pusty wózek z !House_Town (indeks 0, kierunek 4, wzór 1), na nim skrzynie z Fantasy_Inside_D (11..12, 3..4)
#   - skrzynie: Fantasy_Inside_D (12,3..4) zamknięta, (11,3..4) z workiem, (13,3..4) wysoka, otwarta skrzynia (14,11..12) z kamieniami
#     z krukiem (kamienie rysowane tu)
#   - worki zboża: Fantasy_Inside_D (8,2..3) z czerwoną pieczęcią dworu (rysowana tu)
#   - zwoje map: Fantasy_Inside_D (6,13), (7,14)
#
#   indeks 0   kierunek 2: wóz ze skrzyniami | pusty wóz | wóz ze skrzynią i workami
#              kierunek 4: stos 1 skrzyni | stos 2 skrzyń | stos 3 skrzyń (przy tylnych drzwiach kantoru)
#              kierunek 6: otwarta skrzynia z kamieniami z krukiem | worki zboża z pieczęcią dworu | zwoje map wyspy
#              kierunek 8: sterta skrzyń do wyniesienia (piwnica) | jedna skrzynia na ziemi | (pusto)
import os, sys, argparse
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "img", "characters", "!W5_Kantor.png")
TOWN = os.path.join(ROOT, "img", "characters", "!House_Town.png")
IN_D = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets", "Fantasy_Inside_D.png")
F, T = 144, 48


def tile(sheet, c, r, w=1, h=1):
    return sheet.crop((c * T, r * T, (c + w) * T, (r + h) * T))


def frame_of(sheet, index, direction, pattern):
    bx, by = (index % 4) * F * 3, (index // 4) * F * 4
    row = [2, 4, 6, 8].index(direction)
    return sheet.crop((bx + pattern * F, by + row * F, bx + (pattern + 1) * F, by + (row + 1) * F))


def paste(dst, src, x, y):
    """src onto dst at (x, y), clipped to the frame"""
    sx, sy = max(0, -x), max(0, -y)
    part = src.crop((sx, sy, src.size[0], src.size[1]))
    dst.alpha_composite(part, (max(0, x), max(0, y)))


def stones(img, x0, y0, n=6):
    """small grey field stones, each with a dark raven glyph carved in it"""
    d = ImageDraw.Draw(img)
    pts = [(2, 3), (10, 1), (18, 4), (5, 9), (13, 8), (21, 9), (9, 14)][:n]
    for i, (sx, sy) in enumerate(pts):
        x, y = x0 + sx, y0 + sy
        d.rectangle((x, y, x + 6, y + 4), fill=(38, 34, 40))
        d.rectangle((x + 1, y + 1, x + 5, y + 3), fill=(118, 112, 106) if i % 2 else (104, 99, 95))
        d.point((x + 1, y + 1), fill=(150, 144, 136))
        for px, py in ((2, 2), (3, 3), (4, 2), (4, 1)):
            d.point((x + px, y + py), fill=(30, 28, 34))


def seal(img, x, y):
    d = ImageDraw.Draw(img)
    d.rectangle((x - 1, y - 1, x + 4, y + 4), fill=(40, 16, 16))
    d.rectangle((x, y, x + 3, y + 3), fill=(176, 36, 32))
    d.point((x + 1, y + 1), fill=(222, 96, 80))
    d.line((x + 2, y + 5, x + 2, y + 7), fill=(120, 26, 22))


def build():
    town = Image.open(TOWN).convert("RGBA")
    D = Image.open(IN_D).convert("RGBA")
    sheet = Image.new("RGBA", (F * 12, F * 8), (0, 0, 0, 0))

    def put(img, direction, pattern):
        sheet.alpha_composite(img, (pattern * F, [2, 4, 6, 8].index(direction) * F))

    blank = lambda: Image.new("RGBA", (F, F), (0, 0, 0, 0))
    crate = tile(D, 12, 3, 1, 2)    # a closed crate (its top in row 3, the body in row 4: 48 x 96)
    crate2 = tile(D, 11, 3, 1, 2)   # a crate with a sack in it
    tall = tile(D, 13, 3, 1, 2)     # a tall crate
    sacks = tile(D, 8, 2, 1, 2)     # three sacks of grain (the lower half of row 2 and row 3)
    open_box = tile(D, 14, 11, 1, 2)
    scrolls = [tile(D, 6, 13), tile(D, 7, 14)]
    cart = frame_of(town, 0, 4, 1)  # the empty hand cart (2 tiles: x 48..144)
    # ---- row 0: the cart with crates / empty / with a crate and sacks
    f = cart.copy(); paste(f, crate, 62, 30); paste(f, crate2, 90, 26); put(f, 2, 0)
    put(cart.copy(), 2, 1)
    f = cart.copy(); paste(f, crate, 62, 30); paste(f, sacks, 90, 14); put(f, 2, 2)
    # ---- row 1: the stack by the back door, 1-3 crates (the event's cell: x 48..96, y 96..144)
    for n in (1, 2, 3):
        f = blank()
        for i, (x, y) in enumerate([(48, 48), (52, 18), (46, -10)][:n]):
            paste(f, crate if i != 1 else crate2, x, y)
        put(f, 4, n - 1)
    # ---- row 2: the open crate with raven stones, the sealed grain sacks, the rolled maps
    f = blank(); paste(f, open_box, 48, 48); stones(f, 55, 76, 6); put(f, 6, 0)
    f = blank(); paste(f, sacks, 48, 48); seal(f, 58, 112); seal(f, 76, 108); put(f, 6, 1)
    f = blank(); paste(f, scrolls[1], 48, 96); paste(f, scrolls[0], 56, 90); put(f, 6, 2)
    # ---- row 3: the pile in the cellar (4 crates), one crate on the ground
    f = blank()
    paste(f, tall, 28, 40); paste(f, crate, 50, 48); paste(f, crate2, 74, 44); paste(f, crate, 62, 18); put(f, 8, 0)
    f = blank(); paste(f, crate, 48, 48); put(f, 8, 1)
    return sheet


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    a = ap.parse_args()
    sheet = build()
    sheet.save(OUT)
    print("zapisano", OUT, sheet.size)
    if a.preview:
        bg = Image.new("RGBA", (F * 3, F * 4), (70, 90, 70, 255))
        bg.alpha_composite(sheet.crop((0, 0, F * 3, F * 4)))
        d = ImageDraw.Draw(bg)
        for x in range(0, F * 3, T): d.line([(x, 0), (x, F * 4)], fill=(255, 255, 0, 60))
        for y in range(0, F * 4, T): d.line([(0, y), (F * 3, y)], fill=(255, 255, 0, 60))
        bg.resize((F * 6, F * 8), Image.NEAREST).save(a.preview)


if __name__ == "__main__":
    main()
