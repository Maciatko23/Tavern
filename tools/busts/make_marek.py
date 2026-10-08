# Marek (Ludmila's husband, the digger saved from the cave, about 33; the rock took his speech): SF_Actor3_3 repainted -
# the hair dark brown and messy (ragged ends, stray strands, longer to the shoulders), a long untrimmed dark brown beard and
# moustache (painted) over the smirk, pale dusty skin with hollow cheeks and dark rings, wide empty eyes (dull grey irises
# without the shine, the lids opened), the pinstripe jacket's sleeves a dirty torn off-white linen shirt and its front with
# the waistcoat a worn scuffed dark brown leather vest, rock dust on him. Run: python tools/busts/make_marek.py [out.png]
import sys
from kit import *
from patches import smudge, hole, rip

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Marek_Bust.png')
b = Bust('SF_Actor3_3')
S = b.img.shape


def stepped(m, steps, gain=1.0, bias=0.0):
    """A cel recolour: luminance bands (upper bound, colour) of flat colour (for parts flattened first)."""
    L = np.clip(luma(b.src) * gain + bias, 0, 1)
    out = np.zeros(S[:2] + (3,), np.float32)
    lo = -1.0
    for hi, col in steps:
        out[(L > lo) & (L <= hi)] = np.asarray(col, np.float32) / 255.0
        lo = hi
    out[L > lo] = np.asarray(steps[-1][1], np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], out, b.img[..., :3])


def cover(poly, dx, dy):
    """Paint over a spot with the picture shifted by (dx, dy) (skin from beside it)."""
    m = b.poly(poly)
    src = np.roll(np.roll(b.img, -dy, 0), -dx, 1)
    b.img = np.where(m[..., None], src, b.img)


# ---- the parts ----
HEAD = [(56, 0), (276, 0), (276, 176), (214, 184), (208, 196), (118, 206), (110, 214), (70, 214), (56, 180)]
NECK = [(118, 178), (150, 185), (178, 168), (197, 146), (206, 160), (207, 192), (182, 214), (150, 232), (134, 300), (112, 300), (114, 220)]
MOUTH = [(108, 148), (160, 146), (160, 172), (108, 172)]
FACE = [(96, 62), (205, 62), (205, 190), (96, 190)]
head = b.poly(HEAD)
nohair = b.poly(NECK, MOUTH)
hair = b.sel(hue=(262, 352), sat=(0.08, 0.8), val=(0, 0.86)) & head & ~nohair
hair |= b.sel(hue=(190, 262), sat=(0, 0.45), val=(0.45, 1)) & head & ~nohair & ~b.poly(FACE)
hair |= b.sel(hue=(215, 270), sat=(0.2, 1), val=(0, 0.5)) & head & ~nohair
hair = b.grow(hair, 2, 0.3) & head & ~nohair

skin = b.sel(hue=(345, 45), sat=(0.04, 0.8), val=(0.42, 1)) & ~hair & b.poly(HEAD + [(0, 0)], NECK)
skin |= b.poly(NECK) & b.sel(hue=(280, 360), val=(0.4, 1))
n, lab, st, _ = cv2.connectedComponentsWithStats(skin.astype(np.uint8), connectivity=8)
specks = np.isin(lab, np.nonzero(st[:, cv2.CC_STAT_AREA] < 15)[0]) & skin & head & ~b.poly(NECK)   # (the hair's pink shine specks)
hair |= specks
skin &= ~specks

shirt = b.sel(hue=(180, 260), sat=(0, 0.35), val=(0.62, 1), box=(60, 176, 260, 350)) & ~hair
shirt |= b.sel(sat=(0, 0.1), val=(0.5, 1), box=(112, 270, 135, 300))
waist = b.sel(hue=(195, 250), sat=(0.25, 1), val=(0, 0.7), box=(60, 200, 260, 350))
waist = b.grow(waist, 1, 0.2) & region(S, 60, 200, 260, 350) & ~shirt
jacket = (b.sel(sat=(0, 0.16), val=(0, 0.75), box=(0, 180, 330, 350)) | b.sel(hue=(190, 290), sat=(0, 0.5), box=(0, 196, 330, 350))) \
    & ~shirt & ~waist & ~skin & ~hair
