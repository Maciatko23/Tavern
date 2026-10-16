# Werbownik Szczepan Beben (the garrison's recruiter, about 30, lean, cocky and merry): SF_Actor2_5 (the grin and the raised
# finger - "you, to the army!") repainted to match his map sheet ($Npc_Werbownik): a wide navy felt hat with a brown band and a
# long white plume curling up its far side (the soft hat of SF_Actor2_4, widened), the green spiky hair dark brown and tamed
# under it, a short thick dark moustache over the grin (painted); below the head everything new: the garrison's light blue
# doublet with the orange phoenix on the chest, a white falling collar edged navy, orange slashes down the sleeves, a white
# cuff at the raised hand's wrist. (The drum at his belt is below the bust's frame.)
# Run: python tools/busts/make_werbownik.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken
from make_rotmistrz import LDIR, phoenix

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Werbownik_Bust.png')
b = Bust('SF_Actor2_5')
S = b.img.shape

# the map's colours ($Npc_Werbownik front frame): hat (35, 55, 92)/(26, 41, 73)/(58, 83, 119), band (87, 51, 30)/(138, 85, 54), plume
# (242, 242, 241)/(180, 186, 187)/(127, 129, 131), hair and moustache (43, 29, 22)/(21, 18, 21)/(87, 51, 30), doublet (210, 228, 235)/
# (142, 187, 214)/(86, 121, 153), collar (242, 242, 241) edged navy, phoenix and slashes (227, 120, 39)/(227, 136, 58)/(235, 224, 211)
NAVY_HAT = [(0.0, (10, 16, 32)), (0.2, (20, 32, 60)), (0.38, (30, 48, 84)), (0.55, (42, 64, 104)), (0.72, (58, 84, 124)), (0.88, (80, 108, 146))]
BAND_T = ((62, 34, 18), (98, 60, 34), (140, 88, 56))
PLUME_T = ((150, 154, 158), (232, 234, 236), (252, 252, 250))
HAIR_T = ((22, 16, 14), (42, 28, 20), (72, 48, 32), (12, 8, 8))
MOUS_T = ((24, 16, 12), (44, 30, 22), (78, 50, 32), (14, 10, 8))
DOUB_T = ((120, 166, 196), (194, 218, 232), (226, 240, 246), (92, 130, 160))
SLASH_T = ((186, 86, 24), (227, 124, 42), (244, 164, 84))
COLLAR_T = ((176, 182, 188), (240, 240, 238), (252, 252, 250))
NAVY_T = ((20, 30, 56), (35, 55, 92), (60, 84, 122))
SKIN_T = ((206, 146, 104), (238, 190, 142), (250, 214, 170))
PHX_T = ((190, 92, 26), (227, 120, 39), (240, 150, 70))
PHX_LINE = (120, 52, 14)
PHX_GLOW = (240, 214, 180)


def plume(shape, quill, tones, width=24.0, seed=1):
    """A long soft ostrich plume along quill (base, bend, tip): a vane widest past the middle, its outer edge ragged with fronds,
    barbs drawn from the shaft, the shaft itself. -> RGBA layer"""
    p = bez(quill[0], quill[1], quill[2], 40)
    d = np.gradient(p, axis=0)
    d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
    n = np.stack([-d[:, 1], d[:, 0]], 1)
    t = np.linspace(0, 1, len(p))
    w = width * np.sin(np.pi * np.clip(t * 0.9 + 0.08, 0, 1)) ** 0.8 + 3
    inner = [tuple(q) for q in p - n * (w * 0.35)[:, None]]
    outer_pts = [tuple(q) for q in p + n * (w * 0.65)[:, None]]
    outer = strand_edge(outer_pts[::4] + [outer_pts[-1]], side=-1, seg=7, tip=5, out=3.0, seed=seed)
    lay = cel(shape, [outer + inner[::-1]], tones, lw=1.3, shade=4, light=2, ldir=LDIR)
    m = erode_cv(lay[..., 3] > 0.5, 1)
    barbs = []
    for i in range(3, len(p) - 3, 3):
        a = p[i]
        b_ = a + n[i] * w[i] * 0.55 + d[i] * w[i] * 0.35
        barbs.append((tuple(a), tuple((a + b_) / 2 + d[i] * 2), tuple(b_), 1.0))
    lay = over(lay, strokes(shape, barbs, tones[0], alpha=0.6, clip=m, taper_to=0.2))
    lay = over(lay, strokes(shape, [(tuple(p[0]), tuple(p[20]), tuple(p[-1]), 1.6)], tones[0], alpha=0.9, clip=m, taper_to=0.3))
    return lay

