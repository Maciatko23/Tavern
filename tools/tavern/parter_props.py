# Macros for the big ground floor (build_parter.py) - new, so props.py stays as the upper-floors agent knows it.
# Differences from props.py: no blocker events (the staged tileset-8 flags close furniture; the generator adds a blocker
# only where the flags cannot), every lamp carries its own <Light> note (+ <LightWhen:night>, links.LIGHTS) on its
# picture event, the new props come from props_index.json, and every placed thing is recorded for the placement checks.
import os, sys, json, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tavlib import *
from links import LIGHTS
import parter_layout as L

IDX = json.load(open(os.path.join(HERE, "props_index.json"), encoding="utf-8"))

class Parter(TavernMap):
    """the ground floor: TavernMap + a record of what stands where (for the checker) and intended solid cells"""
    def __init__(self, note):
        TavernMap.__init__(self, L.W, L.H, note, display="Tawerna", seed=2026)
        self.want_solid = set()        # cells furniture should close (a blocker is added where the flags do not)
        self.things = []               # {kind, cat, cells, room, group, x, y, ...} - for check_placement.py
        self.hooks = []                # (tag, x, y, note) gameplay hook events
        self.wall_items = []           # (room, kind, x, row) things hung on north walls - spacing / height checks
    # ---- no blocker events: remember the solid cells instead
    def block(self, x0, y0, x1, y1, name="Blokada"):
        cells = self.rect(x0, y0, x1, y1)
        self.solid |= cells; self.want_solid |= cells
    def rec(self, kind, cat, cells, group=None, **extra):
        d = {"kind": kind, "cat": cat, "cells": sorted(cells), "group": group}
        d.update(extra)
        self.things.append(d)
        return d
    # ---- tiles
    def piece(self, sheet, sc, sr, w, h, x, y, z=2, cat="furniture", kind=None, group=None, solid_rows=None):
        """a Winlu piece as tiles; solid_rows: which rows (0-based from the top) the piece stands on (default: the last)"""
        self.tiles(sheet, sc, sr, w, h, x, y, z)
        rows = solid_rows if solid_rows is not None else [h - 1]
        cells = {(x + dx, y + r) for r in rows for dx in range(w)}
        self.want_solid |= cells; self.solid |= cells
        return self.rec(kind or "%s(%d,%d)" % (sheet, sc, sr), cat, cells, group, x=x, y=y, w=w, h=h, sheet=sheet, sc=sc, sr=sr)
    # ---- events
    def ev(self, x, y, char, index=0, direction=2, pattern=0, name="", priority=0, through=True, step=False, note="",
           trigger=0, cmds=None):
        e = self.picture(x, y, char, index, direction, pattern, name=name, priority=priority, trigger=trigger, cmds=cmds,
                         note=note, through=through, step=step)
        if priority == 1 and not through:
            self.solid.add((x, y)); self.blocked.add((x, y))
        return e
    def prop(self, key, x, y, group=None, note="", name=None, priority=None, occupy=None):
        """one of our props (props_index.json) as an event: floor things block their cell, table / wall things do not"""
        p = IDX[key]
        floor = p["place"] in ("floor", "floor2", "floor3")
        prio = priority if priority is not None else (1 if floor else 0)
        tags = note
        if occupy: tags = "<Occupy:%s>" % occupy + tags
        e = self.ev(x, y, p["sheet"], p["index"], p["direction"], p["pattern"], name=name or p.get("name", key), priority=prio,
                    through=prio != 1, step=bool(p.get("anim")), note=tags)
        cells = {(x, y)}
        if occupy:
            kv = dict(kv.split("=") for kv in occupy.split(","))
            cells |= {(x + dx, y + dy) for dy in range(-int(kv.get("up", 0)), int(kv.get("down", 0)) + 1)
                      for dx in range(-int(kv.get("left", 0)), int(kv.get("right", 0)) + 1)}
        if floor:
            self.solid |= cells; self.blocked |= cells
        self.rec(key, {"floor": "floorprop", "floor2": "floorprop", "floor3": "floorprop", "table": "tableitem",
                       "counter": "counteritem", "wall": "wallitem", "wall_hi": "wallitem"}[p["place"]], cells, group,
                 x=x, y=y, event=True, art=p.get("art"), fw=p["w"], fh=p["h"])
        return e
    def hook(self, tag, x, y, name=None, opts="", suffix=""):
        """a gameplay hook for the tavern plugins: an empty event, same as characters, action button, a Comment with the
        tag on page 1 (QuestBoard.js / TavernDice.js / TavernLife.js find it by the tag); opts = the tag's own options,
        e.g. "dir=4" or "dir=8 plate=0,-2" for a <Tavern:mealtable> seat (TavernLife.js help)"""
        text = "<Tavern:%s%s%s>" % (tag, suffix, (" " + opts) if opts else "")
        cmds = [{"code": 108, "indent": 0, "parameters": [text]}]
        e = self.picture(x, y, "", 0, 2, 0, name=name or ("Tavern:" + tag), priority=1, trigger=0, cmds=cmds, note="")
        self.hooks.append((tag, x, y))
        self.hook_tags = getattr(self, "hook_tags", []) + [(tag, x, y, text)]
        return e

