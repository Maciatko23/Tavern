# -*- coding: utf-8 -*-
"""Szynk Mietka Kwaśniaka na nowym Podgrodziu (Map218). Gracz 2026-11-16: „daj ten dom szynkarza po prawej przy murze”, „może być
węższy o 2 kratki” - północno-wschodni róg osady, między lepianką rodziny a murem miasta.
  - stary szynk z placu przy drogowskazie (x12..20, y35..42) znika: kafle z kopii sprzed budowy, zdarzenia usunięte;
  - budynek z kafli starego Podgrodzia (Map111 x94..101, y39..44) BEZ dwóch gładkich kolumn (96 i 98): 6 kratek szerokości,
    Map218 x72..77, y19..24, drzwi (74,24); beczki przy murze (78, 23..26); szyld, dym, okienko w dachu, dwa stoły z ławami,
    latarnia, miejsca szynk_drzwi / szynk_lawy; wyjście z izby (Map201) przed drzwi.
  python tools/nowy_swiat/szynk.py [--wykonaj]      (zapis tylko przy zamkniętym edytorze; kopie w archiwum)"""
import copy, datetime, importlib.util, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

OLD_RECT = (12, 35, 20, 42); OLD_BAK = os.path.join(ARCH, "szynk_20261116_104954", "Map218.json")
COLS = [94, 95, 97, 99, 100, 101, 102]          # (102: the barrels)
X0, Y0, SY = 72, 19, 39                        # the building's left top; the source's top row
# the events: source id -> (x, y)
EVENTS = {219: (76, 19), 222: (73, 21), 223: (74, 24), 312: (76, 23), 313: (72, 27), 314: (76, 27), 382: (74, 28), 409: (74, 25), 440: (70, 27)}
NAMES = ("Drzwi: Szynk", "Szyld: Szynk", "Miejsce: szynk_lawy", "Miejsce: szynk_drzwi")


def main():
    old, _ = RW.read_json("data/Map111.json"); new, nl = RW.read_json("data/Map218.json"); room, rl = RW.read_json("data/Map201.json")
    W0, H0, W, H = old["width"], old["height"], new["width"], new["height"]
    # 1. the first szynk goes
    there = [e for e in new["events"] if e and OLD_RECT[0] - 2 <= e["x"] <= OLD_RECT[2] and OLD_RECT[1] <= e["y"] <= OLD_RECT[3] + 2 and
             (e["name"] in NAMES or e["name"].startswith(("Stół przed szynkiem", "Dym z komina", "Okienko w dachu", "Latarnia")))]
    if any(e["name"] == "Drzwi: Szynk" for e in there):
        before = json.load(open(OLD_BAK, encoding="utf-8"))
        for y in range(OLD_RECT[1], OLD_RECT[3] + 1):
            for x in range(OLD_RECT[0], OLD_RECT[2] + 1):
                for z in range(6): new["data"][(z * H + y) * W + x] = before["data"][(z * H + y) * W + x]
        for e in there: new["events"][e["id"]] = None
        while new["events"] and new["events"][-1] is None and len(new["events"]) > 1: new["events"].pop()
        print("stary szynk usunięty: zdarzeń %d" % len(there))
    if any(e and e["name"] == "Drzwi: Szynk" for e in new["events"]): print("szynk już stoi w nowym miejscu"); return
    # 2. the narrower building by the town's wall
    built = set()
    for y in range(SY, SY + 8):
        for i, x in enumerate(COLS):
            t = [old["data"][(z * H0 + y) * W0 + x] for z in range(6)]
            wall = t[0] >= 4352
            if not wall and not (t[2] in (323, 324, 331, 332)): continue      # (walls, roof; of the things beside it only the barrels)
            nx, ny = X0 + i, Y0 + y - SY; built.add((nx, ny))
            if wall:
                for z in (0, 1, 2, 3, 5): new["data"][(z * H + ny) * W + nx] = t[z]
            else:
                for z in (2, 3): new["data"][(z * H + ny) * W + nx] = t[z]
    # the roof's and the wall's right edge follow the columns (94 the left edge, 101 the right one: as they were)
    taken = [(e["id"], e["name"]) for e in new["events"] if e and (e["x"], e["y"]) in built]
    assert not taken, taken
    for i, (x, y) in EVENTS.items():
        c = copy.deepcopy(old["events"][i]); c.update(id=len(new["events"]), x=x, y=y)
        new["events"].append(c)
    door = EVENTS[223]
    k = 0
    for e in room["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][1] in (111, 218): c["parameters"][1:5] = [218, door[0], door[1] + 1, 2]; k += 1
    print("kafli: %d, zdarzeń: %d, wyjść izby: %d, drzwi %s" % (len(built), len(EVENTS), k, door))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "szynk_mur_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for name, m, lay in (("Map218.json", new, nl), ("Map201.json", room, rl)):
        rel = os.path.join(ROOT, "data", name); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie:", bak)


if __name__ == "__main__":
    main()
