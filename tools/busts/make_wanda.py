# Wanda (the young serving girl of the tavern): People1_6 (the girl with the long braid) repainted to her map sprite - the
# braid and the brown hair kept, rosy cheeks, the low-cut brown dress gone: a cream linen blouse with a modest gathered round
# neck and the puffed sleeves (recoloured), a dark-brown laced bodice over it (painted), the top of a white apron at the waist,
# a white tea towel thrown over the shoulder, the red ribbon on the braid a plain brown tie.
# Run: python tools/busts/make_wanda.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Wanda_Bust.png')
b = Bust('People1_6')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # the side kit.cel() puts its shade band on (lower right: the RTP light comes from the upper left)
PAD = 40


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


op = b.op()
# the braid (and the hair behind the near shoulder) stays in front of everything new
BRAID = [(186, 150), (252, 150), (252, 196), (220, 198), (216, 230), (212, 252), (208, 272), (206, 300), (209, 330), (207, 350),
         (176, 350), (175, 320), (177, 295), (183, 262), (183, 232), (189, 205), (189, 180)]
hairsel = b.poly(BRAID) & b.sel(hue=(330, 32), sat=(0.08, 0.6), val=(0.3, 1))
braid = erode_cv(dilate_cv(hairsel, 3), 3) & b.poly(BRAID) & ~b.sel(hue=(150, 300), sat=(0.04, 1)) & ~b.sel(sat=(0, 0.12), val=(0.7, 1))
braid = b.grow(braid, 2, 0.3) & b.poly(BRAID)
# the hair a warmer mid brown (like the map): everything of the head but the face (its connected light area) and the neck
face = fill_holes(dilate_cv(b.comp((luma(b.src) > 0.55) & op & region(S, 60, 0, 260, 240), (150, 130)), 2))
NECK = [(126, 158), (196, 148), (192, 240), (122, 240), (122, 190)]
hair = ((op & region(S, 40, 0, 290, 206) & ~face & ~b.poly(NECK)) | braid) & ~b.sel(sat=(0, 0.12), val=(0.7, 1))
hair &= ~b.sel(hue=(340, 20), sat=(0.5, 1), box=(180, 255, 215, 300)) & ~b.sel(hue=(150, 300), sat=(0.04, 1))   # (the ribbon, the collar)
HAIR = [(0.0, (30, 18, 12)), (0.15, (62, 40, 26)), (0.35, (112, 76, 50)), (0.5, (146, 102, 68)), (0.65, (176, 128, 88)), (0.8, (206, 160, 116)),
        (0.92, (234, 200, 162))]
b.ramp(hair, HAIR, gain=1.0)
SLEEVE_L = [(0, 190), (106, 190), (104, 202), (94, 226), (84, 252), (78, 300), (84, 345), (84, 360), (0, 360)]
SLEEVE_R = [(222, 190), (330, 190), (330, 360), (232, 360), (229, 300), (231, 250), (226, 214)]
sleeves = b.poly(SLEEVE_L, SLEEVE_R) & op & ~braid & (b.yy > 196)

# ---------- the puffed sleeves: cream linen (the folds kept) ----------
CREAM = [(0.0, (40, 32, 24)), (0.12, (108, 96, 78)), (0.24, (174, 160, 132)), (0.32, (214, 204, 178)), (0.42, (232, 224, 202)),
         (0.6, (246, 242, 228))]
dress = sleeves & ~b.sel(sat=(0, 0.14), val=(0.55, 1))
lace = sleeves & b.sel(sat=(0, 0.14), val=(0.55, 1))
b.ramp(dress, CREAM, gain=1.0)
b.ramp(lace, [(0.0, (40, 32, 24)), (0.5, (196, 184, 156)), (0.8, (236, 228, 206)), (1.0, (248, 244, 230))])

# ---------- the blouse over the chest: a gathered round neck at the base of the throat ----------
BLOUSE_T = ((180, 166, 136), (226, 216, 190), (244, 238, 220))
NECKLINE = curve((120, 182), (128, 204), (142, 222), (158, 228), (178, 222), (196, 206), (204, 194))
BLOUSE = [(92, 204), (106, 194)] + NECKLINE + [(222, 190), (232, 216), (236, 300), (84, 300), (82, 252), (94, 226)]
body = op & ~braid & ~(b.poly(SLEEVE_L, SLEEVE_R) & (b.yy > 196))
seam = sleeves & dilate_cv(body, 4)
b.over(celp([BLOUSE], BLOUSE_T, clip=body | seam, shade=7, light=3))
bm = erode_cv(body & b.poly(BLOUSE), 2)
b.over(flat([curve((206, 196), (214, 230), (222, 270), (226, 300)) + [(236, 300), (234, 196)],
             curve((84, 252), (100, 262), (110, 290), (108, 300)) + [(84, 300)]], BLOUSE_T[0], bm))
gathers = []
for t in np.linspace(0.08, 0.92, 9):
    i = int(t * (len(NECKLINE) - 1))
    p = np.asarray(NECKLINE[i]); q = np.asarray(NECKLINE[min(i + 1, len(NECKLINE) - 1)]) - np.asarray(NECKLINE[max(i - 1, 0)])
    q /= max(np.linalg.norm(q), 1e-6)
    n = np.array([-q[1], q[0]])
    if n[1] < 0:
        n = -n
    gathers.append((tuple(p + n * 2), tuple(p + n * 6), tuple(p + n * 10 + q * 1.5), 1.2))
b.over(strokes(S, gathers, BLOUSE_T[0], alpha=0.9, clip=bm, taper_to=0.1))

