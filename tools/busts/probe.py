# probe.py NAME x,y x,y ... -> rgb / hsv / luma at the points (to pick masks)
import sys
from kit import *
b = Bust(sys.argv[1])
hd, s, v = hsv_of(b.src)
L = luma(b.src)
for a in sys.argv[2:]:
    x, y = (int(t) for t in a.split(','))
    r, g, bb, al = (b.src[y, x] * 255).round().astype(int)
    print('%3d,%3d rgb(%3d,%3d,%3d) a%3d  h%5.1f s%.2f v%.2f L%.2f' % (x, y, r, g, bb, al, hd[y, x], s[y, x], v[y, x], L[y, x]))
