# python tools/anim8/build_pose.py <animal>      (animals: see ANIMALS below; tools/anim8/frames/<frames>/<direction>/<i>.png in)
# An 8-way pose sheet for an animal (its breathing when it stands, ...) made from one PixelLab animation, so it sits on the animal's
# walking sheet: the same size (scaled by the walk's standing frame of each row), the same feet line and middle, the walk's own colours
# (snapped to them - matching the colours some other way gave blotches on the bear), a 1 px dark outline.
#   img/characters/anim8/<out>.png - 8 rows (S, SW, W, NW, N, NE, E, SE) x (1 + frames) cells: col 0 the first (resting) frame, then
#   the frames (Hunting.js LOOK8 plays cols 1..n by itself for `idle`). West rows are the east ones mirrored (PixelLab gives 5 ways).
# Frames: tools/anim8/fetch_frames.py <get_character dump> <animation> <frames folder>.
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, '..', '..'))
DIRS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east']
MIRROR = {'west': 'east', 'south-west': 'south-east', 'north-west': 'north-east'}
ANIMALS = {
    # frames folder, the walking sheet it must sit on, its cell, the sheet made
    'wolf': dict(frames='wolf_breathe', walk='Wolf_Walk8', cell=68, out='Wolf_Idle8'),
    'boar': dict(frames='boar_breathe', walk='Boar_Walk8', cell=76, out='Boar_Idle8'),
}


def opaque_box(im):
    return im.getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()


def centroid_x(im):
    a = im.getchannel('A').load(); w, h = im.size; s = n = 0
    for y in range(h):
        for x in range(w):
            if a[x, y] >= 128: s += x; n += 1
    return s / max(1, n)


class Palette:
    """the colours of the walking sheet (outline = its darkest)"""
    def __init__(self, sheet):
        seen = {}
        for r, g, b, a in sheet.getdata():
            if a >= 200: seen[(r, g, b)] = seen.get((r, g, b), 0) + 1
        self.cols = [c for c, n in seen.items() if n >= 3]
        self.dark = min(self.cols, key=sum)
        self.cache = {}

    def snap(self, c):
        if c not in self.cache:
            self.cache[c] = min(self.cols, key=lambda p: (p[0] - c[0]) ** 2 * 3 + (p[1] - c[1]) ** 2 * 4 + (p[2] - c[2]) ** 2 * 2)
        return self.cache[c]


def shrink(im, k, pal):
    """premultiplied box resize by k, alpha cut at half, palette snap, a 1 px dark outline (as tools/bear/build_bear.py)"""
    w, h = im.size
    nw, nh = max(1, round(w * k)), max(1, round(h * k))
    pre = Image.new('RGBA', im.size)
    px = im.load(); pp = pre.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            pp[x, y] = (r * a // 255, g * a // 255, b * a // 255, a)
    sm = pre.resize((nw, nh), Image.BOX) if (nw, nh) != (w, h) else pre
    out = Image.new('RGBA', (nw, nh), (0, 0, 0, 0))
    sp = sm.load(); op = out.load()
    for y in range(nh):
        for x in range(nw):
            r, g, b, a = sp[x, y]
            if a < 110: continue
            op[x, y] = pal.snap((r * 255 // a, g * 255 // a, b * 255 // a)) + (255,)
    edge = []
    for y in range(nh):
        for x in range(nw):
            if op[x, y][3] == 0: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                X, Y = x + dx, y + dy
                if X < 0 or Y < 0 or X >= nw or Y >= nh or op[X, Y][3] == 0: edge.append((x, y)); break
    for x, y in edge: op[x, y] = pal.dark + (255,)
    return out


def build(name):
    a = ANIMALS[name]
    cell = a['cell']
    walk = Image.open(os.path.join(GAME, 'img', 'characters', 'anim8', a['walk'] + '.png')).convert('RGBA')
    pal = Palette(walk)
    src = os.path.join(HERE, 'frames', a['frames'])
    rows = {}
    for d in DIRS:
        base = MIRROR.get(d, d)
        folder = os.path.join(src, base)
        files = sorted((f for f in os.listdir(folder) if f.endswith('.png')), key=lambda f: int(f[:-4]))
        frames = [Image.open(os.path.join(folder, f)).convert('RGBA') for f in files]
        if d in MIRROR: frames = [f.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for f in frames]
        # the walk's standing frame of this row: the size, the middle and the feet to sit on
        r = DIRS.index(d)
        stand = walk.crop((0, r * cell, cell, (r + 1) * cell))
        sb = opaque_box(stand)
        fb = opaque_box(frames[0])
        k = (sb[3] - sb[1]) / (fb[3] - fb[1])   # one scale for the row (by its first, resting frame): the breathing keeps its motion
        small = [shrink(f, k, pal) for f in frames]
        b0 = opaque_box(small[0])
        ox = round(centroid_x(stand) - centroid_x(small[0]))
        oy = sb[3] - b0[3]
        cells = []
        for f in small:
            c = Image.new('RGBA', (cell, cell), (0, 0, 0, 0))
            tmp = Image.new('RGBA', (cell, cell), (0, 0, 0, 0))
            tmp.paste(f, (ox, oy), f)
            c.alpha_composite(tmp)
            cells.append(c)
        rows[d] = cells
        print('%-11s %d frames  scale %.3f  offset (%d, %d)' % (d, len(cells), k, ox, oy))
    n = max(len(c) for c in rows.values())
    sheet = Image.new('RGBA', (n * cell, 8 * cell), (0, 0, 0, 0))
    for r, d in enumerate(DIRS):
        for i, c in enumerate(rows[d]): sheet.paste(c, (i * cell, r * cell))
    out = os.path.join(GAME, 'img', 'characters', 'anim8', a['out'] + '.png')
    sheet.save(out)
    print('->', out, sheet.size)
    # a preview beside the walk sheet's standing column, 3x, for checking
    pv = Image.new('RGBA', ((n + 1) * cell * 3, 8 * cell * 3), (70, 120, 70, 255))
    for r in range(8):
        pv.alpha_composite(walk.crop((0, r * cell, cell, (r + 1) * cell)).resize((cell * 3, cell * 3), Image.NEAREST), (0, r * cell * 3))
        for i in range(n):
            pv.alpha_composite(sheet.crop((i * cell, r * cell, (i + 1) * cell, (r + 1) * cell)).resize((cell * 3, cell * 3), Image.NEAREST), ((i + 1) * cell * 3, r * cell * 3))
    os.makedirs(os.path.join(HERE, 'preview'), exist_ok=True)
    pv.save(os.path.join(HERE, 'preview', a['out'] + '.png'))


if __name__ == '__main__':
    for n in sys.argv[1:] or ANIMALS: build(n)
