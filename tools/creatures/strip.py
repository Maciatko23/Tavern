# python tools/creatures/strip.py <key> <anim> [dir ...] - the frames of an animation side by side (x3, mid-grey) -> preview/<key>_<anim>.png
import os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
key, anim = sys.argv[1:3]
base = os.path.join(HERE, "frames", key, anim)
dirs = sys.argv[3:] or sorted(os.listdir(base))
rows = []
for d in dirs:
    p = os.path.join(base, d)
    if not os.path.isdir(p): continue
    fs = sorted(os.listdir(p), key=lambda f: int(f.split(".")[0]))
    rows.append([Image.open(os.path.join(p, f)).convert("RGBA") for f in fs])
cw = max(im.width for r in rows for im in r); ch = max(im.height for r in rows for im in r)
n = max(len(r) for r in rows)
o = Image.new("RGBA", (cw * n, ch * len(rows)), (110, 110, 110, 255))
for y, r in enumerate(rows):
    for x, im in enumerate(r): o.alpha_composite(im, (x * cw, y * ch))
k = 3 if o.width * 3 <= 2400 else 2
o.resize((o.width * k, o.height * k), Image.NEAREST).save(os.path.join(HERE, "preview", key + "_" + anim + ".png"))
print(len(rows), "rows", n, "frames", cw, ch)
