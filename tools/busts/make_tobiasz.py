# Tobiasz Goniec (the continent's courier from the ferry, lanky, about 20, a quick friendly chatterbox): Actor1_1 (the young
# brown-haired face with the red scarf) repainted to match his map sheet ($Npc_Tobiasz): the tousled hair a duller mid brown
# and the blue eyes brown, a wide brown felt hat with a dark band and a grey feather stuck in it at the back (the soft hat of
# SF_Actor2_4, widened), the red scarf the map's brick red neckerchief; below the head everything new: the armour pads and the
# blue-and-gold tunic painted over as a mud-spattered dark-blue riding coat with a turned-up collar, and a brown leather
# satchel strap with a brass buckle across the chest from the far shoulder.
# 0 PixelLab generations. Run: python tools/busts/make_tobiasz.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Tobiasz_Bust.png')
b = Bust('Actor1_1')
S = b.img.shape
LDIR = (0.55, 0.83)

# the map's colours ($Npc_Tobiasz front frame): hat (126, 90, 61)/(109, 77, 52)/(76, 50, 33), band (47, 29, 18)/(34, 16, 8), feather
# (185, 184, 182)/(127, 127, 127)/(102, 102, 102), hair (106, 66, 45)/(69, 42, 27)/(56, 39, 28), neckerchief (177, 56, 49)/(121, 39, 36)/
# (85, 10, 14), coat (60, 74, 91)/(43, 52, 64)/(33, 46, 61)/(19, 28, 39), strap (109, 77, 52)/(76, 50, 33), skin (244, 189, 153)
HAIR = [(0.0, (22, 12, 8)), (0.15, (48, 30, 20)), (0.3, (72, 46, 30)), (0.45, (98, 64, 42)), (0.6, (124, 86, 58)), (0.8, (160, 120, 86)),
        (1.0, (196, 160, 122))]
HAT = [(0.0, (14, 8, 4)), (0.18, (40, 24, 14)), (0.34, (76, 50, 33)), (0.5, (98, 68, 44)), (0.66, (116, 82, 54)), (0.82, (132, 96, 66)),
       (1.0, (156, 120, 86))]
BAND_T = ((26, 12, 6), (44, 26, 16), (70, 44, 28))
FEATHER_T = ((98, 98, 102), (164, 164, 166), (214, 214, 214))
SCARF = [(0.0, (40, 6, 8)), (0.15, (85, 10, 14)), (0.3, (121, 39, 36)), (0.5, (160, 52, 46)), (0.7, (184, 64, 54)), (0.9, (212, 104, 90))]
COAT_T = ((33, 46, 61), (60, 74, 91), (82, 98, 116), (19, 28, 39))
STRAP_T = ((62, 40, 26), (109, 77, 52), (140, 104, 74))
BRASS_T = ((110, 76, 26), (184, 140, 60), (236, 204, 128))
MUD = (92, 70, 50)

hd, s, v = hsv_of(b.src)
op = b.op()

# ---------- hair: a duller mid brown; the eyes brown ----------
FACE = [(96, 96), (200, 96), (214, 130), (200, 160), (170, 182), (128, 180), (104, 150)]
hair = b.sel(hue=(10, 42), sat=(0.35, 1), val=(0, 0.9), box=(40, 0, 250, 160))
hair &= ~(b.sel(hue=(5, 40), sat=(0.15, 0.55), val=(0.75, 1)))          # (the skin)
b.ramp(hair, HAIR, gain=1.05)
eye = b.sel(hue=(170, 240), sat=(0.25, 1), box=(96, 100, 186, 140))
b.ramp(eye, [(0.0, (20, 10, 6)), (0.2, (56, 30, 16)), (0.45, (104, 62, 32)), (0.7, (150, 100, 56)), (0.9, (206, 168, 120)), (1.0, (250, 240, 220))],
       gain=1.0)
