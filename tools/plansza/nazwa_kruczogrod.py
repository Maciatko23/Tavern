# -*- coding: utf-8 -*-
"""Miasto ma nazwę „Kruczogród” (gracz 2026-11-08: „nazwij Kruczogród najpierw”; wybrana przy planszy 3x3 zamiast „Okolice Tawerny”).
Zamienia napis „Okolice Tawerny” -> „Kruczogród” tam, gdzie jest nazwą miasta: nazwa mapy 8 w edytorze (MapInfos) i w grze
(displayName), nazwy zdarzeń przejść i drzwi w mapach („Drzwi -> Okolice Tawerny (rynek)”), mapa wyspy, miejsca polowań
(js/teksty/tablica.txt), komentarze i testy. Słowo „Okolice” w innym znaczeniu (wtyczka Okolice.js, zakładka dziennika) zostaje.
Pliki zmieniane bajt po bajcie (układ edytora bez zmian); kopia: ../Tawerna_archiwum_2026-11-08/kruczogrod_<czas>/. Tylko przy
zamkniętym edytorze. Potem obrazki nazw map: CDP_PORT=9466 node tools/nazwa_mapy/obrazki.js
  python tools/plansza/nazwa_kruczogrod.py [--wykonaj]"""
import datetime, os, shutil, sys
from plansza import ROOT, W
OLD, NEW = "Okolice Tawerny".encode("utf-8"), "Kruczogród".encode("utf-8")
DO = "--wykonaj" in sys.argv
W.need_editor_closed()
files = []
for d in ("data", os.path.join("js", "plugins"), os.path.join("js", "teksty"), "tests", os.path.join("tests", "unit"), os.path.join("tools", "plansza", "staging", "js", "plugins")):
    full = os.path.join(ROOT, d)
    if not os.path.isdir(full): continue
    for f in sorted(os.listdir(full)):
        if f.startswith("out_") or not f.endswith((".json", ".js", ".txt")): continue
        p = os.path.join(full, f)
        b = open(p, "rb").read()
        if OLD in b: files.append((p, b.count(OLD)))
print("plików: %d, napisów: %d" % (len(files), sum(c for _, c in files)))
for p, c in files: print("  %3d  %s" % (c, os.path.relpath(p, ROOT)))
if not DO: print("(próba - nic nie zmieniono; --wykonaj zmienia)"); raise SystemExit(0)
W.take_lock("nazwa Kruczogród")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "kruczogrod_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for p, _ in files:
        rel = os.path.relpath(p, ROOT)
        os.makedirs(os.path.dirname(os.path.join(bak, rel)), exist_ok=True)
        shutil.copy2(p, os.path.join(bak, rel))
        b = open(p, "rb").read()
        open(p, "wb").write(b.replace(OLD, NEW))
    print("zmienione (kopia: %s)" % bak)
finally:
    W.drop_lock()
