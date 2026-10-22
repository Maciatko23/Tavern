# Paczka D (docs/rozszerzenia/PLAN.md 7): obrazki zdarzeń !$Zak_* w img/characters i wiersz ikon 512-527 (tools/rozszerzenia/D/ikony.png).
# Źródła: obrazki PixelLab (tools/rozszerzenia/D/surowe/, wygenerowane raz - spis w generacje.json), kafle Winlu z img/tilesets (te
# same, z których są mapy: kapliczki, groby, skrzynie, kwiaty, kamienie), ikony gry (pióro). Bez skalowania pikseli (drobny piksel 1x).
# Każdy arkusz !$ to 3 x 4 klatki jednego rozmiaru (kierunek 2/4/6/8 = wiersz, wzór 0-2 = kolumna) - Zakon_Data.js IMG mówi, która jest która.
# Uruchomienie: python tools/rozszerzenia/D/grafika.py [--podglad PLIK.png]   (pisze tylko własne pliki !$Zak_* i ikony.png paczki)
import os, sys, random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "surowe")
CHARS = os.path.join(ROOT, "img", "characters")
EXT = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior")
WC = os.path.join(EXT, "Winlu Fantasy Exterior", "tilesets", "Fantasy_Outside_C.png")
WD = os.path.join(EXT, "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_D_green.png")
ICONSET = os.path.join(ROOT, "img", "system", "IconSet.png")
OUTLINE = (30, 34, 34, 255)


def raw(name):
    return Image.open(os.path.join(RAW, name + ".png")).convert("RGBA")


def tile(path, cx, cy, w=1, h=1):
    return Image.open(path).convert("RGBA").crop((cx * 48, cy * 48, (cx + w) * 48, (cy + h) * 48))


