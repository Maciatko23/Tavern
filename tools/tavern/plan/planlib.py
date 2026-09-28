# Drawing helpers for the tavern floor plans (make_plan.py): the parchment sheet (the quest board's paper recipe:
# tools/questboard/qblib.py), ink and watercolour layers drawn 3x larger and reduced, multiply blending, the fonts.
import os, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "questboard"))
from qblib import fbm, stretched, hexrgb, norm01   # noqa: E402

FONTS = os.path.join(ROOT, "fonts")
HAND = os.path.join(FONTS, "Caveat-Regular.ttf")
HAND_B = os.path.join(FONTS, "Caveat-Bold.ttf")
CAPS = os.path.join(FONTS, "AlegreyaSC-Bold.ttf")
_fonts = {}
def font(path, size):
    k = (path, size)
    if k not in _fonts: _fonts[k] = ImageFont.truetype(path, size)
    return _fonts[k]

INK = (46, 30, 18)            # the plan's sepia ink
INK_SOFT = (92, 66, 42)
K = 3                         # supersampling of the ink and wash layers

def rng_for(tag):
    h = 2166136261
    for ch in tag.encode("utf8"):
        h = ((h ^ ch) * 16777619) & 0xFFFFFFFF
    return np.random.default_rng(h)

# ------------------------------------------------------------------------------------------------ parchment
def parchment(w, h, tag, light="#efe2c0", dark="#d6bd8c"):
    """RGB float array: the quest board's paper (blotches, grain, fibres, foxing) with darker, browned edges, two faint
    folds (the plan was carried folded in four) and an old tankard ring"""
    rng = rng_for(tag)
    big = fbm(w, h, 150, 4, rng)
    mid = fbm(w, h, 30, 4, rng)
    fine = fbm(w, h, 2, 2, rng)
    fib = stretched(w, h, 3, 2, rng, sx=5, sy=1)
    v = 0.66 + 0.26 * (big - 0.5) + 0.14 * (mid - 0.5) + 0.06 * (fine - 0.5) + 0.04 * (fib - 0.5)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # browned edges: distance to the border, bent by noise
    edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
    wob = fbm(w, h, 40, 3, rng) * 22
    e = np.clip((edge + wob - 6) / 70.0, 0, 1)
    v = v * (0.72 + 0.28 * e ** 0.6)
    lc, dc = hexrgb(light), hexrgb(dark)
    rgb = dc + (lc - dc) * np.clip(v, 0, 1.15)[..., None]
    # the folds: a soft shadow line with a lit side
    for (fx, fy) in ((w * 0.5, None), (None, h * 0.5)):
        if fx is not None:
            d = xx - fx
        else:
            d = yy - fy
        crease = np.exp(-(d / 1.6) ** 2) * 0.075 - np.exp(-((d - 2.6) / 2.2) ** 2) * 0.03
        rgb *= (1 - crease)[..., None]
    img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB")
    dr = ImageDraw.Draw(img, "RGBA")
    for _ in range(int(w * h / 900)):     # fibres
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        a, ln = rng.uniform(0, math.pi), rng.uniform(3, 10)
        c = (120, 95, 60, int(rng.integers(8, 22))) if rng.random() < 0.6 else (255, 250, 235, int(rng.integers(10, 26)))
        dr.line([x, y, x + math.cos(a) * ln, y + math.sin(a) * ln], fill=c, width=1)
    for _ in range(int(w * h / 9000)):    # foxing
        x, y, r = rng.uniform(0, w), rng.uniform(0, h), rng.uniform(0.6, 2.0)
        dr.ellipse([x - r, y - r, x + r, y + r], fill=(120, 80, 40, int(rng.integers(16, 46))))
    return np.asarray(img, dtype=np.float32)

def ring_stain(rgb, x, y, r, rng, strength=1.0):
    """a tankard's wet ring, long dried: a darker wobbly edge, a faint inside"""
    h, w = rgb.shape[:2]
    pts = []
    for k in range(36):
        a = k / 36 * math.tau
        rr = r * (1 + 0.05 * math.sin(a * 3 + rng.uniform(0, 6)) + 0.03 * math.sin(a * 7 + rng.uniform(0, 6)))
        pts.append((x + math.cos(a) * rr, y + math.sin(a) * rr * 0.96))
    ring = Image.new("L", (w, h), 0)
    ImageDraw.Draw(ring).line(pts + [pts[0]], fill=255, width=2)
    ring = ring.filter(ImageFilter.GaussianBlur(1.3))
    fill = Image.new("L", (w, h), 0)
    ImageDraw.Draw(fill).polygon(pts, fill=255)
    fill = fill.filter(ImageFilter.GaussianBlur(5))
    a = np.asarray(ring, np.float32)[..., None] / 255 * 0.13 * strength + np.asarray(fill, np.float32)[..., None] / 255 * 0.035 * strength
    return rgb * (1 - a) + np.array([130, 92, 50], np.float32) * a

