# -*- coding: utf-8 -*-
"""Miasteczko (Map220), 2026-11-13 (gracz, zrzut z edytora z numerami: „4 ogródki przenieś pod same wzgórze; budynek 5, 6 i 7
daj wyżej o 4 kratki”):
  - 4 ogródki (x 29..36 / 38..45 / 50..57 / 59..66, po 8 x 4 kratki) -> jeden rząd tuż pod wzgórzem, wiersze 7..10, co 7 kratek
    (stykają się płotem, jak znaczniki 1-4 na zrzucie): x 43..50, 50..57, 57..64, 64..71; furtki zostają w dolnym płocie;
    kamyki pod skałą w wierszu 7 i krzaczki / sosny z tego miejsca przeniesione obok; stare miejsca ogródków -> trawa;
  - ratusz (x 38..48), kantor (x 51..56) i piekarnia (x 59..64) o 4 kratki w górę (wiersze 18..24 -> 14..20) z kominami,
    szyldami, drzwiami, cieniem i punktami mieszkańców przed drzwiami; zwolnione wiersze 21..24 -> trawa, przed drzwiami
    plac z ubitej ziemi przed nimi aż do drogi (x 38..64); pieniek z siekierą, grusza, sosny i kamienie z ich nowego miejsca
    przeniesione na wolną trawę.
  python tools/nowy_swiat/ogrodki_pod_wzgorze.py [--podglad=<katalog>] [--wykonaj]"""
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
GRASS, EARTH, FENCE = 16, 17, 22
GARDENS = (((29, 12), (43, 7)), ((38, 10), (50, 7)), ((50, 12), (57, 7)), ((59, 12), (64, 7)))   # (old top-left, new top-left), 8 x 4
BUILDINGS = ((38, 48, 49, 43), (51, 56, 57, 54), (59, 64, 65, 61))   # (x0, x1, shadow column, door x), rows 18..24 -> 14..20
B_ROWS, DY = range(18, 25), -4
# decorations standing where the gardens / buildings go: id -> (name start, old, new)
RELOCATE = {172: ("Sosna", (44, 9), (41, 10)), 190: ("Suchy krzaczek", (44, 10), (40, 12)), 191: ("Kolczaste", (52, 10), (49, 12)),
            173: ("Sosna", (59, 9), (77, 10)), 192: ("Suchy krzaczek", (60, 10), (66, 12)), 196: ("Suchy krzaczek", (61, 9), (73, 9)),
            193: ("Kolczaste", (68, 10), (75, 11)), 195: ("Stos p", (53, 16), (36, 13)), 194: ("Dzika grusza", (58, 17), (32, 13))}
