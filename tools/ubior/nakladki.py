# tools/ubior/nakladki.py - nakładki ubioru rysowane kodem (js/plugins/Ubior.js), w stylu bohatera: czarny kontur 1 px (#0a0908),
# światło z lewej góry, kilka tonów na kolor. Szablony "do przemalowania" są w szarościach - gra zamienia je na rampę wzoru
# (czapka brązowa / szara / zielona, torba płócienna / skórzana) tak samo jak koszulę: jasność -> kolor rampy.
#   img/system/Ubior_Czapka.png    filcowa czapka (32x12; okrągła - jedna klatka na wszystkie strony), kotwica (16, 2) = góra włosów
#   img/system/Ubior_Plecak.png    plecak (3 klatki 20x20: przód - szelki, bok - profil, tył), kolory własne
#   img/system/Ubior_Torba.png     torba przez ramię (9x8, szablon), Ubior_Sakiewka.png - sakiewka przy pasie (6x7, szablon)
# Kapelusz słomkowy: tools/ubior/kapelusz.py. Chusta, opaska i buty z cholewką - bez obrazków: gra rysuje je z maski (Ubior.js).
#   python tools/ubior/nakladki.py [--podglad PLIK]
import sys, os
import numpy as np
from PIL import Image

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
K = (10, 9, 8)
GREY = [(52, 52, 52), (78, 78, 78), (106, 106, 106), (134, 134, 134), (162, 162, 162), (190, 190, 190), (214, 214, 214)]   # szablon: ciemny -> jasny


def canvas(w, h):
    return np.zeros((h, w, 4), np.uint8)


def put(img, x, y, c):
    h, w = img.shape[:2]
    if 0 <= x < w and 0 <= y < h:
        img[y, x, :3] = c
        img[y, x, 3] = 255


