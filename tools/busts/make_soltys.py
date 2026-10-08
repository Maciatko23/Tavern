# Sołtys Bronisław (the town's headman, stocky, past sixty): People1_5 repainted to match his map sheet ($Npc_Soltys) - grey
# hair, thick bushy grey brows and a big drooping (walrus) grey moustache, a few years more in the face (forehead, eye and
# cheek lines, a ruddy cheek); the brown open coat made a buttoned BROWN WAISTCOAT over a WHITE long-sleeved shirt: the coat's
# sleeves and outer shoulders repainted as white shirt sleeves, the front panels kept as the waistcoat and closed below a
# V-neck with buttons, the cream shirt and collar white; a gold chain of office with a round seal across the chest.
# (2026-10-06 first version kept the brown coat with sleeves; 2026-10-07 waistcoat + white shirt as on the map.)
# Run: python tools/busts/make_soltys.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Soltys_Bust.png')
b = Bust('People1_5')
S = b.img.shape
hd, s, v = hsv_of(b.src)
L0 = luma(b.src)
op = b.op()

# ---------- hair: grey ----------
eyes = b.poly([(104, 100), (176, 100), (176, 124), (104, 124)])
hair = (b.sel(sat=(0, 0.32), val=(0, 0.72), box=(40, 0, 260, 170)) | b.sel(hue=(190, 265), val=(0, 0.5), box=(40, 0, 260, 170))) & ~eyes
mous = b.sel(sat=(0, 0.32), val=(0, 0.5), box=(110, 135, 190, 165))
GREY = [(0.0, (40, 38, 44)), (0.06, (66, 64, 72)), (0.10, (118, 118, 128)), (0.25, (170, 170, 178)), (0.5, (216, 216, 222)),
        (0.75, (242, 242, 246))]
b.ramp(hair | mous, GREY)

# ---------- age: a few lines in the RTP manner (thin, warm, half see-through) ----------
WR = (150, 90, 70)
b.over(strokes(S, [((156, 80), (172, 77), (190, 80), 1.5), ((160, 74), (174, 72), (188, 74), 1.2), ((118, 84), (126, 82), (134, 84), 1.1),
                   ((180, 104), (186, 108), (193, 108), 1.3), ((181, 111), (187, 114), (193, 113), 1.2),
                   ((150, 114), (160, 118), (170, 115), 1.2), ((104, 118), (110, 123), (116, 122), 1.1),
                   ((162, 126), (168, 138), (174, 150), 1.6), ((128, 172), (136, 176), (146, 175), 1.1)], WR, alpha=0.55))
# a fuller, ruddier face: a touch of blush on the near cheek and the nose
b.over(blush(S, 182, 140, 14, 9, (230, 110, 90), 0.24))
b.over(blush(S, 150, 132, 7, 5, (230, 110, 90), 0.18))

# ---------- thick bushy grey brows and a big drooping moustache (painted over the old thin ones) ----------
HAIR_T = ((128, 128, 136), (184, 184, 190), (226, 226, 232), (96, 96, 104))
BROW_N = [(134, 96), (139, 89), (149, 85), (161, 84), (172, 86), (178, 92), (171, 93), (160, 91), (148, 92), (139, 97)]
BROW_F = [(91, 102), (97, 96), (108, 94), (119, 95), (125, 100), (117, 101), (105, 101), (96, 104)]
for i, P in enumerate((BROW_N, BROW_F)):
    lay = cel(S, [P], HAIR_T[:3], lw=1.3, shade=2.5, light=1.2, ldir=(0.55, 0.83))
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), (P[0][0] - 6, P[0][1] + 2), HAIR_T[2], HAIR_T[3], n=18, length=(5, 9),
                                 seed=11 + i, alpha=(0.6, 0.6)))
    b.over(lay)
MOUS = [(124, 149), (134, 144), (146, 142), (156, 143), (166, 145), (173, 150), (177, 158), (178, 167), (173, 165), (167, 160), (156, 160),
        (146, 161), (136, 162), (127, 166), (121, 173), (118, 166), (119, 157)]
