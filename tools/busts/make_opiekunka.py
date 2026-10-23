# Ciotka Stefa (the keeper of the new Podgrodzie's poorhouse, a sturdy kind woman of about 55 - docs/podgrodzie/NOWE_PODGRODZIE.md,
# TownLife 2951, 2026-10-22): SF_People1_8 (the old woman in the pink sweater) repainted to her map sheet ($Npc_Opiekunka) - the
# face made younger (the deep wrinkles softened), weathered, with rosy cheeks; the grey hair hidden under a painted WHITE linen
# headscarf tied under the chin (a knot and two short ends; a strip of the grey fringe left at the forehead); the green scarf and
# the pink sweater gone: a new painted body - the neck, a long faded DARK NAVY wool dress with a small white collar and a darker
# patch on the shoulder, and the top of a big off-white apron (the bib on two straps, soup stains).
# 0 PixelLab generations. Run: python tools/busts/make_opiekunka.py [out.png]
import sys
from kit import *
from patches import smudge, patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Opiekunka_Bust.png')
b = Bust('SF_People1_8')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir that puts the shade on the far, lower-right side: lit from the upper left)
TALL = (H + 40, W)


def cel_b(polys, tones, **kw):
    """cel() on a canvas taller than the bust, cropped: no shade band or line along the frame's bottom edge."""
    return cel(TALL, polys, tones, ldir=LD, **kw)[:H]


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


def blot(cx, cy, r, seed, n=16):
    rng = np.random.RandomState(seed)
    return [(cx + np.cos(t) * r[0] * rng.uniform(0.6, 1.15), cy + np.sin(t) * r[1] * rng.uniform(0.6, 1.15))
            for t in np.linspace(0, 2 * np.pi, n, endpoint=False)]


# ---------- the face: younger (about 55, not 80 - the wrinkles softened), weathered, rosy cheeks, kind tired eyes ----------
skin = b.sel(hue=(0, 42), sat=(0.08, 0.7), val=(0.55, 1), box=(88, 80, 214, 202))
FEATURES = b.poly([(100, 110), (132, 110), (134, 137), (100, 138)], [(148, 106), (184, 106), (184, 135), (148, 135)],     # eyes + brows
                  [(130, 146), (152, 146), (152, 158), (130, 158)],                                                    # the nose's tip
                  [(116, 165), (178, 165), (178, 175), (116, 175)], [(130, 176), (146, 176), (146, 184), (130, 184)])   # the mouth
soft = skin & ~FEATURES
sf = soft.astype(np.float32)
num = cv2.GaussianBlur(b.img[..., :3] * sf[..., None], (0, 0), 2.6)
den = cv2.GaussianBlur(sf, (0, 0), 2.6)[..., None]
blur = np.where(den > 1e-3, num / np.maximum(den, 1e-3), b.img[..., :3])
darker = (luma(blur) - luma(b.img)) > 0.02
k = (soft & darker).astype(np.float32)[..., None] * 0.75
b.img[..., :3] = b.img[..., :3] * (1 - k) + blur * k
b.multiply(skin, (244, 222, 206), 1.0)                      # (a weathered, ruddier tone)
b.over(blush(S, 114, 152, 14, 8, (226, 104, 96), 0.42, clip=skin))
b.over(blush(S, 180, 150, 13, 8, (226, 104, 96), 0.38, clip=skin))
b.over(blush(S, 146, 150, 5, 4, (220, 110, 100), 0.18, clip=skin))   # (the nose's tip a little red)
b.over(strokes(S, [((104, 140), (114, 144), (126, 141), 1.1), ((156, 138), (168, 142), (180, 138), 1.1)], (176, 112, 98), alpha=0.4,
               clip=skin))                                    # (tired: soft shadows under the eyes)

