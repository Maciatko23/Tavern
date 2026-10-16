# Zolnierz krolewski (a soldier of the King's garrison over the bay, about 25): Actor1_5 repainted to match his map sheet
# ($Npc_Zolnierz): a round steel kettle hat with a wide brim and seams down the dome (kit.kettle_hat + painted seams), the
# hair under it dark brown, the long fringe trimmed off the face (the skin filled from round it), a short brown beard with a
# moustache (painted); below the head everything new, like the captain's (make_rotmistrz): bluish-grey mail sleeves, a mail
# collar round the neck, the garrison's tabard per pale blue and white with the orange-red phoenix.
# Run: python tools/busts/make_zolnierz.py [out.png]
import sys
from kit import *
from make_kapral import darken
from make_rotmistrz import LDIR, mail_piece, tabard

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Zolnierz_Bust.png')
b = Bust('Actor1_5')
S = b.img.shape

# the map's colours ($Npc_Zolnierz front frame): tabard blue (98, 180, 224)/(58, 137, 182)/(62, 109, 136), white (223, 228, 231)/
# (145, 164, 171), phoenix (215, 86, 43)/(173, 47, 22)/(234, 136, 54), mail (126, 142, 147)/(101, 116, 121)/(74, 86, 89), helmet
# (145, 164, 171)/(126, 142, 147)/(185, 200, 205), beard and hair (108, 72, 51)/(85, 55, 36)/(74, 48, 33), skin (243, 174, 138)
BLUE_T = ((60, 132, 176), (98, 180, 224), (150, 210, 238))
WHITE_T = ((150, 166, 174), (222, 228, 232), (246, 248, 250))
PHX_T = ((173, 47, 22), (215, 86, 43), (236, 128, 70))
PHX_LINE = (104, 28, 12)
PHX_GLOW = (236, 140, 58)
MAIL_T = ((60, 70, 76), (124, 140, 146), (176, 190, 196))
MAIL_RING = (38, 44, 48)
MAIL_SHINE = (214, 224, 228)
HELM_T = ((74, 84, 92), (140, 156, 164), (204, 216, 222))
BEARD_T = ((70, 44, 28), (104, 70, 48), (140, 98, 68), (50, 30, 20))


def nn_fill(R, ok):
    """The pixels of R take the colour of the nearest pixel in ok (the picture and its source)."""
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


hd, s, v = hsv_of(b.src)
# ---- the long fringe off the face: the strands hanging between the eyes go (filled from the skin round them) ----
TRIM = b.poly([(135, 108), (164, 104), (164, 140), (152, 143), (138, 138)])
skin_c = (hd >= 12) & (hd <= 40) & (s >= 0.12) & (s <= 0.36) & (v >= 0.82)
strand = TRIM & b.op()
nn_fill(strand, skin_c & ~strand & b.poly([(126, 100), (174, 100), (174, 150), (126, 150)]))
soften(strand, skin_c & ~strand & b.poly([(124, 98), (176, 98), (176, 152), (124, 152)]), 4.0)

# ---- hair: dark warm brown ----
hd, s, v = hsv_of(b.src)
FACE = [(112, 112), (210, 104), (214, 140), (206, 172), (186, 196), (156, 202), (130, 186), (114, 150)]
hair = b.sel(hue=(0, 40), sat=(0.2, 0.62), val=(0, 0.72), box=(50, 0, 285, 190)) & ~b.poly(FACE)
hair |= b.sel(hue=(0, 40), sat=(0.2, 0.62), val=(0, 0.72), box=(100, 0, 230, 112))
hair |= b.sel(hue=(160, 200), sat=(0.08, 1), box=(50, 0, 285, 190))        # (a cool rim light at its edge)
hair = b.grow(hair, 1, 0.2) & region(S, 50, 0, 285, 190)
b.ramp(hair, [(0.0, (20, 12, 8)), (0.15, (46, 28, 18)), (0.3, (76, 48, 32)), (0.45, (104, 70, 48)), (0.6, (132, 92, 64)),
              (0.8, (164, 122, 88))], gain=1.0)
# the skin a little warmer and weathered (the map's (243, 174, 138))
skin = b.sel(hue=(0, 45), sat=(0.1, 0.6), val=(0.6, 1), poly=FACE) & ~hair
b.multiply(skin, (252, 232, 220), 1.0)

# ---- the short brown beard along the jaw and chin, a moustache ----
OUTER = [(210, 136), (213, 152), (208, 170), (198, 186), (184, 198), (166, 206), (150, 204), (136, 194), (124, 180), (118, 164),
         (116, 148)]
INNER = [(122, 150), (128, 164), (136, 176), (146, 181), (156, 182), (166, 180), (178, 175), (190, 164), (197, 150), (201, 136)]
MOUS = [(136, 172), (144, 165), (155, 163), (166, 164), (175, 168), (179, 175), (170, 172), (158, 170), (147, 172), (139, 177)]
bd = beard2(S, OUTER, INNER, BEARD_T, flow=(160, 220), mous=MOUS, mous_flow=(156, 186), seed=8, n=110, tip=3.5, out=1.8, seg=7)
b.over(bd)

