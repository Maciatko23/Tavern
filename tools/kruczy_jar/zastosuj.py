# -*- coding: utf-8 -*-
"""Kruczy Jar (2026-10-22): mapa 3 („Domek - Zewnętrze”) dostaje nazwę „Kruczy Jar”, a w danych edytora
„pole dziadka” staje się „działką dziadka”.

Skrypt NAKŁADA zmiany na pliki, które leżą na dysku w chwili uruchomienia: zamienia tylko konkretne teksty
(bajty pliku poza nimi zostają co do znaku, więc format JSON edytora i końcówki linii się nie zmieniają).
Nie podmienia plików gotowymi kopiami, więc nie niszczy tego, co użytkownik zrobił w edytorze.

- Odmawia, gdy działa RPG Maker MZ (RPGMZ.exe w tasklist) - edytor nadpisałby zmiany przy zapisie.
- Przed zmianą zapisuje kopię każdego zmienianego pliku w
  C:\\Users\\macie\\OneDrive\\Dokumenty\\RMMZ\\Tawerna_archiwum_2026-10-18\\dane_przed_kruczym_jarem\\
  (istniejącej kopii nie nadpisuje - druga dostaje znacznik czasu).
- Można uruchomić drugi raz: to, co już zmienione, jest pomijane („już zrobione”).
- Po zmianie każdy plik data/*.json jest sprawdzany (json.loads); błąd = nic nie zapisane.

Co zmienia:
  data/Map003.json      displayName „Domek - Zewnętrze” -> „Kruczy Jar”
  data/MapInfos.json    nazwa mapy 3 w drzewie map edytora -> „Kruczy Jar”
  data/Map017.json, Map018.json, Map023.json
                        nazwy zdarzeń „Przejście -> Domek - Zewnętrze” -> „Przejście -> Kruczy Jar” (tylko nazwy w edytorze)
  js/plugins.js         opisy wtyczek Homes i Debug („pole dziadka” / „strata pola” -> działka)
(Teksty zdarzeń map, zdarzeń wspólnych i opisy przedmiotów nie mówią o „polu dziadka” - sprawdzone 2026-10-22.)

Uruchom (przy ZAMKNIĘTYM edytorze):  python tools/kruczy_jar/zastosuj.py        (--proba = tylko pokaż, co by zmienił)
"""
import json, re, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = Path(r"C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna_archiwum_2026-10-18\dane_przed_kruczym_jarem")
DRY = "--proba" in sys.argv or "--dry" in sys.argv
OLD, NEW = "Domek - Zewnętrze", "Kruczy Jar"

# (plik, wzorzec regex, zamiana, ile razy, po czym poznać, że już zrobione)
CHANGES = [
    ("data/Map003.json", r'"displayName":"Domek - Zewnętrze"', '"displayName":"Kruczy Jar"', 1, '"displayName":"Kruczy Jar"'),
    ("data/MapInfos.json", r'(\{"id":3,[^{}]*?"name":)"Domek - Zewnętrze"', r'\1"Kruczy Jar"', 1, None),
    ("data/Map017.json", r'"name":"Przejście -> Domek - Zewnętrze"', '"name":"Przejście -> Kruczy Jar"', 3, '"name":"Przejście -> Kruczy Jar"'),
    ("data/Map018.json", r'"name":"Przejście -> Domek - Zewnętrze"', '"name":"Przejście -> Kruczy Jar"', 3, '"name":"Przejście -> Kruczy Jar"'),
    ("data/Map023.json", r'"name":"Przejście -> Domek - Zewnętrze"', '"name":"Przejście -> Kruczy Jar"', 3, '"name":"Przejście -> Kruczy Jar"'),
    ("js/plugins.js", r'"description":"Ziemia: pole dziadka po stracie', '"description":"Ziemia: działka dziadka po stracie', 1, '"description":"Ziemia: działka dziadka po stracie'),
    ("js/plugins.js", r'czerwona woda, strata pola, dług', 'czerwona woda, strata działki, dług', 1, 'czerwona woda, strata działki, dług'),
]


def editor_running():
    try:
        out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq RPGMZ.exe", "/NH"], capture_output=True, text=True, errors="replace").stdout
    except Exception as ex:   # (no tasklist: better to refuse than to guess)
        print("Nie da się sprawdzić tasklist (%s) - przerywam." % ex)
        return True
    return "rpgmz.exe" in out.lower()


def mapinfos_done(text):
    m = re.search(r'\{"id":3,[^{}]*?"name":"([^"]*)"', text)
    return bool(m) and m.group(1) == NEW


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if editor_running():
        print("RPG Maker MZ (RPGMZ.exe) jest uruchomiony - zamknij edytor i uruchom skrypt jeszcze raz. Nic nie zmieniono.")
        return 2
    texts, orig, report, errors = {}, {}, [], []
    for rel, pat, rep, n, done_mark in CHANGES:
        p = ROOT / rel
        if rel not in texts:
            raw = p.read_bytes()
            orig[rel] = raw
            texts[rel] = raw.decode("utf-8")
        t = texts[rel]
        t2, c = re.subn(pat, rep, t)
        if c == n:
            texts[rel] = t2
            report.append("zmienione  %s: %d× %s" % (rel, c, rep.replace("\\1", "")[:70]))
        elif c == 0 and ((done_mark and t.count(done_mark) >= n) or (done_mark is None and mapinfos_done(t))):
            report.append("już zrobione  %s: %s" % (rel, (done_mark or 'mapa 3 = "Kruczy Jar"')[:70]))
        else:
            errors.append("%s: wzorzec %s pasuje %d razy (oczekiwane %d) - plik inny niż się spodziewałem" % (rel, pat[:60], c, n))
    for rel, t in texts.items():
        if rel.endswith(".json"):
            try:
                json.loads(t)
            except Exception as ex:
                errors.append("%s: po zmianie to nie jest poprawny JSON (%s)" % (rel, ex))
    for line in report:
        print(line)
    if errors:
        print("BŁĘDY - nic nie zapisano:")
        for x in errors:
            print("  " + x)
        return 1
    changed = [rel for rel, t in texts.items() if t.encode("utf-8") != orig[rel]]
    if DRY:
        print("(próba) zmieniłbym %d plików: %s" % (len(changed), ", ".join(changed) or "-"))
        return 0
    if not changed:
        print("Wszystko już było zrobione - nic nie zapisano.")
        return 0
    if editor_running():   # (second look right before writing: the editor may have been opened meanwhile)
        print("RPG Maker MZ właśnie się uruchomił - nic nie zmieniono.")
        return 2
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d_%H%M%S")
    for rel in changed:
        dst = ARCHIVE / rel.replace("/", "__")
        if dst.exists():
            dst = dst.with_name(dst.stem + "_" + stamp + dst.suffix)
        dst.write_bytes(orig[rel])
    for rel in changed:
        (ROOT / rel).write_bytes(texts[rel].encode("utf-8"))
    print("Zapisano %d plików (kopie sprzed zmiany: %s): %s" % (len(changed), ARCHIVE, ", ".join(changed)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
