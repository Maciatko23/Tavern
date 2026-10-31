# -*- coding: utf-8 -*-
"""Poprawka po instalacji etapu 3: przejscia wstawiane w czasie gry zgodne ze swiatem.
  - Wyspa_Data.LINKS: usuniete wpisy niezgodne ze swiatem (155 S -> 125, 157 E -> 159 (srodek mapy po rozszerzeniu), 159 W -> 157, 159 S -> 13, 162 N -> 125)
  - Homes.js: droga do Spalonej zagrody (168) lezy na WSCHOD od Skraju lasu: zdarzenia 706-708 na krawedzi E mapy 23 (79, 27-29) -> 168 (1, 71-73), drogowskaz (78, 26)
  - teksty domy.txt / fabula.txt: kierunek „na wschod” zamiast „na zachod” (Spalona zagroda)
  python tools/swiat/etap3/patche_fix.py   -> staging_fix/<plik>"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "swiat", "etap1"))
import patche as P1
P1.HERE = HERE
NL = chr(10)
def L(*a): return NL.join(a) + NL
PATCHE = [
 ("js/plugins/Wyspa_Data.js", '        { from: 155, cells: [[23, 71], [24, 71], [25, 71]], to: 125, land: [[14, 1], [15, 1], [16, 1]], dir: 2 },' + NL, "        // (2026-10-30, the world) 155 S -> 125 removed: Pustelnia's south neighbour is 950" + NL),
 ("js/plugins/Wyspa_Data.js", '        { from: 157, cells: [[111, 19], [111, 20]], to: 159, land: [[1, 33], [1, 34]], dir: 6 },' + NL + '        { from: 159, cells: [[0, 33], [0, 34]], to: 157, land: [[110, 19], [110, 20]], dir: 4 },' + NL + '        { from: 159, cells: [[29, 79], [30, 79], [31, 79]], to: 13, land: [[118, 11], [118, 12], [118, 13]], dir: 4 },' + NL + '        { from: 162, cells: [[21, 0], [22, 0], [23, 0]], to: 125, land: [[21, 78], [22, 78], [23, 78]], dir: 8 },' + NL, "        // (2026-10-30, the world) 157 E -> 159, 159 W -> 157, 159 S -> 13, 162 N -> 125 removed: the maps meet their neighbours of the world (Swiat_Data.js)" + NL),
 ("js/plugins/Homes.js", 'x: 0, y: 6 + i,', 'x: 79, y: 27 + i,'),
 ("js/plugins/Homes.js", 'C(201, [0, ZAGRODA, 98, 11 + i, 4, 0])', 'C(201, [0, ZAGRODA, 1, 71 + i, 6, 0])'),
 ("js/plugins/Homes.js", 'x: 1, y: 5,', 'x: 78, y: 26,'),
 ("js/teksty/domy.txt", 'na zachód od Skraju lasu (ścieżka', 'na wschód od Skraju lasu (ścieżka'),
 ("js/teksty/domy.txt", 'Spalona zagroda (na zachód od Skraju lasu)', 'Spalona zagroda (na wschód od Skraju lasu)'),
 ("js/teksty/domy.txt", 'Na zachód: zagroda Ługów', 'Na wschód: zagroda Ługów'),
 ("js/teksty/fabula.txt", 'Za Skrajem lasu, na zachód, stoi zagroda', 'Za Skrajem lasu, na wschód, stoi zagroda'),
]
zastosuj, czytaj, lf, crlf, ma_crlf = P1.zastosuj, P1.czytaj, P1.lf, P1.crlf, P1.ma_crlf
def zbuduj_staging():
    for rel in sorted({p[0] for p in PATCHE}):
        raw, txt = czytaj(rel); t = lf(txt)
        for (f, old, new) in PATCHE:
            if f == rel:
                t, st = zastosuj(t, old, new); print(rel, st, old[:50].strip())
        if ma_crlf(raw): t = crlf(t)
        dst = os.path.join(HERE, "staging_fix", rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(t.encode("utf-8"))
if __name__ == "__main__": zbuduj_staging()
