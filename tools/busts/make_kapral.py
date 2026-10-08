# Kapral Wit Czerwien (the Lord's corporal of the town guard): People3_7 repainted - a steel kettle helmet over the black hair
# (painted), a dark moustache; below the head everything new, as on the map: a mail shirt (blue-grey steel rings) on the
# shoulders and arms, a mail collar and tippet round the neck, over the chest a sleeveless red cloth tabard with the Lord's
# black horse (rearing). guard_body() and the colours are shared with make_straznik.py.
# Run: python tools/busts/make_kapral.py [out.png]
import sys
from kit import *

MAIL_T = ((52, 58, 70), (126, 136, 148), (178, 188, 200), (36, 40, 50))   # the mail: shade, mid, light, deep (blue-grey steel)
MAIL_RING = (34, 38, 46)                                       # the rings' dark side
MAIL_SHINE = (214, 222, 232)                                   # the rings' lit top
RED_T = ((116, 22, 22), (170, 34, 32), (204, 66, 58))          # the tabard's red cloth (the map's (175, 34, 32))
HORSE_COL = (16, 12, 12)
LDIR = (0.55, 0.83)     # cel(): the shade band down-right, the light band up-left (light from the upper left, as in RTP)
# the Lord's black horse rearing, facing left (heraldic), in a 116 x 114 box
HORSE = [(42, 0), (44, 5), (47, 2), (47, 8), (50, 9), (52, 14), (56, 14), (57, 19), (61, 20), (62, 26), (66, 27), (66, 33),
         (70, 35), (70, 41), (74, 44), (80, 52), (90, 58), (98, 66), (104, 68), (112, 76), (116, 88), (114, 100), (108, 108),
         (108, 96), (104, 86), (99, 80), (97, 88), (98, 98), (102, 108), (103, 114), (92, 114), (92, 108), (87, 98), (82, 94),
         (78, 102), (76, 114), (66, 114), (68, 106), (70, 94), (62, 86), (52, 78), (46, 70), (38, 72), (28, 74), (22, 80), (16, 76),
         (20, 70), (28, 66), (38, 62), (38, 56), (30, 58), (20, 56), (14, 60), (9, 56), (14, 50), (24, 50), (34, 48), (35, 40),
         (33, 34), (28, 31), (20, 31), (13, 34), (9, 35), (4, 34), (2, 30), (4, 26), (8, 22), (16, 16), (26, 10), (36, 5)]


# the body shared by both guards (the corporal's and the manor guard's heads sit alike): the mail shirt, the tabard with its
# shade, folds and horse, the tippet's lower hem over the tabard (right to left)
SHIRT = [(0, 250), (36, 230), (80, 216), (232, 200), (300, 222), (330, 234), (330, 350), (0, 350)]
TABARD = [(48, 240), (290, 236), (296, 280), (304, 350), (36, 350), (42, 290)]
TAB_SHADE = [(256, 236), (330, 236), (330, 350), (268, 350), (262, 300)]
FOLDS = [((94, 352), (99, 320), (106, 286), 9.0), ((246, 352), (240, 322), (232, 290), 10.0),
         ((58, 352), (61, 318), (66, 284), 6.0)]
HORSE_AT = (122, 270, 0.62)
TIPPET_HEM = [(330, 268), (305, 258), (270, 250), (230, 254), (190, 260), (150, 262), (110, 258), (70, 254), (30, 260), (0, 270)]


def rearing_horse(shape, x, y, s):
    poly = [(x + px * s, y + py * s) for px, py in HORSE]
    lay = cel(shape, [poly], (HORSE_COL, HORSE_COL, (64, 54, 54)), line=HORSE_COL, lw=0.8, shade=0, light=1.2,
              ldir=LDIR)
    return over(lay, dots(shape, [(x + 30 * s, y + 15 * s, 1.3 * s + 0.3)], (150, 40, 40), alpha=0.9))


