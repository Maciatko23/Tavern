# Rafal (a young army deserter, about 25): SF_Actor2_7 repainted - messy dark brown hair, dark stubble, a gaunt dirty face,
# the hoodie a torn padded gambeson in faded blue-grey with quilted lines, the T-shirt a dirty linen undershirt.
# Run: python tools/busts/make_rafal.py [out.png]
import sys
from kit import *
from patches import smudge, hole, rip

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Rafal_Bust.png')
b = Bust('SF_Actor2_7')
S = b.img.shape

hair = b.sel(hue=(30, 65), sat=(0.15, 1), val=(0, 0.95), box=(60, 0, 280, 200))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 0, 280, 200)
b.ramp(hair, RAMPS['hair_dark'], gain=0.9)
jacket = b.sel(hue=(195, 260), sat=(0.1, 1), val=(0, 0.6), box=(0, 150, 330, 350)) & ~b.sel(hue=(195, 230), sat=(0.5, 1), val=(0.45, 1))
tee = b.sel(hue=(195, 230), sat=(0.45, 1), val=(0.4, 1), box=(90, 190, 260, 350))
tee = b.grow(tee, 1, 0.25) & region(S, 90, 190, 260, 350)
b.ramp(jacket, RAMPS['bluegrey'], gain=1.25)
b.ramp(tee, RAMPS['linen_dirty'], gain=1.1)
# quilting: rows of stitched lines across the gambeson
gam = jacket & ~b.lines_of(tee, 2)
rows = []
for k in range(6):
    y = 236 + k * 20
    rows.append(((0, y + 8), (60, y), (90, y + 6), 1.2))
    rows.append(((210, y - 6), (260, y - 10), (330, y), 1.2))
b.over(strokes(S, rows, (40, 48, 60), alpha=0.55, clip=gam))
# the torn bare patch where the insignia was ripped off (near side of the chest)
b.img = hole(b.img, rip([(232, 262), (240, 270), (248, 276)], 9.0, seed=4, jag=0.4, alt=0.2, step=2.0), fill=(72, 80, 92),
             shade=(52, 58, 70), line=(24, 26, 32), lip=(150, 160, 170))
# stubble, grime
b.over(stubble(S, [(116, 160), (140, 172), (170, 176), (196, 168), (206, 150), (196, 186), (166, 200), (136, 194), (118, 178)], (60, 44, 36),
               density=0.32, seed=3, alpha=0.42))
b.img = smudge(b.img, [[(198, 128), (208, 124), (216, 128), (212, 136), (202, 136)]], DIRT, 0.3)
b.img = smudge(b.img, [[(124, 140), (130, 138), (134, 144), (128, 146)]], DIRT, 0.25)
b.save(OUT)
print('ok', OUT)
