# Rafal (a soldier of a broken regiment, about 25, poor): SF_Actor2_7 repainted to his map sprite - the straight blond hair
# nearly black dark brown and messy with curls (curly locks painted round its edge, hanging over the forehead and down the
# nape behind the ear), a few days' dark beard on the jaw, chin and upper lip, tired eyes, the hooded jacket and the T-shirt
# gone: a plain blue linen tunic painted over the body (the hood cut off the shoulders, under the jaw the background shows),
# a slit at the throat with a cord, vertical folds, a sewn-on brown patch on the chest, two small tears.
# Run: python tools/busts/make_rafal.py [out.png]
import sys
from kit import *
from patches import patch, smudge, hole, rip

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Rafal_Bust.png')
b = Bust('SF_Actor2_7')
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
    """Flat tone patches (the shade shapes of the folds) inside clip."""
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


# ---------- masks of the original ----------
hair = b.sel(hue=(30, 65), sat=(0.15, 1), val=(0, 0.95), box=(60, 0, 280, 200))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 0, 280, 200)
skin = b.sel(hue=(340, 40), sat=(0.08, 0.75), val=(0.4, 1), poly=[(80, 60), (240, 60), (240, 200), (206, 200), (204, 250), (126, 250),
                                                                   (126, 196), (80, 160)]) & ~hair


def big_parts(m, n=150):
    """m without its small specks (connected parts under n px)."""
    k, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
    return np.isin(lab, [i for i in range(1, k) if st[i, cv2.CC_STAT_AREA] >= n])


skin = big_parts(skin)
hood = b.sel(hue=(190, 260), sat=(0.25, 1), val=(0, 0.6))          # (the jacket's dark blue: never a line to keep)

# ---------- a new silhouette below the head: the hood off the shoulders (under the jaw the background shows) ----------
NECKLINE = curve((137, 190), (134, 200), (132, 214), (134, 230), (142, 241), (152, 245), (166, 243), (180, 233), (192, 219), (196, 207),
                 (197, 196), (198, 186), (201, 177), (214, 172), (234, 175), (250, 182))
L_SH = curve((137, 190), (118, 196), (96, 203), (78, 212), (66, 224), (60, 240), (55, 262), (50, 290), (46, 320), (44, 350), (43, 400))
R_SH = curve((250, 182), (268, 192), (282, 204), (290, 220), (298, 238), (306, 254), (314, 270), (323, 286), (328, 306), (329, 400))
TUNIC = L_SH[::-1] + NECKLINE + R_SH + [(336, 420), (35, 420)]
keep = skin | hair | (b.lines_of(skin | hair, 2) & ~hood)
sil = np.maximum(soft_poly(S, [TUNIC]), keep.astype(np.float32))
cut = region(S, 0, 150, W, H) | region(S, 196, 126, W, H)
b.img[..., 3] = np.where(cut, b.img[..., 3] * sil, b.img[..., 3])
# behind the ear: the thin straight lock and the hood between its strands go (curly locks are painted there later)
NAPE = [(198, 112), (226, 100), (244, 118), (246, 150), (240, 178), (204, 182), (199, 160)]
face_lines = skin | (b.lines_of(skin, 2) & ~hood)
b.erase(b.poly(NAPE) & ~face_lines & (b.yy < 176))
alpha0 = b.img[..., 3].copy()

# ---------- the tunic: one shape over the body below the neckline ----------
TUN_T = ((62, 82, 104), (92, 118, 142), (128, 154, 176))
TUN_DEEP = (44, 58, 76)
tun_m = (b.img[..., 3] > 0.5) & (b.yy > 150) & b.poly(TUNIC) & ~hair
b.ramp(dilate_cv(tun_m, 2) & ~erode_cv(skin, 1) & ~hair & (b.yy > 150), [(0.0, TUN_T[0]), (1.0, TUN_T[1])])   # (under the soft edge)
b.over(celp([TUNIC], TUN_T, clip=tun_m, shade=12, light=3, lw=2.2))
tm = erode_cv(tun_m, 2)
# the shade shapes: inside the near arm, under the far shoulder, the throat's shadow on the cloth
SHADES = [curve((60, 228), (56, 260), (60, 300), (66, 350)) + [(66, 380), (40, 380)] + curve((40, 380), (44, 300), (50, 244)),
          curve((268, 196), (276, 230), (280, 262), (286, 300), (292, 350)) + [(336, 380), (336, 280)] + curve((336, 280), (316, 244), (292, 206)),
          curve((134, 232), (146, 252), (166, 256), (186, 246), (196, 228)) + [(198, 214)] + curve((198, 214), (184, 238), (166, 247), (148, 246),
                                                                                                (138, 238))]
b.over(flat(SHADES, TUN_T[0], tm))
# vertical linen folds: shade wedges widening downwards, a crease in each, a lit edge beside it
FOLDS = [((92, 258), (97, 300), (92, 360), 1.0, 9.0), ((124, 282), (129, 320), (125, 360), 1.0, 6.0), ((162, 280), (164, 320), (160, 360), 1.0, 7.0),
         ((206, 250), (213, 300), (211, 360), 1.5, 10.0), ((246, 228), (253, 290), (257, 360), 1.5, 9.0), ((74, 296), (79, 330), (77, 360), 1.0, 5.0)]
