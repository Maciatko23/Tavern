# -*- coding: utf-8 -*-
"""Sąsiedzi Kruczogrodu: ten sam mur przy krawędzi i brama w tych samych kratkach (tylko staging: tools/miasto3/staging/data/MapNNN.json).
  Map024 (N, jej dół y116-119)  Map003 (S, jej góra y0-3)  Map004 (E, jej lewe kolumny x0-1)  Map111 (W, jej prawe x116-119)
Pasek <= 4 kratki przy krawędzi (+ koniec drogi); reszta mapy bez zmian. Tileset 14 (zestaw 11 + arkusz E z murem) dla 24 i 111, 15 (zestaw 9 + E) dla 3 i 4.
  python tools/miasto3/neighbors.py"""
import os, sys, json, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mlib import *      # noqa: F401,F403
import mlib
import build as B
from nslib import floor_shape, wall_shape, is_wall_kind

N = W * H


def idx(z, x, y): return z * N + y * W + x


def recalc(data, z, cells):
    """przelicza kształty autokafli warstwy z w podanych kratkach (rodzaj bez zmian)"""
    def kind(x, y):
        if not (0 <= x < W and 0 <= y < H): return None
        v = data[idx(z, x, y)]
        return (v - 2048) // 48 if v >= 2048 else None
    for (x, y) in cells:
        k = kind(x, y)
        if k is None: continue
        def same(dx, dy):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < W and 0 <= ny < H): return True
            return kind(nx, ny) == k
        sh = wall_shape(same) if is_wall_kind(k) else floor_shape(same)
        data[idx(z, x, y)] = 2048 + k * 48 + sh


def strip_edit(mid, ts, strip, gates_cells, walls, road_fix=None, e_shift=0, replant=None):
    """strip: zbiór kratek do wyczyszczenia i położenia muru; walls(): rysuje mur na świeżej warstwie B.L; gates_cells: kratki otwarte (droga)"""
    raw = load(ROOT + "data/Map%03d.json" % mid)
    data = raw["data"]
    # czyszczenie paska: warstwy 1-3, cień, region; warstwa 0 = trawa (16), bramy = droga (17)
    for (x, y) in strip:
        for z in (1, 2, 3, 4, 5): data[idx(z, x, y)] = 0
        data[idx(0, x, y)] = 2048 + 16 * 48
    evs = raw["events"]
    removed = []
    for i, e in enumerate(evs):
        if e and (e["x"], e["y"]) in strip:
            removed.append((e["id"], e["name"], e["x"], e["y"]))
            nat = e["name"].split(" ")[0] in ("Sosna", "Drzewo", "Małe", "Omszały", "Płaski", "Wielki", "Dzika", "Skała")
            if nat and replant:
                nx, ny = replant(e["x"], e["y"])
                if nx is not None and (nx, ny) not in strip and not any(f and f is not e and (f["x"], f["y"]) == (nx, ny) for f in evs):
                    e["x"], e["y"] = nx, ny; continue
            evs[i] = None
    for (x, y) in gates_cells: data[idx(0, x, y)] = 2048 + 17 * 48
    if road_fix: road_fix(data)
    ring = {(x + dx, y + dy) for (x, y) in strip | set(gates_cells) for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2)}
    recalc(data, 0, ring)
    # mur
    B.L = Layers()
    walls()
    for z in range(4):
        for (x, y), (t, v) in B.L.L[z].items():
            data[idx(z, x, y)] = v + e_shift if (e_shift and t == 't' and 768 <= v < 896) else v
    for (x, y), v in B.L.region.items(): data[idx(5, x, y)] = v
    raw["tilesetId"] = ts
    write_map(STAGING + "data/Map%03d.json" % mid, {k: v for k, v in raw.items() if k not in ("data", "events")}, data, evs)
    return removed


def road_stub(data, cells, kind=17):
    for c in cells: data[idx(0, *c)] = 2048 + kind * 48


