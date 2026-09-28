"""Soft-edged MZ A2 floor autotile blocks from one seamless 48x48 texture (S1 method, 2026-09-27).

Overlay block (layer 1 of a 'field' A2, e.g. the k39 / k46 slots): the texture everywhere, with an alpha
that fades out towards the patch's outline like Winlu's own overlays, plus a slightly darker rim.

Geometry = the 'half' dual grid of ../../wang_to_a2_a.py: each quarter of a cell has 4 corner points
(cell vertex, two edge midpoints, cell centre); a point is 'in' (+1) when all cells touching it are the
terrain, else -1.  Per pixel of a quarter:
    B = interpolation of the corners           (-1 on the patch outline's outside points, +1 deep inside):
        straight edges: linear; outer / inner corner pieces (one odd point): g = 1 - du - dv - k du dv
        (du, dv = distance to the odd point; corner_k = 0 a 45-degree chamfer, > 0 Winlu's deeper-cut outer
        corners and nearly filled inner corners, -1 = plain bilinear) - linear along the quarter's sides, so
        it meets the neighbouring pieces exactly
    n = amp * N(X, Y) + bulge * S(X, Y)        N = smooth periodic noise of the pixel's place in its cell
                                                (X, Y = 0..47), domain-warped; S = Winlu's period-48 wave along
                                                straight edges; soft-clipped (n_clip) so the ramp never folds
    F = B + n * (1 - B^2)                      (1 - B^2) pins F = -1 at the cell border -> alpha 0 where the
                                                next (other-kind) cell starts: no hard step at cell borders
    alpha = smoothstep(lo, hi, F) * body_alpha
    colour = texture(X, Y) * (1 - rim * exp(-((F - rim_at) / rim_w)^2)) + rim_tint * (...)
F depends only on the quarter's corner points and the pixel's place, so the quarters MZ puts together
always join: self_test() compares MZ's own FLOOR_AUTOTILE_TABLE drawing with the field drawn over a whole
map (slot meanings), ../S1/seamcheck.py looks for alpha creases at quarter borders (continuity).

Ground block (layer 0, e.g. k24): the texture in every slot (period 48 lines up with MZ's quarters).

usage (library): see build_s1.py
"""
import os, sys, random
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..")))   # tools/tiles
import wang_to_a2_a as W                                               # SLOTS, corners_for, render_isolated, mz_table, render_mz, count_diff
from texture import blur_wrap

Q = 24


def warped_noise(n=48, sigma=4.0, warp=4.0, warp_sigma=6.0, seed=1):
    """Smooth periodic noise on the n-torus, domain-warped (sampled at p + warp * w(p)), range about -1..1."""
    r = np.random.RandomState(seed)
    base = blur_wrap(r.randn(n, n), sigma)
    base = base / (np.abs(base).max() + 1e-9)
    wx = blur_wrap(r.randn(n, n), warp_sigma)
    wy = blur_wrap(r.randn(n, n), warp_sigma)
    wx, wy = wx / (wx.std() + 1e-9), wy / (wy.std() + 1e-9)
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
    sx, sy = (xx + warp * wx) % n, (yy + warp * wy) % n
    x0, y0 = np.floor(sx).astype(int), np.floor(sy).astype(int)
    fx, fy = sx - x0, sy - y0
    x1, y1 = (x0 + 1) % n, (y0 + 1) % n
    v = (base[y0, x0] * (1 - fx) * (1 - fy) + base[y0, x1] * fx * (1 - fy) +
         base[y1, x0] * (1 - fx) * fy + base[y1, x1] * fx * fy)
    return v / (np.abs(v).max() + 1e-9)


