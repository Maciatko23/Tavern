# hand-drawn oyster mushroom shelves (crisper than the shrunk PixelLab clusters): fan caps with a light top edge and dark gills under
import os
from PIL import Image
ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna"
S = os.path.dirname(os.path.abspath(__file__))
TS = ROOT + "/img/tilesets/Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/"
OUT = (70, 58, 50, 255); HI = (232, 226, 210, 255); TOP = (206, 196, 176, 255); MID = (176, 164, 144, 255); GILL = (128, 114, 98, 255); GILL_D = (100, 88, 76, 255)
def cap(im, x0, y0, w):
    """a fan-shaped shelf w px wide: 4 rows (light rim, top, shade, gills), rounded ends; outline round it"""
    rows = [(1, w - 1, "h"), (0, w, "t"), (0, w, "m"), (1, w - 1, "g")]
    pix = {}
    for j, (a, b, k) in enumerate(rows):
        for i in range(a, b):
            col = {"h": HI, "t": TOP if i > w * 0.35 else HI, "m": MID if i > w * 0.25 else TOP, "g": GILL if (i % 2) else GILL_D}[k]
            pix[(x0 + i, y0 + j)] = col
    p = im.load()
    for (x, y) in pix:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in pix and 0 <= q[0] < im.width and 0 <= q[1] < im.height: p[q] = OUT
    for (x, y), c in pix.items(): p[x, y] = c
def make(caps, w, h):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for (x, y, cw) in caps: cap(im, x, y, cw)
    return im.crop(im.getbbox())
outs = [make([(6, 1, 7), (1, 4, 8), (7, 7, 7)], 20, 16), make([(1, 1, 9), (7, 5, 8)], 20, 16)]
for i, o in enumerate(outs):
    o.save(ROOT + "/img/system/Gather_Boczniak_%d.png" % i); print(i, o.size)
D = Image.open(TS + "Fantasy_Outside_D_green.png").convert("RGBA"); A2 = Image.open(TS + "Fantasy_Outside_A2_green.png").convert("RGBA")
stump, grass = D.crop((192, 0, 240, 48)), A2.crop((0, 0, 48, 48))
sh = Image.new("RGBA", (48 * 3, 48))
for i in range(3):
    sh.alpha_composite(grass, (i * 48, 0)); sh.alpha_composite(stump, (i * 48, 0))
for i, c in enumerate(outs):
    sh.alpha_composite(c, ((i + 1) * 48 + (48 - c.width) // 2, 48 - 10 - c.height))
sh.resize((sh.width * 6, sh.height * 6), Image.NEAREST).save(S + "/boczniak_na_pniu2.png")
