# Szczerba / Dobrawa (a traveller from the ferry, docs/PODROZNI.md 2.12: a tough bounty hunter of about 40, cool and fair,
# 2026-10-29): Actor2_6 (the auburn-haired woman in golden armour) repainted to her PixelLab map sheet ($Npc_Lowczyni) - the
# face kept but older and sterner (the smirk a firm straight mouth, brows drawn down, a crease between them, soft lines of
# age, dark eyes, a weathered skin) with a pale SCAR across the far cheek; the long auburn hair, its fringe and the gold
# circlet gone: a bare forehead and SHORT CROPPED hair painted in their place, combed back, GREY with darker streaks; everything
# under the head painted new and modest: the neck, a long DARK-BROWN LEATHER COAT with a HIGH turned-up collar (its front
# closed, a seam and buckles), a strap across the chest, and the CROSSBOW on her back showing over her far shoulder (the stock,
# the prod and the string).
# 0 PixelLab generations. Run: python tools/busts/make_lowczyni.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Lowczyni_Bust.png')
b = Bust('Actor2_6')
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


# the map's colours (front\Lowczyni_x8.png, the new sheet): coat (91, 84, 76)/(76, 68, 61)/(64, 57, 50)/(54, 47, 40)/(43, 39, 35)/
# (34, 31, 27), hair (161, 161, 161)/(145, 145, 142)/(127, 122, 117)/(109, 104, 98)/(97, 95, 93), skin (241, 188, 152)/
# (210, 149, 112)/(178, 130, 105), scar (148, 105, 82), crossbow (124, 88, 68)/(91, 65, 48)
SKIN = [(0.0, (40, 18, 12)), (0.3, (120, 76, 56)), (0.45, (160, 112, 86)), (0.65, (204, 146, 112)), (0.75, (222, 166, 130)), (0.85, (238, 186, 150)),
        (0.95, (247, 204, 172)), (1.0, (252, 218, 190))]
SKIN_T = ((212, 152, 116), (238, 186, 150), (248, 206, 174), (194, 134, 100))
HAIR_T = ((104, 100, 96), (138, 134, 130), (170, 168, 164), (72, 68, 64))
BROW = (78, 70, 64)
COAT_T = ((46, 40, 34), (68, 60, 52), (92, 82, 72), (32, 28, 24))
STRAP_T = ((60, 40, 26), (92, 64, 44), (122, 90, 64))
WOOD_T = ((74, 52, 36), (112, 80, 58), (146, 110, 82))
IRON_T = ((50, 50, 54), (84, 84, 90), (130, 130, 138))

# ---------- what stays of the face (the brows' level down to the chin, the ear) ----------
FACE = [(104, 134), (210, 132), (210, 122), (220, 120), (230, 128), (230, 150), (224, 166), (212, 168), (206, 180), (196, 192), (182, 202),
        (170, 210), (162, 215), (150, 212), (138, 205), (128, 198), (119, 190), (113, 180), (109, 165), (106, 150)]
face = b.poly(FACE) & b.op()
EYE_L = [(111, 145), (139, 145), (139, 167), (111, 167)]
EYE_R = [(154, 134), (196, 134), (196, 160), (154, 160)]
hd, s, v = hsv_of(b.src)
# the auburn strands over the face (in front of the ear, at the temples): filled from the skin round them
strand = face & (((hd >= 330) | (hd <= 12)) & (s > 0.3)) & ~b.poly(EYE_L, EYE_R, [(140, 186), (180, 186), (180, 200), (140, 200)])
EAR = ellipse(218, 146, 10, 21)
strand |= face & (hd >= 300) & (s > 0.25) & (v < 0.5) & ~b.poly(EYE_L, EYE_R) & (b.xx < 116)      # (the dark hair by the far cheek)
strand = dilate_cv(strand, 1) & face & ~b.poly(EYE_L, EYE_R, [(140, 186), (180, 186), (180, 200), (140, 200)], EAR)
inpaint(strand, 5)
# (the white rim light the old hair had round the face, the dark hair by the far cheek and behind the ear: flat skin shade)
edge = face & dilate_cv(~face, 7)
fix = (edge & (((s < 0.2) & (v > 0.8)) | ((hd >= 40) & (hd <= 70) & (v > 0.88))) & ~b.poly(EYE_L, EYE_R))
fix |= face & (b.xx < 119) & (((hd >= 250) & (s > 0.2)) | (v < 0.3)) & ~b.poly(EYE_L)
fix |= b.poly(EAR) & (hd >= 280) & (hd <= 355) & (s > 0.3) & (v < 0.62)
for a_ in (b.img, b.src):
    a_[..., :3] = np.where(fix[..., None], np.asarray((229, 171, 134), np.float32) / 255.0, a_[..., :3])
