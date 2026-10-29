# Jedrek Dudarz (the travelling bagpiper from the ferry, wiry, about 40, boastful and merry): People2_7 (the wiry grinning face)
# repainted to match his map sheet ($Npc_Grajek): the grin kept, the blond spiky hair dark brown and under a floppy grey-brown felt
# cap (the soft hat of SF_Actor2_4, small) with red, blue and yellow ribbons tied to its band, the goggles gone under it, the
# moustache and a few days' stubble dark brown, a merry ruddy face; below the head everything new: the leather straps, pads and
# collar painted over as a cream linen shirt with an open collar and a patched vest of red, ochre and olive-green patches with
# stitches, the bagpipe's wooden drones rising behind the near shoulder and the top of its goatskin bag at the edge.
# 0 PixelLab generations. Run: python tools/busts/make_grajek.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Grajek_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('People2_7')
S = b.img.shape

# the map's colours ($Npc_Grajek front frame): cap (112, 101, 89)/(87, 73, 58)/(71, 64, 55)/(48, 41, 33), ribbons (100, 18, 20)/
# (80, 113, 167)/(230, 217, 89), hair (73, 49, 34)/(48, 41, 33), skin (238, 189, 149)/(221, 168, 133)/(199, 152, 117), stubble
# (160, 121, 84), shirt (229, 217, 191)/(204, 187, 160)/(189, 168, 135), vest patches (160, 67, 49)/(184, 133, 69)/(107, 106, 70),
# bagpipe (205, 166, 113)/(160, 121, 84)/(130, 93, 59)
CAP = [(0.0, (16, 12, 10)), (0.18, (48, 41, 33)), (0.34, (71, 64, 55)), (0.5, (87, 78, 66)), (0.66, (104, 94, 82)), (0.8, (116, 106, 94)),
       (1.0, (140, 132, 118))]
BAND_T = ((40, 32, 26), (62, 52, 42), (86, 74, 62))
HAIR = [(0.0, (16, 10, 8)), (0.2, (40, 28, 20)), (0.4, (62, 42, 28)), (0.6, (84, 58, 40)), (0.8, (108, 78, 54)), (1.0, (132, 100, 72))]
STUB = (70, 48, 32)
SHIRT_T = ((189, 168, 135), (229, 217, 191), (242, 236, 218), (204, 187, 160))
RED_T = ((112, 40, 28), (160, 67, 49), (190, 96, 72))
OCHRE_T = ((138, 94, 42), (184, 133, 69), (212, 168, 104))
GREEN_T = ((74, 74, 46), (107, 106, 70), (136, 134, 94))
WOOD_T = ((130, 93, 59), (178, 140, 92), (212, 178, 128))
BAG_T = ((140, 104, 66), (190, 152, 102), (218, 186, 136))
RIB = {'red': ((100, 18, 20), (164, 40, 40), (206, 84, 76)), 'blue': ((54, 80, 128), (80, 113, 167), (126, 156, 200)),
       'yellow': ((186, 164, 50), (230, 217, 89), (246, 238, 160))}

hd, s, v = hsv_of(b.src)
op = b.op()
FACE = [(96, 112), (176, 100), (226, 120), (232, 160), (214, 196), (180, 214), (140, 206), (110, 180), (98, 150)]

# ---------- hair: dark brown (the goggles' metal and glass left under the cap's brim: hair too) ----------
hair = (b.sel(hue=(20, 60), sat=(0.15, 0.7), val=(0, 0.78), box=(50, 0, 270, 200)) | b.sel(hue=(38, 60), sat=(0, 0.35), val=(0.6, 1),
                                                                                           box=(50, 0, 270, 140))) & ~b.poly(FACE)
hair |= b.sel(sat=(0, 0.3), box=(50, 40, 270, 150)) & ~b.poly(FACE)
hair |= b.sel(hue=(180, 260), box=(50, 40, 270, 150)) & ~b.poly(FACE)
hair |= b.sel(hue=(38, 62), sat=(0.12, 0.7), val=(0.45, 1), box=(164, 66, 200, 118))         # (the blond lock in front of the ear)
b.ramp(hair, HAIR, gain=1.0)
# the moustache dark brown
must = b.sel(hue=(20, 62), sat=(0.15, 0.8), val=(0, 0.82), box=(108, 156, 192, 186))
b.ramp(must, [(0.0, (20, 14, 10)), (0.25, (48, 34, 24)), (0.45, (76, 54, 38)), (0.6, (98, 72, 50))])
# the eyes: dark brown (blue in the RTP face)
eye = b.sel(hue=(180, 240), sat=(0.25, 1), box=(80, 108, 172, 150))
b.ramp(eye, [(0.0, (16, 10, 8)), (0.3, (52, 34, 22)), (0.6, (98, 66, 40)), (0.85, (150, 112, 74)), (1.0, (240, 230, 214))])

