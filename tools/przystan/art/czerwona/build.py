# python tools/przystan/art/czerwona/build.py - the red water's pictures (2026-10-15, PixelLab Pro Flash, 15 generations; the raws in raw/):
#   img/system/RedWater_Fish_0.png   a dead herring on the ground (style: the game's ground mushroom), cropped, a soft shadow under it
#   img/system/RedWater_Fish_1.png   a dead cod belly up with a rust smear
#   img/characters/!$Przystan_Tabliczka.png   the customs' warning sign (a crossed-out fish skeleton, the officer's wax seal) on a post,
#                                             one MZ single-character sheet: 3 x 4 cells of 48 x 96, all the same (a still object)
# Byte-identical rebuilds (PIL only).
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
RAW = os.path.join(HERE, "raw")


def fish(src, dst):
    im = Image.open(os.path.join(RAW, src)).convert("RGBA")
    x0, y0, x1, y1 = im.getbbox()
    im = im.crop((x0, y0, x1, y1))
    w, h = im.size
    out = Image.new("RGBA", (w + 2, h + 3), (0, 0, 0, 0))
    # a soft shadow: the fish's own shape, dark and faint, one pixel left and two down (the ground things' light from the upper right)
    a = im.split()[3].point(lambda v: 60 if v > 40 else 0)
    shadow = Image.new("RGBA", im.size, (20, 14, 10, 0))
    shadow.putalpha(a)
    out.alpha_composite(shadow, (0, 3))
    out.alpha_composite(im, (1, 0))
    out.save(os.path.join(ROOT, "img", "system", dst), optimize=False)
    return out.size


def sign():
    im = Image.open(os.path.join(RAW, "sign.png")).convert("RGBA")
    assert im.size == (48, 96)
    sheet = Image.new("RGBA", (144, 384), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            sheet.alpha_composite(im, (c * 48, r * 96))
    sheet.save(os.path.join(ROOT, "img", "characters", "!$Przystan_Tabliczka.png"), optimize=False)


if __name__ == "__main__":
    print("RedWater_Fish_0", fish("fish_herring.png", "RedWater_Fish_0.png"))
    print("RedWater_Fish_1", fish("fish_cod.png", "RedWater_Fish_1.png"))
    sign()
    print("!$Przystan_Tabliczka 144x384")
