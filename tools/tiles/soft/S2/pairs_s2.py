"""Before/after pairs from the game screenshots, plus x3 crops of the same spot (Winlu | S2).
usage: python pairs_s2.py SHOTDIR [name:x:y:w:h ...]   (crop boxes in 1:1 screen pixels)"""
import os, sys, glob
from PIL import Image, ImageDraw

d = sys.argv[1]
for b in sorted(glob.glob(os.path.join(d, "*_before.png"))):
    name = os.path.basename(b)[:-len("_before.png")]
    a = os.path.join(d, name + "_after.png")
    if not os.path.exists(a):
        continue
    ib, ia = Image.open(b).convert("RGB"), Image.open(a).convert("RGB")
    W, H = ib.size
    out = Image.new("RGB", (W, H * 2 + 6), (255, 255, 255))
    out.paste(ib, (0, 0)); out.paste(ia, (0, H + 6))
    dr = ImageDraw.Draw(out)
    for y, t in ((4, "Winlu (przed)"), (H + 10, "S2 (po)")):
        dr.rectangle((4, y, 150, y + 22), fill=(0, 0, 0)); dr.text((10, y + 5), t, fill=(255, 230, 40))
    out.save(os.path.join(d, "pair_" + name + ".png"))
for spec in sys.argv[2:]:
    name, x, y, w, h = spec.split(":"); x, y, w, h = int(x), int(y), int(w), int(h)
    ib = Image.open(os.path.join(d, name + "_before.png")).convert("RGB").crop((x, y, x + w, y + h))
    ia = Image.open(os.path.join(d, name + "_after.png")).convert("RGB").crop((x, y, x + w, y + h))
    z = 3
    out = Image.new("RGB", (w * z * 2 + 8, h * z), (255, 255, 255))
    out.paste(ib.resize((w * z, h * z), Image.NEAREST), (0, 0))
    out.paste(ia.resize((w * z, h * z), Image.NEAREST), (w * z + 8, 0))
    out.save(os.path.join(d, "zoom3_%s_%d_%d.png" % (name, x, y)))
print("ok")
