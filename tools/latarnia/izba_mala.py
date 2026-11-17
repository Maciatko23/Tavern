# -*- coding: utf-8 -*-
"""Mała izba latarnika (gracz 2026-11-14: „wnętrze izby latarnika powinno chyba być małe, bo latarnia jest raczej wąska wewnątrz”):
Map160 z 13x10 na 8x10 (podłoga 6x5 zamiast 11x5), wszystko zostaje: łóżko, płaszcz, okno, półka ze słojami tranu, kominek z drewnem,
stół ze świecą i księgą mgieł, zydel, beczka, skrzynia, dorsze. Drugie okno znika. Razem z mapą zmienia punkty w Latarnia_Data.js
(gdzie stoi latarnik, gdzie staje bohater po wejściu).
  python tools/latarnia/izba_mala.py [--podglad plik.json] [--wykonaj]"""
import datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

REL, JS = "data/Map160.json", "js/plugins/Latarnia_Data.js"
COLS = [0, 1, 2, 8, 9, 10, 11, 12]      # the old columns kept: the bed wall, the shelf, the stone chimney, the barrel
NW, DOOR = len(COLS), 4
# event id -> new cell (None = gone)
EVENTS = {1: (2, 2), 2: None, 3: (1, 2), 4: (1, 7), 5: (2, 4), 6: (2, 6), 7: (2, 7), 8: (5, 4), 9: (6, 4), 10: (3, 4), 11: (DOOR, 9)}
JS_OLD = (b"160: { place: \"izba\", at: [5, 7, 8] }", b"LANDING: { 160: [6, 8],")
JS_NEW = (b"160: { place: \"izba\", at: [5, 6, 2] }", b"LANDING: { 160: [4, 8],")


def main():
    m, lay = RW.read_json(REL)
    W, H, old = m["width"], m["height"], m["data"]
    if (W, H) != (13, 10): raise SystemExit("STOP: Map160 nie ma 13x10 - już zmieniona? Nic nie ruszam.")
    js = open(os.path.join(ROOT, JS), "rb").read()
    if not all(o in js for o in JS_OLD): raise SystemExit("STOP: Latarnia_Data.js ma inne punkty izby niż oczekiwane")
    d = [0] * (6 * NW * H)
    def put(z, x, y, v): d[(z * H + y) * NW + x] = v
    for z in range(6):
        for y in range(H):
            for nx, ox in enumerate(COLS): put(z, nx, y, old[(z * H + y) * W + ox])
    # the door in the bottom wall, the mat before it
    put(0, DOOR - 1, 9, 3236); put(0, DOOR, 9, 6064); put(0, DOOR + 1, 9, 3234)
    put(0, DOOR, 8, 6044); put(1, DOOR, 8, 3870)
    # one window over the bed's side
    put(2, 2, 1, 16); put(2, 2, 2, 24)
    # the table (candle and the fog book on it) with the stool, the rug before the fire
    put(2, 2, 6, 433); put(2, 3, 6, 435); put(3, 3, 6, 623); put(2, 2, 7, 441); put(2, 3, 7, 443); put(2, 4, 6, 390)
    put(1, 3, 5, 3099); put(1, 4, 5, 3089); put(1, 5, 5, 3101)
    m["width"], m["data"] = NW, d
    for i, e in enumerate(m["events"]):
        if not e: continue
        if e["id"] not in EVENTS: raise SystemExit("STOP: nieznane zdarzenie %d %s na Map160" % (e["id"], e["name"]))
        c = EVENTS[e["id"]]
        if c is None: m["events"][i] = None
        else: e["x"], e["y"] = c
    jars = m["events"][10]; jars["pages"][0]["priorityType"] = 1          # on the shelf's cell: talked to from beside it
    raw = RW.json_text(m, lay)
    print("Izba latarnika: %dx%d -> %dx%d (podłoga 6x5), drzwi (%d,9)" % (W, H, NW, H, DOOR))
    if "--podglad" in sys.argv:
        open(sys.argv[sys.argv.index("--podglad") + 1], "wb").write(raw); return
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "izba_mala_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    sp = os.path.join(ROOT, "data", "System.json")
    for p in (os.path.join(ROOT, REL), os.path.join(ROOT, JS), sp): shutil.copy2(p, bak)
    open(os.path.join(ROOT, REL), "wb").write(raw)
    for o, n in zip(JS_OLD, JS_NEW): js = js.replace(o, n)
    open(os.path.join(ROOT, JS), "wb").write(js)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie: %s" % bak)


if __name__ == "__main__":
    main()
