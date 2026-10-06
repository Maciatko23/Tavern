# Franek (the washerwoman's son, about 8): SF_People1_1 repainted - messy chestnut hair, the blue shirt a far too big faded
# mustard linen tunic, the long sleeves off-white, a smudge of dirt on the cheek. Run: python tools/busts/make_franek.py [out.png]
import sys
from kit import *
from patches import smudge, patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Franek_Bust.png')
b = Bust('SF_People1_1')
S = b.img.shape

FACE = [(98, 104), (160, 92), (212, 110), (216, 160), (196, 192), (156, 206), (120, 196), (100, 160)]
hair = b.sel(hue=(190, 270), sat=(0.08, 1), val=(0, 0.7), box=(60, 20, 270, 190))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 20, 270, 190)
b.ramp(hair, RAMPS['hair_chestnut'], gain=1.25)
shirt = b.sel(hue=(185, 250), sat=(0.15, 1), box=(40, 200, 330, 350))
shirt = b.grow(shirt, 2, 0.3) & region(S, 40, 200, 330, 350)
b.ramp(shirt, RAMPS['mustard'], gain=1.05)
sleeves = b.sel(sat=(0, 0.15), val=(0.5, 1), box=(40, 260, 330, 350))
b.ramp(sleeves, RAMPS['linen_dirty'])
b.img = patch(b.img, [(214, 300), (240, 296), (244, 322), (218, 326)], shirt, lift=0.85, hue=(28, 0.42), seed=9)
b.img = smudge(b.img, [[(176, 160), (186, 156), (196, 159), (195, 166), (184, 168)]], DIRT, 0.3)
b.save(OUT)
print('ok', OUT)
