# Melia "Silvervoice" (the tavern's singer, a young woman): People2_2 repainted to match her map sprite - the long straight
# purple hair falling on both sides of the face silver-white (a light grey ramp, barely cool), the dark skin fair, the jewel on
# the forehead and the earring gone; the dark purple-and-gold dress a blue gown: the high laced collar dark navy (the dark
# choker on the map) with cream laces, a plain blue bodice painted over the gold ornaments, jewels and bare keyhole, laced
# down the middle with cream cord on a navy panel, blue sleeves; the bare shoulders and upper arms under a plum-brown capelet
# (painted, one piece with a rolled hood behind the collar) that the long right lock falls over.
# Run: python tools/busts/make_melia.py [out.png]
import sys
from kit import *

LDIR = (0.55, 0.83)       # (cel's shade band goes to the lower right, away from the RTP light)

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Melia_Bust.png')
b = Bust('People2_2')
S = b.img.shape
H, W = S[:2]
S2 = (H + 30, W, 4)       # (shapes cut by the picture's bottom edge are painted on a taller canvas: no shade band along the cut)


def pad(m):
    return np.vstack([m, np.repeat(m[-1:], 30, 0)])


def smooth(pts, n=6):
    """A closed Catmull-Rom curve through pts."""
    P = np.asarray(pts, np.float64)
    out = []
    for i in range(len(P)):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % len(P)], P[(i + 2) % len(P)]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
                                    (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)))
    return out


# ---- the forehead jewel and the earring filled in (in the source, so the ramps below treat them as skin / hair) ----
JEWEL = [(163, 86), (176, 86), (176, 113), (163, 113)]
jewel = b.sel(poly=JEWEL) & ~b.sel(hue=(10, 40), sat=(0.25, 0.6), val=(0.6, 1))
jewel = dilate_cv(jewel, 1) & b.poly(JEWEL) | b.sel(hue=(180, 245), sat=(0.4, 1), box=(163, 86, 180, 114))
b.src[..., :3] = np.where(jewel[..., None], np.float32([231, 175, 135]) / 255, b.src[..., :3])
EARRING = [(207, 153), (223, 151), (223, 168), (207, 168)]
lobe = b.sel(hue=(5, 45), sat=(0.2, 0.7), val=(0.62, 1), box=(200, 140, 226, 170))
ear = b.poly(EARRING) & ~lobe
b.src[..., :3] = np.where(ear[..., None], np.float32([26, 14, 51]) / 255, b.src[..., :3])          # (the dark hair behind)
rim = ear & dilate_cv(lobe, 1)
b.src[..., :3] = np.where(rim[..., None], np.float32([20, 10, 12]) / 255, b.src[..., :3])          # (the lobe's line)
hd, sv, vv = hsv_of(b.src)
L = luma(b.src)

# ---- the hair silver: everything purple outside the outfit; inside it only the pinkish locks (and the dark of the two long
# locks at the sides) - the dress is purple too ----
OUTFIT = [(126, 150), (203, 150), (203, 202), (222, 214), (250, 258), (262, 236), (296, 236), (304, 350), (16, 350), (26, 236),
          (62, 232), (112, 250), (124, 214)]
COLLAR = [(126, 150), (203, 150), (203, 204), (207, 214), (203, 230), (186, 240), (165, 246), (142, 240), (126, 232)]
RLOCK = [(236, 196), (262, 196), (298, 270), (332, 326), (332, 352), (296, 352), (268, 284), (246, 244)]
LLOCK = [(12, 226), (46, 226), (38, 262), (31, 314), (12, 314)]
outfit = b.poly(OUTFIT)
purple = (hd >= 222) & (hd <= 335) & (sv > 0.12) & b.op()
pink = (hd >= 282) & (hd <= 335) & (sv > 0.2) & (vv > 0.3)
hair = purple & ~outfit
hair |= outfit & b.op() & (pink | (b.poly(RLOCK) & (hd >= 245) & (hd <= 282) & (sv > 0.5) & (vv < 0.35)) | (b.poly(LLOCK) & purple))
hair |= ear
hair = b.grow(hair, 2, 0.1)
SILVER = [(0.0, (34, 30, 38)), (0.05, (68, 68, 78)), (0.1, (106, 107, 117)), (0.2, (148, 149, 157)), (0.32, (184, 185, 192)),
          (0.44, (209, 210, 215)), (0.56, (228, 229, 233)), (0.68, (242, 242, 245)), (0.85, (252, 252, 253))]
