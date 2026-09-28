"""Organic-edged MZ A2 floor autotile from two plain 48x48 textures (e.g. PixelLab dirt + grass).

Why: PixelLab's corner sets (create_tiles_pro tile_feature=tileset) always draw straight,
rectangle-like borders, so a map drawn with them looks blocky. Here the border's SHAPE is made by
a field instead, and the pixels stay the textures' own (plus two darker shades for the rim).

Geometry = the 'half' dual grid of wang_to_a2_a.py: every quarter of a cell has 4 corner points
(cell vertex, two edge midpoints, cell centre); a point is the terrain when all cells touching it
are. Per pixel:   F = bilinear(corners as +1/-1) + bias + A * N(X, Y) - blades(X, Y)
with N a smooth noise and blades a sparse pattern, both functions of the pixel's place in its cell
(X, Y = 0..47, periodic). F depends only on the quarter's corners and its place, i.e. on the slot,
so MZ's quarters always join; |bias| + |A*N| < 1 keeps all-grass quarters grass and all-dirt quarters dirt,
so the result equals the same field drawn over the whole map (--test checks this with MZ's table).
  F > 0 : terrain (the texture at that place), 0 < F < rim: the darker rim
  F < 0 : the other ground (transparent for an overlay, or the 'under' texture for an L0 block)
          -shade < F < 0: the other ground darkened a little (the grass edge's own shadow)

usage:
  python organic_a2.py --tex dirt48.png --under grass48.png --out k17.png   (L0 block)
  python organic_a2.py --tex dirt48.png --shade-under grass48.png --out k39.png --overlay
  python organic_a2.py --tex dirt48.png --under grass48.png --test OUTDIR
  options: --amp 0.55 --scale 10 --seed 3 --rim 0.16 --rim2 0.34 --blades 0.35 --bias 0 --blade-density 0.09
"""
import argparse, math, os, random, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wang_to_a2_a as W   # SLOTS, corners_for, piece_type, shape_of, mz_table, render_mz, count_diff

Q = 24


def periodic_noise(size, scale, seed):
    """Smooth value noise on a size x size torus, range about -1..1."""
    rnd = random.Random(seed)
    n = max(2, round(size / scale))
    grid = [[rnd.uniform(-1, 1) for _ in range(n)] for _ in range(n)]
    out = np.zeros((size, size))
    for y in range(size):
        for x in range(size):
            gx, gy = x / size * n, y / size * n
            x0, y0 = int(gx) % n, int(gy) % n
            x1, y1 = (x0 + 1) % n, (y0 + 1) % n
            fx, fy = gx - int(gx), gy - int(gy)
            sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
            a = grid[y0][x0] * (1 - sx) + grid[y0][x1] * sx
            b = grid[y1][x0] * (1 - sx) + grid[y1][x1] * sx
            out[y, x] = a * (1 - sy) + b * sy
    return out / max(1e-6, np.abs(out).max())


def blade_pattern(size, seed, density=0.09):
    """Sparse short grass blades (1 px wide, 2-4 px long, mostly upright) on a torus: 0..1."""
    rnd = random.Random(seed * 7 + 1)
    out = np.zeros((size, size))
    for _ in range(int(size * size * density / 3)):
        x, y = rnd.randrange(size), rnd.randrange(size)
        ln = rnd.choice((2, 3, 3, 4))
        dx = rnd.choice((0, 0, 0, 1, -1))
        for i in range(ln):
            out[(y - i) % size, (x + (dx if i >= ln - 1 else 0)) % size] = 1.0 - i / (ln + 1)
    return out


