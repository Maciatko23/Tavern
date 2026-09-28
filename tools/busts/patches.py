# Sewn-on cloth patches, frayed edges and tears for the RTP busts (cel style: flat tone, dark line, stitches).
import numpy as np
from bustlib import *


def patch(img, quad, cloth, lift=1.15, hue=(30, 0.4), seed=1, stitch=(214, 196, 150), line=(28, 18, 12), ss=4):
    """Recolour the cloth inside quad to a patch tone (keeps the cloth's folds), outline it, sew it on."""
    H, W = img.shape[:2]
    cv = Canvas(W, H, ss)
    m = cv.mask([quad])
    clip = np.repeat(np.repeat(cloth, ss, 0), ss, 1)
    m &= clip
    out = img.copy()
    # tone: same shading steps as the cloth, other hue / brightness
    v = rgb_to_hsv(img[..., :3])[..., 2]
    tone = hsv_to_rgb(np.stack([np.full_like(v, hue[0] / 360.0), np.full_like(v, hue[1]), np.clip(v * lift, 0, 1)], -1))
    big = np.repeat(np.repeat(tone, ss, 0), ss, 1)
    cv.rgb[m] = big[m]; cv.a |= m
    # outline 1.25 px
    ol = m & ~erode(m, 5)
    cv.rgb[ol] = np.asarray(line, np.float32) / 255.0
    # stitches: short dashes across the border, every ~5 px
    rng = np.random.RandomState(seed)
    q = [np.asarray(p, np.float64) for p in quad] + [np.asarray(quad[0], np.float64)]
    ctr = np.mean(np.asarray(quad, np.float64), 0)
    polys_l, polys_d = [], []
    for i in range(len(q) - 1):
        a, b = q[i], q[i + 1]
        Lg = np.linalg.norm(b - a); d = (b - a) / Lg
        nrm = np.array([-d[1], d[0]])
        if np.dot(ctr - a, nrm) < 0:
            nrm = -nrm                                  # point inward
        n = int(Lg / 6.5)
        for j in range(1, n):
            p = a + d * (Lg * j / n) + d * rng.uniform(-0.5, 0.5)
            s0 = p - nrm * 1.2; s1 = p + nrm * 2.6 + d * 0.8
            polys_l.append(taper(np.stack([s0, s1]), 1.1, 0.9))
            polys_d.append(taper(np.stack([s0 + nrm * 0.2 + d * 0.9, s1 + d * 0.9]), 0.8, 0.6))
    dm = cv.mask(polys_d) & np.repeat(np.repeat(dilate(cloth, 2), ss, 0), ss, 1)
    lm = cv.mask(polys_l) & np.repeat(np.repeat(dilate(cloth, 2), ss, 0), ss, 1)
    cv.rgb[dm] = np.asarray(line, np.float32) / 255.0; cv.a |= dm
    cv.rgb[lm] = np.asarray(stitch, np.float32) / 255.0; cv.a |= lm
    layer = cv.to_1x()
    return over(out, layer)


def _normals(pts):
    p = np.asarray(pts, np.float64)
    d = np.gradient(p, axis=0); d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
    return p, d, np.stack([-d[:, 1], d[:, 0]], 1)


def _offset(pts, dist):
    p, d, n = _normals(pts)
    return [tuple(q) for q in p + n * dist]