b.ramp(hair, SILVER)

# ---- the skin fair ----
skin = b.sel(hue=(0, 42), sat=(0.15, 0.62), val=(0.42, 1)) & ~hair
FAIR = [(0.0, (60, 30, 30)), (0.3, (150, 92, 82)), (0.5, (208, 154, 138)), (0.62, (232, 186, 168)), (0.7, (246, 210, 192)),
        (0.78, (252, 226, 210)), (0.9, (255, 240, 230))]
b.ramp(skin, FAIR)

# ---- the high laced collar dark navy (a choker on the map), the bare keyhole under it closed, the laces and bow cream ----
LACES = [(150, 184), (186, 184), (192, 250), (150, 250)]
FACE = [(118, 136), (128, 155), (146, 175), (166, 191), (180, 191), (204, 164), (212, 136)]
gold = b.sel(hue=(20, 60), sat=(0.3, 1), val=(0.15, 1))
laces = b.grow(gold & b.poly(LACES), 1, 0.12) & b.poly(LACES) & ~hair
collar = b.poly(COLLAR) & b.op() & ~hair & ~skin & ~laces & ~b.poly(FACE)
keyhole = skin & b.poly([(140, 222), (206, 222), (206, 266), (140, 266)])
NAVY = [(0.0, (10, 10, 18)), (0.08, (18, 22, 38)), (0.16, (28, 36, 60)), (0.26, (42, 54, 84)), (0.4, (62, 78, 112)), (0.7, (96, 114, 150))]
b.ramp(collar, NAVY)
b.ramp(keyhole, NAVY, gain=0.32)
b.ramp(laces, [(0.0, (40, 30, 24)), (0.2, (110, 96, 76)), (0.4, (186, 172, 146)), (0.6, (226, 216, 194)), (0.8, (246, 240, 226))])

# ---- the bodice: a plain blue front painted over the gold, the jewels and the keyhole, the bust only hinted (two soft curves),
# a navy panel down the middle laced with cream cord ----
BLUE = ((40, 58, 98), (62, 92, 140), (96, 128, 176), (30, 44, 76))
BODICE = [(116, 226), (140, 232), (165, 238), (192, 232), (214, 222), (238, 252), (258, 292), (262, 380), (90, 380), (96, 292),
          (106, 256)]
body = b.op() & ~hair & (~b.poly(COLLAR) | keyhole)
b.over(cel(S2, [BODICE], BLUE, lw=2.0, shade=10, light=3, clip=pad(body), ldir=LDIR)[:H])
bod = b.poly(BODICE) & body
b.over(strokes(S, [((112, 316), (128, 334), (152, 338), 1.3), ((194, 338), (218, 334), (236, 316), 1.2)], BLUE[3], alpha=0.7,
               taper_to=0.2, clip=bod))
PANEL = [(158, 246), (186, 246), (191, 380), (153, 380)]
b.over(cel(S2, [PANEL], ((22, 30, 54), (32, 44, 76), (48, 64, 100)), lw=1.4, shade=4, light=1.5, clip=pad(bod), ldir=LDIR)[:H])
ys = np.arange(256, 352, 11)
xl = 159.5 + (ys - 246) * 0.04                # (the panel narrows a little downwards)
xr = 184.5 - (ys - 246) * 0.04
X = []
for i in range(len(ys) - 1):
    my = (ys[i] + ys[i + 1]) / 2
    X.append(((xl[i], ys[i]), ((xl[i] + xr[i + 1]) / 2, my), (xr[i + 1], ys[i + 1]), 1.6))
    X.append(((xr[i], ys[i]), ((xr[i] + xl[i + 1]) / 2, my), (xl[i + 1], ys[i + 1]), 1.6))
b.over(strokes(S, X, (60, 50, 44), alpha=1.0, taper_to=1.0, width=2.6, clip=bod))
b.over(strokes(S, X, (232, 222, 198), alpha=1.0, taper_to=1.0, clip=bod))
b.over(dots(S, [(x, y, 1.5) for x, y in zip(xl, ys)] + [(x, y, 1.5) for x, y in zip(xr, ys)], (16, 18, 28), clip=bod))   # eyelets

