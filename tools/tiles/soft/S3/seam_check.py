"""Seam check for an overlay block: draw a random grid with MZ's table (Winlu grass below) and measure
the jump in alpha / colour across every quarter boundary INSIDE the patches vs the jump between
neighbouring pixels in general. Compares our block with Winlu's own block of the same shape.
  python seam_check.py <our_block.png> <winlu kind> <out.png>"""
import os, random, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "..", ".."))
import wang_to_a2_a as W
from refs import block as wblock

def check(block, base, table, seed=4):
    rnd = random.Random(seed)
    Wd, H = 24, 16
    grid = [[rnd.random() < 0.62 for _ in range(Wd)] for _ in range(H)]
    ov = W.render_mz(grid, block, Image.new("RGBA", (48, 48)), table)   # overlay only (alpha kept)
    a = np.asarray(ov).astype(float)
    al = a[..., 3]
    jumps_q, jumps_all = [], []
    for x in range(24, Wd * 48, 24):          # vertical quarter boundaries
        both = (al[:, x - 1] > 0) & (al[:, x] > 0)
        jumps_q.append(np.abs(al[both, x - 1] - al[both, x]))
    for x in list(range(12, Wd * 48, 24)):    # same count of ordinary columns (mid-quarter)
        both = (al[:, x - 1] > 0) & (al[:, x] > 0)
        jumps_all.append(np.abs(al[both, x - 1] - al[both, x]))
    jq, ja = np.concatenate(jumps_q), np.concatenate(jumps_all)
    full = W.render_mz(grid, block, base, table)
    return jq.mean(), ja.mean(), (jq > 40).mean(), full

if __name__ == "__main__":
    ours, kind, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    table = W.mz_table()
    base = wblock(16).crop((24, 72, 72, 120)).convert("RGBA")
    rows = []
    for name, b in (("winlu", wblock(kind).convert("RGBA")), ("ours", Image.open(ours).convert("RGBA"))):
        q, n, big, full = check(b, base, table)
        rows.append(full)
        print("%-6s alpha jump across quarter edges %.1f (ordinary columns %.1f), jumps > 40: %.3f" % (name, q, n, big))
    im = Image.new("RGBA", (rows[0].width, rows[0].height * 2 + 8), (255, 0, 255, 255))
    im.paste(rows[0], (0, 0)); im.paste(rows[1], (0, rows[0].height + 8))
    im.save(out)
