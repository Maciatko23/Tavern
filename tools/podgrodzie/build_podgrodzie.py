# python tools/podgrodzie/build_podgrodzie.py  -> tools/podgrodzie/staging/Map111.json (+ Map111_meta.json)
# Podgrodzie (Map111, 46x36, tileset 11): the poor quarter outside the town's west wall (user 2026-10-05). Composed cell by
# cell in the tileset author's manner (plib.py header, tools/town/RECIPES.md):
#   - the east edge is the town's west wall seen from outside: Map008's wall strip (x 0-1, rows 33-59) copied onto x 44-45,
#     rows 0-26, with the west gate opened on rows 17-18 (Map008's 50-51) - walking out of the town lands in the same gap here
#   - a muddy lane from the gate to a small square (plac) with the dry well, lanes off it to the houses, a trail into the forest
#   - ten wooden houses (log cabins, thatched and plank huts), six with an interior (maps 112-117, build_wnetrza.py):
#       praczka "Chata praczki", drwal "Chata drwala", klusownik "Chata kłusownika", znachorka "Izba znachorki",
#       szmaciarz "Kram starzyzny", uchodzcy "Dom uchodźców"
#   - the refugees' corner by the wall (tents, a lean-to, the campfire), the beggar's lean-to by the gate, dry vegetable plots,
#     the washerwoman's lines, the woodcutter's block and stacks, the junk stall, a roadside shrine, a hay cart, junk in heaps
#   - no water of its own (the user 2026-10-05: water is in the town and the tavern; the drought is the player's own early
#     land): the district's well is dry (!Town_Props well_dry), people carry water from the town - no water tiles, no tubs of it
#   - TownLife's spots "Miejsce: <key>" (docs/podgrodzie/MIEJSCA.md), night lights that are flames only
# Never writes data/ (install.py does, with the editor closed).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plib import *   # noqa: F401,F403

def load_town():
    with open(ROOT + "data/Map008.json", "rb") as f:
        return json.loads(f.read().decode("utf-8"))

# ================================================================================================ the ground
def lane(mp, pts, width, kind=DIRT, z=0, wobble=0.35, seed=5):
    """a lane along the polyline pts (cell centres), width cells wide, its edges wobbling a little"""
    cells = set()
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = int(max(abs(bx - ax), abs(by - ay)) * 3) + 1
        for i in range(n + 1):
            t = i / n
            cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
            r = width / 2.0 + wobble * (noise(int(cx * 2), int(cy * 2), seed) - 0.5) * 2
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                for x in range(int(cx - r - 1), int(cx + r + 2)):
                    if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r and mp.inside(x, y): cells.add((x, y))
    mp.kind(z, cells, kind)
    return cells

def blob_cells(mp, cx, cy, rx, ry, seed, rough=0.3):
    out = set()
    for y in range(int(cy - ry - 2), int(cy + ry + 3)):
        for x in range(int(cx - rx - 2), int(cx + rx + 3)):
            if not mp.inside(x, y): continue
            v = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if v <= 1 + rough * (noise(x, y, seed) - 0.5) * 2: out.add((x, y))
    return out

