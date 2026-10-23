# Szczepan Kołodziej (the carter of the new town's stable, Map008 - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22; lean, about 40):
# People1_5 repainted to his map sheet ($Npc_Kolodziej) - a faded dark-red kerchief tied over his head (knot and tails at the
# back), the hair under it black, a short full black beard with the moustache, sun-tanned skin; the brown open coat made a
# SHEEPSKIN VEST (its sleeves and outer shoulders repainted as the shirt's sleeves, a fleece edge along the openings), the cream
# shirt and collar a faded blue linen. (Same base as the sołtys - kerchief, beard and clothes make him another man.)
# 0 PixelLab generations. Run: python tools/busts/make_kolodziej.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kolodziej_Bust.png')
b = Bust('People1_5')
S = b.img.shape
LD = (0.55, 0.83)
op = b.op()

# ---------- hair and moustache: black; the skin sun-tanned ----------
eyes = b.poly([(104, 100), (176, 100), (176, 124), (104, 124)])
hair = (b.sel(sat=(0, 0.32), val=(0, 0.72), box=(40, 0, 260, 170)) | b.sel(hue=(190, 265), val=(0, 0.5), box=(40, 0, 260, 170))) & ~eyes
mous = b.sel(sat=(0, 0.32), val=(0, 0.5), box=(110, 135, 190, 165))
b.ramp(hair | mous, RAMPS['hair_black'], gain=1.1)
skin = b.sel(hue=(5, 40), sat=(0.2, 0.8), val=(0.45, 1)) & region(S, 60, 50, 240, 270) & ~hair
b.multiply(skin, (232, 196, 164), 0.42)

# ---------- the kerchief: faded dark red, over the crown and down to the ears, a knot and two tails at the back ----------
RED = ((96, 30, 28), (140, 50, 44), (178, 82, 68), (70, 20, 20))
KERCH = [(86, 98), (82, 72), (92, 44), (112, 22), (140, 9), (170, 7), (200, 15), (226, 33), (240, 57), (246, 84), (242, 104), (230, 104),
         (216, 96), (205, 88), (196, 78), (182, 70), (160, 65), (138, 65), (118, 69), (103, 79), (95, 92)]
TAILS = [[(246, 72), (266, 98), (259, 106), (238, 82)], [(238, 80), (248, 114), (239, 118), (231, 86)]]
b.over(cel(S, TAILS, RED, lw=1.6, shade=4, light=1.6, ldir=LD))
b.over(cel(S, [KERCH], RED, lw=2.0, shade=10, light=3.5, shade2=5, ldir=LD))
b.over(cel(S, [ellipse(244, 74, 10, 8, 0.4)], RED, lw=1.6, shade=3, light=1.5, ldir=LD))
# folds of the cloth: from the knot over the crown, and the hem rolled over the forehead
km = b.poly(KERCH)
FOLDS = [((236, 66), (200, 40), (150, 26), 1.6), ((238, 80), (210, 60), (176, 48), 1.4), ((226, 92), (200, 74), (160, 62), 1.2),
         ((120, 30), (108, 50), (100, 74), 1.2)]
b.over(strokes(S, FOLDS, RED[3], alpha=0.6, clip=km, taper_to=0.3))
b.over(strokes(S, [((x0, y0 - 3), (xm, ym - 3), (x1, y1 - 3), 1.0) for (x0, y0), (xm, ym), (x1, y1), _ in FOLDS], RED[2], alpha=0.45,
               clip=km, taper_to=0.3))
HEM = [((100, 84), (124, 70), (160, 70), 2.0), ((160, 70), (186, 74), (204, 90), 2.0)]
b.over(strokes(S, HEM, RED[0], alpha=0.7, clip=km, taper_to=0.8))
# a few small darker specks: an old, washed cloth
b.over(dots(S, [(130, 40, 1.6), (176, 30, 1.4), (206, 52, 1.5), (152, 52, 1.2), (110, 58, 1.3)], (110, 40, 36), alpha=0.5, clip=km))
# the shadow of the kerchief's hem on the forehead
b.multiply(b.poly([(96, 92), (104, 82), (120, 72), (140, 69), (162, 69), (184, 73), (198, 82), (190, 84), (170, 76), (140, 75), (118, 79),
                   (104, 90)]) & skin, (190, 140, 130), 0.6)

