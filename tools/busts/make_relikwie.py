# Gaspar Lis (a traveller from the ferry, docs/PODROZNI.md 2.9: a flashy relic seller of about 45, a preacher and a huckster,
# 2026-10-29): Actor3_3 (the silver-haired man in the black coat with the jabot) repainted to his PixelLab map sheet
# ($Npc_Relikwie) - the sly grin kept, the long silver hair gone (its big masses over the forehead and the temple flat skin, its
# thin strands over the face filled from the skin round them, the face's contour drawn again), a warm tanned skin, dark brown
# eyes (the near one's outer corner painted), thick black brows (one raised), a CURLED BLACK MOUSTACHE (painted), short black
# hair only at the temples and the nape under a painted TALL RED FELT CAP (a fez: no brim, a flat top); everything under the
# head painted new: the neck, a PURPLE coat with a low standing collar and GOLD TRIM (the collar, the neckline, down its
# front), MANY cheap amulets on cords round the neck (a big brass sun with a face, bone beads with a red bead, a blue glass
# eye, a green glass drop, a tin saint, a wooden cross, a holed brass coin, a wolf's fang) and the brown leather straps of his
# tray box over both shoulders.
# 0 PixelLab generations. Run: python tools/busts/make_relikwie.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Relikwie_Bust.png')
b = Bust('Actor3_3')
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
    """Fill the pixels of m from the colours round them."""
    img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
    fill = cv2.inpaint(img8, m.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], fill, b.img[..., :3])


# the map's colours ($Npc_Relikwie front frame): cap (177, 37, 34)/(158, 31, 29)/(138, 24, 24)/(114, 19, 19)/(208, 65, 54), coat
# (114, 99, 125)/(86, 70, 93)/(76, 62, 76)/(162, 152, 177), gold trim (239, 209, 128)/(225, 177, 59), skin (237, 186, 141)/
# (213, 158, 117), hair and moustache (28, 30, 31)/(51, 52, 54), straps (107, 74, 51)/(78, 51, 35)/(138, 98, 72)/(47, 28, 21)
SKIN = [(0.0, (40, 18, 10)), (0.3, (110, 60, 34)), (0.5, (168, 108, 72)), (0.7, (206, 146, 104)), (0.84, (224, 168, 124)), (0.92, (236, 184, 140)),
        (1.0, (246, 202, 160))]
SKIN_T = ((196, 136, 96), (228, 174, 130), (242, 196, 154))
FEZ_T = ((128, 22, 22), (172, 36, 33), (206, 64, 54), (104, 16, 16))
BLACK_T = ((20, 20, 22), (34, 35, 38), (60, 61, 66), (12, 12, 14))
COAT_T = ((80, 64, 88), (112, 96, 124), (146, 132, 162), (62, 48, 68))
GOLD_T = ((150, 104, 30), (222, 174, 60), (246, 220, 140))
SHIRT_T = ((22, 22, 24), (36, 36, 40), (56, 56, 62))
STRAP_T = ((76, 50, 34), (106, 73, 50), (138, 98, 72), (48, 30, 22))

# ---------- the face: the silver hair over it gone - its big masses (the forehead, the temple and the cheek in front of the ear)
# flat skin, its thin strands filled from the skin round them ----------
FACE = [(90, 64), (204, 64), (208, 92), (212, 104), (211, 122), (206, 134), (199, 142), (196, 152), (189, 162), (176, 170), (159, 177),
        (143, 182), (131, 185), (124, 184), (117, 178), (111, 167), (106, 152), (102, 135), (97, 118), (92, 112), (85, 108), (86, 100),
        (91, 90)]
