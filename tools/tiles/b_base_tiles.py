"""Method B, step 1: seamless 48x48 base ground tiles (grass, dirt) from PixelLab textures.

PixelLab (create_image_pro_flash, our tree foliage as the style reference) gives a 96x96 texture; here it is
  1. calmed: every pixel keeps its brightness RANK but gets a colour from a short, low-contrast ramp that we
     choose (natural hues that still pass Farming's grass / earth colour test), so the texture's shapes stay
     and its contrast drops well below the trees and people;
  2. made seamless without resampling or blending: a 48x48 tile is cut out of the 96x96 source with
     minimum-error seams (image-quilting style) - every pixel is an existing source pixel, the left edge
     continues the right one and the top continues the bottom.

  python b_base_tiles.py <texture96.png> <grass|dirt> <out48.png> [--x0 N --y0 N] [--seed N]
"""
import sys

import numpy as np
from PIL import Image

# dark -> light; the middle one is the base colour.  Grass hue ~120-135 (Farming: 110-150, s>=0.30, v>=0.44),
# earth hue ~45 (Farming: 38-98, s 0.22-0.42, v 0.42-0.62).
RAMPS = {
    "grass": [(46, 104, 62), (56, 122, 72), (66, 138, 82), (80, 152, 92), (98, 166, 100)],
    "dirt": [(92, 84, 62), (108, 100, 76), (124, 115, 89), (138, 129, 101), (152, 143, 114)],
}
# how much of the tile each ramp step takes (by brightness rank)
SHARES = {
    "grass": [0.04, 0.16, 0.52, 0.22, 0.06],
    "dirt": [0.04, 0.18, 0.52, 0.21, 0.05],
}


def luminance(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def calm(img, kind, shares=None, ramp=None):
    """Recolour by brightness rank into the kind's ramp (ties broken by position - stable)."""
    a = np.asarray(img.convert("RGB")).astype(float)
    lum = luminance(a)
    flat = lum.ravel()
    order = np.argsort(flat, kind="stable")
    shares = shares or SHARES[kind]
    ramp = ramp or RAMPS[kind]
    bounds = np.cumsum(shares) * flat.size
    level = np.zeros(flat.size, dtype=int)
    for rank, idx in enumerate(order):
        level[idx] = int(np.searchsorted(bounds, rank, side="right"))
    level = np.minimum(level, len(ramp) - 1).reshape(lum.shape)
    out = np.zeros(a.shape, dtype=np.uint8)
    for i, c in enumerate(ramp):
        out[level == i] = c
    return Image.fromarray(out, "RGB").convert("RGBA"), level


def _cut_path(cost):
    """Min-cost 8-connected vertical path through cost (H x W), cyclic top/bottom is not needed here."""
    H, W = cost.shape
    acc = cost.copy()
    back = np.zeros((H, W), dtype=int)
    for y in range(1, H):
        for x in range(W):
            best, bx = None, x
            for dx in (-1, 0, 1):
                xx = x + dx
                if 0 <= xx < W and (best is None or acc[y - 1, xx] < best):
                    best, bx = acc[y - 1, xx], xx
            acc[y, x] += best
            back[y, x] = bx
    x = int(np.argmin(acc[H - 1]))
    path = [0] * H
    for y in range(H - 1, -1, -1):
        path[y] = x
        x = back[y, x]
    return path


def _cyclic_cut(cost):
    """A vertical cut whose ends meet (path[0] and path[-1] at most 1 apart), for wrapping in the other axis."""
    H, W = cost.shape
    best = None
    for start in range(W):
        c = cost.copy()
        c[0, :] = 1e9
        c[0, start] = cost[0, start]
        path = _cut_path(c)
        if abs(path[-1] - start) > 1:
            continue
        total = sum(cost[y, path[y]] for y in range(H))
        if best is None or total < best[0]:
            best = (total, path)
    return best[1]


def seamless(src, size=48, x0=0, y0=0, band=(12, 36)):
    """48x48 periodic tile from a (2*size)^2 source: T(x,y) comes from the source at (x0+x, y0+y) or the copy one
    tile further on, switching along a min-error cut inside `band` (columns / rows) - only source pixels."""
    a = np.asarray(src.convert("RGBA")).astype(int)
    S = size
    # horizontal wrap: left part from the copy shifted by S (so T(0) follows T(S-1)), right part from the window
    rows = range(y0, y0 + 2 * S) if a.shape[0] >= y0 + 2 * S else range(y0, y0 + S)
    A = a[y0:y0 + 2 * S, x0:x0 + S]            # window
    B = a[y0:y0 + 2 * S, x0 + S:x0 + 2 * S]    # the next copy
    lo, hi = band
    diff = np.abs(A[:, lo:hi, :3] - B[:, lo:hi, :3]).sum(axis=2).astype(float)
    path = _cut_path(diff)
    T1 = A.copy()
    for y in range(T1.shape[0]):
        c = lo + path[y]
        T1[y, :c] = B[y, :c]
    # vertical wrap on T1 (horizontally periodic); the cut must wrap left/right too
    A2 = T1[0:S]
    B2 = T1[S:2 * S]
    diff2 = np.abs(A2[lo:hi, :, :3] - B2[lo:hi, :, :3]).sum(axis=2).astype(float).T   # W x band
    path2 = _cyclic_cut(diff2)
    T = A2.copy()
    for x in range(S):
        r = lo + path2[x]
        T[:r, x] = B2[:r, x]
    return Image.fromarray(T.astype(np.uint8), "RGBA")


def seam_error(tile):
    """Mean colour step across the wrap seams vs inside the tile (1.0 = seams look like the rest)."""
    a = np.asarray(tile.convert("RGB")).astype(int)
    inside = (np.abs(np.diff(a, axis=1)).sum(axis=2).mean() + np.abs(np.diff(a, axis=0)).sum(axis=2).mean()) / 2
    seam = (np.abs(a[:, 0] - a[:, -1]).sum(axis=1).mean() + np.abs(a[0] - a[-1]).sum(axis=1).mean()) / 2
    return seam / max(inside, 1e-6)


def tiled(tile, n=6, scale=2):
    w, h = tile.size
    out = Image.new("RGBA", (w * n, h * n))
    for j in range(n):
        for i in range(n):
            out.paste(tile, (i * w, j * h))
    return out.resize((w * n * scale, h * n * scale), Image.NEAREST)


if __name__ == "__main__":
    args = sys.argv[1:]
    src, kind, out = args[0], args[1], args[2]
    x0 = int(args[args.index("--x0") + 1]) if "--x0" in args else 0
    y0 = int(args[args.index("--y0") + 1]) if "--y0" in args else 0
    img = Image.open(src).convert("RGBA")
    calm_img, _ = calm(img, kind)
    t = seamless(calm_img, 48, x0, y0)
    t.save(out)
    print(out, "seam/inside step ratio: %.2f" % seam_error(t))
