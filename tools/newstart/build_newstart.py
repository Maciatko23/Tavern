# The new start of the game, generated: grandpa's cottage (inside and its yard), three road maps to grandpa's old field
# (Map003) with a side lane to the tavern's surroundings (Map008), and the Lord's estate beside the tavern.
#   python build_newstart.py            - all maps
#   python build_newstart.py 20 24      - only these
# Writes data/Map019..Map024.json (new files the editor does not list until MapInfos has them; the apply script adds them).
# Nature on the road maps is ONLY Map003's own event kinds (the user's rule for outdoor maps: pines, small trees, stumps,
# logs, dead trunks, leafless thickets, stones - copied with their pages and notes, so they chop/mine like there) and Map003's
# ground kinds. No water anywhere (the drought is part of the game).
import sys
from nslib import *
from layout import MAPS, DOORS, transfers

def links_for(mp, names):
    """the transfers that start on this map (doors get a sound)"""
    for fm, x, y, tm, tx, ty, d, kind in transfers():
        if fm != mp.id: continue
        to = names.get(tm, "Map%03d" % tm)
        if kind == "door":
            mp.transfer(x, y, tm, tx, ty, d, name="Drzwi -> " + to, se="Door1")
        else:
            mp.transfer(x, y, tm, tx, ty, d, name="Przejście -> " + to)
        mp.keep_free.add((x, y))
NAMES = {k: v["name"] for k, v in MAPS.items()}
NAMES.update({3: "Domek - Zewnętrze", 8: "Okolice Tawerny"})

def new_map(map_id, note, seed, bgm="Field1"):
    w, h = MAPS[map_id]["size"]
    return NewMap(map_id, w, h, MAPS[map_id]["tileset"], MAPS[map_id]["display"], note, seed, bgm=bgm)

def edge_keep(mp, r=2):
    """keep the tiles around every exit free (no tree right where the player comes in)"""
    for fm, x, y, tm, tx, ty, d, kind in transfers():
        if fm != mp.id: continue
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if mp.inside(x + dx, y + dy): mp.keep_free.add((x + dx, y + dy))

def paint_region(mp, cells, rid=7):
    for c in cells:
        if mp.inside(*c): mp.region[c] = rid

def house(mp, x0, y0, w, roof_h, wall_h, roof, wall):
    mp.kind(0, mp.rect(x0, y0, x0 + w - 1, y0 + roof_h - 1), roof)
    mp.kind(0, mp.rect(x0, y0 + roof_h, x0 + w - 1, y0 + roof_h + wall_h - 1), wall)
    for c in mp.rect(x0, y0, x0 + w - 1, y0 + roof_h + wall_h - 1):
        mp.layers[1].pop(c, None)

def fence_line(mp, x0, y0, x1, y1, kind, name="Płot"):
    mp.kind(1, mp.rect(x0, y0, x1, y1), kind)
    mp.blocker(x0, y0, x1, y1, name)
    mp.keep_free |= mp.rect(x0, y0, x1, y1)

# ====================================================================================== 19: grandpa's cottage, inside
T8_BORDER, T8_WALL, T8_FLOOR, T8_DOORMAT = 24, 59, 83, 7758          # the same pieces as "Domek - Wnętrze" (Map002)
OKNO = "<LightCone:length=110,angle=30,dir=90,width=20,anchor=top,offsety=-15,blur=5,dust=14,dustsize=1,r=255,g=220,b=180>"

