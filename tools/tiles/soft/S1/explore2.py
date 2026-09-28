"""Compare several generated sources through the same S1 pipeline (x2 sheet + metrics).
usage: python explore2.py kind gen/a.png gen/b.png ..."""
import sys
import numpy as np
from PIL import Image, ImageDraw
from common import *
from texture import soft_tile, tile_preview
import build_s1 as B
B.load_cfg()
kind = sys.argv[1]
c = B.CFG[kind]
S = a2()
refs = {"mud": body_tile(26, S), "forest": None}
g = body_tile(16, S).copy(); g.alpha_composite(body_tile(46, S)); refs["forest"] = g
items = [("winlu k16", body_tile(16, S).convert("RGB")), ("winlu ref", refs[kind].convert("RGB"))]
for src in sys.argv[2:]:
    img = Image.open(SCRATCH + "/" + src).convert("RGB")
    for down in (72, 96):
        t, info = soft_tile(img, down=down, method=c["method"], target=c["target"], blur=c["blur"], grain_amt=c["grain"], seed=c["seed"], flatten=tuple(c["flatten"]))
        ti = Image.fromarray(t)
        gs = gradient_stats(ti)
        print("%-18s d%d colours %4d grad %.2f hard%% %.2f hist %.3f seam %.1f" % (src, down, colours_per_tile(ti), gs["mean_grad"], gs["hard_steps_pct"], hist_distance(ti, refs[kind]), info["seam_err"]))
        items.append(("%s d%d" % (src.split("/")[-1][:-4], down), ti))
sheet = Image.new("RGB", (len(items) * 152, 170), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(items):
    tp = Image.new("RGB", (144, 144))
    for y in range(3):
        for x in range(3):
            tp.paste(im, (x * 48, y * 48))
    sheet.paste(tp, (i * 152, 0)); d.text((i * 152 + 2, 150), n, fill=(255, 255, 0))
zoom(sheet, 2).save(WORK + "/explore2_%s_x2.png" % kind)
