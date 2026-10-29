# Zenon Sita (the grain merchant from the ferry, portly, about 55, polite and greedy): SF_Actor3_1 (the broad face with the
# knowing smile) repainted to match his map sheet ($Npc_Zboze): clean-shaven, the face made fuller and older (the cheeks and jaw
# gently inflated, a soft double chin, eye bags, laugh lines, ruddy cheeks), heavier brown brows, the dark hair a mid brown
# under a flat brown cap with a short peak (SF_Actor3_6's cap, as for the tanner, recoloured); below the head everything new:
# the white polo and the crossed arms painted over as a fine burgundy coat with a thick brown fur collar round the neck and
# shoulders, a grey linen shirt at the throat, a brass clasp, and the tied top of a grain sack resting behind the near shoulder.
# 0 PixelLab generations. Run: python tools/busts/make_zboze.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Zboze_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('SF_Actor3_1')
S = b.img.shape
H, W = S[:2]

# the map's colours ($Npc_Zboze front frame): cap (127, 90, 61)/(112, 75, 50)/(90, 59, 38)/(82, 52, 33), hair and brows
# (127, 90, 61)/(112, 75, 50), skin (244, 185, 150)/(225, 172, 140)/(204, 150, 118)/(190, 133, 107), coat (112, 36, 56)/(95, 29, 50)/
# (79, 20, 44)/(71, 19, 41)/(49, 12, 29), fur collar (127, 90, 61)/(112, 75, 50)/(82, 52, 33)/(74, 47, 31), shirt (116, 115, 119)/
# (177, 178, 180), sack (177, 145, 107)/(162, 133, 99)/(129, 103, 76)/(118, 86, 60)
HAIR = [(0.0, (22, 14, 8)), (0.15, (50, 32, 20)), (0.3, (82, 56, 36)), (0.45, (104, 72, 48)), (0.6, (124, 88, 60)), (0.8, (150, 114, 82)),
        (1.0, (180, 146, 112))]
SKIN_R = [(0.0, (40, 20, 14)), (0.2, (112, 62, 44)), (0.4, (176, 118, 92)), (0.55, (204, 150, 118)), (0.7, (226, 170, 138)),
          (0.85, (242, 184, 150)), (1.0, (252, 210, 182))]
SKIN_T = ((204, 150, 118), (242, 184, 150), (250, 206, 176))
COAT_T = ((71, 19, 41), (112, 36, 56), (140, 58, 78), (49, 12, 29))
FUR_T = ((74, 47, 31), (112, 75, 50), (146, 108, 76), (54, 34, 22))
SHIRT_T = ((96, 94, 100), (150, 150, 154), (186, 186, 190))
SACK_T = ((118, 86, 60), (162, 133, 99), (190, 162, 124), (95, 76, 61))
BRASS_T = ((110, 76, 26), (184, 140, 60), (236, 204, 128))
CAP_R = [(0.0, (20, 12, 8)), (0.2, (60, 38, 24)), (0.35, (82, 52, 33)), (0.5, (98, 66, 42)), (0.65, (112, 78, 52)), (0.8, (127, 90, 61)),
         (1.0, (156, 118, 86))]


