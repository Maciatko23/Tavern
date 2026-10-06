# Zosia (a town girl, about 7): People1_2 repainted - blonde hair in two tails, the yellow top a faded red linen dress, the
# blue beads wooden. Run: python tools/busts/make_zosia.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Zosia_Bust.png')
b = Bust('People1_2')
S = b.img.shape

CLOTHES = b.poly([(95, 205), (240, 205), (240, 350), (95, 350)])
hair = b.sel(hue=(5, 50), sat=(0.1, 0.7), val=(0, 0.86), box=(40, 20, 330, 270)) & ~CLOTHES
hair = b.grow(hair, 1, 0.25) & region(S, 40, 20, 330, 270) & ~CLOTHES
b.ramp(hair, RAMPS['hair_blonde'])
top = b.sel(hue=(30, 70), sat=(0.15, 1), val=(0.5, 1), box=(40, 205, 330, 350))
top = b.grow(top, 2, 0.3) & region(S, 40, 205, 330, 350)
b.ramp(top, RAMPS['red_faded'], gain=0.95)
beads = b.sel(hue=(190, 250), sat=(0.3, 1), box=(130, 300, 220, 350))
b.ramp(beads, RAMPS['wood'], gain=1.3)
b.save(OUT)
print('ok', OUT)
