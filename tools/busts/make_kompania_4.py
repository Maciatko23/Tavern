# Ruda Hela (Wolna Kompania, docs/PODROZNI.md 2.13 / D47: a tough red-haired woman of about 30, loud and merry, 2026-10-29):
# People4_8 (the cheerful girl in the white headscarf, the red-and-white cape and the white blouse) repainted to her map sheet
# ($Npc_Kompania_4, $Human_Bandit recoloured by tools/podroznicy/kompania.py) - the laughing open-mouthed face kept, a little
# older and tougher (firmer brows drawn over the eyes, a weathered skin, freckles), the eyes dark brown; the pale blue-green
# hair RED (ginger) and only its fringe, the locks beside the face and the braid on the far side left: the headscarf gone and
# a GREY HOOD pulled UP over the head (the hood of Actor3_5 cut out, tilted with her head, recoloured grey, a dark lining);
# everything under the head painted new and modest: the neck, a plain GREY TUNIC with a round neckline and the hood's SHORT
# GREY CAPE over the shoulders (a stitched hem); the hand with the sticks, the near braid and the white blouse are gone.
# 0 PixelLab generations. Run: python tools/busts/make_kompania_4.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kompania_4_Bust.png')
b = Bust('People4_8')
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



def wavy(pts, amp, waves, phase=0.0):
    """A hem: the polyline pushed out and in along its normal in a few soft waves (cloth hanging in folds)."""
    p = np.asarray(pts, np.float64)
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))]
    t = seg / max(seg[-1], 1e-6)
    d = np.gradient(p, axis=0)
    d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
    n = np.stack([-d[:, 1], d[:, 0]], 1)
    k = amp * np.sin(2 * np.pi * waves * t + phase) * np.sin(np.pi * t)
    return [tuple(v) for v in p + n * k[:, None]]


def cape_half(poly, folds, hem, seed):
    """One half of a cloth cape (cel tones, a faint weave, folds fanning from the neck down to the hem, a stitched hem)."""
    lay = cel_b([poly], CAPE_T[:3], lw=2.0, shade=8, light=3)
    m = erode_cv(lay[..., 3] > 0.5, 2)
    lay = over(lay, hair_strands(S, m, (170, 520), CAPE_T[2], CAPE_T[3], n=90, length=(4, 9), seed=seed, alpha=(0.14, 0.2)))
    wedges, lits = [], []
    for (x0, y0), (x1, y1), w in folds:
        mid = ((x0 + x1) / 2 + (y1 - y0) * 0.05, (y0 + y1) / 2)
        wedges.append(taper(bez((x1, y1 + 4), mid, (x0, y0), 16), w, 0.6))
        lits.append(((x1 - w * 0.9, y1), (mid[0] - w * 0.6, mid[1]), (x0 - 1, y0), 1.1))
    sh = cel(S, wedges, (CAPE_T[3], CAPE_T[0], CAPE_T[0]), outline=False, shade=0, light=0)
    sh[..., 3] *= m * 0.85
    lay = over(lay, sh)
    lay = over(lay, strokes(S, lits, CAPE_T[2], alpha=0.55, clip=m, taper_to=0.2))
    hm = [(x, y - 5) for x, y in hem]
    lay = over(lay, line_along(hm, 1.0, CAPE_T[3], 0.7))
    lay = over(lay, strokes(S, [(hm[i], hm[i], hm[min(i + 2, len(hm) - 1)], 1.0) for i in range(0, len(hm) - 2, 3)], CAPE_T[2], alpha=0.55,
                            taper_to=1.0, clip=m))
    return lay

