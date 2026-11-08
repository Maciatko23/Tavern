# -*- coding: utf-8 -*-
"""Szkic planszy 3x3 (gracz 2026-11-08: „na powierzchni 9 map, coś na zasadzie złączonego screena”; układ: Garnizon | Posiadłość Lorda
| Góry / Podgrodzie | Kruczogród | Łąka pod Gawrą / Przystań | Kruczy Jar | Dom dziadka; wszystkie mapy równe; „brzegi ładnie równo
zaokrąglić”). TYLKO CZYTA grę: dzisiejsze obrazy map (img/mapa_wyspy, 4 px na kratkę) wstawione w równe pola N x N kratek - co się nie
mieści, pokazane jako ucięte (czerwona linia, tylko puste skraje), czego brakuje - kreskowane (nowy teren do dorobienia); wokół
zaokrąglony brzeg wyspy. Wynik: docs/mapy/plansza_szkic.png
  python tools/mapy/plansza_szkic.py [N=104]"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 104
PX = 3                       # px a tile in the sketch
SEA = 14                     # tiles of sea round the board in the picture
R = 36                       # the island's corner radius (tiles)
INSET = 22                   # the shore line: tiles in from the board's outer edge (the player's drawing: about 1/5 of a cell)
WAVE = 4.5                   # the shore's gentle bulges in and out (tiles), a few along each side
import math
# (map, its name on the board, where its picture goes in the cell: offset of the map's (0,0) in the cell, in tiles)
BOARD = [
    [(162, "Garnizon", (0, 0)), (24, "Posiadłość Lorda", (12, 44)), (13, "Góry", (-16, 8))],
    [(111, "Podgrodzie", (2, 0)), (8, "Kruczogród (miasto)", (0, 0)), (4, "Łąka pod Gawrą", (0, 22))],
    [(125, "Przystań", (0, 0)), (3, "Kruczy Jar", (12, 0)), (20, "Dom dziadka", (0, 0))],
]
# (the pictures' places for a bigger board: every map with its built part where its neighbours meet it, new ground towards the sea)
if N >= 120:
    g = N - 120
    BOARD = [
        [(162, "Garnizon", (g + 8, g + 20)), (24, "Posiadłość Lorda", ((N - 80) // 2, N - 60)), (13, "Góry", (0, N - 96))],
        [(111, "Podgrodzie", (N - 102, 4)), (8, "Kruczogród (miasto)", ((N - 104) // 2, 0)), (4, "Łąka pod Gawrą", (0, (N - 60) // 2))],
        [(125, "Przystań", (0, 0) if N < 120 else (12, 0)), (3, "Kruczy Jar", ((N - 80) // 2, 0)), (20, "Dom dziadka", (0, 0))],
    ]
EASE = 24
# (where the shore must go further out: the built edge of a map on the outer ring - side, from, to (board tiles), tiles out)
BUMPS = [("W", N + 0, 2 * N, 12)] if N >= 120 else []   # (Podgrodzie's palisade stands 4 tiles from its west edge)
S = N * 3
W = H = (S + 2 * SEA) * PX
img = Image.new("RGBA", (W, H + 92), (24, 24, 24, 255))
pics = os.path.join(ROOT, "img", "mapa_wyspy")
sea = Image.open(os.path.join(pics, "morze.png")).convert("RGBA").resize((8 * PX, 8 * PX))
for y in range(0, H, sea.size[1]):
    for x in range(0, W, sea.size[0]): img.paste(sea, (x, y))
d = ImageDraw.Draw(img)
try:
    f = ImageFont.truetype("arialbd.ttf", 18); fs = ImageFont.truetype("arialbd.ttf", 14)
except Exception:
    f = fs = ImageFont.load_default()
def halo(xy, t, font, fill):
    for dx in (-2, -1, 0, 1, 2):
        for dy in (-2, -1, 0, 1, 2): d.text((xy[0] + dx, xy[1] + dy), t, font=font, fill=(0, 0, 0))
    d.text(xy, t, font=font, fill=fill)
cut_notes = []
for r, row in enumerate(BOARD):
    for c, (m, name, (ox, oy)) in enumerate(row):
        cx, cy = (SEA + c * N) * PX, (SEA + r * N) * PX
        cell = Image.new("RGBA", (N * PX, N * PX), (0, 0, 0, 0))
        # the new ground to make: hatched
        hd = ImageDraw.Draw(cell)
        hd.rectangle((0, 0, N * PX, N * PX), fill=(64, 92, 52, 255))
        for k in range(-N * PX, N * PX, 12): hd.line((k, N * PX, k + N * PX, 0), fill=(110, 140, 90, 255), width=2)
        p = os.path.join(pics, "%d.png" % m)
        pic = Image.open(p).convert("RGBA")
        mw, mh = pic.size[0] // 4, pic.size[1] // 4
        pic = pic.resize((mw * PX, mh * PX), Image.LANCZOS)
        cell.alpha_composite(pic, (ox * PX, oy * PX)) if ox >= 0 and oy >= 0 else cell.paste(pic, (ox * PX, oy * PX), pic)
        img.alpha_composite(cell, (cx, cy))
        lost = []
        if ox < 0: lost.append("%d kol. z zachodu" % -ox)
        if oy < 0: lost.append("%d rz. z północy" % -oy)
        if ox + mw > N: lost.append("%d kol. ze wschodu" % (ox + mw - N))
        if oy + mh > N: lost.append("%d rz. z południa" % (oy + mh - N))
        add = (N * N - max(0, min(N, ox + mw) - max(0, ox)) * max(0, min(N, oy + mh) - max(0, oy))) / (N * N)
        cut_notes.append((name, "%dx%d" % (mw, mh), ", ".join(lost) or "-", "%d%%" % round(100 * add)))
# the island's shore: everything outside a rounded square INSET tiles in from the board's edge becomes sea (drawn over the board)
# (the line: a rounded square, every point pushed out / in along its normal by a smooth wave - the player's drawing 2026-11-08)
def shore():
    a0, a1 = SEA + INSET, SEA + S - INSET
    side = a1 - a0 - 2 * R
    pts, L = [], 4 * side + 2 * math.pi * R
    def at(t):   # a point and its outward normal at the length t along the rounded square (from the top side's left end, clockwise)
        segs = [("l", a0 + R, a0, 1, 0, 0, -1), ("c", a1 - R, a0 + R, -90), ("l", a1, a0 + R, 0, 1, 1, 0), ("c", a1 - R, a1 - R, 0),
                ("l", a1 - R, a1, -1, 0, 0, 1), ("c", a0 + R, a1 - R, 90), ("l", a0, a1 - R, 0, -1, -1, 0), ("c", a0 + R, a0 + R, 180)]
        for sg in segs:
            n = side if sg[0] == "l" else math.pi * R / 2
            if t <= n:
                if sg[0] == "l": return sg[1] + sg[3] * t, sg[2] + sg[4] * t, sg[5], sg[6]
                ang = math.radians(sg[3]) + t / R
                return sg[1] + R * math.cos(ang), sg[2] + R * math.sin(ang), math.cos(ang), math.sin(ang)
            t -= n
        return at(0)
    for k in range(720):
        t = L * k / 720
        x, y, nx, ny = at(t)
        w = WAVE * (0.6 * math.sin(2 * math.pi * t / L * 9 + 0.7) + 0.4 * math.sin(2 * math.pi * t / L * 14 + 2.1))
        # (the shore goes round what is built near it: an outward bulge, eased in and out over EASE tiles)
        for (sd, lo, hi, amt) in BUMPS:
            along = (y - SEA) if sd in "WE" else (x - SEA)
            on = (sd == "W" and nx < -0.5) or (sd == "E" and nx > 0.5) or (sd == "N" and ny < -0.5) or (sd == "S" and ny > 0.5)
            if not on: continue
            k = min(1.0, max(0.0, (along - lo + EASE) / EASE), max(0.0, (hi + EASE - along) / EASE))
            w += amt * (0.5 - 0.5 * math.cos(math.pi * k))
        pts.append(((x + nx * w) * PX, (y + ny * w) * PX))
    return pts
SHORE = shore()
mask = Image.new("L", (W, H), 255)
md = ImageDraw.Draw(mask)
md.polygon(SHORE, fill=0)
seaimg = Image.new("RGBA", (W, H))
for y in range(0, H, sea.size[1]):
    for x in range(0, W, sea.size[0]): seaimg.paste(sea, (x, y))
seaimg.putalpha(mask.point(lambda v: int(v * 0.88)))
img.alpha_composite(seaimg, (0, 0))
d = ImageDraw.Draw(img)
d.line(SHORE + SHORE[:1], fill=(235, 220, 160), width=3)
for r in range(3):
    for c in range(3):
        x0, y0 = (SEA + c * N) * PX, (SEA + r * N) * PX
        d.rectangle((x0, y0, x0 + N * PX - 1, y0 + N * PX - 1), outline=(255, 255, 255), width=2)
        t = BOARD[r][c][1]; tw = d.textlength(t, font=f)
        halo((x0 + (N * PX - tw) / 2, y0 + N * PX / 2 - 10), t, f, (255, 230, 90))
halo((10, H + 8), "Plansza 3x3, każda mapa %dx%d kratek - szkic z dzisiejszych map (kreski: teren do dorobienia; brzeg wyspy zaokrąglony)" % (N, N), fs, (255, 230, 90))
for k in range(3): halo((10, H + 30 + k * 18), "   ".join("%s: utnie %s, dorobić %s" % (a, c_, e) for a, b, c_, e in cut_notes[k * 3:k * 3 + 3]), fs, (230, 230, 230))
out = os.path.join(ROOT, "docs", "mapy", "plansza_szkic.png" if N == 104 else "plansza_szkic_%d.png" % N)
img.convert("RGB").save(out, optimize=True)
print(out, img.size)
for n in cut_notes: print("  %-22s dziś %-8s utnie: %-28s dorobić: %s" % n)
