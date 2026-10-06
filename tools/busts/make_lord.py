# Lord Leopold Zaleski: People2_5 (his face in the talks since the start) repainted to his hero-style sheet - greying brown hair
# and a grey-brown beard, the cream fur a dark brown fur collar, the pink sleeve crimson, the lilac cravat black silk, and a
# heavy gold chain across the chest. Run: python tools/busts/make_lord.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Lord_Bust.png')
b = Bust('People2_5')
S = b.img.shape

# ---------- hair and beard: greying ----------
head = b.poly([(90, 20), (280, 20), (280, 300), (90, 200)])
FACE = [(112, 86), (150, 78), (200, 84), (226, 104), (232, 130), (224, 160), (204, 176), (182, 188), (150, 196), (124, 178),
        (110, 140)]
hair = (b.sel(hue=(10, 40), sat=(0.38, 1), val=(0, 0.62)) & head & ~b.poly([(232, 110), (300, 110), (300, 330), (232, 330)])
        & ~b.poly(FACE))
hair |= b.sel(hue=(10, 40), sat=(0.38, 1), val=(0, 0.62), box=(230, 100, 290, 200))
beard = b.sel(hue=(10, 40), sat=(0.3, 1), val=(0, 0.62), box=(128, 160, 200, 205))
GREYING = [(0.0, (26, 20, 18)), (0.1, (54, 42, 34)), (0.2, (88, 74, 64)), (0.3, (124, 114, 106)), (0.45, (168, 162, 156)),
           (0.6, (204, 200, 196))]
b.ramp(hair, GREYING)
b.ramp(beard, [(0.0, (30, 24, 22)), (0.12, (70, 62, 58)), (0.25, (118, 112, 108)), (0.4, (160, 156, 152)), (0.6, (200, 198, 196))])

# ---------- the fur: dark brown (the RTP cream fur's flecks kept as lighter tips) ----------
body = b.poly([(0, 130), (330, 130), (330, 350), (0, 350)]) & ~b.poly([(95, 150), (215, 150), (215, 260), (95, 260)])
fur = b.sel(hue=(36, 90), sat=(0.05, 0.7), val=(0.45, 1)) & body
fur = b.grow(fur, 2, 0.35) & body
FUR = [(0.0, (24, 14, 10)), (0.3, (52, 32, 20)), (0.55, (76, 50, 32)), (0.75, (100, 70, 46)), (0.9, (120, 86, 56)), (1.0, (142, 106, 70))]
b.ramp(fur, FUR)

# ---------- the sleeve: crimson; the maroon coat a little richer ----------
sleeve = b.sel(hue=(0, 26), sat=(0.15, 0.6), val=(0.45, 0.95), box=(225, 190, 330, 350))
sleeve |= b.sel(hue=(0, 26), sat=(0.15, 0.6), val=(0.45, 0.95), box=(60, 230, 110, 290))
CRIMSON = [(0.0, (30, 4, 10)), (0.25, (90, 14, 26)), (0.45, (148, 26, 40)), (0.6, (186, 46, 56)), (0.8, (220, 92, 92))]
b.ramp(sleeve, CRIMSON)
coat = b.sel(hue=(320, 360), sat=(0.5, 1), box=(0, 260, 330, 350))
b.ramp(coat, [(0.0, (22, 2, 8)), (0.1, (64, 8, 18)), (0.2, (110, 16, 30)), (0.3, (150, 30, 42)), (0.45, (190, 60, 64))])

# ---------- the cravat: black silk ----------
crav = b.sel(hue=(235, 290), sat=(0.15, 1), box=(100, 170, 260, 330))
crav = b.grow(crav, 2, 0.3) & region(S, 100, 170, 260, 330)
b.ramp(crav, [(0.0, (8, 8, 12)), (0.2, (22, 22, 30)), (0.4, (44, 44, 56)), (0.6, (78, 78, 94)), (0.8, (120, 120, 138))])
ring = b.sel(hue=(200, 250), sat=(0.5, 1), box=(95, 175, 120, 200))
b.ramp(ring, [(0.0, (60, 6, 10)), (0.4, (170, 20, 30)), (0.8, (250, 120, 120))])   # (his ring's stone: a ruby)

# ---------- the gold chain over the shoulders ----------
b.over(chain(S, [(118, 296), (140, 318), (168, 330), (196, 332), (224, 322), (250, 302), (268, 284)], link=(14, 8.5), every=11,
             gold=((116, 74, 20), (210, 158, 56), (254, 230, 150))))
b.over(cel(S, [ellipse(184, 338, 9, 10)], ((116, 74, 20), (210, 158, 56), (254, 230, 150)), lw=1.6, shade=3, light=1.5))

b.save(OUT)
print('ok', OUT)
