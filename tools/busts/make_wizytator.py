# Brat Augustyn (a traveller from the ferry, docs/PODROZNI.md 2.10: an elderly monk of about 65, the visitor of the Order -
# gentle and learned, 2026-10-29): People2_1 (the old man in spectacles and the white hooded robe) repainted to his PixelLab map
# sheet ($Npc_Wizytator) - the kind smiling wrinkled face kept, CLEAN-SHAVEN, the skin a warmer peach, the eyes warm grey-brown;
# the RTP's wide oval blue-grey spectacles taken off (filled from the skin round them) and SMALL ROUND black-rimmed ones painted
# (as on the map); the combed-back grey hair gone from the crown: a BALD old scalp painted in its place (a tonsure: creases,
# age spots, a shine), the hair left only at the temples and round the back of the head, WHITE;
# the white robe with its hood lying on the shoulders recoloured a plain BLACK wool habit with the cowl (the gold trim and its
# ornaments taken off and filled from the cloth round them, the folds kept in flat cel steps, the cowl's edges drawn again),
# the dark undershirt a black habit's neck.
# (The face is the same RTP man as Roch Szkwał's - make_przemytnik.py - but there he wears a hood and a full beard and no
# spectacles; here bald, clean-shaven, spectacles, black habit.)
# 0 PixelLab generations. Run: python tools/busts/make_wizytator.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Wizytator_Bust.png')
b = Bust('People2_1')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)


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


def inpaint(m, r=5):
    """Fill the pixels of m (in b.img and b.src) from the colours round them."""
    img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
    fill = cv2.inpaint(img8, m.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], fill, b.img[..., :3])
    b.src[..., :3] = np.where(m[..., None], fill, b.src[..., :3])


# the map's colours ($Npc_Wizytator front frame): habit (54, 58, 60)/(40, 41, 43)/(32, 33, 35)/(29, 29, 30), skin (246, 196, 164)/
# (242, 186, 150)/(226, 167, 133)/(204, 151, 120)/(192, 139, 109)/(143, 101, 76), white hair (225, 224, 221)/(208, 207, 206)/
# (193, 191, 187)/(168, 168, 168), spectacles black
SKIN = [(0.0, (40, 16, 10)), (0.2, (104, 54, 36)), (0.4, (160, 106, 80)), (0.55, (196, 140, 108)), (0.7, (222, 166, 132)), (0.8, (238, 184, 150)),
        (0.9, (248, 202, 170)), (1.0, (254, 222, 196))]
SKIN_T = ((214, 156, 122), (242, 188, 154), (252, 214, 186), (196, 140, 108))
HABIT = [(0.0, (6, 6, 8)), (0.2, (14, 14, 16)), (0.45, (24, 25, 27)), (0.62, (31, 32, 34)), (0.75, (38, 40, 42)), (0.86, (46, 49, 51)),
         (0.95, (53, 57, 59)), (1.0, (58, 62, 65))]
WHITE = [(0.0, (58, 56, 54)), (0.2, (112, 110, 106)), (0.4, (162, 160, 156)), (0.55, (196, 194, 190)), (0.7, (218, 217, 213)),
         (0.85, (234, 233, 230)), (1.0, (248, 247, 245))]
WHITE_T = ((176, 174, 170), (216, 215, 211), (240, 239, 236), (148, 146, 142))

op = b.op()
hd, s, v = hsv_of(b.src)
FACE = [(84, 40), (200, 40), (204, 100), (224, 104), (226, 150), (214, 170), (196, 178), (170, 190), (140, 194), (110, 186), (92, 166),
        (84, 120)]
face = b.poly(FACE) & op

# ---------- the robe and the hood: the gold trim and its ornaments filled from the cloth, then a black habit ----------
NECK_P = [(108, 178), (226, 148), (226, 186), (206, 200), (172, 220), (148, 220), (132, 200)]
neck_skin = b.sel(hue=(0, 45), sat=(0.25, 0.8), val=(0.25, 1), poly=NECK_P)
robe = op & region(S, 0, 160, W, H) & ~face & ~neck_skin
robe = b.comp(robe, (280, 300)) | b.comp(robe, (60, 300))
inner = b.sel(hue=(200, 290), sat=(0.25, 1), val=(0, 0.6), box=(110, 165, 250, 350))      # (the dark undershirt)
inner = b.grow(inner, 1, 0.2) & robe
gold = robe & ~inner & (s > 0.18)
gold = dilate_cv(gold, 1) & robe & ~inner
inpaint(gold, 6)
cloth = robe & ~inner
b.flatten(cloth, sigma=4.0, keep_lines=0.3)          # (the filled trim's smudges evened out, the folds and lines kept)
L = luma(b.src)
Lq = np.where(cloth & (L >= 0.3), np.floor(L * 5 + 0.5) / 5, L)       # (back to flat cel steps)
b.src[..., :3] = np.where(cloth[..., None], Lq[..., None], b.src[..., :3])
b.ramp(cloth, HABIT, gain=1.0)
b.ramp(inner, [(0.0, (6, 6, 8)), (0.2, (14, 14, 16)), (0.4, (22, 22, 25)), (0.7, (34, 35, 38)), (1.0, (48, 50, 54))], gain=1.4)
# (a few heavy wool folds and a little texture so the black reads as cloth)
b.over(hair_strands(S, erode_cv(cloth, 3), (170, 600), (74, 78, 82), (8, 8, 10), n=260, length=(4, 8), seed=21, alpha=(0.18, 0.25)))
b.over(strokes(S, [((40, 300), (46, 324), (44, 350), 1.6), ((290, 290), (286, 320), (290, 350), 1.6), ((214, 300), (206, 326), (210, 350), 1.4)],
               (10, 10, 12), alpha=0.7, clip=erode_cv(cloth, 2)))
