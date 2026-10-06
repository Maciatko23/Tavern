# Kapral Wit Czerwien (the Lord's corporal of the town guard): People3_7 repainted - a steel kettle helmet over the black hair
# (painted), a dark moustache, the red armour his red tabard and its gold plates steel, the Lord's black horse on the chest.
# Run: python tools/busts/make_kapral.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kapral_Bust.png')
b = Bust('People3_7')
S = b.img.shape

gold = b.sel(hue=(10, 62), sat=(0.42, 1), val=(0.3, 0.95), box=(0, 150, 330, 350)) & ~b.sel(hue=(25, 45), sat=(0.3, 0.5), val=(0.8, 1)) | b.sel(hue=(35, 60), sat=(0.15, 0.5), val=(0.85, 1), box=(0, 205, 330, 350))
gold = b.grow(gold, 1, 0.3) & region(S, 0, 150, 330, 350)
b.ramp(gold, RAMPS['steel'], gain=1.0)
red = b.sel(hue=(330, 15), sat=(0.3, 1), box=(0, 160, 330, 350))
b.ramp(red, RAMPS['crimson'], gain=1.25)
gem = b.sel(hue=(230, 300), sat=(0.25, 1), val=(0.25, 1), box=(0, 170, 330, 350))
b.ramp(gem, RAMPS['steel'], gain=0.8)
b.over(horse(S, 236, 276, 0.78))
MOUS = [(132, 167), (144, 160), (157, 158), (170, 160), (179, 166), (174, 170), (160, 166), (148, 167), (138, 172)]
mt = ((14, 10, 10), (34, 26, 26), (64, 54, 54), (8, 6, 6))
ml = cel(S, [MOUS], mt[:3], lw=1.3, shade=2.5, light=1.4)
ml = over(ml, hair_strands(S, erode_cv(ml[..., 3] > 0.5, 1), (156, 190), mt[2], mt[3], n=18, length=(4, 7), seed=2))
b.over(ml)
hat = kettle_hat(S, 158, 92, 82, 70, 124, 22, rot=-4, brim_dy=4)
put_hat(b, hat, shadow=(120, 110, 130), shadow_k=0.55, sdx=2, sdy=10)
b.save(OUT)
print('ok', OUT)
