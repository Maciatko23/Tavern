# -*- coding: utf-8 -*-
"""Tawerna 2 (2026-11-08): the stamp library. New tavern maps are composed from rectangles cut out of the OLD maps (snapshot in
tools/tawerna2/old/): every layer (0-3 tiles, 4 shadow, 5 region) and every event inside the rectangle, moved by (dx, dy).
Event ids of the old map are kept (several commands refer to their neighbours by id: 205 "set move route"), a duplicate gets a
new id. Transfers (201) to the same map are moved with the stamp. Nothing here writes data/."""
import os, sys, json, copy, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
sys.path.insert(0, os.path.join(ROOT, "tools", "interiors"))
sys.path.insert(0, os.path.join(ROOT, "tools", "town"))
import wspolne as W   # noqa: E402  (map_text = the editor's layout)
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

OLD = os.path.join(HERE, "old")
STAGING = os.path.join(HERE, "staging")
_cache = {}
def old(n):
    if n not in _cache: _cache[n] = json.load(open(os.path.join(OLD, "Map%03d.json" % n), encoding="utf-8"))
    return _cache[n]

class Canvas:
    def __init__(self, mid, w, h, like):
        self.id, self.W, self.H = mid, w, h
        src = old(like)
        self.props = {k: copy.deepcopy(v) for k, v in src.items() if k not in ("data", "events")}
        self.props["width"], self.props["height"] = w, h
        self.data = [0] * (w * h * 6)
        self.events = {}          # id -> event dict
        self.log = []
    # ---- tiles
    def i(self, z, x, y): return (z * self.H + y) * self.W + x
    def get(self, z, x, y): return self.data[self.i(z, x, y)]
    def put(self, z, x, y, v):
        if 0 <= x < self.W and 0 <= y < self.H: self.data[self.i(z, x, y)] = v
    reserved = set()
    def free_id(self, start=100):
        i = start
        while i in self.events or i in self.reserved: i += 1
        return i
    def add_event(self, e, x, y, keep_id=True):
        e = copy.deepcopy(e)
        if not keep_id or not e.get("id") or e["id"] in self.events:
            e["id"] = self.free_id()
        e["x"], e["y"] = x, y
        self.events[e["id"]] = e
        return e
    # ---- stamping
    def stamp(self, src, rect, dx, dy, ev_rect=None, layers=range(6), skip_zero=False, ev_skip=(), ev_ids=None, retarget=True):
        """copy src map's rect (x0, y0, x1, y1 inclusive) so that its top-left lands at rect.x0+dx; events inside ev_rect (default rect)
        keep their ids. skip_zero: tile 0 of the source does not erase what is there (for pieces laid over a floor)."""
        m = old(src) if isinstance(src, int) else src
        sid = src if isinstance(src, int) else None
        x0, y0, x1, y1 = rect
        Wd, Ht, d = m["width"], m["height"], m["data"]
        for z in layers:
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    v = d[(z * Ht + y) * Wd + x]
                    if v == 0 and skip_zero: continue
                    self.put(z, x + dx, y + dy, v)
        ex0, ey0, ex1, ey1 = ev_rect or rect
        got = []
        for e in m["events"]:
            if not e or e["id"] in ev_skip: continue
            if ev_ids is not None and e["id"] not in ev_ids: continue
            if not (ex0 <= e["x"] <= ex1 and ey0 <= e["y"] <= ey1): continue
            ne = self.add_event(e, e["x"] + dx, e["y"] + dy)
            if retarget and sid is not None: self._retarget(ne, sid, (ex0, ey0, ex1, ey1), dx, dy)
            got.append(ne)
        return got
    def _retarget(self, e, sid, r, dx, dy):
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == self.id_for(sid):
                    tx, ty = c["parameters"][2], c["parameters"][3]
                    if r[0] <= tx <= r[2] and r[1] - 8 <= ty <= r[3] + 8:
                        c["parameters"][2], c["parameters"][3] = tx + dx, ty + dy
    def id_for(self, sid): return self.id if sid == self.id else sid
    def fill(self, z, x0, y0, x1, y1, v):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.put(z, x, y, v)
    def clear_events(self, x0, y0, x1, y1, pred=None):
        for k in [k for k, e in self.events.items() if x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1 and (pred is None or pred(e))]:
            del self.events[k]
    # ---- events
    def find(self, name_re=None, note_re=None):
        out = []
        for e in self.events.values():
            if name_re and not re.search(name_re, e["name"]): continue
            if note_re and not re.search(note_re, e["note"] + json.dumps(e["pages"][0]["list"], ensure_ascii=False)): continue
            out.append(e)
        return out
    def rename_numbers(self, ids, mapping):
        """in the names / tag comments of events `ids`: 'Pokój N', '(N)', 'room=N' with N renumbered"""
        for i in ids:
            e = self.events[i]
            def sub(s):
                s = re.sub(r"(Pokój(?: nr)?) (\d+)", lambda m_: "%s %d" % (m_.group(1), mapping.get(int(m_.group(2)), int(m_.group(2)))), s)
                s = re.sub(r"\((\d+)\)", lambda m_: "(%d)" % mapping.get(int(m_.group(1)), int(m_.group(1))), s)
                s = re.sub(r"room=(\d+)", lambda m_: "room=%d" % mapping.get(int(m_.group(1)), int(m_.group(1))), s)
                return s
            e["name"] = sub(e["name"]); e["note"] = sub(e["note"])
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] in (108, 408, 401): c["parameters"][0] = sub(c["parameters"][0])
    def void_fill(self, kind=25):
        """layer 0 cells nobody painted get the void autotile (kind 25) with the editor's shapes next to the boxes"""
        base = 2048 + kind * 48
        cells = []
        for y in range(self.H):
            for x in range(self.W):
                v = self.get(0, x, y)
                if v == 0: self.put(0, x, y, base); cells.append((x, y))
                elif (v - 2048) // 48 == kind if v >= 2048 else False: cells.append((x, y))
        W.reshape({"width": self.W, "height": self.H, "data": self.data}, 0, cells)
    # ---- output
    def text(self):
        ev = [None] + [self.events[k] for k in sorted(self.events)]
        # the editor keeps ids in order with None gaps: id i at index i
        top = max(self.events) if self.events else 0
        arr = [None] * (top + 1)
        for k, e in self.events.items(): arr[k] = e
        m = dict(self.props); m["data"] = self.data; m["events"] = arr
        return W.map_text(m)
    def save(self, name=None):
        os.makedirs(os.path.join(STAGING, "data"), exist_ok=True)
        p = os.path.join(STAGING, "data", name or "Map%03d.json" % self.id)
        open(p, "wb").write(self.text().encode("utf-8"))
        return p

def render(canvas_or_path, out, crop=None, scale=1.0):
    import irender as I, mzrender as R
    m = R.load_json(canvas_or_path) if isinstance(canvas_or_path, str) else (canvas_or_path if isinstance(canvas_or_path, dict) else json.loads(canvas_or_path.text()))
    img = I.render(m)
    if crop: img = img.crop((crop[0] * 48, crop[1] * 48, (crop[2] + 1) * 48, (crop[3] + 1) * 48))
    if scale != 1: img = img.resize((int(img.width * scale), int(img.height * scale)))
    img.save(out)
    return img