# the cowl's edges (where the trim ran): a dark fold line and a lit ridge beside it
CE = [[(278, 182), (240, 196), (200, 213), (160, 233), (136, 248), (125, 262), (124, 300), (122, 352)],
      [(76, 198), (98, 188), (106, 206), (112, 232), (118, 256)]]
for e in CE:
    e = smooth(e, 2)
    b.over(line_along(e, 2.0, (8, 8, 10), 0.9), k=erode_cv(cloth, 1))
    b.over(line_along([(x - 1.5, y - 2.0) for x, y in e], 1.2, (70, 74, 78), 0.7), k=erode_cv(cloth, 2))

# ---------- the spectacles: the RTP's wide oval frames taken off (filled from the skin round them), small ROUND black ones
# painted (as on the map) ----------
GL = region(S, 76, 94, 200, 136)
EYE_E = (((b.xx - 108) / 12.0) ** 2 + ((b.yy - 108) / 7.0) ** 2 <= 1) | (((b.xx - 156) / 13.0) ** 2 + ((b.yy - 106) / 7.0) ** 2 <= 1)
fr = GL & (hd >= 195) & (hd <= 265) & (s >= 0.28) & ~EYE_E
fr |= GL & (s < 0.12) & (v > 0.8) & (b.xx < 100) & ~EYE_E           # (the far lens's glare)
fr |= GL & (((hd >= 190) & (hd <= 265) & (s < 0.2) & (v > 0.7)) | ((s < 0.08) & (v > 0.85))) & ~EYE_E   # (the frames' light glints)
fr = dilate_cv(fr, 2) & GL & ~EYE_E & ~b.sel(hue=(0, 45), sat=(0.3, 1), val=(0.6, 1))
OUTSIDE = b.poly([(70, 92), (89.5, 92), (89.0, 112), (89.5, 132), (70, 132)])
b.erase(OUTSIDE & GL)
inpaint(fr & ~OUTSIDE, 4)
b.img[..., 3] = np.where(GL & ~OUTSIDE & op, 1.0, b.img[..., 3])
b.over(line_along([(89.5, 94), (89.2, 112), (89.6, 132)], 2.0))       # (the far cheek's outline where the lens stood out)
hd, s, v = hsv_of(b.src)

# ---------- the face: warmer peach skin ----------
skin = b.sel(hue=(0, 45), sat=(0.25, 0.75), val=(0.35, 1)) & face
skin |= neck_skin & op & ~robe
b.ramp(skin, SKIN, gain=1.0)
frames = np.zeros(S[:2], bool)
# the eyes behind the lenses: warm dark grey-brown
irises = b.sel(hue=(190, 260), sat=(0.08, 1), val=(0.2, 0.75), polys=[[(100, 104), (124, 104), (124, 122), (100, 122)],
                                                                      [(146, 100), (170, 100), (170, 118), (146, 118)]])
b.ramp(irises, [(0.0, (14, 10, 8)), (0.3, (52, 40, 32)), (0.6, (96, 80, 66)), (1.0, (170, 156, 140))], gain=1.0)

# the new round spectacles: two small round rims, a bridge, the arm back to the ear
RIMS = [(108.5, 109, 11.5, 12.5), (156, 107.5, 13.5, 13.0)]
GLS = (16, 16, 20)
for cx, cy, rx, ry in RIMS:
    rim = ellipse(cx, cy, rx, ry, 0, 48)
    b.over(cel(S, [rim], ((222, 228, 236), (236, 240, 246), (250, 252, 255)), lw=0, outline=False, shade=2, light=0, ldir=LD), k=0.18)
    b.over(strokes(S, [(rim[i], rim[i], rim[(i + 1) % len(rim)], 2.4) for i in range(len(rim))], GLS, alpha=1.0, taper_to=1.0))
    b.over(strokes(S, [((cx - rx * 0.62, cy - ry * 0.45), (cx - rx * 0.35, cy - ry * 0.72), (cx - rx * 0.05, cy - ry * 0.78), 1.4)],
                   (255, 255, 255), alpha=0.6, taper_to=0.3))       # (the glass's glint)
