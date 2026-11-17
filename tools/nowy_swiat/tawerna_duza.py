# -*- coding: utf-8 -*-
"""Duża tawerna w Miasteczku (Map220), 2026-11-13. Gracz: „przed tawerną więcej miejsca, i tak studnia, ale sama tawerna ma być
50% dłuższa i wyższa (duży budynek z dwoma piętrami)”; wybrał: parter + 2 piętra, „gdziekolwiek, ale nad rzeką, nad studnią”,
studnia na środku placu, kramy na boki.
  - tawerna x 37..59 (23 kratki, było 15), wiersze 27..37: dach słomiany (A3 67) 5 rzędów, dwa piętra szachulca (A4 94, wiersze
    32..35, dwa rzędy okien), parter z bali (A3 72) z drzwiami na środku (x 48); ganek z daszkiem z desek (A3 64) x 45..51 na
    jednym rzędzie podestu (wiersz 38 - było 2, plac zyskuje rząd); kominy, okienka w dachu, latarnie, szyld i tablica zleceń
    przeniesione z nią; region 3 na dwóch górnych rzędach dachu (przejście za tawerną), 2 na reszcie;
  - szopa stajni o 3 kratki w prawo (x 61..66, z oknami i drzwiami), płot wybiegu skrócony do x 60;
  - plac: bruk ośmiokątem x 36..60, wiersze 39..45 (szerokość tawerny), studnia na środku (x 48..49), kramy na brzegach
    (x 38 i x 58; studnia w wierszach 40..43, żeby nie zasłaniała schodów do koryta), latarnie na rogach przed tawerną i przy studni (boki placu mają już latarnie drogi); punkty mieszkańców (Miejsce: ...) przesunięte razem z rzeczami.
  python tools/nowy_swiat/tawerna_duza.py [--podglad=<katalog>] [--wykonaj]"""
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
K = lambda k: 2048 + k * 48
EARTH, COBBLE, DECK, FENCE = 17, 40, 33, 22
ROOF, PLASTER, LOGS, PORCH_ROOF = 67, 94, 72, 64                    # thatch, half-timber (A4 side), log wall, plank roof
SHED_ROOF, SHED_WALL = 64, 83
X0, X1, DOOR = 37, 59, 48
ROOF_ROWS, PLASTER_ROWS, LOG_ROWS = range(27, 32), range(32, 36), range(36, 38)
PORCH = range(45, 52)
WIN_TOP, WIN_BOT, GWIN_TOP, GWIN_BOT = 2, 10, 1, 9                  # B tiles: upper-floor window (2 rows), ground-floor window
PILLAR_UP, PILLAR_DN = 496, 504
OCTAGON = {39: (39, 57), 40: (37, 59), 41: (36, 60), 42: (36, 60), 43: (36, 60), 44: (37, 59), 45: (39, 57)}
WELL_TILES = (432, 433, 440, 441, 448, 449, 456, 457)
# events: id -> (name start, old (x, y), new (x, y)) - the script stops if a thing is not where it was
MOVES = {
    17: ("Drzwi: Tawerna", (47, 37), (48, 37)), 25: ("Latarnia przy drzwiach", (46, 37), (47, 37)), 26: ("Latarnia przy drzwiach", (48, 37), (49, 37)),
    18: ("Dym z komina", (46, 28), (40, 28)), 19: ("Dym z komina", (48, 28), (46, 28)), 21: ("Dym z komina", (41, 30), (51, 28)), 22: ("Dym z komina", (53, 30), (57, 28)),
    16: ("Okienko w dachu", (47, 32), (48, 30)), 23: ("Okienko w dachu", (42, 31), (41, 30)), 24: ("Okienko w dachu", (52, 31), (55, 30)),
    81: ("tablica zlece", (52, 38), (54, 38)), 82: ("Tablica zlece", (52, 38), (54, 38)), 83: ("Miejsce: tablica_zlecen", (52, 39), (54, 39)),
    84: ("Miejsce: plac_tablica", (52, 39), (54, 39)), 87: ("Miejsce: tawerna_podworze", (47, 39), (48, 39)),
    198: ("Miejsce: karczmarz_praca", (45, 38), (46, 38)),
    91: ("Studnia miejska", (50, 45), (48, 43)), 92: ("Studnia miejska", (51, 45), (49, 43)),
    97: ("Miejsce: studnia_rynek", (49, 45), (47, 43)), 98: ("Miejsce: plac_studnia", (49, 44), (47, 42)),
    104: ("Miejsce: kolejka_1", (49, 45), (47, 43)), 105: ("Miejsce: kolejka_2", (48, 44), (46, 42)),
    106: ("Miejsce: kolejka_3", (47, 45), (45, 43)), 107: ("Miejsce: kolejka_4", (46, 44), (44, 42)),
    99: ("Miejsce: rynek_srodek", (47, 43), (44, 40)), 252: ("Miejsce: plac", (47, 42), (52, 41)),
    93: ("Stragan Agaty", (40, 45), (38, 43)), 94: ("Stragan", (44, 45), (58, 43)),
    102: ("Miejsce: stragan1", (40, 44), (38, 42)), 103: ("Miejsce: stragan2", (44, 44), (58, 42)),
    254: ("Latarnia przy tawernie", (39, 39), (37, 39)), 260: ("Latarnia na rynku", (38, 44), (51, 43)), 261: ("Latarnia na rynku", (57, 44), (59, 39)),
    29: ("Drzwi: Stajnia", (61, 32), (63, 32)), 30: ("Miejsce: stajnia_drzwi", (61, 33), (63, 33)), 90: ("Miejsce: stajnia_woz", (59, 36), (62, 36)),
}
KEEP = {27: ("Szyld: Tawerna", (42, 37))}  # stays where it hangs (the left wing)
HOME_SPOT = ((47, 38), (48, 38))          # every "Miejsce: ..." at the old door goes to the new one (tawerna_drzwi, *_dom)


