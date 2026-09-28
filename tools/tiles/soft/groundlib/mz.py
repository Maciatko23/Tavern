"""RPG Maker MZ A2 autotile geometry, the Winlu sheets and ground-only map renders.

A2 sheet (768x576) = kinds 16..47 as 8 columns x 4 rows of 96x144 blocks:
kind k -> block column (k-16) % 8, row (k-16) // 8. In a 'field' tileset the right half (block columns
4-7) are overlays that the editor puts on layer 1, over the ground of layer 0.

One block in 24x24 quarters (4 columns x 6 rows):
  [0..1, 0..1]  thumbnail - the editor's palette icon (shape 47, never used on the maps; an isolated
                cell is shape 46 = the four outer corners)
  [2..3, 0..1]  inner corners: [2,0] TL, [3,0] TR, [2,1] BL, [3,1] BR
  [0..3, 2..5]  a 2x2-cell island: outer corners, edges and the body
Every slot is always used for the same quarter of a cell (TL / TR / BL / BR); MZ picks one slot per
quarter from the cell's 8 neighbours (Tilemap.FLOOR_AUTOTILE_TABLE in js/rmmz_core.js).
"""
import json, os, re
import numpy as np
from PIL import Image

from . import paths as P

Q = 24

# slot (column, row in quarters) -> (quarter index 0..3 = TL, TR, BL, BR ; piece type)
# piece types: body; inner (both orthogonal neighbours same, diagonal differs); edgeV (the vertical
# neighbour same, the horizontal one differs: a left / right edge); edgeH (top / bottom edge); outer
SLOTS = {
    (2, 4): (0, "body"),  (1, 4): (1, "body"),  (2, 3): (2, "body"),  (1, 3): (3, "body"),
    (2, 0): (0, "inner"), (3, 0): (1, "inner"), (2, 1): (2, "inner"), (3, 1): (3, "inner"),
    (0, 4): (0, "edgeV"), (3, 4): (1, "edgeV"), (0, 3): (2, "edgeV"), (3, 3): (3, "edgeV"),
    (2, 2): (0, "edgeH"), (1, 2): (1, "edgeH"), (2, 5): (2, "edgeH"), (1, 5): (3, "edgeH"),
    (0, 2): (0, "outer"), (3, 2): (1, "outer"), (0, 5): (2, "outer"), (3, 5): (3, "outer"),
}
BODY_SLOTS = [(2, 4), (1, 4), (2, 3), (1, 3)]      # the 4 quarters of a fully inner cell (TL, TR, BL, BR)