face = b.poly(FACE) & b.op()
EYE_L = [(84, 100), (112, 100), (112, 118), (84, 118)]
EYE_R = [(129, 99), (151, 99), (151, 115), (129, 115)]
NOSE = [(103, 116), (126, 116), (126, 151), (103, 151)]
MOUTH = [(108, 153), (150, 153), (150, 171), (108, 171)]
EAR = [(195, 94), (215, 94), (215, 142), (195, 142)]
KEEP = b.poly(EYE_L, EYE_R, NOSE, MOUTH, EAR)
BIG = b.poly([(80, 56), (210, 56), (208, 92), (197, 96), (196, 150), (188, 162), (176, 154), (168, 124), (156, 100), (140, 98), (112, 99), (84, 101)])
flat = BIG & face & ~KEEP
flat |= b.sel(sat=(0, 0.12), val=(0.8, 1)) & face & dilate_cv(~face, 6) & ~b.poly(EYE_L, EYE_R)     # (the white rim light by the old hair)
for a_ in (b.img, b.src):
    a_[..., :3] = np.where(flat[..., None], np.asarray((252, 220, 202), np.float32) / 255.0, a_[..., :3])
hd, s, v = hsv_of(b.src)
EYES_E = (((b.xx - 98) / 14.0) ** 2 + ((b.yy - 108) / 7.0) ** 2 <= 1) | (((b.xx - 141) / 13.0) ** 2 + ((b.yy - 106) / 7.0) ** 2 <= 1)
strand = ((hd >= 90) & (hd <= 300) & (v > 0.12) & (s < 0.6)) | ((s < 0.12) & (v > 0.8))
core = (strand | (v < 0.35)) & erode_cv(face, 3) & ~KEEP & ~flat
hairy = dilate_cv(core, 2) & face & ~KEEP & ~flat
hairy |= dilate_cv(strand & KEEP & ~EYES_E & face, 1) & KEEP & ~EYES_E & face      # (strands over the nose, the mouth's corner, the ear)
# (the strand from the near eye down to the nose's top)
hairy |= b.poly(taper(bez((131, 100), (121, 114), (113, 126.5), 16), 5.2, 3.6)) & ~b.poly([(100, 112), (112.2, 112), (112.2, 140), (100, 140)])
inpaint(hairy, 6)
b.src[..., :3] = b.img[..., :3]              # (the later ramps read the filled face)
# tanned skin
skin = b.sel(hue=(330, 45), sat=(0.05, 0.45), val=(0.55, 1)) & face
skin |= (hairy | flat) & ~b.sel(val=(0, 0.25))
b.ramp(skin, SKIN, gain=1.0)
# (the mauve anti-aliasing left of the strands: warm skin-brown)
hd2, s2, v2 = hsv_of(b.img)
mauve = (hd2 >= 240) & (hd2 <= 335) & face & ~EYES_E & ~b.poly(MOUTH)
hsv = rgb_to_hsv(b.img[..., :3])
hsv[..., 0] = np.where(mauve, 22 / 360.0, hsv[..., 0])
hsv[..., 1] = np.where(mauve, np.clip(hsv[..., 1] * 1.4, 0.15, 0.5), hsv[..., 1])
b.img[..., :3] = hsv_to_rgb(hsv)
# the shade on the far side (along the jaw, the cheek in front of the ear) - lit from the upper left
fs = face & ~shift(face, -6, -9) & ~b.poly(EYE_L, EYE_R, NOSE, MOUTH)
b.multiply(fs & skin, (217, 194, 183), 1.0)
fs2 = b.poly(smooth([(176, 92), (198, 92), (198, 150), (190, 162), (178, 168), (184, 148), (184, 120), (176, 92)], 2)) & skin
b.multiply(fs2 & ~fs, (217, 194, 183), 1.0)
# the eyes: red -> dark brown; the right eye's outer corner (under the hair before) painted
irises = b.sel(hue=(300, 50), sat=(0.45, 1), val=(0.2, 1), polys=[EYE_L, EYE_R])
b.ramp(irises, [(0.0, (12, 8, 6)), (0.2, (40, 24, 14)), (0.45, (82, 52, 30)), (0.7, (126, 88, 54)), (1.0, (190, 150, 108))], gain=1.0)
b.over(cel(S, [[(149, 102.5), (155, 103.5), (157.5, 106), (154, 109.5), (149, 110.5)]], ((200, 192, 188), (236, 230, 226), (244, 240, 236)),
           lw=0, shade=1.5, light=0, outline=False, ldir=LD))
