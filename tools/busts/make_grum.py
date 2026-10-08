# Grum "Iron Fist" (a mercenary, a regular of the tavern, burly, about 40): Actor2_5 repainted to match his map sprite - the
# tall green spikes pulled in close to the skull (a radial squeeze keeps the RTP strands and lines) and darkened to short
# near-black hair, a full short dark-brown beard and moustache round the grin (painted), the red scar down the near cheek, the
# blue eye dark grey-brown with a few lines of age; the eye patch and the red neckerchief kept (its yellow skull pattern painted
# over in red); the black vest a brown leather jerkin with darker harness straps, painted leather shoulder caps with rivets; the
# raised fist's black fingerless glove an iron gauntlet (the map sprite's metal glove, "Iron Fist").
# Run: python tools/busts/make_grum.py [out.png]
import sys
from kit import *

LDIR = (0.55, 0.83)       # (cel's shade band goes to the lower right, away from the RTP light)

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Grum_Bust.png')
b = Bust('Actor2_5')
S = b.img.shape
H, W = S[:2]

# ---- the hair: green and teal spikes (not the eye, the fist, the scarf) ----
EYE = [(140, 108), (190, 104), (192, 140), (142, 142)]
hair = b.sel(hue=(80, 225), sat=(0.15, 1), box=(60, 0, 270, 192)) | b.sel(hue=(44, 80), sat=(0.15, 1), val=(0, 0.95), box=(60, 0, 270, 160))
hair &= ~b.poly(EYE)
scarf0 = dilate_cv(b.sel(hue=(330, 15), sat=(0.62, 1), val=(0.3, 1), box=(0, 140, 330, 350)) & ~region(S, 0, 0, 236, 182), 3)
hair = b.grow(hair, 3, 0.16) & region(S, 60, 0, 270, 192) & ~b.poly(EYE) & ~scarf0
HAIR = [(0.0, (12, 10, 10)), (0.12, (20, 17, 17)), (0.25, (32, 28, 28)), (0.4, (44, 39, 39)), (0.55, (58, 52, 52)),
        (0.7, (76, 70, 70)), (0.85, (100, 94, 94))]
b.ramp(hair, HAIR)

# squeeze what sticks out of the skull (an ellipse) towards it: r' = 1 + (r - 1) * K
CX, CY, RX, RY, K = 183.0, 118.0, 69.0, 73.0, 0.28


