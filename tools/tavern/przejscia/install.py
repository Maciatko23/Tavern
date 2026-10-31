# -*- coding: utf-8 -*-
"""Instalacja części A: przywrócenie przejść w Map001.
  python tools/tavern/przejscia/install.py --dry-run     pokazuje, co zapisałaby (nic nie zapisuje)
  python tools/tavern/przejscia/install.py               zapis (edytor zamknięty)
Zapisuje JEDEN plik, data/Map001.json <- staging/Map001.json, tylko gdy obecny plik ma skrót sha256 z staging/baza.json
(df79a85f...); przed zapisem kopia zapasowa w tools/tavern/przejscia/kopie/. Zmienia tylko: kafle 61 kratek przejść i ich
sąsiadów (kształty autokafli), przejścia przy ladzie (kratki 45 i 55, wiersze 29-30, zakończenia lady) i położenie Borgara
(zdarzenie 1: 50,28 -> 52,28). Nic więcej."""
import datetime, hashlib, json, os, shutil, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
H = os.path.join(ROOT, "tools", "tavern", "przejscia")
MAPA = os.path.join(ROOT, "data", "Map001.json"); KOPIA = os.path.join(H, "staging", "Map001.json"); BAZA = os.path.join(H, "staging", "baza.json")
def main():
    sucho = "--dry-run" in sys.argv
    baza = json.load(open(BAZA, encoding="utf-8")); teraz = hashlib.sha256(open(MAPA, "rb").read()).hexdigest()
    print("data/Map001.json:", teraz); print("skrót kopii:     ", baza["sha256"])
    if teraz != baza["sha256"]:
        print("STOP: data/Map001.json zmieniony po utworzeniu kopii. Nic nie zapisano. Zrób kopię od nowa: python tools/tavern/przejscia/build.py")
        return 2
    nowa = open(KOPIA, "rb").read(); print("zapisze data/Map001.json: %d B (było %d B), zmienionych kafli: %s" % (len(nowa), os.path.getsize(MAPA), baza["zmienione_kafle"]))
    zapas = os.path.join(H, "kopie", "Map001_%s.json" % datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); print("kopia zapasowa:", zapas)
    if sucho: print("--dry-run: nic nie zapisano."); return 0
    os.makedirs(os.path.dirname(zapas), exist_ok=True); shutil.copy2(MAPA, zapas)
    open(MAPA, "wb").write(nowa); print("zapisano."); return 0
if __name__ == "__main__": sys.exit(main())