STUMP = ((51, 16, 420), (51, 17, 428))     # the chopping block with an axe (layer 2) where the bank goes -> (31, 15..16)
STUMP_TO = (31, 15)
DOOR_SPOTS = (45, 209, 210, 211, 212, 49, 223, 224, 54, 221, 222)      # "Miejsce: ..." in front of the three doors (row 25 -> 21)
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def main():
    m, lay = RW.read_json("data/Map220.json")
    d = m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    old = list(d)
    oat = lambda z, x, y: old[(z * H + y) * W + x]
    for (o, n) in GARDENS:
        if not (kind(oat(1, o[0], o[1])) == FENCE and kind(oat(1, o[0] + 7, o[1] + 3)) == FENCE):
            raise SystemExit("STOP: Map220 - ogródek nie w %s" % (o,))
    for (x0, x1, sh, door) in BUILDINGS:
        if not (4352 <= oat(0, x0, 20) < 8192 and 4352 <= oat(0, x1, 24) < 8192):
            raise SystemExit("STOP: Map220 - budynek x %d..%d nie tam, gdzie był" % (x0, x1))
    ev = {e["id"]: e for e in m["events"] if e}
    for eid, (nm, o, n) in RELOCATE.items():
        if eid not in ev or not ev[eid]["name"].startswith(nm) or (ev[eid]["x"], ev[eid]["y"]) != o:
            raise SystemExit("STOP: Map220 - zdarzenie %d (%s) nie na %s" % (eid, nm, o))
    if [oat(2, x, y) for (x, y, t) in STUMP] != [t for (x, y, t) in STUMP]: raise SystemExit("STOP: Map220 - pieńka z siekierą nie ma")
    changed = set()
    for i, (x, y, t) in enumerate(STUMP): put(2, STUMP_TO[0], STUMP_TO[1] + i, t)
    # ---- 1. the old gardens -> grass
    for (o, n) in GARDENS:
        for y in range(o[1], o[1] + 4):
            for x in range(o[0], o[0] + 8):
                put(0, x, y, 2048 + GRASS * 48)
                for z in (1, 2, 3, 4): put(z, x, y, 0)
                put(5, x, y, 0); changed.add((x, y))
    # ---- 2. the buildings 4 rows up (the rows they leave: grass, a path of earth to the road from the door)
    moved_cells = []
    for (x0, x1, sh, door) in BUILDINGS:
        for y in B_ROWS:
            for x in range(x0, x1 + 1):
                for z in range(6): put(z, x, y + DY, oat(z, x, y))
                moved_cells.append((x, y + DY))
            put(4, sh, y + DY, oat(4, sh, y))
        for y in range(B_ROWS[-1] + DY + 1, B_ROWS[-1] + 1):
            for x in range(x0, x1 + 1):
                path = True                                            # the forecourt: earth up to the road
                put(0, x, y, 2048 + (EARTH if path else GRASS) * 48)
                for z in (1, 2, 3, 4): put(z, x, y, 0)
                put(5, x, y, 31 if path else 0); changed.add((x, y))
            put(4, sh, y, 0)
        changed |= set(moved_cells)
    for y in range(B_ROWS[-1] + DY + 1, B_ROWS[-1] + 1):
        for x in (49, 50, 57, 58):
            if kind(at(0, x, y)) in (GRASS, EARTH): put(0, x, y, 2048 + EARTH * 48); put(5, x, y, 31); changed.add((x, y))
    for x in range(38, 65):                                            # the old door steps' grass in the road (row 25)
        if kind(at(0, x, 25)) == GRASS: put(0, x, 25, 2048 + EARTH * 48); changed.add((x, 25))
    # ---- 3. the gardens under the hill (copied whole; fences shared where they touch)
    for (o, n) in GARDENS:
        for dy in range(4):
            for dx in range(8):
                x, y = n[0] + dx, n[1] + dy
                for z in range(6): put(z, x, y, oat(z, o[0] + dx, o[1] + dy))
                changed.add((x, y))
    # ---- shapes (A3 / A4 sides: wall shapes; floors: floor shapes)
    for z in (0, 1):
        for (x, y) in RW.ring(changed, 1):
            if not (0 <= x < W and 0 <= y < H): continue
            k = kind(at(z, x, y))
            if k is None: continue
            def same(dx, dy, x=x, y=y, k=k, z=z):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < W and 0 <= ny < H): return True
                return kind(at(z, nx, ny)) == k
            if N.is_wall_kind(k): put(z, x, y, 2048 + k * 48 + N.wall_shape(same))
            elif RW.shapes_by_floor(k): put(z, x, y, 2048 + k * 48 + N.floor_shape(same))
    # ---- events
    n_b = 0
    for e in m["events"]:
        if not e: continue
        for (x0, x1, sh, door) in BUILDINGS:
            if x0 <= e["x"] <= x1 and e["y"] in B_ROWS and e["id"] not in RELOCATE:
                e["y"] += DY; n_b += 1; break
    for eid in DOOR_SPOTS:
        e = ev[eid]
        if e["y"] != 25 or not e["name"].startswith("Miejsce: "): raise SystemExit("STOP: punkt %d nie w wierszu 25" % eid)
        e["y"] = 21
    for eid, (nm, o, n) in RELOCATE.items(): ev[eid]["x"], ev[eid]["y"] = n
    clash = [(e["id"], e["name"], e["x"], e["y"]) for e in m["events"] if e and 43 <= e["x"] <= 71 and 7 <= e["y"] <= 10]
    if clash: raise SystemExit("STOP: zdarzenia w nowych ogródkach: %s" % clash)
    print("Ogródki -> wiersze 7..10, x 43..71 (4 obok siebie); ratusz, kantor, piekarnia -> wiersze 14..20 (%d zdarzeń z nimi, "
          "%d punktów przed drzwiami); przeniesione ozdoby: %d" % (n_b, len(DOOR_SPOTS), len(RELOCATE)))
    for a in sys.argv:
        if a.startswith("--podglad="):
            p = a.split("=", 1)[1]
            open(os.path.join(p, "Map220.json"), "wb").write(RW.json_text(m, lay)); print("  podgląd: " + p)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "ogrodki_pod_wzgorze_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map220.json"), bak)
    open(os.path.join(ROOT, "data", "Map220.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
