# Grandpa Stach bust: People1_7 (kind old man in a cap) repainted in the RTP cel style - brown felt cap,
# patched brown wool coat over a linen shirt, and a full grey-white beard + walrus moustache painted here
# (flat shades, tapered strands, dark outline). Run: python tools/busts/make_stach.py [out.png]
import sys, os
import numpy as np
from bustlib import *
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Stach_Bust.png')
DBG = os.environ.get('BUST_DBG')

base = load('People1_7')
H, W = base.shape[:2]
hsv = rgb_to_hsv(base[..., :3]); hd = hsv[..., 0] * 360; sat = hsv[..., 1]; val = hsv[..., 2]
yy, xx = np.mgrid[0:H, 0:W]
op = base[..., 3] > 0
L = luma(base)

# ---------- clothes ----------
out = base.copy()
cap = op & (yy < 112) & (hd > 40) & (hd < 80) & (sat > 0.15)
tunic = op & (yy > 185) & (hd > 55) & (hd < 110) & (sat > 0.2)
FACE = [(80, 60), (200, 60), (200, 140), (186, 152), (170, 170), (152, 186), (128, 196), (104, 190), (84, 170)]
face = poly_mask((W, H), FACE) > 0.5
maroon = op & ~face & (yy > 140) & ((hd > 320) | (hd < 16)) & (sat < 0.62) & (val < 0.62)
collar = maroon & (yy < 262)
sleeve = maroon & (yy >= 262)
laces = op & (yy > 215) & (hd >= 40) & (hd <= 60) & (sat > 0.2)
rim = op & (yy > 190) & (xx < 130) & (hd > 120) & (hd < 210) & (sat > 0.1)   # the RTP cyan back light -> warm

CAP = [(0.0, (14, 8, 5)), (0.2, (56, 35, 21)), (0.33, (86, 57, 35)), (0.45, (112, 78, 49)), (0.62, (146, 106, 69)),
       (0.8, (178, 137, 96))]
COAT = [(0.0, (12, 7, 4)), (0.2, (52, 33, 20)), (0.38, (88, 58, 35)), (0.58, (126, 86, 53)), (0.72, (152, 109, 71)),
        (0.9, (190, 147, 103))]
SLEEVE = [(0.0, (10, 6, 4)), (0.15, (40, 25, 15)), (0.26, (66, 43, 26)), (0.36, (92, 62, 38)), (0.5, (116, 80, 50))]
LINEN = [(0.0, (20, 14, 10)), (0.15, (96, 80, 62)), (0.26, (150, 132, 106)), (0.36, (196, 180, 150)),
         (0.5, (226, 214, 188)), (0.7, (244, 236, 216))]
TWINE = [(0.0, (30, 20, 10)), (0.4, (110, 84, 50)), (0.7, (170, 140, 96)), (1.0, (214, 190, 140))]
RIM = [(0.0, (60, 40, 24)), (0.4, (150, 112, 76)), (0.7, (196, 160, 118)), (1.0, (226, 198, 160))]
for m, st in ((cap, CAP), (tunic, COAT), (sleeve, SLEEVE), (collar, LINEN), (laces, TWINE), (rim, RIM)):
    out[..., :3] = np.where(m[..., None], ramp(L, st), out[..., :3])

# patches on the coat (lighter wool on the near shoulder, darker on the far arm)
out = patch(out, [(222, 238), (252, 234), (256, 262), (226, 266)], tunic, lift=1.18, hue=(30, 0.42), seed=2)
out = patch(out, [(52, 276), (74, 270), (80, 294), (57, 300)], tunic, lift=0.78, hue=(24, 0.38), seed=4)

# ---------- beard + moustache (painted) ----------
SS = 4
cv = Canvas(W, H, SS)
HL, L1, L2, MID, SH, SH2 = (238, 239, 243), (218, 219, 226), (194, 195, 205), (164, 164, 177), (130, 128, 144), (98, 95, 112)
LINE = (38, 32, 44)

# silhouettes (target coords on the 3/4 face)
MOUS = [(97, 161), (103, 155), (110, 152), (118, 151), (126, 152), (134, 153), (142, 155), (150, 158), (157, 163),
        (161, 170), (163, 179), (161, 188), (153, 183), (145, 177), (136, 173), (127, 172), (118, 174), (110, 178),
        (103, 184), (96, 190), (95, 179), (95, 169)]
RIGHT = strand_edge([(193, 186), (192, 204), (187, 222), (178, 238), (165, 250), (151, 258)], side=1, seg=11, tip=7, out=3.2, seed=3)
LEFT = strand_edge([(90, 186), (93, 204), (100, 222), (111, 238), (126, 250), (141, 258)], side=-1, seg=11, tip=7, out=3.2, seed=7)
BEARD = ([(91, 158), (97, 161), (157, 163), (163, 160), (170, 155), (176, 148), (179, 138), (179, 126), (178, 114),
          (182, 109), (186, 118), (187, 134), (187, 148), (190, 162)] + RIGHT + [(146, 266)] + LEFT[::-1] + [(88, 172)])
