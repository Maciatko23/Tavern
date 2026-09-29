# python build_house.py [A] [B] [--daynight-on]  -> tools/house/staging/Map019_<X>.json (+ _meta.json for check_house.py)
# Grandpa's cottage interior (Map019 "Dom dziadka - Wnętrze"), two concepts for the user to choose from:
#   A "Chata z bali"  - a log cottage: the izba (main room) and, behind a wooden partition with a doorway, the komora
#                       (sleeping chamber): the two beds in two niches split by a short plank wall, stores at its back;
#   B "Bielona chata" - a whitewashed cottage: the izba across the whole house and two sleeping alcoves (wnęki) set
#                       into its north side, one each side of the hearth, linen curtains tied back at their fronts.
# Tileset 8 (Winlu Fantasy Interior Remaster); passability from the installed tileset-8 flags (no blocker events).
# Never writes data/ or js/plugins.js.
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from houselib import *

# Lighting: RoomLighting follows the hour through <DarkDay>/<DarkNight> (so <LightWhen:night> candles and the
# <LightCone ... when=day> sunbeams work). <DayNight:off> like the tavern: with <DayNight:on> Farming_Render's night
# layer (0.9 black from 20:00, blind to RoomLighting's lamps) covers the whole room - see docs/dom_dziadka/oswietlenie.png.
# --daynight-on builds the literal note of today's Map019 (plus DarkDay/DarkNight) instead.
DAYNIGHT_ON = "--daynight-on" in sys.argv
NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:%s>\n<Zoom:1.5>\n<DarkDay:60>\n<DarkNight:175>" % ("on" if DAYNIGHT_ON else "off")


