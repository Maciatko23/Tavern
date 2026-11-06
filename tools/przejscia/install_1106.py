# -*- coding: utf-8 -*-
"""Szybsze wejście na mapę (gracz 2026-11-06: „jak drastycznie przyspieszyć wczytywanie mapy”, „instaluj kiedy będziesz mógł”):
  - CzerwonaWoda.js: kawałki brzegu malowane w wątkach w tle (Web Worker), ekran czeka tylko na widoczne (tools/teren_watek)
  - Farming_Plots.js / Farming.js / Farming_Render.js / Dog.js: zajęte kratki liczone raz na przebudowę warstwy rzeczy na ziemi
    i na szukanie psa (withEventCells)
  - Wydajnosc.js: bez zrzutu tła przy przejściu z mapy na mapę (opts.transferSnap)
  python tools/przejscia/install_1106.py --wykonaj      (kopia starych: kopie_zapasowe/<czas>_1106)"""
import datetime, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging_razem", "js", "plugins")
PLIKI = ["CzerwonaWoda.js", "Farming_Plots.js", "Farming.js", "Farming_Render.js", "Dog.js", "Wydajnosc.js"]
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
if "--wykonaj" not in sys.argv:
    print("użycie: --wykonaj"); sys.exit(0)
kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_1106")
os.makedirs(kop, exist_ok=True)
for f in PLIKI:
    g = os.path.join(ROOT, "js", "plugins", f)
    shutil.copy(g, os.path.join(kop, f))
    shutil.copy(os.path.join(STG, f), g)
print("zainstalowano " + ", ".join(PLIKI) + "; kopie:", kop)