# ---------------------------------------------------------------------------------------------- lamps (picture + light)
def lamp_note(kind):
    return LIGHTS[kind]

def chandelier(mp, x, y, group=None):
    """an iron chandelier with lit candles hanging over (x, y-2..y); its event on (x, y), above the people"""
    mp.ev(x, y, "!$Chandelier", 0, 4, 0, name="Żyrandol", priority=2, through=True, step=True, note=lamp_note("chandelier"))
    mp.rec("chandelier", "lamp", {(x, y)}, group, x=x, y=y)

def candelabra(mp, x, y, group=None, dark=False):
    """a standing candelabra (!Decoration2 char 4): it stands on its cell"""
    mp.ev(x, y, "!Decoration2", 4, 2 if dark else 6, 0, name="Kandelabr", priority=1, through=False, step=True, note=lamp_note("candelabra"))
    mp.rec("candelabra", "floorprop", {(x, y)}, group, x=x, y=y)

def candles_table(mp, x, y, group=None, three=True):
    """our wax-drip candle on a table (the event on the table's lower row, the candle on its top)"""
    mp.prop("swieca", x, y, group=group, note=lamp_note("candle"))

def sconce(mp, x, y, group=None):
    """a candle sconce on a wall face (!Decoration2 char 0 dir 2), event on the wall cell"""
    mp.ev(x, y, "!Decoration2", 0, 2, 0, name="Kinkiet", priority=0, through=True, step=True, note=lamp_note("sconce"))
    mp.rec("sconce", "wallitem", {(x, y)}, group, x=x, y=y)

def wall_lantern(mp, x, y, style=0, group=None, light="lantern"):
    """a hanging wall lantern (!Decoration char 7): seen on wall cell (x, y), its event one cell lower"""
    mp.ev(x, y + 1, "!Decoration", 7, [2, 4, 6][style], 0, name="Latarnia", priority=0, through=True, step=True, note=lamp_note(light))
    mp.rec("lantern", "wallitem", {(x, y + 1)}, group, x=x, y=y + 1)

def fill_light(mp, x, y):
    mp.light(x, y, lamp_note("fill"), "wypelnienie")

def window_day(mp, x, y_top, length=150):
    """the sunlight of a window by day: a beam from the window's top down onto the floor"""
    note = lamp_note("window_day").replace("length=150", "length=%d" % length)
    mp.light(x, y_top, note, "okno (dzień)")

def window(mp, x, y, kind="night", curtain=None, group=None, day=True, length=170):
    """a window on a wall face, two cells tall from row y (night panes: dark blue in the evening, sunlit by day)"""
    k = {"night": (0, 2), "arch": (4, 2), "small_arch": (6, 4), "gothic": (0, 4), "round": (4, 8)}[kind]
    mp.tiles("B", k[0], k[1], 1, 2, x, y)
    if curtain is not None: mp.tiles("B", curtain, 12, 1, 2, x, y, z=3)
    mp.wall_items.append((group, "window", x, y))
    if day: window_day(mp, x, y, length)

