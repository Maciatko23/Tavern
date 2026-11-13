# -*- coding: utf-8 -*-
"""Paints img/characters/!$Wodopoj.png: a VERTICAL heavy wooden trough (1 tile wide, 3 tall, seen from the top-down 3/4 view: the long open
box, its near/south end face at the bottom, on two stone blocks), dark deep water with a 3-frame shimmer, a wet patch at the south end,
graded with tools/styl/styl_b.grade() (B2). Cell 48 x 156 (3 tiles + 12 px above the first); the event stands on the bottom tile (the
blocking is 3 cells: Konie.js adds two invisible blockers above it). RMMZ reads a $ sheet as 3 x 4 cells: only the first row is used.
  python tools/konie/wodopoj.py"""
import os, sys, random
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "styl"))
import styl_b
W, H = 48, 156
OUT = os.path.join(ROOT, "img", "characters", "!$Wodopoj.png")
OUTL = (36, 24, 16, 255)
XL, XR = 4, 43            # outer left / right of the box
YT, YW0, YW1, YF = 6, 14, 118, 140   # top of the back rim, water top, water bottom (front lip), bottom of the front face


def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)


def plank(im, x0, y0, x1, y1, base, rnd, vertical):
    """a wooden board: light edge on one side, dark on the other, grain streaks along its length, a knot or two"""
    d = ImageDraw.Draw(im)
    span = (x1 - x0) if vertical else (y1 - y0)
    for i in range(span + 1):
        t = i / max(1, span)
        c = mix(tuple(min(255, v + 18) for v in base), tuple(max(0, v - 26) for v in base), t)
        if vertical: d.line([x0 + i, y0, x0 + i, y1], fill=c)
        else: d.line([x0, y0 + i, x1, y0 + i], fill=c)
    length = (y1 - y0) if vertical else (x1 - x0)
    for _ in range(max(2, length // 6)):
        n = rnd.randint(6, 22)
        if vertical:
            x = rnd.randint(x0, x1); y = rnd.randint(y0 + 1, max(y0 + 1, y1 - n))
        else:
            x = rnd.randint(x0 + 1, max(x0 + 1, x1 - n)); y = rnd.randint(y0, y1)
        c = mix(base, (30, 18, 10), 0.45) if rnd.random() < 0.7 else mix(base, (220, 170, 110), 0.30)
        d.line([x, y, x, y + n] if vertical else [x, y, x + n, y], fill=c)
    if length > 40:
        for _ in range(3):
            x = rnd.randint(x0 + 1, max(x0 + 1, x1 - 1)) if vertical else rnd.randint(x0 + 10, x1 - 10)
            y = rnd.randint(y0 + 10, y1 - 10) if vertical else rnd.randint(y0, y1)
            d.ellipse([x - 1, y - 2, x + 1, y + 2] if vertical else [x - 2, y - 1, x + 2, y + 1], outline=mix(base, (30, 18, 10), 0.6))


def frame(k):
    rnd = random.Random(11)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # soft contact shadow all round and the wet patch spilling in front of the south end
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    gd.rectangle([XL - 1, 20, XR + 3, 146], fill=(20, 14, 10, 60))
    gd.ellipse([0, 138, 47, 155], fill=(50, 38, 26, 170)); gd.ellipse([8, 143, 42, 155], fill=(36, 26, 18, 150))
    im.alpha_composite(g.filter(ImageFilter.GaussianBlur(2.0)))
    d = ImageDraw.Draw(im)
    # the two stone blocks under the south end (the front legs)
    for bx in (XL + 1, XR - 15):
        d.rectangle([bx, 137, bx + 13, 150], fill=(120, 116, 110, 255), outline=OUTL)
        d.line([bx + 1, 138, bx + 12, 138], fill=(166, 162, 154, 255)); d.line([bx + 1, 144, bx + 12, 144], fill=(92, 88, 84, 255))
        d.line([bx + 6, 139, bx + 6, 143], fill=(92, 88, 84, 255)); d.rectangle([bx + 1, 149, bx + 12, 149], fill=(78, 74, 70, 255))
    # the walls seen from above: left and right thick boards (vertical grain), the back (north) end board
    plank(im, XL, YT, XL + 6, YF, (112, 74, 44), rnd, True)
    plank(im, XR - 6, YT, XR, YF, (126, 86, 50), rnd, True)
    plank(im, XL, YT, XR, YW0 - 1, (122, 82, 48), rnd, False)
    d.rectangle([XL, YT, XR, YF], outline=OUTL)
    # the water: dark inner rim, deep dark water, glints and pale reflection bands that drift per frame
    wat = Image.new("RGBA", (W, H), (0, 0, 0, 0)); wd = ImageDraw.Draw(wat)
    for y in range(YW0, YW1 + 1):
        t = (y - YW0) / (YW1 - YW0)
        wd.line([XL + 7, y, XR - 7, y], fill=mix((40, 72, 90), (84, 126, 142), t ** 1.2))
    wd.rectangle([XL + 7, YW0, XR - 7, YW0 + 3], fill=(26, 44, 56, 255))
    wd.rectangle([XL + 7, YW0, XL + 8, YW1], fill=(28, 48, 60, 255))     # the left wall's shade
    for i in range(10):
        y = (8 + i * 11 + k * 6) % (YW1 - YW0 - 10) + YW0 + 6; x = XL + 10 + (i * 7) % 14
        wd.ellipse([x, y, x + 6 + (i % 3) * 3, y + 1], fill=(120, 164, 180, 255) if (i + k) % 2 else (86, 128, 146, 255))
    for i in range(6):
        y = (14 + i * 17 + k * 9) % (YW1 - YW0 - 8) + YW0 + 5; x = XL + 10 + (i * 11) % 18
        wd.line([x, y, x + 2, y], fill=(190, 222, 232, 255))
    im.alpha_composite(wat.filter(ImageFilter.GaussianBlur(0.35)))
    d = ImageDraw.Draw(im)
    d.rectangle([XL + 6, YW0 - 1, XR - 6, YW1 + 1], outline=(30, 20, 14, 255))   # dark inner rim
    # the near (south) end face: three planks, an iron band, pegs
    for i, (y0, y1, base) in enumerate(((YW1 + 2, YW1 + 9, (138, 96, 56)), (YW1 + 10, YW1 + 16, (128, 88, 52)), (YW1 + 17, YF - 1, (116, 80, 48)))):
        plank(im, XL + 1, y0, XR - 1, y1, base, rnd, False)
        d.line([XL + 1, y1 + 1, XR - 1, y1 + 1], fill=OUTL)
    d.rectangle([XL, YW1 + 1, XR, YF], outline=OUTL)
    # iron bands over the walls (and across the end face), rivets
    for by in (30, 62, 94):
        d.rectangle([XL, by, XL + 6, by + 5], fill=(62, 60, 66, 255), outline=OUTL); d.rectangle([XR - 6, by, XR, by + 5], fill=(62, 60, 66, 255), outline=OUTL)
        d.point((XL + 3, by + 2), fill=(150, 148, 156, 255)); d.point((XR - 3, by + 2), fill=(150, 148, 156, 255))
        d.line([XL + 1, by + 1, XL + 5, by + 1], fill=(112, 110, 118, 255)); d.line([XR - 5, by + 1, XR - 1, by + 1], fill=(112, 110, 118, 255))
    d.rectangle([XL, YW1 + 5, XR, YW1 + 8], fill=(62, 60, 66, 255), outline=OUTL)
    d.line([XL + 1, YW1 + 6, XR - 1, YW1 + 6], fill=(112, 110, 118, 255))
    for px in (XL + 5, XR - 6):
        d.point((px, YW1 + 7), fill=(150, 148, 156, 255))
    return im


sheet = Image.new("RGBA", (W * 3, H * 4), (0, 0, 0, 0))
for k in range(3):
    sheet.paste(frame(k), (k * W, 0))
sheet = styl_b.grade(sheet)
sheet.save(OUT)
print(OUT, sheet.size)

# the ripples round a muzzle in the water: !$Wodopoj_Kregi.png, 3 frames of growing, fading rings (cell 48 x 48, the rings centred 8 px over the bottom)
rip = Image.new("RGBA", (48 * 3, 48 * 4), (0, 0, 0, 0))
for k in range(3):
    c = Image.new("RGBA", (48, 48), (0, 0, 0, 0)); cd = ImageDraw.Draw(c)
    for j, (rx, ry, a) in enumerate(((5 + 5 * k, 3 + 2 * k, 210 - 60 * k), (2 + 4 * k, 1 + 2 * k, 150 - 40 * k))):
        cd.ellipse([24 - rx, 40 - ry, 24 + rx, 40 + ry], outline=(176, 214, 226, max(0, a)))
    cd.point((20 + 3 * k, 38 - k), fill=(230, 245, 250, 230))
    rip.paste(c, (k * 48, 0))
rip.save(os.path.join(ROOT, "img", "characters", "!$Wodopoj_Kregi.png"))
