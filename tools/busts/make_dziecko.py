# Tośka (the girl of the first mud hut, about 7 - the new Podgrodzie's Map111, docs/podgrodzie/NOWE_PODGRODZIE.md, 2026-10-22):
# SF_People1_4 repainted to her map sheet ($Npc_Dziecko) - the peach-blonde bob a STRAW-BLOND, short, unevenly hacked cut (the sides
# cut off jagged above the jaw, a few tufts sticking up), brown eyes, a slightly tanned face with FRECKLES and a grey smear of clay
# on the cheek; the purple varsity jacket, the yellow shirt and the white sleeves gone - one far too big faded OCHRE-BROWN sackcloth
# smock painted over them: a wide neckline gathered on a twine drawstring (knotted at the front), coarse weave, soft folds, a big
# grey patch and grey smears of clay; the striped collar cut away and the neck and the base of the shoulders painted where it stood.
# 0 PixelLab generations. Run: python tools/busts/make_dziecko.py [out.png]
import sys
from kit import *
from patches import patch, smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Dziecko_Bust.png')
b = Bust('SF_People1_4')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # the side kit.cel() puts its shade band on (lower right: the RTP light comes from the upper left)
PAD = 40              # shapes running off the bottom edge are painted on a taller canvas (no shade band along the cut)


def celp(polys, tones, clip=None, **kw):
    """kit.cel() with the shade on the lower right, painted PAD px taller and cut back (no band along the bottom edge)."""
    c = None
    if clip is not None:
        c = np.zeros((H + PAD, W), bool)
        c[:H] = clip
        c[H:] = clip[-1]
    kw.setdefault('ldir', LD)
    return cel((H + PAD, W), polys, tones, clip=c, **kw)[:H]


def flat(polys, col, clip):
    return celp(polys, (col, col, col), clip=clip, outline=False, shade=0, light=0)


def curve(*pts, n=16):
    """A smooth outline through the points (quadratic pieces through the midpoints) -> [(x, y), ...]."""
    p = [np.asarray(q, np.float64) for q in pts]
    out = [tuple(p[0])]
    for i in range(1, len(p) - 1):
        a = (p[i - 1] + p[i]) / 2 if i > 1 else p[0]
        c = (p[i] + p[i + 1]) / 2 if i < len(p) - 2 else p[-1]
        out += [tuple(q) for q in bez(a, p[i], c, n)[1:]]
    return out


def polyline(pts, w):
    """Strokes along a point list (an even line)."""
    return [(pts[i], pts[i + 1], pts[i + 1], w) for i in range(len(pts) - 1)]


EYES = ([(101, 116), (133, 114), (134, 143), (101, 143)], [(154, 114), (192, 114), (192, 143), (154, 143)])
FACE_LOW = [(108, 142), (110, 152), (119, 173), (132, 190), (150, 196), (170, 192), (186, 182), (197, 168), (202, 150), (203, 142)]
skin = b.sel(hue=(17, 34), sat=(0.08, 0.38), val=(0.8, 1), box=(80, 90, 250, 200))
face = b.comp(skin, (150, 150))
ff = fill_holes(face)
ear = b.comp(skin, (210, 140))
eyes = b.poly(*EYES)
protect = dilate_cv(b.poly(FACE_LOW) | ff, 3)

