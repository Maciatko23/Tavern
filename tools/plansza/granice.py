# -*- coding: utf-8 -*-
"""Krok 1b (po przesun.py, przed wyspa.py): bez wzgórz na przejściach między mapami (gracz 2026-11-08: „żeby nie było wzgórz pomiędzy
przejściami map”). Usuwa pozostałości dawnych ramek map (skarpy / urwiska A5 wzdłuż starych krawędzi), które na planszy wypadają
na granicy z sąsiednią mapą albo w środku nowej mapy - zamienia je na grunt kratki obok. Mury miasta (z bramami), palisada Podgrodzia,
płot działki dziadka i wzgórza w głębi map zostają. Każda zmiana: spis kratek (staging/granice.txt).
  RAMKI: mapa -> lista (opis, x0, y0, x1, y1) w NOWYCH współrzędnych mapy - tylko kafle A5 wzgórz / urwisk w tym prostokącie
  python tools/plansza/granice.py"""
import json, os
from plansza import N, BOARD, STG, W
OUT = os.path.join(STG, "data")
A5_HILL = lambda v: 1536 + 64 <= v < 2048        # (A5 rows 8+: rims, terrace tops, rock faces, feet)
RAMKI = {
    3: [("górna skarpa Kruczego Jaru (dawna ramka, granica z miastem)", 0, 0, 79, 1),
        ("lewa skarpa i jej łuk (dawna ramka, granica z Przystanią)", 0, 0, 7, 41),
        ("prawa krawędź x 78 (dawna ramka - teraz środek mapy)", 77, 0, 79, 59)],
    4: [("połowa urwiska Łąka | Kruczy Jar (rzędy 58-59 - teraz środek mapy)", 0, 57, 79, 59)],
    13: [("obcięty cypel skały przy zachodniej granicy", 0, 24, 4, 33),
         ("podnóże urwiska Orla Grań | Góry (rzędy 24-25 - teraz przy brzegu, bez ściany nad sobą)", 12, 24, 119, 25)],
    125: [("obcięte wzniesienie przy wschodniej granicy", 114, 0, 119, 79)],
}
log = []
for mid, boxes in RAMKI.items():
    m = json.load(open(os.path.join(OUT, "Map%03d.json" % mid), encoding="utf-8"))
    t, n = m["data"], N * N
    ground = json.load(open(os.path.join(STG, "nowe_%d.json" % mid)))["ground"]
    for (opis, x0, y0, x1, y1) in boxes:
        cells = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if A5_HILL(t[y * N + x])]
        for (x, y) in cells:
            i = y * N + x
            # (the ground of the nearest plain neighbour - grass or the path's earth - else the map's own ground)
            g = None
            for r in (1, 2, 3):
                for dx in range(-r, r + 1):
                    for dy in range(-r, r + 1):
                        xx, yy = x + dx, y + dy
                        if 0 <= xx < N and 0 <= yy < N and 2816 <= t[yy * N + xx] < 4352 and (xx, yy) not in cells: g = W.kind_of(t[yy * N + xx]); break
                    if g is not None: break
                if g is not None: break
            t[i] = 2048 + (g if g is not None else ground) * 48
            for z in (1, 2, 3): t[z * n + i] = 0
            t[4 * n + i] = 0
            # (the regions stay: 9 on Kruczy Jar is "not grandpa's land" - the game reads it)
        W.reshape(m, 0, W.ring(cells, 1)); W.reshape(m, 1, W.ring(cells, 1))
        log.append("Map%03d: %s - %d kratek" % (mid, opis, len(cells)))
    open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(m).encode("utf-8"))
