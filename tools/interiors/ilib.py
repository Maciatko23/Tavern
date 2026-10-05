# Shared pieces for the town's building interiors (maps 102+, children of Map008 "Okolice Tawerny") on tileset 8
# "Wilu Fantasy Interior" (Winlu Fantasy Interior Remaster). Built on grandpa's cottage tools (tools/house/houselib.py:
# the room shell with 3-row wall faces, windows with sunbeams, beds, candles...) which stand on the tavern's
# (tools/tavern: parter_props macros, tavlib, nslib's editor-exact autotiles and map writer).
#
# What this adds for a town interior:
#   - Interior: a House with its own map id / name / note, any number of exits in the bottom border (touch -> back to the
#     town in front of the door, facing down; Door1 sound) and their landings (the floor cell above, facing up);
#   - resident spots: invisible events "Miejsce: <key>_wnetrze" (below the characters, through, no commands, the page's
#     image direction = the way the resident faces) - TownLife shows the resident there while he/she is "inside";
#   - the town prop sheets (img/characters/!House_Town*.png, tools/interiors/props.py) as events;
#   - a meta record per map (exits, landings, spots, doors) for the checker, the docs and the test.
# Nothing here writes data/: staged maps go to tools/interiors/staging/ (install.py puts them into data/).
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT_DIR, "tools", "house"))
from houselib import *          # noqa: F401,F403  House, window, bed, candle, hang, thing, plain_chest... + parter_props macros
import houselib as HL           # noqa: E402

IHERE = os.path.dirname(os.path.abspath(__file__))     # (the star imports bring the tavern's HERE)
STAGING = os.path.join(IHERE, "staging")
DOCS_DIR = os.path.join(ROOT_DIR, "docs", "wnetrza")
TOWN = 8
# like grandpa's cottage (Map019) and the hut (Map100): RoomLighting darkness by the hour, lamps at night, sunbeams by day,
# no DayNight layer over the lamps; zoomed in like the hut - the rooms are small
NOTE = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:60>\n<DarkNight:175>"
NOTE_DIM = "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<Zoom:1.5>\n<DarkDay:95>\n<DarkNight:190>"

DOOR_SE = {"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}

PROPS_IDX_PATH = os.path.join(IHERE, "props_index.json")
TOWN_IDX = json.load(open(PROPS_IDX_PATH, encoding="utf-8")) if os.path.exists(PROPS_IDX_PATH) else {}


class Interior(House):
    """a town interior: House (the cottage's shell and records) with its own id, name, note and the town's exits"""

    def __init__(self, map_id, W, H, display, key, note=NOTE):
        House.__init__(self, W, H, note, name=key)
        self.id = map_id
        self.key = key
        self.props["displayName"] = display
        self.props["note"] = note
        self.display = display
        self.exits = []           # {"x", "y", "door": Map008 event id, "town": [x, y] the cell in front of the door}
        self.residents = []       # {"key", "x", "y", "dir"}
        self.pins = []

    # ------------------------------------------------------------------------------------------------ the way out
    def exit_to(self, x, door_id, town_xy, name, room=None):
        """the doorway at (x, H-1) in the bottom border: walking down onto it -> the town in front of door `door_id`
        (town_xy, facing down). Coming in through that door lands on (x, H-2) facing up."""
        tx, ty = town_xy
        cmds = [{"code": 250, "indent": 0, "parameters": [dict(DOOR_SE)]},
                {"code": 201, "indent": 0, "parameters": [0, TOWN, tx, ty, 2, 0]}]
        e = {"name": name, "note": "", "pages": [blank_page(priority=0, trigger=1, cmds=cmds)]}
        self.add(x, self.H - 1, e)
        self.exits.append({"x": x, "y": self.H - 1, "door": door_id, "town": [tx, ty], "landing": [x, self.H - 2, 8], "name": name})
        self.hooks.append(("exit", x, self.H - 1))
        self.spots.setdefault("landing", [x, self.H - 2, 8])
        return e

    # ------------------------------------------------------------------------------------------------ the residents
    def resident(self, key, x, y, d):
        """where TownLife shows `key` while he/she is inside: an invisible event, below the characters, through"""
        page = blank_page(priority=0, through=True, image={"direction": d})
        e = {"name": "Miejsce: %s_wnetrze" % key, "note": "", "pages": [page]}
        self.add(x, y, e)
        self.residents.append({"key": key, "x": x, "y": y, "dir": d})
        self.spots["res_" + key] = [x, y, d]
        return e

    # ------------------------------------------------------------------------------------------------ our town props
    def tprop(self, key, x, y, group=None, note="", name=None, priority=None, occupy=None, cat=None, step=None, pattern=None, direction=None):
        """one of the town props (props_index.json: !House_Town sheets) as an event; floor things stand on their cell
        (same as characters), wall / table things lie below the characters"""
        p = TOWN_IDX[key]
        floor = p["place"] in ("floor", "floor2", "floor3")
        prio = priority if priority is not None else (1 if floor else 0)
        occ = occupy if occupy is not None else p.get("occupy")
        tags = ("<Occupy:%s>" % occ if occ else "") + note
        e = self.ev(x, y, p["sheet"], p["index"], direction if direction is not None else p["direction"],
                    pattern if pattern is not None else p["pattern"], name=name or p.get("name", key), priority=prio,
                    through=prio != 1, step=bool(p.get("anim")) if step is None else step, note=tags)
        cells = {(x, y)}
        if occ:
            kv = dict(t.split("=") for t in occ.split(","))
            cells |= {(x + dx, y + dy) for dy in range(-int(kv.get("up", 0)), int(kv.get("down", 0)) + 1)
                      for dx in range(-int(kv.get("left", 0)), int(kv.get("right", 0)) + 1)}
        if floor and prio == 1:
            self.solid |= cells; self.blocked |= cells
        c = cat or {"floor": "floorprop", "floor2": "floorprop", "floor3": "floorprop", "table": "tableitem",
                    "counter": "counteritem", "wall": "wallitem", "wall_hi": "wallitem", "sill": "sillitem"}[p["place"]]
        self.rec(key, c, cells, group, x=x, y=y, event=True, art=p.get("art"), fw=p["w"], fh=p["h"])
        if c == "wallitem": self.wall_items.append((group, key, x, y))
        return e

    def pin(self, text, x, y):
        self.pins.append((text, x, y))

    # ------------------------------------------------------------------------------------------------ records
    def meta(self):
        m = House.meta(self)
        m.update({"id": self.id, "key": self.key, "display": self.display, "exits": self.exits, "residents": self.residents,
                  "pins": self.pins})
        return m

    def stage(self):
        os.makedirs(STAGING, exist_ok=True)
        path = os.path.join(STAGING, "Map%03d.json" % self.id)
        n = self.write(path, os.path.join(STAGING, "Map%03d_meta.json" % self.id))
        return path, n


# ==================================================================================================== small helpers
def tiles_at(mp, sheet, cells, z=2):
    """put single tiles: cells = [(col, row, x, y), ...]"""
    for (c, r, x, y) in cells:
        mp.t(sheet, c, r, x, y, z=z)

def tile_event(mp, x, y, tid, name, priority=0, through=True):
    """a tile shown by an event (the author's way when layers 2 and 3 are taken): below / above the characters"""
    e = {"name": name, "note": "", "pages": [blank_page(priority=priority, image={"tileId": tid}, through=through)]}
    mp.add(x, y, e)
    if priority == 1 and not through:
        mp.solid.add((x, y)); mp.blocked.add((x, y))
    return e
