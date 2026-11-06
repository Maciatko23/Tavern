# -*- coding: utf-8 -*-
"""Wylot jaskini na Przystani (Map125, gracz 2026-11-05 „tak”): 1 listopada razem z gęstymi liśćmi zniknęła ściana pod obrazkiem !$Lud_Jaskinia (zdarzenie 2610 na 16,64 blokuje tylko
swoją kratkę), więc dało się wejść w prawą połowę skały; Okolice_Data „jaskinia_wejscie” wymaga tam ściany. Region 2 (RegionLayers: zawsze blokuje) na kratkach (16,64) i (17,64) -
widoczną przeszkodą jest sam obrazek jaskini. W pliku zmieniają się tylko te dwie liczby warstwy regionów.
  python tools/poprawki/jaskinia_przystan.py --dry-run | --wykonaj   (edytor zamknięty! kopia: tools/poprawki/kopie/Map125_<czas>.json)"""
import os, sys, json, hashlib, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
P = os.path.join(ROOT, "data", "Map125.json")
KRATKI = [(16, 64), (17, 64)]


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    b = open(P, "rb").read()
    m = json.loads(b.decode("utf-8"))
    W, H = m["width"], m["height"]
    i = b.find(b'"data":[') + 8; j = b.find(b"]", i)
    vals = b[i:j].split(b",")
    assert len(vals) == 6 * W * H
    for (x, y) in KRATKI:
        k = (5 * H + y) * W + x
        assert vals[k] in (b"0", b"2"), (x, y, vals[k])
        vals[k] = b"2"
    nb = b[:i] + b",".join(vals) + b[j:]
    print("Map125: region 2 na", KRATKI, hashlib.sha256(b).hexdigest()[:16], "->", hashlib.sha256(nb).hexdigest()[:16])
    if not wykonaj: print("(dry-run)"); return
    d = os.path.join(ROOT, "tools", "poprawki", "kopie"); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "Map125_%s.json" % datetime.datetime.now().strftime("%Y%m%d_%H%M%S")), "wb").write(b)
    open(P, "wb").write(nb)
    print("zapisano")


if __name__ == "__main__": main()
