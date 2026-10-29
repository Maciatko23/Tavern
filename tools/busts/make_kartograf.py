# Teofil Cyrkiel (the cartographer from the ferry, stocky, about 50, a pedant): People3_5 (the stern grey-haired face with the
# chin beard) repainted to match his map sheet ($Npc_Kartograf): clean-shaven - the chin beard and the sideburns gone (filled from
# the skin round them) and a broader, heavier jaw and chin drawn; BALD - the hair on top gone and a scalp painted in its place,
# grey hair left only round the sides over the ears; thick bushy grey brows drawn low in a frown, a warmer pinkish skin, a few
# forehead lines; below the head everything new: a thick neck, a cream linen shirt with an open collar and its sleeves on the
# shoulders, a brown buttoned waistcoat over it, and the top of a long leather map tube with a capped end showing behind the near
# shoulder (slung across his back, as on the map).
# 0 PixelLab generations. Run: python tools/busts/make_kartograf.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kartograf_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('People3_5')
S = b.img.shape

# the map's colours ($Npc_Kartograf front frame): skin (242, 189, 153)/(238, 181, 146)/(224, 169, 136)/(207, 153, 122)/(176, 127, 98),
# side hair and brows (157, 148, 134)/(112, 113, 113)/(98, 93, 89), waistcoat (99, 63, 40)/(70, 51, 33)/(63, 37, 24)/(46, 33, 27), shirt
# (232, 219, 182)/(206, 193, 159)/(179, 154, 120), map tube (74, 57, 43)/(54, 40, 30)/(89, 76, 66)
SKIN_R = [(0.0, (40, 20, 14)), (0.2, (110, 64, 46)), (0.4, (176, 127, 98)), (0.55, (207, 153, 122)), (0.7, (226, 170, 136)),
          (0.82, (240, 186, 150)), (0.92, (246, 200, 166)), (1.0, (252, 218, 190))]
SKIN_T = ((214, 158, 124), (240, 186, 150), (250, 210, 178), (196, 140, 108))
GREY = [(0.0, (30, 28, 28)), (0.15, (64, 62, 60)), (0.3, (98, 93, 89)), (0.45, (124, 120, 114)), (0.6, (150, 144, 134)), (0.8, (176, 172, 164)),
        (1.0, (204, 200, 192))]
HAIR_T = ((98, 93, 89), (140, 134, 126), (176, 172, 164), (74, 70, 68))
VEST_T = ((63, 37, 24), (99, 63, 40), (126, 86, 56), (46, 33, 27))
SHIRT_T = ((179, 154, 120), (232, 219, 182), (244, 236, 210), (206, 193, 159))
TUBE_T = ((46, 33, 27), (74, 57, 43), (104, 82, 62))
CAP_T = ((54, 40, 30), (89, 76, 66), (124, 108, 94))
BRASS_T = ((110, 76, 26), (184, 140, 60), (236, 204, 128))


