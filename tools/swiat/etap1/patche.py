# -*- coding: utf-8 -*-
"""Zmiany w istniejacych wtyczkach (odwolania do przejsc), stosowane do KOPII w staging/js/plugins/ (podglad, testy z GAME_OVERLAY_JS=1)
i przez install.py do prawdziwych plikow (po kopii zapasowej). Zmiana jest dosłownym zastapieniem tekstu (old -> new); gdy `new` juz stoi
w pliku, pomijana (instalacja powtarzalna). Nic nie dziala przed instalacja.
  python tools/swiat/etap1/patche.py          buduje staging/js/plugins/<plik> z obecnych plikow + zmian"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

PATCHE = [
    # lot orla przez krawedzie: miasto -> Przystan (S) i Gory (N), brama E do Polnej drogi, Gory -> miasto, Przystan: N do miasta, bez E do Podgrodzia
    ("js/plugins/Orzel_Data.js",
     "8: { S: 22, E: 24, W: 111 }, 13: { W: 21, E: 159, N: MAP },",
     "8: { S: 125, N: 13, E: 24, W: 111 }, 13: { W: 21, E: 159, N: MAP, S: 8 },"),
    ("js/plugins/Orzel_Data.js",
     "22: { E: 21, S: 23, N: 8 },",
     "22: { E: 21, S: 23, W: 8 },"),
    ("js/plugins/Orzel_Data.js",
     "125: { E: 111, N: 155, S: 162 },",
     "125: { N: 8, S: 162 },"),
    # mapa wyspy w menu: drogi miedzy mapami (miasto <-> Przystan, Gory, Polna droga; Przystan <-> Lesna droga)
    ("js/plugins/MapaWyspy_Data.js",
     "[8, 22], [8, 24], [8, 111], [111, 125], [22, 21],",
     "[8, 22], [8, 125], [8, 13], [125, 21], [8, 24], [8, 111], [111, 125], [22, 21],"),
]


def zastosuj(tekst, old, new):
    """(nowy tekst, stan): 'zmieniono' | 'juz' | 'brak'"""
    if new in tekst: return tekst, "juz"
    if old not in tekst: return tekst, "brak"
    return tekst.replace(old, new, 1), "zmieniono"


def lf(t): return t.replace(chr(13) + chr(10), chr(10))
def crlf(t): return lf(t).replace(chr(10), chr(13) + chr(10))
def ma_crlf(raw): return bytes([13, 10]) in raw


def czytaj(rel):
    raw = open(os.path.join(ROOT, rel), "rb").read()
    return raw, raw.decode("utf-8")


def zbuduj_staging():
    for rel in sorted({p[0] for p in PATCHE}):
        raw, txt = czytaj(rel)
        crlf = b"\r\n" in raw
        t = txt.replace("\r\n", "\n")
        for (f, old, new) in PATCHE:
            if f == rel:
                t, st = zastosuj(t, old, new)
                print(rel, st, old[:50])
        if crlf: t = t.replace("\n", "\r\n")
        dst = os.path.join(HERE, "staging", rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(t.encode("utf-8"))


if __name__ == "__main__":
    zbuduj_staging()