# ---------- the hair: straw blond ----------
HB = (60, 20, 250, 200)
orange = b.sel(hue=(340, 22), sat=(0.37, 1), val=(0.4, 1), box=HB)
pale = b.sel(hue=(35, 75), sat=(0.05, 0.5), val=(0.72, 1), box=HB)
NECKZONE = b.poly([(116, 176), (210, 170), (210, 204), (116, 204)]) & (b.yy > 176)
hair = (orange | pale) & ~eyes & ~b.poly(FACE_LOW) & ~ff & ~NECKZONE
hair = b.grow(hair, 2, 0.3) & region(S, *HB) & ~eyes & ~b.poly(FACE_LOW) & ~ff & ~NECKZONE
rim = b.sel(hue=(60, 130), sat=(0.1, 0.8), val=(0.5, 1), box=HB) & dilate_cv(hair, 3) & ~eyes
lav = b.sel(hue=(200, 352), sat=(0.05, 0.7), box=(176, 140, 216, 200)) & ~eyes & ~ff & ~dilate_cv(ear, 2)
hair |= rim | lav
STRAW = [(0.0, (40, 24, 10)), (0.25, (98, 68, 32)), (0.45, (142, 104, 56)), (0.6, (178, 136, 80)), (0.72, (202, 160, 96)),
         (0.82, (218, 178, 116)), (0.95, (234, 204, 148)), (1.0, (242, 218, 166))]
b.ramp(hair, STRAW)

# the sides hacked short and uneven: everything of the bob below a jagged line beside the jaw cut away (the face's own outline kept)
rng = np.random.RandomState(7)
cut = np.zeros((H, W), bool)
for (x0, x1, y0, y1, zone_y) in [(60, 116, 150, 160, 204), (184, 250, 168, 160, 204)]:
    x = x0
    while x < x1:
        w = rng.randint(7, 13)
        deep = rng.uniform(8, 16)
        for xx in range(x, min(x + w, x1)):
            t = (xx - x) / max(w - 1, 1)
            base = y0 + (y1 - y0) * (xx - x0) / (x1 - x0)
            yc = int(round(base + deep * (1 - abs(2 * t - 1))))          # (tips pointing down)
            cut[yc:zone_y, xx] = True
        x += w
cut &= b.op() & ~dilate_cv(ff, 2) & ~ear & ~dilate_cv(ear, 2)
b.erase(cut)
left = (b.img[..., 3] > 0.02)
edge = dilate_cv(cut, 2) & left & hair & ~dilate_cv(ff, 2)
b.img[..., :3] = np.where(edge[..., None], np.asarray(LINE, np.float32) / 255.0, b.img[..., :3])
hair &= left
# a few stray strands over the hair (darker lines)
b.over(strokes(S, [((132, 52), (126, 66), (122, 82), 1.2), ((186, 50), (194, 64), (198, 80), 1.2), ((214, 82), (220, 98), (222, 116), 1.1),
                   ((96, 104), (92, 120), (92, 134), 1.1)], (132, 94, 48), alpha=0.75, clip=erode_cv(hair, 1), taper_to=0.2))
JAW_L = [(99, 128), (103, 140), (106, 150), (109, 158), (112, 163), (117, 169), (124, 176), (131, 182), (137, 187), (144, 191), (150, 193)]
b.over(strokes(S, polyline(JAW_L, 2.0), LINE, taper_to=1.0, clip=~erode_cv(ff, 1) & (b.yy > 150)))


# ---------- the eyes brown, the face a little tanned ----------
iris = b.sel(hue=(20, 60), sat=(0.45, 1), val=(0.15, 1)) & eyes
b.ramp(iris, [(0.0, (22, 12, 6)), (0.3, (66, 38, 18)), (0.6, (116, 72, 36)), (0.9, (172, 124, 74))])
skinall = (face | ear | b.sel(hue=(17, 34), sat=(0.08, 0.38), val=(0.8, 1), box=(80, 90, 250, 200))) & ~hair & b.op()
b.multiply(skinall, (246, 220, 200), 0.55)
# the pink shade the bangs throw on the forehead: a warm skin shade
fsh = b.sel(hue=(345, 15), sat=(0.25, 0.5), val=(0.7, 0.97), box=(95, 70, 210, 130)) & ~hair & ~eyes
b.hsv(fsh, hue=12, smul=0.9, vmul=0.97)

