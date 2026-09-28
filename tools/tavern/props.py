# Furniture and room macros for the tavern concepts (Winlu Fantasy Interior Remaster, tileset 8).
# Every macro puts the tiles (layer 2 = furniture, layer 3 = what stands on it), a blocker over the cells that stop the
# player, and - for the things that give light - a RoomLighting light event. Coordinates are map cells; (x, y) is the
# top-left cell of the piece unless said otherwise. Sheet cells are (col, row) on the 48 px grid of the sheet.
from tavlib import *

# ---------------------------------------------------------------- the pieces (sheet, col, row) the macros use
# counters (Shops = E)
CNT_L, CNT_M, CNT_R = ("E", 0), ("E", 1), ("E", 2)          # horizontal counter: top row 0, front row 1
ARM_L, ARM_R = 3, 5                                          # vertical counter arm: (3,0) top, (3,1) middle, (3,2) end, (3,3) front
# lights: note tags for RoomLighting (radius, glow colour - dim colours keep overlaps from washing out)
L_CANDLE = "<Light:110,120,80,30>"
L_CANDLES = "<Light:150,130,90,34>"
L_SCONCE = "<Light:170,90,60,22>"
L_LANTERN = "<Light:210,90,62,24>"
L_CHANDELIER = "<Light:330,40,28,10>"
L_FIRE = "<Light:330,120,60,16>"
L_STOVE = "<Light:230,120,64,20>"
L_OVEN = "<Light:130,120,50,14>"
L_FILL = "<Light:300,14,10,4>"          # no lamp: only lifts the dark between the lamps a little

def light(mp, x, y, tag, name="swiatlo"):
    return mp.light(x, y, tag, name)