# a touch of sun on the young face (a long road)
skin = b.sel(hue=(5, 40), sat=(0.12, 0.6), val=(0.6, 1), box=(96, 90, 230, 190))
b.over(blush(S, 190, 140, 13, 8, col=(232, 128, 98), alpha=0.22, clip=skin))
b.over(blush(S, 116, 146, 8, 6, col=(232, 128, 98), alpha=0.18, clip=skin))

# ---------- the neckerchief: brick red ----------
SCARF_P = [(86, 186), (104, 176), (140, 180), (196, 172), (228, 168), (256, 176), (282, 198), (286, 212), (262, 226), (236, 238), (206, 252),
           (180, 264), (150, 268), (118, 262), (98, 250), (86, 224)]
scarf = b.sel(hue=(295, 16), sat=(0.3, 1), val=(0.1, 1), poly=SCARF_P)
scarf = fill_holes(dilate_cv(scarf, 1)) & b.op() & b.poly(SCARF_P)
scarf = b.comp(scarf, (180, 220))                                       # (one piece: no bits of the cape's lining)
scarf = b.grow(scarf, 2, 0.25) & b.poly(SCARF_P)
b.ramp(scarf, SCARF, gain=1.0)

# ---------- what stays: the head and the neckerchief (the armour, the tunic and the high collar go) ----------
HEAD = [(30, 0), (300, 0), (300, 150), (240, 150), (232, 170), (230, 200), (100, 200), (100, 168), (30, 150)]
# the tunic's high collar: the riding coat's stand-up collar (dark blue, the white trim a lighter blue-grey)
collar = (b.sel(hue=(185, 290), sat=(0.05, 1)) | b.sel(sat=(0, 0.25), val=(0.45, 1))) & region(S, 95, 140, 232, 205)
collar &= ~b.sel(hue=(0, 50), sat=(0.08, 0.7), val=(0.6, 1)) & ~scarf
b.ramp(collar, [(0.0, LINE), (0.15, (19, 28, 39)), (0.35, (33, 46, 61)), (0.6, (60, 74, 91)), (0.85, (84, 100, 118)), (1.0, (104, 120, 138))])
keep = (b.poly(HEAD) & op) | scarf
head = take(b.img, keep)
hm = head[..., 3] > 0.5

# ---------- the body (new): the neck, a dark-blue riding coat with a turned-up collar ----------
lay = np.zeros(S[:2] + (4,), np.float32)
SKIN_T = ((214, 150, 118), (244, 189, 153), (252, 214, 184))
NECK = [(134, 168), (204, 150), (214, 190), (200, 214), (150, 214), (136, 196)]
lay = over(lay, cel(S, [NECK], SKIN_T, lw=1.6, shade=12, light=2, ldir=LDIR))
COAT = [(40, 350), (38, 280), (46, 240), (64, 216), (96, 200), (120, 192), (210, 180), (250, 196), (288, 214), (310, 236), (320, 280),
        (322, 350)]
ct = celf(S, [COAT], COAT_T[:3], lw=2.0, shade=14, light=3, ldir=LDIR)
cm = erode_cv(ct[..., 3] > 0.5, 2)
# the near side turning away, the far arm's sleeve seam, the front edge of the coat and its folds
darken(ct, b.poly([(272, 200), (330, 200), (330, 350), (290, 350), (284, 280)]) & cm,
       np.asarray(COAT_T[0], np.float32) / np.asarray(COAT_T[1], np.float32))
ct = over(ct, strokes(S, [((84, 214), (74, 270), (78, 352), 1.5), ((272, 206), (280, 270), (290, 352), 1.5)], COAT_T[3], alpha=0.85,
                      clip=cm, taper_to=1.0))
