# -*- coding: utf-8 -*-
"""Podgrodzie (Map218), 2026-11-13 (gracz: „da się to pole przesunąć dwie kratki niżej? i żeby krawędzie pola były dostosowane do terenu,
bo teraz to wygląda jak wklejony prostokąt”): pole młynarza x 9..16, y 28..33 -> y 30..35; ziemia pola bez czterech narożnych kratek
(zaokrąglone rogi; resztę łagodzi Ziemia.js i miękki brzeg bruzd i zboża w Wiatrak.js). Zwolnione rzędy 28-29 -> trawa.
  python tools/nowy_swiat/pole_nizej.py [--podglad=<plik>] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

OLD = (9, 28, 16, 33)
NEW = (9, 30, 16, 35)
GRASS, EARTH = 2048 + 16 * 48, 2048 + 24 * 48


def main():
    m, lay = RW.read_json("data/Map218.json")
    W, H = m["width"], m["height"]
    put = lambda z, x, y, v: m["data"].__setitem__((z * H + y) * W + x, v)
    at = lambda z, x, y: m["data"][(z * H + y) * W + x]
    ev = next((e for e in m["events"] if e and e["name"] == "Pole młynarza"), None)
    if not ev or (ev["x"], ev["y"]) != OLD[:2]:
        raise SystemExit("STOP: pole młynarza nie stoi w (%d,%d) - już przesunięte?" % OLD[:2])
    old = {(x, y) for x in range(OLD[0], OLD[2] + 1) for y in range(OLD[1], OLD[3] + 1)}
    new = {(x, y) for x in range(NEW[0], NEW[2] + 1) for y in range(NEW[1], NEW[3] + 1)}
    corners = {(NEW[0], NEW[1]), (NEW[2], NEW[1]), (NEW[0], NEW[3]), (NEW[2], NEW[3])}
    for (x, y) in old - new:
        put(0, x, y, GRASS); put(5, x, y, 0)
    for (x, y) in new:
        for z in (1, 2, 3): put(z, x, y, 0)
        if (x, y) in corners: put(0, x, y, GRASS); put(5, x, y, 0)
        else: put(0, x, y, EARTH); put(5, x, y, 7)
    RW.reshape(m, 0, RW.ring(old | new, 1))
    ev["y"] = NEW[1]
    print("pole młynarza: y %d..%d -> %d..%d, zaokrąglone rogi" % (OLD[1], OLD[3], NEW[1], NEW[3]))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(m, lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "pole_nizej_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
