# Matka bohatera (prolog „Ostatni prom”, 2026-10-12): kobieta ok. 35 lat ze wsi Brzozowa Wola - jak na planszach prologu
# (tools/prolog/art/chata.png): kasztanowe włosy pod beżową lnianą chustą zawiązaną na karku, ciepłe brązowe oczy, zmęczona,
# ale młodsza niż praczka; prosta brązowa suknia z dekoltem w serek i cienki rzemyk na szyi. Na bazie make_praczka.py
# (SF_People1_6, ta sama budowa chusty), bez fartucha i łaty. Uruchom: python tools/busts/make_matka.py [out.png]
import sys
from kit import *
from patches import smudge, patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Matka_Bust.png')
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
b.ramp(hair, RAMPS['hair_chestnut'], gain=1.1)
EYES = [(88, 96), (122, 94), (124, 116), (88, 118)], [(140, 92), (182, 90), (182, 114), (140, 114)]
iris = b.sel(hue=(250, 345), sat=(0.12, 1), polys=EYES)
b.ramp(iris, [(0.0, (30, 18, 10)), (0.25, (72, 44, 24)), (0.5, (120, 80, 44)), (0.75, (168, 124, 76)), (1.0, (220, 190, 150))])
# ---------- the face aged and tired ----------
skin = b.sel(hue=(0, 40), sat=(0.08, 0.6), val=(0.6, 1), box=(84, 60, 200, 180))
b.over(blush(S, 106, 121, 12, 4, (150, 100, 120), 0.24, clip=skin))
b.over(blush(S, 163, 118, 13, 4, (150, 100, 120), 0.24, clip=skin))
WR = (176, 108, 96)
b.over(strokes(S, [((99, 117), (107, 120), (116, 117), 1.0), ((151, 114), (161, 118), (172, 114), 1.0)], WR, alpha=0.35, clip=skin))   # (tired eyes)
# a weathered, ruddier tone
b.multiply(skin, (250, 236, 226), 1.0)

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
DRESS_T = ((98, 62, 40), (134, 90, 60), (164, 118, 82), (72, 44, 28))
LINEN = ((150, 142, 124), (212, 204, 186), (232, 226, 212))
FOLD = (70, 42, 26)
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
b.img = body
# a thin leather cord round the neck (she gives the boy the raven pendant: hers stays)
b.over(strokes(S, [((120, 206), (150, 228), (184, 204), 1.4)], (70, 44, 26), alpha=0.95))
# ---------- the head, then the headscarf over it ----------
b.over(head)
SC_T = ((150, 126, 92), (196, 172, 134), (226, 208, 172), (118, 96, 68))
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
hem = cel_b([taper(np.asarray(INNER, np.float64), 7.0, 7.0)], ((176, 152, 114), (214, 194, 156), (236, 222, 190)), lw=1.4, shade=2.4,
            light=1.2)
sc = over(sc, hem)
b.over(sc)
b.over(cel_b([KNOT], SC_T, lw=1.8, shade=4, light=1.5))

b.save(OUT)
print('ok', OUT)
