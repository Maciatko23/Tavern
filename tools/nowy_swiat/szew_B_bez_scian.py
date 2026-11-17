# -*- coding: utf-8 -*-
"""Szew Podgrodzie | Miasteczko (2026-11-13, gracz przerobił wschodni brzeg Podgrodzia: „żeby bocznych ścian nie było przy przejściu do
miasteczka”): Miasteczko (Map220) dostosowane do niego -
  - skalna ściana przy zachodnim brzegu (x 0..3, wiersze 7..37 i 53..72; góry 0-6 i 73-79 zostają) -> trawa, jak po stronie Podgrodzia;
  - droga: na samym brzegu taka jak w Podgrodziu (ziemia tylko w wierszu 38), dalej łagodnie rozszerza się do drogi Miasteczka (38..44);
  - cienie po zdjętych skałach (warstwa cieni) zdjęte - też ten jeden po stronie Podgrodzia (x 76..79, wiersze 36..42);
  - murek z desek na kamieniach (gracz: „mur niewielki z drewna między przejściami”, z palety wybrał nr 3 = A4 rodzaj 84 zestawu 11)
    w skrajnej kolumnie OBU map (Podgrodzie x 79, Miasteczko x 0; warstwa 0, region 2) - widać go z każdej strony, nie ma
    niewidzialnej ściany; od gór (wiersz 7) do baszty, i spod koryta (54) do gór (72); koryto (46..53) nietknięte;
  - brama („jeszcze brama wejściowa do tego”): przy drodze dwie baszty z tych samych kafelków - dach z gontu (A3 66, 2 rzędy) nad
    ścianą z desek na kamieniach (3 rzędy), po 2 kolumny na każdej mapie (razem 4 przez szew): północna 31..35, południowa 41..45
    (stoi na skarpie), przejazd 36..40.
  python tools/nowy_swiat/szew_B_bez_scian.py [--podglad=<katalog>] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

GRASS, EARTH = 2048 + 16 * 48, 2048 + 17 * 48
A5G = {1612, 1613, 1614, 1615, 1620, 1621, 1622, 1623, 1633, 1638}
WALL = 2048 + 84 * 48          # A4 planks on a stone footing (tileset 11) - the player's pick from the palette
ROOF = 2048 + 66 * 48          # A3 dark wooden shingles
GATE, BED = (36, 40), (46, 53)  # the road's way through, the bank + riverbed (left alone)
TOWERS = (((31, 32), (33, 35)), ((41, 42), (43, 45)))   # (roof rows, wall rows) of the north and the south tower


def main():
    T, lt = RW.read_json("data/Map220.json")
    P, lp = RW.read_json("data/Map218.json")
    W, H = 80, 80
    at = lambda m, z, x, y: m["data"][(z * H + y) * W + x]
    def put(m, z, x, y, v): m["data"][(z * H + y) * W + x] = v
    rock = lambda m, x, y: 1536 <= at(m, 0, x, y) < 1664 and at(m, 0, x, y) not in A5G
    changed = set()
    # 1. the rock wall at the west edge
    for y in list(range(7, 38)) + list(range(53, 73)):
        for x in range(0, 6):
            if not rock(T, x, y): continue
            put(T, 0, x, y, GRASS)
            for z in (1, 2, 3, 4): put(T, z, x, y, 0)
            if at(T, 5, x, y) == 2: put(T, 5, x, y, 0)
            changed.add((x, y))
    # (row 45 over the riverbank: Podgrodzie has the plateau's grass there - the town's leftover rock -> the same grass)
    for x in range(0, 4):
        if rock(T, x, 45): put(T, 0, x, 45, 1633); put(T, 4, x, 45, 0); changed.add((x, 45))
    # 2. the road: at the edge as in Podgrodzie, widening eastwards
    for x in range(0, 4):
        for y in range(36, 45):
            want_earth = (y == 38) or (38 <= y <= 38 + x)
            if 36 <= y <= 37: want_earth = False
            t = at(T, 0, x, y)
            if t >= 4352 or rock(T, x, y): continue
            put(T, 0, x, y, EARTH if want_earth else GRASS); changed.add((x, y))
    for x in range(0, 4):
        for y in range(36, 46): put(T, 4, x, y, 0)
    RW.reshape(T, 0, RW.ring(changed, 1))
    # 3. the leftover shadow on Podgrodzie's side
    n = 0
    for x in range(76, 80):
        for y in range(36, 43):
            if at(P, 4, x, y): put(P, 4, x, y, 0); n += 1
    print("Miasteczko: zachodni brzeg - %d kratek skały/drogi zmienionych; Podgrodzie: %d cieni zdjętych" % (len(changed), n))
    # 4. the low wall in the edge column of both maps + the gate's two towers
    for (m, x, x2, name) in ((P, 79, 78, "Podgrodzie"), (T, 0, 1, "Miasteczko")):
        line = [(x, y) for y in range(7, 73) if not (TOWERS[0][0][0] <= y <= TOWERS[1][1][1]) and not (BED[0] <= y <= BED[1])]
        roofs = [(c, y) for (rr, wr) in TOWERS for y in range(rr[0], rr[1] + 1) for c in (x, x2)]
        walls = line + [(c, y) for (rr, wr) in TOWERS for y in range(wr[0], wr[1] + 1) for c in (x, x2)]
        cells = walls + roofs
        bad = [c for c in cells if not (at(m, 0, *c) in A5G or 2048 <= at(m, 0, *c) < 4352)]
        if bad: raise SystemExit("STOP: %s - pod murkiem nie trawa/ziemia: %s" % (name, bad))
        drop = [e for e in m["events"] if e and (e["x"], e["y"]) in set(cells)]
        if drop: raise SystemExit("STOP: %s - zdarzenia na murku: %s" % (name, [(e["id"], e["name"], e["x"], e["y"]) for e in drop]))
        for c in cells:
            put(m, 0, c[0], c[1], WALL if c in walls else ROOF)
            for z in (1, 2, 3, 4): put(m, z, c[0], c[1], 0)
            if at(m, 5, *c) in (0, 31): put(m, 5, c[0], c[1], 2)
        RW.reshape(m, 0, walls)                                   # A4 top: floor shapes (off the map = the same: it goes on)
        for (cx, cy) in line:                                     # the low wall runs into a tower's roof without its stone foot
            def same_l(dx, dy, cx=cx, cy=cy):
                nx, ny = cx + dx, cy + dy
                return not (0 <= nx < W and 0 <= ny < H) or (nx, ny) in walls or (nx, ny) in roofs
            put(m, 0, cx, cy, WALL + RW.N.floor_shape(same_l))
        for (cx, cy) in roofs:                                    # A3 roof: wall shapes
            def same(dx, dy, cx=cx, cy=cy):
                nx, ny = cx + dx, cy + dy
                if not (0 <= nx < W and 0 <= ny < H): return True
                return 2048 <= at(m, 0, nx, ny) < 8192 and (at(m, 0, nx, ny) - 2048) // 48 == 66
            put(m, 0, cx, cy, ROOF + RW.N.wall_shape(same))
        print("%s: murek x %d (%d kratek), baszty bramy %d kratek, przejazd %d..%d, koryto %d..%d wolne"
              % (name, x, len(line), len(cells) - len(line), GATE[0], GATE[1], BED[0], BED[1]))
    for a in sys.argv:
        if a.startswith("--podglad="):
            d = a.split("=", 1)[1]
            open(os.path.join(d, "Map220.json"), "wb").write(RW.json_text(T, lt)); open(os.path.join(d, "Map218.json"), "wb").write(RW.json_text(P, lp))
            print("  podgląd: " + d)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "szew_B_bez_scian_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for rel, m, lay in (("data/Map220.json", T, lt), ("data/Map218.json", P, lp)):
        shutil.copy2(os.path.join(ROOT, rel), bak)
        open(os.path.join(ROOT, rel), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopie: " + bak)


if __name__ == "__main__":
    main()
