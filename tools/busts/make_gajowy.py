# Gniewko Bór (the gamekeeper of the Lord's game park, Map024 - package B "Zwierzęta i łowy", 2026-10-22; lean, weathered, about 40):
# SF_Actor3_7 repainted to match his map sheet ($Npc_Gajowy) - short dark-brown hair, a short trimmed dark-brown beard (painted), the
# suit a dark green wool kaftan (the map's (52, 84, 52) / (34, 58, 36)) over a brown wool shirt, a brown leather strap across the chest
# (the bow on his back), a horn toggle. Like make_drwal.py, without the soot. Run: python tools/busts/make_gajowy.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Gajowy_Bust.png')
b = Bust('SF_Actor3_7')
S = b.img.shape

KAFTAN = [(0.0, (8, 16, 10)), (0.15, (20, 36, 22)), (0.3, (34, 58, 36)), (0.5, (52, 84, 52)), (0.7, (76, 108, 70)), (0.85, (98, 128, 88)),
          (1.0, (120, 146, 104))]
hair = b.sel(hue=(200, 280), sat=(0.15, 1), val=(0, 0.45), box=(0, 0, 300, 200))
b.ramp(hair, RAMPS['hair_dark'], gain=1.4)
jacket = b.sel(hue=(200, 250), sat=(0.25, 1), box=(0, 185, 330, 350))
shirt = b.sel(sat=(0, 0.3), val=(0.35, 1), box=(90, 185, 200, 350)) | b.sel(hue=(170, 210), sat=(0, 0.35), box=(90, 185, 200, 350))
tie = b.sel(hue=(260, 330), sat=(0.15, 1), box=(90, 220, 200, 350))
tie = b.grow(tie, 2, 0.3) & region(S, 90, 220, 200, 350)
front = shirt | tie
b.flatten(front, 8.0, keep_lines=0.0)
b.ramp(jacket, KAFTAN, gain=1.5)
b.ramp(front, RAMPS['brown_wool'], gain=1.1)
# the bow's strap across the chest (from the near shoulder down to the far hip), a horn toggle on it
strap = [((210, 196), (176, 262), (128, 340), 5.0)]
b.over(strokes(S, strap, (52, 32, 18), alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((209, 197), (175, 263), (127, 341), 2.2)], (104, 70, 40), alpha=0.8, taper_to=1.0))
b.over(cel(S, [ellipse(184, 248, 5, 3.6)], ((150, 136, 110), (204, 192, 166), (236, 228, 206)), lw=1.0, shade=1.4, light=0.8))   # (the horn's tip)
# the beard: short and trimmed, dark brown, along the jaw
OUTER = [(178, 136), (180, 156), (172, 176), (158, 194), (138, 206), (116, 208), (98, 200), (84, 184), (76, 166), (74, 148)]
INNER = [(80, 154), (86, 166), (96, 178), (112, 184), (128, 182), (144, 176), (158, 164), (166, 150), (172, 136)]
MOUS = [(84, 172), (96, 166), (110, 164), (124, 166), (132, 172), (126, 176), (112, 174), (98, 176), (88, 180)]
TONES = ((40, 26, 18), (66, 44, 30), (104, 74, 52), (22, 14, 10))
b.over(beard2(S, OUTER, INNER, TONES, flow=(116, 250), mous=MOUS, mous_flow=(108, 196), seed=11, n=110, tip=5, out=2.4, seg=8))
b.save(OUT)
print('ok', OUT)
