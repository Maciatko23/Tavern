# Kazik Kolek (Wolna Kompania, docs/PODROZNI.md 2.13 / D47: a sturdy good-natured archer of about 35, 2026-10-29): Actor1_7
# (the grey-haired young knight in the white-and-blue coat) repainted to his map sheet ($Npc_Kompania_3, $Human_Archer recoloured
# by tools/podroznicy/kompania.py) - the calm smiling face kept, a little older and weathered (lines at the eyes, a tanned
# skin), the purple eyes dark brown; the grey hair BROWN and only its fringe left under a GREY HOOD pulled UP over the head (the
# hood of Actor3_5 cut out, recoloured grey, a dark lining inside it); a SHORT BROWN BEARD round the jaw with a moustache
# (painted); everything under the head painted new: the neck, a BROWN LEATHER TUNIC laced at the throat over a cream linen
# shirt, the hood's SHORT GREY CAPE over the shoulders, the QUIVER's leather strap across the chest (a buckle) and the quiver on
# his back with the arrows' fletchings showing over the far shoulder.
# 0 PixelLab generations. Run: python tools/busts/make_kompania_3.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kompania_3_Bust.png')
b = Bust('Actor1_7')
HS_X, HS_Y, HROT, HDST = 1.1, 1.05, 0.0, (152, 124)      # (the hood's fit on this head)
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

# the map's colours (front\Kompania_3.png): hood (101, 106, 111)/(88, 94, 101)/(64, 69, 75)/(54, 57, 62), hair (122, 83, 57)/
# (105, 73, 52)/(75, 47, 31), beard (105, 73, 52)/(92, 60, 42), skin (242, 187, 153)/(221, 176, 145)/(177, 131, 102), tunic
# (122, 83, 57)/(105, 73, 52)/(82, 53, 37), shirt (226, 206, 181)/(187, 174, 154)/(152, 135, 114), quiver (131, 88, 61)
HOOD_R = [(0.0, (22, 24, 28)), (0.06, (38, 41, 46)), (0.12, (58, 62, 68)), (0.18, (76, 82, 88)), (0.24, (88, 94, 101)), (0.36, (100, 106, 113)),
          (0.6, (112, 118, 125)), (0.8, (126, 132, 139)), (1.0, (150, 156, 163))]
CAPE_T = ((62, 67, 74), (88, 94, 101), (110, 116, 123), (48, 52, 58))
LINING_T = ((22, 24, 28), (36, 39, 44), (50, 54, 60))
HAIR_R = [(0.0, (18, 10, 6)), (0.15, (42, 26, 16)), (0.3, (70, 44, 28)), (0.45, (96, 64, 42)), (0.6, (118, 82, 56)), (0.8, (146, 108, 76))]
BEARD_T = ((76, 50, 32), (104, 72, 50), (132, 96, 68), (54, 34, 22))
TUNIC_T = ((70, 45, 30), (108, 74, 52), (134, 96, 66), (52, 32, 22))
SHIRT_T = ((160, 142, 118), (214, 196, 170), (234, 220, 198))
STRAP_T = ((50, 32, 20), (82, 54, 34), (112, 78, 52))
QUIVER_T = ((76, 50, 32), (126, 86, 58), (156, 114, 80))
IRON_T = ((60, 60, 66), (112, 112, 120), (170, 170, 178))
FLETCH_T = ((150, 140, 124), (214, 206, 190), (240, 236, 226))
SKIN_T = ((214, 150, 116), (240, 186, 152), (250, 208, 178))

# ---------- the face: brown eyes, warmer weathered skin, lines of age ----------
FACE = [(96, 104), (140, 82), (200, 84), (214, 120), (212, 152), (200, 178), (180, 194), (163, 200), (140, 194), (120, 180), (104, 160),
        (96, 134)]
hd, s, v = hsv_of(b.src)
EYES = [[(104, 112), (140, 112), (140, 134), (104, 134)], [(158, 108), (196, 106), (196, 130), (158, 132)]]
irises = b.sel(hue=(200, 300), sat=(0.2, 1), polys=EYES)
b.ramp(irises, [(0.0, (12, 8, 6)), (0.2, (36, 22, 14)), (0.45, (82, 52, 30)), (0.7, (132, 90, 56)), (1.0, (196, 160, 120))])
skin = b.sel(hue=(330, 50), sat=(0.08, 0.75), val=(0.55, 1), poly=FACE) | b.sel(sat=(0, 0.12), val=(0.85, 1), poly=FACE)
skin &= ~irises
b.multiply(skin, (246, 222, 204), 0.7)
WR = (176, 112, 84)
b.over(strokes(S, [((104, 134), (110, 138), (118, 138), 1.0), ((176, 132), (184, 135), (192, 132), 1.0), ((196, 116), (201, 120), (203, 126), 0.9),
                   ((100, 120), (98, 125), (99, 130), 0.9)], WR, alpha=0.45, clip=skin))

