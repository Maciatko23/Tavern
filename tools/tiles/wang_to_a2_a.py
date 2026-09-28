"""Corner (Wang / dual-grid) tile set -> one RPG Maker MZ A2 floor-autotile block (96x144).
(method A of the 2026-09-27 tileset pilot; tools/tiles/wang_to_a2.py is the method-B converter)

The input is a PixelLab 16-tile corner set: tile_0.png .. tile_15.png, tile_<mask> with
mask = NW<<3 | NE<<2 | SW<<1 | SE, a set bit meaning the FIRST terrain of the description
occupies that corner (tile_15 = all first terrain, tile_0 = all second terrain).

MZ block layout, in 24x24 quarters (4 columns x 6 rows):
  [0..1, 0..1]  thumbnail (what the editor palette shows; we put the isolated cell there)
  [2..3, 0..1]  inner corners: [2,0] TL, [3,0] TR, [2,1] BL, [3,1] BR
  [0..3, 2..5]  a 2x2-cell island: outer corners, edges and body
Every slot is always used for the same quarter of a cell (e.g. [1,2] is always a top-right
quarter), which is what makes the mappings below possible.

Two mappings:
  vertex (the default; tiles are 48x48 = one map cell)
      A corner tile sits on a map VERTEX; its 4 corners are the 4 cells around it, so a cell's
      top-left quarter is the bottom-right quadrant of the tile whose corners are
      (up-left, up, left, self), and so on. MZ ignores the diagonal neighbour when an orthogonal
      one differs; we then take the tile with the diagonal = the other terrain (straight edge /
      convex corner). The transition sits on the cell boundary: anything the corner tile draws
      on the OTHER terrain's side of the midline is lost (MZ draws the neighbour cell there).
  half  (tiles are 24x24 = one quarter)
      The quarter's corners are (cell vertex, edge midpoint, edge midpoint, cell centre), which is
      again a consistent dual grid, one level finer: the whole transition then lies inside the
      autotile's own border quarters and the result equals the fine dual grid exactly.

Plain textures (a whole block of one tile, e.g. plain grass): --plain tile.png copies each quarter
of a 48x48 tile into every slot of the same quarter position, so every shape shows the tile.

Overlay (--overlay): pixels that belong to the other terrain become transparent, so the block can
go on layer 1 of a 'field' A2 (right half) over the ground below. The other terrain's pixels are
found by nearest palette colour (palettes taken from the two plain corner tiles).
Under (--under grass48.png): the same, then that 48x48 texture is put below quarter by quarter in
its own place - an L0 autotile whose ring is exactly the plain neighbouring ground.
Body (--body dirt48.png): the 4 body slots take the quarters of this 48x48 tile (its own place).

Usage:
  python wang_to_a2_a.py --tiles DIR --terrain second --out block.png [--mode vertex|half]
                         [--overlay] [--body plain48.png] [--under grass48.png]
  python wang_to_a2_a.py --plain tile48.png --out block.png
  python wang_to_a2_a.py --test DIR [--terrain second] [--mode vertex|half] [--overlay] [--outdir D]
        self-test: all 256 neighbourhoods + a random area drawn with MZ's own FLOOR_AUTOTILE_TABLE
        (read from js/rmmz_core.js), compared with the pieces drawn straight and with a dual grid
        built independently (classic one for vertex mode, the fine one for half mode)
  python wang_to_a2_a.py --paste SHEET.png --kind 17 --block block.png --out NEW_SHEET.png
"""
import argparse, json, os, random, re, sys
from PIL import Image

Q = 24          # quarter size (MZ tile 48 / 2)
HERE = os.path.dirname(os.path.abspath(__file__))
CORE = os.path.join(HERE, "..", "..", "js", "rmmz_core.js")