def design_19():
    mp = new_map(19, "<Dust:off>\n<Dark:on>\n<DayNight:on>\n<Zoom:1.5>", 1919, bgm="Town1")
    W, H = mp.W, mp.H
    mp.kind(0, mp.all, T8_BORDER)
    mp.kind(0, mp.rect(1, 1, W - 2, 2), T8_WALL)                     # log walls
    mp.kind(0, mp.rect(1, 3, W - 2, H - 2), T8_FLOOR)                # dark planks
    mp.tile(0, 5, 8, T8_DOORMAT)                                     # the way out (like Map002's door)
    # windows (lit through the day by RoomLighting cones, the same note as Map002's windows)
    mp.tile(2, 3, 1, B(3, 2)); mp.tile(2, 3, 2, B(3, 3))             # shutters
    mp.tile(2, 7, 1, B(1, 2)); mp.tile(2, 7, 2, B(1, 3))             # small lit window
    mp.light(3, 2, OKNO, "okno"); mp.light(7, 2, OKNO, "okno")
    mp.tile(3, 1, 1, D(15, 7))                                       # a cobweb in the corner
    mp.tile(3, 9, 1, D(15, 7))
    # grandpa's bed (patched blanket), headboard against the wall, and a small table by it
    mp.tile(2, 1, 2, C(15, 10)); mp.tile(2, 1, 3, C(15, 11)); mp.tile(2, 1, 4, C(15, 12))
    mp.blocker(1, 3, 1, 4, "Łóżko dziadka")
    mp.tile(2, 2, 2, C(5, 0)); mp.tile(2, 2, 3, C(5, 1))
    mp.blocker(2, 3, 2, 3, "Stolik")
    # kitchen corner: a counter with pots, a tall shelf with food
    mp.tile(2, 4, 2, C(6, 2)); mp.tile(2, 5, 2, C(7, 2)); mp.tile(2, 4, 3, C(6, 3)); mp.tile(2, 5, 3, C(7, 3))
    mp.tile(2, 6, 1, C(7, 6)); mp.tile(2, 6, 2, C(7, 7)); mp.tile(2, 6, 3, C(7, 8))
    mp.blocker(4, 3, 6, 3, "Kredens i półka")
    # the hearth (animated fire), firewood beside it, grandpa's chair
    mp.picture(8, 3, "!$Fireplace_kitchen", 0, 2, 0, name="Palenisko", priority=1, step=True, note="")
    mp.light(8, 3, "<Light:260,255,170,90>", "ogien")
    mp.tile(2, 9, 3, D(10, 5))
    mp.blocker(9, 3, 9, 3, "Drewno na opał")
    mp.tile(2, 7, 3, C(2, 14)); mp.tile(2, 7, 4, C(2, 15))
    mp.blocker(7, 4, 7, 4, "Fotel dziadka")
    mp.blocker(7, 3, 7, 3, "Fotel dziadka")
    # a hide on the floor in front of the fire
    for dx in range(2):
        for dy in range(2): mp.tile(2, 7 + dx, 5 + dy, D(9 + dx, 12 + dy))
    # the table with two stools
    for dx in range(2):
        for dy in range(2): mp.tile(2, 3 + dx, 5 + dy, C(12 + dx, 4 + dy))
    mp.blocker(3, 5, 4, 6, "Stół")
    mp.tile(2, 2, 6, C(14, 0)); mp.tile(2, 5, 6, C(14, 0))
    mp.blocker(2, 6, 2, 6, "Taboret"); mp.blocker(5, 6, 5, 6, "Taboret")
    # the hero's straw bed: sleeping works like the bed in Map002 (the same event pages)
    mp.tile(2, 9, 6, C(10, 13)); mp.tile(2, 9, 7, C(10, 14))
    bed = next(e for e in json.load(open(ROOT + "data/Map002.json", encoding="utf-8"))["events"] if e and "Łóżko" in e["name"] and e["pages"][0]["trigger"] == 0)
    for y in (6, 7):
        e = copy.deepcopy(bed); e["name"] = "Posłanie (sen)"; e["note"] = ""
        mp.add(9, y, e)
    # stores by the door: a barrel, sacks, a basket
    mp.tile(2, 1, 7, D(14, 0)); mp.tile(2, 1, 8, D(8, 3)); mp.tile(2, 2, 8, D(9, 3)); mp.tile(2, 9, 8, D(14, 2))
    mp.blocker(1, 7, 1, 8, "Beczka i worki"); mp.blocker(2, 8, 2, 8, "Worek"); mp.blocker(9, 8, 9, 8, "Kosz")
    links_for(mp, NAMES)
    return mp

