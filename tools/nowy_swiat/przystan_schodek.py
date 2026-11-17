# -*- coding: utf-8 -*-
"""Przystań (Map219), 2026-11-13 (gracz: „na przystani też źle wygląda ten kawałek” - zrzut: schodkowa krawędź trawy nad plażą na
płd.-zach., x ~30..44, y ~64..72): krawędzie płaskowyżu z trawy (A5 1624-1626, 1632, 1634, 1612/1613/1620/1621/1633) w tym kawałku
-> zwykła trawa A2 16; granicę ziemia / trawa wygładza w grze Ziemia.js (stopniowe przejście). Dolna długa krawędź (A5 1630, rząd
72-73 przy górach) zostaje.
  python tools/nowy_swiat/przystan_schodek.py [--podglad=<plik>] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

BOX = (28, 62, 46, 71)
GRASS_RIMS = {1624, 1625, 1626, 1632, 1634, 1640, 1641, 1642, 1612, 1613, 1620, 1621, 1633}


def main():
    m, lay = RW.read_json("data/Map219.json")
    W, H = m["width"], m["height"]
    x0, y0, x1, y1 = BOX
    cells = set()
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if m["data"][y * W + x] in GRASS_RIMS:
                m["data"][y * W + x] = 2048 + 16 * 48; cells.add((x, y))
    RW.reshape(m, 0, RW.ring(cells, 1))
    print("Map219: schodkowa krawędź trawy -> trawa: %d kratek" % len(cells))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(m, lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "przystan_schodek_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map219.json"), bak)
    open(os.path.join(ROOT, "data", "Map219.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
