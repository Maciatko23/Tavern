# -*- coding: utf-8 -*-
"""Kantor Baltazara w nowym Kruczogrodzie (Map220) dostaje drugie, tylne drzwi (wątek W5: stukanie nocą, nocny tragarz):
  - w miejscu okiennicy (52,19-20) zwykła ściana i drzwi (zdarzenie z <Town:door=kantor>, polecenia starych tylnych drzwi -> zaplecze
    kantoru, Map103 (3,10));
  - drzwi frontowe (54,20) prowadzą do sali z ladą (Map103 (12,10)), a nie na zaplecze;
  - wyjścia Map103: frontowe przed drzwi frontowe (54,21), tylne przed tylne (52,21).
  python tools/nowy_swiat/kantor_drzwi.py [--wykonaj]      (zapis tylko przy zamkniętym edytorze; kopie w archiwum)"""
import copy, datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

BACK, FRONT = (52, 20), (54, 20)


def main():
    town, tl = RW.read_json("data/Map220.json"); old, _ = RW.read_json("data/Map008.json"); room, rl = RW.read_json("data/Map103.json")
    W, H = town["width"], town["height"]
    front = next(e for e in town["events"] if e and (e["x"], e["y"]) == FRONT and "<Town:door=kantor>" in (e.get("note") or ""))
    if any(e and (e["x"], e["y"]) == BACK for e in town["events"]): print("tylne drzwi już są"); return
    o_back, o_front = old["events"][94], old["events"][95]
    for x, y in ((52, 19), (52, 20)):                       # the shutter goes: plain wall
        for z in (2, 3): town["data"][(z * H + y) * W + x] = 0
    img = copy.deepcopy(front["pages"][0]["image"]); pr = front["pages"][0]["priorityType"]
    front["pages"] = copy.deepcopy(o_front["pages"])
    for p in front["pages"]: p["image"] = copy.deepcopy(img); p["priorityType"] = pr
    back = copy.deepcopy(front)
    back.update(id=len(town["events"]), name="Drzwi: Kantor (tylne)", x=BACK[0], y=BACK[1], pages=copy.deepcopy(o_back["pages"]))
    for p in back["pages"]: p["priorityType"] = pr
    town["events"].append(back)
    n = 0
    for e in room["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][1] == 220:
                    c["parameters"][2:4] = [BACK[0], BACK[1] + 1] if e["x"] < 8 else [FRONT[0], FRONT[1] + 1]; n += 1
    print("tylne drzwi: zdarzenie %d na %s; wyjść Map103 ustawionych: %d" % (back["id"], BACK, n))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "kantor_drzwi_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for name, m, lay in (("Map220.json", town, tl), ("Map103.json", room, rl)):
        rel = os.path.join(ROOT, "data", name); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie:", bak)


if __name__ == "__main__":
    main()
