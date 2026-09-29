# python make_decor.py  -> img/characters/!House_Decor.png (144x144 frames, 12 x 8), img/characters/!$House_Decor_Big.png
#                          (288x192 frames), tools/house/decor/decor_index.json, the <decor-data> line of js/plugins/HomeDecor.js,
#                          docs/dom_dziadka/ozdoby.png (every prop beside Winlu pieces, labelled in Polish) and out/ previews.
# Grandpa's house decorations (HomeDecor.js): the trophies and keepsakes the hero earns, the seasons' things, the folk touches.
# Sources: PixelLab Pro Flash pictures in src/ (made on a Winlu style reference at about 2-3x the game size, SOURCES.txt), Winlu
# Interior pieces (the Holy Mother's frame -> the Lord's receipt, a wall shelf -> the hero's shelf, a plate -> the wafer's plate)
# and small things painted here (the wycinanki, the towel, the rag rug, the tablecloth, the notice, the nail).
# Finishing like the cottage's other props: premultiplied Lanczos downscale, Winlu's hard alpha, a light sharpen, a nudge of the
# colours towards Winlu's muted palette (nearest Winlu colour where one is close), a 1 px dark rim where the downscale lost it,
# Winlu's 40 % black drop shadow for things standing on the floor or a table.
# Every frame is laid out so its thing lands exactly where the house wants it: the absolute pixel spot on Map019 (48 px cells)
# is given per look (PLACE), the frame is cut around the event's cell (bottom-centre of a frame = bottom-centre of the cell).
import os, sys, json, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern"))
from artlib import (char_frame, cell, bbox, premul_resize, harden, sharpen, grade, Canvas4, recolour, sheet as winlu_sheet)
import pixfont
from props_art import parchment
sys.path.insert(0, HERE)
import decor_paint as DP

SRC = os.path.join(HERE, "src")
OUT = os.path.join(HERE, "out")
CHARS = os.path.join(ROOT, "img", "characters")
DOCS = os.path.join(ROOT, "docs", "dom_dziadka")
PLUGIN = os.path.join(ROOT, "js", "plugins", "HomeDecor.js")
INDEX = os.path.join(HERE, "decor_index.json")
SHEET, BIG = "!House_Decor", "!$House_Decor_Big"
FW = FH = 144                 # a frame of the small sheet: 3 x 3 cells (the event's cell at the bottom middle)
BW, BH = 288, 192             # a frame of the big sheet: 6 x 4 cells
OUTLINE = (43, 29, 20)

def src(name):
    return Image.open(os.path.join(SRC, name)).convert("RGBA")

# ------------------------------------------------------------------------------------------------ cutting the PixelLab grids
def components(a, t=100):
    """4-connected pieces of the opaque mask -> [(area, (x0, y0, x1, y1), mask)]"""
    m = a > t
    H, W = m.shape
    lab = np.zeros((H, W), np.int32)
    out, n = [], 0
    for y0 in range(H):
        for x0 in range(W):
            if not m[y0, x0] or lab[y0, x0]: continue
            n += 1
            stack, pts = [(y0, x0)], []
            lab[y0, x0] = n
            while stack:
                y, x = stack.pop()
                pts.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; stack.append((yy, xx))
            ys = [p[0] for p in pts]; xs = [p[1] for p in pts]
            out.append((len(pts), (min(xs), min(ys), max(xs) + 1, max(ys) + 1), n))
    return out, lab

def piece(grid, box, keep_near=5, min_area=4):
    """one prop out of a grid: the crop, then only the biggest piece and what lies close to it (no crumbs of the neighbours)"""
    im = grid.crop(box)
    a = np.array(im)
    comps, lab = components(a[:, :, 3])
    if not comps: return im
    comps.sort(key=lambda c: -c[0])
    x0, y0, x1, y1 = comps[0][1]
    keep = np.zeros(lab.shape, bool)
    for area, (cx0, cy0, cx1, cy1), n in comps:
        near = cx1 >= x0 - keep_near and cx0 <= x1 + keep_near and cy1 >= y0 - keep_near and cy0 <= y1 + keep_near
        if n == comps[0][2] or (near and area >= min_area):
            keep |= lab == n
    a[~keep] = (0, 0, 0, 0)
    out = Image.fromarray(a, "RGBA")
    return out.crop(bbox(out, 0))

