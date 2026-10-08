# Tadek Mlot (the town's blacksmith, burly, middle-aged): SF_Actor3_1 repainted to match his map sheet ($Npc_Kowal):
# BALD - the short dark hair gone and a shaved, shiny scalp painted in its place (a soot smudge on it), short-cropped dark
# brown hair left only round the sides and back over the ears; a full, bushy dark-brown beard with a moustache (longer and
# browner than before, joined to the sideburns); the white polo a grey linen work shirt with its sleeves rolled up over the
# bare forearms, a brown leather apron bib with straps over it, a little soot.
# (2026-10-06 first version had hair and a short black beard - the user: "Kowal jest łysy, ... broda nie pasuje"; 2026-10-07.)
# Run: python tools/busts/make_kowal.py [out.png]
import sys
from kit import *
from patches import smudge

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Kowal_Bust.png')
b = Bust('SF_Actor3_1')
S = b.img.shape

# ---------- the clothes (as before) ----------
shirt = b.sel(sat=(0, 0.22), val=(0.55, 1), box=(0, 170, 330, 350)) | b.sel(hue=(195, 240), sat=(0, 0.3), val=(0.5, 1), box=(0, 170, 330, 350))
trim = b.sel(hue=(200, 250), sat=(0.2, 1), val=(0, 0.6), box=(0, 170, 330, 350))
b.ramp(shirt, [(0.0, (30, 30, 32)), (0.4, (92, 90, 86)), (0.6, (128, 126, 120)), (0.75, (156, 152, 144)), (0.9, (182, 178, 168)),
               (1.0, (198, 194, 184))])
b.ramp(trim, [(0.0, (20, 18, 16)), (0.3, (48, 44, 40)), (0.6, (76, 70, 64))], gain=1.2)
# the leather apron bib (behind the crossed arms: only over the shirt) and its straps up round the neck
BIB = [(146, 214), (214, 210), (234, 270), (240, 352), (124, 352), (130, 270)]
STRAPS = [[(146, 214), (156, 214), (152, 190), (142, 190)], [(204, 212), (214, 210), (232, 186), (222, 184)]]
skin = b.sel(hue=(0, 45), sat=(0.2, 1), val=(0.35, 1))
cloth = (shirt | trim | b.poly(BIB)) & ~skin & b.op()
b.over(cel(S, [BIB] + STRAPS, ((58, 34, 18), (98, 62, 34), (138, 94, 56)), lw=2.0, shade=9, light=3, clip=cloth))
b.over(strokes(S, [((136, 262), (182, 268), (230, 262), 1.0), ((150, 222), (151, 244), (152, 262), 0.9)], (60, 36, 20), alpha=0.6, clip=cloth))
b.over(cel(S, [ellipse(151, 218, 4, 3.4), ellipse(208, 215, 4, 3.4)], ((90, 92, 100), (160, 164, 172), (220, 222, 228)), lw=1.0, shade=1.4, light=0.8))

# ---------- the bald head ----------
# the skull: an ellipse's arc from the far temple over the top to the nape; its lower edge runs just above the brows, round
# the ear (kept) and down behind it. Everything of the old hair outside it goes (the fringe tips, the hair's volume).
CX, CY, RX, RY = 177, 101, 71, 77
ARC = ellipse(CX, CY, RX, RY, 0, 60, np.pi * 1.0, np.pi * 2.0 + 0.42)
EAR = [(211, 100), (214, 94), (223, 92), (231, 97), (235, 108), (235, 122), (231, 131), (222, 134), (214, 128), (210, 114)]
LOWER = [(238, 138), (233, 133), (236, 122), (236, 106), (231, 95), (222, 90), (212, 92), (205, 86), (197, 82), (184, 79), (166, 79), (150, 82),
         (134, 85), (120, 88), (110, 92), (106, 100)]
DOME = ARC + LOWER
FACE = [(104, 94), (120, 88), (150, 82), (184, 79), (205, 86), (212, 96), (216, 200), (104, 200)]
dome = b.poly(DOME)
old_hair = b.op() & region(S, 60, 0, 290, 150) & ~b.sel(hue=(0, 45), sat=(0.2, 1), val=(0.55, 1)) & ~b.poly(FACE, EAR)
b.erase(old_hair & ~dome)
SKIN = ((228, 172, 122), (248, 202, 150), (255, 226, 174), (204, 140, 100))
# (painted as the whole ellipse and cut to the dome: no shade band along the cut above the brows)
b.over(cel(S, [ellipse(CX, CY, RX, RY, 0, 60)], SKIN, outline=False, shade=10, light=6, shade2=4, ldir=(0.5, 0.86), clip=dome))
# the shine of a shaved scalp (a flat cel highlight, upper left) and its softer rim
b.over(cel(S, [ellipse(150, 44, 22, 11, -0.55, 30)], ((255, 236, 200), (255, 236, 200), (255, 246, 222)), outline=False, shade=0, light=0),
       k=None)
