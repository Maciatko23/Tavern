# Pula_S (a pool body of the travellers from the ferry, docs/PODROZNI.md: an ordinary old man of about 70 with a stick,
# 2026-10-29): People1_7 (the wrinkled old man in the olive knit cap) repainted to his PixelLab map sheet ($Npc_Pula_S) - the cap
# gone and a BALD old scalp painted in its place (creases, age spots), the grey hair at the sides white, white strands at the near
# temple, bushy white brows, the skin a little less yellow, a short white beard and moustache (painted); the green tunic and the
# maroon undershirt a long plain GREY-BLUE wool coat (recoloured, the RTP folds kept), a thick BROWN wool scarf wound round the
# neck with one fringed end hanging down the chest (painted).
# Recolour bands (for tools/podroznicy/pula_kolory.py): the coat is the only bluish colour - hue 205..212, sat 0.18..0.43 (the white
# hair, beard and brows are neutral-warm, hue ~30 with sat <= 0.12; the eyes and the eye whites warm).
# 0 PixelLab generations. Run: python tools/busts/make_pula_s.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Pula_S_Bust.png')
b = Bust('People1_7')
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


# the map's colours ($Npc_Pula_S front frame): coat (103, 121, 125)/(73, 87, 92), scarf (117, 88, 64)/(73, 52, 37)/(132, 101, 75),
# white hair (233, 230, 228)/(204, 192, 182), skin (237, 186, 151)/(189, 151, 125)
COAT = [(0.0, (16, 22, 28)), (0.12, (30, 40, 50)), (0.25, (46, 58, 70)), (0.4, (66, 82, 96)), (0.55, (86, 104, 118)), (0.7, (106, 124, 138)),
        (0.85, (126, 144, 158)), (1.0, (146, 164, 178))]
WHITE = [(0.0, (58, 54, 50)), (0.2, (112, 108, 102)), (0.4, (164, 160, 154)), (0.55, (198, 194, 188)), (0.7, (222, 219, 213)),
         (0.85, (238, 236, 231)), (1.0, (250, 249, 246))]
WHITE_T = ((176, 172, 165), (218, 215, 209), (242, 240, 236), (148, 144, 138))
SCARF_T = ((80, 56, 38), (118, 86, 60), (148, 112, 80), (58, 40, 27))
SKIN_T = ((214, 152, 112), (241, 188, 146), (252, 214, 176), (196, 134, 98))

op = b.op()
skin = b.sel(hue=(10, 45), sat=(0.15, 0.7), val=(0.55, 1), box=(60, 60, 230, 210))
EYES = [[(86, 108), (114, 108), (114, 128), (86, 128)], [(126, 102), (166, 102), (166, 126), (126, 126)]]

