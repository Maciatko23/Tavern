# Janek (the fisherman of the harbour, about 40, broad-shouldered, a joker): Actor3_1 repainted to match his map sheet
# ($Npc_Janek): a navy thick knitted wool cap without a brim (painted: a dome and a turned-up ribbed cuff) over the hair, the
# hair left under it (sideburn, behind the ear) reddish, a short reddish-ginger beard and moustache (painted), a weather-beaten
# ruddy face; below the head everything new: a faded grey-blue linen shirt with an open collar, a brown leather fisherman's
# apron (bib and neck strap, a few fish scales), the leather straps of the wicker basket over the shoulders and the basket's rim
# behind the far shoulder (where the base's crossbow was).
# Run: python tools/busts/make_janek.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Janek_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('Actor3_1')
S = b.img.shape
hd, s, v = hsv_of(b.src)

# the map's colours ($Npc_Janek front frame): cap (61, 71, 98)/(40, 48, 75), beard (193, 103, 55)/(150, 76, 38)/(120, 50, 19),
# shirt (122, 135, 137)/(83, 98, 105), apron (136, 87, 52)/(114, 71, 45)/(87, 61, 44), skin (232, 166, 131)/(202, 132, 97)
CAP_T = ((34, 40, 64), (56, 66, 96), (84, 96, 130), (24, 28, 46))
CUFF_T = ((42, 50, 78), (66, 78, 110), (96, 110, 144))
BEARD_T = ((128, 58, 26), (174, 90, 46), (214, 132, 78), (94, 40, 16))
SHIRT_T = ((80, 94, 104), (118, 132, 138), (156, 168, 172), (60, 70, 80))
APRON_T = ((84, 54, 32), (122, 80, 48), (152, 106, 68))
STRAP_T = ((52, 32, 20), (82, 54, 32), (112, 78, 50))
WICKER_T = ((110, 78, 40), (160, 120, 66), (204, 166, 104))
SKIN_T = ((196, 124, 90), (230, 164, 126), (246, 196, 160))

# ---- the head that stays: the face, the ear, the hair round them (the cape, the armour and the crossbow go) ----
HEAD = [(80, 0), (262, 0), (262, 118), (240, 130), (226, 150), (214, 166), (200, 184), (180, 198), (150, 200), (128, 192),
        (112, 170), (100, 140), (84, 60)]
keep = b.poly(HEAD) & b.op()
keep &= ~b.grow(b.sel(hue=(40, 62), sat=(0.45, 1), val=(0.6, 1)) & region(S, 150, 160, 262, 212), 2, 0.3)   # (the yellow collar)
keep &= ~(b.sel(lum=(0, 0.5)) & b.poly([(78, 30), (93, 30), (93, 76), (78, 76)]))                   # (the fringe's tuft left of the cap)
keep &= ~(b.sel(hue=(300, 360), sat=(0.15, 1)) & region(S, 0, 150, 330, 350))                   # (the purple cape)
# hair: dark brown -> reddish brown (only the sideburn and the nape stay out from under the cap)
hair = b.sel(hue=(0, 60), sat=(0.05, 0.6), val=(0, 0.5), box=(80, 0, 262, 150)) | b.sel(hue=(200, 260), sat=(0.2, 1), box=(80, 0, 262, 150))
hair = b.grow(hair, 1, 0.25) & region(S, 80, 0, 262, 150) & ~b.poly([(104, 88), (200, 84), (206, 150), (110, 160)])
b.ramp(hair, [(0.0, (30, 12, 6)), (0.12, (64, 28, 14)), (0.25, (104, 48, 22)), (0.4, (146, 72, 34)), (0.6, (182, 100, 52)),
              (0.8, (214, 140, 88))], gain=1.5)
