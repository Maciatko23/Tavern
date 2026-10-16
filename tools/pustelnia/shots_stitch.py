# python tools/pustelnia/shots_stitch.py '<[[file, x, y], ...]>' W H out.png - sklejenie ekranów mapy (tools/pustelnia/shots.js) w jeden
# obraz całej mapy, zmniejszony do szerokości 1600 px
import json, sys
from PIL import Image

parts, W, H, out = json.loads(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
T = 48
full = Image.new("RGB", (W * T, H * T))
for f, x, y in parts:
    im = Image.open(f).convert("RGB")
    full.paste(im, (int(round(x * T)), int(round(y * T))))
k = 1600.0 / full.width
full.resize((1600, int(full.height * k)), Image.LANCZOS).save(out)
print("zapisano", out)
