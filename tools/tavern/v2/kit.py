# Furniture, clutter, lamps and wall things for build_v2.py: the Winlu Interior pieces by name, placed the way the
# tileset's author places them on his sample map (furniture stands on its floor row, its top over the wall behind it;
# small things lie on top on layer 3; lamps, fireplaces, banners and heads are events of his character sheets).
# Anchors: (x, y) = the bottom-left floor cell a piece stands on (its tiles go up from there).
import os, sys, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, ".."))
from v2lib import SHEETF
from links import LIGHTS
from v2lib import load_json, BASE
SRC = {e["id"]: e for e in load_json(BASE)["events"] if e}

# name: (sheet, col, row, w, h)
P = {
    # chairs: the back row on top (star), the seat below. f = the way the sitter faces
    "chair_s": ("C", 8, 0, 1, 2), "chair_n": ("C", 9, 0, 1, 2), "chair_w": ("C", 10, 0, 1, 2), "chair_e": ("C", 11, 0, 1, 2),
    "arm_s": ("C", 8, 2, 1, 2), "arm_n": ("C", 9, 2, 1, 2), "arm_w": ("C", 10, 2, 1, 2), "arm_e": ("C", 11, 2, 1, 2),
    "arm_sw": ("C", 12, 2, 1, 2), "arm_se": ("C", 13, 2, 1, 2), "chair_sw": ("C", 12, 0, 1, 2), "chair_se": ("C", 13, 0, 1, 2),
    "stool": ("C", 14, 0, 1, 1), "stool_s": ("C", 15, 2, 1, 2), "bench2": ("C", 14, 1, 2, 1), "bench_v": ("C", 14, 2, 1, 3),
    "highchair": ("C", 2, 14, 1, 2), "throne": ("C", 3, 14, 1, 2), "sofa2": ("C", 0, 15, 2, 1),
    # tables
    "table3": ("C", 9, 4, 3, 2), "table2": ("C", 12, 4, 2, 2), "trestle3": ("C", 9, 6, 3, 2), "trestle2": ("C", 12, 6, 2, 2),
    "stone3": ("C", 9, 8, 3, 2), "drawer2": ("C", 12, 8, 2, 2), "table2b": ("C", 14, 8, 2, 2), "table_v3": ("C", 8, 4, 1, 3),
    "stone_v": ("C", 8, 7, 1, 3), "round_cloth": ("C", 15, 4, 1, 2), "round_cloth2": ("C", 14, 5, 1, 2), "plank_v": ("C", 15, 6, 1, 2),
    "desk": ("C", 3, 2, 1, 2), "nightstand": ("C", 5, 0, 1, 2), "smalltable": ("C", 6, 0, 1, 2), "roundtable_s": ("C", 4, 0, 1, 2),
    "washstand": ("C", 3, 12, 1, 2), "dresser_mirror": ("C", 8, 13, 1, 2),
    # wall furniture (stands on the first floor row, the top over the wall)
    "books_tall": ("C", 0, 0, 1, 3), "books_tall2": ("C", 1, 0, 1, 3), "books_tall3": ("C", 2, 0, 1, 3), "books_low": ("C", 3, 0, 1, 2),
    "food_shelf": ("C", 0, 3, 1, 2), "jar_shelf": ("C", 1, 3, 1, 2), "pantry2": ("C", 4, 4, 2, 2), "sideboard2": ("C", 6, 4, 2, 2),
    "sideboard2b": ("C", 6, 2, 2, 2), "cupboard": ("C", 4, 2, 1, 2), "bookcase2": ("C", 0, 6, 2, 3), "bookcase1": ("C", 2, 6, 1, 3),
    "bookcase2b": ("C", 3, 6, 2, 3), "bread_rack": ("C", 5, 6, 1, 3), "cheese_rack": ("C", 6, 6, 1, 3), "veg_rack": ("C", 7, 6, 1, 3),
    "dresser": ("C", 2, 9, 1, 2), "dish_cupboard2": ("C", 3, 9, 2, 2), "glass_cupboard": ("C", 5, 9, 1, 2), "wardrobe": ("C", 6, 10, 2, 3),
    "cupboard2": ("C", 3, 11, 2, 2), "cupboard1": ("C", 5, 11, 1, 2), "shelf_open": ("C", 2, 11, 1, 2), "screen4": ("C", 4, 13, 4, 3),
    # beds
    "bed_green": ("C", 12, 10, 1, 3), "bed_green2": ("C", 13, 10, 2, 3), "bed_patch": ("C", 15, 10, 1, 3), "bed_red": ("C", 13, 13, 1, 3),
    "bed_red2": ("C", 14, 13, 2, 3), "bed_straw": ("C", 9, 13, 1, 3), "bed_royal": ("C", 11, 12, 2, 4),
    # the shops sheet: the bar, its shelves and barrels, round tables
    "bar_l": ("E", 0, 0, 1, 2), "bar_m": ("E", 1, 0, 1, 2), "bar_r": ("E", 2, 0, 1, 2),
    "barv_top": ("E", 3, 0, 1, 1), "barv_mid": ("E", 3, 1, 1, 1), "barv_end": ("E", 3, 2, 1, 2),
    "bar_shelf": ("E", 6, 3, 2, 3), "wine_shelf": ("E", 1, 13, 2, 3), "curtain_shelf": ("E", 3, 13, 2, 3), "curtain_shelf1": ("E", 5, 13, 1, 3),
    "empty_shelf": ("E", 6, 0, 2, 3), "shop_shelf": ("E", 9, 14, 2, 2), "shop_shelf2": ("E", 11, 14, 2, 2), "shop_shelf3": ("E", 13, 14, 2, 2),
    "barrel_rack": ("E", 0, 7, 4, 2), "barrels_tap": ("E", 4, 7, 1, 2), "barrels_bottles": ("E", 5, 7, 1, 2), "barrels_sacks": ("E", 6, 7, 1, 2),
    "barrels_sacks2": ("E", 7, 7, 1, 2), "round_plain": ("E", 0, 13, 1, 2), "round_plain2": ("E", 7, 11, 1, 2),
    "weapon_shelf": ("E", 8, 5, 2, 3), "weapon_rack": ("E", 8, 10, 1, 2), "grindstone": ("E", 8, 12, 1, 2), "anvil": ("E", 10, 12, 1, 2),
    "stall": ("E", 8, 8, 1, 2), "scales": ("E", 6, 14, 1, 1),
    # barrels, sacks, crates (D)
    "barrel_water": ("D", 13, 0, 1, 2), "barrel": ("D", 14, 0, 1, 2), "barrel_sack": ("D", 15, 0, 1, 2), "barrels2": ("D", 8, 0, 2, 2),
    "barrels3": ("D", 10, 0, 3, 2), "sacks2": ("D", 8, 2, 2, 2), "sack": ("D", 10, 2, 1, 2), "sacks_spill": ("D", 8, 3, 2, 1),
    "crate_sack": ("D", 11, 3, 1, 2), "crate": ("D", 12, 3, 1, 2), "crates2": ("D", 13, 3, 1, 2), "crate_cloth": ("D", 14, 3, 1, 2),
    "bucket": ("D", 10, 3, 1, 1), "bucket_water": ("D", 9, 4, 1, 1), "woodpile": ("D", 10, 4, 1, 2), "broken_crate": ("D", 13, 5, 1, 2),
    "crate_open": ("D", 14, 11, 1, 2), "crate_lid": ("D", 15, 11, 1, 2), "plank": ("D", 8, 5, 1, 1), "ladder": ("D", 8, 13, 1, 3),
    "plant": ("D", 4, 7, 1, 2), "plant_pink": ("D", 5, 7, 1, 2), "plant_flowers": ("D", 6, 7, 1, 2), "plant_blue": ("D", 7, 8, 1, 2),
    "jar_big": ("D", 3, 6, 1, 2), "vase": ("D", 1, 8, 1, 1), "vase2": ("D", 2, 8, 1, 2), "urn": ("D", 6, 9, 1, 1), "pot": ("D", 4, 9, 1, 1),
    "pot2": ("D", 5, 9, 1, 1), "broom": ("D", 7, 6, 1, 2),
    # rugs (laid on layer 1)
    "bear_white": ("D", 9, 10, 2, 2), "bear_dark": ("D", 9, 12, 2, 2), "bear_brown": ("D", 9, 14, 2, 2), "fur_big": ("D", 11, 13, 2, 3),
    "rug_round_red": ("B", 14, 12, 2, 2), "rug_round_brown": ("B", 12, 14, 2, 2), "rug_round_ornate": ("B", 14, 14, 2, 2),
}
# small things that lie on tables, counters and shelves (layer 3, 1 x 1)
ITEM = {
    "fruit": ("D", 0, 10), "knife": ("D", 1, 10), "jar": ("D", 2, 10), "basket": ("D", 3, 10), "bread_basket": ("D", 4, 10),
    "bread": ("D", 5, 10), "book_open": ("D", 6, 10), "book_open2": ("D", 7, 10), "plate": ("D", 0, 11), "plate2": ("D", 1, 11),
    "mug": ("D", 2, 11), "mugs": ("D", 3, 11), "bottle": ("D", 4, 11), "rack": ("D", 5, 11), "book_red": ("D", 6, 11), "book": ("D", 7, 11),
    "bowl": ("D", 0, 12), "wine_jug": ("D", 1, 12), "glass": ("D", 2, 12), "glasses": ("D", 3, 12), "wine": ("D", 4, 12),
    "globe": ("D", 5, 12), "books": ("D", 6, 12), "books2": ("D", 7, 12), "meat_plate": ("D", 0, 13), "fish_plate": ("D", 1, 13),
    "quill": ("D", 2, 13), "beer": ("D", 3, 13), "potion": ("D", 4, 13), "skull": ("D", 5, 13), "scroll": ("D", 6, 13),
    "papers": ("D", 7, 13), "soup": ("D", 0, 14), "pasta": ("D", 1, 14), "cake": ("D", 2, 14), "pie": ("D", 3, 14), "scale": ("D", 4, 14),
    "pouch": ("D", 5, 14), "scrolls": ("D", 6, 14), "bun": ("D", 0, 15), "jug": ("D", 1, 15), "coins": ("D", 3, 15), "coins2": ("D", 4, 15),
    "sack_small": ("D", 5, 15), "coins3": ("D", 6, 15), "board_meat": ("D", 0, 8), "board_fish": ("D", 0, 9), "board_knife": ("D", 1, 9),
    "papers_wall": ("D", 10, 9), "papers_wall2": ("D", 13, 9),
}

