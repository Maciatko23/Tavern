# -*- coding: utf-8 -*-
"""Całe podłoże Kruczogrodu jednym brukiem (gracz 2026-11-08: zaznaczony kafel A2, 1. rząd, 4. kafel = rodzaj 19, „całe podłoże, też
trawa”, „w całym Kruczogrodzie poza terenem stajni”, „tylko podłoże, żeby nie zamieniło innych elementów”):
  - warstwa 0: trawa (16), ścieżka (17), ziemia (24), ciemna trawa (27) -> bruk 19;
  - warstwa 1: nakładki gruntu - kępy trawy (21), ziemia (39), płyty placu (42) -> zdjęte (bruk spod nich);
  - zostają: płoty (22, 38), kwiaty (28, 29), kamienne płyty (35), budynki, mury i wszystkie zdarzenia;
  - poza prostokątem podwórza stajni (płot wokół niego, wykryty z kafli płotu).
Edytor zamknięty, mapa czytana tuż przed zmianą, kopia do ../Tawerna_archiwum_2026-11-08/bruk_<czas>/.
  python tools/miasto3/bruk.py [--wykonaj]"""
import datetime, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
DO = "--wykonaj" in sys.argv
L0, NEW, L1 = {16, 17, 24, 27}, 19, {21, 39, 42}
FENCE = {22, 38}
P = os.path.join(ROOT, "data", "Map008.json")
W.need_editor_closed()
m = json.load(open(P, encoding="utf-8")); Wd, Hd = m["width"], m["height"]; n = Wd * Hd; d = m["data"]
kind = lambda v: (v - 2048) // 48 if 2816 <= v < 4352 else -1
# the stable yard: the box of the fence cells round the stable (east of the tavern, the castle terrace's top right)
fx = [(x, y) for y in range(0, 32) for x in range(55, 90) if kind(d[n + y * Wd + x]) in FENCE]
X0, X1, Y0, Y1 = min(x for x, y in fx), max(x for x, y in fx), min(y for x, y in fx), max(y for x, y in fx)
inside = lambda x, y: X0 <= x <= X1 and Y0 <= y <= Y1
c0 = c1 = 0
for y in range(Hd):
    for x in range(Wd):
        if inside(x, y): continue
        i = y * Wd + x
        if kind(d[i]) in L0: d[i] = 2048 + NEW * 48; c0 += 1
        if kind(d[n + i]) in L1: d[n + i] = 0; c1 += 1
print("podwórze stajni (pomijane): x %d-%d, y %d-%d; grunt -> bruk: %d kratek, nakładki gruntu zdjęte: %d" % (X0, X1, Y0, Y1, c0, c1))
if not DO: print("(próba - nic nie zmieniono; --wykonaj)"); raise SystemExit(0)
W.take_lock("bruk Kruczogrodu")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "bruk_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True); shutil.copy2(P, bak)
    every = {(x, y) for y in range(Hd) for x in range(Wd)}
    W.reshape(m, 0, every); W.reshape(m, 1, every)
    open(P, "wb").write(W.map_text(m).encode("utf-8"))
    print("zapisane (kopia: %s)" % bak)
finally:
    W.drop_lock()
