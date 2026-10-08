# The kit for the residents' busts (2026-10-06): an RTP anime bust (330x350, facing left) repainted - recoloured clothes and
# hair (luma ramps keep the cel steps and the dark lines), parts taken from other RTP busts (a hat, a cap), and new things
# painted in the same cel look (flat tones, a shade band on the far side, a thin highlight on the lit side, a dark line):
# chains, vests, beards, stubble, wrinkles, freckles, dirt. Each bust has its own make_<key>.py script; make_residents.py runs
# them all. Every script is deterministic (fixed seeds): running it again gives the same file.
import os
import numpy as np
import cv2
from PIL import Image
from bustlib import *
from ramps import RAMPS, DIRT, FRECKLE

LINE = (34, 24, 22)         # the RTP line colour (dark warm brown)
# cel()'s ldir points AWAY from the light, to the side its shade band goes (the band is cut where the shape, moved that way, no
# longer covers it). The RTP busts are lit from the upper left (the viewer's side): the shade on the lower right. (2026-10-07: it
# was (-0.55, -0.83) - the shade on the lit side; every bust painted with the default rebuilt.)
LIGHT = (0.55, 0.83)


def hsv_of(img):
    h = rgb_to_hsv(img[..., :3])
    return h[..., 0] * 360.0, h[..., 1], h[..., 2]


class Bust:
    """One bust being repainted: self.img (H, W, 4) float 0..1."""

    def __init__(self, base):
        self.base = base
        self.img = load(base)
        self.src = self.img.copy()
        self.H, self.W = self.img.shape[:2]
        self.yy, self.xx = np.mgrid[0:self.H, 0:self.W]

    # ---- selecting ----
    def op(self):
        return self.img[..., 3] > 0.02

    def sel(self, hue=None, sat=None, val=None, lum=None, box=None, poly=None, polys=None, src=True, opaque=True):
        """A mask: hue (lo, hi) in degrees (lo > hi wraps through red), sat/val/lum (lo, hi), a box (x0, y0, x1, y1),
        polygon(s). Read from the original picture (src=True) so earlier changes do not shift the colours."""
        a = self.src if src else self.img
        hd, s, v = hsv_of(a)
        m = (a[..., 3] > 0.02) if opaque else np.ones((self.H, self.W), bool)
        if hue is not None:
            lo, hi = hue
            m &= ((hd >= lo) & (hd <= hi)) if lo <= hi else ((hd >= lo) | (hd <= hi))
        if sat is not None:
            m &= (s >= sat[0]) & (s <= sat[1])
        if val is not None:
            m &= (v >= val[0]) & (v <= val[1])
        if lum is not None:
            L = luma(a)
            m &= (L >= lum[0]) & (L <= lum[1])
        if box is not None:
            m &= region(a.shape, *box)
        if poly is not None:
            m &= poly_mask((self.W, self.H), poly) > 0.5
        if polys is not None:
            mm = np.zeros_like(m)
            for p in polys:
                mm |= poly_mask((self.W, self.H), p) > 0.5
            m &= mm
        return m

    def poly(self, *polys):
        m = np.zeros((self.H, self.W), bool)
        for p in polys:
            m |= poly_mask((self.W, self.H), p) > 0.5
        return m

    def lines_of(self, m, r=2, dark=0.32):
        """The dark line pixels hugging a mask (to recolour with it)."""
        L = luma(self.src)
        return dilate(m, r) & (L < dark) & self.op()

    def grow(self, m, r=2, dark=0.32):
        return m | self.lines_of(m, r, dark)

    def comp(self, m, seed):
        """The connected part of a mask holding the point seed (x, y)."""
        n, lab = cv2.connectedComponents(m.astype(np.uint8), connectivity=8)
        k = lab[seed[1], seed[0]]
        return (lab == k) & m if k else np.zeros_like(m)

    # ---- recolouring ----
    def ramp(self, m, stops, gain=1.0, bias=0.0, soft=None):
        """Recolour by the original luminance through colour stops [(l, (r, g, b)), ...] (keeps the cel steps).
        soft: a float 0..1 mask to blend with instead of the hard one."""
        L = np.clip(luma(self.src) * gain + bias, 0, 1)
        col = ramp(L, stops)
        k = (m.astype(np.float32) if soft is None else soft)[..., None]
        self.img[..., :3] = self.img[..., :3] * (1 - k) + col * k

    def hsv(self, m, hue=None, sat=None, vmul=1.0, vadd=0.0, smul=None):
        hd, s, v = hsv_of(self.src)
        h2 = (hd / 360.0) if hue is None else np.full_like(v, hue / 360.0)
        s2 = (s if sat is None else np.full_like(v, sat)) if smul is None else np.clip(s * smul, 0, 1)
        rgb = hsv_to_rgb(np.stack([h2, s2, np.clip(v * vmul + vadd, 0, 1)], -1))
        self.img[..., :3] = np.where(m[..., None], rgb, self.img[..., :3])

    def multiply(self, m, col, k=1.0):
        c = np.asarray(col, np.float32) / 255.0
        kk = (m.astype(np.float32) * k)[..., None] if m.dtype == bool else (m * k)[..., None]
        self.img[..., :3] = self.img[..., :3] * (1 - kk) + self.img[..., :3] * c * kk

    def flatten(self, m, sigma=6.0, keep_lines=0.22):
        """Smooth away a pattern (argyle, stripes) inside m: its luminance blurred within the mask (the broad shading stays),
        the dark lines (luminance under keep_lines) kept. Later ramps read the smoothed picture."""
        L = luma(self.src)
        mf = m.astype(np.float32)
        num = cv2.GaussianBlur(L * mf, (0, 0), sigma)
        den = cv2.GaussianBlur(mf, (0, 0), sigma)
        sm = np.where(den > 1e-3, num / np.maximum(den, 1e-3), L)
        new = np.where(m & (L >= keep_lines), sm, L)
        k = new / np.maximum(L, 1e-4)
        rgb = np.clip(self.src[..., :3] * k[..., None], 0, 1)
        grey = np.repeat(new[..., None], 3, -1)
        self.src[..., :3] = np.where(m[..., None], grey, self.src[..., :3])

    def erase(self, m):
        self.img[..., 3] = np.where(m, 0, self.img[..., 3])

    def over(self, layer, k=None):
        self.img = over(self.img, layer, k)

    def save(self, path):
        save(self.img, path)


