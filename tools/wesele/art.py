# -*- coding: utf-8 -*-
"""Grafika wesela (W18): dwa arkusze weselne (kurtka niedzielna Wojciecha, panna młoda Doroty - przekolorowane arkusze mieszkańców z
tego samego rysunku) i rekwizyty sali: romb na wieszak, wianek, szarfa, tort, płatki, świeca (zgaszona / zapalona), tablica planu.
Użycie: python tools/wesele/art.py <katalog img/characters>   (zapisuje tylko własne, nowe pliki)"""
import sys, os, colorsys, math, random
from PIL import Image, ImageDraw

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "img", "characters"))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else SRC


def hsv(c):
    return colorsys.rgb_to_hsv(*[x / 255 for x in c[:3]])


def rgb(h, s, v):
    return tuple(int(round(x * 255)) for x in colorsys.hsv_to_rgb(h % 1, max(0, min(1, s)), max(0, min(1, v))))


def groom():
    im = Image.open(os.path.join(SRC, "$Npc_Woznica.png")).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            h, s, v = hsv((r, g, b))
            h360 = h * 360
            if v < 0.02:
                continue
            if h360 < 22 and v > 0.3 and s > 0.3:      # skin stays
                continue
            if 14 <= (y % 64) <= 27 and 26 <= h360 <= 42 and s < 0.5 and v >= 0.3:   # the beard and the muffler's shade on the face: grey
                px[x, y] = rgb(0.09, 0.08, min(0.85, v * 1.45)) + (a,)
                continue
            if 22 <= h360 <= 45 and s >= 0.5 and v >= 0.5:   # scarf, gloves, buckle: a white cravat and gloves
                px[x, y] = rgb(0.11, 0.10, min(0.97, 0.55 + v * 0.45)) + (a,)
            elif 22 <= h360 <= 40 and s > 0.15:           # the coat and the hat: Sunday navy-slate
                px[x, y] = rgb(0.61, 0.38 + s * 0.15, min(1, 0.10 + v * 1.25)) + (a,)
    for col in range(3):
        ox = col * 64
        for (dx, dy, c) in [(37, 31, (215, 70, 90)), (38, 31, (240, 230, 220)), (37, 32, (240, 230, 220)), (38, 32, (215, 70, 90))]:
            if px[ox + dx, dy][3] > 10:
                px[ox + dx, dy] = c + (255,)
    return im


def head_top(px, ox, oy, cw=64):
    for y in range(cw):
        xs = [x for x in range(cw) if px[ox + x, oy + y][3] > 40]
        if xs:
            return y, min(xs), max(xs)
    return None


