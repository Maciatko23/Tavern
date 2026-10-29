# Ostap (a traveller from the ferry, docs/PODROZNI.md 2.7: the royal envoy's guardsman, big and burly, about 30, 2026-10-29):
# Actor2_1 (the calm young blue-haired face in plate armour with the silver circlet) repainted to his PixelLab map sheet
# ($Npc_Gwardzista) - the face kept inside a steel MAIL COIF and under a steel KETTLE HAT (the long blue hair and the circlet
# under them; the strand across the forehead and what of the circlet peeps under the brim filled with skin), the skin a
# ruddier tan, the blue eyes dark, heavy dark brows drawn in a frown under the brim, a THICK DARK MOUSTACHE over the mouth
# and a shadow of stubble on the chin (painted); below the head everything new: the coif's mail collar round the neck, a
# polished steel BREASTPLATE (a ridge down the middle) with the ORANGE PHOENIX of the King's service painted on it, worn over a
# WHITE TABARD edged ORANGE (its trim at the armholes), the grey-beige quilted gambeson sleeves on the broad shoulders, and the
# top of his halberd (the shaft, the axe blade and the spike) at the far edge.
# 0 PixelLab generations. Run: python tools/busts/make_gwardzista.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken
from make_rotmistrz import phoenix, mail_piece

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Gwardzista_Bust.png')
b = Bust('Actor2_1')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)

# the map's colours ($Npc_Gwardzista front frame): helmet (218, 219, 219)/(167, 176, 180)/(139, 151, 155)/(98, 109, 114)/(90, 99, 102),
# mail (123, 133, 135)/(98, 109, 114)/(83, 90, 93)/(69, 75, 78), breastplate (218, 219, 219)/(192, 200, 201)/(167, 176, 180)/
# (152, 166, 172), tabard trim and phoenix (209, 94, 39)/(192, 111, 72)/(158, 84, 56), sleeves (195, 189, 174)/(168, 162, 151)/
# (149, 139, 128), skin (228, 161, 125)/(211, 134, 105)/(192, 111, 72), moustache (0, 0, 0)/(31, 31, 31), shaft (100, 72, 54)/(66, 48, 37)
HELM_T = ((92, 102, 106), (150, 160, 164), (214, 218, 220))
MAIL_T = ((76, 84, 88), (124, 134, 137), (170, 178, 182))
MAIL_RING = (48, 54, 58)
MAIL_SHINE = (214, 220, 222)
PLATE_T = ((150, 162, 168), (204, 210, 212), (238, 240, 240), (112, 122, 128))
WHITE_T = ((182, 186, 188), (226, 228, 228), (246, 246, 246))
TRIM_T = ((158, 70, 30), (209, 94, 39), (232, 132, 76))
PHX_T = ((170, 70, 28), (209, 94, 39), (236, 130, 72))
PHX_LINE = (110, 40, 14)
PHX_GLOW = (240, 160, 96)
GAMB_T = ((140, 130, 118), (192, 186, 172), (214, 208, 196), (118, 108, 98))
SKIN = [(0.0, (40, 16, 10)), (0.3, (114, 60, 40)), (0.5, (168, 98, 66)), (0.62, (192, 116, 82)), (0.72, (204, 130, 98)), (0.8, (214, 144, 110)),
        (0.88, (226, 160, 124)), (1.0, (242, 190, 158))]
MOUS_T = ((10, 8, 8), (30, 26, 26), (62, 56, 56), (4, 4, 4))
BROW_T = ((14, 12, 12), (34, 30, 30), (64, 58, 58), (6, 6, 6))
WOOD_T = ((52, 36, 26), (100, 72, 54), (132, 98, 74))
BLADE_T = ((92, 102, 106), (164, 172, 176), (222, 226, 228))

hd, s, v = hsv_of(b.src)
op = b.op()
EYE_F = [(102, 98), (130, 98), (130, 120), (102, 120)]
EYE_N = [(148, 95), (184, 95), (184, 118), (148, 118)]
eyes = b.poly(EYE_F, EYE_N)
# the opening of the coif round the face (the hair at the cheeks and the ear go under it)
FACE = [(112, 84), (110, 100), (110, 118), (111, 134), (113, 145), (115, 152), (120, 161), (124, 167), (128, 173), (132, 178), (136, 182.5),
        (140, 186), (144, 186.5), (148, 185.5), (152, 184.5), (156, 183), (160, 181.5), (166, 178), (172, 174), (178, 171), (182, 168.5),
        (184, 164), (184, 150), (183, 130), (183, 110), (184, 84)]