# ====================================================================================== 20: grandpa's yard
def design_20():
    mp = new_map(20, "<Clouds:on>\n<Farm:off>", 2020)
    W, H = mp.W, mp.H
    edge_keep(mp)
    door = (15, 7)
    # the path: from the door down through the gate in the fence to the road at the bottom
    walk = path(mp, [(15, 8), (15, 11)], 1.2) | path(mp, [(15, 11.5), (15, 16), (15.3, 19), (15, 22)], 2.4)
    mp.keep_free |= walk
    # the cottage: dark thatch on log walls, two small windows, the door in the middle
    house(mp, 12, 3, 7, 3, 2, 59, 72)
    mp.tile(2, 13, 6, B(1, 0)); mp.tile(2, 17, 6, B(1, 0))
    mp.blocker(12, 3, 18, 6, "Chata dziadka")
    mp.blocker(12, 7, 14, 7, "Chata dziadka"); mp.blocker(16, 7, 18, 7, "Chata dziadka")
    mp.keep_free |= mp.rect(11, 2, 19, 8)
    dx, dy = door
    for fm, x, y, tm, tx, ty, d, kind in transfers():
        if fm == 20 and kind == "door":
            e = mp.transfer(x, y, tm, tx, ty, d, name="Drzwi chaty -> " + NAMES[tm], se="Door1")
            e["pages"][0]["image"].update({"characterName": "!Fantasy_door1", "characterIndex": 0, "direction": 2, "pattern": 0})
            e["pages"][0]["directionFix"] = True
    # the fence round the homestead, the gate open at the bottom
    fence_line(mp, 8, 2, 22, 2, 22)
    fence_line(mp, 8, 3, 8, 16, 22)
    fence_line(mp, 22, 3, 22, 16, 22)
    fence_line(mp, 9, 16, 13, 16, 22)
    fence_line(mp, 17, 16, 21, 16, 22)
    yard = mp.rect(9, 3, 21, 15)
    # firewood stacked by the west wall (Map003's logs) and grandpa's chopping block (Map003's stump)
    for x, y in [(10, 6), (11, 6), (10, 7), (11, 7)]: mp.put(x, y, "tile678", force=True)
    mp.put(10, 9, "tile516", force=True)
    # the vegetable bed: dark soil, cabbages and a row of herbs
    bed = mp.rect(18, 9, 21, 14)
    mp.kind(0, bed, 24)
    for y in (9, 11):
        for x in range(18, 22): mp.tile_event(x, y, D(10, 7) if (x + y) % 2 else D(11, 7), "Grządka (kapusta)")
    for x in range(18, 22): mp.tile_event(x, 13, D(13, 7), "Grządka (zioła)")
    mp.blocker(18, 9, 21, 9, "Grządka"); mp.blocker(18, 11, 21, 11, "Grządka"); mp.blocker(18, 13, 21, 13, "Grządka")
    mp.keep_free |= bed
    # a young tree and flowers in the yard
    mp.put(20, 4, "!$Tree_Small", force=True)
    for x, y, t in [(13, 9, D(8, 7)), (17, 9, D(14, 8)), (12, 12, D(12, 10)), (10, 12, D(8, 8)), (13, 14, D(12, 9))]:
        mp.tile_event(x, y, t, "Kwiaty")
    # outside the fence: the woods behind the cottage, trees on the sides, thickets and stones
    north = {(x, y) for x in range(W) for y in range(0, 2)} | {(x, y) for x in range(0, 7) for y in range(0, 22) if y < 14 or x < 4}
    north |= {(x, y) for x in range(24, 30) for y in range(0, 22) if y < 13 or x > 26}
    mp.forest(north - ring(mp, yard | mp.rect(8, 2, 22, 16), 1) - walk, 2.4)
    for x, y, pic in [(4, 17, "!$Bush_Bare_Wide"), (25, 18, "!$Bush_Bare_Thicket"), (5, 20, "!$Rock_Mossy"), (24, 15, "!$Rock_Flat"),
                      (19, 19, "!$Bush_Bare_B"), (10, 19, "!$Bush_Bare_Tall"), (27, 20, "!$Tree_Small"), (2, 16, "!$Tree_Small")]:
        mp.put(x, y, pic)
    light = mp.rect(9, 3, 21, 15) - bed
    flowers = patch(mp, 11, 13.5, 1.0, 2031) & yard
    tall, floor = ground(mp, paths=walk, woods=set(), light=light, flowers=flowers, tall_n=16,
                         keep=set(bed) | mp.rect(12, 3, 18, 7))
    for c in mp.rect(8, 2, 22, 16) - yard: mp.layers[1][c] = ("k", 22)      # (the fence stays on top of the ground)
    for c in mp.rect(14, 16, 16, 16): mp.layers[1][c] = ("k", 39)            # the gate: path, no fence
    mp.layers[1].pop(door, None)
    links_for_edges(mp)
    return mp