def big_hearth(mp, x, y, group=None):
    """the big stone fireplace built into a 3-row wall face whose top row is y (4 wide: pilaster, arch x2, pilaster),
    the fire (animated campfire) in the arch, a mantel with plates; the fire's light falls on the floor in front"""
    for dy in range(3):
        r = 12 if dy < 2 else 13
        mp.t("A5", 0, r, x, y + dy, z=0); mp.t("A5", 1, r, x + 3, y + dy, z=0)
    mp.t("A5", 0, 12, x + 1, y, z=0); mp.t("A5", 1, 12, x + 2, y, z=0)
    mp.tiles("A5", 4, 12, 2, 2, x + 1, y + 1, z=0)
    mp.t("D", 6, 2, x + 1, y); mp.t("D", 7, 2, x + 2, y)
    mp.t("D", 6, 3, x + 1, y + 1); mp.t("D", 7, 3, x + 2, y + 1)
    mp.ev(x + 1, y + 2, "!Decoration", 2, 4, 0, name="Ogień", priority=1, through=False, step=True, note=lamp_note("fireplace"))
    mp.ev(x + 2, y + 2, "!Decoration", 2, 4, 1, name="Ogień", priority=1, through=False, step=True)
    mp.rec("hearth", "wallitem", {(x + i, y + 2) for i in range(4)}, group, x=x, y=y + 2)

def fireplace_pic(mp, x, y, kind=4, group=None, wide=False):
    """a Winlu fireplace picture (!$Fireplace1/2/4, lit = direction 4) standing on (x, y); wide: it also closes the
    cells left and right (the ornate one is ~1.4 cells wide)"""
    note = ("<Occupy:left=1,right=1>" if wide else "") + lamp_note("fireplace")
    mp.ev(x, y, "!$Fireplace%d" % kind, 0, 4, 0, name="Kominek", priority=1, through=False, step=True, note=note)
    cells = {(x - 1, y), (x, y), (x + 1, y)} if wide else {(x, y)}
    mp.rec("fireplace", "floorprop", cells, group, x=x, y=y)
    mp.solid |= cells

def firewood(mp, x, y, group=None):
    """a stack of firewood (!Decoration_static char 3, dir 8, pattern 2), standing on its cell"""
    mp.ev(x, y, "!Decoration_static", 3, 8, 2, name="Drewno na opał", priority=1, through=False)
    mp.rec("firewood", "floorprop", {(x, y)}, group, x=x, y=y)

def plant(mp, x, y, group=None, kind=0):
    """a potted plant (D 4,8..9 green / 7,8..9 blue flowers / 6,8..9 urn): its pot on (x, y), the leaves above"""
    c = (4, 7, 6)[kind]
    mp.piece("D", c, 8, 1, 2, x, y - 1, group=group, kind="roślina")

def statue(mp, x, y, pattern=1, group=None):
    """a suit of armour on a stand (!Statue char 0, 48x144; the knights are patterns 1 and 2 - the sheet's first
    column is empty): standing on (x, y)"""
    mp.ev(x, y, "!Statue", 0, 2, pattern, name="Zbroja", priority=1, through=False)
    mp.rec("statue", "floorprop", {(x, y)}, group, x=x, y=y)

def clock(mp, x, y, group=None):
    mp.ev(x, y, "!clock", 0, 2, 0, name="Zegar", priority=1, through=False, step=True)
    mp.rec("clock", "floorprop", {(x, y)}, group, x=x, y=y)

def hanging(mp, x, y, which, group=None):
    """things hanging from a pole on a wall / ceiling (!Decoration_static row 3, dir 8): 0 hams, 1 fish, 2 herbs,
    3 garlic, 4 firewood rack"""
    char, pat = [(2, 0), (2, 1), (2, 2), (3, 0), (3, 1)][which]
    mp.ev(x, y, "!Decoration_static", char, 8, pat, name="Wiszące zapasy", priority=2, through=True)
    mp.wall_items.append((group, "hanging", x, y))

def kitchen_stove(mp, x, y, group=None, hood=2):
    """a stone stove with a pot (!$Fireplace_kitchen dir 4) standing on (x, y), its stone hood (!$chimney) above"""
    mp.ev(x, y - 1, "!$chimney", 0, [2, 4, 6, 8][hood], 0, name="Okap", priority=0, through=True)
    mp.ev(x, y, "!$Fireplace_kitchen", 0, 4, 0, name="Piec kuchenny", priority=1, through=False, step=True, note=lamp_note("stove"))
    mp.rec("stove", "floorprop", {(x, y)}, group, x=x, y=y)