# ---- the sleeves (below the capelet) blue, the gold arm bands a darker blue trim, the sheer lower sleeves blue cloth ----
sleeves = b.poly([(0, 228), (100, 228), (100, 352), (0, 352)], [(240, 228), (330, 228), (330, 352), (240, 352)]) & b.op() & ~hair
sleeves &= ~b.poly(BODICE)
BLUE_R = [(0.0, (14, 16, 30)), (0.06, (24, 32, 56)), (0.14, (40, 58, 98)), (0.24, (62, 92, 140)), (0.36, (84, 116, 164)),
          (0.5, (104, 136, 182)), (0.7, (132, 160, 200))]
band = sleeves & b.sel(hue=(20, 60), sat=(0.3, 1), val=(0.2, 1))
sheer = sleeves & b.sel(hue=(0, 45), sat=(0.08, 0.45), val=(0.3, 1)) & ~band
b.ramp(sleeves & ~band & ~sheer, BLUE_R)
b.ramp(sheer, BLUE_R, gain=0.5)
b.ramp(band, [(0.0, (14, 16, 30)), (0.3, (26, 36, 62)), (0.55, (40, 56, 92)), (0.75, (58, 80, 122)), (0.9, (88, 112, 156))])

# ---- the plum-brown capelet round the shoulders (a rolled hood behind the collar); the collar and the hair that falls in
# front (the long right lock, the locks beside the face) go back over it ----
front = b.poly(RLOCK, [(222, 140), (252, 140), (252, 214), (222, 214)], [(100, 140), (138, 140), (138, 240), (100, 240)])
front_hair = take(b.img, hair & front & dilate_cv(hair & pink, 1))
collar_now = take(b.img, (collar | laces | keyhole) & ~b.poly(BODICE))
CAPE_T = ((98, 46, 60), (134, 68, 82), (168, 102, 112), (72, 32, 44))
CAPE_L = smooth([(136, 200), (114, 205), (90, 208), (68, 215), (52, 228), (42, 246), (36, 268), (32, 290), (28, 310), (44, 318),
                 (62, 316), (78, 322), (96, 316), (112, 312), (122, 300), (126, 278), (129, 254), (132, 230)])
CAPE_R = smooth([(206, 200), (228, 205), (248, 211), (262, 221), (271, 236), (277, 256), (284, 278), (292, 300), (300, 316),
                 (284, 322), (266, 320), (250, 326), (236, 316), (226, 302), (221, 280), (217, 256), (213, 230)])
HOOD = smooth([(124, 218), (126, 200), (138, 188), (172, 184), (206, 188), (218, 200), (220, 218), (172, 214)])
b.over(cel(S, [HOOD], CAPE_T, lw=2.0, shade=5, light=2, ldir=LDIR))
b.over(cel(S, [CAPE_L, CAPE_R], CAPE_T, lw=2.0, shade=9, light=3, ldir=LDIR))
# fold shadows rising from the hem, a lit ridge beside each
cl = cel(S, [CAPE_L, CAPE_R], CAPE_T, outline=False, shade=0, light=0, ldir=LDIR)[..., 3] > 0.5
WEDGES = [[(58, 317), (70, 320), (76, 270), (80, 236)], [(92, 317), (102, 314), (106, 274), (108, 246)],
          [(40, 316), (46, 318), (46, 284), (50, 258)], [(244, 322), (256, 324), (250, 270), (244, 236)],
          [(268, 320), (280, 322), (270, 270), (262, 240)]]
b.over(cel(S, WEDGES, (CAPE_T[0],) * 3, outline=False, shade=0, light=0, clip=erode_cv(cl, 1), ldir=LDIR))
RIDGES = [((80, 240), (74, 280), (66, 316), 1.4), ((108, 250), (104, 284), (98, 314), 1.2), ((240, 238), (246, 280), (246, 320), 1.4),
          ((258, 242), (266, 280), (266, 318), 1.2)]
b.over(strokes(S, RIDGES, CAPE_T[2], alpha=0.85, taper_to=0.3, clip=erode_cv(cl, 1)))
b.over(collar_now)
# the capelet and the collar throw a flat shadow on the bodice to their lower right
casters = dilate_cv(cl, 1) | (collar_now[..., 3] > 0.5)
b.multiply(shift(casters, 3, 5) & bod & ~casters, (120, 132, 176), 0.55)
b.over(front_hair)

b.save(OUT)
print('ok', OUT)
