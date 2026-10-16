# python tools/domy/sign_art.py [out.png]  -> img/characters/!$Lord_Sign.png (default)
# "Własność Lorda Zaleskiego": the sign the Lord's men put up on grandpa's field when it is lost (Homes.js / Story.js, 2026-10-15).
# Drawn from pieces already in the game (no PixelLab): the Lord's own banner (!Flags_banner, character 0, the "left" row - red with a
# black rearing horse, as on the town's east gate) hung from a crossbar on a plain wooden pole driven into the ground, a few field
# stones heaped at its foot. Fine 1x pixels, 1 px dark outline, light from the upper left. Three patterns (the banner's own three
# frames: it stirs in the wind), the same on all four rows. Frame 64 x 112 (a "!$" sheet: one character, drawn bottom-centred).
import os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "img", "characters", "!$Lord_Sign.png")
FW, FH = 64, 112
OUTLINE = (38, 26, 20, 255)
WOOD = [(92, 62, 38, 255), (122, 84, 52, 255), (150, 108, 70, 255)]   # dark, mid, light
STONE = [(78, 80, 84, 255), (112, 114, 118, 255), (146, 148, 150, 255)]

banner = Image.open(os.path.join(ROOT, "img", "characters", "!Flags_banner.png")).convert("RGBA")

def frame(p):
    im = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # the pole: x 6..10 (outline + 3 tones), from the crossbar to the ground
    px0, top, bottom = 6, 6, FH - 6
    d.rectangle((px0, top, px0 + 4, bottom), fill=OUTLINE)
    d.rectangle((px0 + 1, top + 1, px0 + 3, bottom - 1), fill=WOOD[1])
    d.line((px0 + 1, top + 1, px0 + 1, bottom - 1), fill=WOOD[2])
    d.line((px0 + 3, top + 1, px0 + 3, bottom - 1), fill=WOOD[0])
    for y in range(top + 9, bottom - 2, 11):   # (the grain: small dark knots)
        d.point((px0 + 2, y), fill=WOOD[0])
    # the crossbar: y 6..10, from the pole to x 60, a peg at its end
    d.rectangle((px0, top, 60, top + 4), fill=OUTLINE)
    d.rectangle((px0 + 1, top + 1, 59, top + 3), fill=WOOD[1])
    d.line((px0 + 1, top + 1, 59, top + 1), fill=WOOD[2])
    d.line((px0 + 1, top + 3, 59, top + 3), fill=WOOD[0])
    # the banner (the Lord's colours): the frame's painted part, hung under the crossbar
    src = banner.crop((p * 48, 96, p * 48 + 48, 192))
    bb = src.getbbox() or (0, 0, 48, 96)
    art = src.crop(bb)
    bx = 13 + (47 - art.width) // 2
    im.alpha_composite(art, (bx, top + 3))
    # field stones heaped at the foot of the pole
    for (sx, sy, w, h, t) in [(1, FH - 9, 8, 6, 1), (9, FH - 8, 7, 5, 2), (4, FH - 12, 6, 5, 2), (13, FH - 6, 5, 4, 0)]:
        d.ellipse((sx, sy, sx + w, sy + h), fill=OUTLINE)
        d.ellipse((sx + 1, sy + 1, sx + w - 1, sy + h - 1), fill=STONE[t])
        d.point((sx + 2, sy + 2), fill=STONE[2])
    return im

sheet = Image.new("RGBA", (FW * 3, FH * 4), (0, 0, 0, 0))
for p in range(3):
    f = frame(p)
    for row in range(4):
        sheet.alpha_composite(f, (p * FW, row * FH))
sheet.save(OUT)
print(OUT, sheet.size)
