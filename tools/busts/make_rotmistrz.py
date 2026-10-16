# Rotmistrz Florian Belza (the captain of the King's garrison over the bay, about 50): People3_7 repainted to match his map
# sheet ($Npc_Rotmistrz): the short spiky hair grey, the heavy brows dark grey, a long thick grey moustache drooping past the
# mouth down to the jaw (painted), the chin shaven; a stern, tired face (forehead lines, crow's feet, deeper furrows); below
# the head everything new: grey mail sleeves, a mail collar round the neck, over the chest the garrison's tabard - per pale
# light blue and white - with the orange-red phoenix rising (wings raised, flame tail), as on the banner (!Flags_banner).
# (The navy sash at his waist is below the bust's frame.)
# The phoenix and the tabard body are shared with make_zolnierz.py / make_kwatermistrz.py / make_werbownik.py.
# Run: python tools/busts/make_rotmistrz.py [out.png]
import sys
from kit import *
from make_kapral import ring_layer, celf, darken

LDIR = (0.55, 0.83)     # cel(): the shade band down-right, the light band up-left (light from the upper left, as in RTP)


# ---- the phoenix (the King's garrison's arms) ----
def tongue(p0, p1, p2, w, w_end=0.0):
    """A flame tongue / feather: a tapered stroke along a quadratic curve -> polygon."""
    return taper(bez(p0, p1, p2, 18), w, w_end, w_mid=w * 0.9)


# in a 120 x 116 box: the wings raised in a V with four feather tips each, the head in profile facing left between them (a
# hooked beak, a flame crest), the flame tail fanned down
WING_L = [(54, 48), (48, 30), (43, 14), (39, 0), (34, 12), (27, 3), (24, 17), (15, 9), (14, 24), (4, 19), (6, 32), (10, 38), (22, 45),
          (36, 53), (47, 61), (54, 61)]
WING_R = [(120 - x, y) for x, y in WING_L]
QUILLS = [((51, 50), (44, 28), (38, 6)), ((49, 52), (36, 30), (26, 9)), ((47, 54), (30, 36), (15, 15)), ((45, 56), (24, 42), (6, 26))]
P_HEAD = ellipse(60, 20, 7.5, 7.0, 0, 24)
P_BEAK = [(55, 16), (47, 17), (43, 23), (48, 22), (55, 24)]
P_CREST = [tongue((63, 15), (68, 7), (66, -1), 5), tongue((65, 17), (72, 11), (75, 2), 5), tongue((66, 20), (74, 17), (79, 10), 4.5)]
P_NECK = [(54, 21), (66, 19), (65, 31), (68, 41), (64, 46), (56, 46), (52, 40), (55, 31)]
P_BODY = ellipse(60, 56, 10, 17, 0, 30)
P_TAIL = [tongue((56, 66), (36, 80), (22, 106), 10), tongue((58, 70), (44, 92), (40, 114), 9), tongue((60, 71), (62, 94), (58, 116), 9),
          tongue((62, 70), (76, 92), (80, 114), 9), tongue((64, 66), (84, 80), (98, 106), 10)]


def phoenix(shape, x, y, s, tones, line, glow=None, ldir=LDIR):
    """The phoenix (120 x 116 px at s=1) with its box's top-left at (x, y): tones (shade, mid, light), its line colour, glow:
    the tone of the flame's heart (body and tail) or None. -> RGBA layer"""
    def tr(P):
        return [(x + px * s, y + py * s) for px, py in P]
    polys = [tr(WING_L), tr(WING_R), tr(P_HEAD), tr(P_BEAK), tr(P_NECK), tr(P_BODY)] + [tr(t) for t in P_TAIL + P_CREST]
    lay = cel(shape, polys, tones, line=line, lw=max(0.9, 1.1 * s), shade=2.5 * s, light=1.5 * s, ldir=ldir)
    m = erode_cv(lay[..., 3] > 0.5, 1)
    q = []
    for p0, p1, p2 in QUILLS:
        for X in ((lambda v: v), (lambda v: 120 - v)):
            q.append(tuple(tr([(X(p[0]), p[1])])[0] for p in (p0, p1, p2)) + (1.1 * s,))
    lay = over(lay, strokes(shape, q, tones[0], alpha=0.85, clip=m, taper_to=0.2))
    if glow:
        hearts = [tr(tongue((60, 44), (60, 58), (60, 74), 9)), tr(tongue((57, 74), (46, 90), (40, 104), 4)),
                  tr(tongue((63, 74), (74, 90), (80, 104), 4)), tr(tongue((60, 76), (61, 92), (59, 106), 4))]
        lay = over(lay, cel(shape, hearts, (glow, glow, glow), outline=False, shade=0, light=0, clip=erode_cv(m, 1)))
    return over(lay, dots(shape, [(x + 58 * s, y + 18 * s, 1.2 * s)], line, alpha=0.95))


