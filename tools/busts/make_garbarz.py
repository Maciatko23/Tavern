# Ignac (the tanner and shoemaker, tall and thin): Actor2_8 repainted - brown hair under a brown leather flat cap (the newsboy
# cap of SF_Actor3_6 recoloured to two leathers), the green cloak an olive linen shirt and collar, the beige tunic his leather
# apron. Run: python tools/busts/make_garbarz.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Garbarz_Bust.png')
b = Bust('Actor2_8')
S = b.img.shape

hair = b.sel(hue=(10, 60), sat=(0.05, 0.45), val=(0, 0.9), box=(70, 10, 270, 190)) & ~b.sel(sat=(0, 0.3), val=(0.9, 1)) \
    & ~b.poly([(120, 118), (220, 108), (226, 190), (120, 196)])
b.ramp(hair, RAMPS['hair_dark'], gain=1.25)
cloak = b.sel(hue=(120, 200), sat=(0.15, 1), box=(0, 150, 330, 350))
cloak = b.grow(cloak, 2, 0.3) & region(S, 0, 150, 330, 350)
b.ramp(cloak, RAMPS['olive'], gain=1.35)
tunic = b.sel(hue=(20, 50), sat=(0.15, 0.5), val=(0.45, 1), box=(40, 200, 330, 350))
b.ramp(tunic, RAMPS['leather'], gain=1.0)

# the cap
CAP = [(64, 113), (80, 94), (90, 80), (92, 52), (120, 30), (155, 21), (205, 26), (240, 40), (258, 62), (264, 100), (244, 122),
       (190, 124), (150, 114), (120, 102), (100, 108), (80, 114)]


def cap_mask(d):
    m = d.poly(CAP) & d.op() & ~d.sel(hue=(12, 40), sat=(0.2, 0.65), val=(0, 0.75))
    return erode_cv(dilate_cv(m, 1), 1)


def two_leathers(d, m):
    red = m & d.sel(hue=(330, 25), sat=(0.35, 1))
    d.ramp(m & ~red, [(0.0, (26, 16, 10)), (0.2, (66, 42, 24)), (0.5, (126, 88, 52)), (0.75, (160, 118, 74)), (0.95, (196, 158, 110))])
    d.ramp(red, [(0.0, (22, 12, 8)), (0.2, (48, 28, 16)), (0.35, (74, 44, 24)), (0.55, (102, 64, 36)), (0.75, (132, 88, 52)),
                 (0.95, (166, 120, 78))])


d = Bust('SF_Actor3_6')
m = cap_mask(d)
two_leathers(d, m)
M = affine(scale=(1.06, 1.02), rot=-3, src_pt=(160, 115), dst_pt=(166, 90))
cap = warp(take(d.img, m), M, S)
put_hat(b, cap, shadow=(150, 120, 120), shadow_k=0.5, sdx=2, sdy=8)
b.save(OUT)
print('ok', OUT)
