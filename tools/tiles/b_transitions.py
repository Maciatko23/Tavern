"""Method B, step 2: our own grass -> dirt transition, rendered as a 16-tile corner set and converted to MZ A2.

The edge is defined in CELL space, per dirt cell and its 8 neighbours, so MZ can show it exactly:
  * the dirt keeps a margin w(x, y) from every non-dirt neighbour cell (w = M + A * noise, the noise is
    periodic over one 48 px cell, so every piece MZ reuses lines up with its neighbours);
  * convex corners are rounded (radius R), concave (inner) corners are a quarter circle of radius w;
  * the first dirt pixels under the grass edge are 1-2 ramp steps darker (the grass casts a thin shadow);
  * a few single grass blades (1-3 px) reach from the edge over the earth.
Grass pixels inside a dirt cell show the grass tile at the same place, so they continue the neighbouring
grass cells seamlessly (baked, for k17 on layer 0) - or are transparent (overlay, for k39 on layer 1).

  python b_transitions.py <grass48.png> <dirt48.png> <outdir> [--winlu A2.png --sheet out_A2.png]
"""
import math
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wang_to_a2_b as W2A          # noqa: E402
from b_base_tiles import RAMPS      # noqa: E402

S = 48
P = {
    "M": 6.5,          # mean grass margin inside a dirt cell (px)
    "A": 3.0,          # how far the edge wanders (+-px)
    "R": 14.0,         # rounding of convex corners (px); M + A + R must stay <= 24 (one quarter)
    "rim": [2, 1],     # ramp steps darker for the 1st and 2nd dirt pixel under the grass edge
    "blade_p": 0.34,   # share of edge columns/rows that get a grass blade
    "corner_p": 1.7,   # norm of the convex-corner rounding (2 = circle, lower = rounder-looking cut)
    "inner_p": 0.75,   # norm of the inner-corner notch (2 = circle; 1 = straight cut - smoother diagonals, rounder holes)
    "seed": 11,
}


def _hash(i, salt):
    """Deterministic 0..1 from an integer - periodic use only (i in 0..47)."""
    h = (i * 374761393 + salt * 668265263) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0


def make_noise(seed):
    """Smooth noise over one cell, periodic in x and y with period 48, roughly in [-1, 1]."""
    rnd = np.random.RandomState(seed)
    waves = []
    for (fx, fy, amp) in ((1, 2, 0.5), (2, -1, 0.4), (3, 1, 0.25), (1, -3, 0.22), (4, 2, 0.1)):
        waves.append((fx, fy, amp, rnd.uniform(0, 2 * math.pi)))
    ys, xs = np.mgrid[0:S, 0:S] + 0.5
    n = np.zeros((S, S))
    for fx, fy, amp, ph in waves:
        n += amp * np.sin(2 * math.pi * (fx * xs + fy * ys) / S + ph)
    return n / np.abs(n).max()


def sdf_cell(nb, noise, p=P):
    """Signed distance field of the GRASS inside a dirt cell (>0 grass, <0 dirt; value = px from the edge),
    and the blade axis per pixel ('v' blade runs up/down, 'h' left/right, None in the body)."""
    sdf = np.full((S, S), -99.0)
    axis = np.full((S, S), None, dtype=object)
    M, A, R = p["M"], p["A"], p["R"]
    for y in range(S):
        for x in range(S):
            px, py = int(x >= 24), int(y >= 24)
            pos = px + 2 * py
            h, v, d = W2A.quarter_neighbours(nb, pos)
            case = W2A.quarter_case(h, v, d)
            u = x + 0.5 if px == 0 else S - (x + 0.5)      # distance to the side cell edge
            vv = y + 0.5 if py == 0 else S - (y + 0.5)     # distance to the vertical cell edge
            w = M + A * noise[y, x]
            if case == "body":
                continue
            if case == "inner":
                ip = p.get("inner_p", 2.0)     # 2 = round notch; 1 = cut straight across (fills the dirt's inside corner)
                s = w - (u ** ip + vv ** ip) ** (1 / ip)
                ax = "v" if vv < u else "h"
            elif case == "vedge":
                s = w - u
                ax = "h"
            elif case == "hedge":
                s = w - vv
                ax = "v"
            else:
                qx, qy = w + R - u, w + R - vv
                pn = p.get("corner_p", 2.0)
                s = (max(qx, 0) ** pn + max(qy, 0) ** pn) ** (1 / pn) + min(max(qx, qy), 0) - R
                ax = "v" if vv < u else "h"
            sdf[y, x] = s
            axis[y, x] = ax
    return sdf, axis


def ramp_index(ramp):
    return {tuple(c): i for i, c in enumerate(ramp)}