# ---- mail (like make_kapral's, in any steel tones) ----
def mail_piece(shape, polys, bend, tones, ring, shine, lw=2.0, shade=11, light=3, holes=()):
    """A cel-shaded steel shape (celf: may run off the frame) with staggered rings over it. tones = (shade, mid, light)."""
    lay = celf(shape, polys, tones, lw=lw, shade=shade, light=light, ldir=LDIR, holes=holes)
    return mail_rings(lay, bend, ring, shine, lw)


def mail_rings(lay, bend, ring, shine, lw=2.0):
    m = lay[..., 3] > 0.5
    d, s = ring_layer(lay.shape, erode_cv(m, int(np.ceil(lw))), bend)
    lit = np.clip((luma(lay) - 0.36) / 0.2, 0, 1)
    rc = np.asarray(ring, np.float32) / 255.0
    rgb = lay[..., :3] * (1 - 0.65 * d[..., None]) + rc * 0.65 * d[..., None]
    sh = (s * (0.25 + 0.55 * lit))[..., None]
    lay[..., :3] = rgb * (1 - sh) + np.asarray(shine, np.float32) / 255.0 * sh
    return lay


# ---- the garrison's tabard: per pale light blue (the wearer's right = the picture's left) and white, the phoenix on it ----
def tabard(shape, poly, split, blue_t, white_t, phx, folds=(), shade_poly=None, line=LINE):
    """The tabard as an RGBA layer: poly its outline; split = (x_top, y_top, x_bottom, y_bottom) the line between the halves;
    phx = (x, y, s, tones, line, glow) of the phoenix; folds: (bottom, bend, top, width) shade wedges with a lit edge;
    shade_poly: the side turning away from the light (in shade)."""
    H, W = shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    x0, y0, x1, y1 = split
    xs = x0 + (x1 - x0) * (yy - y0) / float(y1 - y0)
    left = xx < xs
    lay_w = celf(shape, [poly], white_t, lw=2.0, shade=8, light=3, ldir=LDIR)
    lay_b = celf(shape, [poly], blue_t, lw=2.0, shade=8, light=3, ldir=LDIR)
    m = lay_w[..., 3] > 0.5
    inner = erode_cv(m, 2)
    lay = lay_w.copy()
    lay[..., :3] = np.where((left & inner)[..., None], lay_b[..., :3], lay_w[..., :3])
    # the seam between the halves
    lay = over(lay, strokes(shape, [((x0, y0), ((x0 + x1) / 2.0, (y0 + y1) / 2.0), (x1, y1), 1.4)], blue_t[0], alpha=0.7, clip=inner,
                            taper_to=1.0))
    lay = over(lay, phoenix(shape, *phx))
    if shade_poly is not None:
        sm = poly_mask((W, H), shade_poly) > 0.5
        f_w = np.asarray(white_t[0], np.float32) / np.asarray(white_t[1], np.float32)
        f_b = np.asarray(blue_t[0], np.float32) / np.asarray(blue_t[1], np.float32)
        darken(lay, sm & inner & ~left, f_w)
        darken(lay, sm & inner & left, f_b)
    for f in folds:
        for half, t in ((~left, white_t), (left, blue_t)):
            lay = over(lay, strokes(shape, [f], t[0], width=f[3], clip=inner & half, taper_to=0.05), k=0.85)
            lf = tuple((p[0] - f[3] * 0.5 - 0.6, p[1]) for p in f[:3]) + (1.4,)
            lay = over(lay, strokes(shape, [lf], t[2], alpha=0.85, clip=inner & half, taper_to=0.1))
    return lay