face = b.poly(FACE)


def inpaint(m, r=5):
    img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
    fill = cv2.inpaint(img8, m.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], fill, b.img[..., :3])


# ---------- the face: the strand across it and the circlet's point filled with skin, the skin ruddier, the eyes dark ----------
iris = b.sel(hue=(190, 250), sat=(0.25, 1)) & eyes
strand = (b.sel(hue=(190, 250), sat=(0.2, 1)) | b.sel(sat=(0, 0.1), val=(0.5, 0.95)) | b.sel(lum=(0, 0.3))) & face & ~eyes & (b.yy < 140)
strand &= ~b.poly([(114, 122), (142, 122), (142, 152), (114, 152)])        # (not the nose)
strand = dilate_cv(strand, 1) & face & ~eyes
skin = b.sel(hue=(345, 45), sat=(0.12, 0.6), val=(0.55, 1), box=(96, 70, 210, 200)) & ~iris
skin |= b.sel(sat=(0, 0.12), val=(0.85, 1)) & face & (b.yy > 150)          # (the white rim light along the jaw)
b.ramp(skin & ~strand, SKIN, gain=1.0)
inpaint(strand, 4)
b.ramp(iris, [(0.0, (6, 6, 6)), (0.2, (22, 18, 16)), (0.4, (44, 34, 28)), (0.6, (72, 56, 46)), (0.8, (112, 92, 78)), (1.0, (220, 214, 206))])
# heavy dark brows in a frown (their inner ends down), right under the brim
BROW_F = [(102, 96), (112, 92), (124, 93), (134, 99), (132, 103), (122, 99.5), (110, 99), (103, 101)]
BROW_N = [(144, 99), (154, 92), (168, 90), (182, 92), (188, 96), (184, 99), (170, 96), (156, 97.5), (147, 103)]
for poly, fl in ((BROW_F, (104, 100)), (BROW_N, (186, 98))):
    lay = cel(S, [poly], BROW_T[:3], lw=1.2, shade=2.0, light=1.0, ldir=LD)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), fl, BROW_T[2], BROW_T[3], n=14, length=(4, 7), seed=len(poly)))
    b.over(lay)
WR = (160, 92, 64)
b.over(strokes(S, [((138, 99), (139, 105), (138, 110), 1.3), ((106, 122), (114, 125), (124, 123), 1.0), ((154, 120), (166, 124), (180, 120), 1.0),
                   ((162, 140), (168, 150), (170, 160), 1.2)], WR, alpha=0.5, clip=skin))
# a shadow of stubble on the chin and the jaw
STUB = [(118, 156), (126, 168), (138, 180), (150, 186), (162, 186), (174, 178), (184, 166), (186, 156), (176, 166), (164, 172), (150, 174),
        (138, 170), (128, 162)]
b.over(stubble(S, STUB, (70, 46, 38), density=0.3, seed=3, alpha=0.3, clip=skin & face))
# the thick dark moustache: from under the nose over the upper lip, its ends drooping past the corners of the mouth
MOUS = [(116, 160), (118, 152), (124, 147), (132, 145), (140, 146), (147, 144), (156, 143), (166, 145), (174, 150), (178, 158), (178, 166),
        (172, 162), (166, 158), (157, 157), (148, 158), (140, 159), (132, 160), (125, 163), (119, 167)]
ml = cel(S, [MOUS], MOUS_T[:3], lw=1.4, shade=2.5, light=1.4, ldir=LD)
mm = erode_cv(ml[..., 3] > 0.5, 1)
ml = over(ml, hair_strands(S, mm & (b.xx >= 146), (176, 168), MOUS_T[2], MOUS_T[3], n=26, length=(5, 9), seed=21))
ml = over(ml, hair_strands(S, mm & (b.xx < 146), (118, 170), MOUS_T[2], MOUS_T[3], n=20, length=(5, 9), seed=22))
ml = over(ml, strokes(S, [((146, 146), (147, 151), (146, 156), 1.0)], MOUS_T[3], alpha=0.5, clip=mm))   # (the parting under the nose)
b.over(ml)
head = take(b.img, face & op)
head = over(head, take(ml, ml[..., 3] > 0.02))
hm = head[..., 3] > 0.5

