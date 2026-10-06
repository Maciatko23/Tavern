# Wojciech (the carter, burly, about 50): People2_7 repainted - a battered wide-brimmed dark-brown leather hat over the goggles
# (the soft hat of SF_Actor2_4), grey-brown hair, a bushy grey-brown moustache, red weathered cheeks, the leather straps a heavy
# dark-brown wool coat, a thick mustard wool scarf wound round the neck. Run: python tools/busts/make_woznica.py [out.png]
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
arms = b.sel(hue=(10, 40), sat=(0.25, 0.7), val=(0.5, 1), polys=[[(0, 210), (95, 210), (95, 350), (0, 350)], [(232, 210), (330, 210), (330, 350), (232, 350)]])
coat = b.grow(straps | arms, 2, 0.3) & region(S, 0, 185, 330, 350)
COAT = [(0.0, (16, 10, 8)), (0.15, (36, 24, 16)), (0.35, (60, 42, 28)), (0.55, (82, 60, 40)), (0.75, (104, 78, 54)), (0.95, (126, 98, 70))]
b.ramp(coat, COAT, gain=1.0)
shirt = b.sel(sat=(0, 0.3), val=(0.6, 1), box=(90, 190, 240, 350)) & ~coat
b.ramp(shirt, [(0.0, (14, 10, 8)), (0.3, (34, 26, 20)), (0.6, (54, 42, 32)), (0.9, (74, 58, 44)), (1.0, (84, 66, 50))])
# the scarf: a thick roll round the neck
SCARF = [(132, 226), (158, 238), (188, 242), (218, 234), (240, 218), (250, 236), (236, 258), (206, 272), (172, 274), (144, 266), (126, 250)]
b.over(cel(S, [SCARF], ((132, 96, 30), (196, 152, 58), (230, 196, 110)), lw=2.0, shade=6, light=2.5))
b.over(strokes(S, [((136, 242), (178, 260), (240, 232), 1.0), ((148, 254), (184, 268), (234, 248), 1.0), ((204, 242), (208, 256), (212, 268), 1.0)],
               (140, 100, 36), alpha=0.7))
# the moustache bushier: strands over the old one
mm = dilate_cv(must, 2) & region(S, 118, 155, 214, 192)
b.over(hair_strands(S, mm, (166, 210), (170, 160, 150), (70, 62, 54), n=40, length=(5, 9), seed=3, alpha=(0.7, 0.6)))
b.over(stubble(S, [(120, 176), (150, 190), (186, 192), (214, 182), (222, 166), (214, 196), (184, 212), (146, 206), (124, 192)], (110, 100, 92),
               density=0.3, seed=4, alpha=0.4))
skin = b.sel(hue=(10, 45), sat=(0.2, 0.7), val=(0.6, 1), box=(90, 100, 240, 220))
b.over(blush(S, 126, 152, 14, 8, (214, 84, 64), 0.32, clip=skin))
b.over(blush(S, 206, 150, 12, 8, (214, 84, 64), 0.28, clip=skin))
# the hat: dark brown leather, wide, tilted with the head
M = affine(scale=(1.36, 1.14), rot=-5, src_pt=(143, 92), dst_pt=(152, 122))
LEATHER_HAT = [(0.0, (16, 10, 6)), (0.2, (40, 26, 16)), (0.38, (64, 42, 26)), (0.55, (88, 60, 38)), (0.72, (110, 78, 52)), (0.88, (134, 100, 70))]
hat = bucket_hat(M, S, LEATHER_HAT, gain=1.0, band=((24, 16, 10), (44, 30, 20), (66, 48, 32)))
put_hat(b, hat, shadow=(140, 110, 100), shadow_k=0.55, sdx=2, sdy=9)
b.save(OUT)
print('ok', OUT)