# ================================================================================================ A: log cottage
def concept_a():
    W, H = 21, 13
    mp = House(W, H, NOTE, "A")
    LOG_BORDER, LOGS, PLANKS, STONE, BOARDS = 33, 59, 49, 71, 84
    DOOR_X = 6
    rooms = [
        ("Izba", [(1, 4, 11, 11)], BOARDS, LOGS),
        ("Komora", [(13, 4, 19, 11), ("-", (16, 4, 16, 5))], BOARDS, LOGS),
    ]
    openings = [("Izba", (12, 8, 12, 9))]
    mp.shell(rooms, openings, border=LOG_BORDER, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(16, 3, 16, 5), PLANKS)          # the short plank wall between the two beds
    mp.restyle_face(mp.rect(5, 1, 7, 3), STONE)              # the stone chimney breast
    mp.shadows()
    mp.zone("Izba", 1, 4, 11, 11, (230, 170, 90)); mp.zone("Komora", 13, 4, 19, 11, (150, 190, 230))
    mp.axes = [("Izba", 13), ("Komora", 33)]                  # mirror axes in half cells: the hearth x 6, the plank wall x 16
    g = "Izba"
    # ---- izba, north wall (symmetric about the hearth, x 6): kredens + plate shelves | window | herbs | HEARTH |
    #      garlic | window | pantry shelf + jar shelves
    mp.piece("C", 3, 9, 2, 2, 1, 3, group=g, kind="kredens z talerzami")
    mp.piece("D", 6, 2, 1, 2, 1, 1, group=g + " półki", kind="półka z talerzami", solid_rows=[])
    mp.piece("D", 7, 2, 1, 2, 2, 1, group=g + " półki", kind="półka z dzbankiem", solid_rows=[])
    window(mp, 3, 1, curtain=1, group=g + " okna"); sill_pot(mp, 3, 1, 1, group=g + " doniczki")
    hang(mp, 4, 2, "herbs", group=g + " zioła")
    hearth_cauldron(mp, 6, 4, group=g + " drewno")
    hang(mp, 8, 2, "garlic", group=g + " zioła")
    window(mp, 9, 1, curtain=1, group=g + " okna"); sill_pot(mp, 9, 1, 2, group=g + " doniczki")
    mp.piece("C", 4, 4, 2, 2, 10, 3, group=g, kind="półka ze spiżarką")
    mp.piece("D", 4, 4, 1, 2, 10, 1, group=g + " półki", kind="półka ze słojami", solid_rows=[])
    mp.piece("D", 6, 4, 1, 2, 11, 1, group=g + " półki", kind="półka z garnkami", solid_rows=[])
    # grandpa's side of the fire: his rocking chair against the wall, the little table with his pipe beside it
    mp.hprop("fotel_bujany", 8, 4, group=g, name="Fotel dziadka")
    pipe_table(mp, 9, 4, group=g)
    rug(mp, 5, 5, 7, 6, 37)
    mp.hprop("kolowrotek", 2, 6, group=g, name="Kołowrotek")
    # the table with benches, a candle and a bowl on it
    table_h(mp, 2, 9, 4, style=4, group=g + " stół")
    bench_h(mp, 2, 8, group=g + " ławy"); bench_h(mp, 4, 8, group=g + " ławy")
    bench_h(mp, 2, 11, group=g + " ławy"); bench_h(mp, 4, 11, group=g + " ławy")
    candle(mp, 3, 10, group=g + " świece")
    on_table(mp, 4, 9, "D", 0, 13)
    # by the door: the broom, the butter churn, the water barrel with its ladle in the corner; the old chest by the
    # partition; a woven runner from the door towards the hearth
    mp.piece("D", 7, 6, 1, 2, 9, 10, group=g, kind="miotła")
    mp.hprop("maselnica", 10, 11, group=g)
    mp.piece("D", 13, 0, 1, 2, 11, 10, group=g, kind="beczka z wodą")
    mp.prop("chochla", 11, 11, group=g)
    plain_chest(mp, 11, 7, group=g)
    rug(mp, DOOR_X, 8, DOOR_X, 11, 37)
    mp.exit_door(DOOR_X)
    # ---- komora: grandpa's niche (x 13..15) | plank wall with the holy picture (16) | the hero's niche (17..19)
    k = "Komora"
    bed(mp, (13, 10), 13, 4, w=2, group=k, kind="łóżko dziadka"); patchwork(mp, 13, 4, group=k)
    nightstand_candle(mp, 15, 4, group=k)
    window(mp, 15, 1, curtain=1, group=k + " okna", length=110)
    thing(mp, 16, 4, "!Decoration_static", 6, 8, 2, "Obrazek Matki Boskiej", kind="obrazek", group=k, floor=False)
    window(mp, 17, 1, curtain=1, group=k + " okna", length=110)
    stool_candle(mp, 17, 4, group=k)
    bed(mp, (9, 13), 18, 4, group=k, kind="siennik")
    mp.sleep_bed([(18, 4), (18, 5)])
    mp.hprop("kolki_ubrania", 19, 3, group=k)
    plain_chest(mp, 19, 4, group=k, name="Skrzynka")
    plain_chest(mp, 13, 6, group=k, name="Skrzynia dziadka")
    rug(mp, 15, 7, 17, 8, 37)
    # the stores at the back of the chamber: barrels, sacks; the wash tub by the wall
    mp.piece("D", 10, 0, 3, 2, 17, 10, group=k + " zapasy", kind="beczki")
    mp.piece("D", 8, 3, 2, 1, 13, 11, group=k + " zapasy", kind="worki")
    mp.prop("cebrzyk", 13, 10, group=k)
    washstand(mp, 19, 7, group=k)
    # ---- spots
    mp.pins = [("Drzwi na podwórze", 6, 12), ("Palenisko z kotłem", 6, 4), ("Fotel bujany dziadka i fajka", 8, 4),
               ("Kredens z talerzami", 1.5, 4), ("Półka ze spiżarką", 10.5, 4), ("Kołowrotek", 2, 6), ("Stół z ławami", 3.5, 9.5),
               ("Maselnica, beczka z wodą, miotła", 10, 11), ("Przejście do komory", 12, 8.5),
               ("Łóżko dziadka (kołdra z łatek)", 13.5, 4.5), ("Ścianka z obrazkiem", 16, 4), ("Siennik bohatera - sen", 18, 4.5),
               ("Kołki z ubraniem", 19, 3), ("Zapasy: beczki i worki", 18, 10.5), ("Umywalka", 19, 7)]
    mp.spot("grandpa", 8, 5, 4)
    mp.spot("start", 17, 5, 6)
    mp.spot("render_hero", 7, 5, 6)
    return mp


