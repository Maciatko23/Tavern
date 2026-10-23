# tools/ubior/miecz_arkusz.py - arkusz zamachu mieczem img/system/Hero_Sword.png (2026-10-23, PixelLab).
#
# Źródło: stan "Sword" postaci "Wiesniak I pro" (b2072ed2-c074-4917-8c5b-4e404e354931, 96x96, miecz w prawej ręce) i jego animacje
# v3 "sword16" (16 klatek + klatka startowa; klatki w tools/ubior/pixellab/miecz/<kierunek>/<i>.png): południe i wschód
# (wypad, ręka z mieczem wyciągnięta daleko przed siebie, szerokie cięcie), północ (tyłem - wyszła bez białych plam i bez obracania
# się bokiem, więc bez obejścia z edit_image_pro_flash). Zachód = lustro wschodu.
#
# Układ jak inne zamachy (ChoppableTree_Swing): 4 wiersze (dół, lewo, prawo, góra) po 17 klatek 96x96; obrót bazowy postaci leży
# w klatce tak jak w Hero_Club (stopy ~ (48, 79)); klatka ciosu (HeroLook.js SWINGS 21): [9, 11, 11, 11]. Z klatek PixelLab wybrane
# płynne i spójne (KLATKI: na południu cięcie w prawo i zamach z powrotem, bez dwóch dziwnych klatek pośrodku; na wschodzie zamiast
# klatek 12-13 z rozbłyskiem na ostrzu - pełne wyciągnięcie 11 dłużej); pojedyncze oderwane piksele (iskry) usunięte.
#
#   python tools/ubior/miecz_arkusz.py [--podglad PLIK.png]
import sys, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import maski as MK   # noqa: E402

GAME = MK.GAME
SRC = os.path.join(HERE, 'pixellab', 'miecz')
OUT = os.path.join(GAME, 'img', 'system', 'Hero_Sword.png')
CELL = 96
# wiersz arkusza: (kierunek PixelLab, lustro, klatki źródła po kolei)
KLATKI = [
    ('south', False, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 13, 14, 14, 15, 16, 16]),
    ('east', True, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 11, 14, 15, 16, 16]),
    ('east', False, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 11, 14, 15, 16, 16]),
    ('north', False, list(range(17))),
]
HIT = [9, 11, 11, 11]
BASE_DIR = ['south', 'west', 'east', 'north']
# gdzie obrót bazowy leży w klatkach Hero_Club (zgodność stóp i kotwic z resztą zamachów)
BASE_AT = {'south': (17, 18), 'west': (16, 17), 'east': (17, 17), 'north': (17, 19)}


def load(d, i, mirror):
    a = np.array(Image.open(os.path.join(SRC, d, '%d.png' % i)).convert('RGBA'))
    return a[:, ::-1].copy() if mirror else a


def base_offset(B, S):
    """gdzie w klatce S leży obrót bazowy B (najwięcej pikseli prawie równych)"""
    best = None
    for dy in range(0, S.shape[0] - 63):
        for dx in range(0, S.shape[1] - 63):
            sub = S[dy:dy + 64, dx:dx + 64]
            both = (B[:, :, 3] > 0) & (sub[:, :, 3] > 0)
            d = np.abs(B[:, :, :3].astype(int) - sub[:, :, :3].astype(int)).sum(2)
            sc = int((both & (d < 12)).sum())
            if best is None or sc > best[0]:
                best = (sc, dx, dy)
    return best[1], best[2]


def despeckle(a):
    """oderwane grupki do 3 pikseli (iskry, rozbłyski obok ostrza) - precz"""
    op = a[:, :, 3] > 0
    lab, n = MK.components(op)
    for k in range(1, n + 1):
        m = lab == k
        if m.sum() <= 3:
            a[m] = 0
    return a


def main(argv):
    walk = np.array(Image.open(os.path.join(GAME, 'img', 'characters', 'Hero_Walk.png')).convert('RGBA'))
    rows8 = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east']
    sheet = np.zeros((CELL * 4, CELL * 17, 4), np.uint8)
    for r, (d, mirror, cols) in enumerate(KLATKI):
        bd = BASE_DIR[r]
        B = walk[rows8.index(bd) * 64:(rows8.index(bd) + 1) * 64, :64]
        f0 = load(d, 0, mirror)
        ox, oy = base_offset(B, f0)
        tx, ty = BASE_AT[bd]
        dx, dy = tx - ox, ty - oy
        print('wiersz %d (%s%s): obrót bazowy w klatce PixelLab (%d, %d) -> przesunięcie (%d, %d)' % (r, d, ' lustro' if mirror else '', ox, oy, dx, dy))
        for c, i in enumerate(cols):
            a = despeckle(load(d, i, mirror))
            cell = np.zeros((CELL, CELL, 4), np.uint8)
            ys, xs = np.nonzero(a[:, :, 3] > 0)
            Y, X = ys + dy, xs + dx
            ok = (Y >= 0) & (Y < CELL) & (X >= 0) & (X < CELL)
            if (~ok).any():
                print('  klatka %d: %d px poza komórką' % (c, int((~ok).sum())))
            cell[Y[ok], X[ok]] = a[ys[ok], xs[ok]]
            sheet[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL] = cell
    Image.fromarray(sheet, 'RGBA').save(OUT, optimize=True)
    print('->', os.path.relpath(OUT, GAME).replace('\\', '/'), sheet.shape[1], 'x', sheet.shape[0])
    if '--podglad' in argv:
        p = argv[argv.index('--podglad') + 1]
        bg = Image.new('RGBA', (sheet.shape[1], sheet.shape[0]), (60, 90, 60, 255))
        bg.alpha_composite(Image.fromarray(sheet, 'RGBA'))
        bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST).save(p)


if __name__ == '__main__':
    main(sys.argv[1:])
