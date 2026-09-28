"""Contact sheet of forest-floor variants: 2x2 tiles at x4 over a 1x2 strip; last row = overlay over Winlu grass."""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_s2 import *
A2s = load(A2)
variants = json.loads(sys.argv[2])
cols = []
for P in variants:
    t, _ = forest_texture(A2s, P=P)
    big = zoom(np.tile(t, (2, 2, 1)), 4)
    small = zoom(np.tile(t, (2, 4, 1)), 2)
    c = np.concatenate([big, np.ones((8, 384, 3)), small[:, :384]], 0)
    cols += [c, np.ones((c.shape[0], 8, 3))]
img = np.concatenate(cols[:-1], 1)
save(np.concatenate([img, np.ones_like(img[..., :1])], -1), sys.argv[1])
