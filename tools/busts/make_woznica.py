# Wojciech (the carter, burly, about 50): People2_7 repainted - a battered wide-brimmed dark-brown leather hat over the goggles
# (the soft hat of SF_Actor2_4), grey-brown hair, a full short grey-brown beard with a bushy moustache over the grin (painted),
# a red weathered face, the leather straps a heavy dark-brown wool coat, a thick mustard wool scarf wound round the neck.
# Run: python tools/busts/make_woznica.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Woznica_Bust.png')
b = Bust('People2_7')
S = b.img.shape

FACE = [(96, 112), (176, 100), (226, 120), (232, 160), (214, 196), (180, 214), (140, 206), (110, 180), (98, 150)]
hair = (b.sel(hue=(20, 60), sat=(0.15, 0.7), val=(0, 0.78), box=(50, 0, 270, 200)) | b.sel(hue=(38, 60), sat=(0, 0.35), val=(0.6, 1), box=(50, 0, 270, 140))) \
    & ~b.poly(FACE)
hair |= b.sel(sat=(0, 0.3), box=(50, 40, 270, 150)) & ~b.poly(FACE)   # (the goggles' metal and glass under the brim: hair)
b.ramp(hair, [(0.0, (30, 26, 22)), (0.2, (70, 62, 54)), (0.4, (110, 100, 90)), (0.6, (150, 142, 132)), (0.8, (186, 180, 172))])
must = b.sel(hue=(20, 50), sat=(0.3, 0.7), val=(0, 0.6), box=(120, 160, 210, 190))
b.ramp(must, [(0.0, (34, 28, 24)), (0.25, (82, 72, 62)), (0.45, (124, 112, 100)), (0.6, (156, 146, 134))])
# the coat: the straps and pauldrons, and the bare arms, heavy dark-brown wool
straps = b.sel(hue=(20, 55), sat=(0.25, 0.7), val=(0, 0.75), box=(0, 185, 330, 350)) | b.sel(hue=(31, 60), sat=(0.53, 1), poly=[(176, 186), (214, 168), (248, 174), (258, 206), (252, 242), (214, 254), (186, 242)])
straps |= b.sel(hue=(30, 60), sat=(0.3, 1), poly=[(196, 150), (240, 150), (240, 190), (196, 190)])     # (the high collar's gold edge)
arms = b.sel(hue=(10, 40), sat=(0.25, 0.7), val=(0.5, 1), polys=[[(0, 210), (95, 210), (95, 350), (0, 350)], [(232, 210), (330, 210), (330, 350), (232, 350)]])
coat = b.grow(straps | arms, 2, 0.3) & (region(S, 0, 185, 330, 350) | region(S, 196, 150, 240, 190))
COAT = [(0.0, (16, 10, 8)), (0.15, (36, 24, 16)), (0.35, (60, 42, 28)), (0.55, (82, 60, 40)), (0.75, (104, 78, 54)), (0.95, (126, 98, 70))]
b.ramp(coat, COAT, gain=1.0)
shirt = b.sel(sat=(0, 0.3), val=(0.6, 1), box=(90, 190, 240, 350)) & ~coat
b.ramp(shirt, [(0.0, (14, 10, 8)), (0.3, (34, 26, 20)), (0.6, (54, 42, 32)), (0.9, (74, 58, 44)), (1.0, (84, 66, 50))])
# a red weathered face: the skin warmed towards red, ruddy cheeks and nose
skin = b.sel(hue=(0, 45), sat=(0.15, 0.75), val=(0.45, 1), box=(90, 95, 240, 225)) & ~hair & ~must & ~coat
b.multiply(skin, (255, 196, 178), 0.55)
b.over(blush(S, 124, 152, 15, 9, (204, 70, 54), 0.42, clip=skin))
b.over(blush(S, 204, 148, 12, 9, (204, 70, 54), 0.36, clip=skin))
b.over(blush(S, 131, 158, 8, 6, (196, 64, 52), 0.35, clip=skin))
# the scarf: a thick roll round the neck
SCARF = [(132, 226), (158, 238), (188, 242), (218, 234), (240, 218), (250, 236), (236, 258), (206, 272), (172, 274), (144, 266), (126, 250)]
b.over(cel(S, [SCARF], ((132, 96, 30), (196, 152, 58), (230, 196, 110)), lw=2.0, shade=6, light=2.5, ldir=(0.55, 0.83)))
b.over(strokes(S, [((136, 242), (178, 260), (240, 232), 1.0), ((148, 254), (184, 268), (234, 248), 1.0), ((204, 242), (208, 256), (212, 268), 1.0)],
               (140, 100, 36), alpha=0.7))
# the full beard: short, grey-brown, round the jaw and over the chin, a bushy moustache hiding the grin
OUTER = [(84, 142), (86, 156), (92, 167), (99, 178), (107, 189), (115, 199), (124, 208), (134, 216), (146, 222), (158, 219), (171, 210),
         (182, 197), (191, 183), (198, 168), (202, 153), (204, 140)]
INNER = [(197, 142), (192, 154), (184, 163), (174, 168), (164, 170), (152, 173), (140, 176), (128, 177), (118, 176), (108, 170), (100, 160),
         (93, 149), (88, 140)]
MOUS = [(104, 186), (106, 174), (114, 167), (126, 163), (138, 164), (150, 160), (162, 158), (171, 163), (175, 175), (168, 171), (160, 171),
        (150, 174), (140, 177), (128, 180), (116, 182)]
GREYBROWN = ((86, 74, 62), (122, 108, 92), (160, 148, 128), (60, 50, 42))
b.over(beard2(S, OUTER, INNER, GREYBROWN, flow=(150, 228), mous=MOUS, mous_flow=(140, 192), seed=9, n=120, tip=5, out=2.4, seg=8,
              mous_tones=((96, 84, 70), (136, 122, 104), (174, 162, 142), (66, 56, 46))))
# the hat: dark brown leather, wide, tilted with the head
M = affine(scale=(1.36, 1.14), rot=-5, src_pt=(143, 92), dst_pt=(152, 122))
LEATHER_HAT = [(0.0, (16, 10, 6)), (0.2, (40, 26, 16)), (0.38, (64, 42, 26)), (0.55, (88, 60, 38)), (0.72, (110, 78, 52)), (0.88, (134, 100, 70))]
hat = bucket_hat(M, S, LEATHER_HAT, gain=1.0, band=((24, 16, 10), (44, 30, 20), (66, 48, 32)))
put_hat(b, hat, shadow=(140, 110, 100), shadow_k=0.55, sdx=2, sdy=9)
b.save(OUT)
print('ok', OUT)
