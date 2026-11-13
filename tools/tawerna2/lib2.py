# -*- coding: utf-8 -*-
"""Tawerna 2, second method (2026-11-08): whole pieces CUT out of the old maps (tiles of all six layers + events, exactly as they are),
optionally GROWN by repeating a plain column / row (so bands get equal widths / heights), then placed side by side on a Canvas.
The 1-cell dark lines between rooms are the void autotile (kind 25): after placing, every floor-type autotile of layers 0/1 is re-shaped
(W.reshape = the editor's own shapes) so the joins come out like the editor's. Nothing here writes data/."""
import copy
import lib
from lib import W

def _k(v): return ('k', (v - 2048) // 48) if v >= 2048 else ('t', v)

class Piece:
    def __init__(self, src, rect, ev_rect=None, name=""):
        m = src if isinstance(src, dict) else lib.old(src)
        self.src, self.rect, self.name = (None if isinstance(src, dict) else src), rect, name
        x0, y0, x1, y1 = rect
        self.w, self.h = x1 - x0 + 1, y1 - y0 + 1
        Wd, Ht, d = m["width"], m["height"], m["data"]
        self.t = [[[d[(z * Ht + y) * Wd + x] for x in range(x0, x1 + 1)] for y in range(y0, y1 + 1)] for z in range(6)]
        ex0, ey0, ex1, ey1 = ev_rect or rect
        self.ev = [copy.deepcopy(e) for e in m["events"] if e and ex0 <= e["x"] <= ex1 and ey0 <= e["y"] <= ey1]
        self.cols = []          # (after_old_x, n): n copies inserted after that old x
        self.rows = []
    # ---- coordinates: old absolute -> piece-relative (after growth)
    def rel(self, x, y):
        rx = x - self.rect[0] + sum(n for c, n in self.cols if x > c)
        ry = y - self.rect[1] + sum(n for c, n in self.rows if y > c)
        return rx, ry
    def _cur_col(self, old_x): return self.rel(old_x, self.rect[1])[0]
    def _cur_row(self, old_y): return self.rel(self.rect[0], old_y)[1]
    def _evcells(self):
        return {(e["x"], e["y"]) for e in self.ev}
    # ---- growing: insert n copies of column c / row r (layers 0,1 copied - floors and rugs just get bigger; layers 2-5 left empty).
    # A place is SAFE when no object on layers 2/3 is chained across it (a tile and its right / lower neighbour in the sheet).
    def _chain_h(self, c, y):
        for z in (2, 3):
            a, b = self.t[z][y][c], self.t[z][y][c + 1]
            if a and b and b == a + 1 and (a & 7) != 7: return True
        return False
    def _chain_v(self, r, x):
        for z in (2, 3):
            a, b = self.t[z][r][x], self.t[z][r + 1][x]
            if a and b and b == a + 8: return True
        return False
    def safe_cols(self):
        """columns c (1 <= c <= w-3) after which a plain strip can be inserted"""
        evx = {self.rel(e["x"], e["y"])[0] for e in self.ev}
        return [c for c in range(1, self.w - 2) if not any(self._chain_h(c, y) for y in range(self.h))
                and not any(self.t[z][y][c] and self.t[z][y][c + 1] for z in (4,) for y in range(self.h))]
    def safe_rows(self):
        return [r for r in range(1, self.h - 2) if not any(self._chain_v(r, x) for x in range(self.w))]
    def grow_cols(self, n, near=None):
        if n <= 0: return self
        cand = self.safe_cols()
        if not cand: raise ValueError("%s: no safe column to grow" % self.name)
        near = self.w // 2 if near is None else near
        c = min(cand, key=lambda k: abs(k - near))
        for z in range(6):
            for y in range(self.h):
                row = self.t[z][y]; row[c + 1:c + 1] = [row[c] if z < 2 else 0] * n
        old_x = self.rect[0] + c - sum(nn for cc, nn in self.cols if cc < self.rect[0] + c)
        self.cols.append((old_x, n)); self.w += n
        return self
    def grow_rows(self, n, near=None):
        if n <= 0: return self
        cand = self.safe_rows()
        if not cand: raise ValueError("%s: no safe row to grow" % self.name)
        near = self.h // 2 if near is None else near
        r = min(cand, key=lambda k: abs(k - near))
        for z in range(6):
            self.t[z][r + 1:r + 1] = [[(v if z < 2 else 0) for v in self.t[z][r]] for _ in range(n)]
        old_y = self.rect[1] + r - sum(nn for cc, nn in self.rows if cc < self.rect[1] + r)
        self.rows.append((old_y, n)); self.h += n
        return self
    # ---- shrinking: remove plain strips (nothing on layers 2-5, no event there, floor/rug identical to the neighbour strip)
    def _plain_col(self, c):
        if c < 1 or c > self.w - 2: return False
        evx = {self.rel(e["x"], e["y"])[0] for e in self.ev}
        if c in evx: return False
        if any(self.t[z][y][c] for z in (2, 3, 4, 5) for y in range(self.h)): return False
        for z in (0, 1):
            if not all(_k(self.t[z][y][c]) == _k(self.t[z][y][c + 1]) for y in range(self.h)): return False
        return True
    def _plain_row(self, r):
        if r < 1 or r > self.h - 2: return False
        evy = {self.rel(e["x"], e["y"])[1] for e in self.ev}
        if r in evy: return False
        if any(self.t[z][r][x] for z in (2, 3, 4, 5) for x in range(self.w)): return False
        for z in (0, 1):
            if not all(_k(self.t[z][r][x]) == _k(self.t[z][r + 1][x]) for x in range(self.w)): return False
        return True
    def plain_cols_s(self): return [c for c in range(1, self.w - 1) if self._plain_col(c)]
    def plain_rows_s(self): return [r for r in range(1, self.h - 1) if self._plain_row(r)]
    def shrink_cols(self, n, near=None):
        done = 0
        while done < n:
            cand = self.plain_cols_s()
            if not cand: break
            near_ = self.w // 2 if near is None else near
            c = min(cand, key=lambda k: abs(k - near_))
            for z in range(6):
                for y in range(self.h): del self.t[z][y][c]
            old_x = self.rect[0] + c + sum(1 for cc, nn in self.cols if nn < 0 and cc < self.rect[0] + c) - sum(nn for cc, nn in self.cols if nn > 0 and cc < self.rect[0] + c)
            self.cols.append((old_x, -1)); self.w -= 1; done += 1
        return done
    def shrink_rows(self, n, near=None):
        done = 0
        while done < n:
            cand = self.plain_rows_s()
            if not cand: break
            near_ = self.h // 2 if near is None else near
            r = min(cand, key=lambda k: abs(k - near_))
            for z in range(6): del self.t[z][r]
            old_y = self.rect[1] + r + sum(1 for cc, nn in self.rows if nn < 0 and cc < self.rect[1] + r) - sum(nn for cc, nn in self.rows if nn > 0 and cc < self.rect[1] + r)
            self.rows.append((old_y, -1)); self.h -= 1; done += 1
        return done
    def drop_events(self, pred):
        self.ev = [e for e in self.ev if not pred(e)]
    # ---- placing
    def place(self, c, ox, oy, retarget=True):
        """top-left of the piece on canvas c at (ox, oy); returns the placed events. Transfers that point inside this map's own piece
        are moved with it (T: old coordinates -> new)."""
        for z in range(6):
            for y in range(self.h):
                for x in range(self.w): c.put(z, ox + x, oy + y, self.t[z][y][x])
        placed = []
        for e in self.ev:
            rx, ry = self.rel(e["x"], e["y"])
            ne = c.add_event(e, ox + rx, oy + ry)
            ne.pop("_dx", None); ne.pop("_dy", None)
            if retarget:
                for p in ne["pages"]:
                    for cmd in p["list"]:
                        if cmd["code"] == 201 and cmd["parameters"][0] == 0 and cmd["parameters"][1] == self.src:
                            tx, ty = cmd["parameters"][2], cmd["parameters"][3]
                            if self.rect[0] <= tx <= self.rect[2] and self.rect[1] - 8 <= ty <= self.rect[3] + 8:
                                rx2, ry2 = self.rel(tx, ty)
                                cmd["parameters"][2], cmd["parameters"][3] = ox + rx2, oy + ry2
                                cmd["parameters"][1] = c.id
            placed.append(ne)
        return placed

def reshape_all(c):
    """re-shape every floor-type autotile of layers 0 and 1 (the dark lines between rooms are kind 25) - the joins come out like the editor's"""
    for z in (0, 1):
        cells = []
        for y in range(c.H):
            for x in range(c.W):
                v = c.get(z, x, y)
                if v >= 2048 and W.shapes_by_floor((v - 2048) // 48): cells.append((x, y))
        W.reshape({"width": c.W, "height": c.H, "data": c.data}, z, cells)

def void_cells(c):
    """layer-0 cells that nobody painted (tile 0): a rectangle must have none"""
    return [(x, y) for y in range(c.H) for x in range(c.W) if c.get(0, x, y) == 0]