# the map's colours (front\Kompania_4.png): hood and cape (96, 100, 105)/(76, 79, 82)/(55, 57, 61)/(48, 50, 53), red hair
# (204, 96, 46)/(160, 58, 28)/(104, 30, 18), skin (235, 180, 146)/(222, 163, 132)/(197, 140, 111), tunic (96, 100, 105)/
# (117, 121, 125)
HOOD_R = [(0.0, (22, 24, 28)), (0.06, (38, 41, 46)), (0.12, (58, 62, 68)), (0.18, (76, 82, 88)), (0.24, (88, 94, 101)), (0.36, (100, 106, 113)),
          (0.6, (112, 118, 125)), (0.8, (126, 132, 139)), (1.0, (150, 156, 163))]
CAPE_T = ((62, 67, 74), (88, 94, 101), (110, 116, 123), (48, 52, 58))
TUNIC_T = ((80, 84, 90), (108, 112, 118), (130, 134, 140), (64, 67, 72))
LINING_T = ((22, 24, 28), (36, 39, 44), (50, 54, 60))
HAIR_R = [(0.0, (40, 10, 6)), (0.15, (78, 22, 10)), (0.3, (120, 40, 18)), (0.45, (160, 62, 28)), (0.6, (196, 90, 44)), (0.75, (220, 122, 64)),
          (0.9, (240, 164, 106)), (1.0, (250, 196, 146))]
SKIN_T = ((214, 150, 116), (238, 184, 150), (250, 206, 176))

# ---------- the face: brown eyes, a weathered skin, freckles, firmer brows ----------
FACE = [(108, 108), (150, 96), (186, 112), (200, 140), (196, 172), (178, 190), (152, 200), (130, 198), (114, 186), (106, 160)]
hd, s, v = hsv_of(b.src)
EYES = [[(108, 112), (140, 112), (140, 148), (108, 148)], [(152, 122), (190, 122), (190, 162), (152, 162)]]
irises = b.sel(hue=(330, 40), sat=(0.35, 1), val=(0.2, 0.95), polys=EYES)
b.ramp(irises, [(0.0, (12, 8, 6)), (0.2, (40, 24, 16)), (0.45, (86, 54, 32)), (0.7, (138, 94, 58)), (1.0, (204, 166, 120))])
# ---------- hair: red (the fringe, the locks, the far braid) ----------
hair = b.sel(hue=(170, 240), sat=(0.12, 1), box=(60, 40, 240, 230)) & ~b.poly(*EYES)
hair |= b.sel(hue=(170, 240), sat=(0.12, 1), polys=EYES) & ((b.yy < 126) | (b.xx > 183))
hair |= b.sel(hue=(60, 170), sat=(0.08, 1), val=(0.6, 1), box=(60, 40, 240, 230))     # (the pale green shine)
hair = b.grow(hair, 1, 0.3) & region(S, 60, 40, 240, 230)
b.ramp(hair, HAIR_R, gain=1.0)
skin = b.sel(hue=(330, 45), sat=(0.08, 0.6), val=(0.6, 1), poly=FACE) & ~irises & ~hair
b.multiply(skin, (248, 226, 210), 0.7)
b.over(dots(S, [(118, 160), (122, 164), (126, 158), (114, 166), (132, 163), (162, 168), (168, 172), (172, 166), (176, 172), (158, 174),
                (128, 152), (136, 156)], (196, 112, 80), r=1.0, alpha=0.55, clip=skin))
WR = (190, 120, 92)
b.over(strokes(S, [((112, 150), (118, 154), (126, 153), 0.9), ((164, 162), (172, 166), (182, 164), 0.9)], WR, alpha=0.4, clip=skin))

# ---------- the hood up: Actor3_5's hood (its shell and trim, without what is inside it), tilted with her head ----------
HOOD_OPEN = [(196, 240), (64, 212), (66, 190), (68, 170), (73, 150), (77.5, 130), (81.7, 110), (85, 100), (90, 92), (100, 87), (120, 85),
             (130, 92), (140, 99), (150, 110), (160, 120), (170, 127.5), (180, 136), (190, 143), (200, 151.5), (207, 162), (209, 178),
             (207, 193), (203, 210), (198, 224), (196, 240)]
