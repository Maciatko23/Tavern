# Wit Zduń (the potter of the new Podgrodzie, Map111 - docs/podgrodzie/NOWE_PODGRODZIE.md, 2026-10-22; lean, wiry, about 35):
# SF_Actor1_3 repainted to his map sheet ($Npc_Garncarz) - the tall red spikes cut down to short CURLY REDDISH-BROWN hair tied
# with a GREY CLOTH HEADBAND over the forehead (a knot and two tails at the back), hazel eyes, a short scruffy reddish-brown
# beard with the moustache, a weathered tanned face with a smudge of clay on the cheek; the blue hoodie gone: a faded
# BRICK-RED linen tunic (round neck, no hood) under a long GREY LEATHER APRON (the bib with a strap round the neck) smeared and
# speckled with dried clay.
# 0 PixelLab generations. Run: python tools/busts/make_garncarz.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Garncarz_Bust.png')
b = Bust('SF_Actor1_3')
S = b.img.shape
LD = (0.55, 0.83)
op = b.op()


def scallop(path, r=4.0, step=9.0, seed=1):
    """A curly outline: bumps (half circles of radius ~r) along a path, bulging to its left (outwards for a clockwise
    outline on the screen)."""
    rng = np.random.RandomState(seed)
    p = np.asarray(path, np.float64)
    seglen = np.linalg.norm(np.diff(p, axis=0), axis=1)
    t = np.concatenate([[0], np.cumsum(seglen)])
    n = max(int(t[-1] / step), 2)
    out = []
    rr = r
    for i in range(n * 6 + 1):
        s = t[-1] * i / (n * 6)
        k = min(np.searchsorted(t, s, side='right') - 1, len(p) - 2)
        f = (s - t[k]) / max(seglen[k], 1e-6)
        q = p[k] + (p[k + 1] - p[k]) * f
        d = (p[k + 1] - p[k]) / max(seglen[k], 1e-6)
        nrm = np.array([d[1], -d[0]])
        ph = (i % 6) / 6.0
        if i % 6 == 0:
            rr = r * rng.uniform(0.55, 1.45)
        out.append(tuple(q + nrm * rr * np.sin(np.pi * ph)))
    return out


def curls(shape, mask, n, col, r=(2.5, 4.5), width=1.3, alpha=0.6, seed=1, dxy=(0, 0)):
    """Small C-shaped strokes (curls) at random places inside mask."""
    rng = np.random.RandomState(seed)
    ys, xs = np.nonzero(mask)
    pick = rng.choice(len(xs), min(n, len(xs)), replace=False)
    lines = []
    for k in pick:
        c = np.array([xs[k] + dxy[0], ys[k] + dxy[1]], np.float64)
        a = rng.uniform(0, 2 * np.pi)
        rr = rng.uniform(*r)
        p0 = c + rr * np.array([np.cos(a), np.sin(a)])
        p1 = c + rr * 1.7 * np.array([np.cos(a + 1.3), np.sin(a + 1.3)])
        p2 = c + rr * np.array([np.cos(a + 2.6), np.sin(a + 2.6)])
        lines.append((tuple(p0), tuple(p1), tuple(p2), width * rng.uniform(0.8, 1.2)))
    return strokes(shape, lines, col, alpha=alpha, clip=mask, taper_to=0.35)


# ---------- what stays of the base: the face, the ear, the neck (the rest is repainted or goes) ----------
EAR = [(185, 124), (194, 118), (205, 122), (208, 140), (204, 158), (196, 167), (187, 164)]
FACEK = [(84, 112), (82, 132), (88, 152), (98, 172), (110, 190), (110, 206), (204, 206), (206, 178), (210, 150), (210, 124), (202, 106),
         (170, 98), (120, 104)]
TORSO = [(110, 206), (86, 214), (64, 226), (58, 242), (63, 264), (66, 300), (66, 380), (266, 380), (265, 300), (267, 262), (271, 242),
         (262, 226), (236, 214), (206, 206)]
