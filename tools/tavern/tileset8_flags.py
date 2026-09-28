# python tileset8_flags.py  -> tools/tavern/staging/tileset8_flags.json (+ tileset8_flags_notes.md)
# The passage flags of tileset 8 "Wilu Fantasy Interior" (Winlu Fantasy Interior Remaster) worked out tile by tile, so the
# tavern (and every other tileset-8 map) needs no invisible blocker events for walls and furniture.
#
# Today tileset 8 has only 4928 flags (up to part of A3): every A3 wall kind but 48/49/54/59 and every A4 tile is
# walkable, and almost all furniture too. The new list has the full 8192 entries:
#   walls (A3, A4 wall rows, A2 borders)            X  impassable
#   floors (A4 floor rows, A5 floors/stairs), rugs  .  passable
#   furniture                                       X on the cells it stands on (its footprint)
#   the upper part of tall things                   *  (drawn above characters, no effect on passage) - so a character
#                                                      behind a shelf, a plant or a chair back is hidden by it
#   small things that lie on tables / shelves       *  (the table under them blocks)
#   counters (Shops sheet)                          X + counter (0x80): the action button reaches across them
# Entries whose class does not change keep their exact old value (so the diff shows only real changes).
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STAGING = os.path.join(HERE, "staging")
from PIL import Image
import numpy as np

PASS, X, STAR, COUNTER = 0x600, 0x60F, 0x610, 0x60F | 0x80
WINLU = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets")
SHEETS = {"B": ("Fantasy_Inside_B", 0), "C": ("Fantasy_Inside_C", 256), "D": ("Fantasy_Inside_D", 512), "E": ("Fantasy_Inside_Shops", 768)}

def tid(sheet, c, r):
    if sheet == "A5": return 1536 + r * 8 + c
    return SHEETS[sheet][1] + (128 if c >= 8 else 0) + r * 8 + (c % 8)

def empty_cells(sheet):
    im = np.array(Image.open(os.path.join(WINLU, SHEETS[sheet][0] + ".png")).convert("RGBA"))
    out = set()
    for r in range(16):
        for c in range(16):
            if im[r * 48:(r + 1) * 48, c * 48:(c + 1) * 48, 3].max() == 0: out.add((c, r))
    return out

def rect(c0, r0, c1, r1):
    return [(c, r) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)]

