# Ludmila (a refugee from the continent, about 30, tired): SF_Actor3_2 repainted - dark brown hair, the yellow cardigan a worn
# grey-green dress, the black top a dark green-grey, a faded brown woollen shawl over the shoulders, dark rings under the eyes.
# Run: python tools/busts/make_ludmila.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Ludmila_Bust.png')
b = Bust('SF_Actor3_2')
S = b.img.shape

FACE = [(108, 96), (190, 86), (216, 120), (212, 170), (186, 202), (150, 216), (118, 202), (104, 150)]
hair = b.sel(hue=(0, 45), sat=(0.3, 1), box=(0, 0, 330, 350)) & ~b.sel(hue=(45, 70), sat=(0.2, 1))
hair &= ~(b.poly(FACE) & b.sel(sat=(0, 0.42), val=(0.85, 1)))
hair &= ~(b.poly([(94, 62), (128, 44), (172, 46), (214, 78), (222, 112), (98, 112)]) & b.sel(hue=(10, 24), sat=(0, 0.48), val=(0.74, 1)))   # (the forehead)
hair &= ~(b.sel(sat=(0, 0.42), val=(0.85, 1)) & ~b.poly([(0, 0), (330, 0), (330, 92), (0, 92)]))
hair = b.grow(hair, 1, 0.25)
b.ramp(hair, RAMPS['hair_dark'])
cardigan = b.sel(hue=(45, 75), sat=(0.15, 1), box=(40, 180, 330, 350))
cardigan = b.grow(cardigan, 2, 0.3) & region(S, 40, 180, 330, 350) & ~hair
b.ramp(cardigan, [(0.0, (24, 16, 10)), (0.2, (60, 42, 28)), (0.45, (98, 72, 50)), (0.7, (128, 98, 70)), (0.9, (150, 118, 86)),
                  (1.0, (166, 134, 100))])
top = b.sel(hue=(200, 300), sat=(0.05, 1), val=(0, 0.5), box=(100, 200, 260, 350))
b.ramp(top, RAMPS['greygreen'], gain=2.4)
# the buttons: wooden toggles
btn = b.sel(hue=(20, 45), sat=(0.4, 1), val=(0.3, 0.85), box=(150, 230, 230, 350)) & ~hair
b.ramp(btn, RAMPS['wood'], gain=1.2)
# tired: soft dark rings under the eyes
skin = b.sel(hue=(0, 40), sat=(0.05, 0.6), val=(0.6, 1), box=(90, 90, 230, 190))
b.over(blush(S, 132, 128, 13, 4, (130, 90, 110), 0.22, clip=skin))
b.over(blush(S, 186, 124, 11, 4, (130, 90, 110), 0.22, clip=skin))
b.save(OUT)
print('ok', OUT)
