# Hubert Szary (Wolna Kompania, docs/PODROZNI.md 2.13 / D47: the company's leader, about 50, calm, 2026-10-29): Actor3_7 (the
# young knight in the blue plate armour and the crested helmet) repainted to his map sheet ($Npc_Kompania_1, $Human_Merc
# recoloured by tools/podroznicy/kompania.py) - only the face kept (the calm, serious look down to the left), older: weathered
# skin, crow's feet and furrows, a bushy GREY brow, steel-grey eyes; the blue helmet and armour gone and everything round the
# face painted new: a MAIL COIF framing the face, a steel KETTLE HAT over it (a wide brim, a ridge down the dome, rivets, a few
# rust spots), a full GREY BEARD with a paler moustache flowing out of the coif (painted), the coif's mail cape over the
# shoulders, under it a GREY QUILTED GAMBESON (diamond quilting, a front closure with toggles) and the edge of his round grey
# shield with an iron rim and boss at the lower right.
# 0 PixelLab generations. Run: python tools/busts/make_kompania_1.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kompania_1_Bust.png')
b = Bust('Actor3_7')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)


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


def celf(polys, tones, pad=16, holes=(), **kw):
    """cel() for shapes running off the frame: drawn on a bigger canvas with the points on (or past) the frame's edges pushed
    out, then cut back - the frame cuts them (no shade band, light band or line along the frame's edges). (as make_kapral's)"""
    def ext(p):
        x, y = p
        return (x + pad + (-pad if x <= 0 else pad if x >= W else 0), y + pad + (-pad if y <= 0 else pad if y >= H else 0))
    holes = [[(x + pad, y + pad) for x, y in h] for h in holes]
    big = cel((H + 2 * pad, W + 2 * pad), [[ext(p) for p in poly] for poly in polys], tones, holes=holes, ldir=LD, **kw)
    return np.ascontiguousarray(big[pad:pad + H, pad:pad + W])


def ring_layer(mask, bend, dx=7.0, dy=5.0, ss=4):
    """Chain mail: staggered rows of small rings inside mask -> (dark, shine) float masks (as make_kapral's)."""
    inner = erode_cv(mask, 1)
    dark, shine = [], []
    for j in range(-40, int(H / dy) + 40):
        y = j * dy
        off = (j % 2) * dx / 2
        for i in range(-1, int(W / dx) + 2):
            x = i * dx + off
            yy = y + bend(x)
            xi, yi = int(round(x)), int(round(yy))
            if not (0 <= xi < W and 0 <= yi < H) or not inner[yi, xi]:
                continue
            dark.append(taper(bez((x - 3.0, yy - 0.4), (x, yy + 3.8), (x + 3.0, yy - 0.4), 10), 1.2, 1.0))
            shine.append(taper(bez((x - 2.2, yy - 0.9), (x - 0.4, yy - 3.0), (x + 1.6, yy - 1.8), 8), 1.0, 0.5))
    cv = Canvas(W, H, ss)
    d = cv.to_1x(cv.mask(dark))[..., 3]
    s = cv.to_1x(cv.mask(shine))[..., 3]
    return d * mask, s * mask


def mail_piece(polys, bend, lw=2.0, shade=11, light=3, holes=()):
    """A cel-shaded steel shape with staggered rings over it."""
    lay = celf(polys, MAIL_T, lw=lw, shade=shade, light=light, holes=holes)
    m = lay[..., 3] > 0.5
    d, s = ring_layer(erode_cv(m, int(np.ceil(lw))), bend)
    lit = np.clip((luma(lay) - 0.36) / 0.2, 0, 1)
    rgb = lay[..., :3] * (1 - 0.65 * d[..., None]) + np.asarray(MAIL_RING, np.float32) / 255.0 * 0.65 * d[..., None]
    sh = (s * (0.25 + 0.55 * lit))[..., None]
    lay[..., :3] = rgb * (1 - sh) + np.asarray(MAIL_SHINE, np.float32) / 255.0 * sh
    return lay


def rust(lay, pts, seed, alpha=0.55):
    """A few rust specks on steel (the map's helmet and mail have them)."""
    rng = np.random.RandomState(seed)
    m = erode_cv(lay[..., 3] > 0.5, 2)
    dd = [(x + rng.uniform(-2, 2), y + rng.uniform(-2, 2), rng.uniform(0.9, 2.0)) for x, y in pts]
    return over(lay, dots(S, dd, (120, 70, 44), alpha=alpha, clip=m))


