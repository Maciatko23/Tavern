# Map013 "Góry i kamieniołom" (W8 "Żelazna Pięść", docs/QUESTY.md; STORY.md "Kamieniołom i stara kopalnia"): the eastern
# mountains - foothills at the bottom where the trail from Leśna droga (Map021) comes in on the west edge, a grassy shelf up a
# flight of mossy steps, the old quarry of the order cut into the high shelf (the stone of the fortress and of the Lord's
# manor: cut blocks with old raven marks, a crane's ruin, the raven carved in the quarry wall, a dry quarry pond), the high
# rocky shelf up the quarrymen's steps with the cave of the diggers (Map014) in the mountain wall, and in the north-west a
# ravine closed by the gate of the Silent (Osada Milczących, Map120 - opens in Act II: switch 16).
# Tileset 11 (the Winlu author's exterior: the only one of ours with cliffs and their flags); every tree, rock, ore and bush is
# one of Map003's own event kinds (they chop / mine / drop like on grandpa's field). No water (the drought): the quarry pond is
# dry mud. Markers "Miejsce: <key>" for the quests: docs/miasta_miejsca_zadan.md "Góry".
from mtlib import *   # noqa: F401,F403
import props as PR

MAP_ID, W, H = 13, 60, 48
NOTE = ("<Clouds:on>\n<Hunt:rabbit=1,deer=1,wolf=3>\n<Bear:0.12>\n<Camp:off>\n<Poziom:5>")
FROM_ROAD = (21, [(39, 8), (39, 9), (39, 10)])     # Leśna droga's east edge (the user's trail to the east)
ENTRY = [(0, 38), (0, 39), (0, 40)]                 # the west edge here
CAVE = (44, 7)                                      # the mouth of the cave (the lowest row of the mountain's face)
OSADA_EXIT = [(5, 0), (6, 0), (7, 0)]
OSADA_TO = 120
OSADA_SWITCH = 16
STAIRS1 = (22, 23, 30)        # mossy steps foothills -> shelf (x0, x1, rim row)
STAIRS2 = (56, 57, 16)        # the quarrymen's steps quarry -> high shelf


CREST_BOTTOM = [(14, 21, 3), (22, 27, 2), (28, 36, 3), (37, 43, 4), (44, 50, 3), (51, 55, 2), (56, 59, 3)]   # the mountain wall meanders


def crest_bottom(x):
    for x0, x1, b in CREST_BOTTOM:
        if x0 <= x <= x1: return b
    return 3


def levels(mp):
    # the crest (L3, rocky, a face 4 rows tall): the whole top (its foot meanders), a rock on each side of the ravine (north-west)
    crest = {(x, y) for x in range(14, 60) for y in range(0, crest_bottom(x) + 1)} | mp.rect(8, 0, 13, 5) | mp.rect(0, 0, 4, 5)
    top = lambda x: crest_bottom(x) + 5 if x >= 14 else 8         # the first row below the wall's face
    # the high shelf (L2, rocky): east of x 31 under the crest; a bench of cut stone down into the quarry; the quarry's west wall
    bottom2 = {x: (15 if x <= 45 else 16) for x in range(31, 60)}
    for x in range(46, 54): bottom2[x] = 20
    high = {(x, y) for x in range(31, 60) for y in range(top(x), bottom2[x] + 1)} | mp.rect(31, 16, 33, 23)
    # the shelf (L1, grass): from x 16 to the east edge
    bottom1 = {x: (30 if x <= 40 else 31) for x in range(16, 60)}
    shelf = {(x, y) for x in range(16, 60) for y in range(top(x), bottom1[x] + 1)}
    mp.raise_to(shelf, 1, "grass")
    mp.raise_to(high, 2, "dirt")
    mp.raise_to(crest, 3, "dirt")
    mp.face_h[3] = 4
    return high, shelf, crest


def quarry_cells(mp):
    """the quarry's floor: the shelf below the high shelf's faces, east of its west wall (x 34..), down to row 28"""
    return {(x, y) for x in range(34, 60) for y in range(16, 29) if mp.lv(x, y) == 1}


