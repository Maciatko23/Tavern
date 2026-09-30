# The 5 gathered mushrooms (img/system/Gather_Mushroom_*.png) in the look of the Winlu tileset the maps are made of (user 2026-09-30:
# "najpierw wstaw"): the black outline becomes a coloured one (the neighbour's colour, darker), the colours softer and less
# saturated, and a soft shadow lies under the sprite, a little to the right, like under Winlu's objects. The PixelLab originals
# are kept in backup_art_2026-09-30/mushrooms/ (this script always starts from them, so it can be run again).
#   python tools/art/mushrooms_winlu.py
# SUPERSEDED (2026-09-30) by tools/art/mushrooms_pixellab.py (a PixelLab repaint) - running this one overwrites those pictures.
import os, colorsys
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "backup_art_2026-09-30", "mushrooms")
DST = os.path.join(ROOT, "img", "system")

def lum(p): return 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]

def restyle(im):
    im = im.convert("RGBA"); W, H = im.size; px = im.load()
    # softer colours: less saturation, a little less contrast
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            s *= 0.72; v = 0.16 + v * 0.8
            r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    # the dark outline -> the lightest neighbour's colour, darkened (a coloured outline, as Winlu draws)
    src = im.copy(); sp = src.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = sp[x, y]
            if not a or lum((r, g, b)) > 70: continue
            best = None
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and sp[nx, ny][3] and lum(sp[nx, ny]) > 70:
                    if best is None or lum(sp[nx, ny]) > lum(best): best = sp[nx, ny]
            if best: px[x, y] = (int(best[0] * 0.55), int(best[1] * 0.5), int(best[2] * 0.5), a)
    # a soft shadow under the sprite's foot, a little to the right; the picture grows by 3 px right and 2 px down
    out = Image.new("RGBA", (W + 3, H + 2), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.ellipse((2, H - 4, W + 2, H + 1), fill=(20, 30, 20, 105))
    sh = sh.filter(ImageFilter.GaussianBlur(0.8))
    spx = sh.load()
    for y in range(sh.size[1]):
        for x in range(sh.size[0]):
            if spx[x, y][3] < 20: spx[x, y] = (0, 0, 0, 0)
    out.alpha_composite(sh)
    out.alpha_composite(im, (0, 0))
    return out

if __name__ == "__main__":
    for k in range(5):
        src = Image.open(os.path.join(SRC, "Gather_Mushroom_%d.png" % k))
        out = restyle(src)
        out.save(os.path.join(DST, "Gather_Mushroom_%d.png" % k))
        print(k, src.size, "->", out.size)