L_SEAM = [(0, 200), (51, 200), (52, 221), (55, 250), (57, 280), (62, 300), (70, 330), (74, 352), (0, 352)]
R_SEAM = [(330, 200), (296, 200), (298, 222), (290, 238), (282, 258), (276, 280), (270, 302), (264, 330), (258, 352), (330, 352)]
sleeves = jacket & b.poly(L_SEAM, R_SEAM)
vest = (jacket & ~sleeves) | waist

# ---- recolouring ----
b.ramp(hair, RAMPS['hair_dark'], gain=0.66)
SKIN = [(0.0, (34, 24, 22)), (0.3, (96, 68, 58)), (0.5, (158, 120, 102)), (0.65, (188, 152, 130)), (0.8, (210, 178, 154)),
        (0.9, (224, 196, 174)), (1.0, (234, 212, 194))]
b.ramp(skin, SKIN)
b.ramp(shirt, [(0.0, (34, 24, 22)), (0.3, (92, 82, 70)), (0.6, (158, 144, 126)), (0.8, (198, 184, 164)), (0.93, (222, 208, 188)),
               (1.0, (230, 218, 200))])
# the pinstripes and the old shading smoothed away (the outlines and folds kept), then flat cel bands
Lsrc = luma(b.src)
jl = jacket & ((Lsrc < 0.11) | (dilate(Lsrc < 0.11, 1) & (Lsrc < 0.22)))
wl = waist & ((Lsrc < 0.08) | (dilate(Lsrc < 0.08, 1) & (Lsrc < 0.14)))
b.flatten(jacket & ~jl, 5.0, keep_lines=0.0)
b.flatten(waist & ~wl, 5.0, keep_lines=0.0)
LINEN = [(0.11, (40, 32, 26)), (0.22, (100, 88, 76)), (0.28, (128, 114, 98)), (0.38, (174, 160, 142)), (0.47, (206, 192, 172)),
         (1.0, (226, 214, 196))]
stepped(sleeves, LINEN)
VEST = [(0.11, (30, 20, 16)), (0.22, (46, 32, 24)), (0.28, (60, 42, 30)), (0.38, (84, 60, 44)), (0.47, (100, 72, 54)), (1.0, (122, 90, 68))]
stepped(vest & jacket, VEST)
stepped(waist & ~wl, VEST, gain=1.75)
stepped(wl, VEST)

# ---- the eyes: opened wider (white round the iris), dull grey irises with no shine ----
cover([(133, 112), (139, 112), (139, 117), (133, 117)], 0, 4)          # (the old lower lashes)
cover([(104, 115), (113, 115), (113, 120), (104, 120)], 0, 5)
EYE_T = ((172, 170, 178), (224, 220, 214), (232, 228, 222))
IRIS_T = ((50, 48, 58), (90, 86, 98), (126, 122, 134))
for top, bot, ic, ir in [
        ([(89, 104), (94, 103.6), (100, 104.6), (106, 106.2), (110, 109)], [(109, 113), (105, 116), (99, 117), (93, 116), (89, 113)], (100.5, 111.6), (3.5, 4.0)),
        ([(132, 104.6), (136, 102.6), (141, 101.6), (147, 101.6), (152, 102.6), (156, 105)], [(155, 109), (151, 112), (145, 114), (138, 113), (133, 110)],
         (144.5, 107.9), (4.2, 4.6))]:
    opening = top + bot
    b.over(cel(S, [opening], EYE_T, outline=False, shade=2.0, light=0, ldir=(0, 1)))
    om = b.poly(opening)
    b.over(cel(S, [ellipse(ic[0], ic[1], ir[0], ir[1])], IRIS_T, lw=1.0, shade=2.6, light=1.3, ldir=(0, 1), clip=om))
    b.over(dots(S, [(ic[0], ic[1] + 0.2, 1.9)], (30, 26, 34), clip=om))
    b.over(strokes(S, [(top[i], top[i], top[i + 1], 2.4) for i in range(len(top) - 1)], LINE, taper_to=1.0))
    b.over(strokes(S, [(bot[0], bot[1], bot[2], 1.3), (bot[2], bot[3], bot[4], 1.0)], (110, 78, 70), alpha=0.9, taper_to=0.6))
