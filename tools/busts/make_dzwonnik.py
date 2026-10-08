# Ambrozy (the very old bell-ringer) as on his map sheet ($Npc_Dzwonnik): People3_1 (the old king) repainted - the crown gone
# and a bald old head painted in its place (white hair kept at the sides), the long white beard kept; everything else (the
# royal robe, its fur, the jewel) painted over with a PLAIN dark-grey wool habit: a laid-down cowl round the neck and
# shoulders, its two front edges meeting in a V under the beard, a few heavy folds, a rope cord with his big iron key.
# (2026-10-07: the first version, the draped ornate robe of the Order, is kept for later - make_ambrozy_zakon.py ->
# Ambrozy_Bust_Zakon.png.) Run: python tools/busts/make_dzwonnik.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Dzwonnik_Bust.png')
b = Bust('People3_1')
S = b.img.shape

# ---------- what stays of the old king: the face, the white side hair, the beard (a hand-drawn outline round them) ----------
KEEP = [(88, 92), (92, 120), (95, 148), (99, 172), (106, 190), (118, 192), (126, 212), (133, 230), (141, 247), (150, 264), (163, 256),
        (175, 241), (187, 221), (199, 197), (209, 175), (222, 170), (236, 165), (243, 140), (246, 110), (246, 92)]
keep = b.poly(KEEP) & b.op()
# (not the robe's blue, violet and gold that the outline takes in by the beard; the hair's violet shade grey)
keep &= ~(b.sel(hue=(190, 300), sat=(0.25, 1), box=(0, 182, 330, 350)) | b.sel(hue=(20, 60), sat=(0.45, 1), box=(0, 182, 330, 350)))
keep &= ~b.sel(sat=(0.3, 1), val=(0.3, 1), box=(150, 200, 260, 350))
keep = b.comp(keep, (150, 220)) | (keep & region(S, 0, 0, 330, 182))
sides = b.poly([(80, 90), (112, 90), (112, 200), (80, 200)], [(200, 90), (252, 90), (252, 200), (200, 200)])
b.ramp(b.sel(hue=(195, 330), sat=(0.08, 1), box=(80, 90, 252, 200)) & keep & sides, RAMPS['hair_grey'], gain=1.1, bias=0.05)
kept = take(b.img, keep)

# ---------- the habit: dark warm grey wool (the map sheet's colours), painted as new shapes ----------
ROBE = ((50, 49, 47), (80, 79, 75), (112, 110, 105), (36, 35, 34))
COWL = ((56, 55, 52), (90, 88, 84), (126, 124, 118), (40, 39, 37))
BODY = [(96, 160), (60, 186), (26, 212), (-10, 242), (-30, 390), (360, 390), (350, 222), (300, 206), (266, 186), (240, 164)]
PAD = 40


def celp(polys, tones, **kw):
    """cel() on a canvas padded below and at the sides, cut back: no shade band or line along the picture's own edges."""
    P = [[(x + PAD, y) for x, y in p] for p in polys]
    return cel((S[0] + PAD, S[1] + 2 * PAD) + S[2:], P, tones, **kw)[:S[0], PAD:PAD + S[1]]


robe = celp([BODY], ROBE[:3], lw=2.2, shade=16, light=4, shade2=6, ldir=(0.55, 0.83))
# the cowl lying round the neck and on the shoulders, its two front edges coming down to a V under the beard
COWL_L = [(98, 150), (78, 164), (60, 186), (56, 214), (70, 244), (98, 272), (128, 294), (156, 304), (158, 276), (138, 254), (120, 226),
          (106, 196), (100, 172)]
COWL_R = [(236, 150), (256, 162), (272, 184), (276, 212), (262, 244), (234, 272), (200, 294), (158, 306), (158, 276), (180, 258),
          (198, 230), (210, 200), (222, 174)]
