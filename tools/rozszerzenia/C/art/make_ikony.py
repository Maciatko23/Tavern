# Ikony paczki C (0 generacji): tools/rozszerzenia/C/ikony.png - PNG 512x32, 16 pól 32x32, ikony w kolumnach 0-4:
#   0 Przyprawy        - płócienny woreczek (ikona 338 przemalowana) przewiązany sznurkiem, na wierzchu kolorowe przyprawy
#   1 Mapa okolic      - złożona w harmonijkę pergaminowa mapa (kolory pergaminu z 439), las, rzeka, czerwona trasa i krzyżyk
#   2 Skrzynia przemytu- mała skrzynka z ciemnego drewna, żelazne okucia, wypalony kruk na wieku
#   3 Dziennik kopacza - brudny skórzany notes z rzemieniem i oślimi uszami kartek
#   4 Wełniany koc     - zwinięty kremowo-szary koc (kształt kłody 381 przemalowany) ściągnięty rzemieniem
# Styl jak ikony gry od 320 w górę: bez tła, ciemny obrys 1 px (42,26,16), 3-4 płaskie tony, światło z lewej góry.
# Uruchom: python tools/rozszerzenia/C/art/make_ikony.py   (deterministyczne)
import os
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))
OUT = os.path.join(HERE, "..", "ikony.png")
ICONSET = os.path.join(GAME, "img", "system", "IconSet.png")
OUTLINE = (42, 26, 16)


def icon(n):
    im = Image.open(ICONSET).convert("RGBA")
    r, c = divmod(n, 16)
    return np.array(im.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32))).astype(np.int32)


