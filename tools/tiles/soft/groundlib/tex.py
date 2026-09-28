"""Numerics for soft, painted ground textures (numpy + PIL only).

Every filter here works on a TORUS (FFT / np.roll), so a 48x48 periodic tile stays periodic:
MZ draws big areas by repeating one 48x48 cell, so the texture must join itself on all sides.
Arrays are float64 H x W x 3 in 0..255 unless said otherwise.
"""
import numpy as np
from PIL import Image


# ------------------------------------------------------------------ conversion / io
def load_rgba(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float64)


def load_rgb(path):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float64)


def to_img(a):
    a = np.clip(np.round(a), 0, 255).astype(np.uint8)
    return Image.fromarray(a, "RGBA" if a.shape[-1] == 4 else "RGB")


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


# ------------------------------------------------------------------ periodic filters
def gauss(a, sigma):
    """Periodic Gaussian blur (FFT), 2-D or H x W x C."""
    if sigma <= 0:
        return a.copy()
    H, W = a.shape[:2]
    fy = np.fft.fftfreq(H)[:, None]
    fx = np.fft.fftfreq(W)[None, :]
    k = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    if a.ndim == 3:
        k = k[..., None]
    return np.real(np.fft.ifft2(np.fft.fft2(a, axes=(0, 1)) * k, axes=(0, 1)))


def gauss_clamp(a, sigma):
    """Non-periodic Gaussian blur (edges padded), for alpha inside one quarter."""
    if sigma <= 0:
        return a.copy()
    p = int(3 * sigma + 2)
    b = np.pad(a, [(p, p), (p, p)] + ([(0, 0)] if a.ndim == 3 else []), mode="edge")
    return gauss(b, sigma)[p:-p, p:-p]


def roll(a, dy, dx):
    return np.roll(np.roll(a, dy, 0), dx, 1)


def resample(a, factor):
    """Scale a periodic tile (3x3 tiled, Lanczos up / BOX down, centre cut)."""
    H, W = a.shape[:2]
    big = np.tile(a, (3, 3, 1))
    nh, nw = int(round(H * factor)), int(round(W * factor))
    out = []
    for c in range(a.shape[2]):
        ch = Image.fromarray(big[..., c].astype(np.float32), mode="F")
        ch = ch.resize((nw * 3, nh * 3), Image.LANCZOS if factor >= 1 else Image.BOX)
        out.append(np.asarray(ch))
    return np.stack(out, -1)[nh:2 * nh, nw:2 * nw].astype(np.float64)


def downscale_pixelart(a, size=48):
    """PixelLab output -> soft periodic tile (the S1 finding: generate BIG, scale down, the 2-3 px
    pixel grid melts into gradients). BOX to 2x the size, then Lanczos to the size (periodic)."""
    H = a.shape[0]
    x = a
    if H > 2 * size:
        x = resample(x, (2 * size) / H)
    return resample(x, size / x.shape[0])


