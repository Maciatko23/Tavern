# Leon Dłuto (the carpenter of the new town's Map008 - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22; broad, weathered, about 45):
# People1_7 repainted to his map sheet ($Npc_Ciesla) - the knit cap a faded GREY-BLUE felt one with a turned-up rim pulled low over
# the forehead, the white hair at the sides brown going grey, brown brows, a short full BROWN BEARD with grey hairs and a moustache;
# the green tunic and the maroon undershirt an off-white LINEN shirt, a long TAN CANVAS APRON (bib, straps over the shoulders, a
# front pocket) with sawdust on it.
# 0 PixelLab generations. Run: python tools/busts/make_ciesla.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Ciesla_Bust.png')
b = Bust('People1_7')
S = b.img.shape
LD = (0.55, 0.83)
op = b.op()
skin = b.sel(hue=(10, 45), sat=(0.15, 0.7), val=(0.55, 1), box=(60, 60, 230, 210))

# ---------- the cap: grey-blue felt, a turned-up rim low over the forehead ----------
cap = b.sel(hue=(40, 100), sat=(0.12, 0.9), val=(0.15, 0.95), box=(60, 10, 235, 112)) & ~skin
cap = b.grow(cap, 2, 0.3) & region(S, 60, 10, 235, 112) & ~skin
FELT = [(0.0, LINE), (0.2, (40, 50, 60)), (0.35, (62, 76, 88)), (0.5, (84, 100, 112)), (0.65, (104, 120, 130)), (0.8, (124, 140, 148)),
        (0.95, (144, 158, 164))]
b.ramp(cap, FELT, gain=1.1)
RIM = [(76, 74), (100, 64), (140, 60), (180, 66), (210, 80), (222, 98), (206, 100), (186, 92), (160, 90), (130, 92), (104, 96), (84, 102), (74, 92)]
RIM_T = ((70, 84, 96), (100, 116, 128), (128, 142, 152))
b.over(cel(S, [RIM], RIM_T, lw=2.0, shade=4, light=2, ldir=LD))
b.over(strokes(S, [((84, 84), (140, 74), (204, 88), 1.2)], (60, 72, 84), alpha=0.6, clip=b.poly(RIM)))   # (the fold of the rim)

# ---------- hair at the sides brown going grey; brows brown ----------
side = b.sel(sat=(0, 0.25), val=(0.4, 1), box=(158, 60, 228, 150)) & ~skin
side = b.grow(side, 1, 0.3) & region(S, 158, 60, 228, 150) & ~skin
b.ramp(side, [(0.0, (34, 26, 20)), (0.3, (72, 56, 42)), (0.55, (110, 90, 72)), (0.75, (140, 124, 108)), (0.9, (168, 158, 146)), (1.0, (186, 178, 168))])
brows = b.sel(sat=(0, 0.3), val=(0.4, 1), polys=[[(84, 100), (114, 98), (116, 112), (84, 114)], [(122, 92), (166, 90), (166, 106), (122, 108)]])
b.ramp(brows, [(0.0, (40, 28, 20)), (0.4, (84, 60, 42)), (0.8, (124, 96, 70)), (1.0, (150, 122, 96))])

# ---------- a short full brown beard with grey hairs, a moustache ----------
OUTER = [(186, 126), (182, 150), (171, 170), (153, 186), (130, 193), (109, 185), (95, 167), (89, 148), (87, 130)]
INNER = [(94, 138), (100, 154), (108, 166), (122, 173), (140, 173), (156, 165), (166, 150), (174, 134), (181, 120)]
TONES = ((52, 36, 26), (84, 60, 42), (122, 94, 70), (36, 24, 16))
b.over(beard2(S, OUTER, INNER, TONES, flow=(132, 240), seed=91, n=130, tip=5, out=2.4, seg=8))
MOUS = [(97, 158), (108, 150), (122, 147), (136, 148), (148, 151), (157, 158), (159, 167), (151, 163), (138, 160), (124, 160), (110, 162),
        (100, 167)]
b.over(cel(S, [MOUS], TONES[:3], lw=1.4, shade=2.5, light=1.2, ldir=LD))
b.over(hair_strands(S, erode_cv(b.poly(MOUS), 1), (160, 168), TONES[2], TONES[3], n=24, length=(5, 9), seed=93))
beard_m = b.poly(OUTER + INNER) | b.poly(MOUS)
b.over(hair_strands(S, erode_cv(beard_m, 2), (132, 240), (176, 170, 160), (150, 144, 136), n=40, length=(4, 8), seed=95, alpha=(0.5, 0.4)))

# ---------- the clothes: linen shirt, tan canvas apron ----------
torso = op & region(S, 0, 150, 330, 350)
green = b.sel(hue=(55, 110), sat=(0.15, 1), box=(0, 170, 330, 350))
green = b.grow(green, 2, 0.3) & torso & ~skin
maroon = b.sel(hue=(300, 40), sat=(0.08, 0.7), val=(0.12, 0.75), box=(0, 150, 330, 350)) & ~skin & ~green
maroon = b.grow(maroon, 1, 0.3) & torso & ~skin & ~green
b.ramp(green, RAMPS['linen'], gain=0.95)
b.ramp(maroon, RAMPS['linen_dirty'], gain=1.25)
tie = b.sel(hue=(45, 70), sat=(0.3, 1), val=(0.5, 1), box=(130, 220, 200, 280))
b.ramp(tie, RAMPS['leather'], gain=1.0)
TAN = ((134, 102, 62), (174, 142, 94), (202, 174, 122))
BIB = [(118, 262), (212, 256), (224, 356), (106, 356)]
STRAPS = [taper(bez((124, 262), (130, 232), (140, 196), 16), 6, 6), taper(bez((206, 258), (202, 228), (192, 194), 16), 6, 6)]
b.over(cel(S, STRAPS, TAN, lw=1.6, shade=2, light=1.2, ldir=LD, clip=torso))
b.over(cel(S, [BIB], TAN, lw=2.0, shade=8, light=2.5, ldir=LD, clip=torso | region(S, 100, 340, 230, 350)))
POCKET = [(140, 302), (192, 299), (194, 336), (142, 339)]
b.over(cel(S, [POCKET], ((150, 116, 72), (180, 148, 100), (198, 170, 120)), lw=1.4, shade=3, light=1, ldir=LD))
b.over(strokes(S, [((146, 306), (166, 304), (188, 303), 1.0)], (120, 92, 56), alpha=0.8, taper_to=1.0))   # (the pocket's hem)
# a pencil stub in the pocket, sawdust on the apron
b.over(cel(S, [[(176, 288), (180, 287), (183, 304), (179, 305)]], ((150, 110, 50), (200, 160, 80), (230, 200, 120)), lw=1.0, shade=1, light=0.5))
rng = np.random.RandomState(9)
dust = [(rng.uniform(112, 220), rng.uniform(266, 350), rng.uniform(0.9, 1.6)) for _ in range(40)]
b.over(dots(S, dust, (232, 214, 170), alpha=0.85, clip=b.poly(BIB)))
b.img = smudge(b.img, [[(124, 320), (150, 316), (156, 344), (126, 348)]], (110, 84, 52), 0.2)
b.save(OUT)
print('ok', OUT)