def fray(img, edge, out_sign, seed=1, depth=3.0, teeth=(2.0, 4.5), width=(2.0, 4.2), gap=(1.0, 3.5),
         line=(24, 20, 18), threads=0, shift=6.0, ss=4, lw=5):
    """Frayed hem along a cloth edge: ragged teeth of the same cloth stick out past the old smooth edge.
    edge: polyline on the cloth border; out_sign: +1 if the left normal (-dy, dx) points out of the cloth."""
    H, W = img.shape[:2]
    rng = np.random.RandomState(seed)
    p, d, n = _normals(edge)
    n = n * out_sign
    seglen = np.linalg.norm(np.diff(p, axis=0), axis=1); total = seglen.sum()
    cum = np.concatenate([[0], np.cumsum(seglen)])

    def at(s):
        i = min(np.searchsorted(cum, s, side='right') - 1, len(p) - 2)
        t = (s - cum[i]) / max(seglen[i], 1e-9)
        dd = p[i + 1] - p[i]; dd /= max(np.linalg.norm(dd), 1e-9)
        nn = np.array([-dd[1], dd[0]]) * out_sign
        return p[i] + (p[i + 1] - p[i]) * t, dd, nn
    polys = []
    s = rng.uniform(0.5, 2.0)
    while s < total - 1.0:
        w = rng.uniform(*width); h = rng.uniform(*teeth)
        c0, dd, nn = at(s); c1, _, _ = at(min(total, s + w))
        tilt = rng.uniform(-0.6, 0.6)
        apex = (c0 + c1) / 2 + nn * h + dd * tilt * h
        polys.append([tuple(c0 - nn * 1.0), tuple(apex), tuple(c1 - nn * 1.0)])
        s += w + rng.uniform(*gap)
    thr = []
    for k in range(threads):
        s0 = rng.uniform(0.15, 0.85) * total
        c0, dd, nn = at(s0)
        ln = rng.uniform(4, 7); bend = rng.uniform(-2.5, 2.5)
        thr.append(taper(bez(c0 - nn * 0.5, c0 + nn * ln * 0.5 + dd * bend, c0 + nn * ln + dd * bend * 0.4, 12), 1.0, 0.6))
    band = [tuple(q) for q in p] + _offset(edge, -depth * out_sign)[::-1]
    side = [tuple(q) for q in p] + _offset(edge, -14 * out_sign)[::-1]
    cv = Canvas(W, H, ss)
    T = cv.mask(polys) if polys else np.zeros((H * ss, W * ss), bool)
    Bd = cv.mask([band]); Sd = cv.mask([side])
    paint = T | Bd
    shape = T | Sd
    near = cv.mask([[tuple(q) for q in p + n * 6] + [tuple(q) for q in (p - n * 3)[::-1]]])
    ol = shape & ~erode(shape, lw) & near
    # cloth colour: sample the original a few px inside the cloth (keeps its cel shading)
    nm = -np.mean(n, 0); nm /= max(np.linalg.norm(nm), 1e-9)
    yy, xx = np.nonzero(paint)
    sx = np.clip(((xx + 0.5) / ss + nm[0] * shift).astype(int), 0, W - 1)
    sy = np.clip(((yy + 0.5) / ss + nm[1] * shift).astype(int), 0, H - 1)
    cv.rgb[yy, xx] = img[sy, sx, :3]; cv.a[yy, xx] = True
    cv.rgb[ol] = np.asarray(line, np.float32) / 255.0; cv.a |= ol
    if thr:
        Tm = cv.mask(thr)
        cv.rgb[Tm] = np.asarray(line, np.float32) / 255.0 * 1.6; cv.a |= Tm
    return over(img, cv.to_1x())


def hole(img, poly, fill, line=(24, 20, 18), shade=None, ss=4, lw=5, lip=None):
    """A torn hole: jagged outline, what is under it (fill), a darker shade on its upper rim, optional lighter lip."""
    H, W = img.shape[:2]
    cv = Canvas(W, H, ss)
    m = cv.mask([poly])
    cv.paint(m, fill)
    if shade is not None:
        cv.paint(m & ~np.roll(m, -int(2.2 * ss), axis=0), shade)      # the cloth's shadow falls on the top rim
    ol = m & ~erode(m, lw)
    cv.rgb[ol] = np.asarray(line, np.float32) / 255.0
    if lip is not None:
        lm = dilate(m, int(1.6 * ss)) & ~dilate(m, int(0.9 * ss)) & np.roll(m, int(2.0 * ss), axis=0)   # lower rim
        cv.paint(lm & ~m, lip)
    return over(img, cv.to_1x())


def smudge(img, polys, col, strength=0.35, ss=4):
    """Flat dirt: blend a colour over the skin inside the polygons (hard cel edge, no blur)."""
    H, W = img.shape[:2]
    cv = Canvas(W, H, ss)
    m = cv.mask(polys)
    k = down(m, ss) * strength
    out = img.copy()
    out[..., :3] = out[..., :3] * (1 - k[..., None]) + (np.asarray(col, np.float32) / 255.0) * k[..., None]
    return out


def rip(center, width=4.0, seed=1, step=1.6, jag=0.45, alt=0.3):
    """Jagged slit polygon along a centre line (a tear in cloth)."""
    rng = np.random.RandomState(seed)
    p = np.asarray(center, np.float64)
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1); cum = np.concatenate([[0], np.cumsum(seg)]); tot = cum[-1]
    n = max(4, int(tot / step))
    ts = np.linspace(0, tot, n)
    L, R = [], []
    for k, t in enumerate(ts):
        i = min(np.searchsorted(cum, t, side='right') - 1, len(p) - 2)
        f = (t - cum[i]) / max(seg[i], 1e-9)
        c = p[i] + (p[i + 1] - p[i]) * f
        d = (p[i + 1] - p[i]) / max(seg[i], 1e-9); nn = np.array([-d[1], d[0]])
        env = np.sin(np.pi * (k / (n - 1))) ** 0.6          # pointed ends
        wl = width / 2 * env * (1 + jag * (rng.rand() * 2 - 1) + (alt if k % 2 else -alt * 0.6))
        wr = width / 2 * env * (1 + jag * (rng.rand() * 2 - 1) + (-alt * 0.6 if k % 2 else alt))
        L.append(tuple(c + nn * wl)); R.append(tuple(c - nn * wr))
    return L + R[::-1]
