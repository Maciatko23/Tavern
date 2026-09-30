# The 5 gathered mushrooms (img/system/Gather_Mushroom_*.png) repainted in PixelLab in the Winlu tileset's look (user 2026-09-30:
# "dopracuj w pixellabie elegancko", then "tak" to the same view angle as Winlu's mushrooms).
# Two Pro Flash edits (method "reference", a Winlu mushroom tile of Fantasy_Outside_D_green as the reference, each PixelLab
# original centred on a 64x64 canvas, bottom margin 12):
#   1. the style: a coloured outline instead of the black one, soft painterly shading (raw_*.png - still seen from the side);
#   2. the view angle: the usual RPG top-down from about 45 degrees like Winlu's - the cap's top visible as a wide oval dome,
#      the stem short and mostly hidden (topdown_*.png; the parasol with the Winlu parasol tile (13,9), the rest with (14,12)).
# Both kept in backup_art_2026-09-30/mushrooms_pixellab/ (side_view_*.png = the installed side-view pictures before this).
# This script cuts each topdown result to its content, softens the colours a little and lays a soft ground shadow under it,
# a little to the lower left like under Winlu's objects; the pictures stay small (~25-35 px), as Farming_Render's
# Sprite_StoneLayer places them by their size. It can be run again.
#   python tools/art/mushrooms_pixellab.py [--preview out.png]
import os, sys, colorsys
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.path.join(ROOT, "backup_art_2026-09-30", "mushrooms_pixellab")
DST = os.path.join(ROOT, "img", "system")
SATURATION = 0.9
PAD_L, PAD_B = 3, 2     # the shadow reaches this far left of / below the mushroom

def finish(raw):
    im = raw.convert("RGBA"); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 40: px[x, y] = (0, 0, 0, 0); continue
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
    # Winlu's own mushrooms, the side-view pictures before and the new ones, on the town's Winlu grass, 4x
    ts = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets")
    D = Image.open(os.path.join(ts, "Fantasy_Outside_D_green.png")).convert("RGBA")
    grass = Image.open(os.path.join(ts, "Fantasy_Outside_A2_green.png")).convert("RGBA").crop((0, 0, 48, 48))
    win = [D.crop((cx * 48, cy * 48, cx * 48 + 48, cy * 48 + 48)) for cx, cy in [(13, 9), (14, 9), (14, 10), (14, 12), (15, 12)]]
    old = [Image.open(os.path.join(RAW, "side_view_%d.png" % k)).convert("RGBA") for k in range(5)]
    sheet = Image.new("RGBA", (5 * 48, 3 * 48), (0, 0, 0, 255))
    for yy in range(3):
        for xx in range(5): sheet.alpha_composite(grass, (xx * 48, yy * 48))
    for i, t in enumerate(win): sheet.alpha_composite(t, (i * 48, 0))
    for row, pics in ((1, old), (2, outs)):
        for i, m in enumerate(pics): sheet.alpha_composite(m, (i * 48 + (48 - m.size[0]) // 2, row * 48 + (48 - m.size[1]) // 2 + 4))
    sheet.resize((sheet.size[0] * 4, sheet.size[1] * 4), Image.NEAREST).convert("RGB").save(path)

if __name__ == "__main__":
    outs = []
    for k in range(5):
        out = finish(Image.open(os.path.join(RAW, "topdown_%d.png" % k)))
        out.save(os.path.join(DST, "Gather_Mushroom_%d.png" % k)); outs.append(out)
        print(k, "->", out.size)
    if "--preview" in sys.argv: preview(sys.argv[sys.argv.index("--preview") + 1], outs)
