# Halina (the widow of the new town's Map008, mother of Kostek and Jagódka - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22; tired,
# thin, about 35): People2_6 (the nun) repainted to her map sheet ($Npc_Wdowa) - the black veil a DARK GREY wool headscarf down to
# the shoulders, the white coif and its gold plaque painted over as the scarf's front fold, the pink hair dark brown, grey-brown
# eyes, the open smile closed (a tired, quiet mouth); the white cape a BROWN WOOL SHAWL over the shoulders (its gold edging dark,
# the toothed edge filled smooth), the clasp a dark knot, the black habit her black mourning dress.
# 0 PixelLab generations. Run: python tools/busts/make_wdowa.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Wdowa_Bust.png')
b = Bust('People2_6')
S = b.img.shape
LD = (0.55, 0.83)
op = b.op()

FACE = [(106, 128), (184, 124), (188, 160), (176, 194), (150, 206), (122, 196), (108, 168)]
EYES = [(104, 132), (186, 126), (186, 156), (104, 160)]

# ---------- the veil: a dark grey wool headscarf; the habit stays black ----------
dark = b.sel(val=(0, 0.42), box=(40, 0, 320, 350)) & ~b.poly(EYES)
HABIT = [(84, 300), (262, 292), (276, 352), (76, 352)]
habit = dark & b.poly(HABIT)
veil = dark & ~habit
GREYSCARF = [(0.0, (18, 18, 22)), (0.08, (40, 40, 46)), (0.18, (62, 62, 68)), (0.3, (84, 84, 90)), (0.42, (104, 104, 110))]
b.ramp(veil, GREYSCARF, gain=1.0)
b.ramp(habit, RAMPS['black'], gain=1.2)
# the veil's bluish rim lights and the coif's last bits: grey too
rim = b.sel(hue=(170, 290), sat=(0.03, 0.7), val=(0.42, 1), box=(40, 0, 320, 350)) & ~b.poly(FACE) & ~b.poly(EYES)
b.ramp(rim, [(0.0, (40, 40, 46)), (0.5, (70, 70, 76)), (0.8, (96, 96, 102)), (1.0, (116, 116, 122))])
# the scarf's front fold over the forehead (where the coif and the gold plaque were)
FOLD = [(66, 74), (80, 44), (106, 26), (140, 20), (170, 26), (190, 46), (194, 92), (184, 122), (166, 114), (140, 110), (114, 114), (96, 128),
        (90, 140), (70, 140)]
FOLD_T = ((46, 46, 52), (60, 60, 66), (76, 76, 82), (36, 36, 42))
b.over(cel(S, [FOLD], FOLD_T[:3], outline=False, shade=0, light=0, ldir=LD, clip=op))
FOLD_EDGE = [(80, 106), (92, 126), (114, 114), (140, 110), (166, 114), (184, 122), (188, 92)]
b.over(strokes(S, [(FOLD_EDGE[i], ((np.asarray(FOLD_EDGE[i]) + np.asarray(FOLD_EDGE[i + 1])) / 2).tolist(), FOLD_EDGE[i + 1], 2.0)
                   for i in range(len(FOLD_EDGE) - 1)], LINE, alpha=1.0, taper_to=1.0))
b.over(strokes(S, [((96, 40), (90, 70), (92, 104), 1.4), ((150, 26), (156, 60), (170, 100), 1.2), ((184, 50), (190, 80), (186, 110), 1.2)],
               FOLD_T[3], alpha=0.5, clip=b.poly(FOLD) & erode_cv(op, 3), taper_to=0.3))

# ---------- the hair dark brown, the eyes grey-brown, the mouth closed ----------
hair = b.sel(hue=(320, 12), sat=(0.25, 1), val=(0.3, 1), box=(84, 96, 200, 206)) & ~b.poly([(112, 140), (184, 134), (184, 156), (112, 160)]) & \
    ~b.poly([(140, 172), (176, 172), (176, 196), (140, 196)])