# ---------- hair: brown ----------
HEADR = [(60, 0), (260, 0), (260, 180), (214, 160), (214, 118), (200, 92), (150, 86), (100, 104), (96, 140), (60, 140)]
hair = b.poly(HEADR) & b.op() & ~skin
hair |= b.poly([(96, 60), (214, 60), (214, 128), (196, 126), (160, 104), (140, 112), (100, 112)]) & b.op() & \
    ~(b.sel(hue=(330, 50), sat=(0.15, 0.75), val=(0.75, 1))) & ~irises
hair |= b.sel(hue=(190, 300), sat=(0.15, 1), box=(88, 95, 216, 142)) & ~b.poly(*EYES)      # (the blue rim light on the strands)
hair &= ~b.poly(*EYES) | (b.yy < 112)
b.ramp(hair, HAIR_R, gain=0.95)
# (the brows: dark brown)
brows = b.sel(lum=(0, 0.45), polys=[[(104, 104), (140, 104), (140, 114), (104, 116)]]) & ~hair
b.ramp(brows, [(0.0, (30, 18, 12)), (0.5, (70, 44, 28)), (1.0, (110, 76, 50))])

# ---------- the short brown beard round the jaw, a moustache ----------
OUTER = [(214, 140), (213, 158), (206, 176), (194, 192), (178, 204), (162, 210), (144, 205), (128, 194), (114, 178), (104, 160),
         (99, 140)]
INNER = [(106, 144), (114, 160), (124, 172), (136, 180), (150, 184), (164, 184), (176, 180), (188, 170), (198, 158), (206, 144)]
MOUS = [(132, 172), (140, 164), (150, 161), (160, 162), (170, 162), (180, 166), (186, 174), (178, 172), (166, 170), (154, 170),
        (142, 172), (134, 177)]
bd = beard2(S, OUTER, INNER, BEARD_T, flow=(160, 230), mous=MOUS, mous_flow=(158, 190), seed=31, n=120, tip=3.5, out=1.8, seg=7)
b.over(bd)
b.over(stubble(S, [(104, 138), (118, 150), (132, 160), (128, 166), (114, 160), (104, 150)], (90, 60, 40), density=0.3, seed=32, alpha=0.4,
               clip=skin))
b.over(stubble(S, [(196, 132), (210, 128), (210, 146), (198, 156), (190, 150)], (90, 60, 40), density=0.3, seed=33, alpha=0.4, clip=skin))

# ---------- the hood up: Actor3_5's hood (its shell and trim, without what is inside it) moved onto this head ----------
HOOD_OPEN = [(196, 240), (64, 212), (66, 190), (68, 170), (73, 150), (77.5, 130), (81.7, 110), (85, 100), (90, 92), (100, 87), (120, 85),
             (130, 92), (140, 99), (150, 110), (160, 120), (170, 127.5), (180, 136), (190, 143), (200, 151.5), (207, 162), (209, 178),
             (207, 193), (203, 210), (198, 224), (196, 240)]
HOOD_OUT = [(30, 0), (300, 0), (300, 150), (246, 180), (240, 192), (226, 204), (212, 216), (198, 230), (76, 230), (76, 212), (30, 212)]


def hood_mask(d):
    return d.op() & d.poly(HOOD_OUT) & ~d.poly(HOOD_OPEN)


M = affine(scale=(HS_X, HS_Y), rot=HROT, src_pt=(135, 128), dst_pt=HDST)
hood = hat_from('Actor3_5', hood_mask, M, S, HOOD_R)
# (its lower ends cut straight where the cape goes on, a dark fold line along the cut)
CUT = b.poly([(0, 254), (26, 232), (60, 212), (96, 202), (126, 196), (160, 212), (204, 224), (204, 350), (0, 350)],
             [(204, 234), (226, 202), (262, 214), (330, 196), (330, 350), (204, 350)])
