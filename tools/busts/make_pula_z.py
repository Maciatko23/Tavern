# Pula_Z (a pool body of the travellers from the ferry, docs/PODROZNI.md: an ordinary sailor of about 30, 2026-10-29):
# SF_People1_3 (the young man in the navy jacket, arms crossed) repainted to his PixelLab map sheet ($Npc_Pula_Z) - a DARK-BLUE
# knitted wool cap without a brim pulled low over the forehead (painted: a snug dome, ribbed all over, a rolled hem), the black
# hair under it a warm black-brown, the face tanned and weathered (lines at the eyes and the mouth), short dark stubble on the
# jaw, chin and upper lip, dark brown eyes; the modern jacket a NAVY-BLUE wool sailor's jacket (recoloured, its seams kept, the
# button gone under painted lapels), the T-shirt a cream linen shirt open at the neck (a slit loosely laced, its edges turned
# out a little, the chest's V of skin), the crossed arms' hands tanned.
# Recolour bands (for tools/podroznicy/pula_kolory.py): the jacket (with its lapels) and the cap are the only blue - hue 220..228,
# sat 0.30..0.60 (the shirt cream, the eyes brown, the eye whites warm, the hair, the face's and the neck's lines and the stubble
# warm).
# 0 PixelLab generations. Run: python tools/busts/make_pula_z.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Pula_Z_Bust.png')
b = Bust('SF_People1_3')
S = b.img.shape
H, W = S[:2]
LD = (0.55, 0.83)     # (cel()'s ldir: lit from the upper left, the shade band on the lower right)
TALL = (H + 40, W + 80)


def cel_b(polys, tones, **kw):
    """cel() on a canvas bigger than the bust (below and right), cropped: no shade band or line along the frame's edges."""
    return cel(TALL, polys, tones, ldir=LD, **kw)[:H, :W]


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


# the map's colours ($Npc_Pula_Z front frame): jacket and cap (38, 50, 77)/(24, 33, 55)/(50, 64, 89), shirt (223, 200, 169)/
# (183, 171, 149), skin (210, 146, 107)/(173, 119, 88), stubble (92, 60, 40)/(57, 37, 25)
NAVY = [(0.0, (10, 13, 24)), (0.08, (18, 24, 40)), (0.16, (28, 37, 60)), (0.24, (40, 52, 80)), (0.34, (54, 68, 100)), (0.5, (76, 92, 126)),
        (0.7, (108, 124, 156)), (1.0, (132, 148, 178))]
CAP_T = ((26, 34, 56), (40, 52, 82), (60, 74, 108), (17, 23, 40))
CREAM = [(0.0, (58, 46, 34)), (0.3, (120, 104, 84)), (0.55, (176, 158, 130)), (0.7, (204, 186, 156)), (0.85, (222, 206, 178)),
         (1.0, (236, 226, 204))]
CREAM_T = ((176, 158, 130), (220, 204, 174), (236, 226, 204))
HAIR = [(0.0, (12, 9, 8)), (0.15, (26, 20, 17)), (0.3, (44, 34, 28)), (0.5, (70, 56, 46)), (0.7, (100, 84, 70)), (1.0, (130, 112, 96))]
SKIN_T = ((182, 118, 84), (214, 150, 112), (232, 176, 138))

op = b.op()
EYES = [[(106, 98), (142, 98), (142, 126), (106, 126)], [(156, 96), (198, 96), (198, 124), (156, 124)]]
EAR = [(206, 98), (226, 98), (234, 112), (230, 140), (214, 146), (204, 138)]
skin = b.sel(hue=(330, 45), sat=(0.12, 0.7), val=(0.5, 1)) & ~b.poly(*EYES)
skin |= b.sel(hue=(0, 45), sat=(0.12, 0.7), val=(0.5, 1), polys=EYES) & b.sel(sat=(0.2, 1))      # (the skin round the eyes)
skin |= b.sel(sat=(0, 0.14), val=(0.85, 1), poly=[(100, 96), (238, 96), (238, 244), (100, 244)]) & ~b.poly(*EYES) \
    & ~b.sel(box=(120, 226, 190, 350))                                                            # (the skin's white shine)

# ---------- the clothes (read from the original): jacket navy wool, T-shirt cream linen ----------
jacket = b.sel(hue=(180, 260), sat=(0.34, 1), box=(0, 168, 330, 350)) | (b.sel(lum=(0, 0.12), box=(0, 168, 330, 350)) & ~skin)
jacket = b.grow(jacket, 1, 0.3) & region(S, 0, 168, 330, 350) & ~skin
# (not the neck's and the jaw's lines, nor the T-shirt's collar lines in the jacket's opening)
NECKV = [(104, 96), (236, 96), (236, 160), (208, 180), (202, 214), (176, 232), (174, 300), (130, 300), (126, 232), (138, 214), (136, 190),
         (104, 170)]
