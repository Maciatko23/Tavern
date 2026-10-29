# Pula_K (a pool body of the travellers from the ferry, docs/PODROZNI.md: an ordinary travelling peasant woman of about 35,
# 2026-10-29): People4_6 (the pink-haired woman in the yellow bandana) repainted to her PixelLab map sheet ($Npc_Pula_K) - the
# kind face kept (the lips toned down to skin, brown eyes), the pink hair warm brown and hidden under a painted DARK-RED wool
# headscarf tied under the chin (a knot and two short ends; the brown hair left at the forehead), the bandana, the earring and
# the long hair outside the scarf gone; everything under the head painted new: the neck, a long DUSTY-BLUE wool dress, a BROWN
# knitted shawl round the shoulders (knitted rows, its two ends crossed on the chest, a short fringe) and the top of an off-white
# apron at the bottom edge.
# Recolour bands (for tools/podroznicy/pula_kolory.py): the headscarf, its knot and ends are the only red - hue 0..7, sat 0.47..0.64
# (the lips and the face's lines end at hue 17 with sat <= 0.36, the skin hue 17..25); the dress is the only blue - hue 203..213,
# sat 0.15..0.31 (the eyes brown, the eye whites warm).
# 0 PixelLab generations. Run: python tools/busts/make_pula_k.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Pula_K_Bust.png')
b = Bust('People4_6')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)
TALL = (H + 40, W + 80)


def cel_b(polys, tones, **kw):
    """cel() on a canvas bigger than the bust (below and right), cropped: no shade band or line along the frame's edges."""
    return cel(TALL, polys, tones, ldir=LD, **kw)[:H, :W]


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


# the map's colours ($Npc_Pula_K front frame): headscarf (124, 55, 52)/(90, 36, 35)/(74, 30, 30), shawl (129, 93, 63)/(84, 58, 38),
# dress (102, 124, 137)/(70, 88, 100)/(54, 66, 71), apron (222, 213, 195)/(177, 167, 150), skin (243, 192, 158), hair (102, 74, 53)
HAIR = [(0.0, (24, 14, 9)), (0.15, (48, 30, 19)), (0.3, (74, 49, 31)), (0.45, (98, 68, 45)), (0.6, (124, 90, 62)), (0.8, (158, 120, 88)),
        (1.0, (192, 156, 120))]
SKIN_T = ((214, 150, 120), (244, 196, 166), (252, 218, 194))
SCARF_T = ((86, 32, 32), (124, 46, 45), (152, 62, 58), (62, 22, 22))
HEM_T = ((80, 29, 29), (112, 41, 40), (140, 56, 53))
DRESS_T = ((60, 74, 84), (88, 108, 122), (114, 136, 150), (44, 55, 64))
SHAWL_T = ((72, 49, 32), (108, 77, 52), (138, 102, 70), (52, 35, 23))
APRON_T = ((176, 166, 148), (220, 212, 194), (236, 230, 216))

# ---------- the face: kept (kind, a little tired), the lips skin-toned, brown eyes, warm eye whites ----------
EYES = [[(98, 108), (134, 108), (134, 136), (98, 136)], [(154, 106), (196, 106), (196, 136), (154, 136)]]
MOUTH = [(132, 164), (166, 164), (166, 180), (132, 180)]
skin = b.sel(hue=(0, 40), sat=(0.08, 0.55), val=(0.7, 1), box=(90, 60, 230, 210)) & ~b.sel(hue=(300, 12), sat=(0.38, 1))
lips = b.sel(hue=(320, 15), sat=(0.15, 1), val=(0.35, 1), poly=MOUTH)
b.hsv(lips, hue=14, smul=0.8, vmul=1.0)
irises = b.sel(hue=(60, 240), sat=(0.15, 1), polys=EYES)
b.ramp(irises, [(0.0, (16, 10, 6)), (0.15, (44, 28, 16)), (0.35, (92, 60, 34)), (0.6, (146, 104, 62)), (1.0, (204, 168, 120))], gain=1.1)
whites = b.sel(hue=(150, 300), sat=(0.0, 0.35), val=(0.55, 1), polys=EYES) & ~irises
b.hsv(whites, hue=30, sat=0.06)
# ---------- hair: pink -> warm brown (only the forehead's strands show under the scarf) ----------
hair = b.sel(hue=(290, 12), sat=(0.25, 1), box=(50, 0, 290, 320)) & ~b.poly(MOUTH)
hair |= b.sel(hue=(290, 360), sat=(0.08, 1), val=(0, 0.6), box=(50, 0, 290, 320)) & ~b.poly(MOUTH)
hair = b.grow(hair, 1, 0.3) & region(S, 50, 0, 290, 320) & ~irises & ~whites
b.ramp(hair, HAIR, gain=1.05)
b.over(blush(S, 122, 156, 12, 7, (226, 150, 120), 0.22, clip=skin))
b.over(blush(S, 186, 152, 10, 7, (226, 150, 120), 0.18, clip=skin))
# about 35: soft lines under the eyes and at the mouth
b.over(strokes(S, [((106, 136), (116, 140), (128, 137), 1.0), ((160, 136), (172, 140), (186, 136), 1.0), ((128, 168), (130, 174), (134, 178), 1.0)],
               (196, 128, 104), alpha=0.45, clip=skin))

