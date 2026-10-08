# Ambrozy in the Order's robe - KEPT FOR LATER (2026-10-07): the first Dzwonnik_Bust (2026-10-06) - People3_1 (the old king)
# repainted: the crown gone and a bald old head painted in its place (white hair kept at the sides), the long white beard kept,
# the royal robe and its fur a grey robe of the Order (still the draped, ornate cut), a big iron key on a cord. The user liked
# it, but on the map Ambrozy wears a plain habit - make_dzwonnik.py is that one now; this picture waits for a scene in which he
# shows himself as the Order's man. Run: python tools/busts/make_ambrozy_zakon.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Ambrozy_Bust_Zakon.png')
b = Bust('People3_1')
OLD_LDIR = (-0.55, -0.83)   # (kit.cel's default before 2026-10-07: kept, so this script still makes the kept picture byte for byte)
S = b.img.shape

# ---------- the robe: grey wool (the beard and face kept) ----------
BEARD = [(104, 128), (222, 128), (232, 196), (206, 262), (178, 336), (138, 336), (114, 262), (98, 196)]
keep = b.poly(BEARD) | b.poly([(96, 0), (244, 0), (246, 150), (96, 150)]) | b.sel(sat=(0, 0.14), val=(0.8, 1), box=(84, 90, 256, 210))
body = b.op() & ~keep
GREY_ROBE = [(0.0, (20, 20, 22)), (0.15, (44, 44, 46)), (0.3, (68, 68, 70)), (0.5, (96, 96, 98)), (0.7, (124, 124, 126)), (0.9, (150, 150, 152)),
             (1.0, (164, 164, 166))]
clasp = b.poly([(146, 262), (196, 262), (196, 330), (146, 330)]) & b.sel(hue=(15, 240), sat=(0.35, 1))
body |= clasp
b.flatten(body & b.sel(hue=(15, 70), sat=(0.35, 1)), 3.0, keep_lines=0.22)
b.ramp(body, GREY_ROBE, gain=0.95)
inner = b.poly(BEARD) & (b.sel(hue=(190, 300), sat=(0.2, 1)) | b.sel(hue=(10, 65), sat=(0.14, 1), box=(186, 196, 250, 340)) | b.sel(hue=(10, 65), sat=(0.4, 1), box=(130, 250, 200, 340))) & ~clasp
# (the blue and violet under the beard, the fur lining and the gold by it)
b.ramp(inner, GREY_ROBE, gain=1.3)


# ---------- the crown off: the area above its lower edge cleared, a bald head painted ----------
CROWN = [(76, 0), (254, 0), (254, 84), (228, 92), (202, 95), (176, 98), (146, 94), (120, 88), (90, 91), (76, 94)]
b.erase(b.poly(CROWN))
ARC = ellipse(167, 108, 70, 80, 0, 48, np.pi * 1.0, np.pi * 2.0)
DOME = ARC + [(237, 110), (210, 104), (176, 104), (146, 101), (118, 104), (97, 110)]
SKIN = ((214, 160, 120), (240, 198, 158), (254, 228, 196))
b.over(cel(S, [DOME], SKIN, outline=False, shade=12, light=5, ldir=OLD_LDIR))
top = ARC
b.over(strokes(S, [(top[i], ((np.asarray(top[i]) + np.asarray(top[i + 1])) / 2).tolist(), top[i + 1], 2.0) for i in range(len(top) - 1)],
               LINE, alpha=1.0, taper_to=1.0))
# old age on the scalp and forehead: creases, a few spots
b.over(strokes(S, [((128, 84), (160, 78), (196, 84), 1.4), ((134, 92), (162, 87), (192, 92), 1.2), ((150, 60), (166, 57), (182, 60), 1.1)],
               (176, 112, 80), alpha=0.6))
b.over(dots(S, [(176, 46, 2.2), (186, 52, 1.6), (146, 50, 1.8)], (206, 150, 110), alpha=0.6))
# white hair round the sides, over the ears
HAIR_T = ((170, 170, 180), (226, 226, 232), (250, 250, 252))
side = []
for i in range(7):
    y = 96 + i * 5
    side.append(((100 + i * 0.6, y), (92 - i * 0.8, y + 12), (88 - i * 1.2, y + 26), 1.5))
    side.append(((234 - i * 0.6, y - 2), (242 + i * 0.8, y + 10), (246 + i * 1.2, y + 24), 1.5))
b.over(strokes(S, side, HAIR_T[1], alpha=0.95, taper_to=0.15))
b.over(strokes(S, side[::2], HAIR_T[0], alpha=0.6, taper_to=0.15))

# ---------- the iron key on its cord ----------
b.over(strokes(S, [((206, 244), (226, 270), (236, 292), 1.4)], (60, 46, 30), alpha=1.0))
KEY_T = ((40, 40, 46), (86, 86, 94), (140, 140, 150))
ring = ellipse(238, 298, 8, 8, 0, 24)
hole = ellipse(238, 298, 4, 4, 0, 16)
shaft = [(235, 305), (241, 305), (242, 334), (236, 334)]
bit = [(242, 322), (250, 322), (250, 326), (246, 326), (246, 330), (242, 330)]
b.over(cel(S, [ring, shaft, bit], KEY_T, lw=1.2, shade=2, light=1, holes=[hole], ldir=OLD_LDIR))
b.save(OUT)
print('ok', OUT)
