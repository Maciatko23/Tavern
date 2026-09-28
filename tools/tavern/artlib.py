# Shared helpers for the tavern's new props (props_art.py): loading Winlu pieces, premultiplied downscaling of PixelLab
# pictures, hard alpha, the Winlu-like soft drop shadow, outlines, colour grading towards Winlu's wood, and small
# painting primitives (anti-aliased shapes drawn 4x larger and reduced).
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# pictures made from numpy arrays share the array's memory and are read-only: always hand out a writable copy
_fromarray = Image.fromarray
if not getattr(Image.fromarray, "_copying", False):
    def _fromarray_copy(*a, **k):
        return _fromarray(*a, **k).copy()
    _fromarray_copy._copying = True
    Image.fromarray = _fromarray_copy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
WINLU = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/"
SRC = os.path.join(HERE, "props_src")
SHEETS = {"B": "Fantasy_Inside_B", "C": "Fantasy_Inside_C", "D": "Fantasy_Inside_D", "E": "Fantasy_Inside_Shops",
          "A2": "Fantasy_Inside_A2", "A3": "Fantasy_Inside_A3", "A4": "Fantasy_Inside_A4", "A5": "Fantasy_Inside_A5"}
_cache = {}

def sheet(name):
    if name not in _cache:
        p = WINLU + "tilesets/" + SHEETS[name] + ".png" if name in SHEETS else WINLU + "characters/" + name + ".png"
        _cache[name] = Image.open(p).convert("RGBA")
    return _cache[name]

def cell(name, c, r, w=1, h=1):
    """a block of 48 px cells from a Winlu tile sheet"""
    return sheet(name).crop((c * 48, r * 48, (c + w) * 48, (r + h) * 48))

def char_frame(name, index, direction, pattern):
    im = sheet(name)
    W, H = im.size
    big = os.path.basename(name).startswith("!$") or os.path.basename(name).startswith("$")
    if big:
        fw, fh = W // 3, H // 4
        col, row = pattern, direction // 2 - 1
    else:
        fw, fh = W // 12, H // 8
        col, row = (index % 4) * 3 + pattern, (index // 4) * 4 + direction // 2 - 1
    return im.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))

def bbox(im, t=8):
    a = np.array(im)[:, :, 3]
    ys, xs = np.nonzero(a > t)
    if not len(xs): return (0, 0, 0, 0)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)

def premul_resize(img, size, flt=Image.LANCZOS):
    a = np.array(img.convert("RGBA")).astype(np.float32) / 255.0
    pre = np.concatenate([a[:, :, :3] * a[:, :, 3:4], a[:, :, 3:4]], axis=2)
    chans = [np.array(Image.fromarray((pre[:, :, c] * 255 + 0.5).astype(np.uint8), "L").resize(size, flt)).astype(np.float32) / 255.0 for c in range(4)]
    o = np.stack(chans, axis=2)
    al = o[:, :, 3:4]
    rgb = np.where(al > 0.002, o[:, :, :3] / np.maximum(al, 0.002), 0)
    return Image.fromarray((np.concatenate([np.clip(rgb, 0, 1), np.clip(al, 0, 1)], axis=2) * 255 + 0.5).astype(np.uint8), "RGBA")

def harden(img, t=110):
    """binary alpha like Winlu's objects (their only soft alpha is the drop shadow)"""
    a = np.array(img)
    a[:, :, 3] = np.where(a[:, :, 3] >= t, 255, 0)
    return Image.fromarray(a, "RGBA")

def sharpen(img, radius=0.8, percent=60):
    rgb = img.convert("RGB").filter(ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=2))
    out = rgb.convert("RGBA"); out.putalpha(img.getchannel("A"))
    return out

def reduce(img, factor, sharp=True, t=110):
    """a PixelLab picture made larger -> game size: premultiplied Lanczos, crisp alpha, a light unsharp mask"""
    w, h = img.size
    out = premul_resize(img, (max(1, round(w * factor)), max(1, round(h * factor))))
    if sharp: out = sharpen(out)
    return harden(out, t)

def grade(img, sat=0.9, warm=0.0, gamma=1.0, contrast=1.0):
    """nudges colours towards Winlu's muted look: less saturation, a touch of warmth, softer contrast"""
    a = np.array(img).astype(np.float32)
    rgb = a[:, :, :3] / 255.0
    lum = (rgb * np.array([0.299, 0.587, 0.114])).sum(axis=2, keepdims=True)
    rgb = lum + (rgb - lum) * sat
    rgb = 0.5 + (rgb - 0.5) * contrast
    rgb = np.clip(rgb, 0, 1) ** gamma
    rgb[:, :, 0] += warm; rgb[:, :, 2] -= warm
    a[:, :, :3] = np.clip(rgb, 0, 1) * 255
    return Image.fromarray(a.astype(np.uint8), "RGBA")

