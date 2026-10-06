# Hanka Mączna (the baker): People4_2 repainted - brown hair under the white frilled cap (her headscarf), the orange cape a
# blue dress, the ribbons and the blouse the white apron's straps and bib, rosy cheeks and flour on the cheek and the dress.
# Run: python tools/busts/make_piekarka.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Piekarka_Bust.png')
b = Bust('People4_2')
S = b.img.shape

# ---------- hair: the ash-pink of the base -> warm mid brown ----------
HAIR_AREA = [(96, 96), (112, 72), (150, 62), (196, 68), (226, 92), (233, 130), (229, 170), (223, 194), (211, 194), (210, 150),
             (198, 130), (178, 110), (153, 90), (142, 97), (126, 112), (113, 130), (108, 150), (108, 175), (111, 196), (99, 196),
             (93, 150)]
EAR = [(207, 132), (226, 126), (231, 150), (227, 180), (214, 190), (206, 170)]
hair = (b.sel(poly=HAIR_AREA) & ~b.sel(hue=(185, 270)) & ~b.sel(sat=(0.27, 1), val=(0.74, 1)) & ~b.sel(sat=(0, 0.14), val=(0.45, 1))
        & ~b.poly(EAR))
BROWN = [(0.0, (34, 20, 14)), (0.12, (58, 34, 22)), (0.3, (104, 64, 38)), (0.45, (140, 90, 54)), (0.6, (176, 122, 76)),
         (0.8, (214, 168, 116))]
b.ramp(hair, BROWN)

# ---------- the cape -> a blue wool dress; its dark lines bluish ----------
cape = b.sel(hue=(340, 45), sat=(0.42, 1), box=(0, 215, 330, 350)) & ~b.sel(sat=(0, 0.5), poly=[(124, 205), (200, 205), (196, 236), (128, 236)])
cape |= b.sel(hue=(320, 360), sat=(0.15, 1), box=(0, 240, 120, 350))   # (the pink rim light on its far edge)
cape_dark = b.sel(hue=(300, 15), sat=(0.3, 1), val=(0, 0.6), box=(0, 215, 330, 350)) & ~b.poly([(120, 280), (205, 280), (205, 350), (120, 350)])
BLUE = [(0.0, (16, 18, 36)), (0.12, (30, 36, 70)), (0.3, (52, 72, 124)), (0.5, (78, 108, 166)), (0.68, (112, 146, 196)),
        (0.85, (160, 188, 222))]
b.ramp(cape | cape_dark, BLUE)
# the yellow ties -> white apron straps; the lavender-shaded blouse -> the apron's bib (white, cool grey shade)
ties = b.sel(hue=(40, 70), sat=(0.25, 1), box=(100, 220, 260, 350))
blouse = b.sel(hue=(200, 290), sat=(0, 0.6), box=(110, 290, 230, 350))
WHITE = [(0.0, (40, 38, 46)), (0.25, (120, 118, 128)), (0.45, (186, 186, 194)), (0.65, (226, 226, 230)), (0.85, (248, 248, 250))]
b.ramp(ties | blouse, WHITE, gain=1.08, bias=0.04)
# the black sleeve ends -> deep blue
sleeves = b.sel(lum=(0, 0.2), box=(0, 300, 330, 350)) & ~b.poly([(110, 290), (230, 290), (230, 350), (110, 350)])
b.ramp(sleeves, [(0.0, (12, 14, 28)), (0.1, (26, 30, 58)), (0.2, (44, 54, 96))], gain=1.0)

# ---------- a cheerful face: rosy cheeks, flour ----------
face = b.sel(hue=(0, 40), sat=(0.15, 0.6), box=(110, 120, 215, 215))
b.over(blush(S, 136, 186, 13, 7, (236, 108, 100), 0.30, clip=face))
b.over(blush(S, 190, 186, 11, 6, (236, 108, 100), 0.26, clip=face))
# a dab of flour on the near cheek (a flat light smudge, like the RTP dirt marks)
from patches import smudge
b.img = smudge(b.img, [[(188, 168), (194, 164), (201, 165), (204, 170), (199, 175), (191, 175)]], (252, 248, 240), 0.55)

b.save(OUT)
print('ok', OUT)