class SoftField:
    def __init__(self, amp=0.6, lo=-1.0, hi=0.05, sigma=4.0, warp=4.0, seed=1, detail=0.0, detail_sigma=1.2, corner_p=1.0, bulge=0.0, bulge_mid=0.7, n_clip=0.55, corner_k=None):
        self.n_clip = n_clip
        self.corner_k = corner_k
        self.corner_p = corner_p   # 1: 45-degree chamfers (Winlu's diamond corners), 2: round corners
        self.N = warped_noise(48, sigma, warp, 6.0, seed)
        if detail:
            r = np.random.RandomState(seed + 99)
            d = blur_wrap(r.randn(48, 48), detail_sigma)
            self.N = self.N + detail * d / (np.abs(d).max() + 1e-9)
        self.amp, self.lo, self.hi = amp, lo, hi
        # Winlu-like wave along straight edges: the outline bulges out in the middle of each cell's side and
        # recedes at the cell corners (s = 0 at the corners, 1 at the side middles, a function of the place
        # in the cell only, so it is the same for every piece)
        X = (np.arange(48) + 0.5) / 48
        sx = np.sin(np.pi * X)
        self.S = np.maximum(sx[None, :], sx[:, None]) - bulge_mid
        self.bulge = bulge

    round_corners = True

    def quarter(self, corners, qi):
        s = [1.0 if c else -1.0 for c in corners]
        u = (np.arange(Q) + 0.5) / Q
        fu, fv = np.meshgrid(u, u)
        b = s[0] * (1 - fu) * (1 - fv) + s[1] * fu * (1 - fv) + s[2] * (1 - fu) * fv + s[3] * fu * fv
        if self.round_corners and sum(corners) in (1, 3):
            # one corner differs (outer corner: the only 'in' point is the cell centre; inner corner: the only
            # 'out' point is the cell vertex): replace the bilinear hyperbolas by Lp-distance iso-lines around
            # that point (p=1: straight 45-degree chamfers through the edge midpoints, like Winlu's diamond
            # corners, so a staircase of cells reads as a diagonal; p=2: circles).
            # Along the quarter's sides this is still linear, i.e. the same values the neighbouring pieces have.
            outer = sum(corners) == 1
            odd = [i for i in range(4) if bool(corners[i]) == outer][0]
            cx, cy = odd % 2, odd // 2
            du, dv = np.abs(fu - cx), np.abs(fv - cy)
            if self.corner_k is not None:
                # smooth polynomial version: g = 1 - du - dv - k du dv (k = 0: the 45-degree chamfer, k = -1: bilinear,
                # k > 0: a deeper cut of outer corners and a smaller notch at inner ones, like Winlu) - no cusp anywhere
                g = np.clip(1 - du - dv - self.corner_k * du * dv, 0, 1)
            else:
                p = self.corner_p
                g = np.clip(1 - (du ** p + dv ** p) ** (1.0 / p), 0, 1)
            b = -1 + 2 * g if outer else 1 - 2 * g
        ox, oy = (qi % 2) * Q, (qi // 2) * Q
        n = self.N[oy:oy + Q, ox:ox + Q] * self.amp + self.bulge * self.S[oy:oy + Q, ox:ox + Q]
        if self.n_clip:
            # soft clip: with |n| <= 0.5, F = B + n (1 - B^2) is monotonic in B (dF/dB = 1 - 2 n B >= 0), so the
            # alpha ramp never folds into a hard step
            n = self.n_clip * np.tanh(n / self.n_clip)
        if all(c == corners[0] for c in corners):
            return np.full((Q, Q), s[0])
        return b + n * (1 - b * b)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def draw_quarter(field, corners, qi, tex, body_alpha=255, rim=0.18, rim_at=-0.35, rim_w=0.35, rim_tint=(0.0, 0.0, 0.0)):
    f = field.quarter(corners, qi)
    ox, oy = (qi % 2) * Q, (qi // 2) * Q
    t = tex[oy:oy + Q, ox:ox + Q, :3].astype(np.float64)
    a = smoothstep(field.lo, field.hi, f) * body_alpha
    k = rim * np.exp(-((f - rim_at) / rim_w) ** 2)
    col = t * (1 - k[..., None]) + np.asarray(rim_tint, dtype=np.float64) * k[..., None]
    out = np.zeros((Q, Q, 4), dtype=np.uint8)
    out[..., :3] = np.clip(col + 0.5, 0, 255).astype(np.uint8)
    out[..., 3] = np.clip(a + 0.5, 0, 255).astype(np.uint8)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out)


def build_overlay(field, tex, **kw):
    """tex: uint8 48x48x3 (periodic).  -> 96x144 RGBA block."""
    block = Image.new("RGBA", (96, 144))
    for (sx, sy), (qi, t) in W.SLOTS.items():
        c = W.corners_for(qi, t)
        block.paste(draw_quarter(field, c, qi, tex, **kw), (sx * Q, sy * Q))
    block.paste(W.render_isolated(block), (0, 0))
    return block


def build_ground(tex):
    """A plain layer-0 block: the 48-periodic texture in every slot (slot (sx, sy) is always used for
    the quarter (sx % 2, sy % 2) of a cell, so the texture lines up whatever shape MZ picks)."""
    t = Image.fromarray(tex).convert("RGBA")
    block = Image.new("RGBA", (96, 144))
    for y in range(0, 144, 48):
        for x in range(0, 96, 48):
            block.paste(t, (x, y))
    return block


def render_global(grid, field, tex, base, **kw):
    """The field drawn over a whole map at once on the fine dual grid (no MZ table) - the reference."""
    H, Wd = len(grid), len(grid[0])

    def s(xx, yy):
        return True if not (0 <= xx < Wd and 0 <= yy < H) else grid[yy][xx]

    def point(px, py):
        cells = [(cx, cy) for cx in {(px - 1) // 2, px // 2} for cy in {(py - 1) // 2, py // 2}]
        return all(s(cx, cy) for cx, cy in cells)
    out = Image.new("RGBA", (Wd * 48, H * 48))
    for y in range(H):
        for x in range(Wd):
            out.paste(base, (x * 48, y * 48))
    for qy in range(2 * H):
        for qx in range(2 * Wd):
            if not grid[qy // 2][qx // 2]:
                continue
            c = (point(qx, qy), point(qx + 1, qy), point(qx, qy + 1), point(qx + 1, qy + 1))
            qi = (qx % 2) + 2 * (qy % 2)
            out.alpha_composite(draw_quarter(field, c, qi, tex, **kw), (qx * Q, qy * Q))
    return out


def test_grid(Wd=64, H=76, seed=11):
    rnd = random.Random(seed)
    grid = [[False] * Wd for _ in range(H)]
    for n in range(256):                    # every 8-neighbourhood once
        px0, py0 = (n % 16) * 4, (n // 16) * 4
        grid[py0 + 1][px0 + 1] = True
        for bit, (dx, dy) in enumerate([(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]):
            grid[py0 + 1 + dy][px0 + 1 + dx] = bool(n >> bit & 1)
    for y in range(64, H):
        for x in range(Wd):
            grid[y][x] = rnd.random() < 0.6 or (68 <= y < 72 and 4 <= x < 10)
    return grid


def continuity(field, tex, **kw):
    """Largest alpha jump across quarter borders vs inside quarters on the test map (overlay drawn alone).
    A seam between pieces shows as a border jump much larger than the inside ones."""
    table = W.mz_table()
    block = build_overlay(field, tex, **kw)
    grid = test_grid()
    img = np.asarray(W.render_mz(grid, block, Image.new("RGBA", (48, 48)), table)).astype(int)
    a = img[..., 3]
    dx = np.abs(a[:, 1:] - a[:, :-1])
    dy = np.abs(a[1:, :] - a[:-1, :])
    bx = (np.arange(dx.shape[1]) % Q) == Q - 1
    by = (np.arange(dy.shape[0]) % Q) == Q - 1
    return {"border_max": int(max(dx[:, bx].max(), dy[by, :].max())),
            "inside_max": int(max(dx[:, ~bx].max(), dy[~by, :].max())),
            "border_p99": float(np.percentile(np.concatenate([dx[:, bx].ravel(), dy[by, :].ravel()]), 99.9)),
            "inside_p99": float(np.percentile(np.concatenate([dx[:, ~bx].ravel(), dy[~by, :].ravel()]), 99.9))}


def self_test(field, tex, base, outdir=None, **kw):
    """MZ's table drawing == the global field drawing?  (0 differing pixels = the quarters always join)"""
    table = W.mz_table()
    block = build_overlay(field, tex, **kw)
    grid = test_grid()
    mz = W.render_mz(grid, block, base, table)
    ref = render_global(grid, field, tex, base, **kw)
    d = W.count_diff(mz, ref)
    if outdir:
        mz.crop((0, 64 * 48 - 96, 20 * 48, 76 * 48)).save(os.path.join(outdir, "selftest_mz.png"))
    return d, mz
