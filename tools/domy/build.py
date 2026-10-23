# python tools/domy/build.py [154 169]  -> tools/domy/staging/MapNNN.json (+ _meta.json) and domy.json
# The two homes after the field (Homes.js, the user 2026-10-15: no house in the town - "gdzie tam miejsce na pole z tyłu" -, a hut
# on Podgrodzie with a plot beside it and the burnt farm of the Ług family to buy through the quest D21 and rebuild):
#   154 Chata pod lasem (wnętrze)  Podgrodzie's new log hut under the forest (tools/domy/podgrodzie_zagroda.py put it on Map111's
#                                  added rows): plank walls, the hearth, a table, pegs; the door (bottom) -> Map111 (8,81). The
#                                  bed and the chest are Farming's furniture, put in when the hut is bought (Homes.js HOUSES)
#   169 Dom Ługów (wnętrze)        the rebuilt house of the burnt farm (Map168, tools/domy/ruina.py): new log walls, the hearth, a
#                                  table with stools; the door -> Map168 (20,10), before the house. Bed, big chest and larder:
#                                  Farming's, put in when the house is finished (stage 5)
# The land is outside: the plot by the hut on Map111 and the farm's yard and field on Map168 (region 8, <BuildRegion:8>).
# Every light is a flame (hearths, candles); windows let the sun in by day. No water inside (drought rule). Never writes data/.
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/podgrodzie")
sys.path.insert(0, ROOT + "tools/interiors")
sys.path.insert(0, ROOT + "tools/wnetrza")
import plib                                   # noqa: E402  (Pod: the author's houses on tileset 11)
from plib import Pod, GRASS, GRASS_LIGHT, DIRT, TUFTS, SOFT, DRY, HEDGE, FENCE, COBBLE, event as pevent, pic   # noqa: E402
from nslib import NewMap, B, C, D, E, blank_page, write_map, noise, lowfreq                                 # noqa: E402
import ilib                                   # noqa: E402
from ilib import Interior                     # noqa: E402
import rooms as RM                            # noqa: E402  (window2, candle_on, lantern, hang_pole, barrel, sacks, rug_k, doormat...)