hood[..., 3] *= ~CUT
ha = hood[..., 3] > 0.5
hem = ha & ~erode_cv(ha, 2) & dilate_cv(CUT, 2)
hood[..., :3] = np.where(hem[..., None], np.asarray(CAPE_T[3], np.float32) / 255.0, hood[..., :3])
openm = (poly_mask((S[1], S[0]), tr_pts(M, HOOD_OPEN)) > 0.5) & ~ha & ~CUT

# ---------- the head that stays (the face, the fringe, the beard); the coat goes ----------
HEAD = [(60, 0), (270, 0), (270, 140), (216, 140), (214, 150), (206, 176), (194, 192), (178, 204), (162, 210), (144, 205), (128, 194),
        (114, 178), (104, 160), (96, 140), (60, 140)]
keep = ((b.poly(HEAD) & b.op()) | (bd[..., 3] > 0.02)) & (openm | ha)
head = take(b.img, keep)

# ---------- the new body: the quiver on the back, the neck, the leather tunic, the strap, the cape ----------
body = np.zeros((H, W, 4), np.float32)
# the quiver behind the far shoulder (its mouth tilted up to the left), the fletchings of five arrows sticking out of it
QA, QB = np.array([108.0, 296.0]), np.array([64.0, 198.0])          # the quiver's axis: bottom -> mouth
qd = (QB - QA) / np.linalg.norm(QB - QA)
qn = np.array([-qd[1], qd[0]])


def rot(v, deg):
    a = np.radians(deg)
    return np.array([v[0] * np.cos(a) - v[1] * np.sin(a), v[0] * np.sin(a) + v[1] * np.cos(a)])


for off, ln, ang, tone in ((-10, 38, -6, FLETCH_T), (6, 46, 6, FLETCH_T), (-2, 54, 0, ((120, 64, 46), (170, 96, 70), (200, 130, 100))),
                           (12, 34, 13, FLETCH_T), (-15, 28, -14, FLETCH_T)):
    dd = rot(qd, ang)
    nn = np.array([-dd[1], dd[0]])
    p0 = QB + qn * off - qd * 4
    p1 = p0 + dd * ln                                   # (the nock end)
    body = over(body, cel(S, [taper(np.asarray([p0, p1 + dd * 2]), 2.0, 2.0)], ((70, 46, 28), (112, 78, 50), (140, 104, 70)), lw=0.8,
                          shade=0.8, light=0.5, ldir=LD))
    for sg in (1, -1):
        loc = [(-3, 0), (-6, 2.2), (-20, 4.6), (-26, 4.2), (-24, 0.8)]
        vane = [tuple(p1 + dd * t + nn * u * sg) for t, u in loc]
        body = over(body, cel(S, [vane], tone, lw=0.9, shade=1.2, light=0.8, ldir=LD))
    body = over(body, strokes(S, [(tuple(p1 - dd * 24), tuple(p1 - dd * 12), tuple(p1 - dd * 2), 0.8)], LINE, alpha=0.7, taper_to=1.0))
QUIV = [tuple(QA + qn * 15), tuple(QB + qn * 17), tuple(QB - qn * 17), tuple(QA - qn * 15)]
body = over(body, cel(S, [QUIV], QUIVER_T, lw=1.8, shade=6, light=2.5, ldir=LD))
ang = np.degrees(np.arctan2(qn[1], qn[0]))
body = over(body, cel(S, [ellipse(QB[0] - qd[0] * 2, QB[1] - qd[1] * 2, 18.5, 5.5, np.radians(ang), 30)], STRAP_T, lw=1.4, shade=2.0, light=1.2,
                      ldir=LD, holes=[ellipse(QB[0] - qd[0] * 1, QB[1] - qd[1] * 1, 14.5, 2.6, np.radians(ang), 24)]))
body = over(body, strokes(S, [(tuple(QA + qn * 12 + qd * 30), tuple((QA + QB) / 2 + qn * 13), tuple(QB + qn * 14 - qd * 12), 1.2)], QUIVER_T[0],
                          alpha=0.7, taper_to=1.0))
