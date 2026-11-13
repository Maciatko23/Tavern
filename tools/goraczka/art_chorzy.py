# -*- coding: utf-8 -*-
"""Chorzy w łóżkach przytułku (W21): 6 arkuszy !$Chory_<klucz>.png, 48x144 (jedna komórka szeroka, trzy wysokie = łóżko z kafli Map202: głowa, tułów, nogi).
Głowa to wycinek z arkusza postaci (ten sam wygląd co na mapie), lekko blada i z rumieńcem gorączki, na poduszce; reszta pod szarozielonym kocem z łatą.
   python tools/goraczka/art_chorzy.py   -> tools/goraczka/art/!$Chory_*.png + podglad (x3)"""
import os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
OUT = os.path.join(HERE, "art")
PATIENTS = {"szymek": "$Npc_Zlodziej", "stas": "$Npc_Dziecko", "gawel": "$Npc_Zebrak", "mila": "$Npc_Dziecko", "rufin": "$Npc_Weteran", "berta": "$Npc_Praczka"}
BLANKET = {"szymek": (104, 112, 100), "stas": (118, 104, 96), "gawel": (96, 100, 106), "mila": (122, 110, 100), "rufin": (100, 108, 96), "berta": (110, 100, 108)}
PATCH = {"szymek": (150, 112, 70), "stas": (110, 130, 150), "gawel": (140, 90, 70), "mila": (150, 130, 80), "rufin": (120, 140, 110), "berta": (150, 100, 90)}
SCALE = {"stas": 0.8, "mila": 0.75}


def head_of(sheet, scale):
    im = Image.open(os.path.join(CH, sheet + ".png")).convert("RGBA")
    cell = im.crop((64, 0, 128, 64))          # standing, facing down
    bb = cell.getbbox()
    fig = cell.crop(bb)
    h = max(18, min(fig.height, 28)) if scale >= 1 else 24
    head = fig.crop((0, 0, fig.width, min(fig.height, 26)))
    # pale, fevered: 22% towards a grey-green, cheeks warm
    px = head.load()
    for y in range(head.height):
        for x in range(head.width):
            r, g, b, a = px[x, y]
            if a < 10: continue
            r = int(r * 0.78 + 205 * 0.22); g = int(g * 0.78 + 215 * 0.22); b = int(b * 0.78 + 195 * 0.22)
            px[x, y] = (r, g, b, a)
    if scale < 1:
        head = head.resize((max(8, int(head.width * scale)), max(8, int(head.height * scale))), Image.NEAREST)
    return head


def draw(key):
    W, H = 48, 144
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    base = BLANKET[key]; dark = tuple(max(0, c - 26) for c in base); light = tuple(min(255, c + 18) for c in base); out = (38, 30, 26, 255)
    # pillow (the head's cell, y 0..47)
    d.rounded_rectangle((6, 14, 41, 44), 6, fill=(214, 204, 178, 255), outline=out)
    d.rectangle((9, 17, 38, 18), fill=(236, 228, 206, 255))
    head = head_of(PATIENTS[key], SCALE.get(key, 1))
    hx = (W - head.width) // 2; hy = 40 - head.height + 2
    im.alpha_composite(head, (hx, hy))
    # the blanket: from the shoulders (y 44) to the feet (y 136), a ridge over the body, a fold at the chest, a patch
    top = 46
    d.rounded_rectangle((4, top, 43, 138), 5, fill=base + (255,), outline=out)
    d.rectangle((5, top + 1, 42, top + 4), fill=light + (255,))                        # turned-down edge
    d.rectangle((5, top + 5, 42, top + 6), fill=dark + (255,))
    for yy in (top + 26, top + 52, top + 74):                                          # folds
        d.line((8, yy, 40, yy + 2), fill=dark + (255,))
    d.rectangle((26, top + 34, 36, top + 44), fill=PATCH[key] + (255,), outline=dark + (255,))
    d.line((26, top + 39, 36, top + 39), fill=dark + (255,))
    d.ellipse((12, top + 80, 36, top + 92), fill=dark + (255,))                        # the feet under the cover
    d.ellipse((13, top + 78, 35, top + 88), fill=base + (255,))
    # shoulders / hands
    d.ellipse((2, top - 1, 14, top + 9), fill=base + (255,), outline=out)
    d.ellipse((33, top - 1, 45, top + 9), fill=base + (255,), outline=out)
    # a bead of sweat by the head
    d.rectangle((hx + head.width + 1, hy + 8, hx + head.width + 2, hy + 10), fill=(160, 200, 230, 255))
    return im


