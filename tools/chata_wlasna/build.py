# Wlasny tileset wnetrza biednej chaty (proba) - z obrazkow PixelLab w stylu Winlu (tools/chata_wlasna/src).
#   python tools/chata_wlasna/build.py             -> arkusze img/tilesets/Wlasne/Chata_A3.png (sciany), Chata_A4.png (podlogi),
#                                                     Chata_E.png (meble) + podglad docs/chata_wlasna/arkusze.png
#   python tools/chata_wlasna/build.py --install   -> + zestaw 21 w data/Tilesets.json i mapy probne 992/993 (edytor ZAMKNIETY)
#   python tools/chata_wlasna/build.py --drwal     -> + mapa probna 994: Chata drwala na naszym zestawie (Map113 bez zmian)
#   python tools/chata_wlasna/build.py --drwal-instaluj -> to samo wpisane do Map113 (wersja Winlu w base/, kopie w backup/)
# Uklad arkuszy jak w silniku: A3 = bloki 96x96 scian (cwiartki 24 px: brzegi w kolumnach/wierszach 0 i 3), A4 = bloki
# 96x144 podlog (jak A2), E = 16x16 kratek 48 px. Meble maja cien jak u Winlu (czarny, alfa 102) i ciemnobrazowy kontur.
import os, sys, json
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "src")
OUT = os.path.join(ROOT, "img", "tilesets", "Wlasne")
DOCS = os.path.join(ROOT, "docs", "chata_wlasna")
T = 48
OUTLINE = np.array([38, 30, 36], float)       # najciemniejszy kontur mebli Winlu
SHADOW_A = 102                                # cien Winlu: czarny, alfa 102
WINLU = "Winlu Fantasy Tileset - Interior/Remaster/tilesets/Fantasy_Inside_"
TILESET_ID = 21
TILESET_NAME = "Chata własna (próba PixelLab)"
MAPS = {992: "Chata własna A (glina, bielone ściany)", 993: "Chata własna B (deski, bale)",
        994: "Chata drwala na naszym zestawie (próba)"}
DRWAL_TEST = 994


def load(name):
    return np.array(Image.open(os.path.join(SRC, name + ".png")).convert("RGBA")).astype(float)


def lum(a):
    return a[..., :3].mean(-1)


# ------------------------------------------------------------------------------------------------ textures
def wrap(c, ov, axis):
    """a crop longer by `ov` along `axis` -> seamless: the first `ov` lines fade in from the lines past the end"""
    n = c.shape[axis] - ov
    c = np.moveaxis(c, axis, 0)
    out = c[:n].copy()
    for i in range(ov):
        w = i / ov
        out[i] = w * c[i] + (1 - w) * c[n + i]
    return np.moveaxis(out, 0, axis)


def calm_window(a, bad, size=T, ov=8):
    """the top-left corner of the (size+ov) window with the fewest `bad` pixels"""
    n = size + ov
    best = None
    for y in range(0, a.shape[0] - n + 1):
        for x in range(0, a.shape[1] - n + 1):
            s = bad[y:y + n, x:x + n].sum()
            if best is None or s < best[0]: best = (s, x, y)
    return best[1], best[2]


def heal(a, bad, rounds=3):
    """paint over the marked pixels with plain texture from a few pixels away (no straw or knot repeating on every tile)"""
    a = a.copy()
    bad = bad.copy()
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)): bad |= np.roll(bad, (dy, dx), (0, 1))
    H, W = bad.shape
    offs = [(0, 7), (7, 0), (0, -7), (-7, 0), (5, 5), (-5, 5), (5, -5), (-5, -5), (0, 13), (13, 0), (0, -13), (-13, 0), (11, 9), (-9, 11)]
    for _ in range(rounds):
        ys, xs = np.where(bad)
        for y, x in zip(ys, xs):
            for k, (dy, dx) in enumerate(offs):
                dy, dx = offs[(k + x + 3 * y) % len(offs)]
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and not bad[yy, xx]:
                    a[y, x] = a[yy, xx]; bad[y, x] = False
                    break
    return a


def tex_clay():
    a = load("clay")[..., :3]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bad = ((r - b > 36) & (r > 112)) | (lum(a) > 138) | (lum(a) < 74)      # straw, pebbles, deep cracks
    a = level(heal(a, bad))
    x, y = calm_window(a, np.abs(lum(a) - lum(a).mean()) > 14)
    return wrap(wrap(a[y:y + T + 8, x:x + T + 8], 8, 0), 8, 1)


def tex_daub():
    a = load("daub")[..., :3]
    bad = (a[..., 0] - a[..., 2] > 50)                                         # bare clay and wattle
    x, y = calm_window(a, bad)
    t = wrap(wrap(a[y:y + T + 8, x:x + T + 8], 8, 0), 8, 1)
    return t * np.array([0.74, 0.72, 0.69])                                    # a wall in a dim room, not a lamp