def links_for_edges(mp):
    for fm, x, y, tm, tx, ty, d, kind in transfers():
        if fm == mp.id and kind == "edge":
            mp.transfer(x, y, tm, tx, ty, d, name="Przejście -> " + NAMES[tm])

# ====================================================================================== the road maps
def road_finish(mp, paths, woods, light=set(), bare=set(), flowers=set(), tall_n=30):
    tall, floor = ground(mp, paths=paths, woods=woods, light=light, bare=bare, flowers=flowers, tall_n=tall_n)
    paint_region(mp, paths)                       # the road stays a road: no berry bush, no digging or building on it
    for fm, x, y, tm, tx, ty, d, kind in transfers():
        if fm == mp.id:
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1): paint_region(mp, [(x + dx, y + dy)])
    links_for_edges(mp)

def design_21():
    """Leśna droga: a forest road from grandpa's yard (N) winding down to the west, where it meets the field road"""
    mp = new_map(21, "<Clouds:on>", 2121)
    edge_keep(mp)
    road = path(mp, [(20, -1), (20, 4), (18.5, 8), (21, 12.5), (19, 16.5), (13, 19.5), (6, 20), (-1, 20)], 2.4)
    mp.keep_free |= road | ring(mp, road, 1)
    # an old felling north-east of the road: stumps, logs, a tall stump, young trees coming up again
    clearing = blob(mp, 30, 8, 5, 3.2, 2101, 0.35)
    for x, y, pic in [(27, 6, "tile516"), (30, 5, "tile516"), (33, 7, "tile516"), (29, 10, "tile516"), (32, 9, "!$Stump_Tall"),
                      (28, 8, "tile678"), (31, 11, "tile678"), (26, 10, "!$Tree_Small"), (34, 5, "!$Tree_Small"), (35, 10, "!$Trunk_Dead")]:
        mp.put(x, y, pic)
    # a glade south of the bend with mossy boulders
    glade = blob(mp, 26, 22, 4.5, 3, 2102, 0.4)
    for x, y, pic in [(25, 21, "!$Boulder_A"), (28, 23, "!$Rock_Mossy"), (23, 24, "!$Rock_Mound"), (29, 20, "!$Rock_Cracked")]:
        mp.put(x, y, pic)
    woods = mp.all - road - ring(mp, road, 1) - clearing - glade - ring(mp, clearing, 2) - ring(mp, glade, 2)
    woods -= blob(mp, 8, 8, 3, 2.2, 2104, 0.4) | blob(mp, 9, 26, 3.5, 2, 2105, 0.4) | blob(mp, 34, 26, 3, 2, 2106, 0.4)   # small glades
    for x, y, pic in [(8, 8, "tile678"), (10, 9, "!$Rock_Mossy"), (7, 26, "tile516"), (10, 25, "tile678"), (34, 25, "!$Trunk_Dead"),
                      (12, 3, "tile678"), (4, 14, "!$Rock_Mossy"), (36, 17, "tile678"), (15, 27, "!$Stump_Tall")]:
        mp.put(x, y, pic)
    mp.forest_var(woods, 2.1, 3.6, seed=2107)
    mp.scatter((ring(mp, road, 2) | ring(mp, clearing, 1)) - road, 9, lambda x, y: mp.put(x, y, mp.rnd.choice(BARE_SMALL)), 4)
    mp.scatter(ring(mp, road, 2) - road, 5, lambda x, y: mp.put(x, y, mp.rnd.choice(ROCK_SMALL)), 5)
    light = blob(mp, 30, 8, 4, 2.5, 2111) | blob(mp, 26, 22, 3.5, 2.2, 2112)
    road_finish(mp, road, woods, light, clearing & blob(mp, 30, 8, 3, 2, 2113), patch(mp, 26, 23, 1.2, 2131), tall_n=24)
    return mp