def squeeze(layer, ss=4):
    Y, X = np.mgrid[0:H * ss, 0:W * ss].astype(np.float32)
    x = (X + 0.5) / ss - 0.5
    y = (Y + 0.5) / ss - 0.5
    u, v = (x - CX) / RX, (y - CY) / RY
    r = np.sqrt(u * u + v * v) + 1e-6
    r0 = np.where(r > 1, 1 + (r - 1) / K, r)
    mx = (CX + u / r * r0 * RX).astype(np.float32)
    my = (CY + v / r * r0 * RY).astype(np.float32)
    pm = layer.copy()
    pm[..., :3] *= pm[..., 3:4]
    w = cv2.remap(pm, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    w = cv2.resize(w, (W, H), interpolation=cv2.INTER_AREA)
    a = w[..., 3:4]
    w[..., :3] = np.where(a > 1e-4, w[..., :3] / np.maximum(a, 1e-4), 0)
    return np.clip(w, 0, 1)


lay = take(b.img, hair)
rr = np.sqrt(((b.xx - CX) / RX) ** 2 + ((b.yy - CY) / RY) ** 2)
sq = squeeze(lay)
sq = np.where((rr <= 1)[..., None], lay, sq)
b.erase(hair)
# (the spikes' thin tips and their soft edges outside the skull go too - not the eye patch, the ear, the scarf's tail)
PATCH = [(110, 112), (140, 112), (142, 170), (110, 170)]
b.erase((rr > 1) & (region(S, 60, 0, 290, 151) & ~b.poly(PATCH) | region(S, 225, 140, 290, 192)) & ~scarf0)
b.over(sq)
# the teal lid shadow over the eye: dark like the hair; the blue eye a dark grey-brown (as on the map), a few lines of age
lid = b.sel(hue=(100, 185), sat=(0.3, 1), poly=EYE)
b.ramp(lid, HAIR)
iris = b.sel(hue=(186, 250), sat=(0.25, 1), poly=EYE)
b.ramp(iris, [(0.0, (14, 10, 8)), (0.1, (34, 26, 22)), (0.25, (70, 56, 46)), (0.4, (104, 86, 70)), (0.6, (140, 122, 104))])
b.over(strokes(S, [((188, 118), (193, 119), (197, 117), 1.1), ((188, 124), (193, 126), (197, 126), 1.0),
                   ((158, 140), (168, 143), (180, 140), 1.0)], (170, 108, 82), alpha=0.6, taper_to=0.2))

# ---- the red scarf: its yellow skull pattern painted over in the scarf's mid red and fold-shadow red (the fold line kept) ----
SCARF_PAT = [(120, 340), (128, 292), (160, 255), (180, 212), (215, 205), (244, 201), (244, 226), (222, 272), (176, 315),
             (150, 342)]
hd, sv, vv = hsv_of(b.src)
L = luma(b.src)
yel = b.sel(hue=(15, 66), sat=(0.58, 1), val=(0.55, 1), poly=SCARF_PAT)
pat = fill_holes(dilate_cv(yel, 2)) & b.op() & b.poly(SCARF_PAT)
core = b.sel(hue=(44, 64), sat=(0.6, 1), val=(0.6, 1), poly=SCARF_PAT)
fold = pat & (L < 0.1)
V8 = np.clip(vv * 255, 0, 255).astype(np.uint8)
V8 = cv2.inpaint(V8, (pat & ~core).astype(np.uint8), 3, cv2.INPAINT_TELEA)
lit = cv2.medianBlur(((V8 > 225) * 255).astype(np.uint8), 11) > 127
paint = pat & ~fold
b.img[..., :3] = np.where((paint & lit)[..., None], np.float32([142, 24, 32]) / 255, b.img[..., :3])
b.img[..., :3] = np.where((paint & ~lit)[..., None], np.float32([110, 18, 25]) / 255, b.img[..., :3])

# ---- the black vest a brown leather jerkin, its harness straps darker leather ----
red = b.sel(hue=(330, 20), sat=(0.4, 1))
top = (b.sel(sat=(0, 0.35), val=(0, 0.5), box=(60, 205, 268, 350)) | b.sel(hue=(180, 265), val=(0, 0.6), box=(60, 205, 268, 350))) & ~red
straps = b.sel(hue=(0, 45), sat=(0.25, 0.8), val=(0.2, 0.85), box=(60, 205, 250, 350))
straps &= ~b.sel(hue=(10, 40), sat=(0.3, 0.55), val=(0.6, 1)) & ~dilate_cv(red, 1)      # (not the skin, not the scarf)
b.ramp(top, [(0.0, (22, 12, 8)), (0.05, (34, 20, 12)), (0.1, (70, 44, 26)), (0.16, (98, 62, 36)), (0.24, (118, 78, 46)),
             (0.31, (138, 94, 58)), (0.4, (160, 114, 74))])
b.ramp(straps, [(0.0, (16, 10, 6)), (0.2, (40, 24, 14)), (0.3, (58, 36, 20)), (0.4, (74, 48, 28)), (0.5, (90, 60, 36)),
                (0.62, (112, 78, 50))])

# ---- the raised fist: the black fingerless glove an iron gauntlet ("Iron Fist") ----
fingers = b.sel(hue=(0, 45), sat=(0.2, 0.75), val=(0.4, 1), box=(0, 160, 50, 222))
glove = b.sel(box=(0, 120, 50, 280)) & ~fingers & ~b.sel(hue=(10, 45), sat=(0.25, 0.7), val=(0.45, 1))
b.ramp(glove, [(0.0, (16, 16, 20)), (0.05, (40, 44, 52)), (0.1, (64, 70, 80)), (0.15, (86, 92, 102)), (0.3, (130, 136, 146)),
               (0.55, (184, 190, 198)), (0.85, (236, 240, 244))])
b.ramp(fingers, [(0.0, (22, 22, 28)), (0.3, (52, 56, 64)), (0.5, (92, 98, 108)), (0.62, (122, 128, 138)), (0.74, (150, 156, 166)),
                 (0.86, (190, 196, 204)), (0.95, (226, 230, 236))])

# ---- a full short dark beard and moustache round the grin ----
OUTER = [(211, 120), (215, 138), (217, 156), (215, 170), (207, 185), (195, 197), (178, 207), (160, 213), (146, 212), (136, 203),
         (128, 190), (123, 177), (122, 165)]
INNER = [(126, 163), (131, 173), (138, 183), (148, 192), (160, 194), (172, 187), (181, 176), (189, 163), (197, 148), (204, 133),
         (207, 121)]
MOUS = [(133, 177), (142, 170), (156, 166), (170, 162), (182, 159), (189, 162), (186, 168), (176, 169), (164, 172), (152, 177),
        (141, 182), (134, 184)]
BEARD_T = ((40, 32, 29), (62, 51, 46), (94, 80, 71), (24, 19, 17))
b.over(beard2(S, OUTER, INNER, BEARD_T, flow=(165, 240), mous=MOUS, mous_flow=(160, 200), seed=7, n=120))
# the red scar down the near cheek under the eye (as on the map sprite)
b.over(strokes(S, [((176, 133), (179, 143), (183, 156), 2.6)], (190, 70, 66), alpha=0.95, taper_to=0.45))
b.over(strokes(S, [((177, 135), (179, 143), (182, 152), 1.0)], (128, 30, 30), alpha=0.9, taper_to=0.5))

# ---- leather shoulder caps over the jerkin's armholes (the near one tucked under the scarf's knot), a row of rivets on each ----
CAP_N = [(232, 204), (250, 208), (265, 216), (273, 221), (281, 226), (289, 230), (297, 232), (305, 236), (313, 241), (321, 249),
         (326, 260), (328, 272), (320, 278), (306, 280), (290, 279), (272, 275), (256, 269), (244, 262), (238, 248), (234, 228)]
CAP_T = ((86, 52, 30), (122, 82, 50), (158, 114, 76))
STEEL = ((90, 94, 104), (168, 172, 180), (226, 228, 234))
scarf_m = b.sel(hue=(335, 12), sat=(0.62, 1), val=(0.3, 1), src=False, box=(150, 150, 330, 218))
scarf_now = take(b.img, scarf_m | (b.sel(lum=(0, 0.2), src=False, box=(200, 190, 262, 262)) & dilate_cv(scarf_m, 2)))
b.over(cel(S, [CAP_N], CAP_T, lw=2.0, shade=8, light=2.5, ldir=LDIR))
b.over(strokes(S, [((240, 222), (290, 228), (322, 266), 1.1)], (70, 42, 24), alpha=0.8, taper_to=1.0))
b.over(strokes(S, [((248, 262), (284, 274), (322, 272), 1.0)], (66, 40, 22), alpha=0.7, taper_to=1.0))
b.over(cel(S, [ellipse(x, y, 2.2, 2.0) for x, y in [(258, 226), (279, 233), (298, 243), (313, 256)]], STEEL, lw=0.9, shade=1.2,
           light=0.7, ldir=LDIR))
CAP_F = [(124, 217), (110, 220), (99, 224), (89, 230), (82, 238), (76, 246), (72, 254), (69, 263), (67, 272), (76, 276), (88, 271),
         (99, 266), (106, 262), (111, 252), (118, 240), (123, 229)]
b.over(cel(S, [CAP_F], CAP_T, lw=2.0, shade=6, light=2.5, ldir=LDIR))
b.over(strokes(S, [((114, 224), (86, 234), (73, 266), 1.0)], (70, 42, 24), alpha=0.75, taper_to=1.0))
b.over(cel(S, [ellipse(x, y, 2.0, 1.9) for x, y in [(104, 228), (90, 238), (81, 252)]], STEEL, lw=0.9, shade=1.2, light=0.7,
           ldir=LDIR))
b.over(scarf_now)

b.save(OUT)
print('ok', OUT)
