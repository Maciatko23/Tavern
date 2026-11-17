# -*- coding: utf-8 -*-
"""Miasteczko (Map220), 2026-11-13 (gracz, zrzut z edytora: „tutaj ogródki usuń, a budynki daj wyżej o 3 kratki - budynki 1, 2, 3, 4
i 5 (tawerna)”):
  - ogródki za domami Walentego, Doroty i wdowy (wiersze 28..31) usunięte;
  - lewy rząd (ścieżka przy baszcie, domy 1-3, kuźnia z daszkiem, piec kowalski, kowadło, punkty mieszkańców) - pas x 2..36,
    wiersze 32..39 - o 3 kratki w górę; zwolnione wiersze 37..39 -> ubita ziemia drogi;
  - tawerna z gankiem i podestem (x 37..59, wiersze 27..38) o 3 kratki w górę (dach od wiersza 24, za nią ulica 21..23 przed
    ratuszem); szyld, latarnie, tablica zleceń i punkty przed nią też; bruk placu sięga teraz pod podest (wiersze 36..45),
    latarnie z rogów placu na rogi tawerny (x 36 i 60, wiersz 36);
  - („studnię daj bardziej na środku, a te kramy może ciut wyżej”, potem „studnia o jeden w górę”) studnia o 2 rzędy wyżej -
    wiersze 38..41 - z kolejką i latarnią przy niej; kramy z punktami sprzedawców o 5 rzędów wyżej (gracz po podglądach: „o rząd”, „o 3”,
    „jeszcze o 1”), stoją w wierszu 38, na górnych rogach placu pod tawerną.
  - wejście (gracz: „tawerna ma wejście brzydkie i deski okna zakrywają”): zamiast daszku z desek (A3 64) nad drzwiami - otwarty
    drewniany ganek z palety B: belka z zastrzałami (B 160 / 161 / 162) nad drzwiami i dwa słupy (B 168 / 170) do podestu, x 46..50;
    ściana pod daszkiem z powrotem szachulec + bale, okna 1. piętra nad drzwiami całe; podest x 46..50; krzywe drzwi z desek
    (!Fantasy_door1 nr 2) -> mocne drzwi z okuciami (nr 3).
  python tools/nowy_swiat/rzad_wyzej.py [--podglad=<katalog>] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
N = RW.N

W = H = 80
DY = -3
GRASS, EARTH, FENCE, COBBLE = 16, 17, 22, 40
CROPS = set(range(277, 280)) | set(range(285, 288))
LEFT = (2, 36, range(32, 40))           # x0, x1, rows
TAVERN = (37, 59, range(27, 39))
LAMPS = {254: ((37, 39), (36, 36)), 261: ((59, 39), (60, 36))}
WELL_TILES = (432, 433, 440, 441, 448, 449, 456, 457)     # 2 x 4 at x 48..49, rows 40..43 -> 38..41
SQUARE_UP = {91: (48, 43), 92: (49, 43), 97: (47, 43), 98: (47, 42), 104: (47, 43), 105: (46, 42), 106: (45, 43), 107: (44, 42),
             260: (51, 43)}                                                                # two rows up: well, queue, its lamp
STALLS = {93: (38, 43), 94: (58, 43), 102: (38, 42), 103: (58, 42)}                     # five rows up: stalls + sellers' spots
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def main():
    m, lay = RW.read_json("data/Map220.json")
    d = m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    old = list(d)
    oat = lambda z, x, y: old[(z * H + y) * W + x]
    if kind(oat(0, 37, 27)) != 67 or kind(oat(0, 59, 37)) != 72 or kind(oat(0, 3, 35)) is None or not (4352 <= oat(0, 3, 35) < 8192):
        raise SystemExit("STOP: Map220 - tawerna / dom Walentego nie tam, gdzie były")
    ev = {e["id"]: e for e in m["events"] if e}
    for eid, (o, n) in LAMPS.items():
        if (ev[eid]["x"], ev[eid]["y"]) != o: raise SystemExit("STOP: latarnia %d nie na %s" % (eid, o))
    changed = set()
    # ---- 1. the gardens behind the houses go (rows 28..31; rows 29..31 are covered by the houses moving up)
    n_g = 0
    for y in range(28, 32):
        for x in range(LEFT[0], 28):
            if kind(at(1, x, y)) == FENCE or at(2, x, y) in CROPS:
                put(1, x, y, 0); put(2, x, y, 0); put(3, x, y, 0); n_g += 1
                if kind(at(0, x, y)) == EARTH: put(0, x, y, 2048 + GRASS * 48)
                changed.add((x, y))
    # ---- 2. the left row and the tavern 3 rows up
    def lift(x0, x1, rows, fill_kind, fill_region):
        for y in rows:
            for x in range(x0, x1 + 1):
                for z in range(6): put(z, x, y + DY, oat(z, x, y))
                changed.add((x, y + DY))
        for y in range(rows[-1] + DY + 1, rows[-1] + 1):
            for x in range(x0, x1 + 1):
                put(0, x, y, 2048 + fill_kind * 48)
                for z in (1, 2, 3, 4): put(z, x, y, 0)
                put(5, x, y, fill_region); changed.add((x, y))
    lift(LEFT[0], LEFT[1], LEFT[2], EARTH, 0)
    lift(TAVERN[0], TAVERN[1], TAVERN[2], COBBLE, 31)
    for x in range(TAVERN[0], TAVERN[1] + 1):                         # the square's top corners: no notch under the new cobbles
        if kind(at(0, x, 39)) in (GRASS, EARTH): put(0, x, 39, 2048 + COBBLE * 48); put(5, x, 39, 31); changed.add((x, 39))
    # ---- the entrance: an open timber porch instead of the plank canopy (rows after the lift: plaster 29..32, logs 33..34, deck 35)
    if not all(kind(at(0, x, y)) == 64 for x in range(45, 52) for y in (32, 33)): raise SystemExit("STOP: daszek z desek nie w x 45..51, wiersze 32..33")
    for x in range(45, 52):
        put(0, x, 32, 2048 + 94 * 48); put(0, x, 33, 2048 + 72 * 48)
        for y in (32, 33, 34, 35):
            for z in (2, 3): put(z, x, y, 0)
        changed |= {(x, 32), (x, 33)}
    for x in (46, 48, 50): put(2, x, 31, 2); put(2, x, 32, 10)          # the 1st-floor windows over the door, whole
    for x in (45, 51):                                                   # the deck: 5 wide, like the porch
        for z in range(6): put(z, x, 35, at(z, 44, 35))
        changed.add((x, 35))
    for x, t in zip(range(46, 51), (160, 161, 161, 161, 162)): put(3, x, 33, t)
    for y in (34, 35): put(3, 46, y, 168); put(3, 50, y, 170)
    put(5, 46, 35, 2); put(5, 50, 35, 2)
    door = ev[17]["pages"][0]["image"]                                   # the crooked plank door -> a sturdy one with iron bands
    if door["characterName"] != "!Fantasy_door1": raise SystemExit("STOP: drzwi tawerny mają inny obrazek")
    for pg in ev[17]["pages"]: pg["image"]["characterIndex"] = 3
    # ---- shapes (A3 / A4 sides: wall shapes; floors: floor shapes)
    for z in (0, 1):
        for (x, y) in RW.ring(changed, 1):
            if not (0 <= x < W and 0 <= y < H): continue
            k = kind(at(z, x, y))
            if k is None: continue
            def same(dx, dy, x=x, y=y, k=k, z=z):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < W and 0 <= ny < H): return True
                return kind(at(z, nx, ny)) == k
            if N.is_wall_kind(k): put(z, x, y, 2048 + k * 48 + N.wall_shape(same))
            elif RW.shapes_by_floor(k): put(z, x, y, 2048 + k * 48 + N.floor_shape(same))
    # ---- events: everything standing in the two blocks, the tavern's front spots (row 39), the two lamps
    n_e = 0
    for e in m["events"]:
        if not e or e["id"] in LAMPS: continue
        inl = LEFT[0] <= e["x"] <= LEFT[1] and e["y"] in LEFT[2]
        int_ = TAVERN[0] <= e["x"] <= TAVERN[1] and (e["y"] in TAVERN[2] or (e["y"] == 39 and e["name"].startswith("Miejsce: ")))
        if inl or int_: e["y"] += DY; n_e += 1
    for eid, (o, n) in LAMPS.items(): ev[eid]["x"], ev[eid]["y"] = n
    # ---- the well (tiles + events) and the stalls one row up
    if [at(3, 48 + i % 2, 40 + i // 2) for i in range(8)] != list(WELL_TILES): raise SystemExit("STOP: studnia nie w x 48..49, wiersze 40..43")
    for i in range(8): put(3, 48 + i % 2, 40 + i // 2, 0)
    for i, t in enumerate(WELL_TILES): put(3, 48 + i % 2, 38 + i // 2, t)
    for eid, o in SQUARE_UP.items():
        if (ev[eid]["x"], ev[eid]["y"]) != o: raise SystemExit("STOP: zdarzenie %d (%s) nie na %s" % (eid, ev[eid]["name"], o))
        ev[eid]["y"] -= 2
    for eid, o in STALLS.items():
        if (ev[eid]["x"], ev[eid]["y"]) != o: raise SystemExit("STOP: zdarzenie %d (%s) nie na %s" % (eid, ev[eid]["name"], o))
        ev[eid]["y"] -= 5
    print("Ogródki usunięte (%d kratek płotu/grządek); lewy rząd x 2..36 i tawerna o 3 w górę (tawerna wiersze 24..35); "
          "zdarzeń przesuniętych: %d + 2 latarnie" % (n_g, n_e))
    for a in sys.argv:
        if a.startswith("--podglad="):
            p = a.split("=", 1)[1]
            open(os.path.join(p, "Map220.json"), "wb").write(RW.json_text(m, lay)); print("  podgląd: " + p)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "rzad_wyzej_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map220.json"), bak)
    open(os.path.join(ROOT, "data", "Map220.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