def frame(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def place(dst, src, dx=0, dy=0, anchor="bottom"):
    """src's content put at the bottom centre of dst (moved by dx, dy)"""
    bb = src.getbbox()
    if not bb:
        return dst
    c = src.crop(bb)
    x = (dst.width - c.width) // 2 + dx
    y = (dst.height - c.height if anchor == "bottom" else (dst.height - c.height) // 2) + dy
    dst.alpha_composite(c, (x, y))
    return dst


def sheet(frames, w, h, name):
    """frames: {(dir, pattern): Image} -> a $ sheet 3 x 4 of w x h (empty cells repeat the first frame)"""
    out = Image.new("RGBA", (w * 3, h * 4), (0, 0, 0, 0))
    first = next(iter(frames.values()))
    for r, d in enumerate((2, 4, 6, 8)):
        for p in range(3):
            f = frames.get((d, p), first)
            assert f.size == (w, h), (name, d, p, f.size)
            out.alpha_composite(f, (p * w, r * h))
    out.save(os.path.join(CHARS, name + ".png"))
    print("zapisano", name, out.size)
    return out


def recolor(im, fn):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = fn(r, g, b, a)
    return im


def lum(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b


def outline_of(im, col=OUTLINE):
    """a 1 px dark outline round the opaque pixels (outside them)"""
    out = im.copy()
    px, po = im.load(), out.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < im.width and 0 <= ny < im.height and px[nx, ny][3] > 128:
                    po[x, y] = col
                    break
    return out


RAVEN = ["..##.....",      # a carved raven seen from the side (beak left), 9 x 6
         ".####....",
         "#######..",
         ".#######.",
         "..#####.#",
         "...#.#..."]


def raven(dst, x, y, col, light=None):
    d = ImageDraw.Draw(dst)
    for j, row in enumerate(RAVEN):
        for i, ch in enumerate(row):
            if ch == "#":
                d.point((x + i, y + j), fill=col)
    if light:
        for j, row in enumerate(RAVEN):
            for i, ch in enumerate(row):
                if ch == "#" and (j + 1 >= len(RAVEN) or RAVEN[j + 1][i] != "#"):
                    d.point((x + i, y + j + 1), fill=light)


def shrink(im, f):
    """content-aware smaller copy (whole rows and columns most like their neighbour taken out) - keeps the 1 px look"""
    w, h = im.size
    nw, nh = int(round(w * f)), int(round(h * f))
    import itertools
    def drop(img, n, axis):
        for _ in range(n):
            px = img.load()
            W, H = img.size
            best, bi = None, None
            rng = range(1, (W if axis == 0 else H) - 1)
            for i in rng:
                s = 0
                for k in range(H if axis == 0 else W):
                    a = px[i, k] if axis == 0 else px[k, i]
                    b = px[i - 1, k] if axis == 0 else px[k, i - 1]
                    s += sum(abs(a[c] - b[c]) for c in range(4))
                if best is None or s < best:
                    best, bi = s, i
            if axis == 0:
                left, right = img.crop((0, 0, bi, H)), img.crop((bi + 1, 0, W, H))
                n2 = Image.new("RGBA", (W - 1, H)); n2.paste(left, (0, 0)); n2.paste(right, (bi, 0))
            else:
                top, bot = img.crop((0, 0, W, bi)), img.crop((0, bi + 1, W, H))
                n2 = Image.new("RGBA", (W, H - 1)); n2.paste(top, (0, 0)); n2.paste(bot, (0, bi))
            img = n2
        return img
    im = drop(im, w - nw, 0)
    return drop(im, h - nh, 1)


# ------------------------------------------------------------------ the foundations (192 x 192, the content in the middle)
def fundament():
    f = raw("fundament")
    sheet({(2, 0): f}, 192, 192, "!$Zak_Fundament")
    return f


# ------------------------------------------------------------------ the plates (96 x 96)
def plyty():
    p = raw("plyta")
    fr = {}
    fr[(4, 0)] = p.copy()
    # the key in the keyhole: a stone key's bow over the slot
    k = p.copy()
    d = ImageDraw.Draw(k)
    bb = keyhole(p)
    kx, ky = bb
    d.rectangle((kx - 4, ky - 9, kx + 4, ky - 3), fill=(120, 130, 128, 255), outline=(40, 46, 46, 255))
    d.point((kx, ky - 6), fill=(60, 66, 66, 255))
    d.line((kx, ky - 2, kx, ky + 4), fill=(96, 104, 102, 255))
    fr[(4, 1)] = k
    # open: the steps down under the slab, the slab pushed aside to the right
    o = frame(96, 96)
    d = ImageDraw.Draw(o)
    d.rectangle((12, 30, 70, 86), fill=(70, 78, 78, 255), outline=(36, 40, 40, 255))
    d.rectangle((16, 34, 66, 82), fill=(14, 14, 18, 255))
    for i in range(5):   # the steps going down into the dark: the nearest light, the far ones lost
        y, sh = 36 + i * 9, 116 - i * 20
        d.rectangle((18 + i, y, 64 - i, y + 4), fill=(sh, sh + 6, sh + 6, 255))
        d.line((18 + i, y, 64 - i, y), fill=(min(255, sh + 30), min(255, sh + 36), min(255, sh + 36), 255))
    sl = p.crop(p.getbbox())
    o.alpha_composite(sl.crop((0, 0, min(sl.width, 60), sl.height)), (52, 96 - sl.height))
    fr[(4, 2)] = o
    # the fallen slab of a tower: the plate made smaller (2/3), a crack across it, darker
    s = shrink(p.crop(p.getbbox()), 0.62)
    s = recolor(s, lambda r, g, b, a: (int(r * 0.88), int(g * 0.88), int(b * 0.9), a))
    d = ImageDraw.Draw(s)
    w, h = s.size
    pts = [(int(w * 0.15), int(h * 0.30)), (int(w * 0.4), int(h * 0.45)), (int(w * 0.55), int(h * 0.42)), (int(w * 0.85), int(h * 0.62))]
    d.line(pts, fill=(28, 32, 32, 255), width=1)
    f0 = frame(96, 96); place(f0, s)
    fr[(2, 0)] = f0
    # ...looked under: moved aside, the dark hollow showing
    f1 = frame(96, 96)
    dd = ImageDraw.Draw(f1)
    dd.ellipse((26, 62, 62, 88), fill=(22, 20, 18, 255), outline=(44, 40, 34, 255))
    place(f1, s, dx=16, dy=-2)
    fr[(2, 1)] = f1
    # the packed earth over the key, and the hole dug out
    e = frame(96, 96)
    soil(e, 48, 82, 17, 9, seed=3, dark=False)
    fr[(6, 0)] = e
    h2 = frame(96, 96)
    soil(h2, 48, 82, 18, 10, seed=4, dark=False)
    ImageDraw.Draw(h2).ellipse((38, 77, 58, 88), fill=(30, 22, 16, 255), outline=(52, 38, 26, 255))
    soil(h2, 66, 80, 7, 4, seed=5, dark=False)
    fr[(6, 1)] = h2
    sheet(fr, 96, 96, "!$Zak_Plyty")


def keyhole(p):
    """the keyhole's centre: the darkest small blob below the plate's middle"""
    px = p.load()
    best = None
    for y in range(p.height // 2, p.height - 10):
        for x in range(p.width // 3, 2 * p.width // 3):
            r, g, b, a = px[x, y]
            if a and lum(r, g, b) < 40:
                if best is None or y < best[1]:
                    best = (x, y)
    return best or (p.width // 2, int(p.height * 0.68))


def soil(im, cx, cy, rx, ry, seed=1, dark=True):
    rnd = random.Random(seed)
    px = im.load()
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1 + rnd.uniform(-0.15, 0.1):
                continue
            base = (88, 66, 44) if not dark else (60, 44, 30)
            v = rnd.randint(-14, 14)
            px[x, y] = (max(0, base[0] + v), max(0, base[1] + v), max(0, base[2] + v // 2), 255)
    return im


# ------------------------------------------------------------------ the shrine (48 x 96)
def kapliczka():
    k = raw("kapliczka")
    g = k.copy()
    d = ImageDraw.Draw(g)
    # the offering at its foot: a coin and a heel of bread on the stones
    d.ellipse((30, 86, 35, 89), fill=(222, 186, 90, 255), outline=(120, 90, 30, 255))
    d.ellipse((12, 84, 21, 90), fill=(176, 124, 70, 255), outline=(84, 54, 28, 255))
    d.line((14, 86, 19, 86), fill=(210, 160, 100, 255))
    sheet({(2, 0): k, (2, 1): g}, 48, 96, "!$Zak_Kapliczka")


# ------------------------------------------------------------------ the perch (64 x 144): dry basin / rain in it
def grzeda():
    w = raw("grzeda")
    dry = recolor(w.copy(), lambda r, g, b, a: (int(lum(r, g, b) * 0.62 + 30), int(lum(r, g, b) * 0.66 + 32), int(lum(r, g, b) * 0.64 + 34), a)
                  if (b > r + 25 and b > 90) else (r, g, b, a))
    sheet({(2, 0): dry, (2, 1): w}, 64, 144, "!$Zak_Grzeda")


# ------------------------------------------------------------------ the gallows (144 x 144)
def szubienica():
    sheet({(2, 0): raw("szubienica")}, 144, 144, "!$Zak_Szubienica")


# ------------------------------------------------------------------ the nest (96 x 64): with / without its feathers
def gniazdo():
    n = raw("gniazdo")
    e = n.copy()
    px = e.load()
    for y in range(e.height):
        for x in range(e.width):
            r, g, b, a = px[x, y]
            if a and lum(r, g, b) > 180:   # (the white feathers: the twigs' colour)
                px[x, y] = (96, 80, 62, a)
    sheet({(2, 0): n, (2, 1): e}, 96, 64, "!$Zak_Gniazdo")


# ------------------------------------------------------------------ the small things (48 x 48)
def male():
    fr = {}
    # the raven stone on the cairn's top (!$Rock_Cairn's top is at row 5): a small flat stone with the carved raven
    t = frame(48, 48)
    d = ImageDraw.Draw(t)
    d.rectangle((17, 1, 31, 9), fill=(150, 160, 156, 255), outline=(40, 46, 46, 255))
    d.line((18, 2, 30, 2), fill=(188, 196, 192, 255))
    raven(t, 20, 3, (34, 36, 40, 255))
    fr[(2, 0)] = t
    rock = tile(WD, 10, 5)
    # szarotka on a rock shelf: the white star flowers of Winlu on a stone
    sz = frame(48, 48)
    place(sz, rock)
    fl = tile(WD, 12, 9)
    place(sz, fl, dy=-12)
    fr[(2, 1)] = sz
    # warzucha: Winlu's leafy plant recoloured blue-green (sea kale) on a stone
    wz = frame(48, 48)
    place(wz, rock)
    leaf = recolor(tile(WD, 9, 7), lambda r, g, b, a: (int(g * 0.48 + 18), int(g * 0.80 + 8), int(g * 0.66 + 22), a))
    place(wz, leaf, dy=-10)
    fr[(2, 2)] = wz
    # picked: the bare stone with a few stems
    pk = frame(48, 48)
    place(pk, rock)
    d = ImageDraw.Draw(pk)
    for x in (21, 24, 27):
        d.line((x, 26, x + 1, 22), fill=(70, 96, 62, 255))
    fr[(4, 0)] = pk
    fr[(4, 1)] = place(frame(48, 48), raw("kolki"))
    # a stone with a raven carved (lore)
    ks = frame(48, 48)
    place(ks, tile(WD, 9, 6))
    bb = ks.getbbox()
    raven(ks, (bb[0] + bb[2]) // 2 - 4, bb[1] + 10, (40, 46, 48, 255), (150, 160, 158, 255))
    fr[(4, 2)] = ks
    # the smugglers' crate (Winlu's covered crate) and the open one
    fr[(6, 0)] = place(frame(48, 48), tile(WC, 6, 5))
    fr[(6, 1)] = place(frame(48, 48), tile(WC, 6, 7))
    # an old fire ring: pebbles round a grey patch of ash and a charred stick
    og = frame(48, 48)
    d = ImageDraw.Draw(og)
    d.ellipse((12, 28, 36, 42), fill=(78, 74, 70, 255))
    d.ellipse((16, 31, 32, 39), fill=(58, 56, 54, 255))
    d.line((17, 36, 30, 33), fill=(30, 24, 20, 255), width=2)
    rnd = random.Random(9)
    import math
    for i in range(9):
        a = i * 2 * math.pi / 9
        x, y = 24 + 14 * math.cos(a), 35 + 8 * math.sin(a)
        d.ellipse((x - 3, y - 2, x + 3, y + 2), fill=(126 + rnd.randint(-10, 10), 132, 128, 255), outline=(48, 52, 52, 255))
    fr[(6, 2)] = og
    # a feather in a crack of the rock (the game's white feather icon)
    ic = Image.open(ICONSET).convert("RGBA")
    feather = ic.crop((455 % 16 * 32, 455 // 16 * 32, 455 % 16 * 32 + 32, 455 // 16 * 32 + 32))
    pf = frame(48, 48)
    place(pf, rock)
    place(pf, feather, dx=2, dy=-14)
    fr[(8, 0)] = pf
    # the white stones of silence: Rock_Flat whitened; one with the small white stone left on it
    flat = Image.open(os.path.join(CHARS, "!$Rock_Flat.png")).convert("RGBA").crop((48, 0, 96, 48))
    white = recolor(flat, lambda r, g, b, a: (min(255, int(lum(r, g, b) * 0.85 + 92)), min(255, int(lum(r, g, b) * 0.85 + 94)), min(255, int(lum(r, g, b) * 0.85 + 98)), a))
    fr[(8, 1)] = white
    wg = white.copy()
    d = ImageDraw.Draw(wg)
    bb = wg.getbbox()
    cx = (bb[0] + bb[2]) // 2
    d.ellipse((cx - 3, bb[1] + 3, cx + 3, bb[1] + 7), fill=(246, 246, 242, 255), outline=(120, 124, 128, 255))
    fr[(8, 2)] = wg
    sheet(fr, 48, 48, "!$Zak_Male")


# ------------------------------------------------------------------ the rider's traces (48 x 48): the stirrup, the saddle, nothing
def slady():
    st = frame(48, 48)
    d = ImageDraw.Draw(st)
    # a rusty iron stirrup lying in the grass: the arch, the tread, the strap's eye
    d.arc((14, 18, 34, 42), 180, 360, fill=(60, 40, 30, 255), width=3)
    d.line((14, 30, 14, 38), fill=(60, 40, 30, 255), width=3)
    d.line((34, 30, 34, 38), fill=(60, 40, 30, 255), width=3)
    d.rectangle((11, 37, 37, 41), fill=(110, 66, 40, 255), outline=(44, 28, 20, 255))
    d.rectangle((21, 14, 27, 19), outline=(60, 40, 30, 255))
    d.arc((15, 19, 33, 41), 200, 340, fill=(146, 92, 58, 255), width=1)
    fr = {(2, 0): st, (2, 1): place(frame(48, 48), raw("siodlo")), (2, 2): frame(48, 48)}
    sheet(fr, 48, 48, "!$Zak_Slady")


# ------------------------------------------------------------------ the cemetery (48 x 96): Winlu's graves, the raven stones, the wall
def groby():
    fr = {}
    cross = tile(WC, 11, 10, 1, 2)
    head = tile(WC, 12, 10, 1, 2)
    fr[(2, 0)] = cross
    # a mossy headstone (Winlu's, greener and darker)
    moss = recolor(head.copy(), lambda r, g, b, a: (int(r * 0.85), int(g * 0.92 + 6), int(b * 0.8), a))
    fr[(2, 1)] = moss
    # the raven headstone overgrown: the raven carved, moss and mud over it
    rk = head.copy()
    bb = stone_box(rk)
    raven(rk, (bb[0] + bb[2]) // 2 - 4, bb[1] + 6, (52, 58, 60, 255))
    rnd = random.Random(12)
    px = rk.load()
    for y in range(bb[1], bb[3]):
        for x in range(bb[0], bb[2]):
            r, g, b, a = px[x, y]
            if a and rnd.random() < 0.38:
                px[x, y] = (int(r * 0.55 + 20), int(g * 0.7 + 30), int(b * 0.45 + 10), a)
    fr[(2, 2)] = rk
    # ...cleaned: the raven sharp, the lines of the name under it
    rc = head.copy()
    bb = stone_box(rc)
    raven(rc, (bb[0] + bb[2]) // 2 - 4, bb[1] + 4, (40, 46, 50, 255), (176, 186, 186, 255))
    d = ImageDraw.Draw(rc)
    for i, y in enumerate((bb[1] + 13, bb[1] + 16)):
        d.line(((bb[0] + bb[2]) // 2 - 6 + i, y, (bb[0] + bb[2]) // 2 + 6 - i, y), fill=(70, 78, 80, 255))
    fr[(4, 0)] = rc
    # the low wall: cut from the foundations' stones (the same stone of the Order)
    f = raw("fundament")
    wallH, wallV, corner = wall_pieces(f)
    fr[(4, 1)] = place(frame(48, 96), wallH)
    fr[(4, 2)] = place(frame(48, 96), wallV)
    fr[(6, 0)] = place(frame(48, 96), corner)
    fr[(6, 1)] = frame(48, 96)
    # the lamp on its post (Winlu's lantern stand)
    fr[(6, 2)] = tile(WC, 7, 14, 1, 2)
    sheet(fr, 48, 96, "!$Zak_Groby")


def stone_box(im):
    """the headstone's box: the grey opaque pixels in the upper half"""
    px = im.load()
    xs, ys = [], []
    for y in range(im.height // 2 + 12):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a > 200 and abs(r - g) < 14 and abs(g - b) < 14 and lum(r, g, b) > 70:
                xs.append(x); ys.append(y)
    if not xs:
        return (12, 20, 36, 44)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def wall_pieces(f):
    """from the foundations' picture: a 48 px run of the top wall, a 48 px run of the left wall, the top left corner block"""
    bb = f.getbbox()
    a = f.load()
    # the top wall: rows from the content's top down to the inner grass; the columns of its straight middle
    top = bb[1]
    h = 26
    run = f.crop((bb[0] + 52, top, bb[0] + 100, top + h))
    left = f.crop((bb[0], top + 30, bb[0] + 24, top + 78))
    corner = f.crop((bb[0], top, bb[0] + 30, top + 30))
    return trim(run), trim(left), trim(corner)


def trim(im):
    bb = im.getbbox()
    return im.crop(bb) if bb else im


# ------------------------------------------------------------------ the wreck's pieces (48 x 48)
def wrak():
    # the small iron-bound chest: Winlu's crate, its lower part sunk in a mound of wet sand
    ch = tile(WC, 6, 5)
    bb = ch.getbbox()
    ch = ch.crop((bb[0], bb[1], bb[2], bb[1] + int((bb[3] - bb[1]) * 0.72)))
    ch = recolor(ch, lambda r, g, b, a: (int(r * 0.78), int(g * 0.74), int(b * 0.72), a))
    c3 = frame(48, 48)
    place(c3, ch, dy=-6)
    d = ImageDraw.Draw(c3)
    rnd = random.Random(31)
    for y in range(34, 46):
        for x in range(6, 42):
            if ((x - 24) / 19) ** 2 + ((y - 41) / 6) ** 2 <= 1 + rnd.uniform(-0.12, 0.05):
                v = rnd.randint(-10, 10)
                d.point((x, y), fill=(198 + v, 182 + v, 140 + v, 255))
    fr = {(2, 0): place(frame(48, 48), raw("wrak1")), (2, 1): place(frame(48, 48), raw("wrak2")), (2, 2): c3}
    h = frame(48, 48)
    d = ImageDraw.Draw(h)
    d.ellipse((12, 28, 36, 42), fill=(150, 132, 96, 255))
    d.ellipse((16, 31, 32, 40), fill=(96, 84, 64, 255))
    d.ellipse((19, 33, 29, 38), fill=(70, 74, 72, 255))
    fr[(4, 0)] = h
    sheet(fr, 48, 48, "!$Zak_Wrak")


# ------------------------------------------------------------------ the chamber (96 x 96): the wall with the four towers, the basin
def komora():
    fr = {(2, 0): place(frame(96, 96), raw("komora_mapa")), (2, 1): place(frame(96, 96), raw("misa"))}
    sheet(fr, 96, 96, "!$Zak_Komora")


# ------------------------------------------------------------------ the icons 512-527 (the package's row of IconSet: 512 x 32)
def ikony():
    from ikony_d import draw_icons
    row = draw_icons(Image.open(ICONSET).convert("RGBA"), raw)
    row.save(os.path.join(HERE, "ikony.png"))
    print("zapisano ikony.png", row.size)


if __name__ == "__main__":
    sys.path.insert(0, HERE)
    fundament(); plyty(); kapliczka(); grzeda(); szubienica(); gniazdo(); male(); slady(); groby(); wrak(); komora(); ikony()
