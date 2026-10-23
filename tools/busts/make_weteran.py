# Wacław Siwy (the old soldier on a crutch of the new town's Map008 - docs/miasteczko/NOWE_MIASTO.md, 2026-10-22; gaunt, about 65):
# People4_7 (the uniformed man - Feliks's base too) repainted to his map sheet ($Npc_Weteran) - grey hair, bushy white brows, a big
# drooping WHITE MOUSTACHE and a short white beard, a pale SCAR across the near cheek, the lines of age, grey-blue eyes; the tan
# uniform an old faded DARK-BLUE soldier's coat with tarnished brass (the epaulettes, the collar's piping, a row of buttons), worn and
# patched, the blue neckcloth a grey wool scarf. (The crutch is below the bust's frame.)
# 0 PixelLab generations. Run: python tools/busts/make_weteran.py [out.png]
import sys
from kit import *

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Weteran_Bust.png')
b = Bust('People4_7')
S = b.img.shape
LD = (0.55, 0.83)
op = b.op()

# ---------- hair + sideburns grey, brows white, eyes grey-blue ----------
FACE = [(90, 100), (150, 92), (176, 100), (182, 140), (176, 170), (150, 190), (120, 182), (100, 160), (92, 130)]
hair = b.sel(sat=(0, 0.5), val=(0, 0.45), box=(55, 0, 240, 175)) & ~b.poly(FACE)
hair |= b.sel(sat=(0, 0.5), val=(0, 0.45), poly=[(176, 130), (200, 130), (200, 178), (176, 178)])
GREY = [(0.0, (40, 40, 46)), (0.08, (84, 84, 92)), (0.14, (134, 134, 142)), (0.24, (176, 176, 182)), (0.4, (214, 214, 218)), (0.6, (238, 238, 242))]
b.ramp(hair, GREY)
iris = b.sel(hue=(60, 180), sat=(0.2, 1), polys=[[(90, 102), (120, 102), (120, 122), (90, 122)], [(130, 98), (170, 98), (170, 120), (130, 120)]])
b.ramp(iris, [(0.0, (30, 34, 40)), (0.3, (70, 82, 96)), (0.6, (110, 126, 142)), (0.9, (160, 174, 188))])
HAIR_T = ((150, 150, 156), (200, 200, 206), (236, 236, 240), (118, 118, 126))
BROW_N = [(128, 98), (134, 90), (146, 86), (160, 86), (172, 90), (176, 98), (168, 98), (156, 95), (144, 96), (134, 101)]
BROW_F = [(88, 104), (94, 97), (104, 94), (114, 96), (120, 102), (112, 103), (100, 103), (92, 107)]
for i, P in enumerate((BROW_N, BROW_F)):
    lay = cel(S, [P], HAIR_T[:3], lw=1.3, shade=2.5, light=1.2, ldir=LD)
    lay = over(lay, hair_strands(S, erode_cv(lay[..., 3] > 0.5, 1), (P[0][0] - 6, P[0][1] + 2), HAIR_T[2], HAIR_T[3], n=18, length=(5, 9),
                                 seed=101 + i, alpha=(0.6, 0.6)))
    b.over(lay)

# ---------- age: the lines of a long life; a scar over the near cheek ----------
WR = (150, 96, 70)
b.over(strokes(S, [((108, 74), (124, 71), (142, 73), 1.5), ((112, 81), (126, 79), (140, 80), 1.3), ((116, 66), (128, 64), (140, 66), 1.1),
                   ((84, 110), (88, 116), (94, 118), 1.3), ((86, 116), (90, 121), (96, 122), 1.1),
                   ((168, 112), (174, 117), (180, 118), 1.3), ((168, 118), (174, 123), (180, 124), 1.1),
                   ((122, 134), (114, 148), (116, 162), 1.6), ((160, 138), (166, 152), (162, 166), 1.4),
                   ((100, 124), (106, 128), (114, 126), 1.0), ((140, 122), (150, 126), (160, 124), 1.0)], WR, alpha=0.55))