def level(a, radius=7):
    """take the big light and dark blotches out, keep the grain (a blotch would repeat on every tile)"""
    from PIL import ImageFilter
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")
    pad = Image.new("RGB", (im.width * 3, im.height * 3))
    for j in range(3):
        for i in range(3): pad.paste(im, (i * im.width, j * im.height))
    low = np.array(pad.filter(ImageFilter.GaussianBlur(radius))).astype(float)[im.height:2 * im.height, im.width:2 * im.width]
    return a - low + a.reshape(-1, 3).mean(0)


def tex_planks():
    a = load("planks")[..., :3]
    rows = lum(a).mean(1)
    gaps = [y for y in range(1, 95) if rows[y] < 45 and rows[y] <= rows[y - 1] and rows[y] <= rows[y + 1]]
    found = []
    for g in [g for g in gaps if g + 12 <= 96]:                               # each plank from its plainest stretch
        body = lum(a[g + 2:g + 12])
        marks = (body < 62) | (np.abs(body - np.median(body)) > 22)
        x0 = min(range(8, 96 - 8 - (T + 8) + 1), key=lambda x: marks[:, x:x + T + 8].sum())
        st = a[g:g + 12, x0:x0 + T + 8].copy()
        cols = lum(st[2:]).mean(0)                                             # no light-to-dark run along the plank
        smooth = np.convolve(np.pad(cols, 6, mode="edge"), np.ones(13) / 13, mode="valid")
        st[2:] *= (cols.mean() / smooth)[None, :, None]
        found.append((marks[:, x0:x0 + T + 8].sum(), g, wrap(st, 8, 1)))
    best = sorted(sorted(found, key=lambda f: f[0])[:4], key=lambda f: f[1])   # the 4 plainest planks, in their order
    t = np.concatenate([f[2] for f in best], 0)
    body = np.array([y % 12 >= 2 for y in range(T)])[:, None] & (lum(t) < 0.74 * np.median(lum(t)))   # knots, cracks
    for dy, dx in ((0, 1), (0, -1), (0, 2), (0, -2), (1, 0), (-1, 0)): body |= np.roll(body, (dy, dx), (0, 1))
    body &= np.array([y % 12 >= 2 for y in range(T)])[:, None]
    for y, x in zip(*np.where(body)):                                          # paint them over along the grain
        for d in (13, -13, 19, -19, 7, -7, 24):
            if not body[y, (x + d) % T]:
                t[y, x] = t[y, (x + d) % T]; break
    dark = lum(t) < 60                                                         # Winlu's gaps are soft, not black
    t[dark] = t[dark] + 0.5 * (np.array([78, 62, 62]) - t[dark])
    return t


def tex_logs():
    a = load("logs")[..., :3]
    rows = lum(a).mean(1)
    gaps = [y for y in range(1, 95) if rows[y] < 34 and rows[y] <= rows[y - 1] and rows[y] <= rows[y + 1]]
    logs = []
    for g0, g1 in zip(gaps, gaps[1:]):
        if len(logs) == 3: break
        idx = np.round(np.linspace(g0, g1 - 1, 16)).astype(int)                # each log 16 px tall: 3 logs = one tile
        logs.append(wrap(a[idx, 20:20 + T + 8], 8, 1))
    return np.concatenate(logs, 0)


def tile2(q, w=2, h=2):
    return np.tile(q, (h, w, 1))


def shade_edges(a, left=False, top=False, right=False, bottom=False, line=0.58, soft=0.80, depth=5):
    """the dark line and soft inner shadow of a floor where it meets a wall (as on Winlu's floors)"""
    a = a.copy()
    H, W = a.shape[:2]
    f = np.ones((H, W))
    def ramp(d):
        return np.where(d == 0, line, np.where(d < depth, soft + (1 - soft) * d / depth, 1.0))
    xs = np.arange(W)[None, :].repeat(H, 0)
    ys = np.arange(H)[:, None].repeat(W, 1)
    if left: f = np.minimum(f, ramp(xs))
    if right: f = np.minimum(f, ramp(W - 1 - xs))
    if top: f = np.minimum(f, ramp(ys))
    if bottom: f = np.minimum(f, ramp(H - 1 - ys))
    return a * f[..., None]


def shade_corners(q):
    a = q.copy()
    H, W = a.shape[:2]
    ys, xs = np.mgrid[0:H, 0:W]
    f = np.ones((H, W))
    for cx, cy in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        d = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
        f = np.minimum(f, np.where(d < 1, 0.58, np.where(d < 5, 0.80 + 0.20 * d / 5, 1.0)))
    return a * f[..., None]