b.over(strokes(S, [((144, 101.2), (152, 101.4), (159, 105.5), 2.6)], LINE, alpha=1.0, taper_to=0.3))
b.over(strokes(S, [((150, 110.6), (154, 110.2), (157, 107.5), 1.1)], (150, 96, 80), alpha=0.8, taper_to=0.4))
# the face's contour (the far cheek, the chin, the jaw) as a clean line
CONTOUR = smooth([(86, 110), (93, 114), (98, 120), (102, 135), (106, 152), (111, 167), (117, 178), (124, 184), (131, 185), (143, 182),
                  (159, 177), (176, 170), (189, 162), (196, 152), (199, 142)], 2)
b.over(line_along(CONTOUR, 2.2))

head = take(b.img, face)

# ---------- the new body ----------
body = np.zeros((H, W, 4), np.float32)
# the short black hair at the nape (behind the ear, under the cap)
NAPE = smooth([(202, 82), (226, 80), (238, 96), (240, 120), (234, 142), (222, 154), (208, 152), (212, 130), (214, 110), (208, 92)])
nape = cel_b([NAPE], BLACK_T[:3], lw=2.0, shade=5, light=2)
nape = over(nape, hair_strands(S, erode_cv(nape[..., 3] > 0.5, 2), (226, 170), BLACK_T[2], BLACK_T[3], n=40, length=(6, 10), seed=3,
                               alpha=(0.6, 0.5)))
body = over(body, nape)
NECK = [(134, 178), (204, 148), (214, 170), (218, 214), (214, 244), (146, 244), (144, 214)]
neck = cel_b([NECK], SKIN_T, lw=2.0, shade=8, light=2)
nm = neck[..., 3] > 0.5
CHIN_SH = smooth([(120, 182), (160, 176), (200, 158), (214, 150), (222, 170), (206, 194), (176, 204), (146, 202), (128, 192)])
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the purple coat: the shoulders, a round neckline, its fronts closed down the middle (the near one over the far one)
NECKLINE = smooth([(132, 206), (146, 222), (166, 232), (190, 232), (208, 222), (222, 204)])
COAT = smooth([(-10, 350), (0, 290), (18, 250), (56, 226), (100, 212), (132, 206)]) + NECKLINE[1:] \
    + smooth([(222, 204), (256, 204), (296, 220), (324, 246), (338, 290), (342, 350)])
coat = cel_b([COAT], COAT_T[:3], lw=2.0, shade=10, light=3, shade2=4)
cm = erode_cv(coat[..., 3] > 0.5, 2)
coat = over(coat, hair_strands(S, cm, (180, 520), COAT_T[2], COAT_T[3], n=260, length=(4, 8), seed=5, alpha=(0.18, 0.22)))
coat = over(coat, strokes(S, [((44, 258), (36, 300), (34, 350), 1.8), ((88, 240), (92, 290), (96, 350), 1.4), ((296, 248), (304, 296), (306, 350), 1.8),
                              ((150, 270), (152, 310), (150, 350), 1.3), ((222, 268), (224, 310), (228, 350), 1.3)], COAT_T[3], alpha=0.7,
                          clip=cm))
body = over(body, coat)
# a low standing collar round the neck, gold trim on its top edge, round the neckline and down the near front's edge
COLLAR_TOP = smooth([(134, 198), (150, 208), (168, 214), (190, 214), (208, 206), (221, 194)])
collar = cel_b([COLLAR_TOP + NECKLINE[::-1]], COAT_T[:3], lw=2.0, shade=6, light=2.5)
body = over(body, collar)
FRONT_EDGE = smooth([(178, 232), (180, 280), (184, 350)])
body = over(body, cel_b([taper(np.asarray(NECKLINE), 7, 7), taper(np.asarray(FRONT_EDGE), 7, 7), taper(np.asarray(COLLAR_TOP), 6, 6)],
                        GOLD_T, lw=1.4, shade=2, light=1.2))
