# Hero bust: People1_3 recoloured (black hair, dark eyes, grey sackcloth shirt, dark worn vest) and made poor like
# the barefoot peasant on the map - frayed neckline and hems, sewn patches, torn holes, dirt on the cheek.
# Run: python tools/busts/make_hero.py [out.png]
import sys, os
import numpy as np
from bustlib import *
from patches import patch, fray, hole, smudge, rip

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PICS, 'Hero_Bust.png')
DBG = os.environ.get('BUST_DBG')

src = load('People1_3')
H, W = src.shape[:2]
hsv = rgb_to_hsv(src[..., :3]); hd = hsv[..., 0] * 360; s = hsv[..., 1]; v = hsv[..., 2]
yy, xx = np.mgrid[0:H, 0:W]
op = src[..., 3] > 0

# ---------- recolour (option A the user picked) ----------
blue = op & (hd >= 195) & (hd <= 255) & (s > 0.2)
eye = (yy >= 95) & (yy <= 125) & (xx >= 105) & (xx <= 200)
hair = blue & (yy < 165) & ~eye
eyes = blue & eye
vest = blue & (yy >= 165)
shirt = op & (hd >= 27.5) & (hd <= 62) & (s > 0.1) & (v > 0.3) & (yy > 165) & ~((v > 0.97) & (s < 0.17) & (hd < 37))
laces = region(src.shape, 138, 236, 182, 305)
shirt_lines = op & dilate(shirt, 2) & ~laces & (hd >= 12) & (hd < 27.5) & (s > 0.3) & (v < 0.6)


def hsvset(m, h, sat, val):
    global out
    rgb = hsv_to_rgb(np.stack([np.full_like(v, h / 360.0), np.full_like(v, sat), np.clip(val, 0, 1)], -1))
    out[..., :3] = np.where(m[..., None], rgb, out[..., :3])


out = src.copy()
hsvset(hair, 220, 0.12, 0.08 + v * 0.30)     # near-black hair, faint cool highlights
hsvset(eyes, 25, 0.45, 0.10 + v * 0.30)      # dark brown eyes
hsvset(vest, 30, 0.14, 0.12 + v * 0.42)      # worn dark grey-brown wool
hsvset(shirt, 40, 0.06, v * 0.80)            # grey sackcloth
hsvset(shirt_lines, 30, 0.10, v * 0.75)      # its brown fold lines -> dark grey
base_a = out.copy()                          # = hero_bust_A (plus the shirt's deep shades now grey too)

# ---------- wear and tear ----------
LINE = (26, 22, 20)
# frayed neckline of the shirt (both sides of the V) with a couple of loose threads
out = fray(out, [(142, 215), (147, 222), (153, 230), (160, 238)], -1, seed=11, teeth=(1.6, 3.4), width=(1.8, 3.2),
           gap=(0.6, 2.2), threads=1, line=LINE)
out = fray(out, [(160, 238), (168, 231), (176, 224), (186, 218), (196, 213)], -1, seed=12, teeth=(1.6, 3.6),
           width=(1.8, 3.4), gap=(0.6, 2.2), threads=1, line=LINE)
# the vest's collar tops and hems ragged
out = fray(out, [(206, 171), (214, 169), (222, 169), (228, 172)], -1, seed=13, teeth=(1.2, 2.8), width=(2, 3.5), gap=(1, 3), line=LINE)
out = fray(out, [(131, 184), (136, 181), (142, 181)], -1, seed=14, teeth=(1.2, 2.6), width=(2, 3), gap=(1, 2.5), line=LINE)
out = fray(out, [(35, 267), (46, 266), (58, 269), (70, 276), (82, 283), (92, 290)], 1, seed=15, teeth=(2.0, 4.2),
           width=(2.4, 4.2), gap=(0.8, 2.6), line=LINE)
out = fray(out, [(232, 279), (241, 275), (252, 273), (265, 274), (276, 283), (285, 292), (292, 301)], -1, seed=16,
           teeth=(2.0, 4.2), width=(2.4, 4.2), gap=(0.8, 2.6), line=LINE)

# sewn patches on the vest: lighter wool on the near shoulder, darker on the far side
out = patch(out, [(247, 200), (279, 195), (284, 228), (251, 233)], vest, lift=1.32, hue=(30, 0.26), seed=21,
            stitch=(206, 190, 150), line=LINE)
out = patch(out, [(60, 236), (84, 232), (87, 255), (63, 259)], vest, lift=0.74, hue=(24, 0.22), seed=22,
            stitch=(196, 180, 140), line=LINE)

# torn holes: a rip in the vest shows the shirt in its shadow, one in the sleeve shows skin
out = hole(out, rip([(104, 231), (109, 236), (113, 243), (117, 250)], 7.0, seed=31, jag=0.35, alt=0.15, step=2.2), fill=(112, 109, 102),
           shade=(80, 78, 74), line=LINE, lip=(146, 138, 128))
out = hole(out, rip([(124, 323), (131, 320), (140, 323)], 6.5, seed=32, jag=0.35, alt=0.15, step=2.2), fill=(242, 180, 150),
           shade=(206, 140, 120), line=LINE, lip=(214, 211, 204))

# dirt: a smear on the near cheek (two flat tints) and a speck on the far jaw
out = smudge(out, [[(176, 148), (179, 143), (185, 141), (189, 139), (195, 140), (198, 144), (194, 146), (196, 150),
                    (190, 151), (184, 150), (179, 152)]], (156, 116, 90), 0.2)
out = smudge(out, [[(184, 146), (189, 143), (194, 143), (193, 146), (188, 148)], [(179, 149), (182, 147), (184, 149), (181, 150)]],
             (126, 90, 68), 0.17)
out = smudge(out, [[(108, 158), (112, 156), (117, 157), (119, 160), (115, 163), (110, 162)]], (156, 116, 90), 0.18)

save(out, OUT)
if DBG:
    save(base_a, os.path.join(DBG, 'hero_base_a.png'))
    zoom(out, (20, 150, 320, 350), 2).save(os.path.join(DBG, 'hero_zoom.png'))
    on_bg(out).save(os.path.join(DBG, 'hero_full.png'))
print('ok', OUT)