# ---- painting new things in the cel look ----
def shift(m, dx, dy):
    """m moved by (dx, dy) px (no wrap)."""
    out = np.zeros_like(m)
    H, W = m.shape
    xs0, xs1 = max(0, -dx), min(W, W - dx)
    ys0, ys1 = max(0, -dy), min(H, H - dy)
    out[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx] = m[ys0:ys1, xs0:xs1]
    return out


def cel(shape, polys, tones, line=LINE, lw=2.0, shade=7.0, light=3.0, ldir=LIGHT, clip=None, ss=4, outline=True,
        shade2=None, holes=()):
    """A painted shape as an RGBA layer (1x): tones = (shadow, mid, light[, deep]) - the mid tone everywhere, a shade band
    along the side away from the light (shade px, towards ldir), a thin light band on the lit side (light px), a dark line (lw px).
    clip: a 1x bool mask the shape is cut to (its line too). holes: polygons cut out of the shape (with a line round)."""
    H, W = shape[:2]
    cv = Canvas(W, H, ss)
    M = cv.mask(polys)
    if holes:
        M &= ~cv.mask(list(holes))
    if clip is not None:
        M &= np.repeat(np.repeat(clip, ss, 0), ss, 1)
    if not M.any():
        return np.zeros((H, W, 4), np.float32)
    d = np.asarray(ldir, np.float64); d /= np.linalg.norm(d)
    cv.paint(M, tones[1])
    k = int(round(shade * ss))
    sh = M & ~shift(M, int(round(-d[0] * k)), int(round(-d[1] * k)))
    cv.paint(sh, tones[0])
    if shade2 and len(tones) > 3:
        k2 = int(round(shade2 * ss))
        cv.paint(M & ~shift(M, int(round(-d[0] * k2)), int(round(-d[1] * k2))), tones[3])
    if light:
        k = int(round(light * ss))
        lt = M & ~shift(M, int(round(d[0] * k)), int(round(d[1] * k)))
        cv.paint(lt & ~sh, tones[2])
    if outline and lw > 0:
        ol = M & ~erode_ss(M, int(round(lw * ss)))
        cv.paint(ol, line)
    return cv.to_1x(M)