class Field:
    def __init__(self, amp=0.55, scale=10, seed=3, blades=0.35, bias=0.0, blade_density=0.09):
        self.N = periodic_noise(48, scale, seed)
        self.B = blade_pattern(48, seed, blade_density)
        self.amp, self.blades, self.bias = amp, blades, bias
        # the field must stay negative in all-grass quarters and positive in all-dirt ones
        assert amp + abs(bias) < 0.97, "amp + |bias| must stay below 1"

    def quarter(self, corners, qi):
        """F over one 24x24 quarter at place qi of a cell, corners (nw, ne, sw, se) True = terrain."""
        s = [1.0 if c else -1.0 for c in corners]
        u = (np.arange(Q) + 0.5) / Q
        fu, fv = np.meshgrid(u, u)
        b = s[0] * (1 - fu) * (1 - fv) + s[1] * fu * (1 - fv) + s[2] * (1 - fu) * fv + s[3] * fu * fv
        ox, oy = (qi % 2) * Q, (qi // 2) * Q
        n = self.N[oy:oy + Q, ox:ox + Q]
        bl = self.B[oy:oy + Q, ox:ox + Q]
        f = b + self.bias + self.amp * n   # bias > 0 moves the border out towards the other ground
        # blades only near the border (|f| small), pushing grass into the terrain
        near = np.clip(1 - np.abs(f) / 0.45, 0, 1)
        f = f - self.blades * bl * near
        mixed = len(set(corners)) > 1
        return f if mixed else np.full((Q, Q), 1.0 if corners[0] else -1.0)


def shade(rgb, k):
    return tuple(max(0, min(255, int(round(c * k)))) for c in rgb)


def draw_quarter(field, corners, qi, tex, under, overlay, shade_under, rim=0.16, rim2=0.34, shadow=0.18):
    f = field.quarter(corners, qi)
    ox, oy = (qi % 2) * Q, (qi // 2) * Q
    t = np.asarray(tex.convert("RGBA"))[oy:oy + Q, ox:ox + Q]
    g = np.asarray((under or shade_under).convert("RGBA"))[oy:oy + Q, ox:ox + Q] if (under or shade_under) else None
    out = np.zeros((Q, Q, 4), dtype=np.uint8)
    for y in range(Q):
        for x in range(Q):
            v = f[y, x]
            if v > 0:
                px = tuple(int(c) for c in t[y, x, :3])
                if v < rim:
                    px = shade(px, 0.72)
                elif v < rim2:
                    px = shade(px, 0.86)
                out[y, x] = (*px, 255)
            elif g is not None and v > -shadow:
                out[y, x] = (*shade(tuple(int(c) for c in g[y, x, :3]), 0.8), 255)
            elif under is not None:
                out[y, x] = g[y, x]
            # else transparent (overlay)
    return Image.fromarray(out)


def build(field, tex, under=None, shade_under=None, **kw):
    overlay = under is None
    block = Image.new("RGBA", (96, 144))
    for (sx, sy), (qi, t) in W.SLOTS.items():
        c = W.corners_for(qi, t)
        block.paste(draw_quarter(field, c, qi, tex, under, overlay, shade_under, **kw), (sx * Q, sy * Q))
    block.paste(W.render_isolated(block), (0, 0))
    return block


def render_global(grid, field, tex, under, shade_under, **kw):
    """The same field drawn over the whole map at once (fine dual grid points), no MZ table."""
    H, Wd = len(grid), len(grid[0])
    def s(xx, yy):
        return True if not (0 <= xx < Wd and 0 <= yy < H) else grid[yy][xx]
    def point(px, py):
        cells = [(cx, cy) for cx in {(px - 1) // 2, px // 2} for cy in {(py - 1) // 2, py // 2}]
        return all(s(cx, cy) for cx, cy in cells)
    out = Image.new("RGBA", (Wd * 48, H * 48))
    for y in range(H):
        for x in range(Wd):
            out.paste(under or Image.new("RGBA", (48, 48)), (x * 48, y * 48))
    for qy in range(2 * H):
        for qx in range(2 * Wd):
            c = (point(qx, qy), point(qx + 1, qy), point(qx, qy + 1), point(qx + 1, qy + 1))
            if not any(c):
                continue
            qi = (qx % 2) + 2 * (qy % 2)
            p = draw_quarter(field, c, qi, tex, under, under is None, shade_under, **kw)
            out.alpha_composite(p, (qx * Q, qy * Q))
    return out


def test(field, tex, under, shade_under, outdir, **kw):
    table = W.mz_table()
    block = build(field, tex, under, shade_under, **kw)
    base = under or Image.new("RGBA", (48, 48), (0, 0, 0, 255))
    rnd = random.Random(11)
    Wd, H = 64, 76
    grid = [[False] * Wd for _ in range(H)]
    for n in range(256):
        px0, py0 = (n % 16) * 4, (n // 16) * 4
        grid[py0 + 1][px0 + 1] = True
        for bit, (dx, dy) in enumerate([(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]):
            grid[py0 + 1 + dy][px0 + 1 + dx] = bool(n >> bit & 1)
    for y in range(64, H):
        for x in range(Wd):
            grid[y][x] = rnd.random() < 0.6 or (68 <= y < 72 and 4 <= x < 10)
    mz = W.render_mz(grid, block, base, table)
    ref = render_global(grid, field, tex, under, shade_under, **kw)
    if under is None:
        full = Image.new("RGBA", ref.size)
        for y in range(H):
            for x in range(Wd):
                full.paste(base, (x * 48, y * 48))
        full.alpha_composite(ref)
        ref = full
    d = W.count_diff(mz, ref)
    print("MZ table vs the field drawn over the whole map: %d pixels differ -> %s" % (d, "PASS" if d == 0 else "FAIL"))
    if outdir:
        os.makedirs(outdir, exist_ok=True)
        mz.crop((0, 64 * 48 - 96, 20 * 48, H * 48)).save(os.path.join(outdir, "organic_test_mz.png"))
        block.save(os.path.join(outdir, "organic_test_block.png"))
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tex", required=True); ap.add_argument("--under"); ap.add_argument("--shade-under")
    ap.add_argument("--out"); ap.add_argument("--overlay", action="store_true"); ap.add_argument("--test")
    ap.add_argument("--amp", type=float, default=0.55); ap.add_argument("--scale", type=float, default=10)
    ap.add_argument("--seed", type=int, default=3); ap.add_argument("--blades", type=float, default=0.35)
    ap.add_argument("--rim", type=float, default=0.16); ap.add_argument("--rim2", type=float, default=0.34)
    ap.add_argument("--bias", type=float, default=0.0); ap.add_argument("--blade-density", type=float, default=0.09)
    a = ap.parse_args()
    field = Field(a.amp, a.scale, a.seed, a.blades, a.bias, a.blade_density)
    tex = Image.open(a.tex).convert("RGBA")
    under = Image.open(a.under).convert("RGBA") if a.under and not a.overlay else None
    su = Image.open(a.shade_under).convert("RGBA") if a.shade_under else None
    kw = dict(rim=a.rim, rim2=a.rim2)
    if a.test:
        sys.exit(0 if test(field, tex, under, su, a.test, **kw) == 0 else 1)
    build(field, tex, under, su, **kw).save(a.out)


if __name__ == "__main__":
    main()
