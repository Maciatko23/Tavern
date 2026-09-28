# python flags_bfs.py [flags.json] [maps dir]  -> tools/tavern/staging/tileset8_bfs.md
# Does the new tileset-8 flag list change where the player can walk on the other tileset-8 maps? For every map on
# tileset 8 (except the tavern's own): the engine's passability (Game_Map.checkPassage over the four tile layers, the
# star rule, both directions of a step) plus the events that block (the active page "same as characters", not
# through, and ChoppableTree's <Occupy:...> cells), a 4-way flood fill from every place the player arrives
# (transfers from all maps, the new-game start) - with today's flags and with the new ones. Lists every cell whose
# reachability changes and every walkable cell whose own passability changes.
import os, sys, json, re, glob
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
NEW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "staging", "tileset8_flags.json")
DATA = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "data")
SKIP = {1, 25, 26}      # the tavern's own maps (built on the new flags)

def load(p): return json.load(open(p, encoding="utf-8"))

def occupy(e):
    m = re.search(r"<Occupy:([^>]*)>", e.get("note") or "")
    cells = [(e["x"], e["y"])]
    if m:
        kv = {k.strip(): int(v) for k, v in (p.split("=") for p in m.group(1).split(",") if "=" in p)}
        for dy in range(-kv.get("up", 0), kv.get("down", 0) + 1):
            for dx in range(-kv.get("left", 0), kv.get("right", 0) + 1):
                cells.append((e["x"] + dx, e["y"] + dy))
    return cells

def active_page(e):
    for pg in reversed(e["pages"]):
        c = pg["conditions"]
        if not any(c.get(k) for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid")):
            return pg
    return None

class M:
    def __init__(self, m, flags):
        self.m, self.W, self.H, self.f = m, m["width"], m["height"], flags
        self.block = set()
        for e in m["events"]:
            if not e: continue
            pg = active_page(e)
            if pg and pg["priorityType"] == 1 and not pg["through"]:
                for c in occupy(e): self.block.add(c)
    def tiles(self, x, y):
        W, H, d = self.W, self.H, self.m["data"]
        return [d[(z * H + y) * W + x] for z in (3, 2, 1, 0)]
    def check(self, x, y, bit):
        for t in self.tiles(x, y):
            fl = self.f[t] if t < len(self.f) else 0
            if fl is None: fl = 0
            if fl & 0x10: continue
            if (fl & bit) == 0: return True
            if (fl & bit) == bit: return False
        return False
    def passable(self, x, y, d):
        return self.check(x, y, (1 << (d // 2 - 1)) & 0x0F)
    def step(self, x, y, d):
        dx, dy = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}[d]
        nx, ny = x + dx, y + dy
        if not (0 <= nx < self.W and 0 <= ny < self.H): return None
        if not self.passable(x, y, d) or not self.passable(nx, ny, 10 - d): return None
        if (nx, ny) in self.block: return None
        return (nx, ny)
    def reach(self, starts):
        seen = set(starts); todo = list(starts)
        while todo:
            x, y = todo.pop()
            for d in (2, 4, 6, 8):
                n = self.step(x, y, d)
                if n and n not in seen: seen.add(n); todo.append(n)
        return seen
    def standable(self, x, y):
        return any(self.passable(x, y, d) for d in (2, 4, 6, 8)) and (x, y) not in self.block

def arrivals(mid, maps, system):
    out = set()
    for oid, om in maps.items():
        for e in om["events"]:
            if not e: continue
            for pg in e["pages"]:
                for c in pg["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == mid:
                        out.add((c["parameters"][2], c["parameters"][3]))
    if system["startMapId"] == mid: out.add((system["startX"], system["startY"]))
    return out

def main():
    ts = load(os.path.join(DATA, "Tilesets.json"))
    old, new = ts[8]["flags"], load(NEW)
    maps = {}
    for p in sorted(glob.glob(os.path.join(DATA, "Map[0-9][0-9][0-9].json"))):
        maps[int(os.path.basename(p)[3:6])] = load(p)
    system = load(os.path.join(DATA, "System.json"))
    lines = ["# Tileset 8 flags: walkability of the other tileset-8 maps, today vs the new flags", "",
             "Engine passability (4 tile layers, star rule, both directions) + blocking events (active page, same as "
             "characters, not through, `<Occupy>`), 4-way flood fill from every arrival point.", ""]
    total_changes = 0
    for mid, m in sorted(maps.items()):
        if m["tilesetId"] != 8 or mid in SKIP: continue
        a, b = M(m, old), M(m, new)
        starts = sorted(arrivals(mid, maps, system))
        note = ""
        if not starts:
            # entered by a plugin (the hut) or not linked yet: start from every floor cell (A4 floor kinds, A5)
            def floorish(x, y):
                t = m["data"][y * m["width"] + x]
                if t >= 2048:
                    k = (t - 2048) // 48
                    return k >= 80 and ((k - 80) // 8) % 2 == 0
                return 1536 <= t < 1664
            starts = sorted((x, y) for y in range(m["height"]) for x in range(m["width"]) if floorish(x, y) and (x, y) not in a.block)
            note = " (no transfer leads here: flood from every floor cell)"
        ra, rb = a.reach(starts), b.reach(starts)
        lost, gained = sorted(ra - rb), sorted(rb - ra)
        own = sorted((x, y) for y in range(m["height"]) for x in range(m["width"]) if a.standable(x, y) != b.standable(x, y))
        own_reached = [c for c in own if c in ra or c in rb]
        total_changes += len(lost) + len(gained)
        lines.append("## Map%03d %s (%dx%d, %d events)" % (mid, m.get("displayName") or "", m["width"], m["height"], len([e for e in m["events"] if e])))
        lines.append("- arrivals: %s%s" % ((", ".join("(%d,%d)" % c for c in starts) if not note else "%d floor cells" % len(starts)), note))
        lines.append("- reachable cells: %d today, %d with the new flags" % (len(ra), len(rb)))
        lines.append("- no longer reachable: %s" % (", ".join("(%d,%d)" % c for c in lost) or "none"))
        lines.append("- newly reachable: %s" % (", ".join("(%d,%d)" % c for c in gained) or "none"))
        lines.append("- cells whose own passability changes (inside the reachable area): %s" % (", ".join("(%d,%d)" % c for c in own_reached) or "none"))
        lines.append("- the same, anywhere on the map (mostly walls that were walkable and now block): %d" % len(own))
        lines.append("")
        print("Map%03d: reach %d -> %d, lost %d, gained %d, own changes %d (%d in the reachable area)" % (mid, len(ra), len(rb), len(lost), len(gained), len(own), len(own_reached)))
    lines.append("Total reachability changes: %d" % total_changes)
    out = os.path.join(HERE, "staging", "tileset8_bfs.md")
    with open(out, "wb") as f: f.write("\n".join(lines).encode("utf-8"))
    print("wrote", out)

if __name__ == "__main__":
    main()
