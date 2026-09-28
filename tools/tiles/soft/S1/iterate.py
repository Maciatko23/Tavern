"""Quick look at edge-field settings on a real map region (offline MZ drawing).
usage: python iterate.py <map> x0 y0 w h '<json list of {"mud":{field overrides}, "forest":{...}, "label":..}>' out.png"""
import sys, json, copy
import numpy as np
from PIL import Image, ImageDraw
from common import *
import build_s1 as B, a2soft
from offline_map import render
B.load_cfg()
mp, x0, y0, w, h = map(int, sys.argv[1:6])
variants = json.loads(sys.argv[6])
tex = {n: np.asarray(Image.open(WORK + "/tex_%s.png" % n).convert("RGB")) for n in ("mud", "forest")}
S = a2()
tiles = [("winlu", render(mp, x0, y0, w, h, S))]
for v in variants:
    sheet = S.copy()
    for kind, name in ((39, "mud"), (46, "forest")):
        fp = dict(B.FIELD[name]); fp.update(v.get(name, {}))
        dp = dict(B.DRAW[name]); dp.update(v.get("draw_" + name, {}))
        f = a2soft.SoftField(**fp)
        blk = a2soft.build_overlay(f, tex[name], **dp)
        bx, by = block_xy(kind)
        sheet.paste(Image.new("RGBA", (96, 144)), (bx, by)); sheet.paste(blk, (bx, by))
    tiles.append((v.get("label", "?"), render(mp, x0, y0, w, h, sheet)))
tw, th = tiles[0][1].size
cols = min(3, len(tiles))
rows = (len(tiles) + cols - 1) // cols
out = Image.new("RGBA", (cols * (tw + 6), rows * (th + 18)), (0, 0, 0, 255))
d = ImageDraw.Draw(out)
for i, (lab, im) in enumerate(tiles):
    x, y = (i % cols) * (tw + 6), (i // cols) * (th + 18)
    out.paste(im, (x, y)); d.text((x + 2, y + th + 2), lab, fill=(255, 255, 0))
out.save(WORK + "/" + sys.argv[7])
