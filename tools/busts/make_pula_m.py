# Pula_M (a pool body of the travellers from the ferry, docs/PODROZNI.md: an ordinary travelling man of about 35, 2026-10-29):
# SF_Actor1_7 (the schoolboy in the vest) repainted to his PixelLab map sheet ($Npc_Pula_M) - the grey-brown hair a warm mid
# brown, the face tanned and a little older (lines at the eyes and the mouth), brown eyes, a short full brown beard round the jaw
# with a moustache (painted); everything under the head painted new: the neck, a plain undyed cream linen tunic and over it a
# long plain DARK-GREEN wool travelling cloak, its hood lying bunched behind the neck, fastened at the throat with a small
# round brass brooch, its front edges falling apart to show the tunic.
# Recolour bands (for tools/podroznicy/pula_kolory.py): the cloak and its hood are the only green - hue 112..120 (their edges into
# the dark line down to 90), sat 0.27..0.35; nothing else in the bust has a hue between 60 and 180.
# 0 PixelLab generations. Run: python tools/busts/make_pula_m.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Pula_M_Bust.png')
b = Bust('SF_Actor1_7')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)
TALL = (H + 40, W + 80)


def cel_b(polys, tones, **kw):
    """cel() on a canvas bigger than the bust (below and right), cropped: no shade band or line along the frame's edges."""
    return cel(TALL, polys, tones, ldir=LD, **kw)[:H, :W]


def smooth(pts, it=3):
    """Chaikin corner cutting of an open polyline (the ends kept): a round painted edge from a few points."""
    p = np.asarray(pts, np.float64)
    for _ in range(it):
        q = [p[0]]
        for a, c in zip(p[:-1], p[1:]):
            q += [a * 0.75 + c * 0.25, a * 0.25 + c * 0.75]
        q.append(p[-1])
        p = np.asarray(q)
    return [tuple(v) for v in p]


# the map's colours ($Npc_Pula_M front frame): cloak (61, 84, 58)/(39, 55, 36)/(30, 43, 28), tunic (204, 186, 157)/(177, 155, 128)/
# (151, 136, 114), skin (224, 163, 116), hair and beard (101, 68, 43)/(75, 50, 33)/(58, 38, 24)
HAIR = [(0.0, (22, 13, 8)), (0.12, (44, 28, 17)), (0.25, (66, 43, 27)), (0.38, (88, 59, 37)), (0.5, (108, 74, 47)), (0.65, (134, 96, 64)),
        (0.8, (166, 124, 88)), (1.0, (196, 156, 118))]
BEARD_T = ((62, 41, 26), (88, 60, 38), (118, 82, 54), (40, 26, 16))
SKIN_T = ((190, 122, 86), (224, 158, 118), (240, 184, 146))
CLOAK_T = ((32, 48, 32), (50, 72, 48), (70, 96, 66), (22, 34, 22))
HOOD_T = ((30, 45, 30), (46, 67, 45), (66, 90, 62), (21, 32, 21))
TUNIC_T = ((152, 134, 110), (202, 184, 156), (224, 210, 186), (122, 106, 86))
BRASS_T = ((112, 80, 34), (176, 138, 66), (224, 196, 122))

# ---------- the head: hair warm brown, eyes brown, skin tanned ----------
EYES = [[(104, 112), (138, 112), (138, 134), (104, 134)], [(160, 108), (198, 108), (198, 132), (160, 132)]]
EAR = [(203, 116), (214, 112), (224, 118), (224, 140), (216, 158), (204, 162)]
skin0 = b.sel(hue=(0, 45), sat=(0.08, 0.62), val=(0.8, 1))
hair = b.sel(box=(55, 0, 285, 185)) & ~skin0 & ~b.poly(*EYES) & ~b.poly(EAR)
hair &= ~b.poly([(104, 128), (200, 122), (204, 200), (104, 200)])            # (the face below the eyes)
hair |= b.sel(hue=(290, 15), sat=(0.05, 0.3), val=(0.2, 0.75), polys=EYES)          # (the fringe's strands over the eyes)
hair |= b.sel(hue=(180, 300), sat=(0.08, 1), box=(196, 100, 234, 186)) & ~skin0     # (the hair's blue rim light by the ear)
b.ramp(hair, HAIR, gain=1.0)
b.over(hair_strands(S, erode_cv(hair, 2), (170, 180), HAIR[6][1], HAIR[2][1], n=120, length=(8, 16), seed=11, alpha=(0.35, 0.35)))
eyes = b.sel(hue=(200, 300), sat=(0.2, 1), polys=EYES)
b.ramp(eyes, [(0.0, (16, 10, 6)), (0.2, (48, 30, 18)), (0.45, (96, 64, 38)), (0.7, (150, 108, 70)), (1.0, (196, 160, 120))])
skin = b.sel(hue=(0, 45), sat=(0.08, 0.7), val=(0.45, 1), box=(80, 60, 240, 230)) & ~hair
b.multiply(skin, (228, 190, 160), 1.0)
# about 35: crow's feet at the near eye, a line under each eye, the cheek's crease down to the mouth
WR = (176, 108, 76)
b.over(strokes(S, [((104, 128), (101, 131), (99, 135), 1.0), ((111, 136), (120, 139), (130, 137), 1.0),
                   ((166, 132), (176, 135), (188, 132), 1.0), ((132, 158), (130, 166), (134, 172), 1.2)], WR, alpha=0.5, clip=skin))

# the head cut along the jaw (the shirt collar and the body go; the beard covers the cut)
HEAD = [(50, 0), (290, 0), (290, 150), (240, 182), (214, 172), (204, 186), (190, 198), (172, 206), (156, 207), (140, 202), (126, 192),
        (112, 176), (96, 172), (50, 160)]