def floor_block(q):
    """96x144, the A2 layout: [single tile | inner corners] over the 96x96 frame"""
    b = np.zeros((144, 96, 3))
    b[0:48, 0:48] = shade_edges(q, True, True, True, True)
    b[0:48, 48:96] = shade_corners(q)
    b[48:144] = shade_edges(tile2(q), True, True, True, True)
    return b


def wall_block(q, kind, wood):
    """96x96 wall block; `wood` = a seamless 48x48 dark wood tile for the frame"""
    b = tile2(q)
    if kind == "daub":
        beam = np.tile(wood[1:10], (1, 2, 1)) * 0.92                             # 9 px beam under the ceiling
        sill = np.tile(wood[17:25], (1, 2, 1)) * 0.80                            # 8 px sill on the floor
        post = np.tile(np.rot90(wood[33:41]), (2, 1, 1))[:96] * 0.86             # 8 px posts at the wall's ends
        for d, k in ((0, 0.72), (1, 0.84), (2, 0.93)): b[9 + d] *= k             # the beam's shadow on the plaster
        b[:, 0:8] = post; b[:, 88:96] = post[:, ::-1]
        b[:, 8] = OUTLINE; b[:, 87] = OUTLINE
        b[0:9] = beam; b[9] = OUTLINE
        b[88:96] = sill; b[87] = OUTLINE
        b[0] = OUTLINE; b[95] = OUTLINE; b[:, 0] = OUTLINE; b[:, 95] = OUTLINE
    else:                                                                        # logs: only shade and a dark foot
        for d, k in ((0, 0.62), (1, 0.74), (2, 0.84), (3, 0.92)): b[d] *= k
        for d, k in ((0, 0.6), (1, 0.8), (2, 0.92)):
            b[:, d] *= k; b[:, 95 - d] *= k
        b[95] *= 0.6
    return b


def rgba(a):
    return np.concatenate([np.clip(a, 0, 255), np.full(a.shape[:2] + (1,), 255.0)], -1)


# ------------------------------------------------------------------------------------------------ furniture
def clean(a):
    """hard alpha, and a dark brown outline where PixelLab drew a black one"""
    a = a.copy()
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    solid = a[..., 3] > 0
    black = solid & (lum(a) < 33)
    a[black, :3] = OUTLINE
    a[~solid] = 0
    return a


