# Ela (Ludmila's little daughter, a refugee): People1_4 repainted to her map sprite - the tidy red bob dark brown and tousled
# (a new ragged outline of uneven clumps painted under it, a few locks crossing it, a stray hair), the standing collar gone
# (the neck and the hair behind it painted where it stood), the red vest and the white blouse one plain dress in a dark,
# faded blue (the bodice painted over the body, the blouse's sleeves recoloured), a round neckline, two sewn-on brown
# patches, a tear, faded stains.
# Run: python tools/busts/make_ela.py [out.png]
import sys
from kit import *
from patches import patch, smudge, hole, rip

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Ela_Bust.png')
b = Bust('People1_4')
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


# ---------- masks of the original ----------
HEAD = b.poly([(40, 0), (300, 0), (300, 200), (200, 200), (196, 176), (130, 196), (128, 214), (40, 214)])
face = b.sel(hue=(0, 45), sat=(0.08, 0.45), val=(0.8, 1), box=(90, 60, 240, 200))
face = b.comp(face, (150, 150))
hair = b.sel(hue=(285, 30), sat=(0.25, 1), val=(0, 0.9)) & HEAD & ~face
hair = b.grow(hair, 1, 0.25) & HEAD & ~face
iris = b.sel(hue=(30, 70), sat=(0.3, 1), box=(100, 110, 200, 150))          # (the amber eyes stay as they are)
hair &= ~dilate(iris, 2)
clothes = b.op() & (b.yy > 176) & ~face & ~hair & ~b.lines_of(face, 2)

# ---------- the hair: dark brown (its shine and the lit rim too) ----------
HAIR = [(0.0, (14, 8, 6)), (0.15, (28, 16, 11)), (0.3, (44, 28, 20)), (0.45, (62, 40, 29)), (0.6, (84, 56, 40)), (0.8, (112, 78, 56)),
        (1.0, (140, 104, 76))]
HT = ((30, 18, 13), (52, 34, 25), (78, 52, 37))
EYES = b.poly([(100, 112), (150, 104), (150, 146), (100, 146)], [(156, 104), (204, 104), (204, 140), (156, 140)])
BROWS = b.poly([(60, 0), (270, 0), (270, 96), (226, 96), (206, 110), (160, 112), (130, 110), (100, 114), (60, 120)])  # (the hair above them)
shine = HEAD & b.op() & (~face | BROWS) & ~EYES & ~hair & ~b.poly([(200, 120), (232, 120), (232, 170), (200, 170)])   # (not the ear)
b.ramp(hair, HAIR, gain=0.82)
b.ramp(shine, HAIR, gain=0.62)
# the fringe's red shade on the forehead -> a plain skin shade
b.hsv(b.sel(hue=(345, 15), sat=(0.25, 0.6), val=(0.85, 1), box=(100, 100, 220, 140)) & ~hair & ~shine, hue=16, smul=0.8)

# ---------- the standing collar gone: the neck, the back hair behind it ----------
NECKLINE = curve((128, 210), (132, 220), (144, 230), (160, 234), (178, 230), (192, 220), (200, 208))
ABOVE = b.poly([(86, 150), (244, 150), (244, 228), (232, 226)] + curve((232, 226), (216, 214), (200, 208)) + NECKLINE[::-1][1:] +
               curve((128, 210), (112, 218), (98, 230)) + [(84, 230)])
upper = clothes & ABOVE
back = upper & b.poly([(118, 150), (214, 150), (214, 216), (118, 216)])         # (the hair behind the neck; beside it the sleeves' tops)
b.over(flat([[(80, 150), (250, 150), (250, 240), (80, 240)]], HT[0], back))
NECK = [(136, 186), (148, 194), (160, 194), (176, 188), (190, 177), (194, 196), (196, 216), (190, 230), (160, 240), (136, 230)]
NECK_T = ((214, 150, 136), (240, 192, 168), (250, 212, 190))
nk = b.poly(NECK) & upper
b.over(flat([NECK], NECK_T[1], nk))
b.over(flat([curve((128, 192), (150, 202), (172, 196), (198, 180)) + [(200, 190)] + curve((200, 190), (176, 206), (150, 210), (128, 202))],
            NECK_T[0], nk))
