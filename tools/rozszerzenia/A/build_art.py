"""Grafiki paczki A „Woda i zasoby” (docs/rozszerzenia/PLAN.md, punkt 4): arkusze zdarzeń img/characters/!$Zas_*.png i !Zas_Uprawy.png,
wiersz ikon tools/rozszerzenia/A/ikony.png (IconSet wiersz 29: ikony 464-479; wkleja instalator) i podgląd docs/rozszerzenia/A/obiekty.png.

Źródła (0 nowych generacji poza raw/obiekty_4.png):
  raw/obiekty_4.png        PixelLab Pro Flash 256x192 (9 generacji): źródełko, kałuża pływowa, glinianka, kupa śmieci
  Winlu Fantasy Exterior   Fantasy_Outside_D (dziupla w pniaku, kłody, kamienie, paprocie, ściana z bloków), Fantasy_Outside_C (studnie)
  gra                      !$Zagroda_Dom (ruina chaty), !$Tree_FruitBare / !$Tree_Apple (sad), img/system/Farm_Crops (uprawy),
                           img/system/Gather_* (grzyby, zioła, kamyki), img/system/IconSet (ikony przerobione)
Stany obiektów: wiersz (kierunek 2/4/6/8) i kolumna (wzór 0-2) arkusza "!$" 3 x 4 komórek; ustawia je Zasoby.js. Dół obiektu 2 px nad
dołem komórki, środek w poziomie (ściana ciosowa: przesunięta o pół komórki w prawo - zdarzenie stoi na lewym z dwóch pól).
Uruchom: python tools/rozszerzenia/A/build_art.py   (zapisuje do img/characters, kopie starych plików w backup_art_2026-10-21/rozszerzenia/A)
"""
import colorsys
import os
import random
import shutil

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
CHARS = os.path.join(ROOT, "img", "characters")
SYSTEM = os.path.join(ROOT, "img", "system")
WINLU = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-21", "rozszerzenia", "A")
DOCS = os.path.join(ROOT, "docs", "rozszerzenia", "A")
ICONS_OUT = os.path.join(HERE, "ikony.png")
WINLU_DARK, WINLU_OUT2 = (47, 38, 45), (65, 52, 50)
random.seed(21)


def load(path):
    return Image.open(path).convert("RGBA")


def crop_content(img):
    bb = img.getbbox()
    return img.crop(bb) if bb else img


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def hsv(c):
    return colorsys.rgb_to_hsv(c[0] / 255.0, c[1] / 255.0, c[2] / 255.0)


def from_hsv(h, s, v, a=255):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, max(0, min(1, s)), max(0, min(1, v)))
    return (int(r * 255), int(g * 255), int(b * 255), a)


def winlu_tone(img, dark=52, sat=0.93):
    """PixelLab's darkest pixels -> Winlu's dark brown outline, a little less saturation (as the island's objects)."""
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            L = lum((r, g, b))
            if L < dark:
                t = L / float(dark)
                px[x, y] = tuple(int(WINLU_DARK[i] + (WINLU_OUT2[i] - WINLU_DARK[i]) * t) for i in range(3)) + (a,)
                continue
            hh, ll, ss = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
            rr, gg, bb = colorsys.hls_to_rgb(hh, ll, ss * sat)
            px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return img


def alpha_clean(img):
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)
    return img


def recolor(img, fn, mask=None):
    """fn((r,g,b,a), x, y) -> new pixel or None (keep)."""
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            p = px[x, y]
            if p[3] == 0 or (mask is not None and (x, y) not in mask):
                continue
            q = fn(p, x, y)
            if q is not None:
                px[x, y] = (0, 0, 0, 0) if q[3] == 0 else (q[0], q[1], q[2], p[3])   # (the source's alpha kept: soft shadows stay soft)
    return img


def place(cell_w, cell_h, obj, dx=0, bottom=2):
    c = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
    x = (cell_w - obj.width) // 2 + dx
    y = cell_h - bottom - obj.height
    c.alpha_composite(obj, (max(0, x), max(0, y)))
    return c


