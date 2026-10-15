"""Prom (384 x 168) złożony w kodzie z kadłuba kutra (PixelLab) i drobiazgów z Fantasy_Outside_C (Winlu).

Kroki:
 1. kuter bez olinowania (maszt nad burtą, żagiel, liny, latarnia) -> sam kadłub,
 2. kadłub rozciągnięty w poziomie (najbliższy sąsiad, deski biegną poziomo, więc szwów nie widać),
 3. daleka burta podniesiona o DECK px, szczelina wypełniona pokładem z desek wzdłuż,
 4. nadbudówka na rufie (ściana z pionowych desek, drzwi, okienko, dach z góry),
 5. maszt (pień z kutra, wydłużony), zwinięty żagiel na rei (z kutra), liny wantowe i cumy,
 6. ładunek: skrzynie, worki, beczka z Outside_C w natywnej skali + zwój liny z kutra.
Wynik: raw/prom_collage.png (RGBA 384 x 168). Uruchamiany przez build_objects.py albo sam.
"""
import os
import random
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
OUTSIDE_C = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior",
                         "tilesets", "Fantasy_Outside_C.png")

W, H = 384, 168
SX = 1.70          # rozciągnięcie kadłuba w poziomie
DECK = 26          # o ile wyżej idzie daleka burta (głębszy pokład)
MAST_UP = 34       # o ile wyższy maszt niż w kutrze

OUT = (56, 45, 47)
ROPE = (128, 98, 66)
ROPE_D = (78, 58, 44)


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def rim_top(kut):
    """Górna krawędź dalekiej burty kutra dla każdej kolumny (y), bez masztu i żagla."""
    px = kut.load()
    w, h = kut.size
    top = {}
    for x in range(w):
        col = [y for y in range(36, 56) if px[x, y][3] > 0 and (y == 0 or px[x, y - 1][3] == 0)]
        if col:
            top[x] = col[-1] if len(col) > 1 and col[-1] < 50 else col[0]
    return top


def hull_only(kut):
    """Kadłub kutra bez olinowania: wszystko nad dalszą burtą znika, maszt przy burcie zasłonięty."""
    w, h = kut.size
    px = kut.load()
    out = kut.copy()
    op = out.load()
    # linia dalekiej burty zmierzona na powiększeniu: od dziobu (x10,y43) ~ y41 w środku do y46 przy rufie
    def rim(x):
        if x < 30:
            return 41 + (30 - x) // 10
        if x < 100:
            return 40 + (x - 30) * 2 // 70
        return 42 + (x - 100) * 4 // 105
    for x in range(w):
        for y in range(0, min(h, rim(x))):
            op[x, y] = (0, 0, 0, 0)
    # latarnia i jej słupek za rufą (x >= 210)
    for x in range(208, w):
        for y in range(0, h):
            if x >= 211:
                op[x, y] = (0, 0, 0, 0)
    # podstawa masztu (x 66-78, od burty do dna) -> kolumny obok (x 54-66 przesunięte)
    for x in range(66, 79):
        for y in range(rim(x), 72):
            op[x, y] = px[x - 13, y] if px[x - 13, y][3] else op[x, y]
    return out


def stretch_x(img, sx):
    w, h = img.size
    nw = int(round(w * sx))
    out = Image.new("RGBA", (nw, h), (0, 0, 0, 0))
    sp, op = img.load(), out.load()
    for x in range(nw):
        s = min(w - 1, int(x / sx))
        for y in range(h):
            op[x, y] = sp[s, y]
    return out


