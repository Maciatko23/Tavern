# Ignac (the tanner and shoemaker, tall and thin): Actor2_8 repainted - as on the map: brown hair under a brown leather flat
# cap (the newsboy cap of SF_Actor3_6 recoloured to two leathers); the green cloak gone - below the head a new olive linen shirt
# with long sleeves and a collar (painted), a brown leather apron bib on straps over it (painted, like the smith's), and his
# raised forearm kept from the original: the black glove, the fingers and the bracer a long brown leather glove gripping the
# apron's strap, the dark sleeve olive. Run: python tools/busts/make_garbarz.py [out.png]
import sys
from kit import *
from make_kapral import celf     # (cel() cut by the frame's edges)

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Garbarz_Bust.png')
b = Bust('Actor2_8')
S = b.img.shape
LDIR = (0.55, 0.83)     # cel(): the shade band down-right, the light band up-left (light from the upper left, as in RTP)
OLIVE_T = ((86, 76, 44), (132, 122, 76), (166, 156, 106), (64, 56, 32))        # the shirt (the map's (135, 124, 78))
APRON_T = ((84, 46, 26), (124, 72, 40), (156, 98, 58), (62, 34, 18))           # the apron (the map's (123, 70, 39))
GLOVE = [(0.0, (20, 12, 8)), (0.05, (46, 28, 16)), (0.12, (70, 42, 24)), (0.3, (96, 60, 34)), (0.5, (124, 82, 48)),
         (0.7, (150, 106, 66)), (0.9, (178, 134, 92))]

hair = b.sel(hue=(10, 60), sat=(0.05, 0.45), val=(0, 0.9), box=(70, 10, 270, 190)) & ~b.sel(sat=(0, 0.3), val=(0.9, 1)) \
    & ~b.poly([(120, 118), (220, 108), (226, 190), (120, 196)])
b.ramp(hair, RAMPS['hair_dark'], gain=1.25)

# the head that stays: the hair, the face and the neck (not the cloak's hood round them)
KEEP = b.poly([(0, 0), (330, 0), (330, 96), (248, 96), (240, 130), (228, 148), (212, 157), (207, 172), (206, 196), (150, 199),
               (142, 186), (134, 175), (122, 162), (112, 150), (102, 140), (96, 100), (0, 100)])
green = b.sel(hue=(110, 200), sat=(0.15, 1))
lining = b.sel(hue=(180, 260), sat=(0.4, 1), box=(100, 160, 240, 210))       # (the hood's dark teal lining at the neck)
head = take(b.img, KEEP & b.op() & ~green & ~lining)
# the raised forearm: what of the original is not the green cloak in its area - opened (no stray cloak lines) and its lines
ARMP = [(96, 202), (122, 196), (146, 198), (150, 216), (148, 252), (134, 262), (114, 266), (100, 268), (94, 274), (91, 285),
        (71, 289), (42, 284), (37, 276), (52, 252), (62, 230), (74, 214)]
core = b.poly(ARMP) & b.op() & ~green & (luma(b.src) > 0.06)
core = dilate_cv(erode_cv(core, 2), 2) & core
arm = (core | b.lines_of(core, 2, 0.2)) & b.poly(ARMP)
arm = fill_holes(arm) & b.op() & ~(green & ~b.lines_of(core, 2, 0.2))
skin = arm & b.sel(hue=(0, 40), sat=(0.2, 0.6), val=(0.75, 1))
glove = arm & b.poly([(84, 196), (150, 196), (150, 262), (100, 262), (60, 250), (60, 210)])
cuff = arm & ~glove & ~skin
b.ramp(glove, GLOVE, gain=2.2)
b.ramp(skin, GLOVE, gain=0.62)
b.ramp(cuff, GLOVE, gain=1.05)
forearm = take(b.img, arm)
# the forearm's olive sleeve from the glove's cuff down to the elbow (under the frame)
SLEEVE = [(36, 270), (70, 280), (90, 284), (76, 318), (60, 352), (-4, 352), (-4, 330), (16, 298)]

# the shirt: the shoulders, the right arm hanging, the upper left arm going down to the elbow (behind the forearm)
SHIRT = [(0, 282), (16, 262), (40, 240), (72, 222), (104, 210), (134, 198), (178, 206), (212, 194), (244, 206), (272, 220),
         (292, 236), (304, 260), (312, 300), (318, 350), (0, 350)]
