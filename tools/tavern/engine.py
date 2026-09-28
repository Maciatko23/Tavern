# The engine's walking rules in Python, for the generators and the checks (no game needed):
#   Game_Map.checkPassage over the four tile layers from the top (a star tile has no effect on passage), both directions
#   of a step (Game_CharacterBase.isMapPassable), and the events that block: the active page "same as characters", not
#   through, plus ChoppableTree's <Occupy:left=,right=,up=,down=> cells.
import re

def occupy_cells(x, y, note):
    cells = [(x, y)]
    m = re.search(r"<Occupy:([^>]*)>", note or "")
    if m:
        kv = {k.strip(): int(v) for k, v in (p.split("=") for p in m.group(1).split(",") if "=" in p)}
        for dy in range(-kv.get("up", 0), kv.get("down", 0) + 1):
            for dx in range(-kv.get("left", 0), kv.get("right", 0) + 1):
                cells.append((x + dx, y + dy))
    return cells

def active_page(e):
    for pg in reversed(e["pages"]):
        c = pg["conditions"]
        if not any(c.get(k) for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid")):
            return pg
    return None

class Engine:
    def __init__(self, W, H, data, flags, events):
        self.W, self.H, self.data, self.f = W, H, data, flags
        self.block = set()
        for e in events:
            if not e: continue
            pg = active_page(e)
            if pg and pg["priorityType"] == 1 and not pg["through"]:
                for c in occupy_cells(e["x"], e["y"], e.get("note")): self.block.add(c)
    def tiles(self, x, y):
        W, H, d = self.W, self.H, self.data
        return [d[(z * H + y) * W + x] for z in (3, 2, 1, 0)]
    def check(self, x, y, bit):
        for t in self.tiles(x, y):
            fl = self.f[t] if t < len(self.f) else 0
            if fl & 0x10: continue
            if (fl & bit) == 0: return True
            if (fl & bit) == bit: return False
        return False
    def passable(self, x, y, d):
        return self.check(x, y, (1 << (d // 2 - 1)) & 0x0F)
    def tile_open(self, x, y):
        """the tiles let the player stand here (some direction passable)"""
        return any(self.passable(x, y, d) for d in (2, 4, 6, 8))
    def step(self, x, y, d):
        dx, dy = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}[d]
        nx, ny = x + dx, y + dy
        if not (0 <= nx < self.W and 0 <= ny < self.H): return None
        if not self.passable(x, y, d) or not self.passable(nx, ny, 10 - d): return None
        if (nx, ny) in self.block: return None
        return (nx, ny)
    def reach(self, starts, ignore=()):
        ign = set(ignore)
        seen = set(starts); todo = list(starts)
        saved = self.block
        self.block = self.block - ign
        while todo:
            x, y = todo.pop()
            for d in (2, 4, 6, 8):
                n = self.step(x, y, d)
                if n and n not in seen: seen.add(n); todo.append(n)
        self.block = saved
        return seen
    def standable(self, x, y):
        return self.tile_open(x, y) and (x, y) not in self.block
