# Jasiek Brzytwa (Wolna Kompania, docs/PODROZNI.md 2.13 / D47: "Razor", a lean knife-fighter of about 30, 2026-10-29):
# SF_Actor3_5 (the young man in the grey beanie, the black face mask and the dark parka) repainted to his map sheet
# ($Npc_Kompania_2, $Human_Knife recoloured by tools/podroznicy/kompania.py) - the sharp narrow amber eyes kept (the fringe
# over them gone, filled from the skin round them, heavy dark brows drawn down over them); the beanie gone: a SHAVED HEAD
# (tanned scalp, dark stubble) with a DARK-GREY HEAD-WRAP tied round the brow, knotted at the back with two hanging ends; the
# black mask a DARK-GREY CLOTH MASK pulled over the nose and the mouth (only the eyes and the bridge of the nose show);
# everything under the head painted new and medieval: the mask's cloth wrapped round the neck, a grey linen shirt, a darker
# grey leather VEST over it with dirt stains, and a strap across the chest with a sheathed knife.
# 0 PixelLab generations. Run: python tools/busts/make_kompania_2.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kompania_2_Bust.png')
b = Bust('SF_Actor3_5')
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


def line_along(pts, w=2.0, col=LINE, alpha=1.0):
    return strokes(S, [(pts[i], ((np.asarray(pts[i]) + np.asarray(pts[i + 1])) / 2).tolist(), pts[i + 1], w) for i in range(len(pts) - 1)],
                   col, alpha=alpha, taper_to=1.0)


def inpaint(m, r=5):
    img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
    fill = cv2.inpaint(img8, m.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], fill, b.img[..., :3])
    b.src[..., :3] = np.where(m[..., None], fill, b.src[..., :3])


# the map's colours (front\Kompania_2.png): head-wrap (80, 84, 88)/(51, 54, 57), mask (77, 79, 83)/(51, 54, 57)/(29, 29, 26),
# scalp (194, 143, 112)/(160, 116, 90)/(123, 83, 55)/(103, 71, 52), skin (219, 168, 138), vest and shirt (119, 123, 129)/
# (101, 104, 108)/(89, 92, 94)/(77, 79, 83), stains (97, 93, 88)/(115, 105, 95)
WRAP_T = ((48, 50, 54), (74, 77, 82), (98, 101, 106), (36, 38, 41))
MASK_R = [(0.0, (26, 27, 29)), (0.05, (40, 42, 45)), (0.1, (52, 54, 58)), (0.16, (64, 67, 71)), (0.22, (78, 81, 85)), (0.32, (96, 99, 103)),
          (0.5, (118, 121, 125))]
COWL_T = ((46, 48, 52), (70, 73, 78), (92, 95, 100), (34, 36, 39))
SCALP_T = ((152, 108, 80), (190, 140, 106), (214, 166, 130))
SHIRT_T = ((104, 107, 112), (138, 141, 146), (164, 167, 171))
VEST_T = ((66, 69, 74), (94, 98, 104), (118, 122, 128), (52, 54, 58))
STAIN = (112, 92, 72)
STRAP_T = ((44, 34, 28), (70, 56, 46), (96, 80, 66))
WOOD_T = ((70, 46, 30), (112, 78, 50), (144, 106, 72))
IRON_T = ((60, 62, 68), (118, 122, 128), (186, 190, 196))
BROW = ((22, 16, 12), (40, 28, 20), (62, 46, 34))

# ---------- the face: the fringe over the brow and between the eyes goes (filled from the skin round it) ----------
EYE_L = [(96, 126), (129, 127), (129, 142), (96, 142)]
EYE_R = [(143, 122), (176, 119), (179, 128), (177, 136), (143, 138)]
hd, s, v = hsv_of(b.src)
L = luma(b.src)
FRINGE = b.poly([(90, 108), (205, 100), (205, 128), (192, 132), (182, 136), (150, 140), (126, 146), (98, 146), (90, 132)])
fringe = FRINGE & (L < 0.42) & ~b.poly(EYE_L, EYE_R)
fringe |= FRINGE & (s < 0.2) & ~b.poly(EYE_L, EYE_R)                              # (the fringe's grey shine)
mask_top = b.poly([(98, 152), (124, 142), (150, 139), (176, 139), (194, 148), (196, 176), (120, 176)])
fringe &= ~mask_top
fringe = dilate_cv(fringe, 1) & FRINGE & ~b.poly(EYE_L, EYE_R) & ~mask_top
inpaint(fringe, 6)

