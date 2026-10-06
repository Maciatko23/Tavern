# Straznik dworu (a guard of Lord Zaleski's manor, about 30, clean-shaven): People3_8 repainted - a steel kettle helmet
# (painted) instead of the turban (what of it shows under the brim is his short brown hair), the blue and gold cloth a red
# tabard with the Lord's black horse, the mail and plates kept. Run: python tools/busts/make_straznik.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Straznik_Bust.png')
b = Bust('People3_8')
S = b.img.shape

FACE = [(112, 112), (190, 100), (214, 120), (210, 170), (186, 200), (150, 206), (122, 190), (110, 150)]
head = b.poly([(40, 0), (300, 0), (300, 170), (40, 170)]) & ~b.poly(FACE)
turban = head & (b.sel(hue=(190, 250), sat=(0.15, 1)) | b.sel(sat=(0, 0.15), val=(0.6, 1)) | b.sel(hue=(30, 70), sat=(0.3, 1)))
turban = b.grow(turban, 1, 0.3) & head
b.ramp(turban, RAMPS['hair_dark'], gain=0.75)
hairf = b.sel(hue=(190, 250), sat=(0.15, 1), val=(0, 0.8), poly=FACE)
b.ramp(hairf, RAMPS['hair_dark'], gain=0.9)
cloth = b.sel(hue=(215, 260), sat=(0.35, 1), box=(0, 170, 330, 350))
cloth = b.grow(cloth, 2, 0.3) & region(S, 0, 170, 330, 350)
b.ramp(cloth, RAMPS['crimson'], gain=1.5)
scarf = b.sel(hue=(15, 60), sat=(0.4, 1), box=(0, 170, 330, 350))
b.ramp(scarf, [(0.0, (30, 4, 10)), (0.3, (86, 14, 24)), (0.5, (126, 24, 36)), (0.7, (160, 40, 48)), (0.9, (196, 76, 76))])
b.over(horse(S, 150, 292, 0.8))
hat = kettle_hat(S, 164, 86, 86, 70, 126, 22, rot=-2, brim_dy=4)
put_hat(b, hat, shadow=(120, 110, 130), shadow_k=0.55, sdx=2, sdy=10)
b.save(OUT)
print('ok', OUT)