# slot -> (quarter index 0..3 = TL,TR,BL,BR ; piece type)
# piece types: body, inner, edgeV (a left/right edge: the vertical neighbour is the same, the
# horizontal one differs), edgeH (top/bottom edge), outer
SLOTS = {
    (2, 4): (0, "body"),  (1, 4): (1, "body"),  (2, 3): (2, "body"),  (1, 3): (3, "body"),
    (2, 0): (0, "inner"), (3, 0): (1, "inner"), (2, 1): (2, "inner"), (3, 1): (3, "inner"),
    (0, 4): (0, "edgeV"), (3, 4): (1, "edgeV"), (0, 3): (2, "edgeV"), (3, 3): (3, "edgeV"),
    (2, 2): (0, "edgeH"), (1, 2): (1, "edgeH"), (2, 5): (2, "edgeH"), (1, 5): (3, "edgeH"),
    (0, 2): (0, "outer"), (3, 2): (1, "outer"), (0, 5): (2, "outer"), (3, 5): (3, "outer"),
}


def piece_type(v, h, d):
    """v / h / d: is the vertical / horizontal / diagonal neighbour of this quarter the same kind."""
    if v and h:
        return "body" if d else "inner"
    if v:
        return "edgeV"
    if h:
        return "edgeH"
    return "outer"


def corners_for(qi, t):
    """The corner tile for quarter qi of a cell, piece type t, as (nw, ne, sw, se) with True = the
    autotile's terrain. The diagonal is taken as the other terrain unless both orthogonals are the
    same (MZ does not look at it then)."""
    v, h = t in ("body", "inner", "edgeV"), t in ("body", "inner", "edgeH")
    d = t == "body"
    if qi == 0:   # cell's TL quarter: vertex at the cell's top-left -> tile corners (UL, U, L, self)
        return (d, v, h, True)
    if qi == 1:   # TR: (U, UR, self, R)
        return (v, d, True, h)
    if qi == 2:   # BL: (L, self, DL, D)
        return (h, True, d, v)
    return (True, h, v, d)          # BR: (self, R, D, DR)


class CornerSet:
    def __init__(self, folder, auto_is_first):
        self.tiles = {}
        for m in range(16):
            self.tiles[m] = Image.open(os.path.join(folder, "tile_%d.png" % m)).convert("RGBA")
        self.size = self.tiles[0].size[0]
        self.auto_is_first = auto_is_first

    def tile(self, nw, ne, sw, se):
        bits = [nw, ne, sw, se]
        if not self.auto_is_first:
            bits = [not b for b in bits]
        m = (bits[0] << 3) | (bits[1] << 2) | (bits[2] << 1) | int(bits[3])
        return self.tiles[m]

    def all_auto(self):
        return self.tile(True, True, True, True)

    def all_other(self):
        return self.tile(False, False, False, False)


