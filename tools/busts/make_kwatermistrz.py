# Kwatermistrz Pafnucy Klos (the garrison's quartermaster, about 45, very fat, jolly): People4_5 (the round laughing face) repainted
# to match his map sheet ($Npc_Kwatermistrz): BALD on top - the slicked-back hair and the headband gone, a shaved shiny scalp
# painted in their place; short brown hair left round the sides and the back, bushy brown sideburns down to the jaw (painted),
# the brows brown; the chinstrap beard and the goatee gone - a fat double chin in their place; ruddy cheeks and nose; below the
# head everything new: a broad fat body, the garrison's light blue shirt-tabard, over it a WHITE apron bib (as on the sheet)
# on tan straps with the small orange phoenix on the chest, and a thick leather-bound ledger clamped under his near arm.
# Run: python tools/busts/make_kwatermistrz.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken
from make_rotmistrz import LDIR, phoenix

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kwatermistrz_Bust.png')
b = Bust('People4_5')
S = b.img.shape

# the map's colours ($Npc_Kwatermistrz front frame): skin (245, 183, 148)/(220, 156, 128)/(190, 136, 113), cheeks (235, 136, 98),
# hair (77, 46, 29)/(60, 29, 15)/(99, 64, 40), shirt (167, 208, 224)/(109, 153, 173)/(98, 135, 155), apron (230, 240, 242)/
# (159, 194, 208), straps (181, 159, 141), phoenix (238, 81, 22)/(251, 136, 27)/(192, 93, 54), book (87, 60, 42)/(129, 88, 60)/(152, 118, 91)
SKIN_T = ((214, 158, 112), (238, 194, 141), (252, 216, 164), (196, 138, 98))
HAIR_T = ((60, 34, 20), (88, 56, 36), (124, 84, 56), (42, 24, 14))
SHIRT_T = ((104, 148, 170), (164, 204, 222), (204, 230, 240), (80, 120, 142))
APRON_T = ((176, 196, 206), (232, 240, 242), (250, 252, 252))
STRAP_T = ((136, 114, 96), (180, 158, 140), (210, 192, 176))
PHX_T = ((200, 70, 20), (238, 84, 24), (252, 128, 40))
PHX_LINE = (120, 40, 12)
PHX_GLOW = (252, 150, 32)
BOOK_T = ((70, 46, 30), (110, 74, 50), (148, 110, 80))
PAGE_T = ((176, 162, 132), (224, 212, 184), (244, 238, 220))
BRASS_T = ((110, 76, 26), (186, 142, 62), (236, 206, 128))

# ---- the brows brown ----
BROWS = [[(104, 88), (142, 86), (148, 106), (104, 108)], [(154, 80), (206, 84), (208, 102), (156, 100)]]
brows = b.sel(lum=(0, 0.5), polys=BROWS) & ~b.sel(hue=(10, 45), sat=(0.25, 1), val=(0.6, 1))
b.ramp(brows, [(0.0, (30, 16, 10)), (0.12, (56, 34, 22)), (0.3, (92, 60, 40)), (0.5, (124, 86, 58))])

# ---- the bald dome: the hair's top and the headband give way to a shaved, shiny scalp ----
CX, CY, RX, RY = 177, 98, 80, 75
ARC = ellipse(CX, CY, RX, RY, 0, 60, np.pi * 1.0, np.pi * 2.0 + 0.08)
LOWER = [(258, 104), (256, 92), (246, 82), (230, 77), (214, 79), (204, 86), (196, 92), (170, 92), (140, 92), (114, 92), (98, 94)]
DOME = ARC + LOWER
dome = b.poly(DOME)
FACE_IN = [(96, 60), (196, 60), (206, 84), (212, 100), (214, 140), (210, 150), (200, 163), (186, 173), (169, 180), (150, 181), (133, 179),
           (118, 171), (106, 158), (98, 140), (95, 100)]
