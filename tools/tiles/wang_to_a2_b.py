"""Corner (Wang / dual-grid) tile set  ->  RPG Maker MZ A2 floor autotile block (96x144 for 48 px tiles).

A corner tile W(tl, tr, bl, br) is centred on a map VERTEX; each corner value says whether the map cell whose
centre is at that corner holds the terrain (1) or not (0).  Its four quarters are the quarters of the four
cells around that vertex, so for a terrain cell T:
    T's top-left quarter     = BR quarter of W(UL, U,  L,  1)
    T's top-right quarter    = BL quarter of W(U,  UR, 1,  R)
    T's bottom-left quarter  = TR quarter of W(L,  1,  DL, D)
    T's bottom-right quarter = TL quarter of W(1,  R,  D,  DR)
MZ picks each quarter from only 5 cases (body, inner corner, the two edges, outer corner); the diagonal
matters only when both orthogonal neighbours hold the terrain.  So the converter uses diagonal = 0 unless
it is the body case.  (A corner set whose boundary runs on the cell edges - bulging into the other terrain's
cells - cannot be shown exactly by MZ: whatever lies in a non-terrain cell is drawn by THAT cell's tile.
`--check` reports how many pixels such a set loses.)

Input corner sets:
  * a 4x4 sheet, tile index = tl*8 + tr*4 + bl*2 + br, row-major        (--layout sheet, default)
  * a folder of files wang_<tl><tr><bl><br>.png, e.g. wang_0011.png      (--layout dir)
  * a JSON {"0011": "path.png", ...}                                    (--layout json)

  python wang_to_a2.py <corner set> <out_block.png> [--layout sheet|dir|json] [--tile 48]
  python wang_to_a2.py --selftest          (random-pattern test against MZ's own FLOOR_AUTOTILE_TABLE)
  python wang_to_a2.py --validate-maps     (the neighbour->shape rule against the editor's shapes on data/Map*.json)
"""
import json
import os
import random
import re
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))

# ---------------------------------------------------------------- MZ's table (read from the engine itself)
_FALLBACK_TABLE = None


def floor_table():
    """Tilemap.FLOOR_AUTOTILE_TABLE parsed out of js/rmmz_core.js: 48 shapes x 4 quarters (TL, TR, BL, BR) of [qx, qy]."""
    src = open(os.path.join(ROOT, "js", "rmmz_core.js"), "rb").read().decode("utf8")
    i = src.index("Tilemap.FLOOR_AUTOTILE_TABLE = [")
    j = src.index("];", i)
    body = src[i:j]
    rows = re.findall(r"\[\[(\d+), (\d+)\], \[(\d+), (\d+)\], \[(\d+), (\d+)\], \[(\d+), (\d+)\]\]", body)
    table = [[(int(r[0]), int(r[1])), (int(r[2]), int(r[3])), (int(r[4]), int(r[5])), (int(r[6]), int(r[7]))] for r in rows]
    assert len(table) == 48, len(table)
    return table


# the piece (quarter of the A2 block, in 24 px units) MZ uses for each case at each quarter position
# positions: 0 TL, 1 TR, 2 BL, 3 BR
PIECE = {
    "body":  [(2, 4), (1, 4), (2, 3), (1, 3)],
    "inner": [(2, 0), (3, 0), (2, 1), (3, 1)],
    "vedge": [(0, 4), (3, 4), (0, 3), (3, 3)],   # the side (left/right) neighbour differs, the vertical one is the same
    "hedge": [(2, 2), (1, 2), (2, 5), (1, 5)],   # the vertical (up/down) neighbour differs, the side one is the same
    "outer": [(0, 2), (3, 2), (0, 5), (3, 5)],
}
THUMB = [(0, 0), (1, 0), (0, 1), (1, 1)]


def quarter_case(h, v, d):
    """h: side neighbour same kind, v: vertical neighbour same, d: diagonal same."""
    if h and v:
        return "body" if d else "inner"
    if v:
        return "vedge"
    if h:
        return "hedge"
    return "outer"


