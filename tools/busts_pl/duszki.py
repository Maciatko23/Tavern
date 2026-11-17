# Sprite sheet overview: python tools/busts_pl/duszki.py out.png Key [Key ...] - each person's front and left standing frames x3
import os
import sys
from PIL import Image, ImageDraw, ImageFont
from klatki import frame

out, keys = sys.argv[1], sys.argv[2:]
F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 15)
cols = int(os.environ.get("KOLS", 4))
cw, ch = 530, 286
rows = (len(keys) + cols - 1) // cols
sh = Image.new('RGBA', (cols * cw, rows * ch), (40, 42, 50, 255))
d = ImageDraw.Draw(sh)
for i, k in enumerate(keys):
    x0, y0 = (i % cols) * cw, (i // cols) * ch
    d.text((x0 + 6, y0 + 2), k, fill=(255, 220, 90, 255), font=F)
    for j, row in enumerate((0, 1)):
        try:
            f = frame(k, row)
        except FileNotFoundError:
            d.text((x0 + 10, y0 + 40), 'brak arkusza', fill=(255, 90, 90, 255), font=F)
            break
        sh.alpha_composite(f.resize((256, 256), Image.NEAREST), (x0 + j * 262, y0 + 24))
sh.convert('RGB').save(out)
print('ok', out)