ARM_L = [(70, 222), (50, 230), (33, 246), (21, 270), (14, 304), (10, 380), (70, 380), (68, 300), (65, 262), (60, 242)]
ARM_R = [(254, 220), (278, 232), (295, 250), (306, 276), (312, 314), (316, 380), (263, 380), (265, 300), (268, 262), (270, 240)]
NECK = [(116, 192), (119, 226), (130, 244), (150, 252), (168, 248), (180, 234), (188, 212), (194, 192)]   # the tunic's round neck (cut out)
HAIR_PATH = [(84, 108), (80, 94), (82, 80), (90, 68), (102, 59), (116, 52), (132, 47), (150, 45), (168, 46), (186, 50), (201, 57), (213, 67),
             (222, 79), (228, 93), (231, 108), (232, 124), (230, 140), (226, 154), (219, 164)]
HP = scallop(HAIR_PATH, r=2.8, step=7.0, seed=3) + [(210, 166), (208, 140), (204, 118), (196, 106), (170, 100), (140, 102), (110, 106)]
keep = b.poly(FACEK) | b.poly(TORSO, ARM_L, ARM_R) | b.poly(NECK) | b.poly(HP)
b.erase(op & ~keep)
skin = b.sel(hue=(10, 48), sat=(0.15, 0.75), val=(0.45, 1)) & b.poly(FACEK, NECK)

# ---------- the face: weathered, tanned; hazel eyes; reddish-brown brows ----------
b.multiply(skin, (232, 200, 172), 0.38)
EYES_L = [(86, 132), (120, 132), (120, 154), (86, 154)]
EYES_R = [(136, 126), (176, 126), (176, 148), (136, 148)]
iris = b.sel(hue=(185, 250), sat=(0.15, 1), polys=[EYES_L, EYES_R])
b.ramp(iris, [(0.0, (24, 16, 10)), (0.3, (66, 46, 26)), (0.6, (110, 84, 48)), (0.9, (156, 128, 82))])
HAIR_RB = [(0.0, (26, 10, 6)), (0.15, (62, 26, 14)), (0.3, (100, 44, 24)), (0.45, (136, 64, 34)), (0.6, (166, 88, 50)), (0.8, (194, 118, 72)),
           (1.0, (216, 148, 100))]
brows = b.sel(hue=(330, 40), sat=(0.25, 1), val=(0.1, 0.75), polys=[[(82, 118), (114, 118), (114, 134), (82, 134)], [(130, 112), (176, 112), (176, 132), (130, 132)]])
b.ramp(brows, HAIR_RB, gain=0.9)
# the hair left on the temples under the band (the base's side tufts)
side = b.sel(hue=(345, 30), sat=(0.25, 1), val=(0.2, 1), box=(76, 100, 100, 140)) | b.sel(hue=(345, 30), sat=(0.25, 1), val=(0.2, 1), box=(170, 100, 212, 150))
side &= ~skin & ~b.poly(EAR)
b.ramp(b.grow(side, 1, 0.3) & ~b.poly(EAR) & ~skin, HAIR_RB, gain=0.95)
# lines of a man who works in the sun: under the eyes, the fold by the nose, a hollow cheek
WR = (176, 120, 96)
b.over(strokes(S, [((92, 156), (102, 160), (114, 158), 1.2), ((146, 150), (158, 154), (170, 150), 1.2), ((124, 156), (120, 166), (122, 175), 1.3),
                   ((100, 160), (104, 170), (110, 180), 1.4), ((178, 104), (184, 112), (186, 120), 1.0)], WR, alpha=0.5))
b.over(blush(S, 168, 160, 12, 8, (196, 140, 112), 0.25))   # (the shade under the cheekbone)
# a smudge of dried clay on the cheek
b.over(dots(S, [(156, 160, 1.3), (161, 162, 1.0), (165, 159, 0.8), (159, 165, 0.7)], (196, 186, 166), alpha=0.75))

