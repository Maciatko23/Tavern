# python preview_sheet.py <sheet name in img/characters> <out.png> [scale] [bg r,g,b]
# The frames of a character sheet enlarged (nearest) on a flat background, with a thin grid - to look at new props.
import sys, os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
name, out = sys.argv[1], sys.argv[2]
k = int(sys.argv[3]) if len(sys.argv) > 3 else 3
bg = tuple(int(v) for v in sys.argv[4].split(",")) if len(sys.argv) > 4 else (150, 130, 105)
im = Image.open(os.path.join(ROOT, "img", "characters", name + ".png")).convert("RGBA")
W, H = im.size
big = name.startswith("!$") or name.startswith("$")
fw, fh = (W // 3, H // 4) if big else (W // 12, H // 8)
if big: im = im.crop((0, 0, fw, fh)); W, H = fw, fh
canvas = Image.new("RGBA", (W, H), bg + (255,))
canvas.alpha_composite(im)
canvas = canvas.resize((W * k, H * k), Image.NEAREST)
d = ImageDraw.Draw(canvas)
for x in range(0, W + 1, fw): d.line([x * k, 0, x * k, H * k], fill=(60, 50, 40, 255))
for y in range(0, H + 1, fh): d.line([0, y * k, W * k, y * k], fill=(60, 50, 40, 255))
canvas.save(out)
print("saved", out, canvas.size)