b.over(strokes(S, [((150, 108), (160, 122), (172, 142), 3.0)], (206, 150, 132), alpha=0.95, taper_to=0.5))
b.over(strokes(S, [((151, 110), (161, 124), (172, 142), 1.0)], (150, 86, 72), alpha=0.85, taper_to=0.4))
b.over(strokes(S, [((152, 118), (157, 116), (161, 114), 0.9), ((158, 126), (163, 124), (167, 121), 0.9), ((164, 134), (169, 132), (173, 129), 0.9)],
               (160, 100, 86), alpha=0.6, taper_to=1.0))

# ---------- a short white beard and a big drooping moustache ----------
OUTER = [(186, 126), (184, 150), (174, 170), (157, 185), (136, 191), (116, 185), (102, 170), (94, 150), (90, 132)]
INNER = [(98, 140), (104, 154), (114, 166), (126, 172), (142, 172), (156, 166), (166, 154), (174, 140), (180, 126)]
TONES = ((150, 150, 156), (198, 198, 204), (232, 232, 236), (120, 120, 128))
b.over(beard2(S, OUTER, INNER, TONES, flow=(138, 240), seed=111, n=120, tip=5, out=2.4, seg=8))
MOUS = [(104, 154), (114, 148), (126, 145), (138, 146), (150, 148), (160, 152), (166, 160), (169, 174), (164, 184), (158, 170), (148, 163),
        (134, 162), (122, 164), (112, 172), (104, 186), (98, 178), (100, 164)]
ml = cel(S, [MOUS], TONES[:3], lw=1.5, shade=3.5, light=1.8, ldir=LD)
mm = erode_cv(ml[..., 3] > 0.5, 1)
ml = over(ml, hair_strands(S, mm & (b.xx >= 135), (166, 184), TONES[2], TONES[3], n=24, length=(6, 11), seed=113, alpha=(0.6, 0.55)))
ml = over(ml, hair_strands(S, mm & (b.xx < 135), (102, 186), TONES[2], TONES[3], n=24, length=(6, 11), seed=114, alpha=(0.6, 0.55)))
b.over(ml)

# ---------- the coat: an old faded dark-blue soldier's coat, tarnished brass ----------
coat = b.sel(hue=(10, 45), sat=(0.15, 0.6), val=(0.3, 0.95), box=(0, 196, 330, 350))
epaul = b.sel(hue=(12, 62), sat=(0.6, 1), box=(40, 185, 300, 262)) | b.sel(hue=(12, 40), sat=(0.6, 1), box=(200, 205, 240, 235))
NAVY = [(0.0, (10, 12, 20)), (0.18, (22, 28, 44)), (0.34, (36, 46, 68)), (0.5, (52, 64, 90)), (0.66, (68, 82, 108)), (0.82, (86, 100, 124)),
        (1.0, (104, 118, 140))]
b.ramp(coat, NAVY, gain=0.95)
BRASS = [(0.0, (40, 30, 12)), (0.3, (86, 66, 28)), (0.55, (132, 106, 50)), (0.75, (164, 136, 70)), (0.92, (190, 166, 100))]
b.ramp(epaul, BRASS, gain=0.95)
pip = b.sel(hue=(20, 62), sat=(0.45, 1), val=(0.45, 1), box=(100, 140, 240, 230)) & ~epaul
b.ramp(pip, BRASS)
for y in (262, 292, 322):
    b.over(cel(S, [ellipse(206 - (y - 262) * 0.05, y, 4.4, 4.4)], ((90, 70, 30), (150, 122, 60), (200, 176, 110)), lw=1.0, shade=1.5, light=1.0,
               ldir=LD))
# the neckcloth: a grey wool scarf
crav = b.sel(hue=(200, 270), sat=(0.2, 1), box=(100, 190, 260, 350))
crav = b.grow(crav, 2, 0.3) & region(S, 100, 190, 260, 350)
b.ramp(crav, [(0.0, (22, 22, 26)), (0.1, (50, 50, 56)), (0.2, (80, 80, 86)), (0.32, (110, 110, 114)), (0.45, (136, 136, 138))])
b.over(hair_strands(S, erode_cv(crav, 2), (150, 400), (150, 150, 152), (70, 70, 76), n=120, length=(3, 6), seed=117, alpha=(0.35, 0.35)))
# worn: a frayed seam
b.over(strokes(S, [((250, 300), (270, 312), (292, 318), 1.2)], (120, 130, 150), alpha=0.6))
b.save(OUT)
print('ok', OUT)
