# Wspólne funkcje poprawek brzegu (2026-10-30): morze na krańcach wyspy i wyrównanie wody na łączonych krawędziach.
# Używają ich popraw_krawedzie.py (wyrównanie par) i morze_krance.py (powiększanie map o morze). Pliki w układzie edytora
# (tools/rozszerzenia/wspolne.py), zapis tylko przy zamkniętym edytorze i po sprawdzeniu, że gracz plików nie zmienił.
import os, sys, json, math, random, copy, hashlib
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

SEA = 6                                   # the A1 kind of the sea on the island's maps (tileset 11: kind 6 = salt sea)
def sea_tile(k=SEA): return 2048 + 48 * k
def is_water_tile(t): return 2048 <= t < 2816 and not (2048 + 96 <= t < 2048 + 192)


class Plik:
    """a map file as read at the start: the object, its layout and the bytes (to see at the end that the player did not change it)"""
    def __init__(self, mid, z_kopii=False):
        """z_kopii: the map is built again from the original in backup_art_2026-10-30/brzegi/ (the file on disk is only checked for changes)"""
        self.mid = mid
        self.rel = "data/Map%03d.json" % mid
        self.path = os.path.join(ROOT, self.rel)
        self.raw0 = open(self.path, "rb").read()
        self.m, self.layout = W.read_json(self.rel)
        if z_kopii:
            bak = os.path.join(ROOT, "backup_art_2026-10-30", "brzegi", "Map%03d.json" % mid)
            self.m = json.loads(open(bak, "rb").read().decode("utf-8"))
        self.orig = copy.deepcopy(self.m)
    def zmieniony_przez_gracza(self):
        return open(self.path, "rb").read() != self.raw0
    def zapisz(self, backup_dir):
        W.need_editor_closed()
        if self.zmieniony_przez_gracza(): raise SystemExit("STOP: %s zmieniony w międzyczasie (gracz?) - nie nadpisuję" % self.rel)
        os.makedirs(backup_dir, exist_ok=True)
        bak = os.path.join(backup_dir, os.path.basename(self.path))
        if not os.path.exists(bak): open(bak, "wb").write(self.raw0)
        open(self.path, "wb").write(W.json_text(self.m, self.layout))


def water_at(m, x, y):
    return any(is_water_tile(W.at(m, z, x, y)) for z in (0, 1))


def carve(m, cells, kind=SEA):
    """sea in these cells: layer 0 the sea autotile, layers 1-3 and the shadow layer emptied (nothing floats on the water)"""
    for (x, y) in cells:
        if not (0 <= x < m["width"] and 0 <= y < m["height"]): continue
        W.put(m, 0, x, y, sea_tile(kind))
        for z in (1, 2, 3, 4): W.put(m, z, x, y, 0)


def reshape_around(m, cells, r=1):
    """the editor's shapes of the autotiles of the layers 0 and 1 around the changed cells (water and the land at the shore)"""
    rc = W.ring(set(cells), r)
    W.reshape(m, 0, rc)
    W.reshape(m, 1, [c for c in rc if 0 <= c[0] < m["width"] and 0 <= c[1] < m["height"] and W.kind_of(W.at(m, 1, *c)) is not None
                      and 2048 <= W.at(m, 1, *c) < 4352 and not is_water_tile(W.at(m, 1, *c))])


def events_at(m):
    return {(e["x"], e["y"]): e for e in m["events"] if e}


def blocked_tile(m, x, y):
    """tiles the hero cannot stand on (water, or a layer-2/3 object); cheap approximation for placing events"""
    return water_at(m, x, y) or W.at(m, 2, x, y) != 0 or W.at(m, 3, x, y) != 0


def evacuate(m, cells, keep_ids=(), avoid=(), radius=9):
    """events standing in cells (now water) go to the nearest dry free cell; returns [(id, name, from, to)]"""
    cells = set(cells)
    ev = events_at(m)
    taken = set(ev)
    moved = []
    near_edge = lambda x, y: min(x, y, m["width"] - 1 - x, m["height"] - 1 - y) < 2
    for e in sorted([e for e in m["events"] if e and (e["x"], e["y"]) in cells], key=lambda e: e["id"]):
        if e["id"] in keep_ids: continue
        best = None
        for r in range(1, radius + 1):
            cand = []
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r: continue
                    x, y = e["x"] + dx, e["y"] + dy
                    if not (0 <= x < m["width"] and 0 <= y < m["height"]): continue
                    if (x, y) in taken or (x, y) in cells or blocked_tile(m, x, y) or near_edge(x, y) or (x, y) in avoid: continue
                    if any(water_at(m, x + ax, y + ay) for ax in (-1, 0, 1) for ay in (-1, 0, 1)): continue   # one tile off the water
                    cand.append((abs(dx) + abs(dy), x, y))
            if cand: best = min(cand); break
        if best is None: raise SystemExit("STOP: nie ma gdzie przenieść zdarzenia %d %s z (%d,%d)" % (e["id"], e["name"], e["x"], e["y"]))
        moved.append((e["id"], e["name"], (e["x"], e["y"]), (best[1], best[2])))
        taken.discard((e["x"], e["y"])); taken.add((best[1], best[2]))
        e["x"], e["y"] = best[1], best[2]
    return moved


# ------------------------------------------------------------------ smooth 1-D / 2-D noise (deterministic)
def _h(i, seed): return random.Random(i * 7919 + seed * 104729).random()
def noise1(v, scale, seed):
    f = v / scale; i = math.floor(f); a = f - i
    a = a * a * (3 - 2 * a)
    return _h(i, seed) * (1 - a) + _h(i + 1, seed) * a
def smooth(a): a = max(0.0, min(1.0, a)); return a * a * (3 - 2 * a)
