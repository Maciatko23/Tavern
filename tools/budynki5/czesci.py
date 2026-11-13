# -*- coding: utf-8 -*-
"""PixelLab props (czesci/pixellab/*_raw.png, generated 2026-11-09 with create_map_object) -> czesci/<name>.png in the town's look:
colours snapped to a palette taken from the tileset 11 sheets and the town's prop sheets (no dither, hard alpha), grass tufts removed,
ravens reduced to bird size.   python tools/budynki5/czesci.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib5
from PIL import Image
RAW = os.path.join(HERE, 'czesci', 'pixellab'); OUT = os.path.join(HERE, 'czesci')
_P = []
def palette():
    if not _P:
        z = lib5.zest(); ims = [z.sheet(i) for i in (2, 3, 5, 6, 8)]
        for n in ('!Town_Props', '!House_Town', '!Tavern_Yard', '!Signs'):
            ims.append(Image.open(os.path.join(lib5.ROOT, 'img', 'characters', n + '.png')).convert('RGBA'))
        W = sum(i.width for i in ims); H = max(i.height for i in ims); pk = Image.new('RGB', (W, H)); x = 0
        for i in ims: pk.paste(i.convert('RGB'), (x, 0), i.split()[3]); x += i.width
        _P.append(pk.quantize(colors=255, method=Image.MEDIANCUT))
    return _P[0]
def snap(im):
    a = im.split()[3].point(lambda v: 255 if v > 127 else 0)
    o = im.convert('RGB').quantize(palette=palette(), dither=Image.NONE).convert('RGBA'); o.putalpha(a); return o
def no_grass(im, rows=14):
    """drop green pixels in the bottom `rows` (PixelLab's grass tufts at the feet)"""
    px = im.load()
    for y in range(im.height - rows, im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and g > r + 12 and g > b + 8: px[x, y] = (0, 0, 0, 0)
    return im
def half(im):
    """2:1 reduction that keeps the dark outline: each 2x2 block -> its most opaque, darkest-weighted pixel"""
    w, h = im.width // 2, im.height // 2; src = im.load(); o = Image.new('RGBA', (w, h)); dst = o.load()
    for y in range(h):
        for x in range(w):
            blk = [src[2 * x + i, 2 * y + j] for j in (0, 1) for i in (0, 1)]
            op = [p for p in blk if p[3] > 127]
            if len(op) < 2: dst[x, y] = (0, 0, 0, 0); continue
            op.sort(key=lambda p: sum(p[:3])); dst[x, y] = op[len(op) // 2 - (1 if len(op) == 4 else 0)]
    return o
def crop(im): return im.crop(im.getbbox())
if __name__ == '__main__':
    ld = lambda n: Image.open(os.path.join(RAW, n + '_raw.png')).convert('RGBA')
    jobs = {'kociol': crop(snap(ld('kociol'))), 'szyld_krowa': crop(snap(ld('szyld_krowa'))), 'dyby': crop(snap(no_grass(ld('dyby')))),
            'uzdy': crop(snap(ld('uzdy'))), 'kruk_L': crop(snap(half(ld('kruk_L')))), 'kruk_R': crop(snap(half(ld('kruk_R'))))}
    for n, im in jobs.items(): im.save(os.path.join(OUT, n + '.png')); print(n, im.size)
