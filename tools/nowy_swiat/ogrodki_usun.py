# -*- coding: utf-8 -*-
"""Podgrodzie (Map218), 2026-11-13 (gracz, wybór „1”): ogródki przy krawędzi wzgórza / skarpy / gór, dla których nie ma miejsca za chatą,
usunięte - kramarz, rybaczka, węglarz, kłusownik, garbarnia: płot zdjęty, ziemia -> trawa, region 7 zdjęty, zdarzenie „Ogródek: ...” usunięte.
  python tools/nowy_swiat/ogrodki_usun.py [--wykonaj]"""
import datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

OWNERS = {"kramarz", "rybaczka", "weglarz", "klusownik", "garbarz"}
GRASS, EARTH, FENCE = 2048 + 16 * 48, 24, 22


def main():
    m, lay = RW.read_json("data/Map218.json")
    W, H = m["width"], m["height"]
    at = lambda z, x, y: m["data"][(z * H + y) * W + x]
    def put(z, x, y, v): m["data"][(z * H + y) * W + x] = v
    kind = lambda t: (t - 2048) // 48 if 2048 <= t < 8192 else -1
    changed = set()
    for i, e in enumerate(m["events"]):
        if not e: continue
        mm = re.search(r"<Ogrodek:(\d+),(\d+),(\w+)", e["note"] or "")
        if not mm or mm[3] not in OWNERS: continue
        w, h = int(mm[1]), int(mm[2])
        for x in range(e["x"] - 1, e["x"] + w + 1):
            for y in range(e["y"] - 1, e["y"] + h + 1):
                if kind(at(1, x, y)) == FENCE: put(1, x, y, 0)
                if at(5, x, y) == 7: put(5, x, y, 0)
                if kind(at(0, x, y)) == EARTH: put(0, x, y, GRASS)
                changed.add((x, y))
        print("  usunięty: %s (%d,%d %dx%d)" % (e["name"], e["x"], e["y"], w, h))
        m["events"][i] = None
    RW.reshape(m, 0, RW.ring(changed, 1)); RW.reshape(m, 1, RW.ring(changed, 1))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "ogrodki_usun_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
