# Babka Jadwiga (the herb-woman of Podgrodzie, about 70): People1_8 repainted to match her map sheet ($Npc_Znachorka) - the
# grey hair kept (combed back and tied) with a small bun put up on top as on the map, the cream shawl a thick, chunky-knit
# DARK BROWN, almost black wool shawl (rows of knitted stitches painted over it, its front edges a ribbed border), the plum
# dress a plain mid-brown one, the cords of the lacing and the shawl's tie a pale rope, a sprig of herbs tucked into the shawl.
# (2026-10-06 first version had a light greyish shawl; 2026-10-07 darker and knitted, the bun, as on the map.)
# Run: python tools/busts/make_znachorka.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Znachorka_Bust.png')
b = Bust('People1_8')
S = b.img.shape
LD = (0.55, 0.83)                       # the cel shade falls on the lower right (light from the upper left)

# ---------- the shawl: dark brown, almost black; the dress plain mid brown; the cords a pale rope ----------
FACE = [(90, 140), (215, 140), (208, 182), (188, 196), (160, 202), (132, 198), (108, 186)]
low = b.op() & region(S, 0, 165, 330, 350) & ~b.poly(FACE)
cords = b.sel(hue=(8, 30), sat=(0.44, 1), val=(0.05, 0.78), polys=[[(124, 248), (172, 248), (172, 296), (124, 296)],
                                                                   [(116, 300), (180, 300), (184, 350), (112, 350)]])
cords = b.grow(cords, 1, 0.2) & low
dress = (b.sel(hue=(290, 360), sat=(0.2, 1)) | b.sel(hue=(0, 12), sat=(0.25, 0.6), val=(0.3, 0.8))) & low & ~cords
dress &= b.poly([(112, 165), (212, 165), (190, 320), (130, 320)])
tail = b.sel(hue=(180, 250), sat=(0, 0.45), box=(176, 140, 226, 215))           # (the hair tied at the nape)
dress |= b.sel(hue=(290, 360), sat=(0.2, 1), box=(176, 165, 206, 194))          # (the collar behind the neck)
shawl = low & ~dress & ~cords & ~tail
SHAWL = [(0.0, (10, 7, 6)), (0.2, (20, 14, 11)), (0.45, (32, 23, 18)), (0.62, (44, 32, 25)), (0.78, (56, 41, 32)), (0.9, (70, 52, 40)),
         (1.0, (86, 66, 50))]
b.ramp(shawl, SHAWL)
DRESS = [(0.0, (24, 14, 10)), (0.15, (52, 34, 24)), (0.3, (86, 60, 40)), (0.42, (112, 82, 56)), (0.55, (136, 102, 70)), (0.7, (160, 124, 88)),
         (0.9, (188, 154, 116))]
b.ramp(dress, DRESS, gain=1.05)
b.ramp(cords, [(0.0, (34, 22, 14)), (0.1, (88, 64, 40)), (0.25, (150, 118, 80)), (0.45, (196, 164, 118)), (0.7, (226, 200, 156))], gain=1.5)

# ---------- the knit: rows of chunky stitches round the neck (little Vs pointing outwards), a ribbed front border ----------
inner = erode_cv(shawl, 2)
BORDER = [[(98, 196), (124, 194), (132, 260), (136, 352), (108, 352), (104, 262)], [(192, 192), (214, 190), (226, 262), (232, 330), (214, 332),
                                                                                   (206, 262)]]
border = b.poly(*BORDER) & inner
body = inner & ~border
DK, LT = (12, 8, 6), (92, 72, 56)
halves = []
C = np.array([162.0, 150.0])
rng = np.random.RandomState(7)
for k, ry in enumerate(np.arange(44.0, 236.0, 8.0)):
    rx = ry * 1.5
    n = int(np.pi * (rx + ry) / 2 / 9.5)                                   # (a stitch every ~9-10 px along the row)
    for t in np.linspace(0.02, np.pi - 0.02, n) + (k % 2) * (np.pi / n / 2):
        p = C + [np.cos(t) * rx, np.sin(t) * ry]
        if not (0 <= p[0] < S[1] and 0 <= p[1] < S[0]) or not body[int(p[1]), int(p[0])]:
            continue
        nr = np.array([np.cos(t) * ry, np.sin(t) * rx]); nr /= np.linalg.norm(nr)       # outwards (down the shawl)
        tg = np.array([nr[1], -nr[0]])                                                   # along the row, to the right
        ang = np.arctan2(tg[1], tg[0])
        for sgn in (-1, 1):                                                              # the two legs of the V, leaning in
            q = p + tg * sgn * 2.4 + rng.uniform(-0.4, 0.4, 2)
            halves.append(ellipse(q[0], q[1], 3.6, 2.1, ang - sgn * 0.95, 14))
