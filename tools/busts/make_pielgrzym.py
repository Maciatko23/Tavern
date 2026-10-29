# Albin (a traveller from the ferry, docs/PODROZNI.md 2.8: a lean "pilgrim" of about 35, gentle and polite - in truth a scout
# of the enemy across the strait, 2026-10-29): SF_Actor1_1 (the brown-haired boy in the white blazer) repainted to his PixelLab
# map sheet ($Npc_Pielgrzym) - the face made a grown man's: the short tousled hair NEAR-BLACK, the big blue eyes dark brown and
# narrowed under heavier lids (SHARP, WATCHFUL), thick dark brows drawn low and level, the skin a road-tanned peach, the lines of
# his age (under the eyes, from the nose, a hollow under the cheekbone), the shadow of a close shave on the jaw and the upper lip
# (CLEAN-SHAVEN); below the head everything new: a thicker neck, a coarse UNDYED CREAM WOOL ROBE (the wool's fleck, folds) with
# its HOOD LOWERED and lying in thick folds round the neck and on the shoulders, a THIN BLACK CORD round the neck with a few
# WOODEN PRAYER BEADS and a small wooden cross on the chest, and the top of his tall wooden pilgrim's staff at the far edge.
# 0 PixelLab generations. Run: python tools/busts/make_pielgrzym.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Pielgrzym_Bust.png')
b = Bust('SF_Actor1_1')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)

# the map's colours ($Npc_Pielgrzym front frame): hair (54, 53, 52)/(36, 34, 32)/(26, 24, 20)/(15, 15, 13), skin (238, 182, 142)/
# (233, 174, 133)/(228, 148, 104)/(188, 133, 97), robe (222, 209, 181)/(200, 178, 147)/(183, 166, 136)/(176, 158, 129)/(165, 147, 119),
# cord (2, 1, 1)/(36, 34, 32), staff (149, 104, 69)/(128, 89, 59)/(78, 58, 42)
HAIR = [(0.0, (6, 6, 5)), (0.12, (12, 12, 10)), (0.22, (20, 19, 16)), (0.32, (28, 26, 22)), (0.45, (38, 36, 33)), (0.58, (54, 53, 51)),
        (0.75, (78, 76, 72)), (1.0, (110, 108, 102))]
HAIR_T = ((14, 14, 12), (28, 26, 22), (52, 50, 48), (6, 6, 5))
SKIN = [(0.0, (40, 18, 12)), (0.3, (112, 66, 46)), (0.5, (170, 112, 80)), (0.62, (196, 136, 100)), (0.72, (214, 152, 114)),
        (0.8, (228, 166, 126)), (0.88, (238, 180, 140)), (1.0, (250, 206, 172))]
SKIN_T = ((198, 136, 98), (234, 176, 136), (246, 196, 158))
ROBE_T = ((165, 147, 119), (214, 200, 172), (230, 220, 196), (150, 132, 104))
HOOD_T = ((158, 140, 112), (204, 188, 158), (226, 214, 188), (138, 120, 94))
WOOD_T = ((78, 58, 42), (128, 89, 59), (160, 118, 80))
BEAD_T = ((70, 44, 26), (124, 82, 48), (176, 130, 86))
WR = (176, 108, 78)

hd, s, v = hsv_of(b.src)
op = b.op()
EYE_F = [(98, 108), (124, 108), (124, 136), (98, 136)]
EYE_N = [(150, 104), (184, 104), (184, 134), (150, 134)]
eyes = b.poly(EYE_F, EYE_N)


def line_along(pts, w=2.0, col=LINE, alpha=1.0, clip=None):
    return strokes(S, [(pts[i], ((np.asarray(pts[i]) + np.asarray(pts[i + 1])) / 2).tolist(), pts[i + 1], w) for i in range(len(pts) - 1)],
                   col, alpha=alpha, taper_to=1.0, clip=clip)


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


# ---------- the eyes: dark brown irises ----------
iris = b.sel(hue=(160, 260), sat=(0.2, 1)) & eyes
b.ramp(iris, [(0.0, (8, 6, 6)), (0.2, (26, 18, 14)), (0.4, (50, 34, 24)), (0.6, (82, 58, 40)), (0.8, (126, 96, 70)), (1.0, (226, 216, 204))])

