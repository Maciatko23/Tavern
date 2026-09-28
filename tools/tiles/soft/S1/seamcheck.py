"""Seam check of the S1 overlays: MZ-drawn test map (all 256 neighbourhoods + random area); a seam between two
pieces shows as an alpha jump at a quarter border much bigger than the jumps next to it (2nd difference)."""
import numpy as np
from PIL import Image
import build_s1 as B, a2soft
from common import WORK
B.load_cfg()
res = {}
for n in ("mud", "forest"):
    tex = np.asarray(Image.open(WORK + "/tex_%s.png" % n).convert("RGB"))
    f = a2soft.SoftField(**B.FIELD[n])
    blk = a2soft.build_overlay(f, tex, **B.DRAW[n])
    img = np.asarray(a2soft.W.render_mz(a2soft.test_grid(), blk, Image.new("RGBA", (48, 48)), a2soft.W.mz_table())).astype(float)
    out = {}
    for axis in (1, 0):
        a = img[..., 3] if axis == 1 else img[..., 3].T
        d = a[:, 1:] - a[:, :-1]
        cols = np.arange(d.shape[1])
        b = cols[(cols % 24) == 23]; b = b[(b > 1) & (b < d.shape[1] - 2)]
        m = cols[(cols % 24) == 11]; m = m[(m > 1) & (m < d.shape[1] - 2)]
        eb = np.abs(d[:, b] - 0.5 * (d[:, b - 1] + d[:, b + 1]))
        em = np.abs(d[:, m] - 0.5 * (d[:, m - 1] + d[:, m + 1]))
        out["xy"[1 - axis]] = (float(eb.max()), float(np.percentile(eb, 99.9)), float(em.max()), float(np.percentile(em, 99.9)))
    res[n] = out
    print(n, " ".join("%s: border max %.0f p99.9 %.1f | mid max %.0f p99.9 %.1f" % (k, *v) for k, v in out.items()), a2soft.continuity(f, tex, **B.DRAW[n]))
