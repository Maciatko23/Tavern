# -*- coding: utf-8 -*-
"""NOWY plik img/characters/!$Garnizon_Brama_Slup.png: slup bramy palisady (kadr 48x120, 3 wzorce x 4 kierunki), kolory z palisady."""
import os, random
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
pal = Image.open(os.path.join(ROOT, "img", "characters", "!Garnizon_Palisada.png")).convert("RGBA")
# palette from the palisade logs
cols = {}
for (x, y) in ((20, 70), (21, 80), (30, 60), (45, 90), (60, 70), (75, 85), (100, 75), (120, 66)):
    cols[(x, y)] = pal.getpixel((x, y))
base = [c for c in cols.values() if c[3] > 200]
def avg(cs): return tuple(sum(c[i] for c in cs) // len(cs) for i in range(3))
mid = avg(base); dark = tuple(int(v * 0.62) for v in mid); light = tuple(min(255, int(v * 1.25)) for v in mid); deep = tuple(int(v * 0.42) for v in mid)
W, H = 48, 120
f = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(f)
x0, x1 = 7, 40                                 # trunk 34 wide
top = 22
d.rectangle([x0, top, x1, H - 4], fill=mid + (255,))
for x in range(x0, x1 + 1, 6):                 # log grooves (vertical)
    d.line([x, top + 3, x, H - 5], fill=dark + (255,))
d.line([x0, top, x0, H - 4], fill=light + (255,)); d.line([x1, top, x1, H - 4], fill=deep + (255,))
d.rectangle([x0 + 1, top, x0 + 3, H - 4], fill=light + (120,))
# cap: a wider flat head with a pointed top
d.rectangle([x0 - 3, top - 8, x1 + 3, top + 1], fill=dark + (255,))
d.rectangle([x0 - 3, top - 8, x1 + 3, top - 7], fill=light + (255,))
d.polygon([(x0 - 1, top - 8), (x1 + 1, top - 8), (24, top - 20)], fill=mid + (255,), outline=deep + (255,))
d.line([(24, top - 20), (x0 - 1, top - 8)], fill=light + (255,))
# rope / iron bands
for yy in (top + 22, top + 52):
    d.rectangle([x0 - 1, yy, x1 + 1, yy + 4], fill=(70, 58, 44, 255)); d.line([x0 - 1, yy, x1 + 1, yy], fill=(120, 100, 76, 255)); d.line([x0 - 1, yy + 4, x1 + 1, yy + 4], fill=deep + (255,))
# foot: stones and moss like the palisade's
rnd = random.Random(5)
for i in range(9):
    sx = x0 - 3 + i * 5; sy = H - 8 + rnd.randint(-1, 1)
    d.ellipse([sx, sy, sx + 6, sy + 6], fill=(98, 92, 84, 255), outline=(60, 56, 50, 255))
d.rectangle([x0 - 2, H - 3, x1 + 2, H - 1], fill=(62, 70, 40, 255))
sheet = Image.new("RGBA", (W * 3, H * 4), (0, 0, 0, 0))
for cx in range(3):
    for cy in range(4): sheet.paste(f, (cx * W, cy * H))
out = os.path.join(ROOT, "img", "characters", "!$Garnizon_Brama_Slup.png")
if os.path.exists(out): raise SystemExit("jest juz: " + out)
sheet.save(out); print("zapisano", out, sheet.size)