def cauldron_fire(mp, x, y, group=None):
    mp.ev(x, y, "!Decoration", 2, 6, 0, name="Kocioł", priority=1, through=False, step=True, note=lamp_note("oven"))
    mp.rec("cauldron", "floorprop", {(x, y)}, group, x=x, y=y)

def campfire(mp, x, y, group=None):
    mp.ev(x, y, "!Decoration", 2, 4, 0, name="Palenisko", priority=1, through=False, step=True, note=lamp_note("oven"))
    mp.rec("campfire", "floorprop", {(x, y)}, group, x=x, y=y)

def chest(mp, x, y, idx=0, group=None):
    mp.ev(x, y, "!Fantasy_chest", idx, 2, 0, name="Kufer", priority=1, through=False)
    mp.rec("chest", "floorprop", {(x, y)}, group, x=x, y=y)

def rug(mp, x0, y0, x1, y1, kind=38):
    """an A2 rug (layer 1): 36 red runner, 37 doormat, 38 red-gold, 21 dark brown, 22 purple-gold, 28 blue, 29 orange, 30 green"""
    mp.kind(1, mp.rect(x0, y0, x1, y1), kind)

def banner(mp, x, y, col, row=0, group=None):
    """a hanging banner (!Flags_banner_Inside, 48x96 frames) on wall cell rows y-1..y (event on y)"""
    mp.ev(x, y, "!Flags_banner_Inside", col // 3, [2, 4, 6, 8][row], col % 3, name="Chorągiew", priority=0, through=True)
    mp.wall_items.append((group, "banner", x, y))

def deer_head(mp, x, y, group=None):
    """a mounted deer head: its event one row below the wall cell y where it hangs"""
    mp.ev(x, y + 1, "!$Wall_decoration", 0, 2, 0, name="Poroże jelenia", priority=0, through=True)
    mp.wall_items.append((group, "trophy", x, y + 1))

def shield_axes(mp, x, y, group=None):
    mp.ev(x, y + 1, "!$Wall_decoration", 0, 4, 0, name="Tarcza z toporami", priority=0, through=True)
    mp.wall_items.append((group, "trophy", x, y + 1))

def wall_prop(mp, key, x, y, group=None, kind=None):
    """one of our wall props (event on the wall cell)"""
    mp.prop(key, x, y, group=group)
    mp.wall_items.append((group, kind or key, x, y))

def painting(mp, x, y, char, direction, pattern, group=None):
    mp.ev(x, y, "!Decoration_static", char, direction, pattern, name="Obraz", priority=0, through=True)
    mp.wall_items.append((group, "painting", x, y))

# ---------------------------------------------------------------------------------------------- furniture (tiles)
def counter_h(mp, x0, x1, y, left_end=True, right_end=True, group=None, cloth=None):
    """a horizontal Shops counter from x0 to x1: its top on row y, its front on row y+1 (both block, counter flag)"""
    for x in range(x0, x1 + 1):
        col = 0 if (x == x0 and left_end) else 2 if (x == x1 and right_end) else 1
        r = 0 if cloth is None else cloth
        mp.t("E", col, r, x, y); mp.t("E", col, r + 1, x, y + 1)
    cells = mp.rect(x0, y, x1, y + 1)
    mp.want_solid |= cells; mp.solid |= cells
    mp.rec("counter_h", "counter", cells, group, x=x0, y=y, x1=x1)

def counter_arm(mp, x, y0, y1, side=3, group=None):
    """a vertical counter arm (E 3 or 5): top end on y0, the front on y1"""
    for y in range(y0, y1 + 1):
        row = 3 if y == y1 else 2 if y == y1 - 1 else 0 if y == y0 else 1
        mp.t("E", side, row, x, y)
    cells = mp.rect(x, y0, x, y1)
    mp.want_solid |= cells; mp.solid |= cells
    mp.rec("counter_arm", "counter", cells, group, x=x, y=y0, y1=y1)

def table_h(mp, x, y, length, style=4, group=None):
    """a long table across (C 9..11 rows style..style+1): x..x+length-1, rows y, y+1 (both block)"""
    for i in range(length):
        col = 9 if i == 0 else 11 if i == length - 1 else 10
        mp.t("C", col, style, x + i, y); mp.t("C", col, style + 1, x + i, y + 1)
    cells = mp.rect(x, y, x + length - 1, y + 1)
    mp.want_solid |= cells; mp.solid |= cells
    return mp.rec("table_h", "table", cells, group, x=x, y=y, length=length, style=style)

def table_v(mp, x, y, length, group=None):
    """a long table down (C 8 rows 4..6, the middle repeated): x, y..y+length-1"""
    for i in range(length):
        row = 4 if i == 0 else 6 if i == length - 1 else 5
        mp.t("C", 8, row, x, y + i)
    cells = mp.rect(x, y, x, y + length - 1)
    mp.want_solid |= cells; mp.solid |= cells
    return mp.rec("table_v", "table", cells, group, x=x, y=y, length=length)

def table_sq(mp, x, y, style=4, group=None):
    """a square table 2x2 (C 12..13, rows style..style+1)"""
    mp.tiles("C", 12, style, 2, 2, x, y)
    cells = mp.rect(x, y, x + 1, y + 1)
    mp.want_solid |= cells; mp.solid |= cells
    return mp.rec("table_sq", "table", cells, group, x=x, y=y)

def round_table(mp, x, y, variant=(7, 11), group=None):
    """a round Shops table one cell wide: its top on y, legs on y+1 (both block)"""
    c, r = variant
    mp.tiles("E", c, r, 1, 2, x, y)
    cells = {(x, y), (x, y + 1)}
    mp.want_solid |= cells; mp.solid |= cells
    return mp.rec("round_table", "table", cells, group, x=x, y=y, variant=list(variant))

def bench_h(mp, x, y, group=None):
    mp.t("C", 14, 1, x, y); mp.t("C", 15, 1, x + 1, y)
    cells = {(x, y), (x + 1, y)}
    mp.want_solid |= cells; mp.solid |= cells
    return mp.rec("bench_h", "seat", cells, group, x=x, y=y)

def bench_v(mp, x, y, length, group=None):
    for i in range(length):
        row = 2 if i == 0 else 4 if i == length - 1 else 3
        mp.t("C", 14, row, x, y + i)
    cells = mp.rect(x, y, x, y + length - 1)
    mp.want_solid |= cells; mp.solid |= cells
    return mp.rec("bench_v", "seat", cells, group, x=x, y=y, length=length)

def chair(mp, x, y, facing, arm=False, group=None):
    """a chair on cell (x, y) (its back may reach the cell above, layer 3 - star in the new flags)"""
    r0 = 2 if arm else 0
    if facing == 2: mp.t("C", 8, r0, x, y - 1, z=3); mp.t("C", 8, r0 + 1, x, y)
    elif facing == 8: mp.t("C", 9, r0 + 1, x, y)
    elif facing == 4: mp.t("C", 10, r0, x, y - 1, z=3); mp.t("C", 10, r0 + 1, x, y)
    elif facing == 6: mp.t("C", 11, r0, x, y - 1, z=3); mp.t("C", 11, r0 + 1, x, y)
    mp.want_solid.add((x, y)); mp.solid.add((x, y))
    return mp.rec("chair", "seat", {(x, y)}, group, x=x, y=y, facing=facing)

def stool(mp, x, y, small=False, group=None):
    mp.t("C", 15 if small else 14, 3 if small else 0, x, y)
    mp.want_solid.add((x, y)); mp.solid.add((x, y))
    return mp.rec("stool", "seat", {(x, y)}, group, x=x, y=y)

def on_table(mp, x, y, sheet, c, r):
    """a Winlu small thing (a tile, layer 3) on a table / counter cell - must lie on the top (checked)"""
    mp.t(sheet, c, r, x, y, z=3)
    mp.rec("%s(%d,%d)" % (sheet, c, r), "tabletile", {(x, y)}, None, x=x, y=y, sheet=sheet, sc=c, sr=r)
