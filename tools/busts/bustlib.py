# Shared helpers for repainting the RTP anime busts (330x350) with numpy + PIL.
import os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PICS = os.path.join(ROOT, 'img', 'pictures')


def load(name_or_path):
    p = name_or_path if os.path.isabs(name_or_path) else os.path.join(PICS, name_or_path + '.png')
    return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255.0


def save(arr, path):
    a = np.clip(arr * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(a, 'RGBA').save(path)


def to_img(arr):
    return Image.fromarray(np.clip(arr * 255.0 + 0.5, 0, 255).astype(np.uint8), 'RGBA')


# ---- colour ----
def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.max(rgb[..., :3], axis=-1); mn = np.min(rgb[..., :3], axis=-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = np.where(m, (mx - r) / np.where(m, d, 1), 0)
    gc = np.where(m, (mx - g) / np.where(m, d, 1), 0)
    bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2.0 + rc - bc, 4.0 + gc - rc))
    h = np.where(m, (h / 6.0) % 1.0, 0.0)
    s = np.where(mx > 1e-6, d / np.where(mx > 1e-6, mx, 1), 0)
    return np.stack([h, s, mx], axis=-1)


def hsv_to_rgb(hsv):
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    i = np.floor(h * 6.0).astype(int) % 6
    f = h * 6.0 - np.floor(h * 6.0)
    p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], axis=-1)


def luma(arr):
    return arr[..., 0] * 0.299 + arr[..., 1] * 0.587 + arr[..., 2] * 0.114


def ramp(lum, stops):
    """Map luminance (0..1) through colour stops [(l, (r,g,b)), ...] (0..255) - keeps cel steps flat."""
    ls = np.array([s[0] for s in stops], np.float32)
    cs = np.array([s[1] for s in stops], np.float32) / 255.0
    out = np.stack([np.interp(lum, ls, cs[:, k]) for k in range(3)], axis=-1)
    return out


# ---- masks ----
def poly_mask(size, pts, ss=4, feather=False):
    """Anti-aliased polygon mask (h, w) float 0..1."""
    w, h = size
    im = Image.new('L', (w * ss, h * ss), 0)
    ImageDraw.Draw(im).polygon([(x * ss, y * ss) for x, y in pts], fill=255)
    im = im.resize((w, h), Image.LANCZOS if not feather else Image.BOX)
    return np.asarray(im).astype(np.float32) / 255.0


def region(shape, x0, y0, x1, y1):
    h, w = shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    return (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)


def dilate(mask, r=1):
    m = mask.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy > r * r:
                continue
            m |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return m


def over(dst, src, k=None):
    """Alpha-composite src over dst; k = extra 0..1 mask."""
    a = src[..., 3] if k is None else src[..., 3] * k
    out = dst.copy()
    da = dst[..., 3]
    oa = a + da * (1 - a)
    for c in range(3):
        out[..., c] = np.where(oa > 1e-6, (src[..., c] * a + dst[..., c] * da * (1 - a)) / np.maximum(oa, 1e-6), 0)
    out[..., 3] = oa
    return out


def erode(mask, r=1):
    return ~dilate(~mask, r)


def down(mask_ss, ss=4):
    h, w = mask_ss.shape
    return mask_ss.reshape(h // ss, ss, w // ss, ss).mean(axis=(1, 3)).astype(np.float32)


# ---- procedural cel painting (at a supersampled scale) ----
def bez(p0, p1, p2, n=24):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2 = map(lambda p: np.asarray(p, np.float64), (p0, p1, p2))
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2


def taper(pts, w0, w1=0.0, w_mid=None):
    """Polygon of a tapered stroke along pts (n,2): width w0 at the start -> w1 at the end."""
    pts = np.asarray(pts, np.float64)
    n = len(pts)
    d = np.gradient(pts, axis=0)
    d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    t = np.linspace(0, 1, n)
    if w_mid is None:
        w = w0 + (w1 - w0) * t
    else:
        w = np.where(t < 0.5, w0 + (w_mid - w0) * t * 2, w_mid + (w1 - w_mid) * (t - 0.5) * 2)
    L = pts + nrm * (w[:, None] / 2); R = pts - nrm * (w[:, None] / 2)
    return [tuple(p) for p in L] + [tuple(p) for p in R[::-1]]


class Canvas:
    """Paint flat colours with polygons at ss x, then take the result to 1x."""
    def __init__(self, w, h, ss=4):
        self.w, self.h, self.ss = w, h, ss
        self.rgb = np.zeros((h * ss, w * ss, 3), np.float32)
        self.a = np.zeros((h * ss, w * ss), bool)

    def mask(self, polys):
        im = Image.new('L', (self.w * self.ss, self.h * self.ss), 0)
        d = ImageDraw.Draw(im)
        for pts in polys:
            d.polygon([(x * self.ss, y * self.ss) for x, y in pts], fill=255)
        return np.asarray(im) > 127

    def paint(self, m, col, clip=None):
        if clip is not None:
            m = m & clip
        self.rgb[m] = np.asarray(col, np.float32) / 255.0
        self.a |= m
        return m

    def to_1x(self, alpha_mask=None):
        ss = self.ss; h, w = self.h, self.w
        a = (self.a if alpha_mask is None else alpha_mask).astype(np.float32)
        rgb = self.rgb * a[..., None]
        rgb = rgb.reshape(h, ss, w, ss, 3).sum((1, 3)); aa = a.reshape(h, ss, w, ss).sum((1, 3))
        out = np.zeros((h, w, 4), np.float32)
        out[..., :3] = rgb / np.maximum(aa, 1e-6)[..., None]
        out[..., 3] = aa / (ss * ss)
        return out


def strand_edge(pts, side, seg=7.0, tip=4.0, out=2.0, seed=0):
    """Hair edge made of strand clumps ending in points; pts run top -> bottom, side=+1 outward on the right."""
    rng = np.random.RandomState(seed)
    pts = [np.asarray(p, np.float64) for p in pts]
    res = [tuple(pts[0])]
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        L = np.linalg.norm(b - a); d = (b - a) / max(L, 1e-9)
        nrm = np.array([d[1], -d[0]]) * side
        k = max(1, int(round(L / seg)))
        cuts = np.sort(np.clip(np.arange(1, k + 1) / k + rng.uniform(-0.25, 0.25, k) / k, 0.05, 1.0)); cuts[-1] = 1.0
        prev = 0.0
        for c in cuts:
            s0 = a + (b - a) * prev; s1 = a + (b - a) * c
            f = rng.uniform(0.6, 1.3)
            res.append(tuple(s0 + (s1 - s0) * 0.5 + nrm * out * 0.9 * f))
            res.append(tuple(s1 + d * tip * 0.6 * f + nrm * out * f))       # the pointed end
            res.append(tuple(s1 - nrm * 0.8))
            prev = c
    return res


# ---- previews ----
def on_bg(arr, col=(120, 120, 120)):
    im = to_img(arr)
    bg = Image.new('RGBA', im.size, col + (255,))
    bg.alpha_composite(im)
    return bg


def zoom(arr, box, s=3, col=(120, 120, 120)):
    im = on_bg(arr, col).crop(box)
    return im.resize((im.width * s, im.height * s), Image.NEAREST)
