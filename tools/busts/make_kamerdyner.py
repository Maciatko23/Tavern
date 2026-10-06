# Teodor (the Lord's new butler after Feliks, about 60, kind): People4_1 repainted - grey hair with a side parting, thick grey
# mutton-chop side whiskers (painted), the round spectacles kept, the green vest a crimson waistcoat, the shirt sleeves the
# black livery coat, the white bow his cravat. Run: python tools/busts/make_kamerdyner.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kamerdyner_Bust.png')
b = Bust('People4_1')
S = b.img.shape

hair = b.sel(hue=(170, 230), sat=(0.15, 1), box=(60, 0, 280, 190)) & ~b.poly([(116, 112), (210, 104), (214, 140), (116, 140)])
hair = b.grow(hair, 1, 0.25) & region(S, 60, 0, 280, 190)
b.ramp(hair, RAMPS['hair_grey'], gain=1.05)
vest = b.sel(hue=(80, 160), sat=(0.15, 1), box=(0, 190, 330, 350))
vest = b.grow(vest, 2, 0.3) & region(S, 0, 190, 330, 350)
b.ramp(vest, RAMPS['crimson'], gain=1.0)
sleeves = b.sel(hue=(20, 50), sat=(0.15, 0.6), val=(0.45, 1), box=(120, 200, 330, 350)) | (b.sel(hue=(28, 50), sat=(0.12, 0.6), val=(0.4, 1), box=(0, 200, 120, 350))
                                                                                        & ~b.poly([(0, 350), (0, 258), (28, 214), (58, 186), (82, 192), (66, 226), (48, 262), (40, 300), (36, 350)]))
b.ramp(sleeves, RAMPS['black'], gain=1.0)
# the mutton chops: grey whiskers down the near cheek to the jaw, and a little on the far side
GREY = ((112, 112, 122), (170, 170, 178), (220, 220, 226))
CHOP_N = [(211, 100), (223, 102), (225, 122), (221, 143), (213, 161), (203, 176), (195, 183), (189, 176), (198, 161), (205, 141),
          (207, 120)]
b.over(cel(S, [CHOP_N], GREY, lw=1.6, shade=4, light=2, ldir=(-0.9, -0.4)))
b.over(strokes(S, [((214, 108), (215, 132), (206, 160), 1.0), ((219, 112), (219, 136), (211, 158), 1.0),
                   ((209, 124), (207, 146), (198, 170), 0.9)], (126, 126, 136), alpha=0.75))
WR = (150, 100, 80)
b.over(strokes(S, [((150, 82), (166, 79), (182, 81), 1.3), ((174, 136), (178, 148), (176, 158), 1.3)], WR, alpha=0.45))
b.save(OUT)
print('ok', OUT)
