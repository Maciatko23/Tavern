# python tools/podgrodzie/build_wnetrza.py [112 113 ...]  -> tools/podgrodzie/staging/Map112..117.json (+ _meta.json)
# The six interiors of Podgrodzie (children of Map111), poor wooden rooms on tileset 8 in the manner of the town's interiors
# (tools/interiors: ilib's Interior on grandpa's cottage shell - log / plank wall faces 3 rows tall, the dark rim border,
# windows with a sunbeam by day, a hearth with its glow, things against the walls, the middle free). Each one fits its
# owner (docs/podgrodzie/MIEJSCA.md, js/plugins/TownLife_Data.js):
#   112 Chata praczki      Marta Ługowa and Franek: two straw pallets, baskets of washing, clothes on pegs, sacks of ash
#                          and sand (water is carried from the town - no tubs of it standing here), the hearth with the pot
#   113 Chata drwala       Zbych Smolarz: axes on the wall, firewood, sacks and heaps of charcoal, a pelt by the fire
#   114 Chata kłusownika   Rysiek Sidło: hides on frames, a bow and snares on the wall, hams hanging, a fire pit, pelts
#   115 Izba znachorki     babka Jadwiga: shelves of herb jars, bundles of herbs and garlic, the brewing cauldron, a bench
#   116 Kram starzyzny     Józek Łata: a counter of junk, broken crates, old shields and swords, chains, a ladder
#   117 Dom uchodźców      Darin and the others: straw pallets side by side, a screen for some privacy, bundles, a small fire
# Exits: the doorway in the bottom border -> Podgrodzie in front of the house's door (facing down); the door on Map111 lands
# on the floor cell above it (facing up). Resident spots "Miejsce: <key>_wnetrze". Never writes data/ (install.py does).
import os, sys, json
PHERE = os.path.dirname(os.path.abspath(__file__))
PROOT = os.path.abspath(os.path.join(PHERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, PROOT + "tools/interiors")
from ilib import *     # noqa: F401,F403  (Interior, the cottage / tavern macros, B C D E, kinds via build_interiors)
import ilib

STAGING_P = os.path.join(PHERE, "staging")   # (the star import brings the tavern's HERE)
POD = 111
B_WOOD, B_STONE, B_LOG = 24, 16, 33
W_PLANKS, W_PLANKS_V, W_LOGS, W_RAW, W_PLASTER_BEAM = 48, 49, 59, 71, 51
F_DARK, F_PLANKS, F_COBBLE, F_FLAGS = 83, 84, 96, 97
RUG_MAT, RUG_BROWN = 37, 21
NOTE_POOR = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:185>"

def doors():
    """key -> (Map111 door event id, the cell in front of it) from the staged Podgrodzie"""
    meta = json.load(open(os.path.join(STAGING_P, "Map111_meta.json"), encoding="utf-8"))
    return {b["key"]: (b["event_id"], tuple(b["front"])) for b in meta["buildings"] if b["interior"]}


class PInterior(Interior):
    """a Podgrodzie interior: the exit goes to Map111, the staged files to tools/podgrodzie/staging"""
    def exit_to(self, x, door_id, town_xy, name, room=None):
        tx, ty = town_xy
        cmds = [{"code": 250, "indent": 0, "parameters": [dict(DOOR_SE)]},
                {"code": 201, "indent": 0, "parameters": [0, POD, tx, ty, 2, 0]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=cmds)]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "door": door_id, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
        self.hooks.append(("exit", x, self.H - 1))
        self.spots.setdefault("landing", [x, self.H - 2, 8])
        return e

    def stage(self):
        os.makedirs(STAGING_P, exist_ok=True)
        path = os.path.join(STAGING_P, "Map%03d.json" % self.id)
        n = self.write(path, os.path.join(STAGING_P, "Map%03d_meta.json" % self.id))
        return path, n

def wall_piece(mp, sheet, c, r, w, h, x, y, group, kind):
    """a thing hung on a wall face (no floor cell taken)"""
    mp.piece(sheet, c, r, w, h, x, y, group=group, kind=kind, solid_rows=[], cat="wallitem")
    mp.wall_items.append((group, kind, x, y))

def cobweb(mp, x, y, right=False):
    mp.piece("D", 15 if right else 13, 7, 1, 1, x, y, z=3, kind="pajęczyna", solid_rows=[])


# ================================================================================================ 112 Chata praczki
def praczka(D_):
    W, H = 13, 10
    mp = PInterior(112, W, H, "Chata praczki", "praczka", note=NOTE_POOR)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_DARK, W_LOGS)], border=B_LOG, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    hearth_cauldron(mp, 6, 4, group=g + " drewno")
    window(mp, 3, 1, curtain=7, group=g + " okna", length=100, style="small")
    window(mp, 9, 1, curtain=7, group=g + " okna", length=100, style="small")
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    mp.hprop("kolki_ubrania", 3, 3, group=g + " kołki")
    mp.hprop("kolki_ubrania", 9, 3, group=g + " kołki")
    # the washing: baskets and covered crates of other people's linen, sacks of ash and sand, an empty bucket, the broom
    mp.piece("D", 14, 3, 1, 2, 10, 3, group=g, kind="skrzynia z bielizną")
    mp.piece("D", 15, 0, 1, 2, 2, 3, group=g, kind="beczka przykryta płótnem")
    mp.piece("D", 8, 2, 2, 2, 9, 7, group=g + " worki", kind="worki z popiołem i piaskiem", solid_rows=[1])
    mp.piece("D", 10, 4, 1, 1, 11, 8, group=g, kind="puste wiadro")
    mp.piece("D", 3, 10, 1, 1, 3, 4, group=g, kind="kosz z praniem")
    mp.piece("D", 7, 6, 1, 2, 11, 6, group=g, kind="miotła")
    # the table by the left wall with two stools, a bowl of thin soup
    table_h(mp, 2, 6, 2, style=6, group=g + " stół")
    stool(mp, 4, 6, group=g + " stołki")
    on_table(mp, 2, 6, "D", 0, 14); on_table(mp, 3, 6, "D", 1, 15)
    rug(mp, 5, 6, 7, 7, RUG_MAT)
    mp.resident("praczka", 8, 6, 4)
    mp.resident("franek", 10, 5, 2)
    door_id, front = D_["praczka"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Podgrodzie")
    return mp


# ================================================================================================ 113 Chata drwala
def drwal(D_):
    W, H = 13, 10
    mp = PInterior(113, W, H, "Chata drwala", "drwal", note=NOTE_POOR)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_DARK, W_LOGS)], border=B_LOG, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    fireplace_pic(mp, 6, 4, kind=2, group=g)
    firewood(mp, 5, 4, group=g + " drewno"); firewood(mp, 7, 4, group=g + " drewno")
    window(mp, 2, 1, curtain=None, group=g + " okna", length=100, style="small")
    window(mp, 10, 1, curtain=None, group=g + " okna", length=100, style="small")
    wall_piece(mp, "E", 15, 8, 1, 2, 3, 2, g + " siekiery", "siekiera na ścianie")
    wall_piece(mp, "E", 15, 8, 1, 2, 9, 2, g + " siekiery", "siekiera na ścianie")
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    # the charcoal: sacks, a heap of lumps in the corner, a bundle of split logs
    mp.piece("D", 8, 2, 2, 2, 1, 3, group=g + " worki", kind="worki z węglem drzewnym", solid_rows=[1])
    mp.piece("D", 11, 8, 2, 1, 1, 8, group=g, kind="kupa węgla drzewnego")
    mp.piece("D", 10, 5, 1, 1, 10, 4, group=g, kind="wiązka polan")
    mp.piece("D", 11, 5, 1, 1, 9, 4, group=g, kind="bryłki węgla", solid_rows=[])
    # the table with bread, a stool; a pelt before the fire
    table_h(mp, 8, 7, 2, style=6, group=g + " stół")
    stool(mp, 10, 8, group=g + " stołki")
    on_table(mp, 8, 7, "D", 5, 10); on_table(mp, 9, 7, "D", 1, 15)
    mp.piece("D", 9, 14, 2, 2, 5, 6, z=1, group=g, kind="skóra przed ogniem", solid_rows=[])
    cobweb(mp, 1, 1)
    mp.resident("drwal", 4, 6, 6)
    door_id, front = D_["drwal"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Podgrodzie")
    return mp


# ================================================================================================ 114 Chata kłusownika
def klusownik(D_):
    W, H = 12, 10
    mp = PInterior(114, W, H, "Chata kłusownika", "klusownik", note=NOTE_DIM)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 10, 8)], F_DARK, W_LOGS)], border=B_LOG, exit_x=DOOR_X)
    mp.shadows()
    g = "Izba"
    cauldron_fire(mp, 6, 5, group=g)
    window(mp, 8, 1, curtain=None, group=g + " okno", length=90, style="shutters")
    hang(mp, 3, 2, "hams", group=g + " zapasy")
    hang(mp, 5, 2, "fish", group=g + " zapasy")
    wall_piece(mp, "E", 15, 11, 1, 2, 10, 2, g + " łuk", "łuki na ścianie")
    mp.piece("D", 10, 6, 1, 1, 1, 2, z=3, group=g, kind="wnyki na ścianie", solid_rows=[])
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    mp.tprop("skora_rama", 9, 4, group=g + " skóry")
    mp.tprop("skora_rama2", 10, 4, group=g + " skóry")
    mp.piece("D", 9, 12, 2, 2, 3, 6, z=1, group=g, kind="skóra wilka", solid_rows=[])
    mp.piece("D", 14, 0, 1, 2, 10, 7, group=g, kind="beczka z solonym mięsem")
    mp.piece("D", 12, 3, 1, 2, 1, 7, group=g, kind="skrzynia z sidłami")
    mp.piece("D", 9, 4, 1, 1, 9, 8, group=g, kind="worki")
    stool(mp, 7, 6, small=True, group=g)
    cobweb(mp, 10, 1, right=True)
    mp.resident("klusownik", 2, 5, 4)
    door_id, front = D_["klusownik"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Podgrodzie")
    return mp


# ================================================================================================ 115 Izba znachorki
def znachorka(D_):
    W, H = 13, 10
    mp = PInterior(115, W, H, "Izba znachorki", "znachorka", note=NOTE_POOR)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_DARK, W_PLANKS)], border=B_WOOD, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    hearth_cauldron(mp, 6, 4, group=g + " drewno")
    window(mp, 10, 1, curtain=1, group=g + " okna", length=110, style="small")
    hang(mp, 2, 2, "herbs", group=g + " zioła"); hang(mp, 3, 2, "garlic", group=g + " zioła"); hang(mp, 4, 2, "herbs", group=g + " zioła")
    # the herb jars: the shelf on the right wall, a small counter with jars and potions
    mp.piece("E", 9, 3, 1, 2, 1, 4, group=g, kind="ladka ze słojami")
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    mp.piece("D", 4, 4, 1, 2, 8, 2, z=3, group=g + " półki", kind="półka ze słojami", solid_rows=[])
    mp.piece("D", 6, 4, 1, 2, 9, 2, z=3, group=g + " półki2", kind="półka z garnuszkami", solid_rows=[])
    table_h(mp, 2, 7, 2, style=6, group=g + " stół")
    on_table(mp, 2, 7, "D", 0, 12); on_table(mp, 3, 7, "D", 4, 13)
    stool(mp, 4, 8, group=g + " stołki")
    plant(mp, 4, 4, group=g, kind=0)
    bench_h(mp, 9, 8, group=g + " ława")
    mp.piece("D", 3, 10, 1, 1, 10, 5, group=g, kind="kosz z ziołami")
    rug(mp, 5, 6, 7, 7, RUG_MAT)
    mp.resident("znachorka", 7, 6, 8)
    door_id, front = D_["znachorka"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Podgrodzie")
    return mp


# ================================================================================================ 116 Kram starzyzny
def szmaciarz(D_):
    W, H = 14, 10
    mp = PInterior(116, W, H, "Kram starzyzny", "szmaciarz", note=NOTE_POOR)
    DOOR_X = 7
    mp.shell([("Kram", [(1, 4, 12, 8)], F_DARK, W_PLANKS)], border=B_WOOD, exit_x=DOOR_X)
    mp.shadows()
    g = "Kram"
    window(mp, 11, 1, curtain=None, group=g + " okno", length=100, style="small")
    # the old shields and swords on the back wall, the bottles on a shelf
    for x, (c, r) in ((2, (0, 0)), (4, (2, 0)), (6, (3, 0))):
        wall_piece(mp, "D", c, r, 1, 1, x, 2, g + " tarcze", "stara tarcza")
    mp.piece("D", 6, 0, 1, 1, 9, 2, z=3, group=g + " półki", kind="półka z butelkami", solid_rows=[])
    # the counter (x 3..8, top row 5, front 6) with his junk on it; his place behind it
    counter_h(mp, 3, 8, 5, group=g + " lada")
    on_table(mp, 3, 5, "D", 4, 14); on_table(mp, 5, 5, "D", 0, 12); on_table(mp, 6, 5, "D", 5, 12); on_table(mp, 8, 5, "D", 7, 14)
    # heaps of junk along the walls
    mp.piece("D", 13, 5, 1, 2, 1, 3, group=g, kind="połamana skrzynia")
    mp.piece("D", 14, 5, 2, 2, 10, 3, group=g, kind="połamane skrzynie i kamienie")
    mp.piece("E", 13, 8, 1, 2, 12, 3, group=g, kind="stare miecze")
    mp.piece("D", 8, 13, 1, 3, 1, 6, group=g, kind="drabina", solid_rows=[2])
    mp.piece("D", 14, 11, 2, 2, 11, 7, group=g, kind="skrzynie")
    mp.piece("D", 9, 6, 1, 1, 12, 6, z=3, group=g, kind="łańcuchy", solid_rows=[])
    mp.piece("D", 8, 0, 2, 2, 2, 7, group=g, kind="beczki", solid_rows=[1])
    mp.piece("D", 9, 4, 1, 1, 10, 6, group=g, kind="worki")
    mp.piece("D", 11, 6, 1, 1, 9, 8, group=g, kind="kamienie", solid_rows=[])
    mp.resident("szmaciarz", 5, 4, 2)
    door_id, front = D_["szmaciarz"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Podgrodzie")
    return mp


# ================================================================================================ 117 Dom uchodźców
def uchodzcy(D_):
    W, H = 16, 11
    mp = PInterior(117, W, H, "Dom uchodźców", "uchodzcy", note=NOTE_POOR)
    DOOR_X = 8
    mp.shell([("Izba", [(1, 4, 14, 9)], F_DARK, W_PLANKS_V)], border=B_WOOD, exit_x=DOOR_X)
    mp.shadows()
    g = "Izba"
    cauldron_fire(mp, 8, 5, group=g)
    window(mp, 4, 1, curtain=7, group=g + " okna", length=100, style="small")
    window(mp, 12, 1, curtain=7, group=g + " okna", length=100, style="small")
    # the pallets side by side: three on the left, two on the right behind the screen
    for x in (1, 2, 3):
        bed(mp, (9, 13), x, 4, group=g + " posłania", kind="siennik")
    for x in (13, 14):
        bed(mp, (9, 13), x, 4, group=g + " posłania", kind="siennik")
    mp.piece("D", 8, 10, 1, 1, 3, 6, group=g, kind="pluszowy miś (dziecka)", solid_rows=[])
    mp.piece("C", 4, 13, 2, 3, 11, 5, group=g, kind="parawan", solid_rows=[2])
    # bundles of the ones who came on the ferry, empty buckets, a crate for a table
    mp.piece("D", 8, 2, 2, 2, 1, 8, group=g + " tobołki", kind="tobołki", solid_rows=[1])
    mp.piece("D", 14, 4, 1, 1, 5, 4, group=g + " tobołki", kind="tobołek")
    mp.piece("D", 10, 2, 1, 2, 14, 8, group=g + " tobołki", kind="worek", solid_rows=[1])
    mp.piece("D", 10, 4, 1, 1, 6, 4, group=g, kind="puste wiadro")
    mp.piece("D", 12, 3, 1, 2, 10, 8, group=g, kind="skrzynia (za stół)")

    stool(mp, 11, 9, small=True, group=g)
    bench_h(mp, 4, 8, group=g + " ława")
    mp.piece("D", 3, 10, 1, 1, 6, 9, group=g, kind="kosz")
    mp.piece("D", 0, 12, 1, 1, 9, 6, group=g, kind="garnek przy ogniu", solid_rows=[])
    mp.piece("D", 9, 4, 1, 1, 13, 9, group=g + " tobołki", kind="worki")
    rug(mp, 6, 6, 10, 7, RUG_MAT)
    cobweb(mp, 1, 1); cobweb(mp, 14, 1, right=True)
    mp.resident("uchodzca", 7, 7, 2)
    door_id, front = D_["uchodzcy"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Podgrodzie")
    return mp


BUILDERS = {112: praczka, 113: drwal, 114: klusownik, 115: znachorka, 116: szmaciarz, 117: uchodzcy}
NAMES = {112: "Chata praczki", 113: "Chata drwala", 114: "Chata kłusownika", 115: "Izba znachorki", 116: "Kram starzyzny",
         117: "Dom uchodźców"}

def main():
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(BUILDERS)
    D_ = doors()
    for i in ids:
        mp = BUILDERS[i](D_)
        path, n = mp.stage()
        print("Map%03d %s: %dx%d, %d zdarzeń -> %s" % (i, mp.display, mp.W, mp.H, n, os.path.relpath(path, PROOT)))

if __name__ == "__main__":
    main()
