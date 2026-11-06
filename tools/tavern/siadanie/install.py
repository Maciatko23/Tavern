# -*- coding: utf-8 -*-
"""INSTALACJA „goście w sali” (tools/tavern/siadanie, 2026-11-05; gracz: siedzenie na okrągłych krzesłach, rozmowa z każdym, wstawanie, chodzenie, jedzenie, picie):
  js/plugins/Goscie_Sala.js        nowa wtyczka; wpis na liście za Goscie_Data
  js/teksty/goscie_sali.txt        kwestie 23 gości
  js/plugins/Przytulna.js          goście stołowi oddani nowej wtyczce (mieszkańcy zostają)
  img/characters/Przytulna_Siedzi_*.png   nowe arkusze (wiersze 0-1 pije, 2-3 je)
Mapy się nie zmieniają.
  python tools/tavern/siadanie/install.py --nakladka     (lista gry z wpisem do staging/js/ - do prób: GAME_OVERLAY=tools/tavern/siadanie/staging GAME_OVERLAY_JS=1)
  python tools/tavern/siadanie/install.py --dry-run | --wykonaj     (kopie zapasowe: tools/tavern/siadanie/kopie_zapasowe/<czas>)
Żywy Przytulna.js musi być tym, z którego zrobiono staging - inaczej STOP."""
import os, sys, re, glob, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
ZNACZNIK = b"if (m && window.GoscieSala) continue;"   # jedyny wiersz, którym staging różni się od żywego Przytulna.js


def zgodny_przytulna():
    """Żywy plik = staging bez tego jednego wiersza (albo już staging, czyli powtórna instalacja)."""
    zywy = open(os.path.join(ROOT, "js", "plugins", "Przytulna.js"), "rb").read()
    nowy = open(os.path.join(STG, "js", "plugins", "Przytulna.js"), "rb").read()
    wiersze = nowy.split(b"\n")
    bez = [w for w in wiersze if ZNACZNIK not in w]
    return len(wiersze) - len(bez) == 1 and zywy in (nowy, b"\n".join(bez))


def wpis():
    src = open(os.path.join(STG, "js", "plugins", "Goscie_Sala.js"), encoding="utf-8").read()
    d = re.search(r"@plugindesc[ \t]+(.+)", src).group(1).strip()
    return {"name": "Goscie_Sala", "status": True, "description": d, "parameters": {}}


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    lista = wtyczki.czytaj_liste()
    stara = lista.tekst()
    if not wtyczki.dodaj(lista, wpis(), po="Goscie_Data"):
        for e in lista.wpisy:
            if e["name"] == "Goscie_Sala": e["description"] = wpis()["description"]
    nowa = lista.tekst()
    if "--nakladka" in sys.argv:
        lista.path = os.path.join(STG, "js", "tawerna_wtyczki.js")
        open(lista.path, "wb").write(nowa)
        print("nakładka:", lista.path)
        return
    if not zgodny_przytulna():
        print("STOP: żywy js/plugins/Przytulna.js zmienił się od budowy stagingu - przenieś wiersz z ZNACZNIK ręcznie i powtórz.")
        sys.exit(1)
    pliki = ["js/plugins/Goscie_Sala.js", "js/teksty/goscie_sali.txt", "js/plugins/Przytulna.js", "js/plugins/TownLife.js"] + sorted(os.path.relpath(p, STG).replace("\\", "/") for p in glob.glob(os.path.join(STG, "img", "characters", "*.png")))
    zmiany = []
    for rel in pliki:
        n, g = open(os.path.join(STG, rel), "rb").read(), os.path.join(ROOT, rel)
        st = open(g, "rb").read() if os.path.exists(g) else None
        if st != n: zmiany.append((rel, g, st, n))
        print("%-7s %s" % ("NOWY" if st is None else "BEZ ZM." if st == n else "ZMIEN", rel))
    print("%-7s js/tawerna_wtyczki.js" % ("ZMIEN" if nowa != stara else "BEZ ZM."))
    if not wykonaj: print("(dry-run: nic nie zapisano; po zgodzie gracza: --wykonaj)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, g, st, n in zmiany:
        if st is not None:
            os.makedirs(os.path.dirname(os.path.join(kop, rel)), exist_ok=True)
            open(os.path.join(kop, rel), "wb").write(st)
        os.makedirs(os.path.dirname(g), exist_ok=True)
        open(g, "wb").write(n)
    os.makedirs(os.path.join(kop, "js"), exist_ok=True)
    open(os.path.join(kop, "js", "tawerna_wtyczki.js"), "wb").write(stara)
    if nowa != stara: open(wtyczki.LISTA, "wb").write(nowa)
    print("zainstalowano; kopie zapasowe:", kop)


if __name__ == "__main__": main()
