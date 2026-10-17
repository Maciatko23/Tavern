# python tools/w7/art.py [--preview PATH]
# Obrazki wątku W7 „Dwór z kamieni twierdzy” (Dwor.js) - złożone z grafik autora zestawu Winlu, które gra już ma
# (żadnego RTP, żadnych generacji PixelLab):
#   img/characters/!W7_Dwor.png    - arkusz "!" z klatkami 48 x 48 (12 x 8 klatek, 576 x 384): nakładki na mur z kamieni
#                                    twierdzy (A3 rodzaj 67, mur wnętrz Winlu), stawiane jako zdarzenia pod postaciami:
#       indeks 0  kierunek 2: kamień z wyrytym krukiem (3 odmiany: w lewo, w prawo, wyżej)
#                 kierunek 4: kamień wstawiony w miejsce kruka - jaśniejszy, na świeżej, białej zaprawie (3 odmiany)
#                 kierunek 6: kruk wyryty nad drzwiami (łuk), kruk na kamiennym nadprożu kominka, pusty (zapas)
#                 kierunek 8: zwitek listów z czarnym sznurkiem i lakiem z białym okiem (na kantorku), kronika rodu
#                             otwarta (gruba księga na pulpicie), pusty
#   img/characters/!$W7_Schody.png - wielkie schody na piętro z ciemnego kamienia (Fantasy_Inside_E_Cathedral 13..15,
#                                    11..15): jedna klatka 144 x 240, ta sama we wszystkich kierunkach
import os, sys, argparse
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
TS = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets")
OUT = os.path.join(ROOT, "img", "characters", "!W7_Dwor.png")
OUT_STAIRS = os.path.join(ROOT, "img", "characters", "!$W7_Schody.png")
T = 48

# the raven, side view, beak to the right (x right, y down): '#' the carved groove
RAVEN = [
    "........##...",
    ".......####..",
    "......######=",
    "...########..",
    ".##########..",
    "###########..",
    "#...#######..",
    ".....#...#...",
    "....##..##...",
]
MORTAR = (44, 48, 56, 255)
STONE = (120, 127, 124, 255)
STONE_HI = (150, 156, 150, 255)
STONE_LO = (84, 92, 94, 255)
GROOVE = (40, 44, 52, 255)
LIP = (166, 170, 162, 255)
NEW = (156, 158, 150, 255)
NEW_HI = (184, 184, 176, 255)
NEW_MORTAR = (214, 210, 198, 255)


def block(d, x, y, w, h, fresh=False):
    """a dressed stone set into the wall: its mortar outline, the face, a light top edge and a dark bottom edge"""
    d.rectangle((x - 1, y - 1, x + w, y + h), fill=NEW_MORTAR if fresh else MORTAR)
    d.rectangle((x, y, x + w - 1, y + h - 1), fill=NEW if fresh else STONE)
    d.line((x, y, x + w - 1, y), fill=NEW_HI if fresh else STONE_HI)
    d.line((x, y + h - 1, x + w - 1, y + h - 1), fill=(130, 132, 124, 255) if fresh else STONE_LO)
    if fresh:   # (a few speckles of new lime on the face)
        for px, py in ((3, 3), (w - 5, 4), (w // 2, h - 4)):
            d.point((x + px, y + py), fill=(196, 196, 186, 255))


def raven(d, x, y, mirror=False):
    for ry, row in enumerate(RAVEN):
        for rx, ch in enumerate(row):
            if ch == ".":
                continue
            px = x + (len(row) - 1 - rx if mirror else rx)
            d.point((px, y + ry), fill=GROOVE)
    # the lip of the carving: light below each groove pixel that has stone under it
    for ry, row in enumerate(RAVEN):
        for rx, ch in enumerate(row):
            if ch == "." or (ry + 1 < len(RAVEN) and RAVEN[ry + 1][rx] != "."):
                continue
            px = x + (len(row) - 1 - rx if mirror else rx)
            d.point((px, y + ry + 1), fill=LIP)


def raven_stone(variant):
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x, y = [(12, 18), (14, 16), (10, 10)][variant]
    block(d, x, y, 22, 14)
    raven(d, x + 4, y + 2, mirror=variant == 1)
    return im


def fresh_stone(variant):
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x, y = [(12, 18), (14, 16), (10, 10)][variant]
    block(d, x, y, 22, 14, fresh=True)
    return im


def arch_raven():
    """a raven carved into the keystone over a door (the door picture's top edge is the cell's bottom)"""
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(13, 26), (35, 26), (32, 44), (16, 44)], fill=MORTAR)
    d.polygon([(14, 27), (34, 27), (31, 43), (17, 43)], fill=STONE)
    d.line((14, 27, 34, 27), fill=STONE_HI)
    raven(d, 18, 31)
    return im


