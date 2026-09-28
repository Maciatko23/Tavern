# Shared helpers for method S2 (paint new soft tiles from Winlu's own textures).
import os
import numpy as np
from PIL import Image

ROOT = r"C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna"
WDIR = os.path.join(ROOT, r"img\tilesets\Winlu Fantasy Tileset - Exterior\Fantasy_Tileset_Green_Edition_upgrade\tilesets")
A2 = os.path.join(WDIR, "Fantasy_Outside_A2_2_green.png")
A5 = os.path.join(WDIR, "Fantasy_Outside_A5_green.png")
B = os.path.join(WDIR, "Fantasy_Outside_B_green.png")
SCR = r"C:\Users\macie\AppData\Local\Temp\claude\c--Users-macie-OneDrive-Dokumenty-RMMZ-Tawerna\23b787ed-862a-4302-9351-932ca8a916ca\scratchpad\tiles_soft\S2"


def load(p):
    return np.asarray(Image.open(p).convert("RGBA")).astype(np.float32) / 255.0


def save(a, p):
    a = np.clip(a * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(a, "RGBA" if a.shape[2] == 4 else "RGB").save(p)


def block_xy(k):
    k -= 16
    return (k % 8) * 96, (k // 8) * 144


def block(sheet, k):
    x, y = block_xy(k)
    return sheet[y:y + 144, x:x + 96].copy()


def put_block(sheet, k, blk):
    x, y = block_xy(k)
    sheet[y:y + 144, x:x + 96] = blk


def over(bg, fg):
    """alpha-composite fg over bg (float RGBA arrays)."""
    a = fg[..., 3:4]
    ba = bg[..., 3:4]
    oa = a + ba * (1 - a)
    rgb = (fg[..., :3] * a + bg[..., :3] * ba * (1 - a)) / np.maximum(oa, 1e-6)
    return np.concatenate([rgb, oa], -1)


def zoom(a, f):
    return np.repeat(np.repeat(a, f, 0), f, 1)


def on_colour(a, col=(1.0, 0.0, 1.0)):
    bg = np.ones_like(a)
    bg[..., :3] = col
    return over(bg, a)


# ---- periodic blur / noise (numpy FFT, wraps around = seamless) ----
def gauss_kernel_fft(h, w, sigma):
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    return np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))


def blur_wrap(a, sigma):
    """Gaussian blur with wrap-around (2D or 3D HxWxC)."""
    if sigma <= 0:
        return a.copy()
    h, w = a.shape[:2]
    K = gauss_kernel_fft(h, w, sigma)
    if a.ndim == 2:
        return np.real(np.fft.ifft2(np.fft.fft2(a) * K))
    return np.stack([np.real(np.fft.ifft2(np.fft.fft2(a[..., c]) * K)) for c in range(a.shape[2])], -1)


def blur_clamp(a, sigma):
    """Gaussian blur with edge padding (non-periodic)."""
    if sigma <= 0:
        return a.copy()
    p = int(3 * sigma + 2)
    pad = [(p, p), (p, p)] + ([(0, 0)] if a.ndim == 3 else [])
    b = np.pad(a, pad, mode="edge")
    b = blur_wrap(b, sigma)
    return b[p:-p, p:-p]


def noise_wrap(h, w, sigma, seed):
    """Periodic smooth value noise in [0,1] (normalised)."""
    r = np.random.RandomState(seed).rand(h, w)
    n = blur_wrap(r, sigma)
    n = (n - n.min()) / max(n.max() - n.min(), 1e-6)
    return n


def lum(rgb):
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def rgb2hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = np.where(m, (mx - r) / np.maximum(d, 1e-6), 0)
    gc = np.where(m, (mx - g) / np.maximum(d, 1e-6), 0)
    bc = np.where(m, (mx - b) / np.maximum(d, 1e-6), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2.0 + rc - bc, 4.0 + gc - rc))
    h = (h / 6.0) % 1.0
    h = np.where(m, h, 0)
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return np.stack([h, s, mx], -1)


def hsv2rgb(hsv):
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    i = np.floor(h * 6.0)
    f = h * 6.0 - i
    p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f))
    i = i.astype(int) % 6
    r = np.choose(i, [v, q, p, p, t, v])
    g = np.choose(i, [t, v, v, q, p, p])
    b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)
