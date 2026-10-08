# Bronek (a town boy, about 9): People1_1 repainted to his map sprite - messy ginger-brown hair, freckles, and no smock any
# more: the white shirt and the green smock one plain cream linen tunic - the shirt's turned-down collar cut away (the neck
# painted where it stood) for a V neck laced with a dark cord, the sleeves recoloured, the smock painted over as the tunic's
# front with soft folds.
# Run: python tools/busts/make_bronek.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Bronek_Bust.png')
b = Bust('People1_1')
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


# ---------- the hair: ginger brown ----------
hair = b.sel(hue=(300, 20), sat=(0.25, 1), val=(0, 0.9), box=(60, 10, 250, 175)) | b.sel(hue=(330, 15), sat=(0.38, 1), box=(60, 10, 250, 112))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 10, 250, 175)
GINGER = [(0.0, (34, 18, 10)), (0.15, (72, 40, 20)), (0.3, (112, 68, 34)), (0.45, (150, 98, 52)), (0.6, (180, 124, 70)), (0.8, (212, 162, 108)),
          (0.95, (236, 200, 150))]
b.ramp(hair, GINGER)

# ---------- the collar gone: a V neck, the neck painted where the collar stood ----------
face = b.comp(b.sel(hue=(0, 45), sat=(0.08, 0.5), val=(0.75, 1), box=(80, 60, 240, 210)), (150, 150))
ff = fill_holes(face)
keep = (dilate_cv(ff, 2) | (dilate_cv(ff, 6) & (luma(b.src) < 0.35)) | hair | b.lines_of(hair, 2)) & b.op()   # (+ the white rim, the jaw line)
VNECK = curve((146, 216), (151, 232), (158, 250)) + curve((158, 250), (166, 234), (180, 222), (194, 214))
L_SH = curve((98, 236), (110, 228), (128, 222), (146, 216))
R_SH = curve((194, 214), (212, 216), (236, 224), (256, 232), (264, 242))
ABOVE = b.poly([(60, 150), (290, 150), (290, 244), (264, 242)] + R_SH[::-1][1:] + VNECK[::-1][1:] + L_SH[::-1][1:] + [(98, 236), (60, 240)])
b.erase(ABOVE & (b.yy > 176) & ~keep)
NECK = [(144, 200), (152, 207), (170, 201), (186, 189), (196, 172), (200, 196), (198, 222), (186, 246), (158, 256), (144, 230)]
NECK_T = ((212, 146, 132), (240, 190, 166), (250, 212, 190))
nk = b.poly(NECK) & (b.yy > 176) & ~ff & ~hair & ~(dilate_cv(ff, 6) & (luma(b.src) < 0.35))
b.over(flat([NECK], NECK_T[1], nk))
b.over(flat([curve((136, 198), (152, 210), (172, 204), (198, 182)) + [(200, 196)] + curve((200, 196), (176, 214), (152, 218), (136, 210))],
            NECK_T[0], nk))
b.over(flat([[(184, 196), (200, 178), (202, 250), (184, 250)]], NECK_T[0], nk))
b.over(strokes(S, [((146, 204), (145, 212), (146, 220), 1.8), ((195, 180), (195, 198), (193, 214), 1.8)], LINE, taper_to=1.0,
               clip=dilate(nk, 1)))

# ---------- the shirt and the smock: one cream linen tunic ----------
clothes = b.op() & (b.yy > 176) & region(S, 60, 176, 300, 350) & ~nk & ~keep
cuffs = b.sel(hue=(15, 70), sat=(0.2, 1)) & (region(S, 76, 294, 114, 318) | region(S, 216, 298, 278, 324))
skin = b.sel(hue=(330, 30), sat=(0.2, 0.75), val=(0.3, 1)) & clothes & (b.yy >= 310) & ~cuffs        # (the arms)
smock = b.sel(hue=(90, 180), sat=(0.12, 1), box=(60, 180, 290, 350))
smock = b.grow(smock, 2, 0.3) & region(S, 60, 180, 290, 350) & clothes
shirt = clothes & ~skin & ~smock
LINEN = [(0.0, (34, 26, 20)), (0.3, (110, 96, 78)), (0.55, (170, 154, 130)), (0.7, (196, 180, 154)), (0.85, (220, 206, 180)),
         (0.95, (232, 220, 196)), (1.0, (240, 230, 208))]
