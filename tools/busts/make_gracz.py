# Lucjan Kosc (the travelling dice sharper, lean, about 40): People3_6 (his face in the dice game) repainted - slicked-back
# black hair, a thin black pencil moustache, a battered black wide-brimmed felt hat with a long drooping off-white feather
# (the soft hat of SF_Actor2_4, widened), the black coat a faded wine-red doublet with tarnished brass trims, the blue cravat
# an off-white one gone grey with wear. Run: python tools/busts/make_gracz.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Gracz_Bust.png')
b = Bust('People3_6')
S = b.img.shape

FACE = [(100, 92), (190, 92), (214, 120), (210, 170), (184, 204), (150, 214), (118, 196), (104, 150)]
hair = b.sel(hue=(10, 45), sat=(0.3, 1), val=(0, 0.85), box=(50, 0, 290, 200)) & ~b.poly(FACE)
hair |= b.sel(hue=(10, 45), sat=(0.3, 1), val=(0, 0.85), box=(90, 0, 240, 100))
b.ramp(hair, RAMPS['hair_black'], gain=1.0)
must = b.sel(hue=(10, 45), sat=(0.3, 1), val=(0, 0.85), box=(120, 150, 210, 185))
b.ramp(must, RAMPS['hair_black'], gain=0.9)
coat = b.sel(hue=(200, 280), sat=(0.0, 0.6), val=(0, 0.6), box=(0, 180, 330, 350)) & ~b.sel(hue=(200, 240), sat=(0.6, 1))
b.ramp(coat, RAMPS['wine'], gain=2.0, bias=0.04)
crav = b.sel(hue=(195, 240), sat=(0.6, 1), box=(80, 180, 260, 350))
crav = b.grow(crav, 2, 0.3) & region(S, 80, 180, 260, 350)
b.ramp(crav, [(0.0, (34, 32, 30)), (0.1, (88, 84, 78)), (0.25, (150, 144, 134)), (0.4, (196, 190, 178)), (0.55, (222, 216, 204))], gain=1.0)
trim = b.sel(hue=(25, 60), sat=(0.35, 1), val=(0.4, 1), box=(0, 190, 330, 350))
b.ramp(trim, [(0.0, (40, 30, 14)), (0.3, (96, 74, 34)), (0.6, (150, 120, 60)), (0.9, (190, 160, 96))])
# the hat: black felt, wide, tilted a little; a long off-white feather from its band, drooping back
M = affine(scale=(1.46, 1.08), rot=-3, src_pt=(143, 92), dst_pt=(156, 96))
BLACK_HAT = [(0.0, (8, 8, 10)), (0.2, (20, 20, 24)), (0.38, (34, 34, 40)), (0.55, (50, 50, 58)), (0.72, (68, 68, 78)), (0.88, (90, 90, 100))]
hat = bucket_hat(M, S, BLACK_HAT, gain=1.0, band=((40, 16, 20), (70, 28, 34), (100, 46, 52)))
hat = over(hat, feather(S, [(208, 68), (268, 26), (318, 92)], width=15.0, seed=3))
put_hat(b, hat, shadow=(130, 110, 110), shadow_k=0.55, sdx=2, sdy=9)
b.save(OUT)
print('ok', OUT)
