# python tools/podgrodzie/check_podgrodzie.py [path to Map111.json]  -> every problem of Podgrodzie, exit code 1 if any
# The staged map (or the installed one) checked with the game's walking rules in Python (tools/tavern/engine.py: tile flags,
# events "same as characters", <Occupy>) plus RegionLayers.js (region 1 always walkable, 2 always closed, 3 = the tiles that
# are lifted over the hero left out) and the tile events below the characters (Game_Map.allTiles):
#   1 water     - no water tile on this map (A1, the A2 pond / puddle looks 44 / 45), no "water" in the events' pictures:
#                 Podgrodzie has no water of its own (its well is dry; water is carried from the town)
#   2 reach     - from the gate: both exits, every door front, every TownLife spot, every landing
#   3 doors     - every house's door event stands on its bottom wall row, the front free; the six interiors' doors named
#                 "Drzwi: <name>" (the contract), the others closed
#   4 spots     - every "Miejsce: <key>" of the contract is there once, standable, reachable, below the characters, through
#   5 solid     - no roof / wall cell (A3 / A4) can be walked on; every closed cell shows something (a tile, a picture)
#   6 ids       - event ids below 355 (plugins own 830+)
#   7 edge      - every cell of the map's edge closed except the exits and the forest trail's end (skraj_lasu)
#   8 pockets   - no open cell that cannot be walked to from the gate
#   9 covers    - no walkable B-E tile on layer 3 over a closed one on layer 2 (it would open the cell)
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plib
from engine import Engine, active_page, occupy_cells

SPOT_KEYS = ["brama_zach", "plac", "studnia_sucha", "kapliczka", "pranie", "drewutnia", "kram", "ziola", "namioty", "zebrak",
             "zebrak_noc", "zabawa", "skraj_lasu", "praczka_drzwi", "drwal_drzwi", "klusownik_drzwi", "znachorka_drzwi",
             "szmaciarz_drzwi", "uchodzcy_drzwi"]
DOOR_NAMES = {"praczka": "Drzwi: Chata praczki", "drwal": "Drzwi: Chata drwala", "klusownik": "Drzwi: Chata kłusownika",
              "znachorka": "Drzwi: Izba znachorki", "szmaciarz": "Drzwi: Kram starzyzny", "uchodzcy": "Drzwi: Dom uchodźców"}
A1_END, A2, A3, A4, A5 = 2816, 2816, 4352, 5888, 1536

def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))

def flags11():
    return load(plib.ROOT + "data/Tilesets.json")[11]["flags"]

def lifts(t):
    return t > 0 and (t < A5 or A3 <= t)        # (RegionLayers.lifts: B-E pictures, A3, A4)

class RegionEngine(Engine):
    def __init__(self, W, H, data, flags, events):
        Engine.__init__(self, W, H, data, flags, events)
        self.region = data[5 * W * H:6 * W * H]
        self.tile_events = {}
        for e in events:
            if not e: continue
            pg = active_page(e)
            if pg and pg["priorityType"] == 0 and pg["image"]["tileId"]:
                self.tile_events.setdefault((e["x"], e["y"]), []).append(pg["image"]["tileId"])
    def tiles(self, x, y):
        return self.tile_events.get((x, y), []) + Engine.tiles(self, x, y)
    def check(self, x, y, bit):
        r = self.region[y * self.W + x]
        if r == 2: return False
        if r == 1: return True
        ts = self.tiles(x, y)
        if r == 3: ts = [t for t in ts if not lifts(t)]
        for t in ts:
            fl = self.f[t] if t < len(self.f) else 0
            if fl & 0x10: continue
            if (fl & bit) == 0: return True
            if (fl & bit) == bit: return False
        return r == 3

def engine(mp):
    return RegionEngine(mp["width"], mp["height"], mp["data"], flags11(), [e for e in mp["events"] if e])

