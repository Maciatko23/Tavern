# -*- coding: utf-8 -*-
"""Miasteczko (Map220), 2026-11-13 (gracz: „wiatrak 4 do góry”): wieża wiatraka z (45,64) na (45,60) - podstawa (region 2) x 44..46,
wiersze 59..60, placyk z ubitej ziemi wokół niej (x 43..47, wiersze 59..61) i ścieżka do drogi (x 44..46, wiersze 62..65);
stary placyk -> trawa.
  python tools/nowy_swiat/wiatrak_wyzej.py [--podglad=<katalog>] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
N = RW.N

W = H = 80
GRASS, EARTH = 16, 17
OLD, NEW = (45, 64), (45, 60)
K = lambda k: 2048 + k * 48
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def main():
    m, lay = RW.read_json("data/Map220.json")
    d = m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    tower = [e for e in m["events"] if e and e["name"] == "Wiatrak"]
    if len(tower) != 1 or (tower[0]["x"], tower[0]["y"]) != OLD: raise SystemExit("STOP: Map220 - wieży wiatraka nie ma na %s" % (OLD,))
    ox, oy = OLD; nx, ny = NEW
    clash = [(e["id"], e["name"]) for e in m["events"] if e and nx - 2 <= e["x"] <= nx + 2 and ny - 1 <= e["y"] <= 65 and e is not tower[0]]
    if clash: raise SystemExit("STOP: coś stoi w nowym miejscu: %s" % clash)
    changed = set()
    for y in range(oy - 1, oy + 2):                                   # the old yard and base
        for x in range(ox - 2, ox + 3):
            put(0, x, y, K(GRASS)); changed.add((x, y))
            if at(5, x, y) == 2: put(5, x, y, 0)
    yard = [(x, y) for y in range(ny - 1, ny + 2) for x in range(nx - 2, nx + 3)] + [(x, y) for x in (nx - 1, nx, nx + 1) for y in range(ny + 2, 66)]
    for (x, y) in yard:
        if 4352 <= at(0, x, y) < 8192 or at(5, x, y) == 7: raise SystemExit("STOP: placyk na domu/polu (%d,%d)" % (x, y))
        put(0, x, y, K(EARTH)); changed.add((x, y))
    for y in (ny - 1, ny):
        for x in (nx - 1, nx, nx + 1): put(5, x, y, 2)
    tower[0]["x"], tower[0]["y"] = NEW
    for (x, y) in RW.ring(changed, 1):
        if not (0 <= x < W and 0 <= y < H): continue
        k = kind(at(0, x, y))
        if k is None or N.is_wall_kind(k) or not RW.shapes_by_floor(k): continue
        def same(dx, dy, x=x, y=y, k=k):
            ax, ay = x + dx, y + dy
            if not (0 <= ax < W and 0 <= ay < H): return True
            return kind(at(0, ax, ay)) == k
        put(0, x, y, K(k) + N.floor_shape(same))
    print("Wiatrak %s -> %s (placyk i ścieżka do drogi)" % (OLD, NEW))
    for a in sys.argv:
        if a.startswith("--podglad="):
            p = a.split("=", 1)[1]
            open(os.path.join(p, "Map220.json"), "wb").write(RW.json_text(m, lay)); print("  podgląd: " + p)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "wiatrak_wyzej_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map220.json"), bak)
    open(os.path.join(ROOT, "data", "Map220.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