def inflate(layer, cx, cy, rx, ry, k):
    """A soft bulge: inside the ellipse (cx, cy, rx, ry) everything is magnified by up to 1 + k from (cx, cy) (fuller cheeks)."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx, dy = xx - cx, yy - cy
    r = np.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    s = 1.0 + k * np.clip(1.0 - r, 0, 1) ** 1.6
    pm = layer.copy()
    pm[..., :3] *= pm[..., 3:4]
    w = cv2.remap(pm, cx + dx / s, cy + dy / s, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    w = np.clip(w, 0, 1)
    a = w[..., 3:4]
    w[..., :3] = np.where(a > 1e-4, w[..., :3] / np.maximum(a, 1e-4), 0)
    return w


hd, s, v = hsv_of(b.src)
op = b.op()
FACE = [(104, 76), (206, 70), (214, 100), (212, 150), (196, 180), (166, 194), (140, 190), (112, 160), (104, 120)]

# ---------- hair: a mid brown; the brows heavier ----------
skin0 = b.sel(hue=(10, 45), sat=(0.2, 1), val=(0.5, 1))
hair = b.sel(box=(70, 10, 270, 150)) & ~skin0 & ~b.poly(FACE)
hair |= b.sel(lum=(0, 0.45), box=(100, 50, 230, 90)) & ~skin0 & ~b.sel(lum=(0, 0.14))
hair = b.grow(hair, 1, 0.2) & region(S, 70, 10, 270, 150)
b.ramp(hair, HAIR, gain=1.2)
# the eyes: dark brown
eye = b.sel(hue=(180, 260), sat=(0.08, 1), val=(0.2, 0.95), polys=[[(108, 96), (140, 96), (140, 112), (108, 112)],
                                                                 [(150, 92), (186, 92), (186, 110), (150, 110)]])
b.ramp(eye, [(0.0, (14, 10, 8)), (0.3, (46, 32, 22)), (0.6, (86, 60, 40)), (0.85, (140, 108, 80)), (1.0, (230, 220, 206))])

# ---------- skin: warmer, older, ruddy ----------
hd, s, v = hsv_of(b.src)
skin = (hd <= 50) & (s >= 0.15) & (v >= 0.4) & region(S, 90, 40, 250, 230)
b.ramp(skin, SKIN_R, gain=1.0)
WR = (176, 108, 84)
b.over(strokes(S, [((116, 108), (124, 113), (134, 112), 1.3), ((148, 108), (160, 114), (174, 111), 1.4), ((151, 113), (161, 118), (172, 116), 1.1),
                   ((186, 96), (192, 100), (198, 99), 1.2), ((186, 101), (192, 105), (198, 105), 1.1),
                   ((124, 132), (120, 146), (124, 158), 1.5), ((180, 126), (190, 140), (192, 156), 1.7)], WR, alpha=0.55))
# older: heavier bags under the eyes, deep laugh lines running into jowls, a crease between the brows
b.over(strokes(S, [((112, 117), (121, 121), (131, 119), 1.6), ((150, 118), (162, 123), (176, 119), 1.7),
                   ((124, 132), (118, 148), (124, 162), 2.0), ((180, 126), (192, 142), (192, 160), 2.2),
                   ((126, 164), (128, 176), (136, 186), 1.6), ((190, 162), (188, 176), (180, 188), 1.8),
                   ((141, 86), (142, 92), (141, 98), 1.4), ((198, 108), (202, 116), (200, 126), 1.3)], WR, alpha=0.7))
b.over(blush(S, 186, 132, 15, 9, (226, 96, 80), 0.32, clip=skin))
b.over(blush(S, 116, 136, 9, 7, (226, 96, 80), 0.24, clip=skin))
b.over(blush(S, 132, 128, 6, 5, (220, 90, 76), 0.2, clip=skin))          # (the nose's tip)

BROW_F = [(108, 94), (114, 88), (126, 86), (134, 90), (128, 93), (116, 94), (110, 98)]
BROW_N = [(144, 92), (150, 84), (164, 80), (178, 80), (190, 84), (194, 90), (184, 89), (170, 88), (156, 90), (148, 95)]
BT = ((60, 40, 26), (94, 64, 42), (124, 88, 60), (40, 26, 18))
# greying at the temples: grey strands in the hair over the ears
for box, fl, sd in (((196, 80, 240, 150), (222, 170), 81), ((92, 76, 116, 150), (100, 170), 82)):
    tm = hair & region(S, *box)
    b.over(hair_strands(S, tm, fl, (176, 170, 160), (150, 144, 134), n=36, length=(5, 10), seed=sd, alpha=(0.7, 0.6)))
# heavy brown brows (painted after the skin's ramp)
for i, P in enumerate((BROW_F, BROW_N)):
    lay = cel(S, [P], BT[:3], lw=1.3, shade=2, light=1.0, ldir=LDIR)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), (P[0][0] + 30, P[0][1]), BT[2], BT[3], n=16, length=(4, 8), seed=71 + i))
    b.over(lay)


# ---------- the head: cut above the collar, then made fuller (the cheeks and jaw inflated) ----------
collar = (b.sel(sat=(0, 0.3), val=(0.45, 1)) | b.sel(hue=(190, 260), sat=(0.15, 1))) & region(S, 90, 150, 300, 260)
collar &= ~b.sel(hue=(10, 50), sat=(0.08, 1), val=(0.75, 1))                      # (the light on the jaw is skin)
collar = b.grow(collar, 2, 0.3) & region(S, 90, 150, 300, 260)
collar &= ~b.poly([(100, 60), (222, 60), (226, 146), (208, 176), (178, 194), (140, 196), (110, 172), (100, 120)])
HEAD = [(40, 0), (300, 0), (300, 160), (240, 160), (226, 190), (200, 214), (170, 222), (140, 214), (110, 190), (40, 160)]
head = take(b.img, b.poly(HEAD) & op & ~collar)
head = inflate(head, 162, 170, 92, 64, 0.26)
head = warp(head, affine(scale=(1.07, 1.0), src_pt=(160, 200), dst_pt=(160, 200)), S)      # (a broader, portly face)
head[..., 3] = np.where(head[..., 3] > 0.96, 1.0, np.where(head[..., 3] < 0.04, 0.0, head[..., 3]))
hm = head[..., 3] > 0.5

lay = np.zeros(S[:2] + (4,), np.float32)
# ---------- the grain sack resting on the near shoulder, behind the head: its tied top ----------
SACK = [(206, 214), (214, 170), (230, 140), (250, 122), (272, 116), (296, 124), (312, 146), (318, 176), (314, 214), (300, 244), (250, 250)]
sk = cel(S, [SACK], SACK_T[:3], lw=2.0, shade=10, light=3, ldir=LDIR)
skm = erode_cv(sk[..., 3] > 0.5, 2)
rng = np.random.RandomState(5)
weave = []
for y in range(118, 250, 4):
    weave.append(((214, y + rng.uniform(-1, 1)), (266, y + 3), (320, y + rng.uniform(-1, 1)), 0.8))
for x in range(214, 320, 5):
    weave.append(((x + rng.uniform(-1, 1), 120), (x + 3, 190), (x + rng.uniform(-1, 1), 252), 0.7))
sk = over(sk, strokes(S, weave, SACK_T[3], alpha=0.22, clip=skm, taper_to=1.0))
sk = over(sk, strokes(S, [((240, 150), (262, 180), (276, 230), 6.0), ((288, 140), (300, 170), (302, 210), 5.0)], SACK_T[0], alpha=0.6, clip=skm,
                      taper_to=0.1))
# the gathered neck of the sack, a cord round it and the tuft above
TUFT = strand_edge([(246, 104), (252, 86), (264, 76), (282, 74), (296, 82), (304, 100)], side=-1, seg=6, tip=6, out=3.0, seed=9)
sk = over(sk, cel(S, [TUFT + [(284, 112), (268, 112)]], SACK_T[:3], lw=1.6, shade=3, light=1.4, ldir=LDIR))
sk = over(sk, strokes(S, [((262, 104), (266, 92), (268, 82), 1.2), ((276, 104), (278, 90), (282, 80), 1.2), ((288, 104), (292, 94), (298, 86), 1.2)],
                      SACK_T[0], alpha=0.7))                                                        # (the gathered folds)
NECK_S = [(260, 128), (264, 108), (288, 108), (292, 128)]
sk = over(sk, cel(S, [NECK_S], SACK_T[:3], lw=1.8, shade=3, light=1.5, ldir=LDIR))
sk = over(sk, strokes(S, [((260, 114), (276, 120), (292, 114), 3.4)], (70, 48, 30), alpha=1.0))     # (the cord)
lay = over(lay, sk)

# ---------- the body (new): the burgundy coat, its thick brown fur collar, the grey shirt at the throat ----------
COAT = [(0, 350), (0, 270), (30, 244), (80, 226), (130, 218), (210, 212), (262, 222), (306, 240), (330, 256), (330, 350)]
ct = celf(S, [COAT], COAT_T[:3], lw=2.0, shade=14, light=3, ldir=LDIR)
cm = erode_cv(ct[..., 3] > 0.5, 2)
darken(ct, b.poly([(290, 230), (330, 230), (330, 350), (306, 350)]) & cm, np.asarray(COAT_T[0], np.float32) / np.asarray(COAT_T[1], np.float32))
ct = over(ct, strokes(S, [((60, 240), (48, 300), (50, 352), 1.5), ((284, 236), (292, 300), (296, 352), 1.5)], COAT_T[3], alpha=0.85, clip=cm,
                      taper_to=1.0))
ct = over(ct, strokes(S, [((170, 280), (172, 320), (174, 352), 2.0)], LINE, alpha=0.9, clip=cm, taper_to=1.0))         # (the front edge)
FOLDS = [((110, 352), (114, 320), (122, 290), 7.0), ((236, 352), (232, 322), (226, 292), 8.0), ((28, 352), (30, 320), (36, 290), 5.0)]
ct = over(ct, strokes(S, FOLDS, COAT_T[0], clip=cm, taper_to=0.05), k=0.7)
ct = over(ct, strokes(S, [(f[0], f[1], f[2], 1.2) for f in FOLDS], COAT_T[2], clip=cm, taper_to=0.1), k=0.5)
ct = over(ct, cel(S, [ellipse(162, 312, 3.6, 3.4), ellipse(164, 344, 3.6, 3.4)], ((80, 56, 20), (170, 128, 52), (230, 196, 120)), lw=1.0,
                  shade=1.2, light=0.8, ldir=LDIR))
lay = over(lay, ct)
# the neck and the grey shirt at the throat (mostly under the fur and the chin)
lay = over(lay, cel(S, [[(128, 170), (212, 150), (222, 214), (200, 240), (146, 244), (128, 220)]], SKIN_T, lw=1.6, shade=10, light=2, ldir=LDIR))
lay = over(lay, cel(S, [[(146, 218), (174, 228), (200, 218), (196, 250), (176, 258), (150, 250)]], SHIRT_T, lw=1.6, shade=4, light=2,
                    ldir=LDIR))
# the fur collar: a thick shawl of fur round the neck and over the shoulders, ragged with tufts at its edges
FUR_OUT = [(26, 262), (46, 240), (80, 224), (112, 210), (128, 206), (146, 228), (166, 236), (188, 234), (208, 222), (226, 204), (250, 206),
           (286, 222), (316, 246)]
FUR_LOW = [(320, 270), (290, 262), (260, 270), (226, 280), (200, 296), (176, 306), (150, 300), (124, 290), (96, 280), (64, 276), (30, 284)]
fur_top = strand_edge(FUR_OUT, side=-1, seg=8, tip=4, out=2.5, seed=31)
fur_low = strand_edge(FUR_LOW, side=-1, seg=8, tip=5, out=3.0, seed=32)
FUR = fur_top + fur_low
fr = celf(S, [FUR], FUR_T[:3], lw=1.8, shade=9, light=3, ldir=LDIR)
frm = erode_cv(fr[..., 3] > 0.5, 1)
fr = over(fr, hair_strands(S, frm, (176, 360), FUR_T[2], FUR_T[3], n=260, length=(5, 10), seed=33, alpha=(0.55, 0.55)))
lay = over(lay, fr)
# a brass clasp where the collar closes under the chin
lay = over(lay, cel(S, [ellipse(176, 290, 7, 6)], BRASS_T, lw=1.4, shade=2, light=1.4, ldir=LDIR))
darken(lay, shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5), (0.8, 0.68, 0.64))
b.img = over(lay, head)

# ---------- the double chin: a soft fold of skin under the jaw, lying on the fur (over the neck, under the head) ----------
CHIN2 = [(130, 196), (146, 208), (166, 214), (190, 210), (212, 196), (220, 206), (210, 222), (190, 232), (166, 236), (144, 230), (130, 214)]
c2 = cel(S, [CHIN2], SKIN_T, lw=1.8, shade=6, light=2, ldir=LDIR)
c2m = erode_cv(c2[..., 3] > 0.5, 2)
c2 = over(c2, strokes(S, [((140, 222), (166, 230), (200, 220), 1.4)], (196, 128, 100), alpha=0.6, clip=c2m, taper_to=0.4))
c2[..., 3] *= ~hm
b.img = over(b.img, c2)
darken(b.img, shift(hm, 1, 6) & ~hm & c2m, (0.84, 0.76, 0.76))                       # (the jaw's shadow on it)

# ---------- the flat cap (SF_Actor3_6's cap, brown felt) ----------
CAP = [(64, 113), (78, 96), (84, 84), (78, 62), (96, 38), (120, 26), (155, 18), (205, 26), (240, 40), (258, 62), (264, 100),
       (244, 122), (190, 124), (150, 114), (120, 102), (100, 108), (80, 114)]


def cap_mask(d):
    m = d.poly(CAP) & d.op() & ~d.sel(hue=(12, 40), sat=(0.2, 0.65), val=(0, 0.75))
    return erode_cv(dilate_cv(m, 1), 1)


d = Bust('SF_Actor3_6')
m = cap_mask(d)
d.ramp(m, CAP_R, gain=1.05)
M = affine(scale=(0.96, 0.72), rot=-3, src_pt=(160, 115), dst_pt=(158, 76))
cap = warp(take(d.img, m), M, S)
put_hat(b, cap, shadow=(150, 120, 120), shadow_k=0.5, sdx=2, sdy=8)
b.save(OUT)
print('ok', OUT)
