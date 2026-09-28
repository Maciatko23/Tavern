# python build_parter.py  -> tools/tavern/staging/Map001.json (+ parter_meta.json: zones, things, hooks, wall items)
# The big ground floor of the tavern (Map001 "Tawerna", 101 x 84) on tileset 8 "Wilu Fantasy Interior", laid out by
# parter_layout.py (rooms, walls, openings), furnished room by room here (parter_props.py macros, our props from
# props_index.json), lit by RoomLighting v1.1 (links.LIGHTS, time of day), passable by the staged tileset-8 flags
# (staging/tileset8_flags.json) - a blocker event only where a flag cannot close a cell (none today).
# Keeps events 1..12 of the current data/Map001.json at their ids (Borgar, Melia, Grum, Ozzy, the four "Atmosfera"
# parallels, the loose brick, the three exits); every other event gets an id from 13. Never writes data/.
# Every room is laid out symmetric about its own middle where it invites it (X = the mirror of a column).
import os, sys, json, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parter_props import *
import parter_layout as L
import links

FLAGS_NEW = load_json(os.path.join(STAGING, "tileset8_flags.json"))
UPSTAIRS_ID = 25
OUT = os.path.join(STAGING, "Map001.json")
META = os.path.join(STAGING, "parter_meta.json")
PAINTINGS = [(7, 6, 0), (6, 8, 2), (7, 6, 2), (6, 6, 2), (7, 8, 2), (7, 6, 1), (6, 8, 1), (7, 8, 1)]   # !Decoration_static landscapes / portraits
TABLE_THINGS = [(3, 13), (0, 13), (2, 12), (1, 13), (0, 14), (4, 12), (1, 14), (2, 11)]   # Winlu tiles for table tops

# ============================================================================================ the shell
def shell(mp):
    fm = L.floor_map()
    face = L.face_map(fm)
    kinds = {r[0]: (r[2], r[3]) for r in L.ROOMS}
    mp.kind(0, mp.all, L.BORDER)
    for c, n in face.items(): mp.kind(0, {c}, kinds[n][1])
    for c, n in fm.items(): mp.kind(0, {c}, kinds[n][0])
    mp.floor_cells, mp.face_cells = fm, face
    for (n, r, fk, wk, col, grp) in L.ROOMS:
        x0, y0, x1, y1 = r
        mp.zone(n, x0, y0, x1, y1, col)
    # the two staircases: wooden steps climbing into the dark stairwell above the vestibule's north wall
    for xs in L.STAIRS:
        for x in xs:
            for y in range(L.STAIRS_TOP, L.STAIRS_BOTTOM + 1): mp.tile(0, x, y, A5(1, 2))
            for y in L.STAIRS_VOID: mp.tile(0, x, y, A5(0, 0))
        for y in range(L.STAIRS_TOP, L.STAIRS_BOTTOM + 1):
            for x in (xs[0] - 1, xs[-1] + 1):
                if (x, y) not in fm or x in (40, 60): mp.kind(0, {(x, y)}, L.BORDER)

def stairs_events(mp):
    """walking onto a top step takes the player up to Map025 (links.json "map025_stairs_down": where he lands there)"""
    ln = links.read()
    down = ln.get("map025_stairs_down")
    for side, xs in zip(("west", "east"), L.STAIRS):
        for i, x in enumerate(xs):
            tx, ty, td = 3 + i, 16, 2           # placeholder until the upper floor's stairs are known
            if isinstance(down, dict) and down.get("landing"):
                land = down.get("landing_from_map001") or down["landing"]
                p = land[i % len(land)] if isinstance(land[0], list) else land
                tx, ty = p[0], p[1]
                td = p[2] if len(p) > 2 else 8
            mp.transfer(x, L.STAIRS_TOP, UPSTAIRS_ID, tx, ty, td, name="Schody -> Pokoje gości", se="Move1")
    links.merge(map001_stairs_up={"map": 1, "west": [[x, L.STAIRS_TOP] for x in L.STAIRS[0]],
                                  "east": [[x, L.STAIRS_TOP] for x in L.STAIRS[1]],
                                  "note": "touch events on the top steps of both staircases -> Map025 (map025_stairs_down.landing)"},
                map001_from_above={"map": 1, "landing": [[x, 82, 2] for x in L.STAIRS[1]],
                                   "note": "coming down from Map025: the floor row under the east staircase, facing down"})

# ============================================================================================ the vestibule (Sień)
def vestibule(mp):
    g = "Sień"
    rug(mp, 49, 80, 51, 82, 37)                      # the doormat
    rug(mp, 49, 68, 51, 79, 36)                      # a red runner through the double door to the bar
    # north wall (face 75..77, things standing on row 78): plant, QUEST BOARD, painting, lantern | door | lantern,
    # painting, the hearth between two stacks of firewood, plant
    plant(mp, 41, 78, group=g); plant(mp, 59, 78, group=g)
    mp.prop("tablica_zlecen", 43, 78, group=g, occupy="left=1,right=1")
    mp.light(44, 77, lamp_note("lantern"), "latarnia tablicy")
    mp.hook("board", 43, 78, "Tablica zleceń")
    mp.kind(0, mp.rect(56, 75, 58, 77), 71)
    fireplace_pic(mp, 57, 78, kind=2, group=g)
    firewood(mp, 56, 78, group=g); firewood(mp, 58, 78, group=g)
    painting(mp, 45, 76, 7, 6, 0, group=g + " obrazy"); painting(mp, 55, 76, 7, 6, 1, group=g + " obrazy")
    wall_lantern(mp, 47, 75, 0, group=g + " latarnie"); wall_lantern(mp, 53, 75, 0, group=g + " latarnie")
    # south row (82): bench, coat rack, walking-stick stand | the way out | stand, rack, bench
    bench_h(mp, 43, 82, group=g); bench_h(mp, 56, 82, group=g)
    mp.prop("wieszak", 45, 82, group=g); mp.prop("wieszak", 55, 82, group=g)
    mp.prop("stojak_laski", 46, 82, group=g); mp.prop("stojak_laski", 54, 82, group=g)

# ============================================================================================ the bar hall (centre)
def bar(mp):
    g = "Bar"
    # back-bar on row 62 against the kitchen wall (face 59..61), symmetric about x 44: bottle shelf | tap barrel |
    # the back counter with the taps | tap barrel | wine rack; the price board above the taps
    mp.piece("E", 6, 3, 2, 3, 40, 60, group=g, kind="półka z butelkami")
    mp.piece("E", 4, 7, 1, 2, 42, 61, group=g, kind="beczka z kranem")
    counter_h(mp, 43, 45, 61, group=g)
    mp.prop("krany", 44, 62, group=g)
    mp.piece("E", 4, 7, 1, 2, 46, 61, group=g, kind="beczka z kranem")
    mp.piece("E", 1, 13, 2, 3, 47, 60, group=g, kind="regał z winem")
    wall_prop(mp, "cennik", 44, 60, group="bar_back")
    # the L-counter: the long arm along rows 66..67 (x 38..48), the short arm on the axis side (x 49, rows 62..67)
    counter_h(mp, 38, 48, 66, right_end=False, group=g)
    counter_arm(mp, 49, 62, 67, side=3, group=g)
    for x, (c, r) in ((40, (3, 13)), (42, (4, 12)), (44, (3, 13)), (46, (2, 12))):
        on_table(mp, x, 66, "D", c, r)                  # tankards, a red bottle, a goblet waiting on the counter
    mp.prop("kasetka", 47, 67, group=g)                 # the cash box by Borgar's corner
    mp.prop("dzwonek", 49, 63, group=g)                 # the bell on the short arm
    mp.prop("swieca_lada", 38, 67, group=g, note=lamp_note("candle"))
    mp.hook("meal", 49, 65, "Tavern:meal (zamówienie posiłku)")
    for x in (39, 41, 43, 45, 47): stool(mp, x, 68, group="stołki baru")
    # the bakery's pass on the east half: an opening in the wall with a counter where the dishes wait
    counter_h(mp, 56, 58, 62, group="okienko")
    on_table(mp, 56, 62, "D", 0, 13); on_table(mp, 57, 62, "D", 1, 13); on_table(mp, 58, 62, "D", 0, 14)
    wall_lantern(mp, 54, 59, 0, group="bar_back"); wall_lantern(mp, 60, 59, 0, group="bar_back")
    # two small tables for the bar's guests (east half), two chandeliers over the bar hall
    for x in (55, 59):
        round_table(mp, x, 66, (7, 11), group="stoliki baru")
        chair(mp, x - 1, 67, 6, group="stoliki baru"); chair(mp, x + 1, 67, 4, group="stoliki baru")
        mp.prop("swieca", x, 67, group="stoliki baru", note=lamp_note("candle"))
    chandelier(mp, 44, 71, group="bar"); chandelier(mp, 56, 71, group="bar")

