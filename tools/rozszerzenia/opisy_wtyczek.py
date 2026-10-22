# Opisy wtyczek nowego terenu w js/plugins.js (integracja 2026-10-22, docs/rozszerzenia/PLAN.md): opis wpisu = @plugindesc z pliku
# wtyczki (Okolice, Zasoby, Lowy, Ludzie, Zakon i ich _Data). Edytor RPG Maker MZ musi być zamknięty (sprawdza tasklist).
#   python tools/rozszerzenia/opisy_wtyczek.py            pokazuje, co by się zmieniło
#   python tools/rozszerzenia/opisy_wtyczek.py --wykonaj  zapisuje (kopia do archiwum: dane_przed_rozszerzeniami/integracja/)
import os, sys, json, re
from wspolne import ROOT, dump, need_editor_closed, take_lock, drop_lock, archive

NAMES = ["Okolice_Data", "Zasoby_Data", "Lowy_Data", "Ludzie_Data", "Zakon_Data", "Okolice", "Zasoby", "Lowy", "Ludzie", "Zakon"]


def plugindesc(name):
    src = open(os.path.join(ROOT, "js", "plugins", name + ".js"), encoding="utf-8").read()
    m = re.search(r"@plugindesc\s+(.+)", src)
    if not m: raise SystemExit("STOP: %s.js bez @plugindesc" % name)
    return m.group(1).strip()


def main():
    do = "--wykonaj" in sys.argv
    if do: need_editor_closed()
    p = os.path.join(ROOT, "js", "plugins.js")
    raw = open(p, "rb").read().decode("utf-8")
    head, sep, rest = raw.partition("var $plugins =\n[\n")
    if not sep: raise SystemExit("STOP: js/plugins.js w nieznanym układzie")
    body, tail = rest.rsplit("\n];", 1)
    entries = [json.loads(l) for l in body.split(",\n")]
    if ",\n".join(dump(e) for e in entries) != body: raise SystemExit("STOP: js/plugins.js nie wraca do tej samej postaci po odczycie")
    changed = []
    for e in entries:
        if e["name"] in NAMES:
            d = plugindesc(e["name"])
            if e["description"] != d:
                changed.append("%s: %s -> %s" % (e["name"], e["description"][-24:], d[-24:]))
                e["description"] = d
    missing = [n for n in NAMES if n not in [e["name"] for e in entries]]
    if missing: raise SystemExit("STOP: js/plugins.js nie ma wpisów: %s (edytor je zgubił? - wpisy dodaje tools/rozszerzenia/pakiet0.py)" % ", ".join(missing))
    for c in changed: print("opis  " + c)
    if not changed: print("opisy aktualne - nic do zmiany"); return
    if not do: print("(podgląd - nic nie zmieniono; dodaj --wykonaj)"); return
    take_lock("integracja")
    try:
        need_editor_closed()
        bak = archive("js/plugins.js", "integracja")
        open(p, "wb").write((head + sep + ",\n".join(dump(e) for e in entries) + "\n];" + tail).encode("utf-8"))
        print("zapisano js/plugins.js (kopia: %s)" % bak)
    finally:
        drop_lock()


if __name__ == "__main__":
    main()
