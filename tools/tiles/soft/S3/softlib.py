"""Soft / painterly texture helpers for the S3 method (PixelLab tile -> Winlu-like soft ground).
Only numpy + PIL. Every filter works on a TORUS (np.roll / FFT), so a seamless tile stays seamless.

Arrays are float64 H x W x 3 (0..255) unless said otherwise.
"""
import numpy as np
from PIL import Image


# ---------------------------------------------------------------- conversion
def load_rgb(path):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float64)


def load_rgba(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float64)


def to_img(a):
    a = np.clip(np.round(a), 0, 255).astype(np.uint8)
    return Image.fromarray(a)


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


# ---------------------------------------------------------------- periodic filters
def gauss_wrap(a, sigma):
    """Periodic Gaussian blur (FFT)."""
    if sigma <= 0:
        return a.copy()
    H, W = a.shape[:2]
    fy = np.fft.fftfreq(H)[:, None]
    fx = np.fft.fftfreq(W)[None, :]
    k = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    if a.ndim == 3:
        k = k[..., None]
    return np.real(np.fft.ifft2(np.fft.fft2(a, axes=(0, 1)) * k, axes=(0, 1)))


def highpass_wrap(a, sigma, keep=0.0):
    """Remove (1-keep) of the variation slower than sigma (keeps the mean): stops big blotches from
    showing as a grid when a 48 px tile repeats."""
    low = gauss_wrap(a, sigma)
    mean = a.reshape(-1, a.shape[-1]).mean(0) if a.ndim == 3 else a.mean()
    return a - (1 - keep) * (low - mean)


def bilateral_wrap(a, r=2, ss=1.2, sr=16.0):
    """Edge-preserving smoothing: flat areas melt together, strong edges (puddle rims, needles) stay."""
    acc = np.zeros_like(a)
    wsum = np.zeros(a.shape[:2])
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            s = np.roll(a, (dy, dx), (0, 1))
            w = np.exp(-(dx * dx + dy * dy) / (2 * ss * ss)) * np.exp(-((s - a) ** 2).sum(2) / (2 * sr * sr))
            acc += w[..., None] * s
            wsum += w
    return acc / wsum[..., None]


def kuwahara_wrap(a, r=1):
    """Kuwahara filter (oil-paint look): each pixel takes the mean of the calmest of its 4 quadrants."""
    L = lum(a)
    n = (r + 1) ** 2
    best_v = None
    out = np.zeros_like(a)
    for oy, ox in ((-r, -r), (-r, 0), (0, -r), (0, 0)):
        m = np.zeros_like(a)
        m1 = np.zeros(a.shape[:2])
        m2 = np.zeros(a.shape[:2])
        for i in range(r + 1):
            for j in range(r + 1):
                sh = (-(oy + i), -(ox + j))
                m += np.roll(a, sh, (0, 1))
                s = np.roll(L, sh, (0, 1))
                m1 += s
                m2 += s * s
        m /= n
        v = m2 / n - (m1 / n) ** 2
        if best_v is None:
            best_v, out = v, m
        else:
            pick = v < best_v
            out = np.where(pick[..., None], m, out)
            best_v = np.where(pick, v, best_v)
    return out


def resample_wrap(a, factor):
    """Scale a periodic tile by 'factor' (e.g. 0.5 = downscale x2) with periodic bicubic-ish quality:
    tile 3x3, resize with Lanczos (downscale: box pre-filter), take the centre."""
    H, W = a.shape[:2]
    big = np.tile(a, (3, 3, 1))
    nh, nw = int(round(H * factor)), int(round(W * factor))
    chans = []
    for c in range(a.shape[2]):
        ch = Image.fromarray(big[..., c].astype(np.float32), mode="F")
        ch = ch.resize((nw * 3, nh * 3), Image.LANCZOS if factor >= 1 else Image.BOX)
        chans.append(np.asarray(ch))
    out = np.stack(chans, -1)
    return out[nh:2 * nh, nw:2 * nw]


