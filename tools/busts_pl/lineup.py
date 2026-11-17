# Lineup: python tools/busts_pl/lineup.py <n> Key [Key ...] -> docs/ekwipunek/popiersie/lineup_<n>.png
# each new staging bust (x2) beside its map sprite's front and left frames (x4)
import os
import sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from klatki import frame  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'ekwipunek', 'popiersie')
F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
n, keys = sys.argv[1], sys.argv[2:]
cols = 3
cw, ch = 256 + 2 * 200 + 30, 256 + 30
rows = (len(keys) + cols - 1) // cols
sh = Image.new('RGBA', (cols * cw + 10, rows * ch + 10), (30, 31, 38, 255))
d = ImageDraw.Draw(sh)
for i, k in enumerate(keys):
    x0, y0 = 10 + (i % cols) * cw, 10 + (i // cols) * ch
    d.text((x0, y0), k, fill=(255, 220, 90, 255), font=F)
    p = os.path.join(HERE, 'staging', k + '_Bust.png')
    bg = Image.new('RGBA', (128, 128), (52, 54, 64, 255))
    if os.path.exists(p):
        bg.alpha_composite(Image.open(p).convert('RGBA'))
    sh.alpha_composite(bg.resize((256, 256), Image.NEAREST), (x0, y0 + 22))
    try:
        for j, row in enumerate((0, 1)):
            f = frame(k, row).crop((8, 4, 58, 64))
            sh.alpha_composite(f.resize((200, 240), Image.NEAREST), (x0 + 262 + j * 200, y0 + 30))
    except FileNotFoundError:
        d.text((x0 + 270, y0 + 100), 'brak arkusza', fill=(255, 90, 90, 255), font=F)
os.makedirs(OUT, exist_ok=True)
p = os.path.join(OUT, 'lineup_%s.png' % n)
sh.convert('RGB').save(p)
print('ok', p)
