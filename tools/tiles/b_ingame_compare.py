"""In-game check of the A2 blocks: a random pattern is drawn by the GAME (autotile_ingame_check.js) and by Python
(wang_to_a2_b.draw_with_block, i.e. MZ's FLOOR_AUTOTILE_TABLE); the two pictures must be identical.

  python b_ingame_compare.py make <sheet.png> <kind> <layer 0|1> <pattern.json> [seed]   -> writes the pattern + expected.png
  python b_ingame_compare.py diff <pattern.json> <game_shot.png>                         -> pixel comparison
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wang_to_a2_b as W   # noqa: E402

GRASS = 16


def block_of(sheet, kind):
    k = kind - 16
    return sheet.crop(((k % 8) * 96, (k // 8) * 144, (k % 8) * 96 + 96, (k // 8) * 144 + 144))


def make(sheet_path, kind, layer, out, seed=5, cols=24, rows=13):
    sheet = Image.open(sheet_path).convert("RGBA")
    grid = W.random_grid(cols, rows, 0.55, seed)
    for x in range(cols):                      # a grass frame, so cells outside the pattern never matter
        grid[0][x] = grid[rows - 1][x] = 0
    for y in range(rows):
        grid[y][0] = grid[y][cols - 1] = 0
    table = W.floor_table()
    kid = lambda k, s: 2048 + k * 48 + s
    l0 = [[kid(GRASS, 0) for _ in range(cols)] for _ in range(rows)]
    l1 = [[0] * cols for _ in range(rows)]
    for y in range(rows):
        for x in range(cols):
            if grid[y][x]:
                s = W.shape_of(W.neighbours(grid, x, y, edge_same=False), table)
                (l0 if layer == 0 else l1)[y][x] = kid(kind, s)
    grass = block_of(sheet, GRASS).crop((0, 0, 48, 48))
    exp = Image.new("RGBA", (cols * 48, rows * 48))
    for y in range(rows):
        for x in range(cols):
            exp.paste(grass, (x * 48, y * 48))
    exp.alpha_composite(W.draw_with_block(block_of(sheet, kind), grid))
    base = os.path.splitext(out)[0]
    exp.save(base + "_expected.png")
    json.dump({"sheet": os.path.splitext(os.path.basename(sheet_path))[0], "map": 3, "x0": 2, "y0": 2,
               "layers": {"0": l0, "1": l1}, "expected": base + "_expected.png"}, open(out, "w"))
    print("pattern", out, "terrain cells", sum(map(sum, grid)))


def diff(pattern, shot):
    p = json.load(open(pattern))
    exp = np.asarray(Image.open(p["expected"]).convert("RGB")).astype(int)
    h, w = exp.shape[:2]
    got = np.asarray(Image.open(shot).convert("RGB")).astype(int)[:h, :w]
    d = np.abs(got - exp).sum(axis=2)
    n = int((d > 0).sum())
    print("pixels compared %d, different %d (%.3f%%), max channel-sum diff %d" % (d.size, n, 100.0 * n / d.size, d.max()))
    if n:
        ys, xs = np.nonzero(d)
        print("first differences at", list(zip(xs[:10].tolist(), ys[:10].tolist())))
        Image.fromarray(((d > 0) * 255).astype(np.uint8)).save(os.path.splitext(shot)[0] + "_diffmask.png")
    return n


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "make":
        make(a[1], int(a[2]), int(a[3]), a[4], int(a[5]) if len(a) > 5 else 5)
    else:
        sys.exit(0 if diff(a[1], a[2]) == 0 else 1)