body = over(body, strokes(S, [((176, 236), (178, 290), (181, 350), 1.0)], GOLD_T[0], alpha=0.6, taper_to=1.0))
# the brown leather straps of the tray box over both shoulders
for c0, c1, c2, w in (((102, 212), (104, 280), (110, 352), 15), ((246, 206), (250, 280), (256, 352), 16)):
    st = taper(bez(c0, c1, c2, 30), w, w + 1)
    lay = cel_b([st], STRAP_T[:3], lw=1.8, shade=4, light=1.6)
    body = over(body, lay)
    for off in (-w / 2 + 3, w / 2 - 3):
        pts = bez((c0[0] + off, c0[1] + 2), (c1[0] + off, c1[1]), (c2[0] + off, c2[1]), 26)
        body = over(body, dots(S, [(p[0], p[1], 0.8) for p in pts[::2]], (176, 140, 100), alpha=0.8))

# ---------- the amulets on cords round the neck ----------
def cord(p0, p1, p2, col=(70, 46, 30), w=1.6):
    return strokes(S, [(p0, p1, p2, w)], col, alpha=1.0, taper_to=1.0)


AM = np.zeros((H, W, 4), np.float32)
P0, P2 = (144, 210), (216, 204)          # (where the cords go round the back of the neck)


def low(B, p0=P0, p2=P2):
    """The control point of a cord between p0 and p2 whose lowest point (t = 0.5) is B."""
    return (2 * B[0] - 0.5 * (p0[0] + p2[0]), 2 * B[1] - 0.5 * (p0[1] + p2[1]))


# (cord colour, the pendant's top, the pendant)
HUNG = [((40, 40, 44), (142, 256), 'eye'), ((120, 84, 50), (182, 278), 'sun'), ((70, 46, 30), (158, 292), 'drop'),
        ((150, 34, 30), (212, 292), 'saint'), ((96, 66, 40), (226, 240), 'cross'), ((60, 40, 26), (196, 318), 'coin'),
        ((130, 110, 80), (168, 320), 'tooth')]
for col, B, _ in HUNG:
    AM = over(AM, cord(P0, low(B), P2, col))
# a string of bone beads with a red bead in the middle
bp = bez(P0, low((180, 252)), P2, 24)
AM = over(AM, cel(S, [ellipse(p[0], p[1], 3.2, 2.8) for k, p in enumerate(bp[2:-2]) if k % 2 == 0 and abs(k - 10) > 1],
                  ((176, 168, 150), (226, 220, 200), (248, 246, 236)), lw=0.9, shade=1.2, light=0.8, ldir=LD))
AM = over(AM, cel(S, [ellipse(bp[12][0], bp[12][1], 4.2, 4.0)], ((120, 20, 20), (186, 40, 36), (236, 120, 100)), lw=1.0, shade=1.2, light=0.8,
                  ldir=LD))