def deckle_alpha(w, h, tag, inset=3):
    """the sheet's torn-soft edge: an alpha mask a few px in from the border, wobbling"""
    rng = rng_for(tag + "deckle")
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
    n = fbm(w, h, 6, 3, rng) * 3.2 + fbm(w, h, 30, 2, rng) * 2.0
    a = np.clip((edge - inset + n - 2.0) / 1.4, 0, 1)
    return a

# ------------------------------------------------------------------------------------------------ layers (drawn at K x)
class Layer:
    """an RGBA drawing at K times the size: .d draws in 1x coordinates through .box/.pt helpers"""
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w * K, h * K), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
    def rect(self, x0, y0, x1, y1, fill):
        self.d.rectangle([x0 * K, y0 * K, x1 * K - 1, y1 * K - 1], fill=fill)
    def line(self, pts, fill, width=1.0):
        self.d.line([(x * K, y * K) for x, y in pts], fill=fill, width=max(1, int(round(width * K))), joint="curve")
    def poly(self, pts, fill, outline=None, width=1.0):
        self.d.polygon([(x * K, y * K) for x, y in pts], fill=fill)
        if outline: self.line(list(pts) + [pts[0]], outline, width)
    def ellipse(self, x0, y0, x1, y1, fill=None, outline=None, width=1.0):
        self.d.ellipse([x0 * K, y0 * K, x1 * K, y1 * K], fill=fill, outline=outline, width=max(1, int(round(width * K))) if outline else 0)
    def arc(self, box, a0, a1, fill, width=1.0):
        self.d.arc([v * K for v in box], a0, a1, fill=fill, width=max(1, int(round(width * K))))
    def text(self, x, y, s, fnt_path, size, fill, anchor="mm", spacing=0):
        f = font(fnt_path, int(round(size * K)))
        if spacing:
            # letter spacing: glyph by glyph (the anchor's horizontal part is honoured for the whole line)
            widths = [f.getlength(ch) for ch in s]
            total = sum(widths) + spacing * K * (len(s) - 1)
            cx = x * K - (total / 2 if anchor[0] == "m" else total if anchor[0] == "r" else 0)
            for ch, cw in zip(s, widths):
                self.d.text((cx, y * K), ch, font=f, fill=fill, anchor="l" + anchor[1])
                cx += cw + spacing * K
            return total / K
        self.d.text((x * K, y * K), s, font=f, fill=fill, anchor=anchor)
        return f.getlength(s) / K
    def reduce(self):
        """-> RGBA float array at 1x (premultiplied box filter: clean anti-aliased edges)"""
        a = np.asarray(self.im, dtype=np.float32) / 255.0
        pre = np.concatenate([a[..., :3] * a[..., 3:4], a[..., 3:4]], axis=2)
        h, w = self.h, self.w
        pre = pre.reshape(h, K, w, K, 4).mean(axis=(1, 3))
        al = pre[..., 3:4]
        rgb = np.where(al > 1e-4, pre[..., :3] / np.maximum(al, 1e-4), 0)
        return np.concatenate([rgb, al], axis=2)

def text_width(s, fnt_path, size):
    return font(fnt_path, int(round(size * K))).getlength(s) / K

def multiply(base, layer, strength=1.0):
    """base: HxWx3 float 0..255; layer: HxWx4 float (rgb 0..1, a 0..1) - the ink or wash soaks into the paper"""
    a = layer[..., 3:4] * strength
    tint = layer[..., :3]
    return base * (1 - a + a * tint)

def over(base, layer, strength=1.0):
    a = layer[..., 3:4] * strength
    return base * (1 - a) + layer[..., :3] * 255 * a

def noise_mul(h, w, tag, lo=0.82, hi=1.08, cell=18):
    rng = rng_for(tag)
    n = fbm(w, h, cell, 3, rng)
    return lo + (hi - lo) * norm01(n)
