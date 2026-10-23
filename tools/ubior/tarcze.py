# tools/ubior/tarcze.py - tarcze w bloku (js/plugins/Ubior_Bron.js; docs/ekwipunek/PLAN_BRON_ZBROJE.md, punkt 3 i 5).
#
# Dziś tarcza w walce to ikona przedmiotu przed bohaterem, gdy trzyma gardę (Combat_UI.js updateShield; tyłem - niewidoczna).
# Ubior_Bron.js podmienia ją na rysunek tarczy w stylu bohatera, w kolorach materiału. Każdy rodzaj: img/system/Ubior_Tarcza_<Rodzaj>.png,
# 2 klatki 28x30: [0] z przodu (bohater patrzy w dół - widać lico tarczy), [1] z boku (w lewo; w prawo - lustro): lico skrócone, widać
# grubość brzegu. Szablon jak broń (tools/ubior/bron.py): kontur (10,9,8); METAL szarości r=g=b -> rampa metalu (obręcz, umbo, nity,
# blacha); DREWNO zielonkawe (g > r = b) -> rampa drewna (deski); AKCENT czerwonawy (r > g = b) -> rampa malowania (pole, godło).
# Światło z lewej góry, wypukłe lico (jaśniej u góry z lewej), 1 px kontur.
#   python tools/ubior/tarcze.py [--podglad PLIK]
import sys, os, math
import numpy as np
from PIL import Image

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
W, H = 28, 30
SS = 4
KONTUR = (10, 9, 8)
GREY = [52, 78, 106, 134, 162, 190, 214]
WOOD = [70, 100, 130, 160, 190]
ACC = [110, 150, 190, 230]