jacket &= ~b.poly(NECKV)
shirt = b.sel(sat=(0, 0.34), val=(0.5, 1), box=(96, 214, 206, 350)) & ~skin & ~jacket
shirt |= b.sel(hue=(180, 260), sat=(0.05, 0.34), val=(0.5, 1), box=(110, 186, 220, 240)) & ~jacket      # (its collar behind the neck)
b.ramp(jacket, NAVY, gain=1.0)
b.ramp(shirt, CREAM, gain=1.0)

# ---------- hair warm black-brown, eyes dark brown, the eye whites warm, the skin tanned ----------
hair = b.sel(lum=(0, 0.62), box=(60, 0, 260, 150)) & ~skin & ~b.poly(*EYES) & ~b.poly(EAR)
hair |= b.sel(hue=(180, 300), sat=(0.05, 1), box=(60, 0, 260, 150)) & ~b.poly(*EYES) & ~b.poly(EAR)
hair &= ~b.poly([(112, 120), (206, 116), (210, 200), (112, 200)])                 # (not the face's lower half)
b.ramp(hair, HAIR, gain=1.0)
irises = b.sel(hue=(190, 280), sat=(0.15, 1), polys=EYES)
b.ramp(irises, [(0.0, (14, 9, 6)), (0.15, (36, 22, 14)), (0.35, (76, 48, 28)), (0.6, (124, 86, 52)), (1.0, (196, 160, 120))], gain=1.0)
whites = b.sel(hue=(150, 300), sat=(0.0, 0.4), val=(0.45, 1), polys=EYES) & ~irises
b.hsv(whites, hue=30, sat=0.06)
lines = b.sel(hue=(180, 300), sat=(0.1, 1), val=(0, 0.5), box=(96, 80, 240, 200)) & ~irises & ~whites    # (the face's bluish dark lines)
b.ramp(lines, [(0.0, (20, 12, 10)), (0.3, (60, 36, 28)), (0.6, (110, 70, 54))], gain=1.0)
b.multiply(skin, (222, 178, 152), 1.0)
# the neck: its pink shading a tanned skin's (by the luminance, the lines kept dark)
JAWL = [(104, 120), (112, 150), (128, 172), (150, 186), (170, 184), (190, 170), (206, 150), (214, 136), (240, 120), (240, 240), (104, 240)]
neck = b.poly(JAWL) & op & ~jacket & ~shirt & ~b.poly(EAR)
b.ramp(neck, [(0.0, (40, 22, 16)), (0.25, (112, 64, 44)), (0.45, (160, 100, 70)), (0.6, (186, 124, 88)), (0.75, (206, 144, 106)),
              (0.9, (224, 166, 128)), (1.0, (236, 184, 148))], gain=1.0)
# weathered: crow's feet, lines under the eyes, the cheeks' creases to the mouth
WR = (150, 92, 64)
b.over(strokes(S, [((108, 112), (104, 116), (102, 121), 1.0), ((109, 118), (105, 122), (104, 126), 0.9), ((196, 110), (200, 113), (203, 117), 1.0),
                   ((114, 126), (124, 130), (136, 127), 1.0), ((166, 124), (178, 128), (192, 124), 1.0),
                   ((136, 138), (132, 148), (134, 156), 1.2), ((180, 134), (184, 146), (180, 156), 1.1)], WR, alpha=0.5,
               clip=skin & region(S, 96, 96, 214, 200)))

# ---------- short dark stubble on the jaw, the chin and the upper lip ----------
face_sk = skin & region(S, 100, 100, 220, 200)
STUB = [(208, 124), (204, 146), (192, 166), (174, 182), (154, 188), (134, 180), (120, 164), (113, 144), (112, 128), (120, 134), (128, 152),
        (140, 166), (154, 172), (172, 168), (186, 154), (196, 132)]
LIP = [(132, 152), (146, 147), (162, 147), (174, 150), (178, 156), (168, 153), (154, 152), (140, 153), (134, 157)]
CHIN = [(140, 166), (154, 168), (170, 166), (172, 176), (156, 184), (140, 178)]
shadow = soft_poly(S, [STUB, LIP, CHIN], blur=1.6) * face_sk
b.multiply(shadow, (158, 134, 120), 0.85)
for poly, sd, dn in ((STUB, 61, 0.7), (LIP, 62, 0.7), (CHIN, 63, 0.7)):
    b.over(stubble(S, poly, (54, 38, 30), density=dn, seed=sd, alpha=0.6, clip=face_sk))
b.over(strokes(S, [((138, 157), (154, 156.4), (170, 157.4), 1.6)], (90, 44, 34), alpha=0.8, taper_to=0.6))    # (the mouth again)

# ---------- the shirt's open collar: the chest's V of skin, the jacket's lapels, the collar's two wings over them ----------
# (the shirt: a linen neck opening - a slit loosely laced, its edges a little turned out - in place of the T-shirt's round neck)
VSKIN = smooth([(132, 230), (142, 246), (151, 268)], 2) + smooth([(153, 268), (160, 246), (170, 229)], 2)
b.over(cel(S, [VSKIN], SKIN_T, lw=1.6, shade=6, light=0, ldir=LD))
b.over(strokes(S, [((136, 236), (150, 244), (166, 234), 2.4)], SKIN_T[0], alpha=0.5, clip=b.poly(VSKIN)))     # (the neckline's shadow)
FACING = [smooth([(128, 228), (138, 246), (150, 272), (146, 274), (132, 250), (124, 232)], 2),
          smooth([(174, 227), (164, 246), (154, 272), (158, 274), (170, 250), (178, 230)], 2)]