for col, (x, y), kind in HUNG:
    if kind == 'sun':                    # a big brass sun with a face
        cy = y + 15
        AM = over(AM, cel(S, [[(x + np.cos(t) * (16 if k % 2 else 12), cy + np.sin(t) * (16 if k % 2 else 12)) for k, t in
                               enumerate(np.linspace(0, 2 * np.pi, 24, endpoint=False))]], GOLD_T, lw=1.4, shade=2.5, light=1.5, ldir=LD))
        AM = over(AM, cel(S, [ellipse(x, cy, 8.5, 8.5)], ((176, 124, 36), (236, 196, 90), (252, 232, 160)), lw=1.2, shade=2, light=1.2, ldir=LD))
        AM = over(AM, dots(S, [(x - 3, cy - 2, 1.0), (x + 3, cy - 2, 1.0)], LINE, alpha=0.8))
        AM = over(AM, strokes(S, [((x - 3.5, cy + 3), (x, cy + 5), (x + 3.5, cy + 3), 1.0)], LINE, alpha=0.8, taper_to=1.0))
    elif kind == 'drop':                 # a green glass drop
        AM = over(AM, cel(S, [smooth([(x, y), (x + 6, y + 10), (x + 5, y + 17), (x, y + 19), (x - 5, y + 17), (x - 6, y + 10), (x, y)], 2)],
                          ((40, 110, 70), (90, 186, 126), (190, 240, 200)), lw=1.2, shade=2.4, light=1.2, ldir=LD))
        AM = over(AM, dots(S, [(x - 2, y + 9, 1.4)], (230, 255, 236), alpha=0.9))
    elif kind == 'saint':                # a tin saint (an oval plaque with a little figure)
        cy = y + 10
        AM = over(AM, cel(S, [ellipse(x, cy, 7.5, 10)], ((120, 124, 132), (184, 188, 196), (228, 232, 238)), lw=1.2, shade=2, light=1.2, ldir=LD))
        AM = over(AM, strokes(S, [((x, cy - 2), (x, cy + 3), (x, cy + 7), 2.0), ((x - 3.5, cy + 1), (x, cy), (x + 3.5, cy + 1), 1.0)],
                              (96, 98, 106), alpha=0.9, taper_to=0.8))
        AM = over(AM, dots(S, [(x, cy - 4.5, 2.0)], (96, 98, 106), alpha=0.9))
    elif kind == 'cross':                # a small wooden cross
        AM = over(AM, cel(S, [[(x - 1.8, y), (x + 1.8, y), (x + 1.8, y + 5), (x + 5.5, y + 5), (x + 5.5, y + 8), (x + 1.8, y + 8), (x + 1.8, y + 17),
                               (x - 1.8, y + 17), (x - 1.8, y + 8), (x - 5.5, y + 8), (x - 5.5, y + 5), (x - 1.8, y + 5)]],
                          ((86, 56, 30), (136, 96, 56), (170, 130, 84)), lw=0.9, shade=1.0, light=0.6, ldir=LD))
    elif kind == 'eye':                  # a blue glass eye bead
        cy = y + 6
        AM = over(AM, cel(S, [ellipse(x, cy, 6.5, 6.5)], ((20, 50, 120), (40, 90, 180), (110, 160, 230)), lw=1.0, shade=1.5, light=1.0, ldir=LD))
        AM = over(AM, dots(S, [(x, cy, 3.6)], (240, 244, 250)))
        AM = over(AM, dots(S, [(x, cy, 2.4)], (110, 170, 230)))
        AM = over(AM, dots(S, [(x, cy, 1.2)], (16, 18, 30)))
    elif kind == 'coin':                 # a holed brass coin
        cy = y + 8
        AM = over(AM, cel(S, [ellipse(x, cy, 7.5, 7.5)], ((150, 104, 30), (204, 156, 60), (240, 206, 120)), lw=1.1, shade=2, light=1.2, ldir=LD,
                          holes=[ellipse(x, cy - 4.5, 1.4, 1.4)]))
        AM = over(AM, strokes(S, [((x - 3, cy + 1), (x, cy + 3), (x + 3, cy + 1), 0.9)], (130, 90, 30), alpha=0.8))
    elif kind == 'tooth':                # a wolf's fang
        AM = over(AM, cel(S, [smooth([(x - 3, y), (x + 3, y), (x + 3, y + 7), (x + 1, y + 14), (x - 2, y + 18), (x - 3, y + 10), (x - 3, y)], 2)],
                          ((176, 166, 140), (232, 224, 200), (250, 246, 232)), lw=1.0, shade=1.5, light=0.8, ldir=LD))
        AM = over(AM, strokes(S, [((x - 4, y + 1), (x, y - 1), (x + 4, y + 1), 1.6)], (70, 46, 30), alpha=1.0, taper_to=1.0))