# ------------------------------------------------------------------------------------------------ finishing
_WPAL = None
def winlu_palette():
    """the colours of the Winlu Interior sheets the cottage uses (B, C, D, the decoration characters): the mean colour of
    every filled 5-bit RGB bucket (real Winlu colours, not a handful of averages)"""
    global _WPAL
    if _WPAL is None:
        cols = []
        for name in ("B", "C", "D", "!Decoration_static", "!Decoration2", "!Fantasy_chest"):
            a = np.array(winlu_sheet(name)).reshape(-1, 4)
            cols.append(a[a[:, 3] > 250][:, :3].astype(np.float32))
        c = np.concatenate(cols)
        key = (c[:, 0].astype(np.int32) >> 3) * 1024 + (c[:, 1].astype(np.int32) >> 3) * 32 + (c[:, 2].astype(np.int32) >> 3)
        order = np.argsort(key); key, c = key[order], c[order]
        cut = np.flatnonzero(np.diff(key)) + 1
        _WPAL = np.array([g.mean(axis=0) for g in np.split(c, cut)], np.float32)
    return _WPAL

def winlu_match(im, thr=22.0):
    """each colour -> the nearest Winlu colour when one lies within thr (RGB distance); the folk colours Winlu lacks stay"""
    a = np.array(im).astype(np.float32)
    pal = winlu_palette()
    flat = a[:, :, :3].reshape(-1, 3)
    best = np.zeros(len(flat), np.int32); dist = np.full(len(flat), 1e9, np.float32)
    for i in range(0, len(pal), 64):
        d = ((flat[:, None, :] - pal[None, i:i + 64, :]) ** 2).sum(axis=2)
        j = d.argmin(axis=1); dj = d[np.arange(len(flat)), j]
        better = dj < dist
        best[better] = j[better] + i; dist[better] = dj[better]
    near = np.sqrt(dist) <= thr
    flat[near] = pal[best[near]]
    a[:, :, :3] = flat.reshape(a.shape[0], a.shape[1], 3)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")

def rim(im, k=0.45):
    """darken opaque edge pixels that came out too light (restores the dark rim the downscale softened)"""
    a = np.array(im).astype(np.int32)
    op = a[:, :, 3] > 0
    H, W = op.shape
    edge = np.zeros_like(op)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        sh = np.zeros_like(op)
        sh[max(0, dy):H + min(0, dy), max(0, dx):W + min(0, dx)] = op[max(0, -dy):H - max(0, dy), max(0, -dx):W - max(0, dx)]
        edge |= ~sh
    edge &= op
    light = a[:, :, :3].mean(axis=2) > 70
    sel = edge & light
    a[sel, 0] = (a[sel, 0] * k).astype(np.int32); a[sel, 1] = (a[sel, 1] * (k - 0.03)).astype(np.int32); a[sel, 2] = (a[sel, 2] * (k - 0.03)).astype(np.int32)
    return Image.fromarray(a.astype(np.uint8), "RGBA")

def finish(im, scale, sat=0.92, match=True, edge=True, sharp=True):
    """a PixelLab piece -> game size, Winlu's look"""
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    out = premul_resize(im, (w, h))
    if sharp: out = sharpen(out, 0.7, 45)
    out = harden(out, 110)
    out = grade(out, sat=sat)
    if match: out = winlu_match(out)
    if edge: out = rim(out)
    return out.crop(bbox(out, 0))

def shadow(im, dx=3, dy=2, alpha=102):
    """Winlu's floor shadow: the silhouette in 40 % black, moved right / down, behind the thing"""
    out = Image.new("RGBA", (im.width + dx, im.height + dy), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, alpha))
    sh.putalpha(im.getchannel("A").point(lambda v: alpha if v else 0))
    out.alpha_composite(sh, (dx, dy)); out.alpha_composite(im, (0, 0))
    return out

def mirror(im):
    return im.transpose(Image.FLIP_LEFT_RIGHT)

def solid_box(im, t=100):
    a = np.array(im)[:, :, 3]
    ys, xs = np.nonzero(a > t)
    return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if len(xs) else [0, 0, 0, 0]