# the skin a little ruddier (weather-beaten), a flush on the nose and the cheeks
skin = b.sel(hue=(0, 45), sat=(0.15, 0.7), val=(0.45, 1), box=(90, 60, 240, 210)) & ~hair
b.multiply(skin, (255, 226, 214), 1.0)
b.over(blush(S, 132, 128, 12, 9, col=(226, 104, 84), alpha=0.32, clip=skin))
b.over(blush(S, 188, 132, 18, 11, col=(226, 104, 84), alpha=0.26, clip=skin))
b.over(blush(S, 116, 112, 7, 6, col=(226, 104, 84), alpha=0.2, clip=skin))
# crow's feet at the near eye's outer corner (a squint from the sea's glare)
b.over(strokes(S, [((186, 110), (191, 112), (195, 111), 1.1), ((185, 114), (190, 118), (194, 120), 1.0)], (150, 88, 62), alpha=0.6,
               clip=skin))
head = take(b.img, keep)

# ---- the new body under the head ----
lay = np.zeros(S[:2] + (4,), np.float32)
# the basket on his back: its upper part rises behind the far shoulder (wicker: woven rows), a thick rim on top
RC = (296, 146, 54, 14)                                                      # the rim: an ellipse seen from a little above
BASKET = ellipse(RC[0], RC[1], RC[2], RC[3], 0, 40, 0, np.pi) + [(RC[0] - RC[2], RC[1]), (RC[0] - RC[2] - 4, 240), (RC[0] + RC[2] + 6, 240)]
bk = cel(S, [BASKET], WICKER_T, lw=2.0, shade=12, light=3, ldir=LDIR)
bm = erode_cv(bk[..., 3] > 0.5, 2)
weave, stakes = [], []
for j, y in enumerate(range(158, 244, 8)):          # the woven rows bulge with the basket's round body
    for x in range(232 + (j % 2) * 6, 352, 12):
        sag = 0.0022 * (x - RC[0]) ** 2
        weave.append(((x, y + 3.0 - sag), (x + 6, y - 1.5 - sag), (x + 12, y + 3.0 - sag), 2.4))
for x in range(RC[0] - RC[2] + 8, RC[0] + RC[2], 12):   # the upright stakes
    stakes.append(((x, 150 + RC[3] * 0.9), (x + (x - RC[0]) * 0.03, 196), (x + (x - RC[0]) * 0.06, 244), 1.6))
bk = over(bk, strokes(S, weave, WICKER_T[0], alpha=0.7, clip=bm, taper_to=0.6))
bk = over(bk, strokes(S, [(w[0], w[1], w[2], 1.0) for w in weave[::2]], WICKER_T[2], alpha=0.45, clip=bm, taper_to=0.4))
bk = over(bk, strokes(S, stakes, WICKER_T[0], alpha=0.45, clip=bm, taper_to=1.0))
# the rim: a thick braided ring, the dark inside of the basket in it
ring = cel(S, [ellipse(*RC, 0, 50)], ((96, 66, 32), (150, 108, 58), (196, 156, 96)), lw=1.8, shade=3, light=1.5, ldir=LDIR,
           holes=[ellipse(RC[0] + 1, RC[1] + 1, RC[2] - 7, RC[3] - 5, 0, 40)])
inside = cel(S, [ellipse(RC[0] + 1, RC[1] + 1, RC[2] - 6, RC[3] - 4, 0, 40)], ((26, 18, 12), (44, 30, 18), (60, 42, 26)), outline=False,
             shade=4, light=0, ldir=(-0.55, -0.83))
bk = over(over(bk, inside), ring)
lay = over(lay, bk)
# the neck
NECK = [(150, 176), (214, 140), (226, 196), (214, 224), (166, 224), (150, 196)]
lay = over(lay, cel(S, [NECK], SKIN_T, lw=1.8, shade=10, light=2, ldir=LDIR))
# the shirt: broad shoulders, an open collar (the V shows the chest)
SHIRT = [(0, 262), (34, 240), (84, 222), (134, 210), (162, 202), (176, 214), (194, 238), (214, 204), (226, 196), (262, 204),
         (300, 216), (330, 226), (330, 350), (0, 350)]