def ring_layer(shape, mask, bend, dx=7.0, dy=5.0, ss=4):
    """Chain mail: staggered rows of small rings inside mask -> (dark, shine) float masks. bend(x): how far a row sags there."""
    H, W = shape[:2]
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


def celf(shape, polys, tones, pad=16, holes=(), **kw):
    """cel() for shapes running off the frame: drawn on a bigger canvas with the points on (or past) the frame's edges pushed
    out, then cut back - the frame cuts them (no shade band, light band or line along the frame's edges)."""
    H, W = shape[:2]

    def ext(p):
        x, y = p
        return (x + pad + (-pad if x <= 0 else pad if x >= W else 0), y + pad + (-pad if y <= 0 else pad if y >= H else 0))
    holes = [[(x + pad, y + pad) for x, y in h] for h in holes]
    big = cel((H + 2 * pad, W + 2 * pad), [[ext(p) for p in poly] for poly in polys], tones, holes=holes, **kw)
    return np.ascontiguousarray(big[pad:pad + H, pad:pad + W])


def mail(shape, polys, bend, lw=2.0, shade=11, light=3):
    """A mail piece: a cel-shaded steel shape with rings over it."""
    return mail_rings(celf(shape, polys, MAIL_T[:3], lw=lw, shade=shade, light=light, ldir=LDIR), bend, lw)


def mail_rings(lay, bend, lw=2.0):
    """Rings over a cel-shaded steel layer: dark under each ring, a shine on its top (less in the shade)."""
    m = lay[..., 3] > 0.5
    d, s = ring_layer(lay.shape, erode_cv(m, int(np.ceil(lw))), bend)
    lit = np.clip((luma(lay) - 0.36) / 0.2, 0, 1)
    ring = np.asarray(MAIL_RING, np.float32) / 255.0
    rgb = lay[..., :3] * (1 - 0.65 * d[..., None]) + ring * 0.65 * d[..., None]
    sh = (s * (0.25 + 0.55 * lit))[..., None]
    lay[..., :3] = rgb * (1 - sh) + np.asarray(MAIL_SHINE, np.float32) / 255.0 * sh
    return lay


def darken(lay, m, f):
    lay[..., :3] = np.where(m[..., None], lay[..., :3] * np.asarray(f, np.float32), lay[..., :3])


def guard_body(b, keep, shirt, tabard, tab_shade, folds, horse_at, pieces, chin=(150, 2, 9)):
    """A guard's body below his head (keep: the head's pixels that stay): the mail shirt (shoulders, arms), the red tabard
    (a shade on its far side, folds: (bottom, bend, top, width) - shade wedges with a lit edge, the horse), then the pieces in
    order: mail parts {poly, sag, holes, shade} each throwing its shadow on what is under it, and 'HEAD' (the head goes there:
    under a coif, over a collar)."""
    S = b.img.shape
    head = take(b.img, keep & b.op())
    hm = head[..., 3] > 0.5
    lay = mail(S, [shirt], lambda x: -0.0003 * (x - 165) ** 2)
    tab = celf(S, [tabard], RED_T, lw=2.0, shade=8, light=3, ldir=LDIR)
    tm = tab[..., 3] > 0.5
    inner = erode_cv(tm, 2)
    darken(tab, b.poly(tab_shade) & inner, np.asarray(RED_T[0], np.float32) / np.asarray(RED_T[1], np.float32))
    for f in folds:
        tab = over(tab, strokes(S, [f], RED_T[0], width=f[3], clip=inner, taper_to=0.05))
        lf = tuple((p[0] - f[3] * 0.5 - 0.6, p[1]) for p in f[:3]) + (1.4,)
        tab = over(tab, strokes(S, [lf], RED_T[2], alpha=0.85, clip=inner, taper_to=0.1))
    tab = over(tab, rearing_horse(S, *horse_at))
    lay = over(lay, tab)
    for pc in pieces:
        if pc == 'HEAD':
            if chin:
                darken(lay, shift(hm & (b.yy > chin[0]), chin[1], chin[2]) & ~hm & (lay[..., 3] > 0.5), (0.6, 0.58, 0.66))
            lay = over(lay, head)
            continue
        holes = pc.get('holes', [])
        pl = celf(S, [pc['poly']], MAIL_T[:3], lw=2.0, shade=10, light=4, holes=holes, ldir=LDIR)
        pm = pl[..., 3] > 0.5
        shd = np.zeros_like(pm)
        for sp in pc.get('shade', []):
            shd |= b.poly(sp)
        deep = np.zeros_like(pm)
        for hp in holes:                       # under a hole (the face): the throat in deep shadow
            hmk = b.poly(hp)
            deep |= shift(hmk, 2, 9) & ~hmk
        for m_, t in ((shd, 0), (deep, 3)):
            m_ &= erode_cv(pm, 2)
            pl[..., :3] = np.where(m_[..., None], np.asarray(MAIL_T[t], np.float32) / 255.0, pl[..., :3])
        pl = mail_rings(pl, pc['sag'])
        drop = shift(pm, 2, 6) & ~pm & (lay[..., 3] > 0.5)
        darken(lay, drop & ~hm, (0.6, 0.54, 0.6))
        darken(lay, drop & hm, (0.86, 0.72, 0.7))         # (on the face: a warm skin shadow)
        lay = over(lay, pl)
    b.img = lay


