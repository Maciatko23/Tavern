# -*- coding: utf-8 -*-
"""Szew Miasteczko | Posiadłość Lorda (2026-11-13, gracz: „pomiędzy miasteczkiem a mapą Lorda taki sam murek trzeba, co poprzednio”):
taki sam drewniany murek z bramą jak na szwie Podgrodzie | Miasteczko (tools/nowy_swiat/szew_B_bez_scian.py):
  - murek z desek na kamieniach (A4 84, warstwa 0, region 2) w skrajnej kolumnie OBU map (Miasteczko x 79, Posiadłość x 0): od gór
    (wiersz 7) do baszty, spod koryta (wiersz 53 - krawędź skarpy) do gór, razem z półką pod górami (73..74) - tak jak gracz sam
    domknął murek na pierwszym szwie (wiersze 5-6, krawędzie skarpy);
  - brama przy drodze (droga 40..42): dwie baszty, po 2 kolumny na każdej mapie (razem 4 przez szew) - dach z gontu (A3 66, 2 rzędy)
    nad ścianą z desek na kamieniach (3 rzędy): północna 34..38, południowa 44..48 (stoi na brzegu koryta), przejazd 39..43;
  - koryto (49..52) nietknięte;
  - przy okazji pierwszy szew: półka pod górami (wiersze 73..74) była tam przejściem obok murku - domknięta tak samo
    (Podgrodzie x 79, Miasteczko x 0).
  python tools/nowy_swiat/szew_C_murek.py [--podglad=<katalog>] [--wykonaj]"""
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
WALL, ROOF = 2048 + 84 * 48, 2048 + 66 * 48
TOWERS = (((34, 35), (36, 38)), ((44, 45), (46, 48)))   # (roof rows, wall rows) north and south of the way through 39..43
LINE = [y for y in range(7, 75) if not (34 <= y <= 48) and not (49 <= y <= 52)]
LEDGE = (73, 74)                                         # seam B: the ledge under the mountains
GROUND = lambda t: 2048 <= t < 4352 or 1536 <= t < 2048  # A2 ground or A5 (grass / earth / the rims and the ledge)
def kind(t): return (t - 2048) // 48 if t >= 2048 else None


def build(m, x, x2, name, rows, towers):
    at = lambda z, xx, yy: m["data"][(z * H + yy) * W + xx]
    def put(z, xx, yy, v): m["data"][(z * H + yy) * W + xx] = v
    line = [(x, y) for y in rows]
    roofs = [(c, y) for (rr, wr) in towers for y in range(rr[0], rr[1] + 1) for c in (x, x2)]
    walls = line + [(c, y) for (rr, wr) in towers for y in range(wr[0], wr[1] + 1) for c in (x, x2)]
    cells = walls + roofs
    bad = [c for c in cells if not GROUND(at(0, *c)) or at(5, *c) == 2 and kind(at(0, *c)) != 84]
    if bad: raise SystemExit("STOP: %s - pod murkiem nie grunt: %s" % (name, bad))
    drop = [e for e in m["events"] if e and (e["x"], e["y"]) in set(cells)]
    if drop: raise SystemExit("STOP: %s - zdarzenia na murku: %s" % (name, [(e["id"], e["name"], e["x"], e["y"]) for e in drop]))
    for c in cells:
        put(0, c[0], c[1], WALL if c in walls else ROOF)
        for z in (1, 2, 3, 4): put(z, c[0], c[1], 0)
        put(5, c[0], c[1], 2)
    allw = set(walls) | {(xx, yy) for yy in range(H) for xx in (x, x2) if kind(at(0, xx, yy)) == 84}
    for (cx, cy) in allw:                                            # A4 top: floor shapes; off the map, the towers' roofs = the same
        def same(dx, dy, cx=cx, cy=cy):
            nx, ny = cx + dx, cy + dy
            if not (0 <= nx < W and 0 <= ny < H): return True
            return kind(at(0, nx, ny)) in (84, 66) and ((nx, ny) in allw or (nx, ny) in roofs)
        put(0, cx, cy, WALL + N.floor_shape(same))
    for (cx, cy) in roofs:                                           # A3 roof: wall shapes
        def same(dx, dy, cx=cx, cy=cy):
            nx, ny = cx + dx, cy + dy
            if not (0 <= nx < W and 0 <= ny < H): return True
            return kind(at(0, nx, ny)) == 66 and (nx, ny) in roofs
        put(0, cx, cy, ROOF + N.wall_shape(same))
    # the ground round it: shapes again (a rim / grass autotile next to the wall)
    near = {(xx, yy) for (cx, cy) in cells for xx in (cx - 1, cx + 1) for yy in (cy - 1, cy, cy + 1) if 0 <= xx < W and 0 <= yy < H}
    RW.reshape(m, 0, [c for c in near if c not in set(cells) and kind(at(0, *c)) is not None and kind(at(0, *c)) < 48])
    return len(cells)


def main():
    T, lt = RW.read_json("data/Map220.json")
    P, lp = RW.read_json("data/Map221.json")
    B, lb = RW.read_json("data/Map218.json")
    log = []
    log.append("Miasteczko x 79: %d kratek" % build(T, 79, 78, "Miasteczko", LINE, TOWERS))
    log.append("Posiadłość x 0: %d kratek" % build(P, 0, 1, "Posiadłość", LINE, TOWERS))
    log.append("szew B, półka pod górami: Podgrodzie %d, Miasteczko %d kratek"
               % (build(B, 79, 78, "Podgrodzie", LEDGE, ()), build(T, 0, 1, "Miasteczko (zachód)", LEDGE, ())))
    for l in log: print(l)
    print("brama: baszty 34..38 i 44..48, przejazd 39..43, koryto 49..52 wolne")
    outs = (("data/Map220.json", T, lt), ("data/Map221.json", P, lp), ("data/Map218.json", B, lb))
    for a in sys.argv:
        if a.startswith("--podglad="):
            d = a.split("=", 1)[1]
            for rel, m, lay in outs: open(os.path.join(d, os.path.basename(rel)), "wb").write(RW.json_text(m, lay))
            print("  podgląd: " + d)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "szew_C_murek_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for rel, m, lay in outs:
        shutil.copy2(os.path.join(ROOT, rel), bak)
        open(os.path.join(ROOT, rel), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopie: " + bak)


if __name__ == "__main__":
    main()
