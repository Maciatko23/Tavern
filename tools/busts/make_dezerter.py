# Tymon Wrzos (a traveller from the ferry, docs/PODROZNI.md 2.11: a young deserter of about 22, nervous and haunted,
# 2026-10-29): People3_3 (the blue-haired young officer in the white dress uniform) repainted to his PixelLab map sheet
# ($Npc_Dezerter) - the young face kept but worn out: the smile a tight flat mouth, the amber eyes a pale grey-green,
# dark rings and lines under the eyes, a few days' dark stubble, a smudge of dirt on the cheek, the skin warmer; the neat
# dark-blue hair BLACK and MESSY (tufts sticking out round its edge, loose strands over the forehead); everything under the
# head painted new: the neck, a torn and dirty WHITE army tunic (a frayed neckline, rips, stains) with the ORANGE PHOENIX of
# his regiment on the chest, a paler patch with loose threads where the rank insignia was torn off, and a plain BROWN wool
# cloak over the shoulders (tied at the throat with a cord). (The bandaged left forearm is below the frame.)
# 0 PixelLab generations. Run: python tools/busts/make_dezerter.py [out.png]
import sys
from kit import *
from patches import smudge, fray, rip, hole

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Dezerter_Bust.png')
b = Bust('People3_3')
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


def line_along(pts, w=2.0, col=LINE, alpha=1.0):
    return strokes(S, [(pts[i], ((np.asarray(pts[i]) + np.asarray(pts[i + 1])) / 2).tolist(), pts[i + 1], w) for i in range(len(pts) - 1)],
                   col, alpha=alpha, taper_to=1.0)


def blot(cx, cy, r, seed, n=16):
    rng = np.random.RandomState(seed)
    return [(cx + np.cos(t) * r[0] * rng.uniform(0.6, 1.15), cy + np.sin(t) * r[1] * rng.uniform(0.6, 1.15))
            for t in np.linspace(0, 2 * np.pi, n, endpoint=False)]


def inpaint(m, r=5):
    img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
    fill = cv2.inpaint(img8, m.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], fill, b.img[..., :3])


# the map's colours ($Npc_Dezerter front frame): tunic (233, 227, 217)/(224, 214, 202)/(183, 184, 162)/(164, 159, 154)/
# (154, 144, 129), cloak (122, 99, 75)/(117, 88, 62)/(82, 63, 47)/(71, 52, 36)/(64, 45, 30), hair (22, 21, 19)/(34, 32, 30)/
# (52, 48, 43), phoenix (230, 133, 74)/(190, 113, 68), skin (241, 190, 156)/(225, 166, 130)/(170, 132, 110)
HAIR = [(0.0, (8, 8, 8)), (0.12, (16, 15, 14)), (0.25, (24, 23, 21)), (0.4, (36, 34, 31)), (0.55, (52, 49, 45)), (0.7, (72, 68, 62)),
        (1.0, (110, 104, 96))]
HAIR_T = ((18, 17, 16), (32, 30, 28), (54, 50, 46), (10, 10, 10))
SKIN = [(0.0, (40, 18, 12)), (0.3, (120, 70, 50)), (0.5, (178, 124, 96)), (0.7, (214, 156, 122)), (0.82, (228, 172, 138)), (0.9, (240, 188, 154)),
        (1.0, (250, 210, 180))]
SKIN_T = ((210, 150, 116), (238, 186, 152), (248, 206, 174))
TUNIC_T = ((176, 172, 154), (226, 218, 204), (240, 236, 226), (150, 142, 126))
CLOAK_T = ((70, 50, 34), (112, 84, 58), (136, 108, 80), (52, 36, 24))
PHX_T = ((176, 92, 44), (226, 130, 72), (244, 168, 110))

