# Shared pieces of the town concepts: Map008 "Okolice Tawerny" grown into a town around the tavern "Pod Złotym Kuflem".
# Grown out of tools/newstart (nslib: the editor-exact autotile shapes, NewMap's layers and writing; build_tavern_area /
# build_tavern_props: the tavern's front and the !Tavern_Yard things) and tools/house (records for a checker, docs).
#
# What this adds:
#   - Town: a NewMap for Map008 at a new size, with the six edge transfers kept at ids 1..6 (moved to the new edges) and the
#     tavern door at id 7 (its commands untouched: -> Map001 50,82); the links of the other maps that must follow (links());
#   - the tavern block of today's Map008 (building tiles + its events: door, sign, lanterns, dormers, chimneys, blockers,
#     front benches and notice board, beer garden, back yard, lamps...) copied to a new place, groups movable one by one;
#   - buildings from the tileset's own A3 / A4 wall and roof kinds (like the tavern), windows / flower boxes / chimneys from
#     the B sheet and the pack's pictures, a door event on every building (the ones with an interior later get a transfer);
#   - old fortress pieces (the B sheet's parapets, wall faces and round tower), fences, stalls, the dry well, camp, props;
#   - SOLID: which drawn tiles look solid. Tileset 9 has passage flags only on water (and a few A5 cliffs), so every solid
#     tile is closed by invisible blocker events with ChoppableTree's <Occupy:...> - made automatically at the end
#     (close_solids): exactly under the solid tiles, never elsewhere. Pictures block their own cells (+ <Occupy>).
#   - records for check_town.py and render_town.py: buildings, NPC spots, labels, links (the _meta.json next to the map).
# Nothing here writes data/: staged maps go to tools/town/staging/.
import os, sys, json, copy, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "newstart"))
sys.path.insert(0, HERE)
from nslib import (NewMap, B, C, D, E, A5, blank_page, write_map, ROOT, ground, blob, ring, patch, noise, lowfreq,
                   PINE, EXTRA, TMPL, line_dist)
import build_tavern_props as TY
import build_town_props as TP

STAGING = os.path.join(HERE, "staging")
DOCS = os.path.join(ROOT, "docs", "miasteczko")

def load_json(p):
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))

BASE = load_json(ROOT + "data/Map008.json")
BASE_EV = {e["id"]: e for e in BASE["events"] if e}
# tileset 9 as staged by build_tileset.py (the C and E slots filled, flags for them); built here when missing
TILESETS = os.path.join(STAGING, "Tilesets.json")
if not os.path.exists(TILESETS):
    import build_tileset
    build_tileset.build()
FLAGS9 = load_json(TILESETS)[9]["flags"]
def flag9(t):
    """tileset 9's flag of a tile (its list stops at 2816: the A2..A4 kinds have none = passable)"""
    return FLAGS9[t] if 0 <= t < len(FLAGS9) else 0

# ------------------------------------------------------------------ what is solid (the checker uses the same rules)
FENCE_KINDS = {22, 30, 38}          # A2 fence overlays
HEDGE_KINDS = {20}                  # the A2 hedge overlay
WATER_KINDS = set(range(0, 16)) | {44, 45}      # A1 water, the A2 puddle / pond looks: never in the town (drought)

def b_solid(col, row):
    """B-sheet tiles that stand up: the fortress pieces (parapets, wall faces, the round tower, diagonal walls, the arcade,
    the wooden scaffold) - not the windows / chimneys (they sit on building cells anyway), ivy, grass edges or stairs"""
    if col >= 8 and row <= 12: return True
    return False

def tile_solid(tid):
    """does this tile look like something one cannot walk through?"""
    if tid <= 0: return False
    if tid >= 2048:
        k = (tid - 2048) // 48
        if 48 <= k < 128: return True                 # A3 roofs / walls, A4 walls
        if k in FENCE_KINDS or k in HEDGE_KINDS: return True
        return False
    if tid < 256:                                    # B
        col = tid % 8 + (8 if tid >= 128 else 0)
        row = (tid % 128) // 8
        return b_solid(col, row)
    if 1536 <= tid < 1664:                           # A5: the stone wall rows 2..4, the rocky faces 9..10 and 14..15
        c, r = (tid - 1536) % 8, (tid - 1536) // 8
        return (c < 4 and r in (2, 3, 4, 9, 10)) or r in (14, 15)
    return False

def tile_water(tid):
    return tid >= 2048 and (tid - 2048) // 48 in WATER_KINDS

# ------------------------------------------------------------------ building looks (A3 roofs, A3 / A4 walls)
ROOFS = {"orange": 63, "orange_b": 48, "red": 56, "red_tile": 52, "red_b": 55, "slate": 60, "slate_b": 66, "teal": 49,
         "blue": 50, "black": 53, "green": 54, "thatch": 59, "straw": 67, "brown_scale": 68, "grey_scale": 69,
         "purple": 62, "sky": 70}
WALLS = {"stone": 76, "timber": 77, "timber_x": 78, "teal_plaster": 79, "logs": 72, "planks": 73, "grey_logs": 74,
         "boards": 75, "logs_v": 57, "planks_v": 64,
         "tf_blue": 80, "tf_orange": 81, "tf_green": 82, "dark_planks": 83, "planks_stone": 84, "red_timber": 85,
         "tf_brace": 88, "tf_brown": 89, "grey_stone": 90, "dark_stone": 91, "tan_stone": 92, "cobble_wall": 93,
         "plaster": 94, "brick_timber": 96, "fort_stone": 105, "fort_light": 97, "arches": 106, "gothic": 99,
         "red_brick": 104, "tan_block": 109, "brown_stone": 110, "marble": 113, "mossy": 120, "dark_block": 121}

