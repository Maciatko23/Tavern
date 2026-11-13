# -*- coding: utf-8 -*-
"""Winlu buildings as small tile grids (tileset 11) cut from the old town map and edited, rendered to a transparent picture.
Grid: 4 tile layers (absolute tile ids) + sprites (images placed in pixels).  Used by zbuduj5.py."""
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'mapy')); import mapylib
from PIL import Image
T = 48
OLD = os.path.join(os.path.dirname(ROOT), 'Tawerna_archiwum_2026-11-08', 'kruczogrod_miasto_20261108_154456', 'data', 'Map008.json')
_RAW = []
def raw():
    if not _RAW: _RAW.append(json.load(open(OLD, encoding='utf-8')))
    return _RAW[0]
_Z = []
def zest():
    if not _Z: _Z.append(mapylib.Zestaw(11))
    return _Z[0]
def kind(t): return (t - 2048) // 48 if t >= 2048 else None
def shape(t): return (t - 2048) % 48 if t >= 2048 else None
def is_ground(t): return t >= 2048 and kind(t) < 48          # A1/A2 = ground, never part of a building picture
class Grid:
    def __init__(self, w, h):
        self.w, self.h = w, h; self.L = [[[0] * w for _ in range(h)] for _ in range(4)]; self.sprites = []
    def copy(self): return copy.deepcopy(self)
    def get(self, z, x, y): return self.L[z][y][x]
    def set(self, z, x, y, t): self.L[z][y][x] = t
    def insert_cols(self, at, src, n=1):
        """n copies of column src inserted before column at (sprites right of at move right)"""
        for z in range(4):
            for row in self.L[z]:
                c = row[src]; row[at:at] = [c] * n
        for s in self.sprites:
            if s['x'] >= at * T: s['x'] += n * T
        self.w += n
    def insert_rows(self, at, src, n=1):
        for z in range(4):
            r = list(self.L[z][src]); self.L[z][at:at] = [list(r) for _ in range(n)]
        for s in self.sprites:
            if s['y'] >= at * T: s['y'] += n * T
        self.h += n
    def drop_cols(self, a, b):
        for z in range(4):
            for row in self.L[z]: del row[a:b]
        self.sprites = [s for s in self.sprites if not (a * T <= s['x'] < b * T)]
        for s in self.sprites:
            if s['x'] >= b * T: s['x'] -= (b - a) * T
        self.w -= b - a
    def swap_kind(self, k0, k1, z=None):
        for zz in ([z] if z is not None else range(4)):
            for y in range(self.h):
                for x in range(self.w):
                    t = self.L[zz][y][x]
                    if t >= 2048 and kind(t) == k0: self.L[zz][y][x] = 2048 + k1 * 48 + shape(t)
    def clear(self, x0, y0, x1, y1, layers=(1, 2, 3)):
        for z in layers:
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1): self.L[z][y][x] = 0
    def sprite(self, img, px, py, under=False):
        self.sprites.append({'img': img, 'x': px, 'y': py, 'under': under})
    def paste(self, g, dx, dy, layers=(0, 1, 2, 3)):
        for z in layers:
            for y in range(g.h):
                for x in range(g.w):
                    t = g.L[z][y][x]
                    if t and 0 <= x + dx < self.w and 0 <= y + dy < self.h: self.L[z][y + dy][x + dx] = t
        for s in g.sprites: self.sprites.append(dict(s, x=s['x'] + dx * T, y=s['y'] + dy * T))
def cut(x0, y0, x1, y1, events=True, keep_ground=False):
    """the old map's cells x0..x1, y0..y1 (ground tiles dropped) + the sprites of the events standing there (dormers, signs, doors)"""
    m = raw(); W, H = m['width'], m['height']; d = m['data']; g = Grid(x1 - x0 + 1, y1 - y0 + 1)
    for z in range(4):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                t = d[(z * H + y) * W + x]
                if t and (keep_ground or not is_ground(t)): g.L[z][y - y0][x - x0] = t
    if events:
        mp = mapylib.Mapa(8, raw=m)
        for e in mp.zd:
            if not (x0 <= e.x <= x1 and y0 <= e.y <= y1) or not e.widoczne: continue
            if e.char and not e.char.startswith('!'): continue          # people stay out
            sp = e.sprite(zest())
            if sp: g.sprite(sp[0], sp[1] - x0 * T, sp[2] - y0 * T, under=(e.prio == 0))
    return g
def render(g, pad=0):
    S = zest(); im = Image.new('RGBA', (g.w * T, g.h * T + pad), (0, 0, 0, 0))
    for s in g.sprites:
        if s['under']: mapylib._paste(im, s['img'], s['x'], s['y'] + pad)
    for z in range(4):
        for y in range(g.h):
            for x in range(g.w):
                t = g.L[z][y][x]
                if t: im.alpha_composite(S.tile(t), (x * T, y * T + pad))
    for s in sorted([s for s in g.sprites if not s['under']], key=lambda s: s['y'] + s['img'].height):
        mapylib._paste(im, s['img'], s['x'], s['y'] + pad)
    return im
def tile_img(t): return zest().tile(t)
def sheet_part(i, x0, y0, x1, y1):
    """pixels of tileset 11 sheet i (0..8 = A1,A2,A3,A4,A5,B,C,D,E)"""
    return zest().sheet(i).crop((x0, y0, x1, y1))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'newstart'))
import nslib as N
def wall_shape(l, t, r, b): return (1 if l else 0) | (2 if t else 0) | (4 if r else 0) | (8 if b else 0)
def rect_wall(g, z, k, x0, y0, x1, y1):
    """A3 (any) or A4 side kind: wall-type autotile rectangle (one plane, edges on its outline)"""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            g.L[z][y][x] = 2048 + k * 48 + wall_shape(x == x0, y == y0, x == x1, y == y1)
def rect_floor(g, z, k, x0, y0, x1, y1):
    """A4 top kind (floor-type shapes): rectangle"""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            same = lambda dx, dy, x=x, y=y: x0 <= x + dx <= x1 and y0 <= y + dy <= y1
            g.L[z][y][x] = 2048 + k * 48 + N.floor_shape(same)
def roof(g, k, x0, y0, x1, y1, planes=3):
    """a Winlu roof: vertical planes `planes` tiles wide, each with its own outline (like the old town's roofs)"""
    x = x0
    while x <= x1:
        xe = min(x1, x + planes - 1)
        if x1 - xe < 2 and xe != x1: xe = x1
        rect_wall(g, 0, k, x, y0, xe, y1); x = xe + 1
def B(i): return i            # sheet B tile index -> id
def C(i): return 256 + i
def D(i): return 512 + i
def E(i): return 768 + i