# ---------- a short full black beard along the jaw (the moustache joins it) ----------
OUTER = [(207, 120), (205, 140), (197, 158), (181, 176), (161, 188), (140, 190), (122, 182), (108, 168), (100, 152), (97, 138)]
INNER = [(105, 140), (112, 154), (124, 164), (138, 172), (153, 171), (166, 162), (178, 150), (190, 136), (199, 120)]
TONES = ((16, 14, 16), (34, 30, 32), (64, 58, 60), (8, 6, 8))
b.over(beard2(S, OUTER, INNER, TONES, flow=(150, 240), seed=21, n=120, tip=4, out=2.0, seg=8))
MOUS = [(120, 152), (130, 145), (144, 142), (156, 143), (168, 147), (176, 155), (178, 162), (170, 159), (158, 156), (146, 157), (134, 157),
        (124, 161), (118, 162)]
b.over(cel(S, [MOUS], TONES[:3], lw=1.4, shade=2.5, light=1.2, ldir=LD))
b.over(hair_strands(S, erode_cv(b.poly(MOUS), 1), (176, 166), TONES[2], TONES[3], n=24, length=(5, 9), seed=23))
# sideburns down to the beard (the hair before the ear)
b.over(cel(S, [[(196, 92), (206, 96), (208, 122), (200, 126), (194, 110)]], TONES[:3], lw=1.2, shade=2, light=1, ldir=LD))

# ---------- the clothes: blue shirt, sheepskin vest ----------
torso = op & region(S, 0, 150, 330, 350)
skin_n = b.sel(hue=(5, 30), sat=(0.38, 0.75), val=(0.55, 1)) & b.poly([(120, 150), (205, 150), (205, 262), (120, 262)])
SHIRT = [(84, 216), (100, 196), (118, 178), (132, 170), (190, 158), (216, 156), (244, 212), (226, 216), (206, 228), (201, 350), (121, 350),
         (117, 240), (96, 236)]
shirt = b.sel(hue=(28, 62), sat=(0.0, 0.42), val=(0.5, 1)) & b.poly(SHIRT) & ~skin_n
shirt = b.grow(shirt, 2, 0.3) & b.poly(SHIRT) & ~skin_n
BLUE = [(0.0, LINE), (0.25, (44, 56, 76)), (0.5, (82, 102, 130)), (0.66, (108, 130, 158)), (0.8, (132, 154, 180)), (0.92, (154, 174, 196))]
b.ramp(shirt, BLUE)
# the sleeves (the coat's sleeves and outer shoulders): the blue shirt's
ARM_L = [(76, 214), (72, 240), (67, 266), (63, 300), (62, 350)]
ARM_R = [(254, 206), (248, 230), (246, 252), (250, 300), (251, 350)]
SLV_L = [(-30, 380), (-30, 190), (80, 190)] + ARM_L[:-1] + [(62, 380)]
SLV_R = [(360, 380), (360, 190), (250, 190)] + ARM_R[:-1] + [(251, 380)]
inner = erode_cv(op, 2)
slv = (b.poly(SLV_L) | b.poly(SLV_R)) & torso
SLV_T = ((80, 100, 128), (112, 134, 162), (140, 162, 188), (64, 82, 108))
for P in (SLV_L, SLV_R):
    b.over(cel(S, [P], SLV_T, outline=False, shade=9, light=3, shade2=4, ldir=LD, clip=b.poly(P) & inner & torso))
b.ramp(slv & ~inner, [(0.0, LINE), (1.0, (70, 76, 90))])
inside_slv = slv & inner
SH, CREASE = (96, 116, 144), (70, 88, 114)
def wedge(p0, p1, p2, w):
    return taper(bez(p0, p1, p2, 16), w * 0.3, 0.2, w_mid=w)
