# Crops tools/konie/film.js's frames into strips and GIFs (docs/konie/)
import glob, os
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
D = os.path.join(ROOT, "docs", "konie")
# the hero stands at (69,18): the screen centre (640, 360) is his cell's middle -> the screen x of tile X: 640 + (X - 69.5) * 48
def box(x0, y0, x1, y1):
    return (int(640 + (x0 - 69.5) * 48), int(360 + (y0 - 18.5) * 48), int(640 + (x1 - 69.5) * 48), int(360 + (y1 - 18.5) * 48))
CLIPS = {"cofa": (box(60.5, 15.5, 68.5, 20), 2), "pije": (box(60.5, 15.5, 66.5, 20), 2), "pasie": (box(65.5, 16, 72, 19.8), 2), "idzie": (box(64.5, 16, 72.5, 19.8), 2)}
for name, (bx, sc) in CLIPS.items():
    fs = sorted(glob.glob(os.path.join(D, "film", name + "_*.png")))
    crops = [Image.open(f).convert("RGB").crop(bx) for f in fs]
    crops = [c.resize((c.width * sc, c.height * sc), Image.NEAREST) for c in crops]
    crops[0].save(os.path.join(D, "film_" + name + ".gif"), save_all=True, append_images=crops[1:], duration=100, loop=0)
    n = 6 if name != "idzie" else 6
    lo, hi = (1, 17) if name == 'idzie' else (0, len(crops) - 1)
    pick = [crops[int(lo + i * (hi - lo) / (n - 1))] for i in range(n)]
    w, h = pick[0].size
    strip = Image.new("RGB", (w * 3, h * 2))
    for i, c in enumerate(pick): strip.paste(c, ((i % 3) * w, (i // 3) * h))
    strip.save(os.path.join(D, "pasek_" + name + ".png"))
    print(name, len(crops), strip.size)
