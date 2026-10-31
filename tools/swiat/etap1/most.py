# -*- coding: utf-8 -*-
"""Kamienny most nad suchą fosą przed bramą Podgrodzia (Map111, x 90-99, y 16-19): trzy warianty, rysowane piksel po pikselu (bez rozmycia).
  python tools/swiat/etap1/most.py            -> img/characters/!$Most_A.png, !$Most_B.png, !$Most_C.png (arkusz 3x4 klatek 528x432)
Klatka 528 x 432 = 11 x 9 kratek: kolumny x 89-99, wiersze y 14-22 (zdarzenie obrazu stoi na (94, 22), dół klatki = dół kratki y 22).
Paleta z murów miasta (Map008/111): ciemna fuga (35,45,50), kamień (60..148, zielonkawo-szary), jasna listwa (175,189,185).
A: jeden łuk, balustrada z tralek.  B: dwa łuki, pełna attyka z płycinami.  C: łuk kamienny + drewniana część zwodzona przy bramie."""
import os, sys, random
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
T = 48
FW, FH = 11 * T, 9 * T
JOINT = (35, 45, 50, 255)
TONES = [(96, 112, 111, 255), (110, 125, 121, 255), (120, 134, 134, 255), (129, 147, 145, 255)]
HIGH = (148, 159, 156, 255)
CAP = (175, 189, 185, 255)
CAPD = (128, 145, 144, 255)
DARK = (60, 77, 81, 255)
WOOD = [(92, 64, 42, 255), (110, 78, 50, 255), (128, 92, 58, 255)]
WOODD = (58, 40, 28, 255)
IRON = (52, 56, 62, 255)