hd, s, v = hsv_of(b.src)
# ---- the hair: green -> very dark brown, the spikes sticking out round the head go (it lies under the hat) ----
hair = b.sel(hue=(80, 215), sat=(0.12, 1), box=(60, 0, 300, 230))
hair = b.grow(hair, 1, 0.2) & region(S, 60, 0, 300, 230)
b.ramp(hair, [(0.0, (8, 6, 6)), (0.15, (20, 14, 12)), (0.3, (36, 24, 18)), (0.45, (52, 36, 26)), (0.6, (72, 50, 36)), (0.8, (100, 72, 52))],
       gain=1.1)
SIL = [(98, 0), (98, 98), (104, 126), (110, 150), (120, 162), (200, 162), (214, 172), (226, 184), (240, 178), (252, 160), (260, 136),
       (264, 108), (266, 0)]
cut = hair & ~b.poly(SIL)
b.erase(cut)
sil_edge = SIL[1:-1]
b.over(strokes(S, [(sil_edge[i], ((np.asarray(sil_edge[i]) + np.asarray(sil_edge[i + 1])) / 2).tolist(), sil_edge[i + 1], 1.8)
                   for i in range(len(sil_edge) - 1)], LINE, alpha=1.0, taper_to=1.0, clip=dilate(hair & b.poly(SIL), 1) & dilate(cut, 2)))

# ---- the short thick dark moustache over the grin (following the tilt of the head) ----
MOUS = [(132, 184), (137, 176), (147, 171), (159, 168), (171, 164), (182, 160), (190, 161), (192, 167), (184, 170), (172, 173), (160, 177),
        (148, 181), (139, 186)]
ml = cel(S, [MOUS], MOUS_T[:3], lw=1.4, shade=2.5, light=1.4, ldir=LDIR)
ml = over(ml, hair_strands(S, erode_cv(ml[..., 3] > 0.5, 1), (160, 196), MOUS_T[2], MOUS_T[3], n=22, length=(4, 7), seed=12))
b.over(ml)
# a touch more colour in the merry face
skin = b.sel(hue=(10, 45), sat=(0.15, 0.7), val=(0.55, 1), box=(100, 90, 240, 215))
b.over(blush(S, 196, 160, 14, 9, col=(230, 120, 92), alpha=0.22, clip=skin))
b.over(blush(S, 126, 168, 9, 7, col=(230, 120, 92), alpha=0.18, clip=skin))

# ---- what stays: the head (face, ear, the hair under the hat) and the raised hand (the bandana, the T-shirt and the bandage go) ----
HEAD = [(60, 0), (300, 0), (300, 186), (240, 186), (226, 186), (214, 186), (200, 200), (184, 208), (166, 212), (148, 210), (134, 196),
        (118, 176), (100, 160), (60, 140)]
keep = b.poly(HEAD) & b.op() & ~b.sel(hue=(340, 20), sat=(0.55, 1), val=(0.2, 1)) & ~b.sel(hue=(40, 70), sat=(0.5, 1))
keep &= ~(b.sel(lum=(0, 0.2)) & ~hair & region(S, 120, 176, 300, 230) & ~b.poly([(130, 150), (215, 150), (215, 205), (150, 214)]))
HAND = [(0, 112), (52, 112), (56, 246), (0, 248)]
keep |= b.poly(HAND) & b.op() & ~(b.sel(sat=(0, 0.25), val=(0.85, 1)) & (b.yy > 238))
keep |= ml[..., 3] > 0.02
head = take(b.img, keep)
hm = head[..., 3] > 0.5

# ---- the body (new): neck, doublet, the far arm's sleeves (raised: upper arm down, forearm up to the hand), the collar ----
lay = np.zeros(S[:2] + (4,), np.float32)
NECK = [(144, 186), (206, 168), (226, 200), (216, 226), (160, 230), (144, 208)]
lay = over(lay, cel(S, [NECK], SKIN_T, lw=1.6, shade=10, light=2, ldir=LDIR))
DOUB = [(56, 350), (52, 262), (64, 238), (96, 224), (140, 208), (214, 196), (262, 210), (300, 230), (330, 250), (330, 350)]
db = celf(S, [DOUB], DOUB_T[:3], lw=2.0, shade=14, light=3, ldir=LDIR)
dm = erode_cv(db[..., 3] > 0.5, 2)
darken(db, b.poly([(262, 200), (330, 200), (330, 350), (286, 350), (280, 280)]) & dm,
       np.asarray(DOUB_T[0], np.float32) / np.asarray(DOUB_T[1], np.float32))           # (the near side turning away)