def design_22():
    """Polna droga: the road comes from the forest road (E), crosses the fields and goes on south to the forest edge;
    a lane branches off north to the tavern"""
    mp = new_map(22, "<Clouds:on>", 2222)
    edge_keep(mp)
    main = path(mp, [(40, 20), (34, 19.5), (29, 18), (24, 18.5), (23.5, 23), (24, 27), (24, 30)], 2.4)
    lane = path(mp, [(24.5, 18), (20, 14), (15, 10), (12.5, 5), (12, -1)], 1.9)
    paths = main | lane
    mp.keep_free |= paths | ring(mp, paths, 1)
    # a stone cairn at the fork, where the lane leaves for the tavern
    mp.put(27, 16, "!$Rock_Cairn", force=True)
    # the fields: hedgerows of leafless thickets along the field edges, lone trees, stones
    for x, y, pic in [(6, 12, "!$Bush_Bare_Hedge"), (9, 12, "!$Bush_Bare_Wide"), (12, 13, "!$Bush_Bare_A"), (3, 11, "!$Bush_Bare_Tall"),
                      (30, 24, "!$Bush_Bare_Hedge"), (33, 24, "!$Bush_Bare_Wide"), (36, 23, "!$Bush_Bare_Vines"), (28, 25, "!$Bush_Bare_B"),
                      (31, 9, "!$Bush_Bare_Thicket"), (34, 11, "!$Bush_Bare_Wide"), (18, 22, "!$Bush_Bare_Big"), (7, 25, "!$Bush_Bare_Thicket")]:
        mp.put(x, y, pic)
    for x, y, pic in [(17, 6, "!$Tree_Pear"), (33, 14, "!$Tree_Small"), (9, 19, "!$Tree_Small"), (29, 5, "!$Tree_Small"), (14, 26, "!$Tree_Small")]:
        mp.put(x, y, pic)
    for x, y, pic in [(21, 9, "!$Rock_Flat"), (5, 17, "!$Boulder_A"), (36, 16, "!$Rock_Pile"), (15, 17, "!$Rock_Chunk"), (32, 27, "!$Rock_Mossy")]:
        mp.put(x, y, pic)
    # a few pines at the map edges (the woods of the next maps begin there)
    edge = {(x, y) for (x, y) in mp.all if x <= 1 or y <= 1 or x >= 38 or y >= 28}
    mp.forest(edge, 3.2)
    mp.forest(blob(mp, 3, 4, 3.5, 3, 2201) | blob(mp, 36, 3, 3.5, 2.5, 2202) | blob(mp, 4, 27, 4, 2.5, 2203), 2.4)
    light = blob(mp, 12, 17, 7, 5, 2211) | blob(mp, 31, 12, 6, 4, 2212) | blob(mp, 17, 26, 5, 2.5, 2213)
    flowers = patch(mp, 8, 16, 1.5, 2231) | patch(mp, 30, 21.5, 1.2, 2232) | patch(mp, 20, 5, 1.3, 2233)
    # old fields left fallow: bare earth in long strips (Map003's kind 17), stones picked off them at the edge
    def field(x0, y0, x1, y1, seed):
        """a field: a rectangle whose corners and edges are a little ragged"""
        out = set()
        for (x, y) in mp.rect(x0, y0, x1, y1):
            edge = x in (x0, x1) or y in (y0, y1)
            corner = x in (x0, x1) and y in (y0, y1)
            if corner and noise(x, y, seed) < 0.7: continue
            if edge and noise(x, y, seed + 1) < 0.25: continue
            out.add((x, y))
        return out
    fields = field(4, 20, 15, 25, 2241) | field(28, 4, 36, 9, 2242)
    fields -= mp.taken | paths | ring(mp, paths, 1)
    mp.put(3, 22, "!$Rock_Pile"); mp.put(17, 21, "!$Rock_Flat")
    road_finish(mp, paths, set(), light - fields, fields, flowers - fields, tall_n=34)
    return mp