# ---------- the headscarf's shape: its edge round the face (from under the chin round the forehead back under the chin) and its
# outer edge round the head ----------
INNER = smooth([(140, 208), (128, 200), (118, 188), (108, 172), (100, 152), (97, 128), (98, 108), (104, 94), (116, 86), (134, 82), (152, 80),
                (172, 82), (192, 88), (205, 100), (210, 118), (210, 140), (206, 160), (198, 178), (186, 194), (172, 206), (162, 212)])
OUTER = smooth([(170, 234), (196, 232), (218, 222), (234, 200), (242, 168), (244, 132), (240, 96), (228, 62), (208, 36), (180, 20), (150, 15),
                (120, 19), (96, 33), (80, 56), (72, 86), (70, 120), (74, 156), (82, 186), (96, 210), (116, 228), (134, 234)])

# ---------- the head (only what is inside the scarf: the face and the forehead's hair) ----------
JAW = [(224, 130), (214, 150), (202, 164), (192, 175), (180, 184), (166, 190), (152, 194), (140, 191), (127, 182), (116, 170), (107, 156),
       (100, 140)]
HEAD = [(60, 0), (270, 0), (270, 120)] + JAW[:-3] + [(124, 200), (96, 216), (60, 216)]      # (the hair left of the jaw stays)
head = take(b.img, b.poly(HEAD) & b.poly(OUTER) & b.op())

# ---------- the new body ----------
body = np.zeros((H, W, 4), np.float32)
NECK = [(118, 172), (206, 164), (208, 214), (202, 252), (130, 252), (120, 214)]
neck = cel_b([NECK], SKIN_T, lw=2.0, shade=8, light=2)
nm = neck[..., 3] > 0.5
CHIN_SH = [(110, 170), (214, 164), (206, 200), (186, 214), (160, 220), (136, 214), (118, 196)]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the dress: a round neckline, sturdy shoulders
DRESS = smooth([(30, 350), (36, 300), (52, 266), (84, 244), (126, 234)]) + smooth([(126, 234), (146, 246), (168, 250), (190, 246), (208, 232)]) \
    + smooth([(208, 232), (250, 242), (282, 262), (300, 300), (306, 350)])
dress = cel_b([DRESS], DRESS_T[:3], lw=2.0, shade=10, light=3, shade2=4)
body = over(body, dress)
# the apron's top at the bottom edge (its bib's upper hem, under the shawl's crossed ends)
BIB = [(118, 324), (224, 322), (230, 350), (112, 350)]
body = over(body, cel_b([BIB], APRON_T, lw=2.0, shade=6, light=2.5))
body = over(body, strokes(S, [((122, 330), (170, 328), (220, 328), 1.0)], APRON_T[0], alpha=0.8, clip=erode_cv(poly_mask((W, H), BIB) > 0.5, 2),
                          taper_to=1.0))
# the brown knitted shawl round the shoulders, its two ends crossed on the chest (the near one over the far one), a fringed hem
HEM_R = smooth([(324, 332), (292, 318), (252, 312), (216, 316), (188, 326), (164, 340)])
HEM_L = smooth([(18, 332), (54, 318), (96, 312), (134, 318), (162, 330), (180, 344)])
SH_R = smooth([(170, 252), (194, 246), (212, 232), (242, 240), (274, 254), (298, 276), (314, 304), (324, 332)]) + HEM_R[1:] + [(170, 252)]
SH_L = smooth([(18, 332), (30, 304), (44, 276), (68, 254), (98, 240), (126, 234), (146, 246), (170, 254)]) \
    + smooth([(170, 254), (174, 280), (178, 312), (180, 344)])[1:] + HEM_L[::-1][1:]


def knit(lay, seed):
    """Knitted rows (little chevrons in rows following the shoulders) and the heavy folds, inside a shawl half."""
    m = erode_cv(lay[..., 3] > 0.5, 2)
    rows = []
    for j in range(16):
        for x in range(14 + (j % 2) * 4, 334, 8):
            y = 236 + j * 7.5 + 0.0016 * (x - 170) ** 2 * (1 + j * 0.02)
            rows.append(((x - 3.5, y - 2.4), (x, y + 1.6), (x + 3.5, y - 2.4), 1.1))
    lay = over(lay, strokes(S, rows, SHAWL_T[0], alpha=0.55, clip=m, taper_to=0.8))
    lay = over(lay, strokes(S, [(r[0], r[1], r[2], 0.8) for r in rows[seed % 3::3]], SHAWL_T[2], alpha=0.35, clip=m, taper_to=0.6))
    lay = over(lay, strokes(S, [((62, 268), (52, 296), (50, 322), 1.6), ((278, 262), (290, 292), (292, 318), 1.6), ((150, 268), (158, 300), (164, 330), 1.4),
                                ((196, 262), (206, 286), (216, 310), 1.3)], SHAWL_T[3], alpha=0.6, clip=m, taper_to=0.2))
    return lay