# ---------- the side of the neck under the ear, in the shade (the hood's lining was there); the neck's leftovers of the hoodie ----------
nk = b.poly(NECK)
b.ramp(b.sel(hue=(190, 330), sat=(0.12, 1)) & nk, [(0.0, (60, 30, 24)), (0.4, (130, 80, 60)), (0.7, (176, 120, 92)), (1.0, (206, 156, 122))])
NECKSIDE = [(184, 158), (204, 154), (210, 162), (212, 184), (214, 210), (158, 210), (174, 192), (182, 176)]
b.over(cel(S, [NECKSIDE], ((156, 104, 80), (178, 122, 94), (190, 136, 104)), outline=False, shade=5, light=0, ldir=LD))
b.over(cel(S, [[(184, 158), (204, 154), (210, 166), (196, 178), (182, 186), (170, 196)]], ((146, 94, 72), (146, 94, 72), (146, 94, 72)),
           outline=False, shade=0, light=0))
b.over(strokes(S, [((206, 164), (212, 184), (214, 210), 1.8)], LINE, alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((196, 190), (200, 200), (206, 208), 1.2)], (150, 98, 76), alpha=0.6))   # (a tendon of the neck)
b.over(strokes(S, [((150, 206), (172, 200), (190, 186), 1.4)], (150, 96, 74), alpha=0.5))   # (the jaw's shadow on the neck)

# ---------- a short scruffy reddish-brown beard, the moustache, the sideburns ----------
BT = ((84, 36, 20), (122, 58, 32), (160, 88, 52), (56, 22, 12))
OUTER = [(186, 130), (187, 150), (184, 168), (176, 186), (162, 200), (144, 210), (126, 208), (110, 198), (98, 182), (90, 164), (86, 146),
         (85, 128)]
INNER = [(92, 132), (96, 150), (104, 168), (116, 184), (128, 192), (142, 193), (156, 188), (168, 178), (175, 164), (179, 148), (181, 132)]
b.over(beard2(S, OUTER, INNER, BT, flow=(140, 250), seed=31, n=150, tip=4, out=2.2, seg=7))
MOUS = [(116, 178), (124, 172), (136, 169), (148, 170), (158, 174), (164, 181), (158, 180), (146, 177), (134, 177), (124, 180), (116, 184)]
b.over(cel(S, [MOUS], BT[:3], lw=1.4, shade=2.5, light=1.2, ldir=LD))
b.over(hair_strands(S, erode_cv(b.poly(MOUS), 1), (140, 186), BT[2], BT[3], n=22, length=(4, 8), seed=33))
# the mouth: a closed line between the moustache and the beard
b.over(strokes(S, [((124, 186), (138, 188), (152, 185), 1.5)], (110, 60, 50), alpha=0.9, taper_to=0.5))
# the sideburns down from the band to the beard
SB_R = [(174, 106), (188, 108), (189, 122), (187, 140), (180, 142), (176, 124)]
SB_L = [(82, 110), (92, 112), (94, 130), (88, 136), (83, 126)]
b.over(cel(S, [SB_R, SB_L], BT[:3], lw=1.3, shade=2, light=1, ldir=LD))
b.over(hair_strands(S, b.poly(SB_R, SB_L), (186, 170), BT[2], BT[3], n=20, length=(4, 7), seed=35))
# stubble on the neck under the beard
b.over(stubble(S, [(116, 206), (176, 202), (170, 220), (124, 222)], (90, 50, 34), density=0.25, seed=37, alpha=0.45))

