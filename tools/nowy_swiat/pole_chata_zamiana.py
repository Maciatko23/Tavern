# -*- coding: utf-8 -*-
"""Podgrodzie (Map218), 2026-11-13 (gracz: „pole ze zbożem przenieść na prawo od młyna, a domek stamtąd gdzieś indziej; niech pole
będzie trochę większe”):
  1. chata młynarza (kafle x 12..18, y 31..35: dach, ściany, beczka, wszystkie warstwy i regiony + zdarzenia: drzwi, dym, miejsce przed
     drzwiami) -> na północny zachód, x 1..7, y 20..24 (drzwi 4,24) - poza zasięgiem skrzydeł wiatraka; wydeptana ścieżka od jej drzwi
     wzdłuż zachodniego boku wiatraka do jego drzwi;
  2. stare pole (płot x 1..9, y 23..28) -> trawa;
  3. nowe pole na prawo od wiatraka, większe: ziemia 7 x 5 (x 10..16, y 29..33, region 7) w płocie z furtką (16,34) do ścieżki (rząd trawy nad ogródkiem),
     zdarzenie „Pole młynarza” <Pole:7,6>.
  python tools/nowy_swiat/pole_chata_zamiana.py [--podglad=<plik>] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

HUT_FROM = (12, 31, 18, 35)
HUT_TO = (1, 20)                              # the block's new top-left
OLD_FIELD = (1, 23, 9, 28)
FIELD = (10, 29, 16, 33)
GATE = (16, 34)
PATH = [(4, y) for y in range(25, 36)] + [(5, 35), (6, 35)]
GRASS, EARTH, PATH_K, FENCE = 16, 24, 17, 22


def a2(k): return 2048 + k * 48


def main():
    m, lay = RW.read_json("data/Map218.json")
    W, H = m["width"], m["height"]
    at = lambda z, x, y: m["data"][(z * H + y) * W + x]
    def put(z, x, y, v): m["data"][(z * H + y) * W + x] = v
    fx0, fy0, fx1, fy1 = HUT_FROM
    dx, dy = HUT_TO[0] - fx0, HUT_TO[1] - fy0
    block = {(x, y): [at(z, x, y) for z in range(6)] for y in range(fy0, fy1 + 1) for x in range(fx0, fx1 + 1)}
    shade = {(x, y): at(4, x, y) for y in range(fy0 - 1, fy1 + 2) for x in range(fx0, fx1 + 2)}   # (the hut's shadow: a column more east)
    # events: the field's old event and what stands where the hut goes away; the hut's own move with it
    new_rect = {(x + dx, y + dy) for (x, y) in block}
    moved = []
    for i, e in enumerate(m["events"]):
        if not e: continue
        if e["name"] == "Pole młynarza": m["events"][i] = None; continue
        if fx0 <= e["x"] <= fx1 and fy0 <= e["y"] <= fy1 + 1 and e["name"] in ("Drzwi: Chata mlynarza", "Dym z komina", "Miejsce: mlynarz_drzwi"):
            e["x"] += dx; e["y"] += dy; moved.append(e["name"]); continue
        if (e["x"], e["y"]) in new_rect or (e["x"], e["y"]) in {(x, y) for x in range(FIELD[0] - 1, FIELD[2] + 2) for y in range(FIELD[1] - 1, FIELD[3] + 2)}:
            if e["name"] in ("Sosna (niska)", "Sosna", "Sterta kamieni", "Pieniek", "Kolczaste pnącza", "Suchy krzaczek", "Płaski kamień", "Omszały kamień"):
                m["events"][i] = None
    # 1. the old hut's place and the old field -> grass
    clear = set(block) | {(x, y) for x in range(OLD_FIELD[0], OLD_FIELD[2] + 1) for y in range(OLD_FIELD[1], OLD_FIELD[3] + 1)}
    for (x, y) in clear:
        put(0, x, y, a2(GRASS))
        for z in (1, 2, 3): put(z, x, y, 0)
        put(5, x, y, 0)
    for (x, y) in shade: put(4, x, y, 0)
    # 2. the hut on its new place (all layers, regions, its shadow)
    for (x, y) in new_rect:
        for z in (1, 2, 3): put(z, x, y, 0)
    for (x, y), vals in block.items():
        for z in range(6): put(z, x + dx, y + dy, vals[z])
    for (x, y), v in shade.items(): put(4, x + dx, y + dy, v)
    # 3. the path from the hut's door to the mill's
    for (x, y) in PATH:
        if at(0, x, y) >= 2816 and at(0, x, y) < 4352 and not any(at(z, x, y) for z in (2, 3)): put(0, x, y, a2(PATH_K)); put(1, x, y, 0)
    # 4. the new field
    soil = {(x, y) for x in range(FIELD[0], FIELD[2] + 1) for y in range(FIELD[1], FIELD[3] + 1)}
    ring = {(x, y) for x in range(FIELD[0] - 1, FIELD[2] + 2) for y in range(FIELD[1] - 1, FIELD[3] + 2)} - soil - {GATE}
    for (x, y) in soil:
        put(0, x, y, a2(EARTH)); put(5, x, y, 7)
        for z in (1, 2, 3): put(z, x, y, 0)
    for (x, y) in ring:
        for z in (2, 3): put(z, x, y, 0)
        put(1, x, y, a2(FENCE))
        if at(5, x, y) == 7: put(5, x, y, 0)
    RW.reshape(m, 0, RW.ring(clear | soil | set(PATH) | new_rect, 1))
    RW.reshape(m, 1, RW.ring(ring | clear, 1))
    tmpl = next(e for e in m["events"] if e and e["name"] == "Drzwi: Chata mlynarza")
    import copy
    f = copy.deepcopy(tmpl)
    f.update({"name": "Pole młynarza", "x": FIELD[0], "y": FIELD[1], "note": "<Pole:%d,%d>" % (FIELD[2] - FIELD[0] + 1, FIELD[3] - FIELD[1] + 1)})
    pg = f["pages"][0]
    pg["image"] = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    pg["priorityType"], pg["through"], pg["list"] = 0, True, [{"code": 0, "indent": 0, "parameters": []}]
    nid = max(e["id"] for e in m["events"] if e) + 1
    while len(m["events"]) <= nid: m["events"].append(None)
    f["id"] = nid; m["events"][nid] = f
    print("chata młynarza -> x %d..%d, y %d..%d (przeniesione: %s); pole %dx%d przy (%d,%d)" % (
        fx0 + dx, fx1 + dx, fy0 + dy, fy1 + dy, ", ".join(moved), FIELD[2] - FIELD[0] + 1, FIELD[3] - FIELD[1] + 1, FIELD[0], FIELD[1]))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(m, lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "pole_chata_zamiana_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