b.over(strokes(S, [((119.5, 108), (131, 103.5), (142.6, 106), 2.0)], GLS, alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((169.4, 106), (184, 105), (199, 107.5), 2.0)], GLS, alpha=1.0, taper_to=1.0))

# ---------- the crown bald: the hair above the tonsure's line gone, an old scalp painted ----------
hair = b.sel(hue=(190, 300), sat=(0, 0.35), val=(0.25, 1), box=(80, 0, 260, 180)) | b.sel(sat=(0, 0.08), val=(0.6, 1), box=(80, 0, 260, 180))
hair = b.grow(hair, 2, 0.3) & region(S, 80, 0, 260, 180) & ~skin & ~frames & ~robe
CX, CY, RX, RY = 164, 110, 80, 92
skull = (((b.xx - CX) / RX) ** 2 + ((b.yy - CY) / RY) ** 2) <= 1
# the tonsure's line: the white hair stays below it at the near temple, round the ear and at the back; a tuft at the far temple
TONS = smooth([(250, 100), (240, 76), (222, 64), (202, 62), (188, 70), (180, 84)], 2)
LOWER = TONS + smooth([(180, 84), (174, 72), (158, 64), (138, 60), (118, 60), (102, 64), (93, 72), (88, 80)], 2)
ARC = ellipse(CX, CY, RX, RY, 0, 60, np.pi * 1.0 + 0.62, np.pi * 2.0 + 0.1)     # (the skull's top: from the far temple over to the back)
DOME = [(88, 80)] + ARC + LOWER
dome = b.poly(DOME)
b.erase(hair & ~skull)                                  # (the hair's volume above the skull)
b.erase(op & ~skull & region(S, 80, 0, 260, 100) & ~face)
dm = dome & skull
scalp = cel(S, [ellipse(CX, CY, RX, RY, 0, 80)], SKIN_T[:3] + (SKIN_T[3],), outline=False, shade=12, light=5, shade2=4, ldir=LD)
scalp[..., 3] *= dm                                      # (cut to the dome after shading: no shade band along the forehead's seam)
b.over(scalp)
b.over(strokes(S, [((182, 80), (194, 66), (214, 60), 3.0), ((214, 60), (232, 64), (244, 80), 3.0)], SKIN_T[3], alpha=0.5, taper_to=0.6,
               clip=dm))                                 # (the white hair's shadow on the scalp)
b.over(strokes(S, [((104, 40), (118, 28), (138, 22), 3.6)], (255, 234, 210), alpha=0.75, taper_to=0.2))      # (the shine)
b.over(line_along([p for p in ARC if p[1] < 104], 2.2))
WR = (190, 126, 92)
b.over(strokes(S, [((108, 50), (134, 45), (164, 48), 1.3), ((116, 40), (142, 36), (168, 40), 1.1)], WR, alpha=0.5, clip=dm))
b.over(strokes(S, [((100, 66), (124, 61), (150, 63), 1.2), ((150, 63), (166, 66), (178, 76), 1.1)], WR, alpha=0.4))   # (the seam: creases)
b.over(dots(S, [(176, 34, 2.4), (190, 44, 1.6), (156, 28, 1.8), (204, 54, 2.0), (130, 32, 1.4)], (206, 150, 112), alpha=0.6))

# ---------- the hair left: white, with a few strands ----------
side = hair & skull & ~dome
side |= b.sel(hue=(190, 300), sat=(0, 0.9), val=(0.08, 1), box=(196, 60, 252, 170)) & ~skin & ~frames & ~dome & ~robe
b.ramp(side, WHITE, gain=1.15, bias=0.08)
st = []
for i in range(8):           # the fringe of white hair round the back, under the tonsure's line
    y = 74 + i * 7
    st.append(((224 + i * 2.0, y - 6), (240 + i * 0.6, y + 4), (242 - i * 0.4, y + 16), 1.6))
for i in range(4):           # the near temple
    y = 80 + i * 6
    st.append(((186 + i * 0.6, y), (194 + i * 0.3, y + 8), (198 - i * 0.2, y + 16), 1.4))
for i in range(4):           # the far temple's tuft
    y = 64 + i * 6
    st.append(((90 + i * 0.4, y), (86 - i * 0.2, y + 8), (88 - i * 0.3, y + 14), 1.3))
b.over(strokes(S, st, WHITE_T[1], alpha=0.95, taper_to=0.15))
b.over(strokes(S, st[::2], WHITE_T[0], alpha=0.6, taper_to=0.15))
b.over(strokes(S, st[1::3], WHITE_T[2], alpha=0.8, taper_to=0.1))
# (a last speck of the old frame under the near lens)
spk = b.sel(sat=(0, 0.15), box=(140, 124, 156, 133), src=False)
img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
b.img[..., :3] = np.where(spk[..., None], cv2.inpaint(img8, spk.astype(np.uint8), 3, cv2.INPAINT_TELEA).astype(np.float32) / 255.0,
                          b.img[..., :3])
b.save(OUT)
print('ok', OUT)