def deck_texture(w, h, seed=4):
    """Pokład z desek biegnących wzdłuż: pasy 4 px, 3 tony, ciemne fugi, styki desek co 22-46 px."""
    rnd = random.Random(seed)
    tones = [(124, 98, 74), (112, 88, 66), (134, 107, 80)]
    seam = (92, 72, 58)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    y = 0
    row = 0
    while y < h:
        th = 4
        base = tones[row % 3]
        x = -rnd.randint(0, 30)
        while x < w:
            L = rnd.randint(44, 96)
            t = rnd.choice(tones) if rnd.random() < 0.2 else base
            for xx in range(max(0, x), min(w, x + L)):
                for yy in range(y, min(h, y + th)):
                    c = t
                    if yy == y + th - 1:
                        c = seam
                    elif yy == y and rnd.random() < 0.5:
                        c = tuple(min(255, v + 10) for v in t)
                    elif rnd.random() < 0.06:
                        c = tuple(max(0, v - 9) for v in t)
                    px[xx, yy] = c + (255,)
            if 0 <= x + L - 1 < w:
                for yy in range(y, min(h, y + th - 1)):
                    px[x + L - 1, yy] = seam + (255,)
            x += L
        y += th
        row += 1
    # cień pod daleką burtą (górne 3 rzędy ciemniejsze)
    for yy in range(min(3, h)):
        f = 0.72 + 0.09 * yy
        for xx in range(w):
            r, g, b, a = px[xx, yy]
            px[xx, yy] = (int(r * f), int(g * f), int(b * f), a)
    return img


def paste_deck(hull, deck_rows, taper=44):
    """Podnosi daleką burtę o DECK px (przy dziobie mniej: łagodny wznios) i wypełnia szczelinę pokładem."""
    w, h = hull.size
    out = Image.new("RGBA", (w, h + DECK), (0, 0, 0, 0))
    hp = hull.load()
    tex = deck_texture(w, DECK + 6)
    tp = tex.load()
    op = out.load()
    cols = [x for x in range(w) if any(hp[x, y][3] for y in range(h))]
    x_first = cols[0] if cols else 0
    for x in range(w):
        ys = [y for y in range(h) if hp[x, y][3] > 0]
        if not ys:
            continue
        lift = int(round(DECK * min(1.0, (x - x_first) / float(taper))))
        top = ys[0]
        cut = top + 6
        for y in range(h):
            c = hp[x, y]
            if c[3] == 0:
                continue
            if y < cut:
                op[x, y + DECK - lift] = c
            else:
                op[x, y + DECK] = c
        for k in range(lift):
            yy = cut + DECK - lift + k
            if ys[-1] - top > 14:
                op[x, yy] = tp[x, DECK - lift + k]
            else:
                op[x, yy] = hp[x, cut - 1] if hp[x, cut - 1][3] else (0, 0, 0, 0)
    return out


def outline_rect(px, x0, y0, x1, y1, c=OUT):
    for x in range(x0, x1):
        px[x, y0] = c + (255,)
        px[x, y1 - 1] = c + (255,)
    for y in range(y0, y1):
        px[x0, y] = c + (255,)
        px[x1 - 1, y] = c + (255,)