def ground(mp):
    mp.kind(0, mp.all, GRASS)
    # lighter grass in a few soft patches (the author's k27)
    for (x, y) in mp.all:
        if lowfreq(x, y, 31, 4.0) > 0.70: mp.layers[0][(x, y)] = ("k", GRASS_LIGHT)
    # ---- the lanes and the square (trodden earth)
    roads = set()
    roads |= lane(mp, [(43.5, 17.5), (40, 17.6), (36, 17.0), (32, 17.4), (29, 17.2)], 2.8, seed=11)       # gate -> square
    roads |= blob_cells(mp, 23.5, 17.6, 6.0, 3.9, 17, 0.25)                                              # the square
    roads |= lane(mp, [(18.5, 18.6), (14, 19.3), (9, 19.6), (4, 19.6), (-0.5, 19.4)], 2.1, seed=12)      # west, to the forest
    roads |= lane(mp, [(19.5, 14.5), (16.5, 11.4), (12, 10.6), (7.5, 10.0)], 2.0, seed=13)              # north-west
    roads |= lane(mp, [(34.6, 15.5), (33.4, 12), (32.5, 9.6)], 1.9, seed=14)                            # to the refugees' house
    roads |= lane(mp, [(22.5, 20.5), (21.8, 24), (19.5, 27.6), (15, 27.7), (9, 28.3), (4.5, 28.6)], 1.9, seed=15)   # south
    roads |= lane(mp, [(37, 19.5), (37.0, 23), (36.4, 27.4), (32, 27.9)], 1.8, seed=16)                 # the washerwoman's yard
    roads |= blob_cells(mp, 39.8, 8.4, 3.2, 3.0, 18, 0.3)                                                # the refugees' camp
    roads |= blob_cells(mp, 8.6, 10.8, 3.0, 1.5, 19, 0.3)                                                # the woodcutter's yard
    roads |= blob_cells(mp, 33.6, 29.4, 4.2, 1.4, 20, 0.3)                                               # the laundry yard
    roads |= blob_cells(mp, 26.0, 24.3, 1.6, 1.1, 21, 0.2)                                               # by the shrine
    mp.kind(0, roads, DIRT)
    mp.roads = roads
    # ---- overlays: dried mud and pebbles on the lanes; small dry patches (drought), tufts and soft green on the grass
    for (x, y) in mp.all:
        if (x, y) in roads:
            v = noise(x, y, 41)
            if v < 0.06: mp.layers[1][(x, y)] = ("k", MUD)
            elif v > 0.96: mp.layers[1][(x, y)] = ("k", PEBBLES)
            continue
        near_road = any((x + dx, y + dy) in roads for dx in (-1, 0, 1) for dy in (-1, 0, 1))
        if (near_road and noise(x, y, 43) < 0.16) or lowfreq(x, y, 77, 2.0) > 0.80: mp.layers[1][(x, y)] = ("k", DRY)
        elif lowfreq(x, y, 91, 2.5) > 0.70: mp.layers[1][(x, y)] = ("k", TUFTS)
        elif lowfreq(x, y, 97, 3.0) > 0.72: mp.layers[1][(x, y)] = ("k", SOFT)

