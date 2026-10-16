# python tools/cysterna/art.py
# PAKIET F - grafiki cysterny złożone z kafelków zestawu podziemi (Winlu Fantasy Dungeon: C - kolumna, D - kubły, E - łańcuchy),
# bez PixelLab (0 generacji). Zapis do img/characters/ (nowe pliki pakietu: !$Cysterna_*, !Cysterna_* - nazwy tylko tego pakietu).
#   !$Cysterna_Slup.png    słup miary w wodzie: 11 klatek (zapas 0, 10 ... 100) - nad wodą tyle słupa, ile wody brakuje; znaki co
#                          dziesięć, piąty i dziesiąty dłuższe, przy trzecim żelazna obręcz („łańcuch sięga do trzeciego znaku”)
#   !$Cysterna_Czerpak.png łańcuch z kubłem pod kołowrotem: klatki kubła w górze / w połowie / na końcu łańcucha, zanurzonego na
#                          poziomie wody pasa 0-2, pełnego i potrząsanego na sucho (kolejność klatek: Cysterna_Data.js LADLE_FRAMES)
#   !Cysterna_Rzeczy.png   postać 0: kamienna tablica z regułą nad czerpakiem; postać 1: zapchana rynna na Urwisku (K53)
import os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
DUN = ROOT + "img/tilesets/Winlu Fantasy Tileset - Dungeon/tilesets/Fantasy_Dungeon_"
CHARS = ROOT + "img/characters/"
T = 48


def sheet(n):
    return Image.open(DUN + n + ".png").convert("RGBA")


def tile(im, col, row, w=1, h=1):
    return im.crop((col * T, row * T, (col + w) * T, (row + h) * T))


def bbox_alpha(im):
    return im.getchannel("A").getbbox()


# ------------------------------------------------------------------------------------------------ the measuring post
WATERLINE = 134       # y of the water's surface in a 48x144 frame
SPACING = 10          # px per ten of the reserve (one mark)
CAP_H = 21


def post_frame(level, C):
    """the post as it stands out of the water at this reserve (0-100)"""
    col = tile(C, 11, 8, 1, 3)                 # round column: cap, shaft, foot
    cap = col.crop((0, 0, T, CAP_H + 3))
    line = col.crop((0, T + 20, T, T + 21))    # one row of the shaft: its shading from side to side, drawn down smooth
    frame = Image.new("RGBA", (T, 144), (0, 0, 0, 0))
    above = 100 - level                        # how much of the post (in reserve units) is above the water
    top = WATERLINE - above * SPACING // 10 - CAP_H
    # the shaft from under the cap to the waterline (a little grain of the stone)
    for y in range(top + CAP_H - 2, WATERLINE + 1):
        for x in range(T):
            r, g, b, a = line.getpixel((x, 0))
            if not a: continue
            n = ((x * 73 + y * 151) % 17) - 8
            k = 1.0 + n / 120.0
            frame.putpixel((x, y), (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)), a))
    frame.alpha_composite(cap, (0, top))
    d = ImageDraw.Draw(frame)
    # the shaft's horizontal extent (from its alpha at the shaft's height)
    row = [line.getpixel((x, 0))[3] for x in range(T)]
    xs = [x for x in range(T) if row[x] > 0]
    x0, x1 = xs[0], xs[-1]
    for k in range(1, 11):
        h = k * 10
        if h <= level: continue
        yy = WATERLINE - (h - level) * SPACING // 10
        if yy <= top + CAP_H - 1: continue
        long_ = k in (5, 10)
        a, b = (x0 + 2, x1 - 2) if long_ else (x0 + 6, x1 - 6)
        d.line([(a, yy), (b, yy)], fill=(28, 34, 38, 255), width=1)
        d.line([(a, yy + 1), (b, yy + 1)], fill=(168, 182, 176, 200), width=1)
        if long_:   # V and X: two small notches beside the long marks
            d.point([(x1 - 4, yy - 3), (x1 - 3, yy - 2), (x1 - 5, yy - 2)], fill=(28, 34, 38, 255))
        if k == 3:  # the iron band where the ladle's chain ends
            d.rectangle([x0, yy - 2, x1, yy + 2], fill=(92, 58, 40, 255))
            d.line([(x0, yy - 2), (x1, yy - 2)], fill=(150, 96, 60, 255))
            d.line([(x0, yy + 2), (x1, yy + 2)], fill=(40, 26, 20, 255))
            for xx in range(x0 + 2, x1 - 1, 5): d.point((xx, yy), fill=(176, 120, 72, 255))
    # the water: a faint shape of the post under the surface, the ripple round it
    under = Image.new("RGBA", (T, 144), (0, 0, 0, 0))
    ud = ImageDraw.Draw(under)
    ud.rectangle([x0, WATERLINE + 1, x1, WATERLINE + 8], fill=(40, 70, 86, 90))
    frame.alpha_composite(under)
    d.ellipse([x0 - 6, WATERLINE - 3, x1 + 6, WATERLINE + 4], outline=(196, 232, 240, 170), width=1)
    d.arc([x0 - 10, WATERLINE - 5, x1 + 10, WATERLINE + 7], 200, 340, fill=(160, 210, 225, 110), width=1)
    return frame


