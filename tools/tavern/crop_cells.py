# python crop_cells.py <full render.png> <out.png> x0 y0 x1 y1 [scale]  - a part of a 1:1 map render (cells, inclusive)
import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = [int(v) for v in sys.argv[3:7]]
k = float(sys.argv[7]) if len(sys.argv) > 7 else 1.0
im = Image.open(src).crop((x0 * 48, y0 * 48, (x1 + 1) * 48, (y1 + 1) * 48))
if k != 1.0: im = im.resize((int(im.size[0] * k), int(im.size[1] * k)), Image.LANCZOS if k < 1 else Image.NEAREST)
im.save(out); print(out, im.size)