# ---------- the face: merry, ruddy; a few days' stubble on the jaw and chin ----------
skin = b.sel(hue=(0, 45), sat=(0.15, 0.75), val=(0.45, 1), box=(84, 95, 240, 225)) & ~hair & ~must
b.over(blush(S, 124, 156, 14, 8, (220, 96, 76), 0.3, clip=skin))
b.over(blush(S, 200, 150, 11, 8, (220, 96, 76), 0.26, clip=skin))
JAWS = [(96, 152), (104, 172), (116, 190), (130, 204), (146, 212), (164, 212), (180, 204), (194, 190), (206, 172), (214, 150), (216, 130),
        (206, 140), (196, 156), (184, 166), (176, 174), (176, 192), (160, 198), (136, 196), (116, 184), (110, 172), (104, 160)]
TEETH = b.sel(sat=(0, 0.2), val=(0.7, 1), box=(110, 165, 185, 200))
face = skin & ~dilate_cv(TEETH, 2) & ~b.sel(lum=(0, 0.35))
b.multiply(soft_poly(S, [JAWS], blur=1.5) * face, (226, 200, 186), 1.0)
b.over(stubble(S, JAWS, STUB, density=0.5, seed=3, alpha=0.6, clip=face))
LIP = [(110, 168), (120, 158), (134, 154), (150, 152), (166, 152), (178, 158), (170, 160), (150, 158), (128, 162)]
b.over(stubble(S, LIP, STUB, density=0.4, seed=4, alpha=0.45, clip=face))

# ---------- what stays: the head and the neck (the high leather collar, the pads, the straps and the vest go) ----------
JAW_N = [(198, 150), (192, 160), (184, 174), (174, 188), (162, 200), (150, 210)]     # (the near jaw's line, down to the chin)
HEAD = [(30, 0), (300, 0), (300, 136), (232, 136), (216, 146)] + JAW_N + [(142, 211), (122, 200), (104, 182), (90, 160), (30, 170)]
khaki = b.sel(hue=(30, 70), sat=(0.3, 1), val=(0.2, 1), box=(100, 140, 300, 300)) & ~b.poly(FACE)
khaki = b.grow(khaki, 2, 0.3) & region(S, 100, 140, 300, 300) & ~b.poly(FACE)
keep = b.poly(HEAD) & op & ~khaki
head = take(b.img, keep)
hm = head[..., 3] > 0.5

lay = np.zeros(S[:2] + (4,), np.float32)
# ---------- the bagpipe's drones behind the near shoulder (behind everything) ----------
def drone(p0, p1, w, ring_ts, cap):
    d = np.asarray(p1, np.float64) - np.asarray(p0, np.float64)
    L = np.linalg.norm(d); u = d / L; n = np.array([-u[1], u[0]])
    pipe = cel(S, [taper(np.stack([p0, p1]), w, w * 0.8)], WOOD_T, lw=1.6, shade=2.5, light=1.4, ldir=LDIR)
    for t in ring_ts:
        c = np.asarray(p0) + d * t
        pipe = over(pipe, cel(S, [taper(np.stack([c - u * 3, c + u * 3]), w + 5, w + 5)], ((220, 206, 176), (244, 236, 214), (252, 250, 240)),
                              lw=1.2, shade=1.5, light=0.8, ldir=LDIR))
    tip = np.asarray(p1) + u * cap * 0.6
    pipe = over(pipe, cel(S, [taper(np.stack([np.asarray(p1) - u * 2, tip + u * cap * 0.4]), w + 2, w + cap * 0.9)], WOOD_T, lw=1.4, shade=2,
                          light=1.2, ldir=LDIR))
    return pipe


