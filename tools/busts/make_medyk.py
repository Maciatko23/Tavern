# Konstanty Mak (the physician from the ferry, thin and tired, ironic, about 45 but grey early): People2_1 (the old face with
# the wire spectacles) repainted to match his map sheet ($Npc_Medyk): the spectacles kept (their rims darker iron), the white
# swept-back hair a mid grey grown longer and unruly (loose locks painted over the forehead, the crown and the ear), heavy grey
# brows, a paler, greyer, tired skin with bags under the eyes, a short grey beard over the cheeks and the chin with a short
# moustache (painted); below the head everything new: the white robe painted over as a long dark-green coat with a turned-down
# collar, a white linen apron over it (the bib and its strap round the neck, a faded stain).
# 0 PixelLab generations. Run: python tools/busts/make_medyk.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Medyk_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('People2_1')
S = b.img.shape

# the map's colours ($Npc_Medyk front frame): hair and beard (164, 164, 162)/(145, 145, 138)/(124, 121, 116)/(96, 93, 90)/(79, 78, 74),
# skin (226, 200, 177)/(223, 186, 159)/(190, 167, 150)/(173, 134, 111), coat (57, 90, 56)/(53, 82, 53)/(42, 70, 42)/(35, 61, 36)/
# (26, 48, 27), apron (227, 222, 210)/(190, 167, 150), mouth (71, 62, 55)
GREY = [(0.0, (34, 34, 36)), (0.2, (72, 70, 70)), (0.38, (100, 98, 96)), (0.55, (128, 126, 122)), (0.72, (150, 150, 144)), (0.86, (170, 170, 166)),
        (1.0, (196, 196, 192))]
HAIR_T = ((96, 93, 90), (132, 130, 126), (166, 166, 162), (74, 72, 70))
BROW_T = ((84, 82, 80), (128, 126, 122), (168, 166, 162), (60, 58, 58))
BEARD_T = ((100, 98, 96), (138, 136, 132), (172, 172, 168), (80, 78, 78))
SKIN_R = [(0.0, (40, 24, 18)), (0.25, (112, 82, 68)), (0.45, (164, 128, 108)), (0.6, (190, 160, 140)), (0.75, (212, 184, 162)),
          (0.88, (226, 200, 178)), (1.0, (238, 220, 200))]
COAT_T = ((35, 61, 36), (57, 90, 56), (78, 112, 74), (26, 48, 27))
APRON_T = ((190, 178, 160), (227, 222, 210), (242, 240, 232), (170, 156, 138))
IRON = [(0.0, (16, 16, 18)), (0.3, (40, 40, 44)), (0.55, (72, 72, 76)), (0.8, (118, 118, 122)), (1.0, (180, 182, 186))]

hd, s, v = hsv_of(b.src)
op = b.op()
EYES = b.poly([(94, 100), (120, 100), (120, 116), (94, 116)], [(136, 98), (170, 98), (170, 114), (136, 114)])

# ---------- the spectacles: the blue-grey rims darker iron ----------
GLASS = b.poly([(80, 96), (212, 96), (212, 134), (80, 134)])
rims = b.sel(hue=(180, 260), sat=(0.18, 1), val=(0.15, 0.8)) & GLASS & ~EYES
b.ramp(rims, IRON, gain=1.0)

# ---------- hair: mid grey ----------
hair = b.sel(sat=(0, 0.3), val=(0.3, 1), box=(80, 0, 260, 170)) & ~GLASS & ~EYES
hair |= b.sel(sat=(0, 0.3), val=(0.3, 1)) & GLASS & (b.xx > 186) & ~rims
hair &= ~b.sel(hue=(0, 60), sat=(0.12, 1))
hair = b.grow(hair, 1, 0.25) & region(S, 80, 0, 260, 170) & ~rims
b.ramp(hair, GREY, gain=1.0)

# ---------- skin: paler, greyer, tired ----------
hd, s, v = hsv_of(b.src)
skin = ((hd <= 50) | (hd >= 340)) & (s >= 0.1) & (v >= 0.35) & region(S, 70, 30, 250, 240) & ~rims
b.ramp(skin, SKIN_R, gain=1.0)
# bags under the eyes, a crease between the brows, the hollow cheeks (thin warm lines in the RTP manner)
WR = (130, 92, 76)
b.over(strokes(S, [((98, 121), (106, 124), (114, 122), 1.3), ((100, 125), (107, 128), (114, 126), 1.0),
                   ((140, 119), (152, 123), (164, 120), 1.4), ((143, 124), (153, 127), (163, 125), 1.1),
                   ((128, 90), (129, 96), (128, 101), 1.4), ((176, 128), (180, 140), (182, 150), 1.2)], WR, alpha=0.55))
b.over(blush(S, 182, 134, 12, 8, col=(150, 120, 120), alpha=0.16, clip=skin))          # (a grey shadow under the near cheekbone)

