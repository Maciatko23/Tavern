# python tools/wrak/make_bust.py [out.png]   -> img/pictures/Rozbitek_Bust.png
# Eryk Sowa / Ansgar Wiel (pakiet E: the castaway cartographer in the tavern, ~35, thin and tired): the RTP bust Actor1_5 repainted
# with the residents' bust kit (tools/busts/kit.py, 0 PixelLab generations) to match his map sheet ($Npc_Rozbitek): the hair
# darker brown with a short tail tied at the nape, a paler, tired face with dark stubble and shadows under the eyes, a thin
# pale scar through the left eyebrow (the viewer's right); below the head everything new: a dull grey-brown linen shirt with an
# open collar, the oversized grey wool coat bought from the ragman (sagging shoulders, a wide turned-down collar, a darn).
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "busts"))
from kit import *   # noqa: F401,F403

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, "Rozbitek_Bust.png")
LDIR = (0.55, 0.83)
b = Bust("Actor1_5")
S = b.img.shape

# the map's colours ($Npc_Rozbitek): coat (112,108,98)/(84,80,72)/(58,56,50), shirt (120,110,94), hair (72,52,38)/(44,30,22)
COAT_T = ((62, 60, 54), (104, 100, 90), (140, 136, 124), (44, 42, 38))
SHIRT_T = ((92, 82, 68), (128, 116, 98), (158, 146, 124))
SKIN_T = ((200, 150, 122), (226, 182, 152), (240, 204, 178))
HAIR_TAIL = ((34, 22, 16), (62, 42, 30), (92, 66, 48))

# ---- the head that stays: hair and face (the high navy collar, the gold, the pauldrons go)
HEAD = [(52, 0), (280, 0), (280, 118), (258, 134), (240, 142), (226, 150), (214, 166), (204, 182), (190, 196), (168, 203), (146, 198),
        (128, 184), (112, 166), (100, 146), (60, 110)]
keep = b.poly(HEAD) & b.op()
navy = b.sel(hue=(200, 260), sat=(0.25, 1))
gold = b.sel(hue=(25, 55), sat=(0.45, 1), val=(0.55, 1))
red = b.sel(hue=(330, 20), sat=(0.35, 1), val=(0.15, 0.7)) & region(S, 100, 140, 330, 350)
keep &= ~b.grow(navy | gold | red, 2, 0.3)
keep &= ~b.poly([(200, 178), (208, 162), (216, 148), (232, 140), (252, 138), (252, 214), (194, 214)])   # (the shadowed neck behind the jaw)
# hair: olive brown -> dark brown
hair = b.sel(hue=(20, 70), sat=(0.08, 0.7), val=(0.05, 0.75), box=(52, 0, 290, 160))
hair = b.grow(hair, 1, 0.25) & region(S, 52, 0, 290, 160) & ~b.poly([(118, 104), (226, 100), (232, 190), (120, 196)])
b.ramp(hair, [(0.0, (16, 10, 8)), (0.15, (34, 22, 16)), (0.3, (52, 36, 26)), (0.5, (76, 54, 40)), (0.7, (104, 76, 56)), (0.9, (140, 108, 82))], gain=1.1)
# the skin paler and greyer (tired), shadows under the eyes
skin = b.sel(hue=(0, 45), sat=(0.08, 0.6), val=(0.45, 1), box=(96, 80, 250, 210)) & ~hair
b.multiply(skin, (238, 224, 214), 1.0)
b.over(strokes(S, [((128, 132), (140, 136), (152, 134), 2.2), ((182, 128), (194, 132), (206, 130), 2.2)], (150, 112, 108), alpha=0.35, clip=skin))
# the stubble: chin, jaw and over the lip
JAW = [(118, 150), (134, 176), (150, 192), (168, 200), (190, 194), (210, 180), (226, 160), (222, 150), (200, 168), (180, 178), (160, 176),
       (140, 168), (124, 150)]
LIP = [(146, 158), (176, 154), (180, 160), (148, 164)]
b.over(blush(S, 168, 178, 40, 20, col=(96, 80, 74), alpha=0.22, clip=skin))
b.over(stubble(S, JAW, (70, 54, 46), density=0.14, seed=7, alpha=0.24, clip=skin))
b.over(stubble(S, LIP, (70, 54, 46), density=0.12, seed=8, alpha=0.22, clip=skin))
# the scar through the left eyebrow (the viewer's right): a thin pale line with a darker edge
b.over(strokes(S, [((198, 92), (201, 104), (203, 118), 1.8)], (150, 102, 92), alpha=0.75, clip=skin | hair))
b.over(strokes(S, [((199, 92), (202, 104), (204, 118), 1.0)], (246, 222, 208), alpha=0.9, clip=skin | hair))
head = take(b.img, keep)

