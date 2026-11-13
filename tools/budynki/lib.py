# -*- coding: utf-8 -*-
"""Shared helpers: pack sheets, cuts, palette snap, door frames. Used by zbuduj.py."""
import os
import numpy as np, cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); CZ = os.path.join(HERE, 'czesci')
PACK = 'C:/Program Files (x86)/Steam/steamapps/common/RPG Maker MZ/dlc/Fantastic Buildings - Medieval/Tilesets/'
_S = {}
def sheet(n):
    if n not in _S: _S[n] = Image.open(PACK + n + '.png').convert('RGBA')
    return _S[n]
def crop(n, x0, y0, x1, y1): return sheet(n).crop((x0, y0, x1, y1))
def part(n): return Image.open(os.path.join(CZ, n + '.png')).convert('RGBA')
def vcut(im, spans):
    """remove row spans [(a,b),...] (a<=y<b) from the picture"""
    keep = [y for y in range(im.height) if not any(a <= y < b for a, b in spans)]
    out = Image.new('RGBA', (im.width, len(keep)))
    for i, y in enumerate(keep): out.paste(im.crop((0, y, im.width, y + 1)), (0, i))
    return out
def tile_w(p, w):
    o = Image.new('RGBA', (w, p.height))
    for k, x in enumerate(range(0, w, p.width)): o.paste(p if k % 2 == 0 else p.transpose(Image.FLIP_LEFT_RIGHT), (x, 0))
    return o
_Q = []
def snap(im):
    """snap the colours to a 255-colour palette taken from the pack sheets; alpha kept hard"""
    if not _Q:
        names = ['City_TileB', 'City_TileC', 'City_TileD', 'City_TileE', 'Rural_TileC', 'Rural_TileD', 'Rural_TileE']
        pk = Image.new('RGB', (768 * len(names), 768))
        for i, n in enumerate(names): s = sheet(n); pk.paste(s.convert('RGB'), (768 * i, 0), s.split()[3])
        _Q.append(pk.quantize(colors=255, method=Image.MEDIANCUT))
    a = im.split()[3]
    o = im.convert('RGB').quantize(palette=_Q[0], dither=Image.NONE).convert('RGBA')
    o.putalpha(a.point(lambda v: 255 if v > 127 else 0)); return o
def sheet3x4(fr, n=1):
    s = Image.new('RGBA', (fr.width * 3, fr.height * 4))
    for r in range(4):
        for c in range(3): s.paste(fr, (c * fr.width, r * fr.height))
    return s
def leaf_mask(im, box):
    a = np.asarray(im).astype(np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3]
    hsv = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
    wood = (al > 0.5) & (h >= 6) & (h <= 40) & (s > 0.22) & (v > 0.10) & (v < 0.66)
    iron = (al > 0.5) & (v < 0.22)
    mk = (wood | iron).astype(np.uint8)
    x0, x1, y0, y1 = box; bx = np.zeros_like(mk); bx[y0:y1 + 1, x0:x1 + 1] = 1; mk &= bx
    mk = cv2.morphologyEx(mk, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    out = np.zeros(mk.shape, bool)
    for yy in range(mk.shape[0]):
        xs = np.where(mk[yy])[0]
        if len(xs) >= 4: out[yy, xs.min():xs.max() + 1] = True
    return out if out.sum() >= 150 else None
def door_frames(img, cx, fw, fh, box):
    """img: the building; cx: the door's centre x; frame fw x fh at the building's bottom; box: the leaf's (x0,x1,y0,y1) in frame coords.
    returns 4 frames (closed = the picture's own pixels, then the leaf turning to the left hinge with dark inside)"""
    H = img.height
    fr = img.crop((cx - fw // 2, H - fh, cx + fw // 2, H))
    mk = leaf_mask(fr, box)
    if mk is None: return None, None
    base = np.asarray(fr).copy(); out = [base]
    for k in (0.62, 0.34, 0.12):
        f = base.copy()
        for yy in range(mk.shape[0]):
            row = np.where(mk[yy])[0]
            if not len(row): continue
            t = yy / mk.shape[0]
            f[yy, row] = np.array([24 + 14 * t, 17 + 9 * t, 12 + 6 * t, 255])
        for yy in range(mk.shape[0]):
            row = np.where(mk[yy])[0]
            if not len(row): continue
            a, b = row.min(), row.max(); w = b - a + 1; nw = max(2, int(round(w * k)))
            idx = np.clip((np.arange(nw) * (w / nw)).astype(int), 0, w - 1)
            seg = base[yy, a:b + 1][idx].astype(np.float32); seg[..., :3] *= 0.80 + 0.2 * k
            f[yy, a:a + nw] = seg.astype(np.uint8)
            if a + nw < fw: f[yy, a + nw] = [10, 7, 5, 255]
        out.append(f)
    return out, mk
def door_sheet(fr):
    h, w = fr[0].shape[:2]; s = np.zeros((4 * h, 3 * w, 4), np.uint8)
    for r, f in enumerate(fr):
        for c in range(3): s[r * h:(r + 1) * h, c * w:(c + 1) * w] = f
    return Image.fromarray(s, 'RGBA')
