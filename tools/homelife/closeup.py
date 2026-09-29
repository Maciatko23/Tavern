# A close-up of a screenshot, whole pixels bigger (the pixel art stays sharp): python tools/homelife/closeup.py <in.png> <out.png> [scale]
import sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 2
im = Image.open(src).convert("RGB")
im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(out)
print("wrote", out, im.width * scale, "x", im.height * scale)
