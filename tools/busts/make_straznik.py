# Straznik dworu (a guard of Lord Zaleski's manor, about 30, clean-shaven): People3_8 repainted - a steel kettle helmet
# (painted) instead of the turban, under it his short brown hair (painted, the fringe recoloured); below the head everything
# new, as on the map and like the corporal's (make_kapral.guard_body): a mail shirt on the shoulders and arms, a mail collar
# round the neck and a tippet over the shoulders, a sleeveless red cloth tabard with the Lord's black horse.
# Run: python tools/busts/make_straznik.py [out.png]
import sys
from kit import *
from make_kapral import guard_body, LDIR, SHIRT, TABARD, TAB_SHADE, FOLDS, HORSE_AT, TIPPET_HEM

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Straznik_Bust.png')
b = Bust('People3_8')
S = b.img.shape
HAIR_T = ((80, 50, 34), (112, 76, 52), (144, 102, 70), (60, 38, 26))    # short brown hair (the map's (105, 70, 49))

# the blue fringe and sideburn brown
FACE = [(112, 112), (190, 100), (214, 120), (210, 170), (186, 200), (150, 206), (122, 190), (110, 150)]
hairf = b.sel(hue=(190, 250), sat=(0.15, 1), val=(0, 0.8), poly=FACE)
b.ramp(hairf, RAMPS['hair_dark'], gain=0.9)
# the head that stays: the face, the fringe, the ear (not the turban round them, not the neck: the collar covers it)
KEEP = b.poly([(102, 60), (205, 60), (208, 100), (213, 117), (221, 123), (226, 136), (223, 151), (214, 158), (206, 163), (200, 168),
               (191, 177), (181, 187), (171, 197), (161, 204), (150, 203), (136, 191), (118, 168), (108, 151), (103, 132), (102, 112)])
turban = b.sel(hue=(200, 250), sat=(0.5, 1), val=(0.2, 1)) | b.sel(hue=(30, 60), sat=(0.4, 1)) \
    | b.sel(sat=(0, 0.13), val=(0.5, 0.93), box=(195, 60, 260, 130))
keep_px = KEEP & ~(turban & ~hairf)
# short brown hair under the helmet: at the temple beside the cheek, behind the ear down to the nape
RIGHT = strand_edge([(248, 98), (250, 120), (246, 144), (237, 164)], side=1, seg=9, tip=4, out=2.0, seed=3)
NAPE = strand_edge([(237, 164), (224, 166), (212, 158)], side=1, seg=8, tip=4, out=2.0, seed=4)
TEMPLE = strand_edge([(106, 148), (98, 132), (94, 112), (92, 100)], side=1, seg=8, tip=4, out=2.0, seed=5)
HAIR = [(92, 96), (248, 92)] + RIGHT + NAPE[1:] + [(110, 150)] + TEMPLE
hl = cel(S, [HAIR], HAIR_T[:3], lw=1.8, shade=7, light=2.5, ldir=LDIR)
hl = over(hl, hair_strands(S, erode_cv(hl[..., 3] > 0.5, 2), (236, 190), HAIR_T[2], HAIR_T[3], n=16, length=(6, 10), seed=3))
head = over(hl, take(b.img, keep_px))
b.img = head
TIPPET = [(0, 244), (36, 228), (78, 214), (112, 206), (232, 198), (266, 206), (300, 220), (330, 232)] + TIPPET_HEM
COLLAR = [(118, 150), (220, 142), (228, 160), (234, 186), (240, 206), (236, 216), (204, 226), (166, 230), (128, 226), (108, 218),
          (104, 206), (108, 186), (112, 168)]
TIPPET_SHADE = [[(250, 206), (330, 234), (330, 270), (260, 250), (240, 222)]]
COLLAR_SHADE = [[(214, 140), (240, 140), (240, 214), (222, 218)]]
guard_body(b, b.op(), SHIRT, TABARD, TAB_SHADE, FOLDS, HORSE_AT,
           [dict(poly=TIPPET, sag=lambda x: -0.0008 * (x - 160) ** 2, shade=TIPPET_SHADE),
            dict(poly=COLLAR, sag=lambda x: -0.0018 * (x - 168) ** 2, shade=COLLAR_SHADE), 'HEAD'], chin=(150, 2, 9))
hat = kettle_hat(S, 164, 86, 86, 70, 126, 22, rot=-2, brim_dy=4)
put_hat(b, hat, shadow=(120, 110, 130), shadow_k=0.55, sdx=2, sdy=10)
b.save(OUT)
print('ok', OUT)
