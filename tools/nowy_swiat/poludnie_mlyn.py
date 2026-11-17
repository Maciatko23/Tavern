# -*- coding: utf-8 -*-
"""Miasteczko (Map220), południe pod korytem, 2026-11-13 (gracz, zrzut z edytora: „na dole wywal drewno, kamienie itd. i wstaw ogródki
przy wzgórzu po całej długości; pod korytem te budynki można jedne nad drugimi postawić i wrzucić młyn i duże pole ze zbożem bez płotka”):
  - pod wzgórzem (wiersze 69..72): sągi, kłody, kamienie, krzaki, pieńki, sosny i stare 2 ogródki precz; rząd 10 ogródków od x 2 do
    x 72 (po 8 x 4, wspólne płoty, furtka w górnym płocie od drogi, grządki jak w ogródkach pod północnym wzgórzem);
  - 7 domów (rzędu z drzwiami w wierszu 65) w dwóch rzędach po zachodniej stronie: górny rząd wiersze 54..58 (drzwi 58, uliczka
    59..60), dolny 61..65 (drzwi 65, droga 66..68); kominy, drzwi, beczki, przybudówki, cienie i punkty mieszkańców razem z nimi;
    przejścia z ubitej ziemi: od zachodniego mostku (x 13..15) i x 39..41 do drogi;
  - wschodnia strona: wiatrak jak w Podgrodziu (wieża !$1_Wiatrak_Wieza + skrzydła, x 44..46) na placyku z ziemi przy drodze i duże
    pole jęczmienia bez płotu <Pole:16,8> (x 50..65, wiersze 55..62, Wiatrak.js); dwa drzewa przy ścieżce od wschodniego mostku,
    sosna z brzegu nad dachem domu Wacława przeniesiona pod pole.
  python tools/nowy_swiat/poludnie_mlyn.py [--podglad=<katalog>] [--wykonaj]"""
import copy, datetime, importlib.util, os, shutil, sys

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
K = lambda k: 2048 + k * 48
# (old block x0, x1, new x0, new top row): the block = the building + its lean-to / barrels / shadow column, rows 61..65
BLOCKS = {"Wacław": (7, 14, 3, 54), "Leon": (17, 30, 17, 61), "Ostap": (35, 41, 17, 54), "studzienny": (42, 47, 33, 61),
          "Ludwik": (50, 57, 2, 61), "Jaś": (58, 64, 26, 54), "spichlerz": (65, 71, 34, 54)}
