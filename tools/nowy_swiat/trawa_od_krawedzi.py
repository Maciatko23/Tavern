# -*- coding: utf-8 -*-
"""Odwrotnie (gracz 2026-11-13: „tam, gdzie jest koryto, zostaje ziemia, a na górze trawa - nawet od krawędzi trawa - i przechodzi w głąb
terenu w ziemię ładnie, czasami”): na lądzie (wszystko poza korytem) przy krawędziach wzgórz i skarp (do DIST kratek) ziemia -> trawa:
  - płaskowyż A5 z ziemi -> ten sam kawałek z trawy: obrzeża (1629..1647, ziemia) -> 1624..1642 (trawa, ten sam kształt: id - 5),
    rogi wewnętrzne 1614 / 1615 / 1622 / 1623 -> 1612 / 1613 / 1620 / 1621, środek 1638 -> 1633;
  - ziemia A2 24 / 26 -> trawa A2 16 (kształty autokafli przeliczone).
Dalej w głąb lądu ziemia zostaje (ścieżki, podwórka) - przejście trawa -> ziemia robi w grze Ziemia.js (stopniowe, kępami).
Nie rusza: koryta (z jego obrzeżami), ścieżek A2 17, mostów i dojść do nich, pól przed drzwiami, schodów.
  python tools/nowy_swiat/trawa_od_krawedzi.py 218 [--podglad=<plik>] [--wykonaj]"""
import collections, datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

DIST = 3
BED_SEED = {218: (5, 62), 220: (5, 50)}
EARTH_RIM = {1629, 1630, 1631, 1637, 1639, 1645, 1646, 1647}          # -> id - 5
EARTH_CORNER = {1614: 1612, 1615: 1613, 1622: 1620, 1623: 1621}
A5_GROUND = {1612, 1613, 1614, 1615, 1620, 1621, 1622, 1623, 1633, 1638}


def main():
    mid = int(sys.argv[1])
    rel = "data/Map%03d.json" % mid
    m, lay = RW.read_json(rel)
    W, H = m["width"], m["height"]
    at = lambda z, x, y: m["data"][(z * H + y) * W + x]
    kind = lambda t: (t - 2048) // 48 if t >= 2048 else -1
    a5 = lambda t: 1536 <= t < 1664
    edge = lambda x, y: a5(at(0, x, y)) and at(0, x, y) not in A5_GROUND
    building = lambda x, y: 4352 <= at(0, x, y) < 8192
    # the bed: from its seed without crossing an A5 edge, a building or a bridge
    bed, st = set(), [BED_SEED[mid]]
    while st:
        x, y = st.pop()
        if (x, y) in bed or not (0 <= x < W and 0 <= y < H) or edge(x, y) or building(x, y): continue
        bed.add((x, y)); st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    dist = {}
    q = collections.deque((x, y) for y in range(H) for x in range(W) if edge(x, y))
    for c in q: dist[c] = 0
    while q:
        x, y = q.popleft()
        if dist[(x, y)] >= DIST: continue
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                n = (x + dx, y + dy)
                if 0 <= n[0] < W and 0 <= n[1] < H and n not in dist: dist[n] = dist[(x, y)] + 1; q.append(n)
    keep = set()
    for y in range(H):
        for x in range(W):
            if at(5, x, y) == 4:
                for yy in range(y - 2, y + 3):
                    for xx in range(x - 1, x + 2): keep.add((xx, yy))
            if any(at(z, x, y) for z in (1, 2, 3)) and not a5(at(0, x, y)) and kind(at(1, x, y)) not in (-1, 21, 31, 39, 47, 29): keep.add((x, y))
    for e in m["events"]:
        if e and e["name"].startswith("Drzwi"):
            for (dx, dy) in ((0, 1), (0, 2), (-1, 1), (1, 1)): keep.add((e["x"] + dx, e["y"] + dy))
    n_rim = n_mid = 0
    a2 = set()
    for y in range(H):
        for x in range(W):
            if (x, y) in bed or (x, y) in keep or dist.get((x, y), 99) > DIST: continue
            t = at(0, x, y)
            if t in EARTH_RIM:
                # (a rim: only one on the land's side - a bed cell on its open side means it is the bed's own, kept)
                if any((x + dx, y + dy) in bed for dx in (-1, 0, 1) for dy in (-1, 0, 1)) and not any(
                        edge(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy)): continue
                m["data"][y * W + x] = t - 5; n_rim += 1
            elif t in EARTH_CORNER: m["data"][y * W + x] = EARTH_CORNER[t]; n_rim += 1
            elif t == 1638: m["data"][y * W + x] = 1633; n_mid += 1
            elif kind(t) in (24, 26): m["data"][y * W + x] = 2048 + 16 * 48; a2.add((x, y))
    RW.reshape(m, 0, RW.ring(a2, 1))
    print("Map%d: od krawędzi trawa: obrzeża/rogi A5 %d, środki A5 %d, ziemia A2 %d (koryto %d kratek bez zmian)" % (mid, n_rim, n_mid, len(a2), len(bed)))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(m, lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "trawa_od_krawedzi_%d_" % mid + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, rel), bak)
    open(os.path.join(ROOT, rel), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
