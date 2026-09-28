"""Shared helpers for the S1 soft-tile method (generate big -> downscale -> soften).

Paths, Winlu A2 block access, measurements (colours per tile, gradient sharpness, histogram distance).
"""
import os
import numpy as np
from PIL import Image

ROOT = "C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna"
WINLU_DIR = ROOT + "/img/tilesets/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets"
A2_PATH = WINLU_DIR + "/Fantasy_Outside_A2_2_green.png"
SCRATCH = "C:/Users/macie/AppData/Local/Temp/claude/c--Users-macie-OneDrive-Dokumenty-RMMZ-Tawerna/23b787ed-862a-4302-9351-932ca8a916ca/scratchpad/tiles_soft/S1"
WORK = SCRATCH + "/work"
OUT_SHEET = ROOT + "/img/tilesets/Soft_S1_A2.png"


def a2():
    return Image.open(A2_PATH).convert("RGBA")


def block_xy(kind):
    """Top-left pixel of the 96x144 block of A2 kind (16..47)."""
    k = kind - 16
    return (k % 8) * 96, (k // 8) * 144


def block(kind, sheet=None):
    sheet = sheet or a2()
    x, y = block_xy(kind)
    return sheet.crop((x, y, x + 96, y + 144))


def body_tile(kind, sheet=None):
    """A 48x48 body tile: the centre of the 2x2 island (quarters (1,3),(2,3),(1,4),(2,4))."""
    b = block(kind, sheet)
    return b.crop((24, 72, 72, 120))


def zoom(im, f):
    return im.resize((im.size[0] * f, im.size[1] * f), Image.NEAREST)


# ---------------------------------------------------------------- measurements
def colours_per_tile(im):
    """Distinct RGB colours among opaque pixels of a 48x48 tile (mean over the tiles of im)."""
    a = np.asarray(im.convert("RGBA"))
    H, W = a.shape[:2]
    counts = []
    for y in range(0, H - 47, 48):
        for x in range(0, W - 47, 48):
            t = a[y:y + 48, x:x + 48]
            op = t[t[:, :, 3] > 0][:, :3]
            if len(op) < 200:
                continue
            counts.append(len(np.unique(op.reshape(-1, 3) @ np.array([65536, 256, 1]))))
    return float(np.mean(counts)) if counts else 0.0


def luma(a):
    a = a.astype(np.float64)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def gradient_stats(im):
    """Mean |neighbour luma difference| and the share of 'hard steps' (> 24 luma levels) - over opaque pixels.
    Soft painted ground: low mean, few hard steps; crisp pixel art: many hard steps."""
    a = np.asarray(im.convert("RGBA"))
    L = luma(a[..., :3])
    op = a[..., 3] > 250
    if op.sum() < 100:
        op = a[..., 3] > 0
    dx = np.abs(L[:, 1:] - L[:, :-1])[op[:, 1:] & op[:, :-1]]
    dy = np.abs(L[1:, :] - L[:-1, :])[op[1:, :] & op[:-1, :]]
    d = np.concatenate([dx, dy])
    return {"mean_grad": float(d.mean()), "hard_steps_pct": float((d > 24).mean() * 100),
            "p90_grad": float(np.percentile(d, 90))}


def lab(a):
    """sRGB (0..255) -> CIE Lab, numpy only."""
    c = a.astype(np.float64) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    A = 500 * (f[..., 0] - f[..., 1])
    B = 200 * (f[..., 1] - f[..., 2])
    return np.stack([L, A, B], -1)


def lab_to_rgb(labv):
    L, A, B = labv[..., 0], labv[..., 1], labv[..., 2]
    fy = (L + 16) / 116
    fx = fy + A / 500
    fz = fy - B / 200
    def finv(f):
        return np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787)
    xyz = np.stack([finv(fx), finv(fy), finv(fz)], -1) * np.array([0.95047, 1.0, 1.08883])
    Mi = np.linalg.inv(np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]))
    c = xyz @ Mi.T
    c = np.where(c > 0.0031308, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055, 12.92 * c)
    return np.clip(c * 255 + 0.5, 0, 255).astype(np.uint8)


def hist_distance(im_a, im_b, bins=8):
    """Chi-square-like distance (0 = same, 1 = disjoint) between the opaque-pixel RGB histograms (8^3 bins)."""
    def h(im):
        a = np.asarray(im.convert("RGBA"))
        p = a[a[..., 3] > 250][:, :3] // (256 // bins)
        idx = p[:, 0] * bins * bins + p[:, 1] * bins + p[:, 2]
        v = np.bincount(idx, minlength=bins ** 3).astype(np.float64)
        return v / v.sum()
    ha, hb = h(im_a), h(im_b)
    return float(0.5 * np.sum((ha - hb) ** 2 / (ha + hb + 1e-12)))


def lab_stats(im):
    a = np.asarray(im.convert("RGBA"))
    p = a[a[..., 3] > 250][:, :3]
    l = lab(p)
    return l.mean(0), l.std(0)


def alpha_stats(im):
    """For overlays: share of partially transparent pixels among non-empty ones, and the alpha ramp width."""
    a = np.asarray(im.convert("RGBA"))[..., 3]
    nz = a > 0
    part = (a > 0) & (a < 250)
    return {"partial_alpha_pct": float(part.sum() / max(1, nz.sum()) * 100), "alpha_levels": int(len(np.unique(a)))}