# things of the C sheet (Fantasy_Outside_C, the staged slot C): name -> (col, row, w, h); the staged flags close them
C_THINGS = {"barrel": (4, 8, 1, 2), "barrel_water": (3, 8, 1, 2), "barrel_ladle": (3, 10, 1, 1), "barrel_pile": (2, 11, 3, 2),
            "barrels2": (5, 12, 2, 2), "barrel_crate": (3, 13, 2, 2), "barrel_apples": (5, 15, 1, 1), "barrel_flour": (4, 15, 1, 1),
            "barrel_tomato": (6, 15, 1, 1), "crate": (3, 4, 1, 2), "crate_b": (5, 4, 1, 2), "crate_lid": (7, 4, 1, 2),
            "crate_jug": (6, 8, 1, 2), "crate_sack": (7, 8, 1, 2), "jug_barrel": (4, 6, 1, 2), "sacks": (5, 11, 1, 1),
            "sacks_b": (6, 11, 1, 1), "sack": (7, 12, 1, 1), "pots": (5, 6, 1, 1), "bench": (10, 0, 2, 2), "bench_b": (12, 0, 2, 2),
            "table": (12, 2, 2, 2), "stool": (14, 3, 1, 1), "stool_b": (15, 3, 1, 1), "log_bench": (9, 3, 2, 1),
            "woodshed": (13, 5, 3, 2), "firewood": (8, 4, 3, 2), "logs_small": (13, 4, 1, 1), "chopping_block": (12, 4, 1, 2),
            "cart": (10, 6, 2, 2), "cart_b": (12, 8, 2, 2), "hay": (13, 10, 3, 2), "signpost": (1, 14, 1, 2), "planter": (4, 2, 1, 2),
            "planter_tree": (5, 0, 1, 2), "planter_small": (6, 1, 1, 1), "weapon_rack": (0, 6, 2, 2), "weapon_rack_b": (0, 8, 2, 2),
            "target": (1, 10, 1, 2), "target_b": (2, 10, 1, 2), "dummy": (0, 10, 1, 2), "anvil": (3, 2, 1, 2), "grindstone": (1, 4, 1, 2),
            "wheel": (14, 8, 1, 1), "hide_rack": (1, 2, 1, 2), "notice": (0, 13, 1, 2), "lantern_cage": (7, 14, 1, 2)}

# windows on the B sheet: name -> (col, row, w, h)
WINDOWS = {"shutter_lit": (2, 2, 2, 2), "shutter_dark": (0, 2, 2, 2), "shutter_shut": (4, 2, 2, 2), "shutter_shut_lit": (6, 2, 2, 2),
           "lit": (2, 0, 1, 2), "dark": (1, 0, 1, 2), "big_lit": (4, 0, 1, 2), "lattice": (5, 0, 1, 2), "lattice_lit": (6, 0, 1, 2),
           "arch_lit": (5, 4, 1, 2), "arch_dark": (4, 4, 1, 2), "arch_wood_lit": (7, 4, 1, 2), "arch_wood": (6, 4, 1, 2),
           "gothic_lit": (1, 4, 1, 2), "gothic_dark": (0, 4, 1, 2), "small_arch_lit": (3, 4, 1, 2),
           "tall_gothic_lit": (5, 8, 1, 2), "tall_gothic": (6, 8, 1, 2),
           "square_lit": (7, 6, 1, 2), "square": (6, 6, 1, 2), "stone_arch_lit": (5, 6, 1, 2),
           "tiny_lit": (0, 6, 1, 1), "tiny": (1, 6, 1, 1), "stone_small": (3, 6, 1, 1), "slit": (3, 7, 1, 1), "barred": (0, 7, 1, 1),
           "hatch": (1, 7, 1, 1)}
BOXES = [B(7, 0), B(7, 1), B(0, 1)]
DOORS = {"dark": 0, "light": 1, "planks": 2, "iron": 3, "red": 4, "white": 5, "rough": 6}
SIGNS = {"anvil": (0, 2, 0), "scales": (0, 2, 1), "sword": (0, 2, 2), "armor": (1, 2, 0), "potions": (1, 2, 2), "coin": (2, 2, 0),
         "beer": (2, 2, 1), "bow": (2, 2, 2), "scroll": (3, 2, 0), "ring": (3, 2, 1), "scissors": (0, 4, 0), "horseshoe": (0, 4, 1),
         "blank": (0, 4, 2)}
BANNERS = {"eagle": (0, 2), "black": (1, 2), "horse": (0, 4), "wolf": (0, 6), "fist": (0, 8)}

# the town's people: the spots are the concept's, the people the same in every concept (key -> name, role, hook)
CAST = {
    "soltys":   ("Sołtys Bogumił Wrona", "sołtys, ratusz: sprawy miasteczka, zlecenia, podatki",
                 "Między garnizonem, dworem Lorda a uchodźcami - każdy chce od niego czegoś innego; w ratuszu trzyma księgę z planem dawnej twierdzy."),
    "pisarz":   ("Pisarz Onufry", "pisarz gminny przy tablicy ogłoszeń",
                 "Przybija zlecenia i listy gończe; za drobną opłatą 'zapomina', kto o co pytał."),
    "kaplan":   ("Ojciec Hilary", "kapłan, świątynia: stare księgi o twierdzy",
                 "Strzeże kronik o Kruczych Skałach; jednej księgi nie pokaże nikomu - 'nie pytaj o to, czego nie chcesz wiedzieć'."),
    "kowal":    ("Kowal Mirosław Żar", "kowal, kuźnia: narzędzia, okucia, naprawy",
                 "Garnizon zamawia u niego groty; w murze kuźni ma zawias ze starej bramy twierdzy, którego nie da się przetopić."),
    "kupiec":   ("Kupiec Anzelm Morski", "kantor 'Towary z kontynentu'",
                 "Towar przypływa promem, ceny rosną z każdą bitwą; wie, kto płaci złotem z której strony wojny."),
    "piekarka": ("Piekarka Dorota", "piekarnia: chleb, placki",
                 "Wojsko rekwiruje zboże, chleb drożeje; u niej zbierają się plotki całego rynku."),
    "zielarka": ("Zielarka Jagna", "zielarnia: zioła, maści, napary",
                 "Uczennica szeptuchy z bagien; leczy uchodźców za darmo i pyta Ozzy'ego o jego 'widzenia'."),
    "szewc":    ("Szewc Tadeusz Dratwa", "szewc i krawiec: buty, płaszcze, łaty",
                 "Szyje buty żołnierzom i łata łachy uchodźców - słyszy obie strony wojny."),
    "wodziarz": ("Wodziarz Maciek", "wodziarz bez wody - siedzi przy suchej studni z pustymi beczkami (tylko rozmowa)",
                 "Kiedyś nosił wodę ze studni; teraz tylko opowiada - starzy mówią, że 'woda śpi pod wzgórzem' (cysterna zakonu)."),
    "kapral":   ("Kapral Wit Sokołowski", "posterunek straży Lorda Zaleskiego: rekwizycje, pobór",
                 "Nosi barwy Lorda; liczy worki zboża i młodych mężczyzn i szuka dezertera, który ukrywa się między uchodźcami."),
    "straznik": ("Strażnik bramy", "żołnierz straży Lorda przy bramie miejskiej",
                 "Sprawdza przybyszów z promu; za kufel u Borgara przymknie oko."),
    "przekupka": ("Przekupka Hanka", "stragan z warzywami (targ w każdy piątek)",
                  "Kupuje plony od bohatera w dzień targowy - konkurencja dla Borgara."),
    "starzyzna": ("Handlarz starzyzną Albin", "stragan ze starociami (dzień targowy)",
                  "Sprzedaje 'kamienie z twierdzy' i fałszywe odłamki Serca; jeden z nich okazuje się prawdziwym tropem."),
    "uchodzczyni": ("Ilona, uchodźczyni", "obóz uchodźców: wdowa z dziećmi",
                    "Szuka męża-dezertera; w zamian za pomoc zdradzi, co widziała na promie."),
    "dezerter": ("Bruno 'Cichy'", "obóz uchodźców: milczący przybysz",
                 "Dezerter pod fałszywym imieniem - kapral go szuka; może być sojusznikiem albo zdrajcą."),
    "borgar":   ("Borgar Kowal", "karczmarz (w tawernie, bez zmian)", "Tawerna zostaje jego sceną; wychodzi na próg wieczorem."),
}