def nn_fill(R, ok):
    """Every pixel of R (in b.img and b.src) takes the colour of the nearest pixel of ok."""
    u = (~ok).astype(np.uint8)
    _, lab = cv2.distanceTransformWithLabels(u, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    zy, zx = np.nonzero(u == 0)
    lut = np.zeros(lab.max() + 1, np.int64)
    lut[lab[zy, zx]] = zy * S[1] + zx
    idx = lut[lab][R]
    for a in (b.img, b.src):
        flat = a.reshape(-1, 4)
        a[R] = flat[idx]


def soften(R, w, sigma=2.0):
    wf = (w | R).astype(np.float32)
    for a in (b.img, b.src):
        num = cv2.GaussianBlur(a[..., :3] * wf[..., None], (0, 0), sigma)
        den = cv2.GaussianBlur(wf, (0, 0), sigma)[..., None]
        a[..., :3] = np.where(R[..., None], num / np.maximum(den, 1e-4), a[..., :3])


def path_line(pts, w=2.0, col=LINE, alpha=1.0, clip=None):
    return strokes(S, [(pts[i], ((np.asarray(pts[i]) + np.asarray(pts[i + 1])) / 2).tolist(), pts[i + 1], w) for i in range(len(pts) - 1)],
                   col, alpha=alpha, taper_to=1.0, clip=clip)


hd, s, v = hsv_of(b.src)
op = b.op()

# ---------- clean-shaven: the chin beard and the sideburns filled from the skin, a broader jaw ----------
# the new jaw line (from the far cheek round the chin up to the ear) and the face inside it
JAW = [(98, 128), (100, 148), (106, 166), (116, 182), (130, 194), (148, 200), (166, 199), (182, 192), (196, 180), (206, 164), (212, 148)]
FACE_IN = JAW + [(212, 100), (100, 100)]
skin_c = (hd >= 15) & (hd <= 45) & (s >= 0.22) & (v >= 0.6)
beard = b.sel(sat=(0, 0.25), box=(94, 120, 216, 214)) | b.sel(hue=(200, 300), box=(94, 120, 216, 214))
beard = b.grow(beard, 2, 0.3) & region(S, 94, 120, 216, 214)
MOUTH = b.poly([(128, 154), (174, 152), (174, 164), (128, 166)])
SIDEBURN = b.sel(sat=(0, 0.3), box=(86, 112, 112, 160)) | b.sel(hue=(200, 300), box=(86, 112, 112, 160))
fill = (((beard | b.grow(SIDEBURN, 2, 0.3)) & ~MOUTH) | (b.poly(FACE_IN) & ~op)) & b.poly(JAW + [(212, 112), (96, 112)])
nn_fill(fill, skin_c & ~beard & ~SIDEBURN & op & region(S, 94, 80, 216, 214))
soften(fill, skin_c & op & region(S, 94, 80, 216, 214), 2.2)
# the mouth's corners (the beard ran into them): the line drawn again, a firm pursed mouth (a pedant)
b.over(strokes(S, [((131, 159), (150, 157), (170, 160), 1.7)], LINE, alpha=0.95, taper_to=0.5))
b.over(strokes(S, [((140, 165), (150, 167), (162, 165), 1.4)], (186, 120, 92), alpha=0.6))       # (the lower lip's shade)

# ---------- skin: warmer, pinkish ----------
hd, s, v = hsv_of(b.src)
skin = (hd <= 50) & (s >= 0.12) & (v >= 0.35) & region(S, 80, 30, 240, 214)
b.ramp(skin, SKIN_R, gain=1.0)
# the chin's shape: a soft shade under the lower lip, the jaw's turn on the near side, the line of the jaw
b.over(strokes(S, [((142, 182), (152, 186), (164, 182), 1.6), ((186, 168), (196, 160), (202, 146), 2.6)], (204, 140, 108), alpha=0.6))
b.over(cel(S, [[(118, 176), (130, 188), (148, 194), (166, 193), (182, 186), (196, 174), (204, 160), (210, 150), (212, 162), (206, 172),
                (196, 184), (182, 194), (166, 200), (148, 201), (130, 195), (116, 184)]], ((214, 152, 118),) * 3, outline=False, shade=0,
           light=0), k=0.8)

b.over(path_line(JAW, 2.2))

# ---------- the head that stays: above the new jaw (the old collar and what was under the beard go) ----------
HEAD = [(60, 0), (270, 0), (270, 150), (212, 148)] + JAW[::-1] + [(90, 128), (60, 128)]
head_keep = b.poly(HEAD) & op
head_keep |= b.poly(JAW + [(212, 120), (98, 120)])          # (the filled chin: opaque)
b.img[..., 3] = np.where(b.poly(JAW + [(212, 120), (98, 120)]), 1.0, b.img[..., 3])

# ---------- BALD: the scalp painted over the hair on top; grey hair left at the sides over the ears ----------
CX, CY, RX, RY = 160, 92, 69, 84
ARC = ellipse(CX, CY, RX, RY, 0, 60, np.pi * 1.06, np.pi * 1.94)
LOWER = [(225, 66), (216, 62), (204, 56), (186, 52), (164, 50), (142, 52), (124, 56), (110, 62), (100, 70)]
DOME = ARC + LOWER
dome = b.poly(DOME)
SIDE_F = b.poly([(84, 60), (112, 60), (112, 116), (84, 116)])           # (the far side's hair: kept)
SIDE_N = b.poly([(200, 50), (250, 50), (250, 160), (200, 160)])         # (the near side's hair: kept)
old_hair = op & region(S, 60, 0, 270, 70) & ~b.sel(hue=(0, 50), sat=(0.15, 1), val=(0.55, 1)) & ~dome & ~SIDE_F & ~SIDE_N
b.erase(old_hair)
rim = b.sel(hue=(180, 300), box=(100, 40, 226, 76)) & ~dome & ~SIDE_F & ~SIDE_N          # (the old hair's blue rim light)
nn_fill(rim, b.sel(hue=(10, 50), sat=(0.15, 1), val=(0.6, 1), box=(100, 40, 226, 90)) & ~rim)
hair = (b.sel(sat=(0, 0.3), val=(0.15, 1)) | b.sel(hue=(200, 300), sat=(0, 1))) & (SIDE_F | SIDE_N) & ~dome
hair = b.grow(hair, 1, 0.25) & (SIDE_F | SIDE_N)
b.ramp(hair, GREY, gain=1.0)
# (painted as the whole ellipse and then cut to the dome: no shade band along the cut above the forehead)
scalp = cel(S, [ellipse(CX, CY, RX, RY, 0, 60)], SKIN_T, outline=False, shade=10, light=6, shade2=4, ldir=(0.5, 0.86))
scalp[..., 3] *= soft_poly(S, [DOME])
b.over(scalp)
# the shine of the scalp and its softer rim
b.over(cel(S, [ellipse(136, 34, 20, 10, -0.5, 30)], ((255, 232, 206),) * 3, outline=False, shade=0, light=0))
b.over(strokes(S, [((112, 56), (120, 40), (136, 28), 3.0)], (255, 236, 214), alpha=0.85, taper_to=0.2))
b.over(path_line(ARC, 2.2))
# forehead lines (the frown of a pedant)
b.over(strokes(S, [((116, 70), (142, 64), (170, 66), 1.3), ((122, 60), (146, 55), (172, 57), 1.1), ((150, 76), (170, 74), (190, 78), 1.1)],
               (200, 130, 98), alpha=0.55))
b.over(strokes(S, [((140, 92), (138, 84), (141, 76), 1.5), ((147, 91), (146, 84), (149, 78), 1.2)], (180, 110, 80), alpha=0.7))
# grey hair round the sides: short, tufty, over the ear's top and behind it, and at the far temple
SIDE_N_P = [(200, 60), (212, 56), (226, 60), (236, 72), (240, 90), (238, 112), (232, 134), (224, 148), (220, 134), (222, 112), (216, 100),
            (210, 96), (204, 84)]
SIDE_F_P = [(102, 64), (92, 78), (88, 98), (90, 118), (96, 132), (100, 120), (102, 104), (104, 90), (110, 76)]
for P, seed, fl in ((SIDE_N_P, 51, (232, 150)), (SIDE_F_P, 52, (94, 140))):
    edge = strand_edge(P[:7], side=1 if P is SIDE_N_P else -1, seg=7, tip=4, out=2.5, seed=seed) + P[7:]
    sl = cel(S, [edge], HAIR_T[:3], lw=1.5, shade=3, light=1.4, ldir=LDIR)
    sl = over(sl, hair_strands(S, erode_cv(sl[..., 3] > 0.5, 1), fl, HAIR_T[2], HAIR_T[3], n=40, length=(4, 8), seed=seed + 10))
    b.over(sl)

# ---------- dark eyes (the green iris a dark grey-brown, as on the map) ----------
iris = b.sel(hue=(60, 180), sat=(0.15, 1), box=(100, 96, 200, 116))
b.ramp(iris, [(0.0, (14, 10, 8)), (0.25, (40, 30, 24)), (0.5, (72, 56, 44)), (0.8, (120, 100, 84)), (1.0, (200, 190, 180))])

# ---------- thick bushy grey brows, low over the eyes (the old dark ones grey under them) ----------
ob = b.sel(lum=(0, 0.5), polys=[[(100, 84), (140, 84), (140, 100), (100, 100)], [(146, 80), (204, 80), (204, 98), (146, 98)]], src=False)
ob &= ~b.sel(hue=(60, 180), sat=(0.2, 1))
b.ramp(ob, [(0.0, (60, 56, 54)), (0.25, (98, 93, 89)), (0.5, (140, 134, 126))])
BROW_F = [(100, 95), (105, 86), (118, 82), (132, 85), (140, 94), (130, 97), (116, 97), (104, 101)]
BROW_N = [(146, 97), (152, 86), (166, 80), (182, 79), (196, 82), (203, 91), (192, 94), (178, 92), (164, 94), (152, 100)]
BT = ((98, 93, 89), (146, 140, 132), (186, 182, 174), (70, 66, 64))
for i, P in enumerate((BROW_F, BROW_N)):
    lay = cel(S, [P], BT[:3], lw=1.4, shade=2.5, light=1.2, ldir=LDIR)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), (P[0][0] - 8, P[0][1] + 3) if i else (P[4][0] + 8, P[4][1] + 3),
                                 BT[2], BT[3], n=22, length=(5, 9), seed=61 + i, alpha=(0.6, 0.6)))
    b.over(lay)

