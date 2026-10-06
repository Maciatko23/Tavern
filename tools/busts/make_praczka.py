# Marta Lugowa (the washerwoman of Podgrodzie, a widow about 40): People2_6 repainted - the nun's veil a faded grey-blue linen
# headscarf (the gold band the same cloth, darker), brown hair strands, the habit a faded patched brown-grey wool dress, the
# white collar a damp off-white kerchief, a few tired lines. Run: python tools/busts/make_praczka.py [out.png]
import sys
from kit import *
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Praczka_Bust.png')
b = Bust('People2_6')
S = b.img.shape

FACE = [(96, 96), (190, 96), (196, 150), (186, 182), (150, 210), (116, 196), (100, 160)]
UPPER = b.poly([(0, 0), (330, 0), (330, 293), (0, 293)])   # (the veil ends at its white-trimmed edge; below: the dress)
darks = b.sel(hue=(190, 290), sat=(0.0, 1), val=(0, 0.5)) | b.sel(sat=(0, 0.25), val=(0, 0.25))
veil = darks & UPPER
band = b.sel(hue=(20, 60), sat=(0.3, 1), box=(90, 40, 230, 110))
band = b.grow(band, 2, 0.3) & region(S, 90, 40, 230, 110)
SCARF = [(0.0, (20, 24, 30)), (0.1, (44, 52, 62)), (0.25, (76, 90, 104)), (0.4, (108, 124, 138)), (0.6, (140, 156, 168)), (0.85, (176, 188, 196))]
wim = b.sel(sat=(0, 0.18), val=(0.55, 1), box=(80, 40, 240, 120)) & ~b.poly(FACE) & ~band
b.ramp(veil, SCARF, gain=1.7)
b.ramp(wim, SCARF, gain=0.75, bias=0.12)
b.flatten(band, 3.0, keep_lines=0.3)
b.ramp(band, SCARF, gain=0.42, bias=0.06)
hair = b.sel(hue=(320, 15), sat=(0.25, 1), val=(0, 0.95), box=(90, 70, 230, 230)) & ~b.sel(sat=(0, 0.42), val=(0.9, 1))
b.ramp(hair, RAMPS['hair_chestnut'], gain=1.0)
habit = darks & ~UPPER
b.ramp(habit, RAMPS['brown_wool'], gain=2.2, bias=0.05)
collar = b.sel(sat=(0, 0.2), val=(0.55, 1), box=(40, 200, 330, 350))
b.ramp(collar, RAMPS['linen_dirty'], gain=1.0)
trim = b.sel(hue=(20, 60), sat=(0.3, 1), box=(40, 200, 330, 350))
b.ramp(trim, RAMPS['linen_dirty'], gain=0.8)
b.img = patch(b.img, [(232, 300), (254, 296), (258, 320), (236, 324)], habit, lift=0.8, hue=(26, 0.25), seed=15)
WR = (150, 96, 80)
b.over(strokes(S, [((116, 128), (122, 133), (130, 133), 1.1), ((168, 126), (174, 130), (182, 129), 1.1),
                   ((126, 160), (122, 172), (126, 182), 1.2)], WR, alpha=0.45))
b.save(OUT)
print('ok', OUT)
