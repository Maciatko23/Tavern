# Borgar (the innkeeper of the tavern, older, stocky): People3_5 (the stern grey-haired nobleman) repainted to his map sprite -
# the grey hair a lighter grey, brown eyes, the goatee and jaw beard a full short grey beard with a darker moustache (painted
# with hair strands), the gold-and-violet coat with its high collar and shoulder plates gone (the shoulders rounded off): a
# cream-white linen shirt with an open collar, a violet neckerchief knotted at the throat, a mustard-ochre vest with buttons.
# Run: python tools/busts/make_borgar.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Borgar_Bust.png')
b = Bust('People3_5')
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


def beard_l(outer, inner, tones, flow, mous=None, mous_flow=None, seed=1, n=70, tip=5, out=2.4, seg=9, mous_tones=None):
    """kit.beard2() with the shade band on the lower right (as on the RTP faces)."""
    edge = strand_edge(outer, side=1, seg=seg, tip=tip, out=out, seed=seed)
    lay = cel(S, [edge + list(inner)], tones[:3], outline=False, shade=6, light=3, ldir=LD)
    m = lay[..., 3] > 0.5
    lay = over(lay, hair_strands(S, m, flow, tones[2], tones[3], n=n, seed=seed))
    ol = strokes(S, [(edge[i], ((np.asarray(edge[i]) + np.asarray(edge[i + 1])) / 2).tolist(), edge[i + 1], 1.7)
                     for i in range(len(edge) - 1)], LINE, alpha=1.0, taper_to=1.0)
    lay = over(lay, ol)
    if mous is not None:
        mt = mous_tones or tones
        ml = cel(S, [mous], mt[:3], lw=1.3, shade=4, light=1.6, ldir=LD)
        mm = ml[..., 3] > 0.5
        ml = over(ml, hair_strands(S, erode_cv(mm, 1), mous_flow or flow, mt[2], mt[3], n=n // 2, length=(5, 10), seed=seed + 1,
                                   alpha=(0.7, 0.6)))
        lay = over(lay, ml)
    return lay


# ---------- hair: a lighter, neutral grey (like the beard); brown eyes ----------
HEAD = [(80, 0), (250, 0), (250, 150), (214, 150), (206, 118), (100, 122), (92, 150), (80, 150)]
hair = b.sel(sat=(0, 0.2), val=(0.25, 1), poly=HEAD) | b.sel(hue=(20, 70), sat=(0, 0.25), val=(0, 0.45), poly=HEAD)
hair &= ~b.sel(val=(0.92, 1))                                     # (the whites of the eyes)
HAIR = [(0.0, (30, 28, 30)), (0.2, (70, 68, 70)), (0.38, (112, 110, 112)), (0.55, (158, 156, 156)), (0.7, (192, 190, 188)),
        (0.85, (224, 222, 220))]
b.ramp(hair, HAIR, gain=1.0, bias=0.04)
iris = b.sel(hue=(55, 170), sat=(0.12, 1), polys=[[(110, 92), (145, 92), (145, 116), (110, 116)], [(160, 92), (195, 92), (195, 116), (160, 116)]])
b.ramp(iris, [(0.0, (20, 12, 8)), (0.15, (52, 32, 18)), (0.35, (100, 64, 34)), (0.6, (150, 104, 60)), (0.8, (200, 160, 110))])

# ---------- a new silhouette below the head: round shoulders, the neck where the high collar stood ----------
SIL = ([(0, 400), (0, 340)] + curve((2, 330), (6, 290), (12, 254), (30, 236), (70, 224), (112, 212)) +
       [(118, 204), (96, 150), (96, 120), (214, 120), (208, 146)] +
       curve((208, 146), (212, 170), (216, 196), (226, 208)) +
       curve((226, 208), (270, 220), (310, 234), (324, 252), (330, 280)) + [(330, 400)])