# ---------- the skin: tanned; the hair: near-black ----------
skin = b.sel(hue=(345, 45), sat=(0.12, 0.48), val=(0.7, 1), box=(80, 80, 230, 200)) & ~iris
skin |= b.sel(sat=(0, 0.12), val=(0.9, 1), box=(80, 130, 230, 200)) & ~eyes          # (the pale rim light along the jaw)
b.ramp(skin, SKIN, gain=1.0)
EAR = b.poly([(194, 96), (216, 94), (224, 120), (216, 150), (196, 150)])
MOUTH = b.poly([(122, 154), (162, 154), (162, 166), (122, 166)])
FACEP = b.poly([(98, 112), (130, 100), (190, 96), (198, 102), (200, 140), (193, 147), (150, 184), (100, 136)])
hair = b.sel(hue=(330, 45), sat=(0.4, 1), val=(0, 0.9), box=(40, 0, 260, 170)) & ~skin & ~eyes & ~MOUTH & ~((EAR | FACEP) & b.sel(val=(0.55, 1)))
hair |= b.sel(hue=(5, 40), sat=(0.45, 1), val=(0, 0.5)) & eyes & ~iris & ~b.poly([(98, 112), (184, 106), (184, 136), (98, 136)])
hair = b.grow(hair, 1, 0.2) & region(S, 40, 0, 260, 170) & ~iris
b.ramp(hair, HAIR, gain=1.0)

# ---------- older and watchful: heavier upper lids (the eyes narrowed), low level brows, lines ----------
# the upper lid comes down over the top of each eye (skin), its lash line drawn again lower and thicker
LID_F = [(97, 111), (104, 108.5), (113, 108.5), (122, 111), (122, 118), (113, 117), (104, 117.5), (97, 120)]
LID_N = [(150, 108), (160, 104.5), (171, 104), (181, 106), (183, 114), (172, 113.5), (161, 114), (151, 116)]
for lid in (LID_F, LID_N):
    b.over(cel(S, [lid], SKIN_T, outline=False, shade=3, light=0, ldir=(0.0, -1.0)))
LASH_F = [(96, 121), (103, 118), (112, 117), (120, 117.5), (124, 120)]
LASH_N = [(149, 117), (158, 114.5), (170, 113.5), (180, 114), (185, 117)]
for lash in (LASH_F, LASH_N):
    b.over(line_along(lash, 3.0, (14, 10, 10)))
b.over(strokes(S, [((101, 114), (110, 112), (119, 114), 1.0), ((155, 110), (167, 108), (178, 110), 1.0)], WR, alpha=0.55))   # (the lid's crease)
# the brows: thick, dark, low and level, the inner ends drawn a little down
BROW_F = [(94, 106), (104, 102), (116, 102), (126, 105), (124, 109), (114, 107), (104, 107.5), (96, 110)]
BROW_N = [(144, 103), (154, 99), (168, 97.5), (182, 99), (188, 103), (184, 106), (170, 103.5), (156, 105), (146, 108)]
for poly, fl in ((BROW_F, (98, 108)), (BROW_N, (186, 104))):
    lay = cel(S, [poly], HAIR_T[:3], lw=1.2, shade=2.0, light=1.0, ldir=LD)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), fl, HAIR_T[2], HAIR_T[3], n=14, length=(4, 7), seed=len(poly)))
    b.over(lay)
# lines: under the eyes, from the nose, a crease between the brows, a hollow under the near cheekbone
b.over(strokes(S, [((101, 136), (110, 140), (120, 137), 1.0), ((156, 134), (168, 138), (182, 133), 1.1),
                   ((140, 146), (146, 156), (148, 164), 1.2), ((134, 103), (135, 108), (134, 113), 1.1),
                   ((112, 154), (114, 162), (118, 168), 1.0)], WR, alpha=0.5, clip=skin))