# (the old frames' INVISIBLE walls: region 2 - "no way here" - on plain ground within 4 cells of an old map's edge; under walls, fences,
# buildings and the moat it stays. Not on the town (its walls) nor on Podgrodzie's side facing it - that border is the same as before)
KEEP_SIDE = {111: "E"}
for mid, (c, r, dx, dy) in BOARD.items():
    if mid == 8: continue
    m = json.load(open(os.path.join(OUT, "Map%03d.json" % mid), encoding="utf-8")); t, n = m["data"], N * N
    W0, H0 = json.load(open(os.path.join(STG, "nowe_%d.json" % mid)))["old"]
    x0, y0, x1, y1 = max(0, dx), max(0, dy), min(N, dx + W0) - 1, min(N, dy + H0) - 1
    gone = 0
    for y in range(N):
        for x in range(N):
            i = y * N + x
            if t[5 * n + i] != 2: continue
            plain = not t[2 * n + i] and not t[3 * n + i] and t[i] < 4352 and t[n + i] < 4352 and not (1536 + 64 <= t[i] < 2048) and not (2048 <= t[i] < 2816)
            k0 = (t[i] - 2048) // 48 if t[i] >= 2048 else -1
            if not plain or k0 == 36: continue            # (36: the dry moat's cracked earth - its block is meant)
            near = [sd for sd, d in (("W", abs(x - x0)), ("E", abs(x - x1)), ("N", abs(y - y0)), ("S", abs(y - y1))) if d <= 4]
            if not near or any(KEEP_SIDE.get(mid) == sd for sd in near): continue
            t[5 * n + i] = 0; gone += 1
    if gone:
        open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(W.map_text(m).encode("utf-8"))
        log.append("Map%03d: niewidzialne ściany dawnej ramki (region 2 na zwykłym gruncie przy starej krawędzi) zdjęte: %d kratek" % (mid, gone))
# (2026-11-08, the whole island's picture: Podgrodzie's dry moat - A2 19, the stone bed, between A2 26 banks - ran on past the town
# wall's south corner to the map's south edge, where the old world's road went on, and stopped dead at the board's seam) the moat ends
# below the wall's corner in a rounded end (the bed a half-ellipse, the banks round it); what was moat further on is grass again
m = json.load(open(os.path.join(OUT, "Map111.json"), encoding="utf-8")); t, n = m["data"], N * N
kind = lambda v: (v - 2048) // 48 if 2816 <= v < 4352 else -1
bed = [(x, y) for y in range(95, N) for x in range(100, N) if kind(t[y * N + x]) == 19]
if bed:
    END = 104                                                           # (the wall's last row on the town's side is 102)
    xs = [x for (x, y) in bed if y == END] or [x for (x, y) in bed]
    cx, rx = (min(xs) + max(xs)) / 2.0, (max(xs) - min(xs)) / 2.0 + 0.5
    ry = 2.6
    inside = lambda x, y, g=0.0: y <= END or ((x - cx) / (rx + g)) ** 2 + ((y - END) / (ry + g)) ** 2 <= 1.0
    changed = set()
    for y in range(END + 1, N):
        for x in range(100, N):
            i = y * N + x; k = kind(t[i])
            if k == 19 and not inside(x, y): t[i] = 2048 + 16 * 48; changed.add((x, y))
            elif k == 26 and not inside(x, y, 1.2): t[i] = 2048 + 16 * 48; changed.add((x, y))
            elif k == 16 and inside(x, y, 1.2) and not inside(x, y): t[i] = 2048 + 26 * 48; changed.add((x, y))
    for (x, y) in changed:
        if t[5 * n + y * N + x] == 2: t[5 * n + y * N + x] = 0
    W.reshape(m, 0, W.ring(changed, 1))
    open(os.path.join(OUT, "Map111.json"), "wb").write(W.map_text(m).encode("utf-8"))
    log.append("Map111: sucha fosa kończy się zaokrągleniem pod narożnikiem muru miasta (rząd %d): %d kratek" % (END, len(changed)))
open(os.path.join(STG, "granice.txt"), "w", encoding="utf-8").write("\n".join(log) + "\n")
print("\n".join(log))