# the map's colours (front\Kompania_1.png): helmet (218, 221, 222)/(193, 192, 191)/(150, 149, 147)/(105, 104, 101)/(69, 69, 68),
# coif and mail (226, 221, 215)/(202, 197, 191)/(158, 155, 151)/(122, 120, 117), rust (79, 59, 47)/(54, 44, 36), beard
# (104, 101, 99)/(84, 82, 81)/(55, 50, 47), moustache (141, 138, 134)/(177, 173, 168), skin (252, 185, 139)/(217, 156, 123),
# gambeson (138, 143, 149)/(108, 112, 117)/(84, 87, 92)/(71, 74, 77), shield (155, 160, 168)/(121, 125, 131)
HELM_T = ((84, 86, 90), (150, 152, 154), (206, 208, 210))
MAIL_T = ((74, 76, 80), (146, 146, 146), (196, 194, 190))
MAIL_RING = (46, 46, 50)
MAIL_SHINE = (228, 224, 218)
BEARD_T = ((80, 78, 76), (118, 116, 113), (156, 154, 150), (58, 56, 54))
MOUS_T = ((122, 119, 115), (162, 159, 154), (200, 198, 194), (96, 93, 90))
BROW_T = ((96, 94, 92), (150, 148, 144), (200, 198, 194))
GAMB_T = ((76, 80, 86), (112, 117, 123), (140, 145, 151), (60, 63, 68))
QUILT = (72, 75, 80)
SHIELD_T = ((92, 96, 104), (126, 131, 138), (158, 163, 170))
IRON_T = ((56, 58, 62), (110, 112, 116), (176, 178, 182))
SKIN_R = [(0.0, (40, 18, 12)), (0.3, (118, 70, 50)), (0.5, (170, 112, 84)), (0.62, (200, 138, 104)), (0.72, (222, 160, 124)),
          (0.8, (238, 178, 140)), (0.86, (248, 194, 156)), (1.0, (254, 214, 182))]

# ---------- what stays of the face: the skin, the eye, the lines (the blue steel round it goes) ----------
FACE_P = [(146, 134), (192, 130), (199, 148), (198, 176), (195, 198), (186, 214), (172, 229), (156, 233), (143, 226), (136, 211), (124, 205),
          (119, 196), (122, 185), (130, 172), (137, 158), (141, 146)]
EYE = [(146, 146), (176, 144), (178, 168), (146, 170)]
hd, s, v = hsv_of(b.src)
skin = b.sel(hue=(5, 50), sat=(0.2, 0.7), val=(0.45, 1), poly=FACE_P)
eye = b.poly(EYE) & b.op()
lines = dilate_cv(skin, 2) & (luma(b.src) < 0.3) & b.poly(FACE_P)
face = (skin | eye | lines) & b.poly(FACE_P)
face = fill_holes(face) & b.poly(FACE_P)
# (the blue steel's rim light left along the face's edges: the line colour; the black hair over the brow: grey)
blue = face & ~skin & ~eye & (hd >= 170) & (hd <= 260) & (s > 0.25)
b.img[..., :3] = np.where(blue[..., None], np.asarray(LINE, np.float32) / 255.0, b.img[..., :3])
HAIRP = [(140, 128), (200, 126), (200, 149), (178, 148), (166, 147), (150, 148), (140, 151)]
hair = face & ~skin & b.poly(HAIRP) & ~blue
b.ramp(hair, [(0.0, (40, 40, 42)), (0.1, (76, 76, 78)), (0.25, (118, 118, 118)), (0.45, (160, 160, 158)), (0.7, (200, 200, 198))], gain=1.4)
# steel-grey eye, weathered skin
iris = eye & (hd >= 180) & (hd <= 260) & (s > 0.3)
b.ramp(iris, [(0.0, (14, 16, 20)), (0.2, (40, 46, 54)), (0.4, (74, 84, 96)), (0.6, (112, 124, 136)), (0.8, (160, 170, 180)), (1.0, (214, 220, 226))])
pale = eye & (s < 0.3) & (v > 0.6) & (hd >= 170) & (hd <= 270)
b.hsv(pale, hue=210, sat=0.05, vmul=0.95)
b.ramp(skin & ~iris & ~pale, SKIN_R, gain=1.0)
WR = (170, 104, 76)
b.over(strokes(S, [((178, 156), (184, 159), (189, 158), 1.0), ((178, 162), (184, 166), (189, 166), 1.0), ((152, 172), (162, 175), (172, 172), 1.0),
                   ((182, 176), (178, 188), (176, 200), 1.3), ((140, 174), (144, 180), (145, 188), 1.0)], WR, alpha=0.5, clip=skin))

