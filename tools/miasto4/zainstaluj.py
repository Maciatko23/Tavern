# -*- coding: utf-8 -*-
"""Instalator nowego Kruczogrodu (miasto4) - tylko przy ZAMKNIĘTYM edytorze, pod blokadą zapisów.
Ze stagingu tools/miasto4/staging:  data/Map008 + wyjścia wnętrz (Map102-109, 118, 180, 182-187, 189, 190, 194) + Tilesets.json (wpis 13),
js/plugins/*.js (przepięcia robi na NOWO przepnij4.py z obecnych js/plugins tuż przed kopiowaniem).
Warunki: Map008 w grze == podstawa, z której zbudowano staging (base_Map008.json) - inaczej STOP (zmieniona w edytorze po budowie);
inne pliki danych nie nowsze niż staging; Tilesets.json gry różni się od stagingu tylko wpisem 13.
Kopia tego, co nadpisze: ../Tawerna_archiwum_2026-11-08/miasto4_<czas>/ + spis.json (przywracanie: --przywroc <folder>).
  python tools/miasto4/zainstaluj.py [--wykonaj]        python tools/miasto4/zainstaluj.py --przywroc <folder kopii> [--wykonaj]"""
import datetime, json, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging")
DO = "--wykonaj" in sys.argv

W.need_editor_closed()
if "--przywroc" in sys.argv:
    src = sys.argv[sys.argv.index("--przywroc") + 1]
    spis = json.load(open(os.path.join(src, "spis.json"), encoding="utf-8"))
    W.take_lock("Kruczogród v2 - przywracanie") if DO else None
    try:
        for rel in spis["byly"]:
            print(("przywracam " if DO else "przywróciłby ") + rel)
            if DO: shutil.copy2(os.path.join(src, *rel.split("/")), os.path.join(ROOT, *rel.split("/")))
        for rel in spis["nowe"]:
            print(("usuwam " if DO else "usunąłby ") + rel)
            if DO and os.path.exists(os.path.join(ROOT, *rel.split("/"))): os.remove(os.path.join(ROOT, *rel.split("/")))
    finally:
        if DO: W.drop_lock()
    raise SystemExit(0)

# 1. przepięcia z obecnych wtyczek
r = subprocess.run([sys.executable, os.path.join(HERE, "przepnij4.py")], capture_output=True, text=True, encoding="utf-8", env=dict(os.environ, PYTHONIOENCODING="utf-8"))
if r.returncode: raise SystemExit("STOP: przepnij4.py (warunek starej wartości nie zachodzi - wtyczka zmieniona po budowie): " + (r.stdout + r.stderr)[-900:])
print((r.stdout or "").strip().splitlines()[-1] if r.stdout.strip() else "przepięcia: ok")

# 2. podstawa Map008
cur8 = os.path.join(ROOT, "data", "Map008.json")
if open(cur8, "rb").read() != open(os.path.join(STG, "base_Map008.json"), "rb").read():
    raise SystemExit("STOP: data/Map008.json różni się od mapy, z której zbudowano staging (edytowana po budowie) - zbuduj staging na nowo: python tools/miasto4/build4.py")

pairs = []
for f in sorted(os.listdir(os.path.join(STG, "data"))):
    if f.endswith(".json"): pairs.append((os.path.join(STG, "data", f), "data/" + f))
for f in sorted(os.listdir(os.path.join(STG, "js", "plugins"))):
    if f.endswith(".js"): pairs.append((os.path.join(STG, "js", "plugins", f), "js/plugins/" + f))
for s in ("B", "C", "D", "E"):
    if not os.path.exists(os.path.join(ROOT, "img", "tilesets", "Kruczogrod", "Miasto2_%s.png" % s)):
        raise SystemExit("STOP: brak img/tilesets/Kruczogrod/Miasto2_%s.png (python tools/miasto4/zestaw4.py)" % s)

stale, change, new = [], [], []
for src, rel in pairs:
    cur = os.path.join(ROOT, *rel.split("/"))
    if not os.path.exists(cur): new.append(rel); continue
    if open(cur, "rb").read() == open(src, "rb").read(): continue
    if rel == "data/Tilesets.json":
        a = json.load(open(cur, encoding="utf-8")); b = json.load(open(src, encoding="utf-8"))
        bad = [i for i in range(max(len(a), len(b))) if i != 13 and (a[i] if i < len(a) else None) != (b[i] if i < len(b) else None)]
        if bad: raise SystemExit("STOP: Tilesets.json gry różni się od stagingu w zestawach %s - zbuduj staging na nowo (zestaw4.py)" % bad)
    elif rel.startswith("data/Map") and rel != "data/Map008.json" and os.path.getmtime(cur) > os.path.getmtime(src):
        stale.append(rel)
    change.append(rel)
if stale: raise SystemExit("STOP: nowsze w grze niż w stagingu (edytowane po budowie): %s" % ", ".join(stale))
print("Kruczogród v2: do zmiany %d plików, nowych %d" % (len(change), len(new)))
for rel in change: print("  zmieni  " + rel)
for rel in new: print("  doda    " + rel)
if not DO: print("(próba - nic nie zmieniono; --wykonaj instaluje)"); raise SystemExit(0)
W.take_lock("Kruczogród v2 - instalacja")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "miasto4_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for rel in change:
        d = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, *rel.split("/")), d)
    json.dump({"czas": datetime.datetime.now().isoformat(timespec="seconds"), "byly": change, "nowe": new}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for src, rel in pairs:
        if rel in change or rel in new:
            d = os.path.join(ROOT, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
            shutil.copyfile(src, d)
    print("zainstalowane: %d plików (kopia: %s)" % (len(change) + len(new), bak))
finally:
    W.drop_lock()
