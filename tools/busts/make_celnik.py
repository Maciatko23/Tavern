# Celnik (the Lord's customs officer at the harbour, about 55, thin, stiff): SF_People1_5 repainted to match his map sheet
# ($Npc_Celnik): the moustache gone (the upper lip filled from the skin round it, a thin pressed mouth drawn), the hair short and
# grey, grey side whiskers down to the jaw (painted), an older face (forehead lines, crow's feet), a small round black felt cap
# without a brim (painted); below the head everything new: a long red official's coat in Lord Zaleski's colours (the guards' red,
# make_kapral.RED_T) with a black stand collar, black trim down the front and a row of brass buttons, the Lord's black rearing
# horse on the chest (make_kapral.rearing_horse), and the thick leather-bound ledger clamped under his near arm (at the bottom).
# Run: python tools/busts/make_celnik.py [out.png]
import sys
from kit import *
from make_kapral import RED_T, rearing_horse, celf

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Celnik_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('SF_People1_5')
S = b.img.shape

# the map's colours ($Npc_Celnik front frame): coat (182, 32, 27)/(127, 22, 19), trim and cap (29, 29, 28)/(53, 52, 52),
# hair and whiskers (180, 166, 154)/(117, 114, 112), skin (238, 187, 155)/(204, 149, 119), book (115, 71, 47)/(79, 50, 30)
BLACK_T = ((14, 14, 16), (34, 34, 36), (62, 62, 66))
CAP_T = ((16, 16, 18), (38, 38, 40), (70, 70, 74))
GREY_T = ((120, 116, 114), (168, 162, 156), (206, 200, 194), (92, 88, 88))
BOOK_T = ((70, 42, 24), (112, 70, 44), (146, 98, 64))
BRASS_T = ((110, 76, 26), (186, 142, 62), (236, 206, 128))


def nn_fill(R, ok):
    u = (~ok).astype(np.uint8)
    _, lab = cv2.distanceTransformWithLabels(u, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    zy, zx = np.nonzero(u == 0)
    lut = np.zeros(lab.max() + 1, np.int64)
    lut[lab[zy, zx]] = zy * S[1] + zx
    idx = lut[lab][R]
    for a in (b.img, b.src):
        flat = a.reshape(-1, 4)
        a[R] = flat[idx]


def soften(R, w, sigma=2.5):
    wf = (w | R).astype(np.float32)
    for a in (b.img, b.src):
        num = cv2.GaussianBlur(a[..., :3] * wf[..., None], (0, 0), sigma)
        den = cv2.GaussianBlur(wf, (0, 0), sigma)[..., None]
        a[..., :3] = np.where(R[..., None], num / np.maximum(den, 1e-4), a[..., :3])


# ---- the moustache off: filled from the skin of the upper lip and the chin, then softened ----
hd, s, v = hsv_of(b.src)
MZONE = b.poly([(114, 137), (172, 136), (172, 164), (114, 166)])
skin_c = (hd >= 15) & (hd <= 45) & (s >= 0.18) & (v >= 0.6)
EDGE = b.poly([(80, 120), (102, 126), (105, 142), (109, 150), (116, 158), (121, 163), (125, 170), (80, 176)])   # (the far cheek's outline)
mous = MZONE & ~skin_c & b.op() & ~EDGE
mous = dilate(mous, 1) & MZONE & ~(skin_c & (v > 0.8)) & ~EDGE
nn_fill(mous, skin_c & ~mous & (v < 0.97) & b.poly([(110, 128), (176, 128), (176, 178), (110, 178)]))
soften(mous, skin_c & ~mous & (v < 0.97) & b.poly([(108, 126), (178, 126), (178, 180), (108, 180)]), 2.0)
# the thin pressed mouth (turned a little down at the corners), the shade of the lower lip, the groove over the lip
b.over(strokes(S, [((126, 159), (144, 155), (164, 156), 1.9), ((164, 156), (168, 158), (170, 161), 1.4)], (96, 52, 40), alpha=0.95, taper_to=0.5))
b.over(strokes(S, [((136, 165), (144, 166), (152, 165), 2.2)], (196, 128, 100), alpha=0.55, taper_to=0.6))
b.over(strokes(S, [((141, 141), (141, 146), (142, 150), 1.4)], (206, 146, 112), alpha=0.6, taper_to=0.5))

# ---- older: lines on the forehead, crow's feet, a deeper fold from the nose ----
hd, s, v = hsv_of(b.src)
skin = (hd >= 10) & (hd <= 45) & (s >= 0.12) & (v >= 0.5) & region(S, 90, 40, 230, 220)
WR = (168, 112, 84)
b.over(strokes(S, [((122, 72), (146, 68), (172, 72), 1.2), ((126, 80), (148, 77), (168, 80), 1.0), ((176, 104), (182, 106), (186, 104), 1.0),
                   ((177, 110), (183, 113), (188, 113), 1.0), ((112, 116), (116, 119), (121, 120), 0.9)], WR, alpha=0.55, clip=skin))
b.over(strokes(S, [((160, 140), (170, 152), (172, 166), 1.4)], WR, alpha=0.45, clip=skin))

# ---- hair: short and grey; grey whiskers down the cheeks to the jaw ----
hair = b.sel(sat=(0, 0.3), val=(0, 0.55), box=(60, 0, 260, 160)) & ~b.poly([(100, 85), (180, 85), (180, 130), (100, 130)])
hair = b.grow(hair, 1, 0.22) & region(S, 60, 0, 260, 160)
hair |= b.sel(hue=(185, 260), sat=(0.15, 1), box=(196, 60, 250, 150))     # (the blue rim light in the hair behind the ear)
# short hair: the loose locks beside the far temple go
b.erase(b.op() & b.poly([(40, 40), (90, 40), (93, 70), (91, 100), (40, 110)]))
b.ramp(hair, [(0.0, (40, 38, 38)), (0.1, (84, 80, 80)), (0.2, (124, 120, 118)), (0.32, (160, 154, 150)), (0.5, (192, 186, 180)),
              (0.7, (218, 214, 208))], gain=1.25, bias=0.04)
WH_N = strand_edge([(197, 140), (193, 152), (187, 162)], side=1, seg=4, tip=4, out=1.6, seed=4)
WHISK_N = [(190, 98), (199, 102), (202, 120), (199, 134)] + WH_N + [(183, 158), (186, 140), (188, 118)]
WHISK_F = [(90, 88), (96, 89), (99, 103), (104, 115), (111, 124), (116, 131), (112, 133), (103, 124), (96, 114), (91, 101)]
for poly, fl, sd in ((WHISK_N, (190, 200), 6), (WHISK_F, (99, 190), 7)):
    lay = cel(S, [poly], GREY_T[:3], lw=0.9, line=(92, 86, 84), shade=3, light=1.5, ldir=LDIR, clip=b.op())
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), fl, GREY_T[2], GREY_T[3], n=44, length=(4, 8), seed=sd, alpha=(0.7, 0.6)))
    b.over(lay)