# the map's tabard colours ($Npc_Rotmistrz front frame): blue (153, 197, 230)/(107, 143, 170), white (218, 234, 240)/(179, 190, 197),
# phoenix (201, 77, 41)/(157, 53, 28)/(224, 104, 67); mail (142, 142, 142)/(107, 107, 107)/(174, 173, 172); hair (174, 173, 172)/
# (142, 142, 142)/(107, 107, 107); brows (29, 28, 27); skin (231, 177, 145)/(178, 119, 92); sash (55, 74, 106)/(19, 41, 82)
BLUE_T = ((112, 150, 180), (153, 197, 230), (194, 224, 244))
WHITE_T = ((176, 190, 200), (220, 234, 240), (246, 250, 252))
PHX_T = ((157, 53, 28), (201, 77, 41), (226, 106, 68))
PHX_LINE = (104, 32, 16)
PHX_GLOW = (232, 132, 78)
MAIL_T = ((72, 72, 76), (138, 138, 142), (184, 184, 186))
MAIL_RING = (46, 46, 50)
MAIL_SHINE = (220, 220, 222)

if __name__ == '__main__':
    OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Rotmistrz_Bust.png')
    b = Bust('People3_7')
    S = b.img.shape
    hd, s, v = hsv_of(b.src)

    # ---- the hair grey (short and spiky as it is), its green rim light too; the heavy brows dark grey ----
    BROWS = [[(106, 104), (140, 106), (142, 120), (106, 120)], [(148, 102), (204, 96), (206, 112), (150, 116)]]
    hair = b.sel(hue=(230, 345), sat=(0.1, 0.8), val=(0, 0.5), box=(50, 0, 285, 160)) & ~b.poly(*BROWS)
    hair |= b.sel(hue=(60, 180), sat=(0.15, 1), box=(50, 0, 285, 160))
    hair = b.grow(hair, 1, 0.2) & region(S, 50, 0, 285, 160) & ~b.poly(*BROWS)
    hair &= ~b.sel(hue=(0, 50), sat=(0.25, 1), val=(0.45, 1))          # (not the skin)
    b.ramp(hair, [(0.0, (30, 30, 34)), (0.05, (70, 70, 76)), (0.1, (118, 118, 122)), (0.16, (158, 158, 160)), (0.24, (190, 190, 190)),
                  (0.4, (216, 216, 216))], gain=1.0)
    brows = b.sel(lum=(0, 0.4), polys=BROWS) & ~b.sel(hue=(0, 50), sat=(0.25, 1), val=(0.5, 1))
    b.ramp(brows, [(0.0, (26, 26, 30)), (0.1, (52, 52, 58)), (0.25, (84, 84, 90)), (0.4, (110, 110, 116))])

    # ---- older and wearier: forehead lines, crow's feet, a deeper fold from the nose, a crease between the brows ----
    skin = b.sel(hue=(5, 45), sat=(0.15, 0.7), val=(0.45, 1), box=(90, 60, 240, 215))
    WR = (160, 100, 72)
    b.over(strokes(S, [((150, 92), (170, 88), (192, 90), 1.3), ((156, 84), (172, 81), (188, 83), 1.1),
                       ((200, 118), (206, 121), (211, 120), 1.1), ((200, 124), (205, 128), (210, 129), 1.0),
                       ((112, 128), (116, 131), (121, 131), 1.0), ((144, 100), (143, 106), (145, 112), 1.3),
                       ((152, 130), (166, 134), (180, 131), 1.0)], WR, alpha=0.55, clip=skin))
    b.over(strokes(S, [((170, 150), (180, 164), (182, 180), 1.6), ((128, 156), (130, 170), (136, 182), 1.2)], WR, alpha=0.4, clip=skin))

    # ---- the long thick grey moustache: from under the nose over the mouth, its ends drooping past the corners to the jaw ----
    HT = ((112, 112, 116), (164, 164, 168), (208, 208, 210), (84, 84, 90))
    MOUS = [(124, 168), (133, 161), (145, 157), (155, 157), (165, 158), (176, 161), (185, 167), (191, 176), (194, 188), (195, 200),
            (193, 210), (189, 214), (184, 210), (180, 200), (176, 188), (170, 180), (163, 177), (156, 176), (148, 177), (141, 181),
            (137, 192), (134, 204), (131, 214), (126, 216), (121, 210), (119, 198), (119, 184), (120, 174)]
    ml = cel(S, [MOUS], HT[:3], lw=1.6, shade=4, light=2, ldir=LDIR)
    mm = erode_cv(ml[..., 3] > 0.5, 1)
    ml = over(ml, hair_strands(S, mm & (b.xx >= 156), (190, 214), HT[2], HT[3], n=34, length=(7, 13), seed=21, alpha=(0.6, 0.55)))
    ml = over(ml, hair_strands(S, mm & (b.xx < 156), (126, 214), HT[2], HT[3], n=28, length=(7, 13), seed=22, alpha=(0.6, 0.55)))
    ml = over(ml, strokes(S, [((156, 159), (157, 166), (155, 175), 1.0)], HT[3], alpha=0.5, clip=mm))   # (the parting under the nose)
    b.over(ml)

    # ---- the head that stays: the face, the hair, the ear (the armour round them goes) ----
    HEAD = [(50, 0), (285, 0), (285, 96), (234, 100), (233, 112), (233, 124), (230, 134), (224, 142), (216, 150), (210, 160), (206, 172),
            (200, 186), (188, 197), (172, 203), (156, 201), (140, 194), (126, 182), (114, 166), (106, 150), (98, 132), (84, 124), (50, 110)]
    keep = b.poly(HEAD) & b.op()
    keep &= ~b.sel(hue=(10, 65), sat=(0.66, 1), val=(0.3, 1))             # (the armour's orange-gold collar)
    keep &= ~(b.sel(hue=(200, 360), sat=(0.4, 1), val=(0, 0.45)) & (region(S, 196, 130, 285, 210) | region(S, 90, 140, 135, 200)
                                                                      | region(S, 120, 186, 215, 215)))   # (its dark lining by the neck)
    keep |= ml[..., 3] > 0.02                                                # (the moustache's ends hang below the jaw)
    head = take(b.img, keep)
    hm = head[..., 3] > 0.5

    # ---- the body (new): mail shirt (shoulders, arms), the tabard, the mail collar ----
    SHIRT = [(0, 250), (36, 230), (80, 216), (232, 200), (300, 222), (330, 234), (330, 350), (0, 350)]
    lay = mail_piece(S, [SHIRT], lambda x: -0.0003 * (x - 165) ** 2, MAIL_T, MAIL_RING, MAIL_SHINE)
    TAB = [(42, 238), (82, 219), (150, 208), (232, 202), (270, 211), (290, 224), (293, 262), (298, 300), (304, 350), (34, 350), (37, 300)]
    TAB_SHADE = [(258, 200), (330, 200), (330, 350), (270, 350), (264, 300)]
    FOLDS = [((92, 352), (97, 322), (104, 292), 8.0), ((248, 352), (242, 322), (236, 292), 9.0), ((56, 352), (59, 320), (64, 290), 6.0)]
    lay = over(lay, tabard(S, TAB, (162, 208, 152, 350), BLUE_T, WHITE_T, (101, 240, 0.95, PHX_T, PHX_LINE, PHX_GLOW), FOLDS, TAB_SHADE))
    # the mail collar: standing round the neck from under the ear to the tabard's neckline
    COLLAR = [(106, 166), (130, 178), (160, 190), (190, 184), (204, 168), (214, 154), (226, 146), (240, 144), (252, 150), (258, 170),
              (262, 200), (250, 220), (210, 232), (168, 238), (130, 234), (106, 224), (100, 208), (100, 186)]
    col = mail_piece(S, [COLLAR], lambda x: -0.0018 * (x - 170) ** 2, MAIL_T, MAIL_RING, MAIL_SHINE, shade=10, light=4)
    cm = col[..., 3] > 0.5
    darken(lay, shift(cm, 2, 6) & ~cm & (lay[..., 3] > 0.5), (0.62, 0.6, 0.66))     # (the collar's shadow on the tabard)
    sh = b.poly([(226, 140), (270, 140), (270, 230), (236, 230)]) & erode_cv(cm, 2)
    col[..., :3] = np.where(sh[..., None], col[..., :3] * np.asarray((0.62, 0.62, 0.68), np.float32), col[..., :3])
    lay = over(lay, col)
    # the chin's shadow on the collar, then the head
    darken(lay, shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5), (0.6, 0.58, 0.66))
    b.img = over(lay, head)
    b.save(OUT)
    print('ok', OUT)
