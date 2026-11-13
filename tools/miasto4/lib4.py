# -*- coding: utf-8 -*-
"""Klocki budowy Kruczogrodu v2 (miasto4): warstwy kafli, kawałki z uklad4.json, zdarzenia wg wzorów starej mapy."""
import os, sys, json, copy, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/newstart")
sys.path.insert(0, ROOT + "tools/rozszerzenia")
sys.path.insert(0, ROOT + "tools/mapy")
from nslib import floor_shape, wall_shape, is_wall_kind, noise, lowfreq, line_dist   # noqa: E402
import wspolne as WS   # noqa: E402

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

N = 120
STG = HERE.replace("\\", "/") + "/staging/"
UKJ = json.load(open(HERE + "/uklad4.json", encoding="utf-8"))
UK = UKJ["uklad"]
O2N = {int(k): v for k, v in UKJ["stare_na_nowe"].items()}


def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))


class Layers:
    def __init__(self):
        self.L = [dict() for _ in range(4)]
        self.region = {}

    def inside(self, x, y): return 0 <= x < N and 0 <= y < N

    def kind(self, z, cells, k):
        for c in cells:
            if self.inside(*c): self.L[z][c] = ("k", k)

    def tile(self, z, x, y, t):
        if self.inside(x, y) and t: self.L[z][(x, y)] = ("t", t)

    def clear(self, z, cells):
        for c in cells: self.L[z].pop(c, None)

    def resolve(self):
        data = [0] * (N * N * 6)
        n = N * N
        for z in range(4):
            lay = self.L[z]
            for (x, y), (t, v) in lay.items():
                if t == "t":
                    data[z * n + y * N + x] = v
                    continue

                def same(dx, dy, x=x, y=y, v=v, lay=lay):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= N or ny >= N: return True
                    return lay.get((nx, ny)) == ("k", v)
                shape = wall_shape(same) if is_wall_kind(v) else floor_shape(same)
                data[z * n + y * N + x] = 2048 + v * 48 + shape
        for (x, y), v in self.region.items(): data[5 * n + y * N + x] = v
        return data


def rectc(x0, y0, x1, y1): return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}


def blobc(cx, cy, rx, ry, seed, rough=0.3):
    return {(x, y) for y in range(N) for x in range(N) if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rough * (noise(x, y, seed) - 0.5) * 2}


def ring_cells(cells):
    """brzeg zbioru: kratki zbioru mające sąsiada (4) poza nim"""
    return {(x, y) for (x, y) in cells if any((x + dx, y + dy) not in cells for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