def build_post():
    C = sheet("C")
    out = Image.new("RGBA", (T * 3, 144 * 4), (0, 0, 0, 0))
    for i in range(12):
        lv = min(100, i * 10)
        f = post_frame(lv, C)
        d, p = divmod(i, 3)
        out.alpha_composite(f, (p * T, d * 144))
    return out


# ------------------------------------------------------------------------------------------------ the ladle: chain and bucket
CHAIN_TOP = 34        # the chain comes out of the windlass (its box sits in the frame's first row)
# frame -> (bucket bottom y, "empty" | "full" | "dip", swing px)
LADLE = [(74, "empty", 0), (100, "empty", 0), (158, "empty", 0),
         (84, "dip", 0), (108, "dip", 0), (156, "dip", 0),
         (74, "full", 0), (100, "full", 0), (130, "full", 0),
         (130, "empty", 0), (154, "empty", -2), (158, "empty", 2)]


def ladle_frame(bottom, state, swing, D, E):
    frame = Image.new("RGBA", (T, 192), (0, 0, 0, 0))
    chain = tile(E, 9, 0)
    cb = bbox_alpha(chain)
    chain = chain.crop((cb[0], cb[1], cb[2], cb[3]))
    bucket = tile(D, 14 if state != "empty" else 15, 15)
    bb = bbox_alpha(bucket)
    bucket = bucket.crop(bb)
    if state == "dip":
        bucket = tile(D, 15, 15).crop(bb)
    bw, bh = bucket.size
    bx = (T - bw) // 2 + swing
    by = bottom - bh
    # the chain from the windlass to the bucket's handle
    cx = (T - chain.width) // 2 + swing // 2
    y = CHAIN_TOP
    while y < by + 6:
        piece = chain.crop((0, 0, chain.width, min(chain.height, by + 6 - y)))
        frame.alpha_composite(piece, (cx, y))
        y += chain.height - 2
    frame.alpha_composite(bucket, (bx, by))
    d = ImageDraw.Draw(frame)
    if state == "dip":   # its lower part under the water: the water over it, a ring of ripples
        sub = int(bh * 0.45)
        for yy in range(bottom - sub, bottom + 1):
            for xx in range(bx, bx + bw):
                r, g, b, a = frame.getpixel((xx, yy))
                if a: frame.putpixel((xx, yy), (int(r * 0.35 + 40), int(g * 0.35 + 96), int(b * 0.35 + 120), int(a * 0.55)))
        wl = bottom - sub
        d.ellipse([bx - 5, wl - 3, bx + bw + 5, wl + 4], outline=(200, 236, 244, 190), width=1)
        d.arc([bx - 9, wl - 5, bx + bw + 9, wl + 7], 200, 340, fill=(160, 212, 226, 120), width=1)
    if state == "full":  # drops from the full bucket
        for k, (dx, dy) in enumerate([(bw // 2 - 3, 6), (bw // 2 + 4, 13), (bw // 2 - 1, 21)]):
            yy = bottom + dy
            if yy < 190: d.point([(bx + dx, yy), (bx + dx, yy + 1)], fill=(170, 220, 240, 200 - k * 40))
    return frame


def build_ladle():
    D, E = sheet("D"), sheet("E")
    out = Image.new("RGBA", (T * 3, 192 * 4), (0, 0, 0, 0))
    for i, (bottom, state, swing) in enumerate(LADLE):
        f = ladle_frame(bottom, state, swing, D, E)
        d, p = divmod(i, 3)
        out.alpha_composite(f, (p * T, d * 192))
    return out


# ------------------------------------------------------------------------------------------------ things: the tablet
def tablet():
    f = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(f)
    x0, y0, x1, y1 = 9, 14, 38, 38
    d.rectangle([x0 + 1, y0 + 1, x1 + 1, y1 + 1], fill=(14, 18, 20, 150))           # (its shadow on the wall)
    d.rectangle([x0, y0, x1, y1], fill=(132, 140, 132, 255), outline=(36, 42, 42, 255))
    d.line([(x0 + 1, y0 + 1), (x1 - 1, y0 + 1)], fill=(176, 184, 172, 255))
    d.line([(x0 + 1, y0 + 1), (x0 + 1, y1 - 1)], fill=(160, 168, 158, 255))
    # the carved lines of the rule, and a bucket on a chain carved at the top
    d.line([(23, y0 + 3), (23, y0 + 7)], fill=(52, 58, 56, 255))
    d.rectangle([20, y0 + 7, 26, y0 + 11], outline=(52, 58, 56, 255))
    for k, (a, b) in enumerate([(12, 35), (13, 33), (12, 34), (14, 30)]):
        yy = y0 + 14 + k * 3
        if yy < y1 - 1:
            for xx in range(a, b, 2):
                if (xx * 7 + k * 3) % 5: d.point((xx, yy), fill=(54, 60, 58, 255))
    return f


def clog():
    """a gutter of the Order on the Urwisko choked with fallen stones and an old nest (K53) - drawn on tileset 11's ground"""
    B = sheet("B")
    f = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    stones = B.crop((12 * T, 6 * T, 14 * T, 7 * T))
    f.alpha_composite(stones.crop((0, 0, 40, T)).resize((34, 34), Image.NEAREST), (-2, 12))
    f.alpha_composite(stones.crop((52, 0, 96, T)).resize((30, 33), Image.NEAREST), (18, 14))
    d = ImageDraw.Draw(f)
    # the nest: a ring of twigs, dark in the middle
    d.ellipse([12, 20, 36, 34], fill=(58, 40, 26, 255), outline=(30, 20, 14, 255))
    d.ellipse([16, 23, 32, 31], fill=(34, 24, 18, 255))
    for k, (a, b, c, e) in enumerate([(10, 24, 22, 20), (26, 19, 38, 26), (12, 33, 24, 36), (28, 34, 39, 30), (14, 27, 8, 31), (33, 25, 40, 22)]):
        d.line([(a, b), (c, e)], fill=(120, 86, 52, 255) if k % 2 else (96, 66, 40, 255), width=1)
    d.point([(19, 26), (27, 28), (23, 29)], fill=(220, 214, 196, 255))   # (bits of shell)
    return f


def build_things():
    out = Image.new("RGBA", (T * 12, T * 8), (0, 0, 0, 0))
    for k, im in enumerate([tablet(), clog()]):
        for d in range(4):
            for p in range(3):
                out.alpha_composite(im, ((k * 3 + p) * T, d * T))
    return out


def save(im, name):
    """(new files of the package: the names !Cysterna_* / !$Cysterna_* are the package's own - nothing of the game is overwritten)"""
    path = CHARS + name + ".png"
    im.save(path)
    return path


def main():
    print(save(build_post(), "!$Cysterna_Slup"))
    print(save(build_ladle(), "!$Cysterna_Czerpak"))
    print(save(build_things(), "!Cysterna_Rzeczy"))


if __name__ == "__main__":
    main()