cowl = cel(S, [COWL_L, COWL_R], COWL[:3], lw=2.2, shade=9, light=3.5, shade2=3.5)
FRONT = [(118, 226), (196, 226), (172, 290), (158, 300), (144, 290)]          # (the habit's front between the cowl's edges)
front = cel(S, [FRONT], (ROBE[3], ROBE[0], ROBE[1]), lw=1.6, shade=6, light=0)
lay = over(over(robe, front), cowl)
# the cowl's shadow on the robe under it (a flat darker tone, like the RTP cel shadows)
cm = cowl[..., 3] > 0.5
sh = shift(cm, 3, 7) & ~cm & (robe[..., 3] > 0.5)
lay[..., :3] = np.where(sh[..., None], lay[..., :3] * np.asarray([0.62, 0.62, 0.64], np.float32), lay[..., :3])
# the cowl's roll: a fold line along each half and a light ridge beside it
lay = over(lay, strokes(S, [((84, 172), (66, 206), (90, 246), 1.4), ((250, 166), (268, 204), (246, 240), 1.4)], FOLD_D := (36, 35, 34), alpha=0.8,
                       clip=cm))
lay = over(lay, strokes(S, [((88, 168), (71, 204), (94, 242), 1.2), ((246, 164), (263, 202), (242, 236), 1.2)], COWL[2], alpha=0.6, clip=cm))
# heavy folds: in the cowl (along it) and down the body
FOLD = (40, 39, 37)
lay = over(lay, strokes(S, [((74, 196), (80, 226), (100, 254), 1.6), ((90, 204), (98, 230), (118, 256), 1.2),
                            ((262, 196), (258, 226), (238, 254), 1.6), ((246, 204), (240, 228), (222, 252), 1.2),
                            ((70, 176), (88, 166), (102, 160), 1.3), ((262, 172), (248, 164), (236, 158), 1.3)], FOLD, alpha=0.75,
                       clip=cowl[..., 3] > 0.5))
lay = over(lay, strokes(S, [((30, 262), (40, 300), (36, 350), 2.0), ((62, 276), (70, 312), (66, 350), 1.6), ((300, 250), (292, 300), (298, 350), 2.0),
                            ((270, 270), (262, 310), (266, 350), 1.6), ((112, 300), (118, 326), (114, 350), 1.4), ((214, 296), (208, 324), (212, 350), 1.4)],
                       FOLD, alpha=0.7, clip=(robe[..., 3] > 0.5) & ~(cowl[..., 3] > 0.5)))
lay = over(lay, strokes(S, [((40, 262), (50, 296), (46, 340), 1.4), ((290, 254), (284, 296), (288, 340), 1.4)], ROBE[2], alpha=0.45,
                       clip=(robe[..., 3] > 0.5) & ~(cowl[..., 3] > 0.5)))
# coarse wool: a few darns and worn spots
lay = over(lay, strokes(S, [((44, 318), (52, 316), (60, 319), 1.0), ((46, 322), (54, 320), (62, 323), 1.0), ((276, 300), (284, 298), (290, 302), 1.0)],
                       (66, 64, 60), alpha=0.8))
b.img = over(lay, kept)
# a clean dark line round the beard where the robe now meets it
BEARD_L = [(104, 188), (116, 196), (126, 213), (134, 231), (142, 248), (150, 264)]
BEARD_R = [(150, 264), (162, 256), (175, 241), (187, 221), (199, 197), (209, 176)]
b.over(strokes(S, [(p0, ((np.asarray(p0) + np.asarray(p1)) / 2).tolist(), p1, 2.0) for E in (BEARD_L, BEARD_R) for p0, p1 in zip(E, E[1:])],
               LINE, alpha=1.0, taper_to=1.0))
# the kept side hair ends where the cowl starts: a line along its outer edge
b.over(strokes(S, [((88, 120), (93, 150), (100, 174), 1.6), ((243, 120), (241, 150), (236, 165), 1.6)], LINE, alpha=0.9, taper_to=0.6))

