# -*- coding: utf-8 -*-
"""Po ręcznych poprawkach gracza na Przystani (Map219), 2026-11-13 (jego wybory):
  1. Map219: usunąć 2 sosny wyrastające ze skalnej ściany na południu (zdarzenia 60 i 63, kratki 47,75 i 69,75).
  2. Map219: zamknięte wejście do jaskini, którą gracz zrobił na płd.-zach. (otwór 17,69-70): zdarzenie na kratce otworu, popup.
  3. Map218 (Podgrodzie, gracz go nie poprawiał): zachodnie kolumny dopasowane do wschodniej krawędzi Przystani (szew A):
     - północ wiersze 0-6 i południe 70-79: kafle kolumny x=79 Przystani w kolumnach 0..9 Podgrodzia (gór nie da się ciągnąć dalej
       bez przebudowy całego pasma: od x=10 zostaje dawny układ),
     - wiersze 7-23, 51-57, 66-72: skalna stopa na x=0..3 -> trawa (Przystań ma tam otwartą trawę),
     - wiersz 65 (brzeg koryta): x=0..2 jak na Przystani.
  python tools/nowy_swiat/szew_A_jaskinia.py [--wykonaj]   (zapis TYLKO przy zamkniętym edytorze; kopie w archiwum)"""
import copy, datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

GRASS = 2816                      # A2 kind 16, the full middle shape
CAVE_X, CAVE_Y = 17, 70
CAVE_TEXT = "Wejście do jaskini zawalone kamieniami. Może kiedyś da się je odgruzować."


def idx(m, z, x, y): return (z * m["height"] + y) * m["width"] + x


def fix_219(m, log):
    for i, e in enumerate(m["events"]):
        if e and e["id"] in (60, 63) and (e["x"], e["y"]) in ((47, 75), (69, 75)) and e["pages"][0]["image"]["characterName"].startswith("!$Pine"):
            m["events"][i] = None; log.append("  Map219: usunięta sosna %d (%d,%d)" % (e["id"], e["x"], e["y"]))
    if any(e and e["name"] == "Jaskinia: wejście" for e in m["events"]): log.append("  Map219: wejście do jaskini już jest"); return
    door = next(e for e in m["events"] if e and e["note"].startswith("<Town:door="))
    e = copy.deepcopy(door)
    e["name"] = "Jaskinia: wejście"; e["note"] = "<Town:door=jaskinia_przystan>"; e["x"] = CAVE_X; e["y"] = CAVE_Y
    for c in e["pages"][0]["list"]:
        if c["code"] == 355: c["parameters"][0] = c["parameters"][0].split("Tawerna.popup(")[0] + "Tawerna.popup(" + \
                '"' + CAVE_TEXT + '", ' + c["parameters"][0].split("Tawerna.popup(", 1)[1].split('", ', 1)[1]
    nid = max(ev["id"] for ev in m["events"] if ev) + 1
    if nid >= 500: raise SystemExit("STOP: numer zdarzenia >= 500")
    while len(m["events"]) <= nid: m["events"].append(None)
    e["id"] = nid; m["events"][nid] = e
    log.append("  Map219: zamknięte wejście do jaskini (%d,%d) -> zdarzenie %d" % (CAVE_X, CAVE_Y, nid))


def fix_218(p, w, log):
    n = 0
    def put(x, y, src_y, layers=range(6)):
        nonlocal n
        for z in layers:
            v = w["data"][idx(w, z, 79, src_y)]
            if p["data"][idx(p, z, x, y)] != v: p["data"][idx(p, z, x, y)] = v; n += 1
    for x in range(0, 10):
        for y in list(range(0, 7)) + list(range(73, 80)): put(x, y, y)   # (rows 70-72 hold the herbalist's hut and yard)
    for (a, b) in ((7, 23), (51, 57), (66, 72)):
        for y in range(a, b + 1):
            for x in range(0, 4):
                if 1536 <= p["data"][idx(p, 0, x, y)] < 1664 or p["data"][idx(p, 0, x, y)] == 0:   # (only the rock foot)
                    for z in range(1, 4): p["data"][idx(p, z, x, y)] = 0
                    p["data"][idx(p, 0, x, y)] = GRASS; p["data"][idx(p, 5, x, y)] = 0; n += 1
    for x in range(0, 3): put(x, 65, 65)
    # trees / things left standing on a cell that is rock now: away
    flags = RW.read_json("data/Tilesets.json")[0][11]["flags"]
    for i, e in enumerate(p["events"]):
        if e and e["x"] <= 10 and (e["y"] <= 7 or e["y"] >= 69):
            t = p["data"][idx(p, 0, e["x"], e["y"])]
            if 1536 <= t < 1664 and (flags[t] & 0x0f) == 0x0f and e["pages"][0]["image"]["characterName"].startswith("!$"):
                log.append("  Map218: usunięte „%s” ze skały (%d,%d)" % (e["name"], e["x"], e["y"])); p["events"][i] = None
    log.append("  Map218: zmienionych kafli %d" % n)


def main():
    log = []
    w, lw = RW.read_json("data/Map219.json")
    p, lp = RW.read_json("data/Map218.json")
    fix_219(w, log)
    fix_218(p, w, log)
    for l in log: print(l)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "szew_A_jaskinia_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for rel, o, lay in (("data/Map219.json", w, lw), ("data/Map218.json", p, lp)):
        shutil.copy2(os.path.join(ROOT, rel), os.path.join(bak, os.path.basename(rel)))
        open(os.path.join(ROOT, rel), "wb").write(RW.json_text(o, lay))
    print("Zapisano; kopie: " + bak)


if __name__ == "__main__":
    main()