lay = over(lay, drone((246, 300), (300, 146), 12, (0.45, 0.75), 13))
lay = over(lay, drone((262, 300), (318, 192), 10, (0.5,), 11))
lay = over(lay, cel(S, [ellipse(306, 246, 5, 3.5)], ((150, 30, 30), (196, 56, 50), (226, 110, 96)), lw=1.0, shade=1, light=0.8, ldir=LDIR))
lay = over(lay, strokes(S, [((300, 158), (308, 200), (304, 246), 1.6)], (196, 56, 50), alpha=0.9))                 # (a red cord between them)

# ---------- the body (new): the cream linen shirt, its open collar, the patched vest ----------
SHIRT = [(22, 350), (26, 296), (40, 254), (72, 230), (124, 214), (200, 204), (250, 212), (292, 232), (318, 262), (330, 300), (330, 350)]
sh = celf(S, [SHIRT], SHIRT_T[:3], lw=2.0, shade=12, light=3, ldir=LDIR)
shm = erode_cv(sh[..., 3] > 0.5, 2)
darken(sh, b.poly([(290, 220), (330, 220), (330, 350), (304, 350)]) & shm, np.asarray(SHIRT_T[0], np.float32) / np.asarray(SHIRT_T[1], np.float32))
WED = [taper(bez((38, 270), (30, 300), (24, 330), 14), 2, 0.3, w_mid=7), taper(bez((300, 262), (312, 292), (322, 320), 14), 2, 0.3, w_mid=8)]
sh = over(sh, cel(S, WED, (SHIRT_T[3],) * 3, outline=False, shade=0, light=0, clip=shm))
lay = over(lay, sh)
# the vest: two panels (sleeveless), the shirt's front between them
VEST_F = [(40, 350), (46, 300), (60, 262), (84, 236), (128, 222), (142, 262), (150, 300), (152, 350)]
VEST_N = [(292, 350), (284, 300), (276, 262), (262, 230), (226, 212), (204, 236), (196, 290), (194, 350)]
vt = celf(S, [VEST_F, VEST_N], RED_T, lw=2.0, shade=9, light=3, ldir=LDIR)
vm = erode_cv(vt[..., 3] > 0.5, 1)
# patches sewn on: ochre, olive green, another ochre and green on the near side (the vest is red under them)
vt = patch(vt, [(52, 300), (98, 288), (104, 340), (50, 350)], vm, lift=1.18, hue=(33, 0.62), seed=1, stitch=(240, 226, 190))
vt = patch(vt, [(94, 238), (130, 226), (140, 268), (100, 276)], vm, lift=0.7, hue=(58, 0.36), seed=2, stitch=(240, 226, 190))
vt = patch(vt, [(112, 298), (148, 292), (150, 330), (116, 334)], vm, lift=0.72, hue=(58, 0.36), seed=3, stitch=(240, 226, 190))
vt = patch(vt, [(222, 250), (262, 244), (272, 290), (226, 296)], vm, lift=1.18, hue=(33, 0.62), seed=4, stitch=(240, 226, 190))
vt = patch(vt, [(206, 312), (250, 306), (256, 350), (204, 350)], vm, lift=0.72, hue=(58, 0.36), seed=5, stitch=(240, 226, 190))
vt = over(vt, strokes(S, [((84, 352), (90, 320), (96, 292), 6.0), ((250, 352), (246, 322), (240, 296), 6.0)], RED_T[0], clip=vm, taper_to=0.05),
          k=0.45)
lay = over(lay, vt)
# the neck (wiry, a shadow under the chin), then the open collar of the shirt round it
SKIN_T = ((199, 152, 117), (238, 189, 149), (248, 210, 176))
NECK = [(126, 194), (176, 186), (194, 150), (214, 146), (228, 176), (224, 222), (196, 262), (160, 270), (134, 242)]
nk = cel(S, [NECK], SKIN_T, lw=1.8, shade=14, light=2, ldir=LDIR)
nkm = erode_cv(nk[..., 3] > 0.5, 2)
nk = over(nk, strokes(S, [((150, 222), (156, 244), (162, 262), 1.4), ((190, 218), (186, 240), (178, 262), 1.4)], (186, 130, 100), alpha=0.6,
                      clip=nkm))                                                                       # (the cords of a wiry neck)