def outline(img):
    """czarny kontur 1 px wokół kształtu (4-sąsiedztwo)"""
    h, w = img.shape[:2]
    shape = img[:, :, 3] > 0
    for y in range(h):
        for x in range(w):
            if not shape[y, x] and any(0 <= y + dy < h and 0 <= x + dx < w and shape[y + dy, x + dx] for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                put(img, x, y, K)


def czapka():
    """filcowa czapka: kopuła przylegająca do głowy, wywinięty brzeg, mały guzik na czubku"""
    img = canvas(32, 12)
    cx = 15.5
    dome = {2: 4.6, 3: 7.2, 4: 8.6, 5: 9.4, 6: 9.8, 7: 10.0}
    for y, hw in dome.items():
        for x in range(32):
            dx = (x - cx) / hw
            if abs(x - cx) <= hw:
                # światło z lewej góry: lewa strona i góra jaśniejsze
                lit = 0.62 - 0.38 * dx - 0.07 * (y - 2)
                k = int(round(1 + lit * 5))
                if (x + 2 * y) % 5 == 0:   # (filc: lekka faktura)
                    k -= 1
                put(img, x, y, GREY[max(0, min(6, k))])
    # wywinięty brzeg: dwa wiersze, szerszy, jaśniejsza górna krawędź
    for y, hw in ((8, 10.6), (9, 10.4)):
        for x in range(32):
            if abs(x - cx) <= hw:
                dx = (x - cx) / hw
                k = (4 if y == 8 else 2) + (1 if dx < -0.3 else 0) - (1 if dx > 0.45 else 0)
                put(img, x, y, GREY[max(0, min(6, k))])
    # szew między kopułą a brzegiem
    for x in range(32):
        if abs(x - cx) <= 9.6:
            put(img, x, 7, GREY[1] if (x - cx) > -6 else GREY[2])
    # guzik na czubku
    put(img, 15, 1, GREY[3]); put(img, 16, 1, GREY[2])
    outline(img)
    return img


PACK = {'.': None, 'k': K, 'a': (66, 44, 26), 'b': (98, 68, 40), 'c': (132, 96, 58), 'd': (166, 126, 80), 'e': (196, 158, 104),
        's': (52, 34, 22), 't': (84, 58, 36), 'm': (150, 150, 140), 'n': (210, 206, 190)}


def from_rows(rows, pal):
    h, w = len(rows), max(len(r) for r in rows)
    img = canvas(w, h)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            c = pal.get(ch)
            if c:
                put(img, x, y, c)
    return img


def plecak():
    # tył (klatka 2): worek z klapą, dwa paski z klamrami; 14 x 15 w klatce 20x20, góra na linii ramion
    back = [
        "....................",
        "...kkkkkkkkkkkkkk...",
        "..kddeeeeeeeeeddck..",
        "..kdeeeeeeeeeeedck..",
        "..kcddddtddtddddbk..",
        "..kkkkkkskkskkkkkk..",
        "..kccdddsddsdddcbk..",
        "..kcdddmsddsmddcbk..",
        "..kcdddnmddmndddbk..",
        "..kcdddddddddddcbk..",
        "..kccddddddddddcbk..",
        "..kccdddddddddccbk..",
        "..kbccccccccccccak..",
        "..kbbcccccccccbbak..",
        "...kaabbbbbbbbaak...",
        "....kkkkkkkkkkkk....",
    ]
    # bok (klatka 1): profil worka przy plecach (z prawej strony klatki: bohater patrzy w lewo), szelka przez ramię
    side = [
        "....................",
        "..........kkkkk.....",
        "..........kdeeck....",
        ".........skddeck....",
        ".........skcddbk....",
        ".........kkkkkbk....",
        "..........kcddbk....",
        "..........kcmdbk....",
        "..........kcndbk....",
        "..........kcddbk....",
        "..........kccdbk....",
        "..........kccdak....",
        "..........kbccak....",
        "..........kabbak....",
        "...........kkkk.....",
        "....................",
    ]
    # przód (klatka 0): tylko szelki na barkach (2 px) i rożki worka za ramionami
    front = [
        "....................",
        "....................",
        "...kk..........kk...",
        "..kcsk........kstk..",
        "...ksk........ksk...",
        "...ksk........ksk...",
        "...ksk........ksk...",
        "...kmk........kmk...",
        "...ksk........ksk...",
        "....k..........k....",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
    ]
    frames = [from_rows(f, PACK) for f in (front, side, back)]
    sheet = np.zeros((16, 60, 4), np.uint8)
    for i, f in enumerate(frames):
        sheet[:f.shape[0], i * 20:i * 20 + f.shape[1]] = f
    return sheet


TPL = {'.': None, 'k': K, '1': GREY[1], '2': GREY[2], '3': GREY[3], '4': GREY[4], '5': GREY[5], '6': GREY[6]}


def torba():
    rows = [
        ".kkkkkkk.",
        "k5666654k",
        "k4555543k",
        "kk11111kk",
        "k3434332k",
        "k3343322k",
        "k2222221k",
        ".kkkkkkk.",
    ]
    return from_rows(rows, TPL)


def sakiewka():
    rows = [
        "..kk..",
        ".k45k.",
        "k1kk1k",
        "k5543k",
        "k4432k",
        "k3321k",
        ".kkkk.",
    ]
    return from_rows(rows, TPL)


def main(argv):
    out = {}
    out['Ubior_Czapka'] = czapka()
    out['Ubior_Plecak'] = plecak()
    out['Ubior_Torba'] = torba()
    out['Ubior_Sakiewka'] = sakiewka()
    for n, img in out.items():
        p = os.path.join(GAME, 'img', 'system', n + '.png')
        Image.fromarray(img, 'RGBA').save(p)
        print('->', os.path.relpath(p, GAME).replace('\\', '/'), img.shape[1], 'x', img.shape[0])
    if '--podglad' in argv:
        p = argv[argv.index('--podglad') + 1]
        W = sum(i.shape[1] + 4 for i in out.values())
        H = max(i.shape[0] for i in out.values())
        bg = Image.new('RGBA', (W, H), (70, 110, 70, 255))
        x = 0
        for img in out.values():
            bg.alpha_composite(Image.fromarray(img, 'RGBA'), (x, 0))
            x += img.shape[1] + 4
        bg.resize((W * 10, H * 10), Image.NEAREST).save(p)


if __name__ == '__main__':
    main(sys.argv[1:])
