# -*- coding: utf-8 -*-
"""Grafika kopalni (docs/questy_mapa/PLAN.md 4a): arkusz kafli z torami (E tilesetu "Kopalnia: Dungeon z torami"), wagonik
(z klatek Winlu !wagon), przód wagonika dla jeźdźca, wejście do sztolni, szyb na Orlej Grani, tory na Map013.
Kolory z arkusza C zestawu Dungeon (szyny: stal 131,146,163 / 150,165,180 / 74,83,92; drewno 119,92,78 / 105,79,71 / 58,46,46).
Ostre piksele (bez wygładzania). Wszystko do tools/kopalnia/staging/img/ - nic nie nadpisuje istniejących obrazów.
  python tools/kopalnia/art.py            rysuje
"""
import os, sys, math, random
from PIL import Image, ImageDraw, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "staging", "img")
CH = os.path.join(OUT, "characters")
TS = os.path.join(OUT, "tilesets", "Kopalnia")
DUNGEON = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Dungeon")
T = 48
SS = 8          # supersampling of the masks (then a hard threshold: no smoothing)

STEEL_HI, STEEL, STEEL_MID, STEEL_LO, STEEL_DK = (150, 165, 180), (131, 146, 163), (123, 137, 152), (74, 83, 92), (46, 52, 58)
WOOD_HI, WOOD, WOOD_LO, WOOD_DK = (119, 92, 78), (105, 79, 71), (90, 68, 68), (58, 46, 46)
SHADE = (22, 20, 32, 105)

GAUGE = 9           # rail centre line = tile centre +- GAUGE
RAIL_W = 5
SLEEP_W = 6


def mask_from(draw_fn):
    im = Image.new("L", (T * SS, T * SS), 0)
    draw_fn(ImageDraw.Draw(im), SS)
    im = im.resize((T, T), Image.BOX)
    return im.point(lambda v: 255 if v >= 128 else 0)


def rect(d, s, x0, y0, x1, y1):
    d.rectangle([int(x0 * s), int(y0 * s), int(x1 * s) - 1, int(y1 * s) - 1], fill=255)