# ============================================================================================ the two wings of the hall
def wing(mp, east):
    """one wing of the great hall (west x 17..36, east = its mirror x -> 100 - x): the stone hearth between the two
    arches, a rug with two armchairs before it, two long tables with benches, two square tables between them"""
    X = (lambda x: 100 - x) if east else (lambda x: x)
    F = (lambda f: {4: 6, 6: 4}.get(f, f)) if east else (lambda f: f)
    g = "Wielka sala " + ("wsch." if east else "zach.")
    hx = X(28) if east else 25                     # the hearth's left column (4 wide: 25..28 / 72..75)
    mp.kind(0, {(X(24), y) for y in (50, 51, 52)} | {(X(29), y) for y in (50, 51, 52)}, 71)
    big_hearth(mp, hx, 50, group=g)
    sconce(mp, X(24), 52, group=g + " kinkiety"); sconce(mp, X(29), 52, group=g + " kinkiety")
    banner(mp, X(22), 52, 0 if not east else 1, group=g + " chorągwie"); banner(mp, X(31), 52, 2 if not east else 3, group=g + " chorągwie")
    rug(mp, min(X(25), X(28)), 54, max(X(25), X(28)), 56, 38)
    firewood(mp, X(24), 53, group=g); firewood(mp, X(29), 53, group=g)
    chair(mp, X(24), 55, F(6), arm=True, group=g + " fotele"); chair(mp, X(29), 55, F(4), arm=True, group=g + " fotele")
    if east: mp.prop("pies_spiacy", X(26), 55, group=g)
    else: mp.prop("kot_spiacy", X(26), 55, group=g)
    # dining: two long tables (x 20 and 33, rows 59..66) with benches, two square tables between them
    for tx in (20, 33):
        table_v(mp, X(tx), 59, 8, group=g + " stoły")
        bench_v(mp, X(tx) - 1, 59, 8, group=g + " ławy"); bench_v(mp, X(tx) + 1, 59, 8, group=g + " ławy")
        for dy, (c, r) in ((1, (3, 13)), (3, (0, 13)), (5, (1, 13))):
            on_table(mp, X(tx), 59 + dy, "D", c, r)
        mp.prop("swieca", X(tx), 65, group=g + " świece", note=lamp_note("candle"))
        chandelier(mp, X(tx), 63, group=g + " żyrandole")
    for ty in (60, 65):
        table_sq(mp, min(X(26), X(27)), ty, group=g + " stoły kwadratowe")
        chair(mp, X(25), ty + 1, F(6), group=g + " krzesła"); chair(mp, X(28), ty + 1, F(4), group=g + " krzesła")
        mp.prop("swieca", X(26), ty + 1, group=g + " świece", note=lamp_note("candle"))
        on_table(mp, X(27), ty, "D", 2, 11)
    for (x, y) in ((21, 61), (21, 63)):              # bench seats facing the long table; the plate on its free cell
        mp.hook("mealtable", X(x), y, "Tavern:mealtable (miejsce przy stole)", opts="dir=%d" % F(4))

# ============================================================================================ the banquet hall
def banquet(mp):
    """Sala biesiadna (x 17..36, rows 30..48, axis between 26 and 27): the gallery of trophies and banners on the north
    wall around the corridor door, two long banquet tables across the hall with benches, chandeliers, a knight's armour
    in each upper corner, candelabras by the door"""
    g = "Sala biesiadna"
    X = lambda x: 53 - x
    for x in (19, X(19)): window(mp, x, 27, "night", curtain=0, group=g + " okna")
    banner(mp, 21, 29, 0, group=g + " chorągwie"); banner(mp, X(21), 29, 1, group=g + " chorągwie")
    deer_head(mp, 23, 28, group=g + " trofea")
    mp.prop("glowa_dzika", X(23), 29, group=g + " trofea")
    statue(mp, 17, 30, group=g); statue(mp, X(17), 30, group=g)
    candelabra(mp, 25, 30, group=g); candelabra(mp, X(25), 30, group=g)
    for ty in (35, 42):
        table_h(mp, 19, ty, 16, style=6, group=g + " stoły")
        for bx in range(19, 35, 2):
            bench_h(mp, bx, ty - 1, group=g + " ławy"); bench_h(mp, bx, ty + 2, group=g + " ławy")
        for i, x in enumerate(range(20, 34, 2)):
            c, r = TABLE_THINGS[i % len(TABLE_THINGS)]
            on_table(mp, x, ty, "D", c, r)
        for x in (22, X(22)): chandelier(mp, x, ty + 1, group=g + " żyrandole")
        for x in (26, X(26)): mp.prop("swieca", x, ty + 1, group=g + " świece", note=lamp_note("candle"))
    for x in (17, X(17)):
        mp.piece("E", 5, 7, 1, 2, x, 46, group=g, kind="beczka")