knit = cel(S, halves, ((30, 22, 17), (52, 39, 30), (80, 61, 47)), line=(10, 7, 6), lw=0.9, shade=1.2, light=0.9, ldir=LD, clip=body)
b.over(knit, k=0.8)
# the border: ribs running down it
ribs = []
for P in BORDER:
    top0, top1, bot1, bot0 = np.array(P[0], float), np.array(P[1], float), np.array(P[-3], float), np.array(P[-2], float)
    for f in np.linspace(0.15, 0.85, 4):
        a, z = top0 + (top1 - top0) * f, bot0 + (bot1 - bot0) * f
        ribs.append((tuple(a), tuple((a + z) / 2 + [1.5, 0]), tuple(z), 1.3))
b.over(strokes(S, ribs, DK, alpha=0.7, clip=border, taper_to=1.0))
b.over(strokes(S, [((x0 + 1.4, y0), (xm + 1.4, ym), (x1 + 1.4, y1), 0.9) for (x0, y0), (xm, ym), (x1, y1), _ in ribs], LT, alpha=0.45, clip=border,
               taper_to=1.0))

# ---------- the hair: a small grey bun put up on top (behind the hair line) ----------
HT = ((128, 138, 150), (192, 198, 206), (236, 238, 242), (88, 96, 108))
BC = (191.0, 34.0)
bun = cel(S, [ellipse(BC[0], BC[1], 16, 12.5, -0.2, 44)], HT[:3], lw=1.8, shade=4.5, light=2.2, ldir=LD)
bm = erode_cv(bun[..., 3] > 0.5, 1)
wraps = []                                     # (the hair wound round: arcs spiralling in, dark with a light edge)
for i, (f, a0, a1) in enumerate(((0.8, 1.0, 1.85), (0.6, 0.15, 0.95), (0.62, 1.15, 1.9), (0.38, 0.3, 1.2), (0.34, 1.3, 2.0))):
    arc = ellipse(BC[0] + (i % 2) * 1.5, BC[1] + 0.5 * i, 15 * f, 13 * f, -0.15, 9, np.pi * a0, np.pi * a1)
    wraps.append((arc[0], arc[4], arc[-1], 1.2))
bun = over(bun, strokes(S, wraps, HT[3], alpha=0.8, clip=bm, taper_to=0.2))
bun = over(bun, strokes(S, [((p0[0] - 0.9, p0[1] - 1.3), (p1[0] - 0.9, p1[1] - 1.3), (p2[0] - 0.9, p2[1] - 1.3), 0.9) for p0, p1, p2, _ in wraps],
                        HT[2], alpha=0.85, clip=bm, taper_to=0.2))
b.img = over(bun, b.img)

# ---------- the herbs: a few green leaves and two pale flowers on stalks, tucked in at the near side ----------
GREENS = ((44, 70, 34), (86, 124, 58), (140, 170, 96))
b.over(strokes(S, [((232, 300), (240, 280), (246, 258), 1.6), ((236, 302), (250, 284), (262, 268), 1.5),
                   ((230, 304), (232, 286), (228, 266), 1.5)], (70, 90, 44), alpha=1.0))
leaves = [ellipse(x, y, rx, ry, r, 18) for (x, y, rx, ry, r) in
          [(246, 262, 6, 3, -1.1), (240, 276, 6, 3, -0.6), (258, 272, 6, 3, -0.4), (252, 286, 5, 2.6, 0.2), (228, 270, 6, 3, -1.5),
           (233, 288, 5, 2.6, 2.6)]]
b.over(cel(S, leaves, GREENS, lw=1.0, shade=1.5, light=1.0, ldir=LD))
b.over(cel(S, [ellipse(262, 266, 3.5, 3.5, 0, 12), ellipse(229, 263, 3.2, 3.2, 0, 12)], ((180, 150, 90), (236, 214, 150), (252, 244, 210)),
           lw=0.9, shade=1.0, light=0.8, ldir=LD))
b.save(OUT)
print('ok', OUT)