EAR = [(214, 108), (221, 100), (230, 100), (237, 108), (238, 124), (234, 138), (226, 150), (216, 152), (212, 140)]
face = b.poly(FACE_IN)
fade = np.clip((92.0 - b.yy) / 12.0, 0, 1) * soft_poly(S, [DOME + [(98, 104), (258, 112)]], 0)       # (melts into the forehead)
fade = np.maximum(fade, dome & (b.yy < 80))
b.over(cel(S, [ellipse(CX, CY, RX, RY, 0, 60)], SKIN_T, outline=False, shade=10, light=6, shade2=4, ldir=(0.5, 0.86)), k=fade)
b.over(cel(S, [ellipse(140, 42, 22, 11, -0.5, 30)], ((255, 236, 200),) * 3, outline=False, shade=0, light=0, clip=dome))
b.over(strokes(S, [((118, 62), (126, 46), (142, 34), 3.0)], (255, 242, 214), alpha=0.85, taper_to=0.2, clip=dome))
b.over(strokes(S, [(ARC[i], ((np.asarray(ARC[i]) + np.asarray(ARC[i + 1])) / 2).tolist(), ARC[i + 1], 2.2) for i in range(len(ARC) - 1)],
               LINE, alpha=1.0, taper_to=1.0))
# a jolly forehead: two soft lines across it
b.over(strokes(S, [((128, 70), (154, 66), (182, 70), 1.2), ((134, 61), (156, 58), (178, 61), 1.0)], (206, 146, 100), alpha=0.5))

# ---- the double chin: the chinstrap beard and the goatee under the jaw become a fat fold of skin ----
DCHIN = [(102, 146), (118, 164), (150, 172), (180, 168), (202, 152), (212, 138), (222, 150), (220, 166), (210, 184), (196, 198), (176, 207),
         (150, 210), (128, 204), (112, 190), (102, 170)]
dc = cel(S, [DCHIN], (SKIN_T[3], SKIN_T[0], SKIN_T[1]), lw=2.0, shade=9, light=2, ldir=LDIR, clip=~face)
b.over(dc)
b.over(blush(S, 160, 207, 46, 9, col=(176, 110, 80), alpha=0.35, clip=dc[..., 3] > 0.5))   # (the fold's underside darker)

# ---- the hair that stays: short and brown round the sides and the back, bushy sideburns down to the jaw (painted) ----
old_hair = b.op() & ~b.poly(FACE_IN, EAR) & ~dome & ~(dc[..., 3] > 0.5) & region(S, 60, 0, 290, 230)
old_hair &= ~b.sel(hue=(250, 300), sat=(0.25, 1), box=(0, 150, 330, 350)) & ~b.sel(hue=(20, 45), sat=(0.2, 0.7), val=(0.5, 1), box=(0, 170, 330, 350))
b.erase(old_hair & (b.yy < 200))
SIDE_N = [(200, 88), (212, 80), (230, 76), (246, 80), (257, 92), (261, 106), (259, 124), (253, 140), (244, 152)] \
    + strand_edge([(244, 152), (236, 156), (228, 152)], side=1, seg=6, tip=3, out=1.6, seed=3)[1:] \
    + [(222, 146), (218, 150)] + strand_edge([(218, 150), (214, 166), (208, 180)], side=1, seg=6, tip=4, out=2.0, seed=4)[1:] \
    + [(202, 170), (203, 150), (206, 128), (204, 104), (200, 88)]
SIDE_F = [(96, 88), (106, 86), (109, 104), (110, 124), (108, 142)] + strand_edge([(108, 142), (104, 154), (99, 162)], side=1, seg=6, tip=3,
                                                                                   out=1.6, seed=5)[1:] + [(92, 148), (89, 122), (91, 100)]
for P, fl, sd in ((SIDE_N, (214, 190), 7), (SIDE_F, (96, 160), 8)):
    lay = cel(S, [P], HAIR_T[:3], lw=1.8, shade=5, light=2, ldir=LDIR)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), fl, HAIR_T[2], HAIR_T[3], n=90 if sd == 7 else 20, length=(6, 11),
                                 seed=sd, alpha=(0.6, 0.6)))
    b.over(lay)
ear_skin = b.poly(EAR) & b.sel(hue=(0, 50), sat=(0.1, 1), val=(0.45, 1))
ear_line = b.poly(EAR) & b.sel(lum=(0, 0.42)) & dilate(ear_skin, 2) & ~b.sel(hue=(45, 200), sat=(0.12, 1))
b.over(take(b.src, ear_skin | ear_line))

