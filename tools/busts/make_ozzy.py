# Ozzy (the old drunk storyteller of the tavern): SF_People1_7 (the wrinkled old man in a knit cap, no glasses) repainted to his
# map sprite - the knit cap gone under a crushed brown felt hat with a dark band and a dent in the crown (the soft hat of
# SF_Actor2_4), the grey hair at the sides white and sticking out under the brim, bushy white brows, a big red bulbous
# drinker's nose and red cheeks, a bushy white moustache and a short white beard (painted), the khaki work jacket a worn navy
# coat with brown patches, the white turtleneck an off-white linen shirt open at the neck.
# Run: python tools/busts/make_ozzy.py [out.png]
import sys
from kit import *
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Ozzy_Bust.png')
b = Bust('SF_People1_7')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # the side kit.cel() puts its shade band on (lower right: the RTP light comes from the upper left)
PAD = 40


def celp(polys, tones, clip=None, **kw):
    """kit.cel() with the shade on the lower right, painted PAD px taller and cut back (no band along the bottom edge)."""
    c = None
    if clip is not None:
        c = np.zeros((H + PAD, W), bool)
        c[:H] = clip
        c[H:] = clip[-1]
    kw.setdefault('ldir', LD)
    return cel((H + PAD, W), polys, tones, clip=c, **kw)[:H]


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
        ml = cel(S, [mous], mt[:3], lw=1.4, shade=4, light=1.6, ldir=LD)
        mm = ml[..., 3] > 0.5
        ml = over(ml, hair_strands(S, erode_cv(mm, 1), mous_flow or flow, mt[2], mt[3], n=n // 2, length=(5, 10), seed=seed + 1,
                                   alpha=(0.75, 0.6)))
        lay = over(lay, ml)
    return lay


WHITE_HAIR = [(0.0, (40, 40, 48)), (0.12, (92, 92, 104)), (0.3, (160, 160, 172)), (0.5, (206, 206, 214)), (0.7, (232, 232, 238)),
              (0.9, (248, 248, 250))]
# ---------- hair and brows: white ----------
hair = b.sel(sat=(0, 0.22), val=(0.3, 1), box=(160, 60, 240, 165))
hair = b.grow(hair, 1, 0.3) & region(S, 160, 60, 240, 165) & ~b.sel(hue=(15, 45), sat=(0.25, 1), val=(0.6, 1))
b.ramp(hair, WHITE_HAIR, gain=1.08)

# ---------- the coat: navy wool, worn; the turtleneck an off-white shirt open at the neck ----------
jacket = b.sel(hue=(25, 75), sat=(0.12, 1), box=(0, 160, 330, 350)) & ~b.sel(hue=(0, 40), val=(0.85, 1), box=(0, 0, 330, 232))
jacket &= ~b.poly([(60, 0), (330, 0), (330, 160), (206, 160), (200, 172), (180, 196), (140, 204), (100, 200), (60, 160)])
jacket = b.grow(jacket, 2, 0.3) & region(S, 0, 160, 330, 350)
NAVY = [(0.0, (10, 12, 20)), (0.15, (22, 26, 38)), (0.32, (34, 38, 54)), (0.5, (46, 52, 70)), (0.66, (58, 64, 84)), (0.8, (72, 80, 102)),
        (0.95, (96, 106, 130))]