irises = b.sel(hue=(10, 55), sat=(0.5, 1), val=(0.25, 0.95), polys=[EYE_L, EYE_R])
skin = b.sel(hue=(330, 45), sat=(0.1, 0.7), val=(0.35, 1)) & face & ~irises
b.ramp(skin, SKIN, gain=1.0)
b.ramp(irises, [(0.0, (12, 10, 8)), (0.25, (40, 30, 22)), (0.5, (74, 58, 44)), (0.75, (110, 92, 72)), (1.0, (170, 150, 126))], gain=1.0)
whites = b.sel(hue=(180, 300), sat=(0, 0.35), val=(0.35, 1), polys=[EYE_L, EYE_R])
b.hsv(whites, hue=34, sat=0.06, vmul=0.95)
# the smirk away: a firm straight mouth, the corners a little down
MOUTH = b.poly([(142, 186), (180, 186), (180, 200), (142, 200)])
inpaint(MOUTH & (b.sel(sat=(0.45, 1)) | b.sel(val=(0, 0.75))) & face, 4)
b.over(strokes(S, [((147, 193.5), (160, 192.5), (174, 193), 1.6)], (110, 58, 46), alpha=0.9, taper_to=0.7))
b.over(strokes(S, [((174, 193), (176.5, 194.2), (177.5, 196), 1.0), ((147, 193.5), (145.5, 194.5), (145, 196), 0.9)], (110, 58, 46), alpha=0.6,
               taper_to=0.4))
b.over(strokes(S, [((153, 199), (159, 200), (165, 199), 0.9)], (200, 140, 108), alpha=0.35, taper_to=0.4))
# about 40: soft lines under the eyes and from the nose to the mouth; weathered
LN = (170, 104, 80)
b.over(strokes(S, [((114, 170), (124, 174), (136, 170), 1.0), ((162, 162), (176, 166), (192, 160), 1.0)], LN, alpha=0.35, clip=skin))
b.over(strokes(S, [((150, 182), (146, 190), (146, 198), 1.1), ((176, 178), (182, 186), (182, 196), 1.1)], LN, alpha=0.3, clip=skin))
b.over(blush(S, 192, 178, 12, 7, (200, 120, 90), 0.15, clip=skin))

b.over(line_along(smooth([(105, 136), (106, 150), (109, 165), (113, 180), (119, 190), (128, 198), (138, 205)], 2), 2.0))   # (the far cheek)
head = take(b.img, face)

# ---------- the new body (behind the head): the crossbow on her back, the coat, the high collar ----------
body = np.zeros((H, W, 4), np.float32)
# the crossbow over her far shoulder: the stock rising behind it, the prod across its end, the string drawn back
SA, SB = (110, 262), (36, 140)                      # the stock: from behind the shoulder to its front end
d = np.subtract(SB, SA).astype(np.float64)
d /= np.linalg.norm(d)
n = np.array([-d[1], d[0]])
stock = taper(np.asarray([SA, SB], np.float64), 11, 9)
P0 = np.asarray(SB) - d * 6
PL = P0 + n * 48 + d * 10
PR = P0 - n * 48 + d * 10
prod = taper(bez(PL, P0 - d * 6, PR, 30), 4.0, 4.0, w_mid=7.0)
NUT = np.asarray(SA) + (np.asarray(SB) - np.asarray(SA)) * 0.55
body = over(body, strokes(S, [(tuple(PL), tuple((PL + NUT) / 2), tuple(NUT), 1.2), (tuple(PR), tuple((PR + NUT) / 2), tuple(NUT), 1.2)],
                          (214, 204, 182), alpha=1.0, taper_to=1.0))
body = over(body, cel(S, [stock], WOOD_T, lw=1.6, shade=3, light=1.5, ldir=LD))
body = over(body, cel(S, [prod], IRON_T, lw=1.5, shade=2, light=1.2, ldir=LD))
body = over(body, cel(S, [ellipse(P0[0], P0[1], 5, 4, np.arctan2(d[1], d[0]))], IRON_T, lw=1.2, shade=1.5, light=1.0, ldir=LD))
body = over(body, cel(S, [ellipse(NUT[0], NUT[1], 3.5, 3.5)], IRON_T, lw=1.0, shade=1.2, light=0.8, ldir=LD))
# the neck
NECK = [(140, 200), (212, 164), (224, 180), (226, 230), (216, 262), (150, 262), (146, 226)]
neck = cel_b([NECK], SKIN_T[:3], lw=2.0, shade=9, light=2)
nm = neck[..., 3] > 0.5
JAW = [(128, 198), (138, 205), (150, 212), (162, 215), (170, 210), (182, 202), (196, 192), (206, 180), (212, 168)]
CHIN_SH = JAW + [(x + 4, y + 14) for x, y in JAW[::-1]]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the coat: broad shoulders, its front closed down the middle (the near flap over the far one)
COAT = smooth([(-10, 350), (-4, 300), (14, 268), (50, 248), (96, 238), (130, 236)]) + [(150, 250), (168, 258), (196, 252), (222, 240)] \
    + smooth([(222, 240), (262, 242), (298, 256), (322, 282), (336, 320), (340, 350)])