def quarter_of(img, qi):
    x, y = (qi % 2) * Q, (qi // 2) * Q
    return img.crop((x, y, x + Q, y + Q))


def piece(cs, qi, t, mode):
    c = corners_for(qi, t)
    tile = cs.tile(*c)
    if mode == "vertex":
        # the cell's quarter qi is the tile's quadrant opposite to qi
        return quarter_of(tile, 3 - qi)
    return tile.copy()  # half: the whole (24x24) tile


def render_isolated(block):
    """The shape-46 cell (all four outer corners) - an isolated cell of this kind."""
    cell = Image.new("RGBA", (48, 48))
    for (sx, sy), (qi, t) in SLOTS.items():
        if t == "outer":
            cell.paste(block.crop((sx * Q, sy * Q, sx * Q + Q, sy * Q + Q)), ((qi % 2) * Q, (qi // 2) * Q))
    return cell


def build_block(cs, mode, body=None, overlay=False, under=None):
    """under: a 48x48 texture (the neighbouring ground, e.g. the plain grass of k16): the other
    terrain's pixels are dropped (as for an overlay) and this texture shows there instead, quarter by
    quarter in its own place - so an L0 autotile's ring matches the plain tile next to it exactly."""
    if mode == "vertex" and cs.size != 48:
        sys.exit("vertex mode needs 48x48 corner tiles (got %d)" % cs.size)
    if mode == "half" and cs.size != Q:
        sys.exit("half mode needs 24x24 corner tiles (got %d)" % cs.size)
    block = Image.new("RGBA", (96, 144))
    for (sx, sy), (qi, t) in SLOTS.items():
        if t == "body" and body is not None:
            p = quarter_of(body, qi)
        else:
            p = piece(cs, qi, t, mode)
        block.paste(p, (sx * Q, sy * Q))
    if overlay or under is not None:
        block = make_overlay(block, cs)
    if under is not None:
        base = Image.new("RGBA", (96, 144))
        for (sx, sy), (qi, t) in SLOTS.items():
            base.paste(quarter_of(under, qi), (sx * Q, sy * Q))
        base.alpha_composite(block)
        block = base
    block.paste(render_isolated(block), (0, 0))
    return block


def palette(img):
    return list({p[:3] for p in img.getdata() if p[3] > 0})


def make_overlay(block, cs):
    own, other = palette(cs.all_auto()), palette(cs.all_other())
    own_set, other_set = set(own), set(other)
    def d2(a, b):
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
    cache = {}
    out = block.copy()
    px = out.load()
    for y in range(out.size[1]):
        for x in range(out.size[0]):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            c = (r, g, b)
            if c not in cache:
                cache[c] = c not in own_set and (c in other_set or
                           min(d2(c, o) for o in other) < min(d2(c, o) for o in own))
            if cache[c]:
                px[x, y] = (0, 0, 0, 0)
    return out


def plain_block(img):
    block = Image.new("RGBA", (96, 144))
    for (sx, sy), (qi, t) in SLOTS.items():
        block.paste(quarter_of(img, qi), (sx * Q, sy * Q))
    block.paste(img.crop((0, 0, 48, 48)), (0, 0))
    return block


def paste_block(sheet_path, kind, block_path, out_path):
    sheet = Image.open(sheet_path).convert("RGBA")
    block = Image.open(block_path).convert("RGBA")
    k = kind - 16
    x, y = (k % 8) * 96, (k // 8) * 144
    sheet.paste(Image.new("RGBA", (96, 144)), (x, y))   # clear (keeps transparency of overlays)
    sheet.paste(block, (x, y))
    sheet.save(out_path)


# ------------------------------------------------------------------ self-test with MZ's own table
def mz_table():
    src = open(CORE, encoding="utf-8").read()
    m = re.search(r"Tilemap\.FLOOR_AUTOTILE_TABLE\s*=\s*(\[.*?\]);\s*\n", src, re.S)
    return json.loads(m.group(1))


def shape_of(grid, x, y, table):
    """Find MZ's shape index for cell (x, y) from its neighbours (out of the map = same kind, like
    the editor does at map edges). Fails if our slot meanings disagree with MZ's table."""
    H, W = len(grid), len(grid[0])
    def s(dx, dy):
        xx, yy = x + dx, y + dy
        return True if not (0 <= xx < W and 0 <= yy < H) else grid[yy][xx]
    U, D, L, R = s(0, -1), s(0, 1), s(-1, 0), s(1, 0)
    UL, UR, DL, DR = s(-1, -1), s(1, -1), s(-1, 1), s(1, 1)
    types = [piece_type(U, L, UL), piece_type(U, R, UR), piece_type(D, L, DL), piece_type(D, R, DR)]
    want = []
    for qi, t in enumerate(types):
        slot = [k for k, v in SLOTS.items() if v == (qi, t)][0]
        want.append([slot[0], slot[1]])
    for i, row in enumerate(table):
        if row == want:
            return i
    raise AssertionError("no MZ shape for quarters %s at %d,%d" % (want, x, y))


def render_mz(grid, block, base, table):
    """What MZ draws: base tile everywhere (layer 0), the kind's cells drawn with FLOOR_AUTOTILE_TABLE
    exactly like Tilemap._addAutotile (transparent pixels of an overlay show the base)."""
    H, W = len(grid), len(grid[0])
    out = Image.new("RGBA", (W * 48, H * 48))
    for y in range(H):
        for x in range(W):
            out.paste(base, (x * 48, y * 48))
            if not grid[y][x]:
                continue
            sh = shape_of(grid, x, y, table)
            for i in range(4):
                qsx, qsy = table[sh][i]
                q = block.crop((qsx * Q, qsy * Q, qsx * Q + Q, qsy * Q + Q))
                out.alpha_composite(q, (x * 48 + (i % 2) * Q, y * 48 + (i // 2) * Q))
    return out


def render_truth(grid, cs, mode, base):
    """Our pieces drawn straight (no MZ table): tests that the slots mean what MZ uses them for."""
    H, W = len(grid), len(grid[0])
    def s(xx, yy):
        return True if not (0 <= xx < W and 0 <= yy < H) else grid[yy][xx]
    out = Image.new("RGBA", (W * 48, H * 48))
    for y in range(H):
        for x in range(W):
            out.paste(base, (x * 48, y * 48))
            if not grid[y][x]:
                continue
            nb = {(dx, dy): s(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
            for qi in range(4):
                sx, sy = (1 if qi % 2 else -1), (1 if qi // 2 else -1)
                t = piece_type(nb[(0, sy)], nb[(sx, 0)], nb[(sx, sy)])
                out.paste(piece(cs, qi, t, mode), (x * 48 + (qi % 2) * Q, y * 48 + (qi // 2) * Q))
    return out


def render_fine_dual_grid(grid, cs):
    """Half mode ground truth built independently: terrain at every half-cell point (vertices, edge
    midpoints, centres), one 24px corner tile per quarter."""
    H, W = len(grid), len(grid[0])
    def s(xx, yy):
        return True if not (0 <= xx < W and 0 <= yy < H) else grid[yy][xx]
    def point(px, py):          # px, py in half-cell units; cell (x,y) centre = (2x+1, 2y+1)
        cells = [(cx, cy) for cx in {(px - 1) // 2, px // 2} for cy in {(py - 1) // 2, py // 2}]
        return all(s(cx, cy) for cx, cy in cells)
    out = Image.new("RGBA", (W * 48, H * 48))
    for qy in range(2 * H):
        for qx in range(2 * W):
            c = (point(qx, qy), point(qx + 1, qy), point(qx, qy + 1), point(qx + 1, qy + 1))
            out.paste(cs.tile(*c), (qx * Q, qy * Q))
    return out


def render_dual_grid(grid, cs, base48):
    """Vertex mode ground truth built independently: the classic dual grid (one 48px corner tile on
    every map vertex, corners = the 4 cells around it), then the non-kind cells covered by the base
    (MZ draws those with the other tile). Also returns the quarters where MZ cannot follow it: an
    orthogonal neighbour differs but the diagonal one is of the kind (MZ ignores the diagonal)."""
    H, W = len(grid), len(grid[0])
    def s(xx, yy):
        return True if not (0 <= xx < W and 0 <= yy < H) else grid[yy][xx]
    big = Image.new("RGBA", (W * 48 + 48, H * 48 + 48))
    for vy in range(H + 1):
        for vx in range(W + 1):
            c = (s(vx - 1, vy - 1), s(vx, vy - 1), s(vx - 1, vy), s(vx, vy))
            big.paste(cs.tile(*c), (vx * 48, vy * 48))        # big is shifted by +24,+24
    out = big.crop((24, 24, 24 + W * 48, 24 + H * 48))
    dontcare = []
    for y in range(H):
        for x in range(W):
            if not grid[y][x]:
                out.paste(base48, (x * 48, y * 48))
                continue
            for qi in range(4):
                sx, sy = (1 if qi % 2 else -1), (1 if qi // 2 else -1)
                v, h, d = s(x, y + sy), s(x + sx, y), s(x + sx, y + sy)
                if not (v and h) and d:
                    dontcare.append((x * 48 + (qi % 2) * Q, y * 48 + (qi // 2) * Q))
    return out, dontcare


def count_diff(a, b, skip=()):
    import numpy as np
    d = np.any(np.asarray(a) != np.asarray(b), axis=2)
    for x, y in skip:
        d[y:y + Q, x:x + Q] = False
    return int(d.sum())


def self_test(folder, auto_is_first, mode, overlay, outdir):
    table = mz_table()
    assert len(table) == 48
    if outdir:
        os.makedirs(outdir, exist_ok=True)
    cs = CornerSet(folder, auto_is_first)
    block = build_block(cs, mode, overlay=overlay)
    other = cs.all_other()
    base48 = Image.new("RGBA", (48, 48))
    if other.size[0] == 48:
        base48 = other.copy()
    else:
        for i in range(4):
            base48.paste(other, ((i % 2) * Q, (i // 2) * Q))
    # every one of the 256 neighbourhoods (a 3x3 patch each, 16 x 16 patches, one empty cell
    # between them) and below them a random area with a solid block in it
    rnd = random.Random(7)
    W, H = 64, 64 + 12
    grid = [[False] * W for _ in range(H)]
    for n in range(256):
        px0, py0 = (n % 16) * 4, (n // 16) * 4
        grid[py0 + 1][px0 + 1] = True
        for bit, (dx, dy) in enumerate([(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]):
            grid[py0 + 1 + dy][px0 + 1 + dx] = bool(n >> bit & 1)
    for y in range(64, H):
        for x in range(W):
            grid[y][x] = rnd.random() < 0.6 or (68 <= y < 72 and 4 <= x < 10)
    shapes = {shape_of(grid, x, y, table) for y in range(H) for x in range(W) if grid[y][x]}
    mz = render_mz(grid, block, base48, table)
    # 1) the slots: MZ's table on our block == our pieces drawn straight
    direct = render_truth(grid, cs, mode, Image.new("RGBA", (48, 48)))
    if overlay:
        direct = make_overlay(direct, cs)
    ref = Image.new("RGBA", mz.size)
    for y in range(H):
        for x in range(W):
            ref.paste(base48, (x * 48, y * 48))
    ref.alpha_composite(direct)
    bad = count_diff(mz, ref)
    print("shapes used: %d of 47; MZ table vs our pieces: %d pixels differ" % (len(shapes), bad))
    # 2) the mapping, against a dual grid built independently
    if not overlay:
        if mode == "vertex":
            dg, dc = render_dual_grid(grid, cs, base48)
            d_out, d_in = count_diff(mz, dg, dc), count_diff(mz, dg) - count_diff(mz, dg, dc)
            print("vs the classic dual grid: %d pixels differ outside the %d don't-care quarters "
                  "(%d inside them - MZ ignores the diagonal there)" % (d_out, len(dc), d_in))
            bad += d_out
            if outdir:
                dg.crop((0, 64 * 48 - 2 * 48, 20 * 48, H * 48)).save(os.path.join(outdir, "test_dualgrid_vertex.png"))
        else:
            fine = render_fine_dual_grid(grid, cs)
            d2 = count_diff(mz, fine)
            print("vs the fine dual grid (half mode): %d pixels differ" % d2)
            bad += d2
    if outdir:
        tag = mode + ("_overlay" if overlay else "")
        mz.crop((0, 64 * 48 - 2 * 48, 20 * 48, H * 48)).save(os.path.join(outdir, "test_mz_%s.png" % tag))
        block.save(os.path.join(outdir, "test_block_%s.png" % tag))
    print("PASS" if bad == 0 else "FAIL")
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tiles"); ap.add_argument("--test"); ap.add_argument("--plain")
    ap.add_argument("--terrain", choices=["first", "second"], default="second",
                    help="which terrain of the corner set is the autotile's own (default: second)")
    ap.add_argument("--mode", choices=["vertex", "half"], default="vertex")
    ap.add_argument("--overlay", action="store_true"); ap.add_argument("--body")
    ap.add_argument("--under", help="48x48 ground shown where the other terrain was (an L0 block)")
    ap.add_argument("--out"); ap.add_argument("--outdir")
    ap.add_argument("--paste"); ap.add_argument("--kind", type=int); ap.add_argument("--block")
    a = ap.parse_args()
    if a.test:
        d = self_test(a.test, a.terrain == "first", a.mode, a.overlay, a.outdir)
        sys.exit(0 if d == 0 else 1)
    if a.paste:
        paste_block(a.paste, a.kind, a.block, a.out)
        return
    if a.plain:
        plain_block(Image.open(a.plain).convert("RGBA")).save(a.out)
        return
    cs = CornerSet(a.tiles, a.terrain == "first")
    body = Image.open(a.body).convert("RGBA") if a.body else None
    under = Image.open(a.under).convert("RGBA") if a.under else None
    build_block(cs, a.mode, body=body, overlay=a.overlay, under=under).save(a.out)


if __name__ == "__main__":
    main()
