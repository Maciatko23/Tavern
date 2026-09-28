"""Try downscale sizes / filters on a generated texture; writes a comparison sheet (x3) with Winlu tiles beside.
usage: python explore.py gen/mud_a.png mud  |  python explore.py gen/forest_a.png forest"""
import sys
import numpy as np
from PIL import Image, ImageDraw
from common import *
from texture import soft_tile, tile_preview

TARGETS = {
    # Lab mean, Lab std
    "mud": ((36.0, 2.5, 12.5), (4.2, 1.1, 2.4)),
    "forest": ((41.0, -13.0, 18.0), (4.0, 5.0, 3.5)),
}

src, kind = sys.argv[1], sys.argv[2]
img = Image.open(src if ":" in src else SCRATCH + "/" + src).convert("RGB")
S = a2()
ref = [("winlu grass k16", body_tile(16, S)), ("winlu dirt k24", body_tile(24, S))]
variants = []
for down in (72, 96):
    for fl in (None, (2.5, 0.35), (3.5, 0.25)):
        t, info = soft_tile(img, down=down, method="area+lanczos", target=TARGETS[kind], blur=0.35, grain_amt=1.0, flatten=fl)
        variants.append(("%s d%d fl%s" % (kind, down, fl and fl[0]), t, info))
cols = len(variants) + len(ref)
sheet = Image.new("RGB", (cols * 152, 170), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (name, im) in enumerate(ref):
    rgb = im.convert("RGB")
    tp = Image.new("RGB", (144, 144))
    for y in range(3):
        for x in range(3):
            tp.paste(rgb, (x * 48, y * 48))
    sheet.paste(tp, (i * 152, 0))
    d.text((i * 152 + 2, 150), name, fill=(255, 255, 0))
for j, (name, t, info) in enumerate(variants):
    i = j + len(ref)
    sheet.paste(tile_preview(t, 3), (i * 152, 0))
    d.text((i * 152 + 2, 150), name, fill=(255, 255, 0))
    g = gradient_stats(Image.fromarray(t))
    print("%-28s colours %4d mean_grad %.2f hard%% %.2f  hist-dist vs winlu dirt %.3f  seam %.1f win %s" % (
        name, colours_per_tile(Image.fromarray(t)), g["mean_grad"], g["hard_steps_pct"],
        hist_distance(Image.fromarray(t), body_tile(24, S)), info["seam_err"], info["window"]))
sheet.save(WORK + "/explore_%s.png" % kind)
zoom(sheet, 2).save(WORK + "/explore_%s_x2.png" % kind)