# ================================================================================================ the town wall (east edge)
def town_wall(mp):
    """Map008's west wall strip (x 0-1, rows 33..59) on x 44-45, rows 0..26: floor / wall kinds re-shaped here (the editor's
    shapes follow the neighbours), pictures as they are, the regions copied; the gate's two rows opened (cobble)"""
    t = load_town()
    TW, TH, td = t["width"], t["height"], t["data"]
    at = lambda x, y, z: td[(z * TH + y) * TW + x]
    for r in range(0, 27):
        ty = r + TOWN_ROW_OFF
        for i in range(2):
            x = 44 + i
            for z in range(4):
                v = at(i, ty, z)
                if not v: mp.layers[z].pop((x, r), None); continue
                mp.layers[z][(x, r)] = ("k", (v - 2048) // 48) if v >= 2048 else ("t", v)
            mp.region[(x, r)] = 2                  # (the wall and its towers: level with the hero)
    for r in GATE_ROWS:
        for x in (44, 45):
            for z in (1, 2, 3): mp.layers[z].pop((x, r), None)
            mp.layers[0][(x, r)] = ("k", COBBLE)
            mp.region.pop((x, r), None)
    # the foot of the wall on this side: mossy stones and tufts
    for r in range(0, 27):
        if r in GATE_ROWS or (43, r) in mp.roads: continue
        if noise(43, r, 3) < 0.7: mp.layers[1][(43, r)] = ("k", STONES if noise(43, r, 4) < 0.45 else TUFTS)

# ================================================================================================ the buildings
def houses(mp):
    H_ = {}
    # ---- north row (fronts on the north-west lane / the square / the refugees' path)
    H_["drwal"] = mp.house("drwal", "Chata drwala", 4, 3, 6, 4, 2, "shingle", "grey_logs", door=3,
                           door_pic=("!Fantasy_door1", 2), windows=[(1, "wood"), (5, "wood")], chimney=1, chimney_style=4,
                           dormer=(4, 0), ivy=(0,), lean="right", lean_fill="logs", interior="drwal")
    H_["strzecha"] = mp.house("strzecha", "Chata pod strzechą", 13, 4, 6, 4, 2, "straw", "planks", door=2,
                              door_pic=("!Fantasy_door1", 6), windows=[(0, "board"), (4, "shut")], chimney=4, chimney_style=3,
                              smoke=False, closed_text="Zamknięte. Nikogo nie ma w domu.")
    H_["szmaciarz"] = mp.house("szmaciarz", "Kram starzyzny", 20, 8, 5, 4, 2, "shingle_dark", "planks", door=1,
                               door_pic=("!Fantasy_door1", 2), windows=[(3, "wood")], chimney=3, chimney_style=5, ivy=(4,),
                               interior="szmaciarz")
    H_["uchodzcy"] = mp.house("uchodzcy", "Dom uchodźców", 29, 3, 7, 4, 2, "shingle_brown", "boards", door=3,
                              door_pic=("!Fantasy_door1", 6), windows=[(1, "board"), (5, "shut")], chimney=0, chimney_style=5,
                              lean="left", interior="uchodzcy", hours=None)
    # ---- the square's west side
    H_["deski"] = mp.house("deski", "Chałupa z desek", 11, 13, 5, 3, 2, "thatch", "boards", door=2,
                           door_pic=("!Fantasy_door1", 0), windows=[(0, "tiny"), (4, "board")], closed_text="Zamknięte na skobel.")
    # ---- south row (their fronts on the south lane)
    H_["klusownik"] = mp.house("klusownik", "Chata kłusownika", 2, 22, 5, 4, 2, "shingle_dark", "grey_logs", door=2,
                               door_pic=("!Fantasy_door1", 6), windows=[(4, "board")], chimney=0, chimney_style=4, ivy=(0, 3),
                               interior="klusownik")
    H_["szopa"] = mp.house("szopa", "Szopa", 8, 23, 3, 3, 2, "thatch", "boards", door=1, door_pic=("!Fantasy_door1", 2),
                           lean="right", lean_fill="hay", closed_text="Szopa zamknięta. Pachnie sianem.")
    H_["znachorka"] = mp.house("znachorka", "Izba znachorki", 13, 21, 5, 4, 2, "straw", "logs", door=2,
                               door_pic=("!Fantasy_door1", 2), windows=[(0, "wood"), (4, "wood_lit")], chimney=3, chimney_style=3,
                               ivy=(1,), interior="znachorka")
    H_["praczka"] = mp.house("praczka", "Chata praczki", 31, 21, 5, 4, 2, "thatch", "logs", door=2,
                             door_pic=("!Fantasy_door1", 2), windows=[(0, "wood"), (3, "shut_lit")], chimney=1, chimney_style=4,
                             interior="praczka")
    H_["komorka"] = mp.house("komorka", "Komórka", 38, 21, 4, 3, 2, "shingle_brown", "boards_stone", door=1,
                             door_pic=("!Fantasy_door1", 0), windows=[(3, "tiny")], closed_text="Zamknięte. Za drzwiami coś skrobie.")
    return H_

# ================================================================================================ things
def laundry(mp, x0, y_top, items):
    """a washing line of the C sheet: the left pole C(8,13..15) on x0, the clothes hanging from the rope on row y_top, the right
    pole C(15,13..15) after them; the poles stand on row y_top + 2. RegionLayers: the rope's row and the poles' upper rows over
    the hero (one walks under the line), the poles' feet closed by the author's flags"""
    for j in range(3): mp.tl(x0, y_top + j, C(8, 13 + j))
    for i, (c, r) in enumerate(items):
        mp.tl(x0 + 1 + i, y_top, C(c, r))
    xr = x0 + 1 + len(items)
    for j in range(3): mp.tl(xr, y_top + j, C(15, 13 + j))
    for x in range(x0, xr + 1):
        mp.region[(x, y_top)] = 3
    mp.region[(x0, y_top + 1)] = 3; mp.region[(xr, y_top + 1)] = 3
    return xr

def dead_tree(mp, tx, ty):
    """the E sheet's dead tree (E 1..3, 3..8) with its trunk's foot on (tx, ty): branches over the hero, the trunk closed"""
    for r in range(3, 9):
        for c in range(1, 4):
            if (c, r) in ((1, 8), (3, 8)): continue
            mp.tl(tx - 2 + c, ty - 8 + r, E(c, r), 3)

def lean_to(mp, x, yb):
    """a free-standing lean-to B(10..11, 9..12), 2 wide, its posts on row yb: the hero walks under its roof"""
    for j in range(4):
        mp.tl(x, yb - 3 + j, B(10, 9 + j), 3); mp.tl(x + 1, yb - 3 + j, B(11, 9 + j), 3)
    for j in range(3):
        mp.shadow[(x, yb - 2 + j)] = 15; mp.shadow[(x + 1, yb - 2 + j)] = 15

def garden(mp, x0, y0, x1, y1, gate=(), rows=(), sprouts=()):
    """a dry vegetable plot: trodden earth inside a wooden fence (A2 k22 on layer 1, a gap for the gate), furrows of the D sheet
    (D 8..10, 9) and a few withered sprouts"""
    inner = mp.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1)
    mp.kind(0, inner, DIRT)
    for c in inner: mp.layers[1].pop(c, None)
    ring = mp.rect(x0, y0, x1, y1) - inner - set(gate)
    mp.kind(1, ring, FENCE)
    for (fx, fy, n) in rows:
        for i in range(n): mp.tl(fx + i, fy, D(8 + (i % 3), 9), 2)
    for (nm, sx, sy) in sprouts:
        mp.thing(nm, sx, sy)

