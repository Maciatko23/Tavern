"""Numbers about the Winlu A2 blocks: colours per 48x48 tile, gradient sharpness, alpha profile of the overlays."""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from refs import block
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import wang_to_a2_a as W

def colours(a):
    a = a.reshape(-1, a.shape[-1])
    return len(np.unique(a, axis=0))

def grad(rgb):
    g = rgb.astype(float).mean(axis=2)
    dx = np.abs(np.diff(g, axis=1)); dy = np.abs(np.diff(g, axis=0))
    return dx.mean() + dy.mean(), (np.concatenate([dx.ravel(), dy.ravel()]) > 12).mean()

for k in (16, 17, 21, 24, 27, 39, 46):
    b = np.asarray(block(k))
    body = b[48:144, 0:96]                   # the 2x2 island
    t48 = b[72:120, 24:72]                   # centre 48x48 of the island (body quarters)
    al = b[..., 3]
    same = []
    for qi in range(4):
        slots = [s for s, (q, t) in W.SLOTS.items() if q == qi]
        tiles = [b[sy*24:sy*24+24, sx*24:sx*24+24] for sx, sy in slots]
        same.append(sum(np.array_equal(tiles[0], t) for t in tiles[1:]))
    semi = ((al > 0) & (al < 255)).sum()
    g, frac = grad(t48[..., :3])
    print("k%d colours(48 body)=%d  colours(block)=%d  meanGrad=%.2f  sharp>12=%.3f  alpha semi px=%d  zero=%d  same-slot-copies=%s" % (
        k, colours(t48[..., :3]), colours(b), g, frac, semi, (al == 0).sum(), same))
    if k in (39, 46):
        # alpha along a horizontal line through the island middle, and colour of semi vs opaque px
        row = al[96, :]
        print("   alpha row y=96:", row.tolist())
        col = al[:, 48]
        print("   alpha col x=48:", col.tolist())
        op = b[al == 255][:, :3].astype(float); se = b[(al > 30) & (al < 200)][:, :3].astype(float)
        print("   opaque mean rgb", op.mean(0).round(1), " semi mean rgb", se.mean(0).round(1) if len(se) else None)
