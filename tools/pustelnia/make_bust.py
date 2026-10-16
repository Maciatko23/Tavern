# Brat Kleofas (the hermit chronicler of the cliff, about 75, thin, stooped, bald with a ring of white hair, short white stubble,
# a faded pale blue habit with a high dark collar, a hemp cord): People1_7 repainted with tools/busts/kit.py (no
# PixelLab) to match his map sheet $Npc_Pustelnik - the green knitted cap off and a bald, lined scalp painted in its place (the
# white hair at the sides kept), the kind smile turned down into a dry, tight mouth, white stubble on the jaw, the green shirt a
# washed-out blue wool habit, the purple undershirt the habit's hood and collar, the yellow tie a frayed hemp cord.
# Run: python tools/pustelnia/make_bust.py [out.png]   (default img/pictures/Pustelnik_Bust.png)
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "busts"))
from kit import *   # noqa: F401,F403

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Pustelnik_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('People1_7')
S = b.img.shape

# the map sheet's colours ($Npc_Pustelnik, south): habit (155,174,183)/(137,156,168)/(110,129,145)/(89,105,119)/(79,98,114),
# skin (238,188,153)/(209,162,129)/(181,134,107), the white hair (200,199,196), the cord (198,148,118)/(118,81,58)
HABIT = [(0.0, (22, 28, 36)), (0.14, (52, 64, 78)), (0.3, (80, 98, 114)), (0.48, (108, 127, 143)), (0.66, (137, 156, 168)), (0.84, (158, 177, 186)),
         (1.0, (178, 194, 200))]
HOOD = [(0.0, (18, 22, 30)), (0.18, (44, 54, 68)), (0.36, (70, 86, 102)), (0.56, (96, 114, 130)), (0.78, (124, 142, 156)), (1.0, (146, 164, 174))]
SKIN = ((206, 150, 116), (236, 186, 150), (250, 214, 182))
HAIR_T = ((168, 168, 172), (214, 214, 216), (244, 244, 246))

# ---------- the cap off: everything above its lower edge cleared, a bald old scalp painted ----------
cap = b.sel(hue=(40, 100), sat=(0.18, 1), val=(0.2, 1), box=(70, 0, 240, 110))
cap = b.grow(cap, 2, 0.35) & region(S, 70, 0, 240, 112)
b.erase(cap)
ARC = ellipse(150, 104, 72, 84, 0, 48, np.pi * 1.0, np.pi * 2.0)
DOME = ARC + [(222, 104), (206, 92), (180, 86), (150, 84), (120, 88), (96, 96), (80, 104)]
dome = cel(S, [DOME], SKIN, outline=False, shade=10, light=5, ldir=LDIR)
b.img = over(dome, b.img)       # (under the face and the side hair that stay)
b.over(strokes(S, [(ARC[i], ((np.asarray(ARC[i]) + np.asarray(ARC[i + 1])) / 2).tolist(), ARC[i + 1], 2.0) for i in range(len(ARC) - 1)],
               LINE, alpha=1.0, taper_to=1.0))
# the scalp's creases and age spots
WR = (176, 116, 84)
b.over(strokes(S, [((112, 70), (146, 62), (184, 68), 1.4), ((118, 78), (148, 72), (180, 77), 1.2), ((132, 46), (150, 42), (168, 46), 1.0)],
               WR, alpha=0.55))
b.over(dots(S, [(160, 34, 2.2), (172, 40, 1.6), (130, 38, 1.8), (184, 54, 1.4)], (204, 146, 108), alpha=0.6))
# the white ring of hair: thin strands round the sides, over the ears (the base's own grey hair at the back stays under them)
side = []
for i in range(6):
    y = 92 + i * 6
    side.append(((92 + i * 0.4, y + 2), (88 - i * 0.3, y + 12), (88 - i * 0.5, y + 22), 1.4))
    side.append(((206 - i * 0.5, y - 4), (216 + i * 0.6, y + 8), (220 + i * 0.9, y + 22), 1.6))
b.over(strokes(S, side, HAIR_T[1], alpha=0.95, taper_to=0.15))
b.over(strokes(S, side[::2], HAIR_T[0], alpha=0.6, taper_to=0.15))

# ---------- the face: the smile turned into a dry, tight mouth; white stubble ----------
skin = b.sel(hue=(0, 45), sat=(0.15, 0.75), val=(0.5, 1), box=(80, 90, 230, 200))
MOUTH = [(100, 148), (152, 146), (158, 172), (104, 176)]
mouth_area = b.poly(MOUTH) & skin
b.ramp(mouth_area, [(0.0, (196, 140, 104)), (0.5, (226, 172, 136)), (1.0, (238, 186, 150))], gain=1.0, bias=0.12)
b.over(strokes(S, [((108, 162), (128, 160), (150, 163), 1.5)], (118, 70, 52), alpha=0.95, taper_to=0.5))
b.over(strokes(S, [((106, 164), (104, 168), (103, 172), 1.0), ((150, 164), (153, 168), (154, 172), 1.0)], (150, 96, 70), alpha=0.6))
stub = []
for k in range(120):
    t = k / 120.0
    x = 102 + 66 * t + ((k * 37) % 7 - 3)
    y = 174 + 12 * (1 - abs(t - 0.45) * 1.8) + ((k * 53) % 9 - 4)
    stub.append((x, y, 0.55))
for k in range(40):
    stub.append((98 + (k * 13) % 16, 146 + (k * 29) % 24, 0.5))
b.over(dots(S, stub, (236, 232, 226), alpha=0.6, clip=b.grow(skin, 1, 0.3)))
b.over(blush(S, 116, 132, 10, 7, col=(214, 120, 96), alpha=0.18, clip=skin))

# ---------- the habit: the green shirt a washed-out blue wool, the purple undershirt the hood and its collar ----------
shirt = b.sel(hue=(45, 110), sat=(0.15, 1), box=(0, 170, 330, 350))
shirt = b.grow(shirt, 2, 0.3) & region(S, 0, 170, 330, 350)
b.flatten(shirt, 2.0, keep_lines=0.25)
b.ramp(shirt, HABIT, gain=1.0)
under = b.sel(hue=(270, 360), sat=(0.08, 1), box=(0, 150, 330, 350)) | b.sel(hue=(0, 20), sat=(0.08, 0.6), val=(0, 0.6), box=(0, 150, 330, 350))
under = b.grow(under, 2, 0.3) & region(S, 0, 150, 330, 350) & ~shirt
b.ramp(under, HOOD, gain=1.15)
# (the habit's hood shows as the high dark collar round the neck - the base's undershirt, recoloured above)
# the tie: a frayed hemp cord
tie = b.sel(hue=(40, 75), sat=(0.3, 1), val=(0.4, 1), box=(120, 220, 190, 270))
b.ramp(b.grow(tie, 1, 0.3) & region(S, 120, 220, 190, 270), [(0.0, (70, 52, 36)), (0.4, (150, 112, 82)), (1.0, (206, 170, 132))])
b.save(OUT)
print('ok', OUT)
