# -*- coding: utf-8 -*-
"""INSTALACJA „szybsze przejścia między mapami” (tools/przejscia, 2026-11-03; pomiar: tools/przejscia/pomiar.js - 1,3 s -> 0,76 s średnio,
3,1 s -> 2,1 s przy CPU 4x). Tylko trzy wtyczki ze stagingu - żadna mapa ani lista wtyczek się nie zmienia:
  js/plugins/Wydajnosc.js      arkusze kafli już w karcie graficznej nie są wysyłane ponownie; ściemnianie i rozjaśnianie przejścia 12 klatek (było 24)
  js/plugins/GroundDetail.js   kępki trawy: spis zajętych kratek raz, zamiast eventsXy dla każdej kratki
  js/plugins/Puddles.js        kałuże: to samo
  python tools/przejscia/install.py --dry-run | --wykonaj   (kopie zapasowe: tools/przejscia/kopie_zapasowe/<czas>)
Żywe wtyczki muszą być jeszcze tymi, z których zrobiono staging - inaczej STOP."""
import os, sys, hashlib, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLIKI = {"Wydajnosc": "e2037febffef0c6b", "GroundDetail": "4839430f24a28015", "Puddles": "13e04cb67369f637"}
def sha(b): return hashlib.sha256(b).hexdigest()
def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    zmiany, stop = [], False
    for n, przed in PLIKI.items():
        stg, gra = os.path.join(STG, "js", "plugins", n + ".js"), os.path.join(ROOT, "js", "plugins", n + ".js")
        nowy, stary = open(stg, "rb").read(), open(gra, "rb").read()
        if sha(stary)[:16] != przed and stary != nowy: print("STOP  js/plugins/%s.js zmieniony od przygotowania (%s)" % (n, sha(stary)[:16])); stop = True; continue
        print("%-7s js/plugins/%s.js  %d B -> %d B  %s -> %s" % ("BEZ ZM." if stary == nowy else "ZMIEN", n, len(stary), len(nowy), sha(stary)[:16], sha(nowy)[:16]))
        if stary != nowy: zmiany.append((gra, stary, nowy, n))
    if stop: sys.exit("nic nie zapisano")
    if not wykonaj: print("(dry-run: nic nie zapisano; python tools/przejscia/install.py --wykonaj)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"), "js", "plugins")
    os.makedirs(kop, exist_ok=True)
    for gra, stary, nowy, n in zmiany: open(os.path.join(kop, n + ".js"), "wb").write(stary); open(gra, "wb").write(nowy)
    print("zainstalowano; kopie zapasowe:", os.path.dirname(os.path.dirname(kop)))
if __name__ == "__main__": main()
