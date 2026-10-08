# Marta Ługowa (the washerwoman of Podgrodzie, a tired widow of about 45-50): SF_People1_6 repainted (the nun of People2_6
# made a poor match) - the long dark hair hidden under a painted grey-blue linen headscarf tied at the nape (its tails over
# the shoulder; dark brown strands, a few grey, left at the forehead and the temples), the face aged (crow's feet, lines and
# shadows under the eyes, forehead and smile lines, dark grey-brown eyes), the braid, cardigan and top gone: a new painted
# body - the neck, a patched grey-brown wool dress with a V neck and a stained off-white apron bib on a neck strap.
# Run: python tools/busts/make_praczka.py [out.png]
import sys
from kit import *
from patches import smudge, patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Praczka_Bust.png')
b = Bust('SF_People1_6')
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


# ---------- hair: the dark green-grey -> dark brown; the purple eyes -> dark grey-brown ----------
hair = b.sel(hue=(40, 140), sat=(0.05, 0.6), val=(0, 0.75)) | b.sel(lum=(0, 0.2), box=(60, 0, 250, 140))
hair &= ~b.sel(hue=(0, 40), sat=(0.15, 1), val=(0.6, 1))
b.ramp(hair, RAMPS['hair_dark'], gain=1.25)
EYES = [(88, 96), (122, 94), (124, 116), (88, 118)], [(140, 92), (182, 90), (182, 114), (140, 114)]
iris = b.sel(hue=(250, 345), sat=(0.12, 1), polys=EYES)
b.ramp(iris, [(0.0, (26, 18, 16)), (0.25, (58, 42, 34)), (0.5, (96, 76, 62)), (0.75, (140, 120, 104)), (1.0, (196, 182, 168))])
# a few grey strands in the fringe
b.over(strokes(S, [((150, 58), (136, 66), (122, 86), 1.0), ((154, 60), (168, 66), (180, 82), 1.0), ((144, 62), (126, 74), (108, 96), 0.9)],
               (168, 160, 152), alpha=0.75, clip=hair, taper_to=0.2))

# ---------- the face aged and tired ----------
skin = b.sel(hue=(0, 40), sat=(0.08, 0.6), val=(0.6, 1), box=(84, 60, 200, 180))
b.over(blush(S, 106, 121, 12, 4, (150, 100, 120), 0.24, clip=skin))
b.over(blush(S, 163, 118, 13, 4, (150, 100, 120), 0.24, clip=skin))
WR = (176, 108, 96)
b.over(strokes(S, [((97, 117), (107, 121), (118, 117), 1.2), ((149, 114), (161, 119), (174, 114), 1.2),     # bags under the eyes
                   ((182, 99), (186, 97), (191, 95), 1.0), ((183, 104), (188, 104), (193, 104), 1.0), ((182, 109), (186, 111), (190, 114), 1.0),
                   ((146, 72), (156, 70), (166, 72), 1.0), ((149, 78), (159, 76), (169, 78), 0.9),        # forehead
                   ((123, 136), (116, 143), (118, 151), 1.2), ((152, 140), (157, 146), (156, 154), 1.1),  # smile lines
                   ((124, 152), (122, 155), (121, 158), 0.9), ((151, 152), (153, 155), (154, 158), 0.9)], WR, alpha=0.55, clip=skin))
# a weathered, ruddier tone
b.multiply(skin, (246, 226, 214), 1.0)

# ---------- the headscarf's shape: its edge round the face (over the jaw's back and down the neck) and its outer edge ----------
INNER = smooth([(117, 188), (117, 172), (110, 162), (102, 153), (96, 143), (91, 124), (89, 104), (94, 80), (110, 62), (136, 52),
                (162, 52), (184, 60), (196, 76), (197, 96), (194, 120), (191, 140), (190, 156)])
OUTER = smooth([(198, 172), (208, 182), (220, 174), (230, 156), (234, 132), (233, 104), (228, 74), (214, 42), (194, 20), (172, 9),
                (150, 5), (124, 8), (102, 17), (86, 30), (74, 48), (67, 70), (66, 96), (70, 124), (76, 150), (84, 172), (96, 186),
                (108, 190)])

# ---------- the head cut off along the jaw (the hair outside the scarf goes) ----------
JAW = [(194, 132), (190, 140), (186, 146), (182, 151), (178, 156), (174, 161), (170, 164), (166, 167), (162, 170), (158, 172),
       (154, 174), (150, 175), (146, 177), (140, 178), (134, 177), (130, 175), (126, 172), (122, 168), (118, 165), (114, 162),
       (110, 158), (106, 153), (102, 147), (98, 143)]
HEAD = [(70, 60), (100, 14), (150, 4), (200, 14), (234, 52), (236, 132)] + JAW + [(72, 143)]
head = take(b.img, b.poly(HEAD) & b.poly(OUTER + [(150, 200)]) & b.op())

