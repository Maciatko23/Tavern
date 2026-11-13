# python tools/majstersztyk/zestawienie.py -> docs/zadania_nowe/majstersztyk_gra/zestawienie.png (contact sheet of the in-game shots)
# + postacie_zestawienie.png (the three new sheets next to the hero: docs/postacie/<key>_z_bohaterem.png) + chodzenie_*.png (walk strips)
import os, glob
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
D = os.path.join(ROOT, "docs", "zadania_nowe", "majstersztyk_gra")
shots = sorted(f for f in glob.glob(os.path.join(D, "*.png")) if not os.path.basename(f).startswith(("zestawienie", "postacie", "chodzenie")))
W, H, cols = 640, 360, 3
rows = (len(shots) + cols - 1) // cols
sheet = Image.new("RGB", (cols * W, rows * (H + 24)), (20, 20, 24))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(shots):
    im = Image.open(f).convert("RGB").resize((W, H), Image.LANCZOS)
    x, y = (i % cols) * W, (i // cols) * (H + 24)
    sheet.paste(im, (x, y + 24)); dr.text((x + 6, y + 6), os.path.basename(f), fill=(255, 210, 63))
sheet.save(os.path.join(D, "zestawienie.png"))
for key in ("ostap", "ludwik", "jas"):
    src = os.path.join(ROOT, "docs", "postacie", key + "_z_bohaterem.png")
    if os.path.exists(src): Image.open(src).save(os.path.join(D, "postac_" + key + ".png"))
    w8 = os.path.join(ROOT, "img", "characters", "Npc_%s_Walk8.png" % key.capitalize())
    if os.path.exists(w8):
        im = Image.open(w8).convert("RGBA")           # 8 rows x 9 cells of 64
        strip = Image.new("RGBA", (9 * 64 * 2, 3 * 64 * 2), (110, 110, 110, 255))
        for r, row in enumerate((0, 6, 4)):            # south, east, north
            for c in range(9):
                cell = im.crop((c * 64, row * 64, c * 64 + 64, row * 64 + 64)).resize((128, 128), Image.NEAREST)
                strip.alpha_composite(cell, (c * 128, r * 128))
        strip.save(os.path.join(D, "chodzenie_" + key + ".png"))
print(len(shots), "shots")
