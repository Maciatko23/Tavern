# Mietek Kwaśniak (the keeper of the new Podgrodzie's szynk, stout, about 50 - docs/podgrodzie/NOWE_PODGRODZIE.md, 2026-10-22):
# SF_People1_5 repainted to his map sheet ($Npc_Szynkarz): BALD - the dark hair gone and a shiny scalp painted in its place, a puffy
# fringe of grey-brown hair left only round the sides (over the near ear, a tuft at the far temple); older, ruddy and a little
# fuller in the face (blushed cheeks, a heavier jaw, forehead lines, bags under the eyes), the drinker's RED bulbous nose; the thin
# dark moustache a thick DROOPING grey-brown one; grey-brown brows; the green overshirt an open moss-green wool VEST (its sleeves
# the off-white linen shirt's), the cream shirt off-white linen with its collar.
# 0 PixelLab generations. Run: python tools/busts/make_szynkarz.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Szynkarz_Bust.png')
b = Bust('SF_People1_5')
S = b.img.shape
LD = (0.55, 0.83)

# the map's colours ($Npc_Szynkarz front frame): vest (115, 136, 80)/(74, 90, 47), shirt (229, 220, 194)/(188, 172, 145)/(160, 147, 128),
# skin (251, 180, 140)/(229, 145, 115)/(202, 124, 99), fringe and moustache (145, 132, 116)/(124, 126, 121)/(88, 82, 76), nose (192, 47, 45)
MOSS = [(0.0, (12, 16, 8)), (0.12, (30, 40, 20)), (0.25, (50, 64, 32)), (0.4, (72, 90, 46)), (0.55, (94, 114, 62)), (0.7, (116, 136, 80)),
        (0.85, (138, 156, 100)), (1.0, (160, 176, 122))]
LINEN = [(0.0, (34, 28, 24)), (0.15, (96, 86, 72)), (0.3, (150, 138, 118)), (0.45, (180, 168, 144)), (0.6, (204, 194, 170)),
         (0.75, (222, 214, 190)), (0.9, (234, 228, 206)), (1.0, (242, 238, 220))]
HT = ((104, 92, 80), (138, 126, 112), (172, 162, 148), (78, 70, 62))       # grey-brown hair: shade, mid, light, strands
skin_src = b.sel(hue=(10, 48), sat=(0.15, 1), val=(0.5, 1))

# ---------- the clothes: the vest (green), its sleeves -> the shirt, the collar -> the shirt ----------
green = b.sel(hue=(70, 175), sat=(0.15, 1), box=(0, 150, 330, 350))
green = b.grow(green, 2, 0.3) & region(S, 0, 150, 330, 350) & ~skin_src
ARM_N = [(252, 210), (290, 222), (330, 236), (330, 350), (272, 350), (268, 300), (262, 256), (256, 228)]
ARM_F = [(0, 256), (36, 238), (70, 230), (66, 290), (62, 350), (0, 350)]
rim = b.sel(hue=(170, 290), sat=(0.04, 1), box=(0, 200, 330, 350)) & ~skin_src
sleeve = (green | rim) & b.poly(ARM_N, ARM_F)
vest = green & ~sleeve       # (the overshirt's collar stays: the vest's own small collar)
b.ramp(vest, MOSS, gain=1.25, bias=0.02)
b.ramp(sleeve, LINEN, gain=1.7, bias=0.12)
shirt = b.sel(hue=(20, 60), sat=(0.08, 0.6), val=(0.45, 1), box=(120, 200, 230, 350)) & ~skin_src
shirt |= b.sel(hue=(20, 60), sat=(0.0, 0.5), val=(0.7, 1), box=(120, 200, 230, 350))
shirt = b.grow(shirt, 1, 0.3) & region(S, 120, 200, 230, 350) & ~green
b.ramp(shirt, LINEN, gain=1.0)
# the armholes' seams (the vest's edge over the sleeves), a little dirt on the shirt
b.over(outline(S, [ARM_N, ARM_F], lw=1.8, clip=dilate(vest, 2) & dilate(sleeve, 2)))
b.over(strokes(S, [((262, 236), (266, 270), (270, 300), 1.0), ((48, 250), (50, 280), (52, 310), 1.0)], (150, 138, 118), alpha=0.6, clip=sleeve))

