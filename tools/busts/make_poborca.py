# Erazm Łaska (a traveller from the ferry, docs/PODROZNI.md 2.13: the King's war-tax collector, thin, about 35, cool and
# polite, curious, 2026-10-29): Actor2_3 (the young purple-haired face with the silver tiara and the open smile) repainted to
# his PixelLab map sheet ($Npc_Poborca) - the face kept but older and cooler: the open smile closed into a small polite one, a
# NEAT THIN BLACK MOUSTACHE with turned-up ends over it (painted), the violet eyes dark brown, the skin a warmer tan, a few
# lines (under the eyes, from the nose); the purple hair BLACK and cut short at the back; the tiara under a BLACK
# WIDE-BRIMMED felt hat with a grey-brown band (the soft hat of SF_Actor2_4, widened); below the head everything new: the neck,
# a BLACK DOUBLET buttoned to the throat with a WHITE falling COLLAR and the small ORANGE PHOENIX badge of the King's service on
# the near side of the chest, and the top of his ledger (brown leather, the pages' edge) pressed under the near arm.
# 0 PixelLab generations. Run: python tools/busts/make_poborca.py [out.png]
import sys
from kit import *
from make_kapral import celf, darken
from make_rotmistrz import phoenix

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Poborca_Bust.png')
b = Bust('Actor2_3')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)

# the map's colours ($Npc_Poborca front frame): hat (65, 64, 60)/(52, 51, 48)/(41, 40, 37)/(30, 29, 27), band (117, 98, 86)/
# (84, 64, 50), hair and moustache (4, 4, 3)/(16, 14, 12), skin (243, 188, 148)/(236, 175, 136)/(201, 140, 102)/(188, 119, 76),
# doublet (57, 56, 52)/(52, 51, 48)/(41, 40, 37)/(27, 26, 24), collar (249, 249, 249)/(220, 218, 221)/(169, 173, 175),
# phoenix (254, 144, 23)/(229, 119, 36), ledger (141, 95, 57)/(84, 64, 50)/(210, 193, 172)
HAT_T = ((20, 20, 19), (42, 41, 38), (66, 65, 61), (10, 10, 10))
BAND_T = ((70, 54, 44), (108, 90, 78), (136, 118, 104))
HAIR = [(0.0, (4, 4, 4)), (0.1, (10, 10, 10)), (0.2, (18, 18, 18)), (0.3, (28, 28, 28)), (0.42, (42, 42, 44)), (0.6, (66, 66, 70)),
        (0.8, (100, 100, 106))]
MOUS_T = ((8, 8, 8), (22, 22, 22), (58, 58, 60), (4, 4, 4))
SKIN = [(0.0, (40, 18, 12)), (0.3, (110, 62, 44)), (0.5, (168, 108, 76)), (0.65, (198, 138, 100)), (0.74, (216, 156, 118)),
        (0.82, (230, 172, 134)), (0.9, (242, 188, 150)), (1.0, (252, 212, 180))]
SKIN_T = ((206, 144, 106), (238, 182, 144), (248, 202, 166))
DOUB_T = ((27, 26, 24), (46, 45, 42), (64, 63, 59), (18, 17, 16))
COLLAR_T = ((168, 172, 176), (226, 226, 228), (248, 248, 248))
PHX_T = ((196, 96, 22), (236, 128, 34), (254, 168, 60))
PHX_LINE = (110, 44, 10)
PHX_GLOW = (255, 196, 110)
LEATHER_T = ((62, 40, 24), (110, 74, 44), (146, 104, 66))
PAGES_T = ((176, 160, 136), (214, 198, 176), (232, 222, 204))
WR = (178, 112, 82)

hd, s, v = hsv_of(b.src)
op = b.op()
EYE_F = [(98, 108), (136, 108), (136, 138), (98, 138)]
EYE_N = [(156, 98), (198, 98), (198, 126), (156, 126)]
eyes = b.poly(EYE_F, EYE_N)