def col(cls, k):
    if cls == 'm':
        v = GREY[max(0, min(6, k))]
        return (v, v, v)
    if cls == 'w':
        v = WOOD[max(0, min(4, k))]
        return (v // 2, v, v // 2)
    v = ACC[max(0, min(3, k))]
    return (v, int(v * 0.3), int(v * 0.3))


# shapes in the front frame's units (px, centre (14, 15)): inside(x, y) for a point
def shape(kind):
    cx, cy = 13.5, 14.5
    if kind in ('drewniana', 'okuta', 'umbo_braz'):
        r = 11.5
        return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    if kind == 'puklerz':
        r = 8.0
        return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    if kind == 'migdalowa':
        # almond: round top, pointed bottom
        def f(x, y):
            if y < cy - 3:
                return (x - cx) ** 2 / 10.5 ** 2 + (y - (cy - 3)) ** 2 / 10.0 ** 2 <= 1
            t = (y - (cy - 3)) / 16.0
            return abs(x - cx) <= 10.5 * (1 - t ** 1.5) and t <= 1
        return f

    # heater: flat top, straight sides, curving to a point
    def g(x, y):
        top = cy - 12
        if y < top:
            return False
        if y < cy:
            return abs(x - cx) <= 11
        t = (y - cy) / 14.0
        return t <= 1 and abs(x - cx) <= 11 * math.sqrt(max(0, 1 - t * t))
    return g


def draw_front(kind):
    inside = shape(kind)
    cx, cy = 13.5, 14.5
    img = np.zeros((H, W, 4), np.uint8)
    m = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            m[y, x] = inside(x + 0.5, y + 0.5)
    # the rim: pixels of the shape within 1.5 px of its edge
    edge = np.zeros_like(m)
    for y in range(H):
        for x in range(W):
            if not m[y, x]:
                continue
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-2, 0), (2, 0), (0, -2), (0, 2)):
                yy, xx = y + dy, x + dx
                if not (0 <= yy < H and 0 <= xx < W) or not m[yy, xx]:
                    edge[y, x] = True
                    break
    rmax = 12.0
    for y in range(H):
        for x in range(W):
            if not m[y, x]:
                continue
            dx, dy = (x + 0.5 - cx) / rmax, (y + 0.5 - cy) / rmax
            lit = 0.55 - 0.5 * dx - 0.45 * dy       # convex face, the light from the top left
            k5 = int(round(1 + lit * 3))             # 0..4
            k7 = int(round(2 + lit * 4))             # 0..6
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            c = None
            rim_metal = kind in ('okuta', 'umbo_braz', 'puklerz', 'migdalowa', 'zelazna', 'zakonna', 'skrzydlata_straz')
            if edge[y, x]:
                c = col('m', k7 + 1) if rim_metal else col('w', k5 - 1)
                if rim_metal and (x + y) % 6 == 0:
                    c = col('m', 6)                  # nit na obręczy
            elif kind == 'drewniana':
                plank = int((x - 2) // 5)
                c = col('w', k5 - (1 if (x - 2) % 5 == 0 else 0) + (plank % 2 == 1) * 0)
                if abs(y - 9) < 1 or abs(y - 20) < 1:
                    c = col('w', k5 - 1)             # listwy z tyłu prześwitują
            elif kind == 'okuta':
                c = col('w', k5 - (1 if (x - 2) % 5 == 0 else 0))
                if abs(y + 0.5 - cy) <= 1.0:
                    c = col('m', k7)                 # okucie w poprzek
            elif kind in ('umbo_braz', 'puklerz'):
                if kind == 'umbo_braz':
                    # painted field: two colours in quarters, wooden under it
                    q = ((x + 0.5 > cx) != (y + 0.5 > cy))
                    c = col('a', k5 - 1 + (1 if q else 0)) if not q else col('w', k5)
                else:
                    c = col('m', k7)
                    if 5.0 <= d <= 6.0:
                        c = col('m', k7 - 2)          # pierścień wokół umba
            elif kind == 'migdalowa':
                stripe = abs(x + 0.5 - cx) <= 2.5
                c = col('a', k5 - 1) if stripe else col('w', k5)
            elif kind == 'zelazna':
                c = col('m', k7)
                if abs(x + 0.5 - cx) <= 0.6:
                    c = col('m', k7 + 1)              # grzbiet
            elif kind == 'zakonna':
                c = col('m', k7)
                cross = (abs(x + 0.5 - cx) <= 1.6 and cy - 9 <= y <= cy + 9) or (abs(y + 0.5 - (cy - 3)) <= 1.6 and abs(x + 0.5 - cx) <= 7)
                if cross:
                    c = col('a', k5 - 1 + 1)
            elif kind == 'skrzydlata_straz':
                c = col('m', k7 - 1)
                # skrzydła: dwa łuki piór w akcencie
                for side in (-1, 1):
                    for i in range(4):
                        px0 = cx + side * (2 + i * 2.0)
                        py0 = cy - 4 + i * 1.6
                        if abs(x + 0.5 - px0) <= 1.0 and py0 <= y + 0.5 <= py0 + 6 - i:
                            c = col('a', 3 - (i // 2))
                if abs(x + 0.5 - cx) <= 1.0 and cy - 6 <= y <= cy + 5:
                    c = col('a', 2)
            # the boss (umbo): round shields
            if kind in ('drewniana', 'okuta', 'umbo_braz', 'puklerz') and not edge[y, x]:
                rb = 3.2 if kind != 'puklerz' else 3.6
                if d <= rb:
                    hl = (x + 0.5 - cx) + (y + 0.5 - cy) < -0.8
                    c = col('m', 6 if hl else 3) if kind != 'drewniana' else col('w', 4 if hl else 2)
            img[y, x, :3] = c
            img[y, x, 3] = 255
    return outline(img)


def outline(img):
    out = img.copy()
    h, w = img.shape[:2]
    a = img[:, :, 3] > 0
    for y in range(h):
        for x in range(w):
            if a[y, x]:
                continue
            if any(0 <= y + dy < h and 0 <= x + dx < w and a[y + dy, x + dx] for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1))):
                out[y, x, :3] = KONTUR
                out[y, x, 3] = 255
    # the boss and the face divided by a dark line where a boss meets the face (round shields): nothing more - keep it simple
    return out


def draw_side(front):
    """z boku: lico skrócone do ~45% szerokości (próbkowanie co ~2,2 px), z prawej grubość brzegu (2 px, ciemniejsza)"""
    h, w = front.shape[:2]
    a = front[:, :, 3] > 0
    xs = np.nonzero(a.any(0))[0]
    x0, x1 = xs.min(), xs.max()
    width = x1 - x0 + 1
    nw = max(5, int(round(width * 0.45)))
    out = np.zeros_like(front)
    ox = (w - nw) // 2 - 1
    for y in range(h):
        for i in range(nw):
            sx = x0 + int(i * width / nw + width / nw / 2)
            if a[y, sx]:
                out[y, ox + i] = front[y, sx]
    # the edge's thickness on the right (the far side of the face)
    for y in range(h):
        row = np.nonzero(out[y, :, 3] > 0)[0]
        if not len(row):
            continue
        xr = row.max()
        for k in (1, 2):
            if xr + k < w:
                base = out[y, xr - 1, :3].astype(int) if xr - 1 >= 0 else np.array([80, 80, 80])
                out[y, xr + k, :3] = KONTUR if k == 2 else tuple(int(v * 0.7) for v in base)
                out[y, xr + k, 3] = 255
    return out


KINDS = ['drewniana', 'okuta', 'umbo_braz', 'puklerz', 'migdalowa', 'zelazna', 'zakonna', 'skrzydlata_straz']


def main(argv):
    out = {}
    for k in KINDS:
        f = draw_front(k)
        s = draw_side(f)
        sheet = np.concatenate([f, s], axis=1)
        name = 'Ubior_Tarcza_' + ''.join(p[0].upper() + p[1:] for p in k.split('_'))
        Image.fromarray(sheet, 'RGBA').save(os.path.join(GAME, 'img', 'system', name + '.png'))
        out[k] = sheet
        print('->', name)
    if '--podglad' in argv:
        p = argv[argv.index('--podglad') + 1]
        RAMPS = {'m': [(27, 29, 32), (44, 47, 51), (64, 68, 74), (86, 91, 98), (110, 116, 123), (136, 142, 149), (164, 169, 174)],
                 'w': [(58, 36, 20), (82, 52, 29), (106, 69, 39), (131, 88, 51), (156, 108, 66)],
                 'a': [(74, 16, 16), (122, 28, 24), (168, 42, 34), (204, 68, 52)]}
        big = Image.new('RGBA', (W * 2 * len(KINDS) + 8 * len(KINDS), H), (86, 110, 76, 255))
        for i, k in enumerate(KINDS):
            sh = out[k].copy()
            for y in range(sh.shape[0]):
                for x in range(sh.shape[1]):
                    r, g, b, a = [int(v) for v in sh[y, x]]
                    if not a or (r < 20 and g < 20 and b < 20):
                        continue
                    if abs(r - g) < 8 and abs(g - b) < 8:
                        sh[y, x, :3] = RAMPS['m'][GREY.index(min(GREY, key=lambda q: abs(q - r)))]
                    elif g > r:
                        sh[y, x, :3] = RAMPS['w'][WOOD.index(min(WOOD, key=lambda q: abs(q - g)))]
                    else:
                        sh[y, x, :3] = RAMPS['a'][ACC.index(min(ACC, key=lambda q: abs(q - r)))]
            big.alpha_composite(Image.fromarray(sh), (i * (W * 2 + 8), 0))
        big.resize((big.width * 6, big.height * 6), Image.NEAREST).save(p)


if __name__ == '__main__':
    main(sys.argv[1:])
