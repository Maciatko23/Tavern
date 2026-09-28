# python overview.py <A|B|C|P> <plain render.png> <out.png> "<title>" "<subtitle>"
# A smaller plan of a concept: the map (without the lighting) toned down, every zone as a coloured frame with its Polish
# name, numbered pins for the people and the key places, and a legend on the right.
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
k, src, out, title, sub = sys.argv[1:6]
meta = json.load(open(os.path.join(HERE, "staging", ("%s_meta.json" % k)), encoding="utf-8"))
SC = 0.6
T = 48 * SC
base = Image.open(src).convert("RGB")
W, H = base.size
base = base.resize((int(W * SC), int(H * SC)), Image.LANCZOS)
dark = Image.new("RGB", base.size, (12, 10, 14))
base = Image.blend(base, dark, 0.38)
over = Image.new("RGBA", base.size, (0, 0, 0, 0))
d = ImageDraw.Draw(over)
F = "C:/Windows/Fonts/"
font = ImageFont.truetype(F + "arialbd.ttf", 15)
small = ImageFont.truetype(F + "arial.ttf", 13)
big = ImageFont.truetype(F + "arialbd.ttf", 26)
mid = ImageFont.truetype(F + "arialbd.ttf", 16)
for (name, x0, y0, x1, y1, col) in meta["zones"]:
    r = [x0 * T + 2, y0 * T + 2, (x1 + 1) * T - 2, (y1 + 1) * T - 2]
    d.rectangle(r, fill=tuple(col) + (48,), outline=tuple(col) + (235,), width=3)
labels_drawn = []
for (name, x0, y0, x1, y1, col) in meta["zones"]:
    tw = d.textlength(name, font=font)
    lx, ly = x0 * T + 7, y0 * T + 6
    # keep zone names apart when two zones start at the same spot
    while any(abs(lx - a) < 60 and abs(ly - b) < 20 for a, b in labels_drawn): ly += 22
    labels_drawn.append((lx, ly))
    d.rounded_rectangle([lx - 4, ly - 2, lx + tw + 5, ly + 19], radius=5, fill=(14, 12, 16, 225), outline=tuple(col) + (255,), width=1)
    d.text((lx, ly), name, fill=tuple(col) + (255,), font=font)
pins = meta.get("labels", [])
for i, (name, x, y) in enumerate(pins, 1):
    cx, cy = x * T + T / 2, y * T + T / 2
    d.ellipse([cx - 11, cy - 11, cx + 11, cy + 11], fill=(255, 214, 60, 255), outline=(20, 16, 10, 255), width=2)
    s = str(i)
    d.text((cx - d.textlength(s, font=mid) / 2, cy - 10), s, fill=(20, 16, 10, 255), font=mid)
base = base.convert("RGBA")
base.alpha_composite(over)
LEG = 380
canvas = Image.new("RGB", (base.size[0] + LEG, max(base.size[1] + 90, 150 + 26 * len(pins) + 24 * len(meta["zones"]))), (20, 18, 22))
canvas.paste(base.convert("RGB"), (0, 90))
dd = ImageDraw.Draw(canvas)
dd.text((16, 14), title, fill=(255, 214, 90), font=big)
dd.text((16, 52), sub, fill=(220, 214, 204), font=small)
lx = base.size[0] + 20
dd.text((lx, 100), "Punkty", fill=(255, 214, 90), font=mid)
for i, (name, x, y) in enumerate(pins, 1):
    yy = 130 + (i - 1) * 26
    dd.ellipse([lx, yy, lx + 20, yy + 20], fill=(255, 214, 60), outline=(20, 16, 10))
    s = str(i)
    dd.text((lx + 10 - dd.textlength(s, font=font) / 2, yy + 1), s, fill=(20, 16, 10), font=font)
    dd.text((lx + 30, yy + 1), "%s  (%d, %d)" % (name, x, y), fill=(236, 232, 224), font=font)
yy = 130 + len(pins) * 26 + 20
dd.text((lx, yy), "Strefy", fill=(255, 214, 90), font=mid)
seen = []
for (name, x0, y0, x1, y1, col) in meta["zones"]:
    if name in seen: continue
    seen.append(name)
    yy += 24
    dd.rectangle([lx, yy + 3, lx + 18, yy + 17], fill=tuple(col), outline=(240, 240, 240))
    dd.text((lx + 28, yy + 1), name, fill=(236, 232, 224), font=font)
dd.text((lx, canvas.size[1] - 40), "Mapa %dx%d kratek (1 kratka = 48 px)" % (meta["width"], meta["height"]), fill=(160, 160, 170), font=small)
canvas.save(out)
print("saved", out, canvas.size)