lay = celf(S, [SHIRT], OLIVE_T[:3], lw=2.0, shade=10, light=3, ldir=LDIR)
sm = erode_cv(lay[..., 3] > 0.5, 2)
shade = sm & b.poly([(256, 214), (330, 214), (330, 350), (282, 350), (270, 290), (262, 240)])
lay[..., :3] = np.where(shade[..., None], np.asarray(OLIVE_T[0], np.float32) / 255.0, lay[..., :3])
lay = over(lay, strokes(S, [((270, 232), (280, 290), (286, 352), 2.0), ((84, 236), (60, 296), (44, 352), 1.8)], LINE, clip=sm,
                        taper_to=0.6))
lay = over(lay, strokes(S, [((296, 262), (300, 306), (304, 352), 1.4), ((30, 268), (20, 310), (12, 352), 1.4)], OLIVE_T[3], alpha=0.8,
                        clip=sm, taper_to=0.2))
# the apron: a leather bib from the chest down, straps up round the neck
BIB = [(122, 240), (176, 244), (230, 236), (238, 280), (246, 352), (112, 352), (116, 280)]
STRAPS = [[(122, 240), (134, 240), (154, 199), (144, 196)], [(218, 237), (230, 236), (215, 194), (205, 197)]]
ap = celf(S, [BIB] + STRAPS, APRON_T[:3], lw=2.0, shade=9, light=3, ldir=LDIR)
am = erode_cv(ap[..., 3] > 0.5, 2)
ash = am & b.poly(BIB) & b.poly([(212, 240), (246, 240), (250, 352), (222, 352), (220, 300)])
ap[..., :3] = np.where(ash[..., None], np.asarray(APRON_T[0], np.float32) / 255.0, ap[..., :3])
ap = over(ap, strokes(S, [((150, 262), (146, 306), (140, 352), 1.6), ((206, 262), (212, 306), (218, 352), 1.6),
                          ((120, 300), (178, 306), (240, 298), 1.2)], APRON_T[3], alpha=0.75, clip=am, taper_to=0.3))
ap = over(ap, cel(S, [ellipse(129, 243, 3.6, 3.2), ellipse(224, 240, 3.6, 3.2)], ((90, 92, 100), (160, 164, 172), (220, 222, 228)),
                  lw=1.0, shade=1.4, light=0.8, ldir=LDIR))
lay = over(lay, ap)
# the shirt's collar round the neck (over the neck's cut edge)
COLLAR = [(134, 186), (150, 194), (178, 199), (204, 190), (214, 180), (219, 186), (210, 200), (178, 207), (146, 203), (131, 194)]
lay = over(lay, head)
lay = over(lay, cel(S, [COLLAR], OLIVE_T[:3], lw=1.8, shade=4, light=2, ldir=LDIR))
lay = over(lay, celf(S, [SLEEVE], OLIVE_T[:3], lw=2.0, shade=8, light=3, ldir=LDIR))
lay = over(lay, strokes(S, [((50, 300), (40, 322), (30, 352), 1.3)], OLIVE_T[3], alpha=0.8, taper_to=0.2))
lay = over(lay, forearm)
b.img = lay

# the cap
CAP = [(64, 113), (78, 96), (84, 84), (78, 62), (96, 38), (120, 26), (155, 18), (205, 26), (240, 40), (258, 62), (264, 100),
       (244, 122), (190, 124), (150, 114), (120, 102), (100, 108), (80, 114)]


def cap_mask(d):
    m = d.poly(CAP) & d.op() & ~d.sel(hue=(12, 40), sat=(0.2, 0.65), val=(0, 0.75))
    return erode_cv(dilate_cv(m, 1), 1)


def two_leathers(d, m):
    red = m & d.sel(hue=(330, 25), sat=(0.35, 1))
    d.ramp(m & ~red, [(0.0, (26, 16, 10)), (0.2, (66, 42, 24)), (0.5, (126, 88, 52)), (0.75, (160, 118, 74)), (0.95, (196, 158, 110))])
    d.ramp(red, [(0.0, (22, 12, 8)), (0.2, (48, 28, 16)), (0.35, (74, 44, 24)), (0.55, (102, 64, 36)), (0.75, (132, 88, 52)),
                 (0.95, (166, 120, 78))])


d = Bust('SF_Actor3_6')
m = cap_mask(d)
two_leathers(d, m)
M = affine(scale=(1.06, 1.02), rot=-3, src_pt=(160, 115), dst_pt=(166, 90))
cap = warp(take(d.img, m), M, S)
put_hat(b, cap, shadow=(150, 120, 120), shadow_k=0.5, sdx=2, sdy=8)
b.save(OUT)
print('ok', OUT)
