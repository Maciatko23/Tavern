# (run from tools/art/mewy: python -I build_gull.py ../../../img/system/Bird_Gull.png Bird_Gull_podglad.png; the PixelLab strips: pobrane/)
# The gull's sheet img/system/Bird_Gull.png (2026-11-21, Mewy.js): 10 cells of 40 x 32 (the legs at x 16), facing right, the feet of the ground poses on
# row 29 (as the other birds): 0 stand, 1 peck, 2 wings up, 3 wings down, 4 half (stand tipped 15 deg), 5 deep (peck tipped 6),
# 6 slight (stand tipped 7), 7 glide, 8 walk, 9 walk, 10-17 the wingbeat, 18-21 the glide's flex. From two PixelLab strips (pobrane/mewa_strip.png: -, peck, up, down, glide;
# pobrane/mewa_stoi.png: stand, walk, walk).   python -I build_gull.py <out png> <preview png>
import sys
import numpy as np
from PIL import Image

CELL, CH, FOOT = 40, 32, 29   # (cells 40 wide, 32 high: the long pecking gull fits with its legs where the standing one's are)
strip1 = Image.open('pobrane/mewa_strip.png').convert('RGBA')
strip2 = Image.open('pobrane/mewa_stoi.png').convert('RGBA')


def pieces(im, min_px=30):
    """the birds of a strip, left to right: (image cropped to its box, box)"""
    a = np.array(im)[:, :, 3] > 0
    cols = a.any(axis=0)
    out, x = [], 0
    while x < a.shape[1]:
        if not cols[x]:
            x += 1; continue
        e = x
        while e + 1 < a.shape[1] and cols[e + 1]: e += 1
        box = im.crop((x, 0, e + 1, im.height)).getbbox()
        if box:
            crop = im.crop((x + box[0], box[1], x + box[2], box[3]))
            if (np.array(crop)[:, :, 3] > 0).sum() >= min_px: out.append(crop)
        x = e + 1
    return out


def legs_x(im):
    """the mean x of the pink legs in the lower third (where the feet stand)"""
    a = np.array(im).astype(int)
    h = a.shape[0]
    ys, xs = np.where((a[:, :, 3] > 0) & (a[:, :, 0] > 120) & (a[:, :, 1] < 110) & (a[:, :, 2] < 130))
    keep = ys >= h * 0.6
    return float(xs[keep].mean()) if keep.any() else im.width / 2


LEGS = 16   # (x of the legs in every ground cell: room ahead for the pecking head; Mewy.js anchors the sprite there)
def ground(im, lx=None, target=LEGS):
    """a ground pose in a cell: its lowest pixel on row FOOT, its legs at x `target`"""
    cell = Image.new('RGBA', (CELL, CH))
    lx = legs_x(im) if lx is None else lx
    x = int(round(target - lx))
    x = max(0, min(CELL - im.width, x))
    cell.alpha_composite(im, (x, FOOT + 1 - im.height))
    return cell


def air(im):
    cell = Image.new('RGBA', (CELL, CH))
    if im.width > CELL: im = im.crop(((im.width - CELL) // 2, 0, (im.width - CELL) // 2 + CELL, im.height))
    cell.alpha_composite(im, ((CELL - im.width) // 2, (CH - im.height) // 2))
    return cell


def tip(cell, deg, fx=LEGS, fy=FOOT + 0.5, k=8):
    """the cell tipped forward by `deg` about the feet: 8x nearest, rotated, each 8x8 block its most common colour"""
    big = cell.resize((CELL * k, CH * k), Image.NEAREST)
    big = big.rotate(-deg, resample=Image.NEAREST, center=(fx * k, fy * k))
    a = np.array(big).reshape(CH, k, CELL, k, 4).transpose(0, 2, 1, 3, 4).reshape(CH, CELL, k * k, 4)
    out = np.zeros((CH, CELL, 4), dtype=np.uint8)
    for y in range(CH):
        for x in range(CELL):
            px = [tuple(p) for p in a[y, x]]
            solid = [p for p in px if p[3] > 0]
            if len(solid) * 2 < len(px): continue      # mostly empty: empty
            vals, counts = np.unique(np.array(solid), axis=0, return_counts=True)
            out[y, x] = vals[counts.argmax()]
    return Image.fromarray(out, 'RGBA')


p1 = pieces(strip1)          # peck, up, down, glide (the cut stand at the very left is too small / dropped below)
p1 = [p for p in p1 if p.width >= 14]
assert len(p1) >= 4, [p.size for p in p1]
peck_i, up_i, down_i, glide_i = p1[-4], p1[-3], p1[-2], p1[-1]
p2 = pieces(strip2)
assert len(p2) == 3, [p.size for p in p2]
stand_i, walk1_i, walk2_i = p2

stand = ground(stand_i)
peck = ground(peck_i)
cells = [stand, peck, air(up_i), air(down_i), tip(stand, 15), tip(peck, 6), tip(stand, 7), air(glide_i),
         ground(walk1_i, legs_x(stand_i)), ground(walk2_i, legs_x(stand_i))]
# (2026-11-21, the user: "mogą bardziej szczegółowo, profesjonalnie i płynniej latać") cells 10-17: one whole wingbeat (PixelLab
# animate_image from the wings-up cell, 8 frames looping back to it: pobrane/lot/mach_0..7), cells 18-21: the glide with its wings
# flexing (pobrane/lot/szyb_0..3); all cut from their 64 x 64 canvases at the same window, so the body stays put
LOT = (12, 16, 52, 48)
cells += [Image.open('pobrane/lot/mach_%d.png' % i).convert('RGBA').crop(LOT) for i in range(8)]
cells += [Image.open('pobrane/lot/szyb_%d.png' % i).convert('RGBA').crop(LOT) for i in range(4)]
sheet = Image.new('RGBA', (CELL * len(cells), CH))
for i, c in enumerate(cells): sheet.alpha_composite(c, (i * CELL, 0))
sheet.save(sys.argv[1])
big = sheet.resize((sheet.width * 5, sheet.height * 5), Image.NEAREST)
bg = Image.new('RGBA', big.size, (196, 176, 130, 255))
for i in range(len(cells)):
    for y in range(0, big.height, 5): pass
bg.alpha_composite(big)
from PIL import ImageDraw
d = ImageDraw.Draw(bg)
for i in range(1, len(cells)): d.line([(i * CELL * 5, 0), (i * CELL * 5, big.height)], fill=(120, 100, 70, 255))
d.line([(0, (FOOT + 1) * 5), (big.width, (FOOT + 1) * 5)], fill=(200, 60, 60, 255))
bg.save(sys.argv[2])
print('ok', sheet.size, [c.getbbox() for c in cells])
