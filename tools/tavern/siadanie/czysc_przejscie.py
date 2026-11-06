# -*- coding: utf-8 -*-
"""PixelLab mimo opisu „no chair” dorysowuje czasem kawałki krzesła w klatkach przejścia. Tu: zostaje tylko to, co leży w sylwetce stojącego lub siedzącego tej samej postaci
(poszerzonej o kilka pikseli, bo poza pośrednia leży między nimi) albo w „obszarze przejścia” pod biodrami; obce drobiny znikają.
  python tools/tavern/siadanie/czysc_przejscie.py Kowal Woziwoda ...    (oryginały: klatki/<Klucz>/surowe/p0.png, p1.png)"""
import os, shutil, sys
from PIL import Image, ImageChops, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
KL = os.path.join(HERE, "klatki")
POSZERZ = 5   # (rozmiar okna MaxFilter: 5 = 2 px w każdą stronę)
NAJMNIEJ = 8  # mniejsze wysepki znikają


def alfa(p):
    return Image.open(p).convert("RGBA").getchannel("A").point(lambda v: 255 if v > 0 else 0)


def wysepki(maska):
    """piksele należące do spójnych kawałków mniejszych niż NAJMNIEJ"""
    w, h = maska.size
    px, widziane, male = maska.load(), set(), []
    for y in range(h):
        for x in range(w):
            if not px[x, y] or (x, y) in widziane:
                continue
            stos, kawalek = [(x, y)], []
            widziane.add((x, y))
            while stos:
                cx, cy = stos.pop()
                kawalek.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and (nx, ny) not in widziane:
                        widziane.add((nx, ny))
                        stos.append((nx, ny))
            if len(kawalek) < NAJMNIEJ:
                male += kawalek
    return male


def czysc(klucz):
    d = os.path.join(KL, klucz)
    su = os.path.join(d, "surowe")
    os.makedirs(su, exist_ok=True)
    wzor = ImageChops.lighter(alfa(os.path.join(d, "stoi.png")), alfa(os.path.join(d, "f0.png")))
    wolno = wzor.filter(ImageFilter.MaxFilter(POSZERZ))
    for n in ("p0", "p1"):
        p, kop = os.path.join(d, n + ".png"), os.path.join(su, n + ".png")
        if not os.path.exists(kop):
            shutil.copy(p, kop)
        im = Image.open(kop).convert("RGBA")
        a = ImageChops.multiply(im.getchannel("A"), wolno)
        im.putalpha(a)
        px, ma = im.load(), a.point(lambda v: 255 if v > 0 else 0)
        for x, y in wysepki(ma):
            px[x, y] = (0, 0, 0, 0)
        im.save(p)
    print(klucz, "ok")


if __name__ == "__main__":
    for k in sys.argv[1:]:
        czysc(k)