def big_sheet(cells, cw, ch):
    """cells: {(row, col): Image of cw x ch}; rows 0-3 (down, left, right, up), cols 0-2. Missing cells: the row's first, else (0,0)."""
    sheet = Image.new("RGBA", (cw * 3, ch * 4), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            im = cells.get((r, c)) or cells.get((r, 0)) or cells.get((0, 0))
            sheet.alpha_composite(im, (c * cw, r * ch))
    return sheet


def save_char(name, img):
    path = os.path.join(CHARS, name + ".png")
    if os.path.exists(path):
        os.makedirs(BACKUP, exist_ok=True)
        bak = os.path.join(BACKUP, name + ".png")
        if not os.path.exists(bak):
            shutil.copy2(path, bak)
    img.save(path, optimize=True)
    return path


# ----------------------------------------------------------------------------------------------------------------------------------
# The sources
# ----------------------------------------------------------------------------------------------------------------------------------
SHEET4 = load(os.path.join(RAW, "obiekty_4.png"))
WD = load(os.path.join(WINLU, "Fantasy_Outside_D.png"))
WC = load(os.path.join(WINLU, "Fantasy_Outside_C.png"))


def quadrant(i):
    w, h = SHEET4.width // 2, SHEET4.height // 2
    q = SHEET4.crop(((i % 2) * w, (i // 2) * h, (i % 2 + 1) * w, (i // 2 + 1) * h))
    return winlu_tone(alpha_clean(crop_content(q)))


SPRING, POOL, CLAYPIT, HEAP = quadrant(0), quadrant(1), quadrant(2), quadrant(3)


def is_water(p):
    h, s, v = hsv(p)
    return 0.42 <= h <= 0.62 and s >= 0.18 and v >= 0.35


# ---- A1 the spring: full (trickle animated), low, dry, frozen
def spring_cells():
    img = SPRING
    W, H = img.size
    px = img.load()
    water = {(x, y) for y in range(H) for x in range(W) if px[x, y][3] and is_water(px[x, y])}
    rows = {}
    for (x, y) in water:
        rows.setdefault(y, []).append(x)
    pool_bottom = max(y for y, xs in rows.items() if len(xs) >= 12)
    pool_top = min(y for y, xs in rows.items() if len(xs) >= 12)
    trickle = {(x, y) for (x, y) in water if y > pool_bottom}
    pool = water - trickle
    cw, ch = 112, 96
    out = {}
    # full: the trickle's light pixels shift down a pixel a frame
    for f in range(3):
        def full(p, x, y, f=f):
            if (x, y) in trickle:
                hh, ss, vv = hsv(p)
                return from_hsv(hh, ss * 0.85, min(1, vv + 0.18), 255) if (y + f * 2) % 6 < 2 else None
            if (x, y) in pool and (x * 7 + y * 3 + f * 5) % 47 == 0:
                return (226, 246, 250, 255)
            return None
        out[(0, f)] = place(cw, ch, recolor(img, full))
    # low: the upper part of the pool is wet mud, a thin trickle
    level = pool_top + (pool_bottom - pool_top) * 0.45
    for f in range(3):
        def low(p, x, y, f=f):
            if (x, y) in trickle:
                return None if (y + f) % 5 == 0 and x % 2 == 0 else (0, 0, 0, 0) if y > pool_bottom + 3 else None
            if (x, y) in pool and y < level:
                return (78, 84, 62, 255) if (x + y) % 5 else (92, 98, 70, 255)
            if (x, y) in pool:
                hh, ss, vv = hsv(p)
                return from_hsv(hh, ss * 0.8, vv * 0.85)
            return None
        out[(1, f)] = place(cw, ch, recolor(img, low))
    # dry: damp moss and mud, no trickle
    def dry(p, x, y):
        if (x, y) in trickle:
            return (0, 0, 0, 0)
        if (x, y) in pool:
            k = (x * 3 + y * 5) % 9
            return (72, 74, 52, 255) if k < 4 else (86, 88, 60, 255) if k < 7 else (60, 66, 46, 255)
        return None
    out[(2, 0)] = place(cw, ch, recolor(img, dry))
    # frozen: pale ice, an icicle where the trickle was
    def ice(p, x, y):
        if (x, y) in trickle:
            return (236, 244, 250, 255) if y < pool_bottom + 6 else (0, 0, 0, 0)
        if (x, y) in pool:
            hh, ss, vv = hsv(p)
            return from_hsv(0.55, ss * 0.3, min(1, 0.72 + vv * 0.3))
        return None
    out[(3, 0)] = place(cw, ch, recolor(img, ice))
    return out, cw, ch


# ---- small mossy stones by the spring (game ground stones + moss)
def stones_cells():
    out = {}
    for c, name in enumerate(["Gather_Stone_2", "Gather_Stone_0", "Gather_Stone_1"]):
        st = load(os.path.join(SYSTEM, name + ".png"))
        px = st.load()
        for x in range(st.width):
            for y in range(st.height):
                if px[x, y][3] and lum(px[x, y]) > 95 and (y < st.height * 0.45) and (x * 5 + y) % 3:
                    px[x, y] = (96, 128, 70, 255) if (x + y) % 2 else (112, 142, 78, 255)
                    break
        out[(0, c)] = place(48, 48, st, bottom=6)
    return out, 48, 48


# ---- A5 / D30 the rare herbs: arcydzięgiel (greenish-white umbels, taller), dziurawiec (golden stars), kozłek (pink umbels);
# columns: grown, picked (stems only), out of season (withered)
def is_flower(p):
    h, s, v = hsv(p)
    return v > 0.62 and (s < 0.32 or 0.08 <= h <= 0.2)


def herb_base(kind):
    yarrow = load(os.path.join(SYSTEM, "Gather_Yarrow_0.png"))
    yellow = load(os.path.join(SYSTEM, "Gather_Herb_0.png"))
    if kind == "dziurawiec":
        base = Image.new("RGBA", (yellow.width + 10, yellow.height + 4), (0, 0, 0, 0))
        base.alpha_composite(yellow, (0, 4))
        base.alpha_composite(yellow.transpose(Image.FLIP_LEFT_RIGHT), (10, 0))
        return recolor(base, lambda p, x, y: from_hsv(0.12, 0.85, min(1, hsv(p)[2] * 1.05)) if hsv(p)[1] > 0.45 and 0.08 <= hsv(p)[0] <= 0.18 else None)
    if kind == "arcydziegiel":
        base = Image.new("RGBA", (yarrow.width + 8, yarrow.height + 12), (0, 0, 0, 0))
        base.alpha_composite(yarrow, (8, 0))
        base.alpha_composite(yarrow.transpose(Image.FLIP_LEFT_RIGHT), (0, 12))
        return recolor(base, lambda p, x, y: from_hsv(0.22, 0.32, min(1, hsv(p)[2] * 0.97)) if is_flower(p) else None)
    base = Image.new("RGBA", (yarrow.width + 6, yarrow.height + 4), (0, 0, 0, 0))
    base.alpha_composite(yarrow, (0, 4))
    base.alpha_composite(yarrow.transpose(Image.FLIP_LEFT_RIGHT), (6, 0))
    return recolor(base, lambda p, x, y: from_hsv(0.93, 0.38, min(1, hsv(p)[2] * 1.0)) if is_flower(p) else None)


def herb_cells():
    out = {}
    for row, kind in enumerate(["arcydziegiel", "dziurawiec", "kozlek"]):
        grown = herb_base(kind)
        gp = grown.load()
        # picked: the flowers and the top of the stems gone
        top = int(grown.height * 0.42)
        picked = recolor(grown, lambda p, x, y: (0, 0, 0, 0) if y < top or (hsv(p)[2] > 0.62 and (hsv(p)[1] < 0.32 or 0.08 <= hsv(p)[0] <= 0.2) and kind != "x") else None)
        withered = recolor(picked, lambda p, x, y: from_hsv(0.09, min(0.45, hsv(p)[1]), hsv(p)[2] * 0.85))
        out[(row, 0)] = place(48, 48, grown, bottom=6)
        out[(row, 1)] = place(48, 48, picked, bottom=6)
        out[(row, 2)] = place(48, 48, withered, bottom=6)
    return out, 48, 48


# ---- A4 the mushrooms of the rings (the game's ground mushrooms)
def mushroom_cells():
    out = {}
    pics = [load(os.path.join(SYSTEM, "Gather_Mushroom_%d.png" % i)) for i in range(5)]
    order = [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2)]
    for k, rc in enumerate(order):
        out[rc] = place(48, 48, pics[[0, 3, 1, 4, 2, 0][k]], bottom=10)
    return out, 48, 48


# ---- A2 the ruined hut of the Rzepkas: Ług's thatched house (no door) aged grey, a hole in the thatch with the rafters, weeds
def ruin_cells():
    dom = load(os.path.join(CHARS, "!$Zagroda_Dom.png"))
    cw, ch = 252, 216
    thatch = dom.crop((cw, ch, 2 * cw, 2 * ch))
    rafters = dom.crop((0, ch, cw, 2 * ch))
    px, rp = thatch.load(), rafters.load()
    W, H = thatch.size
    # where the thatch is (straw: hue 0.08-0.16, light)
    roof = {(x, y) for y in range(H) for x in range(W) if px[x, y][3] and 0.06 <= hsv(px[x, y])[0] <= 0.17 and hsv(px[x, y])[2] > 0.45 and y < 125}
    # a ragged collapse: a few overlapping blobs, the edge eaten unevenly
    blobs = [(150, 80, 40, 24), (118, 70, 26, 20), (178, 64, 24, 18), (160, 98, 30, 14)]
    rng = random.Random(9)
    edge = {}
    hole = set()
    for (x, y) in roof:
        inside = False
        for (bx, by, rx, ry) in blobs:
            k = (x // 4, y // 3)
            if k not in edge:
                edge[k] = rng.uniform(-0.28, 0.22)
            dx, dy = (x - bx) / float(rx), (y - by) / float(ry)
            if dx * dx + dy * dy < 1.0 + edge[k]:
                inside = True
                break
        if inside:
            hole.add((x, y))
    out = thatch.copy()
    op = out.load()
    for y in range(H):
        for x in range(W):
            p = op[x, y]
            if not p[3]:
                continue
            h, s, v = hsv(p)
            if (x, y) in hole:
                q = rp[x, y]
                op[x, y] = q if q[3] else (38, 30, 28, 255)
                continue
            # old grey wood, sagging dark straw
            if (x, y) in roof:
                op[x, y] = from_hsv(h, s * 0.55, v * 0.72)
            else:
                op[x, y] = from_hsv(h, s * 0.62, v * 0.86)
    # the hole's ragged edge: dark straw
    for (x, y) in list(hole):
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if (nx, ny) in roof and (nx, ny) not in hole:
                op[nx, ny] = (74, 60, 40, 255)
    # weeds at the foot (Winlu ferns), a fallen plank
    fern = crop_content(WD.crop((432, 336, 480, 384)))
    fern = fern.resize((fern.width * 2 // 3, fern.height * 2 // 3), Image.NEAREST)
    for fx in (18, 96, 200):
        out.alpha_composite(fern, (fx, H - fern.height - 2))
    return {(0, 0): out}, cw, ch


# ---- A2 the wild garden: overgrown weeds (3 looks), weeded soil with sprouts
def garden_cells():
    out = {}
    ferns = [crop_content(WD.crop(b)) for b in ((432, 336, 480, 384), (480, 336, 528, 384), (528, 336, 576, 384))]
    crops = load(os.path.join(SYSTEM, "Farm_Crops.png"))
    for c in range(3):
        f = ferns[c]
        f = f.resize((int(f.width * 0.85), int(f.height * 0.85)), Image.NEAREST)
        out[(0, c)] = place(48, 48, f, bottom=4)
        soil = crop_content(crops.crop((0, c % 2 * 48, 48, c % 2 * 48 + 48)))
        out[(1, c)] = place(48, 48, soil, bottom=6)
    return out, 48, 48


# ---- A2 the neighbour's well: rubble in the ring, the empty ring, mended dry, mended with rain water, frozen
def well_cells():
    full = crop_content(WC.crop((384, 500, 432, 624)))
    dry = crop_content(WC.crop((432, 500, 480, 624)))
    W, H = full.size
    # the ring alone: the frame and the roof of planks above the ring cut away (the ring is the lower part, ~44 px)
    ring_top = H - 46
    ring_empty = dry.crop((0, ring_top, dry.width, dry.height))
    ep = ring_empty.load()
    for y in range(ring_empty.height):
        for x in range(ring_empty.width):
            p = ep[x, y]
            if p[3] and 0.06 <= hsv(p)[0] <= 0.14 and hsv(p)[1] > 0.3 and abs(x - ring_empty.width // 2) <= 3 and y < 30:
                ep[x, y] = (30, 30, 36, 255)
    rubble = ring_empty.copy()
    rp = rubble.load()
    stones = load(os.path.join(SYSTEM, "Gather_Stone_2.png"))
    for y in range(rubble.height):
        for x in range(rubble.width):
            p = rp[x, y]
            if p[3] and lum(p) < 48 and 6 < y < 30:
                k = (x * 5 + y * 3) % 7
                rp[x, y] = (112, 96, 74, 255) if k < 3 else (92, 80, 62, 255) if k < 5 else (128, 120, 108, 255)
    rubble.alpha_composite(stones, (rubble.width // 2 - stones.width // 2, 2))
    def frozen(p, x, y):
        if y < ring_top + 4:
            return None
        return from_hsv(0.56, 0.18, min(1, 0.8 + hsv(p)[2] * 0.2)) if is_water(p) or (0.55 <= hsv(p)[0] <= 0.7 and hsv(p)[1] > 0.3) else None
    cw, ch = 64, 120
    out = {(0, 0): place(cw, ch, rubble), (0, 1): place(cw, ch, ring_empty), (1, 0): place(cw, ch, dry), (1, 1): place(cw, ch, full),
           (1, 2): place(cw, ch, recolor(full, frozen))}
    return out, cw, ch


# ---- A2 the remains of the fence: four leaning posts down one column, a broken rail
def fence_cells():
    two = crop_content(WC.crop((720, 336, 768, 432)))
    pole = crop_content(two.crop((0, 0, two.width // 2, two.height)))
    cw, ch = 48, 192
    c = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    for i, (h, lean) in enumerate([(44, 0), (30, 1), (46, 0), (24, -1)]):
        p = pole.crop((0, max(0, pole.height - h), pole.width, pole.height))
        p = recolor(p, lambda q, x, y: from_hsv(hsv(q)[0], hsv(q)[1] * 0.7, hsv(q)[2] * 0.82))
        if lean:
            p = p.rotate(-7 * lean, expand=True, resample=Image.NEAREST)
        x = cw // 2 - p.width // 2
        y = 48 * (i + 1) - 4 - p.height
        c.alpha_composite(p, (x, y))
    return {(0, 0): c}, cw, ch


# ---- A3 the wild hive: a hollow stump with a comb and bees (summer and autumn the bees fly), the comb taken, winter
def hive_cells():
    stump = crop_content(WD.crop((0, 288, 48, 384)))
    W, H = stump.size
    sp = stump.load()
    hollow = [(x, y) for y in range(H) for x in range(W) if sp[x, y][3] and lum(sp[x, y]) < 40 and y < H * 0.55]
    hx = sorted(x for x, _ in hollow)
    hy = sorted(y for _, y in hollow)
    cx, cy = hx[len(hx) // 2], hy[len(hy) * 2 // 3]
    comb = stump.copy()
    cp = comb.load()
    for (x, y) in hollow:
        if abs(x - cx) <= 6 and abs(y - cy) <= 6:
            cp[x, y] = (150, 96, 34, 255) if (x + 2 * (y // 3)) % 4 == 0 or y % 3 == 0 else (224, 168, 64, 255)
    def bees(img, f, n):
        im = img.copy()
        d = im.load()
        for k in range(n):
            bx = cx + int(9 * ((k * 37 + f * 11) % 7 - 3) / 3.0)
            by = max(1, cy - 10 - ((k * 13 + f * 5) % 9))
            for (px_, py_, col) in ((bx, by, (240, 200, 60, 255)), (bx + 1, by, (40, 30, 26, 255))):
                if 0 <= px_ < W and 0 <= py_ < H:
                    d[px_, py_] = col
        return im
    cw, ch = 64, 104
    out = {}
    for f in range(3):
        out[(0, f)] = place(cw, ch, bees(comb, f, 3))
        out[(1, f)] = place(cw, ch, bees(stump, f, 1))
    out[(2, 0)] = place(cw, ch, stump)
    return out, cw, ch


# ---- A6 the rubbish heap: the heap, the heap turned over, a small pile; second row: dug through (darker earth)
def dump_cells():
    small = Image.new("RGBA", (72, 44), (0, 0, 0, 0))
    jars = crop_content(WC.crop((240, 480, 336, 528)))
    crate = crop_content(WC.crop((240, 384, 288, 432)))
    small = Image.new("RGBA", (110, 60), (0, 0, 0, 0))
    small.alpha_composite(crate, (52, 4))
    small.alpha_composite(jars, (0, 10))
    small = crop_content(small)
    looks = [HEAP, HEAP.transpose(Image.FLIP_LEFT_RIGHT), small]
    cw, ch = 128, 96
    out = {}
    for c, im in enumerate(looks):
        out[(0, c)] = place(cw, ch, im)
        out[(1, c)] = place(cw, ch, recolor(im, lambda p, x, y: from_hsv(hsv(p)[0], hsv(p)[1] * 0.9, hsv(p)[2] * 0.82)))
    return out, cw, ch


# ---- A6 the clay pit: dry, with muddy rain water at the bottom
def claypit_cells():
    img = CLAYPIT
    W, H = img.size
    px = img.load()
    seed = (W // 2, int(H * 0.58))
    ref = px[seed]
    seen, stack = set(), [seed]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < W and 0 <= y < H):
            continue
        p = px[x, y]
        if not p[3] or sum(abs(p[i] - ref[i]) for i in range(3)) > 70:
            continue
        seen.add((x, y))
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    ys = [y for _, y in seen]
    top = min(ys) + (max(ys) - min(ys)) * 0.25
    def wet(p, x, y):
        if (x, y) in seen and y >= top:
            k = (x * 3 + y * 7) % 11
            return (104, 98, 78, 255) if k < 6 else (118, 112, 88, 255) if k < 9 else (146, 140, 112, 255)
        return None
    cw, ch = 112, 88
    return {(0, 0): place(cw, ch, img), (1, 0): place(cw, ch, recolor(img, wet))}, cw, ch


# ---- A7 the block wall: Winlu's wall of stone blocks; blocks cut out (dark recesses with a lit lower edge); rubble at the foot
def quarry_cells():
    wall = WD.crop((384, 8, 480, 104))
    stones = load(os.path.join(SYSTEM, "Gather_Stone_1.png"))
    def cut(img, holes):
        im = img.copy()
        d = ImageDraw.Draw(im)
        for (x, y, w, h) in holes:
            d.rectangle((x, y, x + w - 1, y + h - 1), fill=(92, 104, 102, 255))
            d.rectangle((x + 1, y + 1, x + w - 2, y + 4), fill=(62, 70, 72, 255))
            d.line((x, y, x, y + h - 1), fill=(54, 60, 64, 255))
            d.line((x, y + h - 1, x + w - 1, y + h - 1), fill=(150, 160, 152, 255))
            d.line((x + w - 1, y, x + w - 1, y + h - 1), fill=(126, 136, 132, 255))
            for k in range(3):
                d.point((x + 4 + k * 7, y + 8 + (k % 2) * 3), fill=(118, 128, 124, 255))
        return im
    looks = [wall, cut(wall, [(30, 40, 26, 18)]), cut(wall, [(8, 22, 26, 18), (38, 44, 26, 18), (60, 18, 26, 18), (20, 62, 28, 16)])]
    cw, ch = 144, 112
    out = {}
    for r, im in enumerate(looks):
        c = Image.new("RGBA", (96, im.height + 10), (0, 0, 0, 0))
        c.alpha_composite(im, (0, 0))
        c.alpha_composite(stones, (14, im.height - 4))
        c.alpha_composite(stones.transpose(Image.FLIP_LEFT_RIGHT), (60, im.height - 2))
        for col in range(3):
            out[(r, col)] = place(cw, ch, c, dx=24)
    return out, cw, ch


# ---- A8 the tidal pool with crabs (2, 1, none; the crabs' claws move)
CRAB = ["..o...o..",
        ".oho.oho.",
        "..oSSSo..",
        ".oSHHSSo.",
        "o.oSSSo.o",
        ".o.o.o.o."]
CRAB_COL = {"o": (70, 34, 28, 255), "S": (150, 70, 46, 255), "H": (196, 110, 72, 255), "h": (176, 86, 56, 255)}


def crab(f):
    rows = CRAB[:]
    if f == 1:
        rows[0] = ".o.....o."
        rows[1] = "oho...oho"
    if f == 2:
        rows[5] = "o.o.o.o.o"
    im = Image.new("RGBA", (9, 6), (0, 0, 0, 0))
    p = im.load()
    for y, line in enumerate(rows):
        for x, ch in enumerate(line):
            if ch in CRAB_COL:
                p[x, y] = CRAB_COL[ch]
    return im


def pool_cells():
    img = POOL
    W, H = img.size
    px = img.load()
    water = [(x, y) for y in range(H) for x in range(W) if px[x, y][3] and is_water(px[x, y])]
    xs = sorted(x for x, _ in water)
    ys = sorted(y for _, y in water)
    spots = [(xs[len(xs) * 3 // 10], ys[len(ys) * 6 // 10]), (xs[len(xs) * 7 // 10], ys[len(ys) * 4 // 10])]
    cw, ch = 128, 88
    out = {}
    for f in range(3):
        for r, n in ((0, 2), (1, 1)):
            im = img.copy()
            for k in range(n):
                sx, sy = spots[k]
                im.alpha_composite(crab((f + k) % 3), (sx - 4 + (1 if (f + k) % 3 == 1 else 0), sy - 3))
            out[(r, f)] = place(cw, ch, im)
    out[(2, 0)] = place(cw, ch, img)
    return out, cw, ch


# ---- A8 driftwood: Winlu's logs bleached by the sea
def drift_cells():
    def bleach(im):
        return recolor(im, lambda p, x, y: from_hsv(0.08, hsv(p)[1] * 0.28, min(1, 0.32 + hsv(p)[2] * 0.85)))
    small = crop_content(WD.crop((528, 288, 576, 336)))
    longlog = crop_content(WD.crop((672, 240, 768, 288)))
    looks = [bleach(small), bleach(longlog.resize((longlog.width * 2 // 3, longlog.height * 2 // 3), Image.NEAREST)), bleach(small.transpose(Image.FLIP_LEFT_RIGHT))]
    out = {(0, c): place(72, 48, im, bottom=6) for c, im in enumerate(looks)}
    return out, 72, 48


# ---- A9 the orchard: charred (raw/sad_spalony.png - PixelLab edit of !$Tree_FruitBare, 6 generations), pruned (the burnt tips cut
# back, pale cuts), dressed (the salve on the cuts), leafy (!$Tree_FruitBare), in blossom, with apples (!$Tree_Apple), winter (bare,
# alive: the burnt tree's shape in brown bark)
def orchard_cells():
    bare = load(os.path.join(CHARS, "!$Tree_FruitBare.png")).crop((0, 0, 160, 204))
    apple = load(os.path.join(CHARS, "!$Tree_Apple.png")).crop((0, 0, 160, 204))
    charred = winlu_tone(alpha_clean(load(os.path.join(RAW, "sad_spalony.png"))))
    W, H = charred.size
    cx, cy, rx, ry = 78, 150, 48, 100
    inside = lambda x, y: ((x - cx) / float(rx)) ** 2 + ((y - cy) / float(ry)) ** 2 <= 1.0
    pruned = recolor(charred, lambda p, x, y: (0, 0, 0, 0) if not inside(x, y) and y < 170 else None)
    pp = pruned.load()
    cuts = []
    for y in range(H):
        for x in range(W):
            if pp[x, y][3] and y < 170 and any(not inside(nx, ny) for nx, ny in ((x + 1, y), (x - 1, y), (x, y - 1), (x, y + 1))):
                cuts.append((x, y))
    for (x, y) in cuts:
        pp[x, y] = (196, 168, 120, 255)
    dressed = pruned.copy()
    dp = dressed.load()
    for (x, y) in cuts:
        for dx in (-1, 0, 1):
            for dy in (0, 1):
                if 0 <= x + dx < W and 0 <= y + dy < H and dp[x + dx, y + dy][3]:
                    dp[x + dx, y + dy] = (150, 132, 98, 255) if (dx + dy) % 2 else (128, 112, 84, 255)
    winter = recolor(charred, lambda p, x, y: from_hsv(0.07, 0.42, min(1, 0.12 + hsv(p)[2] * 1.5)) if lum(p) > 20 else None)

    def is_leaf(p):
        h, s_, v = hsv(p)
        return 0.17 <= h <= 0.5 and s_ > 0.2
    bloom = bare.copy()
    bp = bloom.load()
    rnd = random.Random(5)
    for _ in range(170):
        x, y = rnd.randrange(8, 152), rnd.randrange(6, 140)
        if bp[x, y][3] and is_leaf(bp[x, y]):
            col = rnd.choice([(250, 236, 240, 255), (244, 204, 214, 255), (255, 250, 250, 255)])
            for dx, dy in ((0, 0), (1, 0), (0, 1)):
                if bp[x + dx, y + dy][3]:
                    bp[x + dx, y + dy] = col
    cw, ch = 160, 208
    out = {(0, 0): place(cw, ch, charred), (0, 1): place(cw, ch, pruned), (0, 2): place(cw, ch, dressed),
           (1, 0): place(cw, ch, bare), (1, 1): place(cw, ch, bloom), (1, 2): place(cw, ch, apple), (2, 0): place(cw, ch, winter)}
    return out, cw, ch


# ---- A6 / A10 the crops (an 8-character sheet: character = the crop of Farm_Crops - potato, carrot, cabbage, barley; row 0 the
# stages 0-2, row 1 ripe, stubble, bare soil)
def crops_sheet():
    crops = load(os.path.join(SYSTEM, "Farm_Crops.png"))
    sheet = Image.new("RGBA", (576, 384), (0, 0, 0, 0))
    for crop in range(4):
        stages = [crops.crop((c * 48, crop * 48, c * 48 + 48, crop * 48 + 48)) for c in range(4)]
        bare = recolor(stages[0], lambda p, x, y: (0, 0, 0, 0) if 0.17 <= hsv(p)[0] <= 0.5 and hsv(p)[1] > 0.25 else None)
        stubble = recolor(stages[1], lambda p, x, y: from_hsv(0.11, 0.45, hsv(p)[2] * 0.95) if 0.15 <= hsv(p)[0] <= 0.5 and hsv(p)[1] > 0.25 else None)
        looks = [[stages[0], stages[1], stages[2]], [stages[3], stubble, bare]]
        bx, by = (crop % 4) * 144, (crop // 4) * 192
        for r in range(4):
            for c in range(3):
                sheet.alpha_composite(looks[min(r, 1)][c], (bx + c * 48, by + r * 48))
    return sheet


# ----------------------------------------------------------------------------------------------------------------------------------
# The icons (row 29 of the IconSet: 464-479), made from the game's own icons
# ----------------------------------------------------------------------------------------------------------------------------------
def icon_of(icons, n):
    return icons.crop(((n % 16) * 32, (n // 16) * 32, (n % 16) * 32 + 32, (n // 16) * 32 + 32))


def stone_block(ingot):
    im = recolor(ingot, lambda p, x, y: from_hsv(0.5, 0.08, min(1, 0.1 + hsv(p)[2] * 0.82)) if lum(p) > 40 else None)
    d = ImageDraw.Draw(im)
    d.line((12, 13, 15, 18), fill=(70, 74, 76, 255))
    d.line((15, 18, 19, 19), fill=(70, 74, 76, 255))
    return im


def old_coin():
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((5, 5, 26, 26), fill=(52, 38, 26, 255))
    d.ellipse((6, 6, 25, 25), fill=(150, 108, 58, 255))
    d.ellipse((8, 8, 23, 23), fill=(176, 132, 74, 255))
    d.arc((8, 8, 23, 23), 200, 340, fill=(214, 172, 108, 255))
    for (x, y) in ((13, 15), (14, 14), (15, 14), (16, 14), (17, 15), (18, 15), (14, 16), (15, 16), (16, 16), (17, 16), (19, 14), (12, 17), (16, 17)):
        d.point((x, y), fill=(66, 46, 28, 255))
    for (x, y) in ((9, 18), (10, 19), (11, 21), (20, 10), (21, 11), (22, 12), (19, 22), (20, 21), (8, 13), (12, 9)):
        d.point((x, y), fill=(92, 156, 128, 255))
        d.point((x + 1, y), fill=(120, 178, 150, 255))
    return im


def build_icons():
    icons = load(os.path.join(SYSTEM, "IconSet.png"))
    strip = Image.new("RGBA", (512, 32), (0, 0, 0, 0))
    ingot, log, yarrow, herb, coin, pot, brew, pickhead = (icon_of(icons, n) for n in (342, 381, 412, 360, 314, 428, 366, 376))
    def tone(im, h, s_k, v_k, h_from=None):
        return recolor(im, lambda p, x, y: from_hsv(h if h is not None else hsv(p)[0], hsv(p)[1] * s_k, min(1, hsv(p)[2] * v_k)) if lum(p) > 40 else None)
    def crab_icon(raw):
        im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        c = crab(0).resize((27, 18), Image.NEAREST)
        if not raw:
            c = recolor(c, lambda p, x, y: from_hsv(0.03, min(1, hsv(p)[1] * 1.25), min(1, hsv(p)[2] * 1.35)) if lum(p) > 40 else None)
        else:
            c = recolor(c, lambda p, x, y: from_hsv(0.08, hsv(p)[1] * 0.6, hsv(p)[2] * 0.8) if lum(p) > 40 else None)
        im.alpha_composite(c, (2, 8))
        return im
    looks = {
        185: recolor(ingot, lambda p, x, y: from_hsv(0.12, 0.62, min(1, 0.25 + hsv(p)[2] * 0.85)) if lum(p) > 40 else None),   # wosk
        186: crab_icon(True), 187: crab_icon(False),        # surowy / pieczony krab
        188: stone_block(ingot),                            # blok kamienny
        189: tone(log, 0.08, 0.3, 1.25),                    # drewno dryfowe: bleached log
        190: recolor(yarrow, lambda p, x, y: from_hsv(0.22, 0.35, hsv(p)[2]) if is_flower(p) else None),
        191: recolor(yarrow, lambda p, x, y: from_hsv(0.13, 0.85, min(1, hsv(p)[2] * 1.05)) if is_flower(p) else None),
        192: recolor(yarrow, lambda p, x, y: from_hsv(0.93, 0.42, hsv(p)[2]) if is_flower(p) else None),
        193: recolor(pickhead, lambda p, x, y: from_hsv(0.055, 0.62, hsv(p)[2] * 0.85) if lum(p) > 40 else None),   # złom: rusty iron
        194: old_coin(),                                    # zaśniedziała moneta: bronze, verdigris, a raven
        195: recolor(pot, lambda p, x, y: (226, 176, 70, 255) if y < 12 and lum(p) > 60 else None),
        196: tone(brew, 0.85, 0.75, 1.0),                   # napar z kozłka: violet-pink
    }
    for n, im in looks.items():
        strip.alpha_composite(im, ((n - 185) * 32, 0))
    strip.save(ICONS_OUT, optimize=True)
    return strip


def main():
    built = {}
    for name, fn in (("!$Zas_Zrodlo", spring_cells), ("!$Zas_Kamienie", stones_cells), ("!$Zas_Ziolo", herb_cells), ("!$Zas_Grzyb", mushroom_cells),
                     ("!$Zas_Ruina", ruin_cells), ("!$Zas_Ogrodek", garden_cells), ("!$Zas_Studnia", well_cells), ("!$Zas_Plot", fence_cells),
                     ("!$Zas_DzikiUl", hive_cells), ("!$Zas_Wysypisko", dump_cells), ("!$Zas_Glinianka", claypit_cells),
                     ("!$Zas_ScianaCiosowa", quarry_cells), ("!$Zas_Kaluza", pool_cells), ("!$Zas_Drewno", drift_cells), ("!$Zas_SadSpalony", orchard_cells)):
        cells, cw, ch = fn()
        sheet = big_sheet(cells, cw, ch)
        save_char(name, sheet)
        built[name] = (cells, cw, ch)
        print("%-22s %dx%d (komórka %dx%d)" % (name, sheet.width, sheet.height, cw, ch))
    crops = crops_sheet()
    save_char("!Zas_Uprawy", crops)
    print("!Zas_Uprawy            576x384")
    strip = build_icons()
    print("ikony.png              512x32 ->", ICONS_OUT)
    # the preview: every look of every sheet on the meadow's green, x2
    os.makedirs(DOCS, exist_ok=True)
    rows = []
    for name, (cells, cw, ch) in built.items():
        keys = sorted(cells)
        w = sum(cw for _ in keys) + 4 * len(keys)
        im = Image.new("RGBA", (max(w, 200), ch + 14), (112, 136, 96, 255))
        x = 0
        for k in keys:
            im.alpha_composite(cells[k], (x, 14))
            x += cw + 4
        ImageDraw.Draw(im).text((2, 1), name, fill=(255, 255, 255, 255))
        rows.append(im)
    rows.append(Image.new("RGBA", (576, 14), (112, 136, 96, 255)))
    rows.append(Image.alpha_composite(Image.new("RGBA", crops.size, (112, 136, 96, 255)), crops))
    rows.append(Image.alpha_composite(Image.new("RGBA", strip.size, (60, 60, 70, 255)), strip))
    W = max(r.width for r in rows)
    H = sum(r.height + 6 for r in rows)
    prev = Image.new("RGBA", (W, H), (90, 100, 80, 255))
    y = 0
    for r in rows:
        prev.alpha_composite(r, (0, y))
        y += r.height + 6
    prev = prev.resize((W * 2, H * 2), Image.NEAREST)
    prev.save(os.path.join(DOCS, "obiekty.png"), optimize=True)
    print("podgląd: docs/rozszerzenia/A/obiekty.png")


if __name__ == "__main__":
    main()
