# python tools/urwisko/gif.py  -> docs/miejsca_wyspy/urwisko_lot.gif (z klatek tools/urwisko/klatki/ zrobionych przez shots.js)
# Kruk w kruczarni zeskakuje z żerdzi po mięso (start, lot, lądowanie), dziobie i wraca na żerdź. Klatki potem można usunąć.
import os, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
FR = os.path.join(HERE, "klatki")
box = json.load(open(os.path.join(FR, "box.json")))
W, H = 480, 360
x0, y0 = max(0, box["x"] - 240), max(0, box["y"] - 190)
files = sorted(f for f in os.listdir(FR) if f.endswith(".png"))
frames = [Image.open(os.path.join(FR, f)).convert("RGB").crop((x0, y0, x0 + W, y0 + H)) for f in files]
pal = frames[len(frames) // 3].quantize(colors=128, method=Image.Quantize.MEDIANCUT)
out = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
path = os.path.join(ROOT, "docs", "miejsca_wyspy", "urwisko_lot.gif")
out[0].save(path, save_all=True, append_images=out[1:], duration=50, loop=0, optimize=True)
print(path, len(out), "klatek", os.path.getsize(path) // 1024, "KB")
