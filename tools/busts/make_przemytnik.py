# Roch Szkwal (the old smuggler of the harbour, about 60, the man from the prologue's boat): People2_1 repainted to match his map
# sheet ($Npc_Przemytnik) and the prologue picture (Prolog_Port): the spectacles gone (filled from the skin and the lids round
# them), a deeply tanned weathered face, heavy grey brows, a thick full grey-white beard with a moustache (painted), a hood of
# waxed brown canvas pulled up over the head (Actor3_5's hood, as for the poacher, recoloured brown with a waxed sheen), its
# shadow over the brow, a gold hoop earring at the ear in the hood's opening; below the head everything new: the long brown
# sailor's coat (a turned-down collar, frayed), a dark charcoal waistcoat with horn buttons over a dark shirt.
# Run: python tools/busts/make_przemytnik.py [out.png]
import sys
from kit import *
from make_kapral import celf

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Przemytnik_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('People2_1')
S = b.img.shape

# the map's colours ($Npc_Przemytnik front frame): hood/coat (115, 83, 56)/(104, 75, 53)/(79, 55, 37)/(65, 45, 31), beard
# (194, 188, 180)/(162, 162, 158)/(125, 125, 123), skin (224, 152, 110)/(208, 127, 91)/(153, 106, 80), vest (60, 60, 55)/(38, 33, 29)
HOOD_R = [(0.0, (22, 14, 8)), (0.08, (36, 24, 14)), (0.14, (52, 36, 22)), (0.2, (70, 48, 30)), (0.26, (84, 58, 37)), (0.4, (98, 70, 46)),
          (0.6, (110, 80, 53)), (0.8, (128, 94, 64)), (1.0, (162, 128, 92))]
BEARD_T = ((126, 124, 124), (176, 174, 170), (222, 220, 214), (92, 90, 92))
COAT_T = ((70, 48, 30), (106, 76, 50), (134, 100, 68))
VEST_T = ((30, 28, 26), (54, 52, 48), (78, 76, 70))
SHIRT_T = ((20, 18, 18), (36, 32, 30), (54, 48, 44))
SKIN_R = [(0.0, (40, 20, 12)), (0.25, (104, 58, 36)), (0.45, (150, 92, 62)), (0.6, (180, 112, 76)), (0.75, (204, 134, 94)),
          (0.88, (222, 154, 112)), (1.0, (236, 176, 136))]


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


# ---- the spectacles off: the rims round both lenses (outside the eyes), the bridge, the temple arm and the glints ----
def ell(cx, cy, rx, ry):
    return ((b.xx - cx) / rx) ** 2 + ((b.yy - cy) / ry) ** 2


hd, s, v = hsv_of(b.src)
LENS = [(99.0, 114.0, 15.5, 14.0), (147.5, 117.0, 18.0, 12.5)]
band = np.zeros(S[:2], bool)
for cx, cy, rx, ry in LENS:
    band |= (ell(cx, cy, rx + 3.5, ry + 3.5) <= 1) & (ell(cx, cy, rx - 4.0, ry - 4.0) >= 1)
band |= b.poly([(112, 104), (133, 104), (133, 115), (112, 115)], [(161, 100), (192, 100), (192, 112), (161, 112)])
EYES = b.poly([(97, 99), (118, 99), (118, 113), (97, 113)], [(141, 96), (167, 96), (167, 109), (141, 109)])
skin_c = (hd >= 15) & (hd <= 45) & (s >= 0.25) & (s <= 0.62) & (v >= 0.72)          # (the skin's own tones)
brown = (hd <= 35) & (s >= 0.4) & (v < 0.72)                                       # (the drawn lines: lids, wrinkles)
core = band & (((hd >= 180) & (hd <= 285) & (s >= 0.06)) | ((s < 0.2) & (v > 0.6))) & ~EYES & region(S, 84, 95, 200, 135)
rim = (core | (dilate(core, 2) & band & ~skin_c) | (band & ~skin_c & ~brown)) & ~EYES & region(S, 84, 95, 200, 135)
# the far lens stood out past the cheek: there the face's own outline is drawn again and the rest is cut away
OUTSIDE = b.poly([(80, 96), (89.5, 96), (89.0, 112), (89.5, 128), (80, 128)])
b.erase(rim & OUTSIDE)
line_col = b.poly([(88.0, 98), (90.6, 98), (90.2, 112), (90.6, 127), (88.0, 127)]) & rim
rim &= ~OUTSIDE & ~line_col
for a in (b.img, b.src):
    a[line_col, :3] = np.asarray(LINE, np.float32) / 255.0
