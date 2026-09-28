# Checks on Winlu's A2: alpha in the body quarters of the overlays, and whether the grounds are 48-periodic.
import sys
sys.path.insert(0, r"C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna\tools\tiles\soft\S2")
from common import *
s = load(A2)
for k in (39, 46, 21):
    b = block(s, k)
    body = b[72:120, 24:72, 3]
    ic = b[0:48, 48:96, 3]
    print(k, "body alpha min/mean/max", body.min().round(3), body.mean().round(3), body.max().round(3), "| inner-corner alpha min/mean", ic.min().round(3), ic.mean().round(3))
# periodicity: compare jump across the tile wrap vs typical neighbour difference
for k in (16, 24, 27, 17):
    b = block(s, k)[..., :3]
    t = b[:48, :48]
    inner = np.abs(np.diff(t, axis=1)).mean()
    wrap = np.abs(t[:, 0] - t[:, 47]).mean()
    # island body vs thumbnail: is the body the same texture?
    body = b[72:120, 24:72]
    print(k, "neighbour diff %.4f  wrap diff %.4f" % (inner, wrap), " thumb==island-centre-shift?", np.abs(np.roll(np.roll(t, 24, 0), 24, 1) - body).mean().round(4))
