# -*- coding: utf-8 -*-
"""W19 "Sygnaly z mlyna" - props drawn by script (pixel art, a dark outline and three tones like the Winlu things):
   img/characters/!$Mlyn_Kamien.png   millstone 2x2 cells (the cell is 192x96: the stone on x 72..168, so it covers the event cell and the one right of it)
   img/characters/!$Mlyn_Os.png       the axle with the great gear (cell 144x96: 3 cells wide, centred on the event cell)
   img/characters/!$Mlyn_Dzwignia.png the brake lever in its frame (cell 48x96)
   img/characters/!$Mlyn_Lodz.png     the smugglers' boat, bow to the shore (west): cell 192x96 (4x2 cells, centred on the event cell)
   img/characters/!$Mlyn_Worki.png    three sacks of grain in a heap (cell 96x48)
The sheets are 3 columns x 4 rows of the same cell: pattern 1, direction 2 is the one an event shows. Never overwrites a sheet
that exists (--force)."""
import os, sys, math, random
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
OUT = (30, 20, 16, 255)


def c(h, a=255): return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


STONE = [c("4a4640"), c("6f6a62"), c("918b80"), c("b3ad9f")]
WOOD = [c("3a2616"), c("5a3b22"), c("7d5632"), c("a07a4a")]
IRON = [c("23252b"), c("3d4048"), c("5c616b"), c("8a909b")]
FLOUR = [c("c9c2b0"), c("e2dccb"), c("f3eedf")]


def sheet(w, h, draw, name, force=False):
    p = os.path.join(CH, name)
    if os.path.exists(p) and not force:
        print("exists:", name); return p
    cell = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw(cell)
    sh = Image.new("RGBA", (w * 3, h * 4), (0, 0, 0, 0))
    for i in range(3):
        for j in range(4):
            sh.paste(cell, (i * w, j * h))
    sh.save(p)
    print("wrote", name)
    return p


def texture(im, tones, seed, amount=0.18):
    """pixel-art grain: a share of the pixels of the given tone list move one tone lighter / darker (keeps the outline and the alpha)"""
    rnd = random.Random(seed)
    px = im.load()
    idx = {t: i for i, t in enumerate(tones)}
    for y in range(im.height):
        for x in range(im.width):
            c = px[x, y]
            if c in idx and rnd.random() < amount:
                j = max(0, min(len(tones) - 1, idx[c] + rnd.choice((-1, 1))))
                px[x, y] = tones[j]


def millstone(im):
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = 72, 4, 168, 92
    d.ellipse([x0, y0 + 8, x1 - 1, y1 - 1], fill=OUT)
    d.ellipse([x0 + 1, y0 + 4, x1 - 2, y1 - 8], fill=STONE[0])
    d.ellipse([x0 + 1, y0 + 1, x1 - 2, y1 - 11], fill=STONE[1])
    d.ellipse([x0 + 4, y0 + 4, x1 - 5, y1 - 14], fill=STONE[2])
    cx, cy = (x0 + x1) // 2, (y0 + y1 - 10) // 2
    for k in range(8):
        a = k * math.pi / 4 + 0.3
        for r in range(10, 36):
            ang = a + r * 0.012
            px, py = cx + math.cos(ang) * r, cy + math.sin(ang) * r * 0.9
            d.point((px, py), fill=STONE[0])
            d.point((px + 1, py), fill=STONE[3])
    d.ellipse([cx - 9, cy - 8, cx + 9, cy + 8], fill=STONE[0])
    d.ellipse([cx - 7, cy - 6, cx + 7, cy + 6], fill=WOOD[1])
    d.ellipse([cx - 4, cy - 3, cx + 4, cy + 3], fill=WOOD[3])
    for k in range(40):
        r = random.Random(k)
        ex = r.randint(x0 + 6, x1 - 8); ey = r.randint(y0 + 8, y1 - 18)
        d.point((ex, ey), fill=FLOUR[1])
    d.arc([x0 + 4, y0 + 2, x1 - 5, y1 - 14], 200, 330, fill=STONE[3])
    # an iron band round the rim and a few chips
    d.arc([x0 + 1, y0 + 1, x1 - 2, y1 - 11], 20, 160, fill=IRON[2])
    d.arc([x0 + 2, y0 + 3, x1 - 3, y1 - 12], 20, 160, fill=IRON[0])
    for (cx2, cy2) in ((x0 + 14, y0 + 30), (x1 - 18, y0 + 44), (x0 + 40, y1 - 24)):
        d.line([(cx2, cy2), (cx2 + 3, cy2 + 1)], fill=STONE[0])
    texture(im, STONE, 11, 0.28)


