# Agata (the market woman with the basket, the new town's Map008 - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22; sturdy, cheerful,
# about 35): People2_4 repainted to her map sheet ($Npc_Przekupka) - the white headscarf a faded MUSTARD-YELLOW one (its woven
# band a darker mustard), brown hair and brown eyes, a sun-tanned face, the orange bodice a DARK GREEN laced one (the red laces
# brown cord), the white blouse an off-white linen. The basket and the grey apron are below the bust's frame.
# 0 PixelLab generations. Run: python tools/busts/make_przekupka.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Przekupka_Bust.png')
b = Bust('People2_4')
S = b.img.shape
LD = (0.55, 0.83)

FACE = [(100, 112), (206, 106), (214, 160), (190, 200), (152, 214), (116, 198), (100, 160)]
EYES = [(100, 125), (192, 118), (192, 162), (100, 166)]
MOUTH = [(128, 168), (168, 168), (168, 196), (128, 196)]
face = b.poly(FACE) | b.poly(EYES) | b.poly(MOUTH)

# ---------- the headscarf: mustard yellow; the woven band darker ----------
white = b.sel(sat=(0, 0.24), val=(0.5, 1), box=(50, 10, 266, 246)) & ~face
scarf = np.zeros_like(white)
for seed in [(170, 34), (226, 150), (226, 200), (124, 212), (96, 100), (210, 60)]:
    if white[seed[1], seed[0]]:
        scarf |= b.comp(white, seed)
scarf = b.grow(scarf, 2, 0.3) & ~face & region(S, 50, 10, 266, 246)
SCARF = [(0.0, LINE), (0.3, (92, 64, 22)), (0.5, (146, 108, 38)), (0.66, (182, 142, 54)), (0.8, (204, 166, 70)), (0.9, (220, 186, 94)),
         (1.0, (234, 204, 122))]
b.ramp(scarf, SCARF)
band = b.sel(hue=(25, 65), sat=(0.4, 1), box=(96, 30, 232, 136)) & ~face
band = b.grow(band, 1, 0.3) & region(S, 96, 30, 232, 136) & ~face
scarf2 = b.sel(sat=(0, 0.24), val=(0.5, 1), box=(96, 30, 232, 136)) & ~face & ~band   # (the white inside the band's lattice)
b.ramp(scarf2, SCARF)
scarf |= scarf2
BAND = [(0.0, LINE), (0.3, (74, 50, 18)), (0.5, (116, 82, 28)), (0.7, (146, 108, 40)), (0.9, (172, 132, 54))]
b.ramp(band, BAND)

# ---------- eyes brown, a tanned face ----------
iris = b.sel(hue=(60, 190), sat=(0.2, 1), poly=EYES)
b.ramp(iris, [(0.0, (26, 14, 8)), (0.3, (74, 42, 20)), (0.6, (130, 82, 40)), (0.9, (190, 140, 84))])
notskin = b.sel(hue=(15, 60), sat=(0.15, 1), val=(0.2, 0.7), box=(90, 90, 240, 210))   # (the hair)
skin = (b.poly(FACE) | b.sel(hue=(0, 40), sat=(0.06, 0.75), val=(0.55, 1), poly=[(120, 200), (220, 190), (230, 280), (110, 280)])) & \
    ~scarf & ~band & ~notskin & ~(b.poly(EYES) & ~b.sel(hue=(0, 40), sat=(0.06, 0.6), val=(0.6, 1)))
b.multiply(skin, (236, 204, 176), 0.42)

# ---------- the bodice: dark green; the laces and trims brown; the blouse off-white ----------
bod = b.sel(hue=(12, 50), sat=(0.4, 1), box=(60, 200, 270, 350))
bod = b.grow(bod, 2, 0.3) & region(S, 60, 200, 270, 350)
GREEN = [(0.0, LINE), (0.25, (22, 40, 28)), (0.42, (36, 64, 42)), (0.58, (52, 88, 56)), (0.74, (70, 108, 70)), (0.88, (92, 130, 88)),
         (1.0, (116, 150, 106))]
b.ramp(bod, GREEN)
red = b.sel(hue=(335, 12), sat=(0.55, 1), val=(0.25, 1), box=(55, 200, 310, 350)) & ~skin
b.ramp(red, RAMPS['leather'], gain=1.15)
blouse = b.sel(sat=(0, 0.24), val=(0.5, 1), box=(55, 200, 310, 350)) & ~scarf
b.multiply(blouse, (240, 230, 208), 0.55)

# a little flour and dust of the market on the bodice
from patches import smudge
b.img = smudge(b.img, [[(96, 300), (122, 292), (128, 318), (100, 324)]], (150, 140, 110), 0.2)
b.save(OUT)
print('ok', OUT)