head = take(b.img, head_keep)
# a stockier head: the whole head a tenth wider (about the chin's middle)
head = warp(head, affine(scale=(1.1, 1.0), src_pt=(156, 200), dst_pt=(156, 200)), S)
hm = head[..., 3] > 0.5

# ---------- the body (new) ----------
lay = np.zeros(S[:2] + (4,), np.float32)
# the map tube slung across the back: its capped top behind the near shoulder (behind everything)
TUBE = taper(bez((214, 262), (258, 190), (300, 112), 20), 34, 34)
tb = cel(S, [TUBE], TUBE_T, lw=2.0, shade=8, light=3, ldir=LDIR)
tbm = erode_cv(tb[..., 3] > 0.5, 2)
for t in (0.32, 0.56):
    p = bez((214, 262), (258, 190), (300, 112), 40)[int(t * 39)]
    tb = over(tb, strokes(S, [((p[0] - 14, p[1] - 8), (p[0], p[1] + 1), (p[0] + 14, p[1] + 10), 1.4)], TUBE_T[0], alpha=0.8, clip=tbm))
CAP = taper(bez((290, 130), (299, 114), (308, 98), 10), 37, 37)
tb = over(tb, cel(S, [CAP], CAP_T, lw=2.0, shade=5, light=2.5, ldir=LDIR))
tb = over(tb, cel(S, [ellipse(308, 98, 18.5, 6.5, 0.52)], CAP_T, lw=1.8, shade=3, light=2, ldir=LDIR))
tb = over(tb, strokes(S, [((278, 116), (292, 124), (306, 132), 3.0)], BRASS_T[1], alpha=0.9, clip=tbm))   # (a brass band under the cap)
lay = over(lay, tb)
# the shirt: broad shoulders (the sleeves rolled up below the frame)
SHIRT = [(0, 350), (0, 262), (34, 236), (84, 220), (124, 212), (210, 204), (256, 214), (300, 232), (330, 246), (330, 350)]
sh = celf(S, [SHIRT], SHIRT_T[:3], lw=2.0, shade=12, light=3, ldir=LDIR)
shm = erode_cv(sh[..., 3] > 0.5, 2)
darken(sh, b.poly([(286, 220), (330, 220), (330, 350), (300, 350)]) & shm, np.asarray(SHIRT_T[0], np.float32) / np.asarray(SHIRT_T[1], np.float32))
WED = [taper(bez((30, 262), (22, 290), (10, 316), 14), 2, 0.3, w_mid=7), taper(bez((300, 262), (312, 288), (326, 306), 14), 2, 0.3, w_mid=8),
       taper(bez((40, 300), (30, 320), (20, 346), 14), 2, 0.3, w_mid=6)]