def mantel_raven():
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    block(d, 13, 30, 22, 13)
    raven(d, 17, 32, mirror=True)
    return im


def letters():
    """a bundle of letters tied with a black string, a wax seal with a white open eye"""
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, (x, y) in enumerate(((13, 22), (15, 20), (14, 18))):
        d.rectangle((x - 1, y - 1, x + 19, y + 12), fill=(70, 58, 44, 255))
        d.rectangle((x, y, x + 18, y + 11), fill=(232, 220, 190, 255) if i != 1 else (220, 206, 172, 255))
        for k in range(3):
            d.line((x + 3, y + 3 + k * 3, x + 14 - (k % 2) * 3, y + 3 + k * 3), fill=(120, 104, 84, 255))
    d.line((14, 24, 33, 24), fill=(20, 20, 24, 255))
    d.line((24, 18, 24, 31), fill=(20, 20, 24, 255))
    d.ellipse((20, 21, 28, 28), fill=(24, 22, 26, 255))
    d.ellipse((22, 23, 26, 26), fill=(236, 236, 230, 255))
    d.point((24, 24), fill=(24, 22, 26, 255))
    return im


def chronicle():
    """the family chronicle lying open: a thick leather book, two pages of close writing"""
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((9, 24, 39, 41), fill=(70, 30, 26, 255))
    d.rectangle((10, 25, 38, 40), fill=(110, 46, 36, 255))
    d.polygon([(11, 24), (23, 26), (23, 39), (11, 37)], fill=(236, 226, 196, 255))
    d.polygon([(25, 26), (37, 24), (37, 37), (25, 39)], fill=(228, 216, 184, 255))
    d.line((24, 25, 24, 40), fill=(90, 70, 50, 255))
    for k in range(4):
        d.line((13, 28 + k * 2, 21, 29 + k * 2), fill=(110, 96, 76, 255))
        d.line((27, 29 + k * 2, 35, 28 + k * 2), fill=(110, 96, 76, 255))
    d.rectangle((28, 36, 30, 44), fill=(160, 30, 30, 255))   # (the ribbon)
    return im


def sheet():
    out = Image.new("RGBA", (T * 12, T * 8), (0, 0, 0, 0))
    rows = {0: [raven_stone(0), raven_stone(1), raven_stone(2)], 1: [fresh_stone(0), fresh_stone(1), fresh_stone(2)],
            2: [arch_raven(), mantel_raven(), None], 3: [letters(), chronicle(), None]}
    for row, frames in rows.items():
        for pat, fr in enumerate(frames):
            if fr is not None:
                out.alpha_composite(fr, (pat * T, row * T))
    return out


def stairs():
    src = Image.open(os.path.join(TS, "Fantasy_Inside_E_Cathedral.png")).convert("RGBA")
    piece = src.crop((13 * T, 11 * T, 16 * T, 16 * T))         # 144 x 240
    out = Image.new("RGBA", (144 * 3, 240 * 4), (0, 0, 0, 0))
    for r in range(4):
        for p in range(3):
            out.alpha_composite(piece, (p * 144, r * 240))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    a = ap.parse_args()
    sh = sheet()
    sh.save(OUT)
    st = stairs()
    st.save(OUT_STAIRS)
    print("zapisano:", os.path.relpath(OUT, ROOT), sh.size, "|", os.path.relpath(OUT_STAIRS, ROOT), st.size)
    if a.preview:
        wall = Image.open(os.path.join(TS, "Fantasy_Inside_A3.png")).convert("RGBA").crop((3 * 96, 2 * 96, 4 * 96, 3 * 96))
        pv = Image.new("RGBA", (96 * 6, 96), (0, 0, 0, 255))
        for i, fr in enumerate([raven_stone(0), raven_stone(1), raven_stone(2), fresh_stone(0), letters(), chronicle()]):
            cell = wall.crop((24, 24, 72, 72)).copy()
            cell.alpha_composite(fr)
            pv.paste(cell.resize((96, 96), Image.NEAREST), (i * 96, 0))
        pv.save(a.preview)
        print("podgląd:", a.preview)


if __name__ == "__main__":
    main()
