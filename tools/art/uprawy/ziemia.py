# the new ground plants: each raw PixelLab picture holds two plants side by side - split at the emptiest column near the middle,
# then tools/art/ground_pixellab.py's finish() (outline recolour, softer colours, crop, soft shadow)
import os, sys
from PIL import Image
ROOT = "c:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna"
sys.path.insert(0, ROOT + "/tools/art")
from ground_pixellab import finish
S = os.path.dirname(os.path.abspath(__file__))
NAMES = {"strawberry": "Strawberry", "wildOat": "WildOat", "wildPea2": "WildPea", "wildBeet": "WildBeet", "wildOnion": "WildOnion"}   # (wildPea2: the second try - the first was noisy)
for kind, name in NAMES.items():
    raw = Image.open(os.path.join(S, "raw", kind + ".png")).convert("RGBA")
    W, H = raw.size; a = raw.split()[3].load()
    col = [sum(1 for y in range(H) if a[x, y] > 40) for x in range(W)]
    split = min(range(W // 2 - 8, W // 2 + 9), key=lambda x: (col[x], abs(x - W // 2)))
    halves = [raw.crop((0, 0, split, H)), raw.crop((split, 0, W, H))]
    for v, h in enumerate(halves):
        # (clear the faint pixels the other plant may leave on the edge)
        if kind == "wildBeet":   # (a white glare in the middle of the rosette -> the beet's pink)
            import colorsys
            hp = h.load()
            for yy in range(h.size[1]):
                for xx in range(h.size[0]):
                    r, g, b, a = hp[xx, yy]
                    if a and min(r, g, b) > 200: hp[xx, yy] = (214, 120, 140, a)
        out = finish(h)
        dst = os.path.join(ROOT, "img", "system", "Gather_%s_%d.png" % (name, v))
        out.save(dst)
        print(kind, v, "split", split, "col", col[split], out.size)
