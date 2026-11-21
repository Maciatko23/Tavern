# Apple saplings !$Sapling_Apple, _2, _3: the heap of dug earth of !$Sapling (rows 21-33 of its first picture) with a leafy apple
# seedling drawn on it instead of the pine (1 a two-leaf sprout, 2 a twig with leaves, 3 a knee-high sapling). The layout of the
# !$Sapling sheets: 144x192, 3x4 cells of 48; the picture in rows 0-2 (every column the same), row 3 empty.
import math, os
from PIL import Image
ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna/img/characters/"
S = os.path.dirname(os.path.abspath(__file__))
src = Image.open(ROOT + "!$Sapling.png").convert("RGBA")
heap = src.crop((48, 0, 96, 48)); hp = heap.load()
for y in range(48):
    for x in range(48):
        if y <= 20 or y >= 40: hp[x, y] = (0, 0, 0, 0)     # (the pine above the heap, and the next picture's tip at the bottom)
OUT = (29, 40, 22, 255)
LEAF_D, LEAF, LEAF_HI = (42, 86, 36, 255), (68, 124, 50, 255), (108, 164, 70, 255)
STEM, STEM_HI = (92, 62, 40, 255), (132, 92, 58, 255)

def draw(im, pix):
    p = im.load()
    for (x, y) in pix:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in pix and 0 <= q[0] < 48 and 0 <= q[1] < 48: p[q] = OUT
    for (x, y), c in pix.items():
        if 0 <= x < 48 and 0 <= y < 48: p[x, y] = c
def leaf(im, cx, cy, ang, length=3.2, width=1.6):
    pix = {}
    ca, sa = math.cos(ang), math.sin(ang)
    for y in range(int(cy) - 5, int(cy) + 6):
        for x in range(int(cx) - 5, int(cx) + 6):
            dx, dy = x - cx, y - cy
            u, v = dx * ca + dy * sa, -dx * sa + dy * ca
            if (u / length) ** 2 + (v / width) ** 2 <= 1.0:
                pix[(x, y)] = LEAF_HI if v < -0.3 and u < 0.8 else (LEAF_D if v > 0.6 else LEAF)
    draw(im, pix)
def stem(im, pts, width=1):
    pix = {}
    for (x, y) in pts:
        pix[(x, y)] = STEM_HI
        if width == 2: pix[(x + 1, y)] = STEM
    draw(im, pix)
def vline(x, y0, y1): return [(x, y) for y in range(y0, y1 - 1, -1)]

def stage(n):
    im = heap.copy()
    if n == 1:
        stem(im, vline(24, 22, 18))
        leaf(im, 21.8, 17, -0.4, 2.2, 1.1); leaf(im, 26.2, 17, 0.4 + math.pi, 2.2, 1.1)
    elif n == 2:
        stem(im, [(24, 22), (24, 21), (24, 20), (24, 19), (25, 18), (25, 17), (25, 16), (25, 15), (25, 14), (24, 13)])
        for (x, y, a) in ((21.5, 19, -0.3), (28, 16, 0.3 + math.pi), (22, 13.5, -0.6), (24.5, 10.5, -1.57)):
            leaf(im, x, y, a, 2.5, 1.2)
    else:
        trunk = [(24, 22)] + [(24, y) for y in range(21, 12, -1)] + [(25, 12), (25, 11), (25, 10), (25, 9), (25, 8), (25, 7)]
        stem(im, trunk, width=2)
        stem(im, [(23, 15), (22, 14), (21, 13), (20, 12)])
        stem(im, [(27, 11), (28, 10), (29, 9), (30, 8)])
        for (x, y, a) in ((20.5, 17.5, -0.3), (18, 11.5, -0.5), (30.5, 14.5, 0.3 + math.pi), (32, 7.5, 0.5 + math.pi),
                          (27.5, 4.5, 1.1 + math.pi), (23, 5, -1.3), (21, 9, -0.9)):
            leaf(im, x, y, a, 2.6, 1.3)
    return im

for n, name in ((1, "!$Sapling_Apple"), (2, "!$Sapling_Apple_2"), (3, "!$Sapling_Apple_3")):
    pic = stage(n)
    sheet = Image.new("RGBA", (144, 192), (0, 0, 0, 0))
    for r in range(3):
        for c in range(3): sheet.alpha_composite(pic, (c * 48, r * 48))
    sheet.save(ROOT + name + ".png")
    print(name)
prev = Image.new("RGBA", (48 * 6, 48), (70, 110, 60, 255))
for i, nm in enumerate(("!$Sapling", "!$Sapling_2", "!$Sapling_3", "!$Sapling_Apple", "!$Sapling_Apple_2", "!$Sapling_Apple_3")):
    prev.alpha_composite(Image.open(ROOT + nm + ".png").convert("RGBA").crop((48, 0, 96, 48)), (i * 48, 0))
prev.resize((prev.width * 5, prev.height * 5), Image.NEAREST).save(S + "/sadzonki_podglad.png")
