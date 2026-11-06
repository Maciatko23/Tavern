# -*- coding: utf-8 -*-
"""Wycina pieczątki z 4 map wzorcowych gracza (Map013, Map159, Map008, Map003) wg listy DEF poniżej.
  python tools/mapy/pieczatki/wytnij_wszystkie.py [nazwa ...]      (bez nazw: wszystkie) -> dane/<nazwa>.json + .png + arkusz.png
Okno (x, y, szer., wys.) to punkt wyjścia: gdy maska dotyka brzegu okna, okno rośnie (wytnij_auto). Wynik jest ZAWSZE kompletny."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import pieczatki as P
from PIL import Image, ImageDraw
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# nazwa: (mapa, x, y, szer., wys., tło (rodzaje gruntu na warstwie 0), opis, opcje)
DEF = {}


def d(nazwa, mapa, x, y, w, h, opis, tlo=(16, 27), **kw):
    DEF[nazwa] = (mapa, x, y, w, h, tlo, opis, kw)


exec(open(os.path.join(HERE, "definicje.py"), encoding="utf-8").read())


def wytnij_jedna(nazwa, cache={}):
    mapa, x, y, w, h, tlo, opis, kw = DEF[nazwa]
    if mapa not in cache: cache[mapa] = P.wczytaj(mapa)
    raw = cache[mapa]
    kw = dict(kw)
    jawna = kw.pop("jawna", None)
    zrod = {"mapa": mapa, "x0": x, "y0": y, "w": w, "h": h}
    f = P.wytnij if kw.get('pelny') else P.wytnij_auto
    p = f(raw, x, y, w, h, nazwa, opis, tlo=tlo, zrodlo=zrod, **kw)
    p["zrodlo"]["mapa"] = mapa
    return p


def main(argv):
    nazwy = argv or list(DEF)
    wyniki = []
    for n in nazwy:
        try:
            p = wytnij_jedna(n)
        except Exception as e:
            print("BŁĄD %-28s %s" % (n, e)); continue
        P.zapisz(p)
        im = P.maska_obrazek(p, 1.0, True)
        im.save(os.path.join(P.DANE, n + ".png"))
        nm = sum(p["maska"])
        print("ok   %-28s %2dx%-2d maska %3d zdarzeń %3d  (okno z mapy %d: %d,%d)" % (n, p["w"], p["h"], nm, len(p["zdarzenia"]), p["zrodlo"]["mapa"], p["zrodlo"]["x0"], p["zrodlo"]["y0"]))
        wyniki.append((n, im))
    return wyniki


if __name__ == "__main__":
    main(sys.argv[1:])
