# Urszula z Olszynki (a traveller from the ferry, docs/PODROZNI.md 2.6: a tired peasant mother of about 40 looking for her son,
# 2026-10-29): SF_Actor1_2 (the brown-haired girl in the white coat) repainted to her PixelLab map sheet ($Npc_Urszula) - the
# kind face kept but older and sadder (the smile turned into a small closed mouth with the corners down, tired shadows and soft
# lines under the eyes, faint lines from the nose, the skin a little paler and duller), the red eyes dark brown; the girl's long
# fringe over the eyes painted away (a bare forehead, thin sad brows with the inner ends raised, a worry line) and the hair,
# duller brown with grey strands, parted in the middle and drawn back under the scarf; the rest of the hair, the braid and the
# earring hidden under a painted WHITE LINEN HEADSCARF that covers the head and falls to the shoulders (pinned under the chin
# with a small knot);
# everything under the head painted new: a faded GREY-BLUE wool dress, a BROWN knitted wool shawl over the shoulders (its ends
# crossed on the chest, a ragged fringe) and the top of a folded letter held at the bottom edge.
# 0 PixelLab generations. Run: python tools/busts/make_urszula.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Urszula_Bust.png')
b = Bust('SF_Actor1_2')
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


def inpaint(m, r=5):
    """Fill the pixels of m from the colours round them (a smile, a line to take away)."""
    img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
    fill = cv2.inpaint(img8, m.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], fill, b.img[..., :3])


# the map's colours ($Npc_Urszula front frame): headscarf (234, 230, 216)/(201, 191, 175)/(180, 172, 155)/(153, 148, 139),
# shawl (117, 86, 58)/(100, 76, 56)/(77, 54, 36)/(40, 31, 25), dress (118, 132, 132)/(101, 115, 115)/(74, 87, 90)/(52, 63, 67),
# skin (235, 200, 174)/(187, 155, 133)/(178, 129, 112), the hair at the forehead (139, 119, 104)/(115, 97, 75), letter (236, 215, 186)
HAIR = [(0.0, (24, 17, 13)), (0.15, (50, 38, 29)), (0.3, (78, 62, 48)), (0.45, (104, 86, 68)), (0.6, (130, 110, 90)), (0.8, (160, 142, 122)),
        (1.0, (194, 180, 162))]
SKIN_T = ((196, 150, 126), (236, 200, 174), (246, 220, 198))
SC_T = ((188, 180, 164), (232, 228, 214), (246, 244, 234), (158, 152, 142))
HEM_T = ((180, 172, 156), (218, 212, 198), (238, 234, 224))
DRESS_T = ((74, 87, 90), (110, 124, 125), (136, 150, 150), (54, 64, 68))
SHAWL_T = ((76, 54, 36), (114, 84, 57), (140, 106, 74), (48, 36, 26))
LETTER_T = ((198, 170, 140), (236, 215, 186), (248, 236, 214))
LINE_M = (150, 92, 84)                    # (the mouth's and the soft lines' colour)

# ---------- the face: older, tired and sad ----------
EYES = [[(128, 122), (164, 122), (164, 153), (128, 153)], [(186, 120), (222, 120), (222, 151), (186, 151)]]
skin = b.sel(hue=(0, 40), sat=(0.08, 0.36), val=(0.8, 1), box=(116, 80, 244, 204))
# (the RTP's pink skin shade between the fringe's strands and under the jaw: a warm skin shade)
pink = b.sel(hue=(335, 20), sat=(0.28, 0.5), val=(0.72, 0.95), box=(116, 80, 244, 204)) & ~b.poly(*EYES)
b.hsv(pink, hue=16, smul=0.72, vmul=0.95)
skin |= pink
# the eyes: the red irises dark brown, the whites warm
irises = b.sel(hue=(270, 48), sat=(0.42, 1), val=(0.1, 1), polys=EYES)
b.ramp(irises, [(0.0, (12, 8, 6)), (0.15, (36, 22, 14)), (0.35, (74, 48, 30)), (0.6, (120, 84, 54)), (1.0, (186, 150, 112))], gain=1.1)
whites = b.sel(hue=(180, 300), sat=(0.0, 0.3), val=(0.45, 1), polys=EYES) & ~irises
b.hsv(whites, hue=30, sat=0.05, vmul=0.96)
# the smile away: a small closed mouth, its corners turned down
MOUTH = b.poly([(160, 170), (194, 170), (194, 182), (160, 182)])
inpaint(MOUTH & ~skin | (MOUTH & b.sel(sat=(0.3, 1))), 4)
b.over(strokes(S, [((168, 177.5), (176, 176), (185, 177), 1.5)], LINE_M, alpha=0.85, taper_to=0.6))
b.over(strokes(S, [((185, 177), (187, 177.6), (188.5, 178.6), 1.0), ((168, 177.5), (166.5, 178.2), (165.5, 179.2), 0.9)], LINE_M, alpha=0.5,
               taper_to=0.4))
