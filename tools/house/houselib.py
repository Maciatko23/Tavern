# Shared pieces for grandpa's cottage interior (Map019 "Dom dziadka - Wnętrze") on tileset 8 "Wilu Fantasy Interior"
# (Winlu Fantasy Interior Remaster), built on the tavern's tools (tools/tavern: tavlib -> nslib, parter_props macros,
# the staged tileset-8 passage flags that are installed in data/Tilesets.json).
#
# What this adds for the cottage:
#   - House: a TavernMap without the tavern's kept events (ids from 1), the map properties of the current Map019,
#     a room shell (floors, wall faces FACE rows tall above each top-edge floor cell, the A2 border everywhere else,
#     openings cut through), a record of every placed thing for check_house.py, the key spots (landing, exit, beds,
#     grandpa's armchair, the new-game start);
#   - the two gameplay events kept from the current Map019: the exit door (touch -> Map020 15,8 facing down) and the
#     hero's bed "Posłanie (sen)" (action button: "Położyć się spać?" -> SurvivalHUD sleep {restoreHealth: true}) with
#     the exact command list of the current event 14;
#   - cottage macros: log / plaster walls, a stone chimney breast with the hearth and its cauldron, windows with
#     curtains and a sunbeam by day, beds, the stub partitions, lamps with RoomLighting notes.
# Nothing here writes data/: staged maps go to tools/house/staging/.
import os, sys, json, copy
HOUSE_DIR = os.path.dirname(os.path.abspath(__file__))
TAVERN = os.path.abspath(os.path.join(HOUSE_DIR, "..", "tavern"))
sys.path.insert(0, TAVERN)
from parter_props import *          # noqa: F401,F403  (Parter, TavernMap, B C D E A5, macros, lamp_note, LIGHTS)
import parter_props as PP
from links import LIGHTS

STAGING = os.path.join(HOUSE_DIR, "staging")     # (tavlib's HERE / STAGING are the tavern's: not used)
DOCS = os.path.join(ROOT, "docs", "dom_dziadka")
MAP019 = load_json(ROOT + "data/Map019.json")
HOUSE_IDX_PATH = os.path.join(HOUSE_DIR, "house_props_index.json")
HOUSE_IDX = load_json(HOUSE_IDX_PATH) if os.path.exists(HOUSE_IDX_PATH) else {}

def _find(pred):
    for e in MAP019["events"]:
        if e and pred(e): return e
    raise KeyError("Map019: event not found")

# the hero's bed: the current "Posłanie (sen)" event (its command list is copied as it is)
SLEEP_EVENT = _find(lambda e: any(c["code"] == 357 and c["parameters"][:2] == ["SurvivalHUD", "sleep"] for c in e["pages"][0]["list"]))
# the exit: the current door event (touch, Door1 sound, transfer to Map020 15,8 facing down)
DOOR_EVENT = _find(lambda e: any(c["code"] == 201 for c in e["pages"][0]["list"]))
DOOR_TRANSFER = next(c["parameters"] for c in DOOR_EVENT["pages"][0]["list"] if c["code"] == 201)   # [0, 20, 15, 8, 2, 0]

FACE = 3
# ---- light notes (RoomLighting v1.1.1; <LightWhen> works on maps with <DarkDay:N>)
L_HEARTH = "<Light:300,120,60,16>"          # the hearth fire: always
L_CANDLE = LIGHTS["candle"]                 # candles: evening / night
L_CANDLE_SMALL = "<Light:90,110,76,28><LightWhen:night>"
L_FILL = "<Light:260,14,10,4><LightWhen:night><LightSoft>"
def window_cone(length):
    return "<LightCone:length=%d,angle=28,dir=90,width=22,anchor=top,offsety=-8,blur=5,dust=10,dustsize=1,r=255,g=226,b=186,when=day>" % length


