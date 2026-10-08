# Hanka Mączna (the baker, plump, middle-aged): People4_2 repainted - the white frilled cap kept, the ash hair a warm mid
# brown, the face made fuller (the cheeks and jaw gently inflated, laugh lines, rosy cheeks, flour on the cheek), the orange
# cape with its high collar gone: a new painted body - a thick neck, a blue dress with a round white-trimmed neckline and
# short puffed sleeves with white cuffs (bare upper arms below), a white apron bib on straps, flour on the bib and dress.
# Run: python tools/busts/make_piekarka.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Piekarka_Bust.png')
b = Bust('People4_2')
S = b.img.shape
H, W = S[:2]

# ---------- hair: the ash-pink of the base -> warm mid brown ----------
HAIR_AREA = [(96, 96), (112, 72), (150, 62), (196, 68), (226, 92), (233, 130), (229, 170), (223, 194), (211, 194), (210, 150),
             (198, 130), (178, 110), (153, 90), (142, 97), (126, 112), (113, 130), (108, 150), (108, 175), (111, 196), (99, 196),
             (93, 150)]
EAR = [(207, 132), (226, 126), (231, 150), (227, 180), (214, 190), (206, 170)]
hair = (b.sel(poly=HAIR_AREA) & ~b.sel(hue=(185, 270)) & ~b.sel(sat=(0.27, 1), val=(0.74, 1)) & ~b.sel(sat=(0, 0.14), val=(0.45, 1))
        & ~b.poly(EAR))
BROWN = [(0.0, (30, 18, 12)), (0.12, (52, 30, 18)), (0.3, (88, 52, 30)), (0.45, (118, 72, 42)), (0.6, (148, 96, 60)),
         (0.8, (186, 136, 92))]
b.ramp(hair, BROWN, gain=0.92)

# ---------- the head (cap, hair, face, bun) cut off above the old collar ----------
JAW = [(201, 204), (200, 205), (196, 207), (192, 210), (188, 212), (184, 215), (180, 218), (176, 220), (172, 224), (168, 224),
       (164, 225), (160, 225), (156, 223), (152, 221), (148, 219), (144, 217), (140, 215), (136, 212), (132, 209), (128, 205),
       (124, 200), (120, 194), (116, 189), (112, 181), (108, 179), (104, 178)]
HEAD = [(0, 0), (330, 0), (330, 210), (237, 210), (230, 216), (220, 220), (211, 221), (205, 219), (203, 212), (202, 205)] + JAW + [(98, 196), (0, 196)]
head_m = b.poly(HEAD) & b.op()


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


head = take(b.img, head_m)
head = inflate(head, 160, 196, 78, 64, 0.16)
head[..., 3] = np.where(head[..., 3] > 0.96, 1.0, np.where(head[..., 3] < 0.04, 0.0, head[..., 3]))
head_a = head[..., 3] > 0.5

# ---------- the new body, painted (lit from the upper left: the shade band on the lower right) ----------
LD = (0.55, 0.83)     # (cel()'s ldir that puts the shade on the far, lower-right side)
SKIN = ((206, 150, 120), (246, 192, 160), (253, 222, 198))
BLUE = ((56, 84, 134), (82, 120, 174), (126, 162, 208), (40, 58, 100))
WHITE = ((176, 178, 196), (234, 234, 240), (252, 252, 252))
FOLD = (44, 64, 108)
TALL = (H + 40, W)


def cel_b(polys, tones, **kw):
    """cel() on a canvas taller than the bust, cropped: no shade band or line along the frame's bottom edge."""
    return cel(TALL, polys, tones, ldir=LD, **kw)[:H]


body = np.zeros((H, W, 4), np.float32)
# the neck and the upper chest in the neckline
NECK = [(140, 196), (204, 196), (208, 230), (220, 246), (216, 280), (128, 280), (126, 246), (136, 230)]
neck = cel_b([NECK], SKIN, lw=2.0, shade=6, light=2)
body = over(body, neck)
# the head's shadow down the neck (a flat tone, like the RTP cel shadows)
nm = neck[..., 3] > 0.5
CHIN_SH = [(120, 196), (220, 196), (214, 226), (200, 236), (184, 243), (166, 245), (150, 242), (138, 236), (128, 226)]
sh = soft_poly(S, [CHIN_SH]) * nm
body[..., :3] = body[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN[0], np.float32) / 255.0 * sh[..., None]
# the dress: shoulders to the frame's bottom, a round neckline
NL = [(216, 240), (210, 250), (198, 258), (182, 263), (166, 264), (150, 261), (138, 253), (130, 243)]
DRESS = ([(130, 243), (110, 244), (84, 249), (58, 260), (38, 280), (24, 306), (16, 332), (12, 372), (322, 372), (318, 330),
          (310, 306), (296, 280), (276, 260), (250, 247), (230, 241)] + NL)
body = over(body, cel_b([DRESS], BLUE, lw=2.0, shade=9, light=3, shade2=4))
# folds: from under the arms and the bust down the bodice
body = over(body, strokes(S, [((84, 300), (90, 326), (88, 352), 2.0), ((250, 302), (244, 328), (246, 352), 2.0),
                              ((108, 270), (100, 284), (96, 300), 1.6), ((232, 266), (240, 282), (242, 298), 1.6),
                              ((92, 318), (106, 306), (118, 304), 1.5), ((226, 304), (238, 306), (252, 318), 1.5)],
                          FOLD, alpha=0.75, clip=body[..., 3] > 0.5))
