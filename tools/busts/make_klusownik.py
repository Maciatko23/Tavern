# Rysiek Sidlo (the poacher of Podgrodzie, about 30, lean and sly): Actor1_3 repainted - the moss-green hood UP over the head
# (the hood of Actor3_5 cut out, recoloured dark green and set over this head, a dark lining inside it), the spiky hair cut
# down to dark brown hair under the hood, stubble, the green hooded vest a moss-green cloak with wooden toggles, the bare
# chest and shoulders a brown leather tunic (painted) with a bow strap across and a snare-wire ring on a cord, the bare arms
# brown sleeves, the gold armour a worn leather shoulder guard and bracer, a bow on the back.
# Run: python tools/busts/make_klusownik.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Klusownik_Bust.png')
b = Bust('Actor1_3')
S = b.img.shape

# ---- the hood up: Actor3_5's hood (its shell and trim, without what is inside it) moved onto this head ----
HOOD_OPEN = [(196, 240), (64, 212), (66, 190), (68, 170), (73, 150), (77.5, 130), (81.7, 110), (85, 100), (90, 92), (100, 87), (120, 85),
             (130, 92), (140, 99), (150, 110), (160, 120), (170, 127.5), (180, 136), (190, 143), (200, 151.5), (207, 162), (209, 178),
             (207, 193), (203, 210), (198, 224), (196, 240)]
HOOD_OUT = [(30, 0), (300, 0), (300, 150), (246, 180), (240, 192), (226, 204), (212, 216), (198, 230), (76, 230), (76, 212), (30, 212)]
GREEN_HOOD = [(0.0, (14, 18, 10)), (0.08, (24, 32, 18)), (0.14, (36, 48, 28)), (0.2, (54, 70, 40)), (0.26, (66, 84, 48)),
              (0.4, (76, 94, 54)), (0.6, (82, 100, 58)), (0.8, (94, 112, 66)), (1.0, (116, 132, 86))]


def hood_mask(d):
    return d.op() & d.poly(HOOD_OUT) & ~d.poly(HOOD_OPEN)


M = affine(scale=(1.19, 1.05), rot=0.0, src_pt=(135.5, 129.75), dst_pt=(134, 140.8))
hood = hat_from('Actor3_5', hood_mask, M, S, GREEN_HOOD)
# a dark line along the hood's cut lower ends (where it was cut off the donor's coat)
ends = (poly_mask((S[1], S[0]), tr_pts(M, [(188, 202), (250, 172), (310, 172), (310, 245), (188, 245)])) > 0.5) | \
    (poly_mask((S[1], S[0]), tr_pts(M, [(25, 200), (80, 200), (80, 245), (25, 245)])) > 0.5)
hem = (hood[..., 3] > 0.05) & ~erode_cv(hood[..., 3] > 0.5, 2) & ends
hood[..., :3] = np.where(hem[..., None], np.asarray(LINE, np.float32) / 255.0, hood[..., :3])
ha = hood[..., 3] > 0.5
openm = (poly_mask((S[1], S[0]), tr_pts(M, HOOD_OPEN)) > 0.5) & ~ha

# ---- recolouring ----
hair = b.sel(hue=(270, 15), sat=(0.25, 1), box=(40, 0, 300, 150)) | b.sel(hue=(260, 340), sat=(0.2, 1), box=(180, 130, 230, 175))
hair = b.grow(hair, 1, 0.25) & region(S, 40, 0, 300, 175)
b.ramp(hair, RAMPS['hair_dark'], gain=0.8)
cloak = b.sel(hue=(80, 170), sat=(0.15, 1), box=(0, 150, 330, 350))
cloak = b.grow(cloak, 2, 0.3) & region(S, 0, 150, 330, 350)
b.ramp(cloak, RAMPS['moss'], gain=0.95)
ARMOUR = b.poly([(168, 236), (200, 214), (232, 196), (270, 196), (310, 210), (330, 230), (330, 350), (176, 350), (166, 290)],
                [(28, 226), (60, 214), (84, 222), (88, 260), (76, 300), (52, 310), (30, 290)])
gold = ARMOUR & (b.sel(hue=(5, 62), sat=(0.5, 1)) | b.sel(hue=(30, 65), sat=(0.0, 0.5), val=(0.85, 1)) | b.sel(hue=(0, 20), sat=(0.4, 1), val=(0.3, 0.7))
                 | b.sel(sat=(0, 0.3), val=(0.8, 1)))
gold = b.grow(gold, 1, 0.3) & ARMOUR
skin = b.sel(hue=(0, 60), sat=(0.12, 0.75), val=(0.35, 1)) & ~gold & ~cloak
b.ramp(gold, RAMPS['leather'], gain=1.0)
# the bare arms: the tunic's brown sleeves (the muscles' shading becomes the cloth's folds)
arms = (skin | (b.sel(sat=(0, 0.3), val=(0.7, 1)) & ~ARMOUR)) & b.poly([(0, 200), (62, 200), (62, 350), (0, 350)], [(200, 280), (330, 280), (330, 350), (200, 350)])
arms = b.grow(arms, 1, 0.3)
b.ramp(arms, [(0.0, (22, 14, 10)), (0.2, (48, 32, 22)), (0.4, (76, 52, 34)), (0.6, (98, 68, 44)), (0.8, (120, 86, 56)), (1.0, (140, 104, 70))])
# the cloak's gold toggles: plain wooden pegs
gap = fill_holes(b.comp(~cloak & region(S, 60, 190, 215, 350) & b.op(), (140, 280)))     # the chest between the cloak's edges
pegs = (b.sel(hue=(15, 60), sat=(0.35, 1)) | b.sel(sat=(0, 0.3), val=(0.75, 1))) & dilate_cv(cloak, 3) & region(S, 30, 240, 250, 350) & ~ARMOUR & ~gap
b.ramp(pegs, RAMPS['wood'], gain=0.8)
b.over(stubble(S, [(112, 150), (140, 168), (170, 172), (186, 160), (188, 140), (186, 178), (166, 196), (134, 190), (114, 172)], (50, 36, 30),
               density=0.3, seed=11, alpha=0.42, clip=skin))

