import sys, os
from PIL import Image
R = "tools/potwory2/art/klatki/%s/anim/%s/"
key, anim = sys.argv[1:3]; out = sys.argv[3]
base = R % (key, anim)
dirs = sorted(os.listdir(base))
rows = []
for d in dirs:
    fs = sorted(os.listdir(base + d), key=lambda f: int(f.split(".")[0]))
    rows.append([Image.open(base + d + "/" + f).convert("RGBA") for f in fs])
W = max(len(r) for r in rows); h = max(f.height for r in rows for f in r); w = max(f.width for r in rows for f in r)
im = Image.new("RGBA", (W * w * 2, len(rows) * h * 2), (70, 80, 70, 255))
for i, r in enumerate(rows):
    for j, f in enumerate(r): im.alpha_composite(f.resize((f.width * 2, f.height * 2), Image.NEAREST), (j * w * 2, i * h * 2))
im.save(out); print(dirs, im.size)