def kind_xy(k):
    return ((k - 16) % 8) * 96, ((k - 16) // 8) * 144


def is_overlay_kind(k):
    return (k - 16) % 8 >= 4


_sheets = {}


def sheet(path=None):
    path = path or P.WINLU_A2
    if path not in _sheets:
        _sheets[path] = Image.open(path).convert("RGBA")
    return _sheets[path]


def block(k, path=None):
    """The 96x144 block of kind k (PIL RGBA)."""
    x, y = kind_xy(k)
    return sheet(path).crop((x, y, x + 96, y + 144))


def block_arr(k, path=None):
    return np.asarray(block(k, path)).astype(np.float64)


def body_cell(blk):
    """The 48x48 cell MZ draws for a fully inner cell (shape 0): quarters of the body slots."""
    b = np.asarray(blk).astype(np.float64) if not isinstance(blk, np.ndarray) else blk
    out = np.zeros((48, 48, b.shape[2]))
    for i, (sx, sy) in enumerate(BODY_SLOTS):
        out[(i // 2) * Q:(i // 2) * Q + Q, (i % 2) * Q:(i % 2) * Q + Q] = b[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q]
    return out


def winlu_body(k, path=None, over=None):
    """RGB of kind k's inner cell; overlays are composited over the body of kind 'over' (default grass
    k16) - what the player sees."""
    cell = body_cell(block_arr(k, path))
    if cell[..., 3].min() >= 255 or over is False:
        return cell[..., :3]
    base = body_cell(block_arr(over or 16, path))[..., :3]
    a = cell[..., 3:4] / 255.0
    return cell[..., :3] * a + base * (1 - a)


def tiled_block(tex48):
    """A 96x144 block laid with a 48-periodic texture on the 48 grid (each quarter at its own place)."""
    return np.tile(tex48, (3, 2, 1))


def plain_block(tex48):
    """Full ground: the texture in every slot (and the thumbnail) - a plain fill like Winlu's k24."""
    rgb = tiled_block(tex48[..., :3])
    return np.concatenate([rgb, np.full(rgb.shape[:2] + (1,), 255.0)], -1)


def paste(sheet_img, k, blk):
    """Put a block (PIL RGBA or float array) into kind k of a sheet (PIL, modified in place)."""
    im = blk if isinstance(blk, Image.Image) else Image.fromarray(np.round(np.clip(blk, 0, 255)).astype(np.uint8), "RGBA")
    x, y = kind_xy(k)
    sheet_img.paste(Image.new("RGBA", (96, 144)), (x, y))
    sheet_img.paste(im, (x, y))


# ------------------------------------------------------------------ MZ's own table
_table = None


def mz_table():
    global _table
    if _table is None:
        src = open(P.RMMZ_CORE, encoding="utf-8").read()
        m = re.search(r"Tilemap\.FLOOR_AUTOTILE_TABLE\s*=\s*(\[.*?\]);\s*\n", src, re.S)
        _table = json.loads(m.group(1))
    return _table


def piece_type(v, h, d):
    if v and h:
        return "body" if d else "inner"
    if v:
        return "edgeV"
    if h:
        return "edgeH"
    return "outer"


def shape_of(grid, x, y):
    """MZ's shape index of cell (x, y) of a bool grid (outside the grid = same kind, as the editor)."""
    table = mz_table()
    H, W = len(grid), len(grid[0])

    def s(dx, dy):
        xx, yy = x + dx, y + dy
        return True if not (0 <= xx < W and 0 <= yy < H) else grid[yy][xx]
    U, D, L, R = s(0, -1), s(0, 1), s(-1, 0), s(1, 0)
    UL, UR, DL, DR = s(-1, -1), s(1, -1), s(-1, 1), s(1, 1)
    # (an isolated cell is shape 46 = the 4 outer corners; 47 = the thumbnail is only the editor's icon)
    types =[piece_type(U, L, UL), piece_type(U, R, UR), piece_type(D, L, DL), piece_type(D, R, DR)]
    want = [[sx, sy] for qi, t in enumerate(types) for (sx, sy), v in SLOTS.items() if v == (qi, t)]
    for i, row in enumerate(table):
        if row == want:
            return i
    raise AssertionError("no MZ shape for %s" % want)


def cell_image(sheet_img, k, shape):
    """The 48x48 cell MZ draws for kind k with that shape."""
    x0, y0 = kind_xy(k)
    cell = Image.new("RGBA", (48, 48))
    for i, (qx, qy) in enumerate(mz_table()[shape]):
        q = sheet_img.crop((x0 + qx * Q, y0 + qy * Q, x0 + qx * Q + Q, y0 + qy * Q + Q))
        cell.alpha_composite(q, ((i % 2) * Q, (i // 2) * Q))
    return cell


def render_map(sheet_img, map_id, dx=0, dy=0, w=None, h=None, remap=None):
    """Ground-only render of a map window: A2 tiles of layers 0 and 1 drawn with MZ's own table
    (water, walls and B-E objects are left out - the in-game shots show those).
    remap: {from_kind: to_kind} - draw the cells of one kind with another (e.g. try a new ground on
    the cells of an existing one) without touching the map."""
    m = json.load(open(os.path.join(P.DATA, "Map%03d.json" % map_id), encoding="utf8"))
    MW, MH, d = m["width"], m["height"], m["data"]
    w = MW - dx if w is None else w
    h = MH - dy if h is None else h
    out = Image.new("RGBA", (w * 48, h * 48), (0, 0, 0, 255))
    cache = {}
    for z in (0, 1):
        for y in range(h):
            for x in range(w):
                mx, my = dx + x, dy + y
                if not (0 <= mx < MW and 0 <= my < MH):
                    continue
                t = d[(z * MH + my) * MW + mx]
                if not (2816 <= t < 4352):
                    continue
                kind, shape = (t - 2048) // 48, (t - 2048) % 48
                if remap and kind in remap:
                    kind = remap[kind]
                if (kind, shape) not in cache:
                    cache[(kind, shape)] = cell_image(sheet_img, kind, shape)
                out.alpha_composite(cache[(kind, shape)], (x * 48, y * 48))
    return out


def map_kind_mask(map_id, kinds, layer=1):
    """Bool grid (H x W) of the cells whose tile on 'layer' is one of 'kinds'."""
    m = json.load(open(os.path.join(P.DATA, "Map%03d.json" % map_id), encoding="utf8"))
    W, H, d = m["width"], m["height"], m["data"]
    g = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            t = d[(layer * H + y) * W + x]
            if 2816 <= t < 4352 and (t - 2048) // 48 in kinds:
                g[y, x] = True
    return g


def outdoor_maps():
    """Ids of the maps that use tileset 9 (the Winlu exterior)."""
    out = []
    for f in sorted(os.listdir(P.DATA)):
        if re.fullmatch(r"Map\d{3}\.json", f):
            m = json.load(open(os.path.join(P.DATA, f), encoding="utf8"))
            if m.get("tilesetId") == 9:
                out.append(int(f[3:6]))
    return out


def render_grid(grid, blk, base48):
    """Draw a bool grid with one block through MZ's table over a 48x48 base (for tests)."""
    im = blk if isinstance(blk, Image.Image) else Image.fromarray(np.round(np.clip(blk, 0, 255)).astype(np.uint8), "RGBA")
    base = base48 if isinstance(base48, Image.Image) else Image.fromarray(np.round(np.clip(base48, 0, 255)).astype(np.uint8)).convert("RGBA")
    H, W = len(grid), len(grid[0])
    out = Image.new("RGBA", (W * 48, H * 48))
    tmp = Image.new("RGBA", (768, 576))
    tmp.paste(im, (0, 0))
    cache = {}
    for y in range(H):
        for x in range(W):
            out.paste(base, (x * 48, y * 48))
            if grid[y][x]:
                sh = shape_of(grid, x, y)
                if sh not in cache:
                    cache[sh] = cell_image(tmp, 16, sh)
                out.alpha_composite(cache[sh], (x * 48, y * 48))
    return out