# ---------- the mask: dark-grey cloth ----------
MASKP = [(103, 150), (124, 141), (150, 138), (178, 138), (196, 148), (200, 172), (196, 196), (178, 212), (150, 216), (124, 210), (104, 190),
         (94, 170)]
mk = b.poly(MASKP) & b.op() & (L < 0.36) & ~((hd >= 10) & (hd <= 45) & (s > 0.3) & (v > 0.5))
b.ramp(mk, MASK_R, gain=1.0)
# a few soft folds of the cloth over the nose and the chin
b.over(strokes(S, [((136, 150), (132, 168), (136, 190), 1.4), ((168, 152), (172, 170), (170, 192), 1.3), ((120, 190), (140, 200), (160, 202), 1.2)],
               MASK_R[2][1], alpha=0.7, clip=mk))
b.over(strokes(S, [((139, 150), (135, 168), (139, 188), 1.0), ((124, 186), (142, 196), (158, 198), 0.9)], MASK_R[5][1], alpha=0.45, clip=mk))
# the skin a little warmer and weathered; the amber eyes a touch darker
skin = b.sel(hue=(15, 50), sat=(0.15, 0.7), val=(0.5, 1), box=(88, 100, 212, 190))
b.multiply(skin, (244, 222, 208), 0.8)
irises = b.sel(hue=(10, 40), sat=(0.5, 1), val=(0.2, 0.8), polys=[EYE_L, EYE_R])
b.multiply(irises, (190, 160, 140), 0.8)

# ---------- the head that stays: the face, the ear, the mask ----------
HEADK = [(95, 116), (130, 112), (176, 108), (186, 114), (190, 140), (200, 142), (204, 156), (204, 172), (200, 196), (180, 214), (150, 220),
         (122, 214), (102, 196), (95, 172), (94, 140)]
FAR = [(60, 100), (99, 112), (96, 132), (100, 148), (104, 158), (108, 170), (113, 184), (60, 200)]   # (left of the face's far edge)
keep = b.poly(HEADK) & b.op() & ~(b.sel(sat=(0, 0.12), val=(0.55, 1)) & ~b.poly(EYE_L, EYE_R))      # (the beanie's grey goes)
keep &= ~(b.sel(hue=(200, 280), sat=(0.08, 0.5), val=(0.2, 1)) & ~b.poly(EYE_L, EYE_R) & ~mk)          # (the parka's blue-grey)
keep = fill_holes(keep) & b.poly(HEADK)
keep &= ~(b.poly(FAR) & ~skin)
# (below the mask's lower edge the parka's collar and its cord go)
keep &= ~b.poly([(86, 172), (100, 176), (112, 192), (130, 203), (150, 207), (170, 204), (188, 194), (198, 180), (206, 176), (214, 240), (86, 240)])
# (above the ear, beside the eye: only the skin stays - the beanie's rim and its line go)
keep &= ~(b.poly([(182, 100), (230, 100), (230, 146), (196, 146), (186, 136)]) & ~b.sel(hue=(15, 50), sat=(0.2, 0.7), val=(0.6, 1)))
keep &= ~(b.poly([(196, 170), (215, 160), (215, 222), (196, 222)]) & ~mk & ~skin)                     # (the parka's collar by the ear)
head = take(b.img, keep)

# ---------- the new picture, back to front ----------
img = np.zeros((H, W, 4), np.float32)
# the shaved head: a tanned scalp with dark stubble, the back of the head and the nape
SKULL = smooth([(97, 132), (95, 106), (100, 86), (112, 69), (132, 57), (158, 52), (184, 55), (204, 65), (218, 82), (225, 104), (225, 126),
                (220, 146), (212, 164), (200, 182)], 2) + [(170, 200), (110, 190)]
skull = cel(S, [SKULL], SCALP_T, lw=2.0, shade=9, light=3, ldir=LD)
sk = erode_cv(skull[..., 3] > 0.5, 2)
skull = over(skull, stubble(S, SKULL, (96, 66, 46), density=0.42, seed=21, alpha=0.42, clip=sk))
skull = over(skull, strokes(S, [((118, 70), (140, 58), (166, 56), 4.0)], (232, 190, 160), alpha=0.5, clip=sk, taper_to=0.3))   # (a shine)
img = over(img, skull)
# the neck behind the cowl
NECK = [(120, 196), (200, 180), (216, 200), (214, 240), (130, 240)]
img = over(img, cel_b([NECK], ((150, 104, 78), (186, 136, 106), (206, 158, 126)), lw=2.0, shade=8, light=2))
# the shirt (grey linen) and the vest (darker grey leather), open at the front
BODY = smooth([(-10, 350), (-6, 292), (12, 258), (52, 236), (100, 226), (140, 226)]) + [(176, 236), (214, 226)] + \
    smooth([(214, 226), (262, 230), (302, 248), (326, 278), (338, 320), (340, 350)])