b.ramp(jacket, NAVY, gain=1.0)
neck_w = b.sel(sat=(0, 0.14), val=(0.6, 1), box=(120, 150, 230, 260))
b.ramp(neck_w, [(0.0, (40, 34, 28)), (0.5, (170, 156, 134)), (0.7, (206, 194, 170)), (0.85, (226, 216, 196)), (1.0, (240, 234, 218))])
# the shirt open at the neck: a V of skin (in the beard's shadow) between the collar's edges
shirt_m = b.grow(neck_w, 1, 0.3)
V = [(140, 196), (188, 182)] + curve((188, 182), (172, 208), (158, 234)) + curve((158, 234), (150, 214), (140, 196))
b.over(celp([V], ((150, 86, 72), (198, 132, 100), (222, 162, 120)), clip=dilate_cv(shirt_m, 1), shade=5, light=0, lw=1.6))
# the coat hangs open: the shirt shows down the front between its edges
SHIRT_T = ((176, 162, 136), (224, 214, 192), (242, 236, 220))
OPEN = curve((141, 244), (130, 300), (112, 350)) + [(108, 400), (190, 400)] + curve((186, 350), (172, 300), (161, 244))
b.over(celp([OPEN], SHIRT_T, clip=b.op(), shade=8, light=2, lw=2.0))
om = erode_cv(b.op() & b.poly(OPEN), 2)
b.over(strokes(S, [((152, 252), (150, 300), (150, 360), 1.2)], (150, 136, 112), alpha=0.9, clip=om))
b.over(cel(S, [ellipse(154, y, 2.2, 2.0) for y in (272, 300, 328)], ((120, 104, 80), (186, 172, 146), (230, 222, 204)), lw=0.8,
           shade=0.8, light=0.6, ldir=LD))
b.over(strokes(S, [((128, 310), (134, 330), (126, 350), 1.0), ((170, 290), (174, 314), (180, 344), 1.0)], SHIRT_T[0], alpha=0.8, clip=om))
# patches on the coat (brown cloth sewn on, like the map)
b.img = patch(b.img, [(70, 290), (98, 284), (102, 314), (74, 320)], jacket, lift=1.25, hue=(28, 0.45), seed=21)
b.img = patch(b.img, [(266, 250), (290, 246), (294, 272), (270, 276)], jacket, lift=1.2, hue=(30, 0.42), seed=22)

# ---------- the face: red cheeks, a red bulbous nose, a white moustache and short beard ----------
skin = b.sel(hue=(10, 45), sat=(0.15, 0.6), val=(0.6, 1), box=(70, 90, 210, 200))
b.over(blush(S, 96, 136, 13, 9, (226, 80, 70), 0.38, clip=skin))
b.over(blush(S, 160, 132, 16, 10, (226, 80, 70), 0.34, clip=skin))
NOSE_T = ((184, 58, 60), (220, 90, 86), (242, 140, 128))
NOSE = ellipse(108, 143, 14, 12, 0.15)
nose = celp([NOSE], NOSE_T, shade=5, light=2.5, outline=False)
rim = ellipse(108, 143, 13.4, 11.4, 0.15, 30, 0.0, 1.0 * np.pi)
nose = over(nose, strokes(S, [(rim[i], rim[i], rim[i + 1], 1.6) for i in range(len(rim) - 1)], LINE, taper_to=1.0))
b.over(blush(S, 110, 132, 8, 12, (226, 96, 88), 0.4, clip=skin))
OUTER = [(190, 146), (186, 164), (174, 180), (158, 192), (138, 198), (118, 196), (104, 186), (96, 172), (92, 160)]
INNER = [(98, 160), (110, 170), (128, 174), (148, 172), (166, 164), (178, 150)]
MOUS = curve((88, 176), (90, 158), (104, 152), (120, 156), (138, 150), (158, 154), (170, 170)) + \
    curve((170, 170), (156, 166), (140, 166), (124, 170), (108, 168), (98, 172), (88, 176))
BEARD_T = ((168, 168, 178), (214, 214, 220), (240, 240, 244), (140, 140, 152))
MOUS_T = ((180, 180, 190), (226, 226, 232), (248, 248, 250), (150, 150, 162))
beard = beard_l(OUTER, INNER, BEARD_T, flow=(134, 220), mous=MOUS, mous_flow=(128, 190), seed=7, n=110, mous_tones=MOUS_T)
cast_shadow(b, beard[..., 3], 2, 5, (150, 90, 90), 0.4)
b.over(beard)
b.over(nose)                                   # (over the moustache's top)
b.over(dots(S, [(102, 140, 2.6)], (255, 236, 228), alpha=0.9))
# bushy white brows
BROWS = [((128, 102), (140, 96), (152, 98), 5.5), ((136, 103), (148, 98), (160, 102), 5.5), ((146, 104), (156, 101), (164, 106), 4.5),
         ((102, 106), (94, 102), (84, 105), 5.0), ((100, 108), (92, 106), (82, 110), 4.0)]