ml = cel(S, [MOUS], HAIR_T[:3], lw=1.5, shade=3.5, light=1.8, ldir=(0.55, 0.83))
mm = erode_cv(ml[..., 3] > 0.5, 1)
ml = over(ml, hair_strands(S, mm, (176, 168), HAIR_T[2], HAIR_T[3], n=24, length=(6, 11), seed=13, alpha=(0.6, 0.55)))
ml = over(ml, hair_strands(S, mm & (b.xx < 150), (119, 172), HAIR_T[2], HAIR_T[3], n=22, length=(6, 11), seed=14, alpha=(0.6, 0.55)))
b.over(strokes(S, [((150, 143), (151, 152), (149, 160), 1.0)], HAIR_T[3], alpha=0.5, clip=mm))   # (the parting under the nose)
b.over(ml)

# ---------- the clothes ----------
torso = op & region(S, 0, 150, 330, 350)
skin = b.sel(hue=(5, 30), sat=(0.38, 0.75), val=(0.55, 1)) & b.poly([(120, 150), (205, 150), (205, 262), (120, 262)])
# the shirt and its collar: cream -> white
SHIRT = [(84, 216), (100, 196), (118, 178), (132, 170), (190, 158), (216, 156), (244, 212), (226, 216), (206, 228), (201, 350), (121, 350),
         (117, 240), (96, 236)]
shirt = b.sel(hue=(28, 62), sat=(0.0, 0.42), val=(0.5, 1)) & b.poly(SHIRT) & ~skin
shirt = b.grow(shirt, 2, 0.3) & b.poly(SHIRT) & ~skin
WHITE = [(0.0, LINE), (0.25, (104, 98, 92)), (0.5, (176, 170, 160)), (0.66, (212, 208, 198)), (0.8, (236, 234, 226)), (0.92, (250, 249, 244))]
b.ramp(shirt, WHITE)
# the shirt's sleeves: the coat's sleeves and outer shoulders, outside the waistcoat's armholes
ARM_L = [(76, 214), (72, 240), (67, 266), (63, 300), (62, 350)]
ARM_R = [(254, 206), (248, 230), (246, 252), (250, 300), (251, 350)]
SLV_L = [(-30, 380), (-30, 190), (80, 190)] + ARM_L[:-1] + [(62, 380)]
SLV_R = [(360, 380), (360, 190), (250, 190)] + ARM_R[:-1] + [(251, 380)]
inner = erode_cv(op, 2)
slv = (b.poly(SLV_L) | b.poly(SLV_R)) & torso
SHIRT_T = ((198, 192, 182), (236, 233, 225), (251, 250, 245), (170, 162, 150))
for P in (SLV_L, SLV_R):
    b.over(cel(S, [P], SHIRT_T, outline=False, shade=9, light=3, shade2=4, ldir=(0.55, 0.83), clip=b.poly(P) & inner & torso))
# the old outline round the sleeves: a neutral dark line (the coat's was reddish brown)
b.ramp(slv & ~inner, [(0.0, LINE), (1.0, (120, 112, 104))])
# folds of the loose shirt sleeves: shade wedges (cel) with a crease line, and the waistcoat's shadow along the armholes
SH, CREASE = (204, 198, 188), (168, 160, 148)
inside_slv = slv & inner
def wedge(p0, p1, p2, w):
    return taper(bez(p0, p1, p2, 16), w * 0.3, 0.2, w_mid=w)
WEDGES = [wedge((48, 262), (40, 280), (24, 296), 7), wedge((58, 300), (40, 312), (14, 320), 8), wedge((60, 330), (46, 340), (28, 346), 6),
          wedge((256, 232), (276, 236), (300, 250), 8), wedge((254, 268), (276, 276), (306, 284), 9), wedge((256, 306), (282, 314), (318, 318), 9),
          wedge((300, 330), (314, 338), (330, 346), 6)]
b.over(cel(S, WEDGES, (SH, SH, SH), outline=False, shade=0, light=0, clip=inside_slv))
b.over(strokes(S, [((48, 262), (40, 280), (24, 296), 1.2), ((58, 300), (40, 312), (14, 320), 1.2), ((256, 268), (276, 276), (306, 284), 1.2),
                   ((256, 306), (282, 314), (318, 318), 1.2), ((256, 232), (276, 236), (300, 250), 1.1)], CREASE, alpha=0.9, clip=inside_slv))