def render_cell(nb, grass, dirt, noise, overlay=False, p=P):
    """RGBA 48x48 of one dirt cell with neighbours nb (dict u d l r ul ur dl dr -> is dirt)."""
    g = np.asarray(grass.convert("RGBA")).copy()
    dd = np.asarray(dirt.convert("RGBA")).copy()
    out = dd.copy()
    sdf, axis = sdf_cell(nb, noise, p)
    dr = RAMPS["dirt"]
    gr = RAMPS["grass"]
    di = ramp_index(dr)
    for y in range(S):
        for x in range(S):
            s = sdf[y, x]
            if s > 0:
                out[y, x] = (0, 0, 0, 0) if overlay else g[y, x]
                continue
            depth = -s        # how far into the dirt
            if depth <= 2.0 and axis[y, x] is not None:
                # a grass blade?  keyed by the coordinate along the edge (periodic -> consistent pieces)
                root = x if axis[y, x] == "v" else y
                salt = 1 if axis[y, x] == "v" else 2
                if _hash(root, p["seed"] * 7 + salt) < p["blade_p"]:
                    length = 1 + int(_hash(root, p["seed"] * 7 + salt + 10) * 2.99)
                    if depth <= length:
                        tip = depth > length - 1
                        out[y, x] = (*(gr[3] if tip else gr[2]), 255)
                        continue
                # the thin shadow under the grass
                step = p["rim"][0] if depth <= 1.0 else p["rim"][1]
                c = tuple(int(v) for v in dd[y, x][:3])
                i = di.get(c, 2)
                out[y, x] = (*dr[max(0, i - step)], 255)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def other_cell(grass, overlay):
    return Image.new("RGBA", (S, S)) if overlay else grass.convert("RGBA").copy()


def corner_set(grass, dirt, overlay=False, p=P):
    """{(tl, tr, bl, br): 48x48} - the vertex-centred corner tiles of the transition (1 = dirt)."""
    noise = make_noise(p["seed"])
    cache = {}

    def cell(key):
        if key not in cache:
            nb = {k: True for k in ("u", "d", "l", "r", "ul", "ur", "dl", "dr")}
            nb.update(dict(key))
            cache[key] = render_cell(nb, grass, dirt, noise, overlay, p)
        return cache[key]
    wang = {}
    q = S // 2
    for code in [(a, b, c, d) for a in (0, 1) for b in (0, 1) for c in (0, 1) for d in (0, 1)]:
        tl, tr, bl, br = code
        tile = Image.new("RGBA", (S, S))
        # the cell at the tile's top-left corner shows its bottom-right quarter; its right / down / down-right
        # neighbours are the other three corners of this tile
        parts = [
            (tl, (("r", tr), ("d", bl), ("dr", br)), (q, q), (0, 0)),
            (tr, (("l", tl), ("d", br), ("dl", bl)), (0, q), (q, 0)),
            (bl, (("r", br), ("u", tl), ("ur", tr)), (q, 0), (0, q)),
            (br, (("l", bl), ("u", tr), ("ul", tl)), (0, 0), (q, q)),
        ]
        for val, nbs, (sx, sy), (dx, dy) in parts:
            src = cell(tuple((k, bool(v)) for k, v in nbs)) if val else other_cell(grass, overlay)
            tile.paste(src.crop((sx, sy, sx + q, sy + q)), (dx, dy))
        wang[code] = tile
    return wang


def plain_block(tile):
    """A2 block that shows `tile` in every shape (the tile repeated from the block's origin)."""
    block = Image.new("RGBA", (2 * S, 3 * S))
    for j in range(3):
        for i in range(2):
            block.paste(tile, (i * S, j * S))
    return block


def put_block(sheet, kind, block):
    k = kind - 16
    x, y = (k % 8) * 96, (k // 8) * 144
    sheet.paste(Image.new("RGBA", (96, 144)), (x, y))
    sheet.paste(block, (x, y))


def farming_kind(block):
    """What Farming.js's colour test says about this block (it samples the island's top-left cell)."""
    a = np.asarray(block.convert("RGBA")).astype(float)[48 + 10:48 + 38, 10:38].reshape(-1, 4)
    op = a[a[:, 3] >= 200]
    if len(op) < len(a) * 0.05:
        return "null"
    if len(op) < len(a) * 0.35:
        return "sparse"
    r, g, b = op[:, 0].mean(), op[:, 1].mean(), op[:, 2].mean()
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if mx == r:
        h = ((g - b) / d) % 6
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
    s, v = d / mx, mx / 255
    grass = 110 <= h <= 150 and s >= 0.30 and v >= 0.44
    earth = 38 <= h <= 98 and 0.22 <= s <= 0.42 and 0.42 <= v <= 0.62
    return "%s (h %d s %.2f v %.2f)" % ("grass" if grass else "earth" if earth else "NOT SOIL", h, s, v)


def main():
    args = sys.argv[1:]
    grass = Image.open(args[0]).convert("RGBA")
    dirt = Image.open(args[1]).convert("RGBA")
    outdir = args[2]
    os.makedirs(outdir, exist_ok=True)
    baked = corner_set(grass, dirt, overlay=False)
    over = corner_set(grass, dirt, overlay=True)
    W2A.save_wang_sheet(baked, os.path.join(outdir, "wang_grass_dirt_baked.png"))
    W2A.save_wang_sheet(over, os.path.join(outdir, "wang_grass_dirt_overlay.png"))
    blocks = {
        16: plain_block(grass),
        24: plain_block(dirt),
        17: W2A.wang_to_a2(baked),
        39: W2A.wang_to_a2(over),
    }
    for k, b in blocks.items():
        b.save(os.path.join(outdir, "k%d.png" % k))
        print("k%d" % k, "Farming sees:", farming_kind(b))
    print("corner set -> A2 exact (lost pixels on random maps):", W2A.check(baked, blocks[17]), W2A.check(over, blocks[39]))
    if "--winlu" in args:
        sheet = Image.open(args[args.index("--winlu") + 1]).convert("RGBA")
        for k, b in blocks.items():
            put_block(sheet, k, b)
        out = args[args.index("--sheet") + 1]
        sheet.save(out)
        print("sheet", out, sheet.size)


if __name__ == "__main__":
    main()
