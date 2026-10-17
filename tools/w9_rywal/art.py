# -*- coding: utf-8 -*-
"""W9 rozdz. 3 „Rywal w ruinach” - grafika (bez PixelLab):

  python tools/w9_rywal/art.py            -> img/characters/!W9_Rywal.png (ślady rywala na piętrach 1-10)
                                             img/characters/$Human_Dwor*.png + anim8/Dwor_*8.png (strażnik dworu do walki)

!W9_Rywal.png - zwykły arkusz RMMZ z "!" (bez przesunięcia), 4x2 postacie po 3x4 klatki 48x48:
  postać 0: kierunek 2 = kredowe białe oko na posadzce (0: samo oko, 1: oko i strzałka w dół, 2: oko przekreślone)
            kierunek 4 = proporczyk Lorda (czarny koń na czerwieni) wbity w szczelinę posadzki (3 klatki - lekko łopocze)
            kierunek 6 = ślady butów w kurzu (0: w pionie, 1: w poziomie, 2: zadeptane)
            kierunek 8 = zwój liny (0: zwinięta, 1: z luźnym końcem, 2: ucięta)
  postać 1: kierunek 2 = posłanie (0: zwinięte, 1: rozłożone, 2: skłębione)
            kierunek 4 = linka z dzwonkami w poprzek (0: poziomo, 1: pionowo, 2: przecięta)
            kierunek 6 = worek (0: zawiązany, 1: otwarty, 2: wyrwane kartki)
            kierunek 8 = wypalone ognisko (0: popiół w kręgu kamieni - z !Decoration, przyciemnione), 1-2 to samo
Strażnik dworu: arkusze najemnika (Merc) przekolorowane na czerwień dworu Zaleskich (kaftan i tarcza), reszta bez zmian.
Plik jest powtarzalny: ten sam wynik za każdym razem (bez losowości poza stałym ziarnem).
"""
import colorsys
import os
import random
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
A8 = os.path.join(CH, "anim8")
CELL = 48
OUT = os.path.join(CH, "!W9_Rywal.png")
rng = random.Random(20261017)

OUTLINE = (34, 24, 18, 255)


def new_sheet():
    return Image.new("RGBA", (CELL * 12, CELL * 8), (0, 0, 0, 0))


