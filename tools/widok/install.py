# -*- coding: utf-8 -*-
"""Widok na dworze (Widok.js; gracz 2026-11-06: „robimy plener mądrze”). Mapy się nie zmieniają.
  python tools/widok/install.py --nakladka     lista wtyczek z wpisem do staging/js/ (próby: GAME_OVERLAY=tools/widok/staging GAME_OVERLAY_JS=1)
  python tools/widok/install.py --wykonaj      wtyczka i wpis na liście gry (kopia listy i starej wtyczki: kopie_zapasowe/<czas>)"""
import datetime, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def wpis():
    src = open(os.path.join(STG, "js", "plugins", "Widok.js"), encoding="utf-8").read()
    return {"name": "Widok", "status": True, "description": re.search(r"@plugindesc[ \t]+(.+)", src).group(1).strip(), "parameters": {}}


lista = wtyczki.czytaj_liste()
stara = lista.tekst()
if not wtyczki.dodaj(lista, wpis(), po="Pokoje"):
    for e in lista.wpisy:
        if e["name"] == "Widok": e["description"] = wpis()["description"]
nowa = lista.tekst()
if "--nakladka" in sys.argv:
    p = os.path.join(STG, "js", "tawerna_wtyczki.js")
    open(p, "wb").write(nowa)
    print("nakładka:", p)
elif "--wykonaj" in sys.argv:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    open(os.path.join(kop, "tawerna_wtyczki.js"), "wb").write(stara)
    g = os.path.join(ROOT, "js", "plugins", "Widok.js")
    if os.path.exists(g): shutil.copy(g, os.path.join(kop, "Widok.js"))
    shutil.copy(os.path.join(STG, "js", "plugins", "Widok.js"), g)
    if nowa != stara: open(wtyczki.LISTA, "wb").write(nowa)
    print("zainstalowano; kopie:", kop)
else:
    print("użycie: --nakladka | --wykonaj")
