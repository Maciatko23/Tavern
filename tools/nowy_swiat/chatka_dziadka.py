# -*- coding: utf-8 -*-
"""Chatka dziadka (gracz 2026-11-14: „dom dziadka to malutki domek z małym wnętrzem na jedną osobę - dziadek żyje super skromnie”).
  1. Podgrodzie (Map218): dom dziadka z 7 kratek szerokości i 4 rzędów dachu na chatkę 4 x (3 rzędy dachu + 2 ściany): lewy narożnik
     z bluszczem, drzwi, jedno okno, prawy narożnik; przybudówka z drewnem dosunięta, płot dociągnięty do ścian, komin, beczka,
     drzwi i punkt przed drzwiami przesunięte; zwolniona ziemia = trawa.
  2. Nowe wnętrze Map224 „Chata dziadka” (8 x 9, podłoga 6 x 4) złożone z kafli starego domu (Map019, który zostaje nietknięty -
     stary świat i testy): jedno łóżko (bohatera - dziadek oddał mu swoje i śpi w fotelu przy ogniu), stołek ze świecą, kołki
     z ubraniem, okno, palenisko z kotłem, fotel, dywanik, skrzynia. Drzwi chatki prowadzą do środka i z powrotem.
  python tools/nowy_swiat/chatka_dziadka.py [--podglad katalog] [--wykonaj]"""
import copy, datetime, importlib.util, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

OUT_MAP, IN_MAP, OLD_IN = 218, 224, 19
GRASS = 2816
# the hut: new column <- old column of the house (x 12..18), new roof / wall row <- old row
COLS = {13: 12, 14: 15, 15: 17, 16: 18}
ROWS = {15: 14, 16: 16, 17: 17, 18: 18, 19: 19}
DOOR, DOOR_FRONT = (14, 19), (14, 20)
# the room: columns / rows of Map019 kept
IN_COLS = [0, 1, 2, 3, 8, 9, 10, 18]
IN_ROWS = [0, 1, 2, 3, 4, 5, 6, 11, 12]
IN_DOOR = (5, 8)                       # (old 9, 12)


def cmd(code, *params): return {"code": code, "indent": 0, "parameters": list(params)}
def transfer(mid, x, y, d): return [cmd(250, {"name": "Door1", "volume": 60, "pitch": 100, "pan": 0}), cmd(201, 0, mid, x, y, d, 0), cmd(0)]


def outside():
    rel = "data/Map%03d.json" % OUT_MAP
    m, lay = RW.read_json(rel)
    W, H, d = m["width"], m["height"], m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    if not (at(0, 12, 14) == 5459 and at(0, 18, 19) == 5612 and at(3, 11, 16) == 202):
        raise SystemExit("STOP: dom dziadka nie stoi w (12..18, 14..19) z przybudówką w x 11 - już zmieniony? Nic nie ruszam.")
    old = {(z, x, y): at(z, x, y) for z in range(6) for x in range(10, 21) for y in range(12, 22)}
    # the old house and its lean-to off the ground
    for x in range(11, 20):
        for y in range(14, 20):
            if x in (11, 19) and y < 15: continue
            if 12 <= x <= 18:
                put(0, x, y, GRASS)
                for z in (1, 2, 3): put(z, x, y, 0)
                put(4, x, y, 0); put(5, x, y, 0)
            elif x == 11:
                for z in (2, 3): put(z, x, y, 0)       # (the lean-to's planks and logs; its fence piece on layer 1 stays)
            else: put(4, x, y, 0)                       # (x 19: the old east shadow)
    # the hut
    for nx, ox in COLS.items():
        for ny, oy in ROWS.items():
            for z in range(4): put(z, nx, ny, old[(z, ox, oy)])
            if old[(3, ox, oy)] in (84, 92): put(3, nx, ny, 0)          # (the chimney's tiles: Kominy.js draws its own picture)
            put(5, nx, ny, 3 if ny in (15, 16) else (old[(5, ox, oy)] if ny == 19 else 2))
    # the lean-to with the firewood beside its left wall (old x 11 -> x 12)
    for y in (16, 17, 18, 19):
        for z in (2, 3): put(z, 12, y, old[(z, 11, y)])
        put(5, 12, y, 2)
    # the east shadow down the new wall
    for y in (16, 17, 18, 19): put(4, 17, y, 5)
    # the yard's fence drawn up to the walls (it met the old house's sides at row 15)
    FENCE = 2048 + 22 * 48
    for x in (12, 17, 18): put(1, x, 15, FENCE)
    area = [(x, y) for x in range(9, 22) for y in range(11, 23)]
    RW.reshape(m, 0, area); RW.reshape(m, 1, area)
    # events
    ev = {e["name"]: e for e in m["events"] if e and e["name"] in ("Drzwi: Dom dziadka", "Miejsce: dziadek_drzwi", "Beczka na deszczówkę")}
    door = ev["Drzwi: Dom dziadka"]
    chimney = next(e for e in m["events"] if e and e["name"] == "Dym z komina" and (e["x"], e["y"]) == (17, 14))
    barrel = next(e for e in m["events"] if e and e["name"] == "Beczka na deszczówkę" and (e["x"], e["y"]) == (17, 20))
    door["x"], door["y"] = DOOR
    door["pages"][0]["list"] = transfer(IN_MAP, IN_DOOR[0], IN_DOOR[1] - 1, 8)
    ev["Miejsce: dziadek_drzwi"]["x"], ev["Miejsce: dziadek_drzwi"]["y"] = DOOR_FRONT
    chimney["x"], chimney["y"] = 15, 15
    barrel["x"], barrel["y"] = 16, 20
    stray = [(e["id"], e["name"], e["x"], e["y"]) for e in m["events"] if e and 12 <= e["x"] <= 18 and 14 <= e["y"] <= 19 and e not in (door, chimney)]
    if stray: raise SystemExit("STOP: na miejscu domu stoją jeszcze zdarzenia: %s" % stray)
    return rel, m, lay