b.over(blush(S, 180, 142, 10, 7, col=(176, 110, 84), alpha=0.14, clip=skin))
# the mouth a little thinner and firmer
b.over(strokes(S, [((128, 160.5), (142, 161), (156, 159.5), 1.4)], (120, 62, 48), alpha=0.6, taper_to=0.5))
# the shadow of a close shave on the jaw, the chin and the upper lip
SHAVE = [(104, 146), (110, 158), (120, 168), (134, 178), (146, 182), (160, 176), (176, 166), (190, 156), (194, 146), (184, 152),
         (170, 160), (156, 166), (140, 166), (126, 162), (116, 156)]
b.over(blush(S, 148, 168, 44, 16, col=(120, 104, 110), alpha=0.16, clip=skin & b.poly(SHAVE)))
b.over(blush(S, 142, 155, 16, 4, col=(120, 104, 110), alpha=0.14, clip=skin))

# ---------- what stays: the head above the jaw (the blazer and the red collar go) ----------
JAW = [(100, 132), (103, 140), (106, 150), (110, 159), (114, 164), (118, 168), (122, 171.5), (126, 174.5), (130, 177.5), (134, 180), (138, 182),
       (142, 183.5), (147, 183.5), (152, 181.5), (160, 177), (166, 172), (172, 167.5), (178, 162), (184, 156), (189, 151), (193, 146)]
HEAD = [(20, 0), (330, 0), (330, 152), (240, 152), (222, 150), (210, 151), (198, 148)] + JAW[::-1] + [(20, 134)]
keep = b.poly(HEAD) & op
head = take(b.img, keep)
head = over(head, line_along(JAW, 2.0))

hm = head[..., 3] > 0.5

# ---------- the body (new): the neck, the robe, the lowered hood, the cord with the beads ----------
body = np.zeros((H, W, 4), np.float32)
NECK = [(136, 176), (196, 144), (206, 138), (214, 150), (212, 196), (204, 216), (150, 220), (140, 198)]
neck = celf(S, [NECK], SKIN_T, lw=1.8, shade=13, light=0, ldir=LD)
nm = neck[..., 3] > 0.5
CHIN_SH = JAW + [(x + 4, y + 12) for x, y in JAW[::-1]]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the robe: lean sloping shoulders
ROBE = [(18, 350), (22, 292), (34, 254), (64, 232), (104, 220), (136, 214), (214, 204), (252, 212), (284, 230), (304, 256), (314, 300),
        (318, 350)]
rb = celf(S, [ROBE], ROBE_T[:3], lw=2.0, shade=14, light=3, ldir=LD, shade2=None)
rm = erode_cv(rb[..., 3] > 0.5, 2)
darken(rb, b.poly([(272, 210), (330, 210), (330, 350), (294, 350), (288, 280)]) & rm,
       np.asarray(ROBE_T[0], np.float32) / np.asarray(ROBE_T[1], np.float32))
FOLDS = [((70, 352), (68, 318), (74, 286), 7.0), ((136, 352), (140, 320), (146, 296), 6.0), ((242, 352), (236, 320), (230, 292), 8.0),
         ((40, 352), (40, 322), (46, 296), 5.0)]
rb = over(rb, strokes(S, FOLDS, ROBE_T[0], clip=rm, taper_to=0.05), k=0.75)
rb = over(rb, strokes(S, [(f[0], f[1], f[2], 1.2) for f in FOLDS], ROBE_T[2], clip=rm, taper_to=0.1), k=0.6)
rb = over(rb, strokes(S, [((74, 238), (60, 290), (60, 352), 1.4), ((270, 222), (282, 280), (288, 352), 1.4)], ROBE_T[3], alpha=0.8, clip=rm,
                      taper_to=1.0))                                                          # (the sleeves' seams)
body = over(body, rb)
# the lowered hood: a thick soft roll of wool round the neck, lying over the shoulders, its front edges meeting in a V
HOOD = smooth([(52, 244), (76, 222), (110, 204), (132, 196), (146, 214), (162, 240), (174, 262)], 2) \
    + smooth([(174, 262), (186, 240), (204, 212), (218, 196), (240, 194), (268, 204), (292, 226), (300, 246)], 2) \
    + smooth([(300, 246), (276, 254), (248, 252), (226, 248), (200, 272), (180, 290), (168, 292), (150, 278), (128, 258), (100, 262),
              (72, 260), (52, 244)], 2)
