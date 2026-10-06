# Szymek (a young pickpocket from the refugee camp, about 13): People2_3 repainted - messy dark brown hair, the purple caped
# collar a far too big faded rust-brown wool tunic with its hood down, the gold trims dull brown, the jewel a plain wooden
# toggle, hollow cheeks with a smudge. Run: python tools/busts/make_zlodziej.py [out.png]
import sys
from kit import *
from patches import smudge, patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Zlodziej_Bust.png')
b = Bust('People2_3')
S = b.img.shape

hair = b.sel(hue=(240, 340), sat=(0.05, 1), val=(0, 0.95), box=(60, 20, 270, 190)) & ~b.sel(sat=(0, 0.1), val=(0.9, 1))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 20, 270, 190)
b.ramp(hair, RAMPS['hair_dark'], gain=1.05)
cape = b.sel(hue=(220, 290), sat=(0.15, 1), box=(0, 180, 330, 350))
cape = b.grow(cape, 2, 0.3) & region(S, 0, 180, 330, 350)
b.ramp(cape, RAMPS['rust'], gain=1.15)
gold = b.sel(hue=(20, 60), sat=(0.4, 1), box=(0, 180, 330, 350))
b.ramp(gold, RAMPS['brown_wool'], gain=0.85)
jewel = b.sel(hue=(170, 220), sat=(0.3, 1), box=(80, 200, 260, 350))
b.ramp(jewel, RAMPS['wood'], gain=1.2)
dark = b.sel(lum=(0, 0.2), box=(0, 190, 330, 350)) & ~cape
b.ramp(dark, [(0.0, (14, 8, 6)), (0.1, (32, 18, 12)), (0.2, (52, 30, 20))])
b.img = patch(b.img, [(64, 300), (86, 294), (92, 318), (68, 324)], cape, lift=0.78, hue=(24, 0.32), seed=21)
b.img = smudge(b.img, [[(188, 160), (196, 156), (204, 160), (200, 166), (190, 166)]], DIRT, 0.26)
b.save(OUT)
print('ok', OUT)