# ---------------------------------------------------------------------------------------------- B-E: rules in order
# (sheet, cells, class) - later rules win. Every non-empty cell starts as X.
RULES = [
    # B: windows, curtains, bars, wall pieces stay X
    ("B", rect(8, 4, 11, 7), PASS),                    # the wooden side stairs (walkable, as before)
    ("B", rect(8, 11, 11, 15), PASS),                  # runner rugs and the purple round rug
    ("B", rect(12, 12, 15, 15), PASS),                 # round rugs
    ("B", rect(12, 13, 13, 13), PASS),                 # a floor shadow
    ("B", rect(12, 0, 13, 2), STAR),                   # tops of the wooden posts
    ("B", rect(8, 2, 10, 2), STAR),                    # top rail of the lattice railing
    ("B", rect(8, 8, 15, 9), STAR),                    # tops of the pillars and columns (their bases block)
    # C: furniture blocks; tall pieces have starred tops
    ("C", rect(8, 0, 13, 0), STAR), ("C", rect(8, 2, 13, 2), STAR),     # chair and armchair backs
    ("C", rect(0, 0, 2, 1), STAR),                     # tall bookshelves (bases row 2)
    ("C", rect(3, 0, 3, 0), STAR), ("C", rect(5, 0, 5, 0), STAR),       # low bookshelf and nightstand tops
    ("C", rect(3, 2, 5, 2), STAR), ("C", rect(6, 2, 7, 2), STAR),       # cupboard / shelf / sideboard tops
    ("C", rect(0, 3, 1, 3), STAR),                     # food shelves (bases row 4)
    ("C", rect(2, 4, 7, 4), STAR),                     # pantry shelves, cloth rack (bases row 5)
    ("C", rect(0, 5, 1, 5), STAR),                     # book piles lying on shelf tops
    ("C", rect(0, 6, 7, 7), STAR),                     # tall bookcases and food racks (bases row 8)
    ("C", rect(0, 9, 1, 11), STAR),                    # the tall dark panel (base row 12)
    ("C", rect(2, 9, 7, 9), STAR),                     # cupboards (bases row 10)
    ("C", rect(2, 11, 5, 11), STAR), ("C", rect(6, 10, 7, 11), STAR),   # cupboards, the carved wardrobe
    ("C", rect(3, 12, 3, 12), STAR),                   # the jug on the washstand
    ("C", rect(4, 13, 7, 14), STAR),                   # folding screens (bases row 15)
    ("C", rect(2, 14, 3, 14), STAR),                   # high-backed chairs
    ("C", rect(15, 2, 15, 2), STAR),                   # top of the small stool
    ("C", rect(8, 13, 8, 13), STAR),                   # the dressing-table mirror
    ("C", rect(8, 10, 15, 10), STAR), ("C", rect(9, 13, 15, 13), STAR),  # bed headboards
    # D: shields, mirrors, shelves, pots on the wall stay X; small things on tables are *
    ("D", rect(0, 8, 0, 9), STAR), ("D", rect(1, 9, 1, 9), STAR),       # cutting boards
    ("D", rect(1, 8, 1, 8), STAR), ("D", rect(2, 9, 2, 9), STAR),       # small vases
    ("D", rect(0, 10, 7, 15), STAR),                   # food, dishes, mugs, bottles, books, scrolls, coins...
    ("D", [(3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (4, 8), (5, 8), (6, 8), (7, 8)], STAR),   # tops of jars, plants, broom
    ("D", rect(8, 0, 12, 0), STAR), ("D", rect(13, 0, 15, 0), STAR),    # barrel tops (bases row 1)
    ("D", rect(8, 2, 12, 2), STAR),                    # sack tops, the second barrel pile's tops
    ("D", [(11, 3), (13, 3)], STAR),                   # crate tops
    ("D", rect(13, 7, 15, 8), STAR),                   # cobwebs
    ("D", rect(10, 9, 14, 9), STAR),                   # papers (notes on boards)
    ("D", rect(8, 10, 8, 11), STAR),                   # toys
    ("D", rect(11, 12, 12, 12), STAR),                 # dirt streaks on walls
    ("D", rect(14, 11, 15, 11), STAR),                 # crate tops (bases row 12)
    ("D", rect(8, 13, 8, 14), STAR),                   # the leaning ladder (base row 15)
    ("D", [(8, 6), (8, 7), (8, 8), (9, 8), (10, 8), (8, 9), (9, 9)], PASS),   # blood stains, pebbles
    ("D", rect(11, 5, 12, 6), PASS),                   # small rubble on the floor
    ("D", rect(15, 9, 15, 10), PASS),                  # floor shadow
    ("D", rect(9, 10, 10, 15), PASS), ("D", rect(11, 13, 12, 15), PASS),  # bear-skin rugs
    # E (Shops): counters with the counter flag; shelves and racks have starred tops; round tables block whole
    ("E", rect(0, 0, 2, 5), COUNTER), ("E", rect(3, 0, 3, 3), COUNTER), ("E", rect(4, 0, 4, 1), COUNTER),
    ("E", rect(5, 0, 5, 3), COUNTER), ("E", rect(1, 6, 2, 6), COUNTER),
    ("E", rect(6, 0, 7, 1), STAR), ("E", rect(6, 3, 7, 4), STAR),       # bar shelves (bases rows 2 and 5)
    ("E", rect(0, 7, 7, 7), STAR),                     # barrel racks and barrel columns (bases row 8)
    ("E", rect(8, 0, 15, 1), STAR),                    # potion shelves (bases row 2)
    ("E", [(8, 3), (9, 3), (11, 3), (12, 3)], STAR),   # things on the alchemy tables
    ("E", rect(8, 5, 15, 6), STAR),                    # weapon shelves (bases row 7)
    ("E", rect(8, 8, 12, 8), STAR),                    # plank stalls / boards (bases row 9)
    ("E", rect(8, 10, 14, 10), STAR),                  # weapon racks (bases row 11)
    ("E", rect(8, 12, 10, 12), STAR), ("E", rect(13, 12, 14, 12), STAR),  # grindstone, anvil, armour stands
    ("E", rect(9, 14, 14, 14), STAR), ("E", rect(1, 13, 5, 14), STAR),   # shop shelves (bases row 15)
    ("E", [(6, 14)], STAR),                            # scales (a thing on a table)
]

# A5 (8 x 16): floors and stairs pass; void, wall bands, hearths, bookshelves block
A5_X = [(0, 0)] + rect(0, 1, 3, 1) + [(4, r) for r in range(4)] + [(7, r) for r in range(4)] + rect(4, 6, 7, 6) + \
       rect(6, 8, 7, 10) + rect(0, 11, 7, 15)
# A2 kinds: borders block, rugs and overlays pass
A2_X = [16, 17, 18, 19, 24, 25, 26, 27, 32, 33, 34, 35, 39, 40, 41, 42, 43, 44, 45, 46, 47]
A2_PASS = [20, 21, 22, 23, 28, 29, 30, 31, 36, 37, 38]

def klass(v):
    if v is None: return None
    if v & 0x10: return "*"
    if (v & 0xF) == 0xF: return "X" + ("c" if v & 0x80 else "")
    if (v & 0xF) == 0: return "."
    return "d"

def build(old):
    new = list(old) + [None] * (8192 - len(old))
    want = {}
    # B-E
    # an empty cell is "nothing": star (no effect on passage). Tile 0 (B 0,0) is the empty tile of every upper layer
    # and must stay exactly 0x10, or every cell of every tileset-8 map would become walkable.
    for s in SHEETS:
        emp = empty_cells(s)
        for r in range(16):
            for c in range(16):
                want[tid(s, c, r)] = STAR if (c, r) in emp else X
    for (s, cells, v) in RULES:
        emp = empty_cells(s)
        for (c, r) in cells:
            if (c, r) in emp: continue
            want[tid(s, c, r)] = v
    want[0] = 0x10
    for r in range(16):
        for c in range(8):
            want[tid("A5", c, r)] = X if (c, r) in A5_X else PASS
    for k in range(16, 48):
        v = X if k in A2_X else PASS
        for i in range(48): want[2048 + k * 48 + i] = v
    for k in range(48, 80):
        for i in range(48): want[2048 + k * 48 + i] = X
    for k in range(80, 128):
        wall = ((k - 80) // 8) % 2 == 1
        for i in range(48): want[2048 + k * 48 + i] = X if wall else PASS
    for t, v in want.items():
        if klass(new[t]) != klass(v): new[t] = v
    assert new[0] == 0x10
    for i in range(8192):                       # A1 (unused in tileset 8) and the gap after E keep / get a default
        if new[i] is None: new[i] = 3584 if 2048 <= i < 2816 else PASS
    return new

if __name__ == "__main__":
    ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
    old = ts[8]["flags"]
    new = build(old)
    os.makedirs(STAGING, exist_ok=True)
    with open(os.path.join(STAGING, "tileset8_flags.json"), "wb") as f:
        f.write(json.dumps(new, separators=(",", ":")).encode("utf-8"))
    changed = [i for i in range(8192) if (old[i] if i < len(old) else None) != new[i]]
    print("tileset 8 flags: %d entries (was %d), %d changed" % (len(new), len(old), len(changed)))
    from collections import Counter
    print(Counter(klass(new[i]) for i in range(8192)))