def erode_ss(M, r):
    if r <= 0:
        return M
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.erode(M.astype(np.uint8), k) > 0


def dilate_cv(m, r):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.dilate(m.astype(np.uint8), k) > 0


def erode_cv(m, r):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.erode(m.astype(np.uint8), k) > 0


def strokes(shape, lines, col, width=1.6, alpha=1.0, ss=4, clip=None, taper_to=0.3):
    """Thin tapered strokes (wrinkles, seams, strands): lines = [(p0, p1, p2), ...] quadratic curves -> RGBA layer."""
    H, W = shape[:2]
    cv = Canvas(W, H, ss)
    polys = []
    for ln in lines:
        w = ln[3] if len(ln) > 3 else width
        polys.append(taper(bez(ln[0], ln[1], ln[2], 20), w, w * taper_to, w_mid=w))
    M = cv.mask(polys)
    if clip is not None:
        M &= np.repeat(np.repeat(clip, ss, 0), ss, 1)
    cv.paint(M, col)
    out = cv.to_1x(M)
    out[..., 3] *= alpha
    return out


def dots(shape, pts, col, r=1.4, alpha=1.0, ss=4, clip=None):
    H, W = shape[:2]
    cv = Canvas(W, H, ss)
    polys = []
    for p in pts:
        rr = p[2] if len(p) > 2 else r
        t = np.linspace(0, 2 * np.pi, 12, endpoint=False)
        polys.append([(p[0] + np.cos(a) * rr, p[1] + np.sin(a) * rr * 0.8) for a in t])
    M = cv.mask(polys)
    if clip is not None:
        M &= np.repeat(np.repeat(clip, ss, 0), ss, 1)
    cv.paint(M, col)
    out = cv.to_1x(M)
    out[..., 3] *= alpha
    return out


def ellipse(cx, cy, rx, ry, rot=0.0, n=40, a0=0.0, a1=2 * np.pi):
    t = np.linspace(a0, a1, n, endpoint=(a1 - a0) < 2 * np.pi - 1e-6)
    c, s = np.cos(rot), np.sin(rot)
    return [(cx + (np.cos(a) * rx) * c - (np.sin(a) * ry) * s, cy + (np.cos(a) * rx) * s + (np.sin(a) * ry) * c) for a in t]


def stubble(shape, poly, col, density=0.22, seed=1, alpha=0.55, clip=None):
    """Short dark dots of a few days' beard inside poly (the RTP faces' stubble is fine flat speckle)."""
    H, W = shape[:2]
    m = poly_mask((W, H), poly) > 0.5
    if clip is not None:
        m &= clip
    rng = np.random.RandomState(seed)
    ys, xs = np.nonzero(m)
    if not len(xs):
        return np.zeros((H, W, 4), np.float32)
    n = int(len(xs) * density / 4)
    idx = rng.choice(len(xs), n, replace=False)
    pts = [(xs[i] + rng.uniform(-0.4, 0.4), ys[i] + rng.uniform(-0.4, 0.4), rng.uniform(0.55, 0.95)) for i in idx]
    lay = dots(shape, pts, col, alpha=1.0, clip=m)
    # fade towards the edges of the patch (no hard border)
    fade = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 3.0)
    lay[..., 3] *= np.clip(fade * 1.6, 0, 1) * alpha
    return lay


def blush(shape, cx, cy, rx, ry, col=(240, 120, 110), alpha=0.35, clip=None):
    """A soft flat oval of colour (cheeks) - RTP blush is a soft gradient with a few hatch lines."""
    H, W = shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    a = np.clip(1.0 - d, 0, 1) ** 0.7 * alpha
    if clip is not None:
        a *= clip
    out = np.zeros((H, W, 4), np.float32)
    out[..., :3] = np.asarray(col, np.float32) / 255.0
    out[..., 3] = a
    return out