b.over(flat([taper(bez(p0, p1, p2, 24), w0, w1) for p0, p1, p2, w0, w1 in FOLDS], TUN_T[0], tm))
b.over(strokes(S, [(p0, p1, p2, 1.3) for p0, p1, p2, w0, w1 in FOLDS], TUN_DEEP, alpha=0.85, clip=tm, taper_to=1.4))
b.over(strokes(S, [((p0[0] - 3, p0[1] + 6), (p1[0] - 3 - w1 * 0.2, p1[1]), (p2[0] - 2 - w1 * 0.6, p2[1]), 1.3) for p0, p1, p2, w0, w1 in FOLDS],
               TUN_T[2], alpha=0.7, clip=tm))
b.over(strokes(S, [((54, 250), (50, 270), (48, 296), 1.6), ((92, 214), (110, 208), (124, 206), 1.4)], TUN_T[2], alpha=0.85, clip=tm))
b.over(strokes(S, [((62, 232), (58, 280), (66, 348), 1.8), ((276, 232), (282, 280), (292, 348), 1.8)], LINE, alpha=0.9, clip=tm, taper_to=0.4))
# the hem round the neck, the slit at the throat with a cord
HEM = curve((131, 198), (128, 214), (131, 230), (140, 246), (152, 251), (168, 249), (184, 239), (196, 224), (204, 206), (206, 190), (209, 182),
            (222, 178), (240, 183))
b.over(strokes(S, [(HEM[i], HEM[i + 1], HEM[i + 1], 1.4) for i in range(len(HEM) - 1)], TUN_DEEP, alpha=0.8, taper_to=1.0, clip=tm))
SLIT = [(150, 245), (157, 245), (158, 262), (155, 276), (152, 262)]
b.over(celp([SLIT], ((40, 26, 22), (60, 40, 34), (80, 56, 46)), lw=1.2, shade=2, light=0))
CORD = ((96, 70, 44), (150, 118, 76), (190, 160, 110))
b.over(strokes(S, [((146, 250), (153, 253), (161, 252), 1.6), ((146, 260), (154, 262), (161, 259), 1.6), ((161, 252), (164, 258), (163, 266), 1.3)],
               CORD[1], alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((146, 251), (153, 254), (161, 253), 0.7), ((146, 261), (154, 263), (161, 260), 0.7)], CORD[0], alpha=0.9, taper_to=1.0))

# ---------- wear: a sewn-on brown patch, a torn hole ----------
cloth = tm & ~b.poly(SLIT)
b.img = patch(b.img, [(88, 270), (122, 260), (134, 284), (126, 304), (96, 306)], cloth, lift=1.2, hue=(24, 0.38), seed=4)
b.img = hole(b.img, rip([(262, 300), (267, 308), (270, 318)], 6.0, seed=4, jag=0.4, alt=0.2, step=2.0), fill=(58, 44, 40),
             shade=(40, 30, 28), line=(24, 26, 32), lip=TUN_T[2])
b.img = hole(b.img, rip([(66, 286), (70, 296), (71, 308)], 5.0, seed=8, jag=0.45, alt=0.2, step=2.0), fill=(58, 44, 40),
             shade=(40, 30, 28), line=(24, 26, 32), lip=TUN_T[2])

# ---------- the hair: nearly black brown, messy with curls ----------
HAIR = [(0.0, (12, 8, 6)), (0.2, (26, 17, 12)), (0.4, (44, 30, 21)), (0.6, (66, 45, 32)), (0.8, (92, 65, 46)), (1.0, (120, 90, 64))]
HT = ((26, 17, 12), (48, 32, 23), (76, 53, 38))
rim = b.sel(hue=(60, 120), sat=(0.2, 1), box=(60, 0, 250, 170))
hair2 = (hair | dilate(rim, 1)) & b.op() & ~skin
b.ramp(hair2, HAIR, gain=0.64)


def curl_poly(x, y, ang, L, turn, w):
    """A lock of curly hair: a tapered stroke from (x, y) at angle ang (deg), curling by turn (deg) towards its tip."""
    n = 26
    t = np.linspace(0, 1, n)
    a = np.radians(ang) + np.radians(turn) * t ** 1.5
    st = L / (n - 1)
    pts = np.cumsum(np.stack([np.cos(a), np.sin(a)], 1) * st, 0) + np.array([x, y]) - np.array([np.cos(a[0]), np.sin(a[0])]) * st
    return taper(pts, w, 0.6, w_mid=w * 0.85)


