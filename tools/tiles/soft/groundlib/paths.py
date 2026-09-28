"""Where things are (all relative to the project root, found from this file)."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SOFT = os.path.dirname(HERE)                                   # tools/tiles/soft
ROOT = os.path.abspath(os.path.join(SOFT, "..", "..", ".."))   # the game project
DATA = os.path.join(ROOT, "data")
RMMZ_CORE = os.path.join(ROOT, "js", "rmmz_core.js")
TILESETS = os.path.join(ROOT, "img", "tilesets")
WINLU_EXT = os.path.join(TILESETS, "Winlu Fantasy Tileset - Exterior")
WINLU_GREEN = os.path.join(WINLU_EXT, "Fantasy_Tileset_Green_Edition_upgrade", "tilesets")
WINLU_A2 = os.path.join(WINLU_GREEN, "Fantasy_Outside_A2_2_green.png")     # the A2 of tileset 9
RECIPES = os.path.join(SOFT, "recipes")
SRC = os.path.join(SOFT, "src")
WORK = os.path.join(SOFT, "work")

# other Winlu sheets usable as sources ("sheet": "<name>" in a recipe step)
SHEETS = {
    "green": WINLU_A2,
    "green_a2_1": os.path.join(WINLU_GREEN, "Fantasy_Outside_A2_green.png"),
    "red": os.path.join(WINLU_EXT, "Fantasy_Tileset_red_Edition_upgrade", "tilesets", "Fantasy_Outside_A2_2_red.png"),
    "base": os.path.join(WINLU_EXT, "Winlu Fantasy Exterior", "tilesets", "Fantasy_Outside_A2_2.png"),
    "winter": os.path.join(TILESETS, "Winlu Fantasy Tileset - Exterior Winter", "tilesets", "Fantasy_Outside_A2_snow.png"),
    "dungeon": os.path.join(TILESETS, "Winlu Fantasy Tileset - Dungeon", "tilesets", "Fantasy_Dungeon_A2.png"),
    "interior": os.path.join(TILESETS, "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets", "Fantasy_Inside_A2.png"),
}


def sheet_path(name_or_path):
    if name_or_path in (None, ""):
        return WINLU_A2
    if name_or_path in SHEETS:
        return SHEETS[name_or_path]
    p = name_or_path if os.path.isabs(name_or_path) else os.path.join(ROOT, name_or_path)
    return p


def src_path(name):
    return name if os.path.isabs(name) else os.path.join(SRC, name)
