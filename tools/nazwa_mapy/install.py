# -*- coding: utf-8 -*-
"""Kinowa nazwa mapy z gotowych obrazków (gracz 2026-11-06: „napis mapy i opis w całości, przy końcu zanika, bez zbędnych animacji,
wydajność ważniejsza”, „po prostu miej gotowe obrazki”). Wtyczka i testy z tools/nazwa_mapy na swoje miejsca; obrazki robi obrazki.js.
  python tools/nazwa_mapy/install.py --wykonaj      (kopia starych plików: kopie_zapasowe/<czas>)"""
import datetime, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

PLIKI = [  # (skąd w tools/nazwa_mapy, dokąd w grze)
    ("staging/js/plugins/CleanHUD.js", "js/plugins/CleanHUD.js"),
    ("clean_hud_test.js", "tests/clean_hud_test.js"),
    ("nazwy_map_test.js", "tests/nazwy_map_test.js"),
]
if "--wykonaj" not in sys.argv:
    print("użycie: --wykonaj"); sys.exit(0)
if not os.path.exists(os.path.join(ROOT, "img", "nazwy_map", "spis.json")):
    print("brak img/nazwy_map/spis.json: najpierw node tools/nazwa_mapy/obrazki.js"); sys.exit(1)
kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
os.makedirs(kop, exist_ok=True)
for z, do in PLIKI:
    g = os.path.join(ROOT, do)
    if os.path.exists(g): shutil.copy(g, os.path.join(kop, os.path.basename(do)))
    shutil.copy(os.path.join(HERE, z), g)
print("zainstalowano; kopie:", kop)