# ---------- the headscarf's shape: its edge round the face (from under the chin round the forehead back under the chin) and its
# outer edge round the head ----------
INNER = smooth([(128, 202), (118, 190), (110, 178), (103, 165), (98, 150), (95, 134), (96, 116), (101, 97), (112, 82), (130, 72), (152, 68),
                (174, 72), (192, 82), (200, 96), (202, 114), (200, 132), (196, 148), (190, 162), (182, 175), (175, 184), (167, 192), (160, 201)])
OUTER = smooth([(166, 212), (184, 214), (200, 208), (214, 194), (224, 174), (231, 148), (233, 118), (230, 88), (220, 60), (204, 40),
                (182, 28), (156, 23), (130, 27), (106, 38), (88, 56), (77, 82), (73, 110), (76, 138), (84, 162), (96, 184), (110, 200),
                (126, 212)])

# ---------- the head cut off along the jaw (the hair outside the scarf goes) ----------
JAW = [(212, 136), (204, 148), (198, 157), (192, 165), (186, 173), (180, 179), (174, 184), (168, 189), (162, 193), (156, 196),
       (150, 198), (144, 199), (138, 199), (132, 198), (126, 194), (120, 186), (114, 179), (108, 171), (102, 162), (96, 147)]
HEAD = [(70, 60), (100, 14), (150, 4), (200, 14), (236, 52), (238, 132)] + JAW + [(72, 147)]
head = take(b.img, b.poly(HEAD) & b.poly(OUTER) & b.op())

# ---------- the new body ----------
SKIN = ((206, 140, 116), (238, 186, 158), (250, 212, 190))
NAVY = ((22, 28, 46), (40, 50, 76), (60, 72, 102), (16, 20, 34))
LINEN = ((156, 150, 136), (216, 210, 196), (236, 232, 222))
FOLD = (14, 18, 30)
body = np.zeros((H, W, 4), np.float32)
NECK = [(120, 168), (194, 160), (196, 214), (204, 236), (196, 262), (108, 262), (102, 236), (114, 214)]
neck = cel_b([NECK], SKIN, lw=2.0, shade=6, light=2)
body = over(body, neck)
nm = neck[..., 3] > 0.5
CHIN_SH = [(98, 160), (206, 152), (200, 190), (184, 204), (164, 212), (142, 214), (124, 208), (110, 196)]
sh = soft_poly(S, [CHIN_SH]) * nm
body[..., :3] = body[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN[0], np.float32) / 255.0 * sh[..., None]
# the dress: a round neckline under the scarf's knot, broad sturdy shoulders
NL = smooth([(206, 220), (190, 230), (170, 236), (150, 238), (130, 236), (110, 230), (96, 222)])
DRESS =[(96, 222), (78, 226), (62, 238), (50, 260), (44, 300), (40, 372), (290, 372), (286, 302), (278, 262), (264, 238), (244, 226),
         (222, 220)] + NL
body = over(body, cel_b([DRESS], NAVY, lw=2.0, shade=10, light=3, shade2=4))
dm = body[..., 3] > 0.5
dress_only = dm & ~nm
# wool: a faint texture and the folds
body = over(body, hair_strands(S, erode_cv(dress_only, 3), (160, 520), NAVY[2], NAVY[3], n=220, length=(3, 6), seed=81, alpha=(0.25, 0.3)))
body = over(body, strokes(S, [((70, 272), (74, 310), (72, 352), 1.8), ((262, 270), (258, 310), (262, 352), 1.8),
                              ((92, 248), (98, 272), (100, 296), 1.4), ((236, 248), (230, 272), (228, 296), 1.4)], FOLD, alpha=0.7,
                          clip=dress_only))
