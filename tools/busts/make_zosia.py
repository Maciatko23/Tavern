# Zosia (a town girl, about 7): People1_2 repainted to her map sprite - blonde hair in two tails, the yellow top a dress in a
# muted red (its collar and the sleeves' stripes too), a white apron over it - a bib with straps over the shoulders painted
# over the chest (the red bow and the blue beads under it), a few faded stains on it.
# Run: python tools/busts/make_zosia.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Zosia_Bust.png')
b = Bust('People1_2')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # the side kit.cel() puts its shade band on (lower right: the RTP light comes from the upper left)
PAD = 40              # shapes running off the bottom edge are painted on a taller canvas (no shade band along the cut)


def celp(polys, tones, clip=None, **kw):
    """kit.cel() with the shade on the lower right, painted PAD px taller and cut back (no band along the bottom edge)."""
    c = None
    if clip is not None:
        c = np.zeros((H + PAD, W), bool)
        c[:H] = clip
        c[H:] = clip[-1]
    kw.setdefault('ldir', LD)
    return cel((H + PAD, W), polys, tones, clip=c, **kw)[:H]


def flat(polys, col, clip):
    """Flat tone patches (the shade shapes of the folds) inside clip."""
    return celp(polys, (col, col, col), clip=clip, outline=False, shade=0, light=0)


def curve(*pts, n=16):
    """A smooth outline through the points (quadratic pieces through the midpoints) -> [(x, y), ...]."""
    p = [np.asarray(q, np.float64) for q in pts]
    out = [tuple(p[0])]
    for i in range(1, len(p) - 1):
        a = (p[i - 1] + p[i]) / 2 if i > 1 else p[0]
        c = (p[i] + p[i + 1]) / 2 if i < len(p) - 2 else p[-1]
        out += [tuple(q) for q in bez(a, p[i], c, n)[1:]]
    return out


# ---------- masks ----------
face = b.comp(b.sel(hue=(0, 45), sat=(0.08, 0.5), val=(0.8, 1), box=(90, 90, 230, 215)), (160, 160))
SKIN_V = b.poly([(120, 196), (200, 196), (198, 226), (188, 245), (172, 260), (160, 266), (150, 266), (140, 258), (128, 245), (118, 226)])
skin = face | (SKIN_V & b.sel(hue=(300, 45), val=(0.3, 1)))                 # (the neck, its shade under the chin too)
HAIRBOX = b.poly([(40, 20), (300, 20), (300, 275), (220, 275), (214, 222), (106, 222), (100, 275), (40, 275)])
hair = b.sel(hue=(5, 50), sat=(0.1, 0.55), val=(0, 0.8)) & HAIRBOX & ~skin
hair = b.grow(hair, 1, 0.25) & HAIRBOX & ~skin
rim = b.sel(hue=(230, 340), sat=(0.08, 1), val=(0.12, 1)) & dilate(hair, 6) & HAIRBOX & ~skin     # (the lilac rim light and shades)
iris = b.sel(hue=(60, 200), sat=(0.15, 1), box=(100, 130, 200, 170))
hair &= ~dilate(iris, 2)

# ---------- the hair: blonde ----------
b.ramp(hair | rim, RAMPS['hair_blonde'], gain=1.05)

# ---------- the top, its collar and stripes: a muted red dress ----------
ARMS = b.poly([(66, 298), (91, 300), (91, 350), (66, 350)], [(223, 309), (252, 304), (252, 350), (225, 350)])
arms = ARMS & (luma(b.src) > 0.4) & (b.sel(hue=(330, 42)) | b.sel(sat=(0, 0.2)))                    # (the bare arms under the sleeves)
top = b.op() & (b.yy > 210) & ~skin & ~hair & ~rim & ~arms & ~b.sel(hue=(190, 260), sat=(0.3, 1), box=(120, 300, 220, 350))
RED = [(0.0, (30, 10, 10)), (0.2, (52, 18, 18)), (0.42, (96, 36, 34)), (0.7, (128, 50, 46)), (0.8, (142, 58, 52)), (0.9, (170, 74, 66)),
       (0.96, (186, 86, 78)), (1.0, (204, 108, 96))]
b.ramp(top, RED)

# ---------- the white apron: a bib over the chest, straps over the shoulders ----------
AP_T = ((204, 194, 176), (238, 232, 220), (250, 248, 242))
AP_DEEP = (170, 158, 140)
BIB = curve((122, 266), (156, 262), (190, 264)) + [(192, 300), (196, 360), (118, 360), (120, 300)]
STRAP_L = [(110, 222), (119, 221), (134, 266), (124, 268)]
STRAP_R = [(202, 220), (211, 222), (190, 268), (180, 266)]
body = b.op() & (b.yy > 215) & ~hair & ~rim
b.over(celp([STRAP_L, STRAP_R], AP_T, clip=body, shade=3, light=1.5, lw=1.6))
b.over(celp([BIB], AP_T, clip=body, shade=9, light=3, lw=1.8))
bm = erode_cv(body & b.poly(BIB), 2)
# a hem stitched round the bib's top, soft folds, faded stains
b.over(strokes(S, [((124, 272), (156, 268), (188, 270), 1.0)], AP_DEEP, alpha=0.7, clip=bm, taper_to=1.0))
FOLDS = [((140, 292), (142, 326), (138, 360), 1.0, 6.0), ((172, 290), (176, 326), (176, 360), 1.0, 7.0)]
b.over(flat([taper(bez(p0, p1, p2, 24), w0, w1) for p0, p1, p2, w0, w1 in FOLDS], AP_T[0], bm))
b.over(strokes(S, [(p0, p1, p2, 1.0) for p0, p1, p2, w0, w1 in FOLDS], AP_DEEP, alpha=0.6, clip=bm, taper_to=1.4))


def blob(cx, cy, rx, ry, seed):
    r = np.random.RandomState(seed)
    t = np.linspace(0, 2 * np.pi, 16, endpoint=False)
    k = r.uniform(0.7, 1.25, len(t))
    return [(cx + np.cos(a) * rx * f, cy + np.sin(a) * ry * f) for a, f in zip(t, k)]


STAINS = [(150, 318, 9, 6), (178, 342, 7, 5), (132, 340, 5, 4)]
b.img = smudge(b.img, [blob(x, y, rx, ry, 30 + i) for i, (x, y, rx, ry) in enumerate(STAINS)], (176, 146, 104), 0.32)
b.save(OUT)
print('ok', OUT)
