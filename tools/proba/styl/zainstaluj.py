# -*- coding: utf-8 -*-
r"""Approach A install: the Styl_FB sheet copies + *_FB decor pictures + Tilesets.json entry 17 + Map027.json (tools/proba/styl/staging -> game).
  python tools/proba/styl/zainstaluj.py             dry run
  python tools/proba/styl/zainstaluj.py --wykonaj   install (editor closed; backup to ..\\Tawerna_archiwum_2026-11-08\styl_<time>\)
Changes only: data/Tilesets.json (entry 17 only), data/Map027.json, new files img/tilesets/Styl_FB/*.png and img/characters/*_FB.png.
STOP when the game's Tilesets.json differs from the staging in anything but entry 17, or Map027.json is not the pre-restyle staged map."""
import datetime, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging"); 
DO = "--wykonaj" in sys.argv
W.need_editor_closed()
rd = lambda p: open(p, "rb").read()
G = lambda rel: os.path.join(ROOT, *rel.split("/"))
import hashlib
base = json.load(open(os.path.join(STG, "baza_a.json")))
for n in ("Tilesets.json", "Map027.json"):
    if hashlib.sha1(rd(G("data/" + n))).hexdigest() != base[n] and rd(G("data/" + n)) != rd(os.path.join(STG, "data", n)):
        raise SystemExit("STOP: data/%s w grze zmieniło się od zbudowania stagingu (uruchom zbuduj_a.py na nowo)" % n)
plan = [("data/Tilesets.json", rd(os.path.join(STG, "data", "Tilesets.json"))), ("data/Map027.json", rd(os.path.join(STG, "data", "Map027.json")))]
for sub in ("img/tilesets/Styl_FB", "img/characters"):
    d = os.path.join(STG, *sub.split("/"))
    for f in sorted(os.listdir(d)):
        if sub.endswith("characters") and not f.endswith("_FB.png"): continue
        plan.append((sub + "/" + f, rd(os.path.join(d, f))))
todo = [(r, b) for r, b in plan if not os.path.exists(G(r)) or rd(G(r)) != b]
for r, b in plan: print(("  zmieni  " if (r, b) in todo else "  bez zmian ") + r)
if not DO: print("(próba - nic nie zmieniono; --wykonaj instaluje)"); raise SystemExit(0)
W.take_lock("styl FB - instalacja")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "styl_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    byly = []
    for r, b in todo:
        if os.path.exists(G(r)):
            dst = os.path.join(bak, *r.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(G(r), dst); byly.append(r)
    os.makedirs(bak, exist_ok=True)
    json.dump({"byly": byly, "nowe": [r for r, _ in todo if r not in byly]}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), indent=1)
    for r, b in todo:
        os.makedirs(os.path.dirname(G(r)), exist_ok=True); open(G(r), "wb").write(b)
    print("zainstalowano; kopia: " + bak + " (cofnięcie: skopiuj pliki z 'byly' z powrotem, usuń 'nowe')")
finally:
    W.drop_lock()
