# -*- coding: utf-8 -*-
"""Miasteczko (Map220), 2026-11-13, po dużej tawernie (gracz: „domki na lewo od tawerny przesuń, żeby były 2 kratki przerwy, zrobi
się miejsce dla tawerny; po prawej rzeczy troszkę w prawo, żeby był odstęp od tawerny, najlepiej 2 kratki”):
  - lewy rząd (ścieżka przy baszcie, domy Walentego, Doroty, wdowy, kuźnia z daszkiem na drewno, ogródki za nimi, piec kowalski,
    kowadło, latarnia, punkty mieszkańców) - pas x 4..36, wiersze 28..39 - o 2 kratki w lewo: między kuźnią a tawerną 2 kratki
    (x 35..36), domy dalej co 2 kratki, przy baszcie bramy zostaje ścieżka (x 2);
  - prawy rząd (szopa stajni, wybieg z płotem, wóz z sianem, poidło, ogródek, dom starej pary) - pas x 60..76, wiersze 28..39 -
    o 1 kratkę w prawo: między tawerną a szopą 2 kratki (x 60..61);
  - zwolnione kratki: trawa (między domami) / ubita ziemia (wiersze drogi 38..39); kształty kafelków przy brzegach pasów od nowa.
  python tools/nowy_swiat/rzad_przesun.py [--podglad=<katalog>] [--wykonaj]"""
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
ROWS = range(28, 40)
STRIPS = ((4, 36, -2), (60, 76, +1))          # (x from, x to, shift)
GROUND = (16, 17, 27, 40)
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def main():
    m, lay = RW.read_json("data/Map220.json")
    d = m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    # checks: the smithy's lean-to at x 36, the tavern from x 37 to 59, the shed from x 61
    if kind(at(0, 37, 30)) != 67 or kind(at(0, 59, 30)) != 67 or kind(at(0, 61, 30)) != 64 or kind(at(0, 35, 36)) != 74:
        raise SystemExit("STOP: Map220 - tawerna / kuźnia / szopa nie tam, gdzie były")
    old = list(d)
    oat = lambda z, x, y: old[(z * H + y) * W + x]
    edge = set()
    for (a, b, s) in STRIPS:
        na, nb = a + s, b + s
        if min(na, nb) < 0 or max(na, nb) >= W: raise SystemExit("STOP: pas poza mapą")
        for y in ROWS:
            for x in range(a, b + 1):
                for z in range(6): put(z, x + s, y, oat(z, x, y))
            freed = range(b + s + 1, b + 1) if s < 0 else range(a, a + s)
            for x in freed:                                            # the cells left behind
                t = oat(0, x, y)
                put(0, x, y, t if kind(t) in GROUND else 2048 + (17 if y >= 38 else 16) * 48)
                for z in (1, 2, 3, 4): put(z, x, y, 0)
                if oat(5, x, y) in (2, 3): put(5, x, y, 0)
                edge.add((x, y))
            for x in (na - 1, na, nb, nb + 1): edge.add((x, y))
        for y in (ROWS[0] - 1, ROWS[-1] + 1):
            for x in range(min(a, na) - 1, max(b, nb) + 2): edge.add((x, y))
    # events in the strips
    moved = []
    for e in m["events"]:
        if not e or e["y"] not in ROWS: continue
        for (a, b, s) in STRIPS:
            if a <= e["x"] <= b:
                e["x"] += s; moved.append(e["name"]); break
    # tile shapes at the strips' borders (A3 / A4 sides: wall shapes; floors: floor shapes)
    for z in (0, 1):
        for (x, y) in RW.ring(edge, 1):
            if not (0 <= x < W and 0 <= y < H): continue
            k = kind(at(z, x, y))
            if k is None: continue
            def same(dx, dy, x=x, y=y, k=k, z=z):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < W and 0 <= ny < H): return True
                return kind(at(z, nx, ny)) == k
            if N.is_wall_kind(k): put(z, x, y, 2048 + k * 48 + N.wall_shape(same))
            elif RW.shapes_by_floor(k): put(z, x, y, 2048 + k * 48 + N.floor_shape(same))
    print("Lewy rząd x 4..36 -> x 2..34 (kuźnia z daszkiem kończy się na x 34, przerwa x 35..36); prawy rząd x 60..76 -> x 61..77 "
          "(szopa od x 62, przerwa x 60..61); zdarzenia przesunięte: %d" % len(moved))
    for a in sys.argv:
        if a.startswith("--podglad="):
            p = a.split("=", 1)[1]
            open(os.path.join(p, "Map220.json"), "wb").write(RW.json_text(m, lay)); print("  podgląd: " + p)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "rzad_przesun_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map220.json"), bak)
    open(os.path.join(ROOT, "data", "Map220.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
