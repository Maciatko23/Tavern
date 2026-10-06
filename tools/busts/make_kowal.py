# Tadek Mlot (the town's blacksmith, burly, middle-aged): SF_Actor3_1 repainted - short dark hair, a full dark beard and
# moustache (painted), the white polo a grey linen work shirt with its sleeves rolled up over the bare forearms, a brown
# leather apron bib with straps over it, a little soot. Run: python tools/busts/make_kowal.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kowal_Bust.png')
b = Bust('SF_Actor3_1')
S = b.img.shape

hair = b.sel(hue=(330, 40), sat=(0.1, 0.6), val=(0, 0.6), box=(80, 0, 270, 140)) & ~b.poly([(108, 92), (212, 92), (214, 200), (108, 200)])
hair |= b.sel(hue=(330, 40), sat=(0.1, 0.6), val=(0, 0.6), box=(110, 0, 250, 95))
b.ramp(hair, RAMPS['hair_black'], gain=1.3)
shirt = b.sel(sat=(0, 0.22), val=(0.55, 1), box=(0, 170, 330, 350)) | b.sel(hue=(195, 240), sat=(0, 0.3), val=(0.5, 1), box=(0, 170, 330, 350))
trim = b.sel(hue=(200, 250), sat=(0.2, 1), val=(0, 0.6), box=(0, 170, 330, 350))
b.ramp(shirt, [(0.0, (30, 30, 32)), (0.4, (92, 90, 86)), (0.6, (128, 126, 120)), (0.75, (156, 152, 144)), (0.9, (182, 178, 168)),
               (1.0, (198, 194, 184))])
b.ramp(trim, [(0.0, (20, 18, 16)), (0.3, (48, 44, 40)), (0.6, (76, 70, 64))], gain=1.2)
# the leather apron bib (behind the crossed arms: only over the shirt) and its straps up round the neck
BIB = [(146, 214), (214, 210), (234, 270), (240, 352), (124, 352), (130, 270)]
STRAPS = [[(146, 214), (156, 214), (152, 190), (142, 190)], [(204, 212), (214, 210), (232, 186), (222, 184)]]
skin = b.sel(hue=(0, 45), sat=(0.2, 1), val=(0.35, 1))
cloth = (shirt | trim | b.poly(BIB)) & ~skin & b.op()
b.over(cel(S, [BIB] + STRAPS, ((58, 34, 18), (98, 62, 34), (138, 94, 56)), lw=2.0, shade=9, light=3, clip=cloth))
b.over(strokes(S, [((136, 262), (182, 268), (230, 262), 1.0), ((150, 222), (151, 244), (152, 262), 0.9)], (60, 36, 20), alpha=0.6, clip=cloth))
b.over(cel(S, [ellipse(151, 218, 4, 3.4), ellipse(208, 215, 4, 3.4)], ((90, 92, 100), (160, 164, 172), (220, 222, 228)), lw=1.0, shade=1.4, light=0.8))
# the beard and moustache: dark, short and full
OUTER = [(226, 110), (230, 130), (224, 152), (208, 174), (188, 189), (164, 197), (142, 196), (126, 186), (116, 170), (111, 150),
         (110, 130)]
INNER = [(116, 128), (119, 142), (125, 154), (136, 158), (150, 160), (168, 157), (186, 151), (200, 141), (209, 126), (216, 112)]
MOUS = [(118, 142), (130, 135), (148, 132), (164, 132), (178, 135), (184, 143), (176, 141), (164, 139), (150, 140), (134, 143),
        (122, 149)]
TONES = ((34, 26, 24), (58, 46, 42), (96, 82, 74), (20, 16, 15))
b.over(beard2(S, OUTER, INNER, TONES, flow=(160, 230), mous=MOUS, mous_flow=(150, 175), seed=4, n=110))
# soot on the cheek and the forearm
b.img = smudge(b.img, [[(196, 104), (206, 100), (214, 106), (208, 112), (198, 112)]], (70, 62, 58), 0.28)
b.img = smudge(b.img, [[(60, 300), (74, 294), (86, 300), (78, 308), (64, 308)]], (70, 62, 58), 0.25)
b.save(OUT)
print('ok', OUT)
