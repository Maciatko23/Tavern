# The things lying and growing on the ground to gather (Farming_Render's GATHER_ART: pebbles, branches, cones, flax, berries,
# herbs, nettles, yarrow, wild garlic, wild potatoes and carrots) as pictures in the look of the new mushrooms (user 2026-09-30:
# "gałęzie ... też w stylu i skosie jak grzyby" + the other plants) - before, the game drew them from tiny letter patterns, 2x.
# Made with PixelLab create_image_pro_flash, 32x32, the installed borowik (img/system/Gather_Mushroom_0.png) as the style
# image: the Winlu painterly look, the ~45 degree top-down view, a coloured outline. The raw results are kept in
# backup_art_2026-09-30/ground_pixellab/raw_<kind>_<n>.png; this script turns each into img/system/Gather_<Name>_<n>.png:
# a black outline (PixelLab sometimes draws one) becomes the neighbour's colour darkened, the colours a little softer, cut to
# the content, and the same soft ground shadow to the lower left as under the mushrooms. It can be run again.
#   python tools/art/ground_pixellab.py [--preview out.png]
import os, sys, colorsys
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.path.join(ROOT, "backup_art_2026-09-30", "ground_pixellab")
DST = os.path.join(ROOT, "img", "system")
# GATHER_ART kind -> (the picture's name, how many looks)
KINDS = {"stone": ("Stone", 3), "fiber": ("Flax", 2), "berries": ("Berries", 1), "branch": ("Branch", 2), "herb": ("Herb", 1),
         "nettle": ("Nettle", 2), "yarrow": ("Yarrow", 1), "garlic": ("Garlic", 1), "cone": ("Cone", 2),
         "wildPotato": ("WildPotato", 2), "wildCarrot": ("WildCarrot", 2)}
SATURATION = 0.9
PAD_L, PAD_B = 3, 2     # the shadow reaches this far left of / below the picture

def lum(p): return 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]

def finish(raw):
    im = raw.convert("RGBA"); W, H = im.size; px = im.load()
    for y in range(H):
        for x in range(W):
            if px[x, y][3] < 40: px[x, y] = (0, 0, 0, 0)
    # a black outline -> the lightest neighbour's colour, darkened (a coloured outline, as Winlu draws)
    src = im.copy(); sp = src.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = sp[x, y]
            if not a or lum((r, g, b)) > 38: continue
            best = None
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and sp[nx, ny][3] and lum(sp[nx, ny]) > 38:
                    if best is None or lum(sp[nx, ny]) > lum(best): best = sp[nx, ny]
            if best: px[x, y] = (int(best[0] * 0.5), int(best[1] * 0.5), int(best[2] * 0.5), a)
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if not a: continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            r2, g2, b2 = colorsys.hsv_to_rgb(hh, s * SATURATION, v)
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    im = im.crop(im.getbbox()); w, h = im.size
    out = Image.new("RGBA", (w + PAD_L, h + PAD_B), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.ellipse((0, h - 6, w, h + PAD_B - 1), fill=(14, 34, 18, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(1.0)); spx = sh.load()
    for y in range(sh.size[1]):
        for x in range(sh.size[0]):
            if spx[x, y][3] < 20: spx[x, y] = (0, 0, 0, 0)
    out.alpha_composite(sh)
    out.alpha_composite(im, (PAD_L, 0))
    return out

def preview(path, outs):
    # every new picture on the town's Winlu grass, with the mushrooms for comparison, 3x
    ts = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets")
    grass = Image.open(os.path.join(ts, "Fantasy_Outside_A2_green.png")).convert("RGBA").crop((0, 0, 48, 48))
    pics = outs + [Image.open(os.path.join(DST, "Gather_Mushroom_%d.png" % k)).convert("RGBA") for k in range(5)]
    cols = 8; rows = (len(pics) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * 48, rows * 48))
    for i in range(cols * rows): sheet.alpha_composite(grass, ((i % cols) * 48, (i // cols) * 48))
    for i, m in enumerate(pics):
        sheet.alpha_composite(m, ((i % cols) * 48 + (48 - m.width) // 2, (i // cols) * 48 + (48 - m.height) // 2 + 2))
    sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST).convert("RGB").save(path)

if __name__ == "__main__":
    outs = []
    for kind, (name, n) in KINDS.items():
        for v in range(n):
            out = finish(Image.open(os.path.join(RAW, "raw_%s_%d.png" % (kind, v))))
            out.save(os.path.join(DST, "Gather_%s_%d.png" % (name, v))); outs.append(out)
            print("Gather_%s_%d" % (name, v), out.size)
    if "--preview" in sys.argv: preview(sys.argv[sys.argv.index("--preview") + 1], outs)