# the near sleeve's seam and its orange slashes; folds of the doublet
db = over(db, strokes(S, [((262, 214), (270, 260), (282, 350), 1.4)], DOUB_T[3], alpha=0.85, clip=dm, taper_to=1.0))
for x0 in (288, 304, 320):
    db = over(db, cel(S, [taper(bez((x0 - 2, 232 + (x0 - 288) * 0.6), (x0, 252 + (x0 - 288) * 0.6), (x0 + 2, 274 + (x0 - 288) * 0.6), 14), 4, 3)],
                      SLASH_T, lw=0.9, shade=1.0, light=0.7, ldir=LDIR, clip=dm & ~b.poly([(240, 200), (276, 200), (286, 350), (240, 350)])))
db = over(db, strokes(S, [((120, 352), (124, 320), (132, 290), 6.0), ((236, 352), (232, 322), (226, 296), 6.0)], DOUB_T[0], clip=dm,
                      taper_to=0.05), k=0.7)
db = over(db, phoenix(S, 128, 246, 0.72, PHX_T, PHX_LINE, PHX_GLOW))
lay = over(lay, db)
# the far upper arm (the raised arm's, going down to the elbow below the frame): a sleeve with orange slashes
SLV_F = [(40, 350), (44, 300), (50, 262), (66, 236), (98, 238), (112, 268), (110, 310), (100, 350)]
sf = celf(S, [SLV_F], DOUB_T[:3], lw=2.0, shade=9, light=3, ldir=LDIR)
sfm = erode_cv(sf[..., 3] > 0.5, 2)
for x0 in (66, 82, 98):
    sf = over(sf, cel(S, [taper(bez((x0 + 2, 248), (x0, 266), (x0 - 2, 288), 14), 4, 3)], SLASH_T, lw=0.9, shade=1.0, light=0.7, ldir=LDIR,
                      clip=sfm))
lay = over(lay, sf)
# the forearm up to the raised hand: sleeve, slashes, the white cuff at the wrist
SLV_A = [(0, 274), (30, 268), (46, 276), (52, 310), (58, 350), (0, 350)]
sa = celf(S, [SLV_A], DOUB_T[:3], lw=2.0, shade=8, light=3, ldir=LDIR)
sam = erode_cv(sa[..., 3] > 0.5, 2)
lay = over(lay, sa)
CUFF = [(0, 242), (30, 240), (36, 258), (40, 278), (0, 284)]
cf = celf(S, [CUFF], COLLAR_T, lw=1.8, shade=4, light=2, ldir=LDIR)
cf = over(cf, strokes(S, [((2, 278), (20, 274), (38, 272), 2.2)], NAVY_T[1], alpha=0.9, clip=erode_cv(cf[..., 3] > 0.5, 1), taper_to=1.0))
lay = over(lay, cf)
# the falling collar: white, lying on the shoulders round the neck, edged navy
COL = [(116, 210), (126, 224), (148, 232), (172, 234), (180, 228), (188, 234), (208, 228), (228, 216), (244, 202), (230, 192), (210, 204),
       (182, 212), (156, 212), (134, 204), (122, 198)]
co = cel(S, [COL], COLLAR_T, lw=1.8, shade=5, light=2, ldir=LDIR)
com = erode_cv(co[..., 3] > 0.5, 1)
EDGE = [(117, 211), (126, 224), (148, 232), (172, 234), (180, 228), (188, 234), (208, 228), (228, 216), (243, 203)]
co = over(co, strokes(S, [(EDGE[i], ((np.asarray(EDGE[i]) + np.asarray(EDGE[i + 1])) / 2).tolist(), EDGE[i + 1], 3.2) for i in range(len(EDGE) - 1)],
                      NAVY_T[1], alpha=1.0, clip=com, taper_to=1.0))
co = over(co, strokes(S, [((182, 214), (181, 221), (180, 228), 1.2)], COLLAR_T[0], alpha=0.8, clip=com))   # (where its two halves meet)
darken(lay, shift(co[..., 3] > 0.5, 2, 5) & ~(co[..., 3] > 0.5) & (lay[..., 3] > 0.5), (0.72, 0.72, 0.78))
lay = over(lay, co)
darken(lay, shift(hm & (b.yy > 150) & (b.xx > 100), 2, 8) & ~hm & (lay[..., 3] > 0.5), (0.66, 0.62, 0.68))
b.img = over(lay, head)

# ---- the hat: navy felt, wide, tilted with the head; a brown band; a long white plume curling up its far side ----
M = affine(scale=(1.42, 1.1), rot=-10, src_pt=(143, 92), dst_pt=(162, 124))
hat = bucket_hat(M, S, NAVY_HAT, gain=1.0, band=BAND_T)
hat = over(plume(S, [(98, 106), (4, 58), (112, 4)], PLUME_T, width=30.0, seed=4), hat)
put_hat(b, hat, shadow=(130, 110, 120), shadow_k=0.5, sdx=2, sdy=9, keep=b.poly(HAND))
b.over(take(head, b.poly(HAND)))                                                       # (the raised hand in front of the brim)
b.save(OUT)
print('ok', OUT)
