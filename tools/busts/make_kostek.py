# Kostek (Halina's son, about 8, the new town's Map008 - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22): People1_3 repainted to his
# map sheet ($Npc_Kostek) - messy BLACK hair with a few tufts sticking up, brown eyes, dirt on the cheek; the blue coat and the cream
# shirt one too-big FADED BLUE linen tunic (the shirt part a lighter, greyer blue), patched, the laces a brown cord.
# 0 PixelLab generations. Run: python tools/busts/make_kostek.py [out.png]
import sys
from kit import *
from patches import patch, smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kostek_Bust.png')
b = Bust('People1_3')
S = b.img.shape
LD = (0.55, 0.83)
op = b.op()

EYES = [(96, 98), (192, 94), (192, 128), (96, 132)]
skin = b.sel(hue=(0, 32), sat=(0.08, 0.7), val=(0.5, 1))

# ---------- hair: black, messy ----------
hair = b.sel(hue=(195, 260), sat=(0.2, 1), box=(50, 0, 260, 190)) & ~b.poly(EYES)
hair = b.grow(hair, 2, 0.3) & region(S, 50, 0, 260, 190) & ~b.poly(EYES) & ~skin
b.ramp(hair, RAMPS['hair_black'], gain=1.25)
iris = b.sel(hue=(190, 250), sat=(0.2, 1), poly=EYES)
b.ramp(iris, [(0.0, (22, 12, 6)), (0.3, (62, 34, 16)), (0.6, (110, 66, 32)), (0.9, (164, 116, 66))])
# dirt on the cheek and the nose, a scratch
b.over(blush(S, 182, 146, 9, 5, (150, 104, 80), 0.3))    # (dirt on the cheek)
b.over(strokes(S, [((176, 120), (180, 126), (186, 128), 1.2)], (190, 100, 90), alpha=0.7))

# ---------- the tunic: faded blue (the coat), a lighter grey-blue (the shirt and the sleeves) ----------
coat = b.sel(hue=(195, 255), sat=(0.25, 1), box=(10, 150, 330, 350))
coat = b.grow(coat, 2, 0.3) & region(S, 10, 150, 330, 350) & ~skin
BLUE = [(0.0, LINE), (0.18, (36, 46, 62)), (0.32, (58, 74, 96)), (0.46, (80, 98, 120)), (0.6, (100, 118, 140)), (0.75, (120, 138, 158)),
        (0.9, (140, 156, 174))]
b.ramp(coat, BLUE, gain=1.15)
shirt = b.sel(hue=(30, 65), sat=(0.1, 0.7), val=(0.45, 1), box=(40, 190, 330, 350)) & ~skin
shirt = b.grow(shirt, 1, 0.3) & region(S, 40, 190, 330, 350) & ~skin & ~coat
LIGHT = [(0.0, LINE), (0.3, (70, 82, 96)), (0.5, (104, 118, 132)), (0.66, (130, 144, 156)), (0.8, (152, 164, 174)), (0.92, (172, 182, 190))]
b.ramp(shirt, LIGHT)
lace = b.sel(hue=(0, 40), sat=(0.3, 1), val=(0.1, 0.6), box=(130, 230, 200, 320)) & ~skin
b.ramp(lace, RAMPS['leather'], gain=1.2)
inner = erode_cv(op, 2)
b.img = patch(b.img, [(232, 236), (258, 232), (262, 258), (236, 262)], coat & inner, lift=0.85, hue=(30, 0.35), seed=71)
b.img = patch(b.img, [(50, 268), (70, 264), (74, 286), (54, 290)], coat & inner, lift=1.15, hue=(210, 0.15), seed=72)
b.img = smudge(b.img, [[(120, 300), (150, 296), (160, 320), (126, 326)]], (110, 96, 80), 0.25)
b.save(OUT)
print('ok', OUT)