def inpaint(m, r=5):
    img8 = np.ascontiguousarray((b.img[..., :3] * 255 + 0.5).astype(np.uint8))
    fill = cv2.inpaint(img8, m.astype(np.uint8), r, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    b.img[..., :3] = np.where(m[..., None], fill, b.img[..., :3])


def line_along(pts, w=2.0, col=LINE, alpha=1.0, clip=None):
    return strokes(S, [(pts[i], ((np.asarray(pts[i]) + np.asarray(pts[i + 1])) / 2).tolist(), pts[i + 1], w) for i in range(len(pts) - 1)],
                   col, alpha=alpha, taper_to=1.0, clip=clip)


# ---------- the face: the eyes dark brown, the skin tanned, a few lines of his age ----------
iris = b.sel(hue=(262, 340), sat=(0.3, 1), val=(0.45, 1)) & eyes
b.ramp(iris, [(0.0, (8, 6, 6)), (0.2, (30, 20, 16)), (0.4, (58, 40, 30)), (0.6, (92, 66, 50)), (0.8, (140, 110, 90)), (1.0, (230, 220, 210))])
skin = b.sel(hue=(345, 45), sat=(0.12, 0.7), val=(0.5, 1), box=(86, 60, 240, 200)) & ~iris
MOUTH = [(136, 156), (176, 154), (178, 166), (172, 176), (160, 180), (142, 178), (134, 168)]
mouth = b.poly(MOUTH) & (b.sel(sat=(0.38, 1)) | b.sel(val=(0, 0.8)) | b.sel(hue=(330, 10), sat=(0.25, 1)))
mouth = dilate_cv(mouth, 1) & b.poly(MOUTH)
b.ramp(skin & ~mouth, SKIN, gain=1.0)
inpaint(mouth, 4)
# the closed mouth: a small polite smile (the near corner up), a shade under the lower lip
b.over(strokes(S, [((145, 166), (155, 167), (166, 164), 1.6)], (126, 58, 44), alpha=0.95, taper_to=0.45))
b.over(strokes(S, [((149, 172), (155, 173), (161, 171.5), 1.1)], (190, 120, 92), alpha=0.5, taper_to=0.4))
# lines: under the eyes, the fold from the nose, a hollow under the near cheekbone
b.over(strokes(S, [((104, 136), (114, 140), (126, 138), 1.0), ((164, 125), (176, 129), (190, 124), 1.0),
                   ((172, 146), (178, 156), (178, 166), 1.2)], WR, alpha=0.5, clip=skin))
b.over(blush(S, 190, 148, 12, 9, col=(170, 104, 80), alpha=0.18, clip=skin))

# ---------- the hair: black ----------
NOSE = b.poly([(128, 126), (160, 126), (160, 156), (128, 156)])
hair = b.sel(hue=(205, 300), sat=(0.12, 1), box=(60, 0, 270, 165)) & ~iris & ~NOSE
hair = b.grow(hair, 1, 0.2) & region(S, 60, 0, 270, 165) & ~iris & ~(b.sel(lum=(0, 0.3)) & eyes & ~b.sel(hue=(205, 300), sat=(0.12, 1)))
b.ramp(hair, HAIR, gain=1.0)
# the tiara (it goes under the hat; what might peep out under the brim reads as hair)
tiara = (b.sel(sat=(0, 0.3), val=(0.45, 1)) | b.sel(hue=(180, 215), sat=(0.3, 1))) & region(S, 70, 20, 230, 104) & ~skin
b.ramp(tiara, HAIR, gain=0.45)

# ---------- the thin black moustache, its ends turned up ----------
# (two wings from under the nose, sloping down over the corners of the mouth, the tips curled up; the near one longer)
MOUS = [taper(bez((151, 152.5), (135, 160), (122, 152), 20), 6.5, 1.2, w_mid=5.0), taper(bez((149, 152.5), (170, 161), (186, 148), 20), 6.5, 1.2,
                                                                                        w_mid=5.2)]
ml = cel(S, MOUS, MOUS_T[:3], lw=1.1, shade=1.5, light=1.0, ldir=LD)
ml = over(ml, hair_strands(S, erode_cv(ml[..., 3] > 0.5, 1), (150, 175), MOUS_T[2], MOUS_T[3], n=14, length=(3, 6), seed=5, alpha=(0.5, 0.4)))
b.over(ml)

# ---------- what stays: the head above the jaw (the old high collar and the outfit go) ----------
JAW = [(106, 144), (112, 152), (120, 164), (124, 169), (128, 172.5), (132, 176.5), (136, 180.5), (140, 184), (146, 189), (152, 191.5),
       (160, 191.5), (166, 190), (172, 186), (178, 180), (185, 174), (192, 167), (199, 160), (204, 152)]
HEAD = [(30, 0), (300, 0), (300, 149), (240, 149), (212, 149), (207, 148)] + JAW[::-1] + [(30, 144)]
keep = b.poly(HEAD) & op & ~(b.sel(sat=(0, 0.16), val=(0.7, 1)) & (b.poly([(96, 140), (150, 192), (96, 200)]) | region(S, 186, 140, 236, 200)))
keep &= ~(b.sel(hue=(180, 300), sat=(0, 0.42)) & b.poly([(194, 138), (218, 134), (220, 164), (196, 166)]))   # (the old collar's rim)
head = take(b.img, keep)
head = over(head, line_along(JAW, 2.0))                                    # (the jaw's line drawn again along the cut)
# the hair's ends at the nape (the old collar cut them off straight): short black tips hanging below the cut
NAPE = strand_edge([(238, 146), (226, 148), (214, 148), (208, 146)], side=1, seg=5, tip=3, out=5, seed=3)
nape = cel(S, [[(240, 140)] + NAPE + [(206, 140)]], ((6, 6, 6), (16, 16, 16), (30, 30, 30)), lw=1.4, shade=2, light=0, ldir=LD)
head = over(nape, head)
hm = head[..., 3] > 0.5

# ---------- the body (new): the neck, the black doublet, the white falling collar, the badge, the ledger ----------
body = np.zeros((H, W, 4), np.float32)
NECK = [(132, 176), (194, 146), (206, 136), (218, 148), (218, 196), (208, 224), (150, 226), (136, 204)]
neck = celf(S, [NECK], SKIN_T, lw=1.8, shade=12, light=0, ldir=LD)
nm = neck[..., 3] > 0.5
CHIN_SH = JAW + [(x + 4, y + 12) for x, y in JAW[::-1]]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN_T[0], np.float32) / 255.0 * sh[..., None]
body = over(body, neck)
DOUB = [(26, 350), (30, 286), (44, 248), (74, 226), (112, 212), (140, 206), (214, 196), (252, 204), (284, 220), (306, 244), (318, 286),
        (322, 350)]