def cabin(w=66, wall=24, roof=20, seed=9):
    """Niska nadbudówka: dach widziany z góry (deski w poprzek), ściana przednia z pionowych desek, drzwi, okienko."""
    rnd = random.Random(seed)
    img = Image.new("RGBA", (w, roof + wall), (0, 0, 0, 0))
    px = img.load()
    roof_t = [(98, 78, 64), (90, 71, 58), (106, 85, 69)]
    for x in range(w):
        t = roof_t[(x // 5) % 3]
        for y in range(roof):
            c = t
            if x % 5 == 4:
                c = (66, 52, 48)
            elif y < 2:
                c = tuple(min(255, v + 18) for v in t)
            elif rnd.random() < 0.05:
                c = tuple(max(0, v - 8) for v in t)
            px[x, y] = c + (255,)
    # okap: jaśniejsza listwa na przedniej krawędzi dachu
    for x in range(w):
        px[x, roof - 3] = (150, 122, 92, 255)
        px[x, roof - 2] = (128, 102, 78, 255)
        px[x, roof - 1] = (70, 55, 49, 255)
    wall_t = [(132, 104, 78), (120, 94, 70)]
    for x in range(w):
        t = wall_t[(x // 4) % 2]
        for y in range(roof, roof + wall):
            c = t
            if x % 4 == 3:
                c = (84, 64, 52)
            elif y < roof + 3:
                c = tuple(int(v * 0.72) for v in t)   # cień pod okapem
            elif rnd.random() < 0.05:
                c = tuple(max(0, v - 10) for v in t)
            px[x, y] = c + (255,)
    # drzwi
    dx0, dx1 = w // 2 - 8, w // 2 + 6
    for x in range(dx0, dx1):
        for y in range(roof + 5, roof + wall):
            px[x, y] = ((74, 56, 46) if (x - dx0) % 5 == 4 else (96, 72, 56)) + (255,)
    outline_rect(px, dx0 - 1, roof + 4, dx1 + 1, roof + wall)
    px[dx1 - 3, roof + 14] = (196, 170, 120, 255)  # klamka
    # okienko
    wx0 = 8
    for x in range(wx0, wx0 + 9):
        for y in range(roof + 7, roof + 14):
            px[x, y] = (40, 34, 40, 255)
    outline_rect(px, wx0 - 1, roof + 6, wx0 + 10, roof + 15, (140, 112, 84))
    px[wx0 + 4, roof + 8] = (70, 74, 86, 255)
    # obwódka całości
    for x in range(w):
        px[x, 0] = OUT + (255,)
        px[x, roof + wall - 1] = OUT + (255,)
    for y in range(roof + wall):
        px[0, y] = OUT + (255,)
        px[w - 1, y] = OUT + (255,)
    return img


def line(px, x0, y0, x1, y1, c, w, h):
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    pts = []
    while True:
        pts.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    for (x, y) in pts:
        if 0 <= x < w and 0 <= y < h:
            px[x, y] = c + (255,)
    return pts


def rope(px, a, b, w, h):
    pts = line(px, a[0], a[1], b[0], b[1], ROPE, w, h)
    for (x, y) in pts:
        if 0 <= x < w and 0 <= y + 1 < h and px[x, y + 1][3] == 0:
            px[x, y + 1] = ROPE_D + (255,)


def strip_thin(img, run=4):
    """Usuwa cienkie linie (liny) z wycinka: piksele w pionowym ciągu krótszym niż run."""
    w, h = img.size
    px = img.load()
    keep = []
    for x in range(w):
        y = 0
        while y < h:
            if px[x, y][3] == 0:
                y += 1
                continue
            y0 = y
            while y < h and px[x, y][3] > 0:
                y += 1
            if y - y0 < run:
                keep.extend((x, yy) for yy in range(y0, y))
    for (x, y) in keep:
        px[x, y] = (0, 0, 0, 0)
    for x in range(w):
        for y in range(h):
            c = px[x, y]
            if c[3] and lum(c) > 222:
                px[x, y] = (0, 0, 0, 0)
    return img


def crop(img, box):
    c = img.crop(box)
    bb = c.getbbox()
    return c.crop(bb) if bb else c


def build(kuter_path, out_path):
    kut = Image.open(kuter_path).convert("RGBA")
    C = Image.open(OUTSIDE_C).convert("RGBA")

    # --- 1-3: kadłub
    hull = hull_only(kut).crop((8, 36, 212, 104))       # 204 x 68
    hull = stretch_x(hull, SX)                           # ~347 x 68
    hull = paste_deck(hull, DECK)                        # ~347 x 86
    hull = hull.crop(hull.getbbox())
    hw, hh = hull.size

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hx = (W - hw) // 2 - 6
    hy = H - hh - 2
    canvas.alpha_composite(hull, (hx, hy))

    # --- 5: maszt + reja ze zwiniętym żaglem (z kutra, natywnie)
    mast = stretch_x(kut.crop((67, 2, 78, 70)), 1.5)     # pień z obręczą, grubszy
    sail = strip_thin(kut.crop((76, 14, 200, 41)))       # zwinięty żagiel na bomie, bez lin
    sail = stretch_x(sail, 1.45)
    mx = hx + int((72 - 8) * SX) - 5
    deck_y = hy + 18
    mast_top = 8
    mp = canvas.load()
    # pień: górna część z obręczą + przedłużenie powtórzonym wierszem
    m = mast.load()
    mh = mast.size[1]
    total = (deck_y + 30) - mast_top
    for y in range(total):
        sy = y if y < 46 else 46 + (y - 46) % 8
        sy = min(sy, mh - 1)
        for x in range(mast.size[0]):
            c = m[x, sy]
            if c[3]:
                mp[mx + x, mast_top + y] = c
    # liny wantowe: od szczytu masztu do dziobu i rufy
    top = (mx + mast.size[0] // 2, mast_top + 3)
    hpx = hull.load()
    def topmost(x):
        for y in range(hh):
            if hpx[x, y][3]:
                return y
        return hh
    bx = 2
    bow = (hx + bx, hy + topmost(bx))
    stern = (hx + hw - 8, hy + topmost(hw - 8))
    rope(mp, top, bow, W, H)
    rope(mp, top, stern, W, H)
    # proporczyk w neutralnym kolorze (spłowiała ochra) na szczycie masztu, powiewa w prawo
    pen = ["OO..............",
           "OLLOO...........",
           "OLLLLLOO........",
           "OMLLLLLLLOO.....",
           "OMMMLLLLLLLLOO..",
           "OMMMMMMMDDOO....",
           "ODDDDDOO........",
           "OO.............."]
    pal = {"O": OUT, "L": (206, 176, 112), "M": (180, 150, 92), "D": (146, 118, 74)}
    px0, py0 = mx + mast.size[0] - 2, mast_top - 3
    for yy, row in enumerate(pen):
        for xx, ch in enumerate(row):
            if ch != "." and 0 <= py0 + yy < H:
                mp[px0 + xx, py0 + yy] = pal[ch] + (255,)
    # żagiel na rei (nad pokładem)
    canvas.alpha_composite(sail, (mx + mast.size[0] - 4, mast_top + 18))

    # --- 4: nadbudówka na rufie
    cab = cabin()
    cx = hx + hw - cab.size[0] - 30
    cy = hy + 6
    # cień nadbudówki na pokładzie (w prawo-dół)
    sh = Image.new("RGBA", cab.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 90), (0, 0, cab.size[0], cab.size[1]), cab.split()[3])
    canvas.alpha_composite(sh, (cx + 5, cy + 3))
    canvas.alpha_composite(cab, (cx, cy))

    # --- 6: ładunek (natywna skala Winlu), cienie Winlu (0,0,0,100) zostają z kafelka
    crate_closed = crop(C, (336, 206, 386, 272))
    crate_small = crop(C, (288, 404, 336, 462))
    sacks = crop(C, (240, 508, 338, 556))
    sack = crop(C, (262, 420, 292, 450))
    barrel = crop(C, (194, 398, 238, 458))
    kcrate = kut.crop((119, 50, 142, 74))
    items = [
        (crate_closed, hx + 150, hy + 6),
        (crate_small, hx + 196, hy + 18),
        (sacks, hx + 48, hy + 30),
        (kcrate, hx + 236, hy + 34),
        (sack, hx + 128, hy + 40),
    ]
    for im, x, y in items:
        canvas.alpha_composite(im, (x, y))
    # zwój liny z kutra przy dziobie
    coil = kut.crop((80, 50, 98, 70))
    canvas.alpha_composite(coil, (hx + 22, hy + 30))

    # cumy: od dziobu i rufy w górę-na zewnątrz, do pachołków na molo (1 pole nad burtą)
    rope(mp, (bow[0] + 4, bow[1] + 2), (bow[0] - 6, max(0, hy - 30)), W, H)
    rope(mp, (stern[0] - 4, stern[1] + 2), (stern[0] + 10, max(0, hy - 30)), W, H)

    canvas.save(out_path)
    return canvas


if __name__ == "__main__":
    import sys
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAW, "kuter_proflash_1.png")
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(RAW, "prom_collage.png")
    im = build(src, dst)
    print(im.size, im.getbbox())
