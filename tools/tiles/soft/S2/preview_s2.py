"""Offline previews of an A2 sheet: small scenes drawn with MZ's own FLOOR_AUTOTILE_TABLE (Winlu vs new),
tiled 3x3 texture views, and x3/x4 zoom crops of the new grounds next to Winlu grass.
usage: python preview_s2.py NEW_SHEET OUTDIR [tag]"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", ".."))
from common import *
import wang_to_a2_a as W

TABLE = W.mz_table()

# scene: '.' grass k16, 'g' grass k27, 'm' overlay k39 (mud), 'f' overlay k46 (forest), 'M' ground k24
SCENE = [
    "..............",
    "..mm....ffff..",
    ".mmmm..ffffff.",
    ".mmmmm.fffff..",
    "..mmm...fff...",
    "...m......ff..",
    ".MMM....mm.ff.",
    ".MMM...mmm....",
    "..............",
]


def quarter(blk, qx, qy):
    return blk[qy * 24:qy * 24 + 24, qx * 24:qx * 24 + 24]


def draw_kind(canvas, grid, blk):
    H, Wd = len(grid), len(grid[0])
    for y in range(H):
        for x in range(Wd):
            if not grid[y][x]:
                continue
            sh = W.shape_of(grid, x, y, TABLE)
            for i in range(4):
                qx, qy = TABLE[sh][i]
                q = quarter(blk, qx, qy)
                dy, dx = y * 48 + (i // 2) * 24, x * 48 + (i % 2) * 24
                canvas[dy:dy + 24, dx:dx + 24] = over(canvas[dy:dy + 24, dx:dx + 24], q)


def scene(sheet):
    H, Wd = len(SCENE), len(SCENE[0])
    can = np.zeros((H * 48, Wd * 48, 4), np.float32)
    grass = block(sheet, 16)
    for ch, k in (("g", 27),):
        pass
    for y in range(H):
        for x in range(Wd):
            can[y * 48:y * 48 + 48, x * 48:x * 48 + 48] = grass[:48, :48] if True else 0
    # layer 0 grounds (k16 everywhere is shape 0 = body quarters, same texture), then k24
    draw_kind(can, [[c == "." or c in "mfg" for c in r] for r in SCENE], block(sheet, 16))
    draw_kind(can, [[c == "M" for c in r] for r in SCENE], block(sheet, 24))
    # layer 1 overlays
    draw_kind(can, [[c == "m" for c in r] for r in SCENE], block(sheet, 39))
    draw_kind(can, [[c == "f" for c in r] for r in SCENE], block(sheet, 46))
    return can


def tiled(tex48, n=3):
    return np.tile(tex48, (n, n, 1))


def main():
    new_path, outdir = sys.argv[1], sys.argv[2]
    tag = sys.argv[3] if len(sys.argv) > 3 else "S2"
    os.makedirs(outdir, exist_ok=True)
    win = load(A2)
    new = load(new_path)
    a = scene(win); b = scene(new)
    gap = np.ones((a.shape[0], 12, 4), np.float32)
    save(np.concatenate([a, gap, b], 1), os.path.join(outdir, "scene_winlu_vs_%s.png" % tag))
    save(zoom(b, 2), os.path.join(outdir, "scene_%s_x2.png" % tag))
    # zoom crops: new ground next to Winlu grass (x4): 2x2 cells around a transition
    crops = []
    for (cx, cy, name) in ((1, 1, "mud_edge"), (7, 1, "forest_edge"), (0, 5, "mudground_edge")):
        cw = b[cy * 48:(cy + 3) * 48, cx * 48:(cx + 3) * 48]
        cwi = a[cy * 48:(cy + 3) * 48, cx * 48:(cx + 3) * 48]
        save(zoom(np.concatenate([cwi, np.ones((cw.shape[0], 6, 4)), cw], 1), 4), os.path.join(outdir, "zoom4_%s_winlu_vs_%s.png" % (name, tag)))
    # textures tiled 3x3, side by side with Winlu grass/dirt (x3)
    g = tiled(win[0:48, 0:48])
    d = tiled(block(win, 24)[:48, :48])
    mb = block(new, 24)[:48, :48]
    fb = block(new, 46)[72:120, 24:72]
    fb = over(block(win, 16)[:48, :48].copy(), fb)
    mo = over(block(win, 16)[:48, :48].copy(), block(new, 39)[72:120, 24:72])
    parts = [g, d, tiled(mb), tiled(mo), tiled(fb)]
    row = []
    for p in parts:
        row += [p, np.ones((144, 6, 4), np.float32)]
    save(zoom(np.concatenate(row[:-1], 1), 3), os.path.join(outdir, "tiled3x3_grass_dirt_mud_mudov_forest_x3_%s.png" % tag))
    print("previews in", outdir)


if __name__ == "__main__":
    main()