SHADOW = (40, 34, 40)
def drop_shadow(img, dx=4, dy=3, alpha=0.38, blur=1.2, shrink=0):
    """Winlu's soft grey shadow to the lower right, under the object (only where the object is not)"""
    a = np.array(img).astype(np.float32)
    al = a[:, :, 3] / 255.0
    sh = np.zeros_like(al)
    H, W = al.shape
    sh[max(0, dy):, max(0, dx):] = al[:H - max(0, dy), :W - max(0, dx)]
    shi = Image.fromarray((sh * 255).astype(np.uint8), "L")
    if shrink: shi = shi.filter(ImageFilter.MinFilter(shrink * 2 + 1))
    shi = shi.filter(ImageFilter.GaussianBlur(blur))
    sa = np.array(shi).astype(np.float32) / 255.0 * alpha
    out = np.zeros_like(a)
    out[:, :, 0], out[:, :, 1], out[:, :, 2] = SHADOW
    out[:, :, 3] = sa * 255
    base = Image.fromarray(out.astype(np.uint8), "RGBA")
    base.alpha_composite(img)
    return base

def ellipse_shadow(size, box, alpha=0.35, blur=2.0):
    """a soft oval shadow on the floor (under round things)"""
    w, h = size
    m = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(m).ellipse([v * 4 for v in box], fill=255)
    m = m.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur))
    out = Image.new("RGBA", (w, h), SHADOW + (0,))
    out.putalpha(m.point(lambda v: int(v * alpha)))
    return out

def outline(img, colour=(43, 29, 20, 255), where=None):
    """a 1 px dark outline round the opaque shape (Winlu: dark brown, not black)"""
    a = np.array(img)
    al = a[:, :, 3] > 0
    H, W = al.shape
    grown = al.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sh = np.zeros_like(al)
        sh[max(0, dy):H + min(0, dy), max(0, dx):W + min(0, dx)] = al[max(0, -dy):H - max(0, dy), max(0, -dx):W - max(0, dx)]
        grown |= sh
    ring = grown & ~al
    a[ring] = colour
    return Image.fromarray(a, "RGBA")

class Canvas4:
    """draw at 4x with anti-aliasing, then reduce to 1x (soft painted edges, like Winlu's)"""
    def __init__(self, w, h, k=4):
        self.w, self.h, self.k = w, h, k
        self.im = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
    def s(self, *v):
        return [x * self.k for x in v]
    def rect(self, x0, y0, x1, y1, fill, outline=None, width=1):
        self.d.rectangle(self.s(x0, y0, x1, y1), fill=fill, outline=outline, width=max(1, int(round(width * self.k))) if outline else 0)
    def rrect(self, x0, y0, x1, y1, r, fill, outline=None, width=1):
        self.d.rounded_rectangle(self.s(x0, y0, x1, y1), radius=r * self.k, fill=fill, outline=outline, width=max(1, int(round(width * self.k))) if outline else 0)
    def ellipse(self, x0, y0, x1, y1, fill, outline=None, width=1):
        self.d.ellipse(self.s(x0, y0, x1, y1), fill=fill, outline=outline, width=max(1, int(round(width * self.k))) if outline else 0)
    def poly(self, pts, fill, outline=None):
        self.d.polygon([(x * self.k, y * self.k) for x, y in pts], fill=fill, outline=outline)
    def line(self, pts, fill, width=1):
        self.d.line([(x * self.k, y * self.k) for x, y in pts], fill=fill, width=max(1, int(width * self.k)))
    def arc(self, box, start, end, fill, width=1):
        self.d.arc(self.s(*box), start, end, fill=fill, width=max(1, int(width * self.k)))
    def done(self, t=90):
        out = premul_resize(self.im, (self.w, self.h), Image.BOX)
        return harden(out, t) if t else out

def paste(dst, src, x, y):
    dst.alpha_composite(src, (int(x), int(y)))
    return dst

def recolour(img, hue_shift=0.0, sat=1.0, val=1.0):
    """HSV change of a Winlu piece (alpha kept)"""
    rgb = img.convert("RGB")
    hsv = np.array(rgb.convert("HSV")).astype(np.float32)
    hsv[:, :, 0] = (hsv[:, :, 0] + hue_shift * 255 / 360.0) % 255
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * sat, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * val, 0, 255)
    out = Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGBA")
    out.putalpha(img.getchannel("A"))
    return out
