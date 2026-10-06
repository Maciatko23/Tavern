# Darin z Kontynentu (a refugee, about 35, weary): SF_Actor1_5 repainted - a sun-tanned face with dark stubble, short dark
# hair, the suit a faded olive-khaki quilted gambeson with a high collar (no armour), the tie its closing strip, a dark-teal
# sash at the waist. Run: python tools/busts/make_uchodzca.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Uchodzca_Bust.png')
b = Bust('SF_Actor1_5')
S = b.img.shape

hair = b.sel(sat=(0, 0.35), val=(0, 0.5), box=(40, 0, 300, 200)) & ~b.sel(box=(110, 170, 230, 350))
b.ramp(hair, RAMPS['hair_dark'], gain=1.1)
skin = b.sel(hue=(0, 45), sat=(0.08, 0.7), val=(0.35, 1), box=(80, 80, 260, 260))
b.multiply(skin, (226, 186, 150), 1.0)
suit = b.sel(hue=(220, 270), sat=(0.1, 1), box=(0, 180, 330, 350))
front = b.poly([(124, 196), (220, 190), (214, 236), (196, 262), (190, 330), (146, 330), (140, 262), (122, 230)])
shirt = (b.sel(sat=(0, 0.2), val=(0.55, 1), box=(100, 180, 240, 350)) | b.sel(hue=(190, 260), sat=(0.05, 1), box=(100, 180, 240, 350))) & front
shirt &= ~b.sel(hue=(0, 45), sat=(0.1, 0.7), val=(0.5, 1))
b.flatten(shirt, 12.0, keep_lines=0.0)
b.ramp(suit & ~shirt, RAMPS['khaki'], gain=1.7)
b.ramp(shirt, RAMPS['khaki'], gain=0.62, bias=0.12)
# quilting over the gambeson: vertical stitched lines
lines = []
for x in range(14, 330, 17):
    lines.append(((x, 230), (x + 3, 290), (x + 1, 352), 1.2))
b.over(strokes(S, lines, (64, 60, 38), alpha=0.5, clip=suit & ~shirt))
# the closing strip down the front, its two seams and wooden toggles; a high stand collar round the neck
b.over(strokes(S, [((150, 236), (149, 290), (151, 340), 1.8), ((184, 234), (185, 290), (183, 340), 1.8)], (40, 36, 22), alpha=0.85))
for y in (256, 286, 316):
    b.over(cel(S, [ellipse(167, y, 5, 3.2)], ((70, 46, 24), (128, 90, 52), (176, 134, 86)), lw=1.0, shade=1.4, light=0.9))
COLLAR = [(126, 198), (148, 210), (172, 216), (198, 208), (218, 192), (222, 214), (200, 232), (172, 240), (146, 234), (124, 220)]
b.over(cel(S, [COLLAR], ((70, 66, 42), (112, 106, 72), (150, 144, 104)), lw=2.0, shade=5, light=2))
b.over(strokes(S, [((130, 210), (172, 228), (216, 204), 1.0)], (64, 60, 38), alpha=0.6))
b.over(stubble(S, [(118, 150), (150, 170), (180, 176), (204, 168), (214, 150), (206, 184), (176, 202), (140, 196), (120, 176)], (40, 30, 26),
               density=0.55, seed=8, alpha=0.6))
b.img = smudge(b.img, [[(196, 136), (204, 132), (212, 136), (208, 142), (198, 142)]], DIRT, 0.22)
b.save(OUT)
print('ok', OUT)