coat = cel_b([COAT], COAT_T[:3], lw=2.0, shade=10, light=3, shade2=4)
cm = erode_cv(coat[..., 3] > 0.5, 2)
coat = over(coat, hair_strands(S, cm, (170, 600), COAT_T[2], COAT_T[3], n=160, length=(4, 9), seed=41, alpha=(0.16, 0.22)))
# (worn leather: scuffs and creases, the seam down the front with three buckled straps)
coat = over(coat, strokes(S, [((40, 270), (34, 310), (32, 350), 1.8), ((96, 262), (100, 300), (98, 350), 1.4), ((286, 266), (296, 306), (300, 350), 1.8),
                              ((242, 270), (246, 310), (244, 350), 1.4)], COAT_T[3], alpha=0.7, clip=cm))
coat = over(coat, strokes(S, [((44, 268), (38, 308), (36, 350), 1.0), ((290, 262), (300, 304), (304, 350), 1.0)], COAT_T[2], alpha=0.45, clip=cm))
SEAM = smooth([(176, 256), (182, 300), (186, 350)], 2)
coat = over(coat, line_along(SEAM, 2.0, COAT_T[3], 0.9))
coat = over(coat, line_along([(x + 2.5, y) for x, y in SEAM], 1.0, COAT_T[2], 0.6))
for y in (280, 312, 342):
    x = 180 + (y - 256) * 0.12
    coat = over(coat, cel(S, [[(x - 16, y - 4), (x + 18, y - 5), (x + 18, y + 4), (x - 16, y + 5)]], STRAP_T, lw=1.2, shade=2, light=1, ldir=LD))
    coat = over(coat, cel(S, [[(x + 6, y - 6), (x + 14, y - 6), (x + 14, y + 6), (x + 6, y + 6)]], IRON_T, lw=1.0, shade=1.2, light=0.8, ldir=LD,
                          holes=[[(x + 8.2, y - 3.5), (x + 11.8, y - 3.5), (x + 11.8, y + 3.5), (x + 8.2, y + 3.5)]]))
body = over(body, coat)
# the crossbow's strap across the chest (from the far shoulder down to the near side)
STRAP = taper(bez((98, 240), (190, 286), (290, 350), 30), 13, 14)
body = over(body, cel_b([STRAP], STRAP_T, lw=1.6, shade=3, light=1.4))
body = over(body, cel(S, [[(214, 300), (232, 309), (226, 322), (208, 313)]], IRON_T, lw=1.2, shade=1.5, light=1.0, ldir=LD,
                      holes=[[(216, 305), (227, 310.5), (223.5, 317), (212.5, 311.5)]]))
# the high turned-up collar: its back rising behind the nape, its two fronts open at the throat
C_BACK = [(206, 184), (220, 164), (240, 160), (246, 190), (242, 226), (224, 242), (210, 232)]
C_FAR = [(106, 244), (112, 210), (118, 192), (132, 200), (146, 220), (156, 250), (130, 254)]
C_NEAR = [(166, 258), (170, 234), (186, 214), (206, 190), (214, 188), (230, 222), (232, 250), (206, 258)]
for poly in (C_BACK, C_FAR, C_NEAR):
    lay = cel_b([poly], COAT_T[:3], lw=2.0, shade=6, light=2.5)
    m = erode_cv(lay[..., 3] > 0.5, 2)
    lay = over(lay, hair_strands(S, m, (190, 400), COAT_T[2], COAT_T[3], n=40, length=(4, 8), seed=len(poly), alpha=(0.16, 0.22)))
    body = over(body, lay)
body = over(body, line_along(smooth([(122, 200), (138, 214), (150, 240)], 2), 1.0, COAT_T[2], 0.6))       # (the collar's fold)
body = over(body, line_along(smooth([(210, 198), (222, 214), (228, 236)], 2), 1.0, COAT_T[3], 0.7))

b.img = body
# (the collar's shadow on the neck under the jaw)
b.over(head)