# ---- the new body under the head
lay = np.zeros(S[:2] + (4,), np.float32)
# the tail of hair tied at the nape, behind the far shoulder
TAIL = [(198, 126), (246, 124), (260, 144), (262, 176), (254, 206), (238, 226), (214, 222), (204, 196), (196, 160)]
lay = over(lay, cel(S, [TAIL], HAIR_TAIL, lw=1.8, shade=6, light=2, ldir=LDIR))
lay = over(lay, strokes(S, [((226, 140), (238, 176), (236, 214), 1.2), ((240, 136), (250, 170), (246, 206), 1.0), ((212, 150), (222, 184), (220, 214), 1.0)],
                        HAIR_TAIL[2], alpha=0.55))
# the neck (thin)
NECK = [(128, 150), (214, 138), (216, 196), (208, 230), (196, 244), (160, 246), (144, 222), (132, 186)]
lay = over(lay, cel(S, [NECK], SKIN_T, lw=1.8, shade=10, light=2, ldir=LDIR))
# the shirt: open collar, the V shows the throat
SHIRT = [(120, 236), (150, 222), (170, 236), (190, 262), (210, 234), (234, 222), (262, 240), (262, 350), (120, 350)]
sh = cel(S, [SHIRT], SHIRT_T, lw=1.8, shade=8, light=2, ldir=LDIR)
lay = over(lay, sh)
FLAP_L = [(150, 222), (138, 232), (162, 262), (188, 276), (172, 244)]
FLAP_R = [(234, 220), (240, 236), (224, 260), (196, 276), (214, 244)]
lay = over(lay, cel(S, [FLAP_L, FLAP_R], SHIRT_T, lw=1.4, shade=3, light=1.5, ldir=LDIR))
# the coat: too big - the shoulders sag past the real ones, a wide turned-down collar, the front open
COAT_L = [(0, 280), (24, 256), (66, 238), (110, 228), (138, 224), (150, 240), (170, 300), (178, 350), (0, 350)]
COAT_R = [(240, 220), (270, 222), (306, 236), (330, 250), (330, 350), (214, 350), (222, 300), (230, 250)]
co = cel(S, [COAT_L, COAT_R], COAT_T[:3], lw=2.0, shade=12, light=3, ldir=LDIR)
cm = erode_cv(co[..., 3] > 0.5, 2)
# heavy wool folds, the sagging shoulder seam well down the arm
co = over(co, strokes(S, [((30, 350), (40, 304), (60, 270), 6.0), ((300, 350), (292, 300), (290, 258), 7.0), ((150, 350), (148, 300), (140, 260), 4.0)],
                      COAT_T[3], alpha=0.55, clip=cm, taper_to=0.05))
co = over(co, strokes(S, [((14, 300), (36, 268), (56, 262), 1.4), ((290, 250), (314, 262), (330, 274), 1.4)], COAT_T[3], alpha=0.8, clip=cm, taper_to=1.0))
co = over(co, strokes(S, [((24, 350), (34, 304), (54, 272), 1.2), ((294, 350), (286, 300), (284, 256), 1.2)], COAT_T[2], alpha=0.6, clip=cm, taper_to=0.1))
# a darn on the near shoulder (cross stitches of a lighter thread)
co = over(co, strokes(S, [((70, 262), (76, 268), (82, 274), 1.0), ((82, 262), (76, 268), (70, 274), 1.0), ((84, 260), (90, 266), (96, 272), 1.0),
                          ((96, 260), (90, 266), (84, 272), 1.0)], (156, 150, 136), alpha=0.85, clip=cm, taper_to=1.0))
lay = over(lay, co)
# the wide collar of the coat, turned down over the shoulders
COL_L = [(110, 228), (140, 216), (156, 226), (150, 248), (128, 270), (98, 262), (84, 246)]
COL_R = [(236, 214), (262, 218), (290, 232), (284, 256), (258, 262), (236, 246), (232, 228)]
lay = over(lay, cel(S, [COL_L, COL_R], COAT_T[:3], lw=1.8, shade=5, light=2.5, ldir=LDIR))
# the head over it all, its chin's shadow on the neck
hm = head[..., 3] > 0.5
lay[..., :3] = np.where((shift(hm & (b.yy > 150), 2, 9) & ~hm & (lay[..., 3] > 0.5))[..., None],
                        lay[..., :3] * np.asarray((0.74, 0.66, 0.66), np.float32), lay[..., :3])
b.img = over(lay, head)
b.save(OUT)
print("ok", OUT)