# (the old white collar's tips beside the neck: the blouse's edge)
COLLAR = [[(112, 168), (134, 168), (134, 196), (112, 196)], [(186, 168), (204, 168), (204, 200), (186, 200)]]
lapel = b.sel(sat=(0, 0.2), val=(0.5, 1), polys=COLLAR)
lapel = b.grow(lapel, 1, 0.3) & b.poly(*COLLAR)
b.ramp(lapel, [(0.0, (40, 32, 24)), (0.3, (150, 136, 110)), (0.6, (206, 196, 170)), (0.85, (228, 218, 194)), (1.0, (240, 234, 216))])

# ---------- the bodice: dark brown, laced up the front ----------
BOD_T = ((52, 32, 20), (86, 56, 36), (118, 82, 54))
BODICE = [(82, 262)] + curve((82, 262), (104, 280), (128, 288), (160, 284), (200, 276), (234, 266)) + [(234, 400), (82, 400)]
b.over(celp([BODICE], BOD_T, clip=body, shade=8, light=3))
bdm = erode_cv(body & b.poly(BODICE), 2)
b.over(flat([curve((84, 280), (96, 300), (100, 330), (98, 360)) + [(84, 360)],
             curve((150, 300), (176, 310), (194, 330), (204, 360)) + [(234, 360), (234, 290)]], BOD_T[0], bdm))
# the lacing: eyelets either side of the front, the cord crossing between them
LX, eye = 128, []
cord = []
for k, y in enumerate(range(296, 352, 12)):
    xl, xr = LX - 8 - (y - 296) * 0.05, LX + 8 - (y - 296) * 0.05
    eye += [(xl, y), (xr, y)]
    if y + 12 < 360:
        cord.append(((xl, y), (LX, y + 6), (xr - 0.6, y + 12), 1.8))
        cord.append(((xr, y), (LX, y + 6), (xl - 0.6, y + 12), 1.8))
b.over(strokes(S, [((LX, 290), (LX - 1, 320), (LX - 3, 360), 1.2)], (30, 18, 12), alpha=0.9, clip=bdm, taper_to=1.0))
b.over(strokes(S, cord, (210, 196, 160), alpha=1.0, clip=bdm, taper_to=1.0))
b.over(strokes(S, [(c[0], c[1], c[2], 0.7) for c in cord], (140, 124, 96), alpha=0.6, clip=bdm, taper_to=1.0))
b.over(dots(S, [(x, y, 2.0) for x, y in eye], (30, 18, 12), clip=bdm))
b.over(strokes(S, [((LX - 2, 290), (LX - 8, 296), (LX - 10, 304), 1.6), ((LX + 2, 290), (LX + 6, 296), (LX + 4, 306), 1.6)],
               (210, 196, 160), alpha=1.0, taper_to=0.4))

# ---------- the top of the white apron at the waist ----------
APRON_T = ((176, 178, 186), (230, 232, 234), (248, 248, 250))
APRON = curve((84, 330), (130, 328), (180, 324), (234, 318)) + [(236, 400), (84, 400)]
b.over(celp([APRON], APRON_T, clip=body, shade=5, light=2))
am = erode_cv(body & b.poly(APRON), 2)
b.over(strokes(S, [((x, 332), (x - 1, 342), (x - 2, 352), 1.2) for x in (104, 122, 146, 168, 194, 216)], APRON_T[0], alpha=0.9, clip=am,
               taper_to=0.6))

# ---------- the braid's ribbon: a plain brown tie ----------
rib = b.sel(hue=(340, 20), sat=(0.5, 1), box=(180, 255, 215, 300))
rib = b.grow(rib, 1, 0.3) & region(S, 180, 255, 215, 300)
b.ramp(rib, [(0.0, (26, 16, 10)), (0.15, (60, 38, 24)), (0.3, (96, 64, 40)), (0.5, (128, 92, 60))], gain=1.0)

# ---------- the tea towel over the far shoulder ----------
TOWEL_T = ((200, 196, 194), (242, 240, 236), (254, 254, 252))
TOWEL = curve((68, 208), (82, 194), (100, 200)) + curve((100, 200), (105, 232), (102, 262), (100, 290)) + \
    [(93, 294), (86, 289), (78, 295), (70, 290), (61, 294)] + curve((61, 294), (61, 262), (64, 232), (68, 208))
b.over(celp([TOWEL], TOWEL_T, shade=5, light=2, lw=1.8))
tm = erode_cv(b.poly(TOWEL), 2)
b.over(flat([curve((88, 204), (88, 250), (84, 292)) + curve((84, 292), (92, 250), (94, 204)),
             curve((76, 206), (72, 250), (68, 292)) + curve((68, 292), (75, 250), (79, 206))], TOWEL_T[0], tm))
b.over(strokes(S, [((84, 204), (80, 248), (77, 290), 1.0), ((90, 206), (95, 250), (95, 290), 0.9)], (176, 172, 172), alpha=0.8, clip=tm))
b.over(strokes(S, [((72, 204), (84, 196), (98, 200), 1.4)], TOWEL_T[2], alpha=0.9, clip=tm))

# ---------- rosy cheeks ----------
skin = b.sel(hue=(0, 40), sat=(0.15, 0.5), val=(0.75, 1), poly=[(96, 110), (200, 110), (196, 160), (150, 178), (104, 160)])
b.over(blush(S, 116, 140, 13, 7, (240, 110, 110), 0.40, clip=skin))
b.over(blush(S, 178, 136, 12, 7, (240, 110, 110), 0.36, clip=skin))
b.save(OUT)
print('ok', OUT)