# dark rings and hollows (the cheek under the cheekbone in a flat shade)
skin_now = skin | b.sel(src=False, hue=(0, 40), sat=(0.05, 0.5), val=(0.6, 1), box=(84, 90, 210, 200))
b.over(blush(S, 100, 120, 9, 3.2, (104, 84, 100), 0.3, clip=skin_now))
b.over(blush(S, 145, 118.5, 12, 3.2, (104, 84, 100), 0.3, clip=skin_now))
HOLLOW = [(190, 118), (184, 126), (174, 138), (164, 150), (158, 160), (170, 154), (182, 142), (192, 128)]
b.multiply(soft_poly(S, [HOLLOW]) * skin_now, (214, 196, 196), 1.0)
# dirt on the cheek
b.img = smudge(b.img, [[(170, 126), (182, 120), (188, 128), (178, 134)]], DIRT, 0.2)

# ---- the hair messier and longer: locks hanging to the shoulders and tufts, painted under the old hair (only their ends show) ----
HAIR_T = ((40, 26, 18), (60, 39, 27), (82, 55, 38))
rim = hair & (luma(b.src) < 0.25) & dilate(~b.op(), 3)                 # (the hair's outline: the new ends break through it)
under = ~(hair | skin) | ~b.op() | rim


def locks(spec, lw=1.6, seed=1, tex=True):
    """Locks of hair (root, bend, tip, width) as tapered cel shapes under the old hair, strands in them."""
    polys = [taper(bez(r, m, t, 24), w, 0.6, w_mid=w * 0.9) for r, m, t, w in spec]
    lay = cel(S, polys, HAIR_T, lw=lw, shade=3.5, light=1.6, clip=under)
    if tex:
        lay = over(lay, hair_strands(S, lay[..., 3] > 0.5, (226, 300), HAIR_T[2], (30, 20, 14), n=50, length=(7, 12), seed=seed,
                                     alpha=(0.45, 0.5)))
    return lay


b.over(locks([((212, 150), (214, 178), (209, 207), 12), ((222, 146), (229, 176), (226, 209), 12), ((227, 136), (238, 164), (245, 197), 9),
              ((218, 162), (221, 188), (233, 214), 8), ((88, 178), (86, 196), (79, 214), 9), ((96, 184), (96, 200), (93, 217), 8)], seed=11))
TUFTS = [((124, 20), (119, 12), (113, 9), 8.0), ((140, 14), (143, 7), (148, 5), 6.0), ((172, 16), (176, 9), (182, 6), 7.0),
         ((205, 28), (211, 22), (217, 21), 7.0), ((224, 106), (234, 106), (240, 113), 8.0), ((90, 78), (80, 80), (75, 88), 8.0)]
b.over(locks(TUFTS, lw=1.5, tex=False))
hm = hair & b.op() & ~b.poly(FACE)
b.over(hair_strands(S, hm, (150, 330), (84, 58, 40), (26, 17, 12), n=110, length=(8, 16), seed=5, alpha=(0.22, 0.45)))

# ---- the mouth under the moustache, the beard ----
LIPSKIN = tuple(int(v) for v in np.round(ramp(np.array([0.84]), SKIN)[0] * 255))
b.over(cel(S, [[(106, 150), (160, 150), (160, 172), (106, 172)]], (LIPSKIN, LIPSKIN, LIPSKIN), outline=False, shade=0, light=0, clip=skin_now))
b.over(cel(S, [[(121, 161), (129, 160.5), (136, 161), (134, 165), (128, 166), (123, 165)]], ((150, 106, 98), (172, 128, 116), (190, 150, 138)),
           lw=0, shade=1.0, light=0.8))