def main():
    rep = {}
    nt = [0, 118, 20, 26, 8, 40, 54, 68, 82, 96, 108]
    st = [0, 118, 28, 34, 12, 46, 60, 74, 88, 102]
    # Map024: N brama (24-27); dół mapy y116-119
    rect = lambda x0, y0, x1, y1: {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
    g24 = rect(22, 116, 25, 119)

    def road24(data):
        # ostatni odcinek drogi: do bramy 24-27 (jej droga szła 26-28): y104-115 przesunięta
        for y in range(104, 116):
            t = (y - 104) / 11.0
            c0 = 27 + (23.5 - 27) * t       # środek 27 -> 23.5
            for x in range(22, 31):
                v = data[idx(0, x, y)]
                inside = abs(x + 0.5 - c0 - 0.5) <= 1.6
                if inside: data[idx(0, x, y)] = 2048 + 17 * 48
                elif v >= 2048 and (v - 2048) // 48 == 17: data[idx(0, x, y)] = 2048 + 16 * 48
    rep[24] = strip_edit(24, 14, rect(0, 116, 119, 119), g24, lambda: B.hwall(116, 0, 119, towers=nt, gaps=[(22, 25)], lintel_gaps=[(22, 25)]), road24,
                         replant=lambda x, y: (x, y - 5) if not 17 <= x <= 31 else (None, None))
    # Map003: S brama (30-33); góra y0-3
    g3 = rect(30, 0, 33, 3)
    rep[3] = strip_edit(3, 15, rect(0, 0, 119, 3), g3, lambda: B.hwall(0, 0, 119, towers=st, gaps=[(30, 33)], lintel_gaps=[(30, 33)]),
                        lambda d: road_stub(d, rect(30, 4, 33, 9)), replant=lambda x, y: (x, y + 5) if not 27 <= x <= 36 else (None, None))
    # Map004: E (jej W): kolumny 0-1, bramy y10-12 i y48-50
    def walls4():
        for (ya, yb, top, bot) in ((0, 9, "mid", "tower"), (13, 47, "cap", "tower"), (51, 119, "cap", "mid")):
            tw = [t for t in range(ya + 14, yb - 8, 15)]
            B.vwall(0, ya, yb, towers=tw, top=top, bottom=bot)
    g4 = rect(0, 10, 1, 12) | rect(0, 48, 1, 50)
    rep[4] = strip_edit(4, 15, rect(0, 0, 1, 119), g4, walls4, lambda d: road_stub(d, rect(2, 10, 9, 12) | rect(2, 48, 9, 50)),
                        replant=lambda x, y: (x + 5, y) if not (8 <= y <= 14 or 46 <= y <= 52) else (None, None))
    # Map111: W (jej E): kolumny 118-119 + pas 116-117 trawy; bramy y50-51 (most) i y104-107
    def walls111():
        for (ya, yb, top, bot) in ((0, 49, "mid", "tower"), (52, 103, "cap", "tower"), (108, 119, "cap", "mid")):
            tw = [t for t in range(ya + 14, yb - 8, 15)]
            B.vwall(118, ya, yb, towers=tw, top=top, bottom=bot)
    g111 = rect(118, 50, 119, 51) | rect(118, 104, 119, 107)
    s111 = rect(116, 0, 119, 119)

    def road111(data):
        for c in rect(116, 50, 119, 51): data[idx(0, *c)] = 2048 + 40 * 48
        road_stub(data, rect(110, 104, 117, 107))
    rep[111] = strip_edit(111, 16, s111, g111, walls111, road111, e_shift=128)
    # MapInfos / zestawy: staged Tilesets.json już ma 14 i 15 (kit.py)
    json.dump({str(k): v for k, v in rep.items()}, open(HERE + "/neighbors_usuniete.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for k, v in rep.items(): print(k, "usunięte zdarzenia w pasku:", len(v), v[:6])


if __name__ == "__main__":
    main()
