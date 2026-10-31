# -*- coding: utf-8 -*-
"""Zmiany w istniejacych wtyczkach (etap 2, partia 1): Orzel_Data SIDES i MapaWyspy_Data DROGI wg nowych przejsc. Jak tools/swiat/etap1/patche.py:
dosłowne zamiany (old -> new) na obecnych plikach (po instalacji etapu 1), powtarzalne; staging_b/js/plugins/<plik> do podgladu (GAME_OVERLAY_JS=1).
  python tools/swiat/etap2/patche2.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "swiat", "etap1"))
import patche as P1
P1.HERE = HERE
PATCHE = [
    ("js/plugins/Orzel_Data.js", "22: { E: 21, W: 8 },", "22: { E: 21, W: 8, N: 120 },"),
    ("js/plugins/Orzel_Data.js", "159: { W: 157, S: 13 },", "159: { W: 157, S: 13, E: 120 }, 120: { S: 22, E: 159, N: 934 }, 934: { S: 120 },"),
    ("js/plugins/Orzel_Data.js", "168: {},", "168: { W: 900, N: 912 }, 912: { S: 168 },"),
    ("js/plugins/Orzel_Data.js", "17: { N: 23 },", "17: { N: 23, E: 933 }, 933: { W: 17 },"),
    ("js/plugins/Orzel_Data.js", "900: { S: 23 },", "900: { S: 23, E: 168 },"),
    ("js/plugins/MapaWyspy_Data.js", "[13, 120], [13, 159],", "[13, 120], [13, 159], [22, 120], [120, 159], [900, 168],"),
]
zastosuj, czytaj, lf, crlf, ma_crlf = P1.zastosuj, P1.czytaj, P1.lf, P1.crlf, P1.ma_crlf


def zbuduj_staging_b():
    for rel in sorted({p[0] for p in PATCHE}):
        raw, txt = czytaj(rel)
        t = lf(txt)
        for (f, old, new) in PATCHE:
            if f == rel:
                t, st = zastosuj(t, old, new); print(rel, st, old[:50])
        if ma_crlf(raw): t = crlf(t)
        dst = os.path.join(HERE, "staging_b", rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(t.encode("utf-8"))


if __name__ == "__main__":
    zbuduj_staging_b()