nn_fill(rim, skin_c & ~rim & b.op() & region(S, 84, 90, 200, 140))
soften(rim, skin_c & region(S, 84, 90, 200, 140), 1.6)

# ---- skin: deeply tanned, weathered ----
hd, s, v = hsv_of(b.src)
skin = ((hd <= 45) | (hd >= 340)) & (s >= 0.1) & (v >= 0.35) & region(S, 70, 40, 250, 240)
b.ramp(skin, SKIN_R, gain=1.0)
# heavy dark-grey brows (low over the eyes: a hard look)
BROW_F = [(96, 96), (104, 90), (114, 88), (124, 90), (128, 95), (118, 95), (106, 96), (98, 100)]
BROW_N = [(140, 92), (152, 86), (166, 84), (180, 86), (190, 92), (186, 96), (172, 93), (158, 93), (146, 97)]
bt = ((40, 36, 36), (76, 72, 70), (122, 118, 114), (28, 26, 26))     # (dark grey, heavy: as on the map and in the prologue)
for poly, fl in ((BROW_F, (110, 104)), (BROW_N, (184, 96))):
    lay = cel(S, [poly], bt[:3], lw=1.3, shade=2.5, light=1.2, ldir=LDIR)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), fl, bt[2], bt[3], n=16, length=(4, 7), seed=len(poly)))
    b.over(lay)
# deeper lines: between the brows, the cheek folds
b.over(strokes(S, [((131, 92), (132, 98), (131, 103), 1.5), ((136, 90), (137, 96), (136, 101), 1.2)], (110, 60, 40), alpha=0.7))

# ---- the head that stays (the robe and its collar go; the hair goes under the hood) ----
HEAD = [(70, 20), (250, 20), (250, 160), (226, 176), (200, 192), (160, 200), (120, 196), (90, 170), (74, 120)]
head = take(b.img, b.poly(HEAD) & b.op() & ~b.sel(hue=(180, 260), sat=(0.1, 1), val=(0, 0.45), box=(120, 160, 260, 260)))

# ---- the body (new): the long brown coat, the dark waistcoat and shirt ----
lay = np.zeros(S[:2] + (4,), np.float32)
COAT = [(0, 268), (40, 236), (90, 214), (140, 204), (220, 196), (270, 206), (310, 222), (330, 232), (330, 350), (0, 350)]
coat = cel(S, [COAT], COAT_T, lw=2.0, shade=12, light=3, ldir=LDIR)
cm = erode_cv(coat[..., 3] > 0.5, 2)
coat = over(coat, strokes(S, [((30, 350), (40, 300), (56, 262), 7.0), ((300, 350), (296, 300), (290, 252), 8.0),
                              ((90, 300), (84, 270), (88, 246), 3.0)], COAT_T[0], clip=cm, taper_to=0.05))
coat = over(coat, strokes(S, [((24, 350), (34, 300), (50, 262), 1.4), ((294, 350), (290, 300), (284, 252), 1.4)], COAT_T[2], alpha=0.8,
                          clip=cm, taper_to=0.1))
lay = over(lay, coat)
# the opening of the coat: the dark shirt and the waistcoat in it
SHIRT = [(120, 200), (230, 194), (226, 350), (118, 350)]
lay = over(lay, cel(S, [SHIRT], SHIRT_T, lw=1.5, shade=8, light=2, ldir=LDIR))
VEST_L = [(116, 214), (160, 236), (170, 350), (108, 350)]
VEST_R = [(234, 206), (196, 238), (188, 350), (242, 350)]
vest = cel(S, [VEST_L, VEST_R], VEST_T, lw=1.8, shade=6, light=2.5, ldir=LDIR)
vm = erode_cv(vest[..., 3] > 0.5, 1)
vest = over(vest, cel(S, [ellipse(158, 268, 3.2, 3.0), ellipse(162, 300, 3.2, 3.0), ellipse(166, 332, 3.2, 3.0)],
                      ((60, 44, 30), (110, 84, 58), (160, 130, 96)), lw=0.9, shade=1.2, light=0.8, ldir=LDIR))
