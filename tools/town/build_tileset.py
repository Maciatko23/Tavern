# python build_tileset.py  -> tools/town/staging/Tilesets.json (NOT data/: installed only when the user picks a concept,
# with the editor closed)
# Tileset 9 "Wilu Fantasy Exterior" gets the two sheets of the same Winlu pack it lacks, in its two EMPTY slots (so no existing
# map changes - no tileset-9 map uses a C or E tile today, checked 2026-09-29):
#   C = Fantasy_Outside_C  (barrels, crates, sacks, benches, tables, carts, hay, woodpiles, racks, signposts, the well...)
#   E = Fantasy_Roofs      (front gables, gable walls, awnings, spikes)
# and passage flags for them. The flags list (2816 entries today: it stops after A1) is extended to 8192 with 0 (= the same
# "passable" the game reads for a missing entry), then:
#   C: a tile with a drawn thing is closed (0x0F) - except the tops of tall things (star 0x10: drawn over the hero, who walks
#      behind them) and flat things on the ground (crop patches, stains: 0 = walkable)
#   E: every drawn tile is a star (roof pieces and awnings are drawn over the hero; the buildings under them are closed by
#      their own blockers, the hero walks under an awning)
# Deterministic: the same files give the same bytes.
import os, json, copy
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PACK = "Winlu Fantasy Tileset - Exterior/Winlu Fantasy Exterior/tilesets/"
C_NAME, E_NAME = PACK + "Fantasy_Outside_C", PACK + "Fantasy_Roofs"
OUT = os.path.join(HERE, "staging", "Tilesets.json")

# C tiles drawn over the hero (the upper part of a thing two or more tiles tall)
C_TOPS = {(8, 6), (9, 6), (8, 7), (9, 7),                  # the well's roof
          (3, 8), (4, 8), (3, 4), (5, 4), (7, 4), (6, 8), (7, 8), (4, 6),   # tops of the tall barrels / crates / jugs
          (0, 6), (1, 6), (0, 8), (1, 8), (2, 6), (2, 8),  # weapon racks' blades
          (0, 10), (1, 10), (2, 10),                       # dummy, targets
          (7, 14), (1, 14), (2, 14), (0, 13),               # lantern cage, signposts, notice board top
          (13, 10), (14, 10), (15, 10),                    # the big hay pile's top
          (10, 6), (11, 6), (12, 8), (13, 8), (8, 8),      # carts' tops
          (8, 4), (9, 4), (10, 4), (13, 5), (14, 5), (15, 5), (12, 4),   # woodpiles' / woodshed's tops
          (5, 0), (7, 0), (4, 2),                          # tall planters' leaves
          (3, 2), (1, 4), (2, 4), (1, 2), (2, 2),          # the anvil's, grindstones' and hide racks' tops
          (5, 12), (6, 12), (2, 11), (3, 11), (4, 11), (3, 13), (4, 13),   # the back row of stacked barrels
          (9, 13), (10, 13), (11, 13), (12, 13), (13, 13), (14, 13), (15, 13),   # washing line and clothes
          (9, 14), (10, 14), (11, 14), (12, 14), (13, 14), (14, 14), (15, 14),
          (0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (0, 1), (8, 0),        # tops of the stone pillars / gate
          (10, 0), (11, 0), (12, 0), (13, 0), (14, 0), (15, 0),          # bench backs
          (12, 2), (13, 2), (11, 2),                       # table tops
          (10, 10), (11, 10), (12, 10)}                    # grave crosses' tops
# C tiles that lie flat on the ground (walkable)
C_FLAT = {(5, 2), (6, 2), (7, 2), (5, 3), (6, 3), (7, 3),  # crop patches
          (1, 12), (2, 12), (1, 13), (2, 13), (3, 12), (3, 13)}   # stains

def content(img, c, r):
    tile = img.crop((c * 48, r * 48, c * 48 + 48, r * 48 + 48))
    return sum(tile.getchannel("A").histogram()[41:])

def build():
    with open(os.path.join(ROOT, "data", "Tilesets.json"), "rb") as f:
        sets = json.loads(f.read().decode("utf-8"))
    ts = copy.deepcopy(sets)
    t9 = ts[9]
    assert t9["tilesetNames"][6] == "" and t9["tilesetNames"][8] == "", "tileset 9's C / E slots are not empty any more"
    t9["tilesetNames"][6] = C_NAME
    t9["tilesetNames"][8] = E_NAME
    fl = list(t9["flags"]) + [0] * (8192 - len(t9["flags"]))
    cimg = Image.open(os.path.join(ROOT, "img", "tilesets", C_NAME + ".png")).convert("RGBA")
    eimg = Image.open(os.path.join(ROOT, "img", "tilesets", E_NAME + ".png")).convert("RGBA")
    for base, img, kind in ((256, cimg, "C"), (768, eimg, "E")):
        for tid in range(base, base + 256):
            t = tid - base
            col, row = t % 8 + (8 if t >= 128 else 0), (t % 128) // 8
            n = content(img, col, row)
            if n < 30: v = 0
            elif kind == "E": v = 0x10
            elif (col, row) in C_FLAT: v = 0
            elif (col, row) in C_TOPS: v = 0x10
            else: v = 0x0F
            fl[tid] = v
    t9["flags"] = fl
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # the editor's layout: one tileset a line
    lines = ["["] + [json.dumps(t, ensure_ascii=False, separators=(",", ":")) + ("," if i < len(ts) - 1 else "") for i, t in enumerate(ts)] + ["]"]
    with open(OUT, "wb") as f:
        f.write("\n".join(lines).encode("utf-8"))
    closed = sum(1 for t in range(256, 512) if fl[t] == 0x0F)
    star_c = sum(1 for t in range(256, 512) if fl[t] == 0x10)
    star_e = sum(1 for t in range(768, 1024) if fl[t] == 0x10)
    return OUT, closed, star_c, star_e

if __name__ == "__main__":
    out, closed, sc, se = build()
    print("wrote %s: tileset 9 + C (%d closed, %d star) + E (%d star), flags 8192" % (out, closed, sc, se))
