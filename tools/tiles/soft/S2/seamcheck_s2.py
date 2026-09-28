"""Seam check: for each new block, the mean colour jump across the 48-px wrap (where MZ joins quarters of
different cells) vs the mean jump between ordinary neighbouring pixels. Equal = no visible seam."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
sheet = load(sys.argv[1])
for k in (24, 39, 46, 16):
    b = block(sheet, k)
    t = b[72:120, 24:72]            # the body quarters as MZ puts them together = rolled by 24
    body = np.roll(np.roll(t, 24, 0), 24, 1)[..., :3]
    inner = np.abs(np.diff(body, axis=1)).mean() * 255
    wrap = np.abs(body[:, 0] - body[:, 47]).mean() * 255
    mid = np.abs(body[:, 23] - body[:, 24]).mean() * 255
    print("k%d body: neighbour %.2f  wrap(cell join) %.2f  quarter join %.2f" % (k, inner, wrap, mid))