# ---------- the body (new): the gambeson sleeves, the white tabard edged orange, the breastplate with the phoenix ----------
body = np.zeros((H, W, 4), np.float32)
GAMB = [(0, 248), (36, 228), (80, 214), (232, 200), (300, 220), (330, 232), (330, 350), (0, 350)]
gb = celf(S, [GAMB], GAMB_T[:3], lw=2.0, shade=12, light=3, ldir=LD)
gm = erode_cv(gb[..., 3] > 0.5, 2)
# the quilting: stitched lines down the sleeves (curving over the shoulders), the fabric puffed between them
QUILT = [((x, 222 + abs(x - 165) * 0.08), (x + (x - 165) * 0.12, 290), (x + (x - 165) * 0.2, 352), 1.3) for x in range(6, 330, 15)]
gb = over(gb, strokes(S, QUILT, GAMB_T[3], alpha=0.75, clip=gm, taper_to=1.0))
gb = over(gb, strokes(S, [((q[0][0] - 4, q[0][1] + 4), (q[1][0] - 4, q[1][1]), (q[2][0] - 4, q[2][1]), 2.0) for q in QUILT], GAMB_T[2], alpha=0.4,
                      clip=gm, taper_to=1.0))
darken(gb, b.poly([(268, 200), (330, 200), (330, 350), (296, 350)]) & gm, np.asarray(GAMB_T[0], np.float32) / np.asarray(GAMB_T[1], np.float32))
body = over(body, gb)
# the tabard: white, its edges trimmed orange (seen at the armholes beside the breastplate)
TAB = [(48, 238), (96, 222), (232, 214), (282, 232), (292, 280), (300, 350), (36, 350), (42, 292)]
tb = celf(S, [TAB], WHITE_T, lw=2.0, shade=8, light=3, ldir=LD)
tm = erode_cv(tb[..., 3] > 0.5, 1)
for side in ([(46, 244), (42, 292), (36, 352)], [(282, 236), (292, 284), (300, 352)]):
    tb = over(tb, cel(S, [taper(bez(side[0], side[1], side[2], 20), 13, 13)], TRIM_T, lw=1.2, shade=2.5, light=1.2, ldir=LD, clip=tm))
body = over(body, tb)
# the breastplate: polished steel, a rounded front with a ridge down the middle, rolled edges, the phoenix painted on it
PLATE = [(62, 252), (88, 236), (122, 226), (166, 222), (212, 224), (252, 234), (272, 252), (276, 292), (282, 352), (54, 352), (58, 300)]
pl = celf(S, [PLATE], PLATE_T[:3], lw=2.0, shade=16, light=5, ldir=LD)
plm = erode_cv(pl[..., 3] > 0.5, 2)
# its rounded form: the sides turning away darker, a shine on the lit side, the ridge (a lit and a shaded flank)
darken(pl, b.poly([(236, 220), (330, 220), (330, 352), (250, 352), (246, 290)]) & plm, np.asarray(PLATE_T[0], np.float32) / np.asarray(PLATE_T[1], np.float32))
darken(pl, b.poly([(54, 240), (84, 240), (78, 352), (54, 352)]) & plm, (0.9, 0.92, 0.94))
pl = over(pl, strokes(S, [((102, 250), (94, 290), (96, 340), 7.0)], PLATE_T[2], alpha=0.75, clip=plm, taper_to=0.2))
pl = over(pl, strokes(S, [((172, 226), (174, 290), (176, 352), 1.6)], PLATE_T[3], alpha=0.8, clip=plm, taper_to=1.0))
pl = over(pl, strokes(S, [((169, 226), (171, 290), (173, 352), 1.4)], PLATE_T[2], alpha=0.9, clip=plm, taper_to=1.0))
# the rolled edge at the neck and the armholes
pl = over(pl, strokes(S, [((66, 256), (120, 232), (166, 228), 3.0), ((166, 228), (216, 230), (266, 254), 3.0)], PLATE_T[2], alpha=0.85, clip=plm,
                      taper_to=1.0))
pl = over(pl, strokes(S, [((68, 262), (120, 238), (166, 234), 1.4), ((166, 234), (214, 236), (264, 260), 1.4)], PLATE_T[3], alpha=0.7, clip=plm,
                      taper_to=1.0))
