# grid.py NAME_OR_PATH out.png [x0 y0 x1 y1] [zoom] - a bust (or a region of it) enlarged with a labelled 10/50 px grid, to read
# coordinates for the masks and polygons of the make_<key>.py scripts.
import os
import sys
from PIL import Image, ImageDraw
from bustlib import PICS

src = sys.argv[1]
p = src if os.path.isabs(src) or src.endswith('.png') else os.path.join(PICS, src + '.png')
im = Image.open(p).convert('RGBA')
box = tuple(int(v) for v in sys.argv[3:7]) if len(sys.argv) >= 7 else (0, 0, im.width, im.height)
z = int(sys.argv[7]) if len(sys.argv) >= 8 else 2
bg = Image.new('RGBA', im.size, (96, 98, 110, 255))
bg.alpha_composite(im)
c = bg.crop(box).resize(((box[2] - box[0]) * z, (box[3] - box[1]) * z), Image.NEAREST)
d = ImageDraw.Draw(c)
for x in range(box[0] - box[0] % 10, box[2] + 1, 10):
    X = (x - box[0]) * z
    big = x % 50 == 0
    d.line([(X, 0), (X, c.height)], fill=(255, 255, 0, 150) if big else (0, 255, 255, 50), width=1)
    if big:
        d.text((X + 2, 2), str(x), fill=(255, 255, 0, 255))
for y in range(box[1] - box[1] % 10, box[3] + 1, 10):
    Y = (y - box[1]) * z
    big = y % 50 == 0
    d.line([(0, Y), (c.width, Y)], fill=(255, 255, 0, 150) if big else (0, 255, 255, 50), width=1)
    if big:
        d.text((2, Y + 2), str(y), fill=(255, 255, 0, 255))
c.save(sys.argv[2])
print('ok', sys.argv[2], c.size)