def curls_round(mask, every=11.0, inset=3.5, L=(10, 15), w=(6.0, 8.0), turn=(130, 200), ylim=150, seed=1, skip=None):
    """Curly locks along the outer edge of mask (pointing out, curling either way)."""
    rng = np.random.RandomState(seed)
    cs, _ = cv2.findContours(fill_holes(mask).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=len)[:, 0, :].astype(np.float64)
    seg = np.linalg.norm(np.diff(c, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    polys = []
    s = rng.uniform(0, every)
    while s < cum[-1]:
        i = np.searchsorted(cum, s)
        p = c[min(i, len(c) - 1)]
        q0, q1 = c[max(i - 4, 0)], c[min(i + 4, len(c) - 1)]
        d = q1 - q0
        nrm = np.array([d[1], -d[0]]) / max(np.linalg.norm(d), 1e-6)
        # outward: away from the mask
        tx, ty = int(np.clip(p[0] + nrm[0] * 4, 0, mask.shape[1] - 1)), int(np.clip(p[1] + nrm[1] * 4, 0, mask.shape[0] - 1))
        if mask[ty, tx]:
            nrm = -nrm
        if p[1] < ylim and (skip is None or not skip[int(p[1]), int(p[0])]):
            ang = np.degrees(np.arctan2(nrm[1], nrm[0])) + rng.uniform(-30, 30)
            sgn = 1 if rng.rand() < 0.5 else -1
            polys.append(curl_poly(p[0] - nrm[0] * inset, p[1] - nrm[1] * inset, ang, rng.uniform(*L), sgn * rng.uniform(*turn),
                                   rng.uniform(*w)))
        s += every * rng.uniform(0.8, 1.2)
    return polys


face_zone = b.poly([(92, 98), (120, 70), (140, 56), (186, 58), (204, 90), (228, 92), (230, 145), (150, 200), (90, 160)])
edge_polys = curls_round(hair2 | b.lines_of(hair2, 2), every=14.0, inset=6.0, L=(15, 22), w=(8.0, 11.0), turn=(100, 170), seed=3, skip=face_zone)


def curl_layer(polys, batches=3, lw=1.4):
    """Curly locks painted in a few batches (the later ones overlap the earlier ones with their own line)."""
    lay = None
    for k in range(batches):
        part = cel(S, polys[k::batches], HT, lw=lw, shade=2.5, light=1.2, ldir=LD)
        lay = part if lay is None else over(lay, part)
    return lay


# curly locks hanging over the forehead (above the eyes)
FRINGE = [(157, 60, 100, 30, 80, 10), (166, 54, 92, 38, -85, 11), (178, 58, 84, 36, 95, 11), (189, 68, 78, 28, -90, 10)]
NAPE_T = ((26, 17, 12), (44, 30, 21), (68, 47, 34))
NAPE_HAIR = curve((200, 104), (224, 98), (242, 112), (248, 134), (246, 156), (240, 172)) +     strand_edge([(240, 172), (226, 170), (212, 170), (202, 166)], side=1, seg=8, tip=4, out=3.0, seed=9)[1:] + [(199, 150), (199, 120)]
fr_polys = [curl_poly(x, y, a_, L_, t_, w_) for x, y, a_, L_, t_, w_ in FRINGE]
nape = cel(S, [NAPE_HAIR], NAPE_T, lw=1.6, shade=6, light=2, ldir=LD)
nm = nape[..., 3] > 0.5
nape = over(nape, hair_strands(S, erode_cv(nm, 2), (226, 190), (82, 58, 42), (16, 10, 8), n=40, length=(8, 14), seed=9, alpha=(0.5, 0.5)))
nape = over(nape, curl_layer(curls_round(nm, every=13.0, inset=5.0, L=(13, 18), w=(8.0, 10.0), turn=(100, 160), ylim=H, seed=5,
                                         skip=b.poly([(150, 60), (238, 60), (238, 150), (150, 150)])), 2, lw=1.4))
nape[..., 3] *= ~face_lines
locks = curl_layer(edge_polys)
locks = over(nape, locks)
b.over(locks)
b.over(curl_layer(fr_polys, 2, lw=1.3))
b.img[..., 3] = np.minimum(b.img[..., 3], np.maximum(alpha0, locks[..., 3]))

# ---------- a few days' dark beard on the jaw, chin and upper lip; tired eyes ----------
face = skin & b.op()
BEARD = [(104, 146), (116, 162), (130, 178), (142, 189), (156, 189), (170, 178), (184, 164), (196, 150), (204, 132), (208, 118), (200, 122),
         (190, 140), (178, 152), (166, 162), (160, 168), (148, 171), (136, 168), (126, 162), (118, 152), (110, 144)]
LIP = [(122, 157), (130, 151), (146, 149), (160, 150), (167, 156), (160, 157), (146, 155), (132, 156)]
b.multiply(soft_poly(S, [BEARD, LIP], blur=1.5) * face, (214, 186, 176), 1.0)
b.over(stubble(S, BEARD, (50, 34, 26), density=0.5, seed=3, alpha=0.62, clip=face))
b.over(stubble(S, LIP, (50, 34, 26), density=0.45, seed=4, alpha=0.5, clip=face))
b.over(strokes(S, [((160, 120), (171, 123), (183, 119), 1.1), ((108, 127), (115, 129), (122, 127), 1.0)], (196, 128, 120), alpha=0.6,
               clip=face))
b.save(OUT)
print('ok', OUT)