# a small white collar: two round flaps on the neckline
COL_L = smooth([(150, 238), (136, 237), (120, 233), (106, 226), (98, 230), (104, 244), (120, 252), (138, 252), (150, 246)])
COL_R = smooth([(150, 238), (164, 237), (180, 233), (196, 225), (206, 228), (200, 242), (184, 251), (164, 252), (150, 246)])
body = over(body, cel_b([COL_L, COL_R], LINEN, lw=1.6, shade=3, light=1.2))
b.img = body
# a darker sewn-on patch on the near shoulder
b.img = patch(b.img, [(66, 246), (90, 240), (94, 264), (70, 270)], erode_cv(dress_only, 2), lift=0.82, hue=(222, 0.32), seed=83)
body = b.img
# the apron: the bib on two straps over the shoulders, stained
BIB = [(108, 300), (214, 298), (222, 372), (100, 372)]
STRAP = [[(108, 300), (120, 300), (116, 262), (108, 236), (100, 238), (106, 262)],
         [(202, 299), (214, 298), (220, 262), (226, 236), (218, 234), (210, 262)]]
body = over(body, cel_b(STRAP, LINEN, lw=1.5, shade=2.5, light=1.0))
body = over(body, cel_b([BIB], LINEN, lw=2.0, shade=7, light=2.5))
b.img = body
bib_m = erode_cv(poly_mask((W, H), BIB) > 0.5, 3)
b.over(strokes(S, [((112, 308), (160, 306), (210, 306), 1.0), ((136, 330), (134, 342), (135, 352), 1.4),
                   ((186, 328), (188, 340), (187, 352), 1.4)], LINEN[0], alpha=0.85, clip=bib_m))
SOUP = (164, 92, 64)
for cx, cy, rx, ry, sd, k in ((172, 324, 9, 6, 91, 0.42), (184, 336, 5, 4, 93, 0.36), (128, 340, 6, 5, 95, 0.22)):
    b.img = smudge(b.img, [blot(cx, cy, (rx, ry), sd)], SOUP, k)
    b.img = smudge(b.img, [blot(cx + 1, cy + 1, (rx * 0.5, ry * 0.5), sd + 1)], SOUP, k * 0.6)

# ---------- the head, then the white headscarf over it ----------
b.over(head)
SC_T = ((176, 180, 192), (230, 229, 222), (248, 247, 242), (148, 152, 166))
SCARF = INNER + OUTER
sc = cel_b([SCARF], SC_T, lw=2.0, shade=12, light=3, shade2=5)
scm = sc[..., 3] > 0.5
# folds running from the knot up and over the head, and down the near flap
SF = [((168, 206), (214, 120), (196, 46), 1.6), ((158, 206), (190, 110), (160, 32), 1.4), ((176, 204), (224, 150), (226, 92), 1.4),
      ((120, 204), (86, 150), (90, 70), 1.4), ((112, 196), (88, 160), (84, 118), 1.2), ((128, 40), (110, 52), (96, 70), 1.2),
      ((186, 34), (176, 50), (174, 66), 1.1)]
sc = over(sc, strokes(S, SF, SC_T[3], alpha=0.7, clip=erode_cv(scm, 2)))
# the folded-back hem round the face (a slightly greyer band, only on the scarf)
hem = cel_b([taper(np.asarray(INNER, np.float64), 7.0, 7.0)], ((182, 184, 192), (218, 218, 214), (238, 238, 234)), lw=1.4, shade=2.4,
            light=1.2, clip=np.vstack([scm, np.zeros((TALL[0] - H, W), bool)]))
sc = over(sc, hem)
b.over(sc)
# the knot under the chin and its two short ends
TAILS = [smooth([(141, 213), (150, 215), (147, 232), (140, 236), (136, 230)]), smooth([(148, 213), (158, 213), (166, 228), (161, 235), (154, 230)])]
b.over(cel_b(TAILS, SC_T, lw=1.6, shade=3, light=1.2))
KNOT = ellipse(147, 210, 10, 7, 0.1, 24)
b.over(cel_b([KNOT], SC_T, lw=1.8, shade=4, light=1.5))
b.over(strokes(S, [((141, 207), (147, 212), (153, 214), 1.0)], SC_T[3], alpha=0.7))

b.save(OUT)
print('ok', OUT)
