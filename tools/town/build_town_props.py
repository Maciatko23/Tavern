# python build_town_props.py  -> tools/town/staging/characters/!Town_Props.png (NOT img/: concepts only)
# The town's things that tileset 9 lacks, as one character sheet (like tools/newstart/build_tavern_props.py's !Tavern_Yard):
# pieces of the same Winlu pack (Fantasy_Outside_C, !$Big_Misc, !$Big_Decoration re-centred) and the game's own camp art
# (img/system/Farm_Tent_L, Farm_Tent, Farm_Bedroll). Every frame is 144x288 (3 tiles wide, 6 high); a thing stands on the
# bottom of its frame - three tiles wide across the frame, one or two tiles wide from the middle column. So the event stands on
# the thing's bottom-left tile (bottom-middle when it is three wide) and <Occupy:...> covers the rest (PROPS below).
# Deterministic: the same files give the same bytes.
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PACK = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior")
OUT_DIR = os.path.join(HERE, "staging", "characters")
SHEET = "!Town_Props"
T = 48
FW, FH = 3 * T, 6 * T

def cells(c, r, w=1, h=1):
    return ("cells", c, r, w, h)

# name: source, tiles wide, tiles high, blocked cells beyond its own tile ({} = its own tile; None = walkable, below the hero)
PROPS = [
    ("well_dry",        ("well_dry",),            2, 4, {"right": 1, "up": 1}),
    ("anvil",           cells(3, 2, 1, 2),        1, 2, {}),
    ("grindstone",      cells(1, 4, 1, 2),        1, 2, {}),
    ("weapon_rack",     cells(0, 6, 2, 2),        2, 2, {"right": 1}),
    ("weapon_rack_b",   cells(0, 8, 2, 2),        2, 2, {"right": 1}),
    ("dummy",           cells(0, 10, 1, 2),       1, 2, {}),
    ("target",          cells(1, 10, 1, 2),       1, 2, {}),
    ("barrel_water",    cells(3, 8, 1, 2),        1, 2, {}),
    ("barrel_water_b",  cells(4, 8, 1, 2),        1, 2, {}),
    ("barrel_ladle",    cells(3, 10, 1, 1),       1, 1, {}),
    ("grave_cross_fl",  cells(10, 10, 1, 2),      1, 2, {}),
    ("grave_cross",     cells(11, 10, 1, 2),      1, 2, {}),
    ("grave_stone",     cells(12, 10, 1, 2),      1, 2, {}),
    ("lantern_shrine",  cells(7, 14, 1, 2),       1, 2, {}),
    ("laundry",         ("laundry",),             3, 3, {"left": 1, "right": 1}),
    ("pots",            cells(5, 6, 1, 1),        1, 1, {}),
    ("jugs",            cells(6, 10, 1, 1),       1, 1, {}),
    ("basket_red",      cells(6, 15, 1, 1),       1, 1, {}),
    ("basket_tools",    cells(7, 15, 1, 1),       1, 1, {}),
    ("crop_a",          cells(5, 2),              1, 1, None),
    ("crop_b",          cells(6, 2),              1, 1, None),
    ("crop_c",          cells(7, 2),              1, 1, None),
    ("crop_d",          cells(6, 3),              1, 1, None),
    ("hide_rack",       cells(1, 2, 1, 2),        1, 2, {}),
    ("hide_rack_b",     cells(2, 2, 1, 2),        1, 2, {}),
    ("ladder",          cells(0, 3, 1, 3),        1, 3, {}),
    ("tent_hide",       ("system", "Farm_Tent_L"), 3, 2, {"left": 1, "right": 1, "up": 1}),
    ("tent_small",      ("system", "Farm_Tent"),  2, 2, {"right": 1}),
    ("bedroll",         ("system", "Farm_Bedroll"), 2, 2, None),
    ("stall_orange",    ("stall", 0, "veg"),      3, 4, {"left": 1, "right": 1}),
    ("stall_purple",    ("stall", 1, "pots"),     3, 4, {"left": 1, "right": 1}),
    ("stall_plain",     ("stall", 2, "cloth"),    3, 4, {"left": 1, "right": 1}),
    ("stall_water",     ("stall", 2, "water"),    3, 4, {"left": 1, "right": 1}),
    ("bell_tower",      ("deco", 1, 0),           3, 5, {"left": 1, "right": 1, "up": 4}),
    ("chapel_front",    ("deco", 2, 0),           3, 6, {"left": 1, "right": 1, "up": 5}),
    ("spire_slate",     ("deco", 0, 0),           3, 5, None),
    ("tower_ruin_top",  ("deco", 1, 2),           3, 4, None),
    ("statue_knight",   ("statue", 0, 1),         1, 3, {}),
    ("board_town",      ("board",),               2, 2, {"right": 1}),
    # dormers of !Roof_Windows with a flower box under the window (one picture, so the box is drawn over the dormer's foot)
    ("dormer_wood",     ("dormer", 0, 1, 0),      3, 4, None),
    ("dormer_grey",     ("dormer", 1, 1, 1),      3, 4, None),
    ("dormer_dark",     ("dormer", 1, 5, 0),      3, 4, None),
    ("dormer_blue",     ("dormer", 2, 1, 0),      3, 4, None),
    ("dormer_orange",   ("dormer", 3, 1, 1),      3, 4, None),
    ("dormer_red",      ("dormer", 3, 5, 1),      3, 4, None),
    ("dormer_wood_dark", ("dormer", 0, 0, 2),     3, 4, None),
]
INDEX = {name: i for i, (name, *_r) in enumerate(PROPS)}