# ---------- the face: worn out ----------
EYES = [[(100, 106), (134, 106), (134, 128), (100, 128)], [(156, 102), (194, 102), (194, 126), (156, 126)]]
irises = b.sel(hue=(15, 60), sat=(0.35, 1), val=(0.3, 1), polys=EYES)
skin = b.sel(hue=(0, 45), sat=(0.05, 0.6), val=(0.55, 1), box=(96, 90, 240, 200)) & ~irises
hair0 = b.sel(hue=(200, 260), sat=(0.25, 1), box=(60, 0, 270, 200))
hair0 = b.grow(hair0, 2, 0.3) & region(S, 60, 0, 270, 200) & ~skin
# the eyes: amber -> a pale grey-green, the whites a little dull
b.ramp(irises, [(0.0, (14, 16, 14)), (0.25, (50, 58, 50)), (0.5, (98, 110, 96)), (0.75, (150, 160, 142)), (1.0, (204, 210, 194))], gain=1.0)
whites = b.sel(hue=(180, 300), sat=(0, 0.3), val=(0.5, 1), polys=EYES) & ~irises
b.hsv(whites, hue=40, sat=0.06, vmul=0.94)
# the smile away: a tight flat mouth
MOUTH = b.poly([(128, 158), (172, 158), (172, 172), (128, 172)])
inpaint(MOUTH & (b.sel(sat=(0.3, 1)) | b.sel(val=(0, 0.7))), 4)
b.ramp(skin, SKIN, gain=1.0)
b.over(strokes(S, [((134, 166), (148, 165), (164, 166.5), 1.5)], (120, 64, 50), alpha=0.85, taper_to=0.5))
b.over(strokes(S, [((140, 171), (148, 172), (156, 171), 0.9)], (200, 140, 112), alpha=0.4, taper_to=0.4))
# tired, haunted: dark rings under the eyes, a crease between the brows
RING = (150, 100, 104)
b.over(blush(S, 117, 131, 13, 4.5, RING, 0.45, clip=skin))
b.over(blush(S, 176, 128, 14, 4.5, RING, 0.42, clip=skin))
b.over(strokes(S, [((106, 129), (118, 135), (132, 131), 1.1), ((160, 128), (174, 133), (190, 127), 1.1)], (140, 80, 70), alpha=0.5, clip=skin))
b.over(strokes(S, [((108, 133), (119, 138), (130, 135), 0.9), ((163, 132), (175, 136), (187, 131), 0.9)], (140, 80, 70), alpha=0.25, clip=skin))
# a few days' dark stubble on the jaw, the chin and the upper lip
STUB = [(110, 150), (118, 166), (130, 180), (142, 190), (152, 194), (166, 190), (182, 181), (198, 168), (210, 152), (212, 140), (204, 146),
        (192, 160), (176, 172), (166, 176), (150, 176), (138, 174), (126, 164), (118, 150)]
LIP = [(130, 156), (170, 154), (172, 162), (130, 163)]
b.over(stubble(S, STUB, (52, 38, 32), density=0.3, seed=3, alpha=0.42, clip=skin))
b.over(stubble(S, LIP, (52, 38, 32), density=0.28, seed=4, alpha=0.38, clip=skin))
# a smudge of dirt on the near cheek
b.img = smudge(b.img, [blot(198, 146, (8, 4), 2)], (130, 96, 70), 0.2)

# ---------- the hair: black ----------
b.ramp(hair0, HAIR, gain=1.0)

# ---------- the head (above the jaw and the old collar) ----------
JAW = [(124, 180), (136, 191), (148, 196), (160, 194), (172, 187), (186, 177), (197, 167), (204, 158)]
HEAD = [(40, 0), (290, 0), (290, 168), (240, 166), (226, 168), (212, 160)] + JAW[::-1] + [(110, 166), (40, 166)]
head = take(b.img, b.poly(HEAD) & b.op() & ~b.sel(hue=(0, 60), sat=(0.5, 1), box=(100, 172, 240, 200)))     # (not the old gold collar)

