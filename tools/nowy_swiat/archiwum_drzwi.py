# -*- coding: utf-8 -*-
"""Archiwum zakonu (Map119) dostaje wejście w nowym świecie, 2026-11-17. Jego jedyne drzwi były na starej Map008 (ogród rycerzy,
usunięty ze starym światem). Decyzja wątku W2 (docs/NOWY_SWIAT/SPIS_WATKI.md): „Archiwum = pierwsza komora lochów (z pieczęciami
zakonu)” - więc drzwi stoją w Ruinach Zamku pod tawerną (Map010, pierwsza sala za starą kratą w piwnicy), w murze obok płaskorzeźby
kruka „KTO SCHODZI, TEN PYTA” (9,6); otwiera je ta sama krata co lochy (przełącznik 11 „Podziemia_Zejscie”, W4). Schody archiwum
(zdarzenie 2) prowadzą z powrotem przed te drzwi (9,7). W drzewku edytora Archiwum idzie pod Ruiny Zamku (MapInfos.json).
Mapy edytowane na miejscu (dopisane drzwi, przestawione schody), kopia w ..\\Tawerna_archiwum_2026-11-08\\archiwum_drzwi_<czas>,
nowa wersja projektu (System.json versionId).
  python tools/nowy_swiat/archiwum_drzwi.py             próba (nic nie zapisuje)
  python tools/nowy_swiat/archiwum_drzwi.py --wykonaj   zapis (edytor zamknięty)"""
import datetime, importlib.util, json, os, random, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

RUINS, ARCHIVE = 10, 119
DOOR = (9, 6)            # in the ruins' north wall, left of the raven relief (10,6)
FRONT = (9, 7)           # the floor in front of it (the archive's stairs lead here)
LANDING = (2, 4, 2)      # in the archive: "Miejsce: schody", below its stairs
DOOR_NAME = "Drzwi -> Archiwum zakonu"
BLANK = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
         "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}


def cmd(code, params, indent=0): return {"code": code, "indent": indent, "parameters": params}


def door_event(eid):
    # an oak door in a stone arch (Winlu's !Fantasy_door3, its third: closed facing down, opening through left - right - up)
    img = {"tileId": 0, "characterName": "!Fantasy_door3", "direction": 2, "pattern": 0, "characterIndex": 2}
    route = [{"code": 37, "parameters": []}, {"code": 17, "parameters": []}, {"code": 15, "parameters": [3]}, {"code": 18, "parameters": []},
             {"code": 15, "parameters": [3]}, {"code": 19, "parameters": []}, {"code": 15, "parameters": [3]}, {"code": 0, "parameters": []}]
    lst = [cmd(250, [{"name": "Open1", "volume": 80, "pitch": 90, "pan": 0}]),
           cmd(205, [0, {"list": route, "repeat": False, "skippable": False, "wait": True}])]
    lst += [cmd(505, [r]) for r in route[:-1]]
    lst += [cmd(201, [0, ARCHIVE, LANDING[0], LANDING[1], LANDING[2], 0]), cmd(0, [])]
    page = {"conditions": dict(BLANK), "directionFix": False, "image": img, "list": lst, "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": 1, "stepAnime": False, "through": False, "trigger": 1, "walkAnime": False}
    return {"id": eid, "name": DOOR_NAME, "note": "", "pages": [page], "x": DOOR[0], "y": DOOR[1]}


def main():
    do = "--wykonaj" in sys.argv
    if do: RW.need_editor_closed()
    ruins, lay10 = RW.read_json("data/Map%03d.json" % RUINS)
    arch, lay119 = RW.read_json("data/Map%03d.json" % ARCHIVE)
    infos, layI = RW.read_json("data/MapInfos.json")
    if any(e and e["name"] == DOOR_NAME for e in ruins["events"]):
        print("Map%03d ma już drzwi do Archiwum - nic do zrobienia." % RUINS); return
    if any(e and e["x"] == DOOR[0] and e["y"] == DOOR[1] for e in ruins["events"]):
        raise SystemExit("STOP: na (%d,%d) w Map%03d stoi już zdarzenie" % (DOOR + (RUINS,)))
    ruins["events"].append(door_event(len(ruins["events"])))
    n = 0
    for e in arch["events"]:
        if not e: continue
        here = 0
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 8:
                    c["parameters"][1:5] = [RUINS, FRONT[0], FRONT[1], 2]; here += 1
        if here: e["name"] = "Schody -> Ruiny Zamku"
        if e["name"] == "Schody do ogrodu rycerzy": e["name"] = "Schody do Ruin Zamku"
        n += here
    old_parent = infos[ARCHIVE]["parentId"]
    infos[ARCHIVE]["parentId"] = RUINS
    print("  Map%03d +%d %s (%d,%d) -> Map%03d (%d,%d)" % (RUINS, len(ruins["events"]) - 1, DOOR_NAME, DOOR[0], DOOR[1], ARCHIVE, LANDING[0], LANDING[1]))
    print("  Map%03d: schody na Map008 -> Map%03d (%d,%d): %d" % (ARCHIVE, RUINS, FRONT[0], FRONT[1], n))
    print("  MapInfos: Archiwum zakonu pod Map%03d (było %d)" % (RUINS, old_parent))
    texts = {"Map%03d.json" % RUINS: RW.json_text(ruins, lay10), "Map%03d.json" % ARCHIVE: RW.json_text(arch, lay119), "MapInfos.json": RW.json_text(infos, layI)}
    for t in texts.values(): json.loads(t.decode("utf-8"))   # (read back before anything is written)
    if not do: print("(próba - dopisz --wykonaj)"); return
    bak = os.path.join(ARCH, "archiwum_drzwi_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for f in list(texts) + ["System.json"]: shutil.copy2(os.path.join(ROOT, "data", f), bak)
    for f, t in texts.items():
        with open(os.path.join(ROOT, "data", f), "wb") as fh: fh.write(t)
    sp = os.path.join(ROOT, "data", "System.json"); s = open(sp, "rb").read()
    s2 = re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(random.randint(10000000, 99999999)).encode(), s, count=1)
    json.loads(s2.decode("utf-8"))
    with open(sp, "wb") as fh: fh.write(s2)
    print("Zapisane. Kopia: %s" % bak)


if __name__ == "__main__": main()
