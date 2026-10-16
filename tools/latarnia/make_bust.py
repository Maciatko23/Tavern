# Bazyli Krzesiwo (the lighthouse keeper of the cape, about 60, tall and bony, long grey-white hair tied back, the left eye clouded
# white, a long black waxed-canvas coat black with soot): People3_5 (the stern grey-haired man with a goatee) repainted with
# tools/busts/kit.py (no PixelLab) to match his map sheet $Npc_Latarnik - the grey hair lighter and whiter, with long loose locks
# falling behind the ears onto the collar (the rest tied back), the goatee a short grey beard, his left eye (the viewer's right)
# clouded milky white, the purple coat with gold shoulders a black waxed coat smudged with soot, the brown vest a dark grey shirt,
# the gold trim a leather strap.
# Run: python tools/latarnia/make_bust.py [out.png]   (default img/pictures/Latarnik_Bust.png)
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "busts"))
from kit import *   # noqa: F401,F403

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Latarnik_Bust.png')
b = Bust('People3_5')
S = b.img.shape

# the map sheet's colours ($Npc_Latarnik, south): coat (24,22,24)/(40,38,40)/(62,58,60), hair (196,196,198)/(228,228,230), belt brown
COAT = [(0.0, (8, 8, 10)), (0.18, (20, 19, 22)), (0.36, (32, 30, 33)), (0.55, (46, 43, 46)), (0.75, (64, 60, 62)), (1.0, (88, 82, 82))]
SHIRT = [(0.0, (14, 14, 16)), (0.3, (38, 38, 42)), (0.6, (62, 62, 66)), (1.0, (92, 92, 96))]
STRAP = [(0.0, (34, 20, 12)), (0.4, (78, 50, 30)), (0.75, (120, 82, 52)), (1.0, (156, 112, 76))]
HAIR = [(0.0, (70, 70, 76)), (0.25, (126, 126, 132)), (0.5, (170, 170, 176)), (0.75, (208, 208, 212)), (1.0, (238, 238, 240))]
HAIR_T = ((112, 112, 120), (168, 168, 176), (214, 214, 220))

# ---------- the hair: lighter, whiter (the base's grey) ----------
hair = b.sel(hue=None, sat=(0, 0.16), val=(0.25, 0.9), box=(85, 0, 240, 150))
skin = b.sel(hue=(0, 45), sat=(0.12, 0.62), val=(0.45, 1), box=(80, 40, 240, 198))
hair &= ~skin
b.ramp(b.grow(hair, 1, 0.3) & region(S, 85, 0, 240, 150) & ~skin, HAIR, gain=1.0, bias=0.08)
# long loose locks behind the ears, down onto the collar (both sides)
locks = [
    [(98, 96), (92, 124), (90, 152), (93, 180), (101, 200), (107, 194), (102, 170), (102, 140), (106, 110)],
    [(222, 96), (228, 124), (231, 152), (228, 180), (220, 202), (214, 194), (219, 170), (218, 140), (214, 110)],
]
lk = cel(S, locks, HAIR_T, shade=6, light=3)
b.img = over(lk, b.img)
b.over(strokes(S, [((92, 110), (88, 150), (96, 196), 1.2), ((100, 112), (96, 150), (104, 192), 1.0),
                   ((228, 110), (232, 150), (226, 196), 1.2), ((220, 112), (224, 150), (216, 192), 1.0)], (120, 120, 128), alpha=0.7, taper_to=0.2))

# ---------- the beard: the dark goatee a short grey beard ----------
beard = b.sel(sat=(0, 0.25), val=(0.1, 0.75), box=(105, 140, 215, 215)) & ~skin
b.ramp(b.grow(beard, 1, 0.3) & region(S, 105, 140, 215, 215), [(0.0, (60, 60, 64)), (0.4, (122, 122, 128)), (0.75, (176, 176, 182)), (1.0, (214, 214, 218))], bias=0.05)

# ---------- the eyes: green -> grey; his left eye (the viewer's right) clouded milky white ----------
iris = b.sel(hue=(70, 170), sat=(0.2, 1), box=(100, 85, 210, 120))
b.ramp(iris, [(0.0, (40, 44, 50)), (0.5, (96, 104, 112)), (1.0, (150, 158, 166))])
cloud = b.grow(b.sel(hue=(70, 170), sat=(0.2, 1), box=(158, 85, 210, 120)), 1, 0.3) & region(S, 158, 85, 210, 120)
b.ramp(cloud, [(0.0, (150, 158, 168)), (0.5, (204, 210, 216)), (1.0, (236, 240, 244))], bias=0.25)
b.over(dots(S, [(176, 104, 2.4)], (226, 230, 236), alpha=0.85))

# ---------- the clothes: everything coloured below the chin ----------
body = region(S, 0, 172, 330, 350) & b.op() & ~(skin & ~region(S, 0, 182, 330, 350)) & ~b.grow(beard, 2, 0.3)
gold = b.sel(hue=(20, 85), sat=(0.25, 1), val=(0.3, 1), box=(0, 192, 330, 350)) | b.sel(hue=(15, 62), sat=(0.6, 1), val=(0.3, 1), box=(90, 174, 240, 198))
purple = b.sel(hue=(190, 340), sat=(0.06, 1), box=(0, 175, 330, 350))
brown = b.sel(hue=(0, 40), sat=(0.15, 1), val=(0.1, 0.6), box=(110, 175, 220, 350)) & ~gold
coat = b.grow(gold | purple, 2, 0.3) & body
b.flatten(coat, 2.0, keep_lines=0.3)
b.ramp(coat, COAT, gain=0.9)
b.ramp(b.grow(brown, 1, 0.3) & body & ~coat, SHIRT, gain=1.0)
# the gold trim down the middle: a worn leather strap (the lantern's)
trim = b.sel(hue=(30, 62), sat=(0.3, 1), val=(0.35, 1), box=(150, 190, 175, 350))
b.ramp(b.grow(trim, 1, 0.3) & region(S, 148, 190, 178, 350), STRAP)
# soot: dull dark smudges and a few lighter wax shines on the shoulders
smudge = []
for k in range(70):
    smudge.append((20 + (k * 47) % 290, 220 + (k * 31) % 128, 1.2 + (k % 3) * 0.6))
b.over(dots(S, smudge, (10, 10, 12), alpha=0.35, clip=coat))
b.over(strokes(S, [((40, 236), (70, 222), (100, 220), 1.4), ((232, 220), (262, 222), (292, 236), 1.4)], (110, 104, 104), alpha=0.5, clip=coat))
b.save(OUT)
print('ok', OUT)
