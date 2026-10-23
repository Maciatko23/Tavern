# Jagódka (Halina's daughter, about 6, the new town's Map008 - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22): SF_People1_2 repainted
# to her map sheet ($Npc_Jagodka) - the two pigtails dark brown, brown eyes, a smudge on the cheek; the red sweater a faded MOSS-GREEN
# linen dress, patched, the white collar off-white.
# 0 PixelLab generations. Run: python tools/busts/make_jagodka.py [out.png]
import sys
from kit import *
from patches import patch, smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Jagodka_Bust.png')
b = Bust('SF_People1_2')
S = b.img.shape
LD = (0.55, 0.83)
op = b.op()

FACE = [(104, 124), (214, 118), (220, 150), (206, 188), (168, 210), (132, 206), (108, 172)]
EYES = [(100, 130), (200, 124), (200, 162), (100, 166)]
skin = b.sel(hue=(0, 35), sat=(0.06, 0.6), val=(0.62, 1), box=(90, 100, 240, 260))

# ---------- the hair: dark brown ----------
hair = b.sel(hue=(15, 70), sat=(0.05, 0.6), val=(0.08, 0.9), box=(50, 40, 280, 280)) & ~b.poly(FACE) & ~b.poly(EYES) & ~skin
red = b.sel(hue=(340, 25), sat=(0.35, 1), box=(40, 200, 300, 350))
hair &= ~red
hair = b.grow(hair, 2, 0.3) & region(S, 50, 40, 280, 280) & ~b.poly(EYES) & ~skin & ~red
b.ramp(hair, RAMPS['hair_dark'], gain=1.08)
iris = b.sel(hue=(60, 215), sat=(0.15, 1), poly=EYES)
b.ramp(iris, [(0.0, (22, 12, 6)), (0.3, (64, 36, 16)), (0.6, (114, 70, 34)), (0.9, (170, 122, 72))])
b.over(blush(S, 192, 176, 8, 5, (160, 116, 90), 0.25))   # (a smudge on the cheek)

# ---------- the dress: faded moss green; the collar off-white ----------
dress = b.grow(red, 2, 0.3) & region(S, 40, 200, 300, 350) & ~skin
MOSS = [(0.0, LINE), (0.2, (36, 48, 28)), (0.32, (58, 78, 44)), (0.44, (80, 104, 60)), (0.56, (100, 126, 76)), (0.7, (120, 146, 94)),
        (0.85, (142, 166, 114))]
b.ramp(dress, MOSS, gain=1.05)
collar = b.sel(sat=(0, 0.2), val=(0.6, 1), box=(100, 205, 220, 270))
b.multiply(collar, (236, 228, 208), 0.6)
inner = erode_cv(op, 2)
b.img = patch(b.img, [(80, 300), (104, 296), (108, 320), (84, 324)], dress & inner, lift=1.08, hue=(60, 0.2), seed=81)
b.save(OUT)
print('ok', OUT)
