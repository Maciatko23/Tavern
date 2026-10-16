# python tools/domy/art/compose_etapy.py [out.png]  -> img/characters/!$Zagroda_Dom.png (default)
# The Ług family's house in the burnt farm (Map168), one picture per stage of the rebuilding (Homes.js shows the stage's frame):
#   0 zgliszcza   - dom0.png (PixelLab edit of dom5: burnt, the roof fallen in, the chimney cracked, ash)
#   1 uprzątnięte - only the old stone footing of dom5 (the doorway's gap left)
#   2 podmurówka  - the footing and the two lowest courses of logs
#   3 ściany      - the log walls with empty openings (no door, no shutters) and the bare roof frame above
#   4 dach        - the thatched roof on, still no door, no shutters, no chimney
#   5 gotowe      - dom5.png (PixelLab create_image_pro_flash in the style of the player's hut, Farm_Hut_L.png)
# dom5 and dom0 are 252 x 216 (fine 1x pixel, 1 px outline); the in-between stages are cut from dom5 here, so every stage stands
# exactly where the others stand. The sheet: a "!$" character, 3 x 4 frames of 252 x 216 - stages 0..2 on the "down" row, 3..5 on
# the "left" row (the rows "right" / "up" repeat them).
import os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "img", "characters", "!$Zagroda_Dom.png")
FW, FH = 252, 216
DOOR = (103, 137, 146, 209)          # the door leaf (x0, y0, x1, y1), the lintel above it stays
WINDOWS = [(37, 131, 96, 169), (156, 131, 215, 169)]    # shutters + frame
PANES = [(53, 136, 79, 167), (173, 136, 199, 167)]      # the openings
CHIMNEY = (26, 0, 60, 50)
WALL_TOP, FOOT_TOP = 118, 192         # the eaves line (walls below), the stone footing's top
DARK = (30, 19, 12, 255)
OUTL = (24, 14, 8, 255)
WOOD = [(86, 55, 32, 255), (112, 74, 42, 255), (140, 96, 56, 255)]


def plain_wall_fill(im, box, src_x0, src_x1):
    """the logs run across: fill a box with columns copied (tiled) from a plain strip of wall in the same rows"""
    x0, y0, x1, y1 = box
    px = im.load()
    w = src_x1 - src_x0
    for y in range(y0, y1):
        for x in range(x0, x1):
            px[x, y] = px[src_x0 + (x - x0) % w, y]


def openings(im):
    """no door leaf, no shutters, no glass: dark openings in the log wall"""
    d = ImageDraw.Draw(im)
    for box in WINDOWS:
        plain_wall_fill(im, box, 97, 102)
    for (x0, y0, x1, y1) in PANES:
        d.rectangle((x0 - 1, y0 - 1, x1, y1), fill=OUTL)
        d.rectangle((x0, y0, x1 - 1, y1 - 1), fill=DARK)
    x0, y0, x1, y1 = DOOR
    d.rectangle((x0 - 1, y0 - 1, x1, y1), fill=OUTL)
    d.rectangle((x0, y0, x1 - 1, y1), fill=DARK)
    d.rectangle((x0, y0, x1 - 1, y0 + 6), fill=(18, 11, 7, 255))        # (the shade under the lintel)


def no_chimney(im):
    """the thatch where the chimney stood (copied from the roof beside it); above the roof line: nothing"""
    x0, y0, x1, y1 = CHIMNEY
    px = im.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            src = px[x + 44, y]
            px[x, y] = src if y >= 22 else (0, 0, 0, 0)


def roof_frame(im):
    """the bare roof frame over the walls, in the outline of dom5's thatch (top y 23 x 18..229, eaves y 118 x 2..248): rafters from
    the ridge to the eaves (the end ones slanting with the roof's sides), two battens across them, the ridge and the eaves beams -
    dark-outlined wood, 1x pixel"""
    px = im.load()
    TOP, EAVES = (24, 18, 229), (116, 2, 248)
    def put(x, y, c):
        if 0 <= x < FW and 0 <= y < FH: px[x, y] = c
    def edge(y):            # the roof's left / right edge at row y
        t = (y - TOP[0]) / (EAVES[0] - TOP[0])
        return TOP[1] + (EAVES[1] - TOP[1]) * t, TOP[2] + (EAVES[2] - TOP[2]) * t
    n = 8
    for i in range(n):
        for y in range(TOP[0] + 4, EAVES[0]):
            l, r = edge(y)
            xc = int(round(l + 3 + (r - l - 6) * i / (n - 1)))
            for dx in range(-3, 4):
                put(xc + dx, y, OUTL if abs(dx) == 3 else WOOD[2] if dx == -2 else WOOD[1])
    def batten(y0, h, tone):
        for y in range(y0, y0 + h):
            l, r = edge(y)
            for x in range(int(l) - 1, int(r) + 2):
                put(x, y, OUTL if y in (y0, y0 + h - 1) or x in (int(l) - 1, int(r) + 1) else WOOD[2] if y == y0 + 1 else WOOD[tone])
    batten(52, 6, 0)
    batten(84, 6, 0)
    batten(TOP[0], 7, 1)        # the ridge
    batten(EAVES[0] - 6, 9, 1)  # the eaves beam


def keep_rows(im, y0):
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.alpha_composite(im.crop((0, y0, FW, FH)), (0, y0))
    return out


def main():
    dom5 = Image.open(os.path.join(HERE, "dom5.png")).convert("RGBA")
    dom0 = Image.open(os.path.join(HERE, "dom0.png")).convert("RGBA")
    assert dom5.size == (FW, FH) and dom0.size == (FW, FH)
    s4 = dom5.copy(); openings(s4); no_chimney(s4)
    walls = keep_rows(s4, WALL_TOP)
    s3 = Image.new("RGBA", (FW, FH), (0, 0, 0, 0)); roof_frame(s3); s3.alpha_composite(walls)
    s2 = keep_rows(s4, 168)
    ImageDraw.Draw(s2).rectangle((DOOR[0] - 1, 168, DOOR[2], FH), fill=(0, 0, 0, 0))   # (the doorway: open ground, no door yet)
    s1 = keep_rows(s4, FOOT_TOP)
    d1 = ImageDraw.Draw(s1)
    x0, y0, x1, y1 = DOOR
    d1.rectangle((x0 - 1, FOOT_TOP, x1, FH), fill=(0, 0, 0, 0))      # (no door: the gap in the footing)
    stages = [dom0, s1, s2, s3, s4, dom5]
    sheet = Image.new("RGBA", (FW * 3, FH * 4), (0, 0, 0, 0))
    for i, st in enumerate(stages):
        col, row = i % 3, i // 3
        for r in (row, row + 2):
            sheet.alpha_composite(st, (col * FW, r * FH))
    sheet.save(OUT)
    # a strip for the docs (on grass)
    strip = Image.new("RGBA", (FW * 6 + 50, FH + 20), (60, 104, 58, 255))
    for i, st in enumerate(stages): strip.alpha_composite(st, (10 + i * (FW + 8), 10))
    strip.save(os.path.join(HERE, "etapy_podglad.png"))
    print(OUT, sheet.size)


if __name__ == "__main__":
    main()
