"""S1 texture pipeline: a big PixelLab texture -> a soft, seamless 48x48 (period 48) Winlu-like ground texture.

  1. downscale the generated image (192 px, whose pixel grid is 2-3 px) with a high-quality filter
     (area/box, then a light Lanczos step) - the pixel grid melts into smooth painted gradients;
  2. seamless at period 48: pick the (48+m)^2 window whose opposite borders agree best and cross-fade
     the m-wide overlap with a variance-preserving blend (no contrast dip in the seam band);
  3. colour: CIE-Lab mean/std transfer to a target taken from Winlu (or given numbers);
  4. soften: a tiny Gaussian (wrap-around) so no hard 1-px steps are left, plus a faint periodic grain
     like Winlu's own dither.
All operations on a torus are done with numpy FFT / np.roll so the result tiles exactly.
"""
import numpy as np
from PIL import Image
from common import lab, lab_to_rgb


def downscale(img, size, method="area"):
    """img (PIL RGB) -> size x size.  'area': box filter (exact averaging), 'lanczos': Lanczos,
    'area+lanczos': box to 2x, then Lanczos to the final size."""
    img = img.convert("RGB")
    if method == "area":
        return img.resize((size, size), Image.BOX)
    if method == "lanczos":
        return img.resize((size, size), Image.LANCZOS)
    if method == "area+lanczos":
        mid = img.resize((size * 2, size * 2), Image.BOX) if img.size[0] > size * 2 else img
        return mid.resize((size, size), Image.LANCZOS)
    raise ValueError(method)


def gauss_kernel_fft(n, sigma):
    """Frequency response of a Gaussian of std sigma (px) on an n-periodic axis."""
    f = np.fft.fftfreq(n)
    return np.exp(-2 * (np.pi * f * sigma) ** 2)


def blur_wrap(a, sigma):
    """Gaussian blur on the torus (a: H x W [x C] float), done in the Fourier domain -> stays periodic."""
    if sigma <= 0:
        return a
    H, W = a.shape[:2]
    k = np.outer(gauss_kernel_fft(H, sigma), gauss_kernel_fft(W, sigma))
    if a.ndim == 2:
        return np.real(np.fft.ifft2(np.fft.fft2(a) * k))
    return np.stack([np.real(np.fft.ifft2(np.fft.fft2(a[..., c]) * k)) for c in range(a.shape[2])], -1)


def seam_error(a, x, y, n=48, m=12):
    """How badly a (n+m) window at (x, y) would seam: the m-wide overlap bands compared with each other."""
    w = a[y:y + n + m, x:x + n + m]
    ex = np.abs(w[:, :m] - w[:, n:n + m]).mean()
    ey = np.abs(w[:m, :] - w[n:n + m, :]).mean()
    return ex + ey


def best_window(a, n=48, m=12, step=2):
    H, W = a.shape[:2]
    best = None
    for y in range(0, H - n - m + 1, step):
        for x in range(0, W - n - m + 1, step):
            e = seam_error(a, x, y, n, m)
            if best is None or e < best[0]:
                best = (e, x, y)
    return best


def make_periodic(a, n=48, m=12, x=0, y=0):
    """(n+m) window at (x, y) of a (float H x W x 3) -> n x n periodic, variance-preserving cross-fade.
    T[i] = P[i] for i >= m;  T[i] = mean + ((1-w) (P[i+n]-mean) + w (P[i]-mean)) / sqrt((1-w)^2 + w^2)  for i < m,
    w = smoothstep(i / m): T[0] ~ P[n] (continues P[n-1] across the wrap), T[m] = P[m]."""
    P = a[y:y + n + m, x:x + n + m].astype(np.float64)
    mean = P.reshape(-1, P.shape[-1]).mean(0)

    def fade(P, axis):
        P = np.moveaxis(P, axis, 0)
        L = P.shape[0] - m
        out = P[:L].copy()
        for i in range(m):
            t = (i + 0.5) / m
            w = t * t * (3 - 2 * t)
            norm = np.sqrt((1 - w) ** 2 + w ** 2)
            out[i] = mean + ((1 - w) * (P[i + L] - mean) + w * (P[i] - mean)) / norm
        return np.moveaxis(out, 0, axis)
    P = fade(P, 1)   # columns
    P = fade(P, 0)   # rows
    return P


def lab_transfer(rgb, target_mean, target_std, strength_std=1.0):
    """rgb (float/uint8 H x W x 3) -> colours whose Lab mean/std are the targets.
    strength_std < 1 keeps part of the texture's own contrast."""
    L = lab(np.clip(rgb, 0, 255))
    shp = L.shape
    f = L.reshape(-1, 3)
    m, s = f.mean(0), f.std(0) + 1e-6
    ts = np.asarray(target_std, dtype=np.float64)
    scale = (ts / s) * strength_std + (1 - strength_std)
    g = (f - m) * scale + np.asarray(target_mean, dtype=np.float64)
    return lab_to_rgb(g.reshape(shp)).astype(np.float64)


def periodic_noise(n, sigma, seed):
    """Smooth periodic noise (n x n), zero mean, unit std: white noise blurred on the torus."""
    r = np.random.RandomState(seed)
    w = blur_wrap(r.randn(n, n), sigma)
    return (w - w.mean()) / (w.std() + 1e-9)


def grain(n, amount, seed):
    """Fine grain like Winlu's dither: 1-px noise, lightly blurred."""
    r = np.random.RandomState(seed)
    g = blur_wrap(r.randn(n, n), 0.45)
    return g / (g.std() + 1e-9) * amount


