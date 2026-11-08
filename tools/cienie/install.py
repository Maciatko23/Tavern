# -*- coding: utf-8 -*-
"""Cienie od słońca (Cienie.js). Mapy się nie zmieniają.
  python tools/cienie/install.py --nakladka   lista wtyczek z wpisem do staging/js/ (GAME_OVERLAY=tools/cienie/staging GAME_OVERLAY_JS=1)
  python tools/cienie/install.py --wykonaj    wtyczka i wpis na liście gry (kopie: kopie_zapasowe/<czas>)"""
import datetime, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def wpis():
    src = open(os.path.join(STG, "js", "plugins", "Cienie.js"), encoding="utf-8").read()
    return {"name": "Cienie", "status": True, "description": re.search(r"@plugindesc[ \t]+(.+)", src).group(1).strip(), "parameters": {}}


lista = wtyczki.czytaj_liste()
stara = lista.tekst()
if not wtyczki.dodaj(lista, wpis(), po="Widok"):
    for e in lista.wpisy:
        if e["name"] == "Cienie": e["description"] = wpis()["description"]
nowa = lista.tekst()
if "--nakladka" in sys.argv:
    p = os.path.join(STG, "js", "tawerna_wtyczki.js")
    open(p, "wb").write(nowa)
    print("nakładka:", p)
elif "--wykonaj" in sys.argv:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    open(os.path.join(kop, "tawerna_wtyczki.js"), "wb").write(stara)
    g = os.path.join(ROOT, "js", "plugins", "Cienie.js")
    if os.path.exists(g): shutil.copy(g, os.path.join(kop, "Cienie.js"))
    shutil.copy(os.path.join(STG, "js", "plugins", "Cienie.js"), g)
    if nowa != stara: open(wtyczki.LISTA, "wb").write(nowa)
    print("zainstalowano; kopie:", kop)
else:
    print("użycie: --nakladka | --wykonaj")