def design_23():
    """Skraj lasu: the road comes down from the fields (N) and runs west along the edge of the forest to grandpa's field"""
    mp = new_map(23, "<Clouds:on>", 2323)
    edge_keep(mp)
    road = path(mp, [(24, -1), (24, 5), (22, 9), (17, 12), (10, 13), (5, 13), (-1, 13)], 2.4)
    mp.keep_free |= road | ring(mp, road, 1)
    # the forest: south of the road and in the east, its edge ragged; young trees and thickets where it ends
    forest = {(x, y) for (x, y) in mp.all if y >= 17 + int(3 * noise(x, 0, 2301)) or (x >= 30 and y >= 6 + int(3 * noise(0, y, 2302)))}
    forest -= road | ring(mp, road, 2)
    for x, y, pic in [(12, 22, "tile678"), (20, 25, "!$Rock_Mossy"), (33, 13, "tile516"), (27, 27, "!$Trunk_Dead"), (5, 24, "tile678")]:
        mp.put(x, y, pic)
    mp.forest_var(forest - blob(mp, 16, 24, 3, 2, 2304, 0.4), 2.1, 3.4, seed=2305)
    edge = ring(mp, forest, 1) - forest - road
    mp.scatter(edge, 8, lambda x, y: mp.put(x, y, "!$Tree_Small"), 3.5)
    mp.scatter(edge, 7, lambda x, y: mp.put(x, y, mp.rnd.choice(BARE)), 3)
    # the meadow north of the road: a rocky outcrop, a dead trunk, an old felling
    for x, y, pic in [(10, 5, "!$Rock_Huge"), (12, 4, "!$Rock_Jagged"), (8, 7, "!$Rock_Pile"), (13, 7, "!$Rock_Mound"), (7, 4, "!$Rock_Tall")]:
        mp.put(x, y, pic)
    for x, y, pic in [(17, 4, "!$Trunk_Dead"), (29, 3, "tile516"), (27, 5, "tile516"), (28, 7, "tile678"), (4, 9, "!$Stump_Tall"), (19, 7, "!$Bush_Bare_Big")]:
        mp.put(x, y, pic)
    mp.forest(blob(mp, 2, 2, 3, 2.5, 2303), 2.4)
    light = blob(mp, 15, 6, 6, 3.5, 2311) | blob(mp, 26, 11, 4, 2.5, 2312)
    flowers = patch(mp, 21, 4, 1.3, 2331) | patch(mp, 4, 6, 1.1, 2332)
    road_finish(mp, road, forest, light, set(), flowers, tall_n=26)
    return mp

