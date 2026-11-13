# -*- coding: utf-8 -*-
"""Instalator wątku W18 „Wesele w Złotym Kuflu” (docs/zadania_nowe/wesele.md). Nakłada zmiany NA BIEŻĄCE pliki gry (kotwice, idempotentnie,
STOP z komunikatem, gdy kotwicy brak). Żadnej mapy nie rusza (wszystko to Tawerna.inject w tawernie: Map001, 25, 26).

  python tools/wesele/zainstaluj.py --do tools/wesele/overlay   pełna nakładka do testów (kopie bieżących plików + łatki + nowe pliki)
  python tools/wesele/zainstaluj.py --wykonaj                   zapis do gry (z kopią do ../Tawerna_archiwum_2026-11-08/wesele_<czas>/)
  python tools/wesele/zainstaluj.py                             podgląd: co by zrobiło

Co robi:
  - js/tawerna_wtyczki.js: Wesele_Data (pod Dezerter_Data), Wesele (pod Dezerter), Wesele_Gry (pod Wesele) - przez tools/wtyczki.py
  - js/plugins/Goscie_Sala.js: present(g, h) - sala jest weselna (Wesele.sala()), goście sali czekają
  - nowe pliki: js/plugins/Wesele*.js, js/teksty/wesele.txt, img/characters/$Npc_PanMlody.png, $Npc_PannaMloda.png, !$Wesele_*.png
    (obrazki z tools/wesele/img - tools/wesele/art.py je rysuje)
Zapis binarnie, końce linii jak w pliku."""
import datetime, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import wtyczki  # noqa: E402

ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08")
WTYCZKI = [("Wesele_Data", "Dezerter_Data"), ("Wesele", "Dezerter"), ("Wesele_Gry", "Wesele")]
NOWE = ["js/plugins/Wesele_Data.js", "js/plugins/Wesele.js", "js/plugins/Wesele_Gry.js", "js/teksty/wesele.txt"]
OBRAZY = ["$Npc_PanMlody.png", "$Npc_PannaMloda.png"] + ["!$Wesele_%s.png" % n for n in ("Znak", "Wianek", "Szarfa", "Tort", "Platki", "Swieca", "Tablica")]
IMG_SRC = os.path.join(HERE, "img")

GOSCIE = "js/plugins/Goscie_Sala.js"
GOSCIE_KOTWICA = "    function present(g, h) {\n"
GOSCIE_NOWE = GOSCIE_KOTWICA + "        if (window.Wesele && window.Wesele.sala && window.Wesele.sala()) return false;   // (W18: the hall is the wedding's - Wesele.js)\n"


def stop(msg):
    raise SystemExit("STOP: " + msg)


def czytaj(rel):
    with open(os.path.join(ROOT, rel), "rb") as f:
        return f.read()


def latka_goscie():
    raw = czytaj(GOSCIE)
    crlf = b"\r\n" in raw
    s = raw.decode("utf-8")
    if "Wesele.sala" in s:
        return None
    k, n = GOSCIE_KOTWICA, GOSCIE_NOWE
    if crlf:
        k, n = k.replace("\n", "\r\n"), n.replace("\n", "\r\n")
    if s.count(k) != 1:
        stop("w %s nie ma (albo jest kilka) kotwicy „function present(g, h) {” - plik się zmienił, popraw tools/wesele/zainstaluj.py" % GOSCIE)
    return s.replace(k, n).encode("utf-8")


def latka_lista():
    lista = wtyczki.czytaj_liste()
    zmiana = False
    for nazwa, po in WTYCZKI:
        if nazwa in lista.nazwy():
            continue
        if not os.path.exists(os.path.join(ROOT, "js", "plugins", nazwa + ".js")):
            stop("brak pliku js/plugins/%s.js" % nazwa)
        if wtyczki.dodaj(lista, wtyczki.wpis_z_pliku(nazwa), po=po):
            zmiana = True
    return lista.tekst() if zmiana else None


def sprawdz_nowe():
    for rel in NOWE:
        if not os.path.exists(os.path.join(ROOT, rel)):
            stop("brak pliku " + rel)
    for n in OBRAZY:
        if not os.path.exists(os.path.join(IMG_SRC, n)):
            stop("brak obrazka tools/wesele/img/%s - uruchom python tools/wesele/art.py tools/wesele/img" % n)
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "teksty.js"), "sprawdz", "wesele"], capture_output=True, text=True, cwd=ROOT)
    if "OK " not in r.stdout:
        stop("teksty wesele.txt: " + r.stdout[:300])


def zapisz(sciezka, dane):
    os.makedirs(os.path.dirname(sciezka), exist_ok=True)
    with open(sciezka, "wb") as f:
        f.write(dane)


def main():
    args = sys.argv[1:]
    sprawdz_nowe()
    lista, goscie = latka_lista(), latka_goscie()
    pliki = {}
    if lista is not None:
        pliki["js/tawerna_wtyczki.js"] = lista
    if goscie is not None:
        pliki[GOSCIE] = goscie
    if "--do" in args:
        d = os.path.abspath(args[args.index("--do") + 1])
        if os.path.isdir(d):
            shutil.rmtree(d)
        # a full overlay: the current live files (patched where there is a patch) + the new files
        for rel in ("js/tawerna_wtyczki.js", GOSCIE):
            zapisz(os.path.join(d, rel), pliki.get(rel) or czytaj(rel))
        for rel in NOWE:
            zapisz(os.path.join(d, rel), czytaj(rel))
        for n in OBRAZY:
            zapisz(os.path.join(d, "img", "characters", n), open(os.path.join(IMG_SRC, n), "rb").read())
        print("OK: nakładka w", d)
        return
    if "--wykonaj" not in args:
        print("podgląd: zmieniłbym", list(pliki) or "nic", "+ nowe obrazki:", [n for n in OBRAZY if not os.path.exists(os.path.join(ROOT, "img", "characters", n))])
        return
    kopia = os.path.join(ARCH, "wesele_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, dane in pliki.items():
        zapisz(os.path.join(kopia, rel), czytaj(rel))
        zapisz(os.path.join(ROOT, rel), dane)
    for n in OBRAZY:
        cel = os.path.join(ROOT, "img", "characters", n)
        zrodlo = open(os.path.join(IMG_SRC, n), "rb").read()
        if os.path.exists(cel) and open(cel, "rb").read() != zrodlo:
            stop("w grze jest już inny %s - nie nadpisuję" % n)
        zapisz(cel, zrodlo)
    print("OK: zapisano", list(pliki) or "(bez zmian w plikach)", "i obrazki; kopia:", kopia)


if __name__ == "__main__":
    main()
