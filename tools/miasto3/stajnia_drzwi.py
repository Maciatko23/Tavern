# -*- coding: utf-8 -*-
"""Wejście do stajni na prawy budynek z bali (gracz 2026-11-08: „ok, daj na prawy”): zdarzenie drzwi 209 (Map008) na (75,13),
znacznik „Miejsce: stajnia_drzwi” na (75,14), wyjścia z wnętrza stajni (Map181) na (75,14). Edytor zamknięty, kopia map do archiwum.
  python tools/miasto3/stajnia_drzwi.py [--wykonaj]"""
import datetime, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
DOOR, FRONT = (75, 13), (75, 14)
DO = "--wykonaj" in sys.argv
W.need_editor_closed()
p8, p181 = os.path.join(ROOT, "data", "Map008.json"), os.path.join(ROOT, "data", "Map181.json")
m8, m181 = json.load(open(p8, encoding="utf-8")), json.load(open(p181, encoding="utf-8"))
ev = m8["events"][209]; mk = next(e for e in m8["events"] if e and e["name"] == "Miejsce: stajnia_drzwi")
print("drzwi 209: %s -> %s; znacznik %d: %s -> %s" % ((ev["x"], ev["y"]), DOOR, mk["id"], (mk["x"], mk["y"]), FRONT))
ex = 0
for e in m181["events"]:
    if not e: continue
    for pg in e["pages"]:
        for c in pg["list"]:
            if c["code"] == 201 and c["parameters"][1] == 8: c["parameters"][2], c["parameters"][3] = FRONT; ex += 1
print("wyjścia Map181 -> Map008 %s: %d" % (FRONT, ex))
if not DO: print("(próba)"); raise SystemExit(0)
W.take_lock("stajnia drzwi")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "stajnia_drzwi_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True); shutil.copy2(p8, bak); shutil.copy2(p181, bak)
    ev["x"], ev["y"] = DOOR; mk["x"], mk["y"] = FRONT
    open(p8, "wb").write(W.map_text(m8).encode("utf-8")); open(p181, "wb").write(W.map_text(m181).encode("utf-8"))
    print("zapisane (kopia: %s)" % bak)
finally:
    W.drop_lock()