def bricks(img, x0, y0, x1, y1, rnd, course=12, bw=(22, 34), shade=0):
    """mur z cegieł (kamieni): wiersze co `course` px, przesunięte, fuga 1 px, jasna krawędź u góry kamienia"""
    d = ImageDraw.Draw(img)
    y = y0; row = 0
    while y < y1:
        h = min(course, y1 - y)
        x = x0 - (rnd.randint(0, 20) if row % 2 else 0)
        while x < x1:
            w = rnd.randint(*bw)
            xa, xb = max(x, x0), min(x + w, x1)
            if xb > xa:
                c = list(rnd.choice(TONES))
                c = tuple(max(0, v - shade) for v in c[:3]) + (255,)
                d.rectangle([xa, y, xb - 1, y + h - 1], fill=c)
                d.line([xa, y, xb - 1, y], fill=tuple(min(255, v + 14 - shade // 2) for v in c[:3]) + (255,))
                d.line([xb - 1, y, xb - 1, y + h - 1], fill=JOINT)
                if rnd.random() < 0.3: d.point((xa + rnd.randint(1, max(1, xb - xa - 2)), y + rnd.randint(2, max(2, h - 2))), fill=(c[0] - 14, c[1] - 14, c[2] - 12, 255))
            x += w
        d.line([x0, y + h - 1, x1 - 1, y + h - 1], fill=JOINT)
        y += course; row += 1


def cap(img, x0, y0, x1, y1):
    """listwa wieńcząca (jasny kamień): górna krawędź jasna, dolna cień, pionowe fugi co ~30 px"""
    d = ImageDraw.Draw(img)
    d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=CAP)
    d.line([x0, y0, x1 - 1, y0], fill=(205, 216, 212, 255))
    d.line([x0, y1 - 2, x1 - 1, y1 - 2], fill=CAPD)
    d.line([x0, y1 - 1, x1 - 1, y1 - 1], fill=JOINT)
    for xx in range(x0 + 28, x1 - 6, 36): d.line([xx, y0 + 1, xx, y1 - 3], fill=CAPD)


def pillar(img, x0, y0, x1, y1, rnd):
    bricks(img, x0, y0 + 10, x1, y1, rnd, course=12, bw=(18, 24))
    cap(img, x0 - 3, y0, x1 + 3, y0 + 12)
    d = ImageDraw.Draw(img); d.line([x0, y0 + 10, x0, y1 - 1], fill=JOINT); d.line([x1 - 1, y0 + 10, x1 - 1, y1 - 1], fill=JOINT)


def lantern(img, cx, y):
    """latarenka z płomieniem (kamienny słupek, żelazna oprawa, ciepłe szkło)"""
    d = ImageDraw.Draw(img)
    d.rectangle([cx - 4, y + 22, cx + 3, y + 25], fill=IRON)
    d.rectangle([cx - 7, y + 6, cx + 6, y + 21], fill=IRON)
    d.rectangle([cx - 5, y + 8, cx + 4, y + 19], fill=(230, 160, 60, 255))
    d.rectangle([cx - 3, y + 10, cx + 2, y + 18], fill=(255, 214, 110, 255))
    d.rectangle([cx - 1, y + 12, cx, y + 16], fill=(255, 245, 190, 255))
    d.polygon([(cx - 8, y + 6), (cx + 7, y + 6), (cx, y)], fill=IRON)
    d.line([cx - 5, y + 14, cx + 4, y + 14], fill=IRON)
    d.point((cx, y - 1), fill=IRON)


def balusters(img, x0, x1, y0, y1, rnd):
    """balustrada z tralek: listwa u góry, cokół u dołu, tralki między nimi (przerwy zostają przezroczyste)"""
    d = ImageDraw.Draw(img)
    cap(img, x0, y0, x1, y0 + 12)
    d.rectangle([x0, y1 - 8, x1 - 1, y1 - 1], fill=TONES[2]); d.line([x0, y1 - 8, x1 - 1, y1 - 8], fill=HIGH); d.line([x0, y1 - 1, x1 - 1, y1 - 1], fill=JOINT)
    x = x0 + 5
    while x + 9 <= x1 - 4:
        # tralka: wazon (szeroki środek)
        for yy in range(y0 + 12, y1 - 8):
            t = (yy - (y0 + 12)) / max(1, (y1 - 8 - (y0 + 12)))
            w = 2 + int(2.2 * (1 - abs(2 * t - 1)))
            d.line([x + 4 - w, yy, x + 4 + w - 1, yy], fill=TONES[3] if (yy % 5) else HIGH)
            d.point((x + 4 + w - 1, yy), fill=DARK)
        x += 14


def panels(img, x0, x1, y0, y1, rnd):
    """pełna attyka: cegły z płycinami (wnęki z jasną krawędzią)"""
    d = ImageDraw.Draw(img)
    bricks(img, x0, y0 + 12, x1, y1, rnd, course=11)
    cap(img, x0, y0, x1, y0 + 12)
    n = max(1, (x1 - x0) // 88)
    w = (x1 - x0) // n
    for i in range(n):
        a = x0 + i * w + 10; b = x0 + (i + 1) * w - 10
        d.rectangle([a, y0 + 18, b, y1 - 6], outline=JOINT)
        d.line([a + 1, y0 + 19, b - 1, y0 + 19], fill=HIGH)
        d.line([a + 1, y0 + 19, a + 1, y1 - 7], fill=HIGH)
        d.rectangle([a + 2, y1 - 7, b - 1, y1 - 6], fill=DARK)


def arch(img, cx, hw, top, base, ring=8):
    """łuk odcinkowy (górna połowa elipsy) o rozpiętości 2*hw od `base` w górę do `top`; jasny wieniec z klińcami, klucz u szczytu,
    ciemne wnętrze (głębia, ku dołowi coraz przejrzystsze - widać dno fosy) i cień łuku na dnie"""
    import math
    d = ImageDraw.Draw(img)
    rh = base - top
    px = img.load()
    # wieniec
    for y in range(top - ring, base):
        for x in range(cx - hw - ring, cx + hw + ring + 1):
            e = ((x - cx) / (hw + ring)) ** 2 + ((y - base) / (rh + ring)) ** 2
            if e <= 1: px[x, y] = TONES[3] if ((x + y) // 6) % 7 else HIGH
    for k in range(-6, 7):   # klińce: kreski fug promieniście
        ang = math.pi / 2 + k * 0.2
        ex, ey = cx + (hw + ring) * math.cos(ang), base - (rh + ring) * math.sin(ang)
        ix, iy = cx + hw * math.cos(ang), base - rh * math.sin(ang)
        d.line([ix, iy, ex, ey], fill=JOINT)
    # otwór
    for y in range(top, base):
        for x in range(cx - hw, cx + hw + 1):
            e = ((x - cx) / hw) ** 2 + ((y - base) / rh) ** 2
            if e <= 1:
                depth = (y - top) / max(1, rh)
                px[x, y] = (6, 8, 12, int(225 - 140 * depth))
    # obrys otworu (jasna krawędź od dołu wieńca)
    for x in range(cx - hw, cx + hw + 1):
        t = ((x - cx) / hw) ** 2
        if t <= 1:
            y = int(base - rh * math.sqrt(1 - t))
            if 0 <= y < img.size[1]: px[x, y] = JOINT
    # klucz łuku
    d.rectangle([cx - 8, top - ring - 5, cx + 7, top + 1], fill=CAP)
    d.line([cx - 8, top - ring - 5, cx + 7, top - ring - 5], fill=(205, 216, 212, 255))
    d.line([cx - 8, top - ring - 5, cx - 8, top + 1], fill=JOINT); d.line([cx + 7, top - ring - 5, cx + 7, top + 1], fill=JOINT)
    # cień łuku na dnie fosy
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.ellipse([cx - hw - 4, base + 2, cx + hw + 4, base + 24], fill=(0, 0, 0, 64))
    img.alpha_composite(sh)


def wood_planks(img, x0, y0, x1, y1, rnd):
    d = ImageDraw.Draw(img)
    y = y0
    while y < y1:
        c = rnd.choice(WOOD)
        d.rectangle([x0, y, x1 - 1, min(y + 11, y1 - 1)], fill=c)
        d.line([x0, y, x1 - 1, y], fill=tuple(min(255, v + 18) for v in c[:3]) + (255,))
        d.line([x0, min(y + 11, y1 - 1), x1 - 1, min(y + 11, y1 - 1)], fill=WOODD)
        for xx in range(x0 + rnd.randint(8, 30), x1 - 2, rnd.randint(40, 70)): d.line([xx, y, xx, min(y + 11, y1 - 1)], fill=WOODD)
        y += 12
    for xx in (x0 + 6, x1 - 8):
        d.rectangle([xx, y0, xx + 3, y1 - 1], fill=IRON)   # żelazne okucia


def timber_face(img, x0, y0, x1, y1, rnd):
    d = ImageDraw.Draw(img)
    d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=WOOD[0])
    for xx in range(x0, x1, 12):
        d.rectangle([xx, y0, xx + 10, y1 - 1], fill=rnd.choice(WOOD)); d.line([xx + 11, y0, xx + 11, y1 - 1], fill=WOODD)
    d.line([x0, y0, x1 - 1, y0], fill=(150, 112, 74, 255)); d.line([x0, y1 - 1, x1 - 1, y1 - 1], fill=WOODD)
    for k in range(x0 + 10, x1, 64):   # ukośne zastrzały
        d.line([k, y1 - 2, k + 30, y0 + 2], fill=WOODD, width=3)


def frame(variant):
    rnd = random.Random({"A": 11, "B": 22, "C": 33}[variant])
    img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    XL, XR = 2 * T, 11 * T            # most: x 91..99 (kolumny 2-10): słupy na skarpach (x 91 i x 99), dno fosy x 92-98 = px 144..480
    PN0, PN1 = 52, 96                 # attyka północna: listwa 52-64, lico 64-96
    PS0, PS1 = 288, 336               # attyka południowa: listwa 288-300, lico 300-336
    BODY0, BODY1 = 336, 400           # korpus mostu (lico z łukami)
    x_a, x_b = XL + 44, XR - 44       # między słupami (px 140..484)
    # korpus: lico z cegieł + gzyms (jasna listwa nad łukami)
    bricks(img, XL, BODY0 + 6, XR, BODY1, rnd, course=12)
    cap(img, XL - 2, BODY0 - 2, XR + 2, BODY0 + 8)
    drawbridge_from = None
    if variant == "A":
        balusters(img, x_a, x_b, PN0, PN1, rnd)
        balusters(img, x_a, x_b, PS0, PS1, rnd)
        arch(img, 312, 168, BODY0 + 18, BODY1, ring=8)   # otwór dokładnie od brzegu dna do brzegu dna (px 144..480), symetrycznie
    elif variant == "B":
        panels(img, x_a, x_b, PN0, PN1, rnd)
        panels(img, x_a, x_b, PS0, PS1, rnd)
        arch(img, XL + 150, 78, BODY0 + 20, BODY1, ring=7)
        arch(img, XR - 150, 78, BODY0 + 20, BODY1, ring=7)
        # przyczółek między łukami: jasny filar z attyką na wierzchu (wystaje ponad gzyms)
        px0 = (XL + XR) // 2 - 22
        d.rectangle([px0, BODY0 + 6, px0 + 44, BODY1 - 1], outline=JOINT)
    else:  # C: kamień do x ~ 308, dalej drewno (część zwodzona od strony bramy)
        split = XL + 252
        panels(img, x_a, split, PN0, PN1, rnd)
        panels(img, x_a, split, PS0, PS1, rnd)
        arch(img, XL + 128, 86, BODY0 + 18, BODY1, ring=7)
        # część zwodzona: pomost z desek, belki pod spodem, poręcz z bali, łańcuchy
        wood_planks(img, split, 16 * 0 + 96, x_b + 40, 288, rnd)
        timber_face(img, split, BODY0 + 6, XR, BODY1, rnd)
        for yy in (PN0 + 18, PS0 + 12):   # poręcz: bale
            d.rectangle([split, yy, x_b, yy + 8], fill=WOOD[2]); d.line([split, yy, x_b, yy], fill=(160, 120, 80, 255)); d.line([split, yy + 8, x_b, yy + 8], fill=WOODD)
        for xx in range(split + 6, x_b, 56):
            for (ya, yb) in ((PN0 + 10, PN1), (PS0 + 4, PS1)):
                d.rectangle([xx, ya, xx + 7, yb - 1], fill=WOOD[1]); d.line([xx, ya, xx, yb - 1], fill=WOODD)
        for (ya, yb) in ((PN0 + 16, PN1 - 16), (PS0 + 10, PS1 - 12)):   # łańcuch: ogniwa wzdłuż poręczy
            for xx in range(split + 14, x_b - 6, 10):
                d.rectangle([xx, ya + (xx // 10) % 2, xx + 5, ya + 2 + (xx // 10) % 2], outline=IRON)
        # filar łączący kamień z drewnem
        pillar(img, split - 6, 40, split + 18, 112, rnd)
        pillar(img, split - 6, 280, split + 18, 400, rnd)
    # słupy-przyczółki na obu końcach (północne: 40..96, południowe: 280..384) z latarenkami
    for (xa, xb) in ((XL + 2, XL + 46), (XR - 46, XR - 2)):   # px 98..142 oraz 482..526 (kolumny x 91 i x 99)
        pillar(img, xa, 40, xb, 100, rnd)
        pillar(img, xa, 280, xb, 400, rnd)
        lantern(img, (xa + xb) // 2, 8)
        lantern(img, (xa + xb) // 2, 248)
    # cień mostu na dnie fosy (pas pod korpusem) i cień przy słupach
    sh = Image.new("RGBA", (FW, FH), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.rectangle([XL, BODY1, XR, BODY1 + 18], fill=(0, 0, 0, 56))
    ds.rectangle([XL, BODY1 + 18, XR, BODY1 + 30], fill=(0, 0, 0, 26))
    img.alpha_composite(sh)
    return img


def main():
    for v in "ABC":
        f = frame(v)
        f.save(os.path.join(HERE, "staging", "most_%s_klatka.png" % v))
        sheet = Image.new("RGBA", (FW * 3, FH * 4), (0, 0, 0, 0))
        for i in range(3):
            for j in range(4): sheet.paste(f, (i * FW, j * FH))
        dst = os.path.join(ROOT, "img", "characters", "!$Most_%s.png" % v)
        sheet.save(dst); print("zapisano", dst, sheet.size)


if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "staging"), exist_ok=True)
    main()