def sheet3x4(im):
    """a `$` character sheet is 3 x 4 cells (patterns x directions): the same picture in every cell, so any pattern or direction shows it"""
    w, h = im.size
    out = Image.new("RGBA", (w * 3, h * 4), (0, 0, 0, 0))
    for cx in range(3):
        for cy in range(4): out.alpha_composite(im, (cx * w, cy * h))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    sheet = Image.new("RGBA", (len(PATIENTS) * 60, 150), (50, 44, 38, 255))
    for i, k in enumerate(PATIENTS):
        im = draw(k); sheet3x4(im).save(os.path.join(OUT, "!$Chory_%s.png" % k)); sheet.alpha_composite(im, (i * 60 + 6, 3))
    sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST).save(os.path.join(HERE, "podglad_chorzy.png"))
    print("ok", len(PATIENTS))



def przykryty():
    """a covered sleeper: the blanket drawn up over the head (the dead Gaweł)"""
    W, H = 48, 144
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    out = (38, 30, 26, 255); base = (96, 100, 106); dark = (70, 74, 80); light = (114, 118, 124)
    d.rounded_rectangle((6, 14, 41, 44), 6, fill=(214, 204, 178, 255), outline=out)
    d.rounded_rectangle((4, 18, 43, 138), 5, fill=base + (255,), outline=out)
    d.ellipse((14, 18, 33, 40), fill=light + (255,), outline=dark + (255,))      # the head under the cloth
    for yy in (60, 86, 112):
        d.line((8, yy, 40, yy + 2), fill=dark + (255,))
    d.rectangle((5, 44, 42, 46), fill=dark + (255,))
    return im


def osad():
    """a stone gutter of the old mason's ditch crossing the cell, a worn grate and the white crust of lime on its rim: 48x48 (no black outline: it lies in the street)"""
    import random
    im = Image.new("RGBA", (48, 48), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    rim_hi, rim_lo, inner, deep = (150, 146, 138, 255), (104, 100, 98, 255), (52, 50, 56, 255), (34, 33, 40, 255)
    d.rectangle((0, 17, 47, 21), fill=rim_hi); d.rectangle((0, 22, 47, 23), fill=rim_lo)       # the near rim, lit
    d.rectangle((0, 24, 47, 33), fill=inner); d.rectangle((0, 28, 47, 33), fill=deep)          # the channel
    d.rectangle((0, 34, 47, 36), fill=rim_lo); d.rectangle((0, 37, 47, 38), fill=(88, 86, 86, 255))
    for x in range(4, 46, 8): d.rectangle((x, 24, x + 2, 33), fill=(92, 90, 96, 255))         # grate bars
    rnd = random.Random(11)
    for _ in range(34):                                                                       # lime: pale crust on both rims and in the channel
        x = rnd.randint(0, 44); y = rnd.choice([17, 18, 19, 20, 21, 23, 34, 35, 36, 26, 29]); r = rnd.randint(1, 4)
        d.ellipse((x, y, x + r + 1, y + max(1, r // 2) + 1), fill=rnd.choice([(238, 234, 220, 255), (222, 218, 204, 255), (204, 200, 186, 255)]))
    return im


def plyta():
    """a stone slab with an iron ring, a lid on the ditch behind the tannery: 48x48"""
    im = Image.new("RGBA", (48, 48), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    out = (30, 28, 30, 255)
    d.rounded_rectangle((3, 10, 44, 42), 3, fill=(112, 112, 108, 255), outline=out)
    d.rectangle((5, 12, 42, 14), fill=(138, 138, 132, 255))
    d.line((24, 14, 24, 40), fill=(84, 84, 80, 255)); d.line((5, 27, 42, 27), fill=(84, 84, 80, 255))
    d.ellipse((20, 23, 28, 31), outline=(60, 50, 44, 255), width=2)                  # the iron ring
    for (x, y) in ((8, 33), (36, 17), (30, 36)): d.ellipse((x, y, x + 4, y + 3), fill=(226, 222, 208, 255))   # lime
    return im


def extra():
    sheet3x4(przykryty()).save(os.path.join(OUT, "!$Chory_przykryty.png"))
    sheet3x4(osad()).save(os.path.join(OUT, "!$Osad_Rynny.png"))
    sheet3x4(plyta()).save(os.path.join(OUT, "!$Plyta_Rowu.png"))


if __name__ == "__main__":
    main()
    extra()
