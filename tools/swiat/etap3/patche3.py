# -*- coding: utf-8 -*-
"""Zmiany w istniejacych wtyczkach (etap 2, partia 1): Orzel_Data SIDES i MapaWyspy_Data DROGI wg nowych przejsc. Jak tools/swiat/etap1/patche.py:
dosłowne zamiany (old -> new) na obecnych plikach (po instalacji etapu 1), powtarzalne; staging/js/plugins/<plik> do podgladu (GAME_OVERLAY_JS=1).
  python tools/swiat/etap2/patche2.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "swiat", "etap1"))
import patche as P1
P1.HERE = HERE
_w = open(os.path.join(ROOT, "js", "plugins", "Wyspa_Data.js"), "rb").read().decode("utf-8").replace(chr(13) + chr(10), chr(10))
_i = _w.index("    const EDGES = [")
_j = _w.index("    ];", _i) + len("    ];")
WYSPA_OLD = _w[_i:_j]
WYSPA_NEW = ("    // (2026-10-30, the world stage 3) no ways in from the harbour (125) and the mountains (13): Pustelnia, Garnizon and the lighthouse are reached by land" + chr(10) + "    // from their neighbours in the world (Swiat_Data.js; Krawedzie.js)" + chr(10) + "    const EDGES = [];")
if "const EDGES = [];" in _w: WYSPA_OLD = WYSPA_NEW
PATCHE = [
    ('js/plugins/Orzel_Data.js', '17: { N: 23, E: 933 }, 933: { W: 17 }, 18: { E: 3 },', '17: { N: 23, E: 933 }, 933: { W: 17 }, 18: { N: 910 }, 910: { S: 18, E: 950, W: 918 }, 918: { E: 910 }, 930: { S: 157, E: 932 }, 932: { W: 930 }, 950: { N: 155, W: 910 }, 951: { E: 162 },'),
    ('js/plugins/Orzel_Data.js', '13: { W: 21, E: 159, N: MAP, S: 8 }', '13: { W: 157, E: 120, N: MAP, S: 8 }'),
    ('js/plugins/Orzel_Data.js', '21: { W: 22, E: 13 },', '21: { W: 22 },'),
    ('js/plugins/Orzel_Data.js', '111: { E: 8, W: 125 }, 125: { N: 8, S: 162 }, 155: { S: 125, E: 157 },', '111: { E: 8, W: 162 }, 125: { N: 8 }, 155: { E: 157, S: 950 },'),
    ('js/plugins/Orzel_Data.js', '157: { W: 155, E: 159 }, 159: { W: 157, S: 13, E: 120 },', '157: { W: 155, E: 13, N: 930 }, 159: { W: 120 },'),
    ('js/plugins/Orzel_Data.js', '162: { N: 125, W: 165 },', '162: { E: 111, W: 165 },'),
    ('js/plugins/MapaWyspy_Data.js', '[8, 111], [111, 125],', '[8, 111], [111, 162],'),
    ('js/plugins/MapaWyspy_Data.js', '[22, 21], [21, 13], [13, 120], [13, 159],', '[22, 21], [13, 120], [13, 157],'),
    ('js/plugins/MapaWyspy_Data.js', '[125, 155], [155, 157], [157, 159], [125, 162], [162, 165],', '[155, 157], [162, 165],'),
    ("js/plugins/Wyspa_Data.js", WYSPA_OLD, WYSPA_NEW),
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