# ================================================================================================ B: whitewashed cottage
def concept_b(wall=64):
    W, H = 19, 13
    mp = House(W, H, NOTE, "B")
    BORDER, STONE, PLANKS, BOARDS = 24, 71, 49, 84
    DOOR_X = 9
    rooms = [("Izba", [(1, 4, 17, 11), ("-", (4, 4, 4, 6)), ("-", (14, 4, 14, 6))], BOARDS, wall)]
    mp.shell(rooms, border=BORDER, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(8, 1, 10, 3), STONE)             # the stone chimney breast
    mp.restyle_face(mp.rect(4, 4, 4, 6) | mp.rect(14, 4, 14, 6), PLANKS)   # the two plank partitions of the alcoves
    mp.shadows()
    mp.zone("Izba", 1, 4, 17, 11, (230, 170, 90))
    mp.zone("Wnęka bohatera", 1, 4, 3, 6, (150, 230, 150)); mp.zone("Wnęka dziadka", 15, 4, 17, 6, (150, 190, 230))
    mp.axes = [("Izba", 19)]
    g = "Izba"
    # ---- the north wall between the partitions (x 5..13), symmetric about the hearth (x 9)
    mp.piece("C", 3, 9, 2, 2, 5, 3, group=g, kind="kredens z talerzami")
    mp.piece("D", 6, 2, 1, 2, 5, 1, group=g + " półki", kind="półka z talerzami", solid_rows=[])
    mp.piece("D", 7, 2, 1, 2, 6, 1, group=g + " półki", kind="półka z dzbankiem", solid_rows=[])
    window(mp, 7, 1, curtain=1, group=g + " okna"); sill_pot(mp, 7, 1, 1, group=g + " doniczki")
    hearth_cauldron(mp, 9, 4, group=g + " drewno")
    hang(mp, 8, 2, "herbs", group=g + " zioła"); hang(mp, 10, 2, "garlic", group=g + " zioła")
    window(mp, 11, 1, curtain=1, group=g + " okna"); sill_pot(mp, 11, 1, 2, group=g + " doniczki")
    mp.piece("C", 4, 4, 2, 2, 12, 3, group=g, kind="półka ze spiżarką")
    mp.piece("D", 4, 4, 1, 2, 12, 1, group=g + " półki", kind="półka ze słojami", solid_rows=[])
    mp.piece("D", 6, 4, 1, 2, 13, 1, group=g + " półki", kind="półka z garnkami", solid_rows=[])
    # the spinning wheel under the left window, the butter churn under the right one (by the food shelf); the rug
    # before the fire; grandpa's rocking chair beside it with the little table and his pipe
    mp.piece("D", 9, 5, 1, 1, 7, 4, group=g, kind="wiadro z wodą")
    mp.hprop("maselnica", 11, 4, group=g)
    rug(mp, 8, 5, 10, 6, 37)
    mp.hprop("fotel_bujany", 11, 6, group=g, name="Fotel dziadka")
    pipe_table(mp, 12, 6, group=g)
    # the table (west, below the hero's alcove)
    table_h(mp, 2, 9, 4, style=4, group=g + " stół")
    bench_h(mp, 2, 8, group=g + " ławy"); bench_h(mp, 4, 8, group=g + " ławy")
    bench_h(mp, 2, 11, group=g + " ławy"); bench_h(mp, 4, 11, group=g + " ławy")
    candle(mp, 3, 10, group=g + " świece")
    on_table(mp, 4, 9, "D", 0, 13)
    # east: grandpa's chest by his alcove, the stores in the corner, the water barrel and the broom by the door
    plain_chest(mp, 17, 8, group=g, name="Skrzynia dziadka")
    mp.hprop("kolowrotek", 15, 8, group=g, name="Kołowrotek")
    stool(mp, 15, 9, group=g + " stołki")
    mp.piece("D", 10, 0, 3, 2, 15, 10, group=g + " zapasy", kind="beczki")
    mp.piece("D", 8, 3, 2, 1, 13, 11, group=g + " zapasy", kind="worki")
    mp.piece("D", 13, 0, 1, 2, 12, 10, group=g, kind="beczka z wodą")
    mp.prop("chochla", 12, 11, group=g)
    mp.piece("D", 7, 6, 1, 2, 7, 10, group=g, kind="miotła")
    rug(mp, DOOR_X, 8, DOOR_X, 11, 37)
    mp.exit_door(DOOR_X)
    # ---- the west alcove: the hero's straw bed, his stool with a candle, his clothes on the pegs, the linen curtains
    a = "Wnęka bohatera"
    bed(mp, (9, 13), 1, 4, group=a, kind="siennik")
    stool_candle(mp, 2, 4, group=a)
    window(mp, 2, 1, curtain=1, group=a + " okno", length=90)
    mp.hprop("kolki_ubrania", 3, 3, group=a)
    plain_chest(mp, 1, 6, group=a, name="Skrzynka")
    mp.sleep_bed([(1, 4), (1, 5)])
    drape(mp, 1, 6, "L", group=a); drape(mp, 3, 6, "R", group=a)
    # ---- the east alcove: grandpa's bed, the nightstand with a candle under the holy picture
    a = "Wnęka dziadka"
    bed(mp, (13, 10), 16, 4, w=2, group=a, kind="łóżko dziadka"); patchwork(mp, 16, 4, group=a)
    nightstand_candle(mp, 15, 4, group=a)
    thing(mp, 15, 2, "!Decoration_static", 6, 8, 2, "Obrazek Matki Boskiej", kind="obrazek", group=a, floor=False)
    window(mp, 16, 1, curtain=1, group=a + " okno", length=90)
    drape(mp, 15, 6, "L", group=a); drape(mp, 17, 6, "R", group=a)
    # ---- spots
    mp.pins = [("Drzwi na podwórze", 9, 12), ("Palenisko z kotłem", 9, 4), ("Fotel bujany dziadka i fajka", 11.5, 6),
               ("Kredens z talerzami", 5.5, 4), ("Półka ze spiżarką", 12.5, 4), ("Wiadro z wodą", 7, 4), ("Maselnica", 11, 4),
               ("Stół z ławami", 3.5, 9.5), ("Kołowrotek", 15, 8.5), ("Skrzynia dziadka", 17, 8), ("Zapasy i beczka z wodą", 14.5, 10.5),
               ("Wnęka bohatera: siennik (sen)", 1, 4.5), ("Kołki z ubraniem", 3, 3), ("Wnęka dziadka: łóżko z łatek", 16.5, 4.5),
               ("Obrazek i świeca", 15, 2.5), ("Drewniane ścianki i lniane zasłony", 4, 5)]
    mp.spot("grandpa", 10, 6, 4)
    mp.spot("start", 2, 5, 4)
    mp.spot("render_hero", 9, 6, 6)
    return mp


CONCEPTS = {"A": concept_a, "B": concept_b}

def main():
    which = [a for a in sys.argv[1:] if a in CONCEPTS] or sorted(CONCEPTS)
    os.makedirs(STAGING, exist_ok=True)
    suffix = "_daynight" if DAYNIGHT_ON else ""          # (the literal-note variant, only for the lighting comparison)
    for c in which:
        mp = CONCEPTS[c]()
        n = mp.write(os.path.join(STAGING, "Map019_%s%s.json" % (c, suffix)), os.path.join(STAGING, "Map019_%s%s_meta.json" % (c, suffix)))
        print("Map019_%s%s: %dx%d, %d events" % (c, suffix, mp.W, mp.H, n))

if __name__ == "__main__":
    main()
