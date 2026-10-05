# Shared pieces of Podgrodzie (Map111, the poor suburb outside the town's west wall, user 2026-10-05: "wyjście z mapy na zachód
# i tam mapa z domkami drewnianymi i wnętrzami i mieszkańcami, biedniejsza dzielnica miasta").
#
# The map is drawn on the town's tileset 11 (the Winlu author's own tileset and passage flags, tools/town/town_tileset.py) in the
# author's manner (tools/town/RECIPES.md, tools/town/prefabs/_layers.txt): tall A3 roofs over low 2-row log / plank walls,
# 2-cell windows of the B sheet on layer 2, ivy and chimneys on layer 3, doors / dormers / smoke as events, a half lean-to of
# B(10..11, 9..12) by the side, the shadow layer (left halves right of a building, whole cells under a lean-to's roof), things
# of the C sheet in groups of 2-4 at the wall's foot. The ground: A2 grass, trodden earth and lanes on layer 0, overlays on
# layer 1 (dry patches, tufts, pebbles, dried mud).
#
# Pod (a tools/newstart NewMap) adds: houses, C/D/E things, events (pictures, tiles, doors, lights, spots), RegionLayers
# regions, and the records (buildings, doors, spots, lights) written next to the staged map (Map111_meta.json) for the checker
# (check_podgrodzie.py), the renders and the interiors' builder. Nothing here writes data/ (install.py does).
import os, sys, json, copy, math, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
for p in ("tools/newstart", "tools/town", "tools/tavern"):
    sys.path.insert(0, ROOT + p)
from nslib import NewMap, B, C, D, E, A5, blank_page, write_map, noise, lowfreq   # noqa: E402
import build_town_props as TP                                                    # noqa: E402  (!Town_Props: the dry well, tents...)
import build_tavern_props as TY                                                  # noqa: E402  (!Tavern_Yard)

def _load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m
# the town's door rules (open hours -> in, else the "Zamknięte." popup), as tools/interiors/install.py put them on Map008
TOWN_DOORS = _load_module("interiors_install", ROOT + "tools/interiors/install.py")

STAGING = os.path.join(HERE, "staging")
DOCS = ROOT + "docs/podgrodzie/"
MAP_ID, TOWN = 111, 8
W, H = 46, 36
GATE_ROWS = (17, 18)                 # Map111's east edge (x 44-45) = Map008's west wall (x 0-1), row + 33
TOWN_ROW_OFF = 33
NOTE = "<Clouds:on>\n<Farm:off>"
# open hours of the houses (the town's homes: 6-21, tools/interiors/install.py HOURS); None = always open
HOME_HOURS = (6, 21)

# ---------------------------------------------------------------- A2 kinds (tileset 11, Fantasy_Outside_A2_green)
GRASS, DIRT, GRASS_LIGHT = 16, 17, 27            # layer 0
TUFTS, SOFT, DRY, PEBBLES, MUD, STONES, FLOWERS_S, HEDGE = 21, 31, 39, 47, 26, 23, 29, 20   # layer 1 overlays
FENCE, FENCE_DARK = 22, 38                       # layer 1 fences
COBBLE = 40
# A3 / A4 kinds for the houses
ROOF = {"shingle": 71, "thatch": 59, "straw": 67, "planks": 64, "planks_b": 65, "shingle_dark": 66, "shingle_brown": 68, "slate": 60}
WALL = {"logs": 72, "planks": 73, "grey_logs": 74, "boards": 75, "logs_v": 57, "dark_boards": 83, "boards_stone": 84, "plaster": 94}