band_l = taper(np.array(ARM_L, np.float64) + [-3.0, 0.0], 6, 6)
band_r = taper(np.array(ARM_R, np.float64) + [3.5, 0.0], 7, 7)
b.over(cel(S, [band_l, band_r], ((188, 180, 170),) * 3, outline=False, shade=0, light=0, clip=inside_slv))
# the waistcoat: the coat's front panels, a richer brown
vest = torso & ~slv & ~shirt & ~skin & ~b.poly(SHIRT) & b.poly([(40, 190), (290, 190), (290, 350), (40, 350)])
VEST = [(0.0, (30, 18, 12)), (0.15, (58, 34, 22)), (0.28, (92, 58, 36)), (0.45, (116, 76, 46)), (0.68, (146, 102, 62)), (0.85, (172, 128, 82)),
        (1.0, (198, 158, 108))]
b.ramp(vest, VEST)
# the armholes' edges
for A in (ARM_L, ARM_R):
    b.over(strokes(S, [(A[i], ((np.asarray(A[i]) + np.asarray(A[i + 1])) / 2).tolist(), A[i + 1], 2.0) for i in range(len(A) - 1)],
                   LINE, alpha=1.0, taper_to=1.0, clip=op))
# closed below a V-neck: the two front panels painted over the open shirt, the near one over the far one, buttons
VP_L = [(106, 222), (166, 276), (168, 352), (108, 352)]
collar_tips = shirt & (b.yy < 238)
VP_R = [(208, 222), (198, 240), (162, 278), (164, 352), (206, 352)]
b.over(cel(S, [VP_L], ((70, 42, 26), (100, 64, 40), (124, 84, 52)), outline=False, shade=6, light=2.5, ldir=(0.55, 0.83), clip=op & ~collar_tips))
b.over(cel(S, [VP_R], ((118, 80, 48), (148, 104, 64), (172, 128, 82)), outline=False, shade=7, light=2.5, ldir=(0.55, 0.83), clip=op & ~collar_tips))
EDGES = [VP_L[0], VP_L[1]], [VP_R[0], VP_R[1], VP_R[2], VP_R[3]]       # (the line only along the V and the front edge)
for E in EDGES:
    b.over(strokes(S, [(E[i], ((np.asarray(E[i]) + np.asarray(E[i + 1])) / 2).tolist(), E[i + 1], 2.0) for i in range(len(E) - 1)],
                   LINE, alpha=1.0, taper_to=1.0, clip=op & ~collar_tips))
GOLD = ((124, 80, 24), (206, 152, 54), (252, 226, 146))
b.over(cel(S, [ellipse(171, 290, 3.4, 3.2), ellipse(172, 344, 3.4, 3.2)], ((90, 60, 34), (150, 112, 70), (200, 162, 112)), lw=1.0, shade=1.4,
           light=0.8, ldir=(0.55, 0.83)))

# ---------- the chain of office ----------
path = [(92, 232), (104, 260), (120, 282), (142, 298), (158, 303)]
path2 = [(180, 303), (204, 294), (226, 276), (244, 254), (256, 230)]
b.over(chain(S, path, link=(13, 8.0), every=10.5))
b.over(chain(S, path2, link=(13, 8.0), every=10.5))
seal = cel(S, [ellipse(169, 318, 17, 18)], GOLD, lw=2.0, shade=4.5, light=2, ldir=(0.55, 0.83))
b.over(seal)
b.over(cel(S, [ellipse(169, 318, 11, 12)], ((150, 100, 34), (226, 178, 80), (252, 230, 160)), lw=1.0, shade=2.5, light=1.2, ldir=(0.55, 0.83)))
b.over(strokes(S, [((163, 313), (169, 310), (175, 313), 1.6), ((169, 310), (169, 318), (169, 325), 1.6)], (110, 70, 20), alpha=0.9))
b.over(cel(S, [ellipse(169, 300, 5, 4)], GOLD, lw=1.2, shade=1.5, light=1.0, ldir=(0.55, 0.83)))

b.save(OUT)
print('ok', OUT)