sh = cel(S, [SHIRT], SHIRT_T[:3], lw=2.0, shade=12, light=3, ldir=LDIR)
sm = erode_cv(sh[..., 3] > 0.5, 2)
# folds of the coarse linen
sh = over(sh, strokes(S, [((40, 350), (52, 300), (70, 262), 6.0), ((300, 350), (292, 300), (286, 250), 7.0),
                          ((116, 230), (100, 238), (84, 250), 3.0)], SHIRT_T[0], clip=sm, taper_to=0.05))
sh = over(sh, strokes(S, [((34, 350), (46, 300), (64, 262), 1.4), ((294, 350), (286, 300), (280, 250), 1.4)], SHIRT_T[2], alpha=0.8,
                      clip=sm, taper_to=0.1))
# the shoulder seams, creases of the coarse linen, a sewn patch on the far shoulder
sh = over(sh, strokes(S, [((14, 262), (44, 240), (92, 232), 1.2), ((262, 210), (296, 232), (330, 238), 1.2)], SHIRT_T[0], alpha=0.8,
                      clip=sm, taper_to=1.0))
sh = over(sh, strokes(S, [((8, 300), (30, 286), (60, 282), 2.0), ((12, 330), (40, 318), (66, 316), 2.0), ((96, 236), (108, 252), (106, 276), 2.4),
                          ((310, 262), (316, 280), (312, 300), 2.0), ((278, 228), (284, 244), (280, 262), 1.8)], SHIRT_T[0], alpha=0.55,
                      clip=sm, taper_to=0.1))
# a darned spot on the far shoulder (cross stitches)
sh = over(sh, strokes(S, [((50, 266), (56, 270), (62, 274), 1.0), ((62, 264), (56, 270), (50, 276), 1.0), ((60, 262), (66, 266), (72, 270), 1.0),
                          ((72, 260), (66, 266), (60, 272), 1.0)], (70, 78, 84), alpha=0.8, clip=sm, taper_to=1.0))
lay = over(lay, sh)
# the collar's two flaps folded open
FLAP_L = [(160, 200), (150, 214), (166, 238), (190, 246), (176, 222)]
FLAP_R = [(226, 194), (232, 214), (222, 232), (198, 246), (212, 214)]
lay = over(lay, cel(S, [FLAP_L, FLAP_R], SHIRT_T[:3], lw=1.6, shade=4, light=2, ldir=LDIR))
# the apron's bib (leather) with its neck strap, and the basket's shoulder straps over everything
BIB = [(118, 262), (150, 254), (196, 252), (238, 256), (262, 262), (268, 300), (280, 350), (104, 350), (112, 300)]
ap = cel(S, [BIB], APRON_T, lw=2.0, shade=10, light=3, ldir=LDIR)
am = erode_cv(ap[..., 3] > 0.5, 2)
ap = over(ap, strokes(S, [((124, 268), (190, 260), (256, 268), 1.0)], APRON_T[0], alpha=0.8, clip=am, taper_to=1.0))      # (the hem's stitches)
ap = over(ap, strokes(S, [((150, 350), (154, 320), (150, 290), 4.0), ((240, 350), (236, 316), (240, 290), 5.0)], APRON_T[0], alpha=0.7,
                      clip=am, taper_to=0.05))
# fish scales stuck on the leather (small silvery flecks)
rng = np.random.RandomState(4)
sc = [(rng.uniform(130, 250), rng.uniform(280, 345), rng.uniform(0.9, 1.3)) for _ in range(8)]
ap = over(ap, dots(S, sc, (196, 206, 206), alpha=0.75, clip=am))
lay = over(lay, ap)
NSTRAP_L = taper(bez((126, 262), (138, 230), (160, 206), 20), 6, 6)
NSTRAP_R = taper(bez((252, 262), (240, 232), (222, 204), 20), 6, 6)
lay = over(lay, cel(S, [NSTRAP_L, NSTRAP_R], APRON_T, lw=1.4, shade=2, light=1.2, ldir=LDIR))
lay = over(lay, cel(S, [ellipse(128, 262, 3.2, 3.0), ellipse(250, 262, 3.2, 3.0)], ((90, 80, 70), (150, 140, 128), (210, 204, 196)),
                    lw=0.8, shade=1, light=0.8, ldir=LDIR))