def seamless4(a, preserve_variance=True):
    """Make a non-periodic tile periodic: 4 copies (plain, rolled x, rolled y, rolled xy) blended so
    every copy's seam sits where its weight is 0; variance kept (1/sqrt(sum w^2)) so the middle
    does not go grey and blurry."""
    H, W = a.shape[:2]
    wx = 1 - np.abs((np.arange(W) + 0.5) / W * 2 - 1)
    wy = 1 - np.abs((np.arange(H) + 0.5) / H * 2 - 1)
    wx = wx * wx * (3 - 2 * wx)
    wy = wy * wy * (3 - 2 * wy)
    WX, WY = np.meshgrid(wx, wy)
    mean = a.reshape(-1, a.shape[-1]).mean(0)
    c = a - mean
    parts = [(c, WX * WY), (np.roll(c, W // 2, 1), (1 - WX) * WY),
             (np.roll(c, H // 2, 0), WX * (1 - WY)), (roll(c, H // 2, W // 2), (1 - WX) * (1 - WY))]
    acc = sum(p * w[..., None] for p, w in parts)
    if preserve_variance:
        acc = acc / np.sqrt(sum(w * w for _, w in parts))[..., None]
    return acc + mean


def seam_error(a):
    """Mean |step| across the wrap seams / inside the tile (about 1.0 = seamless)."""
    d_in = (np.abs(np.diff(a, axis=0)).mean() + np.abs(np.diff(a, axis=1)).mean()) / 2
    d_seam = (np.abs(a[0] - a[-1]).mean() + np.abs(a[:, 0] - a[:, -1]).mean()) / 2
    return d_seam / max(1e-6, d_in)


# ------------------------------------------------------------------ periodic noise
def value_noise(size, cells, seed, octaves=1, persistence=0.5):
    """Smooth periodic value noise, about -1..1; cells = lattice cells per period."""
    rng = np.random.default_rng(seed)
    out = np.zeros((size, size))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = max(2, int(cells * (2 ** o)))
        g = rng.uniform(-1, 1, (n, n))
        u = (np.arange(size) + 0.5) / size * n
        i0 = np.floor(u).astype(int) % n
        i1 = (i0 + 1) % n
        f = u - np.floor(u)
        f = f * f * (3 - 2 * f)
        X0, Y0 = np.meshgrid(i0, i0)
        X1, Y1 = np.meshgrid(i1, i1)
        FX, FY = np.meshgrid(f, f)
        a = g[Y0, X0] * (1 - FX) + g[Y0, X1] * FX
        b = g[Y1, X0] * (1 - FX) + g[Y1, X1] * FX
        out += amp * (a * (1 - FY) + b * FY)
        tot += amp
        amp *= persistence
    out /= tot
    return out / max(1e-9, np.abs(out).max())


def blur_noise(size, sigma, seed):
    """Periodic blurred white noise normalised to 0..1 (S2's noise_wrap)."""
    r = np.random.RandomState(seed).rand(size, size)
    n = gauss(r, sigma)
    return (n - n.min()) / max(1e-6, n.max() - n.min())


def warp(field, dx, dy):
    """Sample a periodic 2-D field at (x + dx, y + dy), bilinear."""
    H, W = field.shape
    Y, X = np.mgrid[0:H, 0:W].astype(np.float64)
    xs, ys = (X + dx) % W, (Y + dy) % H
    x0, y0 = np.floor(xs).astype(int), np.floor(ys).astype(int)
    fx, fy = xs - x0, ys - y0
    x1, y1 = (x0 + 1) % W, (y0 + 1) % H
    return (field[y0, x0] * (1 - fx) * (1 - fy) + field[y0, x1] * fx * (1 - fy)
            + field[y1, x0] * (1 - fx) * fy + field[y1, x1] * fx * fy)


def warped_noise(size, sigma, seed, warp_amp=4.0, warp_sigma=5.0):
    """Domain-warped blurred noise (organic blobs with tendrils), 0..1."""
    base = blur_noise(size, sigma, seed)
    wx = (blur_noise(size, warp_sigma, seed + 101) - 0.5) * 2 * warp_amp
    wy = (blur_noise(size, warp_sigma, seed + 202) - 0.5) * 2 * warp_amp
    n = warp(base, wx, wy)
    return (n - n.min()) / max(1e-6, n.max() - n.min())


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ colour
def rgb2hsv(rgb):
    """rgb 0..1 -> hsv 0..1."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    m = d > 1e-6
    dd = np.maximum(d, 1e-6)
    rc, gc, bc = (mx - r) / dd, (mx - g) / dd, (mx - b) / dd
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2.0 + rc - bc, 4.0 + gc - rc))
    h = np.where(m, (h / 6.0) % 1.0, 0)
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return np.stack([h, s, mx], -1)


def hsv2rgb(hsv):
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    i = np.floor(h * 6.0)
    f = h * 6.0 - i
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    i = i.astype(int) % 6
    return np.stack([np.choose(i, [v, q, p, p, t, v]), np.choose(i, [t, v, v, q, p, p]),
                     np.choose(i, [p, p, t, v, v, q])], -1)


def hsv_shift(rgb, dh=0.0, s_mul=1.0, v_mul=1.0, s_add=0.0, v_add=0.0):
    """rgb 0..255 in and out: keeps the brush pattern, moves hue / saturation / value."""
    hsv = rgb2hsv(np.clip(rgb, 0, 255) / 255.0)
    hsv[..., 0] = (hsv[..., 0] + dh) % 1.0
    hsv[..., 1] = np.clip(hsv[..., 1] * s_mul + s_add, 0, 1)
    hsv[..., 2] = np.clip(hsv[..., 2] * v_mul + v_add, 0, 1)
    return hsv2rgb(hsv) * 255.0


def to_opp(a):
    """Opponent space: L (luma), c1 = r - g, c2 = (r + g) / 2 - b."""
    return np.stack([lum(a), a[..., 0] - a[..., 1], (a[..., 0] + a[..., 1]) / 2 - a[..., 2]], -1)


_M = np.array([[1, -1, 0], [0.5, 0.5, -1], [0.299, 0.587, 0.114]])
_MINV = np.linalg.inv(_M)


def from_opp(o):
    v = np.stack([o[..., 1], o[..., 2], o[..., 0]], -1)
    return v @ _MINV.T


def set_mean(rgb, mean_rgb, std_mul=1.0):
    """Move the mean colour to mean_rgb, scale the deviations (the pattern stays)."""
    m = rgb.reshape(-1, 3).mean(0)
    return (rgb - m) * std_mul + np.asarray(mean_rgb, float)


def hsv_of(rgb_mean):
    """Hue in degrees, saturation, value of one colour - the way Farming.js soilKindOf sees it."""
    r, g, b = [float(x) for x in rgb_mean]
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if d == 0:
        return 0.0, 0.0, mx / 255
    if mx == r:
        h = ((g - b) / d) % 6
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    return (h * 60 + 360) % 360, d / mx, mx / 255


# ------------------------------------------------------------------ band (scale) matching
SIGMAS = (0.7, 1.5, 3.0, 6.0, 12.0)
BAND_NAMES = ("<0.7", "0.7-1.5", "1.5-3", "3-6", "6-12", ">12")


def bands(L, sigmas=SIGMAS):
    """Split a periodic 2-D field into detail bands (finest first) + the coarse rest (with the mean)."""
    out, prev = [], L
    for s in sigmas:
        g = gauss(L, s)
        out.append(prev - g)
        prev = g
    out.append(prev)
    return out


def band_std(L, sigmas=SIGMAS):
    b = bands(L, sigmas)
    return [x.std() for x in b]


def band_match(L, target_std, boost=None, extra=None, extra_w=None, sigmas=SIGMAS, iters=4):
    """Give every scale band of L the energy (std) of a Winlu reference at that scale (x boost).
    extra: bands of another field (Winlu's own brush grain) mixed in per band at weight extra_w
    before the rescale: band_i = norm(src_i + w_i * extra_i) * target_i * boost_i.
    The difference-of-Gaussian bands overlap a little, so a strong band leaks into its neighbours;
    'iters' re-measures and rescales the bands of the result until they land on the targets."""
    b = bands(L, sigmas)
    mean = L.mean()
    out = np.zeros_like(L) + mean
    boost = boost or [1.0] * len(b)
    want = [target_std[i] * boost[i] for i in range(len(b))]
    for i, x in enumerate(b):
        if i == len(b) - 1:
            x = x - x.mean()
        if extra is not None and extra_w is not None and i < len(extra_w) and extra_w[i]:
            e = extra[i] - (extra[i].mean() if i == len(b) - 1 else 0)
            x = x / (x.std() + 1e-9) + extra_w[i] * e / (e.std() + 1e-9)
        out += x / (x.std() + 1e-9) * want[i]
    for _ in range(max(0, iters - 1)):
        b = bands(out, sigmas)
        out = np.zeros_like(L) + mean
        for i, x in enumerate(b):
            if i == len(b) - 1:
                x = x - x.mean()
            out += x * (want[i] / (x.std() + 1e-9)) ** 0.8      # damped, so it settles
    return out


# ------------------------------------------------------------------ metrics
def n_colours(a):
    a = np.clip(np.round(a), 0, 255).astype(np.uint8).reshape(-1, a.shape[-1])
    return len(np.unique(a, axis=0))


def grad_stats(a):
    """Mean |luma step| between neighbours (periodic), share of steps > 12 and > 24."""
    L = lum(np.clip(np.round(a), 0, 255))
    d = np.concatenate([np.abs(np.roll(L, -1, 1) - L).ravel(), np.abs(np.roll(L, -1, 0) - L).ravel()])
    return d.mean(), (d > 12).mean(), (d > 24).mean()


def repeat_energy(a, sigma=2.0):
    """Luma std after a periodic blur: how much structure is big enough to show as a 48 px motif
    when the tile repeats (Winlu's grounds: about 1.15-1.85)."""
    return gauss(lum(a), sigma).std()


def chroma_repeat(a, sigma=2.0):
    """Like repeat_energy for the colour: the std of the two opponent chroma channels after a periodic
    blur - green / brown patches big enough to show as a 48 px motif (Winlu's grounds: about 1-3)."""
    o = to_opp(a)
    c = gauss(o[..., 1:], sigma)
    return float(np.sqrt((c.reshape(-1, 2).std(0) ** 2).sum()))


def pop_share(a, thr=18.0):
    """Share of pixels that stand out from their surroundings (|L - blur3| > thr): specks that
    would form a dot grid when the tile repeats."""
    L = lum(a)
    return (np.abs(L - gauss(L, 3.0)) > thr).mean()


def hist3(a, bins=8):
    q = np.clip((np.clip(a, 0, 255) / 256 * bins).astype(int), 0, bins - 1).reshape(-1, 3)
    h = np.zeros((bins, bins, bins))
    np.add.at(h, (q[:, 0], q[:, 1], q[:, 2]), 1)
    return h.ravel() / h.sum()


def chi2(h1, h2):
    s = h1 + h2
    m = s > 0
    return 0.5 * (((h1 - h2) ** 2)[m] / s[m]).sum()


def grad_hist(a, bins=(0, 2, 4, 6, 8, 10, 12, 16, 20, 30, 45, 80, 256)):
    L = lum(np.clip(np.round(a), 0, 255))
    d = np.concatenate([np.abs(np.roll(L, -1, 1) - L).ravel(), np.abs(np.roll(L, -1, 0) - L).ravel()])
    h, _ = np.histogram(d, bins=bins)
    return h / h.sum()