# ---------- a fuller face: the near jaw and the chin pushed out over the neck (filled from the face's own skin), a double chin ----------
def nn_fill(R, ok):
    u = (~ok).astype(np.uint8)
    _, lab = cv2.distanceTransformWithLabels(u, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    zy, zx = np.nonzero(u == 0)
    lut = np.zeros(lab.max() + 1, np.int64)
    lut[lab[zy, zx]] = zy * S[1] + zx
    idx = lut[lab][R]
    for a in (b.img, b.src):
        flat = a.reshape(-1, 4)
        a[R] = flat[idx]


def soften(R, w, sigma=2.5):
    wf = (w | R).astype(np.float32)
    for a in (b.img, b.src):
        num = cv2.GaussianBlur(a[..., :3] * wf[..., None], (0, 0), sigma)
        den = cv2.GaussianBlur(wf, (0, 0), sigma)[..., None]
        a[..., :3] = np.where(R[..., None], num / np.maximum(den, 1e-4), a[..., :3])


NEWJAW = [(208, 126), (211, 146), (205, 166), (190, 183), (168, 194), (148, 197), (132, 190)]
JOWL_IN = [(140, 182), (160, 178), (170, 168), (177, 158), (180, 148), (181, 134), (186, 124), (204, 120)]
JOWL = NEWJAW + JOWL_IN
b.over(cel(S, [JOWL], ((226, 170, 120), (245, 207, 147), (245, 207, 147)), outline=False, shade=5, light=0, ldir=LD))
# the shade under the new jaw on the neck, the new jaw line, the fold of a double chin
NECKSH = NEWJAW[1:] + [(140, 202), (168, 203), (194, 192), (210, 170)]
nsh = cel(S, [NECKSH], ((176, 108, 84), (176, 108, 84), (176, 108, 84)), outline=False, shade=0, light=0)
nsh[..., 3] = cv2.GaussianBlur(nsh[..., 3], (0, 0), 3.0) * (b.op() & ~b.poly(JOWL))
b.over(nsh, k=0.5)
b.over(strokes(S, [(NEWJAW[i], ((np.asarray(NEWJAW[i]) + np.asarray(NEWJAW[i + 1])) / 2).tolist(), NEWJAW[i + 1], 2.0)
                   for i in range(len(NEWJAW) - 1)], LINE, alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((146, 203), (166, 204), (186, 195), 1.4)], (150, 86, 66), alpha=0.6, taper_to=0.3))

# ---------- the bald head ----------
CX, CY, RX, RY = 160, 98, 70, 80
ARC = ellipse(CX, CY, RX, RY, 0, 60, np.pi * 1.0, np.pi * 2.0 + 0.40)
EAR = [(200, 96), (204, 90), (212, 90), (218, 98), (219, 112), (216, 126), (209, 132), (202, 128), (199, 114)]
LOWER = [(226, 134), (222, 124), (222, 106), (218, 96), (210, 92), (202, 100), (194, 100), (184, 92), (176, 84), (164, 80), (148, 80), (132, 84),
         (116, 88), (104, 90), (94, 94), (90, 98)]
DOME = ARC + LOWER
FACE = [(92, 96), (116, 88), (148, 80), (176, 84), (186, 94), (196, 102), (204, 100), (214, 210), (92, 210)]
dome = b.poly(DOME)
skin_now = b.sel(hue=(10, 48), sat=(0.15, 1), val=(0.55, 1), src=False)
old_hair = b.op() & region(S, 40, 0, 270, 160) & ~skin_now & ~b.poly(FACE, EAR)
b.erase(old_hair & ~dome)
SKIN = ((228, 176, 124), (244, 203, 144), (252, 224, 174), (210, 152, 108))
b.over(cel(S, [ellipse(CX, CY, RX, RY, 0, 60)], SKIN, outline=False, shade=10, light=6, shade2=4, ldir=(0.5, 0.86), clip=dome))
# (the seam above the brows blended)
seam = dilate_cv(dome, 3) & ~erode_cv(dome, 3) & skin_now & region(S, 90, 70, 205, 104)
soften(seam, skin_now & region(S, 86, 60, 210, 110), 2.0)
# the shine of the scalp and its rim
b.over(cel(S, [ellipse(136, 40, 22, 10, -0.5, 30)], ((255, 238, 204), (255, 238, 204), (255, 248, 226)), outline=False, shade=0, light=0))
b.over(strokes(S, [((112, 60), (120, 44), (136, 32), 3.0)], (255, 242, 214), alpha=0.85, taper_to=0.2))
b.over(strokes(S, [(ARC[i], ((np.asarray(ARC[i]) + np.asarray(ARC[i + 1])) / 2).tolist(), ARC[i + 1], 2.2) for i in range(len(ARC) - 1)],
               LINE, alpha=1.0, taper_to=1.0))
# forehead lines (faint)
b.over(strokes(S, [((116, 70), (138, 65), (160, 67), 0.9), ((142, 77), (160, 74), (178, 77), 0.9)], (206, 146, 104), alpha=0.5))

# ---------- the grey-brown fringe: puffy round the near ear and the back, a tuft at the far temple ----------
SIDE_OUT = [(198, 90), (206, 85), (220, 86), (234, 93), (244, 105), (249, 120), (246, 136), (238, 150), (228, 156)]
SIDE_IN = [(224, 146), (224, 128), (222, 110), (218, 98), (210, 93), (202, 98)]
SIDE = strand_edge(SIDE_OUT, side=1, seg=8, tip=3.5, out=2.8, seed=3) + SIDE_IN
FAR_OUT = [(100, 92), (90, 94), (82, 104), (80, 116), (86, 128), (96, 132)]
FAR = strand_edge(FAR_OUT, side=-1, seg=7, tip=3.5, out=2.4, seed=5) + [(102, 124), (100, 110)]
for poly, fl, sd in ((SIDE, (240, 160), 7), (FAR, (86, 136), 8)):
    lay = cel(S, [poly], HT[:3], lw=1.6, shade=4, light=1.6, ldir=LD)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), fl, HT[2], HT[3], n=70, length=(4, 8), seed=sd, alpha=(0.65, 0.6)))
    b.over(lay)
