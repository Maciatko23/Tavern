# Bronek (a town boy, about 9): People1_1 repainted - messy sandy-brown hair, freckles, the white shirt a dirty off-white
# linen one, the green smock faded brown with a patch, a smudge on the cheek. Run: python tools/busts/make_bronek.py [out.png]
import sys
from kit import *
from patches import patch, smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Bronek_Bust.png')
b = Bust('People1_1')
S = b.img.shape

hair = b.sel(hue=(300, 20), sat=(0.25, 1), val=(0, 0.9), box=(60, 10, 250, 175)) | b.sel(hue=(330, 15), sat=(0.38, 1), box=(60, 10, 250, 112))
hair = b.grow(hair, 1, 0.25) & region(S, 60, 10, 250, 175)
b.ramp(hair, RAMPS['hair_sandy'])
shirt = b.sel(sat=(0, 0.16), val=(0.4, 1), box=(60, 180, 290, 350))
b.ramp(shirt, RAMPS['linen_dirty'])
smock = b.sel(hue=(90, 180), sat=(0.12, 1), box=(60, 180, 290, 350))
smock = b.grow(smock, 2, 0.3) & region(S, 60, 180, 290, 350)
b.ramp(smock, RAMPS['brown_wool'], gain=1.1)
b.img = patch(b.img, [(150, 296), (176, 292), (180, 318), (154, 322)], smock, lift=1.35, hue=(32, 0.32), seed=3)
face = b.sel(hue=(0, 40), sat=(0.12, 0.6), val=(0.6, 1), box=(80, 100, 230, 200))
b.over(dots(S, [(108, 158, 1.3), (114, 162, 1.1), (120, 157, 1.2), (104, 165, 1.0), (112, 168, 1.0),
                (176, 158, 1.3), (182, 162, 1.1), (188, 157, 1.2), (186, 166, 1.0), (178, 167, 1.0), (192, 163, 1.0)],
            FRECKLE, alpha=0.75, clip=face))
b.img = smudge(b.img, [[(186, 176), (193, 172), (201, 174), (203, 180), (196, 183), (188, 182)]], DIRT, 0.28)
b.save(OUT)
print('ok', OUT)