# ---------- the hair: short reddish-brown curls ----------
HT = ((92, 40, 22), (132, 62, 34), (170, 94, 56), (62, 24, 12))
ear = b.poly(EAR)
lay = cel(S, [HP], HT[:3], lw=2.0, shade=10, light=3, shade2=4, ldir=LD, clip=~ear)
hm = erode_cv(lay[..., 3] > 0.5, 2)
lay = over(lay, curls(S, hm, 150, HT[3], seed=41, alpha=0.75))
lay = over(lay, curls(S, hm & ~shift(hm, -8, -8), 70, HT[2], seed=43, alpha=0.6))
lay = over(lay, curls(S, hm, 60, (194, 120, 74), r=(2.0, 3.5), seed=45, alpha=0.45, dxy=(-1, -1)))
b.over(lay)
# the ear, painted anew over the hair behind it
EAR2 = [(187, 124), (192, 117), (201, 117), (207, 125), (208, 140), (204, 154), (197, 163), (190, 163), (187, 150)]
b.over(cel(S, [EAR2], ((190, 128, 98), (218, 162, 126), (234, 186, 150)), lw=1.6, shade=3, light=1.2, ldir=LD))
b.over(strokes(S, [((198, 126), (204, 138), (199, 152), 1.3), ((192, 134), (195, 142), (192, 150), 1.1)], (150, 92, 70), alpha=0.85))

# ---------- the headband: grey cloth over the forehead, a knot and two tails at the back ----------
GT = ((92, 92, 88), (126, 126, 120), (158, 158, 150), (70, 70, 66))
BAND = [(80, 98), (96, 91), (124, 86), (156, 83), (184, 85), (206, 91), (222, 99), (234, 108), (236, 120), (226, 116), (212, 110), (194, 105),
        (170, 101), (146, 101), (120, 105), (98, 111), (84, 117), (79, 108)]
TAILS = [[(234, 112), (254, 134), (250, 142), (230, 120)], [(230, 118), (240, 148), (232, 152), (224, 122)]]
b.over(cel(S, TAILS, GT[:3], lw=1.5, shade=3, light=1.4, ldir=LD))
b.over(cel(S, [BAND], GT[:3], lw=1.8, shade=5, light=2, shade2=2.5, ldir=LD))
b.over(cel(S, [ellipse(233, 113, 8, 6, 0.5)], GT[:3], lw=1.5, shade=2.5, light=1.2, ldir=LD))
bm = b.poly(BAND)
b.over(strokes(S, [((90, 104), (130, 94), (180, 93), 1.2), ((150, 92), (190, 94), (226, 108), 1.1), ((100, 110), (140, 101), (170, 98), 1.0)],
               GT[3], alpha=0.5, clip=erode_cv(bm, 1), taper_to=0.3))
# the band's shadow on the forehead, a clay fingerprint on the cloth
b.multiply(b.poly([(84, 117), (98, 111), (120, 105), (146, 101), (170, 101), (194, 105), (196, 109), (170, 106), (146, 106), (120, 110),
                   (100, 116), (86, 121)]) & skin, (170, 120, 110), 0.55)
b.over(blush(S, 118, 97, 7, 4, (170, 160, 140), 0.5, clip=bm))

# ---------- the tunic: faded brick-red linen, round neck; the body and the two arms beside it ----------
RT = ((104, 42, 30), (146, 66, 46), (176, 94, 70), (82, 30, 22))
tun = cel(S, [TORSO], RT[:3], lw=2.0, shade=10, light=3, shade2=4, ldir=LD, holes=[NECK])
tun = over(tun, cel(S, [ARM_L], RT[:3], lw=2.0, shade=9, light=3.5, shade2=4, ldir=LD))
tun = over(tun, cel(S, [ARM_R], RT[:3], lw=2.0, shade=12, light=2, shade2=6, ldir=LD))
tm = tun[..., 3] > 0.5
# folds: from the shoulders down the arms, under the arms, the cloth bunched over the belt line
FOLDS = [((44, 250), (34, 278), (30, 320), 1.6), ((56, 262), (52, 300), (50, 344), 1.3), ((282, 250), (292, 280), (298, 320), 1.6),
         ((274, 270), (282, 306), (286, 346), 1.3), ((84, 226), (74, 238), (68, 252), 1.4), ((240, 222), (256, 232), (264, 246), 1.4),
         ((78, 280), (86, 300), (84, 330), 1.3), ((250, 276), (244, 306), (248, 340), 1.3)]
