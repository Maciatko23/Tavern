# The passage flags of tileset 10 "Wilu Fantasy Dungeon": the author's own list (his sample project, tileset 3 "Fantasy
# Dungeon" - the same nine sheets) with the props we use made right (uglib.PIECES): the foot of a thing stops the hero, its upper
# part is drawn over him (star) - many of the author's object tiles are plain walkable (bars, sarcophagi, crates).
# flags12(): band 2's tileset (uglib.TILESET2): tileset 10's flags, but its B sheet is the Interior set's C sheet - those come from
# the author's "Fantasy Interior" (his tileset 2, the sheet in its C slot) with our furniture made right (uglib.PIECES_IN).
#   python tools/underground/flags10.py   -> prints what changes against the author's lists
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from uglib import AUTHOR_FLAGS, AUTHOR_INTERIOR_FLAGS, PIECES, PIECES_IN, B, C, D, E, A5   # noqa: E402

PASS, BLOCK, STAR = 0x600, 0x60F, 0x610
SHEET = {"B": B, "C": C, "D": D, "E": E, "A5": A5}


def apply(fl, pieces, sheets=None):
    changed = []
    for name, spec in pieces.items():
        sheet, col, row, w, h, block, star = spec[:7]
        if sheets and sheet not in sheets: continue
        skip = spec[7] if len(spec) > 7 else ()
        for dy in range(h):
            for dx in range(w):
                if (dx, dy) in skip: continue
                tid = SHEET[sheet](col + dx, row + dy)
                want = BLOCK if dy in block else STAR if dy in star else None
                if want is None or fl[tid] == want: continue
                changed.append((name, sheet, col + dx, row + dy, fl[tid], want))
                fl[tid] = want
    return changed


def flags10():
    fl = list(AUTHOR_FLAGS)
    changed = apply(fl, PIECES)
    return fl, changed


def flags12():
    fl = flags10()[0]
    # the B sheet (ids 0-255) = the Interior set's C sheet (ids 256-511 in the author's interior tileset); id 0 stays as it is
    for i in range(1, 256):
        fl[i] = AUTHOR_INTERIOR_FLAGS[256 + i]
    changed = apply(fl, PIECES_IN)
    return fl, changed


if __name__ == "__main__":
    fl, ch = flags10()
    for c in ch: print("%-18s %s(%d,%d) %#x -> %#x" % c)
    print(len(ch), "tiles changed (tileset 10)")
    fl, ch = flags12()
    for c in ch: print("%-18s %s(%d,%d) %#x -> %#x" % c)
    print(len(ch), "tiles changed (band 2's B sheet)")
