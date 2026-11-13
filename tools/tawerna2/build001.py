# -*- coding: utf-8 -*-
"""Map001 'Tawerna' - second method (Tawerna 2): the CURRENT ground floor cut as it is. The block x36..98, y23..54 of the old map (entrance,
great hall with the bar and fireplaces, stage, both stairs, board, dice room, dart room, smoking room) stays whole; above it the old service row
(kitchen, bakery, pantry in place of the smokehouse, servants' room) and the corridor, and in the top right the storeroom with Borgar's study
over it. New x = old x - 36, new y = old y. 63 x 55. Rooms of the top row are grown with plain floor to equal heights."""
import sys, os, json, copy, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, lib2
from lib2 import Piece

OLD = 1
DX = -36
W_, H_ = 63, 55
c = lib.Canvas(1, W_, H_, 1)

def blk(x0, y0, x1, y1, tx, ty, ev=None):
    """whole block of the old map -> canvas (tx, ty), events kept"""
    return Piece(OLD, (x0, y0, x1, y1), ev_rect=ev, name="blk").place(c, tx, ty, retarget=False)

# ---- the whole lower block, as it is
blk(36, 23, 98, 54, 0, 23)
# ---- the old corridor strip y17..22 (x36..84), its doors' pictures are in it; the open west end is closed
blk(36, 17, 84, 22, 0, 17)
for y in (20, 21, 22): c.put(0, 0, y, 2048 + 25 * 48); c.put(1, 0, y, 0)
# ---- the storeroom (right end of the corridor) and Borgar's study above it
blk(84, 11, 98, 22, 48, 11)
g = Piece(OLD, (86, 1, 96, 11), name="gabinet")
g.grow_cols(2, near=2).grow_cols(2, near=g.w + 1)
g.grow_rows(1, near=4)
g.place(c, 48, 0 + 11 - (g.h - 1), retarget=False)                 # bottom row = the storeroom's top frame (y11)
# ---- the service row above the corridor: kitchen, bakery, pantry (old 'spizarnia' replaces the smokehouse), servants' room
for name, rect, ox in (("kuchnia", (36, 4, 54, 17), 0), ("piekarnia", (54, 4, 64, 17), 18), ("spizarnia", (28, 4, 36, 17), 28), ("sluzba", (72, 4, 84, 17), 36)):
    p = Piece(OLD, rect, name=name)
    p.grow_rows(4, near=p.h - 5)
    p.place(c, ox, 0, retarget=False)
    assert ox + p.w - 1 <= W_ - 1
# ---- people and things that moved with the blocks: the loose brick into the pantry, 'Stare drzwi' on the pantry's door
# the pantry door was the smokehouse's (event 160 'Drzwi' at old x68 -> canvas x32): the old-door picture 209 takes its place
c.events.pop(160, None)
e209 = copy.deepcopy(lib.old(OLD)["events"][209]); e209["pages"][0]["image"]["direction"] = 8
c.add_event(e209, 32, 19)
ev9 = copy.deepcopy(lib.old(OLD)["events"][9])

for yy in (13, 14, 15, 16):                                      # the sack in front of the pantry's door
    for zz in (2, 3): c.put(zz, 32, yy, 0)

def finish():
    lib2.reshape_all(c)
    v = lib2.void_cells(c)
    assert not v, "void cells: %s" % v[:10]

if __name__ == "__main__":
    finish()
    print("saved", c.save(), len(c.events), "events")
    lib.render(c, os.path.join(lib.HERE, "..", "..", "docs", "tawerna2", "_001_wip.png"), scale=0.5)