if __name__ == '__main__':
    OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kapral_Bust.png')
    b = Bust('People3_7')
    S = b.img.shape
    MOUS = [(132, 167), (144, 160), (157, 158), (170, 160), (179, 166), (174, 170), (160, 166), (148, 167), (138, 172)]
    mt = ((14, 10, 10), (34, 26, 26), (64, 54, 54), (8, 6, 6))
    ml = cel(S, [MOUS], mt[:3], lw=1.3, shade=2.5, light=1.4, ldir=LDIR)
    ml = over(ml, hair_strands(S, erode_cv(ml[..., 3] > 0.5, 1), (156, 190), mt[2], mt[3], n=18, length=(4, 7), seed=2))
    b.over(ml)
    # the head that stays: the face (the hair round it goes under the coif); the armour's collar and flares go
    KEEP = b.poly([(80, 60), (240, 60), (240, 150), (220, 180), (200, 200), (140, 206), (96, 160)])
    # the mail coif: round the face (its opening), down over the neck and as a tippet over the shoulders and the tabard's top
    FACE = [(102, 90), (102, 120), (104, 140), (110, 152), (118, 163), (128, 177), (139, 189), (151, 196), (166, 198),
            (179, 196), (190, 187), (198, 172), (204, 156), (208, 140), (210, 120), (210, 90)]
    COIF = [(86, 96), (254, 92), (254, 135), (250, 170), (246, 192), (252, 204), (282, 212), (310, 224), (330, 232)] + TIPPET_HEM \
        + [(0, 242), (36, 226), (70, 212), (98, 200), (92, 184), (87, 160), (86, 130)]
    COIF_SHADE = [[(222, 90), (262, 90), (262, 214), (240, 214), (232, 180), (226, 140)],
                  [(250, 214), (330, 236), (330, 270), (260, 250), (240, 222)]]
    guard_body(b, KEEP, SHIRT, TABARD, TAB_SHADE, FOLDS, HORSE_AT,
               ['HEAD', dict(poly=COIF, sag=lambda x: -0.0008 * (x - 160) ** 2, holes=[FACE], shade=COIF_SHADE)], chin=None)
    hat = kettle_hat(S, 158, 92, 82, 70, 124, 22, rot=-4, brim_dy=4)
    put_hat(b, hat, shadow=(120, 110, 130), shadow_k=0.55, sdx=2, sdy=10)
    b.save(OUT)
    print('ok', OUT)
