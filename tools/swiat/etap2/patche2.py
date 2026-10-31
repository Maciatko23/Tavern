# -*- coding: utf-8 -*-
"""Zmiany w istniejacych wtyczkach (etap 2, partia 1): Orzel_Data SIDES i MapaWyspy_Data DROGI wg nowych przejsc. Jak tools/swiat/etap1/patche.py:
dosłowne zamiany (old -> new) na obecnych plikach (po instalacji etapu 1), powtarzalne; staging/js/plugins/<plik> do podgladu (GAME_OVERLAY_JS=1).
  python tools/swiat/etap2/patche2.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "swiat", "etap1"))
import patche as P1
P1.HERE = HERE
PATCHE = [
    ("js/plugins/Orzel_Data.js", "3: { E: 23, N: 4, S: 17, W: 18 }, 4: { S: 3 }, 17: { N: 3 }, 18: { E: 3 },",
     "3: { E: 23, N: 4, S: 20, W: 24 }, 4: { S: 3 }, 17: { N: 23 }, 18: { E: 3 },"),
    ("js/plugins/Orzel_Data.js", "20: { S: 21 }, 21: { N: 20, W: 22, E: 13 }, 22: { E: 21, S: 23, W: 8 },",
     "20: { N: 3 }, 21: { W: 22, E: 13 }, 22: { E: 21, W: 8 },"),
    ("js/plugins/Orzel_Data.js", "23: { N: 22, W: 3 }, 24: { W: 8 },",
     "23: { N: 900, S: 17, W: 3 }, 24: { W: 8, E: 3, S: 901 }, 900: { S: 23 }, 901: { N: 24 },"),
    ("js/plugins/MapaWyspy_Data.js", "[22, 21], [22, 23], [21, 20], [21, 13],", "[22, 21], [21, 13],"),
    ("js/plugins/MapaWyspy_Data.js", "[23, 3], [23, 168], [3, 4], [3, 17], [3, 18],", "[23, 3], [23, 168], [3, 4], [23, 17], [3, 18], [3, 20], [3, 24],"),
]
zastosuj, czytaj, lf, crlf, ma_crlf = P1.zastosuj, P1.czytaj, P1.lf, P1.crlf, P1.ma_crlf


def zbuduj_staging():
    for rel in sorted({p[0] for p in PATCHE}):
        raw, txt = czytaj(rel)
        t = lf(txt)
        for (f, old, new) in PATCHE:
            if f == rel:
                t, st = zastosuj(t, old, new); print(rel, st, old[:50])
        if ma_crlf(raw): t = crlf(t)
        dst = os.path.join(HERE, "staging", rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(t.encode("utf-8"))


if __name__ == "__main__":
    zbuduj_staging()
