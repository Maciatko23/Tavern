# Babka Jadwiga (the herb-woman of Podgrodzie, about 70): People1_8 repainted - the grey bun kept, the cream shawl a dark
# charcoal-brown wool one, the plum dress faded brown, a sprig of dried herbs tucked into the shawl.
# Run: python tools/busts/make_znachorka.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Znachorka_Bust.png')
b = Bust('People1_8')
S = b.img.shape

shawl = b.sel(hue=(25, 70), sat=(0.08, 0.6), val=(0.45, 1), box=(20, 170, 330, 350)) & ~b.poly([(120, 170), (200, 170), (190, 205), (130, 205)])
shawl = b.grow(shawl, 2, 0.3) & region(S, 20, 170, 330, 350)
b.ramp(shawl, RAMPS['charcoal'], gain=0.95)
dress = b.sel(hue=(300, 360), sat=(0.25, 1), box=(90, 180, 260, 350))
b.ramp(dress, RAMPS['brown_wool'], gain=1.15)
# the herbs: a few green leaves and two pale flowers on stalks, tucked in at the near side
GREENS = ((44, 70, 34), (86, 124, 58), (140, 170, 96))
b.over(strokes(S, [((232, 300), (240, 280), (246, 258), 1.6), ((236, 302), (250, 284), (262, 268), 1.5),
                   ((230, 304), (232, 286), (228, 266), 1.5)], (70, 90, 44), alpha=1.0))
leaves = [ellipse(x, y, rx, ry, r, 18) for (x, y, rx, ry, r) in
          [(246, 262, 6, 3, -1.1), (240, 276, 6, 3, -0.6), (258, 272, 6, 3, -0.4), (252, 286, 5, 2.6, 0.2), (228, 270, 6, 3, -1.5),
           (233, 288, 5, 2.6, 2.6)]]
b.over(cel(S, leaves, GREENS, lw=1.0, shade=1.5, light=1.0))
b.over(cel(S, [ellipse(262, 266, 3.5, 3.5, 0, 12), ellipse(229, 263, 3.2, 3.2, 0, 12)], ((180, 150, 90), (236, 214, 150), (252, 244, 210)),
           lw=0.9, shade=1.0, light=0.8))
b.save(OUT)
print('ok', OUT)