# ---------- the crown off: the area above its lower edge cleared, a bald head painted ----------
CROWN = [(76, 0), (254, 0), (254, 84), (228, 92), (202, 95), (176, 98), (146, 94), (120, 88), (90, 91), (76, 94)]
b.erase(b.poly(CROWN))
b.erase(b.sel(hue=(20, 60), sat=(0.45, 1), box=(70, 0, 260, 112), src=False) & ~b.poly([(104, 100), (232, 100), (232, 180), (104, 180)]))
b.erase(b.sel(sat=(0.15, 1), box=(70, 82, 100, 108), src=False) | b.sel(sat=(0.15, 1), box=(238, 82, 262, 108), src=False))
CX, CY, RX, RY = 167, 108, 70, 80
ARC = ellipse(CX, CY, RX, RY, 0, 48, np.pi * 1.0, np.pi * 2.0)
DOME = ARC + [(237, 110), (210, 104), (176, 104), (146, 101), (118, 104), (97, 110)]
SKIN = ((222, 172, 132), (245, 207, 167), (254, 228, 192))
# (painted as the whole ellipse and cut to the dome: no shade band along the cut above the brows)
b.over(cel(S, [ellipse(CX, CY, RX, RY, 0, 60)], SKIN, outline=False, shade=12, light=5, clip=b.poly(DOME)))
top = ARC
b.over(strokes(S, [(top[i], ((np.asarray(top[i]) + np.asarray(top[i + 1])) / 2).tolist(), top[i + 1], 2.0) for i in range(len(top) - 1)],
               LINE, alpha=1.0, taper_to=1.0))
# old age on the scalp and forehead: creases, a few spots
b.over(strokes(S, [((128, 84), (160, 78), (196, 84), 1.4), ((134, 92), (162, 87), (192, 92), 1.2), ((150, 60), (166, 57), (182, 60), 1.1)],
               (176, 112, 80), alpha=0.6))
# (the seam where the painted scalp meets the old forehead: wrinkles across it)
b.over(strokes(S, [((112, 104), (140, 98), (166, 102), 1.3), ((170, 101), (196, 97), (226, 104), 1.3), ((124, 100), (150, 96), (176, 99), 0.9)],
               (190, 128, 92), alpha=0.55))
b.over(dots(S, [(176, 46, 2.2), (186, 52, 1.6), (146, 50, 1.8)], (206, 150, 110), alpha=0.6))
# white hair round the sides, over the ears
HAIR_T = ((170, 170, 180), (226, 226, 232), (250, 250, 252))
side = []
for i in range(7):
    y = 96 + i * 5
    side.append(((100 + i * 0.6, y), (92 - i * 0.8, y + 12), (88 - i * 1.2, y + 26), 1.5))
    side.append(((234 - i * 0.6, y - 2), (242 + i * 0.8, y + 10), (246 + i * 1.2, y + 24), 1.5))
b.over(strokes(S, side, HAIR_T[1], alpha=0.95, taper_to=0.15))
b.over(strokes(S, side[::2], HAIR_T[0], alpha=0.6, taper_to=0.15))

# ---------- the rope cord round the neck and the big iron key on it ----------
CORD = (150, 124, 84)
b.over(strokes(S, [((214, 184), (232, 230), (238, 289), 3.6)], (60, 46, 28), alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((214, 184), (232, 230), (238, 289), 2.0)], CORD, alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((219, 196), (220, 199), (222, 201), 1.0), ((226, 214), (227, 217), (229, 219), 1.0), ((231, 234), (232, 237), (233, 239), 1.0),
                   ((234, 254), (235, 257), (236, 259), 1.0), ((236, 272), (237, 275), (237, 277), 1.0)], (96, 76, 46), alpha=0.9))
KEY_T = ((40, 40, 46), (86, 86, 94), (140, 140, 150))
ring = ellipse(238, 298, 8, 8, 0, 24)
hole = ellipse(238, 298, 4, 4, 0, 16)
shaft = [(235, 305), (241, 305), (242, 334), (236, 334)]
bit = [(242, 322), (250, 322), (250, 326), (246, 326), (246, 330), (242, 330)]
b.over(cel(S, [ring, shaft, bit], KEY_T, lw=1.2, shade=2, light=1, holes=[hole]))
b.save(OUT)
print('ok', OUT)
