# python tools/przystan/art/czerwona/przed_po.py - docs/przystan/czerwona_szara.png: the grey water after rain, before (2026-10-15 first
# version: a faint grey) | after (the user's fix: a clear murky grey-brown, weaker than the red) - from czerwona_szara_przed.png and
# czerwona_szara_po.png (tests/red_water_test.js writes the "po" shot)
import os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
D = os.path.join(ROOT, "docs", "przystan")
a = Image.open(os.path.join(D, "czerwona_szara_przed.png")).convert("RGB")
b = Image.open(os.path.join(D, "czerwona_szara_po.png")).convert("RGB")
crop = (0, 0, 820, 720)                                  # the sea and the quay (the left of the screen)
a, b = a.crop(crop), b.crop(crop)
out = Image.new("RGB", (a.width * 2 + 12, a.height + 44), (11, 12, 15))
out.paste(a, (0, 44)); out.paste(b, (a.width + 12, 44))
d = ImageDraw.Draw(out)
f = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSans-Bold.ttf"), 26)
d.text((12, 8), "Przed: szara woda po deszczu ledwie zmatowiała", font=f, fill=(160, 159, 163))
d.text((a.width + 24, 8), "Po: mętna, szarobura - słabsza niż czerwień", font=f, fill=(255, 216, 102))
out.save(os.path.join(D, "czerwona_szara.png"))
print("czerwona_szara.png", out.size)