# ---------- the new body ----------
body = np.zeros((H, W, 4), np.float32)
NECK = [(134, 176), (206, 156), (216, 176), (220, 214), (214, 246), (146, 246), (142, 214)]
neck = cel_b([NECK], SKIN_T, lw=2.0, shade=9, light=2)
nm = neck[..., 3] > 0.5
CHIN_SH = JAW + [(x + 4, y + 13) for x, y in JAW[::-1]]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the tunic: a round neckline (frayed), broad young shoulders
NL = smooth([(132, 212), (146, 230), (172, 240), (198, 236), (216, 222), (226, 206)])
TUNIC = smooth([(4, 350), (10, 290), (28, 252), (70, 228), (110, 216), (132, 212)]) + NL[1:] \
    + smooth([(226, 206), (262, 212), (296, 228), (318, 256), (330, 300), (334, 350)])
tun = cel_b([TUNIC], TUNIC_T[:3], lw=2.0, shade=10, light=3, shade2=4)
tm = erode_cv(tun[..., 3] > 0.5, 2)
tun = over(tun, strokes(S, [((120, 260), (124, 300), (118, 350), 1.4), ((230, 254), (226, 300), (232, 350), 1.4), ((176, 250), (178, 280), (174, 310), 1.0)],
                        TUNIC_T[3], alpha=0.6, clip=tm))
body = over(body, tun)
# the orange phoenix of his regiment on the chest: a bird with spread wings rising from flames
PX, PY = 176, 292
WING_R = [(PX + 3, PY - 16), (PX + 14, PY - 27), (PX + 26, PY - 38), (PX + 38, PY - 46), (PX + 33, PY - 35), (PX + 39, PY - 31), (PX + 29, PY - 25),
          (PX + 34, PY - 18), (PX + 23, PY - 15), (PX + 25, PY - 8), (PX + 12, PY - 8), (PX + 4, PY - 5)]
WING_L = [(2 * PX - x, y) for x, y in WING_R]
BODY_P = smooth([(PX, PY - 30), (PX + 5, PY - 22), (PX + 6, PY - 8), (PX + 4, PY + 4), (PX, PY + 10), (PX - 4, PY + 4), (PX - 6, PY - 8),
                 (PX - 5, PY - 22), (PX, PY - 30)], 2)
HEAD_P = ellipse(PX, PY - 32, 5, 5)
BEAK = [(PX - 3, PY - 35), (PX - 11, PY - 32), (PX - 3, PY - 29)]
CREST = [(PX + 1, PY - 36), (PX + 6, PY - 46), (PX + 5, PY - 38), (PX + 12, PY - 44), (PX + 6, PY - 33)]
TAIL = [(PX - 5, PY + 4), (PX - 20, PY + 28), (PX - 11, PY + 24), (PX - 9, PY + 38), (PX - 3, PY + 27), (PX, PY + 42), (PX + 3, PY + 27),
        (PX + 9, PY + 38), (PX + 11, PY + 24), (PX + 20, PY + 28), (PX + 5, PY + 4)]
phx = cel(S, [WING_L, WING_R, BODY_P, HEAD_P, BEAK, CREST, TAIL], PHX_T, lw=1.4, line=(120, 58, 26), shade=2.5, light=1.2, ldir=LD)
phx[..., 3] *= 0.92
phx = over(phx, dots(S, [(PX - 1.5, PY - 33, 1.0)], (90, 40, 16), alpha=0.9))
body = over(body, phx)
b.img = body
# torn and dirty: the frayed neckline, rips, stains, the paler patch where the rank insignia was torn off
tunic_m = erode_cv(tun[..., 3] > 0.5, 1) & ~nm
for cx, cy, rx, ry, sd, k in ((104, 306, 14, 9, 31, 0.22), (258, 322, 12, 9, 32, 0.24), (160, 336, 10, 6, 33, 0.18), (220, 262, 8, 5, 34, 0.16)):
    b.img = smudge(b.img, [blot(cx, cy, (rx, ry), sd)], (150, 128, 100), k)
    b.img = smudge(b.img, [blot(cx + 2, cy + 1, (rx * 0.5, ry * 0.5), sd + 5)], (150, 128, 100), k * 0.7)
