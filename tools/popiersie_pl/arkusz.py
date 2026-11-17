# Contact sheet: python tools/popiersie_pl/arkusz.py out.png scale file1.png [file2.png ...] - each image on a dark tile with its name
import os
import sys
from PIL import Image, ImageDraw

out, sc = sys.argv[1], int(sys.argv[2])
files = sys.argv[3:]
cols = min(6, len(files))
rows = (len(files) + cols - 1) // cols
W = 128 * sc
sheet = Image.new('RGBA', (cols * (W + 8) + 8, rows * (W + 24) + 8), (24, 24, 28, 255))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGBA')
    bg = Image.new('RGBA', im.size, (52, 54, 62, 255))
    bg.alpha_composite(im)
    bg = bg.resize((im.width * sc * 128 // im.width, im.height * sc * 128 // im.width), Image.NEAREST)
    x, y = 8 + (i % cols) * (W + 8), 8 + (i // cols) * (W + 24)
    sheet.alpha_composite(bg, (x, y + 16))
    d.text((x, y + 2), os.path.splitext(os.path.basename(f))[0], fill=(255, 220, 90, 255))
sheet.convert('RGB').save(out)
print('ok', out)
