# python tools/latarnia/art/build_tower2x.py [--out DIR]
# Wieza latarni w podwojnym rozmiarze (2026-10-29): klatka 288x512 (6 x 10,7 pola), rysowana w kodzie od nowa drobnym pikselem 1x
# (NIE rozciagnieta): kamienne ciegly z losowym ukladem, kopula z lupkow, galeryjka z barierka, szyby, drzwi z lukiem.
# Zapisuje img/characters/!$Latarnia_Wieza.png (arkusz 3x4 tych samych klatek) i img/system/Latarnia_Szyby.png (maska szyb),
# oraz tools/latarnia/art/art.json (miary ognia dla Latarnia_Data.js). Z --out DIR: tylko podglad jednej klatki.
import os, sys, json, random, math
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
W, H = 288, 512
CX = 144
FOOT = 506
OUT = (11, 9, 8, 255)
rnd = random.Random(2910)
im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
px = im.load()


def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = c if len(c) == 4 else (c[0], c[1], c[2], 255)


def shade(c, k):
    return (max(0, min(255, int(c[0] * k))), max(0, min(255, int(c[1] * k))), max(0, min(255, int(c[2] * k))), 255)


STONES = [(134, 118, 106), (129, 114, 102), (124, 108, 98), (116, 101, 92), (108, 94, 86), (102, 88, 81), (97, 84, 77)]
MORTAR = (42, 39, 39)
SHAFT_TOP, SHAFT_BOT_STRAIGHT = 244, 372


def half_at(y):
    if y < SHAFT_BOT_STRAIGHT:
        return 55 + (y - SHAFT_TOP) * 6.0 / (SHAFT_BOT_STRAIGHT - SHAFT_TOP)
    t = (y - SHAFT_BOT_STRAIGHT) / (FOOT - SHAFT_BOT_STRAIGHT)
    return 61 + 31 * (t ** 1.35)


def courses(y0, y1, hmin, hmax):
    out, y = [], y0
    while y < y1:
        h = rnd.randint(hmin, hmax)
        if y + h > y1 - 5:
            h = y1 - y
        out.append((y, y + h))
        y += h
    return out


def draw_wall(y0, y1, hfn, hmin, hmax, wmin, wmax, jag=0, base=1.0):
    for (a, b) in courses(y0, y1, hmin, hmax):
        hj = rnd.randint(-jag, jag) if jag else 0
        x = CX - int(hfn(b - 1) + 6) - rnd.randint(0, wmax)
        stones = []
        while x < CX + hfn(b - 1) + 8:
            w = rnd.randint(wmin, wmax)
            stones.append((x, x + w, rnd.choice(STONES), rnd.uniform(0.94, 1.06)))
            x += w
        for y in range(a, b):
            hh = hfn(y) + hj
            for (s0, s1, col, kk) in stones:
                for x in range(max(s0, int(CX - hh)), min(s1, int(CX + hh))):
                    nx = (x - CX) / max(1.0, hh)
                    k = base * kk * (1.06 - 0.30 * (nx + 1) / 2 * (0.6 + 0.4 * nx * nx))
                    c = shade(col, k)
                    dy = y - a
                    if dy == 0:
                        c = shade(MORTAR, 1.0)
                    elif dy == 1:
                        c = shade(col, k * 1.16)
                    elif y == b - 1:
                        c = shade(col, k * 0.78)
                    if x == s0:
                        c = shade(MORTAR, 1.0)
                    elif x == s0 + 1 and dy > 1:
                        c = shade(col, k * 1.1)
                    elif x == s1 - 1:
                        c = shade(col, k * 0.8)
                    if rnd.random() < 0.05:
                        c = shade(c, rnd.choice((0.88, 1.1)))
                    put(x, y, c)


