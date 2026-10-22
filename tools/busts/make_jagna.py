# Babka Jagna (the forest herb-woman of Omszała łąka, package A of the new terrain - docs/rozszerzenia/PLAN.md A5): Babka Jadwiga's
# bust (Znachorka_Bust, itself People1_8 repainted) with a faded MOSS-GREEN linen headscarf painted over her hair as on her map
# sheet ($Npc_Jagna): it covers the top and the sides of the head down to the jaw, a knot under the chin, a few grey strands over
# the forehead; the bun and the hair tied at the nape gone under it. The dark brown shawl and the sprig of herbs stay.
# 0 PixelLab generations. Run: python tools/busts/make_jagna.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Jagna_Bust.png')
b = Bust('Znachorka_Bust')
S = b.img.shape

FACE = [(100, 106), (206, 106), (206, 168), (194, 192), (162, 206), (128, 200), (106, 180)]
hair = b.sel(sat=(0, 0.22), val=(0.4, 1.0)) & region(S, 60, 0, 260, 225) & ~b.poly(FACE)
hair = b.grow(hair, 2, 0.35) & b.op() & region(S, 60, 0, 260, 225) & ~b.poly(FACE)

# the scarf: over the crown, down both sides to the jaw, its front edge across the forehead
SCARF = [(102, 104), (90, 76), (98, 46), (124, 26), (158, 16), (192, 20), (218, 38), (232, 72), (232, 118), (228, 168), (220, 206),
         (204, 214), (200, 180), (206, 140), (204, 112), (194, 98), (172, 92), (150, 91), (126, 95), (108, 104),
         (106, 140), (104, 176), (114, 204), (100, 208), (90, 184), (88, 140), (94, 112)]
MOSS = ((70, 84, 48), (110, 126, 78), (150, 164, 112), (48, 60, 34))
under = b.poly(SCARF)
b.erase(hair & ~under & (region(S, 0, 0, 330, 40) | region(S, 204, 120, 330, 230)))   # (the bun and the tail at the nape)
scarf = cel(S, [SCARF], MOSS, lw=1.8, shade=9.0, light=3.5, shade2=4.0)
b.over(scarf)
# folds of the linen: a few soft dark strokes running from the crown down the sides
folds = [((120, 34), (108, 70), (100, 102), 1.4), ((150, 24), (138, 52), (128, 86), 1.2), ((196, 30), (214, 74), (220, 120), 1.4),
         ((210, 130), (214, 170), (210, 204), 1.2), ((176, 22), (182, 50), (186, 90), 1.0)]
b.over(strokes(S, folds, (52, 64, 36), alpha=0.55, clip=b.poly(SCARF), taper_to=0.4))
b.over(strokes(S, [((x0 - 2, y0), (xm - 2, ym), (x1 - 2, y1), 0.9) for (x0, y0), (xm, ym), (x1, y1), _ in folds], (172, 184, 132), alpha=0.35,
               clip=b.poly(SCARF), taper_to=0.4))
# the knot under the chin and its two short ends over the shawl's collar
knot = cel(S, [ellipse(160, 214, 11, 8, 0.1, 30)], MOSS, lw=1.6, shade=4.0, light=2.0)
ends = cel(S, [[(150, 216), (138, 236), (146, 240), (158, 220)], [(168, 216), (184, 238), (176, 242), (162, 220)]], MOSS, lw=1.4, shade=3.0, light=1.5)
b.over(ends)
b.over(knot)
b.save(OUT)
print(OUT)
