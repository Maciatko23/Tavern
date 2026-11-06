# -*- coding: utf-8 -*-
"""Punkty do zrzutów z gry: dla każdej zmienionej mapy do 3 miejsc (największe skupiska zmian kafli + pierwsza zapora), bohater na najbliższej chodliwej kratce
(po zmianie). Zapis: staging/punkty.json  {mapa: [[x, y, opis], ...]}"""
import os, sys, json, collections
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib; L = lib.L
out = {}
for mid in lib.mapy_swiata() + [101]:
    p = os.path.join(lib.STG, "data", "Map%03d.json" % mid)
    if not os.path.exists(p): continue
    a, b = L.Mapa(mid), L.Mapa(mid, path=p)
    c = collections.Counter()
    for z in (0, 1):
        for y in range(a.H):
            for x in range(a.W):
                if a.t(z, x, y) != b.t(z, x, y): c[(x // 14, y // 9)] += 1
    pts = []
    for (gx, gy), n in c.most_common(2):
        pts.append((gx * 14 + 7, gy * 9 + 4, "zmiany kafli (%d)" % n))
    zap = [e for e in b.raw["events"] if e and (e.get("note") or "").startswith("<Zapora")]
    if zap: pts.append((zap[0]["x"], zap[0]["y"], "zapora (%d zdarzeń)" % len(zap)))
    res = []
    for (x, y, o) in pts:
        best = None
        for dy in range(-6, 7):
            for dx in range(-6, 7):
                u, v = x + dx, y + dy
                if 0 <= u < b.W and 0 <= v < b.H and b.stoi(u, v) and a.stoi(u, v):
                    d = dx * dx + dy * dy
                    if best is None or d < best[0]: best = (d, u, v)
        if best: res.append([best[1], best[2], o])
    out[mid] = res
json.dump(out, open(os.path.join(lib.STG, "punkty.json"), "w", encoding="utf-8"), ensure_ascii=False)
print(sum(len(v) for v in out.values()), "punktów w", len(out), "mapach")
