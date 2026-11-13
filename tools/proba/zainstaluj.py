# -*- coding: utf-8 -*-
"""Installs the test map (Map027 'Mapa testowa: budynki', tileset 17) from tools/proba/staging into the game.
  python tools/proba/zainstaluj.py             dry run (nothing changes)
  python tools/proba/zainstaluj.py --wykonaj   install
Adds: data/Map027.json, entry 27 in data/MapInfos.json, tileset 17 in data/Tilesets.json, the F9 row (Debug.js + js/teksty/f9.txt, text insertion),
and checks img/tilesets/Kruczogrod/Proba_D.png. Only with the editor closed, under the write lock; backup of every file it changes to
..\\Tawerna_archiwum_2026-11-08\\proba_<time>\\. STOP when the game's Tilesets.json / MapInfos.json differ from the staging in anything
but the added entries, or when Map027.json already exists in the game and is not the staged one."""
import datetime, hashlib, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, HERE)
import wspolne as W
import lataj
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging", "data")
DO = "--wykonaj" in sys.argv
W.need_editor_closed()
def rd(p): return open(p, "rb").read()
def load(p): return json.loads(rd(p).decode("utf-8"))
G = lambda rel: os.path.join(ROOT, *rel.split("/"))
# 1. the staging must stand on the game's current databases
ts_g, ts_s = load(G("data/Tilesets.json")), load(os.path.join(STG, "Tilesets.json"))
if ts_g != ts_s[:len(ts_g)] or len(ts_s) != 18 or len(ts_g) != 17:
    raise SystemExit("STOP: data/Tilesets.json gry różni się od stagingu czymś innym niż dodanym zestawem 17 - zbuduj staging na nowo (zestaw.py, zbuduj.py)")
mi_g, mi_s = load(G("data/MapInfos.json")), load(os.path.join(STG, "MapInfos.json"))
diff = [i for i in range(max(len(mi_g), len(mi_s))) if (mi_g[i] if i < len(mi_g) else None) != (mi_s[i] if i < len(mi_s) else None)]
if diff != [27] or mi_g[27] is not None:
    raise SystemExit("STOP: data/MapInfos.json gry różni się od stagingu w pozycjach %s (ma być tylko dodane 27) - zbuduj staging na nowo" % diff)
m_s = rd(os.path.join(STG, "Map027.json"))
if os.path.exists(G("data/Map027.json")) and rd(G("data/Map027.json")) != m_s:
    raise SystemExit("STOP: data/Map027.json już istnieje w grze i jest inny niż w stagingu")
png = G("img/tilesets/Kruczogrod/Proba_D.png")
if not os.path.exists(png): raise SystemExit("STOP: brak img/tilesets/Kruczogrod/Proba_D.png (uruchom zestaw.py)")
# 2. what will change
dbg, f9 = rd(G("js/plugins/Debug.js")), rd(G("js/teksty/f9.txt"))
plan = [("data/Map027.json", m_s), ("data/MapInfos.json", rd(os.path.join(STG, "MapInfos.json"))), ("data/Tilesets.json", rd(os.path.join(STG, "Tilesets.json"))),
        ("js/plugins/Debug.js", lataj.patch_debug(dbg)), ("js/teksty/f9.txt", lataj.patch_f9(f9))]
todo = [(rel, b) for rel, b in plan if not os.path.exists(G(rel)) or rd(G(rel)) != b]
for rel, b in plan: print(("  zmieni  " if (rel, b) in todo else "  bez zmian ") + rel)
if not DO:
    print("(próba - nic nie zmieniono; --wykonaj instaluje)"); raise SystemExit(0)
W.take_lock("proba - instalacja")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "proba_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    byly = []
    for rel, b in todo:
        if os.path.exists(G(rel)):
            dst = os.path.join(bak, *rel.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(G(rel), dst); byly.append(rel)
    os.makedirs(bak, exist_ok=True)
    json.dump({"byly": byly, "nowe": [r for r, _ in todo if r not in byly]}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), indent=1)
    for rel, b in todo: open(G(rel), "wb").write(b)
    print("zainstalowano; kopia: " + bak)
finally:
    W.drop_lock()