b.over(strokes(S, [((173, 182), (177, 182.8), (181, 182), 0.9)], (214, 160, 140), alpha=0.25, taper_to=0.4))     # (the lower lip's shade)
# the skin paler and duller (a weathered peasant woman of 40, not a girl)
b.multiply(skin, (238, 234, 230), 1.0)
hsv = rgb_to_hsv(b.img[..., :3])
hsv[..., 1] = np.where(skin, hsv[..., 1] * 0.92, hsv[..., 1])
b.img[..., :3] = hsv_to_rgb(hsv)
# tired: shadows and soft lines under the eyes, faint lines from the nose to the mouth's corners
TIRED = (200, 150, 136)
b.over(blush(S, 146, 157, 12, 4.0, TIRED, 0.28, clip=skin))
b.over(blush(S, 204, 155, 11, 4.0, TIRED, 0.24, clip=skin))
b.over(strokes(S, [((136, 155), (147, 160), (159, 156), 1.0), ((194, 154), (205, 158), (217, 153), 1.0)], LINE_M, alpha=0.3, clip=skin))
b.over(strokes(S, [((161, 166), (159, 171), (162, 175), 0.9), ((190, 165), (193, 170), (191, 174), 0.9)], LINE_M, alpha=0.16, clip=skin))
b.over(blush(S, 142, 170, 10, 6, (226, 156, 132), 0.12, clip=skin))
# ---------- the hair: duller brown with grey in it (only the fringe shows in the scarf) ----------
hair = b.sel(hue=(0, 45), sat=(0.4, 1), val=(0, 0.9), box=(100, 20, 300, 340)) | b.sel(lum=(0, 0.3), box=(100, 20, 300, 340))
hair = b.grow(hair, 1, 0.3) & ~b.poly(*EYES) & ~MOUTH
b.ramp(hair, HAIR, gain=1.0)
# the girl's long fringe over the eyes away: a bare forehead (as on the map), the hair parted in the middle and drawn back
# under the scarf, thin sad brows (the inner ends raised), a worry line between them
FORE = [(122, 84), (236, 84), (235, 128), (222, 128), (213, 125.5), (198, 124.5), (186, 126), (180, 133), (176, 140), (171, 144),
        (166, 141), (161, 131), (153, 128), (141, 128.5), (130, 132), (122, 134)]
fm = b.poly(FORE) & b.op()
SK = b.img[160, 182, :3].copy()                       # (the edited skin's lit tone and its shade)
SKS = SK * np.asarray((0.93, 0.86, 0.84), np.float32)
b.img[..., :3] = np.where(fm[..., None], SK, b.img[..., :3])
b.over(blush(S, 128, 118, 10, 22, tuple((SKS * 255).astype(int)), 0.9, clip=fm))       # (the temple turning away)
PART = (182, 99)
HB_L = smooth([(182, 80), (120, 80), (120, 132), (126, 128), (133, 118), (146, 110), (164, 103), PART])
HB_R = smooth([(182, 80), (240, 80), (240, 130), (234, 124), (226, 115), (212, 107), (196, 101), PART])
hb = cel(S, [HB_L, HB_R], ((78, 62, 48), (104, 86, 68), (132, 112, 92)), lw=1.6, shade=4, light=2, ldir=LD)
# (the hair's shadow on the forehead)
hbm = hb[..., 3] > 0.5
b.multiply(shift(hbm, 2, 4) & ~hbm & fm, (226, 196, 186), 0.7)
hbm_in = erode_cv(hbm, 1)
hb = over(hb, strokes(S, [((182, 99), (160, 104), (128, 126), 1.2), ((180, 94), (152, 102), (124, 116), 1.1), ((184, 99), (206, 104), (234, 122), 1.2),
                          ((186, 94), (214, 102), (236, 114), 1.1), ((176, 90), (150, 97), (124, 106), 1.0)], (64, 50, 38), alpha=0.7, clip=hbm_in))
hb = over(hb, strokes(S, [((178, 96), (156, 103), (132, 118), 1.0), ((188, 97), (210, 104), (231, 117), 1.0)], (172, 160, 148), alpha=0.75,
                      clip=hbm_in))                    # (grey strands)
b.over(hb)
BROW = (70, 52, 40)
b.over(strokes(S, [((135, 122.5), (147, 119), (159, 115.5), 2.4), ((190, 113.5), (204, 114.5), (217, 118.5), 2.6)], BROW, alpha=0.9,
               taper_to=0.35))