def axle(im):
    d = ImageDraw.Draw(im)
    d.rectangle([0, 46, 143, 62], fill=OUT)
    d.rectangle([1, 47, 142, 60], fill=WOOD[1]); d.rectangle([1, 47, 142, 50], fill=WOOD[3]); d.rectangle([1, 58, 142, 60], fill=WOOD[0])
    cx, cy, R = 72, 54, 38
    for k in range(16):
        a = k * math.pi / 8
        tx, ty = cx + math.cos(a) * (R + 2), cy + math.sin(a) * (R + 2) * 0.75
        d.rectangle([tx - 4, ty - 5, tx + 4, ty + 4], fill=OUT)
        d.rectangle([tx - 3, ty - 4, tx + 3, ty + 3], fill=WOOD[2])
    d.ellipse([cx - R, cy - R * 0.75, cx + R, cy + R * 0.75], fill=OUT)
    d.ellipse([cx - R + 2, cy - R * 0.75 + 2, cx + R - 2, cy + R * 0.75 - 2], fill=WOOD[2])
    d.ellipse([cx - R + 8, cy - R * 0.75 + 7, cx + R - 8, cy + R * 0.75 - 7], fill=WOOD[1])
    for k in range(6):
        a = k * math.pi / 3
        d.line([cx, cy, cx + math.cos(a) * (R - 6), cy + math.sin(a) * (R - 6) * 0.75], fill=WOOD[3], width=3)
    d.ellipse([cx - 9, cy - 8, cx + 9, cy + 8], fill=IRON[1]); d.ellipse([cx - 6, cy - 5, cx + 6, cy + 5], fill=IRON[3])
    for x in (4, 24, 120, 138):
        d.rectangle([x, 44, x + 5, 64], fill=IRON[0]); d.rectangle([x + 1, 45, x + 4, 62], fill=IRON[2])
    for yy in (49, 52, 56):
        d.line([(30, yy), (60, yy)], fill=WOOD[0]); d.line([(84, yy), (114, yy)], fill=WOOD[0])
    texture(im, WOOD, 5, 0.25)


def lever(im):
    d = ImageDraw.Draw(im)
    d.rectangle([6, 52, 41, 92], fill=OUT)
    d.rectangle([8, 54, 39, 90], fill=WOOD[1]); d.rectangle([8, 54, 39, 58], fill=WOOD[3]); d.rectangle([8, 54, 12, 90], fill=WOOD[2])
    d.rectangle([14, 62, 33, 84], fill=OUT); d.rectangle([16, 64, 31, 82], fill=IRON[0])
    d.polygon([(20, 80), (27, 80), (30, 18), (23, 18)], fill=OUT)
    d.polygon([(22, 78), (26, 78), (28, 20), (25, 20)], fill=IRON[2]); d.line([(25, 22), (24, 76)], fill=IRON[3])
    d.ellipse([16, 6, 36, 24], fill=OUT); d.ellipse([18, 8, 34, 22], fill=WOOD[2]); d.ellipse([20, 9, 29, 16], fill=WOOD[3])
    d.ellipse([20, 74, 31, 85], fill=IRON[0]); d.ellipse([22, 76, 29, 83], fill=IRON[3])


def boat(im):
    d = ImageDraw.Draw(im)
    hull = [(8, 48), (30, 28), (80, 20), (150, 22), (176, 30), (178, 66), (150, 74), (80, 76), (30, 68)]
    d.polygon(hull, fill=OUT)
    inner = [(14, 48), (32, 33), (80, 25), (148, 27), (171, 34), (172, 62), (148, 70), (80, 71), (32, 63)]
    d.polygon(inner, fill=WOOD[1])
    for x in range(30, 170, 14):
        d.line([(x, 28), (x, 70)], fill=WOOD[0], width=1)
    d.line([(20, 48), (172, 48)], fill=WOOD[0], width=1)
    d.polygon([(30, 33), (172, 33), (172, 37), (30, 37)], fill=WOOD[3])
    for x in (52, 94, 134):
        d.rectangle([x, 28, x + 6, 70], fill=WOOD[2]); d.line([(x, 28), (x, 70)], fill=WOOD[3])
    d.rectangle([60, 41, 130, 55], fill=FLOUR[0]); d.rectangle([60, 41, 130, 44], fill=FLOUR[2])
    d.line([(60, 55), (130, 55)], fill=STONE[1])
    d.line([(96, 20), (96, 10)], fill=OUT, width=3)
    d.rectangle([92, 4, 100, 12], fill=OUT); d.rectangle([94, 6, 98, 10], fill=c("ffc65a"))
    for y in (14, 82):
        d.line([(70, y + (8 if y < 40 else -8)), (112, y)], fill=WOOD[2], width=3)
        d.line([(112, y), (124, y)], fill=OUT, width=4)


def sacks(im):
    d = ImageDraw.Draw(im)

    def sack(x, y, w, h):
        d.ellipse([x, y, x + w, y + h], fill=OUT)
        d.ellipse([x + 1, y + 1, x + w - 1, y + h - 1], fill=c("a89468"))
        d.ellipse([x + 3, y + 2, x + w - 5, y + h - 8], fill=c("c7b283"))
        d.rectangle([x + w // 2 - 4, y - 1, x + w // 2 + 4, y + 4], fill=c("7d6a44"))
        d.line([(x + w // 2 - 4, y + 4), (x + w // 2 + 4, y + 4)], fill=OUT)
    sack(4, 20, 38, 26); sack(40, 18, 40, 28); sack(22, 6, 38, 26)


def main():
    f = "--force" in sys.argv
    sheet(192, 96, millstone, "!$Mlyn_Kamien.png", f)
    sheet(144, 96, axle, "!$Mlyn_Os.png", f)
    sheet(48, 96, lever, "!$Mlyn_Dzwignia.png", f)


if __name__ == "__main__":
    main()
