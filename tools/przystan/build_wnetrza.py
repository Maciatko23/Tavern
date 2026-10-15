# python tools/przystan/build_wnetrza.py [126 127 128]  -> tools/przystan/staging/Map126..128.json (+ _meta.json)
# The three interiors of the harbour (children of Map125), on tileset 8 like the polished town / Podgrodzie interiors
# (tools/podgrodzie/build_wnetrza.py for the shell, tools/wnetrza/rooms.py's macros for the furnishing - zones, things against the
# walls, the middle free, windows evenly spaced, every light a flame):
#   126 Chata Janka            the fisherman: the hearth with a fish soup, nets and dried fish hanging, the bed and his chest,
#                              barrels and baskets, the table with bread and a bowl, oars and a rod by the wall
#   127 Szopa przy pochylni    Roch Szkwał hides here: a straw pallet, coils of rope, a barrel of tar, crates under a tarp, a
#                              sea chart on the wall, a lantern, a small fire in a pit
#   128 Komora celna           the Lord's customs officer: the desk with the ledger, the scales and a candle, the Lord's banner,
#                              the island's map, a shelf of papers, the chest of seized goods, the stove
# Exits: the doorway in the bottom border -> Map125 in front of the house's door (facing down); the door on Map125 lands on the
# floor cell above it (facing up). Resident spots "Miejsce: <key>_wnetrze" (TownLife). Never writes data/ (install.py does).
import os, sys, json
PHERE = os.path.dirname(os.path.abspath(__file__))
PROOT = os.path.abspath(os.path.join(PHERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, PROOT + "tools/wnetrza")
sys.path.insert(0, PROOT + "tools/interiors")
import rooms as RM                  # noqa: E402  (wlib's macros: window2, hang_pole, candle_on, lantern ... and rooms' barrel, sacks ...)
from rooms import *                 # noqa: F401,F403
import ilib                         # noqa: E402

STAGING_H = os.path.join(PHERE, "staging")
HARBOUR = 125
B_WOOD, B_STONE, B_LOG = 24, 16, 33
W_PLANKS, W_PLANKS_V, W_LOGS, W_RAW, W_PLASTER_BEAM = 48, 49, 59, 71, 51
F_DARK, F_PLANKS, F_COBBLE, F_FLAGS = 83, 84, 96, 97
NOTE_HOME = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:185>"
NOTE_SHED = "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:120>\n<DarkNight:200>"


def doors():
    """key -> (Map125 door event id, the cell in front of it) from the staged harbour"""
    meta = json.load(open(os.path.join(STAGING_H, "Map125_meta.json"), encoding="utf-8"))
    return {b["key"]: (b["event_id"], tuple(b["front"])) for b in meta["buildings"] if b["interior"]}


class HInterior(ilib.Interior):
    """a harbour interior: the exit goes to Map125, the staged files to tools/przystan/staging"""
    def exit_to(self, x, door_id, town_xy, name, room=None):
        tx, ty = town_xy
        cmds = [{"code": 250, "indent": 0, "parameters": [dict(ilib.DOOR_SE)]},
                {"code": 201, "indent": 0, "parameters": [0, HARBOUR, tx, ty, 2, 0]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=cmds)]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "door": door_id, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
        self.hooks.append(("exit", x, self.H - 1))
        self.spots.setdefault("landing", [x, self.H - 2, 8])
        return e

    def look(self, x, y, name, text, floor=False):
        """something to look at: the action button pops its line up over the hero"""
        cmds = [{"code": 355, "indent": 0, "parameters": ["Tawerna.popup(%s, { color: \"info\" });" % json.dumps(text, ensure_ascii=False)]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=1 if floor else 0, trigger=0, cmds=cmds, through=not floor)]}
        self.add(x, y, e)
        return e

    def stage(self):
        os.makedirs(STAGING_H, exist_ok=True)
        path = os.path.join(STAGING_H, "Map%03d.json" % self.id)
        n = self.write(path, os.path.join(STAGING_H, "Map%03d_meta.json" % self.id))
        return path, n


