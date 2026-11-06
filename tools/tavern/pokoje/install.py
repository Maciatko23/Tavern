# -*- coding: utf-8 -*-
"""Zakrywanie pomieszczeń (Pokoje.js; gracz 2026-11-05: „da się zakryć to czego gracz nie widzi?”, mgła wojny, próbka na tawernie). Mapy się nie zmieniają.
  python tools/tavern/pokoje/install.py --nakladka     lista wtyczek z wpisem do staging/js/ (próby: GAME_OVERLAY=tools/tavern/pokoje/staging GAME_OVERLAY_JS=1)
  python tools/tavern/pokoje/install.py --wykonaj      wtyczka i wpis na liście gry (kopia listy: kopie_zapasowe/<czas>)"""
import datetime, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def wpis():
    src = open(os.path.join(STG, "js", "plugins", "Pokoje.js"), encoding="utf-8").read()
    return {"name": "Pokoje", "status": True, "description": re.search(r"@plugindesc[ \t]+(.+)", src).group(1).strip(), "parameters": {}}


lista = wtyczki.czytaj_liste()
stara = lista.tekst()
if not wtyczki.dodaj(lista, wpis(), po="Goscie_Sala"):
    for e in lista.wpisy:
        if e["name"] == "Pokoje": e["description"] = wpis()["description"]
nowa = lista.tekst()
if "--nakladka" in sys.argv:
    p = os.path.join(STG, "js", "tawerna_wtyczki.js")
    open(p, "wb").write(nowa)
    print("nakładka:", p)
elif "--wykonaj" in sys.argv:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    open(os.path.join(kop, "tawerna_wtyczki.js"), "wb").write(stara)
    shutil.copy(os.path.join(STG, "js", "plugins", "Pokoje.js"), os.path.join(ROOT, "js", "plugins", "Pokoje.js"))
    if nowa != stara: open(wtyczki.LISTA, "wb").write(nowa)
    print("zainstalowano; kopia listy:", kop)
else:
    print("użycie: --nakladka | --wykonaj")