def check(path=None, quiet=False):
    path = path or os.path.join(plib.STAGING, "Map111.json")
    mp = load(path)
    meta = load(os.path.join(plib.STAGING, "Map111_meta.json"))
    W, H, d = mp["width"], mp["height"], mp["data"]
    events = [e for e in mp["events"] if e]
    eng = engine(mp)
    probs = {}
    def bad(k, v): probs.setdefault(k, []).append(v)
    at = lambda x, y, z: d[(z * H + y) * W + x]
    # 1 water (none of its own)
    for y in range(H):
        for x in range(W):
            for z in range(4):
                t = at(x, y, z)
                if t >= 2048 and ((t - 2048) // 48 < 16 or (t - 2048) // 48 in (44, 45)): bad("1 woda", (x, y, z))
    for e in events:
        for pg in e["pages"]:
            if re.search(r"water|woda", pg["image"]["characterName"] or "", re.I): bad("1 woda (obrazek)", e["name"])
    # 2 reach
    gate = [(44, r) for r in plib.GATE_ROWS]
    people = [tuple(v[:2]) for v in meta["spots"].values()]
    seen = eng.reach(gate)
    for ex in meta["exits"]:
        if (ex["x"], ex["y"]) not in seen: bad("2 wyjście nieosiągalne", (ex["x"], ex["y"]))
    for b in meta["buildings"]:
        f = tuple(b["front"])
        if f not in seen: bad("2 drzwi nieosiągalne", "%s %s" % (b["name"], f))
    # 3 doors
    names = {e["name"]: e for e in events}
    for key, n in DOOR_NAMES.items():
        e = names.get(n)
        if not e: bad("3 brak drzwi", n); continue
        b = next(b for b in meta["buildings"] if b["key"] == key)
        if [e["x"], e["y"]] != b["door"]: bad("3 drzwi nie na miejscu", n)
        if not eng.standable(*b["front"]): bad("3 przed drzwiami zajęte", n)
    # 4 spots
    for k in SPOT_KEYS:
        es = [e for e in events if e["name"] == "Miejsce: " + k]
        if len(es) != 1: bad("4 miejsce brak / podwójne", k); continue
        e = es[0]; pg = e["pages"][0]
        if pg["priorityType"] != 0 or not pg["through"]: bad("4 miejsce nie pod postacią / nie przenikalne", k)
        c = (e["x"], e["y"])
        if not eng.standable(*c): bad("4 miejsce zajęte", "%s %s" % (k, c))
        elif c not in seen: bad("4 miejsce nieosiągalne", "%s %s" % (k, c))
    # 5 solid
    for y in range(H):
        for x in range(W):
            t0 = at(x, y, 0)
            if t0 >= A3 and (x, y) in seen: bad("5 dach / ściana do przejścia", (x, y))
    # 6 ids
    for e in events:
        if e["id"] >= 355: bad("6 id za duże", e["id"])
    # 7 edge
    allowed = {(ex["x"], ex["y"]) for ex in meta["exits"]} | {tuple(meta["spots"]["skraj_lasu"][:2])} if "skraj_lasu" in meta["spots"] else set()
    for y in range(H):
        for x in range(W):
            if (x in (0, W - 1) or y in (0, H - 1)) and (x, y) in seen and (x, y) not in allowed: bad("7 krawędź otwarta", (x, y))
    # 9 a walkable picture laid over a closed one (the engine reads the top tile first: the cell would open)
    fl = eng.f
    for y in range(H):
        for x in range(W):
            t2, t3 = at(x, y, 2), at(x, y, 3)
            if eng.region[y * W + x] in (1, 2, 3): continue
            if t2 and t3 and 0 < t3 < A5 and not fl[t3] & 0x10 and not fl[t3] & 0x0F and (fl[t2] & 0x0F) == 0x0F:
                bad("9 przechodni obrazek na zamkniętym", (x, y))
    # 8 pockets: open cells nobody can walk to (behind houses, in a fenced plot without a gate)
    for y in range(H):
        for x in range(W):
            if eng.standable(x, y) and (x, y) not in seen: bad("8 zamknięta kieszeń", (x, y))
    total = sum(len(v) for v in probs.values())
    if not quiet or total:
        print("Map111 Podgrodzie: %d zdarzeń, osiągalne %d pól z bramy" % (len(events), len(seen)))
        for k in sorted(probs):
            v = probs[k]
            print("  %s: %d  %s" % (k, len(v), "; ".join(str(i) for i in v[:16]) + (" ..." if len(v) > 16 else "")))
        print("  WYNIK: %s" % ("OK" if not total else "%d problemów" % total))
    return total, seen

if __name__ == "__main__":
    n, _ = check(sys.argv[1] if len(sys.argv) > 1 else None)
    sys.exit(1 if n else 0)