tun = over(tun, strokes(S, FOLDS, RT[3], alpha=0.6, clip=erode_cv(tm, 2), taper_to=0.2))
tun = over(tun, strokes(S, [((x0 - 2, y0), (xm - 2, ym), (x1 - 2, y1), 1.0) for (x0, y0), (xm, ym), (x1, y1), _ in FOLDS], RT[2], alpha=0.4,
                        clip=erode_cv(tm, 2), taper_to=0.2))
# the neck's hem: a darker rolled edge
tun = over(tun, strokes(S, [((116, 196), (119, 226), (130, 244), 2.4), ((130, 244), (150, 253), (168, 248), 2.4), ((168, 248), (182, 232), (194, 196), 2.4)],
                        RT[0], alpha=0.85, clip=tm, taper_to=1.0))
b.over(tun)
from patches import patch
b.img = patch(b.img, [(24, 300), (46, 296), (50, 322), (28, 326)], erode_cv(b.poly(ARM_L), 3), lift=0.88, hue=(16, 0.45), seed=47)

# ---------- the apron: long grey leather, the bib, a strap round the neck, dried clay ----------
AT = ((88, 88, 82), (120, 118, 110), (146, 144, 134), (66, 66, 60))
STRAPS = [taper(bez((120, 262), (118, 232), (118, 204), 16), 5, 5), taper(bez((206, 258), (200, 232), (194, 204), 16), 5, 5)]
b.over(cel(S, STRAPS, ((70, 52, 36), (104, 76, 50), (132, 100, 68)), lw=1.4, shade=1.5, light=1, ldir=LD, clip=tm))
BIB = [(110, 264), (214, 258), (220, 300), (228, 380), (100, 380), (105, 300)]
ap = cel(S, [BIB], AT[:3], lw=2.0, shade=7, light=1.2, shade2=3, ldir=LD)
am = erode_cv(ap[..., 3] > 0.5, 2)
# the stitched hem along the top and the sides, a fold or two of the stiff leather
ap = over(ap, strokes(S, [((136, 272), (134, 310), (130, 350), 1.4), ((192, 268), (196, 310), (200, 350), 1.4)], AT[3], alpha=0.5, clip=am))
st = [((x, 267 - (x - 112) * 0.06), (x + 2, 267 - (x + 2 - 112) * 0.06), (x + 4, 267 - (x + 4 - 112) * 0.06), 0.9) for x in range(114, 210, 7)]
ap = over(ap, strokes(S, st, (150, 146, 136), alpha=0.8, clip=am, taper_to=1.0))
b.over(ap)
# the rivets where the strap meets the bib
b.over(dots(S, [(120, 268, 2.0), (206, 263, 2.0)], (60, 56, 50)))
b.over(dots(S, [(119.5, 267.5, 0.9), (205.5, 262.5, 0.9)], (176, 170, 156)))
# dried clay: warm light-grey smears where he wipes his hands, specks; a little on the sleeves
CLAY = (178, 166, 146)
for (cx, cy, rx, ry, a) in [(132, 312, 14, 9, 0.45), (148, 324, 9, 6, 0.35), (198, 330, 13, 8, 0.4), (178, 290, 8, 5, 0.3), (122, 340, 8, 6, 0.3)]:
    b.over(blush(S, cx, cy, rx, ry, (150, 134, 112), a, clip=am))
b.over(blush(S, 134, 310, 7, 4, CLAY, 0.45, clip=am))
b.over(blush(S, 200, 328, 6, 4, CLAY, 0.4, clip=am))
rng = np.random.RandomState(51)
spk = [(rng.uniform(112, 220), rng.uniform(274, 350), rng.uniform(0.8, 1.6)) for _ in range(26)]
b.over(dots(S, spk, (196, 186, 166), alpha=0.7, clip=am))
b.over(blush(S, 36, 336, 14, 8, (160, 150, 134), 0.35, clip=tm))
b.over(blush(S, 294, 330, 12, 7, (160, 150, 134), 0.3, clip=tm))
b.save(OUT)
print('ok', OUT)