nk = over(nk, stubble(S, [(132, 204), (206, 194), (212, 214), (170, 226), (136, 218)], STUB, density=0.35, seed=8, alpha=0.4, clip=nkm))
lay = over(lay, nk)
# dark brown hair at the nape, behind the ear (under the cap's brim)
NAPE = strand_edge([(212, 118), (234, 124), (238, 146), (230, 168)], side=1, seg=7, tip=5, out=2.5, seed=17) + [(218, 160), (210, 138)]
np_ = cel(S, [NAPE], ((40, 28, 20), (62, 42, 28), (90, 64, 44)), lw=1.5, shade=3, light=1.4, ldir=LDIR)
lay = over(lay, over(np_, hair_strands(S, erode_cv(np_[..., 3] > 0.5, 1), (226, 180), (98, 70, 48), (30, 20, 14), n=24, length=(4, 8), seed=18)))
COL_F = [(118, 214), (134, 204), (152, 240), (164, 270), (138, 254), (118, 230)]
COL_N = [(204, 202), (224, 196), (234, 218), (210, 244), (172, 270), (194, 232)]
lay = over(lay, cel(S, [COL_F, COL_N], SHIRT_T[:3], lw=1.8, shade=4, light=2, ldir=LDIR))
# the top of the goatskin bag under the near arm (at the frame's edge)
BAG = [(250, 352), (256, 318), (274, 296), (300, 290), (322, 300), (334, 320), (334, 352)]
bg = celf(S, [BAG], BAG_T, lw=2.0, shade=8, light=3, ldir=LDIR)
bgm = erode_cv(bg[..., 3] > 0.5, 2)
bg = over(bg, strokes(S, [((262, 330), (280, 316), (300, 312), 1.4), ((276, 346), (292, 334), (312, 330), 1.4)], BAG_T[0], alpha=0.7, clip=bgm))
lay = over(lay, bg)
darken(lay, shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5), (0.7, 0.66, 0.68))
b.img = over(lay, head)
b.over(strokes(S, [(JAW_N[i], ((np.asarray(JAW_N[i]) + np.asarray(JAW_N[i + 1])) / 2).tolist(), JAW_N[i + 1], 2.0)
                   for i in range(len(JAW_N) - 1)], LINE, alpha=1.0, taper_to=1.0))

# ---------- the cap: floppy grey-brown felt, a dark band, ribbons tied to it ----------
M = affine(scale=(1.12, 1.0), rot=-10, src_pt=(143, 92), dst_pt=(148, 104))
hat = bucket_hat(M, S, CAP, gain=1.0, band=BAND_T)
ha = hat[..., 3] > 0.5
# the ribbons: a knot at the back of the band, three streamers falling back over the brim and behind; a short red one in front
KNOT = tr_pts(M, [(206, 56)])[0]
kx, ky = KNOT
strm = [('red', (kx, ky), (kx + 14, ky + 16), (kx + 14, ky + 38), 7), ('blue', (kx + 2, ky), (kx + 22, ky + 12), (kx + 28, ky + 32), 6),
        ('yellow', (kx - 2, ky + 2), (kx + 6, ky + 22), (kx + 2, ky + 40), 6)]
rib = np.zeros(S[:2] + (4,), np.float32)
for col, p0, p1, p2, w in strm:
    rib = over(rib, cel(S, [taper(bez(p0, p1, p2, 18), w, w * 0.7, w_mid=w * 1.1)], RIB[col], lw=1.3, shade=2, light=1.2, ldir=LDIR))
rib = over(rib, cel(S, [ellipse(kx, ky, 7, 5, 0.4)], RIB['red'], lw=1.3, shade=2, light=1.2, ldir=LDIR))
F = tr_pts(M, [(92, 46)])[0]
rib = over(rib, cel(S, [taper(bez(F, (F[0] - 8, F[1] + 8), (F[0] - 10, F[1] + 18), 14), 6, 4)], RIB['red'], lw=1.2, shade=1.5, light=1,
                    ldir=LDIR))
rib = over(rib, cel(S, [taper(bez((F[0] + 5, F[1] - 1), (F[0] - 1, F[1] + 8), (F[0] - 2, F[1] + 16), 14), 5, 4)], RIB['blue'], lw=1.2,
                    shade=1.5, light=1, ldir=LDIR))
put_hat(b, hat, shadow=(140, 110, 100), shadow_k=0.5, sdx=2, sdy=9)
b.over(rib)
b.save(OUT)
print('ok', OUT)