# ---------- the clothes first (read from the original): the tunic and undershirt a grey-blue wool coat ----------
torso = op & region(S, 0, 150, 330, 350)
green = b.sel(hue=(40, 110), sat=(0.12, 1), box=(0, 170, 330, 350))
green = b.grow(green, 2, 0.3) & torso & ~skin
maroon = b.sel(hue=(290, 45), sat=(0.08, 0.75), val=(0.08, 0.75), box=(0, 150, 330, 350)) & ~skin & ~green
FACE = [(76, 60), (232, 60), (232, 140), (204, 150), (188, 166), (172, 182), (152, 196), (130, 202), (108, 194), (92, 178), (82, 152)]
maroon = b.grow(maroon, 1, 0.3) & torso & ~skin & ~green & ~b.poly(FACE)
coat = green | maroon
b.ramp(green, COAT, gain=0.92)
b.ramp(maroon, COAT, gain=1.35, bias=0.02)
# (the lacing at the neck: a dark seam of the coat)
tie = b.sel(hue=(40, 75), sat=(0.25, 1), val=(0.45, 1), box=(126, 220, 204, 290))
b.ramp(tie, COAT, gain=0.7)
# (the tunic's laced neck opening filled in from the coat round it - the coat is plain - and a short slit line left)
LACE = [(126, 236), (180, 236), (178, 262), (166, 280), (160, 292), (150, 297), (140, 292), (134, 280), (126, 262)]
lm = b.poly(LACE) & op
img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
fill = cv2.inpaint(img8, lm.astype(np.uint8), 6, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
b.img[..., :3] = np.where(lm[..., None], fill, b.img[..., :3])
b.over(strokes(S, [((153, 246), (152, 266), (150, 286), 1.6)], (20, 26, 34), alpha=0.9, taper_to=0.4))
b.over(strokes(S, [((156, 248), (155, 266), (153, 284), 1.0)], COAT[6][1], alpha=0.6, taper_to=0.3))

# ---------- the face: a little less yellow, white brows, warm eye whites ----------
b.multiply(skin, (255, 241, 250), 1.0)
whites = b.sel(hue=(150, 300), sat=(0.0, 0.4), val=(0.5, 1), polys=EYES)
b.hsv(whites, hue=32, sat=0.05)
irises = b.sel(hue=(180, 330), sat=(0.08, 1), val=(0.15, 0.8), polys=EYES) & ~whites
b.hsv(irises, hue=24, sat=0.35)
BROWS = [((80, 108), (92, 102), (104, 106), 5.0), ((84, 110), (96, 104), (110, 108), 3.6),
         ((124, 100), (140, 94), (158, 98), 5.4), ((128, 102), (144, 96), (162, 101), 3.8)]
brows = cel(S, [taper(bez(r, c, t, 16), w, 1.0, w_mid=w) for r, c, t, w in BROWS], (WHITE_T[3], WHITE_T[1], WHITE_T[2]), shade=1.6,
            light=1, lw=1.0, ldir=LD)
b.over(brows)
b.over(strokes(S, [((84, 106), (94, 102), (106, 105), 0.9), ((128, 98), (142, 94), (156, 97), 0.9)], WHITE_T[0], alpha=0.7))

# ---------- the cap off: a bald old scalp painted in its place ----------
cap = b.sel(hue=(40, 100), sat=(0.12, 0.9), val=(0.15, 0.95), box=(60, 10, 235, 112)) & ~skin
cap = b.grow(cap, 2, 0.3) & region(S, 60, 10, 235, 112) & ~skin
CX, CY, RX, RY = 150, 104, 72, 82
ARC = ellipse(CX, CY, RX, RY, 0, 60, np.pi * 1.0, np.pi * 2.0)
LOWER = [(222, 106), (214, 101), (200, 92), (186, 84), (172, 78), (160, 76), (148, 75), (130, 75), (112, 76), (100, 78), (90, 82), (84, 90),
         (79, 100)]
DOME = ARC + LOWER
dome = b.poly(DOME)
b.erase(cap & ~dome)
b.over(cel(S, [ellipse(CX, CY, RX, RY, 0, 60)], SKIN_T[:3] + (SKIN_T[3],), outline=False, shade=11, light=5, shade2=4, clip=dome, ldir=LD))
# the scalp's soft shine (upper left) and the line round the top of the skull
b.over(strokes(S, [((108, 48), (118, 36), (134, 30), 3.4)], (255, 232, 200), alpha=0.8, taper_to=0.2))
b.over(line_along(ARC, 2.2))
# old age: creases on the scalp and forehead, age spots
WR = (186, 120, 84)
b.over(strokes(S, [((104, 64), (128, 59), (156, 61), 1.3), ((114, 54), (138, 50), (162, 53), 1.1)], WR, alpha=0.55, clip=dome))
# (the seam where the painted scalp meets the old forehead: wrinkles across it)
b.over(strokes(S, [((92, 82), (116, 74), (146, 75), 1.4), ((146, 75), (170, 76), (196, 88), 1.3), ((104, 80), (130, 77), (156, 79), 0.9)],
               WR, alpha=0.6))
b.over(dots(S, [(170, 42, 2.4), (182, 50, 1.6), (150, 38, 1.8), (196, 64, 2.0), (124, 44, 1.4)], (204, 146, 104), alpha=0.6))

# ---------- the hair: white at the sides (the grey hair behind the ear), white strands at the near temple and round the back ----------
side = b.sel(sat=(0, 0.25), box=(158, 60, 230, 165)) & ~skin
side = b.grow(side, 1, 0.3) & region(S, 158, 60, 230, 165) & ~skin & ~dome & ~coat
b.ramp(side, WHITE, gain=1.05)
st = []
for i in range(9):          # the fringe of white hair round the back of the head, under the scalp's edge
    y = 84 + i * 6
    st.append(((206 + i * 1.2, y - 6), (222 + i * 0.4, y + 4), (224 - i * 0.3, y + 16), 1.6))
for i in range(5):          # the near temple
    y = 84 + i * 5
    st.append(((84 + i * 0.3, y), (79 - i * 0.2, y + 8), (80 - i * 0.5, y + 16), 1.4))
b.over(strokes(S, st, WHITE_T[1], alpha=0.95, taper_to=0.15))
b.over(strokes(S, st[::2], WHITE_T[0], alpha=0.6, taper_to=0.15))
b.over(strokes(S, st[1::3], WHITE_T[2], alpha=0.8, taper_to=0.1))

# ---------- the brown wool scarf wound round the neck, one fringed end down the chest ----------
WRAP = smooth([(100, 182), (116, 192), (134, 198), (156, 190), (174, 170), (190, 152), (214, 144), (234, 150), (246, 178)]) \
    + smooth([(246, 178), (246, 204), (230, 226), (200, 242), (164, 250), (130, 246), (106, 232), (96, 212), (100, 182)])
END = smooth([(192, 230), (226, 222), (230, 262), (234, 306)]) + [(236, 312), (200, 316)] + smooth([(200, 316), (196, 272), (192, 230)])
sc_end = cel_b([END], SCARF_T[:3], lw=2.0, shade=7, light=2.5, shade2=3)
em = erode_cv(sc_end[..., 3] > 0.5, 2)
sc_end = over(sc_end, hair_strands(S, em, (215, 400), SCARF_T[2], SCARF_T[3], n=90, length=(3, 6), seed=41, alpha=(0.3, 0.35)))
sc_end = over(sc_end, strokes(S, [((206, 236), (210, 276), (212, 310), 1.4), ((220, 232), (224, 270), (226, 306), 1.2)], SCARF_T[3],
                              alpha=0.6, clip=em, taper_to=0.3))
rng = np.random.RandomState(43)
fr = [((x, 312 + (x - 200) * 0.05), (x + rng.uniform(-1, 1), 318), (x + rng.uniform(-1.5, 1.5), 324 + rng.uniform(0, 4)), 2.6)
      for x in np.arange(202, 236, 4.2)]
b.over(strokes(S, fr, SCARF_T[3], alpha=1.0, taper_to=0.6))
b.over(strokes(S, [(a, m, c, 1.2) for a, m, c, _ in fr], SCARF_T[1], alpha=0.9, taper_to=0.5))
b.over(sc_end)
wrap = cel_b([WRAP], SCARF_T[:3], lw=2.0, shade=9, light=3, shade2=4)
wm = erode_cv(wrap[..., 3] > 0.5, 2)
wrap = over(wrap, hair_strands(S, wm, (170, 420), SCARF_T[2], SCARF_T[3], n=160, length=(3, 6), seed=42, alpha=(0.3, 0.35)))
# the turns of the wound scarf
wrap = over(wrap, strokes(S, [((104, 206), (160, 228), (238, 192), 1.8), ((112, 224), (166, 242), (232, 214), 1.4),
                              ((150, 202), (190, 196), (236, 172), 1.4)], SCARF_T[3], alpha=0.7, clip=wm, taper_to=0.2))
wrap = over(wrap, strokes(S, [((108, 212), (160, 234), (236, 198), 1.0)], SCARF_T[2], alpha=0.5, clip=wm, taper_to=0.2))
b.over(wrap)

# ---------- the short white beard and moustache ----------
OUTER = [(86, 134), (87, 152), (95, 170), (107, 185), (122, 196), (138, 200), (156, 194), (172, 180), (186, 162), (193, 146), (196, 130)]
INNER = [(188, 128), (182, 144), (172, 158), (158, 168), (144, 174), (130, 175), (116, 172), (104, 164), (96, 152), (92, 136)]
MOUS = [(100, 168), (106, 157), (118, 152), (132, 151), (146, 153), (156, 160), (158, 168), (150, 163), (138, 160), (124, 160), (110, 163)]
b.over(beard2(S, OUTER, INNER, WHITE_T, flow=(134, 240), mous=MOUS, mous_flow=(130, 175), seed=44, n=120, tip=4, out=2.0, seg=8))

# ---------- the coat is the only bluish colour: the eyes' lines and the hair's cool shadows warm (hue 28, sat <= 0.12) ----------
hsv = rgb_to_hsv(b.img[..., :3])
blues = (hsv[..., 0] * 360 >= 165) & (hsv[..., 0] * 360 <= 300) & (hsv[..., 1] > 0.04) & (b.img[..., 3] > 0.02) & ~dilate_cv(coat | lm, 1)
hsv[..., 0] = np.where(blues, 28 / 360.0, hsv[..., 0])
hsv[..., 1] = np.where(blues, np.minimum(hsv[..., 1] * 0.5, 0.12), hsv[..., 1])
b.img[..., :3] = hsv_to_rgb(hsv)
b.save(OUT)
print('ok', OUT)
