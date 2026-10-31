# -*- coding: utf-8 -*-
"""Instalacja próby „Przytulna sala”.
  python tools/tavern/przytulna/install.py --dry-run     tylko pokazuje, co zapisałaby (NIE zapisuje nic)
  python tools/tavern/przytulna/install.py               zapis (dopiero po zatwierdzeniu próby przez gracza; edytor zamknięty)
Zapisuje DWA pliki:
  1. data/Map001.json  <- tools/tavern/przytulna/staging/Map001.json, ale TYLKO gdy obecny data/Map001.json ma ten sam skrót
     (sha256) co plik, z którego zrobiono kopię (staging/baza.json). Gdy gracz zmienił mapę w edytorze po utworzeniu kopii,
     instalacja staje (trzeba na nowo: python tools/tavern/przytulna/build.py). Przed zapisem kopia zapasowa:
     tools/tavern/przytulna/kopie/Map001_<data>.json.
  2. js/tawerna_wtyczki.js: parametr enabled wtyczki Przytulna = true (włącza światło, nastrój i życie sali; gracz może to
     wyłączyć w Opcjach: „Przytulna sala (próba)”).
Obrazy (img/characters/!$Przytulna_Kruk.png, Przytulna_Grajek_Lutnia.png, Przytulna_Borgar_Wyciera.png) i wtyczka
(js/plugins/Przytulna.js, wpis na liście) są już w grze od czasu próby - nic nie nadpisują."""
import datetime, hashlib, json, os, shutil, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MAPA = os.path.join(ROOT, "data", "Map001.json")
KOPIA = os.path.join(ROOT, "tools", "tavern", "przytulna", "staging", "Map001.json")
BAZA = os.path.join(ROOT, "tools", "tavern", "przytulna", "staging", "baza.json")
LISTA = os.path.join(ROOT, "js", "tawerna_wtyczki.js")
KOPIE = os.path.join(ROOT, "tools", "tavern", "przytulna", "kopie")


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def main():
    sucho = "--dry-run" in sys.argv
    baza = json.load(open(BAZA, encoding="utf-8"))
    teraz = sha(MAPA)
    print("data/Map001.json:        ", teraz)
    print("skrót przy tworzeniu kopii:", baza["sha256"])
    if teraz != baza["sha256"]:
        print("STOP: data/Map001.json zmieniono po utworzeniu kopii (gracz w edytorze?). Nic nie zapisano.")
        print("      Zrób kopię od nowa: python tools/tavern/przytulna/build.py, obejrzyj zdjęcia i dopiero wtedy instaluj.")
        return 2
    nowa = open(KOPIA, "rb").read()
    zdarzen = len(json.loads(nowa.decode("utf-8"))["events"])
    print("zapisze data/Map001.json: %d B (było %d B), zdarzeń w tablicy: %d, nowe id: %s" % (len(nowa), os.path.getsize(MAPA), zdarzen, baza["nowe_id"]))
    zapas = os.path.join(KOPIE, "Map001_%s.json" % datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    print("kopia zapasowa przed zapisem:", zapas)
    raw = open(LISTA, "rb").read()
    i = raw.index(b'{"name":"Przytulna"')
    j = raw.index(b"\n", i)
    wiersz = raw[i:j]
    nowy = wiersz.replace(b'"enabled":"false"', b'"enabled":"true"')
    print("js/tawerna_wtyczki.js: wpis Przytulna: enabled", "false -> true" if nowy != wiersz else "(już true)")
    if sucho:
        print("--dry-run: nic nie zapisano.")
        return 0
    os.makedirs(KOPIE, exist_ok=True)
    shutil.copy2(MAPA, zapas)
    with open(MAPA, "wb") as f:
        f.write(nowa)
    with open(LISTA, "wb") as f:
        f.write(raw[:i] + nowy + raw[j:])
    print("zapisano. Wycofanie: skopiuj kopię zapasową z powrotem na data/Map001.json i ustaw enabled=false.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