def arc_poly(d, s, cx, cy, r0, r1, a0, a1, n=24):
    pts = [(cx + r1 * math.cos(a0 + (a1 - a0) * i / n), cy + r1 * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    pts += [(cx + r0 * math.cos(a1 - (a1 - a0) * i / n), cy + r0 * math.sin(a1 - (a1 - a0) * i / n)) for i in range(n + 1)]
    d.polygon([(x * s, y * s) for x, y in pts], fill=255)


def radial_bar(d, s, cx, cy, ang, r0, r1, w):
    ux, uy = math.cos(ang), math.sin(ang)
    px, py = -uy, ux
    pts = [(cx + ux * r0 + px * w / 2, cy + uy * r0 + py * w / 2), (cx + ux * r1 + px * w / 2, cy + uy * r1 + py * w / 2),
           (cx + ux * r1 - px * w / 2, cy + uy * r1 - py * w / 2), (cx + ux * r0 - px * w / 2, cy + uy * r0 - py * w / 2)]
    d.polygon([(x * s, y * s) for x, y in pts], fill=255)


def lighter(a, b): return ImageChops.lighter(a, b)
def transpose(m): return m.transpose(Image.TRANSPOSE)


# ------------------------------------------------------------------------------------------------ the pieces as masks
def straight_h():
    c = T // 2
    def rails(d, s):
        for y in (c - GAUGE, c + GAUGE): rect(d, s, 0, y - RAIL_W / 2, T, y + RAIL_W / 2)
    def sleepers(d, s):
        for sx in (4, 20, 36): rect(d, s, sx, c - GAUGE - 6, sx + SLEEP_W, c + GAUGE + 6)
    return mask_from(rails), mask_from(sleepers)


def corner(cx, cy, a0, a1):
    """a quarter turn round the tile corner (cx, cy) between the angles a0..a1"""
    c = T // 2
    def rails(d, s):
        for r in (c - GAUGE, c + GAUGE): arc_poly(d, s, cx, cy, r - RAIL_W / 2, r + RAIL_W / 2, a0, a1)
    def sleepers(d, s):
        for k in (22.7, 67.3): radial_bar(d, s, cx, cy, a0 + math.radians(k), c - GAUGE - 6, c + GAUGE + 6, SLEEP_W)
    return mask_from(rails), mask_from(sleepers)


def junction():
    """W-E straight with a branch curving off to the north (a turnout)"""
    Rh, Sh = straight_h()
    Rc, Sc = corner(0, 0, 0, math.pi / 2)
    return lighter(Rh, Rc), lighter(Sh, Sc)


def buffer_w():
    """rails ending at x 9 (the beam: x 3..9), sleepers shifted: a buffer stop on the west end"""
    c = T // 2
    def rails(d, s):
        for y in (c - GAUGE, c + GAUGE): rect(d, s, 9, y - RAIL_W / 2, T, y + RAIL_W / 2)
    def sleepers(d, s):
        for sx in (12, 20, 36): rect(d, s, sx, c - GAUGE - 6, sx + SLEEP_W, c + GAUGE + 6)
    return mask_from(rails), mask_from(sleepers)


def colour(R, S, wood_seed=1):
    """the picture of one tile from the rail mask R and the sleeper mask S"""
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    px = im.load()
    r, s = R.load(), S.load()
    rnd = random.Random(wood_seed)
    on = lambda m, x, y: 0 <= x < T and 0 <= y < T and m[x, y] > 0
    for y in range(T):
        for x in range(T):
            if on(s, x, y):
                up, lf, dn, rt = on(s, x, y - 1), on(s, x - 1, y), on(s, x, y + 1), on(s, x + 1, y)
                if not dn: c = WOOD_DK
                elif not rt: c = WOOD_LO
                elif not up or not lf: c = WOOD_HI
                else: c = WOOD if rnd.random() > 0.12 else WOOD_LO
                px[x, y] = c + (255,)
    shade = []
    for y in range(T):
        for x in range(T):
            if on(r, x, y): continue
            if on(r, x, y - 1) or on(r, x - 1, y) or on(r, x - 1, y - 1): shade.append((x, y, 1))
            elif not on(s, x, y) and (on(s, x, y - 1) or on(s, x - 1, y)): shade.append((x, y, 0))
    for x, y, strong in shade:
        if px[x, y][3] == 0: px[x, y] = SHADE
        elif strong: px[x, y] = WOOD_DK + (255,)
    for y in range(T):
        for x in range(T):
            if on(r, x, y):
                up, lf, dn, rt = on(r, x, y - 1), on(r, x - 1, y), on(r, x, y + 1), on(r, x + 1, y)
                if not dn or not rt: c = STEEL_LO
                elif not up or not lf: c = STEEL_HI
                else: c = STEEL if (x + y) % 7 else STEEL_MID
                px[x, y] = c + (255,)
    return im


def buffer_beam(im):
    """the beam of a buffer stop on the west end, drawn on the tile picture"""
    px = im.load()
    c = T // 2
    for y in range(c - GAUGE - 8, c + GAUGE + 9):
        for x in range(3, 10):
            if x == 3 or y in (c - GAUGE - 8, c + GAUGE + 8): col = WOOD_DK
            elif x == 4: col = WOOD_HI
            elif x == 9: col = WOOD_LO
            else: col = WOOD
            px[x, y] = col + (255,)
    for y in (c - GAUGE, c + GAUGE):
        for x in range(3, 10):
            px[x, y - 1] = STEEL_HI + (255,); px[x, y] = STEEL + (255,); px[x, y + 1] = STEEL_LO + (255,)
        px[6, y] = STEEL_DK + (255,)
    for y in range(c - GAUGE - 6, c + GAUGE + 7):
        if px[10, y][3] == 0: px[10, y] = SHADE
    return im


def rot(im, side):
    return {"W": im, "E": im.transpose(Image.FLIP_LEFT_RIGHT), "N": im.transpose(Image.TRANSPOSE),
            "S": im.transpose(Image.TRANSPOSE).transpose(Image.FLIP_TOP_BOTTOM)}[side]


def tiles():
    out = {}
    Rh, Sh = straight_h()
    out["H"] = colour(Rh, Sh, 1)
    out["V"] = colour(transpose(Rh), transpose(Sh), 2)
    out["ES"] = colour(*corner(T, T, math.pi, 1.5 * math.pi), 3)        # connects east and south
    out["WS"] = colour(*corner(0, T, 1.5 * math.pi, 2 * math.pi), 4)
    out["EN"] = colour(*corner(T, 0, 0.5 * math.pi, math.pi), 5)
    out["WN"] = colour(*corner(0, 0, 0, 0.5 * math.pi), 6)
    out["J"] = colour(*junction(), 7)                                   # W-E with a branch north
    bw = buffer_beam(colour(*buffer_w(), 8))
    for side in "WENS": out["B" + side] = rot(bw, side)
    br = Rh.copy(); ImageDraw.Draw(br).rectangle([14, 11, 33, 19], fill=0)           # a rail missing, a sleeper snapped
    sb = Sh.copy(); d = ImageDraw.Draw(sb); d.rectangle([20, 8, 26, 40], fill=0); d.rectangle([20, 8, 26, 22], fill=255)
    out["HX"] = colour(br, sb, 9)
    out["VX"] = colour(transpose(br), transpose(sb), 10)
    return out


LAYOUT = {   # name -> (col, row) in the E sheet (16 x 16 tiles)
    "H": (0, 0), "V": (1, 0), "EN": (2, 0), "WN": (3, 0), "ES": (4, 0), "WS": (5, 0), "J": (6, 0),
    "BW": (7, 0), "BE": (8, 0), "BN": (9, 0), "BS": (10, 0), "HX": (11, 0), "VX": (12, 0),
}


def tile_sheet():
    sheet = Image.new("RGBA", (16 * T, 16 * T), (0, 0, 0, 0))
    for name, im in tiles().items():
        c, r = LAYOUT[name]
        sheet.paste(im, (c * T, r * T))
    return sheet


# ------------------------------------------------------------------------------------------------ the cart
CART_CUT = {0: 79, 1: 66, 2: 66, 3: 73}       # where the front wall's rim begins in a 48 x 96 frame (rows: down, left, right, up)


def wheel(px, cx, cy, ph):
    for dx, dy, col in ((-2, -1, STEEL_DK), (-1, -1, STEEL_DK), (0, -1, STEEL_DK), (1, -1, STEEL_DK), (2, -1, STEEL_DK),
                        (-2, 0, STEEL_DK), (-1, 0, STEEL_LO), (0, 0, STEEL_LO), (1, 0, STEEL_LO), (2, 0, STEEL_DK),
                        (-1, 1, STEEL_DK), (0, 1, STEEL_DK), (1, 1, STEEL_DK)):
        px[cx + dx, cy + dy] = col + (255,)
    sx, sy = ((-1, 0), (1, 0), (0, 1))[ph % 3]
    px[cx + sx, cy + sy] = STEEL_HI + (255,)


def cart_sheets():
    src = Image.open(os.path.join(DUNGEON, "characters", "!wagon.png")).convert("RGBA")
    body = Image.new("RGBA", (3 * 48, 4 * 96), (0, 0, 0, 0))
    rim = Image.new("RGBA", (3 * 48, 4 * 96), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            f = src.crop((c * 48, r * 96, c * 48 + 48, r * 96 + 96))
            x0, y0, x1, y1 = f.getbbox()
            fr = Image.new("RGBA", (48, 96), (0, 0, 0, 0))
            lift = 5 + (1 if c == 1 else 0)
            fr.alpha_composite(f.crop((x0, y0, x1, y1)), (x0, y0 - lift))
            px = fr.load()
            by = y1 - lift
            xs = (x0 + 6, x1 - 7) if r in (1, 2) else (x0 + 4, x1 - 5)
            for k, wx in enumerate(xs): wheel(px, wx, by + 1, c + k)
            body.paste(fr, (c * 48, r * 96))
            cut = CART_CUT[r]
            ov = Image.new("RGBA", (48, 96), (0, 0, 0, 0))
            ov.alpha_composite(fr.crop((0, cut, 48, 96)), (0, cut))
            rim.paste(ov, (c * 48, r * 96))
    return body, rim


# ------------------------------------------------------------------------------------------------ pictures
def still(im, cols=3, rows=4):
    w, h = im.size
    sheet = Image.new("RGBA", (cols * w, rows * h), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(cols): sheet.paste(im, (c * w, r * h))
    return sheet


def mouth_sheet():
    """!$Kopalnia_Wejscie: the timbered mouth of the game's own quarry art (!$Mt_Cave) with rails coming out of the dark"""
    base = Image.open(os.path.join(ROOT, "img", "characters", "!$Mt_Cave.png")).convert("RGBA").crop((0, 0, 96, 96))
    strip = tiles()["V"].crop((0, 0, 48, 36))
    base.alpha_composite(strip, (24, 60))
    return still(base)


def track_sheet():
    """!$Kopalnia_Tor: single rail pieces as pictures (Map013 has no rail tile sheet): frames 48 x 48, (direction, pattern):
    (2,0) V  (2,1) H  (2,2) WN | (4,0) EN  (4,1) ES  (4,2) WS | (6,0) buffer N  (6,1) buffer W  (6,2) buffer E | (8,0) buffer S"""
    t = tiles()
    order = {(2, 0): "V", (2, 1): "H", (2, 2): "WN", (4, 0): "EN", (4, 1): "ES", (4, 2): "WS", (6, 0): "BN", (6, 1): "BW", (6, 2): "BE", (8, 0): "BS"}
    sheet = Image.new("RGBA", (3 * 48, 4 * 48), (0, 0, 0, 0))
    for (d, p), name in order.items():
        sheet.paste(t[name], (p * 48, ((d - 2) // 2) * 48))
    return sheet


def shaft_sheet():
    """!$Kopalnia_Szyb (Orla Grań): the head of a stair-well in the ground, 3 x 2 cells (144 x 96): a timber collar, stone steps
    going down to the south into the dark. A still picture (the sheet is 3 x 4 frames of 144 x 96)."""
    W, H = 144, 96
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = im.load()
    rnd = random.Random(5)
    for y in range(8, 92):
        for x in range(12, 132): px[x, y] = (22, 20, 32, 255)
    stone = [(140, 150, 160), (118, 129, 141), (96, 106, 117), (79, 88, 98), (62, 70, 80), (48, 55, 64), (36, 42, 50)]
    y = 10
    for i in range(7):
        h = 10 if i < 5 else 12
        x0, x1 = 16 + i * 2, 128 - i * 2
        for yy in range(y, min(y + h, 90)):
            for xx in range(x0, x1):
                tread = (yy - y) < h - 4
                base = stone[i]
                col = base if tread else tuple(int(v * 0.62) for v in base)
                if tread and yy == y: col = tuple(min(255, int(v * 1.12)) for v in base)
                if tread and rnd.random() < 0.05: col = tuple(int(v * 0.88) for v in col)
                px[xx, yy] = col + (255,)
        y += h
    def wood(x0, y0, x1, y1, horizontal):
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                a = (yy - y0) if horizontal else (xx - x0)
                n = (y1 - y0) if horizontal else (x1 - x0)
                col = WOOD_HI if a == 0 else WOOD_DK if a == n - 1 else WOOD_LO if a >= n - 3 else WOOD
                if rnd.random() < 0.10: col = WOOD_LO
                px[xx, yy] = col + (255,)
    wood(2, 0, 142, 8, True)
    wood(2, 8, 12, 92, False)
    wood(132, 8, 142, 92, False)
    wood(2, 90, 142, 96, True)
    for x in (4, 40, 76, 112, 136): px[x, 3] = STEEL_DK + (255,)
    return still(im)


def main():
    for d in (CH, TS): os.makedirs(d, exist_ok=True)
    tile_sheet().save(os.path.join(TS, "Kopalnia_E.png"))
    body, rim = cart_sheets()
    body.save(os.path.join(CH, "!$Kopalnia_Wagonik.png"))
    rim.save(os.path.join(CH, "!$Kopalnia_Wagonik_Przod.png"))
    mouth_sheet().save(os.path.join(CH, "!$Kopalnia_Wejscie.png"))
    track_sheet().save(os.path.join(CH, "!$Kopalnia_Tor.png"))
    shaft_sheet().save(os.path.join(CH, "!$Kopalnia_Szyb.png"))
    print("ok ->", OUT)


if __name__ == "__main__":
    main()