def cobweb(mp, x, y, right=False):
    mp.piece("D", 15 if right else 13, 7, 1, 1, x, y, z=3, kind="pajęczyna", solid_rows=[])


# ================================================================================================ 126 Chata Janka
def chata_janka(D_):
    W, H = 13, 10
    mp = HInterior(126, W, H, "Chata Janka", "janek", note=NOTE_HOME)
    DOOR_X = 6
    mp.shell([("Izba", [(1, 4, 11, 8)], F_DARK, W_LOGS)], border=B_LOG, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    hearth_cauldron(mp, 6, 4, group=g + " ogień")
    window2(mp, 3, 1, curtain=7, length=100)
    window2(mp, 9, 1, curtain=7, length=100)
    hang_pole(mp, 2, 2, "fish", name="Suszone ryby"); hang_pole(mp, 4, 2, "fish", name="Suszone ryby")
    hang_pole(mp, 8, 2, "herbs", name="Zioła"); hang_pole(mp, 10, 2, "fish", name="Suszone ryby")
    # ---- the bed and his chest (right)
    bed(mp, (9, 13), 11, 4, group=g, kind="siennik")
    plain_chest(mp, 11, 6, group=g, name="Skrzynia Janka")
    barrel(mp, 9, 4, "cloth")
    # ---- the fisherman's corner (left): barrels of salted herring, baskets, a crate, the oars and a rod by the wall
    barrel(mp, 1, 4, "plain"); barrel(mp, 2, 4, "apples")
    mp.piece("D", 3, 10, 1, 1, 3, 4, group=g, kind="kosz na ryby")
    mp.tiles("D", 14, 3, 1, 2, 1, 6); mp.solid.add((1, 7))
    mp.look(1, 7, "Wiosła i wędka", "Para wioseł i stara wędka. Rękojeść owinięta smołowanym sznurkiem.", floor=True)
    # ---- the table: soup, bread, a candle, two stools
    table_h(mp, 8, 7, 2, style=6, group=g + " stół")
    on_top(mp, 8, 7, "D", 0, 14); on_top(mp, 9, 7, "D", 1, 15)
    candle_on(mp, 9, 8)
    stool(mp, 10, 8, group=g); stool(mp, 7, 8, group=g)
    rug_k(mp, 5, 6, 7, 7, RUG_BROWN)
    doormat(mp, 6, 8)
    cobweb(mp, 1, 1)
    mp.resident("janek", 4, 6, 6)
    door_id, front = D_["janek"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Przystań")
    return mp


# ================================================================================================ 127 Szopa przy pochylni
def szopa(D_):
    W, H = 12, 9
    mp = HInterior(127, W, H, "Szopa przy pochylni", "szopa", note=NOTE_SHED)
    DOOR_X = 5
    mp.shell([("Szopa", [(1, 4, 10, 7)], F_PLANKS, W_PLANKS_V)], border=B_WOOD, exit_x=DOOR_X)
    mp.shadows()
    g = "Szopa"
    window2(mp, 8, 1, curtain=None, length=80, style="small")
    lantern(mp, 3, 2, style=0, light=L_LANTERN_SMALL, name="Latarnia z kutra")
    mp.tprop("mapa_wyspy", 6, 2, group=g, name="Mapa morska")
    mp.look(6, 3, "Mapa morska", "Mapa wyspy i wybrzeża lądu. Ktoś zakreślił węglem przejście między mieliznami.")
    # ---- Roch's pallet and his things (left)
    bed(mp, (9, 13), 1, 4, group=g, kind="siennik")
    mp.piece("D", 14, 4, 1, 1, 2, 4, group=g, kind="tobołek")
    # ---- the boatyard's stores (right): a barrel of tar, coils of rope, crates under a tarp, planks
    barrel(mp, 10, 4, "plain")
    mp.look(10, 4, "Beczka smoły", "Pusta beczka po smole. Na dnie zostało tyle, co kot napłakał.", floor=True)
    barrel(mp, 9, 4, "cloth")
    crate(mp, 10, 6, "two")
    mp.look(9, 6, "Skrzynie pod płótnem", "Pod płótnem puste skrzynie z wypalonym znakiem. Ktoś je już raz otwierał.")
    sacks(mp, 1, 7, wide=False)
    mp.piece("D", 10, 2, 1, 2, 2, 6, group=g, kind="worek", solid_rows=[1])
    # ---- the fire pit in the middle (a small flame, the only warmth) and a stool
    campfire(mp, 5, 5, group=g)
    stool(mp, 7, 6, small=True, group=g)
    cobweb(mp, 1, 1); cobweb(mp, 10, 1, right=True)
    doormat(mp, 5, 7)
    mp.resident("przemytnik", 6, 6, 4)
    door_id, front = D_["szopa"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Przystań")
    return mp


# ================================================================================================ 128 Komora celna
def komora(D_):
    W, H = 12, 9
    mp = HInterior(128, W, H, "Komora celna", "komora", note=NOTE_HOME)
    DOOR_X = 5
    mp.shell([("Komora", [(1, 4, 10, 7)], F_FLAGS, W_PLASTER_BEAM)], border=B_STONE, exit_x=DOOR_X)
    mp.shadows()
    g = "Komora"
    window2(mp, 2, 1, curtain=3, length=90)
    window2(mp, 9, 1, curtain=3, length=90)
    banner(mp, 5, 2, 0, group=g)                         # the Lord's banner: red, a black rearing horse
    mp.tprop("mapa_wyspy", 7, 2, group=g, name="Mapa Kruczej Wyspy")
    # ---- the desk with the ledger, the scales and a candle; the officer behind it
    table_h(mp, 4, 5, 3, style=6, group=g + " biurko")
    on_top(mp, 4, 5, "D", 6, 11); on_top(mp, 5, 5, "D", 4, 14); on_top(mp, 6, 5, "D", 7, 13)
    candle_on(mp, 6, 5)
    mp.look(5, 6, "Księga celna", "Księga celna: „dwa grosze od tobołka”, nazwiska z promu i osobna kolumna: „kamienie z krukiem”.")
    # ---- papers and the chest of seized goods (left), the stove (right)
    bookcase(mp, 1, 4, w=1)
    shelf_tall(mp, 2, 4, "books")
    plain_chest(mp, 1, 7, group=g, name="Skrzynia z zatrzymanym towarem")
    mp.look(1, 6, "Skrzynia z zatrzymanym towarem",
            "Zatrzymany towar: noże, sól, dwa kamienie z krukiem w woreczku. Na wieku pieczęć Lorda.")
    fireplace_pic(mp, 9, 4, kind=2, group=g)
    sacks(mp, 10, 7, wide=False)
    rug_k(mp, 4, 6, 6, 6, RUG_RED)
    doormat(mp, 5, 7)
    mp.resident("celnik", 5, 4, 2)
    door_id, front = D_["komora"]
    mp.exit_to(DOOR_X, door_id, front, "Drzwi -> Przystań")
    return mp


BUILDERS = {126: chata_janka, 127: szopa, 128: komora}
NAMES = {126: "Chata Janka", 127: "Szopa przy pochylni", 128: "Komora celna"}


def main():
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(BUILDERS)
    D_ = doors()
    for i in ids:
        mp = BUILDERS[i](D_)
        path, n = mp.stage()
        print("Map%03d %s: %dx%d, %d zdarzeń -> %s" % (i, mp.display, mp.W, mp.H, n, os.path.relpath(path, PROOT)))


if __name__ == "__main__":
    main()