b.over(flat([[(186, 180), (198, 170), (200, 220), (186, 220)]], NECK_T[0], nk))
b.over(strokes(S, [((137, 188), (136, 202), (137, 218), 1.8), ((191, 178), (193, 198), (196, 216), 1.8)], LINE, taper_to=1.0, clip=dilate(upper, 1)))

# ---------- the dress: the bodice painted, the blouse's sleeves recoloured ----------
DR = [(0.0, (16, 20, 28)), (0.3, (34, 44, 58)), (0.55, (50, 64, 82)), (0.72, (62, 78, 98)), (0.86, (80, 100, 122)), (0.95, (94, 116, 138)),
      (1.0, (104, 128, 150))]
DR_T = ((58, 74, 94), (82, 102, 124), (104, 128, 150))
DR_DEEP = (42, 54, 70)
BODICE = (curve((86, 360), (88, 300), (92, 258), (98, 230)) + curve((98, 230), (112, 218), (128, 210)) + NECKLINE[1:] +
          curve((200, 208), (216, 214), (232, 226)) + curve((232, 226), (236, 260), (240, 300), (244, 360)) + [(244, 400), (86, 400)])
sleeves = clothes & ~erode_cv(b.poly(BODICE), 2) & ~back & ~nk     # (a little under the bodice's edge too)
b.ramp(sleeves, DR, gain=1.0)
bm = clothes & b.poly(BODICE)
b.over(celp([BODICE], DR_T, clip=clothes & ~back & ~nk, shade=10, light=3, lw=2.0))
bmi = erode_cv(bm, 2)
# folds of the bodice (shade wedges from the chest down), the throat's shadow on the cloth
FOLDS = [((112, 250), (114, 300), (108, 360), 1.0, 8.0), ((150, 262), (152, 310), (148, 360), 1.0, 6.0), ((196, 250), (202, 300), (204, 360), 1.0, 8.0),
         ((222, 240), (228, 290), (232, 360), 1.5, 9.0)]
b.over(flat([taper(bez(p0, p1, p2, 24), w0, w1) for p0, p1, p2, w0, w1 in FOLDS], DR_T[0], bmi))
b.over(strokes(S, [(p0, p1, p2, 1.2) for p0, p1, p2, w0, w1 in FOLDS], DR_DEEP, alpha=0.85, clip=bmi, taper_to=1.4))
b.over(flat([curve((132, 220), (146, 234), (162, 238), (180, 234), (196, 220)) + [(200, 212)] +
             curve((200, 212), (184, 230), (162, 236), (142, 232), (130, 216))], DR_T[0], bmi))
HEM = curve((131, 216), (140, 230), (160, 238), (180, 234), (196, 222), (202, 212))
b.over(strokes(S, [(HEM[i], HEM[i + 1], HEM[i + 1], 1.3) for i in range(len(HEM) - 1)], DR_DEEP, alpha=0.8, taper_to=1.0, clip=bmi))

# ---------- the hair tousled: ragged locks hanging out under it, tufts and stray strands sticking out ----------
hm = hair | shine
under = ~hm & ~face & ~b.lines_of(face, 2)


def locks(spec, clip=None, lw=1.5, seed=1):
    """Locks of hair (root, bend, tip, width) as tapered cel shapes, strands in them."""
    polys = [taper(bez(r, m, t, 24), w, 0.6, w_mid=w * 0.9) for r, m, t, w in spec]
    lay = cel(S, polys, HT, lw=lw, shade=3.0, light=1.4, ldir=LD, clip=clip)
    return over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), (150, 260), HT[2], (18, 10, 8), n=30, length=(6, 10), seed=seed,
                                  alpha=(0.45, 0.5)))


# a new ragged outline round the bob, painted under it (its old smooth line goes): clumps ending in blunt points, longer at the
# bottom and the sides
rim = hm & (luma(b.src) < 0.3) & dilate(~b.op(), 3)
under |= rim
under &= ~nk & ~b.poly([(126, 178), (204, 164), (206, 236), (126, 236)])