def build():
    mp = MMap(MAP_ID, W, H, "Góry i kamieniołom", NOTE, seed=1313, bgm="Field1")
    high, shelf, crest = levels(mp)
    quarry = quarry_cells(mp)
    rnd = mp.rnd

    # ------------------------------------------------------------------------------------------ the ground of each level
    def ground(l, x, y):
        if l >= 2 or (x, y) in quarry: return G_DIRT
        return G_GRASS
    mp.terraces(ground)
    mp.stairs(*STAIRS1[:2], STAIRS1[2], "moss")
    mp.stairs(*STAIRS2[:2], STAIRS2[2], "stone", ground=G_DIRT)
    lv1 = {c for c in mp.all if mp.lv(*c) == 1}
    lv2 = {c for c in mp.all if mp.lv(*c) == 2}

    # ------------------------------------------------------------------------------------------ the ways (dirt path film, region 7)
    trail = path(mp, [(-1, 39), (6, 39), (12, 38.5), (17, 37), (21, 35), (22.5, 33.5)], 2.2)
    shelf_way = path(mp, [(22.5, 30), (23.5, 28), (27, 26.5), (31, 26.5), (35, 26)], 2.0) & lv1
    quarry_way = path(mp, [(35, 26), (42, 25), (50, 24.5), (55, 22), (56.5, 19.5)], 2.0) & quarry
    high_way = path(mp, [(56.5, 15.5), (54, 13), (49, 11), (45, 9.5), (44, 8)], 2.0) & lv2
    osada_way = path(mp, [(6, 39), (6.5, 34), (5.5, 28), (6.5, 21), (6, 15), (6, 10), (6, -1)], 1.6)
    osada_way = {c for c in osada_way if mp.lv(*c) == 0 and c not in mp.faces}
    ways = trail | shelf_way | quarry_way | high_way | osada_way
    for c in ways:
        if c in mp.faces or c in mp.stair_cells or c in mp.rims: continue
        mp.layers[1][c] = ("k", G_PATH)
        mp.region[c] = 7
    for c in mp.stair_cells: mp.region[c] = 7
    mp.keep_free |= ways | ring(mp, ways, 1)
    for c in ENTRY + OSADA_EXIT:
        mp.keep_free |= ring(mp, [c], 2) | {c}
    ravine = mp.rect(5, 0, 7, 10)

    # ------------------------------------------------------------------------------------------ the ground's look
    def film(cells, kind, z=1):
        for c in cells:
            if c in mp.faces or c in mp.rims or c in mp.stair_cells or c in ways: continue
            if mp.inside(*c): mp.layers[z][c] = ("k", kind)
    rocky = {c for c in mp.all if mp.lv(*c) >= 2 and c not in mp.rims and c not in mp.faces}
    film({c for c in rocky if lowfreq(*c, 31, 4.0) > 0.62}, G_SCREE)
    film({c for c in rocky if 0.33 < lowfreq(*c, 37, 3.0) < 0.37}, G_STONES)
    film({c for c in rocky if lowfreq(*c, 41, 5.0) < 0.22}, G_GRASS_ON_DIRT)
    film({c for c in quarry if lowfreq(*c, 53, 3.0) > 0.62}, G_SCREE)
    film({c for c in quarry if lowfreq(*c, 57, 2.5) < 0.16}, G_STONES)
    for c in ravine:
        if c not in ways and mp.lv(*c) == 0 and c not in mp.faces: mp.layers[1][c] = ("k", G_SCREE)
    # the dry quarry pond (cracked mud, no water)
    pond = blob(mp, 37.5, 27.2, 2.6, 1.4, 1331, 0.3) & quarry
    for c in pond:
        mp.layers[1][c] = ("k", G_MUD_FILM)
        mp.keep_free.add(c)
    # grass: lighter patches, tall tufts, flowers and scree on the foothills, stones at the cliffs' feet
    grass = {c for c in mp.all if mp.lv(*c) in (0, 1) and c not in quarry and c not in mp.rims and c not in mp.faces}
    film({c for c in grass if lowfreq(*c, 61, 6.0) > 0.66}, G_LIGHT, z=0)
    film({c for c in grass if 0.45 < lowfreq(*c, 67, 2.2) < 0.52}, G_TALL)
    film({c for c in grass if mp.lv(*c) == 0 and c[1] > 34 and lowfreq(*c, 71, 2.0) > 0.78}, G_FLOWERS_SMALL)
    film({c for c in grass if mp.lv(*c) == 0 and c[1] > 35 and lowfreq(*c, 73, 4.0) < 0.2}, G_SCREE)
    # a dry stream bed down the foothills (the drought: cracked mud and stones, no water)
    gully = path(mp, [(31.5, 33), (33, 37), (31.5, 41), (34, 44.5), (35, 48)], 1.7)
    gully = {c for c in gully if mp.lv(*c) == 0 and c not in mp.faces and c not in ways}
    for c in gully:
        mp.layers[1][c] = ("k", G_MUD_FILM if noise(*c, 79) < 0.7 else G_SCREE)
        mp.keep_free.add(c)
    for c in ring(mp, gully, 1) - gully:
        if c in grass and c not in ways and noise(*c, 81) < 0.45: mp.layers[1][c] = ("k", G_STONES)
    feet = {(x, y + 1) for (x, y), (part, l) in mp.faces.items() if part == "L"}
    film({c for c in feet | ring(mp, feet, 1) if c in grass and noise(*c, 77) < 0.55}, G_STONES)

    # ------------------------------------------------------------------------------------------ the ways out
    for (x, y) in ENTRY:
        tx, ty = FROM_ROAD[1][ENTRY.index((x, y))]
        mp.transfer(x, y, 21, tx - 1, ty, 4, name="Przejście -> Leśna droga")
        mp.region[(x, y)] = 7
    PR.cave_mouth(mp, *CAVE)
    PR.lantern_wall(mp, CAVE[0] + 2, CAVE[1], "Latarnia kopaczy")
    PR.osada_gate(mp, 6, 3, OSADA_SWITCH)
    PR.silent(mp, 4, 10, 0)            # a cairn of silence and a post with a sewn mouth at the ravine's mouth
    PR.silent(mp, 8, 10, 1)
    for (x, y) in OSADA_EXIT:
        PR.switch_transfer(mp, x, y, OSADA_TO, PR.OSADA_LAND[0] + (x - 6), PR.OSADA_LAND[1], 8, OSADA_SWITCH, "Przejście -> Osada Milczących")

    # ------------------------------------------------------------------------------------------ the quarry
    PR.raven_carving(mp, 40, 17, "Kruk wykuty w ścianie kamieniołomu")
    PR.carving(mp, 36, 17, 1, "Znaki kamieniarzy")
    PR.carving(mp, 52, 22, 2, "Siedem nacięć")
    PR.crane_ruin(mp, 49, 26)
    blocks = [(39, 21, "kruk"), (43, 22, "plain"), (45, 20, "pair"), (36, 19, "plain"), (54, 27, "kruk"), (46, 28, "half"),
              (56, 24, "split"), (41, 28, "half"), (35, 23, "pair")]
    for (x, y, kind) in blocks:
        PR.stone_block(mp, x, y, kind)
    PR.dry_pond(mp, 37, 27)
    for x, y, pic in [(58, 25, "!$Rock_Ore_Iron_Cluster"), (58, 28, "!$Rock_Ore_Iron_Chunk"), (34, 20, "!$Rock_Rubble"),
                      (52, 28, "!$Rock_Pile"), (45, 18, "!$Rock_Rubble"), (51, 23, "!$Rock_Chunk")]:
        mp.put(x, y, pic)
    # ------------------------------------------------------------------------------------------ the high shelf
    for x, y, pic in [(51, 10, "!$Rock_Ore_Iron_Twin"), (38, 12, "!$Rock_Ore_Iron_Jagged"), (34, 9, "!$Rock_Ore_Iron"),
                      (58, 9, "!$Rock_Huge"), (36, 14, "!$Rock_Jagged"), (41, 9, "!$Rock_Spire"), (53, 14, "!$Rock_Cairn"),
                      (47, 14, "!$Boulder_A"), (32, 11, "!$Rock_Tall")]:
        mp.put(x, y, pic)
    high_free = {c for c in high if c not in mp.rims and c not in mp.faces and mp.lv(*c) == 2 and c[1] <= 15}
    mp.scatter(high_free, 7, lambda x, y: mp.put(x, y, "!$Pine_C", name="Sosna (niska)"), 4)
    mp.scatter(high_free, 6, lambda x, y: mp.put(x, y, rnd.choice(ROCK_SMALL)), 3)
    mp.scatter(high_free, 4, lambda x, y: mp.put(x, y, rnd.choice(["!$Bush_Bare_A", "!$Bush_Bare_B", "!$Bush_Bare_Tall"])), 4)
    PR.broken_cart(mp, 47, 9)

    # ------------------------------------------------------------------------------------------ the grass shelf (west of the quarry)
    camp = (20, 12)
    PR.old_fire_ring(mp, *camp)
    mp.keep_free |= ring(mp, [camp], 2) | {camp}
    shelf_w = {c for c in shelf if c[0] <= 31 and mp.lv(*c) == 1 and c not in mp.rims}
    mp.forest_var(shelf_w - ring(mp, [camp], 3) - {c for c in shelf_w if c[1] > 27}, 2.6, 4.2, seed=1341)
    mp.scatter(shelf_w, 8, lambda x, y: mp.put(x, y, rnd.choice(BARE_SMALL)), 3)
    mp.scatter(shelf_w, 6, lambda x, y: mp.put(x, y, rnd.choice(ROCK_SMALL + ["!$Boulder_A", "!$Rock_Mossy"])), 4)
    lip = {c for c in shelf if c[1] >= 28 and mp.lv(*c) == 1 and c not in mp.rims and c not in quarry}
    mp.scatter(lip, 5, lambda x, y: mp.put(x, y, rnd.choice(["!$Pine_C", "!$Tree_Small", "!$Bush_Bare_Wide"])), 4)

    # ------------------------------------------------------------------------------------------ the forest (west) and the foothills
    forest = {c for c in mp.all if mp.lv(*c) == 0 and c[0] <= 15 and 10 <= c[1] <= 35}
    glade = blob(mp, 9.5, 24, 2.6, 2.0, 1351, 0.4)
    mp.keep_free |= glade
    for x, y, pic in [(9, 24, "tile516"), (11, 23, "tile678"), (8, 25, "!$Rock_Mossy"), (33, 39, "!$Rock_Mossy"), (30, 42, "!$Rock_Cracked")]:
        mp.put(x, y, pic, force=True)
    mp.forest_var(forest, 2.0, 3.2, seed=1352)
    foot = {c for c in mp.all if mp.lv(*c) == 0 and c[1] >= 34 and c not in mp.faces}
    mp.forest_var({c for c in foot if c[1] >= 43 or c[0] >= 51}, 2.4, 4.0, seed=1353)
    mp.scatter(foot, 7, lambda x, y: mp.put(x, y, rnd.choice(ROCK_BIG[:6] + ROCK_SMALL)), 4)
    mp.scatter(foot, 8, lambda x, y: mp.put(x, y, rnd.choice(BARE)), 4)
    mp.scatter(foot, 4, lambda x, y: mp.put(x, y, rnd.choice(["tile516", "tile678", "!$Trunk_Dead", "!$Stump_Tall"])), 5)
    mp.scatter({c for c in foot if 34 <= c[1] <= 42}, 6, lambda x, y: mp.put(x, y, rnd.choice(["!$Pine_B", "!$Pine_C", "!$Tree_Small"])), 4)
    # the crest: pines and rocks on top (out of reach, for the look)
    top = {c for c in crest if c not in mp.rims and c not in mp.faces}
    mp.scatter(top, 14, lambda x, y: mp.put(x, y, rnd.choice(["!$Pine_A", "!$Pine_B", "!$Pine_C"])), 3)
    mp.scatter(top, 10, lambda x, y: mp.put(x, y, rnd.choice(["!$Rock_Spire", "!$Rock_Tall", "!$Rock_Jagged", "!$Rock_Huge"])), 4)

    # ------------------------------------------------------------------------------------------ the quest markers
    for key, x, y, d in MARKERS:
        mp.marker(x, y, key, d)
    return mp


