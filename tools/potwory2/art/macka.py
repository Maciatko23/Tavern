# -*- coding: utf-8 -*-
"""python tools/potwory2/art/macka.py -> tools/potwory2/nowe/img/characters/Morze_Macka_Duza.png: the kraken's tentacle, twice the size of the first one, as an
animated water object. 12 cells of 176x128 in a row (water line at row 118): rise 0-3, idle 3-4, strike 5-7, hold 7-8, sink 9-11 (the same frame map as the
first sheet, Morze_Potwory.js MA). Made from the PixelLab object macka_obiekt.png (create_1_direction_object, 128 px): the tentacle is cut off its pool,
cut again by height (the rise), bent by a shear (the sway, the strike), the foam and rings drawn round it."""
import os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "tools", "potwory2", "nowe", "img", "characters", "Morze_Macka_Duza.png")
CELLW, CELL, WATER = 176, 128, 118
src = Image.open(os.path.join(HERE, "macka_obiekt.png")).convert("RGBA")
px = src.load()
POOL = {(26, 43, 53), (19, 35, 43), (235, 253, 254), (219, 248, 252), (71, 106, 117), (82, 117, 127), (149, 183, 196), (136, 172, 185), (123, 161, 173), (30, 51, 59)}
for y in range(src.height):
    for x in range(src.width):
        r, g, b, a = px[x, y]
        if a and y >= 84 and (r, g, b) in POOL: px[x, y] = (0, 0, 0, 0)
        elif a and y >= 101: px[x, y] = (0, 0, 0, 0)   # (the stem ends under the foam)
bb = src.getchannel("A").getbbox()
tent = src.crop(bb)
TW, TH = tent.size
def foam(d, frame, k=1.0, rings=0):
    cx = CELLW // 2
    for i in range(rings):
        r = 20 + i * 12 + (frame % 4) * 4
        d.ellipse([cx - r, WATER - r // 4, cx + r, WATER + r // 4], outline=(190, 225, 240, int(200 / (i + 1))), width=2)
    for dx, dy, rw in ((-18, 1, 7), (-8, 3, 9), (6, 3, 9), (17, 1, 7), (-26, 2, 4), (25, 2, 4)):
        s = max(1, int(rw * k))
        d.ellipse([cx + dx - s, WATER + dy - 1, cx + dx + s, WATER + dy + 2], fill=(232, 244, 250, 235))
        d.line([(cx + dx - s, WATER + dy + 2), (cx + dx + s, WATER + dy + 2)], fill=(110, 160, 190, 255))
def cell(height, bend=0.0, frame=0, rings=1, k=1.0, lean=0.0):
    im = Image.new("RGBA", (CELLW, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rings > 1 and height < 0.4: foam(d, frame, k, rings)
    h = max(3, int(TH * height))
    part = tent.resize((TW, h), Image.NEAREST)
    W2 = CELLW + 80
    out = Image.new("RGBA", (W2, CELL), (0, 0, 0, 0))
    ox = (W2 - TW) // 2
    for y in range(h):
        row = part.crop((0, y, TW, y + 1))
        t = 1 - y / max(1, h)
        sh = int(round(bend * (t ** 1.6) * h / 4 + lean * (t ** 2) * 12))
        out.paste(row, (ox + sh, WATER - h + y), row)
    im.alpha_composite(out.crop((40, 0, 40 + CELLW, CELL)))
    d2 = ImageDraw.Draw(im)
    if rings > 0 and height >= 0.4: foam(d2, frame, k, rings)
    return im
def swing(angle, frame, k):
    """the whole arm tipped over from its foot towards the right (the code flips it towards the hero): a strike, hard-edged"""
    im = Image.new("RGBA", (CELLW, CELL), (0, 0, 0, 0))
    full = Image.new("RGBA", (CELLW * 2, CELL * 2), (0, 0, 0, 0))
    full.paste(tent, (CELLW - TW // 2, CELL + WATER - TH), tent)
    rot = full.rotate(-angle, resample=Image.NEAREST, center=(CELLW, CELL + WATER))
    im.alpha_composite(rot.crop((CELLW // 2, CELL, CELLW // 2 + CELLW, CELL * 2)))
    d = ImageDraw.Draw(im)
    foam(d, frame, k, 2)
    return im
frames = []
for i, h in enumerate((0.18, 0.45, 0.75, 1.0)): frames.append(cell(h, 0, i, 2 if i < 3 else 1, 0.6 + 0.15 * i))
frames.append(cell(1.0, 1.2, 1, 1, 1.0, lean=1.5))
frames.append(swing(14, 1, 1.0))
frames.append(swing(42, 2, 1.1))
frames.append(swing(72, 3, 1.2))
frames.append(swing(66, 0, 1.2))
frames.append(cell(0.5, 1.0, 2, 2, 1.0))
frames.append(cell(0.22, 0, 3, 3, 0.9))
frames.append(cell(0.02, 0, 0, 3, 0.6))
sheet = Image.new("RGBA", (CELLW * len(frames), CELL), (0, 0, 0, 0))
for i, f in enumerate(frames): sheet.alpha_composite(f, (i * CELLW, 0))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
sheet.save(OUT)
prev = Image.new("RGBA", (sheet.width * 2, CELL * 2), (60, 90, 120, 255))
prev.alpha_composite(sheet.resize((sheet.width * 2, CELL * 2), Image.NEAREST))
prev.save(os.path.join(HERE, "macka_podglad.png"))
print("ok", len(frames), "klatek", TW, TH)