class House(Parter):
    """grandpa's cottage on tileset 8: TavernMap without kept events + the Parter records (things, hooks, wall items)"""
    keep_slots = 0

    def __init__(self, W, H, note, name="A"):
        TavernMap.__init__(self, W, H, note, display="Dom dziadka", seed=1919)
        for k, v in MAP019.items():
            if k not in ("data", "events"):
                self.props[k] = copy.deepcopy(v)
        self.props.update({"width": W, "height": H, "tilesetId": TILESET, "note": note})
        self.id = 19
        self.concept = name
        self.want_solid, self.things, self.hooks, self.wall_items = set(), [], [], []
        self.floor_cells, self.face_cells, self.openings = {}, {}, []
        self.spots = {}             # name -> [x, y(, dir)]
        self.room_kinds = {}        # room -> (floor kind, wall kind)
        self.notes = []             # free text for the report

    # ------------------------------------------------------------------------------------------------ the shell
    def shell(self, rooms, openings=(), border=24, face=FACE, force_border=(), exit_x=None, exit_room=None):
        """rooms: [(name, [rects x0,y0,x1,y1 incl.], floor_kind, wall_kind)] (a rect list may carry ("-", rect) to cut);
        openings: [(room, rect)] floor cut through borders / faces (no face of their own);
        force_border: cells that stay border whatever the rooms say"""
        rc = {}
        for (name, rects, fk, wk) in rooms:
            cells = set()
            for r in rects:
                if r[0] == "-": cells -= self.rect(*r[1])
                else: cells |= self.rect(*r)
            for c in cells: rc[c] = name
            self.room_kinds[name] = (fk, wk)
        if exit_x is not None:
            openings = list(openings) + [(exit_room or rooms[0][0], (exit_x, self.H - 1, exit_x, self.H - 1))]
        fb = set(force_border)
        for c in fb: rc.pop(c, None)
        fm = dict(rc)
        for (n, r) in openings:
            for c in self.rect(*r): fm[c] = n
            self.openings.append((n, r))
        faces = {}
        for (x, y), n in rc.items():
            if (x, y - 1) in rc: continue
            for k in range(1, face + 1):
                c = (x, y - k)
                if c in rc or c[1] < 0 or c in fb: break
                faces.setdefault(c, n)
        for c in list(faces):
            if c in fm: del faces[c]
        self.kind(0, self.all, border)
        for c, n in faces.items(): self.kind(0, {c}, self.room_kinds[n][1])
        for c, n in fm.items(): self.kind(0, {c}, self.room_kinds[n][0])
        self.floor_cells, self.face_cells = fm, faces
        self.border_kind = border

    def restyle_face(self, cells, wall_kind):
        """a part of a wall face in another wall kind (a stone chimney breast in a log wall)"""
        for c in cells:
            if c in self.face_cells: self.kind(0, {c}, wall_kind)

    def shadows(self):
        """the editor's wall shadow: the left half of a floor cell whose left neighbour is a wall or border"""
        for (x, y) in self.floor_cells:
            if (x - 1, y) not in self.floor_cells:
                self.shadow[(x, y)] = 5

    # ------------------------------------------------------------------------------------------------ gameplay events
    def exit_door(self, x, name="Drzwi -> Dom dziadka - Podwórze"):
        """the doorway in the bottom border (x, H-1): the current door event (touch -> Map020 15,8 facing down); the
        landing (coming in from the yard) is the floor cell right above it, facing up"""
        e = copy.deepcopy(DOOR_EVENT)
        e["name"] = name
        self.add(x, self.H - 1, {"name": e["name"], "note": e["note"], "pages": e["pages"]})
        self.spots["exit"] = [x, self.H - 1]
        self.spots["landing"] = [x, self.H - 2, 8]
        self.hooks.append(("exit", x, self.H - 1))

    def sleep_bed(self, cells, name="Posłanie (sen)"):
        """the hero's bed: one event per bed cell with the current Posłanie (sen) pages (action button, same as characters)"""
        for (x, y) in cells:
            self.add(x, y, {"name": name, "note": "", "pages": copy.deepcopy(SLEEP_EVENT["pages"])})
            self.hooks.append(("sleep", x, y))
        self.spots["hero_bed"] = [list(c) for c in cells]

    def spot(self, name, x, y, d=None):
        self.spots[name] = [x, y] + ([d] if d else [])

    # ------------------------------------------------------------------------------------------------ records
    def meta(self):
        return {"concept": self.concept, "width": self.W, "height": self.H, "zones": self.zones, "spots": self.spots,
                "things": self.things, "hooks": self.hooks, "wall_items": self.wall_items,
                "openings": [[n, list(r)] for (n, r) in self.openings],
                "floor": sorted([list(c) + [n] for c, n in self.floor_cells.items()]),
                "notes": self.notes, "axes": getattr(self, "axes", []), "pins": getattr(self, "pins", [])}

    def write(self, path, meta_path):
        n = self.write_to(path)
        with open(meta_path, "wb") as f:
            f.write(json.dumps(self.meta(), ensure_ascii=False, indent=1).encode("utf-8"))
        return n

    # ------------------------------------------------------------------------------------------------ our own props
    def hprop(self, key, x, y, group=None, note="", name=None, priority=None, occupy=None, cat=None):
        """one of the cottage's props (house_props_index.json) as an event (like Parter.prop)"""
        p = HOUSE_IDX[key]
        floor = p["place"] in ("floor", "floor2", "floor3")
        prio = priority if priority is not None else (1 if floor else 0)
        tags = ("<Occupy:%s>" % occupy if occupy else "") + note
        e = self.ev(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p.get("name", key), priority=prio,
                    through=prio != 1, step=bool(p.get("anim")), note=tags)
        cells = {(x, y)}
        if occupy:
            kv = dict(t.split("=") for t in occupy.split(","))
            cells |= {(x + dx, y + dy) for dy in range(-int(kv.get("up", 0)), int(kv.get("down", 0)) + 1)
                      for dx in range(-int(kv.get("left", 0)), int(kv.get("right", 0)) + 1)}
        if floor:
            self.solid |= cells; self.blocked |= cells
        c = cat or {"floor": "floorprop", "floor2": "floorprop", "floor3": "floorprop", "table": "tableitem",
                    "counter": "counteritem", "wall": "wallitem", "wall_hi": "wallitem", "sill": "sillitem"}[p["place"]]
        self.rec(key, c, cells, group, x=x, y=y, event=True, art=p.get("art"), fw=p["w"], fh=p["h"])
        if c == "wallitem": self.wall_items.append((group, key, x, y))
        return e


