# tools/ubior/kapelusz.py - słomkowy kapelusz dla próby ubioru (js/plugins/Ubior.js): img/system/Ubior_Kapelusz.png
#
# Kapelusz jest okrągły, więc z każdej strony wygląda tak samo (widok z góry pod kątem, jak cała gra): jedna klatka 32x16 dla
# wszystkich kierunków + druga klatka "z tyłu" (wstążka zawiązana z tyłu: końce widać, gdy bohater stoi tyłem). Rysowany kodem,
# piksel po pikselu (elipsa ronda, kopuła główki, wstążka), w stylu bohatera: czarny kontur 1 px, światło z lewej góry,
# splot słomy pasami jaśniejszy / ciemniejszy.
# Punkt zaczepienia (KOTWICA): piksel, który gra kładzie na środek góry włosów - główka wystaje 1 px nad włosy.
#   python tools/ubior/kapelusz.py [--podglad PLIK]
import sys, os
import numpy as np
from PIL import Image

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
W, H = 32, 16
KOTWICA = (16, 4)          # (x, y) w klatce: tu idzie środek góry włosów (Ubior.js: kotwica)

KONTUR = (10, 9, 8)        # jak kontur bohatera (#0a0908)
SLOMA = [(122, 86, 38), (160, 118, 56), (196, 152, 78), (222, 186, 106), (240, 214, 140), (250, 232, 170)]   # ciemna -> jasna
WSTAZKA = [(58, 30, 18), (92, 50, 28), (120, 70, 38)]


def draw(back=False):
    img = np.zeros((H, W, 4), np.uint8)
    cx, cy = 15.5, 9.5          # środek ronda
    a, b = 13.6, 3.4            # półosie ronda (28 x 7 px)

    def put(x, y, c):
        if 0 <= x < W and 0 <= y < H:
            img[y, x, :3] = c
            img[y, x, 3] = 255

    brim = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 <= 1.0:
                brim[y, x] = True
    # główka: kopuła od y=3 do podstawy (y=9), połowa szerokości wg wiersza
    crown = np.zeros((H, W), bool)
    half = {3: 4.5, 4: 5.6, 5: 6.2, 6: 6.5, 7: 6.6, 8: 6.6, 9: 6.6, 10: 6.4}
    for y, hw in half.items():
        for x in range(W):
            if abs(x - cx) <= hw:
                crown[y, x] = True
    # rondo: tylna połowa (za główką), przednia (przed główką) - tu wystarczy: rondo, na nim główka, przednia krawędź ronda na wierzchu
    for y in range(H):
        for x in range(W):
            if not brim[y, x]:
                continue
            # pierścienie splotu: odległość "eliptyczna" od środka
            r = (((x - cx) / a) ** 2 + ((y - cy) / b) ** 2) ** 0.5
            ring = int(r * 5.0)
            lit = 0.5 - 0.5 * ((x - cx) / a) * 0.6 - 0.5 * ((y - cy) / b) * 0.25   # lewa strona i tył jaśniejsze
            k = 2 + (1 if lit > 0.5 else 0) + (1 if ring % 2 == 0 else 0)
            if y > cy + 1.2:          # przednia krawędź - spód ronda w cieniu
                k -= 1
            put(x, y, SLOMA[max(0, min(5, k))])
    for y in range(H):
        for x in range(W):
            if not crown[y, x]:
                continue
            front_of_brim = y >= 10 and brim[y, x]
            if front_of_brim:
                continue
            dx = (x - cx) / 6.6
            k = 4 if dx < -0.35 else 3 if dx < 0.3 else 2
            if y == 3:
                k += 1
            if (x + y) % 3 == 0 and k > 1:     # splot na główce
                k -= 1
            put(x, y, SLOMA[max(0, min(5, k))])
    # wstążka u podstawy główki (y 7-8)
    for y in (7, 8):
        for x in range(W):
            if crown[y, x]:
                dx = (x - cx) / 6.6
                put(x, y, WSTAZKA[2 if dx < -0.3 else 1 if dx < 0.4 else 0] if y == 7 else WSTAZKA[0 if dx > 0 else 1])
    if back:   # końce wstążki zwisające z tyłu na rondo
        for x, y, c in [(13, 9, 1), (14, 9, 0), (13, 10, 0), (17, 9, 1), (18, 10, 0), (18, 9, 0)]:
            put(x, y, WSTAZKA[c])
    # kontur: piksel przezroczysty obok kształtu
    shape = img[:, :, 3] > 0
    for y in range(H):
        for x in range(W):
            if shape[y, x]:
                continue
            if any(0 <= y + dy < H and 0 <= x + dx < W and shape[y + dy, x + dx] for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0))):
                put(x, y, KONTUR)
    # linia między główką a tylną częścią ronda (główka odcina się od ronda)
    for y in range(4, 10):
        for x in range(W):
            if crown[y, x] and not crown[y, x - 1] and brim[y, x - 1]:
                put(x - 1, y, KONTUR)
            if crown[y, x] and not crown[y, x + 1] and brim[y, x + 1]:
                put(x + 1, y, KONTUR)
    # przednia krawędź ronda przed główką: ciemniejsza linia (rondo zachodzi na główkę)
    for x in range(W):
        if crown[9, x] and brim[10, x]:
            put(x, 10, SLOMA[3])
    return img


def main(argv):
    front, back = draw(False), draw(True)
    sheet = np.concatenate([front, back], axis=1)
    out = os.path.join(GAME, 'img', 'system', 'Ubior_Kapelusz.png')
    Image.fromarray(sheet, 'RGBA').save(out)
    print('->', os.path.relpath(out, GAME), sheet.shape[1], 'x', sheet.shape[0], 'kotwica', KOTWICA)
    if '--podglad' in argv:
        p = argv[argv.index('--podglad') + 1]
        bg = Image.new('RGBA', (sheet.shape[1], sheet.shape[0]), (70, 110, 70, 255))
        bg.alpha_composite(Image.fromarray(sheet, 'RGBA'))
        bg.resize((bg.width * 12, bg.height * 12), Image.NEAREST).save(p)


if __name__ == '__main__':
    main(sys.argv[1:])