# ------------------------------------------------------------------------------------------------ the pieces
def pixellab_pieces():
    g1 = src("grid_pelt_antlers_wreath_sheaf_s2801.png")
    g2 = src("grid_pumpkins_easter_apples_willow_s2802.png")
    g3 = src("grid_flowers_herbs_spruce_chest_s2803.png")
    g4 = src("grid_tankard_tusk_dice_oplatek_s2804.png")
    P = {}
    P["pelt"] = finish(piece(g1, (2, 24, 156, 118)), 0.58, sat=0.9)
    P["antlers"] = finish(piece(g1, (154, 10, 232, 110)), 0.5)
    P["wreath"] = finish(piece(g1, (16, 112, 114, 250)), 0.46, sat=0.95)
    P["sheaf"] = finish(piece(g1, (140, 114, 234, 250)), 0.42)
    P["pumpkins"] = finish(piece(g2, (16, 28, 120, 126)), 0.42, sat=0.9)
    P["easter"] = finish(piece(g2, (126, 20, 234, 126)), 0.29, sat=0.95)
    P["apples"] = finish(piece(g2, (16, 132, 120, 226)), 0.29, sat=0.92)
    P["willow"] = finish(piece(g2, (134, 120, 222, 242)), 0.29)
    P["flowers"] = finish(piece(g3, (10, 10, 108, 140)), 0.28, sat=0.95)
    P["herbs"] = finish(piece(g3, (126, 26, 242, 130)), 0.33)
    P["spruce"] = finish(piece(g3, (4, 148, 126, 214)), 0.36)
    P["chest"] = finish(piece(g3, (130, 144, 246, 236)), 0.42, sat=0.95, match=False)
    P["tankard"] = finish(piece(g4, (8, 6, 60, 64)), 0.3)
    P["tusk"] = finish(piece(g4, (78, 6, 114, 68)), 0.36)
    P["dice"] = finish(piece(g4, (8, 80, 60, 118)), 0.27, match=False)
    wafer = piece(g4, (70, 80, 118, 114))
    a = np.array(wafer)
    blue = (a[:, :, 2].astype(int) > a[:, :, 0].astype(int) + 25)          # the plate's blue rim: away
    a[blue] = (0, 0, 0, 0)
    wafer = Image.fromarray(a, "RGBA"); wafer = wafer.crop(bbox(wafer, 0))
    P["wafer"] = finish(wafer, 0.4, match=False)
    return P

# ------------------------------------------------------------------------------------------------ small things painted here
# (the wycinanki, the towel, the rag rug and the Christmas Eve table: decor_paint.py)
INK, INK_L = (62, 44, 34, 255), (122, 100, 80, 255)

def words(img, x0, x1, y, rnd, colour=INK, gap=1):
    """a line of handwriting: short dark strokes with gaps between the words"""
    px = img.load()
    x = x0
    while x < x1:
        n = int(rnd.randint(2, 6))
        for i in range(n):
            if x + i >= x1: break
            px[x + i, y] = colour if rnd.rand() > 0.15 else INK_L
        x += n + gap + int(rnd.rand() < 0.3)