hd_ = cel(S, [HOOD], HOOD_T[:3], lw=2.0, shade=8, light=3, ldir=LD)
hdm = erode_cv(hd_[..., 3] > 0.5, 2)
# its folds (the cloth bunched round the neck) and the inner side of the hood seen at the back of the neck
hd_ = over(hd_, strokes(S, [((82, 236), (104, 238), (122, 250), 4.0), ((228, 222), (250, 226), (276, 236), 4.0), ((142, 226), (150, 252), (162, 276), 3.0),
                           ((210, 234), (196, 256), (182, 278), 3.0)], HOOD_T[0], alpha=0.7, clip=hdm, taper_to=0.1))
hd_ = over(hd_, strokes(S, [((86, 232), (106, 234), (122, 245), 1.2), ((230, 218), (252, 222), (276, 232), 1.2)], HOOD_T[2], alpha=0.8, clip=hdm,
                           taper_to=0.2))
darken(body, shift(hdm, 2, 6) & ~hdm & (body[..., 3] > 0.5), (0.74, 0.72, 0.7))
body = over(body, hd_)
# the wool's fleck over the robe and the hood
rng = np.random.RandomState(11)
wool = (body[..., 3] > 0.5) & ~nm
ys, xs = np.nonzero(erode_cv(wool, 2))
pick = rng.choice(len(xs), 520, replace=False)
body = over(body, dots(S, [(xs[i] + 0.5, ys[i] + 0.5, rng.uniform(0.5, 0.9)) for i in pick[:260]], ROBE_T[0], alpha=0.35, clip=wool))
body = over(body, dots(S, [(xs[i] + 0.5, ys[i] + 0.5, rng.uniform(0.5, 0.9)) for i in pick[260:]], ROBE_T[2], alpha=0.4, clip=wool))
# the thin black cord round the neck, down on the chest in a V to the beads and a small wooden cross
CORD_L = [(140, 214), (150, 248), (162, 280), (170, 300)]
CORD_R = [(212, 202), (196, 240), (182, 276), (174, 300)]
for c in (CORD_L, CORD_R):
    body = over(body, line_along(smooth(c, 2), 2.0, (12, 10, 10)))
beads = [(146, 236), (151, 252), (157, 267), (163, 282), (201, 230), (193, 248), (186, 264), (179, 280), (172, 302)]
body = over(body, cel(S, [ellipse(x, y, 3.6, 3.4) for x, y in beads], BEAD_T, lw=1.0, shade=1.6, light=1.0, ldir=LD))
CROSS = [(169, 306), (175, 306), (175, 313), (182, 313), (182, 319), (175, 319), (175, 334), (169, 334), (169, 319), (162, 319), (162, 313),
         (169, 313)]
darken(body, shift(b.poly(CROSS), 2, 3) & ~b.poly(CROSS) & (body[..., 3] > 0.5), (0.78, 0.76, 0.72))
body = over(body, cel(S, [CROSS], WOOD_T, lw=1.2, shade=2, light=1.2, ldir=LD))
# the head's shadow on the hood and the robe, then the head
darken(body, shift(hm & (b.yy > 150), 3, 8) & ~hm & (body[..., 3] > 0.5), (0.72, 0.7, 0.72))
b.img = over(body, head)

# ---------- the top of the tall wooden staff at the far edge (in front of the far shoulder) ----------
STAFF = taper(bez((24, 352), (22, 200), (26, 64), 30), 13, 11)
st = cel(S, [STAFF], WOOD_T, lw=1.8, shade=4, light=2, ldir=LD)
stm = erode_cv(st[..., 3] > 0.5, 1)
st = over(st, strokes(S, [((22, 300), (21, 250), (22, 200), 1.0), ((25, 170), (24, 130), (26, 90), 1.0)], WOOD_T[0], alpha=0.6, clip=stm))
st = over(st, cel(S, [ellipse(24, 236, 8.5, 4.5), ellipse(26, 130, 8, 4)], WOOD_T, lw=1.2, shade=2, light=1.2, ldir=LD))   # (knots)
st = over(st, cel(S, [ellipse(26, 62, 9.5, 8.5)], WOOD_T, lw=1.8, shade=4, light=2, ldir=LD))                             # (the knob)
b.over(st)
b.save(OUT)
print('ok', OUT)