def fringe(E, seed):
    """A short fringe of wool tassels hanging from the hem E."""
    rng = np.random.RandomState(seed)
    E = np.asarray(E)
    fr = []
    for i in range(1, len(E) - 1, 2):
        p = E[i]
        L = rng.uniform(5, 8)
        fr.append((tuple(p - (0, 2)), tuple(p + (rng.uniform(-1, 1), L * 0.5)), tuple(p + (rng.uniform(-1.5, 1.5), L)), 2.4))
    lay = strokes(S, fr, SHAWL_T[3], alpha=1.0, taper_to=0.6)
    return over(lay, strokes(S, [(a, m, c, 1.1) for a, m, c, _ in fr], SHAWL_T[1], alpha=0.9, taper_to=0.5))


for poly, hem, sd in ((SH_R, HEM_R, 33), (SH_L, HEM_L, 34)):
    body = over(body, fringe(hem, sd))
    body = over(body, knit(cel_b([poly], SHAWL_T[:3], lw=2.0, shade=9, light=3, shade2=4), sd))

# ---------- the head over it ----------
hm = head[..., 3] > 0.5
bm = body[..., 3] > 0.5
cs = shift(hm & (b.yy > 150), 2, 8) & ~hm & bm
body[..., :3] = np.where(cs[..., None], body[..., :3] * np.asarray((0.74, 0.66, 0.66), np.float32), body[..., :3])
b.img = over(body, head)

# ---------- the dark-red wool headscarf ----------
SCARF = INNER + OUTER
sc = cel_b([SCARF], SCARF_T[:3], lw=2.0, shade=12, light=3, shade2=5)
scm = sc[..., 3] > 0.5
SF = [((168, 210), (214, 120), (196, 46), 1.6), ((156, 210), (190, 110), (160, 30), 1.4), ((180, 210), (228, 150), (232, 92), 1.4),
      ((118, 206), (82, 150), (88, 66), 1.4), ((108, 196), (84, 160), (80, 118), 1.2), ((126, 34), (106, 46), (92, 66), 1.2),
      ((188, 30), (178, 48), (176, 64), 1.1)]
sc = over(sc, strokes(S, SF, SCARF_T[3], alpha=0.7, clip=erode_cv(scm, 2)))
sc = over(sc, hair_strands(S, erode_cv(scm, 3), (150, 260), SCARF_T[2], SCARF_T[3], n=200, length=(3, 6), seed=31, alpha=(0.2, 0.25)))
hem = cel_b([taper(np.asarray(INNER, np.float64), 7.0, 7.0)], HEM_T, lw=1.4, shade=2.4, light=1.2,
            clip=np.pad(scm, ((0, TALL[0] - H), (0, TALL[1] - W))))
sc = over(sc, hem)
b.over(sc)
# the knot under the chin and its two short ends
TAILS = [smooth([(144, 220), (153, 222), (149, 244), (140, 249), (134, 242)]), smooth([(152, 220), (163, 220), (173, 239), (167, 248), (158, 242)])]
tails = cel_b(TAILS, SCARF_T[:3], lw=1.6, shade=3, light=1.2)
knot = cel_b([ellipse(152, 216, 12, 8, 0.1, 24)], SCARF_T[:3], lw=1.8, shade=4, light=1.5)
b.over(tails)
b.over(knot)
b.over(strokes(S, [((145, 213), (152, 218), (159, 220), 1.0)], SCARF_T[3], alpha=0.7))

# ---------- the scarf is the only red: the face's reddish lines and the lips a warm skin brown (hue 17, sat <= 0.36) ----------
garment = dilate_cv(scm | (tails[..., 3] > 0.05) | (knot[..., 3] > 0.05), 1)
hsv = rgb_to_hsv(b.img[..., :3])
reds = ((hsv[..., 0] * 360 >= 330) | (hsv[..., 0] * 360 <= 16)) & (hsv[..., 1] > 0.3) & (b.img[..., 3] > 0.02) & ~garment
hsv[..., 0] = np.where(reds, 17 / 360.0, hsv[..., 0])
hsv[..., 1] = np.where(reds, np.minimum(hsv[..., 1] * 0.75, 0.36), hsv[..., 1])
b.img[..., :3] = hsv_to_rgb(hsv)
b.save(OUT)
print('ok', OUT)
