# Szymek (a young pickpocket from the refugee camp, about 13): People2_3 repainted - a rust-brown hood UP over the head (the
# hood of Actor3_5 cut out, recoloured rust brown, its trim a plain rolled hem, a sewn-on patch, set over this head with a dark
# lining inside), dark brown hair under it, the purple caped collar a far too big faded rust-brown wool tunic, the gold trims
# dull brown, the jewel a plain wooden toggle. Run: python tools/busts/make_zlodziej.py [out.png]
import sys
from kit import *
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Zlodziej_Bust.png')
b = Bust('People2_3')
S = b.img.shape

# ---- the hood: Actor3_5's hood (shell + trim, without what is inside it), widened to this round head ----
HOOD_OPEN = [(196, 240), (64, 234), (64, 212), (66, 190), (68, 170), (73, 150), (77.5, 130), (81.7, 110), (85, 100), (90, 92), (100, 87), (120, 85),
             (130, 92), (140, 99), (150, 110), (160, 120), (170, 127.5), (180, 136), (190, 143), (200, 151.5), (207, 162), (209, 178),
             (207, 193), (203, 210), (198, 224), (196, 240)]
HOOD_OUT = [(30, 0), (300, 0), (300, 150), (246, 180), (240, 192), (226, 204), (212, 216), (198, 234), (60, 234), (57, 200), (30, 200)]
RUST_HOOD = [(0.0, (24, 12, 8)), (0.08, (46, 22, 12)), (0.14, (72, 34, 18)), (0.2, (102, 50, 26)), (0.26, (122, 62, 32)),
             (0.4, (134, 70, 38)), (0.6, (128, 64, 34)), (0.8, (146, 78, 44)), (1.0, (172, 104, 64))]


def hood_mask(d):
    return d.op() & d.poly(HOOD_OUT) & ~d.poly(HOOD_OPEN)


M = affine(scale=(1.1, 1.02), rot=2.5, src_pt=(135.5, 129.75), dst_pt=(158, 136))
hood = hat_from('Actor3_5', hood_mask, M, S, RUST_HOOD)
# a dark line along the hood's cut lower ends (where it was cut off the donor's coat)
ends = (poly_mask((S[1], S[0]), tr_pts(M, [(188, 202), (250, 172), (310, 172), (310, 245), (188, 245)])) > 0.5) | \
    (poly_mask((S[1], S[0]), tr_pts(M, [(25, 200), (80, 200), (80, 245), (25, 245)])) > 0.5)
hem = (hood[..., 3] > 0.05) & ~erode_cv(hood[..., 3] > 0.5, 2) & ends
hood[..., :3] = np.where(hem[..., None], np.asarray(LINE, np.float32) / 255.0, hood[..., :3])
ha = hood[..., 3] > 0.5
openm = (poly_mask((S[1], S[0]), tr_pts(M, HOOD_OPEN)) > 0.5) & ~ha

# ---- recolouring ----
FACE = [(102, 104), (204, 104), (208, 160), (155, 202), (102, 160)]
hair = b.sel(hue=(240, 340), sat=(0.05, 1), val=(0, 0.95), box=(60, 20, 270, 190)) | (b.sel(sat=(0, 0.12), val=(0.75, 1), box=(60, 20, 270, 108)) & ~b.poly(FACE))
hair |= b.sel(hue=(170, 240), sat=(0.1, 1), box=(60, 20, 270, 175)) & ~b.poly(FACE)    # (the blue rim lights in the hair)
hair |= b.sel(hue=(190, 270), sat=(0.25, 1), polys=[[(96, 140), (111, 140), (111, 164), (96, 164)], [(186, 160), (218, 160), (218, 192), (186, 192)]])
hair = b.grow(hair, 1, 0.25) & region(S, 60, 20, 270, 190)
b.ramp(hair, [(0.0, (16, 10, 8)), (0.15, (36, 22, 16)), (0.3, (56, 36, 24)), (0.45, (72, 48, 32)), (0.6, (86, 60, 40)),
              (0.8, (100, 72, 50))])
cape = b.sel(hue=(220, 290), sat=(0.15, 1), box=(0, 180, 330, 350)) | b.sel(hue=(140, 220), sat=(0.1, 1), polys=[[(0, 225), (120, 225), (120, 350), (0, 350)], [(222, 290), (246, 290), (246, 315), (222, 315)]])
cape = b.grow(cape, 2, 0.3) & region(S, 0, 180, 330, 350)
b.ramp(cape, RAMPS['rust'], gain=1.15)
gold = b.sel(hue=(20, 60), sat=(0.4, 1), box=(0, 180, 330, 350))
b.ramp(gold, RAMPS['brown_wool'], gain=0.85)
jewel = b.sel(hue=(170, 220), sat=(0.3, 1), box=(80, 200, 260, 350))
b.ramp(jewel, RAMPS['wood'], gain=1.2)
dark = b.sel(lum=(0, 0.2), box=(0, 190, 330, 350)) & ~cape
b.ramp(dark, [(0.0, (14, 8, 6)), (0.1, (32, 18, 12)), (0.2, (52, 30, 20))])
b.img = patch(b.img, [(64, 300), (86, 294), (92, 318), (68, 324)], cape, lift=0.78, hue=(24, 0.32), seed=21)

# ---- what of the head stands out of the hood goes; inside it only the face and the hair round it stay ----
HEAD = b.poly([(0, 0), (330, 0), (330, 190), (0, 190)])
b.erase(HEAD & ~ha & ~openm)
FACE_HAIR = [(90, 100), (150, 92), (210, 100), (222, 150), (212, 200), (150, 210), (96, 180), (88, 140)]
b.erase(openm & hair & ~b.poly(FACE_HAIR))

# ---- the dark lining behind the face, the shadow of the hood's rim, then the hood with a patch ----
LINING = ((22, 12, 8), (38, 22, 14), (54, 32, 20))
lin = cel(S, [tr_pts(M, HOOD_OPEN)], LINING, outline=False, shade=12, light=0, ldir=(0.55, -0.83))
lin[..., 3] *= openm
b.img = over(lin, b.img)
cast_shadow(b, hood[..., 3], dx=3, dy=8, col=(110, 80, 90), k=0.5)
b.over(hood)
b.img = patch(b.img, [(236, 74), (258, 82), (254, 106), (232, 100)], erode_cv(ha, 2), lift=1.08, hue=(30, 0.4), seed=22)
b.save(OUT)
print('ok', OUT)