hair = b.grow(hair, 1, 0.3) & region(S, 84, 96, 200, 206)
b.ramp(hair, RAMPS['hair_dark'], gain=1.0)
iris = b.sel(hue=(230, 320), sat=(0.12, 1), poly=EYES)
b.ramp(iris, [(0.0, (28, 22, 20)), (0.3, (70, 58, 50)), (0.6, (112, 98, 86)), (0.9, (160, 148, 136))])
sk = b.src[176, 138, :3] * 255
sk2 = b.src[184, 132, :3] * 255
MOUTHP = [(146, 178), (160, 174), (174, 176), (176, 190), (164, 196), (148, 194)]
b.over(cel(S, [MOUTHP], (tuple(sk2), tuple(sk), tuple(sk)), outline=False, shade=2.5, light=0, ldir=LD))
b.over(strokes(S, [((150, 186), (160, 188), (170, 184), 1.6)], (140, 82, 74), alpha=0.95, taper_to=0.4))
b.over(strokes(S, [((154, 192), (160, 193), (166, 191), 1.0)], (196, 140, 124), alpha=0.6, taper_to=0.4))
# tired: a shadow under the eyes
b.over(strokes(S, [((116, 158), (128, 162), (140, 160), 1.4), ((156, 154), (168, 158), (180, 154), 1.4)], (190, 140, 130), alpha=0.45))

# ---------- the cape and the veil's ends: a brown wool shawl over the shoulders, the black dress in the middle ----------
DRESS = [(130, 222), (190, 222), (206, 352), (108, 352)]
b.over(cel(S, [DRESS], ((10, 10, 14), (24, 24, 30), (40, 40, 48)), outline=False, shade=6, light=1.5, ldir=LD))
SHAWL_T = ((70, 48, 32), (104, 76, 50), (132, 100, 68), (54, 36, 24))
SHL = [(152, 214), (136, 226), (122, 254), (114, 296), (110, 352), (16, 352), (22, 318), (38, 284), (62, 258), (94, 238), (126, 222)]
SHR = [(170, 214), (194, 222), (226, 236), (262, 250), (292, 268), (308, 300), (312, 352), (206, 352), (200, 300), (192, 258), (182, 228)]
for i, P in enumerate((SHL, SHR)):
    lay = cel(S, [P], SHAWL_T[:3], lw=2.0, shade=9, light=3, shade2=4, ldir=LD)
    m = erode_cv(lay[..., 3] > 0.5, 2)
    lay = over(lay, hair_strands(S, m, (160, 420), SHAWL_T[2], SHAWL_T[3], n=180, length=(3, 6), seed=61 + i, alpha=(0.3, 0.3)))
    # soft folds of the wool, from the neck down over the shoulder
    F = [((150, 232), (120, 270), (90, 330), 2.2), ((132, 236), (96, 262), (60, 300), 2.0)] if i == 0 else         [((176, 232), (214, 270), (246, 330), 2.2), ((196, 236), (240, 258), (282, 296), 2.0)]
    lay = over(lay, strokes(S, F, SHAWL_T[3], alpha=0.55, clip=m, taper_to=0.2))
    b.over(lay)
# the knot at the neck
b.over(cel(S, [ellipse(161, 222, 9, 7)], SHAWL_T[:3], lw=1.6, shade=3, light=1.4, ldir=LD))
b.over(cel(S, [[(154, 226), (146, 246), (154, 248), (160, 228)], [(166, 226), (176, 244), (168, 248), (162, 228)]], SHAWL_T[:3], lw=1.4,
           shade=2, light=1, ldir=LD))
from patches import patch
b.img = patch(b.img, [(244, 300), (268, 296), (272, 320), (248, 324)], erode_cv(b.poly(SHR), 3), lift=0.85, hue=(28, 0.3), seed=62)
b.save(OUT)
print('ok', OUT)
