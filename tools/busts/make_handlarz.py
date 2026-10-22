# Szymon Juczny (the travelling peddler of the roads, about 40, lean): Actor2_7 (the young man in the green cloak) repainted to
# match his map sheet ($Npc_Handlarz): the blond hair dark brown, a short full dark-brown beard and moustache round the jaw
# (painted), stubble and a few lines of the road in the face (older, tanned); a wide dark-brown felt travel hat with a darker
# band (the soft hat of SF_Actor2_4, widened); the bright green cloak a faded dark green, the uniform's black collar and white
# piping a dull brown linen shirt; the armour plates at the bottom a brown leather pouch; the pack's leather strap over the
# near shoulder and the rolled grey blanket of his pack peeping up behind it.
# Run: python tools/busts/make_handlarz.py [out.png]
import sys
from kit import *
from make_kapral import celf

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Handlarz_Bust.png')
LDIR = (0.55, 0.83)
b = Bust('Actor2_7')
S = b.img.shape

# the map's colours ($Npc_Handlarz front frame): hat (51, 39, 31)/(35, 29, 25), cloak (84, 103, 79)/(54, 66, 51)/(32, 41, 31),
# beard (48, 30, 20)/(92, 64, 46), skin (227, 177, 145), straps and pouches (82, 69, 57)/(129, 88, 62), blanket (134, 132, 128)/(92, 91, 90)
CLOAK = [(0.0, (12, 16, 12)), (0.12, (26, 34, 26)), (0.28, (40, 52, 40)), (0.45, (56, 70, 54)), (0.62, (74, 92, 70)), (0.8, (94, 112, 88)),
         (1.0, (120, 136, 110))]
HAT = [(0.0, (14, 10, 8)), (0.2, (30, 22, 18)), (0.38, (46, 34, 28)), (0.55, (62, 48, 38)), (0.72, (80, 62, 50)), (0.88, (100, 80, 64))]
BEARD_T = ((50, 32, 22), (76, 52, 36), (104, 74, 52), (32, 20, 14))
STRAP_T = ((62, 40, 26), (100, 70, 46), (136, 98, 66))
ROLL_T = ((92, 90, 88), (132, 130, 126), (170, 168, 162))

FACE = [(96, 100), (200, 92), (214, 130), (204, 160), (180, 182), (150, 186), (118, 168), (100, 140)]

# ---- hair: dark brown ----
skin0 = b.sel(hue=(0, 40), sat=(0.08, 0.75), val=(0.6, 1), box=(80, 60, 240, 200))
hair = b.sel(hue=(30, 75), sat=(0.12, 0.75), val=(0.25, 1), box=(50, 0, 250, 170)) & ~b.sel(hue=(10, 35), sat=(0.15, 0.6), val=(0.7, 1))
hair |= b.sel(sat=(0, 0.35), val=(0.75, 1), box=(50, 0, 250, 100)) & ~skin0          # (the hair's pale shine bands)
hair |= b.sel(hue=(330, 30), sat=(0.05, 0.5), val=(0.6, 1), box=(50, 0, 250, 92)) & ~skin0   # (the pink sheen at the parting)
hair = b.grow(hair, 1, 0.3) & region(S, 50, 0, 250, 170)
b.ramp(hair, RAMPS['hair_dark'], gain=0.62)
rim = b.sel(hue=(60, 170), sat=(0.2, 1), box=(50, 0, 250, 180)) & ~b.sel(box=(0, 170, 330, 350))   # (the cloak's green rim light on the hair)
b.ramp(rim, [(0.0, (30, 20, 14)), (1.0, (96, 70, 50))])
# brown eyes (the map's eyes are dark)
EYES = [[(96, 110), (132, 108), (132, 126), (96, 128)], [(150, 96), (190, 94), (190, 118), (150, 118)]]
eyes = b.sel(hue=(160, 250), sat=(0.15, 1), polys=EYES)
b.ramp(eyes, [(0.0, (20, 12, 8)), (0.2, (52, 34, 22)), (0.45, (98, 68, 42)), (0.7, (150, 112, 74))])

# ---- the cloak: faded dark green; the uniform's collar a dull linen shirt; the armour plates a leather pouch ----
cloak = b.sel(hue=(90, 200), sat=(0.15, 1), box=(0, 170, 330, 350))
cloak = b.grow(cloak, 2, 0.3) & region(S, 0, 170, 330, 350)
b.ramp(cloak, CLOAK, gain=1.0)
collar = (b.sel(sat=(0, 0.25), box=(110, 165, 235, 240)) | b.sel(hue=(20, 60), sat=(0.15, 0.7), box=(110, 165, 235, 240))) & ~cloak
b.ramp(collar, [(0.0, (26, 20, 16)), (0.2, (60, 48, 38)), (0.45, (98, 82, 64)), (0.7, (130, 112, 88)), (1.0, (150, 132, 106))], gain=0.9)
gear = b.sel(box=(200, 260, 330, 350)) & ~cloak
b.ramp(gear, RAMPS['leather'], gain=0.95)

