# Zbych Smolarz (the woodcutter and charcoal burner of Podgrodzie, stocky, about 45): SF_Actor3_7 repainted - short black hair,
# a thick bushy black beard flecked with grey (painted), soot on the face, the suit a worn dark-brown leather jerkin over a
# rough dark grey linen shirt (the tie gone into the shirt). Run: python tools/busts/make_drwal.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Drwal_Bust.png')
b = Bust('SF_Actor3_7')
S = b.img.shape

hair = b.sel(hue=(200, 280), sat=(0.15, 1), val=(0, 0.45), box=(0, 0, 300, 200))
b.ramp(hair, RAMPS['hair_black'], gain=1.4)
jacket = b.sel(hue=(200, 250), sat=(0.25, 1), box=(0, 185, 330, 350))
shirt = b.sel(sat=(0, 0.3), val=(0.35, 1), box=(90, 185, 200, 350)) | b.sel(hue=(170, 210), sat=(0, 0.35), box=(90, 185, 200, 350))
tie = b.sel(hue=(260, 330), sat=(0.15, 1), box=(90, 220, 200, 350))
tie = b.grow(tie, 2, 0.3) & region(S, 90, 220, 200, 350)
front = shirt | tie
b.flatten(front, 8.0, keep_lines=0.0)
b.ramp(jacket, RAMPS['leather_dark'], gain=1.6)
b.ramp(front, [(0.0, (24, 24, 26)), (0.3, (52, 52, 54)), (0.6, (80, 80, 82)), (0.85, (104, 104, 106)), (1.0, (120, 120, 122))], gain=1.0)
b.over(cel(S, [ellipse(194, 248, 4, 3.4)], ((60, 40, 22), (110, 76, 44), (160, 120, 80)), lw=1.0, shade=1.4, light=0.8))   # (a horn toggle)
# the beard: bushy, black with grey flecks, from ear to ear under the jaw
OUTER = [(180, 132), (184, 156), (176, 182), (160, 204), (138, 220), (114, 224), (94, 214), (80, 196), (72, 172), (72, 150)]
INNER = [(80, 152), (84, 166), (94, 182), (110, 188), (128, 186), (146, 178), (160, 164), (168, 148), (174, 134)]
MOUS = [(80, 172), (94, 164), (110, 162), (126, 165), (136, 173), (130, 178), (114, 175), (98, 178), (84, 184)]
TONES = ((24, 22, 22), (44, 40, 40), (84, 80, 80), (12, 11, 11))
b.over(beard2(S, OUTER, INNER, TONES, flow=(116, 260), mous=MOUS, mous_flow=(108, 200), seed=7, n=130, tip=7, out=3.2, seg=8))
flecks = b.poly([(84, 170), (176, 140), (176, 190), (140, 220), (96, 214)])
b.over(hair_strands(S, flecks & b.sel(src=False, lum=(0, 0.3)), (116, 260), (150, 150, 154), (150, 150, 154), n=24, seed=9, alpha=(0.6, 0.6),
                    length=(5, 9)))
# soot and grime
b.img = smudge(b.img, [[(132, 120), (142, 116), (152, 120), (148, 128), (136, 128)]], (60, 54, 52), 0.3)
b.img = smudge(b.img, [[(86, 100), (94, 96), (100, 102), (94, 106)]], (60, 54, 52), 0.25)
b.save(OUT)
print('ok', OUT)