shirt = cel_b([BODY], SHIRT_T, lw=2.0, shade=10, light=3)
shm = erode_cv(shirt[..., 3] > 0.5, 2)
shirt = over(shirt, strokes(S, [((160, 250), (168, 300), (164, 350), 1.2), ((186, 250), (194, 300), (192, 350), 1.0)], SHIRT_T[0], alpha=0.6,
                            clip=shm))
img = over(img, shirt)
VEST_L = smooth([(-10, 350), (-6, 292), (12, 258), (52, 236), (100, 226), (128, 226)]) + smooth([(128, 226), (146, 262), (156, 310), (158, 350)], 2)
VEST_R = smooth([(196, 228), (214, 226), (262, 230), (302, 248), (326, 278), (338, 320), (340, 350)]) + smooth([(206, 350), (204, 300),
                                                                                                             (200, 260), (196, 228)], 2)
for poly, seed in ((VEST_L, 22), (VEST_R, 23)):
    lay = cel_b([poly], VEST_T[:3], lw=2.0, shade=10, light=3)
    m = erode_cv(lay[..., 3] > 0.5, 2)
    lay = over(lay, hair_strands(S, m, (170, 600), VEST_T[2], VEST_T[3], n=110, length=(4, 9), seed=seed, alpha=(0.14, 0.2)))
    rng = np.random.RandomState(seed)
    blots = [ellipse(rng.uniform(20, 320), rng.uniform(250, 340), rng.uniform(5, 10), rng.uniform(3, 6), rng.uniform(0, 3), 14) for _ in range(9)]
    st = cel(S, blots, (STAIN, STAIN, STAIN), outline=False, shade=0, light=0)
    st[..., 3] *= m * 0.45
    lay = over(lay, st)
    img = over(img, lay)
img = over(img, strokes(S, [((44, 250), (40, 300), (42, 350), 1.6), ((282, 250), (292, 300), (296, 350), 1.6), ((90, 240), (96, 300), (94, 350), 1.2)],
                        VEST_T[3], alpha=0.6, clip=img[..., 3] > 0.5))
# (the vest's lacing holes along its front edges)
img = over(img, dots(S, [(143 + k * 2.2, 258 + k * 18, 1.6) for k in range(5)] + [(198 - k * 0.5, 252 + k * 18, 1.6) for k in range(5)],
                     (34, 30, 28), alpha=0.9))
# the strap across the chest with the sheathed knife (the handle up by the far shoulder)
STRAP = taper(bez((70, 236), (160, 290), (250, 352), 30), 12, 13)
img = over(img, cel_b([STRAP], STRAP_T, lw=1.6, shade=3, light=1.4))
KA, KB = np.array([132.0, 278.0]), np.array([186.0, 314.0])     # the sheath: from its mouth down to its tip
kd = (KB - KA) / np.linalg.norm(KB - KA)
kn = np.array([-kd[1], kd[0]])
SHEATH = [tuple(KA + kn * 8), tuple(KB + kn * 3), tuple(KB + kd * 6), tuple(KB - kn * 3), tuple(KA - kn * 8)]
img = over(img, cel(S, [SHEATH], ((40, 30, 24), (64, 50, 40), (92, 76, 62)), lw=1.6, shade=3, light=1.4, ldir=LD))
img = over(img, strokes(S, [(tuple(KA + kd * 8 + kn * 5), tuple(KA + kd * 10), tuple(KA + kd * 8 - kn * 5), 1.6),
                            (tuple(KA + kd * 40 + kn * 4), tuple(KA + kd * 42), tuple(KA + kd * 40 - kn * 4), 1.6)], (150, 140, 120), alpha=0.8,
                        taper_to=1.0))
GUARD = [tuple(KA + kn * 11 - kd * 1), tuple(KA + kn * 11 - kd * 6), tuple(KA - kn * 11 - kd * 6), tuple(KA - kn * 11 - kd * 1)]
GRIP = [tuple(KA + kn * 4 - kd * 5), tuple(KA + kn * 4 - kd * 30), tuple(KA - kn * 4 - kd * 30), tuple(KA - kn * 4 - kd * 5)]
img = over(img, cel(S, [GRIP], WOOD_T, lw=1.4, shade=2, light=1.2, ldir=LD))
img = over(img, strokes(S, [(tuple(KA + kn * 4 - kd * (10 + 6 * k)), tuple(KA - kd * (12 + 6 * k)), tuple(KA - kn * 4 - kd * (10 + 6 * k)), 1.0)
                            for k in range(3)], (50, 34, 22), alpha=0.8, taper_to=1.0, clip=dilate_cv(img[..., 3] > 0.5, 0)))