def receipt_frame():
    """the Lord's receipt in the frame of the Holy Mother's picture (Winlu Decoration_static 6/8/2, the same wood, the same size):
    parchment inside, a heading, the lines, a signature and a red wax seal"""
    fr = char_frame("!Decoration_static", 6, 8, 2).copy()
    rnd = np.random.RandomState(11)
    p = parchment(26, 22, shade=(236, 224, 192), seed=3, grain=5)
    tw = 12; words(p, 13 - tw // 2, 13 + tw // 2, 3, rnd, INK, gap=1)           # the heading, centred
    words(p, 13 - tw // 2, 13 + tw // 2, 4, rnd, INK_L, gap=1)
    for y in (7, 9, 11, 13):
        words(p, 3, 23 if y < 13 else 15, y, rnd)
    for x in range(4, 11):                                                        # the Lord's signature, a squiggle
        p.putpixel((x, 17 + (x % 3 == 0) - (x % 4 == 1)), INK)
    c = Canvas4(7, 7)
    c.ellipse(0.4, 0.4, 6.4, 6.4, fill=(150, 26, 24, 255), outline=(84, 14, 14, 255), width=0.8)
    c.ellipse(2, 1.8, 3.8, 3.4, fill=(206, 76, 64, 255))
    seal = c.done(t=110)
    p.alpha_composite(seal, (17, 13))
    for (x, y) in ((18, 20), (19, 21), (21, 20), (22, 21)):                      # the seal's ribbon ends
        p.putpixel((x, y), (120, 24, 22, 255))
    fr.alpha_composite(p, (12, 28))
    return fr

def nail_img():
    im = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
    px = im.load()
    px[1, 1] = (122, 118, 124, 255); px[2, 1] = (74, 70, 78, 255)
    px[1, 2] = (74, 70, 78, 255); px[2, 2] = (52, 48, 54, 255)
    px[3, 2] = (0, 0, 0, 60); px[2, 3] = (0, 0, 0, 60); px[3, 3] = (0, 0, 0, 50)
    return im

def notice_img():
    """the contract notice from the tavern's board (the same parchment as the board's notes): heading, lines, a red pin"""
    rnd = np.random.RandomState(7)
    p = parchment(15, 19, shade=(230, 212, 172), seed=9, grain=6, torn=3)
    words(p, 3, 12, 4, rnd, INK, gap=1)
    for y in (7, 9, 11, 13):
        words(p, 2, 13 if y < 13 else 9, y, rnd)
    out = Image.new("RGBA", (15, 20), (0, 0, 0, 0))
    out.alpha_composite(p, (0, 1))
    px = out.load()
    px[7, 0] = (208, 70, 60, 255); px[6, 1] = (150, 32, 30, 255); px[7, 1] = (178, 44, 40, 255); px[8, 1] = (118, 24, 22, 255)
    return out

def dice_img():
    """two bone dice seen from the front and a little above (the top face light, the front darker), black pips"""
    def die(top_pips, front_pips):
        d = Image.new("RGBA", (7, 8), (0, 0, 0, 0)); px = d.load()
        O, T, S, F, K = (70, 54, 44, 255), (244, 236, 214, 255), (214, 204, 180, 255), (226, 216, 192, 255), (34, 28, 30, 255)
        for x in range(1, 6): px[x, 0] = O; px[x, 7] = O
        for y in range(1, 7): px[0, y] = O; px[6, y] = O
        for y in range(1, 3):
            for x in range(1, 6): px[x, y] = T
        for x in range(1, 6): px[x, 3] = S
        for y in range(4, 7):
            for x in range(1, 6): px[x, y] = F
        for (x, y) in top_pips: px[x, y] = K
        for (x, y) in front_pips: px[x, y] = K
        return d
    out = Image.new("RGBA", (14, 8), (0, 0, 0, 0))
    out.alpha_composite(die([(3, 1)], [(2, 4), (4, 6)]), (0, 0))
    out.alpha_composite(die([(2, 1), (4, 2)], [(2, 4), (3, 5), (4, 6)]), (7, 0))
    return out

def wafer_on_plate(wafer):
    """the Christmas wafer on one of Winlu's plates (D 0,11)"""
    plate = cell("D", 1, 11)
    plate = DP.folk_plate(plate.crop(bbox(plate, 100)))
    out = plate.copy()
    w = wafer
    if w.width > out.width - 6: w = premul_resize(w, (out.width - 6, max(1, round(w.height * (out.width - 6) / w.width))))
    sh = Image.new("RGBA", w.size, (40, 34, 40, 70)); sh.putalpha(w.getchannel("A").point(lambda v: 70 if v else 0))
    ox, oy = (out.width - w.width) // 2, (out.height - w.height) // 2
    out.alpha_composite(sh, (ox + 1, oy + 1)); out.alpha_composite(w, (ox, oy))
    return out

def hero_shelf():
    """Winlu's small wall shelf (D 6,2..3) with its plates taken off: the board's grain carried over from the clean columns"""
    sh = cell("D", 6, 2, 1, 2)
    a = np.array(sh)
    clean = [7, 8, 9, 23, 24, 25, 39, 40, 41, 42]
    out = a.copy()
    out[:38] = 0                                                   # (the plates' tops and their shadow on the wall)
    for y in range(38, 52):
        for x in range(10, 39):
            r, g, b, al = a[y, x]
            v = max(r, g, b); s = (int(v) - int(min(r, g, b))) / max(int(v), 1)
            if (s < 0.14 and v > 70) or x not in clean:
                out[y, x] = a[y, clean[(x * 7 + y * 3) % len(clean)]]
    return Image.fromarray(out, "RGBA")

# ------------------------------------------------------------------------------------------------ where everything goes
# LOOKS: key -> (sheet, event cell, picture, anchor, ax, ay, kind). The anchor says which point of the picture lands on the map
# pixel (ax, ay): "cb" centre / bottom, "cc" centre / middle, "ct" centre / top, "rb" right / bottom, "tl" top-left.
# kind: "wall" (hangs on a wall), "floor" (stands on the floor: a drop shadow), "table" (stands on a table: a drop shadow),
# "flat" (lies flat: a rug, a cloth). The plugin's slots (event ids, cells, priorities) are in HomeDecor.js.
PIC_BOX = (727, 71, 761, 102)             # the Holy Mother's picture (Map019 event 28 at 15,2) in map pixels
REC_BOX = (823, 71, 857, 102)             # the receipt: the same frame, mirrored about grandpa's window (16.5)

def build_looks():
    P = pixellab_pieces()
    L = {}
    def add(key, cellxy, im, anchor, ax, ay, kind="wall", sheet=SHEET, parts=None):
        L[key] = dict(sheet=sheet, cell=cellxy, im=im, anchor=anchor, ax=ax, ay=ay, kind=kind, parts=parts)
    # ---- the hero's alcove (wall x 1..3, rows 1..3; his bed at 1,4..5, the candle stool at 2,4, the pegs at 3,3)
    antl = P["antlers"]
    add("rogi", (1, 2), antl, "cc", 72, 86)
    tusk = P["tusk"]
    t_nail = Image.new("RGBA", (tusk.width + 2, tusk.height + 3), (0, 0, 0, 0))
    t_nail.alpha_composite(tusk, (1, 3)); t_nail.alpha_composite(nail_img(), (tusk.width // 2 - 1, 0))
    add("kiel", (1, 2), t_nail, "ct", 72, 68)
    ab = solid_box(antl)
    add("kiel_rog", (1, 2), tusk, "ct", 72 - antl.width // 2 + ab[0] + 3, 86 - antl.height // 2 + ab[1] + 16)
    add("list", (1, 3), notice_img(), "cc", 72, 147)
    shelf = hero_shelf()                                   # (48x96 piece; its board's front bottom row is 54, its top face 38..51)
    tank, dice = shadow(P["tankard"], 2, 1, 80), shadow(dice_img(), 1, 1, 80)
    def on_shelf(items):
        im = shelf.copy()
        total = sum(i.width for i in items) + 3 * (len(items) - 1)
        x = 24 - total // 2 + 1
        boxes = []
        for it in items:
            y = 47 - it.height + 1
            im.alpha_composite(it, (x, y)); boxes.append([x, y, x + it.width, y + it.height]); x += it.width + 3
        return im, boxes
    im, bx = on_shelf([tank]); add("polka_kufel", (3, 2), im, "tl", 168 - 24, 95 - 54, parts=[["kufel"] + bx[0]])
    im, bx = on_shelf([dice]); add("polka_kosci", (3, 2), im, "tl", 168 - 24, 95 - 54, parts=[["kosci"] + bx[0]])
    im, bx = on_shelf([tank, dice]); add("polka_oba", (3, 2), im, "tl", 168 - 24, 95 - 54, parts=[["kufel"] + bx[0], ["kosci"] + bx[1]])
    add("skora", (3, 6), shadow(P["pelt"], 1, 1, 60), "cc", 144, 281, "flat")
    # ---- grandpa's alcove (wall x 15..17: the Holy Mother at 15, the window at 16, the receipt at 17)
    rec = receipt_frame()
    add("gwozdz", (17, 2), nail_img(), "tl", (REC_BOX[0] + REC_BOX[2]) // 2 - 1, REC_BOX[1] + 1)
    add("pokwitowanie", (17, 2), rec, "tl", REC_BOX[0] - 7, REC_BOX[1] - 23)
    spr = P["spruce"]
    def with_spruce(base, box, ox, oy):
        """the base picture (placed with its top-left at ox, oy) + the spruce twigs just over the frame's top edge"""
        x0 = min(ox, (box[0] + box[2]) // 2 - spr.width // 2); y0 = min(oy, box[1] - 12)
        x1 = max(ox + base.width, (box[0] + box[2]) // 2 + (spr.width + 1) // 2); y1 = max(oy + base.height, box[1] - 12 + spr.height)
        im = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
        im.alpha_composite(base, (ox - x0, oy - y0))
        im.alpha_composite(spr, ((box[0] + box[2]) // 2 - spr.width // 2 - x0, box[1] - 12 - y0))
        return im, x0, y0
    im, x0, y0 = with_spruce(rec, REC_BOX, REC_BOX[0] - 7, REC_BOX[1] - 23); add("pokwitowanie_zima", (17, 2), im, "tl", x0, y0)
    tw = DP.towel()
    add("recznik", (15, 2), tw, "tl", PIC_BOX[0] - 7, PIC_BOX[1] - 5)
    im, x0, y0 = with_spruce(tw, PIC_BOX, PIC_BOX[0] - 7, PIC_BOX[1] - 5); add("recznik_zima", (15, 2), im, "tl", x0, y0)
    add("chodnik", (16, 6), DP.chodnik(), "cc", 792, 312, "flat")
    # ---- the wycinanki: centred under the four windows (x 2, 7, 11, 16), all at one height (3.07)
    gw, le = DP.gwiazda(), DP.leluja()
    add("wyc_2", (2, 3), le, "cc", 120, 147); add("wyc_16", (16, 3), le, "cc", 792, 147)
    add("wyc_7", (7, 3), gw, "cc", 360, 147); add("wyc_11", (11, 3), gw, "cc", 552, 147)
    # ---- the chimney breast between the herbs (8,2) and the garlic (10,2): drying herbs in summer, the harvest wreath in autumn
    add("ziola", (9, 2), P["herbs"], "ct", 456, 96)
    add("wieniec", (9, 2), P["wreath"], "ct", 456, 54)
    # ---- the table (top 2.04..5.92 x 9.54..10.45; the candle at 3.5 with its foot at 10.12): the jug on the right, the basket on
    #      the left, both feet on the candle's line
    add("bazie", (5, 10), shadow(P["willow"], 2, 1, 80), "cb", 252, 487, "table")
    add("kwiaty", (5, 10), shadow(P["flowers"], 2, 1, 80), "cb", 252, 487, "table")
    add("pisanki", (2, 10), shadow(P["easter"], 2, 1, 80), "cb", 131, 487, "table")
    add("jablka", (2, 10), shadow(P["apples"], 2, 1, 80), "cb", 131, 487, "table")
    cloth, cx, cy = DP.wigilia_table(wafer_on_plate(P["wafer"]))
    add("wigilia", (4, 10), cloth, "tl", cx, cy, "flat", sheet=BIG)
    # ---- by the door (9,12): pumpkins both sides of the landing; the Christmas Eve sheaf in the corner behind grandpa's chest
    pk = shadow(P["pumpkins"])
    add("dynie_l", (8, 11), shadow(mirror(P["pumpkins"])), "cb", 408, 571, "floor")
    add("dynie_r", (10, 11), pk, "cb", 504, 571, "floor")
    add("snop", (17, 7), shadow(P["sheaf"]), "cb", 840, 380, "floor")      # (in the corner behind the chest: its foot hidden by it)
    # ---- grandpa's chest (event 14 at 17,8) painted: its body where Winlu's chest was (17.08..18.0 x 7.69..8.48)
    add("skrzynia", (17, 8), shadow(P["chest"]), "rb", 863, 409, "floor")
    return L

def origin(look):
    """the map pixel of the look's frame's top-left corner"""
    ex, ey = look["cell"]
    fw, fh = (BW, BH) if look["sheet"] == BIG else (FW, FH)
    return (ex * 48 + 24 - fw // 2, (ey + 1) * 48 - fh)

def topleft(look):
    im, a, ax, ay = look["im"], look["anchor"], look["ax"], look["ay"]
    w, h = im.size
    if a == "tl": return ax, ay
    if a == "cb": return ax - w // 2, ay - h
    if a == "cc": return ax - w // 2, ay - h // 2
    if a == "ct": return ax - w // 2, ay
    if a == "rb": return ax - w, ay - h
    raise ValueError(a)

# ------------------------------------------------------------------------------------------------ the sheets
def slot(n):
    """slot n (reading order over the 12 x 8 frame grid) -> (characterIndex, direction, pattern)"""
    col, row = n % 12, n // 12
    return (row // 4) * 4 + col // 3, (row % 4 + 1) * 2, col % 3

def frame_of(look):
    """the look's picture cut into its frame (the event's cell at the frame's bottom middle); asserts that it fits"""
    fw, fh = (BW, BH) if look["sheet"] == BIG else (FW, FH)
    ox, oy = origin(look)
    x, y = topleft(look)
    fx, fy = x - ox, y - oy
    im = look["im"]
    assert fx >= 0 and fy >= 0 and fx + im.width <= fw and fy + im.height <= fh, (look["cell"], fx, fy, im.size)
    fr = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    fr.alpha_composite(im, (fx, fy))
    return fr, fx, fy

def build():
    L = build_looks()
    small = Image.new("RGBA", (FW * 12, FH * 8), (0, 0, 0, 0))
    big = Image.new("RGBA", (BW * 3, BH * 4), (0, 0, 0, 0))
    index, n = {}, 0
    for key, lk in L.items():
        fr, fx, fy = frame_of(lk)
        box = solid_box(fr)
        parts = [[p[0], p[1] + fx, p[2] + fy, p[3] + fx, p[4] + fy] for p in (lk["parts"] or [])]
        if lk["sheet"] == BIG:
            big.alpha_composite(fr, (0, 0)); i, d, p = 0, 2, 0
        else:
            i, d, p = slot(n)
            small.alpha_composite(fr, ((n % 12) * FW, (n // 12) * FH)); n += 1
        index[key] = {"sheet": lk["sheet"], "index": i, "direction": d, "pattern": p, "cell": list(lk["cell"]), "box": box,
                      "kind": lk["kind"], "parts": parts}
    small.save(os.path.join(CHARS, SHEET + ".png"))
    big.save(os.path.join(CHARS, BIG + ".png"))
    with open(INDEX, "wb") as f:
        f.write(json.dumps(index, ensure_ascii=False, indent=1).encode("utf-8"))
    write_plugin_data(index)
    return L, index

def write_plugin_data(index):
    """the plugin's <decor-data> line: key -> [sheet, index, direction, pattern, cellX, cellY, box, parts]"""
    if not os.path.exists(PLUGIN): return
    data = {k: [v["sheet"], v["index"], v["direction"], v["pattern"], v["cell"][0], v["cell"][1], v["box"], v["parts"]] for k, v in index.items()}
    line = "    const DECOR_ART = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";"
    raw = open(PLUGIN, "rb").read()
    crlf = b"\r\n" in raw
    s = raw.decode("utf-8")
    pat = re.compile(r"(// <decor-data>[^\n]*\n)(.*?)(\r?\n[ \t]*// </decor-data>)", re.S)
    if not pat.search(s):
        print("  (HomeDecor.js has no <decor-data> markers: the data line is not written)"); return
    s = pat.sub(lambda m: m.group(1) + line + m.group(3), s, count=1)
    open(PLUGIN, "wb").write(s.encode("utf-8"))

# ------------------------------------------------------------------------------------------------ the preview sheet
LABELS = [
    ("Pamiątki z historii (pojawiają się, gdy zasłużone, i zostają)", [
        ("pokwitowanie", "Pokwitowanie od Lorda", ("!Decoration_static", 6, 8, 2, "obrazek Winlu")),
        ("gwozdz", "Pusty gwóźdź (przed spłatą)", None),
        ("rogi", "Poroże pierwszego jelenia", ("!$Wall_decoration", 0, 2, 0, "poroże Winlu")),
        ("kiel", "Kieł pierwszego dzika", None),
        ("kiel_rog", "Kieł na porożu", None),
        ("skora", "Skóra pierwszego wilka", ("D", 9, 12, 2, 2, "skóra Winlu")),
        ("polka_oba", "Półka: kufel od Borgara i kości", ("D", 6, 2, 1, 2, "półka Winlu")),
        ("list", "Ogłoszenie z tablicy zleceń", None)]),
    ("Pory roku", [
        ("bazie", "Wiosna: bazie w dzbanku", ("D", 7, 4, 1, 2, "wazon Winlu")),
        ("pisanki", "Wielkanoc: koszyczek z pisankami", ("D", 0, 10, 1, 1, "misa Winlu")),
        ("kwiaty", "Lato: polne kwiaty", None),
        ("ziola", "Lato: zioła do suszenia", ("!Decoration_static", 3, 8, 0, "zioła Winlu")),
        ("wieniec", "Jesień: wieniec dożynkowy", None),
        ("jablka", "Jesień: kosz jabłek", None),
        ("dynie_r", "Jesień: dynie przy drzwiach", None),
        ("recznik_zima", "Zima: świerk nad obrazkami", None),
        ("snop", "Wigilia: snop w kącie", None),
        ("wigilia", "Wigilia: obrus, sianko, opłatek", None)]),
    ("Zawsze w chacie", [
        ("wyc_7", "Wycinanka: gwiazda", None),
        ("wyc_2", "Wycinanka: leluja", None),
        ("recznik", "Haftowany ręcznik na obrazku", ("!Decoration_static", 6, 8, 2, "obrazek Winlu")),
        ("skrzynia", "Malowana skrzynia dziadka", ("!Fantasy_chest", 6, 2, 0, "skrzynia Winlu")),
        ("chodnik", "Chodnik tkany ze szmat", None)]),
]

def winlu_ref(spec):
    if spec[0] in ("B", "C", "D"):
        im = cell(spec[0], spec[1], spec[2], spec[3], spec[4])
    else:
        im = char_frame(spec[0], spec[1], spec[2], spec[3])
    return im.crop(bbox(im, 0)), spec[-1]

def preview(L, render_path=None):
    """docs/dom_dziadka/ozdoby.png: every prop at 3x on the cottage's own wall or floor, the Winlu piece it comes from (or goes
    with) beside it, labelled in Polish"""
    font_p = os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf")
    F = lambda s: ImageFont.truetype(font_p, s)
    base = Image.open(render_path).convert("RGBA") if render_path and os.path.exists(render_path) else None
    def swatch(kind, w, h):
        if base is None: return Image.new("RGBA", (w, h), (196, 204, 204, 255) if kind == "wall" else (104, 82, 66, 255))
        src = (17 * 48 + 2, 50, 17 * 48 + 46, 160) if kind == "wall" else (13 * 48, 8 * 48, 16 * 48, 10 * 48)
        tile = base.crop(src)
        out = Image.new("RGBA", (w, h))
        for y in range(0, h, tile.height):
            for x in range(0, w, tile.width): out.paste(tile, (x, y))
        return out
    Z, pad = 3, 8
    cards = []
    for title, items in LABELS:
        row = []
        for key, label, ref in items:
            lk = L[key]
            im = lk["im"]
            if key.startswith("recznik"):                     # the towel is shown on the picture it hangs on
                pic = char_frame("!Decoration_static", 6, 8, 2)
                x0, y0 = topleft(lk)
                px, py = PIC_BOX[0] - 7, PIC_BOX[1] - 23                  # (the picture's frame on the map)
                ux, uy = min(x0, px), min(y0, py)
                can = Image.new("RGBA", (max(x0 + im.width, px + 48) - ux, max(y0 + im.height, py + 96) - uy), (0, 0, 0, 0))
                can.alpha_composite(pic, (px - ux, py - uy))
                can.alpha_composite(im, (x0 - ux, y0 - uy))
                im = can
            im = im.crop(bbox(im, 0))
            refim = winlu_ref(ref) if ref else None
            tw = int(F(21).getlength(label)) // Z + 10
            w = max(tw, im.width + (refim[0].width + pad if refim else 0) + pad * 2)
            h = max(im.height, refim[0].height if refim else 0) + pad * 2
            bg = swatch("wall" if lk["kind"] == "wall" else "floor", w, h)
            x = pad
            if refim:
                bg.alpha_composite(refim[0], (x, h - pad - refim[0].height)); x += refim[0].width + pad
            bg.alpha_composite(im, (x, h - pad - im.height))
            row.append((bg.resize((w * Z, h * Z), Image.NEAREST), label, refim[1] if refim else None))
        cards.append((title, row))
    W = 1680
    def flow(draw_to=None):
        y = 70
        for title, row in cards:
            if draw_to: draw_to[1].text((30, y), title, font=F(30), fill=(236, 238, 240))
            y += 46
            x, rowh = 30, 0
            for big, label, rl in row:
                if x + big.width > W - 30:
                    x = 30; y += rowh + 64; rowh = 0
                if draw_to:
                    out, d = draw_to
                    out.alpha_composite(big, (x, y))
                    d.rectangle([x - 1, y - 1, x + big.width, y + big.height], outline=(58, 62, 70))
                    d.text((x, y + big.height + 6), label, font=F(21), fill=(255, 210, 63))
                    if rl: d.text((x, y + big.height + 31), "po lewej: " + rl, font=F(17), fill=(138, 144, 153))
                x += big.width + 26; rowh = max(rowh, big.height)
            y += rowh + 74
        return y
    H = flow() + 10
    out = Image.new("RGBA", (W, H), (22, 20, 24, 255))
    d = ImageDraw.Draw(out)
    d.text((30, 20), "Dom dziadka - ozdoby (HomeDecor.js): każda rzecz w skali 3x, obok elementu Winlu, z którego się wywodzi albo do którego pasuje",
           font=F(25), fill=(255, 210, 63))
    flow((out, d))
    os.makedirs(DOCS, exist_ok=True)
    out.convert("RGB").save(os.path.join(DOCS, "ozdoby.png"))

def main():
    os.makedirs(OUT, exist_ok=True)
    L, index = build()
    render = sys.argv[1] if len(sys.argv) > 1 else None
    preview(L, render)
    print("%s.png: %d looks, %s.png: 1 look -> %s" % (SHEET, sum(1 for v in index.values() if v["sheet"] == SHEET), BIG,
                                                     os.path.relpath(INDEX, ROOT)))

if __name__ == "__main__":
    main()