WEDGES = [wedge((48, 262), (40, 280), (24, 296), 7), wedge((58, 300), (40, 312), (14, 320), 8), wedge((256, 232), (276, 236), (300, 250), 8),
          wedge((254, 268), (276, 276), (306, 284), 9), wedge((256, 306), (282, 314), (318, 318), 9)]
b.over(cel(S, WEDGES, (SH, SH, SH), outline=False, shade=0, light=0, clip=inside_slv))
b.over(strokes(S, [((48, 262), (40, 280), (24, 296), 1.2), ((58, 300), (40, 312), (14, 320), 1.2), ((256, 268), (276, 276), (306, 284), 1.2),
                   ((256, 306), (282, 314), (318, 318), 1.2)], CREASE, alpha=0.9, clip=inside_slv))
# a patch on the near sleeve
from patches import patch
b.img = patch(b.img, [(270, 300), (296, 296), (300, 324), (274, 328)], inside_slv, lift=0.92, hue=(215, 0.2), seed=41)

# the vest: the coat's front panels, sheepskin brown with a short-fleece texture
vest = torso & ~slv & ~shirt & ~skin_n & ~b.poly(SHIRT) & b.poly([(40, 190), (290, 190), (290, 350), (40, 350)])
VEST = [(0.0, (26, 16, 10)), (0.15, (54, 34, 20)), (0.28, (86, 58, 36)), (0.45, (110, 78, 50)), (0.68, (136, 102, 68)), (0.85, (160, 126, 88)),
        (1.0, (182, 150, 110))]
b.ramp(vest, VEST)
vin = erode_cv(vest, 2)
b.over(hair_strands(S, vin, (160, 400), (176, 146, 106), (70, 48, 30), n=260, length=(3, 6), seed=31, alpha=(0.35, 0.35), width=(1.0, 1.3)))
# the armholes' edges and the fleece along them and along the front openings (cream wool, ragged)
for A in (ARM_L, ARM_R):
    b.over(strokes(S, [(A[i], ((np.asarray(A[i]) + np.asarray(A[i + 1])) / 2).tolist(), A[i + 1], 2.0) for i in range(len(A) - 1)],
                   LINE, alpha=1.0, taper_to=1.0, clip=op))
FLEECE = ((150, 128, 96), (204, 182, 142), (230, 214, 180), (120, 98, 70))
EDGE_L = [(80, 214), (76, 240), (71, 266), (67, 300), (66, 352)]
EDGE_R = [(250, 208), (244, 232), (242, 254), (246, 300), (247, 352)]
FRONT_L = [(108, 236), (116, 262), (120, 300), (122, 352)]
FRONT_R = [(214, 226), (206, 252), (203, 300), (202, 352)]
def band(path, w, dx):
    """a strip of fleece along a path, w px wide, put dx px to one side (inside the vest)"""
    pts = [(x + dx, y) for x, y in path]
    return taper(np.array(pts, np.float64), w, w)
BANDS = [band(EDGE_L, 7, 4.5), band(EDGE_R, 7, -4.5), band(FRONT_L, 6, -3.5), band(FRONT_R, 7, 4.0)]
fl = cel(S, BANDS, FLEECE[:3], lw=1.2, shade=2.2, light=1.4, ldir=LD, clip=vest)
b.over(fl)
flm = fl[..., 3] > 0.5
b.over(hair_strands(S, flm, (160, 420), FLEECE[2], FLEECE[3], n=140, length=(2, 4), seed=37, alpha=(0.55, 0.5), width=(1.0, 1.2)))

# dust of the road on the vest
from patches import smudge
b.img = smudge(b.img, [[(130, 320), (170, 312), (190, 334), (150, 346)], [(40, 300), (60, 292), (66, 330), (44, 336)]], (150, 130, 100), 0.18)
b.save(OUT)
print('ok', OUT)