b.over(strokes(S, [((159, 115.5), (147, 119), (135, 122.5), 1.4), ((190, 113.5), (204, 114.5), (217, 118.5), 1.2)], BROW, alpha=0.6,
               taper_to=0.2))
b.over(strokes(S, [((171, 111), (172.5, 115), (172, 119), 1.0), ((176, 112), (177, 116), (176.5, 119), 0.8)], LINE_M, alpha=0.3))

# ---------- the headscarf's shape: its edge round the face (from under the chin round the forehead back under the chin) and its
# outer edge round the head, falling to the shoulders ----------
INNER = smooth([(190, 210), (176, 200), (160, 192), (146, 182), (135, 168), (129, 150), (126, 128), (129, 108), (140, 95), (160, 89),
                (184, 87), (206, 91), (222, 101), (229, 116), (231, 136), (228, 156), (222, 172), (213, 184), (204, 193), (198, 210)])
OUTER = smooth([(212, 232), (240, 246), (266, 254), (290, 252), (288, 220), (280, 180), (274, 130), (268, 92), (252, 58), (226, 37),
                (194, 29), (162, 32), (136, 45), (118, 66), (108, 96), (104, 134), (101, 172), (95, 208), (88, 252), (120, 254), (152, 248),
                (178, 236)])

# ---------- the head (only what is inside the scarf: the face and the fringe) ----------
JAW = [(236, 150), (228, 168), (218, 182), (206, 192), (194, 199), (176, 198), (160, 190), (146, 180), (134, 166), (124, 146)]
HEAD = [(100, 0), (300, 0), (300, 150)] + JAW + [(100, 146)]
head = take(b.img, b.poly(HEAD) & b.poly(OUTER) & b.op())

# ---------- the new body ----------
body = np.zeros((H, W, 4), np.float32)
NECK = [(160, 176), (232, 166), (234, 214), (230, 250), (166, 250), (162, 214)]
neck = cel_b([NECK], SKIN_T, lw=2.0, shade=8, light=2)
nm = neck[..., 3] > 0.5
CHIN_SH = [(150, 176), (240, 166), (232, 204), (212, 218), (190, 222), (166, 214), (154, 198)]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
# the dress: a round neckline, sloping shoulders, long sleeves
DRESS = smooth([(24, 350), (30, 300), (46, 266), (80, 246), (130, 236), (164, 236)]) \
    + smooth([(164, 236), (180, 246), (198, 250), (216, 246), (232, 236)]) \
    + smooth([(232, 236), (270, 242), (300, 262), (318, 300), (326, 350)])
dress = cel_b([DRESS], DRESS_T[:3], lw=2.0, shade=10, light=3, shade2=4)
dm = dress[..., 3] > 0.5
dress = over(dress, hair_strands(S, erode_cv(dm, 3), (190, 520), DRESS_T[2], DRESS_T[3], n=200, length=(3, 6), seed=11, alpha=(0.2, 0.25)))
dress = over(dress, strokes(S, [((44, 300), (46, 324), (42, 350), 1.6), ((300, 296), (302, 322), (306, 350), 1.6),
                                ((170, 318), (172, 334), (170, 350), 1.3), ((224, 316), (222, 334), (226, 350), 1.3)], DRESS_T[3],
                            alpha=0.6, clip=erode_cv(dm, 2), taper_to=0.2))
body = over(body, dress)
b.img = body
b.over(head)

# ---------- the white linen headscarf ----------
SCARF = INNER + OUTER
sc = cel_b([SCARF], SC_T[:3], lw=2.0, shade=12, light=3, shade2=5)
scm = sc[..., 3] > 0.5
SF = [((214, 222), (258, 140), (236, 56), 1.6), ((206, 214), (242, 120), (204, 38), 1.4), ((226, 226), (276, 170), (274, 104), 1.4),
      ((150, 214), (110, 160), (114, 76), 1.4), ((128, 222), (104, 180), (104, 130), 1.2), ((150, 40), (130, 54), (116, 76), 1.2),
      ((226, 32), (214, 50), (212, 68), 1.1), ((104, 226), (100, 214), (102, 196), 1.1), ((270, 232), (284, 214), (288, 190), 1.1)]
sc = over(sc, strokes(S, SF, SC_T[3], alpha=0.65, clip=erode_cv(scm, 2)))
sc = over(sc, hair_strands(S, erode_cv(scm, 3), (190, 300), SC_T[2], SC_T[0], n=160, length=(3, 6), seed=13, alpha=(0.18, 0.2)))
hem = cel_b([taper(np.asarray(INNER, np.float64), 7.0, 7.0)], HEM_T, lw=1.4, shade=2.4, light=1.2,
            clip=np.pad(scm, ((0, TALL[0] - H), (0, TALL[1] - W))))
