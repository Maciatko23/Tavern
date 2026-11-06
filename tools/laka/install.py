# -*- coding: utf-8 -*-
"""INSTALACJA PRÓBY „łąka” (tools/laka, 2026-11-03). Tylko wtyczka i jeden wpis na liście gry - żadna mapa się nie zmienia:
  js/plugins/Laka.js          nowy plik, ze stagingu (tools/laka/staging/js/plugins/Laka.js)
  js/tawerna_wtyczki.js          + wpis „Wzgorza” zaraz pod „GroundDetail” (opis i parametry z nagłówka wtyczki; python tools/wtyczki.py --dodaj to samo)
  python tools/laka/install.py --dry-run     (domyślnie; nic nie zapisuje, wypisuje różnice i skróty sha256)
  python tools/laka/install.py --wykonaj     (po zgodzie gracza; kopie zapasowe zmienionych plików w tools/laka/kopie_zapasowe/<czas>)
  python tools/laka/install.py --nakladka    (tylko buduje nakładkę do prób w grze: tools/laka/staging/js/tawerna_wtyczki.js;
                                                 GAME_OVERLAY=tools/laka/staging GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/laka_test.js)
Lista gry jest czytana z żywego pliku w chwili instalacji (zmiany innych sesji zostają). Końce linii jak w pliku (wtyczki.py)."""
import os, sys, re, json, hashlib, shutil, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

NAZWA = "Laka"
PO = "GroundDetail"
PLIK_STG = os.path.join(STG, "js", "plugins", NAZWA + ".js")
PLIK_GRA = os.path.join(ROOT, "js", "plugins", NAZWA + ".js")


def sha(b): return hashlib.sha256(b).hexdigest()


def wpis():
    src = open(PLIK_STG, encoding="utf-8").read()
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
    return {"name": NAZWA, "status": True, "description": d.group(1).strip(), "parameters": params}


def main():
    if not os.path.exists(PLIK_STG): sys.exit("STOP: brak %s" % PLIK_STG)
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    lista = wtyczki.czytaj_liste()
    stary_lista = lista.tekst()
    nowy_wpis = wpis()
    dodano = wtyczki.dodaj(lista, nowy_wpis, po=PO)
    if not dodano:   # (wtyczka już zainstalowana: wpis na liście dostaje nowy opis i parametry, kolejność i status zostają)
        for e in lista.wpisy:
            if e["name"] == NAZWA:
                e["description"], e["parameters"] = nowy_wpis["description"], nowy_wpis["parameters"]
    nowy_lista = lista.tekst()
    nowy_plik = open(PLIK_STG, "rb").read()
    stary_plik = open(PLIK_GRA, "rb").read() if os.path.exists(PLIK_GRA) else None
    if "--nakladka" in sys.argv:
        lista.path = os.path.join(STG, "js", "tawerna_wtyczki.js")
        os.makedirs(os.path.dirname(lista.path), exist_ok=True)
        open(lista.path, "wb").write(nowy_lista)
        print("nakładka:", STG, "(lista gry z wpisem %s: %s)" % (NAZWA, "dodany" if dodano else "już był"))
        return
    if stary_plik is not None: print("zainstalowana teraz: %d B  sha256 %s" % (len(stary_plik), sha(stary_plik)[:16]))
    print("%-6s js/plugins/%s.js   %d B  sha256 %s" % ("NOWY" if stary_plik is None else ("BEZ ZM." if stary_plik == nowy_plik else "ZMIEN"), NAZWA, len(nowy_plik), sha(nowy_plik)[:16]))
    print("%-6s js/tawerna_wtyczki.js   %s" % ("ZMIEN" if stary_lista != nowy_lista else "BEZ ZM.", "(%+d B: %s)" % (len(nowy_lista) - len(stary_lista), ("wpis %s pod %s" % (NAZWA, PO)) if dodano else "nowy opis i parametry wpisu %s" % NAZWA)))
    if not wykonaj:
        print("\n(dry-run: nic nie zapisano; po zgodzie gracza: python tools/laka/install.py --wykonaj)")
        return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(os.path.join(kop, "js", "plugins"), exist_ok=True)
    if stary_plik is not None: open(os.path.join(kop, "js", "plugins", NAZWA + ".js"), "wb").write(stary_plik)
    open(os.path.join(kop, "js", "tawerna_wtyczki.js"), "wb").write(stary_lista)
    open(PLIK_GRA, "wb").write(nowy_plik)
    if nowy_lista != stary_lista: open(wtyczki.LISTA, "wb").write(nowy_lista)
    ok = sha(open(PLIK_GRA, "rb").read()) == sha(nowy_plik)
    print("zainstalowano%s; kopie zapasowe: %s" % ("" if ok else " (UWAGA: skrót pliku się nie zgadza!)", kop))


if __name__ == "__main__":
    main()
