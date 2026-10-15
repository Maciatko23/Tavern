# python tools/przystan/shots_stitch.py <tmp dir> <out dir>  (called by shots.js)
#   w_grze_mapa.png     the 3 x 3 screens of the whole harbour put together (48 px a tile), halved
#   w_grze_wnetrza.png  the three interiors side by side, each cropped round its middle
import os, sys, json
from PIL import Image, ImageDraw, ImageFont

tmp, out = sys.argv[1], sys.argv[2]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
T = 48
parts = json.load(open(os.path.join(tmp, "parts.json"), encoding="utf-8"))
W, H = 56 * T, 40 * T
canvas = Image.new("RGB", (W, H), (0, 0, 0))
for f, x, y in parts:
    im = Image.open(f).convert("RGB")
    sw, sh = im.size
    canvas.paste(im, (int(round(x * T)), int(round(y * T))))
canvas.resize((W // 2, H // 2), Image.LANCZOS).save(os.path.join(out, "w_grze_mapa.png"))

font = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSans-Bold.ttf"), 26)
names = {126: "Chata Janka", 127: "Szopa przy pochylni (noc)", 128: "Komora celna"}
crops = []
for mid in (126, 127, 128):
    im = Image.open(os.path.join(tmp, "wnetrze_%d.png" % mid)).convert("RGB")
    w, h = im.size
    c = im.crop((w // 2 - 330, h // 2 - 250, w // 2 + 330, h // 2 + 250))
    d = ImageDraw.Draw(c)
    d.rectangle([0, 0, 660, 40], fill=(11, 12, 15))
    d.text((12, 6), names[mid], font=font, fill=(255, 216, 102))
    crops.append(c)
sheet = Image.new("RGB", (660 * 3 + 20, 500), (11, 12, 15))
for i, c in enumerate(crops):
    sheet.paste(c, (i * 670, 0))
sheet.save(os.path.join(out, "w_grze_wnetrza.png"))
print("zrzuty złożone")
