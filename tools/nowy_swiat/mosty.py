# -*- coding: utf-8 -*-
"""Mosty dwupoziomowe (js/plugins/Mosty.js, 2026-11-13): region 4 na całym obrysie mostów nad SUCHYM korytem (pomost z desek A2-33
w warstwie 2 + barierki A2-22 po bokach). Mosty nad wodą zostają bez regionu (pod nimi i tak się nie przejdzie).
Obrys: deski + kolumny / wiersze barierek przy nich. Region tylko na polach bez innego regionu (albo z 31 - lądowanie orła, nad korytem zbędne).
  python tools/nowy_swiat/mosty.py [--wykonaj]   (zapis TYLKO przy zamkniętym edytorze; kopie w archiwum)"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

REGION = 4
DECKS = {218: [(13, 59, 15, 64), (39, 59, 41, 64)], 220: [(13, 46, 15, 52)]}   # (the planks: x0, y0, x1, y1)


def kind(t): return (t - 2048) // 48 if t >= 2048 else -1


def main():
    out = []
    for mid, decks in DECKS.items():
        rel = "data/Map%03d.json" % mid
        m, lay = RW.read_json(rel)
        at = lambda z, x, y: m["data"][(z * m["height"] + y) * m["width"] + x]
        n = 0
        for (x0, y0, x1, y1) in decks:
            ns = y1 - y0 >= x1 - x0
            # the rails beside the planks
            if ns:
                if all(kind(at(1, x0 - 1, y)) == 22 for y in range(y0, y1 + 1)): x0 -= 1
                if all(kind(at(1, x1 + 1, y)) == 22 for y in range(y0, y1 + 1)): x1 += 1
            else:
                if all(kind(at(1, x, y0 - 1)) == 22 for x in range(x0, x1 + 1)): y0 -= 1
                if all(kind(at(1, x, y1 + 1)) == 22 for x in range(x0, x1 + 1)): y1 += 1
            bad = [(x, y, at(5, x, y)) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if at(5, x, y) not in (0, 31, REGION)]
            if bad: raise SystemExit("STOP: Map%d most %s: inne regiony %s" % (mid, (x0, y0, x1, y1), bad[:6]))
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    if at(5, x, y) != REGION: m["data"][(5 * m["height"] + y) * m["width"] + x] = REGION; n += 1
            print("  Map%d: most %d..%d x %d..%d (%s)" % (mid, x0, x1, y0, y1, "północ-południe" if ns else "wschód-zachód"))
        if n: out.append((rel, RW.json_text(m, lay)))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "mosty_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for (rel, raw) in out:
        shutil.copy2(os.path.join(ROOT, rel), os.path.join(bak, os.path.basename(rel)))
        open(os.path.join(ROOT, rel), "wb").write(raw)
    print("Zapisano %d map; kopie: %s" % (len(out), bak))


if __name__ == "__main__":
    main()
