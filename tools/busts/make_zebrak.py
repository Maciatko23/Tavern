# Stary Gawel (the old beggar by the west gate, very old and frail): People4_5 repainted - thin grey hair (the gold headband a
# dirty rag cord), a long tangled grey beard down to the chest and a drooping moustache (painted), hollow lined cheeks, the
# violet shirt grey-brown rags, the coat a tattered moth-eaten brown wool blanket with frayed edges, holes and a patch.
# Run: python tools/busts/make_zebrak.py [out.png]
import sys
from kit import *
from patches import patch, hole, rip

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Zebrak_Bust.png')
b = Bust('People4_5')
S = b.img.shape

hair = b.sel(hue=(48, 110), sat=(0.1, 0.6), val=(0, 0.75), box=(90, 0, 260, 220))
hair = b.grow(hair, 1, 0.3) & region(S, 90, 0, 260, 220)
b.ramp(hair, RAMPS['hair_grey'], gain=1.5)
brows = hair & b.poly([(112, 86), (214, 84), (214, 114), (112, 116)])
b.ramp(brows, RAMPS['hair_grey'], gain=2.4, bias=0.1)
band = b.sel(hue=(35, 60), sat=(0.35, 1), val=(0.6, 1), box=(90, 60, 260, 100))
b.ramp(band, [(0.0, (40, 32, 26)), (0.5, (96, 82, 66)), (1.0, (140, 124, 104))])
shirt = b.sel(hue=(250, 300), sat=(0.2, 1), box=(0, 160, 330, 350))
shirt = b.grow(shirt, 2, 0.3) & region(S, 0, 160, 330, 350)
b.ramp(shirt, [(0.0, (22, 20, 18)), (0.2, (56, 50, 44)), (0.4, (86, 78, 68)), (0.6, (112, 104, 92)), (0.8, (136, 128, 114))], gain=1.1)
coat = b.sel(hue=(15, 50), sat=(0.12, 0.6), val=(0.3, 1), box=(0, 190, 330, 350)) & ~shirt
coat = b.grow(coat, 2, 0.3) & region(S, 0, 190, 330, 350) & ~shirt
b.ramp(coat, RAMPS['brown_wool'], gain=0.85)
b.img = patch(b.img, [(36, 272), (64, 266), (70, 296), (40, 302)], coat, lift=1.15, hue=(36, 0.3), seed=51)
b.img = hole(b.img, rip([(262, 300), (270, 306), (278, 310)], 7.0, seed=52, jag=0.45, alt=0.2, step=2.0), fill=(46, 42, 38), shade=(30, 28, 26),
             line=LINE, lip=(150, 124, 96))
b.img = hole(b.img, rip([(84, 318), (90, 324), (94, 330)], 5.5, seed=53, jag=0.45, alt=0.2, step=2.0), fill=(46, 42, 38), shade=(30, 28, 26),
             line=LINE, lip=(150, 124, 96))
# hollow cheeks and more lines
WR = (160, 104, 76)
b.over(strokes(S, [((118, 132), (120, 146), (126, 156), 1.4), ((196, 128), (194, 142), (188, 152), 1.4), ((140, 64), (166, 60), (196, 64), 1.2),
                   ((144, 70), (168, 67), (192, 70), 1.0)], WR, alpha=0.55))
# the long tangled beard and the drooping moustache
OUTER = [(232, 132), (236, 158), (228, 186), (220, 206), (214, 230), (204, 252), (198, 276), (186, 298), (176, 316), (166, 334), (156, 322),
         (150, 300), (138, 284), (130, 262), (124, 240), (114, 222), (110, 200), (104, 182), (104, 166)]
INNER = [(114, 166), (126, 166), (146, 171), (164, 169), (180, 163), (196, 152), (210, 140), (222, 132)]
MOUS = [(122, 151), (136, 144), (153, 142), (170, 144), (186, 150), (190, 162), (182, 160), (168, 154), (152, 154), (136, 158), (126, 168),
        (118, 166)]
TONES = ((110, 106, 104), (162, 158, 154), (206, 202, 198), (88, 84, 82))
b.over(beard2(S, OUTER, INNER, TONES, flow=(160, 360), mous=MOUS, mous_flow=(150, 200), seed=12, n=170, tip=8, out=3.6, seg=8,
              mous_tones=((116, 112, 110), (170, 166, 162), (214, 210, 206), (92, 88, 86))))
# dirt in the beard
b.over(dots(S, [(150, 240, 2.0), (172, 262, 1.8), (140, 280, 1.6), (186, 230, 1.5)], (120, 100, 80), alpha=0.5))
b.save(OUT)
print('ok', OUT)
