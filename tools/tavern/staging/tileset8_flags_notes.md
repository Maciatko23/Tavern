# Tileset 8 passage flags (staged) — notes for the map generators

File: `tileset8_flags.json` = the full 8192-entry `flags` list for tileset 8 "Wilu Fantasy Interior".
Made by `tools/tavern/tileset8_flags.py` (rules per sheet region); picture of every class over the Winlu sheets:
`tools/tavern/staging/renders/tileset8_flags.png` (`python tools/tavern/flags_sheet.py`). Installed by
`tools/apply_tavern_interior.py` (not yet in data/).

Classes: `X` = 0x60F impassable, `*` = 0x610 star (drawn above characters, no effect on passage), `.` = 0x600
passable, counter = 0x68F (impassable + counter bit: the action button reaches the cell behind it).

## What your requests got
- All A3 wall kinds (48-79): **X**. A4 wall rows (kinds 88-95, 104-111, 120-127): X; A4 floor rows: passable.
- A2: borders 16-19, 24-27, 32-35, 39-47 **X**; rugs/overlays 20-23, 28-31, 36-38 **passable** (31 = cracks overlay).
- Chair backs C(8..13,0) and armchair backs C(8..13,2): **\***.
- Small D items (food, mugs, bottles, books, scrolls, coins, cutting boards, small vases, papers, toys): **\***
  - they rely on the table / counter / shelf under them to block.
- C/E furniture and big D items: **X on the footprint row** (the row the piece stands on).

## Where it differs from the requests (adapt your blockers to this)
- **Tall pieces have starred upper rows**, like Winlu's own setup: only the bottom row of a bookshelf, cupboard,
  wardrobe, folding screen, barrel, barrel pile, sack pile, potted plant, big jar, shelf rack, weapon rack, column or
  post blocks; the rows above are `*` (a character walking behind is hidden by them). Against a wall this changes
  nothing (the wall blocks those cells). A tall piece standing free in a room leaves its upper cells walkable -
  if you do not want anyone behind it, add a blocker there.
- **Bed headboard rows** (C row 10 and row 13, cols 8..15) are `*`; the bed body rows block.
- **Tables block both rows** (C long tables, square tables, E round tables with food 0..7 x 9..12 and E(0,13..14)).
  The old concepts blocked only the round tables' leg row; now the table-top row blocks too.
- **Shops counters** E(0..2,0..5), E(3,0..3), E(4,0..1), E(5,0..3), E(1..2,6) have the **counter** bit: talk across
  the 1-wide vertical arms; a 2-row horizontal counter is too deep for the counter reach.
- Wall pieces (windows, curtains, shields, mirrors, wall shelves, pots-and-pans rail, chains, broken-wall patches,
  the mouse hole D(14,10)) are **X**, never `*`: a star on a wall's bottom face row would be drawn over the heads of
  characters standing in front of the wall.
- Floor decals stay passable: bear-skin rugs D(9..12,10..15), blood, pebbles, small rubble D(11..12,5..6), shadows.
- B: the wooden side stairs B(8..11,4..7) and all rugs passable; posts/pillar/column tops `*`.
- A5: floors, stairs (rows 2..4), mosaics passable; void (0,0), the stone band (0..3,1), the stair side walls
  (cols 4 and 7 of rows 0..3), the holed floor (4..7,6), hearths, pilasters and bookshelves (rows 11..15, (6..7,8..10)) X.

## Effect on the other tileset-8 maps
See `tileset8_bfs.md` (BFS reachability of Map002, Map016, Map019, Map100 before/after with their events).
