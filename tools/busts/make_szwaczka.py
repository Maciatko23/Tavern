# Dorota Igła (the seamstress of the new town's Map008 - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22; thin, neat, about 30):
# SF_Actor2_8 repainted to her map sheet ($Npc_Szwaczka) - the short hair dark brown and pinned up in a BUN at the back (painted
# behind the head), brown eyes, the white coat and the grey shirt a faded PLUM wool dress (the coat's lapels its bodice), a small
# white linen collar at the neck, the yellow measuring cord hanging round her neck.
# 0 PixelLab generations. Run: python tools/busts/make_szwaczka.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Szwaczka_Bust.png')
b = Bust('SF_Actor2_8')
S = b.img.shape
LD = (0.55, 0.83)

FACE = [(112, 128), (206, 122), (214, 146), (200, 172), (170, 190), (140, 186), (116, 162)]
EYES = [(108, 112), (204, 106), (204, 136), (108, 140)]
face = b.poly(FACE) | b.poly(EYES)
skin = b.sel(hue=(0, 35), sat=(0.08, 0.6), val=(0.6, 1), box=(90, 90, 250, 270))

# ---------- the hair: dark brown, a bun behind ----------
hair = b.sel(hue=(15, 70), sat=(0.05, 0.6), val=(0.08, 0.9), box=(60, 0, 262, 182)) & ~face & ~skin
hair = b.grow(hair, 2, 0.3) & region(S, 60, 0, 262, 182) & ~b.poly(EYES)
b.ramp(hair, RAMPS['hair_dark'], gain=1.05)
HAIR_T = ((40, 24, 16), (70, 46, 32), (104, 72, 50), (26, 16, 10))
bun = cel(S, [ellipse(240, 54, 25, 23, 0.3)], HAIR_T[:3], lw=2.0, shade=8, light=3, ldir=LD)
bun = over(bun, hair_strands(S, erode_cv(bun[..., 3] > 0.5, 2), (214, 70), HAIR_T[2], HAIR_T[3], n=60, length=(6, 12), seed=7))
b.img = over(bun, b.img)          # (behind the head)
b.over(strokes(S, [((226, 40), (240, 30), (256, 44), 1.4), ((232, 70), (246, 74), (258, 62), 1.3)], HAIR_T[3], alpha=0.7))   # (the bun's coil)
# a hairpin and a loose strand over the temple
b.over(strokes(S, [((236, 38), (248, 46), (262, 50), 2.0)], (150, 150, 158), alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((118, 96), (112, 124), (118, 150), 1.6)], HAIR_T[1], alpha=0.9))

# ---------- the eyes brown ----------
iris = b.sel(hue=(20, 55), sat=(0.45, 1), poly=EYES)
b.ramp(iris, [(0.0, (24, 12, 6)), (0.3, (66, 36, 16)), (0.6, (116, 70, 34)), (0.9, (170, 120, 70))])

# ---------- the dress: plum wool (the coat and the shirt) ----------
coat = b.sel(sat=(0, 0.2), val=(0.42, 1), box=(30, 182, 310, 350)) & ~skin
shirt = b.sel(sat=(0, 0.2), val=(0.1, 0.42), box=(100, 238, 230, 350)) | b.sel(hue=(190, 290), sat=(0, 0.4), box=(100, 238, 230, 350))
cloth = b.grow(coat | shirt, 2, 0.3) & region(S, 30, 182, 310, 350) & ~skin
PLUM = [(0.0, LINE), (0.22, (44, 22, 34)), (0.36, (66, 36, 52)), (0.5, (88, 50, 70)), (0.64, (108, 66, 88)), (0.78, (126, 82, 104)),
        (0.9, (142, 98, 118)), (1.0, (158, 114, 132))]
b.ramp(cloth, PLUM)

# ---------- the white collar and the measuring cord ----------
WHITE = ((196, 190, 182), (236, 232, 224), (250, 248, 244))
COL_L = [(124, 238), (146, 252), (162, 262), (156, 274), (136, 268), (122, 254)]
COL_R = [(166, 262), (186, 250), (210, 236), (214, 250), (196, 268), (172, 274)]
b.over(cel(S, [COL_L, COL_R], WHITE, lw=1.5, shade=3, light=1.2, ldir=LD))
CORD = [((132, 226), (126, 290), (124, 352), 5.0), ((202, 222), (208, 290), (210, 352), 5.0)]
b.over(strokes(S, CORD, (96, 72, 22), alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((x0, y0), (xm, ym), (x1, y1), 3.2) for (x0, y0), (xm, ym), (x1, y1), _ in CORD], (222, 184, 64), alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((x0 - 1, y0), (xm - 1, ym), (x1 - 1, y1), 1.0) for (x0, y0), (xm, ym), (x1, y1), _ in CORD], (246, 220, 120), alpha=0.9,
               taper_to=1.0))
ticks = []
for (x0, y0), (xm, ym), (x1, y1), _ in CORD:
    for t in np.linspace(0.12, 0.95, 12):
        p = bez((x0, y0), (xm, ym), (x1, y1), 40)[int(t * 39)]
        ticks.append(((p[0] - 2, p[1]), (p[0], p[1]), (p[0] + 2, p[1]), 0.9))
b.over(strokes(S, ticks, (70, 50, 16), alpha=0.8, taper_to=1.0))
b.save(OUT)
print('ok', OUT)
