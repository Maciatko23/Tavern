# Zmiany kafli pakietu 0 (docs/rozszerzenia/PLAN.md 2.6) - tylko nowy teren, plus dwa pola żywopłotu:
#   Map024 (7,29), (8,29)        wyłom w żywopłocie: warstwa 1 (rodzaj 20, żywopłot) -> 0; dolna ścieżka dworu łączy się ze zwierzyńcem
#   Map125 x 15-19, y 65-67      zatoczka przemytników: warstwa 1 (rodzaj 20, ściana lasu) -> 0; ziemia zostaje (rodzaj 17, jak plaża)
#   Map165 P1 x 46-48 y 23-24, P2 x 61-63 y 18-19, P3 x 70-72 y 23-24
#                                płycizny: woda -> piasek łachy (rodzaj 24), warstwa 1 -> 0, region 61 (sucho tylko w odpływie)
# Autokafle sąsiadów przeliczone regułą edytora (jak tools/powieksz/powieksz.py). Sam nic nie zapisuje do data/ - robi to pakiet0.py
# (staging) i instaluj.py.
#   python tools/rozszerzenia/kafle.py          pokazuje, co by się zmieniło
from wspolne import read_json, at, put, kind_of, reshape, ring

HEDGE, FOREST_WALL, SAND, REGION_LOW = 20, 20, 24, 61
WYLOM = [(7, 29), (8, 29)]
ZATOCZKA = [(x, y) for y in range(65, 68) for x in range(15, 20)]
PLYCIZNY = {"P1": [(x, y) for y in (23, 24) for x in range(46, 49)],
            "P2": [(x, y) for y in (18, 19) for x in range(61, 64)],
            "P3": [(x, y) for y in (23, 24) for x in range(70, 73)]}


def apply_wylom(m, log):
    for (x, y) in WYLOM:
        k1 = kind_of(at(m, 1, x, y))
        if k1 != HEDGE: raise SystemExit("STOP: Map024 (%d,%d) warstwa 1 to rodzaj %s, nie żywopłot (%d)" % (x, y, k1, HEDGE))
        if at(m, 2, x, y) or at(m, 3, x, y) or at(m, 5, x, y): raise SystemExit("STOP: Map024 (%d,%d) ma coś na warstwie 2/3 albo region" % (x, y))
        put(m, 1, x, y, 0)
    reshape(m, 1, ring(WYLOM) - set(WYLOM))
    log("Map024: wyłom w żywopłocie (7,29), (8,29)")


def apply_zatoczka(m, log):
    for (x, y) in ZATOCZKA:
        k1 = kind_of(at(m, 1, x, y))
        if k1 != FOREST_WALL: raise SystemExit("STOP: Map125 (%d,%d) warstwa 1 to rodzaj %s, nie ściana lasu" % (x, y, k1))
        if at(m, 2, x, y) or at(m, 3, x, y): raise SystemExit("STOP: Map125 (%d,%d) ma coś na warstwie 2/3" % (x, y))
        put(m, 1, x, y, 0)
    for e in m["events"]:
        if e and (e["x"], e["y"]) in set(ZATOCZKA): raise SystemExit("STOP: Map125 zdarzenie %d na polu zatoczki (%d,%d)" % (e["id"], e["x"], e["y"]))
    reshape(m, 1, ring(ZATOCZKA) - set(ZATOCZKA))
    log("Map125: zatoczka x 15-19, y 65-67 (wejście od drogi przez (20,66))")


def apply_plycizny(m, log):
    sand = None
    for x in range(40, 79):
        if kind_of(at(m, 0, x, 21)) == SAND: sand = at(m, 0, x, 21); break
    if sand is None: raise SystemExit("STOP: Map165 bez piasku łachy w wierszu 21")
    cells = set()
    for name, cs in PLYCIZNY.items():
        for (x, y) in cs:
            k0 = kind_of(at(m, 0, x, y))
            if not (k0 is not None and k0 < 16): raise SystemExit("STOP: Map165 %s (%d,%d) to nie woda (rodzaj %s)" % (name, x, y, k0))
            put(m, 0, x, y, sand)
            put(m, 1, x, y, 0)
            put(m, 5, x, y, REGION_LOW)
            cells.add((x, y))
        log("Map165: płycizna %s %s" % (name, "x %d-%d, y %d-%d" % (min(c[0] for c in cs), max(c[0] for c in cs), min(c[1] for c in cs), max(c[1] for c in cs))))
    around = ring(cells, 1)
    reshape(m, 0, around)
    reshape(m, 1, around - cells)


if __name__ == "__main__":
    for rel, fn in (("data/Map024.json", apply_wylom), ("data/Map125.json", apply_zatoczka), ("data/Map165.json", apply_plycizny)):
        m, lay = read_json(rel)
        fn(m, print)
    print("(podgląd - nic nie zapisano; staging robi tools/rozszerzenia/pakiet0.py)")
