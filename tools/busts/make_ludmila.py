# Ludmila (a refugee from the continent, about 30, tired and poor): SF_Actor3_2 repainted - the long loose hair dark brown and
# tied back: everything below the ears cut away (the lock by the left cheek and the strands across the face kept, their ends
# pointed), a painted bun at the back of the head and a few loose wisps; dark rings under the eyes, the earrings gone; a new
# painted neck; the yellow cardigan a worn grey-green dress (the buttons gone, the black top its dark neckline); a darned
# brown woollen shawl over the shoulders, its ends knotted on the chest. Run: python tools/busts/make_ludmila.py [out.png]
import sys
from kit import *
from patches import patch

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Ludmila_Bust.png')
b = Bust('SF_Actor3_2')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir that puts the shade on the far, lower-right side: lit from the upper left)
TALL = (H + 40, W)


def cel_b(polys, tones, **kw):
    """cel() on a canvas taller than the bust, cropped: no shade band or line along the frame's bottom edge."""
    return cel(TALL, polys, tones, ldir=LD, **kw)[:H]


def smooth(pts, it=3):
    """Chaikin corner cutting of an open polyline (the ends kept): a round painted edge from a few points."""
    p = np.asarray(pts, np.float64)
    for _ in range(it):
        q = [p[0]]
        for a, c in zip(p[:-1], p[1:]):
            q += [a * 0.75 + c * 0.25, a * 0.25 + c * 0.75]
        q.append(p[-1])
        p = np.asarray(q)
    return [tuple(v) for v in p]


def edge_line(pts, w=1.7):
    """The dark line along a polyline (a cut edge of the hair, the body's side)."""
    return strokes(S, [(pts[i], ((np.asarray(pts[i]) + np.asarray(pts[i + 1])) / 2).tolist(), pts[i + 1], w)
                       for i in range(len(pts) - 1)], LINE, alpha=1.0, taper_to=1.0)


# ---------- colours: the hair dark brown, the cardigan a grey-green dress, the black top its dark neckline ----------
FACE = [(108, 96), (190, 86), (216, 120), (212, 170), (186, 202), (150, 216), (118, 202), (104, 150)]
hair = b.sel(hue=(0, 45), sat=(0.3, 1), box=(0, 0, 330, 350)) & ~b.sel(hue=(45, 70), sat=(0.2, 1))
hair &= ~(b.poly(FACE) & b.sel(sat=(0, 0.42), val=(0.85, 1)))
hair &= ~(b.poly([(94, 62), (128, 44), (172, 46), (214, 78), (222, 112), (98, 112)]) & b.sel(hue=(10, 24), sat=(0, 0.48), val=(0.74, 1)))
hair &= ~(b.sel(sat=(0, 0.42), val=(0.85, 1)) & ~b.poly([(0, 0), (330, 0), (330, 92), (0, 92)]))
hair |= b.sel(hue=(280, 360), sat=(0.15, 1), val=(0, 0.55), box=(0, 0, 330, 200)) & ~b.poly(FACE)   # (its violet shadows)
hair |= b.sel(hue=(270, 345), sat=(0.15, 1), box=(60, 0, 128, 200)) & ~b.poly(FACE)   # (the pink rim light on the left lock)
hair = b.grow(hair, 1, 0.25)
b.ramp(hair, RAMPS['hair_dark'], gain=0.66)
EYES = [(110, 104), (150, 96), (152, 128), (112, 132)], [(160, 92), (206, 86), (206, 116), (160, 118)]
iris = b.sel(hue=(250, 345), sat=(0.12, 1), polys=EYES)
b.ramp(iris, [(0.0, (24, 16, 14)), (0.25, (52, 36, 28)), (0.5, (88, 64, 48)), (0.75, (132, 108, 90)), (1.0, (190, 176, 160))])
BODY = [(136, 186), (100, 203), (82, 214), (72, 230), (61, 255), (57, 280), (54, 305), (49, 352), (290, 352), (290, 320), (293, 300),
        (296, 260), (292, 228), (282, 212), (262, 206), (240, 202), (212, 188)]
