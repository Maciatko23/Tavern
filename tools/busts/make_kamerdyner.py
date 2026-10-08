# Teodor (the Lord's butler after Feliks, about 65 - "he served the Lord's father too", kind): People4_1 repainted to match his
# map sheet ($Npc_Kamerdyner): an OLD face (forehead lines, crow's feet, bags under the eyes, nose-to-mouth folds, a sagging
# jaw), grey hair grown long behind the ear down to the collar and grey sideburns; the round spectacles gone - only the near
# lens kept as a gold-rimmed MONOCLE, which his hand (now in a white glove, the bare forearm a black sleeve) is adjusting; the
# green vest a crimson waistcoat with gold buttons, its yoked side and the beige shirt the black frock coat with red piping, the
# collar and scarf white like the cravat, a red flower in the lapel.
# (2026-10-06 first version kept the young face and the spectacles; 2026-10-07 aged and the frock coat to match the map.)
# Run: python tools/busts/make_kamerdyner.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kamerdyner_Bust.png')
b = Bust('People4_1')
S = b.img.shape
hd, s, v = hsv_of(b.src)
L0 = luma(b.src)


def ell(cx, cy, rx, ry):
    return ((b.xx - cx) / rx) ** 2 + ((b.yy - cy) / ry) ** 2


def nn_fill(R, ok):
    """Every pixel of R (in b.img and b.src) takes the colour of the nearest pixel of ok (flat, like the cel tones)."""
    u = (~ok).astype(np.uint8)
    _, lab = cv2.distanceTransformWithLabels(u, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    zy, zx = np.nonzero(u == 0)
    lut = np.zeros(lab.max() + 1, np.int64)
    lut[lab[zy, zx]] = zy * S[1] + zx
    idx = lut[lab][R]
    for a in (b.img, b.src):
        flat = a.reshape(-1, 4)
        a[R] = flat[idx]


def soften(R, w, sigma=2.2):
    """The filled pixels R blended with their neighbours in w (skin: the RTP skin is softly shaded, so no seam)."""
    wf = (w | R).astype(np.float32)
    for a in (b.img, b.src):
        num = cv2.GaussianBlur(a[..., :3] * wf[..., None], (0, 0), sigma)
        den = cv2.GaussianBlur(wf, (0, 0), sigma)[..., None]
        a[..., :3] = np.where(R[..., None], num / np.maximum(den, 1e-4), a[..., :3])


# ---------- the spectacles off: the far lens, the bridge and the far temple arm (filled from the skin round them) ----------
skin = (((hd <= 45) | (hd >= 340)) & (s >= 0.08) & (s <= 0.5) & (v >= 0.78))
teal = (hd >= 170) & (hd <= 240) & (s > 0.4) & (v >= 0.32)
hairline = (hd >= 190) & (hd <= 240) & (s > 0.45) & (v < 0.32) & (b.yy < 103)
RC = (192.5, 117.5, 17.5, 19.0)                       # the far lens' rim (an ellipse)
EYE_F = [(181, 107), (204, 107), (204, 119), (181, 119)]
protect = hairline | (teal & ((b.yy < 104) | (b.xx >= 210))) | (b.xx >= 211.5) | b.poly(EYE_F)
ring = (ell(RC[0], RC[1], RC[2] + 3.6, RC[3] + 3.6) <= 1) & (ell(RC[0], RC[1], RC[2] - 4.6, RC[3] - 4.6) >= 1)
wide = (ell(RC[0], RC[1], RC[2] + 5, RC[3] + 5) <= 1) & (ell(RC[0], RC[1], RC[2] - 6, RC[3] - 6) >= 1)
inner = (ell(*RC) <= 1) & (b.xx < 190) & (b.yy > 119) & ~(skin & (s < 0.3))     # the lens' shadow inside, near the nose
bridge = b.poly([(159, 107), (178, 107), (178, 123), (159, 123)])
R = (ring & ~protect) | bridge | inner | (wide & ~protect & (((s < 0.1) & (v > 0.97)) | ((b.xx < 178) & (s > 0.3))))   # (+ its outer edge)
nn_fill(R, skin & (s >= 0.15) & (s < 0.3) & (v >= 0.95) & ~dilate(R, 1) & ~wide)
soften(R & ~bridge, skin & (s < 0.3) & ~protect & region(S, 150, 90, 212, 145))
arm = b.poly([(208, 106), (232, 106), (232, 114), (208, 114)]) & ((s < 0.3) & (v > 0.3) & (v < 0.8))
nn_fill(arm, teal & ~arm)
hd, s, v = hsv_of(b.src)
L0 = luma(b.src)

# ---------- the near lens: a gold-rimmed monocle ----------
MC = (141.0, 124.5, 17.0, 19.5)
mring = (ell(MC[0], MC[1], MC[2] + 2.4, MC[3] + 2.4) <= 1) & (ell(MC[0], MC[1], MC[2] - 2.4, MC[3] - 2.4) >= 1)
mrim = mring & (s < 0.55) & (v > 0.2) & ~skin
mrim |= b.poly([(155, 109), (160, 109), (160, 120), (155, 120)]) & (s < 0.4) & (v > 0.2) & ~skin   # (the stub of the old bridge)
GOLD_R = [(0.0, (60, 36, 12)), (0.2, (110, 70, 22)), (0.4, (176, 124, 40)), (0.6, (222, 172, 70)), (0.8, (248, 214, 128)),
          (1.0, (255, 240, 190))]
b.ramp(mrim, GOLD_R, gain=1.05)

# ---------- hair: grey ----------
hair = b.sel(hue=(170, 240), sat=(0.15, 1), box=(60, 0, 280, 195)) & ~b.poly([(140, 112), (210, 104), (214, 140), (140, 140)])
hair |= b.sel(hue=(170, 235), sat=(0.3, 1), box=(196, 100, 214, 116))     # (a lock's tip at the far eye)
hair = b.grow(hair, 1, 0.25) & region(S, 60, 0, 280, 195) & ~mrim
GREY = [(0.0, (30, 30, 36)), (0.1, (62, 62, 70)), (0.22, (110, 110, 118)), (0.38, (158, 158, 166)), (0.55, (196, 196, 204)),
        (0.75, (226, 226, 232)), (0.9, (246, 246, 250))]
b.ramp(hair, GREY, gain=1.08, bias=0.02)
# the eyes: the violet irises a faded grey-blue
iris = b.sel(hue=(235, 290), sat=(0.2, 1), polys=[[(120, 108), (156, 108), (156, 128), (120, 128)], EYE_F])
b.hsv(iris, hue=215, smul=0.45)

# ---------- the hand: a white glove; the bare forearm a black frock sleeve ----------
skinish = (((hd <= 27) | (hd >= 330)) & (s >= 0.08) & (v >= 0.5)) & (L0 >= 0.45)
ARM_AREA = [(0, 350), (0, 190), (60, 140), (95, 95), (125, 100), (127, 145), (146, 150), (155, 157), (156, 166), (147, 173), (143, 190),
            (132, 206), (110, 216), (80, 240), (55, 350)]
limb = b.comp(skinish & b.poly(ARM_AREA), (60, 215))
limb |= b.poly(ARM_AREA) & dilate(limb, 1) & (s < 0.1) & (v > 0.85)          # (its light rim)
limb = b.grow(limb, 2, 0.35) & b.poly(ARM_AREA)
limb = fill_holes(limb) & b.poly(ARM_AREA)
limb |= dilate(limb, 2) & (s < 0.2) & (v > 0.75) & b.poly(ARM_AREA) & ~skinish   # (the light edge along its outline)
WRIST = [(14, 204), (80, 220)]                                               # the line across the wrist
side = (b.xx - WRIST[0][0]) * (WRIST[1][1] - WRIST[0][1]) - (b.yy - WRIST[0][1]) * (WRIST[1][0] - WRIST[0][0])
glove = limb & (side > 0)
sleeve = limb & (side <= 0)
GLOVE = [(0.0, LINE), (0.2, (70, 70, 84)), (0.4, (140, 142, 158)), (0.58, (192, 194, 208)), (0.72, (222, 224, 234)), (0.84, (240, 241, 246)),
         (0.95, (252, 252, 255))]
b.ramp(glove, GLOVE)
BLACK = [(0.0, (8, 8, 12)), (0.25, (18, 18, 24)), (0.5, (32, 32, 40)), (0.7, (46, 46, 56)), (0.85, (60, 60, 72)), (1.0, (84, 84, 98))]
b.ramp(sleeve, BLACK)
# the sleeve's end at the wrist: a red-piped cuff edge
d = np.array([66.0, 16.0]); d /= np.linalg.norm(d); nrm = np.array([-d[1], d[0]])
P0, P1 = np.array([0.0, 200.6]), np.array([96.0, 223.9])
CUFF = [tuple(P0), tuple(P1), tuple(P1 + nrm * 4.5), tuple(P0 + nrm * 4.5)]
b.over(cel(S, [CUFF], ((96, 12, 20), (166, 30, 38), (214, 70, 66)), lw=1.2, shade=1.6, light=1.0, ldir=(0.55, 0.83), clip=dilate(limb, 1)))

# ---------- the clothes: crimson waistcoat, black frock coat with red piping, white collar ----------
HEAD = [(120, 100), (250, 90), (246, 160), (226, 172), (206, 190), (186, 198), (160, 196), (140, 180), (125, 150)]
cloth = region(S, 0, 160, 330, 350) & ~limb & ~b.poly(HEAD)
# the cravat's bow (kept white): the big pale parts and their lines, holes filled
BOWP = [(88, 225), (140, 205), (175, 200), (240, 210), (235, 260), (220, 300), (190, 345), (150, 350), (110, 330), (85, 280)]
pale = ((((hd >= 180) & (hd <= 260)) | (s < 0.08)) & (s < 0.32) & (v > 0.45)) & b.poly(BOWP)
n, lab = cv2.connectedComponents(pale.astype(np.uint8), connectivity=8)
big = np.isin(lab, [k for k in range(1, n) if (lab == k).sum() > 300])
bow = fill_holes(b.grow(big, 2, 0.4))
cloth &= ~bow
green = b.grow(b.sel(hue=(80, 160), sat=(0.15, 1)) & cloth, 2, 0.3) & cloth
pip = b.sel(hue=(180, 230), sat=(0.25, 1), val=(0.15, 0.75)) & cloth & region(S, 80, 190, 330, 350) & ~green
beige = b.sel(hue=(26, 60), sat=(0.05, 0.65), val=(0.25, 1)) & cloth & ~green
beige = b.grow(beige, 2, 0.3) & cloth & ~green & ~pip
NECK = [(128, 160), (252, 160), (252, 212), (226, 214), (204, 230), (150, 232), (130, 205)]
collar = beige & b.poly(NECK)
scarf = b.sel(hue=(190, 240), sat=(0, 0.3), val=(0.3, 0.9)) & b.poly([(196, 160), (252, 160), (252, 214), (196, 214)]) & cloth
# the shirt behind the raised arm (all its shades) is the coat too
LEFT = [(0, 350), (0, 220), (60, 215), (90, 198), (118, 192), (142, 200), (150, 224), (124, 246), (112, 260), (110, 350)]
left = b.poly(LEFT) & cloth & ~green & ~pip & ~collar
# the lapel of the coat over the right side of the waistcoat: right of the yoke strip and the vest's front edge
LAPEL = [(220, 196), (226, 214), (238, 236), (252, 252), (265, 264), (252, 280), (232, 298), (218, 312), (215, 350), (330, 350), (330, 200)]
lapel = b.poly(LAPEL)
coat = (beige & ~collar) | left | (green & lapel)
vest = green & ~lapel
b.ramp(coat, BLACK)
CRIMSON = [(0.0, (26, 4, 8)), (0.12, (60, 8, 16)), (0.25, (104, 16, 26)), (0.4, (150, 28, 38)), (0.55, (186, 44, 50)), (0.7, (214, 74, 72)),
           (0.9, (240, 140, 128))]
b.ramp(vest, CRIMSON, gain=1.0, bias=0.04)
inside = ~lapel & b.poly([(150, 190), (330, 190), (330, 350), (150, 350)])     # (the vest's own seams: dark)
RED_PIPE = [(0.0, (40, 6, 10)), (0.2, (120, 18, 26)), (0.4, (176, 34, 40)), (0.6, (214, 64, 60))]
b.ramp(pip & ~inside, RED_PIPE, gain=1.3)
b.ramp(pip & inside, [(0.0, (30, 6, 10)), (0.6, (70, 14, 20))])
WHITE = [(0.0, LINE), (0.2, (96, 96, 108)), (0.45, (168, 170, 182)), (0.62, (206, 208, 218)), (0.78, (232, 233, 240)), (0.92, (250, 250, 252))]
collar |= b.sel(hue=(0, 30), sat=(0.08, 0.32), val=(0.4, 0.75), poly=[(144, 176), (172, 180), (170, 200), (144, 198)])   # (its inside)
b.ramp(collar | scarf, WHITE, gain=1.08, bias=0.04)
# what is left of the old colours along the edges (green and beige fringes round the bow, the sleeve's seam)
torso = region(S, 0, 190, 330, 350) & ~limb & ~b.poly(HEAD) & ~fill_holes(big)
left_green = b.sel(hue=(70, 175), sat=(0.12, 1), src=False) & torso
b.ramp(left_green & lapel, BLACK)
b.ramp(left_green & ~lapel, CRIMSON, gain=1.0, bias=0.04)
warm = b.sel(hue=(0, 60), sat=(0.05, 0.7), val=(0.3, 1), src=False) & torso & b.poly([(236, 205), (330, 205), (330, 350), (212, 350)])
b.ramp(warm & ~b.sel(hue=(340, 360), sat=(0.4, 1), src=False) & ~b.sel(hue=(0, 20), sat=(0.45, 1), src=False), BLACK)
# the yoke's studs: gold buttons
studs = b.poly(*[ellipse(x, y, 3.4, 3.4, 0, 16) for x, y in ((231.7, 233.0), (245.7, 243.5), (259.3, 258.0))]) & b.sel(val=(0.5, 1))
b.ramp(studs, [(0.0, (120, 76, 22)), (0.7, (214, 160, 60)), (1.0, (252, 226, 150))])
# a red flower in the lapel (five petals, a dark heart, a leaf)
FL = (282.0, 245.0)
PETAL = ((112, 10, 20), (186, 26, 36), (232, 82, 76))
b.over(cel(S, [ellipse(FL[0] + 7, FL[1] + 8, 6.0, 2.8, 0.9, 16)], ((40, 70, 30), (70, 112, 48), (120, 160, 80)), lw=1.0, shade=1.2, light=0.8,
           ldir=(0.55, 0.83)))
pet = [ellipse(FL[0] + np.cos(a) * 4.2, FL[1] + np.sin(a) * 4.0, 4.0, 3.2, a, 16) for a in np.linspace(-np.pi / 2, 1.5 * np.pi, 5, endpoint=False)]
b.over(cel(S, pet, PETAL, lw=1.1, shade=1.8, light=1.0, ldir=(0.55, 0.83)))
b.over(dots(S, [(FL[0], FL[1], 1.6)], (70, 8, 14)))

# ---------- the long grey hair behind the ear, down to the collar (under everything), and grey sideburns ----------
HAIR_T = ((120, 120, 130), (168, 168, 178), (210, 210, 218), (96, 96, 106))
OUTER = bez((257, 86), (266, 140), (257, 204), 14).tolist()                 # the back of the hair, down behind the ear
BACK = [(244, 70)] + strand_edge(OUTER[-5:], side=1, seg=6, tip=4, out=1.6, seed=4)[:-1] + [(250, 214), (238, 210), (232, 170), (234, 110)]
BACK = [(244, 70)] + OUTER[:-5] + BACK[1:]
back = cel(S, [BACK], HAIR_T[:3], lw=1.8, shade=5, light=2.0, ldir=(0.55, 0.83))
bm = erode_cv(back[..., 3] > 0.5, 2)
back = over(back, hair_strands(S, bm, (254, 214), HAIR_T[2], HAIR_T[3], n=40, length=(12, 22), seed=5, alpha=(0.55, 0.5)))
b.img = over(back, b.img)
# the lock in front of the ear goes on down the cheek as a narrow sideburn
BURN = [(213, 117), (222, 112), (227, 116), (227, 130), (225, 145), (220, 158), (213, 167), (208, 170), (209, 154), (212, 134)]
burn = cel(S, [BURN], ((96, 96, 106), (130, 130, 140), (172, 172, 182)), outline=False, shade=3, light=1.5, ldir=(0.55, 0.83))
burn = over(burn, hair_strands(S, erode_cv(burn[..., 3] > 0.5, 1), (210, 172), (186, 186, 194), (84, 84, 94), n=22, length=(6, 12),
                               seed=6, alpha=(0.6, 0.55)))
burn = over(burn, outline(S, [BURN], lw=1.4, clip=b.yy > 122))       # (no line where it grows out of the lock)
b.over(burn)

# ---------- age: lines in the RTP manner (thin, warm, half see-through), clipped to the bare skin ----------
face_skin = b.sel(hue=(0, 40), sat=(0.1, 0.6), val=(0.7, 1), src=False) & b.poly([(140, 60), (226, 60), (226, 200), (140, 200)])
face_skin |= b.sel(hue=(340, 360), sat=(0.1, 0.6), val=(0.7, 1), src=False) & b.poly([(140, 60), (226, 60), (226, 200), (140, 200)])
face_skin &= ~b.poly(BURN)
WR = (168, 96, 84)
WR2 = (196, 128, 108)
b.over(strokes(S, [((153, 81), (165, 78), (177, 81), 1.3), ((155, 88), (166, 85), (178, 88), 1.2), ((158, 95), (168, 93), (178, 95), 1.0),
                   ((181, 84), (188, 82), (195, 85), 1.1)], WR2, alpha=0.7, clip=face_skin))
b.over(strokes(S, [((206, 108), (210, 106), (214, 103), 1.1), ((207, 112), (211, 112), (215, 111), 1.1), ((206, 116), (210, 118), (214, 120), 1.1),
                   ((185, 122), (195, 126), (205, 121), 1.2), ((189, 127), (197, 130), (204, 127), 1.0),
                   ((131, 127), (140, 131), (150, 128), 1.1)], WR, alpha=0.6, clip=face_skin))
b.over(strokes(S, [((174, 137), (188, 145), (197, 161), 1.6), ((157, 141), (155, 151), (157, 160), 1.3),
                   ((197, 161), (200, 166), (199, 172), 1.2), ((161, 161), (159, 165), (159, 170), 1.1),
                   ((170, 169), (178, 172), (187, 169), 1.2), ((204, 132), (209, 148), (205, 166), 1.3)], WR, alpha=0.62, clip=face_skin))
# a little hollow under the near cheekbone and a softer, older skin
hollow = b.poly([(199, 136), (209, 138), (210, 156), (204, 168), (199, 154)]) & face_skin
b.multiply(hollow, (226, 186, 176), 0.6)
b.multiply(face_skin, (246, 236, 232), 0.5)

b.save(OUT)
print('ok', OUT)