def luma(a):
    return (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000


def ramp(a, mask, stops):
    """Pixels of `mask` recoloured by their luma through the ramp (luma 0..255 -> colour), flat steps kept."""
    L = luma(a)
    xs = [s[0] for s in stops]
    for ch in range(3):
        a[..., ch] = np.where(mask, np.interp(L, xs, [s[1][ch] for s in stops]).astype(np.int32), a[..., ch])


def poly_mask(pts):
    m = Image.new("L", (32, 32), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.array(m) > 0


def fill(a, mask, col):
    a[mask, 0], a[mask, 1], a[mask, 2], a[mask, 3] = col[0], col[1], col[2], 255


def px(a, pts, col):
    for x, y in pts:
        if 0 <= x < 32 and 0 <= y < 32:
            a[y, x] = (col[0], col[1], col[2], 255)


def hline(a, x0, x1, y, col):
    px(a, [(x, y) for x in range(x0, x1 + 1)], col)


def vline(a, x, y0, y1, col):
    px(a, [(x, y) for y in range(y0, y1 + 1)], col)


def outline(a, col=OUTLINE):
    """A 1 px dark outline round the whole silhouette (4-neighbourhood)."""
    op = a[..., 3] > 0
    grow = op.copy()
    grow[1:, :] |= op[:-1, :]
    grow[:-1, :] |= op[1:, :]
    grow[:, 1:] |= op[:, :-1]
    grow[:, :-1] |= op[:, 1:]
    fill(a, grow & ~op, col)


def blank():
    return np.zeros((32, 32, 4), np.int32)


# ---------------------------------------------------------------- 0 Przyprawy
def przyprawy():
    a = icon(338)
    op = a[..., 3] > 0
    L = luma(a)
    top = op & (np.arange(32)[:, None] <= 12) & (L > 190)               # the cream flour heap on top
    body = op & ~top & (L > 70)
    # the sack: a lighter, greyer linen
    ramp(a, body, [(0, (40, 30, 22)), (95, (112, 98, 78)), (130, (150, 136, 112)), (160, (186, 172, 146)), (200, (214, 204, 180))])
    # the spices: three heaps side by side - red paprika, golden-orange, green herbs - each lit from the upper left, a few grains
    # of the neighbour mixed in (fixed pattern)
    rs = np.random.RandomState(7)
    ZONES = [((214, 82, 52), (176, 52, 36), (132, 36, 28)), ((240, 196, 80), (222, 142, 46), (174, 102, 36)),
             ((150, 172, 82), (112, 140, 62), (80, 104, 46))]
    ys, xs = np.nonzero(top)
    y0 = ys.min()
    for y, x in zip(ys, xs):
        z = 0 if x <= 12 else (1 if x <= 18 else 2)
        if rs.rand() < 0.12:
            z = (z + rs.choice([1, 2])) % 3
        t = 0 if (y - y0) <= 1 else (1 if (y - y0) <= 3 else 2)
        if x in (12, 18) and t < 2:
            t += 1                                                     # (the dips between the heaps)
        a[y, x, :3] = ZONES[z][t]
    # the twine round the neck, a knot and two loose ends
    TW, TWD = (196, 160, 96), (128, 92, 48)
    hline(a, 9, 23, 12, TW)
    hline(a, 9, 23, 13, TWD)
    px(a, [(15, 14), (16, 14), (17, 14), (16, 15)], TW)
    px(a, [(15, 15), (17, 15), (14, 16), (18, 16), (14, 17), (19, 17)], TWD)
    px(a, [(13, 17), (13, 18), (19, 18), (20, 18)], OUTLINE)
    return a


# ---------------------------------------------------------------- 1 Mapa okolic
def mapa():
    a = blank()
    P1, P2, P3, PD = (236, 222, 184), (214, 196, 150), (170, 148, 104), (128, 106, 70)
    # three panels folded like an accordion: the outer two in light, the middle one in shade; their edges zig a little
    left = poly_mask([(3, 7), (11, 5), (11, 25), (3, 27)])
    mid = poly_mask([(12, 5), (20, 7), (20, 27), (12, 25)])
    right = poly_mask([(21, 7), (28, 5), (28, 25), (21, 27)])
    fill(a, left, P2)
    fill(a, mid, P3)
    fill(a, right, P2)
    # light along the top edge of the lit panels, shade at the foot
    for m, lit in ((left, P1), (right, P1)):
        ys, xs = np.nonzero(m)
        for y, x in zip(ys, xs):
            if not m[y - 1, x]:
                a[y, x, :3] = lit
    vline(a, 11, 6, 25, PD)                                        # (the fold lines)
    vline(a, 20, 8, 27, PD)
    # forest blots (green), a river (blue), hills (brown)
    G, GD = (108, 140, 74), (74, 104, 52)
    for cx, cy in ((6, 11), (8, 13), (5, 14), (24, 20), (26, 18)):
        px(a, [(cx, cy), (cx + 1, cy)], G)
        px(a, [(cx, cy + 1), (cx + 1, cy + 1)], GD)
    B = (86, 130, 168)
    px(a, [(14, 8), (14, 9), (15, 10), (15, 11), (14, 12), (14, 13), (15, 14), (16, 15), (16, 16), (17, 17), (17, 18), (18, 19), (19, 20)], B)
    BR = (150, 110, 70)
    px(a, [(23, 10), (24, 9), (25, 10), (26, 11)], BR)
    # the red route: dashes from the lower left to a cross in the upper right
    R = (196, 46, 36)
    px(a, [(5, 23), (6, 22), (8, 21), (9, 20), (11, 19), (12, 18), (14, 18), (15, 17)], R)
    px(a, [(18, 15), (19, 14), (21, 13), (22, 12)], R)
    px(a, [(23, 14), (24, 15), (25, 14), (24, 13), (23, 12), (25, 12)], R)   # (the X)
    px(a, [(24, 14)], (150, 30, 24))
    outline(a)
    return a


# ---------------------------------------------------------------- 2 Skrzynia przemytu
def skrzynia():
    a = blank()
    W1, W2, W3, W4 = (60, 38, 26), (82, 54, 36), (106, 72, 48), (132, 92, 62)    # dark wood, dark to light
    I1, I2, I3 = (54, 54, 62), (96, 98, 108), (150, 152, 160)                   # iron
    lid = poly_mask([(4, 6), (27, 6), (27, 14), (4, 14)])        # the lid seen from above
    front = poly_mask([(4, 15), (27, 15), (27, 27), (4, 27)])
    fill(a, lid, W3)
    fill(a, front, W2)
    hline(a, 4, 27, 6, W4)                                       # (the lid's lit back edge)
    for y in (9, 12):
        hline(a, 5, 26, y, W2)                                   # (plank seams on the lid)
    for y in (19, 23):
        hline(a, 4, 27, y, W1)                                   # (plank seams on the front)
    hline(a, 4, 27, 15, W1)                                      # (the lid's shadow line)
    vline(a, 27, 15, 27, W1)
    hline(a, 4, 27, 27, W1)
    # iron bands over the lid and down the front, rivets
    for x in (6, 24):
        vline(a, x, 6, 27, I2)
        vline(a, x + 1, 6, 27, I1)
        px(a, [(x, 7), (x, 16), (x, 25)], I3)
    hline(a, 4, 27, 14, I1)                                      # (the lid's iron rim)
    # the lock plate
    for y in range(17, 22):
        hline(a, 14, 17, y, I2)
    vline(a, 17, 17, 21, I1)
    hline(a, 14, 17, 17, I3)
    px(a, [(15, 19), (16, 19), (15, 20)], (24, 20, 18))
    # the raven burnt into the lid: a black bird in profile (head and beak to the right, tail to the left), scorched round
    K, SC = (24, 16, 12), (78, 50, 32)
    ox, oy = 11, 7
    BIRD = [(7, 0), (8, 0), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (0, 2), (1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2), (7, 2),
            (2, 3), (3, 3), (4, 3), (5, 3), (6, 3), (4, 4), (6, 4)]
    for x, y in BIRD:
        a[oy + y, ox + x, :3] = K
    a[oy + 1, ox + 9, :3] = (60, 52, 44)                         # (the beak)
    a[oy + 0, ox + 8, :3] = (90, 70, 50)                         # (the eye: a glint)
    for x, y in [(6, 0), (9, 0), (2, 1), (9, 2), (8, 2), (7, 3), (1, 3), (-1, 2), (3, 4), (5, 4), (7, 4)]:
        if tuple(a[oy + y, ox + x, :3]) not in (K,):
            a[oy + y, ox + x, :3] = SC
    outline(a)
    return a


# ---------------------------------------------------------------- 3 Dziennik kopacza
def dziennik():
    a = blank()
    L1, L2, L3, L4 = (62, 42, 28), (90, 62, 40), (118, 84, 56), (144, 108, 74)
    PG, PGD = (222, 208, 172), (176, 160, 124)
    pages = poly_mask([(9, 6), (26, 5), (26, 26), (9, 27)])      # the page block peeping out on the right and the foot
    fill(a, pages, PG)
    for y in range(7, 27, 2):
        hline(a, 24, 26, y, PGD)                                 # (page edges)
    cover = poly_mask([(6, 4), (23, 4), (23, 25), (6, 26)])
    fill(a, cover, L3)
    vline(a, 6, 4, 26, L1)                                       # (the spine)
    vline(a, 7, 4, 26, L2)
    vline(a, 8, 5, 25, L4)
    hline(a, 9, 22, 5, L4)                                       # (the lit top edge)
    vline(a, 23, 5, 25, L2)
    hline(a, 9, 23, 25, L2)
    # a dog-eared corner (lower right of the cover)
    px(a, [(22, 24), (21, 24), (22, 23)], PG)
    px(a, [(20, 24), (22, 22)], OUTLINE)
    # the strap round it and its buckle
    for y in (14, 15, 16):
        hline(a, 6, 26, y, L1 if y == 16 else L2)
    hline(a, 6, 26, 14, L4)
    for y in range(13, 18):
        px(a, [(24, y)], (176, 146, 80))
    px(a, [(25, 13), (25, 17)], (176, 146, 80))
    px(a, [(25, 14), (25, 15), (25, 16)], (110, 88, 44))
    # dirt and clay smudges, a scratched mark (two crossed picks scratched into the cover)
    D, D2 = (96, 86, 70), (78, 68, 54)
    px(a, [(11, 21), (12, 21), (12, 22), (18, 8), (19, 8), (19, 9), (10, 9), (21, 20), (20, 21), (14, 23)], D)
    px(a, [(13, 22), (20, 9), (21, 21)], D2)
    S = (78, 52, 34)
    px(a, [(12, 7), (13, 8), (14, 9), (15, 10), (16, 11), (16, 7), (15, 8), (13, 10), (12, 11)], S)
    outline(a)
    return a


# ---------------------------------------------------------------- 4 Wełniany koc
def koc():
    a = icon(381)
    op = a[..., 3] > 0
    rgb = a[..., :3]
    endface = op & (rgb[..., 0] >= 170) & (rgb[..., 0] - rgb[..., 2] > 60) & (rgb[..., 1] >= 120)   # the log's light end (rings)
    endface |= op & (np.arange(32)[None, :] >= 23) & (np.arange(32)[:, None] <= 23) & (luma(a) > 110)
    body = op & ~endface & (luma(a) > 50)
    ramp(a, body, [(0, (40, 36, 30)), (65, (118, 110, 96)), (95, (156, 148, 130)), (125, (192, 184, 162)), (150, (218, 210, 186)),
                   (180, (232, 226, 204))])
    ramp(a, endface, [(0, (64, 58, 50)), (120, (156, 148, 130)), (150, (200, 192, 170)), (175, (230, 222, 198)), (220, (242, 236, 216))])
    # the blanket's woven stripes (two dark grey bands near the end) - lines across the roll, along the end face's slant
    ST = (128, 118, 102)
    for dx in (0, 1):
        for y in range(8, 27):
            x = 20 + dx - (y - 8) // 9
            if body[y, x]:
                a[y, x, :3] = ST
    # the leather strap across the roll with a brass buckle
    S1, S2 = (96, 60, 34), (132, 88, 52)
    for y in range(6, 30):
        x = 12 - (y - 6) // 12
        for xx, c in ((x, S2), (x + 1, S2), (x + 2, S1)):
            if op[y, xx] and a[y, xx, :3].tolist() != list(OUTLINE):
                a[y, xx, :3] = c
    px(a, [(11, 17), (12, 17), (13, 17), (11, 19), (13, 19)], (214, 176, 90))
    px(a, [(11, 18), (13, 18), (12, 19)], (150, 112, 50))
    px(a, [(12, 18)], (60, 40, 22))
    return a


if __name__ == "__main__":
    sheet = np.zeros((32, 512, 4), np.uint8)
    for i, f in enumerate((przyprawy, mapa, skrzynia, dziennik, koc)):
        sheet[:, i * 32:(i + 1) * 32] = np.clip(f(), 0, 255).astype(np.uint8)
    Image.fromarray(sheet, "RGBA").save(OUT)
    print("ok", os.path.normpath(OUT))
