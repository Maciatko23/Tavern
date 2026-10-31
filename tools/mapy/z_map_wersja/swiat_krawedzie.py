# -*- coding: utf-8 -*-
# Sprawdzanie krawędzi świata „z map” (PROJEKT; nic nie zapisuje do data/ ani js/). Do etapów budowy: po każdym etapie sprawdza KAŻDĄ krawędź każdej mapy
# kratka po kratce:
#  - wspólna krawędź dwóch map: woda <-> woda, ląd <-> ląd (kratki niezgodne = „kratki do poprawienia na styku”), przecięcie brzegu w tej samej
#    kratce świata i pod tym samym kątem (skok na granicy <= 3 kratki), przejścia (obecne wyjścia) w tej samej kratce;
#  - krawędź bez sąsiada: musi być w całości morzem. UCIĘTE KRAWĘDZIE = krawędź mapy bez sąsiada, na której jest ląd albo woda mapy, która nie jest morzem
#    świata (ląd urwany prosto na krawędzi, brzeg biegnący wzdłuż krawędzi). Ma być 0;
#  - nakładanie map = 0, wszystkie mapy połączone przejściami.
#   python tools/mapy/swiat_krawedzie.py [--tylko 8,125] [--kratki]
import os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
import swiat_kratki as K


def sprawdz(sw, sas, bk, tylko=None):
    ct = [c for c in sw.ucięte() if not tylko or c["mapa"] in tylko]
    nz = [c for c in sw.niezgodne() if not tylko or c["mapa"] in tylko]
    return ct, nz


def main():
    tylko = None
    if "--tylko" in sys.argv: tylko = {int(x) for x in sys.argv[sys.argv.index("--tylko") + 1].split(",")}
    sw, sas = K.wszystko()
    bk = sw.brzeg_na_krawedziach(sas)
    ct, nz = sprawdz(sw, sas, bk, tylko)
    stare = K.porownaj_stare(sw, sas)
    print("Sprawdzanie krawędzi świata: %d map (w tym %d nowych), %d wspólnych krawędzi" % (len(sw.ids), len(sw.new), len(sas)))
    print("%-14s %-3s %-9s %-5s %s" % ("mapy", "str", "odcinek", "skok", "brzeg przecina krawędź (kratka świata: kąt)"))
    for e in bk:
        if tylko and e["a"] not in tylko and e["b"] not in tylko: continue
        brz = "; ".join("%d: %s°" % (c["pos"], c["kat"]) for c in e["przeciecia"][:4]) + (" ..." if len(e["przeciecia"]) > 4 else "")
        print("%-14s %-3s %-9s %-5s %s" % ("%d | %d" % (e["a"], e["b"]), e["strona"], "%d-%d" % (e["od"], e["do"]), e["skok_kratek"], brz))
    skok = max([e["skok_kratek"] for e in bk] or [0])
    print()
    print("Nakładanie map: %d kratek" % sw.naklad)
    print("UCIĘTE KRAWĘDZIE (krawędź bez sąsiada z lądem): %d odcinków, %d kratek" % (len(ct), sum(c["kratek"] for c in ct)))
    for c in ct[:40]: print("   mapa %d, krawędź %s, kratki %d-%d (%d)" % (c["mapa"], c["strona"], c["od"], c["do"], c["kratek"]))
    print("Kratki do poprawienia na styku (woda po jednej, ląd po drugiej stronie): %d" % len(nz))
    print("Największe przesunięcie przecięcia brzegu na granicy map: %d kratek" % skok)
    zost = sum(1 for s in stare if s["kod"] == "zostaje"); prz = sum(1 for s in stare if s["kod"] == "przesuniete")
    print("Obecne wyjścia: %d zostaje w tej samej kratce, %d przesuniętych, %d zmienia cel lub zamyka się" % (zost, prz, len(stare) - zost - prz))
    nie = sw.polaczone(sas)
    print("Mapy niepołączone: %s" % (nie or "brak"))
    ok = (sw.naklad == 0 and not ct and not nie and skok <= 3)
    print("WYNIK:", "OK" if ok else "BŁĄD")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
