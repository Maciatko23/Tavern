# Wawrzyn Owczarz (the shepherd of the meadows, about 55, weathered): People1_5 repainted to match his map sheet ($Npc_Pasterz):
# a sun-browned, lined face (forehead lines, crow's feet, deep folds from the nose, ruddy cheeks), the dark hair grey (only at the
# temples and behind the ear under the hat), the thin moustache under a short full grey beard and moustache (painted); a brown
# felt hat with a soft floppy brim (the soft hat of SF_Actor2_4, flattened felt); the brown coat a warm suede sheepskin coat with a
# thick cream fleece shawl collar round the neck and down both fronts (painted, curly wool), the open cream shirt under it a
# plain dark linen shirt.
# Run: python tools/busts/make_pasterz.py [out.png]
import sys
from kit import *
from make_kapral import celf

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Pasterz_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('People1_5')
S = b.img.shape

# the map's colours ($Npc_Pasterz front frame): hat and coat (122, 88, 56)/(80, 54, 35)/(164, 117, 89), fleece (244, 225, 179)/
# (218, 193, 149)/(201, 179, 138), beard and hair (112, 108, 103)/(86, 78, 71) + light grey, skin (221, 153, 109)
SUEDE = [(0.0, (24, 14, 8)), (0.15, (52, 34, 20)), (0.3, (80, 54, 34)), (0.48, (106, 74, 46)), (0.66, (126, 90, 58)), (0.82, (150, 110, 74)),
         (1.0, (172, 132, 94))]
FELT = [(0.0, (26, 16, 10)), (0.18, (56, 38, 24)), (0.36, (84, 58, 36)), (0.54, (110, 78, 50)), (0.72, (132, 96, 62)), (0.9, (156, 118, 80))]
FLEECE_T = ((196, 172, 130), (232, 214, 172), (248, 238, 210), (168, 144, 106))
SHIRT_T = ((46, 40, 34), (70, 62, 52), (94, 84, 72))
GREY_T = ((112, 108, 104), (160, 156, 150), (204, 200, 194), (84, 80, 78))
op = b.op()

# ---- hair: grey (the hat hides the most of it) ----
eyes = b.poly([(100, 96), (176, 96), (176, 122), (100, 122)])
hair = (b.sel(sat=(0, 0.32), val=(0, 0.72), box=(40, 0, 260, 170)) | b.sel(hue=(190, 265), val=(0, 0.5), box=(40, 0, 260, 170))) & ~eyes
hair &= ~b.poly([(112, 136), (186, 136), (186, 166), (112, 166)])                 # (the old moustache: under the beard)
b.ramp(hair, [(0.0, (40, 38, 40)), (0.06, (70, 68, 70)), (0.12, (112, 110, 110)), (0.3, (156, 154, 150)), (0.55, (196, 194, 190)),
              (0.8, (226, 224, 220))])

# ---- a sun-browned, weathered face ----
skin = b.sel(hue=(0, 45), sat=(0.12, 0.8), val=(0.45, 1), box=(80, 60, 240, 260)) & ~hair
b.multiply(skin, (236, 196, 168), 0.75)
b.over(blush(S, 186, 136, 15, 9, (200, 84, 60), 0.3, clip=skin))
b.over(blush(S, 116, 132, 9, 7, (200, 84, 60), 0.22, clip=skin))
b.over(blush(S, 150, 128, 7, 5, (200, 84, 60), 0.22, clip=skin))
WR = (140, 84, 58)
b.over(strokes(S, [((126, 66), (150, 61), (178, 64), 1.3), ((130, 74), (152, 70), (174, 72), 1.2), ((138, 82), (154, 79), (168, 80), 1.0),
                   ((182, 102), (189, 106), (196, 105), 1.2), ((182, 109), (189, 113), (195, 113), 1.1), ((110, 108), (105, 112), (101, 112), 1.0),
                   ((166, 128), (174, 142), (180, 156), 1.6), ((122, 124), (120, 134), (122, 142), 1.2),
                   ((150, 118), (160, 121), (170, 119), 1.0), ((112, 120), (118, 124), (124, 123), 0.9)], WR, alpha=0.6, clip=skin))

# ---- the shirt: a plain dark linen shirt over the chest (the open cream shirt and the bare chest go under it) ----
SHIRT = [(120, 214), (150, 222), (190, 212), (222, 200), (226, 352), (118, 352)]
b.over(celf(S, [SHIRT], SHIRT_T, lw=1.6, shade=6, light=2, ldir=LDIR))
b.over(strokes(S, [((150, 226), (156, 262), (160, 300), 1.2), ((176, 226), (172, 252), (168, 280), 1.0)], SHIRT_T[0], alpha=0.8,
               clip=b.poly(SHIRT)))                                                    # (folds)

