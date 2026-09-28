# Quest board art helpers: noise, wood, ramps with hue-shifted shades, dithering, shapes.
# Used by make_art.py (the whole board scene background, the parchment sheets and the small parts).
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BAYER4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16.0


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def value_noise(w, h, cell, rng):
    cell = max(1, int(cell))
    gw, gh = w // cell + 4, h // cell + 4
    g = rng.random((gh, gw)).astype(np.float32)
    im = Image.fromarray(g, "F").resize((gw * cell, gh * cell), Image.BICUBIC)
    a = np.asarray(im, dtype=np.float32)
    ox, oy = int(rng.integers(0, cell)), int(rng.integers(0, cell))
    return a[cell + oy:cell + oy + h, cell + ox:cell + ox + w]


def fbm(w, h, cell, octaves, rng, persistence=0.5):
    total = np.zeros((h, w), np.float32)
    amp, norm = 1.0, 0.0
    for _ in range(octaves):
        total += amp * value_noise(w, h, cell, rng)
        norm += amp
        amp *= persistence
        cell = max(1, cell // 2)
    return total / norm


def stretched(w, h, cell, octaves, rng, sx=1.0, sy=1.0):
    """fbm with features stretched sx along x and sy along y"""
    ww, hh = max(4, int(w / sx)), max(4, int(h / sy))
    n = fbm(ww, hh, cell, octaves, rng)
    return np.asarray(Image.fromarray(n, "F").resize((w, h), Image.BICUBIC), dtype=np.float32)


def norm01(a, lo=None, hi=None):
    lo = a.min() if lo is None else lo
    hi = a.max() if hi is None else hi
    return np.clip((a - lo) / max(1e-6, hi - lo), 0, 1)


def ramp_map(v, ramp, dither=True, ox=0, oy=0):
    """v in 0..1 -> colours of the ramp (a list of hex), ordered dithering between neighbours"""
    cols = np.stack([hexrgb(c) for c in ramp])
    n = len(ramp)
    f = np.clip(v, 0, 1) * (n - 1)
    i0 = np.floor(f).astype(np.int32)
    t = f - i0
    if dither:
        h, w = v.shape
        yy, xx = np.mgrid[0:h, 0:w]
        th = BAYER4[(yy + oy) % 4, (xx + ox) % 4]
        i = np.where(t > th, np.minimum(i0 + 1, n - 1), i0)
    else:
        i = np.clip(np.round(f).astype(np.int32), 0, n - 1)
    return cols[i]


def lerp_rgb(a, b, t):
    t = t[..., None] if np.ndim(t) == 2 else t
    return a * (1 - t) + b * t


def wood_field(w, h, rng, vertical=True, ring=0.085, warp=5.0, fiber=0.35, knots=(), streak=0.45):
    """0..1 luminance of a plank: rings bent by noise and knots, fibres along the grain"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    across = xx if vertical else yy
    along = yy if vertical else xx
    wn = stretched(w, h, 48, 4, rng, sx=1 if vertical else 10, sy=10 if vertical else 1)
    t = across * ring + wn * warp + along * 0.004
    for (kx, ky, kr, ks) in knots:
        d2 = ((xx - kx) ** 2 + ((yy - ky) * (0.55 if vertical else 1.8)) ** 2) / (kr * kr)
        t += ks * np.exp(-d2) * 2.6
    rings = 0.5 + 0.5 * np.cos(2 * np.pi * t)
    lines = rings ** 6                                   # thin dark late-wood lines
    fib = stretched(w, h, 6, 3, rng, sx=1 if vertical else 14, sy=14 if vertical else 1)
    big = stretched(w, h, 90, 3, rng, sx=1 if vertical else 3, sy=3 if vertical else 1)
    v = 0.62 - 0.30 * lines + fiber * (fib - 0.5) + streak * (big - 0.5)
    for (kx, ky, kr, ks) in knots:                       # the knot's dark core
        d2 = ((xx - kx) ** 2 + ((yy - ky) * (0.8 if vertical else 1.25)) ** 2) / ((kr * 0.32) ** 2)
        v -= 0.55 * np.exp(-d2 * 1.4)
        ring2 = np.exp(-((np.sqrt(d2) - 1.35) ** 2) * 6)
        v -= 0.12 * ring2
    return v


def paste_rgb(canvas, rgb, x, y, mask=None):
    """canvas: HxWx3 float array; rgb: hxwx3; mask: hxw 0..1"""
    h, w = rgb.shape[:2]
    H, W = canvas.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    sub = rgb[y0 - y:y1 - y, x0 - x:x1 - x]
    if mask is None:
        canvas[y0:y1, x0:x1] = sub
    else:
        m = mask[y0 - y:y1 - y, x0 - x:x1 - x][..., None]
        canvas[y0:y1, x0:x1] = canvas[y0:y1, x0:x1] * (1 - m) + sub * m


def shade_rect(canvas, x0, y0, x1, y1, amount):
    """multiplies a rectangle (amount < 1 darker, > 1 lighter)"""
    canvas[y0:y1, x0:x1] = np.clip(canvas[y0:y1, x0:x1] * amount, 0, 255)


def to_image(canvas):
    return Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGB")


def soft_shadow_mask(w, h, shape_mask, blur, offset=(0, 0)):
    im = Image.fromarray((shape_mask * 255).astype(np.uint8), "L")
    im = im.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(im, dtype=np.float32) / 255.0
    a = np.roll(np.roll(a, offset[1], axis=0), offset[0], axis=1)
    return a


def font(path, size):
    return ImageFont.truetype(path, size)