def outline_silhouette():
    src = im.copy()
    sp = src.load()
    for y in range(H):
        for x in range(W):
            if sp[x, y][3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < W and 0 <= yy < H and sp[xx, yy][3] > 0:
                        px[x, y] = OUT
                        break


draw_wall(SHAFT_TOP, SHAFT_BOT_STRAIGHT, half_at, 13, 17, 22, 38, jag=0)
draw_wall(SHAFT_BOT_STRAIGHT, FOOT + 1, half_at, 15, 20, 24, 40, jag=3, base=0.97)

# corbel band under the deck
for y in range(222, SHAFT_TOP + 1):
    hh = 64 - (y - 222) * 0.25
    for x in range(int(CX - hh), int(CX + hh)):
        nx = (x - CX) / hh
        col = STONES[(x // 18 + y // 9) % 3]
        c = shade(col, 1.05 - 0.28 * (nx + 1) / 2)
        if (x + 3) % 18 in (0, 1) and y > 230:
            c = shade(MORTAR, 1)
        if y == 222:
            c = shade(MORTAR, 1)
        if y > 238 and (x + 3) % 18 > 1:
            c = shade(c, 0.85 - 0.04 * (y - 238))
        put(x, y, c)


def ledge(y, extra, top_h, face_h, joint=22):
    """a projecting stone band: the top face seen from above (lighter, wider strip) over its front face"""
    for i in range(top_h + face_h):
        yy = y + i
        hh = half_at(yy) + extra + (0 if i >= top_h else (top_h - i) * 0.0)
        for x in range(int(CX - hh), int(CX + hh) + 1):
            nx = (x - CX) / hh
            k = 1.08 - 0.30 * (nx + 1) / 2
            if i < top_h:
                c = shade((166, 149, 132), k * (1.08 - 0.06 * i))
                if i == 0:
                    c = shade((196, 179, 156), k)
                if (x - CX + 200) % joint == 0 and i > 0:
                    c = shade(MORTAR, 1)
            else:
                c = shade(STONES[3], k * 0.92)
                if i == top_h:
                    c = shade(MORTAR, 1)
                if (x - CX + 200 + 11) % joint == 0:
                    c = shade(MORTAR, 1)
                if i == top_h + face_h - 1:
                    c = shade(MORTAR, 1)
            put(x, yy, c)


ledge(314, 5, 5, 6)
ledge(384, 7, 6, 6, 26)


def deck():
    """the gallery's floor seen from above: slabs in rows, a rounded back edge, a stone lip at the front"""
    y0, y1, lip = 190, 216, 222
    for y in range(y0, lip):
        t = (y - y0) / float(lip - y0)
        hh = 66 + 8 * t
        row = (y - y0) // 9
        for x in range(int(CX - hh), int(CX + hh) + 1):
            nx = (x - CX) / hh
            k = 1.1 - 0.28 * (nx + 1) / 2
            if y < y1:
                c = shade((166, 149, 132), k * (0.92 + 0.1 * ((x // 17 + row) % 3) / 2.0))
                if (y - y0) % 9 == 0:
                    c = shade((110, 96, 88), 1)
                if (x + (row % 2) * 8) % 17 == 0:
                    c = shade((110, 96, 88), 1)
                if y == y0:
                    c = shade((196, 179, 156), 1)
            else:
                c = shade(STONES[1], k * 0.95)
                if y == y1:
                    c = shade((196, 179, 156), k)
                elif y == lip - 1:
                    c = shade(MORTAR, 1)
                elif (x + 5) % 26 == 0:
                    c = shade(MORTAR, 1)
            put(x, y, c)


deck()


def window(cy):
    fw, fh = 13, 22
    for y in range(cy - fh, cy + fh + 4):
        for x in range(CX - fw, CX + fw + 1):
            dx = abs(x - CX)
            top = cy - fh + (3 if dx > 8 else 0) + (3 if dx > 11 else 0) + (1 if dx > 5 else 0)
            if y < top:
                continue
            if y > cy + fh - 3:
                if y <= cy + fh + 3 and dx <= fw + 2:
                    put(x, y, shade((148, 132, 118), 1.0 - 0.15 * (y - cy - fh + 3) / 6.0))
                continue
            put(x, y, shade((148, 132, 118), 1.05 - 0.1 * (x - CX + fw) / (2 * fw)))
    ow = 7
    for y in range(cy - fh + 7, cy + fh - 2):
        for x in range(CX - ow, CX + ow + 1):
            dx = abs(x - CX)
            if y < cy - fh + 7 + (4 if dx > 5 else 0) + (2 if dx > 3 else 0):
                continue
            put(x, y, (5, 2, 1) if y > cy - fh + 9 else (19, 14, 13))
    for x in range(CX - fw - 2, CX + fw + 3):
        put(x, cy + fh + 3, MORTAR)
    for y in range(cy - fh + 12, cy + fh - 2):
        put(CX - ow, y, (26, 23, 23))


window(284)
window(350)


def door():
    top = 402
    R_out, R_in = 38, 26
    cyc = top + R_out
    for y in range(top - 2, FOOT + 1):
        for x in range(CX - R_out, CX + R_out + 1):
            dx = x - CX
            if y < cyc:
                d = math.hypot(dx, y - cyc)
                if d > R_out or d < R_in:
                    continue
                ang = math.atan2(y - cyc, dx)
                seg = int((ang + math.pi) / (math.pi / 9))
                k = 1.0 - 0.18 * (dx + R_out) / (2 * R_out)
                c = shade(STONES[seg % 3] if seg % 2 else (166, 149, 132), k * (1.1 if seg % 2 == 0 else 0.95))
                a2 = (ang + math.pi) / (math.pi / 9)
                if abs(a2 - round(a2)) * d * math.pi / 9 < 0.9:
                    c = shade(MORTAR, 1)
                put(x, y, c)
            else:
                if R_in <= abs(dx) <= R_out:
                    k = 1.0 - 0.18 * (dx + R_out) / (2 * R_out)
                    blk = (y - cyc) // 16
                    c = shade(STONES[blk % 4] if blk % 2 else (166, 149, 132), k)
                    if (y - cyc) % 16 == 0 or abs(dx) == R_in:
                        c = shade(MORTAR, 1)
                    put(x, y, c)
    for y in range(top + (R_out - R_in) - 2, FOOT + 1):
        for x in range(CX - R_in + 1, CX + R_in):
            dx = x - CX
            if y < cyc and math.hypot(dx, y - cyc) > R_in - 1:
                continue
            plank = (x - (CX - R_in)) // 9
            base = [(96, 56, 38), (84, 48, 33), (96, 56, 38), (72, 38, 26), (84, 48, 33), (96, 56, 38)][plank % 6]
            c = shade(base, 1.0 - 0.25 * (dx + R_in) / (2 * R_in))
            if (x - (CX - R_in)) % 9 == 0:
                c = shade((46, 22, 16), 1)
            if rnd.random() < 0.07:
                c = shade(c, 0.85)
            put(x, y, c)
    for sy in (cyc + 14, cyc + 52):
        for y in range(sy, sy + 7):
            for x in range(CX - R_in + 1, CX + R_in):
                c = (34, 31, 31) if y not in (sy, sy + 6) else (19, 14, 13)
                if (x - CX) % 11 == 0 and y == sy + 3:
                    c = (82, 87, 93)
                put(x, y, c)
    for ang in range(0, 360, 12):
        put(CX + 12 + int(round(5 * math.cos(math.radians(ang)))), cyc + 38 + int(round(5 * math.sin(math.radians(ang)))), (52, 53, 55))
    put(CX + 12, cyc + 33, (110, 123, 131))


door()

GLASS = [(138, 156, 168), (160, 180, 192), (200, 214, 222)]


def lantern():
    top, bot, hh = 146, 198, 43
    for y in range(bot - 6, bot + 1):
        for x in range(CX - hh - 2, CX + hh + 3):
            put(x, y, (34, 31, 31) if y not in (bot - 6, bot) else (19, 14, 13))
    for y in range(top, bot - 6):
        for x in range(CX - hh, CX + hh + 1):
            dx = x - CX
            t = (y - top) / (bot - 6 - top)
            c = GLASS[1] if (abs(dx) // 6 + (y // 5)) % 7 else GLASS[0]
            k = 1.05 - 0.16 * (dx + hh) / (2 * hh)
            c = shade(c, k * (1.05 - 0.12 * t))
            if (x - (CX - hh)) % 14 in (3, 4) and y < bot - 12:
                c = shade(GLASS[2], k)
            put(x, y, c)
    for i in range(6):
        mx = CX - hh + i * (2 * hh) // 5
        for y in range(top, bot - 6):
            for x in (mx - 1, mx, mx + 1):
                put(x, y, (34, 31, 31) if x != mx - 1 else (52, 53, 55))
            put(mx + 2, y, (11, 9, 8))
    for y in range(158, 184):
        for x in range(CX - 18, CX + 19):
            tt = (y - 158) / 25.0
            half = 18 - 5 * tt
            if abs(x - CX) > half:
                continue
            edge = abs(x - CX) > half - 2 or y in (158, 159, 183)
            grid = (x - CX) % 6 == 0 or (y - 158) % 6 == 0
            if edge:
                put(x, y, (19, 14, 13) if y > 159 else (52, 53, 55))
            elif grid:
                put(x, y, (52, 53, 55))
            else:
                put(x, y, shade((34, 31, 31), 0.8 + 0.2 * tt))
    for y in range(146, 164):
        put(CX - hh + 6 + (y - 146) // 3, y, (230, 236, 238))
        put(CX - hh + 7 + (y - 146) // 3, y, (230, 236, 238))


lantern()


def railing():
    ytop, ybot = 196, 218
    hw = 70
    for rail in (ytop + 1, ybot - 2):
        for x in range(CX - hw, CX + hw + 1):
            for y in (rail, rail + 1, rail + 2):
                put(x, y, (52, 53, 55) if y == rail else (34, 31, 31) if y == rail + 1 else (19, 14, 13))
    for x in range(CX - hw, CX + hw + 1, 14):
        for y in range(ytop + 3, ybot):
            put(x, y, (34, 31, 31))
            put(x + 1, y, (19, 14, 13))
    for x in (CX - hw, CX + hw - 1):
        for y in range(ytop - 8, ybot + 1):
            put(x, y, (34, 31, 31))
            put(x + 1, y, (19, 14, 13))
        for yy in range(ytop - 12, ytop - 7):
            for xx in range(x - 1, x + 3):
                put(xx, yy, (52, 53, 55) if yy == ytop - 12 else (34, 31, 31))


railing()

SLATE = [(52, 53, 55), (66, 69, 74), (82, 87, 93), (42, 39, 39)]


def roof():
    """a cone seen from ~45 deg above: the lateral surface as nested rings (front arcs), slate scales along them, a dark eave"""
    apex, cy, rx, ry = 80, 124, 58, 17
    steps = 1600
    for i in range(steps + 1):
        sn = i / float(steps)
        rr, ey = rx * sn, ry * sn
        cyy = apex + (cy - apex) * sn
        row = int(sn * 11)
        for x in range(int(CX - rr), int(CX + rr) + 1):
            dx = x - CX
            q = max(-1.0, min(1.0, dx / max(1.0, rr)))
            y = int(round(cyy + ey * math.sqrt(1 - q * q)))
            ang = math.asin(q)
            col = int(ang * sn * rx / 7.0 + 100 + (row % 2) * 0.5)
            k = 1.18 - 0.55 * (q + 1) / 2
            c = shade(SLATE[(col * 5 + row * 3) % 3], k)
            frac = sn * 11 - row
            if frac > 0.86:
                c = shade(SLATE[3], 1)
            elif frac < 0.12:
                c = shade(SLATE[2], k * 1.1)
            elif abs((ang * sn * rx / 7.0 + 100 + (row % 2) * 0.5) - round(ang * sn * rx / 7.0 + 100 + (row % 2) * 0.5)) < 0.08:
                c = shade(SLATE[3], 1)
            put(x, y, c)
            if y + 1 < H and px[x, y + 1][3] == 0:
                put(x, y + 1, c)
    # the eave: a dark stone ring around the cone's foot, its top seen from above
    for t in range(-ry, ry + 1):
        pass
    for dx in range(-rx - 1, rx + 2):
        q = max(-1.0, min(1.0, dx / float(rx + 1)))
        yb = int(round(cy + (ry + 2) * math.sqrt(1 - q * q)))
        th = 3 + int(round(5 * math.sqrt(1 - q * q)))
        for y in range(yb, yb + th):
            c = shade((42, 39, 39), 1.25 - 0.55 * (q + 1) / 2)
            if y == yb:
                c = shade((82, 87, 93), 1.0 - 0.3 * (q + 1) / 2)
            if y == yb + th - 1:
                c = (19, 14, 13, 255)
            put(CX + dx, y, c)


roof()


def vane():
    for y in range(36, 82):
        put(CX - 1, y, (52, 53, 55))
        put(CX, y, (34, 31, 31))
        put(CX + 1, y, (11, 9, 8))
    for y in range(26, 36):
        put(CX, y, (34, 31, 31))
    for x in range(CX - 7, CX + 8):
        put(x, 31, (34, 31, 31))
    for x in range(CX - 20, CX + 21):
        put(x, 44, (34, 31, 31))
    for dy in range(-3, 4):
        put(CX + 21 - abs(dy), 44 + dy, (52, 53, 55))
        put(CX - 21 + abs(dy), 44 + dy, (52, 53, 55))


vane()
outline_silhouette()

if "--out" in sys.argv:
    out = sys.argv[sys.argv.index("--out") + 1]
    os.makedirs(out, exist_ok=True)
    im.save(os.path.join(out, "wieza_2x_klatka.png"))
    sys.exit(0)

sheet = Image.new("RGBA", (W * 3, H * 4), (0, 0, 0, 0))
for r in range(4):
    for c in range(3):
        sheet.alpha_composite(im, (c * W, r * H))
sheet.save(os.path.join(ROOT, "img", "characters", "!$Latarnia_Wieza.png"))
glass = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gp = glass.load()
n = 0
for y in range(138, 192):
    for x in range(CX - 44, CX + 45):
        r, g, b, a = px[x, y]
        if a > 200 and b > 115 and b >= r + 6 and (r + g + b) > 330:
            k = min(1.0, ((r + g + b) - 330) / 300.0 + 0.45)
            gp[x, y] = (255, int(186 + 40 * k), int(96 + 50 * k), int(255 * k))
            n += 1
glass.save(os.path.join(ROOT, "img", "system", "Latarnia_Szyby.png"))
art = json.load(open(os.path.join(HERE, "art.json"), encoding="utf8"))
art["tower"] = {"cell": [W, H], "fire": {"x": 0, "y": H - 158}, "glassPixels": n, "foot": FOOT, "note": "2x (2026-10-29), build_tower2x.py"}
json.dump(art, open(os.path.join(HERE, "art.json"), "w", encoding="utf8"), indent=1)
print("ok", n)
