# Posel Adam Wierzbieta (a traveller from the ferry, docs/PODROZNI.md 2.13: the King's envoy, about 60, dignified): People3_5
# (the stern grey-haired man with the grey goatee - Borgar's base too, but there the hair and beard are lightened and the coat is
# violet) repainted to his PixelLab map sheet ($Npc_Posel): the hair a light silver-grey, the goatee kept grey, the green eyes dark
# grey; the violet sleeves a DARK SLATE CLOAK, the gold shoulder pads a thick light brown-grey FUR collar, the brown tunic a WHITE
# robe, its gold trim ORANGE, and a SILVER CHAIN OF OFFICE across the chest.
# 0 PixelLab generations. Run: python tools/busts/make_posel.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Posel_Bust.png')
b = Bust('People3_5')
S = b.img.shape
body = b.poly([(0, 190), (330, 190), (330, 350), (0, 350)])
head = b.poly([(80, 0), (260, 0), (260, 215), (80, 215)])

# hair and brows: silver-grey
hair = b.sel(sat=(0, 0.35), val=(0.1, 0.8), box=(80, 0, 250, 140))
b.ramp(hair, [(0.0, (34, 34, 38)), (0.15, (84, 84, 88)), (0.3, (128, 128, 130)), (0.45, (168, 168, 170)), (0.6, (200, 200, 202)),
              (0.8, (228, 228, 230))], gain=1.25)
# eyes: dark grey
eyes = b.sel(hue=(70, 170), sat=(0.15, 1), box=(95, 90, 215, 135))
b.hsv(eyes, hue=215, sat=0.12, vmul=0.7)

# the cloak: the violet sleeves -> dark slate
cloak = b.sel(hue=(240, 320), sat=(0.12, 1), box=(0, 190, 330, 350))
b.ramp(cloak, [(0.0, (14, 16, 22)), (0.15, (28, 32, 40)), (0.3, (46, 52, 62)), (0.5, (66, 74, 86)), (0.75, (92, 100, 112))])
# the fur collar: the gold shoulder pads -> light brown-grey fur
pads = b.sel(hue=(30, 62), sat=(0.25, 1), box=(0, 190, 330, 350))
b.ramp(pads, [(0.0, (60, 48, 40)), (0.3, (104, 85, 72)), (0.5, (134, 106, 87)), (0.7, (160, 132, 113)), (0.9, (186, 168, 154))], gain=0.95)
# the robe: the brown tunic -> white (the dark brown fills with a lit white, the folds kept)
tunic = b.sel(hue=(10, 40), sat=(0.15, 0.9), val=(0.05, 0.5), box=(110, 195, 230, 350))
b.ramp(tunic, [(0.0, (150, 144, 138)), (0.2, (196, 190, 184)), (0.4, (222, 216, 210)), (0.7, (242, 240, 238))], gain=2.6, bias=0.08)
# the trim: the remaining gold/yellow lines -> orange
trim = b.sel(hue=(34, 62), sat=(0.45, 1), box=(100, 190, 240, 350))
b.ramp(trim, [(0.0, (120, 50, 20)), (0.4, (190, 100, 44)), (0.7, (224, 123, 52)), (1.0, (246, 168, 90))])

# a silver chain of office with a medallion, over the chest
chain(S, [(105, 214), (130, 262), (165, 282), (200, 262), (222, 214)], link=(9, 5.5), gold=((90, 94, 104), (170, 176, 188), (236, 240, 248)))
b.over(chain(S, [(105, 214), (130, 262), (165, 282), (200, 262), (222, 214)], link=(9, 5.5),
             gold=((90, 94, 104), (170, 176, 188), (236, 240, 248))))
b.over(cel(S, [ellipse(165, 292, 11, 13, 0, 28)], ((112, 116, 126), (186, 192, 204), (236, 240, 248), (60, 62, 72)), ldir=(0.55, 0.83), lw=1.6))
b.save(OUT)
print('ok', OUT)