def inside():
    src, lay = RW.read_json("data/Map%03d.json" % OLD_IN)
    W, H, d = src["width"], src["height"], src["data"]
    NW, NH = len(IN_COLS), len(IN_ROWS)
    m = copy.deepcopy(src)
    data = [0] * (6 * NW * NH)
    for z in range(6):
        for ny, oy in enumerate(IN_ROWS):
            for nx, ox in enumerate(IN_COLS):
                v = d[(z * H + oy) * W + ox]
                if 1 <= z <= 3 and oy == 11: v = 0                      # (the old kitchen nook's table and the barrels' feet: cut - gone)
                if z == 4 and oy in (6, 11, 12): v = 0                  # (the old rooms' wall shadows on the lower floor: no such walls here)
                data[(z * NH + ny) * NW + nx] = v
    m["width"], m["height"], m["data"] = NW, NH, data
    m["displayName"] = "Chata dziadka"
    m["note"] = re.sub(r"<Zoom:[^>]*>", "<Zoom:1.5>", src["note"])
    cells = [(x, y) for x in range(NW) for y in range(NH)]
    RW.reshape(m, 0, cells)                                             # (the floor and the ceiling frame: one small room now)
    # the door's place in the bottom wall as it was (the reshape closes the frame round it the same way)
    for nx, ox in enumerate(IN_COLS):
        if ox in (8, 9, 10): data[(0 * NH + (NH - 1)) * NW + nx] = d[(0 * H + 12) * W + ox]
    data[(0 * NH + (NH - 2)) * NW + IN_DOOR[0]] = d[(0 * H + 11) * W + 9]
    cx = {ox: nx for nx, ox in enumerate(IN_COLS)}; cy = {oy: ny for ny, oy in enumerate(IN_ROWS)}
    keep = {8: None, 18: None, 20: None, 22: None, 23: None, 24: None, 3: None, 15: None, 6: None, 7: None, 17: None,
            14: (1, 7)}                                                 # (the chest: to the foot of the bed)
    events = [None]
    for e in src["events"]:
        if not e or e["id"] not in keep: continue
        n = copy.deepcopy(e)
        to = keep[e["id"]]
        n["x"], n["y"] = to if to else (cx[e["x"]], cy[e["y"]])
        n["id"] = len(events)
        if e["id"] == 17: n["pages"][0]["list"] = transfer(OUT_MAP, DOOR_FRONT[0], DOOR_FRONT[1], 2); n["name"] = "Drzwi -> Podgrodzie"
        events.append(n)
    m["events"] = events
    return "data/Map%03d.json" % IN_MAP, m, lay


def main():
    r1, m1, l1 = outside()
    r2, m2, l2 = inside()
    mi, lmi = RW.read_json("data/MapInfos.json")
    if len(mi) > IN_MAP and mi[IN_MAP]: raise SystemExit("STOP: Map%d już jest w MapInfos" % IN_MAP)
    while len(mi) <= IN_MAP: mi.append(None)
    mi[IN_MAP] = {"id": IN_MAP, "expanded": False, "name": "Chata dziadka (wnętrze)", "order": max(x["order"] for x in mi if x) + 1,
                  "parentId": OUT_MAP, "scrollX": 0, "scrollY": 0}
    print("Podgrodzie: chatka 4 x 5 w (13..16, 15..19), drzwi %s; wnętrze Map%d %dx%d, %d zdarzeń" % (DOOR, IN_MAP, m2["width"], m2["height"], len(m2["events"]) - 1))
    files = [(r1, RW.json_text(m1, l1)), (r2, RW.json_text(m2, l2)), ("data/MapInfos.json", RW.json_text(mi, lmi))]
    if "--podglad" in sys.argv:
        out = sys.argv[sys.argv.index("--podglad") + 1]
        for rel, raw in files[:2]: open(os.path.join(out, os.path.basename(rel)), "wb").write(raw)
        return
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "chatka_dziadka_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    sp = os.path.join(ROOT, "data", "System.json")
    for rel, raw in files:
        p = os.path.join(ROOT, rel)
        if os.path.exists(p): shutil.copy2(p, bak)
        open(p, "wb").write(raw)
    shutil.copy2(sp, bak)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie: %s" % bak)


if __name__ == "__main__":
    main()