INS = [(96, 244), (126, 240), (130, 262), (100, 266)]
b.img = smudge(b.img, [INS], (250, 248, 242), 0.35)
b.over(dots(S, [(98, 244, 0.9), (110, 242.5, 0.9), (124, 241, 0.9), (128, 252, 0.9), (129, 261, 0.9), (114, 264, 0.9), (101, 265, 0.9),
                (97, 255, 0.9)], (96, 86, 72), alpha=0.85))
b.over(strokes(S, [((124, 241), (128, 236), (126, 232), 0.9), ((101, 265), (98, 270), (101, 274), 0.9), ((129, 261), (134, 264), (136, 260), 0.9)],
               (190, 182, 162), alpha=0.9, taper_to=0.6))
b.img = hole(b.img, rip([(244, 268), (252, 280), (256, 296)], width=5, seed=7), (60, 44, 34), shade=(40, 30, 24))
b.img = hole(b.img, rip([(70, 316), (80, 326), (84, 340)], width=4.5, seed=8), (60, 44, 34), shade=(40, 30, 24))
b.img = fray(b.img, NL, -1, seed=9, depth=2.0, teeth=(1.5, 3.5), width=(2, 4), gap=(1, 3), threads=3)

# ---------- the brown wool cloak over the shoulders, tied at the throat ----------
CL_L = smooth([(-10, 350), (-6, 290), (8, 254), (40, 232), (84, 218), (124, 212), (138, 222)]) \
    + smooth([(138, 222), (116, 234), (90, 250), (74, 280), (64, 320), (62, 350)])
CL_R = smooth([(220, 214), (252, 208), (290, 222), (318, 248), (334, 290), (340, 350)]) \
    + smooth([(340, 350), (280, 350), (278, 314), (270, 278), (254, 248), (232, 230), (220, 214)])
for poly, sd in ((CL_L, 11), (CL_R, 12)):
    lay = cel_b([poly], CLOAK_T[:3], lw=2.0, shade=10, light=3, shade2=4)
    m = erode_cv(lay[..., 3] > 0.5, 2)
    lay = over(lay, hair_strands(S, m, (170, 560), CLOAK_T[2], CLOAK_T[3], n=180, length=(4, 8), seed=sd, alpha=(0.2, 0.25)))
    lay = over(lay, strokes(S, [((30, 260), (24, 300), (22, 350), 1.8), ((60, 244), (50, 290), (44, 350), 1.4), ((300, 240), (310, 290), (312, 350), 1.8),
                                ((276, 236), (290, 280), (296, 350), 1.4)], CLOAK_T[3], alpha=0.6, clip=m, taper_to=0.2))
    b.over(lay)
# the cloak's worn hem along its front edges
b.img = fray(b.img, smooth([(138, 222), (116, 234), (90, 250), (74, 280), (64, 320), (62, 350)]), 1, seed=13, depth=2.0, teeth=(1.5, 3.0),
             width=(2, 4), gap=(1.5, 4))
b.img = fray(b.img, smooth([(220, 214), (232, 230), (254, 248), (270, 278), (278, 314), (280, 350)]), -1, seed=14, depth=2.0, teeth=(1.5, 3.0),
             width=(2, 4), gap=(1.5, 4))