# ---- the head that stays: the face, the hair (the coat's high collar and its trims go) ----
HAIR_EDGE = strand_edge([(250, 100), (246, 120), (238, 140), (226, 156)], side=1, seg=8, tip=4, out=2.2, seed=9)   # (the side locks' tips)
HEAD = [(50, 0), (285, 0), (285, 96)] + HAIR_EDGE + [(220, 162), (212, 176), (200, 194), (184, 203), (166, 209),
        (150, 207), (134, 196), (124, 190), (112, 186), (104, 170), (98, 152), (84, 140), (60, 104), (50, 90)]
keep = b.poly(HEAD) & b.op()
keep &= ~(b.sel(hue=(190, 300), sat=(0.25, 1), val=(0, 0.6)) & ~hair)                 # (the navy coat)
keep &= ~(b.sel(hue=(300, 345), sat=(0.55, 1), val=(0, 0.5)) & ~hair)                 # (its maroon lining)
keep &= ~(b.sel(hue=(20, 55), sat=(0.42, 1), val=(0.55, 1)) & ~hair)                  # (the gold trims)
keep &= ~(b.sel(lum=(0, 0.12)) & ~b.poly(FACE) & region(S, 50, 140, 285, 230) & ~dilate(hair, 2))   # (their lines)
keep |= bd[..., 3] > 0.02
head = take(b.img, keep)
head = over(head, strokes(S, [(HAIR_EDGE[i], ((np.asarray(HAIR_EDGE[i]) + np.asarray(HAIR_EDGE[i + 1])) / 2).tolist(), HAIR_EDGE[i + 1], 1.8)
                              for i in range(len(HAIR_EDGE) - 1)], LINE, alpha=1.0, taper_to=1.0, clip=dilate(head[..., 3] > 0.5, 1)))
hm = head[..., 3] > 0.5

# ---- the body (new): mail shirt, the tabard, the mail collar ----
SHIRT = [(0, 252), (36, 232), (84, 218), (236, 206), (300, 222), (330, 232), (330, 350), (0, 350)]
lay = mail_piece(S, [SHIRT], lambda x: -0.0003 * (x - 165) ** 2, MAIL_T, MAIL_RING, MAIL_SHINE)
TAB = [(42, 240), (84, 221), (150, 212), (236, 208), (272, 214), (290, 226), (293, 262), (298, 300), (304, 350), (34, 350), (37, 300)]
TAB_SHADE = [(258, 200), (330, 200), (330, 350), (270, 350), (264, 300)]
FOLDS = [((92, 352), (97, 322), (104, 292), 8.0), ((248, 352), (242, 322), (236, 292), 9.0), ((56, 352), (59, 320), (64, 290), 6.0)]
lay = over(lay, tabard(S, TAB, (164, 212, 154, 350), BLUE_T, WHITE_T, (103, 242, 0.93, PHX_T, PHX_LINE, PHX_GLOW), FOLDS, TAB_SHADE))
COLLAR = [(104, 168), (130, 184), (158, 196), (188, 190), (206, 174), (222, 160), (244, 156), (256, 170), (260, 200), (250, 222),
          (210, 234), (168, 240), (130, 236), (106, 226), (100, 210), (98, 186)]
col = mail_piece(S, [COLLAR], lambda x: -0.0018 * (x - 170) ** 2, MAIL_T, MAIL_RING, MAIL_SHINE, shade=10, light=4)
cm = col[..., 3] > 0.5
darken(lay, shift(cm, 2, 6) & ~cm & (lay[..., 3] > 0.5), (0.62, 0.6, 0.66))
sh = b.poly([(228, 150), (270, 150), (270, 232), (238, 232)]) & erode_cv(cm, 2)
col[..., :3] = np.where(sh[..., None], col[..., :3] * np.asarray((0.62, 0.62, 0.68), np.float32), col[..., :3])
lay = over(lay, col)
darken(lay, shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5), (0.6, 0.58, 0.66))
b.img = over(lay, head)

# ---- the kettle hat: a steel dome on a wide brim, seams down the dome (the map's ribbed helmet) ----
HX, HY, RX, RY = 166, 82, 82, 66
hat = kettle_hat(S, HX, HY, RX, RY, 126, 21, rot=-4, tones=HELM_T, brim_dy=4)
dome = erode_cv(hat[..., 3] > 0.5, 2) & (b.yy < HY - 3)
for dx, a in ((-44, 0.55), (0, 0.8), (42, 0.55)):          # (the seams of the dome's segments, as on the map's helmet)
    hat = over(hat, strokes(S, [((HX + dx, HY - 4), (HX + dx * 0.8 - 5, HY - RY * 0.62), (HX + dx * 0.3 - 9, HY - RY + 6), 1.3)],
                            HELM_T[0], alpha=a, clip=dome, taper_to=0.4))
    hat = over(hat, strokes(S, [((HX + dx - 2.5, HY - 4), (HX + dx * 0.8 - 7.5, HY - RY * 0.62), (HX + dx * 0.3 - 11, HY - RY + 6), 1.2)],
                            HELM_T[2], alpha=a * 0.8, clip=dome, taper_to=0.4))
put_hat(b, hat, shadow=(120, 110, 130), shadow_k=0.55, sdx=2, sdy=10)
b.save(OUT)
print('ok', OUT)