# (whatever is left of the old dark hair round the ear: fringe too)
earhair = b.poly([(198, 84), (252, 84), (252, 160), (220, 160), (216, 128), (218, 98)]) & b.op() \
    & ~b.sel(hue=(0, 50), sat=(0.15, 1), val=(0.45, 1), src=False) & b.sel(lum=(0.1, 1), src=False) & ~b.poly(EAR)
earhair |= b.sel(hue=(170, 290), sat=(0.08, 1), box=(196, 84, 252, 160), src=False)      # (the old hair's blue showing beside the ear)
earhair |= b.sel(hue=(0, 50), sat=(0.2, 1), val=(0.4, 1), box=(220, 100, 234, 142), src=False) & ~b.poly(EAR)   # (skin specks behind the ear)
# the old dark sideburn between the near eye and the ear: the fringe's sideburn now
earhair |= b.sel(lum=(0, 0.45), box=(190, 94, 206, 124), src=False) & b.op()
b.ramp(earhair, [(0.0, HT[3]), (0.3, HT[0]), (0.6, HT[1]), (1.0, HT[2])])

# ---------- the face: ruddy (the whole skin a little pinker), red cheeks, bags under the eyes, grey-brown brows ----------
skin_all = b.sel(hue=(10, 48), sat=(0.12, 1), val=(0.4, 1), src=False) & region(S, 70, 0, 260, 240)
b.multiply(skin_all, (255, 226, 240), 1.0)
face = b.sel(hue=(0, 48), sat=(0.12, 1), val=(0.5, 1), box=(88, 60, 220, 200), src=False)
b.over(blush(S, 112, 132, 12, 9, (230, 90, 76), 0.42, clip=face))
b.over(blush(S, 182, 130, 17, 12, (230, 90, 76), 0.42, clip=face))
b.over(strokes(S, [((100, 119), (110, 123), (120, 121), 1.1), ((148, 115), (160, 120), (172, 117), 1.1)], (200, 124, 100), alpha=0.55))
b.over(strokes(S, [((176, 100), (182, 102), (186, 100), 0.9), ((177, 106), (183, 109), (188, 109), 0.9)], (200, 128, 100), alpha=0.45))
brows = b.sel(lum=(0, 0.45), polys=[[(92, 92), (124, 90), (124, 104), (92, 106)], [(132, 84), (176, 82), (176, 98), (132, 100)]])
b.ramp(brows, [(0.0, (60, 52, 46)), (0.2, (92, 82, 72)), (0.45, (128, 116, 102))])

# ---------- the drinker's nose: red and bulbous, its tip and wings ----------
NOSE = ellipse(131, 135, 11, 7.5, -0.12, 36)
b.over(cel(S, [NOSE], ((192, 74, 64), (222, 100, 88), (240, 140, 120)), outline=False, shade=3.0, light=2.0, ldir=LD))
b.over(strokes(S, [((120, 138), (130, 143), (142, 140), 1.6)], (120, 50, 40), alpha=0.9, taper_to=0.5))      # (its underside)
b.over(strokes(S, [((140, 132), (143, 136), (142, 140), 1.2)], (150, 60, 50), alpha=0.7, taper_to=0.5))      # (the near wing)
b.over(cel(S, [ellipse(126, 132, 3.4, 2.0, -0.4, 16)], ((255, 210, 196), (255, 210, 196), (255, 226, 214)), outline=False, shade=0, light=0))
b.over(blush(S, 131, 130, 9, 10, (214, 70, 60), 0.4, clip=face))

# ---------- the thick drooping grey-brown moustache (over the old one) ----------
MOUS = [(116, 147), (124, 141), (134, 142), (142, 141), (152, 141), (164, 143), (172, 149), (175, 159), (173, 171), (169, 180), (164, 171),
        (160, 161), (152, 156), (140, 157), (130, 157), (122, 161), (118, 171), (113, 178), (110, 167), (111, 155)]
ml = cel(S, [MOUS], HT[:3], lw=1.6, shade=3.5, light=1.8, ldir=LD)
mm = ml[..., 3] > 0.5
ml = over(ml, hair_strands(S, erode_cv(mm, 1), (142, 192), HT[2], HT[3], n=80, length=(5, 10), seed=11, alpha=(0.7, 0.65)))
b.over(ml)
# the lower lip under it
b.over(strokes(S, [((134, 165), (142, 167), (150, 165), 2.0)], (176, 100, 86), alpha=0.75, taper_to=0.6))
b.save(OUT)
print('ok', OUT)