# ==================================================================================================== cottage macros
def window(mp, x, y, curtain=6, group=None, length=150, style="night"):
    """a window on a wall face, two cells tall from row y: night panes (dark blue in the evening, sunlit by day through
    the RoomLighting cone), a curtain on layer 3 (B row 12: 0 red, 1 linen, 2 orange, 6 worn beige, 7 ragged)"""
    k = {"night": (0, 2), "small": (1, 0), "shutters": (2, 2)}[style]
    if style == "small":
        mp.tiles("B", k[0], k[1], 1, 2, x, y)
    else:
        mp.tiles("B", k[0], k[1], 1, 2, x, y)
    if curtain is not None: mp.tiles("B", curtain, 12, 1, 2, x, y, z=3)
    mp.wall_items.append((group, "window", x, y))
    mp.light(x, y, window_cone(length), "okno (słońce)")

def hearth_cauldron(mp, x, y, group=None, wood=True):
    """the hearth with a cauldron hanging over the fire (!$Fireplace dir 4, animated): it stands on floor cell (x, y)
    against the wall and reaches up into the face; its glow always; firewood stacks beside it"""
    mp.ev(x, y, "!$Fireplace", 0, 4, 0, name="Palenisko z kotłem", priority=1, through=False, step=True, note=L_HEARTH)
    mp.rec("hearth", "floorprop", {(x, y)}, group, x=x, y=y)
    if wood:
        firewood(mp, x - 1, y, group=group); firewood(mp, x + 1, y, group=group)

def bed(mp, sheet_col, x, y, w=1, group=None, kind="łóżko"):
    """a Winlu bed standing against a north wall: headboard (C row 10 / 13, starred) on the wall's bottom face row y-1,
    the bed on floor rows y, y+1 (both closed by the tileset flags)"""
    col, row = sheet_col
    mp.tiles("C", col, row, w, 3, x, y - 1)
    cells = mp.rect(x, y, x + w - 1, y + 1)
    mp.want_solid |= cells; mp.solid |= cells
    return mp.rec(kind, "furniture", cells, group, x=x, y=y, w=w, h=2, sheet="C", sc=col, sr=row)

def nightstand(mp, x, y, group=None):
    """the small bedside cupboard C(5,0..1): its top drawn on the wall row above, standing on (x, y)"""
    return mp.piece("C", 5, 0, 1, 2, x, y - 1, group=group, kind="szafka nocna")

def candle(mp, x, y, group=None, small=False):
    """a thick candle (the tavern's prop, animated flame) standing on a table / stool cell"""
    mp.prop("swieca", x, y, group=group, note=L_CANDLE_SMALL if small else L_CANDLE)

HANGING = {"hams": (2, 1), "fish": (2, 2), "herbs": (3, 0), "garlic": (3, 1)}
def hang(mp, x, y, which, group=None):
    """things hanging from a pole on a wall face (!Decoration_static dir 8): hams, fish, herbs, garlic - the event on the
    wall cell where the pole is (its bundles hang into the row below)"""
    char, pat = HANGING[which]
    mp.ev(x, y, "!Decoration_static", char, 8, pat, name="Wiszące zapasy", priority=0, through=True)
    mp.wall_items.append((group, "hanging", x, y))

