"""Automatic checks for a new ground (printed by make_ground.py, limits from the 2026-09-27 judge):

  bands     the fine luma bands (< 3 px, the brush grain) within +-30 % of the Winlu reference's,
            the coarser ones (3-12 px) at most 1.3 x (calmer is fine, more repeats as a motif)
  repeat    luma std after a periodic blur (sigma 2) <= 1.8 - Winlu's own grounds are 1.15-1.85;
            more means shapes big enough to show as a 48 px motif when the tile repeats
  pops      <= 0.5 % pixels that stand out from their surroundings (specks -> a dot grid)
  colour    the same for the colour: chroma std after the blur <= 2.7 (Winlu: dirt 0.6-0.7, grass
            1.8-2.2, tall grass k21 2.67) - green / brown patches that would repeat as a motif
  creases   over a flat ground, the mean luma jump ON the 24 px quarter lines (where MZ joins
            pieces) is no bigger than on the lines next to them (<= 1.1 or Winlu's own ratio); also
            printed: the judge's share of jumps > 20 on those lines over the grass, next to Winlu's
  sheet     only the target kinds differ from the base sheet
  soil      what Farming.js soilKindOf() makes of the block (grass / earth / not soil) - the game
            uses it for tilling, the tile cursor and the random spawns (sticks, stones, flowers)
"""
import random
import numpy as np
from PIL import Image

from . import tex as T
from . import mz


def soil_verdict(block):
    """Farming.js soilKindOf() on the pixels the game samples: the block's island top-left piece,
    getImageData(x + 10, y + 48 + 10, 28, 28); opaque = alpha >= 200 (see js/plugins/Farming.js)."""
    b = np.asarray(block)
    win = b[48 + 10:48 + 38, 10:38].astype(float)
    n = win.shape[0] * win.shape[1]
    op = win[..., 3] >= 200
    if op.sum() < n * 0.05:
        return {"kind": None, "why": "blank"}
    if op.sum() < n * 0.35:
        return {"kind": False, "why": "too sparse (%.0f%% opaque)" % (100 * op.mean())}
    r, g, bl = [win[..., c][op].mean() for c in range(3)]
    h, s, v = T.hsv_of((r, g, bl))
    grass = 110 <= h <= 150 and s >= 0.30 and v >= 0.44
    earth = 38 <= h <= 98 and 0.22 <= s <= 0.42 and 0.42 <= v <= 0.62
    kind = "grass" if grass else "earth" if earth else False
    return {"kind": kind, "tint": [int(round(r)), int(round(g)), int(round(bl))], "h": round(float(h), 1), "s": round(float(s), 3), "v": round(float(v), 3)}


def texture_report(tex, ref_tex, boost=None):
    m = tex.reshape(-1, 3).mean(0)
    h, s, v = T.hsv_of(m)
    g, s12, s24 = T.grad_stats(tex)
    b = T.band_std(T.lum(tex))
    rb = T.band_std(T.lum(ref_tex))
    boost = boost or [1.0] * len(b)
    ratio = [x / max(1e-6, y * bo) for x, y, bo in zip(b, rb, boost)]
    return {
        "mean": [int(round(x)) for x in m], "hsv": [int(round(h)), round(float(s), 2), round(float(v), 2)],
        "colours": int(T.n_colours(tex)), "grad": round(float(g), 2), "steps>12": round(float(s12), 3), "steps>24": round(float(s24), 4),
        "bands": [round(float(x), 2) for x in b], "ref_bands": [round(float(x), 2) for x in rb],
        "band_ratio": [round(float(x), 2) for x in ratio],
        # fine bands (< 3 px: the brush grain) within +-30 % of Winlu's; coarser ones may be calmer,
        # never more than 1.3 x (that is what repeats as a motif)
        "bands_ok": bool(all(0.7 <= x <= 1.3 for x in ratio[:3]) and all(x <= 1.3 for x in ratio[3:5])),
        "repeat": round(float(T.repeat_energy(tex)), 2), "repeat_ok": bool(T.repeat_energy(tex) <= 1.8),
        "pops": round(float(T.pop_share(tex)), 4), "pops_ok": bool(T.pop_share(tex) <= 0.005),
        "chroma_repeat": round(T.chroma_repeat(tex), 2), "chroma_repeat_ref": round(T.chroma_repeat(ref_tex), 2),
        "chroma_repeat_ok": bool(T.chroma_repeat(tex) <= 2.7),
    }