# things of the C sheet: name -> (col, row, w, h)  (bottom-left anchored when placed)
THINGS = {
    "barrel": (4, 8, 1, 2), "barrel_open": (3, 8, 1, 2), "barrel_pile": (2, 11, 3, 2), "barrels2": (5, 12, 2, 2),
    "barrel_crate": (3, 13, 2, 2), "basket_grain": (4, 15, 1, 1), "basket_apples": (5, 15, 1, 1), "basket_jugs": (6, 15, 1, 1),
    "crate": (3, 4, 1, 2), "crate_b": (5, 4, 1, 2), "crate_lid": (7, 4, 1, 2), "crate_open": (6, 6, 1, 2), "crate_open_b": (7, 6, 1, 2),
    "crate_jug": (6, 8, 1, 2), "crate_sack": (7, 8, 1, 2), "jug_barrel": (4, 6, 1, 2), "crates_cloth": (2, 6, 2, 2),
    "sacks": (5, 11, 1, 1), "sacks_b": (6, 11, 1, 1), "sack": (7, 12, 1, 1), "sack_torn": (7, 11, 1, 1), "pots": (5, 6, 1, 1),
    "jug": (3, 7, 1, 1), "small_crate": (5, 9, 1, 1), "bench": (10, 0, 2, 2), "bench_b": (12, 0, 2, 2), "table": (12, 2, 2, 2),
    "stool": (14, 3, 1, 1), "stool_b": (15, 3, 1, 1), "log_bench": (9, 3, 2, 1), "log_v": (8, 2, 1, 2),
    "woodshed": (13, 5, 3, 2), "firewood": (8, 4, 3, 2), "logs_small": (13, 4, 1, 1), "chopping_block": (12, 4, 1, 2),
    "cart": (10, 6, 2, 2), "cart_sacks": (12, 6, 2, 2), "cart_hay": (10, 8, 2, 2), "cart_barrels": (12, 8, 2, 2),
    "wheel": (14, 8, 1, 2), "hay": (13, 10, 3, 2), "hay_low": (13, 12, 3, 1), "sticks": (14, 7, 1, 1), "sticks_b": (15, 7, 1, 1),
    "signpost": (1, 14, 1, 2), "signpost_b": (2, 14, 1, 2), "signpost_one": (3, 14, 1, 2), "notice": (0, 13, 1, 2),
    "ladder": (0, 3, 1, 3), "grindstone": (1, 4, 1, 2), "hide_rack": (1, 2, 1, 2), "hide_rack_b": (2, 2, 1, 2),
    "weapon_rack": (0, 6, 2, 2), "scarecrow": (0, 10, 1, 2), "scarecrow_hat": (0, 12, 1, 2),
    "cross_flowers": (10, 10, 1, 2), "cross_wreath": (11, 10, 1, 2), "lantern_post": (7, 14, 1, 2),
    "sprout_a": (5, 2, 1, 1), "sprout_b": (6, 2, 1, 1), "sprout_c": (7, 2, 1, 1), "sprout_d": (5, 3, 1, 1), "sprout_e": (6, 3, 1, 1),
    "sprout_f": (7, 3, 1, 1), "rope": (15, 9, 1, 1),
}
# D-sheet clumps (one cell): ferns, small flowers, mushrooms, stones, logs
CLUMPS = {"fern": (9, 7), "fern_b": (10, 7), "fern_c": (11, 7), "fern_big": (12, 11), "fern_big_b": (13, 11), "weed": (13, 10),
          "white_fl": (12, 9), "white_fl_b": (12, 10), "mush": (13, 9), "mush_row": (14, 9), "stones": (11, 5), "stone": (10, 5),
          "rock": (8, 5), "stump": (4, 0), "stumps": (4, 1), "log_moss": (14, 4), "yellow_fl": (14, 11), "dead_vine": None}

T = 48


def event(name, x, y, image=None, priority=1, through=False, trigger=0, cmds=None, note="", step=False, dfix=True, freq=3, speed=3):
    pg = blank_page(priority=priority, trigger=trigger, image=image, through=through, cmds=cmds, step=step, direction_fix=dfix)
    pg["moveFrequency"], pg["moveSpeed"] = freq, speed
    return {"name": name, "note": note, "pages": [pg]}

def pic(char, index=0, direction=2, pattern=0):
    return {"characterName": char, "characterIndex": index, "direction": direction, "pattern": pattern, "tileId": 0}