# ============================================================================================ the stage hall
def stage_hall(mp):
    """Sala ze sceną (x 64..83, rows 30..48, axis between 73 and 74): Melia's raised stage along the north wall with
    tied red drapes, the tavern's tapestries, candelabras, instruments and the tip hat; an open area before it; eight
    tables in two rows with the aisle on the axis"""
    g = "Scena"
    X = lambda x: 147 - x
    mp.kind(0, mp.rect(66, 30, 81, 33), 82)
    rug(mp, 67, 30, 80, 33, 38)
    for x in range(66, 82):
        if x in (73, 74): mp.tile(0, x, 34, A5(1, 2))
        else:
            mp.t("E", 1, 1, x, 34); mp.want_solid.add((x, 34)); mp.solid.add((x, 34))
    mp.rec("stage_edge", "furniture", [(x, 34) for x in range(66, 82) if x not in (73, 74)], g, x=66, y=34)
    mp.tiles("B", 6, 14, 1, 2, 66, 28, z=3); mp.tiles("B", 7, 14, 1, 2, 81, 28, z=3)
    for x in (65, X(65)): window(mp, x, 27, "night", curtain=0, group=g + " okna")
    banner(mp, 70, 29, 0, group=g + " chorągwie"); banner(mp, X(70), 29, 0, group=g + " chorągwie")
    wall_prop(mp, "gobelin_kufel", 73, 28, group=g + " gobeliny", kind="gobelin")
    wall_prop(mp, "gobelin_kufel", 74, 28, group=g + " gobeliny", kind="gobelin")
    candelabra(mp, 67, 31, group=g); candelabra(mp, X(67), 31, group=g)
    mp.prop("lutnia_stojak", 70, 31, group=g); mp.prop("bebenek", X(70), 31, group=g)
    mp.prop("pulpit_nuty", 72, 31, group=g); mp.prop("pulpit_nuty", X(72), 31, group=g)
    mp.prop("kapelusz_monety", 74, 33, group=g)
    mp.hook("stage", 72, 34, "Tavern:stage (miejsce słuchacza)")
    for ty in (38, 44):
        for tx in (67, 71):
            for x in (tx, X(tx)):
                round_table(mp, x, ty, (7, 11), group=g + " stoliki")
                chair(mp, x - 1, ty + 1, 6, group=g + " krzesła"); chair(mp, x + 1, ty + 1, 4, group=g + " krzesła")
                mp.prop("swieca", x, ty + 1, group=g + " świece", note=lamp_note("candle"))
    chandelier(mp, 69, 42, group=g + " żyrandole"); chandelier(mp, X(69), 42, group=g + " żyrandole")
    for x in (64, 83): mp.piece("E", 7, 7, 1, 2, x, 46, group=g, kind="beczka z dzbanami")

# ============================================================================================ the side rooms
def hunters(mp):
    """Pokój myśliwski (x 1..15, rows 30..48, axis x 8): a rough stone chimney with a fire in the middle of the north
    wall, crossed spears above it, antlers and a boar left and right, a rug before the fire with two armchairs and the
    hunting dog asleep, the hunters' long table, weapon racks and a wolf pelt, chests and barrels"""
    g = "Pokój myśliwski"
    X = lambda x: 16 - x
    mp.kind(0, mp.rect(6, 27, 10, 29), 71)
    fireplace_pic(mp, 8, 30, kind=1, group=g)
    wall_prop(mp, "wlocznie", 8, 28, group=g + " trofea", kind="włócznie")
    deer_head(mp, 4, 28, group=g + " trofea"); mp.prop("glowa_dzika", X(4), 29, group=g + " trofea")
    window(mp, 2, 27, "night", curtain=2, group=g + " okna")
    wall_lantern(mp, 11, 27, 0, group=g + " latarnie"); wall_lantern(mp, 5, 27, 0, group=g + " latarnie")
    firewood(mp, 5, 30, group=g); firewood(mp, X(5), 30, group=g)
    rug(mp, 7, 32, 9, 34, 21)
    chair(mp, 6, 33, 6, arm=True, group=g + " fotele"); chair(mp, X(6), 33, 4, arm=True, group=g + " fotele")
    mp.prop("pies_spiacy", 8, 33, group=g)
    table_h(mp, 5, 39, 7, style=4, group=g + " stół")
    for x in (5, 7, 9, 11):
        chair(mp, x, 38, 2, group=g + " krzesła"); chair(mp, x, 41, 8, group=g + " krzesła")
    for x, (c, r) in ((6, (0, 13)), (10, (3, 13))): on_table(mp, x, 39, "D", c, r)
    chandelier(mp, 8, 40, group=g)
    mp.piece("E", 8, 10, 2, 2, 2, 44, group=g, kind="stojak z bronią")
    mp.piece("E", 11, 10, 2, 2, 13, 44, group=g, kind="stojak z bronią")
    rug(mp, 6, 44, 10, 46, 21)
    mp.piece("D", 9, 12, 2, 2, 7, 44, z=2, group=g, kind="skóra wilka", solid_rows=[])
    chest(mp, 2, 48, 0, group=g); chest(mp, 14, 48, 3, group=g)
    mp.piece("D", 8, 0, 2, 2, 1, 36, group=g, kind="beczki")

def gaming(mp):
    """Pokój gier (x 85..99, rows 30..48, axis x 92): the chalk tally board in the middle of the north wall, two dice
    tables above, the arm-wrestling table in the middle (Grum beside it), a card table and a checkers table below, a
    long bench for the watchers"""
    g = "Pokój gier"
    X = lambda x: 184 - x
    wall_prop(mp, "tablica_kreda", 92, 29, group=g, kind="tablica kredowa")
    for x in (89, X(89)): window(mp, x, 27, "night", curtain=5, group=g + " okna")
    wall_lantern(mp, 97, 27, 0, group=g + " latarnie")
    items = {33: ("kubek_kosci", "monety"), 41: ("karty", "warcaby")}
    for ty in (33, 41):
        for side, tx in enumerate((87, X(88))):
            table_sq(mp, tx, ty, group=g + " stoły")
            stool(mp, tx - 1, ty + 1, group=g + " stołki"); stool(mp, tx + 2, ty + 1, group=g + " stołki")
            seat_x = tx + (0 if side == 0 else 1)
            chair(mp, seat_x, ty + 2, 8, group=g + " krzesła")
            mp.prop(items[ty][side], tx + (1 if side == 0 else 0), ty + 1, group=g + " na stołach")
            mp.prop("swieca", seat_x, ty + 1, group=g + " świece", note=lamp_note("candle"))
            if ty == 33:                                # the east table is Grum's (<Tavern:dice:grum>)
                mp.hook("dice", seat_x, ty + 2, "Tavern:dice (miejsce gracza)", suffix=":grum" if side else "")
    round_table(mp, 92, 36, (7, 11), group=g + " siłowanie")
    stool(mp, 91, 37, group=g + " stołki"); stool(mp, 93, 37, group=g + " stołki")
    mp.hook("arm", 92, 37, "Tavern:arm (siłowanie na rękę)")
    chandelier(mp, 89, 38, group=g + " żyrandole"); chandelier(mp, X(89), 38, group=g + " żyrandole")
    for bx in (88, 90, 94, 96): bench_h(mp, bx, 47, group=g + " ławy")
    mp.piece("E", 5, 7, 1, 2, 85, 46, group=g, kind="beczka"); mp.piece("E", 5, 7, 1, 2, 99, 46, group=g, kind="beczka")
    mp.prop("kot_spiacy", 92, 44, group=g)

