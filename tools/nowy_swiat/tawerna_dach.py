# -*- coding: utf-8 -*-
"""Dach tawerny w Kruczogrodzie (Map220) wyższy o 2 kratki (gracz 2026-11-16: „wydłuż dach tawerny o 2 kratki, czyli wyższa o 2
kratki”): budynek x37..59, dach dotąd y24..28 - teraz y22..28. Górna krawędź dachu idzie na y22, pod nią dwa nowe rzędy środka;
dwa górne rzędy dachu (y22-23) są „nad postacią” (region 3, jak dotąd y24-25: bohater przechodzi ulicą za kalenicą), reszta
blokuje (region 2). Dymy z kominów idą 2 kratki wyżej, razem z kalenicą.
  python tools/nowy_swiat/tawerna_dach.py [--wykonaj]      (zapis tylko przy zamkniętym edytorze; kopie w archiwum)"""
import datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

X0, X1, TOP, UP = 37, 59, 24, 2


def main():
    m, lay = RW.read_json("data/Map220.json"); W, H = m["width"], m["height"]
    at = lambda z, x, y: (z * H + y) * W + x
    if m["data"][at(0, X0 + 1, TOP - UP)] >= 4352: print("dach już jest wyższy"); return
    assert m["data"][at(0, X0 + 1, TOP)] >= 4352 and m["data"][at(0, X0 + 1, TOP - 1)] < 4352
    lost = [(x, y, z, m["data"][at(z, x, y)]) for y in range(TOP - UP, TOP) for x in range(X0, X1 + 1) for z in (1, 2, 3) if m["data"][at(z, x, y)]]
    for x in range(X0, X1 + 1):
        top, mid = m["data"][at(0, x, TOP)], m["data"][at(0, x, TOP + 1)]
        m["data"][at(0, x, TOP - UP)] = top
        for y in range(TOP - UP + 1, TOP + 1): m["data"][at(0, x, y)] = mid
        for y in range(TOP - UP, TOP):
            for z in (1, 2, 3, 4): m["data"][at(z, x, y)] = 0
        for y in range(TOP - UP, TOP + UP): m["data"][at(5, x, y)] = 3 if y < TOP else 2
    moved = []
    for e in m["events"]:
        if e and e["name"] == "Dym z komina" and X0 <= e["x"] <= X1 and e["y"] == TOP + 1: e["y"] -= UP; moved.append(e["id"])
    under = [(e["id"], e["name"], e["x"], e["y"]) for e in m["events"] if e and X0 <= e["x"] <= X1 and TOP - UP <= e["y"] < TOP and e["name"] != "Dym z komina"]
    print("dach y%d..28, dymy przesunięte: %s, ozdoby zdjęte spod dachu: %s, zdarzenia pod nowym dachem: %s" % (TOP - UP, moved, lost, under))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_dach_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    rel = os.path.join(ROOT, "data", "Map220.json"); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie:", bak)


if __name__ == "__main__":
    main()