def bride():
    im = Image.open(os.path.join(SRC, "$Npc_Szwaczka.png")).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            h, s, v = hsv((r, g, b))
            h360 = h * 360
            if h360 >= 300 or h360 <= 6:                    # the plum dress: ivory with soft shadows
                if s > 0.25 and v > 0.2:
                    px[x, y] = rgb(0.115, 0.12 + s * 0.12, min(0.98, 0.28 + v * 1.25)) + (a,)
            elif 35 < h360 < 50 and v > 0.85 and s < 0.2:   # the apron: white
                px[x, y] = (250, 248, 240, a)
    greens, flow = [(79, 138, 60), (58, 110, 44), (96, 160, 72)], [(246, 240, 230), (240, 168, 184), (242, 209, 92)]
    for row in range(4):
        for col in range(3):
            ox, oy = col * 64, row * 64
            t = head_top(px, ox, oy)
            if not t:
                continue
            y0, x0, x1 = t
            y0 += 3
            row_w = [x for x in range(64) if px[ox + x, oy + y0 + 4][3] > 40]
            if row_w:
                x0, x1 = min(row_w) - 1, max(row_w) + 1
            n = 0
            for x in range(x0, x1 + 1):
                for yy in (y0 + 2, y0 + 3):
                    c = flow[(x // 2 + n) % 3] if (x + yy) % 4 == 0 else greens[(x + yy) % 3]
                    px[ox + x, oy + yy] = c + (255,)
                n += 1
            for x in range(x0 + 1, x1, 5):
                px[ox + x, oy + y0 + 1] = flow[(x // 5) % 3] + (255,)
    return im


def cell_sheet(draw_fn):
    """a `!$` sheet: 3 columns x 4 rows of 48 px cells; every column of a row gets the same drawing (pattern-proof)"""
    im = Image.new("RGBA", (144, 192), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            cell = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
            draw_fn(cell, r)
            im.alpha_composite(cell, (c * 48, r * 48))
    return im


def znak(cell, r):
    d = ImageDraw.Draw(cell)
    cx, cy, k = 24, 24, 13
    d.polygon([(cx, cy - k), (cx + k, cy), (cx, cy + k), (cx - k, cy)], fill=(255, 210, 63, 255), outline=(90, 61, 0, 255))
    d.polygon([(cx, cy - k + 4), (cx + k - 4, cy), (cx, cy + k - 4), (cx - k + 4, cy)], fill=(255, 232, 130, 255))
    d.polygon([(cx, cy - 4), (cx + 4, cy), (cx, cy + 4), (cx - 4, cy)], fill=(255, 210, 63, 255))


def wianek(cell, r):
    d = ImageDraw.Draw(cell)
    for i in range(36):
        a = i / 36 * math.tau
        x, y = 24 + math.cos(a) * 14, 24 + math.sin(a) * 13
        g = [(79, 138, 60), (58, 110, 44), (96, 160, 72)][i % 3]
        d.ellipse([x - 3, y - 2.5, x + 3, y + 2.5], fill=g + (255,))
    flow = [(246, 240, 230), (240, 168, 184), (242, 209, 92)]
    for i in range(9):
        a = i / 9 * math.tau + 0.2
        x, y = 24 + math.cos(a) * 14, 24 + math.sin(a) * 13
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=flow[i % 3] + (255,))
        d.point((int(x), int(y)), fill=(250, 220, 90, 255))
    d.polygon([(21, 37), (24, 40), (27, 37), (28, 44), (24, 41), (20, 44)], fill=(184, 64, 58, 255))
    d.rectangle([22, 36, 26, 38], fill=(210, 80, 70, 255))
    d.rectangle([23, 6, 25, 8], fill=(90, 70, 50, 255))


def szarfa(cell, r):
    d = ImageDraw.Draw(cell)
    red, hi, sh, gold = (196, 64, 58, 255), (232, 120, 108, 255), (132, 38, 40, 255), (230, 180, 70, 255)
    for x in range(5, 44):
        y = 10 + int(9 * (1 - ((x - 24) / 19.5) ** 2))
        d.rectangle([x, y, x, y + 4], fill=red)
        d.point((x, y), fill=hi)
        d.point((x, y + 1), fill=hi)
        d.point((x, y + 4), fill=sh)
    d.polygon([(20, 24), (28, 24), (31, 44), (24, 40), (17, 44)], fill=red, outline=sh)
    d.line([(24, 27), (24, 40)], fill=hi)
    d.rectangle([20, 19, 28, 25], fill=gold, outline=(150, 108, 30, 255))
    d.rectangle([22, 21, 26, 23], fill=red)
    for x in (4, 44):
        d.rectangle([x - 1, 8, x + 1, 11], fill=gold)


def tort(cell, r):
    d = ImageDraw.Draw(cell)
    d.ellipse([6, 36, 42, 46], fill=(216, 208, 192, 255), outline=(150, 140, 120, 255))
    for (x0, y0, x1, y1, c) in [(10, 28, 38, 40, (243, 229, 195, 255)), (14, 19, 34, 29, (246, 234, 204, 255)), (18, 11, 30, 20, (250, 240, 215, 255))]:
        d.rectangle([x0, y0, x1, y1], fill=c, outline=(176, 150, 110, 255))
        d.line([(x0 + 1, y0 + 2), (x1 - 1, y0 + 2)], fill=(238, 168, 186, 255))
    for x in range(12, 38, 4):
        d.point((x, 33), fill=(238, 168, 186, 255))
        d.point((x + 1, 36), fill=(238, 168, 186, 255))
    for (x, y) in [(20, 9), (24, 8), (28, 9), (22, 10), (26, 10)]:
        d.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(59, 63, 143, 255))
    d.rectangle([23, 3, 25, 8], fill=(240, 230, 215, 255))
    d.rectangle([22, 2, 26, 3], fill=(215, 70, 90, 255))


def platki(cell, r):
    d = ImageDraw.Draw(cell)
    rnd = random.Random(7)
    for i in range(16):
        x, y = rnd.randint(6, 40), rnd.randint(26, 44)
        c = [(240, 168, 184, 255), (246, 236, 230, 255), (232, 140, 160, 255)][i % 3]
        d.ellipse([x - 2, y - 1, x + 2, y + 1], fill=c)
        d.point((x, y), fill=(255, 255, 255, 255))


def swieca(cell, r):
    d = ImageDraw.Draw(cell)
    lit = r == 1
    d.rectangle([20, 42, 28, 44], fill=(140, 110, 50, 255))
    d.rectangle([22, 40, 26, 42], fill=(176, 140, 62, 255))
    d.rectangle([21, 26, 27, 40], fill=(242, 232, 205, 255), outline=(190, 172, 130, 255))
    d.line([(24, 22), (24, 26)], fill=(40, 30, 20, 255))
    d.line([(26, 28), (26, 36)], fill=(255, 250, 235, 255))
    if lit:
        d.ellipse([21, 14, 27, 24], fill=(255, 190, 70, 255))
        d.ellipse([22, 17, 26, 23], fill=(255, 235, 140, 255))
        d.point((24, 15), fill=(255, 150, 50, 255))


def tablica(cell, r):
    d = ImageDraw.Draw(cell)
    d.rectangle([9, 18, 12, 46], fill=(92, 64, 36, 255))
    d.rectangle([35, 18, 38, 46], fill=(92, 64, 36, 255))
    d.rectangle([4, 6, 43, 30], fill=(107, 74, 42, 255), outline=(60, 40, 22, 255))
    d.rectangle([7, 9, 40, 27], fill=(231, 218, 182, 255), outline=(150, 128, 90, 255))
    for i in range(4):
        x = 10 + i * 8
        d.rectangle([x, 14, x + 5, 19], fill=(122, 82, 48, 255))
        d.point((x - 1, 22), fill=(60, 40, 22, 255))
        d.point((x + 6, 22), fill=(60, 40, 22, 255))
        d.point((x + 2, 23), fill=(60, 40, 22, 255))
    d.line([(10, 11), (22, 11)], fill=(60, 40, 22, 255))
    d.rectangle([21, 25, 27, 29], fill=(255, 210, 63, 255))


def preview(path):
    sheet = Image.new("RGBA", (1500, 440), (70, 60, 52, 255))
    x = 10
    for n in ["$Npc_PanMlody", "$Npc_PannaMloda"]:
        im = Image.open(os.path.join(OUT, n + ".png"))
        sheet.alpha_composite(im.crop((64, 0, 128, 64)).resize((192, 192), Image.NEAREST), (x, 10))
        sheet.alpha_composite(im.crop((64, 64, 128, 128)).resize((192, 192), Image.NEAREST), (x, 210))
        x += 200
    for n in ["Znak", "Wianek", "Szarfa", "Tort", "Platki", "Tablica"]:
        im = Image.open(os.path.join(OUT, "!$Wesele_%s.png" % n))
        sheet.alpha_composite(im.crop((48, 0, 96, 48)).resize((144, 144), Image.NEAREST), (x, 10))
        x += 150
    im = Image.open(os.path.join(OUT, "!$Wesele_Swieca.png"))
    sheet.alpha_composite(im.crop((48, 0, 96, 48)).resize((144, 144), Image.NEAREST), (420, 260))
    sheet.alpha_composite(im.crop((48, 48, 96, 96)).resize((144, 144), Image.NEAREST), (580, 260))
    sheet.save(path)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    groom().save(os.path.join(OUT, "$Npc_PanMlody.png"))
    bride().save(os.path.join(OUT, "$Npc_PannaMloda.png"))
    for name, fn in [("Znak", znak), ("Wianek", wianek), ("Szarfa", szarfa), ("Tort", tort), ("Platki", platki), ("Swieca", swieca), ("Tablica", tablica)]:
        cell_sheet(fn).save(os.path.join(OUT, "!$Wesele_%s.png" % name))
    if len(sys.argv) > 2:
        preview(sys.argv[2])
    print("OK ->", OUT)