db = celf(S, [DOUB], DOUB_T[:3], lw=2.0, shade=14, light=3, ldir=LD)
dm = erode_cv(db[..., 3] > 0.5, 2)
darken(db, b.poly([(270, 200), (330, 200), (330, 350), (292, 350), (286, 280)]) & dm,
       np.asarray(DOUB_T[0], np.float32) / np.asarray(DOUB_T[1], np.float32))
# the sleeves' seams, the doublet's front edge with its buttons, folds
db = over(db, strokes(S, [((72, 230), (60, 290), (62, 352), 1.5), ((268, 212), (278, 280), (286, 352), 1.5)], DOUB_T[3], alpha=0.9, clip=dm,
                      taper_to=1.0))
FRONT = [(170, 232), (172, 290), (174, 352)]
db = over(db, strokes(S, [(FRONT[0], FRONT[1], FRONT[2], 1.8)], DOUB_T[3], alpha=1.0, clip=dm, taper_to=1.0))
db = over(db, strokes(S, [((173, 234), (175, 290), (177, 352), 1.0)], DOUB_T[2], alpha=0.7, clip=dm, taper_to=1.0))
for y in (250, 274, 298, 322, 346):
    db = over(db, cel(S, [ellipse(171 + (y - 250) * 0.03, y, 3.0, 2.8)], ((10, 10, 10), (34, 33, 31), (90, 88, 84)), lw=0.9, shade=1.0,
                      light=0.7, ldir=LD))
FOLDS = [((112, 352), (114, 318), (122, 284), 7.0), ((240, 352), (236, 320), (230, 290), 8.0), ((46, 352), (48, 320), (54, 290), 5.0)]
db = over(db, strokes(S, FOLDS, DOUB_T[3], clip=dm, taper_to=0.05), k=0.8)
db = over(db, strokes(S, [(f[0], f[1], f[2], 1.2) for f in FOLDS], DOUB_T[2], clip=dm, taper_to=0.1), k=0.6)
# the badge of the King's service: a small orange phoenix on the near side of the chest
db = over(db, phoenix(S, 206, 252, 0.3, PHX_T, PHX_LINE, PHX_GLOW, ldir=LD))
body = over(body, db)
# the ledger pressed under the near arm: its top corner, brown leather with the pages' edge
BOOK = [(282, 300), (322, 290), (334, 296), (334, 352), (292, 352)]
bk = celf(S, [BOOK], LEATHER_T, lw=1.8, shade=4, light=2, ldir=LD)
PAGES = [(288, 304), (322, 295), (330, 300), (330, 352), (296, 352)]
bk = over(bk, celf(S, [PAGES], PAGES_T, lw=1.2, shade=3, light=1.5, ldir=LD))
bk = over(bk, strokes(S, [((294, 312), (312, 306), (330, 302), 0.8), ((296, 322), (314, 316), (332, 312), 0.8),
                          ((298, 332), (316, 326), (334, 322), 0.8)], PAGES_T[0], alpha=0.7, clip=erode_cv(bk[..., 3] > 0.5, 1)))
COVER = [(292, 312), (334, 302), (334, 352), (300, 352)]
bk = over(bk, celf(S, [COVER], LEATHER_T, lw=1.8, shade=5, light=2, ldir=LD))
bk = over(bk, strokes(S, [((300, 318), (316, 314), (332, 310), 1.0)], (182, 140, 70), alpha=0.8, clip=erode_cv(bk[..., 3] > 0.5, 1)))
darken(body, shift(bk[..., 3] > 0.5, -3, 4) & ~(bk[..., 3] > 0.5) & (body[..., 3] > 0.5), (0.7, 0.7, 0.74))
body = over(body, bk)
# the white falling collar round the neck, its two front tabs
COL = [(118, 214), (126, 228), (146, 238), (166, 242), (174, 236), (180, 242), (204, 238), (226, 226), (244, 210), (238, 198), (216, 202),
       (190, 210), (164, 212), (142, 206), (126, 202)]