STRAP_L = taper(bez((70, 230), (56, 290), (52, 350), 24), 13, 13)
STRAP_R = taper(bez((278, 208), (292, 280), (300, 350), 24), 14, 14)
lay = over(lay, cel(S, [STRAP_L, STRAP_R], STRAP_T, lw=1.6, shade=3, light=1.6, ldir=LDIR))
# the head over it all (its chin throws a shadow on the neck)
hm = head[..., 3] > 0.5
lay[..., :3] = np.where((shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5))[..., None],
                        lay[..., :3] * np.asarray((0.72, 0.62, 0.66), np.float32), lay[..., :3])
b.img = over(lay, head)

# ---- the short ginger beard and moustache ----
OUTER = [(208, 98), (215, 122), (214, 148), (207, 172), (192, 190), (170, 202), (146, 201), (127, 190), (115, 171), (109, 150), (109, 132)]
INNER = [(113, 134), (117, 150), (125, 162), (139, 172), (156, 172), (170, 165), (180, 154), (189, 138), (198, 118), (204, 100)]
MOUS = [(121, 155), (133, 146), (149, 142), (165, 142), (177, 145), (185, 149), (178, 153), (166, 152), (152, 153), (138, 156), (124, 160)]
b.over(beard2(S, OUTER, INNER, BEARD_T, flow=(160, 230), mous=MOUS, mous_flow=(150, 175), seed=3, n=110, tip=4, out=2.2, seg=8))
# the smile's crease at the near corner of the mouth (he laughs a lot)
b.over(strokes(S, [((184, 154), (188, 150), (189, 144), 1.6)], (110, 50, 24), alpha=0.85, taper_to=0.3))

# ---- the knitted cap: a dome and a turned-up ribbed cuff ----
DOME = ellipse(172, 78, 88, 74, np.radians(8), 60, np.pi, 2 * np.pi) + [(262, 96), (90, 70)]
CUFF = [(92, 56), (130, 52), (172, 54), (212, 62), (244, 76), (260, 92), (258, 112), (232, 96), (206, 84), (172, 78), (134, 78),
        (100, 84), (90, 72)]
cap = cel(S, [DOME], CAP_T[:3], lw=2.0, shade=14, light=4, ldir=LDIR)
cm = erode_cv(cap[..., 3] > 0.5, 2)
ribs = []
for k in range(11):
    t = k / 10.0
    x0 = 100 + t * 150
    ribs.append(((x0, 64 + t * 22), (172 + (x0 - 172) * 0.55, 30), (172 + (x0 - 172) * 0.15, 8), 1.2))
cap = over(cap, strokes(S, ribs, CAP_T[3], alpha=0.22, clip=cm, taper_to=0.2))
cf = cel(S, [CUFF], CUFF_T, lw=2.0, shade=5, light=2.5, ldir=LDIR)
cfm = erode_cv(cf[..., 3] > 0.5, 2)
cr = []
for k in range(26):
    t = k / 25.0
    x = 96 + t * 160
    top = 54 + 22 * t ** 1.6
    bot = 80 + 22 * t ** 1.6
    cr.append(((x, top), (x + 1, (top + bot) / 2), (x + 2, bot), 1.4))
cf = over(cf, strokes(S, cr, CUFF_T[0], alpha=0.6, clip=cfm, taper_to=0.8))
cap = over(cap, cf)
put_hat(b, cap, shadow=(150, 110, 120), shadow_k=0.45, sdx=2, sdy=7, keep=b.poly([(204, 84), (262, 84), (262, 140), (204, 140)]))
b.save(OUT)
print('ok', OUT)