# the cord tying it at the throat
b.over(strokes(S, [((134, 220), (176, 236), (222, 214), 2.2)], (60, 44, 30), alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((134, 219), (176, 235), (222, 213), 1.0)], (150, 120, 84), alpha=0.8, taper_to=1.0))
b.over(cel(S, [ellipse(176, 236, 4.5, 3.5)], ((50, 36, 24), (96, 72, 48), (140, 110, 76)), lw=1.0, shade=1.5, light=0.8, ldir=LD))
b.over(strokes(S, [((175, 238), (172, 248), (174, 258), 1.6), ((178, 238), (182, 247), (181, 256), 1.6)], (80, 60, 40), alpha=1.0, taper_to=0.6))

# ---------- the head over it, then the messy hair: tufts round its edge, loose strands over the forehead ----------
hm = head[..., 3] > 0.5
bm = b.img[..., 3] > 0.5
cs = shift(hm & (b.yy > 150), 3, 8) & ~hm & bm
b.img[..., :3] = np.where(cs[..., None], b.img[..., :3] * np.asarray((0.72, 0.68, 0.68), np.float32), b.img[..., :3])
b.over(head)
# ---------- messy black locks sticking out of the hair's edge (over the hair: their bases melt into its black) ----------
LOCKS = [((106, 46), (-0.75, -0.65), 22, 22, -6), ((140, 30), (-0.3, -1), 17, 22, -5), ((166, 26), (0.25, -1), 21, 24, 7),
         ((208, 42), (0.85, -0.5), 24, 24, -7), ((234, 76), (1, -0.1), 16, 20, 6), ((242, 110), (1, 0.35), 20, 20, -6),
         ((234, 146), (0.6, 0.8), 15, 16, 5), ((86, 78), (-1, -0.4), 15, 18, 6), ((80, 106), (-1, 0.15), 11, 14, -4)]
rng = np.random.RandomState(17)
lock_polys = []
for (bx, by), d, L, w, bend in LOCKS:
    d = np.asarray(d, np.float64)
    d /= np.linalg.norm(d)
    n = np.array([-d[1], d[0]])
    base = np.array([bx, by], np.float64) - d * 14
    tip = np.array([bx, by]) + d * L + n * bend
    b0, b1 = base + n * w / 2, base - n * w / 2
    sa = bez(b0, b0 + d * (L * 0.75) + n * (1.5 + bend * 0.3), tip, 12)
    sb = bez(tip, b1 + d * (L * 0.55) + n * bend * 0.4, b1, 12)
    lock_polys.append([tuple(p) for p in sa] + [tuple(p) for p in sb[1:]])
locks = cel(S, lock_polys, HAIR_T[:3], outline=False, shade=4, light=0, ldir=LD)
locks = over(locks, outline(S, lock_polys, lw=1.8, clip=~erode_cv(hair0, 2)))      # (their line only outside the old hair)
locks = over(locks, hair_strands(S, erode_cv(locks[..., 3] > 0.5, 1), (165, 60), HAIR_T[2], HAIR_T[3], n=50, length=(6, 12), seed=18,
                                 alpha=(0.5, 0.4)))
b.over(locks, k=~(b.poly(*EYES) | skin))
b.over(line_along(JAW, 1.8))

# loose strands over the forehead, a few lighter strands in the hair
b.over(strokes(S, [((126, 84), (122, 100), (126, 112), 2.4), ((150, 82), (144, 98), (146, 110), 2.2), ((172, 80), (174, 96), (168, 106), 2.2),
                   ((196, 86), (200, 100), (196, 110), 2.0)], HAIR_T[1], alpha=1.0, taper_to=0.2))
b.over(strokes(S, [((126, 84), (122, 100), (126, 112), 0.8), ((150, 82), (144, 98), (146, 110), 0.8)], HAIR_T[0], alpha=0.8, taper_to=0.2))
b.over(hair_strands(S, erode_cv(hair0, 3) & region(S, 60, 0, 270, 110), (150, 140), HAIR_T[2], HAIR_T[3], n=60, length=(8, 16), seed=19,
                    alpha=(0.5, 0.4)))
b.save(OUT)
print('ok', OUT)