def image_of(i):
    """characterIndex, direction, pattern of prop number i on the sheet"""
    k, j = divmod(i, 12)
    return k, (j // 3 + 1) * 2, j % 3

def occupy_note(name):
    o = PROPS[INDEX[name]][4]
    if not o: return ""
    tag = ",".join("%s=%d" % (k, o[k]) for k in ("left", "right", "up", "down") if o.get(k))
    return "<Occupy:%s>" % tag if tag else ""

def footprint(name, x, y):
    """the cells the thing blocks (its own tile + <Occupy>), [] when walkable"""
    o = PROPS[INDEX[name]][4]
    if o is None: return []
    return [(x + dx, y + dy) for dy in range(-o.get("up", 0), o.get("down", 0) + 1) for dx in range(-o.get("left", 0), o.get("right", 0) + 1)]

def walkable(name):
    return PROPS[INDEX[name]][4] is None

# ------------------------------------------------------------------ the pieces
_img = {}
def img(path):
    if path not in _img: _img[path] = Image.open(path).convert("RGBA")
    return _img[path]
def csheet(): return img(os.path.join(PACK, "tilesets", "Fantasy_Outside_C.png"))
def cc(c, r, w=1, h=1): return csheet().crop((c * T, r * T, (c + w) * T, (r + h) * T))

def dry(pic):
    """the well without water: bluish water pixels become a dark earthen pit"""
    px = pic.load()
    for y in range(pic.height):
        for x in range(pic.width):
            r, g, b, a = px[x, y]
            if a > 0 and b > r + 30 and b >= g:
                lum = 0.35 * r + 0.45 * g + 0.2 * b
                px[x, y] = (int(lum * 0.72 + 8), int(lum * 0.6 + 6), int(lum * 0.5 + 5), a)
    return pic

def stall(pattern, goods):
    """a market stall 3 tiles wide: the pack's awning (!$Big_Misc, cut to 144 px) over a plank counter with goods"""
    big = img(os.path.join(PACK, "characters", "!$Big_Misc.png"))
    aw = big.crop((pattern * 192 + 24, 0, pattern * 192 + 168, 192))     # 144 x 192, legs at the sides
    out = Image.new("RGBA", (3 * T, 4 * T))
    out.alpha_composite(aw, (0, 0))
    # the counter: the long bench C(10..11, 0..1) stretched to 3 tiles (its middle repeated)
    bench = cc(10, 0, 2, 2).crop((0, 28, 96, 76))                        # 96 x 48
    counter = Image.new("RGBA", (3 * T, 48))
    counter.alpha_composite(bench.crop((0, 0, 60, 48)), (0, 0))
    counter.alpha_composite(bench.crop((24, 0, 72, 48)), (48, 0))
    counter.alpha_composite(bench.crop((36, 0, 96, 48)), (84, 0))
    out.alpha_composite(counter, (0, 4 * T - 48))
    goods_src = {"veg": [cc(5, 2), cc(6, 2), cc(7, 2)], "pots": [cc(5, 6), cc(6, 10), cc(5, 6)],
                 "cloth": [cc(12, 13).crop((0, 0, 48, 40)), cc(13, 13).crop((0, 0, 48, 40)), cc(14, 13).crop((0, 0, 48, 40))],
                 "water": [cc(3, 10), cc(4, 10), cc(3, 10)]}[goods]
    for i, g in enumerate(goods_src):
        s = g.resize((34, int(34 * g.height / g.width)), Image.LANCZOS) if goods != "water" else g.resize((40, 40), Image.LANCZOS)
        out.alpha_composite(s, (7 + i * 46, 4 * T - 26 - s.height + 8))
    return out

def laundry():
    """a washing line three tiles long: the left post with clothes C(9..10, 13..15) and the right post C(15, 13..15)"""
    out = Image.new("RGBA", (3 * T, 3 * T))
    out.alpha_composite(cc(9, 13, 2, 3), (0, 0))
    out.alpha_composite(cc(15, 13, 1, 3), (2 * T, 0))
    return out

def deco(row, pat):
    """one picture of !$Big_Decoration (its pictures sit in the left 144 px of 192 px frames): re-centred"""
    big = img(os.path.join(PACK, "characters", "!$Big_Decoration.png"))
    return big.crop((pat * 192, row * 288, pat * 192 + 144, row * 288 + 288))

def statue(k, p):
    s = img(os.path.join(PACK, "characters", "!Statue.png"))     # 48 x 144 frames
    return s.crop((p * 48 + (k % 4) * 144, (k // 4) * 576, p * 48 + (k % 4) * 144 + 48, (k // 4) * 576 + 144))

def board():
    """the town's notice board: two boards with notes side by side (C 0,13 on C 0,15 legs, twice)"""
    one = Image.new("RGBA", (T, 2 * T))
    one.alpha_composite(cc(0, 15), (0, T))
    one.alpha_composite(cc(0, 13), (0, 0))
    out = Image.new("RGBA", (2 * T, 2 * T))
    out.alpha_composite(one, (0, 0)); out.alpha_composite(one, (T, 0))
    return out

def dormer(row, f, box):
    """a dormer (!Roof_Windows: 96 x 144 frames, row = the sheet's row, f = the frame in it) re-centred in a 144-wide
    frame, a flower box (B 7,0 red / B 0,1 blue / none) under its window"""
    rw = img(os.path.join(ROOT, "img", "characters", "!Roof_Windows.png"))
    fr = rw.crop((f * 96, row * 144, f * 96 + 96, row * 144 + 144))
    x0, y0, x1, y1 = fr.getbbox()
    out = Image.new("RGBA", (3 * T, 144 + 48))
    ox = 72 - (x0 + x1) // 2
    out.alpha_composite(fr, (ox, 0))
    if box in (0, 1):
        bsheet = img(os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_B_green.png"))
        b = bsheet.crop((7 * T, 0, 8 * T, T)) if box == 0 else bsheet.crop((0, T, T, 2 * T))
        out.alpha_composite(b, (48, y1 - 30))
    return out

def piece(spec):
    k = spec[0]
    if k == "cells": return cc(*spec[1:])
    if k == "well_dry": return dry(cc(8, 6, 2, 4))
    if k == "system": return img(os.path.join(ROOT, "img", "system", spec[1] + ".png"))
    if k == "stall": return stall(spec[1], spec[2])
    if k == "laundry": return laundry()
    if k == "deco": return deco(spec[1], spec[2])
    if k == "statue": return statue(spec[1], spec[2])
    if k == "board": return board()
    if k == "dormer": return dormer(spec[1], spec[2], spec[3])
    raise ValueError(spec)

def build():
    sheet = Image.new("RGBA", (12 * FW, 8 * FH))
    for i, (name, spec, w, h, _o) in enumerate(PROPS):
        pic = piece(spec)
        k, d, p = image_of(i)
        fx = ((k % 4) * 3 + p) * FW
        fy = ((k // 4) * 4 + (d // 2 - 1)) * FH
        if spec[0] in ("system",):
            # the game's own pictures: bottom-centred on the thing's cells
            ox = (w * T - pic.width) // 2 + (0 if w == 3 else T)
            oy = FH - pic.height - max(0, (h * T - pic.height) // 4)
            sheet.alpha_composite(pic, (fx + ox, fy + oy))
            continue
        ox = 0 if w == 3 else T
        if pic.width > w * T: pic = pic.crop(((pic.width - w * T) // 2, 0, (pic.width - w * T) // 2 + w * T, pic.height))
        sheet.alpha_composite(pic, (fx + ox, fy + FH - pic.height))
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, SHEET + ".png")
    sheet.save(path)
    return path

if __name__ == "__main__":
    print("wrote", build(), "%d things" % len(PROPS))