def drape(mp, x, y, side, colour=0, group=None):
    """a tied-back curtain (!$Curtain, 144 px frames) at an alcove's front: side "L" hangs in the left half of cell x,
    "R" in the right half; it covers rows y-2..y-1 (the event on row y), above the characters. colour 0 linen"""
    d = {"L": 8, "R": 6}[side]
    mp.ev(x, y, "!$Curtain", 0, d, colour, name="Zasłona", priority=2, through=True)
    mp.rec("drape", "curtain", {(x, y)}, group, x=x, y=y)

def thing(mp, x, y, sheet, idx, d, pat, name, kind=None, group=None, floor=True, note="", step=False, cat=None, occupy=None):
    """any character-sheet picture as a thing: on the floor it stands on its cell (same as characters, blocks it);
    otherwise (a wall / table thing) below the characters, walk-through"""
    tags = ("<Occupy:%s>" % occupy if occupy else "") + note
    e = mp.ev(x, y, sheet, idx, d, pat, name=name, priority=1 if floor else 0, through=not floor, step=step, note=tags)
    cells = {(x, y)}
    if occupy:
        kv = dict(t.split("=") for t in occupy.split(","))
        cells |= {(x + dx, y + dy) for dy in range(-int(kv.get("up", 0)), int(kv.get("down", 0)) + 1)
                  for dx in range(-int(kv.get("left", 0)), int(kv.get("right", 0)) + 1)}
    if floor:
        mp.solid |= cells; mp.blocked |= cells
    mp.rec(kind or name, cat or ("floorprop" if floor else "wallitem"), cells, group, x=x, y=y, event=True)
    if (cat or ("floorprop" if floor else "wallitem")) == "wallitem": mp.wall_items.append((group, kind or name, x, y))
    return e

def washstand(mp, x, y, group=None):
    """the washstand with a jug and a basin (the upper floors' prop, !Tavern_Props_Upper 1/2/2)"""
    return thing(mp, x, y, "!Tavern_Props_Upper", 1, 2, 2, "Umywalka", kind="umywalka", group=group)

def plain_chest(mp, x, y, group=None, name="Skrzynia"):
    """a plain wooden chest (!Fantasy_chest 6, facing down)"""
    return thing(mp, x, y, "!Fantasy_chest", 6, 2, 0, name, kind="skrzynia", group=group)

def trapdoor(mp, x, y, group=None):
    """the trapdoor down to the little cellar (A5 1,0) on the floor (layer 1, walkable)"""
    mp.tile(1, x, y, A5(1, 0))
    mp.rec("klapa do piwniczki", "floortile", {(x, y)}, group, x=x, y=y)

# ---- the cottage's own props (props/make_house_props.py -> img/characters/!House_Props.png)
def nightstand_candle(mp, x, y, group=None):
    """the nightstand C(5,0..1) standing on floor cell (x, y), a lit candle on its top: the candle's event is on the
    wall-row cell (x, y-1) where the top is drawn, above the characters (the top is a starred tile)"""
    nightstand(mp, x, y, group=group)
    mp.hprop("swieca_szafka", x, y - 1, group=group + " świece" if group else None, note=L_CANDLE_SMALL, priority=2)

def stool_candle(mp, x, y, group=None):
    stool(mp, x, y, group=group)
    mp.hprop("swieca_stolek", x, y, group=group + " świece" if group else None, note=L_CANDLE_SMALL)

def pipe_table(mp, x, y, group=None):
    """the little round table C(4,0..1) with grandpa's pipe: its top on row y, legs on y+1 (both closed)"""
    mp.piece("C", 4, 0, 1, 2, x, y, group=group, kind="stolik", solid_rows=[0, 1])
    mp.hprop("fajka", x, y + 1, group=group)

def sill_pot(mp, x, y_top, which=1, group=None):
    """a flower pot on the sill of the window at (x, y_top..y_top+1)"""
    mp.hprop("doniczka_%d" % which, x, y_top + 1, group=group)

def patchwork(mp, x, y, group=None):
    """grandpa's patchwork quilt laid over the double bed whose top-left floor cell is (x, y) (bed(mp, (13, 10), x, y,
    w=2)): !$House_Quilt (144 px frame, the quilt in its left 96 px) on the bed's right bottom cell, below the characters"""
    mp.ev(x + 1, y + 1, "!$House_Quilt", 0, 2, 0, name="Kołdra z łatek", priority=0, through=True)
    mp.rec("kołdra z łatek", "decal", {(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)}, group, x=x, y=y)