# ---- ruddy round cheeks and nose ----
skin = b.poly(FACE_IN) & b.sel(hue=(0, 50), sat=(0.15, 0.7), val=(0.55, 1))
b.over(blush(S, 122, 136, 16, 11, col=(236, 120, 92), alpha=0.42, clip=skin))
b.over(blush(S, 190, 132, 17, 12, col=(236, 120, 92), alpha=0.4, clip=skin))
b.over(blush(S, 150, 132, 9, 7, col=(236, 120, 92), alpha=0.3, clip=skin))

# ---- the head that stays (the purple robe, the tan coat and the ponytail's tie go) ----
HEAD = [(60, 0), (290, 0), (290, 150), (262, 152), (248, 158), (232, 160), (222, 170), (212, 188), (196, 201), (176, 211), (150, 214),
        (126, 208), (110, 195), (98, 176), (88, 150), (60, 120)]
keep = b.poly(HEAD) & b.op()
keep &= ~(b.sel(hue=(240, 310), sat=(0.25, 1), src=False) & (b.yy > 150))          # (the purple robe)
keep &= ~(b.sel(hue=(0, 40), sat=(0.6, 1), src=False) & region(S, 214, 140, 290, 220))   # (the ponytail's orange tie)
keep &= ~(b.sel(hue=(150, 240), sat=(0.15, 1), src=False) & region(S, 214, 140, 290, 220) & ~b.poly(SIDE_N))
keep &= ~(b.sel(hue=(20, 45), sat=(0.25, 0.75), val=(0.4, 1), src=False) & ~b.poly(FACE_IN, EAR, DCHIN, SIDE_N, SIDE_F) & (b.yy > 140))
keep &= ~((b.yy > 196) & ~(dc[..., 3] > 0.5) & ~b.poly(SIDE_N))                      # (below the double chin)
head = take(b.img, keep)
hm = head[..., 3] > 0.5

# ---- the body (new): broad and fat - the light blue shirt-tabard, the white apron bib on tan straps, the phoenix, the ledger ----
lay = np.zeros(S[:2] + (4,), np.float32)
SHIRT = [(0, 236), (34, 208), (84, 192), (112, 190), (160, 212), (214, 184), (254, 174), (300, 184), (330, 194), (330, 350), (0, 350)]
sh = celf(S, [SHIRT], SHIRT_T[:3], lw=2.0, shade=14, light=3, ldir=LDIR)
shm = erode_cv(sh[..., 3] > 0.5, 2)
sh = over(sh, strokes(S, [((8, 250), (34, 226), (80, 212), 1.3), ((246, 192), (290, 200), (330, 214), 1.3)], SHIRT_T[0], alpha=0.8, clip=shm,
                      taper_to=1.0))                                                     # (the shoulder seams)
lay = over(lay, sh)
# the far arm hangs at the left edge (a fold down the sleeve)
lay = over(lay, strokes(S, [((56, 350), (60, 300), (58, 252), 5.0)], SHIRT_T[0], clip=shm, taper_to=0.1))
lay = over(lay, strokes(S, [((51, 350), (55, 300), (53, 252), 1.4)], SHIRT_T[2], alpha=0.8, clip=shm, taper_to=0.1))
# the apron bib: white, over the belly and chest, its top just under the collar; shaded round on the near side (the belly's curve)
BIB = [(62, 350), (64, 300), (70, 246), (96, 232), (134, 236), (160, 240), (194, 234), (236, 226), (262, 232), (270, 290), (274, 350)]
bib = celf(S, [BIB], APRON_T, lw=2.0, shade=10, light=3, ldir=LDIR)
bm = erode_cv(bib[..., 3] > 0.5, 2)
darken(bib, b.poly([(236, 220), (290, 220), (290, 350), (246, 350), (244, 290)]) & bm,
       np.asarray(APRON_T[0], np.float32) / np.asarray(APRON_T[1], np.float32))
bib = over(bib, strokes(S, [((84, 350), (88, 316), (98, 282), 6.0), ((232, 350), (236, 312), (228, 280), 6.0)], APRON_T[0], clip=bm,
                        taper_to=0.05), k=0.8)