def quarter_neighbours(nb, pos):
    """nb: dict with keys u d l r ul ur dl dr (True = same kind).  -> (side, vertical, diagonal) for quarter pos."""
    if pos == 0:
        return nb["l"], nb["u"], nb["ul"]
    if pos == 1:
        return nb["r"], nb["u"], nb["ur"]
    if pos == 2:
        return nb["l"], nb["d"], nb["dl"]
    return nb["r"], nb["d"], nb["dr"]


_SHAPE_BY_PIECES = None


def shape_of(nb, table=None):
    """The MZ autotile shape (0..47) of a floor cell from its 8 neighbours, found in MZ's own table."""
    global _SHAPE_BY_PIECES
    if _SHAPE_BY_PIECES is None:
        t = table or floor_table()
        _SHAPE_BY_PIECES = {}
        for s, quarters in enumerate(t):
            key = tuple(quarters)
            _SHAPE_BY_PIECES.setdefault(key, s)   # 47 (the thumbnail) never matches: its pieces are unique
    pieces = tuple(PIECE[quarter_case(*quarter_neighbours(nb, p))][p] for p in range(4))
    return _SHAPE_BY_PIECES[pieces]


# ---------------------------------------------------------------- corner sets
def load_wang(path, layout="sheet", tile=48):
    """-> {(tl, tr, bl, br): RGBA Image tile x tile}"""
    out = {}
    codes = [(a, b, c, d) for a in (0, 1) for b in (0, 1) for c in (0, 1) for d in (0, 1)]
    if layout == "sheet":
        im = Image.open(path).convert("RGBA")
        for code in codes:
            i = code[0] * 8 + code[1] * 4 + code[2] * 2 + code[3]
            x, y = (i % 4) * tile, (i // 4) * tile
            out[code] = im.crop((x, y, x + tile, y + tile))
    elif layout == "dir":
        for code in codes:
            out[code] = Image.open(os.path.join(path, "wang_%d%d%d%d.png" % code)).convert("RGBA")
    elif layout == "json":
        spec = json.load(open(path, encoding="utf8"))
        base = os.path.dirname(os.path.abspath(path))
        for k, f in spec.items():
            code = tuple(int(ch) for ch in k)
            out[code] = Image.open(os.path.join(base, f)).convert("RGBA")
    else:
        raise ValueError(layout)
    missing = [c for c in codes if c not in out]
    if missing:
        raise ValueError("corner set is missing %s" % missing)
    return out


def save_wang_sheet(wang, path, tile=48):
    sheet = Image.new("RGBA", (4 * tile, 4 * tile))
    for code, im in wang.items():
        i = code[0] * 8 + code[1] * 4 + code[2] * 2 + code[3]
        sheet.paste(im, ((i % 4) * tile, (i // 4) * tile))
    sheet.save(path)


def wang_quarter_for(pos, h, v, d):
    """Which corner tile and which of its quarters give the terrain cell's quarter at `pos`."""
    # the vertex is the cell's corner at pos; in that corner tile the cell sits opposite to it
    px, py = pos % 2, pos // 2
    corners = {}
    corners[(1 - px, 1 - py)] = 1          # the cell itself
    corners[(px, 1 - py)] = int(h)         # side neighbour
    corners[(1 - px, py)] = int(v)         # vertical neighbour
    corners[(px, py)] = int(d)             # diagonal neighbour
    code = (corners[(0, 0)], corners[(1, 0)], corners[(0, 1)], corners[(1, 1)])
    return code, (1 - px, 1 - py)          # quarter (qx, qy) inside the corner tile


def wang_to_a2(wang, tile=48, thumb="outer"):
    """Build the 2x3-tile A2 block.  thumb='outer': the thumbnail is the isolated cell (4 outer corners)."""
    q = tile // 2
    block = Image.new("RGBA", (2 * tile, 3 * tile))
    reps = {"body": (1, 1, 1), "inner": (1, 1, 0), "vedge": (0, 1, 0), "hedge": (1, 0, 0), "outer": (0, 0, 0)}
    for case, pieces in PIECE.items():
        for pos, (qx, qy) in enumerate(pieces):
            code, (wx, wy) = wang_quarter_for(pos, *reps[case])
            src = wang[code].crop((wx * q, wy * q, wx * q + q, wy * q + q))
            block.paste(src, (qx * q, qy * q))
    if thumb == "outer":
        for pos, (qx, qy) in enumerate(THUMB):
            ox, oy = PIECE["outer"][pos]
            block.paste(block.crop((ox * q, oy * q, ox * q + q, oy * q + q)), (qx * q, qy * q))
    return block


# ---------------------------------------------------------------- drawing a map like MZ does
def neighbours(grid, x, y, edge_same=True):
    H, W = len(grid), len(grid[0])

    def g(xx, yy):
        if 0 <= xx < W and 0 <= yy < H:
            return bool(grid[yy][xx])
        return edge_same
    return {"u": g(x, y - 1), "d": g(x, y + 1), "l": g(x - 1, y), "r": g(x + 1, y),
            "ul": g(x - 1, y - 1), "ur": g(x + 1, y - 1), "dl": g(x - 1, y + 1), "dr": g(x + 1, y + 1)}


def draw_with_block(block, grid, tile=48, table=None, shapes=None):
    """Draw every terrain cell of grid with the A2 block through MZ's table (Tilemap._addAutotile)."""
    table = table or floor_table()
    q = tile // 2
    H, W = len(grid), len(grid[0])
    out = Image.new("RGBA", (W * tile, H * tile))
    for y in range(H):
        for x in range(W):
            if not grid[y][x]:
                continue
            s = shapes[y][x] if shapes else shape_of(neighbours(grid, x, y), table)
            for i in range(4):
                qx, qy = table[s][i]
                piece = block.crop((qx * q, qy * q, qx * q + q, qy * q + q))
                out.alpha_composite(piece, (x * tile + (i % 2) * q, y * tile + (i // 2) * q))
    return out


def draw_with_wang(wang, grid, tile=48, edge_same=True):
    """Dual-grid drawing: a corner tile on every vertex; only the terrain cells' quarters are kept."""
    q = tile // 2
    H, W = len(grid), len(grid[0])
    out = Image.new("RGBA", (W * tile, H * tile))

    def g(xx, yy):
        if 0 <= xx < W and 0 <= yy < H:
            return int(grid[yy][xx])
        return int(edge_same)
    for vy in range(H + 1):
        for vx in range(W + 1):
            code = (g(vx - 1, vy - 1), g(vx, vy - 1), g(vx - 1, vy), g(vx, vy))
            im = wang[code]
            for (cx, cy, qx, qy) in ((vx - 1, vy - 1, 0, 0), (vx, vy - 1, 1, 0), (vx - 1, vy, 0, 1), (vx, vy, 1, 1)):
                if 0 <= cx < W and 0 <= cy < H and grid[cy][cx]:
                    out.alpha_composite(im.crop((qx * q, qy * q, qx * q + q, qy * q + q)), (vx * tile - q + qx * q, vy * tile - q + qy * q))
    return out


def diff_count(a, b):
    pa, pb = a.load(), b.load()
    n = 0
    for y in range(a.size[1]):
        for x in range(a.size[0]):
            if pa[x, y] != pb[x, y]:
                n += 1
    return n


def random_grid(W, H, p=0.55, seed=1):
    rnd = random.Random(seed)
    return [[1 if rnd.random() < p else 0 for _ in range(W)] for _ in range(H)]


def check(wang, block, W=16, H=12, seeds=(1, 2, 3), tile=48):
    """Pixels where MZ's drawing (block + table) differs from the dual-grid drawing (corner set) on random maps."""
    res = []
    table = floor_table()
    for s in seeds:
        grid = random_grid(W, H, seed=s)
        a = draw_with_block(block, grid, tile, table)
        b = draw_with_wang(wang, grid, tile)
        res.append(diff_count(a, b))
    return res


# ---------------------------------------------------------------- tests
def _synthetic_wang(tile=48):
    """A corner set whose boundary lies inside the terrain cells (MZ-exact), every quarter uniquely coloured."""
    import math
    q = tile // 2
    wang = {}
    for code in [(a, b, c, d) for a in (0, 1) for b in (0, 1) for c in (0, 1) for d in (0, 1)]:
        im = Image.new("RGBA", (tile, tile))
        px = im.load()
        cells = {(0, 0): code[0], (1, 0): code[1], (0, 1): code[2], (1, 1): code[3]}
        for y in range(tile):
            for x in range(tile):
                cx, cy = x // q, y // q
                if not cells[(cx, cy)]:
                    continue
                # distance from the pixel to the nearest non-terrain quarter of this tile (the other cells)
                dmin = 99
                for (ox, oy), val in cells.items():
                    if val:
                        continue
                    dx = max(ox * q - x - 0.5, 0, x + 0.5 - (ox * q + q))
                    dy = max(oy * q - y - 0.5, 0, y + 0.5 - (oy * q + q))
                    dmin = min(dmin, math.hypot(dx, dy))
                if dmin < 7 + 3 * math.sin((x + 2 * y) * 0.4):
                    px[x, y] = (40, 150, 60, 255)          # rim
                else:
                    px[x, y] = ((x * 5) % 256, (y * 5) % 256, 120 + (x ^ y) % 100, 255)   # position-coded body
        wang[code] = im
    return wang


def selftest():
    table = floor_table()
    wang = _synthetic_wang()
    block = wang_to_a2(wang)
    res = check(wang, block, seeds=(1, 2, 3, 4, 5))
    ok = all(r == 0 for r in res)
    print("MZ table drawing vs corner-set drawing, differing pixels on 5 random 16x12 maps:", res, "->", "PASS" if ok else "FAIL")
    # every one of the 47 neighbour shapes is reachable and round-trips
    seen = set()
    for bits in range(256):
        keys = ["u", "d", "l", "r", "ul", "ur", "dl", "dr"]
        nb = {k: bool(bits >> i & 1) for i, k in enumerate(keys)}
        seen.add(shape_of(nb, table))
    print("shapes produced by the 256 neighbourhoods:", len(seen), "(expected 47: 0..46)", "PASS" if seen == set(range(47)) else "FAIL")
    return ok and seen == set(range(47))


def validate_maps():
    """Compare shape_of() with the shapes the editor stored in the maps (A2 floor kinds only)."""
    import glob
    table = floor_table()
    tot = bad = 0
    bad_by = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "data", "Map[0-9][0-9][0-9].json"))):
        m = json.load(open(f, encoding="utf8"))
        W, H, data = m["width"], m["height"], m["data"]
        for z in range(4):
            def tid(x, y):
                return data[(z * H + y) * W + x]
            def kind(t):
                return (t - 2048) // 48 if 2816 <= t < 4352 else None   # A2 only
            for y in range(H):
                for x in range(W):
                    k = kind(tid(x, y))
                    if k is None:
                        continue
                    def same(xx, yy):
                        if not (0 <= xx < W and 0 <= yy < H):
                            return True
                        return kind(tid(xx, yy)) == k
                    nb = {"u": same(x, y - 1), "d": same(x, y + 1), "l": same(x - 1, y), "r": same(x + 1, y),
                          "ul": same(x - 1, y - 1), "ur": same(x + 1, y - 1), "dl": same(x - 1, y + 1), "dr": same(x + 1, y + 1)}
                    want = (tid(x, y) - 2048) % 48
                    got = shape_of(nb, table)
                    tot += 1
                    if want != got:
                        bad += 1
                        key = os.path.basename(f)
                        bad_by[key] = bad_by.get(key, 0) + 1
    print("A2 cells checked:", tot, "editor shape == computed shape:", tot - bad, "differ:", bad)
    print("differences per map:", bad_by)
    return tot, bad


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)
    if args[0] == "--selftest":
        sys.exit(0 if selftest() else 1)
    if args[0] == "--validate-maps":
        validate_maps()
        sys.exit(0)
    src, dst = args[0], args[1]
    layout = "sheet"
    tile = 48
    if "--layout" in args:
        layout = args[args.index("--layout") + 1]
    if "--tile" in args:
        tile = int(args[args.index("--tile") + 1])
    wang = load_wang(src, layout, tile)
    block = wang_to_a2(wang, tile)
    block.save(dst)
    lost = check(wang, block, tile=tile)
    print("saved", dst, "- pixels a random map loses vs the corner set (0 = MZ-exact):", lost)