b.over(cel(S, FACING, CREAM_T, lw=1.2, shade=1.5, light=1.0, ldir=LD))
b.over(strokes(S, [((142, 254), (152, 258), (160, 252), 1.3), ((140, 250), (152, 248), (162, 256), 1.3), ((152, 266), (150, 276), (146, 284), 1.3),
                   ((153, 266), (156, 278), (160, 286), 1.3)], (122, 96, 66), alpha=1.0, taper_to=0.8))          # (the loose lace)
# the jacket's lapels turned back along the opening (the base's button under the near one)
LAP_L = smooth([(126, 222), (108, 228), (104, 236)]) + [(114, 246)] + smooth([(114, 246), (118, 272), (127, 302)]) + [(131, 300), (128, 240)]
LAP_R = smooth([(176, 222), (194, 228), (198, 236)]) + [(188, 246)] + smooth([(188, 246), (184, 272), (174, 300)]) + [(171, 298), (174, 240)]
lap = cel(S, [LAP_L, LAP_R], ((22, 30, 50), (40, 52, 82), (62, 78, 112)), lw=1.8, shade=4, light=2, ldir=LD)
b.over(lap)

# ---------- the knitted cap: a snug dome ribbed all over, a rolled hem low over the forehead ----------
CX, CY, RX, RY, ROT = 165, 92, 77, 86, np.radians(3)
ARC = ellipse(CX, CY, RX, RY, ROT, 60, np.pi, 2 * np.pi)
BOTTOM = smooth([(241, 97), (236, 108), (224, 104), (206, 94), (184, 86), (160, 83), (134, 86), (110, 92), (94, 96), (88, 88)], 2)
CAP = ARC + BOTTOM
cap = cel(S, [CAP], CAP_T[:3], lw=2.0, shade=13, light=4, shade2=5, ldir=LD)
cm = erode_cv(cap[..., 3] > 0.5, 2)
ribs = []
for k in range(19):
    t = k / 18.0
    x0 = 92 + t * 146
    y0 = np.interp(x0, [88, 110, 134, 160, 184, 206, 224, 241], [92, 92, 86, 83, 86, 94, 104, 97])
    ribs.append(((x0, y0), (CX + (x0 - CX) * 0.62, 30), (CX + (x0 - CX) * 0.18, 8), 1.3))
cap = over(cap, strokes(S, ribs, CAP_T[3], alpha=0.55, clip=cm, taper_to=0.3))
cap = over(cap, strokes(S, [((a[0] + 2.4, a[1]), (m[0] + 1.6, m[1]), (c[0] + 0.6, c[1]), 0.9) for a, m, c, _ in ribs], CAP_T[2], alpha=0.35,
                        clip=cm, taper_to=0.3))
# the rolled hem: a band along the lower edge
HEM = [(90, 86), (110, 84), (134, 78), (160, 75), (184, 78), (206, 86), (224, 96), (238, 94)]
cap = over(cap, strokes(S, [(HEM[i], ((np.asarray(HEM[i]) + np.asarray(HEM[i + 1])) / 2).tolist(), HEM[i + 1], 1.6) for i in range(len(HEM) - 1)],
                        CAP_T[3], alpha=0.8, clip=cm, taper_to=1.0))
cap = over(cap, strokes(S, [(HEM[i], ((np.asarray(HEM[i]) + np.asarray(HEM[i + 1])) / 2).tolist(), HEM[i + 1], 1.0) for i in range(len(HEM) - 1)],
                        CAP_T[2], alpha=0.4, clip=shift(cm, 0, -2), taper_to=1.0))
# the hair sticking out at the near side above the cap's edge goes
b.erase(b.poly([(60, 40), (100, 40), (96, 92), (60, 96)]) & ~skin)
b.erase(b.poly([(236, 30), (290, 30), (290, 104), (236, 104)]) & ~skin & ~b.poly(EAR))
put_hat(b, cap, shadow=(150, 112, 104), shadow_k=0.5, sdx=2, sdy=7, keep=b.poly(EAR))

# ---------- the jacket and the cap are the only blue: every other bluish line (the jaw, the neck, the shirt's) warm ----------
garment = dilate_cv(jacket | (lap[..., 3] > 0.05) | (cap[..., 3] > 0.05), 1)
hsv = rgb_to_hsv(b.img[..., :3])
blues = (hsv[..., 0] * 360 >= 165) & (hsv[..., 0] * 360 <= 300) & (hsv[..., 1] > 0.05) & (b.img[..., 3] > 0.02) & ~garment
hsv[..., 0] = np.where(blues, 22 / 360.0, hsv[..., 0])
hsv[..., 1] = np.where(blues, np.minimum(hsv[..., 1] * 0.6, 0.3), hsv[..., 1])
b.img[..., :3] = hsv_to_rgb(hsv)
b.save(OUT)
print('ok', OUT)