b.over(strokes(S, [((128, 62), (136, 46), (152, 34), 3.0)], (255, 240, 210), alpha=0.85, taper_to=0.2))
# the line round the top of the skull
top = ARC
b.over(strokes(S, [(top[i], ((np.asarray(top[i]) + np.asarray(top[i + 1])) / 2).tolist(), top[i + 1], 2.2) for i in range(len(top) - 1)],
               LINE, alpha=1.0, taper_to=1.0))
# the frowning forehead: two creases over the near brow's inner end, three faint lines across, a bump of the brow ridge
b.over(strokes(S, [((140, 82), (138, 74), (141, 64), 1.6), ((148, 81), (147, 74), (150, 66), 1.3)], (176, 108, 74), alpha=0.75))
b.over(strokes(S, [((124, 68), (150, 62), (178, 64), 1.3), ((130, 58), (154, 53), (180, 55), 1.1), ((158, 72), (176, 70), (196, 74), 1.1)],
               (196, 128, 88), alpha=0.55))
# ---------- short dark-brown hair left round the sides and the back (over and behind the ear, into the sideburns) ----------
HT = ((44, 30, 22), (68, 48, 34), (108, 80, 58), (26, 18, 13))
SIDE = [(199, 88), (207, 85), (219, 86), (232, 89), (242, 97), (247, 110), (245, 125), (239, 137), (234, 135), (237, 122), (237, 106), (231, 95),
        (222, 91), (212, 93), (213, 104), (212, 116), (206, 118), (202, 104)]
side = cel(S, [SIDE], HT[:3], outline=False, shade=4, light=1.5)
sm = side[..., 3] > 0.5
side = over(side, hair_strands(S, sm, (236, 150), HT[2], HT[3], n=70, length=(4, 8), seed=7, alpha=(0.6, 0.6)))
b.over(side)
# (the old hair's bluish shine left inside the ear's outline: hair too)
earhair = b.poly(EAR) & ~b.sel(hue=(0, 45), sat=(0.2, 1), val=(0.35, 1)) & b.sel(lum=(0.12, 1))
earhair |= b.sel(hue=(190, 300), sat=(0.12, 1), box=(205, 86, 250, 140), src=False)          # (its blue rim light)
earhair |= b.sel(hue=(0, 50), sat=(0.2, 1), val=(0.5, 1), box=(234, 100, 242, 138), src=False)  # (skin left behind the ear's back)
b.ramp(earhair, [(0.0, HT[3]), (0.3, HT[0]), (0.6, HT[1]), (1.0, HT[2])])
b.over(outline(S, [SIDE], lw=1.6, clip=~b.poly(EAR)))

# ---------- the beard and moustache: dark brown, full and bushy, longer at the chin ----------
OUTER = [(206, 112), (222, 118), (233, 134), (230, 158), (220, 182), (204, 206), (184, 224), (162, 232), (142, 228), (126, 214), (114, 194),
         (108, 172), (106, 152), (108, 132)]
INNER = [(116, 128), (119, 142), (125, 154), (136, 158), (150, 160), (168, 157), (186, 151), (200, 141), (207, 128), (208, 116)]
MOUS = [(117, 142), (128, 134), (148, 131), (164, 131), (180, 134), (187, 144), (178, 142), (164, 139), (150, 140), (134, 143),
        (121, 151)]
TONES = ((44, 30, 22), (68, 48, 34), (108, 80, 58), (26, 18, 13))
b.over(beard2(S, OUTER, INNER, TONES, flow=(160, 240), mous=MOUS, mous_flow=(150, 178), seed=4, n=150, tip=6, out=3.0, seg=8))
# the thick brows: dark brown like the beard
brows = b.sel(lum=(0, 0.42), polys=[[(110, 86), (138, 84), (140, 98), (112, 100)], [(146, 80), (206, 78), (206, 96), (146, 98)]]) & ~dome
b.ramp(brows, [(0.0, (22, 14, 10)), (0.2, (40, 28, 20)), (0.42, (70, 50, 36))])
# soot: on the scalp (as on the map), the cheek and the forearm
b.img = smudge(b.img, [[(122, 58), (132, 52), (144, 54), (148, 61), (140, 66), (128, 66)], [(144, 62), (152, 60), (156, 66), (148, 69)]],
              (96, 80, 72), 0.22)
b.over(dots(S, [(134, 58, 1.6), (140, 61, 1.2), (128, 62, 1.0), (150, 65, 1.1)], (100, 84, 76), alpha=0.35))
b.img = smudge(b.img, [[(196, 104), (204, 100), (210, 106), (204, 112), (196, 112)]], (70, 62, 58), 0.22)
b.img = smudge(b.img, [[(60, 300), (74, 294), (86, 300), (78, 308), (64, 308)]], (70, 62, 58), 0.25)
b.save(OUT)
print('ok', OUT)
