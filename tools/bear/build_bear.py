# Builds the bear's sheets from the PixelLab frames (character feebb09f, 148 px canvas):
#   img/characters/anim8/Bear_<Motion>8.png  - 8 rows (S, SW, W, NW, N, NE, E, SE) x N cells of CELL px (walk/run: col 0 standing + frames)
#   img/characters/$Animal_Bear*.png         - the old 4-way sheets (3 x 4 cells), for the carcass picture and look8 off
# Each frame is scaled so the bear's size stays the same through the cycle (PixelLab's template frames jump in size), to SCALE of the
# idle rotation, snapped to the bear's own palette, given back a crisp 1 px outline, its feet on the cell's FEET line.
import sys, os, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = r"C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna"
DIRS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east']
OLD4 = {'south': 0, 'west': 1, 'east': 2, 'north': 3}   # RPG Maker rows: down, left, right, up
CELL, FEET, SCALE = 104, 100, 0.68

def alpha_bin(im):
    return im.getchannel('A').point(lambda a: 255 if a > 127 else 0)

def mass(im):
    a = alpha_bin(im)
    return sum(1 for v in a.getdata() if v)

# the palette: the colours of the idle rotations (the bear's own), 40 of them
def make_palette(n=64, only=None):
    # every colour of the rotations and of the walk frames, weighted by how often it is used (a muzzle's few tan pixels must stay tan);
    # only: the motion folders to take the colours from (None: all of them)
    pal = {}
    files = [os.path.join(HERE, 'rot', d + '.png') for d in DIRS]
    for root, _, fs in os.walk(os.path.join(HERE, 'frames')):
        if only and os.path.relpath(root, os.path.join(HERE, 'frames')).split(os.sep)[0] not in only: continue
        files += [os.path.join(root, f) for f in fs if f.endswith('.png')]
    for f in files:
        im = Image.open(f).convert('RGBA')
        for r, g, b, a in im.getdata():
            if a > 200: pal[(r, g, b)] = pal.get((r, g, b), 0) + 1
    cols = list(pal.items())
    strip = Image.new('RGB', (len(cols), 1))
    strip.putdata([c for c, k in cols])
    q = strip.quantize(colors=n, method=Image.MAXCOVERAGE)
    p = q.getpalette()[:n * 3]
    return [tuple(p[i:i + 3]) for i in range(0, len(p), 3)]

PAL_ALL = make_palette()
PAL_WALK = make_palette(only={'walk'})   # (2026-10-06: the new sheets snap to the walk's own colours - one fur for every move)
PAL = PAL_ALL
DARK = min(PAL, key=lambda c: sum(c))
_SNAP = {}

def snap(c):
    k = (id(PAL), c)
    if k not in _SNAP: _SNAP[k] = min(PAL, key=lambda p: (p[0] - c[0]) ** 2 * 3 + (p[1] - c[1]) ** 2 * 4 + (p[2] - c[2]) ** 2 * 2)
    return _SNAP[k]