def wall_shelter(mp, yb):
    """a half lean-to against the town wall: B(10, 9..12) on x 43, its roof sloping away from the wall, the posts on row yb;
    the hero walks under it (star tiles), the cell shaded"""
    for j in range(4):
        mp.tl(43, yb - 3 + j, B(10, 9 + j), 3)
    for j in range(3):
        mp.shadow[(43, yb - 2 + j)] = 15

def things(mp):
    T_ = mp.thing
    # ---- the gate, outside: a lantern on a post, a torch on the north tower, the signpost, the beggar's shelter by the wall
    T_("lantern_post", 42, 20)
    mp.light(42, 19, "!Decoration", 7, 2, 0, "Latarnia przy bramie", "<Light:150,90,62,24><LightWhen:night>", priority=2, through=True)
    mp.light(44, 15, "!Decoration", 3, 4, 0, "Pochodnia na baszcie", "<Light:140,110,60,20><LightWhen:night><LightFlicker:0.15>",
             priority=2, through=True, step=True)
    T_("signpost", 40, 15)
    wall_shelter(mp, 14)
    mp.town_prop("bedroll", 42, 14, label="Posłanie żebraka")
    T_("sack_torn", 41, 13); T_("jug", 43, 11)
    # ---- the refugees' corner by the wall: the big tent of hides, a small tent, a shelter, the campfire, bedrolls, bundles
    mp.town_prop("tent_hide", 39, 5, label="Namiot uchodźców")
    mp.town_prop("tent_small", 41, 9, label="Namiot")
    wall_shelter(mp, 7)
    mp.town_prop("bedroll", 42, 7, label="Posłanie")
    mp.town_prop("bedroll", 36, 10, label="Posłanie")
    mp.light(39, 9, "!Decoration", 2, 4, 0, "Ognisko uchodźców", "<Light:200,120,60,16><LightFlicker:0.15>", priority=1, step=True)
    T_("log_bench", 38, 11)
    mp.clump("stumps", 41, 11)
    T_("sacks", 37, 8); T_("sack", 38, 7); T_("pots", 41, 7); T_("sacks_b", 43, 4)
    T_("crate_open", 36, 7); T_("barrel", 37, 5); T_("basket_grain", 42, 3)
    # ---- the refugees' house: bundles and a crate by the door, a bedroll under its lean-to, a cart with sacks
    T_("sacks", 30, 9); T_("crate_b", 34, 9); T_("basket_grain", 35, 9)
    mp.town_prop("bedroll", 27, 8, label="Posłanie pod daszkiem")
    T_("cart_sacks", 26, 10)
    # ---- the woodcutter: the long woodshed by his west wall, the firewood stack, the chopping block with the axe, logs
    T_("woodshed", 1, 8)
    T_("firewood", 2, 12)
    T_("chopping_block", 11, 11)
    T_("log_bench", 12, 12)
    T_("logs_small", 13, 11); T_("sticks", 3, 9); T_("sticks_b", 5, 12)
    # ---- the thatched house (closed): a barrel and a crate at its wall, its dry plot on the east with a scarecrow
    T_("barrel", 12, 9); T_("jug", 13, 10); T_("basket_apples", 19, 9)
    garden(mp, 20, 2, 27, 6, gate=[(23, 6)], rows=[(21, 3, 6), (24, 5, 3)], sprouts=[("sprout_a", 21, 5), ("sprout_d", 22, 5)])
    T_("scarecrow", 26, 4)
    # ---- the junk dealer: a table under the canvas awning, his goods in front, heaps of junk round the shack
    for j in range(4):
        mp.tl(25, 11 + j, E(4, 5 + j), 3); mp.tl(26, 11 + j, E(5, 5 + j), 3)
    T_("table", 25, 13)
    mp.region[(25, 14)] = 2                 # (the awning's left pole foot lies over the pots and would open their cell)
    T_("pots", 25, 14); T_("basket_jugs", 26, 14)
    T_("wheel", 27, 13); T_("crate_jug", 28, 12); T_("small_crate", 28, 13)
    T_("crates_cloth", 18, 13)
    T_("sack", 19, 14)
    # ---- the square: the dry well, a bench and a log to sit on, the notice board, a stump
    mp.town_prop("well_dry", 23, 17, label="Sucha studnia", cmds=text_cmds("Sucha studnia. Na dnie tylko kamienie i kurz.",
                 "Studnia wyschła. Wodę nosi się z miasta, zza bramy."))
    T_("bench", 19, 21)
    T_("log_bench", 27, 20)
    T_("notice", 29, 15)
    mp.clump("stump", 28, 18)
    # ---- the plank house (closed): a cart at the square, sacks, its dry potato field on the west
    T_("cart", 16, 17)
    T_("sacks", 10, 17)
    garden(mp, 2, 13, 9, 17, gate=[(6, 17)], rows=[(3, 14, 6), (3, 16, 3)], sprouts=[("sprout_b", 7, 16), ("sprout_e", 8, 16)])
    # ---- the roadside shrine: a wooden cross with flowers at its foot, the dead tree behind it
    for c in ((25, 22), (26, 22), (27, 22), (25, 23), (27, 23), (25, 24), (26, 24), (27, 24), (26, 23)):
        mp.layers[0][c] = ("k", DIRT); mp.layers[1].pop(c, None)
    T_("cross_flowers", 26, 23)
    mp.clump("white_fl", 25, 23); mp.clump("white_fl_b", 27, 23); mp.clump("stones", 25, 22)
    dead_tree(mp, 29, 23)
    T_("log_bench", 24, 25)
    # ---- the healer: her herb plot (dry), a drying frame, baskets
    garden(mp, 18, 23, 22, 26, gate=[(20, 26)], rows=[(19, 24, 3)], sprouts=[("sprout_c", 19, 25), ("sprout_f", 21, 25)])
    T_("hide_rack_b", 12, 26)
    T_("basket_grain", 18, 27); T_("basket_apples", 17, 27)
    # ---- the poacher: hides on a frame, a crate of snares
    T_("hide_rack", 7, 27); T_("crate_sack", 1, 28)
    # ---- the shed: the hay cart by the west lane
    T_("cart_hay", 9, 21)
    # ---- the washerwoman: two washing lines in her yard, sacks and baskets by her wall
    laundry(mp, 29, 28, [(9, 13), (10, 13), (11, 13), (12, 13)])
    laundry(mp, 35, 28, [(13, 13), (14, 13), (12, 13)])
    T_("sacks_b", 30, 26); T_("basket_jugs", 36, 26); T_("basket_grain", 30, 27)
    # ---- the shack by the corner tower: a barrel, firewood
    T_("barrel", 42, 25); T_("logs_small", 43, 24)
    # ---- by the gate, outside: a cart with barrels waiting for the gate, a heap of old boards
    T_("cart_barrels", 37, 15)

