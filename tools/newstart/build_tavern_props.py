# The pictures the tavern's surroundings (Map008) need that tileset 9 lacks: tileset 9 has no C sheet, so the yard's things
# (benches, tables, barrels, crates, carts, hay, a woodshed, a signpost, a notice board, a hitching rail) are events whose
# picture is one frame of a character sheet cut from the same Winlu pack's Fantasy_Outside_C.png (the same art as the tiles).
#   python build_tavern_props.py      - writes img/characters/!Tavern_Yard.png and copies the pack's !Signs, !Decoration,
#                                      !Fantasy_chimney and !Roof_Windows into img/characters (only when they are missing)
# !Tavern_Yard: an 8-character sheet, every frame 144x144 (3x3 tiles). A thing stands on the bottom of its frame; one tile wide
# in the middle column, two tiles wide in the middle and right columns, three tiles wide across all three. So the event stands
# on the thing's bottom-left tile (bottom-middle when it is three wide) and <Occupy:...> covers the rest (PROPS below).
import os, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PACK = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior")
CHARS = os.path.join(ROOT, "img", "characters")
SHEET = "!Tavern_Yard"
T = 48
F = 3 * T          # frame size

# name: (the C-sheet cells as (col, row, w, h) pieces stacked top to bottom / or a builder), tiles wide, tiles high
def cells(c, r, w=1, h=1):
    return ("cells", c, r, w, h)

PROPS = [
    # name                 source                    w  h   what the event blocks (Occupy keys beyond its own tile)
    ("bench",            cells(10, 0, 2, 2),         2, 2, {"right": 1}),
    ("bench_b",          cells(12, 0, 2, 2),         2, 2, {"right": 1}),
    ("table",            cells(12, 2, 2, 2),         2, 2, {"right": 1, "up": 1}),
    ("bench_long_l",     cells(14, 0, 1, 3),         1, 3, {"up": 2}),
    ("bench_long_r",     cells(15, 0, 1, 3),         1, 3, {"up": 2}),
    ("table_long",       cells(11, 2, 1, 3),         1, 3, {"up": 2}),
    ("stool",            cells(14, 3),               1, 1, {}),
    ("stool_b",          cells(15, 3),               1, 1, {}),
    ("log_bench",        cells(9, 3, 2, 1),          2, 1, {"right": 1}),
    ("barrel",           cells(4, 8, 1, 2),          1, 2, {}),
    ("barrel_pile",      cells(2, 11, 3, 2),         3, 2, {"left": 1, "right": 1}),
    ("barrel_three",     cells(5, 12, 2, 2),         2, 2, {"right": 1}),
    ("barrel_crate",     cells(3, 13, 2, 2),         2, 2, {"right": 1}),
    ("barrel_apples",    cells(5, 15),               1, 1, {}),
    ("barrel_flour",     cells(4, 15),               1, 1, {}),
    ("crate",            cells(3, 4, 1, 2),          1, 2, {}),
    ("crate_b",          cells(5, 4, 1, 2),          1, 2, {}),
    ("crate_lid",        cells(7, 4, 1, 2),          1, 2, {}),
    ("crate_jug",        cells(6, 8, 1, 2),          1, 2, {}),
    ("crate_sack",       cells(7, 8, 1, 2),          1, 2, {}),
    ("jug_barrel",       cells(4, 6, 1, 2),          1, 2, {}),
    ("sacks",            cells(5, 11),               1, 1, {}),
    ("sacks_b",          cells(6, 11),               1, 1, {}),
    ("sack",             cells(7, 12),               1, 1, {}),
    ("woodshed",         cells(13, 5, 3, 2),         3, 2, {"left": 1, "right": 1, "up": 1}),
    ("firewood",         cells(8, 4, 3, 2),          3, 2, {"left": 1, "right": 1}),
    ("logs_small",       cells(13, 4),               1, 1, {}),
    ("chopping_block",   cells(12, 4, 1, 2),         1, 2, {}),
    ("cart",             cells(10, 6, 2, 2),         2, 2, {"right": 1}),
    ("hay",              cells(13, 10, 3, 2),        3, 2, {"left": 1, "right": 1}),
    ("signpost",         cells(1, 14, 1, 2),         1, 2, {}),
    ("signpost_b",       cells(2, 14, 1, 2),         1, 2, {}),
    ("notice_board",     ("board",),                 1, 2, {}),
    ("hitching_rail",    ("rail",),                  2, 2, {"right": 1}),
    ("planter_tree",     cells(5, 0, 1, 2),          1, 2, {}),
    ("planter_flowers",  cells(4, 2, 1, 2),          1, 2, {}),
    ("planter_small",    cells(6, 1),                1, 1, {}),
]
INDEX = {name: i for i, (name, *_rest) in enumerate(PROPS)}

def image_of(i):
    """characterIndex, direction, pattern of prop number i on the sheet"""
    k, j = divmod(i, 12)
    return k, (j // 3 + 1) * 2, j % 3

def occupy_note(name):
    o = PROPS[INDEX[name]][4]
    tag = ",".join("%s=%d" % (k, o[k]) for k in ("left", "right", "up", "down") if o.get(k))
    return "<Occupy:%s>" % tag if tag else ""

def _src():
    return Image.open(os.path.join(PACK, "tilesets", "Fantasy_Outside_C.png")).convert("RGBA")

def _piece(src, spec):
    if spec[0] == "cells":
        _, c, r, w, h = spec
        return src.crop((c * T, r * T, (c + w) * T, (r + h) * T))
    if spec[0] == "board":
        # the notice board with notes (C 0,13) on the legs of the plain board below it (C 0,15)
        out = Image.new("RGBA", (T, 2 * T))
        out.alpha_composite(src.crop((0, 15 * T, T, 16 * T)), (0, T))
        out.alpha_composite(src.crop((0, 13 * T, T, 14 * T)), (0, 0))
        return out
    if spec[0] == "rail":
        # a hitching rail two tiles long: the plain rack (C 2,8..9) with its middle stretched (posts only at the ends)
        rack = src.crop((2 * T, 8 * T, 3 * T, 10 * T))
        out = Image.new("RGBA", (2 * T, 2 * T))
        out.alpha_composite(rack.crop((0, 0, 24, 2 * T)), (0, 0))
        out.alpha_composite(rack.crop((12, 0, 36, 2 * T)), (24, 0))
        out.alpha_composite(rack.crop((12, 0, 36, 2 * T)), (48, 0))
        out.alpha_composite(rack.crop((24, 0, 48, 2 * T)), (72, 0))
        return out
    raise ValueError(spec)

def build():
    src = _src()
    sheet = Image.new("RGBA", (12 * F, 8 * F))
    for i, (name, spec, w, h, _o) in enumerate(PROPS):
        pic = _piece(src, spec)
        assert pic.size == (w * T, h * T), (name, pic.size)
        k, d, p = image_of(i)
        fx = ((k % 4) * 3 + p) * F
        fy = ((k // 4) * 4 + (d // 2 - 1)) * F
        ox = 0 if w == 3 else T
        sheet.alpha_composite(pic, (fx + ox, fy + F - h * T))
    path = os.path.join(CHARS, SHEET + ".png")
    sheet.save(path)
    print("wrote", path, sheet.size, "%d things" % len(PROPS))
    for name in ["!Signs.png", "!Decoration.png", "!Fantasy_chimney.png", "!Roof_Windows.png"]:
        dest = os.path.join(CHARS, name)
        if os.path.exists(dest):
            print("kept", dest)
        else:
            shutil.copyfile(os.path.join(PACK, "characters", name), dest)
            print("copied", dest)

if __name__ == "__main__":
    build()
