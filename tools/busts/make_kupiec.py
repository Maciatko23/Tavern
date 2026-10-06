# Baltazar Vey (a merchant from the continent): People4_3 repainted - black hair, a darker sun-browned skin, a short black goatee
# and moustache (painted), the blue coat green velvet (its gold trims kept), the lace jabot kept, a burgundy velvet beret (the
# beret of SF_Actor1_6) with a red feather. Run: python tools/busts/make_kupiec.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kupiec_Bust.png')
b = Bust('People4_3')
S = b.img.shape

hair = b.sel(hue=(35, 72), sat=(0.06, 1), box=(60, 0, 280, 200)) & ~b.sel(hue=(55, 70), sat=(0.15, 0.35), val=(0.95, 1), box=(150, 220, 250, 260))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 0, 280, 200)
b.ramp(hair, RAMPS['hair_black'], gain=0.62)
skin = b.sel(hue=(0, 45), sat=(0.03, 0.7), val=(0.35, 1), box=(60, 30, 280, 240)) & ~hair
b.multiply(skin, (224, 186, 152), 1.0)
coat = b.sel(hue=(210, 250), sat=(0.3, 1), box=(0, 170, 330, 350))
coat = b.grow(coat, 2, 0.3) & region(S, 0, 170, 330, 350)
b.ramp(coat, RAMPS['green_velvet'], gain=1.3)
# the goatee and the moustache
GOAT = [(103, 150), (116, 148), (127, 153), (129, 163), (121, 172), (109, 171), (103, 162)]
MOUS = [(99, 138), (109, 134), (123, 134), (133, 138), (129, 142), (117, 140), (105, 142)]
TONES = ((14, 12, 12), (30, 26, 26), (60, 54, 54), (8, 8, 8))
g = cel(S, [GOAT, MOUS], TONES[:3], lw=1.4, shade=3, light=1.5)
g = over(g, hair_strands(S, erode_cv(g[..., 3] > 0.5, 1), (116, 200), TONES[2], TONES[3], n=24, length=(4, 8), seed=2))
b.over(g)
# the beret: burgundy velvet, a red feather tucked in at its side
d = Bust('SF_Actor1_6')
core = d.sel(hue=(308, 355), sat=(0.3, 1), box=(70, 20, 250, 125))
core = erode_cv(dilate_cv(core, 2), 2)
n, lab, st, _ = cv2.connectedComponentsWithStats(core.astype(np.uint8), connectivity=8)
core = lab == (1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])))   # (the beret alone, no flecks)
core = fill_holes(core)
m = core | (d.lines_of(core, 2, 0.35) & region(d.img.shape, 70, 20, 250, 125))
d.ramp(m, RAMPS['burgundy'], gain=1.2)
M = affine(scale=(1.1, 1.06), rot=8, src_pt=(160, 112), dst_pt=(190, 82))
beret = warp(take(d.img, m), M, S)
beret = over(beret, feather(S, [(244, 66), (276, 40), (306, 40)], tones=((110, 20, 24), (196, 44, 44), (240, 110, 96)), width=11.0, seed=5))
put_hat(b, beret, shadow=(140, 110, 110), shadow_k=0.5, sdx=2, sdy=8)
b.save(OUT)
print('ok', OUT)