co = cel(S, [COL], COLLAR_T, lw=1.8, shade=5, light=2, ldir=LD)
com = erode_cv(co[..., 3] > 0.5, 1)
co = over(co, strokes(S, [((176, 214), (175, 226), (174, 236), 1.2)], COLLAR_T[0], alpha=0.85, clip=com))   # (where its two halves meet)
darken(body, shift(co[..., 3] > 0.5, 2, 5) & ~(co[..., 3] > 0.5) & (body[..., 3] > 0.5), (0.6, 0.6, 0.64))
body = over(body, co)
# the head's shadow on the collar and the doublet, then the head
darken(body, shift(hm & (b.yy > 150), 3, 8) & ~hm & (body[..., 3] > 0.5), (0.7, 0.68, 0.74))
b.img = over(body, head)

# ---------- the hat: black felt, a tall round crown, a wide flat brim, a grey-brown band (tilted with the head) ----------
def felt_hat(cx, cy, rot, brim=(118, 20), crown=(126, 112, 66), band_h=11):
    """A black felt hat: (cx, cy) where the crown meets the brim (its front), rot in degrees (negative: the near side up),
    brim = (rx, ry), crown = (width at the base, width at the top, height). -> RGBA layer"""
    r = np.radians(rot)
    c, s_ = np.cos(r), np.sin(r)

    def R(pts):
        return [(cx + px * c - py * s_, cy + px * s_ + py * c) for px, py in pts]
    wb, wt, ch = crown[0] / 2.0, crown[1] / 2.0, crown[2]
    base = [(wb * np.cos(a), brim[1] * 0.32 * np.sin(a)) for a in np.linspace(0, np.pi, 24)]          # (the front of its base)
    top = [(-wt + 14, -ch), (-wt * 0.45, -ch - 4), (0, -ch - 5), (wt * 0.45, -ch - 4), (wt - 14, -ch)]
    side_l = [(-wb, 0), (-wb + 3, -ch * 0.5), (-wt - 1, -ch + 14), (-wt + 3, -ch + 5)]
    side_r = [(wt - 3, -ch + 5), (wt + 1, -ch + 14), (wb - 3, -ch * 0.5), (wb, 0)]
    crown_p = R(base[::-1][:-1] + side_l + top + side_r)
    brim_p = ellipse(cx, cy - brim[1] * 0.12, brim[0], brim[1], r, 72)
    lay = cel(S, [brim_p], HAT_T[:3], lw=2.0, shade=6, light=2.5, ldir=LD)
    # the brim's front rim a touch darker (its edge turned towards us)
    rim = [(brim[0] * np.cos(a), brim[1] * np.sin(a) - brim[1] * 0.12) for a in np.linspace(0.1, np.pi - 0.1, 40)]
    lay = over(lay, line_along(R(rim), 3.0, HAT_T[3], alpha=0.8, clip=erode_cv(lay[..., 3] > 0.5, 1)))
    cr = cel(S, [crown_p], HAT_T[:3], lw=2.0, shade=24, light=6, ldir=LD)
    crm = erode_cv(cr[..., 3] > 0.5, 1)
    # a soft sheen down the lit side of the crown, the dent of its top
    cr = over(cr, strokes(S, [tuple(R([(-wb + 16, -6), (-wt + 12, -ch * 0.5), (-wt + 18, -ch + 10)])) + (5.0,)], HAT_T[2], alpha=0.55, clip=crm,
                          taper_to=0.3))
    cr = over(cr, strokes(S, [tuple(R([(-wt + 30, -ch + 6), (0, -ch + 12), (wt - 30, -ch + 6)])) + (1.4,)], HAT_T[3], alpha=0.6, clip=crm,
                          taper_to=0.4))
    # the band round the crown's base
    band = R(base[::-1] + [(x, y - band_h) for x, y in base])
    cr = over(cr, cel(S, [band], BAND_T, lw=1.2, shade=3, light=1.2, ldir=LD, clip=crm))
    return over(lay, cr)


hat = felt_hat(160, 84, -7)
put_hat(b, hat, shadow=(120, 100, 104), shadow_k=0.55, sdx=2, sdy=9)
# the whole bust 10 px lower (room for the hat's crown)
b.img = np.concatenate([np.zeros((10, W, 4), np.float32), b.img[:-10]], 0)
b.save(OUT)
print('ok', OUT)
