# Rysiek Sidlo (the poacher of Podgrodzie, about 30, lean and sly): Actor1_3 repainted - spiky dark brown hair, stubble, the
# green hooded vest a ragged moss-green hooded cloak, the gold armour a worn brown leather shoulder guard and bracer, a dark
# leather vest over the chest, the gold pendant a snare-wire ring on a cord. Run: python tools/busts/make_klusownik.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Klusownik_Bust.png')
b = Bust('Actor1_3')
S = b.img.shape

hair = b.sel(hue=(315, 15), sat=(0.25, 1), box=(40, 0, 300, 150))
hair = b.grow(hair, 1, 0.25) & region(S, 40, 0, 300, 150)
b.ramp(hair, RAMPS['hair_dark'], gain=1.1)
cloak = b.sel(hue=(80, 170), sat=(0.15, 1), box=(0, 150, 330, 350))
cloak = b.grow(cloak, 2, 0.3) & region(S, 0, 150, 330, 350)
b.ramp(cloak, RAMPS['moss'], gain=0.95)
ARMOUR = b.poly([(168, 236), (200, 214), (232, 196), (270, 196), (310, 210), (330, 230), (330, 350), (176, 350), (166, 290)],
                [(28, 226), (60, 214), (84, 222), (88, 260), (76, 300), (52, 310), (30, 290)])
gold = ARMOUR & (b.sel(hue=(5, 62), sat=(0.5, 1)) | b.sel(hue=(30, 65), sat=(0.0, 0.5), val=(0.85, 1)) | b.sel(hue=(0, 20), sat=(0.4, 1), val=(0.3, 0.7)))
gold = b.grow(gold, 1, 0.3) & ARMOUR
b.ramp(gold, RAMPS['leather'], gain=1.0)
# the bare chest between the cloak's edges: a dark leather vest
chest = b.sel(hue=(15, 45), sat=(0.25, 0.7), val=(0.45, 1), box=(96, 228, 214, 350))
b.ramp(chest, RAMPS['leather_dark'], gain=1.1)
pend = b.sel(hue=(30, 60), sat=(0.45, 1), val=(0.5, 1), box=(130, 225, 200, 270))
b.ramp(pend, [(0.0, (30, 30, 34)), (0.4, (110, 112, 120)), (0.8, (190, 192, 200))])
b.over(stubble(S, [(112, 150), (140, 168), (170, 172), (196, 160), (204, 140), (196, 178), (166, 196), (134, 190), (114, 172)], (50, 36, 30),
               density=0.3, seed=11, alpha=0.42))
b.save(OUT)
print('ok', OUT)
