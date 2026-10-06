# Kuba Woziwoda (the water carrier): SF_Actor2_3 repainted - brown hair, brown eyes, a sun-tanned face, the blue shirt an
# off-white linen one with a brown leather vest over it, and a straw hat (the bucket hat of SF_Actor2_4 recoloured to straw,
# widened, with a woven texture and a dark band). Run: python tools/busts/make_woziwoda.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Woziwoda_Bust.png')
b = Bust('SF_Actor2_3')
S = b.img.shape

# ---------- hair and eyes ----------
hair = b.sel(hue=(270, 360), sat=(0.25, 1), box=(60, 0, 270, 200)) & ~b.poly([(130, 160), (180, 160), (180, 185), (130, 185)])
hair |= b.sel(hue=(0, 25), sat=(0.1, 1), box=(60, 0, 270, 92))
hair |= b.lines_of(hair, 1, 0.25) & b.poly([(60, 0), (270, 0), (270, 150), (60, 150)])
HAIR = [(0.0, (30, 18, 12)), (0.15, (56, 34, 20)), (0.3, (90, 56, 32)), (0.45, (124, 82, 48)), (0.6, (160, 112, 68)),
        (0.8, (200, 156, 108))]
b.ramp(hair, HAIR)
eyes = b.sel(hue=(250, 320), sat=(0.15, 1), polys=[[(100, 108), (142, 112), (140, 132), (100, 130)], [(160, 106), (190, 104), (190, 124), (160, 124)]])
b.ramp(eyes, [(0.0, (20, 10, 6)), (0.2, (60, 34, 18)), (0.45, (120, 74, 40)), (0.7, (180, 130, 80))])

# ---------- skin: sun-tanned, a little red ----------
skin = b.sel(hue=(0, 45), sat=(0.08, 0.7), val=(0.35, 1), box=(80, 80, 260, 300)) & ~hair
skin |= b.sel(hue=(340, 360), sat=(0.15, 0.6), val=(0.5, 1), box=(80, 80, 260, 300)) & ~hair
b.multiply(skin, (232, 196, 166), 1.0)
b.over(blush(S, 132, 146, 15, 8, (220, 96, 70), 0.22, clip=skin))
b.over(blush(S, 205, 140, 12, 7, (220, 96, 70), 0.18, clip=skin))

# ---------- the shirt: off-white linen; a leather vest over it ----------
shirt = b.sel(hue=(165, 250), sat=(0.08, 1), box=(0, 160, 330, 350)) & ~eyes
shirt = b.grow(shirt, 2, 0.3) & region(S, 0, 160, 330, 350)
LINEN = [(0.0, (34, 28, 24)), (0.12, (82, 72, 62)), (0.35, (168, 156, 136)), (0.55, (208, 198, 178)), (0.75, (232, 224, 206)),
         (0.9, (246, 242, 230))]
b.ramp(shirt, LINEN, gain=1.0)
COLLAR_L = [(140, 183), (132, 196), (118, 214), (103, 233), (93, 246), (110, 239), (126, 233), (136, 247), (145, 270), (147, 256),
            (145, 230), (143, 205)]
COLLAR_R = [(198, 170), (212, 177), (219, 200), (215, 222), (217, 240), (215, 254), (200, 241), (182, 232), (171, 243), (161, 262),
            (152, 274), (163, 238), (179, 214), (195, 190)]
collar = b.poly(COLLAR_L, COLLAR_R)
VEST_L = [(93, 247), (108, 241), (121, 239), (125, 262), (127, 300), (127, 352), (58, 352), (56, 320), (61, 290), (71, 262)]
VEST_R = [(213, 232), (231, 212), (246, 220), (255, 248), (263, 290), (267, 352), (176, 352), (178, 300), (182, 262), (188, 241),
          (200, 237)]
cloth = shirt & ~collar
vest = soft_poly(S, [VEST_L, VEST_R]) * cloth
LEATHER = [(0.0, (22, 12, 8)), (0.15, (46, 26, 14)), (0.35, (86, 50, 26)), (0.55, (118, 72, 38)), (0.75, (146, 96, 54)),
           (0.92, (178, 128, 80))]
b.ramp(vest > 0, LEATHER, gain=1.0, soft=vest)
b.over(outline(S, [VEST_L, VEST_R], lw=2.2, clip=cloth))
# its stitched edge and a button loop
b.over(strokes(S, [((121, 246), (124, 290), (125, 345), 0.9), ((185, 246), (181, 290), (180, 345), 0.9)], (196, 160, 112), alpha=0.6))
# the shirt's buttons: bone
btn = b.sel(hue=(200, 250), sat=(0.6, 1), val=(0, 0.6), box=(130, 270, 165, 350))
b.ramp(btn, [(0.0, (40, 30, 22)), (0.2, (120, 100, 76)), (0.4, (200, 186, 160))], gain=2.0)

# ---------- the straw hat ----------
STRAW = [(0.0, (52, 34, 14)), (0.2, (120, 84, 34)), (0.38, (176, 132, 62)), (0.55, (212, 172, 92)), (0.72, (234, 204, 128)),
         (0.88, (246, 228, 170))]


def hat_mask(d):
    m = d.sel(hue=(185, 240), sat=(0.15, 1), box=(40, 0, 245, 120))
    return d.grow(m, 3, 0.35) & region(d.img.shape, 40, 0, 245, 122)


M = affine(scale=(1.24, 1.1), rot=4, src_pt=(143, 92), dst_pt=(166, 90))
hat = hat_from('SF_Actor2_4', hat_mask, M, S, STRAW, gain=1.05, bias=0.02)
ha = hat[..., 3] > 0.5
# woven texture: short darker dashes in rows following the crown and the brim
rng = np.random.RandomState(5)
rows = []
for k in range(9):
    y0 = 18 + k * 9
    for x0 in range(70, 290, 7):
        if rng.rand() < 0.55:
            yc = y0 + 0.0006 * (x0 - 170) ** 2 * (1 if k > 4 else -0.4)
            rows.append(((x0, yc), (x0 + 2.5, yc + 0.6), (x0 + 5, yc + 0.4), 1.0))
weave = strokes(S, rows, (130, 92, 40), alpha=0.45, clip=erode_cv(ha, 2))
hat = over(hat, weave)
# the band: a dark brown ribbon on the crown, just above where it meets the brim (the donor's line, moved like the hat)
def tr(pts):
    return [tuple(M[:, :2] @ np.array(p, np.float64) + M[:, 2]) for p in pts]


JOIN = [(78, 48), (100, 44), (120, 43), (140, 44), (160, 46), (180, 50), (200, 56), (214, 63)]
TOP = [(214, 53), (200, 46), (180, 40), (160, 36), (140, 34), (120, 33), (100, 34), (78, 38)]
band = cel(S, [tr(JOIN + TOP)], ((50, 28, 16), (84, 48, 26), (118, 74, 42)), lw=1.3, shade=3.0, light=1.4, clip=erode_cv(ha, 1))
hat = over(hat, band)
put_hat(b, hat, shadow=(160, 120, 110), shadow_k=0.55, sdx=2, sdy=9)

b.save(OUT)
print('ok', OUT)