sc = over(sc, hem)
# (the scarf's shadow on the face's far side and the forehead)
hm = head[..., 3] > 0.5
cs = shift(scm, 3, 6) & ~scm & hm
b.multiply(cs, (214, 176, 168), 0.6)
b.over(sc)

# ---------- the brown knitted wool shawl over the shoulders, its two ends crossed on the chest ----------
HEM_R = smooth([(330, 318), (300, 312), (262, 310), (232, 316), (208, 330), (192, 350)])
HEM_L = smooth([(10, 320), (44, 310), (88, 306), (130, 312), (166, 328), (186, 350)])
SH_R = smooth([(196, 252), (214, 248), (232, 236), (270, 240), (300, 256), (320, 280), (330, 318)]) + HEM_R[1:] + [(196, 252)]
SH_L = smooth([(10, 320), (20, 296), (40, 268), (76, 248), (120, 236), (164, 236), (182, 250), (198, 256)]) \
    + smooth([(198, 256), (194, 290), (190, 320), (186, 350)])[1:] + HEM_L[::-1][1:]


def knit(lay, seed):
    """Knitted rows (little chevrons in rows following the shoulders) and the heavy folds, inside a shawl half."""
    m = erode_cv(lay[..., 3] > 0.5, 2)
    rows = []
    for j in range(16):
        for x in range(8 + (j % 2) * 4, 334, 8):
            y = 238 + j * 7.5 + 0.0016 * (x - 190) ** 2 * (1 + j * 0.02)
            rows.append(((x - 3.5, y - 2.4), (x, y + 1.6), (x + 3.5, y - 2.4), 1.1))
    lay = over(lay, strokes(S, rows, SHAWL_T[0], alpha=0.5, clip=m, taper_to=0.8))
    lay = over(lay, strokes(S, [(r[0], r[1], r[2], 0.8) for r in rows[seed % 3::3]], SHAWL_T[2], alpha=0.35, clip=m, taper_to=0.6))
    lay = over(lay, strokes(S, [((56, 262), (46, 288), (44, 312), 1.6), ((284, 258), (296, 286), (298, 310), 1.6),
                                ((150, 262), (160, 292), (168, 322), 1.4), ((226, 262), (236, 286), (244, 306), 1.3)], SHAWL_T[3],
                            alpha=0.6, clip=m, taper_to=0.2))
    return lay


def fringe(E, seed):
    """A short ragged fringe of wool tassels hanging from the hem E."""
    rng = np.random.RandomState(seed)
    E = np.asarray(E)
    fr = []
    for i in range(1, len(E) - 1, 2):
        p = E[i]
        L = rng.uniform(5, 9)
        fr.append((tuple(p - (0, 2)), tuple(p + (rng.uniform(-1, 1), L * 0.5)), tuple(p + (rng.uniform(-1.5, 1.5), L)), 2.4))
    lay = strokes(S, fr, SHAWL_T[3], alpha=1.0, taper_to=0.6)
    return over(lay, strokes(S, [(a, m, c, 1.1) for a, m, c, _ in fr], SHAWL_T[1], alpha=0.9, taper_to=0.5))


# the folded letter she holds against her chest (its top edge at the bottom of the frame), between the shawl's ends
LETTER = [(170, 322), (238, 316), (242, 350), (166, 350)]
let = cel_b([LETTER], LETTER_T, lw=1.8, shade=5, light=2)
let = over(let, strokes(S, [((172, 333), (204, 330), (240, 327), 1.0), ((190, 324), (192, 338), (191, 350), 0.8)], LETTER_T[0], alpha=0.8,
                        clip=erode_cv(let[..., 3] > 0.5, 2), taper_to=1.0))
let = over(let, cel_b([ellipse(206, 340, 5, 4)], ((110, 30, 26), (150, 46, 38), (186, 80, 64)), lw=1.0, shade=1.5, light=1.0))   # (a wax seal)
for poly, hem_, sd in ((SH_R, HEM_R, 21), (SH_L, HEM_L, 22)):
    b.over(fringe(hem_, sd))
    b.over(knit(cel_b([poly], SHAWL_T[:3], lw=2.0, shade=9, light=3, shade2=4), sd))
b.over(let)

# ---------- the knot under the chin and its two short ends ----------
TAILS = [smooth([(188, 226), (197, 228), (193, 248), (184, 252), (178, 246)]), smooth([(196, 226), (207, 226), (217, 243), (211, 251), (202, 246)])]
b.over(cel_b(TAILS, SC_T[:3], lw=1.6, shade=3, light=1.2))
b.over(cel_b([ellipse(197, 222, 11, 7.5, 0.1, 24)], SC_T[:3], lw=1.8, shade=4, light=1.5))
b.over(strokes(S, [((191, 219), (197, 224), (203, 226), 1.0)], SC_T[3], alpha=0.7))
b.save(OUT)
print('ok', OUT)