def test_grid(seed=7):
    """All 256 neighbourhoods of a cell (3x3 each, spaced) plus a random area."""
    rnd = random.Random(seed)
    W, H = 64, 76
    grid = [[False] * W for _ in range(H)]
    for n in range(256):
        px0, py0 = (n % 16) * 4, (n // 16) * 4
        grid[py0 + 1][px0 + 1] = True
        for bit, (dx, dy) in enumerate([(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]):
            grid[py0 + 1 + dy][px0 + 1 + dx] = bool(n >> bit & 1)
    for y in range(64, H):
        for x in range(W):
            grid[y][x] = rnd.random() < 0.6
    return grid


def _jumps(img, grid, offsets=(0, )):
    """Luma jumps across the vertical / horizontal lines x % 24 in offsets (0 = the quarter lines),
    only where an overlay cell is on at least one side of the line."""
    L = T.lum(np.asarray(img.convert("RGB")).astype(float))
    H, W = L.shape
    cell = np.kron(np.array(grid, float), np.ones((48, 48))) > 0
    out = []
    for x in range(1, W):
        if x % 24 in offsets:
            out.append(np.abs(L[:, x] - L[:, x - 1])[cell[:, x] | cell[:, x - 1]])
    for y in range(1, H):
        if y % 24 in offsets:
            out.append(np.abs(L[y, :] - L[y - 1, :])[cell[y, :] | cell[y - 1, :]])
    return np.concatenate(out)


def crease_report(block, mask_kind, ground_tex):
    """Creases on the quarter lines (where MZ puts different pieces side by side), two ways:
    share: jumps > 20 luma on the quarter lines over the real grass (the 2026-09-27 judge's measure;
         Winlu's own block with the same mask is the yardstick, limit 1.2 x);
    ratio: over a flat ground, the mean jump ON the quarter lines / the mean jump on the lines right
         next to them (1.0 = the joins look like any other pixel step; a crease shows as > 1)."""
    grid = test_grid()
    base = T.to_img(np.dstack([ground_tex, np.full((48, 48), 255.0)]))
    flat = T.to_img(np.dstack([np.zeros((48, 48, 3)) + ground_tex.reshape(-1, 3).mean(0), np.full((48, 48), 255.0)]))
    r = {}
    for name, blk in (("new", block), ("winlu", mz.block(mask_kind))):
        on = _jumps(mz.render_grid(grid, blk, base), grid)
        im = mz.render_grid(grid, blk, flat)
        on_f, adj_f = _jumps(im, grid), _jumps(im, grid, (1, 23))
        r[name + "_share"] = round(float((on > 20).mean()), 4)
        r[name + "_ratio"] = round(float(on_f.mean() / max(1e-6, adj_f.mean())), 2)
    # the share also grows with the texture's own contrast (a dark or busy ground against the grass),
    # so only the ratio decides; the share is printed for comparison with the judge's numbers
    r["ok"] = bool(r["new_ratio"] <= max(1.1, r["winlu_ratio"]))
    return r, None


def alpha_joins(block):
    """Max alpha step across quarter lines when the test grid is drawn (0 = every join exact):
    compared against the same step one pixel inside the quarters."""
    grid = test_grid()
    alpha_only = np.zeros((144, 96, 4))
    alpha_only[..., :3] = 255
    alpha_only[..., 3] = np.asarray(block)[..., 3]
    im = mz.render_grid(grid, alpha_only, Image.new("RGBA", (48, 48), (0, 0, 0, 255)))
    L = np.asarray(im.convert("L")).astype(float)
    on = [np.abs(L[:, x] - L[:, x - 1]) for x in range(24, L.shape[1], 24)] + \
         [np.abs(L[y, :] - L[y - 1, :]) for y in range(24, L.shape[0], 24)]
    nx = [np.abs(L[:, x + 1] - L[:, x]) for x in range(24, L.shape[1] - 1, 24)] + \
         [np.abs(L[y + 1, :] - L[y, :]) for y in range(24, L.shape[0] - 1, 24)]
    on, nx = np.concatenate(on), np.concatenate(nx)
    return {"max_on": float(on.max()), "p99_on": float(np.percentile(on, 99)), "p99_next": float(np.percentile(nx, 99))}


def changed_kinds(sheet_a, sheet_b):
    a = np.asarray(sheet_a.convert("RGBA")).astype(int)
    b = np.asarray(sheet_b.convert("RGBA")).astype(int)
    out = []
    for k in range(16, 48):
        x, y = mz.kind_xy(k)
        if (a[y:y + 144, x:x + 96] != b[y:y + 144, x:x + 96]).any():
            out.append(k)
    return out