brows = celp([taper(bez(r, c, t, 16), w, 0.0, w_mid=w) for r, c, t, w in BROWS], ((170, 170, 182), (228, 228, 234), (248, 248, 250)),
             shade=2, light=1, lw=1.0)
b.over(brows)

# ---------- the hat: crushed brown felt, a dark band, a dent in the crown ----------
M = affine(scale=(1.04, 0.95), rot=4, src_pt=(143, 92), dst_pt=(150, 112))
FELT = [(0.0, (24, 16, 10)), (0.2, (60, 42, 26)), (0.38, (90, 66, 42)), (0.55, (116, 88, 58)), (0.72, (138, 108, 74)), (0.88, (160, 128, 92))]
hat = bucket_hat(M, S, FELT, gain=1.0, flatten=4.0, band=((34, 24, 16), (56, 40, 26), (80, 60, 40)))
# the crushed crown: a dent pressed into its top, creases down its front
CX, CY = 152, 34
ha = hat[..., 3]
dent = soft_poly(S, [ellipse(CX, CY - 4, 24, 8, 0.07)])
hat[..., 3] = ha * (1 - dent)
lip = ellipse(CX, CY - 4, 24, 8, 0.07, 30, 0.08 * np.pi, 0.92 * np.pi)
inside = erode_cv(hat[..., 3] > 0.5, 1)
DENT_IN = curve((CX - 24, CY - 3), (CX, CY + 10), (CX + 24, CY - 1)) + curve((CX + 24, CY - 1), (CX, CY + 4), (CX - 24, CY - 3))
hat = over(hat, celp([DENT_IN], ((60, 42, 26),) * 3, clip=inside, outline=False, shade=0, light=0))
hat = over(hat, strokes(S, [(lip[i], lip[i], lip[i + 1], 1.8) for i in range(len(lip) - 1)], LINE, taper_to=1.0,
                        clip=dilate_cv(ha > 0.5, 1)))
CREASES = [((CX - 2, CY + 8), (CX - 4, CY + 18), (CX - 8, CY + 26), 1.6), ((CX - 30, CY + 2), (CX - 34, CY + 12), (CX - 40, CY + 20), 1.3),
           ((CX + 30, CY + 4), (CX + 34, CY + 14), (CX + 38, CY + 22), 1.3)]
hat = over(hat, strokes(S, CREASES, (48, 34, 20), alpha=0.85, clip=inside))
hat = over(hat, strokes(S, [((CX + 2, CY + 9), (CX + 2, CY + 18), (CX - 1, CY + 26), 1.2)], (170, 140, 104), alpha=0.7, clip=inside))
put_hat(b, hat, shadow=(140, 110, 100), shadow_k=0.5, sdx=2, sdy=9)
# white tufts sticking out under the brim at both sides (behind the head)
TUFT_T = ((150, 150, 162), (222, 222, 228), (246, 246, 250))
CLUMPS = [((90, 100), (74, 98), (58, 106), 11), ((90, 106), (72, 108), (60, 120), 11), ((90, 112), (78, 118), (68, 130), 9),
          ((92, 118), (86, 126), (80, 136), 5),
          ((210, 112), (226, 112), (240, 122), 11), ((210, 120), (228, 124), (238, 138), 11), ((208, 128), (224, 136), (230, 150), 9),
          ((206, 136), (216, 146), (218, 158), 5)]
tufts = celp([taper(bez(r, c, t, 20), w, 0.0, w_mid=w * 1.1) for r, c, t, w in CLUMPS], TUFT_T, shade=3, light=1.5, lw=1.4)
tufts = over(tufts, strokes(S, [((r[0] + (c[0] - r[0]) * 0.3, r[1] + (c[1] - r[1]) * 0.3), c, t, 1.0) for r, c, t, w in CLUMPS],
                            TUFT_T[0], alpha=0.7, clip=erode_cv(tufts[..., 3] > 0.5, 1), taper_to=0.1))
b.img = over(tufts, b.img)
b.save(OUT)
print('ok', OUT)