sil = soft_poly(S, [SIL])
cut = region(S, 0, 146, W, H)
b.img[..., 3] = np.where(cut, b.img[..., 3] * sil, b.img[..., 3])
alpha0 = b.img[..., 3].copy()
FACE = [(96, 120), (214, 120), (214, 150), (200, 176), (184, 196), (160, 210), (140, 206), (118, 188), (100, 160)]
body = (b.img[..., 3] > 0.5) & (b.yy > 146) & ~b.poly(FACE)

# the neck (in the shade under the jaw)
NECK = [(100, 150), (208, 140), (230, 150), (230, 226), (100, 226)]
b.over(celp([NECK], ((150, 88, 66), (190, 122, 88), (214, 152, 110)), clip=body, shade=5, light=0, lw=2.0))
# the shirt: one shape over the body, the folds as flat shade shapes and creases
SHIRT_T = ((176, 164, 144), (228, 218, 196), (248, 242, 228))
SHIRT_DEEP = (136, 124, 106)
shirt_m = body & ~b.poly([(96, 140), (226, 140), (226, 204), (96, 204)])
b.over(celp([[(0, 190), (330, 190), (330, 400), (0, 400)]], SHIRT_T, clip=shirt_m, shade=10, light=3))
sm = erode_cv(shirt_m, 2)
SHADES = [curve((96, 226), (70, 250), (64, 290), (48, 330), (40, 360)) + [(100, 360)],             # the far arm, towards the body
          curve((0, 300), (14, 312), (18, 340), (14, 360)) + [(0, 360)],
          curve((250, 224), (262, 244), (272, 262), (300, 262), (312, 250), (318, 244)) + [(330, 250), (330, 360), (300, 360)] +
          curve((300, 360), (292, 320), (276, 296), (258, 280)),                                    # under the near shoulder
          ]
b.over(flat(SHADES, SHIRT_T[0], sm))
b.over(strokes(S, [((30, 252), (44, 276), (46, 304), 1.6), ((14, 270), (24, 296), (22, 330), 1.3),
                   ((268, 286), (290, 296), (300, 324), 1.5), ((292, 268), (306, 286), (312, 316), 1.3)], SHIRT_DEEP, alpha=0.85, clip=sm))
b.over(strokes(S, [((40, 240), (56, 234), (78, 230), 1.6), ((262, 226), (282, 232), (300, 240), 1.6)], SHIRT_T[2], alpha=0.9, clip=sm))
# the vest: mustard ochre, a V neck, buttons
VEST_T = ((136, 96, 30), (188, 140, 46), (222, 182, 90))
VEST_DEEP = (104, 70, 22)
VL = [(116, 212), (94, 218)] + curve((94, 218), (88, 250), (84, 300), (82, 360)) + [(82, 400), (148, 400), (150, 300), (154, 270)] + \
    curve((154, 270), (138, 248), (122, 222), (116, 212))
VR = [(220, 206), (252, 216)] + curve((252, 216), (258, 250), (262, 300), (266, 360)) + [(266, 400), (146, 400), (150, 300), (154, 270)] + \
    curve((154, 270), (172, 246), (204, 220), (220, 206))
vest_l = celp([VL], VEST_T, clip=body, shade=6, light=3)
vest_r = celp([VR], VEST_T, clip=body, shade=12, light=3)
b.over(vest_l)
b.over(vest_r)
vm = erode_cv((vest_l[..., 3] > 0.5) | (vest_r[..., 3] > 0.5), 2)
b.over(flat([curve((94, 222), (100, 260), (98, 310), (92, 360)) + [(82, 360), (82, 222)],                       # the panels round off
             curve((252, 218), (238, 250), (234, 300), (240, 360)) + [(266, 360), (266, 218)],
             curve((122, 222), (130, 236), (140, 250), (148, 262), (154, 272)) + [(146, 274)] + curve((146, 274), (130, 252), (118, 226)),
             curve((214, 212), (196, 228), (180, 244), (166, 260), (156, 272)) + [(166, 270)] +
             curve((166, 270), (184, 252), (204, 234), (222, 220))], VEST_T[0], vm))
