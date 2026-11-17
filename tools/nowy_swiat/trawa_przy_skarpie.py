# -*- coding: utf-8 -*-
"""Więcej trawy (gracz 2026-11-13: „da się zrobić tak, że przy samej krawędzi wzgórza jest ziemia, a potem ładnie przechodzi w trawę,
żeby więcej trawy było?”). Na lądzie (nie w korycie) ziemia malowana gracza - A5: ziemia płaskowyżu (środki), A2: ziemia 24 i błoto 26 -
zostaje tylko pasem przy krawędziach wzgórz (obrzeża i ściany A5): 1 kratka, a z szumem czasem 2; dalej trawa (A5 1633 / A2 16).
Miękkie przejście ziemia -> trawa robi w grze Ziemia.js. Nie rusza: dróg i ścieżek (A2 17), koryta (wszystko między skarpami), dojść
do mostów (kolumny mostu i ±1, do 8 kratek od jego końców), pól przed drzwiami.
  python tools/nowy_swiat/trawa_przy_skarpie.py 218 [--podglad=<plik>] [--wykonaj]"""
import collections, datetime, importlib.util, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

A5_GROUND = {1612, 1613, 1614, 1615, 1620, 1621, 1622, 1623, 1633, 1638}
A5_EARTH = {1614, 1615, 1622, 1623, 1638}
A5_GRASS = 1633
BED_SEED = {218: (5, 62), 220: (5, 50)}
NEAR = 5          # the earth of the paths (A2 17) turns to grass only this near a hill's edge


def h01(*a):
    v = 0
    for x in a: v = (v * 1000003 + int(x) * 2654435761) & 0xFFFFFFFF
    v ^= v >> 15; v = (v * 2246822519) & 0xFFFFFFFF; v ^= v >> 13
    return v / 4294967296


def main():
    mid = int(sys.argv[1])
    rel = "data/Map%03d.json" % mid
    m, lay = RW.read_json(rel)
    W, H = m["width"], m["height"]
    at = lambda z, x, y: m["data"][(z * H + y) * W + x]
    kind = lambda t: (t - 2048) // 48 if t >= 2048 else -1
    edge = lambda x, y: 1536 <= at(0, x, y) < 1664 and at(0, x, y) not in A5_GROUND
    building = lambda x, y: at(0, x, y) >= 4352 and at(0, x, y) < 8192
    # the bed: everything reachable from a bed cell without crossing an edge or a building
    bed, st = set(), [BED_SEED[mid]]
    while st:
        x, y = st.pop()
        if (x, y) in bed or not (0 <= x < W and 0 <= y < H) or edge(x, y) or building(x, y): continue
        bed.add((x, y)); st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    # distance to the nearest edge (8 ways, in cells)
    dist = {}
    q = collections.deque((x, y) for y in range(H) for x in range(W) if edge(x, y))
    for c in q: dist[c] = 0
    while q:
        x, y = q.popleft()
        if dist[(x, y)] >= NEAR + 1: continue
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                n = (x + dx, y + dy)
                if 0 <= n[0] < W and 0 <= n[1] < H and n not in dist: dist[n] = dist[(x, y)] + 1; q.append(n)
    keep = set()
    for y in range(H):
        for x in range(W):
            if at(5, x, y) == 4:   # a bridge: its columns +-1, 8 cells beyond both ends
                for yy in range(y - 8, y + 9):
                    for xx in range(x - 1, x + 2): keep.add((xx, yy))
    for e in m["events"]:
        if e and e["name"].startswith("Drzwi"):
            for (dx, dy) in ((0, 1), (0, 2), (-1, 1), (1, 1)): keep.add((e["x"] + dx, e["y"] + dy))
    changed_a5, changed_a2 = 0, set()
    for y in range(H):
        for x in range(W):
            if (x, y) in bed or (x, y) in keep or at(5, x, y) in (1, 2, 4): continue
            t = at(0, x, y)
            d = dist.get((x, y), 9)
            a5, a2 = t in A5_EARTH, kind(t) in (24, 26) or (kind(t) == 17 and d <= NEAR)   # (the paths' earth 17 only near a hill: the roads further off stay)
            if not (a5 or a2): continue
            band = 1 + (1 if h01(x, y, mid) < 0.45 else 0)
            if d <= band: continue
            if a5: m["data"][y * W + x] = A5_GRASS; changed_a5 += 1
            else: m["data"][y * W + x] = 2048 + 16 * 48; changed_a2.add((x, y))
    RW.reshape(m, 0, RW.ring(changed_a2, 1))
    print("Map%d: trawa zamiast ziemi: A5 %d, A2 %d kratek (koryto: %d kratek nietknięte)" % (mid, changed_a5, len(changed_a2), len(bed)))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(m, lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "trawa_%d_" % mid + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, rel), bak)
    open(os.path.join(ROOT, rel), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