# ---------- the new body ----------
SKIN = ((214, 148, 124), (244, 190, 162), (252, 216, 194))
DRESS_T = ((86, 76, 64), (118, 106, 90), (148, 136, 118), (66, 58, 50))
LINEN = ((150, 142, 124), (212, 204, 186), (232, 226, 212))
FOLD = (62, 54, 46)
body = np.zeros((H, W, 4), np.float32)
NECK = [(118, 150), (186, 140), (190, 206), (204, 230), (196, 270), (106, 270), (104, 230), (116, 206)]
neck = cel_b([NECK], SKIN, lw=2.0, shade=6, light=2)
body = over(body, neck)
nm = neck[..., 3] > 0.5
CHIN_SH = [(96, 140), (196, 130), (192, 168), (178, 180), (160, 188), (142, 192), (126, 188), (114, 178)]
sh = soft_poly(S, [CHIN_SH]) * nm
body[..., :3] = body[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN[0], np.float32) / 255.0 * sh[..., None]
body = over(body, strokes(S, [((124, 206), (136, 210), (146, 208), 1.2), ((158, 208), (170, 210), (182, 204), 1.2)], (196, 128, 108),
                          alpha=0.6, clip=nm & ~(sh > 0.5)))     # (the collarbones)
VN = [(192, 192), (172, 220), (152, 246), (132, 220), (112, 194)]
DRESS = ([(112, 194), (86, 200), (64, 212), (50, 236), (44, 280), (40, 372), (278, 372), (274, 290), (266, 242), (250, 214),
          (222, 198)] + VN)
body = over(body, cel_b([DRESS], DRESS_T, lw=2.0, shade=9, light=3, shade2=4))
dm = body[..., 3] > 0.5
body = over(body, strokes(S, [((66, 262), (70, 300), (68, 352), 1.8), ((252, 262), (250, 300), (252, 352), 1.8),
                              ((90, 236), (100, 262), (102, 290), 1.4), ((230, 236), (222, 262), (220, 290), 1.4),
                              ((84, 300), (88, 326), (86, 352), 1.4)], FOLD, alpha=0.7, clip=dm & ~nm))
# the V's edge: a thin dark hem
body = over(body, strokes(S, [((112, 195), (132, 221), (152, 247), 1.6), ((192, 193), (172, 221), (152, 247), 1.6)], LINE, alpha=1.0,
                          taper_to=1.0))
# a sewn-on patch on the near shoulder
b.img = body
b.img = patch(b.img, [(60, 236), (84, 230), (88, 254), (64, 260)], dm & ~nm, lift=1.12, hue=(30, 0.22), seed=21)
body = b.img
# the apron bib on its neck strap, stained
BIB = [(110, 276), (204, 274), (212, 372), (104, 372)]
STRAP = [[(110, 276), (120, 276), (122, 220), (118, 200), (112, 202), (113, 222)],
         [(194, 275), (204, 274), (194, 220), (190, 198), (184, 199), (186, 222)]]
body = over(body, cel_b(STRAP, LINEN, lw=1.5, shade=2.5, light=1.0))
body = over(body, cel_b([BIB], LINEN, lw=2.0, shade=7, light=2.5))
b.img = body
bib_m = erode_cv(poly_mask((W, H), BIB) > 0.5, 3)
b.over(strokes(S, [((114, 284), (157, 282), (200, 282), 1.0), ((136, 312), (133, 330), (134, 352), 1.4),
                   ((180, 310), (183, 330), (182, 352), 1.4)], LINEN[0], alpha=0.85, clip=bib_m))
STAIN = (150, 128, 100)
for cx, cy, rx, ry, sd, k in ((128, 318, 9, 6, 31, 0.32), (176, 336, 11, 7, 33, 0.28), (160, 300, 5, 4, 35, 0.3), (122, 344, 6, 5, 37, 0.25)):
    b.img = smudge(b.img, [blot(cx, cy, (rx, ry), sd)], STAIN, k)
    b.img = smudge(b.img, [blot(cx + 1, cy + 1, (rx * 0.5, ry * 0.5), sd + 1)], STAIN, k * 0.5)

# ---------- the head, then the headscarf over it ----------
b.over(head)
SC_T = ((82, 96, 106), (118, 134, 144), (156, 170, 178), (64, 76, 86))
SCARF = INNER + OUTER
TAILS = [[(206, 184), (217, 186), (230, 212), (224, 222), (215, 206)],
         [(214, 182), (224, 178), (244, 200), (238, 210)]]
KNOT = ellipse(214, 182, 8, 6, 0.4, 24)
b.over(cel_b(TAILS, SC_T, lw=1.8, shade=4, light=1.5, shade2=None))
sc = cel_b([SCARF], SC_T, lw=2.0, shade=8, light=3, shade2=3)
scm = sc[..., 3] > 0.5
# folds running from the knot up and over the head, and down the left flap
SF = [((212, 172), (222, 110), (204, 40), 1.6), ((204, 174), (194, 92), (160, 22), 1.5), ((200, 176), (166, 100), (118, 30), 1.4),
      ((222, 166), (232, 126), (228, 86), 1.3), ((84, 172), (74, 140), (80, 80), 1.3), ((92, 174), (84, 150), (84, 116), 1.1)]
sc = over(sc, strokes(S, SF, SC_T[3], alpha=0.7, clip=erode_cv(scm, 2)))
# the folded-back hem round the face (a lighter band)
hem = cel_b([taper(np.asarray(INNER, np.float64), 7.0, 7.0)], ((108, 124, 134), (146, 162, 170), (176, 188, 194)), lw=1.4, shade=2.4,
            light=1.2)
sc = over(sc, hem)
b.over(sc)
b.over(cel_b([KNOT], SC_T, lw=1.8, shade=4, light=1.5))

b.save(OUT)
print('ok', OUT)
