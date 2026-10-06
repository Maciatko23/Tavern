# Ela (Ludmila's little daughter, a refugee): People1_4 repainted - dark brown messy hair, the red vest and white blouse a
# shabby faded blue dress, smudged cheeks. Run: python tools/busts/make_ela.py [out.png]
import sys
from kit import *
from patches import smudge, patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Ela_Bust.png')
b = Bust('People1_4')
S = b.img.shape

hair = b.sel(hue=(285, 30), sat=(0.25, 1), val=(0, 0.9), box=(40, 20, 290, 214))
hair = b.grow(hair, 1, 0.25) & region(S, 40, 20, 290, 214)
b.ramp(hair, RAMPS['hair_dark'])
# the red shade the fringe threw on the forehead -> a plain skin shade
b.hsv(b.sel(hue=(345, 15), sat=(0.25, 0.6), val=(0.9, 1), box=(100, 110, 220, 140)), hue=14, smul=0.8)
vest = b.sel(hue=(340, 20), sat=(0.45, 1), box=(40, 200, 330, 350))
vest = b.grow(vest, 2, 0.3) & region(S, 40, 200, 330, 350)
b.ramp(vest, RAMPS['blue_faded'], gain=1.25)
blouse = b.sel(sat=(0, 0.2), val=(0.45, 1), box=(30, 200, 330, 350))
b.ramp(blouse, [(0.0, (30, 34, 44)), (0.2, (80, 92, 110)), (0.5, (140, 156, 176)), (0.75, (176, 190, 206)), (0.95, (200, 210, 222))])
b.img = patch(b.img, [(240, 300), (262, 296), (266, 318), (244, 322)], vest, lift=1.1, hue=(30, 0.3), seed=7)
b.img = smudge(b.img, [[(110, 168), (118, 164), (126, 167), (124, 174), (115, 175)],
                       [(176, 170), (186, 166), (194, 170), (190, 177), (180, 177)]], DIRT, 0.22)
b.img = smudge(b.img, [[(150, 196), (156, 194), (160, 198), (154, 200)]], DIRT, 0.25)
b.save(OUT)
print('ok', OUT)
