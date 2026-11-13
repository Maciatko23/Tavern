# -*- coding: utf-8 -*-
"""Wspólne klocki budowy Kruczogrodu: warstwy kafli z autokaflami, rejestr kawałków zestawu 13, zdarzenia, zapis mapy, podgląd (bez gry)."""
import os, sys, json, copy, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
sys.path.insert(0, HERE)
from nslib import floor_shape, wall_shape, is_wall_kind, write_map, noise, lowfreq   # noqa: E402
import mapylib   # noqa: E402
import kit       # noqa: E402

W = H = 120
STAGING = HERE.replace("\\", "/") + "/staging/"
UK = json.load(open(HERE + "/uklad.json", encoding="utf-8"))


def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))


class Layers:
    """cztery warstwy kafli: (x, y) -> ("k", rodzaj autokafla) | ("t", numer kafla)"""

    def __init__(self, w=W, h=H):
        self.W, self.H = w, h
        self.L = [dict() for _ in range(4)]
        self.region = {}

    def inside(self, x, y): return 0 <= x < self.W and 0 <= y < self.H

    def kind(self, z, cells, k):
        for c in cells:
            if self.inside(*c): self.L[z][c] = ("k", k)

    def tile(self, z, x, y, t):
        if self.inside(x, y): self.L[z][(x, y)] = ("t", t)

    def clear(self, z, cells):
        for c in cells: self.L[z].pop(c, None)

    def put(self, key, x, y, z=2, anchor="tl", skip=()):
        """kawałek zestawu 13; (x, y) = lewy górny róg (anchor 'tl') albo kratka drzwi (anchor 'door'); tylko niepuste kafle"""
        u = UK[key]
        if anchor == "door":
            dx, dy = u["drzwi"]; x, y = x - dx, y - dy
        for j, row in enumerate(u["kafle"]):
            for i, t in enumerate(row):
                if (i, j) in skip: continue
                if not self.cell_has_pixels(key, i, j): continue
                self.tile(z, x + i, y + j, t)
        return x, y

    _px = {}

    def cell_has_pixels(self, key, i, j):
        k = (key, i, j)
        if k not in Layers._px:
            Layers._px[k] = piece_cov(key, i, j) > 0.02
        return Layers._px[k]

    def resolve(self):
        data = [0] * (self.W * self.H * 6)
        n = self.W * self.H
        for z in range(4):
            lay = self.L[z]
            for (x, y), (t, v) in lay.items():
                if t == "t":
                    data[z * n + y * self.W + x] = v
                    continue

                def same(dx, dy, x=x, y=y, v=v, lay=lay):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= self.W or ny >= self.H: return True
                    return lay.get((nx, ny)) == ("k", v)
                shape = wall_shape(same) if is_wall_kind(v) else floor_shape(same)
                data[z * n + y * self.W + x] = 2048 + v * 48 + shape
        for (x, y), v in self.region.items(): data[5 * n + y * self.W + x] = v
        return data


_pc = {}


def piece_cov(key, i, j):
    """czy kratka kawałka ma jakiekolwiek piksele (z arkusza zestawu; pozycja z numeru kafla, więc też dla kawałków z dwóch połówek)"""
    from PIL import Image
    import numpy as np
    t = UK[key]["kafle"][j][i]
    s = kit.SHEETS[t // 256]
    w = t % 256
    c, r = (w // 128) * 8 + w % 8, (w % 128) // 8
    if s not in _pc: _pc[s] = np.asarray(Image.open(kit.OUT_IMG + "Miasto_%s.png" % s).convert("RGBA"))[..., 3]
    a = _pc[s]
    return float((a[r * 48:(r + 1) * 48, c * 48:(c + 1) * 48] > 16).mean())


def zestaw13():
    """Zestaw (mapylib) tilesetu 13 z wersji w staging (flagi, arkusze)"""
    ts = load(STAGING + "data/Tilesets.json")[13]
    z = mapylib.Zestaw(11)
    z.id, z.nazwa, z.pliki = 13, ts["name"], ts["tilesetNames"]
    z.flags = list(ts["flags"]) + [0] * (8192 - len(ts["flags"]))
    z._sheets, z._tiles, z._alpha, z._bbox = {}, {}, {}, {}
    return z


def mapa_z(raw, mid=8):
    """Mapa (mapylib) z surowego słownika z zestawem 13 (do podglądu i sprawdzeń)"""
    mp = mapylib.Mapa(mid, raw=raw)
    mp.zest = zestaw13()
    return mp


def dump(o): return json.dumps(o, ensure_ascii=False, separators=(",", ":"))
