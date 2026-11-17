# -*- coding: utf-8 -*-
"""„Chata pod lasem” (dom na sprzedaż u sołtysa, Homes.js) w nowym świecie: na łące pod sosnami Słonego Brzegu (Map219).
  - budynek z kafli (bale, strzecha, komin, drewutnia, beczka) przeniesiony 1:1 ze starego Podgrodzia (Map111 x23..30, y109..113)
    na Map219 x63..70, y28..32 (drzwi (66,32)), razem z dymem z komina i drzwiami;
  - ziemia pod zabudowę wokół chaty: region 8 (x58..77, y25..39, tylko tam, gdzie nie było regionu), notatka mapy <BuildRegion:8>;
  - wyjście z izby (Map154) prowadzi przed drzwi na Map219.
  python tools/nowy_swiat/chata_pod_lasem.py [--wykonaj]      (zapis tylko przy zamkniętym edytorze; kopie w archiwum)"""
import copy, datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

SRC = (23, 109, 30, 113); DX, DY = 40, -81
LAND = (58, 25, 77, 39)


def main():
    old, _ = RW.read_json("data/Map111.json"); new, nl = RW.read_json("data/Map219.json"); room, rl = RW.read_json("data/Map154.json")
    W0, H0, W, H = old["width"], old["height"], new["width"], new["height"]
    if any(e and "Chata pod lasem" in e["name"] for e in new["events"]): print("chata już stoi"); return
    built = set()
    for y in range(SRC[1], SRC[3] + 1):
        for x in range(SRC[0], SRC[2] + 1):
            t = [old["data"][(z * H0 + y) * W0 + x] for z in range(6)]
            wall = t[0] >= 4352
            if not wall and not any(t[1:4]): continue
            nx, ny = x + DX, y + DY; built.add((nx, ny))
            for z in range(6):
                if z == 0 and not wall: continue          # (the lean-to and the barrel stand on the meadow's own ground)
                if z == 4: continue
                new["data"][(z * H + ny) * W + nx] = t[z]
    # what lay there goes (ground things under the walls and before the door)
    door = (26 + DX, 113 + DY)
    gone = [e["id"] for e in new["events"] if e and ((e["x"], e["y"]) in built or (e["x"], e["y"]) == (door[0], door[1] + 1))]
    for i in gone: new["events"][i] = None
    for e in old["events"]:
        if e and SRC[0] <= e["x"] <= SRC[2] and SRC[1] <= e["y"] <= SRC[3]:
            c = copy.deepcopy(e); c.update(id=len(new["events"]), x=e["x"] + DX, y=e["y"] + DY)
            if "Chata pod lasem" in c["name"]: c["name"] = "Drzwi: Chata pod lasem"; c["note"] = "<Town:door=chata>"
            new["events"].append(c)
    n8 = 0
    for y in range(LAND[1], LAND[3] + 1):
        for x in range(LAND[0], LAND[2] + 1):
            i = (5 * H + y) * W + x
            if new["data"][i] == 0 and (x, y) not in built: new["data"][i] = 8; n8 += 1
    if "<BuildRegion:8>" not in new["note"]: new["note"] = new["note"].rstrip("\n") + "\n<BuildRegion:8>"
    k = 0
    for e in room["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][1] == 111: c["parameters"][1:5] = [219, door[0], door[1] + 1, 2]; k += 1
        e["name"] = e["name"].replace("-> Podgrodzie", "-> Słony Brzeg")
    print("kafli budynku: %d, usuniętych drobiazgów: %d, ziemi (region 8): %d, wyjść izby: %d, drzwi %s" % (len(built), len(gone), n8, k, door))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "chata_pod_lasem_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for name, m, lay in (("Map219.json", new, nl), ("Map154.json", room, rl)):
        rel = os.path.join(ROOT, "data", name); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie:", bak)


if __name__ == "__main__":
    main()