body = over(body, AM)

b.img = body
b.over(head)

# ---------- the black hair at the temple and the sideburn, the brows, the curled moustache ----------
SIDE = smooth([(188, 82), (200, 82), (200, 96), (196, 108), (194, 126), (191, 136), (187, 126), (186, 108), (184, 92)])
side = cel(S, [SIDE], BLACK_T[:3], lw=1.6, shade=3, light=1.2, ldir=LD)
side = over(side, strokes(S, [((192, 86), (192, 104), (190, 128), 1.0)], BLACK_T[2], alpha=0.6, clip=erode_cv(side[..., 3] > 0.5, 1)))
b.over(side)
# (a tuft at the far temple under the cap)
b.over(cel(S, [smooth([(86, 82), (100, 82), (98, 88), (93, 93), (88, 97), (85, 92), (86, 82)], 2)], BLACK_T[:3], lw=1.4, shade=2, light=1, ldir=LD))
BROWS = [((86, 99), (96, 95), (108, 96), 4.0), ((128, 97), (142, 89), (158, 92), 4.4)]
b.over(cel(S, [taper(bez(r, c, t, 16), w * 0.7, 1.2, w_mid=w) for r, c, t, w in BROWS], BLACK_T[:3], lw=1.0, shade=1.4, light=0.8, ldir=LD))
MOUS_L = smooth([(120, 150), (110, 152), (102, 156), (96, 156), (92, 152), (93, 146), (97, 145), (96, 149), (100, 151), (106, 148), (114, 146),
                 (121, 147)], 2)
MOUS_R = smooth([(119, 147), (130, 145), (142, 147), (152, 150), (158, 148), (161, 142), (166, 143), (165, 152), (158, 157), (148, 158),
                 (136, 157), (126, 156), (119, 153)], 2)
mo = cel(S, [MOUS_L, MOUS_R], BLACK_T[:3], lw=1.5, shade=2.5, light=1.2, ldir=LD)
mo = over(mo, hair_strands(S, erode_cv(mo[..., 3] > 0.5, 1), (118, 175), BLACK_T[2], BLACK_T[3], n=40, length=(4, 7), seed=7, alpha=(0.5, 0.5)))
b.over(mo)

# ---------- the tall red felt cap (no brim, a flat top) ----------
CX0, CY0, RX0, RY0 = 160, 80, 75, 12       # the bottom rim
CX1, CY1, RX1, RY1 = 168, 13, 54, 8         # the flat top
FRONT = ellipse(CX0, CY0, RX0, RY0, 0, 50, 0, np.pi)                  # (the rim's front half, right to left)
BACK = ellipse(CX1, CY1, RX1, RY1, 0, 50, np.pi, 2 * np.pi)          # (the top's back half, left to right)
FEZ = FRONT + BACK
fez = cel(S, [FEZ], FEZ_T[:3], lw=2.0, shade=16, light=5, shade2=6, ldir=(0.98, 0.2))
fm = fez[..., 3] > 0.5
fez = over(fez, hair_strands(S, erode_cv(fm, 2), (164, 200), FEZ_T[2], FEZ_T[3], n=180, length=(4, 8), seed=9, alpha=(0.15, 0.2)))
fez = over(fez, strokes(S, [((112, 70), (114, 40), (122, 14), 1.4), ((210, 84), (212, 48), (210, 14), 1.4)], FEZ_T[3], alpha=0.5,
                        clip=erode_cv(fm, 2)))
TOP = ellipse(CX1, CY1, RX1, RY1, 0, 50)
fez = over(fez, cel(S, [TOP], (FEZ_T[0], FEZ_T[1], FEZ_T[2]), lw=1.8, shade=2.5, light=1.5, ldir=LD))
put_hat(b, fez, shadow=(170, 110, 100), shadow_k=0.55, sdx=3, sdy=8)
b.save(OUT)
print('ok', OUT)