def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def main():
    m, lay = RW.read_json("data/Map220.json")
    at = lambda z, x, y: m["data"][(z * H + y) * W + x]
    def put(z, x, y, v): m["data"][(z * H + y) * W + x] = v
    auto0, auto1 = set(), set()
    # ---- checks: the old tavern, shed and well where they were
    if kind(at(0, 47, 30)) != ROOF or kind(at(0, 40, 37)) != LOGS or kind(at(0, 60, 29)) != SHED_ROOF:
        raise SystemExit("STOP: Map220 - tawerna/szopa nie tam, gdzie były (mapa zmieniona?)")
    if [at(3, 50, 42), at(3, 51, 45)] != [432, 457]: raise SystemExit("STOP: Map220 - studnia nie tam, gdzie była")
    for eid, (nm, old, new) in MOVES.items():
        e = m["events"][eid] if eid < len(m["events"]) else None
        if not e or not e["name"].startswith(nm) or (e["x"], e["y"]) != old:
            raise SystemExit("STOP: Map220 - zdarzenie %d (%s) nie na %s" % (eid, nm, old))
    others = [e for e in m["events"] if e and X0 <= e["x"] <= X1 and 27 <= e["y"] <= 37 and e["id"] not in MOVES and e["id"] not in KEEP]
    if others: raise SystemExit("STOP: Map220 - inne zdarzenia w miejscu nowej tawerny: %s" % [(e["id"], e["name"], e["x"], e["y"]) for e in others])
    # ---- the old porch, shed and well out
    for y in (38, 39):
        for x in range(44, 51):
            if kind(at(1, x, y)) == DECK: put(1, x, y, 0); auto1.add((x, y))
            if at(2, x, y) == PILLAR_DN: put(2, x, y, 0)
            if at(5, x, y) in (0, 2): put(5, x, y, 31)
    for y in range(28, 34):
        for x in range(56, 66):
            if kind(at(0, x, y)) in (SHED_ROOF, SHED_WALL): put(0, x, y, K(EARTH)); auto0.add((x, y)); put(2, x, y, 0); put(5, x, y, 31)
    for y in range(42, 46):
        for x in (50, 51):
            if at(3, x, y) in WELL_TILES: put(3, x, y, 0)
    # ---- the tavern
    for y in range(27, 38):
        for x in range(X0, X1 + 1):
            k = ROOF if y in ROOF_ROWS else PLASTER if y in PLASTER_ROWS else LOGS
            if x in PORCH and y in (35, 36): k = PORCH_ROOF
            put(0, x, y, K(k)); auto0.add((x, y))
            for z in (1, 2, 3, 4): put(z, x, y, 0)
            put(5, x, y, 3 if y in (27, 28) else 2)
    for x in (39, 41, 43, 46, 48, 50, 53, 55, 57):                     # the 2nd floor
        put(2, x, 32, WIN_TOP); put(2, x, 33, WIN_BOT)
    for x in (39, 41, 43, 53, 55, 57):                                 # the 1st floor (the porch roof covers its middle)
        put(2, x, 34, WIN_TOP); put(2, x, 35, WIN_BOT)
    for x in (46, 48, 50): put(2, x, 34, WIN_TOP)
    for x in (38, 40, 56, 58):                                         # the ground floor (sign at 42, the board at 54)
        put(2, x, 36, GWIN_TOP); put(2, x, 37, GWIN_BOT)
    for x in PORCH:                                                    # one row of deck in front of the door
        put(1, x, 38, K(DECK)); auto1.add((x, 38)); put(5, x, 38, 0)
    for x in (PORCH[0], PORCH[-1]):
        put(3, x, 37, PILLAR_UP); put(2, x, 38, PILLAR_DN); put(5, x, 38, 2)
    # ---- the stable shed 3 cells east
    for y in (29, 30, 31, 32):
        for x in range(61, 67):
            put(0, x, y, K(SHED_ROOF if y < 31 else SHED_WALL)); auto0.add((x, y))
            for z in (1, 2, 3, 4): put(z, x, y, 0)
            put(5, x, y, 2)
    put(2, 62, 31, 57); put(2, 65, 31, 57)
    for (x, y) in ((58, 28), (59, 28), (58, 39), (59, 39), (60, 39)):  # the paddock's fence: no lone post by the square
        if kind(at(1, x, y)) == FENCE: put(1, x, y, 0); auto1.add((x, y))
    if (at(2, 58, 38), at(2, 59, 38)) == (458, 459):                   # the hay cart out of the square's corner
        put(2, 58, 38, 0); put(2, 59, 38, 0); put(2, 61, 38, 458); put(2, 62, 38, 459)
    # ---- the square: cobbles, the well in the middle
    for y, (a, b) in OCTAGON.items():
        for x in range(a, b + 1):
            if kind(at(0, x, y)) in (EARTH, 16, COBBLE):
                if kind(at(0, x, y)) != COBBLE: put(0, x, y, K(COBBLE)); auto0.add((x, y))
                if at(5, x, y) == 0: put(5, x, y, 31)
    for i, t in enumerate(WELL_TILES):
        put(3, 48 + i % 2, 40 + i // 2, t)
    # ---- autotile shapes (A3 / A4 sides: wall shapes; the rest: floor shapes)
    for z, cells in ((0, auto0), (1, auto1)):
        for (x, y) in RW.ring(cells, 1):
            if not (0 <= x < W and 0 <= y < H): continue
            k = kind(at(z, x, y))
            if k is None: continue
            def same(dx, dy, x=x, y=y, k=k):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < W and 0 <= ny < H): return True
                return kind(at(z, nx, ny)) == k
            if N.is_wall_kind(k): put(z, x, y, K(k) + N.wall_shape(same))
            elif RW.shapes_by_floor(k): put(z, x, y, K(k) + N.floor_shape(same))
    # ---- events
    for eid, (nm, old, new) in MOVES.items():
        m["events"][eid]["x"], m["events"][eid]["y"] = new
    n_home = 0
    for e in m["events"]:
        if e and e["name"].startswith("Miejsce: ") and (e["x"], e["y"]) == HOME_SPOT[0] and e["id"] not in MOVES:
            e["x"], e["y"] = HOME_SPOT[1]; n_home += 1
    print("Tawerna x %d..%d, wiersze 27..37 (3 kondygnacje), drzwi (%d,37); szopa stajni x 61..66; plac x 36..60; studnia (48..49, 40..43)" % (X0, X1, DOOR))
    print("Zdarzenia przesunięte: %d (+ %d punktów przy drzwiach)" % (len(MOVES), n_home))
    for a in sys.argv:
        if a.startswith("--podglad="):
            d = a.split("=", 1)[1]
            open(os.path.join(d, "Map220.json"), "wb").write(RW.json_text(m, lay)); print("  podgląd: " + d)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_duza_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map220.json"), bak)
    open(os.path.join(ROOT, "data", "Map220.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