# ---------- the new picture, back to front: gambeson, shield, mail cape, coif, the face, the beard, the brow, the hat ----------
img = np.zeros((H, W, 4), np.float32)
# the gambeson: broad shoulders, diamond quilting, the front closure with toggles
GAMB = smooth([(-10, 350), (-8, 290), (14, 258), (60, 236), (110, 226), (170, 224)]) + smooth([(170, 224), (230, 222), (280, 232), (316, 252),
                                                                                                (336, 290), (340, 350)])
gam = celf([GAMB], GAMB_T[:3], lw=2.0, shade=12, light=3)
gm = erode_cv(gam[..., 3] > 0.5, 2)
q = []
for k in range(-20, 30):
    c = k * 19.0
    q.append(((c, 200), (c + 75, 275), (c + 150, 350), 1.3))
    q.append(((c + 150, 200), (c + 75, 275), (c, 350), 1.3))
gam = over(gam, strokes(S, q, QUILT, alpha=0.75, clip=gm, taper_to=1.0))
q2 = [((x0 + 1.6, y0 + 0.6), (x1 + 1.6, y1 + 0.6), (x2 + 1.6, y2 + 0.6), 1.0) for (x0, y0), (x1, y1), (x2, y2), w in q]
gam = over(gam, strokes(S, q2, GAMB_T[2], alpha=0.35, clip=gm, taper_to=1.0))
gam = over(gam, hair_strands(S, gm, (170, 600), GAMB_T[2], GAMB_T[3], n=120, length=(4, 8), seed=11, alpha=(0.12, 0.18)))
FRONT = smooth([(176, 262), (180, 300), (182, 350)], 2)
gam = over(gam, line_along(FRONT, 2.4, LINE, 0.95))
gam = over(gam, line_along([(x + 3, y) for x, y in FRONT], 1.0, GAMB_T[2], 0.6))
for y in (300, 336):
    x = 178 + (y - 262) * 0.06
    gam = over(gam, cel(S, [[(x - 8, y - 3), (x + 9, y - 3), (x + 9, y + 3), (x - 8, y + 3)]], ((70, 46, 30), (112, 78, 50), (140, 104, 70)),
                        lw=1.1, shade=1.5, light=0.8, ldir=LD))
img = over(img, gam)
# the shield (on his near arm) at the lower right: grey painted planks, an iron rim, the boss
SC, SR = (322, 360), 92
shield = celf([ellipse(SC[0], SC[1], SR, SR * 1.04, 0, 80)], SHIELD_T, lw=2.0, shade=10, light=3)
smk = erode_cv(shield[..., 3] > 0.5, 2)
shield = over(shield, strokes(S, [((SC[0] - 40 - 22 * k, SC[1] - 120), (SC[0] - 40 - 22 * k, SC[1] - 40), (SC[0] - 40 - 22 * k, SC[1] + 40), 1.3)
                                  for k in range(-2, 3)], SHIELD_T[0], alpha=0.7, clip=smk, taper_to=1.0))
shield = over(shield, celf([ellipse(SC[0], SC[1], SR, SR * 1.04, 0, 80)], IRON_T, lw=2.0, shade=3, light=1.5,
                           holes=[ellipse(SC[0], SC[1], SR - 9, SR * 1.04 - 9, 0, 80)]))
shield = over(shield, cel(S, [ellipse(SC[0] - 2, SC[1] - 4, 30, 30, 0, 50)], IRON_T, lw=2.0, shade=8, light=3, ldir=LD))
shield = over(shield, strokes(S, [((SC[0] - 24, SC[1] - 20), (SC[0] - 18, SC[1] - 28), (SC[0] - 8, SC[1] - 31), 3.0)], (230, 232, 236),
                              alpha=0.8, taper_to=0.3))
shield = over(shield, dots(S, [(SC[0] + 70 * np.cos(t), SC[1] + 72 * np.sin(t), 2.4) for t in np.radians([200, 215, 230, 245, 260])],
                           IRON_T[0], alpha=0.9, clip=smk))
shield = rust(shield, [(270, 330), (300, 296), (252, 350), (318, 288)], 12)
img = over(img, shield)
# the mail cape over the shoulders (the coif's lower part)
CAPE = smooth([(110, 206), (70, 222), (30, 240), (0, 262)]) + [(-10, 262), (-10, 300)] + \
    smooth([(-10, 300), (40, 296), (90, 288), (140, 286), (190, 292), (232, 286), (270, 278), (300, 266)], 2) + \
    smooth([(300, 266), (288, 240), (262, 220), (236, 206)], 2)