def is_floor_cell(mp, x, y):
    t = mp.layers[0].get((x, y))
    if not t: return False
    if t[0] == "k": return (80 <= t[1] < 128 and ((t[1] - 80) // 8) % 2 == 0) or (16 <= t[1] < 48 and t[1] not in mp.border_kinds)
    return t[1] in (A5(1, 2),)

def wall_shadows(mp):
    """the shadow the editor draws by itself: the left half of every floor cell whose left neighbour is a wall (light
    from the upper left), so the rooms get depth along their west walls and the partitions"""
    for (x, y) in list(mp.all):
        if is_floor_cell(mp, x, y) and mp.inside(x - 1, y) and not is_floor_cell(mp, x - 1, y):
            mp.shadow[(x, y)] = 5

def lights_of(mp):
    """(x, y, radius in cells) of every RoomLighting light on the map"""
    import re
    out = []
    for (x, y, e) in mp.events:
        m = re.match(r"<Light:(\d+)", e.get("note", "") or "")
        if m: out.append((x, y, int(m.group(1)) / 48.0))
    return out

def auto_fill(mp, skip=(), reach=0.72, radius=300):
    """dim fill lights wherever the floor is further than `reach` of a light's radius from every light, so the rooms have
    no dark holes between the lamps (the storeroom and other `skip` rectangles stay dim on purpose)"""
    skipped = set()
    for (x0, y0, x1, y1) in skip: skipped |= mp.rect(x0, y0, x1, y1)
    floor = {c for c in mp.all - skipped if mp.layers[0].get(c, ("", 0))[0] == "k" and 80 <= mp.layers[0][c][1] < 128}
    r_cells = radius / 48.0
    def uncovered():
        ls = lights_of(mp)
        return {(x, y) for (x, y) in floor if all(((x - lx) ** 2 + (y - ly) ** 2) ** 0.5 > reach * lr for (lx, ly, lr) in ls)}
    todo = uncovered()
    added = 0
    while todo and added < 40:
        best, gain = None, -1
        for (cx, cy) in todo:
            g = sum(1 for (x, y) in todo if ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 <= reach * r_cells)
            if g > gain: best, gain = (cx, cy), g
        light(mp, best[0], best[1], "<Light:%d,14,10,4>" % radius, "wypelnienie")
        added += 1
        todo = uncovered()
    return added

# ---------------------------------------------------------------- room shells
def shell(mp, rooms, border):
    """rooms: (x0, y0, x1, y1, floor_kind, wall_kind, face_rows). Border everywhere, then each room's wall face above its
    top row (face_rows tall, only where no floor of another room lies) and its floor."""
    mp.kind(0, mp.all, border)
    floors = set()
    for (x0, y0, x1, y1, fk, wk, fr) in rooms:
        floors |= mp.rect(x0, y0, x1, y1)
    for (x0, y0, x1, y1, fk, wk, fr) in rooms:
        face = mp.rect(x0, y0 - fr, x1, y0 - 1) - floors
        mp.kind(0, face, wk)
    for (x0, y0, x1, y1, fk, wk, fr) in rooms:
        mp.kind(0, mp.rect(x0, y0, x1, y1), fk)
    mp.border_kinds = {border}

def opening(mp, x0, y0, x1, y1, floor_kind):
    """a passage through a partition or a wall face: floor there"""
    mp.kind(0, mp.rect(x0, y0, x1, y1), floor_kind)

# ---------------------------------------------------------------- the bar
def counter_h(mp, x0, x1, y, left_end=True, right_end=True, name="Lada"):
    """a horizontal counter from x0 to x1: its top on row y, its front on row y+1"""
    for x in range(x0, x1 + 1):
        col = CNT_L[1] if (x == x0 and left_end) else CNT_R[1] if (x == x1 and right_end) else CNT_M[1]
        mp.t("E", col, 0, x, y); mp.t("E", col, 1, x, y + 1)
    mp.block(x0, y, x1, y + 1, name)

def counter_arm(mp, x, y0, y1, top_end=True, front=True, side=ARM_L, name="Lada"):
    """a vertical counter arm in column x from row y0 to y1 (with the front face on y1 when `front`)"""
    for y in range(y0, y1 + 1):
        if front and y == y1: row = 3
        elif front and y == y1 - 1: row = 2
        elif y == y0 and top_end: row = 0
        else: row = 1
        mp.t("E", side, row, x, y)
    mp.block(x, y0, x, y1, name)

def on_counter(mp, items):
    """things standing on the counter (layer 3): [(x, y, sheet, col, row)]"""
    for (x, y, s, c, r) in items: mp.t(s, c, r, x, y, z=3)

def barrel_rack(mp, x, y, name="Beczki z kranami"):
    """4 barrels on a rack with taps (E 0..3,7..8): cells x..x+3, y..y+1"""
    mp.tiles("E", 0, 7, 4, 2, x, y)
    mp.block(x, y + 1, x + 3, y + 1, name)

def bar_shelf(mp, x, y, kind="bottles", name="Półka z butelkami"):
    """2 x 3 shelves against a wall: bottles/plates/mugs (E 6..7,3..5) or wine (E 1..2,13..15); stands on row y+2"""
    sc, sr = (6, 3) if kind == "bottles" else (1, 13)
    mp.tiles("E", sc, sr, 2, 3, x, y)
    mp.block(x, y + 2, x + 1, y + 2, name)

def tap_barrels(mp, x, y, variant=4, name="Beczka"):
    """a column of barrels (E 4..7, 7..8): 4 two barrels with a tap, 5 barrel + crate of bottles, 6 barrels + sacks,
    7 barrel with a cloth + jugs; stands on row y+1"""
    mp.tiles("E", variant, 7, 1, 2, x, y)
    mp.block(x, y + 1, x, y + 1, name)

# ---------------------------------------------------------------- tables and seats
def table_v(mp, x, y, length, items=(), name="Stół"):
    """a long table one cell wide running down (C 8,4..6, the middle repeated): x, y..y+length-1"""
    for i in range(length):
        row = 4 if i == 0 else 6 if i == length - 1 else 5
        mp.t("C", 8, row, x, y + i)
    for (dy, s, c, r) in items: mp.t(s, c, r, x, y + dy, z=3)
    mp.block(x, y, x, y + length - 1, name)

def bench_v(mp, x, y, length, name="Ława"):
    """a bench running down (C 14,2..4, the middle repeated)"""
    for i in range(length):
        row = 2 if i == 0 else 4 if i == length - 1 else 3
        mp.t("C", 14, row, x, y + i)
    mp.block(x, y, x, y + length - 1, name)

def table_h(mp, x, y, length, style=4, items=(), name="Stół"):
    """a table running across, two rows (C 9..11 at rows style..style+1; style 4 plain, 6 trestle): x..x+length-1, y..y+1"""
    for i in range(length):
        col = 9 if i == 0 else 11 if i == length - 1 else 10
        mp.t("C", col, style, x + i, y); mp.t("C", col, style + 1, x + i, y + 1)
    for (dx, dy, s, c, r) in items: mp.t(s, c, r, x + dx, y + dy, z=3)
    mp.block(x, y, x + length - 1, y + 1, name)

def table_2x2(mp, x, y, style=4, items=(), name="Stół"):
    mp.tiles("C", 12, style, 2, 2, x, y)
    for (dx, dy, s, c, r) in items: mp.t(s, c, r, x + dx, y + dy, z=3)
    mp.block(x, y, x + 1, y + 1, name)

def bench_h(mp, x, y, name="Ława"):
    """a 2-wide bench (C 14..15,1)"""
    mp.t("C", 14, 1, x, y); mp.t("C", 15, 1, x + 1, y)
    mp.block(x, y, x + 1, y, name)

def round_table(mp, x, y, variant=(7, 11), name="Stolik"):
    """a round table one cell wide (E col, row..row+1): its top on y, legs on y+1 - it stands on y+1"""
    c, r = variant
    mp.tiles("E", c, r, 1, 2, x, y)
    mp.block(x, y + 1, x, y + 1, name)

def chair(mp, x, y, facing, arm=False, name="Krzesło"):
    """a chair on cell (x, y) (its back may reach the cell above): facing 2 down, 8 up, 4 left, 6 right"""
    r0 = 2 if arm else 0
    if facing == 2: mp.t("C", 8, r0, x, y - 1, z=3); mp.t("C", 8, r0 + 1, x, y)
    elif facing == 8: mp.t("C", 9, r0 + 1, x, y)
    elif facing == 4: mp.t("C", 10, r0, x, y - 1, z=3); mp.t("C", 10, r0 + 1, x, y)
    elif facing == 6: mp.t("C", 11, r0, x, y - 1, z=3); mp.t("C", 11, r0 + 1, x, y)
    mp.block(x, y, x, y, name)

def stool(mp, x, y, small=False, name="Stołek"):
    mp.t("C", 15 if small else 14, 3 if small else 0, x, y)
    mp.block(x, y, x, y, name)

# ---------------------------------------------------------------- walls: windows, shelves, decorations
def window(mp, x, y, kind="night", curtain=None):
    """a window on a wall face, two cells tall from row y. kind: night (dark panes), lit, arch, arch_lit, shutters"""
    k = {"night": (0, 2), "lit": (1, 2), "arch": (4, 2), "arch_lit": (5, 2), "shutters": (3, 2), "small_arch": (6, 4),
         "small_arch_lit": (7, 4), "gothic": (0, 4)}[kind]
    mp.tiles("B", k[0], k[1], 1, 2, x, y)
    if curtain is not None:
        mp.tiles("B", curtain, 12, 1, 2, x, y, z=3)

def wall_piece(mp, sheet, c, r, w, h, x, y, z=2):
    mp.tiles(sheet, c, r, w, h, x, y, z)

# ---------------------------------------------------------------- lights and fire (events)
def chandelier(mp, x, y, name="Żyrandol"):
    """an iron chandelier with candles hanging over (x, y-2..y) - its picture event stands on (x, y), above the people"""
    mp.pic(x, y, "!$Chandelier", 0, 4, 0, name=name, priority=2, through=True, step=True)
    light(mp, x, y - 1, L_CHANDELIER, "swiatlo zyrandola")

def candelabra(mp, x, y, dark=False, name="Kandelabr"):
    """a standing candelabra (!Decoration2 char 4: black dirs 2/4, brown 6/8)"""
    mp.pic(x, y, "!Decoration2", 4, 2 if dark else 6, 0, name=name, priority=1, step=True)
    light(mp, x, y, L_CANDLES, "swiatlo kandelabru")

def candles(mp, x, y, three=True, lit=True, name="Świece"):
    """candles standing on the floor or a table (!Decoration2 char 1: 1 candle dir 2, 3 candles dir 6)"""
    mp.pic(x, y, "!Decoration2", 1, 6 if three else 2, 0, name=name, priority=1 if lit else 1, through=True, step=True)
    if lit: light(mp, x, y, L_CANDLE, "swiatlo swiec")

def sconce(mp, x, y, name="Kinkiet"):
    """a candle sconce on a wall face (!Decoration2 char 0 dir 2)"""
    mp.pic(x, y, "!Decoration2", 0, 2, 0, name=name, priority=1, through=True, step=True)
    light(mp, x, y + 1, L_SCONCE, "swiatlo kinkietu")

def wall_lantern(mp, x, y, style=0, name="Latarnia", glow=None):
    """a hanging wall lantern (!Decoration char 7: dirs 2/4/6 styles) seen on wall cell (x, y): its event stands one
    cell lower (the lantern is drawn in the upper half of its 48x96 frame)"""
    mp.pic(x, y + 1, "!Decoration", 7, [2, 4, 6][style], 0, name=name, priority=1, through=True, step=True)
    light(mp, x, y + 2, glow or L_LANTERN, "swiatlo latarni")

def big_hearth(mp, x, y, name="Kominek"):
    """the big stone fireplace built into a 3-row wall face whose top row is y: stone pilasters on x and x+3, the arched
    hearth (A5 4..5,12..13) on x+1..x+2 under a stone lintel with a mantel shelf (plates, a jug), the fire (Winlu campfire,
    animated) inside the arch, sconces on the pilasters. The fire's light falls on the floor in front."""
    for dy in range(3):
        r = 12 if dy < 2 else 13
        mp.t("A5", 0, r, x, y + dy, z=0); mp.t("A5", 1, r, x + 3, y + dy, z=0)
    mp.t("A5", 0, 12, x + 1, y, z=0); mp.t("A5", 1, 12, x + 2, y, z=0)
    mp.tiles("A5", 4, 12, 2, 2, x + 1, y + 1, z=0)
    # the mantel shelf over the arch: plates and a jug standing on it (D 6..7,2 the things, D 6..7,3 the board)
    mp.t("D", 6, 2, x + 1, y); mp.t("D", 7, 2, x + 2, y)
    mp.t("D", 6, 3, x + 1, y + 1); mp.t("D", 7, 3, x + 2, y + 1)
    mp.pic(x + 1, y + 2, "!Decoration", 2, 4, 0, name=name, priority=1, step=True)
    mp.pic(x + 2, y + 2, "!Decoration", 2, 4, 1, name=name, priority=1, step=True)
    mp.solidify({(x + 1, y + 2), (x + 2, y + 2)})
    light(mp, x + 1, y + 4, L_FIRE, "swiatlo ognia")
    sconce(mp, x, y + 2); sconce(mp, x + 3, y + 2)

def stage(mp, x0, x1, y0, depth, rug=36, name="Scena"):
    """a raised wooden stage against a north wall: light planks x0..x1, rows y0..y0+depth-1, a panelled front (counter
    fronts) on the row below with steps in the middle; blockers along the front except the steps"""
    mp.kind(0, mp.rect(x0, y0, x1, y0 + depth - 1), 82)
    fy = y0 + depth
    mid = (x0 + x1) // 2
    steps = {mid - 1, mid, mid + 1} if (x1 - x0) >= 6 else {mid}
    for x in range(x0, x1 + 1):
        if x in steps:
            mp.t("A5", 1, 2, x, fy, z=0)
        else:
            mp.t("E", 1, 1, x, fy)
    for x in range(x0, x1 + 1):
        if x not in steps: mp.block(x, fy, x, fy, "Krawędź sceny")
    if rug: mp.kind(1, mp.rect(x0 + 1, y0, x1 - 1, y0 + depth - 1), rug)
    return fy

def tally_stand(mp, x, y, name="Tablica z kreskami"):
    """the dice players' tally board on two posts (!Tavern_Yard char 2, dir 6, pattern 2 - the yard's notice board used as
    a stand-in: there is no chalk board in the Winlu set)"""
    mp.pic(x, y, "!Tavern_Yard", 2, 6, 2, name=name, priority=1)

def fireplace(mp, x, y, kind=2, name="Kominek"):
    """a lit stone fireplace (!$Fireplace2 dir 4: a stone chimney breast; !$Fireplace1 dir 4: a stone arch) on (x, y),
    the bottom row of a wall face; the fire's light falls on the floor in front"""
    mp.pic(x, y, "!$Fireplace%d" % kind, 0, 4, 0, name=name, priority=1, step=True)
    light(mp, x, y + 2, L_FIRE, "swiatlo ognia")

def firewood(mp, x, y, name="Drewno na opał"):
    """a stack of firewood (!Decoration_static char 3, dir 8, pattern 2)"""
    mp.pic(x, y, "!Decoration_static", 3, 8, 2, name=name, priority=1)

def stove(mp, x, y, name="Piec kuchenny"):
    """the kitchen stove with a pot (!$Fireplace_kitchen dir 4) on (x, y) and its stone hood (!$chimney) above it"""
    mp.pic(x, y - 1, "!$chimney", 0, 6, 0, name="Okap", priority=1, through=True)
    mp.pic(x, y, "!$Fireplace_kitchen", 0, 4, 0, name=name, priority=1, step=True)
    light(mp, x, y + 1, L_STOVE, "swiatlo pieca")

def cauldron_fire(mp, x, y, name="Kocioł"):
    """a cauldron on a tripod over a fire (!Decoration char 2 dir 6)"""
    mp.pic(x, y, "!Decoration", 2, 6, 0, name=name, priority=1, step=True)
    light(mp, x, y, L_OVEN, "swiatlo kotla")

def hanging(mp, x, y, pattern, name="Wiszące zapasy"):
    """things hanging from a pole (!Decoration_static char 2 or 3, dir 8): 0 hams (char 2 p0), fish, herbs, garlic..."""
    # !Decoration_static row 3 (dir 8): cols 6..10 = a pole with hams, fish, herbs, garlic; col 11 firewood
    char, pat = [(2, 0), (2, 1), (2, 2), (3, 0), (3, 1)][pattern]
    mp.pic(x, y, "!Decoration_static", char, 8, pat, name=name, priority=2, through=True)

def deer_head(mp, x, y, name="Poroże jelenia"):
    """a mounted deer head: its event stands one row BELOW the wall cell where the head hangs (the frame is 3 cells tall)"""
    mp.pic(x, y + 1, "!$Wall_decoration", 0, 2, 0, name=name, priority=2, through=True)

def trophy(mp, x, y, name="Tarcza z toporami"):
    mp.pic(x, y + 1, "!$Wall_decoration", 0, 4, 0, name=name, priority=2, through=True)

def painting(mp, x, y, char, direction, pattern, name="Obraz"):
    mp.pic(x, y, "!Decoration_static", char, direction, pattern, name=name, priority=1, through=True)

def banner(mp, x, y, col, row=0, name="Chorągiew"):
    """a hanging banner (!Flags_banner_Inside, 48x96 frames): col 0..11 and row 0..2 of the sheet (row 0: 0 horse,
    1 phoenix, 2 wolf, 3 fist, 4 dark, 5..11 plain colours)"""
    mp.pic(x, y, "!Flags_banner_Inside", col // 3, [2, 4, 6, 8][row], col % 3, name=name, priority=1, through=True)

def sign(mp, x, y, name="Szyld"):
    """the tavern's hanging sign with the mug (!Signs char 2, dir 2, pattern 1)"""
    mp.pic(x, y, "!Signs", 2, 2, 1, name=name, priority=2, through=True)

def cat(mp, x, y, facing=2, name="Kot"):
    mp.pic(x, y, "Nature", 1, facing, 1, name=name, priority=1)

def clock(mp, x, y, name="Zegar"):
    mp.pic(x, y, "!clock", 0, 2, 0, name=name, priority=1, step=True)

def chest(mp, x, y, idx=0, name="Kufer"):
    """a chest (!Fantasy_chest char 0 plain, 1 gold, 2 crate, 3 gold ornate)"""
    mp.pic(x, y, "!Fantasy_chest", idx, 2, 0, name=name, priority=1)

def door(mp, x, y, idx=0, name="Drzwi", cmds=None, trigger=0):
    """a wooden door picture on the bottom row of a wall face (!Fantasy_door1 char idx)"""
    return mp.pic(x, y, "!Fantasy_door1", idx, 2, 0, name=name, priority=1, trigger=trigger, cmds=cmds)

def tally_board(mp, x, y):
    """the chalk tally board of the dice corner: a dark framed pane (B 3,0..1) on a wall face - stand-in, see notes"""
    mp.tiles("B", 3, 0, 1, 2, x, y)

def notice_board(mp, x, y, width=2):
    """the quest board: plank boards (E 8,8..9 / 12,8..9) with pinned notes (D 13,9 / 14,9) on top; stands on row y+1"""
    for i in range(width):
        mp.tiles("E", 8 if i % 2 == 0 else 12, 8, 1, 2, x + i, y)
        mp.t("D", 14 if i % 2 == 0 else 13, 9, x + i, y, z=3)
    mp.block(x, y + 1, x + width - 1, y + 1, "Tablica z zadaniami")

def cloaks(mp, x, y, colours=(1, 5, 2)):
    """coat pegs stand-in: hanging cloths (B c,14..15) side by side on a wall face (see notes: no coat pegs in Winlu)"""
    for i, c in enumerate(colours):
        mp.tiles("B", c, 14, 1, 2, x + i, y)
