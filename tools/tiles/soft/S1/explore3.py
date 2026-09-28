"""Compare texture mixes through the S1 pipeline. usage: python explore3.py kind '<json list of [label, src-list]>'"""
import sys, json
import numpy as np
from PIL import Image, ImageDraw
from common import *
from texture import soft_mix
import build_s1 as B
B.load_cfg()
kind = sys.argv[1]
c = B.CFG[kind]
S = a2()
g = body_tile(16, S).copy(); g.alpha_composite(body_tile(46, S))
ref = {"mud": body_tile(26, S), "forest": g}[kind]
items = [("winlu k16", body_tile(16, S).convert("RGB")), ("winlu ref", ref.convert("RGB"))]
for label, src in json.loads(sys.argv[2]):
    srcs = [(Image.open(SCRATCH + "/" + p).convert("RGB"), w, r) for p, w, r in src]
    t, info = soft_mix(srcs, down=c["down"], method=c["method"], target=c["target"], blur=c["blur"], grain_amt=c["grain"], seed=c["seed"], flatten=tuple(c["flatten"]))
    ti = Image.fromarray(t); gs = gradient_stats(ti)
    print("%-14s colours %4d grad %.2f hard%% %.2f hist %.3f" % (label, colours_per_tile(ti), gs["mean_grad"], gs["hard_steps_pct"], hist_distance(ti, ref)))
    items.append((label, ti))
sheet = Image.new("RGB", (len(items) * 152, 170), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(items):
    tp = Image.new("RGB", (144, 144))
    for y in range(3):
        for x in range(3):
            tp.paste(im, (x * 48, y * 48))
    sheet.paste(tp, (i * 152, 0)); d.text((i * 152 + 2, 150), n, fill=(255, 255, 0))
zoom(sheet, 2).save(WORK + "/explore3_%s_x2.png" % kind)