# ---------- heavy grey brows ----------
BROW_F = [(94, 96), (101, 90), (112, 88), (122, 90), (127, 95), (117, 95), (105, 96), (97, 100)]
BROW_N = [(138, 94), (148, 87), (162, 84), (176, 86), (186, 92), (182, 96), (168, 93), (154, 93), (143, 98)]
for poly, fl in ((BROW_F, (110, 104)), (BROW_N, (184, 98))):
    lay = cel(S, [poly], BROW_T[:3], lw=1.3, shade=2.5, light=1.2, ldir=LDIR)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), fl, BROW_T[2], BROW_T[3], n=16, length=(4, 7), seed=len(poly)))
    b.over(lay)

# ---------- the head that stays (the robe and the dark collar go) ----------
HEAD = [(70, 0), (270, 0), (270, 160), (226, 176), (204, 192), (160, 200), (120, 196), (90, 176), (74, 120)]
# (the robe's navy collar showing behind the ear: hair in shade)
nav = b.sel(hue=(180, 260), sat=(0.15, 1), val=(0, 0.5), box=(196, 100, 250, 160))
b.ramp(nav, [(0.0, LINE), (0.2, (60, 58, 58)), (0.5, (96, 93, 90))])
head = take(b.img, b.poly(HEAD) & op & ~b.sel(hue=(180, 260), sat=(0.1, 1), val=(0, 0.45), box=(110, 160, 260, 260))
            & ~b.sel(sat=(0, 0.12), val=(0.75, 1), box=(150, 170, 270, 260)) & ~b.sel(lum=(0, 0.35), box=(212, 152, 262, 210)))

# ---------- the body (new): the long dark-green coat, the white apron ----------
lay = np.zeros(S[:2] + (4,), np.float32)
SKIN_T = ((176, 146, 126), (212, 184, 162), (226, 200, 178))
NECK = [(124, 176), (200, 160), (226, 148), (234, 178), (226, 212), (204, 228), (140, 230), (126, 204)]
COAT = [(0, 350), (0, 268), (28, 240), (70, 222), (112, 210), (150, 204), (222, 194), (264, 202), (300, 216), (330, 230), (330, 350)]
ct = celf(S, [COAT], COAT_T[:3], lw=2.0, shade=14, light=3, ldir=LDIR)
cm = erode_cv(ct[..., 3] > 0.5, 2)
darken(ct, b.poly([(276, 200), (330, 200), (330, 350), (296, 350), (290, 280)]) & cm,
       np.asarray(COAT_T[0], np.float32) / np.asarray(COAT_T[1], np.float32))
# the sleeves' seams and folds
ct = over(ct, strokes(S, [((60, 226), (48, 290), (52, 352), 1.5), ((276, 208), (286, 280), (292, 352), 1.5)], COAT_T[3], alpha=0.85, clip=cm,
                      taper_to=1.0))
FOLDS = [((30, 352), (34, 316), (40, 284), 6.0), ((270, 352), (268, 320), (262, 290), 7.0)]
ct = over(ct, strokes(S, FOLDS, COAT_T[0], clip=cm, taper_to=0.05), k=0.75)
ct = over(ct, strokes(S, [(f[0], f[1], f[2], 1.2) for f in FOLDS], COAT_T[2], clip=cm, taper_to=0.1), k=0.5)
lay = over(lay, ct)
# the collar standing behind the neck, then the neck
lay = over(lay, cel(S, [[(206, 200), (228, 166), (248, 170), (266, 204)]], COAT_T[:3], lw=1.8, shade=5, light=2, ldir=LDIR))
lay = over(lay, cel(S, [NECK], SKIN_T, lw=1.6, shade=12, light=2, ldir=LDIR))
# the coat buttoned up to the throat under the beard (between the lapels)
FRONT = [(128, 206), (176, 200), (216, 194), (224, 244), (122, 250)]
lay = over(lay, cel(S, [FRONT], (COAT_T[3], COAT_T[0], COAT_T[1]), lw=1.6, shade=6, light=1.5, ldir=LDIR))
# the coat's turned-down collar and lapels round the neck (the apron lies over their lower part)
LAP_F = [(100, 214), (130, 204), (148, 222), (134, 262), (112, 300), (84, 300), (90, 250)]
LAP_N = [(206, 194), (240, 198), (268, 210), (258, 248), (244, 300), (226, 300), (228, 250), (220, 224)]
lp = cel(S, [LAP_F, LAP_N], COAT_T[:3], lw=2.0, shade=6, light=3, ldir=LDIR)
lay = over(lay, lp)
# the apron: the bib (wider down), a faded stain, the strap round the neck
BIB = [(116, 248), (226, 240), (236, 300), (246, 350), (100, 350), (108, 300)]
ap = celf(S, [BIB], APRON_T[:3], lw=2.0, shade=8, light=2.5, ldir=LDIR)
apm = erode_cv(ap[..., 3] > 0.5, 2)
ap = over(ap, strokes(S, [((150, 352), (152, 320), (156, 290), 5.0), ((206, 352), (204, 322), (202, 296), 4.0)], APRON_T[3], clip=apm,
                      taper_to=0.05), k=0.6)