# ---- the coat: warm suede ----
coat = b.sel(hue=(0, 50), sat=(0.15, 1), box=(0, 190, 330, 350)) & ~b.sel(hue=(28, 62), sat=(0.0, 0.42), val=(0.6, 1)) & ~b.poly(SHIRT)
coat |= b.sel(hue=(250, 330), sat=(0.1, 1), box=(0, 190, 330, 350))                   # (the violet rim light on the far sleeve)
coat = b.grow(coat, 2, 0.3) & region(S, 0, 190, 330, 350) & ~b.poly(SHIRT)
b.ramp(coat, SUEDE, gain=1.0)
cream = b.sel(hue=(28, 62), sat=(0.0, 0.42), val=(0.6, 1), box=(0, 190, 330, 350)) & ~b.poly(SHIRT)
b.ramp(cream, SUEDE, gain=0.95, bias=0.05)                                              # (the old shirt's collar tips outside the new shirt)

# ---- the thick fleece shawl collar: round the back of the neck and down both fronts ----
COLLAR = [(98, 352), (96, 300), (92, 252), (98, 218), (114, 196), (140, 182), (172, 174), (204, 162), (228, 168), (244, 194), (246, 240),
          (242, 300), (244, 352), (216, 352), (214, 300), (216, 246), (210, 214), (192, 200), (166, 206), (144, 216), (130, 236), (126, 290),
          (128, 352)]
# a bumpy outer edge: tufts along the collar's line, painted as one shape with it (one outline round both)
rng = np.random.RandomState(5)
tufts = []
for k in range(0, len(COLLAR) - 1):
    p0, p1 = np.asarray(COLLAR[k], np.float64), np.asarray(COLLAR[k + 1], np.float64)
    n = int(np.linalg.norm(p1 - p0) // 8)
    for j in range(n):
        q = p0 + (p1 - p0) * (j + 0.5) / max(n, 1)
        tufts.append(ellipse(q[0] + rng.uniform(-0.6, 0.6), q[1] + rng.uniform(-0.6, 0.6), 3.0 + rng.rand() * 1.2, 2.6 + rng.rand()))
fl = celf(S, [COLLAR] + tufts, FLEECE_T[:3], lw=1.8, shade=8, light=3, ldir=LDIR)
fm = erode_cv(fl[..., 3] > 0.5, 2)
# curly wool: small arcs in the shade tone and the light tone, scattered over the collar (fixed seed)
ys, xs = np.nonzero(fm)
idx = rng.choice(len(ys), 260, replace=False)
curls_d, curls_l = [], []
for i in idx:
    x, y = float(xs[i]), float(ys[i])
    r = 2.2 + rng.rand() * 1.6
    a0 = rng.rand() * 6.28
    arc = ((x + r * np.cos(a0), y + r * np.sin(a0)), (x + r * np.cos(a0 + 1.6), y + r * np.sin(a0 + 1.6)),
           (x + r * np.cos(a0 + 3.1), y + r * np.sin(a0 + 3.1)), 1.0)
    (curls_d if rng.rand() < 0.62 else curls_l).append(arc)
fl = over(fl, strokes(S, curls_d, FLEECE_T[3], alpha=0.75, clip=fm, taper_to=0.6))
fl = over(fl, strokes(S, curls_l, (254, 248, 230), alpha=0.7, clip=fm, taper_to=0.6))
b.over(fl)

# ---- the short full grey beard and moustache ----
OUTER = [(212, 118), (213, 138), (208, 156), (198, 172), (182, 186), (164, 196), (146, 198), (128, 192), (114, 180), (104, 162), (100, 142),
         (100, 124)]
INNER = [(104, 126), (110, 140), (118, 152), (128, 164), (144, 170), (160, 168), (170, 160), (180, 148), (190, 134), (200, 118)]
MOUS = [(116, 160), (124, 150), (138, 144), (152, 142), (166, 144), (178, 150), (182, 162), (174, 160), (162, 158), (150, 160), (138, 160),
        (126, 164)]
b.over(beard2(S, OUTER, INNER, GREY_T, flow=(152, 230), mous=MOUS, mous_flow=(150, 190), seed=17, n=130, tip=4, out=2.0, seg=8,
              mous_tones=((120, 116, 112), (170, 166, 160), (212, 208, 202), (90, 86, 84))))

# ---- the brown felt hat with a soft floppy brim ----
M = affine(scale=(1.36, 1.1), rot=-4, src_pt=(143, 92), dst_pt=(156, 80))
hat = bucket_hat(M, S, FELT, gain=1.0, flatten=4.0, band=((40, 26, 16), (64, 44, 28), (88, 62, 40)))
put_hat(b, hat, shadow=(140, 110, 100), shadow_k=0.5, sdx=2, sdy=9)
b.save(OUT)
print('ok', OUT)