# key, x, y, the way one faces there (2 down, 4 left, 6 right, 8 up) - docs/miasta_miejsca_zadan.md "Góry"
MARKERS = [
    ("gory_wejscie", 1, 39, 6),              # where one comes in from Leśna droga
    ("grum_przewodnik_start", 4, 38, 6),     # Grum waits here at dawn (W8 ch2)
    ("gory_schody", 22, 34, 8),              # at the foot of the mossy steps up to the shelf
    ("nocleg", 21, 13, 2),                   # the quarrymen's old fire ring under the crest: a place to spend the night
    ("kamieniolom", 44, 24, 8),              # the middle of the quarry's floor
    ("kamieniolom_znak", 40, 18, 8),         # before the raven carved in the quarry wall (W8 ch2; W2/W4 clues)
    ("blok_kruk", 39, 22, 8),                # before the cut block with the raven mark
    ("dzwig", 49, 27, 8),                    # before the crane's ruin
    ("staw_suchy", 37, 25, 2),               # by the dry quarry pond
    ("kamieniolom_schody", 56, 19, 8),       # at the foot of the quarrymen's steps
    ("punkt_widokowy", 57, 12, 4),           # the lookout on the high shelf - the island to the west below
    ("jaskinia_wejscie", 44, 8, 8),          # before the mouth of the cave
    ("osada_brama", 6, 4, 8),                # before the Silent's gate in the ravine
]

if __name__ == "__main__":
    import sys
    mp = build()
    j = mp.to_json()
    render(j, sys.argv[1] if len(sys.argv) > 1 else "gory.png", scale=float(sys.argv[2]) if len(sys.argv) > 2 else 0.5, grid=True)
