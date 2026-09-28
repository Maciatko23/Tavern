"""Browser-free previews: ground-only renders of real map windows (MZ's own autotile table), tiled
textures, zooms and labelled contact sheets (Arial / Segoe UI, so Polish letters work)."""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from . import mz
from . import paths as P
from . import tex as T

_FONTS = [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf", "DejaVuSans.ttf"]


def font(size=16, bold=False):
    names = [r"C:\Windows\Fonts\segoeuib.ttf", r"C:\Windows\Fonts\arialbd.ttf"] if bold else []
    for f in names + _FONTS:
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


def zoom(img, f):
    return img.resize((img.width * f, img.height * f), Image.NEAREST)


def tiled(tex, nx=4, ny=3):
    a = np.tile(np.asarray(tex)[..., :3] if not isinstance(tex, Image.Image) else np.asarray(tex.convert("RGB")), (ny, nx, 1))
    return T.to_img(a.astype(float))


def on_bg(img, rgb=(255, 0, 255)):
    bg = Image.new("RGBA", img.size, rgb + (255,))
    bg.alpha_composite(img.convert("RGBA"))
    return bg.convert("RGB")


def find_windows(kind, w=13, h=9, maps=None, top=3, layer=1):
    """Map windows (map, dx, dy) with the most cells of 'kind' next to other ground (edges visible)."""
    out = []
    for mid in maps or mz.outdoor_maps():
        g = mz.map_kind_mask(mid, [kind], layer)
        H, W = g.shape
        if g.sum() == 0:
            continue
        best = []
        for dy in range(0, max(1, H - h + 1), 2):
            for dx in range(0, max(1, W - w + 1), 2):
                win = g[dy:dy + h, dx:dx + w]
                n = win.sum()
                edge = (win & ~np.roll(win, 1, 0)).sum() + (win & ~np.roll(win, 1, 1)).sum()
                best.append((min(n, w * h * 0.45) + 0.5 * edge, dx, dy))
        best.sort(reverse=True)
        for sc, dx, dy in best[:1]:
            out.append((sc, mid, dx, dy))
    out.sort(reverse=True)
    return [(m, dx, dy) for _, m, dx, dy in out[:top]]


def labelled(items, cols=None, pad=8, title=None, bg=(24, 24, 24), fg=(255, 226, 120), size=16):
    """items: [(label, PIL image)] -> one sheet, 'cols' per row, labels above."""
    cols = cols or len(items)
    F = font(size)
    FT = font(size + 2, True)
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    tw = lambda t, f=F: int(probe.textlength(t, font=f)) + 4
    rows = [items[i:i + cols] for i in range(0, len(items), cols)]
    lab_h = size + 8
    col_w = [max(max(r[c][1].width, tw(r[c][0])) for r in rows if c < len(r)) for c in range(cols)]
    row_h = [max(im.height for _, im in r) + lab_h for r in rows]
    top = (size + 14) if title else 0
    W = max(sum(col_w) + pad * (cols + 1), tw(title, FT) + 2 * pad if title else 0)
    H = sum(row_h) + pad * (len(rows) + 1) + top
    out = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(out)
    if title:
        d.text((pad, 4), title, fill=(255, 255, 255), font=FT)
    y = pad + top
    for r, rh in zip(rows, row_h):
        x = pad
        for c, (lab, im) in enumerate(r):
            d.text((x, y), lab, fill=fg, font=F)
            out.paste(im.convert("RGB"), (x, y + lab_h))
            x += col_w[c] + pad
        y += rh + pad
    return out


def render_window(sheet_img, map_id, dx, dy, w=13, h=9, remap=None):
    return mz.render_map(sheet_img, map_id, dx, dy, w, h, remap).convert("RGB")