def cell_origin(index, direction, pattern):
    row = {2: 0, 4: 1, 6: 2, 8: 3}[direction]
    return ((index % 4) * 3 + pattern) * CELL, ((index // 4) * 4 + row) * CELL


class Pen:
    def __init__(self, img, ox, oy):
        self.img, self.px, self.ox, self.oy = img, img.load(), ox, oy

    def put(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < CELL and 0 <= y < CELL:
            self.px[self.ox + x, self.oy + y] = c

    def get(self, x, y):
        return self.px[self.ox + x, self.oy + y]

    def blend(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if not (0 <= x < CELL and 0 <= y < CELL):
            return
        r, g, b, a = self.px[self.ox + x, self.oy + y]
        cr, cg, cb, ca = c
        if a == 0:
            self.px[self.ox + x, self.oy + y] = c
            return
        t = ca / 255.0
        self.px[self.ox + x, self.oy + y] = (round(r + (cr - r) * t), round(g + (cg - g) * t), round(b + (cb - b) * t), max(a, ca))

    def line(self, x0, y0, x1, y1, c, chalk=0.0):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / max(1, n)
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            if chalk and rng.random() < chalk:
                self.put(x, y, (c[0], c[1], c[2], 110))
            else:
                self.put(x, y, c)

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, c)

    def ellipse(self, cx, cy, rx, ry, fill=None, edge=None):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d <= 1.0:
                    inner = ((x - cx) / max(0.5, rx - 1)) ** 2 + ((y - cy) / max(0.5, ry - 1)) ** 2
                    if edge and inner > 1.0:
                        self.put(x, y, edge)
                    elif fill:
                        self.put(x, y, fill)

    def outline(self, color=OUTLINE):
        """a 1 px dark outline round everything opaque drawn in the cell (outside it)"""
        solid = [[self.get(x, y)[3] > 160 for x in range(CELL)] for y in range(CELL)]
        for y in range(CELL):
            for x in range(CELL):
                if solid[y][x] or self.get(x, y)[3] > 0:
                    continue
                if any(0 <= x + dx < CELL and 0 <= y + dy < CELL and solid[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    self.put(x, y, color)


CHALK = (234, 230, 216, 235)
CHALK_SOFT = (234, 230, 216, 90)


def chalk_eye(p, cx=24, cy=27, arrow=False, crossed=False):
    """the White Eye of the Straż Pewności drawn in chalk on the floor: an almond, the iris, five rays above"""
    w, h = 13, 6
    pts_top, pts_bot = [], []
    for i in range(-w, w + 1):
        t = i / w
        yo = h * (1 - t * t) ** 0.9
        pts_top.append((cx + i, cy - yo))
        pts_bot.append((cx + i, cy + yo * 0.85))
    for a, b in zip(pts_top, pts_top[1:]):
        p.line(a[0], a[1], b[0], b[1], CHALK, chalk=0.12)
    for a, b in zip(pts_bot, pts_bot[1:]):
        p.line(a[0], a[1], b[0], b[1], CHALK, chalk=0.12)
    # the iris: a ring and a full pupil
    for ang in range(0, 360, 12):
        import math
        x = cx + 4.2 * math.cos(math.radians(ang))
        y = cy + 4.0 * math.sin(math.radians(ang))
        p.put(x, y, CHALK if rng.random() > 0.1 else CHALK_SOFT)
    p.ellipse(cx, cy, 1.8, 1.8, fill=CHALK)
    # the rays: the eye that is "open" and sees
    for dx, top in ((-9, 4), (-5, 6), (0, 7), (5, 6), (9, 4)):
        x0, y0 = cx + dx, cy - h - 1 - (0 if abs(dx) > 6 else 1)
        p.line(x0, y0, x0 + dx * 0.25, y0 - top + 2, CHALK, chalk=0.15)
    # a smudge of chalk dust under it
    for _ in range(26):
        p.blend(cx + rng.randint(-14, 14), cy + rng.randint(-8, 9), (234, 230, 216, 40))
    if arrow:
        ay = cy + 9
        p.line(cx, ay, cx, ay + 9, CHALK, chalk=0.1)
        p.line(cx - 4, ay + 5, cx, ay + 9, CHALK, chalk=0.1)
        p.line(cx + 4, ay + 5, cx, ay + 9, CHALK, chalk=0.1)
    if crossed:
        p.line(cx - 12, cy - 9, cx + 12, cy + 8, (190, 70, 50, 230))
        p.line(cx - 12, cy + 8, cx + 12, cy - 9, (190, 70, 50, 230))


def horse(p, x0, y0, c):
    """a tiny rearing horse (the Zaleskis' arms, as on !$Lord_Sign) - 9x8 px"""
    rows = [
        "....##...",
        "...####..",
        "..##.##..",
        ".....###.",
        "..######.",
        ".#######.",
        "#..#..#..",
        "#..#...#.",
    ]
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch == "#":
                p.put(x0 + i, y0 + j, c)


def pennant(p, wave=0):
    """the Lord's pennant stuck between the floor's stones: a thin pole, a swallow-tailed red cloth with the black horse"""
    pole = (112, 78, 46, 255)
    pole_d = (74, 50, 30, 255)
    for y in range(9, 43):
        p.put(15, y, pole)
        p.put(16, y, pole_d)
    p.put(15, 8, (180, 160, 120, 255))
    p.put(16, 8, (150, 130, 95, 255))
    red, red_d, red_l = (176, 52, 36, 255), (120, 30, 24, 255), (206, 92, 56, 255)
    for x in range(17, 39):
        sh = 1 if wave and (x - 17) % 8 > 3 else 0
        top, bot = 10 + sh, 24 + sh
        mid = (top + bot) / 2.0
        for y in range(top, bot + 1):
            if x >= 32 and abs(y - mid) <= (x - 32) * 1.1:   # the swallow tail: a V cut into the free end
                continue
            c = red_l if y == top else red_d if y == bot else red
            p.put(x, y, c)
    horse(p, 21, 13 + (1 if wave else 0), (30, 20, 16, 255))
    # pebbles at its foot
    for (x, y) in ((13, 43), (17, 44), (19, 43)):
        p.ellipse(x, y, 1.6, 1.0, fill=(120, 116, 110, 255), edge=(70, 66, 62, 255))
    p.outline()


def boot(p, x, y, horiz=False, a=120):
    c = (36, 28, 22, a)
    if not horiz:
        for (dx, dy) in [(0, 0), (1, 0), (-1, 1), (0, 1), (1, 1), (2, 1), (-1, 2), (0, 2), (1, 2), (2, 2), (-1, 3), (0, 3), (1, 3), (2, 3),
                         (0, 4), (1, 4), (0, 6), (1, 6), (-1, 7), (0, 7), (1, 7), (2, 7), (0, 8), (1, 8)]:
            p.blend(x + dx, y + dy, c)
    else:
        for (dy, dx) in [(0, 0), (1, 0), (-1, 1), (0, 1), (1, 1), (2, 1), (-1, 2), (0, 2), (1, 2), (2, 2), (-1, 3), (0, 3), (1, 3), (2, 3),
                         (0, 4), (1, 4), (0, 6), (1, 6), (-1, 7), (0, 7), (1, 7), (2, 7), (0, 8), (1, 8)]:
            p.blend(x + dx, y + dy, c)


def prints(p, mode):
    if mode == 0:
        for (x, y) in ((18, 3), (26, 13), (18, 23), (26, 33)):
            boot(p, x, y)
        for (x, y) in ((14, 9), (30, 27)):
            boot(p, x, y, a=60)
    elif mode == 1:
        for (x, y) in ((3, 26), (13, 18), (23, 26), (33, 18)):
            boot(p, x, y, horiz=True)
        for (x, y) in ((8, 14), (38, 28)):
            boot(p, x, y, horiz=True, a=60)
    else:
        for _ in range(7):
            boot(p, rng.randint(6, 36), rng.randint(6, 34), horiz=rng.random() < 0.5, a=rng.randint(60, 120))
    for _ in range(18):
        p.blend(rng.randint(4, 44), rng.randint(4, 44), (36, 28, 22, 30))


def rope(p, mode):
    tan, tan_d, tan_l = (176, 140, 92, 255), (120, 90, 56, 255), (206, 176, 128, 255)
    cx, cy = 24, 33
    for k, (rx, ry) in enumerate(((11, 6), (8, 4.4), (5, 2.8))):
        import math
        for ang in range(0, 360, 4):
            x = cx + rx * math.cos(math.radians(ang))
            y = cy + ry * math.sin(math.radians(ang))
            c = tan_l if 200 < ang < 340 else tan_d if 20 < ang < 160 else tan
            p.put(x, y, c)
            if (ang // 4) % 3 == 0:
                p.put(x, y + 1, tan_d)
    if mode == 1:
        for i in range(12):
            p.put(cx + 11 + i, cy + 1 + (i % 4 > 1), tan)
            p.put(cx + 11 + i, cy + 2 + (i % 4 > 1), tan_d)
    if mode == 2:
        for i in range(6):
            p.put(cx + 11 + i, cy - i // 2, tan)
        p.put(cx + 17, cy - 3, (230, 220, 190, 255))
    p.outline()


def bedroll(p, mode):
    wool, wool_d, wool_l = (128, 64, 50, 255), (86, 42, 34, 255), (156, 92, 72, 255)
    strap = (66, 44, 28, 255)
    if mode == 0:
        p.rect(10, 27, 37, 36, wool)
        for x in range(10, 38):
            p.put(x, 27, wool_l)
            p.put(x, 36, wool_d)
        p.ellipse(10, 31.5, 2.5, 4.6, fill=wool_d)
        p.ellipse(10, 31.5, 1.2, 2.6, fill=(70, 34, 28, 255))
        for x in (17, 30):
            p.rect(x, 26, x + 1, 37, strap)
    elif mode == 1:
        p.rect(7, 24, 40, 41, wool)
        for x in range(7, 41):
            p.put(x, 24, wool_l)
            p.put(x, 41, wool_d)
        for y in range(25, 41, 5):
            for x in range(9, 39):
                if (x + y) % 9 < 5:
                    p.put(x, y, wool_d)
        p.rect(8, 25, 15, 30, (182, 170, 140, 255))   # the rolled cloak for a pillow
        for x in range(8, 16):
            p.put(x, 30, (140, 128, 100, 255))
    else:
        p.ellipse(24, 33, 14, 8, fill=wool)
        p.ellipse(20, 31, 6, 4, fill=wool_l)
        p.ellipse(29, 35, 6, 3.5, fill=wool_d)
    p.outline()


def tripwire(p, mode):
    peg, peg_d = (122, 90, 56, 255), (80, 56, 34, 255)
    cord = (170, 160, 136, 230)
    bell, bell_d = (206, 168, 72, 255), (132, 96, 36, 255)

    def bells_at(pts):
        for (x, y) in pts:
            p.ellipse(x, y + 2, 1.8, 1.8, fill=bell, edge=bell_d)
            p.put(x, y, cord)
            p.put(x, y + 4, bell_d)
    if mode == 0:
        for x in (5, 42):
            p.rect(x, 23, x + 1, 31, peg)
            p.put(x + 1, 31, peg_d)
        for x in range(7, 42):
            sag = 1 if 14 < x < 34 else 0
            p.put(x, 25 + sag, cord)
        bells_at([(17, 27), (30, 27)])
    elif mode == 1:
        for y in (5, 41):
            p.rect(22, y, 25, y + 2, peg)
        for y in range(8, 41):
            p.put(24 + (1 if 14 < y < 34 else 0), y, cord)
        bells_at([(26, 15), (26, 28)])
    else:
        for x in (5, 42):
            p.rect(x, 23, x + 1, 31, peg)
        for i in range(12):
            p.put(7 + i, 26 + i // 4, cord)
            p.put(41 - i, 27 + i // 5, cord)
        p.ellipse(22, 33, 1.8, 1.8, fill=bell, edge=bell_d)
    p.outline((40, 30, 22, 200))


def sack(p, mode):
    can, can_d, can_l = (176, 160, 122, 255), (126, 112, 82, 255), (204, 192, 156, 255)
    if mode in (0, 1):
        p.ellipse(24, 33, 9, 9, fill=can)
        p.ellipse(21, 30, 4, 4, fill=can_l)
        p.ellipse(27, 37, 5, 3, fill=can_d)
        if mode == 0:
            p.rect(22, 21, 26, 25, can)
            p.rect(21, 25, 27, 26, (90, 60, 36, 255))   # the tie
            # a white eye daubed on it
            for (x, y) in ((20, 34), (21, 33), (22, 33), (23, 33), (24, 33), (25, 33), (26, 33), (27, 34), (21, 35), (22, 35), (23, 36), (24, 36), (25, 36), (26, 35)):
                p.put(x, y, (240, 238, 228, 255))
            p.put(24, 34, (40, 34, 30, 255))
            p.put(23, 34, (40, 34, 30, 255))
        else:
            p.ellipse(24, 25, 6, 2.5, fill=can_d)
            p.rect(21, 22, 25, 25, (226, 214, 180, 255))   # a page sticking out
    else:
        for (x, y, w, h) in ((10, 26, 9, 7), (22, 30, 8, 6), (30, 22, 7, 9), (17, 36, 9, 5)):
            p.rect(x, y, x + w, y + h, (222, 210, 176, 255))
            for i in range(1, h, 2):
                p.line(x + 1, y + i, x + w - 2, y + i, (150, 136, 110, 255))
            p.put(x + w, y, (0, 0, 0, 0))
    p.outline()


def burnt_fire(img, ox, oy):
    """the cold ring of stones of !Decoration (index 1, facing 4) with its logs burnt to charcoal and ash"""
    src = Image.open(os.path.join(CH, "!Decoration.png")).convert("RGBA")
    # !Decoration's cells are 48x96 (3 frames x 4 rows a character): index 1, row 1 (facing 4), frame 0 - the bottom 48 px
    cx, cy = 1 * 144, 0 * 384 + 1 * 96
    cell = src.crop((cx, cy + 48, cx + 48, cy + 96))
    px = cell.load()
    for y in range(48):
        for x in range(48):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if s > 0.18 and 0.0 <= h * 360 <= 45:   # the logs: wood -> charcoal
                v = int(28 + l * 70)
                px[x, y] = (v, v - 3, v - 6, a)
    cell2 = cell.copy()
    p2 = cell2.load()
    for _ in range(40):
        x, y = rng.randint(16, 31), rng.randint(24, 38)
        if p2[x, y][3] > 0:
            p2[x, y] = (150, 146, 140, 255)
    img.alpha_composite(cell2, (ox, oy))


def make_props():
    img = new_sheet()
    for pat, (arrow, crossed) in enumerate(((False, False), (True, False), (False, True))):
        ox, oy = cell_origin(0, 2, pat)
        chalk_eye(Pen(img, ox, oy), arrow=arrow, crossed=crossed)
    for pat in range(3):
        ox, oy = cell_origin(0, 4, pat)
        pennant(Pen(img, ox, oy), wave=pat % 2)
    for pat in range(3):
        ox, oy = cell_origin(0, 6, pat)
        prints(Pen(img, ox, oy), pat)
    for pat in range(3):
        ox, oy = cell_origin(0, 8, pat)
        rope(Pen(img, ox, oy), pat)
    for pat in range(3):
        ox, oy = cell_origin(1, 2, pat)
        bedroll(Pen(img, ox, oy), pat)
    for pat in range(3):
        ox, oy = cell_origin(1, 4, pat)
        tripwire(Pen(img, ox, oy), pat)
    for pat in range(3):
        ox, oy = cell_origin(1, 6, pat)
        sack(Pen(img, ox, oy), pat)
    for pat in range(3):
        ox, oy = cell_origin(1, 8, pat)
        burnt_fire(img, ox, oy)
    img.save(OUT)
    return OUT


# ---------------------------------------------------------------------------------------------- the manor's guard (a recoloured mercenary)
def to_red(p):
    r, g, b, a = p
    if a == 0:
        return p
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    hd = h * 360
    if 8 <= hd <= 40 and s >= 0.18 and 0.10 <= l <= 0.40:
        rr, gg, bb = colorsys.hls_to_rgb(356 / 360, l * 1.08, min(1.0, s * 1.7 + 0.18))
        return (round(rr * 255), round(gg * 255), round(bb * 255), a)
    return p


def recolor(src, dst):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            px[x, y] = to_red(px[x, y])
    im.save(dst)
    return dst


def make_dwor():
    out = []
    for part in ("Walk8", "Atk8", "Guard8", "Kneel8", "Crouch8", "Lie8"):
        out.append(recolor(os.path.join(A8, "Merc_" + part + ".png"), os.path.join(A8, "Dwor_" + part + ".png")))
    for part in ("", "_Atk", "_Guard", "_Kneel", "_Crouch", "_Lie"):
        out.append(recolor(os.path.join(CH, "$Human_Merc" + part + ".png"), os.path.join(CH, "$Human_Dwor" + part + ".png")))
    return out


if __name__ == "__main__":
    print(make_props())
    for f in make_dwor():
        print(f)