# the lining of the hood behind the head (in its opening)
lin = cel(S, [tr_pts(M, HOOD_OPEN)], LINING_T, outline=False, shade=12, light=0, ldir=(0.55, -0.83))
lin[..., 3] *= openm
body = over(body, lin)
# the neck
NECK = [(132, 196), (200, 170), (214, 186), (214, 236), (204, 262), (146, 262), (140, 226)]
neck = cel_b([NECK], SKIN_T, lw=2.0, shade=9, light=2)
nm = neck[..., 3] > 0.5
JAW = [(128, 194), (144, 205), (162, 210), (178, 204), (194, 192), (206, 176), (214, 160)]
sh = soft_poly(S, [JAW + [(x + 3, y + 16) for x, y in JAW[::-1]]]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the tunic (brown leather): a V-neck laced across, the linen shirt's edge inside it
TUNIC = smooth([(-10, 350), (-6, 290), (10, 256), (48, 236), (96, 226), (130, 222)]) + [(146, 232), (166, 278), (172, 292), (178, 280),
                                                                                        (200, 238), (212, 228)]     + smooth([(212, 228), (258, 232), (300, 248), (326, 276), (338, 320), (340, 350)])
SHIRT = [(140, 226), (166, 282), (172, 296), (180, 282), (206, 230), (212, 236), (182, 296), (172, 306), (162, 298), (134, 232)]
body = over(body, cel(S, [SHIRT], SHIRT_T, lw=1.4, shade=2.5, light=1.2, ldir=LD))
tun = cel_b([TUNIC], TUNIC_T[:3], lw=2.0, shade=10, light=3)
tm = erode_cv(tun[..., 3] > 0.5, 2)
tun = over(tun, hair_strands(S, tm, (170, 600), TUNIC_T[2], TUNIC_T[3], n=150, length=(4, 9), seed=34, alpha=(0.14, 0.2)))
tun = over(tun, line_along(smooth([(196, 300), (204, 330), (206, 350)], 2), 1.4, TUNIC_T[3], 0.7))
body = over(body, tun)
for k in range(3):         # the lacing across the V
    y = 252 + k * 13
    w = 15 - k * 4.5
    body = over(body, strokes(S, [((172 - w, y), (172, y + 5), (172 + w, y - 1), 1.4)], (58, 38, 24), alpha=1.0, taper_to=1.0))
    body = over(body, strokes(S, [((172 - w, y + 6), (172, y + 1), (172 + w, y + 5), 1.4)], (58, 38, 24), alpha=1.0, taper_to=1.0))
# the quiver's strap across the chest (from the far shoulder down to the near side), an iron buckle
STRAP = taper(bez((100, 232), (156, 286), (214, 350), 30), 14, 15)
body = over(body, cel_b([STRAP], STRAP_T, lw=1.6, shade=3, light=1.4))
body = over(body, cel(S, [[(140, 270), (158, 285), (150, 296), (132, 281)]], IRON_T, lw=1.2, shade=1.5, light=1.0, ldir=LD,
                      holes=[[(141, 276), (154, 287), (149, 292), (136, 281)]]))
# the hood's short cape over the shoulders, open in front (the tunic and the strap show between its edges)
L_TOP = smooth([(-10, 270), (4, 252), (26, 228), (60, 210), (96, 200), (124, 192)])
L_FRONT = smooth([(124, 192), (132, 204), (136, 224), (134, 248), (126, 268)], 2)
L_HEM = wavy(smooth([(126, 268), (104, 282), (78, 294), (48, 302), (18, 306), (-10, 302)], 2), 2.6, 4.0)
R_TOP = smooth([(340, 274), (322, 254), (296, 230), (262, 212), (226, 200), (198, 190)])
R_FRONT = smooth([(198, 190), (212, 210), (212, 240), (213, 266), (218, 294)], 2)
R_HEM = wavy(smooth([(218, 294), (240, 304), (272, 314), (306, 320), (340, 318)], 2), 2.6, 4.0, 1.3)
FOLDS_L = [((120, 208), (106, 280), 5.0), ((100, 204), (64, 298), 7.0), ((74, 210), (28, 304), 6.0)]
FOLDS_R = [((214, 214), (236, 300), 5.0), ((232, 206), (272, 314), 7.0), ((256, 212), (308, 320), 6.0)]
cape = np.zeros((H, W, 4), np.float32)
for poly, folds, hem, seed in ((L_TOP + L_FRONT + L_HEM, FOLDS_L, L_HEM, 35), (R_TOP + R_FRONT + R_HEM, FOLDS_R, R_HEM, 36)):
    cape = over(cape, cape_half(poly, folds, hem, seed))
body = over(body, cape)

b.img = body
b.over(head)
cast_shadow(b, hood[..., 3], dx=3, dy=8, col=(110, 90, 100), k=0.55)
b.over(hood)
b.save(OUT)
print('ok', OUT)