# ---------- the forehead (bare, as on the map), the stern brows, the crease between them ----------
FORE = smooth([(104, 140), (102, 120), (108, 104), (124, 96), (150, 94), (178, 96), (200, 104), (212, 116), (214, 128), (210, 136)], 2)
FORE_BIG = FORE + [(212, 150), (208, 178), (190, 200), (162, 216), (130, 200), (110, 176), (104, 140)]
fore = cel(S, [FORE_BIG], SKIN_T[:3] + (SKIN_T[3],), outline=False, shade=10, light=0, shade2=4, ldir=LD)
fm = b.poly(FORE + [(104, 140)]) & ~face
fore[..., 3] *= fm                                     # (shaded as the whole face, cut to the forehead: no seam at the brows)
b.multiply(fm & (b.xx > 196), (232, 214, 206), 1.0)
b.over(fore)
b.over(line_along([(104, 112), (103, 126), (105, 142)], 2.0))         # (the far temple's outline)
# soft lines of age across the forehead
b.over(strokes(S, [((130, 118), (150, 115), (176, 118), 1.0), ((136, 125), (154, 123), (172, 125), 0.9)], LN, alpha=0.28, clip=fm))
BROWS = [((108, 141), (122, 141), (137, 146), 4.0), ((150, 142), (166, 134), (188, 132), 4.6)]
b.over(cel(S, [taper(bez(r, c, t, 16), w * 0.8, 1.6, w_mid=w) for r, c, t, w in BROWS], ((56, 50, 46), BROW, (110, 102, 96)), lw=1.0, shade=1.2,
           light=0.8, ldir=LD))
b.over(strokes(S, [((143, 138), (144.5, 144), (144, 150), 1.2), ((147, 137), (148.5, 142), (148, 147), 1.0)], LN, alpha=0.55))

# ---------- the scar across the far cheek ----------
SCAR = [(137, 159), (126, 176), (113, 195)]
b.over(strokes(S, [(SCAR[0], SCAR[1], SCAR[2], 4.2)], (146, 96, 78), alpha=0.9, taper_to=0.45))
b.over(strokes(S, [((137.5, 159.5), (126.6, 176.5), (113.8, 195), 1.8)], (246, 210, 190), alpha=0.95, taper_to=0.4))
b.over(strokes(S, [((128, 168), (132.5, 171), (134, 175.5), 1.0), ((121, 179), (125.5, 182), (127, 186.5), 1.0)], (146, 96, 78), alpha=0.6,
               taper_to=0.8))

# ---------- the short cropped grey hair, combed back ----------
HL = smooth([(103, 128), (106, 114), (114, 104), (130, 99), (152, 98), (176, 100), (196, 106), (208, 114), (214, 124), (222, 120), (232, 124),
             (238, 144), (238, 164), (232, 180)], 2)
OUT_ = smooth([(232, 180), (248, 168), (258, 140), (258, 106), (250, 78), (230, 56), (200, 44), (164, 40), (132, 44), (110, 56), (98, 78),
               (96, 104), (103, 128)], 2)
BACK = strand_edge(OUT_[:len(OUT_) // 2 + 2], side=1, seg=8, tip=3.0, out=1.6, seed=45)      # (the cropped ends at the nape and back)
HAIR = HL + BACK[1:] + OUT_[len(OUT_) // 2 + 2:]
hair = cel(S, [HAIR], HAIR_T[:3], lw=2.0, shade=8, light=3, shade2=3, ldir=LD)
hm = erode_cv(hair[..., 3] > 0.5, 1)
# strands combed back (from the hairline towards the back of the head), darker streaks (iron grey in grey)
rng = np.random.RandomState(43)
st_d, st_l = [], []
for i in range(110):
    t = rng.uniform(0.0, 1.0)
    x0 = 100 + t * 124 + rng.uniform(-4, 4)
    y0 = 106 + 0.0025 * (x0 - 158) ** 2 + rng.uniform(-30, 4)
    L = rng.uniform(14, 30)
    ang = np.radians(-30 - (1 - t) * 34 + rng.uniform(-10, 10))
    x1, y1 = x0 + np.cos(ang) * L, y0 + np.sin(ang) * L
    xm, ym = (x0 + x1) / 2 - 2, (y0 + y1) / 2 - 2
    (st_d if i % 2 == 0 else st_l).append(((x0, y0), (xm, ym), (x1, y1), rng.uniform(1.0, 2.0)))
hair = over(hair, strokes(S, st_d, HAIR_T[3], alpha=0.7, clip=hm, taper_to=0.2))
hair = over(hair, strokes(S, st_l, HAIR_T[2], alpha=0.55, clip=hm, taper_to=0.2))
hair = over(hair, strokes(S, st_d[::4], (56, 52, 50), alpha=0.6, clip=hm, taper_to=0.2))
# short at the side above the ear: fine short strokes
side = [((222 + k * 2.5, 118 - k * 0.5), (226 + k * 2.5, 132), (228 + k * 2.2, 146), 1.0) for k in range(5)]
hair = over(hair, strokes(S, side, HAIR_T[3], alpha=0.6, clip=hm, taper_to=0.3))
# (the hair's shadow on the forehead)
hb = hair[..., 3] > 0.5
b.multiply(shift(hb, 2, 4) & ~hb & fm, (222, 190, 178), 1.0)
b.over(hair)
b.save(OUT)
print('ok', OUT)
