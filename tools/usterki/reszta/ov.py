# ov.py MAP W H out [scale] [x0,y0,x1,y1] : mozaika ekranow z po/<MAP> w mniejszej skali
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mozaika import mosaic
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
mid, W, H, out = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
sc = float(sys.argv[5]) if len(sys.argv) > 5 else 0.4
box = tuple(map(int, sys.argv[6].split(','))) if len(sys.argv) > 6 else None
src = os.environ.get('SRC', os.path.join(HERE, 'po'))
mosaic(os.path.join(src, str(mid)), W, H, out + '.tmp.png', box=box)
im = Image.open(out + '.tmp.png'); im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS).save(out); os.remove(out + '.tmp.png'); print(im.size)