# ------------------------------------------------------------------ small event builders
def msg(*lines):
    out = [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}]
    out += [{"code": 401, "indent": 0, "parameters": [l]} for l in lines]
    return out

def picture_event(name, char, index, direction, pattern, priority=1, trigger=0, cmds=None, note="", through=False, step=False):
    return {"name": name, "note": note, "pages": [blank_page(priority=priority, trigger=trigger, through=through, cmds=cmds,
            step=step, direction_fix=True, image={"characterName": char, "characterIndex": index, "direction": direction, "pattern": pattern})]}


class Town(NewMap):
    """Map008 at a new size. exits: ("S", [x..]) at the bottom edge -> Map022, ("E", [y..]) at the right edge -> Map024"""
    def __init__(self, concept, W, H, title, seed):
        NewMap.__init__(self, 8, W, H, 9, BASE["displayName"], BASE["note"], seed, bgm="Town1")
        props = {k: copy.deepcopy(v) for k, v in BASE.items() if k not in ("data", "events")}
        props.update({"width": W, "height": H})
        self.props = props
        self.concept, self.title = concept, title
        self.buildings = []          # dicts (see house())
        self.owner = {}              # cell -> name of the thing drawn there (for the blocker names and the checker)
        self.picture_block = {}      # cell -> event name: cells a picture event closes (its own + <Occupy>)
        self.npcs = []               # (key, x, y, dir)
        self.labels = []             # (text, x, y, kind)
        self.zones = []              # (name, cells, colour) for the plan
        self.notes = []
        self.links = {}
        self.kept_moves = []         # (old event id, name, old x, y, new x, y) for the report
        self.removed = []            # names of today's things that the concept leaves out
        self.streets = set()
        self.square = set()

    # ---------------------------------------------------------------- exits (ids 1..6) and the tavern door (id 7)
    def exits(self, south_xs, east_ys):
        """the six edge transfers of today's Map008 (ids 1..6, same commands) at the new edges"""
        H, W = self.H, self.W
        assert len(south_xs) == 3 and len(east_ys) == 3
        for i, x in enumerate(south_xs):
            e = copy.deepcopy(BASE_EV[1 + i]); e.pop("id"); ex, ey = e.pop("x"), e.pop("y")
            self.add(x, H - 1, e)
            self.kept_moves.append((1 + i, e["name"], ex, ey, x, H - 1))
        for i, y in enumerate(east_ys):
            e = copy.deepcopy(BASE_EV[4 + i]); e.pop("id"); ex, ey = e.pop("x"), e.pop("y")
            self.add(W - 1, y, e)
            self.kept_moves.append((4 + i, e["name"], ex, ey, W - 1, y))
        self.south_xs, self.east_ys = list(south_xs), list(east_ys)
        for x in south_xs:
            for dy in range(0, 3):
                self.keep_free.add((x, H - 1 - dy))
        for y in east_ys:
            for dx in range(0, 3):
                self.keep_free.add((W - 1 - dx, y))

    def tavern(self, dx, dy, groups=None, signpost=None, place=None):
        """today's tavern block moved by (dx, dy): the building's tiles (x 6..22, y 1..9, all four layers) and its events.
        groups: {group: (extra dx, extra dy) or None to leave it out}; place: {event id: (x, y) where it goes, or None to leave
        it out} for single things; the door (id 7) is always placed first after the exits"""
        g = {"building": (0, 0), "behind": (0, 0), "front": (0, 0), "terrace": (0, 0), "backyard": (0, 0), "signpost": (0, 0),
             "lamps": None, "yard": (0, 0)}
        g.update(groups or {})
        self.tavern_off = (dx, dy)
        W0, H0 = BASE["width"], BASE["height"]
        at = lambda z, x, y: BASE["data"][(z * H0 + y) * W0 + x]
        cells = set()
        for y in range(1, 10):
            for x in range(6, 23):
                for z in range(4):
                    t = at(z, x, y)
                    if t: self.layers[z][(x + dx, y + dy)] = ("t", t)
                cells.add((x + dx, y + dy))
                self.owner[(x + dx, y + dy)] = "Tawerna"
        self.tavern_cells = cells
        self.keep_free |= cells
        door = copy.deepcopy(BASE_EV[7])
        ox, oy = door.pop("x"), door.pop("y"); door.pop("id")
        self.door_xy = (ox + dx, oy + dy)
        self.add(ox + dx, oy + dy, door, [(ox + dx - 1, oy + dy), (ox + dx + 1, oy + dy)])
        self.kept_moves.append((7, door["name"], ox, oy, ox + dx, oy + dy))
        for c in [(ox + dx - 1, oy + dy), (ox + dx, oy + dy), (ox + dx + 1, oy + dy)]:
            self.picture_block[c] = door["name"]
        groups_ids = {"building": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], "behind": [18, 19, 20], "front": [21, 22, 23, 24, 25, 26],
                      "terrace": [27, 28, 29, 30, 31, 32, 33, 34, 35], "backyard": [36, 37, 38, 39, 40, 41, 42], "signpost": [43],
                      "lamps": [44, 45, 46, 47, 48, 49], "yard": [50, 51, 52, 53, 54]}
        for grp, ids in groups_ids.items():
            off = g.get(grp)
            if off is None:
                self.removed += ["%s (%d,%d)" % (BASE_EV[i]["name"], BASE_EV[i]["x"], BASE_EV[i]["y"]) for i in ids]
                continue
            for i in ids:
                e = copy.deepcopy(BASE_EV[i]); ex, ey = e.pop("x"), e.pop("y"); e.pop("id")
                nx, ny = ex + dx + off[0], ey + dy + off[1]
                if place and i in place:
                    if place[i] is None:
                        self.removed.append("%s (%d,%d)" % (e["name"], ex, ey)); continue
                    nx, ny = place[i]
                if i == 15 and e["note"] == "<Occupy:right=16,up=8>":
                    # today's blocker also closes the grass row behind the roof (y 0): harmless at the map's top edge, an
                    # invisible wall in the town - it closes the building's rows only (the roof starts one row lower)
                    e["note"] = "<Occupy:right=16,up=7>"
                    self.notes.append("Blokada 'Tawerna' (id 15) poprawiona: <Occupy:right=16,up=8> zamykała też trawę za dachem.")
                if i == 43 and signpost:
                    e["pages"][0]["list"] = msg(*signpost) + [{"code": 0, "indent": 0, "parameters": []}]
                fp = self._event_cells(e, nx, ny)
                self.add(nx, ny, e, fp)
                pg = e["pages"][0]
                if pg["priorityType"] == 1 and not pg["through"] and (pg["image"]["characterName"] or pg["image"]["tileId"]):
                    for c in fp: self.picture_block[c] = e["name"]; self.owner.setdefault(c, e["name"])
                self.kept_moves.append((i, e["name"], ex, ey, nx, ny))
        if g.get("terrace") is not None:
            tx, ty = g["terrace"]
            self.terrace_cells = self.rect(2 + dx + tx, 12 + dy + ty, 9 + dx + tx, 16 + dy + ty)
        else:
            self.terrace_cells = set()
        self.buildings.append({"key": "tawerna", "name": "Tawerna „Pod Złotym Kuflem”", "kind": "tawerna", "interior": True,
                               "rect": [6 + dx, 1 + dy, 22 + dx, 9 + dy], "door": list(self.door_xy), "npc": "borgar",
                               "note": "istniejąca (Map001)", "front": [self.door_xy[0], self.door_xy[1] + 1]})

    def _event_cells(self, e, x, y):
        """the cells an event blocks: its own + <Occupy> + ChoppableTree's solid pictures"""
        import re
        cells = [(x, y)]
        m = re.search(r"<Occupy:([^>]*)>", e.get("note") or "")
        if m:
            kv = {k.strip(): int(v) for k, v in (p.split("=") for p in m.group(1).split(",") if "=" in p)}
            cells = [(x + ddx, y + ddy) for ddy in range(-kv.get("up", 0), kv.get("down", 0) + 1) for ddx in range(-kv.get("left", 0), kv.get("right", 0) + 1)]
        pic = e["pages"][0]["image"]["characterName"]
        cells += [(x + a, y + b) for a, b in EXTRA.get(pic, [])]
        return cells

    # ---------------------------------------------------------------- buildings
    def house(self, key, name, x, y, w, roof_h, wall_h, roof, wall, upper=None, upper_h=0, door=None, door_style="dark",
              windows="lit", up_windows="lit", boxes=True, chimneys=(), sign=None, interior=False, kind="dom", npc=None,
              banner=None, gate=None, note="", win_cols=None, label=None, door_text=None, dormers=()):
        """a building from the tileset's kinds: roof rows (A3 roof kind), an upper storey (optional) and the ground floor
        (A3 / A4 wall kind); x, y = its top-left cell. door: the door's column from x (default the middle); the door is an
        event on the bottom row (!Fantasy_door1, or gate=(sheet, index) for a big gate). windows: a WINDOWS name for the ground
        floor, placed symmetrically away from the door (win_cols: the columns from x by hand)."""
        H = roof_h + upper_h + wall_h
        rk = ROOFS.get(roof, roof); wk = WALLS.get(wall, wall)
        yb = y + H - 1
        cells = self.rect(x, y, x + w - 1, yb)
        self.kind(0, self.rect(x, y, x + w - 1, y + roof_h - 1), rk)
        if upper:
            self.kind(0, self.rect(x, y + roof_h, x + w - 1, y + roof_h + upper_h - 1), WALLS.get(upper, upper))
        self.kind(0, self.rect(x, y + roof_h + upper_h, x + w - 1, yb), wk)
        for c in cells:
            self.layers[1].pop(c, None); self.owner[c] = name
        self.keep_free |= cells | self.rect(x - 1, yb + 1, x + w, yb + 1)
        dxd = door if door is not None else w // 2
        dx0 = x + dxd
        gw = 3 if gate else 1
        door_cells = [(dx0 + i, yb) for i in range(-(gw // 2), gw // 2 + 1)]
        # the ground-floor windows: 2-wide or 1-wide, symmetric, never over the door
        wc, wr, ww, wh = WINDOWS[windows] if windows else (0, 0, 0, 0)
        gf_top = y + roof_h + upper_h
        if windows:
            wrow = gf_top if wall_h >= 3 or wh == 1 else gf_top
            cols = win_cols if win_cols is not None else self._window_cols(w, ww, [c[0] - x for c in door_cells])
            for c in cols:
                self.tiles_b(wc, wr, ww, min(wh, wall_h), x + c, wrow)
                if boxes and wall_h >= 3 and wh == 2:
                    for i in range(ww): self.tile(3, x + c + i, wrow + 2, BOXES[(x + c) % 2 if boxes is True else boxes])
        if upper and up_windows:
            uc, ur, uw, uh = WINDOWS[up_windows]
            cols = [c for c in range(1, w - 1, 2) if c + uw <= w - 1]
            for c in cols:
                self.tiles_b(uc, ur, uw, min(uh, upper_h), x + c, y + roof_h)
        # the door
        if gate:
            sheet, gi = gate
            ev = picture_event("Drzwi: " + name, sheet, gi, 2, 1, priority=1, trigger=0,
                               cmds=msg(*(door_text or self._door_text(name, interior))), note="<Occupy:left=1,right=1><Town:door=%s>" % key)
        else:
            ev = picture_event("Drzwi: " + name, "!Fantasy_door1", DOORS[door_style], 2, 0, priority=1, trigger=0,
                               cmds=msg(*(door_text or self._door_text(name, interior))), note="<Town:door=%s>" % key)
        self.add(dx0, yb, ev, door_cells)
        for c in door_cells: self.picture_block[c] = ev["name"]
        for i, cx in enumerate(chimneys):
            self.chimney(x + cx, y + (1 if roof_h >= 3 else 0), phase=(x + i) % 6)
        for cx in dormers:
            self.picture(x + cx, y + roof_h - 1, "!Roof_Windows", 0, 8, 1, name="Okno na dachu", priority=1, through=True)
        if sign:
            k, d, p = SIGNS[sign]
            sx = dx0 + (gw // 2) + 1 if dx0 + gw // 2 + 1 <= x + w - 1 else dx0 - gw // 2 - 1
            self.picture(sx, yb - 1, "!Signs", k, d, p, name="Szyld: " + name, priority=1, through=True)
        if banner:
            k, d = BANNERS[banner]
            for bx in (x, x + w - 1) if w >= 7 else (x,):
                self.picture(bx, gf_top + 1, "!Flags_banner", k, d, 1, name="Chorągiew", priority=1, through=True)
        b = {"key": key, "name": name, "kind": kind, "interior": interior, "rect": [x, y, x + w - 1, yb], "door": [dx0, yb],
             "front": [dx0, yb + 1], "npc": npc, "note": note, "roof": roof, "wall": wall, "upper": upper, "label": label or name,
             "roof_h": roof_h, "upper_h": upper_h, "wall_h": wall_h, "gf_top": gf_top}
        self.buildings.append(b)
        return b

    # ---------------------------------------------------------------- the details that make a house (the Winlu sample towns)
    def dress(self, b, dormers=(), chimneys=(), ivy=(), lamps=(), gable=None, awnings=(), clutter=(), torches=(), shield=None, signs=()):
        """details on a building made by house(): b = its record.
        dormers  [(col, style)]      dormers with a flower box (!Town_Props dormer_<style>: wood grey dark blue orange red
                                     wood_dark), on the roof's lower rows
        chimneys [(col, style)]      stone chimneys of the B sheet (light grey tan red) rising over the ridge, smoke on top
        ivy      [(col, row)]        ivy down the wall from row (0 = the ground floor's top row)
        lamps    [col]               lanterns on wall brackets (!Decoration), lit at night
        torches  [col]               torches on the wall (!Decoration)
        gable    (col, style, wall)  a front gable of the E sheet (orange grey brown) over the roof, its wall painted in
        awnings  [(col, style)]      canvas awnings of the E sheet (beige beige2 striped red) in front of the wall
        clutter  [(thing, col, dy)]  C-sheet things (C_THINGS) standing in front of the wall, dy rows below the bottom row"""
        x0, y0, x1, y1 = b["rect"]
        rh, gf = b["roof_h"], b["gf_top"]
        if gable:
            gc, gstyle, gwall = gable
            self.front_gable(x0 + gc, y0, gstyle, WALLS.get(gwall, gwall))
        for col, style in dormers:
            self.prop("dormer_" + style, x0 + col, y0 + rh, label="Lukarna", force=True)
        for col, style in chimneys:
            bc, (sk, sp) = {"light": (2, (0, 0)), "grey": (4, (0, 2)), "tan": (5, (1, 1)), "red": (7, (2, 0))}[style]
            self.tile(2, x0 + col, y0, B(bc, 10)); self.tile(2, x0 + col, y0 + 1, B(bc, 11))
            self.picture(x0 + col, y0, "!Fantasy_chimney", sk, 2, sp, name="Komin", priority=1, through=True)
        for col, row in ivy:
            kind = [(1, 12), (2, 12), (3, 12), (5, 12), (6, 12)][(x0 + col + row) % 5]
            self.tile(3, x0 + col, gf + row, B(*kind)); self.tile(3, x0 + col, gf + row + 1, B(kind[0], 13))
        for col in lamps:
            self.picture(x0 + col, gf + 1, "!Decoration", 7, 2, 0, name="Latarnia na ścianie", priority=1, through=True,
                         note="<Light:150,90,62,24><LightWhen:night>")
        for col in torches:
            self.picture(x0 + col, gf + 1, "!Decoration", 3, 4, 1, name="Pochodnia", priority=1, through=True, step=True,
                         note="<Light:130,110,60,20><LightWhen:night>")
        if shield:
            self.tiles_b(12, 4, 1, 1, x0 + shield, gf)
        for col, style in awnings:
            self.awning(x0 + col, y1, style)
        for col, sign in signs:
            k, d, p = SIGNS[sign]
            self.picture(x0 + col, y1 - 1, "!Signs", k, d, p, name="Szyld", priority=1, through=True)
        for thing, col, dy in clutter:
            self.thing_c(thing, x0 + col, y1 + dy)

    GABLE_ROWS = {"brown": 0, "orange": 4, "grey": 8}
    # which of the 6 x 5 cells of a gable on the E sheet (cols 8..13) belong to it (the three gables share their edge rows)
    GABLE_MASK = {"brown": [{2, 3}, {1, 2, 3, 4}, {0, 1, 2, 3, 4, 5}, {0, 1, 2, 3, 4, 5}, {0, 5}],
                  "orange": [{2, 3}, {1, 2, 3, 4}, {0, 1, 2, 3, 4, 5}, {0, 1, 2, 3, 4, 5}, {0, 5}],
                  "grey": [{2, 3}, {1, 2, 3, 4}, {0, 1, 2, 3, 4, 5}, {0, 1, 2, 3, 4, 5}, {0, 5}]}

    def front_gable(self, x, y, style, wall_kind, window=True):
        """a front gable (a cross gable over the roof: the E sheet's 6-wide roof fronts) on a roof whose top row is y (4 rows):
        its peak rises one row over the ridge, its eaves end on the roof's bottom row; the triangle under it shows the wall
        (painted with wall_kind) with a pair of small lit windows. Star tiles: drawn over the hero, closed by the house."""
        r0 = self.GABLE_ROWS[style]
        for j, cols in enumerate(self.GABLE_MASK[style]):
            for i in sorted(cols):
                self.tile(3, x + i, y - 1 + j, E(8 + i, r0 + j))
        for (cx, cy) in [(2, 1), (3, 1), (1, 2), (2, 2), (3, 2), (4, 2), (1, 3), (2, 3), (3, 3), (4, 3)]:
            self.layers[0][(x + cx, y + cy)] = ("k", wall_kind)
        if window:
            for i in (2, 3):
                self.tile(2, x + i, y + 2, B(2, 0)); self.tile(2, x + i, y + 3, B(2, 1))

    def awning(self, x, y, style="beige"):
        """a canvas awning of the E sheet in front of a wall whose bottom row is y: the canvas over the wall's foot and the
        two cells in front, the poles standing in front (star tiles: the hero walks under it)"""
        c, r0, h = {"beige": (4, 5, 4), "beige2": (6, 5, 4), "striped": (4, 2, 3), "red": (6, 2, 3)}[style]
        for j in range(h):
            for i in range(2):
                self.tile(3, x + i, y - 1 + j, E(c + i, r0 + j))

    def thing_c(self, name, x, y, z=2):
        """a thing of the C sheet (C_THINGS) standing with its bottom-left on (x, y): tiles, the staged tileset's flags close it
        (its top is a star tile drawn over the hero)"""
        c, r, w, h = C_THINGS[name]
        for j in range(h):
            for i in range(w):
                cx, cy = x + i, y - h + 1 + j
                zz = z if (cx, cy) not in self.layers[2] or self.layers[2][(cx, cy)] == ("t", 0) else 3
                self.tile(zz, cx, cy, C(c + i, r + j))
                self.owner.setdefault((cx, cy), name)
        self.keep_free |= self.rect(x, y - h + 1, x + w - 1, y)

    def decor_obj(self, x, y, pic, name="Krzak (ozdobny)"):
        """a bush or a rock inside the town: the picture of Map003's gatherable things, but decorative (no <Bush>/<Rock>
        note - the user, 2026-09-29): it closes its own cell and the cells its picture covers (nslib.EXTRA)"""
        cells = [(x, y)] + [(x + a, y + b) for a, b in EXTRA.get(pic, [])]
        return self.picture(x, y, pic, 0, 2, 0, name=name, block=cells if len(cells) > 1 else None, priority=1, through=False)

    def decor_tree(self, x, y, kind="leafy", name="Drzewo (ozdobne)"):
        """a tree inside the town: decorative only (the user, 2026-09-29) - a picture that closes its trunk's cell, no
        <Tree> note (it cannot be felled); its crown is drawn over the hero walking behind it"""
        sheet, idx, d, p = {"leafy": ("!$Big_Trees_green", 0, 4, 2), "pine": ("!$Big_Trees_green", 0, 2, 2),
                            "small": ("!$Tree_Small", 0, 2, 0), "pine_a": ("!$Pine_A", 0, 2, 0), "pine_b": ("!$Pine_B", 0, 2, 0)}[kind]
        return self.picture(x, y, sheet, idx, d, p, name=name, priority=1, through=False)

    def _window_cols(self, w, ww, door_cols):
        """window columns from the left wall: symmetric pairs, a column gap from the door and the corners"""
        cols = []
        c = 1
        while c + ww <= w - 1:
            span = set(range(c, c + ww))
            if not any(abs(s - d) <= 1 for s in span for d in door_cols):
                cols.append(c); c += ww + 1
            else:
                c += 1
        return cols

    def _door_text(self, name, interior):
        if interior:
            return ["%s." % name, "(Wnętrze powstanie w następnym etapie.)"]
        return ["Drzwi zamknięte. Ktoś tu mieszka."]

    def tiles_b(self, col, row, w, h, x, y, z=2):
        for j in range(h):
            for i in range(w):
                self.tile(z, x + i, y + j, B(col + i, row + j))

    def chimney(self, x, y, phase=0):
        """an animated chimney with smoke (the tavern's !Fantasy_chimney), standing on a roof cell"""
        from build_tavern_area import chimney as _ch
        return _ch(self, x, y, 1, 1 + phase % 2, phase=phase % 6)

    def picture(self, x, y, char, index, direction, pattern, name="", priority=1, through=True, note="", cmds=None, trigger=0, step=False, block=None):
        """a picture event; block: the cells it closes (default: its own cell when priority 1 and not through)"""
        cells = block if block is not None else ([(x, y)] if priority == 1 and not through else [])
        if block:
            # the block must be a rectangle holding the event's cell: it becomes the event's own <Occupy:...>
            xs, ys = [c[0] for c in block], [c[1] for c in block]
            rect = self.rect(min(xs), min(ys), max(xs), max(ys))
            assert set(block) == rect and (x, y) in rect, "%s: block %s is not a rectangle around (%d,%d)" % (name, block, x, y)
            o = {"left": x - min(xs), "right": max(xs) - x, "up": y - min(ys), "down": max(ys) - y}
            tag = ",".join("%s=%d" % (k, o[k]) for k in ("left", "right", "up", "down") if o[k])
            if tag: note = "<Occupy:%s>" % tag + note
            priority, through = 1, False
        e = picture_event(name, char, index, direction, pattern, priority=priority, trigger=trigger, cmds=cmds, note=note, through=through, step=step)
        self.add(x, y, e, cells)
        for c in cells:
            self.picture_block[c] = name; self.owner.setdefault(c, name)
        return e

    # ---------------------------------------------------------------- things
    def yard(self, name, x, y, label=None, cmds=None, force=False):
        """one of the tavern's yard things (!Tavern_Yard, tools/newstart/build_tavern_props.py)"""
        i = TY.INDEX[name]
        k, d, p = TY.image_of(i)
        o = TY.PROPS[i][4]
        fp = [(x + a, y + b) for b in range(-o.get("up", 0), o.get("down", 0) + 1) for a in range(-o.get("left", 0), o.get("right", 0) + 1)]
        bad = [c for c in fp if not self.inside(*c) or c in self.taken or c in self.keep_free]
        if bad and not force: raise SystemExit("%s: %s at (%d,%d) on taken tiles %s" % (self.concept, name, x, y, bad))
        e = picture_event(label or name, TY.SHEET, k, d, p, priority=1, cmds=cmds, note=TY.occupy_note(name))
        self.add(x, y, e, fp)
        for c in fp: self.picture_block[c] = e["name"]; self.owner.setdefault(c, e["name"])
        return e

    def prop(self, name, x, y, label=None, cmds=None, force=False, trigger=0):
        """one of the town's things (!Town_Props, build_town_props.py); walkable ones lie below the hero"""
        i = TP.INDEX[name]
        k, d, p = TP.image_of(i)
        fp = TP.footprint(name, x, y)
        bad = [c for c in fp if not self.inside(*c) or c in self.taken or c in self.keep_free]
        if bad and not force: raise SystemExit("%s: %s at (%d,%d) on taken tiles %s" % (self.concept, name, x, y, bad))
        walk = TP.walkable(name)
        e = picture_event(label or name, TP.SHEET, k, d, p, priority=0 if walk else 1, through=walk, cmds=cmds, note=TP.occupy_note(name), trigger=trigger)
        self.add(x, y, e, fp)
        for c in fp: self.picture_block[c] = e["name"]; self.owner.setdefault(c, e["name"])
        return e

    def lamp(self, x, y):
        return self.picture(x, y, "!lamp", 0, 2, 0, name="Latarnia", priority=1, through=False)

    def campfire(self, x, y, pot=False):
        """the pack's campfire (!Decoration, animated): lit stones, or a cooking pot over the fire; it blocks its cell"""
        return self.picture(x, y, "!Decoration", 2, 6 if pot else 4, 1, name="Kociołek na ognisku" if pot else "Ognisko",
                            priority=1, through=False, step=True, note="<Light:160,120,70,20>")

    def npc(self, key, x, y, d=2):
        assert key in CAST, key
        self.npcs.append((key, x, y, d))
        self.keep_free.add((x, y))

    def label(self, text, x, y, kind="miejsce"):
        self.labels.append((text, x, y, kind))

    def tree(self, x, y, pic):
        """a tree / bush / rock of Map003 (they chop / mine / fruit like there)"""
        if pic in ("A", "B", "C"):
            ok = self.pine(x, y, pic)
        else:
            ok = self.put(x, y, pic)
        if ok:
            for c in [(x, y)] + [(x + a, y + b) for a, b in EXTRA.get(pic, [])]:
                self.owner.setdefault(c, "drzewo / kamień")
        return ok

    # ---------------------------------------------------------------- fortress pieces and fences
    def parapet_wall(self, x0, x1, y, face=2, shield_at=()):
        """a stretch of the old fortress wall: the parapet with merlons (B 8..10, row 1) on row y and the stone face
        (B 11 / 12, rows 4..5) on the rows below; shield_at: columns with the order's shield"""
        for x in range(x0, x1 + 1):
            col = 8 if x == x0 else 10 if x == x1 else 9
            self.tile(2, x, y, B(col, 1))
            for j in range(face):
                c = 12 if x in shield_at else 11
                self.tile(2, x, y + 1 + j, B(c, 4 + min(j, 1)))
            for j in range(face + 1):
                self.owner[(x, y + j)] = "Stary mur twierdzy"
                self.layers[1].pop((x, y + j), None)
        self.keep_free |= self.rect(x0, y, x1, y + face)

    def round_tower(self, x, y, name="Stara baszta"):
        """the pack's round tower (B 13..14, rows 1..7): x, y = its top-left cell; 2 x 7 cells"""
        for j in range(7):
            for i in range(2):
                self.tile(2, x + i, y + j, B(13 + i, 1 + j))
                self.owner[(x + i, y + j)] = name
                self.layers[1].pop((x + i, y + j), None)
        self.keep_free |= self.rect(x, y, x + 1, y + 6)

    def fence(self, cells, kind=22, name="Płot"):
        for c in cells:
            if self.inside(*c):
                self.layers[1][c] = ("k", kind)
                self.owner[c] = name
        self.keep_free |= set(cells)

    # ---------------------------------------------------------------- the end: blockers under every solid tile
    def solid_cells(self):
        data = self.resolve()
        W, H = self.W, self.H
        out = set()
        for y in range(H):
            for x in range(W):
                if any(tile_solid(data[(z * H + y) * W + x]) for z in range(4)): out.add((x, y))
        return out

    def close_solids(self):
        """invisible blocker events exactly over the solid tiles that no picture closes yet (greedy rectangles per thing)"""
        need = self.solid_cells() - set(self.picture_block)
        data = self.resolve()
        W, H = self.W, self.H
        for (x, y) in list(need):      # (tiles whose own flags already close all four ways need no event)
            if any((flag9(t) & 0x10) == 0 and (flag9(t) & 0xF) == 0xF for t in (data[(z * H + y) * W + x] for z in range(4)) if t):
                need.discard((x, y))
        by_owner = {}
        for c in sorted(need, key=lambda c: (c[1], c[0])):
            by_owner.setdefault(self.owner.get(c, "Przeszkoda"), set()).add(c)
        n = 0
        for owner in sorted(by_owner):
            left = by_owner[owner]
            while left:
                x0, y0 = min(left, key=lambda c: (c[1], c[0]))
                x1 = x0
                while (x1 + 1, y0) in left: x1 += 1
                y1 = y0
                while all((x, y1 + 1) in left for x in range(x0, x1 + 1)): y1 += 1
                self.blocker(x0, y0, x1, y1, owner)
                for c in self.rect(x0, y0, x1, y1): left.discard(c)
                n += 1
        return n

    # ---------------------------------------------------------------- links, meta, writing
    def links_list(self):
        """every transfer event of the other maps that must follow the new Map008, and Map008's own exits"""
        W, H = self.W, self.H
        dx, dy = self.door_xy
        out = []
        m1 = load_json(ROOT + "data/Map001.json")
        for eid in (10, 11, 12):
            e = m1["events"][eid]
            old = next(c["parameters"] for c in e["pages"][0]["list"] if c["code"] == 201)
            new = [0, 8, dx - 1 + (eid - 10), dy + 1, 2, 0]
            out.append({"map": 1, "event": eid, "name": e["name"], "x": e["x"], "y": e["y"], "old": old, "new": new})
        m22 = load_json(ROOT + "data/Map022.json")
        m24 = load_json(ROOT + "data/Map024.json")
        for eid, sx in zip((65, 66, 67), self.south_xs):
            e = m22["events"][eid]
            old = next(c["parameters"] for c in e["pages"][0]["list"] if c["code"] == 201)
            out.append({"map": 22, "event": eid, "name": e["name"], "x": e["x"], "y": e["y"], "old": old, "new": [0, 8, sx, H - 2, 8, 0]})
        for eid, ey in zip((65, 66, 67), self.east_ys):
            e = m24["events"][eid]
            old = next(c["parameters"] for c in e["pages"][0]["list"] if c["code"] == 201)
            out.append({"map": 24, "event": eid, "name": e["name"], "x": e["x"], "y": e["y"], "old": old, "new": [0, 8, W - 2, ey, 4, 0]})
        return out

    def meta(self):
        return {"concept": self.concept, "title": self.title, "idea": getattr(self, "idea", ""), "width": self.W, "height": self.H,
                "buildings": self.buildings, "npcs": [[k, x, y, d] for (k, x, y, d) in self.npcs],
                "labels": [list(l) for l in self.labels], "zones": [[n, sorted([list(c) for c in cells]), col] for (n, cells, col) in self.zones],
                "door": list(self.door_xy), "south_exits": self.south_xs, "east_exits": self.east_ys,
                "kept_moves": [list(k) for k in self.kept_moves], "removed": self.removed, "notes": self.notes,
                "links": self.links_list(), "square": sorted([list(c) for c in self.square]),
                "shots": [list(v) for v in getattr(self, "shots", [])]}

    def write_staged(self):
        os.makedirs(STAGING, exist_ok=True)
        data, events = self.resolve(), self.build_events()
        path = os.path.join(STAGING, "Map008_%s.json" % self.concept)
        write_map(path, self.props, data, events)
        with open(os.path.join(STAGING, "Map008_%s_meta.json" % self.concept), "wb") as f:
            f.write(json.dumps(self.meta(), ensure_ascii=False, indent=1).encode("utf-8"))
        return path, len(events) - 1


def paint_ground(mp, streets=(), lanes=(), square=(), paved=(), gardens=(), woods=(), light=(), tall_n=14, flowers=(),
                 square_kind=40, street_kind=19, paved_kind=42, kerb_kind=43, plants=60, seed=0):
    """the ground: Map003's grass kinds (ground()), then the town's ways - the square in grey cobbles (A2 40), streets in the
    tavern forecourt's cobbles (A2 19), lanes as dirt paths (A2 39 on layer 1), paved forecourts in bricks (A2 42), the beer
    garden's boards (A2 33), gardens as dark earth (A2 26). Cells already drawn on layer 0 (buildings) stay as they are.
    The grass is never one flat colour: lighter and bare patches, flower carpets, tall grass, darker grass along the walls
    (their shade), worn earth at the lanes' sides; the cobbled ways get a kerb of light stones (kerb_kind) on their outer
    cells; and `plants` flat plants of the D sheet (flowers, tufts, mushrooms, path stones - walkable) on the grass."""
    built = {c for c in mp.all if c in mp.layers[0]}
    terrace = set(getattr(mp, "terrace_cells", set()))
    cobbles = set(streets) | set(square)
    ways = cobbles | set(paved) | terrace
    keep = built | ways
    sd = mp.seed + seed
    free = mp.all - keep - set(lanes)
    lights, fl, bare = set(), set(), set()
    import random as _r
    r = _r.Random(sd)
    cells = sorted(free)
    for i in range(max(3, len(cells) // 90)):
        cx, cy = cells[r.randrange(len(cells))]
        lights |= blob(mp, cx, cy, 2.5 + r.random() * 3, 1.6 + r.random() * 2, sd + i)
    for i in range(max(2, len(cells) // 160)):
        cx, cy = cells[r.randrange(len(cells))]
        fl |= patch(mp, cx, cy, 1.0 + r.random() * 0.8, sd + 100 + i)
    worn = ring(mp, set(lanes), 1) & free
    bare = {c for c in worn if noise(c[0], c[1], sd + 7) < 0.45}
    ground(mp, paths=set(lanes) - built - ways, woods=set(woods), light=(set(light) | lights) & free, bare=bare,
           flowers=(set(flowers) | fl) & free - bare, tall_n=tall_n, keep=keep, floor_under_pines=True)
    # the walls' shade: darker grass on the grass row just below every building / wall (layer 1)
    for (x, y) in sorted(built):
        c = (x, y + 1)
        if c in free and c not in bare and mp.layers[1].get(c) is None and mp.layers[0].get(c) == ("k", 16):
            mp.layers[1][c] = ("k", 46)
    for kind, cs in ((street_kind, streets), (square_kind, square), (paved_kind, paved), (33, terrace), (26, gardens)):
        for c in set(cs) - built:
            mp.layers[0][c] = ("k", kind); mp.layers[1].pop(c, None)
    if kerb_kind:
        for (x, y) in sorted(cobbles - built):
            if any((x + dx, y + dy) not in ways and (x + dx, y + dy) not in built and mp.inside(x + dx, y + dy)
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                mp.layers[0][(x, y)] = ("k", kerb_kind)
    for c in ways | set(lanes):
        if c not in built: mp.region[c] = 7
    # flat plants on the grass (D sheet: walkable decals), never on ways, doors' fronts or under events
    PLANTS = [(8, 7), (8, 8), (9, 8), (10, 8), (11, 8), (12, 8), (14, 8), (15, 8), (12, 9), (14, 9), (15, 9), (14, 11),
              (12, 10), (13, 10), (12, 11), (13, 11), (9, 7), (10, 7), (11, 7), (11, 5), (14, 12)]
    spots = sorted(free - bare - mp.taken - mp.keep_free - set(mp.layers[2]))
    r.shuffle(spots)
    done = []
    for (x, y) in spots:
        if len(done) >= plants: break
        if any(abs(x - a) + abs(y - b) < 3 for a, b in done): continue
        mp.tile(2, x, y, D(*PLANTS[r.randrange(len(PLANTS))]))
        done.append((x, y))


def street(mp, points, width):
    """cells within width/2 of a polyline"""
    return {(x, y) for y in range(mp.H) for x in range(mp.W) if line_dist(x, y, points) <= width / 2}
