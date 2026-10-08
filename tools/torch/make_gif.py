# Składa GIF-y pochodni z klatek capture.js: siatka 4 x 2 kierunków (chód / bieg / skradanie), rząd ataków (dół, prawo, góra).
#   python tools/torch/make_gif.py <katalog z klatkami>
import glob, os, sys
from PIL import Image, ImageDraw

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "pochodnia")
os.makedirs(OUT, exist_ok=True)
NAMES = {2: "dół", 1: "dół-lewo", 4: "lewo", 7: "góra-lewo", 8: "góra", 9: "góra-prawo", 6: "prawo", 3: "dół-prawo"}


def frames_of(prefix):
    return [Image.open(f).convert("RGB") for f in sorted(glob.glob(os.path.join(SRC, prefix + "_[0-9][0-9].png")))]


def grid(name, dirs, cols, scale=2, ms=90):
    rows = [frames_of("%s_%d" % (name, d)) for d in dirs]
    if not rows or not all(rows):
        return
    n = min(len(r) for r in rows)
    w, h = rows[0][0].size
    W, H = w * scale, h * scale
    out = []
    for i in range(n):
        fr = Image.new("RGB", (W * cols, (H + 18) * ((len(dirs) + cols - 1) // cols)), (14, 16, 22))
        d = ImageDraw.Draw(fr)
        for k, dd in enumerate(dirs):
            x, y = (k % cols) * W, (k // cols) * (H + 18)
            fr.paste(rows[k][i].resize((W, H), Image.NEAREST), (x, y + 18))
            d.text((x + 6, y + 3), NAMES.get(dd, str(dd)), fill=(240, 220, 160))
        out.append(fr.convert("P", palette=Image.ADAPTIVE, colors=96))
    path = os.path.join(OUT, name + ".gif")
    out[0].save(path, save_all=True, append_images=out[1:], duration=ms, loop=0, optimize=True)
    print("gif", path, n, "klatek")


grid("chod", [2, 1, 4, 7, 8, 9, 6, 3], 4)
grid("bieg", [2, 1, 4, 7, 8, 9, 6, 3], 4, ms=70)
grid("skradanie", [2, 1, 4, 7, 8, 9, 6, 3], 4, ms=110)
grid("atak", [2, 6, 8], 3, scale=2, ms=60)
p = frames_of("praca")
if p:
    out = [f.resize((f.width * 2, f.height * 2), Image.NEAREST).convert("P", palette=Image.ADAPTIVE, colors=255) for f in p]
    out[0].save(os.path.join(OUT, "praca.gif"), save_all=True, append_images=out[1:], duration=90, loop=0)
    print("gif praca")
w = frames_of("wbijanie")[::2]
if w:
    out = [f.resize((f.width * 3 // 2, f.height * 3 // 2), Image.NEAREST).convert("P", palette=Image.ADAPTIVE, colors=64) for f in w]
    out[0].save(os.path.join(OUT, "wbijanie.gif"), save_all=True, append_images=out[1:], duration=150, loop=0, optimize=True)
    print("gif wbijanie", len(w), "klatek")
