# -*- coding: utf-8 -*-
"""Jeden cały wrak na Słonym Brzegu (gracz 2026-11-14: „zamiast tych rozwalonych kilku części wrak - jeden wielki, tylko że trochę
rozwalony i oczywiście z dziurą; ładny, szczegółowy, pasujący, profesjonalny, nie pikseloza”): trzy części „Pomyślności” (dziób,
śródokręcie, rufa) i ich piaski znikają, w ich miejsce staje JEDEN statek - obrazek !$1_Wrak_Caly (PixelLab, 782x336, 1:1 z kaflami:
drobny rysunek, bez powiększania) z maską cienia !$1_Wrak_Caly_Cien. Dziura w burcie = wejście do ładowni (drzwi i punkt idą pod nią),
punkty mieszkańców (dziób, rufa, burta) stają przy nowym kadłubie, stopa kadłuba zamknięta regionem 2.
  python tools/wrak_duzy/caly.py [--podglad plik.json] [--wykonaj]"""
import copy, datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

REL = "data/Map219.json"
PIC, PW = "!$1_Wrak_Caly", 782
HOLE_DX = 1                                     # the hole: one cell right of the picture's middle


def main():
    m, lay = RW.read_json(REL)
    W, H, d = m["width"], m["height"], m["data"]
    ev = m["events"]
    old = [e for e in ev if e and e["pages"][0]["image"]["characterName"].startswith("!$1_Wrak_") and "_Duzy" in e["pages"][0]["image"]["characterName"]]
    hulls = [e for e in old if "Grunt" not in e["pages"][0]["image"]["characterName"]]
    if len(hulls) != 3: raise SystemExit("STOP: nie ma trzech części wraku na Map219 (jest %d) - nic nie ruszam" % len(hulls))
    mid = sorted(hulls, key=lambda e: e["x"])[1]
    cx, cy = mid["x"], max(e["y"] for e in hulls)
    half = PW // 96                              # cells each side of the middle one covered by the hull
    x0, x1 = cx - half, cx + half
    ship = copy.deepcopy(mid)
    ship.update(name="Wrak „Pomyślność”", note="<Cienie:maska>", x=cx, y=cy)
    ship["pages"][0]["image"]["characterName"] = PIC
    for e in old: ev[e["id"]] = None
    ship["id"] = mid["id"]; ev[mid["id"]] = ship
    # the hull's foot closed (three rows: nobody stands inside the planks; further up one walks behind it)
    n = 0
    for y in (cy - 2, cy - 1, cy):
        for x in range(x0 + (1 if y < cy else 0), x1 + 1):
            if d[(5 * H + y) * W + x] in (0, 1, 31): d[(5 * H + y) * W + x] = 2; n += 1
    taken = {(e["x"], e["y"]) for e in ev if e}
    def move(name, x, y, facing=None):
        e = next((e for e in ev if e and e["name"] == name), None)
        if not e: print("  (brak: %s)" % name); return
        while (x, y) in taken - {(e["x"], e["y"])} or d[(5 * H + y) * W + x] == 2: y += 1
        taken.discard((e["x"], e["y"])); taken.add((x, y))
        print("  %s (%d,%d) -> (%d,%d)" % (name, e["x"], e["y"], x, y))
        e["x"], e["y"] = x, y
        if facing: e["pages"][0]["image"]["direction"] = facing
    door = next((e for e in ev if e and "<Town:door=wrak_ladownia>" in e["note"]), None)
    if door:
        taken.discard((door["x"], door["y"]))
        print("  %s (%d,%d) -> (%d,%d)" % (door["name"], door["x"], door["y"], cx + HOLE_DX, cy))
        door["x"], door["y"] = cx + HOLE_DX, cy; taken.add((door["x"], door["y"]))
    move("Miejsce: wrak_ladownia", cx + HOLE_DX, cy + 1, 8)
    move("Miejsce: wrak_dziob", x0 - 1, cy + 1, 6)
    move("Miejsce: wrak_rufa", x1 + 1, cy + 1, 4)
    move("Miejsce: wrak_burta", cx - 3, cy + 1, 8)
    move("Miejsce: wrak", cx - 1, cy + 2, 8)
    # things that stood where the hull now stands: off to the sand before it
    for e in ev:
        if e and e is not ship and e is not door and x0 <= e["x"] <= x1 and cy - 2 <= e["y"] <= cy and not e["name"].startswith("Miejsce:"):
            ox, oy = e["x"], e["y"]; y = cy + 1
            while (ox, y) in taken: y += 1
            taken.discard((ox, oy)); taken.add((ox, y)); e["y"] = y
            print("  spod kadłuba: %s (%d,%d) -> (%d,%d)" % (e["name"], ox, oy, ox, y))
    print("Wrak: jeden statek w (%d,%d), kadłub x %d..%d, zamknięte pola: %d, zdjęte zdarzenia: %d" % (cx, cy, x0, x1, n, len(old) - 1))
    raw = RW.json_text(m, lay)
    if "--podglad" in sys.argv:
        open(sys.argv[sys.argv.index("--podglad") + 1], "wb").write(raw); return
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "wrak_caly_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    sp = os.path.join(ROOT, "data", "System.json")
    shutil.copy2(os.path.join(ROOT, REL), bak); shutil.copy2(sp, bak)
    open(os.path.join(ROOT, REL), "wb").write(raw)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie: %s" % bak)


if __name__ == "__main__":
    main()