head = take(b.img, b.poly(HEAD) & b.op())

# ---------- the new body ----------
body = np.zeros((H, W, 4), np.float32)
# the hood lying bunched behind the neck (seen beside the neck, above the shoulders)
HOOD = smooth([(84, 262), (90, 236), (104, 216), (124, 204), (150, 196), (176, 194), (204, 196), (228, 206), (248, 222), (258, 246),
               (262, 266)]) + [(84, 266)]
hood = cel_b([HOOD], HOOD_T[:3], lw=2.0, shade=9, light=3, shade2=4)
body = over(body, hood)
# the neck
NECK = [(140, 176), (208, 166), (210, 212), (206, 250), (142, 250), (138, 212)]
neck = cel_b([NECK], SKIN_T, lw=2.0, shade=8, light=2)
nm = neck[..., 3] > 0.5
CHIN_SH = [(120, 170), (214, 168), (210, 200), (192, 212), (170, 220), (148, 218), (130, 206)]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the tunic: undyed linen, a round neckline
TUNIC = smooth([(40, 350), (50, 290), (66, 256), (100, 236), (138, 226)]) + smooth([(138, 226), (152, 238), (174, 244), (194, 238), (208, 224)]) \
    + smooth([(208, 224), (246, 234), (282, 254), (304, 290), (312, 350)])
tunic = cel_b([TUNIC], TUNIC_T[:3], lw=2.0, shade=10, light=3, shade2=4)
tm = erode_cv(tunic[..., 3] > 0.5, 2)
tunic = over(tunic, strokes(S, [((176, 270), (172, 300), (176, 350), 1.6), ((150, 268), (146, 310), (150, 350), 1.3),
                                ((206, 262), (212, 300), (208, 350), 1.3)], TUNIC_T[3], alpha=0.55, clip=tm, taper_to=0.2))
body = over(body, tunic)
# the cloak's two halves: from the brooch at the throat over the shoulders, the front edges falling apart over the tunic
CL_L = smooth([(166, 244), (150, 236), (134, 226), (114, 228), (86, 240), (60, 258), (44, 290), (34, 350)]) + [(110, 350)] \
    + smooth([(110, 350), (126, 300), (146, 268), (166, 244)])
CL_R = smooth([(180, 244), (196, 234), (212, 222), (238, 226), (272, 238), (300, 256), (318, 290), (326, 350)]) + [(246, 350)] \
    + smooth([(246, 350), (228, 300), (204, 266), (180, 244)])
cloak = cel_b([CL_L, CL_R], CLOAK_T[:3], lw=2.0, shade=12, light=3.5, shade2=5)
cm = cloak[..., 3] > 0.5
# wool: a faint texture, the heavy folds from the shoulders down
cloak = over(cloak, hair_strands(S, erode_cv(cm, 3), (170, 600), CLOAK_T[2], CLOAK_T[3], n=260, length=(3, 6), seed=12, alpha=(0.22, 0.28)))
FOLDS = [((70, 270), (62, 310), (64, 350), 2.2), ((96, 264), (92, 306), (94, 350), 1.6), ((120, 252), (112, 290), (112, 320), 1.3),
         ((276, 262), (286, 306), (284, 350), 2.2), ((254, 254), (262, 300), (262, 350), 1.6), ((228, 246), (240, 280), (244, 320), 1.3)]
cloak = over(cloak, strokes(S, FOLDS, CLOAK_T[3], alpha=0.75, clip=erode_cv(cm, 2), taper_to=0.15))
cloak = over(cloak, strokes(S, [((78, 268), (70, 310), (72, 350), 1.3), ((262, 258), (270, 300), (270, 350), 1.3)], CLOAK_T[2], alpha=0.5,
                            clip=erode_cv(cm, 2), taper_to=0.2))
body = over(body, cloak)
# the brooch at the throat: a small round brass pin
body = over(body, cel_b([ellipse(173, 244, 8, 7, 0, 30)], BRASS_T, lw=1.4, shade=2.5, light=1.2,
                        holes=[ellipse(173, 244, 3.2, 2.8, 0, 16)]))
body = over(body, strokes(S, [((162, 252), (173, 244), (186, 236), 1.6)], (90, 70, 40), alpha=1.0, taper_to=1.0))

# ---------- the head over it, its chin's shadow on the neck ----------
hm = head[..., 3] > 0.5
bm = body[..., 3] > 0.5
cs = shift(hm & (b.yy > 160), 2, 8) & ~hm & bm
body[..., :3] = np.where(cs[..., None], body[..., :3] * np.asarray((0.74, 0.66, 0.66), np.float32), body[..., :3])
b.img = over(body, head)

# ---------- the short full beard and moustache ----------
OUTER = [(110, 140), (109, 152), (113, 166), (123, 182), (137, 196), (152, 207), (168, 208), (184, 200), (197, 186), (206, 168), (209, 150),
         (207, 132)]
INNER = [(200, 128), (198, 148), (190, 164), (178, 176), (166, 182), (154, 183), (143, 180), (133, 172), (124, 160), (118, 150), (115, 140)]
MOUS = [(134, 178), (138, 168), (148, 163), (160, 162), (172, 165), (180, 176), (172, 174), (160, 172), (148, 173), (140, 175)]
# (the lower lip under the moustache darker, its bright shine gone; the mouth's line kept)
LIP = b.poly([(138, 175), (180, 175), (178, 186), (140, 186)])
b.multiply(LIP & b.sel(lum=(0.5, 1)), (214, 170, 150), 1.0)
b.over(beard2(S, OUTER, INNER, BEARD_T, flow=(160, 230), mous=MOUS, mous_flow=(156, 182), seed=13, n=120, tip=4, out=2.2, seg=8))
b.save(OUT)
print('ok', OUT)