def shrink(im, k):
    """premultiplied box resize by k, alpha cut at half, palette snap, a 1 px dark outline"""
    w, h = im.size
    nw, nh = max(1, round(w * k)), max(1, round(h * k))
    pre = Image.new('RGBA', im.size)
    px = im.load(); pp = pre.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            pp[x, y] = (r * a // 255, g * a // 255, b * a // 255, a)
    sm = pre.resize((nw, nh), Image.BOX)
    out = Image.new('RGBA', (nw, nh), (0, 0, 0, 0))
    sp = sm.load(); op = out.load()
    cache = {}
    for y in range(nh):
        for x in range(nw):
            r, g, b, a = sp[x, y]
            if a < 110: continue
            c = (r * 255 // a, g * 255 // a, b * 255 // a)
            if c not in cache: cache[c] = snap(c)
            op[x, y] = cache[c] + (255,)
    # the outline: an opaque pixel beside the empty one is the dark line
    edge = []
    for y in range(nh):
        for x in range(nw):
            if op[x, y][3] == 0: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                X, Y = x + dx, y + dy
                if X < 0 or Y < 0 or X >= nw or Y >= nh or op[X, Y][3] == 0: edge.append((x, y)); break
    for x, y in edge: op[x, y] = DARK + (255,)
    return out

def centroid_x(im):
    a = alpha_bin(im); w, h = im.size; s = n = 0
    for i, v in enumerate(a.getdata()):
        if v: s += i % w; n += 1
    return s / max(1, n)

def place(cellimg, fr, cx, feet):
    """the frame into the cell: its centroid on the cell's middle, its lowest pixel on the feet line"""
    b = fr.getbbox()
    if not b: return
    ox = round(CELL / 2 - cx)
    oy = feet - b[3]
    cellimg.alpha_composite(fr, (ox, oy)) if 0 <= ox and 0 <= oy and ox + fr.width <= CELL and oy + fr.height <= CELL else paste_clip(cellimg, fr, ox, oy)

def paste_clip(cellimg, fr, ox, oy):
    tmp = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    tmp.paste(fr, (ox, oy), fr)
    cellimg.alpha_composite(tmp)

import colorsys
def is_fur(c):
    r, g, b = [v / 255 for v in c[:3]]
    h, sat, v = colorsys.rgb_to_hsv(r, g, b)
    return v > 0.1 and sat > 0.2 and 0.02 < h < 0.17
def lum(c): return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
def fur_ramp(files):
    """the fur colours of these frames sorted dark to light, each as often as it is used"""
    out = []
    for f in files:
        for c in Image.open(f).convert('RGBA').getdata():
            if c[3] > 200 and is_fur(c): out.append(c[:3])
    out.sort(key=lum)
    return out
_REF = {}
def body(c):   # a pixel of the body (not the outline, not the claws' white, not the eyes)
    r, g, b = [v / 255 for v in c[:3]]
    h, sat, v = colorsys.rgb_to_hsv(r, g, b)
    return c[3] > 200 and v > 0.06 and not (sat < 0.15 and v > 0.6)
def mean_std(px):
    n = len(px) or 1
    m = [sum(p[i] for p in px) / n for i in range(3)]
    sd = [max(1.0, (sum((p[i] - m[i]) ** 2 for p in px) / n) ** 0.5) for i in range(3)]
    return m, sd
def match_fur(frames, motion, d='east'):
    """the colours of these frames moved to the walk's of the same way (each channel's mean and spread, the body only): the v3 poses
    came out more orange above and blacker below than the template walk"""
    if 'all' not in _REF:   # (one target for every way: the walk's back views are mostly shadow and darkened the diagonals)
        px = []
        for w in ('east', 'south', 'south-east', 'south-west', 'north-east'):
            for i in range(8):
                px += [c[:3] for c in Image.open(os.path.join(HERE, 'frames', 'walk', w, '%d.png' % i)).convert('RGBA').getdata() if body(c)]
        _REF['all'] = mean_std(px)
    rm, rs = _REF['all']
    own = [c[:3] for fr in frames for c in fr.getdata() if body(c)]
    if not own: return frames
    om, osd = mean_std(own)
    out = []
    for fr in frames:
        fr = fr.copy(); pxl = fr.load(); w, h = fr.size
        for y in range(h):
            for x in range(w):
                c = pxl[x, y]
                if body(c):
                    pxl[x, y] = tuple(max(0, min(255, round(rm[i] + (c[i] - om[i]) * rs[i] / osd[i]))) for i in range(3)) + (c[3],)
        out.append(fr)
    return out

_CDF = {}
def match_cdf(frames, motion=None):
    """the colours of these frames moved to the walk's by matching each channel's whole distribution (the body only): a monotone map
    per channel - dark stays dark, light stays light, no colour of its own appears (mean/spread matching made green blotches on the
    v3 swipe's shadowed fur)"""
    if 'ref' not in _CDF:
        px = []
        for w in ('east', 'south', 'south-east', 'south-west', 'north-east'):
            folder = os.path.join(HERE, 'frames', 'walk', w)
            if not os.path.isdir(folder): continue
            for f in os.listdir(folder):
                if f.endswith('.png'): px += [c[:3] for c in Image.open(os.path.join(folder, f)).convert('RGBA').getdata() if body(c)]
        _CDF['ref'] = [sorted(p[i] for p in px) for i in range(3)]
    ref = _CDF['ref']
    if motion and ('own', motion) not in _CDF:   # (one map for the whole motion, from all its ways: a back view alone is nearly all shadow)
        px = []
        base = os.path.join(HERE, 'frames', motion)
        for w in os.listdir(base):
            for f in os.listdir(os.path.join(base, w)):
                if f.endswith('.png'): px += [c[:3] for c in Image.open(os.path.join(base, w, f)).convert('RGBA').getdata() if body(c)]
        _CDF[('own', motion)] = px
    own = _CDF[('own', motion)] if motion else [c[:3] for fr in frames for c in fr.getdata() if body(c)]
    if not own: return frames
    luts = []
    for i in range(3):
        vals = sorted(p[i] for p in own)
        n, m = len(vals), len(ref[i])
        lut = []
        for v in range(256):
            # the share of own pixels at or below v -> the reference value at that share
            lo, hi = 0, n
            while lo < hi:
                mid = (lo + hi) // 2
                if vals[mid] <= v: lo = mid + 1
                else: hi = mid
            q = lo / n
            lut.append(ref[i][min(m - 1, int(q * (m - 1)))])
        luts.append(lut)
    out = []
    for fr in frames:
        fr = fr.copy(); pxl = fr.load(); w, h = fr.size
        for y in range(h):
            for x in range(w):
                c = pxl[x, y]
                if body(c): pxl[x, y] = (luts[0][c[0]], luts[1][c[1]], luts[2][c[2]], c[3])
        out.append(fr)
    return out

def match_gain(frames, motion):
    """the colours of these frames brought to the walk's: each channel multiplied by one gain for the whole motion (the ratio of the
    body's mean colour over all its ways to the walk's) - dark stays dark, nothing gets a colour of its own"""
    key = ('gain', motion)
    if key not in _CDF:
        def mean_of(folder):
            s = [0, 0, 0]; n = 0
            for w in os.listdir(folder):
                for f in os.listdir(os.path.join(folder, w)):
                    if not f.endswith('.png'): continue
                    for c in Image.open(os.path.join(folder, w, f)).convert('RGBA').getdata():
                        if body(c): s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; n += 1
            return [v / max(1, n) for v in s]
        ref, own = mean_of(os.path.join(HERE, 'frames', 'walk')), mean_of(os.path.join(HERE, 'frames', motion))
        _CDF[key] = [ref[i] / max(1, own[i]) for i in range(3)]
        print('gain', motion, [round(g, 3) for g in _CDF[key]])
    g = _CDF[key]
    out = []
    for fr in frames:
        fr = fr.copy(); pxl = fr.load(); w, h = fr.size
        for y in range(h):
            for x in range(w):
                c = pxl[x, y]
                if body(c): pxl[x, y] = tuple(min(255, round(c[i] * g[i])) for i in range(3)) + (c[3],)
        out.append(fr)
    return out

def frame_list(motion, d):
    folder = os.path.join(HERE, 'frames', motion, d)
    n = len([f for f in os.listdir(folder) if f.endswith('.png')])
    return [Image.open(os.path.join(folder, '%d.png' % i)).convert('RGBA') for i in range(n)]

REF = {d: mass(Image.open(os.path.join(HERE, 'rot', d + '.png')).convert('RGBA')) for d in DIRS}

FLIP = Image.Transpose.FLIP_LEFT_RIGHT
def row_frames(spec, d):
    """the frames of one row: spec['rows'][d] = { src: motion, from: direction, flip, pick } (left out: the motion's own frames of d)"""
    r = (spec.get('rows') or {}).get(d, {})
    motion, src = r.get('src', spec['dir']), r.get('from', d)
    parts = r.get('parts', spec.get('parts'))
    if parts:   # several motions one after another (the roar: the rise of the rearing, then the roar itself)
        frames = []
        for part in parts:
            fl = frame_list(part['src'], src)
            fl = [fl[i] for i in part['pick'] if i < len(fl)] if part.get('pick') else fl
            frames += match_fur(fl, part['src'], src) if spec.get('match') else fl   # (each part to the walk's colours on its own)
    else:
        frames = frame_list(motion, src)
        pick = r.get('pick', spec.get('pick'))
        if pick: frames = [frames[i] for i in pick if i < len(frames)]
    if spec.get('standing'): frames = [Image.open(os.path.join(HERE, 'rot', src + '.png')).convert('RGBA')] + frames
    if spec.get('match') == 'gain' and not parts: frames = match_gain(frames, motion)
    elif spec.get('match') == 'cdf' and not parts: frames = match_cdf(frames, motion)
    elif spec.get('match') and not parts: frames = match_fur(frames, motion, src)
    if r.get('flip'): frames = [f.transpose(FLIP) for f in frames]
    return frames, src

def build_spec(spec):
    global CELL, FEET, PAL, DARK
    PAL = PAL_WALK if spec.get('palette') == 'walk' else PAL_ALL
    DARK = min(PAL, key=lambda c: sum(c))
    CELL, FEET = spec.get('cell', 104), spec.get('feet', 100)
    # align: "frame" - each frame's centroid on the middle and its lowest pixel on the feet line (walking: the PixelLab frames drift);
    # "row" - the first frame's place for the whole row (a pose: the bear rises where it stands, the canvas does not move)
    rows = []
    for d in DIRS:
        frames, src = row_frames(spec, d)
        cells, base = [], None
        for fr in frames:
            k = SCALE * ((REF[src] / max(1, mass(fr))) ** 0.5 if spec.get('keep', True) else 1)
            sm = shrink(fr, k)
            c = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            if spec.get('align', 'frame') == 'row':
                b = sm.getbbox()
                if base is None: base = CELL / 2 - centroid_x(sm) + ((spec.get('rows') or {}).get(d, {}).get('dx', 0))   # (dx: a row moved over, a paw kept in the cell)
                paste_clip(c, sm, round(base), FEET - (b[3] if b else 0))
            else:
                place(c, sm, centroid_x(sm), FEET)
            cells.append(c)
        rows.append(cells)
    n = max(len(r) for r in rows)
    sheet = Image.new('RGBA', (CELL * n, CELL * 8), (0, 0, 0, 0))
    for r, cells in enumerate(rows):
        for i, c in enumerate(cells): sheet.alpha_composite(c, (i * CELL, r * CELL))
        for i in range(len(cells), n): sheet.alpha_composite(cells[-1], (i * CELL, r * CELL))   # (a shorter row holds its last frame)
    sheet.save(os.path.join(GAME, 'img', 'characters', 'anim8', spec['out'] + '.png'))
    return sheet, rows

def old4(rows, name, cols):
    """the 4-way RPG Maker sheet ($ = one character, 3 x 4 cells) from the 8-way rows: cols = the three frames (pattern 0, 1, 2)"""
    sheet = Image.new('RGBA', (CELL * 3, CELL * 4), (0, 0, 0, 0))
    for d, r in OLD4.items():
        cells = rows[DIRS.index(d)]
        for j, ci in enumerate(cols): sheet.alpha_composite(cells[min(ci, len(cells) - 1)], (j * CELL, r * CELL))
    sheet.save(os.path.join(GAME, 'img', 'characters', name + '.png'))

def preview(sheet, name):
    bg = Image.new('RGBA', sheet.size, (120, 150, 90, 255)); bg.alpha_composite(sheet)
    os.makedirs(os.path.join(HERE, 'preview'), exist_ok=True)
    bg.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(os.path.join(HERE, 'preview', name + '_x2.png'))

if __name__ == '__main__':
    what = sys.argv[1:] or ['walk']
    specs = json.loads(open(os.path.join(HERE, 'motions.json')).read())
    for m in what:
        spec = specs[m]
        sheet, rows = build_spec(spec)
        old4(rows, spec['old'], spec['old_cols'])
        preview(sheet, spec['out'])
        print(m, sheet.size)
