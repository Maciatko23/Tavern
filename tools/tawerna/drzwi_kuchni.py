# -*- coding: utf-8 -*-
"""Kuchnia tawerny dostaje prawdziwe wejście (2026-11-16): „Drzwi na zaplecze” za ladą (Map001 14,13) przenoszą do kuchni (14,9),
a z kuchni wychodzi się wycieraczką w dolnej ścianie (14,10) za ladę (14,14). Mapa edytowana na miejscu.
  python tools/tawerna/drzwi_kuchni.py      (edytor zamknięty)"""
import datetime, importlib.util, os, re, shutil, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
import pieczatki as PZ
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
C = lambda code, params: {"code": code, "indent": 0, "parameters": params}
COND = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False,
        "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}

def main():
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_drzwi_kuchni_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    rel = os.path.join(ROOT, "data", "Map001.json"); m, lay = RW.read_json("data/Map001.json"); shutil.copy2(rel, bak)
    up, _ = RW.read_json("data/Map025.json")
    W, H = m["width"], m["height"]
    d = np.array(m["data"], dtype=np.int64).reshape(6, H, W)
    u = np.array(up["data"], dtype=np.int64).reshape(6, up["height"], up["width"])
    ex = next(e for e in up["events"] if e and e["name"].startswith("Wyjście z pokoju") and e["y"] == 12)   # a room's way out: its doormat
    mat = int(u[1, ex["y"], ex["x"]])
    d[0, 10, 14] = d[0, 9, 14]; d[1, 10, 14] = mat; d[2:4, 10, 14] = 0; d[5, 10, 14] = 0
    PZ.przelicz_warstwe(d[0], {(x, y) for x in (13, 14, 15) for y in (9, 10, 11)})
    m["data"] = [int(v) for v in d.reshape(-1)]
    door = m["events"][46]
    assert door and door["name"] == "Drzwi na zaplecze" and (door["x"], door["y"]) == (14, 13), door and door["name"]
    pg = door["pages"][0]
    pg["trigger"] = 1; pg["priorityType"] = 1
    pg["list"] = [C(250, [{"name": "Door1", "volume": 70, "pitch": 100, "pan": 0}]), C(201, [0, 1, 14, 9, 8, 0]), C(0, [])]
    if not any(e and e["name"] == "Wyjście z kuchni" for e in m["events"]):
        out = {"conditions": dict(COND), "directionFix": True, "image": {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0},
               "list": [C(250, [{"name": "Door1", "volume": 70, "pitch": 100, "pan": 0}]), C(201, [0, 1, 14, 14, 2, 0]), C(0, [])], "moveFrequency": 3,
               "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3, "moveType": 0,
               "priorityType": 0, "stepAnime": False, "through": False, "trigger": 1, "walkAnime": False}
        m["events"].append({"id": len(m["events"]), "name": "Wyjście z kuchni", "note": "", "pages": [out], "x": 14, "y": 10})
    open(rel, "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano Map001 (mata %d); kopia: %s" % (mat, bak))

if __name__ == "__main__": main()