def chain(shape, path, link=(9, 5.5), gold=((120, 76, 22), (204, 150, 52), (250, 222, 140)), line=LINE, ss=4, every=None, thick=2.5):
    """A chain of oval links along path [(x, y), ...] (alternating flat rings and edge-on bars)."""
    pts = np.asarray(path, np.float64)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    step = every or link[0] * 1.45
    n = int(cum[-1] / step)
    rings, bars, holes = [], [], []
    for i in range(n + 1):
        s = i * step
        j = min(np.searchsorted(cum, s, side='right') - 1, len(seg) - 1)
        t = (s - cum[j]) / max(seg[j], 1e-9)
        p = pts[j] + (pts[j + 1] - pts[j]) * t
        d = (pts[j + 1] - pts[j]) / max(seg[j], 1e-9)
        rot = np.arctan2(d[1], d[0])
        if i % 2 == 0:
            rings.append(ellipse(p[0], p[1], link[0] / 2, link[1] / 2, rot, 28))
            holes.append(ellipse(p[0], p[1], link[0] / 2 - thick, max(link[1] / 2 - thick, 0.6), rot, 20))
        else:
            bars.append(ellipse(p[0], p[1], link[0] / 2 + 0.5, 1.7, rot, 20))
    tones = (gold[0], gold[1], gold[2])
    a = cel(shape, rings, tones, line=line, lw=1.0, shade=1.6, light=1.0, holes=holes, ss=ss)
    b = cel(shape, bars, tones, line=line, lw=1.0, shade=1.2, light=0.8, ss=ss)
    return over(a, b)


def take(src, m):
    """The pixels of src inside mask m as an RGBA layer."""
    out = src.copy()
    out[..., 3] = np.where(m, out[..., 3], 0)
    return out