# ---------------------------------------------------------------- seamless
def seamless4(a, preserve_variance=True):
    """Make a (non-periodic) tile periodic: 4 copies (plain, rolled x, rolled y, rolled xy) blended with
    weights that put every copy's own seam where its weight is 0. The blend is done around the mean
    and rescaled by 1/sqrt(sum w^2) so the middle of the tile does not turn grey and blurry."""
    H, W = a.shape[:2]
    wx = 1 - np.abs((np.arange(W) + 0.5) / W * 2 - 1)
    wy = 1 - np.abs((np.arange(H) + 0.5) / H * 2 - 1)
    wx = wx * wx * (3 - 2 * wx)
    wy = wy * wy * (3 - 2 * wy)
    WX, WY = np.meshgrid(wx, wy)
    mean = a.reshape(-1, a.shape[-1]).mean(0)
    c = a - mean
    parts = [(c, WX * WY), (np.roll(c, W // 2, 1), (1 - WX) * WY),
             (np.roll(c, H // 2, 0), WX * (1 - WY)), (np.roll(c, (H // 2, W // 2), (0, 1)), (1 - WX) * (1 - WY))]
    acc = sum(p * w[..., None] for p, w in parts)
    if preserve_variance:
        norm = np.sqrt(sum(w * w for _, w in parts))
        acc = acc / norm[..., None]
    return acc + mean


def seam_error(a):
    """Mean abs difference across the wrap seams vs inside the tile (1.0 = seams look like any other row)."""
    d_in = (np.abs(np.diff(a, axis=0)).mean() + np.abs(np.diff(a, axis=1)).mean()) / 2
    d_seam = (np.abs(a[0] - a[-1]).mean() + np.abs(a[:, 0] - a[:, -1]).mean()) / 2
    return d_seam / max(1e-6, d_in)


# ---------------------------------------------------------------- noise (periodic)
def value_noise(size, cells, seed, octaves=1, persistence=0.5):
    """Smooth periodic value noise on a size x size torus, range about -1..1. cells = lattice cells per period."""
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


def warp(field, dx, dy):
    """Sample a periodic field at (x + dx, y + dy) (bilinear, periodic)."""
    H, W = field.shape
    Y, X = np.mgrid[0:H, 0:W].astype(np.float64)
    xs, ys = (X + dx) % W, (Y + dy) % H
    x0, y0 = np.floor(xs).astype(int), np.floor(ys).astype(int)
    fx, fy = xs - x0, ys - y0
    x1, y1 = (x0 + 1) % W, (y0 + 1) % H
    return (field[y0, x0] * (1 - fx) * (1 - fy) + field[y0, x1] * fx * (1 - fy)
            + field[y1, x0] * (1 - fx) * fy + field[y1, x1] * fx * fy)


def warped_noise(size, cells, seed, warp_amp=4.0, octaves=3):
    """Domain-warped periodic value noise (organic, blobby-with-tendrils), -1..1."""
    base = value_noise(size, cells, seed, octaves)
    wx = value_noise(size, cells, seed + 101, 2) * warp_amp
    wy = value_noise(size, cells, seed + 202, 2) * warp_amp
    n = warp(base, wx, wy)
    return n / max(1e-9, np.abs(n).max())


def grain(shape, sigma, seed, blur=0.5):
    rng = np.random.default_rng(seed)
    g = rng.normal(0, 1, shape)
    if blur > 0:
        g = gauss_wrap(g, blur)
        g /= g.std() + 1e-9
    return g * sigma


# ---------------------------------------------------------------- colour
def to_opp(a):
    """A simple opponent space: L (luma), c1 = r - g, c2 = (r + g)/2 - b."""
    L = lum(a)
    return np.stack([L, a[..., 0] - a[..., 1], (a[..., 0] + a[..., 1]) / 2 - a[..., 2]], -1)


def from_opp(o):
    L, c1, c2 = o[..., 0], o[..., 1], o[..., 2]
    # solve r - g = c1, (r+g)/2 - b = c2, .299r + .587g + .114b = L
    M = np.array([[1, -1, 0], [0.5, 0.5, -1], [0.299, 0.587, 0.114]])
    Minv = np.linalg.inv(M)
    v = np.stack([c1, c2, L], -1)
    return v @ Minv.T


def match_stats(a, mean, std, mask=None):
    """Move a texture to a target mean/std per opponent channel (mean, std = 3-vectors in opp space)."""
    o = to_opp(a)
    sel = o[mask] if mask is not None else o.reshape(-1, 3)
    m, s = sel.mean(0), sel.std(0) + 1e-6
    o2 = (o - m) / s * np.asarray(std) + np.asarray(mean)
    return from_opp(o2)


def opp_stats(a):
    o = to_opp(a).reshape(-1, 3)
    return o.mean(0), o.std(0)


def match_hist_lum(a, ref):
    """Histogram-match the luma of a to ref's luma (keeps chroma offsets)."""
    L = lum(a)
    Lr = np.sort(lum(ref).ravel())
    order = np.argsort(L.ravel())
    newL = np.empty(L.size)
    newL[order] = np.interp(np.linspace(0, 1, L.size), np.linspace(0, 1, Lr.size), Lr)
    d = newL.reshape(L.shape) - L
    return a + d[..., None]


# ---------------------------------------------------------------- metrics
def n_colours(a):
    a = np.clip(np.round(a), 0, 255).astype(np.uint8).reshape(-1, a.shape[-1])
    return len(np.unique(a, axis=0))


def grad_stats(a):
    """Mean abs luma step between neighbours (periodic) and the share of steps above 12 (hard edges)."""
    L = lum(np.clip(np.round(a), 0, 255))
    dx = np.abs(np.roll(L, -1, 1) - L)
    dy = np.abs(np.roll(L, -1, 0) - L)
    d = np.concatenate([dx.ravel(), dy.ravel()])
    return d.mean(), (d > 12).mean()


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


def centred_hist3(a, bins=8, span=64):
    """Colour histogram of the texture around its own mean (texture 'spread' without its base colour)."""
    c = a - a.reshape(-1, 3).mean(0) + 128
    q = np.clip(((c - (128 - span)) / (2 * span) * bins).astype(int), 0, bins - 1).reshape(-1, 3)
    h = np.zeros((bins, bins, bins))
    np.add.at(h, (q[:, 0], q[:, 1], q[:, 2]), 1)
    return h.ravel() / h.sum()


# ---------------------------------------------------------------- band (scale) matching
SIGMAS = (0.7, 1.5, 3.0, 6.0, 12.0)


def bands(L, sigmas=SIGMAS):
    """Split a periodic 2-D field into detail bands (finest first) + the rest (a Laplacian-like stack)."""
    out, prev = [], L
    for s in sigmas:
        g = gauss_wrap(L, s)
        out.append(prev - g)
        prev = g
    out.append(prev)          # coarse rest (includes the mean)
    return out


def band_std(L, sigmas=SIGMAS):
    b = bands(L, sigmas)
    return [x.std() for x in b[:-1]] + [b[-1].std()]


def band_match(L, target_std, boost=None, sigmas=SIGMAS, extra=None, extra_w=None):
    """Give every scale band of L the energy (std) Winlu has at that scale (x boost).
    extra: a list of band arrays (e.g. Winlu's own fine grain) mixed in per band with weights extra_w
    BEFORE the rescale - the result's band b = norm(src_b + w * extra_b) * target."""
    b = bands(L, sigmas)
    mean = L.mean()
    out = np.zeros_like(L) + mean
    boost = boost or [1.0] * len(b)
    for i, x in enumerate(b):
        if i == len(b) - 1:
            x = x - x.mean()
        if extra is not None and extra_w is not None and extra_w[i]:
            e = extra[i] - (extra[i].mean() if i == len(b) - 1 else 0)
            # mix at equal energy, then weights
            x = x / (x.std() + 1e-9) + extra_w[i] * e / (e.std() + 1e-9)
        s = x.std()
        out += x / (s + 1e-9) * target_std[i] * boost[i]
    return out