HOOD_OUT = [(30, 0), (300, 0), (300, 150), (246, 180), (240, 192), (226, 204), (212, 216), (198, 230), (76, 230), (76, 212), (30, 212)]


def hood_mask(d):
    return d.op() & d.poly(HOOD_OUT) & ~d.poly(HOOD_OPEN)


M = affine(scale=(1.1, 1.05), rot=12, src_pt=(135, 128), dst_pt=(150, 130))
hood = hat_from('Actor3_5', hood_mask, M, S, HOOD_R)
# (its lower ends cut straight where the cape goes on, a dark fold line along the cut)
CUT = b.poly([(0, 256), (24, 238), (56, 220), (90, 208), (112, 204), (150, 224), (196, 234), (196, 350), (0, 350)],
             [(196, 246), (230, 206), (264, 218), (330, 206), (330, 350), (196, 350)])
hood[..., 3] *= ~CUT
ha = hood[..., 3] > 0.5
hem = ha & ~erode_cv(ha, 2) & dilate_cv(CUT, 2)
hood[..., :3] = np.where(hem[..., None], np.asarray(CAPE_T[3], np.float32) / 255.0, hood[..., :3])
openm = (poly_mask((S[1], S[0]), tr_pts(M, HOOD_OPEN)) > 0.5) & ~ha & ~CUT

# ---------- the head that stays (the face, the fringe, the locks); the far braid over the hood ----------
HEADK = [(40, 0), (290, 0), (290, 150), (214, 168), (200, 176), (184, 188), (164, 198), (146, 202), (128, 198), (112, 188), (100, 172),
         (40, 172)]
keep = b.poly(HEADK) & b.op() & openm
head = take(b.img, keep)
BRAID = b.poly([(96, 140), (112, 146), (122, 176), (124, 214), (100, 220), (74, 210), (72, 186), (84, 158)])
braid = take(b.img, BRAID & hair & b.op() | (BRAID & b.op() & dilate_cv(hair, 2) & (luma(b.src) < 0.3)))

