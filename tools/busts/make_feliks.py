# Feliks (the Lord's butler, about 60, thin, stiff): People4_7 repainted - neatly combed grey hair, the tan uniform a black
# livery coat (the gold epaulettes gone into the black, the piping silver), a white neckcloth, lines of age in the long face.
# Run: python tools/busts/make_feliks.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Feliks_Bust.png')
b = Bust('People4_7')
S = b.img.shape

# ---------- hair + sideburns: grey ----------
FACE = [(90, 100), (150, 92), (176, 100), (182, 140), (176, 170), (150, 190), (120, 182), (100, 160), (92, 130)]
hair = b.sel(sat=(0, 0.5), val=(0, 0.45), box=(55, 0, 240, 175)) & ~b.poly(FACE)
hair |= b.sel(sat=(0, 0.5), val=(0, 0.45), poly=[(176, 130), (200, 130), (200, 178), (176, 178)])
brows = b.sel(val=(0, 0.45), polys=[[(84, 92), (124, 96), (124, 106), (84, 104)], [(138, 92), (178, 88), (178, 100), (138, 104)]])
GREY = [(0.0, (34, 34, 40)), (0.08, (70, 70, 78)), (0.14, (120, 120, 128)), (0.24, (164, 164, 172)), (0.4, (206, 206, 212)),
        (0.6, (236, 236, 240))]
b.ramp(hair, GREY)
b.ramp(brows, [(0.0, (60, 58, 62)), (0.15, (110, 108, 114)), (0.35, (160, 158, 164))])

# ---------- the coat: black livery ----------
coat = b.sel(hue=(10, 45), sat=(0.15, 0.6), val=(0.3, 0.95), box=(0, 205, 330, 350)) & ~b.poly([(205, 200), (260, 200), (240, 230), (205, 230)])
epaul = b.sel(hue=(12, 62), sat=(0.4, 1), box=(40, 185, 300, 262)) | b.sel(hue=(12, 40), sat=(0.25, 1), box=(200, 205, 240, 235))
dark = b.sel(lum=(0, 0.3), box=(0, 180, 330, 350))
BLACK = [(0.0, (8, 8, 12)), (0.2, (20, 20, 26)), (0.4, (36, 36, 44)), (0.6, (56, 56, 66)), (0.75, (76, 76, 88)), (0.9, (96, 96, 108))]
b.ramp(coat | epaul, BLACK, gain=0.9)
b.ramp(dark & ~b.sel(hue=(200, 260), sat=(0.4, 1)), [(0.0, (6, 6, 9)), (0.15, (16, 16, 22)), (0.3, (30, 30, 38))])
# the collar's gold piping -> silver
pip = b.sel(hue=(20, 62), sat=(0.45, 1), val=(0.45, 1), box=(100, 140, 240, 230)) & ~epaul
b.ramp(pip, [(0.0, (60, 62, 70)), (0.5, (170, 174, 184)), (0.8, (226, 228, 236))])
# a row of silver buttons down the coat's near side
for y in (262, 292, 322):
    b.over(cel(S, [ellipse(206 - (y - 262) * 0.05, y, 4.2, 4.2)], ((96, 98, 108), (176, 180, 190), (236, 238, 244)), lw=1.0, shade=1.5, light=1.0))

# ---------- the neckcloth: white ----------
crav = b.sel(hue=(200, 270), sat=(0.2, 1), box=(100, 190, 260, 350))
crav = b.grow(crav, 2, 0.3) & region(S, 100, 190, 260, 350)
b.ramp(crav, [(0.0, (40, 40, 50)), (0.1, (110, 110, 124)), (0.2, (170, 172, 186)), (0.32, (214, 216, 226)), (0.45, (240, 240, 246))])

# ---------- age: the long face lined ----------
WR = (150, 96, 70)
b.over(strokes(S, [((108, 74), (124, 71), (142, 73), 1.4), ((112, 81), (126, 79), (140, 80), 1.2),
                   ((84, 108), (88, 114), (94, 116), 1.2), ((164, 112), (170, 117), (176, 117), 1.3),
                   ((122, 134), (114, 148), (116, 162), 1.5), ((160, 138), (164, 152), (160, 166), 1.3),
                   ((126, 186), (134, 190), (144, 190), 1.1)], WR, alpha=0.5))

b.save(OUT)
print('ok', OUT)