lay = over(lay, vest)
# the coat's lapels and turned-down collar over it
LAP_L = [(96, 214), (126, 206), (140, 224), (128, 262), (118, 350), (82, 350), (88, 280)]
LAP_R = [(220, 196), (262, 204), (258, 240), (246, 300), (250, 350), (232, 350), (230, 290), (226, 240)]
lap = cel(S, [LAP_L, LAP_R], COAT_T, lw=2.0, shade=6, light=3, ldir=LDIR)
lay = over(lay, lap)
# the hood's cape over the shoulders (the same waxed canvas), its hem frayed and torn by the storm
HEM = strand_edge([(330, 262), (300, 268), (262, 258), (226, 266), (188, 270), (150, 262), (112, 272), (72, 262), (36, 274), (0, 270)],
                  side=1, seg=11, tip=9, out=4.0, seed=8)
CAPE = [(0, 196), (40, 176), (80, 168), (110, 182), (140, 200), (180, 202), (214, 188), (246, 166), (286, 168), (330, 196)] + HEM
cape = celf(S, [CAPE], ((60, 42, 26), (96, 68, 44), (124, 92, 62)), lw=2.0, shade=10, light=3, ldir=LDIR)
pm = erode_cv(cape[..., 3] > 0.5, 2)
cape = over(cape, strokes(S, [((40, 270), (52, 232), (66, 196), 6.0), ((280, 262), (276, 226), (262, 190), 7.0), ((180, 266), (186, 240), (196, 214), 4.0)],
                          (60, 42, 26), alpha=0.75, clip=pm, taper_to=0.05))
cape = over(cape, strokes(S, [((34, 270), (46, 232), (60, 196), 1.5), ((274, 262), (270, 226), (256, 190), 1.5)], (150, 116, 80), alpha=0.8,
                          clip=pm, taper_to=0.1))
lay = over(lay, cape)
hm = head[..., 3] > 0.5
lay[..., :3] = np.where((shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5))[..., None],
                        lay[..., :3] * np.asarray((0.66, 0.6, 0.62), np.float32), lay[..., :3])
b.img = over(lay, head)

# ---- the full grey-white beard and moustache ----
OUTER = [(202, 112), (208, 140), (206, 170), (196, 200), (180, 228), (160, 248), (138, 254), (116, 244), (100, 222), (90, 196), (86, 170),
         (88, 140)]
INNER = [(92, 140), (98, 160), (110, 172), (124, 178), (142, 180), (160, 176), (172, 166), (180, 150), (186, 132), (194, 114)]
bd = beard2(S, OUTER, INNER, BEARD_T, flow=(140, 290), seed=5, n=170, tip=7, out=3.4, seg=9)
# the beard's near side and its underside in shade (the light comes from the upper left)
bm = bd[..., 3] > 0.5
far = np.clip((b.xx - 150) / 50.0, 0, 1) * 0.55 + np.clip((b.yy - 215) / 40.0, 0, 1) * 0.35
bd[..., :3] = bd[..., :3] * (1 - (far * bm)[..., None] * (1 - np.asarray((150, 148, 158), np.float32) / 255.0))
b.over(bd)
# the moustache: a thick drooping grey moustache, ragged at its lower edge, its ends running down into the beard
MTOP = [(98, 168), (104, 158), (114, 151), (126, 148), (140, 147), (154, 149), (168, 154), (178, 162), (184, 174)]
MLOW = strand_edge([(186, 186), (176, 180), (164, 172), (150, 168), (136, 168), (122, 170), (110, 178), (100, 188), (94, 192)], side=-1,
                   seg=6, tip=5, out=2.0, seed=12)