def text_cmds(*lines):
    """Show Text (no face, window, bottom) - one message box per 4 lines"""
    out = []
    for i in range(0, len(lines), 4):
        out.append({"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]})
        out += [{"code": 401, "indent": 0, "parameters": [t]} for t in lines[i:i + 4]]
    return out

def popup_cmds(text, color="info"):
    """the "needs" popup over the hero (Tawerna.popup), at most once a second per event (bumping repeats every frame)"""
    js = ("const t = $gameTemp, k = this.eventId(); t._podPop = t._podPop || {}; "
          "if (!(t._podPop[k] > Graphics.frameCount - 60)) { t._podPop[k] = Graphics.frameCount; "
          "Tawerna.popup(%s, { color: %s }); }" % (json.dumps(text, ensure_ascii=False), json.dumps(color)))
    return [{"code": 355, "indent": 0, "parameters": [js]}]


class Pod(NewMap):
    def __init__(self, seed=111):
        NewMap.__init__(self, MAP_ID, W, H, 11, "Podgrodzie", NOTE, seed=seed, bgm="Town1", autoplay=False)
        self.buildings, self.spots, self.lights, self.doors = [], {}, [], []
        self.exits = []
        self.notes = []          # (text, x, y) labels for the docs picture

    # ------------------------------------------------------------------------------------------------ tiles
    def zfree(self, x, y, prefer=2):
        for z in ((2, 3) if prefer == 2 else (3, 2)):
            if (x, y) not in self.layers[z]: return z
        return None

    def tl(self, x, y, tid, z=None):
        """one B-E tile on layer z (default: 2 if free, else 3)"""
        if not self.inside(x, y): return
        zz = z or self.zfree(x, y)
        assert zz, "no free upper layer at (%d,%d)" % (x, y)
        self.tile(zz, x, y, tid)

    def piece(self, sheet, c, r, w, h, x, y, z=None):
        """a w x h block of a sheet (B C D E) with its top-left on (x, y)"""
        f = {"B": B, "C": C, "D": D, "E": E}[sheet]
        for j in range(h):
            for i in range(w):
                self.tl(x + i, y + j, f(c + i, r + j), z)

    def thing(self, name, x, y, z=None):
        """a C-sheet thing (THINGS) standing with its bottom-left cell on (x, y)"""
        c, r, w, h = THINGS[name]
        self.piece("C", c, r, w, h, x, y - h + 1, z)
        return [(x + i, y) for i in range(w)]

    def clump(self, name, x, y, z=None):
        c, r = CLUMPS[name]
        self.tl(x, y, D(c, r), z)

    def ground_kind(self, z, x, y):
        v = self.layers[z].get((x, y))
        return v[1] if v and v[0] == "k" else None

    # ------------------------------------------------------------------------------------------------ events
    def ev(self, x, y, e, cells=None):
        return self.add(x, y, e, cells)

    def picture(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=1, through=False, note="", cmds=None,
                trigger=0, step=False, dfix=True, freq=3, speed=3):
        e = event(name, x, y, pic(char, index, direction, pattern), priority, through, trigger, cmds, note, step, dfix, freq, speed)
        return self.add(x, y, e)

    def tile_ev(self, x, y, tid, name="", priority=0, through=True, note=""):
        e = event(name, x, y, {"tileId": tid, "characterName": "", "characterIndex": 0, "direction": 2, "pattern": 0}, priority, through, 0, None, note)
        return self.add(x, y, e)

    def town_prop(self, name, x, y, label=None, cmds=None, trigger=0):
        """a picture of !Town_Props (tools/town/build_town_props.py) on its bottom-left (bottom-middle when 3 wide) cell"""
        i = TP.INDEX[name]
        k, d, p = TP.image_of(i)
        walk = TP.walkable(name)
        e = event(label or name, x, y, pic("!Town_Props", k, d, p), priority=0 if walk else 1, through=walk, trigger=trigger,
                  cmds=cmds, note=TP.occupy_note(name))
        return self.add(x, y, e, TP.footprint(name, x, y))

    def tree(self, x, y, kind="leafy", name="Drzewo"):
        """a decorative tree (no <Tree> note: it cannot be felled, like the town's): the trunk's cell closed"""
        d, p = {"leafy": (4, 2), "pine": (2, 2), "pine_b": (4, 1), "bush": (4, 0)}[kind]
        return self.picture(x, y, "!$Big_Trees_green", 0, d, p, name=name, priority=1)

    def bush(self, x, y, sheet="!$Bush_Bare_A", name="Suchy krzak"):
        """a decorative bush (no <Bush> note - not gathered)"""
        return self.picture(x, y, sheet, 0, 2, 0, name=name, priority=1)

    def light(self, x, y, char, index, direction, pattern, name, note, priority=2, step=False, through=False):
        e = self.picture(x, y, char, index, direction, pattern, name=name, priority=priority, note=note, step=step, through=through,
                         freq=5 if step else 3, speed=6 if step else 3)
        self.lights.append({"name": name, "x": x, "y": y, "note": note})
        return e

    def spot(self, key, x, y, d=2):
        """TownLife's spot: an invisible event "Miejsce: <key>" (below the characters, through, nothing to run); the page's
        image direction = the way the resident faces there"""
        img = {"tileId": 0, "characterName": "", "characterIndex": 0, "direction": d, "pattern": 0}
        e = event("Miejsce: %s" % key, x, y, img, priority=0, through=True)
        self.events.append((x, y, e))          # (not "taken": it closes nothing)
        self.spots[key] = [x, y, d]
        return e

    def transfer(self, x, y, to_map, tx, ty, direction, name):
        cmds = [{"code": 201, "indent": 0, "parameters": [0, to_map, tx, ty, direction, 0]}]
        e = event(name, x, y, None, priority=0, through=False, trigger=1, cmds=cmds, dfix=False)
        self.add(x, y, e)
        self.exits.append({"x": x, "y": y, "to": [to_map, tx, ty, direction]})
        return e

    # ------------------------------------------------------------------------------------------------ houses
    def house(self, key, name, x, y, w, roof_h, wall_h, roof, wall, door, door_pic=("!Fantasy_door1", 2), windows=(),
              chimney=None, chimney_style=3, smoke=True, dormer=None, ivy=(), lean=None, lean_fill=None, shadow=True,
              interior=None, hours=HOME_HOURS, closed_text="Zamknięte.", lean_shadow=True):
        """a wooden house of the author's pieces, top-left (x, y), w wide: roof_h rows of an A3 roof over wall_h rows of an
        A3 / A4 wall. door: its column from x (the door event stands on the bottom row; the cell below is its front).
        windows [(col, style)]: wood | wood_lit | shut (2 wide) | shut_lit (2 wide) | open (2 wide) | board | tiny
        chimney: column (B(chimney_style, 10..11) over the ridge, smoke event); dormer: (col, index) of !Roof_Windows;
        ivy: columns with ivy down the wall; lean: "right" / "left" - a half lean-to of B(10..11, 9..12) by that side,
        lean_fill: a C thing under it ("hay", "firewood_half"...). interior: the interior's key (the door gets its transfer
        later from install.py; here only the record)"""
        rk, wk = ROOF.get(roof, roof), WALL.get(wall, wall)
        wt = y + roof_h
        yb = wt + wall_h - 1
        self.kind(0, self.rect(x, y, x + w - 1, wt - 1), rk)
        self.kind(0, self.rect(x, wt, x + w - 1, yb), wk)
        for c in self.rect(x, y, x + w - 1, yb): self.layers[1].pop(c, None)
        dx = x + door
        # windows
        for col, style in windows:
            cx = x + col
            if style in ("wood", "wood_lit"):
                bc = 1 if style == "wood" else 2
                self.tl(cx, wt, B(bc, 0), 2); self.tl(cx, wt + 1, B(bc, 1), 2)
            elif style in ("shut", "shut_lit", "open"):
                bc = {"shut": 4, "shut_lit": 6, "open": 0}[style]
                for i in range(2):
                    self.tl(cx + i, wt, B(bc + i, 2), 2); self.tl(cx + i, wt + 1, B(bc + i, 3), 2)
            elif style == "board":
                self.tl(cx, wt, B(1, 7), 2)
            elif style == "tiny":
                self.tl(cx, wt, B(1, 6), 2)
        # ivy (layer 3, over the windows' layer 2)
        for col in ivy:
            kinds = [(3, 12), (5, 12), (6, 12), (2, 12), (1, 12)]
            k = kinds[(x + col + y) % len(kinds)]
            self.tl(x + col, wt, B(k[0], 12), 3); self.tl(x + col, wt + 1, B(k[0], 13), 3)
        # chimney over the ridge + smoke
        if chimney is not None:
            cx = x + chimney
            self.tl(cx, y - 1, B(chimney_style, 10), 3); self.tl(cx, y, B(chimney_style, 11), 3)
            if smoke:
                self.picture(cx, y - 1, "!Fantasy_chimney", 0, 2, (x + y) % 3, name="Dym z komina", priority=2, through=True, step=True)
        if dormer:
            dc, di = dormer
            self.picture(x + dc, y + max(1, roof_h - 2), "!Roof_Windows", di, 2, 0, name="Okienko w dachu", priority=1)
        # the half lean-to by the side
        lx = None
        if lean:
            lx = x + w if lean == "right" else x - 1
            col = 11 if lean == "right" else 10
            for j in range(4):
                self.tl(lx, yb - 3 + j, B(col, 9 + j), 3)
            if lean_fill:
                self.lean_fill(lx, yb, lean_fill)
        # shadows: the left half of the cells right of the house (the eaves), whole cells under the lean-to's roof
        if shadow:
            sx = x + w
            if lean == "right":
                for j in range(3): self.shadow[(lx, yb - 2 + j)] = 15
                self.shadow[(lx, yb - 3)] = 4
                sx = lx + 1
                rows = range(yb - 2, yb + 1)
            else:
                rows = range(y + 1, yb + 1)
            for i, yy in enumerate(rows):
                if self.inside(sx, yy) and self.ground_kind(0, sx, yy) not in (rk, wk) and not self.is_building(sx, yy):
                    self.shadow[(sx, yy)] = 4 if i == 0 else 5
        # the door
        dname = ("Drzwi: " + name) if interior else ("Drzwi (zamknięte): " + name)
        sheet, idx = door_pic
        if interior:
            cmds = None                       # (install.py fills the open-hours transfer once the interior's landing is known)
            trig = 1
        else:
            cmds = popup_cmds(closed_text)
            trig = 1
        e = self.picture(dx, yb, sheet, idx, 2, 0, name=dname, priority=1, cmds=cmds, trigger=trig, dfix=True,
                         note="<Town:door=%s>" % key if interior else "")
        rec = {"key": key, "name": name, "rect": [x, y, x + w - 1, yb], "door": [dx, yb], "front": [dx, yb + 1],
               "interior": interior, "hours": list(hours) if hours else None, "roof": rk, "wall": wk, "event": e,
               "lean": [lx, yb - 3, lx, yb] if lean else None}
        self.buildings.append(rec)
        return rec

    def lean_fill(self, lx, yb, what):
        if what == "hay":
            self.tl(lx, yb - 1, C(15, 10), 2); self.tl(lx, yb, C(15, 11), 2)
        elif what == "logs":
            self.tl(lx, yb - 1, C(13, 4), 2); self.tl(lx, yb, C(11, 5), 2)
        elif what == "barrel":
            self.tl(lx, yb - 1, C(4, 8), 2); self.tl(lx, yb, C(4, 9), 2)

    def is_building(self, x, y):
        return any(b["rect"][0] <= x <= b["rect"][2] and b["rect"][1] <= y <= b["rect"][3] for b in self.buildings)

    # ------------------------------------------------------------------------------------------------ RegionLayers
    def paint_regions(self, data, events):
        """tools/town/paint_layers.py's first paint (region 2 on every A3 / A4 cell - roofs, walls, the plank walls of A4 'top'
        kinds that the flags leave open - and on the feet of facades with pictures), never on a door's front, a transfer's
        cell or its landing; the regions set by hand (self.region: the wall, the washing lines) stay"""
        import paint_layers as PL
        flags = json.loads(open(ROOT + "data/Tilesets.json", "rb").read().decode("utf-8"))[11]["flags"]
        m = {"width": W, "height": H, "data": data, "events": events, "_id": MAP_ID}
        paint, keep, why = PL.plan(m, flags)
        keep |= {tuple(b["front"]) for b in self.buildings}
        keep |= {(ex["x"] - 1, ex["y"]) for ex in self.exits}
        base = 5 * W * H
        for (x, y) in paint:
            if (x, y) not in keep and data[base + y * W + x] == 0: data[base + y * W + x] = 2

    # ------------------------------------------------------------------------------------------------ the records
    def meta(self, events):
        by_name = {}
        for e in events:
            if e: by_name.setdefault(e["name"], []).append(e)
        bl = []
        for b in self.buildings:
            r = {k: v for k, v in b.items() if k != "event"}
            r["event_id"] = b["event"].get("_id")
            bl.append(r)
        return {"id": MAP_ID, "size": [W, H], "gate_rows": list(GATE_ROWS), "buildings": bl, "spots": self.spots,
                "lights": self.lights, "exits": self.exits, "notes": self.notes}

    def write_staged(self, extra_region=None):
        data = self.resolve()
        events = [None]
        for i, (x, y, e) in enumerate(self.events, 1):
            e["_id"] = i
            events.append({"id": i, "name": e["name"], "note": e["note"], "pages": e["pages"], "x": x, "y": y})
        if extra_region:
            for (x, y), v in extra_region.items(): data[5 * W * H + y * W + x] = v
        self.paint_regions(data, events)
        os.makedirs(STAGING, exist_ok=True)
        path = os.path.join(STAGING, "Map%03d.json" % MAP_ID)
        write_map(path, self.props, data, events)
        meta = self.meta(events)
        with open(os.path.join(STAGING, "Map%03d_meta.json" % MAP_ID), "wb") as f:
            f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
        return path, data, events, meta