# ---- the head that stays (the shirt and its collar go) ----
HEAD = [(60, 0), (270, 0), (270, 150), (226, 160), (214, 180), (196, 200), (170, 206), (140, 200), (112, 180), (88, 140), (60, 100)]
keep = b.poly(HEAD) & b.op() & ~b.sel(hue=(80, 170), sat=(0.15, 1))
keep &= ~(b.sel(lum=(0, 0.35), src=False) & b.poly([(200, 146), (270, 146), (270, 210), (200, 210)]))   # (the collar's line by the nape)
head = take(b.img, keep)

# ---- the body (new): the red coat, its black collar and trim, the buttons, the horse, the ledger under the near arm ----
lay = np.zeros(S[:2] + (4,), np.float32)
NECK = [(140, 178), (196, 158), (204, 210), (150, 222)]
lay = over(lay, cel(S, [NECK], ((196, 140, 110), (230, 178, 146), (244, 202, 176)), lw=1.6, shade=9, light=2, ldir=LDIR))
COAT = [(0, 262), (40, 238), (90, 222), (132, 212), (220, 202), (262, 210), (300, 224), (330, 234), (330, 350), (0, 350)]
coat = celf(S, [COAT], RED_T, lw=2.0, shade=12, light=3, ldir=LDIR)
cm = erode_cv(coat[..., 3] > 0.5, 2)
coat = over(coat, strokes(S, [((44, 350), (52, 304), (66, 266), 7.0), ((120, 350), (116, 310), (120, 270), 4.0)], RED_T[0], clip=cm, taper_to=0.05))
coat = over(coat, strokes(S, [((38, 350), (46, 304), (60, 266), 1.4), ((114, 350), (110, 310), (114, 270), 1.2)], RED_T[2], alpha=0.85,
                          clip=cm, taper_to=0.1))
coat = over(coat, strokes(S, [((10, 268), (44, 246), (96, 236), 1.3), ((246, 214), (290, 232), (330, 244), 1.3)], RED_T[0], alpha=0.9, clip=cm,
                          taper_to=1.0))                                                       # (the shoulder seams)
lay = over(lay, coat)
# the black trim down the front (where the coat closes), the brass buttons beside it
TRIM = taper(bez((172, 222), (170, 290), (166, 352), 30), 9, 10)
lay = over(lay, cel(S, [TRIM], BLACK_T, lw=1.4, shade=3, light=1.4, ldir=LDIR))
for y in (248, 278, 308, 338):
    x = 182 - (y - 230) * 0.04
    lay = over(lay, cel(S, [ellipse(x, y, 4.0, 3.6)], BRASS_T, lw=1.0, shade=1.5, light=1.0, ldir=LDIR))
