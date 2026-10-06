# Sołtys Bronisław (the town's headman): People1_5 repainted - grey hair and moustache, a few years more in the face (forehead,
# eye and cheek lines), the brown coat kept, a brass chain of office with a round seal across the chest.
# Run: python tools/busts/make_soltys.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Soltys_Bust.png')
b = Bust('People1_5')
S = b.img.shape

# ---------- hair, eyebrows, moustache: grey ----------
FACE = [(96, 92), (200, 92), (204, 130), (196, 160), (176, 178), (150, 186), (124, 180), (104, 160), (96, 130)]
face = b.poly(FACE)
eyes = b.poly([(104, 100), (176, 100), (176, 124), (104, 124)])
hair = (b.sel(sat=(0, 0.32), val=(0, 0.72), box=(40, 0, 260, 170)) | b.sel(hue=(190, 265), val=(0, 0.5), box=(40, 0, 260, 170))) & ~eyes
mous = b.sel(sat=(0, 0.32), val=(0, 0.5), box=(110, 135, 190, 165))
GREY = [(0.0, (40, 38, 44)), (0.06, (66, 64, 72)), (0.10, (118, 118, 128)), (0.25, (170, 170, 178)), (0.5, (216, 216, 222)),
        (0.75, (242, 242, 246))]
b.ramp(hair | mous, GREY)
# the brows (thin dark strokes over the eyes) a lighter grey
brows = b.sel(lum=(0, 0.45), polys=[[(100, 84), (150, 92), (150, 100), (100, 96)], [(170, 86), (204, 82), (206, 94), (170, 98)]])
b.ramp(brows, [(0.0, (70, 66, 70)), (0.3, (120, 118, 124)), (0.6, (170, 168, 172))])

# ---------- age: a few lines in the RTP manner (thin, warm, half see-through) ----------
WR = (150, 90, 70)
b.over(strokes(S, [((156, 80), (172, 77), (190, 80), 1.5), ((160, 87), (174, 85), (188, 87), 1.3),
                   ((180, 104), (186, 108), (193, 108), 1.3), ((181, 111), (187, 114), (193, 113), 1.2),
                   ((176, 110), (183, 116), (190, 116), 1.3), ((104, 118), (110, 123), (116, 122), 1.1),
                   ((160, 127), (166, 140), (168, 150), 1.6)], WR, alpha=0.55))
# a fuller, ruddier face: a touch of blush on the near cheek
b.over(blush(S, 182, 140, 14, 9, (230, 110, 90), 0.22))

# ---------- the chain of office ----------
path = [(92, 232), (104, 260), (120, 282), (142, 298), (158, 303)]
path2 = [(180, 303), (204, 294), (226, 276), (244, 254), (256, 230)]
b.over(chain(S, path, link=(13, 8.0), every=10.5))
b.over(chain(S, path2, link=(13, 8.0), every=10.5))
GOLD = ((124, 80, 24), (206, 152, 54), (252, 226, 146))
seal = cel(S, [ellipse(169, 318, 17, 18)], GOLD, lw=2.0, shade=4.5, light=2)
b.over(seal)
b.over(cel(S, [ellipse(169, 318, 11, 12)], ((150, 100, 34), (226, 178, 80), (252, 230, 160)), lw=1.0, shade=2.5, light=1.2))
b.over(strokes(S, [((163, 313), (169, 310), (175, 313), 1.6), ((169, 310), (169, 318), (169, 325), 1.6)], (110, 70, 20), alpha=0.9))
b.over(cel(S, [ellipse(169, 300, 5, 4)], GOLD, lw=1.2, shade=1.5, light=1.0))

b.save(OUT)
print('ok', OUT)
