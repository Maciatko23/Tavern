# python tools/ludzie/dym_mielerza.py
# Dym nad mielerzem Zbycha (Ludzie.js, zdarzenie „Dym z mielerza”): sam dym, bez kamiennego komina, z !Fantasy_chimney (postać 0,
# 3 klatki dymu). Mielerz dymi szczytem kopca i bokami: główny słup na środku + dwie cieńsze smużki niżej po bokach (dół słupa,
# słabsze, ze zgaszonym wierzchem). Wynik: img/characters/!$Dym_Mielerz.png - jedna postać, klatki 144x144, podstawa dymu tuż nad
# dołem klatki (zdarzenie stoi na kratce, której dół to szczyt kopca).
# Przy okazji img/characters/!$Dym_Komin.png - sam dym (bez klocka), klatki 48x144, podstawa tuż nad dołem klatki: do kominów
# narysowanych w obrazku budynku (Homes.js: odbudowany dom Ługów; miejsce dymu ustawia <Px:dx,dy>).
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "img", "characters", "!Fantasy_chimney.png")
OUT = os.path.join(ROOT, "img", "characters", "!$Dym_Mielerz.png")
OUT2 = os.path.join(ROOT, "img", "characters", "!$Dym_Komin.png")
CW, CH = 48, 144          # klatka w !Fantasy_chimney (576x1152: 4x2 postacie po 3x4 klatki)
CUT = 97                  # od tego wiersza w klatce jest kamienny komin - zostaje sam dym nad nim
FW, FH = 144, 144         # klatka wyniku
BASE = 4                  # podstawa dymu tyle pikseli nad dołem klatki


def smoke(src, pat):
    return src.crop((pat * CW, 0, pat * CW + CW, CUT))   # postać 0, kierunek dół, klatka pat - sam dym


def fade(im, keep, top_alpha):
    """wierzch smużki gaśnie: od wiersza `keep` w górę przezroczystość rośnie do top_alpha"""
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        k = 1.0 if y >= keep else top_alpha + (1.0 - top_alpha) * (y / max(1, keep))
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a: px[x, y] = (r, g, b, int(a * k))
    return im


def mul_alpha(im, f):
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a: px[x, y] = (r, g, b, int(a * f))
    return im


def frame(src, pat):
    f = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    main = mul_alpha(smoke(src, pat), 0.9)
    f.alpha_composite(main, ((FW - CW) // 2, FH - BASE - CUT))
    # smużki: dół słupa (cienki, wznoszący się) z innej fazy, słabszy, niżej - na zboczach kopca
    for dx, ph, low in ((-38, (pat + 1) % 3, 12), (38, (pat + 2) % 3, 10)):
        w = smoke(src, ph).crop((0, 58, CW, CUT))
        w = mul_alpha(fade(w, 22, 0.0), 0.45)
        f.alpha_composite(w, ((FW - CW) // 2 + dx, FH - BASE - w.height + low))
    return f


def main():
    src = Image.open(SRC).convert("RGBA")
    sheet = Image.new("RGBA", (FW * 3, FH * 4), (0, 0, 0, 0))
    for row in range(4):                  # te same klatki we wszystkich kierunkach
        for pat in range(3):
            sheet.alpha_composite(frame(src, pat), (pat * FW, row * FH))
    sheet.save(OUT)
    print("zapisano", OUT, sheet.size)
    komin = Image.new("RGBA", (CW * 3, CH * 4), (0, 0, 0, 0))
    for row in range(4):
        for pat in range(3):
            komin.alpha_composite(smoke(src, pat), (pat * CW, row * CH + CH - 2 - CUT))
    komin.save(OUT2)
    print("zapisano", OUT2, komin.size)


if __name__ == "__main__":
    main()
