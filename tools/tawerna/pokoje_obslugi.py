# -*- coding: utf-8 -*-
"""Pokój Borgara i izba służby na piętrze I (gracz 2026-11-16: „pokój na piętrze dla Borgara, ale też dla służby”).
Map025 edytowana na miejscu: Pokój 10 -> Pokój Borgara (księga rachunkowa na biurku), Pokój 9 -> Izba służby (obok łaźni).
Podróżni już ich nie dostają (Podroznicy_Data POKOJE), plan karczmy nazywa je po nowemu (plangeo rooms025).
  python tools/tawerna/pokoje_obslugi.py      (edytor zamknięty)"""
import datetime, importlib.util, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
C = lambda code, params: {"code": code, "indent": 0, "parameters": params}

def main():
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_pokoje_obslugi_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    rel = os.path.join(ROOT, "data", "Map025.json"); m, lay = RW.read_json("data/Map025.json"); shutil.copy2(rel, bak)
    for i, name in ((51, "Wejście -> Pokój Borgara"), (52, "Drzwi (wyjście): Pokój Borgara"), (49, "Wejście -> Izba służby"), (50, "Drzwi (wyjście): Izba służby")):
        assert re.search(r"Pokój (9|10)$", m["events"][i]["name"]) or "Borgara" in m["events"][i]["name"] or "służby" in m["events"][i]["name"], m["events"][i]["name"]
        m["events"][i]["name"] = name
    if not any(e and e["name"] == "Księga rachunkowa Borgara" for e in m["events"]):
        cond = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False,
                "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}
        pg = {"conditions": cond, "directionFix": True, "image": {"tileId": 0, "characterName": "", "direction": 2, "pattern": 1, "characterIndex": 0},
              "list": [C(101, ["", 0, 0, 2, ""]), C(401, ["Księga rachunkowa karczmy. Borgar liczy w niej każdy kufel,"]), C(401, ["każdy nocleg - i każdy dług."]), C(0, [])],
              "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3, "moveType": 0,
              "priorityType": 1, "stepAnime": False, "through": False, "trigger": 0, "walkAnime": False}
        m["events"].append({"id": len(m["events"]), "name": "Księga rachunkowa Borgara", "note": "", "pages": [pg], "x": 22, "y": 28})
    open(rel, "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano Map025; kopia:", bak)

if __name__ == "__main__": main()