bib = over(bib, strokes(S, [((100, 312), (164, 330), (236, 306), 1.3)], APRON_T[0], alpha=0.7, clip=bm, taper_to=0.4))   # (the belly)
bib = over(bib, phoenix(S, 132, 248, 0.48, PHX_T, PHX_LINE, PHX_GLOW))
lay = over(lay, bib)
# the straps: from the bib's top corners up over the shoulders to the neck
STRAPS = [[(70, 248), (82, 240), (112, 196), (102, 192)], [(240, 230), (252, 234), (232, 184), (222, 186)]]
lay = over(lay, cel(S, STRAPS, STRAP_T, lw=1.6, shade=2.5, light=1.2, ldir=LDIR))
lay = over(lay, cel(S, [ellipse(78, 244, 4, 3.6), ellipse(246, 232, 4, 3.6)], BRASS_T, lw=1.0, shade=1.4, light=0.8, ldir=LDIR))
# the ledger: a thick book bound in brown leather, the block of pages on top, brass corners, clamped under the near arm
TOPB = [(204, 302), (232, 288), (316, 282), (296, 298)]
FRONT = [(204, 302), (296, 298), (300, 350), (208, 350)]
bk = celf(S, [FRONT], BOOK_T, lw=2.0, shade=7, light=2.5, ldir=LDIR)
bkm = erode_cv(bk[..., 3] > 0.5, 2)
bk = over(bk, strokes(S, [((212, 322), (254, 320), (296, 318), 2.4), ((213, 342), (255, 340), (297, 338), 2.4)], BOOK_T[0], alpha=0.85,
                      clip=bkm, taper_to=1.0))
bk = over(bk, cel(S, [TOPB], BOOK_T, lw=2.0, shade=2, light=1.5, ldir=LDIR))
PAGES = [(212, 300), (234, 290), (304, 285), (288, 297)]
pg = cel(S, [PAGES], PAGE_T, lw=1.2, shade=2, light=1, ldir=LDIR)
pg = over(pg, strokes(S, [((220, 297), (256, 292), (294, 289), 0.7), ((226, 294), (262, 289), (298, 286), 0.7)], PAGE_T[0], alpha=0.8,
                      clip=erode_cv(pg[..., 3] > 0.5, 1), taper_to=1.0))
bk = over(bk, pg)
bk = over(bk, cel(S, [[(204, 302), (218, 294), (220, 308), (206, 316)]], BRASS_T, lw=1.0, shade=1.5, light=1.0, ldir=LDIR))
darken(lay, shift(bk[..., 3] > 0.5, 3, 5) & ~(bk[..., 3] > 0.5) & (lay[..., 3] > 0.5), (0.8, 0.8, 0.84))
lay = over(lay, bk)
# the near arm over the book's back half: a fat round upper arm, the sleeve light blue
SLEEVE = [(258, 244), (260, 226), (266, 212), (278, 201), (294, 195), (312, 194), (330, 198), (330, 350), (272, 350), (264, 306)]
sl = celf(S, [SLEEVE], SHIRT_T[:3], lw=2.0, shade=10, light=3, ldir=LDIR)
slm = erode_cv(sl[..., 3] > 0.5, 2)
sl = over(sl, strokes(S, [((286, 350), (280, 310), (274, 270), 6.0), ((310, 300), (304, 276), (296, 250), 3.5)], SHIRT_T[0], clip=slm,
                      taper_to=0.05))
sl = over(sl, strokes(S, [((262, 304), (260, 280), (260, 256), 1.4)], SHIRT_T[2], alpha=0.8, clip=slm, taper_to=0.2))
lay = over(lay, sl)
# the shirt's collar: a darker blue band round the neck under the double chin
NECKBAND = taper(bez((100, 194), (156, 238), (226, 182), 30), 8, 8)
lay = over(lay, cel(S, [NECKBAND], ((70, 110, 132), (98, 136, 156), (128, 166, 184)), lw=1.6, shade=3, light=1.4, ldir=LDIR))
darken(lay, shift(hm & (b.yy > 150), 2, 8) & ~hm & (lay[..., 3] > 0.5), (0.66, 0.62, 0.68))
b.img = over(lay, head)
b.save(OUT)
print('ok', OUT)
