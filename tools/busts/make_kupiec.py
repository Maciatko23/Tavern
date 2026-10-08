# Baltazar Vey (a merchant from the continent): People4_3 repainted - as on the map: black hair, a dark sun-browned skin
# (a ramp over the original's light steps), a full short black beard and moustache (painted), the blue coat green velvet (its
# gold trims kept), the lace jabot kept, a burgundy felt hat with a wide brim (the soft hat of SF_Actor2_4, widened) and a red
# feather with a red rosette at its side. Run: python tools/busts/make_kupiec.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kupiec_Bust.png')
b = Bust('People4_3')
S = b.img.shape
LDIR = (0.55, 0.83)     # cel(): the shade band down-right, the light band up-left (light from the upper left, as in RTP)

FACEP = [(60, 30), (190, 30), (186, 104), (200, 102), (214, 110), (217, 140), (216, 156), (228, 162), (228, 190), (150, 199),
         (60, 201)]
hair = b.sel(hue=(35, 72), sat=(0.06, 1), box=(60, 0, 280, 168))
hair |= b.sel(hue=(10, 72), sat=(0.06, 1), box=(60, 0, 280, 168)) & ~b.poly(FACEP)
hair |= b.sel(sat=(0, 0.1), val=(0.85, 1), box=(180, 60, 280, 168))       # (the white rim light between the ear and the hair)
hair |= b.sel(hue=(35, 72), sat=(0.06, 1), box=(190, 160, 212, 176))     # (the strand tips over the neck)
hair = b.grow(hair, 1, 0.25) & (region(S, 60, 0, 280, 168) | region(S, 190, 160, 212, 176))
b.ramp(hair, RAMPS['hair_black'], gain=0.5)
# the skin: dark, sun-browned (the map's (176, 119, 75)) - the original's light steps through a brown ramp
skin = b.sel(hue=(335, 45), sat=(0.03, 0.7), val=(0.35, 1), poly=FACEP) & ~hair
SKIN = [(0.0, (34, 18, 12)), (0.3, (86, 46, 30)), (0.55, (128, 74, 50)), (0.66, (148, 88, 60)), (0.8, (184, 124, 82)),
        (0.86, (204, 144, 96)), (0.92, (220, 162, 112)), (1.0, (236, 192, 144))]
b.ramp(skin, SKIN)
coat = b.sel(hue=(210, 250), sat=(0.45, 1), box=(0, 170, 330, 350))   # (not the pale blue shirt collar)
coat = b.grow(coat, 2, 0.3) & region(S, 0, 170, 330, 350)
b.ramp(coat, RAMPS['green_velvet'], gain=1.3)
# the beard: full and short, black, along the jaw from the sideburn to the chin; the moustache over the lip
OUTER = [(186, 106), (189, 124), (187, 140), (183, 151), (175, 159), (160, 166), (144, 173), (130, 178), (116, 180), (105, 178),
         (99, 170), (98, 160), (100, 150)]
INNER = [(105, 149), (114, 152), (126, 152), (138, 150), (150, 152), (162, 148), (171, 138), (177, 124), (180, 106)]
MOUS = [(96, 134), (104, 129), (116, 130), (128, 134), (138, 139), (143, 146), (134, 146), (122, 142), (110, 141), (100, 142)]
TONES = ((14, 12, 14), (32, 30, 34), (74, 72, 80), (8, 8, 10))
b.over(beard2(S, OUTER, INNER, TONES, flow=(140, 200), mous=MOUS, mous_flow=(124, 160), seed=6, n=70, tip=3.5, out=1.8, seg=8))
# the hat: burgundy felt, wide, tilted back with the raised head; a red feather and a red rosette at its side
M = affine(scale=(1.32, 1.1), rot=10, src_pt=(146, 46), dst_pt=(180, 60))
BURGUNDY_HAT = [(0.0, (20, 4, 10)), (0.2, (50, 8, 22)), (0.38, (78, 14, 32)), (0.55, (104, 28, 50)), (0.72, (128, 42, 64)),
                (0.88, (156, 66, 86))]
hat = bucket_hat(M, S, BURGUNDY_HAT, gain=1.0, band=((40, 6, 18), (62, 10, 26), (86, 22, 40)))
RED = ((110, 20, 24), (190, 42, 46), (236, 104, 92))
fx, fy = tr_pts(M, [(204, 46)])[0]
hat = over(hat, feather(S, [(fx, fy), (fx + 34, fy - 34), (fx + 66, fy - 30)], tones=RED, width=13.0, seed=5))
# the rosette: a round red flower of folded ribbon (rings of petals round a dark heart)
ros = cel(S, [ellipse(fx, fy, 13, 12)], RED, lw=1.6, shade=4, light=2, ldir=LDIR)
ros = over(ros, strokes(S, [((fx + 9 * np.cos(a), fy + 8 * np.sin(a)), (fx + 5 * np.cos(a + 0.3), fy + 5 * np.sin(a + 0.3)),
                             (fx + 2 * np.cos(a), fy + 2 * np.sin(a)), 1.2) for a in np.linspace(0, 2 * np.pi, 7, endpoint=False)],
                        RED[0], alpha=0.8, clip=ros[..., 3] > 0.5))
ros = over(ros, cel(S, [ellipse(fx - 1, fy - 1, 4, 3.6)], ((70, 10, 16), (120, 22, 28), (170, 50, 50)), lw=1.0, shade=1.5, light=1,
                    ldir=LDIR))
hat = over(hat, ros)
put_hat(b, hat, shadow=(140, 110, 110), shadow_k=0.5, sdx=2, sdy=8)
b.save(OUT)
print('ok', OUT)