# ---- older, tanned, tired: the skin a touch darker and warmer, lines at the eyes and the mouth, stubble ----
EYEP = b.poly([(98, 112), (130, 110), (130, 126), (98, 128)], [(152, 98), (190, 96), (190, 116), (152, 116)])
skin = b.sel(hue=(0, 40), sat=(0.08, 0.75), val=(0.55, 1), box=(80, 60, 240, 200)) | (b.sel(sat=(0, 0.08), val=(0.8, 1), box=(96, 90, 214, 190)) & ~EYEP)
skin &= ~hair & ~b.sel(hue=(160, 250), sat=(0.1, 1))
b.multiply(skin, (238, 206, 186), 0.6)
WR = (168, 110, 84)
b.over(strokes(S, [((176, 120), (182, 124), (188, 123), 1.0), ((176, 126), (182, 130), (187, 130), 0.9), ((130, 74), (150, 70), (170, 73), 1.0),
                   ((166, 136), (172, 148), (174, 158), 1.3), ((108, 126), (112, 130), (117, 130), 0.9)], WR, alpha=0.5, clip=skin))

# ---- the short full beard round the jaw and a moustache over the mouth ----
OUTER = [(206, 120), (208, 140), (204, 156), (194, 172), (178, 186), (160, 195), (142, 194), (124, 184), (110, 168), (101, 150),
         (99, 132)]
INNER = [(104, 134), (110, 148), (120, 160), (130, 166), (145, 168), (158, 166), (166, 160), (176, 148), (186, 134), (194, 118)]
MOUS = [(122, 162), (130, 155), (144, 151), (158, 152), (168, 156), (172, 165), (164, 165), (152, 164), (140, 165), (128, 169)]
b.over(beard2(S, OUTER, INNER, BEARD_T, flow=(150, 220), mous=MOUS, mous_flow=(148, 180), seed=21, n=110, tip=4, out=2.0, seg=8,
              mous_tones=((56, 36, 24), (84, 58, 40), (112, 82, 58), (36, 22, 16))))

# ---- the pack's roll behind the near shoulder (under everything) and its strap over the shoulder ----
# (a soft wool roll: fat, its turns and a darker woven stripe; the ends with the spiral of the rolled blanket)
ROLL = [(40, 150), (80, 136), (300, 130), (300, 196), (80, 202), (40, 196)]
roll = cel(S, [ROLL], ROLL_T, lw=2.0, shade=10, light=3.5, ldir=LDIR)
rm = erode_cv(roll[..., 3] > 0.5, 2)
roll = over(roll, strokes(S, [((246, 134), (242, 164), (246, 196), 1.6), ((214, 134), (210, 164), (214, 198), 1.4),
                              ((84, 140), (80, 168), (84, 198), 1.4)], ROLL_T[0], alpha=0.75, clip=rm, taper_to=1.0))   # (the turns)
roll = over(roll, strokes(S, [((272, 132), (268, 164), (272, 196), 5.0), ((110, 138), (106, 168), (110, 200), 5.0)], (110, 104, 96),
                              alpha=0.9, clip=rm, taper_to=1.0))                         # (a darker woven stripe)
for cx in (300, 40):
    roll = over(roll, cel(S, [ellipse(cx, 168, 12, 33)], ((118, 116, 110), (156, 154, 148), (192, 190, 184)), lw=1.8, shade=4, light=1.6,
                          ldir=LDIR))                                                    # (the roll's ends)
    roll = over(roll, strokes(S, [((cx + 2, 146), (cx - 8, 168), (cx + 2, 190), 1.3), ((cx + 3, 156), (cx - 3, 168), (cx + 3, 180), 1.2),
                                  ((cx + 3, 162), (cx + 1, 168), (cx + 4, 174), 1.0)], (96, 94, 90), alpha=0.85))
for x in (258, 66):
    roll = over(roll, cel(S, [[(x - 6, 128), (x + 6, 128), (x + 7, 206), (x - 5, 206)]], STRAP_T, lw=1.4, shade=2, light=1, ldir=LDIR,
                          clip=roll[..., 3] > 0.5))                                      # (the ties)
b.img = over(roll, b.img)
# the two shoulder straps of the pack over the cloak: the near one over the shoulder and down the chest, the far one half hidden
for P, w in (((226, 192), (240, 262), (236, 352)), 17), (((112, 206), (104, 270), (98, 352)), 13):
    STRAP = taper(bez(P[0], P[1], P[2], 30), w * 0.9, w)
    st = celf(S, [STRAP], STRAP_T, lw=1.8, shade=4, light=2, ldir=LDIR)
    st[..., 3] *= (b.op() & (b.yy > 186))
    sm = erode_cv(st[..., 3] > 0.5, 3)
    st = over(st, strokes(S, [(P[0], P[1], P[2], 0.8)], (152, 118, 82), alpha=0.6, clip=sm))   # (the stitching)
    b.over(st)
b.over(cel(S, [[(228, 286), (250, 286), (250, 302), (228, 302)]], ((96, 76, 40), (170, 140, 76), (220, 196, 128)), lw=1.4, shade=2,
           light=1, ldir=LDIR, holes=[[(234, 291), (244, 291), (244, 297), (234, 297)]]))      # (the near strap's buckle)

# ---- the wide dark-brown felt travel hat ----
M = affine(scale=(1.42, 1.1), rot=-6, src_pt=(143, 92), dst_pt=(146, 76))
hat = bucket_hat(M, S, HAT, gain=1.0, flatten=3.0, band=((20, 14, 10), (34, 24, 18), (52, 38, 30)))
put_hat(b, hat, shadow=(140, 110, 100), shadow_k=0.55, sdx=2, sdy=9)
b.save(OUT)
print('ok', OUT)
