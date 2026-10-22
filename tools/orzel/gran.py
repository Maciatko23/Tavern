# Map175 "Orla Grań" (the white eagle, docs/orzel/KONCEPCJA.md 1): the ridge over the order's quarry in the mountains - the climbers'
# path comes up from Map013's high shelf (53-54,6: an event Orzel.js puts in as Map013 loads - the user's map stays as it is) to the
# foot of the ridge here (bottom edge 19-21,29). A shelf of rock and thin grass up a flight of stone steps; under the crest's wall the
# Order's old eyrie: the broken nest (the egg after a storm in Act II), the white she-eagle shot by the Black Eyes' hunters, their
# arrows, the stone basin the Order's eagles drank rain from (no water: the drought), the hunters' cold camp (the cage: W13 ch. 5).
# Tileset 11 (the Winlu author's exterior, its cliffs and flags), the mountains' library (tools/mountains/mtlib.py: terraces, Map003's
# own event kinds for the pines and rocks). The interactive things are put in by Orzel.js at runtime on the markers below
# ("Miejsce: orzel_*"); only the tiles, the trees, the rocks, the markers and the way down are in the file.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "mountains"))
from mtlib import *   # noqa: F401,F403
import props as PR

MAP_ID, W, H = 175, 40, 30
NOTE = "<Clouds:on>\n<Hunt:off>\n<Bear:off>\n<Camp:off>\n<Farm:off>\n<Build:off>\n<Poziom:6>\n<Orzel:gran>"
DOWN = [(19, 29), (20, 29), (21, 29)]     # the way down to Map013 (53-54,7) - Orzel.js injects these transfers (ids 520-522)
ARRIVE = (20, 27)                         # where the climbers' path comes up
STAIRS = (19, 21, 21)                     # stone steps from the foot (L0) up to the shelf (L1): columns 19-21, the shelf's rim row 21


def levels(mp):
    crest = {(x, y) for x in range(W) for y in range(0, 6)} | mp.rect(0, 6, 6, 9) | mp.rect(34, 6, 39, 9)
    shelf = {(x, y) for x in range(0, W) for y in range(6, 22)} - crest
    mp.raise_to(shelf, 1, "dirt")
    mp.raise_to(crest, 2, "dirt")
    mp.face_h[2] = 3
    return crest, shelf