# ---------- the collar gone: the neck and the base of the shoulders in a wide neckline ----------
NECKLINE = curve((122, 220), (132, 236), (146, 248), (160, 252)) + curve((160, 252), (176, 247), (190, 234), (202, 216))[1:]
L_SH = curve((48, 352), (54, 310), (62, 280), (72, 256), (86, 238), (104, 226), (122, 220))
R_SH = curve((202, 216), (220, 222), (240, 232), (256, 246), (266, 264), (274, 290), (279, 330), (281, 352))
SMOCK = L_SH + NECKLINE[1:] + R_SH[1:] + [(281, 420), (48, 420)]
NECK_L = curve((136, 176), (136, 196), (134, 208), (122, 220))
NECK_R = curve((202, 216), (192, 208), (187, 194), (186, 170))
NECKHOLE = NECK_L + NECKLINE[1:] + NECK_R[1:]
keep = (dilate_cv(ff, 3) & (b.yy < 200) & ~b.sel(hue=(230, 330), sat=(0.1, 1))) | hair | ear | dilate_cv(ear, 2)
b.erase(b.op() & (b.yy > 176) & ~b.poly(SMOCK) & ~b.poly(NECKHOLE) & ~keep)
blue = dilate_cv(ff, 3) & ~ff & (b.yy > 176) & b.sel(hue=(200, 330), sat=(0.1, 1)) & b.op()     # (the collar's blue showing at the chin)
b.img[..., :3] = np.where(blue[..., None], np.asarray(LINE, np.float32) / 255.0, b.img[..., :3])
NECK_T = ((206, 140, 128), (246, 208, 184), (252, 224, 204))
nk = b.poly(NECKHOLE) & (b.yy > 180) & ~ff & ~hair & ~(dilate_cv(ff, 4) & (luma(b.src) < 0.35))
b.over(flat([NECKHOLE], NECK_T[1], nk))
# the shadow under the chin, the far (right) side of the neck, the hollow at the neck's base
b.over(flat([[(126, 170), (200, 170)] + curve((200, 170), (196, 190), (176, 206), (156, 208), (138, 200), (126, 184))], NECK_T[0], nk))
b.over(flat([curve((184, 204), (186, 216), (192, 232)) + [(204, 220), (198, 196)]], NECK_T[0], nk))
b.over(flat([curve((146, 236), (160, 232), (176, 236)) + curve((176, 236), (168, 246), (160, 250))[1:] + curve((160, 250), (152, 246), (146, 236))[1:]],
            NECK_T[0], nk))
# the neck's sides and the collarbones
b.over(strokes(S, polyline(NECK_L[3:], 2.0) + polyline(NECK_R[:-3], 2.0), LINE, taper_to=1.0))
b.over(strokes(S, [((134, 232), (144, 236), (154, 236), 1.3), ((168, 234), (178, 232), (188, 226), 1.3)], (176, 108, 98), alpha=0.8, taper_to=0.3,
               clip=nk))

# ---------- the smock: one far too big faded ochre sackcloth smock ----------
OCHRE = ((139, 102, 54), (172, 131, 62), (198, 158, 88), (112, 80, 42))
DEEP = (100, 70, 36)
b.over(celp([SMOCK], OCHRE, lw=2.2, shade=10, light=3, shade2=4))
sm = b.poly(SMOCK) & b.op()
fm = erode_cv(sm, 3)
# the coarse weave: a sparse speckle of darker and lighter threads
b.over(stubble(S, SMOCK, DEEP, density=0.06, seed=11, alpha=0.26, clip=fm))
b.over(stubble(S, SMOCK, (214, 178, 110), density=0.035, seed=12, alpha=0.22, clip=fm))
# soft folds: shade strips falling from the neckline and down the sleeves (the smock hangs loose), a lit ridge beside them
FOLDS = [((130, 262), (124, 300), (118, 352), 1.0, 7.0), ((198, 262), (204, 306), (208, 352), 1.0, 8.0), ((160, 276), (162, 314), (158, 352), 0.8, 5.0),
         ((92, 256), (84, 300), (80, 352), 1.0, 6.0), ((240, 248), (248, 300), (252, 352), 1.0, 7.0)]