ap = over(ap, strokes(S, [((118, 258), (170, 254), (222, 250), 1.2)], APRON_T[3], alpha=0.7, clip=apm, taper_to=1.0))   # (the hem of the bib)
STAIN = [(184, 312), (192, 306), (202, 308), (206, 318), (200, 326), (190, 326), (182, 320)]
ap = over(ap, cel(S, [STAIN], ((178, 160, 136), (196, 180, 156), (204, 190, 168)), outline=False, shade=2, light=0, ldir=LDIR,
                  clip=apm), k=0.8)
lay = over(lay, ap)
STRAPS = [taper(bez((122, 250), (124, 226), (132, 206), 14), 8, 7), taper(bez((222, 242), (218, 218), (210, 198), 14), 8, 7)]
lay = over(lay, cel(S, STRAPS, APRON_T[:3], lw=1.5, shade=2.5, light=1.2, ldir=LDIR))
hm = head[..., 3] > 0.5
darken(lay, shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5), (0.68, 0.66, 0.7))
b.img = over(lay, head)

# ---------- the short grey beard over the cheeks and the chin, a short moustache ----------
OUTER = [(204, 124), (210, 148), (206, 172), (196, 190), (180, 202), (160, 209), (138, 209), (118, 203), (102, 192), (92, 176), (87, 156),
         (88, 138)]
INNER = [(94, 138), (100, 156), (108, 170), (122, 176), (134, 177), (146, 176), (160, 172), (172, 165), (184, 150), (194, 134), (199, 124)]
bd = beard2(S, OUTER, INNER, BEARD_T, flow=(146, 260), seed=7, n=150, tip=4, out=2.2, seg=8)
bm = bd[..., 3] > 0.5
far = np.clip((b.xx - 150) / 50.0, 0, 1) * 0.5 + np.clip((b.yy - 190) / 25.0, 0, 1) * 0.3
bd[..., :3] = bd[..., :3] * (1 - (far * bm)[..., None] * (1 - np.asarray((150, 148, 158), np.float32) / 255.0))
b.over(bd)
MOUS = [(104, 160), (110, 154), (120, 150), (132, 149), (144, 150), (156, 152), (166, 156), (172, 162)] + \
    strand_edge([(172, 166), (160, 164), (146, 163), (132, 163), (118, 164), (106, 166)], side=-1, seg=5, tip=3, out=1.4, seed=21)
ml = cel(S, [MOUS], BEARD_T[:3], lw=1.1, shade=3, light=1.6, ldir=LDIR)
ml = over(ml, hair_strands(S, erode_cv(ml[..., 3] > 0.5, 1), (138, 180), BEARD_T[2], BEARD_T[3], n=40, length=(4, 8), seed=22))
b.over(ml)

# ---------- unruly hair: a ragged mop round the crown and the back (behind the head), stray locks over the forehead ----------
MOP_OUT = [(84, 66), (88, 40), (104, 20), (128, 6), (160, 2), (194, 6), (224, 20), (246, 44), (258, 76), (260, 110), (254, 140), (244, 164),
           (232, 178)]
mop_edge = strand_edge(MOP_OUT, side=-1, seg=9, tip=6, out=3.5, seed=41)
MOP = mop_edge + [(222, 160), (200, 120), (160, 80), (110, 70)]
mp = cel(S, [MOP], HAIR_T[:3], lw=1.6, shade=6, light=2.5, ldir=LDIR)
mp = over(mp, hair_strands(S, erode_cv(mp[..., 3] > 0.5, 1), (200, 90), HAIR_T[2], HAIR_T[3], n=110, length=(6, 12), seed=42))
b.img = over(mp, b.img)                                                     # (behind the head: only its ragged edge shows)


def lock(p0, p1, p2, w):
    """A loose lock: a thin tapered tuft along a curve."""
    return taper(bez(p0, p1, p2, 18), w, 0.5, w_mid=w * 0.85)


LOCKS = [lock((112, 34), (100, 50), (98, 70), 7), lock((124, 30), (116, 50), (118, 68), 6), lock((138, 26), (134, 42), (138, 56), 5),
         lock((150, 12), (166, -2), (184, 2), 7), lock((198, 14), (214, 2), (228, 10), 6),
         lock((236, 120), (246, 146), (238, 172), 10), lock((226, 128), (232, 152), (224, 174), 8)]
lk = cel(S, LOCKS, HAIR_T[:3], lw=1.1, shade=2, light=1.2, ldir=LDIR)
lk = over(lk, hair_strands(S, erode_cv(lk[..., 3] > 0.5, 1), (150, 80), HAIR_T[2], HAIR_T[3], n=30, length=(4, 8), seed=43))
b.over(lk)
# the whole bust 8 px lower (room for the mop; only the apron's hem leaves the frame)
b.img = np.concatenate([np.zeros((8, S[1], 4), np.float32), b.img[:-8]], 0)
b.save(OUT)
print('ok', OUT)
