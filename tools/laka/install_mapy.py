# -*- coding: utf-8 -*-
"""INSTALACJA „nakładki na innych mapach” (tools/laka, 2026-11-05; gracz: „jak już ładne nakładki są, to może je zastosować na innych mapach”, „żeby kwiatów nie było
tak gęsto”). Tylko dwie wtyczki i dwa wpisy listy - żadna mapa się nie zmienia:
  js/plugins/Laka.js        v1.1.0: rzadsze kwiaty, sucha trawa żółta (nie szara), kępy i igliwie przy właściwej klatce drzewa, pamięć 4 ostatnich map; parametry maps, noFlowers
  js/plugins/Ziemia.js      cień przy stopie z własnej klatki zdarzenia, bez cienia pod !$Big_Trees (mają swój), dołki A2-20/21 z obrzeżem zostają rysowane w całości
  js/tawerna_wtyczki.js     wpis Laka (opis, parametry z nagłówka), wpis Ziemia: parametr maps = MAPY niżej
  python tools/laka/install_mapy.py --nakladka    (tylko lista gry z tymi wpisami do tools/laka/staging/js/ - do prób: GAME_OVERLAY=tools/laka/staging GAME_OVERLAY_JS=1)
  python tools/laka/install_mapy.py --dry-run | --wykonaj    (kopie zapasowe: tools/laka/kopie_zapasowe/<czas>_mapy)
Żywe wtyczki muszą być jeszcze tymi, z których zrobiono staging - inaczej STOP. Lista gry jest czytana z żywego pliku w chwili instalacji."""
import os, sys, re, hashlib, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

PLIKI = {"Laka": "ad74d81151c693aa", "Ziemia": "9e7899cd0774ecff"}
MAPY = "3,4,8,13,17,18,20,21,22,23,24,111,120,125,155,157,159,162,165,168,175,900,901,910,912,914,917,918,920,922,923,931,933,934,935,950,951,960,961,962,963,964,990,991"


def sha(b): return hashlib.sha256(b).hexdigest()


def naglowek(nazwa):
    src = open(os.path.join(STG, "js", "plugins", nazwa + ".js"), encoding="utf-8").read()
    m = re.search(r"/\*:(?![A-Za-z~])(.*?)\*/", src, re.S)
    nag = m.group(1) if m else ""
    d = re.search(r"@plugindesc[ \t]+(.+)", nag)
    params, cur = {}, None
    for line in nag.splitlines():
        line = line.strip().lstrip("*").strip()
        mp = re.match(r"@param\s+(\S+)", line)
        if mp: cur = mp.group(1); params[cur] = ""; continue
        md = re.match(r"@default(?:\s(.*))?$", line)
        if md and cur: params[cur] = (md.group(1) or "").strip()
    return d.group(1).strip(), params


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    lista = wtyczki.czytaj_liste()
    stara = lista.tekst()
    for e in lista.wpisy:
        if e["name"] == "Laka": e["description"], e["parameters"] = naglowek("Laka")
        if e["name"] == "Ziemia": e["parameters"]["maps"] = MAPY
    nowa = lista.tekst()
    if "--nakladka" in sys.argv:
        lista.path = os.path.join(STG, "js", "tawerna_wtyczki.js")
        open(lista.path, "wb").write(nowa)
        print("nakładka:", lista.path)
        return
    zmiany, stop = [], False
    for n, przed in PLIKI.items():
        stg, gra = os.path.join(STG, "js", "plugins", n + ".js"), os.path.join(ROOT, "js", "plugins", n + ".js")
        nowy, stary = open(stg, "rb").read(), open(gra, "rb").read()
        if sha(stary)[:16] != przed and stary != nowy: print("STOP  js/plugins/%s.js zmieniony od przygotowania (%s)" % (n, sha(stary)[:16])); stop = True; continue
        print("%-7s js/plugins/%s.js  %d B -> %d B  %s -> %s" % ("BEZ ZM." if stary == nowy else "ZMIEN", n, len(stary), len(nowy), sha(stary)[:16], sha(nowy)[:16]))
        if stary != nowy: zmiany.append((gra, stary, nowy, n))
    print("%-7s js/tawerna_wtyczki.js  (%+d B: wpisy Laka i Ziemia)" % ("ZMIEN" if stara != nowa else "BEZ ZM.", len(nowa) - len(stara)))
    if stop: sys.exit("nic nie zapisano")
    if not wykonaj: print("(dry-run: nic nie zapisano; po zgodzie gracza: python tools/laka/install_mapy.py --wykonaj)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_mapy")
    os.makedirs(os.path.join(kop, "js", "plugins"), exist_ok=True)
    for gra, stary, nowy, n in zmiany:
        open(os.path.join(kop, "js", "plugins", n + ".js"), "wb").write(stary)
        open(gra, "wb").write(nowy)
    open(os.path.join(kop, "js", "tawerna_wtyczki.js"), "wb").write(stara)
    if nowa != stara: open(wtyczki.LISTA, "wb").write(nowa)
    print("zainstalowano; kopie zapasowe:", kop)


if __name__ == "__main__": main()
