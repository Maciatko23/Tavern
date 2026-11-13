# -*- coding: utf-8 -*-
"""python tools/potwory/art/macka.py -> tools/potwory/nowe/img/characters/Morze_Macka.png: the kraken's tentacle as an animated water object.
12 cells of 64x64 in a row (feet / water line at row 60): rise 0-3 (the tip climbs out of the foam), idle 3-4 (sways), strike 5-7 (bends
towards the hero and comes down), hold 7-8, sink 9-11 (slips under, the rings). Made from the sample docs/potwory_z_morza/probki/macki_krakena.png:
the tentacle is cut off its splash, cut again by height (the rise), bent by a shear (the sway, the strike), the foam and rings drawn round it."""
import os, math
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(ROOT, "docs", "potwory_z_morza", "probki", "macki_krakena.png")
OUT = os.path.join(ROOT, "tools", "potwory", "nowe", "img", "characters", "Morze_Macka.png")
CELL, WATER = 64, 59
src = Image.open(SRC).convert("RGBA")
# the tentacle without the splash: the splash is the pale blue / white at the bottom rows (y >= 52)
body = src.copy()
px = body.load()
for y in range(src.height):
    for x in range(src.width):
        r, g, b, a = px[x, y]
        if a and y >= 50 and b > 150 and r > 110 and g > 140: px[x, y] = (0, 0, 0, 0)   # foam: bright and blue-white
bb = body.getchannel("A").getbbox()
tent = body.crop(bb)            # the tentacle alone (its bottom is the stem)
TW, TH = tent.size
def foam(d, frame, k=1.0, rings=0):
    cx = CELL // 2
    for i in range(rings):
        r = 8 + i * 6 + (frame % 4) * 2
        d.ellipse([cx - r, WATER - r // 3, cx + r, WATER + r // 3], outline=(190, 225, 240, int(180 / (i + 1))))
    for dx, dy, rr in ((-9, 0, 4), (-4, 1, 5), (3, 1, 5), (9, 0, 4), (0, -1, 4)):
        s = int(rr * k)
        if s > 0: d.ellipse([cx + dx - s, WATER + dy - s // 2, cx + dx + s, WATER + dy + s // 2 + 1], fill=(225, 240, 248, 235), outline=(110, 160, 190, 255))
def cell(height, bend=0.0, frame=0, rings=1, k=1.0, lean=0.0):
    """the tentacle `height` (0..1) of its full height out of the water, bent: shear `bend` px per row"""
    im = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rings > 1 and height < 0.4: foam(d, frame, k, rings)
    h = max(2, int(TH * height))
    part = tent.crop((0, 0, TW, h)) if height >= 1 else tent.crop((0, 0, TW, h))
    # tip first: the top `h` rows of the tentacle are what is out (the stem is the bottom): take the bottom `h` rows when it rises from the water
    part = tent.resize((TW, h), Image.NEAREST)   # (it grows out of the water: the whole tentacle squeezed to `h` rows)
    out = Image.new("RGBA", (CELL + 40, CELL), (0, 0, 0, 0))
    ox = (CELL + 40 - TW) // 2
    for y in range(h):
        row = part.crop((0, y, TW, y + 1))
        t = 1 - y / max(1, h)          # 1 at the tip
        sh = int(round(bend * (t ** 1.6) * h / 4 + lean * (t ** 2) * 6))
        out.paste(row, (ox + sh, WATER - h + y), row)
    im.alpha_composite(out.crop((20, 0, 20 + CELL, CELL)))
    d2 = ImageDraw.Draw(im)
    if rings > 0 and height >= 0.4: foam(d2, frame, k, rings)
    return im
frames = []
# rise 0-3
for i, h in enumerate((0.18, 0.45, 0.75, 1.0)): frames.append(cell(h, 0, i, 2 if i < 3 else 1, 0.6 + 0.15 * i))
# idle 4 (sway): 3 repeated as frame 3, then 4 leaning
frames.append(cell(1.0, 1.2, 1, 1, 1.0, lean=1.5))
# strike 5-7: bends towards the viewer (down), the foam thrown
frames.append(cell(0.95, 3.0, 2, 1, 1.0, lean=3))
frames.append(cell(0.7, 5.5, 3, 2, 1.2, lean=4))
frames.append(cell(0.5, 7.0, 0, 2, 1.3, lean=5))
# hold 8: coils tight (the same bend, lower)
frames.append(cell(0.55, 6.0, 1, 2, 1.2, lean=4))
# sink 9-11
frames.append(cell(0.5, 1.0, 2, 2, 1.0))
frames.append(cell(0.22, 0, 3, 3, 0.9))
frames.append(cell(0.02, 0, 0, 3, 0.6))
sheet = Image.new("RGBA", (CELL * len(frames), CELL), (0, 0, 0, 0))
for i, f in enumerate(frames): sheet.alpha_composite(f, (i * CELL, 0))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
sheet.save(OUT)
prev = Image.new("RGBA", (sheet.width * 3, CELL * 3), (60, 90, 120, 255))
prev.alpha_composite(sheet.resize((sheet.width * 3, CELL * 3), Image.NEAREST))
prev.save(os.path.join(HERE, "macka_podglad.png"))
print("ok", len(frames), "klatek")