def warp(layer, M, shape):
    """An RGBA layer through a 2x3 affine matrix (premultiplied, so the edges stay clean)."""
    H, W = shape[:2]
    pm = layer.copy()
    pm[..., :3] *= pm[..., 3:4]
    w = cv2.warpAffine(pm, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    w = np.clip(w, 0, 1)
    a = w[..., 3:4]
    w[..., :3] = np.where(a > 1e-4, w[..., :3] / np.maximum(a, 1e-4), 0)
    return w


def affine(scale=(1.0, 1.0), rot=0.0, src_pt=(0, 0), dst_pt=(0, 0)):
    """The matrix that scales/rotates about src_pt and puts it on dst_pt."""
    c, s = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    A = np.array([[c * scale[0], -s * scale[1]], [s * scale[0], c * scale[1]]])
    t = np.asarray(dst_pt, np.float64) - A @ np.asarray(src_pt, np.float64)
    return np.hstack([A, t[:, None]]).astype(np.float32)


def cast_shadow(b, hat_alpha, dx=4, dy=9, col=(150, 120, 140), k=0.55, blur=0.0):
    """The shadow a hat / brim throws on the head under it (a flat multiplied tone, like the RTP cel shadows)."""
    m = hat_alpha > 0.5
    sh = shift(m, dx, dy) & ~m & b.op()
    soft = sh.astype(np.float32)
    if blur:
        soft = cv2.GaussianBlur(soft, (0, 0), blur)
    b.multiply(soft, col, k)


def compare(paths, out, labels=None, h=273, bg=(36, 36, 44)):
    """Busts side by side at the game's size (273 px high) for a check."""
    ims = [Image.open(p).convert('RGBA') for p in paths]
    ims = [im.resize((round(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    W = sum(im.width for im in ims) + 10 * (len(ims) + 1)
    sheet = Image.new('RGBA', (W, h + 34), bg + (255,))
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    x = 10
    for i, im in enumerate(ims):
        sheet.alpha_composite(im, (x, 28))
        if labels:
            d.text((x + 4, 8), labels[i], fill=(255, 220, 90, 255))
        x += im.width + 10
    sheet.save(out)
    return out


def outline(shape, polys, line=LINE, lw=2.0, clip=None, ss=4, holes=()):
    """Only the dark line round painted shapes (for parts recoloured in place: a vest over a shirt)."""
    H, W = shape[:2]
    cv = Canvas(W, H, ss)
    M = cv.mask(polys)
    if holes:
        M &= ~cv.mask(list(holes))
    ol = M & ~erode_ss(M, int(round(lw * ss)))
    if clip is not None:
        ol &= np.repeat(np.repeat(clip, ss, 0), ss, 1)
    cv.paint(ol, line)
    return cv.to_1x(ol)


def soft_poly(shape, polys, blur=0.0):
    H, W = shape[:2]
    m = np.zeros((H, W), np.float32)
    for p in polys:
        m = np.maximum(m, poly_mask((W, H), p))
    if blur:
        m = cv2.GaussianBlur(m, (0, 0), blur)
    return m


def hat_from(donor, mask_fn, M, shape, stops=None, gain=1.0, bias=0.0):
    """A hat (or cap) cut from another RTP bust: mask_fn(Bust) -> its pixels (with their lines), recoloured through stops,
    moved by the affine matrix M onto this bust."""
    d = Bust(donor)
    m = mask_fn(d)
    if stops is not None:
        d.ramp(m, stops, gain=gain, bias=bias)
    lay = take(d.img, m)
    return warp(lay, M, shape)


def put_hat(b, hat, shadow=(150, 118, 130), shadow_k=0.5, sdx=3, sdy=10, keep=None):
    """Put a hat layer on the bust: what of the head stands out above the hat's lower edge (column by column) goes, the brim
    throws its shadow down onto the face/hair, then the hat goes over. keep: a mask never erased (the ears...)."""
    a = hat[..., 3] > 0.5
    cols = a.any(axis=0)
    low = np.where(cols, (a * np.arange(a.shape[0])[:, None]).max(axis=0), -1)
    above = b.yy < low[None, :]
    cut = above & ~a & cols[None, :]
    if keep is not None:
        cut &= ~keep
    b.erase(cut)
    cast_shadow(b, hat[..., 3], sdx, sdy, shadow, shadow_k)
    b.over(hat)


def beard(shape, outer, inner, tones, line=LINE, strands=(), strand_col=None, seed=1, mous=None, mous_tones=None, ss=4):
    """A painted beard: the band between the jaw's outer edge (outer: points along the jaw, one side to the other) and its
    inner edge under the lips (inner: back the same way) in cel tones, ragged strand tips at the bottom, a few strands; an
    optional moustache polygon over it. -> RGBA layer"""
    edge = strand_edge(outer, side=1, seg=9, tip=5, out=2.4, seed=seed)
    poly = edge + list(inner)
    lay = cel(shape, [poly], tones, line=line, lw=1.8, shade=7, light=2.5, ss=ss)
    if strands:
        lay = over(lay, strokes(shape, strands, strand_col or tones[0], alpha=0.7, clip=lay[..., 3] > 0.5))
    if mous is not None:
        lay = over(lay, cel(shape, [mous], mous_tones or tones, line=line, lw=1.5, shade=3, light=1.5, ss=ss))
    return lay


def hair_strands(shape, mask, flow, light, dark, n=60, length=(7, 14), seed=1, alpha=(0.55, 0.5), width=(1.0, 1.4)):
    """Strands of hair inside mask: short curved strokes running towards the flow point (light and dark in turn)."""
    rng = np.random.RandomState(seed)
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return np.zeros(shape[:2] + (4,), np.float32)
    pick = rng.choice(len(xs), min(n, len(xs)), replace=False)
    lt, dk = [], []
    for i, k in enumerate(pick):
        p = np.array([xs[k], ys[k]], np.float64)
        d = np.asarray(flow, np.float64) - p
        d /= max(np.linalg.norm(d), 1e-6)
        L = rng.uniform(*length)
        bend = np.array([-d[1], d[0]]) * rng.uniform(-2.5, 2.5)
        p1 = p + d * L * 0.5 + bend
        p2 = p + d * L
        w = rng.uniform(*width)
        (lt if i % 2 == 0 else dk).append((tuple(p), tuple(p1), tuple(p2), w))
    a = strokes(shape, lt, light, alpha=alpha[0], clip=mask, taper_to=0.15)
    b = strokes(shape, dk, dark, alpha=alpha[1], clip=mask, taper_to=0.15)
    return over(a, b)


def beard2(shape, outer, inner, tones, flow, line=LINE, mous=None, mous_flow=None, seed=1, n=70, tip=5, out=2.4, seg=9,
           mous_tones=None):
    """A painted beard with hair texture: the band between outer (along the jaw, one side to the other) and inner (back under
    the lips) in cel tones, strands running to flow, a dark line only along the ragged outer edge (the inner edge soft), an
    optional moustache. tones = (shade, mid, light, strand-dark)."""
    edge = strand_edge(outer, side=1, seg=seg, tip=tip, out=out, seed=seed)
    poly = edge + list(inner)
    lay = cel(shape, [poly], tones[:3], outline=False, shade=6, light=3)
    m = lay[..., 3] > 0.5
    lay = over(lay, hair_strands(shape, m, flow, tones[2], tones[3] if len(tones) > 3 else tones[0], n=n, seed=seed))
    ol = strokes(shape, [(edge[i], ((np.asarray(edge[i]) + np.asarray(edge[i + 1])) / 2).tolist(), edge[i + 1], 1.7)
                         for i in range(len(edge) - 1)], line, alpha=1.0, taper_to=1.0)
    lay = over(lay, ol)
    if mous is not None:
        mt = mous_tones or tones
        ml = cel(shape, [mous], mt[:3], line=line, lw=1.4, shade=3, light=1.6)
        mm = ml[..., 3] > 0.5
        ml = over(ml, hair_strands(shape, erode_cv(mm, 1), mous_flow or flow, mt[2], mt[3] if len(mt) > 3 else mt[0], n=n // 3,
                                   length=(5, 9), seed=seed + 1))
        lay = over(lay, ml)
    return lay


# ---- the soft brimmed hat of SF_Actor2_4 (straw for Kuba, leather for Wojciech, black for Lucjan, felt for Jozek) ----
BUCKET = 'SF_Actor2_4'
BUCKET_JOIN = [(78, 48), (100, 44), (120, 43), (140, 44), (160, 46), (180, 50), (200, 56), (214, 63)]   # where the crown meets the brim
BUCKET_BAND = [(214, 53), (200, 46), (180, 40), (160, 36), (140, 34), (120, 33), (100, 34), (78, 38)]   # a band's top edge on the crown


def bucket_mask(d):
    m = d.sel(hue=(185, 240), sat=(0.15, 1), box=(40, 0, 245, 120))
    return d.grow(m, 3, 0.35) & region(d.img.shape, 40, 0, 245, 122)


def tr_pts(M, pts):
    return [tuple(M[:, :2] @ np.array(p, np.float64) + M[:, 2]) for p in pts]


def bucket_hat(M, shape, stops, gain=1.0, bias=0.0, band=None, flatten=0.0):
    """The bucket hat recoloured through stops and moved by M; band: cel tones of a band round the crown (or None)."""
    d = Bust(BUCKET)
    m = bucket_mask(d)
    if flatten:
        d.flatten(m, flatten, keep_lines=0.25)
    d.ramp(m, stops, gain=gain, bias=bias)
    hat = warp(take(d.img, m), M, shape)
    if band:
        ha = hat[..., 3] > 0.5
        hat = over(hat, cel(shape, [tr_pts(M, BUCKET_JOIN + BUCKET_BAND)], band, lw=1.3, shade=3.0, light=1.4, clip=erode_cv(ha, 1)))
    return hat


def feather(shape, quill, tones=((150, 140, 120), (226, 220, 204), (250, 248, 240)), width=11.0, seed=1, line=LINE):
    """A long feather along quill (3 points: base, bend, tip): a vane round a shaft, a few notches, cel-shaded."""
    p = bez(quill[0], quill[1], quill[2], 30)
    vane = taper(p, width * 0.35, width * 0.15, w_mid=width)
    lay = cel(shape, [vane], tones, line=line, lw=1.3, shade=3.0, light=1.5)
    rng = np.random.RandomState(seed)
    notches = []
    for t in (0.35, 0.55, 0.72):
        i = int(t * (len(p) - 1))
        d = p[min(i + 1, len(p) - 1)] - p[max(i - 1, 0)]
        d /= max(np.linalg.norm(d), 1e-6)
        n = np.array([-d[1], d[0]]) * (1 if rng.rand() < 0.5 else -1)
        notches.append((tuple(p[i]), tuple(p[i] + n * width * 0.3 - d * 2), tuple(p[i] + n * width * 0.55 - d * 4), 1.0))
    lay = over(lay, strokes(shape, notches, tones[0], alpha=0.9, clip=lay[..., 3] > 0.5))
    lay = over(lay, strokes(shape, [(tuple(p[0]), tuple(p[15]), tuple(p[-1]), 1.0)], tones[0], alpha=0.8, taper_to=0.2))
    return lay


def fill_holes(m):
    """The mask with every hole inside its outer contours filled."""
    cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros(m.shape, np.uint8)
    cv2.drawContours(out, cs, -1, 1, thickness=-1)
    return out > 0


STEEL_T = ((70, 74, 84), (138, 144, 154), (208, 214, 222))


def kettle_hat(shape, cx, cy, rx, ry, brim_rx, brim_ry, rot=0.0, tones=STEEL_T, line=LINE, rivets=7, brim_dy=0.0):
    """A kettle hat (the town guards' helmet): a steel dome sitting on a wide flat brim, a riveted band. (cx, cy): where the
    dome meets the brim; rot in degrees (the head's tilt). -> RGBA layer"""
    r = np.radians(rot)
    brim = ellipse(cx, cy + brim_dy, brim_rx, brim_ry, r, 60)
    dome = ellipse(cx, cy, rx, ry, r, 50, np.pi, 2 * np.pi)   # (the upper half: y up)
    dome = dome + ellipse(cx, cy, rx, ry * 0.28, r, 24, 0, np.pi)
    b_l = cel(shape, [brim], (tones[0], tones[1], tones[2]), line=line, lw=2.0, shade=5, light=2.5)
    d_l = cel(shape, [dome], (tones[0], tones[1], tones[2]), line=line, lw=2.0, shade=12, light=4)
    lay = over(b_l, d_l)
    # a shine down the dome, the band with rivets
    shine = taper(bez((cx - rx * 0.55, cy - ry * 0.62), (cx - rx * 0.3, cy - ry * 0.95), (cx + rx * 0.05, cy - ry * 0.98), 20), 3.5, 1.0, w_mid=6)
    lay = over(lay, strokes(shape, [(tuple(shine[0]), tuple(shine[len(shine) // 4]), tuple(shine[len(shine) // 2 - 1]), 3.0)], (236, 240, 246),
                            alpha=0.8, clip=d_l[..., 3] > 0.5))
    band = ellipse(cx, cy - ry * 0.02, rx * 1.0, ry * 0.28, r, 40, np.pi * 1.02, np.pi * 1.98)
    lay = over(lay, strokes(shape, [(band[i], band[i + 1], band[i + 1], 1.2) for i in range(len(band) - 1)], line, alpha=0.7, taper_to=1.0))
    pts = []
    for k in range(rivets):
        t = np.pi * (1.1 + 0.8 * k / max(rivets - 1, 1))
        pts.append((cx + np.cos(t) * rx * 0.96 * np.cos(r) - np.sin(t) * ry * 0.18 * np.sin(r),
                    cy + np.cos(t) * rx * 0.96 * np.sin(r) + np.sin(t) * ry * 0.18 * np.cos(r) - 3))
    lay = over(lay, cel(shape, [ellipse(x, y, 2.6, 2.4) for x, y in pts], tones, line=line, lw=0.8, shade=1.2, light=0.8))
    return lay


def horse(shape, x, y, s=1.0, col=(16, 12, 12)):
    """The Lord's black horse: a horse's head and neck in profile, facing left (like a chess knight), for the guards' tabards."""
    P = [(10, 50), (9, 40), (7, 34), (3, 30), (-4, 27), (-8, 25), (-10, 21), (-7, 16), (0, 10), (4, 4), (6, -2), (9, -9), (11, -2),
         (14, 0), (18, 2), (24, 8), (28, 16), (30, 26), (30, 38), (32, 50)]
    poly = [(x + px * s, y + py * s) for px, py in P]
    lay = cel(shape, [poly], (col, col, (70, 60, 60)), line=col, lw=0.8, shade=0, light=1.2, ldir=(0.9, 0.4))
    eye = dots(shape, [(x + 5 * s, y + 13 * s, 1.1 * s)], (150, 40, 40), alpha=0.9)
    return over(lay, eye)