# the Lord's black horse on the near breast
lay = over(lay, rearing_horse(S, 194, 226, 0.42))
# the stand collar, black, round the neck
COLLAR = [(134, 196), (160, 206), (190, 202), (214, 190), (222, 214), (204, 228), (172, 234), (144, 230), (128, 218)]
lay = over(lay, cel(S, [COLLAR], BLACK_T, lw=1.8, shade=5, light=2, ldir=LDIR))
# the ledger: a thick book bound in brown leather, its pages' edge on top, brass corners, clamped under the near arm
# (the book: its top edge - the thick block of pages between the covers - seen from a little above, the front cover below it)
TOPB = [(196, 300), (226, 284), (312, 276), (292, 294)]
FRONT = [(196, 300), (292, 294), (296, 350), (200, 350)]
bk = celf(S, [FRONT], BOOK_T, lw=2.0, shade=7, light=2.5, ldir=LDIR)
bkm = erode_cv(bk[..., 3] > 0.5, 2)
bk = over(bk, strokes(S, [((204, 322), (248, 319), (292, 316), 2.4), ((205, 342), (249, 339), (293, 336), 2.4)], BOOK_T[0], alpha=0.85,
                      clip=bkm, taper_to=1.0))                                                 # (tooled lines on the binding)
bk = over(bk, cel(S, [TOPB], ((70, 42, 24), (112, 70, 44), (146, 98, 64)), lw=2.0, shade=2, light=1.5, ldir=LDIR))
PAGES = [(204, 298), (228, 287), (300, 280), (284, 293)]
pg = cel(S, [PAGES], ((176, 160, 128), (222, 208, 176), (242, 234, 212)), lw=1.2, shade=2, light=1, ldir=LDIR)
pg = over(pg, strokes(S, [((212, 295), (250, 289), (290, 285), 0.7), ((218, 292), (256, 286), (294, 282), 0.7)], (160, 142, 110), alpha=0.8,
                      clip=erode_cv(pg[..., 3] > 0.5, 1), taper_to=1.0))
bk = over(bk, pg)
bk = over(bk, cel(S, [[(196, 300), (210, 292), (212, 306), (198, 314)]], BRASS_T, lw=1.0,
                  shade=1.5, light=1.0, ldir=LDIR))                                            # (brass corners)
lay = over(lay, bk)
# the near arm over the book's back half (it clamps the book to his side)
SLEEVE = [(264, 216), (300, 226), (330, 236), (330, 350), (262, 350), (256, 300), (252, 256)]
sl = celf(S, [SLEEVE], RED_T, lw=2.0, shade=9, light=3, ldir=LDIR)
slm = erode_cv(sl[..., 3] > 0.5, 2)
sl = over(sl, strokes(S, [((276, 350), (272, 312), (266, 272), 5.0), ((300, 300), (296, 280), (290, 262), 3.0)], RED_T[0], clip=slm, taper_to=0.05))
sl = over(sl, strokes(S, [((258, 300), (256, 280), (256, 262), 1.4)], RED_T[2], alpha=0.8, clip=slm, taper_to=0.2))
lay = over(lay, sl)
hm = head[..., 3] > 0.5
lay[..., :3] = np.where((shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5))[..., None],
                        lay[..., :3] * np.asarray((0.66, 0.6, 0.62), np.float32), lay[..., :3])
b.img = over(lay, head)

# ---- the round black felt cap (no brim): a band round the head and a soft crown a little wider over it ----
BAND = [(84, 44), (128, 36), (176, 36), (218, 44), (246, 56), (244, 76), (216, 64), (176, 56), (128, 56), (86, 64)]
CROWN = [(78, 46), (80, 30), (96, 14), (130, 4), (176, 2), (216, 10), (244, 26), (254, 46), (248, 62), (216, 48), (176, 40), (128, 40),
         (90, 50)]
crown = cel(S, [CROWN], CAP_T, lw=2.0, shade=10, light=4, ldir=LDIR)
band = cel(S, [BAND], ((10, 10, 12), (26, 26, 28), (50, 50, 54)), lw=2.0, shade=4, light=2, ldir=LDIR)
cap = over(band, crown)
cap = over(cap, strokes(S, [((100, 22), (140, 10), (190, 12), 2.0)], (92, 92, 98), alpha=0.6, clip=erode_cv(crown[..., 3] > 0.5, 2), taper_to=0.2))
put_hat(b, cap, shadow=(150, 118, 130), shadow_k=0.5, sdx=2, sdy=8)
b.save(OUT)
print('ok', OUT)