img = over(img, cel(S, [GUARD], IRON_T, lw=1.4, shade=1.5, light=1.0, ldir=LD))
img = over(img, cel(S, [ellipse(*(KA - kd * 32), 5.0, 5.0)], IRON_T, lw=1.2, shade=1.5, light=1.0, ldir=LD))
# the cowl: the mask's cloth wrapped round the neck, falling on the shoulders
COWL = smooth([(104, 186), (92, 204), (86, 222), (94, 238)], 2) + smooth([(94, 238), (124, 248), (160, 252), (194, 246), (220, 236), (232, 222)], 2) \
    + smooth([(232, 222), (230, 200), (220, 184), (206, 174)], 2)
cowl = cel(S, [COWL], COWL_T[:3], lw=2.0, shade=9, light=3, ldir=LD)
cwm = erode_cv(cowl[..., 3] > 0.5, 2)
cowl = over(cowl, strokes(S, [((92, 214), (124, 230), (164, 232), 1.6), ((98, 230), (134, 242), (180, 240), 1.4), ((200, 226), (216, 218), (228, 204), 1.4),
                              ((200, 210), (214, 200), (222, 188), 1.2)], COWL_T[3], alpha=0.75, clip=cwm))
cowl = over(cowl, strokes(S, [((94, 210), (126, 226), (164, 228), 1.0), ((100, 226), (136, 238), (180, 236), 0.9)], COWL_T[2], alpha=0.5, clip=cwm))
img = over(img, cowl)
# the face, the ear, the mask
img = over(img, head)
# (the face's far edge, where the beanie's rim covered it)
img = over(img, line_along(smooth([(98, 114), (96, 130), (99, 146), (104, 157), (108, 170), (113, 184)], 2), 2.0))

# ---------- the head-wrap: round the brow, knotted at the back, two ends hanging ----------
UP = smooth([(94, 92), (120, 86), (150, 82), (180, 82), (206, 88), (222, 98), (230, 108)], 2)
LO = smooth([(230, 130), (220, 124), (204, 116), (180, 112), (152, 114), (126, 120), (96, 123)], 2)
wrap = cel(S, [UP + LO], WRAP_T[:3], lw=2.0, shade=6, light=2.5, ldir=LD, clip=dilate_cv(skull[..., 3] > 0.5, 1) | (b.xx > 200))
wm = erode_cv(wrap[..., 3] > 0.5, 1)
wrap = over(wrap, strokes(S, [((98, 102), (150, 93), (204, 100), 1.3), ((100, 113), (156, 104), (214, 114), 1.2), ((150, 86), (176, 100), (196, 112), 1.0)],
                          WRAP_T[3], alpha=0.6, clip=wm))
wrap = over(wrap, strokes(S, [((100, 98), (150, 89), (200, 95), 0.9), ((102, 109), (156, 100), (210, 109), 0.9)], WRAP_T[2], alpha=0.5, clip=wm))
ENDS = [smooth([(226, 116), (238, 130), (244, 150), (240, 172)], 2) + smooth([(232, 170), (234, 150), (228, 132), (220, 122)], 2),
        smooth([(230, 112), (246, 120), (258, 138), (262, 158)], 2) + smooth([(254, 158), (250, 140), (240, 126), (226, 120)], 2)]
img = over(img, cel(S, ENDS, WRAP_T[:3], lw=1.8, shade=4, light=2, ldir=LD))
img = over(img, wrap)
img = over(img, cel(S, [ellipse(230, 116, 9, 8, 0.3, 30)], WRAP_T[:3], lw=1.8, shade=3, light=2, ldir=LD))
# (the wrap's shadow on the brow under it)
wa = wrap[..., 3] > 0.5
sh = shift(wa, 2, 4) & ~wa & (img[..., 3] > 0.5) & (b.yy < 140)
img[..., :3] = np.where(sh[..., None], img[..., :3] * np.asarray((0.82, 0.74, 0.72), np.float32), img[..., :3])
# heavy dark brows drawn down over the eyes, just under the wrap
BROWS = [((98, 125), (110, 121), (129, 126), 6.0), ((145, 120), (162, 114), (182, 115), 6.4)]
img = over(img, cel(S, [taper(bez(r, c, t, 16), w * 0.5, w * 0.8, w_mid=w) for r, c, t, w in BROWS], BROW, lw=1.0, shade=1.2, light=0.8, ldir=LD))
b.img = img
b.save(OUT)
print('ok', OUT)
