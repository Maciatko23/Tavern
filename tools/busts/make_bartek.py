# Bartek Kmiec (a peasant who lost everything at dice, about 35, sad and tired): SF_Actor2_1 repainted - tousled dark-blond
# sandy hair (rough strands painted over it), a short sandy beard round the jaw with a moustache over the smile (painted),
# stubble, dark rings under the eyes, brown eyes, a mouth turned a little down, the argyle sweater (pattern smoothed away) an
# open dark-brown wool vest with a patch over a white linen shirt (the sleeves, the front; the tie painted over).
# Run: python tools/busts/make_bartek.py [out.png]
import sys
from kit import *
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Bartek_Bust.png')
b = Bust('SF_Actor2_1')
S = b.img.shape

# ---- hair: darker sandy blond, messy ----
HAIR_SANDY = [(0.0, (30, 20, 12)), (0.15, (64, 44, 26)), (0.3, (104, 76, 44)), (0.45, (138, 104, 62)), (0.6, (166, 128, 80)),
              (0.8, (196, 160, 106)), (1.0, (220, 190, 136))]
hair = b.sel(hue=(35, 75), sat=(0.08, 1), val=(0, 0.95), box=(60, 0, 280, 190))
EYES = [[(104, 98), (133, 98), (133, 125), (104, 125)], [(150, 92), (187, 92), (187, 121), (150, 121)]]
hair |= b.sel(hue=(75, 230), sat=(0.0, 0.5), val=(0.55, 1), box=(60, 0, 280, 190)) & ~b.poly(*EYES) \
    & ~b.poly([(108, 120), (200, 110), (204, 150), (140, 196), (104, 160)])
hair |= b.sel(hue=(200, 290), sat=(0.08, 0.5), val=(0, 0.45), box=(190, 120, 240, 180))     # (the cool shadow under the hair at the neck)
hair = b.grow(hair, 1, 0.25) & region(S, 60, 0, 280, 190)
b.ramp(hair, HAIR_SANDY, gain=0.92)
b.over(hair_strands(S, erode_cv(hair, 2), (150, 160), (214, 182, 128), (92, 66, 38), n=140, length=(8, 16), seed=7, alpha=(0.55, 0.5)))
eyes = b.sel(hue=(160, 240), sat=(0.2, 1), polys=EYES)
b.ramp(eyes, [(0.0, (20, 12, 8)), (0.2, (56, 36, 22)), (0.45, (110, 76, 46)), (0.7, (170, 130, 86))])

# ---- the face: tired rings under the eyes, stubble, a short sandy beard and moustache ----
b.over(strokes(S, [((110, 122), (118, 126), (127, 122), 1.3), ((158, 119), (168, 122), (178, 118), 1.3)], (176, 108, 96), alpha=0.6))
skin = b.sel(hue=(0, 40), sat=(0.15, 0.7), val=(0.5, 1), box=(95, 90, 215, 200))
b.over(stubble(S, [(112, 132), (124, 140), (150, 142), (186, 136), (204, 128), (208, 150), (186, 176), (148, 194), (118, 176)],
               (120, 88, 56), density=0.34, seed=6, alpha=0.45, clip=skin))
OUTER = [(112, 136), (113, 152), (118, 166), (127, 179), (140, 190), (155, 190), (171, 182), (187, 170), (200, 158), (208, 146), (211, 132)]
INNER = [(204, 128), (198, 141), (188, 150), (178, 154), (168, 156), (156, 157), (144, 157), (133, 157), (126, 156), (121, 148), (116, 136)]
MOUS = [(123, 163), (126, 154), (135, 149), (147, 150), (158, 147), (169, 150), (173, 161), (166, 158), (157, 157), (147, 158), (137, 158),
        (129, 160)]
BEARD = ((120, 86, 50), (156, 118, 74), (192, 154, 102), (88, 60, 34))
b.over(beard2(S, OUTER, INNER, BEARD, flow=(160, 200), mous=MOUS, mous_flow=(148, 168), seed=8, n=90, tip=3.5, out=1.8, seg=8))
b.over(strokes(S, [((133, 160), (147, 158.2), (161, 160.4), 1.7)], (70, 36, 28), taper_to=0.6))     # the mouth, a little down

# ---- clothes: the sweater an open dark-brown vest over a white linen shirt ----
COLLAR = b.sel(sat=(0, 0.15), val=(0.6, 1), poly=[(118, 188), (232, 188), (232, 205), (172, 252), (160, 252), (150, 222), (132, 245), (118, 240)])
tie = b.sel(hue=(165, 240), sat=(0.1, 1), box=(118, 205, 215, 305))
tie = b.grow(tie, 1, 0.3) & region(S, 118, 205, 215, 305)
cloth = (b.sel(hue=(60, 170), sat=(0.05, 1), box=(0, 190, 330, 350)) | b.sel(sat=(0, 0.15), val=(0.6, 1), box=(0, 190, 330, 350))) \
    & ~COLLAR & ~tie
VEST_OUT = [(80, 236), (110, 214), (124, 200), (226, 198), (240, 222), (252, 242), (234, 290), (242, 352), (74, 352), (70, 290)]
OPENING = [(124, 196), (226, 196), (212, 234), (172, 262), (148, 286), (152, 352), (116, 352), (120, 292), (123, 240)]
vest = cloth & b.poly(VEST_OUT) & ~b.poly(OPENING)
shirt = cloth & ~vest
b.flatten(vest, 10.0)
b.flatten(shirt, 10.0)
b.ramp(vest, [(0.0, (18, 10, 6)), (0.2, (40, 26, 16)), (0.4, (62, 40, 24)), (0.6, (80, 54, 34)), (0.8, (96, 68, 44)), (1.0, (112, 82, 56))],
       gain=1.0)
b.ramp(shirt, RAMPS['linen'], gain=1.45)
# the shirt's front in the vest's opening (the tie and the sweater's V under it) painted over in one piece
front = fill_holes((tie | shirt) & b.poly(OPENING) & region(S, 0, 200, 330, 350)) & ~COLLAR
b.over(cel(S, [OPENING], ((200, 192, 174), (232, 228, 216), (246, 244, 238)), outline=False, shade=7, light=2, clip=front,
           ldir=(0.55, 0.83)))
cl = dilate_cv(COLLAR, 2) & ~COLLAR & front
b.img[..., :3] = np.where(cl[..., None], np.asarray(LINE, np.float32) / 255.0, b.img[..., :3])     # the collar's line again
# the vest's front edges and armholes (a line where it meets the shirt), the shirt's placket with buttons
b.over(outline(S, [VEST_OUT], lw=2.0, holes=[OPENING], clip=dilate_cv(vest, 2) & dilate_cv(shirt, 2)))
b.over(outline(S, [OPENING], lw=2.0, clip=dilate_cv(vest, 2) & dilate_cv(shirt, 2)))
b.over(strokes(S, [((150, 226), (142, 290), (134, 352), 1.1)], (150, 140, 124), alpha=0.8, taper_to=1.0, clip=front))
b.over(cel(S, [ellipse(140, 300, 2.4, 2.2), ellipse(139, 326, 2.4, 2.2)], ((150, 140, 124), (214, 206, 190), (240, 236, 226)), lw=0.9,
           shade=0.8, light=0.6, ldir=(0.55, 0.83)))
b.img = patch(b.img, [(186, 300), (208, 296), (212, 320), (190, 324)], vest, lift=1.35, hue=(30, 0.38), seed=12)
b.save(OUT)
print('ok', OUT)