ct = over(ct, strokes(S, [((176, 262), (180, 306), (184, 352), 2.0)], LINE, alpha=0.9, clip=cm, taper_to=1.0))       # (the front edge)
ct = over(ct, cel(S, [taper(bez((186, 262), (190, 306), (194, 352), 16), 5, 7)], (COAT_T[0],) * 3, outline=False, shade=0, light=0,
                  clip=cm))                                                                                     # (the far panel's shade)
FOLDS = [((112, 352), (114, 318), (122, 284), 8.0), ((236, 352), (234, 322), (230, 292), 9.0), ((60, 352), (62, 320), (66, 286), 5.0)]
ct = over(ct, strokes(S, FOLDS, COAT_T[0], clip=cm, taper_to=0.05), k=0.75)
ct = over(ct, strokes(S, [(f[0], f[1], f[2], 1.2) for f in FOLDS], COAT_T[2], clip=cm, taper_to=0.1), k=0.5)
# buttons (dark horn) down the near front edge
ct = over(ct, cel(S, [ellipse(170, 292, 3.4, 3.0), ellipse(172, 330, 3.4, 3.0)], ((20, 14, 12), (52, 40, 32), (96, 80, 66)), lw=1.0, shade=1.2,
                  light=0.8, ldir=LDIR))
# mud spattered on the coat (more lower down, the road splashes)
rng = np.random.RandomState(7)
pts = []
for i in range(46):
    x = rng.uniform(46, 316)
    y = 352 - abs(rng.normal(0, 34))
    pts.append((x, y, rng.uniform(0.9, 2.4)))
ct = over(ct, dots(S, pts, MUD, alpha=0.75, clip=cm))
ct = over(ct, dots(S, [(p[0] + 0.8, p[1] - 0.6, p[2] * 0.45) for p in pts[::2]], (128, 102, 76), alpha=0.6, clip=cm))
lay = over(lay, ct)

# ---------- the satchel strap: from the far shoulder across the chest to the near hip ----------
STRAP = taper(bez((58, 196), (156, 262), (262, 352), 30), 14, 15)
st = celf(S, [STRAP], STRAP_T, lw=1.6, shade=3, light=1.6, ldir=LDIR)
st[..., 3] *= cm                                                        # (over the shoulder: the coat's outline cuts it)
stm = erode_cv(st[..., 3] > 0.5, 1)
st = over(st, strokes(S, [((62, 200), (152, 264), (266, 346), 0.9)], (176, 140, 100), alpha=0.55, clip=stm, taper_to=1.0))  # (stitching)
BUCK = [(196, 296), (214, 288), (226, 306), (208, 316)]
st = over(st, cel(S, [BUCK], BRASS_T, lw=1.4, shade=2, light=1.2, ldir=LDIR,
                  holes=[[(202, 299), (212, 294), (219, 305), (209, 311)]]))
st = over(st, strokes(S, [((206, 292), (210, 302), (214, 312), 1.6)], BRASS_T[0], alpha=0.95))
lay = over(lay, st)
# the head's shadow on the coat, then the head and the neckerchief over it all
darken(lay, shift(hm, 3, 9) & ~hm & (lay[..., 3] > 0.5) & (b.yy > 170), (0.72, 0.72, 0.8))
b.img = over(lay, head)

# ---------- the hat: brown felt, wide, a dark band, a grey feather stuck in the band at the back ----------
M = affine(scale=(1.44, 1.0), rot=-4, src_pt=(143, 92), dst_pt=(150, 78))
hat = bucket_hat(M, S, HAT, gain=1.0, band=BAND_T)
hat = over(feather(S, [(232, 54), (258, 30), (276, -8)], FEATHER_T, width=15.0, seed=5), hat)
put_hat(b, hat, shadow=(130, 106, 110), shadow_k=0.5, sdx=2, sdy=9)
# the whole bust 12 px lower (room for the hat's crown; only the coat's hem leaves the frame)
b.img = np.concatenate([np.zeros((12, S[1], 4), np.float32), b.img[:-12]], 0)
b.save(OUT)
print('ok', OUT)