def bathhouse(mp):
    """Łaźnia (x 1..15, rows 53..69, axis x 8): the stove that heats the water in the middle of the north wall, four
    bathtubs in two rows with bath mats, screens between the rows, buckets and towels by the tubs, benches"""
    g = "Łaźnia"
    X = lambda x: 16 - x
    kitchen_stove(mp, 8, 53, group=g, hood=0)
    for x in (3, X(3)): window(mp, x, 50, "night", curtain=1, group=g + " okna")
    wall_lantern(mp, 5, 50, 1, group=g + " latarnie"); wall_lantern(mp, X(5), 50, 1, group=g + " latarnie")
    for ty in (57, 65):
        for x in (4, X(4)):
            rug(mp, x - 1, ty + 1, x + 1, ty + 1, 37)
            mp.prop("balia", x, ty, group=g + " balie", occupy="left=1,right=1")
            mp.hook("bath", x, ty, "Tavern:bath (kąpiel)")
    mp.piece("C", 4, 13, 2, 3, 2, 59, group=g, kind="parawan"); mp.piece("C", 6, 13, 2, 3, 13, 59, group=g, kind="parawan")
    for (x, y) in ((1, 57), (15, 57)): mp.prop("cebrzyk", x, y, group=g)
    for (x, y) in ((1, 65), (15, 65)): mp.prop("stolek_reczniki", x, y, group=g)
    rug(mp, 7, 56, 9, 67, 37)
    plant(mp, 1, 69, group=g, kind=0); plant(mp, 15, 69, group=g, kind=0)
    firewood(mp, 7, 53, group=g); firewood(mp, X(7), 53, group=g)            # the stove's fuel and its water
    mp.piece("D", 13, 0, 1, 2, 6, 52, group=g, kind="beczka z wodą"); mp.piece("D", 13, 0, 1, 2, X(6), 52, group=g, kind="beczka z wodą")
    bench_h(mp, 3, 69, group=g + " ławy"); bench_h(mp, X(4), 69, group=g + " ławy")
    # Wanda the bath attendant by her stove (TavernLife.js <Tavern:attendant>: she speaks the bath's lines)
    cmds = [{"code": 108, "indent": 0, "parameters": ["<Tavern:attendant>"]},
            {"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, "Łaziebna Wanda"]},
            {"code": 401, "indent": 0, "parameters": ["Woda grzeje się od świtu. Wybierz wolną balię i daj znak -"]},
            {"code": 401, "indent": 0, "parameters": ["przyniosę gorącej, mydło i ręcznik."]}]
    mp.picture(8, 55, "People1_Tall", 5, 2, 1, name="Łaziebna Wanda", priority=1, trigger=0, cmds=cmds, note="")
    mp.solid.add((8, 55)); mp.blocked.add((8, 55))
    mp.hooks.append(("attendant", 8, 55))

def darts(mp):
    """Sala rzutek (x 85..99, rows 53..69, axis x 92): two dartboards on the north wall, a throwing line 4 cells before
    each, the NIE PLUĆ plaque between them, three tables for the watchers, benches along the back wall, barrels"""
    g = "Sala rzutek"
    X = lambda x: 184 - x
    for x in (89, X(89)):
        wall_prop(mp, "tarcza_rzutki", x, 52, group=g + " tarcze", kind="tarcza")
        rug(mp, x - 1, 57, x + 1, 57, 36)
        mp.hook("darts", x, 57, "Tavern:darts (linia rzutu)")
    wall_prop(mp, "nie_pluc", 92, 52, group=g, kind="tabliczka")
    wall_lantern(mp, 88, 50, 0, group=g + " latarnie"); wall_lantern(mp, X(88), 50, 0, group=g + " latarnie")
    for tx in (87, 92, 97):
        round_table(mp, tx, 61, (6, 9), group=g + " stoliki")
        stool(mp, tx - 1, 62, group=g + " stołki"); stool(mp, tx + 1, 62, group=g + " stołki")
    for tx in (89, X(89)):                               # the second row, behind the throwing lanes' tables
        round_table(mp, tx, 65, (7, 11), group=g + " stoliki 2")
        stool(mp, tx - 1, 66, group=g + " stołki"); stool(mp, tx + 1, 66, group=g + " stołki")
        mp.prop("swieca", tx, 66, group=g + " świece", note=lamp_note("candle"))
    for bx in (86, 89): bench_h(mp, bx, 68, group=g + " ławy"); bench_h(mp, X(bx + 1), 68, group=g + " ławy")
    plant(mp, 85, 54, group=g, kind=0); plant(mp, 99, 54, group=g, kind=0)
    mp.piece("E", 4, 7, 1, 2, 85, 67, group=g, kind="beczka"); mp.piece("E", 4, 7, 1, 2, 99, 67, group=g, kind="beczka")
    wall_prop(mp, "kufle_wieszak", 92, 50, group=g, kind="kufle")

def dining(mp):
    """Jadalnia prywatna (x 19..35, rows 74..82, axis x 27): a long table for a private feast with two carved armchairs
    at its ends, twelve chairs, two chandeliers; sideboards and tapestries on the north wall"""
    g = "Jadalnia"
    X = lambda x: 54 - x
    table_h(mp, 21, 78, 13, style=4, group=g + " stół")
    for x in (22, 24, 26, 28, 30, 32):
        chair(mp, x, 77, 2, group=g + " krzesła"); chair(mp, x, 80, 8, group=g + " krzesła")
    chair(mp, 20, 79, 6, arm=True, group=g + " fotele"); chair(mp, X(20), 79, 4, arm=True, group=g + " fotele")
    for i, x in enumerate((22, 24, 26, 28, 30, 32)):
        c, r = TABLE_THINGS[i % len(TABLE_THINGS)]
        on_table(mp, x, 78, "D", c, r)
    mp.prop("swieca", 27, 79, group=g + " świece", note=lamp_note("candle"))
    for x in (24, X(24)): chandelier(mp, x, 79, group=g + " żyrandole")
    mp.piece("C", 6, 2, 2, 2, 20, 73, group=g, kind="kredens")
    mp.piece("C", 6, 2, 2, 2, X(21), 73, group=g, kind="kredens")
    wall_prop(mp, "gobelin_polowanie", 23, 72, group=g + " gobeliny", kind="gobelin")
    wall_prop(mp, "gobelin_polowanie", X(23), 72, group=g + " gobeliny", kind="gobelin")
    for (x, y) in ((24, 80), (30, 80)):              # the chairs below the table (the top row holds the settings);
        mp.hook("mealtable", x, y, "Tavern:mealtable (miejsce przy stole)", opts="dir=8 plate=0,-2")   # plate on the top

def reading(mp):
    """Palarnia i czytelnia (x 65..81, rows 74..82, axis x 73): tall bookcases along the north wall, a lectern with an
    open book on a rug in the middle, two reading corners with armchairs round a small table, a clock"""
    g = "Czytelnia"
    X = lambda x: 146 - x
    for x in (65, 66, 67, 68):
        mp.piece("C", x - 65, 6, 1, 3, x, 72, group=g + " regały", kind="regał z książkami")
        mp.piece("C", x - 65, 6, 1, 3, X(x), 72, group=g + " regały", kind="regał z książkami")
    rug(mp, 72, 77, 74, 80, 22)
    rug(mp, 66, 77, 70, 80, 21); rug(mp, 76, 77, 80, 80, 21)
    mp.piece("C", 0, 14, 2, 2, 69, 81, group=g + " sofy", kind="sofa"); mp.piece("C", 0, 14, 2, 2, X(70), 81, group=g + " sofy", kind="sofa")
    painting(mp, 70, 72, 7, 6, 0, group=g + " obrazy"); painting(mp, X(70), 72, 7, 6, 2, group=g + " obrazy")
    plant(mp, 65, 82, group=g, kind=1); plant(mp, 81, 82, group=g, kind=1)
    mp.ev(73, 78, "!Decoration_static", 6, 2, 1, name="Pulpit z księgą", priority=1, through=False)
    mp.rec("lectern", "floorprop", {(73, 78)}, g, x=73, y=78)
    for cx in (68, X(68)):
        mp.piece("C", 4, 0, 1, 2, cx, 78, group=g + " stoliki", kind="stolik")
        chair(mp, cx - 1, 79, 6, arm=True, group=g + " fotele"); chair(mp, cx + 1, 79, 4, arm=True, group=g + " fotele")
    on_table(mp, 68, 78, "D", 6, 11); on_table(mp, X(68), 78, "D", 5, 12)
    candelabra(mp, 71, 74, group=g); candelabra(mp, X(71), 74, group=g)
    clock(mp, 73, 82, group=g)
    for x in (66, X(66)): mp.piece("C", 5, 11, 1, 2, x, 81, group=g, kind="szafka")

# ============================================================================================ corridor and service wing
def corridor(mp):
    """Korytarz (x 1..99, rows 23..25): a long red runner; on its north wall, in every run between two doors, lanterns
    and paintings in a steady rhythm (a lantern every 6 cells, a painting between two lanterns), plants by the doors"""
    g = "Korytarz"
    rug(mp, 2, 24, 98, 24, 36)
    doors = sorted({x for (n, (x0, y0, x1, y1)) in L.OPENINGS if y0 == 19 for x in range(x0, x1 + 1)})
    runs, start = [], 1
    for x in doors + [100]:
        if x - 1 >= start: runs.append((start, x - 1))
        start = x + 1
    k = 0
    for (a, b) in runs:
        n = (b - a + 1)
        if n < 5: continue
        slots = list(range(a + 2, b - 1, 6))
        off = ((b - 2) - slots[-1]) // 2 if slots else 0          # centre the rhythm in the run
        for i, x in enumerate(slots):
            wall_lantern(mp, x + off, 20, 0, group=g + " latarnie", light="lantern_small")   # (the service rooms just behind the wall)
            px = x + off + 3
            if px <= b - 2:
                painting(mp, px, 21, *PAINTINGS[k % len(PAINTINGS)], group=g + " obrazy")
                k += 1
    for (x0, x1) in ((18, 19), (35, 36), (62, 63), (77, 78)):
        plant(mp, x0 - 1, 23, group=g, kind=1); plant(mp, x1 + 1, 23, group=g, kind=1)

def pantry(mp):
    """Spiżarnia (x 38..62, rows 30..37): food shelves along the whole north wall on both sides of the corridor door,
    two islands of barrels and sacks in the middle, barrels, crates and sacks along the south wall (the doors to the
    kitchen and the bakery kept free)"""
    g = "Spiżarnia"
    pieces = [(4, 4, 2, 2), (5, 6, 1, 3), (6, 6, 1, 3), (7, 6, 1, 3), (6, 4, 2, 2), (0, 3, 1, 2)]
    for (x0, x1) in ((38, 48), (52, 62)):
        x = x0
        seq = pieces if x0 == 38 else pieces[::-1]
        i = 0
        while x <= x1:
            c, r, w, h = seq[i % len(seq)]
            if x + w - 1 > x1: w = 1; c, r, h = 5, 6, 3
            mp.piece("C", c, r, w, h, x, 30 - (h - 1), group=g + " półki", kind="półka ze spiżarni")
            x += w; i += 1
    for (x0, y0) in ((41, 34), (55, 34)):                # the islands: barrels, sacks, crates (3 x 2)
        mp.piece("D", 13, 2, 1, 1, x0, y0 + 1, group=g, kind="beczka z mąką")
        mp.piece("D", 14, 2, 1, 1, x0 + 1, y0 + 1, group=g, kind="beczka z jabłkami")
        mp.piece("D", 15, 3, 1, 1, x0 + 2, y0 + 1, group=g, kind="beczka wina")
        mp.piece("D", 8, 2, 2, 2, x0 + 4, y0, group=g, kind="worki")
    mp.piece("D", 8, 0, 2, 2, 38, 36, group=g + " pod ścianą", kind="beczki")
    mp.piece("D", 11, 3, 2, 2, 40, 36, group=g + " pod ścianą", kind="skrzynie")
    mp.piece("D", 8, 2, 2, 2, 46, 36, group=g + " pod ścianą", kind="worki")
    mp.piece("D", 8, 2, 2, 2, 52, 36, group=g + " pod ścianą", kind="worki")
    mp.piece("D", 11, 3, 2, 2, 54, 36, group=g + " pod ścianą", kind="skrzynie")
    mp.piece("D", 14, 0, 1, 2, 62, 36, group=g + " pod ścianą", kind="beczka")

def kitchen(mp):
    """Kuchnia (x 38..49, rows 42..57): two stoves under stone hoods on the north wall, the wall between them hung
    symmetric about the pantry door (hams | pans | STOVE | pans | bowls || spices | pans | STOVE | pans | herbs), the
    cook's worktop along the west wall and the cupboards along the east wall, the long prep table and the butcher's
    block, the cauldron, the water barrel with a ladle, a staff table by the bar door"""
    g = "Kuchnia"
    for x in (40, 47): kitchen_stove(mp, x, 42, group=g + " piece", hood=[2, 3][x % 2])
    for (c, x) in ((0, 39), (1, 41), (2, 46), (0, 48)):   # rails with pans and pots (1 x 2 each)
        mp.tiles("D", c, 6, 1, 2, x, 40)
        mp.wall_items.append((g + " garnki", "pans", x, 40))
    mp.t("D", 6, 2, 42, 40)                                 # bowls on a shelf
    wall_prop(mp, "polka_przyprawy", 45, 41, group=g, kind="półka")
    hanging(mp, 38, 40, 0, group=g + " zapasy"); hanging(mp, 49, 40, 2, group=g + " zapasy")
    firewood(mp, 38, 43, group=g); firewood(mp, 49, 43, group=g)
    mp.piece("D", 14, 2, 1, 1, 41, 42, group=g, kind="kosz jabłek"); mp.piece("D", 15, 2, 1, 1, 46, 42, group=g, kind="beczka z butelkami")
    counter_arm(mp, 38, 44, 47, side=3, group=g + " blat")
    on_table(mp, 38, 44, "D", 1, 10); on_table(mp, 38, 45, "D", 5, 10)
    mp.piece("C", 4, 9, 1, 2, 49, 45, group=g + " szafki", kind="szafka z talerzami")
    mp.piece("D", 13, 2, 1, 1, 49, 47, group=g, kind="beczka z mąką")
    table_v(mp, 43, 46, 6, group=g + " stoły")
    for dy, (c, r) in ((1, (0, 8)), (3, (0, 9)), (4, (1, 9))): on_table(mp, 43, 46 + dy, "D", c, r)
    table_sq(mp, 46, 46, style=6, group=g + " stoły")
    on_table(mp, 46, 46, "D", 0, 8); on_table(mp, 47, 46, "D", 1, 8)
    cauldron_fire(mp, 40, 48, group=g)
    mp.piece("D", 13, 0, 1, 2, 38, 51, group=g, kind="beczka z wodą")
    mp.prop("chochla", 38, 52, group=g, priority=2)            # above the barrel's rim (a star tile)
    mp.piece("D", 9, 5, 1, 1, 40, 52, group=g, kind="cebrzyk do zmywania")
    mp.piece("D", 8, 2, 2, 2, 46, 50, group=g, kind="worki")
    mp.piece("D", 14, 2, 1, 1, 48, 51, group=g, kind="beczka z jabłkami")
    mp.piece("C", 6, 2, 2, 2, 48, 54, group=g, kind="kredens z naczyniami")
    mp.piece("D", 13, 2, 1, 1, 46, 57, group=g, kind="beczka z mąką"); mp.piece("D", 14, 2, 1, 1, 47, 57, group=g, kind="beczka z jabłkami")
    table_h(mp, 41, 55, 3, style=4, group=g + " stół służby")
    stool(mp, 40, 56, group=g + " stołki"); stool(mp, 44, 56, group=g + " stołki")
    on_table(mp, 42, 55, "D", 0, 15)
    mp.prop("swieca", 42, 56, group=g, note=lamp_note("candle"))

def bakery(mp):
    """Piekarnia (x 51..62, rows 42..57): the bread oven in the north wall, the stove with firewood either side, flour
    barrels along the west wall, the long dough table and the bread table, flour sacks, bread crates; its pass opens
    onto the bar hall"""
    g = "Piekarnia"
    mp.tiles("A5", 4, 11, 2, 3, 53, 39, z=0)
    mp.light(53, 42, lamp_note("oven"), "żar w piecu chlebowym")
    kitchen_stove(mp, 57, 42, group=g, hood=1)
    firewood(mp, 56, 42, group=g); firewood(mp, 58, 42, group=g)
    mp.piece("C", 5, 6, 1, 3, 61, 40, group=g, kind="półka z chlebem")
    mp.piece("C", 7, 6, 1, 3, 62, 40, group=g, kind="półka z warzywami")
    hanging(mp, 52, 40, 3, group=g + " zapasy"); hanging(mp, 55, 40, 2, group=g + " zapasy")   # either side of the oven
    for y in (43, 44, 45):                              # flour barrels ranked along both side walls
        mp.piece("D", 13, 2, 1, 1, 51, y, group=g + " mąka", kind="beczka z mąką")
        mp.piece("D", 13, 2, 1, 1, 62, y, group=g + " mąka", kind="beczka z mąką")
    table_h(mp, 53, 47, 6, style=6, group=g + " stoły")
    for i, x in enumerate((54, 56, 57)):
        on_table(mp, x, 47, "D", [(4, 10), (5, 10), (0, 15)][i][0], [(4, 10), (5, 10), (0, 15)][i][1])
    mp.piece("D", 8, 2, 2, 2, 60, 51, group=g, kind="worki mąki")
    mp.piece("E", 6, 7, 1, 2, 62, 51, group=g, kind="beczka z workami")
    mp.piece("D", 13, 2, 1, 1, 52, 52, group=g, kind="beczka z mąką")
    mp.piece("D", 13, 2, 1, 1, 52, 55, group=g, kind="beczka z mąką")
    table_h(mp, 54, 53, 4, style=4, group=g + " stoły")
    on_table(mp, 55, 53, "D", 4, 10); on_table(mp, 56, 53, "D", 5, 10)
    mp.prop("swieca", 56, 54, group=g, note=lamp_note("candle"))
    mp.piece("D", 11, 3, 2, 2, 61, 55, group=g, kind="skrzynie z chlebem")

def service(mp):
    """the rooms of the service wing along the top: the old stones with the loose brick, the storeroom, the brewery,
    the staff room, Borgar's office, the store and the smokehouse"""
    # ---- Stare mury (x 1..10): the oldest stones of the fortress, the loose brick, rubble, chains, old chests
    g = "Stare mury"
    bx, by = L.SPOTS["Luźna cegła"]
    mp.t("A5", 0, 12, bx, by, z=0)                            # the odd stone in the old wall (the brick)
    mp.t("D", 11, 6, bx, by + 1, z=2)                         # crumbs under it
    mp.t("D", 13, 7, 1, 1, z=3); mp.t("D", 15, 7, 10, 1, z=3)
    mp.t("D", 9, 6, 7, 2, z=2); mp.t("D", 9, 7, 7, 3, z=2)    # chains on the old wall
    mp.t("D", 14, 10, 9, 3, z=2)                              # a mouse hole
    # the old vault: four ruined stone piers in two pairs, the garrison's rusty weapon rack by the wall, old chests
    # against the side walls, the broken crates in the middle, fallen stones and a heap of rubble, cobwebs
    for (px, py) in ((2, 6), (8, 6), (2, 13), (8, 13)):
        mp.tiles("B", 8 if px == 2 else 10, 8, 1, 3, px, py)
        mp.want_solid.add((px, py + 2)); mp.solid.add((px, py + 2))
        mp.rec("filar", "furniture", {(px, py + 2)}, g, x=px, y=py)
        mp.t("D", 13 if px == 2 else 15, 7, px, py, z=3)
    mp.piece("E", 11, 10, 2, 2, 1, 3, group=g, kind="stary stojak z bronią")
    mp.piece("D", 13, 5, 2, 2, 5, 10, group=g, kind="połamane skrzynie")
    chest(mp, 1, 10, 6, group=g); chest(mp, 10, 10, 0, group=g)
    mp.piece("D", 11, 7, 2, 2, 4, 15, group=g, kind="gruz")
    mp.piece("D", 8, 0, 2, 2, 1, 17, group=g, kind="stare beczki"); mp.piece("D", 11, 3, 2, 2, 9, 17, group=g, kind="stare skrzynie")
    wall_lantern(mp, 6, 1, 1, group=g)
    mp.tiles("D", 11, 10, 2, 2, 1, 1, z=2)                     # the old wall cracked open (bricks behind the stone)
    mp.piece("D", 8, 13, 1, 3, 10, 2, group=g, kind="stara drabina")   # a ladder left against the wall
    mp.t("D", 11, 5, 7, 13, z=2); mp.t("D", 11, 5, 3, 11, z=2); mp.t("D", 11, 5, 7, 17, z=2)   # loose stones
    mp.t("D", 5, 13, 6, 17, z=3)                                # an old skull by the rubble
    mp.t("D", 13, 7, 1, 18, z=3); mp.t("D", 15, 7, 10, 18, z=3)
    # ---- Skład (x 12..25): three long racks (shelves, barrels, crates) with aisles between, sacks and crates by the door
    g = "Skład"
    for y in (3, 8, 13):
        mp.piece("E", 9, 14, 3, 2, 13, y, group=g + " regały", kind="regał ze skrzynkami")
        mp.piece("D", 8, 0, 2, 2, 16, y, group=g + " regały", kind="beczki")
        mp.piece("E", 9, 14, 3, 2, 18, y, group=g + " regały", kind="regał ze skrzynkami")
        mp.piece("D", 11, 3, 2, 2, 21, y, group=g + " regały", kind="skrzynie")
    mp.piece("D", 10, 0, 3, 2, 23, 3, group=g, kind="stos beczek")
    mp.piece("D", 8, 2, 2, 2, 23, 8, group=g, kind="worki")
    mp.piece("D", 10, 0, 3, 2, 23, 13, group=g, kind="stos beczek")
    mp.piece("D", 8, 0, 2, 2, 13, 17, group=g, kind="beczki")
    mp.piece("D", 8, 2, 2, 2, 22, 17, group=g, kind="worki"); mp.piece("D", 13, 3, 1, 2, 24, 17, group=g, kind="skrzynia")
    mp.t("D", 15, 7, 25, 4, z=3); mp.t("D", 13, 7, 12, 4, z=3)
    mp.t("D", 14, 10, 12, 3, z=2)                              # a mouse hole above the free west column
    wall_lantern(mp, 21, 1, 1, group=g)
    # ---- Browar (x 27..44): the copper kettles, fermentation vats, barrel racks, hop and malt sacks
    g = "Browar"
    for x in (29, 42): window(mp, x, 1, "night", curtain=None, group=g + " okna")
    wall_lantern(mp, 35, 1, 0, group=g + " latarnie")
    mp.prop("kociol_miedziany", 32, 6, group=g, occupy="left=1,right=1", note=lamp_note("oven"))
    mp.prop("kociol_miedziany", 39, 6, group=g, occupy="left=1,right=1", note=lamp_note("oven"))
    table_h(mp, 34, 5, 3, style=6, group=g + " stoły")
    on_table(mp, 34, 5, "D", 2, 11); on_table(mp, 36, 5, "D", 1, 12)
    for x in (30, 35, 40): mp.prop("kadz", x, 11, group=g, occupy="left=1,right=1")
    mp.prop("worki_chmiel", 29, 15, group=g, occupy="left=1,right=1")
    mp.prop("worki_slod", 33, 15, group=g, occupy="left=1,right=1")
    mp.piece("E", 0, 7, 4, 2, 37, 14, group=g, kind="beczki z kranami")
    mp.piece("D", 10, 0, 3, 2, 42, 17, group=g, kind="stos beczek")
    mp.piece("D", 8, 0, 2, 2, 27, 17, group=g, kind="beczki")
    # barrels ranked along both side walls, malt and bottles against the north wall, crates by the door
    for y in range(5, 13):
        c = (15, 3) if y % 2 == 0 else (14, 3)
        mp.piece("D", c[0], c[1], 1, 1, 27, y, group=g + " beczki", kind="beczka")
        mp.piece("D", c[0], c[1], 1, 1, 44, y, group=g + " beczki", kind="beczka")
    mp.piece("D", 8, 2, 2, 2, 27, 3, group=g, kind="worki słodu"); mp.piece("D", 8, 2, 2, 2, 43, 3, group=g, kind="worki słodu")
    mp.piece("C", 6, 4, 2, 2, 29, 3, group=g, kind="półka z dzbanami"); mp.piece("C", 6, 4, 2, 2, 41, 3, group=g, kind="półka z dzbanami")
    mp.piece("D", 11, 3, 2, 2, 29, 17, group=g, kind="skrzynie"); mp.piece("D", 11, 3, 2, 2, 40, 17, group=g, kind="skrzynie")
    # ---- Pokój służby (x 46..55): four beds (two by the north wall, two by the south), wardrobes, the table
    g = "Pokój służby"
    for x in (50, 51): window(mp, x, 1, "night", curtain=4, group=g + " okna")
    for x in (46, 54):                                  # two double beds in the corners, nightstands beside them
        mp.piece("C", 13, 10, 2, 3, x, 3, group=g + " łóżka", kind="łóżko", solid_rows=[1, 2])
    for x in (48, 52):                                  # two more by the south wall, the way to the door between them
        mp.piece("C", 13, 10, 2, 3, x, 15, group=g + " łóżka", kind="łóżko", solid_rows=[1, 2])
    mp.piece("C", 5, 0, 1, 2, 48, 3, group=g, kind="stolik nocny"); mp.piece("C", 5, 0, 1, 2, 53, 3, group=g, kind="stolik nocny")
    chest(mp, 46, 6, 6, group=g); chest(mp, 55, 6, 6, group=g)
    rug(mp, 48, 9, 53, 12, 21)
    table_sq(mp, 50, 10, style=4, group=g)
    for (x, f) in ((49, 6), (52, 4)): chair(mp, x, 11, f, group=g)
    mp.prop("swieca", 50, 11, group=g, note=lamp_note("candle"))
    mp.piece("C", 5, 11, 1, 2, 46, 16, group=g, kind="szafa"); mp.piece("C", 5, 11, 1, 2, 55, 16, group=g, kind="szafa")
    mp.piece("D", 9, 5, 1, 1, 46, 12, group=g, kind="miska z wodą"); mp.piece("D", 9, 5, 1, 1, 55, 12, group=g, kind="miska z wodą")
    # ---- Gabinet Borgara (x 57..68): bookcases, a small hearth, the desk with the ledger, the strongbox, keys, map
    g = "Gabinet"
    for x in (58, 59, 66, 67):
        mp.piece("C", {58: 0, 59: 1, 66: 3, 67: 4}[x], 6, 1, 3, x, 2, group=g + " regały", kind="regał")
    fireplace_pic(mp, 62, 4, kind=4, group=g)
    wall_prop(mp, "klucze", 64, 3, group=g, kind="klucze"); wall_prop(mp, "mapa", 60, 3, group=g, kind="mapa")
    rug(mp, 60, 8, 64, 12, 22)
    table_h(mp, 61, 9, 3, style=4, group=g + " biurko")
    mp.prop("ksiega_rachunkowa", 62, 10, group=g)
    chair(mp, 62, 8, 2, arm=True, group=g)
    mp.prop("szkatula", 66, 11, group=g)
    chest(mp, 58, 17, 1, group=g); clock(mp, 67, 17, group=g)
    candelabra(mp, 58, 11, group=g)
    plant(mp, 57, 4, group=g, kind=1); plant(mp, 68, 4, group=g, kind=1)
    # the guests' corner below the desk: two armchairs at a small round table with the globe, on their own rug
    rug(mp, 60, 14, 64, 16, 21)
    mp.piece("C", 4, 0, 1, 2, 62, 14, group=g + " stolik", kind="stolik")
    chair(mp, 61, 15, 6, arm=True, group=g + " fotele"); chair(mp, 63, 15, 4, arm=True, group=g + " fotele")
    on_table(mp, 62, 14, "D", 5, 12)
    mp.piece("C", 5, 9, 1, 2, 57, 14, group=g, kind="szafka ze szkłem"); mp.piece("C", 5, 9, 1, 2, 68, 14, group=g, kind="szafka ze szkłem")
    # ---- Magazyn (x 70..84): three unbroken racks (shelves with barrels and crates between) and the aisles, the
    # side columns free to walk round, sacks and crates by the door
    g = "Magazyn"
    for y in (3, 8, 13):
        for x in (71, 76, 81):
            mp.piece("E", 9, 14, 3, 2, x, y, group=g + " regały", kind="regał")
        mp.piece("D", 8, 0, 2, 2, 74, y, group=g + " regały", kind="beczki")
        mp.piece("D", 11, 3, 2, 2, 79, y, group=g + " regały", kind="skrzynie")
    mp.piece("D", 10, 0, 3, 2, 71, 17, group=g, kind="stos beczek")
    mp.piece("D", 8, 2, 2, 2, 74, 17, group=g, kind="worki")
    mp.piece("D", 11, 3, 2, 2, 80, 17, group=g, kind="skrzynie"); mp.piece("D", 8, 0, 2, 2, 82, 17, group=g, kind="beczki")
    mp.t("D", 13, 7, 70, 4, z=3)
    wall_lantern(mp, 78, 1, 1, group=g)
    # ---- Wędzarnia (x 86..99): rows of hanging meat and fish, the smoking fire, firewood, barrels of brine
    g = "Wędzarnia"
    for i, x in enumerate(range(88, 98, 2)): hanging(mp, x, 5, i % 2, group=g + " haki 1")
    for i, x in enumerate(range(88, 98, 2)): hanging(mp, x, 9, (i + 1) % 2, group=g + " haki 2")
    campfire(mp, 92, 13, group=g); campfire(mp, 93, 13, group=g)
    mp.t("D", 11, 5, 91, 13, z=2); mp.t("D", 11, 5, 94, 13, z=2)            # stones round the smoking fire
    firewood(mp, 87, 17, group=g); firewood(mp, 98, 17, group=g)
    mp.piece("D", 14, 0, 1, 2, 88, 16, group=g, kind="beczka z solanką"); mp.piece("D", 14, 0, 1, 2, 97, 16, group=g, kind="beczka z solanką")
    table_h(mp, 90, 16, 5, style=6, group=g + " stół")
    on_table(mp, 91, 16, "D", 0, 8); on_table(mp, 93, 16, "D", 1, 8)
    for y in range(6, 13):                              # salt and brine barrels along both side walls
        c = (15, 3) if y % 2 == 0 else (14, 3)
        mp.piece("D", c[0], c[1], 1, 1, 86, y, group=g + " beczki", kind="beczka"); mp.piece("D", c[0], c[1], 1, 1, 99, y, group=g + " beczki", kind="beczka")
    mp.piece("D", 10, 5, 1, 1, 86, 15, group=g, kind="polana"); mp.piece("D", 10, 5, 1, 1, 99, 15, group=g, kind="polana")
    mp.piece("D", 11, 3, 2, 2, 87, 3, group=g, kind="skrzynie z solą"); mp.piece("D", 11, 3, 2, 2, 97, 3, group=g, kind="skrzynie z solą")

# ============================================================================================ build
def kept_events(mp):
    """events 1..12 of today's Map001 at their new places"""
    sp = L.SPOTS
    for eid, (x, y) in ((1, sp["Borgar"]), (2, sp["Melia"]), (3, sp["Grum"]), (4, sp["Ozzy"]),
                        (5, L.ATMOSPHERE[0]), (6, L.ATMOSPHERE[1]), (7, L.ATMOSPHERE[2]), (8, L.ATMOSPHERE[3]),
                        (9, sp["Luźna cegła"])):
        e = mp.keep(eid, x, y)
        if eid in (1, 2, 3, 4):
            for pg in e["pages"]: pg["moveType"] = 0            # they stay where the room puts them (no wandering off)
            mp.solid.add((x, y))
        if eid == 9:                                            # the action button reaches it from the floor below
            for pg in e["pages"]:
                pg["priorityType"] = 1; pg["through"] = False
    for eid, x in zip((10, 11, 12), L.EXIT_XS):
        mp.keep(eid, x, L.EXIT_Y)
    mp.landing = L.LANDING[:2]
    mp.exit_cells = [(x, L.EXIT_Y) for x in L.EXIT_XS]

def all_events(mp):
    return [e for e in mp.build_events() if e]

def add_blockers(mp):
    """a blocker event only where the design wants a solid cell and neither the new tileset flags nor an event close
    it (greedy rectangles, ChoppableTree's <Occupy> note)"""
    from engine import Engine
    eng = Engine(mp.W, mp.H, mp.resolve(), FLAGS_NEW, all_events(mp))
    open_cells = {c for c in mp.want_solid if eng.tile_open(*c) and c not in eng.block}
    todo = set(open_cells)
    n = 0
    while todo:
        x0, y0 = min(todo, key=lambda c: (c[1], c[0]))
        x1 = x0
        while (x1 + 1, y0) in todo: x1 += 1
        y1 = y0
        while all((x, y1 + 1) in todo for x in range(x0, x1 + 1)): y1 += 1
        mp.blocker(x0, y0, x1, y1, "Blokada")
        todo -= mp.rect(x0, y0, x1, y1)
        n += 1
    return n, sorted(open_cells)

PUBLIC = ("Wielka sala", "Sala biesiadna", "Sala ze sceną", "Pokój gier", "Sala rzutek", "Pokój myśliwski", "Łaźnia",
          "Jadalnia prywatna", "Palarnia i czytelnia", "Sień", "Korytarz", "Kuchnia", "Piekarnia", "Pokój służby",
          "Gabinet Borgara")

def add_fill_lights(mp, reach=0.85):
    """an evening fill light wherever a floor cell of a lived-in room is further than `reach` of a lamp's radius from
    every light (the storerooms, the brewery and the smokehouse stay dim on purpose)"""
    import re
    lights = []
    for (x, y, e) in mp.events:
        m = re.search(r"<Light:(\d+)", e.get("note") or "")
        if m: lights.append((x, y, int(m.group(1)) / 48.0))
    floor = set()
    for n in PUBLIC: floor |= L.room_cells(n)
    def uncovered():
        return {(x, y) for (x, y) in floor if all(((x - lx) ** 2 + (y - ly) ** 2) ** 0.5 > reach * lr for (lx, ly, lr) in lights)}
    todo, added = uncovered(), 0
    r = 300 / 48.0
    while todo and added < 70:
        best = max(sorted(todo), key=lambda c: sum(1 for (x, y) in todo if ((x - c[0]) ** 2 + (y - c[1]) ** 2) ** 0.5 <= reach * r))
        fill_light(mp, *best)
        lights.append((best[0], best[1], r)); added += 1
        todo = uncovered()
    return added

def report(mp):
    from engine import Engine
    eng = Engine(mp.W, mp.H, mp.resolve(), FLAGS_NEW, all_events(mp))
    seen = eng.reach([tuple(L.LANDING[:2])], ignore=[(x, y) for (x, y) in (L.SPOTS[k] for k in ("Borgar", "Melia", "Grum", "Ozzy"))])
    pockets = sorted(c for c in mp.floor_cells if c not in seen and eng.standable(*c))
    walls_open = sorted(c for c in mp.face_cells if eng.tile_open(*c) and c not in eng.block
                        and not any(c[0] in xs for xs in L.STAIRS))
    print("reachable from the entrance: %d cells; floor cells standable but not reachable: %d %s" % (len(seen), len(pockets), pockets[:12]))
    print("wall-face cells the player could enter: %d %s" % (len(walls_open), walls_open[:12]))
    return seen, pockets

def build():
    mp = Parter(links.MAP_NOTE)
    shell(mp)
    kept_events(mp)
    stairs_events(mp)
    vestibule(mp)
    bar(mp)
    wing(mp, False); wing(mp, True)
    banquet(mp); stage_hall(mp)
    hunters(mp); gaming(mp); bathhouse(mp); darts(mp); dining(mp); reading(mp)
    corridor(mp); pantry(mp); kitchen(mp); bakery(mp); service(mp)
    fills = add_fill_lights(mp)
    nb, open_cells = add_blockers(mp)
    print("fill lights %d, blocker events %d (cells the flags leave open: %s)" % (fills, nb, open_cells[:20]))
    mp.report = report(mp)
    return mp

def write_tags():
    """links.json "tags" -> "map001": every gameplay hook event of the staged map (the upper-floors agent keeps its own
    "map025" / "map026" lists; only our key is replaced)"""
    m = load_json(OUT)
    out = []
    for e in m["events"]:
        if not e: continue
        for c in e["pages"][0]["list"]:
            if c["code"] == 108 and str(c["parameters"][0]).startswith("<Tavern:"):
                text = c["parameters"][0]
                kind = text[len("<Tavern:"):].rstrip(">").split()[0].split(":")[0]
                out.append({"kind": kind, "event": e["id"], "x": e["x"], "y": e["y"], "tag": text, "name": e["name"]})
                break
    out.sort(key=lambda d: (d["kind"], d["event"]))
    tags = links.read().get("tags") or {}
    if not isinstance(tags, dict): tags = {}
    tags["map001"] = out
    links.merge(tags=tags)
    return out

if __name__ == "__main__":
    mp = build()
    n = mp.write_to(OUT)
    hooks = write_tags()
    print("links.json tags.map001: %d hook events (%s)" % (len(hooks), ", ".join(sorted({h["kind"] for h in hooks}))))
    meta = {"W": mp.W, "H": mp.H, "zones": mp.zones, "things": mp.things, "hooks": mp.hooks, "wall_items": mp.wall_items,
            "want_solid": sorted(mp.want_solid), "landing": list(mp.landing), "events": n}
    with open(META, "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False).encode("utf-8"))
    print("wrote", OUT, "events", n)