def ragged(mask, seg=(13.0, 22.0), tip=(2.0, 10.0), seed=1, longer=None):
    """The outer contour of mask with uneven clumps of hair sticking out of it (curved sides, flicked points) -> polygon."""
    rng = np.random.RandomState(seed)
    cs, _ = cv2.findContours(fill_holes(mask).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=len)[:, 0, :].astype(np.float64)
    c = cv2.GaussianBlur(c[None], (1, 9), 0)[0]
    seg_l = np.linalg.norm(np.diff(c, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg_l)])
    ctr = c.mean(0)

    def at(s_):
        i = min(np.searchsorted(cum, s_), len(c) - 1)
        p = c[i]
        q0, q1 = c[max(i - 3, 0)], c[min(i + 3, len(c) - 1)]
        d = (q1 - q0) / max(np.linalg.norm(q1 - q0), 1e-6)
        n = np.array([d[1], -d[0]])
        return p, d, (n if np.dot(n, p - ctr) >= 0 else -n)
    out = []
    s_ = 0.0
    while s_ < cum[-1] - 4:
        st = rng.uniform(*seg)
        p0, d, n = at(s_)
        p1, _, n1 = at(min(s_ + st, cum[-1]))
        k = longer(p0) if longer else 1.0
        L = rng.uniform(*tip) * k
        f = rng.uniform(0.45, 0.95)                                    # where along the clump its point sits (flicked one way)
        apex = p0 + (p1 - p0) * f + (n + n1) / 2 * L
        for t in np.linspace(0, 1, 6)[:-1]:                            # the clump's rounded side up to the point
            q = p0 + (apex - p0) * t
            out.append(tuple(q + n * np.sin(t * np.pi) * L * 0.18))
        for t in np.linspace(0, 1, 4)[:-1]:                            # the short side back down
            out.append(tuple(apex + (p1 + n1 * 0.5 - apex) * t))
        s_ += st
    return out


def longer(p):
    return 1.0 + 0.9 * np.clip((p[1] - 120) / 60.0, 0, 1)            # the ends at the bottom hang out more


RAG = ragged(hm | rim, seg=(15.0, 26.0), tip=(2.5, 13.0), seed=3, longer=longer)
rag = cel(S, [RAG], HT, lw=1.5, shade=3.0, light=1.4, ldir=LD, clip=under)
rag = over(rag, hair_strands(S, erode_cv(rag[..., 3] > 0.5, 1), (150, 100), HT[2], (18, 10, 8), n=60, length=(5, 9), seed=5, alpha=(0.4, 0.5)))
b.over(rag)
# a few tousled locks crossing the outline, a couple of stray hairs
b.over(locks([((112, 50), (100, 58), (94, 72), 11), ((158, 34), (150, 24), (140, 22), 10), ((234, 108), (244, 120), (246, 136), 10)],
             lw=1.4, seed=4))
b.over(strokes(S, [((146, 26), (142, 14), (134, 8), 1.3)], HT[0], alpha=0.95))

# ---------- wear: a brown patch, a tear, frayed spots, dirt ----------
cloth = bmi
b.img = patch(b.img, [(200, 286), (226, 280), (232, 306), (204, 312)], cloth, lift=1.2, hue=(26, 0.4), seed=7)
b.img = hole(b.img, rip([(122, 296), (127, 306), (128, 318)], 6.0, seed=5, jag=0.45, alt=0.2, step=2.0), fill=(40, 34, 36),
             shade=(30, 26, 28), line=(22, 22, 28), lip=DR_T[2])
b.img = patch(b.img, [(98, 318), (120, 314), (124, 338), (100, 342)], cloth, lift=1.05, hue=(30, 0.32), seed=8)
# dirt: faint stains with specks
rng = np.random.RandomState(12)
STAINS = [(150, 330, 14, 8), (232, 262, 8, 10), (182, 276, 9, 6)]
b.img = smudge(b.img, [ellipse(x, y, rx, ry, 0.3, 18) for x, y, rx, ry in STAINS], (88, 70, 54), 0.14)
b.over(dots(S, [(x + rng.normal(0, rx * 0.5), y + rng.normal(0, ry * 0.5), rng.uniform(0.5, 1.1)) for x, y, rx, ry in STAINS
                for _ in range(10)], (70, 56, 44), alpha=0.45, clip=cloth))
b.save(OUT)
print('ok', OUT)