# ---- what of the head stands out of the hood goes (the spikes); inside it only the face and the hair round it stay; the ear
# and the bare shoulder beside the neck go too (the lining shows there) ----
HEAD = b.poly([(0, 0), (330, 0), (330, 168), (250, 176), (200, 190), (100, 180), (60, 182), (0, 182)])
b.erase(HEAD & ~ha & ~openm)
FACE_HAIR = [(84, 96), (120, 86), (180, 96), (210, 150), (200, 200), (140, 205), (90, 180), (80, 140)]
b.erase(openm & hair & ~b.poly(FACE_HAIR))
b.erase(openm & b.poly([(192, 110), (240, 110), (240, 215), (189, 215), (189, 160), (192, 140)]))
b.over(strokes(S, [((190.5, 138), (187.5, 172), (189.5, 206), 2.2)], LINE, taper_to=1.0, clip=openm))    # (the cut's edge: the neck's line)

# dark bangs under the hood's rim across the forehead (ragged strand tips)
LOW = strand_edge([(82, 116), (100, 110), (118, 108), (136, 114), (150, 123), (162, 133)], side=-1, seg=7, tip=6, out=4.5, seed=5)
BANGS = [(78, 96), (92, 88), (115, 85), (140, 99), (168, 124)] + LOW[::-1]
bangs = cel(S, [BANGS], ((26, 18, 14), (46, 32, 22), (72, 50, 34)), lw=1.6, shade=5, light=2, clip=openm | ha, ldir=(0.55, 0.83))
bm = bangs[..., 3] > 0.5
bangs = over(bangs, hair_strands(S, erode_cv(bm, 1), (120, 140), (84, 60, 42), (20, 14, 10), n=40, length=(6, 11), seed=6, alpha=(0.6, 0.6)))
b.over(bangs)

# ---- the bare chest and shoulders: a brown leather tunic painted over (the pendant under it), up to the jaw, a round neckline ----
CHEST = [(55, 168), (100, 174), (113, 189), (119, 203), (122, 222), (136, 231), (150, 236), (165, 234), (176, 229), (186, 216),
         (190, 206), (215, 195), (240, 186), (240, 350), (55, 350)]
jaw = b.sel(lum=(0, 0.3), poly=[(96, 172), (104, 172), (124, 200), (124, 210), (114, 200)])
tun = (gap | (skin & region(S, 55, 160, 240, 245) & ~cloak) | (openm & region(S, 186, 190, 240, 245))) & b.poly(CHEST) & ~jaw
TUNIC = ((62, 40, 24), (96, 64, 38), (128, 90, 56))
b.over(cel(S, [CHEST], TUNIC, lw=1.8, shade=10, light=3, clip=tun, ldir=(0.55, 0.83)))
b.over(strokes(S, [((112, 262), (126, 290), (124, 330), 1.1), ((176, 250), (166, 290), (170, 340), 1.0)], TUNIC[0], alpha=0.75, clip=tun))
# the bow strap across the chest, the snare-wire ring on a cord
STRAP = taper(bez((96, 214), (140, 280), (196, 350), 30), 12, 12)
b.over(cel(S, [STRAP], ((40, 24, 14), (66, 42, 24), (94, 64, 38)), lw=1.4, shade=3, light=1.4, clip=tun, ldir=(0.55, 0.83)))
b.over(strokes(S, [((127, 229), (140, 246), (151, 258), 1.4), ((176, 227), (166, 244), (157, 258), 1.4)], (40, 28, 20), clip=tun, taper_to=1.0))
b.over(cel(S, [ellipse(154, 266, 7.5, 8.5)], ((70, 72, 80), (136, 140, 148), (200, 204, 212)), lw=1.2, shade=2, light=1.2,
           holes=[ellipse(154, 266, 4.2, 5.2)], ldir=(0.55, 0.83)))

# ---- the dark lining behind the face, the bow on the back, the shadow of the hood's rim, then the hood ----
LINING = ((20, 24, 16), (34, 40, 26), (48, 56, 36))
lin = cel(S, [tr_pts(M, HOOD_OPEN)], LINING, outline=False, shade=12, light=0, ldir=(0.55, -0.83))
lin[..., 3] *= openm
b.img = over(lin, b.img)
BOW = taper(bez((40, 236), (14, 120), (66, 14), 40), 5.0, 3.0, w_mid=7.5)
bow = cel(S, [BOW], ((70, 44, 22), (112, 74, 40), (150, 108, 64)), lw=1.4, shade=2.5, light=1.5, ldir=(0.55, 0.83))
bow = over(strokes(S, [((44, 230), (56, 124), (68, 18), 0.9)], (200, 190, 160), taper_to=1.0), bow)
b.img = over(bow, b.img)
cast_shadow(b, hood[..., 3], dx=3, dy=8, col=(110, 90, 100), k=0.55)
b.over(hood)
b.save(OUT)
print('ok', OUT)