Mm = cv.mask([MOUS]); Bm = cv.mask([BEARD]) | Mm
beard_only = Bm & ~Mm
cv.paint(Bm, L1)

# far side in shade: region left of a flowing boundary, with strand-shaped fingers into the light
far_edge = bez((118, 176), (100, 212), (142, 262), 30)
far_poly = [(80, 150)] + [tuple(p) for p in far_edge] + [(80, 280)]
cv.paint(cv.mask([far_poly]), MID, beard_only)
for (s, c, e, w) in [((112, 186), (108, 212), (124, 240), 4.5), ((118, 196), (118, 222), (132, 250), 3.5),
                     ((104, 200), (102, 222), (112, 236), 3)]:
    cv.paint(cv.mask([taper(bez(s, c, e), w, 0)]), MID, beard_only)
# cast shadow of the moustache: a band + strands running down
band = np.roll(Mm, 5 * SS, axis=0) & beard_only
cv.paint(band, SH)
for x0, ln, w in [(102, 16, 4.5), (113, 24, 5.5), (127, 30, 6), (141, 20, 5), (153, 26, 5.5), (162, 14, 4)]:
    y0 = 176 + abs(x0 - 127) * 0.33
    e = (x0 + (146 - x0) * 0.3, y0 + ln)
    cv.paint(cv.mask([taper(bez((x0, y0 - 2), (x0 + (146 - x0) * 0.1, y0 + ln * 0.5), e), w, 0)]), MID, beard_only)
# sideburn and the near jaw: shade at the back edge
cv.paint(cv.mask([[(181, 110), (187, 118), (188, 150), (191, 168), (192, 186), (186, 186), (184, 160), (183, 130)]]),
         MID, beard_only)
cv.paint(cv.mask([taper(bez((184, 120), (186, 150), (184, 196)), 3.5, 0)]), SH, beard_only)
# strands follow the flow down to the tip
def flow(x0, y0, ln, bend=0.0):
    e = (x0 + (146 - x0) * 0.62 * ln, y0 + (256 - y0) * ln)
    c = (x0 + (146 - x0) * 0.1 + bend, y0 + (e[1] - y0) * 0.5)
    return bez((x0, y0), c, e)
for (x0, y0, ln, w, bend) in [(158, 190, 0.78, 6.5, 3), (170, 186, 0.62, 4.5, 3), (146, 196, 0.9, 4, 1),
                              (178, 190, 0.35, 3, 2)]:
    cv.paint(cv.mask([taper(flow(x0, y0, ln, bend), w, 0, w_mid=w * 1.15)]), HL, beard_only)
for (x0, y0, ln, w, bend) in [(126, 192, 0.85, 1.7, -2), (164, 196, 0.72, 1.5, 3), (112, 200, 0.6, 1.5, -3),
                              (180, 200, 0.45, 1.3, 2), (140, 214, 0.75, 1.3, 0)]:
    cv.paint(cv.mask([taper(flow(x0, y0, ln, bend), w, 0.2, w_mid=w)]), SH2, beard_only)

# moustache: light on top, shade toward the drooping tips, a few strands
mo = Mm
cv.paint(mo, L1)
cv.paint(cv.mask([[(96, 176), (104, 172), (112, 172), (120, 172), (128, 170), (136, 170), (146, 173), (156, 176),
                   (164, 180), (162, 192), (94, 192)]]), MID, mo)
for (s, c, e, w) in [((124, 155), (108, 158), (99, 182), 4.5), ((130, 156), (150, 160), (159, 182), 5),
                     ((119, 156), (112, 162), (104, 176), 3), ((137, 158), (153, 164), (156, 176), 3.5)]:
    cv.paint(cv.mask([taper(bez(s, c, e), w, 0, w_mid=w)]), HL, mo)
for (s, c, e, w) in [((126, 158), (112, 164), (101, 186), 1.3), ((129, 159), (147, 165), (158, 185), 1.3),
                     ((122, 162), (114, 170), (108, 181), 1.1), ((134, 162), (145, 169), (150, 180), 1.1)]:
    cv.paint(cv.mask([taper(bez(s, c, e), w, 0.2)]), SH2, mo)

# outlines: beard 1.5 px, moustache 1.25 px over the beard
ol = (Bm & ~erode(Bm, 6)) | (Mm & ~erode(Mm, 5))
cv.rgb[ol] = np.asarray(LINE, np.float32) / 255.0
beard = cv.to_1x(Bm)
out = over(out, beard)

save(out, OUT)
if DBG:
    zoom(out, (40, 60, 260, 300), 3).save(os.path.join(DBG, 'stach_zoom.png'))
    on_bg(out).save(os.path.join(DBG, 'stach_full.png'))
print('ok', OUT)
