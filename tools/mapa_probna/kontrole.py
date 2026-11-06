# -*- coding: utf-8 -*-
"""Kontrola estetyki (a-e z tools/mapy/estetyka.py) map próbnych 990 i 991 ze stagingu, z układem świata: A x0=2000, B x0=2064 (wspólna krawędź).
Estetyka.py zna tylko świat z Swiat_Data.js (i raster maski), więc tu: te same sprawdzenia na mapach ze stagingu i sąsiedztwie A|B.
  python tools/mapa_probna/kontrole.py [--lista]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import estetyka as E, mapylib as L
STG = os.path.join(HERE, "staging", "data")


class Fals:
    def __init__(self, mps): self.M = mps
    def krawedz(self, mid, side):
        m = self.M[mid]; out = []
        if mid == 990 and side == "E":
            out = [{"x": m.W - 1, "y": y, "b": 991, "bx": 0, "by": y} for y in range(m.H)]
        if mid == 991 and side == "W":
            out = [{"x": 0, "y": y, "b": 990, "bx": self.M[990].W - 1, "by": y} for y in range(m.H)]
        return out


def main():
    mps = {i: L.Mapa(i, raw=L.load_json(os.path.join(STG, "Map%03d.json" % i))) for i in (990, 991)}
    sw = Fals(mps); suma = 0
    for i, mp in mps.items():
        wyn = E.wszystkie(sw, mp, "abcdefghij")
        print("Map%d: " % i + "  ".join("%s=%d" % (t, len(v)) for t, v in wyn.items()))
        for t, v in wyn.items():
            for (x, y, op) in v:
                suma += 1
                if "--lista" in sys.argv: print("   %s (%d,%d) %s" % (t, x, y, op))
                E.obraz(mp, x, y, os.path.join(HERE, "staging", "estetyka_%s_%d_%d_%d.png" % (t, i, x, y)), (255, 40, 40))
    print("WYNIK estetyka:", "OK (0)" if suma == 0 else "BŁĄD (%d)" % suma)
    return 0 if suma == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
