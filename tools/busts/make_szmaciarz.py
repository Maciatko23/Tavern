# Jozek Lata (the rag-and-bone man of Podgrodzie, scrawny, about 55): Evil_1 repainted - a battered floppy brown felt hat with
# patches (the soft hat of SF_Actor2_4) over the bandana, whose tails become a faded red rag, greying stubble, a crooked grin
# with yellow teeth, his clay pipe kept, the blue shirt a long patchwork coat of brown, faded red, green and grey scraps, the
# orange scarf a faded rust one. Run: python tools/busts/make_szmaciarz.py [out.png]
import sys
from kit import *
from patches import patch, hole, rip, fray

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Szmaciarz_Bust.png')
b = Bust('Evil_1')
S = b.img.shape

band = b.sel(hue=(100, 180), sat=(0.15, 1), box=(80, 0, 300, 230))
band = b.grow(band, 1, 0.3) & region(S, 80, 0, 300, 230)
b.ramp(band, RAMPS['red_faded'], gain=1.3)
teeth = b.sel(sat=(0, 0.16), val=(0.82, 1), box=(130, 138, 205, 168))
b.ramp(teeth, [(0.0, (60, 50, 30)), (0.6, (196, 178, 120)), (0.85, (226, 210, 150)), (1.0, (236, 224, 172))])
hairs = b.sel(sat=(0, 0.35), val=(0, 0.5), box=(200, 60, 300, 200)) & ~band
b.ramp(hairs, RAMPS['hair_grey'], gain=1.6)
# the coat: brown wool, then scraps sewn on
shirt = b.sel(hue=(190, 240), sat=(0.15, 1), box=(0, 170, 330, 350))
shirt = b.grow(shirt, 2, 0.3) & region(S, 0, 170, 330, 350)
b.ramp(shirt, RAMPS['brown_wool'], gain=1.2)
scarf = b.sel(hue=(5, 45), sat=(0.55, 1), val=(0.45, 1), box=(40, 175, 330, 350)) & ~b.poly([(120, 220), (190, 214), (196, 300), (126, 306)])
scarf = b.grow(scarf, 1, 0.3) & region(S, 40, 175, 330, 350)
b.ramp(scarf, RAMPS['rust'], gain=1.05)
for quad, lift, hue, seed in [([(26, 262), (60, 254), (66, 290), (30, 298)], 1.0, (2, 0.42), 31),
                              ([(250, 286), (284, 280), (290, 318), (254, 324)], 1.05, (100, 0.3), 32),
                              ([(78, 312), (106, 306), (110, 338), (82, 344)], 1.25, (40, 0.08), 33),
                              ([(214, 318), (240, 314), (242, 346), (216, 348)], 0.9, (20, 0.35), 34)]:
    b.img = patch(b.img, quad, shirt, lift=lift, hue=hue, seed=seed)
b.over(stubble(S, [(150, 168), (176, 176), (204, 170), (222, 150), (226, 128), (232, 160), (214, 190), (180, 200), (150, 192), (138, 176)],
               (120, 110, 104), density=0.38, seed=5, alpha=0.5))
# the hat: battered brown felt, floppy, tilted, with a patch and a tear
M = affine(scale=(1.3, 1.18), rot=5, src_pt=(143, 92), dst_pt=(176, 108))
FELT = [(0.0, (22, 16, 12)), (0.2, (54, 40, 28)), (0.38, (84, 64, 44)), (0.55, (110, 86, 60)), (0.72, (132, 106, 78)), (0.88, (156, 130, 100))]
hat = bucket_hat(M, S, FELT, gain=1.0, flatten=4.0)
ha = hat[..., 3] > 0.5
hat = patch(hat, [(200, 30), (230, 36), (228, 60), (198, 56)], ha, lift=0.75, hue=(90, 0.22), seed=41)
put_hat(b, hat, shadow=(140, 110, 100), shadow_k=0.5, sdx=2, sdy=9)
b.save(OUT)
print('ok', OUT)