# the white trim round the neckline, its thin shadow on the dress
nl = bez((130, 243), (166, 284), (216, 240), 30)
dm = body[..., 3] > 0.5
body = over(body, strokes(S, [((130, 247), (166, 290), (216, 244), 7.0)], BLUE[0], alpha=1.0, clip=dm & ~nm, taper_to=0.9))
body = over(body, cel_b([taper(nl, 6.0, 6.0, w_mid=7.5)], WHITE, lw=1.4, shade=2.2, light=1.2))
# the bare upper arms under the short sleeves
ARM_L = [(14, 330), (58, 330), (60, 372), (10, 372)]
ARM_R = [(276, 330), (320, 330), (324, 372), (276, 372)]
body = over(body, cel_b([ARM_L, ARM_R], SKIN, lw=2.0, shade=6, light=2))
# short puffed sleeves with white cuffs
SL_L = [(84, 248), (70, 243), (50, 250), (32, 268), (18, 294), (10, 324), (12, 340), (34, 345), (56, 341), (68, 326), (74, 300),
        (80, 274)]
SL_R = [(250, 246), (266, 240), (286, 247), (304, 266), (316, 292), (322, 322), (321, 340), (300, 345), (278, 341), (266, 326),
        (262, 300), (256, 272)]
body = over(body, cel_b([SL_L, SL_R], BLUE, lw=2.0, shade=8, light=3, shade2=3))
slm = body[..., 3] > 0.5
GATH = [((76, 256), (66, 262), (60, 274), 1.3), ((64, 250), (52, 258), (44, 272), 1.3), ((50, 256), (38, 268), (32, 284), 1.2),
        ((40, 300), (46, 318), (44, 336), 1.4), ((58, 296), (60, 316), (58, 334), 1.3),
        ((258, 254), (268, 260), (274, 272), 1.3), ((272, 248), (284, 256), (292, 270), 1.3), ((286, 254), (298, 266), (304, 282), 1.2),
        ((288, 298), (284, 318), (288, 336), 1.4), ((302, 296), (304, 318), (306, 334), 1.3)]
body = over(body, strokes(S, GATH, FOLD, alpha=0.7, clip=erode_cv(slm, 1) & (poly_mask((W, H), SL_L) + poly_mask((W, H), SL_R) > 0.5)))
CUFF_L = [(12, 330), (40, 336), (66, 330), (66, 340), (40, 347), (12, 342)]
CUFF_R = [(266, 330), (292, 336), (321, 330), (322, 342), (292, 347), (266, 340)]
body = over(body, cel_b([CUFF_L, CUFF_R], WHITE, lw=1.6, shade=3, light=1.4))
# the white apron bib on its straps
BIB = [(124, 292), (218, 290), (226, 372), (116, 372)]
STRAPS = [[(124, 292), (136, 292), (112, 245), (100, 247)], [(207, 291), (219, 290), (246, 243), (234, 242)]]
body = over(body, cel_b(STRAPS, WHITE, lw=1.6, shade=3, light=1.2))
body = over(body, cel_b([BIB], WHITE, lw=2.0, shade=7, light=2.5))
bib_m = poly_mask((W, H), BIB) > 0.5
body = over(body, strokes(S, [((128, 300), (171, 298), (216, 298), 1.0), ((150, 318), (147, 336), (148, 352), 1.4),
                              ((196, 316), (199, 334), (198, 352), 1.4)], WHITE[0], alpha=0.9, clip=erode_cv(bib_m, 2)))
b.img = body

# ---------- flour on the bib and the dress: a dusty blot (two flat steps, ragged edge) and a few specks ----------
def blot(cx, cy, r, seed, n=16):
    rng = np.random.RandomState(seed)
    return [(cx + np.cos(t) * r[0] * rng.uniform(0.6, 1.15), cy + np.sin(t) * r[1] * rng.uniform(0.6, 1.15))
            for t in np.linspace(0, 2 * np.pi, n, endpoint=False)]


def flour(cx, cy, rx, ry, seed, k=0.42, col=(250, 248, 242)):
    b.img = smudge(b.img, [blot(cx, cy, (rx, ry), seed)], col, k)
    b.img = smudge(b.img, [blot(cx - rx * 0.15, cy - ry * 0.1, (rx * 0.55, ry * 0.5), seed + 1)], col, k * 0.6)
    rng = np.random.RandomState(seed + 2)
    pts = [(cx + rng.uniform(-1.6, 1.6) * rx, cy + rng.uniform(-1.5, 1.5) * ry, rng.uniform(0.7, 1.3)) for _ in range(6)]
    b.over(dots(S, pts, col, alpha=0.7, clip=erode_cv(b.op(), 2)))


op0 = b.op()
flour(250, 298, 11, 7, 3)
flour(88, 328, 6, 5, 5, 0.36)
flour(160, 330, 12, 7, 7, 0.3, (214, 210, 200))
b.img[..., 3] = np.where(op0, b.img[..., 3], 0)

# ---------- the head on top: rosy cheeks, laugh lines, a soft second chin ----------
b.over(head)
face = b.sel(hue=(0, 40), sat=(0.15, 0.6), box=(104, 120, 216, 228), src=False)
b.over(blush(S, 134, 192, 14, 8, (236, 108, 100), 0.32, clip=face))
b.over(blush(S, 192, 192, 12, 7, (236, 108, 100), 0.28, clip=face))
WR = (200, 128, 108)
b.over(strokes(S, [((146, 190), (141, 197), (145, 205), 1.4), ((180, 189), (185, 196), (182, 204), 1.4)], WR, alpha=0.6, clip=face))
# a soft second chin on the shadowed neck
b.over(strokes(S, [((150, 237), (166, 245), (184, 236), 1.4)], (176, 118, 94), alpha=0.55, clip=nm & ~head_a, taper_to=0.4))

b.save(OUT)
print('ok', OUT)