def build():
    mp = MMap(MAP_ID, W, H, "Orla Grań", NOTE, seed=1755, bgm="", bgs=("Wind1", 45, 80))   # (audio/bgs: Wind1-5 - there is no "Wind")
    crest, shelf = levels(mp)
    rnd = mp.rnd

    def ground(l, x, y):
        return G_DIRT if l >= 1 else G_GRASS_ON_DIRT
    mp.terraces(ground)
    mp.stairs(STAIRS[0], STAIRS[1], STAIRS[2], "stone", ground=G_DIRT)
    lv1 = {c for c in mp.all if mp.lv(*c) == 1 and c not in mp.faces and c not in mp.rims}
    lv0 = {c for c in mp.all if mp.lv(*c) == 0 and c not in mp.faces}

    # the ways: up from the bottom edge, the steps, along the shelf to the eyrie, the camp, the basin
    way = path(mp, [(20, 30), (20, 25), (20, 22)], 2.2)
    shelf_way = path(mp, [(20, 20), (20.5, 16), (20, 12)], 1.8) | path(mp, [(20.5, 16), (26, 16.5), (30, 17)], 1.6) | path(mp, [(20, 15), (15, 14), (12, 13)], 1.4)
    ways = (way | shelf_way) - mp.faces.keys() - mp.stair_cells
    for c in ways:
        if c in mp.rims: continue
        mp.layers[1][c] = ("k", G_PATH)
        mp.region[c] = 7
    for c in mp.stair_cells: mp.region[c] = 7
    mp.keep_free |= ways | ring(mp, ways, 1) | {ARRIVE} | ring(mp, [ARRIVE], 2) | set(DOWN) | ring(mp, DOWN, 1)

    # the ground's look: scree, stones, thin grass, a little light grass on the shelf
    def film(cells, kind, z=1):
        for c in cells:
            if c in mp.faces or c in mp.rims or c in mp.stair_cells or c in ways: continue
            if mp.inside(*c): mp.layers[z][c] = ("k", kind)
    film({c for c in lv1 if lowfreq(*c, 31, 4.0) > 0.6}, G_SCREE)
    film({c for c in lv1 if 0.3 < lowfreq(*c, 37, 3.0) < 0.36}, G_STONES)
    film({c for c in lv1 if lowfreq(*c, 41, 5.0) < 0.28}, G_GRASS_ON_DIRT)
    film({c for c in lv0 if lowfreq(*c, 43, 3.0) > 0.55}, G_SCREE)

    # the eyrie (under the crest's wall), its open ground: the nest, the she-eagle, the arrows - and the landing square of the adult
    eyrie = blob(mp, 20.5, 10.5, 5.5, 3.2, 1751, 0.2) & lv1
    camp = blob(mp, 30.5, 16.5, 3.4, 2.6, 1752, 0.25) & lv1
    basin = blob(mp, 12, 12.5, 2.2, 1.8, 1753, 0.2) & lv1
    landing = mp.rect(22, 23, 27, 27) & lv0
    mp.keep_free |= eyrie | camp | basin | landing

    # the crest (out of reach): pines and big rocks for the look; the shelf: a few low pines, rocks, bare bushes
    top = {c for c in crest if c not in mp.rims and c not in mp.faces}
    mp.scatter(top, 12, lambda x, y: mp.put(x, y, rnd.choice(["!$Pine_B", "!$Pine_C"])), 3)
    mp.scatter(top, 10, lambda x, y: mp.put(x, y, rnd.choice(["!$Rock_Spire", "!$Rock_Tall", "!$Rock_Jagged", "!$Rock_Huge"])), 3)
    free1 = lv1 - mp.keep_free
    mp.scatter(free1, 6, lambda x, y: mp.put(x, y, "!$Pine_C", name="Sosna (niska)"), 4)
    mp.scatter(free1, 9, lambda x, y: mp.put(x, y, rnd.choice(ROCK_SMALL + ["!$Boulder_A", "!$Rock_Mossy", "!$Rock_Cracked"])), 3)
    mp.scatter(free1, 6, lambda x, y: mp.put(x, y, rnd.choice(["!$Bush_Bare_A", "!$Bush_Bare_B", "!$Bush_Bare_Tall"])), 3)
    free0 = lv0 - mp.keep_free
    mp.scatter(free0, 6, lambda x, y: mp.put(x, y, rnd.choice(ROCK_BIG[:6] + ROCK_SMALL)), 3)
    mp.scatter(free0, 5, lambda x, y: mp.put(x, y, rnd.choice(["!$Pine_C", "!$Bush_Bare_Wide", "!$Bush_Bare_A"])), 3)

    # the hunters' cold camp: an old fire ring (the cage and the look are Orzel.js's, on the markers)
    PR.old_fire_ring(mp, 30, 17)

    # the quest markers (Orzel.js puts the things on them)
    for key, x, y, d in MARKERS:
        mp.marker(x, y, key, d)
    return mp


# key, x, y, the way one faces there
MARKERS = [
    ("orzel_wejscie", ARRIVE[0], ARRIVE[1], 8),   # the top of the climbers' path
    ("orzel_jajo", 20, 9, 8),                       # the broken nest (the egg) under the crest's wall
    ("orzel_orlica", 24, 11, 8),                    # the white she-eagle in the stones
    ("orzel_strzaly", 22, 12, 8),                   # the black arrows with the white eye
    ("orzel_misa", 12, 12, 8),                      # the Order's stone basin (rain only - none now)
    ("orzel_plyta", 15, 8, 8),                      # the slab with the eagle over the raven, at the foot of the wall
    ("orzel_oboz", 29, 18, 8),                      # the hunters' cold camp (beside their fire ring at 30,17)
    ("orzel_klatka", 33, 16, 8),                    # the cage (W13 ch. 5: the eagle taken)
    ("orzel_ladowisko", 24, 26, 8),                 # an open square for the adult to land
]

if __name__ == "__main__":
    mp = build()
    j = mp.to_json()
    render(j, sys.argv[1] if len(sys.argv) > 1 else "gran.png", scale=float(sys.argv[2]) if len(sys.argv) > 2 else 0.5, grid=True)