# ================================================================================================ trees, the forest round the map
def forest(mp):
    band = set()
    for (x, y) in mp.all:
        t = 1.2 + 1.4 * lowfreq(x, y, 61, 3.0)
        edge = x < t or (y < t and x < 44) or y > H - 2 - t or (x >= 40 and y >= 27 + (2 if x < 42 else 0))
        if edge and (x, y) not in mp.roads and not mp.is_building(x, y): band.add((x, y))
    band -= {(0, 19), (1, 19), (2, 19), (1, 20), (2, 20)}               # the trail into the forest (skraj_lasu on its end)
    band |= {(0, 18), (0, 20)}
    band -= {(x, y) for x in (44, 45) for y in range(0, 27)}           # the wall
    band |= {(x, y) for x in (2, 3) for y in range(2, 7)}               # the forest up to the woodcutter's back wall
    mp.kind(1, band, HEDGE)
    mp.band = band
    trees = [
        # north edge (trunks on rows 0-1, never under a chimney)
        (1, 1, "pine"), (3, 0, "leafy"), (10, 1, "pine_b"), (12, 0, "leafy"), (19, 0, "pine"), (25, 1, "leafy"), (28, 0, "pine_b"),
        (36, 1, "leafy"), (39, 0, "pine"), (42, 0, "pine_b"),
        # west edge
        (0, 4, "pine"), (0, 8, "pine_b"), (0, 12, "pine"), (0, 16, "pine_b"), (0, 22, "pine"), (0, 26, "leafy"), (0, 30, "pine"), (1, 34, "leafy"),
        # south edge, in two uneven rows
        (4, 35, "leafy"), (7, 34, "pine"), (10, 35, "pine_b"), (13, 34, "leafy"), (17, 35, "pine"), (19, 33, "bush"), (22, 35, "pine_b"),
        (25, 34, "leafy"), (28, 35, "pine"), (31, 34, "bush"), (34, 35, "pine_b"), (37, 34, "leafy"),
        # the south-east corner below the corner tower
        (42, 30, "pine"), (44, 32, "pine_b"), (40, 33, "bush"), (42, 35, "leafy"), (45, 35, "pine"),
        # inside
        (17, 2, "bush"), (31, 14, "leafy"),
    ]
    for (x, y, k) in trees:
        mp.tree(x, y, k)
    # dry shrubs (the B sheet's dead vine B 7,11..12) and dead birch trunks (D 4,13..14): drawn tiles, not ChoppableTree's
    # "!$Bush_..." pictures (every one of those is a bush to cut down - these are someone's yard)
    for (x, y) in [(16, 16), (9, 31), (29, 32), (21, 31), (33, 13), (5, 30), (40, 31)]:
        if mp.zfree(x, y - 1) and mp.zfree(x, y) and (x, y) not in mp.taken:
            mp.tl(x, y - 1, B(7, 11), 3); mp.tl(x, y, B(7, 12))
    for (x, y) in [(27, 30), (3, 32), (42, 27)]:
        if mp.zfree(x, y - 1) and mp.zfree(x, y) and (x, y) not in mp.taken:
            mp.tl(x, y - 1, D(4, 13), 3); mp.tl(x, y, D(4, 14))
    # small things of the D sheet at the walls, fences and in the grass (ferns, weeds, stones, mushrooms in the shade)
    for (x, y, k) in [(3, 7, "fern"), (10, 4, "weed"), (12, 7, "fern_b"), (19, 6, "white_fl"), (28, 7, "fern_c"), (36, 4, "weed"),
                      (17, 12, "fern"), (10, 15, "stones"), (16, 16, "weed"), (1, 21, "fern_b"), (7, 25, "fern"), (11, 26, "weed"),
                      (17, 23, "fern_c"), (23, 23, "stones"), (30, 24, "fern"), (37, 22, "weed"), (42, 22, "fern_b"), (20, 31, "mush_row"),
                      (26, 31, "fern"), (33, 32, "white_fl"), (8, 32, "mush"), (13, 31, "stones"), (35, 20, "stones"), (29, 13, "weed")]:
        if (x, y) not in mp.taken and (x, y) not in mp.layers[2] and (x, y) not in mp.layers[3] and not mp.is_building(x, y):
            mp.clump(k, x, y)