b.over(strokes(S, [((116, 262), (122, 286), (120, 312), 1.2), ((212, 266), (218, 294), (222, 324), 1.2)], VEST_DEEP, alpha=0.7, clip=vm))
b.over(celp([[(100, 318), (128, 321), (128, 326), (100, 323)], [(194, 316), (230, 312), (231, 317), (195, 321)]],
            ((110, 76, 24), VEST_T[0], VEST_T[1]), clip=vm, shade=1.5, light=1.0, lw=1.2))            # pocket welts
BUT = [(158, 290), (155, 316), (152, 342)]
b.over(cel(S, [ellipse(x, y, 3.4, 3.2) for x, y in BUT], ((70, 44, 22), (112, 76, 40), (160, 120, 70)), lw=1.0, shade=1.2, light=0.8,
           ldir=LD))
# the open collar of the shirt and the violet neckerchief knotted at the throat
PURP_T = ((72, 32, 84), (124, 68, 142), (168, 114, 184))
BAND = curve((112, 210), (120, 198), (150, 206), (190, 196), (216, 186), (226, 204)) + \
    curve((226, 204), (200, 216), (160, 222), (124, 222), (112, 210))
ENDS = [[(150, 214), (166, 214), (164, 240), (156, 270), (144, 250)],
        [(156, 214), (172, 212), (178, 232), (168, 260), (158, 266), (158, 238)]]
COLL_L = curve((126, 214), (112, 222), (104, 238)) + [(124, 236), (138, 228)]
COLL_R = curve((212, 206), (230, 216), (242, 226)) + [(214, 232), (196, 226)]
b.over(celp([COLL_L, COLL_R], SHIRT_T, clip=body, shade=4, light=2, lw=1.6))
b.over(celp([BAND], PURP_T, clip=body, shade=5, light=2, lw=1.8))
b.over(celp(ENDS, PURP_T, shade=4, light=2, lw=1.6))
KNOT = ellipse(160, 218, 9, 7, 0.1)
b.over(celp([KNOT], PURP_T, shade=4, light=2, lw=1.6))
b.over(strokes(S, [((153, 230), (154, 244), (151, 258), 1.0), ((168, 228), (167, 240), (164, 252), 1.0)], PURP_T[0], alpha=0.8))
# the shapes keep the new silhouette's soft edge
b.img[..., 3] = np.minimum(b.img[..., 3], alpha0)

# ---------- the beard: full and short, grey, a darker bushy moustache ----------
OUTER = [(212, 118), (214, 140), (206, 164), (194, 184), (178, 200), (160, 210), (142, 206), (124, 194), (110, 176), (102, 154),
         (100, 132)]
INNER = [(106, 134), (114, 150), (124, 164), (136, 170), (150, 172), (164, 171), (178, 165), (190, 154), (200, 138), (206, 118)]
MOUS = curve((118, 166), (122, 152), (138, 144), (152, 148), (168, 142), (184, 150), (188, 168)) + \
    curve((188, 168), (178, 162), (166, 158), (152, 160), (138, 158), (126, 162), (118, 166))
BEARD_T = ((124, 122, 122), (166, 164, 162), (202, 200, 198), (98, 96, 96))
MOUS_T = ((96, 94, 94), (136, 134, 132), (178, 176, 174), (74, 72, 72))
lay = beard_l(OUTER, INNER, BEARD_T, flow=(156, 230), mous=MOUS, mous_flow=(152, 180), seed=5, n=150, mous_tones=MOUS_T)
cast_shadow(b, lay[..., 3], 3, 6, (120, 80, 90), 0.45)
b.over(lay)
b.save(OUT)
print('ok', OUT)
