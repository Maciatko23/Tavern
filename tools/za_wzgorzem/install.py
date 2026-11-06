# -*- coding: utf-8 -*-
"""INSTALACJA „za wzgórzem” (tools/za_wzgorzem, 2026-11-03): region 3 na tylnej krawędzi wzgórza (kafelek A5 z brzegiem od góry) to ziemia za wzgórzem,
cała kratka nad bohaterem. Tylko dwie wtyczki i opis jednego wpisu na liście gry - żadna mapa się nie zmienia:
  js/plugins/RegionLayers.js     v1.1.0 ze stagingu: przejścia w kratkach tylnej krawędzi + maska postaci za nią
  js/plugins/FreeMovement.js     ze stagingu: stopy nie schodzą ze szczytu przez krawędź A5 (pyta też kafelek, który opuszczają)
  js/tawerna_wtyczki.js          nowy opis wpisu RegionLayers (status i parametry bez zmian)
  python tools/za_wzgorzem/install.py --dry-run     (domyślnie; nic nie zapisuje, wypisuje różnice i skróty sha256)
  python tools/za_wzgorzem/install.py --wykonaj     (po zgodzie gracza; kopie zapasowe w tools/za_wzgorzem/kopie_zapasowe/<czas>)
Żywe wtyczki muszą być jeszcze tymi, z których zrobiono staging (skróty niżej) - inaczej STOP (zmieniła je inna sesja)."""
import os, sys, re, hashlib, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# wtyczka -> skrót sha256 (16 znaków) żywego pliku, z którego zrobiono staging
# (2026-11-03 19:00: RegionLayers v1.1.0 + FreeMovement; potem: tylne krawędzie-mury zestawu 9, parametr backRims)
PLIKI = {"RegionLayers": "b3672e07b6097e06", "Farming_Build": "5113ccb54198ee01"}


def sha(b): return hashlib.sha256(b).hexdigest()


def opis(nazwa):
    src = open(os.path.join(STG, "js", "plugins", nazwa + ".js"), encoding="utf-8").read()
    m = re.search(r"/\*:(?![A-Za-z~])(.*?)\*/", src, re.S)
    d = re.search(r"@plugindesc[ \t]+(.+)", m.group(1) if m else "")
    return d.group(1).strip() if d else None


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    zmiany, stop = [], False
    for nazwa, przed in PLIKI.items():
        stg, gra = os.path.join(STG, "js", "plugins", nazwa + ".js"), os.path.join(ROOT, "js", "plugins", nazwa + ".js")
        nowy, stary = open(stg, "rb").read(), open(gra, "rb").read()
        if sha(stary)[:16] != przed and stary != nowy:
            print("STOP  js/plugins/%s.js: żywy plik %s, a staging zrobiono z %s (zmieniła go inna sesja?)" % (nazwa, sha(stary)[:16], przed)); stop = True; continue
        print("%-7s js/plugins/%s.js   %d B -> %d B  sha256 %s -> %s" % ("BEZ ZM." if stary == nowy else "ZMIEN", nazwa, len(stary), len(nowy), sha(stary)[:16], sha(nowy)[:16]))
        if stary != nowy: zmiany.append((gra, stary, nowy, nazwa))
    lista = wtyczki.czytaj_liste()
    stary_lista = lista.tekst()
    for e in lista.wpisy:
        if e["name"] == "RegionLayers":
            e["description"] = opis("RegionLayers") or e["description"]
            if "backRims" not in e["parameters"]: e["parameters"]["backRims"] = "88:10,89:8,90:12,93:10,94:8,95:12"
    nowy_lista = lista.tekst()
    print("%-7s js/tawerna_wtyczki.js   %s" % ("ZMIEN" if stary_lista != nowy_lista else "BEZ ZM.", "(opis wpisu RegionLayers)"))
    if stop: sys.exit("\nnic nie zapisano")
    if not wykonaj:
        print("\n(dry-run: nic nie zapisano; po zgodzie gracza: python tools/za_wzgorzem/install.py --wykonaj)")
        return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(os.path.join(kop, "js", "plugins"), exist_ok=True)
    for gra, stary, nowy, nazwa in zmiany: open(os.path.join(kop, "js", "plugins", nazwa + ".js"), "wb").write(stary)
    open(os.path.join(kop, "js", "tawerna_wtyczki.js"), "wb").write(stary_lista)
    for gra, stary, nowy, nazwa in zmiany: open(gra, "wb").write(nowy)
    if nowy_lista != stary_lista: open(wtyczki.LISTA, "wb").write(nowy_lista)
    ok = all(sha(open(gra, "rb").read()) == sha(nowy) for gra, stary, nowy, nazwa in zmiany)
    print("zainstalowano%s; kopie zapasowe: %s" % ("" if ok else " (UWAGA: skrót pliku się nie zgadza!)", kop))


if __name__ == "__main__":
    main()