def with_shadow(a, legged, reach=4):
    """Winlu's floor shadow: the shape pushed to the right, and for things on legs the floor under them too"""
    m = a[..., 3] > 0
    H, W = m.shape
    sh = np.zeros_like(m)
    sh[:, reach:] |= m[:, :-reach]
    for d in range(1, reach): sh[:, d:] |= m[:, :-d]
    ys = np.where(m.any(1))[0]
    y0, y1 = ys.min(), ys.max()
    sh[:y0 + (y1 - y0) // 3] = False                       # the shadow lies on the floor: not beside the thing's top
    if legged:
        for x in range(W):
            col = np.where(m[:, x])[0]
            if len(col): sh[col.min():y1 + 1, x] = True
    out = a.copy()
    only = sh & ~m
    out[only] = [0, 0, 0, SHADOW_A]
    return out


# name: (col, row, cells w, cells h, align, kind)   kind: floor thing / legged / wall / rug
LAYOUT = {
    "bed":    (0, 0, 1, 2, "bottom", "thing"),
    "bed2":   (1, 0, 2, 2, "bottom", "thing"),
    "table":  (3, 0, 2, 2, "bottom", "legged"),
    "rug":    (5, 0, 2, 2, "center", "rug"),
    "pegs":   (7, 0, 2, 2, "top", "wall"),
    "wheel":  (9, 0, 1, 2, "bottom", "legged"),
    "churn":  (10, 0, 1, 2, "bottom", "thing"),
    "chair":  (11, 0, 1, 2, "bottom", "legged"),
    "oven":   (12, 0, 2, 3, "bottom", "thing"),
    "bench":  (0, 2, 2, 1, "bottom", "legged"),
    "shelf":  (2, 2, 2, 1, "center", "wall"),
    "stool":  (4, 2, 1, 1, "bottom", "legged"),
    "cradle": (5, 2, 1, 1, "bottom", "thing"),
    "herbs":  (6, 2, 1, 1, "center", "wall"),
    "window": (7, 2, 1, 1, "center", "wall"),
    "chips":  (8, 2, 1, 1, "center", "decor"),
    "straw":  (9, 2, 1, 1, "center", "decor"),
    "axe":    (10, 2, 1, 2, "center", "wall"),
}
X, STAR, FREE = 1551, 1552, 1536        # like tileset 8: impassable / above the characters / walkable


def tile_id(col, row):
    return 768 + (128 if col >= 8 else 0) + row * 8 + col % 8


def furniture_sheet():
    sheet = np.zeros((768, 768, 4))
    flags, cells = {}, {}
    for name, (col, row, cw, ch, align, kind) in LAYOUT.items():
        a = clean(load(name))
        if kind == "decor":                                      # litter on the floor: dull, never brighter than the things
            if name == "chips": a[lum(a) > 150] = 0                # no white specks: they glitter like sparks
            g = lum(a)[..., None]
            a[..., :3] = (g + (a[..., :3] - g) * (0.75 if name == "straw" else 0.9)) * (0.8 if name == "straw" else 0.72)
        ys, xs = np.where(a[..., 3] > 0)
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        h, w = a.shape[:2]
        W, H = cw * T, ch * T
        assert w <= W and h <= H, (name, w, h)
        box = np.zeros((H, W, 4))
        if kind in ("thing", "legged"):
            x0 = max(0, min((W - w) // 2, W - w - 4))          # room for the shadow on the right
            y0 = H - h - (1 if h < H else 0)
        elif align == "top":
            x0, y0 = (W - w) // 2, 2
        else:
            x0, y0 = (W - w) // 2, (H - h) // 2
        box[y0:y0 + h, x0:x0 + w] = a
        if kind in ("thing", "legged"): box = with_shadow(box, kind == "legged")
        if kind == "wall":                                       # a thin shadow on the wall, below and to the right
            m = box[..., 3] > 0
            sh = np.zeros_like(m); sh[2:, 2:] = m[:-2, :-2]
            box[sh & ~m] = [0, 0, 0, 70]
        sheet[row * T:row * T + H, col * T:col * T + W] = box
        ids = [[tile_id(col + i, row + j) for i in range(cw)] for j in range(ch)]
        cells[name] = ids
        for j in range(ch):
            for i in range(cw):
                part = box[j * T:(j + 1) * T, i * T:(i + 1) * T, 3]
                if not (part > 0).any(): fl = STAR
                elif kind in ("rug", "decor"): fl = FREE
                elif kind == "wall": fl = STAR
                else:
                    rows_used = np.where((part == 255).any(1))[0]
                    low = len(rows_used) and rows_used.min() >= T - 26       # only the far edge of the thing is in this cell
                    fl = STAR if (j < ch - 1 and low) else X
                flags[ids[j][i]] = fl
    return sheet, flags, cells


# ------------------------------------------------------------------------------------------------ sheets
def build_sheets():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(DOCS, exist_ok=True)
    clay, planks, daub, logs = tex_clay(), tex_planks(), tex_daub(), tex_logs()
    a3 = np.zeros((384, 768, 4))
    a3[0:96, 0:96] = rgba(wall_block(daub, "daub", logs))
    a3[0:96, 96:192] = rgba(wall_block(logs, "logs", logs))
    a4 = np.zeros((720, 768, 4))
    a4[0:144, 0:96] = rgba(floor_block(clay))
    a4[0:144, 96:192] = rgba(floor_block(planks))
    e, flags, cells = furniture_sheet()
    for name, arr in (("Chata_A3", a3), ("Chata_A4", a4), ("Chata_E", e)):
        Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(os.path.join(OUT, name + ".png"))
    # one picture of all three for the docs
    prev = Image.new("RGBA", (768 + 200 + 16, 768), (96, 80, 66, 255))
    prev.alpha_composite(Image.fromarray(np.clip(e, 0, 255).astype(np.uint8), "RGBA"), (0, 0))
    prev.alpha_composite(Image.fromarray(np.clip(a3[0:96, 0:192], 0, 255).astype(np.uint8), "RGBA"), (776, 8))
    prev.alpha_composite(Image.fromarray(np.clip(a4[0:144, 0:192], 0, 255).astype(np.uint8), "RGBA"), (776, 112))
    prev.crop((0, 0, 984, 300)).resize((984 * 2, 600), Image.NEAREST).save(os.path.join(DOCS, "arkusze.png"))
    json.dump({"cells": cells, "flags": {str(k): v for k, v in flags.items()}}, open(os.path.join(HERE, "index.json"), "w"), indent=0)
    return flags, cells


# ------------------------------------------------------------------------------------------------ maps
def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def floor_shape(same):
    """the editor's floor autotile shape (0-47); same(dx, dy) -> the neighbour is the same kind"""
    L, U, R, D = not same(-1, 0), not same(0, -1), not same(1, 0), not same(0, 1)
    TL, TR, BR, BL = not same(-1, -1), not same(1, -1), not same(1, 1), not same(-1, 1)
    n = L + U + R + D
    if n == 0: return TL * 1 + TR * 2 + BR * 4 + BL * 8
    if n == 1:
        if L: return 16 + TR * 1 + BR * 2
        if U: return 20 + BR * 1 + BL * 2
        if R: return 24 + BL * 1 + TL * 2
        return 28 + TL * 1 + TR * 2
    if n == 2:
        if L and R: return 32
        if U and D: return 33
        if L and U: return 34 + BR
        if U and R: return 36 + BL
        if R and D: return 38 + TL
        return 40 + TR
    if n == 3:
        if not D: return 42
        if not R: return 43
        if not U: return 44
        return 45
    return 46


def page(image=None, priority=0, trigger=0, through=False, cmds=None, step=False, dirfix=False):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A",
                           "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False,
                           "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": dirfix,
            "image": image or {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0},
            "list": (cmds or []) + [{"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": priority, "stepAnime": step, "through": through, "trigger": trigger,
            "walkAnime": False}


SUN = "<LightCone:length=100,angle=28,dir=90,width=22,anchor=top,offsety=-8,blur=5,dust=10,dustsize=1,r=255,g=226,b=186,when=day>"


def build_map(map_id, wall_kind, floor_kind, cells, things, windows, back):
    W, H = 13, 10
    VOID = 17                                              # Winlu A2 kind 17: the dark ceiling around the room
    kind = [[("void", VOID)] * W for _ in range(H)]
    for y in range(1, 4):
        for x in range(1, W - 1): kind[y][x] = ("wall", wall_kind)
    for y in range(4, 9):
        for x in range(1, W - 1): kind[y][x] = ("floor", floor_kind)
    kind[9][6] = ("floor", floor_kind)                     # the doorway
    data = [0] * (W * H * 6)

    def at(x, y):
        return kind[y][x] if 0 <= x < W and 0 <= y < H else None

    for y in range(H):
        for x in range(W):
            k = kind[y][x]
            same = lambda dx, dy: at(x + dx, y + dy) in (None, k)
            if k[0] == "wall":
                s = (not same(-1, 0)) * 1 + (y == 1) * 2 + (not same(1, 0)) * 4 + (y == 3) * 8
                tid = 4352 + k[1] * 48 + s
            elif k[0] == "floor": tid = 5888 + k[1] * 48 + floor_shape(same)
            else: tid = 2816 + k[1] * 48 + floor_shape(same)
            data[y * W + x] = tid

    def put(name, x, y, z=2):
        """the thing's bottom-left cell at (x, y)"""
        ids = cells[name]
        for j, row in enumerate(ids):
            for i, tid in enumerate(row):
                yy = y - (len(ids) - 1 - j)
                data[(z * H + yy) * W + x + i] = tid

    for name, x, y, z in things: put(name, x, y, z)
    events = [None]

    def add(name, x, y, note, pg):
        events.append({"id": len(events), "name": name, "note": note, "pages": [pg], "x": x, "y": y})

    for wx in windows:
        data[(2 * H + 1) * W + wx] = 16; data[(2 * H + 2) * W + wx] = 24      # Winlu's window (B 16 over 24)
        add("okno (słońce)", wx, 2, SUN, page())
    ox, oy = things[0][1], things[0][2]
    if ox < W // 2: ox += 1                               # the oven cell nearer the middle of the room
    add("Żar w piecu", ox, oy, "<Light:150,120,60,16>", page(through=True))
    add("Drzwi -> " + back[0], 6, 9, "",
        page(trigger=1, cmds=[{"code": 250, "indent": 0, "parameters": [{"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}]},
                              {"code": 201, "indent": 0, "parameters": [0, back[1], back[2], back[3], 2, 0]}]))
    props = {"autoplayBgm": False, "bgm": {"name": "Town1", "pan": 0, "pitch": 100, "volume": 90}, "autoplayBgs": False,
             "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90}, "disableDashing": False, "displayName": "Chata (próba)",
             "encounterList": [], "encounterStep": 30, "height": H,
             "note": "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.35>\n<DarkDay:85>\n<DarkNight:185>",
             "parallaxLoopX": False, "parallaxLoopY": False, "parallaxName": "", "parallaxShow": True, "parallaxSx": 0, "parallaxSy": 0,
             "scrollType": 0, "specifyBattleback": False, "tilesetId": TILESET_ID, "width": W}
    lines = ["{", dump(props)[1:-1] + ",", '"data":' + dump(data) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(events) - 1 else "") for i, e in enumerate(events)]
    lines += ["]", "}"]
    return "\n".join(lines).encode("utf-8")


def plans():
    # (thing, x of its left cell, y of its bottom cell, layer); the oven first (its glow stands there)
    a = [("oven", 1, 4, 2), ("churn", 3, 5, 2), ("shelf", 4, 2, 2), ("herbs", 8, 2, 2), ("pegs", 9, 3, 2),
         ("bed2", 10, 5, 2), ("cradle", 9, 4, 2), ("table", 2, 7, 2), ("bench", 2, 8, 2), ("chair", 4, 7, 2),
         ("rug", 7, 7, 1), ("wheel", 10, 8, 2), ("stool", 11, 8, 2)]
    b = [("oven", 10, 4, 2), ("churn", 9, 5, 2), ("shelf", 7, 2, 2), ("herbs", 4, 2, 2), ("pegs", 2, 3, 2),
         ("bed", 1, 5, 2), ("bed", 2, 5, 2), ("table", 8, 7, 2), ("bench", 8, 8, 2), ("stool", 10, 7, 2),
         ("rug", 4, 7, 1), ("wheel", 1, 8, 2), ("chair", 2, 8, 2), ("cradle", 3, 4, 2)]
    return {992: (0, 0, a, [6]), 993: (1, 1, b, [6])}


def install(flags, cells):
    import subprocess
    if "RPGMZ.exe" in subprocess.run(["tasklist"], capture_output=True, text=True).stdout:
        sys.exit("Edytor RPG Maker MZ jest otwarty - zamknij go przed --install.")
    # the tileset: Winlu's interior for the rest (rugs, windows, furniture to compare), ours in A3, A4 and E
    p = os.path.join(ROOT, "data", "Tilesets.json")
    sets = json.load(open(p, encoding="utf-8"))
    base = sets[8]
    fl = list(base["flags"])
    for i in range(768, 1024): fl[i] = STAR if i >= 768 else fl[i]
    for k, v in flags.items(): fl[int(k)] = v
    names = list(base["tilesetNames"])
    names[2], names[3], names[8] = "Wlasne/Chata_A3", "Wlasne/Chata_A4", "Wlasne/Chata_E"
    entry = {"id": TILESET_ID, "flags": fl, "mode": 1, "name": TILESET_NAME, "note": "", "tilesetNames": names}
    while len(sets) <= TILESET_ID: sets.append(None)
    if sets[TILESET_ID] and sets[TILESET_ID]["name"] != TILESET_NAME: sys.exit("Zestaw %d jest zajety." % TILESET_ID)
    sets[TILESET_ID] = entry
    open(p, "wb").write(("[\n" + ",\n".join(dump(s) for s in sets) + "\n]").encode("utf-8"))
    # the maps
    for mid, (wk, fk, things, wins) in plans().items():
        raw = build_map(mid, wk, fk, cells, things, wins, ("Podgrodzie", 111, 28, 45))
        open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "wb").write(raw)
    p = os.path.join(ROOT, "data", "MapInfos.json")
    infos = json.load(open(p, encoding="utf-8"))
    order = max(m["order"] for m in infos if m)
    for mid, name in MAPS.items():
        if not os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % mid)): continue
        while len(infos) <= mid: infos.append(None)
        if infos[mid] is None:
            order += 1
            infos[mid] = {"id": mid, "expanded": False, "name": name, "order": order, "parentId": 0, "scrollX": 0, "scrollY": 0}
        elif infos[mid]["name"] != name: sys.exit("Mapa %d jest zajeta." % mid)
    open(p, "wb").write(("[\n" + ",\n".join(dump(m) for m in infos) + "\n]").encode("utf-8"))
    print("zainstalowano: zestaw", TILESET_ID, "+ mapy", list(MAPS))


# ------------------------------------------------------------------------------------------------ the oven with a fire
OVEN_SHEET = "!$Piec_gliniany"          # like Winlu's !$Fireplace2: rows 0 and 2 cold, rows 1 and 3 (directions 4 and 8) burning
FW, FH = 96, 120


def oven_sheet():
    """img/characters/!$Piec_gliniany.png: the clay oven as an event picture, Winlu's own flames and logs in its mouth.
    Returns the flame's height above the frame's bottom (for <LightAt:N>)"""
    o = clean(load("oven"))
    ys, xs = np.where(o[..., 3] > 0)
    o = o[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = o.shape[:2]
    frame = np.zeros((FH, FW, 4))
    x0, y0 = (FW - w) // 2 - 2, FH - h - 1
    frame[y0:y0 + h, x0:x0 + w] = o
    cold = with_shadow(frame, False)
    L = lum(frame)
    mouth = (frame[..., 3] > 0) & (L < 72)
    mouth[:y0 + int(h * 0.62)] = False                       # only the opening low in the front, not the chimney's hole
    cols = np.where(mouth.any(0))[0]
    mid = (cols.min() + cols.max()) // 2
    mouth[:, :mid - 15] = False; mouth[:, mid + 16:] = False
    ys, xs = np.where(mouth)
    mx0, mx1, my0, my1 = xs.min(), xs.max(), ys.min(), ys.max()
    fire = np.array(Image.open(os.path.join(ROOT, "img", "characters", "!$Fireplace2.png")).convert("RGBA")).astype(float)
    near = np.zeros_like(mouth)                               # the bricks and soot round the mouth catch the light
    for dy in range(-5, 6):
        for dx in range(-5, 6):
            if dx * dx + dy * dy <= 25:
                sh = np.zeros_like(mouth)
                ys0, ys1 = max(0, dy), min(FH, FH + dy); xs0, xs1 = max(0, dx), min(FW, FW + dx)
                sh[ys0:ys1, xs0:xs1] = mouth[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
                near |= sh
    near &= (frame[..., 3] > 0) & ~mouth
    lit = []
    for i in range(3):
        f = cold.copy()
        box = fire[144 + 64:144 + 96, i * 144 + 56:i * 144 + 89]         # the firebox of the burning stone fireplace
        bh, bw = box.shape[:2]
        bx, by = (mx0 + mx1) // 2 - bw // 2, my1 - bh + 1 + 2
        for y in range(bh):
            for x in range(bw):
                yy, xx = by + y, bx + x
                if 0 <= yy < FH and 0 <= xx < FW and mouth[yy, xx] and box[y, x, 3] > 200:
                    f[yy, xx, :3] = box[y, x, :3]
        f[near, :3] = np.clip(f[near, :3] * np.array([1.22, 1.02, 0.80]), 0, 255)
        lit.append(f)
    sheet = np.zeros((FH * 4, FW * 3, 4))
    for r in range(4):
        for i in range(3):
            sheet[r * FH:(r + 1) * FH, i * FW:(i + 1) * FW] = lit[i] if r % 2 else cold
    Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8), "RGBA").save(os.path.join(ROOT, "img", "characters", OVEN_SHEET + ".png"))
    return FH - (my0 + my1) // 2


# ------------------------------------------------------------------------------------------------ the woodcutter's hut
def drwal(cells, light_at, real=False):
    """Chata drwala (Map113, Podgrodzie) on our set as the TEST map 994 - Map113 itself stays Winlu's (the user, 2026-11-12:
    the old one was better, the firewood ran into the oven). Our log walls, plank floor, oven with a fire, straw bed, table,
    stools, window and axes; his charcoal, barrel, chest, firewood, hams and the rug stay. The oven is 78 px wide on its one
    cell, so the firewood stands a cell away from it and the two half-covered cells beside it are closed."""
    import shutil, subprocess
    if "RPGMZ.exe" in subprocess.run(["tasklist"], capture_output=True, text=True).stdout:
        sys.exit("Edytor RPG Maker MZ jest otwarty - zamknij go.")
    src = os.path.join(ROOT, "data", "Map113.json")
    base = os.path.join(HERE, "base", "Map113.json")
    os.makedirs(os.path.dirname(base), exist_ok=True)
    d = json.load(open(src, encoding="utf-8"))
    if d["tilesetId"] != TILESET_ID: shutil.copyfile(src, base)           # the Winlu version, kept
    else: d = json.load(open(base, encoding="utf-8"))                     # Map113 is ours already: build from Winlu's again
    W, H = d["width"], d["height"]
    data = d["data"]
    cell = lambda z, x, y: (z * H + y) * W + x
    kind = {}
    for y in range(H):
        for x in range(W):
            t = data[cell(0, x, y)]
            kind[x, y] = "wall" if 4352 <= t < 5888 else "floor" if t >= 5888 else "void"
    for (x, y), k in kind.items():
        same = lambda dx, dy: kind.get((x + dx, y + dy), k) == k
        if k == "wall":
            top, bottom = kind.get((x, y - 1)) != "wall", kind.get((x, y + 1)) != "wall"
            data[cell(0, x, y)] = 4352 + 48 + (not same(-1, 0)) * 1 + top * 2 + (not same(1, 0)) * 4 + bottom * 8
        elif k == "floor":
            data[cell(0, x, y)] = 5888 + 48 + floor_shape(same)
    for z in (2, 3):                                                       # Winlu's B (windows), C (furniture), E (axes) go
        for y in range(H):
            for x in range(W):
                t = data[cell(z, x, y)]
                if 0 < t < 512 or 768 <= t < 1024: data[cell(z, x, y)] = 0

    def put(name, x, y, z=2):
        ids = cells[name]
        for j, row in enumerate(ids):
            for i, tid in enumerate(row):
                yy = y - (len(ids) - 1 - j)
                c = cell(z, x + i, yy)
                if data[c] and z == 2: c = cell(3, x + i, yy)
                assert not data[c], (name, x, y)
                data[c] = tid

    put("bed", 11, 5); put("table", 8, 8); put("stool", 7, 8); put("stool", 10, 8)
    put("window", 2, 2); put("window", 10, 2); put("axe", 3, 2); put("axe", 9, 2)
    for name, x, y in (("chips", 8, 5), ("chips", 4, 5), ("straw", 10, 5)):
        if not data[cell(1, x, y)]: data[cell(1, x, y)] = cells[name][0][0]
    d["tilesetId"] = TILESET_ID
    for e in d["events"]:
        if e and e["name"] == "Kominek":
            img = e["pages"][0]["image"]
            img["characterName"], img["direction"], img["pattern"] = OVEN_SHEET, 4, 0
            e["pages"][0]["stepAnime"] = True; e["pages"][0]["directionFix"] = True
            e["note"] = "<Light:330,120,60,16><LightAt:%d>" % light_at
            ox, oy = e["x"], e["y"]
        if e and e["name"] == "Świeca": e["note"] += "<Px:-14,14>"          # our table top begins lower in its cell than Winlu's
        if e and e["name"].startswith("Na stole"): e["note"] = e["note"].replace("<Px:0,-20>", "<Px:8,-25>")
        if e and e["name"].startswith("okno"):                           # our window is one small cell: the sunbeam starts under it
            e["note"] = e["note"].replace("offsety=-8", "offsety=24").replace("length=100", "length=90")
    wood = sorted((e for e in d["events"] if e and e["name"].startswith("Drewno") and abs(e["x"] - ox) == 1 and e["y"] == oy),
                  key=lambda e: e["x"])
    for e in wood: e["x"] += -1 if e["x"] < ox else 1                     # the firewood clear of the oven's sides
    for i, e in enumerate(d["events"]):
        if e and e["name"].startswith("Miejsce:") and not real: d["events"][i] = None   # the resident lives on Map113 only
    for dx in (-1, 1):                                                    # the cells the oven half covers: nobody stands there
        d["events"].append({"id": len(d["events"]), "name": "Bok pieca", "note": "", "x": ox + dx, "y": oy,
                            "pages": [page(priority=1)]})
    for y in range(H):                                                    # a thing lying on the table as a layer-3 tile sits
        for x in range(W):                                                # at the cell's bottom = our table's far edge: as an
            t = data[cell(3, x, y)]                                       # event it can be moved down onto the boards
            if t and data[cell(2, x, y)] in sum(cells["table"], []) and data[cell(2, x, y)] == cells["table"][0][x - 8]:
                data[cell(3, x, y)] = 0
                d["events"].append({"id": len(d["events"]), "name": "Na stole: dzban", "note": "<Px:4,15>", "x": x, "y": y,
                                    "pages": [page(image={"tileId": t, "characterName": "", "direction": 2, "pattern": 0,
                                                          "characterIndex": 0}, dirfix=True)]})
    # the hero walks up to the table's far edge and the boards cover his legs (the user, 2026-11-12), so that cell is a star
    # tile - and what lies on the table is drawn above the characters, or the star tile would cut it
    for e in d["events"]:
        if e and (e["name"] == "Świeca" or e["name"].startswith("Na stole")):
            for pg in e["pages"]: pg["priorityType"] = 2
    if not real: d["displayName"] = "Chata drwala (próba)"
    events = d.pop("events"); d.pop("data")
    lines = ["{", dump(d)[1:-1] + ",", '"data":' + dump(data) + ",", '"events":[']
    lines += [dump(e) + ("," if i < len(events) - 1 else "") for i, e in enumerate(events)]
    lines += ["]", "}"]
    if real:                                 # the user saw the test map 994 and said "daj nową" (2026-11-12)
        import time
        os.makedirs(os.path.join(HERE, "backup"), exist_ok=True)
        shutil.copyfile(src, os.path.join(HERE, "backup", "Map113_%s.json" % time.strftime("%Y%m%d_%H%M%S")))
        open(src, "wb").write("\n".join(lines).encode("utf-8"))
        bump_version()
        print("Chata drwala (Map113) na naszym zestawie; wersja Winlu: tools/chata_wlasna/base/Map113.json")
        return
    open(os.path.join(ROOT, "data", "Map%03d.json" % DRWAL_TEST), "wb").write("\n".join(lines).encode("utf-8"))
    print("Chata drwala na naszym zestawie: mapa probna", DRWAL_TEST)


def bump_version():
    """saves made before a map changed keep its old event pictures until the version changes"""
    import re
    p = os.path.join(ROOT, "data", "System.json")
    raw = open(p, "rb").read()
    m = re.search(rb'"versionId":(\d+)', raw)
    open(p, "wb").write(raw[:m.start(1)] + str(int(m.group(1)) + 1).encode() + raw[m.end(1):])


if __name__ == "__main__":
    flags, cells = build_sheets()
    light_at = oven_sheet()
    print("arkusze:", OUT)
    if "--drwal" in sys.argv: drwal(cells, light_at)
    if "--drwal-instaluj" in sys.argv: drwal(cells, light_at, real=True)
    if any(a in sys.argv for a in ("--install", "--drwal", "--drwal-instaluj")): install(flags, cells)