mt = ((132, 130, 132), (190, 188, 184), (232, 230, 224), (96, 94, 96))
ml = cel(S, [MTOP + MLOW], mt[:3], lw=1.1, shade=4, light=2, ldir=LDIR)
mm = ml[..., 3] > 0.5
ml = over(ml, hair_strands(S, erode_cv(mm, 1), (140, 200), mt[2], mt[3], n=60, length=(5, 10), seed=13))
b.over(ml)

# ---- the hood: Actor3_5's hood (shell and trim) recoloured to waxed brown canvas, moved over this head ----
HOOD_OPEN = [(196, 240), (64, 212), (66, 190), (68, 170), (73, 150), (77.5, 130), (81.7, 110), (85, 100), (90, 92), (100, 87), (120, 85),
             (130, 92), (140, 99), (150, 110), (160, 120), (170, 127.5), (180, 136), (190, 143), (200, 151.5), (207, 162), (209, 178),
             (207, 193), (203, 210), (198, 224), (196, 240)]
HOOD_OUT = [(30, 0), (300, 0), (300, 150), (246, 180), (240, 192), (226, 204), (212, 216), (198, 230), (76, 230), (76, 212), (30, 212)]


def hood_mask(d):     # (without the donor's scarf under the chin: the beard is there)
    return d.op() & d.poly(HOOD_OUT) & ~d.poly(HOOD_OPEN) & ~d.poly([(70, 196), (204, 196), (204, 250), (70, 250)])


M = affine(scale=(1.08, 0.92), rot=10.0, src_pt=(135.5, 129.75), dst_pt=(144, 112))
hood = hat_from('Actor3_5', hood_mask, M, S, HOOD_R)
ends = (poly_mask((S[1], S[0]), tr_pts(M, [(188, 202), (250, 172), (310, 172), (310, 245), (188, 245)])) > 0.5) | \
    (poly_mask((S[1], S[0]), tr_pts(M, [(25, 200), (80, 200), (80, 245), (25, 245)])) > 0.5)
hem = (hood[..., 3] > 0.05) & ~erode_cv(hood[..., 3] > 0.5, 2) & ends
hood[..., :3] = np.where(hem[..., None], np.asarray(LINE, np.float32) / 255.0, hood[..., :3])
ha = hood[..., 3] > 0.5
openm = (poly_mask((S[1], S[0]), tr_pts(M, HOOD_OPEN)) > 0.5) & ~ha
# waxed canvas: a few long creases with a dull sheen along them
hm2 = erode_cv(ha, 3)
hood = over(hood, strokes(S, [((70, 150), (60, 100), (90, 40), 5.0), ((250, 120), (240, 70), (200, 20), 6.0)], (60, 40, 24), alpha=0.6,
                          clip=hm2, taper_to=0.1))
hood = over(hood, strokes(S, [((76, 150), (66, 100), (96, 40), 1.6), ((256, 118), (246, 70), (206, 22), 1.8), ((150, 6), (176, 10), (210, 22), 1.6)],
                          (176, 140, 100), alpha=0.7, clip=hm2, taper_to=0.1))
# what of the head stands out of the hood goes; the hair beside the far cheek inside the opening goes too (the lining shows)
b.erase(region(S, 0, 0, 330, 160) & ~ha & ~openm & b.op())
b.erase(openm & b.poly([(60, 40), (89.5, 40), (89.5, 160), (60, 160)]))
# the lining in the opening, behind the face, and the hood's shadow over the brow
LINING = ((22, 16, 12), (36, 26, 18), (50, 36, 26))
lin = cel(S, [tr_pts(M, HOOD_OPEN)], LINING, outline=False, shade=12, light=0, ldir=(0.55, -0.83))
lin[..., 3] *= openm
b.img = over(lin, b.img)
cast_shadow(b, hood[..., 3], dx=3, dy=12, col=(96, 70, 70), k=0.6)
b.over(hood)
# the gold hoop earring hanging from the ear under the hood's rim
ear = cel(S, [ellipse(208, 160, 6.5, 9.0)], ((150, 98, 24), (226, 176, 60), (255, 236, 150)), lw=1.1, shade=2, light=1.6, ldir=LDIR,
          holes=[ellipse(208, 160, 3.4, 5.6)])
b.over(ear)
b.save(OUT)
print('ok', OUT)
