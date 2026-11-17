# -*- coding: utf-8 -*-
"""Podgrodzie (Map218), 2026-11-13 (gracz: „wiatrak ma być węższy i trochę wyższy i ma się płynnie kręcić bez błędów w grafice; koło
młyna ma być pole z rosnącym zbożem”):
  1. stary wiatrak z kafli (ściany A4 5 x 5, x 5..9, y 30..34) + zdarzenia „Czapa wiatraka” i „Skrzydła wiatraka” -> jasna trawa
     pagórka; nowa wieża: jedno zdarzenie „Wiatrak” (7,34) z obrazkiem !$1_Wiatrak_Wieza (3 x 7 kratek, drzwi wyższe niż w chatach) i notatką
     <Wiatrak:Wiatrak_Smigla,-300,8,1.25> (skrzydła obraca js/plugins/Wiatrak.js); region 2 na podstawie wieży (6..8 x 33..34);
     „Drzwi: Wiatrak” zostają (bez własnego obrazka - drzwi są na wieży);
  2. pole jęczmienia młynarza na północ od wiatraka: ziemia (A2 24) 7 x 4 (x 2..8, y 24..27, region 7: nic tam nie leży) w płocie (A2 22) z furtką,
     zdarzenie „Pole młynarza” z <Pole:7,4> (Wiatrak.js rysuje zboże wg pory roku) i napisem; pniak i pnącza z tego miejsca znikają.
  python tools/nowy_swiat/wiatrak_pole.py [--podglad=<plik>] [--wykonaj]"""
import copy, datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

OLD = (5, 30, 9, 34)
TOWER = (7, 34)
FOOT = [(x, y) for x in (6, 7, 8) for y in (33, 34)]
FIELD = (2, 24, 8, 27)                 # the soil (x0, y0, x1, y1)
GATE = (9, 27)                         # a gap in the fence, on the side toward the mill's path
LIGHT_GRASS, EARTH, FENCE = 27, 24, 22
FIELD_TEXT = ["Pole młynarza. Jęczmień na mąkę.", "Nie twoje - lepiej nie deptać."]


def a2(k): return 2048 + k * 48


def main():
    m, lay = RW.read_json("data/Map218.json")
    W, H = m["width"], m["height"]
    at = lambda z, x, y: m["data"][(z * H + y) * W + x]
    def put(z, x, y, v): m["data"][(z * H + y) * W + x] = v
    # 1. the old windmill away
    x0, y0, x1, y1 = OLD
    cleared = set()
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if at(0, x, y) >= 4352:
                put(0, x, y, a2(LIGHT_GRASS)); cleared.add((x, y))
            for z in (1, 2, 3): put(z, x, y, 0)
            if at(5, x, y) == 2: put(5, x, y, 0)
    RW.reshape(m, 0, RW.ring(cleared, 1))
    door = None
    for i, e in enumerate(m["events"]):
        if not e: continue
        if e["name"] in ("Czapa wiatraka", "Skrzydła wiatraka"): m["events"][i] = None
        elif e["name"] == "Drzwi: Wiatrak": door = e
    if not door: raise SystemExit("STOP: brak „Drzwi: Wiatrak”.")
    door["pages"][0]["image"]["characterName"] = ""
    for (x, y) in FOOT: put(5, x, y, 2)
    def new_event(name, x, y, note, image, priority, through, cmds):
        e = copy.deepcopy(door)
        e["name"], e["x"], e["y"], e["note"] = name, x, y, note
        pg = e["pages"][0]
        pg["image"] = {"tileId": 0, "characterName": image, "direction": 2, "pattern": 0, "characterIndex": 0}
        pg["priorityType"], pg["through"], pg["directionFix"], pg["stepAnime"], pg["walkAnime"] = priority, through, True, False, False
        pg["list"] = cmds + [{"code": 0, "indent": 0, "parameters": []}]
        nid = max(v["id"] for v in m["events"] if v) + 1
        while len(m["events"]) <= nid: m["events"].append(None)
        e["id"] = nid; m["events"][nid] = e
        return nid
    if not any(e and e["name"] == "Wiatrak" for e in m["events"]):
        new_event("Wiatrak", TOWER[0], TOWER[1], "<Wiatrak:Wiatrak_Smigla,-300,8,1.25>", "!$1_Wiatrak_Wieza", 1, True, [])
    # 2. the field
    fx0, fy0, fx1, fy1 = FIELD
    soil = {(x, y) for x in range(fx0, fx1 + 1) for y in range(fy0, fy1 + 1)}
    for i, e in enumerate(m["events"]):
        if e and fx0 - 1 <= e["x"] <= fx1 + 1 and fy0 - 1 <= e["y"] <= fy1 + 1 and e["name"] in ("Pieniek", "Kolczaste pnącza", "Suchy krzaczek"):
            m["events"][i] = None
    for (x, y) in soil:
        put(0, x, y, a2(EARTH)); put(5, x, y, 7)   # (region 7: Farming's "no field" - no stones or branches lie on the miller's field)
        for z in (1, 2, 3): put(z, x, y, 0)
    ring = {(x, y) for x in range(fx0 - 1, fx1 + 2) for y in range(fy0 - 1, fy1 + 2)} - soil - {GATE}
    for (x, y) in ring:
        for z in (2, 3): put(z, x, y, 0)
        put(1, x, y, a2(FENCE))
    RW.reshape(m, 0, RW.ring(soil, 1))
    RW.reshape(m, 1, RW.ring(ring, 1))
    if not any(e and e["name"] == "Pole młynarza" for e in m["events"]):
        cmds = [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}] + [{"code": 401, "indent": 0, "parameters": [t]} for t in FIELD_TEXT]
        new_event("Pole młynarza", fx0, fy0, "<Pole:%d,%d>" % (fx1 - fx0 + 1, fy1 - fy0 + 1), "", 0, True, [])
    print("wiatrak: stary zdjęty (%d kafli), nowa wieża (7,34); pole %dx%d przy (%d,%d)" % (len(cleared), fx1 - fx0 + 1, fy1 - fy0 + 1, fx0, fy0))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(m, lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "wiatrak_pole_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
