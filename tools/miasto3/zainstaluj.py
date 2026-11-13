# -*- coding: utf-8 -*-
"""Nowy Kruczogród do gry (gracz 2026-11-08: „zrób, co trzeba, a ja poprawię w edytorze”). Ze stagingu tools/miasto3/staging:
  data/Map008, Map181 (stajnia), mapy sąsiadów z murem miasta przy krawędzi (Map003, Map004, Map024, Map111), Tilesets.json (zestawy 13-16)
  js/plugins/*.js - przepięcia współrzędnych (przepnij.py robi je NA NOWO z obecnych js/plugins tuż przed instalacją)
Kopia wszystkiego, co nadpisze: ../Tawerna_archiwum_2026-11-08/kruczogrod_miasto_<czas>/ + spis.json. Tylko przy zamkniętym edytorze,
pod blokadą zapisów. STOP, gdy mapa gry jest nowsza niż jej wersja w stagingu (zapisana w edytorze po zbudowaniu miasta) albo gdy
Tilesets.json gry różni się od stagingu czymś innym niż zestawami 13-16.
  python tools/miasto3/zainstaluj.py [--wykonaj]
  python tools/miasto3/zainstaluj.py --przywroc <folder kopii> [--wykonaj]"""
import datetime, json, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging")
DO = "--wykonaj" in sys.argv
NEW_TS = {13, 14, 15, 16}

W.need_editor_closed()
if "--przywroc" in sys.argv:
    src = sys.argv[sys.argv.index("--przywroc") + 1]
    spis = json.load(open(os.path.join(src, "spis.json"), encoding="utf-8"))
    for rel in spis["byly"]:
        print(("przywracam " if DO else "przywróciłby ") + rel)
        if DO: shutil.copy2(os.path.join(src, *rel.split("/")), os.path.join(ROOT, *rel.split("/")))
    raise SystemExit(0)

# the re-pins again from the game's plugins as they are now (another plugin may have changed since the staging)
r = subprocess.run([sys.executable, os.path.join(HERE, "przepnij.py")], capture_output=True, text=True, encoding="utf-8", env=dict(os.environ, PYTHONIOENCODING="utf-8"))
if r.returncode: raise SystemExit("STOP: przepnij.py: " + (r.stdout + r.stderr)[-800:])
print((r.stdout or "").strip().splitlines()[-1] if r.stdout.strip() else "przepięcia: ok")

pairs = []
for f in sorted(os.listdir(os.path.join(STG, "data"))):
    if f.endswith(".json"): pairs.append((os.path.join(STG, "data", f), "data/" + f))
for f in sorted(os.listdir(os.path.join(STG, "js", "plugins"))):
    if f.endswith(".js"): pairs.append((os.path.join(STG, "js", "plugins", f), "js/plugins/" + f))

stale, change, new = [], [], []
for src, rel in pairs:
    cur = os.path.join(ROOT, *rel.split("/"))
    if not os.path.exists(cur): new.append(rel); continue
    if open(cur, "rb").read() == open(src, "rb").read(): continue
    if rel == "data/Tilesets.json":
        a = json.load(open(cur, encoding="utf-8")); b = json.load(open(src, encoding="utf-8"))
        bad = [i for i in range(max(len(a), len(b))) if i not in NEW_TS and (a[i] if i < len(a) else None) != (b[i] if i < len(b) else None)]
        if bad: raise SystemExit("STOP: Tilesets.json gry różni się od stagingu w zestawach %s - zbuduj staging na nowo" % bad)
    elif rel.startswith("data/Map") and os.path.getmtime(cur) > os.path.getmtime(src):
        stale.append(rel)
    change.append(rel)
if stale: raise SystemExit("STOP: nowsze w grze niż w stagingu: %s" % ", ".join(stale))
print("Kruczogród: do zmiany %d plików, nowych %d" % (len(change), len(new)))
for rel in change: print("  zmieni  " + rel)
for rel in new: print("  doda    " + rel)
if not DO: print("(próba - nic nie zmieniono; --wykonaj instaluje)"); raise SystemExit(0)
W.take_lock("Kruczogród - instalacja")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "kruczogrod_miasto_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel in change:
        d = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, *rel.split("/")), d)
    os.makedirs(bak, exist_ok=True)
    json.dump({"czas": datetime.datetime.now().isoformat(timespec="seconds"), "byly": change, "nowe": new}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for src, rel in pairs:
        if rel in change or rel in new:
            d = os.path.join(ROOT, *rel.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True)
            shutil.copyfile(src, d)
    print("zainstalowane: %d plików (kopia: %s)" % (len(change) + len(new), bak))
finally:
    W.drop_lock()