b.over(strokes(S, [((118, 160), (128, 159), (140, 160), 1.4)], LINE, taper_to=0.6))
OUTER = [(200, 110), (205, 132), (205, 154), (201, 176), (195, 198), (186, 218), (174, 236), (159, 249), (143, 256), (128, 250), (115, 238),
         (105, 221), (99, 203), (95, 184), (93, 164), (92, 144), (92, 126)]
INNER = [(96, 124), (99, 140), (102, 152), (104, 160), (110, 163), (118, 164), (124, 166), (130, 166.5), (136, 166), (142, 163), (150, 162),
         (158, 159), (168, 151), (178, 140), (187, 127), (195, 114)]
MOUS = [(101, 166), (104, 157), (111, 151), (122, 149), (136, 149), (150, 151), (160, 155), (166, 163), (159, 163), (150, 160), (138, 159),
        (124, 159), (112, 161), (105, 167)]
BEARD_T = ((34, 23, 16), (56, 39, 28), (82, 58, 42), (20, 13, 9))
b.over(beard2(S, OUTER, INNER, BEARD_T, flow=(140, 300), mous=MOUS, mous_flow=(130, 190), seed=21, n=160, tip=8, out=3.4, seg=8))
b.over(dots(S, [(150, 228, 1.6), (128, 214, 1.4), (172, 200, 1.5), (118, 188, 1.2), (160, 240, 1.3)], (150, 140, 128), alpha=0.35))

# ---- wear: rock dust and scuffs on the vest, tears in the shirt ----
rng = np.random.RandomState(31)
cloth = vest | sleeves
ys, xs = np.nonzero(cloth & (b.yy > 230))
pick = rng.choice(len(xs), 40, replace=False)
b.over(dots(S, [(xs[i] + rng.uniform(-0.5, 0.5), ys[i], rng.uniform(0.6, 1.3)) for i in pick], (176, 166, 150), alpha=0.5, clip=vest))


def blob(cx, cy, rx, ry, seed):
    r = np.random.RandomState(seed)
    t = np.linspace(0, 2 * np.pi, 16, endpoint=False)
    k = r.uniform(0.7, 1.25, len(t))
    return [(cx + np.cos(a) * rx * f, cy + np.sin(a) * ry * f) for a, f in zip(t, k)]


DUST = [(214, 312, 18, 12), (184, 288, 8, 6), (238, 330, 9, 7), (78, 306, 8, 9), (150, 338, 10, 6)]
b.img = smudge(b.img, [blob(x, y, rx, ry, 60 + i) for i, (x, y, rx, ry) in enumerate(DUST)], (156, 146, 132), 0.13)
pts = []
for i, (x, y, rx, ry) in enumerate(DUST):
    for _ in range(14):
        pts.append((x + rng.normal(0, rx * 0.6), y + rng.normal(0, ry * 0.6), rng.uniform(0.5, 1.2)))
b.over(dots(S, pts, (178, 168, 152), alpha=0.55, clip=vest))
b.img = smudge(b.img, [blob(300, 262, 9, 7, 70), blob(40, 268, 7, 9, 71), blob(318, 330, 8, 10, 72)], (120, 104, 86), 0.18)
b.over(strokes(S, [((206, 262), (214, 268), (226, 270), 1.0), ((180, 316), (190, 318), (198, 326), 1.0), ((236, 248), (240, 258), (238, 268), 0.9),
                   ((150, 330), (158, 334), (166, 334), 0.9)], (146, 112, 86), alpha=0.7, clip=vest))
b.img = hole(b.img, rip([(298, 292), (306, 300), (312, 312)], 6.0, seed=41, jag=0.45, alt=0.2, step=2.0), fill=(180, 146, 128),
             shade=(150, 116, 100), line=LINE, lip=(232, 222, 206))
b.img = hole(b.img, rip([(30, 296), (36, 304), (40, 316)], 5.0, seed=42, jag=0.45, alt=0.2, step=2.0), fill=(170, 136, 118),
             shade=(140, 108, 94), line=LINE, lip=(220, 208, 190))
b.save(OUT)
print('ok', OUT)