# ================================================================================================ the exits, the spots, the texts
def exits(mp):
    for r in GATE_ROWS:
        mp.transfer(45, r, TOWN, 1, r + TOWN_ROW_OFF, 6, "Przejście -> Okolice Tawerny (brama zachodnia)")

SPOTS = {   # key: (x, y, the way the resident faces)
    "brama_zach": (41, 18, 6), "zebrak": (43, 16, 2), "zebrak_noc": (43, 14, 2), "namioty": (38, 9, 6),
    "uchodzcy_drzwi": (32, 9, 8), "kram": (26, 15, 2), "szmaciarz_drzwi": (21, 14, 8), "plac": (26, 18, 4),
    "studnia_sucha": (23, 18, 8), "zabawa": (20, 18, 2), "drwal_drzwi": (7, 9, 8), "drewutnia": (10, 11, 6),
    "skraj_lasu": (0, 19, 4), "klusownik_drzwi": (4, 28, 8), "znachorka_drzwi": (15, 27, 8), "ziola": (20, 27, 8),
    "kapliczka": (26, 24, 8), "praczka_drzwi": (33, 27, 8), "pranie": (32, 30, 8),
}

def skirts(mp):
    """tufts of tall grass round the houses' sides and backs (the author's k21 / k31 along walls), never on a lane"""
    for b in mp.buildings:
        x0, y0, x1, y1 = b["rect"]
        ring = mp.rect(x0 - 1, y0 - 1, x1 + 1, y1) - mp.rect(x0, y0, x1, y1)
        for c in sorted(ring):
            if c in mp.roads or mp.is_building(*c) or c in mp.layers[1] or c in mp.layers[2] or c in mp.layers[3]: continue
            v = noise(c[0], c[1], 121)
            if v < 0.55: mp.layers[1][c] = ("k", TUFTS if v < 0.35 else SOFT)

