# python flags_sheet.py [flags.json] -> tools/tavern/staging/renders/tileset8_flags.png : the B, C, D, E and A5 sheets with
# the passage class drawn over every cell (red X = blocks, blue * = above characters, orange = counter, nothing = passable)
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tileset8_flags import SHEETS, WINLU, tid, klass
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "staging", "tileset8_flags.json")
flags = json.load(open(src, encoding="utf-8"))
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
panels = []
for s in list(SHEETS) + ["A5"]:
    name = SHEETS[s][0] if s != "A5" else "Fantasy_Inside_A5"
    im = Image.open(os.path.join(WINLU, name + ".png")).convert("RGBA")
    bg = Image.new("RGBA", im.size, (96, 84, 72, 255)); bg.alpha_composite(im)
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    cols = 8 if s == "A5" else 16
    for r in range(16):
        for c in range(cols):
            k = klass(flags[tid(s, c, r)])
            x0, y0 = c * 48, r * 48
            if k == "X": d.rectangle([x0 + 1, y0 + 1, x0 + 46, y0 + 46], outline=(255, 40, 40, 230), width=2)
            elif k == "Xc": d.rectangle([x0 + 1, y0 + 1, x0 + 46, y0 + 46], outline=(255, 160, 0, 255), width=3)
            elif k == "*": d.rectangle([x0 + 1, y0 + 1, x0 + 46, y0 + 46], outline=(60, 160, 255, 255), width=2); d.text((x0 + 4, y0 + 2), "*", font=font, fill=(60, 160, 255, 255))
    bg.alpha_composite(ov)
    panels.append((s, bg))
W = sum(p.size[0] for _, p in panels) + 20 * len(panels)
sheet = Image.new("RGB", (W, 800), (20, 18, 16))
x = 10
dd = ImageDraw.Draw(sheet)
for s, p in panels:
    sheet.paste(p.convert("RGB"), (x, 30)); dd.text((x, 6), s, font=font, fill=(255, 214, 90)); x += p.size[0] + 20
out = os.path.join(HERE, "staging", "renders", "tileset8_flags.png")
sheet.save(out); print("saved", out, sheet.size)