b.over(flat([taper(bez(p0, p1, p2, 24), w0, w1) for p0, p1, p2, w0, w1 in FOLDS], OCHRE[0], fm))
b.over(strokes(S, [(p0, p1, p2, 1.1) for p0, p1, p2, w0, w1 in FOLDS], DEEP, alpha=0.7, clip=fm, taper_to=1.4))
b.over(strokes(S, [((140, 266), (136, 304), (132, 352), 2.0), ((210, 266), (216, 306), (220, 352), 2.0)], OCHRE[2], alpha=0.6, clip=fm, taper_to=0.4))
# the gathers under the neckline and the twine drawstring, knotted at the front with two hanging ends
gath = []
for i in range(2, len(NECKLINE) - 2, 3):
    p = np.asarray(NECKLINE[i], np.float64)
    q = np.asarray(NECKLINE[i + 1], np.float64) - np.asarray(NECKLINE[i - 1], np.float64)
    nrm = np.array([q[1], -q[0]]) / max(np.linalg.norm(q), 1e-6)
    if nrm[1] < 0:
        nrm = -nrm
    L = 7 + (i % 2) * 4
    gath.append((tuple(p + nrm * 3), tuple(p + nrm * (3 + L / 2)), tuple(p + nrm * (3 + L)), 1.2))
b.over(strokes(S, gath, DEEP, alpha=0.75, clip=fm, taper_to=0.2))
cord = [tuple(np.asarray(NECKLINE[i], np.float64) + np.array([0, 5])) for i in range(1, len(NECKLINE) - 1)]
TWINE = (204, 184, 140)
b.over(strokes(S, polyline(cord, 2.6), LINE, alpha=0.9, clip=sm, taper_to=1.0))
b.over(strokes(S, polyline(cord, 1.4), TWINE, alpha=1.0, clip=sm, taper_to=1.0))
b.over(cel(S, [ellipse(160, 258, 5, 4)], ((160, 140, 100), TWINE, (226, 210, 172)), lw=1.4, shade=1.5, light=1, ldir=LD))
b.over(strokes(S, [((157, 261), (153, 270), (151, 282), 2.6), ((163, 261), (167, 270), (166, 280), 2.6)], LINE, alpha=0.9, taper_to=0.6))
b.over(strokes(S, [((157, 261), (153, 270), (151, 281), 1.3), ((163, 261), (167, 270), (166, 279), 1.3)], TWINE, alpha=1.0, taper_to=0.6))
# a big grey patch, sewn on with coarse stitches, and grey smears of clay
b.img = patch(b.img, [(86, 292), (122, 286), (128, 326), (92, 334)], fm, lift=0.98, hue=(40, 0.1), seed=21, stitch=(200, 186, 150))
CLAY = (128, 124, 116)
b.over(strokes(S, [((202, 298), (214, 304), (226, 302), 6.0), ((206, 310), (216, 314), (224, 312), 4.0), ((236, 326), (244, 334), (250, 346), 6.0),
                   ((140, 328), (148, 334), (156, 333), 4.5)], CLAY, alpha=0.35, clip=fm, taper_to=0.4))

# ---------- freckles, a smear of clay on the cheek ----------
fclip = face & ~eyes
b.over(dots(S, [(112, 152, 1.3), (118, 156, 1.1), (124, 151, 1.2), (110, 159, 1.0), (117, 162, 1.0), (126, 158, 1.0),
                (137, 147, 1.0), (146, 145, 1.0), (141, 150, 0.9),
                (168, 150, 1.3), (175, 154, 1.1), (182, 149, 1.2), (188, 155, 1.1), (172, 159, 1.0), (181, 160, 1.0)],
            FRECKLE, alpha=0.75, clip=fclip))
b.over(strokes(S, [((184, 164), (190, 162), (196, 158), 3.0)], (138, 134, 128), alpha=0.3, clip=face, taper_to=0.3))
b.save(OUT)
print('ok', OUT)