sh = over(sh, cel(S, WED, (SHIRT_T[3],) * 3, outline=False, shade=0, light=0, clip=shm))
lay = over(lay, sh)
# the thick neck down into the open V of the shirt, the collar's points on either side
NECKV = [(122, 186), (210, 176), (216, 214), (190, 266), (164, 266), (128, 216)]
lay = over(lay, cel(S, [NECKV], SKIN_T[:3], lw=1.8, shade=12, light=2, ldir=LDIR))
COL_F = [(116, 206), (132, 194), (150, 232), (164, 266), (140, 252), (116, 226)]
COL_N = [(210, 192), (226, 186), (234, 210), (214, 236), (188, 266), (200, 224)]
lay = over(lay, cel(S, [COL_F, COL_N], SHIRT_T[:3], lw=1.8, shade=4, light=2, ldir=LDIR))
# the waistcoat: two front panels closed below a V, armholes, buttons, a pocket welt
VEST_F = [(40, 350), (44, 300), (54, 262), (74, 236), (110, 222), (140, 240), (168, 284), (170, 352)]
VEST_N = [(280, 350), (276, 300), (266, 262), (252, 230), (226, 214), (206, 238), (172, 284), (168, 352)]
vt = celf(S, [VEST_F, VEST_N], VEST_T[:3], lw=2.0, shade=10, light=3, ldir=LDIR)
vm = erode_cv(vt[..., 3] > 0.5, 2)
darken(vt, b.poly([(236, 220), (330, 220), (330, 350), (256, 350)]) & vm, np.asarray(VEST_T[0], np.float32) / np.asarray(VEST_T[1], np.float32))
vt = over(vt, strokes(S, [((170, 286), (170, 320), (170, 352), 2.0)], LINE, alpha=0.9, clip=vm, taper_to=1.0))
vt = over(vt, strokes(S, [((84, 352), (90, 320), (98, 292), 6.0), ((236, 352), (232, 322), (226, 296), 7.0)], VEST_T[0], clip=vm,
                      taper_to=0.05), k=0.7)
vt = over(vt, strokes(S, [((206, 312), (224, 310), (242, 312), 2.0)], VEST_T[3], alpha=0.9, clip=vm, taper_to=1.0))   # (a pocket)
vt = over(vt, cel(S, [ellipse(160, 300, 3.4, 3.2), ellipse(162, 334, 3.4, 3.2)], ((40, 28, 18), (88, 64, 42), (140, 108, 74)), lw=1.0, shade=1.2,
                  light=0.8, ldir=LDIR))
lay = over(lay, vt)
darken(lay, shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5), (0.7, 0.66, 0.68))
b.img = over(lay, head)
b.save(OUT)
print('ok', OUT)