body_m = b.poly(BODY) & b.op()
skin_b = body_m & (b.sel(hue=(0, 40), sat=(0.08, 0.55), val=(0.62, 1)) | b.sel(hue=(330, 360), sat=(0.15, 0.55), val=(0.55, 1)))
skin_b = b.comp(skin_b, (170, 210)) | (body_m & b.poly([(120, 186), (220, 186), (220, 200), (120, 200)]))
top = body_m & b.sel(hue=(200, 360), sat=(0.0, 1), val=(0, 0.5), box=(100, 200, 260, 350)) & ~skin_b
top |= body_m & b.sel(val=(0, 0.12), box=(120, 215, 210, 270))
# the wooden buttons painted out of the picture the ramps read (the cardigan's shading round them carries on)
btn = b.sel(hue=(5, 45), sat=(0.45, 1), val=(0.2, 0.75), box=(138, 258, 172, 350))
btn = dilate_cv(b.grow(btn, 2, 0.3), 1) & b.poly([(138, 258), (172, 258), (172, 350), (138, 350)])
L0 = (luma(b.src) * 255).astype(np.uint8)
Lf = cv2.inpaint(L0, btn.astype(np.uint8), 4, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
b.src[..., :3] = np.where(btn[..., None], Lf[..., None], b.src[..., :3])
CHEST = [(120, 180), (220, 180), (206, 214), (196, 225), (176, 230), (156, 230), (138, 226), (126, 212)]
cardi = body_m & ~skin_b & ~top & ~b.poly(CHEST)
top &= ~b.poly(CHEST)
GREEN = [(0.0, (20, 24, 20)), (0.25, (46, 54, 46)), (0.45, (80, 92, 78)), (0.62, (100, 112, 96)), (0.8, (120, 132, 114)),
         (0.92, (146, 158, 138)), (1.0, (166, 176, 156))]
b.ramp(cardi, GREEN)
b.ramp(top, RAMPS['greygreen'], gain=1.6)
dress = take(b.img, cardi | top)
# its sides were behind the long hair: a line down them
dress = over(dress, edge_line([(61, 258), (57, 280), (54, 305), (51, 330), (49, 352)]))
dress = over(dress, edge_line([(293, 262), (293, 290), (291, 318), (290, 352)]))

# ---------- the face: tired - dark rings under the eyes ----------
skin = b.sel(hue=(0, 40), sat=(0.05, 0.6), val=(0.6, 1), box=(90, 90, 230, 190))
b.over(blush(S, 132, 128, 13, 4, (130, 90, 110), 0.24, clip=skin))
b.over(blush(S, 186, 124, 11, 4, (130, 90, 110), 0.24, clip=skin))

# ---------- the head cut off: along the jaw, behind the ear, the locks' ends pointed ----------
R_CUT = strand_edge([(256, 100), (240, 120), (228, 132)], side=1, seg=7, tip=4, out=2.0, seed=3)
F_CUT = strand_edge([(216, 136), (206, 146)], side=1, seg=6, tip=4, out=1.6, seed=5)
L_CUT = strand_edge([(116, 152), (102, 160), (86, 156)], side=1, seg=7, tip=5, out=2.2, seed=7)
JAW = [(200, 152), (196, 158), (192, 165), (187, 171), (180, 176), (170, 181), (160, 179), (151, 177), (138, 169), (126, 160),
       (120, 154)]
HEAD = ([(84, 150), (84, 100), (88, 60), (104, 26), (130, 8), (160, 2), (196, 8), (228, 26), (250, 56), (260, 90)] + R_CUT
        + [(226, 134)] + F_CUT + JAW + L_CUT)
head_m = b.poly(HEAD) & b.op()
head = take(b.img, head_m)
# the dark line along the hair's cut edges (where the original went on below the cut)
cut = head_m & dilate_cv(b.op() & ~head_m, 2) & dilate_cv(hair, 2) & ~b.poly(JAW + [(160, 120)])
head[..., :3] = np.where(cut[..., None], np.asarray(LINE, np.float32) / 255.0, head[..., :3])

# ---------- the new body: neck, the dress, the shawl ----------
SKIN = ((206, 138, 128), (242, 192, 166), (252, 222, 200))
SH_T_BACK = ((74, 54, 40), (96, 70, 50), (118, 88, 62))
nb = np.zeros((H, W, 4), np.float32)
NECK = [(124, 140), (208, 128), (210, 160), (209, 186), (218, 204), (226, 240), (118, 240), (128, 206), (134, 184)]
neck = cel_b([NECK], SKIN, lw=2.0, shade=6, light=2)
nm = neck[..., 3] > 0.5
CHIN_SH = [(110, 140), (220, 120), (212, 170), (196, 182), (174, 190), (152, 188), (136, 180), (122, 166)]
sh = soft_poly(S, [CHIN_SH]) * nm
neck[..., :3] = neck[..., :3] * (1 - sh[..., None]) + np.asarray(SKIN[0], np.float32) / 255.0 * sh[..., None]
# (the shawl's back, behind the neck)
nb = over(nb, cel_b([[(118, 200), (126, 180), (150, 176), (190, 174), (214, 178), (230, 200)]], SH_T_BACK, lw=2.0, shade=3, light=1))
nb = over(nb, neck)
nb = over(nb, dress)
# the dress's neckline in the shawl's opening (painted: the old top's sheen and edge were messy)
NL = smooth([(128, 224), (146, 231), (166, 234), (186, 230), (206, 220)], 2) + [(204, 270), (130, 270)]
nb = over(nb, cel_b([NL], ((52, 60, 50), (76, 88, 74), (100, 112, 96)), lw=1.8, shade=4, light=1.5))
# the shawl: over both shoulders, its two ends crossing into a knot on the chest
SH_T = ((96, 70, 50), (130, 98, 70), (164, 130, 96), (74, 54, 40))
SHAWL = ([(140, 190), (114, 194), (90, 202), (70, 216), (56, 238), (48, 266), (46, 294)] +
         smooth([(46, 294), (62, 302), (84, 304), (106, 300), (126, 292), (144, 282), (156, 272)], 2) +
         smooth([(166, 272), (180, 282), (202, 292), (228, 300), (254, 302), (278, 298), (296, 290)], 2) +
         [(298, 262), (292, 234), (276, 214), (250, 200), (224, 190), (208, 186)] +
         smooth([(208, 186), (196, 212), (178, 240), (163, 262), (148, 238), (140, 212), (140, 190)], 2))
sw = cel_b([SHAWL], SH_T, lw=2.0, shade=9, light=3, shade2=4)
swm = sw[..., 3] > 0.5
SWF = [((104, 204), (76, 236), (72, 292), 1.5), ((126, 204), (114, 246), (112, 292), 1.3), ((222, 198), (252, 226), (258, 296), 1.5),
       ((206, 206), (216, 244), (214, 290), 1.3), ((86, 246), (90, 270), (86, 300), 1.1), ((236, 250), (240, 274), (238, 300), 1.1)]
sw = over(sw, strokes(S, SWF, SH_T[3], alpha=0.75, clip=erode_cv(swm, 2)))
nb = over(nb, sw)
b.img = nb
b.img = patch(b.img, [(232, 236), (252, 232), (256, 252), (236, 256)], swm, lift=0.95, hue=(32, 0.3), seed=13)
KNOT = ellipse(161, 270, 9, 7, 0.0, 24)
ENDS = [[(152, 272), (160, 276), (152, 306), (142, 302)], [(162, 276), (171, 272), (182, 302), (172, 307)]]
b.over(cel_b(ENDS, SH_T, lw=1.8, shade=4, light=1.5))
b.over(strokes(S, [((150, 284), (148, 294), (146, 302), 1.0), ((170, 284), (174, 294), (176, 302), 1.0)], SH_T[3], alpha=0.7))
b.over(cel_b([KNOT], SH_T, lw=1.8, shade=4, light=1.5))

# ---------- the bun at the back of the head (behind it), then the head ----------
HT = ((40, 26, 18), (66, 44, 30), (96, 68, 46), (24, 15, 10))
BUN = ellipse(234, 34, 22, 18, -0.5, 36)
bun = cel_b([BUN], HT[:3], lw=2.0, shade=6, light=2.5)
bm = bun[..., 3] > 0.5
bun = over(bun, strokes(S, [((216, 30), (228, 18), (246, 22), 1.2), ((220, 40), (234, 28), (250, 34), 1.2), ((224, 48), (240, 40), (254, 44), 1.1),
                            ((230, 22), (244, 28), (250, 42), 1.0)], HT[3], alpha=0.8, clip=erode_cv(bm, 1)))
bun = over(bun, strokes(S, [((222, 26), (234, 16), (248, 26), 1.0), ((226, 38), (238, 30), (250, 36), 0.9)], HT[2], alpha=0.7,
                        clip=erode_cv(bm, 1)))
b.over(bun)
b.over(head)
# loose wisps: by the left cheek, off the bun, by the ear
b.over(strokes(S, [((246, 48), (256, 58), (258, 74), 1.1), ((216, 30), (206, 26), (198, 30), 0.9)], HT[0], alpha=0.95, taper_to=0.15))

b.save(OUT)
print('ok', OUT)