OLD_TOP = 61
WEST, EAST = (1, 41), (42, 70)           # cleared x ranges, rows 54..65 (the granary reached x 70, its shadow x 71)
REMOVE = (143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 171, 181, 182, 183, 184, 187, 188)
KEEP_TREES = {147: (68, 56), 154: (68, 62)}     # two trees by the east bridge's path (re-added after the clearing)
MOVE_PINE = ((5, 53), (67, 64))
LAMPS = {263: ((20, 69), (23, 68)), 264: ((40, 69), (44, 68))}
TOWER, FIELD = (45, 64), (50, 55, 16, 8)
GARDEN_ROW, GARDEN_X = 69, range(2, 66, 7)     # 10 gardens, 8 x 4, gate in the top fence (offsets 3..4)
CROPS = ((278, 279, 277, 278, 279, 277), (287, 285, 286, 287, 285, 286))
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def page(name, pic, prio):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False,
                           "variableValue": 0},
            "directionFix": True, "image": {"tileId": 0, "characterName": pic, "direction": 2, "pattern": 0, "characterIndex": 0},
            "list": [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": prio, "stepAnime": False, "through": True, "trigger": 1, "walkAnime": False}


def main():
    m, lay = RW.read_json("data/Map220.json")
    d = m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    old = list(d)
    oat = lambda z, x, y: old[(z * H + y) * W + x]
    ev = {e["id"]: e for e in m["events"] if e}
    # ---- checks
    for nm, (x0, x1, nx, ny) in BLOCKS.items():
        if not any(4352 <= oat(0, x, 63) < 8192 for x in range(x0, x1 + 1)): raise SystemExit("STOP: dom %s nie w x %d..%d" % (nm, x0, x1))
    for eid in REMOVE:
        if eid not in ev: raise SystemExit("STOP: brak zdarzenia %d" % eid)
    for eid, (o, n) in LAMPS.items():
        if (ev[eid]["x"], ev[eid]["y"]) != o: raise SystemExit("STOP: latarnia %d nie na %s" % (eid, o))
    if (ev[175]["x"], ev[175]["y"]) != MOVE_PINE[0]: raise SystemExit("STOP: sosna 175 nie na %s" % (MOVE_PINE[0],))
    changed = set()
    def clear(x, y, ground=GRASS):
        put(0, x, y, K(ground))
        for z in (1, 2, 3, 4): put(z, x, y, 0)
        put(5, x, y, 0); changed.add((x, y))
    # ---- 1. the old south quarter cleared: decor events out, the two sides -> grass
    kept_trees = {eid: copy.deepcopy(ev[eid]) for eid in KEEP_TREES}
    for eid in REMOVE: m["events"][eid] = None
    for y in range(54, 66):
        for x in range(WEST[0], EAST[1] + 1): clear(x, y)
        put(4, EAST[1] + 1, y, 0)
    # ---- 2. the houses (old tiles, rows 61..65) at their new places, with their events (rows 60..66)
    moves = {}
    for nm, (x0, x1, nx, ny) in BLOCKS.items():
        dx, dy = nx - x0, ny - OLD_TOP
        for y in range(OLD_TOP, OLD_TOP + 5):
            for x in range(x0, x1 + 1):
                for z in range(6): put(z, x + dx, y + dy, oat(z, x, y))
                changed.add((x + dx, y + dy))
        for e in m["events"]:
            if e and x0 <= e["x"] <= x1 and 60 <= e["y"] <= 66 and e["id"] not in moves:
                moves[e["id"]] = (e["x"] + dx, e["y"] + dy)
    for eid, (x, y) in moves.items(): m["events"][eid]["x"], m["events"][eid]["y"] = x, y
    ev[175]["x"], ev[175]["y"] = MOVE_PINE[1]                         # the pine on the bank would stand on a roof now (after the houses)
    # ---- 3. the lanes: between the two rows (59..60), from the west bridge (13..15), x 39..41, the road's west end (66..68)
    lanes = [(x, y) for y in (59, 60) for x in range(1, 42)] + [(x, y) for x in (13, 14, 15) for y in list(range(54, 59)) + list(range(61, 66))]
    lanes += [(x, y) for x in (39, 40, 41) for y in range(61, 66)] + [(x, y) for y in (66, 67, 68) for x in range(1, 9)]
    for (x, y) in lanes:
        if 4352 <= at(0, x, y) < 8192: raise SystemExit("STOP: uliczka na domu (%d,%d)" % (x, y))
        put(0, x, y, K(EARTH)); changed.add((x, y))
    # ---- 4. the windmill on an earth yard by the road, the big field
    tx, ty = TOWER
    for y in range(ty - 1, ty + 2):
        for x in range(tx - 2, tx + 3): put(0, x, y, K(EARTH)); changed.add((x, y))
    for y in (ty - 1, ty):
        for x in (tx - 1, tx, tx + 1): put(5, x, y, 2)
    fx, fy, fw, fh = FIELD
    for y in range(fy, fy + fh):
        for x in range(fx, fx + fw):
            corner = (x in (fx, fx + fw - 1)) and (y in (fy, fy + fh - 1))
            if not corner: put(5, x, y, 7)
    free = [i for i, e in enumerate(m["events"]) if i and e is None]
    def add(e):
        nid = free.pop(0) if free else len(m["events"])
        if nid >= 500: raise SystemExit("STOP: brak numeru zdarzenia < 500")
        while len(m["events"]) <= nid: m["events"].append(None)
        e["id"] = nid; m["events"][nid] = e
        return nid
    tower = {"id": 0, "name": "Wiatrak", "note": "<Wiatrak:Wiatrak_Smigla,-300,8,1.25>", "pages": [page("Wiatrak", "!$1_Wiatrak_Wieza", 1)], "x": tx, "y": ty}
    field = {"id": 0, "name": "Pole jęczmienia", "note": "<Pole:%d,%d>" % (fw, fh), "pages": [page("Pole", "", 0)], "x": fx, "y": fy}
    ids = [add(tower), add(field)]
    for eid, (x, y) in KEEP_TREES.items():
        e = kept_trees[eid]; e["x"], e["y"] = x, y; ids.append(add(e))
    # ---- 5. under the hill: everything off rows 69..72, a row of gardens
    for eid, (o, n) in LAMPS.items(): ev[eid]["x"], ev[eid]["y"] = n
    for e in m["events"]:
        if e and GARDEN_ROW <= e["y"] <= GARDEN_ROW + 3 and 1 <= e["x"] <= 74 and e["id"] not in LAMPS:
            raise SystemExit("STOP: zdarzenie pod wzgórzem zostało: %d %s" % (e["id"], e["name"]))
    for y in range(GARDEN_ROW, GARDEN_ROW + 4):
        for x in range(1, 75): clear(x, y)
    for gx in GARDEN_X:
        for dy in range(4):
            for dx in range(8):
                x, y = gx + dx, GARDEN_ROW + dy
                ring = dx in (0, 7) or dy in (0, 3)
                gate = dy == 0 and dx in (3, 4)
                if ring and not gate: put(1, x, y, K(FENCE))
                if 1 <= dx <= 6 and 1 <= dy <= 2:
                    put(0, x, y, K(EARTH)); put(2, x, y, CROPS[dy - 1][dx - 1])
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
            if N.is_wall_kind(k): put(z, x, y, K(k) + N.wall_shape(same))
            elif RW.shapes_by_floor(k): put(z, x, y, K(k) + N.floor_shape(same))
    print("Domy w dwóch rzędach (zdarzeń z nimi: %d); wiatrak (%d,%d), pole %dx%d od (%d,%d); %d ogródków pod wzgórzem; nowe zdarzenia: %s"
          % (len(moves), tx, ty, fw, fh, fx, fy, len(GARDEN_X), ids))
    for a in sys.argv:
        if a.startswith("--podglad="):
            p = a.split("=", 1)[1]
            open(os.path.join(p, "Map220.json"), "wb").write(RW.json_text(m, lay)); print("  podgląd: " + p)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "poludnie_mlyn_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map220.json"), bak)
    open(os.path.join(ROOT, "data", "Map220.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