# rivets along the top
pl = over(pl, cel(S, [ellipse(x, y, 2.6, 2.4) for x, y in ((92, 252), (128, 240), (210, 240), (246, 254))], HELM_T, lw=0.8, shade=1.2,
                  light=0.8, ldir=LD))
pl = over(pl, phoenix(S, 124, 250, 0.82, PHX_T, PHX_LINE, PHX_GLOW, ldir=LD))
darken(body, shift(pl[..., 3] > 0.5, 2, 4) & ~(pl[..., 3] > 0.5) & (body[..., 3] > 0.5), (0.72, 0.72, 0.76))
body = over(body, pl)

# ---------- the mail coif: round the face (its opening), over the head under the hat, down the neck as a collar ----------
COIF = [(80, 40), (248, 40), (250, 100), (248, 150), (242, 178), (250, 196), (262, 212), (264, 226), (236, 238), (200, 244), (166, 246),
        (130, 242), (98, 234), (76, 222), (82, 204), (86, 184), (82, 150), (80, 100)]
COIF_SHADE = [[(212, 40), (260, 40), (260, 240), (236, 240), (224, 200), (214, 150)]]
cf = mail_piece(S, [COIF], lambda x: -0.0012 * (x - 165) ** 2, MAIL_T, MAIL_RING, MAIL_SHINE, shade=10, light=4, holes=[FACE])
cfm = cf[..., 3] > 0.5
sh_m = np.zeros_like(cfm)
for sp in COIF_SHADE:
    sh_m |= b.poly(sp)
sh_m &= erode_cv(cfm, 2)
cf[..., :3] = np.where(sh_m[..., None], cf[..., :3] * np.asarray((0.66, 0.66, 0.7), np.float32), cf[..., :3])
# under the opening's lower edge (the chin): the throat in deep shadow
deep = shift(face, 2, 8) & ~face & erode_cv(cfm, 2)
cf[..., :3] = np.where(deep[..., None], cf[..., :3] * np.asarray((0.55, 0.55, 0.6), np.float32), cf[..., :3])
darken(body, shift(cfm, 2, 6) & ~cfm & (body[..., 3] > 0.5), (0.62, 0.6, 0.66))
body = over(body, cf)
# the face in the opening (a warm shadow of the coif's edge on it)
darken(head, shift(~face, 3, 4) & hm & face, (0.86, 0.74, 0.72))
b.img = over(body, head)

# ---------- the kettle hat over the coif ----------
hat = kettle_hat(S, 158, 66, 80, 66, 124, 21, rot=-4, tones=HELM_T, brim_dy=4)
put_hat(b, hat, shadow=(120, 110, 130), shadow_k=0.55, sdx=2, sdy=10)
# ---------- the halberd at the far edge (in front of the brim): the shaft, the axe blade and the spike ----------
SHAFT = taper(bez((44, 352), (42, 220), (44, 44), 30), 10, 9)
hb = cel(S, [SHAFT], WOOD_T, lw=1.6, shade=3, light=1.5, ldir=LD)
BLADE = [(40, 82), (12, 70), (2, 96), (4, 124), (12, 150), (38, 140)]
hb = over(hb, cel(S, [BLADE], BLADE_T, lw=1.8, shade=6, light=2.5, ldir=LD))
hb = over(hb, strokes(S, [((8, 74), (0, 108), (8, 146), 2.0)], (236, 240, 242), alpha=0.8, clip=erode_cv(hb[..., 3] > 0.5, 1)))   # (the edge)
SPIKE = [(39, 52), (44, 4), (49, 52)]
hb = over(hb, cel(S, [SPIKE], BLADE_T, lw=1.4, shade=2, light=1.2, ldir=LD))
BEAK = [(48, 86), (66, 98), (48, 104)]
hb = over(hb, cel(S, [BEAK], BLADE_T, lw=1.4, shade=2, light=1.2, ldir=LD))
hb = over(hb, cel(S, [[(37, 52), (51, 52), (52, 150), (36, 150)]], BLADE_T, lw=1.4, shade=3, light=1.2, ldir=LD))   # (the socket and its straps)
hb = over(hb, cel(S, [ellipse(44, 160, 9, 4)], WOOD_T, lw=1.2, shade=1.5, light=1.0, ldir=LD))
b.over(hb)

# the whole bust 10 px lower (room for the dome)
b.img = np.concatenate([np.zeros((10, W, 4), np.float32), b.img[:-10]], 0)
b.save(OUT)
print('ok', OUT)