def flatten_low(T, radius=2.5, keep=0.3):
    """Damp the lowest frequencies of a periodic tile (blotches as big as the tile itself are what makes a
    repeated 48 px tile read as a grid); keep = the share of their amplitude that stays."""
    n = T.shape[0]
    f = np.fft.fftfreq(n) * n
    r = np.sqrt(f[None, :] ** 2 + f[:, None] ** 2)
    k = np.where((r > 0) & (r <= radius), keep, 1.0)
    return np.stack([np.real(np.fft.ifft2(np.fft.fft2(T[..., c]) * k)) for c in range(T.shape[2])], -1)


def even_spectrum(T, radius=10.0, gamma=0.5):
    """Tame the strongest mid-size features of a periodic tile: inside |k| <= radius every Fourier amplitude is
    pulled towards the mean amplitude of its ring (phases kept), gamma = how far (0 none .. 1 all the way).
    Single dominant shapes are what the eye picks up as a repeating lattice; this spreads their energy out."""
    n = T.shape[0]
    f = np.fft.fftfreq(n) * n
    r = np.sqrt(f[None, :] ** 2 + f[:, None] ** 2)
    ring = np.round(r).astype(int)
    out = []
    for c in range(T.shape[2]):
        F = np.fft.fft2(T[..., c])
        A = np.abs(F)
        mean = np.zeros_like(A)
        for k in range(1, int(radius) + 1):
            m = ring == k
            if m.any():
                mean[m] = A[m].mean()
        sel = (r > 0) & (r <= radius)
        newA = A.copy()
        newA[sel] = A[sel] ** (1 - gamma) * (mean[sel] + 1e-9) ** gamma
        F2 = F * (newA / (A + 1e-9))
        out.append(np.real(np.fft.ifft2(F2)))
    return np.stack(out, -1)


def soft_tile(src_img, down=96, method="area+lanczos", n=48, m=12, target=None, std_strength=1.0,
              blur=0.35, grain_amt=1.2, seed=5, window=None, flatten=None):
    """The whole S1 texture step. Returns (tile uint8 n x n x 3, info)."""
    small = np.asarray(downscale(src_img, down, method)).astype(np.float64)
    if window is None:
        e, x, y = best_window(small, n, m)
    else:
        x, y = window
        e = seam_error(small, x, y, n, m)
    T = make_periodic(small, n, m, x, y)
    if flatten:
        T = flatten_low(T, *flatten)
    if target is not None:
        T = lab_transfer(T, target[0], target[1], std_strength)
    T = blur_wrap(T, blur)
    if grain_amt:
        T = T + grain(n, grain_amt, seed)[..., None]
    return np.clip(T + 0.5, 0, 255).astype(np.uint8), {"window": (x, y), "seam_err": float(e), "down": down, "method": method}


def soft_mix(sources, down=96, method="area+lanczos", n=48, m=12, target=None, std_strength=1.0,
             blur=0.35, grain_amt=1.2, seed=5, flatten=None, even=None):
    """Several generated images [(PIL image, weight, quarter-turns)] -> one soft periodic tile: each is
    downscaled and made periodic on its own, then they are mixed (zero-mean detail added with the weights,
    so no source's features dominate the lattice), then the colour transfer and softening as soft_tile()."""
    acc, wsum, infos = None, 0.0, []
    for img, w, rot in sources:
        small = np.asarray(downscale(img, down, method)).astype(np.float64)
        small = np.rot90(small, rot)
        e, x, y = best_window(small, n, m)
        T = make_periodic(small, n, m, x, y)
        T = (T - T.reshape(-1, 3).mean(0)) / (T.reshape(-1, 3).std(0).mean() + 1e-9)   # zero mean, unit contrast
        acc = T * w if acc is None else acc + T * w
        wsum += w
        infos.append({"window": (x, y), "seam_err": float(e), "rot": rot})
    T = acc / wsum
    if flatten:
        T = flatten_low(T, *flatten)
    if even:
        T = even_spectrum(T, *even)
    # back to a colour image around mid-grey, then the Lab transfer sets the real colours
    T = 128 + T * 20
    if target is not None:
        T = lab_transfer(np.clip(T, 0, 255), target[0], target[1], std_strength)
    T = blur_wrap(T, blur)
    if grain_amt:
        T = T + grain(n, grain_amt, seed)[..., None]
    return np.clip(T + 0.5, 0, 255).astype(np.uint8), infos


def add_sheen(tile, amount=14.0, share=0.035, sigma=0.9, seed=7, tint=(0.92, 0.98, 1.08), follow=0.6):
    """Wet glints: soft small highlights on the tile's own bumps (where the high-passed luma peaks) mixed
    with random spots - periodic, blurred, a little cool (sky reflected in wet mud)."""
    n = tile.shape[0]
    t = tile.astype(np.float64)
    L = t @ np.array([0.299, 0.587, 0.114])
    hp = L - blur_wrap(L, 3.0)
    hp = (hp - hp.mean()) / (hp.std() + 1e-9)
    r = np.random.RandomState(seed)
    rnd = blur_wrap(r.randn(n, n), 1.2)
    rnd = (rnd - rnd.mean()) / (rnd.std() + 1e-9)
    s = follow * hp + (1 - follow) * rnd
    thr = np.quantile(s, 1 - share)
    spots = np.clip((s - thr) / (s.max() - thr + 1e-9), 0, 1)
    spots = blur_wrap(spots, sigma)
    spots = spots / (spots.max() + 1e-9)
    add = spots[..., None] * amount * np.asarray(tint)[None, None, :]
    return np.clip(t + add + 0.5, 0, 255).astype(np.uint8)


def tile_preview(tile, reps=3):
    t = Image.fromarray(tile)
    n = t.size[0]
    out = Image.new("RGB", (n * reps, n * reps))
    for y in range(reps):
        for x in range(reps):
            out.paste(t, (x * n, y * n))
    return out