def spots(mp):
    for k, (x, y, d) in SPOTS.items():
        mp.spot(k, x, y, d)

def texts(mp):
    """what the signpost, the notice board, the dry well and the roadside cross say (action button; the drawn tiles close the
    cells, the events are only the words - same as characters, no picture)"""
    def say(x, y, name, *lines):
        mp.ev(x, y, event(name, x, y, None, priority=1, cmds=text_cmds(*lines)))
    say(40, 15, "Drogowskaz: Podgrodzie", "Drogowskaz. PODGRODZIE.", "Na wschód: brama zachodnia i miasto.", "Na zachód: ścieżka do lasu.")
    say(29, 15, "Obwieszczenie sołtysa", "Obwieszczenie sołtysa: woziwoda rozwozi wodę",
        "tylko w obrębie murów. Kto z Podgrodzia, niech nosi sam z miasta.", "Ktoś dopisał węglem: \"A my to nie ludzie?\"")
    say(26, 23, "Kapliczka: przydrożny krzyż", "Przydrożny krzyż. U stóp ktoś zostawił polne kwiaty.",
        "W drewnie wyryto: \"Daj deszczu\".")

# ================================================================================================ main
def build():
    mp = Pod()
    ground(mp)
    town_wall(mp)
    H_ = houses(mp)
    things(mp)
    skirts(mp)
    forest(mp)
    exits(mp)
    texts(mp)
    spots(mp)
    return mp, H_

def main():
    mp, H_ = build()
    path, data, events, meta = mp.write_staged()
    print("Map111 Podgrodzie: %dx%d, %d events -> %s" % (W, H, len(events) - 1, os.path.relpath(path, ROOT)))

if __name__ == "__main__":
    main()