def lamp(kind):
    return LIGHTS[kind]


class Kit:
    def __init__(self, m):
        self.m = m
        self.log = []

    # ---------------------------------------------------------------- kept events, hooks, guest spots
    def keep(self, eid, x, y, sheet=None, direction=None, bust=None, eid_keep=True):
        """an event of the old map moved here with its id (Borgar & co.); sheet: a new picture (index 0) if that file is
        in img/characters - the old bust is kept by a <Bust:...> note then"""
        import copy as _c
        from v2lib import ROOT
        src = _c.deepcopy(SRC[eid])
        note = src.get("note") or ""
        for pg in src["pages"]:
            im = pg["image"]
            if sheet and os.path.exists(ROOT + "img/characters/" + sheet + ".png") and im["characterName"]:
                im["characterName"], im["characterIndex"] = sheet, 0
                if bust and "<Bust:" not in note: note = (note + " " if note else "") + "<Bust:%s>" % bust
            if direction: im["direction"] = direction
        src["note"] = note
        return self.m.keep_event(src, x, y, eid=eid)
    def hook(self, tag, x, y, name, eid=None):
        return self.m.hook(tag, x, y, name, eid=eid)
    def relay(self, x, y, target, name):
        """an invisible event on a counter cell: the action button there starts event `target` (the person behind it)"""
        from nslib import blank_page
        pg = blank_page(priority=1, trigger=0, cmds=[{"code": 355, "indent": 0, "parameters": ["$gameMap.event(%d).start();" % target]}])
        return self.m.event(x, y, name, "", [pg])
    def spot(self, key, x, y, d):
        """an invisible place for a guest (TownLife.js puts the town's people there in the evening): below the characters,
        through, no commands, facing its table / the bar by the page's direction"""
        from nslib import blank_page
        pg = blank_page(priority=0, through=True, image={"direction": d})
        self.m.spots.append((key, x, y, d))
        return self.m.event(x, y, "Miejsce: " + key, "", [pg])
    # ---------------------------------------------------------------- tiles
    def put(self, name, x, y, z=2, room=None, flip=None):
        """a piece standing on (x, y) = its bottom-left cell; a tile whose cell already holds something on layer 2 goes on
        layer 3 (a chair back over a table's edge, a shelf top over a window)"""
        sh, c, r, w, h = P[name]
        y0 = y - h + 1
        for dy in range(h):
            for dx in range(w):
                zz = z
                if zz == 2 and self.m.L[2].get((x + dx, y0 + dy)) is not None: zz = 3
                self.m.t(zz, x + dx, y0 + dy, sh, c + dx, r + dy)
        self.m.things.append((name, x, y))
        return (x, y0, x + w - 1, y)
    def on(self, item, x, y, z=3):
        """a small thing lying on a table / counter / shelf top"""
        sh, c, r = ITEM[item]
        self.m.t(z, x, y, sh, c, r)
    def tile(self, sheet, c, r, x, y, z=2):
        self.m.t(z, x, y, sheet, c, r)
    def rug(self, x0, y0, x1, y1, kind):
        """an A2 rug on layer 1: 36 red runner, 37 beige mat, 38 red-gold, 21 dark brown, 22 purple-gold, 20 blue ornate,
        28 blue, 29 orange, 30 green"""
        for (x, y) in self.m.rect(x0, y0, x1, y1): self.m.kind(1, x, y, kind)
    def rug_piece(self, name, x, y):
        """a B/D rug piece laid flat on layer 1 (top-left at x, y)"""
        sh, c, r, w, h = P[name]
        for dy in range(h):
            for dx in range(w): self.m.t(1, x + dx, y + dy, sh, c + dx, r + dy)
    # ---------------------------------------------------------------- tables with chairs
    def round_table(self, x, y, kind="drinks", variant=0, chairs="we", room=None):
        """a round table (Shops sheet, 1 x 2: top on y-1, legs on y) with chairs W/E on row y (and N above / S below)"""
        col = variant % 8
        row = {"drinks": 9, "food": 11}.get(kind)
        if kind == "plain": self.put("round_plain", x, y)
        else: self.m.stamp(2, x, y - 1, "E", col, row, 1, 2)
        self.m.things.append(("round_table", x, y))
        if "w" in chairs: self.put("chair_e", x - 1, y)
        if "e" in chairs: self.put("chair_w", x + 1, y)
        if "n" in chairs: self.put("chair_s", x, y - 2)
        if "s" in chairs: self.put("chair_n", x, y + 2)

    def square_table(self, x, y, piece="table2", n=2, s=2, w=True, e=True, room=None):
        """a 2-wide table (its bottom-left cell x, y; top row y-1) with up to two chairs above (facing down), two below
        (facing up) and one at each end on row y"""
        self.put(piece, x, y, room=room)
        sh, c, r, ww, hh = P[piece]
        for i in range(n): self.put("chair_s", x + (0 if n == 2 else (ww - 1) // 2) + i, y - hh + 1, z=3)
        for i in range(s): self.put("chair_n", x + (0 if s == 2 else (ww - 1) // 2) + i, y + 1)
        if w: self.put("chair_e", x - 1, y)
        if e: self.put("chair_w", x + ww, y)
    # ---------------------------------------------------------------- events
    def ev(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=0, through=None, step=False, note="", eid=None):
        return self.m.pic(x, y, char, index, direction, pattern, name=name, priority=priority, through=through, step=step, note=note, eid=eid)
    def fireplace(self, x, y, kind=2, name="Kominek"):
        """a Winlu fireplace (!$Fireplace1/2/4, lit = direction 4; 3 x 3) standing on (x, y), closing x-1..x+1"""
        return self.ev(x, y, "!$Fireplace%d" % kind if kind else "!$Fireplace", 0, 4, 0, name=name, priority=1, step=True,
                       note="<Occupy:left=1,right=1>" + lamp("fireplace"))
    def chandelier(self, x, y):
        """an iron chandelier hanging over (x, y-2..y), above the people"""
        return self.ev(x, y, "!$Chandelier", 0, 4, 0, name="Żyrandol", priority=2, through=True, step=True, note=lamp("chandelier"))
    def candle(self, x, y, three=False, light=True):
        """a lit candle (three candles) standing on a table / shelf cell (the event on the cell where the top is)"""
        return self.ev(x, y, "!Decoration2", 1, 6 if three else 2, 0, name="Świeca", priority=0, through=True, step=True,
                       note=lamp("candles3" if three else "candle") if light else "")
    def candelabra(self, x, y, brown=True):
        return self.ev(x, y, "!Decoration2", 4, 6 if brown else 2, 0, name="Kandelabr", priority=1, step=True, note=lamp("candelabra"))
    def sconce(self, x, y):
        """a candle sconce on a wall face cell"""
        return self.ev(x, y, "!Decoration2", 0, 2, 0, name="Kinkiet", priority=0, through=True, step=True, note=lamp("sconce"))
    def torch(self, x, y):
        return self.ev(x, y, "!Decoration2", 3, 4, 0, name="Pochodnia", priority=0, through=True, step=True, note=lamp("sconce"))
    def lantern(self, x, y, style=0, small=False):
        """a hanging lantern seen on the wall cell (x, y): its event one cell lower"""
        return self.ev(x, y + 1, "!Decoration", 7, [2, 4, 6][style], 0, name="Latarnia", priority=0, through=True, step=True,
                       note=lamp("lantern_small" if small else "lantern"))
    def banner(self, x, y, col, row=0):
        """a banner (48 x 96) hanging on wall rows y-1..y"""
        return self.ev(x, y, "!Flags_banner_Inside", col // 3, [2, 4, 6, 8][row], col % 3, name="Chorągiew", priority=0, through=True)
    def head(self, x, y, which=0):
        """a mounted deer head (0), crossed axes (1) or a dragon skull (2) on the wall cell (x, y): event one row lower"""
        return self.ev(x, y + 1, "!$Wall_decoration", 0, [2, 4, 6][which], 0, name=["Poroże jelenia", "Topory", "Czaszka smoka"][which],
                       priority=0, through=True)
    def deco(self, x, y, index, direction, pattern, name="", priority=0, through=None):
        """any !Decoration_static picture"""
        return self.ev(x, y, "!Decoration_static", index, direction, pattern, name=name, priority=priority, through=through)
    def painting(self, x, y, which=0):
        """a framed painting on the wall cell (x, y): 0 castle, 1 cottage, 2 sunset lake, 3 sunset, 4 fencers, 5 man, 6 king,
        7 lady, 8 rose"""
        idx, d, p = [(7, 4, 1), (7, 4, 2), (7, 6, 0), (7, 6, 1), (7, 6, 2), (7, 8, 1), (7, 8, 2), (6, 8, 2), (6, 4, 2)][which]
        return self.deco(x, y, idx, d, p, name="Obraz")
    def firewood(self, x, y):
        return self.deco(x, y, 3, 8, 2, name="Drewno na opał", priority=1)
    def hanging(self, x, y, which):
        """things hanging from a pole (0 hams, 1 fish, 2 herbs, 3 garlic): on the wall cell, the event on it"""
        idx, p = [(2, 1), (2, 2), (3, 0), (3, 1)][which]
        return self.deco(x, y, idx, 8, p, name="Wiszące zapasy", priority=2)
    def pillar(self, x, y, kind="wood"):
        """a pillar standing on (x, y): wood (B 12, 3 tall), stone / marble / green (B 11 / 13 / 14)"""
        c = {"wood": 12, "stone": 11, "marble": 13, "green": 14}[kind]
        self.m.stamp(2, x, y - 2, "B", c, 8, 1, 3)
    def statue(self, x, y, p=1):
        return self.ev(x, y, "!Statue", 0, 2, p, name="Zbroja", priority=1)
    def chest(self, x, y, idx=0, d=2):
        return self.ev(x, y, "!Fantasy_chest", idx, d, 0, name="Kufer", priority=1)
    def prop(self, x, y, index, direction, pattern, name="", priority=0, sheet="!Tavern_Props", through=None, note=""):
        return self.ev(x, y, sheet, index, direction, pattern, name=name, priority=priority, through=through, note=note)
    def big_prop(self, x, y, index, direction=2, pattern=0, name="", priority=1, note=""):
        """one of !Tavern_Props2's 96 x 96 pictures (2 x 2 cells, centred on the event's cell)"""
        return self.ev(x, y, "!Tavern_Props2", index, direction, pattern, name=name, priority=priority, note=note)
    def table_runner(self, x, y, d=2, p=1, idx=0):
        return self.ev(x, y, "!Table_Decoration", idx, d, p, name="Bieżnik", priority=0, through=True)
    # ---------------------------------------------------------------- windows (on a wall face, 1 x 2)
    def window(self, x, y, kind="lit", curtain=None, drapes=None):
        """a window whose top is on wall row y; kind: lit / night (shutter windows), arch / arch_night, small; curtain: a
        colour index 0..7 of the swags drawn over it (B 12..13); drapes: the red side drapes (B 6..7, 14..15) left and right"""
        c, r = {"lit": (1, 2), "night": (0, 2), "arch": (5, 2), "arch_night": (4, 2), "shutters": (2, 2), "shutters_lit": (3, 2),
                "small": (2, 0), "gothic": (1, 4), "round": (3, 8)}[kind]
        self.m.stamp(2, x, y, "B", c, r, 1, 2)
        if curtain is not None: self.m.stamp(3, x, y, "B", curtain, 12, 1, 2)
        if drapes:
            self.m.stamp(3, x - 1, y, "B", 7, 14, 1, 2); self.m.stamp(3, x + 1, y, "B", 6, 14, 1, 2)