# ====================================================================================== 24: the Lord's estate
def design_24():
    """Posiadłość Lorda: behind a clipped hedge, an avenue with lamps from the gate (W) to a manor house with wings,
    a paved forecourt, and a formal garden of hedged flower beds round a paved circle"""
    mp = new_map(24, "<Clouds:on>\n<Farm:off>", 2424)
    W, H = mp.W, mp.H
    edge_keep(mp)
    # --- the manor: red tiled roof, stone walls; a central block and two wings reaching forward
    house(mp, 19, 2, 13, 4, 4, 51, 76)              # centre x 19..31, roof 2..5, wall 6..9
    house(mp, 14, 2, 5, 6, 4, 51, 76)               # west wing x 14..18, roof 2..7, wall 8..11
    house(mp, 32, 2, 5, 6, 4, 51, 76)               # east wing x 32..36
    for x in (20, 22, 28, 30):
        mp.tile(2, x, 6, B(6, 0))                   # upper floor
        mp.tile(2, x, 7, B(7, 4)); mp.tile(2, x, 8, B(7, 5)); mp.tile(2, x, 9, B(7, 0))
    for x in (15, 17, 33, 35):
        mp.tile(2, x, 8, B(6, 0))
        mp.tile(2, x, 9, B(7, 4)); mp.tile(2, x, 10, B(7, 5)); mp.tile(2, x, 11, B(7, 0))
    mp.picture(25, 9, "!$Gate_Wood1", 0, 2, 0, name="Drzwi dworu", priority=1, trigger=0,
               cmds=[{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]},
                     {"code": 401, "indent": 0, "parameters": ["Drzwi dworu są zamknięte."]}])
    mp.blocker(14, 2, 36, 8, "Dwór")
    mp.blocker(19, 9, 24, 9, "Dwór"); mp.blocker(26, 9, 31, 9, "Dwór")
    mp.blocker(14, 9, 18, 11, "Dwór (skrzydło)"); mp.blocker(32, 9, 36, 11, "Dwór (skrzydło)")
    manor = mp.rect(14, 2, 36, 11)
    mp.keep_free |= manor | mp.rect(13, 1, 37, 12)
    # --- the hedge round the estate (clipped, A2 hedge), the gate open on the west; lamps by the gate
    hedge = (mp.rect(4, 0, 39, 0) | mp.rect(4, 29, 39, 29) | mp.rect(39, 1, 39, 28) | mp.rect(4, 1, 4, 28)) - mp.rect(4, 14, 4, 16)
    mp.kind(1, hedge, 20)
    mp.blocker(4, 0, 39, 0, "Żywopłot"); mp.blocker(4, 29, 39, 29, "Żywopłot"); mp.blocker(39, 1, 39, 28, "Żywopłot")
    mp.blocker(4, 1, 4, 13, "Żywopłot"); mp.blocker(4, 17, 4, 28, "Żywopłot")
    mp.keep_free |= hedge
    # --- the avenue from the gate to the forecourt, lamps along it; the forecourt between the wings
    avenue = mp.rect(0, 14, 18, 16)
    court = mp.rect(19, 10, 31, 16)
    mp.kind(0, avenue, 32)
    mp.kind(0, court, 40)
    for x in (3, 5):
        mp.picture(x, 13, "!lamp", 0, 2, 0, name="Latarnia"); mp.picture(x, 17, "!lamp", 0, 2, 0, name="Latarnia")
    for x in (9, 13):
        mp.picture(x, 13, "!lamp", 0, 2, 0, name="Latarnia"); mp.picture(x, 17, "!lamp", 0, 2, 0, name="Latarnia")
    mp.keep_free |= avenue | court
    # --- the formal garden: a paved cross with a circle, four hedged flower beds
    walk = mp.rect(24, 17, 26, 27) | mp.rect(12, 21, 37, 22)
    circle = {(x, y) for (x, y) in mp.all if ((x - 25) / 3.2) ** 2 + ((y - 21.5) / 2.6) ** 2 <= 1}
    mp.kind(0, walk | circle, 19)
    for x, y in [(22, 19), (28, 19), (22, 24), (28, 24)]:
        mp.picture(x, y, "!lamp", 0, 2, 0, name="Latarnia")
    mp.keep_free |= walk | circle
    beds = [(13, 18, 21, 20), (29, 18, 36, 20), (13, 23, 21, 27), (29, 23, 36, 27)]
    for i, (x0, y0, x1, y1) in enumerate(beds):
        frame = mp.rect(x0, y0, x1, y1) - mp.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1)
        mp.kind(1, frame, 20)
        inner = mp.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1)
        mp.kind(1, inner, 28)
        mp.blocker(x0, y0, x1, y1, "Klomb z żywopłotem")
        mp.keep_free |= mp.rect(x0, y0, x1, y1)
    # --- the park: rows of clipped young trees in the west, a few in the east. The Lord's trees are for looking at: the same
    # picture as Map003's small tree, but no <Tree> note and no commands, so the axe does nothing to them
    def lords_tree(x, y):
        if not mp.free(x, y): return False
        mp.picture(x, y, "!$Tree_Small", 0, 2, 0, name="Drzewko w ogrodzie Lorda", priority=1)
        return True
    for x in (7, 10):
        for y in (3, 6, 9, 20, 23, 26):
            lords_tree(x, y)
    for x, y in [(38, 3), (38, 7), (38, 25), (6, 1)]: lords_tree(x, y)
    for x, y, t in [(13, 13, D(14, 8)), (37, 13, D(14, 8)), (16, 28, D(12, 10)), (33, 28, D(12, 10)), (6, 12, D(8, 7)), (6, 18, D(8, 7)),
                    (12, 11, D(15, 11)), (37, 11, D(15, 11))]:
        mp.tile_event(x, y, t, "Kwiaty")
    # outside the gate: a bit of grass and pines
    mp.forest(mp.rect(0, 0, 3, 12) | mp.rect(0, 18, 3, 29), 2.6)
    light = mp.rect(5, 1, 38, 28) - avenue - court - walk - circle - manor
    ground(mp, paths=set(), woods=set(), light=light, flowers=set(), tall_n=0, floor_under_pines=True,
           keep=manor | avenue | court | walk | circle)
    # (ground() repainted layer 1 outside `keep`; put the hedges and beds back on top)
    mp.kind(1, hedge, 20)
    for i, (x0, y0, x1, y1) in enumerate(beds):
        frame = mp.rect(x0, y0, x1, y1) - mp.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1)
        mp.kind(1, frame, 20)
        mp.kind(1, mp.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1), 28)
    links_for_edges(mp)
    return mp

DESIGNS = {19: design_19, 20: design_20, 21: design_21, 22: design_22, 23: design_23, 24: design_24}

if __name__ == "__main__":
    # Map019 (grandpa's cottage inside) is no longer made here: since 2026-09-28 it is tools/house/build_house.py's concept B
    # (design_19 stays only as the record of the first cottage and must not overwrite the installed one)
    todo = [int(a) for a in sys.argv[1:]] or [n for n in sorted(DESIGNS) if n != 19]
    if 19 in todo:
        print("Map019 is built by tools/house/build_house.py now - skipped"); todo.remove(19)
    for n in todo:
        mp = DESIGNS[n]()
        count = mp.write()
        kinds = {}
        for x, y, e in mp.events:
            p = e["pages"][0]["image"]
            k = p["characterName"] or ("tile%d" % p["tileId"] if p["tileId"] else ("transfer" if any(c["code"] == 201 for c in e["pages"][0]["list"]) else e["name"]))
            kinds[k] = kinds.get(k, 0) + 1
        print("Map%03d %s %dx%d events %d" % (n, MAPS[n]["name"], mp.W, mp.H, count))
        print("   ", ", ".join("%s x%d" % (k.replace("!$", ""), v) for k, v in sorted(kinds.items())))
