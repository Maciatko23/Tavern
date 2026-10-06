# Bartek Kmiec (a peasant who lost everything at dice, about 35): SF_Actor2_1 repainted - tousled sandy-brown hair, brown
# stubble, the argyle sweater a plain brown wool vest (the pattern smoothed away) over an off-white linen shirt, the tie part
# of the shirt. Run: python tools/busts/make_bartek.py [out.png]
import sys
from kit import *
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Bartek_Bust.png')
b = Bust('SF_Actor2_1')
S = b.img.shape

hair = b.sel(hue=(35, 75), sat=(0.08, 1), val=(0, 0.95), box=(60, 0, 280, 190))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 0, 280, 190)
b.ramp(hair, RAMPS['hair_sandy'], gain=0.95)
eyes = b.sel(hue=(190, 240), sat=(0.2, 1), polys=[[(110, 110), (150, 110), (150, 140), (110, 140)], [(180, 100), (230, 100), (230, 130), (180, 130)]])
b.ramp(eyes, [(0.0, (20, 12, 8)), (0.2, (56, 36, 22)), (0.45, (110, 76, 46)), (0.7, (170, 130, 86))])
sweater = b.sel(hue=(90, 160), sat=(0.08, 1), box=(0, 190, 330, 350)) | b.sel(sat=(0, 0.1), val=(0.75, 1), box=(80, 250, 290, 350))
tie = b.sel(hue=(165, 240), sat=(0.1, 1), box=(118, 205, 215, 305))
tie = b.grow(tie, 1, 0.3) & region(S, 118, 205, 215, 305)
VEST = [(96, 248), (130, 232), (160, 250), (174, 268), (196, 252), (226, 232), (262, 240), (276, 290), (280, 352), (88, 352), (84, 300)]
vest = sweater & b.poly(VEST)
sleeves = sweater & ~vest
b.flatten(vest, 10.0)
b.flatten(sleeves, 10.0)
b.ramp(vest, RAMPS['brown_wool'], gain=1.25)
b.ramp(sleeves, RAMPS['linen'], gain=1.35)
b.ramp(tie, RAMPS['linen'], gain=1.2)
b.over(outline(S, [VEST], lw=2.0, clip=sweater))
b.img = patch(b.img, [(110, 300), (134, 296), (138, 322), (114, 326)], vest, lift=1.3, hue=(34, 0.36), seed=12)
b.over(stubble(S, [(118, 150), (150, 166), (186, 168), (210, 156), (218, 140), (210, 176), (182, 196), (148, 194), (124, 176)],
               (110, 80, 56), density=0.34, seed=6, alpha=0.45))
b.save(OUT)
print('ok', OUT)