# ---------- the new body: the hood's lining, the neck, the grey tunic, the cape ----------
body = np.zeros((H, W, 4), np.float32)
lin = cel(S, [tr_pts(M, HOOD_OPEN)], LINING_T, outline=False, shade=12, light=0, ldir=(0.55, -0.83))
lin[..., 3] *= openm
body = over(body, lin)
NECK = [(126, 190), (196, 168), (210, 184), (212, 232), (202, 256), (140, 256), (134, 226)]
neck = cel_b([NECK], SKIN_T, lw=2.0, shade=9, light=2)
nm = neck[..., 3] > 0.5
JAW = [(112, 188), (128, 198), (146, 202), (164, 198), (184, 188), (200, 176), (214, 166)]
sh = soft_poly(S, [JAW + [(x + 3, y + 15) for x, y in JAW[::-1]]]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the tunic: a plain grey wool (only its middle shows under the cape)
TUNIC = smooth([(-10, 350), (-6, 292), (10, 260), (48, 240), (96, 230), (132, 228)]) + [(172, 236)] + \
    smooth([(210, 230), (258, 234), (300, 250), (326, 278), (338, 320), (340, 350)])
tun = cel_b([TUNIC], TUNIC_T[:3], lw=2.0, shade=10, light=3)
tm = erode_cv(tun[..., 3] > 0.5, 2)
tun = over(tun, hair_strands(S, tm, (170, 600), TUNIC_T[2], TUNIC_T[3], n=150, length=(4, 9), seed=41, alpha=(0.14, 0.2)))
tun = over(tun, strokes(S, [((156, 290), (160, 320), (158, 350), 1.3), ((190, 290), (196, 320), (198, 350), 1.2)], TUNIC_T[3], alpha=0.6, clip=tm))
body = over(body, tun)
# the hood's short cape over the shoulders, its fronts tied at the throat with a cord, parting below it
CL = (169, 242)                     # where the cape's fronts meet (the tie)
L_TOP = smooth([(-10, 272), (4, 258), (24, 238), (56, 220), (90, 208), (118, 200)])
L_NECK = smooth([(118, 200), (132, 216), (150, 232), CL], 2)
L_FRONT = smooth([CL, (154, 262), (144, 282), (136, 300)], 2)
L_HEM = wavy(smooth([(136, 300), (104, 298), (78, 304), (48, 310), (18, 312), (-10, 308)], 2), 2.6, 4.0)
R_TOP = smooth([(340, 278), (322, 258), (296, 236), (264, 218), (230, 206), (206, 200)])
R_NECK = smooth([(206, 200), (200, 214), (188, 228), CL], 2)
R_FRONT = smooth([CL, (184, 262), (198, 284), (212, 304)], 2)
R_HEM = wavy(smooth([(212, 304), (240, 312), (272, 320), (306, 326), (340, 324)], 2), 2.6, 4.0, 1.3)
FOLDS_L = [((122, 214), (100, 300), 6.0), ((104, 210), (62, 306), 7.0), ((80, 214), (30, 310), 6.0), ((140, 236), (130, 296), 4.0)]
FOLDS_R = [((200, 220), (232, 310), 6.0), ((216, 212), (270, 318), 7.0), ((240, 212), (306, 324), 6.0), ((190, 240), (204, 300), 4.0)]
cape = np.zeros((H, W, 4), np.float32)
for poly, folds, hem, seed in ((L_TOP + L_NECK + L_FRONT + L_HEM, FOLDS_L, L_HEM, 42), (R_TOP + R_NECK + R_FRONT + R_HEM, FOLDS_R, R_HEM, 43)):
    cape = over(cape, cape_half(poly, folds, hem, seed))
body = over(body, cape)
# the cord tied at the throat
body = over(body, strokes(S, [((156, 236), (162, 244), CL, 2.2), ((182, 236), (176, 244), CL, 2.2), (CL, (164, 256), (160, 268), 1.8),
                              (CL, (174, 256), (178, 266), 1.8)], (86, 66, 50), alpha=1.0, taper_to=0.8))
body = over(body, cel(S, [ellipse(CL[0], CL[1], 4.5, 3.5, 0, 20)], ((70, 52, 38), (110, 84, 62), (140, 110, 84)), lw=1.2, shade=1.5, light=1.0,
                      ldir=LD))

b.img = body
b.over(head)
# the near lock of red hair hanging beside the cheek from under the hood's rim
LOCK = smooth([(181, 112), (185, 134), (189, 156), (193, 178), (200, 202)], 2) + \
    smooth([(200, 202), (210, 186), (213, 160), (211, 134), (205, 112)], 2)
lock = cel(S, [LOCK], ((150, 54, 24), (196, 90, 44), (224, 132, 74)), lw=1.6, shade=4, light=1.5, ldir=LD)
lk = erode_cv(lock[..., 3] > 0.5, 1)
lock = over(lock, hair_strands(S, lk, (200, 230), (236, 150, 92), (128, 40, 18), n=40, length=(10, 20), seed=44, alpha=(0.6, 0.6)))
b.over(lock)
cast_shadow(b, hood[..., 3], dx=3, dy=8, col=(110, 90, 100), k=0.55)
b.over(hood)
b.over(braid)
# a thin old scar on the near cheek (a mercenary's)
b.over(strokes(S, [((179, 160), (173, 168), (166, 177), 3.0)], (200, 128, 100), alpha=0.75, taper_to=0.5))
b.over(strokes(S, [((179.4, 160.4), (173.4, 168.4), (166.4, 177.2), 1.3)], (252, 222, 204), alpha=0.95, taper_to=0.4))
b.save(OUT)
print('ok', OUT)
