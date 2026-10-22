# Hieronim (the gravedigger of the old cemetery, Map008 - package D "Tajemnice i zakon", 2026-10-22; stocky, about 65):
# SF_People1_7 (the wrinkled old man in a knit cap) repainted to his map sheet ($Npc_Grabarz) - the knit cap kept but dark brown
# wool (the map's (74, 52, 36)), the grey hair at the sides, a short grey stubble beard on the jaw and chin (painted), bushy grey
# brows, the khaki jacket a long patched earth-brown work coat (the map's (110, 86, 56)), the turtleneck a grey linen shirt,
# a rope belt's knot showing low on the front, dirt on the coat. Run: python tools/busts/make_grabarz.py [out.png]
import sys
from kit import *
from patches import patch, smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Grabarz_Bust.png')
b = Bust('SF_People1_7')
S = b.img.shape
LD = (0.55, 0.83)

GREY_HAIR = [(0.0, (36, 36, 40)), (0.15, (78, 76, 80)), (0.35, (128, 126, 128)), (0.55, (168, 166, 166)), (0.75, (196, 194, 192)),
             (0.92, (216, 214, 210))]
CAP = [(0.0, (16, 10, 6)), (0.18, (38, 26, 16)), (0.36, (58, 40, 26)), (0.55, (78, 56, 38)), (0.72, (98, 72, 50)), (0.9, (118, 90, 64))]
COAT = [(0.0, (16, 12, 8)), (0.15, (40, 30, 20)), (0.32, (66, 50, 32)), (0.5, (92, 70, 46)), (0.66, (112, 86, 56)), (0.8, (130, 102, 68)),
        (0.95, (150, 120, 84))]
SHIRT = [(0.0, (34, 34, 36)), (0.3, (88, 88, 90)), (0.55, (128, 128, 128)), (0.75, (156, 156, 154)), (0.9, (176, 176, 172)), (1.0, (190, 190, 186))]

# the knit cap (the olive-grey wool on top of the head): dark brown wool
cap = b.sel(hue=(40, 120), sat=(0.05, 0.6), val=(0.2, 0.9), box=(70, 0, 270, 110))
cap = b.grow(cap, 1, 0.3) & region(S, 70, 0, 270, 110) & ~b.sel(hue=(10, 40), sat=(0.2, 0.7), val=(0.6, 1))
b.ramp(cap, CAP, gain=1.15)
# the hair at the sides: grey
hair = b.sel(sat=(0, 0.22), val=(0.3, 1), box=(160, 60, 240, 165))
hair = b.grow(hair, 1, 0.3) & region(S, 160, 60, 240, 165) & ~b.sel(hue=(15, 45), sat=(0.25, 1), val=(0.6, 1))
b.ramp(hair, GREY_HAIR, gain=1.0)

# the jacket: a long earth-brown work coat; the turtleneck: a grey linen shirt
jacket = b.sel(hue=(25, 75), sat=(0.12, 1), box=(0, 160, 330, 350)) & ~b.sel(hue=(0, 40), val=(0.85, 1), box=(0, 0, 330, 232))
jacket &= ~b.poly([(60, 0), (330, 0), (330, 160), (206, 160), (200, 172), (180, 196), (140, 204), (100, 200), (60, 160)])
jacket = b.grow(jacket, 2, 0.3) & region(S, 0, 160, 330, 350)
b.ramp(jacket, COAT, gain=1.05)
neck_w = b.sel(sat=(0, 0.14), val=(0.6, 1), box=(120, 150, 230, 260))
b.ramp(neck_w, SHIRT, gain=1.0)
# the rope belt's knot low on the front (the coat hangs open over the shirt there)
b.over(strokes(S, [((118, 334), (150, 330), (186, 334), 4.2)], (150, 128, 88), alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((118, 333), (150, 329), (186, 333), 1.4)], (104, 86, 56), alpha=0.9, taper_to=1.0))
b.over(cel(S, [ellipse(152, 333, 6, 4.5)], ((110, 92, 60), (156, 134, 94), (196, 176, 130)), lw=1.0, shade=1.6, light=0.8, ldir=LD))
b.over(strokes(S, [((150, 337), (146, 346), (142, 352), 2.2), ((156, 337), (160, 346), (164, 352), 2.2)], (140, 118, 80), alpha=1.0, taper_to=0.6))
# patches on the coat, dirt (he digs graves)
b.img = patch(b.img, [(62, 286), (92, 280), (96, 312), (66, 318)], jacket, lift=1.2, hue=(32, 0.4), seed=31)
b.img = patch(b.img, [(264, 256), (290, 252), (292, 280), (268, 284)], jacket, lift=0.85, hue=(28, 0.35), seed=32)
b.img = smudge(b.img, [[(40, 330), (70, 322), (96, 336), (60, 348)], [(230, 318), (262, 312), (280, 330), (244, 344)]], (52, 40, 28), 0.35)

# the face: a short grey stubble beard on the jaw and chin, bushy grey brows
skin = b.sel(hue=(10, 45), sat=(0.15, 0.6), val=(0.55, 1), box=(70, 90, 210, 210))
JAW = [(92, 150), (100, 172), (116, 190), (138, 198), (160, 194), (178, 180), (188, 160), (190, 146), (178, 156), (160, 168),
       (138, 172), (116, 168), (102, 158)]
b.over(stubble(S, JAW, (112, 110, 112), density=0.7, seed=5, alpha=1.0, clip=skin))
b.over(stubble(S, JAW, (176, 174, 172), density=0.45, seed=6, alpha=0.95, clip=skin))
LIP = [(108, 160), (120, 156), (136, 154), (152, 156), (162, 162), (150, 162), (136, 160), (120, 162)]
b.over(stubble(S, LIP, (140, 138, 138), density=0.6, seed=7, alpha=0.95, clip=skin))
BROWS = [((128, 102), (140, 97), (152, 99), 4.8), ((138, 104), (150, 99), (160, 103), 4.4), ((102, 106), (94, 102), (84, 105), 4.4)]
brows = cel(S, [taper(bez(r, c, t, 16), w, 0.0, w_mid=w) for r, c, t, w in BROWS], ((110, 108, 108), (168, 166, 164), (200, 198, 196)),
            shade=2, light=1, lw=1.0, ldir=LD)
b.over(brows)
# soil on the cheek
b.img = smudge(b.img, [[(176, 128), (186, 124), (192, 132), (182, 136)]], (90, 70, 52), 0.25)
b.save(OUT)
print('ok', OUT)