STAGING = os.path.join(HERE, "staging")
DOOR_SE = {"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}
B_WOOD, B_STONE, B_LOG = 24, 16, 33
W_PLANKS, W_PLANKS_V, W_LOGS, W_RAW, W_PLASTER_BEAM = 48, 49, 59, 71, 51
F_DARK, F_PLANKS, F_COBBLE, F_FLAGS = 83, 84, 96, 97
RUG_MAT, RUG_BROWN, RUG_RED = 37, 21, 38
NOTE_POOR = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:85>\n<DarkNight:185>"

# the houses (Homes.js keeps the same numbers in its own data; the test reads domy.json to check them)
HOUSES = {
    "chata": {"inside": 154, "land": 111, "map": 111, "front": [8, 81], "door_x": 4,
              "furniture": [{"type": "bed", "x": 7, "y": 4}, {"type": "chest_s", "x": 9, "y": 4}]},
    "zagroda": {"inside": 169, "land": 168, "map": 168, "front": [20, 10], "door_x": 6,
                "furniture": [{"type": "bed", "x": 9, "y": 4}, {"type": "larder", "x": 11, "y": 4}, {"type": "chest_l", "x": 1, "y": 4}]},
}


def cmd(code, params, indent=0):
    return {"code": code, "indent": indent, "parameters": params}


def transfer_cmds(to_map, x, y, d):
    return [cmd(250, [dict(DOOR_SE)]), cmd(201, [0, to_map, x, y, d, 0])]


# ================================================================================================ the interiors (tileset 8)
class DInterior(Interior):
    """a home to buy: the front exit to its outdoor map, the bought furniture's cells kept free (Farming draws and runs them)"""

    def __init__(self, map_id, W, H, display, key, note, street):
        Interior.__init__(self, map_id, W, H, display, key, note=note)
        self.street = street
        self.keep = set()

    def exit_to(self, x, door_id, town_xy, name, room=None):
        tx, ty = town_xy
        e = {"name": name, "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=transfer_cmds(self.street, tx, ty, 2))]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "door": door_id, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
        self.hooks.append(("exit", x, self.H - 1))
        self.spots.setdefault("landing", [x, self.H - 2, 8])
        return e

    def reserve_cells(self, furniture):
        for f in furniture:
            w = 2 if f["type"] in ("bed", "chest_l") else 1
            for i in range(w): self.keep.add((f["x"] + i, f["y"]))

    def stage(self):
        os.makedirs(STAGING, exist_ok=True)
        path = os.path.join(STAGING, "Map%03d.json" % self.id)
        n = self.write(path, os.path.join(STAGING, "Map%03d_meta.json" % self.id))
        return path, n

    def meta(self):
        m = Interior.meta(self)
        m.update({"keep": sorted([list(c) for c in self.keep])})
        return m


def cobweb(mp, x, y, right=False):
    mp.piece("D", 15 if right else 13, 7, 1, 1, x, y, z=3, kind="pajęczyna", solid_rows=[])


def chata_wnetrze():
    """154: the hut under the forest - one room, 10 x 5 floor; the hearth in the back wall, the bed and the chest (bought) right,
    the table left, pegs, an empty barrel and sacks; the door at the bottom"""
    h = HOUSES["chata"]
    W, H = 12, 10
    mp = DInterior(h["inside"], W, H, "Chata pod lasem", "chata", NOTE_POOR, h["map"])
    DOOR_X = h["door_x"]
    mp.shell([("Izba", [(1, 4, 10, 8)], F_DARK, W_PLANKS_V)], border=B_WOOD, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(4, 1, 6, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    mp.reserve_cells(h["furniture"])
    ilib.fireplace_pic(mp, 5, 4, kind=2, group=g)
    ilib.firewood(mp, 4, 4, group=g + " drewno")
    ilib.window(mp, 2, 1, curtain=7, group=g + " okna", length=100, style="small")
    ilib.window(mp, 8, 1, curtain=7, group=g + " okna", length=100, style="small")
    mp.hprop("kolki_ubrania", 3, 3, group=g + " kołki")
    ilib.table_h(mp, 1, 6, 2, style=6, group=g + " stół")
    ilib.stool(mp, 3, 6, group=g + " stołki")
    ilib.on_table(mp, 1, 6, "D", 5, 10)
    RM.candle_on(mp, 2, 6)
    mp.piece("D", 15, 0, 1, 2, 1, 3, group=g, kind="pusta beczka")
    mp.piece("D", 8, 2, 2, 2, 1, 7, group=g + " worki", kind="worki", solid_rows=[1])
    mp.piece("D", 7, 6, 1, 2, 10, 7, group=g, kind="miotła")
    ilib.rug(mp, 4, 6, 6, 7, RUG_BROWN)
    RM.doormat(mp, DOOR_X, H - 2)
    cobweb(mp, 1, 1)
    cobweb(mp, W - 2, 1, right=True)
    mp.exit_to(DOOR_X, None, h["front"], "Drzwi -> Podgrodzie")
    return mp


def zagroda_wnetrze():
    """169: the Ług family's house rebuilt - new log walls, 11 x 5 floor; the hearth in the middle of the back wall, the big chest
    left, the bed and the larder right (bought with the last stage), the table with stools left of the door, a rug, firewood; the
    door at the bottom -> the yard before the house"""
    h = HOUSES["zagroda"]
    W, H = 13, 10
    mp = DInterior(h["inside"], W, H, "Dom Ługów", "zagroda", NOTE_POOR, h["map"])
    DOOR_X = h["door_x"]
    mp.shell([("Izba", [(1, 4, 11, 8)], F_PLANKS, W_LOGS)], border=B_LOG, exit_x=DOOR_X)
    mp.restyle_face(mp.rect(5, 1, 7, 3), W_RAW)
    mp.shadows()
    g = "Izba"
    mp.reserve_cells(h["furniture"])
    ilib.fireplace_pic(mp, 6, 4, kind=2, group=g)
    ilib.firewood(mp, 5, 4, group=g + " drewno")
    ilib.firewood(mp, 7, 4, group=g + " drewno")
    ilib.window(mp, 3, 1, curtain=7, group=g + " okna", length=100, style="small")
    ilib.window(mp, 9, 1, curtain=7, group=g + " okna", length=100, style="small")
    ilib.table_h(mp, 2, 6, 2, style=6, group=g + " stół")
    ilib.stool(mp, 1, 6, group=g + " stołki")
    ilib.stool(mp, 4, 6, group=g + " stołki")
    ilib.on_table(mp, 2, 6, "D", 5, 10)
    RM.candle_on(mp, 3, 6)
    ilib.rug(mp, 5, 6, 8, 7, RUG_BROWN)
    mp.piece("D", 15, 0, 1, 2, 11, 6, group=g, kind="pusta beczka")
    mp.piece("D", 8, 2, 2, 2, 9, 7, group=g + " worki", kind="worki", solid_rows=[1])
    mp.piece("D", 7, 6, 1, 2, 1, 7, group=g, kind="miotła")
    RM.doormat(mp, DOOR_X, H - 2)
    mp.exit_to(DOOR_X, None, h["front"], "Drzwi -> Zagroda")
    return mp


BUILDERS = {154: chata_wnetrze, 169: zagroda_wnetrze}
NAMES = {154: "Chata pod lasem", 168: "Spalona zagroda", 169: "Dom Ługów"}
PARENTS = {154: 111, 168: 23, 169: 168}


def main():
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(BUILDERS)
    for i in ids:
        mp = BUILDERS[i]()
        path, n = mp.stage()[:2]
        print("Map%03d %s: %dx%d, %d zdarzeń -> %s" % (i, NAMES[i], mp.W, mp.H, n, os.path.relpath(path, ROOT)))
    # the houses' record (Homes.js keeps the same numbers in its own data; the test reads this to check them)
    rec = {"houses": HOUSES, "names": NAMES, "parents": PARENTS}
    for mid in (154, 168, 169):
        mpath = os.path.join(STAGING, "Map%03d_meta.json" % mid)
        if os.path.exists(mpath):
            rec.setdefault("meta", {})[str(mid)] = json.load(open(mpath, encoding="utf-8"))
    open(os.path.join(HERE, "domy.json"), "wb").write(json.dumps(rec, ensure_ascii=False, indent=1).encode("utf-8"))


if __name__ == "__main__":
    main()