b.ramp(shirt, LINEN)
LIN_T = ((192, 176, 150), (226, 212, 188), (242, 232, 210))
LIN_DEEP = (152, 134, 110)
b.ramp(smock, [(0.0, LINE), (0.25, LIN_DEEP), (0.6, LIN_T[0]), (1.0, LIN_T[1])])     # (under the painted front's soft edge, the sides)
# the tunic's front: painted over the smock and the shirt's chest under the old collar (no line where it meets the sleeves),
# the near shoulder over what was left of the collar
FRONT = (L_SH + VNECK[1:] + R_SH[1:] + [(268, 254), (240, 262), (236, 400), (90, 400), (90, 240)])
chest = shirt & b.poly([(110, 226), (146, 216), (194, 214), (212, 218), (260, 236), (262, 254), (226, 254), (214, 262), (186, 264), (186, 292),
                        (136, 292), (136, 264), (120, 262), (110, 240)])
front = (smock | chest) & b.poly(FRONT)
b.over(celp([FRONT], LIN_T, clip=front, outline=False, shade=0, light=0))
b.over(strokes(S, [((214, 222), (238, 228), (258, 238), 3.0)], LIN_T[2], alpha=0.9, clip=front, taper_to=0.3))
EDGE = L_SH + VNECK[1:] + R_SH[1:]
b.over(strokes(S, [(EDGE[i], EDGE[i + 1], EDGE[i + 1], 2.0) for i in range(len(EDGE) - 1)], LINE, taper_to=1.0))
fm = erode_cv(front, 2)
FOLDS = [((128, 276), (130, 318), (124, 360), 1.0, 7.0), ((166, 282), (170, 320), (168, 360), 1.0, 6.0), ((204, 262), (210, 310), (214, 360), 1.0, 8.0)]
b.over(flat([taper(bez(p0, p1, p2, 24), w0, w1) for p0, p1, p2, w0, w1 in FOLDS], LIN_T[0], fm))
b.over(strokes(S, [(p0, p1, p2, 1.1) for p0, p1, p2, w0, w1 in FOLDS], LIN_DEEP, alpha=0.7, clip=fm, taper_to=1.4))
b.over(flat([curve((150, 236), (156, 252), (162, 258), (168, 252), (176, 232)) + [(180, 240)] + curve((180, 240), (170, 262), (158, 266), (146, 246))],
            LIN_T[0], fm))                                                                   # (the shade under the V)
# the V laced across with a dark cord
CORD = (70, 44, 28)
ZIG = [(149, 225), (168, 229), (152, 235), (165, 240), (155, 245), (161, 249)]
b.over(strokes(S, [(ZIG[i], ((np.asarray(ZIG[i]) + np.asarray(ZIG[i + 1])) / 2).tolist(), ZIG[i + 1], 1.3) for i in range(len(ZIG) - 1)],
               CORD, alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((159, 247), (161, 256), (158, 266), 1.4), ((159, 247), (156, 256), (154, 264), 1.3)], CORD, alpha=1.0, taper_to=0.5))

# ---------- freckles ----------
b.over(dots(S, [(108, 158, 1.3), (114, 162, 1.1), (120, 157, 1.2), (104, 165, 1.0), (112, 168, 1.0),
                (176, 158, 1.3), (182, 162, 1.1), (188, 157, 1.2), (186, 166, 1.0), (178, 167, 1.0), (192, 163, 1.0)],
            FRECKLE, alpha=0.75, clip=face))
b.save(OUT)
print('ok', OUT)
