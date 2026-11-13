# -*- coding: utf-8 -*-
"""Instalacja planszy 3x3 w grze (gracz 2026-11-08: „wrzuć nową mniejszą mapę do gry”). Ze stagingu (tools/plansza/staging):
  data/*.json -> data/, js/plugins/*.js -> js/plugins/, testy/*.js -> tests/ (tam, gdzie test leży), img/mapa_wyspy/** -> img/mapa_wyspy/.
Najpierw kopia wszystkiego, co zostanie nadpisane: ../Tawerna_archiwum_2026-11-08/plansza_przed_instalacja_<czas>/ (te same ścieżki
+ spis.json). Tylko przy zamkniętym edytorze (RPGMZ.exe) i pod blokadą zapisów (tools/rozszerzenia/.blokada). STOP, gdy plik gry jest
nowszy niż jego wersja w stagingu (zapisany w edytorze po zbudowaniu planszy) - wtedy najpierw python tools/plansza/wszystko.py.
  python tools/plansza/zainstaluj.py              (pokazuje, co by zrobił)
  python tools/plansza/zainstaluj.py --wykonaj
  python tools/plansza/zainstaluj.py --przywroc <folder kopii>   (cofa: pliki z kopii wracają; tych, których przed instalacją nie było, nie ma)
Po instalacji narzędzia tools/plansza (wszystko.py) nie działają na grze - przesunęłyby mapy drugi raz (wszystko.py to sprawdza)."""
import datetime, json, os, shutil, sys
from plansza import ROOT, STG, W
DO = "--wykonaj" in sys.argv
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08")


def pairs():
    out = []
    for f in sorted(os.listdir(os.path.join(STG, "data"))):
        if f.endswith(".json"): out.append((os.path.join(STG, "data", f), "data/" + f))
    for f in sorted(os.listdir(os.path.join(STG, "js", "plugins"))):
        if f.endswith(".js"): out.append((os.path.join(STG, "js", "plugins", f), "js/plugins/" + f))
    tests = {}
    for d, _, fs in os.walk(os.path.join(ROOT, "tests")):
        if os.sep + "node_modules" in d: continue
        for f in fs:
            if f.endswith(".js"): tests.setdefault(f, os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, "/"))
    td = os.path.join(STG, "testy")
    for f in sorted(os.listdir(td)) if os.path.isdir(td) else []:
        if f.endswith(".js"): out.append((os.path.join(td, f), tests.get(f, "tests/" + f)))
    img = os.path.join(STG, "img", "mapa_wyspy")
    for d, _, fs in os.walk(img):
        for f in sorted(fs):
            if f.endswith(".png"):
                rel = os.path.relpath(os.path.join(d, f), os.path.join(STG, "img")).replace(os.sep, "/")
                out.append((os.path.join(d, f), "img/" + rel))
    return out


if "--przywroc" in sys.argv:
    src = sys.argv[sys.argv.index("--przywroc") + 1]
    W.need_editor_closed()
    spis = json.load(open(os.path.join(src, "spis.json"), encoding="utf-8"))
    for rel in spis["byly"]:
        print(("przywracam " if DO else "przywróciłby ") + rel)
        if DO: shutil.copy2(os.path.join(src, *rel.split("/")), os.path.join(ROOT, *rel.split("/")))
    for rel in spis["nowe"]:
        print(("nie ruszam (nie było go przed instalacją, usuń ręcznie, jeśli trzeba) ") + rel)
    raise SystemExit(0)

W.need_editor_closed()
P = pairs()
stale, change, same, new = [], [], 0, []
for src, rel in P:
    cur = os.path.join(ROOT, *rel.split("/"))
    if not os.path.exists(cur): new.append(rel); continue
    if open(cur, "rb").read() == open(src, "rb").read(): same += 1; continue
    if rel.startswith(("data/", "js/")) and os.path.getmtime(cur) > os.path.getmtime(src): stale.append(rel)
    change.append(rel)
if stale:
    raise SystemExit("STOP: nowsze w grze niż w stagingu (zapisane po zbudowaniu planszy): %s - najpierw python tools/plansza/wszystko.py" % ", ".join(stale))
print("plansza: do zmiany %d plików, nowych %d, już takich samych %d" % (len(change), len(new), same))
for rel in change: print("  zmieni  " + rel)
for rel in new: print("  doda    " + rel)
if not DO:
    print("(próba - nic nie zmieniono; --wykonaj instaluje)"); raise SystemExit(0)
W.take_lock("plansza 3x3 - instalacja")
try:
    bak = os.path.join(ARCH, "plansza_przed_instalacja_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel in change:
        d = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, *rel.split("/")), d)
    os.makedirs(bak, exist_ok=True)
    json.dump({"czas": datetime.datetime.now().isoformat(timespec="seconds"), "byly": change, "nowe": new}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for src, rel in P:
        if rel in change or rel in new:
            d = os.path.join(ROOT, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
            shutil.copyfile(src, d)
    print("zainstalowane: %d plików (kopia: %s)" % (len(change) + len(new), bak))
finally:
    W.drop_lock()