cape = mail_piece([CAPE], lambda x: 0.0006 * (x - 170) ** 2 * -1.0, shade=10, light=3)
cape = rust(cape, [(60, 250), (120, 270), (240, 262), (200, 276), (36, 268), (150, 252)], 13, 0.45)
img = over(img, cape)
# the coif: a mail hood round the face (its opening a little wider than the face on the far side - the dark padding shows)
COIF = smooth([(96, 118), (90, 150), (94, 186), (104, 214), (120, 236), (150, 250), (186, 250), (220, 240), (242, 214), (248, 180),
               (246, 140), (238, 112)], 2) + [(200, 96), (130, 96)]
OPEN = smooth([(150, 144), (172, 140), (191, 141), (199, 156), (198, 180), (194, 202), (186, 220), (172, 236), (152, 240), (130, 228),
               (118, 212), (113, 196), (120, 178), (130, 162), (138, 150)], 2)
inside = cel(S, [OPEN], ((44, 42, 42), (64, 60, 58), (80, 76, 72)), outline=False, shade=6, light=0, ldir=(-0.55, -0.83))
img = over(img, inside)
coif = mail_piece([COIF], lambda x: 0.0012 * (x - 170) ** 2, shade=12, light=3, holes=[OPEN])
coif = rust(coif, [(110, 170), (232, 160), (226, 210), (104, 200), (240, 186)], 14, 0.4)
img = over(img, coif)
# (the face: what stays, clipped to the coif's opening; the coif's rim shades it)
fl = take(b.img, face & b.poly(OPEN))
img = over(img, fl)
om = b.poly(OPEN)
ring = om & ~shift(om, -3, -6) & (b.yy < 200)
img[..., :3] = np.where((ring & face)[..., None], img[..., :3] * np.asarray((0.78, 0.72, 0.74), np.float32), img[..., :3])

# ---------- the full grey beard flowing out of the coif, a paler moustache ----------
OUTER = [(197, 168), (198, 188), (194, 208), (188, 226), (178, 242), (164, 254), (148, 256), (136, 246), (130, 232), (131, 218)]
INNER = [(138, 216), (150, 219), (162, 216), (172, 208), (182, 196), (189, 182), (192, 168)]
MOUS = [(127, 204), (136, 201), (148, 202), (160, 205), (169, 209), (175, 216), (176, 225), (170, 219), (161, 213), (149, 211), (137, 210),
        (129, 208)]
bd = beard2(S, OUTER, INNER, BEARD_T, flow=(150, 290), mous=MOUS, mous_flow=(166, 224), mous_tones=MOUS_T, seed=15, n=150, tip=5, out=2.4, seg=8)
img = over(img, bd)
# the bushy grey brow over the eye, at the coif's rim
BROW = [((147, 148), (162, 143), (182, 147), 5.5)]
img = over(img, cel(S, [taper(bez(r, c, t, 16), w * 0.9, 2.0, w_mid=w) for r, c, t, w in BROW], BROW_T, lw=1.0, shade=1.5, light=1.0, ldir=LD))
img = over(img, strokes(S, [((150 + k * 4, 148 - k * 0.3), (152 + k * 4, 145 - k * 0.4), (156 + k * 4, 143 + k * 0.1), 1.0) for k in range(8)],
                        BROW_T[2], alpha=0.6, taper_to=0.2))
b.img = img

# ---------- the kettle hat: a steel dome on a wide brim tilted with the head, a ridge down the dome, rust ----------
HX, HY, RX, RY = 176, 109, 70, 62
hat = kettle_hat(S, HX, HY, RX, RY, 104, 22, rot=-8, tones=HELM_T, brim_dy=5)
dome = erode_cv(hat[..., 3] > 0.5, 2) & (b.yy < HY - 3)
hat = over(hat, strokes(S, [((HX + 2, HY - 6), (HX - 6, HY - RY * 0.6), (HX - 10, HY - RY + 3), 2.0)], HELM_T[0], alpha=0.6, clip=dome, taper_to=0.6))
hat = over(hat, strokes(S, [((HX - 1.5, HY - 6), (HX - 9.5, HY - RY * 0.6), (HX - 13, HY - RY + 4), 1.3)], HELM_T[2], alpha=0.6, clip=dome, taper_to=0.6))
hat = rust(hat, [(130, 92), (214, 84), (200, 112), (98, 132), (250, 118), (150, 70)], 16, 0.5)
cast_shadow(b, hat[..., 3], dx=2, dy=10, col=(120, 110, 120), k=0.5)
b.over(hat)
b.save(OUT)
print('ok', OUT)
